fn main() {
    println!("cargo:rerun-if-changed=assets/icon.ico");
    println!("cargo:rerun-if-changed=assets/app.rc");
    if std::env::var("CARGO_CFG_WINDOWS").is_ok() {
        embed_resource::compile("assets/app.rc", embed_resource::NONE);
    }
}
