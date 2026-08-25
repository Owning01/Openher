# osint — Open Source Intelligence

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (1793 lineas)


1. [opsecc Antes de Empezar](#opsec-operational-security-antes-de-empezar) - [Qué Usar para Mantener el Anonimato](#qu%C3%A9-usar-para-mantener-el-anonimato) - [Qué NO Hacer](#qu%C3%A9-no-hacer) - [Verificar que Estás Anónimo](#verificar-que-est%C3%A1s-an%C3%B3nimo)
2. [Búsqueda de Personas](#b%C3%BAsqueda-de-personas) - [google dorks — Base de Datos Categorizada](#google-dorks--base-de-datos-categorizada) - [Sherlock — Buscar Username en 400+ Redes](#sherlock--buscar-username-en-400-redes) - People Search Engines — [comparación](#people-search-engines--comparaci%C3%B3n)
3. [Búsqueda de Emails](#b%C3%BAsqueda-de-emails) - [Hunter.io](#hunterio) - [haveibeenpwned — Brechas de Seguridad](#haveibeenpwned--brechas-de-seguridad) - [holehe — Verificar Registros por Email](#holehe--verificar-registros-por-email) - [Email Verification Techniques](#email-verification-techniques) - Email [osint Automation Script](#email-osint-automation-script)
4. [Búsqueda de Teléfonos](#b%C3%BAsqueda-de-tel%C3%A9fonos) - [TrueCaller](#truecaller) - [WhatsApp Lookup](#whatsapp-lookup) - [NumLookup API](#numlookup-api) - [PhoneInfoga](#phoneinfoga) - [Sync.me](#syncme) - [OSINT Framework para Teléfonos](#osint-framework-para-tel%C3%A9fonos)
5. [Username Tracking](#username-tracking)
6. [Image OSINT](#image-osint) - [Reverse Image Search — Estrategias](#reverse-image-search--estrategias) - [Metadata Analysis — EXIF Deep Dive](#metadata-analysis--exif-deep-dive) - [Facial Recognition Tools](#facial-recognition-tools) - [Geolocation OSINT a partir de Fotos](#geolocation-osint-a-partir-de-fotos)
7. [Document Metadata Analysis](#document-metadata-analysis) - [Office Documents](#office-documents) - [PDF Metadata](#pdf-metadata) - [Limpiar Metadata](#limpiar-metadata-para-opsec-propio)
8. [redes Sociales](#redes-sociales) - [Instagram OSINT](#instagram-osint) - [Twitter/X OSINT](#twitterx-osint) - [Facebook OSINT](#facebook-osint) - [LinkedIn OSINT](#linkedin-osint) - [Cross Platform](#instagram--facebook--linkedin--cross-platform)
9. [Geolocalización OSINT](#geolocalizaci%C3%B3n-osint) - [Desde Coordenadas GPS](#desde-coordenadas-gps) - [Desde Fotos](#desde-fotos-post-geotags-check-ins) - [Social Media Geolocation](#social-media-geolocation) - [Shadow Mapping](#shadow-mapping-con-herramientas)
10. [Corporate OSINT](#corporate-osint) - [Estructura Organizacional](#encontrar-estructura-organizacional) - [Emails Corporativos](#encontrar-emails-corporativos) - [Job Postings como OSINT](#job-postings-como-osint)
11. [Data Breach Databases](#data-breach-databases)
12. [Telegram y Discord OSINT](#telegram-y-discord-osint)
13. [Cryptocurrency Tracking](#cryptocurrency-tracking)
14. [Automation OSINT Scripts](#automation-osint-scripts)
15. [Herramientas Todo-en-Uno](#herramientas-todo-en-uno)
16. [Resumen de Ciclo OSINT](#resumen-de-ciclo-osint)
17. [Precauciones Legales y Éticas](#precauciones-legales-y-%C3%A9ticas)
18. [OSINT Automation — Scripts Avanzados](#osint-automation---scripts-avanzados)
19. [100+ Google Dorks Organizados por Categoria](#100-google-dorks-organizados-por-categoria)
20. [Corporate OSINT Detallado](#corporate-osint-detallado)
21. [Dark Web OSINT](#dark-web-osint)
22. [Cryptocurrency OSINT](#cryptocurrency-osint-1)
[osint](../raw/0s1nt.md) (Open Source Intelligence) es la recolección y análisis de información de fuentes públicas. No es solo "Google y listo" — es una metodología sistemática para encontrar información que la gente o empresas dejan expuesta sin darse cuenta.

## opsecc (o[perational security](./raw/0ps3c Antes de Empezar

Antes de hacer cualquier investigación [osint](../raw/0s1nt.md), tenés que proteger tu identidad. Si el objetivo descubre que lo estás investigando, puede cambiar su comportamiento, eliminar información, o incluso tomar acciones legales contra vos.

### Qué Usar para Mantener el [anonimato](../raw/4n0n1m4t0.md)

1. **[vpn](../raw/4n0n1m4t0.md#vpn) confiable** que no guarde logs (Mullvad, ProtonVPN, IVPN).
2. **[tor](../raw/4n0n1m4t0.md#tor) Browser** para consultas sensibles (cada consulta sale por un nodo distinto).
3. **Máquina virtual** con [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) separado ([tails](../raw/4n0n1m4t0.md#tails) OS es ideal).
4. **Cuentas desechables** para servicios que requieran registro.
5. **Proxies rotatorios** si necesitás hacer scraping a gran escala.

### Qué NO Hacer

- No usés tu cuenta personal de Google/Gmail para buscar.
- No accedas a perfiles de [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales con tu cuenta real.
- No descargues archivos sospechosos en tu máquina principal.
- No uses el mismo [navegador](../raw/br0ws3r-3xpl01t4t10n.md) para OSINT y actividades personales.
- No confíes en que la VPN te protege al 100% ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) leaks, WebRTC leaks).

### Verificar que Estás Anónimo

```bash
# Verificar IP actual
curl ifconfig.me

# Verificar DNS leaks
curl https://dnsleaktest.com

# Verificar WebRTC leaks (en el navegador)
# Andá a: https://browserleaks.com/webrtc

# Verificar que Tor funciona
curl --socks5 127.0.0.1:9050 https://check.torproject.org/api
```

## Búsqueda de personas

### [google dorks](../raw/0s1nt.md#google-dorks) — Base de Datos Categorizada

Los Google Dorks son operadores de búsqueda avanzada que permiten encontrar información que no aparece en búsquedas normales.

#### Operadores Básicos

| Operador | Ejemplo | Qué hace |
|----------|---------|----------|
| `site:` | `site:linkedin.com` | Limita a un dominio |
| `filetype:` | `filetype:pdf` | Busca por tipo de archivo |
| `intitle:` | `intitle:"index of"` | Busca en el título |
| `inurl:` | `inurl:admin` | Busca en la URL |
| `intext:` | `intext:"password"` | Busca en el body |
| `".."` | `"nombre apellido"` | Búsqueda exacta |
| `-` | `-site:facebook.com` | Excluye un sitio |
| `*` | `"nombre * apellido"` | Comodín |
| `OR` | `"password" OR "contraseña"` | Alternativas |
| `.` | `$10.$100` | Rango numérico |

#### Dorks para [redes](../raw/r3d3s-f0nd4m3nt0s.md) Sociales

```bash
# Facebook
site:facebook.com "Nombre Apellido"
site:facebook.com "Nombre Apellido" "Buenos Aires"
site:facebook.com intitle:profile "Nombre" "Apellido"
site:facebook.com "fotos de" "Nombre Apellido"
site:facebook.com/public/"Nombre-Apellido"

# Instagram
site:instagram.com "username"
site:instagram.com "Nombre Apellido" -"No hay publicaciones"
site:instagram.com/p/ "username"  # posts específicos

# LinkedIn
site:linkedin.com/in "Nombre Apellido"
site:linkedin.com/in "Nombre" "Apellido" "Argentina"
site:linkedin.com "desarrollador" "Buenos Aires" "Python"
site:linkedin.com/in "empresa" "CEO" -"consultora"

# Twitter/X
site:twitter.com "Nombre Apellido" "Buenos Aires"
site:twitter.com "username" since:2024-01-01
site:twitter.com "email@dominio.com"

# TikTok
site:tiktok.com "@username"
site:tiktok.com "Nombre Apellido" "Argentina"

# Reddit
site:reddit.com "Nombre Apellido"
site:reddit.com user/username
site:reddit.com "email@dominio.com"
site:reddit.com "teléfono" "consulta" OR "ayuda"
```

#### Dorks para Documentos

```bash
# Documentos filtrados
"nombre@email.com" filetype:pdf
"nombre@email.com" filetype:xlsx OR filetype:xls
"nombre@email.com" filetype:csv
"nombre@email.com" filetype:docx OR filetype:doc
"confidencial" OR "privado" filetype:pdf site:drive.google.com
"password" OR "contraseña" filetype:xls
"backup" filetype:sql OR filetype:bak
"username" "password" filetype:txt
"api_key" OR "apikey" filetype:txt
"ssh-rsa" "AAAAB3NzaC1yc2"  # claves SSH expuestas
```

#### Dorks para Bases de Datos y Servicios

```bash
# S3 Buckets
site:s3.amazonaws.com "empresa"
site:s3.amazonaws.com "backup"
site:s3.amazonaws.com "password" OR "config"
site:s3.amazonaws.com "wp-config"

# Google Cloud / Firebase
site:firebaseio.com "empresa"
site:appspot.com "empresa"
site:googleapis.com "empresa" "api_key"

# GitHub (código fuente)
site:github.com "empresa" "password"
site:github.com "empresa" "api_key" OR "token"
site:github.com "empresa" "aws_access_key"
site:github.com "empresa" "-----BEGIN RSA PRIVATE KEY-----"

# Pastebin
site:pastebin.com "empresa"
site:pastebin.com "password" "empresa"
site:pastebin.com "dominio.com"
site:pastebin.com "api_key"
site:pastebin.com "ssh" "empresa"

# Trello
site:trello.com "empresa" "contraseña"
site:trello.com "empresa" "confidencial"

# Jira / Confluence
site:jira.empresa.com "password"
site:confluence.empresa.com "confidencial"

# Bases de datos expuestas
inurl:phpmyadmin "empresa"
intitle:"MongoDB" "empresa" "admin"
intitle:"Kibana" "empresa"
intitle:"Jenkins" "empresa"
```

#### Dorks para Cámaras y Dispositivos

```bash
# Cámaras IP sin autenticación
intitle:"Live View / - AXIS" | inurl:view/view.shtml
intitle:"webcam 7" inurl:"8080"
inurl:top.htm inurl:currenttime
intitle:"i-Catcher Console" -"Login"

# Routers y dispositivos
intitle:"Router" "admin" "password"
inurl:"cgi-bin" "login"
intitle:"Login" "D-Link" "Administrator"
intitle:"Administración" "Router" "password"
```

#### Dorks Combinados Avanzados

```bash
# Encontrar email de una persona específica
"nombre@email.com" OR "nombre@gmail.com" OR "nombre@hotmail.com"
"Nombre Apellido" (email OR mail OR contacto)
"Nombre Apellido" (gmail OR hotmail OR yahoo OR outlook)

# Encontrar mencionés en foros y sitios técnicos
"Nombre Apellido" site:stackoverflow.com
"Nombre Apellido" site:github.com
"Nombre Apellido" site:medium.com
"Nombre Apellido" site:blogspot.com OR site:wordpress.com

# Encontrar datos filtrados de una empresa
"empresa" filetype:xls OR filetype:csv "email" "teléfono"
"empresa" filetype:pdf "confidencial" OR "interno"
"empresa" intitle:"nómina" OR "nominas" OR "empleados"

# Encontrar cv/resumes publicados
intitle:"Curriculum" OR intitle:"CV" "Nombre"
intitle:"Curriculum" OR intitle:"CV" "email" filetype:pdf
"curriculum" "teléfono" "Nombre" site:docs.google.com
```

### Sherlock — Buscar Username en 400+ redes

Sherlock busca un mismo username en cientos de redes sociales y servicios web.

```bash
# Búsqueda básica
sherlock username

# Con timeout y output
sherlock username --timeout 10 --output resultados.txt

# Buscar múltiples usernames
sherlock user1 user2 user3 --output multiple.txt

# Solo HTTP (sin Tor)
sherlock username --no-proxy

# Con Tor
sherlock username --proxy socks5://127.0.0.1:9050

# Formato de output
sherlock username --csv resultados.csv
sherlock username --json resultados.json
sherlock username --xlsx resultados.xlsx

# No guardar resultados
sherlock username --print-found
```

**Resultado típico:**
```
[*] Checking username testuser on:
[+] 500px: https://500px.com/testuser
[+] 9GAG: https://9gag.com/u/testuser
[+] About.me: https://about.me/testuser
[+] Academia.edu: https://independent.academia.edu/testuser
[-] Adafruit: Not found!
[+] Adobe Forums: https://forums.adobe.com/people/testuser
[+] AngelList: https://angel.co/u/testuser
..
```

#### Sherlock Alternativas

```bash
# Maigret (más redes, más rápido, mejor output)
maigret username
maigret username --all --output resultados
maigret username --pdf-report reporte.pdf

# Holehe (solo email, pero muestra registros en servicios)
holehe email@test.com

# WhatsMyName (versión web, lista actualizada)
# https://whatsmyname.app/

# Social-analyzer (CLI + web)
social-analyzer --username "username" --output "json"

# Blackbird (otra alternativa en Python)
python blackbird.py --username "username"
```

| Herramienta | Redes | Velocidad | Output | Ventaja Principal |
|-------------|-------|-----------|--------|-------------------|
| **Sherlock** | 400+ | Media | TXT, CSV, JSON, XLSX | Más conocida, sencilla |
| **Maigret** | 3500+ | Alta | HTML, PDF, TXT | Muchas más redes, reportes |
| **Holehe** | 120+ | Alta | Consola | Verifica registros por email |
| **WhatsMyName** | 300+ | N/A (web) | Web | No requiere instalación |
| **Blackbird** | 200+ | Alta | JSON | Enfocado en [osint](../raw/0s1nt.md) |
| **Social-analyzer** | 1000+ | Media | JSON, HTML | API y CLI |

### People Search Engines — Comparación

#### Pipl

```bash
# Búsqueda en web: https://pipl.com
# Datos: nombre, email, teléfono, username
# Requiere pago para resultados completos
# API disponible (cara)

# Búsqueda directa desde URL:
https://pipl.com/search/?q=Nombre+Apellido&email=email@test.com
https://pipl.com/search/?q=Nombre+Apellido&phone=54123456789
```

#### Spokeo

```bash
# Búsqueda en web: https://spokeo.com
# Datos: nombre, email, teléfono, dirección, familiares, vecinos
# Modelo freemium (vista previa gratis, datos completos pago)

# Ejemplo de búsqueda:
https://www.spokeo.com/Nombre-Apellido
```

#### BeenVerified

```bash
# Búsqueda en web: https://beenverified.com
# Datos: nombre, email, teléfono, dirección, registros criminales
# Pago, pero tiene los datos más completos de USA
```

#### TruePeopleSearch (Gratis)

```bash
# Búsqueda en web: https://truepeoplesearch.com
# Gratis pero solo USA
# Datos: nombre, teléfono, dirección, edad, familiares

# Ejemplo:
https://www.truepeoplesearch.com/results?name=Nombre+Apellido
```

#### Comparación de Servicios

| Servicio | Precio | Cobertura | Datos que ofrece |
|----------|--------|-----------|------------------|
| **Pipl** | Pago ($) | Global | Email, redes sociales, perfiles |
| **Spokeo** | Pago ($) | USA+Global | Dirección, teléfono, familiares |
| **BeenVerified** | Pago ($) | USA | Registros criminales, direcciones |
| **TruePeopleSearch** | Gratis | USA | Teléfono, dirección, edad |
| **Whitepages** | Freemium | USA+Canadá | Teléfono, dirección |
| **Intelius** | Pago ($) | USA | Antecedentes, direcciones |

## Búsqueda de Emails

### Hunter.io

Hunter encuentra emails asociados a un dominio.

```bash
# API
curl "https://api.hunter.io/v2/domain-search?domain=empresa.com&api_key=KEY"

# Ejemplo de resultado:
{ "data": { "domain": "empresa.com", "emails": [ { "value": "ceo@empresa.com", "type": "office", "confidence": 99, "first_name": "Carlos", "last_name": "Pérez", "position": "CEO" }, { "value": "admin@empresa.com", "type": "generic", "confidence": 95 } ] }
}

# Búsqueda por nombre y dominio
curl "https://api.hunter.io/v2/email-finder?domain=empresa.com&first_name=Carlos&last_name=Pérez&api_key=KEY"

# Verificar si un email existe
curl "https://api.hunter.io/v2/email-verifier?email=ceo@empresa.com&api_key=KEY"
```

### haveibeenpwned — Brechas de Seguridad

```bash
# Verificar si un email estuvo en una brecha
curl -H "hibp-api-key: KEY" "https://haveibeenpwned.com/api/v3/breachedaccount/email@test.com"

# Verificar si una contraseña fue filtrada
curl "https://api.pwnedpasswords.com/range/21BD1"  # primeros 5 chars del hash SHA-1

# Ver todas las brechas de un email
curl "https://haveibeenpwned.com/api/v3/breachedaccount/email@test.com?truncateResponse=false"

# Ver pastes (no oficial, requiere HIBP API key)
curl "https://haveibeenpwned.com/api/v3/pasteaccount/email@test.com"
```

### holehe — Verificar Registros por Email

Holehe checkea si un email está registrado en 120+ servicios sin enviar un solo email.

```bash
# Básico
holehe email@test.com

# Con output detallado
holehe email@test.com --only-used

# Sin output de servicios sin registrar
holehe email@test.com --no-clean

# Con colores (default)
holehe email@test.com --no-color

# Salida en CSV
holehe email@test.com --csv output.csv
```

**Salida típica:**
```
[+] Email: email@test.com

[+] Adobe.com: REGISTRADO
[+] Amazon: NO REGISTRADO
[+] Apple: REGISTRADO (apple id)
[+] Atlassian: NO REGISTRADO
[+] Bitbucket: NO REGISTRADO
[+] Booking: REGISTRADO
[+] Discord: REGISTRADO
[+] Dropbox: NO REGISTRADO
[+] Facebook: REGISTRADO
[+] Flickr: NO REGISTRADO
[+] GitHub: REGISTRADO
[+] Google: REGISTRADO
[+] Instagram: REGISTRADO
[+] LinkedIn: REGISTRADO
[+] Medium: NO REGISTRADO
[+] Paypal: NO REGISTRADO
[+] Pinterest: REGISTRADO
[+] Reddit: REGISTRADO
[+] Snapchat: NO REGISTRADO
[+] Spotify: REGISTRADO
[+] Telegram: NO REGISTRADO
[+] TikTok: REGISTRADO
[+] Twitter: REGISTRADO
[+] WordPress: REGISTRADO
[+] Yahoo: NO REGISTRADO
[+] YouTube: REGISTRADO
```

### Email Verification Techniques

#### SMTP Check (Verificar sin Enviar Email)

podés verificar si un email existe conectándote al servidor SMTP y viendo si acepta el RCPT TO:

```python
# smtp_check.py
import smtplib
import dns.resolver

def verificar_email(email): dominio = email.split('@')[1] # Obtener MX records try: records = dns.resolver.resolve(dominio, 'MX') mx_record = str(records[0].exchange) except: return "No MX records found" # Conectar al servidor SMTP try: server = smtplib.SMTP(timeout=10) server.connect(mx_record) server.helo server.mail('check@test.com') code, message = server.rcpt(email) server.quit if code == 250: return f"VALIDO - {email}" elif code == 550: return f"INVALIDO - {email}" else: return f"DESCONOCIDO ({code}) - {email}" except Exception as e: return f"ERROR - {str(e)}"

# Uso
print(verificar_email("test@gmail.com")
print(verificar_email("test@empresa-inexistente.xyz")
```

#### MX Lookup

```bash
# Ver registros MX de un dominio
dig empresa.com MX

nslookup -type=MX empresa.com

dnsrecon -d empresa.com -t mx
```

#### Catch-All Detection

Algunos dominios aceptan cualquier email (catch-all). Detectarlos:

```bash
# Si test@empresa.com y abcdef@empresa.com dan el mismo resultado
# es probable que tenga catch-all

# Probar varias direcciones inexistentes
for i in {1.5}; do echo "test$i@empresa.com"
done | while read email; do smtp-check "$email"
done
```

### Email [osint](../raw/0s1nt.md) Automation Script

```python
# email_osint.py
import subprocess
import json
import requests

EMAIL = "email@test.com"

class EmailOSINT: def __init__(self, email): self.email = email self.dominio = email.split('@')[1] def hunter_io(self, api_key=None): if not api_key: return "No API key" r = requests.get( f"https://api.hunter.io/v2/email-verifier?email={self.email}&api_key={api_key}" ) return r.json def hibp_check(self, api_key=None): if not api_key: return "No API key" r = requests.get( f"https://haveibeenpwned.com/api/v3/breachedaccount/{self.email}", headers={"hibp-api-key": api_key} ) return r.json if r.status_code == 200 else def holehe_check(self): result = subprocess.run( ["holehe", self.email, "--only-used", "--no-color"], capture_output=True, text=True ) return result.stdout def mx_lookup(self): result = subprocess.run( ["dig", self.dominio, "MX", "+short"], capture_output=True, text=True ) return result.stdout.strip.split('\n') def dns_lookup(self): result = subprocess.run( ["dig", self.dominio, "ANY", "+short"], capture_output=True, text=True ) return result.stdout.strip.split('\n') def report(self): print(f"\n{'='*60}") print(f"OSINT Report para: {self.email}") print(f"{'='*60}") print(f"\n[1] MX Records ({self.dominio}):") for mx in self.mx_lookup: print(f"  - {mx}") print(f"\n[2] Servicios Registrados (holehe):") print(self.holehe_check) print(f"\n[3] Brechas (HIBP):") breaches = self.hibp_check("API_KEY_AQUI") for b in breaches: print(f"  - {b['Name']}: {b['BreachDate']}")

# Usar
analyzer = EmailOSINT("email@test.com")
analyzer.report
```

## Búsqueda de Teléfonos

### TrueCaller

```bash
# API no oficial (cambiante)
curl -X GET "https://api4.truecaller.com/v1/appUserDetails?phone=54123456789" \ -H "Content-Type: application/json" \ -H "Authorization: Bearer TOKEN_AQUI"

# Búsqueda manual: guardar el número en contactos
# → abrir TrueCaller → ver nombre asociado
# → WhatsApp → ver foto de perfil y "última vez"
```

### WhatsApp Lookup

```bash
# Si tenés el número, agregalo a contactos y abrí WhatsApp
# Podés ver:
# - Foto de perfil
# - "Última vez" / "En línea"
# - Info de perfil (si tiene)
# - Estado de WhatsApp

# URLs directas:
https://wa.me/54123456789
https://api.whatsapp.com/send?phone=54123456789
```

### NumLookup API

```bash
curl "https://api.numlookup.com/phone/+54123456789?key=KEY"

# Resultado típico:
{ "valid": true, "number": "+54123456789", "local_format": "01123456789", "country": "Argentina", "country_code": "AR", "carrier": "Personal", "line_type": "mobile", "location": "Buenos Aires"
}
```

### PhoneInfoga

PhoneInfoga es una herramienta [osint](../raw/0s1nt.md) para números de teléfono:

```bash
# Escanear número
phoneinfoga scan -n "+54123456789"

# Usar servicios externos
phoneinfoga scan -n "+54123456789" --no-reverse

# Con output JSON
phoneinfoga scan -n "+54123456789" --format json

# Servidores de números (conocer operador)
phoneinfoga scan -n "+54123456789" --servers

# Buscar en redes sociales
phoneinfoga search -n "+54123456789"
```

### Sync.me

```bash
# Sync.me es similar a TrueCaller
# App mobile que identifica llamadas
# Base de datos de números con nombres

# Búsqueda manual:
# https://sync.me/search/?number=54123456789
```

### OSINT Framework para Teléfonos

| Servicio | URL | Qué ofrece |
|----------|-----|------------|
| **TrueCaller** | httpss)://truecaller.[com](../raw/w1n-s9bsyst3ms.md#com) | Nombre asociado |
| **Sync.me** | [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://sync.me | Nombre, spam |
| **NumLookup** | https://numlookup.com | Operador, ubicación |
| **PhoneInfoga** | CLI | Escaneo completo |
| **WhatsApp** | https://wa.me/NUMERO | Foto de perfil |
| **Telegram** | https://t.me/USERNAME | Ver si tiene Telegram |
| **Signal** | Buscar en la app | Ver si tiene Signal |
| **CallerID** | https://callerid.com | Nombre, ubicación |
| **ReversePhoneCheck** | https://reversephonecheck.com | Nombre, dirección |

## Username Tracking

además de Sherlock, hay técnicas manuales para trackear un username:

```bash
# Buscar en motores de búsqueda
"username" site:github.com
"username" site:stackoverflow.com
"username" site:reddit.com
"username" site:medium.com
"username" site:dev.to
"username" site:keybase.io
"username" site:hackerone.com

# Usar Google Images para buscar avatar
# Subí la foto de perfil a Google Images
# → buscá dónde más aparece ese avatar

# Buscar en Pastebin
site:pastebin.com "username"

# Buscar en foros
"username" "ha escrito" OR "posts" OR "mensajes"
```

## Image [osint](../raw/0s1nt.md)

### Reverse Image Search — Estrategias

```bash
# Google Images (mejor cobertura general)
# https://images.google.com
# Subí la imagen o pegá la URL

# TinEye (mejor para tracking, busca por hash)
# https://tineye.com
# No encuentra imágenes similares, solo idénticas

# Yandex Images (mejor para rostros, Rusia)
# https://yandex.com/images/
# Excelente para encontrar versiones de alta calidad

# Bing Images
# https://www.bing.com/images
# Bueno para complementar Google

# Baidu Images (mejor para contenido chino)
# https://image.baidu.com
```

### Metadata Analysis — EXIF Deep Dive

```bash
# Leer todos los metadatos
exiftool foto.jpg

# GPS coordinates
exiftool -GPSLatitude -GPSLongitude -n foto.jpg
# -n da formato decimal en vez de grados/minutos/segundos

# Extraer solo metadatos relevantes
exiftool -G -s -n foto.jpg | grep -E "GPS|Camera|Date|Software|Maker|Model|Create"

# Ver todos los tags disponibles
exiftool -list foto.jpg

# Extraer miniatura oculta
exiftool -b -ThumbnailImage foto.jpg > thumbnail.jpg

# Ver historial de ediciones
exiftool -History foto.jpg
exiftool -DocumentID foto.jpg
exiftool -InstanceID foto.jpg

# Extraer metadatos en JSON
exiftool -json foto.jpg
```

#### Datos que podés encontrar en una foto

```bash
# Cámara
exiftool -Make -Model -Software foto.jpg
# → "iPhone 15 Pro Max" "iOS 17.3.1"

# Fecha y hora
exiftool -DateTimeOriginal -OffsetTimeOriginal foto.jpg
# → "2024:03:15 14:30:22" "-03:00" (Argentina)

# GPS (si está habilitado)
exiftool -GPSLatitude -GPSLongitude -GPSAltitude -GPSImgDirection foto.jpg
# → "-34.6117" "-58.3812" (Buenos Aires)

# Geolocalización exacta con Google Maps
# Abrí: https://www.google.com/maps?q=-34.6117,-58.3812

# Editor de fotos usado
exiftool -Software foto.jpg
# → "Adobe Photoshop Lightroom 6.0"
```

#### Script para Analizar Múltiples Fotos

```python
# photo_analyzer.py
import subprocess
import json
import os
import sys

def analizar_foto(path): result = subprocess.run( ["exiftool", "-json", "-G", "-n", path], capture_output=True, text=True ) data = json.loads(result.stdout)[0] info = {} # GPS if "EXIF:GPSLatitude" in data and "EXIF:GPSLongitude" in data: info["gps"] = { "lat": data["EXIF:GPSLatitude"], "lon": data["EXIF:GPSLongitude"], "maps_url": f"https://www.google.com/maps?q={data['EXIF:GPSLatitude']},{data['EXIF:GPSLongitude']}" } # Cámara if "EXIF:Make" in data: info["camera"] = f"{data.get('EXIF:Make', '')} {data.get('EXIF:Model', '')}" # Fecha if "EXIF:DateTimeOriginal" in data: info["date"] = data["EXIF:DateTimeOriginal"] # Software if "EXIF:Software" in data: info["software"] = data["EXIF:Software"] # Dimensiones if "File:ImageWidth" in data: info["dimensions"] = f"{data['File:ImageWidth']}x{data['File:ImageHeight']}" return info

def escanear_directorio(dir_path): results = {} for root, dirs, files in os.walk(dir_path): for file in files: if file.lower.endswith('.jpg', '.jpeg', '.png', '.heic'): path = os.path.join(root, file) results[path] = analizar_foto(path) return results

# Uso
if __name__ == "__main__": if len(sys.argv) > 1: target = sys.argv[1] if os.path.isdir(target): results = escanear_directorio(target) for path, info in results.items: print(f"\n{path}:") print(json.dumps(info, indent=2) else: info = analizar_foto(target) print(json.dumps(info, indent=2)
```

### Facial Recognition Tools

#### Pimeyes

```bash
# https://pimeyes.com
# Búsqueda por rostro (subís una foto, busca en toda la web)
# Versión gratuita: resultados limitados, con blur
# Versión paga: resultados completos, sin blur

# Estrategia:
# 1. Subí la mejor foto disponible (selfie, foto de perfil)
# 2. Ajustá el recorte para que solo incluya la cara
# 3. Revisá los resultados uno por uno
# 4. Usá diferentes fotos del mismo target
```

#### Search4faces

```bash
# https://search4faces.com
# Similar a Pimeyes pero ruso
# Gratuito, busca principalmente en redes sociales rusas (VK, Odnoklassniki)
# Buenos resultados para targets de Europa del Este
```

#### FaceCheck.ID

```bash
# https://facecheck.id
# Otro buscador facial
# Base de datos: redes sociales, noticias, registros públicos
# Modelo pago con prueba gratuita
```

### Geolocation OSINT a partir de Fotos

#### Shadow Analysis

La dirección y longitud de las sombras en una foto pueden decirte aproximadamente la hora y la ubicación geográfica.

```bash
# 1. Determiná la dirección de la sombra (N, S, E, O)
# 2. Medí la longitud relativa de la sombra vs el objeto
# 3. Usá herramientas como suncalc.org para estimar:
# - Latitud basada en el ángulo del sol
# - Hora del día
# - Época del año

# Herramientas:
# https://www.suncalc.org
# https://www.timeanddate.com/sun/
# https://shademap.app
```

#### Google Earth Techniques

```bash
# Si tenés coordenadas o lugar aproximado:
# 1. Abrí Google Earth
# 2. Buscá el área general
# 3. Analizá:
# - Edificios y puntos de referencia
# - Vegetación (clima/zona geográfica)
# - Infraestructura (tipo de calles, postes de luz)
# - Señales de tráfico (idioma, formato)
# - Patrones de estacionamiento

# Google Earth tiene capas históricas:
# → Ver → Imágenes históricas
# Podés ver cómo cambió un lugar en el tiempo
```

## Document Metadata Analysis

### Office Documents

Los documentos de Office (Word, Excel, PowerPoint) contienen MUCHA metadata oculta.

```bash
# Word (.docx)
exiftool documento.docx
# → Autor, última modificación por, empresa, fecha de creación
# → Versiones anteriores (si tracked changes está activado)
# → Nombre de la PC donde se creó
# → Plantilla usada

# Excel (.xlsx)
exiftool libro.xlsx
# → Autor, empresa, fechas
# → Nombres de hojas ocultas
# → Conexiones externas (URLs a otros servidores)
# → Macros (VBA code)

# PowerPoint (.pptx)
exiftool presentacion.pptx
# → Autor, empresa, comentarios
# → Notas del presentador (pueden contener info sensible)
# → Fuentes usadas
```

#### Extraer Metadata de Documentos de Office XML

Los formatos .docx, .xlsx, .pptx son archivos Zip. podés extraerlos y leer el XML directamente:

```bash
# Descomprimir
unzip documento.docx -d doc_descomprimido/

# Ver metadata principal
cat doc_descomprimido/docProps/core.xml
# → Muestra: autor, título, fechas, categorías

# Ver metadata extendida
cat doc_descomprimido/docProps/app.xml
# → Muestra: aplicación usada, versiones, seguridad

# Ver comentarios
cat doc_descomprimido/word/comments.xml

# Ver tracked changes
cat doc_descomprimido/word/document.xml | grep -o '<ins[^>]*>.*</ins>' | head -5

# Ver cabeceras y pies de página
cat doc_descomprimido/word/header1.xml
cat doc_descomprimido/word/footer1.xml
```

### PDF Metadata

```bash
# Básico con pdfinfo
pdfinfo documento.pdf
# → Autor, creador (software), productor, fechas
# → Versión PDF, número de páginas
# → Encriptación

# Con exiftool
exiftool documento.pdf
# → Más detallado: modificaciones, identificadores únicos

# Extraer metadatos XML del PDF
pdfinfo -meta documento.pdf

# Ver todos los objetos en el PDF
pdfdetach -list documento.pdf
# Puede tener archivos adjuntos ocultos

# Extraer metadatos XMP
exiftool -XMP:All documento.pdf

# Ver metadatos raw
strings documento.pdf | grep -i "author\|creator\|subject"
```

### Limpiar Metadata (Para opsecc Propio)

```bash
# En Windows: Propiedades del archivo → Detalles → Eliminar propiedades

# En Linux con exiftool:
exiftool -all= foto.jpg # Eliminar TODO
exiftool -all= -overwrite_original foto.jpg  # Sin crear backup

# Herramienta específica: MAT (Metadata Anonymisation Toolkit)
mat2 foto.jpg

# Para PDF:
exiftool -all= documento.pdf

# Para Office:
exiftool -all= documento.docx
```

## [redes](../raw/r3d3s-f0nd4m3nt0s.md) Sociales

### Instagram [osint](../raw/0s1nt.md)

```bash
# instaloader (la herramienta más completa)
instaloader profile username # Descargar perfil completo
instaloader --no-videos profile username # Solo fotos
instaloader --no-pictures profile username # Solo videos
instaloader --no-captions profile username # Sin captions
instaloader --no-compress-json profile username # Guardar JSON de metadata
instaloader --login USER --password PASS profile username  # Contenido privado (con cuenta)

# Analizar seguidores/seguidos
instaloader --story-viewer username # Ver vistas de historias
instaloader profile username -- -followers # Lista de seguidores
instaloader profile username -- -followees # Lista de seguidos

# Buscar por hashtag
instaloader "#tag"

# Buscar por ubicación
instaloader "location:123456789"

# Script para analizar seguidores
```

```python
# instagram_analyzer.py
# Analizar patrones de likes/comentarios entre perfiles
import json
import os
from collections import Counter

def analizar_instagram(username): path = f"Instagram/{username}/" if not os.path.exists(path): print(f"Primero descargá el perfil con: instaloader profile {username}") return # Cargar posts posts_file = f"{path}/{username}.json" if os.path.exists(posts_file): with open(posts_file, 'r', encoding='utf-8') as f: posts = json.load(f) print(f"\n[+] Análisis de {username}") print(f"  Posts: {posts.get('graphql', {}).get('user', {}).get('edge_owner_to_timeline_media', {}).get('count', 'N/A')}") print(f"  Seguidores: {posts.get('graphql', {}).get('user', {}).get('edge_followed_by', {}).get('count', 'N/A')}") print(f"  Siguiendo: {posts.get('graphql', {}).get('user', {}).get('edge_follow', {}).get('count', 'N/A')}") # Frecuencia de posts # Ubicaciones más comunes # Horarios de publicación
```

### Twitter/X OSINT

```bash
# Búsqueda avanzada desde URL
# https://twitter.com/search?q=(from%3Ausername)%20since%3A2024-01-01%20until%3A2024-12-31

# Operadores de búsqueda en Twitter/X
from:username # Tweets de ese usuario
to:username # Tweets dirigidos a ese usuario
@username # Menciones
#topic # Tweets con ese hashtag
"frase exacta" # Búsqueda exacta
lang:es # Filtro por idioma
min_replies:10 # Mínimo de respuestas
min_faves:100 # Mínimo de likes
min_retweets:50 # Mínimo de RTs
filter:media # Solo con fotos/videos
filter:images # Solo con imágenes
filter:videos # Solo con videos
filter:links # Solo con links
-url:links # Sin links
since:2024-01-01 # Desde fecha
until:2024-12-31 # Hasta fecha
near:"Buenos Aires" # Ubicación
within:10km # Radio

# Combinaciones útiles
from:username filter:replies  # Solo respuestas
from:username -filter:replies # Solo tweets (no respuestas)
from:username since:2024-01-01 filter:images  # Fotos desde 2024
```

### Facebook OSINT

```bash
# Graph API (limitado sin token)
curl "https://graph.facebook.com/v17.0/USERNAME?fields=id,name,email,about,photos&access_token=TOKEN"

# Página pública de Facebook
https://www.facebook.com/public/Nombre-Apellido

# Google Dorks para Facebook
site:facebook.com "Nombre Apellido" "Buenos Aires"
site:facebook.com "Nombre Apellido" photos
site:facebook.com "Nombre Apellido" posts
site:facebook.com "Nombre Apellido" friends

# Búsqueda de páginas
site:facebook.com "empresa" "about" OR "info"
site:facebook.com/pg/"página" posts

# Ver fotos de perfil públicamente
https://graph.facebook.com/USERNAME/picture?type=large
```

### LinkedIn OSINT

LinkedIn no tiene API pública, pero hay técnicas scraping:

```bash
# Búsqueda por Google Dorks
site:linkedin.com/in "Nombre Apellido"
site:linkedin.com/in "Título" "Empresa" "Buenos Aires"
site:linkedin.com "CEO" "empresa" -site:linkedin.com/jobs

# Herramientas para LinkedIn:
# - linkedin_username_osint (Python)
# - lix (email guessing)
# - InSpy (reconocimiento de empleados)
# - LinkedInt (scraping)

# Email guessing (patrones comunes)
# nombre@empresa.com
# nombre.apellido@empresa.com
# n.apellido@empresa.com
# nombre.apellido@empresa.com.ar
# nombrea@empresa.com
```

#### Email Guessing con Lix

```bash
# Lix genera posibles emails basados en nombre y dominio
lix -n "Carlos Pérez" -d empresa.com

# Resultado:
# carlos@empresa.com
# carlos.perez@empresa.com
# carlosperez@empresa.com
# cp@empresa.com
# c.perez@empresa.com
# carlos.perez@empresa.com.ar
```

### Instagram + Facebook + LinkedIn — Cross Platform

Mucha gente usa el mismo username en múltiples plataformas:

```bash
# Encontrar el username en Instagram, Facebook, LinkedIn, TikTok
# y analizar el contenido para armar un perfil completo

# Si en LinkedIn dice "Vivo en Buenos Aires, trabajo en MercadoLibre"
# y en Instagram publica fotos en un barrio específico:
# → Tenés ubicación laboral + ubicación residencial potencial

# Si usa el mismo email en múltiples servicios (holehe)
# → Podés rastrear actividad en decenas de plataformas
```

## Geolocalización [osint](../raw/0s1nt.md)

### Desde Coordenadas GPS

```bash
# Obtener dirección de coordenadas
curl "https://nominatim.openstreetmap.org/reverse?format=json&lat=-34.61&lon=-58.38"

# Google Maps
https://www.google.com/maps?q=-34.6117,-58.3812

# Street View
https://www.google.com/maps?q=-34.6117,-58.3812&layer=c

# Mapillary (fotos de calles colaborativas)
https://www.mapillary.com/app/?lat=-34.61&lng=-58.38&z=17
```

### Desde Fotos (Post Geotags, Check-ins)

```bash
# Exiftool + geolocalización automática:
exiftool -GPSLatitude -GPSLongitude -n imagen.jpg | \ awk '{print "https://www.google.com/maps?q="$2","$4}'

# Script que genera mapa con todas las fotos georreferenciadas:
```

```python
# geo_mapper.py
import subprocess
import json
import folium  # pip install folium

def fotos_a_mapa(directorio, output="mapa.html"): fotos = for root, dirs, files in os.walk(directorio): for file in files: if file.lower.endswith('.jpg', '.jpeg', '.png'): path = os.path.join(root, file) result = subprocess.run( ["exiftool", "-json", "-n", "-GPSLatitude", "-GPSLongitude", path], capture_output=True, text=True ) data = json.loads(result.stdout) if data and "GPSLatitude" in data[0]: fotos.append({ "file": file, "lat": data[0]["GPSLatitude"], "lon": data[0]["GPSLongitude"] }) if not fotos: print("No se encontraron fotos con GPS") return # Crear mapa m = folium.Map(location=[fotos[0]["lat"], fotos[0]["lon"]], zoom_start=12) for foto in fotos: folium.Marker( [foto["lat"], foto["lon"]], popup=foto["file"], icon=folium.Icon(color="red", icon="camera", prefix="fa") ).add_to(m) m.save(output) print(f"Mapa guardado en {output} con {len(fotos)} ubicaciones")
```

### Social Media Geolocation

```bash
# Snapchat geofiltros
# Si alguien usó un geofiltro de "Palermo Soho", está en Palermo

# Instagram location tags
# Cada post con ubicación tiene coordinates en el JSON

# Twitter/X geolocalización
# Algunos tweets tienen coordinates en la API
# Si no, analizar patrones: hora del tweet, contenido, fotos

# Foursquare/Swarm check-ins
# Check-ins públicos tienen ubicación exacta

# Strava (deportes)
# Rutas de running/ciclismo pueden mostrar exactamente dónde vive alguien
# Los mapas de calor de Strava son peligrosos para OPSEC
```

### Shadow Mapping con Herramientas

```bash
# https://www.suncalc.org
# Poné una fecha y ubicación → ves la sombra a cada hora

# Google Earth Pro
# Usá el slider histórico para ver cambios en el tiempo

# PeakFinder
# Identificación de montañas desde una foto de paisaje

# GeoGuessr / GeoTastic
# Entrenamiento para identificar ubicaciones por pistas visuales
```

## Corporate [osint](../raw/0s1nt.md)

### Encontrar Estructura Organizacional

```bash
# LinkedIn: buscar employees de una empresa
site:linkedin.com/in "empresa"
site:linkedin.com/in "empresa" "CEO"
site:linkedin.com/in "empresa" "CTO"
site:linkedin.com/in "empresa" "HR"
site:linkedin.com/in "empresa" "Desarrollador"

# Crunchbase (inversiones, funding, founders)
curl "https://api.crunchbase.com/v4/data/entities/organizations/empresa-inc?card_id=founders&user_key=KEY"

# RocketReach (emails, teléfonos de empleados)
# https://rocketreach.co

# Apollo.io (base de datos de contactos B2B)
# https://apollo.io
```

### Encontrar Emails Corporativos

```bash
# Hunter.io
curl "https://api.hunter.io/v2/domain-search?domain=empresa.com&api_key=KEY"

# Skrapp.io
curl "https://api.skrapp.io/v2/search?domain=empresa.com" \ -H "X-Access-Key: KEY"

# Snov.io
curl "https://api.snov.io/v2/domain-emails?domain=empresa.com" \ -H "Authorization: Bearer KEY"

# Anymail Finder
curl "https://api.anymailfinder.com/v3/search?domain=empresa.com&name=Carlos+Perez&api_key=KEY"
```

### Job Postings como OSINT

Las ofertas de trabajo revelan tecnología, estructura, y hasta salarios:

```bash
# Buscar ofertas de la empresa objetivo
site:linkedin.com/jobs "empresa"
site:computrabajo.com "empresa"
site:zonajobs.com "empresa"
site:glassdoor.com "empresa"

# Lo que revelan:
# - Stack tecnológico (buscás desarrollador Python, usan Python)
# - Salarios (dan rangos salariales)
# - Oficinas (dirección exacta)
# - Número de empleados (si están expandiendo)
# - Cultura empresarial (beneficios, horarios)
```

## Data Breach Databases

### Dehashtions)ed

```bash
# https://dehashed.com
# Base de datos de brechas con búsqueda por email, username, IP, nombre
# Pago ($3/día)

# Búsqueda programática:
curl "https://api.dehashed.com/v1/search?query=email@test.com&size=100" \ -u "email@test.com:API_KEY" \ -H "Accept: application/json"

# Búsqueda por tipo:
# email:email@test.com
# username:testuser
# ip_address:192.168.1.1
# name:"Carlos Perez"
# password:123456
# domain:empresa.com
```

### Snusbase

```bash
# https://snusbase.com
# Similar a Dehashed, modelo pago
# Ofrece búsqueda por email, username, IP, hash

# Búsqueda web:
# https://snusbase.com/search?q=email%3Dtest%40test.com
```

### LeakCheck

```bash
# https://leakcheck.io
# Base de datos de brechas, pago
# Búsqueda por email, username

# API:
curl "https://leakcheck.io/api/public?check=email@test.com&key=API_KEY"

# LeakCheck Pro:
curl "https://leakcheck.io/api/v2/check?query=email@test.com" \ -H "x-api-key: API_KEY"
```

### BreachDirectory

```bash
# https://breachdirectory.org
# API gratuita (limitada)

curl "https://breachdirectory.org/api/v3/search?func=auto&term=email@test.com"
```

### WeLeakInfo / Leakpeek

```bash
# Sitios similares que indexan brechas
# https://leakpeek.com
# https://weleakinfo.com (cerrado, pero hay mirrors)
```

## Telegram y Discord [osint](../raw/0s1nt.md)

### Telegram

```bash
# Buscar username en Telegram
https://t.me/USERNAME

# Buscar grupos públicos
https://t.me/s?q="empresa"
https://t.me/s?q="Nombre Apellido"

# Telegram Bot API (para grupos públicos)
curl "https://api.telegram.org/botTOKEN/getUpdates"

# Herramientas:
# - TeleScraper (scraping de grupos)
# - telegram-group-scraper
# - TeleSearch (búsqueda en mensajes)

# Buscar número de teléfono en Telegram
# Guardar el número en contactos → abrir Telegram
# → Si aparece, tiene Telegram
```

### Discord

```bash
# Discord no tiene API pública de búsqueda
# Pero hay herramientas OSINT:

# - DiscordServers.com (búsqueda de servidores)
# - Disboard.org (lista de servidores públicos)
# - DiscordBee (rastreo de usuarios)

# Buscar mensajes de un usuario específico
# Necesitás un bot con permisos en el servidor

# OSINT Hand:
# https://github.com/nonk123/Discord-OSINT
```

## Cryptocurrency Tracking

```bash
# Buscar transacciones de una wallet
https://etherscan.io/address/0x..
https://blockchain.com/btc/address/..
https://tronscan.org/#/address/..

# Explorar wallets relacionadas
# https://www.walletexplorer.com (Bitcoin)

# Combinar con OSINT clásico:
# - Si una wallet está asociada a un email o username
# - Si donaron a una causa pública
# - Si están en exchanges con KYC

# Herramientas:
# - chain.so (multi-chain)
# - blockchair.com (multi-chain search)
# - oxt.me (Bitcoin transaction graph)
```

## Automation [osint](../raw/0s1nt.md) Scripts

### Script Todo-en-Uno

```python
# osint_automatico.py
import subprocess
import json
import sys
import requests
import re

class OSINTer: def __init__(self, nombre, apellido, dominio=None): self.nombre = nombre self.apellido = apellido self.dominio = dominio self.results = { "person": f"{nombre} {apellido}", "social": , "emails": , "breaches": , "documents": , "images": } def buscar_redes_sociales(self): """Buscar perfiles en redes con Sherlock""" print("[*] Buscando redes sociales..") result = subprocess.run( ["sherlock", f"{self.nombre}{self.apellido}", "--print-found", "--timeout", "5"], capture_output=True, text=True ) self.results["social"] = result.stdout.strip.split('\n') def buscar_emails(self, dominio=None): """Generar posibles emails""" d = dominio or self.dominio if not d: return patrones = [ f"{self.nombre}@{d}", f"{self.nombre}.{self.apellido}@{d}", f"{self.nombre[0]}.{self.apellido}@{d}", f"{self.nombre}{self.apellido}@{d}", f"{self.nombre[0]}{self.apellido}@{d}" ] self.results["emails"] = patrones print(f"[*] Posibles emails: {len(patrones)} generados") def buscar_google_dorks(self): """Generar dorks para búsqueda manual""" dorks = [ f'site:linkedin.com/in "{self.nombre} {self.apellido}"', f'site:facebook.com "{self.nombre} {self.apellido}"', f'site:instagram.com "{self.nombre}{self.apellido}"', f'site:twitter.com "{self.nombre} {self.apellido}"', f'site:reddit.com "{self.nombre} {self.apellido}"', f'"{self.nombre} {self.apellido}" filetype:pdf', f'"{self.nombre} {self.apellido}" filetype:docx', f'"{self.nombre} {self.apellido}" filetype:xlsx', ] if self.dominio: dorks.append(f'"{self.nombre} {self.apellido}" site:{self.dominio}') print(f"\n[*] Dorks generados ({len(dorks)}):") for dork in dorks: print(f"  {dork}") self.results["dorks"] = dorks def report(self, output_file="osint_report.json"): print(f"\n{'='*60}") print(f"OSINT Report: {self.results['person']}") print(f"{'='*60}") if self.results["social"]: print(f"\n[Redes Sociales]") for s in self.results["social"][:20]: print(f"  {s}") if self.results["emails"]: print(f"\n[Posibles Emails]") for e in self.results["emails"]: print(f"  {e}") if self.results["dorks"]: print(f"\n[Dorks para Buscar]") for d in self.results["dorks"]: print(f"  {d}") with open(output_file, 'w', encoding='utf-8') as f: json.dump(self.results, f, indent=2, ensure_ascii=False) print(f"\n[+] Reporte guardado en {output_file}")

# Uso
if __name__ == "__main__": if len(sys.argv) < 2: print("Uso: python osint_automatico.py 'Nombre' 'Apellido' [dominio]") sys.exit(1) nombre = sys.argv[1] apellido = sys.argv[2] dominio = sys.argv[3] if len(sys.argv) > 3 else None osi = OSINTer(nombre, apellido, dominio) osi.buscar_redes_sociales osi.buscar_emails osi.buscar_google_dorks osi.report
```

### Dork Generator Automático

```bash
# python dorkgen.py -d dominio.com -t emails,passwords,docs
```

```python
# dorkgen.py
import argparse

CATEGORIAS = { "emails": [ '"@{dominio}" filetype:pdf', '"@{dominio}" filetype:xls', '"@{dominio}" filetype:csv', '"@{dominio}" filetype:txt', 'inurl:"{dominio}" "email"', 'site:pastebin.com "{dominio}"', 'site:docs.google.com "{dominio}"', ], "passwords": [ 'site:{dominio} "password"', 'site:{dominio} "contraseña"', 'site:{dominio} filetype:txt "pass"', 'site:{dominio} "login" filetype:txt', 'site:pastebin.com "{dominio}" "password"', 'site:github.com "{dominio}" "password"', ], "docs": [ 'site:{dominio} filetype:pdf "confidencial"', 'site:{dominio} filetype:pdf "interno"', 'site:{dominio} filetype:docx "privado"', 'site:{dominio} filetype:xlsx "salario" OR "sueldo"', 'site:{dominio} filetype:pdf "cliente" OR "proveedor"', 'site:drive.google.com "{dominio}" filetype:pdf', ], "config": [ 'site:{dominio} filetype:xml "config"', 'site:{dominio} filetype:env "DB"', 'site:{dominio} filetype:yml "database"', 'site:{dominio} filetype:json "api"', 'site:{dominio} filetype:ini "password"', ], "subdomains": [ 'site:*.{dominio} -site:www.{dominio}', 'site:{dominio} -inurl:www', 'inurl:{dominio} -inurl:www', ], "breaches": [ 'site:pastebin.com "{dominio}"', 'site:hastebin.com "{dominio}"', 'site:ghostbin.com "{dominio}"', '"@{dominio}" "password" filetype:txt', ],
}

def generate_dorks(dominio, categorias): print(f"# Dorks generados para: {dominio}") print(f"# Categorías: {', '.join(categorias)}") print dorks = for cat in categorias: if cat in CATEGORIAS: dorks.extend(CATEGORIAS[cat]) for dork in dorks: print(f'"{dork.format(dominio=dominio)}"')

if __name__ == "__main__": parser = argparse.ArgumentParser(description="Generador de Google Dorks") parser.add_argument("-d", "--dominio", required=True, help="Dominio a buscar") parser.add_argument("-t", "--tipos", nargs="+", default=["emails", "passwords", "docs"], help="Tipos de dork (emails, passwords, docs, config, subdomains, breaches)") args = parser.parse_args generate_dorks(args.dominio, args.tipos)
```

## Herramientas Todo-en-Uno

### [recon](../raw/0s1nt.md#reconocimiento)-ng

```bash
# Framework modular para OSINT y recon
recon-ng

# Dentro de recon-ng:
# Instalar módulos
marketplace search
marketplace install all

# Usar módulos
use recon/profiles/profiler
show options
set source username
run

# Exportar resultados
use reporting/list
show options
set filename resultados.html
run
```

### SpiderFoot

```bash
# Escaneo automatizado
python3 sf.py -s "email@test.com" -t all -o resultados.html

# Más específico
python3 sf.py -s "nombre apellido" -t sfp_google,sfp_linkedin -o reporte.html

# Modo servidor web
python3 sf.py -l 127.0.0.1:5001
```

### [maltego](../raw/0s1nt.md#maltego)

```bash
# GUI de transformadas OSINT
# Arrastrar "Person" → poner nombre
# Arrastrar "Email" → poner email
# Hacer clic derecho → Run Transform → buscar en redes sociales
# El grafo muestra relaciones entre entidades

# Transformadas útiles:
# Person → Social Media
# Email → Breaches
# Domain → DNS, WHOIS
# Phone → Carrier, Location
```

### Little Brother

```bash
# OSINT automation todo-en-uno
python3 little-brother.py --name "Nombre Apellido" --city "Buenos Aires"
python3 little-brother.py --name "Nombre Apellido" --email "email@test.com"
python3 little-brother.py --phone "+54123456789"
```

## Resumen de Ciclo [osint](../raw/0s1nt.md)

### Flujo de Trabajo Típico

```
Nombre completo / username / email / teléfono │ ├──→ Google Dorks → menciones públicas, documentos, perfiles ├──→ Sherlock/Maigret → redes sociales ├──→ Hunter → emails asociados a empresa └──→ Holehe → qué servicios usa │ ▼ ┌──→ HIBP → brechas de seguridad ├──→ Dehashed → contraseñas filtradas └──→ LeakCheck → datos en brechas │ ▼ ┌──→ exiftool → metadatos de fotos/documentos ├──→ Reverse Image Search → dónde más aparece └──→ Pimeyes → facial recognition │ ▼ ┌──→ Truecaller → nombre asociado a teléfono ├──→ PhoneInfoga → operador, ubicación └──→ WhatsApp/Telegram → foto de perfil │ ▼ ┌──→ Geolocalización → coordenadas ├──→ Google Maps → Street View └──→ OpenStreetMap → datos de ubicación │ ▼ ┌──→ Corporate OSINT → empleados, estructura ├──→ Job postings → stack, salarios └──→ Crunchbase → funding, founders
```

## Precauciones Legales y Éticas

- **Consentimiento**: No investigues a personas sin su consentimiento a menos que sea por razones legítimas (seguridad, investigación legal).
- **Términos de servicio**: El scraping de [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales viola los ToS de la mayoría de las plataformas.
- **Datos personales**: En Argentina, la Ley de Protección de Datos Personales (Ley 25.326) regula el tratamiento de información personal.
- **Evidencia**: Si estás recolectando evidencia para un caso legal, documentá todo el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) (cadena de custodia).
- **Falsos positivos**: Mucha información en línea es incorrecta o desactualizada. Verificá siempre con múltiples fuentes.
- **[opsec](../raw/0ps3c-pr0.md)**: Protegé tu propia identidad durante la investigación. Usá [vpn](../raw/4n0n1m4t0.md#vpn), [tor](../raw/4n0n1m4t0.md#tor), máquinas virtuales.
- **No compartir**: No compartas información encontrada sin necesidad. podés exponer a la persona investigada.
- **Contraseñas**: Si encontrás contraseñas en brechas, no intentes usarlas. Reportá el hallazgo al dueño.
## [osint](../raw/0s1nt.md) Automation - Scripts Avanzados

### Email Harvester desde Motores de Busqueda

```python
# email_harvester.py
import requests
import re
import time
from urllib.parse import quote

class EmailHarvester: def __init__(self, domain, delay=2): self.domain = domain self.delay = delay self.emails = set def search_google(self): print(f"[*] Buscando en Google: @{self.domain}") headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"} for page in range(0, 3): query = quote(f"@{self.domain}") url = f"https://www.google.com/search?q={query}&start={page*10}" try: r = requests.get(url, headers=headers, timeout=10) found = re.findall(r'[a-zA-Z0-9._%+-]+@' + re.escape(self.domain), r.text) self.emails.update(found) print(f"  Google: {len(found)} emails encontrados") time.sleep(self.delay) except Exception as e: print(f"  Error Google: {e}") def search_bing(self): print(f"[*] Buscando en Bing: @{self.domain}") headers = {"User-Agent": "Mozilla/5.0"} for page in range(1, 3): query = quote(f"@{self.domain}") url = f"https://www.bing.com/search?q={query}&first={page*10}" try: r = requests.get(url, headers=headers, timeout=10) found = re.findall(r'[a-zA-Z0-9._%+-]+@' + re.escape(self.domain), r.text) self.emails.update(found) time.sleep(self.delay) except: pass def search_pgp(self): print(f"[*] Buscando en servidores PGP: @{self.domain}") try: url = f"https://keyserver.ubuntu.com/pks/lookup?search={self.domain}&op=index" r = requests.get(url, timeout=10) found = re.findall(r'[a-zA-Z0-9._%+-]+@' + re.escape(self.domain), r.text) self.emails.update(found) print(f"  PGP: {len(found)} emails") except: pass def run(self): self.search_google self.search_bing self.search_pgp print(f"\n[+] Total: {len(self.emails)} emails unicos") for e in sorted(self.emails): print(f"  {e}") with open(f"emails_{self.domain}.txt", "w") as f: for e in sorted(self.emails): f.write(f"{e}\n") return list(self.emails)

harvester = EmailHarvester("empresa.com.ar")
harvester.run
```

### Domain Information Gathering

```python
# domain_osint.py
import subprocess, json, requests

class DomainOSINT: def __init__(self, domain): self.domain = domain self.data = {} def whois(self): print(f"[WHOIS] Consultando {self.domain}") try: result = subprocess.run(["whois", self.domain], capture_output=True, text=True, timeout=15) lines = result.stdout.split('\n') for line in lines[:30]: if ':' in line: k, v = line.split(':', 1) self.data[f"whois_{k.strip.lower}"] = v.strip except: pass def dns_records(self): print(f"[DNS] Consultando registros de {self.domain}") for record in ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA']: try: result = subprocess.run(["nslookup", "-type=" + record, self.domain], capture_output=True, text=True, timeout=5) self.data[f"dns_{record}"] = result.stdout.strip except: pass def subdomains(self): print(f"[SUBDOM] Buscando subdominios de {self.domain}") try: result = subprocess.run(["sublist3r", "-d", self.domain], capture_output=True, text=True, timeout=60) lines = result.stdout.split('\n') subs = [l.strip for l in lines if self.domain in l and not l.startswith('[')] self.data["subdomains"] = subs print(f"  Encontrados: {len(subs)} subdominios") except: # fallback con SecurityTrails try: url = f"https://api.securitytrails.com/v1/domain/{self.domain}/subdomains" # requiere API key pass except: pass def tech_stack(self): print(f"[TECH] Detectando tecnologias de {self.domain}") try: result = subprocess.run(["whatweb", self.domain], capture_output=True, text=True, timeout=30) self.data["technologies"] = result.stdout.strip print(f"  {result.stdout[:200]}") except: try: url = f"https://api.wappalyzer.com/v2/lookup?urls=https://{self.domain}" # requiere API key pass except: pass def report(self): print(f"\n{'='*50}") print(f"Domain OSINT Report: {self.domain}") print(f"{'='*50}") for k, v in self.data.items: if isinstance(v, list): print(f"\n{k}:") for item in v[:10]: print(f"  - {item}") else: print(f"\n{k}: {v[:200] if isinstance(v,str) and len(v)>200 else v}")

d = DomainOSINT("example.com")
d.whois
d.dns_records
d.subdomains
d.tech_stack
d.report
```

### Social Media Profile Discovery (Async)

```python
# social_scanner.py
import aiohttp
import asyncio

class SocialScanner: def __init__(self, username, timeout=5): self.username = username self.timeout = timeout self.platforms = { "GitHub": f"https://github.com/{username}", "Twitter": f"https://twitter.com/{username}", "Instagram": f"https://instagram.com/{username}", "LinkedIn": f"https://linkedin.com/in/{username}", "Reddit": f"https://reddit.com/user/{username}", "Medium": f"https://medium.com/@{username}", "Dev.to": f"https://dev.to/{username}", "Keybase": f"https://keybase.io/{username}", "HackerNews": f"https://news.ycombinator.com/user?id={username}", "Pinterest": f"https://pinterest.com/{username}", "TikTok": f"https://tiktok.com/@{username}", "YouTube": f"https://youtube.com/@{username}", "Telegram": f"https://t.me/{username}", "Facebook": f"https://facebook.com/{username}", "Twitch": f"https://twitch.tv/{username}", "Spotify": f"https://open.spotify.com/user/{username}", "Steam": f"https://steamcommunity.com/id/{username}", "WordPress": f"https://{username}.wordpress.com", "Blogger": f"https://{username}.blogspot.com", "About.me": f"https://about.me/{username}", "AngelList": f"https://angel.co/u/{username}", "Behance": f"https://behance.net/{username}", "Dribbble": f"https://dribbble.com/{username}", "Vimeo": f"https://vimeo.com/{username}", "SoundCloud": f"https://soundcloud.com/{username}", "Patreon": f"https://patreon.com/{username}", "BuyMeACoffee": f"https://buymeacoffee.com/{username}", "Linktree": f"https://linktr.ee/{username}", "TryHackMe": f"https://tryhackme.com/p/{username}", "HackTheBox": f"https://app.hackthebox.com/profile/{username}", "Replit": f"https://replit.com/@{username}", "Codepen": f"https://codepen.io/{username}", "StackOverflow": f"https://stackoverflow.com/users/{username}", "ProductHunt": f"https://producthunt.com/@{username}", "Mastodon": f"https://mastodon.social/@{username}", "Bsky": f"https://bsky.app/profile/{username}", } async def check_platform(self, session, name, url): try: async with session.get(url, timeout=self.timeout) as response: if response.status == 200: print(f"[+] {name}: {url}") return (name, url, True) elif response.status == 403 or response.status == 429: print(f"[?] {name}: Rate limited (403/429)") return (name, url, "rate_limited") except asyncio.TimeoutError: pass except Exception as e: pass return (name, url, False) async def run(self): print(f"[*] Escaneando redes para: {self.username}") print(f"[*] Plataformas a verificar: {len(self.platforms)}") connector = aiohttp.TCPConnector(limit=10) async with aiohttp.ClientSession(connector=connector) as session: tasks = [self.check_platform(session, name, url) for name, url in self.platforms.items] results = await asyncio.gather(*tasks) found = [r for r in results if r[2] == True] rate_limited = [r for r in results if r[2] == "rate_limited"] print(f"\n[+] Resultados:") print(f"  Perfiles encontrados: {len(found)}") for name, url, _ in found: print(f"  - {name}: {url}") if rate_limited: print(f"\n[!] Rate limited ({len(rate_limited)}):") for name, url, _ in rate_limited: print(f"  - {name}") with open(f"{self.username}_social.txt", "w") as f: for name, url, status in results: f.write(f"[{'OK' if status==True else 'RL' if status=='rate_limited' else '--'}] {name}: {url}\n")

scanner = SocialScanner("testuser")
asyncio.run(scanner.run)
```

### Phone Number OSINT API Lookup

```python
# phone_osint.py
import requests, json

class PhoneOSINT: def __init__(self, number): self.number = number self.results = {} def numverify(self, api_key=""): if not api_key: return r = requests.get(f"http://apilayer.net/api/validate?access_key={api_key}&number={self.number}") if r.status_code == 200: self.results["numverify"] = r.json def twilio_lookup(self, account_sid="", auth_token=""): if not account_sid: return r = requests.get(f"https://lookups.twilio.com/v1/PhoneNumbers/{self.number}", auth=(account_sid, auth_token) if r.status_code == 200: self.results["twilio"] = r.json def freecarrierlookup(self): try: r = requests.get(f"https://freecarrierlookup.com/getcarrier.php?ph={self.number}", headers={"User-Agent": "Mozilla/5.0"}) if r.status_code == 200: self.results["carrier"] = r.text[:200] except: pass def report(self): print(f"\nPhone OSINT: {self.number}") print("=" * 40) for service, data in self.results.items: print(f"\n[{service.upper}]:") if isinstance(data, dict): for k, v in data.items: print(f"  {k}: {v}") else: print(f"  {data[:200]}")

p = PhoneOSINT("+54123456789")
p.freecarrierlookup
p.report
```

### Website Technology Stack Detection

```python
# tech_detect.py
import requests
import re
from urllib.parse import urlparse

class TechDetector: def __init__(self, url): self.url = url if url.startswith("http") else f"https://{url}" self.domain = urlparse(self.url).netloc self.headers = {} self.html = "" self.tech = def fetch(self): try: r = requests.get(self.url, timeout=10, headers={"User-Agent": "Mozilla/5.0"}) self.headers = dict(r.headers) self.html = r.text[:50000] print(f"[TECH] Status: {r.status_code}, Content-Length: {len(r.content)}") except Exception as e: print(f"[TECH] Error: {e}") def detect_server(self): server = self.headers.get("Server", "") if server: self.tech.append("Server", server) def detect_cms(self): if "wp-content" in self.html or "wp-includes" in self.html: self.tech.append("CMS", "WordPress") if "joomla" in self.html.lower: self.tech.append("CMS", "Joomla") if "drupal" in self.html.lower: self.tech.append("CMS", "Drupal") if "shopify" in self.html.lower: self.tech.append("CMS", "Shopify") if "magento" in self.html.lower: self.tech.append("CMS", "Magento") def detect_js(self): js_libs = { "jquery": "jQuery", "react": "React", "vue": "Vue.js", "angular": "Angular", "next": "Next.js", "nuxt": "Nuxt.js", "bootstrap": "Bootstrap", "tailwind": "Tailwind CSS", "gsap": "GSAP", "three": "Three.js", "d3": "D3.js", "chart": "Chart.js", "moment": "Moment.js", "lodash": "Lodash", } for lib, name in js_libs.items: if lib.lower in self.html.lower: self.tech.append("JS Lib", name) def detect_analytics(self): analytics = { "google-analytics": "Google Analytics", "gtag": "Google Tag Manager", "facebook.net": "Facebook Pixel", "hotjar": "Hotjar", "mixpanel": "Mixpanel", "amplitude": "Amplitude", "hubspot": "HubSpot", "intercom": "Intercom", "crisp": "Crisp Chat", } for code, name in analytics.items: if code.lower in self.html.lower: self.tech.append("Analytics", name) def detect_cloud(self): cloud = { "cloudflare": "Cloudflare", "akamai": "Akamai", "fastly": "Fastly", "cloudfront": "AWS CloudFront", "cloudfront.net": "AWS CloudFront", } for code, name in cloud.items: if code.lower in self.html.lower or code in str(self.headers).lower: self.tech.append("CDN/Cloud", name) def detect_security(self): hsts = self.headers.get("Strict-Transport-Security", "") csp = self.headers.get("Content-Security-Policy", "") if hsts: self.tech.append("Security", "HSTS") if csp: self.tech.append("Security", "CSP") if "X-Frame-Options" in self.headers: self.tech.append("Security", "X-Frame-Options") if "X-Content-Type-Options" in self.headers: self.tech.append("Security", "X-Content-Type-Options") def run(self): self.fetch self.detect_server self.detect_cms self.detect_js self.detect_analytics self.detect_cloud self.detect_security print(f"\n[TECH] Tecnologias detectadas en {self.domain}:") for cat, tech in sorted(set(self.tech): print(f"  [{cat}] {tech}")

t = TechDetector("example.com")
t.run
```
## 100+ [google dorks](../raw/0s1nt.md#google-dorks) Organizados por Categoria

### Login Pages

```
inurl:login OR inurl:signin OR inurl:auth
intitle:"login" "admin" "password"
inurl:admin/login.php
inurl:wp-admin
inurl:administrator
inurl:user/login
intitle:"Login" "user" "pass"
site:target.com inurl:login
site:target.com intitle:"Login"
inurl:"login.aspx"
inurl:"signin" -github
```

### Exposed Databases

```
filetype:sql "INSERT INTO" "password"
filetype:sql "CREATE TABLE" "user"
filetype:sql "DROP TABLE"
filetype:sql "username" "password"
inurl:"phpmyadmin" "Welcome"
intitle:"phpMyAdmin" "user"
inurl:"/sql/"
filetype:sql "dump" "INSERT"
filetype:sql "VALUES" "@"
filetype:bak "CREATE DATABASE"
```

### Config Files

```
filetype:env "DB_PASSWORD"
filetype:env "API_KEY"
filetype:env "AWS_"
filetype:xml "config" "password"
filetype:yml "database" "password"
filetype:json "aws_access_key"
filetype:cfg "password"
filetype:ini "mysql"
filetype:conf "server_name"
filetype:config "db_password"
filetype:yaml "secret"
```

### Log Files

```
filetype:log "password"
filetype:log "Failed password"
filetype:log "error"
filetype:log "root:" 
filetype:log "admin"
filetype:log "access" "admin"
filetype:log "POST" "login"
filetype:log "GET /admin"
inurl:access.log
intitle:"index of" "log"
inurl:"error.log"
```

### Backup Files

```
filetype:bak "password"
filetype:bak "admin"
filetype:backup
filetype:old "password"
filetype:sql "backup"
ext:bak OR ext:old OR ext:backup
inurl:"backup" filetype:sql
intitle:"index of" "backup"
filetype:dump
filetype:sql.gz
```

### Admin Panels

```
intitle:"Admin Panel" "login"
intitle:"Control Panel" "Administrator"
inurl:"/admin/" intitle:admin
inurl:adminarea
inurl:panel-admin
inurl:cpanel
intitle:"Web Admin"
inurl:"/administrator/"
inurl:"/adm/"
inurl:"/admin/login"
intitle:"Site Admin"
```

### Vulnerable Apps

```
intitle:"Welcome to Tomcat" -search
intitle:"PHP Info" phpinfo
intitle:"Apache Status" "Hostname"
intitle:"Directory Listing" -w3c
intitle:"Index of" "cgi-bin"
inurl:"/server-status"
intitle:"Test Page for Apache"
intitle:"IIS Windows"
intitle:"WordPress Installation"
inurl:"/wp-admin/install.php"
```

### Camera Streams

```
intitle:"Live View / - AXIS"
inurl:"view/view.shtml"
intitle:"webcam 7" inurl:"8080"
inurl:"top.htm" inurl:"currenttime"
intitle:"i-Catcher Console" -"Login"
intitle:"SNC-RZ30" "Homepage"
inurl:"lvappl.htm"
intitle:"DCS-934L"
intitle:"IP Camera" "Live"
inurl:"Camera_264"
```

### Network Devices

```
intitle:"Router" "admin" "password" -manual
intitle:"Login" "D-Link" "Administrator"
intitle:"Login" "TP-Link"
intitle:"Administration" "Router"
intitle:"Login" "MikroTik"
intitle:"Login" "Cisco"
intitle:"Login" "Ubiquiti"
intitle:"Login" "Netgear"
intitle:"Login" "Linksys"
intitle:"Login" "Meraki"
```

### Password Files

```
filetype:txt "password"
filetype:txt "passwd"
inurl:passwd.txt
filetype:xls "password"
filetype:doc "password"
filetype:xlsx "password"
filetype:csv "password" "email"
inurl:"passwords.txt"
inurl:"users.txt"
inurl:"accounts.txt"
```

### Email Lists

```
filetype:csv "email" "first_name"
filetype:xls "email" "phone"
filetype:txt "email" "@"
filetype:pdf "email" "list"
intitle:"mailing list" filetype:csv
"@" "email" filetype:xls
site:pastebin.com "@" "password"
inurl:"maillist" OR inurl:"emaillist"
filetype:csv "FirstName" "Email"
filetype:sql "email" "password"
```

### Database Dumps

```
filetype:sql "INSERT INTO" "VALUES" -html
filetype:sql "@" "password"
filetype:sql "user" "pass"
filetype:sql.gz
filetype:sql.zip
intitle:"index of" "database" "sql"
inurl:"dump.sql"
inurl:"backup.sql"
inurl:"db_backup"
```

### Open [s3](../raw/cl0ud-h4ck1ng.md#s3) Buckets

```
site:s3.amazonaws.com "backup"
site:s3.amazonaws.com "password"
site:s3.amazonaws.com "confidential"
site:s3.amazonaws.com "config"
site:s3.amazonaws.com "db"
site:s3.amazonaws.com "log"
site:s3.amazonaws.com "user"
site:s3.amazonaws.com "data"
site:s3.amazonaws.com "employees"
site:s3.amazonaws.com "customer"
```

### Exposed API Keys

```
"api_key" filetype:txt
"api_key" filetype:json
"api_key" filetype:env
"api_key" filetype:yml
"API_KEY" "sk-" site:github.com
"AIza" site:github.com
"aws_access_key" site:github.com
"-----BEGIN RSA PRIVATE KEY-----" site:github.com
"ghp_" site:github.com
"xoxb-" site:github.com
"sk_live_" site:github.com
"pk_live_" site:github.com
```

## Corporate [osint](../raw/0s1nt.md) Detallado

### company Email Discovery

```python
# corporate_osint.py
import requests, json

class CorporateOSINT: def __init__(self, domain): self.domain = domain def hunter_io(self, api_key=""): if not api_key: return r = requests.get(f"https://api.hunter.io/v2/domain-search?domain={self.domain}&api_key={api_key}") if r.status_code == 200: data = r.json.get("data", {}) print(f"\n[HUNTER] Emails encontrados para {self.domain}:") for email in data.get("emails", ): print(f"  {email.get('value','?')} ({email.get('position','?')}) - Confianza: {email.get('confidence','?')}%") return data def crunchbase(self, api_key=""): if not api_key: return r = requests.get(f"https://api.crunchbase.com/v4/data/entities/organizations/{self.domain}?user_key={api_key}") if r.status_code == 200: data = r.json.get("properties", {}) print(f"\n[CRUNCHBASE] Datos de {self.domain}:") print(f"  Nombre: {data.get('name','?')}") print(f"  Descripcion: {data.get('short_description','?')[:100]}") print(f"  Fundada: {data.get('founded_on','?')}") print(f"  Empleados: {data.get('num_employees_enum','?')}") def opencorporates(self, jurisdiction="ar"): r = requests.get(f"https://api.opencorporates.com/v0.4/companies/search?q={self.domain}&jurisdiction_code={jurisdiction}") if r.status_code == 200: results = r.json.get("results", ) print(f"\n[OPENCORPORATES] Empresas encontradas: {len(results)}") for res in results[:5]: c = res.get("company", {}) print(f"  {c.get('name','?')} - {c.get('company_number','?')} - {c.get('jurisdiction_code','?')}") def sec_edgar(self): r = requests.get(f"https://efts.sec.gov/LATEST/search-index?q={self.domain}&dateRange=all&startdt=&enddt=") if r.status_code == 200: data = r.json hits = len(data.get("hits", {}).get("hits", ) print(f"\n[SEC EDGAR] Documentos encontrados: {hits}")

corp = CorporateOSINT("mercadolibre.com")
corp.opencorporates
```

### Employee LinkedIn Discovery

```python
# linkedin_scraper.py
import requests, json, time

class LinkedInScraper: def __init__(self, company, proxy=None): self.company = company self.proxy = proxy def search_google_dorks(self): dorks = [ f'site:linkedin.com/in "{self.company}"', f'site:linkedin.com/in "{self.company}" "CEO"', f'site:linkedin.com/in "{self.company}" "CTO"', f'site:linkedin.com/in "{self.company}" "Developer"', f'site:linkedin.com/in "{self.company}" "Engineer"', f'site:linkedin.com/in "{self.company}" "Manager"', f'site:linkedin.com/in "{self.company}" "Analyst"', f'site:linkedin.com/in "{self.company}" "Designer"', f'site:linkedin.com/in "{self.company}" "Marketing"', f'site:linkedin.com/in "{self.company}" "Sales"', ] print(f"[LINKEDIN] Dorks generados para {self.company}:") for d in dorks: print(f"  {d}") def email_patterns(self): patterns = [ f"nombre@{self.company}", f"nombre.apellido@{self.company}", f"n.apellido@{self.company}", f"nombrea@{self.company}", f"apellido.nombre@{self.company}", f"nombre.apellido@{self.company}.com.ar", f"n.apellido@{self.company}.com.ar", ] print(f"[EMAIL] Patrones para {self.company}:") for p in patterns: print(f"  {p}")

l = LinkedInScraper("mercadolibre")
l.search_google_dorks
l.email_patterns
```

## Dark Web [osint](../raw/0s1nt.md)

### Searching .onion Services

```bash
# Ahmia - buscador de onion
# https://ahmia.fi
curl "https://ahmia.fi/search/?q=target"

# Torch - buscador onion clasico
# http://xmh57jrzrnw6insl.onion

# Haystak - motor de busqueda para onion
# https://haystak.onion

# DarkSearch - buscador de dark web
# https://darksearch.io

# OnionScan - escanear seguridad de onion
# https://github.com/s-rah/onionscan
onionscan http://target.onion
```

### Tracking Marketplace Listings

```bash
# Monitorear listados en mercados darknet
# Usar scraping con Tor

# Ejemplo con Python + Tor
python3 << 'EOF'
import requests

proxies = {"http": "socks5://127.0.0.1:9050", "https": "socks5://127.0.0.1:9050"}

def browse_onion(url): try: r = requests.get(url, proxies=proxies, timeout=30) print(f"[TOR] {url} - Status: {r.status_code}") return r.text[:2000] except Exception as e: print(f"[TOR] Error: {e}") return ""

# browse_onion("http://example.onion")
print("[TOR] Listo para navegar onion services")
EOF
```

## Cryptocurrency [osint](../raw/0s1nt.md)

### [blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) Analysis

```python
# crypto_osint.py
import requests, json

class CryptoOSINT: def __init__(self, address): self.address = address def blockchain_info(self): r = requests.get(f"https://blockchain.info/address/{self.address}?format=json") if r.status_code == 200: data = r.json print(f"\n[BLOCKCHAIN] Datos de {self.address[:20]}..") print(f"  Transacciones: {data.get('n_tx', 0)}") print(f"  Total recibido: {data.get('total_received', 0) / 1e8} BTC") print(f"  Total enviado: {data.get('total_sent', 0) / 1e8} BTC") print(f"  Balance final: {data.get('final_balance', 0) / 1e8} BTC") def etherscan(self, api_key=""): if not api_key: return r = requests.get(f"https://api.etherscan.io/api?module=account&action=txlist&address={self.address}&apikey={api_key}") if r.status_code == 200: data = r.json if data.get("status") == "1": txs = data.get("result", ) print(f"\n[ETHERSCAN] Transacciones: {len(txs)}") for tx in txs[:5]: print(f"  {tx.get('hash','?')[:20]}.. -> {tx.get('to','?')} | {int(tx.get('value',0)/1e18} ETH") def wallet_clustering(self): # Analizar transacciones comunes para clusterizar wallets print(f"\n[CLUSTER] Analizando patrones de transaccion..") r = requests.get(f"https://blockchain.info/address/{self.address}?format=json") if r.status_code == 200: data = r.json txs = data.get("txs", ) addresses = set for tx in txs[:20]: for i in tx.get("inputs", ): prev = i.get("prev_out", {}) addr = prev.get("addr", "") if addr: addresses.add(addr) for o in tx.get("out", ): addr = o.get("addr", "") if addr: addresses.add(addr) print(f"  Direcciones relacionadas: {len(addresses)}") for a in list(addresses)[:10]: print(f"  - {a}") def mixer_detection(self): # Detectar si una direccion pertenece a un mixer r = requests.get(f"https://blockchain.info/address/{self.address}?format=json") if r.status_code == 200: data = r.json txs = data.get("txs", ) inputs_count = sum(len(tx.get("inputs", ) for tx in txs[:50]) outputs_count = sum(len(tx.get("out", ) for tx in txs[:50]) ratio = inputs_count / max(outputs_count, 1) print(f"\n[MIXER DETECTION] Analizando patrones de mixer..") print(f"  Inputs/Outputs ratio: {ratio:.2f}") if ratio > 3: print(f"  [!] Posible mixer detectado (muchos inputs, pocos outputs)") elif ratio < 0.3: print(f"  [!] Posible tumbler detectado (pocos inputs, muchos outputs)")

crypto = CryptoOSINT("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa")
crypto.blockchain_info
crypto.wallet_clustering
```

### Bitcoin Forensic Tools

```bash
# Walletexplorer - explorador de wallets
# https://www.walletexplorer.com

# OXT - analisis de transacciones
# https://oxt.me

# Chainanalysis - forense blockchain (pago)
# https://www.chainalysis.com

# Blockchair - buscador multi-chain
# https://blockchair.com

# Coinjoin detection
# https://coinjoin.io

# BitcoinWhosWho - reputacion de direcciones
# https://www.bitcoinwhoswho.com
```


