package main

// Inyección de input real: mouse (SendInput absoluto sobre el escritorio
// virtual), scroll (rueda), teclas (VK) y texto (KEYEVENTF_UNICODE, soporta
// cualquier unicode). Las coordenadas del mouse llegan normalizadas 0..1
// sobre la región capturada (pantalla o ventana) — el agente las mapea a
// coordenadas absolutas de pantalla.

import (
	"errors"
	"strings"
	"syscall"
	"unsafe"
)

type inputMsg struct {
	Type   string   `json:"type"`             // mouse | scroll | key | text
	Action string   `json:"action"`           // mouse: move|down|up|click · key: down|up|tap
	X      float64  `json:"x,omitempty"`      // normalizado 0..1
	Y      float64  `json:"y,omitempty"`      // normalizado 0..1
	Button string   `json:"button,omitempty"` // left | right | middle
	Dx     int      `json:"dx,omitempty"`     // notches de scroll
	Dy     int      `json:"dy,omitempty"`
	Code   string   `json:"code,omitempty"` // nombre de tecla
	Text   string   `json:"text,omitempty"`
	Mods   []string `json:"mods,omitempty"` // ctrl | alt | shift | win
}

var errInvalidInput = errors.New("invalid input payload")

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

// ===== SendInput primitivos =====

func sendInput(events []input) error {
	if len(events) == 0 {
		return nil
	}
	r, _, _ := procSendInput.Call(uintptr(len(events)),
		uintptr(unsafe.Pointer(&events[0])),
		uintptr(unsafe.Sizeof(input{})))
	if int(r) != len(events) {
		return syscall.Errno(GetLastError())
	}
	return nil
}

func mouseMove(nx, ny float64) {
	dx := int32(clamp01(nx) * 65535)
	dy := int32(clamp01(ny) * 65535)
	sendInput([]input{{
		Type: inputMouse,
		U:    inputUnion{Mi: mouseInput{Dx: dx, Dy: dy, Flags: mouseEventfMove | mouseEventfAbsolute | mouseEventfVirtualDesk}},
	}})
}

func mouseButton(button string, down bool) {
	var flag uint32
	switch button {
	case "right":
		if down {
			flag = mouseEventfRightDown
		} else {
			flag = mouseEventfRightUp
		}
	case "middle":
		if down {
			flag = mouseEventfMiddleDown
		} else {
			flag = mouseEventfMiddleUp
		}
	default:
		if down {
			flag = mouseEventfLeftDown
		} else {
			flag = mouseEventfLeftUp
		}
	}
	sendInput([]input{{
		Type: inputMouse,
		U:    inputUnion{Mi: mouseInput{Flags: flag}},
	}})
}

func mouseClick(button string) {
	mouseButton(button, true)
	mouseButton(button, false)
}

func mouseWheel(dy int) {
	if dy == 0 {
		return
	}
	sendInput([]input{{
		Type: inputMouse,
		U:    inputUnion{Mi: mouseInput{MouseData: uint32(dy * wheelDelta), Flags: mouseEventfWheel}},
	}})
}

// keyEventInput construye un evento de teclado (VK o unicode) vía la unión.
func keyEventInput(vk uint16, down, unicode bool) input {
	flags := uint32(0)
	if !down {
		flags |= keyEventfKeyUp
	}
	if unicode {
		flags |= keyEventfUnicode
	}
	ki := keybdInput{Vk: vk, Flags: flags}
	// La unión se representa con mouseInput (24 bytes); copiamos los 16 bytes
	// del KEYBDINPUT sobre ella.
	var u inputUnion
	*(*keybdInput)(unsafe.Pointer(&u.Mi)) = ki
	return input{Type: inputKeyboard, U: u}
}

// ===== Teclas =====

func vkForCode(code string) (uint16, bool) {
	switch strings.ToLower(code) {
	case "ctrl", "control":
		return vkControl, true
	case "alt":
		return vkMenu, true
	case "shift":
		return vkShift, true
	case "win", "meta", "super":
		return vkLWin, true
	case "esc", "escape":
		return vkEscape, true
	case "enter", "return":
		return vkReturn, true
	case "tab":
		return vkTab, true
	case "backspace":
		return vkBack, true
	case "delete", "del":
		return vkDelete, true
	case "home":
		return vkHome, true
	case "end":
		return vkEnd, true
	case "pageup":
		return vkPrior, true
	case "pagedown":
		return vkNext, true
	case "up", "arrowup":
		return vkUp, true
	case "down", "arrowdown":
		return vkDown, true
	case "left", "arrowleft":
		return vkLeft, true
	case "right", "arrowright":
		return vkRight, true
	case "space":
		return vkSpace, true
	case "caps", "capslock":
		return vkCaps, true
	}
	if len(code) == 1 {
		c := rune(code[0])
		if c >= 'a' && c <= 'z' {
			return uint16(c - 'a' + 'A'), true
		}
		if c >= '0' && c <= '9' {
			return uint16(c), true
		}
	}
	if len(code) == 2 && (code[0] == 'f' || code[0] == 'F') && code[1] >= '1' && code[1] <= '9' {
		return vkF1 + uint16(code[1]-'1'), true
	}
	if strings.EqualFold(code, "f10") {
		return vkF1 + 9, true
	}
	if strings.EqualFold(code, "f11") {
		return vkF1 + 10, true
	}
	if strings.EqualFold(code, "f12") {
		return vkF1 + 11, true
	}
	return 0, false
}

func modsHeld(mods []string) []uint16 {
	var out []uint16
	for _, m := range mods {
		if vk, ok := vkForCode(m); ok {
			switch vk {
			case vkControl, vkMenu, vkShift, vkLWin:
				out = append(out, vk)
			}
		}
	}
	return out
}

// ===== Handler público =====

func (s *server) handleInputMsg(msg inputMsg) error {
	switch msg.Type {
	case "mouse":
		if msg.X < 0 || msg.Y < 0 {
			return errInvalidInput
		}
		// Mapeo: la región capturada puede ser la ventana (frame.Rect) o el
		// escritorio virtual; las coords normalizadas se convierten a absolutas.
		s.captureRectMu.Lock()
		region := s.captureRegion
		s.captureRectMu.Unlock()
		if region.width() <= 0 {
			region = virtualDesktop()
		}
		ax := int32(float64(region.Left) + clamp01(msg.X)*float64(region.width()))
		ay := int32(float64(region.Top) + clamp01(msg.Y)*float64(region.height()))
		switch msg.Action {
		case "move":
			mouseMoveAbs(ax, ay)
		case "down":
			mouseMoveAbs(ax, ay)
			mouseButton(msg.Button, true)
		case "up":
			mouseButton(msg.Button, false)
		case "click":
			mouseMoveAbs(ax, ay)
			mouseClick(msg.Button)
		}
		return nil

	case "scroll":
		mouseWheel(msg.Dy)
		return nil

	case "key":
		vk, ok := vkForCode(msg.Code)
		if !ok {
			return errInvalidInput
		}
		mods := modsHeld(msg.Mods)
		press := func(down bool) {
			for _, m := range mods {
				sendInput([]input{keyEventInput(m, down, false)})
			}
			sendInput([]input{keyEventInput(vk, down, false)})
			for i := len(mods) - 1; i >= 0; i-- {
				sendInput([]input{keyEventInput(mods[i], !down, false)})
			}
		}
		switch msg.Action {
		case "down":
			press(true)
		case "up":
			press(false)
		default: // tap
			press(true)
			press(false)
		}
		return nil

	case "text":
		for _, r := range msg.Text {
			switch r {
			case '\n', '\r':
				vk, _ := vkForCode("enter")
				sendInput([]input{keyEventInput(vk, true, false), keyEventInput(vk, false, false)})
			case '\t':
				vk, _ := vkForCode("tab")
				sendInput([]input{keyEventInput(vk, true, false), keyEventInput(vk, false, false)})
			default:
				// KEYEVENTF_UNICODE: funciona para cualquier carácter (ñ, ü, CJK...).
				sendInput([]input{keyEventInput(uint16(r), true, true), keyEventInput(uint16(r), false, true)})
			}
		}
		return nil
	}
	return errInvalidInput
}

// mouseMoveAbs mueve el puntero a coordenadas absolutas del escritorio virtual.
func mouseMoveAbs(ax, ay int32) {
	vd := virtualDesktop()
	nx := float64(ax-vd.Left) / float64(vd.width())
	ny := float64(ay-vd.Top) / float64(vd.height())
	mouseMove(nx, ny)
}
