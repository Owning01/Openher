# Roadmap de Aprendizaje — Hacking y Seguridad Informatica

Guia definitiva de estudio: orden recomendado, prerequisitos entre modulos, y progresion de habilidades. Basado en 66 tutoriales (165,565 lineas).

---

## Como usar este roadmap

Cada nivel asume que completaste los niveles anteriores. Los tutoriales dentro de un nivel pueden hacerse en cualquier orden, pero siguen una progresion logica. Al final de cada nivel hay metas concretas que deberias poder hacer.

**Leyenda:**
- `[F1]` = Fundamental 1 (Sistemas Operativos)
- `[1]` = Modulo Principal 1 (ADB Deep Dive)
- `[M1]` = Gap Massive 1 (Python para Hacking)
- `[N1]` = Gap Medium 1 (Redes Avanzadas)
- `(p)` = Prerequisito directo
- `(r)` = Recomendado antes

---

## Nivel 0: Fundamentos Absolutos

> **Objetivo:** Tener la base solida de sistemas, redes, programacion y seguridad para entender el resto.
> **Tiempo estimado:** 2-4 semanas (dedicacion full-time)

```
[F1] Sistemas Operativos ─────────────────────────────────┐
[F2] Redes ───────────────────────────────────────────────┼──> [TODOS LOS MODULOS]
[F3] Programacion ────────────────────────────────────────┘
[F4] Seguridad Basica ────────────────────────────────────┘
```

| Tutorial | Temas clave | Por que primero |
|----------|-------------|-----------------|
| `[F1]` 0s-f0nd4m3nt0s.md | Linux: filesystem, permisos, procesos, systemd. Windows: NTFS, registro, servicios, Event Logs | Sin saber SO no entendes exploits, permisos ni servicios |
| `[F2]` r3d3s-f0nd4m3nt0s.md | OSI, TCP/IP, HTTP, DNS, sockets, puertos, firewalls | El 90% del hacking es sobre redes |
| `[F3]` pr0gr4mm1ng-f0nd4m3nt0s.md | Python, bash, C basico, PowerShell, JS, SQL | Necesitas programar para entender y crear herramientas |
| `[F4]` s3c-f0nd4m3nt0s.md | CIA triad, criptografia basica, OWASP Top 10, CVE, Kill Chain | Marco conceptual para todo lo que sigue |

**Meta del nivel:** Poder usar Linux terminal, entender un paquete TCP, escribir un script Python de 50 lineas, y explicar que es una vulnerabilidad.

---

## Nivel 1: Caja de Herramientas

> **Objetivo:** Adquirir las herramientas y metodologias fundamentales del oficio.
> **Tiempo estimado:** 4-6 semanas

```
[F1-F4] (fundamentos)
    │
    ├── [M2] Metodologias de Pentest ──── Metodologia general
    ├── [6] Nmap ──────────────────────── Escaneo de redes
    ├── [13] Metasploit ───────────────── Exploitation framework
    ├── [M1] Python para Hacking ──────── Scripting ofensivo
    └── [N2] Assembly para Hacking ────── Entender exploits en bajo nivel
```

**Orden recomendado:**

```
Paso 1: [M2] Metodologias de Pentest
  → Entender el ciclo completo (PTES, OSSTMM) antes de tocar herramientas

Paso 2: [6] Nmap
  → Herramienta #1 de reconocimiento
  → Practicar: escaneos basicos, scripts NSE, evasion

Paso 3: [N2] Assembly para Hacking
  → Entender registros, stack, shellcode, buffer overflow
  → Necesario para entender como funcionan los exploits

Paso 4: [13] Metasploit
  → Framework de explotacion
  → Practicar: modulos, payloads, meterpreter, post-explotacion basica

Paso 5: [M1] Python para Hacking
  → Scapy, sockets, automatizacion de exploits
  → Paralelo con todo lo anterior
```

**Meta del nivel:** Poder escanear una red, identificar servicios vulnerables, explotarlos con Metasploit, y escribir tus propios scripts de automatizacion.

---

## Nivel 2: Web y Aplicaciones

> **Objetivo:** Dominar las vulnerabilidades web, APIs, contraseñas y shells.
> **Tiempo estimado:** 6-8 semanas

```
[F2] Redes ──────────────────────────────┐
[F3] Programacion (JS, SQL) ─────────────┼──> [7] Web Hacking ──> [20] API Hacking
[F4] Seguridad Basica ───────────────────┘                              │
                                                                        │
[M1] Python ───> [8] Password Attacks                                   │
                  [12] Reverse Shells                                    │
                                                                        │
                                                    [N5] Report Writing
```

**Orden recomendado:**

```
Paso 1: [7] Web Hacking (3,862 lineas)
  → SQLi, XSS, LFI, SSRF, SSTI, XXE, JWT, GraphQL, HTTP smuggling
  → El modulo mas denso, tomate tu tiempo

Paso 2: [8] Password Attacks
  → Hashcat, Hydra, Kerberos attacks (AS-REP, Kerberoasting, DCSync)

Paso 3: [12] Reverse Shells y C2
  → One-liners, Msfvenom, Sliver, Havoc, C2 frameworks

Paso 4: [20] API Hacking
  → API Security Top 10, GraphQL, gRPC, JWT manipulation, Mass Assignment

Paso 5: [N5] Report Writing (opcional pero recomendado)
  → Aprender a comunicar hallazgos desde temprano
```

**Meta del nivel:** Poder hacer un pentest web completo: descubrir, explotar y reportar SQLi, XSS, SSRF, y vulnerabilidades de API.

---

## Nivel 3: Explotacion de Sistemas

> **Objetivo:** Escalar privilegios en Linux y Windows, entender su funcionamiento interno.
> **Tiempo estimado:** 6-8 semanas

```
[F1] Sistemas Operativos ──────────────────────────────────────┐
[F3] Programacion (C, ASM) ────────────────────────────────────┼──> [10] Linux Privesc
[F4] Seguridad Basica ─────────────────────────────────────────┤    [9] Windows Post-Exploit
[N2] Assembly ─────────────────────────────────────────────────┘          │
[13] Metasploit (post-exploitation modules) ──────────────────────────────┤
                                                                          │
                                     [40] Windows Internals ──────────────┤
                                                                          │
                                               [W3] Kernel Exploitation ──┘
```

**Orden recomendado:**

```
Linux path:
  [10] Linux Privesc
    → SUID, sudo, cron, capabilities, LD_PRELOAD, kernel exploits
    → Practicar en HTB Linux boxes

Windows path:
  [9] Windows Post-Exploit
    → ADCS, BloodHound, Kerberos, UAC bypass, lateral movement

  [40] Windows Internals
    → EPROCESS, Pool, PE format, Tokens, Object Manager
    → Fundamental para entender Windows en profundidad

  [W3] Kernel Exploitation / BYOVD
    → DKOM, token stealing, DSE bypass, pool exploits
    → Avanzado: requiere C y ASM solidos
```

**Meta del nivel:** Poder escalar de usuario a root en Linux y de usuario a Domain Admin en Windows usando tecnicas manuales (no solo Metasploit).

---

## Nivel 4: Post-Explotacion Avanzada

> **Objetivo:** Movimiento lateral, evasion de defensas, persistencia, dominio de entornos Windows enterprise.
> **Tiempo estimado:** 4-6 semanas

```
[9] Windows Post-Exploit ─────────────────────────────────────────┐
[40] Windows Internals ───────────────────────────────────────────┤
                                                                  │
    ├── [W2] RPC/COM/WMI Abuse ──── Movimiento lateral silencioso │
    ├── [W5] Windows Control Bypass ─── UAC/AppLocker/AMSI/Defender│
    ├── [18] EDR Evasion ──── API unhooking, direct syscalls       │
    └── [N3] Windows Domain Admin ─── AD, GPO, DFS, FSMO          │
                                                                   │
[N4] Linux Admin (LVM, LUKS, systemd) ──── Para Linux enterprise  │
                                                                   │
                                                                   v
                                                    [M11] Hacker Mindset
```

**Meta del nivel:** Poder moverte lateralmente en una red corporate, evadir EDR/AV, establecer persistencia, y entender AD en profundidad.

---

## Nivel 5: Especializacion (Elige tu camino)

> **Objetivo:** Profundizar en areas especificas segun tu interes.
> **Tiempo estimado:** 4-8 semanas por rama

```
                        ┌── [17] Cloud Hacking ──────────────────┐
                        │   [25] Identidad Hibrida / Entra ID     │
                        │   [19] DevSecOps / Supply Chain         │
     CLOUD / IDENTITY ──┤   [M5] Legal / Compliance              │
                        │   [M9] Red Team Infrastructure          │
                        └─────────────────────────────────────────┘

                        ┌── [1] ADB Deep Dive ───────────────────┐
                        │   [2] APK Reversing                    │
     MOBILE ────────────┤   [4] MITM en Moviles                  │
                        │   [M6] iOS Pentesting                  │
                        └─────────────────────────────────────────┘

                        ┌── [16] IA Hacking ────────────────────┐
                        │   [29] IA Phishing Avanzado            │
     IA / ADVERSARIAL ──┤   [37] Adversarial ML                 │
                        │   [38] InfoOps / Guerra Cognitiva      │
                        └─────────────────────────────────────────┘

                        ┌── [21] Fuzzing ───────────────────────┐
                        │   [M7] Browser Exploitation            │
     VULN RESEARCH ─────┤   [M8] Thick Client Pentesting        │
                        │   [33] PQC / Canales Laterales        │
                        └─────────────────────────────────────────┘

                        ┌── [14] WiFi Attacks ──────────────────┐
                        │   [22] Hacking Fisico / RFID          │
     HARDWARE / RF ─────┤   [28] SDR / Telecomunicaciones      │
                        │   [34] Hacking Aeroespacial           │
                        │   [35] Automocion / V2X              │
                        └─────────────────────────────────────────┘

                        ┌── [23] SCADA/OT ─────────────────────┐
                        │   [30] Legacy y Mainframes            │
     INDUSTRIAL ────────┤   [32] Firmware / UEFI Rootkits      │
                        │   [36] Dispositivos Medicos           │
                        └─────────────────────────────────────────┘

                        ┌── [5] OSINT ─────────────────────────┐
                        │   [24] Threat Hunting                 │
     DEFENSIVE ─────────┤   [39] OPSEC Militar                 │
                        │   [W4] Windows Forensics / DFIR      │
                        └─────────────────────────────────────────┘

                        ┌── [11] Phishing ─────────────────────┐
                        │   [M4] Bug Bounty                     │
     SOCIAL / WEB ──────┤   [3] Firebase Hacking                │
                        │   [M3] CTF / Hack The Box            │
                        └─────────────────────────────────────────┘

                        ┌── [26] Kubernetes Hacking ───────────┐
     CLOUD NATIVE ──────┤   [27] Web3 / Smart Contracts        │
                        │   [N6] Docker para Hacking           │
                        └─────────────────────────────────────────┘
```

---

## Nivel 6: Operaciones Completas

> **Objetivo:** Integrar todo en operaciones de red team reales.
> **Tiempo estimado:** 4-8 semanas

```
[TODOS LOS NIVELES ANTERIORES]
              │
              v
    [M9] Red Team Infrastructure ──── C2, redirectors, phishing infra
    [M11] Hacker Mindset ──────────── Metodologia mental
    [M4] Bug Bounty ───────────────── Caza de bugs en produccion
    [M3] CTF / Hack The Box ──────── Practica constante
    [31] Purple Teaming ──────────── Emulacion de adversarios
    [M5] Legal / Compliance ──────── Marco legal
    [N5] Report Writing ──────────── Comunicacion profesional
```

---

## Resumen Visual del Roadmap

```
NIVEL 0: FUNDAMENTOS
┌─────────────────────────────────────────────────────────────────────┐
│ [F1] SO  [F2] Redes  [F3] Programacion  [F4] Seguridad             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
NIVEL 1: HERRAMIENTAS                 │
┌─────────────────────────────────────────────────────────────────────┐
│ [M2] Metodologia  [6] Nmap  [13] Metasploit  [M1] Python  [N2] ASM│
└─────────────────────────────────────────────────────────────────────┘
                                    │
NIVEL 2: WEB Y APPS                  │
┌─────────────────────────────────────────────────────────────────────┐
│ [7] Web Hacking  [8] Passwords  [12] Shells  [20] API  [N5] Report│
└─────────────────────────────────────────────────────────────────────┘
                                    │
NIVEL 3: SISTEMAS                    │
┌─────────────────────────────────────────────────────────────────────┐
│ [10] Linux Privesc  [9] Windows PE  [40] Win Internals  [W3] Kernel│
└─────────────────────────────────────────────────────────────────────┘
                                    │
NIVEL 4: POST-EXPLOTACION           │
┌─────────────────────────────────────────────────────────────────────┐
│ [W2] RPC/COM  [W5] Bypasses  [18] EDR  [N3] AD  [N4] Linux Admin │
└─────────────────────────────────────────────────────────────────────┘
                                    │
NIVEL 5: ESPECIALIZACION            │
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──┐
│Clou│Mobi│IA/V│Vuln│RF/F│Indu│Defe│Soci│CNat│ .... (elige uno)    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴─────────────────────────┘
                                    │
NIVEL 6: OPERACIONES                │
┌─────────────────────────────────────────────────────────────────────┐
│ [M9] Infra  [M11] Mindset  [M4] Bug Bounty  [M3] CTF  [31] Purple │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Rutas Rapidas por Objetivo

### Quiero hacer Bug Bounty
```
Nivel 0 → Nivel 1 (Nmap, Python) → Nivel 2 (Web, API, Passwords)
→ [M4] Bug Bounty → [M3] CTF para practicar
```
Tutoriales clave: [7] Web Hacking, [20] API Hacking, [M1] Python, [M4] Bug Bounty

### Quiero ser Pentester Profesional
```
Nivel 0 → Nivel 1 → Nivel 2 → Nivel 3 → Nivel 4 → Nivel 6
```
Tutoriales clave: Todos los niveles 1-4 + [N5] Reporting + [M5] Legal

### Quiero Red Team / Operaciones Avanzadas
```
Nivel 0 → 1 → 2 → 3 → 4 → [M9] Red Team Infra → [18] EDR → [M11] Mindset
```
Tutoriales clave: [W2] RPC/COM, [W5] Bypasses, [18] EDR, [M9] Red Team Infra, [M11] Mindset

### Quiero Mobile Security
```
Nivel 0 → Nivel 1 → [1] ADB → [2] APK Reversing → [4] MITM → [M6] iOS
```
Tutoriales clave: [1] ADB, [2] APK Reversing, [4] MITM, [M6] iOS Pentesting

### Quiero Cloud Security
```
Nivel 0 → Nivel 1 → [17] Cloud Hacking → [25] Entra ID → [19] DevSecOps
```
Tutoriales clave: [17] Cloud, [25] Hibrid Identity, [19] DevSecOps

### Quiero Malware Analysis / Reverse Engineering
```
Nivel 0 → [F3] Programacion (C, ASM) → [N2] Assembly → [2] APK Reversing
→ [W4] Windows Forensics → [18] EDR Evasion
```
Tutoriales clave: [N2] ASM, [2] APK, [21] Fuzzing, [W4] Forensics, [18] EDR

### Quiero IoT / Hardware Hacking
```
Nivel 0 → Nivel 1 → [N2] ASM → [22] Hacking Fisico → [28] SDR
→ [32] Firmware/UEFI → [35] Automocion → [36] Dispositivos Medicos
```
Tutoriales clave: [22] RFID, [28] SDR, [32] Firmware, [35] V2X

---

## Tiempo Estimado Total

| Nivel | Tiempo full-time | Tiempo part-time |
|-------|-----------------|------------------|
| 0: Fundamentos | 2-4 semanas | 2-3 meses |
| 1: Herramientas | 4-6 semanas | 3-4 meses |
| 2: Web y Apps | 6-8 semanas | 4-6 meses |
| 3: Sistemas | 6-8 semanas | 4-6 meses |
| 4: Post-Explotacion | 4-6 semanas | 2-4 meses |
| 5: Especializacion | 4-8 semanas/rama | 2-4 meses/rama |
| 6: Operaciones | 4-8 semanas | 2-4 meses |
| **Total** | **6-12 meses** | **1.5-3 años** |

---

## Plataformas de Practica Recomendadas

Por nivel:

| Nivel | Plataforma | Que practicar |
|-------|-----------|---------------|
| 0 | Terminal, WSL, VM | Linux commands, Python scripts, networking |
| 1 | Hack The Box (Starting Point), TryHackMe (learning paths) | Nmap, Metasploit, basic exploitation |
| 2 | PortSwigger Web Academy, DVWA, Juice Shop | Web hacking, API testing |
| 3 | HTB Linux/Windows boxes, VulnHub | Privilege escalation |
| 4 | HTB Active Directory boxes, PGD (Pentester's Gym) | AD attacks, lateral movement |
| 5 | Varie segun rama | Especializacion |
| 6 | HTB Pro Labs, Red Team Ops, Caldera | Operaciones completas |

---

## Checklist de Progreso

```
NIVEL 0: FUNDAMENTOS
[ ] Puedo usar Linux sin miedo (terminal, permisos, procesos)
[ ] Entiendo TCP/IP, HTTP, DNS, y se usar Wireshark
[ ] Escribo scripts en Python y bash
[ ] Se los conceptos basicos de criptografia y OWASP Top 10

NIVEL 1: HERRAMIENTAS
[ ] Se el ciclo de pentest (PTES / OSSTMM)
[ ] Puedo escanear redes con Nmap (todos los tipos de scan)
[ ] Uso Metasploit para exploits basicos y post-explotacion
[ ] Escribo herramientas en Python (scanner, reverse shell)
[ ] Entiendo assembly basico (registros, stack, shellcode)

NIVEL 2: WEB Y APPS
[ ] Detecto y exploto SQLi (todos los tipos)
[ ] Detecto y exploto XSS (reflected, stored, DOM)
[ ] Uso Burp Suite profesionalmente
[ ] Crackeo hashes con Hashcat y ataco servicios con Hydra
[ ] Genero reverse shells en todos los lenguajes
[ ] Pruebo APIs REST, GraphQL y gRPC

NIVEL 3: SISTEMAS
[ ] Escalo privilegios en Linux (SUID, sudo, cron, kernel)
[ ] Escalo privilegios en Windows (ADCS, Kerberos, UAC)
[ ] Entiendo EPROCESS, tokens, PE format en Windows
[ ] Se conceptos basicos de kernel exploitation

NIVEL 4: POST-EXPLOTACION
[ ] Uso WMI, DCOM, WinRM para movimiento lateral
[ ] By-passeo UAC, AppLocker, AMSI, Windows Defender
[ ] Entiendo y evado EDR (API unhooking, syscalls)
[ ] Administro un dominio Windows (AD, GPO, DNS)

NIVEL 5: ESPECIALIZACION
[ ] Complete al menos 1 rama de especializacion
[ ] Tengo proyectos practicos en esa area

NIVEL 6: OPERACIONES
[ ] Configure infraestructura de red team (C2, redirectors)
[ ] Participe en un CTF o bug bounty
[ ] Escribi reportes profesionales
[ ] Hice un purple team exercise con CALDERA o Atomic Red Team
```

---

## Notas Finales

1. **No apures los niveles 0 y 1.** Son la base de todo. Si no entendes bien TCP/IP, permisos de Linux, o Python, todo lo demas te va a costar el doble.

2. **Practica en paralelo.** No leas 66 tutoriales sin tocar nada. Cada tutorial tiene ejercicios practicos. Hacelos.

3. **HTB/THM son complementos, no sustitutos.** Las maquinas te enseñan a buscar, pero la teoria te da el marco conceptual para entender que estas haciendo.

4. **Repite ciclos.** Cada 3-4 meses volve a niveles anteriores. Vas a encontrar cosas que no entendiste la primera vez.

5. **Especializate.** No hace falta ser experto en todo. Elegi una rama del nivel 5 y profundiza. Un especialista en AD vale mas que un "jack of all trades".

6. **Enseña.** La mejor forma de aprender es explicarselo a otros. Hace writeups, graba videos, ayuda en comunidades.

7. **Etica.** Todo este conocimiento es para sistemas propios o con autorizacion explicita. Usarlo sin permiso es delito.

