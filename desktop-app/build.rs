fn main() {
    if cfg!(target_os = "windows") {
        winresource::WindowsResource::new()
            .set_icon("resources/icon.ico")
            .compile()
            .expect("failed to embed Windows resource icon");
    }
    // BUILD_ID: invalida la caché del WebView2 ante cachés envenenadas
    // (entradas viejas con max-age). La URL inicial lleva ?v=BUILD_ID y cada
    // build genera una clave de caché nueva sin tocar el perfil en disco.
    let build_id = std::process::Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| format!("{}", std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0)));
    println!("cargo:rustc-env=OPENHER_BUILD_ID={build_id}");
}
