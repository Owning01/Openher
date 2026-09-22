//! Captura de una región de pantalla por GDI (`BitBlt`) → BMP.
//!
//! Por qué GDI y no `ICoreWebView2::CapturePreview`: wry 0.51 no expone el
//! controlador WebView2 (no hay `with_webview`), y el preview nativo de la
//! sub-WebView se ve en pantalla justo cuando el usuario lo elige en Design
//! Mode. Se devuelve BMP sin comprimir: el cliente lo pasa a PNG con canvas
//! (y ahí queda liviano). Cero dependencias nuevas.
#![cfg(windows)]

use windows_sys::Win32::Foundation::{HWND, POINT, RECT};
use windows_sys::Win32::Graphics::Gdi::{
    BitBlt, ClientToScreen, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject,
    GetDC, GetDIBits, ReleaseDC, SelectObject, BITMAPINFO, BITMAPINFOHEADER, CAPTUREBLT,
    DIB_RGB_COLORS, HGDIOBJ, SRCCOPY,
};
use windows_sys::Win32::UI::WindowsAndMessaging::GetClientRect;

/// Tope defensivo de la captura (un rect enorme no debe reservar GB).
const MAX_SIDE: i32 = 4096;

pub struct Shot {
    pub w: u32,
    pub h: u32,
    /// Bytes de un archivo BMP completo (header + pixels), bottom-up BI_RGB.
    pub bmp: Vec<u8>,
}

/// Pasa (x,y) del área cliente de `hwnd` (píxeles FÍSICOS) a pantalla.
pub fn client_to_screen(hwnd: isize, x: i32, y: i32) -> (i32, i32) {
    if hwnd == 0 {
        return (x, y);
    }
    let mut p = POINT { x, y };
    unsafe {
        ClientToScreen(hwnd as HWND, &mut p);
    }
    (p.x, p.y)
}

/// Tamaño del área cliente de `hwnd` en píxeles (0,0 si no hay ventana).
/// Misma unidad que `client_to_screen`: sirve para clampear el rect de la
/// captura y que nunca salga de la ventana.
pub fn client_size(hwnd: isize) -> (i32, i32) {
    if hwnd == 0 {
        return (0, 0);
    }
    let mut rc: RECT = unsafe { std::mem::zeroed() };
    let ok = unsafe { GetClientRect(hwnd as HWND, &mut rc) };
    if ok == 0 {
        (0, 0)
    } else {
        (rc.right - rc.left, rc.bottom - rc.top)
    }
}

/// Captura `w`×`h` desde (x,y) en píxeles físicos de pantalla.
pub fn capture_bmp(x: i32, y: i32, w: i32, h: i32) -> Result<Shot, String> {
    if w <= 0 || h <= 0 {
        return Err("region invalida".to_string());
    }
    let w = w.min(MAX_SIDE);
    let h = h.min(MAX_SIDE);
    unsafe {
        let screen = GetDC(std::ptr::null_mut());
        if screen.is_null() {
            return Err("GetDC(pantalla) fallo".to_string());
        }
        let mem = CreateCompatibleDC(screen);
        if mem.is_null() {
            ReleaseDC(std::ptr::null_mut(), screen);
            return Err("CreateCompatibleDC fallo".to_string());
        }
        let bmp = CreateCompatibleBitmap(screen, w, h);
        if bmp.is_null() {
            DeleteDC(mem);
            ReleaseDC(std::ptr::null_mut(), screen);
            return Err("CreateCompatibleBitmap fallo".to_string());
        }
        let old = SelectObject(mem, bmp as HGDIOBJ);
        // CAPTUREBLT: incluye capas con transparencia (nuestra ventana es
        // frameless con sombra DWM; sin él puede salir negro).
        let ok = BitBlt(mem, 0, 0, w, h, screen, x, y, SRCCOPY | CAPTUREBLT);
        let result = if ok == 0 { Err("BitBlt fallo".to_string()) } else { read_bits(mem, bmp, w, h) };
        SelectObject(mem, old);
        DeleteObject(bmp as HGDIOBJ);
        DeleteDC(mem);
        ReleaseDC(std::ptr::null_mut(), screen);
        result
    }
}

/// # Safety
///
/// `mem` debe ser un DC compatible válido con `bmp` disponible en él y
/// dimensiones `w`×`h`; `bmp` debe seguir vivo durante toda la llamada. El
/// buffer interno se aloja con `stride*h` bytes y `GetDIBits` se pide con
/// altura positiva (bottom-up) y `DIB_RGB_COLORS`, igual que declara `info`.
unsafe fn read_bits(mem: windows_sys::Win32::Graphics::Gdi::HDC, bmp: windows_sys::Win32::Graphics::Gdi::HBITMAP, w: i32, h: i32) -> Result<Shot, String> {
    let stride = (w * 3 + 3) / 4 * 4;
    let mut pixels = vec![0u8; (stride * h) as usize];
    let mut info: BITMAPINFO = std::mem::zeroed();
    info.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    info.bmiHeader.biWidth = w;
    // Altura positiva: filas bottom-up, igual que el orden de un BMP.
    info.bmiHeader.biHeight = h;
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 24;
    info.bmiHeader.biCompression = 0; // BI_RGB
    let lines = GetDIBits(mem, bmp, 0, h as u32, pixels.as_mut_ptr().cast(), &mut info, DIB_RGB_COLORS);
    if lines == 0 {
        return Err("GetDIBits fallo".to_string());
    }
    Ok(Shot { w: w as u32, h: h as u32, bmp: encode_bmp(w, h, &pixels) })
}

fn encode_bmp(w: i32, h: i32, pixels: &[u8]) -> Vec<u8> {
    let off_bits = 14u32 + 40;
    let size = off_bits + pixels.len() as u32;
    let mut out = Vec::with_capacity(size as usize);
    out.extend_from_slice(b"BM");
    out.extend_from_slice(&size.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&off_bits.to_le_bytes());
    out.extend_from_slice(&40u32.to_le_bytes());
    out.extend_from_slice(&w.to_le_bytes());
    out.extend_from_slice(&h.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&24u16.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(&(pixels.len() as u32).to_le_bytes());
    out.extend_from_slice(&2835u32.to_le_bytes());
    out.extend_from_slice(&2835u32.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(&0u32.to_le_bytes());
    out.extend_from_slice(pixels);
    out
}
