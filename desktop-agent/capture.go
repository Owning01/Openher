package main

// Captura de pantalla (GDI BitBlt del escritorio virtual) y de ventanas
// (PrintWindow con PW_RENDERFULLCONTENT — funciona con render GPU tipo
// Chrome y con ventanas tapadas). Dibuja el cursor encima, escala al ancho
// pedido y encodea JPEG. Solo emite frames cuando el contenido cambió.

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"sync"
	"syscall"
	"unsafe"
)

type frame struct {
	RGBA *image.RGBA
	Rect rect // región capturada en coordenadas de escritorio virtual
}

var (
	captureMu sync.Mutex
	lastFp    []byte
)

// ===== Primitivas GDI =====

func getDC(hwnd uintptr) uintptr {
	r, _, _ := procGetDC.Call(hwnd)
	return r
}

func releaseDC(hwnd, hdc uintptr) {
	procReleaseDC.Call(hwnd, hdc)
}

func systemMetric(index int) int32 {
	r, _, _ := procGetSystemMetrics.Call(uintptr(index))
	return int32(r)
}

func createCompatibleDC(hdc uintptr) uintptr {
	r, _, _ := procCreateCompatibleDC.Call(hdc)
	return r
}

func deleteDC(hdc uintptr) {
	procDeleteDC.Call(hdc)
}

func createCompatibleBitmap(hdc uintptr, w, h int32) uintptr {
	r, _, _ := procCreateCompatibleBitmap.Call(hdc, uintptr(w), uintptr(h))
	return r
}

func selectObject(hdc, obj uintptr) uintptr {
	r, _, _ := procSelectObject.Call(hdc, obj)
	return r
}

func deleteObject(obj uintptr) {
	procDeleteObject.Call(obj)
}

func bitBlt(dst uintptr, dx, dy, w, h int32, src uintptr, sx, sy int32, rop uint32) {
	procBitBlt.Call(dst, uintptr(dx), uintptr(dy), uintptr(w), uintptr(h),
		src, uintptr(sx), uintptr(sy), uintptr(rop))
}

// dibBits extrae los píxeles BGRA (top-down) del bitmap seleccionado en hdc.
func dibBits(hdc, hbm uintptr, w, h int32) ([]byte, error) {
	bmi := bitmapInfoHeader{
		BiSize:     uint32(unsafe.Sizeof(bitmapInfoHeader{})),
		BiWidth:    w,
		BiHeight:   -h, // top-down
		BiPlanes:   1,
		BiBitCount: 32,
	}
	buf := make([]byte, int(w)*int(h)*4)
	r, _, _ := procGetDIBits.Call(hdc, hbm, 0, uintptr(h),
		uintptr(unsafe.Pointer(&buf[0])),
		uintptr(unsafe.Pointer(&bmi)), uintptr(dibRGBColors))
	if r == 0 {
		return nil, syscall.Errno(GetLastError())
	}
	return buf, nil
}

// ===== Cursor =====

func drawCursorInto(hdc uintptr, region rect) {
	var ci cursorInfo
	ci.CbSize = uint32(unsafe.Sizeof(ci))
	r, _, _ := procGetCursorInfo.Call(uintptr(unsafe.Pointer(&ci)))
	if r == 0 || ci.Flags&cursorShowing == 0 || ci.HCursor == 0 {
		return
	}
	// Hotspot para dibujar el cursor alineado.
	var ii iconInfo
	hasIcon := false
	if rr, _, _ := procGetIconInfo.Call(ci.HCursor, uintptr(unsafe.Pointer(&ii))); rr != 0 {
		hasIcon = true
		defer procDestroyIcon.Call(ii.HbmMask)
		if ii.HbmColor != 0 {
			defer procDestroyIcon.Call(ii.HbmColor)
		}
	}
	cx := int32(ci.PtScreenPos.X)
	cy := int32(ci.PtScreenPos.Y)
	if hasIcon {
		cx -= ii.XHotspot
		cy -= ii.YHotspot
	}
	if cx < region.Left || cy < region.Top || cx >= region.Right || cy >= region.Bottom {
		return
	}
	procDrawIconEx.Call(hdc, uintptr(cx), uintptr(cy), ci.HCursor, 0, 0, 0, 0, 0x0003 /* DI_NORMAL */)
}

// ===== Capturas =====

// virtualDesktop devuelve el rect del escritorio virtual (todos los monitores).
func virtualDesktop() rect {
	return rect{
		Left:   systemMetric(smXVirtualScreen),
		Top:    systemMetric(smYVirtualScreen),
		Right:  systemMetric(smXVirtualScreen) + systemMetric(smCxVirtualScreen),
		Bottom: systemMetric(smYVirtualScreen) + systemMetric(smCyVirtualScreen),
	}
}

// captureRect captura una región arbitraria del escritorio virtual.
func captureRect(region rect) (*frame, error) {
	w, h := region.width(), region.height()
	if w <= 0 || h <= 0 {
		return nil, syscall.Errno(87) // ERROR_INVALID_PARAMETER
	}
	scrDC := getDC(0)
	defer releaseDC(0, scrDC)
	memDC := createCompatibleDC(scrDC)
	defer deleteDC(memDC)
	hbm := createCompatibleBitmap(scrDC, w, h)
	defer deleteObject(hbm)
	selectObject(memDC, hbm)
	bitBlt(memDC, 0, 0, w, h, scrDC, region.Left, region.Top, srcCopy)
	drawCursorInto(memDC, region)

	buf, err := dibBits(memDC, hbm, w, h)
	if err != nil {
		return nil, err
	}
	rgba := bgraToRGBA(buf, int(w), int(h))
	return &frame{RGBA: rgba, Rect: region}, nil
}

// captureWindow captura una ventana específica (PrintWindow full content).
func captureWindow(hwnd uintptr) (*frame, error) {
	var wr rect
	r, _, _ := procGetWindowRect.Call(hwnd, uintptr(unsafe.Pointer(&wr)))
	if r == 0 {
		return nil, syscall.Errno(GetLastError())
	}
	w, h := wr.width(), wr.height()
	if w <= 0 || h <= 0 {
		return nil, syscall.Errno(87)
	}
	scrDC := getDC(0)
	defer releaseDC(0, scrDC)
	memDC := createCompatibleDC(scrDC)
	defer deleteDC(memDC)
	hbm := createCompatibleBitmap(scrDC, w, h)
	defer deleteObject(hbm)
	selectObject(memDC, hbm)

	r, _, _ = procPrintWindow.Call(hwnd, memDC, pwRenderFullContent)
	if r == 0 {
		// Fallback: recortar el escritorio (ventanas que no cooperan con PrintWindow).
		deleteDC(memDC)
		deleteObject(hbm)
		return captureRect(wr)
	}
	drawCursorInto(memDC, rect{0, 0, w, h})

	buf, err := dibBits(memDC, hbm, w, h)
	if err != nil {
		return nil, err
	}
	rgba := bgraToRGBA(buf, int(w), int(h))
	return &frame{RGBA: rgba, Rect: wr}, nil
}

func bgraToRGBA(b []byte, w, h int) *image.RGBA {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	dst := img.Pix
	for y := 0; y < h; y++ {
		srcRow := b[y*w*4:]
		d := dst[y*img.Stride : y*img.Stride+w*4]
		for x := 0; x < w; x++ {
			i := x * 4
			// BGRA → RGBA
			d[i] = srcRow[i+2]
			d[i+1] = srcRow[i+1]
			d[i+2] = srcRow[i]
			d[i+3] = 255
		}
	}
	return img
}

// ===== Fingerprint (detección de cambio) =====

// fingerprint muestrea cada 24px: barato y suficiente para detectar cambios.
func fingerprint(img *image.RGBA) []byte {
	b := img.Bounds()
	step := 24
	w, h := b.Dx(), b.Dy()
	fp := make([]byte, 0, (w/step+1)*(h/step+1))
	for y := 0; y < h; y += step {
		for x := 0; x < w; x += step {
			c := img.RGBAAt(x, y)
			fp = append(fp, c.R, c.G, c.B)
		}
	}
	return fp
}

func hasChanged(img *image.RGBA) bool {
	fp := fingerprint(img)
	if bytes.Equal(fp, lastFp) {
		return false
	}
	lastFp = fp
	return true
}

// ===== Escalado (bilinear simple) =====

func scaleToWidth(img *image.RGBA, targetW int) *image.RGBA {
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()
	if targetW <= 0 || targetW >= w {
		return img
	}
	targetH := int(float64(h) * float64(targetW) / float64(w))
	out := image.NewRGBA(image.Rect(0, 0, targetW, targetH))
	scaleX := float64(w) / float64(targetW)
	scaleY := float64(h) / float64(targetH)
	for y := 0; y < targetH; y++ {
		srcY := float64(y) * scaleY
		y0 := int(srcY)
		y1 := y0 + 1
		if y1 >= h {
			y1 = h - 1
		}
		fy := srcY - float64(y0)
		for x := 0; x < targetW; x++ {
			srcX := float64(x) * scaleX
			x0 := int(srcX)
			x1 := x0 + 1
			if x1 >= w {
				x1 = w - 1
			}
			fx := srcX - float64(x0)
			c00 := img.RGBAAt(x0, y0)
			c10 := img.RGBAAt(x1, y0)
			c01 := img.RGBAAt(x0, y1)
			c11 := img.RGBAAt(x1, y1)
			r := lerp(lerp(float64(c00.R), float64(c10.R), fx), lerp(float64(c01.R), float64(c11.R), fx), fy)
			g := lerp(lerp(float64(c00.G), float64(c10.G), fx), lerp(float64(c01.G), float64(c11.G), fx), fy)
			bl := lerp(lerp(float64(c00.B), float64(c10.B), fx), lerp(float64(c01.B), float64(c11.B), fx), fy)
			out.SetRGBA(x, y, color.RGBA{uint8(r), uint8(g), uint8(bl), 255})
		}
	}
	return out
}

func lerp(a, b, t float64) float64 { return a + (b-a)*t }

// ===== JPEG =====

func encodeJPEG(img *image.RGBA, quality int) ([]byte, error) {
	var buf bytes.Buffer
	if quality < 1 {
		quality = 1
	}
	if quality > 100 {
		quality = 100
	}
	err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality})
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// GetLastError devuelve el último error de Win32 como uintptr.
func GetLastError() uintptr { return uintptr(syscall.GetLastError().(syscall.Errno)) }
