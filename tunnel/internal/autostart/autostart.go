package autostart

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

const AppName = "OpenCodeTunnel"

func IsEnabled() bool {
	switch runtime.GOOS {
	case "windows":
		return windowsIsEnabled()
	case "linux":
		return linuxIsEnabled()
	case "darwin":
		return darwinIsEnabled()
	}
	return false
}

func SetEnabled(enabled bool) error {
	switch runtime.GOOS {
	case "windows":
		return windowsSetEnabled(enabled)
	case "linux":
		return linuxSetEnabled(enabled)
	case "darwin":
		return darwinSetEnabled(enabled)
	}
	return fmt.Errorf("auto-start not supported on %s", runtime.GOOS)
}

// Windows: HKCU\Software\Microsoft\Windows\CurrentVersion\Run
func windowsIsEnabled() bool {
	cmd := exec.Command("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`,
		"/v", AppName)
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.Contains(string(out), AppName)
}

func windowsSetEnabled(enabled bool) error {
	if enabled {
		exe, err := os.Executable()
		if err != nil {
			return fmt.Errorf("get executable path: %w", err)
		}
		cmd := exec.Command("reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`,
			"/v", AppName, "/t", "REG_SZ", "/d", fmt.Sprintf(`"%s" -autostart`, exe), "/f")
		out, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("reg add: %s: %w", strings.TrimSpace(string(out)), err)
		}
		log.Printf("[autostart] Enabled: %s", exe)
	} else {
		cmd := exec.Command("reg", "delete", `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`,
			"/v", AppName, "/f")
		out, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("reg delete: %s: %w", strings.TrimSpace(string(out)), err)
		}
		log.Printf("[autostart] Disabled")
	}
	return nil
}

// Linux: ~/.config/autostart/OpenCodeTunnel.desktop
func linuxIsEnabled() bool {
	path := linuxDesktopPath()
	_, err := os.Stat(path)
	return err == nil
}

func linuxSetEnabled(enabled bool) error {
	path := linuxDesktopPath()
	if enabled {
		exe, err := os.Executable()
		if err != nil {
			return fmt.Errorf("get executable path: %w", err)
		}
		content := fmt.Sprintf(`[Desktop Entry]
Type=Application
Name=OpenCode Tunnel
Exec=%s -autostart
Terminal=false
X-GNOME-Autostart-enabled=true
`, exe)

		dir := filepath.Dir(path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("mkdir: %w", err)
		}
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			return fmt.Errorf("write desktop file: %w", err)
		}
	} else {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("remove desktop file: %w", err)
		}
	}
	return nil
}

func linuxDesktopPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "autostart", AppName+".desktop")
}

// macOS: ~/Library/LaunchAgents/com.opencode.tunnel.plist
func darwinIsEnabled() bool {
	path := darwinPlistPath()
	_, err := os.Stat(path)
	return err == nil
}

func darwinSetEnabled(enabled bool) error {
	path := darwinPlistPath()
	if enabled {
		exe, err := os.Executable()
		if err != nil {
			return fmt.Errorf("get executable path: %w", err)
		}
		content := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.opencode.tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>%s</string>
        <string>-autostart</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
`, exe)

		dir := filepath.Dir(path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("mkdir: %w", err)
		}
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			return fmt.Errorf("write plist: %w", err)
		}
	} else {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("remove plist: %w", err)
		}
	}
	return nil
}

func darwinPlistPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "Library", "LaunchAgents", "com.opencode.tunnel.plist")
}
