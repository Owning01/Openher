fn main() {
    // Embeber el icono del exe y los metadatos de Windows.
    embed_resource::compile("resources/icon.ico", embed_resource::NONE);
}
