package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/owning01/opencode-mobile/tunnel/internal/autostart"
	"github.com/owning01/opencode-mobile/tunnel/internal/config"
	"github.com/owning01/opencode-mobile/tunnel/internal/gui"
)

func main() {
	log.SetFlags(log.Ltime | log.Lshortfile)

	cfg := config.Load()

	isAutoStart := len(os.Args) > 1 && os.Args[1] == "-autostart"

	server := gui.New(cfg)

	go func() {
		if err := server.Start(); err != nil {
			fmt.Fprintf(os.Stderr, "GUI server error: %v\n", err)
			os.Exit(1)
		}
	}()

	port := server.Port()
	fmt.Printf("\n")
	fmt.Printf("  ╔══════════════════════════════════════════╗\n")
	fmt.Printf("  ║        OpenCode Tunnel v0.1              ║\n")
	fmt.Printf("  ╚══════════════════════════════════════════╝\n")
	fmt.Printf("\n")
	fmt.Printf("  Interfaz web: http://127.0.0.1:%d\n", port)
	fmt.Printf("  Cierra esta ventana para detener el túnel.\n")
	fmt.Printf("\n")

	if isAutoStart {
		fmt.Printf("  Iniciado con auto-inicio (minimizado).\n")
		fmt.Printf("  Abre http://127.0.0.1:%d en tu navegador.\n", port)
	}

	if autostart.IsEnabled() {
		fmt.Printf("  Auto-inicio: activado\n")
	}

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	<-sigCh

	fmt.Println("\nDeteniendo...")
}
