# Linux Admin
## [linux admin](../raw/l1n9x-4dm1n.md) (LVM, LUKS, [systemd](../raw/l1n9x-4dm1n.md#systemd), networking)

> **Autor:** Contribución comunitaria
> **Nivel:** Intermedio
> **Objetivo:** Administrar un sistema Linux a nivel profesional: almacenamiento con LVM, [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) con LUKS, servicios con systemd, [redes](../raw/r3d3s-f0nd4m3nt0s.md), [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls), SSH y containers.
> **Requisitos:** Experiencia básica con línea de comandos Linux.

---

## Índice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2562 lineas)


1. [Introducción](#1-introducción)
   - 1.1 [Linux Administration Mindset](#11-linux-administration-mindset)
   - 1.2 [Distribuciones y gestores de paquetes](#12-distribuciones-y-gestores-de-paquetes)
2. [LVM (Logical Volume Manager)](#2-lvm-logical-volume-manager)
   - 2.1 [Conceptos: PV, VG, LV, PE](#21-conceptos-pv-vg-lv-pe)
   - 2.2 [pvcreate: crear physical volumes](#22-pvcreate-crear-physical-volumes)
   - 2.3 [vgcreate: crear volume groups](#23-vgcreate-crear-volume-groups)
   - 2.4 [lvcreate: crear logical volumes](#24-lvcreate-crear-logical-volumes)
   - 2.5 [lvextend y lvreduce: redimensionar](#25-lvextend-y-lvreduce-redimensionar)
   - 2.6 [lvresize: redimension con una sola orden](#26-lvresize-redimension-con-una-sola-orden)
   - 2.7 [lvremove: eliminar volumes](#27-lvremove-eliminar-volumes)
   - 2.8 [vgchange: activar/desactivar VGs](#28-vgchange-activardesactivar-vgs)
   - 2.9 [pvmove: migrar datos entre discos](#29-pvmove-migrar-datos-entre-discos)
   - 2.10 [Snapshots](#210-snapshots)
   - 2.11 [Thin Provisioning](#211-thin-provisioning)
3. [LUKS (Linux Unified Key Setup)](#3-luks-linux-unified-key-setup)
   - 3.1 [dm-crypt: el kernel crypto layer](#31-dm-crypt-el-kernel-crypto-layer)
   - 3.2 [cryptsetup: la herramienta](#32-cryptsetup-la-herramienta)
   - 3.3 [luksFormat: cifrar un disco](#33-luksformat-cifrar-un-disco)
   - 3.4 [luksOpen: abrir el dispositivo](#34-luksopen-abrir-el-dispositivo)
   - 3.5 [luksAddKey y luksRemoveKey](#35-luksaddkey-y-luksremovekey)
   - 3.6 [luksChangeKey: cambiar contraseña](#36-lukschangekey-cambiar-contraseña)
   - 3.7 [luksHeaderBackup y luksHeaderRestore](#37-luksheaderbackup-y-luksheaderrestore)
   - 3.8 [LUKS2: Argon2](#38-luks2-argon2)
   - 3.9 [Detached Headers](#39-detached-headers)
   - 3.10 [Keyfiles](#310-keyfiles)
4. [systemd](#4-systemd)
   - 4.1 [Unit Types](#41-unit-types)
   - 4.2 [systemctl: start, stop, restart, enable, disable](#42-systemctl-start-stop-restart-enable-disable)
   - 4.3 [systemctl status y journalctl](#43-systemctl-status-y-journalctl)
   - 4.4 [systemctl daemon-reload y list-units](#44-systemctl-daemon-reload-y-list-units)
   - 4.5 [systemctl show, cat, edit](#45-systemctl-show-cat-edit)
   - 4.6 [journalctl: boot, unit, priority, since, until](#46-journalctl-boot-unit-priority-since-until)
   - 4.7 [journalctl output formats](#47-journalctl-output-formats)
5. [systemd-networkd](#5-systemd-networkd)
   - 5.1 [.network files](#51-network-files)
   - 5.2 [.netdev files](#52-netdev-files)
   - 5.3 [.link files](#53-link-files)
   - 5.4 [DHCP](#54-dhcp)
   - 5.5 [Static IP](#55-static-ip)
   - 5.6 [Bonding, Bridging, VLAN](#56-bonding-bridging-vlan)
6. [NetworkManager](#6-networkmanager)
   - 6.1 [nmcli: device, connection, general, networking](#61-nmcli-device-connection-general-networking)
   - 6.2 [nmtui](#62-nmtui)
   - 6.3 [Connection Profiles](#63-connection-profiles)
   - 6.4 [Dispatcher Scripts](#64-dispatcher-scripts)
   - 6.5 [VPN Connections](#65-vpn-connections)
7. [Firewall: nftables](#7-firewall-nftables)
   - 7.1 [Tables, Chains, Rules](#71-tables-chains-rules)
   - 7.2 [Verdicts](#72-verdicts)
   - 7.3 [Maps y Sets](#73-maps-y-sets)
   - 7.4 [Flow Tables](#74-flow-tables)
   - 7.5 [NAT](#75-nat)
   - 7.6 [iptables legacy vs nftables](#76-iptables-legacy-vs-nftables)
   - 7.7 [firewalld: zones, services, rich rules](#77-firewalld-zones-services-rich-rules)
8. [SSH Server](#8-ssh-server)
   - 8.1 [sshd_config: opciones clave](#81-sshd_config-opciones-clave)
   - 8.2 [PermitRootLogin, PasswordAuthentication, PubkeyAuthentication](#82-permitrootlogin-passwordauthentication-pubkeyauthentication)
   - 8.3 [AllowUsers, DenyUsers, AllowGroups](#83-allowusers-denyusers-allowgroups)
   - 8.4 [ClientAliveInterval, MaxAuthTries, LoginGraceTime](#84-clientaliveinterval-maxauthtries-logingracetime)
   - 8.5 [Match Blocks](#85-match-blocks)
   - 8.6 [SSH Keys: ed25519, RSA, ECDSA](#86-ssh-keys-ed25519-rsa-ecdsa)
   - 8.7 [Key Exchange, Ciphers, MACs](#87-key-exchange-ciphers-macs)
9. [Containers](#9-containers)
   - 9.1 [Docker: images, containers, volumes, networks](#91-docker-images-containers-volumes-networks)
   - 9.2 [Docker Compose](#92-docker-compose)
   - 9.3 [Dockerfile](#93-dockerfile)
   - 9.4 [Podman: rootless, pod, kube](#94-podman-rootless-pod-kube)
   - 9.5 [LXC/LXD: containers, profiles, snapshots](#95-lxclxd-containers-profiles-snapshots)
10. [Monitoring](#10-monitoring)
    - 10.1 [htop, iotop, nethogs, iftop](#101-htop-iotop-nethogs-iftop)
    - 10.2 [iostat, vmstat, sar](#102-iostat-vmstat-sar)
    - 10.3 [atop y glances](#103-atop-y-glances)
    - 10.4 [netdata](#104-netdata)
    - 10.5 [Prometheus Node Exporter](#105-prometheus-node-exporter)
11. [Ejercicios Prácticos](#11-ejercicios-prácticos)
    - 11.1 [Ejercicio 1: Setup LVM completo](#111-ejercicio-1-setup-lvm-completo)
    - 11.2 [Ejercicio 2: Cifrar un volumen con LUKS](#112-ejercicio-2-cifrar-un-volumen-con-luks)
    - 11.3 [Ejercicio 3: Crear un servicio systemd](#113-ejercicio-3-crear-un-servicio-systemd)
    - 11.4 [Ejercicio 4: Configurar firewall con nftables](#114-ejercicio-4-configurar-firewall-con-nftables)
    - 11.5 [Ejercicio 5: Hardening de SSH](#115-ejercicio-5-hardening-de-ssh)
    - 11.6 [Ejercicio 6: Dockerizar una app](#116-ejercicio-6-dockerizar-una-app)
    - 11.7 [Ejercicio 7: Monitoring stack con netdata + prometheus](#117-ejercicio-7-monitoring-stack-con-netdata--prometheus)
    - 11.8 [Ejercicio 8: Thin provisioning con LVM](#118-ejercicio-8-thin-provisioning-con-lvm)
12. [Referencias](#12-referencias)

---

## 1) Introducción

### 1.1 Linux Administration Mindset

Administrar Linux no es "aprender comandos". Es entender cómo funciona el [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos). El administrador Linux piensa en:

- **Archivos y procesos:** Todo es un archivo o un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)
- **Logs:** Ante cualquier problema, primero mirá los logs ([journalctl](../raw/l1n9x-4dm1n.md#journalctl), /var/log)
- **Automatización:** Si lo hacés dos veces, scriptealo
- **Idempotencia:** Tus scripts deben poder ejecutarse múltiples veces sin romper nada
- **Principio de mínimo privilegio:** Usá root solo cuando sea necesario
- **Keep it simple:** La solución más simple suele ser la mejor

### 1.2 Distribuciones y gestores de paquetes

| Familia | Gestor | Comandos básicos |
|---------|--------|------------------|
| Debian/Ubuntu | apt | `apt update && apt upgrade -y` |
| RHEL/CentOS/Fedora | dnf/yum | `dnf update -y` |
| Arch | pacman | `pacman -Syu` |
| SUSE | zypper | `zypper update` |
| Alpine | [apk](../raw/4pk-r3v3rs1ng.md) | `apk update && apk upgrade` |

```bash
# Debian/Ubuntu
apt update                    # actualiza índice de paquetes
apt upgrade -y                # actualiza paquetes instalados
apt install nginx             # instala
apt remove nginx              # elimina paquete
apt purge nginx               # elimina paquete + config
apt autoremove                # limpia dependencias no usadas
dpkg -l                       # lista paquetes instalados
dpkg -L nginx                 # archivos de un paquete
apt show nginx                # info del paquete

# RHEL/CentOS
dnf install nginx
dnf remove nginx
dnf groupinstall "Development Tools"
rpm -qa | grep nginx
yumdownloader --source nginx
```

---

## 2) LVM (Logical Volume Manager)

### 2.1 Conceptos: PV, VG, LV, [pe](../raw/w1n-1nt3rn4ls.md#pe)

LVM abstrae el almacenamiento físico en capas lógicas. Esto permite redimensionar volúmenes sin particionar discos.

```
Discos físicos (/dev/sda, /dev/sdb)
    ↓
Physical Volumes (PV) — pvcreate
    ↓
Volume Group (VG) — vgcreate (pool de almacenamiento)
    ↓
Logical Volumes (LV) — lvcreate (similares a particiones)
    ↓
Sistema de archivos — mkfs.ext4, mkfs.xfs
    ↓
Mount point — mount
```

**PE (Physical Extent):** Es la unidad más pequeña de almacenamiento en LVM. Por defecto: 4 MiB. Cuando creás un LV, se asigna en múltiplos de PE.

```
VG "vg_data" (100 GB)
├── LV "lv_root" (50 GB) -> /dev/vg_data/lv_root -> mount en /
├── LV "lv_home" (30 GB) -> /dev/vg_data/lv_home -> mount en /home
└── LV "lv_var"  (20 GB) -> /dev/vg_data/lv_var -> mount en /var
```

```bash
# Ver toda la configuración LVM del sistema
pvs           # resumen de PVs
vgs           # resumen de VGs
lvs           # resumen de LVs

pvdisplay     # detalle de PVs
vgdisplay     # detalle de VGs
lvdisplay     # detalle de LVs

# También:
lsblk         # ver todos los dispositivos de bloque
blkid         # ver UUIDs y filesystems
```

### 2.2 pvcreate: crear physical volumes

Un PV se crea sobre un disco o partición. **OJO:** esto destruye los datos existentes.

```bash
# Crear PV sobre un disco completo
pvcreate /dev/sdb
pvcreate /dev/sdc

# Crear PV sobre una partición
pvcreate /dev/sdd1

# Ver información
pvs
pvdisplay /dev/sdb

# Eliminar PV
pvremove /dev/sdb

# Si el PV tenía datos (pertenecía a un VG), primero hay que:
# 1. pvmove /dev/sdb (mover datos a otro PV)
# 2. vgreduce vg_data /dev/sdb
# 3. pvremove /dev/sdb
```

### 2.3 vgcreate: crear volume groups

Un VG agrupa uno o más PVs para crear un pool de almacenamiento.

```bash
# Crear VG con dos discos
vgcreate vg_data /dev/sdb /dev/sdc

# Crear VG con PE size personalizado (16 MiB)
vgcreate -s 16M vg_data /dev/sdb

# Ver info
vgs
vgdisplay vg_data

# Extender VG (agregar más PVs)
vgextend vg_data /dev/sdd

# Reducir VG (mover datos antes!)
# pvmove /dev/sdd  # mueve todos los datos a otros PVs en el VG
vgreduce vg_data /dev/sdd

# Eliminar VG
vgremove vg_data

# Activar/desactivar VG
vgchange -a y vg_data   # activar
vgchange -a n vg_data   # desactivar
```

### 2.4 lvcreate: crear logical volumes

```bash
# Crear LV de 10 GB
lvcreate -L 10G -n lv_root vg_data

# Crear LV usando el espacio restante (100% FREE)
lvcreate -l 100%FREE -n lv_home vg_data

# Crear LV con tamaño en PE
lvcreate -l 2560 -n lv_var vg_data  # 2560 PE * 4 MiB = 10 GB

# Crear LV con tipo específico
lvcreate --type raid1 -L 10G -n lv_mirror vg_data

# Ver LV
lvs
lvdisplay /dev/vg_data/lv_root

# Formatear y montar
mkfs.ext4 /dev/vg_data/lv_root
mount /dev/vg_data/lv_root /mnt/data

# Eliminar LV
lvremove /dev/vg_data/lv_var
```

### 2.5 lvextend y lvreduce: redimensionar

La gran ventaja de LVM es poder cambiar el tamaño sin particionar.

```bash
# EXTENDER LV (+5 GB)
lvextend -L +5G /dev/vg_data/lv_home

# EXTENDER LV a un tamaño absoluto (30 GB)
lvextend -L 30G /dev/vg_data/lv_home

# EXTENDER LV hasta llenar el VG
lvextend -l +100%FREE /dev/vg_data/lv_home

# Después de extender el LV, hay que redimensionar el FS
# Para ext4:
resize2fs /dev/vg_data/lv_home

# Para xfs:
xfs_growfs /mount/point

# REDUCIR LV (peligroso, siempre backup primero)
# 1. Desmontar
umount /home

# 2. Verificar el FS (obligatorio antes de reducir)
e2fsck -f /dev/vg_data/lv_home

# 3. Reducir el FS PRIMERO (porque el FS es más sensible que LVM)
resize2fs /dev/vg_data/lv_home 20G

# 4. Reducir el LV
lvreduce -L 20G /dev/vg_data/lv_home

# 5. Montar de vuelta
mount /dev/vg_data/lv_home /home
```

**REGLAS DE ORO:**
1. **Siempre** backup antes de reducir
2. **Siempre** reducir el FS primero, después el LV
3. Para extender: primero el LV, después el FS
4. Para reducir: primero el FS, después el LV

### 2.6 lvresize: redimension con una sola orden

`lvresize` unifica `lvextend` y `lvreduce`:

```bash
# Extender
lvresize -L +5G /dev/vg_data/lv_root
lvresize -r -L +5G /dev/vg_data/lv_root  # -r también resizea el FS!

# Reducir
lvresize -L -5G /dev/vg_data/lv_root

# Cambiar a tamaño absoluto
lvresize -L 20G /dev/vg_data/lv_root

# Con -r (resize FS automático)
lvresize -r -L +5G /dev/vg_data/lv_home    # funciona para ext4
lvresize -r -L +5G /dev/vg_data/lv_var     # XFS: extiende OK, reduce NO
```

### 2.7 lvremove: eliminar volumes

```bash
# Desmontar primero
umount /dev/vg_data/lv_old

# Eliminar LV
lvremove /dev/vg_data/lv_old

# Forzar (si hay problemas)
lvremove -f /dev/vg_data/lv_old

# Verificar que ya no existe
lvs
```

### 2.8 vgchange: activar/desactivar VGs

```bash
# Activar todos los VGs
vgchange -a y

# Activar un VG específico
vgchange -a y vg_data

# Desactivar VG (necesario para mover discos físicos)
vgchange -a n vg_data

# Ver estado de activación
vgs -o vg_name,vg_attr

# Atributos: a = active, x = exported, etc.
```

### 2.9 pvmove: migrar datos entre discos

Permite mover datos de un PV a otro dentro del mismo VG sin downtime.

```bash
# Escenario: reemplazar /dev/sdb (viejo, lento) por /dev/sdd (nuevo, rápido)

# 1. Agregar el nuevo PV al VG
vgextend vg_data /dev/sdd

# 2. Mover datos de /dev/sdb a /dev/sdd
pvmove /dev/sdb

# 3. Verificar que /dev/sdb está vacío
pvs -o pv_name,pv_used /dev/sdb  # pv_used = 0

# 4. Eliminar /dev/sdb del VG
vgreduce vg_data /dev/sdb

# 5. Eliminar el PV
pvremove /dev/sdb

# Movimiento selectivo (solo un LV)
pvmove -n lv_root /dev/sdb
```

### 2.10 Snapshots

Los snapshots permiten capturar el estado de un LV en un momento dado. Son copy-on-write: solo ocupan espacio cuando hay cambios.

```bash
# Crear snapshot de 5 GB para lv_home (20 GB)
lvcreate -L 5G -s -n lv_home_snap /dev/vg_data/lv_home

# Ver snapshot
lvs

# Montar snapshot (modo solo lectura, para backup)
mkdir /mnt/snap
mount -o ro /dev/vg_data/lv_home_snap /mnt/snap

# Hacer backup desde el snapshot
rsync -av /mnt/snap/ /backup/home/

# Desmontar y eliminar snapshot
umount /mnt/snap
lvremove /dev/vg_data/lv_home_snap

# RESTAURAR desde snapshot (revertir cambios)
lvconvert --merge /dev/vg_data/lv_home_snap
# Esto fusiona el snapshot con el original, revirtiendo cambios

# Snapshot automático con script:
lvcreate -L 2G -s -n pre_update_snap /dev/vg_data/lv_root
apt update && apt upgrade -y
# Si algo sale mal:
lvconvert --merge /dev/vg_data/pre_update_snap
# Si todo bien:
lvremove /dev/vg_data/pre_update_snap
```

### 2.11 Thin Provisioning

Thin provisioning permite crear LVs que usan más espacio virtual del que realmente tienen asignado.

```bash
# 1. Crear thin pool
lvcreate -L 100G -T vg_data/thin_pool

# 2. Crear thin volumes dentro del pool
lvcreate -V 50G -T vg_data/thin_pool -n lv_thin1
lvcreate -V 200G -T vg_data/thin_pool -n lv_thin2  # 200G virtual, pero pool es 100G

# 3. Formatear y montar normalmente
mkfs.ext4 /dev/vg_data/thin_pool/lv_thin1
mount /dev/vg_data/thin_pool/lv_thin1 /mnt/thin1

# 4. Monitorear uso real del pool
lvs -o lv_name,data_percent,metadata_percent vg_data/thin_pool

# 5. Extender el pool cuando se acerca al límite
lvextend -L +50G vg_data/thin_pool

# 6. Configurar autoextend (en /etc/lvm/lvm.conf)
# thin_pool_autoextend_threshold = 80
# thin_pool_autoextend_percent = 20
```

**ADVERTENCIA:** Si el thin pool se llena, el sistema se congela. ¡Monitoreá siempre!

---

## 3) LUKS (Linux Unified Key Setup)

### 3.1 dm-crypt: el [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) crypto layer

dm-crypt es un subsistema del kernel que proporciona [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) transparente a nivel de bloque. LUKS es el formato estándar que usa dm-crypt.

```bash
# dm-crypt está en el kernel (module: dm_crypt)
lsmod | grep dm_crypt

# Ver algoritmos criptográficos soportados
cat /proc/crypto
```

### 3.2 cryptsetup: la herramienta

```bash
# Instalar cryptsetup
apt install cryptsetup   # Debian/Ubuntu
dnf install cryptsetup   # RHEL/CentOS

# Ver versión y características
cryptsetup --version

# Ver capacidades de LUKS
cryptsetup luksDump --help | grep -i luks2
```

### 3.3 luksFormat: cifrar un disco

**CUIDADO: esto DESTRUYE todos los datos en el disco.**

```bash
# Cifrar disco completo /dev/sdb
cryptsetup luksFormat /dev/sdb

# Cifrar con algoritmo específico
cryptsetup luksFormat --type luks2 --cipher aes-xts-plain64 --key-size 512 /dev/sdb

# Cifrar con iteraciones personalizadas
cryptsetup luksFormat --iter-time 5000 /dev/sdb  # 5 segundos de PBKDF (default 2000ms)

# Ver info del volumen LUKS
cryptsetup luksDump /dev/sdb
```

### 3.4 luksOpen: abrir el dispositivo

```bash
# Abrir volumen LUKS (pide passphrase)
cryptsetup luksOpen /dev/sdb crypt_data

# Esto crea /dev/mapper/crypt_data (el device mapeado descifrado)

# Ahora se puede usar como dispositivo normal
mkfs.ext4 /dev/mapper/crypt_data
mount /dev/mapper/crypt_data /mnt/secret

# Cerrar
umount /mnt/secret
cryptsetup luksClose crypt_data

# Abrir con keyfile
cryptsetup luksOpen --key-file /root/keyfile.bin /dev/sdb crypt_data

# Ver estado de dispositivos abiertos
cryptsetup status crypt_data
```

### 3.5 luksAddKey y luksRemoveKey

LUKS soporta hasta 8 keyslots, permitiendo múltiples contraseñas o keyfiles.

```bash
# Agregar una nueva passphrase
cryptsetup luksAddKey /dev/sdb
# Pide la passphrase existente, después la nueva

# Agregar un keyfile (slot 2)
cryptsetup luksAddKey --key-slot 2 /dev/sdb /path/to/keyfile

# Eliminar un keyslot
cryptsetup luksRemoveKey /dev/sdb
# Pide la passphrase que querés eliminar

# Eliminar keyslot por número
cryptsetup luksKillSlot /dev/sdb 2

# Listar keyslots usados
cryptsetup luksDump /dev/sdb | grep -E "Slot|Key Slot"
```

### 3.6 luksChangeKey: cambiar contraseña

```bash
# Cambiar passphrase (pide la vieja y la nueva)
cryptsetup luksChangeKey /dev/sdb

# Cambiar passphrase de un keyslot específico
cryptsetup luksChangeKey --key-slot 1 /dev/sdb

# OJO: No hay "recuperación" de passphrase. Si perdés todas,
# los datos se pierden para siempre.
```

### 3.7 luksHeaderBackup y luksHeaderRestore

El header LUKS contiene los keyslots cifrados. Sin él, los datos son irrecuperables.

```bash
# Backup del header
cryptsetup luksHeaderBackup /dev/sdb --header-backup-file /root/luks-header-backup.bin

# Restaurar header (si se dañó)
cryptsetup luksHeaderRestore /dev/sdb --header-backup-file /root/luks-header-backup.bin

# Guardar backup en lugar seguro (otro disco, USB, cloud encriptado)
# Si perdés el header, perdés los datos.
```

### 3.8 LUKS2: Argon2

LUKS2 es la versión moderna (desde cryptsetup 2.0+). Usa Argon2 como PBKDF por defecto (en vez de PBKDF2).

```bash
# Crear volumen LUKS2 explícitamente
cryptsetup luksFormat --type luks2 /dev/sdb

# Ver que es LUKS2
cryptsetup luksDump /dev/sdb | head -5

# Convertir LUKS1 a LUKS2
cryptsetup convert --type luks2 /dev/sdb

# Configurar parámetros Argon2
cryptsetup luksFormat --type luks2 --pbkdf argon2id --iter-time 3000 /dev/sdb

# Ventajas de LUKS2:
# - Argon2: más resistente a ataques con ASIC/GPU
# - Resiliencia a daños del header
# - Keyslots más flexibles
# - Token keys (TPM2, PKCS#11, etc.)
```

### 3.9 Detached Headers

El header LUKS se puede almacenar separado del disco cifrado. Útil para escenarios donde el disco no debe revelar que está cifrado.

```bash
# Crear volumen con header separado
cryptsetup luksFormat --header /root/luks-header.bin /dev/sdb

# Abrir con header separado
cryptsetup luksOpen --header /root/luks-header.bin /dev/sdb crypt_data

# Sin el header, el disco parece datos aleatorios (indistinguible)
# Esto es "plausible deniability" parcial
```

### 3.10 Keyfiles

Los keyfiles permiten abrir volúmenes sin passphrase manual. Útil para montajes automáticos.

```bash
# Generar keyfile aleatorio de 2048 bytes
dd if=/dev/urandom of=/root/luks-keyfile.bin bs=512 count=4
chmod 400 /root/luks-keyfile.bin

# Agregar keyfile a LUKS
cryptsetup luksAddKey /dev/sdb /root/luks-keyfile.bin

# Configurar /etc/crypttab para autoapertura
echo "crypt_data /dev/sdb /root/luks-keyfile.bin luks" >> /etc/crypttab

# Configurar /etc/fstab para automontaje
echo "/dev/mapper/crypt_data /mnt/secret ext4 defaults 0 2" >> /etc/fstab

# Ahora se abre solo en boot (el initramfs carga el keyfile)
update-initramfs -u
```

---

## 4) [systemd](../raw/l1n9x-4dm1n.md#systemd)

### 4.1 Unit Types

systemd maneja todos los aspectos del sistema con "units". Cada tipo tiene un propósito:

| Unit Type | Extensión | Propósito |
|-----------|-----------|-----------|
| Service | .service | Demonios y procesos manejados |
| Socket | .socket | Socket de [red](../raw/r3d3s-f0nd4m3nt0s.md) o IPC (activación por socket) |
| Timer | .timer | Eventos temporizados (reemplaza [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs)) |
| Path | .path | Activación por cambio en archivo/directorio |
| Mount | .mount | Puntos de montaje |
| Automount | .automount | Montaje automático al acceder |
| Target | .target | Grupos de units (reemplaza runlevels) |
| Device | .device | Dispositivos udev |
| Slice | .slice | Resource control (cgroups) |
| Scope | .scope | Procesos externos a systemd |

```bash
# Listar units
systemctl list-units                   # units activas
systemctl list-units --all             # todas las units
systemctl list-units --type=service    # solo servicios
systemctl list-units --state=failed    # units fallidas

# Ver todos los tipos de units instaladas
systemctl list-unit-files
systemctl list-unit-files --type=service
```

### 4.2 systemctl: start, stop, restart, enable, disable

```bash
# Control de servicios
systemctl start nginx           # iniciar servicio
systemctl stop nginx            # detener servicio
systemctl restart nginx         # reiniciar servicio
systemctl reload nginx          # recargar config (sin reinicio completo)
systemctl reload-or-restart nginx  # reload si soporta, si no restart

# Habilitar/deshabilitar en boot
systemctl enable nginx           # habilita en boot
systemctl disable nginx          # deshabilita en boot
systemctl enable --now nginx     # enable + start (atajo)
systemctl disable --now nginx    # disable + stop

# Ver estado
systemctl status nginx           # estado detallado (con logs recientes)
systemctl is-active nginx        # active/inactive/failed
systemctl is-enabled nginx       # enabled/disabled/static

# Máscara (hace un servicio imposible de iniciar)
systemctl mask nginx             # link a /dev/null
systemctl unmask nginx           # restaurar
```

### 4.3 systemctl status y [journalctl](../raw/l1n9x-4dm1n.md#journalctl)

```bash
# El output de systemctl status es muy informativo:
systemctl status nginx
# ● nginx.service - A high performance web server and a reverse proxy server
#      Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
#      Active: active (running) since Mon 2024-05-20 10:30:00 ART; 3 days ago
#      Docs: man:nginx(8)
#    Main PID: 12345 (nginx)
#       Tasks: 3 (limit: 2345)
#      Memory: 15.2M
#         CPU: 30.234s
#      CGroup: /system.slice/nginx.service
#              ├─12345 nginx: master process /usr/sbin/nginx
#              └─12346 nginx: worker process
#      Logs: journalctl -u nginx.service
```

### 4.4 systemctl daemon-reload y list-units

```bash
# DESPUÉS de crear o modificar un .service file:
systemctl daemon-reload          # recargar definiciones de units

# list-units con filtros
systemctl list-units --type=service --state=running
systemctl list-units --type=timer --all
systemctl list-units --type=mount --state=mounted

# list-unit-files (todos los archivos .service en el sistema)
systemctl list-unit-files --type=service --state=enabled

# Ver dependencias
systemctl list-dependencies nginx
systemctl list-dependencies multi-user.target
```

### 4.5 systemctl show, cat, edit

```bash
# Ver TODAS las propiedades de una unit (muy detallado)
systemctl show nginx
systemctl show nginx -p ExecStart   # solo una propiedad
systemctl show nginx -p Wants       # dependencias

# Ver el contenido del archivo .service
systemctl cat nginx

# Editar unit (crea drop-in override)
systemctl edit nginx                # abre editor, crea /etc/systemd/system/nginx.service.d/override.conf

# Editar y reemplazar completamente
systemctl edit --full nginx

# Ejemplo de drop-in:
# [Service]
# LimitNOFILE=65536
# Environment=MY_ENV=value
```

### 4.6 journalctl: boot, unit, priority, since, until

```bash
# Logs del sistema entero
journalctl

# Logs desde el último boot
journalctl -b
journalctl -b -1          # boot anterior
journalctl -b -2          # dos boots atrás

# Logs de un servicio específico
journalctl -u nginx
journalctl -u nginx -u sshd  # múltiples services

# Por prioridad
journalctl -p err         # solo errores (y más graves)
journalctl -p warning     # warnings y errores
journalctl -p info -p err # info y err

# Por tiempo
journalctl --since "2024-05-20 10:00:00"
journalctl --since "2024-05-20" --until "2024-05-21"
journalctl --since "2 hours ago"
journalctl --since yesterday

# Seguir logs en tiempo real
journalctl -f
journalctl -u nginx -f

# Logs del kernel
journalctl -k
journalctl -k -b

# Logs de un PID específico
journalctl _PID=12345

# Logs de un ejecutable específico
journalctl _EXE=/usr/sbin/nginx
```

### 4.7 journalctl output formats

```bash
# Formatos de output
journalctl -u nginx -o short        # formato corto (default)
journalctl -u nginx -o short-full   # con timestamp completo
journalctl -u nginx -o verbose      # todos los campos
journalctl -u nginx -o json         # JSON (ideal para parsing)
journalctl -u nginx -o json-pretty  # JSON formateado
journalctl -u nginx -o cat          # solo el mensaje, sin timestamp

# Exportar a archivo
journalctl -u nginx --no-pager > nginx.log
journalctl -u nginx -o json > nginx.json

# Verificar integridad del journal
journalctl --verify

# Limpiar logs viejos
journalctl --vacuum-time=30d        # conservar últimos 30 días
journalctl --vacuum-size=500M       # máximo 500 MB de logs
```

---

## 5) [systemd](../raw/l1n9x-4dm1n.md#systemd)-networkd

### 5.1 .network files

systemd-networkd maneja interfaces de [red](../raw/r3d3s-f0nd4m3nt0s.md). Los archivos .network definen la configuración.

```bash
# Los archivos van en:
# /etc/systemd/network/     (configuración del admin)
# /run/systemd/network/     (configuración runtime)
# /usr/lib/systemd/network/ (configuración del vendor)

# Habilitar networkd
systemctl enable --now systemd-networkd

# Ejemplo: /etc/systemd/network/20-wired.network
```

```
[Match]
Name=enp0s3

[Network]
DHCP=yes
DNS=8.8.8.8
DNS=1.1.1.1
Domains=miempresa.local

[DHCP]
RouteMetric=100
UseDNS=true
UseDomains=true
```

### 5.2 .netdev files

Los archivos .netdev definen dispositivos virtuales (bridges, bonds, VLANs).

```bash
# Ejemplo: bridge
# /etc/systemd/network/25-bridge-br0.netdev
```

```
[NetDev]
Name=br0
Kind=bridge
MACAddress=02:23:45:67:89:ab
```

```bash
# Ejemplo: bond (LAG)
# /etc/systemd/network/30-bond-bond0.netdev
```

```
[NetDev]
Name=bond0
Kind=bond

[Bond]
Mode=802.3ad
MIIMonitorSec=1s
UpDelaySec=2s
DownDelaySec=3s
```

### 5.3 .link files

Los archivos .link controlan parámetros del [driver](../raw/k3rn3l-h4ck1ng.md#windows-drivers)/device de red.

```bash
# /etc/systemd/network/10-rename.link
```

```
[Match]
MACAddress=08:00:27:ab:cd:ef

[Link]
Name=wan0
MACAddress=02:00:00:00:00:01
WakeOnLan=off
```

### 5.4 [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp)

```bash
# Configuración DHCP completa
# /etc/systemd/network/20-dhcp.network
```

```
[Match]
Name=enp*

[Network]
DHCP=yes

[DHCP]
UseDNS=true
UseNTP=true
UseHostname=true
SendHostname=true
```

### 5.5 Static [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)

```bash
# /etc/systemd/network/30-static.network
```

```
[Match]
Name=enp0s8

[Network]
Address=192.168.10.100/24
Gateway=192.168.10.1
DNS=8.8.8.8
DNS=1.1.1.1
Domains=lab.local
```

### 5.6 Bonding, Bridging, [vlan](../raw/r3d3s-f0nd4m3nt0s.md#vlan)

```bash
# Ejemplo completo: bond de dos interfaces + bridge + VLANs

# 1. Bond device: /etc/systemd/network/30-bond-bond0.netdev
[NetDev]
Name=bond0
Kind=bond
[Bond]
Mode=802.3ad
LACPTransmitRate=fast

# 2. Slaves del bond: /etc/systemd/network/30-bond-enp0s3.network
[Match]
Name=enp0s3
[Network]
Bond=bond0

# 30-bond-enp0s4.network
[Match]
Name=enp0s4
[Network]
Bond=bond0

# 3. Bridge sobre bond: /etc/systemd/network/40-bridge-br0.netdev
[NetDev]
Name=br0
Kind=bridge

# 4. Bridge member: /etc/systemd/network/40-bridge-bond0.network
[Match]
Name=bond0
[Network]
Bridge=br0

# 5. IP en bridge: /etc/systemd/network/40-bridge-br0.network
[Match]
Name=br0
[Network]
Address=10.0.0.100/24
Gateway=10.0.0.1
DNS=10.0.0.1

# 6. VLAN sobre el bond:
# /etc/systemd/network/50-vlan100.netdev
[NetDev]
Name=vlan100
Kind=vlan
[VLAN]
Id=100
# /etc/systemd/network/50-vlan100.network
[Match]
Name=vlan100
[Network]
DHCP=yes
```

---

## 6) NetworkManager

### 6.1 nmcli: device, connection, general, networking

NetworkManager es el gestor de [red](../raw/r3d3s-f0nd4m3nt0s.md) por defecto en la mayoría de las distros desktop y muchas server.

```bash
# Estado general
nmcli general status              # estado de NM
nmcli general hostname            # hostname
nmcli networking on/off           # habilitar/deshabilitar networking
nmcli networking connectivity     # check connectivity

# Dispositivos
nmcli device status               # lista de dispositivos
nmcli device show enp0s3          # detalle de dispositivo
nmcli device wifi list            # redes WiFi disponibles

# Conexiones
nmcli connection show              # conexiones existentes
nmcli connection show --active    # solo activas
nmcli connection show "Conexión 1" # detalle de una conexión
```

### 6.2 nmtui

```bash
# Interfaz TUI (text user interface) para NM
nmtui

# Menú:
# - Edit a connection
# - Activate a connection
# - Set system hostname
```

### 6.3 Connection Profiles

```bash
# Crear conexión DHCP ethernet
nmcli connection add type ethernet con-name "oficina" ifname enp0s3

# Crear conexión static
nmcli connection add type ethernet con-name "servidor" ifname enp0s3 \
    ip4 192.168.1.100/24 gw4 192.168.1.1

# Agregar DNS
nmcli connection modify "servidor" ipv4.dns "8.8.8.8 1.1.1.1"
nmcli connection modify "servidor" ipv4.dns-search "lab.local"

# Agregar IP secundaria
nmcli connection modify "servidor" +ipv4.addresses "10.0.0.5/24"

# Cambiar método de conexión
nmcli connection modify "servidor" ipv4.method manual

# Conectar/desconectar
nmcli connection up "servidor"
nmcli connection down "servidor"

# Eliminar
nmcli connection delete "servidor"

# Wi-Fi
nmcli device wifi connect "MiWiFi" password "miclave"
nmcli connection modify "MiWiFi" connection.autoconnect yes
```

### 6.4 Dispatcher Scripts

Los dispatcher scripts se ejecutan cuando cambia el estado de red. Van en `/etc/NetworkManager/dispatcher.d/`.

```bash
# Ejemplo: /etc/NetworkManager/dispatcher.d/50-vpn-route
#!/bin/bash
# Script que agrega una ruta cuando la interfaz específica se conecta

INTERFACE=$1
ACTION=$2

if [ "$INTERFACE" == "enp0s3" ] && [ "$ACTION" == "up" ]; then
    ip route add 10.10.0.0/16 via 192.168.1.1
    systemctl start my-vpn-client
elif [ "$INTERFACE" == "enp0s3" ] && [ "$ACTION" == "down" ]; then
    systemctl stop my-vpn-client
fi
```

```bash
# Hacer ejecutable:
chmod +x /etc/NetworkManager/dispatcher.d/50-vpn-route

# Orden de ejecución:
# Pre-up, pre-down: scripts que empiezan con '0'
# Post-up, post-down: scripts que empiezan con '1-99'
```

### 6.5 [vpn](../raw/4n0n1m4t0.md#vpn) Connections

```bash
# OpenVPN con NetworkManager
nmcli connection import type openvpn file /path/to/config.ovpn

# WireGuard
nmcli connection add type wireguard con-name "wg0" \
    ip4 10.0.0.2/24

nmcli connection modify "wg0" wireguard.private-key "$(cat /etc/wireguard/private.key)"
nmcli connection modify "wg0" +wireguard.allowed-ips "10.0.0.0/24,192.168.0.0/16"
nmcli connection modify "wg0" +wireguard.peer-endpoint "vpn.miempresa.com:51820"
nmcli connection modify "wg0" +wireguard.peer-public-key "..."

# L2TP/IPSec (necesita paquete NetworkManager-l2tp)
nmcli connection add type l2tp con-name "VPN-L2TP" \
    ifname l2tp-eth0 vpn.data "gateway=vpn.miempresa.com, user=mi_usuario, password-flags=0"
```

---

## 7) [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls): nftables

### 7.1 Tables, Chains, Rules

nftables es el reemplazo moderno de iptables. Es más rápido, más legible y maneja familias de protocolos ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip), ip6, inet, [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp), bridge).

```bash
# Instalar
apt install nftables   # Debian/Ubuntu
dnf install nftables   # RHEL/CentOS

# Habilitar
systemctl enable --now nftables

# Ver configuración actual
nft list ruleset
```

**Estructura de nftables:**

```
nftables ruleset
├── Table (tabla) - agrupa chains
│   ├── Chain (cadena) - agrupa reglas, tiene un hook y prioridad
│   │   ├── Rule (regla) - match + verdict
│   │   ├── Rule
│   │   └── Rule
│   └── Chain
└── Table
```

```bash
# Crear tabla
nft add table inet filter

# Crear chain (con hook para base chain)
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }
nft add chain inet filter forward { type filter hook forward priority 0 \; policy drop \; }
nft add chain inet filter output { type filter hook output priority 0 \; policy accept \; }

# Agregar reglas
nft add rule inet filter input iif "lo" accept
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input tcp dport 22 accept
nft add rule inet filter input tcp dport { 80, 443 } accept

# Ver tabla
nft list table inet filter
```

### 7.2 Verdicts

Los verdicts definen qué hacer con un paquete:

```bash
# Verdicts principales:
# accept: permitir el paquete
# drop: descartar el paquete (sin respuesta)
# reject: descartar con notificación
# queue: pasar a userspace
# continue: continuar evaluando reglas
# return: volver de una subchain
# jump: saltar a otra chain
# goto: saltar sin retorno

# Ejemplos:
nft add rule inet filter input tcp dport 22 accept
nft add rule inet filter input tcp dport 23 reject with tcp reset
nft add rule inet filter input ip protocol icmp drop
nft add rule inet filter input jump bad_packets
```

### 7.3 Maps y Sets

Maps y sets permiten optimizar reglas con búsquedas eficientes.

```bash
# SET (conjunto de valores)
nft add set inet filter allowed_ports { type inet_service \; }

# Agregar elementos al set
nft add element inet filter allowed_ports { 22, 80, 443, 8080 }

# Usar el set en una regla
nft add rule inet filter input tcp dport @allowed_ports accept

# MAP (mapeo clave -> valor)
nft add map inet filter port_action { type inet_service : verdict \; }

# Agregar elementos al map
nft add element inet filter port_action { 22 : accept, 80 : accept, 443 : accept, 23 : drop }

# Usar el map
nft add rule inet filter input tcp dport vmap @port_action

# Interval sets (rangos)
nft add set inet filter private_ranges { type ipv4_addr \; flags interval \; }
nft add element inet filter private_ranges { 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 }
nft add rule inet filter input ip saddr @private_ranges drop
```

### 7.4 Flow Tables

Flow tables aceleran el procesamiento de flujos establecidos (hardware offload).

```bash
# Crear flow table
nft add flowtable inet filter f \
    { hook ingress priority 0 \; devices = { eth0, eth1 } \; }

# Usar la flow table
nft add rule inet filter forward ip protocol tcp flow add @f

# Ver estadísticas de flow table
nft list flowtables
```

### 7.5 [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat)

```bash
# Crear tabla para NAT
nft add table ip nat

# Crear chains con hooks de NAT
nft add chain ip nat prerouting { type nat hook prerouting priority -100 \; }
nft add chain ip nat postrouting { type nat hook postrouting priority 100 \; }

# SNAT (Source NAT) - para salida a internet
nft add rule ip nat postrouting ip saddr 192.168.1.0/24 oif "eth0" snat to 1.2.3.4
# O masquerade (IP dinámica):
nft add rule ip nat postrouting ip saddr 192.168.1.0/24 oif "eth0" masquerade

# DNAT (Destination NAT) - port forwarding
nft add rule ip nat prerouting iif "eth0" tcp dport { 80, 443 } dnat to 192.168.1.100

# Redirigir (redirect local)
nft add rule ip nat prerouting tcp dport 8080 redirect to 80
```

### 7.6 iptables [legacy](../raw/l3g4cy-3nt3rpr1s3.md) vs nftables

```bash
# Ver qué está usando el sistema
iptables --version       # legacy
iptables-nft --version   # nftables backend
update-alternatives --config iptables

# Migrar de iptables a nftables
iptables-save > rules.v4       # exportar iptables
iptables-restore-translate -f rules.v4  # convertir a sintaxis nft
nft -f rules.nft               # importar a nftables

# Equivalencias:
# iptables -A INPUT -p tcp --dport 22 -j ACCEPT
# nft add rule inet filter input tcp dport 22 accept

# iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
# nft add rule ip nat postrouting oif "eth0" masquerade

# iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
# nft add rule inet filter forward ct state established,related accept
```

### 7.7 firewalld: zones, services, rich rules

firewalld es un wrapper de nftables/iptables con zonas y servicios.

```bash
# Ver estado
firewall-cmd --state
firewall-cmd --get-default-zone
firewall-cmd --list-all

# Zonas
firewall-cmd --get-zones
# Zonas comunes: drop, block, public, external, dmz, work, home, internal, trusted

# Cambiar zona de interfaz
firewall-cmd --zone=public --change-interface=eth0
firewall-cmd --permanent --zone=public --add-interface=eth0

# Servicios
firewall-cmd --get-services             # servicios disponibles
firewall-cmd --zone=public --add-service=http
firewall-cmd --zone=public --add-service=https
firewall-cmd --permanent --zone=public --add-service={http,https,ssh}

# Puertos directos
firewall-cmd --zone=public --add-port=3000/tcp
firewall-cmd --permanent --zone=public --add-port=3000/tcp

# Rich rules (reglas avanzadas)
firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=192.168.1.0/24 port port=3306 protocol=tcp accept'
firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=10.0.0.0/8 reject'

# Forwarding
firewall-cmd --permanent --add-masquerade
firewall-cmd --permanent --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.100

# Recargar cambios
firewall-cmd --reload

# Modo pánico (cortar todo)
firewall-cmd --panic-on
firewall-cmd --panic-off

# Direct passthrough (reglas nftables/iptables raw)
firewall-cmd --direct --add-rule ipv4 filter INPUT 0 -s 10.0.0.5 -j DROP
```

---

## 8) SSH Server

### 8.1 sshd_config: opciones clave

```bash
# Archivo de configuración: /etc/ssh/sshd_config
# Después de cambios:
systemctl restart sshd    # aplicar cambios

# Testear sintaxis antes de reiniciar
sshd -t
```

### 8.2 PermitRootLogin, PasswordAuthentication, PubkeyAuthentication

```bash
# NO PERMITIR LOGIN COMO ROOT (siempre)
PermitRootLogin no
# Alternativas:
# PermitRootLogin prohibit-password   # solo con key, no pass
# PermitRootLogin forced-commands-only  # solo con command= en authorized_keys

# DESHABILITAR AUTH POR PASSWORD (si usás keys)
PasswordAuthentication no
# En transición, dejá yes pero limitá a usuarios específicos

# HABILITAR AUTH POR KEY (SIEMPRE)
PubkeyAuthentication yes

# Dónde buscar las keys
AuthorizedKeysFile .ssh/authorized_keys

# Tiempo de espera para login
LoginGraceTime 30          # 30 segundos para autenticarse

# Intentos máximos
MaxAuthTries 3
MaxSessions 10
```

### 8.3 AllowUsers, DenyUsers, AllowGroups

```bash
# PERMITIR SOLO USUARIOS ESPECÍFICOS
AllowUsers admin juan desarrollo
# O con dominio:
AllowUsers [email protected]

# DENEGAR USUARIOS ESPECÍFICOS
DenyUsers root nobody test

# PERMITIR SOLO GRUPOS
AllowGroups ssh-users admins

# DENEGAR GRUPOS
DenyGroups guests restricted
```

### 8.4 ClientAliveInterval, MaxAuthTries, LoginGraceTime

```bash
# KEEPALIVE - detectar conexiones muertas
ClientAliveInterval 300      # segundos entre keepalives (5 min)
ClientAliveCountMax 3        # máximos keepalives sin respuesta

# Tiempo para autenticarse
LoginGraceTime 30            # 30 segundos (defecto: 2 min)

# Intentos de autenticación
MaxAuthTries 3               # reintentos (defecto: 6)
MaxSessions 10               # sesiones simultáneas por conexión

# Cerrar conexiones idle
# (combinado con ClientAlive)
# Si ClientAliveInterval=300 y ClientAliveCountMax=3:
# 300*3 = 900 segundos = 15 min sin actividad -> cierra
```

### 8.5 Match Blocks

Match blocks permiten aplicar configuraciones condicionales.

```bash
# Match por usuario
Match User juan
    ChrootDirectory /home/juan/chroot
    ForceCommand internal-sftp
    X11Forwarding no
    AllowTcpForwarding no

# Match por grupo
Match Group developers
    AllowTcpForwarding yes
    X11Forwarding yes
    MaxSessions 5

# Match por dirección IP
Match Address 192.168.1.*,10.0.0.*
    PasswordAuthentication yes

# Match por IP de destino (local)
Match LocalAddress 127.0.0.1
    PermitRootLogin yes

# Match combinado
Match User admin Address 192.168.*
    PasswordAuthentication yes
    PermitRootLogin yes
```

### 8.6 SSH Keys: ed25519, [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), ECDSA

```bash
# ED25519 (RECOMENDADO) - mejor seguridad, más rápido
ssh-keygen -t ed25519 -C "[email protected]"
# Crea ~/.ssh/id_ed25519 y ~/.ssh/id_ed25519.pub

# RSA de 4096 bits (compatibilidad máxima)
ssh-keygen -t rsa -b 4096 -C "[email protected]"

# ECDSA (P-256/384/521)
ssh-keygen -t ecdsa -b 256 -C "[email protected]"

# Claves de host del servidor
ls -la /etc/ssh/ssh_host_*
# ssh_host_ed25519_key
# ssh_host_rsa_key
# ssh_host_ecdsa_key

# Regenerar claves de host
rm /etc/ssh/ssh_host_*
dpkg-reconfigure openssh-server   # Debian
ssh-keygen -A                      # genéricas

# Copiar clave a servidor remoto
ssh-copy-id usuario@servidor
# O manual:
cat ~/.ssh/id_ed25519.pub | ssh usuario@servidor "cat >> ~/.ssh/authorized_keys"
```

### 8.7 Key Exchange, Ciphers, MACs

```bash
# Configuración de cifrado fuerte en /etc/ssh/sshd_config:

# Key Exchange Algorithms (solo curvas elípticas)
KexAlgorithms [email protected],[email protected],diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Ciphers (solo simétricos fuertes)
Ciphers [email protected],[email protected],aes256-gcm@openssh.com,aes128-gcm@openssh.com

# MACs (Message Authentication Codes)
MACs [email protected],[email protected],hmac-sha2-512,hmac-sha2-256

# Host Key Algorithms (solo ed25519 y RSA)
HostKeyAlgorithms [email protected],[email protected],ssh-ed25519,ssh-rsa

# Ver qué algoritmos soporta el cliente
ssh -Q kex
ssh -Q cipher
ssh -Q mac

# Ver qué usa una conexión activa (verbose)
ssh -vv user@host
```

---

## 9) Containers

### 9.1 [docker](../raw/d0ck3r-f0r-h4ck3rs.md): images, containers, volumes, networks

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# IMÁGENES
docker pull nginx:alpine         # descargar imagen
docker images                    # listar imágenes
docker rmi nginx                 # eliminar imagen
docker build -t miapp:1.0 .      # construir desde Dockerfile

# CONTENEDORES
docker run nginx                  # correr contenedor (foreground)
docker run -d nginx               # detach mode (background)
docker run -d --name webserver -p 80:80 nginx
docker run -it ubuntu bash        # interactivo con terminal

docker ps                         # contenedores corriendo
docker ps -a                      # todos los contenedores
docker stop webserver             # detener
docker rm webserver               # eliminar
docker rm -f webserver            # forzar eliminar
docker logs -f webserver          # seguir logs

# VOLUMES
docker volume create data         # crear volumen
docker run -v data:/data nginx    # montar volumen

docker volume ls
docker volume inspect data
docker volume rm data

# NETWORKS
docker network create --subnet 172.20.0.0/16 mired
docker run --network mired --ip 172.20.0.10 nginx
docker network ls
docker network inspect mired
```

### 9.2 Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    networks:
      - frontend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    build: ./app
    expose:
      - "3000"
    environment:
      - DB_HOST=db
      - DB_NAME=mydb
    depends_on:
      - db
    networks:
      - frontend
      - backend

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: mydb
    secrets:
      - db_password
    networks:
      - backend
    restart: always

volumes:
  pgdata:

networks:
  frontend:
  backend:
    internal: true

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

```bash
# Comandos útiles
docker compose up -d              # levantar servicios
docker compose down               # bajar servicios
docker compose logs -f            # seguir logs de todos
docker compose exec app bash      # ejecutar comando en servicio
docker compose ps                 # estado
docker compose restart web        # reiniciar un servicio
docker compose build              # reconstruir imágenes
docker compose pull               # actualizar imágenes
```

### 9.3 Dockerfile

```dockerfile
# Dockerfile multi-etapa (recomendado)
# Etapa 1: build
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/miapp

# Etapa 2: producción (mínima)
FROM alpine:3.19

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# CA certificates para HTTPS
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/miapp .

USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["/app/miapp"]
```

```bash
# Construir
docker build -t miapp:latest .
docker build --no-cache -t miapp:latest .

# Tags
docker tag miapp:latest registry.example.com/miapp:v1.0
docker push registry.example.com/miapp:v1.0
```

### 9.4 Podman: rootless, [pod](../raw/k8s-d33p-d1v3.md#pods), kube

Podman es el reemplazo de Docker daemon-less. No requiere demonio, corre sin root.

```bash
# Instalar
dnf install podman   # RHEL/Fedora
apt install podman   # Debian/Ubuntu

# Rootless (por defecto)
podman run -d --name webserver -p 8080:80 nginx

# Pero el puerto < 1024 requiere root O sysctl:
sudo sysctl net.ipv4.ip_unprivileged_port_start=80
# O usar rootful:
sudo podman run -d --name webserver -p 80:80 nginx

# Pods (como Kubernetes)
podman pod create --name webserver-pod -p 80:80
podman run --pod webserver-pod -d nginx
podman run --pod webserver-pod -d postgres
podman pod stop webserver-pod
podman pod rm webserver-pod

# Generar/generar YAML de Kubernetes
podman generate kube webserver-pod > webserver.yaml
podman play kube webserver.yaml  # recrear desde YAML

# Compatibilidad Docker
alias docker=podman   # Podman es drop-in replacement
```

### 9.5 LXC/LXD: containers, profiles, snapshots

LXC/LXD son containers "sistema" (simulan un OS completo).

```bash
# Instalar LXD
snap install lxd
# O apt:
apt install lxd

# Inicializar
lxd init

# Perfiles (templates de container)
lxc profile list
lxc profile show default

# Crear profile custom
lxc profile create desarrollo
lxc profile edit desarrollo
# Config:
# config:
#   limits.cpu: "2"
#   limits.memory: 2GB
# description: Perfil para desarrollo

# Crear container
lxc launch ubuntu:22.04 mi-container
lxc launch ubuntu:22.04 mi-container -p default -p desarrollo

# Comandos
lxc list
lxc exec mi-container -- bash
lxc file push archivo.txt mi-container/tmp/
lxc file pull mi-container/etc/hosts .
lxc stop mi-container
lxc start mi-container
lxc delete mi-container

# Snapshots
lxc snapshot mi-container pre-update
lxc restore mi-container pre-update

# Publicar imagen desde container
lxc publish mi-container --alias mi-imagen
```

---

## 10) Monitoring

### 10.1 htop, iotop, nethogs, iftop

```bash
# htop - monitor interactivo de procesos
htop
# F3: buscar proceso
# F4: filtrar
# F5: tree view
# F6: ordenar
# F9: matar proceso
# F10: salir

# htop desde terminal remota:
htop -u usuario     # solo procesos de un usuario
htop -t             # tree view por defecto

# iotop - I/O de procesos
iotop               # necesita root o capacidades
iotop -o            # solo procesos con I/O activo

# nethogs - tráfico de red por proceso
nethogs eth0
nethogs             # todas las interfaces
# Muestra: PID, usuario, programa, tráfico enviado/recibido

# iftop - tráfico de red por conexión
iftop -i eth0
iftop -n            # sin resolución DNS
iftop -P            # muestra puertos
# El display muestra barras de tráfico TX/RX
```

### 10.2 iostat, vmstat, sar

```bash
# iostat - estadísticas de I/O
iostat              # CPU y dispositivos
iostat -x           # extendido (avgqu-sz, await, svctm, %util)
iostat -x 2        # cada 2 segundos
iostat -p sda       # solo disco sda

# vmstat - estadísticas virtuales del sistema
vmstat 2           # cada 2 segundos
vmstat -s           # estadísticas resumidas
vmstat -d           # estadísticas de disco
# Columnas:
# r: procesos en run queue
# b: procesos bloqueados
# swpd: swap usado
# si/so: swap in/out
# bi/bo: block I/O in/out
# us/sy/id/wa: % CPU user/system/idle/wait

# sar - System Activity Reporter
sar -u              # CPU (cada 10 min por defecto)
sar -r              # memoria
sar -b              # I/O
sar -n DEV          # red por interfaz
sar -n TCP,ETCP     # estadísticas TCP
sar -S              # swap
sar -q              # load average

# sar histórico (de /var/log/sysstat)
sar -u -s 10:00:00 -e 12:00:00   # CPU entre 10 y 12
sar -f /var/log/sysstat/sa10     # archivo específico
```

### 10.3 atop y glances

```bash
# atop - monitor avanzado con logging
atop                # pantalla interactiva
# Teclas:
# a: ordenar por actividad auto
# c: por CPU
# m: por memoria
# d: por disco
# n: por red
# v: por proceso (detallado)
# t: siguiente histórico
# T: anterior histórico
# q: salir

# atop registra históricos:
atop -r /var/log/atop/atop_20240520  # ver histórico de un día
atop -b 10:00 -e 12:00               # ver rango horario

# glances - monitor todo-en-uno
glances
glances -w                          # modo web server (acceso browser)
glances -s                          # modo server (otro cliente se conecta)
glances -c client-server            # modo cliente

# glaces muestra:
# - CPU (por core)
# - Memory (RAM + swap)
# - Network (por interfaz)
# - Disk I/O
# - Filesystem usage
# - Procesos
# - Docker containers
# - Sensors (temperatura)
```

### 10.4 netdata

```bash
# Instalar netdata (script automático)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# O por paquete:
apt install netdata

# Config
vim /etc/netdata/netdata.conf
# [global]
#   run as user = netdata
#   web files group = netdata

# Acceso web: http://servidor:19999

# Dashboard increíblemente detallado:
# - CPU (por core, interrupciones, freq)
# - RAM (cache, buffer, apps)
# - Disk (per dispositivo, latencia, I/O)
# - Network (paquetes, errores, drops)
# - Procesos
# - Entropy, uptime, load, etc.

# Plugins:
# - python.d.plugin (nginx, apache, mysql, postgres, redis, mongodb...)
# - go.d.plugin (prometheus, kubernetes, etcd...)
# - charts.d.plugin (sensores, APC UPS...)

# Alarmas
/etc/netdata/alarms/   # config de alarmas
# Por defecto incluye: CPU > 80%, RAM > 80%, disk full, etc.
```

### 10.5 Prometheus Node Exporter

```bash
# Descargar e instalar node_exporter
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz
tar xvf node_exporter-*.tar.gz
sudo cp node_exporter /usr/local/bin/

# Crear usuario
sudo useradd -rs /bin/false node_exporter

# Crear service systemd
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Prometheus Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
Restart=on-failure
ExecStart=/usr/local/bin/node_exporter \
    --collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/) \
    --collector.textfile.directory=/var/lib/node_exporter/textfile_collector

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now node_exporter

# Ver métricas
curl http://localhost:9100/metrics

# Colectores habilitados:
# - cpu, diskstats, filesystem, loadavg, meminfo, netdev, network, processes
# - systemd, textfile, time, uname, vmstat
# Colectores adicionales:
# --collector.logind
# --collector.ntp
# --collector.systemd
# --collector.tcpstat
```

---

## 11) Ejercicios Prácticos

### 11.1 Ejercicio 1: Setup LVM completo

Tenés dos discos de 50 GB cada uno (/dev/sdb, /dev/sdc). Configurá:
1. Un VG "vg_data" que use ambos discos
2. Un LV "lv_www" de 20 GB para páginas web
3. Un LV "lv_db" de 15 GB para base de datos
4. Un LV "lv_logs" que use el espacio restante
5. Formateá cada LV con ext4
6. Montálos en /srv/www, /srv/db, /srv/logs
7. Agregalos a /etc/fstab para montaje automático

<details>
<summary>Ver solución</summary>

```bash
# 1. Crear PVs
pvcreate /dev/sdb /dev/sdc

# 2. Crear VG
vgcreate vg_data /dev/sdb /dev/sdc

# 3. Crear LVs
lvcreate -L 20G -n lv_www vg_data
lvcreate -L 15G -n lv_db vg_data
lvcreate -l 100%FREE -n lv_logs vg_data

# 4. Formatear
mkfs.ext4 /dev/vg_data/lv_www
mkfs.ext4 /dev/vg_data/lv_db
mkfs.ext4 /dev/vg_data/lv_logs

# 5. Crear mount points
mkdir -p /srv/{www,db,logs}

# 6. Montar (probar)
mount /dev/vg_data/lv_www /srv/www
mount /dev/vg_data/lv_db /srv/db
mount /dev/vg_data/lv_logs /srv/logs

# 7. Configurar fstab (usar UUID para persistencia)
blkid /dev/vg_data/lv_www >> /etc/fstab
# Editar /etc/fstab para que quede:
# UUID=xxx /srv/www ext4 defaults 0 2
# UUID=yyy /srv/db  ext4 defaults 0 2
# UUID=zzz /srv/logs ext4 defaults 0 2

# Verificar
df -h | grep /srv
lvs
vgs
```
</details>

### 11.2 Ejercicio 2: Cifrar un volumen con LUKS

1. Creá un volumen LUKS en /dev/sdd
2. Abrilo como "crypt_secret"
3. Formatealo con ext4
4. Montalo en /mnt/secret
5. Agregá una segunda passphrase
6. Hacé backup del header LUKS
7. Configurá /etc/crypttab y /etc/fstab para montaje automático con keyfile

<details>
<summary>Ver solución</summary>

```bash
# 1. Formatear LUKS
cryptsetup luksFormat /dev/sdd

# 2. Abrir
cryptsetup luksOpen /dev/sdd crypt_secret

# 3. Formatear
mkfs.ext4 /dev/mapper/crypt_secret

# 4. Montar
mkdir -p /mnt/secret
mount /dev/mapper/crypt_secret /mnt/secret

# 5. Agregar segunda passphrase
cryptsetup luksAddKey /dev/sdd

# 6. Backup header
cryptsetup luksHeaderBackup /dev/sdd --header-backup-file /root/luks-header-backup.bin

# 7. Configurar autoapertura con keyfile
dd if=/dev/urandom of=/root/luks-keyfile.bin bs=512 count=4
chmod 400 /root/luks-keyfile.bin
cryptsetup luksAddKey /dev/sdd /root/luks-keyfile.bin

# 8. Configurar /etc/crypttab
echo "crypt_secret /dev/sdd /root/luks-keyfile.bin luks" >> /etc/crypttab

# 9. Configurar /etc/fstab
echo "/dev/mapper/crypt_secret /mnt/secret ext4 defaults 0 2" >> /etc/fstab

# 10. Probar
umount /mnt/secret
cryptsetup luksClose crypt_secret
# Reiniciar o:
cryptsetup luksOpen /dev/sdd crypt_secret
mount /mnt/secret
```
</details>

### 11.3 Ejercicio 3: Crear un servicio [systemd](../raw/l1n9x-4dm1n.md#systemd)

Creá un servicio systemd para una aplicación [python](../raw/pyth0n-f0r-h4ck1ng.md) "miapp" que:
1. Corre como usuario "appuser"
2. Se inicia después de network.target
3. Se reinicia automáticamente si falla
4. Tiene logging a journald
5. Tiene límites de recursos (max 500M RAM, 100 archivos abiertos)
6. Tiene un "ExecStartPre" que verifica que el venv existe

<details>
<summary>Ver solución</summary>

```bash
# Crear usuario
useradd -r -s /bin/false -d /opt/miapp appuser

# Estructura del proyecto
mkdir -p /opt/miapp
# Copiar app, crear venv, etc.

# Crear servicio
cat > /etc/systemd/system/miapp.service << 'EOF'
[Unit]
Description=Mi Aplicacion Python
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/opt/miapp
Environment=PATH=/opt/miapp/venv/bin:/usr/bin
Environment=PYTHONUNBUFFERED=1

ExecStartPre=/usr/bin/test -d /opt/miapp/venv
ExecStart=/opt/miapp/venv/bin/python /opt/miapp/main.py
ExecStop=/bin/kill -TERM $MAINPID
ExecReload=/bin/kill -HUP $MAINPID

Restart=on-failure
RestartSec=10
StartLimitIntervalSec=60
StartLimitBurst=3

# Resource limits
LimitNOFILE=100
MemoryMax=500M
CPUQuota=50%

# Hardening
ProtectSystem=full
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/opt/miapp /var/log/miapp

[Install]
WantedBy=multi-user.target
EOF

# Habilitar e iniciar
systemctl daemon-reload
systemctl enable --now miapp

# Ver logs
journalctl -u miapp -f
```
</details>

### 11.4 Ejercicio 4: Configurar [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) con nftables

Configurá un firewall con nftables que:
1. Política DROP en input por defecto
2. Permite loopback (lo)
3. Permite tráfico establecido/related
4. Permite SSH (22), [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (80), [https](../raw/r3d3s-f0nd4m3nt0s.md#https) (443)
5. Rate-limit SSH a 10 conexiones/minuto
6. Loggea y dropea paquetes inválidos
7. Permite ICMP ping (limitado a 20/s)
8. Guarda la configuración para que persista

<details>
<summary>Ver solución</summary>

```bash
cat > /etc/nftables.conf << 'EOF'
#!/usr/sbin/nft -f

flush ruleset

table inet filter {
    # Set para rate limiting
    set ssh_limit {
        type ipv4_addr
        size 65536
        flags dynamic,timeout
        timeout 60s
    }

    set icmp_limit {
        type ipv4_addr
        size 65536
        flags dynamic,timeout
        timeout 10s
    }

    chain input {
        type filter hook input priority 0; policy drop;

        # loopback
        iif "lo" accept

        # Established/related
        ct state established,related accept

        # Invalid packets
        ct state invalid log prefix "NFTABLES_INVALID: " drop

        # SSH con rate limit
        tcp dport 22 add @ssh_limit { ip saddr limit rate over 10/minute burst 5 packets } drop
        tcp dport 22 accept

        # Web
        tcp dport { 80, 443 } accept

        # ICMP limitado
        ip protocol icmp icmp type echo-request add @icmp_limit { ip saddr limit rate 20/second } accept
        ip protocol icmp icmp type echo-request log prefix "NFTABLES_PING: " drop
        ip protocol icmp accept

        # Log de todo lo demas
        log prefix "NFTABLES_DROP: " limit rate 5/second
    }

    chain forward {
        type filter hook forward priority 0; policy drop;
        ct state established,related accept
        # Permitir forwarding si es necesario
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}

table ip nat {
    chain postrouting {
        type nat hook postrouting priority 100;
        # Descomentar si se necesita MASQUERADE:
        # oif "eth0" masquerade
    }

    chain prerouting {
        type nat hook prerouting priority -100;
    }
}
EOF

# Cargar
nft -f /etc/nftables.conf

# Habilitar en boot
systemctl enable nftables
systemctl start nftables

# Verificar
nft list ruleset
```
</details>

### 11.5 Ejercicio 5: Hardening de SSH

Configurá SSH hardening según mejores prácticas:
1. Solo autenticación por clave
2. Sin login root
3. Solo usuarios específicos pueden conectar
4. Versión 2 de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) solamente
5. Cifrados fuertes (solo [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256-GCM y Chacha20)
6. Key exchange con curvas elípticas
7. Timeout de autenticación de 30 segundos
8. Banner de advertencia legal

<details>
<summary>Ver solución</summary>

```bash
# Backup de la config original
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Nueva config
cat > /etc/ssh/sshd_config << 'EOF'
# Puertos y protocolo
Port 22
Protocol 2

# Autenticacion
PubkeyAuthentication yes
PasswordAuthentication no
PermitEmptyPasswords no
ChallengeResponseAuthentication no
KerberosAuthentication no
GSSAPIAuthentication no

# Usuarios
PermitRootLogin no
AllowUsers admin devops juan
DenyUsers root nobody test
AllowGroups ssh-users

# Timeouts y reintentos
LoginGraceTime 30
MaxAuthTries 3
MaxSessions 5
ClientAliveInterval 300
ClientAliveCountMax 3

# Cifrado fuerte
KexAlgorithms [email protected],[email protected],diffie-hellman-group16-sha512
Ciphers [email protected],[email protected],aes256-gcm@openssh.com
MACs [email protected],[email protected],hmac-sha2-512

# Host keys
HostKeyAlgorithms [email protected],[email protected]

# Logging
SyslogFacility AUTH
LogLevel VERBOSE

# Banner legal
Banner /etc/ssh/banner.txt

# SFTP
Subsystem sftp internal-sftp

# Match block para SFTP chrooted
Match Group sftp-only
    ChrootDirectory %h
    ForceCommand internal-sftp
    X11Forwarding no
    AllowTcpForwarding no

# Seguridad adicional
UsePrivilegeSeparation yes
StrictModes yes
MaxStartups 10:30:60
IgnoreRhosts yes
HostbasedAuthentication no
PermitTunnel no
AllowAgentForwarding no
AllowStreamLocalForwarding no
EOF

# Crear banner
cat > /etc/ssh/banner.txt << 'EOF'
****************************************************************
*  ACCESO RESTRINGIDO - SOLO PERSONAL AUTORIZADO              *
*  Este sistema es propiedad de MIEMPRESA S.A.                *
*  Todo acceso no autorizado sera penalizado                  *
*  Al conectar acepta las politicas de uso                     *
*  Todas las actividades son monitoreadas                     *
****************************************************************
EOF

# Verificar sintaxis
sshd -t

# Reiniciar
systemctl restart sshd
```
</details>

### 11.6 Ejercicio 6: Dockerizar una app

Creá un Dockerfile y [docker](../raw/d0ck3r-f0r-h4ck3rs.md)-compose.yml para una aplicación web Flask + PostgreSQL que:
1. Multi-stage build (builder y producción)
2. Corre como non-root user
3. Tiene healthcheck
4. Usa secrets para la password de la DB
5. Persiste datos de PostgreSQL

<details>
<summary>Ver solución</summary>

```dockerfile
# Dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

FROM python:3.11-slim

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

COPY --from=builder /root/.local /home/appuser/.local
WORKDIR /app
COPY . .

ENV PATH=/home/appuser/.local/bin:$PATH
ENV PYTHONPATH=/app

USER appuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["python", "app.py"]
```

```yaml
# docker-compose.yml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DB_HOST=db
      - DB_NAME=flaskapp
    secrets:
      - db_password
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - appnet

  db:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: flaskapp
      POSTGRES_USER: flaskapp
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U flaskapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - appnet

volumes:
  pgdata:

secrets:
  db_password:
    file: ./secrets/db_password.txt

networks:
  appnet:
```

```bash
# Preparar
mkdir -p secrets
echo "SuperSecureDBPass123!" > secrets/db_password.txt
chmod 600 secrets/db_password.txt

# Construir y levantar
docker compose build
docker compose up -d
```
</details>

### 11.7 Ejercicio 7: Monitoring stack con netdata + prometheus

Montá un stack de monitoreo con:
- netdata como monitor del sistema
- prometheus node_exporter para métricas
- Configurá que netdata exporte a prometheus

<details>
<summary>Ver solución</summary>

```bash
# 1. Instalar netdata (opción avanzada: source/build)
apt install netdata

# Configurar netdata para recibir requests de prometheus
cat > /etc/netdata/netdata.conf << 'EOF'
[global]
    run as user = netdata
    web files owner = netdata
    web files group = netdata

[web]
    bind to = 0.0.0.0:19999
    allow connections from = localhost 10.0.0.0/8 192.168.0.0/16
    mode = static-threaded
EOF

# 2. Instalar prometheus node_exporter
wget -O /tmp/node_exporter.tar.gz \
    https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz
tar xvf /tmp/node_exporter.tar.gz -C /tmp/
sudo cp /tmp/node_exporter-*/node_exporter /usr/local/bin/

sudo useradd -rs /bin/false node_exporter

cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now node_exporter

# 3. Verificar métricas
curl http://localhost:9090/metrics 2>/dev/null | head -5 || echo "node_exporter en puerto 9100"
curl http://localhost:9100/metrics | head -3

# 4. netdata expone métricas en /api/v1/allmetrics?format=prometheus
# Ya se pueden scrapear desde un prometheus server

echo "Stack listo. Acceder a:"
echo "  netdata:    http://$(hostname):19999"
echo "  metrics:    http://$(hostname):9100/metrics"
```
</details>

### 11.8 Ejercicio 8: Thin provisioning con LVM

Configurá thin provisioning:
1. Creá un thin pool de 50 GB
2. Creá 3 thin volumes de 100 GB cada uno (virtual)
3. Configurá autoextend del pool al 70%
4. Simulá llenado del pool y monitoreá

<details>
<summary>Ver solución</summary>

```bash
# 1. Crear thin pool de 50 GB
lvcreate -L 50G -T vg_data/thin_pool

# 2. Crear thin volumes virtuales de 100 GB
lvcreate -V 100G -T vg_data/thin_pool -n lv_thin1
lvcreate -V 100G -T vg_data/thin_pool -n lv_thin2
lvcreate -V 100G -T vg_data/thin_pool -n lv_thin3

# 3. Formatear y montar
mkfs.ext4 /dev/vg_data/thin_pool/lv_thin1
mkfs.ext4 /dev/vg_data/thin_pool/lv_thin2
mkfs.ext4 /dev/vg_data/thin_pool/lv_thin3

mkdir -p /mnt/thin{1,2,3}
mount /dev/vg_data/thin_pool/lv_thin1 /mnt/thin1
mount /dev/vg_data/thin_pool/lv_thin2 /mnt/thin2
mount /dev/vg_data/thin_pool/lv_thin3 /mnt/thin3

# 4. Configurar autoextend en /etc/lvm/lvm.conf
# Buscar y modificar:
# thin_pool_autoextend_threshold = 70
# thin_pool_autoextend_percent = 20

# 5. Monitoreo
lvs -o lv_name,data_percent,metadata_percent vg_data/thin_pool

# 6. Simular llenado
dd if=/dev/zero of=/mnt/thin1/test.img bs=1M count=20000

# Monitorear el pool
watch -n 1 'lvs -o lv_name,data_percent,metadata_percent vg_data/thin_pool'

# 7. Extender pool manualmente si es necesario
lvextend -L +20G vg_data/thin_pool
```
</details>

---

## 12) Referencias

- **LVM HOWTO:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://tldp.org/HOWTO/LVM-HOWTO/
- **LUKS/cryptsetup docs:** https://gitlab.[com](../raw/w1n-s9bsyst3ms.md#com)/cryptsetup/cryptsetup/-/wikis/home
- **[systemd](../raw/l1n9x-4dm1n.md#systemd) documentation:** https://[systemd](../raw/l1n9x-4dm1n.md#systemd).io/
- **systemd-networkd docs:** https://wiki.archlinux.org/title/Systemd-networkd
- **nftables wiki:** https://wiki.nftables.org/
- **firewalld docs:** https://firewalld.org/documentation/
- **OpenSSH Manual:** https://www.openssh.com/manual.html
- **[docker](../raw/d0ck3r-f0r-h4ck3rs.md) docs:** https://docs.[docker](../raw/d0ck3r-f0r-h4ck3rs.md).com/
- **Podman docs:** https://podman.io/docs
- **LXD docs:** https://linuxcontainers.org/lxd/docs/
- **netdata docs:** https://learn.netdata.[cloud](../raw/cl0ud-h4ck1ng.md)/
- **Prometheus Node Exporter:** https://prometheus.io/docs/guides/node-exporter/
- **Linux Performance (Brendan Gregg):** https://www.brendangregg.com/linuxperf.html
- **Arch Wiki - System Administration:** https://wiki.archlinux.org/title/System_administration

---
*Fin del tutorial l1n9x-4dm1n.md*


