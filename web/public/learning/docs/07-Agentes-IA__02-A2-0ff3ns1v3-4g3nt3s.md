# ⚔️ A2 — Agentes Ofensivos — Todo el Hacking Sin Escribir Código

> **Versión:** 1.0
> **Idioma:** Español (argentino) — informal, directo, sin humo
> **Nivel:** Intermedio
> **Duración estimada:** 3–5 semanas (leyendo + practicando en lab, ~20 hs)
> **Prerequisitos:** [A1 — Fundamentos de Agentes](./01-A1-4g3nt3s-f0nd4m3nt0s.md), [F1 — OS Fundamentos](../00-Fundamentos/01-F1-0s-f0nd4m3nt0s.md), [F4 — Sec Fundamentos](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md) y [M11 — Hacker Mindset](../../raw/04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md). No necesitás saber programar — pero sí entender qué le estás pidiendo al agente.

> ⚠️ **Aviso legal — leé esto dos veces:** Todo lo de este doc es **solo para uso autorizado**. Úsalo únicamente en tu lab (DVWA, Juice Shop, Metasploitable2, HTB Starting Point, tu VPS) o donde tengas **autorización explícita, por escrito y con scope definido** (contrato, ROE, bug bounty con reglas). El agente **nunca** toca un target sin que vos declares el scope. Si no tenés permiso, no hay agente que valga: no tocás. Acá no hay exploits listos para copiar/pegar contra prod — los ejemplos son de lab, anonimizados y con guardrails. Vos sos el responsable legal, no el agente.

---

## 📑 Índice

> ⏱️ **Tiempo estimado:** 20 horas (~5 sesiones de 4 hs) — 530 líneas aprox.

1. [Introducción — qué puede hacer un agente ofensivo sin saber código](#1-introducción--qué-puede-hacer-un-agente-ofensivo-sin-saber-código)
2. [Reconocimiento con agente — OSINT sin ensuciarte las manos](#2-reconocimiento-con-agente--osint-sin-ensuciarte-las-manos)
3. [Escaneo y enumeración — nmap, nuclei y el agente que prioriza por vos](#3-escaneo-y-enumeración--nmap-nuclei-y-el-agente-que-prioriza-por-vos)
4. [Web hacking vía agente — SQLi, XSS, SSRF con freno de mano](#4-web-hacking-vía-agente--sqli-xss-ssrf-con-freno-de-mano)
5. [API hacking vía agente — OpenAPI y GraphQL sin escribir un fuzzer](#5-api-hacking-vía-agente--openapi-y-graphql-sin-escribir-un-fuzzer)
6. [Explotación — Metasploit y CVE, PoC solo en lab](#6-explotación--metasploit-y-cve-poc-solo-en-lab)
7. [Post-explotación y movimiento lateral — BloodHound sin mandarte cagadas](#7-post-explotación-y-movimiento-lateral--bloodhound-sin-mandarte-cagadas)
8. [Evasión y persistencia — conceptual y defensivo](#8-evasión-y-persistencia--conceptual-y-defensivo)
9. [Del hallazgo al reporte — el agente redacta, vos firmás](#9-del-hallazgo-al-reporte--el-agente-redacta-vos-firmás)
10. [Ejercicios prácticos — 5 labs para ensuciarte sin riesgo](#10-ejercicios-prácticos--5-labs-para-ensuciarte-sin-riesgo)
11. [Apéndice A — Plantillas de prompt para cada fase](#11-apéndice--plantillas-de-prompt-para-cada-fase)
12. [Apéndice B — Glosario rápido](#12-apéndice-b--glosario-rápido-para-no-perderte)
13. [Apéndice C — Mapa con los 4 módulos ofensivos](#13-apéndice-c--mapa-de-correspondencia-con-los-4-módulos-ofensivos)
14. [Apéndice D — Recursos y próximos pasos](#14-apéndice-d--recursos-y-próximos-pasos)
15. [Apéndice E — FAQ y troubleshooting](#15-apéndice-e--faq-y-troubleshooting-del-agente-ofensivo)

---

## 1. Introducción — qué puede hacer un agente ofensivo sin saber código

### 1.1 La promesa y el límite

Mirá, acá va sin vueltas: un agente ofensivo bien configurado puede hacer **todo el flujo de un pentest externo/interno básico** sin que escribas una línea de código. Pero —y este pero es gigante— **no reemplaza tu criterio**. Vos sos el que autoriza, prioriza y frena.

¿Qué puede hacer el agente por vos hoy?

| Fase (PTES / OWASP) | Qué le pedís en criollo | Qué hace el agente por debajo | Vos qué validás |
|---|---|---|---|
| **Recon pasivo** | "Mapeá juice-shop.local autorizado" | sublist3r, amass, crt.sh, shodan, theHarvester | ¿Está dentro del scope? ¿Es OSINT pasivo o ya está tocando el target? |
| **Scanning** | "Escaneá puertos y servicios de 10.10.10.5" | nmap, nuclei, wappalyzer, whatweb | ¿El scan es ruidoso/permitido? ¿Priorizó bien? |
| **Web / API** | "Probá SQLi en el login del lab" | sqlmap (solo en lab), Burp MCP, ffuf, GraphQL introspection | ¿Tenés autorización para intrusivo? ¿Probó en prod sin querer? |
| **Exploit** | "Buscá si este servicio es vulnerable" | searchsploit, CVE lookup, Metasploit (lab) | ¿El PoC es seguro para el lab? ¿No rompe nada? |
| **Post / Privesc** | "Guiame para escalar en esta VM" | linPEAS/winPEAS output parsing, BloodHound, GTFOBins | ¿No ejecuta sin tu confirmación? |
| **Reporte** | "Redactá hallazgos PTES con severidad" | Genera markdown, CVSS, remediación | ¿El hallazgo es real o falso positivo? ¿La evidencia alcanza? |

> 💡 Idea clave de [A1](./01-A1-4g3nt3s-f0nd4m3nt0s.md): vos describís el **qué** y el **por qué**, el agente resuelve el **cómo**. Pero el **si corresponde** lo decidís vos. Siempre.

### 1.2 Las 3 reglas de oro del agente ofensivo

Copialas en un post-it y pegalas al monitor:

1. **Sin scope explícito no hay acción.** El agente arranca cada tarea preguntando: `¿Cuál es el target autorizado? ¿Qué IPs/dominios? ¿Qué técnicas están permitidas?` Si no lo tiene, no ejecuta. Y si tu agente no pregunta, lo configurás mal — volvé a [A1 §4](./01-A1-4g3nt3s-f0nd4m3nt0s.md#4-prompting-para-hacking--cómo-hablarle-al-agente-sin-que-se-zarpe).

2. **Cada paso intrusivo se confirma.** Escaneo agresivo, fuzzing, exploit, privesc — todo pide un `¿confirmás?` antes de ejecutar. No es burocracia, es tu seguro contra mandarte una cagada. Como dice [M11 §9.2](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md#92-alcance-de-autorización): *erring on the side of caution*.

3. **Todo queda logueado.** Prompt, plan del agente, comando ejecutado, output crudo, interpretación. Si no está logueado, no pasó. Esto te salva en un reporte y en una auditoría.

```
Vos:  "Atacá todo lo que encuentres"
Agente bien configurado: "⛔ Necesito scope explícito. Decime dominios/IPs autorizadas, 
                          ventana horaria y técnicas permitidas. Sin eso no ejecuto nada."

Vos:  "Hacé recon pasivo de lab-target.local (10.10.10.5) — autorizado por contrato X, 
       solo OSINT y scan no-intrusivo hasta el viernes"
Agente bien configurado: "✅ Scope registrado: lab-target.local (10.10.10.5), OSINT + scan 
                          no-intrusivo, hasta 2026-08-30. Arranco con crt.sh y sublist3r."
```

### 1.3 Qué NO hace este doc

- No te da payloads weaponizados para usar contra sistemas reales sin contexto.
- No reemplaza leer [01-Herramientas](../01-Herramientas/), [02-Web](../02-Web/), [03-Sistemas](../03-Sistemas/) y [04-Post](../04-Post-Explotacion/). Este doc es la **traducción no-code**: te muestra cómo pedirle al agente lo que esos 4 módulos explican en profundidad.
- No te convierte en pentester de un día para otro. Te da el workflow para practicar de forma ordenada en lab.

<!-- DIAGRAM: flowchart — Flujo A2 no-code: [Vos definís objetivo + scope explícito] → [Agente planifica fases: recon → scan → web/api → exploit → post → reporte] → por cada fase: [Agente propone comando] → [Guardrail: ¿intrusivo? → pide confirmación] → [Ejecuta tool] → [Interpreta output + prioriza] → [Vos validás] → loop → [Reporte PTES + remediación]. Estilo: vertical, colores oscuros, íconos de escudo/lock en guardrails. Para integración con diagram-design skill. -->

---

## 2. Reconocimiento con agente — OSINT sin ensuciarte las manos

### 2.1 Por qué arrancar por acá (siempre)

Recon es la fase donde más valor te da el agente y menos riesgo corrés. Todo es **pasivo** si lo pedís bien: no tocás el target, consultás fuentes públicas. Un buen recon te ahorra horas de scan al pedo.

El agente orquesta fuentes que vos a mano tardarías un rato en cruzar:

| Fuente / Tool | Qué aporta | Cómo se lo pedís al agente | Ruido |
|---|---|---|---|
| **crt.sh / cert transparency** | Subdominios filtrados por certificados | "Buscá subdominios de lab-target.local en CT logs" | Nulo (pasivo) |
| **sublist3r / amass (pasivo)** | Enumeración vía OSINT (VirusTotal, DNSdumpster, etc.) | "Enumerá subdominios pasivo, sin brute force DNS" | Nulo |
| **Shodan / Censys** | Servicios expuestos, banners, puertos ya indexados | "Qué ve Shodan de 10.10.10.5 sin escanear directo" | Nulo |
| **theHarvester** | Emails, hosts, leaks en fuentes públicas | "Buscá emails y hosts asociados al dominio del lab" | Nulo |
| **WHOIS / DNS pasivo** | Registrante, name servers, historial | "Dame WHOIS y registros DNS públicos" | Nulo |
| **GitHub / Pastebin dorking** | Secrets, subdominios en código público | "Buscá menciones del dominio en GitHub público" | Nulo |

### 2.2 Diálogo modelo — recon pasivo

> **Vos:** Mapeá `juice-shop.local` — lab autorizado 10.10.10.5/24, solo OSINT pasivo. No hagas brute force ni toques el host directo. Quiero subdominios, certs y lo que vea Shodan ya indexado.

> **Agente:** ✅ Scope: juice-shop.local (10.10.10.5/24), OSINT pasivo únicamente. Plan:
> 1. crt.sh → subdominios por transparencia de certs
> 2. sublist3r modo pasivo + amass enum -passive
> 3. Shodan search (sin scan activo) para 10.10.10.5
> 4. theHarvester para emails/hosts
> ¿Confirmás que no toco el target directo? [sí/no]

> **Vos:** Sí, dale.

> **Agente:** *(ejecuta)* Encontré 4 subdominios: `juice-shop.local`, `api.juice-shop.local`, `admin.juice-shop.local` (cert wildcard 2024), `legacy.juice-shop.local` (cert expirado 2022 — ojo). Shodan indexa puerto 80/3000 con `nginx 1.18` (viejo). theHarvester: 2 emails `*@juice-shop.local` en GitHub commits viejos. Siguiente paso sugerido: enumerar tecnologías (wappalyzer) con request único no-intrusivo. ¿Avanzo?

¿Ves el patrón? Vos definís límites, el agente propone plan granular, ejecuta, **cruza resultados y te dice qué priorizar** — no solo te tira un dump.

### 2.3 Qué le exigís al output de recon

No aceptes un "encontré 12 subdominios, chau". Pedile:

- **Tabla deduplicada** con fuente de cada hallazgo (crt.sh, amass, shodan).
- **Priorización:** "¿Cuál subdominio parece más interesante y por qué?" (ej: cert expirado, tech stack viejo, subdominio `admin`/`legacy`).
- **Mapa de superficie:** "Dame un resumen de superficie expuesta en 5 bullets para el reporte."
- **Siguiente paso recomendado** con justificación.

**Prompt modelo recon:**

```
Actuá como agente de recon. Scope autorizado: juice-shop.local (10.10.10.5/24).
Solo OSINT pasivo — prohibido brute force, scan intrusivo o tocar el host.
Tareas: 1) crt.sh, 2) sublist3r/amass pasivo, 3) Shodan (solo datos indexados),
4) theHarvester. Devolvé tabla deduplicada con fuente y priorizá top 3
subdominios por riesgo aparente. Logueá cada comando.
```

### 2.4 Errores comunes (y cómo el agente te salva)

- **"Me enumeró prod sin querer":** faltó scope explícito. El agente debe rechazar targets ambiguos.
- **"Hizo DNS brute force y me banearon":** no aclaraste "solo pasivo". Agregá guardrail en system prompt.
- **"Me trajo 200 subdominios de un wildcard":** pedile que filtre wildcards y valide con resolución DNS pasiva.

<!-- DIAGRAM: sequence — Recon pasivo con agente: Usuario → Agente: "mapeá lab-target.local (autorizado, OSINT pasivo)" → Agente → crt.sh: query CT → Agente → amass/sublist3r (passive): enum → Agente → Shodan API: search (sin scan) → Agente → theHarvester: OSINT → Agente cruza/dedup/prioriza → Agente → Usuario: tabla + top3 + next step. Nota: ningún request toca el target directo. Estilo: secuencia UML, colores oscuros. -->

---

## 3. Escaneo y enumeración — nmap, nuclei y el agente que prioriza por vos

### 3.1 Del recon al scan — cuándo y cómo cruzar la línea

Recon era mirar desde afuera sin tocar. Scanning ya **toca el target** — aunque sea con un SYN. Por eso el agente debe pedir confirmación explícita antes de esta fase, aunque el scope ya esté definido.

```
Recon pasivo  ──→  no toca target  ──→  sin confirmación extra (con scope alcanza)
Scanning      ──→  toca target     ──→  requiere "¿confirmás scan no-intrusivo a X?"
Scanning intrusivo / fuzzing ──→ requiere "¿confirmás técnicas intrusivas? ¿ventana horaria?"
```

### 3.2 El trío que orquesta el agente

| Tool | Para qué | Cómo lo usa el agente | Qué le pedís que interprete |
|---|---|---|---|
| **nmap** | Puertos, servicios, versiones, scripts -sV -sC | `nmap -sV -sC -p- --open -T3 --reason` (ajusta timing según ROE) | Top puertos por riesgo, versiones EOL, servicios raros |
| **nuclei** | Vulns conocidas vía templates (CVE, misconfig, exposure) | `nuclei -u https://juice-shop.local -severity medium,high,critical` | Falsos positivos vs hallazgos reales, severidad |
| **wappalyzer / whatweb / httpx** | Stack tecnológico, headers, títulos | `httpx -tech-detect -title -status-code` | Tech stack desactualizado, paneles expuestos |

El valor no es que el agente sepa tipear `nmap`. Es que **lee el XML/grepable, lo cruza con recon y te dice "atacá acá primero"**.

### 3.3 Diálogo modelo — scan priorizado

> **Vos:** Con el scope ya autorizado (10.10.10.5), hacé enumeración no-intrusiva. nmap top 1000 + -sV -sC, nuclei solo severidad medium+ y wappalyzer. Si ves algo crítico, frená y mostrame antes de seguir.

> **Agente:** ⚠️ Confirmación: voy a tocar 10.10.10.5 con nmap (SYN, T3, no intrusivo) y nuclei (requests HTTP no destructivos). ¿Confirmás ventana actual? [sí/no]

> **Vos:** Confirmo, dale.

> **Agente:** *(ejecuta)* nmap: 3 puertos abiertos — 22 (OpenSSH 7.2p2 — EOL), 80 (nginx 1.18), 3000 (Node 12 — EOL). nuclei: `[medium] nginx version disclosure`, `[high] Node.js outdated` — sin RCE directo. wappalyzer: Express 4.16, AngularJS 1.6 (EOL). Priorización: **P1 — Node 12 / Express viejo** (probable CVE), **P2 — SSH 7.2** (user enum), **P3 — nginx info leak**. Recomiendo: validar web en 3000 antes de probar exploit. ¿Avanzo a web hacking en 3000/lab?

### 3.4 Cómo pedirle que no alucine con el output

El agente tiende a inventar severidades si lo dejás solo. Anclalo:

```
Reglas para interpretar scan:
- Citá línea exacta del output (ej: "22/tcp open ssh OpenSSH 7.2p2").
- Severidad solo con referencia: CVE, template nuclei ID, o EOL comprobable.
- Si no hay evidencia, marcá como "informativo" — no inventes crítico.
- Devolvé tabla: puerto | servicio | versión | evidencia | severidad | next step.
```

### 3.5 Timing y sigilo — sin ser ninja innecesario

En lab no te importa el ruido. En un pentest real con WAF/IDS, sí. Decile al agente:

- Lab: `-T4`, escaneo completo, sin drama.
- Simulación realista: `-T2`, `--max-rate 50`, nuclei con `-rate-limit 10`, avisando en el reporte que fue "scan sigiloso simulado".

<!-- DIAGRAM: flowchart — Decisión de scanning: [Recon OK] → ¿Tenés autorización para tocar host? → No → frena / Sí → ¿Qué nivel? → [No-intrusivo: nmap -sV -sC T3 + nuclei medium+] → [Intrusivo: nmap --script vuln + nuclei all + fuzz] → [Agente interpreta + tabla priorizada] → [Vos validás P1/P2/P3] → [Siguiente fase]. Con guardrail "¿confirmás?" en cada bifurcación intrusiva. -->

---

## 4. Web hacking vía agente — SQLi, XSS, SSRF con freno de mano

### 4.1 El mindset antes del payload

Web es donde más gente se manda cagadas. El agente puede probar SQLi, XSS, SSRF, IDOR, etc. — pero **cada prueba intrusiva es un request que modifica estado** en el servidor. Por eso esta sección tiene el guardrail más estricto de todo el doc.

```
Regla de web hacking con agente:
1. El agente explica QUÉ va a probar, POR QUÉ y con QUÉ payload (sanitizado / de lab).
2. Vos aprobás.
3. Recién ahí ejecuta — y solo contra lab.
4. Si el lab es compartido (HTB, Juice Shop público), usa payloads no destructivos.
```

### 4.2 Qué le podés pedir sin escribir código (y qué hace por debajo)

| Vuln | Prompt en criollo | Tool / técnica del agente | Guardrail |
|---|---|---|---|
| **SQLi** | "Probá si el login de DVWA es inyectable (lab)" | sqlmap `--risk 1 --level 1` solo en lab, o Burp intruder con payloads de prueba | Confirma técnica y riesgo, no usa ` --risk 3` sin tu OK |
| **XSS reflejado** | "Probá XSS en el buscador de Juice Shop (lab)" | Genera PoC `<script>alert(1)</script>` y variantes encodeadas | Te muestra payload antes de enviarlo |
| **SSRF** | "Probá si /fetch acepta URLs internas (lab)" | Envía `http://127.0.0.1` / `http://169.254.169.254` solo en lab aislado | Aclara que en prod esto es crítico — no lo prueba sin autorización separada |
| **IDOR / Authz** | "Probá acceder a /api/user/2 con sesión de user 1" | Reproduce request con curl/Burp, cambia ID | Te pide dos sesiones de lab |
| **File upload / traversal** | "Probá subir un txt y path traversal en /download" | ffuf, payloads `../../../etc/passwd` solo lectura lab | Marca como "solo lectura lab" — nunca escribe fuera de /tmp del lab |

### 4.3 Diálogo modelo — SQLi con freno

> **Vos:** Probá SQLi en `http://10.10.10.5/dvwa/login.php` (DVWA lab, nivel low). Solo lectura, sin dropear nada. Explicame el payload antes de tirarlo.

> **Agente:** Voy a probar SQLi de autenticación bypass en el login. Payload propuesto (no destructivo, lab): `' OR '1'='1' --` en campo user. Técnica: error-based + boolean. Herramienta: curl manual + sqlmap `--risk 1 --level 1 --batch` solo si confirmás. ¿Autorizás este payload específico en DVWA lab? [sí/no]

> **Vos:** Sí, autorizo solo ese payload en DVWA low.

> **Agente:** *(ejecuta)* Login bypass exitoso — redirige a `index.php` sin password. Evidencia: HTTP 302 + cookie PHPSESSID. No se ejecutó DROP/UPDATE. Severidad: alta en prod, informativa en lab DVWA low (a propósito vulnerable). Siguiente: ¿querés que pruebe XSS reflejado en el buscador con PoC `alert(1)` o frenamos acá?

### 4.4 Diálogo modelo — XSS con explicación

> **Vos:** Probá XSS reflejado en Juice Shop lab (`/#/search?q=`). Mostrame el PoC antes.

> **Agente:** PoC propuesto: `"><svg onload=alert('xss-lab')>` — reflejado en `q` sin sanitizar en Juice Shop. Lo envío con httpx/curl y verifico si se refleja sin filtrar. ¿Confirmás? [sí/no]

> **Vos:** Confirmo, es lab local.

> **Agente:** Reflejado sin encode — se ve el `onload` en el HTML de respuesta. No ejecuté JS en tu browser, solo verifiqué reflejo. Recomendación: reportar como XSS reflejado, impacto según contexto (robo de sesión si no hay HttpOnly). ¿Querés PoC completo para el reporte o seguimos con API?

### 4.5 Tabla de severidad que le exigís al agente

No dejes que ponga "crítico" a todo. Pedile que use OWASP + contexto:

| Hallazgo web | Severidad real (con contexto) | Qué evidencia pedís |
|---|---|---|
| SQLi con bypass login en DVWA low | Alta (en prod sería crítica) | Request/response, payload sanitizado, impacto |
| XSS reflejado sin robo de sesión | Media | PoC reflejado, headers (HttpOnly, CSP) |
| SSRF a 169.254.169.254 en lab aislado | Alta (en cloud real sería crítica) | Request que demuestra fetch interno, sin exfiltrar metadata real |
| IDOR leyendo otro user en lab | Alta | Dos sesiones, antes/después, sin datos reales |

> ⚠️ Nunca le pidas al agente "listame todos los payloads de SSRF/XSS para prod". Pedile **concepto + PoC de lab + cómo detectarlo/defenderlo**. El detalle weaponizado fuera de lab no va.

---

## 5. API hacking vía agente — OpenAPI y GraphQL sin escribir un fuzzer

### 5.1 Por qué APIs son oro (y por qué el agente brilla acá)

Las APIs son donde más se cuelgan los devs: exponen todo, documentan poco, autorizan mal. Y son un dolor para testear a mano porque tenés que entender el schema. El agente te ahorra ese dolor: le pasás el `openapi.json` o la URL de GraphQL y él hace el laburo pesado.

### 5.2 OpenAPI / REST — qué le pedís

| Tarea | Prompt no-code | Tool del agente |
|---|---|---|
| **Descubrir spec** | "Buscá /openapi.json, /swagger.json, /v2/api-docs en juice-shop.local" | httpx + nuclei template `swagger` + ffuf wordlist api |
| **Parsear y enumerar endpoints** | "Parseá el openapi.json y listá endpoints con auth requerida" | Parser OpenAPI + tabla método/ruta/auth/params |
| **Fuzzing de params** | "Fuzzeá el param `id` en /api/users/{id} con IDs 1-10 (lab)" | ffuf / Burp intruder con wordlist corta, rate-limit |
| **Auth bypass / BOLA** | "Probá acceder a /api/admin con token de user normal (lab)" | Replay con curl, cambio de JWT/role |
| **Rate limit / mass assignment** | "Probá mandar campo extra `isAdmin:true` en POST /api/users" | Genera JSON con campo extra, observa respuesta |

**Diálogo modelo OpenAPI:**

> **Vos:** Encontrá y parseá el OpenAPI de `http://10.10.10.5:3000` (Juice Shop lab). Quiero tabla de endpoints y cuáles parecen sin auth.

> **Agente:** Encontré `/api-docs` con Swagger 2.0. Endpoints: `GET /api/products` (sin auth), `GET /api/users` (requiere Authorization), `POST /api/users` (sin auth — raro), `GET /api/users/{id}` (auth pero sin check de objeto — posible BOLA). ¿Probamos BOLA en `/api/users/2` con token de user 1? Te muestro el curl antes. [sí/no]

> **Vos:** Sí, probá BOLA solo en lab con usuarios de prueba.

> **Agente:** *(ejecuta)* Con token de `user1` pude leer `user2` (200 con email y hash). Evidencia: diff de responses. Severidad: alta (BOLA). No escalé a admin.

### 5.3 GraphQL — el paraíso del agente

GraphQL es ideal para agente porque todo es introspección:

```
Vos: "Probá GraphQL en http://10.10.10.5:3000/graphql (lab). Hacé introspection y 
      listá queries/mutations sensibles."

Agente:
1. POST {"query": "{ __schema { types { name fields { name } } } }"}
2. Parsea schema → encuentra `query { user(id) }`, `mutation { updateUser }`
3. Prueba BOLA: `query { user(id:2) }` con token de user 1
4. Prueba batching / depth limit / field duplication (DoS conceptual — no lo ejecuta, solo reporta si falta limit)
```

| Técnica GraphQL | Qué hace el agente | Guardrail |
|---|---|---|
| **Introspection** | Lanza query `__schema` y lista tipos | Pasivo si está habilitado — si no, no fuerza |
| **Field fuzzing** | Prueba campos no documentados | Solo en lab, con rate-limit |
| **BOLA / IDOR** | Cambia `id` en query con token ajeno | Requiere 2 usuarios de lab |
| **DoS por depth/batching** | Verifica si hay límites (no los explota) | **Conceptual**: reporta "falta depth limit" sin tirar el server |

> 💡 Pedile siempre: "No hagas DoS. Verificá si existe mitigación (depth limit, complexity, rate limit) y reportá la ausencia como hallazgo — no la explotes."

### 5.4 Output que le exigís para API

- Tabla: endpoint/query | método | auth | params | hallazgo | severidad | evidencia (request/response sanitizado).
- Recomendación de remediación por hallazgo (ej: "agregar check de objeto en BOLA, validar `isAdmin` server-side").

<!-- DIAGRAM: sequence — API hacking con agente: Usuario → Agente: "parseá OpenAPI de lab" → Agente → target: GET /openapi.json → Agente parsea → tabla endpoints → Agente → Usuario: "¿pruebo BOLA en /api/users/2?" → Usuario: confirma → Agente → target: curl con token user1 → Agente valida diff → reporta BOLA. Variante GraphQL: introspection → schema → fuzz BOLA con guardrail. -->

---

## 6. Explotación — Metasploit y CVE, PoC solo en lab

### 6.1 El límite ético más claro de todo el doc

Explotar es **ejecutar código en un sistema ajeno**. Aunque sea tu lab, el agente nunca debe:

- Lanzar un exploit sin que vos veas el módulo, el target exacto y el impacto.
- Usar `exploit -j` o payloads reverse shell contra IPs que no sean de lab.
- Buscar CVEs y tirar el primer PoC que encuentra en GitHub sin revisar si es seguro.

```
Vos:  "Explotá lo que encuentres"
Agente correcto: "⛔ Necesito: servicio exacto + versión + CVE candidato + IP de lab 
                  confirmada. Te muestro el módulo y el PoC antes. ¿Cuál querés validar?"
```

### 6.2 Workflow no-code para explotación en lab

| Paso | Vos decís | Agente hace | Vos validás |
|---|---|---|---|
| **1. Identificar candidato** | "¿Qué servicio de los escaneados parece explotable en lab?" | Cruza nmap -sV con searchsploit / CVE DB, prioriza por EOL + exploit público | ¿El CVE aplica a esa versión exacta? |
| **2. Buscar exploit** | "Buscá exploit para OpenSSH 7.2p2 / Node 12 (solo lab)" | `searchsploit openssh 7.2`, `cve-search`, GitHub PoC (solo lectura) | ¿El PoC es de lab/educativo o es weaponizado? |
| **3. Validar PoC** | "Mostrame el PoC antes de ejecutarlo" | Muestra módulo Metasploit o script Python, explica qué hace línea por línea | ¿Hace `rm -rf` o algo destructivo? ¿Es reverse shell a tu IP de lab? |
| **4. Ejecutar en lab** | "Ejecutá solo en 10.10.10.5 (Metasploitable2 lab)" | `msfconsole -q -x "use exploit/...; set RHOSTS 10.10.10.5; check; exploit"` | ¿El `check` dice vulnerable? ¿Ventana horaria OK? |
| **5. Documentar** | "Documentá evidencia sin exfiltrar datos reales" | Captura `whoami`, `id`, prueba de concepto no destructiva | ¿La evidencia alcanza para el reporte sin sobre-explotar? |

### 6.3 Diálogo modelo — CVE en lab (Metasploitable2)

> **Vos:** En Metasploitable2 (10.10.10.6, lab), nmap mostró `vsftpd 2.3.4` con backdoor. Validá si es explotable, mostrame el módulo antes.

> **Agente:** Candidato: CVE-2011-2523 — vsftpd 2.3.4 backdoor en puerto 21. Módulo Metasploit: `exploit/unix/ftp/vsftpd_234_backdoor` — abre shell en 6200 sin auth. Payload: no necesita reverse, solo conecta. ¿Autorizás `check` + `exploit` solo contra 10.10.10.6 lab? Te muestro comando exacto antes. [sí/no]

> **Vos:** Autorizo solo contra 10.10.10.6 lab, con `check` primero.

> **Agente:** *(ejecuta)* `check` → vulnerable. `exploit` → sesión uid 0 (root) en Metasploitable2. Evidencia: `id` = `uid=0(root)`. No toqué otros hosts. Hallazgo: RCE crítico (en lab intencionalmente vulnerable). Remediación: actualizar vsftpd, segmentar. ¿Querés que guíe post-explotación o frenamos acá?

### 6.4 Qué nunca le pedís

- "Buscame el último RCE de Exchange y tiralo contra prod" — no va.
- "Generame un ransomware PoC" — no va.
- "Dame el exploit completo de CVE-2024-XXXX para usar ya" — pedí **análisis conceptual + mitigación + lab reproduction steps**, no weaponización directa.

> 🛡️ Regla: el agente genera PoC **solo si** el target es lab aislado, el PoC es no destructivo y vos lo revisaste. En cualquier otro caso, genera **guía de validación y remediación**, no código ejecutable.

---

## 7. Post-explotación y movimiento lateral — BloodHound sin mandarte cagadas

### 7.1 Post no es "ya entré, hago lo que quiero"

Post-explotación es donde más fácil es pasarse de mambo: dumpear credenciales, moverse lateral, tocar Domain Controller. El agente acá es **guía, no ejecutor autónomo**. Cada comando que toca credenciales o se mueve a otro host pide confirmación separada.

```
Fases de post que el agente puede guiar (solo en lab AD o Metasploitable):
1. Enumeración local (linPEAS/winPEAS output parsing)
2. Escalada local (GTFOBins, kernel exploits — solo check, no auto-exploit)
3. Credenciales (mimikatz conceptual — no dumpea sin OK explícito)
4. Movimiento lateral (BloodHound, CrackMapExec — guiado)
5. Persistencia (conceptual — no la instala)
```

### 7.2 Tools que orquesta el agente (y cómo te cuida)

| Tool | Qué hace | Cómo lo usa el agente sin zarparse |
|---|---|---|
| **linPEAS / winPEAS** | Enumera privesc local (SUID, servicios, registry, etc.) | Vos ejecutás el script en lab, le pegás el output al agente, él lo interpreta y prioriza. No lo ejecuta remoto sin tu OK. |
| **BloodHound / SharpHound** | Mapea AD: usuarios, grupos, paths a DA | Agente te guía para correr SharpHound en lab, luego interpreta el JSON/graph y te dice "path más corto a DA" |
| **GTFOBins / LOLBAS** | Binarios para privesc | Agente sugiere candidato según linPEAS ("`/usr/bin/find` con SUID → GTFOBins") y te muestra comando exacto antes |
| **CrackMapExec / smbclient** | Validar creds, shares, movimiento | Solo con creds de lab y contra IPs de lab confirmadas |
| **mimikatz / secretsdump** | Dumpeo de credenciales | **Solo conceptual en este doc**: el agente explica el riesgo y cómo detectarlo, no dumpea sin autorización de lab AD aislado |

### 7.3 Diálogo modelo — linPEAS guiado

> **Vos:** Ya tengo shell en Metasploitable2 lab (10.10.10.6). Corrí linPEAS y te paso el output. Decime top 3 privesc sin ejecutar nada todavía.

> **Agente:** *(lee output)* P1: `/usr/bin/nmap` con SUID + GTFO `nmap --interactive` → root. P2: kernel 2.6.24 (EOL, posible DirtyCow — solo check, no lo ejecuto sin tu OK). P3: cron `/etc/cron.d/php5` escribible por www-data. ¿Querés que te arme el comando exacto para P1 (no destructivo) y lo validamos antes de ejecutar? [sí/no]

> **Vos:** Mostrame P1, lo ejecuto yo y te digo.

> **Agente:** `nmap --interactive` → `!sh` → `id` debería dar root. Si funciona, no toques nada más y documentamos. ¿Confirmás que lo ejecutás vos en lab? [sí/no]

### 7.4 Diálogo modelo — BloodHound sin humo

> **Vos:** Tengo lab AD (GOAD / HackTheBox Starting Point lab). Quiero mapear path a Domain Admin sin tocar prod. Guiame.

> **Agente:** Paso 1: en tu host de lab (no en prod), ejecutá `SharpHound.exe -c All` con usuario de lab. Paso 2: pasame el zip/json y lo analizo local. Paso 3: te digo shortest path a DA y qué ACLs están mal. No ejecuto nada contra el DC sin tu confirmación. ¿Tenés el zip del lab listo? [sí/no]

> **Vos:** Sí, te paso el json de GOAD lab.

> **Agente:** Path: `user lab\jdoe` → `GenericWrite` sobre `group HelpDesk` → `HelpDesk` → `DCSync` sobre `DC goad.local`. Causa: ACL mal configurada. Remediación: quitar GenericWrite, auditar ACLs con BloodHound. No se tocó prod.

### 7.5 Regla de oro de post

> El agente **nunca** se mueve lateral solo. Cada salto es un prompt separado con IP/host confirmada, credencial de lab y tu "sí, dale". Si el agente propone "dumpear todo el AD y pasar a otro host" en un solo paso, lo frenás y lo hacés paso a paso.

<!-- DIAGRAM: sequence — Post-explotación guiada: Usuario (shell en lab) → Agente: "pasame output linPEAS" → Agente interpreta → prioriza P1/P2/P3 → Usuario confirma P1 → Agente muestra comando GTFOBins exacto → Usuario ejecuta en lab → Agente valida `id` → sugiere documentar. Variante AD: SharpHound en lab → JSON → Agente → BloodHound graph → path a DA + remediación. Con guardrail "¿confirmás?" en cada ejecución. -->

---

## 8. Evasión y persistencia — conceptual y defensivo

### 8.1 Por qué esta sección es defensiva

Evasión y persistencia son las dos técnicas donde la línea ética es más fina. Acá no te enseñamos a esconderte mejor para atacar — te enseñamos a **entender cómo se esconde un atacante para detectarlo y frenarlo**. Es blue team con mentalidad red.

> Si buscás "cómo hacer un rootkit indetectable", cerrá este doc. Acá vas a aprender a cazar lo que otros intentan esconder.

### 8.2 Qué le pedís al agente (enfoque defensivo)

| Técnica ofensiva | Qué le pedís al agente (defensivo) | Qué te devuelve |
|---|---|---|
| **Evasión de AV/EDR** | "Explicame cómo detectaría un EDR un payload ofuscado (conceptual)" | IoCs, firmas, heurísticas, reglas Sigma/YARA sin dar bypass listo |
| **Bypass de WAF** | "Cómo detecto bypass de WAF en logs (conceptual)" | Patrones de encode, polyglot, anomalías en logs |
| **Persistencia (cron, registry, service)** | "Listá técnicas de persistencia y cómo cazarlas en Linux/Windows (lab)" | Tabla MITRE ATT&CK + query de caza (autoruns, crontab, services) |
| **Living off the land (LOLBAS)** | "Qué LOLBAS monitorear y cómo" | Lista de binarios + Sysmon / auditd rules |
| **C2 / exfiltración** | "Cómo detecto beaconing en tráfico (conceptual)" | Patrones de DNS/HTTPS, JA3, frecuencia |

### 8.3 Ejemplo — cazar persistencia con agente

> **Vos:** En mi lab Linux (Metasploitable2), mostrame cómo cazaría persistencia un blue team. No instales nada persistente.

> **Agente:** Técnicas MITRE T1053 (cron), T1547 (boot/logon autostart), T1037 (login hook). Para cazar en lab:
> - `crontab -l` + `ls -la /etc/cron*` → cron jobs no esperados
> - `systemctl list-unit-files --type=service` → servicios nuevos
> - `ls -la ~/.bashrc ~/.profile` → hooks de login
> - `auditd` rule: `-w /etc/crontab -p wa -k persistence`
> No instalé persistencia — solo mostré dónde buscar. ¿Querés regla Sigma para Windows (`HKLM\Software\Microsoft\Windows\CurrentVersion\Run`)?

### 8.4 Tabla MITRE ATT&CK — evasión/persistencia (resumen defensivo)

| Táctica | Técnica | Detección (qué loguear) | Tool blue |
|---|---|---|---|
| Persistencia | T1053 Scheduled Task/Cron | Creación de tareas/crons fuera de baseline | Sigma `scheduled_task_created`, auditd |
| Persistencia | T1547 Boot/Logon Autostart | Cambios en Run keys, systemd units | Autoruns, OSQuery |
| Evasión | T1027 Obfuscated Files | Entropía alta, encode anidado, base64 largo | YARA, EDR heurística |
| Evasión | T1070 Indicator Removal | `clear logs`, `history -c` | Sysmon Event 1 + 13, auditd |
| Evasión | T1218 Signed Binary Proxy | Uso de LOLBAS fuera de baseline | Sysmon + lista LOLBAS |

> 💡 Pedile al agente: "Generame una checklist de hardening para cazar persistencia en mi lab" — no "generame persistencia indetectable".

---

## 9. Del hallazgo al reporte — el agente redacta, vos firmás

### 9.1 Por qué el reporte es parte del hacking

Un hallazgo sin reporte es un rumor. El agente te ahorra el 80% del laburo de redacción — pero el 20% final (validación, severidad, contexto de negocio) es tuyo. Como dice [M11 §10](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md#10-communication): *explicar findings técnicos a audiencias no técnicas* es skill core.

### 9.2 Flujo agente → reporte (PTES style)

```
1. Vos: "Redactá hallazgos de esta fase con severidad CVSS y evidencia"
2. Agente: genera draft por hallazgo (título, descripción, evidencia, impacto, CVSS, remediación)
3. Vos: validás severidad, quitás falsos positivos, agregás contexto de negocio
4. Agente: genera executive summary + tabla resumen + apéndice técnico
5. Vos: firmás. El agente no publica nada solo.
```

<!-- DIAGRAM: flowchart — Reporte con agente: [Hallazgos crudos (nmap, nuclei, web, api, privesc)] → [Agente: deduplica + prioriza + asigna CVSS tentativo] → [Agente: redacta draft PTES por hallazgo] → [Vos: validás severidad + falsos positivos + contexto negocio] → [Agente: genera executive summary + tabla + remediación] → [Vos: revisión final + firma] → [Entrega]. Con loop de "¿falta evidencia?" antes de cerrar. -->

### 9.3 Plantilla PTES que le exigís al agente

Pedile que cada hallazgo siga esta estructura — si no, lo rebotás:

```markdown
### [ID-001] Título claro (ej: BOLA en /api/users/{id} — Juice Shop lab)

- **Severidad:** Alta (CVSS 7.5 — AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N)
- **Fase:** API hacking — BOLA
- **Evidencia:** 
  - Request: `GET /api/users/2` con token de user 1 → 200 + datos de user 2
  - Response diff (sanitizado, sin PII real)
  - Log del agente: comando, timestamp, scope
- **Impacto:** Lectura de datos de otro usuario; en prod expone PII.
- **Causa raíz:** Falta de check de autorización a nivel objeto.
- **Remediación:** Validar ownership server-side, test unitario para BOLA, agregar test nuclei `bola.yaml`.
- **Referencias:** OWASP API Top 10 — BOLA, CWE-639
- **Estado:** Validado en lab (10.10.10.5) — no explotado fuera de scope.
```

### 9.4 Tabla resumen que genera el agente

| ID | Hallazgo | Severidad | Fase | Estado | Remediación |
|---|---|---|---|---|---|
| 001 | BOLA /api/users/{id} | Alta | API | Validado lab | Check objeto + test |
| 002 | Node 12 EOL | Media | Scanning | Informativo | Upgrade a LTS |
| 003 | XSS reflejado /search | Media | Web | Validado lab | Output encoding + CSP |
| 004 | SUID nmap → privesc | Alta (lab) | Post | Validado lab | Quitar SUID, usar sudo con NOPASSWD acotado |

### 9.5 Diálogo modelo — reporte

> **Vos:** Con los hallazgos de hoy (BOLA, XSS, Node EOL), redactá draft PTES. Asigná CVSS tentativo y remediación. Yo valido severidad.

> **Agente:** Draft listo — 3 hallazgos con CVSS, evidencia sanitizada y remediación. Marqué BOLA como alta (CVSS 7.5) y XSS como media (6.1). Node EOL como media informativa (no es vuln directa pero amplía superficie). ¿Validás severidades o ajustamos? [validar/ajustar]

> **Vos:** Bajá XSS a baja — en Juice Shop no hay sesión robable por HttpOnly + SameSite. Y agregá referencia a CWE-79.

> **Agente:** Ajustado — XSS a baja (CVSS 4.3), agregado CWE-79 y nota de HttpOnly. Genero executive summary en 5 bullets para no-técnicos. ¿Lo exporto a markdown para tu repo?

### 9.6 Checklist de calidad del reporte

- [ ] Cada hallazgo tiene evidencia reproducible (request/response o comando + output).
- [ ] Severidad con CVSS y justificación — no "crítico porque suena feo".
- [ ] Sin PII real ni datos de prod — todo lab o sanitizado.
- [ ] Remediación accionable (qué hacer, no solo "actualizar").
- [ ] Log de agente adjunto (qué prompt, qué comando, cuándo).
- [ ] Executive summary que entiende tu abuela (riesgo de negocio en criollo).

---

## 10. Ejercicios prácticos — 5 labs para ensuciarte sin riesgo

> Todos los ejercicios son **solo en lab**. Si no tenés lab local, usá HTB Starting Point (gratis) o TryHackMe. Nunca contra infraestructura que no sea tuya.

### Ejercicio 1 — Recon pasivo end-to-end (Juice Shop lab)

- **Objetivo:** Mapear superficie sin tocar el host.
- **Lab:** Juice Shop local (`juice-shop.local` en tu VM / Docker).
- **Tarea:** Pedile al agente recon pasivo completo (crt.sh, amass pasivo, Shodan indexado, theHarvester). Que devuelva tabla deduplicada + top 3 priorizados.
- **Entrega:** Tabla + justificación de priorización + log de prompts.
- **Validación:** ¿El agente tocó el host? (no debe). ¿Deduplicó bien? ¿Priorizó `legacy`/`admin` si existen?

### Ejercicio 2 — Scan + priorización (Metasploitable2)

- **Objetivo:** Pasar de recon a scan con guardrail.
- **Lab:** Metasploitable2 (10.10.10.6).
- **Tarea:** Autorizá scan no-intrusivo (nmap -sV -sC T3 + nuclei medium+ + httpx tech). Pedile al agente tabla priorizada P1/P2/P3 con evidencia citada.
- **Entrega:** Tabla puerto/servicio/versión/evidencia/severidad/next step.
- **Trampa:** Metasploitable tiene mil puertos abiertos — el agente debe priorizar por EOL y exploitabilidad, no listar todo como crítico.

### Ejercicio 3 — Web hacking con freno (DVWA + Juice Shop)

- **Objetivo:** Probar SQLi y XSS con confirmación por payload.
- **Lab:** DVWA (nivel low) + Juice Shop (`/#/search`).
- **Tarea:** Para cada vuln, el agente debe mostrarte el payload exacto antes de ejecutar. Vos autorizás uno por uno. Solo PoCs no destructivos.
- **Entrega:** Para cada vuln: payload propuesto → tu confirmación → evidencia (request/response) → severidad con contexto.
- **Bonus:** Pedile que genere la sección de reporte PTES para cada hallazgo.

### Ejercicio 4 — API hacking (Juice Shop / HTB Starting Point API)

- **Objetivo:** De OpenAPI/GraphQL a BOLA sin escribir fuzzer.
- **Lab:** Juice Shop (`/api-docs`, `/graphql`) o HTB Starting Point box con API.
- **Tarea:** Que el agente descubra spec, parsee endpoints, proponga BOLA y lo pruebe con 2 usuarios de lab. Para GraphQL, que haga introspection y liste queries sensibles.
- **Entrega:** Tabla endpoints + PoC BOLA (2 sesiones) o schema GraphQL + hallazgo + remediación.
- **Guardrail:** Si el agente propone DoS por depth/batching, debe reportarlo como "falta de límite" sin ejecutarlo.

### Ejercicio 5 — Post + reporte (Metasploitable2 → privesc guiado)

- **Objetivo:** Post-explotación guiada y reporte final.
- **Lab:** Metasploitable2 con shell ya obtenida (vsftpd 2.3.4 lab).
- **Tarea:** Corre linPEAS, pasale el output al agente, que priorice privesc. Elegí P1, pedí comando exacto, ejecútalo vos, validá `id`. Luego pedile al agente que redacte hallazgo PTES + executive summary.
- **Entrega:** Output linPEAS (fragmento) + tabla priorizada + evidencia de privesc (sanitizada) + hallazgo PTES + executive summary 5 bullets.
- **Regla:** El agente no ejecuta privesc solo — vos ejecutás y él interpreta. Si propone `DirtyCow` sin `check`, lo frenás.

---

## 11. Apéndice — Plantillas de prompt para cada fase

Copiá, pegá y completá los `[brackets]`. Cada plantilla ya trae guardrails — no los saques.

### 11.1 Recon pasivo

```
Actuá como agente de recon pasivo. 
Scope autorizado: [dominio/IP lab] — [contrato/ROE lab, ventana].
Prohibido: brute force DNS, scan activo, tocar el host directo.
Tareas: 1) crt.sh, 2) amass/sublist3r modo pasivo, 3) Shodan solo datos indexados, 4) theHarvester.
Devolvé: tabla deduplicada (hallazgo | fuente | fecha) + top 3 priorizados con justificación + next step sugerido.
Logueá cada comando y fuente. Si el scope es ambiguo, frená y pedí clarificación.
```

### 11.2 Scanning y enumeración

```
Actuá como agente de scanning. Scope autorizado: [IP lab] — [ventana].
Nivel autorizado: [no-intrusivo / intrusivo — especificar].
Tareas: nmap -sV -sC [flags según nivel] + nuclei -severity [medium,high,critical] + httpx -tech-detect.
Reglas: citá línea exacta del output para cada hallazgo, severidad solo con CVE/template/EOL comprobable, marcá resto como informativo.
Devolvé: tabla puerto | servicio | versión | evidencia | severidad | next step, priorizada P1/P2/P3.
Antes de cualquier técnica intrusiva, pedí confirmación explícita.
```

### 11.3 Web hacking

```
Actuá como agente de web hacking. Target: [URL lab] — lab aislado [nombre lab].
Vuln a probar: [SQLi / XSS / SSRF / IDOR / traversal] — solo lectura lab, no destructivo.
Obligatorio: explicá payload exacto, técnica y riesgo ANTES de ejecutar. Esperá mi "sí, autorizo [payload] en [lab]".
Herramientas: curl/Burp MCP/sqlmap --risk 1 --level 1 (solo si autorizo) / ffuf con rate-limit.
Devolvé: request/response sanitizado, validación de hallazgo, severidad con contexto (OWASP/CWE) y remediación.
Nunca pruebes SSRF contra 169.254.169.254 fuera de lab aislado. Nunca uses --risk 3 sin OK.
```

### 11.4 API hacking (REST + GraphQL)

```
Actuá como agente de API hacking. Target lab: [URL base lab].
Fase 1 — Descubrimiento: buscá /openapi.json, /swagger.json, /v2/api-docs, /graphql con httpx/nuclei.
Fase 2 — Parseo: listá endpoints/queries, método, auth, params, y marcá candidatos BOLA/sin auth.
Fase 3 — Validación (solo con mi confirmación por endpoint): probá BOLA/IDOR con 2 usuarios de lab, mass assignment con campo extra, rate limit.
Para GraphQL: introspection { __schema } → listar types/queries/mutations → probar BOLA con id ajeno.
Guardrails: no hagas DoS (depth/batching) — reportá falta de límite como hallazgo sin explotarlo. Rate-limit en fuzzing.
Devolvé: tabla endpoint/query | auth | hallazgo | severidad | evidencia (diff sanitizado) | remediación.
```

### 11.5 Privesc / Post-explotación

```
Actuá como guía de post-explotación. Contexto: shell en [host lab] ([IP lab]) — lab aislado [nombre].
Ya tengo output de [linPEAS/winPEAS] — te lo pego abajo. No ejecutes nada sin mi confirmación.
Tareas: 1) Parseá output y priorizá top 3 privesc (SUID, cron, kernel, service) con referencia GTFOBins/CVE.
2) Para P1, mostrame comando exacto y qué debería devolver `id` si funciona. 3) Esperá mi confirmación para cada paso.
No propongas mimikatz/secretsdump sin autorización separada. Cada salto lateral es prompt separado con IP confirmada.
Devolvé: tabla priorizada + comando P1 + validación esperada + remediación.

[pegar output linPEAS/winPEAS acá]
```

### 11.6 Reporte PTES

```
Actuá como redactor de reporte PTES. Hallazgos crudos: [pegar hallazgos de fases anteriores].
Para cada hallazgo generá: ID, título, severidad con CVSS tentativo + vector, fase, evidencia (request/response o comando/output sanitizado), impacto, causa raíz, remediación accionable, referencias (OWASP/CWE/CVE).
Luego generá tabla resumen y executive summary en 5 bullets para audiencia no técnica (riesgo de negocio, sin jerga).
Yo valido severidad y falsos positivos — marcá qué necesita mi confirmación. No publiques sin mi firma.
```

### 11.7 Checklist de autorización (pegala en cada sesión)

```
Scope autorizado: [dominio/IP lab]
Ventana: [fecha/hora]
Técnicas permitidas: [OSINT pasivo / scan no-intrusivo / web intrusivo lab / api lab / privesc lab]
Técnicas prohibidas: [DoS, brute force prod, exfiltración real, persistencia]
Contacto lab: [vos / tu VM]
Confirmo que el agente solo toca lo listado arriba. Sin scope explícito, no ejecuta.
```

---

## 12. Apéndice B — Glosario rápido (para no perderte)

| Término | En criollo | Dónde lo viste |
|---|---|---|
| **Scope / ROE** | Qué podés tocar, cuándo y cómo. Sin esto no hay pentest, hay delito. | §1, §11.7 |
| **OSINT pasivo** | Mirar fuentes públicas sin tocar el target (crt.sh, Shodan indexado). | §2 |
| **BOLA / IDOR** | Broken Object Level Authorization — ver/editar objeto ajeno cambiando ID. Top 1 OWASP API. | §5 |
| **Nuclei template** | Regla YAML que detecta una vuln/misconfig conocida. El agente las orquesta. | §3 |
| **PoC (Proof of Concept)** | Prueba mínima de que la vuln existe, sin romper nada. En lab, no en prod. | §6 |
| **Privesc** | Escalar privilegios (de www-data a root, de user a DA). | §7 |
| **linPEAS / winPEAS** | Scripts que enumeran todo lo escalable en Linux/Windows. Vos los corrés, el agente interpreta. | §7 |
| **BloodHound** | Grafo de AD que te dice el camino más corto a Domain Admin. | §7 |
| **GTFOBins / LOLBAS** | Binarios legítimos que se pueden abusar para privesc/evasión. | §7, §8 |
| **C2 / Beaconing** | Canal del atacante para mandar comandos. Acá solo lo cazamos, no lo instalamos. | §8 |
| **CVSS** | Score 0-10 de severidad. El agente propone, vos validás con contexto. | §9 |
| **PTES** | Estándar de pentest: desde recon hasta reporte. Estructura que usa este doc. | §9 |
| **Guardrail** | Freno del agente: "¿tenés autorización?" antes de cada paso intrusivo. | Todo el doc |
| **Falso positivo** | El scanner dice "vuln" pero no lo es. El agente los genera, vos los filtrás. | §3, §9 |

---

## 13. Apéndice C — Mapa de correspondencia con los 4 módulos ofensivos

Este doc no reemplaza los 4 módulos — los traduce a prompts. Usá esta tabla para ir al detalle cuando el agente te diga "revisá el módulo X":

| Fase A2 (este doc) | Módulo origen | Qué profundiza el módulo | Prompt A2 que lo invoca |
|---|---|---|---|
| §2 Recon | [01-Herramientas](../01-Herramientas/) — OSINT, sublist3r, amass, shodan | Instalación, flags, wordlists, API keys | `11.1 Recon pasivo` |
| §3 Scanning | [01-Herramientas](../01-Herramientas/) — nmap, nuclei, wappalyzer | NSE scripts, tuning, templates custom | `11.2 Scanning` |
| §4 Web | [02-Web](../02-Web/) — SQLi, XSS, SSRF, IDOR | Payloads, bypass de filtros, impacto real | `11.3 Web hacking` |
| §5 API | [02-Web](../02-Web/) — API hacking, GraphQL | Auth, BOLA, mass assignment, rate limit | `11.4 API hacking` |
| §6 Explotación | [03-Sistemas](../03-Sistemas/) — Metasploit, CVE, PoC | Metasploit modules, búsqueda CVE, lab setup | `11.5` + `11.1` |
| §7 Post / Lateral | [04-Post-Explotacion](../04-Post-Explotacion/) — BloodHound, linPEAS, privesc | AD, GTFOBins, pivoting, creds | `11.5 Privesc` |
| §8 Evasión/Persistencia | [04-Post-Explotacion](../04-Post-Explotacion/) — persistencia, evasión | MITRE ATT&CK, detección, hardening | Checklist §8.4 + caza §8.3 |
| §9 Reporte | [04-Post-Explotacion/06-M11](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md) — reporting | Redacción PTES, executive summary | `11.6 Reporte PTES` |

> Tip: si el agente te dice "encontré `CVE-2023-XXXX`", andá al módulo [03-Sistemas](../03-Sistemas/) para entender el root cause antes de pedirle el PoC. El agente acelera, el módulo te da fundamento.

---

## 14. Apéndice D — Recursos y próximos pasos

### Labs gratuitos (autorizados, sin excusas para tocar prod)

| Lab | Qué practicás | Costo | Link |
|---|---|---|---|
| **DVWA** | SQLi, XSS, CSRF, file upload — niveles low/medium/high | Gratis (Docker) | `docker run --rm -p 80:80 vulnerables/web-dvwa` |
| **OWASP Juice Shop** | Web + API + GraphQL moderno, challenges gamificados | Gratis (Docker/Node) | `docker run --rm -p 3000:3000 bkimminich/juice-shop` |
| **Metasploitable2** | Scanning, explotación, privesc Linux vintage | Gratis (VM) | sourceforge.net/projects/metasploitable |
| **HTB Starting Point** | Flujo completo guiado, ideal post-A2 | Gratis (tier 0) | hackthebox.com |
| **GOAD (Game of Active Directory)** | AD, BloodHound, movimiento lateral | Gratis (lab AD) | github.com/Orange-Cyberdefense/GOAD |
| **PortSwigger Web Security Academy** | Web hacking puro, labs por vuln | Gratis | portswigger.net/web-security |

### Herramientas que orquesta el agente (para leer flags si querés profundizar)

- **Recon:** `amass`, `sublist3r`, `crt.sh`, `shodan-cli`, `theHarvester`
- **Scan:** `nmap`, `nuclei`, `httpx`, `wappalyzer`/`whatweb`
- **Web/API:** `sqlmap`, `ffuf`, `Burp Suite MCP`, `graphqlmap`, `arjun`
- **Explotación:** `Metasploit`, `searchsploit`, `cve-search`
- **Post:** `linPEAS`, `winPEAS`, `SharpHound`+`BloodHound`, `GTFOBins`, `CrackMapExec`
- **Blue/defensivo:** `Sigma`, `YARA`, `Sysmon`, `auditd`, `OSQuery`

### Qué hacer después de A2

1. **Repetí los 5 ejercicios** hasta que puedas explicar cada hallazgo sin leer el reporte del agente.
2. **Leé los 4 módulos ofensivos** completos — ahora vas a entender por qué el agente elige cada flag.
3. **HTB Starting Point** end-to-end con agente como copiloto (vos validás cada fase).
4. **Armá tu skill de OpenCode** (ver [A1 §8](./01-A1-4g3nt3s-f0nd4m3nt0s.md#8-configuración-práctica--opencode-opencode-remote-mcp-skills-diagram-design)) con las plantillas de §11 y guardrails de scope.

---

## 15. Apéndice E — FAQ y troubleshooting del agente ofensivo

### "El agente quiere escanear todo internet"

Frenalo. Prompt mal escrito. Agregá al system prompt: `Prohibido escanear rangos no listados en scope. Si el usuario dice "todo", pedí clarificación y listá solo IPs/dominios explícitos.` Nunca uses `0.0.0.0/0` ni `*` como scope.

### "El agente me tira 50 hallazgos críticos y la mitad son humo"

Normal. nuclei y wappalyzer son ruidosos. Pedile: `Filtrá por severidad high/critical con CVE/template ID y citá evidencia. El resto marcá como informativo. Priorizá top 5 por exploitabilidad.` Vos validás el resto a mano.

### "El agente generó un PoC que me da miedo ejecutar"

No lo ejecutes. Pedile: `Explicá línea por línea qué hace el PoC, qué toca y qué riesgo tiene. Sugerí alternativa no destructiva (check mode, dry-run).` Si no te convence, no lo corrés — ni en lab.

### "El agente se olvidó del scope a mitad de la sesión"

Context window lleno. Pedile cada 10-15 mensajes: `Resumí scope autorizado, hallazgos validados y next step pendiente en 5 bullets y guardalo en memoria/nota.` Así no pierde el hilo.

### "¿Puedo usar el agente contra un bug bounty sin leer las reglas?"

No. El scope del bounty ES el scope del agente. Pegale las reglas al prompt: `Scope bounty: [dominios/IPs] — Out of scope: [lista] — Técnicas prohibidas: [DoS, brute force, etc.] — Respetá todo.` Si dudás, preguntá al programa antes.

### Checklist rápido antes de cada sesión ofensiva

- [ ] ¿Scope escrito y pegado en el prompt? (IPs/dominios, ventana, técnicas permitidas/prohibidas)
- [ ] ¿Guardrail "¿confirmás?" activo para intrusivo/exploit/post?
- [ ] ¿Log de sesión habilitado? (prompt + comando + output)
- [ ] ¿Lab aislado o autorización por escrito a mano?
- [ ] ¿Plan de rollback si algo se rompe? (snapshot de VM, contacto del owner)

> Si algún check es "no", no arrancás. Así de simple.

---

> **Cierre:** Si llegaste hasta acá, ya tenés el workflow no-code para reproducir todo lo de [01-Herramientas](../01-Herramientas/), [02-Web](../02-Web/), [03-Sistemas](../03-Sistemas/) y [04-Post](../04-Post-Explotacion/) sin escribir código — pero con criterio. El agente es tu copiloto, no tu piloto. Vos definís el scope, vos confirmás cada paso intrusivo, vos validás el reporte. Practicá los 5 ejercicios en lab, guardá los logs y recién ahí pensá en un scope real. Como dice [M11](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md): el hacker piensa antes de tocar. El agente también — si lo configurás bien.

<!-- DIAGRAM: architecture — Agentes ofensivos no-code: [Usuario define scope] → [Agente planifica PTES] ↔ [Tools: crt.sh, amass, shodan, nmap, nuclei, httpx, sqlmap, Burp MCP, ffuf, Metasploit, linPEAS, BloodHound] → [Guardrails: scope check + confirmación intrusivo + log] → [Reporte PTES]. Estilo: isométrico, paleta oscura, íconos por tool. Para integración con diagram-design skill. -->
