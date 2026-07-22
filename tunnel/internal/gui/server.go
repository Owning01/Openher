package gui

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"sync"
	"time"

	"github.com/owning01/opencode-mobile/tunnel/internal/autostart"
	"github.com/owning01/opencode-mobile/tunnel/internal/config"
	"github.com/owning01/opencode-mobile/tunnel/internal/discovery"
	"github.com/owning01/opencode-mobile/tunnel/internal/signaling"
	"github.com/owning01/opencode-mobile/tunnel/internal/transport"
)

//go:embed static
var staticFS embed.FS

type Server struct {
	cfg     *config.TunnelConfig
	disc    *discovery.Discovery
	mu      sync.Mutex
	port    int

	tunnelCancel context.CancelFunc
	tunnelConn   *transport.WebRTCTransport
	tunnelSig    *signaling.Client
	tunnelID     string
	tunnelStatus string

	serverStatus string
	serverPort   int
	serverBin    string
	serverVer    string

	logLines []string

	statusSubs map[chan StatusMsg]bool
}

type StatusMsg struct {
	Type     string `json:"type"`
	Message  string `json:"message,omitempty"`
	Tunnel   string `json:"tunnel,omitempty"`
	Server   string `json:"server,omitempty"`
	Bin      string `json:"bin,omitempty"`
	Version  string `json:"version,omitempty"`
	Port     int    `json:"port,omitempty"`
	TunnelID string `json:"tunnelId,omitempty"`
	ConfigName string `json:"configName,omitempty"`
	ConfigHost string `json:"configHost,omitempty"`
}

func New(cfg *config.TunnelConfig) *Server {
	disc := discovery.New()
	if cfg.BinPath != "" {
		disc.SetCustomBinPath(cfg.BinPath)
	}
	return &Server{
		cfg:        cfg,
		disc:       disc,
		statusSubs: make(map[chan StatusMsg]bool),
	}
}

func (s *Server) Start() error {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	s.port = ln.(*net.TCPListener).Addr().(*net.TCPAddr).Port

	mux := http.NewServeMux()
	mux.HandleFunc("/", s.handleIndex)
	mux.HandleFunc("/api/status", s.handleStatus)
	mux.HandleFunc("/api/discover", s.handleDiscover)
	mux.HandleFunc("/api/start-server", s.handleStartServer)
	mux.HandleFunc("/api/tunnel/connect", s.handleTunnelConnect)
	mux.HandleFunc("/api/tunnel/disconnect", s.handleTunnelDisconnect)
	mux.HandleFunc("/api/save", s.handleSave)
	mux.HandleFunc("/api/autostart", s.handleAutostart)
	mux.HandleFunc("/api/select-bin", s.handleSelectBin)
	mux.HandleFunc("/api/log", s.handleLogSSE)

	log.Printf("[gui] Server started on http://127.0.0.1:%d", s.port)
	s.log("Interfaz web: http://127.0.0.1:" + strconv.Itoa(s.port))

	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(fmt.Sprintf("http://127.0.0.1:%d", s.port))
	}()

	return http.Serve(ln, mux)
}

func (s *Server) Port() int { return s.port }

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	data, err := fs.ReadFile(staticFS, "static/index.html")
	if err != nil {
		http.Error(w, "page not found", 500)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(data)
}

func (s *Server) handleStatus(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	status := StatusMsg{
		Type:       "status",
		Server:     s.serverStatus,
		Bin:        s.serverBin,
		Version:    s.serverVer,
		Port:       s.serverPort,
		Tunnel:     s.tunnelStatus,
		TunnelID:   s.tunnelID,
		ConfigName: s.cfg.Name,
		ConfigHost: s.cfg.ServerHost,
	}
	s.mu.Unlock()
	writeJSON(w, status)
}

func (s *Server) handleDiscover(w http.ResponseWriter, r *http.Request) {
	s.log("Descubriendo servidor opencode...")
	result := s.disc.Discover()

	s.mu.Lock()
	if result.Running {
		s.serverStatus = "running"
		s.serverPort = result.RunningPort
		s.serverVer = result.Version
		s.serverBin = result.BinPath
		s.log("Servidor corriendo en puerto " + strconv.Itoa(result.RunningPort))
	} else if result.Found && result.BinPath != "" {
		s.serverStatus = "stopped"
		s.serverBin = result.BinPath
		s.serverVer = result.Version
		s.log("Servidor encontrado: " + result.BinPath)
	} else {
		s.serverStatus = "notfound"
		s.serverBin = ""
		s.log("Servidor no encontrado")
	}
	s.mu.Unlock()

	writeJSON(w, map[string]interface{}{
		"found":   result.Found,
		"running": result.Running,
		"port":    result.RunningPort,
		"bin":     result.BinPath,
		"version": result.Version,
		"error":   result.Error,
	})
}

func (s *Server) handleStartServer(w http.ResponseWriter, r *http.Request) {
	portStr := r.FormValue("port")
	port := 3000
	if portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil && p > 0 {
			port = p
		}
	}

	s.log("Iniciando servidor en puerto " + strconv.Itoa(port) + "...")
	if err := s.disc.StartServer(port); err != nil {
		s.log("Error: " + err.Error())
		writeJSON(w, map[string]interface{}{"ok": false, "error": err.Error()})
		return
	}

	s.mu.Lock()
	s.serverStatus = "running"
	s.serverPort = port
	s.mu.Unlock()

	s.log("Servidor iniciado en puerto " + strconv.Itoa(port))
	writeJSON(w, map[string]interface{}{"ok": true, "port": port})
}

func (s *Server) handleTunnelConnect(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string `json:"name"`
		Password     string `json:"password"`
		SignalingURL string `json:"signalingUrl"`
		Host         string `json:"host"`
		Port         int    `json:"port"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "invalid JSON"})
		return
	}

	if req.Name == "" || req.Password == "" {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "Nombre y contraseña requeridos"})
		return
	}

	s.mu.Lock()
	s.tunnelStatus = "connecting"
	s.cfg.Name = req.Name
	s.cfg.Password = req.Password
	if req.SignalingURL != "" {
		s.cfg.SignalingURL = req.SignalingURL
	}
	if req.Host != "" {
		s.cfg.ServerHost = req.Host
	}
	if req.Port > 0 {
		s.cfg.ServerPort = req.Port
	}
	s.mu.Unlock()

	s.log("Conectando túnel como '" + req.Name + "'...")

	go func() {
		targetURL := s.cfg.ServerHost + ":" + strconv.Itoa(s.cfg.ServerPort)
		if s.cfg.ServerHost == "127.0.0.1" || s.cfg.ServerHost == "localhost" {
			targetURL = "http://" + targetURL
		} else {
			targetURL = "http://" + targetURL
		}

		transp := transport.New(targetURL)
		transp.OnClosed(func() {
			s.mu.Lock()
			s.tunnelStatus = "disconnected"
			s.mu.Unlock()
			s.log("Túnel desconectado")
		})

		ctx, cancel := context.WithCancel(context.Background())
		s.mu.Lock()
		s.tunnelCancel = cancel
		s.tunnelConn = transp
		s.mu.Unlock()

		sig := signaling.New(s.cfg.SignalingURL, req.Name, req.Password)
		if err := sig.Connect(s.cfg.SignalingURL, req.Name, req.Password); err != nil {
			s.log("Error señalización: " + err.Error())
			s.mu.Lock()
			s.tunnelStatus = "error"
			s.mu.Unlock()
			return
		}

		s.mu.Lock()
		s.tunnelID = sig.TunnelID()
		s.tunnelSig = sig
		s.mu.Unlock()
		s.log("Túnel ID: " + sig.TunnelID())

		sig.Listen(
			func(sessionID string) {
				s.log("Cliente conectándose (sesión " + sessionID + ")")
				offerSDP, err := transp.CreateOffer()
				if err != nil {
					s.log("Error oferta: " + err.Error())
					return
				}
				sig.SendSignal(sessionID, offerSDP, "")
			},
			func(msg signaling.Message) {
				if msg.SDP != "" {
					if err := transp.SetRemoteSDP(msg.SDP); err != nil {
						s.log("Error SDP: " + err.Error())
					} else {
						s.mu.Lock()
						s.tunnelStatus = "connected"
						s.mu.Unlock()
						s.log("Cliente conectado vía túnel")
					}
				}
			},
			func(errMsg string) {
				s.log("Error señalización: " + errMsg)
			},
			func() {
				s.log("Señalización desconectada")
			},
		)

		<-ctx.Done()
	}()

	writeJSON(w, map[string]interface{}{"ok": true})
}

func (s *Server) handleTunnelDisconnect(w http.ResponseWriter, r *http.Request) {
	s.log("Desconectando túnel...")
	s.mu.Lock()
	if s.tunnelCancel != nil {
		s.tunnelCancel()
		s.tunnelCancel = nil
	}
	if s.tunnelConn != nil {
		s.tunnelConn.Close()
		s.tunnelConn = nil
	}
	if s.tunnelSig != nil {
		s.tunnelSig.Close()
		s.tunnelSig = nil
	}
	s.tunnelStatus = "disconnected"
	s.tunnelID = ""
	s.mu.Unlock()
	s.log("Túnel desconectado")
	writeJSON(w, map[string]interface{}{"ok": true})
}

func (s *Server) handleSave(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string `json:"name"`
		Password     string `json:"password"`
		SignalingURL string `json:"signalingUrl"`
		Host         string `json:"host"`
		Port         int    `json:"port"`
		BinPath      string `json:"binPath"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "invalid JSON"})
		return
	}

	s.mu.Lock()
	s.cfg.Name = req.Name
	s.cfg.Password = req.Password
	if req.SignalingURL != "" {
		s.cfg.SignalingURL = req.SignalingURL
	}
	if req.Host != "" {
		s.cfg.ServerHost = req.Host
	}
	if req.Port > 0 {
		s.cfg.ServerPort = req.Port
	}
	if req.BinPath != "" {
		s.cfg.BinPath = req.BinPath
		s.disc.SetCustomBinPath(req.BinPath)
	}
	cfg := *s.cfg
	s.mu.Unlock()

	if err := config.Save(&cfg); err != nil {
		s.log("Error al guardar: " + err.Error())
		writeJSON(w, map[string]interface{}{"ok": false, "error": err.Error()})
		return
	}
	s.log("Configuración guardada")
	writeJSON(w, map[string]interface{}{"ok": true})
}

func (s *Server) handleAutostart(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "invalid JSON"})
		return
	}

	if err := autostart.SetEnabled(req.Enabled); err != nil {
		s.log("Error auto-inicio: " + err.Error())
		writeJSON(w, map[string]interface{}{"ok": false, "error": err.Error()})
		return
	}

	if req.Enabled {
		s.log("Auto-inicio activado")
	} else {
		s.log("Auto-inicio desactivado")
	}
	writeJSON(w, map[string]interface{}{"ok": true, "enabled": autostart.IsEnabled()})
}

func (s *Server) handleSelectBin(w http.ResponseWriter, r *http.Request) {
	path := r.FormValue("path")
	if path == "" {
		writeJSON(w, map[string]interface{}{"ok": false, "error": "path required"})
		return
	}
	s.disc.SetCustomBinPath(path)
	s.log("Binario seleccionado: " + path)
	writeJSON(w, map[string]interface{}{"ok": true})
}

func (s *Server) handleLogSSE(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", 500)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	ch := make(chan StatusMsg, 100)
	s.mu.Lock()
	s.statusSubs[ch] = true
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		delete(s.statusSubs, ch)
		s.mu.Unlock()
	}()

	for msg := range ch {
		data, _ := json.Marshal(msg)
		fmt.Fprintf(w, "data: %s\n\n", data)
		flusher.Flush()
	}
}

func (s *Server) log(format string, args ...interface{}) {
	msg := time.Now().Format("15:04:05") + " " + fmt.Sprintf(format, args...)
	s.mu.Lock()
	s.logLines = append(s.logLines, msg)
	if len(s.logLines) > 500 {
		s.logLines = s.logLines[len(s.logLines)-500:]
	}
	for ch := range s.statusSubs {
		select {
		case ch <- StatusMsg{Type: "log", Message: msg}:
		default:
		}
	}
	s.mu.Unlock()
	log.Println(msg)
}

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func openBrowser(url string) {
	switch runtime.GOOS {
	case "windows":
		exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "linux":
		exec.Command("xdg-open", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	}
}
