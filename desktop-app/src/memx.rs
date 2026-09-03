//! Memoria nativa de la app + sus WebViews (procesos `msedgewebview2.exe`
//! descendientes del nuestro: renderer del panel principal + sub-WebView del
//! browser embebido + GPU). Lo expone `GET /shell/mem` y el chip de RAM del
//! ActivityBar lo suma al JS heap (que solo mide el heap del renderer).

pub fn snapshot() -> serde_json::Value {
    #[cfg(windows)]
    return snapshot_windows();
    #[cfg(not(windows))]
    return serde_json::json!({ "ok": true, "app_rss": 0, "webview_rss": 0, "webview_procs": 0 });
}

#[cfg(windows)]
fn snapshot_windows() -> serde_json::Value {
    use std::collections::HashMap;
    use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
    use windows_sys::Win32::System::Diagnostics::ToolHelp::{
        CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W,
        TH32CS_SNAPPROCESS,
    };
    use windows_sys::Win32::System::ProcessStatus::{GetProcessMemoryInfo, PROCESS_MEMORY_COUNTERS};
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
    };

    fn rss(pid: u32) -> u64 {
        unsafe {
            let h = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
            if h.is_null() {
                return 0;
            }
            let mut c: PROCESS_MEMORY_COUNTERS = std::mem::zeroed();
            c.cb = std::mem::size_of::<PROCESS_MEMORY_COUNTERS>() as u32;
            let ok = GetProcessMemoryInfo(h, &mut c, c.cb);
            CloseHandle(h);
            if ok != 0 {
                c.WorkingSetSize as u64
            } else {
                0
            }
        }
    }

    let me = std::process::id();
    let mut ppid: HashMap<u32, u32> = HashMap::new();
    let mut names: HashMap<u32, String> = HashMap::new();
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap != INVALID_HANDLE_VALUE {
            let mut e: PROCESSENTRY32W = std::mem::zeroed();
            e.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;
            if Process32FirstW(snap, &mut e) != 0 {
                loop {
                    let pid = e.th32ProcessID;
                    let raw = &e.szExeFile;
                    let len = raw.iter().position(|&c| c == 0).unwrap_or(raw.len());
                    ppid.insert(pid, e.th32ParentProcessID);
                    names.insert(pid, String::from_utf16_lossy(&raw[..len]));
                    if Process32NextW(snap, &mut e) == 0 {
                        break;
                    }
                }
            }
            CloseHandle(snap);
        }
    }
    // ¿`pid` desciende de nuestro proceso? (camina la cadena de padres).
    let is_descendant = |mut pid: u32, ppid: &HashMap<u32, u32>| -> bool {
        for _ in 0..64 {
            match ppid.get(&pid) {
                Some(&p) if p == me => return true,
                Some(&p) if p == 0 || p == pid => return false,
                Some(&p) => pid = p,
                None => return false,
            }
        }
        false
    };

    let app_rss = rss(me);
    let mut webview_rss = 0u64;
    let mut webview_procs = 0u32;
    for (pid, name) in &names {
        if *pid != me
            && name.eq_ignore_ascii_case("msedgewebview2.exe")
            && is_descendant(*pid, &ppid)
        {
            webview_rss += rss(*pid);
            webview_procs += 1;
        }
    }
    serde_json::json!({
        "ok": true,
        "app_rss": app_rss,
        "webview_rss": webview_rss,
        "webview_procs": webview_procs,
    })
}
