//! Computer control — mouse/teclado/screenshot para agentes IA (MCP computer_use).
//! Detectable por diseño (SendInput), requiere consentimiento del usuario.
//! Solo loopback o con auth de /shell/*; no es indetectable.

use std::io::Cursor;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct MouseReq {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub action: Option<String>,
    pub button: Option<String>,
    #[serde(rename = "fromX")] pub from_x: Option<i32>,
    #[serde(rename = "fromY")] pub from_y: Option<i32>,
    #[serde(rename = "toX")] pub to_x: Option<i32>,
    #[serde(rename = "toY")] pub to_y: Option<i32>,
}
#[derive(Deserialize, Debug)]
pub struct KeyReq {
    pub key: String,
    pub action: Option<String>,
    pub mods: Option<Vec<String>>,
}
#[derive(Deserialize, Debug)]
pub struct TypeReq { pub text: String }
#[derive(Deserialize, Debug)]
pub struct ScrollReq {
    pub x: Option<i32>, pub y: Option<i32>, pub dx: Option<i32>, pub dy: Option<i32>,
    #[serde(rename = "deltaY")] pub delta_y: Option<i32>,
}
#[derive(Deserialize, Debug, Clone)]
pub struct ScreenshotOpts {
    pub width: Option<u32>,
    pub format: Option<String>,
    pub quality: Option<u8>,
    pub x: Option<i32>, pub y: Option<i32>, pub w: Option<u32>, pub h: Option<u32>,
    pub bare: Option<bool>,
    pub cursor: Option<bool>,
    pub screen: Option<u32>,
}
#[derive(Serialize, Clone, Debug)]
pub struct ScreenshotResp { pub width: u32, pub height: u32, pub image: String, pub format: String, pub etag: String, pub unchanged: bool, }
#[derive(Deserialize, Debug)]
pub struct BatchReq { pub actions: Vec<BatchAction>, pub screenshot: Option<ScreenshotOpts>, pub delay_ms: Option<u64>, pub verify: Option<VerifyOpts>, }
#[derive(Deserialize, Debug, Clone)]
#[allow(dead_code)] // timeout_ms/etag: superficie API deserializada (BatchReq.verify), reservados para polling de verify
pub struct VerifyOpts { pub expect_change: Option<bool>, pub timeout_ms: Option<u64>, pub etag: Option<String>, }
#[derive(Deserialize, Debug)]
pub struct BatchAction {
    #[serde(rename = "type")] pub atype: String,
    pub x: Option<i32>, pub y: Option<i32>, pub button: Option<String>,
    #[serde(rename = "fromX")] pub from_x: Option<i32>, #[serde(rename = "fromY")] pub from_y: Option<i32>,
    #[serde(rename = "toX")] pub to_x: Option<i32>, #[serde(rename = "toY")] pub to_y: Option<i32>,
    pub key: Option<String>, pub mods: Option<Vec<String>>, pub action: Option<String>,
    pub text: Option<String>, pub dx: Option<i32>, pub dy: Option<i32>,
}

// ---- Enigo singleton ----
use std::sync::{Mutex, LazyLock};
use enigo::{Enigo, Settings, Coordinate, Direction, Button, Key, Keyboard, Mouse, Axis};
use arboard::Clipboard;
static ENIGO: LazyLock<Mutex<Enigo>> = LazyLock::new(|| Mutex::new(Enigo::new(&Settings::default()).expect("Enigo")));
fn with_enigo<F,R>(f:F)->Result<R,String> where F:FnOnce(&mut Enigo)->Result<R,String> { let mut guard = ENIGO.lock().map_err(|e|e.to_string())?; f(&mut *guard) }

fn parse_button(s: &Option<String>) -> Button {
    match s.as_deref().unwrap_or("left").to_lowercase().as_str() {
        "right" => Button::Right, "middle" => Button::Middle, _ => Button::Left,
    }
}
fn parse_key(s: &str) -> Key {
    match s {
        "Enter" | "enter" | "Return" => Key::Return,
        "Tab" => Key::Tab,
        "Escape" | "Esc" => Key::Escape,
        "Backspace" => Key::Backspace,
        "Delete" => Key::Delete,
        "Space" | " " => Key::Space,
        "ArrowUp" | "Up" => Key::UpArrow,
        "ArrowDown" | "Down" => Key::DownArrow,
        "ArrowLeft" | "Left" => Key::LeftArrow,
        "ArrowRight" | "Right" => Key::RightArrow,
        "Home" => Key::Home, "End" => Key::End,
        "PageUp" => Key::PageUp, "PageDown" => Key::PageDown,
        "F1" => Key::F1, "F2" => Key::F2, "F3" => Key::F3, "F4" => Key::F4,
        "F5" => Key::F5, "F6" => Key::F6, "F7" => Key::F7, "F8" => Key::F8,
        "F9" => Key::F9, "F10" => Key::F10, "F11" => Key::F11, "F12" => Key::F12,
        "Shift" => Key::Shift, "Control" | "Ctrl" => Key::Control, "Alt" => Key::Alt, "Meta" | "Command" | "Win" => Key::Meta,
        s if s.len() == 1 => Key::Unicode(s.chars().next().unwrap()),
        other => Key::Unicode(other.chars().next().unwrap_or('?')),
    }
}
fn key_mods(keys: &Option<Vec<String>>) -> Vec<Key> {
    let mut out = Vec::new();
    if let Some(mods) = keys { for m in mods { match m.to_lowercase().as_str() {
        "ctrl" | "control" => out.push(Key::Control), "shift" => out.push(Key::Shift),
        "alt" => out.push(Key::Alt), "meta" | "cmd" | "win" | "super" => out.push(Key::Meta), _ => {}
    }}}
    out
}

pub fn mouse(req: &MouseReq) -> Result<(), String> {
    ensure_foreground();
    let action = req.action.as_deref().unwrap_or("click").to_lowercase();
    let button = parse_button(&req.button);
    with_enigo(|e| {
        match action.as_str() {
            "move" => { let (x,y)=(req.x.unwrap_or(0), req.y.unwrap_or(0)); enigo_move(e,x,y)?; }
            "click" => { if let (Some(x),Some(y))=(req.x,req.y){ enigo_move(e,x,y)?; } e.button(button,Direction::Click).map_err(|er|er.to_string())?; }
            "dblclick"|"double" => { if let (Some(x),Some(y))=(req.x,req.y){ enigo_move(e,x,y)?; } e.button(button,Direction::Click).map_err(|er|er.to_string())?; std::thread::sleep(std::time::Duration::from_millis(30)); e.button(button,Direction::Click).map_err(|er|er.to_string())?; }
            "down"|"press" => { if let (Some(x),Some(y))=(req.x,req.y){ enigo_move(e,x,y)?; } e.button(button,Direction::Press).map_err(|er|er.to_string())?; }
            "up"|"release" => { if let (Some(x),Some(y))=(req.x,req.y){ enigo_move(e,x,y)?; } e.button(button,Direction::Release).map_err(|er|er.to_string())?; }
            "drag" => {
                let (fx,fy)=(req.from_x.or(req.x).unwrap_or(0), req.from_y.or(req.y).unwrap_or(0));
                let (tx,ty)=(req.to_x.unwrap_or(fx+100), req.to_y.unwrap_or(fy+100));
                enigo_move(e,fx,fy)?;
                e.button(button,Direction::Press).map_err(|er|er.to_string())?;
                std::thread::sleep(std::time::Duration::from_millis(40));
                enigo_move(e,tx,ty)?;
                std::thread::sleep(std::time::Duration::from_millis(40));
                e.button(button,Direction::Release).map_err(|er|er.to_string())?;
            }
            _ => return Err(format!("action desconocida: {action}")),
        }
        Ok(())
    })
}
pub fn key(req: &KeyReq) -> Result<(), String> {
    ensure_foreground();
    let action = req.action.as_deref().unwrap_or("tap").to_lowercase();
    let k = parse_key(&req.key);
    let mods = key_mods(&req.mods);
    with_enigo(|e| {
        for m in &mods { e.key(*m, Direction::Press).map_err(|er|er.to_string())?; }
        let res = match action.as_str() {
            "down"|"press" => e.key(k, Direction::Press).map_err(|er|er.to_string()),
            "up"|"release" => e.key(k, Direction::Release).map_err(|er|er.to_string()),
            _ => e.key(k, Direction::Click).map_err(|er|er.to_string()),
        };
        for m in mods.iter().rev() { let _ = e.key(*m, Direction::Release); }
        res
    })
}
pub fn type_text(req: &TypeReq) -> Result<(), String> {
    if req.text.len() > 8192 { return Err("text too large (max 8192)".into()); }
    ensure_foreground();
    let needs_clipboard = req.text.len() > 20 || req.text.chars().any(|c| c as u32 > 127);
    if needs_clipboard {
        // guardar clipboard previo para restaurar (seguridad: no dejar password)
        let prev = Clipboard::new().ok().and_then(|mut cb| cb.get_text().ok());
        if let Ok(mut cb) = Clipboard::new() {
            if cb.set_text(req.text.clone()).is_ok() {
                std::thread::sleep(std::time::Duration::from_millis(50));
                let r = with_enigo(|e| {
                    e.key(Key::Control, Direction::Press).map_err(|er|er.to_string())?;
                    e.key(Key::Unicode('v'), Direction::Click).map_err(|er|er.to_string())?;
                    e.key(Key::Control, Direction::Release).map_err(|er|er.to_string())
                });
                // restaurar clipboard tras 200ms (si habia contenido) o limpiar
                std::thread::sleep(std::time::Duration::from_millis(100));
                if let Ok(mut cb2) = Clipboard::new() {
                    if let Some(old) = prev { let _ = cb2.set_text(old); } else { let _ = cb2.set_text(String::new()); }
                }
                return r;
            }
        }
    }
    with_enigo(|e| e.text(&req.text).map_err(|er|er.to_string()))
}
pub fn scroll(req: &ScrollReq) -> Result<(), String> {
    ensure_foreground();
    let dy = req.dy.or(req.delta_y).unwrap_or(0);
    let dx = req.dx.unwrap_or(0);
    with_enigo(|e| {
        if let (Some(x),Some(y))=(req.x,req.y){ enigo_move(e,x,y)?; }
        if dy != 0 {
            let steps = (dy / 100).clamp(-10,10);
            let steps = if steps==0 && dy!=0 { dy.signum() } else { steps };
            e.scroll(-steps, Axis::Vertical).map_err(|er|er.to_string())?;
        }
        if dx != 0 {
            let steps = (dx / 100).clamp(-10,10);
            let steps = if steps==0 && dx!=0 { dx.signum() } else { steps };
            e.scroll(steps, Axis::Horizontal).map_err(|er|er.to_string())?;
        }
        Ok(())
    })
}

fn hash_bytes(b:&[u8])->String{ let mut h:u64=14695981039346656037; for &x in b{ h ^= x as u64; h = h.wrapping_mul(1099511628211);} format!("{:016x}",h)}
static CACHE_ETAG: Mutex<Option<String>> = Mutex::new(None);
static CACHE_RESP: Mutex<Option<ScreenshotResp>> = Mutex::new(None);
static CACHE_TS: Mutex<u64> = Mutex::new(0);
// P0 escala: guardar último screenshot para re-escalar clicks (display 800 -> screen 2048)
static LAST_SCREEN_W: Mutex<u32> = Mutex::new(0);
static LAST_SCREEN_H: Mutex<u32> = Mutex::new(0);
static LAST_DISPLAY_W: Mutex<u32> = Mutex::new(0);
static LAST_DISPLAY_H: Mutex<u32> = Mutex::new(0);
static LAST_OFFSET_X: Mutex<i32> = Mutex::new(0);
static LAST_OFFSET_Y: Mutex<i32> = Mutex::new(0);
static PINNED_SCREEN: Mutex<Option<usize>> = Mutex::new(None);
fn scale_coords(x:i32,y:i32)->(i32,i32){
    let sw = LAST_SCREEN_W.lock().ok().map(|v| *v).unwrap_or(0);
    let sh = LAST_SCREEN_H.lock().ok().map(|v| *v).unwrap_or(0);
    let dw = LAST_DISPLAY_W.lock().ok().map(|v| *v).unwrap_or(0);
    let dh = LAST_DISPLAY_H.lock().ok().map(|v| *v).unwrap_or(0);
    let ox = LAST_OFFSET_X.lock().ok().map(|v| *v).unwrap_or(0);
    let oy = LAST_OFFSET_Y.lock().ok().map(|v| *v).unwrap_or(0);
    if sw>0 && dw>0 && sw!=dw && x>=0 && x < dw as i32 && y>=0 && y < dh as i32 {
        let sx = sw as f32 / dw as f32;
        let sy = sh as f32 / dh as f32;
        return ((x as f32 * sx) as i32 + ox, (y as f32 * sy) as i32 + oy);
    }
    if ox!=0 || oy!=0 { return (x+ox, y+oy); }
    (x,y)
}
fn enigo_move(e:&mut Enigo,x:i32,y:i32)->Result<(),String>{
    let (sx,sy)=scale_coords(x,y);
    let jx = ((now_ms() % 7) as i32) - 3;
    let jy = ((now_ms() % 7) as i32) - 3;
    let tx = (sx + jx).clamp(0, 8000);
    let ty = (sy + jy).clamp(0, 8000);
    // bezier 12 pasos con smoothstep (no linea recta, menos detectable)
    let (cx, cy) = e.location().unwrap_or((tx, ty));
    let steps = 12;
    for i in 1..=steps {
        let t = i as f32 / steps as f32;
        let smooth = t*t*(3.0 - 2.0*t);
        let mx = (cx as f32 + (tx as f32 - cx as f32) * smooth) as i32;
        let my = (cy as f32 + (ty as f32 - cy as f32) * smooth) as i32;
        // jitter leve en puntos intermedios
        let jx2 = if i < steps { ((now_ms() % 3) as i32)-1 } else { 0 };
        let jy2 = if i < steps { ((now_ms() % 3) as i32)-1 } else { 0 };
        let _ = e.move_mouse(mx + jx2, my + jy2, Coordinate::Abs);
        if i < steps { std::thread::sleep(std::time::Duration::from_millis(6)); }
    }
    e.move_mouse(tx, ty, Coordinate::Abs).map_err(|er|er.to_string())
}
#[cfg(windows)]
fn ensure_foreground(){
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowThreadProcessId, SetForegroundWindow, BringWindowToTop, IsIconic, ShowWindow};
        use windows_sys::Win32::System::Threading::{AttachThreadInput, GetCurrentThreadId};
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() { return; }
        if IsIconic(hwnd)!=0 { ShowWindow(hwnd, 9); }
        let fg_thread = GetWindowThreadProcessId(hwnd, std::ptr::null_mut());
        let cur_thread = GetCurrentThreadId();
        AttachThreadInput(fg_thread, cur_thread, 1);
        BringWindowToTop(hwnd);
        SetForegroundWindow(hwnd);
        AttachThreadInput(fg_thread, cur_thread, 0);
    }
}
#[cfg(not(windows))]
fn ensure_foreground(){}


#[cfg(windows)]
pub fn find_element(name: &str, timeout_ms: u64) -> Result<Option<(i32,i32,i32,i32)>, String> {
    use std::time::{Duration, Instant};
    let start = Instant::now();
    let timeout = Duration::from_millis(timeout_ms.max(500).min(10000));
    while start.elapsed() < timeout {
        if let Some(rect) = find_element_once(name) { return Ok(Some(rect)); }
        std::thread::sleep(Duration::from_millis(150));
    }
    Ok(None)
}
#[cfg(windows)]
fn find_element_once(name: &str) -> Option<(i32,i32,i32,i32)> {
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{EnumWindows, GetWindowTextW, IsWindowVisible, GetWindowRect};
        use windows_sys::Win32::Foundation::{BOOL, HWND, RECT, LPARAM};
        use std::sync::Mutex;
        static FOUND: Mutex<Option<(i32,i32,i32,i32)>> = Mutex::new(None);
        static TARGET: Mutex<String> = Mutex::new(String::new());
        *TARGET.lock().unwrap_or_else(|e| e.into_inner()) = name.to_lowercase();
        unsafe extern "system" fn enum_proc(hwnd: HWND, _: LPARAM) -> BOOL {
            if IsWindowVisible(hwnd)==0 { return 1; }
            let mut buf = [0u16; 512];
            let len = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
            if len > 0 {
                let s = String::from_utf16_lossy(&buf[..len as usize]).to_lowercase();
                let target = TARGET.lock().unwrap_or_else(|e| e.into_inner()).clone();
                if s.contains(&target) {
                    let mut r = RECT{left:0,top:0,right:0,bottom:0};
                    if GetWindowRect(hwnd, &mut r) != 0 {
                        *FOUND.lock().unwrap_or_else(|e| e.into_inner()) = Some((r.left, r.top, r.right - r.left, r.bottom - r.top));
                        return 0;
                    }
                }
            }
            1
        }
        *FOUND.lock().unwrap_or_else(|e| e.into_inner()) = None;
        EnumWindows(Some(enum_proc), 0);
        *FOUND.lock().unwrap_or_else(|e| e.into_inner())
    }
}
#[cfg(not(windows))]
pub fn find_element(_name: &str, _timeout_ms: u64) -> Result<Option<(i32,i32,i32,i32)>, String> { Ok(None) }

#[cfg(windows)]
pub fn list_windows(filter: Option<String>) -> Vec<(String,i32,i32,i32,i32)> {
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{EnumWindows, GetWindowTextW, IsWindowVisible, GetWindowRect};
        use windows_sys::Win32::Foundation::{BOOL, HWND, RECT, LPARAM};
        use std::sync::Mutex;
        static OUT: Mutex<Vec<(String,i32,i32,i32,i32)>> = Mutex::new(Vec::new());
        static FILT: Mutex<Option<String>> = Mutex::new(None);
        *FILT.lock().unwrap_or_else(|e| e.into_inner()) = filter.map(|s| s.to_lowercase());
        *OUT.lock().unwrap_or_else(|e| e.into_inner()) = Vec::new();
        unsafe extern "system" fn enum2(hwnd: HWND, _: LPARAM) -> BOOL {
            if IsWindowVisible(hwnd)==0 { return 1; }
            let mut buf=[0u16;512];
            let len=GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
            if len>0 {
                let s=String::from_utf16_lossy(&buf[..len as usize]);
                if let Some(ref f)=*FILT.lock().unwrap_or_else(|e| e.into_inner()){ if !s.to_lowercase().contains(f) { return 1; } }
                let mut r=RECT{left:0,top:0,right:0,bottom:0};
                if GetWindowRect(hwnd,&mut r)!=0 {
                    OUT.lock().unwrap_or_else(|e| e.into_inner()).push((s, r.left, r.top, r.right - r.left, r.bottom - r.top));
                }
            }
            1
        }
        EnumWindows(Some(enum2),0);
        OUT.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }
}
#[cfg(not(windows))]
pub fn list_windows(_filter: Option<String>) -> Vec<(String,i32,i32,i32,i32)> { Vec::new() }

#[cfg(windows)]
fn detect_best_screen(screens: &[screenshots::Screen]) -> usize {
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowRect};
    use windows_sys::Win32::Foundation::RECT;
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() { return 0; }
        let mut rect = RECT { left: 0, top: 0, right: 0, bottom: 0 };
        if GetWindowRect(hwnd, &mut rect) == 0 { return 0; }
        let cx = (rect.left + rect.right) / 2;
        let cy = (rect.top + rect.bottom) / 2;
        for (i, s) in screens.iter().enumerate() {
            let di = s.display_info;
            if cx >= di.x && cx < di.x + di.width as i32 && cy >= di.y && cy < di.y + di.height as i32 {
                return i;
            }
        }
    }
    0
}
#[cfg(not(windows))]
fn detect_best_screen(_: &[screenshots::Screen]) -> usize { 0 }

fn now_ms()->u64{ std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d|d.as_millis() as u64).unwrap_or(0) }

fn screenshot_inner2(opts:&ScreenshotOpts, etag_in:Option<String>)->Result<ScreenshotResp,String>{
  // cache hit por etag cliente (sin recapturar, solo si etag coincide con ultimo)
  if let Some(ref etag) = etag_in {
      if let Ok(cache) = CACHE_ETAG.lock() { if let Some(ref last) = *cache { if last==etag {
          if let Ok(resp_cache) = CACHE_RESP.lock() { if let Some(ref r)=*resp_cache {
              return Ok(ScreenshotResp{width:r.width,height:r.height,image:String::new(),format:r.format.clone(),etag:r.etag.clone(),unchanged:true});
          }}
      }}}
  }
  let screens=screenshots::Screen::all().map_err(|e|format!("Screen::all: {e}"))?;
  let idx = {
      let pinned_opt = PINNED_SCREEN.lock().ok().and_then(|g| *g);
      if let Some(pinned) = pinned_opt {
          if opts.screen.is_none() { pinned } else { opts.screen.unwrap() as usize }
      } else {
          let i = opts.screen.map(|v| v as usize).unwrap_or_else(|| detect_best_screen(&screens));
          if let Ok(mut g) = PINNED_SCREEN.lock() { *g = Some(i); }
          i
      }
  };
  let screen = screens.into_iter().nth(idx).or_else(|| screenshots::Screen::all().ok().and_then(|v|v.into_iter().next())).ok_or("no screen")?;
  // captura
  let (w,h,buf):(u32,u32,Vec<u8>) = if let (Some(x),Some(y),Some(rw),Some(rh))=(opts.x,opts.y,opts.w,opts.h){
      let img=screen.capture_area(x,y,rw,rh).map_err(|e|format!("capture_area: {e}"))?;
      (img.width(), img.height(), img.into_raw())
  } else {
      let img=screen.capture().map_err(|e|format!("capture: {e}"))?;
      (img.width(), img.height(), img.into_raw())
  };
  // overlay cursor si pedido y es fullscreen (no region)
  let buf_owned = buf;
  let fmt=opts.format.as_deref().unwrap_or("jpeg").to_lowercase();
  let quality=opts.quality.unwrap_or(75).clamp(10,95);
  let target_w=opts.width.unwrap_or(0);
  // decidir resize / conversion sin clones innecesarios
  let (out_w, out_h, rgba_for_encode): (u32,u32, image::RgbaImage) = if target_w>0 && target_w < w && target_w>=160 {
      let scale=target_w as f32 / w as f32;
      let th=(h as f32*scale) as u32;
      // from_raw consume buf_owned sin clone
      let rgba=image::RgbaImage::from_raw(w,h,buf_owned).ok_or("from_raw")?;
      // CatmullRom mas nitido para texto que Triangle, sin perdida
      let resized=image::imageops::resize(&rgba, target_w, th, image::imageops::FilterType::CatmullRom);
      (target_w, th, resized)
  } else {
      // sin resize: crear RgbaImage directo desde buf_owned
      let rgba=image::RgbaImage::from_raw(w,h,buf_owned).ok_or("from_raw")?;
      (w, h, rgba)
  };
  // P0: guardar escala y offset para re-escalar clicks (display 800 -> screen 2048) + monitores
  if opts.x.is_none() {
      if let Ok(mut c)=LAST_SCREEN_W.lock(){ *c=w; }
      if let Ok(mut c)=LAST_SCREEN_H.lock(){ *c=h; }
      if let Ok(mut c)=LAST_DISPLAY_W.lock(){ *c=out_w; }
      if let Ok(mut c)=LAST_DISPLAY_H.lock(){ *c=out_h; }
      // offset del monitor capturado
      let ox = screen.display_info.x;
      let oy = screen.display_info.y;
      if let Ok(mut c)=LAST_OFFSET_X.lock(){ *c=ox; }
      if let Ok(mut c)=LAST_OFFSET_Y.lock(){ *c=oy; }
  }
  // cursor overlay: dibujar si opts.cursor==true y tenemos coords
  let mut final_rgba = rgba_for_encode;
  if opts.cursor.unwrap_or(false) {
      if let Ok((cx, cy)) = with_enigo(|e| e.location().map_err(|er|er.to_string())) {
          // mapear cursor global a imagen local
          // si hubo resize, escalar
          let (img_cx, img_cy) = if opts.x.is_some() && opts.w.is_some() {
              // region: offset
              let ox = opts.x.unwrap_or(0);
              let oy = opts.y.unwrap_or(0);
              let sx = if target_w>0 && target_w < w { target_w as f32 / w as f32 } else { 1.0 };
              (((cx - ox) as f32 * sx) as i32, ((cy - oy) as f32 * sx) as i32)
          } else if target_w>0 && target_w < w {
              let scale = target_w as f32 / w as f32;
              ((cx as f32 * scale) as i32, (cy as f32 * scale) as i32)
          } else {
              (cx, cy)
          };
          // dibujar cruz 18px + circulo
          let (iw, ih) = final_rgba.dimensions();
          for dy in -9..=9 { for dx in -9..=9 {
              let x = img_cx + dx; let y = img_cy + dy;
              if x>=0 && y>=0 && (x as u32) < iw && (y as u32) < ih {
                  let dist = ((dx*dx + dy*dy) as f32).sqrt();
                  let is_ring = dist > 7.0 && dist < 9.0;
                  let is_cross = (dx==0 || dy==0) && dist < 9.0;
                  if is_ring || is_cross {
                      let px = final_rgba.get_pixel_mut(x as u32, y as u32);
                      *px = image::Rgba([255, 30, 30, 255]);
                  }
              }
          }}
      }
  }
  let mut out:Vec<u8>=Vec::new();
  if fmt=="jpeg"||fmt=="jpg"{
      let mut enc=image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, quality);
      enc.encode_image(&image::DynamicImage::ImageRgba8(final_rgba)).map_err(|e|e.to_string())?;
  } else {
      let dyn_img=image::DynamicImage::ImageRgba8(final_rgba);
      dyn_img.write_to(&mut Cursor::new(&mut out), image::ImageFormat::Png).map_err(|e|e.to_string())?;
  }
  let etag=hash_bytes(&out);
  if let Some(e)=etag_in{ if e==etag {
      return Ok(ScreenshotResp{width:out_w,height:out_h,image:String::new(),format:if fmt=="jpeg"||fmt=="jpg" {"jpeg".into()} else {"png".into()},etag:etag.clone(),unchanged:true});
  }}
  let b64=crate::state::base64_encode(&out);
  let mime=if fmt=="jpeg"||fmt=="jpg" {"jpeg"} else {"png"};
  let img_str=if opts.bare.unwrap_or(false){ b64 } else { format!("data:image/{mime};base64,{b64}")};
  let resp=ScreenshotResp{width:out_w,height:out_h,image:img_str,format:mime.into(),etag:etag.clone(),unchanged:false};
  // guardar cache
  if let Ok(mut c)=CACHE_ETAG.lock(){ *c=Some(etag.clone()); }
  if let Ok(mut c)=CACHE_RESP.lock(){ *c=Some(resp.clone()); }
  if let Ok(mut c)=CACHE_TS.lock(){ *c=now_ms(); }
  Ok(resp)
}
pub fn batch(req:&BatchReq)->Result<Option<ScreenshotResp>,String>{
  let delay=req.delay_ms.unwrap_or(8);
  for a in &req.actions{ match a.atype.as_str(){
    "click"|"move"|"dblclick"|"down"|"up"|"drag"=>{ let mr=MouseReq{x:a.x,y:a.y,action:Some(a.atype.clone()),button:a.button.clone(),from_x:a.from_x,from_y:a.from_y,to_x:a.to_x,to_y:a.to_y}; mouse(&mr)?; },
    "key"=>{ let kr=KeyReq{key:a.key.clone().unwrap_or("Enter".into()),action:a.action.clone(),mods:a.mods.clone()}; key(&kr)?; },
    "type"=>{ let tr=TypeReq{text:a.text.clone().unwrap_or_default()}; type_text(&tr)?; },
    "scroll"=>{ let sr=ScrollReq{x:a.x,y:a.y,dx:a.dx,dy:a.dy,delta_y:None}; scroll(&sr)?; },
    _=>return Err(format!("batch unknown type {}",a.atype)),
  } if delay>0{ std::thread::sleep(std::time::Duration::from_millis(delay)); } }
  let needs_shot = if let Some(v)=&req.verify { v.expect_change.unwrap_or(true) } else { req.screenshot.is_some() };
  if !needs_shot { return Ok(None); }
  if let Some(opts)=&req.screenshot{ Ok(Some(screenshot_inner2(opts,None)?)) } else { Ok(None) }
}
pub fn screenshot_v2(opts:&ScreenshotOpts, etag:Option<String>)->Result<ScreenshotResp,String>{ screenshot_inner2(opts, etag) }
