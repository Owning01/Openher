# OpenCode Remote Tunnel — Guía Completa

## Índice

1. [¿Qué es el túnel remoto?](#1-qué-es-el-túnel-remoto)
2. [Arquitectura](#2-arquitectura)
3. [Requisitos](#3-requisitos)
4. [Paso 1: Desplegar el Signaling Worker (Cloudflare)](#4-paso-1-desplegar-el-signaling-worker-cloudflare)
5. [Paso 2: Compilar el Tunnel Companion](#5-paso-2-compilar-el-tunnel-companion)
6. [Paso 3: Configurar en PC](#6-paso-3-configurar-en-pc)
7. [Paso 4: Conectar desde el móvil](#7-paso-4-conectar-desde-el-móvil)
8. [Seguridad](#8-seguridad)
9. [Solución de problemas](#9-solución-de-problemas)
10. [Referencia técnica](#10-referencia-técnica)

---

## 1. ¿Qué es el túnel remoto?

**Problema**: OpenCode Mobile está diseñado para funcionar en la misma red local que el servidor de OpenCode (ej. ambos conectados al mismo WiFi). Cuando el celular está en datos móviles, en el trabajo, o en cualquier red distinta a la de la PC, no puede alcanzar al servidor porque:

- La PC tiene una IP privada (192.168.x.x, 10.x.x.x, etc.) que no es accesible desde internet
- Abrir puertos en el router o configurar DNS dinámico es complejo, inseguro y no siempre posible
- Las redes corporativas/móviles suelen bloquear conexiones entrantes

### Solución que provee este proyecto

Un **túnel WebRTC** integrado en el propio ecosistema de OpenCode Mobile. La PC ejecuta un pequeño binario (el "tunnel companion") que se conecta a un servidor de señalización liviano en Cloudflare. El celular se conecta al mismo servidor, ambos se autentican con nombre+contraseña, y establecen una conexión directa y cifrada (DTLS). Los datos viajan directamente entre dispositivos sin pasar por ningún servidor intermedio.

**Ventajas de esta solución:**
- ✅ Integrado en la app — no necesitas instalar nada externo
- ✅ Zero configuración de red — no abrir puertos, no tocar el router
- ✅ Cifrado extremo a extremo por defecto
- ✅ Solo datos de OpenCode — no expone toda tu red
- ✅ Binario único, ejecutable, con ventana GUI

### Alternativa: Tailscale (o cualquier VPN)

Si por algún motivo no querés usar el túnel integrado, podés lograr el mismo resultado con herramientas de terceros:

1. **Instalar Tailscale** (o ZeroTier, WireGuard, etc.) tanto en la PC como en el celular
2. Ambos dispositivos quedan en la misma red virtual (ej. 100.x.x.x)
3. En OpenCode Mobile, configurar la conexión con la IP de Tailscale de la PC
4. El servidor OpenCode en la PC debe estar corriendo y accesible en el puerto configurado

**Desventajas de esta alternativa:**
- ❌ Requiere instalar, configurar y mantener un software externo
- ❌ Consume batería y datos constantemente (la VPN siempre activa)
- ❌ Expone más tráfico del necesario (toda la red, no solo OpenCode)
- ❌ Tailscale Free tiene límite de 3 usuarios/100 dispositivos
- ❌ Configuración más compleja para usuarios no técnicos

> **Recomendación**: Usar el túnel integrado que provee este proyecto. Está diseñado específicamente para OpenCode, no requiere software externo, y es más seguro porque solo canaliza el tráfico necesario.

## 2. Arquitectura

```
┌─ PC (casa/oficina) ──────────────────────┐
│                                           │
│  opencode server (127.0.0.1:3000)         │
│         ▲                                 │
│         │ HTTP proxy (localhost only)     │
│  tunnel companion (GUI o CLI)             │
│    ┌─────────────────────────────┐        │
│    │  WebRTC Peer (pion/webrtc)  │        │
│    │  ←─── DTLS-SRTP cifrado ──→│        │
│    └──────────┬──────────────────┘        │
│               │ WebSocket (WSS)           │
└───────────────┼───────────────────────────┘
                │
    ┌───────────▼───────────────────┐
    │  Signaling Worker             │
    │  (Cloudflare Workers + DO)    │
    │  • Match server↔client        │
    │  • Intercambio SDP/ICE        │
    │  • Autenticación (name+pass)  │
    │  • No ve datos de la app      │
    └───────────▲───────────────────┘
                │ WebSocket (WSS)
┌───────────────┼───────────────────────────┐
│               │                           │
│  ┌────────────┴───────────────┐           │
│  │  RTCPeerConnection         │           │
│  │  Data Channel (opencode)   │           │
│  │  ←─── fetch/SSE sobre RTC ─→          │
│  └────────────────────────────┘           │
│                                           │
│  opencode mobile app                      │
│  (cualquier red)                          │
└───────────────────────────────────────────┘
```

### Componentes

| Componente | Descripción | Stack |
|---|---|---|
| **Signaling Worker** | Servidor de señalización Cloudflare. Empareja PC↔Móvil y autentica con nombre+contraseña. | Cloudflare Workers + Durable Objects |
| **Tunnel Companion (PC)** | Binario que se ejecuta en la PC. Proxy inverso HTTP → localhost + peer WebRTC. | Go (pion/webrtc) |
| **Mobile Transport** | Capa en la app mobile que usa RTCPeerConnection en vez de HTTP directo. | TypeScript (WebRTC API nativa) |

## 3. Requisitos

### PC
- Windows, Linux o macOS
- OpenCode server instalado (`opencode` en PATH o descargado)
- Conexión a internet (saliente, sin puertos abiertos necesarios)

### Móvil
- Android (Capacitor WebView con soporte WebRTC)
- OpenCode Mobile instalado

### Cloudflare (solo para configurar el signaling)
- Cuenta Cloudflare gratuita
- `wrangler` CLI instalado (`npm install -g wrangler`)
- (Opcional) Un dominio en Cloudflare

## 4. Paso 1: Desplegar el Signaling Worker (Cloudflare)

El signaling worker es el "matchmaker". Sin él, el túnel no puede establecer conexión.

### 4.1 Instalar wrangler

```bash
npm install -g wrangler
```

### 4.2 Iniciar sesión en Cloudflare

```bash
wrangler login
```

### 4.3 Configurar el proyecto

El worker está en `signaling-worker/`. Antes de desplegar, revisa `wrangler.toml`:

```toml
name = "opencode-tunnel-signaling"
main = "src/index.ts"
compatibility_date = "2025-02-01"

[[durable_objects.bindings]]
name = "TUNNEL_MATCHER"
class_name = "TunnelMatcher"

[[migrations]]
tag = "v1"
new_classes = ["TunnelMatcher"]
```

### 4.4 Desplegar

```bash
cd signaling-worker
npm install
wrangler deploy
```

Esto te dará una URL como:
```
https://opencode-tunnel-signaling.<tu-subdominio>.workers.dev
```

**Importante**: La URL del signaling termina en `/signal` para WebSocket. La URL completa sería:
```
wss://opencode-tunnel-signaling.<tu-subdominio>.workers.dev/signal
```

Anota esta URL — la necesitarás en los pasos siguientes.

### 4.5 Verificar que funciona

```bash
# Verificar health
curl https://opencode-tunnel-signaling.<tu-subdominio>.workers.dev/health
# debería responder: ok
```

### 4.6 Usar el worker por defecto (opcional)

Si no quieres desplegar tu propio worker, el proyecto incluye un worker público de desarrollo en:
```
wss://opencode-tunnel-signaling.owning01.workers.dev/signal
```

> ⚠️ **Importante**: Este worker es solo para pruebas. Para producción, despliega tu propio worker para tener control completo sobre la seguridad y disponibilidad.

## 5. Paso 2: Compilar el Tunnel Companion

### 5.1 Prerrequisitos

- Go 1.22+
- (Opcional) Un C compiler para Linux/macOS (para Fyne GUI en esas plataformas)

### 5.2 Compilar

```bash
cd tunnel

# Windows GUI (recomendado)
CGO_ENABLED=0 go build -o opencode-tunnel.exe ./cmd/tunnel-gui/

# Linux
go build -o opencode-tunnel ./cmd/tunnel-gui/

# macOS
go build -o opencode-tunnel ./cmd/tunnel-gui/
```

### 5.3 Compilar versión CLI (headless)

```bash
# Windows
CGO_ENABLED=0 go build -o opencode-tunnel-cli.exe ./cmd/tunnel/

# Linux/macOS
go build -o opencode-tunnel-cli ./cmd/tunnel/
```

## 6. Paso 3: Configurar en PC

### 6.1 GUI (recomendado)

Ejecuta el binario compilado:

```bash
# Windows
opencode-tunnel.exe

# Linux/macOS
./opencode-tunnel
```

Se abrirá automáticamente el navegador con la interfaz web en una dirección como:
```
http://127.0.0.1:59573
```

La interfaz tiene tres secciones:

#### Pestaña "Túnel"

1. **Nombre del túnel**: Elige un nombre descriptivo (ej. "MiOficina", "Casa")
2. **Contraseña**: Crea una contraseña segura (la usarás en el móvil)
3. **Host local**: Normalmente `127.0.0.1` (solo proxy a localhost)
4. **Puerto**: Puerto del servidor OpenCode (por defecto 3000)
5. **Avanzado**: URL de señalización (solo si desplegaste tu propio worker)
6. Click **"Conectar túnel"**

#### Pestaña "Servidor"

1. Click **"Detectar servidor"** para buscar automáticamente el binario de OpenCode
2. Si no lo encuentra, click **"Seleccionar binario..."** y navega hasta el ejecutable
3. Si el servidor no está corriendo, click **"Iniciar servidor"**

#### Auto-inicio

Marca **"Auto-inicio"** para que el túnel arranque automáticamente al encender el equipo:
- Windows: Se escribe en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Linux: Se crea `~/.config/autostart/OpenCodeTunnel.desktop`
- macOS: Se crea `~/Library/LaunchAgents/com.opencode.tunnel.plist`

### 6.2 CLI (avanzado)

```bash
# Detectar e iniciar servidor automáticamente
opencode-tunnel-cli --name MiOficina --password secreto

# Especificar puerto y URL de señalización
opencode-tunnel-cli \
  --name MiOficina \
  --password secreto \
  --port 3000 \
  --signaling wss://tusub.workers.dev/signal

# Solo servidor (sin túnel)
opencode-tunnel-cli --discover --start-server
```

## 7. Paso 4: Conectar desde el móvil

### 7.1 Desde la app OpenCode Mobile

1. Abre OpenCode Mobile
2. Ve a **Ajustes**
3. Click en **"Conexión Remota"**
4. Ingresa los mismos datos que configuraste en la PC:
   - **Nombre del servidor**: El mismo que pusiste en la PC
   - **Contraseña**: La misma contraseña
5. Click **"Conectar"**
6. Cuando veas el badge verde "Conectado remotamente", ya puedes usar la app normalmente

### 7.2 Escaneando QR (próximamente)

La versión CLI muestra un QR code que puede escanearse desde la app mobile para auto-completar los datos de conexión.

## 8. Seguridad

### Capa de transporte
- **WebRTC DTLS-SRTP**: Todos los datos viajan cifrados extremo a extremo
- **WebSocket WSS**: La señalización usa TLS
- **No hay servidores intermedios**: Una vez establecida la conexión, los datos van directo entre PC y móvil

### Autenticación
- **Nombre + contraseña**: El signaling worker verifica que ambos lados usen la misma combinación
- **Hash de contraseña**: Se envía SHA-256(password), nunca la contraseña en texto plano
- **Rate limiting**: Máximo 3 intentos de autenticación cada 30 segundos

### Configuración
- **Cifrado AES-256-GCM**: El archivo de configuración se cifra con una clave derivada del MachineID de la PC (PBKDF2, 100k iteraciones)
- **Archivo**: `~/.opencode/tunnel-config.enc` (permisos 0600)
- **Loopback**: El proxy solo se conecta a 127.0.0.1 por defecto

### Zero-trust
- La PC **no abre ningún puerto** — solo hace conexiones salientes al signaling worker
- El signaling worker **no ve los datos de la app** — solo intercambia SDP/ICE
- Sin certificados, sin firewall rules, sin configuración de router

## 9. Solución de problemas

### "No se encontró el servidor opencode"

**Causas posibles:**
1. OpenCode no está instalado
2. El binario no está en el PATH
3. El servidor no está corriendo

**Soluciones:**
1. Click "Seleccionar binario..." y navega hasta el ejecutable
2. Si no tienes OpenCode instalado: `npm install -g @opencode/cli`
3. Click "Iniciar servidor" para arrancarlo automáticamente

### "Error de señalización"

**Causas posibles:**
1. La URL de señalización es incorrecta
2. El worker de Cloudflare no está desplegado
3. Problema de red (firewall corporativo)

**Soluciones:**
1. Verifica que puedas hacer WebSocket a la URL desde la PC
2. Prueba: `curl https://tu-worker.workers.dev/health`
3. Algunas redes corporativas bloquean WebSocket — prueba desde otra red

### "No se puede conectar desde el móvil"

**Causas posibles:**
1. Nombre o contraseña incorrectos
2. NAT simétrica (poco común)
3. El túnel en la PC no está conectado

**Soluciones:**
1. Verifica que nombre y contraseña coincidan exactamente
2. Si el móvil está en una red corporativa muy restrictiva, puede necesitar un TURN server
3. En la PC, la interfaz web debe mostrar "● Conectado"

### "La conexión se cierra después de un rato"

Por seguridad, el túnel se desconecta automáticamente después de 30 minutos sin actividad. Vuelve a conectar cuando lo necesites.

## 10. Referencia técnica

### Estructura del proyecto

```
opencode-remote-android/
├── signaling-worker/          # Cloudflare Worker
│   ├── wrangler.toml
│   ├── package.json
│   └── src/
│       ├── index.ts           # Entry point (WebSocket upgrade)
│       └── matcher.ts         # Durable Object (session match + auth)
│
├── tunnel/                    # Go companion
│   ├── cmd/
│   │   ├── tunnel/            # CLI version
│   │   │   └── main.go
│   │   └── tunnel-gui/        # GUI version (web embebida)
│   │       └── main.go
│   └── internal/
│       ├── signaling/         # WebSocket client → signaling worker
│       │   └── signaling.go
│       ├── transport/         # WebRTC peer + reverse proxy
│       │   └── transport.go
│       ├── proxy/             # Config types
│       │   └── proxy.go
│       ├── discovery/         # Auto-detección del server opencode
│       │   └── discovery.go
│       ├── security/          # Hash, cifrado AES-GCM, rate limiting
│       │   └── security.go
│       ├── config/            # Config cifrada persistente
│       │   └── config.go
│       ├── autostart/         # Auto-inicio multi-plataforma
│       │   └── autostart.go
│       └── gui/               # Servidor HTTP + página web embebida
│           ├── server.go
│           └── static/
│               └── index.html
│
└── web/src/
    ├── tunnel/
    │   ├── TunnelTransport.ts # RTCPeerConnection wrapper (mobile)
    │   └── useRemoteTunnel.ts # React hook
    └── components/
        └── RemoteConnect.tsx  # UI modal de conexión remota
```

### Protocolo: Data Channel

Una vez establecido el canal WebRTC, la comunicación usa JSON:

```jsonc
// Mobile → PC: Request HTTP
{ "id": "req_1", "method": "GET", "path": "/api/health", "headers": {} }

// PC → Mobile: Response
{ "id": "req_1", "type": "response", "status": 200, "headers": {}, "body": "{}", "done": true }

// PC → Mobile: SSE Event
{ "id": "sse_1", "type": "event", "data": "event: message.updated\ndata: {...}\n\n" }
{ "id": "sse_1", "type": "event", "done": true }
```

### Configuración (archivo cifrado)

```
~/.opencode/tunnel-config.enc
```

Formato: JSON cifrado con AES-256-GCM, nonce de 12 bytes prefijado, todo en hexadecimal.

```json
{
  "name": "MiOficina",
  "password": "hash-sha256",
  "signaling_url": "wss://.../signal",
  "server_host": "127.0.0.1",
  "server_port": 3000,
  "auto_start": true,
  "bin_path": "C:\\...\\opencode.exe",
  "language": "es"
}
```

La clave de cifrado se deriva del MachineID + salt fijo mediante PBKDF2 (100k iteraciones, SHA-256).

### Despliegue CI/CD

Para construir el binario de Windows desde cualquier plataforma:

```bash
cd tunnel
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o opencode-tunnel.exe ./cmd/tunnel-gui/
```

Sin CGO no es necesario tener MinGW ni ningún compilador de C. El binario incluye:
- Interfaz web embebida (HTML/CSS/JS)
- Servidor HTTP
- Cliente WebSocket
- WebRTC (pion/webrtc v4)
- QR code (go-qrcode)
- Librerías criptográficas estándar
