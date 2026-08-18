package main

// OpenCode Desktop Agent — escritorio remoto para OpenCode Mobile.
//
// Server HTTP (default :5901) con Basic auth que expone:
//   GET  /health                → {"status":"ok"}
//   GET  /info                  → resoluciones, monitores, lista de ventanas
//   GET  /stream?mode=screen|window&hwnd=&monitor=&w=&q=&fps= → MJPEG
//   POST /input                 → mouse/scroll/teclas/texto
//
// Config: desktop-agent.json (port/username/password) + flags que la pisan.
// Compilar:  go build -o desktop-agent.exe .

import (
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

type config struct {
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

const defaultConfigFile = "desktop-agent.json"

func loadConfig(path string) config {
	cfg := config{Port: 5901, Username: "opencode"}
	if data, err := os.ReadFile(path); err == nil {
		_ = json.Unmarshal(data, &cfg)
	}
	flagPort := flag.Int("port", cfg.Port, "listen port")
	flagUser := flag.String("user", cfg.Username, "basic auth username")
	flagPass := flag.String("pass", cfg.Password, "basic auth password (empty = no auth)")
	flag.Parse()
	if *flagPort != cfg.Port {
		cfg.Port = *flagPort
	}
	if *flagUser != "" {
		cfg.Username = *flagUser
	}
	if *flagPass != "" {
		cfg.Password = *flagPass
	}
	return cfg
}

type server struct {
	cfg      config
	capture  sync.Mutex
	lastFpMu sync.Mutex

	captureRectMu sync.Mutex
	captureRegion rect
}

// ===== Auth + CORS =====

func (s *server) authOK(r *http.Request) bool {
	if s.cfg.Password == "" {
		return true
	}
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Basic ") {
		return false
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(header, "Basic "))
	if err != nil {
		return false
	}
	parts := strings.SplitN(string(raw), ":", 2)
	if len(parts) != 2 {
		return false
	}
	userOK := subtle.ConstantTimeCompare([]byte(parts[0]), []byte(s.cfg.Username)) == 1
	passOK := subtle.ConstantTimeCompare([]byte(parts[1]), []byte(s.cfg.Password)) == 1
	return userOK && passOK
}

func (s *server) wrap(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Un panic en un handler (captura/input) NO debe tumbar el agente.
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("panic en %s: %v", r.URL.Path, rec)
				http.Error(w, `{"error":"internal"}`, http.StatusInternalServerError)
			}
		}()
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5901")
		w.Header().Set("Access-Control-Allow-Headers", "authorization, content-type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Cache-Control", "no-store")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if !s.authOK(r) {
			w.Header().Set("WWW-Authenticate", `Basic realm="opencode-desktop"`)
			http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// ===== Handlers =====

func (s *server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, map[string]any{"status": "ok", "version": "0.1.0"})
}

type windowInfo struct {
	Hwnd    uintptr `json:"hwnd"`
	Title   string  `json:"title"`
	Process string  `json:"process"`
	Pid     uint32  `json:"pid"`
	X       int32   `json:"x"`
	Y       int32   `json:"y"`
	W       int32   `json:"w"`
	H       int32   `json:"h"`
}

type monitorInfoOut struct {
	X       int32 `json:"x"`
	Y       int32 `json:"y"`
	W       int32 `json:"w"`
	H       int32 `json:"h"`
	Primary bool  `json:"primary"`
}

func (s *server) handleInfo(w http.ResponseWriter, _ *http.Request) {
	vd := virtualDesktop()
	monitors := enumMonitors()
	writeJSON(w, map[string]any{
		"width":    vd.width(),
		"height":   vd.height(),
		"monitors": monitors,
		"windows":  enumWindows(),
	})
}

func (s *server) handleStream(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	mode := q.Get("mode")
	if mode == "" {
		mode = "screen"
	}
	hwnd, _ := strconv.ParseUint(q.Get("hwnd"), 10, 64)
	monitor, _ := strconv.Atoi(q.Get("monitor"))
	width, _ := strconv.Atoi(q.Get("w"))
	quality, _ := strconv.Atoi(q.Get("q"))
	fps, _ := strconv.Atoi(q.Get("fps"))
	if quality < 1 || quality > 100 {
		quality = 55
	}
	if fps < 1 {
		fps = 10
	}
	if fps > 30 {
		fps = 30
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	const boundary = "ocd-frame"
	w.Header().Set("Content-Type", "multipart/x-mixed-replace; boundary="+boundary)

	frameCount := 0
	interval := time.Second / time.Duration(fps)
	lastSent := time.Time{}

	for {
		select {
		case <-r.Context().Done():
			return
		default:
		}

		start := time.Now()
		fr, err := s.captureFrame(mode, uintptr(hwnd), monitor)
		if err != nil {
			time.Sleep(200 * time.Millisecond)
			continue
		}
		s.captureRectMu.Lock()
		s.captureRegion = fr.Rect
		s.captureRectMu.Unlock()

		s.lastFpMu.Lock()
		changed := frameCount == 0 || hasChanged(fr.RGBA)
		s.lastFpMu.Unlock()

		// Frame inicial siempre + cambios; nunca inundar al cliente.
		now := time.Now()
		if changed && (frameCount == 0 || now.Sub(lastSent) >= interval) {
			img := scaleToWidth(fr.RGBA, width)
			data, err := encodeJPEG(img, quality)
			if err == nil {
				headers := fmt.Sprintf("--%s\r\nContent-Type: image/jpeg\r\nContent-Length: %d\r\n\r\n", boundary, len(data))
				if _, err := w.Write([]byte(headers)); err != nil {
					return
				}
				if _, err := w.Write(data); err != nil {
					return
				}
				if _, err := w.Write([]byte("\r\n")); err != nil {
					return
				}
				flusher.Flush()
				lastSent = now
			}
		}
		frameCount++

		elapsed := time.Since(start)
		if sleep := interval - elapsed; sleep > 0 {
			time.Sleep(sleep)
		}
	}
}

func (s *server) captureFrame(mode string, hwnd uintptr, monitor int) (*frame, error) {	s.capture.Lock()
	defer s.capture.Unlock()
	if mode == "window" && hwnd != 0 {
		return captureWindow(hwnd)
	}
	region := virtualDesktop()
	if monitors := enumMonitors(); monitor >= 0 && monitor < len(monitors) {
		m := monitors[monitor]
		region = rect{m.X, m.Y, m.X + m.W, m.Y + m.H}
	}
	return captureRect(region)
}

func (s *server) handleThumb(w http.ResponseWriter, r *http.Request) {
	// Miniaturas del selector: UN frame JPEG (no streaming) para no saturar
	// el agente con N streams simultáneos.
	q := r.URL.Query()
	hwnd, _ := strconv.ParseUint(q.Get("hwnd"), 10, 64)
	width, _ := strconv.Atoi(q.Get("w"))
	if width < 40 || width > 480 {
		width = 160
	}
	if hwnd == 0 {
		http.Error(w, `{"error":"hwnd required"}`, http.StatusBadRequest)
		return
	}
	fr, err := s.captureFrame("window", uintptr(hwnd), -1)
	if err != nil {
		http.Error(w, `{"error":"capture failed"}`, http.StatusInternalServerError)
		return
	}
	data, err := encodeJPEG(scaleToWidth(fr.RGBA, width), 35)
	if err != nil {
		http.Error(w, `{"error":"encode failed"}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "image/jpeg")
	_, _ = w.Write(data)
}

func (s *server) handleInput(w http.ResponseWriter, r *http.Request) {
	var msg inputMsg
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		http.Error(w, `{"error":"bad json"}`, http.StatusBadRequest)
		return
	}
	if err := s.handleInputMsg(msg); err != nil {
		http.Error(w, `{"error":"invalid input"}`, http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]any{"ok": true})
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

// ===== Enumeración de ventanas y monitores =====

func enumWindows() []windowInfo {
	r1, _, _ := procGetCurrentProcessId.Call()
	pid := uint32(r1)
	var out []windowInfo
	cb := syscall.NewCallback(func(hwnd uintptr, _ uintptr) uintptr {
		if !isVisibleTopLevel(hwnd) {
			return 1
		}
		var wr rect
		if r, _, _ := procGetWindowRect.Call(hwnd, uintptr(unsafe.Pointer(&wr))); r == 0 {
			return 1
		}
		if wr.width() <= 0 || wr.height() <= 0 {
			return 1
		}
		winPid := uint32(0)
		procGetWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&winPid)))
		if winPid == pid {
			return 1
		}
		title := windowTitle(hwnd)
		if title == "" {
			return 1
		}
		out = append(out, windowInfo{
			Hwnd:    hwnd,
			Title:   title,
			Process: processName(winPid),
			Pid:     winPid,
			X:       wr.Left,
			Y:       wr.Top,
			W:       wr.width(),
			H:       wr.height(),
		})
		return 1
	})
	procEnumWindows.Call(cb, 0)
	if len(out) > 40 {
		out = out[:40]
	}
	return out
}

func isVisibleTopLevel(hwnd uintptr) bool {
	// Saltar toolwindows y ventanas sin dueño visible.
	if hwnd == 0 {
		return false
	}
	r, _, _ := procIsWindowVisible.Call(hwnd)
	return r != 0
}

func windowTitle(hwnd uintptr) string {
	n, _, _ := procGetWindowTextLengthW.Call(hwnd)
	if n == 0 {
		return ""
	}
	buf := make([]uint16, int(n)+1)
	procGetWindowTextW.Call(hwnd, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	return strings.TrimSpace(utf16ToString(buf))
}

func processName(pid uint32) string {
	// PROCESS_QUERY_LIMITED_INFORMATION
	handle, _, _ := procOpenProcess.Call(0x1000, 0, uintptr(pid))
	if handle == 0 {
		return ""
	}
	defer procCloseHandle.Call(handle)
	buf := make([]uint16, 260)
	procGetModuleBaseNameW.Call(handle, 0, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	name := utf16ToString(buf)
	if ext := strings.LastIndex(name, ".exe"); ext > 0 {
		name = name[:ext]
	}
	return name
}

func utf16ToString(buf []uint16) string {
	var sb strings.Builder
	for _, u := range buf {
		if u == 0 {
			break
		}
		sb.WriteRune(rune(u))
	}
	return sb.String()
}

func enumMonitors() []monitorInfoOut {
	var out []monitorInfoOut
	cb := syscall.NewCallback(func(hMonitor uintptr, _ uintptr, _ uintptr, _ uintptr) uintptr {
		mi := monitorInfo{CbSize: uint32(unsafe.Sizeof(monitorInfo{}))}
		if r, _, _ := procGetMonitorInfoW.Call(hMonitor, uintptr(unsafe.Pointer(&mi))); r != 0 {
			out = append(out, monitorInfoOut{
				X:       mi.RcMonitor.Left,
				Y:       mi.RcMonitor.Top,
				W:       mi.RcMonitor.width(),
				H:       mi.RcMonitor.height(),
				Primary: mi.DwFlags&monitorInfoFPrimary != 0,
			})
		}
		return 1
	})
	procEnumDisplayMonitors.Call(0, 0, cb, 0)
	return out
}

// Proxy de la API pública de OpenCode Go (https://opencode.ai/zen/go/v1/usage):
// el navegador/WebView no puede consultarla directo por CORS, el agente sí
// (Go no aplica CORS). La key va en el BODY (POST {"key": "..."}) — nunca en
// la URL: un query string quedaría en logs/proxies/historial. Se acepta GET
// ?key= solo por compatibilidad con clientes viejos.
func (s *server) handleGoUsage(w http.ResponseWriter, r *http.Request) {
	var key string
	if r.Method == http.MethodPost {
		var payload struct {
			Key string `json:"key"`
		}
		body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
		if err := json.Unmarshal(body, &payload); err == nil {
			key = payload.Key
		}
	} else {
		key = r.URL.Query().Get("key")
	}
	if key == "" {
		http.Error(w, `{"error":"missing key"}`, http.StatusBadRequest)
		return
	}
	client := &http.Client{Timeout: 15 * time.Second}
	req, err := http.NewRequest(http.MethodGet, "https://opencode.ai/zen/go/v1/usage", nil)
	if err != nil {
		http.Error(w, `{"error":"bad request"}`, http.StatusBadGateway)
		return
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, `{"error":"upstream"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, `{"error":"read"}`, http.StatusBadGateway)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func main() {
	procSetProcessDPIAware.Call()
	cfg := loadConfig(defaultConfigFile)
	s := &server{cfg: cfg}

	mux := http.NewServeMux()
	mux.HandleFunc("/health", s.wrap(s.handleHealth))
	mux.HandleFunc("/info", s.wrap(s.handleInfo))
	mux.HandleFunc("/stream", s.wrap(s.handleStream))
	mux.HandleFunc("/thumb", s.wrap(s.handleThumb))
	mux.HandleFunc("/input", s.wrap(s.handleInput))
	mux.HandleFunc("/gousage", s.wrap(s.handleGoUsage))

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("opencode desktop agent 0.1.0 — http://0.0.0.0:%d (auth: %s)", cfg.Port, map[bool]string{true: "basic", false: "none"}[cfg.Password != ""])
	// Single-instance: si el puerto ya está ocupado (otra instancia corriendo),
	// salir en silencio — el auto-start + doble clic nunca debe duplicar.
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		log.Printf("puerto %d ocupado — el agente ya está corriendo", cfg.Port)
		return
	}
	if err := http.Serve(ln, mux); err != nil {
		log.Fatal(err)
	}
}
