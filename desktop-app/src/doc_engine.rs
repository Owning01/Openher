//! Motor de conversi├│n ultra-ligero y de cero memoria persistente en Rust puro:
//! DOCX <-> Markdown <-> PDF <-> TXT <-> HTML.

use std::io::{Cursor, Read, Write};
use std::path::Path;
use lopdf::dictionary;
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

/// Convierte un archivo PDF a texto Markdown estructurado.
pub fn pdf_to_md(bytes: &[u8]) -> Result<String, String> {
    let text = pdf_extract::extract_text_from_mem(bytes).map_err(|e| format!("Error extrayendo PDF: {e}"))?;
    let mut out = String::new();
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            out.push_str("\n\n");
            continue;
        }
        // Heur├¡stica de encabezados si est├í en may├║sculas o corto
        if trimmed.len() < 50 && trimmed.chars().all(|c| c.is_uppercase() || c.is_whitespace() || c.is_ascii_punctuation()) && trimmed.len() > 3 {
            out.push_str(&format!("## {}\n\n", trimmed));
        } else {
            out.push_str(trimmed);
            out.push(' ');
        }
    }
    Ok(out.trim().to_string())
}

/// Convierte un archivo DOCX (Word) a Markdown estructurado leyendo word/document.xml.
pub fn docx_to_md(bytes: &[u8]) -> Result<String, String> {
    let reader = Cursor::new(bytes);
    let mut zip = ZipArchive::new(reader).map_err(|e| format!("Error al abrir DOCX como ZIP: {e}"))?;
    
    let mut doc_xml = String::new();
    {
        let mut file = zip.by_name("word/document.xml").map_err(|e| format!("word/document.xml no encontrado: {e}"))?;
        file.read_to_string(&mut doc_xml).map_err(|e| format!("Error leyendo document.xml: {e}"))?;
    }

    let mut reader = quick_xml::Reader::from_str(&doc_xml);
    reader.config_mut().trim_text(true);

    let mut out = String::new();
    let mut in_p = false;
    let mut in_t = false;
    let mut in_heading = false;
    let mut heading_level = 1;
    let mut is_bold = false;
    let mut is_italic = false;
    let mut current_p_text = String::new();

    let mut buf = Vec::new();
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(quick_xml::events::Event::Start(ref e)) => {
                match e.name().as_ref() {
                    b"w:p" => {
                        in_p = true;
                        current_p_text.clear();
                        in_heading = false;
                        heading_level = 1;
                    }
                    b"w:pStyle" => {
                        for attr in e.attributes().flatten() {
                            if attr.key.as_ref() == b"w:val" {
                                let val = String::from_utf8_lossy(&attr.value).to_lowercase();
                                if val.contains("heading1") || val.contains("title") {
                                    in_heading = true;
                                    heading_level = 1;
                                } else if val.contains("heading2") {
                                    in_heading = true;
                                    heading_level = 2;
                                } else if val.contains("heading3") {
                                    in_heading = true;
                                    heading_level = 3;
                                }
                            }
                        }
                    }
                    b"w:b" => is_bold = true,
                    b"w:i" => is_italic = true,
                    b"w:t" => in_t = true,
                    _ => {}
                }
            }
            Ok(quick_xml::events::Event::End(ref e)) => {
                match e.name().as_ref() {
                    b"w:p" => {
                        if in_p {
                            let trimmed = current_p_text.trim();
                            if !trimmed.is_empty() {
                                if in_heading {
                                    let hashes = "#".repeat(heading_level);
                                    out.push_str(&format!("{hashes} {trimmed}\n\n"));
                                } else {
                                    out.push_str(&format!("{trimmed}\n\n"));
                                }
                            }
                            in_p = false;
                        }
                    }
                    b"w:r" => {
                        is_bold = false;
                        is_italic = false;
                    }
                    b"w:t" => in_t = false,
                    _ => {}
                }
            }
            Ok(quick_xml::events::Event::Text(ref e)) => {
                if in_t {
                    let txt = e.unescape().unwrap_or_default().to_string();
                    let mut formatted = txt;
                    if is_bold {
                        formatted = format!("**{formatted}**");
                    }
                    if is_italic {
                        formatted = format!("*{formatted}*");
                    }
                    current_p_text.push_str(&formatted);
                }
            }
            Ok(quick_xml::events::Event::Eof) => break,
            Err(e) => return Err(format!("Error parseando XML de Word: {e}")),
            _ => {}
        }
        buf.clear();
    }

    Ok(out.trim().to_string())
}

/// Convierte texto Markdown a un documento DOCX nativo de Microsoft Word (OpenXML).
pub fn md_to_docx(md: &str) -> Result<Vec<u8>, String> {
    let mut buffer = Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(&mut buffer);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. [Content_Types].xml
    zip.start_file("[Content_Types].xml", options).map_err(|e| e.to_string())?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"#).map_err(|e| e.to_string())?;

    // 2. _rels/.rels
    zip.start_file("_rels/.rels", options).map_err(|e| e.to_string())?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#).map_err(|e| e.to_string())?;

    // 3. word/styles.xml
    zip.start_file("word/styles.xml", options).map_err(|e| e.to_string())?;
    zip.write_all(br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:rPr><w:b/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>"#).map_err(|e| e.to_string())?;

    // 4. word/document.xml
    zip.start_file("word/document.xml", options).map_err(|e| e.to_string())?;
    let mut body_xml = String::new();
    body_xml.push_str(r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>"#);

    for line in md.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if let Some(rest) = trimmed.strip_prefix("# ") {
            body_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>{}</w:t></w:r></w:p>"#,
                quick_xml::escape::escape(rest)
            ));
        } else if let Some(rest) = trimmed.strip_prefix("## ") {
            body_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>{}</w:t></w:r></w:p>"#,
                quick_xml::escape::escape(rest)
            ));
        } else if let Some(rest) = trimmed.strip_prefix("### ") {
            body_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>{}</w:t></w:r></w:p>"#,
                quick_xml::escape::escape(rest)
            ));
        } else if let Some(rest) = trimmed.strip_prefix("- ").or_else(|| trimmed.strip_prefix("* ")) {
            body_xml.push_str(&format!(
                r#"<w:p><w:r><w:t>ÔÇó {}</w:t></w:r></w:p>"#,
                quick_xml::escape::escape(rest)
            ));
        } else {
            body_xml.push_str(&format!(
                r#"<w:p><w:r><w:t>{}</w:t></w:r></w:p>"#,
                quick_xml::escape::escape(trimmed)
            ));
        }
    }

    body_xml.push_str("</w:body></w:document>");
    zip.write_all(body_xml.as_bytes()).map_err(|e| e.to_string())?;

    zip.finish().map_err(|e| e.to_string())?;

    Ok(buffer.into_inner())
}

/// CSS idéntico al preview de Markdown (chat.css .message-content en tema claro)
fn markdown_pdf_css() -> &'static str {
    r#"
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            font-size: 14px; line-height: 1.6; color: #24292e; background: #ffffff;
            max-width: 800px; margin: 0 auto; padding: 24px;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .markdown-body { font-size: 14px; line-height: 1.6; }
        .markdown-body p { margin: 16px 0 0; white-space: pre-wrap; overflow-wrap: break-word; word-break: break-word; }
        .markdown-body p:first-child { margin-top: 0; }
        .markdown-body strong { color: #24292e; font-weight: 600; }
        .markdown-body em { color: #24292e; font-style: italic; }
        .markdown-body a { color: #0366d6; text-decoration: none; } .markdown-body a:hover { text-decoration: underline; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5, .markdown-body h6 {
            color: #24292e; font-weight: 600; line-height: 1.25; margin: 24px 0 16px;
        }
        .markdown-body h1 { font-size: 1.8em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; margin-top: 0; }
        .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        .markdown-body h3 { font-size: 1.25em; } .markdown-body h4 { font-size: 1em; }
        .markdown-body h5 { font-size: 0.875em; } .markdown-body h6 { font-size: 0.85em; color: #6a737d; }
        .markdown-body blockquote { color: #6a737d; border-left: 0.25em solid #dfe2e5; padding: 0 1em; margin: 0 0 16px; }
        .markdown-body ul, .markdown-body ol { padding-left: 2em; margin: 0 0 16px; } .markdown-body li { margin: 0.25em 0; }
        .markdown-body hr { border: none; border-top: 1px solid #eaecef; margin: 24px 0; }
        .markdown-body img { max-width: 100%; border-radius: 6px; margin: 16px 0; }
        .markdown-body code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 85%; background: rgba(27,31,35,0.05); border-radius: 3px; padding: 0.2em 0.4em; color: #24292e; }
        .markdown-body pre { background: #f6f8fa; border: 1px solid #dfe2e5; border-radius: 6px; padding: 16px; overflow: auto; line-height: 1.45; margin: 16px 0; }
        .markdown-body pre code { background: transparent; padding: 0; border: none; font-size: 85%; color: #24292e; white-space: pre; word-break: normal; }
        .markdown-body .code-block-wrap { background: #f6f8fa; border: 1px solid #dfe2e5; border-radius: 6px; overflow: hidden; margin: 16px 0; }
        .markdown-body .code-block-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 12px; background: #f1f3f4; border-bottom: 1px solid #dfe2e5; font-size: 12px; color: #6a737d; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 0 0 16px; font-size: 14px; display: table; }
        .markdown-body th, .markdown-body td { border: 1px solid #dfe2e5; padding: 6px 13px; text-align: left; }
        .markdown-body th { background: #f6f8fa; font-weight: 600; } .markdown-body tr:nth-child(2n) { background: #f6f8fa; }
        .markdown-body .hljs-keyword { color: #d73a49; } .markdown-body .hljs-string { color: #032f62; }
        .markdown-body .hljs-comment { color: #6a737d; font-style: italic; } .markdown-body .hljs-function { color: #6f42c1; }
        .markdown-body .hljs-number { color: #005cc5; }
        @media print { body { padding: 0; } @page { margin: 12mm; size: A4; } pre, blockquote, table, img { break-inside: avoid; } }
    "#
}

fn md_to_html_with_css(md: &str) -> String {
    let mut opts = comrak::ComrakOptions::default();
    opts.extension.strikethrough = true;
    opts.extension.table = true;
    opts.extension.autolink = true;
    opts.extension.tasklist = true;
    opts.extension.superscript = true;
    opts.extension.footnotes = true;
    opts.extension.description_lists = true;
    let html_body = comrak::markdown_to_html(md, &opts);
    format!(
        r#"<!DOCTYPE html><html><head><meta charset="utf-8"><style>{}</style></head><body class="markdown-body">{}</body></html>"#,
        markdown_pdf_css(),
        html_body
    )
}

fn md_to_pdf_lopdf(md: &str) -> Result<Vec<u8>, String> {
    use lopdf::content::{Content, Operation};
    use lopdf::{Document, Object, Stream};
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let font_id = doc.add_object(lopdf::dictionary! { "Type" => "Font", "Subtype" => "Type1", "BaseFont" => "Helvetica", });
    let mut page_ids = Vec::new();
    let lines_per_page = 42;
    let md_lines: Vec<&str> = md.lines().collect();
    for chunk in md_lines.chunks(lines_per_page) {
        let mut ops = vec![
            Operation::new("BT", vec![]),
            Operation::new("Tf", vec!["F1".into(), 11.into()]),
            Operation::new("Td", vec![50.into(), 750.into()]),
            Operation::new("TL", vec![16.into()]),
        ];
        for (i, line) in chunk.iter().enumerate() {
            let clean = line.replace('\t', "    ").chars().filter(|c| c.is_ascii()).collect::<String>();
            if i > 0 { ops.push(Operation::new("T*", vec![])); }
            ops.push(Operation::new("Tj", vec![Object::string_literal(clean)]));
        }
        ops.push(Operation::new("ET", vec![]));
        let content = Content { operations: ops };
        let content_id = doc.add_object(Stream::new(lopdf::dictionary! {}, content.encode().map_err(|e| e.to_string())?));
        let page_id = doc.add_object(lopdf::dictionary! {
            "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
            "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
            "Resources" => lopdf::dictionary! { "Font" => lopdf::dictionary! { "F1" => font_id, }, },
        });
        page_ids.push(page_id.into());
    }
    if page_ids.is_empty() {
        let content = Content { operations: vec![] };
        let content_id = doc.add_object(Stream::new(lopdf::dictionary! {}, content.encode().map_err(|e| e.to_string())?));
        let page_id = doc.add_object(lopdf::dictionary! {
            "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
            "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
            "Resources" => lopdf::dictionary! { "Font" => lopdf::dictionary! { "F1" => font_id, }, },
        });
        page_ids.push(page_id.into());
    }
    let count = page_ids.len() as i64;
    doc.objects.insert(pages_id, Object::Dictionary(lopdf::dictionary! { "Type" => "Pages", "Kids" => page_ids, "Count" => count, }));
    let catalog_id = doc.add_object(lopdf::dictionary! { "Type" => "Catalog", "Pages" => pages_id, });
    doc.trailer.set("Root", catalog_id);
    let mut out = Vec::new();
    doc.save_to(&mut out).map_err(|e| format!("Error guardando PDF: {e}"))?;
    Ok(out)
}

/// Convierte Markdown a PDF vectorial con CSS idéntico al preview (vectorial, texto seleccionable)
pub fn md_to_pdf(md: &str) -> Result<Vec<u8>, String> {
    if let Ok(pdf) = md_to_pdf_via_chrome(md) { if !pdf.is_empty() { return Ok(pdf); } }
    md_to_pdf_lopdf(md)
}

fn md_to_pdf_via_chrome(md: &str) -> Result<Vec<u8>, String> {
    use base64::Engine as _;
    use headless_chrome::{Browser, LaunchOptions};
    let html = md_to_html_with_css(md);
    let html_b64 = base64::engine::general_purpose::STANDARD.encode(html.as_bytes());
    let data_url = format!("data:text/html;base64,{}", html_b64);
    let browser = Browser::new(LaunchOptions::default_builder().headless(true).build().map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    let tab = browser.new_tab().map_err(|e| e.to_string())?;
    tab.navigate_to(&data_url).map_err(|e| e.to_string())?;
    tab.wait_until_navigated().map_err(|e| e.to_string())?;
    std::thread::sleep(std::time::Duration::from_millis(350));
    let pdf = tab.print_to_pdf(None).map_err(|e| e.to_string())?;
    Ok(pdf)
}

/// Convierte archivos arbitrarios en disco a otro formato y opcionalmente guarda el resultado.
pub fn convert_file(src_path: &str, target_format: &str, dest_path: Option<&str>) -> Result<serde_json::Value, String> {
    let p = Path::new(src_path);
    if !p.exists() || !p.is_file() {
        return Err(format!("El archivo no existe: {src_path}"));
    }

    let bytes = std::fs::read(p).map_err(|e| e.to_string())?;
    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let target = target_format.trim().to_lowercase();

    // 1. Convertir archivo origen a Markdown intermedio
    let md_content = match ext.as_str() {
        "pdf" => pdf_to_md(&bytes)?,
        "docx" => docx_to_md(&bytes)?,
        "md" | "markdown" | "txt" => String::from_utf8_lossy(&bytes).to_string(),
        _ => String::from_utf8_lossy(&bytes).to_string(),
    };

    // 2. Exportar Markdown al formato destino deseado
    let (output_bytes, output_ext) = match target.as_str() {
        "md" | "markdown" | "txt" => (md_content.as_bytes().to_vec(), "md"),
        "docx" => (md_to_docx(&md_content)?, "docx"),
        "pdf" => (md_to_pdf(&md_content)?, "pdf"),
        _ => return Err(format!("Formato destino no soportado: {target}")),
    };

    let destination = if let Some(dp) = dest_path {
        std::path::PathBuf::from(dp)
    } else {
        p.with_extension(output_ext)
    };

    std::fs::write(&destination, &output_bytes).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "ok": true,
        "src": src_path,
        "dest": destination.to_string_lossy(),
        "format": output_ext,
        "size": output_bytes.len(),
        "preview": md_content.chars().take(1000).collect::<String>(),
    }))
}
