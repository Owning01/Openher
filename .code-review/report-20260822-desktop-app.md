# Auditoría desktop-app/src — 21/21 archivos | 99 hallazgos + 10 verificaciones
Fecha: 2026-08-22 · Commit base: b14cb6d9 · Toolchain verificada contra Cargo.toml

## 🔴 CRITICAL (5)

1. `fsx.rs:173-179` | CRIT | SECURITY | delete_entry sin sandbox ni auth: POST simple-request (text/plain no-cors → sin preflight) a 127.0.0.1:4848 borra árbol arbitrario (`C:\`, UNC, `..\`) vía remove_dir_all | sandbox roots + token header obligatorio en mutaciones
2. `fsx.rs:228-231` | CRIT | SECURITY | write_file: escritura arbitraria creando padres — autoruns sobrescribibles, mismo vector drive-by | idem
3. `fsx.rs:237-272` | CRIT | SECURITY | execute_file ejecuta cualquier extensión (fallback `cmd /k`; ps1 `-ExecutionPolicy Bypass`) | allowlist + confirmación nativa
4. `docsx.rs:49-51` | CRIT | SECURITY | guard `starts_with` léxico no normaliza `..`; rel decodificado de `?path=` → lectura arbitraria (config.json expone password) | rechazar ParentDir/CurDir + canonicalize
5. `doc_engine.rs:315-347` | CRIT | SECURITY | convert_file sin confinamiento: read/write arbitrarios; doc/save escribe directo | confinar a docs_root + token

## 🟠 HIGH (19)

6. `main.rs:444`+`api.rs` | HIGH | SECURITY | RAÍZ sistémica: cero auth/token en `/shell/*` + CORS refleja Origin arbitrario → habilita criticals 1-5 drive-by | token por-launch + whitelist Origin/Host
7. `ptyx.rs:368,384-397` | HIGH | LOGIC | Writer WS: `consumed` índice absoluto sobre Vec que el ring recota a la mitad → tras rotación stream congelado/pérdida silenciosa | offset absoluto con base_offset
8. `ptyx.rs:368,462-469` | HIGH | LOGIC | Reattach a otro pty NO resetea `consumed` → terminal negro hasta producir ≥consumed bytes | reset en cambio de id
9. `main.rs:280-284`+`browser_view.rs:74-77` | HIGH | RACE | Comandos browser sin wakeup del event loop + `rx.recv()` sin timeout → request HTTP colgado indefinidamente con app idle | send_event o recv_timeout
10. `api.rs:692-694` | HIGH | SECURITY | design/open: `cmd /c start "" <url>` — metacaracters cmd inyectan comandos | ShellExecuteW o rechazar `"^&|<>`
11. `common.rs:73-75` | HIGH | SECURITY | serve_file guard léxico `..` pasa starts_with → fs::read escapa del root | components check + canonicalize
12. `common.rs:31` | HIGH | LOGIC | split_whitespace rompe rutas con espacios (`C:\Program Files\…`) | tokenizer con comillas
13. `fsx.rs:251-272` | HIGH | SECURITY | BatBadBut CVE-2024-24576: metacaracteres cmd.exe en path ejecutan extras | ShellExecuteExW o rechazo
14. `fsx.rs:201-209` | HIGH | LOGIC | copiar dir dentro de su subárbol → recursión infinita | canonicalize ambos lados
15. `srvman.rs:44` | HIGH | LOGIC | start() sin check estado: proceso duplicado + zombie | chequear children/status primero
16. `srvman.rs:57-59` | HIGH | LOGIC | stop() mata solo hijo directo: server vía .bat queda huérfano | Job Object o taskkill /T
17. `srvman.rs:44-52`+`api.rs:43` | HIGH | SECURITY | Cadena drive-by: POST config fija start_command → server/start lo ejecuta | token o confirmación tray
18. `plugins.rs:68-69` | HIGH | SECURITY | serve_web `{name}` sin validar (`..`) | regex `^[A-Za-z0-9_-]+$`
19. `browser_view.rs:223-224` | HIGH | SECURITY | `--disable-web-security --disable-site-isolation-trials` en webview que navega URLs arbitrarias | eliminar flags (NOTA: ya removidos en main WebView; estos quedan en sub-webview)
20. `doc_engine.rs:57,127` | HIGH | LOGIC | Parser DOCX solo Event::Start; self-closing llegan como Event::Empty → headings/bold dead code | brazo Event::Empty
21. `doc_engine.rs:252` | HIGH | BEHAVIOR | filter(is_ascii) borra acentos/ñ en PDF — texto español mutilado | WinAnsi map o TTF embebida
22. `opencode-stats/server.rs:45,355-398` | HIGH | SECURITY | :8765 ACAO:* + admin force=true drive-by borra DB | token local
23. `updates.rs:23-26,69-89` | HIGH | PERF | fetches secuenciales ×12s/×20s bloqueando worker | paralelizar/background cache
24. `kanban.rs:58` | HIGH | BEHAVIOR | unwrap_or_default() escribiría "" destruyendo kanban.json válido | skip write ante error

## 🟡 MEDIUM (42)
25-66: browser open/bounds sin else→404 vs 400 · url_decode `+`→espacio corrompe rutas · query parser trunca valores con `=` · stats/proxy ureq sin timeout · inject_config_script vuelca credenciales a localStorage · pty id colisión mismo-ms pisa sesión · WS handshake sin timeout hilo eterno · save_config in-place corruptible · config corrupto→defaults silenciosos pierde keys · persistencia fuera del lock last-writer-wins · keys/passwords plano en data/ · drives() A-Z existe() bloquea segundos · list_dir sin paginación (System32=MBs) · mkdir anywhere · spawn_detached consola parpadeante · ServerManager sin Drop huérfanos · plugins running nunca poda · run_command ejecuta plugin.json literal · scan plugins en CADA GET · statsx spawn stuck true · probe 800ms bajo Mutex · updates 403=indistinguible vacío · kanban build sin single-flight · kanban ids colisión · clamps faltantes · re-serializa todo el board por mutación · cmd_open traga errores respondiendo ok · cmd_navigate no actualiza inner.url · build_as_child ~100ms síncrono jank · exit sin teardown PTY/srvman huérfanos · puertos agotados muerte silenciosa · WS fallo invisible · sin single-instance guard · zip-bomb OOM · conversión pesada en worker

## 🔵 LOW (33)
67-99: doble-decode %2F · precedencia || && · picks>64 sin señal · close frame sin respuesta · poisoning inconsistente · unix sh -c arbitrario · WindowGeometry sin default · MIME faltantes · copy_dir recursión profunda · TOCTOU multibyte · reveal coma rompe explorer · nombres duplicados plugins · round-trip Value innecesario · interpolación cruda URLs · reasignación redundante · into_string sin límite · column no validada · corrupto sin bak · UA spoof · action wildcard load_url("") · import sin uso · ICO slice · hilo por request sin pool · docs_root silencioso · mojibake ext desconocida · dest==src · PDF sin wrap · scaffolds infrastructure/ sin wiring

## ✅ NOTE (10 verificaciones)
100. Guard `/shell/*` estáticos VERIFICADO correcto (fix b14cb6d9) — ningún endpoint sombreado
101. since/base_offset polling HTTP CORRECTO (bug real solo en writer WS #7/#8)
102-104. CERO alucinaciones API: firmas wry/winit/tiny_http/portable-pty/zip/lopdf/quick-xml verificadas una por una
105-109. Mutex ausencia por diseño main-thread OK · kanban sin huérfanas · mode=ro WAL seguro · dotfiles intencional · updates best-effort

## Resumen
| Severidad | Count |
|---|---|
| 🔴 CRITICAL | 5 |
| 🟠 HIGH | 19 |
| 🟡 MEDIUM | 42 |
| 🔵 LOW | 33 |
| ✅ NOTE | 10 |
| **Total** | **109** |

**Patrón dominante:** defecto raíz único (#6: /shell/* sin token + CORS reflejado) convierte fsx/docs/plugins/srvman en primitivas drive-by. Segundo cluster: ring buffer WS PTY (#7/#8) + stall event loop (#9).
