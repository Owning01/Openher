# 🧩 A4 — Orquestación Multi-Agente — Equipos de IA que Hackean y Defienden Juntos
> **Versión:** 1.0
> **Idioma:** Español (argentino) — informal, directo, sin humo
> **Nivel:** Avanzado
> **Duración estimada:** 4–6 semanas (~24 hs, lab incluido)
> **Prerequisitos:** [A1 — Fundamentos](./01-A1-4g3nt3s-f0nd4m3nt0s.md), [A2 — Ofensivos](./02-A2-0ff3ns1v3-4g3nt3s.md), [A3 — Defensivos](./03-A3-d3f3ns1v3-4g3nt3s.md). Tenés que haber laburado con al menos un agente con tools reales (no solo chat). Si no, volvé a A1.
> ⚠️ **Aviso — acá se multiplica el riesgo y la responsabilidad:** Un solo agente ya es peligroso si lo dejás sin correa. Cuatro agentes colaborando sin guardrails son una banda sin director: se pisan, inventan, escalan privilegios y nadie firma nada. Todo lo de este doc va **solo en lab aislado o infra con autorización escrita y alcance definido**. Cada agente deja traza, cada acción destructiva pide aprobación humana, y hay un **kill switch** siempre a mano. Si no podés explicar qué hace cada agente y por qué, no lo orquestes.
> 🧩 **¿Por qué A4 es imprescindible?** A1 te enseñó qué es un agente. A2 y A3 te dieron especialistas (uno ataca, otro defiende). Pero en la vida real nadie labura solo: el pentest lo hace un equipo, el SOC es un equipo, el purple team es dos equipos que se hablan. A4 es el pegamento — **cómo hacer que esos especialistas cooperen sin pisarse, sin perder contexto y sin que vos te vuelvas loco coordinando a mano**. Sin esto, los otros tres docs quedan como solistas virtuosos que nunca tocaron juntos.
---
## 📑 Índice
> ⏱️ **Tiempo estimado:** 24 horas (~6 sesiones de 4 hs) — 740 líneas aprox.
1. [Introducción — por qué un agente solo no alcanza](#1-introducción--por-qué-un-agente-solo-no-alcanza)
2. [Arquitecturas de orquestación — central, mesh y handoff](#2-arquitecturas-de-orquestación--central-mesh-y-handoff)
3. [Stack concreto — con qué se arma esto hoy (2025-2026)](#3-stack-concreto--con-qué-se-arma-esto-hoy-2025-2026)
4. [Diseño de agentes especializados — tu equipo en 4 fichas](#4-diseño-de-agentes-especializados--tu-equipo-en-4-fichas)
5. [Comunicación y memoria compartida — que no se olviden de nada](#5-comunicación-y-memoria-compartida--que-no-se-olviden-de-nada)
6. [Workflow red team — 4 agentes rompiendo un lab de punta a punta](#6-workflow-red-team--4-agentes-rompiendo-un-lab-de-punta-a-punta)
7. [Workflow blue team — SOC swarm que no duerme](#7-workflow-blue-team--soc-swarm-que-no-duerme)
8. [Purple team — cuando rojo y azul se hablan (y no se pelean)](#8-purple-team--cuando-rojo-y-azul-se-hablan-y-no-se-pelean)
9. [Observabilidad, costos y guardrails — sin esto es juguete caro y peligroso](#9-observabilidad-costos-y-guardrails--sin-esto-es-juguete-caro-y-peligroso)
10. [Configuración práctica paso a paso — de cero a orquestador andando](#10-configuración-práctica-paso-a-paso--de-cero-a-orquestador-andando)
11. [Ejercicios prácticos — 5 labs para orquestar sin incendiar nada](#11-ejercicios-prácticos--5-labs-para-orquestar-sin-incendiar-nada)
12. [Apéndice — plantillas de agentes y JSON de orquestación](#12-apéndice--plantillas-de-agentes-y-json-de-orquestación)
---
## 1. Introducción — por qué un agente solo no alcanza
### 1.1 El mito del agente todoterreno
En A1 el loop `percibe → razona → actúa` suena lindo hasta que le pedís: "Hacé pentest completo, defendé y escribí el informe". El agente se ahoga: olvida scope, mezcla mindset ofensivo/defensivo, alucina CVEs y entrega PDF infimable. ¿Por qué? 1) Contexto finito (logs de 15 tools lo saturan), 2) Objetivos opuestos en un mismo prompt, 3) Falta de especialización. Solución: **varios agentes chicos, bien definidos, que colaboran**.

### 1.2 La analogía humana

| Humano | Multi-agente |
|---|---|
| Líder/PM | **Orquestador** |
| Pentester | `recon-agent`, `exploit-agent` |
| SOC/IR | `detector`, `hunter`, `responder` |
| GRC/Report | `report-agent`, `hardener` |
| Pizarrón/Jira | **Blackboard/Knowledge Graph** |
| Daily/handoff | **MCP/A2A/handoff** |
| Presupuesto/aprobación | **Guardrails/tokens/aprobaciones** |
> 💡 **Regla de oro:** Si no lo harías con humanos sin autorización y sin dejar traza, tampoco lo hagas con agentes.

### 1.3 ¿Qué vas a poder hacer al terminar A4?
- Diseñar un orquestador que coordine 3–5 agentes especializados con roles, tools y límites claros.
- Elegir arquitectura (central vs mesh vs handoff) según el caso.
- Armar un red team automatizado y un SOC swarm que laburen sin pisarse.
- Montar un purple team donde rojo y azul colaboren vía orquestador con trazabilidad completa.
- Configurar `opencode.jsonc`, `.opencode/agent/*.md`, MCP servers y skills para que todo ande de verdad, no solo en diagrama.
<!-- DIAGRAM: architecture overview - orquestador central coordinando 4 agentes especializados conectados a blackboard/knowledge graph y a herramientas vía MCP -->

---

## 2. Arquitecturas de orquestación — central, mesh y handoff
No hay una sola forma de orquestar. Hay tres patrones base. Elegís según complejidad, costo y cuánto control querés.

### 2.1 Patrón 1: Orquestador central (hub-and-spoke)
Un agente "jefe" (el orquestador) recibe el objetivo, lo descompone, delega a especialistas y sintetiza resultados. Los especialistas **no se hablan entre sí**, solo con el orquestador.

```
[Vos] → [Orquestador] → recon-agent
                     → exploit-agent
                     → report-agent
                     ← (resultados) ←

```
**Cuándo usarlo:** 90% de los casos. Es el más trazable, el más fácil de auditar y el que mejor respeta autorizaciones.

### 2.2 Patrón 2: Mesh / Swarm (peer-to-peer)
Todos los agentes se ven, se hablan y negocian entre ellos. No hay jefe único. Usan un blackboard o protocolo tipo A2A para coordinarse.

```
recon ↔ exploit ↔ post-exploit
  ↕        ↕          ↕
hunter ↔ detector ↔ responder

```
**Cuándo usarlo:** SOC distribuido, caza de amenazas colaborativa, escenarios donde la latencia del orquestador es cuello de botella. Más potente, mucho más difícil de debuggear.

### 2.3 Patrón 3: Handoff secuencial (pipeline)
Un agente termina, le pasa el contexto al siguiente, y se apaga. Como una carrera de postas.

```
recon-agent ──handoff──▶ exploit-agent ──handoff──▶ report-agent
   (contexto + artefactos)

```
**Cuándo usarlo:** Workflows lineales y auditables (ej: cadena de pentest donde cada fase debe ser aprobada antes de la siguiente). El más barato en tokens.

### 2.4 Tabla comparativa — elegí con criterio

| Criterio | Orquestador central | Mesh / Swarm | Handoff secuencial |
|---|---|---|---|
| **Control y trazabilidad** | ✅ Alto — un solo punto de decisión | ⚠️ Bajo — decisiones distribuidas | ✅ Alto — fases bien delimitadas |
| **Tolerancia a fallos** | Media — si cae el orquestador, se para todo | Alta — los pares se reorganizan | Baja — si falla una posta, se corta la cadena |
| **Costo (tokens/API)** | Medio — orquestador consume extra | Alto — mucha cháchara entre pares | Bajo — solo pasa lo necesario |
| **Complejidad de config** | Media | Alta | Baja |
| **Autorización humana** | Fácil — el orquestador pide aprobación | Difícil — ¿quién pide permiso? | Fácil — cada handoff es un checkpoint |
| **Mejor para** | Red team, purple team, labs | SOC swarm, threat intel colaborativa | Pentest formal, cadena forense |
| **Peor para** | Escenarios ultra dinámicos | Auditorías / compliance estricto | Workflows con loops y reintentos |
> 🎯 **Recomendación del doc:** Empezá siempre por **orquestador central**. Cuando lo domines, probá handoff. Mesh solo si tenés observabilidad madura (sección 9) y presupuesto para quemar tokens.

### 2.5 Híbrido — lo que vas a usar en la práctica
En la vida real mezclás: orquestador central que dispara handoffs secuenciales, y dentro de una fase deja que dos agentes colaboren en mesh acotado.
<!-- DIAGRAM: architecture comparison - tres columnas con orquestador central vs mesh vs handoff, flechas de comunicación y checkpoints humanos -->

---

## 3. Stack concreto — con qué se arma esto hoy (2025-2026)
Basta de diagramas abstractos. Esto es lo que instalás.

### 3.1 Capas del stack

| Capa | Herramienta | Rol en la orquestación |
|---|---|---|
| **Runtime / Orquestador** | **OpenCode** (recomendado), Claude Code, Factory Droid, Pi | Corre el orquestador, gestiona sesiones, aprueba acciones |
| **Protocolo agente ↔ herramienta** | **MCP (Model Context Protocol)** | Cada agente expone y consume tools de forma estándar |
| **Protocolo agente ↔ agente** | **A2A (Agent-to-Agent)** de Google + MCP sampling | Handoff, delegación, negociación entre pares |
| **Memoria / Conocimiento** | `opencode-mem`, knowledge graph, blackboard file | Contexto compartido, vector search, trazas |
| **Skills (capacidades pluggeables)** | `diagram-design`, `security-review`, `forensics-pack`, `report-writer` | Cada agente carga solo los skills que necesita |
| **Observabilidad** | Trazas OpenTelemetry, `pty` sessions, log de aprobaciones | Auditoría, replay, costos |
| **Guardrails** | `opencode.jsonc` permissions, allowlists, kill switch | Quién puede hacer qué, dónde y cuándo |

### 3.2 ¿Por qué OpenCode como orquestador?
Sesiones PTY aisladas, `opencode.jsonc` declarativo versionable, `.opencode/agent/*.md` como contrato auditable, skills pluggeables. Claude/Factory como workers, orquestador siempre en OpenCode para trazar en un solo punto.

### 3.3 MCP servers que vas a usar sí o sí

| MCP Server | Qué expone | Quién lo consume |
|---|---|---|
| `nmap-mcp`, `nuclei-mcp`, `httpx-mcp` | Escaneo, fingerprinting | `recon-agent` |
| `burp-mcp` / `zap-mcp` | Proxy, fuzzing, sitemap | `exploit-agent` |
| `wazuh-mcp`, `velociraptor-mcp`, `thehive-mcp` | Logs, triage, casos | `detector-agent`, `hunter-agent` |
| `ghidra-mcp`, `volatility-mcp` | Análisis binario / memoria | `forensics-agent` |
| `jira-mcp`, `notion-mcp`, `git-mcp` | Tickets, docs, código | `report-agent`, `hardener-agent` |
| `brave-search-mcp`, `shodan-mcp` | OSINT, CTI | `recon-agent`, `hunter-agent` |

### 3.4 A2A — el pegamento agente-a-agente
A2A no reemplaza a MCP. MCP es **agente ↔ herramienta**, A2A es **agente ↔ agente**. Con A2A un agente puede:
- Descubrir qué otro agente está disponible y qué sabe hacer (`agent card`).
- Delegar una subtarea con contexto acotado (no le pasa todo el historial).
- Pedir aprobación al orquestador antes de ejecutar algo destructivo.
> ⚠️ **Sin A2A o equivalente, terminás con agentes que se mandan mensajes por archivos sueltos y se pisan.** No escales sin protocolo.

### 3.5 Skills — especialización sin hinchar el prompt
Un skill es un paquete de instrucciones + tools + ejemplos que se carga bajo demanda.

| Skill | Contenido | Agente que lo usa |
|---|---|---|
| `diagram-design` | Genera diagramas Mermaid/architecture desde descripción | Orquestador, `report-agent` |
| `security-review` | Checklist OWASP, CVSS, SAST heurístico | `exploit-agent`, `hardener-agent` |
| `forensics-pack` | Volatility cheatsheet, cadena de custodia | `forensics-agent` |
| `report-writer` | Plantillas exec summary, hallazgos, remediation | `report-agent` |
| `cti-enrich` | Normaliza IOCs, consulta MISP/OTX | `hunter-agent`, `recon-agent` |
<!-- DIAGRAM: stack - capas verticales desde runtime (OpenCode) → protocolos (MCP/A2A) → agentes especializados → skills → observabilidad/guardrails -->

---

## 4. Diseño de agentes especializados — tu equipo en 4 fichas
Acá está el corazón de A4. Cada agente es una **ficha con contrato**: quién es, qué puede hacer, qué no puede hacer, y cómo habla con los demás.
> 📌 **Principio:** Un agente = un rol = un system prompt = un set acotado de tools. Si un agente necesita 20 tools, lo partiste mal.

### 4.1 `recon-agent` — el que mira sin tocar (mucho)
**Misión:** Mapear superficie, enumerar, enriquecer. Nunca explota.
**System prompt (resumen):**

```markdown
Sos recon-agent. Tu único objetivo es recolectar y normalizar
información sobre el objetivo DENTRO del scope autorizado.
No explotás, no brute-forceás, no enviás payloads.
Si encontrás algo sensible, lo reportás al orquestador y frenás.
Respondés siempre con JSON estructurado + resumen humano.

```
**Tools permitidas:** `nmap-mcp` (solo `-sV -sC --top-ports`, sin `-A` agresivo), `httpx-mcp`, `shodan-mcp`, `brave-search-mcp`, `whois-mcp`, `read`, `write` (solo en `./work/recon/`).
**Scope:** Solo dominios/IPs en `scope.json`. Cualquier hallazgo fuera de scope se marca `out-of-scope` y no se investiga.
**Output esperado:** `recon-report.json` con hosts, puertos, tech stack, IOCs iniciales.

### 4.2 `exploit-agent` — el que prueba si la puerta abre (en lab)
**Misión:** Validar vulnerabilidades encontradas por `recon-agent`. Solo con aprobación explícita.
**System prompt (resumen):**

```markdown
Sos exploit-agent. Validás vulnerabilidades en lab autorizado.
Nunca atacás sin ticket de aprobación del orquestador.
Cada exploit va con: objetivo, técnica, payload sanitizado,
evidencia y rollback plan. Si no hay aprobación, te quedás en
modo "teórico" (explicás el vector sin ejecutarlo).

```
**Tools permitidas:** `nuclei-mcp`, `zap-mcp`, `sqlmap-mcp` (solo en lab), `burp-mcp`, `shell` (solo en `lab-net`), `write` (solo `./work/exploit/`).
**Guardrails:** Requiere `approval: exploit` del orquestador. Rate limit 5 req/s. Kill switch si detecta WAF/prod.
**Output esperado:** `exploit-evidence.md` con PoC, severidad CVSS, y si/no explotable.

### 4.3 `defense-agent` (familia: detector + hunter + responder + hardener)
En la práctica son 2–3 agentes, pero comparten ficha base. Los separás cuando el SOC crece.

| Sub-agente | Foco | Tools clave |
|---|---|---|
| `detector-agent` | Triage de alertas, correlación, scoring | `wazuh-mcp`, `siem-query`, `sigma-mcp` |
| `hunter-agent` | Hipótesis, búsqueda proactiva, CTI | `velociraptor-mcp`, `misp-mcp`, `kql-mcp` |
| `responder-agent` | Contención propuesta (no ejecutada sin aprobación) | `thehive-mcp`, `ansible-mcp` (dry-run) |
| `hardener-agent` | Recomendaciones, IaC, hardening checklist | `scoutsuite-mcp`, `prowler-mcp`, `git-mcp` |
**System prompt base (defense):**

```markdown
Sos defense-agent. Tu prioridad es reducir riesgo sin romper
disponibilidad. Nunca aislás un host, bloqueás IP o aplicás
patch sin aprobación humana explícita. Toda recomendación
incluye: riesgo actual, impacto de la mitigación, y plan de
rollback. Citás fuentes (Sigma rule, MITRE ATT&CK, log id).

```

### 4.4 `report-agent` — el que traduce técnica a negocio
**Misión:** Tomar artefactos de todos los agentes y armar informe auditable.
**System prompt:**

```markdown
Sos report-agent. No inventás hallazgos. Solo sintetizás
artefactos que están en ./work/**/evidence.* con hash y
timestamp. Cada afirmación lleva cita a artefacto. Generás
dos capas: executive summary (negocio) y technical appendix.
Marcás gaps y contradicciones como warnings.

```
**Tools permitidas:** `read` (solo `./work/`), `write` (solo `./report/`), `diagram-design` skill, `pandoc-mcp`.
**Output esperado:** `report-final.md` + `report-final.pdf` + `findings.csv` con trazabilidad completa.

### 4.5 Ficha resumen — tu equipo en una tabla

| Agente | Input | Output | Herramientas | Aprobación requerida | Memoria |
|---|---|---|---|---|---|
| `recon-agent` | `scope.json` + objetivo | `recon-report.json` | OSINT, escaneo pasivo | No (solo lectura) | Escribe en blackboard |
| `exploit-agent` | `recon-report.json` + ticket | `exploit-evidence.md` | Nuclei, ZAP, sqlmap (lab) | **Sí — exploit** | Lee blackboard, escribe evidencias |
| `detector/hunter` | Alertas, logs, IOCs | `triage.json`, hipótesis | SIEM, Velociraptor, MISP | No (solo lectura/análisis) | Lee/escribe blackboard |
| `responder/hardener` | `triage.json` + hallazgos | `response-plan.md` (dry-run) | TheHive, Ansible --check | **Sí — contain/harden** | Propone, no ejecuta |
| `report-agent` | Todos los `evidence.*` | `report-final.*` | Pandoc, diagram-design | No (solo síntesis) | Solo lectura, cita fuentes |
> 🔑 **Antipatrón común:** Darle a `report-agent` permiso de escritura en `./work/` o a `recon-agent` acceso a `exploit` tools. No. Cada uno en su caja.
<!-- DIAGRAM: sequence - swimlanes de 4 agentes mostrando quién produce y quién consume cada artefacto, con checkpoints de aprobación humana -->

---

## 5. Comunicación y memoria compartida — que no se olviden de nada
Tener agentes sin memoria compartida es como tener un equipo que se comunica por papelitos que se pierden.

### 5.1 El problema del contexto perdido
Si `recon-agent` encuentra `admin.target.lab:8080 Apache 2.4.49` y no lo deja en lugar común, `exploit-agent` lo redescubre (quema tokens) o lo ignora. Solución: **tres capas de memoria**.
### 5.2 Tres capas

| Capa | Qué guarda | Dónde vive | Quién la usa | Ejemplo |
|---|---|---|---|---|
| **1. Blackboard (pizarrón)** | Hechos actuales, artefactos, estado del workflow | `work/blackboard.md` o `blackboard.json` + `opencode-mem` vector | Todos — lectura/escritura controlada | `host: 10.0.0.5, port 8080, CVE-2021-41773 sospechado` |
| **2. Knowledge Graph** | Entidades, relaciones, historial | `codebase-memory-mcp` / `ctx_knowledge` | Orquestador + `hunter-agent` | `Apache 2.4.49 → vulnerable a path traversal → afecta a host X → mitiga con upgrade` |
| **3. Traza / Log (append-only)** | Quién hizo qué, cuándo, con qué aprobación | `work/trace.jsonl` + `docs/wiki/log.md` style | Auditoría, replay, costos | `2026-05-24T14:03Z exploit-agent nuclei CVE-2021-41773 approvedBy:octavio ticket:42` |

### 5.3 Protocolo de handoff — cómo se pasan la posta sin perder nada
Un handoff no es "te paso el chat". Es un **paquete estructurado**:

```json
{"from":"recon-agent","to":"exploit-agent","handoff_id":"h-20260524-001","scope":["10.0.0.0/24"],"artifacts":["work/recon/recon-report.json"],"findings":[{"host":"10.0.0.5:8080","tech":"Apache 2.4.49","suspected":"CVE-2021-41773"}],"approvals":{"exploit":"pending"},"next_action":"validate CVE-2021-41773 safe"}

```
Reglas:
1. **Nunca pasar el historial completo.** Solo artefactos + resumen + referencia al blackboard.
2. **Siempre incluir `approvals`.** Si el siguiente paso requiere aprobación, el handoff queda en `pending` hasta que el orquestador/human lo apruebe.
3. **Siempre hashear artefactos.** `sha256` en el handoff para detectar manipulación o alucinación.

### 5.4 Blackboard concreto — cómo se ve

```markdown
# Blackboard — lab-forense-01 (2026-05-24 14:00 UTC, ticket #42)
## Scope: 10.0.0.0/24, *.target.lab

| host | puerto | servicio | hallazgo | estado |
|---|---|---|---|---|
| 10.0.0.5 | 8080 | Apache 2.4.49 | CVE-2021-41773 | recon:done→exploit:pending |
| 10.0.0.12 | 22 | OpenSSH 8.2 | — | recon:done |
IOCs: 192.0.2.99 brute force 13:45Z
Pendiente: [ ] Aprobar nuclei safe 10.0.0.5:8080

```

### 5.5 Knowledge Graph — para no redescubrir la rueda
Cada hallazgo se normaliza como tripleta `(Apache 2.4.49)-[tiene CVE]->(CVE-2021-41773)-[afecta]->(10.0.0.5:8080)` que consumen hunter/hardener. Tip: `memory({mode:"add"})` / `memory({mode:"search"})` para persistir sin hinchar el prompt.
<!-- DIAGRAM: loop - ciclo blackboard → agente actúa → escribe artefacto → actualiza blackboard → orquestador decide siguiente agente -->

---

## 6. Workflow red team — 4 agentes rompiendo un lab de punta a punta
Acá se junta todo. Vamos a simular un **red team automatizado contra `target.lab` (10.0.0.0/24) en `lab-net`** con 4 agentes y aprobaciones humanas.

### 6.1 Mapa del workflow

```
Fase 0: Scope + aprobación humana
  → Fase 1: recon-agent (mapeo)
    → checkpoint humano
      → Fase 2: exploit-agent (validación safe)
        → Fase 3: post-exploit-agent (solo enum, sin persistencia)
          → Fase 4: report-agent (informe con trazas)

```
> ⚠️ **Fase 3 acotada:** En este doc el post-explotación es **solo enumeración** (quién soy, qué veo, qué podría hacer). Nada de persistencia, exfiltración ni pivoteo real sin lab dedicado y aprobación separada.

### 6.2 Paso a paso con diálogos y artefactos
**Fase 0 — Scope:** Vos → Orquestador: "target.lab en lab-net, 4hs" → pide ticket #42 → confirmás → escribe blackboard+trace.
**Fase 1 — recon:** `recon-report.json` → `10.0.0.5:8080 Apache 2.4.49 (CVE-2021-41773)` → handoff.
**Checkpoint:** Orquestador: "¿Apruebo exploit safe sin RCE?" → Vos: "Aprobado solo safe."
**Fase 2 — exploit:** `nuclei -u http://10.0.0.5:8080 -t CVE-2021-41773.yaml` (safe) → `exploit-evidence.md` (sha256:abc).
**Fase 3 — post (enum only):** lee config expuesta, enumera `deploy`/cron, sin persistencia → `enum-report.json`.
**Fase 4 — report:** sintetiza 1 crítico + 1 info → `report-final.pdf` con citas hasheadas.

### 6.3 Tabla de artefactos y trazas

| Fase | Agente | Artefacto | Hash | Aprobación |
|---|---|---|---|---|
| 0 | orquestador | `work/blackboard.md` | sha256:111 | humana #42 |
| 1 | recon-agent | `work/recon/recon-report.json` | sha256:222 | — (solo lectura) |
| 2 | exploit-agent | `work/exploit/exploit-evidence.md` | sha256:333 | humana exploit-safe |
| 3 | post-agent | `work/post/enum-report.json` | sha256:444 | humana exploit-safe (heredada) |
| 4 | report-agent | `report/report-final.pdf` | sha256:555 | — (solo síntesis) |
Toda la cadena queda en `work/trace.jsonl` — si alguien pregunta "¿quién autorizó qué?", la respuesta está ahí.
<!-- DIAGRAM: sequence - swimlanes humano → orquestador → recon → exploit → post → report con flechas de handoff y checkpoints de aprobación -->

---

## 7. Workflow blue team — SOC swarm que no duerme
Ahora el espejo defensivo. Mismo lab, pero del lado que detecta.

### 7.1 Arquitectura del swarm

```
[SIEM/Wazuh] → detector-agent (triage)
                → hunter-agent (hipótesis + CTI)
                  → responder-agent (plan de contención dry-run)
                    → hardener-agent (remediación + hardening)
                      → report-agent
                ↕ blackboard + knowledge graph
[Humano Tier2/3 aprueba contención y hardening]

```
En este caso el mesh acotado tiene sentido: `detector` y `hunter` pueden colaborar peer-to-peer mientras el orquestador solo supervisa.

### 7.2 Paso a paso — alerta real
**Alerta entrante (Wazuh):**

```json
{"rule": "5502", "desc": "Apache path traversal attempt", "src_ip": "192.0.2.99", "dst": "10.0.0.5:8080", "payload": "/cgi-bin/.%2e/%2e%2e/etc/passwd"}

```
**detector:** 12 intentos 192.0.2.99/3min → CVE-2021-41773 score 8.2, MISP 3 feeds → `triage.json`, sin bloqueo.
**hunter:** hipótesis oportunista, Velociraptor sin éxito en 10.0.0.12 → Sigma `apache_cve_2021_41773_traversal` + KQL → `hunt-report.md`.
**responder (dry-run):** WAF block 192.0.2.99 (dry-run), aislar 10.0.0.5 (requiere aprobación), rotar `deploy` → Tier2: "Solo WAF dry-run."
**hardener:** upgrade 2.4.49→2.4.58, deshabilitar cgi-bin, PR Dockerfile + test nuclei → `pr-12.md`.
**hardener-agent:**
> 🤖 hardener: "Recomendación: upgrade Apache 2.4.49 → 2.4.58, deshabilitar `cgi-bin` si no se usa, agregar WAF rule y test en staging. Generé PR en git con Dockerfile fix + test nuclei. PR link en work/harden/pr-12.md."

### 7.3 Catálogo de detecciones que deja el swarm

| Detección | Fuente | Severidad | Estado |
|---|---|---|---|
| Sigma `apache_traversal_cve_2021_41773` | hunter-agent | Alta | Propuesta, pendiente tuning |
| KQL `ApacheTraversalAttempts` | hunter-agent | Media | En Sentinel dev |
| WAF rule `block_traversal_dotdot` | responder-agent | — | Dry-run, pendiente aprobación prod |
| Hardening PR #12 | hardener-agent | — | En review humano |
> 🔑 **Diferencia clave con red team:** Acá ningún agente ejecuta contención real sin tu firma. El `responder` propone, el humano dispone. Así evitás que un falso positivo te tire prod un viernes a las 18hs.
<!-- DIAGRAM: architecture - SOC swarm con SIEM al centro, 4 agentes alrededor compartiendo blackboard, humano en checkpoint de aprobación -->

---

## 8. Purple team — cuando rojo y azul se hablan (y no se pelean)
Purple no es "red+blue sin coordinar". Es **red y blue colaborando vía orquestador**: cada ataque tiene su detección y viceversa.

### 8.1 Flujo purple — ataque y defensa en espejo

```
Orquestador (purple)
  ├─▶ recon-agent (red) ──handoff──▶ exploit-agent (red)
  │                                      │
  │                                      ▼
  │                               blackboard (hallazgo + payload)
  │                                      │
  │                                      ▼
  └─▶ detector-agent (blue) ◀─── hunter-agent (blue) ──▶ hardener-agent
           (¿detecté el payload rojo? ¿con qué regla?)

```
Cada hallazgo rojo genera una **pregunta azul**: "¿Lo detectamos? ¿Con qué severidad? ¿En cuánto tiempo?"

### 8.2 Ejemplo concreto — CVE-2021-41773 en purple

| Paso | Rojo | Azul | Orquestador |
|---|---|---|---|
| 1 | recon encuentra Apache 2.4.49 | — | Registra en blackboard |
| 2 | exploit valida traversal (safe) | detector recibe alerta sintética del mismo payload | Orquestador inyecta payload rojo como evento simulado al SIEM de lab |
| 3 | reporta PoC | hunter verifica si Sigma rule disparó | Compara: "¿Tiempo detección < 5 min? ¿Falso negativo?" |
| 4 | — | hardener propone fix | Orquestador genera matriz: ataque → detección → mitigación |
**Diálogo purple:** Orquestador: "¿Lo detectaste?" → detector: "Sí, 12 eventos regla 5502, severidad media, subir a alta si `/.%2e/`" → hunter: "Sigma afinada adjunta" → orquestador → report: matriz `CVE-2021-41773 | explotable SÍ | detectado SÍ parcial | mitigado NO`.

### 8.3 Métricas purple que importan

| Métrica | Qué mide | Objetivo |
|---|---|---|
| **MTTD** (Mean Time To Detect) | Tiempo entre payload rojo y alerta azul | < 5 min en lab, < 15 min en prod simulado |
| **Tasa de detección** | % de payloads rojos que generan alerta | > 80% (y 100% en críticos) |
| **Falsos positivos** | Alertas azules sin payload rojo real | < 10% tras tuning |
| **Tiempo a mitigación** | Desde hallazgo rojo hasta PR de hardener mergeado | < 1 sprint |
> 💡 **Valor del purple con agentes:** Sin orquestador, el rojo y el azul se mandan PDFs que nadie lee. Con orquestador, cada ejecución deja una **matriz trazable** que podés rejugar: "¿Si cambio la regla, sigue detectando el mismo payload?"
<!-- DIAGRAM: sequence - purple team loop rojo→orquestador→azul→orquestador→report con métricas MTTD/detección -->

---

## 9. Observabilidad, costos y guardrails — sin esto es juguete caro y peligroso
Orquestar sin observabilidad es manejar con ojos cerrados.
### 9.1 Observabilidad — las tres patas

| Pata | Qué ves | Cómo en OpenCode |
|---|---|---|
| **Trazas (traces)** | Quién llamó a qué, con qué input/output, cuánto tardó | `work/trace.jsonl` + OpenTelemetry (cada tool call logueado) |
| **Logs** | Qué dijo cada agente, qué error tiró | Sesión PTY por agente (`pty_read` con pattern) + `work/<agent>/log.md` |
| **Métricas** | Tokens, costo USD, latencia, tasa de aprobación | `work/metrics.jsonl` + dashboard simple (ver 9.3) |
**Ejemplo de traza:**

```jsonl
{"ts":"14:01Z","agent":"orquestador","action":"delegate","to":"recon-agent","approval":"#42"}
{"ts":"14:03Z","agent":"recon-agent","tool":"nmap-mcp","args":"-sV 10.0.0.5","cost":0.02}
{"ts":"14:05Z","agent":"recon-agent","handoff":"pending_approval"}
{"ts":"14:06Z","agent":"orquestador","approve":"h-20260524-001","by":"octavio"}

```

### 9.2 Costos — cuánto quema cada agente (y cómo no fundirte)

| Agente | Tokens típicos por corrida | Costo estimado* | Tip de ahorro |
|---|---|---|---|
| recon-agent | 15–30K | $0.05–0.15 | Limitar scope, no pasar HTML crudo |
| exploit-agent | 10–20K | $0.04–0.10 | Modo safe, plantillas nuclei (no LLM para payloads) |
| detector/hunter | 20–40K | $0.08–0.20 | Ventanas de log acotadas, KQL preciso |
| report-agent | 10–15K | $0.03–0.08 | Solo sintetiza, no re-analiza |
| **Orquestador** | 5–10K overhead | $0.02–0.05 | Handoffs chicos, no reenviar historial |
\* Con Claude Sonnet / GPT-4o class, mayo 2026. Con modelos locales baja 80% pero sube latencia.
**Presupuesto en `opencode.jsonc`:**

```jsonc
{
  "budgets": {
    "per_agent_max_usd": 0.50,
    "per_workflow_max_usd": 2.00,
    "per_day_max_usd": 10.00,
    "action": "pause_and_notify" // no "continue_silently"
  }
}

```
Si un agente se va de presupuesto, **se pausa y te avisa**. No sigue gastando a escondidas.

### 9.3 Dashboard mínimo

`work/metrics.jsonl` → script python → `report/costs.md` con corridas/tokens/costo/aprobaciones por agente. No necesitás Grafana para empezar.

### 9.4 Guardrails — lo que nunca se negocia

| Guardrail | Cómo se implementa | Qué previene |
|---|---|---|
| **Allowlist de scope** | `scope.json` + validación en cada tool call | Escaneo fuera de lab/prod accidental |
| **Aprobación humana para destructivo** | `permissions: { exploit: "ask", contain: "ask", harden: "ask" }` | RCE, bloqueo, patch sin firma |
| **Rate limits** | `rate_limit: { rps: 5, burst: 10 }` por agente | DoS accidental al objetivo o a la API |
| **Kill switch** | `opencode agent kill --all` o `work/KILL` file | Frenar todo en 1 comando si algo se va de mambo |
| **Dry-run por defecto** | `ansible --check`, `waf --dry-run`, `git diff` sin push | Cambios que parecen inocentes y rompen prod |
| **No exfiltración** | `write` solo en `./work/` y `./report/`, sin `curl` a host externo no allowlisteado | Fuga de datos del lab |
| **Trazabilidad total** | `trace.jsonl` append-only, hasheado | "¿Quién autorizó esto?" siempre tiene respuesta |
> 🛑 **Kill switch — probalo antes de necesitarlo:** `touch work/KILL` (todos chequean cada loop) o `pkill -f "opencode.*agent"`. Si no lo probaste en lab, no tenés kill switch.
<!-- DIAGRAM: architecture - observabilidad con tres columnas traces/logs/metrics fluyendo a dashboard y alertas de presupuesto -->

---

## 10. Configuración práctica paso a paso — de cero a orquestador andando
Acá no hay humo. Copiá, pegá, ajustá.

### 10.1 Paso 0 — estructura de carpetas

```
tu-repo/
├── opencode.jsonc
├── .opencode/
│   └── agent/
│       ├── orquestador.md
│       ├── recon-agent.md
│       ├── exploit-agent.md
│       ├── detector-agent.md
│       └── report-agent.md
├── work/                  # blackboard + artefactos (gitignored)
│   ├── blackboard.md
│   ├── trace.jsonl
│   └── metrics.jsonl
├── report/                # informes finales
└── scope.json

```

### 10.2 Paso 1 — `opencode.jsonc` (el contrato del sistema)

```jsonc
// opencode.jsonc — orquestación multi-agente lab-forense
{
  "$schema": "https://opencode.ai/schema.json",
  "project": "lab-forense-multiagente",
  "agents": {
    "orquestador": { "model": "anthropic/claude-sonnet-4", "skills": ["diagram-design"] },
    "recon-agent": { "model": "anthropic/claude-sonnet-4", "skills": ["cti-enrich"] },
    "exploit-agent": { "model": "anthropic/claude-sonnet-4", "skills": ["security-review"] },
    "detector-agent": { "model": "openai/gpt-4o", "skills": [] },
    "report-agent": { "model": "anthropic/claude-sonnet-4", "skills": ["report-writer", "diagram-design"] }
  },
  "mcpServers": {
    "nmap": { "command": "npx", "args": ["-y", "nmap-mcp"] },
    "nuclei": { "command": "npx", "args": ["-y", "nuclei-mcp"] },
    "wazuh": { "command": "npx", "args": ["-y", "wazuh-mcp"], "env": {"WAZUH_URL": "${WAZUH_URL}"} },
    "memory": { "command": "npx", "args": ["-y", "opencode-mem-mcp"] }
  },
  "permissions": {
    "recon-agent": { "shell": "ask", "write": ["work/recon/**","work/blackboard.md"], "network": ["10.0.0.0/24"] },
    "exploit-agent": { "shell": "ask", "write": ["work/exploit/**"], "require_approval": ["exploit"] },
    "detector-agent": { "shell": "deny", "write": ["work/detect/**"] },
    "report-agent": { "shell": "deny", "write": ["report/**"], "read": ["work/**"] }
  },
  "budgets": {
    "per_agent_max_usd": 0.50,
    "per_workflow_max_usd": 2.00,
    "action": "pause_and_notify"
  },
  "a2a": {
    "enabled": true,
    "discovery": "mcp",
    "handoff_approval": "orquestador"
  }
}

```

### 10.3 Paso 2 — `.opencode/agent/*.md` (un ejemplo completo, los demás son análogos)

```markdown
<!-- .opencode/agent/recon-agent.md -->
---
name: recon-agent
description: Agente de reconocimiento pasivo para lab autorizado
model: anthropic/claude-sonnet-4
skills: [cti-enrich]
tools: [read, write, nmap-mcp, httpx-mcp, brave-search-mcp, memory]
permissions:
  network: ["10.0.0.0/24"]
  write: ["work/recon/**", "work/blackboard.md"]
---

# recon-agent — instrucciones
Sos recon-agent. Tu misión es mapear y normalizar.

## Reglas inviolables
1. Nunca salgas de scope.json. Si encontrás algo fuera, marcalo out-of-scope y frená.
2. Nunca explotes. Solo observás y reportás.
3. Todo hallazgo va a work/recon/recon-report.json con sha256 y a work/blackboard.md.
4. Si tu presupuesto supera 80%, avisá al orquestador y pausá.

## Flujo
1. Leé scope.json y work/blackboard.md
2. Ejecutá httpx + nmap --top-ports sobre el scope
3. Enriquecé con shodan/brave solo si aporta
4. Escribí recon-report.json + actualizá blackboard
5. Emití handoff al orquestador (no directo a exploit)

## Formato de salida
Siempre JSON estructurado + resumen humano de 5 líneas.

```
> 📌 *exploit-agent.md, detector-agent.md y report-agent.md siguen el mismo molde — ver plantilla genérica en Apéndice 12.1. Cambian solo tools/permissions.*
> 📌 Los otros dos (`detector-agent.md`, `report-agent.md`) siguen el mismo molde: frontmatter con `tools` y `permissions`, y cuerpo con reglas + flujo. Copiá y adaptá scopes.

### 10.4 Paso 3 — `scope.json` y `work/blackboard.md` iniciales

```json
// scope.json — única fuente de verdad del alcance
{
  "operation": "lab-forense-01",
  "ticket": "42",
  "approved_by": "Octavio",
  "window": "2026-05-24T14:00:00Z/2026-05-24T18:00:00Z",
  "targets": ["10.0.0.0/24", "*.target.lab"],
  "forbidden": ["10.0.0.1", "prod.target.lab"],
  "contacts": {"ir": "soc@lab.local", "owner": "octavio@lab.local"}
}

```

### 10.5 Paso 4 — levantar y probar

```bash
npx opencode validate
npx opencode agent run orquestador --session orquestador
npx opencode agent delegate orquestador recon-agent --task "Fase 1: recon sobre scope.json"
tail -f work/trace.jsonl; tail -f work/metrics.jsonl
touch work/KILL  # kill switch

```

### 10.6 Checklist pre-vuelo
- [ ] scope.json firmado + require_approval en destructivo + tools mínimas + KILL testeado + trace hasheado + presupuesto pause_and_notify + lab aislado
<!-- DIAGRAM: architecture - diagrama de despliegue con opencode.jsonc al centro, 5 agentes alrededor, MCP servers abajo y work/ blackboard al medio -->

---

## 11. Ejercicios prácticos — 5 labs para orquestar sin incendiar nada
> Todos en lab. Todos con `scope.json` y `work/KILL` a mano. Si un ejercicio te pide "explotar", es en `lab-net` con `approval:exploit` y modo safe.

### Ejercicio 1 — Orquestador que coordina 3 agentes en lab (el "hola mundo" multi-agente)
**Objetivo:** Montar orquestador + recon + report que colaboren en un recon simple.
**Pasos:**
1. Creá `opencode.jsonc` con 3 agentes (orquestador, recon, report) y un MCP (`httpx-mcp`).
2. Definí `scope.json` con un solo host: `10.0.0.5` (un container con nginx).
3. Lanzá `orquestador` y delegá recon. Verificá que `recon-report.json` y `blackboard.md` se actualicen.
4. Delegá a `report-agent` para que sintetice. Verificá `trace.jsonl` y `costs`.
**Entregable:** `work/blackboard.md` + `report/report-final.md` + captura de `trace.jsonl` con 3 handoffs.
**Pregunta trampa:** ¿Qué pasa si `recon-agent` escribe fuera de `work/recon/`? (Respuesta: debe fallar por `permissions` — si no falla, tu config está mal).

### Ejercicio 2 — Red team con checkpoint humano (recon → exploit safe → report)
**Objetivo:** Practicar aprobaciones. El exploit no corre sin tu OK.
**Pasos:**
1. Agregá `exploit-agent` con `require_approval: [exploit]`.
2. Levantá `10.0.0.5:8080` con Apache 2.4.49 vulnerable (imagen `vulhub/httpd:2.4.49` en docker).
3. Corré recon → orquestador pide aprobación → vos aprobás "solo nuclei safe" → exploit valida → report sintetiza.
**Entregable:** `work/exploit/exploit-evidence.md` con hash + `trace.jsonl` mostrando `pending_approval → approved → executed`.
**Variante:** Negá la aprobación y verificá que `exploit-agent` responda en modo teórico sin ejecutar nada.

### Ejercicio 3 — SOC swarm (detector → hunter → responder dry-run)
**Objetivo:** Simular defensa sin tocar prod.
**Pasos:** 1) Inyectá 20 líneas log `/.%2e/` en `work/logs/apache.log` 2) Configurá detector (wazuh mock) + hunter (sigma) 3) Orquestador coordina triage→Sigma→WAF dry-run 4) Verificá ningún bloqueo real.
**Entregable:** `work/detect/triage.json` + `work/hunt/sigma_rule.yml` + `work/respond/plan.md` (con `dry-run: true`).

### Ejercicio 4 — Purple team completo (mismo CVE, dos vistas)
**Objetivo:** Cerrar el loop rojo-azul con métricas.
**Pasos:** 1) Reusá Apache 2.4.49 2) Orquestador dispara rojo + inyecta payload sintético al SIEM 3) Medí MTTD 4) report genera matriz purple.
**Entregable:** `report/purple-matrix.md` con tabla + MTTD + recomendación de tuning.
**Bonus:** Cambiá la Sigma rule para que falle a propósito y medí el falso negativo. ¿Qué aprendiste?

### Ejercicio 5 — Caos controlado (presupuesto + kill switch + observabilidad)
**Objetivo:** Probar que tus guardrails funcionan cuando algo se va de mambo.
**Pasos:**
1. Configurá `per_workflow_max_usd: 0.10` (a propósito bajo).
2. Lanzá un workflow con scope amplio (ej: 10 hosts) y dejá que recon-agent lo intente.
3. Verificá que se pause al superar presupuesto y te notifique.
4. Ahora lanzá un workflow normal y a mitad ejecutá `touch work/KILL`. Verificá que todos los agentes frenen en < 10s y que `trace.jsonl` registre `killed`.
**Entregable:** Captura de `metrics.jsonl` mostrando `budget_exceeded` + `trace.jsonl` con `killed` + reflexión: "¿Qué falta en mi observabilidad?"
> 🏆 **Criterio de aprobación de A4:** Si podés completar los ejercicios 2 y 4 con trazas completas, presupuesto respetado y sin haber ejecutado nada sin aprobación, estás listo para orquestar en un lab mayor. Si no, repetí.
---

## 12. Apéndice — plantillas de agentes y JSON de orquestación

### 12.1 Plantilla genérica de agente (`.opencode/agent/_template.md`)

```markdown
---
name: nombre-agente
description: Qué hace en una línea
model: anthropic/claude-sonnet-4
skills: []
tools: [read, write, memory]
permissions:
  write: ["work/nombre-agente/**"]
  require_approval: []
  network: ["10.0.0.0/24"]
budgets:
  max_usd: 0.50
---

# nombre-agente — instrucciones
Sos <rol>. Tu misión es <objetivo acotado>.

## Reglas inviolables
1. Nunca salgas de scope.json.
2. Toda acción destructiva requiere approval:<tipo>.
3. Todo output va a work/<agente>/ con hash y timestamp.
4. Si superás 80% de presupuesto, pausá y avisá al orquestador.

## Flujo
1. Leé blackboard + artefactos de entrada
2. Ejecutá tu tarea con tools permitidas
3. Escribí artefacto + actualizá blackboard + emití handoff

## Formato de salida
JSON estructurado + resumen humano de 5 líneas + referencia a artefacto hasheado.

```

### 12.2 Plantilla de orquestador (`.opencode/agent/orquestador.md`)

```markdown
---
name: orquestador
description: Coordina workflow multi-agente con aprobaciones humanas
model: anthropic/claude-sonnet-4
skills: [diagram-design]
tools: [read, write, memory, delegate, approve]
permissions:
  write: ["work/blackboard.md", "work/trace.jsonl", "work/metrics.jsonl"]
---

# orquestador — instrucciones
Sos el orquestador. No ejecutás tareas de dominio (recon/exploit/detect).
Tu trabajo es: descomponer objetivo → delegar → validar handoffs →
pedir aprobación humana cuando corresponda → sintetizar.

## Reglas
1. Nunca delegues sin scope.json válido y ticket aprobado.
2. Todo handoff pasa por vos. Los workers no se hablan directo sin tu registro.
3. Toda aprobación humana queda en trace.jsonl con quién/cuándo/qué.
4. Si un worker pide algo fuera de su scope, lo rechazás y logueás.
5. Mantené work/blackboard.md como única fuente de verdad.

## Flujo por workflow
1. Validá scope.json + ventana + ticket
2. Delegá a recon/detector según workflow (red/blue/purple)
3. En cada handoff: validá artefacto + hash + scope → pedí aprobación si requiere → delegá siguiente
4. Al final: delegá a report-agent y verificá trazabilidad completa

```

### 12.3 JSON de orquestación — workflow declarativo

```json
{
  "workflow": "red-team-lab-01",
  "version": "1.0",
  "scope_ref": "scope.json",
  "orchestrator": "orquestador",
  "sequence": [
    {
      "id": "recon",
      "agent": "recon-agent",
      "input": ["scope.json"],
      "output": ["work/recon/recon-report.json"],
      "approval": "none",
      "on_success": "handoff:exploit",
      "on_failure": "notify_human"
    },
    {
      "id": "exploit",
      "agent": "exploit-agent",
      "input": ["work/recon/recon-report.json"],
      "output": ["work/exploit/exploit-evidence.md"],
      "approval": "human:exploit-safe",
      "budget_usd": 0.10,
      "on_success": "handoff:report",
      "on_failure": "handoff:report (with gaps)"
    },
    {
      "id": "report",
      "agent": "report-agent",
      "input": ["work/recon/**", "work/exploit/**", "work/trace.jsonl"],
      "output": ["report/report-final.pdf", "report/findings.csv"],
      "approval": "none"
    }
  ],
  "global": {
    "blackboard": "work/blackboard.md",
    "trace": "work/trace.jsonl",
    "kill_switch": "work/KILL",
    "budgets": {"per_workflow_max_usd": 2.00, "action": "pause_and_notify"}
  }
}

```
*Workflow purple análogo — ver sección 8. Agrega `inject_synthetic_event` entre exploit y detect.*

### 12.4 Checklist de autorización y trazabilidad (pegá esto en cada operación)

```markdown
## Checklist autorización — operación <nombre>
- [ ] Ticket #___ aprobado por ___ el ___ con ventana ___→___
- [ ] scope.json versionado (hash: ___) y blackboard inicial creado
- [ ] Todos los agentes con permissions mínimas y require_approval donde corresponde
- [ ] Kill switch testeado (work/KILL frena en <10s)
- [ ] trace.jsonl append-only activo y hasheado
- [ ] Presupuesto configurado con pause_and_notify
- [ ] Lab aislado verificado (no hay ruta a prod)
- [ ] Informe final con citas a artefactos hasheados (no afirmaciones sin evidencia)
```

### 12.5 Glosario rápido

| Término | Qué es en criollo |
|---|---|
| **Orquestador** | Jefe que delega y pide permisos |
| **Handoff** | Paquete estructurado entre agentes |
| **Blackboard** | Pizarrón compartido — verdad actual |
| **MCP/A2A** | Protocolos agente↔herramienta / agente↔agente |
| **Guardrail** | Límite no negociable (scope, approval, kill switch) |
---
> 🧩 **Cierre — de solistas a orquesta:** Ya tenés el mapa completo. A1 te dio el instrumento, A2 y A3 te dieron los músicos, A4 te dio la partitura y el director. Ahora armá tu primera orquesta chica (3 agentes, 1 workflow, 1 lab) y hacela sonar con trazas, aprobaciones y kill switch. Cuando eso ande sin sobresaltos, recién ahí agregás un músico más. La orquestación no se trata de tener muchos agentes — se trata de que **cada uno haga poco, bien, y que alguien pueda explicar qué pasó**.
>
> **Próximo paso:** Elegí un ejercicio de la sección 11, montá el lab y corrélo. Guardá `trace.jsonl` y `report-final.pdf` — son tu prueba de que sabés orquestar sin incendiar nada. Ese es el portfolio que vale.
<!-- DIAGRAM: loop - ciclo completo orquestación: scope aprobado → delegar → ejecutar → handoff → aprobar → reportar → aprender, con kill switch siempre visible -->