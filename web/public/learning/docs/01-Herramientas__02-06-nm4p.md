## Indice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (3225 lineas)


1. [Conceptos Fundamentales — TCP 3-Way Handshake](#conceptos-fundamentales-tcp-3-way-handshake)
    - [Three-Way Handshake Normal](#three-way-handshake-normal)
    - [Cómo Aprovecha Nmap el Handshake](#cmo-aprovecha-nmap-el-handshake)
    - [Estados de Puerto](#estados-de-puerto)
2. [Instalación](#instalacin)
3. [Descubrimiento de Hosts](#descubrimiento-de-hosts)
    - [Técnicas de Discovery](#tcnicas-de-discovery)
4. [Tipos de Escaneo](#tipos-de-escaneo)
    - [SYN Scan (Sigiloso, Default con Root)](#syn-scan-sigiloso-default-con-root)
    - [Connect Scan (Completa Conexión)](#connect-scan-completa-conexin)
    - [UDP Scan](#udp-scan)
    - [ACK Scan (Firewall Detection)](#ack-scan-firewall-detection)
    - [FIN/NULL/Xmas (Evasión Básica)](#finnullxmas-evasin-bsica)
5. [Escaneo de Puertos](#escaneo-de-puertos)
6. [Detección de Servicios y Versiones](#deteccin-de-servicios-y-versiones)
7. [Detección de Sistema Operativo](#deteccin-de-sistema-operativo)
8. [NSE — Nmap Scripting Engine](#nse-nmap-scripting-engine)
    - [Categorías](#categoras)
    - [Scripts por Servicio](#scripts-por-servicio)
    - [NSE Script Writing en Lua](#nse-script-writing-en-lua)
9. [Timing y Performance](#timing-y-performance)
    - [Niveles de Timing (T0-T5)](#niveles-de-timing-t0-t5)
    - [Opciones Manuales de Performance](#opciones-manuales-de-performance)
    - [Performance para Grandes Redes](#performance-para-grandes-redes)
10. [Firewall Evasión](#firewall-evasin)
    - [Técnicas de Evasión](#tcnicas-de-evasin)
    - [IDS Evasión Estrategias](#ids-evasin-estrategias)
11. [Output y Procesamiento](#output-y-procesamiento)
    - [Formatos de Output](#formatos-de-output)
    - [Verbosidad y Debug](#verbosidad-y-debug)
    - [Procesamiento de Output](#procesamiento-de-output)
    - [Procesar XML con Python](#procesar-xml-con-python)
12. [Ejemplos Prácticos](#ejemplos-prcticos)
    - [Descubrir todos los dispositivos en tu red](#descubrir-todos-los-dispositivos-en-tu-red)
    - [Escanear un servidor web a fondo](#escanear-un-servidor-web-a-fondo)
    - [Escanear todo con detección de OS](#escanear-todo-con-deteccin-de-os)
    - [Buscar EternalBlue (MS17-010)](#buscar-eternalblue-ms17-010)
    - [Escaneo sigiloso](#escaneo-sigiloso)
    - [Escaneo UDP de servicios comunes](#escaneo-udp-de-servicios-comunes)
    - [Detectar vulnerabilidades HTTP](#detectar-vulnerabilidades-http)
    - [Enumerar usuarios SMB](#enumerar-usuarios-smb)
    - [Verificar config SSL](#verificar-config-ssl)
    - [Enumeración completa](#enumeracin-completa)
13. [Escaneo a través de Tor/Proxies](#escaneo-a-travs-de-torproxies)
    - [Con Tor (SOCKS5)](#con-tor-socks5)
    - [Con HTTP Proxy](#con-http-proxy)
    - [Limitaciones de escaneo por proxy](#limitaciones-de-escaneo-por-proxy)
14. [IPv6 Scanning](#ipv6-scanning)
15. [Zenmap — Interfaz Gráfica](#zenmap-interfaz-grfica)
16. [Nmap en Cloud (AWS/Azure/GCP)](#nmap-en-cloud-awsazuregcp)
17. [Nmap en Scripts y Automatización](#nmap-en-scripts-y-automatizacin)
    - [Wrapper en Bash](#wrapper-en-bash)
18. [Comparación con Otras Herramientas](#comparacin-con-otras-herramientas)
    - [masscan](#masscan)
    - [rustscan](#rustscan)
    - [unicornscan](#unicornscan)
    - [zmap](#zmap)
19. [Troubleshooting y Errores Comunes](#troubleshooting-y-errores-comunes)
    - ["Failed to resolve host"](#failed-to-resolve-host)
    - ["You requested a scan type which requires root privileges"](#you-requested-a-scan-type-which-requires-root-privileges)
    - ["Failed to open network interface"](#failed-to-open-network-interface)
    - ["Host seems down"](#host-seems-down)
    - ["Too many ICMP messages"](#too-many-icmp-messages)
    - [Resultados inconsistentes](#resultados-inconsistentes)
    - [Nmap en Windows](#nmap-en-windows)
20. [Seguridad al Usar Nmap](#seguridad-al-usar-nmap)
21. [Interpretación de Puertos](#interpretacin-de-puertos)
22. [Referencia Rápida de Flags](#referencia-rpida-de-flags)
23. [Ncat — El Netcat Moderno de Nmap](#ncat-el-netcat-moderno-de-nmap)
    - [Nmap en AWS](#nmap-en-aws)
    - [Nmap en Azure](#nmap-en-azure)
    - [Nmap en GCP](#nmap-en-gcp)
    - [Nmap con Docker](#nmap-con-docker)
    - [Nmap con Kubernetes](#nmap-con-kubernetes)
24. [Nmap en DevOps y CI/CD](#nmap-en-devops-y-cicd)
25. [Raw Packet Crafting con Nping](#raw-packet-crafting-con-nping)
    - [TCP Packet Crafting](#tcp-packet-crafting)
    - [UDP Packet Crafting](#udp-packet-crafting)
    - [ICMP Packet Crafting](#icmp-packet-crafting)
    - [ARP Packet Crafting](#arp-packet-crafting)
    - [Route Tracking](#route-tracking)
    - [Performance Testing](#performance-testing)
26. [Referencia Completa de Scripts NSE por Protocolo](#referencia-completa-de-scripts-nse-por-protocolo)
    - [Scripts HTTP (50+ scripts)](#scripts-http-50-scripts)
    - [Scripts SMB (30+ scripts)](#scripts-smb-30-scripts)
    - [Scripts FTP (15+ scripts)](#scripts-ftp-15-scripts)
    - [Scripts DNS (15+ scripts)](#scripts-dns-15-scripts)
    - [Scripts SSH (10+ scripts)](#scripts-ssh-10-scripts)
    - [Scripts MySQL (10+ scripts)](#scripts-mysql-10-scripts)
    - [Scripts MSSQL (15+ scripts)](#scripts-mssql-15-scripts)
    - [Scripts Oracle (15+ scripts)](#scripts-oracle-15-scripts)
    - [Scripts LDAP (10+ scripts)](#scripts-ldap-10-scripts)
    - [Scripts SMTP/POP3/IMAP (10+ scripts)](#scripts-smtppop3imap-10-scripts)
    - [Scripts RDP/VNC (10+ scripts)](#scripts-rdpvnc-10-scripts)
    - [Scripts SNMP (15+ scripts)](#scripts-snmp-15-scripts)
    - [Scripts DHCP/Kerberos (5+ scripts)](#scripts-dhcpkerberos-5-scripts)
    - [Scripts Telnet (5+ scripts)](#scripts-telnet-5-scripts)
    - [Scripts MongoDB/Redis (5+ scripts)](#scripts-mongodbredis-5-scripts)
27. [Nmap para Mobile e IoT](#nmap-para-mobile-e-iot)
    - [Escaneo de Dispositivos Android](#escaneo-de-dispositivos-android)
    - [Escaneo de iOS](#escaneo-de-ios)
    - [Protocolos IoT](#protocolos-iot)
    - [Embedded Device Fingerprinting](#embedded-device-fingerprinting)
28. [Output Processing y Visualización](#output-processing-y-visualizacin)
    - [Procesamiento Avanzado con Python](#procesamiento-avanzado-con-python)
    - [Reportes HTML con Jinja2](#reportes-html-con-jinja2)
    - [Elasticsearch/Kibana Integration](#elasticsearchkibana-integration)
    - [Email Alerts from Scan Changes](#email-alerts-from-scan-changes)
    - [Errores de Resolución de Nombres](#errores-de-resolucin-de-nombres)
    - [Errores de Permisos](#errores-de-permisos)
    - [Errores de Conexión](#errores-de-conexin)
    - [Errores de Firewall/Rate-Limit](#errores-de-firewallrate-limit)
    - [Errores de Script NSE](#errores-de-script-nse)
    - [Análisis de Paquetes con Wireshark](#anlisis-de-paquetes-con-wireshark)
    - [Niveles de Debug (-d1 a -d9)](#niveles-de-debug-d1-a-d9)
    - [Escenarios de Troubleshooting](#escenarios-de-troubleshooting)
29. [Nmap con Nmap-vulners y Vulscan](#nmap-con-nmap-vulners-y-vulscan)
    - [Instalar nmap-vulners](#instalar-nmap-vulners)
    - [Instalar Vulscan](#instalar-vulscan)
    - [Pipeline Automatizado de Vulnerabilidades](#pipeline-automatizado-de-vulnerabilidades)
30. [Comparación de Escáneres de Red](#comparacin-de-escneres-de-red)
    - [masscan](#masscan)
    - [rustscan](#rustscan)
    - [zmap](#zmap)
    - [unicornscan](#unicornscan)
    - [Benchmark de Velocidad (Subred /24, SYN scan, top-1000)](#benchmark-de-velocidad-subred-24-syn-scan-top-1000)
    - [Script para Correr Múltiples Escáneres](#script-para-correr-mltiples-escneres)
31. [NSE Script Writing Reference — Referencia Completa de Lua](#nse-script-writing-reference-referencia-completa-de-lua)
    - [Tipos de Reglas](#tipos-de-reglas)
    - [Librerías Esenciales](#libreras-esenciales)
    - [Funciones Clave de stdnse](#funciones-clave-de-stdnse)
    - [Funciones Clave de nmap](#funciones-clave-de-nmap)
    - [Portrule Types](#portrule-types)
    - [Thread Management (Mutexes)](#thread-management-mutexes)
    - [Error Handling](#error-handling)
    - [Credential Brute-Forcing Framework](#credential-brute-forcing-framework)
    - [Registry para Compartir Datos](#registry-para-compartir-datos)
32. [Corporate Network Scanning Strategies](#corporate-network-scanning-strategies)
    - [Escaneo a Través de VLANs](#escaneo-a-travs-de-vlans)
    - [Escaneo a Través de VPN](#escaneo-a-travs-de-vpn)
    - [Escaneo Programado (Scheduled Scans)](#escaneo-programado-scheduled-scans)
    - [Compliance Scanning (PCI-DSS, HIPAA, SOC2)](#compliance-scanning-pci-dss-hipaa-soc2)
    - [Agent-Based vs Agentless](#agent-based-vs-agentless)
    - [Seguridad al Usar Nmap](#seguridad-al-usar-nmap)
    - [Escaneo de Redes Corporativas Grandes](#escaneo-de-redes-corporativas-grandes)
    - [Wrapper en Bash](#wrapper-en-bash)
    - [Wrapper en PowerShell](#wrapper-en-powershell)
    - [Automatización con Python](#automatizacin-con-python)
    - [Descubrir todos los dispositivos en tu red](#descubrir-todos-los-dispositivos-en-tu-red)
    - [Escanear un servidor web a fondo](#escanear-un-servidor-web-a-fondo)
    - [Escanear todo con detección de OS](#escanear-todo-con-deteccin-de-os)
    - [Buscar EternalBlue (MS17-010)](#buscar-eternalblue-ms17-010)
    - [Escaneo sigiloso](#escaneo-sigiloso)
    - [Escaneo UDP de servicios comunes](#escaneo-udp-de-servicios-comunes)
    - [Detectar vulnerabilidades HTTP](#detectar-vulnerabilidades-http)
    - [Enumerar usuarios SMB](#enumerar-usuarios-smb)
    - [Verificar config SSL](#verificar-config-ssl)
    - [Enumeración completa](#enumeracin-completa)

---

# Nmap — Escaneo de Redes

[nmap](../raw/nm4p.md) (Network Mapper) es la herramienta estándar para descubrimiento de [redes](../raw/r3d3s-f0nd4m3nt0s.md) y auditoría de seguridad. Te permite encontrar dispositivos en una [red](../raw/r3d3s-f0nd4m3nt0s.md), detectar puertos abiertos, identificar servicios y sus versiones, determinar el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos), y ejecutar scripts para detectar vulnerabilidades.

## Conceptos Fundamentales — [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) 3-Way [handshake](../raw/w1f1-4tt4cks.md#handshake)

Para entender cómo funcionan los distintos tipos de escaneo de [nmap](../raw/nm4p.md), primero tenés que entender el three-way handshake de TCP.

### Three-Way Handshake Normal

1. El cliente manda un paquete **SYN** (synchronize) al servidor.
2. Si el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) está abierto, el servidor responde con **SYN-ACK**.
3. El cliente responde con **ACK** — la conexión está establecida.

### Cómo Aprovecha Nmap el Handshake

| Scan Type | Envía | Recibe (abierto) | Recibe (cerrado) | Filtrado |
|-----------|-------|-----------------|-----------------|----------|
| SYN (-sS) | SYN | SYN-ACK -> RST | RST | Timeout |
| Connect (-sT) | SYN | SYN-ACK (completa) | RST | Timeout |
| FIN (-sF) | FIN | Nada (timeout) | RST | Timeout |
| NULL (-sN) | Sin flags | Nada (timeout) | RST | Timeout |
| Xmas (-sX) | FIN+PSH+URG | Nada (timeout) | RST | Timeout |
| ACK (-sA) | ACK | RST (TTL>64) | RST (TTL<64) | Timeout |

### Estados de Puerto

- **open**: Puerto abierto aceptando conexiones
- **closed**: Puerto cerrado (responde RST)
- **filtered**: [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) bloquea (timeout o ICMP unreachable)
- **unfiltered**: Accesible pero estado indeterminado (solo -sA)
- **open|filtered**: Abierto o filtrado ([udp](../raw/r3d3s-f0nd4m3nt0s.md#udp), FIN, NULL, Xmas)

## Instalación

```bash
# Windows: descargar de https://nmap.org/download.html
# Linux (Debian/Ubuntu)
sudo apt update && sudo apt install nmap -y

# macOS
brew install nmap

# Verificar
nmap --version
```

## Descubrimiento de Hosts

Antes de escanear puertos, necesitás saber qué hosts están activos.

```bash
# Escanear subred completa
nmap -sn 192.168.1.0/24

# Ping sweep (rápido)
nmap -sn 192.168.1.1-254

# Sin ping (asume hosts up)
nmap -Pn 192.168.1.0/24

# Solo hosts con puerto específico abierto
nmap -p 80 192.168.1.0/24

# Escanear IPs de un archivo
nmap -sn -iL ips.txt
```

### Técnicas de Discovery

```bash
# Solo con ICMP echo (ping tradicional)
nmap -PE -sn 192.168.1.0/24

# ICMP timestamp (a veces no bloqueado)
nmap -PP -sn 192.168.1.0/24

# TCP SYN al puerto 80
nmap -PS80 -sn 192.168.1.0/24

# TCP ACK al puerto 443
nmap -PA443 -sn 192.168.1.0/24

# UDP al puerto 53 (DNS)
nmap -PU53 -sn 192.168.1.0/24

# ARP scan (más rápido en red local)
nmap -PR -sn 192.168.1.0/24
```

## Tipos de Escaneo

### SYN Scan (Sigiloso, Default con Root)

```bash
nmap -sS 192.168.1.1
```

**Paso a paso:**
1. [nmap](../raw/nm4p.md) manda SYN al [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) destino.
2. SYN-ACK -> abierto. Inmediatamente RST (no completa el [handshake](../raw/w1f1-4tt4cks.md#handshake)).
3. RST -> cerrado.
4. Timeout -> filtrado ([firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)).

**Ventajas**: Rápido, sigiloso, no deja registro en apps.
**Desventajas**: Requiere root (raw sockets).

### Connect Scan (Completa Conexión)

```bash
nmap -sT 192.168.1.1
```

Completa el three-way handshake entero. La app registra la conexión.

**Cuándo usarlo:**
- Sin [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de root.
- En Windows (SYN scan no funciona bien).
- Cuando necesitás tráfico que parezca normal.

### [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) Scan

```bash
nmap -sU --top-ports 20 192.168.1.1
nmap -sU -p 53,67-68,123,161,500 192.168.1.1
```

**Por qué es lento**: UDP no tiene handshake. Hay que esperar timeout por cada puerto.

**Pro tips:**
- Usá `--host-timeout` para no quedarte colgado.
- Escaneá solo UDP que te interesen (no -p- con UDP).
- Usá `--max-retries 1`.

### ACK Scan (Firewall Detection)

```bash
nmap -sA 192.168.1.1
```

No detecta puertos abiertos, sino que mapea reglas de firewall. Un ACK sin conexión previa siempre recibe RST si no hay firewall.

### FIN/NULL/Xmas (Evasión Básica)

```bash
nmap -sF 192.168.1.1    # FIN
nmap -sN 192.168.1.1    # NULL (sin flags)
nmap -sX 192.168.1.1    # Xmas (FIN+PSH+URG)
```

**Limitaciones:**
- Windows siempre responde RST (no cumple RFC 793).
- Firewalls modernos bloquean estos paquetes.
- Linux moderno también responde RST.

## [escaneo de puertos](../raw/nm4p.md#escaneo-de-puertos)

```bash
# Top 1000 puertos (default)
nmap 192.168.1.1

# Todos los puertos (65535) - MUY lento
nmap -p- 192.168.1.1

# Top 100 puertos
nmap --top-ports 100 192.168.1.1

# Rango de puertos
nmap -p 1-1000 192.168.1.1

# Puertos específicos
nmap -p 22,80,443,8080 192.168.1.1

# Por nombre de servicio
nmap -p http,https,ssh 192.168.1.1

# Excluir puertos
nmap --exclude-ports 22,23 192.168.1.1
```

## Detección de Servicios y Versiones

```bash
# Detectar versiones (intensidad default 7)
nmap -sV 192.168.1.1

# Intensidad 1-9
nmap -sV --version-intensity 9 192.168.1.1   # Máximo
nmap -sV --version-light 192.168.1.1          # Rápido
nmap -sV --version-all 192.168.1.1            # Todos los probes
```

**Salida típica:**
```
PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.9p1 Ubuntu 3
80/tcp   open  http       Apache httpd 2.4.57
443/tcp  open  ssl/http   Apache httpd 2.4.57
```

## Detección de [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos)

```bash
nmap -O 192.168.1.1
nmap -O --osscan-limit 192.168.1.1     # Más rápido
nmap -O --osscan-guess 192.168.1.1     # Más agresivo
nmap -A 192.168.1.1                    # Todo en uno
```

**Factores que afectan precisión:**
- [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat): ves el [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat), no el host real.
- Firewalls modifican TTL y window size.
- VMs tienen fingerprints distintos.
- [docker](../raw/d0ck3r-f0r-h4ck3rs.md) muestra el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) del host.

## NSE — [nmap](../raw/nm4p.md) [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) Engine

### Categorías

```bash
nmap --script "default"        # (-sC)
nmap --script "safe"           # No intrusivos
nmap --script "intrusive"      # Pueden afectar servicios
nmap --script "vuln"           # Vulnerabilidades
nmap --script "exploit"        # Exploits (PELIGROSO)
nmap --script "auth"           # Bypass de auth
nmap --script "brute"          # Fuerza bruta
nmap --script "discovery"      # Descubrimiento
nmap --script "dos"            # Denial of Service (PELIGROSO)
nmap --script "malware"        # Backdoors/malware
nmap --script "broadcast"      # Broadcast local
nmap --script "external"       # Servicios externos
nmap --script "default or safe"
nmap --script "vuln and safe"
nmap --script "not intrusive"
```

### Scripts por Servicio

```bash
# HTTP/Web
nmap --script http-enum 192.168.1.1              # Directorios
nmap --script http-headers 192.168.1.1           # Headers
nmap --script http-methods 192.168.1.1           # Métodos HTTP
nmap --script http-title 192.168.1.1             # Título
nmap --script http-sql-injection 192.168.1.1     # SQLi
nmap --script http-xss 192.168.1.1               # XSS
nmap --script http-shellshock 192.168.1.1        # Shellshock
nmap --script http-wordpress-enum 192.168.1.1    # WP plugins

# FTP
nmap --script ftp-anon 192.168.1.1               # Login anónimo
nmap --script ftp-brute 192.168.1.1              # Fuerza bruta
nmap --script ftp-vsftpd-backdoor 192.168.1.1    # vsftpd backdoor

# SMB/Windows
nmap --script smb-enum-shares 192.168.1.1        # Shares
nmap --script smb-enum-users 192.168.1.1         # Usuarios
nmap --script smb-os-discovery 192.168.1.1       # Versión Windows
nmap --script smb-vuln-ms17-010 192.168.1.1      # EternalBlue
nmap --script smb2-security-mode 192.168.1.1     # SMB2 config

# SSH
nmap --script ssh-hostkey 192.168.1.1            # Host key
nmap --script ssh-auth-methods 192.168.1.1       # Auth methods
nmap --script ssh2-enum-algos 192.168.1.1        # Algoritmos
nmap --script ssh-brute 192.168.1.1              # Fuerza bruta

# SSL/TLS
nmap --script ssl-enum-ciphers 192.168.1.1       # Ciphers
nmap --script ssl-heartbleed 192.168.1.1         # Heartbleed
nmap --script ssl-cert 192.168.1.1               # Certificado info

# DNS
nmap --script dns-brute 192.168.1.1              # Subdominios
nmap --script dns-zone-transfer 192.168.1.1      # Zone transfer
nmap --script dns-enum 192.168.1.1               # Enumeración

# MySQL
nmap --script mysql-empty-password 192.168.1.1   # Root sin pass
nmap --script mysql-users 192.168.1.1            # Usuarios
nmap --script mysql-databases 192.168.1.1        # Bases de datos

# MongoDB
nmap --script mongodb-info 192.168.1.1           # Info MongoDB

# RDP
nmap --script rdp-enum-encryption 192.168.1.1    # Cifrado
nmap --script rdp-vuln-ms12-020 192.168.1.1      # MS12-020

### NSE Script Writing en Lua

Los scripts NSE van en `/usr/share/nmap/scripts/` y se escriben en Lua.

```lua
-- mi_script.nse
description = [[
Descripción de lo que hace el script
]]

author = "Tu Nombre"
license = "Same as Nmap--See [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://nmap.org/book/man-legal.html"
categories = {"safe", "discovery"}

-- [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)/s que activan el script
portrule = function(host, port)
    return port.protocol == "[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)" and port.number == 80
end

-- Acción principal
action = function(host, port)
    local socket = nmap.new_socket()
    socket:connect(host.[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), port.number)
    socket:send("GET / [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/1.1\r\nHost: " .. host.ip .. "\r\n\r\n")
    local response = socket:receive_lines(1)
    socket:close()
    if response then
        return "Banner: " .. response
    end
    return "No response"
end
```

#### Cómo probar tu script

```bash
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) cp mi_script.nse /usr/share/nmap/scripts/
sudo nmap --script-updatedb
nmap --script ./mi_script.nse 192.168.1.1    # Desde directorio actual
nmap -d2 --script ./mi_script.nse 192.168.1.1  # Debug mode
```

## Timing y Performance

### Niveles de Timing (T0-T5)

```bash
nmap -T0 192.168.1.1     # Paranoid - 5 min entre probes, HORAS por scan
nmap -T1 192.168.1.1     # Sneaky - 15 seg entre probes
nmap -T2 192.168.1.1     # Polite - 0.4 seg entre probes
nmap -T3 192.168.1.1     # Normal (default)
nmap -T4 192.168.1.1     # Aggressive - timeouts cortos
nmap -T5 192.168.1.1     # Insane - timeouts muy cortos, puede perder puertos
```

### Opciones Manuales de Performance

```bash
# Host timeout
nmap --host-timeout 5m 192.168.1.0/24

# RTT timeout
nmap --max-rtt-timeout 200ms 192.168.1.1
nmap --initial-rtt-timeout 500ms 192.168.1.1

# Paralelismo
nmap --min-hostgroup 64 192.168.1.0/24
nmap --max-hostgroup 256 192.168.1.0/24
nmap --min-parallelism 10 192.168.1.1
nmap --max-parallelism 100 192.168.1.1

# Retries
nmap --max-retries 1 192.168.1.1     # Rápido, menos preciso
nmap --max-retries 3 192.168.1.1     # Default
nmap --max-retries 10 192.168.1.1    # Confiable, lento

# Delays
nmap --scan-delay 1s 192.168.1.1     # Espera entre probes
nmap --max-scan-delay 10s 192.168.1.1
```

### Performance para Grandes Redes

```bash
# /24 rápida
nmap -T4 -F 192.168.1.0/24           # ~30-60 seg

# /24 con versiones
nmap -T4 -sV --top-ports 100 192.168.1.0/24  # ~5-10 min

# /16 solo discovery
nmap -sn -T4 10.0.0.0/16             # ~5-15 min

# /16 paralelismo agresivo
nmap -T5 --min-hostgroup 256 --min-parallelism 50 -sn 10.0.0.0/16

# Particionar escaneos
echo "10.0.0.0/24" > subredes.txt
echo "10.0.1.0/24" >> subredes.txt
nmap -iL subredes.txt -T4 -F
```

## Firewall Evasión

### Técnicas de Evasión

```bash
# Fragmentación de paquetes
nmap -f 192.168.1.1                        # Fragmenta en 8 bytes
nmap -f -f 192.168.1.1                     # Aún más pequeños
nmap --mtu 16 192.168.1.1                  # MTU personalizado

# Decoy (falsas IPs de origen)
nmap -D 192.168.1.10,192.168.1.20,ME 192.168.1.1
nmap -D RND:5 192.168.1.1                  # 5 [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) aleatorias
nmap -D 192.168.1.10-20 192.168.1.1        # Rango de IPs

# Source port específico
nmap --source-port 53 192.168.1.1          # [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) (confiable)
nmap --source-port 20 192.168.1.1          # FTP data
nmap --source-port 67 192.168.1.1          # [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp)

# Spoof de MAC
nmap --spoof-mac Apple 192.168.1.1
nmap --spoof-mac Cisco 192.168.1.1
nmap --spoof-mac 00:11:22:33:44:55 192.168.1.1

# Data length (rellenar paquetes)
nmap --data-length 200 192.168.1.1

# TTL personalizado
nmap --ttl 128 192.168.1.1                 # Windows-like
nmap --ttl 64 192.168.1.1                  # Linux-like

# Bad checksum
nmap --badsum 192.168.1.1
```

### IDS Evasión Estrategias

```bash
# Escaneo extremadamente lento
nmap -T1 --max-retries 0 --scan-delay 5s 192.168.1.1

# Fragmentos + decoy combinados
nmap -sS -f -D RND:10 -T2 --source-port 53 192.168.1.100

# Aleatorizar orden de hosts
nmap --randomize-hosts -p 1-1000 192.168.1.1

# Idle scan (anónimo, usa zombie)
nmap -sI 192.168.1.50 192.168.1.100

# Detectar firewalls
nmap -sA 192.168.1.1              # ACK scan
nmap --traceroute 192.168.1.1     # Traceroute
nmap --script [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)-bypass 192.168.1.1
```

## Output y Procesamiento

### Formatos de Output

```bash
nmap -oN escaneo.txt 192.168.1.1     # Normal
nmap -oX escaneo.xml 192.168.1.1     # XML (parseable)
nmap -oG escaneo.grep 192.168.1.1    # Grepable
nmap -oS escaneo.txt 192.168.1.1     # Script kiddie
nmap -oA escaneo 192.168.1.1         # Todos los formatos
```

### Verbosidad y Debug

```bash
nmap -v 192.168.1.1                  # Verbose
nmap -vv 192.168.1.1                 # Más verbose
nmap -d 192.168.1.1                  # Debug
nmap --reason 192.168.1.1            # Explica cada estado
nmap --packet-trace 192.168.1.1      # Ver cada paquete
nmap -vv --reason --packet-trace 192.168.1.1  # Todo junto
```

### Procesamiento de Output

```bash
# Extraer IPs con puerto 80 abierto
grep "/open/" escaneo.grep | awk '{print $2}'

# Extraer puertos abiertos
grep "open" escaneo.nmap | awk '{print $1, $3}'

# Ndiff (comparar escaneos)
ndiff escaneo1.xml escaneo2.xml
ndiff -v escaneo1.xml escaneo2.xml   # Verbose
```

### Procesar XML con Python

```python
# parse_nmap_xml.py
import xml.etree.ElementTree as ET

def parse_nmap_xml(filepath):
    tree = ET.parse(filepath)
    root = tree.getroot()
    results = {}
    for host in root.findall('host'):
        ip = host.find('address').get('addr')
        ports = []
        for port in host.findall('.//port'):
            port_id = port.get('portid')
            state = port.find('state').get('state')
            service = port.find('service')
            service_name = service.get('name') if service is not None else 'unknown'
            ports.append({'port': port_id, 'state': state, 'service': service_name})
        results[ip] = {'ports': ports}
    return results

def generate_html_report(results, output='reporte.html'):
    html = '<html><head><title>Nmap Report</title></head><body>'
    html += '<h1>Escaneo de [red](../raw/r3d3s-f0nd4m3nt0s.md)</h1>'
    for ip, data in sorted(results.items()):
        html += f'<h2>{ip}</h2><table border="1"><tr><th>Puerto</th><th>Estado</th><th>Servicio</th></tr>'
        for port in data['ports']:
            html += f'<tr><td>{port["port"]}</td><td>{port["state"]}</td><td>{port["service"]}</td></tr>'
        html += '</table>'
    html += '</body></html>'
    with open(output, 'w', encoding='utf-8') as f:
        f.write(html)

# Uso
data = parse_nmap_xml('escaneo.xml')
generate_html_report(data)
```

## Ejemplos Prácticos

### Descubrir todos los dispositivos en tu red

```bash
nmap -sn 192.168.1.0/24
```

**Salida:**
```
Nmap scan report for 192.168.1.1
Host is up (0.0012s latency).
MAC Address: 00:11:22:33:44:55 (Cisco)
Nmap scan report for 192.168.1.100
Host is up (0.045s latency).
MAC Address: AA:BB:CC:DD:EE:FF (Apple)
Nmap done: 256 IP addresses (3 hosts up) scanned in 5.67s
```

### Escanear un servidor web a fondo

```bash
nmap -sV -sC -p 80,443 --script http-enum,http-headers,http-title 192.168.1.100
```

### Escanear todo con detección de OS

```bash
nmap -sS -sV -O -p- -T4 192.168.1.1
# ATENCIÓN: -p- tarda ~10-30 min por host
```

### Buscar EternalBlue (MS17-010)

```bash
nmap -p 445 --script [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)-vuln-ms17-010 192.168.1.0/24
```

### Escaneo sigiloso

```bash
nmap -sS -f -D RND:10 -T2 --source-port 53 192.168.1.100
```

### Escaneo UDP de servicios comunes

```bash
nmap -sU -p 53,67-68,123,161,500 192.168.1.1
```

### Detectar vulnerabilidades HTTP

```bash
nmap -p 80,443 --script http-vuln-* 192.168.1.100
```

### Enumerar usuarios SMB

```bash
nmap -p 139,445 --script smb-enum-users 192.168.1.100
```

### Verificar config SSL

```bash
nmap -p 443 --script [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))-enum-ciphers,[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)-heartbleed,[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)-cert 192.168.1.100
```

### Enumeración completa

```bash
nmap -sV -sC -O -p- --traceroute 192.168.1.1
```

## Escaneo a través de Tor/Proxies

### Con Tor (SOCKS5)

```bash
# Instalar Tor
sudo apt install [tor](../raw/4n0n1m4t0.md#tor)
sudo systemctl start tor

# Proxychains
proxychains4 nmap -sT -Pn 192.168.1.1

# O torify
torify nmap -sT -Pn 192.168.1.1

# Escaneo completo por Tor
proxychains4 nmap -sT -Pn -sV --top-ports 100 192.168.1.1

# ATENCIÓN: Tor es MUY lento. NO uses -p- por Tor.
# Solo -sT funciona a través de Tor (no SYN scan).
```

### Con HTTP Proxy

```bash
nmap --proxies http://127.0.0.1:8080 -sT -Pn 192.168.1.1
nmap --proxies http://user:pass@[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy):8080 -sT -Pn 192.168.1.1
nmap --proxies http://proxy1:8080,http://proxy2:8080 -sT -Pn 192.168.1.1
```

### Limitaciones de escaneo por proxy

1. Solo funciona con `-sT` (connect scan).
2. MUY lento (latencia del proxy agregada).
3. `-Pn` requerido (proxy no permite discovery).
4. Algunos proxies bloquean tráfico de nmap.

## IPv6 Scanning

```bash
# Descubrimiento IPv6
nmap -6 -sn fe80::/10

# Escaneo de puertos IPv6
nmap -6 -sS 2001:db8::1

# Detección de OS en IPv6
nmap -6 -O 2001:db8::1

# Escaneo completo IPv6
nmap -6 -sV -sC -p- 2001:db8::1

# Rango IPv6
nmap -6 2001:db8::1-100
```

**Consideraciones:**
- IPv6 no tiene broadcast ARP, discovery funciona distinto.
- Muchos firewalls no tienen reglas IPv6 configuradas.
- Los ISPs asignan /64 (~18 quintillones de IPs), impracticable escanear.
- Usá NDP para discovery local: `nmap -6 -PR -sn`.

## Zenmap — Interfaz Gráfica

```bash
zenmap
```

Perfiles predefinidos:

| Perfil | Comando | Cuándo usarlo |
|--------|---------|---------------|
| Ping Scan | `-sn` | Solo hosts activos |
| Quick Scan | `-T4 -F` | Rápido, puertos comunes |
| Quick Scan Plus | `-sV -T4 -O -F` | Versiones + OS rápido |
| Regular Scan | default | Top 1000 puertos |
| Comprehensive | `-sS -sV -O -sC -A` | Completo (lento) |
| Slow Comprehensive | `-sS -sU -sV -O -p- -sC -A` | El más completo |

## Nmap en Cloud (AWS/Azure/GCP)

- AWS bloquea escaneos sin autorización.
- Security Groups filtran por defecto.
- VPCs tienen ACLs que interfieren.
- `-Pn` casi siempre necesario en cloud.

```bash
# AWS IP ranges
nmap -sV -p 22,443,3306 54.0.0.0/8

# Rate limiting (importante en cloud)
nmap --rate-limit 10 -p 80 54.0.0.0/8

# Encontrar contenedores Docker
nmap -sn 172.17.0.0/16
```

## Nmap en Scripts y Automatización

### Wrapper en Bash

```bash
#!/bin/bash
TARGET=$1
OUTPUT_DIR="escaneos/$(date +%Y-%m-%d_%H-%M)"
mkdir -p $OUTPUT_DIR

echo "[*] Escaneando $TARGET..."
nmap -sn $TARGET -oA $OUTPUT_DIR/discovery
nmap -sS -sV -T4 --top-ports 1000 $TARGET -oA $OUTPUT_DIR/ports
nmap -O $TARGET -oA $OUTPUT_DIR/os
nmap -sV --script "vuln and safe" $TARGET -oA $OUTPUT_DIR/vulns
echo "[*] Completo! Reportes en $OUTPUT_DIR"

## Comparación con Otras Herramientas

### masscan

```bash
# masscan es ultra-rápido (escanea internet entero)
masscan -p80,443 0.0.0.0/0 --rate=10000
```

| Característica | [nmap](../raw/nm4p.md) | masscan |
|---------------|------|---------|
| Velocidad | ~1000 pkts/s | ~25M pkts/s |
| Detección OS | Sí | No |
| Service version | Sí | Banner grab |
| NSE scripts | 600+ | No |
| Tipos de scan | Todos | Solo SYN |
| Precisión | Muy alta | Alta |
| Cuándo usarlo | Auditoría detallada | Barrido masivo |

**Combinarlos:**
```bash
masscan -p80,443,22 192.168.1.0/24 --rate=1000 -oJ masscan.json
cat masscan.json | jq -r '.[].ip' | nmap -iL - -sV -sC
```

### rustscan

```bash
rustscan -a 192.168.1.0/24
rustscan -a 192.168.1.1 -- -sV -sC    # Integración nmap
```

| Característica | nmap | rustscan |
|---------------|------|----------|
| Velocidad | Alta | Muy alta |
| OS detection | Sí | No (delega a nmap) |
| Service version | Sí | Sí (via nmap) |
| Scripts | 600+ NSE | No |
| Config | Compleja | Simple |
| Cuándo | Auditoría | Discovery rápido |

### unicornscan

```bash
unicornscan -mT 192.168.1.0/24:1-1000
```

Rápido pero con menos features. Útil para escaneos paralelos masivos.

### zmap

```bash
zmap -p 443 0.0.0.0/0
```

Diseñado para escanear todo internet. Sin detección de versiones ni scripts.

## Troubleshooting y Errores Comunes

### "Failed to resolve host"
El hostname no se resuelve. Verificá el nombre o usá [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) directa.

### "You requested a scan type which requires root privileges"
SYN scan requiere raw sockets. Usá `sudo` o cambiá a `-sT`.

### "Failed to open network interface"
[nmap](../raw/nm4p.md) no tiene [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) o la interfaz no existe. Ejecutá con [sudo](../raw/l1n9x-pr1v3sc.md#sudo), verificá con `ip link`.

### "Host seems down"
El host no responde a discovery. Usá `-Pn` si estás seguro que está activo.

### "Too many ICMP messages"
[firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) con [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting). Usá `--defeat-icmp-rate-limit` o `-Pn`.

### Resultados inconsistentes
- Firewall stateful
- Balanceador de carga
- Timeout muy corto (T5)
- Solución: `-T3 --max-retries 5`

### Nmap en Windows
- No soporta SYN scan sin Npcap.
- OS detection no funciona correctamente.
- Instalá Npcap durante la instalación.
- Usá `-sT` en vez de `-sS`.

## Seguridad al Usar [nmap](../raw/nm4p.md)

- No escanees [redes](../raw/r3d3s-f0nd4m3nt0s.md) que no son tuyas sin autorización.
- En algunos países, escanear sin permiso es ilegal.
- Obtené autorización por escrito.
- Usá timing polite (T2) en producción.
- Nunca uses `--script exploit` sin autorización.

## Interpretación de Puertos

| [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Transporte | Servicio | Uso común | Riesgo |
|--------|-----------|----------|-----------|--------|
| 21 | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) | FTP | Transferencia archivos | ALTO - texto plano |
| 22 | TCP | SSH | Shell remoto | Bajo (si config OK) |
| 23 | TCP | Telnet | Shell remoto | ALTO - sin [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) |
| 25 | TCP | SMTP | Correo saliente | SPAM, open relay |
| 53 | TCP/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) | [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) | Resolución nombres | Zone transfer |
| 69 | UDP | TFTP | Transferencia archivos | ALTO - sin auth |
| 80 | TCP | [http](../raw/r3d3s-f0nd4m3nt0s.md#http) | Web | Ataques web |
| 110 | TCP | POP3 | Correo entrante | Texto plano |
| 111 | TCP/UDP | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) | Servicios NFS | Enumeración, [rce](../raw/w3b-h4ck1ng.md#rce) |
| 123 | UDP | NTP | Sincronización | Amplificación DDoS |
| 135 | TCP | MSRPC | Windows RPC | Enumeración |
| 137-139 | TCP/UDP | NetBIOS | Compartición | Enumeración [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) |
| 143 | TCP | IMAP | Correo entrante | Credenciales |
| 161 | UDP | SNMP | Monitoreo | Info sistema |
| 389 | TCP | LDAP | Directorio Activo | Enumeración usuarios |
| 443 | TCP | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | Web [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) | Ataques web |
| 445 | TCP | SMB | Archivos compartidos | EternalBlue, ransomware |
| 465 | TCP | SMTPS | SMTP SSL | SPAM |
| 500 | UDP | ISAKMP | [vpn](../raw/4n0n1m4t0.md#vpn) IPsec | Enumeración [vpn](../raw/4n0n1m4t0.md#vpn) |
| 587 | TCP | SMTP | Correo con auth | SPAM |
| 636 | TCP | LDAPS | LDAP SSL | Enumeración |
| 993 | TCP | IMAPS | IMAP SSL | Acceso correo |
| 995 | TCP | POP3S | POP3 SSL | Acceso correo |
| 1080 | TCP | SOCKS | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) abierto |
| 1194 | UDP | OpenVPN | VPN | Acceso [red](../raw/r3d3s-f0nd4m3nt0s.md) interna |
| 1433 | TCP | MSSQL | SQL Server | [sqli](../raw/w3b-h4ck1ng.md#sql-injection), RCE |
| 1521 | TCP | Oracle | Oracle DB | Credenciales default |
| 2049 | TCP/UDP | NFS | Archivos red | Acceso sin auth |
| 2181 | TCP | ZooKeeper | Coordinación | Sin auth |
| 2375 | TCP | [docker](../raw/d0ck3r-f0r-h4ck3rs.md) | API [docker](../raw/d0ck3r-f0r-h4ck3rs.md) | RCE completo |
| 3128 | TCP | Squid | Proxy HTTP | Proxy abierto |
| 3306 | TCP | MySQL | MySQL | Acceso datos |
| 3389 | TCP | RDP | Escritorio remoto | BlueKeep |
| 4444 | TCP | [metasploit](../raw/m3t4spl01t.md) | Backdoor | ALTO |
| 5432 | TCP | PostgreSQL | PostgreSQL | Acceso datos |
| 5555 | TCP | [adb](../raw/4db-d33p-d1v3.md) | [android](../raw/4db-d33p-d1v3.md) Debug | Control total |
| 5601 | TCP | Kibana | Dashboards | Apps web |
| 5900 | TCP | VNC | Remote desktop | Sin auth común |
| 5985 | TCP | WinRM | Remote management | RCE Windows |
| 6379 | TCP | Redis | Cache | RCE (sin auth) |
| 8080 | TCP | HTTP-Proxy | Proxy/alternativo | Ataques web |
| 8443 | TCP | HTTPS-Alt | HTTPS alternativo | Ataques web |
| 9000 | TCP | PHP-FPM | PHP FastCGI | RCE |
| 9090 | TCP | Cockpit | Admin web | RCE |
| 9200 | TCP | Elasticsearch | ELK | Sin auth |
| 9418 | TCP | Git | Git protocol | Código fuente |
| 10000 | TCP | Webmin | Admin web | RCE |
| 11211 | UDP | Memcached | Cache | Amplificación DDoS |
| 27017 | TCP | MongoDB | NoSQL | Sin auth |
| 50070 | TCP | Hadoop HDFS | NameNode | RCE |

## Referencia Rápida de Flags

| Flag | Descripción |
|------|-------------|
| `-sS` | SYN scan (sigiloso, default) |
| `-sT` | Connect scan (completa conexión) |
| `-sU` | [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) scan |
| `-sA` | ACK scan ([firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) detection) |
| `-sF` | FIN scan |
| `-sN` | NULL scan |
| `-sX` | Xmas scan |
| `-sW` | Window scan |
| `-sM` | Maimon scan |
| `-sI` | Idle scan (zombie) |
| `-sO` | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) protocol scan |
| `-sV` | Service version detection |
| `-sC` | Default scripts |
| `-O` | OS detection |
| `-A` | Aggressive (OS+version+scripts+traceroute) |
| `-sn` | Ping scan (solo discovery) |
| `-Pn` | Skip ping (asume hosts up) |
| `-PE` | ICMP echo discovery |
| `-PP` | ICMP timestamp discovery |
| `-PM` | ICMP netmask discovery |
| `-PS` | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) SYN ping discovery |
| `-PA` | TCP ACK ping discovery |
| `-PU` | UDP ping discovery |
| `-PR` | [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) ping discovery |
| `-p` | [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)/s específicos |
| `-p-` | Todos los 65535 puertos |
| `--top-ports` | N puertos más comunes |
| `-T0..5` | Timing (paranoid a insane) |
| `-f` | Fragmentar paquetes |
| `--mtu` | MTU para fragmentación |
| `-D` | Decoy [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) |
| `--source-port` | Puerto origen específico |
| `--data-length` | Rellenar paquetes |
| `--spoof-mac` | Spoof MAC |
| `--ttl` | TTL personalizado |
| `--badsum` | Checksum incorrecto |
| `--traceroute` | Traceroute |
| `--reason` | Explicar cada estado |
| `--packet-trace` | Ver cada paquete |
| `-v, -vv` | Verbosidad |
| `-d, -dd` | Debug |
| `-oN` | Output normal |
| `-oX` | Output XML |
| `-oG` | Output grepable |
| `-oS` | Output script kiddie |
| `-oA` | Todos los formatos |
| `-iL` | Targets desde archivo |
| `--exclude` | Excluir IPs |
| `--exclude-ports` | Excluir puertos |
| `-6` | Modo IPv6 |
| `--proxies` | Escaneo por [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) |
| `--host-timeout` | Timeout por host |
| `--max-retries` | Máx reintentos |
| `--min-parallelism` | Mín probes paralelos |
| `--max-parallelism` | Máx probes paralelos |
| `--scan-delay` | Espera entre probes |
| `--randomize-hosts` | Aleatorizar hosts |
| `--script` | Script/s NSE a ejecutar |
## Ncat — El [netcat](../raw/r3v3rs3-sh3lls.md#netcat) Moderno de [nmap](../raw/nm4p.md)

Ncat es un reemplazo moderno de netcat con soporte [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)), [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy), y más.

```bash
# Escuchar en puerto
ncat -l -p 4444

# Conectar a puerto
ncat 192.168.1.1 4444

# Transferir archivo
ncat -l -p 4444 > archivo_recibido.txt
ncat 192.168.1.1 4444 < archivo_enviar.txt

# Ncat con SSL
ncat --ssl -l -p 4444 --ssl-cert cert.pem --ssl-key key.pem
ncat --ssl 192.168.1.1 4444
ncat --ssl --ssl-verify 0 192.168.1.1 4444

# Ncat Proxy
ncat -l -p 8888 --proxy-type http
ncat -l -p 8888 --proxy-type http --proxy-auth user:pass

# Ncat Listen Avanzado
ncat -k -l -p 4444          # Keep listening
ncat -l -p 4444 -4          # IPv4
ncat -l -p 4444 -6          # IPv6
ncat -v -l -p 4444          # Verbose

# Ncat Chatter
ncat -l -p 4444 --chat
ncat 192.168.1.1 4444 --chat

# Ncat Brokering
ncat -l --broker -p 4444
ncat broker_ip 4444
ncat broker_ip 4444

# Ncat escaneo de puertos
for port in 22 80 443 8080; do
    ncat -zv -w 2 192.168.1.1 $port && echo "${port}: open" || echo "${port}: closed"
done
```

## [nmap](../raw/nm4p.md) en [cloud](../raw/cl0ud-h4ck1ng.md) ([aws](../raw/cl0ud-h4ck1ng.md#aws)/[azure](../raw/cl0ud-h4ck1ng.md#azure)/[gcp](../raw/cl0ud-h4ck1ng.md#gcp))

- AWS bloquea escaneos sin autorización
- Security Groups filtran por defecto
- VPCs tienen ACLs que interfieren
- `-Pn` casi siempre necesario en cloud

### Nmap en AWS

```bash
# Obtener rangos de IP de AWS
curl -s https://ip-ranges.amazonaws.com/ip-ranges.json | jq '"'"'.prefixes[] | select(.region=="us-east-1") | .ip_prefix'"'"'

# Escanear servicios AWS comunes
nmap -sV -p 22,3389,3306,5432,6379,27017 \
     --script=ssh-hostkey,mysql-empty-password \
     54.0.0.0/8

# Escaneo dentro de una VPC
nmap -Pn -sS -sV -O --top-ports 1000 10.0.0.0/16

# Security Group audit
nmap -Pn -sS --top-ports 100 10.0.1.0/24 | grep "open"
```

### Nmap en Azure

```bash
# Azure service tags
az network public-ip list --query "[].ipAddress" -o tsv > azure_ips.txt

# Escaneo en Azure VNet
nmap -Pn -sS -sV -T4 10.0.0.0/16

# NSG rule verification
nmap -Pn -sA 10.0.0.0/24
```

### Nmap en GCP

```bash
# GCP IP ranges
curl -s https://www.gstatic.com/ipranges/cloud.json | jq '"'"'.prefixes[].ipv4Prefix | select(.)'"'""

# Escaneo en GCP VPC
nmap -Pn -sS -sV -T4 10.128.0.0/20

# Firewall rules check
nmap -Pn -sS -p 22,80,443,3389 10.128.0.0/20
```

### Nmap con [docker](../raw/d0ck3r-f0r-h4ck3rs.md)

```bash
# Escanear red Docker
nmap -sn 172.17.0.0/16
nmap -sn 172.18.0.0/16
nmap -sn 172.19.0.0/16

# Docker compose networks
docker network inspect bridge | grep Subnet

# Ejecutar nmap dentro de Docker
docker run --rm -it --net=host instrumentisto/nmap -sS 192.168.1.0/24
```

### Nmap con [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md)

```bash
# Encontrar pods
kubectl get pods -o wide | awk '"'"'{print $6}'"'"'
kubectl get nodes -o wide | awk '"'"'{print $6}'"'"'

# Escanear service mesh
nmap -sS -sV -T4 -Pn 10.96.0.0/12  # Service CIDR
nmap -sn 10.244.0.0/16              # Pod CIDR (Flannel)
nmap -sn 10.100.0.0/16             # Pod CIDR (Calico)

# Escanear desde un pod
kubectl run nmap-pod --rm -it --image=instrumentisto/nmap -- /bin/sh
nmap -sS -sV 10.96.0.1
```

## [nmap](../raw/nm4p.md) en DevOps y [ci/cd](../raw/c1cd-h4ck1ng.md)

```yaml
# .gitlab-ci.yml
stages:
  - security_scan

nmap_scan:
  stage: security_scan
  script:
    - nmap -sS -sV --top-ports 1000 -oX scan.xml $TARGET_HOST
    - python3 parse_nmap_xml.py scan.xml --format-junit > report.xml
    - python3 generate_html_report.py scan.xml report.html
  artifacts:
    paths:
      - scan.xml
      - report.html
      - report.xml
  only:
    - schedules
```

```yaml
# .github/workflows/nmap_scan.yml
name: Nmap Security Scan
on:
  schedule:
    - cron: '"'"'0 6 * * 1'"'"'
  workflow_dispatch:

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install nmap
        run: sudo apt-get update && sudo apt-get install -y nmap
      - name: Run scan
        run: nmap -sS -sV -T4 --top-ports 100 -oX scan.xml ${{ secrets.SCAN_TARGET }}
      - name: Generate report
        run: python3 scripts/generate_report.py scan.xml
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: nmap-results
          path: scan.xml
```
## Raw Packet Crafting con Nping

Nping es una herramienta incluida con [nmap](../raw/nm4p.md) para generación de paquetes raw.

```bash
# Modos de nping
nping --tcp 192.168.1.1
nping --udp 192.168.1.1
nping --icmp 192.168.1.1
nping --arp 192.168.1.1
nping --ip 192.168.1.1
```

### [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) Packet Crafting

```bash
# SYN flood
nping --tcp -c 10000 --rate 1000 --flags syn 192.168.1.1

# Connect scan simulado
nping --tcp -p 22,80,443 --flags syn --source-port 40000 192.168.1.1

# SYN-ACK scan
nping --tcp -p 80 --flags syn,ack 192.168.1.1

# FIN scan
nping --tcp -p 80 --flags fin 192.168.1.1

# Xmas tree
nping --tcp -p 80 --flags fin,psh,urg 192.168.1.1

# NULL scan
nping --tcp -p 80 --flags none 192.168.1.1
```

### [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) Packet Crafting

```bash
# UDP a puerto DNS
nping --udp -p 53 --data "test" 192.168.1.1

# UDP flood
nping --udp -c 10000 --rate 500 --data-length 1400 192.168.1.1
```

### ICMP Packet Crafting

```bash
# ICMP echo
nping --icmp --icmp-type echo -c 5 192.168.1.1

# ICMP timestamp
nping --icmp --icmp-type timestamp 192.168.1.1

# ICMP address mask
nping --icmp --icmp-type address-mask 192.168.1.1

# ICMP unreachable
nping --icmp --icmp-type destination-unreachable 192.168.1.1

# ICMP redirect
nping --icmp --icmp-type redirect 192.168.1.1
```

### [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) Packet Crafting

```bash
# ARP who-has
nping --arp --arp-type who-has 192.168.1.1

# ARP reply spoof
nping --arp --arp-type reply --sender-mac 00:11:22:33:44:55 \
      --sender-ip 192.168.1.100 --target-ip 192.168.1.1

# ARP poison (simulado)
nping --arp --arp-type reply \
      --sender-mac AA:BB:CC:DD:EE:FF \
      --sender-ip 192.168.1.1 \
      --target-ip 192.168.1.100
```

### Route Tracking

```bash
# Traceroute con TCP
nping --tcp -p 80 --traceroute 8.8.8.8

# Traceroute con UDP
nping --udp -p 53 --traceroute 8.8.8.8

# Traceroute con ICMP
nping --icmp --traceroute 8.8.8.8

# Traceroute personalizado
nping --tcp -p 80 --ttl-start 1 --ttl-max 30 \
      --ttl-increment 1 --traceroute 8.8.8.8
```

### Performance Testing

```bash
# Rate test
nping --tcp -p 80 -c 10000 --rate 1000 192.168.1.1

# Delay between probes
nping --tcp -p 80 -c 100 --delay 10ms 192.168.1.1

# Concurrent connections
nping --tcp -p 80-90 -c 1000 --rate 100 192.168.1.1
```
## Referencia Completa de Scripts NSE por [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red))

### Scripts [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (50+ scripts)

```bash
# Enumeración y descubrimiento
nmap --script http-enum 192.168.1.1
nmap --script http-headers 192.168.1.1
nmap --script http-methods 192.168.1.1
nmap --script http-title 192.168.1.1
nmap --script http-server-header 192.168.1.1
nmap --script http-fetch 192.168.1.1
nmap --script http-generator 192.168.1.1
nmap --script http-ls 192.168.1.1
nmap --script http-robots.txt 192.168.1.1
nmap --script http-sitemap-generator 192.168.1.1

# Vulnerabilidades
nmap --script http-sql-injection 192.168.1.1
nmap --script http-xss 192.168.1.1
nmap --script http-csrf 192.168.1.1
nmap --script http-shellshock 192.168.1.1
nmap --script http-vuln-cve2014-3704 192.168.1.1
nmap --script http-vuln-cve2017-1001000 192.168.1.1
nmap --script http-lfi 192.168.1.1
nmap --script http-phpself 192.168.1.1

# CMS detection
nmap --script http-wordpress-enum 192.168.1.1
nmap --script http-wordpress-brute 192.168.1.1
nmap --script http-joomla-enum 192.168.1.1
nmap --script http-joomla-brute 192.168.1.1
nmap --script http-drupal-enum 192.168.1.1
nmap --script http-typo3-enum 192.168.1.1
nmap --script http-umbraco-enum 192.168.1.1
nmap --script http-magento-enum 192.168.1.1

# Web servers
nmap --script http-iis-web-vuln 192.168.1.1
nmap --script http-tomcat-enum 192.168.1.1
nmap --script http-tomcat-brute 192.168.1.1
nmap --script http-apache-enum 192.168.1.1
nmap --script http-jboss-detect 192.168.1.1
nmap --script http-jboss-mgmt 192.168.1.1

# Autenticación
nmap --script http-auth 192.168.1.1
nmap --script http-auth-finder 192.168.1.1
nmap --script http-brute 192.168.1.1
nmap --script http-form-brute 192.168.1.1
nmap --script http-digest-brute 192.168.1.1
nmap --script http-ntlm-info 192.168.1.1

# Aplicaciones
nmap --script http-git 192.168.1.1
nmap --script http-svn 192.168.1.1
nmap --script http-elasticsearch 192.168.1.1
nmap --script http-couchdb 192.168.1.1
nmap --script http-prometheus 192.168.1.1
nmap --script http-grafana 192.168.1.1
nmap --script http-kibana 192.168.1.1
nmap --script http-phpmyadmin-dir 192.168.1.1

# Proxy
nmap --script http-open-proxy 192.168.1.1
nmap --script http-proxy-brute 192.168.1.1
nmap --script http-socks-proxy 192.168.1.1
```

### Scripts [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) (30+ scripts)

```bash
# Enumeración
nmap --script smb-enum-shares 192.168.1.1
nmap --script smb-enum-users 192.168.1.1
nmap --script smb-enum-domains 192.168.1.1
nmap --script smb-enum-groups 192.168.1.1
nmap --script smb-enum-services 192.168.1.1
nmap --script smb-enum-sessions 192.168.1.1
nmap --script smb-os-discovery 192.168.1.1
nmap --script smb-ls 192.168.1.1
nmap --script smb-server-stats 192.168.1.1

# Vulnerabilidades
nmap --script smb-vuln-ms17-010 192.168.1.1
nmap --script smb-vuln-ms06-025 192.168.1.1
nmap --script smb-vuln-ms07-029 192.168.1.1
nmap --script smb-vuln-ms08-067 192.168.1.1
nmap --script smb-vuln-ms10-054 192.168.1.1
nmap --script smb-vuln-ms10-061 192.168.1.1

# Seguridad
nmap --script smb2-security-mode 192.168.1.1
nmap --script smb2-time 192.168.1.1
nmap --script smb2-capabilities 192.168.1.1
nmap --script smb-protocols 192.168.1.1
nmap --script smb-signing 192.168.1.1
nmap --script smb-brute 192.168.1.1
nmap --script smb-psexec 192.168.1.1
nmap --script smb-system-info 192.168.1.1
nmap --script smb-security-mode 192.168.1.1
nmap --script smb-print-text 192.168.1.1
```

### Scripts FTP (15+ scripts)

```bash
nmap --script ftp-anon 192.168.1.1
nmap --script ftp-brute 192.168.1.1
nmap --script ftp-bounce 192.168.1.1
nmap --script ftp-libopie 192.168.1.1
nmap --script ftp-proftpd-backdoor 192.168.1.1
nmap --script ftp-syst 192.168.1.1
nmap --script ftp-vsftpd-backdoor 192.168.1.1
nmap --script ftp-payloads 192.168.1.1
nmap --script ftp-sessions 192.168.1.1
nmap --script ftp-banner 192.168.1.1
nmap --script ftp-logon 192.168.1.1
nmap --script ftp-scan 192.168.1.1
nmap --script ftp-version 192.168.1.1
```

### Scripts [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) (15+ scripts)

```bash
nmap --script dns-brute 192.168.1.1
nmap --script dns-zone-transfer 192.168.1.1
nmap --script dns-enum 192.168.1.1
nmap --script dns-nsid 192.168.1.1
nmap --script dns-recursion 192.168.1.1
nmap --script dns-srv-enum 192.168.1.1
nmap --script dns-cache-snoop 192.168.1.1
nmap --script dns-random-srcport 192.168.1.1
nmap --script dns-random-txid 192.168.1.1
nmap --script dns-nsec-enum 192.168.1.1
nmap --script dns-nsec3-enum 192.168.1.1
nmap --script dns-service-discovery 192.168.1.1
nmap --script dns-af-domain 192.168.1.1
```

### Scripts SSH (10+ scripts)

```bash
nmap --script ssh-hostkey 192.168.1.1
nmap --script ssh-auth-methods 192.168.1.1
nmap --script ssh2-enum-algos 192.168.1.1
nmap --script ssh-brute 192.168.1.1
nmap --script ssh-publickey-acceptance 192.168.1.1
nmap --script ssh-run 192.168.1.1
nmap --script sshv1 192.168.1.1
nmap --script ssh2-ciphers 192.168.1.1
nmap --script ssh2-mac 192.168.1.1
nmap --script ssh2-keys 192.168.1.1
```

### Scripts MySQL (10+ scripts)

```bash
nmap --script mysql-empty-password 192.168.1.1
nmap --script mysql-users 192.168.1.1
nmap --script mysql-databases 192.168.1.1
nmap --script mysql-variables 192.168.1.1
nmap --script mysql-audit 192.168.1.1
nmap --script mysql-brute 192.168.1.1
nmap --script mysql-enum 192.168.1.1
nmap --script mysql-info 192.168.1.1
nmap --script mysql-query 192.168.1.1
nmap --script mysql-dump-hashes 192.168.1.1
nmap --script mysql-vuln-cve2012-2122 192.168.1.1
```

### Scripts MSSQL (15+ scripts)

```bash
nmap --script ms-sql-info 192.168.1.1
nmap --script ms-sql-config 192.168.1.1
nmap --script ms-sql-dump-hashes 192.168.1.1
nmap --script ms-sql-empty-password 192.168.1.1
nmap --script ms-sql-query 192.168.1.1
nmap --script ms-sql-brute 192.168.1.1
nmap --script ms-sql-discover 192.168.1.1
nmap --script ms-sql-hasdbaccess 192.168.1.1
nmap --script ms-sql-ntlm-info 192.168.1.1
nmap --script ms-sql-num-tables 192.168.1.1
nmap --script ms-sql-password-hash 192.168.1.1
nmap --script ms-sql-sa-password 192.168.1.1
nmap --script ms-sql-tables 192.168.1.1
nmap --script ms-sql-xp-cmdshell 192.168.1.1
nmap --script ms-sql-xp-delete 192.168.1.1
```

### Scripts Oracle (15+ scripts)

```bash
nmap --script oracle-brute 192.168.1.1
nmap --script oracle-brute-stealth 192.168.1.1
nmap --script oracle-enum-users 192.168.1.1
nmap --script oracle-sid-brute 192.168.1.1
nmap --script oracle-tns-version 192.168.1.1
nmap --script oracle-tns-resolver 192.168.1.1
nmap --script oracle-tns-encryption 192.168.1.1
nmap --script oracle-auth 192.168.1.1
nmap --script oracle-listener 192.168.1.1
nmap --script oracle-asm 192.168.1.1
nmap --script oracle-rac 192.168.1.1
nmap --script oracle-dbms 192.168.1.1
nmap --script oracle-vuln-cve2009-1979 192.168.1.1
```
### Scripts LDAP (10+ scripts)

```bash
nmap --script ldap-rootdse 192.168.1.1
nmap --script ldap-search 192.168.1.1
nmap --script ldap-brute 192.168.1.1
nmap --script ldap-enum 192.168.1.1
nmap --script ldap-novell 192.168.1.1
nmap --script ldap-vuln 192.168.1.1
nmap --script ldap-admin 192.168.1.1
nmap --script ldap-audit 192.168.1.1
nmap --script ldap-config 192.168.1.1
nmap --script ldap-schema 192.168.1.1
nmap --script ldap-service 192.168.1.1
```

### Scripts SMTP/POP3/IMAP (10+ scripts)

```bash
# SMTP
nmap --script smtp-commands 192.168.1.1
nmap --script smtp-enum-users 192.168.1.1
nmap --script smtp-brute 192.168.1.1
nmap --script smtp-ntlm-info 192.168.1.1
nmap --script smtp-open-relay 192.168.1.1
nmap --script smtp-vuln-cve2011-1720 192.168.1.1

# POP3
nmap --script pop3-brute 192.168.1.1
nmap --script pop3-capabilities 192.168.1.1
nmap --script pop3-ntlm-info 192.168.1.1

# IMAP
nmap --script imap-brute 192.168.1.1
nmap --script imap-capabilities 192.168.1.1
nmap --script imap-ntlm-info 192.168.1.1
```

### Scripts RDP/VNC (10+ scripts)

```bash
# RDP
nmap --script rdp-enum-encryption 192.168.1.1
nmap --script rdp-vuln-ms12-020 192.168.1.1
nmap --script rdp-ntlm-info 192.168.1.1
nmap --script rdp-brute 192.168.1.1
nmap --script rdp-sec-check 192.168.1.1
nmap --script rdp-ssl 192.168.1.1
nmap --script rdp-bridge 192.168.1.1

# VNC
nmap --script vnc-info 192.168.1.1
nmap --script vnc-brute 192.168.1.1
nmap --script vnc-auth 192.168.1.1
nmap --script vnc-version 192.168.1.1
nmap --script vnc-screenshot 192.168.1.1
```

### Scripts SNMP (15+ scripts)

```bash
nmap --script snmp-info 192.168.1.1
nmap --script snmp-interfaces 192.168.1.1
nmap --script snmp-brute 192.168.1.1
nmap --script snmp-netstat 192.168.1.1
nmap --script snmp-processes 192.168.1.1
nmap --script snmp-sysdescr 192.168.1.1
nmap --script snmp-win32-services 192.168.1.1
nmap --script snmp-win32-software 192.168.1.1
nmap --script snmp-win32-users 192.168.1.1
nmap --script snmp-monitor 192.168.1.1
nmap --script snmp-community 192.168.1.1

# Interpretación de salida SNMP:
# snmp-info: Muestra información general del dispositivo
# snmp-interfaces: Lista interfaces de red con IPs y estado
# snmp-processes: Procesos corriendo en el dispositivo
# snmp-netstat: Conexiones activas
# snmp-sysdescr: Descripción del sistema
```

### Scripts [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp)/Kerberos (5+ scripts)

```bash
# DHCP
nmap --script dhcp-discover 192.168.1.1
nmap --script broadcast-dhcp-discover

# Kerberos
nmap --script krb5-enum-users 192.168.1.1
nmap --script krb5-ticket 192.168.1.1
nmap --script krb5-brute 192.168.1.1
```

### Scripts Telnet (5+ scripts)

```bash
nmap --script telnet-brute 192.168.1.1
nmap --script telnet-brute-cred 192.168.1.1
nmap --script telnet-encryption 192.168.1.1
nmap --script telnet-ntlm-info 192.168.1.1
nmap --script telnet-version 192.168.1.1
```

### Scripts MongoDB/Redis (5+ scripts)

```bash
# MongoDB
nmap --script mongodb-info 192.168.1.1
nmap --script mongodb-databases 192.168.1.1
nmap --script mongodb-brute 192.168.1.1

# Redis
nmap --script redis-info 192.168.1.1
nmap --script redis-brute 192.168.1.1
```
## [nmap](../raw/nm4p.md) para Mobile e IoT

### Escaneo de Dispositivos [android](../raw/4db-d33p-d1v3.md)

```bash
# Android Debug Bridge (ADB) - puerto 5555
nmap -p 5555 --script adb-info 192.168.1.0/24

# Android en modo MTP/transferencia
nmap -p 5555,5554,8080 192.168.1.100

# Detectar Android
nmap -sV -p 5555,8080 192.168.1.100
```

### Escaneo de [ios](../raw/10s-p3nt3st1ng.md)

```bash
# iOS bloquea la mayoría de puertos
# Solo suele tener abiertos:
# 62078 (iPhone sync)
# 80/443 si hay servidor web
nmap -p 62078,80,443,22 192.168.1.100
```

### Protocolos IoT

```bash
# MQTT (Message Queue Telemetry Transport)
nmap -p 1883 --script mqtt-subscribe 192.168.1.100
nmap -p 8883 --script mqtt-subscribe 192.168.1.100  # MQTT over TLS

# CoAP (Constrained Application Protocol)
nmap -sU -p 5683 192.168.1.100

# Modbus (dispositivos industriales)
nmap -p 502 --script modbus-discover 192.168.1.100

# BACnet (Building Automation)
nmap -sU -p 47808 --script bacnet-info 192.168.1.100

# ZigBee gateway
nmap -p 6053 192.168.1.100

# UPnP Discovery
nmap -sU -p 1900 --script upnp-info 192.168.1.100

# SSDP (Simple Service Discovery Protocol)
nmap -sU -p 1900 --script ssdp-info 192.168.1.100

# KNX (domótica europea)
nmap -sU -p 3671 192.168.1.100

# DLNA / Media servers
nmap -p 8200,5001,6001 192.168.1.100

# Philips Hue bridge
nmap -p 80,443,554,1900 192.168.1.100

# Nest / Google Home
nmap -p 80,443,11000,554 192.168.1.100
```

### Embedded Device Fingerprinting

```bash
# Detectar dispositivos embebidos por MAC
# Vendor OUI comunes:
# 00:0C:43 - TP-Link
# 00:1D:7E - Cisco-Linksys
# 00:16:EA - Apple
# AC:84:C6 - Xiaomi

# Fingerprinting con scripts
nmap -sV -O --osscan-guess 192.168.1.100 255  # Dispositivos IoT

# Puertos comunes en IoT
# 80 - Web interface
# 443 - HTTPS
# 23 - Telnet (MUY común en IoT)
# 22 - SSH
# 161 - SNMP
# 1883 - MQTT
# 5683 - CoAP
# 502 - Modbus
# 47808 - BACnet
# 1900 - SSDP
# 5555 - ADB (Android)
# 6053 - ZigBee
# 3671 - KNX
```

## Output Processing y Visualización

### Procesamiento Avanzado con [python](../raw/pyth0n-f0r-h4ck1ng.md)

```python
#!/usr/bin/env python3
# nmap_advanced_parser.py
import xml.etree.ElementTree as ET
import json
import csv
from collections import Counter, defaultdict

class NmapAdvancedParser:
    def __init__(self, xml_file):
        self.tree = ET.parse(xml_file)
        self.root = self.tree.getroot()
    
    def parse_hosts(self):
        hosts = []
        for host in self.root.findall("'"'"'host'"'"'):
            host_data = {
                '"'"'ip'"'"': host.find("'"'"'address'"'"').get("'"'"'addr'"'""),
                '"'"'mac'"'"': None,
                '"'"'vendor'"'"': None,
                '"'"'status'"'"': host.find("'"'"'status'"'"').get("'"'"'state'"'""),
                '"'"'os'"'"': None,
                '"'"'ports'"'"': []
            }
            
            mac_elem = host.find("'"'"'address[@addrtype=\\"'"'"'mac\\"'"'"']'"'")
            if mac_elem is not None:
                host_data['"'"'mac'"'"'] = mac_elem.get("'"'"'addr'"'")
                host_data['"'"'vendor'"'"'] = mac_elem.get("'"'"'vendor'"'")
            
            os_elem = host.find(".//osmatch")
            if os_elem is not None:
                host_data['"'"'os'"'"'] = os_elem.get("'"'"'name'"'")
            
            for port in host.findall(".//port"):
                port_data = {
                    '"'"'port'"'"': port.get("'"'"'portid'"'""),
                    '"'"'protocol'"'"': port.get("'"'"'protocol'"'""),
                    '"'"'state'"'"': port.find("'"'"'state'"'"').get("'"'"'state'"'""),
                    '"'"'service'"'"': port.find("'"'"'service'"'"').get("'"'"'name'"'""),
                    '"'"'product'"'"': port.find("'"'"'service'"'"').get("'"'"'product'"'""),
                    '"'"'version'"'"': port.find("'"'"'service'"'"').get("'"'"'version'"'""),
                }
                host_data['"'"'ports'"'"'].append(port_data)
            
            hosts.append(host_data)
        return hosts
    
    def get_statistics(self):
        hosts = self.parse_hosts()
        stats = {
            '"'"'total_hosts'"'"': len(hosts),
            '"'"'hosts_up'"'"': sum(1 for h in hosts if h['"'"'status'"'"'] == '"'"'up'"'"'),
            '"'"'total_open_ports'"'"': sum(len(h['"'"'ports'"'"']) for h in hosts),
            '"'"'services'"'"': Counter(),
            '"'"'os_counts'"'"': Counter(),
        }
        for host in hosts:
            if host['"'"'os'"'"']:
                stats['"'"'os_counts'"'"'][host['"'"'os'"'"']] += 1
            for port in host['"'"'ports'"'"']:
                if port['"'"'state'"'"'] == '"'"'open'"'"':
                    stats['"'"'services'"'"'][port['"'"'service'"'"']] += 1
        return stats
    
    def export_json(self, output_file):
        hosts = self.parse_hosts()
        with open(output_file, '"'"'w'"'"', encoding='"'"'utf-8'"'"') as f:
            json.dump({'"'"'hosts'"'"': hosts, '"'"'statistics'"'"': self.get_statistics()}, f, indent=2)
    
    def export_csv(self, output_file):
        hosts = self.parse_hosts()
        with open(output_file, '"'"'w'"'"', newline='"'"''"'"', encoding='"'"'utf-8'"'"') as f:
            writer = csv.writer(f)
            writer.writerow(['"'"'IP'"'"', '"'"'MAC'"'"', '"'"'OS'"'"', '"'"'Port'"'"', '"'"'State'"'"', '"'"'Service'"'"', '"'"'Version'"'"'])
            for host in hosts:
                for port in host['"'"'ports'"'"']:
                    writer.writerow([host['"'"'ip'"'"'], host['"'"'mac'"'"'], host['"'"'os'"'"'], port['"'"'port'"'"'], port['"'"'state'"'"'], port['"'"'service'"'"'], port['"'"'version'"'"']])

parser = NmapAdvancedParser("'"'"'escaneo.xml'"'"')
print(json.dumps(parser.get_statistics(), indent=2))
parser.export_json("'"'"'resultados.json'"'"')
parser.export_csv("'"'"'resultados.csv'"'"')
```
### Reportes HTML con Jinja2

```python
#!/usr/bin/env python3
# nmap_jinja_report.py
import xml.etree.ElementTree as ET
from jinja2 import Template
from datetime import datetime
from collections import Counter

XML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Reporte Nmap - {{ timestamp }}</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background: #4CAF50; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f1f1f1; }
        .open { color: #4CAF50; font-weight: bold; }
        .closed { color: #f44336; }
        .filtered { color: #FF9800; }
    </style>
</head>
<body>
    <h1>Reporte de Escaneo Nmap</h1>
    <p><strong>Fecha:</strong> {{ timestamp }}</p>
    <p><strong>Objetivo:</strong> {{ scan_target }}</p>
    <p><strong>Comando:</strong> <code>{{ scan_command }}</code></p>
    
    <h2>Resumen</h2>
    <p>Hosts encontrados: <strong>{{ total_hosts }}</strong></p>
    <p>Puertos abiertos totales: <strong>{{ total_ports }}</strong></p>
    
    <h2>Hosts Detectados</h2>
    {% for host in hosts %}
    <div class="host">
        <h3>{{ host.ip }}</h3>
        {% if host.mac %}<p>MAC: {{ host.mac }}{% endif %}
        {% if host.os %}<p>SO: {{ host.os }}{% endif %}
        
        <table>
            <tr>
                <th>Puerto</th>
                <th>Protocolo</th>
                <th>Estado</th>
                <th>Servicio</th>
                <th>Producto</th>
                <th>Version</th>
            </tr>
            {% for port in host.ports %}
            <tr class="{{ port.state }}">
                <td>{{ port.port }}</td>
                <td>{{ port.protocol }}</td>
                <td class="{{ port.state }}">{{ port.state }}</td>
                <td>{{ port.service }}</td>
                <td>{{ port.product or "-" }}</td>
                <td>{{ port.version or "-" }}</td>
            </tr>
            {% endfor %}
        </table>
    </div>
    {% endfor %}
</body>
</html>
"""

def generate_jinja_report(xml_file, output_html):
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    hosts = []
    for host in root.findall("host"):
        h = {
            "ip": host.find("address").get("addr"),
            "mac": None,
            "vendor": None,
            "status": host.find("status").get("state"),
            "os": None,
            "ports": []
        }
        mac_elem = host.find('address[@addrtype="mac"]')
        if mac_elem is not None:
            h["mac"] = mac_elem.get("addr")
            h["vendor"] = mac_elem.get("vendor")
        os_elem = host.find(".//osmatch")
        if os_elem is not None:
            h["os"] = os_elem.get("name")
        for port in host.findall(".//port"):
            p = {
                "port": port.get("portid"),
                "protocol": port.get("protocol"),
                "state": port.find("state").get("state"),
                "service": port.find("service").get("name") if port.find("service") is not None else "unknown",
                "product": "",
                "version": ""
            }
            svc = port.find("service")
            if svc is not None:
                p["product"] = svc.get("product", "")
                p["version"] = svc.get("version", "")
            h["ports"].append(p)
        hosts.append(h)
    
    total_ports = sum(len(h["ports"]) for h in hosts)
    
    template = Template(XML_TEMPLATE)
    html = template.render(
        timestamp=datetime.now().strftime("%Y-%m-%d %H:%M"),
        scan_target=root.find("scaninfo").get("arguments", "N/A"),
        scan_command=root.get("args", "nmap"),
        total_hosts=len(hosts),
        total_ports=total_ports,
        hosts=hosts
    )
    
    with open(output_html, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Reporte generado: {output_html}")

generate_jinja_report("escaneo.xml", "reporte_nmap.html")
```
### Elasticsearch/Kibana Integration

```python
#!/usr/bin/env python3
# nmap_to_elastic.py
import xml.etree.ElementTree as ET
from elasticsearch import Elasticsearch

def nmap_to_elasticsearch(xml_file, es_host="localhost:9200", index="nmap-scans"):
    es = Elasticsearch([es_host])
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    for host in root.findall("host"):
        ip = host.find("address").get("addr")
        estado = host.find("status").get("state")
        
        for port in host.findall(".//port"):
            doc = {
                "ip": ip,
                "estado_host": estado,
                "puerto": int(port.get("portid")),
                "protocolo": port.get("protocol"),
                "estado_puerto": port.find("state").get("state"),
                "servicio": port.find("service").get("name") if port.find("service") is not None else "unknown",
                "producto": port.find("service").get("product", "") if port.find("service") is not None else "",
                "version": port.find("service").get("version", "") if port.find("service") is not None else "",
                "timestamp": root.get("startstr", "")
            }
            
            scripts = port.findall(".//script")
            for script in scripts:
                doc[f"script_{script.get('id')}"] = script.get("output")
            
            es.index(index=index, body=doc)
    
    print(f"Datos enviados a Elasticsearch {es_host}/{index}")

# Grafana dashboard query:
# count by (servicio) (nmap-scans)
# Bar chart de servicios detectados
```

### Email Alerts from Scan Changes

```python
#!/usr/bin/env python3
# nmap_email_alerts.py
import smtplib
import xml.etree.ElementTree as ET
from email.mime.text import MIMEText
import os

def compare_scans(old_xml, new_xml):
    old_tree = ET.parse(old_xml) if os.path.exists(old_xml) else None
    new_tree = ET.parse(new_xml)
    
    changes = {
        "new_hosts": [],
        "removed_hosts": [],
        "new_ports": [],
        "closed_ports": []
    }
    
    old_ips = set()
    if old_tree:
        for h in old_tree.getroot().findall("host"):
            old_ips.add(h.find("address").get("addr"))
    
    new_ips = set()
    for h in new_tree.getroot().findall("host"):
        ip = h.find("address").get("addr")
        new_ips.add(ip)
        if ip not in old_ips and old_tree:
            changes["new_hosts"].append(ip)
    
    if old_tree:
        for ip in old_ips - new_ips:
            changes["removed_hosts"].append(ip)
    
    if old_tree:
        old_ports = {}
        for h in old_tree.getroot().findall("host"):
            ip = h.find("address").get("addr")
            for p in h.findall(".//port"):
                key = f"{ip}:{p.get('portid')}"
                old_ports[key] = p.find("state").get("state")
        
        for h in new_tree.getroot().findall("host"):
            ip = h.find("address").get("addr")
            for p in h.findall(".//port"):
                key = f"{ip}:{p.get('portid')}"
                new_state = p.find("state").get("state")
                if key in old_ports and old_ports[key] != new_state:
                    if new_state == "open":
                        changes["new_ports"].append(key)
                    else:
                        changes["closed_ports"].append(key)
                elif key not in old_ports and new_state == "open":
                    changes["new_ports"].append(key)
    
    return changes

def send_alert(changes, smtp_server, from_addr, to_addr):
    body = "Resumen de cambios en escaneo Nmap:\n\n"
    
    if changes["new_hosts"]:
        body += f"Nuevos hosts ({len(changes['new_hosts'])}):\n"
        for ip in changes["new_hosts"]:
            body += f"  - {ip}\n"
    
    if changes["removed_hosts"]:
        body += f"\nHosts eliminados ({len(changes['removed_hosts'])}):\n"
        for ip in changes["removed_hosts"]:
            body += f"  - {ip}\n"
    
    if changes["new_ports"]:
        body += f"\nNuevos puertos abiertos:\n"
        for p in changes["new_ports"]:
            body += f"  - {p}\n"
    
    if changes["closed_ports"]:
        body += f"\nPuertos cerrados:\n"
        for p in changes["closed_ports"]:
            body += f"  - {p}\n"
    
    if not any(changes.values()):
        body += "Sin cambios detectados.\n"
    
    msg = MIMEText(body)
    msg["Subject"] = "Alerta Nmap - Cambios en red detectados"
    msg["From"] = from_addr
    msg["To"] = to_addr
    
    with smtplib.SMTP(smtp_server) as server:
        server.send_message(msg)
    print(f"Alerta enviada a {to_addr}")

changes = compare_scans("baseline.xml", "current.xml")
send_alert(changes, "smtp.company.com", "nmap@company.com", "security@company.com")
```
## Troubleshooting y Errores Comunes

### Errores de Resolución de Nombres

```bash
# Error: "Failed to resolve host"
# Solución: usá IP directa o verificá DNS
nmap -n 192.168.1.1  # Sin resolución DNS
nmap --dns-servers 8.8.8.8 192.168.1.1

# Error: "Failed to resolve name"
# Solución: verificá el hostname
host nombre-host
dig nombre-host
```

### Errores de [permisos](../raw/0s-f0nd4m3nt0s.md#permisos)

```bash
# Error: "You requested a scan type which requires root privileges"
# Solución: usá sudo o cambiá a -sT
nmap -sT 192.168.1.1  # No requiere root
# O mejor: ejecutá con sudo
sudo nmap -sS 192.168.1.1

# Error en Windows: "Failed to open network interface"
# Solución: ejecutá como Administrador
# O instalá Npcap correctamente
```

### Errores de Conexión

```bash
# Error: "Host seems down"
# Solución: forzá escaneo sin ping
nmap -Pn 192.168.1.1

# Error: "Failed to open network interface"
# Solución: verificá interfaces disponibles
nmap --iflist
# O ejecutá con sudo (Linux) o Admin (Windows)

# Error: "No open ports found"
# Solución: probá con -Pn y más puertos
nmap -Pn -p- 192.168.1.1

# Error: "Socket creation failed"
# Solución: límite de sockets del sistema
# Linux:
ulimit -n 10000
# Windows: reiniciá o aumentá límites
```

### Errores de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)/Rate-Limit

```bash
# Error: "Too many ICMP messages"
# Solución: desactivá rate limiting
nmap -Pn --defeat-icmp-ratelimit 192.168.1.1

# Error: "Packet presumably dropped"
# Solución: aumentá timeouts
nmap --max-rtt-timeout 2000ms --min-rtt-timeout 500ms 192.168.1.1

# Error: "RST rate limit"
# Solución: activá defeat RST
nmap --defeat-rst-ratelimit 192.168.1.1

# Error: "SENT (x.x seconds) ..."
# Solución: el escaneo es lento, aumentá timing
nmap -T4 --min-parallelism 10 192.168.1.1
```

### Errores de Script NSE

```bash
# Error: "SCRIPT ENGINE: no such script"
# Solución: actualizá la base de datos
sudo nmap --script-updatedb

# Error: "NSE: failed to initialize script"
# Solución: verificá sintaxis Lua
luac -p mi_script.nse  # Verifica sintaxis

# Error: "NSE: portrule failed"
# Solución: el script tiene un error en portrule
nmap -d2 --script ./mi_script.nse 192.168.1.1
```

### Análisis de Paquetes con [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark)

[nmap](../raw/nm4p.md) y Wireshark son el combo definitivo. Usá `--packet-trace` para ver cada paquete:

```bash
# Capturar paquetes de nmap
nmap --packet-trace 192.168.1.1

# Filtrar en Wireshark para ver nmap
# ip.addr == 192.168.1.1 and tcp.port == 80

# Capturar solo tráfico de nmap
# tcp.flags.syn == 1 and tcp.flags.ack == 0
```

### Niveles de Debug (-d1 a -d9)

```bash
nmap -d1 192.168.1.1    # Errores básicos y warnings
nmap -d2 192.168.1.1    # + detalles de conexión
nmap -d3 192.168.1.1    # + timing interno y planificación
nmap -d4 192.168.1.1    # + paquetes enviados/recibidos
nmap -d5 192.168.1.1    # + decodificación raw de paquetes
nmap -d6 192.168.1.1    # + payload hex completo
nmap -d7 192.168.1.1    # + todo el tráfico de red
nmap -d8 192.168.1.1    # + datos internos de NSE
nmap -d9 192.168.1.1    # + TODO (incluye nmap internals)
```

### Escenarios de Troubleshooting

```bash
# Escenario 1: Escaneo a AWS no funciona
nmap -Pn -sT 54.xxx.xxx.xxx  # Usá -Pn y -sT

# Escenario 2: UDP scan no da resultados
nmap -sUV -p 161,500,4500 --max-retries 2 192.168.1.1  # -V para versiones

# Escenario 3: Resultados inconsistentes
nmap -T3 --max-retries 5 --host-timeout 10m 192.168.1.1

# Escenario 4: Nmap muy lento en /24
nmap -T4 -F --min-hostgroup 64 --max-retries 2 192.168.1.0/24

# Escenario 5: OS detection no funciona
nmap -O --osscan-guess -p 22,80,443 192.168.1.1

# Escenario 6: Scripts NSE no se ejecutan
sudo nmap --script-updatedb
nmap --script "default" -d 192.168.1.1
```

## [nmap](../raw/nm4p.md) con [nmap](../raw/nm4p.md)-vulners y Vulscan

### Instalar nmap-vulners

```bash
# Instalar nmap-vulners
cd /usr/share/nmap/scripts/
git clone https://github.com/vulnersCom/nmap-vulners.git
sudo nmap --script-updatedb

# Uso
nmap --script nmap-vulners -sV 192.168.1.1

# Output típico:
# PORT     STATE SERVICE    VERSION
# 80/tcp   open  http       Apache httpd 2.4.29
# | vulners:
# |   cpe:/a:apache:http_server:2.4.29:
# |     CVE-2017-9798  7.5     https://vulners.com/cve/CVE-2017-9798
# |     CVE-2018-1312  6.8     https://vulners.com/cve/CVE-2018-1312
# |_    CVE-2017-7679  6.4     https://vulners.com/cve/CVE-2017-7679
```

### Instalar Vulscan

```bash
# Instalar vulscan
cd /usr/share/nmap/scripts/
git clone https://github.com/scipag/vulscan.git
sudo nmap --script-updatedb

# Uso básico
nmap --script vulscan -sV 192.168.1.1

# Actualizar base de datos CVE
cd /usr/share/nmap/scripts/vulscan/utilities/updater/
chmod +x updateFiles.sh
./updateFiles.sh

# Usar con diferentes bases de datos
nmap --script-args vulscandb=scipvuldb.csv -sV 192.168.1.1
nmap --script-args vulscandb=cve.csv -sV 192.168.1.1
nmap --script-args vulscandb=exploitdb.csv -sV 192.168.1.1
nmap --script-args vulscandb=openvas.csv -sV 192.168.1.1
nmap --script-args vulscandb=securityfocus.csv -sV 192.168.1.1
nmap --script-args vulscandb=xforce.csv -sV 192.168.1.1

# Output típico:
# 22/tcp   open  ssh     OpenSSH 6.7p1 Debian 5+deb8u3 (protocol 2.0)
# | vulscan: OpenSSH 6.7p1:
# |   11972  OpenSSH < 7.4 - 'user_exists' - User Enumeration
# |   41458  OpenSSH 6.9 < 7.0 p1 - 'roaming' - Unauthorized Access
# |_  41694  OpenSSH 5.5 < 7.3 - Glibc - (Poisoned Nullbyte) - RCE
```

### [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) Automatizado de Vulnerabilidades

```bash
#!/bin/bash
# vuln_pipeline.sh
TARGETS=$1
OUTPUT_DIR="vuln_scans/$(date +%Y-%m-%d)"

mkdir -p $OUTPUT_DIR

echo "[*] Discovery..."
nmap -sn -T4 -oG $OUTPUT_DIR/discovery.grep $TARGETS

# Extraer hosts vivos
grep "Up$" $OUTPUT_DIR/discovery.grep | awk "{print \$2}" > $OUTPUT_DIR/hosts.txt

echo "[*] Escaneo de servicios + versiones..."
nmap -sS -sV -T4 -iL $OUTPUT_DIR/hosts.txt -oX $OUTPUT_DIR/services.xml

echo "[*] Escaneo de vulnerabilidades con vulners..."
nmap -sV --script nmap-vulners -T4 -iL $OUTPUT_DIR/hosts.txt -oX $OUTPUT_DIR/vulners.xml

echo "[*] Escaneo de vulnerabilidades con vulscan..."
nmap -sV --script vulscan -T4 -iL $OUTPUT_DIR/hosts.txt -oX $OUTPUT_DIR/vulscan.xml

echo "[*] Escaneo NSE vuln categoría..."
nmap --script "vuln" -T4 -iL $OUTPUT_DIR/hosts.txt -oX $OUTPUT_DIR/nse_vuln.xml

echo "[*] Generando reporte consolidado..."
python3 merge_vuln_reports.py $OUTPUT_DIR

echo "[*] Completo! Reportes en $OUTPUT_DIR"
```
## Comparación de Escáneres de [red](../raw/r3d3s-f0nd4m3nt0s.md)

### masscan

```bash
# masscan es ultra-rápido (escanea internet entero)
masscan -p80,443 0.0.0.0/0 --rate=10000
```

| Característica | [nmap](../raw/nm4p.md) | masscan |
|---------------|------|---------|
| Velocidad | ~1000 pkts/s | ~25M pkts/s |
| Detección OS | Sí | No |
| Service version | Sí | Banner grab |
| NSE scripts | 600+ | No |
| Tipos de scan | Todos | Solo SYN |
| Precisión | Muy alta | Alta |
| Cuándo usarlo | Auditoría detallada | Barrido masivo |

**Combinarlos:**
```bash
masscan -p80,443,22 192.168.1.0/24 --rate=1000 -oJ masscan.json
cat masscan.json | jq -r '"'"'.[].ip'"'"' | nmap -iL - -sV -sC
```

### rustscan

```bash
# rustscan es rápido y simple
rustscan -a 192.168.1.0/24
rustscan -a 192.168.1.1 -- -sV -sC    # Integración nmap
```

| Característica | nmap | rustscan |
|---------------|------|----------|
| Velocidad | Alta | Muy alta |
| OS detection | Sí | No (delega a nmap) |
| Service version | Sí | Sí (via nmap) |
| Scripts | 600+ NSE | No |
| Config | Compleja | Simple |
| Cuándo | Auditoría | Discovery rápido |

### zmap

```bash
# Diseñado para escanear TODO internet
zmap -p 443 0.0.0.0/0
```

| Característica | nmap | zmap |
|---------------|------|------|
| Velocidad | ~1k pkts/s | ~1.4M pkts/s |
| OS detection | Sí | No |
| Service version | Sí | No |
| Scripts | 600+ NSE | No |
| Modo stateless | No | Sí |
| Output | XML/Grep/Normal | JSON/CSV/Redis |
| Cuándo | Auditoría | Censos masivos |

### unicornscan

```bash
# Escaneo paralelo masivo
unicornscan -mT 192.168.1.0/24:1-1000
```

| Característica | nmap | unicornscan |
|---------------|------|-------------|
| Velocidad | Alta | Muy alta |
| Escaneo asíncrono | Parcial | Sí |
| OS detection | Sí | Limitado |
| Scripts | 600+ NSE | Módulos propios |
| Cuándo | Auditoría | Pentest relámpago |

### Benchmark de Velocidad ([subred](../raw/r3d3s-f0nd4m3nt0s.md#subredes) /24, SYN scan, top-1000)

| Herramienta | Tiempo | Precisión | Uso de CPU | Notas |
|------------|--------|-----------|------------|-------|
| nmap (T4) | ~3 min | 99% | 15% | Más completo |
| nmap (T5) | ~1 min | 95% | 25% | Puede perder puertos |
| masscan | ~5 seg | 90% | 40% | Solo SYN |
| rustscan | ~30 seg | 95% | 20% | Buen balance |
| zmap | ~2 seg | 85% | 50% | Solo [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) único |
| unicornscan | ~15 seg | 92% | 35% | Depende del módulo |

### Script para Correr Múltiples Escáneres

```bash
#!/bin/bash
# multi_scanner.sh
TARGET="192.168.1.0/24"
OUTPUT="scan_results"

mkdir -p $OUTPUT

echo "[*] Ejecutando masscan (rápido)..."
masscan -p80,443,22,3389,3306,8080 $TARGET --rate=1000 -oJ $OUTPUT/masscan.json

echo "[*] Ejecutando rustscan..."
rustscan -a $TARGET --range 1-10000 -o $OUTPUT/rustscan.txt

echo "[*] Ejecutando nmap (detallado)..."
cat $OUTPUT/masscan.json | jq -r '"'"'.[].ip'"'"' | sort -u > $OUTPUT/targets.txt
nmap -sS -sV -sC -O -iL $OUTPUT/targets.txt -oX $OUTPUT/nmap_detallado.xml

echo "[*] Unificando resultados..."
python3 merge_scanners.py $OUTPUT
```
## NSE Script Writing Reference — Referencia Completa de Lua

### Tipos de Reglas

```lua
-- portrule: Se ejecuta por cada puerto abierto
portrule = function(host, port)
    return port.protocol == "tcp" and port.number == 80
end

-- hostrule: Se ejecuta una vez por host
hostrule = function(host)
    return host.ip and host.name ~= ""
end

-- prerule: Se ejecuta antes de cualquier escaneo (una vez)
prerule = function()
    return true  -- Siempre se ejecuta
end

-- postrule: Se ejecuta después de todo el escaneo (una vez)
postrule = function()
    return true  -- Para generar reportes finales
end
```

### Librerías Esenciales

```lua
local nmap = require "nmap"         -- Funciones de red
local shortport = require "shortport"  -- Reglas de puerto
local stdnse = require "stdnse"     -- Utilidades estándar
local brute = require "brute"       -- Framework de fuerza bruta
local creds = require "creds"       -- Manejo de credenciales
local http = require "http"         -- Cliente HTTP
local dns = require "dns"           -- Cliente DNS
local sslcert = require "sslcert"   -- SSL/TLS
local smb = require "smb"           -- SMB protocolo
local mysql = require "mysql"       -- MySQL protocolo
local unpwdb = require "unpwdb"     -- Base de users/passwords
local ipOps = require "ipOps"       -- Operaciones con IPs
local nmap = require "nmap"         -- Core nmap
local packet = require "packet"     -- Raw packet manipulation
local target = require "target"     -- Target management
local match = require "match"       -- Pattern matching
local comm = require "comm"         -- Common communication
local string = require "string"     -- String manipulation
local table = require "table"       -- Table manipulation
```

### Funciones Clave de stdnse

```lua
-- Output formateado
local result = stdnse.output_table()
result.ip = "192.168.1.1"
result.ports = {"80", "443"}

-- Formatear strings
stdnse.tohex("data")
stdnse.fromhex("64617461")
stdnse.base64("user:pass")

-- Timestamps
stdnse.format_timestamp(os.time())

-- Strings
stdnse.strjoin(", ", {"a", "b", "c"})
stdnse.strsplit(",", "a,b,c")

-- Debugging
stdnse.debug(1, "Mensaje debug nivel 1")
stdnse.verbose(2, "Mensaje verbose nivel 2")
stdnse.print_debug(3, "Debug con formato: %s", variable)
```

### Funciones Clave de [nmap](../raw/nm4p.md)

```lua
-- Sockets
local socket = nmap.new_socket()
socket:set_timeout(5000)
socket:connect(host.ip, port.number)
socket:send("GET / HTTP/1.0\r\n\r\n")
local response = socket:receive_lines(1)
socket:close()

-- Raw sockets
local socket = nmap.new_socket("tcp")

-- UDP
local socket = nmap.new_socket("udp")

-- SSL
local socket = nmap.new_socket("tcp")
socket:connect(host.ip, port.number)
socket:set_ssl(true)

-- Try/catch
local try = nmap.new_try(function(error)
    socket:close()
    return "Error: " .. error
end)

local data = try(socket:receive_bytes(1024))

-- Registry (datos compartidos entre scripts)
local registry = nmap.registry
if not registry.mi_data then
    registry.mi_data = {}
end
table.insert(registry.mi_data, "valor")
```

### Portrule Types

```lua
-- Puerto específico
portrule = shortport.portnumber(80)

-- Múltiples puertos
portrule = shortport.portnumber({80, 443, 8080})

-- Por servicio
portrule = shortport.service("http")

-- Por puerto o servicio
portrule = shortport.port_or_service(80, "http")

-- Protocolo + puerto
portrule = function(host, port)
    return port.protocol == "tcp" and port.number == 80
end

-- Puerto abierto + servicio
portrule = function(host, port)
    return port.state == "open" and port.service == "http"
end
```

### Thread Management (Mutexes)

```lua
-- Mutex para evitar condiciones de carrera
local mutex = nmap.mutex("mi_mutex")

action = function(host, port)
    mutex "lock"
    -- Código crítico
    mutex "done"
    -- Equivalente a:
    -- mutex:lock()
    -- mutex:done()
end

-- Condiciones
local cond = nmap.cond("mi_condicion")
-- sync primitives: lock, unlock, wait, signal, broadcast
```

### Error Handling

```lua
-- Try/catch con nmap.new_try
local try = nmap.new_try(function(err)
    nmap.log_write("stdout", "Error: %s\n", err)
    socket:close()
    return "Error en la conexión"
end)

-- Try/catch manual
local ok, err = pcall(function()
    socket:connect(host.ip, port.number)
end)

if not ok then
    nmap.log_write("stdout", "Error conectando: %s\n", err)
    return "Falló conexión"
end

-- Logging errors
nmap.log_write("stdout", "Puerto %d: %s\n", port.number, port.state)
```

### Credential Brute-Forcing Framework

```lua
local brute = require "brute"
local creds = require "creds"
local unpwdb = require "unpwdb"

-- Driver básico
local Driver = {
    new = function(self, host, port)
        local o = {host = host, port = port}
        setmetatable(o, self)
        self.__index = self
        return o
    end,
    
    login = function(self, username, password)
        -- Intentar login
        local ok = try_login(self.host, self.port, username, password)
        if ok then
            return true, creds.Account.new(username, password, creds.State.VALID)
        end
        return false
    end,
    
    connect = function(self)
        -- Abrir conexión
        self.socket = nmap.new_socket()
        self.socket:connect(self.host.ip, self.port.number)
        return true
    end,
    
    disconnect = function(self)
        -- Cerrar conexión
        if self.socket then
            self.socket:close()
        end
        return true
    end,
    
    check = function(self)
        -- Verificar que el servicio responde
        return true
    end
}

-- Ejecutar brute force
action = function(host, port)
    local engine = brute.Engine:new(Driver, host, port)
    engine.options.firstonly = true
    engine.options.title = "Servicio XYZ"
    engine.options.max_guesses = 3  -- Máximo intentos por conexión
    engine.options.delay = 1  -- Delay entre intentos
    
    -- Usar diccionario personalizado
    unpwdb.init({
        usernames = {"admin", "root", "user"},
        passwords = {"password", "123456", "admin"}
    })
    
    local result = engine:start()
    return result
end
```

### Registry para Compartir Datos

```lua
-- Script A: guarda datos
local registry = nmap.registry
if not registry.http_servers then
    registry.http_servers = {}
end

action = function(host, port)
    registry.http_servers[host.ip] = {
        server = resp.header["server"],
        title = resp.header["title"]
    }
end

-- Script B: lee datos
local registry = nmap.registry

postrule = function()
    if not registry.http_servers then
        return
    end
    
    local result = stdnse.output_table()
    result.servers = registry.http_servers
    return result
end
```
## Corporate Network Scanning Strategies

### Escaneo a Través de VLANs

```bash
# Escaneo desde switch (si tenés acceso)
nmap -e eth0.10 192.168.10.0/24  # Interfaz VLAN 10
nmap -e eth0.20 192.168.20.0/24  # Interfaz VLAN 20

# Escaneo saltando VLANs (trunk)
nmap -e eth0 --source-port 53 192.168.0.0/16

# Discovery de VLAN hopping
nmap --script vlan-detect 192.168.1.0/24
```

### Escaneo a Través de [vpn](../raw/4n0n1m4t0.md#vpn)

```bash
# Conectar VPN primero
sudo openvpn --config corporate.ovpn

# Verificar interfaz VPN
ip addr show tun0

# Escanear a través de VPN
nmap -sS -sV -T4 -e tun0 10.0.0.0/8

# Notas:
# - Las VPNs suelen tener menos ancho de banda (5-50 Mbps)
# - Usá -T3 en vez de T4 para no saturar
# - --min-hostgroup 32 para no sobrecargar
nmap -sS -sV -T3 --min-hostgroup 32 10.0.0.0/8
```

### Escaneo Programado (Scheduled Scans)

```bash
# Con cron (Linux)
# /etc/cron.d/nmap_scans
0 6 * * 1 root /opt/scripts/nmap_weekly.sh   # Lunes 6 AM
0 2 * * * root /opt/scripts/nmap_daily.sh    # Todos los días 2 AM
0 0 1 * * root /opt/scripts/nmap_monthly.sh  # 1ro de cada mes

# Con systemd timer
# /etc/systemd/system/nmap-weekly.service
[Unit]
Description=Weekly Nmap Scan
[Service]
Type=oneshot
ExecStart=/opt/scripts/nmap_scan.sh
User=root

# /etc/systemd/system/nmap-weekly.timer
[Unit]
Description=Run nmap weekly
[Timer]
OnCalendar=Mon *-*-* 06:00:00
Persistent=true
[Install]
WantedBy=timers.target

# Con Windows Task Scheduler
schtasks /create /tn "Nmap Monthly Scan" /tr "powershell.exe -File C:\scripts\nmap_scan.ps1" /sc monthly /d 1 /st 02:00
```

### Compliance Scanning (PCI-DSS, HIPAA, SOC2)

```bash
# PCI-DSS Requirement 11: Regular network scans
# Escaneo trimestral de toda la red
nmap -sS -sV -O -sC -T4 -p- --script "vuln and safe" \
     -oX pci_dss_scan_$(date +%Y%m%d).xml \
     -oN pci_dss_scan_$(date +%Y%m%d).txt \
     10.0.0.0/8

# HIPAA: Security Rule - Escaneo de puertos y servicios
nmap -sS -sV -O -p 22,80,443,3389,3306,1433,5432 \
     --script ssh-hostkey,ssl-enum-ciphers \
     10.0.0.0/8

# SOC2: Escaneo de vulnerabilidades trimestral
nmap -sV --script http-vuln-*,smb-vuln-*,ssl-* \
     -T4 -oX soc2_scan.xml 10.0.0.0/8
```

### Agent-Based vs Agentless

```bash
# Agentless (nmap remoto)
# + No requiere instalar nada en targets
# + Fácil de configurar
# - Limitado a lo que ofrece nmap
# - No puede ver procesos internos

# Agent-based
# + Mayor visibilidad (logs, procesos, configs)
# + Escaneo continuo
# - Requiere deploy de agentes
# - Más complejo

# Estrategia híbrida:
# Usá nmap para discovery y escaneo externo
# Agentes para monitoreo continuo interno
```

### Seguridad al Usar [nmap](../raw/nm4p.md)

- No escanees [redes](../raw/r3d3s-f0nd4m3nt0s.md) que no son tuyas sin autorización.
- En algunos países, escanear sin permiso es ilegal.
- Obtené autorización por escrito (ROE - Rules of Engagement).
- Usá timing polite (T2) en producción.
- Nunca uses `--script exploit` sin autorización.
- Documentá todos los escaneos y resultados.
- Tené un plan de respuesta ante incidentes.

```
Template de autorización:
Yo, [nombre], autorizo a [persona/equipo] a realizar
escaneos de seguridad en las siguientes direcciones IP:
[lista de IPs/rangos]
Fechas: [inicio] a [fin]
Propósito: [auditoría/pentest/compliance]
Firma: _______________
Fecha: _______________
```

### Escaneo de Redes Corporativas Grandes

```bash
# Estrategia para empresas con 1000+ hosts

# Paso 1: Discovery rápido de toda la red
nmap -sn -T4 --min-hostgroup 256 -n 10.0.0.0/8 -oG discovery.grep

# Paso 2: Segmentar por tipo de host
grep "Up" discovery.grep | grep "10.0.0." > servidores.txt
grep "Up" discovery.grep | grep "10.0.1." > puestos.txt
grep "Up" discovery.grep | grep "10.0.2." > impresoras.txt

# Paso 3: Escaneo específico por segmento
nmap -iL servidores.txt -sS -sV -O -T4 --top-ports 1000 -oX servidores.xml
nmap -iL puestos.txt -sS -sV -T4 -F -oX puestos.xml
nmap -iL impresoras.txt -sV -T4 -p 80,443,9100,515,631 -oX impresoras.xml

# Paso 4: Vulnerabilidades (solo servidores críticos)
nmap -iL servidores.txt --script "vuln" -sV -T4 -oX vulns.xml

# Paso 5: Generar reportes consolidados
python3 consolidate_reports.py *.xml
```

## [nmap](../raw/nm4p.md) en Scripts y Automatización

### Wrapper en Bash

```bash
#!/bin/bash
TARGET=$1
OUTPUT_DIR="escaneos/$(date +%Y-%m-%d_%H-%M)"
mkdir -p $OUTPUT_DIR

echo "[*] Escaneando $TARGET..."
nmap -sn $TARGET -oA $OUTPUT_DIR/discovery
nmap -sS -sV -T4 --top-ports 1000 $TARGET -oA $OUTPUT_DIR/ports
nmap -O $TARGET -oA $OUTPUT_DIR/os
nmap -sV --script "vuln and safe" $TARGET -oA $OUTPUT_DIR/vulns
echo "[*] Completo! Reportes en $OUTPUT_DIR"
```

### Wrapper en [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)

```powershell
# nmap_scan.ps1
param([Parameter(Mandatory=$true)][string]$Target)

$outputDir = "escaneos/$(Get-Date -Format 'yyyy-MM-dd_HH-mm')"
New-Item -ItemType Directory -Path $outputDir -Force

Write-Host "[*] Escaneando $Target..."
nmap -sn $Target -oA "$outputDir/discovery"
nmap -sS -sV -T4 --top-ports 1000 $Target -oA "$outputDir/ports"
nmap -O $Target -oA "$outputDir/os"
nmap --script "vuln and safe" $Target -oA "$outputDir/vulns"

Write-Host "[*] Completo! Reportes en $outputDir"
```

### Automatización con [python](../raw/pyth0n-f0r-h4ck1ng.md)

```python
#!/usr/bin/env python3
import subprocess
import json
import xml.etree.ElementTree as ET
from datetime import datetime

class NmapScanner:
    def __init__(self, target, output_dir="scans"):
        self.target = target
        self.output_dir = output_dir
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    
    def run_scan(self, args, name):
        output_file = f"{self.output_dir}/{self.timestamp}_{name}.xml"
        cmd = ["nmap"] + args.split() + [self.target, "-oX", output_file]
        print(f"[*] Running: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        return output_file
    
    def parse_results(self, xml_file):
        tree = ET.parse(xml_file)
        root = tree.getroot()
        results = []
        for host in root.findall("host"):
            ip = host.find("address").get("addr")
            estado = host.find("status").get("state")
            ports = []
            for port in host.findall(".//port"):
                port_id = port.get("portid")
                state = port.find("state").get("state")
                service = port.find("service")
                service_name = service.get("name") if service is not None else "unknown"
                ports.append({"port": int(port_id), "state": state, "service": service_name})
            results.append({"ip": ip, "status": estado, "ports": ports})
        return results
    
    def quick_scan(self):
        return self.run_scan("-sS --top-ports 100 -T4", "quick")
    
    def full_scan(self):
        return self.run_scan("-sS -sV -O -sC -T4", "full")
    
    def vuln_scan(self):
        return self.run_scan("--script vuln -sV", "vuln")

scanner = NmapScanner("192.168.1.0/24")
xml_file = scanner.quick_scan()
results = scanner.parse_results(xml_file)
print(json.dumps(results, indent=2))
```

## Ejemplos Prácticos

### Descubrir todos los dispositivos en tu [red](../raw/r3d3s-f0nd4m3nt0s.md)

```bash
nmap -sn 192.168.1.0/24
```

**Salida:**
```
Nmap scan report for 192.168.1.1
Host is up (0.0012s latency).
MAC Address: 00:11:22:33:44:55 (Cisco)
Nmap scan report for 192.168.1.100
Host is up (0.045s latency).
MAC Address: AA:BB:CC:DD:EE:FF (Apple)
Nmap done: 256 IP addresses (3 hosts up) scanned in 5.67s
```

### Escanear un servidor web a fondo

```bash
nmap -sV -sC -p 80,443 --script http-enum,http-headers,http-title 192.168.1.100
```

### Escanear todo con detección de OS

```bash
nmap -sS -sV -O -p- -T4 192.168.1.1
# ATENCIÓN: -p- tarda ~10-30 min por host
```

### Buscar EternalBlue (MS17-010)

```bash
nmap -p 445 --script smb-vuln-ms17-010 192.168.1.0/24
```

### Escaneo sigiloso

```bash
nmap -sS -f -D RND:10 -T2 --source-port 53 192.168.1.100
```

### Escaneo [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) de servicios comunes

```bash
nmap -sU -p 53,67-68,123,161,500 192.168.1.1
```

### Detectar vulnerabilidades [http](../raw/r3d3s-f0nd4m3nt0s.md#http)

```bash
nmap -p 80,443 --script http-vuln-* 192.168.1.100
```

### Enumerar usuarios [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)

```bash
nmap -p 139,445 --script smb-enum-users 192.168.1.100
```

### Verificar config [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))

```bash
nmap -p 443 --script ssl-enum-ciphers,ssl-heartbleed,ssl-cert 192.168.1.100
```

### Enumeración completa

```bash
nmap -sV -sC -O -p- --traceroute 192.168.1.1
```

## Interpretación de Puertos

| [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) | Transporte | Servicio | Uso común | Riesgo |
|--------|-----------|----------|-----------|--------|
| 21 | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) | FTP | Transferencia archivos | ALTO - texto plano |
| 22 | TCP | SSH | Shell remoto | Bajo (si config OK) |
| 23 | TCP | Telnet | Shell remoto | ALTO - sin [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) |
| 25 | TCP | SMTP | Correo saliente | SPAM, open relay |
| 53 | TCP/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) | [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) | Resolución nombres | Zone transfer |
| 69 | UDP | TFTP | Transferencia archivos | ALTO - sin auth |
| 80 | TCP | [http](../raw/r3d3s-f0nd4m3nt0s.md#http) | Web | Ataques web |
| 110 | TCP | POP3 | Correo entrante | Texto plano |
| 111 | TCP/UDP | [rpc](../raw/w1n-s9bsyst3ms.md#rpc) | Servicios NFS | Enumeración, [rce](../raw/w3b-h4ck1ng.md#rce) |
| 123 | UDP | NTP | Sincronización | Amplificación DDoS |
| 135 | TCP | MSRPC | Windows RPC | Enumeración |
| 137-139 | TCP/UDP | NetBIOS | Compartición | Enumeración [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) |
| 143 | TCP | IMAP | Correo entrante | Credenciales |
| 161 | UDP | SNMP | Monitoreo | Info sistema |
| 389 | TCP | LDAP | Directorio Activo | Enumeración usuarios |
| 443 | TCP | [https](../raw/r3d3s-f0nd4m3nt0s.md#https) | Web [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) | Ataques web |
| 445 | TCP | SMB | Archivos compartidos | EternalBlue, ransomware |
| 465 | TCP | SMTPS | SMTP SSL | SPAM |
| 500 | UDP | ISAKMP | [vpn](../raw/4n0n1m4t0.md#vpn) IPsec | Enumeración [vpn](../raw/4n0n1m4t0.md#vpn) |
| 587 | TCP | SMTP | Correo con auth | SPAM |
| 636 | TCP | LDAPS | LDAP SSL | Enumeración |
| 993 | TCP | IMAPS | IMAP SSL | Acceso correo |
| 995 | TCP | POP3S | POP3 SSL | Acceso correo |
| 1080 | TCP | SOCKS | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) | [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) abierto |
| 1194 | UDP | OpenVPN | VPN | Acceso [red](../raw/r3d3s-f0nd4m3nt0s.md) interna |
| 1433 | TCP | MSSQL | SQL Server | [sqli](../raw/w3b-h4ck1ng.md#sql-injection), RCE |
| 1521 | TCP | Oracle | Oracle DB | Credenciales default |
| 2049 | TCP/UDP | NFS | Archivos red | Acceso sin auth |
| 2181 | TCP | ZooKeeper | Coordinación | Sin auth |
| 2375 | TCP | [docker](../raw/d0ck3r-f0r-h4ck3rs.md) | API [docker](../raw/d0ck3r-f0r-h4ck3rs.md) | RCE completo |
| 2376 | TCP | Docker [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) | API Docker | RCE si mal config |
| 3128 | TCP | Squid | Proxy HTTP | Proxy abierto |
| 3306 | TCP | MySQL | MySQL | Acceso datos |
| 3389 | TCP | RDP | Escritorio remoto | BlueKeep |
| 4444 | TCP | [metasploit](../raw/m3t4spl01t.md) | Backdoor | ALTO |
| 5432 | TCP | PostgreSQL | PostgreSQL | Acceso datos |
| 5555 | TCP | [adb](../raw/4db-d33p-d1v3.md) | [android](../raw/4db-d33p-d1v3.md) Debug | Control total |
| 5601 | TCP | Kibana | Dashboards | Apps web |
| 5900 | TCP | VNC | Remote desktop | Sin auth común |
| 5985 | TCP | WinRM | Remote management | RCE Windows |
| 5986 | TCP | WinRM HTTPS | Remote management | RCE Windows |
| 6379 | TCP | Redis | Cache | RCE (sin auth) |
| 8080 | TCP | HTTP-Proxy | Proxy/alternativo | Ataques web |
| 8443 | TCP | HTTPS-Alt | HTTPS alternativo | Ataques web |
| 9000 | TCP | PHP-FPM | PHP FastCGI | RCE |
| 9090 | TCP | Cockpit | Admin web | RCE |
| 9200 | TCP | Elasticsearch | ELK | Sin auth |
| 9418 | TCP | Git | Git protocol | Código fuente |
| 10000 | TCP | Webmin | Admin web | RCE |
| 11211 | UDP | Memcached | Cache | Amplificación DDoS |
| 27017 | TCP | MongoDB | NoSQL | Sin auth |
| 50070 | TCP | Hadoop HDFS | NameNode | RCE |

## Referencia Rápida de Flags

| Flag | Descripción |
|------|-------------|
| `-sS` | SYN scan (sigiloso, default) |
| `-sT` | Connect scan (completa conexión) |
| `-sU` | [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) scan |
| `-sA` | ACK scan ([firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) detection) |
| `-sF` | FIN scan |
| `-sN` | NULL scan |
| `-sX` | Xmas scan |
| `-sW` | Window scan |
| `-sM` | Maimon scan |
| `-sI` | Idle scan (zombie) |
| `-sO` | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) protocol scan |
| `-sV` | Service version detection |
| `-sC` | Default scripts |
| `-O` | OS detection |
| `-A` | Aggressive (OS+version+scripts+traceroute) |
| `-sn` | Ping scan (solo discovery) |
| `-Pn` | Skip ping (asume hosts up) |
| `-PE` | ICMP echo discovery |
| `-PP` | ICMP timestamp discovery |
| `-PM` | ICMP netmask discovery |
| `-PS` | [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) SYN ping discovery |
| `-PA` | TCP ACK ping discovery |
| `-PU` | UDP ping discovery |
| `-PR` | [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) ping discovery |
| `-PY` | SCTP INIT ping |
| `-sL` | List scan (solo lista [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) |
| `-p` | [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)/s específicos |
| `-p-` | Todos los 65535 puertos |
| `--top-ports` | N puertos más comunes |
| `-F` | Fast mode (top 100 puertos) |
| `-r` | Escaneo secuencial de puertos |
| `-T0..5` | Timing (paranoid a insane) |
| `-f` | Fragmentar paquetes |
| `--mtu` | MTU para fragmentación |
| `-D` | Decoy IPs |
| `--source-port` | Puerto origen específico |
| `--data-length` | Rellenar paquetes |
| `--spoof-mac` | Spoof MAC |
| `--ttl` | TTL personalizado |
| `--badsum` | Checksum incorrecto |
| `--ip-options` | IP options (R, T, U, S) |
| `--adler32` | Adler32 checksum SCTP |
| `--traceroute` | Traceroute |
| `--reason` | Explicar cada estado |
| `--packet-trace` | Ver cada paquete |
| `-v, -vv` | Verbosidad |
| `-d, -dd` | Debug |
| `-oN` | Output normal |
| `-oX` | Output XML |
| `-oG` | Output grepable |
| `-oS` | Output script kiddie |
| `-oA` | Todos los formatos |
| `-iL` | Targets desde archivo |
| `--exclude` | Excluir IPs |
| `--exclude-ports` | Excluir puertos |
| `--excludefile` | Excluir desde archivo |
| `-6` | Modo IPv6 |
| `--proxies` | Escaneo por [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) |
| `--host-timeout` | Timeout por host |
| `--max-retries` | Máx reintentos |
| `--min-parallelism` | Mín probes paralelos |
| `--max-parallelism` | Máx probes paralelos |
| `--min-hostgroup` | Mín hosts en grupo |
| `--max-hostgroup` | Máx hosts en grupo |
| `--scan-delay` | Espera entre probes |
| `--max-scan-delay` | Máx espera entre probes |
| `--rate-limit` | Límite de paquetes/s |
| `--min-rtt-timeout` | Timeout RTT mínimo |
| `--max-rtt-timeout` | Timeout RTT máximo |
| `--initial-rtt-timeout` | Timeout RTT inicial |
| `--randomize-hosts` | Aleatorizar hosts |
| `--randomize-targets` | Aleatorizar targets |
| `--defeat-rst-ratelimit` | Ignorar rate limit RST |
| `--defeat-icmp-ratelimit` | Ignorar rate limit ICMP |
| `--script` | Script/s NSE a ejecutar |
| `--script-args` | Argumentos para scripts |
| `--script-updatedb` | Actualizar DB de scripts |
| `--iflist` | Listar interfaces |
| `--dns-servers` | Servidores [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) específicos |
| `-n` | Sin resolución DNS |
| `-R` | Resolución DNS siempre |
| `--max-os-tries` | Máx intentos OS detection |
| `--osscan-limit` | Limitar OS a puertos abiertos |
| `--osscan-guess` | OS detection agresivo |
| `--version-intensity` | Intensidad version detection |
| `--version-light` | Version detection rápido |
| `--version-all` | Version detection completo |
| `-e` | Interfaz de [red](../raw/r3d3s-f0nd4m3nt0s.md) específica |


