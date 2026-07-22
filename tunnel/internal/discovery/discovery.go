package discovery

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"
)

type Result struct {
	Found       bool
	Running     bool
	BinPath     string
	RunningPort int
	Version     string
	Error       string
}

type Discovery struct {
	customBinPath string
}

func New() *Discovery {
	return &Discovery{}
}

func (d *Discovery) SetCustomBinPath(path string) {
	d.customBinPath = path
}

func (d *Discovery) CustomBinPath() string {
	return d.customBinPath
}

func (d *Discovery) Discover() Result {
	if d.customBinPath != "" {
		if info, err := os.Stat(d.customBinPath); err == nil && !info.IsDir() {
			return d.checkPortsOrStart(d.customBinPath)
		}
	}

	for _, port := range []int{3000, 4096, 8080, 8081, 8082} {
		if healthCheck(port) {
			version := getVersion(port)
			log.Printf("[discovery] Server running on port %d (version: %s)", port, version)
			return Result{
				Found:       true,
				Running:     true,
				RunningPort: port,
				Version:     version,
			}
		}
	}

	binPath := d.findBinary()
	if binPath == "" {
		return Result{
			Found: false,
			Error: "opencode no encontrado. Selecciona el binario manualmente.",
		}
	}

	return d.checkPortsOrStart(binPath)
}

func (d *Discovery) checkPortsOrStart(binPath string) Result {
	for _, port := range []int{3000, 4096, 8080} {
		if healthCheck(port) {
			version := getVersion(port)
			return Result{
				Found:       true,
				Running:     true,
				RunningPort: port,
				BinPath:     binPath,
				Version:     version,
			}
		}
	}

	version := getBinaryVersion(binPath)

	return Result{
		Found:   true,
		Running: false,
		BinPath: binPath,
		Version: version,
	}
}

func (d *Discovery) StartServer(port int) error {
	binPath := d.customBinPath
	if binPath == "" {
		binPath = d.findBinary()
	}
	if binPath == "" {
		return fmt.Errorf("no se encontró el binario opencode")
	}

	log.Printf("[discovery] Starting opencode server on port %d: %s", port, binPath)
	cmd := exec.Command(binPath, "serve", "--port", strconv.Itoa(port))
	cmd.Stdout = nil
	cmd.Stderr = nil

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("start server: %w", err)
	}

	for i := 0; i < 20; i++ {
		time.Sleep(500 * time.Millisecond)
		if healthCheck(port) {
			log.Printf("[discovery] Server started on port %d", port)
			return nil
		}
	}

	return fmt.Errorf("server did not respond after 10 seconds")
}

func (d *Discovery) findBinary() string {
	name := "opencode"
	if runtime.GOOS == "windows" {
		name = "opencode.exe"
	}

	if path, err := exec.LookPath("opencode"); err == nil {
		return path
	}

	searchDirs := d.getSearchDirs()
	for _, dir := range searchDirs {
		candidate := filepath.Join(dir, name)
		if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
			return candidate
		}
	}

	npmPath := d.findNpmGlobal(name)
	if npmPath != "" {
		return npmPath
	}

	nvmPath := d.findNvmPath(name)
	if nvmPath != "" {
		return nvmPath
	}

	return ""
}

func (d *Discovery) getSearchDirs() []string {
	dirs := []string{}

	if home, err := os.UserHomeDir(); err == nil {
		dirs = append(dirs,
			filepath.Join(home, ".opencode"),
			filepath.Join(home, "bin"),
			filepath.Join(home, ".local", "bin"),
		)

		if runtime.GOOS == "windows" {
			localAppData := os.Getenv("LOCALAPPDATA")
			if localAppData != "" {
				dirs = append(dirs,
					filepath.Join(localAppData, "Programs", "opencode"),
					filepath.Join(localAppData, "opencode"),
				)
			}
			dirs = append(dirs,
				filepath.Join(home, "AppData", "Roaming", "npm"),
				filepath.Join(home, "scoop", "apps", "opencode", "current"),
				"C:\\Program Files\\opencode",
				"C:\\Program Files (x86)\\opencode",
			)
		}
	}

	if runtime.GOOS == "linux" {
		dirs = append(dirs,
			"/usr/local/bin",
			"/usr/bin",
			"/opt/opencode/bin",
			"/snap/bin",
		)
	}

	if runtime.GOOS == "darwin" {
		dirs = append(dirs,
			"/Applications/opencode.app/Contents/MacOS",
			"/usr/local/bin",
			"/opt/homebrew/bin",
		)
	}

	return dirs
}

func (d *Discovery) findNpmGlobal(name string) string {
	cmd := exec.Command("npm", "root", "-g")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	globalRoot := strings.TrimSpace(string(out))
	if globalRoot == "" {
		return ""
	}
	candidate := filepath.Join(globalRoot, "@opencode", "cli", "bin", "run.js")
	if _, err := os.Stat(candidate); err == nil {
		if runtime.GOOS == "windows" {
			cmdName := "opencode.exe"
			parent := filepath.Dir(filepath.Dir(filepath.Dir(globalRoot)))
			binPath := filepath.Join(parent, "opencode", "bin", cmdName)
			if _, err := os.Stat(binPath); err == nil {
				return binPath
			}
		}
		return filepath.Join(globalRoot, ".bin", name)
	}
	return ""
}

func (d *Discovery) findNvmPath(name string) string {
	home, _ := os.UserHomeDir()
	pattern := filepath.Join(home, ".nvm", "versions", "node", "*", "lib", "node_modules", "@opencode", "cli", "bin", "run.js")

	if runtime.GOOS == "windows" {
		nvmHome := os.Getenv("NVM_HOME")
		if nvmHome != "" {
			pattern = filepath.Join(nvmHome, "v*", "node_modules", "@opencode", "cli", "bin", "run.js")
		}
	}

	matches, err := filepath.Glob(pattern)
	if err == nil && len(matches) > 0 {
		npmDir := filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(matches[0]))))
		return filepath.Join(npmDir, ".bin", name)
	}

	return ""
}

func healthCheck(port int) bool {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/health", port))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

func getVersion(port int) string {
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(fmt.Sprintf("http://127.0.0.1:%d/health", port))
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	version := resp.Header.Get("X-OpenCode-Version")
	if version == "" {
		version = resp.Header.Get("x-opencode-version")
	}
	if version == "" {
		version = "desconocida"
	}
	return version
}

func getBinaryVersion(binPath string) string {
	cmd := exec.Command(binPath, "--version")
	out, err := cmd.Output()
	if err != nil {
		return "desconocida"
	}
	return strings.TrimSpace(string(out))
}
