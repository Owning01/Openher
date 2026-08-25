# anonimato en red — tor, vpn, Proxies, y opsecc

## Indice

> ⏱️ **Tiempo estimado:** 12 horas (~2 sesiones) (1290 lineas)


1. [advertencia](#advertencia)
2. [Principios de Anonimato](#principios-de-anonimato)
3. [tor (The Onion Router)](#tor-the-onion-router) - Cómo [funciona Tor — Explicación Técnica](#como-funciona-tor--explicacion-tecnica)
4. [Puentes (Bridges)](#puentes-bridges)
5. [Servicios Ocultos (Hidden Services)](#servicios-ocultos-hidden-services)
6. [OnionShare](#onionshare)
7. [VPN](#vpn)
8. [V2Ray, Shadowsocks, Proxies Ofuscados](#v2ray-shadowsocks-proxies-ofuscados)
9. [SSH Tunneling](#ssh-tunneling)
10. [SSL/TLS Tunnels](#ssltls-tunnels)
11. Fugas [dns (DNS Leaks)](#fugas-dns-dns-leaks)
12. [Browser Fingerprinting](#browser-fingerprinting)
13. [MAC Address Spoofing](#mac-address-spoofing)
14. [Host-Based Anonymization](#host-based-anonymization)
15. [VM y Sandboxing](#vm-y-sandboxing)
16. [OPSEC](#opsec)
17. [Defensa contra Análisis de Tráfico](#defensa-contra-analisis-de-trafico)
18. [Eliminación de Metadatos](#eliminacion-de-metadatos)
19. [Transacciones con Criptomonedas](#transacciones-con-criptomonedas)
20. [Comunicaciones Seguras](#comunicaciones-seguras)
21. [Checklist Completo](#checklist-completo)
22. [Proyectos Prácticos](#proyectos-practicos) - [Proyecto 1: Tor Relay Monitor — Scanner de la Red Tor](#proyecto-1-tor-relay-monitor--scanner-de-la-red-tor) - Proyecto 2: [vpn](../raw/4n0n1m4t0.md#vpn) Kill [switch con iptables](#proyecto-2-vpn-kill-switch-con-iptables) - [Proyecto 3: Automatizador de Limpieza de Metadatos](#proyecto-3-automatizador-de-limpieza-de-metadatos) - [Proyecto 4: Servicio Onion — Creador de Hidden Services](#proyecto-4-servicio-onion--creador-de-hidden-services)

---

## Principios de [anonimato](../raw/4n0n1m4t0.md)

Antes de meterte con herramientas, entendé los conceptos:

1. **Separación de identidades**: tu identidad real ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), ubicación, nombre) vs tu identidad anónima
2. **No correlación**: ninguna acción que hagas anónimamente debe conectarse con tu identidad real
3. **compartmentalización**: separar actividades (navegar, mail, mensajes) en entornos distintos
4. **reducción de superficie de ataque**: menos plugins, menos JS, menos todo
5. **[opsec](../raw/0ps3c-pr0.md) ([operational security](../raw/0ps3c-pr0.md))**: lo que hacés es más importante que las herramientas que usás
6. **Defense in depth**: varias capas ([tor](../raw/4n0n1m4t0.md#tor) + [vpn](../raw/4n0n1m4t0.md#vpn) + SO amnesic + metadata removal)
7. **La cadena es tan fuerte como su eslabón más débil**: una fuga de [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) te delata aunque tengas Tor

---

## [tor](../raw/4n0n1m4t0.md#tor) (The Onion [router](../raw/r3d3s-f0nd4m3nt0s.md#routers))

### Cómo funciona Tor — Explicación Técnica

Tor enruta tu tráfico a través de 3 nodos (relays) seleccionados al azar de una [red](../raw/r3d3s-f0nd4m3nt0s.md) global de voluntarios:

```
Tu PC → Nodo Guard (Entry) → Nodo Middle → Nodo Exit → Internet ↑ ↑ ↑ ↑ Cifrado  Capa 1 descifra  Capa 2 descifra  Capa 3 descifra sabe tu IP no sabe nada ve el destino no ve destino ni IP ni destino  no sabe tu IP
```

**Cómo funciona el [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) onion (cebolla)**:

1. Tu cliente Tor negocia claves simétricas con cada nodo (Diffie-Hellman)
2. Cada capa de cifrado es como una capa de cebolla: - Capa externa: cifrado con clave del Exit (se descifra al final) - Capa media: cifrado con clave del Middle (se descifra en el medio) - Capa interna: cifrado con clave del Guard (se descifra primero)
3. Cada nodo solo sabe descifrar su capa, que le dice "mandale esto al próximo nodo"
4. El Exit ve el tráfico descifrado (sabe a qué sitio te conectás, pero no quién sos)
5. El Guard sabe quién sos (tu [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)) pero no a qué sitio te conectás
6. El Middle solo sabe "recibo paquetes de A, los mando a B" — no sabe nada útil <a name="puentes-bridges"></a>
## 4. Pu3nt3s (Br1dg3s)

Los bridges son relays de [tor](../raw/4n0n1m4t0.md#tor) no publicados. Si tu ISP bloquea [tor](../raw/4n0n1m4t0.md#tor), los bridges son la solucion.

### Obtener bridges

```
# Desde el sitio web (necesitas Tor o email)
https://bridges.torproject.org/

# Via email (desde cualquier email)
enviar email a: bridges@torproject.org
asunto: get transport obfs4
cuerpo: get transport obfs4

# Desde Tor Browser
Settings > Tor > Request a New Bridge
```

### Pluggable Transports

**obfs4 (Obfuscation v4):** El mas recomendado. Ofusca trafico Tor para que parezca aleatorio.
```
# En torrc
Bridge obfs4 <IP>:<PORT> <FINGERPRINT> cert=<CERT> iat-mode=0
UseBridges 1
ClientTransportPlugin obfs4 exec /usr/bin/obfs4proxy
```

**Snowflake:** [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) basado en WebRTC. Usa conexiones peer-to-peer.
```
# En torrc
Bridge snowflake 0.0.3.0:1
UseBridges 1
ClientTransportPlugin snowflake exec /usr/bin/snowflake-client
```

**meek:** Usa [domain fronting](../raw/r3d-t34m-1nfr4.md#domain-fronting) para ocultar el trafico Tor.
```
# En torrc
Bridge meek_lite 0.0.2.0:2 url=https://d2zfqthxsdq309.cloudfront.net/ front=a0.awsstatic.com
UseBridges 1
ClientTransportPlugin meek_lite exec /usr/bin/meek-client
```

**WebTunnel:** Similar a websocket, trafico parece httpss) normal.
```
Bridge webtunnel <IP>:<PORT> <FINGERPRINT>
```

### Configurar bridges en torrc

```
# /etc/tor/torrc
UseBridges 1
# Obtener de https://bridges.torproject.org/
Bridge obfs4 192.95.36.142:443 <FINGERPRINT> cert=<CERT> iat-mode=0
Bridge obfs4 192.95.36.143:443 <FINGERPRINT> cert=<CERT> iat-mode=0
ClientTransportPlugin obfs4 exec /usr/bin/obfs4proxy
```

### Verificar que los bridges funcionan

```
# Despues de reiniciar Tor
systemctl restart tor
journalctl -u tor -n 20 --no-pager | grep -i "bridge\|obfs4\|snowflake"
```

### Probar conectividad con bridges

```
# Usar curl via Tor SOCKS
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api
``` <a name="servicios-ocultos-hidden-services"></a>
## 5. s3rv1c10s 0cult0s (H1dd3n S3rv1c3s)

Los hidden services permiten hostear servicios accesibles solo via [tor](../raw/4n0n1m4t0.md#tor), con direcciones .onion.

### V3 vs V2

| Caracteristica | V2 (obsoleto) | V3 (actual) |
|---------------|---------------|-------------|
| Longitud direccion | 16 caracteres | 56 caracteres |
| cifradoo) | [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)-1024 | Ed25519 |
| Seguridad | Basica | Alta (mejor cr[iptografia](./raw/crypt0-f0r |
| E2E crypto | No | Si (optional) |
| Single onion | No | Si |

### Crear un Hidden Service V3

```
# 1. Configurar /etc/tor/torrc
HiddenServiceDir /var/lib/tor/mi_servicio/
HiddenServicePort 80 127.0.0.1:8080
HiddenServicePort 22 127.0.0.1:22

# 2. Crear directorio
mkdir -p /var/lib/tor/mi_servicio/
chmod 700 /var/lib/tor/mi_servicio/
chown debian-tor:debian-tor /var/lib/tor/mi_servicio/

# 3. Reiniciar Tor
systemctl restart tor

# 4. Obtener direccion .onion
cat /var/lib/tor/mi_servicio/hostname
# Resultado: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6.onion

# 5. NO compartir:
cat /var/lib/tor/mi_servicio/private_key  # CLAVE PRIVADA!
```

### Single Onion Service

Mas rapido pero menos anonimo (solo un salto):
```
HiddenServiceSingleHopMode 1
HiddenServiceNonAnonymousMode 1
HiddenServiceDir /var/lib/tor/mi_servicio/
HiddenServicePort 80 127.0.0.1:8080
```

### Onion Balance (balanceo de carga)

Para distribuir trafico entre varios servidores:
```
# torrc del balanceador
HiddenServiceDir /var/lib/tor/loadbalanced/
HiddenServicePort 80 127.0.0.1:8080

# torrc de cada backend
HiddenServiceDir /var/lib/tor/backend1/
HiddenServicePort 80 127.0.0.1:8080
HiddenServiceNonAnonymousMode 1
HiddenServiceSingleHopMode 1
```

### [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) en Hidden Services (Client Authorization)

```
# En el servidor (torrc)
HiddenServiceDir /var/lib/tor/auth_service/
HiddenServicePort 80 127.0.0.1:8080
HiddenServiceAuthorizeClient stealth client1,client2

# Genera archivos .auth en /var/lib/tor/auth_service/
# Compartir la clave con los clientes autorizados

# En el cliente (~/.torrc o torrc)
HidServAuth <onion_address> <auth_cookie>
```

### Mejores practicas para Hidden Services

```
# Deshabilitar logging de peticiones en el servidor web
# No revelar IP real en headers
# Usar Headers:
Header always unset Server
Header always unset X-Powered-By
Header always unset X-Forwarded-For

# Configurar nginx para .onion
server { listen 127.0.0.1:8080; server_name localhost; access_log /dev/null; error_log /dev/null; root /var/www/onion;
}
``` <a name="onionshare"></a>
## 6. 0n10nSh4r3

### Instalacion
```
# Linux
sudo apt install onionshare
sudo snap install onionshare

# Desde source
git clone https://github.com/micahflee/onionshare.git
cd onionshare
pip3 install -r requirements.txt
python3 setup.py install
```

### comandos basicos
```
# Compartir un archivo
onionshare /path/to/file.pdf

# Compartir un directorio
onionshare /path/to/directory/

# Con persistencia (mismo .onion cada vez)
onionshare --persistent /path/to/file.pdf

# Con contrasena
onionshare --password "secreto" /path/to/file.pdf

# Con tiempo limite
onionshare --auto-stop-time 3600 /path/to/file.pdf

# Recibir archivos (OnionShare Receive)
onionshare receive
``` <a name="vpn"></a>
## 7. [vpn](../raw/4n0n1m4t0.md#vpn)

### VPN vs [tor](../raw/4n0n1m4t0.md#tor)

| Caracteristica | VPN | Tor |
|---------------|-----|-----|
| Velocidad | Alta | Baja (latencias) |
| Privacidad | Confias en el provider | Confias en la [red](../raw/r3d3s-f0nd4m3nt0s.md) |
| Legalidad | Servicios de pago, registro | Descentralizado, sin registro |
| Logs | Depende del provider | Sin logs por disenio |
| Ataques | Provider ve todo | Exit node ve trafico |
| Jurisdiccion | Atrapado por leyes locales | Global |

### comparativa de VPNs (sin logs)

| VPN | Jurisdiccion | Logs | pr[otocolo](./raw/r3d3ss | Precio/mes |
|-----|-------------|------|-----------|-----------|
| Mullvad | Suecia | Sin logs | WireGuard, OpenVPN | 5 EUR |
| ProtonVPN | Suiza | Sin logs | WireGuard, OpenVPN, IKEv2 | Gratis/Pago |
| IVPN | Gibraltar | Sin logs | WireGuard, OpenVPN | 6 USD |
| OVPN | Suecia | Sin logs | WireGuard, OpenVPN | 7 USD |
| AirVPN | Italia | Sin logs | OpenVPN, WireGuard | 5 EUR |
| AzireVPN | Suecia | Sin logs | WireGuard, OpenVPN | 5 EUR |

### Configuracion WireGuard

```
# Instalacion
sudo apt install wireguard

# Generar claves
wg genkey | tee privatekey | wg pubkey > publickey

# Configuracion (/etc/wireguard/wg0.conf)
[Interface]
PrivateKey = <PRIVATE_KEY>
Address = 10.0.0.2/24
DNS = 1.1.1.1

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0

# Activar
wg-quick up wg0
wg-quick down wg0
systemctl enable wg-quick@wg0
```

### Configuracion OpenVPN

```
# Conectar
sudo openvpn --config config.ovpn

# Como servicio
sudo systemctl start openvpn@config
sudo systemctl enable openvpn@config
```

### Multi-hop VPN

Dos VPNs en serie para mayor [anonimato](../raw/4n0n1m4t0.md):
```
# Maquina virtual 1: VPN A
# Maquina virtual 2: VPN B (trafico de VM1)
# O en el mismo sistema:
# wg0 -> VPN A, wg1 -> VPN B (rutas configuradas)
```

### VPN Kill [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) con iptables

```
# Bloquear todo el trafico que NO pase por tun0 (VPN)
iptables -P OUTPUT DROP
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A OUTPUT -o tun0 -j ACCEPT
iptables -A OUTPUT -p udp --dport 51820 -j ACCEPT  # WireGuard port
iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
``` <a name="v2ray-shadowsocks-proxies-ofuscados"></a>
## 8. V2R4y, Sh4d0ws0cks, Pr0x13s 0fusc4d0s

### Shadowsocks
```
# Servidor
pip3 install shadowsocks
ssserver -p 8388 -k password -m aes-256-gcm

# Cliente
sslocal -s server.com -p 8388 -k password -m aes-256-gcm -l 1080
# Usar: curl --socks5 127.0.0.1:1080 http://example.com
```

### V2Ray
```
# Instalacion
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh)

# Configuracion basica (/usr/local/etc/v2ray/config.json)
{ "inbounds": [{ "port": 1080, "protocol": "socks", "settings": { "auth": "noauth" } }], "outbounds": [{ "protocol": "vmess", "settings": { "vnext": [{ "address": "server.com", "port": 443, "users": [{"id": "UUID", "security": "auto"}] }] }, "streamSettings": { "network": "ws", "security": "tls", "wsSettings": { "path": "/ws" } } }]
}
```

### Proxies Ofuscados (Obfsproxy)
```
# Obfsproxy (obfs4)
git clone https://gitlab.com/yawning/obfs4.git
cd obfs4 && go build -o obfs4proxy ./obfs4proxy/
# Usar con Tor como pluggable transport
``` <a name="ssh-tunneling"></a>
## 9. SSH Tun3l1ng

### Local Port Forward
```
# Puerto local -> Servidor remoto
ssh -L 8080:localhost:80 user@server.com
# Ahora http://localhost:8080 es http://server.com:80

# A traves de un jump host
ssh -L 8080:internal.target:80 -J user@jumpbox user@target
```

### Remote Port Forward
```
# Puerto remoto -> maquina local
ssh -R 8080:localhost:80 user@server.com
# server.com:8080 apunta a localhost:80 de tu maquina

# Reverse SOCKS proxy
ssh -R 1080:localhost:1080 user@server.com
```

### Dynamic Port Forward (SOCKS5 [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy))
```
# Crea un proxy SOCKS5 en tu maquina
ssh -D 9050 user@server.com
# Ahora configuras cualquier app para usar SOCKS5 en localhost:9050
# Todo el trafico pasa por server.com

# Con proxychains:
proxychains firefox
proxychains nmap -sT 10.0.0.1
```

### SSH Tunneling Avanzado

**Multi-hop SOCKS chain:**
```
# Tunnel 1: local -> jump1
ssh -D 9050 -N user@jump1.com

# Tunnel 2: jump1 -> jump2 (ejecutado en jump1)
ssh -D 9051 -N user@jump2.com

# Tunnel 3: jump2 -> target
ssh -D 9052 -N user@target.com
```

**SSH Proxycommand:**
```
# En ~/.ssh/config
Host jump HostName jumpbox.com User user

Host target HostName 10.0.0.1 User admin ProxyCommand ssh jump -W %h:%p
# Luego: ssh target
```

**SSH over [tor](../raw/4n0n1m4t0.md#tor):**
```
# Conectar SSH a traves de Tor SOCKS
ssh -o ProxyCommand='nc -x 127.0.0.1:9050 %h %p' user@onionaddress.onion

# O con connect-proxy
ssh -o ProxyCommand='connect-proxy -S 127.0.0.1:9050 %h %p' user@server

# En ~/.ssh/config
Host *.onion ProxyCommand nc -x 127.0.0.1:9050 %h %p
``` <a name="ssl)tls-tunnels"></a>
## 10. [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) Tun3ls

### stunnel
```
# Cliente (stunnel.conf)
client = yes
[service]
accept = 8080
connect = server.com:443

# Servidor (stunnel.conf)
client = no
[service]
accept = 443
connect = 127.0.0.1:80

# Iniciar
stunnel stunnel.conf
```

### haproxy SSL termination
```
frontend https-in bind *:443 ssl crt /etc/ssl/certs/server.pem default_backend app
backend app server app1 127.0.0.1:8080
```

### [socat](../raw/r3v3rs3-sh3lls.md#socat) SSL tunnel
```
# Cliente
socat TCP-LISTEN:8080,reuseaddr,fork OPENSSL:server.com:443,cafile=ca.pem

# Servidor
socat OPENSSL-LISTEN:443,cert=server.pem,key=server.key,verify=0,fork TCP:127.0.0.1:80
``` <a name="fugas-dns-dns-leaks"></a>
## 11. Fug4s [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) L34ks)

### Que es una fuga DNS?
Cuando tu conexion [vpn](../raw/4n0n1m4t0.md#vpn)/[tor](../raw/4n0n1m4t0.md#tor) envia consultas DNS a traves de tu conexion normal (no encriptada), revelando tu [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) real.

### Testear fugas DNS

```
# Sitios de test
https://dnsleaktest.com/
https://ipleak.net/

# Desde terminal
# Ver que DNS estas usando
cat /etc/resolv.conf
nmcli device show | grep DNS
systemd-resolve --status

# Verificar que el DNS es el de la VPN
dig google.com
# Server: deberia ser 10.x.x.x o similar (VPN DNS)
```

### Prevenir fugas DNS

```
# 1. Usar VPN DNS exclusivamente
# En /etc/resolv.conf
nameserver 10.0.0.1  # DNS de la VPN

# 2. Bloquear DNS externo con iptables
iptables -A OUTPUT -p udp --dport 53 -d 10.0.0.1 -j ACCEPT
iptables -A OUTPUT -p udp --dport 53 -j DROP
iptables -A OUTPUT -p tcp --dport 53 -d 10.0.0.1 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j DROP

# 3. Usar DNSCrypt/DoH/DoT
# DNSCrypt-proxy
sudo apt install dnscrypt-proxy

# Stubby (DNS over TLS)
sudo apt install stubby
# /etc/stubby/stubby.yml configurado

# 4. Deshabilitar IPv6 (evita fugas por IPv6)
sysctl -w net.ipv6.conf.all.disable_ipv6=1
sysctl -w net.ipv6.conf.default.disable_ipv6=1

# 5. En Firefox
# about:config
# network.proxy.socks_remote_dns = true
# media.peerconnection.enabled = false (WebRTC)
``` <a name="browser-fingerprinting"></a>
## 12. Br0ws3r F1ng3rpr1nt1ng

### Que es fingerprinting?
Identificar un usuario por las caracteristicas unicas de su [navegador](../raw/br0ws3r-3xpl01t4t10n.md): resolucion, fuentes, plugins, headers [http](../raw/r3d3s-f0nd4m3nt0s.md#http), canvas rendering, WebGL, etc.

### Que expone tu navegador

```
# Headers HTTP
User-Agent
Accept-Language
Accept-Encoding
Accept
DNT
Connection

# JavaScript
navigator.userAgent
navigator.plugins
navigator.languages
screen.width x screen.height
navigator.hardwareConcurrency
navigator.deviceMemory
canvas.toDataURL
WebGL renderer
AudioContext fingerprint
```

### Cuanto te identifica

| Atributo | Bits de entropia | Unicidad |
|----------|-----------------|----------|
| User-Agent | 10 | Alta |
| Accept headers | 6 | Media |
| Plugins | 15 | Muy alta |
| Fuentes | 13 | Alta |
| Canvas | 5 | Alta |
| WebGL | 8 | Alta |
| Resolution | 4 | Baja |
| Timezone | 3 | Baja |
| **Total** | **~33 bits** | **Muy alta** |

### Defensa contra fingerprinting

**[tor](../raw/4n0n1m4t0.md#tor) Browser (recomendado):**
- Mismo fingerprint para todos los usuarios de Tor
- Sin plugins instalables
- Resolucion de ventana fija (1000x900)
- Letterboxing para evitar fingerprint por resolucion
- WebGL bloqueado
- Canvas bloqueado
- Audio API limitado

**Firefox hardening:**
```
# about:config
privacy.resistFingerprinting = true
privacy.trackingprotection.fingerprinting.enabled = true
webgl.disabled = true
media.peerconnection.enabled = false
media.navigator.enabled = false
canvas.poisondata = true
dom.battery.enabled = false
device.sensors.enabled = false
```

**Extensions:**
- CanvasBlocker
- uBlock Origin
- NoScript
- Privacy Badger

### Testear tu fingerprint

```
https://amiunique.org/
https://browserleaks.com/
https://panopticlick.eff.org/
https://coveryourtracks.eff.org/
```

### WebRTC Leaks

WebRTC puede revelar tu [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) real incluso detras de [vpn](../raw/4n0n1m4t0.md#vpn)/Tor.

```
# En Firefox:
media.peerconnection.enabled = false

# En Chrome:
Instalar extension WebRTC Network Limiter

# A nivel de sistema:
# Bloquear en firewalld o iptables
# ufw bloquear puertos UDP usados por WebRTC
``` <a name="mac-address-spoofing"></a>
## 13. M4C 4ddr3ss Sp00f1ng

### Cambiar MAC en Linux
```
# Bajar interfaz
ip link set wlan0 down

# Cambiar MAC
ip link set wlan0 address 00:11:22:33:44:55

# Subir interfaz
ip link set wlan0 up

# O con macchanger
macchanger -r wlan0 # MAC aleatoria
macchanger -a wlan0 # MAC aleatoria del mismo vendor
macchanger -m 00:11:22:33:44:55 wlan0  # MAC especifica
```

### [persistencia](./raw/w1nd0wsia) de MAC
```
# NetworkManager
nmcli connection modify "WiFi" wifi.cloned-mac-address random

# systemd-networkd
cat > /etc/systemd/network/00-wireless.link << 'EOF'
[Match]
MACAddress=original:mac:address
[Link]
MACAddressPolicy=random
EOF
```

### Verificar cambio
```
ip addr | grep ether
macchanger -s wlan0
``` <a name="host-based-anonymization"></a>
## 14. H0st-B4s3d 4n0nym1z4t10n

### /etc/hostname
```
# Cambiar hostname para no revelar identidad
hostname anon-host
echo "anon-host" > /etc/hostname
```

### /etc/machine-id
```
# Machine ID identifica instalaciones de Linux
# NO CAMBIAR a menos que sea necesario (rompe algunas apps)
rm /etc/machine-id
systemd-machine-id-setup
dbus-uuidgen --ensure
```

### User-Agent spoofing
```
# curl
curl -A "Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0" https://example.com

# wget
wget -U "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" https://example.com
``` <a name="vm-y-sandboxing"></a>
## 15. VM y S4ndb0x1ng

### [tails](../raw/4n0n1m4t0.md#tails) OS
sistema o[perativo](./raw/0s amnesico que enruta todo el trafico por [tor](../raw/4n0n1m4t0.md#tor).

```
# Instalacion
# Descargar ISO de https://tails.net/
# USB: dd if=tails.img of=/dev/sdX bs=16M status=progress

# Persistent Storage (encriptado)
# Al bootear: Applications > Tails > Configure persistent volume
# Contrasena fuerte
# Activar: Personal data, Network Connections, etc.

# Caracteristicas de seguridad
- No deja rastro al apagar (amnesico)
- Todo el trafico por Tor (kill switch integrado)
- Configuracion de seguridad de Firefox pre-hecha
- Teclado en pantalla (keyloggers)
- MAC address spoofing automatico
- Secure deletion al apagar
```

### [whonix](../raw/4n0n1m4t0.md#whonix) Gateway + Workstation

```
# Gateway (proxy Tor)
- Actua como router Tor
- Todo el trafico se envia a traves de Tor
- IP publica = IP del nodo exit de Tor

# Workstation (para aplicaciones)
- Solo se conecta via Gateway
- No tiene IP real
- DNS leaks imposibles

# Instalacion
# Descargar OVA de https://www.whonix.org/
# Importar a VirtualBox
# Iniciar Whonix-Gateway primero, luego Whonix-Workstation

# Verificar
curl --socks5 10.152.152.10:9050 https://check.torproject.org/
```

### Qubes OS
[sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) basado en Xen que aisla aplicaciones en dominios (VMs).

```
# Conceptos
- Dom0: Sistema base, administracion
- AppVMs: Aplicaciones aisladas (cada una con su SO)
- TemplateVMs: Plantillas para AppVMs
- ProxyVM: Red (Tor, VPN)
- Qubes Firewall: Control de red por VM

# Flujo de trabajo anonimo
1. TemplateVM: Debian base
2. AppVM "navegacion": Firefox + Tor
3. AppVM "email": Thunderbird + Whonix
4. AppVM "temporal": Tareas unicas, se destruye
5. ProxyVM "tor": Whonix Gateway
6. ProxyVM "vpn": VPN antes de Tor

# Ventajas de Qubes
- Compartimentacion fuerte
- Aislamiento por XEN (no por kernel)
- Anti-keylogging (teclado en Dom0)
- Anti-screenshot (VMs no pueden verse entre si)
```

### Whonix vs Tails vs Qubes

| Caracteristica | Tails | Whonix | Qubes |
|---------------|-------|--------|-------|
| Tipo | Live OS | VMs | Full OS |
| Amnesico | Si | No (persistente) | No |
| Tor obligatorio | Si | Si | Configurable |
| Facilidad de uso | Alta | Media | Baja |
| Seguridad | Media | Alta | Muy alta |
| Uso recomendado | Rapido, anonimo | Largo plazo | Maxima seguridad | <a name="opsecc
## 16. 0Ps3C

### Reglas de [opsec](../raw/0ps3c-pr0.md)

**1. compartimentaliza todo**
- Una identidad para foros
- otra para Discord/Telegram
- Otra para email/correo
- Sin conexion entre identidades

**2. Horarios y patrones**
- No te conectes siempre a la misma hora
- No interactues en los mismos momentos que tu identidad real
- Los patrones te delatan mas que las herramientas

**3. Lenguaje y escritura**
- No uses tu lenguaje natural
- No uses las mismas expresiones
- Cambia de horario de escritura

**4. Fotos y metadatos**
- Elimina EXIF de todas las fotos
- No subas fotos que hayas tomado con tu celular
- No uses fotos de tus [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales

**5. Cross-site identity**
- No uses el mismo username en diferentes sitios
- No reuses contrasenas entre identidades
- No te registres con el mismo email

**6. Errores comunes**
- Olvidar cerrar sesion en servicios
- Dejar abierta la conexion [vpn](../raw/4n0n1m4t0.md#vpn) al cambiar de [red](../raw/r3d3s-f0nd4m3nt0s.md)
- Usar el [navegador](../raw/br0ws3r-3xpl01t4t10n.md) normal para cosas anonimas
- Descargar archivos mientras se navega anonimamente <a name="defensa-contra-analisis-de-trafico"></a>
## 17. D3f3ns4 c0ntr4 4n4l1s1s d3 Tr4f1c0

### Analisis de trafico
Incluso con [tor](../raw/4n0n1m4t0.md#tor), los atacantes pueden correlacionar patrones de trafico (timing analysis, size analysis).

### Defensas

**Traffic shaping:**
```
# Agregar latencia aleatoria
tc qdisc add dev eth0 root netem delay 100ms 50ms

# Padding de paquetes (tamanio fijo)
# I2P usa esto por defecto
```

**Tor con obfs4:** El trafico ya esta ofuscado

**[vpn](../raw/4n0n1m4t0.md#vpn) + Tor:** Doble capa de [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation)

**Uso de bridges:** Tu ISP no sabe que usas Tor

### Herramientas de defensa

```
# Ver que puertos/servicios estas exponiendo
nmap -sT -p 1-10000 localhost

# Cerrar servicios no necesarios
systemctl list-units --type=service --state=running | grep -v "systemd\|dbus\|tor"
``` <a name="eliminacion-de-metadatos"></a>
## 18. 3l1m1n4c10n d3 M3t4d4d4t0s

### Que metadatos existen?

**Imagenes:** GPS, camara, fecha, software
**Documentos:** Autor, empresa, fecha creado, revisiones
**PDFs:** Autor, software, metadatos XMP
**Musica:** Artista, album, genero, equipo de grabacion
**Videos:** Camara, GPS, fecha, codec

### Herramientas de limpieza

**exiftool (recomendado):**
```
# Ver metadatos
exiftool imagen.jpg

# Eliminar todos los metadatos
exiftool -all= imagen.jpg

# Eliminar solo GPS
exiftool -gps*= imagen.jpg

# Eliminar solo autor
exiftool -creator= -author= imagen.jpg

# Backup automatico (.original)
exiftool -all= -overwrite_original imagen.jpg

# Procesar directorio completo
exiftool -all= -r directorio/
```

**MAT (Metadata Anonymisation Toolkit):**
```
# GUI
mat-gui

# CLI
mat /path/to/file.pdf
mat -c /path/to/directory/

# Limpiar todos los archivos en directorio
find /path/to/files -type f -exec mat {} \;
```

### Stripping de metadatos en diferentes formatos

```
# PDF (qpdf)
qpdf --linearize --replace-input file.pdf

# Office (libreoffice --convert-to elimina metadatos)
# Python: python3 -m pip install python-docx
```

### Verificar que se eliminaron
```
exiftool -a -G1 cleaned_file.jpg | grep -i "gps\|author\|creator\|camera\|software"
[ -z "$(exiftool cleaned_file.jpg | grep -i 'GPS\|Author\|Creator\|Camera')" ] && echo "LIMPIO"
``` <a name="transacciones-con-criptomonedas"></a>
## 19. Trans4cc10n3s c0n Cr1pt0m0n3d4s

### Monero (XMR) — recomendado para privacidad
```
# Caracteristicas:
- Ring signatures (oculta origen)
- Stealth addresses (oculta destino)
- RingCT (oculta cantidad)
- Dandelion++ (oculta IP)
- Transacciones siempre privadas por defecto

# Instalacion monero wallet
wget https://downloads.getmonero.org/cli/linux64
tar xjf linux64
cd monero-x86_64-linux-gnu*
./monero-wallet-cli --daemon-address node.moneroworld.com:18089
```

### Bitcoin con privacidad
Bitcoin NO es anonimo por defecto. Todas las transacciones son publicas en la [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain).

```
# Mejores practicas para Bitcoin:
1. Comprar sin KYC (LocalCoinSwap, Bisq, HodlHodl)
2. Usar mixers/tumblers (Wasabi Wallet, Samourai Whirlpool)
3. No reusar direcciones
4. Cambiar entre monedas (BTC -> XMR -> BTC)
5. CoinJoin (transacciones conjuntas)

# Wasabi Wallet (CoinJoin integrado)
wget https://wasabiwallet.io/
dotnet run
```

### Comparacion de monedas

| Moneda | Privacidad por defecto | Trazabilidad | Uso recomendado |
|--------|----------------------|-------------|-----------------|
| Monero | Si | Muy baja | Pagos diarios |
| Zcash | Opcional | Media | Privacidad selectiva |
| Bitcoin | No | Alta | Con mixers |
| Litecoin | No | Alta | Rapido |
| Ethereum | No | Alta | Contratos | <a name="comunicaciones-seguras"></a>
## 20. C0mun1c4c10n3s s3gur4s

### Signal (recomendado para mensajeria)
```
- Cifrado end-to-end
- Perfect Forward Secrecy
- Codigo abierto
- Sin logs (minimos)
- No requiere numero de telefono real (Google Voice, etc.)
```

### SimpleX (alternativa a Signal sin numero)
```
- Sin ID global (no hay username/number)
- Cifrado E2E
- Colas de mensajes en relay servers
- Sin metadatos de destinatario
```

### Matrix / Element
```
- Descentralizado
- Cifrado E2E
- Self-hosted posible
- Bridges a otros protocolos
```

### Keybase
```
- Identidad vinculada a claves criptograficas
- Cifrado E2E en chats y archivos
- Prueba de identidades (Twitter, GitHub, etc.)
```

### PGP / GPG para email
```
# Generar clave
gpg --full-generate-key

# Enviar mensaje cifrado
gpg --encrypt --armor -r recipient@example.com mensaje.txt

# Descifrar
gpg --decrypt mensaje.asc

# Firmar
gpg --sign archivo.txt
gpg --verify archivo.txt.asc

# Cifrar para varios destinatarios
gpg --encrypt --armor -r alice@example.com -r bob@example.com mensaje.txt
``` <a name="checklist-completo"></a>
## 21. Ch3ckl1st C0mpl3t0

### Checklist diario

```
 Verificar que Tor esta funcionando: curl --socks5 127.0.0.1:9050 https://check.torproject.org/api
 DNS leak test: https://dnsleaktest.com/
 IP leak test: https://ipleak.net/
 Browser fingerprint test: https://panopticlick.eff.org/
 WebRTC leak test: https://browserleaks.com/webrtc
 Verificar plugins deshabilitados
 Verificar canvas fingerprinting bloqueado
 Verificar MAC address cambiada (si aplica)
 Verificar que no hay servicios expuestos: nmap -sT localhost
```

### Checklist de configuracion

```
 Tor Browser actualizado
 uBlock Origin + NoScript instalados
 CanvasBlocker activo
 WebRTC deshabilitado
 Terceras cookies rechazadas
 VPN kill switch configurado (si usas VPN)
 /etc/hostname no revela identidad
 Machine ID randomizado
 Metadatos de archivos eliminados
 Discos encriptados (LUKS)
```

### Errores fatales de opsecc

1. Usar el mismo username en diferentes servicios
2. Logearte en servicios personales desde [tor](../raw/4n0n1m4t0.md#tor)
3. Descargar archivos que contengan metadatos
4. Usar JavaScript habilitado
5. Conectarse a servicios sin httpss)
6. Reutilizar contrasenas
7. No verificar fugas [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)
8. Confiar solo en una capa de proteccion
9. Publicar fotos sin limpiar EXIF
10. Mantener sesiones abiertas ---

<a name="pr0y3ct0s-pr4ct1c0s"></a>
## Pr0y3ct0s Pr4ct1c0s

### Pr0y3ct0 1: T0r R3l4y M0n1t0r — Sc4nn3r d3 l4 R3d T0r

Script que monitorea y analiza la [red](../raw/r3d3s-f0nd4m3nt0s.md) [tor](../raw/4n0n1m4t0.md#tor), midiendo velocidad, circuitos, y detectando posibles problemas:

```bash
#!/bin/bash
# tor_monitor.sh - Monitoreo completo de la red Tor

CHECK_URL="https://check.torproject.org/api"
CONTROL_PORT="${TOR_CONTROL_PORT:-9051}"
SOCKS_PORT="${TOR_SOCKS_PORT:-9050}"

echo "╔══════════════════════════════════════╗"
echo "║ Tor Network Monitor v1.0 ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Verificar que Tor está corriendo
check_tor_running { if nc -z 127.0.0.1 $SOCKS_PORT 2>/dev/null; then echo "[✓] Tor SOCKS corriendo en 127.0.0.1:$SOCKS_PORT" return 0 else echo "[✗] Tor NO está corriendo en el puerto $SOCKS_PORT" echo " Inicialo con: sudo systemctl start tor" return 1 fi
}

# Verificar que Tor funciona correctamente
check_tor_connection { local result=$(curl --socks5 127.0.0.1:$SOCKS_PORT -s $CHECK_URL 2>/dev/null) if echo "$result" | grep -q '"IsTor":true'; then local ip=$(echo "$result" | grep -oP '"IP":"[^"]+"' | cut -d'"' -f4) echo "[✓] Conexión Tor verificada (IP de salida: $ip)" return 0 else echo "[✗] Tor no está funcionando correctamente" return 1 fi
}

# Obtener información del circuito actual
get_circuit_info { echo "" echo "=== Circuito Actual ===" echo "" # Usar nyx si está disponible if command -v nyx &>/dev/null; then echo "Para ver circuitos en vivo, ejecutá: nyx" echo "" fi # Intentar obtener info via control port if command -v tor-resolve &>/dev/null; then echo "Resolviendo DNS via Tor.." time tor-resolve google.com 2>/dev/null fi # Mostrar IP de salida local exit_ip=$(curl --socks5 127.0.0.1:$SOCKS_PORT -s https://ipinfo.io/json 2>/dev/null) if [ -n "$exit_ip" ]; then echo "" echo "IP de salida:" echo "$exit_ip" | python3 -m json.tool 2>/dev/null || echo "$exit_ip" fi
}

# Benchmarks de velocidad Tor
benchmark_tor { echo "" echo "=== Tor Speed Test ===" echo "" # Velocidad de descarga echo "Midiendo velocidad de descarga.." local start=$(date +%s%N) curl --socks5 127.0.0.1:$SOCKS_PORT -s -o /dev/null \ "https://proof.ovh.net/files/10Mb.dat" 2>/dev/null & local pid=$! sleep 2 kill $pid 2>/dev/null wait $pid 2>/dev/null local end=$(date +%s%N) local elapsed=$( (end - start) / 1000000 ) if [ $elapsed -lt 1000 ]; then echo "  Tiempo: ${elapsed}ms" echo "  Velocidad: ~${elapsed}ms para 10MB" else echo "  Tiempo: ${elapsed}ms ($(elapsed / 1000)s)" fi # Latencia echo "" echo "Midiendo latencia.." for i in 1 2 3 4 5; do local lat_start=$(date +%s%N) curl --socks5 127.0.0.1:$SOCKS_PORT -s -o /dev/null \ -w "%{time_total}" https://check.torproject.org/ 2>/dev/null local lat_end=$? echo "  Intento $i: completado" done
}

# Verificar puertos alternativos
check_ports { echo "" echo "=== Puertos Tor ===" echo "" for port in 9050 9051 9150 9151; do if nc -z 127.0.0.1 $port 2>/dev/null; then echo "[✓] Puerto $port: abierto" else echo " Puerto $port: cerrado" fi done
}

# Verificar bridges
check_bridges { if [ -f /etc/tor/torrc ]; then local bridges=$(grep "^Bridge" /etc/tor/torrc | wc -l) if [ $bridges -gt 0 ]; then echo "" echo "=== Bridges ===" echo "Bridges configurados: $bridges" grep "^Bridge" /etc/tor/torrc fi fi
}

# Main
check_tor_running || exit 1
check_tor_connection || exit 1
get_circuit_info
check_ports
check_bridges
benchmark_tor

echo ""
echo "══════════════════════════════════════"
echo "Monitoreo completado"
```

### Pr0y3ct0 2: [vpn](../raw/4n0n1m4t0.md#vpn) K1ll Sw1tch c0n 1pt4bl3s

Script que configura un kill [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) automático para cualquier VPN usando iptables:

```bash
#!/bin/bash
# vpn_killswitch.sh - Kill switch automático para VPN
# Previene fugas de IP si la VPN se cae

VPN_INTERFACE="${1:-wg0}"
VPN_PORT="${2:-51820}"
VPN_SERVER="${3}"

echo "╔══════════════════════════════════════╗"
echo "║ VPN Kill Switch v2.0 ║"
echo "╚══════════════════════════════════════╝"
echo ""

if [ "$EUID" -ne 0 ]; then echo "Este script necesita permisos de root" exit 1
fi

# Guardar reglas actuales
BACKUP_FILE="/tmp/iptables_backup_$(date +%s).txt"
iptables-save > "$BACKUP_FILE"
echo "[✓] Reglas actuales guardadas en $BACKUP_FILE"

# Función para limpiar reglas
cleanup { echo "" echo "[*] Restaurando reglas originales.." iptables-restore < "$BACKUP_FILE" ip6tables -P INPUT ACCEPT 2>/dev/null ip6tables -P OUTPUT ACCEPT 2>/dev/null ip6tables -P FORWARD ACCEPT 2>/dev/null echo "[✓] Reglas restauradas" exit 0
}

trap cleanup SIGINT SIGTERM

# Aplicar kill switch
apply_killswitch { echo "[*] Aplicando kill switch.." # Limpiar reglas existentes iptables -F iptables -X iptables -t nat -F iptables -t mangle -F # Política restrictiva iptables -P OUTPUT DROP iptables -P INPUT DROP iptables -P FORWARD DROP # Loopback iptables -A OUTPUT -o lo -j ACCEPT iptables -A INPUT -i lo -j ACCEPT # Permitir conexiones establecidas iptables -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT # Si tenemos servidor VPN, permitir solo a ese if [ -n "$VPN_SERVER" ]; then echo "[*] Modo restrictivo: solo conexión a $VPN_SERVER" iptables -A OUTPUT -o eth0 -d "$VPN_SERVER" -p udp --dport "$VPN_PORT" -j ACCEPT iptables -A INPUT -i eth0 -s "$VPN_SERVER" -p udp --sport "$VPN_PORT" -j ACCEPT else echo "[*] Modo semi-restrictivo: permitiendo conexión VPN a cualquier IP" iptables -A OUTPUT -o eth0 -p udp --dport "$VPN_PORT" -j ACCEPT fi # Permitir tráfico por la interfaz VPN iptables -A OUTPUT -o "$VPN_INTERFACE" -j ACCEPT iptables -A INPUT -i "$VPN_INTERFACE" -j ACCEPT # Bloquear DNS no-local iptables -A OUTPUT -p udp --dport 53 -j DROP iptables -A OUTPUT -p tcp --dport 53 -j DROP # Bloquear IPv6 completamente ip6tables -P INPUT DROP 2>/dev/null ip6tables -P OUTPUT DROP 2>/dev/null ip6tables -P FORWARD DROP 2>/dev/null echo "[✓] Kill switch activado"
}

# Verificar estado del kill switch
check_status { echo "" echo "=== Estado del Kill Switch ===" echo "" echo "Políticas actuales:" echo "  INPUT: $(iptables -L INPUT -n --line-numbers | head -1 | awk '{print $4}')" echo "  OUTPUT:  $(iptables -L OUTPUT -n --line-numbers | head -1 | awk '{print $4}')" echo "  FORWARD: $(iptables -L FORWARD -n --line-numbers | head -1 | awk '{print $4}')" echo "" echo "Reglas de OUTPUT:" iptables -L OUTPUT -n -v --line-numbers 2>/dev/null | tail -n +2 echo "" # Verificar que la VPN está funcionando if ip link show "$VPN_INTERFACE" 2>/dev/null | grep -q "UP"; then local vpn_ip=$(ip addr show "$VPN_INTERFACE" | grep "inet " | awk '{print $2}') echo "[✓] Interfaz $VPN_INTERFACE activa ($vpn_ip)" else echo "[!] Interfaz $VPN_INTERFACE NO está activa" echo " El tráfico está bloqueado por el kill switch" fi
}

# Verificar si hay fugas
check_leaks { echo "" echo "=== Verificación de Fugas ===" echo "" echo "1. IP pública (debería ser la IP de la VPN):" local public_ip=$(curl -s https://ipinfo.io/json 2>/dev/null) if [ -n "$public_ip" ]; then echo "$public_ip" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  IP: {d.get(\"ip\",\"?\")}, País: {d.get(\"country\",\"?\")}, ISP: {d.get(\"org\",\"?\")}')" 2>/dev/null fi echo "" echo "2. DNS Leak Test:" local dns_result=$(nslookup google.com 2>/dev/null | grep "Server:" | head -1) echo "  Servidor DNS: $dns_result" if echo "$dns_result" | grep -qv "127.0.0.1\|10."; then echo "  [!] POSIBLE FUGA DNS!" fi echo "" echo "3. WebRTC Leak (abrí en navegador):" echo "  https://browserleaks.com/webrtc" echo "" echo "4. IPv6 Leak:" local ipv6=$(curl -6 -s https://ipinfo.io/json 2>/dev/null) if [ -n "$ipv6" ]; then echo "  [!] IPv6 detectado → posible fuga" else echo "  [✓] Sin IPv6" fi
}

# Menú
case "${4:-apply}" in apply) apply_killswitch check_status check_leaks echo "" echo "[*] Kill switch activo. Presioná Ctrl+C para desactivar." echo "[*] Backup de reglas en: $BACKUP_FILE" # Mantener el script corriendo while true; do sleep 60; done ;; status) check_status check_leaks ;; stop) cleanup ;; *) echo "Uso: $0 [interfaz] [puerto] [servidor] [comando]" echo "  $0 wg0 51820 10.0.0.1 apply # Aplicar kill switch" echo "  $0 tun0 443 - status # Ver estado" echo "  $0 - - - stop # Detener kill switch" ;;
esac
```

### Pr0y3ct0 3: 4ut0m4t1z4d0r d3 L1mp13z4 d3 M3t4d4t0s

Script que limpia metadata de archivos automáticamente usando exiftool y MAT:

```python
#!/usr/bin/env python3
"""
metadata_cleaner.py - Limpieza automática de metadatos
Procesa archivos en busca de EXIF, GPS, autor, y más
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

class MetadataCleaner: SUPPORTED_EXTENSIONS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.heic': 'image/heic', '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.mov': 'video/quicktime', } def __init__(self, recursive=True, create_backup=True, verbose=False): self.recursive = recursive self.create_backup = create_backup self.verbose = verbose self.stats = { 'processed': 0, 'cleaned': 0, 'errors': 0, 'gps_found': 0, 'author_found': 0, } def get_exiftool_output(self, filepath): """Obtener metadatos con exiftool""" try: result = subprocess.run( ['exiftool', '-json', '-G', filepath], capture_output=True, text=True, timeout=30 ) if result.returncode == 0 and result.stdout: return json.loads(result.stdout)[0] return {} except Exception as e: if self.verbose: print(f"  Error leyendo {filepath}: {e}") return {} def analyze_metadata(self, filepath): """Analizar metadatos de un archivo""" data = self.get_exiftool_output(filepath) if not data: return {} findings = {} # GPS gps = {} for key in ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSImgDirection', 'GPSLatitudeRef', 'GPSLongitudeRef']: if key in data: gps[key] = data[key] if gps: findings['gps'] = gps self.stats['gps_found'] += 1 # Autor/creador author = {} for key in ['Author', 'Creator', 'CreatorTool', 'Producer', 'Artist', 'XMP:Author', 'XMP:Creator', 'IPTC:By-line']: if key in data: author[key] = data[key] if author: findings['author'] = author self.stats['author_found'] += 1 # Fechas dates = {} for key in ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'GPSDateStamp', 'GPSDateTime']: if key in data: dates[key] = data[key] if dates: findings['dates'] = dates # Software software = {} for key in ['Software', 'CameraModelName', 'Model']: if key in data: software[key] = data[key] if software: findings['software'] = software # Dispositivo device = {} for key in ['Make', 'Model', 'DeviceModelName']: if key in data: device[key] = data[key] if device: findings['device'] = device return findings def clean_file(self, filepath): """Limpiar metadatos de un archivo""" try: if self.create_backup: # Crear backup .original subprocess.run( ['exiftool', '-all=', '-overwrite_original', filepath], capture_output=True, timeout=30 ) else: # Sin backup subprocess.run( ['exiftool', '-all=', '-overwrite_original', filepath], capture_output=True, timeout=30 ) # Eliminar archivo .original si existe original = str(filepath) + "_original" if os.path.exists(original): os.remove(original) self.stats['cleaned'] += 1 return True except Exception as e: self.stats['errors'] += 1 if self.verbose: print(f"  Error limpiando {filepath}: {e}") return False def process_file(self, filepath): """Procesar un solo archivo""" ext = Path(filepath).suffix.lower if ext not in self.SUPPORTED_EXTENSIONS: return self.stats['processed'] += 1 size = os.path.getsize(filepath) if self.verbose: print(f"\n📄 {Path(filepath).name} ({size//1024}KB)") # Analizar findings = self.analyze_metadata(filepath) if findings: if self.verbose: print(f"  ⚠ Metadatos encontrados:") for category, items in findings.items: print(f" {category}:") for k, v in items.items: print(f" {k}: {v}") # Limpiar action = input(f"  ¿Limpiar metadatos? [Y/n]: ").lower if action != 'n': self.clean_file(filepath) print(f"  ✓ Limpiado") else: if self.verbose: print(f"  ✓ Sin metadatos sensibles") def process_directory(self, directory): """Procesar directorio recursivamente""" if self.recursive: files = Path(directory).rglob('*') else: files = Path(directory).glob('*') files = [f for f in files if f.suffix.lower in self.SUPPORTED_EXTENSIONS] if not files: print("No se encontraron archivos compatibles") return print(f"Procesando {len(files)} archivos..") print with ThreadPoolExecutor(max_workers=4) as executor: executor.map(self.process_file, files) def print_report(self): """Imprimir reporte final""" print print("=" * 50) print("REPORTE DE LIMPIEZA") print("=" * 50) print(f"  Archivos procesados: {self.stats['processed']}") print(f"  Archivos limpiados:  {self.stats['cleaned']}") print(f"  GPS encontrados: {self.stats['gps_found']}") print(f"  Autor encontrados: {self.stats['author_found']}") print(f"  Errores: {self.stats['errors']}") print("=" * 50) def scan_only(self, directory): """Solo escanear, sin limpiar""" files = Path(directory).rglob('*') if self.recursive else Path(directory).glob('*') files = [f for f in files if f.suffix.lower in self.SUPPORTED_EXTENSIONS] findings_summary = for filepath in files: findings = self.analyze_metadata(filepath) if findings: findings_summary.append({ 'file': str(filepath), 'size': os.path.getsize(filepath), 'findings': findings }) if self.verbose: print(f"\n📄 {filepath}:") for category, items in findings.items: print(f"  {category}:") for k, v in items.items: print(f" {k}: {v}") # Reporte JSON report = { 'scan_date': datetime.now.isoformat, 'directory': directory, 'files_with_metadata': len(findings_summary), 'files': findings_summary } report_file = f"metadata_scan_{datetime.now.strftime('%Y%m%d_%H%M%S')}.json" with open(report_file, 'w') as f: json.dump(report, f, indent=2) print(f"\nReporte guardado en: {report_file}") print(f"Archivos con metadatos: {len(findings_summary)}") if findings_summary: print("\nResumen rápido:") for item in findings_summary: cats = list(item['findings'].keys) print(f"  {Path(item['file']).name}: {', '.join(cats)}")

def main: parser = argparse.ArgumentParser(description="Metadata Cleaner Tool") parser.add_argument('target', help="Archivo o directorio a procesar") parser.add_argument('-r', '--recursive', action='store_true', help="Procesar recursivamente") parser.add_argument('-n', '--no-backup', action='store_true', help="No crear backups") parser.add_argument('-v', '--verbose', action='store_true', help="Modo verbose") parser.add_argument('--scan-only', action='store_true', help="Solo escanear, no limpiar") parser.add_argument('--auto', action='store_true', help="Limpiar automáticamente sin preguntar") args = parser.parse_args cleaner = MetadataCleaner( recursive=args.recursive, create_backup=not args.no_backup, verbose=args.verbose ) target = Path(args.target) if not target.exists: print(f"❌ {args.target} no existe") sys.exit(1) if args.scan_only: cleaner.scan_only(target) else: if target.is_file: cleaner.process_file(target) else: cleaner.process_directory(target) cleaner.print_report

if __name__ == "__main__": main
```

### Pr0y3ct0 4: s3rv1c10 0n10n c0N0 — Cr34d0r d3 H1dd3n S3rv1c3s

Script para crear y gestionar servicios .onion fácilmente:

```bash
#!/bin/bash
# onion_maker.sh - Crea y gestiona servicios .onion v3

HIDDEN_SERVICE_DIR="/var/lib/tor"
TORRC="/etc/tor/torrc"

echo "╔══════════════════════════════════════╗"
echo "║ Onion Service Maker v2.0 ║"
echo "╚══════════════════════════════════════╝"

if [ "$EUID" -ne 0 ]; then echo "Necesitás permisos de root" exit 1
fi

# Verificar que Tor está instalado
if ! command -v tor &>/dev/null; then echo "Tor no está instalado. Instalalo con:" echo "  sudo apt install tor" exit 1
fi

create_service { local name="$1" local local_port="$2" local service_dir="$HIDDEN_SERVICE_DIR/${name}_onion" echo "" echo "Creando servicio oculto: $name" echo "  Puerto local: $local_port" echo "  Directorio: $service_dir" echo "" # Crear directorio mkdir -p "$service_dir" chmod 700 "$service_dir" chown debian-tor:debian-tor "$service_dir" 2>/dev/null || true # Agregar a torrc echo "" >> "$TORRC" echo "# Servicio .onion: $name (creado $(date)" >> "$TORRC" echo "HiddenServiceDir $service_dir" >> "$TORRC" echo "HiddenServicePort 80 127.0.0.1:$local_port" >> "$TORRC" echo "" >> "$TORRC" # Reiniciar Tor echo "Reiniciando Tor.." systemctl restart tor if [ $? -eq 0 ]; then sleep 2 local onion=$(cat "$service_dir/hostname" 2>/dev/null) echo "" echo "✅ Servicio creado correctamente!" echo "  Dirección .onion: $onion" echo "  Puerto local: $local_port" echo "" echo "Configurá tu servicio web para escuchar en 127.0.0.1:$local_port" # Guardar info echo "$onion" > "${service_dir}/hostname.txt" echo "Creado: $(date)" >> "${service_dir}/hostname.txt" else echo "❌ Error al reiniciar Tor. Revisá los logs:" echo "  journalctl -u tor -n 20 --no-pager" fi
}

list_services { echo "" echo "=== Servicios .onion activos ===" echo "" local services=$(grep "HiddenServiceDir" "$TORRC" 2>/dev/null | awk '{print $2}') if [ -z "$services" ]; then echo "No hay servicios .onion configurados" return fi for dir in $services; do local onion="" local port="" if [ -f "$dir/hostname" ]; then onion=$(cat "$dir/hostname" 2>/dev/null) fi local port_line=$(grep -A1 "HiddenServiceDir $dir" "$TORRC" | grep "HiddenServicePort" 2>/dev/null) port=$(echo "$port_line" | awk '{print $NF}') echo "  📍 $dir" echo " .onion: ${onion:-sin generar}" echo " Puerto: ${port:-N/A}" echo "" done
}

delete_service { local name="$1" local service_dir="$HIDDEN_SERVICE_DIR/${name}_onion" echo "" echo "Eliminando servicio: $name" if [ ! -d "$service_dir" ]; then echo "❌ El servicio $name no existe" return fi # Backup de clave privada local backup_dir="/tmp/onion_backup_$(date +%s)" mkdir -p "$backup_dir" cp "$service_dir/private_key" "$backup_dir/" 2>/dev/null cp "$service_dir/hostname" "$backup_dir/" 2>/dev/null echo "  Backup de claves en: $backup_dir" # Eliminar directorio rm -rf "$service_dir" # Eliminar de torrc sed -i "/HiddenServiceDir $service_dir/d" "$TORRC" sed -i "/HiddenServicePort.*127.0.0.1:$1/d" "$TORRC" # Reiniciar Tor systemctl restart tor echo "✅ Servicio eliminado"
}

backup_keys { local backup_dir="/root/onion_backups/$(date +%Y%m%d)" mkdir -p "$backup_dir" echo "" echo "Backupeando todas las claves .onion.." echo "" local services=$(grep "HiddenServiceDir" "$TORRC" 2>/dev/null | awk '{print $2}') for dir in $services; do local name=$(basename "$dir" _onion) if [ -f "$dir/private_key" ]; then cp "$dir/private_key" "$backup_dir/${name}_private_key.pem" cp "$dir/hostname" "$backup_dir/${name}_hostname.txt" echo "  ✓ $name: $(cat "$dir/hostname")" fi done echo "" echo "Backup guardado en: $backup_dir" echo "NO compartas las private_keys con NADIE"
}

# Menú
case "${1:-list}" in create) if [ -z "$2" ] || [ -z "$3" ]; then echo "Uso: $0 create <nombre> <puerto_local>" echo "Ej: $0 create webserver 8080" exit 1 fi create_service "$2" "$3" ;; list) list_services ;; delete) if [ -z "$2" ]; then echo "Uso: $0 delete <nombre>" echo "Ej: $0 delete webserver" exit 1 fi delete_service "$2" ;; backup) backup_keys ;; *) echo "Uso: $0 {create|list|delete|backup}" echo "" echo "Comandos:" echo "  $0 create <nombre> <puerto> Crear servicio .onion" echo "  $0 list Listar servicios activos" echo "  $0 delete <nombre> Eliminar servicio" echo "  $0 backup Backup de todas las claves" ;;
esac
```

---

*Documento generado para fines educativos y de investigación en seguridad.*
*Versión: 3.0 — [anonimato](../raw/4n0n1m4t0.md) en Red completo + Proyectos Prácticos*
*Última actualización: Mayo 2026* ### Verificacion final

`
# Test completo de anonimato
curl --socks5 127.0.0.1:9050 httpss)://check.torproject.org/api
dig +short myip.opendns.[com](../raw/w1n-s9bsyst3ms.md#com) @resolver1.opendns.[com](../raw/w1n-s9bsyst3ms.md#com)
curl -s [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://ipinfo.io/json
curl -s https://browserleaks.com/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)
`

*Documento actualizado: Mayo 2026.*
*Proposito educativo. No uses esto para actividades ilegales.* ## Mas herramientas de anonimato

### I2P (Invisible Internet Project)
- red de superposicion con cifradoc garlic
- Ideal para torrenting y servicios internos
- Mayor latencia que Tor pero mejor anonimato
- Cada nodo aumenta el anonimato
- i2prouter start para iniciar

### Freenet
- Red peer-to-peer orientada a publicacion anonima
- Almacenamiento distribuido de datos
- Resistente a censura
- Ideal para foros y sitios estaticos

### Lokinet (Oxen Network)
- Basado en [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) (Service Nodes)
- Onion routing similar a Tor
- Bajas latencias
- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) sobre Lokinet (.loki dominios)

### vpn over Tor vs Tor over VPN

**VPN -> Tor (Tor over VPN):**
- Tu ISP ve que usas VPN (no sabe que usas Tor)
- El nodo exit de Tor ve tu trafico
- La VPN sabe tu ip real

**Tor -> VPN (VPN over Tor):**
- Tu ISP sabe que usas Tor
- La VPN no sabe tu IP real (ve IP del exit node)
- El sitio web ve la IP de la VPN
- Recomendado para ocultar tu IP del sitio destino

### [[proxychains](../raw/4n0n1m4t0.md#proxychains)](./raw/ avanzado
```
# /etc/proxychains.conf
strict_chain
proxy_dns
tcp_read_time_out 30000
tcp_connect_time_out 8000

[ProxyList]
socks4 127.0.0.1 9050
socks5 127.0.0.1 1080
http proxy.example.com 8080

# Uso
proxychains4 nmap -sT -Pn -p 80,443 target.com
proxychains4 curl https://check.torproject.org/
```

### Separacion completa (multi-VM)

Configuracion recomendada para maximo anonimato:
1. Host: Qubes OS
2. ProxyVM 1: VPN (WireGuard a provider sin logs)
3. ProxyVM 2: [whonix](../raw/4n0n1m4t0.md#whonix)-Gateway (Tor)
4. AppVM: Whonix-Workstation (navegacion)
5. AppVM 2: [tails](../raw/4n0n1m4t0.md#tails) en VM (tareas sensibles)
6. AppVM 3: VM desechable (descargas, archivos)

Cada VM tiene acceso de red solo a traves de los proxyVMs.
Sin comunicacion directa entre AppVMs.


