//! Genera el logo de OpenCode Stats: PNG + ICO. Port de tools/make_icon.py.
use std::path::PathBuf;

const SS: usize = 4;
type Rgb = (u8, u8, u8);
const BG_TOP: Rgb = (13, 20, 32);
const BG_BOT: Rgb = (24, 34, 54);
const RING: Rgb = (51, 65, 85);
const BARS: [(Rgb, Rgb); 3] = [
    ((79, 141, 249), (37, 99, 235)),
    ((74, 222, 128), (22, 163, 74)),
    ((251, 191, 36), (217, 119, 6)),
];
const BAR_W: f64 = 30.0;
const BAR_GAP: f64 = 12.0;
const BASE_Y: f64 = 220.0;
const RADIUS: f64 = 15.0;
const BAR_H: [f64; 3] = [120.0, 168.0, 96.0];
const BOX_X0: f64 = 8.0;
const BOX_X1: f64 = 248.0;
const BOX_Y0: f64 = 8.0;
const BOX_Y1: f64 = 248.0;
const CORNER: f64 = 52.0;

fn lerp(a: (u8, u8, u8), b: (u8, u8, u8), t: f64) -> (u8, u8, u8) {
    (
        (a.0 as f64 + (b.0 as f64 - a.0 as f64) * t).round() as u8,
        (a.1 as f64 + (b.1 as f64 - a.1 as f64) * t).round() as u8,
        (a.2 as f64 + (b.2 as f64 - a.2 as f64) * t).round() as u8,
    )
}

fn in_rounded(x: f64, y: f64, x0: f64, y0: f64, x1: f64, y1: f64, r: f64) -> bool {
    if !(x0 <= x && x <= x1 && y0 <= y && y <= y1) {
        return false;
    }
    let cx = x.max(x0 + r).min(x1 - r);
    let cy = y.max(y0 + r).min(y1 - r);
    (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r
}

fn render(size: usize) -> Vec<u8> {
    let s = size as f64 / 256.0;
    let n = size * SS;
    let mut px = vec![0u8; n * n * 4];
    let g = |v: f64| (v * s * SS as f64).round() as usize;

    for y in 0..n {
        let t = y as f64 / n as f64;
        let bg = lerp(BG_TOP, BG_BOT, t);
        for x in 0..n {
            let i = (y * n + x) * 4;
            px[i] = bg.0;
            px[i + 1] = bg.1;
            px[i + 2] = bg.2;
            px[i + 3] = 255;
        }
    }
    let r_outer = g(CORNER) as f64;
    let r_inner = (r_outer - (1.5 * s * SS as f64).round()).max(1.0);
    let (bx0, by0, bx1, by1) = (
        g(BOX_X0) as f64,
        g(BOX_Y0) as f64,
        g(BOX_X1) as f64,
        g(BOX_Y1) as f64,
    );
    for y in 0..n {
        for x in 0..n {
            let i = (y * n + x) * 4;
            if !in_rounded(x as f64, y as f64, bx0, by0, bx1, by1, r_outer) {
                px[i] = 0;
                px[i + 1] = 0;
                px[i + 2] = 0;
                px[i + 3] = 0;
            } else if !in_rounded(x as f64, y as f64, bx0, by0, bx1, by1, r_inner) {
                px[i] = RING.0;
                px[i + 1] = RING.1;
                px[i + 2] = RING.2;
            }
        }
    }
    let total_w = BARS.len() as f64 * BAR_W + (BARS.len() as f64 - 1.0) * BAR_GAP;
    let start_x = (256.0 - total_w) / 2.0;
    for (i, ((top, bot), h)) in BARS.iter().zip(BAR_H.iter()).enumerate() {
        let x0 = start_x + i as f64 * (BAR_W + BAR_GAP);
        let y0 = BASE_Y - h;
        let gx0 = g(x0);
        let gy0 = g(y0);
        let gy1 = g(BASE_Y);
        let gw = g(BAR_W).max(1);
        let rad = g(RADIUS).max(1) as f64;
        for y in gy0..gy1 {
            let t = (y as f64 - gy0 as f64) / (gy1 as f64 - gy0 as f64);
            let col = lerp(*top, *bot, t);
            for x in gx0..gx0 + gw {
                if in_rounded(
                    x as f64,
                    y as f64,
                    gx0 as f64,
                    gy0 as f64,
                    (gx0 + gw) as f64,
                    gy1 as f64,
                    rad,
                ) {
                    let i = (y * n + x) * 4;
                    px[i] = col.0;
                    px[i + 1] = col.1;
                    px[i + 2] = col.2;
                }
            }
        }
    }
    let mut out = vec![0u8; size * size * 4];
    for y in 0..size {
        for x in 0..size {
            let (mut rs, mut gs, mut bs, mut as_) = (0u64, 0u64, 0u64, 0u64);
            for dy in 0..SS {
                for dx in 0..SS {
                    let i = ((y * SS + dy) * n + x * SS + dx) * 4;
                    rs += px[i] as u64;
                    gs += px[i + 1] as u64;
                    bs += px[i + 2] as u64;
                    as_ += px[i + 3] as u64;
                }
            }
            let k = (SS * SS) as u64;
            let i = (y * size + x) * 4;
            out[i] = (rs / k) as u8;
            out[i + 1] = (gs / k) as u8;
            out[i + 2] = (bs / k) as u8;
            out[i + 3] = (as_ / k) as u8;
        }
    }
    out
}

fn png_chunk(tag: &[u8; 4], data: &[u8]) -> Vec<u8> {
    use std::io::Write;
    let mut crc = flate2::Crc::new();
    crc.update(tag);
    crc.update(data);
    let mut out = Vec::new();
    out.write_all(&(data.len() as u32).to_be_bytes()).unwrap();
    out.write_all(tag).unwrap();
    out.write_all(data).unwrap();
    out.write_all(&crc.sum().to_be_bytes()).unwrap();
    out
}

fn png_bytes(w: usize, h: usize, rgba: &[u8]) -> Vec<u8> {
    let mut raw = Vec::with_capacity(w * h * 5);
    for y in 0..h {
        raw.push(0u8);
        raw.extend_from_slice(&rgba[y * w * 4..(y + 1) * w * 4]);
    }
    let mut ihdr = Vec::new();
    ihdr.extend_from_slice(&(w as u32).to_be_bytes());
    ihdr.extend_from_slice(&(h as u32).to_be_bytes());
    ihdr.push(8);
    ihdr.push(6);
    ihdr.push(0);
    ihdr.push(0);
    ihdr.push(0);
    use flate2::Compression;
    use flate2::write::ZlibEncoder;
    use std::io::Write;
    let mut enc = ZlibEncoder::new(Vec::new(), Compression::new(9));
    enc.write_all(&raw).unwrap();
    let idat = enc.finish().unwrap();
    let mut png = Vec::new();
    png.extend_from_slice(b"\x89PNG\r\n\x1a\n");
    png.extend_from_slice(&png_chunk(b"IHDR", &ihdr));
    png.extend_from_slice(&png_chunk(b"IDAT", &idat));
    png.extend_from_slice(&png_chunk(b"IEND", &[]));
    png
}

fn write_png(path: &PathBuf, w: usize, h: usize, rgba: &[u8]) {
    std::fs::write(path, png_bytes(w, h, rgba)).unwrap();
}

fn bmp_entry(size: usize, rgba: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    out.extend_from_slice(&40u32.to_le_bytes());
    out.extend_from_slice(&(size as i32).to_le_bytes());
    out.extend_from_slice(&((size * 2) as i32).to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&32u16.to_le_bytes());
    // biCompression, biSizeImage, biXPelsPerMeter, biYPelsPerMeter, biClrUsed, biClrImportant (6×4 = 24 bytes)
    out.extend_from_slice(&[0; 24]);
    for y in (0..size).rev() {
        for i in 0..size {
            let p = (y * size + i) * 4;
            out.extend_from_slice(&[rgba[p + 2], rgba[p + 1], rgba[p], rgba[p + 3]]);
        }
    }
    // fila del AND mask alineada a 32 bits: ((w + 31) / 32) * 4 == w.div_ceil(32) * 4
    let row_bytes = size.div_ceil(32) * 4;
    for _ in 0..size {
        out.extend_from_slice(&vec![0u8; row_bytes]);
    }
    out
}

fn write_ico(path: &PathBuf, entries: &[(usize, Vec<u8>)]) {
    let mut out = Vec::new();
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&(entries.len() as u16).to_le_bytes());
    let mut offset = 6u32 + 16 * entries.len() as u32;
    let mut payloads: Vec<(usize, Vec<u8>, u8)> = Vec::new();
    for (size, rgba) in entries {
        let w = if *size >= 256 { 0u8 } else { *size as u8 };
        let data = if *size < 256 {
            bmp_entry(*size, rgba)
        } else {
            png_bytes(*size, *size, rgba)
        };
        payloads.push((*size, data, w));
    }
    for (_, data, w) in &payloads {
        out.extend_from_slice(&[*w, *w, 0, 0]);
        out.extend_from_slice(&1u16.to_le_bytes());
        out.extend_from_slice(&32u16.to_le_bytes());
        out.extend_from_slice(&(data.len() as u32).to_le_bytes());
        out.extend_from_slice(&offset.to_le_bytes());
        offset += data.len() as u32;
    }
    for (_, data, _) in &payloads {
        out.extend_from_slice(data);
    }
    std::fs::write(path, out).unwrap();
}

fn main() {
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let out_dir = root.join("assets");
    std::fs::create_dir_all(&out_dir).unwrap();
    let mut pngs = std::collections::HashMap::new();
    for size in [16usize, 32, 48, 64, 256] {
        pngs.insert(size, render(size));
    }
    write_png(&out_dir.join("icon-256.png"), 256, 256, &pngs[&256]);
    std::fs::write(out_dir.join("icon-64.rgba"), &pngs[&64]).unwrap();
    // ICO solo con entradas BMP (rc.exe de MSVC rechaza PNG en ICO)
    let ico_entries: Vec<(usize, Vec<u8>)> = [16usize, 32, 48, 64]
        .iter()
        .map(|s| (*s, pngs[s].clone()))
        .collect();
    write_ico(&out_dir.join("icon.ico"), &ico_entries);
    println!("assets/icon.ico (16/32/48/64 BMP) + assets/icon-256.png + icon-64.rgba listos");
}
