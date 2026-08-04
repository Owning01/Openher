package main

import (
	"bytes"
	"context"
	"fmt"
	"image"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/lxn/walk"
	. "github.com/lxn/walk/declarative"
	"github.com/owning01/opencode-mobile/tunnel/internal/config"
	"github.com/owning01/opencode-mobile/tunnel/internal/discovery"
	"github.com/owning01/opencode-mobile/tunnel/internal/proxy"
	"github.com/owning01/opencode-mobile/tunnel/internal/signaling"
	"github.com/owning01/opencode-mobile/tunnel/internal/transport"
	"github.com/skip2/go-qrcode"
)

type TunnelApp struct {
	mw          *walk.MainWindow
	nameEdit    *walk.LineEdit
	passEdit    *walk.LineEdit
	hostEdit    *walk.LineEdit
	portEdit    *walk.LineEdit
	connectBtn  *walk.PushButton
	disconnBtn  *walk.PushButton
	logEdit     *walk.TextEdit
	qrView      *walk.ImageView
	statusItem  *walk.StatusBarItem

	mu          sync.Mutex
	cfg         *config.TunnelConfig
	cancel      context.CancelFunc
	transp      *transport.WebRTCTransport
	sig         *signaling.Client
	tunnelID    string
	tunnelState string
}

func (a *TunnelApp) logf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	if a.mw != nil {
		a.mw.Synchronize(func() {
			if a.logEdit != nil {
				a.logEdit.AppendText("[" + time.Now().Format("15:04:05") + "] " + msg + "\n")
			}
		})
	}
	fmt.Println(msg)
}

func (a *TunnelApp) setStatus(text string) {
	if a.mw != nil {
		a.mw.Synchronize(func() {
			if a.statusItem != nil {
				a.statusItem.SetText(" " + text + " ")
			}
		})
	}
}

func (a *TunnelApp) toggleButtons(connecting bool) {
	if a.mw != nil {
		a.mw.Synchronize(func() {
			a.connectBtn.SetEnabled(!connecting)
			a.disconnBtn.SetEnabled(connecting)
		})
	}
}

func (a *TunnelApp) showQR(tunnelID, name string) {
	data := fmt.Sprintf("opencode://tunnel?id=%s&name=%s", tunnelID, name)
	pngBytes, err := qrcode.Encode(data, qrcode.Medium, 220)
	if err != nil {
		a.logf("QR error: %v", err)
		return
	}
	img, _, err := image.Decode(bytes.NewReader(pngBytes))
	if err != nil {
		a.logf("QR decode error: %v", err)
		return
	}
	bmp, err := walk.NewBitmapFromImage(img)
	if err != nil {
		a.logf("QR bitmap error: %v", err)
		return
	}
	if a.mw != nil {
		a.mw.Synchronize(func() {
			if a.qrView != nil {
				a.qrView.SetImage(bmp)
			}
		})
	}
	a.logf("Escaneá el QR con OpenCode Mobile (o usá nombre/contraseña)")
}

func (a *TunnelApp) connect() {
	name := a.nameEdit.Text()
	password := a.passEdit.Text()
	host := a.hostEdit.Text()
	portStr := a.portEdit.Text()

	if name == "" || password == "" {
		walk.MsgBox(a.mw, "OpenCode Tunnel", "Nombre y contraseña son obligatorios.", walk.MsgBoxIconError)
		return
	}
	port := 3000
	if portStr != "" {
		if p, err := strconv.Atoi(portStr); err == nil && p > 0 && p <= 65535 {
			port = p
		} else {
			walk.MsgBox(a.mw, "OpenCode Tunnel", "Puerto inválido (1-65535).", walk.MsgBoxIconError)
			return
		}
	}
	if host == "" {
		host = "127.0.0.1"
	}

	a.mu.Lock()
	a.cfg.Name = name
	a.cfg.Password = password
	a.cfg.ServerHost = host
	a.cfg.ServerPort = port
	cfgCopy := *a.cfg
	a.mu.Unlock()

	if err := config.Save(&cfgCopy); err != nil {
		a.logf("No se pudo guardar la configuración: %v", err)
	}

	a.toggleButtons(true)
	a.setStatus("Conectando...")

	go a.runTunnel(cfgCopy)
}

func (a *TunnelApp) runTunnel(cfg config.TunnelConfig) {
	disc := discovery.New()

	a.logf("Buscando servidor opencode en %s:%d...", cfg.ServerHost, cfg.ServerPort)
	result := disc.Discover()

	if result.Running {
		cfg.ServerPort = result.RunningPort
		a.logf("Servidor opencode detectado: puerto %d (versión %s)", result.RunningPort, result.Version)
	} else if result.Found && result.BinPath != "" {
		a.logf("Servidor opencode encontrado: %s — iniciando...", result.BinPath)
		if err := disc.StartServer(cfg.ServerPort); err != nil {
			a.logf("Error iniciando servidor: %v", err)
			a.setStatus("Error al iniciar servidor")
			a.toggleButtons(false)
			return
		}
		a.logf("Servidor iniciado en puerto %d", cfg.ServerPort)
	} else {
		a.logf("No se encontró opencode. Verificá que esté instalado o ya corriendo.")
		a.logf("Se conectará el túnel igual, apuntando a %s:%d", cfg.ServerHost, cfg.ServerPort)
	}

	params := proxy.Params{
		SignalingURL: cfg.SignalingURL,
		Name:         cfg.Name,
		Password:     cfg.Password,
		TargetHost:   cfg.ServerHost,
		TargetPort:   cfg.ServerPort,
	}
	if err := params.Validate(); err != nil {
		a.logf("Configuración inválida: %v", err)
		a.setStatus("Configuración inválida")
		a.toggleButtons(false)
		return
	}

	targetURL := fmt.Sprintf("http://%s:%d", cfg.ServerHost, cfg.ServerPort)
	transp := transport.New(targetURL)
	if len(cfg.ICEServers) > 0 {
		servers := make([]transport.ICEServer, 0, len(cfg.ICEServers))
		for _, s := range cfg.ICEServers {
			servers = append(servers, transport.ICEServer{URLs: s.URLs, Username: s.Username, Credential: s.Credential})
		}
		transp.SetICEServers(servers)
	}
	transp.OnClosed(func() {
		a.mu.Lock()
		a.tunnelState = "disconnected"
		a.mu.Unlock()
		a.setStatus("Desconectado")
		a.logf("Túnel desconectado")
	})

	ctx, cancel := context.WithCancel(context.Background())
	a.mu.Lock()
	a.cancel = cancel
	a.transp = transp
	a.mu.Unlock()

	sig := signaling.New(cfg.SignalingURL, cfg.Name, cfg.Password)
	if err := sig.Connect(cfg.SignalingURL, cfg.Name, cfg.Password); err != nil {
		a.logf("Error conectando al servidor de señalización: %v", err)
		a.logf("Verificá tu conexión a internet (el túnel necesita Cloudflare Workers).")
		a.setStatus("Error de señalización")
		a.toggleButtons(false)
		return
	}

	a.mu.Lock()
	a.tunnelID = sig.TunnelID()
	a.sig = sig
	a.mu.Unlock()

	a.logf("Túnel activo — ID: %s", sig.TunnelID())
	a.setStatus("Túnel activo: " + sig.TunnelID())
	a.showQR(sig.TunnelID(), cfg.Name)

	sig.Listen(
		func(sessionID string) {
			a.logf("Cliente conectándose (sesión %s)", sessionID)
			offerSDP, err := transp.CreateOffer()
			if err != nil {
				a.logf("Error creando oferta: %v", err)
				return
			}
			sig.SendSignal(sessionID, offerSDP, "")
		},
		func(msg signaling.Message) {
			if msg.SDP != "" {
				if err := transp.SetRemoteSDP(msg.SDP); err != nil {
					a.logf("Error SDP: %v", err)
				} else {
					a.mu.Lock()
					a.tunnelState = "connected"
					a.mu.Unlock()
					a.setStatus("Cliente conectado")
					a.logf("Cliente conectado vía túnel WebRTC")
				}
			}
		},
		func(errMsg string) {
			a.logf("Error señalización: %s", errMsg)
		},
		func() {
			a.logf("Señalización desconectada")
			a.mu.Lock()
			a.tunnelState = "disconnected"
			a.mu.Unlock()
			a.setStatus("Desconectado")
			a.toggleButtons(false)
		},
	)

	<-ctx.Done()
	a.logf("Túnel detenido")
	a.toggleButtons(false)
}

func (a *TunnelApp) disconnect() {
	a.mu.Lock()
	if a.cancel != nil {
		a.cancel()
	}
	if a.transp != nil {
		a.transp.Close()
	}
	if a.sig != nil {
		a.sig.Close()
	}
	a.tunnelState = "disconnected"
	a.mu.Unlock()
	a.setStatus("Desconectado")
	a.toggleButtons(false)
}

func (a *TunnelApp) loadConfig() {
	cfg := config.Load()
	a.mu.Lock()
	a.cfg = cfg
	a.mu.Unlock()

	a.nameEdit.SetText(cfg.Name)
	a.passEdit.SetText(cfg.Password)
	a.hostEdit.SetText(cfg.ServerHost)
	if cfg.ServerPort > 0 {
		a.portEdit.SetText(strconv.Itoa(cfg.ServerPort))
	} else {
		a.portEdit.SetText("3000")
	}
}

func main() {
	app := &TunnelApp{}

	var mw *walk.MainWindow
	window := MainWindow{
		Title:   "OpenCode Tunnel — Conexión remota",
		MinSize: Size{Width: 460, Height: 640},
		Layout:  VBox{Spacing: 8},
		Children: []Widget{
			Composite{
				Layout: Grid{Columns: 2, Spacing: 6},
				Children: []Widget{
					Label{Text: "Nombre del túnel:"},
					LineEdit{AssignTo: &app.nameEdit},
					Label{Text: "Contraseña:"},
					LineEdit{AssignTo: &app.passEdit, PasswordMode: true},
					Label{Text: "IP del server opencode (opcional):"},
					LineEdit{AssignTo: &app.hostEdit, Text: "127.0.0.1"},
					Label{Text: "Puerto (opcional):"},
					LineEdit{AssignTo: &app.portEdit, Text: "3000"},
				},
			},
			Composite{
				Layout: HBox{},
				Children: []Widget{
					PushButton{AssignTo: &app.connectBtn, Text: "Conectar", OnClicked: app.connect},
					PushButton{AssignTo: &app.disconnBtn, Text: "Desconectar", OnClicked: app.disconnect, Enabled: false},
				},
			},
			TextEdit{AssignTo: &app.logEdit, ReadOnly: true, VScroll: true, MinSize: Size{Width: 0, Height: 200}},
			Composite{
				Layout: HBox{Alignment: AlignHCenterVCenter},
				Children: []Widget{
					ImageView{AssignTo: &app.qrView, MinSize: Size{Width: 240, Height: 240}, Background: SolidColorBrush{Color: walk.RGB(255, 255, 255)}},
				},
			},
		},
		StatusBarItems: []StatusBarItem{
			{AssignTo: &app.statusItem, Text: " Desconectado "},
		},
		AssignTo: &mw,
	}

	if err := window.Create(); err != nil {
		log.Fatal(err)
		os.Exit(1)
	}

	app.mw = mw
	mw.Closing().Attach(func(canceled *bool, reason walk.CloseReason) {
		app.disconnect()
	})
	app.loadConfig()
	app.setStatus("Desconectado")

	code := mw.Run()
	_ = code
}
