package main

// Enlaces a las APIs de Windows (user32/gdi32/psapi/kernel32) vía syscall,
// sin cgo. Todas las constantes relevantes de Win32 viven acá.

import "syscall"

var (
	user32   = syscall.NewLazyDLL("user32.dll")
	gdi32    = syscall.NewLazyDLL("gdi32.dll")
	psapi    = syscall.NewLazyDLL("psapi.dll")
	kernel32 = syscall.NewLazyDLL("kernel32.dll")

	procGetDC                   = user32.NewProc("GetDC")
	procReleaseDC               = user32.NewProc("ReleaseDC")
	procGetSystemMetrics        = user32.NewProc("GetSystemMetrics")
	procCreateCompatibleDC      = gdi32.NewProc("CreateCompatibleDC")
	procDeleteDC                = gdi32.NewProc("DeleteDC")
	procCreateCompatibleBitmap  = gdi32.NewProc("CreateCompatibleBitmap")
	procSelectObject            = gdi32.NewProc("SelectObject")
	procDeleteObject            = gdi32.NewProc("DeleteObject")
	procBitBlt                  = gdi32.NewProc("BitBlt")
	procGetDIBits               = gdi32.NewProc("GetDIBits")
	procGetCursorInfo           = user32.NewProc("GetCursorInfo")
	procCopyIcon                = user32.NewProc("CopyIcon")
	procDestroyIcon             = user32.NewProc("DestroyIcon")
	procDrawIconEx              = user32.NewProc("DrawIconEx")
	procGetIconInfo             = user32.NewProc("GetIconInfo")
	procPrintWindow             = user32.NewProc("PrintWindow")
	procGetWindowRect           = user32.NewProc("GetWindowRect")
	procEnumWindows             = user32.NewProc("EnumWindows")
	procGetWindowTextW          = user32.NewProc("GetWindowTextW")
	procGetWindowTextLengthW    = user32.NewProc("GetWindowTextLengthW")
	procIsWindowVisible         = user32.NewProc("IsWindowVisible")
	procGetWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	procEnumDisplayMonitors     = user32.NewProc("EnumDisplayMonitors")
	procGetMonitorInfoW         = user32.NewProc("GetMonitorInfoW")
	procOpenProcess             = kernel32.NewProc("OpenProcess")
	procCloseHandle             = kernel32.NewProc("CloseHandle")
	procGetModuleBaseNameW      = psapi.NewProc("GetModuleBaseNameW")
	procGetCurrentProcessId     = kernel32.NewProc("GetCurrentProcessId")
	procSetProcessDPIAware      = user32.NewProc("SetProcessDPIAware")
	procSendInput               = user32.NewProc("SendInput")
	procVkKeyScanW              = user32.NewProc("VkKeyScanW")
	procGetAsyncKeyState        = user32.NewProc("GetAsyncKeyState")
	procGetForegroundWindow     = user32.NewProc("GetForegroundWindow")
)

// GDI / system metrics
const (
	smXVirtualScreen = 76
	smYVirtualScreen = 77
	smCxVirtualScreen = 78
	smCyVirtualScreen = 79

	srcCopy = 0x00CC0020
	dibRGBColors = 0

	pwRenderFullContent = 0x00000002

	monitorInfoFPrimary = 0x00000001
)

// GetDIBits espera biHeight negativo para top-down (BGRA sin flip).
type bitmapInfoHeader struct {
	BiSize          uint32
	BiWidth         int32
	BiHeight        int32
	BiPlanes        uint16
	BiBitCount      uint16
	BiCompression   uint32
	BiSizeImage     uint32
	BiXPelsPerMeter int32
	BiYPelsPerMeter int32
	BiClrUsed       uint32
	BiClrImportant  uint32
}

type point struct{ X, Y int32 }
type rect struct{ Left, Top, Right, Bottom int32 }

func (r rect) width() int32  { return r.Right - r.Left }
func (r rect) height() int32 { return r.Bottom - r.Top }

type monitorInfo struct {
	CbSize    uint32
	RcMonitor rect
	RcWork    rect
	DwFlags   uint32
}

type cursorInfo struct {
	CbSize      uint32
	Flags       uint32
	HCursor     uintptr
	PtScreenPos point
}

const cursorShowing = 0x00000001

type iconInfo struct {
	FIcon    int32
	XHotspot int32
	YHotspot int32
	HbmMask  uintptr
	HbmColor uintptr
}

// SendInput
const (
	inputMouse    = 0
	inputKeyboard = 1

	mouseEventfMove       = 0x0001
	mouseEventfLeftDown   = 0x0002
	mouseEventfLeftUp     = 0x0004
	mouseEventfRightDown  = 0x0008
	mouseEventfRightUp    = 0x0010
	mouseEventfMiddleDown = 0x0020
	mouseEventfMiddleUp   = 0x0040
	mouseEventfWheel      = 0x0800
	mouseEventfAbsolute   = 0x8000
	mouseEventfVirtualDesk = 0x4000

	keyEventfKeyUp     = 0x0002
	keyEventfUnicode   = 0x0004

	wheelDelta = 120
)

type mouseInput struct {
	Dx, Dy    int32
	MouseData uint32
	Flags     uint32
	Time      uint32
	ExtraInfo uintptr
}

type keybdInput struct {
	Vk        uint16
	Scan      uint16
	Flags     uint32
	Time      uint32
	ExtraInfo uintptr
}

type inputUnion struct {
	Mi mouseInput
}

type input struct {
	Type uint32
	_    uint32
	U    inputUnion
}

// VK codes
const (
	vkControl = 0x11
	vkMenu    = 0x12
	vkShift   = 0x10
	vkLWin    = 0x5B
	vkEscape  = 0x1B
	vkReturn  = 0x0D
	vkTab     = 0x09
	vkBack    = 0x08
	vkDelete  = 0x2E
	vkHome    = 0x24
	vkEnd     = 0x23
	vkPrior   = 0x21
	vkNext    = 0x22
	vkUp      = 0x26
	vkDown    = 0x28
	vkLeft    = 0x25
	vkRight   = 0x27
	vkSpace   = 0x20
	vkCaps    = 0x14
	vkF1      = 0x70
)
