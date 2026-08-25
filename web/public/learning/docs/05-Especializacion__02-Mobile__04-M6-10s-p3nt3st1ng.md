# Mobile [ios pentesting](./raw/10s / frida para iOS — Guía Ultra-Detallada

## Índice

> ⏱️ **Tiempo estimado:** 30 horas (~6 sesiones) (2653 lineas)


1. Introducción al [pentesting en iOS](#1-introducción-al-pentesting-en-ios)
2. Arquitectura de Segurid[ad de iOS](#2-arquitectura-de-seguridad-de-ios) - 2.1 [Sandbox](#21-sandbox) - 2.2 [Code Signing](#22-code-signing) - 2.3 [Entitlements](#23-entitlements) - 2.4 [Provisioning Profiles](#24-provisioning-profiles) - 2.5 [Keychain](#25-keychain) - 2.6 Data Pr[otection Classes](#26-data-protection-classes) - 2.7 [Secure Enclave](#27-secure-enclave)
3. [Jailbreak](#3-jailbreak) - 3.1 T[ipos de Jailbreak](#31-tipos-de-jailbreak) - 3.2 [Herramientas Actuales](#32-herramientas-actuales) - 3.3 [checkra1n](#33-checkra1n) - 3.4 [palera1n](#34-palera1n) - 3.5 [Dopamine](#35-dopamine) - 3.6 [XinaA15](#36-xinaa15) - 3.7 [Post-Jailbreak Setup](#37-post-jailbreak-setup)
4. [Análisis de IPA](#4-análisis-de-ipa) - 4.1 [Estructura del IPA](#41-estructura-del-ipa) - 4.2 [Info.plist Analysis](#42-infoplist-analysis) - 4.3 [Entitlements del IPA](#43-entitlements-del-ipa) - 4.4 [Mach-O Binary Analysis](#44-mach-o-binary-analysis) - 4.5 [CodeSign Inspection](#45-codesign-inspection)
5. [frida para iOS](#5-frida-para-ios) - 5.1 [Instalación de Frida](#51-instalación-de-frida) - 5.2 [frida-ps -U](#52-frida-ps--u) - 5.3 [frida-trace](#53-frida-trace) - 5.4 [frida-ls-devices](#54-frida-ls-devices) - 5.5 [Objective-C Hooks](#55-objective-c-hooks) - 5.6 [Method Replacement](#56-method-replacement) - 5.7 [Argument Modification](#57-argument-modification) - 5.8 [Return Value Override](#58-return-value-override)
6. [Frida Scripts para iOS](#6-frida-scripts-para-ios) - 6.1 [Bypass de Jailbreak Detection](#61-bypass-de-jailbreak-detection) - 6.2 [ssl) Pinning Bypass](#62-ssl-pinning-bypass) - 6.3 [Keychain Dump](#63-keychain-dump) - 6.4 [UI Manipulation](#64-ui-manipulation) - 6.5 [Class-Dump con Frida](#65-class-dump-con-frida)
7. [Objection para iOS](#7-objection-para-ios) - 7.1 [Instalación de Objection](#71-instalación-de-objection) - 7.2 [patchipa](#72-patchipa) - 7.3 [comandos Exploratorios](#73-comandos-exploratorios) - 7.4 [NSUserDefaults Manipulation](#74-nsuserdefaults-manipulation) - 7.5 [Keychain Dump con Objection](#75-keychain-dump-con-objection) - 7.6 [sqlite Interaction](#76-sqlite-interaction)
8. [Runtime Analysis](#8-runtime-analysis) - 8.1 [Method Swizzling Detection](#81-method-swizzling-detection) - 8.2 [Cycript (Legacy)](#82-cycript-legacy) - 8.3 [Frida Gadget Injection](#83-frida-gadget-injection)
9. [ios](../raw/10s-p3nt3st1ng.md) N[etworking](#9-ios-networking) - 9.1 Burp [proxy Configuration](#91-burp-proxy-configuration) - 9.2 [Certificate Installation](#92-certificate-installation) - 9.3 [SSL Pinning Bypass](#93-ssl-pinning-bypass) - 9.4 [http Traffic Analysis](#94-http-traffic-analysis)
10. [Keychain Analysis](#10-keychain-analysis) - 10.1 [SecItemAdd](#101-secitemadd) - 10.2 [SecItemCopyMatching](#102-secitemcopymatching) - 10.3 [Keychain Groups](#103-keychain-groups) - 10.4 [Accessibility / kSecAttrAccessible](#104-accessibility--ksecattraccessible) - 10.5 [Keychain Dumper](#105-keychain-dumper)
11. Data Sto[rage Analysis](#11-data-storage-analysis) - 11.1 [NSUserDefaults](#111-nsuserdefaults) - 11.2 [CoreData](#112-coredata) - 11.3 [SQLite](#113-sqlite) - 11.4 [Realm](#114-realm) - 11.5 [Couchbase Lite](#115-couchbase-lite) - 11.6 [File Protection Classes](#116-file-protection-classes) - 11.7 [cache.db](#117-cachedb) - 11.8 [Snapshots](#118-snapshots)
12. [vulnerabilidades Comunes en iOS](#12-vulnerabilidades-comunes-en-ios) - 12.1 [Insecure Data Storage](#121-insecure-data-storage) - 12.2 [Improper SSL Verification](#122-improper-ssl-verification) - 12.3 [Client-Side Injection](#123-client-side-injection) - 12.4 [Insecure Authentication](#124-insecure-authentication) - 12.5 [Session Handling](#125-session-handling) - 12.6 [Side-Channel Data Leakage](#126-side-channel-data-leakage) - 12.7 [Binary Analysis](#127-binary-analysis)
13. [Herramientas](#13-herramientas) - 13.1 [Frida](#131-frida) - 13.2 [Objection](#132-objection) - 13.3 [idb](#133-idb) - 13.4 [libimobiledevice](#134-libimobiledevice) - 13.5 [ios-deploy](#135-ios-deploy) - 13.6 [Hopper / Ghidra](#136-hopper--ghidra) - 13.7 [class-dump](#137-class-dump) - 13.8 [nm / otool / ldid](#138-nm--otool--ldid)
14. [Ejercicios Prácticos](#14-ejercicios-prácticos)

---

## 1. Introducción al pentesting en [ios](../raw/10s-p3nt3st1ng.md)

El pentesting mobile en iOS es un campo especializado de la seguridad informática. A diferencia de [android](../raw/4db-d33p-d1v3.md), iOS tiene un ecosistema cerrado que presenta desafíos únicos para los testers de penetración.

### Por qué [ios pentesting](../raw/10s-p3nt3st1ng.md) es diferente

1. **Ecosistema cerrado:** No podés instalar cualquier cosa como en Android — necesitás [jailbreak](../raw/41-h4ck1ng.md#jailbreak) o certificados de desarrollador
2. **Sandbox estricto:** Cada app corre en su propio sandbox sin acceso a otras apps
3. **Code signing obligatorio:** Solo código firmado por Apple puede ejecutarse
4. **App Store review:** Las apps pasan por revisión antes de publicarse
5. **Fragmentation mínima:** Pocos dispositivos y versiones comparado con Android
6. **Secure Enclave:** Hardware dedicado para operaciones criptográficas

### Qué necesitás para empezar

```
HARDWARE: - Mac (para compilar, firmar, y usar herramientas) - iPhone/iPad con jailbreak (preferiblemente) - Cable USB (preferiblemente original)

SOFTWARE: - Xcode (desde Mac App Store) - Homebrew (gestor de paquetes para Mac) - Frida (herramienta principal) - Objection (framework sobre Frida) - libimobiledevice (utilidades iOS) - Burp Suite (proxy HTTP) - Hopper/Ghidra (binary analysis)

CONOCIMIENTOS: - Objective-C / Swift (leer código) - ARM64 assembly (básico) - iOS runtime - Frida scripting (JavaScript)
```

### Flujo de trabajo típico

```
1. OBTENER LA APP: - Descargar IPA desde App Store - Extraer IPA del dispositivo - O recibir IPA del cliente

2. ANÁLISIS ESTÁTICO: - Descomprimir IPA - Analizar Info.plist - Verificar entitlements - Analizar binario Mach-O - Buscar strings sensibles

3. ANÁLISIS DINÁMICO: - Instalar app en dispositivo - Configurar proxy (Burp) - Analizar tráfico HTTP/HTTPS - Hookear con Frida - Modificar runtime behavior

4. DATA STORAGE: - Analizar NSUserDefaults - Analizar CoreData/SQLite - Analizar Keychain - Buscar archivos de caché

5. REPORTE: - Documentar vulnerabilidades - Incluir PoC con Frida - Proponer remediaciones
```

## 2. Arquitectura de Seguridad de [ios](../raw/10s-p3nt3st1ng.md)

### 2.1 Sandbox

Cada app en iOS corre en su propio sandbox — un entorno aislado que limita lo que la app puede hacer.

**Qué limita el sandbox:**

```
1. SISTEMA DE ARCHIVOS: - Solo puede acceder a su propio directorio (AppName.app/) - No puede leer archivos de otras apps - Acceso limitado a rutas del sistema

2. RED: - Socket networking permitido (pero con restricciones) - No puede hacer port scanning de otros dispositivos

3. HARDWARE: - Cámara, micrófono, GPS con permiso del usuario - Contactos, fotos, calendario con permiso

4. PROCESOS: - No puede ver otros procesos - No puede interactuar con otras apps - Comunicación limitada (URL schemes, UIPasteboard)
```

**Directorios del sandbox:**

```
AppName.app/ -> Bundle de la app (solo lectura)
Documents/ -> Datos de usuario (backupeados por iTunes)
Library/ -> Preferencias, cachés Caches/ -> Archivos de caché (no backupeados) Preferences/ -> NSUserDefaults
tmp/ -> Archivos temporales (se borran periódicamente)
```

### 2.2 Code Signing

Todo el código que se ejecuta en iOS debe estar firmado por Apple o una entidad de confianza.

**Tipos de firmas:**

```
1. APP STORE: - Firmado por Apple con el certificado del desarrollador - Solo apps de la App Store - Más restrictivo

2. ENTERPRISE: - Firmado por certificado de empresa - Para distribución interna - No pasa por App Store review

3. DEVELOPMENT: - Firmado con certificado de desarrollador - Para pruebas en dispositivos registrados - UDIDs limitados (100 por cuenta)

4. AD-HOC: - Similar a development - Para distribución a testers (100 UDIDs)
```

**componentes del code signing:**

```
1. CERTIFICADO: - Development o Distribution - Emitido por Apple - Vinculado a una cuenta de desarrollador

2. PROVISIONING PROFILE: - Vincula: App ID + Certificado + Dispositivos - Contiene entitlements permitidos - Expira (generalmente 1 año)

3. ENTITLEMENTS: - Permisos especiales de la app - iCloud, Push Notifications, Wallet, etc. - Firmados en el ejecutable
```

### 2.3 Entitlements

Los entitlements son [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) especiales que una app puede tener. Son parte del code signing.

**Entitlements comunes:**

```xml
<!-- Ejemplo de entitlements.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict> <key>keychain-access-groups</key> <array> <string>ABCDEF123.*</string> </array> <key>get-task-allow</key> <true/> <key>com.apple.security.application-groups</key> <array> <string>group.com.ejemplo.app</string> </array> <key>aps-environment</key> <string>production</string> <key>com.apple.developer.associated-domains</key> <array> <string>applinks:ejemplo.com</string> </array>
</dict>
</plist>
```

**Entitlements relevantes para pentesting:**

```
get-task-allow -> Permite debuggeo (debugserver)
com.apple.security.exception.files.absolute-path.read-only -> Acceso a rutas absolutas
com.apple.private.* -> Acceso a APIs privadas (solo apps de Apple)
keychain-access-groups  -> Grupos de keychain compartidos
aps-environment -> Push notifications
com.apple.developer.ubiquity-kvstore-identifier -> iCloud Key-Value storage
```

### 2.4 Provisioning Profiles

Los provisioning profiles son archivos que vinculan un App ID, certificados, y dispositivos.

**Estructura de un provisioning profile:**

```
1. AppID Name: Nombre del App ID
2. AppID Prefix: Team ID
3. AppID Identifier: Bundle ID (com.ejemplo.app)
4. Developer Certificates: Certificados permitidos
5. Provisioned Devices: UDIDs (development/ad-hoc)
6. Entitlements: Permisos de la app
7. Creation Date: Fecha de creación
8. Expiration Date: Fecha de expiración
```

**Ubicación de provisioning profiles:**

```bash
# En Mac
~/Library/MobileDevice/Provisioning Profiles/

# En iOS
/var/MobileDevice/Provisioning Profiles/
```

**Analizar un provisioning profile:**

```bash
# Convertir de .mobileprovision a XML
security cms -D -i profile.mobileprovision

# Extraer entitlements
security cms -D -i profile.mobileprovision | \ plutil -extract Entitlements xml1 -o - -
```

### 2.5 Keychain

El keychain de iOS es un almacenamiento seguro para datos sensibles como passwords, tokens, y llaves criptográficas.

**Características del keychain:**

```
- Cifrado con hardware (Secure Enclave)
- Acceso controlado por entitlements (keychain-access-groups)
- Datos persistentes incluso después de desinstalar la app
- Protección por nivel (accessible flags)
- Cada app solo accede a sus propios items (por defecto)
- Compartido entre apps del mismo desarrollador con keychain groups
```

**Servicios keychain (kSecClass):**

```
kSecClassGenericPassword -> Passwords genéricos
kSecClassInternetPassword  -> Passwords de Internet
kSecClassCertificate -> Certificados
kSecClassKey -> Llaves criptográficas
kSecClassIdentity -> Identidades (cert + key)
```

### 2.6 Data Protection Classes

iOS ofrece protección de datos a nivel de archivo basada en el estado del dispositivo.

**Clases de protección:**

```
1. NSFileProtectionComplete (Completa): - Archivo accesible solo cuando el dispositivo está desbloqueado - No accesible en estado bloqueado - Mayor seguridad

2. NSFileProtectionCompleteUnlessOpen (Completa a menos que esté abierto): - Archivo accesible cuando está abierto (incluso bloqueado) - Necesita desbloqueo para abrir inicialmente - Útil para archivos que necesitan escritura en background

3. NSFileProtectionCompleteUntilFirstUserAuthentication (Hasta primer login): - Accesible desde el primer desbloqueo hasta el reboot - Protegido después de reboot hasta que se desbloquee - Default para la mayoría de datos de apps

4. NSFileProtectionNone (Sin protección): - Siempre accesible - Cifrado pero la clave está siempre disponible - Menor seguridad
```

**Cómo verificar la protección de archivos:**

```bash
# En dispositivo con jailbreak
ls -al@ /var/mobile/Containers/Data/Application/UUID/Documents/
# Ver el atributo "com.apple.MobileFileProtection"

# Con Frida
frida -U -f com.ejemplo.app -l check_protection.js
```

### 2.7 Secure Enclave

La Secure Enclave es un coprocesador dedicado en chips Apple (A7+) para operaciones criptográficas seguras.

**Características:**

```
- Hardware separado del procesador principal
- Tiene su propio procesador y memoria
- No accesible directamente por iOS o apps
- Almacena Touch ID / Face ID data
- Maneja operaciones criptográficas
- Resistente a ataques físicos
```

**Qué almacena la Secure Enclave:**

```
- Touch ID templates
- Face ID data
- Llaves criptográficas (ECC, RSA)
- Llaves de cifrado del keychain
- Payment data (Apple Pay)
- Health data (en dispositivos recientes)
```

**Implicaciones para pentesting:**

```
- No podés extraer datos de la Secure Enclave directamente
- Podés intentar bypass con jailbreak (limitado)
- Face ID / Touch ID bypass es posible en algunos casos
- Las llaves del keychain están protegidas por la SE
```

## 3. [jailbreak](../raw/41-h4ck1ng.md#jailbreak)

El jailbreak es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de eliminar las restricciones de seguridad de [ios](../raw/10s-p3nt3st1ng.md) para obtener acceso root al [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos).

### 3.1 Tipos de Jailbreak

```
1. TETHERED (Atado): - Requiere conectar a computadora cada vez que se reinicia - Si se reinicia sin computadora, queda en boot loop - Raro hoy en día

2. SEMI-TETHERED (Semi-atado): - Puede bootear sin computadora pero pierde jailbreak - Necesita computadora para re-hacer jailbreak - Funcionalidades sin jailbreak siguen funcionando

3. SEMI-UNTETHERED (Semi-desatado): - Puede bootear sin computadora - El jailbreak se mantiene pero sin remount - Necesita re-ejecutar la app de jailbreak para restaurar funciones

4. UNTETHERED (Desatado): - El jailbreak es permanente incluso después de reboot - No necesita computadora - Difícil de lograr en versiones recientes
```

### 3.2 Herramientas Actuales

```
HERRAMIENTA  | iOS Versiones | Chip | Tipo
-------------|------------------|--------------|----------------
checkra1n | 12.0 - 16.x | A5-A11 | Semi-tethered
palera1n | 15.0 - 17.x | A8-A11 | Semi-tethered
Dopamine | 15.0 - 16.5.1 | A12+ | Semi-untethered
XinaA15 | 15.0 - 15.4.1 | A12-A15 | Semi-untethered
Fugu15 Max | 15.0 - 16.5 | A12+ | Semi-untethered
NeonLoader | 14.0 - 15.x | A12+ | Semi-untethered
```

### 3.3 checkra1n

checkra1n usa el bootrom [exploit](../raw/m3t4spl01t.md#exploits) "checkm8" que es inparcheable por software.

**Dispositivos compatibles:** [iphone](../raw/10s-p3nt3st1ng.md) 5s a [iphone](../raw/10s-p3nt3st1ng.md) X (A5-A11)

**Instalación:**

```bash
# En Mac
brew install checkra1n
# O descargar desde https://checkra.in

# En Linux
# checkra1n también está disponible para Linux
```

**Uso:**

```bash
# Conectar iPhone en DFU mode
1. Conectar iPhone a Mac
2. Abrir checkra1n
3. Poner iPhone en DFU mode: - Botón power 3s - Botón power + volume down 10s - Soltar power, mantener volume down 10s
4. checkra1n detecta DFU automáticamente
5. Click "Start"
6. Esperar a que termine
```

**Post-instalación:**

```bash
# Instalar Cydia / Sileo (gestor de paquetes)
# checkra1n instala Cydia automáticamente

# Paquetes recomendados para pentesting:
# - Frida
# - OpenSSH
# - Filza (file manager)
# - NewTerm 2 (terminal)
# - Core Utilities
# - adv-cmds
```

### 3.4 palera1n

palera1n es un fork/evolución de checkra1n para iOS 15+.

**Instalación:**

```bash
# En Mac/Linux
# Clonar repo
git clone --recursive https://github.com/palera1n/palera1n.git
cd palera1n

# Instalar dependencias
brew install libusb libimobiledevice

# Hacer jailbreak (fakefs mode — recomendado)
sudo ./palera1n.sh --tweaks

# O sin tweaks (solo root)
sudo ./palera1n.sh
```

**Post-palera1n:**

```bash
# Instalar Sileo (gestor de paquetes)
# Instalar Frida desde Sileo
# Configurar SSH
```

### 3.5 Dopamine

Dopamine es un jailbreak semi-untethered para A12+ en iOS 15-16.5.1.

**Características:**

```
- Semi-untethered (re-ejecutar app después de reboot)
- Soporte para A12 a A16 (M1, M2)
- iOS 15.0 a 16.5.1
- Usa KFD exploit
- Instala Sileo automáticamente
- Soporte para tweaks (ellekit, roothide)
```

**Instalación:**

```
1. Descargar Dopamine.ipa desde GitHub
2. Firmar con TrollStore (recomendado) o AltStore
3. Abrir Dopamine en el dispositivo
4. Click "Jailbreak"
5. Esperar a que termine
6. Instalar paquetes desde Sileo
```

### 3.6 XinaA15

XinaA15 es un jailbreak para A12-A15 en iOS 15.0-15.4.1.

**Características:**

```
- Semi-untethered
- Específico para A12-A15
- iOS 15.0-15.4.1
- Primer jailbreak para A15 en iOS 15
- Soportaba tweaks con sustrato
```

### 3.7 Post-Jailbreak setup

Después del jailbreak, configurá el entorno para pentesting.

```bash
# 1. Instalar Frida (desde Sileo/Cydia)
# Agregar repo: https://build.frida.re
# Buscar "Frida" e instalar

# 2. Instalar OpenSSH
# Desde Sileo buscar OpenSSH
# ssh root@localhost -p 2222 (por USB)
# Password default: alpine

# 3. Instalar herramientas útiles
# Desde Sileo:
# - Filza File Manager
# - NewTerm 2
# - Core Utilities
# - adv-cmds
# - MobileTerminal
# - iFile (legacy)
# - MTerminal
# - Preference Organizer 2

# 4. Verificar jailbreak
# En NewTerm 2:
id # Debería mostrar uid=0(root)
ls -al / # Ver sistema de archivos
dpkg -l # Listar paquetes instalados

# 5. Configurar USB tunneling
# En Mac:
brew install usbmuxd
iproxy 2222 22 # Forward USB -> TCP: localhost:2222 -> device:22
# En otra terminal:
ssh root@localhost -p 2222

# 6. Verificar Frida
frida-ps -U # Listar procesos en el dispositivo
```

## 4. Análisis de ipA

### 4.1 Estructura del IPA

Un IPA es básicamente un ZIP con una estructura específica.

**Estructura de un IPA:**

```
AppName.ipa/
├── Payload/
│ └── AppName.app/
│ ├── AppName (binary Mach-O)
│ ├── Info.plist
│ ├── embedded.mobileprovision
│ ├── Assets.car (asset catalog)
│ ├── *.nib / *.storyboardc
│ ├── *.lproj (localizations)
│ ├── Frameworks/ (dynamic frameworks)
│ ├── PlugIns/ (extensions)
│ │ ├── TodayExtension.appex
│ │ └── WatchExtension.appex
│ └── Watch/ (WatchKit)
├── iTunesArtwork
├── iTunesMetadata.plist
└── META-INF/ └── com.apple.FastPdfKit.Metadata.plist
```

**Descomprimir un IPA:**

```bash
# En Mac/Linux
unzip AppName.ipa -d AppName_extracted/

# O con herramientas específicas
# Usando Objection
objection patchipa --source AppName.ipa

# Ver estructura
ls -la AppName_extracted/Payload/
ls -la AppName_extracted/Payload/AppName.app/
```

### 4.2 Info.plist Analysis

El Info.plist contiene metadatos de la app que son críticos para pentesting.

**Keys importantes en Info.plist:**

```xml
<key>CFBundleIdentifier</key>
<string>com.ejemplo.app</string>

<key>CFBundleVersion</key>
<string>1.2.3</string>

<key>CFBundleShortVersionString</key>
<string>1.2</string>

<key>CFBundleExecutable</key>
<string>AppName</string>

<key>UIBackgroundModes</key>
<array> <string>fetch</string> <string>remote-notification</string>
</array>

<key>LSApplicationQueriesSchemes</key>
<array> <string>whatsapp</string> <string>telegram</string> <string>comgooglemaps</string>
</array>

<key>NSAppTransportSecurity</key>
<dict> <key>NSAllowsArbitraryLoads</key> <true/> <key>NSExceptionDomains</key> <dict> <key>ejemplo.com</key> <dict> <key>NSExceptionAllowsInsecureHTTPLoads</key> <true/> </dict> </dict>
</dict>

<key>CFBundleURLTypes</key>
<array> <dict> <key>CFBundleURLSchemes</key> <array> <string>myapp</string> <string>myapp-dev</string> </array> </dict>
</array>
```

**Qué buscar en Info.plist:**

```
1. NSAppTransportSecurity: - NSAllowsArbitraryLoads = true -> Todas las conexiones HTTP permitidas - NSAllowsArbitraryLoadsInWebContent = true - Mala práctica de seguridad

2. CFBundleURLTypes: - URL schemes personalizados - Potencial URL scheme hijacking

3. UIBackgroundModes: - VoIP, location, audio background - Pueden ser usados para exfiltrar datos

4. NSFaceIDUsageDescription / NSCameraUsageDescription: - Permisos solicitados - Privacidad

5. CFBundleIdentifier: - Identificador de la app - Verificar contra provisioning profile

6. MinimumOSVersion: - Versión mínima de iOS - Vulnerabilidades de versiones viejas
```

**Analizar Info.plist:**

```bash
# Ver contenido completo
plutil -p Payload/AppName.app/Info.plist

# Ver key específica
plutil -extract NSAppTransportSecurity xml1 -o - \ Payload/AppName.app/Info.plist

# Buscar strings sensibles
strings Payload/AppName.app/Info.plist | grep -i "password\|secret\|key"
```

### 4.3 Entitlements del IPA

Los entitlements definen [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) especiales de la app.

**Extraer entitlements:**

```bash
# Desde el IPA
codesign -d --entitlements :- "Payload/AppName.app/AppName"

# Desde un dispositivo (con jailbreak)
ldid -e /var/containers/Bundle/Application/UUID/AppName.app/AppName

# Con Frida
frida-ps -U -a  # Listar apps con entitlements
```

**Ejemplo de entitlements extraídos:**

```xml
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict> <key>application-identifier</key> <string>ABCDEF123.com.ejemplo.app</string> <key>com.apple.developer.associated-domains</key> <array> <string>applinks:ejemplo.com</string> <string>activitycontinuation:ejemplo.com</string> </array> <key>com.apple.developer.healthkit</key> <true/> <key>com.apple.developer.ubiquity-kvstore-identifier</key> <string>$(TeamIdentifierPrefix)$(CFBundleIdentifier)</string> <key>com.apple.security.exception.files.absolute-path.read-only</key> <array> <string>/private/var/mobile/Library/AddressBook/</string> </array> <key>get-task-allow</key> <true/> <key>keychain-access-groups</key> <array> <string>ABCDEF123.com.ejemplo.app</string> <string>ABCDEF123.com.ejemplo.app.shared</string> </array>
</dict>
</plist>
```

**Qué buscar en entitlements:**

```
1. keychain-access-groups: - Grupos de keychain compartidos - Apps del mismo desarrollador comparten keychain - Si una app tiene el mismo grupo, puede acceder a datos de otra

2. get-task-allow: - Permite debuggeo con lldb/debugserver - Presente en builds de desarrollo - NO debería estar en releases de producción

3. com.apple.developer.associated-domains: - Universal Links - Shared Web Credentials - Potencial abuso

4. com.apple.security.exception.*: - Excepciones de sandbox - Acceso a rutas del sistema - Solo apps de Apple tienen estas (generalmente)
```

### 4.4 Mach-O Binary Analysis

El binario principal de [ios](../raw/10s-p3nt3st1ng.md) es un ejecutable Mach-O (Mach Object).

**Arquitecturas Mach-O:**

```
armv7: iPhone 3GS-5 (32-bit)
armv7s: iPhone 5 (32-bit)
arm64: iPhone 5S+ (64-bit)
arm64e: iPhone XS/XR+ (64-bit con ARMv8.3)
```

**Analizar el binario:**

```bash
# Tipo de archivo
file Payload/AppName.app/AppName
# Salida: Mach-O 64-bit executable arm64

# Arquitecturas soportadas
lipo -info Payload/AppName.app/AppName
# Salida: Architectures in the fat file: armv7 arm64

# Listar symbols
nm Payload/AppName.app/AppName | head -50

# Listar Objective-C classes
class-dump Payload/AppName.app/AppName

# Listar imports/links
otool -L Payload/AppName.app/AppName

# Ver segmentos
otool -l Payload/AppName.app/AppName | head -100

# Ver sección de texto (código)
otool -tV Payload/AppName.app/AppName | head -100

# Strings del binario
strings Payload/AppName.app/AppName | grep -i "password\|api_key\|secret\|token\|https://"
```

**Segmentos Mach-O importantes:**

```
__TEXT: __text: Código ejecutable __const: Constantes __cstring: Strings C __objc_methname: Objective-C method names

__DATA: __data: Datos inicializados __bss: Datos no inicializados __objc_classlist: Lista de Objective-C classes __objc_protolist: Protocolos __cfstring: CFString references

__LINKEDIT: Información de linking (bind, rebase, lazy_symbols)
```

**Frameworks y libraries:**

```bash
# Ver frameworks linked
otool -L Payload/AppName.app/AppName

# Frameworks comunes que indican funcionalidad:
# - Security.framework -> Keychain operations
# - CFNetwork.framework -> Networking
# - SystemConfiguration.framework -> Network reachability
# - LocalAuthentication.framework -> Touch/Face ID
# - CoreData.framework -> CoreData storage
# - SQLite3.dylib -> SQLite database
# - libcrypto.dylib / libssl.dylib -> OpenSSL
```

### 4.5 CodeSign Inspection

Verificar cómo está firmado el binario.

**Verificar firma:**

```bash
# Ver firma del app bundle
codesign -dvvv Payload/AppName.app/

# Verificar integridad
codesign --verify Payload/AppName.app/

# Ver entitlements
codesign -d --entitlements :- Payload/AppName.app/AppName

# Ver información del certificado
codesign -d -vvv Payload/AppName.app/AppName 2>&1 | grep Authority
# Salida:
# Authority=Apple Distribution: Company Name
# Authority=Apple Worldwide Developer Relations Certification Authority
# Authority=Apple Root CA
```

**Verificar provisioning profile:**

```bash
# Extraer y analizar
security cms -D -i Payload/AppName.app/embedded.mobileprovision

# Ver fecha de expiración
security cms -D -i Payload/AppName.app/embedded.mobileprovision | \ grep -A1 ExpirationDate

# Ver dispositivos permitidos (development)
security cms -D -i Payload/AppName.app/embedded.mobileprovision | \ grep -A100 ProvisionedDevices | head -20
```

**Resigning (re-firmar para instalar en dispositivo propio):**

```bash
# 1. Generar certificado de desarrollo en Xcode
# 2. Extraer entitlements del IPA original
codesign -d --entitlements :- Payload/AppName.app/AppName > entitlements.plist

# 3. Re-firmar frameworks (si hay)
for f in Payload/AppName.app/Frameworks/*.framework; do codesign -f -s "iPhone Developer: Name (TEAMID)" "$f"
done

# 4. Re-firmar app
codesign -f -s "iPhone Developer: Name (TEAMID)" \ --entitlements entitlements.plist Payload/AppName.app/

# 5. Re-empaquetar IPA
cd Payload && zip -r ./AppName_resigned.ipa AppName.app/

# 6. Instalar
ios-deploy -b AppName_resigned.ipa
```

## 5. [frida](../raw/4pk-r3v3rs1ng.md#frida) para [ios](../raw/10s-p3nt3st1ng.md)

Frida es la herramienta más importante para pentesting dinámico en iOS. Permite injectar scripts JavaScript en procesos en ejecución para hookear funcioniones)es, modificar comportamiento, y extraer datos.

### 5.1 Instalación de Frida

**En Mac (host):**

```bash
# Usando pip
pip install frida-tools

# Verificar instalación
frida --version

# Usando Homebrew
brew install frida
```

**En [iphone](../raw/10s-p3nt3st1ng.md) (dispositivo):**

```bash
# Opción 1: Desde Cydia/Sileo
# Agregar repo: https://build.frida.re
# Buscar "Frida" e instalar

# Opción 2: Manual (SSH)
# Conectar por SSH
ssh root@localhost -p 2222

# Descargar e instalar deb
wget https://build.frida.re/frida_16.x.iphoneos-arm.deb
dpkg -i frida_16.x.iphoneos-arm.deb

# Opción 3: Con palera1n script
./palera1n.sh --frida

# Verificar que Frida está corriendo
frida-ps -U
```

**Verificar conexión:**

```bash
# Listar dispositivos
frida-ls-devices

# Listar procesos (USB)
frida-ps -U

# Listar procesos con nombres de aplicación
frida-ps -U -a

# Probar conexión
frida -U com.apple.mobilesafari
```

### 5.2 frida-ps -U

Lista procesos en el dispositivo conectado por USB.

```bash
# Listar todos los procesos
frida-ps -U

# Listar solo aplicaciones (frontmost)
frida-ps -U -a

# Listar con identificadores
frida-ps -U -i

# JSON output (para scripting)
frida-ps -U -j

# Filtrar por nombre
frida-ps -U | grep -i whatsapp

# Ejemplo de salida:
# PID  Name
# ---  ----
# 123  MobileSafari
# 456  SpringBoard
# 789  whatsapp
```

### 5.3 frida-trace

frida-trace permite trackear llamadas a funciones específicas sin escribir scripts.

```bash
# Trackear todas las funciones Objective-C de una clase
frida-trace -U com.ejemplo.app -m "*[NSURLConnection*]"

# Trackear funciones específicas
frida-trace -U com.ejemplo.app -m "+[NSURLConnection sendAsynchronousRequest:queue:completionHandler:]"

# Trackear métodos con wildcards
frida-trace -U com.ejemplo.app -m "*[CryptoManager *]"
frida-trace -U com.ejemplo.app -m "*[* loadImage:*]"

# Trackear funciones C
frida-trace -U com.ejemplo.app -i "strcmp"
frida-trace -U com.ejemplo.app -i "fopen"

# Trackear módulos específicos
frida-trace -U com.ejemplo.app -I "libcommon.dylib"

# Guardar output a archivo
frida-trace -U com.ejemplo.app -m "*[* login*]" -o login_trace.txt
```

**Ejemplo práctico:**

```bash
# Trackear conexiones de red
frida-trace -U com.ejemplo.app \ -m "*[NSURLSession dataTaskWithURL:*]" \ -m "*[NSURLSession dataTaskWithRequest:*]" \ -m "*[NSMutableURLRequest *]"

# Trackear keychain operations
frida-trace -U com.ejemplo.app \ -m "*[SSKeychain *]" \ -m "*[UICKeyChainStore *]"

# Trackear UI alerts
frida-trace -U com.ejemplo.app \ -m "*[UIAlertView *]" \ -m "*[UIAlertController *]"
```

**Handlers generados:**

frida-trace genera handlers JavaScript que podés modificar:

```javascript
// __handlers__/NSURLConnection/NSURLConnection.js
{ onEnter(log, args, state) { log('[+] NSURLConnection - sendAsynchronousRequest'); log('  Request: ' + ObjC.Object(args[2]); }, onLeave(log, retval, state) { log('[+] NSURLConnection - done'); }
}
```

### 5.4 frida-ls-devices

Lista los dispositivos disponibles para conexión.

```bash
# Listar todos los dispositivos
frida-ls-devices

# Salida típica:
# Id Type Name
# -- ---- ----
# local local Local System
# 1234567890abcdef usb iPhone de Octavio
# 100.100.100.100:27042 remote  iPad de Test

# Conectar a dispositivo específico
frida -D 1234567890abcdef com.ejemplo.app

# Conectar por IP (remoto)
frida -H 100.100.100.100:27042 com.ejemplo.app
```

### 5.5 Objective-C Hooks

Hookear métodos Objective-C en tiempo real.

**Hook básico:**

```javascript
// Hookear un método de instancia
if (ObjC.available) { var className = "NSString"; var methodName = "- stringByAppendingString:"; var hook = ObjC.classes[className][methodName]; Interceptor.attach(hook.implementation, { onEnter: function(args) { console.log("[+] NSString.stringByAppendingString:"); console.log("  self: " + ObjC.Object(args[0]); console.log("  arg: " + ObjC.Object(args[2]); }, onLeave: function(retval) { console.log("  return: " + ObjC.Object(retval); } });
}
```

**Hook de clase (métodos de clase):**

```javascript
// Hookear método de clase (+)
if (ObjC.available) { var className = "MySecretManager"; var methodName = "+ sharedInstance"; var hook = ObjC.classes[className][methodName]; Interceptor.attach(hook.implementation, { onLeave: function(retval) { console.log("[+] MySecretManager.sharedInstance returned: " + ObjC.Object(retval); } });
}
```

**Hook con wildcards (buscar clases):**

```javascript
// Encontrar todas las clases que implementan un método
if (ObjC.available) { var classes = ObjC.enumerateLoadedClasses; classes.forEach(function(className) { try { var clazz = ObjC.classes[className]; if (clazz && clazz["- loginWithUsername:password:"]) { console.log("Found login method in: " + className); var method = clazz["- loginWithUsername:password:"]; Interceptor.attach(method.implementation, { onEnter: function(args) { console.log("[+] Login called in " + className); console.log("  Username: " + ObjC.Object(args[2]); console.log("  Password: " + ObjC.Object(args[3]); } }); } } catch(e) {} });
}
```

**Hookear todas las funciones de una clase:**

```javascript
if (ObjC.available) { var className = "NetworkingManager"; var methods = ObjC.classes[className].$methods; methods.forEach(function(methodName) { try { var method = ObjC.classes[className][methodName]; Interceptor.attach(method.implementation, { onEnter: function(args) { console.log("[+] " + className + " " + methodName); for (var i = 2; i < args.length; i++) { try { console.log("  arg[" + (i-2) + "]: " + ObjC.Object(args[i]); } catch(e) { console.log("  arg[" + (i-2) + "]: " + args[i]); } } } }); } catch(e) {} });
}
```

### 5.6 Method Replacement

Reemplazar completamente la implementación de un método.

```javascript
// Reemplazar un método
if (ObjC.available) { var className = "AuthenticationManager"; var methodName = "- isAuthenticated"; try { var method = ObjC.classes[className][methodName]; // Guardar implementación original var origImpl = method.implementation; // Reemplazar method.implementation = ObjC.implement(method, function(self, sel) { console.log("[+] AuthenticationManager.isAuthenticated called"); console.log("  Forzando return true"); return 1; // TRUE en Objective-C }); } catch(e) { console.log("Error: " + e.message); }
}
```

**Reemplazar con llamada a original:**

```javascript
if (ObjC.available) { var className = "PremiumManager"; var methodName = "- hasPremiumAccess"; var method = ObjC.classes[className][methodName]; Interceptor.attach(method.implementation, { onLeave: function(retval) { console.log("[+] PremiumManager.hasPremiumAccess"); console.log("  Original: " + retval); console.log("  Forzando: true"); retval.replace(ptr(1); // Reemplazar return value } });
}
```

### 5.7 Argument Modification

Modificar argumentos de funciones en tiempo real.

```javascript
// Modificar argumentos de red
if (ObjC.available) { var className = "NSMutableURLRequest"; var methodName = "- setValue:forHTTPHeaderField:"; var method = ObjC.classes[className][methodName]; Interceptor.attach(method.implementation, { onEnter: function(args) { var value = ObjC.Object(args[2]); var field = ObjC.Object(args[3]); console.log("[+] Header set: " + field + " = " + value); // Modificar User-Agent if (field.toString === "User-Agent") { var newUA = ObjC.classes.NSString.stringWithString_( "CustomUserAgent/1.0" ); args[2] = newUA; console.log("  Modified User-Agent to: CustomUserAgent/1.0"); } // Modificar Authorization header if (field.toString === "Authorization") { var newToken = ObjC.classes.NSString.stringWithString_( "Bearer stolen_token_here" ); args[2] = newToken; console.log("  Modified Authorization token!"); } } });
}
```

**Modificar parámetros de login:**

```javascript
if (ObjC.available) { var className = "LoginViewController"; var methodName = "- loginWithUsername:password:completion:"; var method = ObjC.classes[className][methodName]; Interceptor.attach(method.implementation, { onEnter: function(args) { var username = ObjC.Object(args[2]); var password = ObjC.Object(args[3]); console.log("[+] Login attempt"); console.log("  Original Username: " + username); console.log("  Original Password: " + password); // Modificar username var newUser = ObjC.classes.NSString.stringWithString_( "admin@ejemplo.com" ); args[2] = newUser; // Modificar password var newPass = ObjC.classes.NSString.stringWithString_( "admin123!" ); args[3] = newPass; console.log("  Modified to: " + newUser + " / " + newPass); } });
}
```

### 5.8 Return Value Override

Modificar valores de retorno de funciones.

```javascript
// Bypass de jailbreak detection
if (ObjC.available) { var jailbreakDetectionClasses = [ "JailbreakDetection", "SecurityManager", "AntiTamperingManager", "JBCheck" ]; jailbreakDetectionClasses.forEach(function(className) { try { var clazz = ObjC.classes[className]; if (clazz) { console.log("[+] Found jailbreak detection class: " + className); var methods = clazz.$methods; methods.forEach(function(methodName) { if (methodName.toLowerCase.includes("jail") || methodName.toLowerCase.includes("root") || methodName.toLowerCase.includes("tamper") || methodName.toLowerCase.includes("secure") { try { var method = clazz[methodName]; Interceptor.attach(method.implementation, { onLeave: function(retval) { console.log("  Bypassing: " + methodName); console.log("  Original return: " + retval); retval.replace(ptr(0); // Forzar return NO/FALSE console.log("  Modified return: 0 (false)"); } }); } catch(e) {} } }); } } catch(e) {} });
}
```

**Override de verificaciones de licencia:**

```javascript
if (ObjC.available) { var className = "LicenseValidator"; var methods = [ "- validateLicense", "- isLicenseValid", "- hasValidSubscription", "- verifyReceipt", "- checkExpiration" ]; methods.forEach(function(methodName) { try { var method = ObjC.classes[className][methodName]; if (method) { Interceptor.attach(method.implementation, { onLeave: function(retval) { console.log("[+] Bypassing " + methodName); retval.replace(ptr(1); // Forzar true } }); console.log("[+] Hooked: " + className + " " + methodName); } } catch(e) {} });
}
```

## 6. [frida](../raw/4pk-r3v3rs1ng.md#frida) Scripts para [ios](../raw/10s-p3nt3st1ng.md)

### 6.1 Bypass de [jailbreak](../raw/41-h4ck1ng.md#jailbreak) Detection

El bypass de jailbreak detection es probablemente el script más común en ios [pentesting](./raw/10s

**Script completo de bypass:**

```javascript
// frida-jailbreak-bypass.js
// Bypass genérico de jailbreak detection

if (ObjC.available) { console.log("[*] Starting jailbreak bypass.."); // ========== MÉTODO 1: Archivos de jailbreak ========== var fm = ObjC.classes.NSFileManager.defaultManager; var jailbreakFiles = [ "/Applications/Cydia.app", "/Applications/Sileo.app", "/Applications/Zebra.app", "/Library/MobileSubstrate", "/bin/bash", "/usr/sbin/sshd", "/etc/apt", "/private/var/lib/apt/", "/private/var/stash", "/private/var/tmp/cydia.log", "/var/cache/apt", "/var/lib/cydia", "/tmp/.ujailbreak" ]; // Hookear fileExistsAtPath var fileExists = fm["- fileExistsAtPath:"]; Interceptor.attach(fileExists.implementation, { onLeave: function(retval) { var path = ObjC.Object(this.arg2); if (path) { var pathStr = path.toString; for (var i = 0; i < jailbreakFiles.length; i++) { if (pathStr === jailbreakFiles[i]) { console.log("[BYPASS] fileExistsAtPath: " + pathStr + " -> false"); retval.replace(ptr(0); return; } } } } }); // ========== MÉTODO 2: NSProcessInfo ========== try { var processInfo = ObjC.classes.NSProcessInfo; if (processInfo["- isLowPowerModeEnabled"]) { var lowPower = processInfo["- isLowPowerModeEnabled"]; Interceptor.attach(lowPower.implementation, { onLeave: function(retval) { // Algunas apps usan esto para jailbreak detection } }); } } catch(e) {} // ========== MÉTODO 3: fork/exec/system ========== var c_fork = Module.findExportByName(null, "fork"); if (c_fork) { Interceptor.attach(c_fork, { onLeave: function(retval) { // fork retorna -1 en sandbox, 0 en hijo, PID en padre // Algunas apps detectan jailbreak si fork funciona } }); } // ========== MÉTODO 4: URL Schemes de Cydia ========== try { var app = ObjC.classes.UIApplication.sharedApplication; var canOpen = app["- canOpenURL:"]; Interceptor.attach(canOpen.implementation, { onLeave: function(retval) { var url = ObjC.Object(this.arg2); if (url) { var urlStr = url.toString; if (urlStr.indexOf("cydia://") >= 0) { console.log("[BYPASS] canOpenURL cydia -> false"); retval.replace(ptr(0); } } } }); } catch(e) {} // ========== MÉTODO 5: dlsym de símbolos sospechosos ========== var dlsym = Module.findExportByName(null, "dlsym"); if (dlsym) { Interceptor.attach(dlsym, { onEnter: function(args) { var symName = args[1].readCString; if (symName) { if (symName.indexOf("MSHook") >= 0 || symName.indexOf("Substrate") >= 0 || symName.indexOf("MobileSubstrate") >= 0) { console.log("[BYPASS] dlsym blocked: " + symName); this.handled = true; } } }, onLeave: function(retval) { if (this.handled) { retval.replace(ptr(0); } } }); } console.log("[*] Jailbreak bypass loaded!");
}
```

**Uso del script:**

```bash
# Ejecutar bypass al iniciar la app
frida -U -f com.ejemplo.app -l frida-jailbreak-bypass.js --no-pause

# O attach a app ya corriendo
frida -U com.ejemplo.app -l frida-jailbreak-bypass.js
```

### 6.2 [SSL](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) Pinning Bypass

Bypass de SSL pinning para interceptar tráfico HTTPS.

**Script de bypass SSL pinning:**

```javascript
// frida-ssl-bypass.js
// Bypass de SSL pinning para iOS

if (ObjC.available) { console.log("[*] Loading SSL Pinning bypass.."); // ========== NSURLSession ========== try { var delegateClass = ObjC.classes["__NSCFURLSessionDelegate"]; if (delegateClass) { // Hookear didReceiveChallenge var methods = delegateClass.$methods; methods.forEach(function(m) { if (m.indexOf("didReceiveChallenge") >= 0) { var method = delegateClass[m]; Interceptor.attach(method.implementation, { onLeave: function(retval) { console.log("[SSL] NSURLSession challenge bypassed"); // Forzar accept server trust } }); } }); } } catch(e) { console.log("[SSL] NSURLSession bypass failed: " + e); } // ========== AFNetworking (muy común) ========== try { var afManager = ObjC.classes["AFSecurityPolicy"]; if (afManager) { console.log("[SSL] Found AFSecurityPolicy"); // Hookear validatesDomainName var validatesDomain = afManager["- setValidatesDomainName:"]; if (validatesDomain) { Interceptor.attach(validatesDomain.implementation, { onEnter: function(args) { console.log("[SSL] AFSecurityPolicy.setValidatesDomainName: false"); args[2] = ptr(0); // false } }); } // Hookear pinnedCertificates var pinnedCerts = afManager["- setPinnedCertificates:"]; if (pinnedCerts) { Interceptor.attach(pinnedCerts.implementation, { onEnter: function(args) { console.log("[SSL] Blocking pinned certificates"); var emptySet = ObjC.classes.NSSet.alloc.init; args[2] = emptySet; } }); } // Hookear allowInvalidCertificates var allowInvalid = afManager["- setAllowInvalidCertificates:"]; if (allowInvalid) { Interceptor.attach(allowInvalid.implementation, { onEnter: function(args) { console.log("[SSL] Forcing allowInvalidCertificates: true"); args[2] = ptr(1); // true } }); } // Reemplazar evaluateServerTrust var evaluateTrust = afManager["- evaluateServerTrust:forDomain:"]; if (evaluateTrust) { Interceptor.attach(evaluateTrust.implementation, { onLeave: function(retval) { console.log("[SSL] AFSecurityPolicy.evaluateServerTrust: true"); retval.replace(ptr(1); // Forzar true } }); } } } catch(e) { console.log("[SSL] AFNetworking bypass failed: " + e); } // ========== Alamofire ========== try { var alamofireManager = ObjC.classes["SessionDelegate"]; if (alamofireManager) { console.log("[SSL] Found Alamofire SessionDelegate"); // Similar a NSURLSession bypass } } catch(e) {} // ========== URLSession: swizzle canAuthenticateAgainstProtectionSpace ========== try { ObjC.enumerateLoadedClasses.forEach(function(className) { if (className.indexOf("URLSession") >= 0 || className.indexOf("Connection") >= 0) { var clazz = ObjC.classes[className]; if (clazz["- connection:willSendRequestForAuthenticationChallenge:"]) { var method = clazz["- connection:willSendRequestForAuthenticationChallenge:"]; Interceptor.attach(method.implementation, { onEnter: function(args) { console.log("[SSL] Bypassing auth challenge for: " + className); } }); } } }); } catch(e) {} console.log("[*] SSL Pinning bypass loaded!");
}
```

### 6.3 Keychain Dump

Extraer datos del keychain.

```javascript
// frida-keychain-dump.js
// Dump del keychain usando Frida

if (ObjC.available) { console.log("[*] Dumping Keychain.."); // Método 1: Usar SecItemCopyMatching para listar todos los items try { var SecItemCopyMatching = new NativeFunction( Module.findExportByName("Security", "SecItemCopyMatching"), "int", ["pointer", "pointer"] ); // Query para traer todos los passwords genéricos var query = ObjC.classes.NSMutableDictionary.alloc.init; query.setObject_forKey_( ObjC.classes.NSString.stringWithString_("genp"), ObjC.classes.NSString.stringWithString_("class") ); query.setObject_forKey_( ptr(1), // kSecMatchLimitAll ObjC.classes.NSString.stringWithString_("m_Limit") ); query.setObject_forKey_( ObjC.classes.NSString.stringWithString_("true"), ObjC.classes.NSString.stringWithString_("r_Data") ); query.setObject_forKey_( ObjC.classes.NSString.stringWithString_("true"), ObjC.classes.NSString.stringWithString_("r_Attributes") ); var resultRef = Memory.alloc(Process.pointerSize); var status = SecItemCopyMatching(query, resultRef); if (status === 0) { // errSecSuccess var result = ObjC.Object(resultRef.readPointer); if (result) { console.log("[KEYCHAIN] Found items:"); result.forEach(function(item) { try { var acct = item.objectForKey_( ObjC.classes.NSString.stringWithString_("acct") ); var data = item.objectForKey_( ObjC.classes.NSString.stringWithString_("v_Data") ); var svce = item.objectForKey_( ObjC.classes.NSString.stringWithString_("svce") ); console.log("  Service: " + (svce || "unknown"); console.log("  Account: " + (acct || "unknown"); if (data) { var decoded = ObjC.classes.NSString.alloc.initWithData_encoding_( data, 4 // NSUTF8StringEncoding ); console.log("  Data: " + (decoded || "binary data"); } console.log("  ---"); } catch(e) { console.log("  Error parsing item: " + e); } }); } } else { console.log("[KEYCHAIN] No items found or error: " + status); } } catch(e) { console.log("[KEYCHAIN] SecItemCopyMatching failed: " + e); } // Método 2: Hookear SecItemAdd para capturar nuevos items try { var SecItemAdd = Module.findExportByName("Security", "SecItemAdd"); if (SecItemAdd) { Interceptor.attach(SecItemAdd, { onEnter: function(args) { console.log("[KEYCHAIN] SecItemAdd called"); var dict = ObjC.Object(args[0]); if (dict) { console.log("  Attributes: " + dict.toString); } } }); } } catch(e) {} // Método 3: Hookear SecItemCopyMatching para capturar queries try { var SecItemCopyMatching_hook = Module.findExportByName( "Security", "SecItemCopyMatching" ); if (SecItemCopyMatching_hook) { Interceptor.attach(SecItemCopyMatching_hook, { onEnter: function(args) { var query = ObjC.Object(args[0]); if (query) { console.log("[KEYCHAIN] SecItemCopyMatching query:"); console.log("  " + query.toString); } }, onLeave: function(retval) { if (retval === 0) { // errSecSuccess var result = ObjC.Object(this.arg1.readPointer); if (result) { console.log("[KEYCHAIN] Query result:"); console.log("  " + result.toString); } } } }); } } catch(e) {} console.log("[*] Keychain dump complete!");
}
```

### 6.4 UI Manipulation

Modificar la interfaz de usuario de la app.

```javascript
// frida-ui-manipulation.js
// Manipulación de la UI de la app

if (ObjC.available) { console.log("[*] UI Manipulation loaded"); // ========== Mostrar campos ocultos ========== try { var textField = ObjC.classes.UITextField; // Revelar texto de passwords var setSecure = textField["- setSecureTextEntry:"]; if (setSecure) { Interceptor.attach(setSecure.implementation, { onEnter: function(args) { console.log("[UI] Blocking secureTextEntry"); args[2] = ptr(0); // false } }); } // Mostrar texto oculto var textFieldDelegate = textField["- textField:shouldChangeCharactersInRange:replacementString:"]; if (textFieldDelegate) { Interceptor.attach(textFieldDelegate.implementation, { onEnter: function(args) { var text = ObjC.Object(args[4]); if (text) { console.log("[UI] Text input: " + text); } } }); } } catch(e) {} // ========== Desbloquear controles deshabilitados ========== try { var control = ObjC.classes.UIControl; var setEnabled = control["- setEnabled:"]; if (setEnabled) { Interceptor.attach(setEnabled.implementation, { onEnter: function(args) { console.log("[UI] Control disabled, enabling.."); args[2] = ptr(1); // true } }); } var setUserInteractionEnabled = control["- setUserInteractionEnabled:"]; if (setUserInteractionEnabled) { Interceptor.attach(setUserInteractionEnabled.implementation, { onEnter: function(args) { console.log("[UI] UserInteraction disabled, enabling.."); args[2] = ptr(1); // true } }); } } catch(e) {} // ========== Mostrar alerts ocultos ========== try { var alert = ObjC.classes.UIAlertView; if (alert) { var showAlert = alert["- show"]; if (showAlert) { Interceptor.attach(showAlert.implementation, { onEnter: function(args) { var self = ObjC.Object(args[0]); if (self) { console.log("[UI] Alert shown:"); console.log("  Title: " + self.title); console.log("  Message: " + self.message); } } }); } } } catch(e) {} // ========== Log de ViewControllers ========== try { var vc = ObjC.classes.UIViewController; var viewDidLoad = vc["- viewDidLoad"]; if (viewDidLoad) { Interceptor.attach(viewDidLoad.implementation, { onEnter: function(args) { var self = ObjC.Object(args[0]); if (self) { console.log("[UI] ViewController loaded: " + self.$className); } } }); } var viewDidAppear = vc["- viewDidAppear:"]; if (viewDidAppear) { Interceptor.attach(viewDidAppear.implementation, { onEnter: function(args) { var self = ObjC.Object(args[0]); if (self) { console.log("[UI] ViewController appeared: " + self.$className); } } }); } } catch(e) {}
}
```

### 6.5 Class-Dump con Frida

Extraer información de clases sin necesidad de class-dump.

```javascript
// frida-class-dump.js
// Class dump usando Frida

function dumpClass(className) { try { var clazz = ObjC.classes[className]; if (!clazz) return; console.log("=== " + className + " ==="); console.log("Superclass: " + clazz.$superClass); // Properties var properties = clazz.$properties; if (properties && properties.length > 0) { console.log("\nProperties:"); properties.forEach(function(prop) { console.log("  @property " + prop); }); } // Methods (instance) var methods = clazz.$methods; if (methods && methods.length > 0) { console.log("\nInstance Methods:"); methods.forEach(function(method) { if (method.indexOf("-") === 0) { console.log("  " + method); } }); } // Methods (class) console.log("\nClass Methods:"); methods.forEach(function(method) { if (method.indexOf("+") === 0) { console.log("  " + method); } }); // Protocols var protocols = clazz.$protocols; if (protocols && protocols.length > 0) { console.log("\nProtocols:"); protocols.forEach(function(proto) { console.log("  " + proto); }); } console.log(""); } catch(e) { console.log("Error dumping " + className + ": " + e); }
}

function dumpAllClasses { console.log("[*] Dumping all classes..\n"); var classes = ObjC.enumerateLoadedClasses; classes.forEach(function(className) { // Solo clases de la app (no del sistema) if (className.indexOf("UI") !== 0 && className.indexOf("NS") !== 0 && className.indexOf("_") !== 0 && className.indexOf("WK") !== 0 && className.indexOf("AV") !== 0 && className.indexOf("CA") !== 0) { dumpClass(className); } });
}

// Dump de una clase específica
function dumpSpecificClass(className) { console.log("[*] Dumping specific class: " + className); dumpClass(className);
}

// Export functions
// dumpAllClasses;
// dumpSpecificClass("AuthenticationManager");

// Uso: Descomentar la que quieras
dumpAllClasses;
```

## 7. Objection para [ios](../raw/10s-p3nt3st1ng.md)

Objection es un framework de pentesting mobile runtime construido sobre [frida](../raw/4pk-r3v3rs1ng.md#frida). Permite hacer muchas tareas sin escribir scripts.

### 7.1 Instalación de Objection

```bash
# Instalar con pip
pip install objection

# Verificar
objection version

# Dependencias adicionales
pip install frida-tools
```

### 7.2 patchipa

patchipa reempaqueta un IPA con Frida Gadget injectado para dispositivos sin [jailbreak](../raw/41-h4ck1ng.md#jailbreak).

```bash
# Parchear IPA para dispositivo sin jailbreak
objection patchipa --source AppName.ipa

# Parchear con certificado específico
objection patchipa --source AppName.ipa \ --codesign-signature "iPhone Developer: Name (TEAMID)"

# Parchear con opciones adicionales
objection patchipa --source AppName.ipa \ --skip-resign \ --enable-debug

# Output: AppName.objection.ipa
```

**Pasos completos para usar patchipa:**

```bash
# 1. Obtener IPA (de cliente, AppStore, etc.)
# 2. Parchear con objection
objection patchipa --source AppName.ipa

# 3. Instalar IPA parcheado
ios-deploy -b AppName.objection.ipa

# 4. Explorar
objection explore --gadget "com.ejemplo.app"
```

### 7.3 Comandos Exploratorios

Una vez conectado a la app con Objection, podés explorar el runtime.

```bash
# Conectar a app
objection explore
objection -g com.ejemplo.app explore

# O desde patchipa
objection explore --gadget "com.ejemplo.app"

# ========== COMANDOS BÁSICOS ==========

# Entorno
env # Variables de entorno
ios plist cat Info.plist  # Info.plist

# NSUserDefaults
ios nsuserdefaults get # Listar defaults
ios nsuserdefaults set key value

# Keychain
ios keychain dump # Dump de keychain
ios keychain list # Listar items

# Cookies
ios cookies get # Obtener cookies

# Filesystem
ls # Listar archivos
pwd # Directorio actual
cd # Cambiar directorio

# SQLite
sqlite connect /path/to/db.sqlite # Conectar a DB

# Screenshot
screenshot # Capturar pantalla

# UI
ios ui alert # Mostrar alert
ios ui view # Ver jerarquía de vistas
ios ui screenshot # Screenshot de UI

# ========== COMANDOS DE HOOKING ==========

# Listar clases
ios hooking list classes

# Buscar clases
ios hooking search classes Authentication

# Listar métodos de clase
ios hooking list class methods AuthenticationManager

# Hookear método
ios hooking watch class AuthenticationManager

# Hookear método específico
ios hooking watch method "-[AuthenticationManager loginWithUsername:password:]"

# Hookear con argumentos
ios hooking watch method "+[CryptoManager encrypt:key:]"

# ========== COMANDOS DE MONITOREO ==========

# Monitorear URL schemes
ios monitor urlschemes

# Monitorear pasteboard
ios monitor pasteboard

# Monitorear crypto operations
ios monitor crypto
```

**Ejemplo de sesión de Objection:**

```bash
$ objection -g com.ejemplo.app explore

# Ver Info.plist
com.ejemplo.app on (iPhone: 15.1) [usb] # ios plist cat Info.plist

# Listar clases de autenticación
com.ejemplo.app on (iPhone: 15.1) [usb] # ios hooking search classes Auth
# Output: Found 3 classes:
# 1. AuthenticationManager
# 2. AuthTokenStorage
# 3. LoginViewController

# Hookear AuthenticationManager
com.ejemplo.app on (iPhone: 15.1) [usb] # ios hooking watch class AuthenticationManager

# Dump de keychain
com.ejemplo.app on (iPhone: 15.1) [usb] # ios keychain dump
# Output:
# Accessible: kSecAttrAccessibleWhenUnlocked
# Account: user@ejemplo.com
# Service: com.ejemplo.app.login
# Data: password123!

# Ver NSUserDefaults
com.ejemplo.app on (iPhone: 15.1) [usb] # ios nsuserdefaults get
# Output:
# user_premium: 1
# last_login: 2024-01-15
# session_token: eyJhbGciOiJIUzI1NiJ9..
```

### 7.4 NSUserDefaults Manipulation

NSUserDefaults es el almacenamiento de preferencias simple de iOS.

```bash
# Ver todos los valores
ios nsuserdefaults get

# Ver valor específico
ios nsuserdefaults get user_premium

# Modificar valor
ios nsuserdefaults set is_premium true
ios nsuserdefaults set login_count 999
ios nsuserdefaults set user_role admin

# La app leerá estos valores modificados
```

**NSUserDefaults analysis manual:**

```bash
# Ubicación de NSUserDefaults en el dispositivo
# /var/mobile/Containers/Data/Application/UUID/Library/Preferences/com.ejemplo.app.plist

# Leer con plutil (desde SSH)
plutil -p /path/to/com.ejemplo.app.plist

# Leer con Frida
frida -U com.ejemplo.app -l dump_userdefaults.js
```

### 7.5 Keychain Dump con Objection

```bash
# Dump completo del keychain
ios keychain dump

# Dump en formato JSON
ios keychain dump --json

# Dump a archivo
ios keychain dump > keychain_dump.txt

# Listar grupos de keychain
ios keychain list

# Output típico:
# (sensitive: false)
# Service: com.ejemplo.app.token
# Account: refresh_token
# Data: eyJhbGciOiJIUzI1NiJ9..
# Label: (null)
# Access Group: ABCDEF123.com.ejemplo.app
# Accessible: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
# Creation: 2024-01-15 10:30:00 +0000
# Modified: 2024-01-15 10:30:00 +0000
```

### 7.6 sqlite Interaction

```bash
# Encontrar bases de datos SQLite
ls
# Buscar archivos .sqlite, .db, .sqlitedb

# Conectar a base de datos
sqlite connect Documents/database.sqlite

# Una vez conectado, comandos SQL:
sqlite> .tables # Listar tablas
sqlite> SELECT * FROM users;  # Query
sqlite> PRAGMA table_info(users);  # Schema
sqlite> .schema # Ver schema completo
sqlite> .dump # Dump de DB

# Ejemplo:
# > sqlite connect Documents/chat.db
# > .tables
# messages, users, contacts
# > SELECT * FROM users;
# 1|admin|password123|admin@ejemplo.com
# 2|user1|pass456|user1@ejemplo.com
```

## 8. Runtime Analysis

### 8.1 Method Swizzling Detection

Detectar si la app está usando method swizzling (técnica común de seguridad).

```javascript
// detect-swizzling.js
if (ObjC.available) { function detectSwizzling(className) { var clazz = ObjC.classes[className]; if (!clazz) return; console.log("[*] Checking " + className + " for swizzling.."); // Obtener implementaciones originales var methods = clazz.$methods; methods.forEach(function(methodName) { try { var method = clazz[methodName]; if (method) { // Verificar si la implementación es diferente var imp = method.implementation; var owner = DebugSymbol.fromAddress(imp); console.log("  " + methodName); console.log(" IMP: " + imp); console.log(" Owner: " + (owner ? owner.moduleName : "unknown"); // Si el owner no es la clase esperada, podría ser swizzling if (owner && owner.moduleName.indexOf(className) < 0) { console.log(" ** POTENTIAL SWIZZLING **"); } } } catch(e) {} }); } // Detectar swizzling en clases específicas detectSwizzling("AuthenticationManager"); detectSwizzling("CryptoManager"); detectSwizzling("NetworkManager");
}
```

### 8.2 Cycript (

Cycript fue la herramienta original para runtime analysis en [ios](../raw/10s-p3nt3st1ng.md). Hoy está obsoleta por [frida](../raw/4pk-r3v3rs1ng.md#frida) pero todavía se encuentra en guías viejas.

```javascript
// Cycript syntax (legacy — solo referencia)
// Conectar: cycript -p com.ejemplo.app

// Obtener sharedApplication
var app = [UIApplication sharedApplication];

// Listar vistas
var windows = [[app keyWindow] recursiveDescription];

// Obtener ViewController actual
var rootVC = [[app keyWindow] rootViewController];

// NSUserDefaults
var defaults = [NSUserDefaults standardUserDefaults];
[defaults objectForKey:@"session_token"];
[defaults setObject:@"hacked" forKey:@"user_role"];

// Encontrar clases
var classes = ObjectiveC.classes;
for (var name in classes) { if (name.match(/Secret/) console.log(name);
}
```

**Por qué migrar de Cycript a Frida:**

```
Cycript: - Obsoleto (no updates desde 2018) - No soporta iOS 14+ - Sintaxis menos intuitiva - Menos documentación

Frida: - Activamente mantenido - Soporta iOS 15/16/17+ - JavaScript moderno - Gran comunidad - Python + JS - Objection (framework sobre Frida)
```

### 8.3 Frida Gadget Injection

Frida Gadget permite injectar Frida en apps SIN [jailbreak](../raw/41-h4ck1ng.md#jailbreak).

**Método 1: patchipa (recomendado)**

```bash
# Objection patchipa injecta Frida Gadget automáticamente
objection patchipa --source AppName.ipa

# Instalar IPA parcheado
ios-deploy -b AppName.objection.ipa

# Conectar
objection explore
```

**Método 2: Manual**

```bash
# 1. Descargar Frida Gadget dylib
# De: https://github.com/frida/frida/releases
# Buscar: frida-gadget-16.x.x-ios-universal.dylib

# 2. Agregar al IPA
unzip AppName.ipa
cp frida-gadget.dylib Payload/AppName.app/
cd Payload/AppName.app/

# 3. Crear config
cat > FridaGadget.config << 'EOF'
{ "interaction": { "type": "listen", "address": "127.0.0.1", "port": 27042 }
}
EOF

# 4. Modificar Mach-O para cargar dylib
# Agregar comando de carga en el binario
/usr/bin/install_name_tool -change \ /usr/lib/libSystem.B.dylib \ @executable_path/FridaGadget.dylib \ AppName

# 5. Re-firmar
codesign -f -s "iPhone Developer: Name (TEAMID)" \ --entitlements ./entitlements.plist \ FridaGadget.dylib

# 6. Firmar framework
mkdir -p Frameworks/
cp FridaGadget.dylib Frameworks/
codesign -f -s "iPhone Developer: Name (TEAMID)" \ Frameworks/FridaGadget.dylib

# 7. Re-empaquetar e instalar
cd ./.
zip -r AppName_patched.ipa Payload/
ios-deploy -b AppName_patched.ipa
```

**Método 3: Usando Frida CLI**

```bash
# Frida puede injectar Gadget automáticamente
frida -U -f com.ejemplo.app --no-pause

# Esto inicia la app y attacha Frida automáticamente
# Funciona SOLO con jailbreak (necesita frida-server)
```

## 9. [ios](../raw/10s-p3nt3st1ng.md) Networking

### 9.1 Burp [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) Configuration

Configurar el proxy en iOS para interceptar tráfico [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https).

```bash
# PASO 1: Configurar proxy en Wi-Fi
# Settings > Wi-Fi > (network) > Configure Proxy > Manual
# Server: IP de tu Mac
# Port: 8080 (Burp default)

# PASO 2: Verificar conexión
# En Burp: Proxy > Options > Listeners
# Asegurar que está escuchando en 0.0.0.0:8080

# PASO 3: Probar
# En Safari del iPhone: http://burpsuite
# Debería mostrar la página de configuración de Burp
```

**Proxy automático con Burp:**

```bash
# Burp > Proxy > Options > Import/Export CA certificate
# Export certificate (DER format)

# Enviar al iPhone:
# 1. Abrir en Safari: http://burpsuite
# 2. Download CA Certificate
# 3. Settings > General > About > Certificate Trust Settings
# 4. Enable Burp CA
```

### 9.2 Certificate Installation

Instalar el certificado CA de Burp en el [iphone](../raw/10s-p3nt3st1ng.md).

```bash
# MÉTODO 1: Safari
# 1. Configurar proxy
# 2. Safari -> http://burpsuite
# 3. Download cacert.der
# 4. Settings > General > Profiles > Install
# 5. Settings > General > About > Certificate Trust Settings
# 6. Enable "PortSwigger CA"

# MÉTODO 2: USB + iOS
# Copiar certificado al dispositivo
ideviceinstaller -l  # Verificar conexión

# MÉTODO 3: AirDrop
# Enviar certificado por AirDrop a iPhone
```

**Verificar instalación:**

```bash
# En el iPhone:
# Settings > General > About > Certificate Trust Settings
# Deberías ver:
# - PortSwigger CA [ENABLED]

# Probar en Safari:
# Ir a https://ejemplo.com
# Debería ser interceptado por Burp
```

### 9.3 [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))) Pinning Bypass

Ver sección 6.2 para scripts detallados.

**Resumen de técnicas:**

```
1. Frida script (recomendado): frida -U -f com.ejemplo.app -l frida-ssl-bypass.js --no-pause

2. Objection: ios sslpinning disable

3. Burp + Proxy: A veces configurar proxy + certificado es suficiente (depende de la implementación de SSL pinning)

4. Manual hook: - Hookear NSURLSessionDelegate - Hookear AFSecurityPolicy (AFNetworking) - Hookear ServerTrustManager (Alamofire)
```

### 9.4 HTTP Traffic Analysis

Analizar el tráfico HTTP/HTTPS de la app.

```bash
# Con Burp Suite
# 1. Configurar proxy
# 2. Instalar certificado
# 3. Interceptar tráfico
# 4. Analizar requests/responses

# Con Frida (log de requests)
frida-trace -U com.ejemplo.app \ -m "*[NSURLSession dataTaskWithURL:*]" \ -m "*[NSURLSession dataTaskWithRequest:*]" \ -o network_trace.txt

# Con Objection
objection -g com.ejemplo.app explore
# Dentro de Objection:
ios monitor urlschemes
```

**Qué buscar en el tráfico de [red](../raw/r3d3s-f0nd4m3nt0s.md):**

```
1. AUTENTICACIÓN: - Tokens JWT en headers - Credenciales en body - Session cookies

2. DATOS SENSIBLES: - Información personal en queries - Datos de tarjetas de crédito - Health data

3. API ENDPOINTS: - Endpoints no documentados - Endpoints de admin - API versioning

4. SEGURIDAD: - HTTP vs HTTPS - Certificados válidos - Headers de seguridad

5. DATOS CIFRADOS: - Payloads cifrados (extra) - Custom encryption
```

## 10. Keychain Analysis

### 10.1 SecItemadd

SecItemAdd es la función para agregar items al keychain.

```javascript
// Hookear SecItemAdd para capturar datos guardados en keychain
if (ObjC.available) { var SecItemAdd = Module.findExportByName("Security", "SecItemAdd"); Interceptor.attach(SecItemAdd, { onEnter: function(args) { console.log("\n[KEYCHAIN] SecItemAdd called"); try { var dict = ObjC.Object(args[0]); if (dict) { // Extraer atributos del keychain var keys = dict.allKeys; keys.forEach(function(key) { var value = dict.objectForKey_(key); if (value) { console.log("  " + key + " = " + value); } }); } } catch(e) { console.log("  Error parsing: " + e); } } });
}
```

**Valores comunes en SecItemAdd:**

```
kSecClass: kSecClassGenericPassword / kSecClassInternetPassword
kSecAttrService: Servicio (ej: com.ejemplo.app.login)
kSecAttrAccount: Cuenta (ej: user@ejemplo.com)
kSecAttrLabel: Etiqueta
kSecValueData: El valor guardado (cifrado)
kSecAttrAccessible: Nivel de protección
kSecAttrAccessGroup: Grupo de acceso
```

### 10.2 SecItemCopyMatching

SecItemCopyMatching busca items en el keychain.

```javascript
if (ObjC.available) { var SecItemCopyMatching = Module.findExportByName( "Security", "SecItemCopyMatching" ); Interceptor.attach(SecItemCopyMatching, { onEnter: function(args) { console.log("\n[KEYCHAIN] SecItemCopyMatching called"); try { var query = ObjC.Object(args[0]); if (query) { console.log("  Query: " + query.toString); } } catch(e) {} }, onLeave: function(retval) { if (retval === 0) { // errSecSuccess try { var result = ObjC.Object(this.arg1.readPointer); if (result) { console.log("  Result: " + result.toString); } } catch(e) {} } } });
}
```

### 10.3 Keychain Groups

Los keychain groups permiten compartir datos del keychain entre apps del mismo desarrollador.

**Cómo funcionan:**

```
- El equipo de desarrollo tiene un Team ID (ej: ABCDEF123)
- Las apps pueden compartir keychain si tienen el mismo keychain-access-groups entitlement
- El grupo se especifica como: TEAMID.com.ejemplo.shared
- Todas las apps en el mismo grupo pueden leer/escribir items
```

**Analizar keychain groups:**

```bash
# Ver entitlements de keychain
codesign -d --entitlements :- Payload/AppName.app/AppName | \ grep keychain-access-groups -A 5

# Output típico:
# <key>keychain-access-groups</key>
# <array>
# <string>ABCDEF123.com.ejemplo.app</string>
# <string>ABCDEF123.com.ejemplo.app.shared</string>
# </array>

# Con Frida
frida -U com.ejemplo.app -l dump_keychain_groups.js
```

**Riesgo de seguridad:**

```
Si dos apps del mismo desarrollador comparten keychain group:
- App A (legítima) guarda tokens en el grupo
- App B (vulnerable o maliciosa) puede leer esos tokens
- El atacante explota App B para robar tokens de App A
```

### 10.4 Accessibility / kSecAttrAccessible

El atributo kSecAttrAccessible define cuándo el keychain item está disponible.

**Valores de kSecAttrAccessible:**

```
kSecAttrAccessibleWhenUnlocked (default): - Item accesible solo cuando el dispositivo está desbloqueado - Migrado a nuevo dispositivo si está respaldado

kSecAttrAccessibleAfterFirstUnlock: - Item accesible después del primer desbloqueo post-reboot - Sigue siendo accesible incluso si el dispositivo se bloquea

kSecAttrAccessibleAlways: - Siempre accesible (incluso bloqueado) - Deprecado en iOS 13+

kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly: - Solo accesible con passcode configurado - No se migra a otros dispositivos - Más seguro

kSecAttrAccessibleWhenUnlockedThisDeviceOnly: - Desbloqueado + no migra - Recomendado para tokens de sesión

kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly: - Primer desbloqueo + no migra

kSecAttrAccessibleAlwaysThisDeviceOnly: - Siempre + no migra (deprecado)
```

**Evaluación de seguridad:**

```
kSecAttrAccessible | Seguridad
--------------------------------------------|-----------
WhenPasscodeSetThisDeviceOnly | Máxima
WhenUnlockedThisDeviceOnly | Alta
AfterFirstUnlockThisDeviceOnly | Media-Alta
WhenUnlocked | Media
AfterFirstUnlock | Media-Baja
Always | Baja (deprecado)
```

### 10.5 Keychain Dumper

Herramientas para dump del keychain.

**keychain_dumper (herramienta clásica):**

```bash
# En dispositivo con jailbreak
# Descargar e instalar en /usr/bin/
wget https://github.com/ptoomey3/Keychain-Dumper/raw/master/keychain_dumper
chmod +x keychain_dumper

# Dump de todo el keychain
./keychain_dumper

# Dump de solo passwords genéricos
./keychain_dumper -g

# Dump de internet passwords
./keychain_dumper -i

# Dump de certificados
./keychain_dumper -c

# Dump de llaves
./keychain_dumper -k

# Output a archivo
./keychain_dumper > keychain_output.txt
```

**[frida](../raw/4pk-r3v3rs1ng.md#frida) keychain dump (ver script en 6.3):**

```bash
frida -U com.ejemplo.app -l frida-keychain-dump.js
```

**Objection keychain dump:**

```bash
objection -g com.ejemplo.app explore
ios keychain dump
```

## 11. Data Storage Analysis

### 11.1 NSUserDefaults

NSUserDefaults es usado para guardar preferencias simples.

**Ubicación en el dispositivo:**

```bash
# Ruta del archivo
/var/mobile/Containers/Data/Application/UUID/Library/Preferences/com.ejemplo.app.plist

# Analizar con plutil (desde SSH)
plutil -p /path/to/com.ejemplo.app.plist

# Analizar con Objection
ios nsuserdefaults get
```

**Qué buscar en NSUserDefaults:**

```
1. CREDENCIALES: - "username", "password", "token" - "auth_token", "refresh_token" - Extremadamente inseguro si está aquí

2. DATOS DE USUARIO: - "email", "phone", "address" - Datos personales sin cifrar

3. CONFIGURACIÓN: - "is_premium": true - "user_role": "admin" - Datos de configuración modificables

4. SECRETOS: - API keys - Endpoints internos - Flags de debug
```

**Script [frida](../raw/4pk-r3v3rs1ng.md#frida) para dump de NSUserDefaults:**

```javascript
if (ObjC.available) { var defaults = ObjC.classes.NSUserDefaults.standardUserDefaults; var dict = defaults.dictionaryRepresentation; var keys = dict.allKeys; console.log("[*] NSUserDefaults dump:"); console.log("========================="); keys.forEach(function(key) { var value = dict.objectForKey_(key); if (value) { console.log(key + " = " + value); } });
}
```

### 11.2 Coredata

CoreData es el framework de [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)](w1nd0ws de objetos de Apple.

**Ubicación en el dispositivo:**

```bash
# Buscar archivos CoreData
find /var/mobile/Containers/Data/Application/UUID -name "*.sqlite"
find /var/mobile/Containers/Data/Application/UUID -name "*.momd"

# Rutas comunes:
# Documents/
# Library/Application Support/
# Library/Caches/
```

**Analizar CoreData:**

```bash
# Con sqlite3
sqlite3 /path/to/database.sqlite
.tables
SELECT * FROM ZUSER;  # CoreData tables tienen prefijo Z
PRAGMA table_info(ZUSER);
SELECT ZUSERNAME, ZPASSWORD, ZEMAIL FROM ZUSER;

# Con Objection
sqlite connect /path/to/database.sqlite
.tables
SELECT * FROM ZUSER;
```

**CoreData entities comunes que buscar:**

```
ZUSER, ZACCOUNT, ZPROFILE -> User data
ZMESSAGE, ZCHAT -> Messages
ZTOKEN, ZSESSION -> Tokens
ZTRANSACTION, ZORDER -> Transactions
ZCREDITCARD, ZPAYMENT -> Payment data (PELIGRO)
```

**CoreData con Frida:**

```javascript
if (ObjC.available) { // Hookear CoreData save var moc = ObjC.classes.NSManagedObjectContext; var save = moc["- save:"]; if (save) { Interceptor.attach(save.implementation, { onEnter: function(args) { console.log("[CoreData] save called"); var context = ObjC.Object(args[0]); var inserted = context.insertedObjects; if (inserted && inserted.count > 0) { console.log("  Inserted objects:"); inserted.enumerateObjectsUsingBlock_( function(obj, idx, stop) { console.log(" " + obj.entity.name + ": " + obj.dictionaryWithValuesForKeys_error_( obj.entity.attributesByName.allKeys, NULL ); } ); } } }); }
}
```

### 11.3 sqlite

Muchas apps usan SQLite directamente (sin CoreData).

**Buscar bases de datos SQLite:**

```bash
# Encontrar archivos SQLite
find /var/mobile/Containers/Data/Application/UUID/ -name "*.db"
find /var/mobile/Containers/Data/Application/UUID/ -name "*.sqlite"
find /var/mobile/Containers/Data/Application/UUID/ -name "*.sqlitedb"

# Rutas comunes:
# Documents/database.db
# Library/Caches/database.sqlite
# Documents/chat.db
# Documents/data.db
```

**Analizar SQLite:**

```bash
# Conectarse
sqlite3 /path/to/database.db

# Comandos útiles
.databases
.tables
.schema
SELECT * FROM sqlite_master;
PRAGMA database_list;

# Buscar tablas con datos sensibles
SELECT name FROM sqlite_master WHERE type="table";

# Dump de tablas
.dump users
SELECT * FROM users;

# Buscar credenciales
SELECT * FROM users WHERE password IS NOT NULL;
SELECT * FROM tokens;
SELECT * FROM sessions;
```

**Via Objection:**

```bash
sqlite connect Documents/database.db
.tables
SELECT * FROM users;
```

### 11.4 Realm

Realm es una base de datos mobile alternativa a CoreData/SQLite.

**Buscar archivos Realm:**

```bash
# Realm files
find /var/mobile/Containers/Data/Application/UUID/ -name "*.realm"
find /var/mobile/Containers/Data/Application/UUID/ -name "*.realm.management"

# También puede estar en Documents/
# Documents/default.realm
# Documents/default.realm.lock
```

**Analizar Realm:**

```bash
# Realm Browser (Mac app gratuita)
# Abrir .realm file en Mac
# Ver todas las tablas y datos

# Con Frida (más complejo)
# Realm es Objective-C, accesible via runtime
```

**Frida para Realm:**

```javascript
if (ObjC.available) { // Realm classes var realmClasses = [ "RLMRealm", "RLMObject", "RLMResults", "RLMArray" ]; realmClasses.forEach(function(className) { try { var clazz = ObjC.classes[className]; if (clazz) { console.log("[Realm] Found: " + className); // Listar allObjects if (clazz["- allObjects"]) { var method = clazz["- allObjects"]; Interceptor.attach(method.implementation, { onLeave: function(retval) { console.log("[Realm] allObjects called"); } }); } } } catch(e) {} });
}
```

### 11.5 Couchbase Lite

Couchbase Lite es otra base de datos mobile.

**Buscar archivos:**

```bash
find /var/mobile/Containers/Data/Application/UUID/ -name "*.cblite*"
find /var/mobile/Containers/Data/Application/UUID/ -name "cblite*"
```

### 11.6 File Protection Classes

Verificar la protección de archivos en el [sistema de archivos](../raw/0s-f0nd4m3nt0s.md#sistema-de-archivos).

```bash
# Ver protección de archivos (en dispositivo con jailbreak)
ls -al@ /var/mobile/Containers/Data/Application/UUID/Documents/

# El atributo "com.apple.MobileFileProtection" muestra la clase
# Si es "NSFileProtectionNone" -> sin protección

# Tambien con:
getxattr /path/to/file com.apple.MobileFileProtection
```

**Script Frida para verificar protección:**

```javascript
if (ObjC.available) { var fm = ObjC.classes.NSFileManager.defaultManager; var appDir = ObjC.classes.NSBundle.mainBundle.bundlePath; // Enumerar archivos y verificar protección var files = fm.contentsOfDirectoryAtPath_error_(appDir, NULL); if (files) { files.forEach(function(file) { var path = appDir + "/" + file; var attrs = fm.attributesOfItemAtPath_error_(path, NULL); var protection = attrs.objectForKey_( ObjC.classes.NSString.stringWithString_( "NSFileProtectionKey" ) ); console.log(file + " -> " + (protection || "NSFileProtectionNone"); }); }
}
```

### 11.7 cache.db

[ios](../raw/10s-p3nt3st1ng.md) mantiene un cache de respuestas [http](../raw/r3d3s-f0nd4m3nt0s.md#http).

```bash
# Ubicación del cache
/var/mobile/Containers/Data/Application/UUID/Library/Caches/com.ejemplo.app/Cache.db

# Analizar
sqlite3 Cache.db
.tables
SELECT * FROM cfurl_cache_response;
SELECT * FROM cfurl_cache_receiver_data;

# Esto revela:
# - URLs visitadas por la app
# - Respuestas HTTP cacheadas
# - Datos sensibles en responses
```

### 11.8 Snapshots

iOS toma snapshots de la app cuando va a background.

```bash
# Ubicación de snapshots
/var/mobile/Containers/Data/Application/UUID/Library/Caches/Snapshots/

# Ver las imágenes
ls -la /path/to/Snapshots/*.png

# Riesgo de seguridad:
# La snapshot puede contener datos sensibles si la app
# muestra información personal en pantalla
```

**Prevención (desde el pentest):**

```
Verificar si la app implementa protección contra snapshots:
- UIApplication.shouldIgnoreSnapshotRestriction
- UIApplication.ignoreSnapshotOnNextApplicationLaunch
- Covering views before going to background

Si no implementa -> datos sensibles expuestos en snapshots
```

## 12. vulnerabilidadces comunes en [ios](../raw/10s-p3nt3st1ng.md)

### 12.1 Insecure Data Storage

**Descripción:**
La app almacena datos sensibles sin cifrar o en ubicaciones inseguras.

**Qué buscar:**

```
1. NSUserDefaults: - Tokens de autenticación - Credenciales - API keys

2. CoreData / SQLite sin cifrar: - Datos de usuarios - Tokens - Información financiera

3. Archivos plist: - Configuraciones con datos sensibles

4. Caché de URLs: - Respuestas HTTP con datos sensibles

5. Keychain con accesibilidad débil: - kSecAttrAccessibleAlways - Items sin protección adecuada

6. Logs: - NSLog con datos sensibles - Archivos de log
```

**Ejemplo de prueba:**

```bash
# 1. Buscar archivos de datos
find /var/mobile/Containers/Data/Application/UUID/ \ -type f \( -name "*.plist" -o -name "*.sqlite" -o -name "*.db" \) \ -exec strings {} \; | grep -i "password\|token\|secret\|key"

# 2. Verificar NSUserDefaults
plutil -p /path/to/Preferences/com.app.plist

# 3. Analizar CoreData
sqlite3 /path/to/database.sqlite "SELECT * FROM ZUSER;"

# 4. Verificar snapshots
ls -la /path/to/Snapshots/
```

**Remediación:**

```
- Usar Keychain con kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
- Cifrar datos en reposo
- No almacenar datos sensibles en NSUserDefaults
- Implementar protección contra snapshots
- Usar Data Protection classes (NSFileProtectionComplete)
- Limpiar caché de URL responses
```

### 12.2 Improper [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))) Verification

**Descripción:**
La app no verifica correctamente los certificados SSL.

**Cómo detectarlo:**

```bash
# 1. Configurar Burp con certificado
# 2. Si la app funciona sin instalar el CA certificate de Burp
# -> SSL verification está deshabilitada

# 3. Buscar en el binario:
strings Payload/AppName.app/AppName | grep -i "allowInvalid\|disableSSL\|setAllowsAnyHTTPSCertificate\|validatesSecureCertificate"

# 4. Buscar en Info.plist:
plutil -p Info.plist | grep NSAllowsArbitraryLoads
plutil -p Info.plist | grep NSExceptionAllowsInsecureHTTPLoads
```

**Indicadores de mala implementación:**

```
Info.plist: - NSAllowsArbitraryLoads = YES -> Todas las conexiones HTTP sin restricción - NSAllowsArbitraryLoadsInWebContent = YES - NSExceptionAllowsInsecureHTTPLoads para dominios específicos

Código: - allowInvalidCertificates = YES (AFNetworking) - validatesSecureCertificate = NO - ServerTrustManager disable validation (Alamofire)
```

**Remediación:**

```
- NSAllowsArbitraryLoads = NO (default)
- Implementar SSL pinning
- Validar certificados correctamente
- No permitir certificados inválidos
```

### 12.3 Client-Side Injection

**Descripción:**
La app es vulnerable a inyecciones del lado del cliente.

**Tipos de inyección:**

```
1. SQL Injection en SQLite/CoreData: - Queries construidas con concatenación de strings - Input del usuario sin sanitizar

2. XSS en UIWebView/WKWebView: - JavaScript injectado en WebView - Datos no sanitizados mostrados en HTML

3. URL Scheme Injection: - Deep links que ejecutan acciones no intencionadas - URL schemes maliciosos

4. XML Injection: - Parsing de XML sin validación - XXE (XML External Entity)
```

**Cómo probar:**

```javascript
// Probar SQL injection con Frida
if (ObjC.available) { // Hookear métodos de database var db = ObjC.classes.NSDatabase; if (db["- executeQuery:"]) { Interceptor.attach(db["- executeQuery:"].implementation, { onEnter: function(args) { var query = ObjC.Object(args[2]); if (query) { console.log("[SQL] Query: " + query); // Buscar queries con concatenación de strings if (query.toString.indexOf("'") >= 0) { console.log("  ** Potential SQL injection vector **"); } } } }); }
}
```

**Remediación:**

```
- Usar prepared statements (siempre)
- Sanitizar input del usuario
- Usar WKWebView (no UIWebView)
- Validar URL schemes
- Configurar Content Security Policy en WebViews
```

### 12.4 Insecure Authentication

**Descripción:**
La implementación de autenticación tiene fallas de seguridad.

**Qué buscar:**

```
1. LOCAL AUTHENTICATION: - Face ID / Touch ID implementado incorrectamente - LAContext biometry evaluation sin fallback - Almacenamiento local de credenciales

2. REMOTE AUTHENTICATION: - Tokens predecibles - Sin rate limiting - Sin expiración de sesión - Credenciales en URLs

3. TOKEN MANAGEMENT: - Tokens almacenados en NSUserDefaults - Tokens sin expiración - Tokens enviados en URLs
```

**Prueba con [frida](../raw/4pk-r3v3rs1ng.md#frida):**

```javascript
// Capturar tokens de autenticación
if (ObjC.available) { // Hookear métodos de login var loginClasses = ObjC.enumerateLoadedClasses.filter( function(c) { return c.indexOf("Auth") >= 0 || c.indexOf("Login") >= 0; } ); loginClasses.forEach(function(className) { try { var clazz = ObjC.classes[className]; console.log("[Auth] Found: " + className); clazz.$methods.forEach(function(methodName) { if (methodName.indexOf("login") >= 0 || methodName.indexOf("authenticate") >= 0 || methodName.indexOf("token") >= 0) { var method = clazz[methodName]; Interceptor.attach(method.implementation, { onEnter: function(args) { console.log("[Auth] Called: " + methodName); for (var i = 2; i < args.length; i++) { try { var arg = ObjC.Object(args[i]); if (arg) { console.log("  arg[" + (i-2) + "]: " + arg); } } catch(e) {} } } }); } }); } catch(e) {} });
}
```

### 12.5 Session Handling

**Descripción:**
Manejo inseguro de sesiones de usuario.

**Qué buscar:**

```
1. SESSION TOKENS: - Tokens que no expiran - Tokens estáticos (no cambian en logout) - Tokens compartidos entre apps

2. SESSION MANAGEMENT: - No hay logout server-side - Sesiones múltiples permitidas - Sin invalidación de sesión en password change

3. COOKIES: - Cookies sin Secure flag - Cookies sin HttpOnly flag - Cookies persistentes sin expiración
```

**Prueba:**

```bash
# 1. Capturar token de sesión
# 2. Hacer logout
# 3. Reusar el token -> Si funciona, la sesión no se invalida

# Con curl
curl -X GET https://api.ejemplo.com/user/profile \ -H "Authorization: Bearer TOKEN_CAPTURADO"

# Después de logout
curl -X GET https://api.ejemplo.com/user/profile \ -H "Authorization: Bearer TOKEN_CAPTURADO"
# Si sigue funcionando -> session no invalidada
```

### 12.6 Side-Channel Data Leakage

**Descripción:**
La app filtra datos a través de canales no intencionados.

**Canales de fuga:**

```
1. KEYBOARD CACHE: - QuickType suggestions - Custom keyboard extensions

2. PASTEBOARD: - UIPasteboard con datos sensibles - Copy/paste de información sensible

3. BACKGROUND TASKS: - App enviando datos en background - Location updates

4. NOTIFICATIONS: - Push notifications con datos sensibles - Local notifications con datos

5. APP GROUP CONTAINERS: - Datos compartidos entre app y extensions

6. LOGS: - NSLog, OSLog, print con datos sensibles

7. CRASH REPORTS: - Crash logs con datos sensibles
```

**Monitorear con Frida:**

```javascript
// Monitorear pasteboard
if (ObjC.available) { var pb = ObjC.classes.UIPasteboard.generalPasteboard; var setString = pb["- setString:"]; if (setString) { Interceptor.attach(setString.implementation, { onEnter: function(args) { var str = ObjC.Object(args[2]); if (str) { console.log("[PASTEBOARD] Data copied: " + str); } } }); } var setData = pb["- setData:forPasteboardType:"]; if (setData) { Interceptor.attach(setData.implementation, { onEnter: function(args) { console.log("[PASTEBOARD] Binary data copied"); } }); }
}
```

### 12.7 Binary Analysis

**Descripción:**
Análisis del binario para encontrar vulnerabilidades.

**Técnicas de análisis binario:**

```bash
# 1. STRINGS ANALYSIS
strings Payload/AppName.app/AppName | sort -u > strings.txt

# Buscar:
cat strings.txt | grep -i "password\|secret\|key\|token"
cat strings.txt | grep -i "http://\|https://" | grep -v "apple\|google"
cat strings.txt | grep -i "api_key\|apikey\|api.secret"
cat strings.txt | grep -i "jail\|cydia\|substrate\|root"
cat strings.txt | grep -i "debug\|test\|staging\|dev"

# 2. SYMBOL ANALYSIS
nm Payload/AppName.app/AppName > symbols.txt
cat symbols.txt | grep -i "crypt\|encrypt\|decrypt\|hash\|base64"
cat symbols.txt | grep -i "keychain\|SecItem\|SSKeychain"
cat symbols.txt | grep -i "URL\|NSURL\|AFNetworking\|Alamofire"

# 3. CLASS DUMP
class-dump Payload/AppName.app/AppName > classdump.txt
cat classdump.txt | grep -i "@interface" | head -50
cat classdump.txt | grep -i "password\|credential\|token"

# 4. OTOOL ANALYSIS
otool -L Payload/AppName.app/AppName  # Linked frameworks
otool -l Payload/AppName.app/AppName | grep -A5 "LC_ENCRYPTION_INFO"
# Verificar si el binario está cifrado (cryptid)
# cryptid 1 = cifrado (App Store)
# cryptid 0 = no cifrado (debug/development)
```

**Con Hopper/[ghidra](../raw/4pk-r3v3rs1ng.md#ghidra):**

```bash
# 1. Abrir binario en Hopper Disassembler
# 2. Buscar referencias a "password"
# 3. Seguir referencias cruzadas
# 4. Analizar funciones de login/autenticación
# 5. Buscar hardcoded keys
```

## 13. Herramientas

### 13.1 [frida](../raw/4pk-r3v3rs1ng.md#frida)

Frida es la herramienta principal para pentesting dinámico en [ios](../raw/10s-p3nt3st1ng.md).

**comandos esenciales de Frida:**

```bash
# Instalación
pip install frida-tools

# En dispositivo (con jailbreak)
# Agregar repo: https://build.frida.re
# Instalar Frida desde Cydia/Sileo

# Comandos básicos
frida-ps -U # Listar procesos USB
frida-ps -U -a # Listar apps
frida-ls-devices # Listar dispositivos
frida -U com.apple.mobilesafari # Conectar a Safari

# Modos de uso
frida -U -f com.ejemplo.app -l script.js --no-pause # Launch + inject
frida -U com.ejemplo.app -l script.js # Attach + inject
frida-trace -U com.ejemplo.app -m "*[NSURLConnection*]" # Trace

# Options utiles
--no-pause # No pausar al inicio
--auto-reload  # Recargar script automáticamente
-o output.txt  # Output a archivo
```

**Recursos de Frida:**

```
Documentación: https://frida.re/docs/home/
Frida CodeShare: https://codeshare.frida.re/
GitHub: https://github.com/frida/frida
Tutoriales: https://frida.re/docs/examples/
```

### 13.2 Objection

Objection es un framework sobre Frida que simplifica tareas comunes.

**Comandos esenciales de Objection:**

```bash
# Instalación
pip install objection

# Conectar a app
objection -g com.ejemplo.app explore

# Patch IPA
objection patchipa --source AppName.ipa

# Comandos dentro de explore
ios nsuserdefaults get
ios keychain dump
ios hooking list classes
ios hooking search classes Auth
ios hooking watch class AuthenticationManager
ios sslpinning disable
sqlite connect /path/to/db.sqlite
ls
env
```

### 13.3 idb

idb es una herramienta para interactuar con dispositivos iOS.

```bash
# Instalación
brew install idb

# O via pip
pip install idb

# Comandos
idb list-targets # Listar dispositivos
idb connect --udid UDID # Conectar
idb launch com.ejemplo.app # Launch app
idb terminate com.ejemplo.app # Kill app
idb file list --udid UDID / # Listar archivos
idb file pull --udid UDID /path/file.txt  # Descargar archivo
idb file push --udid UDID local.txt /path/  # Subir archivo
idb screenshot --udid UDID # Screenshot
idb video --udid UDID # Screen recording
idb log --udid UDID # System log
```

### 13.4 libimobiledevice

libimobiledevice es una biblioteca multiplataforma para comunicarse con dispositivos iOS.

```bash
# Instalación
brew install libimobiledevice

# Comandos útiles
idevice_id -l # Listar UDIDs
ideviceinfo # Información del dispositivo
idevicesyslog # System log
ideviceinstaller -l # Listar apps instaladas
ideviceinstaller -i app.ipa # Instalar IPA
ideviceinstaller -U com.app.id  # Desinstalar
idevicebackup2 # Backup
idevicescreenshot # Screenshot
idevicediagnostics # Diagnósticos
idevicedate # Fecha del dispositivo

# USB tunneling (forward puertos)
iproxy 2222 22 # SSH via USB
iproxy 8080 8080 # Proxy via USB
```

### 13.5 ios-deploy

ios-deploy permite instalar y debuggear apps iOS desde la línea de comandos.

```bash
# Instalación
brew install ios-deploy

# Comandos
ios-deploy -c # Listar dispositivos conectados
ios-deploy -b App.ipa # Instalar IPA
ios-deploy -B com.ejemplo.app # Backup app
ios-deploy -L # Listar apps instaladas
ios-deploy -X com.ejemplo.app # Kill app
ios-deploy --debug # Debug mode
ios-deploy --noninteractive # Non-interactive mode
```

### 13.6 Hopper / [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)

Herramientas de reverse engineering para analizar binarios Mach-O.

**Hopper Disassembler:**

```
Precio: ~$120 (licencia)
Plataforma: Mac

Características: - Descompilación a pseudo-código - Graph view - Debugging simbólico - Modificación de binarios - Scripting en Python - Soporte ARM64

Uso típico: 1. Abrir binario de iOS 2. Buscar funciones por nombre 3. Analizar referencias a strings 4. Seguir call graph 5. Modificar instrucciones 6. Exportar binario parcheado
```

**Ghidra (NSA):**

```
Precio: Gratuito (open source)
Plataforma: Mac, Windows, Linux

Características: - Descompilación avanzada - Análisis de binarios - Scripting en Python/Java - Team collaboration - Plugin ecosystem - Soporte ARM64 y Mach-O

Ventajas sobre Hopper: - Gratuito - Más potente en análisis - Actualizaciones frecuentes - Comunidad activa

Desventajas: - UI menos pulida - Curva de aprendizaje más alta
```

### 13.7 class-dump

class-dump extrae las interfaces Objective-C de un binario Mach-O.

```bash
# Instalación (Mac)
brew install class-dump

# O descargar de: http://stevenygard.com/projects/class-dump/

# Uso
class-dump Payload/AppName.app/AppName

# Opciones
class-dump -H Payload/AppName.app/AppName -o headers/
# Genera headers .h para todas las clases

# Filtros útiles
class-dump AppName | grep "@interface" | head -50
class-dump AppName | grep -i "password\|credential\|token"
class-dump AppName | grep -i "protocol"

# Ejemplo de output:
# @interface AuthenticationManager : NSObject
# - (void)loginWithUsername:(NSString *)username password:(NSString *)password;
# - (BOOL)isAuthenticated;
# - (NSString *)getAuthToken;
# @end
```

### 13.8 nm / otool / ldid

Herramientas de línea de comandos para análisis de binarios.

**nm — Symbol table:**

```bash
nm Payload/AppName.app/AppName | head -50
nm AppName | grep -i "crypt\|encrypt\|hash"
nm AppName | sort

# Output típico:
# 0000000100008000 T _main
# 0000000100009000 -[AuthenticationManager loginWithUsername:password:]
# 000000010000A000 -[CryptoManager encryptData:withKey:]
```

**otool — Object file display:**

```bash
# Frameworks linked
otool -L Payload/AppName.app/AppName

# Output:
# /usr/lib/libSystem.B.dylib
# /System/Library/Frameworks/Security.framework/Security
# /System/Library/Frameworks/CFNetwork.framework/CFNetwork
# @rpath/Alamofire.framework/Alamofire

# Load commands
otool -l Payload/AppName.app/AppName | head -100

# Encrypted?
otool -l AppName | grep -A4 "LC_ENCRYPTION_INFO"
# cryptid 1 = encrypted (App Store)
# cryptid 0 = not encrypted (dev)

# Disassembly
otool -tV Payload/AppName.app/AppName | head -50
```

**ldid — Link Identity Editor:**

```bash
# Instalación
brew install ldid

# Ver entitlements
ldid -e Payload/AppName.app/AppName

# Firmar binario
ldid -S Payload/AppName.app/AppName

# Firmar con entitlements específicos
ldid -Sentitlements.plist Payload/AppName.app/AppName

# Verificar firma
ldid -d Payload/AppName.app/AppName
```

## 14. Ejercicios Prácticos

### Ejercicio 1: setup de Entorno [ios](../raw/10s-p3nt3st1ng.md)

**Objetivo:** Configurar el entorno completo para pentesting iOS.

```
Requisitos: - Mac con Xcode - iPhone con jailbreak - Cable USB

Pasos:
1. Instalar Homebrew
2. Instalar Frida: pip install frida-tools
3. Instalar Objection: pip install objection
4. Instalar libimobiledevice: brew install libimobiledevice
5. Instalar Frida en el iPhone (desde Cydia/Sileo)
6. Verificar conexión: frida-ps -U
7. Instalar Burp Suite
8. Configurar proxy en iPhone

Verificación: frida-ps -U debe mostrar procesos idb list-targets debe mostrar el dispositivo
```

### Ejercicio 2: Análisis Estático de ipA

**Objetivo:** Analizar un IPA estáticamente para identificar vulnerabilidadces.

```
Usá una app de ejemplo (gratuita de App Store).

Pasos:
1. Obtener IPA (con Apple Configurator 2 o similar)
2. Descomprimir: unzip App.ipa
3. Analizar Info.plist: - Verificar NSAppTransportSecurity - Verificar URL schemes - Verificar permisos
4. Extraer entitlements: - codesign -d --entitlements :- Payload/App.app/App - Identificar keychain groups - Verificar get-task-allow
5. Analizar provisioning profile: - security cms -D -i embedded.mobileprovision - Fechas de expiración
6. Strings del binario: - strings App | grep -i "password\|secret\|key\|token" - strings App | grep -i "http:\/\/\|https:\/\/"
7. class-dump: - Identificar clases de autenticación - Identificar clases de red - Identificar clases de cifrado
```

### Ejercicio 3: [frida](../raw/4pk-r3v3rs1ng.md#frida) Basic Hooking

**Objetivo:** Aprender a hookear métodos Objective-C con Frida.

```
Creá un script Frida que:

1. Hookee el método "viewDidLoad" de todos los UIViewControllers
2. Hookee "initWithURL:" de NSURLRequest
3. Hookee "sendAsynchronousRequest" de NSURLConnection
4. Hookee "isAuthenticated" de AuthenticationManager

Script base: if (ObjC.available) { // 1. ViewDidLoad hook var vc = ObjC.classes.UIViewController["- viewDidLoad"]; Interceptor.attach(vc.implementation, { onEnter: function(args) { var self = ObjC.Object(args[0]); console.log("[UI] " + self.$className + " viewDidLoad"); } }); // Agregar más hooks aquí }

Ejecutar: frida -U -f com.ejemplo.app -l ejercicio3.js --no-pause
```

### Ejercicio 4: Bypass de [jailbreak](../raw/41-h4ck1ng.md#jailbreak) Detection

**Objetivo:** Bypassear la detección de jailbreak de una app.

```
Creá un script Frida que:

1. Detecte clases de jailbreak detection (JailbreakDetector, SecurityCheck, etc.)
2. Hookee todos los métodos que contengan "jail", "root", "cydia"
3. Modifique el valor de retorno a false/NO
4. Pruebe diferentes métodos de bypass - fileExistsAtPath - system - fork - dlsym

Usá el script de la Sección 6.1 como base.

Probalo en una app que detecte jailbreak: frida -U -f com.ejemplo.app -l bypass_jb.js --no-pause
```

### Ejercicio 5: [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))) Pinning Bypass

**Objetivo:** Bypassear SSL pinning para interceptar tráfico.

```
Configuración:
1. Configurar Burp como proxy
2. Instalar certificado CA de Burp en el iPhone

Bypass:
1. Usar script de Frida de la Sección 6.2
2. Verificar que el tráfico aparece en Burp
3. Identificar APIs y endpoints

Objection (alternativa): objection -g com.ejemplo.app explore ios sslpinning disable

Analizar el tráfico: - Endpoints de API - Tokens de autenticación - Datos sensibles en requests/responses
```

### Ejercicio 6: Keychain Analysis

**Objetivo:** Extraer y analizar datos del keychain.

```
Método 1: Objection objection -g com.ejemplo.app explore ios keychain dump

Método 2: Frida Script Usar script de la Sección 6.3

Método 3: keychain_dumper (jailbreak) /usr/bin/keychain_dumper

Analizar: - ¿Qué datos están en el keychain? - ¿Cuál es kSecAttrAccessible? - ¿Hay keychain groups compartidos? - ¿Hay tokens de sesión? - ¿Hay credenciales en texto plano?

Report: - Documentar cada item del keychain - Evaluar seguridad de cada item - Identificar vulnerabilidades
```

### Ejercicio 7: Data Storage Analysis

**Objetivo:** Encontrar datos almacenados inseguramente.

```
Buscar en el sandbox de la app: - NSUserDefaults (Preferences/) - CoreData (Documents/ o Library/Application Support/) - SQLite databases (*.db, *.sqlite) - Plist files - Caches (Caches/) - Snapshots (Caches/Snapshots/) - Log files - Crash reports

Para cada archivo encontrado: 1. Verificar contenido 2. Verificar si está cifrado 3. Verificar NSFileProtection class 4. Documentar datos sensibles

Herramientas: - SSH + comandos (find, sqlite3, plutil) - idb (file pull) - Objection (ls, sqlite connect)
```

### Ejercicio 8: Network Traffic Analysis

**Objetivo:** Analizar todo el tráfico de [red](../raw/r3d3s-f0nd4m3nt0s.md) de la app.

```
1. Configurar Burp Suite
2. Configurar proxy en iPhone
3. Instalar certificado CA
4. Bypassear SSL pinning (si es necesario)
5. Usar la app normalmente mientras grabás tráfico
6. Analizar cada request/response

Qué buscar: - Tokens en URLs (mala práctica) - Credenciales en body - Datos sensibles sin cifrar - Endpoints internos expuestos - API versioning - Rate limiting - Headers de seguridad faltantes

Alternativa con Frida: frida-trace -U com.ejemplo.app \ -m "*[NSURLSession dataTaskWithURL:*]"
```

### Ejercicio 9: Runtime Manipulation

**Objetivo:** Modificar el comportamiento de la app en tiempo real.

```
Usá Frida para:

1. Bypass de premium features: - Hookear "hasPremiumAccess" o similar - Forzar retorno true

2. Bypass de login: - Hookear "isAuthenticated" - Forzar retorno true

3. Modificar precios: - Hookear "productPrice" o similar - Modificar valor de retorno

4. Desbloquear UI: - Hookear "setEnabled:" de UIControl - Forzar enabled = true - Hookear "setUserInteractionEnabled:" - Forzar enabled = true

5. Mostrar passwords ocultos: - Hookear "setSecureTextEntry:" - Forzar secure = false
```

### Ejercicio 10: Report Writing

**Objetivo:** Escribir un [reporte de pentest](../raw/p3nt3st-r3p0rt1ng.md) iOS profesional.

```
Creá un reporte con la siguiente estructura:

1. RESUMEN EJECUTIVO: - Alcance del pentest - Resumen de findings - Estadísticas (total, critical, high, medium, low)

2. METODOLOGÍA: - Herramientas usadas - Técnicas aplicadas - Limitaciones

3. FINDINGS (para cada uno): - Título - Severidad (CVSS) - Descripción - Impacto - Steps to reproduce - PoC (screenshots, código Frida) - Remediación

4. CONCLUSIONES: - Riesgo general - Recomendaciones prioritarias

5. ANEXOS: - Scripts Frida usados - Output de herramientas - Lista de archivos analizados
```

### Ejercicio 11: Frida [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) Avanzado

**Objetivo:** Crear scripts Frida complejos para análisis automático.

```
Creá un script Frida que haga:

1. Auto-discovery de clases sensibles: - Buscar clases con "Auth", "Login", "Token", "Secret", "Crypto" - Listar automáticamente todos sus métodos

2. Auto-hooking de todas las clases encontradas: - Hookear cada método - Log de argumentos y valores de retorno - Detectar patrones inseguros

3. Keychain operation logging: - Hookear SecItemAdd, SecItemCopyMatching - Log de todos los items guardados/leídos

4. Network request logging: - Hookear NSURLSession methods - Log de URLs, headers, bodies

5. File I/O logging: - Hookear NSFileManager methods - Log de archivos leídos/escritos

Script modular: // auto-analyzer.js function hookClass(className) { .. } function hookKeychain { .. } function hookNetwork { .. } function hookFileSystem { .. } // Inicializar hookClass("AuthenticationManager"); hookKeychain; hookNetwork;
```

### Ejercicio 12: Full iOS Pentest Walkthrough

**Objetivo:** Realizar un pentest iOS completo de principio a fin.

```
App de prueba: Elegí una app gratuita de la App Store.

FASE 1: RECON (Día 1) - Obtener IPA - Info.plist analysis - Entitlements analysis - class-dump - strings analysis

FASE 2: NETWORK (Día 1-2) - Configurar Burp - Bypass SSL pinning (si aplica) - Capturar y analizar tráfico

FASE 3: DATA STORAGE (Día 2-3) - Analizar NSUserDefaults - Analizar CoreData/SQLite - Dump keychain - Buscar archivos inseguros

FASE 4: RUNTIME (Día 3-4) - Bypass de jailbreak detection - Hookear autenticación - Modificar premium features - Analizar UI

FASE 5: REPORT (Día 5) - Documentar todos los findings - PoC con scripts Frida - Recomendaciones

Entregables: - Reporte de pentest - Scripts Frida usados - Evidencia (screenshots, videos)
```

