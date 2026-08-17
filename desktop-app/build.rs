fn main() {
    if cfg!(target_os = "windows") {
        winresource::WindowsResource::new()
            .set_icon("resources/icon.ico")
            .compile()
            .expect("failed to embed Windows resource icon");
    }
}
