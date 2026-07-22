package transport

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/pion/webrtc/v4"
)

type Request struct {
	ID      string            `json:"id"`
	Method  string            `json:"method"`
	Path    string            `json:"path"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body,omitempty"`
}

type Response struct {
	ID      string            `json:"id"`
	Status  int               `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
	Type    string            `json:"type,omitempty"`
	Done    bool              `json:"done,omitempty"`
}

type OnOffer func() (sdp string, err error)
type OnRemoteSDP func(sdp string) error

type WebRTCTransport struct {
	peerConn   *webrtc.PeerConnection
	dataChan   *webrtc.DataChannel
	targetURL  string
	pending    sync.Map
	mu         sync.Mutex
	connected  bool
	onClosed   func()
}

func New(targetURL string) *WebRTCTransport {
	return &WebRTCTransport{
		targetURL: targetURL,
	}
}

func (t *WebRTCTransport) CreateOffer() (string, error) {
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	}

	pc, err := webrtc.NewPeerConnection(config)
	if err != nil {
		return "", err
	}
	t.peerConn = pc

	dc, err := pc.CreateDataChannel("opencode", nil)
	if err != nil {
		pc.Close()
		return "", err
	}
	t.dataChan = dc

	dc.OnOpen(func() {
		log.Printf("[webrtc] data channel open")
		t.mu.Lock()
		t.connected = true
		t.mu.Unlock()
	})

	dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		t.handleMessage(msg.Data)
	})

	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("[webrtc] ICE state: %s", state)
		if state == webrtc.ICEConnectionStateDisconnected ||
			state == webrtc.ICEConnectionStateFailed ||
			state == webrtc.ICEConnectionStateClosed {
			t.mu.Lock()
			t.connected = false
			t.mu.Unlock()
			if t.onClosed != nil {
				t.onClosed()
			}
		}
	})

	offer, err := pc.CreateOffer(nil)
	if err != nil {
		pc.Close()
		return "", err
	}

	if err := pc.SetLocalDescription(offer); err != nil {
		pc.Close()
		return "", err
	}

	offerBytes, err := json.Marshal(offer)
	if err != nil {
		pc.Close()
		return "", err
	}

	return string(offerBytes), nil
}

func (t *WebRTCTransport) SetRemoteSDP(sdpJSON string) error {
	var sdp webrtc.SessionDescription
	if err := json.Unmarshal([]byte(sdpJSON), &sdp); err != nil {
		return err
	}
	return t.peerConn.SetRemoteDescription(sdp)
}

func (t *WebRTCTransport) AddICEServer() {
	t.peerConn.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}
		log.Printf("[webrtc] sending ICE candidate: %s", candidate.String())
	})
}

func (t *WebRTCTransport) OnClosed(fn func()) {
	t.onClosed = fn
}

func (t *WebRTCTransport) handleMessage(data []byte) {
	var req Request
	if err := json.Unmarshal(data, &req); err != nil {
		log.Printf("[webrtc] unmarshal error: %v", err)
		return
	}

	go t.proxyRequest(req)
}

func (t *WebRTCTransport) proxyRequest(req Request) {
	targetURL := t.targetURL + req.Path

	httpReq, err := http.NewRequest(req.Method, targetURL, stringToReader(req.Body))
	if err != nil {
		t.sendError(req.ID, err)
		return
	}

	for k, v := range req.Headers {
		httpReq.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		t.sendError(req.ID, err)
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.sendError(req.ID, err)
		return
	}

	respHeaders := make(map[string]string)
	for k, vals := range resp.Header {
		if len(vals) > 0 {
			respHeaders[k] = vals[0]
		}
	}

	res := Response{
		ID:      req.ID,
		Status:  resp.StatusCode,
		Headers: respHeaders,
		Body:    string(bodyBytes),
		Type:    "response",
		Done:    true,
	}

	data, _ := json.Marshal(res)
	if err := t.dataChan.Send(data); err != nil {
		log.Printf("[webrtc] send error: %v", err)
	}
}

func (t *WebRTCTransport) sendError(id string, err error) {
	res := Response{
		ID:   id,
		Type: "error",
		Body: err.Error(),
		Done: true,
	}
	data, _ := json.Marshal(res)
	t.dataChan.Send(data)
}

func (t *WebRTCTransport) Close() {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.connected = false
	if t.peerConn != nil {
		t.peerConn.Close()
	}
}

func (t *WebRTCTransport) IsConnected() bool {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.connected
}

func stringToReader(s string) io.Reader {
	if s == "" {
		return nil
	}
	return &stringReader{s: s}
}

type stringReader struct {
	s string
}

func (r *stringReader) Read(p []byte) (n int, err error) {
	if r.s == "" {
		return 0, io.EOF
	}
	n = copy(p, r.s)
	r.s = r.s[n:]
	return n, nil
}
