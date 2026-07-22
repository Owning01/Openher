package proxy

import (
	"fmt"
	"log"
	"net/url"
)

type Config struct {
	TargetHost string
	TargetPort int
}

func (c Config) TargetURL() string {
	return fmt.Sprintf("http://%s:%d", c.TargetHost, c.TargetPort)
}

func (c Config) Validate() error {
	if c.TargetHost == "" {
		return fmt.Errorf("target host is required")
	}
	if c.TargetPort < 1 || c.TargetPort > 65535 {
		return fmt.Errorf("invalid port: %d", c.TargetPort)
	}
	return nil
}

func NewConfig(host string, port int) Config {
	if host == "" {
		host = "127.0.0.1"
	}
	if port == 0 {
		port = 3000
	}
	return Config{TargetHost: host, TargetPort: port}
}

type Params struct {
	SignalingURL string
	Name         string
	Password     string
	TargetHost   string
	TargetPort   int
	QRCode       bool
}

func (p Params) Validate() error {
	if p.Name == "" {
		return fmt.Errorf("server name is required")
	}
	if p.Password == "" {
		return fmt.Errorf("password is required")
	}
	if p.SignalingURL != "" {
		u, err := url.Parse(p.SignalingURL)
		if err != nil {
			return fmt.Errorf("invalid signaling URL: %w", err)
		}
		if u.Scheme != "ws" && u.Scheme != "wss" {
			return fmt.Errorf("signaling URL must use ws:// or wss://")
		}
	}
	return nil
}

func init() {
	log.SetFlags(log.Ltime | log.Lshortfile)
}
