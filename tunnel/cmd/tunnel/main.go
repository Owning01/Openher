package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/owning01/opencode-mobile/tunnel/internal/proxy"
	"github.com/owning01/opencode-mobile/tunnel/internal/signaling"
	"github.com/owning01/opencode-mobile/tunnel/internal/transport"
	"github.com/skip2/go-qrcode"
)

const DefaultSignalingURL = "wss://opencode-tunnel-signaling.owning01.workers.dev/signal"

func main() {
	name := flag.String("name", "", "Server name (required)")
	password := flag.String("password", "", "Server password (required)")
	signalingURL := flag.String("signaling", DefaultSignalingURL, "Signaling server WebSocket URL")
	host := flag.String("host", "127.0.0.1", "OpenCode server host")
	port := flag.Int("port", 3000, "OpenCode server port")
	qr := flag.Bool("qr", true, "Show QR code")
	flag.Parse()

	params := proxy.Params{
		SignalingURL: *signalingURL,
		Name:         *name,
		Password:     *password,
		TargetHost:   *host,
		TargetPort:   *port,
		QRCode:       *qr,
	}

	if err := params.Validate(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		fmt.Fprintln(os.Stderr, "Usage: opencode-tunnel --name <name> --password <password> [--port 3000]")
		flag.PrintDefaults()
		os.Exit(1)
	}

	cfg := proxy.NewConfig(*host, *port)
	fmt.Println("╔══════════════════════════════════════════════╗")
	fmt.Println("║        OpenCode Remote Tunnel v0.1          ║")
	fmt.Println("╚══════════════════════════════════════════════╝")
	fmt.Printf("  Server:       %s\n", cfg.TargetURL())
	fmt.Printf("  Signaling:    %s\n", params.SignalingURL)
	fmt.Printf("  Name:         %s\n", params.Name)

	transp := transport.New(cfg.TargetURL())

	sig := signaling.New(params.SignalingURL, params.Name, params.Password)
	if err := sig.Connect(params.SignalingURL, params.Name, params.Password); err != nil {
		log.Fatalf("Failed to connect to signaling: %v", err)
	}

	fmt.Printf("  Tunnel ID:    %s\n", sig.TunnelID())

	if params.QRCode {
		qrData := fmt.Sprintf("opencode://tunnel?id=%s&name=%s", sig.TunnelID(), params.Name)
		qrCode, err := qrcode.New(qrData, qrcode.Medium)
		if err == nil {
			fmt.Println("\n  QR Code (scan with OpenCode Mobile):")
			fmt.Println(qrCode.ToString(true))
		}
	}

	transp.OnClosed(func() {
		log.Println("WebRTC connection closed")
	})

	sig.Listen(
		func(sessionID string) {
			log.Printf("Client connecting (session=%s)", sessionID)

			offerSDP, err := transp.CreateOffer()
			if err != nil {
				log.Printf("Failed to create offer: %v", err)
				return
			}

			sig.SendSignal(sessionID, offerSDP, "")
		},
		func(msg signaling.Message) {
			if msg.SDP != "" {
				if err := transp.SetRemoteSDP(msg.SDP); err != nil {
					log.Printf("Failed to set remote SDP: %v", err)
				} else {
					log.Println("WebRTC connection established!")
				}
			}
		},
		func(errMsg string) {
			log.Printf("Signaling error: %s", errMsg)
		},
		func() {
			log.Println("Signaling connection closed")
		},
	)

	fmt.Println("\n  Waiting for remote connection...")
	fmt.Println("  Press Ctrl+C to stop")

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	fmt.Println("\nShutting down...")
	transp.Close()
	sig.Close()
}
