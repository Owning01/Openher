package signaling

import (
	"fmt"
	"log"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type      string `json:"type"`
	Name      string `json:"name,omitempty"`
	Password  string `json:"password,omitempty"`
	TunnelID  string `json:"tunnelId,omitempty"`
	SessionID string `json:"sessionId,omitempty"`
	SDP       string `json:"sdp,omitempty"`
	ICE       string `json:"ice,omitempty"`
	Error     string `json:"error,omitempty"`
}

type Client struct {
	conn      *websocket.Conn
	tunnelID  string
	sessionID string
	onOffer   func(sessionID string)
	onSignal  func(msg Message)
	onError   func(err string)
	onClose   func()
}

func New(url, name, password string) *Client {
	return &Client{conn: nil, tunnelID: "", sessionID: ""}
}

func (c *Client) Connect(signalURL string, name, password string) error {
	conn, _, err := websocket.DefaultDialer.Dial(signalURL, nil)
	if err != nil {
		return fmt.Errorf("dial signaling: %w", err)
	}
	c.conn = conn

	msg := Message{Type: "register", Name: name, Password: password}
	if err := conn.WriteJSON(msg); err != nil {
		return fmt.Errorf("send register: %w", err)
	}

	for {
		var reply Message
		if err := conn.ReadJSON(&reply); err != nil {
			return fmt.Errorf("read response: %w", err)
		}

		switch reply.Type {
		case "registered":
			c.tunnelID = reply.TunnelID
			log.Printf("[signaling] registered as tunnel=%s name=%s", c.tunnelID, name)
			return nil
		case "error":
			return fmt.Errorf("signaling error: %s", reply.Error)
		default:
			log.Printf("[signaling] unexpected message: %+v", reply)
		}
	}
}

func (c *Client) Listen(onOffer func(sessionID string), onSignal func(Message), onError func(string), onClose func()) {
	c.onOffer = onOffer
	c.onSignal = onSignal
	c.onError = onError
	c.onClose = onClose

	go func() {
		defer func() {
			if c.onClose != nil {
				c.onClose()
			}
		}()

		for {
			var msg Message
			if err := c.conn.ReadJSON(&msg); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
					log.Printf("[signaling] read error: %v", err)
				}
				return
			}

			switch msg.Type {
			case "peer_offer":
				c.sessionID = msg.SessionID
				if c.onOffer != nil {
					c.onOffer(msg.SessionID)
				}
			case "signal":
				if c.onSignal != nil {
					c.onSignal(msg)
				}
			case "error":
				log.Printf("[signaling] server error: %s", msg.Error)
				if c.onError != nil {
					c.onError(msg.Error)
				}
			default:
				log.Printf("[signaling] unknown message: %+v", msg)
			}
		}
	}()
}

func (c *Client) SendSignal(sessionID, sdp, ice string) {
	msg := Message{
		Type:      "signal",
		SessionID: sessionID,
		SDP:       sdp,
		ICE:       ice,
	}
	if err := c.conn.WriteJSON(msg); err != nil {
		log.Printf("[signaling] send signal error: %v", err)
	}
}

func (c *Client) TunnelID() string  { return c.tunnelID }
func (c *Client) SessionID() string { return c.sessionID }
func (c *Client) Close() error {
	return c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
}

func (c *Client) WriteJSON(v interface{}) error {
	return c.conn.WriteJSON(v)
}

func (c *Client) ReadJSON(v interface{}) error {
	return c.conn.ReadJSON(v)
}
