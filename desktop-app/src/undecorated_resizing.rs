//! Soporte nativo para redimensionamiento de ventanas frameless (undecorated) en Windows.
//! Basado en el patrón de ventana hija con región recortada (cutout region) probado en Tauri.
//!
//! Dado que WebView2 cubre el área cliente con un proceso Chromium separado que consume
//! los eventos de ratón, esta ventana hija nativa de Win32 se coloca encima (HWND_TOP)
//! con un hueco en el centro (`SetWindowRgn` con `RGN_DIFF`). El 99% central de la ventana
//! es transparente para el ratón (pasa directo a WebView2) y solo los 8px del borde/esquinas
//! reciben WM_NCHITTEST y WM_NCLBUTTONDOWN nativamente.

#[cfg(windows)]
mod windows_impl {
    use core::ffi::c_void;
    use core::ptr::null_mut;
    use windows_sys::Win32::Foundation::HWND;
    use windows_sys::Win32::Graphics::Gdi::{
        CombineRgn, CreateRectRgn, DeleteObject, SetWindowRgn, RGN_DIFF,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        CreateWindowExW, DefWindowProcW, DestroyWindow, FindWindowExW, GetClientRect,
        GetParent, GetSystemMetrics, GetWindowLongPtrW, GetWindowRect, IsZoomed,
        PostMessageW, RegisterClassExW, SetWindowLongPtrW, SetWindowPos, GWLP_USERDATA,
        GWL_STYLE, HTBOTTOM, HTBOTTOMLEFT, HTBOTTOMRIGHT, HTLEFT, HTRIGHT, HTTOP,
        HTTOPLEFT, HTTOPRIGHT, HTTRANSPARENT, SM_CXFRAME, SM_CXSIZEFRAME,
        SM_CYFRAME, SM_CYSIZEFRAME, SWP_ASYNCWINDOWPOS, SWP_NOACTIVATE, SWP_NOMOVE,
        SWP_NOOWNERZORDER, SWP_NOSIZE, WM_CREATE, WM_NCDESTROY, WM_NCHITTEST,
        WM_NCLBUTTONDOWN, WM_SIZE, WNDCLASSEXW, WS_CHILD, WS_CLIPSIBLINGS, WS_SIZEBOX,
        WS_VISIBLE,
    };

    const CLASS_NAME: &[u16] = &[
        'O' as u16, 'P' as u16, 'E' as u16, 'N' as u16, 'H' as u16, 'E' as u16, 'R' as u16,
        '_' as u16, 'R' as u16, 'E' as u16, 'S' as u16, 'I' as u16, 'Z' as u16, 'E' as u16,
        '_' as u16, 'B' as u16, 'O' as u16, 'R' as u16, 'D' as u16, 'E' as u16, 'R' as u16,
        'S' as u16, 0,
    ];
    const WINDOW_NAME: &[u16] = &[
        'O' as u16, 'P' as u16, 'E' as u16, 'N' as u16, 'H' as u16, 'E' as u16, 'R' as u16,
        '_' as u16, 'R' as u16, 'E' as u16, 'S' as u16, 'I' as u16, 'Z' as u16, 'E' as u16,
        '_' as u16, 'W' as u16, 'I' as u16, 'N' as u16, 'D' as u16, 'O' as u16, 'W' as u16,
        0,
    ];

    #[derive(Debug, PartialEq, Eq, Clone, Copy)]
    enum HitTestResult {
        Client,
        Left,
        Right,
        Top,
        Bottom,
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight,
        NoWhere,
    }

    impl HitTestResult {
        fn to_win32(self) -> isize {
            match self {
                HitTestResult::Left => HTLEFT as isize,
                HitTestResult::Right => HTRIGHT as isize,
                HitTestResult::Top => HTTOP as isize,
                HitTestResult::Bottom => HTBOTTOM as isize,
                HitTestResult::TopLeft => HTTOPLEFT as isize,
                HitTestResult::TopRight => HTTOPRIGHT as isize,
                HitTestResult::BottomLeft => HTBOTTOMLEFT as isize,
                HitTestResult::BottomRight => HTBOTTOMRIGHT as isize,
                _ => HTTRANSPARENT as isize,
            }
        }
    }

    fn hit_test(
        left: i32,
        top: i32,
        right: i32,
        bottom: i32,
        cx: i32,
        cy: i32,
        border_x: i32,
        border_y: i32,
    ) -> HitTestResult {
        let is_left = cx < left + border_x;
        let is_right = cx >= right - border_x;
        let is_top = cy < top + border_y;
        let is_bottom = cy >= bottom - border_y;

        if is_top && is_left {
            HitTestResult::TopLeft
        } else if is_top && is_right {
            HitTestResult::TopRight
        } else if is_bottom && is_left {
            HitTestResult::BottomLeft
        } else if is_bottom && is_right {
            HitTestResult::BottomRight
        } else if is_left {
            HitTestResult::Left
        } else if is_right {
            HitTestResult::Right
        } else if is_top {
            HitTestResult::Top
        } else if is_bottom {
            HitTestResult::Bottom
        } else {
            HitTestResult::Client
        }
    }

    struct UndecoratedResizingData {
        child: HWND,
    }

    unsafe fn get_border_sizes(hwnd: HWND) -> (i32, i32) {
        #[cfg(windows)]
        {
            use windows_sys::Win32::UI::HiDpi::GetDpiForWindow;
            let dpi = GetDpiForWindow(hwnd);
            if dpi > 0 {
                let scale = dpi as f32 / 96.0;
                let bx = (8.0 * scale).round() as i32;
                let by = (8.0 * scale).round() as i32;
                return (bx.max(6), by.max(6));
            }
        }
        let bx = GetSystemMetrics(SM_CXSIZEFRAME).max(GetSystemMetrics(SM_CXFRAME)).max(8);
        let by = GetSystemMetrics(SM_CYSIZEFRAME).max(GetSystemMetrics(SM_CYFRAME)).max(8);
        (bx, by)
    }

    unsafe fn set_drag_hwnd_rgn(hwnd: HWND, width: i32, height: i32) {
        if width <= 0 || height <= 0 {
            return;
        }
        let (border_x, border_y) = get_border_sizes(hwnd);

        // Región completa de la ventana
        let hrgn_full = CreateRectRgn(0, 0, width, height);
        if hrgn_full.is_null() {
            return;
        }

        // Rectángulo interior que se recorta (donde está WebView2)
        let x1 = border_x;
        let y1 = border_y;
        let x2 = (width - border_x).max(x1);
        let y2 = (height - border_y).max(y1);

        let hrgn_inner = CreateRectRgn(x1, y1, x2, y2);
        if hrgn_inner.is_null() {
            DeleteObject(hrgn_full);
            return;
        }

        // Restar el centro: hrgn_full queda únicamente con el borde perimetral
        CombineRgn(hrgn_full, hrgn_full, hrgn_inner, RGN_DIFF);
        DeleteObject(hrgn_inner);

        // Asignar al HWND (el SO toma ownership de hrgn_full si SetWindowRgn tiene éxito)
        if SetWindowRgn(hwnd, hrgn_full, 1) == 0 {
            DeleteObject(hrgn_full);
        }
    }

    unsafe extern "system" fn drag_resize_window_proc(
        child: HWND,
        msg: u32,
        wparam: usize,
        lparam: isize,
    ) -> isize {
        match msg {
            WM_CREATE => {
                let cs = lparam as *const windows_sys::Win32::UI::WindowsAndMessaging::CREATESTRUCTW;
                if !cs.is_null() {
                    let data = (*cs).lpCreateParams as *mut UndecoratedResizingData;
                    if !data.is_null() {
                        (*data).child = child;
                        SetWindowLongPtrW(child, GWLP_USERDATA, data as isize);
                    }
                }
                0
            }
            WM_NCHITTEST => {
                let parent = GetParent(child);
                if parent.is_null() {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }
                if IsZoomed(parent) != 0 {
                    return HTTRANSPARENT as isize;
                }
                let style = GetWindowLongPtrW(parent, GWL_STYLE);
                let is_resizable = (style as u32 & WS_SIZEBOX) != 0;
                if !is_resizable {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }

                let mut rect = core::mem::zeroed::<windows_sys::Win32::Foundation::RECT>();
                if GetWindowRect(child, &mut rect) == 0 {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }

                let cx = (lparam & 0xFFFF) as i16 as i32;
                let cy = ((lparam >> 16) & 0xFFFF) as i16 as i32;
                let (border_x, border_y) = get_border_sizes(child);

                let res = hit_test(
                    rect.left,
                    rect.top,
                    rect.right,
                    rect.bottom,
                    cx,
                    cy,
                    border_x,
                    border_y,
                );

                res.to_win32()
            }
            WM_NCLBUTTONDOWN => {
                let parent = GetParent(child);
                if parent.is_null() {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }
                if IsZoomed(parent) != 0 {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }

                let mut rect = core::mem::zeroed::<windows_sys::Win32::Foundation::RECT>();
                if GetWindowRect(child, &mut rect) == 0 {
                    return DefWindowProcW(child, msg, wparam, lparam);
                }

                let cx = (lparam & 0xFFFF) as i16 as i32;
                let cy = ((lparam >> 16) & 0xFFFF) as i16 as i32;
                let (border_x, border_y) = get_border_sizes(child);

                let res = hit_test(
                    rect.left,
                    rect.top,
                    rect.right,
                    rect.bottom,
                    cx,
                    cy,
                    border_x,
                    border_y,
                );

                if res != HitTestResult::NoWhere && res != HitTestResult::Client {
                    let points = (((cy as i16 as u32) << 16) | (cx as i16 as u32 & 0xFFFF)) as isize;
                    PostMessageW(parent, WM_NCLBUTTONDOWN, res.to_win32() as usize, points);
                }
                0
            }
            WM_SIZE => {
                let width = (lparam & 0xFFFF) as i16 as i32;
                let height = ((lparam >> 16) & 0xFFFF) as i16 as i32;
                let parent = GetParent(child);
                if !parent.is_null() && IsZoomed(parent) == 0 {
                    set_drag_hwnd_rgn(child, width, height);
                }
                0
            }
            WM_NCDESTROY => {
                let data = GetWindowLongPtrW(child, GWLP_USERDATA) as *mut UndecoratedResizingData;
                if !data.is_null() {
                    drop(Box::from_raw(data));
                    SetWindowLongPtrW(child, GWLP_USERDATA, 0);
                }
                0
            }
            _ => DefWindowProcW(child, msg, wparam, lparam),
        }
    }

    pub fn attach_resize_handler(hwnd: isize) {
        let parent = hwnd as HWND;
        if parent.is_null() {
            return;
        }

        unsafe {
            // Si ya existe la ventana hija de resize, salir
            let existing = FindWindowExW(
                parent,
                null_mut(),
                CLASS_NAME.as_ptr(),
                WINDOW_NAME.as_ptr(),
            );
            if !existing.is_null() {
                return;
            }

            let class = WNDCLASSEXW {
                cbSize: core::mem::size_of::<WNDCLASSEXW>() as u32,
                style: 0,
                lpfnWndProc: Some(drag_resize_window_proc),
                cbClsExtra: 0,
                cbWndExtra: 0,
                hInstance: null_mut(),
                hIcon: null_mut(),
                hCursor: null_mut(),
                hbrBackground: null_mut(),
                lpszMenuName: core::ptr::null(),
                lpszClassName: CLASS_NAME.as_ptr(),
                hIconSm: null_mut(),
            };

            RegisterClassExW(&class);

            let mut rect = core::mem::zeroed::<windows_sys::Win32::Foundation::RECT>();
            if GetClientRect(parent, &mut rect) == 0 {
                return;
            }
            let width = rect.right - rect.left;
            let height = rect.bottom - rect.top;

            let data = Box::new(UndecoratedResizingData { child: null_mut() });

            let drag_window = CreateWindowExW(
                0,
                CLASS_NAME.as_ptr(),
                WINDOW_NAME.as_ptr(),
                WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS,
                0,
                0,
                width,
                height,
                parent,
                null_mut(),
                null_mut(),
                Box::into_raw(data) as *const c_void,
            );

            if drag_window.is_null() {
                return;
            }

            set_drag_hwnd_rgn(drag_window, width, height);

            SetWindowPos(
                drag_window,
                null_mut(), // HWND_TOP
                0,
                0,
                0,
                0,
                SWP_ASYNCWINDOWPOS | SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOOWNERZORDER | SWP_NOSIZE,
            );
        }
    }

    pub fn update_resize_handler(hwnd: isize, width: u32, height: u32, is_maximized: bool) {
        let parent = hwnd as HWND;
        if parent.is_null() {
            return;
        }

        unsafe {
            let child = FindWindowExW(
                parent,
                null_mut(),
                CLASS_NAME.as_ptr(),
                WINDOW_NAME.as_ptr(),
            );
            if child.is_null() {
                return;
            }

            if is_maximized {
                SetWindowRgn(child, null_mut(), 1);
                SetWindowPos(
                    child,
                    null_mut(),
                    0,
                    0,
                    0,
                    0,
                    SWP_ASYNCWINDOWPOS | SWP_NOACTIVATE | SWP_NOOWNERZORDER | SWP_NOMOVE,
                );
            } else {
                let w = width as i32;
                let h = height as i32;
                SetWindowPos(
                    child,
                    null_mut(),
                    0,
                    0,
                    w,
                    h,
                    SWP_ASYNCWINDOWPOS | SWP_NOACTIVATE | SWP_NOOWNERZORDER | SWP_NOMOVE,
                );
                set_drag_hwnd_rgn(child, w, h);
            }
        }
    }

    #[allow(dead_code)]
    pub fn detach_resize_handler(hwnd: isize) {
        let parent = hwnd as HWND;
        if parent.is_null() {
            return;
        }
        unsafe {
            let child = FindWindowExW(
                parent,
                null_mut(),
                CLASS_NAME.as_ptr(),
                WINDOW_NAME.as_ptr(),
            );
            if !child.is_null() {
                DestroyWindow(child);
            }
        }
    }
}

#[cfg(windows)]
pub use windows_impl::*;

#[cfg(not(windows))]
pub fn attach_resize_handler(_hwnd: isize) {}

#[cfg(not(windows))]
pub fn update_resize_handler(_hwnd: isize, _width: u32, _height: u32, _is_maximized: bool) {}

#[cfg(not(windows))]
pub fn detach_resize_handler(_hwnd: isize) {}

