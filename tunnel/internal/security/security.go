package security

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/pbkdf2"
)

func HashPassword(password string) string {
	h := sha256.Sum256([]byte(password))
	return hex.EncodeToString(h[:])
}

type RateLimiter struct {
	mu     sync.Mutex
	limits map[string]*attempts
}

type attempts struct {
	count    int
	firstTry time.Time
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{limits: make(map[string]*attempts)}
}

func (rl *RateLimiter) Allow(key string, maxAttempts int, window time.Duration) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	a, ok := rl.limits[key]
	if !ok {
		rl.limits[key] = &attempts{count: 1, firstTry: time.Now()}
		return true
	}

	if time.Since(a.firstTry) > window {
		a.count = 1
		a.firstTry = time.Now()
		return true
	}

	a.count++
	return a.count <= maxAttempts
}

type Encrypter struct {
	key []byte
}

func NewEncrypter(machineID string) *Encrypter {
	salt := []byte("opencode-tunnel-v1")
	dk := pbkdf2.Key([]byte(machineID), salt, 100000, 32, sha256.New)
	return &Encrypter{key: dk}
}

func (e *Encrypter) Encrypt(plaintext []byte) (string, error) {
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("aes: %w", err)
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("gcm: %w", err)
	}
	nonce := make([]byte, aesgcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("nonce: %w", err)
	}
	ciphertext := aesgcm.Seal(nonce, nonce, plaintext, nil)
	return hex.EncodeToString(ciphertext), nil
}

func (e *Encrypter) Decrypt(encoded string) ([]byte, error) {
	ciphertext, err := hex.DecodeString(encoded)
	if err != nil {
		return nil, fmt.Errorf("hex: %w", err)
	}
	block, err := aes.NewCipher(e.key)
	if err != nil {
		return nil, fmt.Errorf("aes: %w", err)
	}
	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("gcm: %w", err)
	}
	nonceSize := aesgcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}
	nonce, data := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := aesgcm.Open(nil, nonce, data, nil)
	if err != nil {
		return nil, fmt.Errorf("decrypt: %w", err)
	}
	return plaintext, nil
}

func MachineID() string {
	switch runtime.GOOS {
	case "windows":
		return readWindowsMachineID()
	case "linux":
		return readLinuxMachineID()
	case "darwin":
		return readDarwinMachineID()
	}
	return "opencode-fallback"
}

func readWindowsMachineID() string {
	out, err := exec.Command("reg", "query", `HKLM\SOFTWARE\Microsoft\Cryptography`, "/v", "MachineGuid").Output()
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "MachineGuid") {
			parts := strings.Split(line, "REG_SZ")
			if len(parts) > 1 {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

func readLinuxMachineID() string {
	data, err := os.ReadFile("/etc/machine-id")
	if err != nil {
		data, err = os.ReadFile("/var/lib/dbus/machine-id")
		if err != nil {
			return ""
		}
	}
	return strings.TrimSpace(string(data))
}

func readDarwinMachineID() string {
	out, err := exec.Command("ioreg", "-rd1", "-c", "IOPlatformExpertDevice").Output()
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "IOPlatformUUID") {
			parts := strings.Split(line, `" = "`)
			if len(parts) > 1 {
				return strings.TrimRight(parts[1], `"`)
			}
		}
	}
	return ""
}
