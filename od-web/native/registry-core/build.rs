[package]
name = "registry-core"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
napi = { version = "2", default-features = false, features = ["async"] }
napi-derive = "2"

[build-dependencies]
napi-build = "2"
