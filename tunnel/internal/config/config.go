package config

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/owning01/opencode-mobile/tunnel/internal/security"
)

type TunnelConfig struct {
	Name         string `json:"name"`
	Password     string `json:"password"`
	SignalingURL string `json:"signaling_url"`
	ServerHost   string `json:"server_host"`
	ServerPort   int    `json:"server_port"`
	AutoStart    bool   `json:"auto_start"`
	BinPath      string `json:"bin_path"`
	Language     string `json:"language"`
}

var (
	encrypter *security.Encrypter
	configDir string
	configPath string
)

func init() {
	home, err := os.UserHomeDir()
	if err != nil {
		home = "."
	}
	configDir = filepath.Join(home, ".opencode")
	configPath = filepath.Join(configDir, "tunnel-config.enc")
	SetMachineID("")
}

func SetMachineID(mid string) {
	if mid == "" {
		mid = security.MachineID()
	}
	if mid == "" {
		mid = "opencode-fallback-key"
	}
	encrypter = security.NewEncrypter(mid)
}

func Defaults() TunnelConfig {
	return TunnelConfig{
		ServerHost:   "127.0.0.1",
		ServerPort:   3000,
		SignalingURL: "wss://opencode-tunnel-signaling.owning01.workers.dev/signal",
		Language:     "es",
	}
}

func Load() *TunnelConfig {
	cfg := Defaults()

	data, err := os.ReadFile(configPath)
	if err != nil {
		return &cfg
	}

	decoded, err := encrypter.Decrypt(string(data))
	if err != nil {
		log.Printf("[config] decrypt error: %v, using defaults", err)
		return &cfg
	}

	if err := json.Unmarshal(decoded, &cfg); err != nil {
		log.Printf("[config] parse error: %v, using defaults", err)
		return &cfg
	}

	return &cfg
}

func Save(cfg *TunnelConfig) error {
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("mkdir config dir: %w", err)
	}

	data, err := json.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	encoded, err := encrypter.Encrypt(data)
	if err != nil {
		return fmt.Errorf("encrypt: %w", err)
	}

	if err := os.WriteFile(configPath, []byte(encoded), 0600); err != nil {
		return fmt.Errorf("write: %w", err)
	}

	return nil
}

func Path() string {
	return configPath
}
