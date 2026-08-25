# 🧠 Hacker Mindset — Cómo Pensar Ofensivamente

> ⏱️ **Tiempo estimado:** 10 horas (~2 sesiones) (2199 lineas)


> **Versión:** 1.0  
> **Idioma:** Español (argentino) — informal, directo, para la comunidad  
> **Nivel:** Principiante → Avanzado  
> **Duración estimada:** 2–4 semanas leyendo y practicando

---

## 📚 Índice

1. [Introducción](#1-introducción)
2. [Thinking Methodology](#2-thinking-methodology)
    - 2.1 [Creative Problem Solving](#21-creative-problem-solving)
    - 2.2 [Lateral Thinking](#22-lateral-thinking)
    - 2.3 [El Enfoque "What If"](#23-el-enfoque-what-if)
    - 2.4 [Abductive Reasoning](#24-abductive-reasoning)
    - 2.5 [Ejercicios prácticos](#25-ejercicios-prácticos)
3. [Research Methodology](#3-research-methodology)
    - 3.1 [Cómo Investigar Tecnologías Desconocidas](#31-cómo-investigar-tecnologías-desconocidas)
    - 3.2 [Encontrando Vulnerabilidades](#32-encontrando-vulnerabilidades)
    - 3.3 [Reproduciendo Bugs](#33-reproduciendo-bugs)
    - 3.4 [Ejercicios prácticos](#34-ejercicios-prácticos)
4. [OSINT Mindset](#4-osint-mindset)
    - 4.1 [Qué Información Está Disponible](#41-qué-información-está-disponible)
    - 4.2 [Qué Suele Pasarse por Alto](#42-qué-suele-pasarse-por-alto)
    - 4.3 [Leyendo Entre Líneas](#43-leyendo-entre-líneas)
    - 4.4 [Ejercicios prácticos](#44-ejercicios-prácticos)
5. [Persistence and Patience](#5-persistence-and-patience)
    - 5.1 [Horas/Días/Semanas en el Mismo Target](#51-horasdíassemanas-en-el-mismo-target)
    - 5.2 [Systematic Enumeration](#52-systematic-enumeration)
    - 5.3 [No Rendirse](#53-no-rendirse)
    - 5.4 [Ejercicios prácticos](#54-ejercicios-prácticos)
6. [Note-Taking](#6-note-taking)
    - 6.1 [Cómo Organizar Findings](#61-cómo-organizar-findings)
    - 6.2 [Herramientas: CherryTree, Obsidian, Notion, Joplin](#62-herramientas-cherrytree-obsidian-notion-joplin)
    - 6.3 [Estructura para Pentests](#63-estructura-para-pentests)
    - 6.4 [Ejercicios prácticos](#64-ejercicios-prácticos)
7. [Self-Learning](#7-self-learning)
    - 7.1 [Aprendiendo Nuevas Herramientas](#71-aprendiendo-nuevas-herramientas)
    - 7.2 [Leyendo Código](#72-leyendo-código)
    - 7.3 [Leyendo Papers](#73-leyendo-papers)
    - 7.4 [Reproduciendo Exploits de 1-Day](#74-reproduciendo-exploits-de-1-day)
    - 7.5 [Plataformas de Práctica](#75-plataformas-de-práctica)
    - 7.6 [Ejercicios prácticos](#76-ejercicios-prácticos)
8. [Learning from Failures](#8-learning-from-failures)
    - 8.1 [Analizando Errores](#81-analizando-errores)
    - 8.2 [Post-Mortems](#82-post-mortems)
    - 8.3 [Documentando lo Aprendido](#83-documentando-lo-aprendido)
    - 8.4 [Ejercicios prácticos](#84-ejercicios-prácticos)
9. [Ethical Boundaries](#9-ethical-boundaries)
    - 9.1 [Saber Dónde Parar](#91-saber-dónde-parar)
    - 9.2 [Alcance de Autorización](#92-alcance-de-autorización)
    - 9.3 [Responsible Disclosure](#93-responsible-disclosure)
    - 9.4 [Erring on the Side of Caution](#94-erring-on-the-side-of-caution)
    - 9.5 [Ejercicios prácticos](#95-ejercicios-prácticos)
10. [Communication](#10-communication)
    - 10.1 [Explicando Findings Técnicos a Audiencias No Técnicas](#101-explicando-findings-técnicos-a-audiencias-no-técnicas)
    - 10.2 [Escribiendo Reportes Claros](#102-escribiendo-reportes-claros)
    - 10.3 [Executive Summaries](#103-executive-summaries)
    - 10.4 [Ejercicios prácticos](#104-ejercicios-prácticos)
11. [Collaboration](#11-collaboration)
    - 11.1 [Respetando a Otros Investigadores](#111-respetando-a-otros-investigadores)
    - 11.2 [Compartiendo Conocimiento](#112-compartiendo-conocimiento)
    - 11.3 [CTF Teamwork](#113-ctf-teamwork)
    - 11.4 [Bug Bounty Community](#114-bug-bounty-community)
    - 11.5 [Ejercicios prácticos](#115-ejercicios-prácticos)
12. [Thinking Like an Attacker vs Defender](#12-thinking-like-an-attacker-vs-defender)
    - 12.1 [Adversarial Mindset](#121-adversarial-mindset)
    - 12.2 [Red vs Blue](#122-red-vs-blue)
    - 12.3 [Anticipar y Prepararse para Detección](#123-anticipar-y-prepararse-para-detección)
    - 12.4 [Ejercicios prácticos](#124-ejercicios-prácticos)
13. [Apéndice A — Recursos Recomendados](#13-apéndice-a--recursos-recomendados)
14. [Apéndice B — Plantilla de Reportes](#14-apéndice-b--plantilla-de-reportes)
15. [Apéndice C — Glosario de Mentalidad](#15-apéndice-c--glosario-de-mentalidad)

---

## 1. Introducción

Mirá, te voy a ser sincero. El hacking no es una habilidad técnica. Es una **forma de pensar**. Las herramientas se aprenden en una semana. Un script kiddie puede correr [metasploit](../raw/m3t4spl01t.md) sin entender nada. Pero el verdadero hacker es el que mira un sistema y se pregunta "¿qué pasa si hago esto?".

Este tutorial no trata sobre comandos. Trata sobre la mentalidad que separa a un técnico de un hacker. Sobre cómo pensar cuando estás frente a un sistema que no conocés, un código que no entendés, o un problema que nadie ha resuelto.

Vamos a cubrir:

- **Metodología de pensamiento** — cómo abordar problemas creativamente
- **Investigación** — cómo encontrar lo que otros pasaron por alto
- **[osint](../raw/0s1nt.md) mindset** — leer entre líneas la información disponible
- **[persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)** — porque el 90% del hacking es no rendirse
- **Note-taking** — porque sin notas, te olvidás todo
- **Auto-aprendizaje** — cómo seguir aprendiendo solo
- **Fallos** — cómo crecer a partir de los errores
- **Ética** — porque saber dónde parar es tan importante como saber cómo entrar
- **Comunicación** — porque si no podés explicarlo, no sirve
- **Colaboración** — porque el mejor hacker no trabaja solo

### ¿Qué necesitás?

- Curiosidad insaciable
- Paciencia (mucha)
- Capacidad de frustrarte y seguir
- Una mente que no acepta "no se puede" como respuesta

Arrancamos.

---

## 2. Thinking Methodology

### 2.1 Creative Problem Solving

El hacking es resolver problemas. Pero no cualquier problema — son problemas donde alguien más intentó activamente evitar que los resuelvas. Eso requiere creatividad.

#### El Marco de Resolución Creativa

```
1. Definir el problema claramente
   - "Quiero acceder al servidor" es vago
   - "Quiero ejecutar código en el servidor web que corre en 10.0.0.5:8080" es específico
   
2. Descomponer el problema
   - ¿Qué servicios corren?
   - ¿Qué versiones?
   - ¿Qué vectores de ataque existen?
   - ¿Qué restricciones tengo?
   
3. Generar hipótesis
   - "Si el servidor tiene X, entonces podríamos Y"
   - "¿Y si el parámetro Z no sanitiza correctamente?"
   
4. Probar hipótesis
   - Probar una cosa a la vez
   - Documentar resultados
   - Ajustar basado en feedback
   
5. Iterar
   - La primera hipótesis rara vez es correcta
   - Cada intento te da más información
```

#### La Técnica SCAMPER

Usá SCAMPER para generar ideas de ataque:

- **S**ustituir — ¿Qué pasa si reemplazo un parámetro por otro?
- **C**ombinar — ¿Puedo combinar dos vulnerabilidades?
- **A**daptar — ¿Hay un ataque conocido que pueda adaptar a este contexto?
- **M**odificar — ¿Qué pasa si modifico el tamaño, el tipo, el formato?
- **P**oner en otro uso — ¿Puedo usar esta funcionalidad para otra cosa?
- **E**liminar — ¿Qué pasa si saco un parámetro o header?
- **R**evertir — ¿Puedo hacer el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) inverso?

**Ejemplo:** Un login que solo permite usuarios con @empresa.[com](../raw/w1n-s9bsyst3ms.md#com)

- **S**: Reemplazar `@empresa.com` por `@empresa.com.evil.com`
- **C**: Combinar IDOR + [csrf](../raw/w3b-h4ck1ng.md#csrf) para cambiar mail de otro usuario
- **A**: Adaptar un ataque de SSTI en el campo de nombre
- **M**: Modificar el tipo de content-type en el login
- **P**: Usar el campo "recordar contraseña" para enumerar usuarios
- **E**: Eliminar cookies y ver qué pasa
- **R**: Probar el password reset al revés

### 2.2 Lateral Thinking

El pensamiento lateral es salirse del camino obvio. Cuando todos están mirando el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 80, el hacker lateral mira el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 161 (SNMP). Cuando todos están brute-forceando la contraseña, el hacker lateral mira el reset de contraseña.

#### Técnicas de Pensamiento Lateral

**1. La Técnica del "Por qué"**

Preguntate "por qué" 5 veces:

- "Quiero acceder a la base de datos"
  - "¿Por qué?" → "Porque tiene datos de usuarios"
    - "¿Por qué?" → "Porque necesito credenciales"
      - "¿Por qué?" → "Para escalar privilegios"
        - "¿Por qué?" → "Porque con admin puedo pivotear"
          - "¿Por qué?" → "Porque desde ahí veo el servidor de pagos"

En cada nivel, el ataque es diferente.

**2. Inversión del Problema**

En lugar de "¿cómo entro al sistema?", preguntate:
- "¿cómo haría el sistema para mantenerme afuera?"
- "¿qué haría si ya estuviera adentro?"

**3. Analogías**

- Un [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) es como una puerta con vigilante
- Un WAF es como un portero que revisa lo que llevás
- Un [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)) es como una cámara de seguridad

Si el portero revisa muy rápido, algunas cosas se le pasan. ¿Qué cosas?

**4. Random Input**

Agarrá una palabra al azar y conectala con el problema:
- Palabra: "refrigerador"
- ¿Qué tiene un refrigerador? → enfriamiento → overclocking → temperatura → hardware fault → glitching → voltage fault attack

#### Ejemplo Clásico: El Atacante Lateral

En una pentest, todos estaban focused en explotar un Apache Struts en el DMZ. Horas probando exploits. Yo miré el firewall y noté que permitía SNMP desde una [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) interna. Enumeré SNMP, encontré credenciales de backup en una community string ("backup_password_2024"), y con esas credenciales accedí al servidor de backups que tenía las claves SSH del DMZ. Entré al DMZ por SSH sin tocar el Apache Struts.

Eso es pensamiento lateral.

### 2.3 El Enfoque "What If"

La pregunta más poderosa en hacking: **"¿Y si...?"**

- "¿Y si el input no está sanitizado?"
- "¿Y si el servidor confía en el cliente?"
- "¿Y si el desarrollador se olvidó de esto?"
- "¿Y si puedo hacer que el sistema se comporte de forma inesperada?"

#### How to "What If" Correctamente

1. **Identificá suposiciones.** Todo sistema hace suposiciones. El trabajo del hacker es identificarlas.

   - "El servidor asume que el precio viene del frontend" → ¿Y si modificamos el precio?
   - "El servidor asume que el usuario está autenticado" → ¿Y si no lo está?
   - "El servidor asume que el archivo es una imagen" → ¿Y si no lo es?

2. **Cuestioná cada límite.**

   - Límite de caracteres → ¿Y si mando más?
   - Límite de requests → ¿Y si mando menos?
   - Límite de tipos → ¿Y si mando otro tipo?
   - Límite de tamaño → ¿Y si mando un archivo enorme?

3. **Pensá en los bordes.**

   - ¿Qué pasa con valores negativos?
   - ¿Qué pasa con valores vacíos?
   - ¿Qué pasa con valores nulos?
   - ¿Qué pasa con caracteres especiales?

#### Lista de Check "What If" para Web

```python
what_if_list = [
    "What if I change the HTTP method?",
    "What if I delete a header?",
    "What if I add a duplicate header?",
    "What if I send unicode-encoded characters?",
    "What if I use null bytes?",
    "What if I change the Content-Type?",
    "What if I nest JSON?",
    "What if I send negative numbers?",
    "What if I send arrays instead of strings?",
    "What if I use path traversal?",
    "What if I use long strings?",
    "What if I use SQL syntax in parameters?",
    "What if I use XML instead of JSON?",
    "What if I tamper with cookies?",
    "What if I reuse a CSRF token?",
]
```

### 2.4 Abductive Reasoning

La abducción es inferir la causa más probable a partir de las observaciones. En hacking, es el proceso de:

1. Observar un comportamiento extraño
2. Inferir qué lo causó
3. Probar esa hipótesis

#### El Proceso Abductivo

```
Observación: El servidor tarda 2 segundos en responder cuando el usuario existe,
pero 0.1 segundos cuando no existe.

Inferencia: El servidor está calculando un hash de la contraseña solo si el usuario
existe. Esto permite enumeración de usuarios por timing.

Hipótesis: Podemos enumerar usuarios midiendo tiempos de respuesta.

Prueba: Enviamos 100 peticiones con diferentes usuarios, medimos tiempos.

Conclusión: Efectivamente, timing-based user enumeration es viable.
```

#### Abducción en la Práctica

**Caso 1:** Una página devuelve "Error 500" con ciertos inputs. La causa podría ser:
- Un error del programador
- Un tipo de dato incorrecto
- Un path traversal que rompe el backend
- Una inyección SQL que crashea la DB

Probá la más probable primero: inyección SQL. Si falla, probá path traversal.

**Caso 2:** Un [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de contraseña es siempre el mismo para el mismo usuario (incluso cambiando la contraseña). Causa posible:
- El hash está hardcodeado
- Hay un caché de hashes
- El sistema no actualiza el hash cuando cambia la contraseña

Probá: cambiá la contraseña y verificá si el hash cambia.

### 2.5 Ejercicios prácticos

**Ejercicio 1:** Aplicá SCAMPER a un cajero automático (ATM). Generá 7 posibles ataques (uno por cada letra de SCAMPER).

**Ejercicio 2:** Elegí un sitio web que uses diariamente. Identificá 5 suposiciones que hace el sistema. Para cada una, preguntate "¿y si esta suposición es falsa?"

**Ejercicio 3:** Relatá un problema técnico que hayas resuelto. Describí el proceso de abducción que usaste: ¿qué observaste? ¿Qué inferiste? ¿Cómo lo probaste?

**Ejercicio 4:** Practicá pensamiento lateral: ¿De cuántas formas diferentes podés escalar de un sitio web a la [red](../raw/r3d3s-f0nd4m3nt0s.md) interna de una empresa? Generá al menos 10 ideas.

**Ejercicio 5:** Creá tu propia lista de "What If" para probar APIs REST. 15 items mínimo.

---

## 3. Research Methodology

### 3.1 Cómo Investigar Tecnologías Desconocidas

Te encontrás con un sistema que nunca viste. Usa un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) raro, un framework desconocido, una arquitectura bizantina. ¿Qué hacés?

#### Paso 1: [reconocimiento](../raw/0s1nt.md#reconocimiento) Pasivo

No toques el sistema todavía. Investigá desde afuera.

```bash
# Buscar documentación técnica
# Buscar whitepapers del fabricante
# Buscar CVEs relacionados
# Buscar talks de conferencias
# Buscar repositorios GitHub
# Buscar issues reportados
# Buscar job postings que mencionen la tecnología
```

**[google dorks](../raw/0s1nt.md#google-dorks) útiles:**

```
site:github.com "tecnologia_unknown" exploit
site:docs.example.com "tecnologia_unknown" security
"tecnologia_unknown" CVE
"tecnologia_unknown" vulnerability
"tecnologia_unknown" "security advisory"
```

#### Paso 2: Entender el Stack

Identificá cada componente:

- Lenguaje de backend (Java, PHP, .NET, [python](../raw/pyth0n-f0r-h4ck1ng.md), Node, Go, Rust)
- Framework (Spring, Laravel, ASP.NET, Django, Express, Gin, Rocket)
- Base de datos (SQL, NoSQL, Graph, Time-series)
- Servidor web (Apache, Nginx, IIS, Caddy)
- [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) (Windows, Linux, BSD)

Cada combinación tiene ataques específicos.

#### Paso 3: Leer el Código (si está disponible)

Si es open source o podés obtener el código:

```python
# 1. Buscar archivos de configuración
#    config.json, database.yml, .env, web.config
# 2. Buscar rutas/endpoints
#    grep -r "router" src/
#    grep -r "@RequestMapping" src/
# 3. Buscar funciones de seguridad
#    grep -r "auth" src/
#    grep -r "permission" src/
#    grep -r "validate" src/
# 4. Buscar dependencias
#    cat package.json / pom.xml / requirements.txt
# 5. Buscar CVEs de las dependencias
```

#### Paso 4: Fingerprinting Activo

Ahora sí, tocá el sistema suavemente.

```bash
# Escaneo de puertos
nmap -sV -sC target.com

# Escaneo de tecnologías web
whatweb target.com
wappalyzer target.com  # o extensión de browser

# Escaneo de directorios
gobuster dir -u https://target.com -w wordlist.txt

# Escaneo de subdominios
sublist3r -d target.com
```

#### Paso 5: Reproducir Ataques Conocidos

Buscá si hay ataques conocidos para versiones específicas.

```bash
searchsploit "tecnologia version"
searchsploit -t "tecnologia"
```

### 3.2 Encontrando Vulnerabilidades

Encontrar bugs no es magia. Es sistemático.

#### La Pirámide de Vulnerabilidades

```
                    /\
                   /  \
                  / RCE\
                 /______\
                /   SSRF  \
               /   SQLi    \
              /    XSS      \
             /    IDOR       \
            /  Open Redirect  \
           / Information Disc. \
          /  Misconfiguration  \
         /______________________\
```

Las más fáciles de encontrar están en la base. Las más difíciles en la cima.

#### Metodología de Búsqueda

**1. Búsqueda por Tipo de [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)**

Elegí un tipo ([xss](../raw/w3b-h4ck1ng.md#xss), [sqli](../raw/w3b-h4ck1ng.md#sql-injection), IDOR) y busca solo eso:

```
1. Identificá inputs del usuario
2. Probá cada input con payloads del tipo elegido
3. Documentá resultados
4. Pasá al siguiente tipo
```

**2. Búsqueda por Componente**

Elegí un componente y busca todo:

```
1. Tomá un endpoint
2. Probalo con:
   - Path traversal
   - SQL injection
   - XSS
   - Command injection
   - SSTI
   - XXE
   - Open redirect
   - CSRF
   - Parameter pollution
```

**3. Búsqueda por Flujo**

Seguí un flujo de usuario completo:

```
1. Registro → Login → Perfil → Cambio de password → Baja
2. Probalo cada paso
   - ¿Hay IDOR en el perfil?
   - ¿Hay race condition en el cambio de password?
   - ¿Hay TOCTOU en la baja?
```

#### Herramientas para Encontrar Bugs

```bash
# Automatización de búsqueda
nuclei -t cves/ -u https://target.com
nuclei -t misconfiguration/ -u https://target.com

# Escaneo de parámetros
ffuf -u https://target.com/FUZZ -w wordlist.txt
ffuf -u https://target.com/page?FUZZ=test -w params.txt

# Automatización web
zap-cli quick-scan https://target.com
nikto -h https://target.com

# Linting de seguridad
# ESLint + eslint-plugin-security
# bandit para Python
```

### 3.3 Reproduciendo Bugs

Encontraste un reporte de bug. Ahora tenés que reproducirlo.

#### El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Reproducción

```
1. Leer el reporte completo
   - Entender el componente vulnerable
   - Identificar las condiciones necesarias
   - Anotar los pasos exactos

2. Preparar el ambiente
   - Versión exacta del software
   - Configuración requerida
   - Dependencias
   - Docker compose si existe

3. Ejecutar paso a paso
   - No saltees ningún paso
   - Si falla, verificá configuraciones
   - Si sigue fallando, buscá variantes

4. Verificar el exploit
   - ¿Funciona en un ambiente limpio?
   - ¿Es confiable?
   - ¿Tiene efectos secundarios?
```

#### Por qué es Importante Reproducir

1. **Aprendés cómo funciona el bug** — no solo sabés que existe, entendés por qué.
2. **Descubrís variantes** — tal vez el parche es incompleto y encontrás un bypass.
3. **Mejorás tus habilidades** — reproducir exploits es como hacer ejercicios.
4. **Tenés un [exploit](../raw/m3t4spl01t.md#exploits) listo** — para cuando lo necesites.

#### Ejemplo de Reproducción

```
CVE-2023-46604: Apache ActiveMQ RCE

1. Leer advisory: ActiveMQ < 5.15.16, < 5.16.7, < 5.17.6, < 5.18.2
2. Descargar versión vulnerable: docker pull vulhub/activemq:5.15.15
3. Ejecutar: docker compose up -d
4. Verificar: netcat -zv localhost 61616
5. Preparar payload: clase Java maliciosa serializada
6. Enviar: python exploit.py -t localhost -p 61616
7. Verificar: curl http://localhost:8080/ (no debería responder → RCE exitoso)
```

### 3.4 Ejercicios prácticos

**Ejercicio 1:** Elegí una tecnología que no conozcas (ej: Apache Cassandra, RabbitMQ, [graphql](../raw/4p1-s3cur1ty.md#graphql)). Investigala usando el método de 5 pasos. Documentá todo.

**Ejercicio 2:** Buscá un [cve](../raw/s3c-f0nd4m3nt0s.md#cve) reciente (últimos 6 meses) que tenga un PoC público. Reproducilo en un ambiente [docker](../raw/d0ck3r-f0r-h4ck3rs.md). Documentá el proceso.

**Ejercicio 3:** Usá el enfoque de búsqueda por componente. Tomá un sitio web de prueba (DVWA, bWAPP, [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox))) y elegí un endpoint. Probá 10 tipos de vulnerabilidad diferentes.

**Ejercicio 4:** Elegí un flujo de usuario en una aplicación web (ej: checkout de ecommerce). Identificá 5 posibles vulnerabilidades en ese flujo.

---

## 4. [osint](../raw/0s1nt.md) Mindset

### 4.1 Qué Información Está Disponible

La cantidad de información pública sobre cualquier organización es ABRUMADORA. El problema no es la falta de datos, es saber dónde mirar.

#### Fuentes de Información Pública

**1. Google [dorking](../raw/0s1nt.md#google-dorks)**

```bash
# Archivos con información sensible
site:target.com filetype:pdf "confidential"
site:target.com filetype:xls password
site:target.com filetype:env DB_PASSWORD
site:target.com filetype:bak
site:target.com filetype:sql

# Paneles de administración
site:target.com inurl:admin
site:target.com inurl:login
site:target.com intitle:"login" "admin"

# Exposición de servicios
site:target.com inurl:8080
site:target.com inurl:3000
site:target.com "dashboard" "grafana"
```

**2. [shodan](../raw/0s1nt.md#shodan) / Censys / ZoomEye**

```bash
# Buscar servidores de la organización
shodan search org:"Target Company" port:22
shodan search hostname:target.com ssl:"target.com"
shodan search "Target Company" port:3389

# Misconfiguraciones
shodan search "default password" port:23
shodan search "230 Login successful" port:21  # FTP anonymous
shodan search "MongoDB" "port:27017" "-authentication"
```

**3. [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) Enumeration**

```bash
# Subdominios
sublist3r -d target.com
dnsrecon -d target.com -t brt -D subdomains.txt
amass enum -d target.com

# Registros DNS
dig target.com ANY
dig target.com AXFR  # Zone transfer (si funciona, ganaste)
nslookup -type=any target.com
```

**4. [redes](../raw/r3d3s-f0nd4m3nt0s.md) Sociales y Repositorios**

```bash
# GitHub
# Buscar: "target.com" password
# Buscar: "target" SECRET_KEY
# Buscar: "target" .env
# Buscar: "target" aws_key

# LinkedIn → Estructura organizacional
# Twitter → Quejas de clientes (revelan problemas)
# Pastebin → Posibles leaks
```

**5. Certificados [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)) (Certificate Transparency)**

```bash
# crt.sh
curl -s "https://crt.sh/?q=%25.target.com&output=json" | jq -r '.[].name_value' | sort -u

# Con openssl
openssl s_client -connect target.com:443 2>/dev/null | openssl x509 -text | grep DNS
```

### 4.2 Qué Suele Pasarse por Alto

El 90% de la gente mira las mismas cosas. El 10% restante encuentra los bugs críticos.

#### Lo que Nadie Mira

1. **Errores tipográficos en dominios**
   - `target.cm` vs `target.com`
   - `targer.com` (typosquatting)
   - `target-login.com` (dominio falso registrado)

2. **Metadatos de archivos**

```bash
# Extraer metadatos de PDFs, DOCX, imágenes
exiftool documento.pdf
exiftool foto.jpg

# Los metadatos revelan:
# - Nombres de usuarios
# - Versiones de software
# - Rutas de red internas
# - Fechas de modificación
```

3. **Comentarios en HTML**

```bash
curl -s https://target.com | grep -i "<!--\|//\|todo\|fixme\|hack\|password\|api_key"
```

4. **Headers [http](../raw/r3d3s-f0nd4m3nt0s.md#http)**

```bash
curl -sI https://target.com

# Server: Apache/2.4.49 (Ubuntu) — versión exacta
# X-Powered-By: PHP/7.4.33 — versión exacta
# X-AspNet-Version: 4.0.30319 — framework
# Set-Cookie: .AspNetCore.Antiforgery — tecnología exacta
```

5. **Archivos de respaldo / archivos olvidados**

```bash
# Archivos comunes olvidados en producción
# .git/
# .env
# .DS_Store
# backup/
# old/
# test/
# .htaccess
# web.config.bak
# config.php.old
# dump.sql
```

6. **Mensajes de error detallados**

```bash
# Probar rutas que generen errores
curl https://target.com/nonexistent
curl https://target.com/page?id=' 
curl https://target.com/api/v1/users/9999999999
```

#### La Regla del 80/20 en OSINT

El 80% de la información útil viene del 20% de las fuentes:
1. Google Dorking
2. Shodan
3. Certificate Transparency
4. DNS
5. GitHub

Focalizá tu energía ahí.

### 4.3 Leyendo Entre Líneas

La información explícita es solo el comienzo. Lo importante es lo que se puede inferir.

#### Inferencias Útiles

**De los Job Postings:**
- Buscan experto en [kubernetes](../raw/k8s-d33p-d1v3.md)-d33p-d1v3.md) → migraron a [k8s](../raw/k8s-d33p-d1v3.md)
- Buscan experto en Java con Spring → su stack principal
- Buscan experto en seguridad → probablemente tuvieron un incidente
- "Mantener sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md)" → tienen sistemas viejos sin parchear

**De los Comunicados de Prensa:**
- "Migración a la nube" → posible [ssrf](../raw/w3b-h4ck1ng.md#ssrf), [s3](../raw/cl0ud-h4ck1ng.md#s3) buckets mal configurados
- "Adquisición de startup" → integración apurada = bugs de seguridad
- "Expansión internacional" → nuevas superficies de ataque

**De las Redes Sociales:**
- Desarrollador tuitea sobre "deploy a producción sin testing" → cultura insegura
- "Trabajando hasta las 2 AM" → burnout → errores en código
- Fotos del escritorio → sticky notes con contraseñas

#### Técnica: El Collage de Información

Cada pieza de información es un pixel. Juntá suficientes píxeles y ves la imagen completa.

```
Fuente 1: Job posting para administrador de MongoDB
Fuente 2: shodan muestra MongoDB en puerto 27017
Fuente 3: Error message reveals "MongoDB connection failed"
Fuente 4: GitHub commit menciona "fix MongoDB injection vulnerability"
→ Inferencia: Usan MongoDB, es probable que sea vulnerable a inyección NoSQL
```

### 4.4 Ejercicios prácticos

**Ejercicio 1:** Elegí una empresa (puede ser una conocida). Hacé un OSINT completo usando:
- Google Dorking (5 dorks)
- crt.sh (certificados)
- DNS enumeration (subdominios)
- Shodan (si tenés API)
- GitHub (buscar credenciales)

Documentá todo lo que encontraste.

**Ejercicio 2:** Buscá información que otros pasaron por alto en una empresa:
- Metadatos de archivos PDF de su web
- Comentarios en HTML
- Headers HTTP
- Archivos .git expuestos

**Ejercicio 3:** Analizá 3 job postings de una empresa de tecnología. ¿Qué inferencias podés hacer sobre su stack y posibles vulnerabilidades?

**Ejercicio 4:** Creá un collage de información sobre una empresa usando al menos 5 fuentes diferentes. ¿Qué conclusiones podés sacar?

---

## 5. Persistence and Patience

### 5.1 Horas/Días/Semanas en el Mismo Target

El hacking real no es como en las películas. No entrás en 5 minutos. A veces pasás 3 días solo enumerando. 2 semanas buscando un vector. Un mes entero sin encontrar nada.

Y después, un día, encontrás algo.

#### La Curva de Descubrimiento

```
Resultados
    ^
    |        ____
    |       /    \
    |      /      \
    |  ___/        \____
    | /                  \___
    |/_______________________\___> Tiempo
        Días de nada    ¡Bingo!
```

Los primeros días son emocionantes. Después viene el valle de la desesperación. Y después, si persistís, el pico del descubrimiento.

#### Estrategias de [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

**1. Rotación de Enfoque**

No te quemes en un solo vector. Rotá:

```python
tareas = [
    "Enumeración de puertos",
    "Fuzzing de directorios",
    "Análisis de parámetros",
    "Revisión de JS",
    "Análisis de cookies",
    "Pruebas de autenticación",
    "Revisión de APIs",
    "OSINT adicional",
]

# Si después de 30 minutos no avanzás, rotá
for tarea in tareas:
    print(f"Trabajando en: {tarea}")
    # 30 minutos de enfoque
    if not success:
        continue  # Próxima tarea
```

**2. La Técnica Pomodoro (Modo Hacker)**

- 25 minutos de trabajo intenso
- 5 minutos de descanso
- Cada 4 pomodoros, descanso de 15-30 minutos

El cerebro necesita pausas para hacer conexiones laterales.

**3. El Diario de Bitácora**

Llevá un registro diario:

```
Día 1 - 12/05/2026:
  - Escaneo nmap completo
  - Puertos abiertos: 80, 443, 22, 8080, 3306
  - Noté que MySQL está expuesto (mal)
  - Probaré credenciales por defecto mañana

Día 2 - 13/05/2026:
  - Probé root:root en MySQL
  - Access denied
  - Probé fuerza bruta con hydra en MySQL
  - Rate limiting detectado después de 5 intentos
  - Cambiaré enfoque a la web app
```

### 5.2 Systematic Enumeration

La enumeración sistemática es la clave del éxito. No dejés nada sin revisar.

#### Checklist de Enumeración

```python
# === RED ===
nmap -sT -sV -sC -p- target.com -oA full_scan
nmap -sU --top-ports 100 target.com -oA udp_scan

# === WEB ===
whatweb https://target.com
curl -sI https://target.com
curl -s https://target.com/robots.txt
curl -s https://target.com/sitemap.xml
gobuster dir -u https://target.com -w common.txt
gobuster dns -d target.com -w subdomains.txt

# === SERVICES ===
nmap --script mysql-info -p 3306 target.com
nmap --script smb-enum-shares -p 445 target.com
nmap --script ssh2-enum-algos -p 22 target.com

# === API ===
curl -s https://api.target.com/v1/
curl -s https://api.target.com/swagger.json
curl -s https://api.target.com/openapi.json

# === SSL ===
openssl s_client -connect target.com:443
testssl.sh target.com
```

#### El Principio de No Confiar

No confíes en lo que el sistema te dice. Verificá todo:

- El server dice "Apache 2.4.41" → Verificá con fingerprinting: `nmap -sV --version-intensity 9 target.com`
- El login tiene CAPTCHA → Enviá el POST sin el CAPTCHA
- La API requiere token → Probá sin token
- La página tiene WAF → Probá con técnicas de bypass

### 5.3 No Rendirse

#### El Fracaso Es Parte del [proceso](../raw/0s-f0nd4m3nt0s.md#procesos)

Los hackers más grosos han fracasado más veces que los novatos han intentado.

- Kevin Mitnick fue atrapado y encarcelado
- HD Moore ([metasploit](../raw/m3t4spl01t.md)) tuvo incontables exploits que no funcionaron
- Todos los [bug bounty](../raw/b9g-b09nty.md) hunters tienen miles de reportes inválidos

#### Cómo Manejar la Frustración

1. **Tomá pausas.** 10 minutos de cafeína y aire fresco hacen maravillas.
2. **Cambiá de proyecto.** Si un target te está ganando, atacá otro.
3. **Hablá con alguien.** Explicar el problema a otro suele revelar la solución.
4. **Dormí.** El cerebro procesa problemas mientras dormís. Muchos bugs se resuelven al despertar.
5. **Releé tus notas.** A veces la respuesta está en algo que ya encontraste pero no conectaste.

#### Cuando Todo Falló — Casos de Persistencia

**Caso 1:** El Bug de los 6 Meses

Un investigador pasó 6 meses buscando una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en un software de backup. Nada. Un día, revisando un error oscuro en los logs, encontró que si enviaba un paquete [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) con un flag específico, el servicio crasheaba. Resultó ser un [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow). 6 meses para ese momento, y después 2 semanas para escribir el [exploit](../raw/m3t4spl01t.md#exploits).

**Caso 2:** La Race Condition Queue

En una pentest de una app financiera, el equipo pasó 4 semanas sin encontrar nada crítico. En la última semana, alguien notó que si enviabas 10 requests simultáneas de transferencia, el sistema procesaba algunas antes de actualizar el balance. Race condition. 6 cifras en transfers. Apareció en la última semana.

### 5.4 Ejercicios prácticos

**Ejercicio 1:** Elegí un lab de [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)) (o similar). Comprometelo sin usar walkthroughs. Llevá un diario de cada paso. Cronometrá cuánto te llevó.

**Ejercicio 2:** Practicá la rotación de enfoque: cuando estés trabado en un vector por más de 30 minutos, cambiá a otro completamente diferente. Documentá cuántas rotaciones necesitaste.

**Ejercicio 3:** Contá una historia de fracaso técnico que hayas tenido. ¿Qué aprendiste? ¿Cómo lo harías diferente ahora?

---

## 6. Note-Taking

### 6.1 Cómo Organizar Findings

Sin un buen sistema de notas, el conocimiento se pierde. Vas a encontrar algo hoy, y en 3 meses no te vas a acordar.

#### Sistemas de Organización

**1. Por Proyecto**

```
📁 HACKTHEBOX_MACHINES/
    ├── 📁 MachineName1/
    │   ├── enumeracion.txt
    │   ├── exploit.py
    │   ├── flags.txt
    │   └── notas.md
    ├── 📁 MachineName2/
    └── ...
📁 PENTESTS/
    ├── 📁 Cliente_Empresa_2026-05/
    │   ├── scope.md
    │   ├── findings.md
    │   ├── report.md
    │   └── evidence/
    └── ...
📁 CTF/
    ├── 📁 CTF_Name_2026/
    └── ...
📁 LEARNING/
    ├── 📁 Cheatsheets/
    ├── 📁 Tutorials/
    └── 📁 Papers/
```

**2. Por Tecnología**

```
📁 WEB/
    ├── xss_cheatsheet.md
    ├── sql_injection.md
    ├── ssrf_techniques.md
    └── ...
📁 WINDOWS/
    ├── privilege_escalation.md
    ├── ad_attacks.md
    └── ...
📁 LINUX/
    ├── privesc_checklist.md
    └── ...
```

#### Qué Anotar

1. **Comandos exactos.** No "escanée puertos", sino `nmap -sV -sC -p- -T4 10.10.10.10 -oA scan`
2. **Output relevante.** Cortá y pegá la parte importante.
3. **Fechas.** Cuándo hiciste cada descubrimiento.
4. **Contexto.** Por qué probaste X cosa.
5. **Resultados.** Funcionó o no funcionó. Si no funcionó, qué probaste después.
6. **Pensamientos.** Ideas locas que se te ocurran.

#### Formato de Notas Ideal

```markdown
# Target: 10.10.10.10 - MachineName

## Info General
- **Fecha:** 12/05/2026
- **OS:** Linux
- **Dificultad:** Medium
- **IP:** 10.10.10.10

## Enumeración

### nmap
```
[nmap](../raw/nm4p.md) -sV -sC -p- 10.10.10.10 -oA [nmap](../raw/nm4p.md)/full

22/[tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)   open  ssh     OpenSSH 7.9p1
80/tcp   open  [http](../raw/r3d3s-f0nd4m3nt0s.md#http)    Apache httpd 2.4.41
```

### HTTP (puerto 80)
- Apache 2.4.41
- Directorios encontrados: /admin, /backup, /api
- /backup contiene backup.sql (interesante)

## Explotación
[Lo que encontraste y cómo lo explotaste]

## Privilege Escalation
[Cómo escalaste privilegios]

## Flags
- **user.txt:** FLAG{user_flag_here}
- **root.txt:** FLAG{root_flag_here}

## Lo que Aprendí
- Nueva técnica de bypass de LFI
- Apache 2.4.41 tiene vulnerabilidad X conocida
```

### 6.2 Herramientas: CherryTree, Obsidian, Notion, Joplin

#### CherryTree

```bash
# Linux
sudo apt install cherrytree

# Características:
# - Estructura jerárquica de árbol
# - Rich text con código, imágenes, tablas
# - Búsqueda full text
# - Export a PDF, HTML, TXT
# - Encriptación de la base de datos
```

**Ventajas:** Simple, offline, estructura de árbol.
**Desventajas:** Interfaz vieja, no sincroniza.

#### Obsidian

```bash
# Descargar de https://obsidian.md
# Usa archivos markdown locales
```

**Ventajas:**
- Links entre notas ([[wikilinks]])
- Graph view (visualización de conexiones)
- Plugins (canvas, tags, templates)
- Sincronización vía git o Sync
- Comunidad enorme

**Estructura recomendada en Obsidian:**

```
📁 Vault de Hacking/
   ├── 📁 Máquinas/
   │   ├── HTB-Machine1.md
   │   └── HTB-Machine2.md
   ├── 📁 Técnicas/
   │   ├── SQLi.md
   │   ├── XSS.md
   │   └── Privesc-Linux.md
   ├── 📁 Herramientas/
   │   ├── nmap.md
   │   ├── hydra.md
   │   └── metasploit.md
   ├── 📁 CTFs/
   │   └── DEFCON-2026.md
   └── 📁 Diario/
       ├── 2026-05-12.md
       └── 2026-05-13.md
```

#### Notion

**Ventajas:**
- Todo en uno (notas, DBs, kanban, calendario)
- Sincronización perfecta
- Web clipper (guardar páginas enteras)
- Colaboración

**Desventajas:** Es lento, no es privado (todo en servers de Notion).

#### Joplin

```bash
# Open source, cross-platform
# Descargar de https://joplinapp.org

# Sincronización con Nextcloud, Dropbox, OneDrive
# CLI también disponible
```

**Ventajas:** Open source, encriptación E2E, markdown.
**Desventajas:** Interfaz fea, sincronización a veces conflictiva.

### 6.3 Estructura para Pentests

#### Plantilla de Notas de Pentest

```markdown
# Pentest — Cliente XYZ

## Scope
- **IPs:** 10.0.0.0/24
- **URLs:** https://app.cliente.com
- **Excluido:** Sistema de pagos, base de datos producción
- **Fechas:** 12-16 Mayo 2026
- **Metodología:** OWASP WSTG + NIST SP 800-115

## Credenciales Proporcionadas
- admin:TempPass2026 (cambiar al inicio)
- user:User1234

## Documentación del Cliente
- [Arquitectura](link)
- [Documentación API](link)
- [Políticas de seguridad](link)

## Cronograma
- [ ] Día 1: Reconocimiento pasivo, escaneo de red
- [ ] Día 2: Enumeración de servicios
- [ ] Día 3: Explotación
- [ ] Día 4: Post-explotación y persistencia
- [ ] Día 5: Reporte y debriefing

## Findings
### [CRÍTICO] SQL Injection en /api/users
**Descripción:** Parámetro `id` no sanitizado permite inyección SQL.

**Pasos para Reproducir:**
```bash
curl "[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://app.cliente.[com](../raw/w1n-s9bsyst3ms.md#com)/api/users?id=1 UNION SELECT ..."
```

**Impacto:** Acceso a todos los datos de usuarios.

**Recomendación:** Usar prepared statements.

**CWE:** CWE-89

**CVSS:** 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)

### [ALTO] IDOR en /api/profile
...
```

### 6.4 Ejercicios prácticos

**Ejercicio 1:** Elegí una herramienta de note-taking (Obsidian recomendada) y creá tu vault personal. Organizalo por: técnicas, herramientas, máquinas resueltas, diario.

**Ejercicio 2:** Documentá una máquina de [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)) (o similar) usando la plantilla de notas de pentest. Incluí todos los pasos, comandos y outputs.

**Ejercicio 3:** Creá un template en Obsidian para anotar nuevas técnicas con: nombre, descripción, comandos, ejemplo, referencias.

---

## 7. Self-Learning

### 7.1 Aprendiendo Nuevas Herramientas

Cada semana aparece una herramienta nueva. No podés aprenderlas todas. Pero podés aprender a aprenderlas rápido.

#### Método Rápido para Aprender Herramientas

```
1. Leé el README (5 min)
   - ¿Qué hace?
   - ¿Qué problema resuelve?
   - ¿Tiene dependencias?
   - ¿Es CLI, GUI, API?

2. Corré --help (2 min)
   - ¿Cuáles son los flags principales?
   - ¿Cuál es el modo de uso típico?

3. Buscá 3 ejemplos prácticos (10 min)
   - En Google "herramienta example pentest"
   - En YouTube
   - En el repo, en la carpeta examples/

4. Reproducí los ejemplos (20 min)
   - Con tus propios datos
   - Entendiendo qué hace cada flag

5. Leé el manual completo (30-60 min)
   - man herramienta
   - Ahora que tenés contexto, las opciones avanzadas tienen sentido

6. Aplicá a un caso real (1-2 horas)
   - Usala en una máquina de práctica
   - Experimentá con opciones no estándar
```

#### Herramientas que Vale la Pena Aprender en Profundidad

- **[nmap](../raw/nm4p.md)** — No solo -sV -sC. Aprendé scripts NSE, timing, firewalls bypass.
- **[burp suite](../raw/w3b-h4ck1ng.md#burp-suite)** — No solo el [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy). Aprendé Repeater, Intruder, Extensions.
- **[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat)** — No solo -a 0. Aprendé rules, masks, attack modes.
- **[metasploit](../raw/m3t4spl01t.md)** — No solo [exploit](../raw/m3t4spl01t.md#exploits)/multi/handler. Escribí tus propios módulos.
- **[python](../raw/pyth0n-f0r-h4ck1ng.md)** — No solo requests. Aprendé sockets, asyncio, ctypes.

### 7.2 Leyendo Código

Leer código de otros es una de las habilidades más infravaloradas. Te enseña:
- Cómo piensan otros desarrolladores
- Patrones comunes (y sus fallas de seguridad)
- Nuevas técnicas y APIs

#### Estrategia para Leer Código

**1. Código de Exploits**

```python
# 1. Buscá el exploit en GitHub o Exploit-DB
# 2. Identificá:
#    - ¿Cuál es la vulnerabilidad? (CVE, CWE)
#    - ¿Qué versión es afectada?
#    - ¿Qué condiciones se necesitan?
# 3. Leé línea por línea
# 4. Modificá una variable y observá qué pasa
# 5. Reescribí el exploit con tus propias palabras
```

**2. Código de Herramientas de Seguridad**

```python
# Buscá herramientas open source:
# - Impacket (protocolos Windows)
# - Responder (LLMNR/NBT-NS)
# - BloodHound (análisis de AD)
# - Empire (post-explotación)

# Analizá un módulo a la vez
# Buscá archivos pequeños primero (< 500 líneas)
# Entendé la estructura general antes de los detalles
```

**3. Código de Aplicaciones Vulnerables (intencionalmente)**

```python
# DVWA, bWAPP, WebGoat, Juice Shop
# Compará el código vulnerable con la versión parcheada
# Entendé por qué el cambio corrige la vulnerabilidad
```

#### Ejercicio de Lectura de Código

```python
# Leé este código y encontrá 3 vulnerabilidades:
@app.route('/api/user/<id>')
def get_user(id):
    query = f"SELECT * FROM users WHERE id = {id}"
    result = db.execute(query)
    user = result.fetchone()
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user[0],
        "username": user[1],
        "email": user[2],
        "admin": user[3]
    }), 200
```

### 7.3 Leyendo Papers

Los papers académicos son difíciles de leer, pero contienen las técnicas más avanzadas.

#### Cómo Leer un Paper de Seguridad

```
1. **Leé el título y abstract** (2 min)
   - ¿De qué trata?
   - ¿Es relevante para vos?

2. **Mirá las figuras y tablas** (5 min)
   - Dan una idea visual del ataque
   - Los diagramas de flujo explican todo

3. **Leé la introducción y la conclusión** (10 min)
   - Entendé el problema y la solución propuesta
   - Esto es suficiente para la mayoría de los papers

4. **Si es realmente relevante, leé todo** (1-2 horas)
   - Sección de background (si no conocés el tema)
   - Sección de metodología (cómo lo hicieron)
   - Sección de resultados (cuán efectivo es)

5. **Buscá implementaciones**
   - GitHub: "paper_name implementation"
   - Muchos papers tienen código open source asociado
```

#### Papers Fundamentales para un Hacker

| Paper | Año | Aporte |
|-------|-----|--------|
| Bleichenbacher — Chosen Ciphertext Attacks | 1998 | Padding oracle contra [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) |
| Wang et al. — Collisions for MD5 | 2004 | Rompiendo MD5 |
| Klein — Subexponential Attack on RC4 | 2008 | Debilidad de RC4 |
| Stevens et al. — SHAttered | 2017 | Colisión SHA1 |
| Schroeder/Christensen — Certified Pre-Owned | 2021 | Ataques a [ad](../raw/w1nd0ws-d0m41n-4dm1n.md) CS |
| Dai et al. — [badusb](../raw/ph7s1c4l-r3d.md#badusb) | 2014 | Ataques por USB |
| Kocher et al. — Spectre | 2018 | Side-channel CPU |

### 7.4 Reproduciendo Exploits de 1-Day

Un exploit de 1-day es un exploit para una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) ya conocida (con [cve](../raw/s3c-f0nd4m3nt0s.md#cve) y parche disponible). Reproducirlos es la mejor práctica.

#### Dónde Encontrar Exploits

```bash
# Exploit-DB
searchsploit apache 2.4.49
searchsploit -t "rce"

# GitHub
# Buscar: "CVE-2024-XXXX"
# Buscar: "CVE-2024-XXXX exploit"

# Packet Storm
# https://packetstormsecurity.com

# Metasploit
msfconsole
search apache rce
```

#### [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Reproducción

```python
# 1. Setup del ambiente vulnerable
docker pull vulhub/CVE-2024-XXXX
docker-compose up -d

# 2. Verificar que el servicio corre
curl http://localhost:8080

# 3. Entender el PoC
# Leer el código del exploit
# Identificar: target, payload, condiciones

# 4. Ejecutar
python exploit.py -t http://localhost:8080

# 5. Verificar éxito
# El exploit ejecuta 'id', verificamos output
# O crea un archivo /tmp/pwned
```

### 7.5 Plataformas de Práctica

#### [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox))

```bash
# https://www.hackthebox.com
# Máquinas de todas las dificultades
# Challenges de varias categorías
# Pro Labs (entornos corporativos simulados)
# Academy (cursos guiados)
```

**Recomendación:** Empezá con máquinas "Easy" hasta dominar la enumeración. Después pasá a "Medium".

#### [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)

```bash
# https://tryhackme.com
# Más guiado que HTB
# Rooms estructurados por temas
# Ideal para principiantes
```

**Recomendación:** Hacé "Complete Beginner", "Web Hacking", "[privilege escalation](../raw/l1n9x-pr1v3sc.md)".

#### PentesterLab

```bash
# https://pentesterlab.com
# Enfocado en web
# Exercises progresivos
# Muy buen material teórico
```

#### PicoCTF

```bash
# https://picoctf.com
# Desafíos de criptografía, reversing, pwn
# Ideal para practicar fundamentos
# Competencia anual (pero challenges siempre disponibles)
```

#### [ctf](../raw/ctf-h4ckth3b0x.md) Competitions

```bash
# CTFtime: https://ctftime.org
# Calendario de competencias
# Writeups de competencias pasadas
```

### 7.6 Ejercicios prácticos

**Ejercicio 1:** Elegí una herramienta que no conozcas (ej: ffuf, masscan, [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)-python). Aprendela usando el método rápido. Documentá el proceso.

**Ejercicio 2:** Buscá un exploit en Exploit-DB, leé el código línea por línea. Reescribilo con tus propias palabras. Ejecutalo contra un ambiente vulnerable (podés usar VulHub).

**Ejercicio 3:** Leé el paper "Certified Pre-Owned" de Schroeder/Christensen (sobre AD CS). Resumilo en una página. Implementá uno de los ataques en tu lab.

**Ejercicio 4:** Completá una máquina "Easy" de HackTheBox sin walkthrough. Documentá todo.

---

## 8. Learning from Failures

### 8.1 Analizando Errores

Todo hacker tiene más fracasos que éxitos. La diferencia está en qué hacés con esos fracasos.

#### El Análisis Post-Mortem

Después de cada fracaso importante, escribí:

```
## Post-Mortem: [Nombre del Fracaso]

### ¿Qué pasó?
[Descripción objetiva de los hechos]

### ¿Qué salió mal?
[Lista de cosas que no funcionaron]

### ¿Por qué?
[Análisis de causa raíz]

### ¿Qué haría diferente?
[Lecciones aprendidas]

### ¿Qué aprendí?
[Técnicas, herramientas, conceptos nuevos]
```

#### Tipos Comunes de Fracaso

**1. Fracaso Técnico**

"Probé [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) durante 3 horas y después me di cuenta que usaba JSON, no SQL."

- **Causa:** No entendí el stack tecnológico.
- **Lección:** Siempre verificá qué tecnología estás enfrentando antes de atacar.

**2. Fracaso Estratégico**

"Gasté 2 días en un vector que no llevaba a nada."

- **Causa:** No prioricé correctamente.
- **Lección:** Hacé un árbol de ataque. Priorizá los vectores más probables.

**3. Fracaso de Ejecución**

"El [exploit](../raw/m3t4spl01t.md#exploits) funcionaba en mi lab pero no en producción."

- **Causa:** Diferencias de ambiente.
- **Lección:** Probá el exploit en condiciones lo más parecidas a producción.

**4. Fracaso de Creatividad**

"No se me ocurrió probar X."

- **Causa:** Sesgo de confirmación.
- **Lección:** Usá listas de chequeo. No asumas nada.

### 8.2 Post-Mortems

#### Ejemplo de Post-Mortem Real

```
## Post-Mortem: Pentest Fallida en Cliente Financiero

### ¿Qué pasó?
Pasé 5 días en una pentest de una app financiera. No encontré nada crítico.
El cliente estaba disconforme.

### ¿Qué salió mal?
1. Pasé demasiado tiempo en el login (SQLi, bruteforce)
2. No exploré suficientemente las APIs internas
3. No revisé los archivos JS (que contenían endpoints ocultos)

### ¿Por qué?
1. Estaba cómodo con SQLi y me quedé en mi zona de confort
2. Las APIs no estaban documentadas y me dio fiaca explorarlas
3. No sabía que JS minificado contenía endpoints

### ¿Qué haría diferente?
1. Enumeración más agresiva de endpoints (burp, ffuf)
2. Decompilar JS automáticamente (js-beautify, linkfinder)
3. Probar IDOR en todos los endpoints de API
4. Pedir más documentación al cliente

### ¿Qué aprendí?
- Las APIs no documentadas son GOLD
- JS minificado SIEMPRE tiene algo interesante
- No subestimar los endpoints "internos"
```

### 8.3 Documentando lo Aprendido

#### Diario de Aprendizaje

Mantené un diario semanal:

```markdown
## Semana del 12/05 al 18/05/2026

### Lo que Hice
- Completé 2 máquinas de HTB (Cronos, Shocker)
- Leí paper sobre AD CS
- Practiqué 3 horas de hashcat rules

### Lo que Aprendí
- Técnica nueva de LFI bypass con php://filter
- Cómo funciona ESC8 (AD CS relay)
- Por qué OneRuleToRuleThemAll es mejor que best64 sola

### Lo que No Entendí
- Sigue sin quedarme claro el attack de diamond ticket

### Plan para la Próxima Semana
- Reproducir diamond ticket en el lab
- Hacer 3 máquinas más de HTB
- Leer paper sobre Kerberos delegation
```

### 8.4 Ejercicios prácticos

**Ejercicio 1:** Escribí un post-mortem de un fracaso real (técnico o no). Usá el formato del ejemplo. Identificá 3 lecciones aprendidas.

**Ejercicio 2:** Empezá un diario de aprendizaje semanal. Escribí las primeras 3 entradas (pasadas, aunque sea ficticias).

**Ejercicio 3:** Analizá un error común en hacking (ej: "usar [metasploit](../raw/m3t4spl01t.md) sin entender qué hace"). Escribí un pequeño artículo sobre por qué es malo y cómo mejorar.

---

## 9. Ethical Boundaries

### 9.1 Saber Dónde Parar

El hacking es una herramienta poderosa. Como toda herramienta poderosa, puede usarse para bien o para mal.

#### Línea Roja Absoluta

Nunca:
- Accedás a sistemas sin autorización
- Modifiques datos sin permiso
- Exfiltres información personal
- Dañes sistemas intencionalmente
- Usés técnicas de ingeniería social contra personas no autorizadas

#### La Prueba de los 3 Segundos

Antes de ejecutar cualquier acción, preguntate:

1. **¿Tengo autorización explícita?**
   - Si no, pará.
   - Si sí, verificá el alcance.

2. **¿Esto puede dañar a alguien?**
   - Si puede causar daño, pará y pensá.
   - ¿Hay un camino más seguro?

3. **¿Me sentiría cómodo explicando esto en un juicio?**
   - Si no, no lo hagas.

### 9.2 Alcance de Autorización

En una pentest, el scope es SAGRADO. No importa que encuentres algo fuera de scope. No lo toques.

#### Ejemplo de Scope

```markdown
# Scope Autorizado

## IN-SCOPE
- app.cliente.com (web app)
- api.cliente.com (API)
- 10.0.0.0/24 (red interna de prueba)

## OUT-OF-SCOPE
- Producción (10.0.1.0/24)
- Sistema de pagos (pagos.cliente.com)
- Base de datos de producción
- Empleados (ingeniería social)
- Terceros (proveedores)
```

#### QUÉ HACER si encontrás algo fuera de scope:

1. **No lo toques.** No explores, no escanées, no mires.
2. **Documentalo.** Anotá qué viste y dónde.
3. **Reportalo al cliente.** "Encontramos X fuera de scope. ¿Quieren extender el alcance?"

### 9.3 Responsible Disclosure

Encontraste una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en un producto. No sos cliente, no tenés autorización. ¿Qué hacés?

#### El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Disclosure

```
1. Verificá que la vulnerabilidad es real
   - Reproducila en un ambiente controlado
   - Asegurate de que no es un falso positivo

2. Buscá contacto de seguridad
   - security@company.com
   - https://company.com/.well-known/security.txt
   - Bug bounty program (HackerOne, Bugcrowd)
   - LinkedIn del CISO/CSO

3. Reportá responsablemente
   - Descripción clara del problema
   - Pasos para reproducir
   - Impacto potencial
   - PoC limitado (no el exploit completo)
   - Ofrecé tiempo para parchear (45-90 días)

4. Esperá
   - Si responden bien: colaborá en el fix
   - Si no responden: escalá

5. Publicación
   - Después del plazo acordado
   - Sin detalles de explotación (o con detalles limitados)
```

#### [bug bounty](../raw/b9g-b09nty.md) vs Disclosure

- **Bug bounty:** Tenés permiso explícito. Podés probar cosas.
- **Disclosure:** No tenés permiso. Solo reportás lo que encontraste.

### 9.4 Erring on the Side of Caution

Si tenés dudas, NO LO HAGAS.

#### Escenarios de Duda

**Escenario 1:** Encontrás una base de datos abierta. No está en el scope. Está expuesta en internet. ¿Entrás?

- **No.** Documentalo y reportalo.
- **Por qué:** Aunque es un riesgo de seguridad, entrar sin permiso es ilegal.

**Escenario 2:** Un compañero de trabajo te pide que "le chusmees el Facebook de su ex".

- **No.** Es ilegal y poco ético.
- **Por qué:** El hacking no es una herramienta personal.

**Escenario 3:** Encontrás un [rce](../raw/w3b-h4ck1ng.md#rce) en un sistema de salud. Podrías ver datos de pacientes.

- **Pará.** Reportá el RCE sin explotarlo más de lo necesario para demostrar el impacto.
- **Por qué:** Los datos de salud son particularmente sensibles.

### 9.5 Ejercicios prácticos

**Ejercicio 1:** Investigá el programa de bug bounty de una empresa grande (Google, Microsoft, Meta). Leé las reglas. ¿Qué está permitido y qué no?

**Ejercicio 2:** Redactá un reporte de responsible disclosure para una vulnerabilidad hipotética en un software open source que usás.

**Ejercicio 3:** Discutí con un colega (real o imaginario) los límites éticos del hacking. ¿Dónde trazás la línea?

---

## 10. Communication

### 10.1 Explicando Findings Técnicos a Audiencias No Técnicas

El mejor [exploit](../raw/m3t4spl01t.md#exploits) del mundo no sirve si no podés comunicar su impacto a quien toma decisiones.

#### El Problema

- Vos decís: "Encontré un [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) en el endpoint /api/users"
- El cliente escucha: "Algo con una base de datos"

#### El Marco de Comunicación

```
1. START WITH IMPACT (empezá con el impacto)
   - "Cualquier persona con acceso a internet puede robar TODOS los datos de usuarios"
   
2. THEN THE TECHNICAL DETAIL (después el detalle técnico)
   - "Porque el parámetro id no sanitiza el input, permitiendo inyección SQL"
   
3. THEN THE BUSINESS RISK (después el riesgo de negocio)
   - "Esto expone emails, contraseñas, y datos de pago. Podría costar $X en multas por GDPR"
   
4. THEN THE REMEDIATION (después la solución)
   - "La solución es parametrizar las consultas SQL, lo que toma aproximadamente 2 horas"
```

#### Traducción de Términos Técnicos

| Técnico | Traducción |
|---------|------------|
| SQL injection | Robo de base de datos |
| [xss](../raw/w3b-h4ck1ng.md#xss) | Robo de sesiones de usuarios |
| [rce](../raw/w3b-h4ck1ng.md#rce) | Control total del servidor |
| [privilege escalation](../raw/l1n9x-pr1v3sc.md) | Acceso a información restringida |
| IDOR | Acceso a datos de otros usuarios |
| [csrf](../raw/w3b-h4ck1ng.md#csrf) | Ejecutar acciones en nombre del usuario |
| [ssrf](../raw/w3b-h4ck1ng.md#ssrf) | Acceso a la [red](../raw/r3d3s-f0nd4m3nt0s.md) interna |
| [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow) | Ejecución de código malicioso |
| [mitm](../raw/m1tm-m0b1l3.md) | Interceptación de comunicaciones |
| Padding oracle | Descifrado de datos cifrados |

### 10.2 Escribiendo Reportes Claros

#### Estructura de un Hallazgo

```markdown
## [CRÍTICO] SQL Injection en /api/users

### Resumen
El endpoint /api/users es vulnerable a inyección SQL, permitiendo a un atacante
extraer toda la base de datos de usuarios.

### Impacto
- Exposición de 50,000 registros de usuarios (nombres, emails, contraseñas)
- Posible acceso a datos de tarjetas de crédito (almacenadas en otra tabla)
- Multas regulatorias por violación de GDPR/LGPD/PDPL

### Pasos para Reproducir
1. Enviar request: `GET https://app.example.com/api/users?id=1 UNION SELECT ...`
2. La respuesta incluye datos de todas las tablas

### Remediation
- Implementar prepared statements (cursores parametrizados)
- Validar que el parámetro id sea numérico
- Tiempo estimado: 2-4 horas

### Referencias
- CWE-89: SQL Injection
- OWASP Top 10 A03:2021
- CVSS: 9.1 (Critical)
```

### 10.3 Executive Summaries

Para el CEO, el directorio, o el cliente que solo quiere saber "¿estamos seguros?".

#### Formato de Executive Summary

```markdown
# Executive Summary — Pentest Cliente XYZ

## En Resumen
Realizamos una prueba de penetración sobre la aplicación web de XYZ.
Encontramos 12 vulnerabilidades: 1 crítica, 3 altas, 5 medias, 3 bajas.

## Lo Más Importante
**CRÍTICO:** Un atacante externo puede robar toda la base de datos de usuarios
a través de una vulnerabilidad en la API de consulta de perfiles.

Esto significa que:
- Los datos de sus 50,000 clientes están expuestos
- Incluye emails, contraseñas, y datos financieros
- Existe riesgo de multas regulatorias significativas

## Siguientes Pasos
1. **Inmediato:** Aplicar parche para la vulnerabilidad crítica (2-4 horas)
2. **Corto plazo:** Corregir las 3 vulnerabilidades altas (1-2 días)
3. **Mediano plazo:** Implementar programa de seguridad continua

## Resumen de Hallazgos

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| Crítico | 1 | SQL injection en API |
| Alto | 3 | XSS, IDOR, falta de autenticación |
| Medio | 5 | Headers de seguridad faltantes |
| Bajo | 3 | Información en comentarios HTML |
```

### 10.4 Ejercicios prácticos

**Ejercicio 1:** Escribí un hallazgo de seguridad ficticio (ej: una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en una app de ecommerce) usando el formato del reporte claro. Incluí resumen, impacto, pasos, remediación.

**Ejercicio 2:** Traducí 10 conceptos técnicos de hacking a lenguaje no técnico. Probá tus traducciones con un amigo/familiar no técnico.

**Ejercicio 3:** Escribí un executive summary de una página para un CEO ficticio. La empresa tiene 3 vulnerabilidades críticas, 5 altas, 10 medias.

---

## 11. Collaboration

### 11.1 Respetando a Otros Investigadores

La comunidad hacker es enorme. Gente de todo el mundo compartiendo conocimiento. Respetá a quien comparte.

#### Reglas de Convivencia

1. **No plagiar.** Si usás el trabajo de otro, da crédito.
2. **No robar reportes.** Si encontrás el mismo bug que otro, no lo reportes como tuyo.
3. **No despreciar.** Todos empezaron sin saber. Ayudá al que pregunta.
4. **No doxearte.** Protegé tu privacidad y la de otros.
5. **No competir destructivamente.** [bug bounty](../raw/b9g-b09nty.md) es cooperativo, no competitivo.

#### Cómo Dar Crédito

```markdown
# En un writeup
Este ataque está basado en la investigación de @investigador
(https://blog.investigador.com/ataque-increible)

# En un reporte
Esta técnica fue descubierta originalmente por Investigador (CVE-2024-XXXX)
```

### 11.2 Compartiendo Conocimiento

El conocimiento que no se comparte se pierde.

#### Formas de Compartir

1. **Writeups**
   - Después de resolver una máquina o [ctf](../raw/ctf-h4ckth3b0x.md)
   - Explicá tu [proceso](../raw/0s-f0nd4m3nt0s.md#procesos), no solo el resultado
   - Incluí comandos y explicaciones

2. **Blogs**
   - Escribí sobre técnicas que dominás
   - Incluí ejemplos prácticos
   - Usá un tono accesible

3. **Código**
   - Github con tus herramientas y scripts
   - Documentá bien (README, ejemplos)
   - Incluí tests

4. **Charlas**
   - Meetups locales (BSides, DEFCON groups)
   - Conferencias (Ekoparty, BugCon, 8.8)
   - Webinars

5. **Mentoreo**
   - Ayudá a principiantes
   - Revisá writeups de otros
   - Dó feedback constructivo

### 11.3 CTF Teamwork

Los CTFs se juegan en equipo. La dinámica de equipo es crucial.

#### Roles en un Equipo de CTF

- **Web:** Vulnerabilidades web
- **Pwn:** Explotación binaria
- **Crypto:** Desafíos criptográficos
- **Reversing:** Ingeniería inversa
- **Forensics:** Análisis [forense](../raw/w1n-f0r3ns1cs.md#forense)
- **Misc:** Desafíos varios ([osint](../raw/0s1nt.md), esteganografía, etc.)
- **OSINT:** Búsqueda de información

#### Organización del Equipo

```python
# 1. Canal de comunicación (Discord/Telegram)
# 2. Tablero de desafíos (Trello/Notion)
# 3. Repositorio compartido de scripts
# 4. Rotación de descanso (si es 48h)
# 5. Documentación en vivo

# Ejemplo de organización en Discord:
# #general
# #web-1, #web-2, ...
# #pwn
# #crypto
# #reversing
# #flags (spoilers!)
# #recursos (writeups externos)
```

### 11.4 Bug Bounty Community

#### Reglas No Escritas de Bug Bounty

1. **No escalees sin permiso.** Si encontrás [rce](../raw/w3b-h4ck1ng.md#rce) en un admin, no borres usuarios. Demostralo con un `whoami` o `sleep 5`.
2. **No compartas vulnerabilidades activas.** Hasta que el programa las resuelva, son confidenciales.
3. **No ataques a otros investigadores.** No robes reportes, no ataques la infraestructura de otros.
4. **Colaborá constructivamente.** Si otro investigador te pide ayuda, dala si podés.

#### Dónde Empezar en Bug Bounty

1. [hackerone](../raw/b9g-b09nty.md#hackerone)
2. [bugcrowd](../raw/b9g-b09nty.md#bugcrowd)
3. Intigriti
4. Synack
5. YesWeHack

### 11.5 Ejercicios prácticos

**Ejercicio 1:** Escribí un writeup de una máquina de [htb](../raw/ctf-h4ckth3b0x.md#hackthebox) o [tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme) que hayas resuelto. Publicalo en tu blog, Medium o GitHub.

**Ejercicio 2:** Encontra un proyecto de seguridad open source en GitHub. Leé el código. Encontrá un bug o una mejora. Hacé un pull request.

**Ejercicio 3:** Participá en un CTF (presencial u online). Trabajá en equipo. Documentá qué rol cumpliste y qué aprendiste.

---

## 12. Thinking Like an Attacker vs Defender

### 12.1 Adversarial Mindset

Pensar como atacante es ver el sistema desde afuera. Pensar como defensor es verlo desde adentro. Un buen hacker sabe hacer ambas.

#### La Diferencia

| Atacante | Defensor |
|----------|----------|
| Busca una sola entrada | Debe proteger todas las entradas |
| Tiene tiempo ilimitado | Tiene recursos limitados |
| Solo necesita un bug | No debe tener ningún bug crítico |
| Conoce su herramienta | Debe conocer todas las herramientas |
| Puede elegir el momento | Debe estar siempre preparado |

#### Cómo Pensar Como Defensor (para ser mejor atacante)

Preguntate:

- "Si yo defendiera este sistema, ¿dónde pondría recursos?"
- "¿Qué monitorearía?"
- "¿Qué alertas configuraría?"
- "¿Qué parchearía primero?"
- "¿Dónde estarían mis puntos ciegos?"

### 12.2 [red](../raw/r3d3s-f0nd4m3nt0s.md) vs Blue

#### [red team](../raw/r3d-t34m-1nfr4.md)

```bash
# Enfoque ofensivo
# Simular ataques reales
# Probar detecciones
# Identificar brechas de seguridad

# Herramientas: Cobalt Strike, Empire, Metasploit
# Metodología: Cyber Kill Chain, ATT&CK
```

#### Blue Team

```bash
# Enfoque defensivo
# Detectar ataques
# Responder a incidentes
# Fortificar sistemas

# Herramientas: SIEM (Splunk, ELK), EDR (CrowdStrike, Defender)
# Metodología: NIST IR, Pyramid of Pain
```

#### [purple team](../raw/p9rpl3-t34m.md)

```bash
# Colaboración Red + Blue
# Red team ataca, blue team detecta
# Mejora continua de ambas partes
# Ejercicios TTX (Tabletop Exercises)

# Objetivo: Mejorar la postura de seguridad, no "ganarle" al otro equipo
```

### 12.3 Anticipar y Prepararse para Detección

Como atacante, tenés que asumir que TE VAN A DETECTAR. La pregunta es: ¿cuánto tiempo tenés antes de que te echen?

#### [opsec](../raw/0ps3c-pr0.md) ([operational security](../raw/0ps3c-pr0.md))

```bash
# 1. Usá proxies/VPNs rotativas
# 2. Limpiá logs después de cada acción
# 3. Usá técnicas de living-off-the-land (LOLBins)
# 4. Evitá patrones conocidos
# 5. Respetá horarios laborales (no ataques a las 3 AM)
# 6. Usá técnicas de evasión de AV/EDR
```

#### Conociendo las Defensas

```python
# Antes de atacar, investigá:
# 1. ¿Qué EDR usan? (CrowdStrike, Defender for Endpoint, SentinelOne)
# 2. ¿Tienen SIEM? (Splunk, Elastic, QRadar)
# 3. ¿Tienen WAF? (Cloudflare, Akamai, AWS WAF)
# 4. ¿Tienen SOAR? (automatización de respuesta)
# 5. ¿Tienen un equipo SOC 24/7?

# Si tienen todo: movete lento y silencioso
# Si no tienen nada: tenés más libertad, pero no te confíes
```

### 12.4 Ejercicios prácticos

**Ejercicio 1:** Ponete en el lugar de un defensor. Diseñá un plan de monitoreo para una empresa de 500 empleados. ¿Qué alertas configurarías? ¿Qué herramientas usarías?

**Ejercicio 2:** Ahora ponete en el lugar de un atacante. ¿Cómo evadirías las defensas que diseñaste en el ejercicio 1?

**Ejercicio 3:** Investigá el framework [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck). Elegí 3 técnicas ofensivas y 3 defensivas relacionadas. Explicá cómo se enfrentan.

---

## 13. Apéndice A — Recursos Recomendados

### Libros

- **The Art of Intrusion** — Kevin Mitnick (historias reales de hacking)
- **The Art of Deception** — Kevin Mitnick (ingeniería social)
- **Ghost in the Wires** — Kevin Mitnick (autobiografía)
- **The Web Application Hacker's Handbook** — Stuttard & Pinto
- **Penetration Testing: A Hands-On Introduction to Hacking** — Georgia Weidman
- **[red team](../raw/r3d-t34m-1nfr4.md) Field Manual** — Ben Clark
- **Blue Team Field Manual** — Alan White

### Blogs y Sitios

- **PortSwigger Research** — blog.portswigger.net
- **SANS ISC** — isc.sans.edu
- **Google Project Zero** — googleprojectzero.blogspot.[com](../raw/w1n-s9bsyst3ms.md#com)
- **Mandiant** — mandiant.com/resources
- **SpecterOps** — posts.specterops.io
- **[active directory](../raw/w1nd0ws-d0m41n-4dm1n.md) Security** — adsecurity.org

### Canales de YouTube

- **IppSec** — Walkthroughs de [htb](../raw/ctf-h4ckth3b0x.md#hackthebox)
- **LiveOverflow** — Explicaciones técnicas profundas
- **[john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) Hammond** — CTFs y malware analysis
- **NetworkChuck** — Introductorio, entretenido
- **STÖK** — [bug bounty](../raw/b9g-b09nty.md)
- **The Cyber Mentor** — Pentesting, OSCP

### Podcasts

- **Darknet Diaries** — Historias reales de hacking
- **Security Now** — Noticias de seguridad
- **Risky Business** — Noticias semanales
- **Smashing Security** — Humor y seguridad

### Comunidades

- **[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)) Discord**
- **r/netsec** (Reddit)
- **r/AskNetsec** (Reddit)
- **[hackerone](../raw/b9g-b09nty.md#hackerone) Community**
- **[bugcrowd](../raw/b9g-b09nty.md#bugcrowd) Forum**

---

## 14. Apéndice B — Plantilla de Reportes

### Plantilla de Notas de Pentest

```markdown
# Pentest — [Cliente]

## Información General
- **Cliente:** [Nombre]
- **Fecha:** [Rango de fechas]
- **Tipo:** [Externa/Interna/Web/Móvil]
- **Alcance:** [IPs, URLs, apps]
- **Metodología:** [OSSTMM, OWASP, PTES]

## Resumen Ejecutivo
[Párrafo para no técnicos]

## Hallazgos

### [CRÍTICO/Alto/Medio/Bajo/Info] — [Nombre del hallazgo]

**Descripción:**

**Impacto:**

**Pasos para Reproducir:**
```
[Comandos/requests]
```

**Evidencia:**
[Screenshots, logs]

**Remediación:**
[Pasos para corregir]

**CWE:** [ID]
**CVSS:** [Score]

---

## Log de Actividades

### Día 1 — [Fecha]
[Actividades realizadas]

### Día 2 — [Fecha]
[Actividades realizadas]
```

### Plantilla de Executive Summary

```markdown
# Executive Summary

## Overview
[Resumen de una página]

## Findings by Severity
- Critical: [N]
- High: [N]
- Medium: [N]
- Low: [N]
- Informational: [N]

## Top 3 Risks
1. [Risk 1]
2. [Risk 2]
3. [Risk 3]

## Recommendations

### Immediate (0-7 days)
- [Action]

### Short Term (7-30 days)
- [Action]

### Long Term (30-90 days)
- [Action]
```

---

## 15. Apéndice C — Glosario de Mentalidad

- **Abducción:** Inferir la causa más probable de una observación
- **Análisis de causa raíz:** Encontrar el origen de un problema
- **ATT&CK:** Framework de tácticas y técnicas ofensivas
- **Ciber Kill Chain:** Framework de fases de un ataque
- **Collage de información:** Juntar piezas de información para formar una imagen completa
- **Creative problem solving:** Resolución creativa de problemas
- **CSIRT:** Computer Security Incident Response Team
- **CVSS:** Common Vulnerability Scoring System
- **CWE:** Common Weakness Enumeration
- **EDR:** Endpoint Detection and Response
- **Ejercicio TTX:** Tabletop exercise, simulación de incidentes
- **Enumeration:** [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de recolectar información sobre un sistema
- **Inferencia:** Conclusión basada en evidencia
- **Lateral thinking:** Pensamiento lateral, salirse del camino obvio
- **LOLBins:** Living Off the Land Binaries
- **[mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck):** Base de conocimiento de tácticas y técnicas
- **[opsec](../raw/0ps3c-pr0.md):** [operational security](../raw/0ps3c-pr0.md), medidas para evitar detección
- **[osint](../raw/0s1nt.md):** Open Source Intelligence
- **Pentest:** Prueba de penetración autorizada
- **PoC:** Proof of Concept
- **Post-mortem:** Análisis después de un incidente o fracaso
- **[purple team](../raw/p9rpl3-t34m.md):** Colaboración entre [red](../raw/r3d3s-f0nd4m3nt0s.md) y blue team
- **RCA:** Root Cause Analysis
- **[red team](../raw/r3d-t34m-1nfr4.md):** Equipo ofensivo en simulaciones
- **Responsible disclosure:** Divulgación responsable de vulnerabilidades
- **SCAMPER:** Técnica de creatividad (Sustituir, Combinar, Adaptar, Modificar, Poner en otro uso, Eliminar, Revertir)
- **Scope:** Alcance autorizado de una prueba
- **SIEM:** Security Information and Event Management
- **SOC:** Security Operations Center
- **SOAR:** Security Orchestration, Automation and Response
- **Vulnerability disclosure:** Proceso de reportar vulnerabilidades
- **WAF:** Web Application [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls)
- **What if:** Técnica de cuestionamiento de suposiciones
- **Writeup:** Documentación detallada de cómo se resolvió un desafío

---

*Versión 1.0 — Mayo 2026*

*Tu mente es tu mejor herramienta. Cuidala, alimentala, y nunca dejes de aprender.*

*— La comunidad hacker argentina*


