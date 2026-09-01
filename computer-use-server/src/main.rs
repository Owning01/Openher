mod computer;
mod state;
use tiny_http::{Server, Response, Header, Method, StatusCode};
use std::io::Read;

fn cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap(),
        Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, OPTIONS").unwrap(),
        Header::from_bytes("Access-Control-Allow-Headers", "Content-Type, Authorization").unwrap(),
        Header::from_bytes("Access-Control-Expose-Headers", "ETag").unwrap(),
    ]
}
fn json_ok(v: &serde_json::Value) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut r = Response::from_string(v.to_string()).with_status_code(StatusCode(200));
    r.add_header(Header::from_bytes("Content-Type", "application/json").unwrap());
    r.add_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
    r
}
fn json_err(code: u16, msg: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut r = Response::from_string(serde_json::json!({"error": msg}).to_string()).with_status_code(StatusCode(code));
    r.add_header(Header::from_bytes("Content-Type", "application/json").unwrap());
    r.add_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
    r
}
fn url_decode(s: &str) -> String {
    let b=s.as_bytes(); let mut o=Vec::new(); let mut i=0;
    while i<b.len(){ match b[i]{
        b'%' if i+2<b.len() => { if let Ok(v)=u8::from_str_radix(std::str::from_utf8(&b[i+1..i+3]).unwrap_or(""),16){ o.push(v); i+=3; continue; } o.push(b[i]); i+=1; }
        b'+'=>{o.push(b' '); i+=1;} b=>{o.push(b); i+=1;}
    }}
    String::from_utf8_lossy(&o).to_string()
}
fn read_body(req: &mut tiny_http::Request) -> Result<serde_json::Value, String> {
    let mut buf=Vec::new(); let r=req.as_reader(); let mut c=[0u8;8192]; let mut t=0;
    loop{ let n=r.read(&mut c).map_err(|e|e.to_string())?; if n==0{break} t+=n; if t>16*1024*1024{return Err("body too large".into())} buf.extend_from_slice(&c[..n]); }
    if buf.is_empty(){ return Ok(serde_json::Value::Null); }
    let s=String::from_utf8_lossy(&buf);
    serde_json::from_str(&s).map_err(|e|e.to_string())
}
fn main(){
    #[cfg(windows)]
    unsafe { use windows_sys::Win32::UI::HiDpi::{SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2}; SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2); }
    let addr=std::env::var("COMPUTER_USE_ADDR").unwrap_or("127.0.0.1:5901".to_string());
    let server=Server::http(&addr).expect("bind 5901");
    println!("computer-use-server on http://{} — harness-agnostic (JPEG75+CatmullRom+region+batch+etag+cursor)", addr);
    for mut req in server.incoming_requests(){
        let url=req.url().to_string();
        let method=req.method().clone();
        let path=url.split('?').next().unwrap_or(&url).to_string();
        let query=url.split('?').nth(1).unwrap_or("").to_string();
        let q=|k:&str| query.split('&').find(|p| p.starts_with(&format!("{k}="))).map(|p| p.split('=').nth(1).unwrap_or("")).map(|v| url_decode(v)).unwrap_or_default();
        if method==Method::Options{
            let mut resp=Response::from_string("").with_status_code(StatusCode(204));
            for h in cors_headers(){ resp.add_header(h); }
            let _=req.respond(resp);
            continue;
        }
        if path=="/health"||path=="/shell/health"{
            let _=req.respond(json_ok(&serde_json::json!({"ok":true,"service":"computer-use","addr":addr,"version":"0.2.0"})));
            continue;
        }
        if path=="/screenshot"||path=="/shell/computer/screenshot"{
            let w=q("width").parse::<u32>().ok();
            let fmt=q("format");
            let qual=q("quality").parse::<u8>().ok();
            let x=q("x").parse::<i32>().ok();
            let y=q("y").parse::<i32>().ok();
            let rw=q("w").parse::<u32>().ok();
            let rh=q("h").parse::<u32>().ok();
            let bare=q("bare")=="1"||q("bare")=="true";
            let cursor=q("cursor")=="1"||q("cursor")=="true";
            let screen=q("screen").parse::<u32>().ok();
            let etag=if q("etag").is_empty(){None}else{Some(q("etag"))};
            let etag_hdr = req.headers().iter().find(|h| h.field.as_str().to_ascii_lowercase()=="if-none-match").map(|h| h.value.as_str().to_string());
            let etag_final = etag.or(etag_hdr);
            let opts=crate::computer::ScreenshotOpts{width:w,format:if fmt.is_empty(){None}else{Some(fmt)},quality:qual,x,y,w:rw,h:rh,bare:Some(bare),cursor:Some(cursor),screen};
            match crate::computer::screenshot_v2(&opts, etag_final){
                Ok(v)=>{
                    if v.unchanged{
                        let mut resp=json_ok(&serde_json::json!({"unchanged":true,"etag":v.etag,"width":v.width,"height":v.height}));
                        resp.add_header(Header::from_bytes("ETag", v.etag.as_str()).unwrap_or(Header::from_bytes("ETag","").unwrap()));
                        let _=req.respond(resp);
                    } else {
                        let mut val=serde_json::to_value(&v).unwrap();
                        // also add ETag header for http caching
                        let etag_clone = v.etag.clone();
                        let mut resp=json_ok(&val);
                        resp.add_header(Header::from_bytes("ETag", etag_clone.as_str()).unwrap_or(Header::from_bytes("ETag","").unwrap()));
                        let _=req.respond(resp);
                    }
                },
                Err(e)=>{ let _=req.respond(json_err(500,&e)); }
            }
            continue;
        }
        if path=="/screenshot.bin"||path=="/shell/computer/screenshot.bin"{
            // binary jpeg/png without base64, for -33% without quality loss
            let w=q("width").parse::<u32>().ok();
            let fmt=q("format");
            let qual=q("quality").parse::<u8>().ok();
            let x=q("x").parse::<i32>().ok();
            let y=q("y").parse::<i32>().ok();
            let rw=q("w").parse::<u32>().ok();
            let rh=q("h").parse::<u32>().ok();
            let screen=q("screen").parse::<u32>().ok();
            let opts=crate::computer::ScreenshotOpts{width:w,format:if fmt.is_empty(){Some("jpeg".to_string())}else{Some(fmt)},quality:qual,x,y,w:rw,h:rh,bare:Some(true),cursor:Some(q("cursor")=="1"),screen};
            match crate::computer::screenshot_v2(&opts, None){
                Ok(v)=>{
                    // decode base64 bare to binary
                    let b64 = v.image;
                    let bin = {
                        // simple base64 decode via state::base64 not needed, we have bytes before encode - but we only have b64 here
                        // quick decode inline
                        let table = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        let mut out=Vec::new();
                        let bytes=b64.as_bytes();
                        let mut i=0;
                        while i+3 < bytes.len(){
                            let mut vals=[0u8;4];
                            let mut pad=0;
                            for k in 0..4{
                                let c=bytes[i+k];
                                if c==b'=' { vals[k]=0; pad+=1; } else { vals[k]=table.iter().position(|&x| x==c).unwrap_or(0) as u8; }
                            }
                            out.push((vals[0]<<2)|(vals[1]>>4));
                            if pad<2 { out.push((vals[1]<<4)|(vals[2]>>2)); }
                            if pad<1 { out.push((vals[2]<<6)|vals[3]); }
                            i+=4;
                        }
                        out
                    };
                    let mime = if v.format=="jpeg" {"image/jpeg"} else {"image/png"};
                    let mut resp=Response::from_data(bin).with_status_code(StatusCode(200));
                    resp.add_header(Header::from_bytes("Content-Type", mime).unwrap());
                    resp.add_header(Header::from_bytes("ETag", v.etag.as_str()).unwrap_or(Header::from_bytes("ETag","").unwrap()));
                    resp.add_header(Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap());
                    let _=req.respond(resp);
                },
                Err(e)=>{ let _=req.respond(json_err(500,&e)); }
            }
            continue;
        }
        if (path=="/mouse"||path=="/shell/computer/mouse") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{ let r:Result<crate::computer::MouseReq,_>=serde_json::from_value(b); match r{
                    Ok(m)=> match crate::computer::mouse(&m){ Ok(())=>{let _=req.respond(json_ok(&serde_json::json!({"ok":true})));}, Err(e)=>{let _=req.respond(json_err(500,&e));}},
                    Err(e)=>{let _=req.respond(json_err(400,&e.to_string()));}
                }},
                Err(e)=>{let _=req.respond(json_err(400,&e));}
            }
            continue;
        }
        if (path=="/key"||path=="/shell/computer/key") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{ let r:Result<crate::computer::KeyReq,_>=serde_json::from_value(b); match r{
                    Ok(k)=> match crate::computer::key(&k){ Ok(())=>{let _=req.respond(json_ok(&serde_json::json!({"ok":true})));}, Err(e)=>{let _=req.respond(json_err(500,&e));}},
                    Err(e)=>{let _=req.respond(json_err(400,&e.to_string()));}
                }},
                Err(e)=>{let _=req.respond(json_err(400,&e));}
            }
            continue;
        }
        if (path=="/type"||path=="/shell/computer/type") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{ let r:Result<crate::computer::TypeReq,_>=serde_json::from_value(b); match r{
                    Ok(t)=> match crate::computer::type_text(&t){ Ok(())=>{let _=req.respond(json_ok(&serde_json::json!({"ok":true})));}, Err(e)=>{let _=req.respond(json_err(500,&e));}},
                    Err(e)=>{let _=req.respond(json_err(400,&e.to_string()));}
                }},
                Err(e)=>{let _=req.respond(json_err(400,&e));}
            }
            continue;
        }
        if (path=="/scroll"||path=="/shell/computer/scroll") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{ let r:Result<crate::computer::ScrollReq,_>=serde_json::from_value(b); match r{
                    Ok(s)=> match crate::computer::scroll(&s){ Ok(())=>{let _=req.respond(json_ok(&serde_json::json!({"ok":true})));}, Err(e)=>{let _=req.respond(json_err(500,&e));}},
                    Err(e)=>{let _=req.respond(json_err(400,&e.to_string()));}
                }},
                Err(e)=>{let _=req.respond(json_err(400,&e));}
            }
            continue;
        }
        if (path=="/batch"||path=="/shell/computer/batch") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{ let r:Result<crate::computer::BatchReq,_>=serde_json::from_value(b); match r{
                    Ok(rb)=> match crate::computer::batch(&rb){ Ok(v)=>{ if let Some(s)=v{let _=req.respond(json_ok(&serde_json::json!({"ok":true,"screenshot":s})));} else {let _=req.respond(json_ok(&serde_json::json!({"ok":true})));} }, Err(e)=>{let _=req.respond(json_err(500,&e));}},
                    Err(e)=>{let _=req.respond(json_err(400,&e.to_string()));}
                }},
                Err(e)=>{let _=req.respond(json_err(400,&e));}
            }
            continue;
        }
        if (path=="/find_element"||path=="/shell/computer/find_element") && method==Method::Post{
            match read_body(&mut req){
                Ok(b)=>{
                    let name=b["name"].as_str().unwrap_or("").to_string();
                    let timeout=b["timeout"].as_u64().unwrap_or(b["timeout_ms"].as_u64().unwrap_or(2000));
                    match crate::computer::find_element(&name, timeout){
                        Ok(Some((x,y,w,h)))=>{ let _=req.respond(json_ok(&serde_json::json!({"found":true,"x":x,"y":y,"w":w,"h":h,"cx":x+w/2,"cy":y+h/2}))); },
                        Ok(None)=>{ let _=req.respond(json_ok(&serde_json::json!({"found":false}))); },
                        Err(e)=>{ let _=req.respond(json_err(500,&e)); }
                    }
                },
                Err(e)=>{ let _=req.respond(json_err(400,&e)); }
            }
            continue;
        }
        if path=="/list_windows"||path=="/shell/computer/list_windows"{
            let filter = q("filter");
            let f = if filter.is_empty(){None}else{Some(filter)};
            let wins=crate::computer::list_windows(f);
            let arr:Vec<serde_json::Value>=wins.into_iter().map(|(n,x,y,w,h)| serde_json::json!({"name":n,"x":x,"y":y,"w":w,"h":h})).collect();
            let _=req.respond(json_ok(&serde_json::json!({"windows":arr})));
            continue;
        }
        let _=req.respond(json_err(404,"not found"));
    }
}
