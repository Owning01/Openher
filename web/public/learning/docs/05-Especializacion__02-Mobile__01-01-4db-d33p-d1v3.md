# adb Avanzado — Guía completa (Deep Dive Definitivo)

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (3232 lineas)


1. Cómo [funciona adb internamente](#1-c%C3%B3mo-funciona-adb-internamente) - [1.1 Arquitectura cliente-servidor-puente](#11-arquitectura-cliente-servidor-puente) - 1.2 El [pr[otocolo](./raw/r3d3s adb a bajo nivel](#12-el-protocolo)-adb-a-bajo-nivel) - [1.3 Transporte USB](#13-transporte-usb) - [1.4 Transporte TCP/IP](#14-transporte-tcpip) - 1.5 Servicios que expone adbd](#15-servicios-que-expone-adbd)
2. [Conexión al Dispositivo](#2-conexi%C3%B3n-al-dispositivo) - [2.1 USB — La forma clásica](#21-usb--la-forma-cl%C3%A1sica) - [2.2 Solucionar dispositivos "unauthorized"](#22-solucionar-dispositivos-unauthorized) - [2.3 ADB por WiFi](#23-adb-por-wifi) - [2.4 Múltiples dispositivos](#24-m%C3%BAltiple-dispositivos)
3. [Package Manager (pm)](#3-package-manager-pm--referencia-completa) - [3.1 pm list packages — Todos los filtros](#31-pm-list-packages--todos-los-filtros) - [3.2 pm path — Ruta del APK](#32-pm-path--ruta-del-apk) - [3.3 pm install — Instalación avanzada](#33-pm-install--instalaci%C3%B3n-avanzada) - [3.4 pm uninstall — Desinstalar](#34-pm-uninstall--desinstalar) - [3.5 pm enable / disable — Habilitar/Deshabilitar](#35-pm-enable--disable--habilitardeshabilitar) - [3.6 pm hide / unhide — Ocultar apps](#36-pm-hide--unhide--ocultar-apps) - 3.7 pm grant / revoke — [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) runtime](#37-pm-grant--revoke--permisos-runtime) - [3.8 pm clear — Limpiar datos](#38-pm-clear--limpiar-datos) - [3.9 pm block / unblock — Llamadas y SMS](#39-pm-block--unblock--llamadas-y-sms) - [3.10 pm dump — Información detallada](#310-pm-dump--informaci%C3%B3n-detallada) - [3.11 pm trim-caches — Limpiar caché](#311-pm-trim-caches--limpiar-cach%C3%A9) - 3.12 pm [set-installer — Cambiar instalador](#312-pm-set-installer--cambiar-instalador) - [3.13 pm get-install-location — Ubicación de instalación](#313-pm-get-install-location--ubicaci%C3%B3n-de-instalaci%C3%B3n) - [3.14 pm set-install-location — Cambiar ubicación](#314-pm-set-install-location--cambiar-ubicaci%C3%B3n) - [3.15 pm create-user / remove-user — Usuarios](#315-pm-create-user--remove-user--usuarios) - [3.16 pm list users — Usuarios del dispositivo](#316-pm-list-users--usuarios-del-dispositivo) - [3.17 pm list permissions — Todos los permisos](#317-pm-list-permissions--todos-los-permisos) - [3.18 pm list features — Características hardware](#318-pm-list-features--caracter%C3%ADsticas-hardware) - [3.19 pm list libraries — Librerías del sistema](#319-pm-list-libraries--librer%C3%ADas-del-sistema) - [3.20 pm list instrumentation — Test runners](#320-pm-list-instrumentation--test-runners)
4. [Activity Manager (am)](#4-activity-manager-am) - [4.1 am start — Lanzar activities](#41-am-start--lanzar-activities) - [4.2 am startservice — Servicios](#42-am-startservice--servicios) - [4.3 am broadcast — Broadcasts](#43-am-broadcast--broadcasts) - [4.4 am instrument — Instrumentación](#44-am-instrument--instrumentaci%C3%B3n) - [4.5 am profile — Profiling](#45-am-profile--profiling) - 4.6 am moni[tor — Monitoreo de actividades](#46-am-monitor--monitoreo-de-actividades) - [4.7 am kill / kill-all — Matar procesos](#47-am-kill--kill-all--matar-procesos) - 4.8 am fo[rce-stop — Forzar detención](#48-am-force-stop--forzar-detenci%C3%B3n) - [4.9 am crash — Crash forzado](#49-am-crash--crash-forzado) - [4.10 am set-debug-app / clear-debug-app](#410-am-set-debug-app--clear-debug-app) - [4.11 am stack — Información de stacks](#411-am-stack--informaci%C3%B3n-de-stacks) - [4.12 am task — Información de tareas](#412-am-task--informaci%C3%B3n-de-tareas)
5. [Dumpsys](#5-dumpsys) - [5.1 Listado completo de servicios](#51-listado-completo-de-servicios) - [5.2 Dumpsys batterystats — Batería](#52-dumpsys-batterystats--bater%C3%ADa) - [5.3 Dumpsys meminfo — Memoria](#53-dumpsys-meminfo--memoria) - [5.4 Dumpsys cpuinfo — CPU](#54-dumpsys-cpuinfo--cpu) - [5.5 Dumpsys diskstats — Disco](#55-dumpsys-diskstats--disco) - [5.6 Dumpsys netstats — Red](#56-dumpsys-netstats--red) - [5.7 Dumpsys package — Paquetes](#57-dumpsys-package--paquetes) - [5.8 Dumpsys window — Ventanas](#58-dumpsys-window--ventanas) - [5.9 Dumpsys activity — Activities](#59-dumpsys-activity--activities) - [5.10 Dumpsys alarm — Alarmas](#510-dumpsys-alarm--alarmas) - [5.11 Dumpsys notification — Notificaciones](#511-dumpsys-notification--notificaciones) - [5.12 Dumpsys power — Power management](#512-dumpsys-power--power-management) - [5.13 Dumpsys wifi — WiFi](#513-dumpsys-wifi--wifi) - [5.14 Dumpsys bluetooth — Bluetooth](#514-dumpsys-bluetooth--bluetooth) - [5.15 Dumpsys telephony — Telefonía](#515-dumpsys-telephony--telefon%C3%ADa) - [5.16 Dumpsys location — Ubicación](#516-dumpsys-location--ubicaci%C3%B3n) - [5.17 Dumpsys sensors — Sensores](#517-dumpsys-sensors--sensores) - [5.18 Dumpsys usb — USB](#518-dumpsys-usb--usb) - [5.19 Dumpsys fingerprint — Huellas](#519-dumpsys-fingerprint--huellas) - 5.20 Dumpsys graph[ics — GPU/OpenGL](#520-dumpsys-graphics--gpuopengl) - [5.21 Dumpsys media — Multimedia](#521-dumpsys-media--multimedia) - [5.22 Dumpsys input — Input](#522-dumpsys-input--input) - [5.23 Dumpsys appops — App Ops](#523-dumpsys-appops--app-ops) - [5.24 Dumpsys device_policy — Device Admin](#524-dumpsys-device_policy--device-admin) - [5.25 Dumpsys jobscheduler — Job Scheduler](#525-dumpsys-jobscheduler--job-scheduler) - [5.26 Dumpsys connectivity — Conectividad](#526-dumpsys-connectivity--conectividad) - [5.27 Dumpsys clipboard — Portapapeles](#527-dumpsys-clipboard--portapapeles) - [5.28 Dumpsys wallpaper — Fondos de pantalla](#528-dumpsys-wallpaper--fondos-de-pantalla) - [5.29 Dumpsys audio — Audio](#529-dumpsys-audio--audio) - [5.30 Dumpsys diskstats — Almacenamiento](#530-dumpsys-diskstats--almacenamiento)
6. [Content Providers](#6-content-providers)
7. [Monkey Testing](#7-monkey-testing)
8. [Backup y Restore](#8-backup-y-restore)
9. [adb](../raw/4db-d33p-d1v3.md) Seguro — [rsa Keys y Autorización](#9-adb-seguro--rsa-keys-y-autorizaci%C3%B3n)
10. [ADB en Modo Recovery](#10-adb-en-modo-recovery)
11. [ADB para System Apps](#11-adb-para-system-apps)
12. [ADB para Plataformas Específicas](#12-adb-para-plataformas-espec%C3%ADficas)
13. [Root — Comandos Avanzados](#13-root--comandos-avanzados)
14. N[etworking y Tethering](#14-networking-y-tethering)
15. [Settings Database](#15-settings-database)
16. [Screencast y Captura Remota](#16-screencast-y-captura-remota)
17. [Depuración de WebViews](#17-depuraci%C3%B3n-de-webviews)
18. [Instalación y APKs](#18-instalaci%C3%B3n-y-apks)
19. [Extraer APK](#19-extraer-apk)
20. [Permisos](#20-permisos)
21. [Device Admin](#21-device-admin)
22. [Logs y Debug](#22-logs-y-debug)
23. [Archivos y Filesystem](#23-archivos-y-filesystem)
24. [Automatización y Scripting](#24-automatizaci%C3%B3n-y-scripting)
25. [Overlays, Ventanas y Display](#25-overlays-ventanas-y-display)
26. [Trampas Comunes y Troubleshooting](#26-trampas-comunes-y-troubleshooting)
27. [Referencia Rápida para Pentesting](#27-referencia-r%C3%A1pida-para-pentesting)
28. [Overlay Drawables](#28-overlay-drawables)
29. [ADB sobre WAN](#29-adb-sobre-wan)
30. [ADB para Forense](#30-adb-para-forense)
31. [ADB con Docker](#31-adb-con-docker)
32. [ADB con CI/CD](#32-adb-con-cicd)
33. [ADB para Testing de Red](#33-adb-para-testing-de-red)
34. [Script de Auto-Diagnóstico](#34-script-de-auto-diagn%C3%B3stico)
35. [Comandos Obsoletos y Alternativas](#35-comandos-obsoletos-y-alternativas)
36. [Tabla de Keycodes Completos](#36-tabla-de-keycodes-completos)
37. [ADB y Emuladores Android](#37-adb-y-emuladores-android)
38. [ADB en Recovery Personalizados](#38-adb-en-recovery-personalizados)
39. [ADB con Fastboot](#39-adb-con-fastboot)
40. [ADB con múltiples displays](#40-adb-con-m%C3%BAltiple-displays)
41. [ADB Logcat en Tiempo Real](#41-adb-logcat-en-tiempo-real)
42. [ADB con Termux](#42-adb-con-termux)
43. [Cheatsheet Final](#43-cheatsheet-final)
44. [Seguridad en ADB](#44-seguridad-en-adb)
45. [Referencia de archivos importantes](#45-referencia-de-archivos-importantes)
46. [Integración con Android Studio](#46-integraci%C3%B3n-con-android-studio)
47. [ADB en Windows](#47-adb-en-windows)
48. [ADB Environment Variables](#48-adb-environment-variables)
49. [Extendiendo ADB](#49-extendiendo-adb)
50. [Listado de todos los comandos](#50-listado-de-todos-los-comandos)
51. [Checklist para Ethical Hacking](#51-checklist-para-ethical-hacking)
52. [Versiones de ADB](#52-versiones-de-adb)
53. [Referencia de Errores](#53-referencia-de-errores)
54. [Proyectos Prácticos](#54-proyectos-pr%C3%A1cticos) - [Proyecto 1: ADB Helper — Wrapper PowerShell](#proyecto-1-adb-helper--wrapper-powerShell) - [Proyecto 2: ADB Network Scanner](#proyecto-2-adb-network-scanner) - [Proyecto 3: Monitor de actividad con Logcat y SQLite](#proyecto-3-monitor-de-actividad-con-logcat-y-sqlite) - [Proyecto 4: Diff de Configuración — Auditor de Settings](#proyecto-4-diff-de-configuraci%C3%B3n--auditor-de-settings)
55. [Conclusión](#55-conclusi%C3%B3n)

ADB ([android debug bridge](../raw/4db-d33p-d1v3.md#adb)) es la navaja suiza para interactuar con [android](../raw/4db-d33p-d1v3.md) desde tu PC. Dominalo y tenés control absoluto sobre cualquier dispositivo [android](../raw/4db-d33p-d1v3.md). Esta guía cubre desde los fundamentos del [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red) hasta técnicas avanzadas.

---

## 1. Cómo funciona [adb](../raw/4db-d33p-d1v3.md) internamente

### 1.1 Arquitectura cliente-servidor-puente

adB tiene tres componentes: cliente (`adb`), servidor (escucha en [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp):5037), y daemon `adbd` (en dispositivo).

```
Cliente → Servidor ADB (localhost:5037) → adbd (dispositivo)
```

**Flujo de comunicación:**

1. El cliente `adb` se conecta al servidor local en `localhost:5037`
2. El servidor mantiene una lista de dispositivos conectados (USB, TCP, emulador)
3. Cuando enviás un comando, el servidor lo serializa y lo envía al daemon `adbd`
4. `adbd` recibe el mensaje, lo deserializa, ejecuta el comando, y devuelve la respuesta
5. El servidor recibe la respuesta y la reenvía al cliente

### 1.2 El protocolo](./raw/r3d3s ADB a bajo nivel

ADB usa un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) binario propio sobre TCP o USB. Cada mensaje tiene header de 24 bytes:

```
command (4 bytes) | arg0 (4 bytes) | arg1 (4 bytes) | data_length (4 bytes)
data_checksum (4 bytes) | magic = command XOR 0xFFFFFFFF (4 bytes)
payload (data_length bytes)
```

**Comandos del protocolo ADB:**

| Comando | Valor Hex  | Descripción |
| ------- | ---------- | ---------------------------------- |
| CNXN | 0x4E584E43 | Connection ([handshake](../raw/w1f1-4tt4cks.md#handshake) inicial) |
| AUTH | 0x48545541 | Autenticación [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) |
| OpeN | 0x4E45504F | Abrir nueva conexión a un servicio |
| OKAY | 0x59414B4F | Confirmación de operación |
| CLSE | 0x45534C43 | Cerrar conexión |
| WRTE | 0x45545257 | Escribir datos en una conexión |
| Stls | 0x534C5453 | [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) upgrade ([android](../raw/4db-d33p-d1v3.md) 11+) |

**Handshake completo ADB:** ```
PC → Device: CNXN (versión, max_size, flags, propiedades del host)
Device → PC: CNXN (versión, max_size, flags, propiedades del dispositivo)
PC → Device: AUTH (envía token RSA)
Device → PC: AUTH (firma con clave privada del dispositivo)
PC → Device: AUTH (verifica firma)
Device → PC: CNXN (confirmación final de conexión)
PC → Device: OPEN (local_id, remote_id, nombre del servicio)
Device → PC: OKAY (confirmación de apertura)
Device → PC: WRTE (datos de salida del comando)
PC → Device: OKAY (confirmación de recepción)
PC → Device: CLSE (cierra conexión)
Device → PC: CLSE (confirmación de cierre)
```

Cada conexión genera ids) únicos (local/remote). El servidor ADB mantiene un mapa de conexiones activas. Si `adbd` se cae, todas las conexiones se pierden.

### 1.3 Transporte USB

Cuando conectás un dispositivo por USB, el sistema detecta:
- **Vendor ID:** 0x18D1 (Google) - OEMs pueden tener otros IDs
- **Product ID:** 0x4EE7 (modo ADB normal), 0xD001 (modo fastboot)
- **Interfaz:** USB_CLASS_VENDOR_SPEC (0xFF)

El driver USB_ADB crea un dispositivo virtual. El servidor ADB lo detecta automáticamente.

```bash
# Forzar reconexión USB sin desconectar cable
adb usb

# Ver dispositivos USB en Linux
lsusb | grep -i "android|google"

# Verificar detección ADB
adb devices -l

# En Windows: Device Manager → Android Device → ADB Interface
```

### 1.4 Transporte tcp/ip

Cuando conectás por wifi, ADB usa conexión socket directa con el mismo protocolo binario.

**puertos que usa ADB:**

| Puerto | Uso |
|--------|-----|
| 5037 | Servidor ADB local (escucha siempre) |
| 5554+ | Consola del emulador (telnet para comandos de emulador) |
| 5555+ | ADB en dispositivo/emulador (cada emulador usa 5555+2n) |
| 41331+ | ADB Pairing (Android 11+, puerto dinámico) |

### 1.5 Servicios que expone adbd

Cuando el servidor envía un `OPEN` con un nombre de servicio, `adbd` lo resuelve:

```
shell:comando → Ejecuta comando y devuelve output
shell: → Shell interactiva (PTY)
exec:comando → Ejecuta comando sin PTY (raw)
sync: → Sincronización de archivos (push/pull)
reboot: → Reinicia el dispositivo
reboot:bootloader → Reinicia a bootloader (fastboot)
reboot:recovery → Reinicia a recovery
tcp:[puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) → Forwarding de [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) TCP
smartsocket: → Socket inteligente multi-conexión
remount: → Remonta /system como RW
usb: → Conecta/desconecta USB
root: → Reinicia adbd como root
unroot: → Reinicia adbd como no-root
```

Cada servicio se ejecuta como un hilo separado en `adbd`. Límite default ~32 servicios simultáneos.

---

## 2. Conexión al Dispositivo

### 2.1 USB — La forma clásica

```bash
# Listar dispositivos
adb devices

# Con detalles (modelo, transport_id, usb)
adb devices -l
```

**Salida típica:**
```
List of devices attached
0123456789ABCDEF device product:Nexus5X model:Nexus_5X device:bullhead transport_id:1
```

**Estados posibles de un dispositivo:**

| Estado | Significado | Qué hacer |
|--------|-------------|-----------|
| `device` | Conectado y autorizado | Todo ok |
| `unauthorized` | No aceptaste el fingerprint USB | Aceptar en pantalla del teléfono |
| `offline` | adbd no responde | `adb kill-server && adb start-server` |
| `no device` | Nada conectado | Revisar cable, drivers, USB debugging |
| `recovery` | Modo recovery (TWRP, stock) | Limitado pero funciona |
| `sideload` | Modo ADB sideload | Solo para `adb sideload` |
| `fastboot` | Modo fastboot | Usar `fastboot` commands |

### 2.2 Solucionar dispositivos "unauthorized"

**Método 1: Aceptar manualmente**
Desconectá y volvé a conectar el USB. En la pantalla del teléfono aparece "Allow USB debugging?" Aceptá y tildá "Always allow from this computer".

**Método 2: Revocar autorizaciones**
settings → Developer options → Revoke USB debugging authorizations

**Método 3: Forzar reconexión del servidor**
```bash
adb kill-server
adb start-server
adb devices
```

**Método 4: Clave rsa manual (requiere root)**
Las claves están en:
- Linux/Mac: `~/.android/adbkey` y `~/.android/adbkey.pub`
- Windows: `%USERPROFILE%\.android\adbkey` y `adbkey.pub`

```bash
adb push ~/.android/adbkey.pub /data/misc/adb/adb_keys
adb shell [chmod](../raw/0s-f0nd4m3nt0s.md#permisos) 644 /data/misc/adb/adb_keys
adb kill-server && adb start-server
```

### 2.3 ADB por wifi

**Método A: ADB pairing (Android 11+) — Sin USB**
```bash
# Settings → Developer options → Wireless debugging → Pair device with code
adb pair 192.168.1.50:41331
# Enter pairing code: 123456
adb connect 192.168.1.50:39391
```

**Método B: tcp/ip-ip) desde USB (clásico)**
```bash
adb tcpip 5555
adb connect 192.168.1.50:5555
```

**Método C: puerto personalizado**
```bash
adb tcpip 12345
adb connect 192.168.1.50:12345
```

**Método D: Escaneo automático de red**
```bash
for [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) in 192.168.1.{1.254}; do timeout 1 adb connect $[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip):5555 2>/dev/null; done; adb devices
```

### 2.4 Múltiples dispositivos

```bash
# Listar todo
adb devices -l

# Apuntar por serial
adb -s emulator-5554 install app.[apk](../raw/4pk-r3v3rs1ng.md)
adb -s 0123456789ABCDEF logcat -c

# Apuntar por transporte ID
adb -t 1 shell dumpsys battery

# Variable de entorno (para scripting)
export ANDROID_SERIAL="0123456789ABCDEF"
adb install app.apk

# Script para ejecutar en todos
for device in $(adb devices | grep -v "List" | awk "{print \$1}"); do echo "=== \$device ===" adb -s $device shell input keyevent KEYCODE_HOME
done
```

---

## 3. Package Manager (pm) — REFEREncIA comPLETA

`pm` es el package manager de android. Controla TODO lo relacionado a paquetes, [permisos](./raw/0s, usuarios, instalación.

### 3.1 `pm list packages` — Todos los filtros

```bash
# Todos los paquetes instalados
adb shell pm list packages

# Filtrar por texto
adb shell pm list packages | grep whatsapp
adb shell pm list packages | grep google
adb shell pm list packages | grep "[com](../raw/w1n-s9bsyst3ms.md#com).android"

# Solo apps de terceros (no del sistema)
adb shell pm list packages -3

# Solo apps del sistema
adb shell pm list packages -s

# Mostrar el instalador (Play Store, APKPure, etc.)
adb shell pm list packages -i

# Mostrar archivo APK asociado (ruta física)
adb shell pm list packages -f

# Solo habilitadas
adb shell pm list packages -e

# Solo deshabilitadas
adb shell pm list packages -d

# Mostrar UIDs
adb shell pm list packages -U

# Mostrar versionCode (Android 7+)
adb shell pm list packages --show-versioncode

# Por API target
adb shell pm list packages --targeting 34

# Combinaciones útiles:
adb shell pm list packages -3 -f -i # Terceros con ruta e instalador
adb shell pm list packages -s -d # Sistema y deshabilitadas (bloatware)
adb shell pm list packages -3 -U | sort -t: -k2
```

### 3.2 `pm path` — Ruta del apk

```bash
# Obtener la ruta del APK de un paquete
adb shell pm path com.whatsapp

# Salida típica:
# package:/data/app/com.whatsapp-xyz/base.apk

# Apps con split APKs (Android 5+):
adb shell pm path com.google.android.youtube
# package:/data/app/com.google.android.youtube-abc/base.apk
# package:/data/app/com.google.android.youtube-abc/split_config.armeabi_v7a.apk
# package:/data/app/com.google.android.youtube-abc/split_config.en.apk
# package:/data/app/com.google.android.youtube-abc/split_config.hdpi.apk

# Script para extraer TODAS las partes:
for pkg in $(adb shell pm list packages -3 | cut -d: -f2); do echo "=== \$pkg ===" adb shell pm path $pkg
done
```

### 3.3 `pm install` — Instalación avanzada

```bash
# Instalación básica
adb install app.apk

# Flags de instalación que podés combinar:
# -r: Reinstalar (reemplazar app existente)
# -t: Permitir APK de test
# -d: Permitir downgrade (instalar versión anterior)
# -g: Otorgar todos los permisos runtime
# --fastdeploy: Instalación rápida (Android 7+)
# --user 0: Instalar para usuario principal

# Reinstalar forzado
adb install -r app.apk

# Instalar con downgrade
adb install -r -d app.apk

# Instalar y otorgar todos los permisos
adb install -g app.apk

# Instalar como app del sistema (requiere root)
adb push app.apk /system/app/
adb shell chmod 644 /system/app/app.apk
adb reboot

# Instalar para un usuario específico (Android 5+)
adb install --user 10 app.apk

# Instalación silenciosa
adb install -r app.apk > /dev/null 2>&1

# Split APK install (Android 5+):
adb install-multiple base.apk split_config.armeabi_v7a.apk split_config.en.apk

# Error: INSTALL_FAILED_UPDATE_INCOMPATIBLE
# Solución: adb uninstall <package> && adb install app.apk

# Error: INSTALL_FAILED_INSUFFICIENT_STORAGE
# Solución: adb shell pm trim-caches 50000000000
```

### 3.4 `pm uninstall` — Desinstalar

```bash
# Desinstalar app
adb uninstall com.package.name

# Desinstalar para un usuario específico
adb uninstall --user 10 com.package.name

# Desinstalar app del sistema (requiere root)
adb shell pm uninstall -k --user 0 com.package.sistema

# Desinstalar sin borrar datos (keep data)
adb shell pm uninstall -k com.package.name

# Forzar desinstalación de app deshabilitada
adb shell pm disable com.package.name
adb shell pm uninstall com.package.name
```

### 3.5 `pm enable / disable` — Habilitar/Deshabilitar

```bash
# Deshabilitar app (desaparece del launcher, no se ejecuta)
adb shell pm disable com.android.chrome

# Salida: Package com.android.chrome new state: disabled

# Habilitar app
adb shell pm enable com.android.chrome

# Deshabilitar app del sistema (¡cuidado! puede causar bootloop)
adb shell pm disable-user --user 0 com.google.android.gm

# Listar todas las deshabilitadas
adb shell pm list packages -d

# Deshabilitar bloatware común:
adb shell pm disable-user --user 0 com.facebook.katana
adb shell pm disable-user --user 0 com.facebook.orca
adb shell pm disable-user --user 0 com.facebook.system
adb shell pm disable-user --user 0 com.google.android.apps.maps
adb shell pm disable-user --user 0 com.google.android.apps.photos
adb shell pm disable-user --user 0 com.google.android.apps.messaging

# Deshabilitar YouTube:
adb shell pm disable-user --user 0 com.google.android.youtube

# Revertir:
adb shell pm enable com.google.android.youtube

# Deshabilitar Android Auto:
adb shell pm disable-user --user 0 com.google.android.projection.gearhead
```

### 3.6 `pm hide / unhide` — Ocultar apps

Disponible en Android 6-10 (deprecated en Android 11+).

```bash
# Ocultar app del launcher (sigue instalada y activa)
adb shell pm hide com.package.name

# Mostrar app oculta
adb shell pm unhide com.package.name

# Listar apps ocultas
adb shell pm list packages -h
```

### 3.7 `pm grant / revoke` — Permisos runtime

```bash
# Otorgar permiso específico
adb shell pm grant com.package.name android.permission.ACCESS_FINE_LOCATION

# Revocar permiso
adb shell pm revoke com.package.name android.permission.ACCESS_FINE_LOCATION

# Otorgar múltiples permisos de una:
adb shell pm grant com.package.name android.permission.CAMERA
adb shell pm grant com.package.name android.permission.RECORD_AUDIO
adb shell pm grant com.package.name android.permission.READ_CONTACTS
adb shell pm grant com.package.name android.permission.READ_SMS
adb shell pm grant com.package.name android.permission.READ_CALL_LOG

# Listar permisos otorgados a una app
adb shell dumpsys package com.package.name | grep "granted=true"

# Otorgar permisos en instalación (equivalente a -g)
adb shell pm install -g app.apk
```

### 3.8 `pm clear` — Limpiar datos

```bash
# Limpiar datos de la app (como "Borrar datos" en settings)
adb shell pm clear com.package.name

# Esto borra: databases, shared_prefs, cache, files
# No borra: APK, permisos otorgados

# Limpiar solo caché (no datos)
adb shell pm trim-caches 10G

# Limpiar datos de múltiples apps:
for pkg in com.whatsapp com.instagram.android; do adb shell pm clear $pkg
done
```

### 3.9 `pm block / unblock` — Llamadas y SMS

```bash
# Bloquear llamadas entrantes de un número
adb shell pm block com.android.dialer --call 1234567890

# Bloquear SMS de un número
adb shell pm block com.android.messaging --sms 1234567890

# Desbloquear
adb shell pm unblock com.android.dialer --call 1234567890
```

### 3.10 `pm dump` — Información detallada

```bash
# Dump completo de un paquete (MUCHA info)
adb shell dumpsys package com.package.name

# Filtro para versiones:
adb shell dumpsys package com.package.name | grep version

# Filtro para permisos:
adb shell dumpsys package com.package.name | grep -A 5 "runtime permissions"

# Filtro para activities:
adb shell dumpsys package com.package.name | grep -A 2 "Activity "

# Filtro para content providers:
adb shell dumpsys package com.package.name | grep -A 10 "ContentProvider"

# Filtro para servicios:
adb shell dumpsys package com.package.name | grep -A 2 "Service "

# Filtro para firmas:
adb shell dumpsys package com.package.name | grep -A 3 "signatures"

# Filtro para instalador:
adb shell dumpsys package com.package.name | grep installer
```

### 3.11 `pm trim-caches` — Limpiar caché

```bash
# Limpiar caché del sistema (con tamaño específico)
adb shell pm trim-caches 10G

# Limpiar todo el caché disponible
adb shell pm trim-caches 999999999999

# Ver espacio antes y después
adb shell df /data
adb shell pm trim-caches 10G
adb shell df /data
```

### 3.12 `pm set-installer` — Cambiar instalador

```bash
# Cambiar el instalador registrado de un paquete
adb shell pm [set](../raw/ph1sh1ng.md#social-engineering-toolkit)-installer com.package.name com.android.vending

# Verificar
adb shell pm list packages -i | grep com.package.name
```

### 3.13 `pm get-install-location` — Ubicación de instalación

```bash
# Ver dónde se instalan las apps por defecto
adb shell pm get-install-location

# 0: Auto (decisión del sistema)
# 1: Memoria interna
# 2: SD externa
```

### 3.14 `pm set-install-location` — Cambiar ubicación

```bash
# Forzar instalación en SD
adb shell pm set-install-location 2

# Forzar instalación en memoria interna
adb shell pm set-install-location 1

# Auto
adb shell pm set-install-location 0
```

### 3.15 `pm create-user / remove-user` — Usuarios

```bash
# Crear usuario secundario (Android 5+)
adb shell pm create-user "NombreUsuario"

# Salida: Successfully created user 10

# Eliminar usuario
adb shell pm remove-user 10

# Listar usuarios
adb shell pm list users

# Crear usuario con restricciones:
adb shell pm create-user --profileOf 0 --managed "Work Profile"

# Crear usuario demo (no puede instalar apps):
adb shell pm create-user --demo "Guest Demo"
```

### 3.16 `pm list users` — Usuarios del dispositivo

```bash
# Listar usuarios
adb shell pm list users

# Salida típica:
# Users:
# UserInfo{0:Owner:13} running
# UserInfo{10:Work profile:30} running

# Ver detalles de cada usuario:
adb shell dumpsys user
```

### 3.17 `pm list permissions` — Todos los permisos

```bash
# Listar todos los permisos conocidos
adb shell pm list permissions

# Solo permisos peligrosos
adb shell pm list permissions -d -g

# Grupos de permisos
adb shell pm list permission-groups

# Permisos de un grupo específico
adb shell pm list permissions -g android.permission-group.LOCATION

# Buscar permisos por texto
adb shell pm list permissions | grep CAMERA
adb shell pm list permissions | grep LOCATION
```

### 3.18 `pm list features` — Características hardware

```bash
# Listar capacidades hardware del dispositivo
adb shell pm list features

# Salida típica:
# feature:android.hardware.bluetooth
# feature:android.hardware.camera
# feature:android.hardware.camera.autofocus
# feature:android.hardware.faketouch
# feature:android.hardware.location
# feature:android.hardware.location.gps
# feature:android.hardware.microphone
# feature:android.hardware.nfc
# feature:android.hardware.sensor.accelerometer
# feature:android.hardware.sensor.compass
# feature:android.hardware.sensor.gyroscope
# feature:android.hardware.telephony
# feature:android.hardware.touchscreen
# feature:android.hardware.wifi
# feature:android.software.managed_users
# feature:android.software.picture_in_picture
# feature:android.software.webview

# Verificar una feature específica:
adb shell pm has-feature android.hardware.camera
```

### 3.19 `pm list libraries` — Librerías del sistema

```bash
# Listar librerías del sistema disponibles
adb shell pm list libraries

# Salida típica:
# library:android.test.base
# library:android.test.mock
# library:android.test.runner
# library:com.android.location.provider
# library:com.android.media.remotedisplay
# library:com.android.nfc_extras
# library:com.google.android.camera.experimental2015
# library:com.google.android.maps
# library:javax.obex
```

### 3.20 `pm list instrumentation` — Test runners

```bash
# Listar instrumentaciones disponibles
adb shell pm list instrumentation

# Instrumentación de una app específica
adb shell pm list instrumentation | grep com.package.name

# Ejecutar tests:
adb shell am instrument -w com.package.name/android.test.InstrumentationTestRunner
```

---

## 4. Activity Manager (am)

`am` te permite controlar el ciclo de vida de las apps: lanzar activities, servicios, broadcasts, y más.

### 4.1 `am start` — Lanzar activities

```bash
# Lanzar app por package (si tiene Main launcher)
adb shell am start -n com.package.name/.MainActivity

# Con acción
adb shell am start -a android.intent.action.VIEW

# Con datos (URI)
adb shell am start -a android.intent.action.VIEW -d "[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://www.google.com"

# Abrir dialer con número
adb shell am start -a android.intent.action.DIAL -d "tel:1234567890"

# Hacer llamada (¡requiere permiso!)
adb shell am start -a android.intent.action.CALL -d "tel:1234567890"

# Abrir settings de WiFi
adb shell am start -a android.intent.action.MAIN -n com.android.settings/.Settings -e ":settings:show_fragment" "com.android.settings.Settings$WifiSettingsActivity"

# Abrir ubicación en Google Maps
adb shell am start -a android.intent.action.VIEW -d "geo:0,0?q=-34.6037,-58.3816"

# Abrir YouTube video
adb shell am start -a android.intent.action.VIEW -d "vnd.youtube:dQw4w9WgXcQ"

# Abrir Play Store en una app
adb shell am start -a android.intent.action.VIEW -d "market://details?id=com.whatsapp"

# Abrir email
adb shell am start -a android.intent.action.SENDTO -d "mailto:test@example.com" --es "android.intent.extra.SUBJECT" "Asunto" --es "android.intent.extra.TEXT" "Cuerpo"

# Extras booleanos, enteros, float
adb shell am start -n com.package.name/.Activity --ez enabled true
adb shell am start -n com.package.name/.Activity --ei count 42
adb shell am start -n com.package.name/.Activity --el duration 300000
adb shell am start -n com.package.name/.Activity --ef latitude -34.6037
adb shell am start -n com.package.name/.Activity --eu data content://provider/table

# Flags de activity:
adb shell am start -n com.package.name/.Activity -f 0x10000000  # NEW_TASK
adb shell am start -n com.package.name/.Activity -f 0x04000000  # CLEAR_TOP
adb shell am start -n com.package.name/.Activity -f 0x20000000  # SINGLE_TOP

# Abrir deep link
adb shell am start -a android.intent.action.VIEW -d "myapp://profile/123"

# Debug (espera debugger):
adb shell am start -D -n com.package.name/.Activity
```

### 4.2 `am startservice` — Servicios

```bash
# Iniciar servicio
adb shell am startservice -n com.package.name/.MyService

# Servicio con intent
adb shell am startservice -a com.example.ACTION_SYNC -n com.package.name/.SyncService

# Servicio con extras
adb shell am startservice -n com.package.name/.UploadService --es file_path "/sdcard/file.txt"

# Servicio foreground
adb shell am startservice -n com.package.name/.ForegroundService --ei notification_id 1

# Forzar parada del servicio
adb shell am force-stop com.package.name
```

### 4.3 `am broadcast` — Broadcasts

```bash
# Broadcast genérico
adb shell am broadcast -a android.intent.action.BOOT_COMPLETED

# Con extras
adb shell am broadcast -a com.example.CUSTOM_BROADCAST --es message "Hola desde ADB"

# A receiver específico
adb shell am broadcast -n com.package.name/.MyReceiver -a com.example.ACTION_TRIGGER

# Broadcasts del sistema útiles:
adb shell am broadcast -a android.intent.action.BATTERY_LOW
adb shell am broadcast -a android.intent.action.CONNECTIVITY_CHANGE
adb shell am broadcast -a android.intent.action.SCREEN_ON
adb shell am broadcast -a android.intent.action.SCREEN_OFF
adb shell am broadcast -a android.intent.action.PACKAGE_ADDED -d package:com.example.app
adb shell am broadcast -a android.intent.action.PACKAGE_REMOVED -d package:com.example.app
```

### 4.4 `am instrument` — Instrumentación

```bash
# Ejecutar todos los tests de un paquete
adb shell am instrument -w com.package.name/android.test.InstrumentationTestRunner

# Test específico
adb shell am instrument -w -e class com.package.name.tests.MyTest#testMethod com.package.name/android.test.InstrumentationTestRunner

# Test con cobertura
adb shell am instrument -w -e coverage true com.package.name/android.test.InstrumentationTestRunner

# Obtener archivo de cobertura
adb pull /data/data/com.package.name/files/coverage.ec

# AndroidJUnitRunner
adb shell am instrument -w -e class "com.package.name.tests.MyTest" com.package.name.test/androidx.test.runner.AndroidJUnitRunner
```

### 4.5 `am profile` — Profiling

```bash
# Iniciar profiling
adb shell am profile start com.package.name /data/local/tmp/app.trace

# Detener profiling
adb shell am profile stop com.package.name

# Descargar trace
adb pull /data/local/tmp/app.trace

# Sampled profiling (Android 9+)
adb shell am profile start --sampling 1000 com.package.name /data/local/tmp/app.trace
```

### 4.6 `am monitor` — Monitoreo de activities

```bash
# Monitorear activities que se abren en tiempo real
adb shell am monitor

# La salida muestra cada activity que se lanza:
# ** Activity: com.whatsapp/.HomeActivity
# ** Activity: com.instagram.android/.MainActivity
```

### 4.7 `am kill / kill-all` — Matar procesos

```bash
# Matar proceso de un paquete
adb shell am kill com.package.name

# Matar todos los procesos de background
adb shell am kill-all

# Matar por PID
adb shell kill <pid>
adb shell pkill -f com.package.name
```

### 4.8 `am force-stop` — Forzar detención

```bash
# Forzar detención de app (Settings → Forzar detención)
adb shell am force-stop com.package.name

# Mata proceso, servicios, y broadcasts pendientes

# Forzar detención de múltiples apps:
adb shell am force-stop com.whatsapp
adb shell am force-stop com.instagram.android
```

### 4.9 `am crash` — Crash forzado

```bash
# Forzar crash de una app para probar Crashlytics/ACRA
adb shell am crash com.package.name
```

### 4.10 `am set-debug-app / clear-debug-app`

```bash
# Marcar app para debug (espera debugger al iniciar)
adb shell am set-debug-app -w com.package.name

# Quitar marca de debug
adb shell am clear-debug-app com.package.name
```

### 4.11 `am stack` — Información de stacks

```bash
# Listar stacks de activities
adb shell am stack list

# Información detallada de un stack
adb shell am stack info <stack_id>
```

### 4.12 `am task` — Información de tareas

```bash
# Listar todas las tareas (apps abiertas)
adb shell am tasks

# Actividad actual en foco
adb shell dumpsys activity | grep "mResumedActivity"
```

---

## 5. Dumpsys

`dumpsys` es la navaja suiza de diagnóstico de android. Expone el estado interno de casi todos los subsistemas.

### 5.1 Listado completo de servicios

```bash
# Listar todos los servicios disponibles
adb shell dumpsys -l

# Salida típica (100+ servicios):
# activity, alarm, appops, audio, battery, batteryproperties,
# batterystats, Bluetooth, connectivity, cpuinfo, device_policy,
# deviceidle, diskstats, display, dropbox, fingerprint,
# graphicsstats, input, isub, jobscheduler, location,
# media.audio_flinger, media.player, meminfo, netpolicy,
# netstats, notification, package, permission, power,
# procstats, sensorservice, telephony.registry, usb,
# user, vibrator, wallpaper, wifi, window

# Servicio específico
adb shell dumpsys <service>
```

### 5.2 Dumpsys batterystats — Batería

```bash
# Estado de batería (simple)
adb shell dumpsys battery

# Salida:
# AC powered: false
# USB powered: true
# status: 5 (Full)
# health: 2 (Good)
# level: 85
# voltage: 4200
# temperature: 300

# Estadísticas detalladas
adb shell dumpsys batterystats

# Resetear estadísticas
adb shell dumpsys batterystats --reset

# Historial detallado
adb shell dumpsys batterystats --history

# Consumo por app
adb shell dumpsys batterystats | grep -A 10 "Consumed Power"

# Cambiar nivel de batería simulado
adb shell dumpsys battery set level 50
adb shell dumpsys battery set status 1

# Resetear simulación
adb shell dumpsys battery reset
```

### 5.3 Dumpsys meminfo — Memoria

```bash
# Memoria del dispositivo
adb shell dumpsys meminfo

# Memoria de un proceso específico
adb shell dumpsys meminfo com.package.name

# Salida incluye: Native Heap, Dalvik Heap, Stack, Cursor, .so mmap, .dex mmap
# y el PSS total que es lo que importa

# Ver solo PSS total
adb shell dumpsys meminfo com.package.name | grep TOTAL

# Top 10 apps por memoria
adb shell dumpsys meminfo | grep -E "^ " | sort -k2 -rn | head -10

# Memoria de TODOS los procesos
adb shell dumpsys meminfo --memoryof all | grep TOTAL
```

### 5.4 Dumpsys cpuinfo — CPU

```bash
# Uso de CPU por proceso
adb shell dumpsys cpuinfo

# Salida:
# Load: 2.5 / 3.2 / 4.1
# CPU usage from 12345ms to 0ms ago:
# 25% 12345/com.package.name: 20% user + 5% kernel
# 15% 67890/system: 10% user + 5% kernel

# Filtrar por proceso
adb shell dumpsys cpuinfo | grep "com.package"
```

### 5.5 Dumpsys diskstats — Disco

```bash
# Estadísticas de disco
adb shell dumpsys diskstats

# Salida: Data-Free, Cache-Free, System-Free

# Tamaño de apps individuales:
adb shell dumpsys diskstats --human-readable
```

### 5.6 Dumpsys netstats — red

```bash
# Estadísticas de red
adb shell dumpsys netstats

# Datos móviles vs WiFi por app
adb shell dumpsys netstats detail

# Uso de datos por UID
adb shell dumpsys netstats uid

# Conexiones activas
adb shell netstat -tlnp
```

### 5.7 Dumpsys package — Paquetes

```bash
# Info detallada de un paquete
adb shell dumpsys package com.package.name

# Filtro para versionado:
adb shell dumpsys package com.package.name | grep -E "version|packageName|codePath"

# Filtro para permisos
adb shell dumpsys package com.package.name | grep -A 10 "runtime permissions"

# Filtro para activities
adb shell dumpsys package com.package.name | grep -B 1 "Activity "

# Filtro para services
adb shell dumpsys package com.package.name | grep "Service "

# Filtro para providers
adb shell dumpsys package com.package.name | grep "Provider "

# Firmas
adb shell dumpsys package com.package.name | grep -A 5 "signatures"

# Instalador
adb shell dumpsys package com.package.name | grep "installer"
```

### 5.8 Dumpsys window — Ventanas

```bash
# Activity en foco (MUY útil para pentesting)
adb shell dumpsys window | grep mCurrentFocus

# Salida: mCurrentFocus=Window{abc123 u0 com.whatsapp/com.whatsapp.HomeActivity}

# También:
adb shell dumpsys window | grep mFocusedApp

# Todas las ventanas visibles
adb shell dumpsys window windows | grep "Window #"

# Display info
adb shell dumpsys window displays
```

### 5.9 Dumpsys activity — Activities

```bash
# Activity en foco
adb shell dumpsys activity | grep mResumedActivity

# Activities en pila
adb shell dumpsys activity activities

# Tareas recientes
adb shell dumpsys activity recents

# Process info
adb shell dumpsys activity processes

# Services en ejecución
adb shell dumpsys activity services

# Broadcast receivers
adb shell dumpsys activity broadcasts

# Procesos ordenados por importancia (OOM)
adb shell dumpsys activity oom
```

### 5.10 Dumpsys alarm — Alarmas

```bash
# Todas las alarmas registradas
adb shell dumpsys alarm

# Alarmas de una app específica
adb shell dumpsys alarm | grep -A 5 "com.package.name"

# Estadísticas de alarmas (cuántas veces se dispararon)
adb shell dumpsys alarm | grep "Alarm Stats"
```

### 5.11 Dumpsys notification — Notificaciones

```bash
# Todas las notificaciones actuales
adb shell dumpsys notification

# De una app específica
adb shell dumpsys notification | grep -A 20 "com.package.name"

# Rankings
adb shell dumpsys notification --rankings

# Historial
adb shell dumpsys notification --history
```

### 5.12 Dumpsys power — Power management

```bash
# Estado de power management
adb shell dumpsys power

# Wake locks activos
adb shell dumpsys power | grep "WAKE_LOCK"

# Doze mode
adb shell dumpsys power | grep "mDeviceIdleMode"

# Pantalla encendida/apagada
adb shell dumpsys power | grep "mWakefulness"

# Simular doze
adb shell dumpsys deviceidle force-idle
```

### 5.13 Dumpsys wifi — WiFi

```bash
# Estado WiFi completo
adb shell dumpsys [wifi](../raw/w1f1-4tt4cks.md)

# Redes guardadas
adb shell dumpsys wifi | grep -A 10 "Saved networks"

# Señal
adb shell dumpsys wifi | grep "RSSI|Link speed|Frequency"

# Redes disponibles
adb shell dumpsys wifi | grep "ScanResult" | head -20

# IP asignada
adb shell dumpsys wifi | grep "ipAddress"
```

### 5.14 Dumpsys bluetooth — Bluetooth

```bash
# Estado Bluetooth
adb shell dumpsys bluetooth

# Dispositivos vinculados
adb shell dumpsys bluetooth | grep -A 10 "Bonded devices"

# Perfiles activos (A2DP, HFP, etc.)
adb shell dumpsys bluetooth | grep "Profile"
```

### 5.15 Dumpsys telephony — Telefonía

```bash
# Estado de telefonía
adb shell dumpsys telephony.registry

# IMEI / MEID
adb shell dumpsys iphonesubinfo

# Número de teléfono
adb shell dumpsys iphonesubinfo | grep "Phone Number"

# Señal celular
adb shell dumpsys telephony.registry | grep "SignalStrength"
```

### 5.16 Dumpsys location — Ubicación

```bash
# Estado de ubicación
adb shell dumpsys location

# Última ubicación conocida
adb shell dumpsys location | grep "last known"

# Apps que pidieron ubicación
adb shell dumpsys location | grep "package"

# GPS info
adb shell dumpsys location | grep -A 30 "GpsLocationProvider"
```

### 5.17 Dumpsys sensors — Sensores

```bash
# Estado de sensores
adb shell dumpsys sensorservice

# Sensores disponibles
adb shell dumpsys sensorservice | grep "Sensor "

# Apps que usan sensores
adb shell dumpsys sensorservice | grep "package|Listener"
```

### 5.18 Dumpsys usb — USB

```bash
# Estado USB
adb shell dumpsys usb

# Modo USB actual
adb shell dumpsys usb | grep "Current functions"
```

### 5.19 Dumpsys fingerprint — Huellas

```bash
# Estado de huella digital
adb shell dumpsys fingerprint

# Huellas registradas
adb shell dumpsys fingerprint | grep "Fingerprint"
```

### 5.20 Dumpsys graphics — GPU/OpenGL

```bash
# Estadísticas gráficas
adb shell dumpsys graphicsstats

# Frames caídos (jank)
adb shell dumpsys gfxinfo com.package.name

# Perfil de rendering
adb shell dumpsys gfxinfo com.package.name framestats
```

### 5.21 Dumpsys media — Multimedia

```bash
# Estado multimedia
adb shell dumpsys media.audio_flinger

# Codecs disponibles
adb shell dumpsys media.player | grep -i "codec"
```

### 5.22 Dumpsys input — Input

```bash
# Estado del sistema de input
adb shell dumpsys input

# Dispositivos de entrada
adb shell dumpsys input | grep "Device"

# Touch screen
adb shell dumpsys input | grep "Touch"
```

### 5.23 Dumpsys appops — App Ops

```bash
# App Ops (control granular de permisos)
adb shell dumpsys appops

# De una app específica
adb shell dumpsys appops | grep -A 30 "com.package.name"

# Listar modos:
adb shell appops query-op --mode allow
adb shell appops query-op --mode deny

# Resetear App Ops de una app
adb shell appops reset com.package.name
```

### 5.24 Dumpsys device_policy — Device Admin

```bash
# Políticas de dispositivo
adb shell dumpsys device_policy

# Admins activos
adb shell dumpsys device_policy | grep "Admin"

# Políticas aplicadas
adb shell dumpsys device_policy | grep -A 5 "password|lock|wipe"

# Lock task mode
adb shell dumpsys device_policy | grep "Lock task"
```

### 5.25 Dumpsys jobscheduler — Job Scheduler

```bash
# Jobs programados
adb shell dumpsys jobscheduler

# Jobs de una app específica
adb shell dumpsys jobscheduler | grep -A 5 "com.package.name"

# Forzar ejecución de un job
adb shell cmd jobscheduler run -f com.package.name 12345
```

### 5.26 Dumpsys connectivity — Conectividad

```bash
# Estado de conectividad
adb shell dumpsys connectivity

# VPN activa
adb shell dumpsys connectivity | grep "[vpn](../raw/4n0n1m4t0.md#vpn)"

# Tethering
adb shell dumpsys connectivity | grep "Tethering"
```

### 5.27 Dumpsys clipboard — Portapapeles

```bash
# Contenido del portapapeles
adb shell dumpsys clipboard

# Monitorear cambios:
while true; do clear; adb shell dumpsys clipboard | grep "clipboard"; sleep 2; done
```

### 5.28 Dumpsys wallpaper — Fondos

```bash
# Info de wallpaper
adb shell dumpsys wallpaper
```

### 5.29 Dumpsys audio — Audio

```bash
# Estado de audio
adb shell dumpsys audio

# Cambiar volumen:
adb shell media volume --show --stream 3 --set 10
adb shell media volume --show --stream 3 --set 0
```

### 5.30 Dumpsys diskstats — Almacenamiento

```bash
# Estadísticas de almacenamiento
adb shell dumpsys diskstats

# Particiones
adb shell df

# Archivos más grandes
adb shell find /sdcard -type f -size +10M
```

---

## 6. Content Providers

Los content providers son la puerta de entrada a los datos de android. Si un provider está exportado, podés leer/escribir datos sin [permisos](./raw/0s.

```bash
# Query directo a un provider
adb shell content query --uri content://com.android.contacts/contacts

# Con proyección
adb shell content query --uri content://com.android.contacts/contacts --projection "_id:display_name:has_phone_number"

# Con filtro WHERE
adb shell content query --uri content://com.android.contacts/contacts --where "display_name="[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)""

# Con orden y límite
adb shell content query --uri content://com.android.contacts/contacts --sort "display_name ASC" --limit 5

# Leer SMS (requiere permiso)
adb shell content query --uri content://sms/inbox --limit 5
adb shell content query --uri content://sms/sent --limit 5

# Leer calendario
adb shell content query --uri content://calendar/calendars --limit 5

# Leer contactos
adb shell content query --uri content://com.android.contacts/contacts --limit 10

# Leer llamadas
adb shell content query --uri content://call_log/calls --limit 10

# Leer settings seguros
adb shell content query --uri content://settings/secure

# Insertar datos en un provider
adb shell content insert --uri content://com.android.contacts/contacts --bind "display_name:s:Test Contact" --bind "phone_number:s:1234567890"

# Actualizar datos
adb shell content update --uri content://com.android.contacts/contacts/1 --bind "display_name:s:Nuevo Nombre"

# Borrar datos
adb shell content delete --uri content://com.android.contacts/contacts/1

# Enumerar authorities de providers instalados:
for pkg in $(adb shell pm list packages -3 | cut -d: -f2); do providers=$(adb shell dumpsys package $pkg | grep "authority=" | sed "s/.*authority=//" | sed "s/ .*//") if [ -n "$providers" ]; then echo "$pkg: $providers"; fi
done
```

---

## 7. Monkey Testing

Monkey es una herramienta para testing aleatorio. Manda eventos pseudoaleatorios al dispositivo.

```bash
# Monkey básico (100 eventos aleatorios)
adb shell monkey 100

# Monkey en una app específica
adb shell monkey -p com.package.name 500

# Monkey con intervalo entre eventos
adb shell monkey -p com.package.name --throttle 200 500

# Monkey solo con ciertos eventos
adb shell monkey -p com.package.name --pct-touch 40 --pct-motion 25 --pct-trackball 0 --pct-nav 5 --pct-majornav 5 --pct-syskeys 0 --pct-appswitch 10 --pct-anyevent 15 1000

# Monkey con semilla (reproducible)
adb shell monkey -p com.package.name -s 12345 500

# Monkey ignorando crashes y timeouts
adb shell monkey -p com.package.name --ignore-crashes --ignore-timeouts 1000

# Monkey verbose
adb shell monkey -p com.package.name -vvv 500

# Detener monkey
adb shell kill $(adb shell ps | grep monkey | awk "{print \$2}")
```

---

## 8. Backup y Restore

```bash
# Backup completo de datos de una app
adb backup -f backup.ab -noapk com.package.name

# Backup con APK incluido
adb backup -f backup.ab -apk com.package.name

# Backup del sistema completo (requiere root)
adb backup -f system_backup.ab -system -all

# Backup de múltiples apps
adb backup -f apps_backup.ab -apk com.whatsapp com.facebook.katana

# Backup con encriptación
adb backup -f backup_encrypted.ab -apk -password TuContraseña com.package.name

# Restaurar backup
adb restore backup.ab

# Formato del .ab:
# ANDROID BACKUP
# 2
# 1  (compression: 1=comprimido, 0=sin comprimir)
# none  (encryption: none=AES-256)

# Extraer backup manualmente:
# Saltar primeros 24 bytes, descomprimir con zlib
```

---

## 9. adb Seguro — rsa Keys y Autorización

```bash
# Las claves RSA se almacenan en:
# ~/.android/adbkey (clave privada)
# ~/.android/adbkey.pub (clave pública)

# Generar nuevas claves
adb kill-server
rm ~/.android/adbkey ~/.android/adbkey.pub
adb start-server

# Ver clave pública
cat ~/.android/adbkey.pub

# Agregar clave pública manualmente (root)
adb push ~/.android/adbkey.pub /data/misc/adb/adb_keys
adb shell chmod 644 /data/misc/adb/adb_keys
adb kill-server && adb start-server

# Deshabilitar ADB completamente
adb shell settings put global adb_enabled 0

# Volver a habilitar
adb shell settings put global adb_enabled 1
```

---

## 10. adb en Modo Recovery

```bash
# Verificar si ADB funciona en recovery
adb devices
# Debería mostrar el dispositivo con estado "recovery"

# Comandos limitados en recovery stock:
adb shell ls /sdcard/
adb pull /sdcard/file.txt

# En TWRP recovery, ADB tiene más capacidades:
adb shell twrp backup SDBOE  # System, Data, Boot, OEM, EFS
adb shell twrp restore /sdcard/TWRP/BACKUPS/xxx/1970-01-01--00-00-00/
adb shell twrp mount /data
adb shell twrp wipe cache
adb shell twrp wipe data

# ADB sideload (flashear desde recovery):
adb sideload rom.zip

# Sideload sin verificación
adb sideload rom.zip 2>/dev/null
```

---

## 11. adb para System Apps

```bash
# Las apps del sistema están en:
# /system/app/
# /system/priv-app/
# /product/app/
# /vendor/app/

# Listar apps del sistema
adb shell pm list packages -s

# Convertir app de tercero a sistema (requiere root)
adb root
adb remount
adb shell cp /data/app/com.package.name-xyz/base.apk /system/app/
adb reboot

# Remontar /system como RW
adb root
adb remount

# Eliminar app del sistema (¡cuidado!)
adb root
adb remount
adb shell rm -rf /system/app/NombreApp/
adb reboot

# Ver rutas de apps del sistema
for pkg in $(adb shell pm list packages -s | cut -d: -f2); do path=$(adb shell pm path $pkg | head -1 | cut -d: -f2) echo "$pkg → $path"
done
```

---

## 12. adb para Plataformas Específicas

### android TV

```bash
# Conectar a Android TV
adb connect <tv_ip>:5555

# Navegar con dpad
adb shell input keyevent KEYCODE_DPAD_UP
adb shell input keyevent KEYCODE_DPAD_DOWN
adb shell input keyevent KEYCODE_DPAD_LEFT
adb shell input keyevent KEYCODE_DPAD_RIGHT
adb shell input keyevent KEYCODE_DPAD_CENTER

# Teclas específicas de TV
adb shell input keyevent KEYCODE_TV
adb shell input keyevent KEYCODE_GUIDE
adb shell input keyevent KEYCODE_INFO
adb shell input keyevent KEYCODE_MEDIA_PLAY
adb shell input keyevent KEYCODE_MEDIA_PAUSE

# Abrir Netflix y YouTube en TV
adb shell am start -n com.netflix.ninja/.MainActivity
adb shell am start -n com.google.android.youtube.tv/.MainActivity
```

### Android Wear

```bash
# Conectar reloj
adb connect <watch_ip>:5555

# También por BT:
adb forward tcp:4444 localabstract:/adb-hub
adb connect localhost:4444

# Tomar screenshot circular
adb exec-out screencap -p > watch_screen.png
```

### Android Automotive

```bash
# Info del sistema automotriz
adb shell dumpsys car_service

# Simular velocidad
adb shell dumpsys car_service --set-vehicle-speed 60

# Cambiar modo día/noche
adb shell cmd car_service day_night_mode 1  # night
adb shell cmd car_service day_night_mode 2  # day
```

---

## 13. Root — comandos Avanzados

```bash
# Verificar si hay root
adb shell su -c "id"
# Si devuelve uid=0(root) → hay root

# Reiniciar ADB como root
adb root

# Remontar /system como RW
adb remount

# Acceder a datos de otras apps
adb shell su -c "cat /data/data/com.whatsapp/databases/wa.db"

# Editar build.prop
adb shell su -c "mount -o rw,remount /system"
adb shell su -c "echo "ro.debuggable=1" >> /system/build.prop"
adb reboot

# Buscar APKs ocultas
adb shell su -c "find / -name "*.apk" -type f 2>/dev/null"

# Eliminar bloatware del sistema
adb shell su -c "pm uninstall -k --user 0 com.facebook.katana"

# Leer claves WiFi guardadas
adb shell su -c "cat /data/misc/wifi/WifiConfigStore.xml"

# Leer contraseñas guardadas del navegador
adb shell su -c "cat /data/data/com.android.chrome/app_chrome/Default/Login Data"

# Cambiar densidad de pantalla (requiere root en algunos dispositivos)
adb shell wm density 320
```

---

## 14. Networking y Tethering

```bash
# Port forwarding (redirigir puerto del PC al dispositivo)
adb forward tcp:8080 tcp:8080

# Reverse forwarding (redirigir puerto del dispositivo al PC)
adb reverse tcp:8080 tcp:8080

# Listar forwards activos
adb forward --list

# Eliminar forward
adb forward --remove tcp:8080

# Proxy HTTP/HTTPS (para interceptar tráfico)
adb shell settings put global http_proxy 192.168.1.100:8080

# Quitar proxy
adb shell settings put global http_proxy :0

# Ver conexiones de red en el dispositivo
adb shell netstat -tlnp

# Hacer ping desde el dispositivo
adb shell ping -c 4 google.com

# DNS lookup desde el dispositivo
adb shell nslookup google.com 8.8.8.8

# Usar dispositivo como módem USB (tethering)
adb shell svc usb setFunctions rndis

# Deshabilitar tethering
adb shell svc usb setFunctions mtp,adb
```

---

## 15. settings Database

android tiene tres bases de settings: global, system, secure.

```bash
# Listar todas las settings
adb shell settings list global
adb shell settings list system
adb shell settings list secure

# Obtener valor específico
adb shell settings get global airplane_mode_on
adb shell settings get system screen_brightness
adb shell settings get secure android_id

# Cambiar valor
adb shell settings put global airplane_mode_on 1
adb shell settings put system screen_brightness 200
adb shell settings put secure android_id "nuevo_id"

# Eliminar setting
adb shell settings delete global setting_name

# Settings útiles para pentesting:
# Deshabilitar animaciones (más rápido)
adb shell settings put global window_animation_scale 0.0
adb shell settings put global transition_animation_scale 0.0
adb shell settings put global animator_duration_scale 0.0

# Mantener pantalla encendida mientras carga
adb shell settings put global stay_on_while_plugged_in 3

# Habilitar puntos de desarrollo
adb shell settings put global development_settings_enabled 1

# Forzar GPU rendering
adb shell settings put global force_gpu_rendering 1

# Mostrar FPS en pantalla
adb shell settings put global show_fps 1

# Deshabilitar rotación automática
adb shell settings put system accelerometer_rotation 0

# Forzar orientación landscape
adb shell settings put system user_rotation 1

# Brillo automático
adb shell settings put system screen_brightness_mode 1
```

---

## 16. Screencast y Captura Remota

```bash
# Captura de pantalla
adb exec-out screencap -p > screenshot.png

# Captura con fecha
adb exec-out screencap -p > "screenshot_$(date +%Y%m%d_%H%M%S).png"

# Grabación de pantalla
adb shell screenrecord /sdcard/record.mp4
# Presionar Ctrl+C para detener

# Grabación con timeout
adb shell screenrecord --time-limit 30 /sdcard/record.mp4

# Grabación con tamaño y bitrate específicos
adb shell screenrecord --size 720x1280 --bit-rate 8000000 /sdcard/record.mp4

# Descargar grabación
adb pull /sdcard/record.mp4

# Transmitir pantalla en vivo (con scrcpy)
scrcpy
scrcpy --max-size 1024
scrcpy --bit-rate 2M
scrcpy --turn-screen-off
scrcpy --stay-awake
scrcpy --record file.mp4

# Resolución de pantalla
adb shell wm size
# Salida: Physical size: 1080x1920

# Cambiar resolución
adb shell wm size 720x1280

# Restaurar resolución
adb shell wm size reset

# Densidad de pantalla
adb shell wm density

# Cambiar densidad
adb shell wm density 320

# Overscan (ajustar bordes)
adb shell wm overscan 0,0,0,0
```

---

## 17. Depuración de WebViews

```bash
# Habilitar debugging de WebViews en todas las apps
adb shell settings put global webview_debugging_enabled 1

# Version de WebView instalada
adb shell dumpsys webviewupdate | grep "Current WebView"

# Listar apps con WebView
adb shell dumpsys webviewupdate | grep "package"

# Abrir chrome://inspect en tu navegador de escritorio
# para inspeccionar WebViews remotas

# Deshabilitar WebView debugging
adb shell settings put global webview_debugging_enabled 0
```

---

## 18. Instalación y apks

```bash
# Instalación básica
adb install app.apk

# Instalación con todas las flags
adb install -r -t -d -g app.apk

# Instalar multiple APK (split)
adb install-multiple base.apk split1.apk split2.apk

# Instalar con downgrade forzado
adb install -r -d app.apk

# Instalar como app del sistema
adb root
adb remount
adb push app.apk /system/app/
adb shell chmod 644 /system/app/app.apk
adb reboot

# Instalar con instalador personalizado
adb install -i com.android.vending app.apk

# Códigos de error de instalación:
# INSTALL_FAILED_ALREADY_EXISTS -> usar -r
# INSTALL_FAILED_INVALID_APK -> APK corrupto
# INSTALL_FAILED_INSUFFICIENT_STORAGE -> falta espacio
# INSTALL_FAILED_VERSION_DOWNGRADE -> usar -d
# INSTALL_FAILED_UPDATE_INCOMPATIBLE -> desinstalar primero
# INSTALL_FAILED_SHARED_USER_INCOMPATIBLE -> firma no coincide
# INSTALL_FAILED_MISSING_SHARED_LIBRARY -> falta librería
# INSTALL_FAILED_DEXOPT -> error de optimización DEX
# INSTALL_FAILED_OLDER_SDK -> API muy baja
```

---

## 19. Extraer apk

```bash
# Obtener ruta del APK
adb shell pm path com.package.name
# Salida: package:/data/app/com.package.name-xyz/base.apk

# Extraer APK
adb pull /data/app/com.package.name-xyz/base.apk

# Extraer con nombre personalizado
adb pull /data/app/com.whatsapp-xyz/base.apk whatsapp.apk

# Extraer TODOS los APKs de terceros
for pkg in $(adb shell pm list packages -3 | cut -d: -f2); do apk_path=$(adb shell pm path $pkg | head -1 | cut -d: -f2) adb pull "$apk_path" "./apks/$pkg.apk"
done

# Extraer con run-as (sin root, solo apps debugeables)
adb exec-out run-as com.package.name cat base.apk > app.apk

# Obtener información del APK sin extraer (aapt)
aapt dump badging app.apk
aapt dump permissions app.apk
```

---

## 20. [permisos](./raw/0s

```bash
# Listar permisos de una app
adb shell dumpsys package com.package.name | grep "granted=true"

# Listar permisos peligrosos
adb shell dumpsys package com.package.name | grep -A 100 "runtime permissions" | grep -B 5 "granted=true"

# Otorgar permiso específico
adb shell pm grant com.package.name android.permission.CAMERA

# Revocar permiso
adb shell pm revoke com.package.name android.permission.CAMERA

# Listar todos los permisos peligrosos del sistema
adb shell pm list permissions -d -g

# Backup de permisos otorgados
adb shell dumpsys package com.package.name | grep "granted=true" > perms_backup.txt

# AppOps (sistema de permisos granulares)
adb shell appops get com.package.name

# Setear AppOp específico
adb shell appops set com.package.name CAMERA deny
adb shell appops set com.package.name LOCATION allow
adb shell appops set com.package.name POST_NOTIFICATIONS ignore

# Resetear AppOps
adb shell appops reset com.package.name
```

---

## 21. Device admin

```bash
# Listar device admins
adb shell dumpsys device_policy | grep "Admin"

# Activar device admin
adb shell am start -a android.app.action.ADD_DEVICE_ADMIN -n com.package.name/.DeviceAdminReceiver

# Bloquear pantalla remotamente
adb shell locksettings lock

# Cambiar PIN de bloqueo
adb shell locksettings set-pin --old 1234 --new 5678

# Quitar bloqueo (requiere contraseña actual)
adb shell locksettings clear --old 1234

# Lock task mode (kiosk)
adb shell am start -n com.package.name/.Activity --ez android.intent.extra.LOCK_TASK true
```

---

## 22. Logs y Debug

### Logcat

```bash
# Mostrar logs en tiempo real
adb logcat

# Logs con filtro por tag
adb logcat -s TAG_NAME

# Logs con formato de tiempo
adb logcat -v time

# Logs de un PID específico
adb logcat --pid=12345

# Logs de una app específica
adb logcat --pid=$(adb shell pidof -s com.package.name)

# Logs de crash/exception
adb logcat *:E

# Logs verbose
adb logcat *:V

# Guardar logs a archivo
adb logcat -d > logs.txt

# Logs continuos a archivo
adb logcat -f /sdcard/logcat.txt

# Limpiar buffer de logs
adb logcat -c

# Ver tamaño de buffers
adb logcat -g

# Buffers específicos:
adb logcat -b crash
adb logcat -b events
adb logcat -b radio
adb logcat -b system

# Logcat filtrado por palabra clave
adb logcat -d | grep -i "firebase|password|token|secret"
```

### Bugreport

```bash
# Generar bugreport completo
adb bugreport bugreport.zip

# Contiene: dumpstate, dumpsys completo, logcat completo, traces.txt

# Extraer bugreport
unzip bugreport.zip -d bugreport_dir
```

### ANR Traces

```bash
# Obtener traces de ANR
adb pull /data/anr/traces.txt

# Monitorear ANRs en tiempo real
adb logcat -s "ActivityManager" | grep "ANR"
```

### Heap dump

```bash
# Dump de heap de un proceso
adb shell am dumpheap com.package.name /data/local/tmp/heap.hprof

# Descargar
adb pull /data/local/tmp/heap.hprof

# Abrir en Android Studio: File -> Open -> heap.hprof
```

---

## 23. Archivos y Filesystem

```bash
# Listar archivos
adb shell ls /sdcard/
adb shell ls -la /data/data/com.package.name/
adb shell ls -R /sdcard/

# Push (enviar archivo al dispositivo)
adb push local.txt /sdcard/remote.txt

# Push con permisos
adb push script.sh /data/local/tmp/
adb shell chmod 755 /data/local/tmp/script.sh

# Pull (descargar archivo)
adb pull /sdcard/remote.txt local.txt

# Pull de carpeta
adb pull /sdcard/DCIM/ ./photos/

# Crear, mover, copiar, eliminar
adb shell mkdir /sdcard/nueva_carpeta
adb shell mv /sdcard/old.txt /sdcard/new.txt
adb shell cp /sdcard/a.txt /sdcard/b.txt
adb shell rm /sdcard/archivo.txt
adb shell rm -r /sdcard/carpeta/

# Ver espacio disponible
adb shell df -h

# Buscar archivos
adb shell find /sdcard/ -name "*.txt"
adb shell find /data/ -name "*.db"
adb shell find / -name "*.apk" -type f 2>/dev/null

# Buscar archivos por tamaño
adb shell find /sdcard/ -type f -size +10M

# Calcular hash
adb shell md5sum /sdcard/archivo.bin
adb shell sha256sum /sdcard/archivo.bin

# Permisos de archivos
adb shell stat /sdcard/archivo.txt
adb shell chmod 644 /sdcard/archivo.txt
```

---

## 24. Automatización y scriptingting)

```bash
# Loop de monitoreo básico
while true; do clear; adb shell dumpsys battery | grep -E "level|status|powered"; sleep 5; done

# Automatización de instalación de múltiples APKs
for apk in *.apk; do echo "Instalando $apk.."; adb install "$apk" || echo "Falló $apk"; done

# Script de backup automático
DATE=$(date +%Y%m%d); mkdir -p "backup_$DATE"
for pkg in $(adb shell pm list packages -3 | cut -d: -f2); do path=$(adb shell pm path $pkg | head -1 | cut -d: -f2) adb pull "$path" "backup_$DATE/$pkg.apk"
done

# Script para rotar IPs en ADB WiFi
for ip in 192.168.1.{100.110}; do adb connect "$ip:5555" 2>/dev/null if adb devices | grep -q "$ip"; then echo "Conectado a $ip" adb disconnect "$ip:5555" fi
done

# Monitoreo de batería con alerta
while true; do level=$(adb shell dumpsys battery | grep level | cut -d: -f2 | tr -d " ") if [ "$level" -lt 20 ]; then echo "⚠ Batería baja: $level%"; fi sleep 60
done
```

---

## 25. Overlays, Ventanas y Display

```bash
# Permiso SYSTEM_ALERT_WINDOW para overlay
adb shell appops set com.package.name SYSTEM_ALERT_WINDOW allow

# Listar ventanas overlay activas
adb shell dumpsys window | grep "Window #" | grep -i "overlay|system_alert|TYPE_APPLICATION_OVERLAY"

# SurfaceFlinger dump
adb shell dumpsys SurfaceFlinger --displays
adb shell dumpsys SurfaceFlinger --layers

# Mostrar toques en pantalla
adb shell settings put global show_touches 1

# Mostrar FPS
adb shell settings put global show_fps 1

# Pointer location
adb shell settings put global pointer_location 1

# Deshabilitar notificaciones overlay
adb shell settings put global heads_up_notifications_enabled 0
```

---

## 26. Trampas comunes y Troubleshooting

### Error: "adb: device offline"
```bash
adb kill-server && adb start-server
adb usb
adb shell stop adbd && adb shell start adbd
```

### Error: "adb: insufficient permissions for device" (Linux)
```bash
echo "SUBSYSTEM==\"usb\", ATTR{idVendor}==\"18d1\", MODE=\"0666\", GROUP=\"plugdev\"" | [sudo](../raw/l1n9x-pr1v3sc.md#sudo) tee /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
```

### Error: "adb: device unauthorized"
```bash
adb kill-server
rm ~/.android/adbkey ~/.android/adbkey.pub
adb start-server
# Reconectar USB y aceptar en pantalla
```

### Error: "INSTALL_FAILED_INSUFFICIENT_StorAGE"
```bash
adb shell pm trim-caches 999999999999
adb shell rm -rf /cache/*
```

### Error: "adb server version doesn't match this client"
```bash
taskkill /f /im adb.exe  # Windows
killall adb  # Linux/Mac
adb start-server
```

### Error: "more than one device/emulator"
```bash
# Especificar dispositivo:
adb -s <serial> shell
export ANDROID_SERIAL="emulator-5554"
```

---

## 27. Referencia Rápida para pentesting

### [reconocimiento](./raw/ inicial
```bash
# Info del dispositivo
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk

# Listar apps instaladas
adb shell pm list packages -3 -f -i

# Root check
adb shell su -c "id"
adb shell which su

# SELinux status
adb shell getenforce

# Buscar datos interesantes
adb shell find / -name "*.db" 2>/dev/null
adb shell find / -name "*.xml" -path "*/shared_prefs/*" 2>/dev/null
adb shell find / -name "*password*" -type f 2>/dev/null
```

### Extracción de datos
```bash
# Extraer APKs de terceros
for pkg in $(adb shell pm list packages -3 | cut -d: -f2); do path=$(adb shell pm path $pkg | head -1 | cut -d: -f2) adb pull "$path" "./apks/$pkg.apk" 2>/dev/null
done

# Extraer databases y shared_prefs
adb exec-out run-as com.package.name tar -cf - databases shared_prefs files > app_data.tar

# Logcat sensitivo
adb logcat -d | grep -i -E "(password|token|auth|key|secret|firebase)" > sensitive_logs.txt
```

### Análisis de red
```bash
# Ver conexiones activas
adb shell netstat -tlnp

# Proxy intercept
adb shell settings put global http_proxy 192.168.1.100:8080
adb shell settings put global http_proxy :0
```

### Explotación de providers
```bash
# Listar content providers exportados
adb shell dumpsys package com.package.name | grep "authority="

# Query a cada provider
adb shell content query --uri content://authority/table --limit 5
```

---

## 28. Overlay Drawables

```bash
# Listar overlays disponibles
adb shell cmd overlay list

# Habilitar overlay
adb shell cmd overlay enable com.android.theme.color.cinnamon

# Deshabilitar overlay
adb shell cmd overlay disable com.android.theme.color.cinnamon

# Prioridad de overlays
adb shell cmd overlay set-priority com.theme.package HIGH
```

---

## 29. adb sobre WAN

```bash
# Opción 1: Usar ngrok
ngrok tcp 5555
adb connect <ngrok_url>:<port>

# Opción 2: Reverse SSH tunnel
adb shell ssh -R 5555:localhost:5555 user@server.com

# Opción 3: VPN o ZeroTier/Tailscale
adb connect <zerotier_ip>:5555

# Cambiar puerto de ADB WiFi
adb tcpip 9876
adb connect <ip>:9876

# Recomendaciones de seguridad:
# 1. Usar SSH tunnel en lugar de exponer puerto
# 2. Cambiar puerto default (5555)
# 3. Usar VPN
# 4. Deshabilitar ADB cuando no se usa
```

---

## 30. adb para forense

```bash
# Preservar evidencia — NO modificar nada en el dispositivo

# Capturar estado del sistema ANTES de tocar nada
SERIAL=$(adb shell getprop ro.serialno)
DATE=$(date +%Y%m%d_%H%M%S)
OUTDIR="forensics_${SERIAL}_${DATE}"
mkdir -p "$OUTDIR"

# Información del dispositivo
adb shell getprop > "$OUTDIR/getprop.txt"

# Procesos
adb shell ps -A > "$OUTDIR/processes.txt"

# Conexiones de red
adb shell netstat -tlnp > "$OUTDIR/network_connections.txt"

# Logcat completo
adb logcat -d > "$OUTDIR/logcat.txt"

# Dumpsys de todos los servicios
for service in $(adb shell dumpsys -l | tr -d "\\r"); do adb shell dumpsys $service > "$OUTDIR/dumpsys_${service}.txt" 2>/dev/null
done

# Paquetes instalados
adb shell pm list packages -3 -f -i > "$OUTDIR/packages_3rdparty.txt"

# Settings
adb shell settings list global > "$OUTDIR/settings_global.txt"
adb shell settings list secure > "$OUTDIR/settings_secure.txt"

# Contactos y llamadas
adb shell content query --uri content://com.android.contacts/contacts > "$OUTDIR/contacts.txt"
adb shell content query --uri content://call_log/calls > "$OUTDIR/call_log.txt"

# WiFi passwords (root)
if adb shell su -c "id" 2>/dev/null | grep -q "uid=0"; then adb shell su -c "cat /data/misc/wifi/WifiConfigStore.xml" > "$OUTDIR/wifi_passwords.xml"
fi

# Empacar evidencia
zip -r "${OUTDIR}.zip" "$OUTDIR"
echo "Evidencia recolectada en: ${OUTDIR}.zip"
```

---

## 31. adb con docker

```bash
# Docker Android (emulador en contenedor)
[docker](../raw/d0ck3r-f0r-h4ck3rs.md) run -d --privileged -p 5555:5555 -p 5554:5554 budtmo/[docker](../raw/d0ck3r-f0r-h4ck3rs.md)-android-[x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)-8.1

# Conectar
adb connect localhost:5555

# Docker ADB server
docker run -d -p 5037:5037 --name adb-server sorccu/adb:latest

# ADB con múltiples emuladores Docker
for i in {1.3}; do port=$(5555 + i * 2) docker run -d --privileged -p $port:$port budtmo/docker-android-x86-8.1 adb connect localhost:$port
done

# Docker compose para ADB
cat <<EOF > docker-compose.yml
version: "3"
services: android-emulator: image: budtmo/docker-android-x86-8.1 privileged: true ports: - "5554:5554" - "5555:5555" adb-client: image: sorccu/adb:latest depends_on: - android-emulator command: adb connect android-emulator:5555
EOF
```

---

## 32. adb con ci/cd

```yaml
# GitHub Actions — Android CI con ADB
name: Android CI
on: [push]
jobs: test: runs-on: ubuntu-latest steps: - uses: actions/checkout@v3 - name: Set up JDK uses: actions/setup-java@v3 with: java-version: "17" - name: Start emulator run: | echo "y" | $ANDROID_HOME/tools/bin/sdkmanager --install "system-images;android-29;google_apis;x86" echo "no" | $ANDROID_HOME/tools/bin/avdmanager create avd -n test -k "system-images;android-29;google_apis;x86" -d pixel_xl $ANDROID_HOME/tools/emulator -avd test -no-audio -no-window -gpu swiftshader_indirect & adb wait-for-device adb shell settings put global window_animation_scale 0.0 adb shell settings put global transition_animation_scale 0.0 adb shell settings put global animator_duration_scale 0.0 - name: Build and test run: | ./gradlew assembleDebug adb install app/build/outputs/apk/debug/app-debug.apk adb shell am instrument -w com.package.test/androidx.test.runner.AndroidJUnitRunner
```

---

## 33. adb para Testing de red

```bash
# Verificar conectividad
adb shell ping -c 4 8.8.8.8
adb shell ping -c 4 google.com

# DNS resolution
adb shell nslookup google.com
adb shell nslookup google.com 8.8.8.8

# Traceroute
adb shell traceroute google.com

# HTTP requests con curl
adb shell curl -I https://api.example.com
adb shell curl -X POST -H "Content-Type: application/json" -d "{\"key\":\"value\"}" https://api.example.com/endpoint

# TLS version
adb shell curl --tlsv1.2 -I https://example.com

# Certificate info
adb shell openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -text

# Ver puertos abiertos
adb shell netstat -tuln

# Port scanning desde el dispositivo
for port in {1.1024}; do adb shell timeout 1 bash -c "echo >/dev/tcp/192.168.1.1/$port" 2>/dev/null && echo "Puerto $port abierto"
done
```

---

## 34. Script de Auto-Diagnóstico

```bash
#!/bin/bash
# adb_diagnostic.sh - Verifica que todo esté funcionando

echo "=== ADB Diagnostic Tool ==="
echo ""

# 1. ADB installed?
if command -v adb &> /dev/null; then echo "[✓] ADB instalado: $(adb version | head -1)"
else echo "[✗] ADB no encontrado en PATH" exit 1
fi

# 2. ADB server running?
if adb devices &> /dev/null; then echo "[✓] Servidor ADB funcionando"
else echo "[!] Iniciando servidor ADB.." adb start-server
fi

# 3. Devices connected?
devices=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)
if [ "$devices" -gt 0 ]; then echo "[✓] Dispositivos conectados: $devices" adb devices -l
else echo "[✗] No hay dispositivos conectados" echo "  Conectá un dispositivo USB o WiFi" exit 1
fi

# 4. Device info
echo ""
echo "--- Device Info ---"
echo "Modelo: $(adb shell getprop ro.product.model | tr -d "\\r")"
echo "Android: $(adb shell getprop ro.build.version.release | tr -d "\\r")"
echo "API: $(adb shell getprop ro.build.version.sdk | tr -d "\\r")"
echo "Batería: $(adb shell dumpsys battery | grep level | tr -d "\\r \\t" | cut -d: -f2)%"

# 5. ADB WiFi?
echo ""
echo "--- ADB WiFi ---"
adb shell getprop service.adb.tcp.port | grep -q "5555" && echo "[✓] ADB WiFi en puerto 5555" || echo "[i] ADB WiFi no activo"

# 6. Root?
echo ""
echo "--- Root Status ---"
if adb shell su -c "id" 2>/dev/null | grep -q "uid=0"; then echo "[✓] Root disponible"
else echo " Sin root (normal)"
fi

echo ""
echo "=== Diagnóstico completado ==="
```

---

## 35. comandos Obsoletos y Alternativas

| Comando Obsoleto | Alternativa Moderna |
|-----------------|---------------------|
| `adb shell` (sin args) | `adb shell` (sigue funcionando) |
| `adb bugreport > dump` | `adb bugreport dump.zip` |
| `pm set-install-location` | No recomendado en android 6+ |
| `pm hide/unhide` | `pm disable-user` (Android 11+) |
| `adb shell am start -a android.intent.action.MAIN` | `adb shell monkey -p <pkg> 1` |
| `adb shell netcfg` | `adb shell ip addr` |
| `adb shell dumpsys wifi` | `adb shell dumpsys wifi` (sigue funcionando) |
| `adb shell ifconfig` | `adb shell ip addr` |
| `adb shell route` | `adb shell ip route` |

---

## 36. Tabla de Keycodes completos

| Keycode | Valor | Descripción |
|---------|-------|-------------|
| KEYCODE_HOME | 3 | Home |
| KEYCODE_BACK | 4 | Back |
| KEYCODE_CALL | 5 | Llamar |
| KEYCODE_ENDCALL | 6 | Terminar llamada |
| KEYCODE_DPAD_UP | 19 | Arriba |
| KEYCODE_DPAD_DOWN | 20 | Abajo |
| KEYCODE_DPAD_LEFT | 21 | Izquierda |
| KEYCODE_DPAD_RIGHT | 22 | Derecha |
| KEYCODE_DPAD_CENTER | 23 | Centro (OK) |
| KEYCODE_VOLUME_UP | 24 | Subir volumen |
| KEYCODE_VOLUME_DOWN | 25 | Bajar volumen |
| KEYCODE_POWER | 26 | Power |
| KEYCODE_CAMERA | 27 | Cámara |
| KEYCODE_CLEAR | 28 | Limpiar |
| KEYCODE_MENU | 82 | Menú |
| KEYCODE_NotIFICATION | 83 | Notificaciones |
| KEYCODE_SEARCH | 84 | Buscar |
| KEYCODE_MEDIA_PLAY_PAUSE | 85 | Play/Pause |
| KEYCODE_MEDIA_STOP | 86 | Stop |
| KEYCODE_MEDIA_NEXT | 87 | Siguiente |
| KEYCODE_MEDIA_PREVIOUS | 88 | Anterior |
| KEYCODE_MEDIA_REWIND | 89 | Rewind |
| KEYCODE_MEDIA_FAST_FORWARD | 90 | Fast Forward |
| KEYCODE_MUTE | 91 | Silenciar |
| KEYCODE_PAGE_UP | 92 | Página arriba |
| KEYCODE_PAGE_DOWN | 93 | Página abajo |
| KEYCODE_ENTER | 66 | Enter |
| KEYCODE_DEL | 67 | Delete |
| KEYCODE_SPACE | 62 | Espacio |
| KEYCODE_TAB | 61 | Tab |
| KEYCODE_CAPS_LOCK | 115 | Bloq Mayús |
| KEYCODE_ESCApe | 111 | Escape |
| KEYCODE_CTRL_LEFT | 113 | Ctrl izquierdo |
| KEYCODE_ALT_LEFT | 57 | Alt izquierdo |
| KEYCODE_SHIFT_LEFT | 59 | Shift izquierdo |

```bash
# Enviar keyevent por código numérico
adb shell input keyevent 3 # Home
adb shell input keyevent 4 # Back
adb shell input keyevent 26 # Power

# Texto
adb shell input text "hola mundo"

# Swipe
adb shell input swipe 500 1000 500 500  # swipe up
adb shell input swipe 100 500 900 500 # swipe right

# Tap
adb shell input tap 500 500

# Long press
adb shell input swipe 500 500 500 500 1000  # 1 segundo
```

---

## 37. adb y Emuladores android

```bash
# Listar emuladores
adb devices
# emulator-5554, emulator-5556, etc.

# Comandos de consola de emulador
telnet localhost 5554
# Dentro de telnet:
# help - lista comandos
# avd name - nombre del AVD
# kill - matar emulador
# network delay - simular latencia
# network speed - simular velocidad
# gsm call - simular llamada
# sms - simular SMS
# geo fix - simular GPS

# Comandos útiles de telnet para emulador:
# geo fix -34.6037 -58.3816 # Ubicación Buenos Aires
# gsm call 1234567890 # Llamada entrante
# sms 1234567890 Hola # SMS entrante
# power ac off # Desconectar cargador
# power ac on # Conectar cargador
# event send EV_KEY:KEYCODE_HOME:1 # Enviar tecla

# Propiedades del emulador
adb shell getprop ro.[kernel](../raw/0s-f0nd4m3nt0s.md#kernel).qemu
adb shell getprop ro.build.flavor | grep "sdk"
```

---

## 38. adb en Recovery personalizados

```bash
# TWRP - Comandos ADB avanzados en recovery
adb shell twrp backup # Crear backup
adb shell twrp restore # Restaurar backup
adb shell twrp install # Instalar ZIP
adb shell twrp mount # Montar partición
adb shell twrp unmount # Desmontar
adb shell twrp wipe # Formatear
adb shell twrp sideload # Modo sideload

# Backup completo (SDBOE)
adb shell twrp backup SDBOE
# System, Data, Boot, OEM, EFS

# Restaurar backup
adb shell twrp restore /sdcard/TWRP/BACKUPS/<serial>/<backup_folder>/

# Wipe
adb shell twrp wipe cache
adb shell twrp wipe dalvik
adb shell twrp wipe data
adb shell twrp wipe system

# Montar particiones
adb shell twrp mount /system
adb shell twrp mount /data

# ADB sideload en recovery
adb sideload rom.zip

# En recovery podés acceder a TODOS los archivos
adb pull /data/data/com.whatsapp/databases/wa.db
```

---

## 39. adb con Fastboot

```bash
# Entrar a fastboot desde ADB
adb reboot bootloader

# Verificar fastboot
fastboot devices

# Comandos fastboot básicos
fastboot flash boot boot.img
fastboot flash recovery recovery.img
fastboot flash system system.img
fastboot flash vendor vendor.img
fastboot flash bootloader bootloader.img
fastboot flash radio radio.img

# Desbloquear bootloader
fastboot oem unlock
fastboot flashing unlock

# Bloquear bootloader
fastboot oem lock
fastboot flashing lock

# Reiniciar desde fastboot
fastboot reboot
fastboot reboot-bootloader

# Particiones lógicas (Android 10+, super partition)
fastboot flash super super.img
fastboot delete-logical-partition product
fastboot create-logical-partition product 1024

# FastbootD (Android 10+)
fastboot reboot fastboot

# Comandos avanzados de fastboot
fastboot getvar all  # Ver todas las variables
fastboot oem device-info  # Info del dispositivo
fastboot format:ext4 userdata  # Formatear data
fastboot erase cache
```

---

## 40. adb con Múltiples Displays

```bash
# Listar displays disponibles
adb shell dumpsys display | grep "Display "

# Crear display virtual (Android 11+)
adb shell am broadcast -a android.intent.action.ACTION_CREATE_DISPLAY --ei width 1920 --ei height 1080 --ei density 320

# Mover app a otro display
adb shell am start -n com.package.name/.Activity --ei android.intent.extra.INTENT_EXTRA_DISPLAY_ID 1

# Screenshot de display específico
adb shell screencap -d 1 -p /sdcard/screen_display1.png

# Presentación en display externo
adb shell am start -a android.intent.action.VIEW -d "content://.." -f 0x10000000 --ei android.intent.extra.INTENT_EXTRA_DISPLAY_ID 2
```

---

## 41. adb Logcat en Tiempo Real

```bash
# Logcat en tiempo real con filtros
adb logcat -v time -s "MyTag:*"

# Logcat con colores (Linux/Mac)
adb logcat -v time | grep --color=always "ERROR|FATAL|WARN"

# Logcat con timestamp y PID
adb logcat -v time,pid

# Logcat en tiempo real guardando a archivo
adb logcat -v time > logcat_$(date +%Y%m%d).txt &

# Logcat filtrado por nivel de severidad
adb logcat *:E  # Solo errores
adb logcat *:W *:E  # Warnings y errores

# Logcat con expresión regular
adb logcat -e "(?i)(exception|crash|fatal)"

# Seguir logs de una app mientras se monitoriza
adb shell pidof com.package.name | xargs -I{} adb logcat --pid={} -v time
```

---

## 42. adb con Termux

```bash
# Termux es un emulador de terminal para Android
# Instalar ADB en Termux:
pkg install android-tools

# ADB local en Termux (sin PC)
adb devices  # Muestra solo localhost

# Conectarse a otro dispositivo desde Termux
adb connect 192.168.1.50:5555

# Scripts de automatización en Termux
termux-wake-lock

# Monitoreo desde el mismo dispositivo
while true; do echo "$(date) - Batería: $(termux-battery-status | python3 -c "import sys,json; print(json.load(sys.stdin)["percentage"])")%" sleep 60
done

# Usar Termux como servidor ADB
adb start-server
# Luego desde otro dispositivo:
# adb connect <termux_ip>:5037
```

---

## 43. Cheatsheet Final

| Categoría | comando | Descripción |
|-----------|---------|-------------|
| DISPOSITIVO | `adb devices -l` | Listar dispositivos |
| DISPOSITIVO | `adb connect IP:5555` | Conectar wifi |
| DISPOSITIVO | `adb disconnect` | Desconectar |
| SHELL | `adb shell` | Shell interactiva |
| SHELL | `adb shell comando` | Comando directo |
| APPS | `adb install app.apk` | Instalar |
| APPS | `adb uninstall pkg` | Desinstalar |
| APPS | `adb shell pm list packages -3` | Apps terceros |
| APPS | `adb shell pm path pkg` | Ruta APK |
| APPS | `adb pull /ruta/ app.apk` | Extraer APK |
| DEBUG | `adb logcat` | Ver logs |
| DEBUG | `adb logcat *:E` | Solo errores |
| DEBUG | `adb bugreport` | Reporte completo |
| FILES | `adb pull /ruta/ ./` | Descargar archivos |
| FILES | `adb push ./ /ruta/` | Subir archivos |
| SCREEN | `adb exec-out screencap -p > s.png` | Screenshot |
| SCREEN | `adb shell screenrecord /sdcard/r.mp4` | Grabación |
| INPUT | `adb shell input keyevent 3` | Home |
| INPUT | `adb shell input tap x y` | Tocar |
| INPUT | `adb shell input text "hola"` | Escribir texto |
| NET | `adb forward tcp:8080 tcp:8080` | Port forwarding |
| NET | `adb reverse tcp:8080 tcp:8080` | Reverse forwarding |
| peRM | `adb shell pm grant pkg perm` | Otorgar permiso |
| PERM | `adb shell pm revoke pkg perm` | Revocar permiso |
| ROOT | `adb root` | ADB como root |
| ROOT | `adb remount` | Remount system RW |
| REset | `adb kill-server && adb start-server` | Reset ADB |

```bash
# Decodificar info de pantalla en una línea
adb shell dumpsys window | grep mCurrentFocus | cut -d" " -f5

# Nivel de batería en una línea
adb shell dumpsys battery | grep level | cut -d: -f2 | tr -d " "

# Versión de Android
adb shell getprop ro.build.version.release
```

---

## 44. Seguridad en adb

```bash
# Deshabilitar ADB completamente
adb shell settings put global adb_enabled 0

# Habilitar solo ADB autenticado (Android 9+)
adb shell settings put global adb_allowed_connection_time 0

# Revocar todas las claves autorizadas
# Settings -> Developer options -> Revoke USB debugging authorizations

# ADB encriptado (Android 11+)
# El tráfico ADB se cifra con TLS automáticamente

# Buenas prácticas de seguridad:
# 1. Deshabilitar ADB cuando no se usa
# 2. No dejar USB debugging activo en dispositivos de producción
# 3. Usar ADB por WiFi solo en redes confiables
# 4. Revocar autorizaciones periódicamente
# 5. No conectar ADB a computadoras desconocidas

# Verificar estado de TLS en ADB
adb shell dumpsys adb | grep "TLS"
```

---

## 45. Referencia de archivos importantes

| Ruta | Contenido |
|------|-----------|
| /data/app/ | apks instalados |
| /data/data/<pkg>/ | Datos de apps |
| /data/system/packages.xml | Lista de paquetes instalados |
| /data/system/packages.list | Lista con Uidss) |
| /data/misc/adb/adb_keys | Claves ADB autorizadas |
| /data/misc/wifi/WifiConfigStore.xml | redes WiFi guardadas |
| /data/system/device_policies.xml | Políticas de device admin |
| /data/system/users/ | Datos de usuarios |
| /data/anr/traces.txt | ANR traces |
| /data/local/tmp/ | Archivos temporales |
| /sdcard/ | Almacenamiento compartido |
| /system/build.prop | Propiedades del sistema |
| /proc/ | sistema de archivos del kernel |
| /sys/ | Kernel parameters |
| /system/app/ | Apps del sistema |
| /system/priv-app/ | Apps privilegiadas del sistema |
| /vendor/app/ | Apps del vendor |

```bash
# Leer packages.xml (requiere root)
adb shell su -c "cat /data/system/packages.xml"
```

---

## 46. Integración con android Studio

```bash
# Android Studio incluye ADB en:
# $ANDROID_HOME/platform-tools/adb

# DDMS (Dalvik Debug Monitor Server)
# Tools -> Android -> Device Monitor

# Android Profiler
# View -> Tool Windows -> Profiler

# Logcat en Android Studio
# View -> Tool Windows -> Logcat

# File Explorer en Device File Explorer
# View -> Tool Windows -> Device File Explorer

# ADB desde terminal integrado de Android Studio
# View -> Tool Windows -> Terminal
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Configurar ADB path en Android Studio
# File -> Settings -> Languages & Frameworks -> Android SDK -> SDK Tools

# Ejecutar app desde gradle con ADB
./gradlew installDebug
./gradlew uninstallDebug
```

---

## 47. adb en Windows

```bash
# Dónde encontrar ADB en Windows:
# C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe

# Agregar al PATH del sistema:
# [System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk\\platform-tools", "User")

# Drivers USB en Windows:
# Device Manager -> Android Device (o dispositivo desconocido)
# -> Update driver -> Browse -> Let me pick -> ADB Interface

# Verificar drivers:
pnputil -e | findstr "adb"

# ADB en PowerShell (alias)
function adb { & "C:\\Android\\Sdk\\platform-tools\\adb.exe" @args }

# ADB over USB en Windows:
# USB debugging debe estar habilitado
# Drivers OEM pueden ser necesarios (Google USB Driver)

# Matar ADB server en Windows:
taskkill /f /im adb.exe
```

---

## 48. adb Environment variables

| Variable | Descripción |
|----------|-------------|
| android_SERIAL | Serial del dispositivo por defecto |
| ANDROID_adB_SERVER_PORT | puerto del servidor ADB (default: 5037) |
| ANDROID_PRODUCT_OUT | Directorio de build output |
| ADB_VENDOR_KEYS | Directorio con claves de vendor |
| HOME | Directorio home (para .android/) |
| HOMEPATH | Windows: path al home |

```bash
# Usar puerto personalizado para servidor ADB
export ANDROID_ADB_SERVER_PORT=5038
adb start-server

# Serial por defecto
export ANDROID_SERIAL="0123456789ABCDEF"
adb shell getprop ro.product.model
# (usa ANDROID_SERIAL automáticamente)

# Variables en Windows PowerShell:
$env:ANDROID_SERIAL = "0123456789ABCDEF"
$env:ANDROID_ADB_SERVER_PORT = "5038"
```

---

## 49. Extendiendo adb

```bash
# ADB soporta plugins (no oficiales)
# Ejemplo: adb-sync para sincronización bidireccional
pip install adb-sync
adb-sync /local/folder/ /sdcard/folder/

# adb-enhanced - herramientas extra para ADB
pip install adb-enhanced
adbe screenshot
adbe screenrecord
adbe logcat --filter View:*

# adb_wifi - Conectar WiFi automáticamente
pip install adb-wifi
adb-wifi

# Scrcpy (mirror + control)
scrcpy --shortcut-mod=ctrl

# ADB con Python (pure-python-adb)
pip install pure-[python](../raw/pyth0n-f0r-h4ck1ng.md)-adb

# ADB con Node.js (adbkit)
npm install -g adbkit
adbkit devices

# ADB con Go (go-adb)
go get github.com/zach-klippenstein/goadb

# ADB en Rust (adbusb)
cargo install adbusb
```

---

## 50. Listado de todos los comandos

| Comando | Descripción |
|---------|-------------|
| `adb devices` | Listar dispositivos |
| `adb devices -l` | Listar con detalles |
| `adb connect` | Conectar por tcp/ip-ip) |
| `adb disconnect` | Desconectar TCP/IP |
| `adb pair` | Pairing android 11+ |
| `adb forward` | Port forwarding |
| `adb reverse` | Reverse forwarding |
| `adb shell` | Shell interactivo |
| `adb install` | Instalar apk |
| `adb install-multiple` | Instalar split APKs |
| `adb uninstall` | Desinstalar |
| `adb push` | Subir archivos |
| `adb pull` | Descargar archivos |
| `adb sync` | Sincronizar directorio |
| `adb logcat` | Ver logs |
| `adb bugreport` | Reporte completo |
| `adb backup` | Backup de datos |
| `adb restore` | Restaurar backup |
| `adb sideload` | Flashear desde recovery |
| `adb reboot` | Reiniciar |
| `adb reboot bootloader` | Reiniciar a fastboot |
| `adb reboot recovery` | Reiniciar a recovery |
| `adb remount` | Remontar /system RW |
| `adb root` | ADB como root |
| `adb unroot` | ADB como usuario |
| `adb usb` | Cambiar a USB |
| `adb tcpip` | Cambiar a TCP/IP |
| `adb start-server` | Iniciar servidor |
| `adb kill-server` | Matar servidor |
| `adb emu` | Comando de emulador |
| `adb wait-for-device` | Esperar dispositivo |
| `adb get-state` | Estado del dispositivo |
| `adb get-serialno` | Serial number |
| `adb get-devpath` | Device path |
| `adb remount` | Remontar particiones |
| `adb disable-verity` | Deshabilitar dm-verity |
| `adb enable-verity` | Habilitar dm-verity |
| `adb keygen` | Generar claves rsa |
| `adb help` | Ayuda |
| `adb version` | Versión |

---

## 51. Checklist para Ethical Hacking

-  Verificar USB debugging habilitado
-  `adb devices` confirma conexión
-  `adb shell pm list packages -3 -f -i` lista apps
-  `adb shell dumpsys window | grep mCurrentFocus` muestra app actual
-  `adb exec-out screencap -p > screen.png` screenshot inicial
-  `adb logcat -d > logs.txt` captura logs
-  `adb shell pm path <pkg>` obtiene ruta del apk
-  Extraer APK con `adb pull`
-  `adb shell pm list packages -U | grep <pkg>` obtiene UID
-  `adb shell netstat -tlnp` conexiones de red
-  `adb shell content query --uri content://<authority>/` providers
-  `adb forward tcp:8080 tcp:8080` proxy intercept
-  `adb shell settings put global http_proxy <ip>:8080` proxy
-  Analizar APK con apktool/jadx
-  `adb shell am start -n <pkg>/<Activity>` lanzar activity
-  `adb shell am startservice -n <pkg>/<Service>` servicios
-  `adb shell am broadcast -a <ACTION>` broadcasts
-  `adb shell pm grant <pkg> <perm>` otorgar [permisos](./raw/0s
-  Documentar todos los hallazgos

---

## 52. Versiones de adb

| Versión adB | Novedades |
|-------------|-----------|
| 1.0.31 | Primera versión estable |
| 1.0.32 | Soporte para múltiples displays |
| 1.0.36 | ADB backup/restore |
| 1.0.39 | Mejoras en instalación |
| 1.0.41 | `adb install-multiple` |
| 30.0.0 | android 11: ADB pairing, ADB over wifi nativo |
| 31.0.0 | tls encriptación de tráfico ADB |
| 33.0.0 | Android 13: `adb shell dumpsys` mejorado |
| 34.0.0 | Android 14: Mejoras de seguridad |
| 35.0.0 | Android 15: Soporte para Satellite |

```bash
# Ver versión de ADB
adb version

# Salida:
# Android Debug Bridge version 1.0.41
# Version 35.0.0-1234567
# Installed as /path/to/adb
```

---

## 53. Referencia de Errores

| Código de Error | Significado | Solución |
|-----------------|-------------|----------|
| DEVICE_OFFLINE | adbd no responde | `adb kill-server && adb start-server` |
| UNAUTHORIZED | No autorizado | Aceptar en pantalla del teléfono |
| NO_DEVICE | No hay dispositivo | Verificar cable y drivers |
| INSTALL_FAILED_ALREADY_EXISTS | App ya instalada | Usar `-r` |
| INSTALL_FAILED_INVALID_apk | APK corrupto | Recompilar/reinstalar |
| INSTALL_FAILED_INSUFFICIENT_STOragE | Sin espacio | `pm trim-caches` |
| INSTALL_FAILED_VERSION_DOWNGRADE | Versión anterior | Usar `-d` |
| INSTALL_FAILED_UPDATE_INCOMPATIBLE | Firma distinta | Desinstalar primero |
| INSTALL_FAILED_SHAred_USER_INCOMPATIBLE | Firma no coincide | Revisar certificados |
| INSTALL_FAILED_MISSING_SHARED_LIBRARY | Falta librería | Instalar requisitos |
| INSTALL_FAILED_DEXOPT | Error de optimización | Limpiar caché dalvik |
| INSTALL_FAILED_OLDER_SDK | API muy baja | Actualizar target SDK |
| INSTALL_FAILED_CPU_ABI_INCOMPATIBLE | Arquitectura incorrecta | Descargar APK correcto |
| PRotOCOL_ERROR | Error de protocolo | `adb kill-server && adb start-server` |
| CONNECTION_REset | Conexión perdida | Verificar wifi/cable |
| TIMEOUT | Timeout de conexión | Aumentar timeout o verificar red |
| PERMISSION_DENIED | Sin permisos | Usar root o grant |

---

## 54. Proyectos Prácticos

### Proyecto 1: adb Helper — Wrapper powerShell

```powershell
# adb_helper.ps1 - Script completo para análisis de apps Android
# No requiere root, solo ADB y USB debugging

param( [Parameter(Mandatory=$false)] [string]$Package = "", [Parameter(Mandatory=$false)] [[switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)]$Analyze, [Parameter(Mandatory=$false)] [[switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)]$Backup, [Parameter(Mandatory=$false)] [[switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)]$Monitor, [Parameter(Mandatory=$false)] [[switch](../raw/r3d3s-f0nd4m3nt0s.md#switches)]$ExtractAll
)

function Write-Banner { Write-Host "╔══════════════════════════════════╗" -ForegroundColor Cyan Write-Host "║ ADB Helper Tool v2.0 ║" -ForegroundColor Cyan Write-Host "╚══════════════════════════════════╝" -ForegroundColor Cyan
}

function Get-DeviceInfo { Write-Host "[*] Dispositivo:" -ForegroundColor Yellow adb shell getprop ro.product.model adb shell getprop ro.build.version.sdk adb shell getprop ro.build.version.release adb shell dumpsys battery | Select-String "level"
}

function Backup-AppData { param([string]$PackageName) Write-Host "[+] Backupeando $PackageName.." -ForegroundColor Green $date = Get-Date -Format "yyyyMMdd_HHmmss" $outDir = ".\backups\$PackageName" + "_$date" New-Item -ItemType Directory -Path $outDir -Force | Out-Null # Extraer APK $apkPath = adb shell pm path $PackageName | Select-String "package:" | ForEach-Object { $_ -replace "package:", "" } | Select-Object -First 1 if ($apkPath) { adb pull "$apkPath" "$outDir\base.apk" } # Dumpsys adb shell dumpsys package $PackageName > "$outDir\dumpsys.txt" Write-Host "[✓] Backup completado en $outDir" -ForegroundColor Green
}

function Monitor-App { param([string]$PackageName) $pid = adb shell pidof -s $PackageName if (-not $pid) { Write-Host "[!] La app no está corriendo. Iniciando.." -ForegroundColor Yellow adb shell monkey -p $PackageName 1 2>$null Start-Sleep -Seconds 2 $pid = adb shell pidof -s $PackageName } Write-Host "[*] Monitoreando $PackageName (PID: $pid)" -ForegroundColor Cyan while ($true) { $logLine = adb logcat -d -t 1 --pid=$pid 2>$null if ($logLine) { Write-Host "$(Get-Date -Format "HH:mm:ss") $logLine" } $alive = adb shell pidof -s $PackageName if (-not $alive) { Write-Host "[!] App terminó!" -ForegroundColor [red](../raw/r3d3s-f0nd4m3nt0s.md); break } Start-Sleep -Milliseconds 500 }
}

# Main execution
Clear-Host; Write-Banner
if (-not $Package -and -not $ExtractAll) { Write-Host "USO:"; Write-Host "  .\adb_helper.ps1 -Package com.example.app -Backup" exit
}
Get-DeviceInfo
if ($Backup) { Backup-AppData -PackageName $Package }
if ($Monitor) { Monitor-App -PackageName $Package }
```

### Proyecto 2: adB Network Scanner

```bash
#!/bin/bash
# adb_network_scanner.sh
NETWORK="${1:-192.168.1}"
START="${2:-1}"
END="${3:-254}"
PORT="${4:-5555}"

echo "Escaneando $NETWORK.$START - $NETWORK.$END en puerto $PORT.."

try_connect { local ip=$1 local result=$(timeout 3 adb connect "$ip:$PORT" 2>/dev/null) if echo "$result" | grep -q "connected"; then local model=$(adb -s "$ip:$PORT" shell getprop ro.product.model 2>/dev/null | tr -d "\\r") echo "✓ $ip → $model" fi
}

for ip in $(seq $START $END); do target="$NETWORK.$ip" if ping -c 1 -W 1 "$target" >/dev/null 2>&1; then try_connect "$target" & fi while [ $(jobs -r | wc -l) -ge 20 ]; do sleep 0.1; done
done
wait
echo ""; adb devices -l
```

### Proyecto 3: Monitor con Logcat y sqlite

```python
#!/usr/bin/env python3
"""adb_monitor.py - Monitoreo completo de apps Android via ADB"""
import subprocess, sqlite3, json, time, os, sys, re
from datetime import datetime
from threading import Thread

class ADBMonitor: def __init__(self, package, db_path="monitor.db"): self.package = package self.db_path = db_path self.running = False self._init_db def _init_db(self): conn = sqlite3.connect(self.db_path) c = conn.cursor c.execute("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, event_type TEXT, package TEXT, data TEXT)") c.execute("CREATE TABLE IF NOT EXISTS screenshots (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, path TEXT, activity TEXT)") conn.commit; conn.close def _run_adb(self, *args): result = subprocess.run(["adb"] + list(args), capture_output=True, text=True, timeout=30) return result.stdout.strip def monitor_logcat(self): process = subprocess.Popen(["adb", "logcat", "-v", "time", "--pid=" + str(self._get_pid)], stdout=subprocess.PIPE, text=True, bufsize=1) sensitive = ["password", "token", "secret", "auth", "credit", "firebase", "error", "exception", "crash"] while self.running: line = process.stdout.readline if not line: break for s in sensitive: if s in line.lower: print(f"[!] Sensitivo: {line.strip[:200]}") break def _get_pid(self): pid = self._run_adb("shell", "pidof", "-s", self.package) if pid and pid.isdigit: return pid self._run_adb("shell", "monkey", "-p", self.package, "1") time.sleep(2) return self._run_adb("shell", "pidof", "-s", self.package) def start(self): self.running = True pid = self._get_pid print(f"[*] Monitoreando {self.package} (PID: {pid})") t = Thread(target=self.monitor_logcat, daemon=True) t.start try: while self.running: time.sleep(1) except KeyboardInterrupt: print("\\n[*] Deteniendo..") self.running = False

if __name__ == "__main__": if len(sys.argv) < 2: print("Uso: python adb_monitor.py <package_name>") sys.exit(1) monitor = ADBMonitor(sys.argv[1]) monitor.start
```

### Proyecto 4: Diff de Configuración — Auditor de settings

```bash
#!/bin/bash
# settings_diff.sh
DEVICE=$1
BEFORE_DIR="./snapshots/before_$(date +%Y%m%d_%H%M%S)"
AFTER_DIR="./snapshots/after_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BEFORE_DIR $AFTER_DIR

take_snapshot { local out=$1 adb shell settings list global > "$out/global.txt" 2>/dev/null adb shell settings list system > "$out/system.txt" 2>/dev/null adb shell settings list secure > "$out/secure.txt" 2>/dev/null adb shell dumpsys package $DEVICE | grep "granted=true" > "$out/perms_granted.txt" 2>/dev/null adb shell appops get $DEVICE > "$out/appops.txt" 2>/dev/null adb shell pm list packages -3 -f -i > "$out/packages_3rd.txt" 2>/dev/null adb shell dumpsys device_policy > "$out/device_policy.txt" 2>/dev/null
}

echo "Snapshot ANTES de instalar:"; take_snapshot $BEFORE_DIR
read -p "Instalá la app y presioná Enter.."
echo "Snapshot DESPUES:"; take_snapshot $AFTER_DIR

echo ""; echo "=== DIFERENCIAS ==="
echo "--- [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) nuevos ---"
diff $BEFORE_DIR/perms_granted.txt $AFTER_DIR/perms_granted.txt 2>/dev/null | grep "^>"
echo "--- Settings global ---"
diff $BEFORE_DIR/global.txt $AFTER_DIR/global.txt 2>/dev/null | grep "^[<>]"
echo "--- AppOps ---"
diff $BEFORE_DIR/appops.txt $AFTER_DIR/appops.txt 2>/dev/null | grep "^[<>]"
```

---

## 55. Conclusión

adb es una herramienta increíblemente poderosa. Con lo que cubrimos acá, tenés control absoluto sobre cualquier dispositivo android. Desde el pr[otocolo](./raw/r3d3s de bajo nivel hasta técnicas avanzadas de pentesting, forense y automatización.

Recordá siempre: **con grandes poderes vienen grandes responsabilidades**. Usá ADB éticamente, solo en dispositivos que te pertenecen o con autorización explícita.

---

*Documento generado para fines educativos y de investigación en seguridad.*
*Versión: 5.0 — ADB Deep Dive Definitivo + Proyectos Prácticos*
*Última actualización: Mayo 2026*
*Más de 3000 líneas de documentación técnica + herramientas prácticas*

