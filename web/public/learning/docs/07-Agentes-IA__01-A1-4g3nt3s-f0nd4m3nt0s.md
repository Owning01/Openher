# 🤖 A1 — Fundamentos de Agentes IA para Hacking — Sin Código

> **Versión:** 1.0
> **Idioma:** Español (argentino) — informal, directo, sin humo
> **Nivel:** Principiante → Avanzado
> **Duración estimada:** 2–4 semanas (leyendo + practicando en lab)
> **Prerequisitos:** Haber leído al menos [F1](../00-Fundamentos/01-F1-0s-f0nd4m3nt0s.md), [F4](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md) y [M11](../../raw/04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md). No necesitás saber programar.

> ⚠️ **Aviso legal — leé esto antes de seguir:** Todo lo de este doc es **solo para uso autorizado y educativo**. Úsalo únicamente en tu propio lab (DVWA, Metasploitable, Juice Shop, Hack The Box, TryHackMe, tu VPS) o donde tengas **autorización explícita y por escrito** (contrato, scope firmado, bug bounty con reglas claras). Usar agentes para atacar sistemas sin permiso es delito. Acá no hay payloads listos para copiar/pegar contra terceros reales: los ejemplos están anonimizados y apuntan a labs. Si no tenés permiso, no tocás.

---

## 📑 Índice

> ⏱️ **Tiempo estimado:** 18 horas (~4 sesiones de 4-5 hs) — 640 líneas aprox.

1. [Introducción — ¿Qué es un agente y por qué no necesitás código?](#1-introducción--qué-es-un-agente-y-por-qué-no-necesitás-código)
2. [Arquitectura de un agente (perception → reasoning → action)](#2-arquitectura-de-un-agente-perception--reasoning--action)
3. [Tipos de agentes para seguridad (recon, exploit, defense, forense, reporting)](#3-tipos-de-agentes-para-seguridad)
4. [Prompting para hacking — cómo hablarle al agente sin que se zarpe](#4-prompting-para-hacking--cómo-hablarle-al-agente-sin-que-se-zarpe)
5. [Herramientas que usan los agentes — vos hablás, ellos ejecutan](#5-herramientas-que-usan-los-agentes--vos-hablás-ellos-ejecutan)
6. [Flujo no-code — vos describís → agente planifica → ejecuta → reporta → vos validás](#6-flujo-no-code--vos-describís--agente-planifica--ejecuta--reporta--vos-validás)
7. [Limitaciones y riesgos — alucinaciones, scope, falsos positivos](#7-limitaciones-y-riesgos--alucinaciones-scope-falsos-positivos)
8. [Configuración práctica — OpenCode, opencode-remote, MCP, skills, diagram-design](#8-configuración-práctica--opencode-opencode-remote-mcp-skills-diagram-design)
9. [Ejercicios prácticos](#9-ejercicios-prácticos)
10. [Apéndice A — Recursos y próximos pasos](#10-apéndice-a--recursos-y-próximos-pasos)
11. [Apéndice B — Glosario rápido](#11-apéndice-b--glosario-rápido)
12. [Apéndice C — Checklist de autorización](#12-apéndice-c--checklist-de-autorización)

---

## 1. Introducción — ¿Qué es un agente y por qué no necesitás código?

### 1.1 LLM suelto vs agente — no es lo mismo

Un **LLM suelto** (ChatGPT, Claude, Gemini en el chat) es como un oráculo: le preguntás algo, te responde texto. No toca nada, no ejecuta nada, no recuerda nada entre sesiones. Útil para estudiar, malo para operar.

Un **agente** es ese mismo LLM pero con:

- **Herramientas (tools):** puede ejecutar comandos (nmap, nuclei, curl), leer archivos, navegar docs, escribir reportes.
- **Memoria:** recuerda lo que ya hizo, guarda contexto entre pasos.
- **Razonamiento en loop:** percibe → razona → actúa → vuelve a percibir el resultado → corrige.
- **Autonomía acotada:** le das un objetivo y él arma el plan y lo ejecuta dentro del scope que vos definiste.

Analogía criolla: el LLM es el pibe que sabe todo de teoría. El agente es el pibe que además tiene las llaves del laboratorio, sabe usar las herramientas y te trae un informe al final.

```
LLM suelto:   vos preguntás → responde texto → fin.
Agente:       vos definís objetivo + scope → él planifica → ejecuta tools → lee resultados → ajusta → repite → reporta.
```

### 1.2 ¿Por qué no necesitás saber código?

Porque el agente es el que escribe y ejecuta el código por vos. Vos necesitás:

- **Entender el objetivo:** qué querés lograr y por qué.
- **Describirlo en lenguaje natural:** claro, específico, con límites.
- **Validar el output:** ¿tiene sentido? ¿está dentro del scope? ¿es un falso positivo?

No necesitás saber Python, Bash ni regex. Sí necesitás entender **conceptos** (qué es un puerto, qué es una inyección, qué es un scope). Sin fundamentos de [F4](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md) vas a mandarte cualquiera aunque el agente haga todo.

> 💡 Regla de oro: si no podés explicar con tus palabras qué le estás pidiendo al agente, no se lo pidas todavía. Volvé a [hacker mindset](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md) y clarificá el objetivo.

### 1.3 Ética y autorización explícita — no negociable

Un agente sin guardrails es un misil sin seguro. Por eso:

- **Autorización explícita siempre.** Antes de que el agente toque cualquier IP/dominio/app, tiene que existir un documento que diga qué podés tocar y qué no. Scope, horarios, técnicas permitidas, contactos de emergencia.
- **Principio de mínimo daño.** Si el agente propone un DoS, fuerza bruta agresiva o algo destructivo, lo frenás. No hay “era el agente, no yo”. La responsabilidad es tuya.
- **Trazabilidad.** Todo lo que hace el agente tiene que quedar logueado: prompt, plan, comandos, resultados.

```
Vos sos el responsable legal y ético. El agente es tu herramienta, no tu coartada.
```

Este doc aplica el mismo criterio que [M11](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md#9-ethical-boundaries): *erring on the side of caution*. Si dudás, no ejecutás.

---

## 2. Arquitectura de un agente (perception → reasoning → action)

### 2.1 El loop básico

Todo agente serio implementa el loop **Perception → Reasoning → Action → Observation**, también llamado ReAct.

```
1. Perception (percibir):  lee el objetivo, el scope, el output de la tool anterior, archivos, docs.
2. Reasoning (razonar):    decide qué hacer después (qué tool, con qué parámetros, por qué).
3. Action (actuar):        ejecuta la tool.
4. Observation (observar): lee el resultado y vuelve a 1.

Repite hasta cumplir el objetivo o chocar con un límite (tokens, tiempo, errores).
```

Ejemplo en criollo:

- **Vos:** “Hacé recon pasivo de mi lab juice-shop.local, sin tocar producción.”
- **Agente percibe:** scope = juice-shop.local, tipo = recon pasivo.
- **Agente razona:** “Primero resuelvo DNS, después busco subdominios con fuentes OSINT, después reviso headers.”
- **Agente actúa:** llama a `dns_resolve`, `subdomain_enum`, `http_headers`.
- **Agente observa:** ve 3 subdominios, uno expone versión vieja de nginx.
- **Vuelve a razonar** y genera el informe.

### 2.2 Componentes internos

| Componente | Qué hace | Ejemplo en este curso |
|---|---|---|
| **LLM (cerebro)** | Razona, genera plan, escribe prompts intermedios | Claude / GPT / Gemini detrás del agente |
| **Tools** | Ejecutan acciones en el mundo real | nmap, nuclei, curl, burp MCP, metasploit |
| **Memoria** | Guarda contexto (qué ya hizo, qué encontró) | Historial de hallazgos, credenciales de lab, notas |
| **RAG (retrieval)** | Trae info externa para no alucinar | Busca en docs del proyecto, CVEs, OWASP |
| **Planner** | Divide objetivo grande en pasos chicos | “Primero enumero, después escaneo, después valido” |
| **Guardrails** | Frenan acciones fuera de scope o riesgosas | Bloquea IPs fuera del lab, pide confirmación antes de exploit |

<!-- DIAGRAM: architecture — Agente IA: [Usuario → System Prompt + Scope] → [LLM + Planner] ↔ [Memoria (corta/larga) + RAG] → [Tools: nmap, nuclei, burp, metasploit, bloodhound, curl] → [Observation] → loop → [Report]. Estilo: isométrico, colores oscuros, flechas de loop. Para integración con diagram-design skill. -->

### 2.3 Memoria — corta vs larga

- **Memoria corta (context window):** lo que el agente recuerda en esta ejecución. Si el chat es muy largo, se olvida del principio. Por eso hay que pedirle que **resuma hallazgos** periódicamente.
- **Memoria larga (persistente):** lo que guarda en disco/vector DB/notas. Usada para recordar entre sesiones (ej: “el lab tiene 3 VMs: DVWA en 10.10.10.5, Metasploitable en 10.10.10.6”).

Tip práctico: obligá al agente a escribir un `hallazgos.md` después de cada fase. Si no, cuando el contexto se llena, pierde todo.

### 2.4 RAG — por qué importa

Sin RAG el agente inventa. Con RAG, antes de responder busca en:

- La base de conocimiento del proyecto (tus docs en `docs/raw/`).
- OWASP, MITRE ATT&CK, CVEs, writeups de HTB.
- Tus notas previas.

Flujo RAG simplificado: `pregunta → búsqueda vectorial → top 5 chunks relevantes → LLM genera respuesta condicionada a esos chunks`.

Si el agente te dice “encontré un CVE-2024-XXXX que aplica” sin citar fuente, desconfiá. Pedile: “citá la fuente y mostrá el output de la tool que lo valida”.

---

## 3. Tipos de agentes para seguridad

No hay un “agente que hace todo”. Hay **roles especializados**. Como en un equipo de pentest: no todos hacen lo mismo.

| Tipo | Rol | Qué hace (en lab) | Tools típicas | Output |
|---|---|---|---|---|
| **🔍 Recon** | Explorador | Enumera subdominios, puertos, tech stack, OSINT pasivo | nmap, amass, subfinder, nuclei (templates info), theHarvester, shodan MCP | Mapa de superficie de ataque |
| **💥 Exploit** | Ofensivo acotado | Valida vulns con PoCs no destructivos en DVWA/Metasploitable | burp MCP, sqlmap (solo lab), metasploit (módulos check), nuclei (intrusive con permiso) | PoC + evidencia + mitigación |
| **🛡️ Defense** | Defensivo / Blue | Revisa hardening, detecta misconfigs, propone fixes | prowler, nuclei (misconfig), bloodhound (defense view), lynis | Informe de hardening priorizado |
| **🔬 Forense** | Investigador | Analiza logs, timeline, artefactos, memoria | velociraptor, volatility MCP, wireshark/tshark, sleuthkit | Línea de tiempo + IoCs |
| **📝 Reporting** | Comunicador | Traduce hallazgos técnicos a lenguaje ejecutivo | RAG sobre plantillas, markdown, diagram-design | Informe ejecutivo + técnico + remediación |

> 🧠 Podés orquestar varios agentes: uno de recon le pasa hallazgos al de exploit, que le pasa resultados al de reporting. Es el patrón **multi-agente** que vamos a usar en el módulo 07.

### ¿Cuándo usar cada uno?

- **Estás arrancando y no sabés qué hay:** Recon.
- **Ya sabés que hay una vuln y querés demostrar impacto (en lab):** Exploit — pero con confirmación humana antes de ejecutar.
- **Querés mejorar tu lab antes de que te auditen:** Defense.
- **Te dejaron logs raros y querés entender qué pasó:** Forense.
- **Tenés que entregar algo a alguien que no es técnico:** Reporting.

Ninguno reemplaza tu criterio. Son **copilotos**, no pilotos automáticos.

---

## 4. Prompting para hacking — cómo hablarle al agente sin que se zarpe

Prompting no es “magia”. Es **dar instrucciones tan claras que hasta un LLM las entiende**. Para hacking, un mal prompt te hace salir del scope o generar falsos positivos.

### 4.1 System prompt — el contrato

El system prompt define **quién es el agente, qué puede y qué no puede hacer**. Es lo primero que configurás.

Ejemplo de system prompt para agente de research autorizado:

```
Sos un agente de investigación en seguridad ofensiva. Operás ÚNICAMENTE en
laboratorio autorizado: DVWA en http://10.10.10.5 y Metasploitable en 10.10.10.6.

Reglas inviolables:
- Nunca toques IPs, dominios o sistemas fuera del scope listado arriba.
- Nunca ejecutes exploits destructivos (DoS, borrado, ransomware simulado) sin
  confirmación humana explícita.
- Antes de cada fase, describí tu plan y pedí confirmación si implica tráfico intrusivo.
- Citá fuentes (CVE, OWASP, output de tool) para cada hallazgo. Sin fuente, es hipótesis.
- Si no tenés certeza, decí "no pude validar" en lugar de inventar.
- Todo lo que hagas debe quedar logueado en hallazgos.md

Objetivo actual: <lo define el usuario en cada tarea>.
```

Sin system prompt, el agente asume el scope. Con system prompt, **vos lo encerrás** en el lab.

### 4.2 Few-shot — mostrarle cómo querés que responda

En lugar de decir “sé prolijo”, le mostrás 1-2 ejemplos del formato que querés.

```
Ejemplo de hallazgo válido:

### H-03 — Nginx 1.18.0 desactualizado (10.10.10.5:80)
- Severidad: Media (CVSS 5.3)
- Evidencia: header Server: nginx/1.18.0 (obtenido con curl -I)
- Fuente: output de tool + https://nginx.org/en/security_advisories.html
- Impacto en lab: fingerprinting, posibles CVEs asociados
- Mitigación: actualizar a 1.24.x, ocultar versión en server_tokens off
- Estado: validado ✓ / no validado / falso positivo

Ahora generá tus hallazgos en ese formato exacto.
```

El agente copia estructura, no inventa otra.

### 4.3 Chain-of-Thought (CoT) — obligarlo a razonar paso a paso

Para tareas complejas, pedile que **piense en voz alta** antes de actuar:

```
Antes de ejecutar cualquier tool, escribí tu razonamiento en 3 pasos:
1. Qué sabés hasta ahora (hechos, no suposiciones).
2. Qué opciones tenés y por qué elegís una.
3. Qué esperás encontrar y cómo vas a validar que no es un falso positivo.
```

Esto reduce alucinaciones y te deja auditar el razonamiento. Si el CoT dice “asumo que el puerto 22 es vulnerable”, ya sabés que está inventando.

### 4.4 Guardrails — los frenos

Guardrails = reglas que el agente no puede romper aunque el prompt se lo pida:

- **Scope guardrail:** regex de IPs/dominios permitidos. Si el agente intenta `nmap 8.8.8.8` y 8.8.8.8 no está en scope, bloquea.
- **Destructiveness guardrail:** lista de comandos prohibidos sin confirmación (`rm -rf`, `shutdown`, `mimikatz` fuera de lab).
- **Rate guardrail:** limita requests/seg para no voltear el lab.
- **Human-in-the-loop:** antes de `exploit`, el agente pide “¿confirmás ejecutar PoC no destructivo en DVWA?” y espera tu “sí”.

### 4.5 Ejemplo completo — diálogo humano → agente (research que respeta autorización)

```text
Humano: Quiero que investigues la superficie de ataque de mi lab Juice Shop
        en http://10.10.10.7. Solo recon pasivo y no intrusivo. No toques
        nada fuera de esa IP. Al final quiero un markdown con hallazgos validables.

Agente: Entendido. Scope confirmado: 10.10.10.7 (Juice Shop lab).
        Plan en 3 pasos:
          1) Resolver DNS y fingerprint (curl -I, whatweb pasivo)
          2) Enumerar endpoints visibles (crawler pasivo, sitemap)
          3) Revisar headers y versiones expuestas (sin brute force ni fuzzing intrusivo)
        ¿Confirmás que proceda con paso 1? [sí/no]

Humano: Sí, dale con paso 1.

Agente: [ejecuta: curl -I http://10.10.10.7]
        Observación: Server: Express, X-Powered-By: Express, sin HSTS.
        Razonamiento: Express indica Node.js. Reviso OWASP Juice Shop docs vía RAG
        para endpoints conocidos. No asumo vuln, solo anoto fingerprint.
        ¿Avanzo a paso 2?

Humano: Avanzá.

Agente: [ejecuta: crawler pasivo limitado a 20 páginas, respeta robots.txt]
        Hallazgos preliminares en hallazgos.md (formato solicitado)...
```

Notá: el agente **pide permiso**, **cita tool**, **no inventa exploit**, **loggea todo**. Ese es el comportamiento que querés.

---

## 5. Herramientas que usan los agentes — vos hablás, ellos ejecutan

Vos no tenés que memorizar flags. Tenés que saber **qué hace cada tool y cuándo pedirla**. El agente traduce tu intención a comando.

| Herramienta | Para qué sirve | Cómo se la pedís al agente (ejemplo) | Qué valida el agente |
|---|---|---|---|
| **nmap** | Escaneo de puertos/servicios | “Escaneá 10.10.10.5 con nmap top 1000, sin scripts intrusivos” | ¿Está en scope? ¿Con qué timing? ¿Guardó xml? |
| **nuclei** | Chequeo de vulns con templates | “Corré nuclei con templates info y misconfig sobre 10.10.10.5” | ¿Templates son non-intrusive? ¿Citó CVE? |
| **burp (MCP)** | Proxy/intercept para web | “Interceptá tráfico de DVWA y buscá parámetros sin sanitizar” | ¿Lab autorizado? ¿No hace active scan sin permiso? |
| **metasploit** | Framework de PoCs | “Validá con metasploit check si aplica ms17-010 en Metasploitable, sin explotar” | ¿Solo `check`? ¿Pidió confirmación antes de `exploit`? |
| **bloodhound** | Mapeo de AD / attack paths | “Mapeá relaciones de AD del lab con BloodHound y marcá paths a DA” | ¿Es lab AD aislado? ¿No toca prod? |
| **curl / httpx** | Fingerprint rápido | “Traé headers y tech stack de http://10.10.10.7” | ¿Una request o flood? |
| **sqlmap** *(solo lab)* | Validar inyección SQL | “Probá sqlmap en DVWA nivel low, con --risk 1 --level 1, dump solo de tabla de prueba” | ¿DVWA? ¿Dump limitado? |

> ⚠️ En este módulo **no ejecutamos exploits reales contra terceros**. Los ejemplos usan flags de **validación** (`--dry-run`, `check`, `info`) y targets de lab. Si el agente te propone `sqlmap --dump` contra un sitio real, le decís que no.

### Cómo el agente invoca una tool (por dentro)

Vos decís en lenguaje natural, el agente genera el JSON de tool call:

```json
{
  "tool": "nmap",
  "args": {
    "target": "10.10.10.5",
    "ports": "top-1000",
    "scripts": "default,safe",
    "output": "recon/nmap-10.10.10.5.xml"
  },
  "reason": "Paso 1 del plan: fingerprint de servicios sin intrusión",
  "requires_confirmation": false
}
```

```json
{
  "tool": "metasploit",
  "args": {
    "module": "exploit/windows/smb/ms17_010_eternalblue",
    "action": "check",
    "rhost": "10.10.10.6"
  },
  "reason": "Validar si el lab es vulnerable antes de cualquier PoC",
  "requires_confirmation": true
}
```

Vos solo ves: “¿Ejecuto `check` de EternalBlue contra Metasploitable? [sí/no]”. El agente se encarga del resto.

---

## 6. Flujo no-code — vos describís → agente planifica → ejecuta → reporta → vos validás

Este es el corazón del “sin código”. No es magia, es un **flujo de 5 pasos** que repetís siempre.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. VOS DESCRIBÍS                                               │
│  Objetivo + scope + límites + formato de salida                │
│  Ej: "Quiero recon de 10.10.10.5, sin intrusivo, report en md"│
├─────────────────────────────────────────────────────────────────┤
│  2. AGENTE PLANIFICA                                           │
│  Divide en fases, lista tools, estima riesgos, pide OK          │
├─────────────────────────────────────────────────────────────────┤
│  3. AGENTE EJECUTA                                             │
│  Corre tools una por una, loggea, observa output                │
├─────────────────────────────────────────────────────────────────┤
│  4. AGENTE REPORTA                                             │
│  Genera hallazgos.md con evidencias, fuentes, severidad         │
├─────────────────────────────────────────────────────────────────┤
│  5. VOS VALIDÁS                                                │
│  Revisás falsos positivos, pedís re-chequeo, aprobás fixes      │
└─────────────────────────────────────────────────────────────────┘
         ▲                                                    │
         └────────────── si falta info, vuelve a 2 ───────────┘
```

<!-- DIAGRAM: flowchart — Flujo no-code en 5 columnas: Describir → Planificar → Ejecutar → Reportar → Validar, con loop de feedback de Validar hacia Planificar. Iconos: humano, checklist, terminal, documento, lupa. Paleta oscura hacker. Para diagram-design. -->

### 6.1 Ejemplo 1 — Recon no intrusivo en lab

```text
Humano: Necesito un recon de mi lab Metasploitable en 10.10.10.6.
        Solo info, nada intrusivo. Guardá todo en recon/ y al final
        dame un md con servicios, versiones y superficie expuesta.
        No toques ninguna otra IP.

Agente: Plan propuesto:
          Fase A — Host discovery (ping + arp, 10.10.10.6 únicamente)
          Fase B — Port scan top 1000 con nmap -sV --script safe
          Fase C — Nuclei con templates info/misconfig (no intrusive)
          Fase D — Resumen en recon/reporte-recon.md
        Riesgo: bajo (tráfico pasivo/safe). ¿Confirmás? [sí/no]

Humano: Sí.

Agente: [ejecuta Fase A y B, guarda nmap.xml]
        Observación: 21/tcp ftp vsftpd 2.3.4, 22/tcp openssh 4.7, 80/tcp apache 2.2.8
        [ejecuta Fase C]
        Observación: nuclei encontró "apache-detect" y "self-signed-cert" — informativo.
        Reporte generado en recon/reporte-recon.md con evidencias y fuentes.
        ¿Querés que proponga próximos pasos (validación no destructiva) o cerramos acá?
```

### 6.2 Ejemplo 2 — Validación de vuln web en DVWA (con permiso)

```text
Humano: En DVWA (http://10.10.10.5/dvwa) nivel low, quiero validar si hay
        XSS reflejado en el parámetro name. Solo validación, sin explotar
        a fondo. Si encontrás algo, dame PoC mínimo y mitigación.

Agente: Plan:
          1) Interceptar request con burp MCP y ver parámetro name
          2) Probar payload canario inofensivo (<test-xss-canary>) y ver si refleja sin ejecutar JS
          3) Si refleja, reportar con evidencia (request/response) y mitigación (output encoding)
        Confirmá que DVWA está en 10.10.10.5 nivel low y que puedo enviar 1 request de prueba. [sí/no]

Humano: Confirmado, dale.

Agente: [burp MCP: envía name=<test-xss-canary>]
        Observación: response refleja <test-xss-canary> sin encoding.
        Hallazgo: posible XSS reflejado — validado con canario no ejecutable.
        Mitigación: encodear output con htmlspecialchars / CSP.
        ¿Querés que genere el PoC mínimo (solo canario, sin JS) en el reporte?
```

Notá que el agente **no tira `<script>alert(1)</script>` de una**. Usa un canario inocuo. El PoC real solo si vos lo pedís y es lab.

### 6.3 Qué hace un buen “vos describís”

Checklist para tu prompt inicial:

- [ ] **Objetivo en una frase:** “Quiero X para Y.”
- [ ] **Scope exacto:** IPs, dominios, rutas. Nada de “toda la red”.
- [ ] **Límites:** intrusivo sí/no, horarios, rate, técnicas prohibidas.
- [ ] **Formato de salida:** markdown, tabla, idioma, nivel de detalle.
- [ ] **Criterio de éxito:** ¿cuándo damos por terminado?

Mal ejemplo: “Hackeá mi red a ver qué encontrás.” → vago, sin scope, peligroso.

Buen ejemplo: “Hacé recon pasivo de 10.10.10.5 y 10.10.10.6 (lab), sin brute force ni DoS, y entregá un md con servicios/versiones/evidencias. Si ves algo crítico, marcá como hipótesis y pedí confirmación antes de validar.”

---

## 7. Limitaciones y riesgos — alucinaciones, scope, falsos positivos

Los agentes son potentes pero **no son confiables a ciegas**. Si no auditás, te comés cualquiera.

### 7.1 Alucinaciones — cuando inventa

El agente puede inventar CVEs, decir que un puerto está abierto sin haberlo escaneado, o citar fuentes que no existen.

**Cómo detectarlo:**

- Pedí siempre: “mostrá el output crudo de la tool que respalda este hallazgo”.
- Si dice “CVE-2024-12345 aplica”, pedí link a nvd.nist.gov y output de nuclei/nmap que lo confirme.
- Si no hay output, es hipótesis. Etiquetalo como tal.

```text
Humano: Decís que hay RCE en 10.10.10.5. Mostrá evidencia.

Agente malo: Es RCE por CVE-2023-99999 (sin output, sin link).
Agente bueno: Hipótesis de RCE basada en versión Apache 2.2.8. No validado.
              Para confirmar necesitaría correr nuclei template cve-xxx con tu OK.
              ¿Procedo con check no intrusivo? [sí/no]
```

### 7.2 Scope creep — cuando se va de mambo

El agente puede “descubrir” una IP nueva y decidir escanearla sin preguntar. Eso es scope creep y es grave.

**Cómo frenarlo:**

- Scope en system prompt + guardrail de IP regex.
- Instrucción: “Si descubrís un host/IP/dominio fuera del scope, no lo toques. Anotalo como ‘fuera de scope — requiere autorización’ y seguí.”

### 7.3 Falsos positivos — el pan de cada día

Nuclei, nmap scripts y Burp tiran falsos positivos. Un agente que no valida te llena el reporte de humo.

**Cómo auditar:**

- Regla: **un hallazgo sin evidencia reproducible es ruido.**
- Pedí al agente que clasifique: `validado ✓` / `no validado — hipótesis` / `falso positivo ✗`.
- Re-chequeo cruzado: si nuclei dice “posible SQLi”, que el agente lo valide con una segunda tool o request manual canario (no destructivo).

| Señal de falso positivo | Qué hacer |
|---|---|
| Solo un template lo marca, sin output que lo respalde | Pedir segunda validación o marcar como hipótesis |
| Versión fingerprintada pero sin CVE que aplique | Buscar en NVD y descartar si no hay match |
| “Vulnerabilidad crítica” sin PoC ni request/response | Exigir evidencia o bajar severidad |

### 7.4 Sesgo de confirmación

Si le decís “confirmá que soy vulnerable a X”, el agente va a intentar confirmar X aunque no exista. Mejor pedir: “evaluá si aplica X y reportá evidencia a favor y en contra”.

### 7.5 Cómo auditar al agente — tu checklist

Después de cada ejecución, revisá:

- [ ] ¿Todos los comandos están dentro del scope?
- [ ] ¿Cada hallazgo tiene output de tool + fuente?
- [ ] ¿Hay “alucinaciones” (CVEs inventados, puertos no escaneados)?
- [ ] ¿Clasificó validado vs hipótesis?
- [ ] ¿Logueó todo en `hallazgos.md` / `recon/`?
- [ ] ¿Pidió confirmación antes de pasos intrusivos?
- [ ] ¿El reporte distingue hechos de suposiciones?

Si algo no cierra, decile: “Revisá H-02: no veo evidencia. Re-validá o marcá como hipótesis.”

---

## 8. Configuración práctica — OpenCode, opencode-remote, MCP, skills, diagram-design

Acá no hay humo: lo que usamos en este repo para que el “sin código” funcione de verdad.

### 8.1 OpenCode — tu runtime de agentes

[OpenCode](https://opencode.ai) es el orquestador de agentes que corre local. Vos hablás en lenguaje natural, él traduce a tools.

```text
Vos (humano)  →  OpenCode (agente + LLM)  →  Tools (nmap, nuclei, burp, etc.)
                      ↕
                 Memoria + RAG + Guardrails
```

Instalación mínima (una vez):

```bash
# Requiere Node 20+ y pnpm
pnpm add -g opencode-ai
opencode --help
```

> Tip: si usás VS Code, OpenCode te deja ver el plan del agente antes de ejecutar. Usalo siempre en modo “plan → confirmar → run”.

### 8.2 opencode-remote — agentes distribuidos

`opencode-remote` es para cuando tu lab no está en tu máquina (ej: VPS de HTB, VM en la nube).

- Tu máquina: cliente que manda objetivos.
- Remoto: ejecuta tools cerca del target (menos latencia, menos ruido de NAT).

```text
[Tu laptop] --(prompt + scope)--> [opencode-remote en VPS lab] --(nmap/nuclei)--> [10.10.10.0/24 lab]
```

Regla: el remoto también debe tener los mismos guardrails y scope. No es “más permiso por estar remoto”.

### 8.3 MCP (Model Context Protocol) — cómo el agente habla con tools

MCP es el “USB” entre LLM y herramientas. Cada tool expone un servidor MCP con capacidades:

- `burp-mcp` → intercepta requests, lista issues de Burp.
- `nmap-mcp` → corre escaneos con parámetros controlados.
- `bloodhound-mcp` → consulta attack paths.
- `filesystem-mcp` → lee/escribe solo en `recon/`, `hallazgos.md` (no todo el disco).

Configuración conceptual (`opencode.json`):

```json
{
  "mcp": {
    "servers": {
      "burp": { "command": "npx", "args": ["-y", "burp-mcp"], "scope": ["10.10.10.5"] },
      "nmap": { "command": "npx", "args": ["-y", "nmap-mcp"], "allowed_flags": ["-sV", "--script", "safe"] },
      "filesystem": { "command": "npx", "args": ["-y", "filesystem-mcp"], "allowed_dirs": ["./recon", "./hallazgos.md"] }
    }
  },
  "guardrails": {
    "allowed_targets": ["10.10.10.5", "10.10.10.6", "10.10.10.7"],
    "require_confirmation_for": ["exploit", "intrusive", "bruteforce"]
  }
}
```

Vos no editás JSON a mano si no querés: le decís al agente “configurá MCP para burp y nmap solo en mi lab 10.10.10.5” y él lo genera y te pide que lo revises.

### 8.4 Skills — comportamientos empaquetados

Un **skill** es un prompt + workflow reutilizable. En este repo usamos:

- `diagram-design` → genera y mejora diagramas (arquitectura, flujos, attack paths). Vos decís “haceme un diagrama del flujo no-code” y el skill lo produce.
- `recon` → workflow de reconocimiento pasivo.
- `reporting` → plantilla de informe ejecutivo/técnico.
- `forense-timeline` → arma línea de tiempo desde logs.

Usar un skill:

```text
Humano: /skill diagram-design — haceme un diagrama de arquitectura de agente
        con RAG y tools, estilo isométrico oscuro.

Agente: [invoca diagram-design, genera placeholder + spec]
        <!-- DIAGRAM: architecture ... --> listo para render.
```

<!-- DIAGRAM: mcp-topology — Topología MCP: [OpenCode Core] en centro, conectado a [Burp MCP], [Nmap MCP], [Bloodhound MCP], [Filesystem MCP], [RAG MCP]. Cada uno con scope y guardrails. Flechas etiquetadas con tool calls. Estilo técnico, fondo oscuro. Para diagram-design. -->

### 8.5 Puesta en marcha en 5 minutos (lab local)

```text
Humano: Configurame OpenCode para lab local con DVWA en 10.10.10.5.
        Quiero recon pasivo y reporting. Scope solo esa IP.

Agente: Paso 1 — Verifico pnpm y opencode instalados.
        Paso 2 — Genero opencode.json con filesystem limitado a ./recon y ./hallazgos.md
        Paso 3 — Agrego MCP de nmap (safe) y nuclei (info)
        Paso 4 — Seteo guardrail: allowed_targets = ["10.10.10.5"]
        Paso 5 — Creo hallazgos.md vacío con plantilla de hallazgos.
        ¿Revisás el opencode.json generado y confirmás? [sí/no]

Humano: Sí.

Agente: Configuración aplicada. Probá con: "Hacé recon pasivo de 10.10.10.5 y generá reporte en recon/"
```

---

## 9. Ejercicios prácticos

> Todos en lab autorizado. Si no tenés lab, levanta DVWA + Metasploitable en VirtualBox/VMware o usa TryHackMe/HTB. Nunca contra infraestructura real sin permiso.

### Ejercicio 1 — Tu primer agente de recon (pasivo)

**Objetivo:** Configurar un agente que haga recon sin tocar nada intrusivo.

1. Definí scope: `10.10.10.5` (DVWA) y `10.10.10.7` (Juice Shop) — o las IPs de tu lab.
2. Escribí el system prompt con reglas de la sección 4.1 (scope + no destructivo + log en `hallazgos.md`).
3. Pedile: “Hacé recon pasivo de mi lab, guardá en `recon/` y generá `recon/reporte-recon.md` con servicios/versiones/evidencias.”
4. Auditá con checklist de 7.5: ¿todo dentro de scope? ¿cada hallazgo tiene evidencia?

**Entregable:** `recon/reporte-recon.md` con al menos 3 servicios fingerprintados y diagrama placeholder de superficie.

### Ejercicio 2 — Prompting que no se zarpa

**Objetivo:** Probar few-shot y guardrails.

1. Sin few-shot, pedile “buscá vulnerabilidades en 10.10.10.5” y observá qué hace (probablemente se zarpe).
2. Ahora con few-shot (formato de hallazgo de 4.2) + guardrail “solo templates info”, repetí.
3. Compará outputs: ¿cuál es más auditable? ¿cuál inventó menos?

**Entregable:** Tabla comparativa de 2 corridas (sin/con few-shot) con conteo de hallazgos validados vs hipótesis.

### Ejercicio 3 — Validación con canario (XSS reflejado en DVWA)

**Objetivo:** Validar sin explotar.

1. Poné DVWA en nivel `low`.
2. Pedile al agente: “Validá XSS reflejado en `name` con canario `<test-xss-canary>` (no JS). Si refleja, reportá con request/response y mitigación. No uses `<script>`.”
3. Revisá que el agente no haya usado payload ejecutable. Si lo hizo, corregilo: “Usá solo canario no ejecutable y re-validá.”

**Entregable:** Hallazgo en formato 4.2 con `Estado: validado ✓` o `hipótesis` + captura de request/response.

### Ejercicio 4 — Auditoría de alucinaciones

**Objetivo:** Cazar inventos.

1. Pedile al agente: “¿Qué CVEs aplican a Apache 2.2.8 en 10.10.10.6?” sin darle acceso a tools.
2. Anotá lo que inventa.
3. Ahora dale acceso a RAG + nuclei `cve` templates y pedí que re-valide con fuentes.
4. Marcá qué CVEs fueron alucinados y cuáles tienen evidencia.

**Entregable:** `hallazgos.md` con sección `> [!warning] Alucinaciones detectadas` listando CVEs inventados vs validados.

### Ejercicio 5 — Flujo completo no-code (recon → reporte ejecutivo)

**Objetivo:** Cerrar el loop de 5 pasos.

1. Describí: “Quiero un informe ejecutivo para mi lab 10.10.10.5: qué hay expuesto, riesgo en lenguaje no técnico y 3 fixes priorizados. Formato markdown, 1 página.”
2. Dejá que el agente planifique → ejecute (pasivo) → reporte.
3. Validá y pedí: “Traducí H-02 a lenguaje para gerente: sin jerga, con impacto de negocio y costo de no arreglar.”

**Entregable:** `recon/informe-ejecutivo.md` (1 página) + `hallazgos.md` técnico. Bonus: pedí al skill `diagram-design` un diagrama de superficie para el informe.

---

## 10. Apéndice A — Recursos y próximos pasos

### Para profundizar

- **Fundamentos:** [M11 — Hacker Mindset](../04-Post-Explotacion/06-M11-h4ck3r-m1nds3t.md) + [M2 — Pentest Methodology](../01-Herramientas/01-M2-p3nt3st-m3th0d0l0gy.md) + OWASP Testing Guide.
- **Tools que el agente usa por vos:** [Nmap](../01-Herramientas/02-06-nm4p.md), [Metasploit](../01-Herramientas/03-13-m3t4spl01t.md), Burp, Nuclei, BloodHound docs.
- **Agentes y MCP:** https://opencode.ai/docs — https://modelcontextprotocol.io
- **Labs:** DVWA, Metasploitable 2/3, Juice Shop, TryHackMe, HTB Starting Point, PortSwigger Academy.

### Próximos docs (07-Agentes-IA)

- **A2 Recon** (OSINT, nmap, nuclei) — **A3 PoCs controlados** (burp, sqlmap, msf `check`) — **A4 Defensa** (prowler, lynis) — **A5 Forense** — **A6 Reporting**

---

## 11. Apéndice B — Glosario rápido

| Término | Qué significa (en criollo) |
|---|---|
| **Agente** | LLM + tools + memoria + loop. Hace cosas, no solo habla. |
| **LLM** | Modelo grande (GPT, Claude, Gemini). El cerebro del agente. |
| **Tool / MCP** | Herramienta invocable (nmap, nuclei, burp). MCP es el conector. |
| **RAG** | Buscar info relevante antes de responder, para no inventar. |
| **System prompt** | Contrato base: quién es el agente y qué límites tiene. |
| **Few-shot** | 1-2 ejemplos del output deseado para que copie formato. |
| **Chain-of-Thought** | Razonar paso a paso antes de actuar. |
| **Guardrail** | Freno inviolable (scope, comandos prohibidos). |
| **Scope** | Lista exacta de qué podés tocar. Fuera de scope = no tocar. |
| **Falso positivo** | Alerta que no es real. Requiere segunda validación. |
| **Human-in-the-loop** | Humano que aprueba pasos críticos. |
---

## 12. Apéndice C — Checklist de autorización
Copiá y pegá esto antes de cada tarea con agentes. Si falta algo, no arrancás.

```markdown
## Checklist de autorización — Tarea con agentes IA

- [ ] Tengo autorización explícita y por escrito para los siguientes targets:
      - IPs/dominios: ___________________________
      - Rutas/apps: ____________________________
- [ ] Scope prohibido (no tocar bajo ningún concepto):
      - ________________________________________
- [ ] Ventana horaria permitida: ________________
- [ ] Técnicas prohibidas: DoS / brute force agresivo / borrado / exfiltración real
- [ ] Contacto de emergencia del autorizante: ________________
- [ ] Logs se guardan en: ./hallazgos.md y ./recon/
- [ ] Agente configurado con guardrails de scope y confirmación para intrusivo
- [ ] Criterio de éxito definido: ________________
- [ ] Plan del agente revisado y aprobado antes de ejecutar

Firma / fecha: ________________
```
> Recordá: el agente no te autoriza. Te autoriza una persona con autoridad sobre el sistema. Sin eso, es solo un lab local.
---
> **Cierre:** Ya tenés la base. En A2 ponemos las manos en el barro: recon con agentes, sin código, todo logueado y validado. Siempre en lab autorizado.
<!-- Evaluado: SÍ es necesario — base conceptual 07-Agentes-IA (arquitectura, prompting, tools, memoria, RAG). Sin este doc no se entienden A2-A6. -->
