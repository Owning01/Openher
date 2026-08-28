# ⚡ A5 — Automatización No-Code — De la Idea al Informe Sin Tocar un Editor

> **Versión:** 1.0
> **Idioma:** Español (argentino) — informal, directo, sin humo
> **Nivel:** Principiante → Intermedio
> **Duración estimada:** 2–3 semanas (~12 hs, labs incluidos)
> **Prerequisitos:** [A1 — Fundamentos](./01-A1-4g3nt3s-f0nd4m3nt0s.md) obligatorio. Recomendado haber leído [A2](./02-A2-0ff3ns1v3-4g3nt3s.md) o [A3](./03-A3-d3f3ns1v3-4g3nt3s.md) para entender qué le estás automatizando. No necesitás saber programar — sí entender conceptos de [F1](../00-Fundamentos/01-F1-0s-f0nd4m3nt0s.md) y [F4](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md).

> ⚠️ **Aviso legal — este doc cierra la promesa "sin saber código", no la ley:** Todo acá es **solo para labs autorizados** (tu VM, DVWA, Juice Shop, Metasploitable, GOAD, HTB/TryHackMe con scope) o infra con **autorización escrita y ventana definida**. Que sea no-code no lo hace no-responsable. Vos firmás el scope, vos validás el output, vos frenás al agente si se zarpa. Sin autorización, no hay prompt que valga.

> ⚡ **¿Por qué existe A5?** A1 te enseñó qué es un agente, A2/A3 te mostraron qué puede hacer ofensivo/defensivo, A4 te enseñó a orquestar un equipo. A5 es el que te debíamos desde el día uno: **"no sé código, quiero resultados igual"** — sin abrir VS Code, sin pip install, sin regex. Describís en español qué querés, el agente genera el exploit/defensa/reporte/inyección de lab, y vos solo validás. Este doc es el puente entre "sé lo que quiero" y "ya está hecho y documentado".

---

## 📑 Índice

> ⏱️ **Tiempo estimado:** 12 horas (~3 sesiones de 4 hs) — 650 líneas aprox.

1. [Introducción — la promesa no-code posta](#1-introducción--la-promesa-no-code-posta)
2. [Biblioteca de prompts listos — copiá, pegá, adaptá](#2-biblioteca-de-prompts-listos--copiá-pegá-adaptá)
3. [Casos de uso completos paso a paso — 5 de punta a punta](#3-casos-de-uso-completos-paso-a-paso--5-de-punta-a-punta)
4. [Integración con el stack existente — cada caso mapea a docs 00-06 pero vía agente](#4-integración-con-el-stack-existente--cada-caso-mapea-a-docs-00-06-pero-vía-agente)
5. [Validación sin código — cómo verificar que el agente no alucinó](#5-validación-sin-código--cómo-verificar-que-el-agente-no-alucinó)
6. [Export y reporting — del markdown al PDF con diagramas](#6-export-y-reporting--del-markdown-al-pdf-con-diagramas)
7. [Operación continua — tu agente vigilante 24/7](#7-operación-continua--tu-agente-vigilante-247)
8. [Errores comunes y cómo corregirlos — sin reescribir código](#8-errores-comunes-y-cómo-corregirlos--sin-reescribir-código)
9. [Ejercicios prácticos — 5 labs para automatizar sin tocar un editor](#9-ejercicios-prácticos--5-labs-para-automatizar-sin-tocar-un-editor)
10. [Apéndice — checklist no-code y mapa "antes con código / ahora con agente"](#10-apéndice--checklist-no-code-y-mapa-antes-con-código--ahora-con-agente)

---

## 1. Introducción — la promesa no-code posta

### 1.1 Qué significa "sin tocar un editor"

No es chamuyo de marketing. Significa esto, literal:

| Antes (con código) | Ahora (A5 no-code) |
|---|---|
| Abrís editor, escribís `nmap -sV --script vuln`, parseás XML a mano | Decís: *"Escaneá mi lab 10.10.10.5 con nmap top 1000 no intrusivo y priorizá"* — el agente traduce, ejecuta y te trae tabla |
| Escribís payload `'" OR 1=1--` y un fuzzer en Python | Decís: *"Probá SQLi en el login de DVWA low, mostrame el payload antes"* — el agente propone, vos aprobás, él valida con canario |
| Armás script para parsear `openapi.json` y probar BOLA | Decís: *"Parseá el openapi de Juice Shop y probá BOLA con dos usuarios de lab"* — el agente lo hace |
| Escribís `pandoc` + LaTeX para el informe | Decís: *"Generá informe PTES con executive summary y exportá a PDF"* — el agente usa `report-writer` + `diagram-design` |

Vos ponés **intención + scope + criterio de éxito**. El agente pone **plan + tools + evidencia**. Vos validás. Nadie toca un editor si no quiere.

```
Vos (español)  →  "Quiero X en mi lab Y, con límites Z, entregá W"
        ↓
Agente: planifica → pide confirmación si es intrusivo → ejecuta tools vía MCP
        → observa output → sintetiza → reporta con evidencia + fuente
        ↓
Vos: validás, corregís en español, el agente re-ejecuta. Loop hasta que cierra.
```

> 💡 Regla de oro A5: **si podés explicarlo en una frase clara en español, el agente lo puede intentar. Si no podés explicarlo, no es problema de código — es que no tenés claro el objetivo.** Volvé a [A1 §4](./01-A1-4g3nt3s-f0nd4m3nt0s.md#4-prompting-para-hacking--cómo-hablarle-al-agente-sin-que-se-zarpe) antes de promptar.

### 1.2 Qué vas a poder hacer al terminar A5

- Lanzar **cualquier tarea de los docs 00–06** describiéndola en español, sin escribir scripts.
- Usar una **biblioteca de prompts copiar-pegar** que ya trae guardrails (scope, severidad, formato).
- Ejecutar **5 casos de uso completos** de punta a punta y llevarte informe exportable.
- Validar sin código que el agente no te vendió humo (checks de evidencia, reproducciones guiadas).
- Dejar un **agente vigilante 24/7** con cron y alertas, operado todo en lenguaje natural.
- Saber qué agente/skill invocar para cada tarea histórica sin googlear flags.

### 1.3 Límites — qué NO te promete A5

- No te convierte en pentester senior sin estudiar. Automatiza ejecución, no criterio.
- No reemplaza leer [01-Herramientas](../01-Herramientas/), [02-Web](../02-Web/), [03-Sistemas](../03-Sistemas/), [04-Post](../04-Post-Explotacion/). Cuando el agente te diga "es BOLA por falta de check a nivel objeto", tenés que entender qué significa.
- No ejecuta nada sin tu validación en pasos intrusivos. Si tu agente lo hace, está mal configurado — revisá [A1 §8](./01-A1-4g3nt3s-f0nd4m3nt0s.md#8-configuración-práctica--opencode-opencode-remote-mcp-skills-diagram-design) y [A4 §9.4](../07-Agentes-IA/04-A4-0rqu3st4c10n-m9lt1-4g3nt3.md#94-guardrails--lo-que-nunca-se-negocia).

<!-- DIAGRAM: flowchart - flujo no-code A5: [Vos describís en español (objetivo+scope+límites+formato)] → [Agente planifica y pide confirmación] → [Agente ejecuta tools vía MCP] → [Agente reporta con evidencia] → [Vos validás en español] → loop → [Export PDF/diagrama]. Estilo isométrico oscuro, íconos humano→robot→documento -->

---

## 2. Biblioteca de prompts listos — copiá, pegá, adaptá

Todos con guardrails incluidos. Reemplazá `[brackets]` por tu lab autorizado. Si sacás los guardrails, el prompt queda roto — no lo hagas.

### 2.1 🔍 Recon pasivo (OSINT sin tocar el target)

```
Actuá como agente de recon pasivo. Scope autorizado: [dominio/IP lab, ej: juice-shop.local 10.10.10.5/24] — lab autorizado [nombre lab], ventana [fecha/hora].
Prohibido: brute force DNS, scan intrusivo, tocar el host directo.
Tareas: 1) crt.sh, 2) amass/sublist3r modo pasivo, 3) Shodan solo datos indexados, 4) theHarvester.
Devolvé: tabla deduplicada (hallazgo | fuente | fecha) + top 3 priorizados con justificación + next step sugerido.
Logueá cada comando y fuente. Si el scope es ambiguo, frená y pedí clarificación.
Guardá todo en ./work/recon/ y actualizá hallazgos.md
```

**Cuándo usarlo:** arranque de cualquier auditoría. Mapea superficie sin ruido.

### 2.2 🌐 Web hacking (SQLi, XSS, SSRF, IDOR — con freno)

```
Actuá como agente de web hacking. Target: [URL lab, ej: http://10.10.10.5/dvwa/login.php] — lab aislado [DVWA low / Juice Shop].
Vuln a probar: [SQLi / XSS reflejado / SSRF / IDOR / traversal] — solo lectura lab, no destructivo.
Obligatorio: explicá payload exacto, técnica y riesgo ANTES de ejecutar. Esperá mi "sí, autorizo [payload] en [lab]".
Herramientas: curl/Burp MCP/sqlmap --risk 1 --level 1 (solo si autorizo) / ffuf con rate-limit 10/s.
Devolvé: request/response sanitizado, validación (validado/hipótesis/falso positivo), severidad con CWE/CVSS tentativo y remediación.
Nunca uses --risk 3 ni pruebes SSRF contra 169.254.169.254 fuera de lab aislado.
```

### 2.3 🔌 API hacking (REST + GraphQL)

```
Actuá como agente de API hacking. Target lab: [URL base, ej: http://10.10.10.5:3000] — lab [Juice Shop / HTB box lab].
Fase 1 — Descubrimiento: buscá /openapi.json, /swagger.json, /v2/api-docs, /graphql con httpx + nuclei.
Fase 2 — Parseo: listá endpoints/queries, método, auth requerida, params, marcá candidatos BOLA/sin auth.
Fase 3 — Validación (solo con mi confirmación por endpoint): probá BOLA/IDOR con 2 usuarios de lab, mass assignment con campo extra, rate limit.
Para GraphQL: introspection { __schema } → listar types/queries/mutations → probar BOLA con id ajeno.
Guardrails: no hagas DoS (depth/batching) — reportá falta de límite como hallazgo sin explotarlo. Rate-limit 5/s.
Devolvé: tabla endpoint/query | auth | hallazgo | severidad | evidencia (diff sanitizado) | remediación. Logueá en ./work/api/.
```

### 2.4 🔑 Privesc / Post-explotación (guiado)

```
Actuá como guía de post-explotación. Contexto: shell en [host lab, ej: Metasploitable2 10.10.10.6] — lab aislado.
Ya tengo output de [linPEAS/winPEAS] — te lo pego abajo. No ejecutes nada sin mi confirmación.
Tareas: 1) Parseá output y priorizá top 3 privesc (SUID, cron, kernel, service) con ref GTFOBins/CVE.
2) Para P1, mostrame comando exacto y qué debería devolver `id` si funciona. 3) Esperá mi confirmación para cada paso.
No propongas mimikatz/secretsdump sin autorización separada. Cada salto lateral es prompt separado con IP confirmada.
Devolvé: tabla priorizada + comando P1 + validación esperada + remediación + cita GTFOBins.

[pegar output linPEAS/winPEAS acá]
```

### 2.5 🚨 IR / Blue team (triage + caza)

```
Actuá como agente de IR triage. Contexto: alerta/lab [Wazuh alerta / log Apache lab / Velociraptor output] — lab aislado, scope [10.0.0.0/24].
Tareas: 1) Clasificá alerta (severidad, MITRE ATT&CK, falsos positivos), 2) Correlacioná con CTI (MISP/OTX) si aporta, 3) Proponé contención en dry-run (sin ejecutar bloqueo/aislamiento), 4) Sugerí Sigma/KQL y hardening.
Reglas: nunca aísles host, bloquees IP o apliques patch sin mi aprobación explícita. Toda recomendación con riesgo/impacto/rollback.
Devolvé: triage.json (severidad, IOCs, ATT&CK) + plan de contención dry-run + regla Sigma propuesta + resumen ejecutivo en 5 bullets.
Logueá en ./work/detect/ y citá regla/log ID.
```

### 2.6 📝 Reporting PTES (el agente redacta, vos firmás)

```
Actuá como redactor PTES. Hallazgos crudos: [pegar hallazgos de fases anteriores o ruta ./work/**/evidence.*].
Para cada hallazgo generá: ID, título, severidad con CVSS vector tentativo, fase, evidencia (request/response o comando/output sanitizado con hash), impacto, causa raíz, remediación accionable, refs (OWASP/CWE/CVE).
Luego generá: tabla resumen + executive summary en 5 bullets para audiencia no técnica (riesgo de negocio, sin jerga) + apéndice técnico.
Yo valido severidad y falsos positivos — marcá qué necesita mi confirmación. No publiques sin mi firma. Guardá en ./report/.
```

### 2.7 Prompt meta — "configurame todo"

```
Configurame OpenCode para lab local con scope [IPs/dominios lab] — ventana [fecha].
Quiero agentes [recon / web / api / privesc / ir / report] con skills [recon, security-review, forensics-pack, report-writer, diagram-design].
Generá opencode.jsonc con MCPs [nmap-mcp, nuclei-mcp, burp-mcp, filesystem-mcp] limitados a ./work/ y ./report/,
guardrails allowed_targets [lista exacta] y require_confirmation para [exploit, intrusive, contain].
Mostrame el JSON generado para que lo revise antes de aplicar. Sin scope explícito no ejecutes nada.
```

> 💡 Tip: guardá estos prompts en `.opencode/prompts/` o en tus notas. El agente también los puede guardar con `memory({mode:"add"})` para reusarlos sin copiar/pegar.

<!-- DIAGRAM: kanban - biblioteca de prompts como tarjetas kanban: columnas Recon / Web / API / Privesc / IR / Report, cada tarjeta con prompt listo y guardrail visible -->

---

## 3. Casos de uso completos paso a paso — 5 de punta a punta

> Todos en **labs autorizados**. Cada caso dice su lab. Si no tenés ese lab, usá el equivalente (HTB Starting Point, TryHackMe, GOAD). Nunca contra prod.

### 3.1 Caso 1 — Auditoría web autorizada sin código (Juice Shop lab)

**Objetivo:** de cero a informe web en 90 minutos, sin escribir un comando.

**Lab:** Juice Shop en `http://10.10.10.7:3000` (Docker local).

**Stack que orquesta el agente:** `httpx-mcp` + `nuclei-mcp` + `burp-mcp` + `report-writer` + `diagram-design`.

| Paso | Quién | Qué hace | Artefacto |
|---|---|---|---|
| 0 | Vos | Definís scope + ventana + formato | `scope.json` (A4 §10.4) |
| 1 | Vos → Agente | Pegás prompt 2.1 (recon pasivo) adaptado a `juice-shop.local` | — |
| 2 | Agente | Recon pasivo + `httpx -tech-detect` (1 request) → Express + AngularJS EOL | `work/recon/recon-report.json` |
| 3 | Vos → Agente | *"Con lo que encontraste, hacé enumeración no-intrusiva web en 3000"* (usa prompt 2.2 sin intrusivo) | — |
| 4 | Agente | `nuclei -severity medium,high` + crawler pasivo (20 páginas) → prioriza search XSS | `work/web/nuclei.json` |
| 5 | Vos → Agente | *"Probá XSS reflejado en /#/search?q= — mostrame payload antes"* | — |
| 6 | Agente | Propone `"><svg onload=alert('xss-lab')>` → vos: *"autorizo solo canario <test-xss-canary>"* → valida reflejo sin JS | `work/web/xss-evidence.md` |
| 7 | Vos → Agente | *"Redactá hallazgos PTES y exportá"* (prompt 2.6) | `report/auditoria-juice-shop.md` + PDF |

**Diálogo completo:**

```text
Vos: Quiero auditoría web de mi lab Juice Shop en 10.10.10.7:3000. Solo no-intrusivo por ahora.
     Al final quiero informe PTES con tabla y executive summary. Scope solo esa IP, ventana hoy.

Agente: ✅ Scope: 10.10.10.7:3000 (Juice Shop lab), no-intrusivo, ventana hoy. Plan:
         1) Recon pasivo + fingerprint (httpx 1 request)
         2) Nuclei medium+ + crawler pasivo 20 páginas
         3) Si encuentro input reflejado, propongo XSS con canario y pido confirmación
         4) Reporte PTES + diagrama de superficie
         ¿Confirmás fase 1? [sí/no]

Vos: Sí, fase 1.

Agente: [httpx] Server: Express, X-Powered-By: Express. Nuclei: [info] angularjs-detect 1.6 (EOL).
         Crawler: /#/search?q= refleja input sin encode (candidato XSS). ¿Autorizás validación
         con canario <test-xss-canary> (no JS) en ese param? [sí/no]

Vos: Autorizo solo <test-xss-canary> en lab.

Agente: [burp-mcp] GET /#/search?q=<test-xss-canary> → refleja <test-xss-canary> sin encoding en HTML.
         Hallazgo: XSS reflejado validado con canario. No ejecuté JS. Severidad media (CWE-79).
         ¿Genero informe PTES con este hallazgo + EOL AngularJS? [sí/no]

Vos: Sí, generá.

Agente: ✅ Informe en report/auditoria-juice-shop.md + report/auditoria-juice-shop.pdf
         + diagrama <!-- DIAGRAM: architecture - superficie Juice Shop lab: Express, AngularJS 1.6 EOL, endpoint /search vulnerable, severidades -->
         Tabla resumen: 2 hallazgos (XSS media, EOL info). Executive summary en criollo listo.
         Todos los artefactos hasheados en work/trace.jsonl
```

**Resultado:** auditoría cerrada sin tocar editor. Validación en §5.

### 3.2 Caso 2 — Hardening de un VPS (de 0 a baseline CIS sin saber bash)

**Objetivo:** tu VPS de lab (`10.10.10.20` Ubuntu 22.04) queda hardeneado con checklist auditable.

**Lab:** VM Ubuntu 22.04 en VirtualBox / VPS de prueba tuyo (nunca prod ajeno).

**Stack:** `lynis-mcp` / `prowler-mcp` / `ansible-mcp --check` / `hardener-agent` de A3.

| Paso | Quién | Qué hace |
|---|---|---|
| 1 | Vos → Agente | *"Hardeneá mi VPS lab 10.10.10.20. Quiero baseline CIS, sin aplicar nada sin mi OK. Mostrame diff antes."* |
| 2 | Agente | Lynis audit + `sshd -T` + `ufw status` → score 62/100, halla: SSH root login on, UFW off, updates pendientes |
| 3 | Agente | Genera `work/harden/plan.md` con 5 fixes priorizados + impacto/rollback por fix |
| 4 | Vos | Aprobás 1 por 1: *"aplicá solo UFW + updates en dry-run y mostrame diff"* |
| 5 | Agente | `ansible --check` → diff → vos: *"aplicá"* → ejecuta + re-audita → score 84/100 |
| 6 | Agente | Genera `report/hardening-vps.md` + `hardening-checklist.csv` |

**Diálogo:**

```text
Vos: Mi VPS lab 10.10.10.20 está pelado. Hardenealo baseline CIS. No apliques nada sin mostrarme diff.

Agente: Plan: 1) Lynis audit (solo lectura) 2) Plan con 5 fixes: a) UFW enable b) SSH PermitRootLogin no
         c) unattended-upgrades d) fail2ban e) sysctl hardening. Cada fix con diff + rollback.
         ¿Autorizás solo auditoría (lectura) ahora? [sí/no]

Vos: Sí, solo auditoría.

Agente: Lynis 62/100. Hallazgos: UFW inactive, PermitRootLogin yes, 12 updates pendientes.
         ¿Querés que genere playbook ansible con --check para fix (a) UFW y (b) SSH? [sí/no]

Vos: Sí, solo (a) y (b) en --check.

Agente: [ansible --check] Diff: ufw enable + rule 22/tcp limit, sshd_config PermitRootLogin no.
         Rollback: ufw disable + restore sshd_config.bak. ¿Aplico (a) y (b)? [sí/no]

Vos: Aplicá (a) y (b).

Agente: ✅ Aplicado. Re-audit Lynis 84/100. Report en report/hardening-vps.pdf con checklist CIS.
```

<!-- DIAGRAM: flowchart - hardening VPS: [Auditoría Lynis lectura] → [Plan con diff+rollback] → [Vos aprobás 1 por 1] → [Ansible --check diff] → [Aplicar] → [Re-auditar] → [Reporte CIS] -->

### 3.3 Caso 3 — Análisis de APK sin reversing manual (tu APK de lab)

**Objetivo:** analizar una APK tuya/de lab sin abrir JADX/Ghidra a mano. El agente lo orquesta.

**Lab:** APK de tu app de prueba o `insecure-bank-v2.apk` / `DVIA-v2.apk` (labs Android intencionalmente vulnerables).

**Stack:** `mobsf-mcp` / `apktool-mcp` / `ghidra-mcp` (solo lectura) / `report-writer`.

| Paso | Quién | Qué hace |
|---|---|---|
| 1 | Vos → Agente | *"Analizá mi APK ./lab/insecure-bank.apk — solo estático, sin instalar en prod. Quiero top 5 riesgos OWASP Mobile."* |
| 2 | Agente | MOBSF scan → `work/apk/mobsf.json` → halla: `debuggable true`, `backup allowed`, `hardcoded API key`, `insecure WebView`, `exported activity` |
| 3 | Agente | Cruza con `apkleaks` + `manifest` → prioriza P1 hardcoded key, P2 debuggable |
| 4 | Vos → Agente | *"Mostrame evidencia de P1 sin exponer la key completa"* |
| 5 | Agente | Muestra `strings.xml` truncado + referencia `smali/com/app/Config.smali` con hash, sin revelar secret |
| 6 | Agente | Genera `report/apk-analisis.md` con tabla OWASP M1-M10 + remediación (network_security_config, ProGuard) |

**Diálogo:**

```text
Vos: Tengo insecure-bank.apk de lab. Analizala estático y decime top 5 riesgos sin instalar nada raro.

Agente: ¿Confirmás que la APK es tuya/de lab y análisis es solo estático local en ./lab/? [sí/no]

Vos: Sí, es de lab, solo estático.

Agente: [mobsf-mcp] Scan completo. Top 5: 1) hardcoded API key (M9) 2) debuggable true (M1)
         3) allowBackup true (M2) 4) WebView setJavaScriptEnabled sin validación (M7)
         5) exported activity sin permission (M1). ¿Querés evidencia de P1 truncada? [sí/no]

Vos: Sí, sin exponer key.

Agente: Evidencia: Config.smali línea 42 contiene key truncada ak_****_lab + manifest debuggable.
         Remediación: mover key a backend/env, debuggable false en release, allowBackup false.
         ¿Genero informe OWASP Mobile con diagrama de ataque? [sí/no]

Vos: Generá.

Agente: ✅ report/apk-analisis.pdf + <!-- DIAGRAM: architecture - APK attack surface: manifest, WebView, exported components, hardcoded secrets -->
```

### 3.4 Caso 4 — Detección de phishing con agente (tu buzón de lab)

**Objetivo:** el agente caza phishing en tu buzón de lab sin que leas headers a mano.

**Lab:** buzón de prueba con `.eml` de lab (GOAD phishing samples / tu propio lab mail).

**Stack:** `thehive-mcp` / `misp-mcp` / `urlscan-mcp` / `virustotal-mcp` (solo OSINT) / `detector-agent`.

| Paso | Quién | Qué hace |
|---|---|---|
| 1 | Vos → Agente | *"Revisá mis 3 .eml de lab en ./lab/phishing/ — decime cuál es phishing y por qué, sin clickear links."* |
| 2 | Agente | Parsea headers (SPF/DKIM/DMARC), URLs, adjuntos → enriquece con VT/urlscan + MISP |
| 3 | Agente | Clasifica: `mail-02.eml` phishing (dominio typosquat + link con redirect + SPF fail) |
| 4 | Agente | Genera `work/phishing/triage-02.json` + regla Sigma/YARA + IOCs + playbook de contención dry-run |
| 5 | Vos → Agente | *"Generá reporte para usuario no técnico + alerta para SOC"* |
| 6 | Agente | `report/phishing-triage.md` + `report/iocs.csv` |

**Diálogo:**

```text
Vos: Tengo 3 mails de lab en ./lab/phishing/. Decime cuál es phishing sin abrir links.

Agente: Plan: 1) Parse headers SPF/DKIM/DMARC 2) Extraer URLs/adjuntos 3) Enriquecer VT/urlscan/MISP
         4) Clasificar + IOCs + Sigma. ¿Confirmás que son .eml de lab y no producción real? [sí/no]

Vos: Sí, son de lab GOAD.

Agente: Resultado: mail-01 legítimo (SPF pass, dominio exacto), mail-02 phishing (SPF fail,
         Return-Path @micorsoft-support.com typosquat, URL hxxps://login-micorsoft[.]lab/redirect
         con VT 12/90, adjunto .html con form), mail-03 spam (no phishing).
         IOCs: micorsoft-support.com, 192.0.2.50, hash html. ¿Genero triage + Sigma + reporte? [sí/no]

Vos: Sí.

Agente: ✅ work/phishing/triage-02.json + Sigma rule phishing_typosquat + report/phishing-triage.pdf
         Contención propuesta (dry-run): bloquear dominio en mail gateway — requiere tu aprobación.
```

<!-- DIAGRAM: sequence - phishing triage: [Vos → Agente: revisá .eml lab] → [Agente parsea headers] → [Enriquece VT/MISP] → [Clasifica phishing] → [Genera IOCs+Sigma+reporte] -->

### 3.5 Caso 5 — Generación de informe PTES completo (el cierre que paga la cuenta)

**Objetivo:** juntar hallazgos de los casos 1–4 en un informe PTES que puedas entregar.

**Lab:** reutiliza artefactos de casos anteriores (ningún scan nuevo).

**Stack:** `report-agent` + `report-writer` + `diagram-design` + `pandoc-mcp`.

| Paso | Quién | Qué hace |
|---|---|---|
| 1 | Vos → Agente | *"Con los hallazgos de ./work/**/evidence.* generá informe PTES completo — no inventes nada sin artefacto hasheado."* (prompt 2.6) |
| 2 | Agente | Deduplica, asigna CVSS tentativo, cita artefacto + hash por hallazgo, marca gaps |
| 3 | Agente | Genera `report/report-final.md` (exec summary + hallazgos + apéndice técnico) + `findings.csv` |
| 4 | Vos | Validás severidades, corregís en español: *"bajá XSS a baja por HttpOnly"* |
| 5 | Agente | Ajusta + genera diagramas + exporta `report-final.pdf` |

**Diálogo:**

```text
Vos: Con todo lo de ./work/ generá informe PTES. No inventes hallazgos. Citá artefacto con hash.

Agente: Draft PTES: 4 hallazgos (XSS media CWE-79, EOL AngularJS info, SSH root login media,
         hardcoded key alta). Cada uno con evidencia hasheada y CVSS vector. Gaps: no se probó
         GraphQL — marcado como no evaluado. ¿Validás severidades o ajustamos? [validar/ajustar]

Vos: Bajá XSS a baja — hay HttpOnly + SameSite. Subí hardcoded key a crítica si es prod-like.

Agente: Ajustado: XSS baja 4.3, hardcoded key crítica 9.1 (si fuera prod). Genero exec summary
         5 bullets + diagrama de superficie + tabla resumen. ¿Exporto a PDF? [sí/no]

Vos: Exportá.

Agente: ✅ report/report-final.md + report/report-final.pdf + findings.csv
         + <!-- DIAGRAM: architecture - informe PTES: portada, tabla resumen, hallazgos con severidad, apéndice con artefactos hasheados -->
```

> 🏆 Con estos 5 casos ya hiciste lo que los docs 00–06 enseñan con código, pero sin escribir una línea. El resto del doc te asegura que no te comas humo y que puedas repetirlo 24/7.

---

## 4. Integración con el stack existente — cada caso mapea a docs 00-06 pero vía agente

No estás salteando la carrera — estás tomando el atajo no-code que igual pasa por todos los checkpoints.

| Caso A5 (no-code) | Docs origen (con código) | Qué te ahorra el agente | Tu validación (igual que antes) |
|---|---|---|---|
| **1. Auditoría web** | [01-Herramientas](../01-Herramientas/) (nmap, nuclei, httpx) + [02-Web](../02-Web/) (XSS, SQLi) | Flags, XML, crawling, priorización | ¿El XSS es real o falso positivo? ¿Severidad con contexto? |
| **2. Hardening VPS** | [03-Sistemas](../03-Sistemas/) (Linux, SSH, UFW) + [05-Especialización](../05-Especializacion/) (CIS) | Comandos `lynis`, `auditd`, `ansible` | ¿Diff/rollback tienen sentido? ¿Impacto en disponibilidad? |
| **3. Análisis APK** | [02-Web](../02-Web/) + [05-Especialización](../05-Especializacion/) (Mobile) | `apktool`, `mobsf`, `smali` | ¿La key es realmente secreta o es dummy de lab? |
| **4. Phishing** | [00-Fundamentos/04-F4](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md) + [06-Operaciones](../06-Operaciones/) (SOC, IR) | Headers, VT, MISP, Sigma | ¿El mail es phishing o spam? ¿IOC es confiable? |
| **5. Informe PTES** | [04-Post/06-M11](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md) (reporting) + todo lo anterior | Redacción, CVSS, diagramas, PDF | ¿Severidad y remediación son accionables? ¿No hay inventos? |

**Cómo mapear cualquier doc viejo a prompt nuevo — fórmula de 1 línea:**

> *"Antes hacías `[comando/script del doc]` leyendo `[doc 00-06]` — ahora decile al agente `[prompt de §2]` con scope `[tu lab]` y validá `[criterio del doc]`."*

Ejemplos:

- Antes: `nmap -sV -sC 10.10.10.6` leyendo [01-Herramientas/02-nmap](../../01-Herramientas/02-06-nm4p.md) → Ahora: prompt 2.1/2.2 con `10.10.10.6` + validación de §2.1 del doc nmap.
- Antes: `sqlmap -u "http://dvwa/vuln.php?id=1"` leyendo [02-Web SQLi](../../02-Web/) → Ahora: prompt 2.2 con DVWA low + validación de canario.
- Antes: `apktool d app.apk && grep -r "api_key"` leyendo Mobile → Ahora: prompt 2.3 con APK de lab + validación de manifest.
- Antes: `crontab -l` + `auditd` leyendo [03-Sistemas](../../03-Sistemas/) → Ahora: caso 2 + validación de diff/rollback.

> Si el agente te dice "revisá el módulo X", andá al doc origen — ahí está el por qué del flag que él eligió. A5 acelera, los docs 00–06 te dan fundamento. Sin fundamento no hay validación.

<!-- DIAGRAM: timeline - mapa 00-06 → A5: línea de tiempo con 6 bloques (Fundamentos→Herramientas→Web→Sistemas→Post→Operaciones) y flechas hacia los 5 casos A5, cada flecha etiquetada con prompt §2.x -->

---

## 5. Validación sin código — cómo verificar que el agente no alucinó

El agente es potente y mentiroso con confianza. Tu trabajo no es codear — es **auditar como un jefe que no programa pero no se deja chamuyar**.

### 5.1 Los 3 checks que pedís siempre (en español)

Copiá y pegá esto después de cualquier hallazgo:

```
Para cada hallazgo que reportaste:
1) Mostrá el output crudo de la tool que lo respalda (línea exacta, no resumen).
2) Citá la fuente (CVE/NVD, CWE, OWASP, log ID) con link y por qué aplica a esta versión exacta.
3) Clasificá: validado ✓ / hipótesis (falta evidencia) / falso positivo ✗ — y decime cómo lo re-validarías.
Si no tenés output, es hipótesis. No inventes.
```

**Diálogo modelo — cazando alucinación:**

```text
Agente: Hallé RCE crítico CVE-2024-99999 en 10.10.10.5 (Apache 2.4.49).

Vos: Mostrá output crudo y link NVD que respalde CVE-2024-99999 para 2.4.49.

Agente: No tengo output que lo respalde. Es hipótesis basada en versión. No encontré CVE-2024-99999 en NVD.
        Para validar necesitaría nuclei template cve-2024-99999 con tu OK. ¿Procedo con check safe? [sí/no]

Vos: No, marcá como hipótesis y seguí.

Agente: ✅ Corregido: H-03 reclasificado a hipótesis — sin evidencia. No afecta severidad del informe.
```

### 5.2 Tabla de validación por tipo de hallazgo

| Hallazgo | Qué le pedís al agente (sin código) | Señal de humo | Qué hacés |
|---|---|---|---|
| **Puerto/servicio** | "Citá línea exacta de nmap: `22/tcp open ssh OpenSSH 7.2p2`" | Dice "puerto 22 vulnerable" sin versión | Pedí re-scan o marcá informativo |
| **CVE** | "Link NVD + output nuclei `template-id` + versión exacta" | CVE que no existe en NVD o versión no matchea | Descartá o marcá hipótesis |
| **XSS/SQLi** | "Request/response sanitizado con canario, sin JS ejecutado" | Payload `<script>alert(1)>` sin evidencia de reflejo | Exigí canario no ejecutable |
| **BOLA/API** | "Diff de 2 sesiones (user1 vs user2) con status 200 y body diff" | Un solo request sin comparación | Pedí segunda sesión |
| **Privesc** | "Comando exacto GTFOBins + qué devuelve `id` esperado" | "Escalé a root" sin comando ni output | Pedí comando + validación |
| **Phishing** | "Headers SPF/DKIM + VT score + typosquat diff" | "Es phishing" sin headers | Pedí headers + IOC |

### 5.3 Reproducción guiada — el agente te guía, vos clickeás

No necesitás reproducir con código. Pedile:

```
Guiame para reproducir H-02 sin código: decime dónde clickear / qué request mandar con curl/Burp
(paso a paso en español), qué debería ver si es real y qué vería si es falso positivo.
```

El agente te devuelve:

```text
Para reproducir XSS en /#/search?q=:
1) Abrí http://10.10.10.7:3000/#/search?q=<test-xss-canary> en tu browser de lab
2) Inspeccioná HTML (F12) — buscá <test-xss-canary> sin encoding
3) Si está sin encode → validado. Si está como &lt;test-xss-canary&gt; → falso positivo (encodeado).
No ejecutes JS.
```

### 5.4 Evidencia hasheada — tu seguro

Exigí siempre (prompt 2.6 ya lo hace):

- Cada artefacto en `./work/` con `sha256` en `trace.jsonl` / `blackboard.md`.
- Cada afirmación del informe cita `artefacto + hash + timestamp`.
- Si un hallazgo no cita artefacto, es humo — rebotá el informe.

> 🔑 Regla A5: **un hallazgo sin evidencia reproducible es ruido, no hallazgo.** No importa si lo dijo un agente con voz linda.

<!-- DIAGRAM: flowchart - validación sin código: [Hallazgo del agente] → ¿Tiene output crudo + fuente?] → No → hipótesis/falso positivo → Sí → ¿Clasificación validado?] → ¿Reproducción guiada OK?] → Sí → informe / No → corregir -->

---

## 6. Export y reporting — del markdown al PDF con diagramas

### 6.1 Qué le pedís al agente (todo en español)

```
Con los artefactos de ./work/ generá:
1) report/report-final.md (exec summary 5 bullets + tabla resumen + hallazgos PTES + apéndice con artefactos hasheados)
2) report/report-final.pdf vía pandoc
3) 2 diagramas con diagram-design: arquitectura/superficie y flujo de ataque
4) findings.csv para Jira/Notion
Sin inventar hallazgos. Citá artefacto+hash por afirmación. Marcá gaps como warnings.
```

El agente hace el resto:

| Artefacto | Cómo lo genera (sin que toques nada) | Vos validás |
|---|---|---|
| `report-final.md` | `report-writer` skill + `read ./work/**` + plantilla PTES | Severidad, falsos positivos, executive summary en criollo |
| `report-final.pdf` | `pandoc-mcp` (`pandoc report-final.md -o report-final.pdf`) | Portada, índice, que no haya PII real |
| `diagram-*.mmd` | `diagram-design` skill → Mermaid → PNG/SVG | ¿El diagrama refleja tu infra de lab o inventó hosts? |
| `findings.csv` | `ID, título, severidad, CVSS, fase, estado, remediación, artefacto, hash` | ¿Importa bien en Jira? |
| `trace.jsonl` | Append-only con `who/what/when/approval/hash` | ¿Está completo para auditoría? |

### 6.2 Diálogo modelo — export

```text
Vos: Exportá informe PTES a PDF con 2 diagramas: superficie y flujo XSS.

Agente: Generando report/report-final.md (4 hallazgos, 1 gap) + findings.csv
         [diagram-design] Diagrama 1: superficie Juice Shop (Express, AngularJS EOL, /search)
         [diagram-design] Diagrama 2: flujo XSS canario → validación → remediación
         [pandoc-mcp] pandoc report-final.md -o report-final.pdf --toc
         ✅ report-final.pdf (12 págs) + report-final.md + findings.csv + 2 PNG en report/diagrams/
         ¿Querés que lo suba a Notion/Jira o lo dejamos en ./report/?

Vos: Dejalo en ./report/, lo reviso.

Agente: ✅ Listo. Todo citado con hash. Gap: GraphQL no evaluado — marcado como warning.
```

### 6.3 Plantilla PTES que le exigís (la misma de A2 §9.3, pero vía agente)

Cada hallazgo en el markdown debe seguir:

```markdown
### [ID-001] Título claro (ej: XSS reflejado /search — Juice Shop lab)

- **Severidad:** Media → Baja 4.3 (CVSS: AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N) — ajustada por HttpOnly
- **Fase:** Web — XSS
- **Evidencia:** GET /#/search?q=<test-xss-canary> → refleja sin encode (work/web/xss-evidence.md sha256:abc)
- **Impacto:** Robo de sesión parcial; mitigado por HttpOnly — en prod sin HttpOnly sería alta
- **Causa raíz:** Falta de output encoding
- **Remediación:** htmlspecialchars / encode, CSP, test nuclei xss-reflected.yaml
- **Referencias:** CWE-79, OWASP Top 10 A03
- **Estado:** Validado en lab 10.10.10.7 — no explotado fuera de scope
```

> Si el agente te entrega un hallazgo sin esta estructura, rebotás: *"Reformateá H-02 con plantilla PTES completa y citá artefacto+hash."*

<!-- DIAGRAM: kanban - pipeline de reporting: [Hallazgos crudos] → [Dedup+CVSS] → [Draft PTES] → [Vos validás] → [Diagramas] → [PDF+CSV] -->

---

## 7. Operación continua — tu agente vigilante 24/7

De "auditoría puntual" a "SOC de una persona" sin desvelarte.

### 7.1 Qué es operación continua no-code

Le decís al agente en español: *"Vigilá X cada Y, alertame si Z, y no rompas nada sin mi OK"*. Él configura cron + checks + alertas.

| Vigilancia | Prompt no-code | Qué hace el agente | Alerta |
|---|---|---|---|
| **VPS hardening drift** | *"Cada día a las 6am auditá mi VPS lab 10.10.10.20 con Lynis y avisame si score baja de 80"* | Cron `0 6 * * *` → Lynis → compara con baseline → `work/metrics.jsonl` | Mensaje + `report/drift-YYYY-MM-DD.md` |
| **Web monitor** | *"Cada hora chequeá http://10.10.10.7:3000 con nuclei info y avisame si aparece algo nuevo"* | `nuclei -severity info,low` diff vs baseline | Diff + triage |
| **Certs / expiración** | *"Cada lunes revisá certs de *.lab.local y avisame si expiran en <30 días"* | crt.sh + check `openssl s_client` | Alerta + ticket |
| **Phishing watch** | *"Cada 4hs revisá ./lab/phishing/ y clasificá nuevos .eml"* | Parser + VT/MISP | `triage-*.json` + IOCs |
| **Dependabot-like** | *"Cada semana revisá package.json de Juice Shop lab y listá deps EOL con CVE"* | `npm audit` + NVD | Tabla priorizada |

### 7.2 Cómo lo configurás sin tocar cron a mano

```text
Vos: Quiero vigilancia continua de mi lab. Cada día 6am Lynis en 10.10.10.20 y cada hora nuclei info en 10.10.10.7.
     Avisame por acá y guardá drift en ./work/monitor/. No apliques fixes sin mi OK.

Agente: Configurando operación continua (lab):
         - Cron 1: 0 6 * * * → lynis audit 10.10.10.20 (solo lectura) → compara con baseline 84/100 → alerta si <80
         - Cron 2: 0 * * * * → nuclei info 10.10.10.7:3000 → diff vs work/monitor/baseline-nuclei.json
         - Guardrails: solo lectura, sin auto-fix, presupuesto per_day $2 pause_and_notify
         - Artefactos: work/monitor/drift-*.md + trace.jsonl + metrics.jsonl
         ¿Confirmás ventana y que es lab? [sí/no]

Vos: Confirmo.

Agente: ✅ Crons activos. Probando dry-run ahora... Lynis 84/100 sin drift, nuclei sin novedad.
         Kill switch: touch work/KILL frena todo. Próxima ejecución: mañana 6am.
         [pty session: monitor-lynis, monitor-nuclei]
```

**Config declarativa (si querés verla, el agente la genera):**

```jsonc
// opencode.jsonc — monitor continuo lab (generado por agente, vos lo revisás)
{
  "jobs": [
    {"id": "lynis-daily", "cron": "0 6 * * *", "agent": "hardener-agent", "task": "lynis audit 10.10.10.20 --baseline 84", "on_drift": "notify_human"},
    {"id": "nuclei-hourly", "cron": "0 * * * *", "agent": "recon-agent", "task": "nuclei -u http://10.10.10.7:3000 -severity info,low --diff baseline", "on_new": "triage_and_notify"}
  ],
  "permissions": {"hardener-agent": {"shell": "deny"}, "recon-agent": {"network": ["10.10.10.7"]}},
  "budgets": {"per_day_max_usd": 2.00, "action": "pause_and_notify"}
}
```

### 7.3 Alertas y escalado

```
Vos: Si el drift es crítico (score <60 o nuevo CVE high), escalá a reporte PTES y pedime aprobación para fix.
     Si es info, solo logueá.

Agente: ✅ Regla: drift crítico → genera work/monitor/critical-*.md + pide aprobación para fix con diff/rollback.
         Drift info → solo work/monitor/drift-*.md + métrica. Sin auto-fix nunca.
```

### 7.4 Costos y observabilidad (sin sustos)

| Item | Costo típico/día | Guardrail |
|---|---|---|
| Lynis daily (solo lectura) | $0.02 | Cron lectura, sin LLM para parseo pesado |
| Nuclei hourly (info) | $0.08 (24 corridas livianas) | Diff vs baseline, no re-analiza todo |
| Phishing watch 4hs | $0.05 | Solo nuevos .eml |
| **Total** | **~$0.15/día** | `per_day_max_usd: 2.00 pause_and_notify` |

> 🛑 Kill switch siempre: `touch work/KILL` o `npx opencode agent kill --all` — probalo en lab antes de dejarlo 24/7.

### 7.5 Ejemplo real — semana 1 de vigilancia (qué vas a ver)

```text
Día 1 (baseline): Lynis 84/100, nuclei 2 info (nginx disclosure, angularjs EOL) — guardado como baseline.
Día 2: Sin drift — log: "lynis 84/100 no drift, nuclei sin novedad" (costo $0.15)
Día 3: Drift simulado — vos hiciste sudo ufw disable para probar → alerta 09:03
        "⚠️ Drift crítico: UFW inactive en 10.10.10.20, score 71/100 (<80), diff en work/monitor/drift-2026-08-27.md"
        Propuesta: "¿Re-aplico UFW con ansible --check? Mostrame diff antes." [sí/no]
Día 4: Vos: "sí, reaplicá" → agente reaplica → re-audit 84/100 → drift resuelto.
```

> Sin vigilancia continua te enterás del drift cuando te auditan. Con agente te enterás a la hora.

<!-- DIAGRAM: timeline - semana de vigilancia: Día 1 baseline → Día 2 sin drift → Día 3 drift UFW alerta → Día 4 fix reaplicado → Día 5 baseline nuevo, con costos diarios -->

<!-- DIAGRAM: architecture - operación continua: [Cron scheduler] → [3 agentes vigilantes (lynis, nuclei, phishing)] → [Blackboard/monitor] → [Orquestador] → [Notificación humana] → [Aprobación] → [Fix] con kill switch visible -->

---

## 8. Errores comunes y cómo corregirlos — sin reescribir código

Todos se corrigen **hablando mejor**, no codeando.

| # | Error | Síntoma | Corrección (copiá y pegá) |
|---|---|---|---|
| 1 | **Prompt demasiado vago** | *"Hackeá mi red a ver qué encontrás"* → agente pide scope o peor, asume y se va a cualquier lado | `Reformulá con: "Hacé [tarea exacta] en [IP/dominio lab exacto] — lab [nombre], ventana [fecha], técnicas permitidas [lista], prohibidas [lista], entregá [formato]". Si no podés llenar los brackets, no promptes.` |
| 2 | **Scope incompleto** | Agente encuentra `10.10.10.99` y lo escanea sin preguntar | `Agregá al system prompt: "Si descubrís host/IP/dominio fuera de scope.json, no lo toques. Anotalo como out-of-scope — requiere autorización y frená. Nunca asumas scope."` + `scope.json` con `forbidden` |
| 3 | **Agente se va por las ramas** | Pide recon y termina probando RCE + exfiltrando | `Frená: "Frená. Volvé a tu plan de 3 pasos aprobado. Solo fase 1 (recon pasivo). No avances a exploit sin mi confirmación explícita. Logueá y esperá."` + checkpoint humano por fase (A4 §6.1) |
| 4 | **Alucinación de CVE/severidad** | Inventa `CVE-2024-XXXX` o pone crítico a todo | `Pedí: "Citá output crudo + link NVD para cada CVE. Severidad solo con CVSS vector y justificación. Sin evidencia → hipótesis. Re-clasificá."` (ver §5.1) |
| 5 | **Falsos positivos en masa** | Nuclei tira 30 hallazgos, 25 son humo | `Pedí: "Deduplicá, priorizá P1/P2/P3 con evidencia citada, marcá resto como informativo. Re-validá P1 con segunda tool/request canario. No listes todo como crítico."` |
| 6 | **Rate / DoS accidental** | Agente hace `ffuf` sin rate-limit y tira el lab | `Agregá: "Rate-limit 5/s, burst 10, ventana [horario]. Si detectás WAF/rate-limit, frená y reportá. Nunca --threads 200 sin mi OK. Dry-run primero."` |
| 7 | **Informe inventado** | Reporte con hallazgos sin artefacto | `Rebotá: "Reformateá con plantilla PTES §6.3. Cada hallazgo debe citar artefacto con sha256 y timestamp. Sin artefacto no es hallazgo — es gap. Marcá como warning."` |
| 8 | **Agente no pide confirmación** | Ejecuta intrusivo sin preguntar | `Config mal: revisá opencode.jsonc permissions.require_approval y system prompt. Agregá: "Todo paso intrusivo (scan agresivo, exploit, privesc, contain) requiere mi 'sí, autorizo [técnica] en [lab]' explícito. Sin eso, quedate en modo teórico."` |

### 8.1 Antes y después — cómo suena la corrección en criollo

| Situación | Prompt roto (antes) | Prompt corregido (después) |
|---|---|---|
| Recon | *"Buscá subdominios de mi empresa"* | *"Buscá subdominios de juice-shop.local (10.10.10.7) — lab, solo OSINT pasivo, sin tocar host. Tabla deduplicada + top 3."* |
| Web | *"Probá SQLi a ver si entra"* | *"Probá SQLi en http://10.10.10.5/dvwa/login.php DVWA low, con payload ' OR '1'='1' -- solo lectura. Mostrame payload antes y esperá mi sí."* |
| Reporte | *"Hacé un informe copado"* | *"Con artefactos de ./work/**/evidence.* generá informe PTES con ID/severidad CVSS/evidencia hasheada/tabla+exec summary. No inventes."* |

**Script de corrección universal (cuando no sabés qué pasó):**

```
Frená todo. Guardá trace.jsonl y hallazgos.md actuales.
Decime en 5 bullets: qué hiciste, con qué output, qué asumiste, qué falta validar y qué necesitás de mí para seguir.
No avances sin mi OK.
```

> 💡 90% de los errores de A5 no son de código — son de **comunicación**. Prompt vago = output vago. Scope claro + formato exigido + validación = agente útil.

<!-- DIAGRAM: flowchart - troubleshooting: [Síntoma] → ¿Prompt vago? → reformulá con brackets → ¿Scope incompleto? → scope.json+forbidden → ¿Se va por ramas? → checkpoint por fase → ¿Alucina? → validación §5.1 -->

---

## 9. Ejercicios prácticos — 5 labs para automatizar sin tocar un editor

> Todos en lab autorizado. Si no tenés lab, levantá DVWA/Juice Shop con Docker o usá HTB Starting Point. Nunca contra prod.

### Ejercicio 1 — Tu primera auditoría no-code (caso 1 completo)

**Objetivo:** cerrar el loop describir→planificar→ejecutar→reportar sin tocar editor.

1. Levantá Juice Shop: `docker run --rm -p 3000:3000 bkimminich/juice-shop`
2. Definí `scope.json` con `10.10.10.7:3000` (o `localhost:3000` si es Docker local).
3. Pegá prompt 2.1 adaptado, luego pedí enumeración no-intrusiva, luego validación XSS con canario (caso 1).
4. Pedí informe PTES + PDF (prompt 2.6).

**Entregable:** `work/recon/recon-report.json` + `work/web/xss-evidence.md` + `report/auditoria-juice-shop.pdf` + `trace.jsonl` con 3 handoffs.

**Validación:** ¿Cada hallazgo cita output crudo? ¿Severidad con CWE? (ver §5.2)

### Ejercicio 2 — Hardening guiado (caso 2 completo)

**Objetivo:** hardenear sin saber bash, con diff y rollback.

1. Levantá VM Ubuntu 22.04 lab (VirtualBox, 1 vCPU alcanza).
2. Pedí auditoría Lynis solo lectura, luego plan con diff/rollback, luego aplicá 2 fixes con `ansible --check` (caso 2).
3. Re-audita y exportá checklist CIS.

**Entregable:** `work/harden/plan.md` (con diff+rollback) + `report/hardening-vps.pdf` + `trace.jsonl` con aprobaciones.

**Pregunta trampa:** ¿Qué pasa si aprobás 5 fixes de una? (Respuesta: no — 1 por 1, con validación intermedia).

### Ejercicio 3 — APK sin reversing (caso 3)

**Objetivo:** analizar APK sin abrir Ghidra a mano.

1. Bajá `insecure-bank-v2.apk` o `DVIA-v2.apk` (labs públicos).
2. Pegá prompt APK (caso 3), pedí top 5 OWASP Mobile + evidencia truncada.
3. Generá informe con remediación.

**Entregable:** `work/apk/mobsf.json` + `report/apk-analisis.md` + diagrama de superficie APK.

**Validación:** ¿La key expuesta está truncada? ¿Cita `manifest` y `smali` con hash?

### Ejercicio 4 — Phishing triage (caso 4)

**Objetivo:** cazar phishing sin leer headers a mano.

1. Bajá 3 `.eml` de lab (GOAD samples o generá con `swaks` en lab).
2. Pegá prompt 2.5, pedí clasificación + IOCs + Sigma.
3. Generá reporte no técnico + `iocs.csv`.

**Entregable:** `work/phishing/triage-*.json` + `Sigma_phishing_typosquat.yml` + `report/phishing-triage.pdf`.

### Ejercicio 5 — Vigilante 24/7 (operación continua)

**Objetivo:** dejar un agente vigilando sin quedarte pegado.

1. Configurá con prompt §7.2: Lynis daily + nuclei hourly en tu lab.
2. Hacé dry-run y verificá `work/monitor/` + `metrics.jsonl`.
3. Provocá drift a propósito (ej: `sudo ufw disable` en lab) y verificá alerta crítica.
4. Probá kill switch: `touch work/KILL` y verificá que frena en <10s.

**Entregable:** `work/monitor/drift-*.md` + `metrics.jsonl` con `budget_exceeded` o `killed` + captura de alerta + `trace.jsonl` con `killed`.

> 🏆 **Criterio de aprobación A5:** si completaste ejercicios 1 y 2 (o 1 y 4) con artefactos hasheados, reporte PDF y validación §5, podés decir "automatizo sin código" sin mentir. Si no, repetí — el agente no te va a juzgar.

---

## 10. Apéndice — checklist no-code y mapa "antes con código / ahora con agente"

### 10.1 Checklist no-code (copiá y pegá antes de cada tarea)

```markdown
## Checklist no-code — Tarea: ________________

- [ ] Scope autorizado por escrito: IPs/dominios ________________, ventana ________________
- [ ] scope.json creado con targets + forbidden + contactos (ver A4 §10.4)
- [ ] Prompt de §2 elegido y adaptado (no vago, con guardrails y formato)
- [ ] Criterio de éxito definido: "termino cuando ________________"
- [ ] Formato de salida exigido: markdown + tabla + severidad con CWE/CVSS
- [ ] Guardrails activos: allowed_targets, require_confirmation para intrusivo, rate-limit
- [ ] Presupuesto configurado: per_workflow $2, per_day $10, pause_and_notify
- [ ] Kill switch probado: work/KILL frena en <10s
- [ ] Validación §5 lista: pedir output crudo + fuente + clasificación validado/hipótesis/falso positivo
- [ ] Export §6 definido: md + pdf + diagramas + csv + artefactos hasheados
- [ ] Logs en ./work/ y ./report/ (no en prod, no con PII real)

Firma / fecha: ________________
```

### 10.2 Mapa — "antes hacías X con código, ahora decile Y al agente Z"

| Antes (con código) | Ahora (no-code) — qué le decís y a quién |
|---|---|
| `nmap -sV -sC 10.10.10.5` + parsear XML | *"Escaneá 10.10.10.5 top 1000 no-intrusivo y priorizá"* → **recon-agent** + `nmap-mcp` (prompt 2.1) |
| `nuclei -u https://target -t cves/` + filtrar FPs | *"Corré nuclei medium+ en https://lab.local y priorizá P1/P2/P3 con evidencia"* → **recon-agent** / **exploit-agent** safe (prompt 2.1/2.2) |
| `sqlmap -u "http://dvwa?id=1" --dbs` | *"Probá SQLi en DVWA low con canario, mostrame payload antes"* → **exploit-agent** (solo lab, prompt 2.2) |
| `ffuf -w wordlist -u https://api/FUZZ` + grep | *"Fuzzeá /api/users/{id} con IDs 1-10 rate-limit 5/s"* → **exploit-agent** (prompt 2.3) |
| `curl -s http://target/openapi.json \| jq .paths` | *"Parseá openapi.json y listá endpoints sin auth"* → **recon-agent** + `httpx-mcp` (prompt 2.3) |
| `apktool d app.apk && grep -r api_key` | *"Analizá mi APK de lab estático y dame top 5 OWASP Mobile"* → **forensics-agent** + `mobsf-mcp` (caso 3) |
| `lynis audit system && cat /var/log/lynis.log` | *"Audita mi VPS lab con Lynis y dame plan con diff/rollback"* → **hardener-agent** + `lynis-mcp` (caso 2) |
| `cat mail.eml \| grep -i spf && virustotal url` | *"Clasificá mis .eml de lab y enriquecé con VT/MISP"* → **detector-agent** + `thehive-mcp` (prompt 2.5, caso 4) |
| `pandoc report.md -o report.pdf && mermaid-cli` | *"Generá informe PTES y exportá a PDF con 2 diagramas"* → **report-agent** + `report-writer` + `diagram-design` + `pandoc-mcp` (prompt 2.6) |
| `crontab -e` + `while true; do nmap; sleep 3600; done` | *"Vigilá mi lab cada hora y alertame si hay drift"* → **orquestador** + cron jobs (prompt §7.2) |
| `grep -r "TODO" \| bloodhound` + manual | *"Mapeá mi AD de lab con BloodHound y decime path a DA"* → **recon-agent** + `bloodhound-mcp` (prompt 2.4 / A2 §7) |
| `history \| tail -20` + `chain-of-custody` | *"Armá timeline forense desde mis logs de lab"* → **forensics-agent** + `forensics-pack` (A3 + prompt 2.5) |

### 10.3 Qué agente/skill usar — guía rápida

| Tarea | Agente | Skills | MCPs |
|---|---|---|---|
| Recon / scanning | `recon-agent` | `cti-enrich` | `nmap-mcp`, `nuclei-mcp`, `httpx-mcp`, `shodan-mcp` |
| Web / API / exploit safe | `exploit-agent` (modo safe, con aprobación) | `security-review` | `burp-mcp`, `zap-mcp`, `nuclei-mcp` |
| Hardening / VPS | `hardener-agent` | `security-review` | `lynis-mcp`, `prowler-mcp`, `ansible-mcp --check` |
| APK / forense | `forensics-agent` | `forensics-pack` | `mobsf-mcp`, `apktool-mcp`, `volatility-mcp` |
| Phishing / SOC / IR | `detector-agent` / `hunter-agent` | `cti-enrich` | `thehive-mcp`, `wazuh-mcp`, `misp-mcp` |
| Reporte / diagramas | `report-agent` | `report-writer`, `diagram-design` | `pandoc-mcp`, `filesystem-mcp` (solo ./work/, ./report/) |
| Orquestación / vigilancia | `orquestador` | `diagram-design` | `memory`, `cron` (jobs), todos vía delegación |

> Guardate esta tabla en `work/blackboard.md` o en `opencode-mem` — es tu machete no-code. Cuando dudes "¿a quién le pido esto?", mirá acá.

### 10.4 Glosario no-code (criollo)

| Término | En criollo |
|---|---|
| **Prompt** | Lo que le decís al agente en español. Si es vago, el agente hace cualquiera. |
| **Guardrail** | Freno que no se negocia: scope, aprobación, rate-limit, kill switch. |
| **Scope** | Lista exacta de qué puede tocar. Fuera de scope = no tocar, anotar y frenar. |
| **Canario** | Payload inocuo (`<test-xss-canary>`) para validar sin ejecutar JS/daño. |
| **PTES** | Estándar de pentest: recon→scan→exploit→post→reporte. Estructura de tu informe. |
| **CVSS/CWE** | Score y categoría de la vuln. El agente propone, vos validás con contexto. |
| **Dry-run** | Simular sin aplicar: `ansible --check`, `waf --dry-run`. Sin sorpresas. |
| **Trace** | Log append-only de quién hizo qué/cuándo/con qué aprobación y hash. Tu auditoría. |
| **Blackboard** | Pizarrón compartido donde todos los agentes dejan hallazgos con hash. |
| **MCP** | Conector estándar agente↔herramienta (nmap, nuclei, burp). Vos no ves el JSON. |

### 10.5 FAQ no-code — preguntas que te vas a hacer

**"¿Y si no tengo idea de qué prompt usar?"**
Usá la tabla 10.2: buscá la fila "antes hacías X" más parecida y copiá el "ahora decile Y". Si no existe, pegá el prompt meta de §2.7 y decile al orquestador: *"Quiero hacer [tu idea en español] en [lab]"* — él te arma el prompt con guardrails.

**"¿El agente puede romper mi lab aunque diga 'solo lectura'?"**
Sí, si lo configuraste mal. Validá siempre `opencode.jsonc` permissions: `shell: deny` donde no debe ejecutar, `network` acotado, `write` solo a `./work/` y `./report/`. Probá con ejercicio 5 (provocar drift + kill switch) antes de dejarlo 24/7.

**"¿Qué hago si el agente me dice 'no puedo hacer eso sin código'?"**
Reformulá. En lugar de *"escribí un script que..."*, decí *"orquestá [tool] con [params] y entregá [formato]"*. El agente no escribe código para vos — invoca tools que ya existen vía MCP. Si insiste, cambiá de modelo (Claude Sonnet 4 maneja mejor delegación) o partí la tarea en 2 prompts chicos.

**"¿Puedo usar A5 sin OpenCode?"**
Sí, pero perdés guardrails y trazabilidad. Con Claude Code / Factory Droid también funciona si replicás scope + aprobaciones + trace manual. OpenCode es recomendado porque ya trae `opencode.jsonc`, PTY sessions y `opencode-mem` — no porque sea obligatorio.

**"¿Cada cuánto revalido que el agente no alucinó?"**
Siempre que veas severidad alta/crítica o algo que implique acción (bloquear IP, patch, escalar). Para info/low, con checks §5.1 alcanza. Regla: si vas a ponerlo en un informe que firma otra persona, validás. Si es solo tu apunte, marcá como hipótesis y seguí.

### 10.6 Checklist de entrega — ¿tu informe no-code está listo para mostrar?

```markdown
## Entrega A5 — ¿listo para portfolio?

- [ ] 2 casos de §3 ejecutados en lab (ej: caso 1 + caso 2) con scope.json y ventana
- [ ] Artefactos en ./work/ con hash (recon-report.json, evidencia, triage, etc.)
- [ ] Validación §5 aplicada: output crudo + fuente + clasificación validado/hipótesis/FP
- [ ] Reporte PTES en ./report/report-final.md + PDF + findings.csv + 2 diagramas
- [ ] Executive summary que entiende alguien no técnico (5 bullets, sin jerga)
- [ ] trace.jsonl completo (quién/cuándo/qué/aprobación/hash) y blackboard actualizado
- [ ] Kill switch y presupuesto probados (ejercicio 5 o al menos touch work/KILL)
- [ ] Sin PII real, sin secretos completos, sin payload weaponizado — todo lab/sanitizado

Si marcás todo, subilo a tu repo/portfolio. Si falta algo, es gap — marcá como warning en el informe.
```

---

> ⚡ **Cierre — de la idea al informe sin tocar un editor:** Ya podés. Describí en español qué querés, con scope y formato, y el agente hace el laburo pesado. Pero acordate: **no-code no es no-responsable**. Validá evidencia, corregí en español, exigí artefactos hasheados y frená cuando algo no cierra. Si podés explicar qué le pediste, por qué y cómo lo validaste, ya sos operador no-code serio — sin haber escrito una línea de código.
>
> **Próximo paso:** elegí un caso de §3 (recomendado: caso 1 + caso 2), ejecutalo en tu lab y guardá `report-final.pdf` + `trace.jsonl`. Ese es tu portfolio no-code. El código, si algún día lo querés aprender, va a ser más fácil porque ya entendés el *qué* y el *por qué* — el *cómo* lo escribe el agente por vos hasta entonces.

<!-- DIAGRAM: loop - ciclo A5 completo: [Vos describís en español] → [Agente planifica] → [Ejecuta tools] → [Reporta con evidencia] → [Vos validás sin código] → [Export PDF+diagramas] → [Vigilancia 24/7 con cron] → loop, con kill switch y validación §5 siempre visibles -->
