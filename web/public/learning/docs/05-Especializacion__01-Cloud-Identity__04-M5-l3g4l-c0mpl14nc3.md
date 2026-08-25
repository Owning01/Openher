# Legal / Compliance / Marco Legal — Guía Ultra-Detallada

## Índice

> ⏱️ **Tiempo estimado:** 10 horas (~2 sesiones) (2492 lineas)


1. [Introducción al Marco Legal en Ciberseguridad](#1-introducción-al-marco-legal-en-ciberseguridad)
2. [Leyes de Cibercrimen Internacionales](#2-leyes-de-cibercrimen-internacionales)
   - 2.1 [CFAA (Computer Fraud and Abuse Act) — Estados Unidos](#21-cfaa-computer-fraud-and-abuse-act--estados-unidos)
   - 2.2 [Computer Misuse Act — Reino Unido](#22-computer-misuse-act--reino-unido)
   - 2.3 [Ley de Delitos Informáticos Argentina (Ley 26.388)](#23-ley-de-delitos-informáticos-argentina-ley-26388)
   - 2.4 [Convenio de Budapest](#24-convenio-de-budapest)
3. [Marco Legal del Pentesting](#3-marco-legal-del-pentesting)
   - 3.1 [Autorización por Escrito](#31-autorización-por-escrito)
   - 3.2 [Definición de Scope (Alcance)](#32-definición-de-scope-alcance)
   - 3.3 [Rules of Engagement (RoE)](#33-rules-of-engagement-roe)
   - 3.4 [Seguros y Responsabilidad Civil](#34-seguros-y-responsabilidad-civil)
   - 3.5 [Acuerdos de Confidencialidad (NDA)](#35-acuerdos-de-confidencialidad-nda)
   - 3.6 [Manejo de Datos Durante el Pentest](#36-manejo-de-datos-durante-el-pentest)
4. [GDPR (General Data Protection Regulation)](#4-gdpr-general-data-protection-regulation)
   - 4.1 [Datos Personales y Categorías Especiales](#41-datos-personales-y-categorías-especiales)
   - 4.2 [Data Processor vs Data Controller](#42-data-processor-vs-data-controller)
   - 4.3 [Breach Notification (72 horas)](#43-breach-notification-72-horas)
   - 4.4 [Data Protection Impact Assessment (DPIA)](#44-data-protection-impact-assessment-dpia)
   - 4.5 [Derechos de los Titulares de Datos](#45-derechos-de-los-titulares-de-datos)
   - 4.6 [Artículo 32: Seguridad del Tratamiento](#46-artículo-32-seguridad-del-tratamiento)
   - 4.7 [Sanciones y Multas](#47-sanciones-y-multas)
5. [PCI-DSS (Payment Card Industry Data Security Standard)](#5-pci-dss-payment-card-industry-data-security-standard)
   - 5.1 [Los 12 Requisitos de PCI-DSS](#51-los-12-requisitos-de-pci-dss)
   - 5.2 [Niveles de SAQ (Self-Assessment Questionnaire)](#52-niveles-de-saq-self-assessment-questionnaire)
   - 5.3 [ASV Scanning (Approved Scanning Vendor)](#53-asv-scanning-approved-scanning-vendor)
   - 5.4 [CDE (Cardholder Data Environment) Scope](#54-cde-cardholder-data-environment-scope)
   - 5.5 [Segmentación de Red](#55-segmentación-de-red)
   - 5.6 [Escaneos Trimestrales](#56-escaneos-trimestrales)
6. [HIPAA (Health Insurance Portability and Accountability Act)](#6-hipaa-health-insurance-portability-and-accountability-act)
   - 6.1 [PHI (Protected Health Information)](#61-phi-protected-health-information)
   - 6.2 [Covered Entities](#62-covered-entities)
   - 6.3 [Business Associates](#63-business-associates)
   - 6.4 [Security Rule: Administrativa, Física, Técnica](#64-security-rule-administrativa-física-técnica)
   - 6.5 [Breach Notification Rule](#65-breach-notification-rule)
   - 6.6 [HIPAA y Pentesting](#66-hipaa-y-pentesting)
7. [SOC2 (Service Organization Control 2)](#7-soc2-service-organization-control-2)
   - 7.1 [Trust Services Criteria](#71-trust-services-criteria)
   - 7.2 [Type I vs Type II](#72-type-i-vs-type-ii)
   - 7.3 [SOC2 y Seguridad Informática](#73-soc2-y-seguridad-informática)
   - 7.4 [Preparación para una Auditoría SOC2](#74-preparación-para-una-auditoría-soc2)
8. [ISO 27001](#8-iso-27001)
   - 8.1 [ISMS (Information Security Management System)](#81-isms-information-security-management-system)
   - 8.2 [Annex A — Controles](#82-annex-a--controles)
   - 8.3 [Risk Assessment](#83-risk-assessment)
   - 8.4 [Statement of Applicability (SoA)](#84-statement-of-applicability-soa)
   - 8.5 [Auditoría Interna](#85-auditoría-interna)
   - 8.6 [Proceso de Certificación](#86-proceso-de-certificación)
9. [Chain of Custody (Cadena de Custodia)](#9-chain-of-custody-cadena-de-custodia)
   - 9.1 [Manejo de Evidencia Digital](#91-manejo-de-evidencia-digital)
   - 9.2 [Documentación de la Cadena de Custodia](#92-documentación-de-la-cadena-de-custodia)
   - 9.3 [Imagen Forense](#93-imagen-forense)
   - 9.4 [Verificación de Hash](#94-verificación-de-hash)
   - 9.5 [Almacenamiento Tamper-Proof](#95-almacenamiento-tamper-proof)
   - 9.6 [Admisibilidad Legal](#96-admisibilidad-legal)
10. [Bug Bounty Legal](#10-bug-bounty-legal)
    - 10.1 [Safe Harbor](#101-safe-harbor)
    - 10.2 [Platform Terms of Service](#102-platform-terms-of-service)
    - 10.3 [Disclosure Timing](#103-disclosure-timing)
    - 10.4 [Program Eligibility Requirements](#104-program-eligibility-requirements)
11. [Vulnerability Disclosure](#11-vulnerability-disclosure)
    - 11.1 [Responsible Disclosure](#111-responsible-disclosure)
    - 11.2 [Coordinated Disclosure](#112-coordinated-disclosure)
    - 11.3 [Full Disclosure](#113-full-disclosure)
    - 11.4 [Disclosure Timeline](#114-disclosure-timeline)
    - 11.5 [CVE ID Allocation](#115-cve-id-allocation)
    - 11.6 [Vendor Communication](#116-vendor-communication)
12. [Ejercicios Prácticos](#12-ejercicios-prácticos)

---

## 1. Introducción al Marco Legal en Ciberseguridad

El marco legal en ciberseguridad no es opcional — es obligatorio. Cada vez que hacés un pentest, participás en un [bug bounty](../raw/b9g-b09nty.md), o manejás datos de terceros, estás operando dentro de un marco legal que puede tener consecuencias graves si no lo respetás.

### Por qué importa el aspecto legal

1. **Protección personal:** Hacer un pentest sin autorización es un delito en casi todos los países
2. **Protección del cliente:** El cliente necesita garantías de que sus datos están seguros
3. **Protección profesional:** Una demanda por mal manejo de datos puede arruinar tu carrera
4. **Cumplimiento normativo:** Muchas industrias tienen requisitos legales específicos
5. **Credibilidad:** Los clientes serios solo trabajan con profesionales que entienden el marco legal

### Panorama general de regulaciones

```
Regulación  | Región       | Enfoque principal        | ¿Aplica a pentesters?
------------|--------------|--------------------------|---------------------
CFAA        | Estados Unidos| Acceso no autorizado     | SÍ — directamente
CMA         | Reino Unido  | Acceso no autorizado     | SÍ — directamente
Ley 26.388  | Argentina    | Delitos informáticos     | SÍ — directamente
GDPR        | EU/EEA       | Protección de datos      | SÍ — si manejás datos
PCI-DSS     | Global       | Datos de tarjetas        | SÍ — si tocás pagos
HIPAA       | Estados Unidos| Datos de salud          | SÍ — si tocás health data
SOC2        | Estados Unidos| Controles de seguridad  | SÍ — si auditan
ISO 27001   | Global       | ISMS                     | SÍ — si implementás
```

## 2. Leyes de Cibercrimen Internacionales

### 2.1 CFAA (Computer Fraud and Abuse Act) — Estados Unidos

La CFAA es la ley federal más importante de EE.UU. relacionada con cibercrimen. Fue promulgada en 1986 y ha sido enmendada múltiples veces.

**Texto legal:** 18 U.S.C. § 1030

**Qué penaliza:**

1. Acceder a una computadora sin autorización o excediendo la autorización
2. Obtener información mediante acceso no autorizado
3. Acceder intencionalmente a una computadora del gobierno
4. Intentar o conspirar para cometer fraude informático
5. Causar daño intencionalmente mediante acceso no autorizado
6. Tráfico de passwords y credenciales
7. Extorsión informática (amenazar con dañar sistemas)

**Penalidades:**

```
Delito                    | Prisión máxima        | Multa máxima
-------------------------|----------------------|--------------
Acceso sin autorización  | 1 año               | $100,000
Acceso + obtener info    | 5 años              | $250,000
Daño intencional         | 10 años             | $250,000
Daño con intención       | 20 años             | $250,000
Tráfico de credenciales  | 10 años             | $250,000
Extorsión informática    | 5 años              | $250,000
```

**Cómo aplica a pentesters:**

- Un pentest sin autorización escrita es una violación directa de la CFAA
- Incluso exceder el alcance autorizado puede ser violación
- [bug bounty](../raw/b9g-b09nty.md) con safe harbor explícito NO es violación
- La CFAA no distingue entre "hacker bueno" y "hacker malo" — solo importa la autorización

**Casos famosos relacionados:**

- **United States v. Nosal:** La corte dictaminó que violar los términos de servicio puede constituir violación de CFAA (aunque esto fue limitado después)
- **United States v. Auernheimer:** Obtener datos de un servidor abierto (AT&T iPad) fue considerado violación
- **Van Buren v. United States (2021):** La Corte Suprema limitó el alcance de CFAA — "exceder autorización" significa violar restricciones de acceso, no solo violar políticas de uso

### 2.2 Computer Misuse Act — Reino Unido

La Computer Misuse Act de 1990 (CMA) es la ley principal del Reino Unido contra el cibercrimen.

**Qué penaliza:**

1. **Section 1:** Acceso no autorizado a material informático
2. **Section 2:** Acceso no autorizado con intención de cometer otros delitos
3. **Section 3:** Acceso no autorizado con intención de dañar (modificar, borrar datos)
4. **Section 3A:** Creación o suministro de herramientas para cometer delitos informáticos
5. **Section 3ZA:** Ataques DoS (Denial of Service)

**Penalidades:**

```
Sección     | Ofensa                    | Prisión máxima
------------|---------------------------|---------------
Section 1   | Acceso no autorizado       | 2 años
Section 2   | Acceso + intención criminal| 5 años
Section 3   | Acceso + daño             | 10 años
Section 3ZA | DoS                       | 10 años
Section 3A  | Herramientas de hacking    | 2 años
```

**Cómo aplica a pentesters:**

- El pentest sin autorización viola Section 1 directamente
- Usar herramientas como [metasploit](../raw/m3t4spl01t.md), [sqlmap](../raw/w3b-h4ck1ng.md#sqlmap), o Burp sin autorización podría violar Section 3A
- Bug bounty con safe harbor explícito es la defensa legal principal

### 2.3 Ley de Delitos Informáticos Argentina (Ley 26.388)

Argentina tiene la Ley 26.388 de 2008 que modifica el Código Penal para incluir delitos informáticos.

**Artículos relevantes del Código Penal (modificados por Ley 26.388):**

- **Artículo 153:** Apoderamiento de datos (correos electrónicos, documentos)
- **Artículo 153 bis:** Interceptación de comunicaciones electrónicas
- **Artículo 155:** Divulgación de secretos
- **Artículo 157 bis:** Inserción de datos falsos en archivo de datos personales
- **Artículo 173 inciso 16:** Estafa informática
- **Artículo 183 y 184:** Daño informático

**Penalidades en Argentina:**

```
Delito                      | Prisión
----------------------------|---------
Apoderamiento de datos      | 15 días a 6 meses
Interceptación de comunicaciones | 15 días a 6 meses
Daño informático            | 15 días a 1 año
Estafa informática          | 1 a 6 años
Violación de datos personales | 1 mes a 2 años
```

**Cómo aplica a pentesters en Argentina:**

- Realizar un pentest sin autorización escrita es un delito penal
- La Ley 25.326 de Protección de Datos Personales (LOPD) también aplica
- Si el pentest involucra datos de usuarios argentinos, aplica la LOPD
- No hay una excepción legal para "investigadores de seguridad" — la autorización es la única defensa

### 2.4 Convenio de Budapest

El Convenio de Budapest (Convention on Cybercrime) es el primer tratado internacional sobre cibercrimen, adoptado por el Consejo de Europa en 2001.

**Países firmantes:** Más de 65 países incluyendo USA, UK, Argentina, Japón, Australia, Canadá

**Objetivos del convenio:**

1. Armonizar leyes de cibercrimen entre países
2. Facilitar la cooperación internacional
3. Establecer procedimientos para investigaciones transfronterizas
4. Definir delitos informáticos comunes

**Delitos definidos:**

```
- Acceso ilegal (Art. 2)
- Interceptación ilegal (Art. 3)
- Interferencia de datos (Art. 4)
- Interferencia de sistemas (Art. 5)
- Abuso de dispositivos (Art. 6)
- Falsificación informática (Art. 7)
- Fraude informático (Art. 8)
- Pornografía infantil (Art. 9)
- Violación de propiedad intelectual (Art. 10)
```

**Por qué importa a pentesters:**

- El convenio establece que el acceso no autorizado es ilegal en todos los países firmantes
- La cooperación internacional significa que podés ser extraditado por delitos informáticos
- Bug bounty con autorización escrita es la única protección legal

## 3. Marco Legal del Pentesting

### 3.1 Autorización por Escrito

La autorización por escrito es **el requisito legal más importante** para cualquier pentest.

**Qué debe incluir una autorización:**

```
1. Nombre del cliente y del pentester/empresa
2. Fechas específicas del pentest (inicio y fin)
3. Alcance detallado (IPs, dominios, aplicaciones)
4. Tipos de pruebas permitidas
5. Horarios de prueba (business hours, 24/7, etc.)
6. Contactos de emergencia (teléfono 24/7 del cliente)
7. Procedimiento de escalado
8. Manejo de datos descubiertos
9. Cláusula de confidencialidad
10. Firmas de ambas partes
```

**Ejemplo de autorización:**

```
AUTORIZACIÓN DE PRUEBAS DE SEGURIDAD

Cliente: Empresa S.A.
Pentester: Firma de Seguridad S.R.L.
Fecha: 01/06/2024 al 15/06/2024

ALCANCE:
  - 10.0.0.0/24 (red interna)
  - app.empresa.com (aplicación web)
  - api.empresa.com (API REST)
  - *.dev.empresa.com (entorno de desarrollo)

PRUEBAS PERMITIDAS:
  - Escaneo de vulnerabilidades (automatizado y manual)
  - Pruebas de penetración (web, API, red)
  - Ingeniería social (SOLO con aprobación explícita)
  - Explotación de vulnerabilidades críticas

PRUEBAS NO PERMITIDAS:
  - Denial of Service (DoS/DDoS)
  - Modificación o eliminación de datos de producción
  - Acceso a datos de usuarios reales
  - Phishing a empleados (excepto autorización adicional)

CONTACTO DE EMERGENCIA:
  - Juan Pérez: +54 11 5555-5555 (24/7)
  - María García: +54 11 5555-5556 (horario laboral)

FIRMAS:
  _________________          _________________
  Cliente                    Pentester
```

### 3.2 Definición de Scope (Alcance)

El scope define **exactamente** qué se va a probar y cómo.

**Componentes del scope:**

```
RED:
  - Rangos de IP (10.0.0.0/24, 192.168.1.0/24)
  - URLs y dominios (app.empresa.com, *.empresa.com)
  - Puertos específicos (80, 443, 8080-8443)

APLICACIONES:
  - URLs de aplicaciones web
  - Endpoints de API
  - Aplicaciones móviles (Android/iOS)
  - APIs de terceros integradas

USUARIOS:
  - Cuentas de prueba proporcionadas
  - Roles (admin, user, viewer)
  - ¿Se permite crear cuentas nuevas?

HORARIOS:
  - Business hours (9 AM - 6 PM)
  - 24/7 (con acuerdo de contingencia)
  - Ventanas de mantenimiento específicas
```

**Scope negativo (lo que NO se prueba):**

```
- Sistemas de producción críticos sin redundancia
- Bases de datos de producción (a menos que se especifique)
- Sistemas legacy sin parches recientes
- Equipos personales de empleados
- Sistemas de terceros (aunque estén integrados)
```

### 3.3 Rules of Engagement (RoE)

Las Rules of Engagement son el "manual de reglas" del pentest.

**Elementos de las RoE:**

```
1. PERMISOS:
   - ¿Se permite escaneo de vulnerabilidades?
   - ¿Se permite explotación de vulnerabilidades?
   - ¿Se permite pivoting lateral?
   - ¿Se permite extracción de datos?

2. RESTRICCIONES:
   - No DoS/DDoS
   - No modificar datos
   - No eliminar logs
   - No interrumpir servicios
   - No acceder a datos de usuarios reales

3. COMUNICACIÓN:
   - Reportar inmediatamente findings críticos
   - Reportar diariamente avances
   - Contacto de emergencia para incidentes

4. DATOS:
   - No almacenar datos de clientes
   - Destruir datos al finalizar
   - No transferir datos fuera del entorno
```

### 3.4 Seguros y Responsabilidad Civil

Un pentester profesional debe tener seguro de responsabilidad civil.

**Tipos de seguro:**

```
1. Profesional Liability (Errors & Omissions):
   - Cubre errores en la ejecución del pentest
   - Cubre omisiones (vulnerabilidades no detectadas)
   - Cobertura recomendada: $1M - $5M USD

2. Cyber Liability:
   - Cubre daños causados por el pentest
   - Cubre breaches de datos accidentales
   - Cobertura recomendada: $2M - $10M USD

3. General Liability:
   - Cubre daños físicos (si aplica)
```

**Por qué necesitás seguro:**

1. Requisito de muchos clientes enterprise
2. Protección contra demandas
3. Profesionalismo y credibilidad
4. Algunas plataformas de [bug bounty](../raw/b9g-b09nty.md) lo requieren

### 3.5 Acuerdos de Confidencialidad (NDA)

El NDA protege la información del cliente que ves durante el pentest.

**Qué cubre un NDA típico:**

```
- Hallazgos de seguridad (vulnerabilidades)
- Configuraciones de sistemas
- Código fuente
- Datos de clientes/usuarios
- Credenciales y accesos
- Arquitectura de red
- Información de empleados
```

**Duración típica:** 1-5 años después del pentest

### 3.6 Manejo de Datos Durante el Pentest

Cómo manejar los datos que encontrás durante las pruebas.

**Reglas de oro:**

1. **Minimización:** Solo accedé a los datos necesarios para validar la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades)
2. **No copiar:** No copies datos a tus sistemas personales
3. **No compartir:** No compartas datos con terceros
4. **Destrucción:** Destruí todos los datos al finalizar el contrato
5. **Reporte:** En el reporte, usá datos anonimizados o ficticios

**Ejemplo de manejo de datos:**

```
Encontraste una base de datos con emails de usuarios:
  MAL:  Exportar toda la tabla y guardarla localmente
  BIEN: Demostrar que podés acceder consultando un registro específico
  MAL:  Incluir emails reales en el reporte
  BIEN: Usar "email@ejemplo.com" como ejemplo en el reporte
  MAL:  Conservar los datos después del proyecto
  BIEN: Destruir todos los datos al finalizar con certificación
```

## 4. [gdpr](../raw/l3g4l-c0mpl14nc3.md#gdpr) (General Data Protection Regulation)

El GDPR es la regulación de protección de datos más importante del mundo. Aplica a cualquier organización que procese datos de ciudadanos de la UE, sin importar dónde esté ubicada.

### 4.1 Datos Personales y Categorías Especiales

**Definición de dato personal (Art. 4):**
Cualquier información relativa a una persona física identificada o identificable.

**Ejemplos de datos personales:**

```
- Nombre y apellido
- Correo electrónico
- Número de teléfono
- Dirección
- Número de identificación (DNI, pasaporte)
- Dirección IP
- Cookie ID
- Datos de localización
- Datos biométricos
- Datos genéticos
- Información de salud
- Opiniones políticas
- Religión
- Orientación sexual
```

**Categorías especiales de datos (Art. 9):**

```
- Origen racial o étnico
- Opiniones políticas
- Creencias religiosas o filosóficas
- Afiliación sindical
- Datos genéticos
- Datos biométricos (para identificación única)
- Datos de salud
- Vida sexual u orientación sexual
```

Estos datos tienen **protección reforzada** — su procesamiento está prohibido excepto en casos específicos.

### 4.2 Data Processor vs Data Controller

Esta distinción es fundamental en GDPR.

**Data Controller:**
La entidad que determina los propósitos y medios del procesamiento de datos.

```
Ejemplo: Empresa S.A. decide recolectar emails de usuarios para marketing
Rol: Controller
Responsabilidad: Principal — debe asegurar cumplimiento GDPR
```

**Data Processor:**
La entidad que procesa datos en nombre del controller.

```
Ejemplo: Un servicio de email marketing procesa los emails que Empresa S.A. le da
Rol: Processor
Responsabilidad: Secundaria — debe seguir instrucciones del controller
```

**Cómo aplica a pentesters:**

- Si hacés un pentest para un cliente y ves sus datos, probablemente sos un **data processor**
- Necesitás un contrato por escrito (Data Processing Agreement - DPA)
- El DPA debe especificar qué datos procesás, cómo, y por cuánto tiempo
- Si encontrás datos personales durante el pentest, tenés obligaciones específicas

**Data Processing Agreement (DPA) — elementos clave:**

```
1. Objeto y duración del procesamiento
2. Naturaleza y propósito del procesamiento
3. Tipo de datos personales
4. Categorías de titulares de datos
5. Obligaciones del processor
6. Medidas de seguridad
7. Subprocesadores (si aplica)
8. Notificación de breaches
9. Destrucción de datos al finalizar
```

### 4.3 Breach Notification (72 horas)

El Artículo 33 del GDPR requiere notificar breaches de datos personales.

**Obligaciones:**

```
CONTROLLER:
  - Notificar a la autoridad supervisora dentro de 72 horas
  - Documentar todos los breaches (aunque no se notifiquen)
  - Notificar a los titulares de datos si hay alto riesgo

PROCESSOR:
  - Notificar al controller SIN DEMORA después de detectar un breach
```

**Qué incluir en la notificación:**

```
1. Naturaleza del breach (qué pasó)
2. Categorías y número de titulares afectados
3. Categorías y número de registros afectados
4. Posibles consecuencias
5. Medidas tomadas o propuestas
6. Contacto del Data Protection Officer (DPO)
```

**Cómo aplica a pentesters:**

- Si durante un pentest encontrás que datos personales están expuestos, podrías tener que reportarlo
- Si el pentest causa accidentalmente una exposición de datos, es un breach
- Los pentesters deben tener procedimientos claros de notificación de breaches

### 4.4 Data Protection Impact Assessment (DPIA)

El DPIA es un [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) obligatorio cuando el procesamiento de datos puede resultar en alto riesgo para los derechos de las personas.

**Cuándo se requiere DPIA (Art. 35):**

```
1. Evaluación sistemática y profunda de aspectos personales
2. Procesamiento a gran escala de categorías especiales de datos
3. Monitoreo sistemático a gran escala de áreas públicas
4. Nuevas tecnologías
5. Perfilamiento de personas
6. Procesamiento de datos vulnerables
7. Combinación de datasets
8. Datos de localización
```

**Contenido de un DPIA:**

```
1. Descripción sistemática del procesamiento
2. Evaluación de necesidad y proporcionalidad
3. Evaluación de riesgos
4. Medidas para mitigar riesgos
```

**Cómo aplica a pentesters:**

- Un pentest puede ser parte de las medidas de mitigación identificadas en un DPIA
- Si el pentest involucra procesamiento de datos personales, puede requerir un DPIA
- Los resultados del pentest pueden alimentar el DPIA

### 4.5 Derechos de los Titulares de Datos

El GDPR otorga 8 derechos fundamentales a los titulares de datos:

```
1. DERECHO DE ACCESO (Art. 15):
   - Saber qué datos se procesan
   - Saber por qué se procesan
   - Obtener copia de los datos

2. DERECHO DE RECTIFICACIÓN (Art. 16):
   - Corregir datos incorrectos
   - Completar datos incompletos

3. DERECHO DE SUPRESIÓN (Art. 17 - "Derecho al Olvido"):
   - Solicitar eliminación de datos
   - Aplica cuando ya no son necesarios

4. DERECHO DE LIMITACIÓN (Art. 18):
   - Restringir el procesamiento temporalmente

5. DERECHO DE PORTABILIDAD (Art. 20):
   - Recibir datos en formato estructurado
   - Transferir datos a otro controller

6. DERECHO DE OPOSICIÓN (Art. 21):
   - Oponerse al procesamiento para marketing directo

7. DERECHO A NO SER OBJETO DE DECISIONES AUTOMATIZADAS (Art. 22):
   - Oponerse a decisiones basadas solo en algoritmos

8. DERECHO A SER INFORMADO (Art. 13-14):
   - Información clara sobre el procesamiento
```

### 4.6 Artículo 32: Seguridad del Tratamiento

El Artículo 32 es el más relevante para pentesters. Requiere implementar medidas técnicas y organizativas apropiadas.

**Medidas técnicas requeridas:**

```
a) Seudonimización y cifrado de datos personales
b) Capacidad de garantizar confidencialidad, integridad, disponibilidad y resiliencia
c) Capacidad de restaurar el acceso en caso de incidente
d) Proceso regular de prueba, evaluación y verificación de medidas (¡PENTEST!)
```

**Lo que dice el Artículo 32:**

```
"El responsable y el encargado del tratamiento aplicarán medidas técnicas
y organizativas apropiadas para garantizar un nivel de seguridad adecuado
al riesgo, que en su caso incluya, entre otros:

d) un proceso de verificación, evaluación y valoración regulares de la
eficacia de las medidas técnicas y organizativas para garantizar la
seguridad del tratamiento."
```

**Interpretación para pentesters:**

- El pentest es explícitamente mencionado como medida de seguridad recomendada
- La frecuencia debe basarse en el riesgo
- Los resultados del pentest deben documentarse
- Las vulnerabilidades encontradas deben remediarse

### 4.7 Sanciones y Multas

El GDPR tiene el sistema de multas más severo del mundo.

**Estructura de multas:**

```
Infracción                               | Multa máxima
------------------------------------------|--------------
Infracciones "menores" (Art. 83.4):       |
  - No mantener registros                | 10M o 2% del volumen de negocio
  - No notificar breach                  |
  - No realizar DPIA                     |

Infracciones "graves" (Art. 83.5):        |
  - Procesar sin consentimiento          | 20M o 4% del volumen de negocio
  - Violar derechos de titulares          |
  - Transferencias internacionales        |
  - No implementar medidas de seguridad   |
  - No cumplir con autoridad supervisora  |
```

**Ejemplos de multas reales:**

```
EMPRESA        | MULTA          | MOTIVO
---------------|---------------|--------------------------------
Meta (2023)    | 1.2B          | Transferencias a EE.UU.
Amazon (2021)  | 746M          | Publicidad sin consentimiento
WhatsApp (2021)| 225M          | Falta de transparencia
Google (2019)  | 50M           | Falta de consentimiento
British Airways| 20M           | Breach de datos (reducida)
Marriott       | 18.4M         | Breach de datos (reducida)
```

## 5. PCI-DSS (Payment Card Industry Data Security Standard)

PCI-DSS es el estándar de seguridad para organizaciones que manejan datos de tarjetas de crédito. Es obligatorio si procesás, almacenás o transmitís datos de tarjetas.

### 5.1 Los 12 Requisitos de PCI-DSS

Los requisitos están organizados en 6 grupos (metas):

```
META 1: CONSTRUIR Y MANTENER UNA RED SEGURA

Requisito 1: Instalar y mantener firewall configuration
  - Firewall en el perímetro
  - Segmentación de red (CDE vs no-CDE)
  - Prohibir conexiones directas desde Internet
  - Revisar reglas de firewall cada 6 meses

Requisito 2: No usar passwords default del vendor
  - Cambiar todos los passwords por defecto
  - Deshabilitar cuentas default
  - Documentar configuraciones de seguridad
  - Usar encryption para passwords en tránsito

META 2: PROTEGER LOS DATOS DEL TITULAR DE LA TARJETA

Requisito 3: Proteger stored cardholder data
  - No almacenar datos sensibles después de autorización
  - Enmascarar PAN (mostrar solo últimos 4 dígitos)
  - Cifrar PAN almacenado
  - Proteger cryptographic keys
  - Documentar políticas de retención y destrucción

Requisito 4: Cifrar transmisión de cardholder data
  - Usar TLS 1.2+ para transmisión
  - No usar SSL/TLS temprano
  - Verificar certificados válidos

META 3: MANTENER UN PROGRAMA DE GESTIÓN DE VULNERABILIDADES

Requisito 5: Usar y actualizar antivirus
  - Antivirus en todos los sistemas comunes
  - Actualización automática
  - Escaneo regular
  - Logging de detecciones

Requisito 6: Desarrollar y mantener sistemas seguros
  - Mantener sistemas parcheados (critical: 30 días)
  - Establecer proceso de parcheo
  - Secure coding practices
  - Revisión de código (manual o automatizada)
  - Pentesting de aplicaciones web (anual + cambios significativos)

Requisito 7: Restringir acceso por necesidad de saber
  - Acceso basado en roles
  - Privilegios mínimos
  - Revisión de accesos trimestral

Requisito 8: Identificar y autenticar acceso a componentes
  - ID único para cada usuario
  - Autenticación multifactor (MFA) para acceso remoto
  - Política de passwords robusta
  - Bloqueo después de intentos fallidos

Requisito 9: Restringir acceso físico
  - Acceso físico controlado
  - Monitoreo de acceso
  - Eliminación segura de medios
  - Inventario de hardware

META 5: MONITOREAR Y PROBAR REDES REGULARMENTE

Requisito 10: Tracking y monitoreo de acceso
  - Logs de auditoría para todos los accesos
  - Logs inmutables (no modificables)
  - Monitoreo automatizado de anomalías
  - Retención de logs: 12 meses (3 meses online)

Requisito 11: Probar regularmente sistemas y procesos
  a) Pruebas de penetración anuales (red y aplicación)
  b) Escaneo de vulnerabilidades trimestral (ASV)
  c) IDS/IPS (Detección/Prevención de Intrusos)
  d) Cambios en la red -> escaneo y pentest
  e) Pruebas de seguridad en aplicaciones web (anual)
  f) Pruebas de integridad de archivos

META 6: MANTENER UNA POLÍTICA DE SEGURIDAD

Requisito 12: Mantener política de seguridad
  - Política de seguridad documentada
  - Asignación de responsabilidades
  - Evaluación de riesgos
  - Plan de respuesta a incidentes
  - Programa de concienciación
  - Gestión de proveedores
  - Revisión anual de la política
```

### 5.2 Niveles de SAQ (Self-Assessment Questionnaire)

El SAQ es un cuestionario de autoevaluación que determina el nivel de cumplimiento.

**Niveles de SAQ:**

```
SAQ A:         Comercios que tercerizan todo el procesamiento
               (ej: solo aceptan tarjetas, no almacenan nada)
               ~22 preguntas

SAQ A-EP:      Comercios que tercerizan pero procesan electrónicamente
               ~41 preguntas

SAQ B:         Comercios con terminales de impresión
               ~27 preguntas

SAQ B-IP:      Comercios con terminales IP
               ~30 preguntas

SAQ C-VT:      Comercios con terminales virtuales
               ~46 preguntas

SAQ C:         Comercios con sistemas conectados a Internet
               ~97 preguntas

SAQ D (Merchant): Comercios que procesan, almacenan o transmiten datos
                  ~250 preguntas

SAQ D (Service Provider): Proveedores de servicio
                          ~250 preguntas
```

### 5.3 ASV Scanning (Approved Scanning Vendor)

Los ASV son empresas aprobadas por el PCI Security Standards Council para hacer escaneos de vulnerabilidades.

**Requisitos de ASV:**

1. Escaneo trimestral (cada 90 días)
2. Realizado por empresa ASV aprobada
3. Escaneo externo e interno
4. Cubrir todo el CDE (Cardholder Data Environment)
5. Remediar vulnerabilidades críticas en 30 días
6. Escaneo de seguimiento después de remediación

**ASVs reconocidos:**

```
- Trustwave
- Qualys
- Rapid7
- Tenable
- McAfee
- Alert Logic
- ControlCase
```

### 5.4 CDE (Cardholder Data Environment) Scope

El CDE es el entorno que contiene datos de tarjetas.

**Componentes del CDE:**

```
1. Sistemas que almacenan, procesan o transmiten CHD (Cardholder Data)
2. Sistemas que se conectan directamente a sistemas del CDE
3. Sistemas de seguridad que protegen el CDE
   - Firewalls
   - IDS/IPS
   - Log servers
   - Authentication servers
```

**CHD (Cardholder Data):**

```
DATOS QUE NO SE PUEDEN ALMACENAR:
  - CVV/CVC2/CVV2
  - PIN
  - Datos de banda magnética completa

DATOS QUE SE PUEDEN ALMACENAR (PROTEGIDOS):
  - PAN (Primary Account Number) — debe estar cifrado
  - Nombre del titular
  - Fecha de expiración
  - Código de servicio
```

### 5.5 Segmentación de [red](../raw/r3d3s-f0nd4m3nt0s.md)

La segmentación reduce el alcance del CDE.

**Estrategias:**

```
1. AISLAMIENTO TOTAL:
   - CDE completamente separado (no routing)
   - Sin conexiones entre CDE y red corporativa
   - Acceso solo por bastion hosts

2. SEGMENTACIÓN CON FIREWALL:
   - Firewall entre CDE y red corporativa
   - Reglas restrictivas (deny all, allow by exception)
   - Revisión de reglas cada 6 meses

3. SEGMENTACIÓN LÓGICA:
   - VLANs separadas
   - ACLs en switches
   - Network segmentation en cloud (security groups)
```

### 5.6 Escaneos Trimestrales

Los escaneos trimestrales son obligatorios para PCI-DSS.

**Calendario de escaneos:**

```
Trimestre 1: 1 enero - 31 marzo (escaneo antes del 31 marzo)
Trimestre 2: 1 abril - 30 junio
Trimestre 3: 1 julio - 30 septiembre
Trimestre 4: 1 octubre - 31 diciembre
```

**Penalidades por no cumplir:**

```
- Multas mensuales por incumplimiento ($5,000 - $100,000)
- Aumento de tasas de intercambio
- Pérdida de capacidad de procesar tarjetas
- Costos de investigación forense
- Demandas civiles
- Daño reputacional
```

## 6. HIPAA (Health Insurance Portability and Accountability Act)

HIPAA es la ley de EE.UU. que protege datos de salud. Aplica a covered entities y business associates.

### 6.1 PHI (Protected Health Information)

PHI es cualquier información de salud que identifica a una persona o puede razonablemente usarse para identificarla.

**Qué es PHI:**

```
- Nombre del paciente
- Dirección (menos el estado)
- Fechas (nacimiento, admisión, alta, muerte)
- Números de teléfono
- Números de fax
- Correo electrónico
- Número de Seguro Social
- Número de historia clínica
- Número de beneficiario de salud
- Número de cuenta
- Certificado/licencia número
- Identificadores de vehículos
- URL/IP
- Huellas digitales, retina, voz
- Fotos de la persona
- Cualquier otro identificador único
```

**18 identificadores (Safe Harbor):**
Para que los datos NO sean PHI, deben eliminarse los 18 identificadores.

### 6.2 Covered Entities

Son las organizaciones que deben cumplir HIPAA.

**Tipos de covered entities:**

```
1. HEALTHCARE PROVIDERS:
   - Hospitales
   - Clínicas
   - Médicos
   - Dentistas
   - Farmacias
   - Laboratorios

2. HEALTH PLANS:
   - Compañías de seguro de salud
   - HMOs (Health Maintenance Organizations)
   - Medicare/Medicaid
   - Planes de salud de empleadores

3. HEALTHCARE CLEARINGHOUSES:
   - Entidades que procesan transacciones de salud
   - Billing services
   - Repricing services
```

### 6.3 Business Associates

Son proveedores externos que manejan PHI.

**Ejemplos de business associates:**

```
- Billing companies
- Transcription services
- Cloud hosting (si manejan PHI)
- Data analytics firms
- IT support
- Legal services (si manejan PHI)
- ACCOUNTING FIRMS
- Collection agencies

RELACIÓN CON PENTESTERS:
  Si hacés pentest para una covered entity y ves PHI,
  SOS UN BUSINESS ASSOCIATE y necesitás:
  - Business Associate Agreement (BAA) firmado
  - Medidas de seguridad específicas
  - Notificar breaches según HIPAA
```

### 6.4 Security Rule: Administrativa, Física, Técnica

La Security Rule de HIPAA tiene 3 tipos de salvaguardas:

**A. Salvaguardas Administrativas (45 CFR § 164.308):**

```
1. Security Management Process:
   - Risk analysis
   - Risk management
   - Sanction policy
   - Information system activity review

2. Assigned Security Responsibility:
   - Security officer designado

3. Workforce Security:
   - Authorization y supervisión
   - Termination procedures

4. Information Access Management:
   - Access authorization
   - Access establishment y modification

5. Security Awareness and Training:
   - Security reminders
   - Protection from malicious software
   - Log-in monitoring
   - Password management

6. Security Incident Procedures:
   - Response and reporting

7. Contingency Plan:
   - Data backup
   - Disaster recovery
   - Emergency mode operation
   - Testing and revision
   - Applications and data criticality

8. Evaluation:
   - Periodic technical and non-technical evaluation

9. Business Associate Contracts:
   - Written contracts with BAs
```

**B. Salvaguardas Físicas (45 CFR § 164.310):**

```
1. Facility Access Controls:
   - Contingency operations
   - Facility security plan
   - Access control and validation
   - Maintenance records

2. Workstation Use:
   - Policies for workstation use

3. Workstation Security:
   - Physical safeguards for workstations

4. Device and Media Controls:
   - Disposal
   - Media re-use
   - Accountability
   - Data backup and storage
```

**C. Salvaguardas Técnicas (45 CFR § 164.312):**

```
1. Access Control:
   - Unique user identification
   - Emergency access procedure
   - Automatic logoff
   - Encryption and decryption

2. Audit Controls:
   - Hardware, software, procedures to record activity

3. Integrity Controls:
   - Ensure ePHI is not improperly altered/destroyed

4. Person or Entity Authentication:
   - Verify persons seeking access

5. Transmission Security:
   - Integrity controls
   - Encryption
```

### 6.5 Breach Notification Rule

HIPAA requiere notificar breaches de PHI.

**Timeline de notificación:**

```
COVERED ENTITY:
  - Notificar a affected individuals: SIN DEMORA, máximo 60 días
  - Notificar a HHS (Department of Health and Human Services):
    * <500 individuos: reporte anual
    * >=500 individuos: notificar dentro de 60 días
    * 500+ individuos: prensa local debe ser notificada

BUSINESS ASSOCIATE:
  - Notificar a la covered entity SIN DEMORA
  - La covered entity hace la notificación externa
```

**Excepciones (no requiere notificación):**

```
1. Unintentional acquisition, access, or use por empleado autorizado
2. Inadvertent disclosure entre personas autorizadas
3. Baja probabilidad de compromiso de PHI (demostrable)
```

## 7. SOC2 (Service Organization Control 2)

SOC2 es un marco de auditoría desarrollado por AICPA (American Institute of CPAs) para evaluar controles de organizaciones de servicio.

### 7.1 Trust Services Criteria

SOC2 evalúa 5 criterios (TSC — Trust Services Criteria):

```
1. SEGURIDAD (Security):
   - Protección contra acceso no autorizado
   - Firewalls, IDS/IPS, access control
   - Monitoreo de seguridad

2. DISPONIBILIDAD (Availability):
   - El sistema está disponible para su operación
   - Disaster recovery
   - Business continuity
   - Monitoreo de uptime

3. INTEGRIDAD DE PROCESAMIENTO (Processing Integrity):
   - El procesamiento del sistema es completo, válido, preciso
   - Validación de datos
   - Procesamiento de transacciones

4. CONFIDENCIALIDAD (Confidentiality):
   - Información designada como confidencial está protegida
   - Cifrado
   - Access control
   - Data classification

5. PRIVACIDAD (Privacy):
   - Datos personales recolectados, usados, retenidos y eliminados
   - Cumplimiento con principios de privacidad
   - Consentimiento, notificación, derechos
```

### 7.2 Type I vs Type II

**SOC2 Type I:**

```
- Evalúa el diseño de controles en un momento específico
- Responde: ¿Los controles están diseñados adecuadamente?
- Más rápido y barato
- Menos evidencia requerida
- Generalmente se hace primero
```

**SOC2 Type II:**

```
- Evalúa la efectividad operativa de controles durante un período
- Responde: ¿Los controles funcionaron correctamente durante el período?
- Período mínimo: 6 meses (recomendado 12 meses)
- Más evidencia y testing
- Más valor para clientes
- Más caro y lento
```

### 7.3 SOC2 y Seguridad Informática

Los pentests son explícitamente parte de SOC2.

**Controles comunes de SOC2 relacionados a pentesting:**

```
CC6.1: Logical and physical access controls
  - Pentest de acceso lógico
  - Pruebas de autenticación y autorización

CC7.1: Detection of security events
  - Pentest de IDS/IPS
  - Pruebas de monitoreo

CC7.2: Response to security incidents
  - Simulaciones de incidentes
  - Tabletop exercises

CC7.3: Recovery from security incidents
  - Pruebas de backup y recovery

CC8.1: Change management
  - Pentest de cambios de infraestructura
  - Pruebas de CI/CD security
```

### 7.4 Preparación para una Auditoría SOC2

**Pasos para prepararse:**

```
1. GAP ANALYSIS:
   - Comparar controles actuales vs requeridos
   - Identificar deficiencias
   - Priorizar remediación

2. DOCUMENTACIÓN:
   - Políticas de seguridad
   - Procedimientos
   - Evidencia de controles

3. IMPLEMENTACIÓN DE CONTROLES:
   - Access control
   - Monitoreo
   - Respuesta a incidentes
   - Pentesting (al menos 1 vez durante el período)

4. PRUEBAS INTERNAS:
   - Pentest interno
   - Revisión de controles
   - Simulación de auditoría

5. AUDITORÍA:
   - Seleccionar auditor SOC2 (CPA firm)
   - Proporcionar evidencia
   - Facilitar entrevistas
```

## 8. [iso 27001](../raw/l3g4l-c0mpl14nc3.md#iso-27001)

ISO 27001 es el estándar internacional para sistemas de gestión de seguridad de la información (ISMS).

### 8.1 ISMS (Information Security Management System)

El ISMS es un enfoque sistemático para gestionar información sensible.

**Componentes del ISMS:**

```
1. CONTEXTO DE LA ORGANIZACIÓN:
   - Entender la organización y su contexto
   - Entender necesidades de partes interesadas
   - Definir alcance del ISMS
   - Establecer ISMS

2. LIDERAZGO:
   - Compromiso de la dirección
   - Política de seguridad
   - Roles y responsabilidades

3. PLANIFICACIÓN:
   - Evaluación de riesgos
   - Tratamiento de riesgos
   - Objetivos de seguridad

4. SOPORTE:
   - Recursos
   - Competencia
   - Concienciación
   - Comunicación
   - Documentación

5. OPERACIÓN:
   - Implementación de controles
   - Gestión de riesgos
   - Gestión de incidentes

6. EVALUACIÓN:
   - Monitoreo y medición
   - Auditoría interna
   - Revisión por la dirección

7. MEJORA:
   - No conformidades
   - Acciones correctivas
   - Mejora continua
```

### 8.2 Annex A — Controles

El Annex A de ISO 27001:2022 contiene 93 controles organizados en 4 dominios.

**Dominios del Annex A (2022):**

```
A.5 — Organizational Controls (37 controles):
  A.5.1  Políticas de seguridad
  A.5.2  Roles y responsabilidades
  A.5.3  Segregación de deberes
  A.5.4  Responsabilidad de la dirección
  A.5.5  Contacto con autoridades
  A.5.6  Contacto con grupos de interés
  A.5.7  Threat intelligence
  A.5.8  Security in project management
  A.5.9  Inventory of assets
  A.5.10 Classification of information
  A.5.11 Labeling of information
  A.5.12 Handling of assets
  A.5.13 Management of physical media
  A.5.14 Information transfer
  A.5.15 Access control
  A.5.16 Identity management
  A.5.17 Authentication info
  A.5.18 Access rights
  A.5.19 Security in supplier relationships
  A.5.20 Addressing security in supplier agreements
  A.5.21 Managing security in ICT supply chain
  A.5.22 Monitoring supplier services
  A.5.23 Information security for use of cloud services
  A.5.24 Information security incident management
  A.5.25 Assessment of information security events
  A.5.26 Response to incidents
  A.5.27 Learning from incidents
  A.5.28 Collection of evidence
  A.5.29 Security during disruption
  A.5.30 ICT readiness for business continuity
  A.5.31 Legal and contractual requirements
  A.5.32 Intellectual property rights
  A.5.33 Protection of records
  A.5.34 Privacy and PII
  A.5.35 Independent review of ISMS
  A.5.36 Compliance with policies and rules
  A.5.37 Documented operating procedures

A.6 — People Controls (8 controles):
  A.6.1  Screening
  A.6.2  Terms and conditions
  A.6.3  Information security awareness
  A.6.4  Disciplinary process
  A.6.5  Responsibilities after termination
  A.6.6  Confidentiality agreements
  A.6.7  Remote working
  A.6.8  Information security event reporting

A.7 — Physical Controls (14 controles):
  A.7.1  Physical security perimeter
  A.7.2  Physical entry
  A.7.3  Securing offices and facilities
  A.7.4  Physical security monitoring
  A.7.5  Protecting against physical threats
  A.7.6  Working in secure areas
  A.7.7  Clear desk and screen
  A.7.8  Equipment siting
  A.7.9  Security of assets off-premises
  A.7.10 Storage media
  A.7.11 Supporting utilities
  A.7.12 Cabling security
  A.7.13 Equipment maintenance
  A.7.14 Secure disposal

A.8 — Technological Controls (34 controles):
  A.8.1  User endpoint devices
  A.8.2  Privileged access rights
  A.8.3  Information access restriction
  A.8.4  Access to source code
  A.8.5  Secure authentication
  A.8.6  Capacity management
  A.8.7  Protection against malware
  A.8.8  Management of technical vulnerabilities
  A.8.9  Configuration management
  A.8.10 Information deletion
  A.8.11 Data masking
  A.8.12 Data leakage prevention
  A.8.13 Information backup
  A.8.14 Redundancy
  A.8.15 Logging
  A.8.16 Monitoring activities
  A.8.17 Clock synchronization
  A.8.18 Use of privileged utility programs
  A.8.19 Installation of software
  A.8.20 Networks security
  A.8.21 Security of network services
  A.8.22 Segregation of networks
  A.8.23 Web filtering
  A.8.24 Use of cryptography
  A.8.25 Secure development lifecycle
  A.8.26 Application security requirements
  A.8.27 Secure system architecture
  A.8.28 Secure coding
  A.8.29 Security testing in development
  A.8.30 Outsourced development
  A.8.31 Separation of environments
  A.8.32 Change management
  A.8.33 Test information
  A.8.34 Protection of information systems during testing
```

### 8.3 Risk Assessment

La evaluación de riesgos es el corazón de ISO 27001.

**Metodología de risk assessment:**

```
1. ESTABLECER CONTEXTO:
   - Activos a proteger
   - Amenazas relevantes
   - Vulnerabilidades existentes
   - Impacto potencial

2. IDENTIFICAR RIESGOS:
   - Amenaza x Vulnerabilidad x Activo = Riesgo
   - Ejemplo: "Atacante externo explota SQLi en app web -> pérdida de datos"

3. ANALIZAR RIESGOS:
   - Probabilidad: Baja, Media, Alta
   - Impacto: Bajo, Medio, Alto
   - Nivel de riesgo: Probabilidad x Impacto

4. EVALUAR RIESGOS:
   - Aceptable: No requiere acción
   - Inaceptable: Requiere tratamiento

5. TRATAR RIESGOS:
   - Mitigar: Implementar controles
   - Transferir: Seguro, terceros
   - Aceptar: Riesgo residual aceptado
   - Evitar: Eliminar la actividad
```

**Matriz de riesgo:**

```
Probabilidad  | Bajo Impacto | Medio Impacto | Alto Impacto
--------------|--------------|---------------|-------------
Alta          | Medio        | Alto          | Crítico
Media         | Bajo         | Medio         | Alto
Baja          | Bajo         | Bajo          | Medio
```

### 8.4 Statement of Applicability (SoA)

El SoA documenta qué controles del Annex A aplican y por qué.

**Estructura del SoA:**

```
Control A.5.1: Políticas de seguridad
  - ¿Aplica? SÍ
  - Justificación: Requerido para establecer dirección de seguridad
  - Implementación: Política de seguridad documentada y aprobada
  - Estado: Implementado

Control A.8.8: Gestión de vulnerabilidades técnicas
  - ¿Aplica? SÍ
  - Justificación: Sistemas críticos expuestos a Internet
  - Implementación: Escaneo trimestral + pentest anual
  - Estado: Implementado

Control A.5.34: Privacidad y PII
  - ¿Aplica? NO
  - Justificación: No procesamos datos personales
  - Estado: No aplica (justificado)
```

### 8.5 Auditoría Interna

La auditoría interna verifica que el ISMS funciona correctamente.

**Frecuencia:** Al menos 1 vez al año

**Qué se audita:**

```
1. Conformidad con ISO 27001 estándar
2. Conformidad con políticas internas
3. Efectividad de controles implementados
4. Cumplimiento de SoA
5. Gestión de riesgos
6. Incidentes de seguridad
7. Mejora continua
```

**Perfil del auditor interno:**

```
- Independiente del área auditada
- Conocimiento de ISO 27001
- Conocimiento de seguridad informática
- Capacitado en técnicas de auditoría
- Objetivo e imparcial
```

### 8.6 [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de Certificación

**Pasos para obtener certificación ISO 27001:**

```
FASE 1: PREPARACIÓN (3-6 meses)
  - Establecer ISMS
  - Risk assessment
  - Implementar controles
  - Documentar todo

FASE 2: AUDITORÍA INTERNA (1 mes)
  - Auditoría interna completa
  - Identificar no conformidades
  - Corregir no conformidades

FASE 3: CERTIFICACIÓN — STAGE 1 (1 semana)
  - Auditoría documental
  - Revisar documentación del ISMS
  - Identificar gaps
  - Planificar Stage 2

FASE 4: CERTIFICACIÓN — STAGE 2 (1-2 semanas)
  - Auditoría in-situ
  - Verificar implementación
  - Entrevistas con personal
  - Revisar evidencia

FASE 5: CERTIFICACIÓN OBTENIDA
  - Certificado válido por 3 años
  - Auditorías de seguimiento anuales
  - Recertificación cada 3 años
```

**Entidades certificadoras acreditadas:**

```
- BSI (British Standards Institution)
- SGS
- Bureau Veritas
- DNV GL
- TÜV Rheinland
- Lloyd'"'"'s Register
```

## 9. Chain of Custody (Cadena de Custodia)

La cadena de custodia es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de documentar el manejo de evidencia digital para asegurar su admisibilidad legal.

### 9.1 Manejo de Evidencia Digital

**Principios fundamentales:**

```
1. NO ALTERAR LA EVIDENCIA:
   - Trabajar siempre sobre copias (imágenes forenses)
   - No modificar archivos originales
   - No bootear el sistema original

2. DOCUMENTAR TODO:
   - Quién, qué, cuándo, dónde, cómo
   - Cada persona que maneja la evidencia
   - Cada acción realizada sobre la evidencia

3. MANTENER INTEGRIDAD:
   - Hashing (MD5, SHA1, SHA256)
   - Write blockers
   - Almacenamiento seguro
```

### 9.2 Documentación de la Cadena de Custodia

**Formulario de cadena de custodia:**

```
CADENA DE CUSTODIA — EVIDENCIA DIGITAL

Caso #: FOR-2024-001
Fecha: 15/05/2024
Investigador: Juan Pérez

ITEM #1:
  Descripción: Laptop Dell Latitude 5420, S/N ABC123
  Ubicación original: Oficina 301, Edificio Central
  Fecha/hora de recolección: 15/05/2024 14:30

  Recolectado por: Juan Pérez (Firma: _____)
  Testigo: María García (Firma: _____)

  Hash (SHA256): a1b2c3d4e5f6...

TRANSFERENCIAS:
  Fecha       | De            | Para           | Propósito
  15/05/2024  | Juan Pérez    | Laboratorio    | Análisis forense
  20/05/2024  | Laboratorio   | Juan Pérez     | Devolución

DISPOSICIÓN FINAL:
  Fecha: 30/06/2024
  Acción: Almacenamiento en bóveda de evidencia
  Responsable: Juan Pérez
```

### 9.3 Imagen [forense](../raw/w1n-f0r3ns1cs.md#forense)

La imagen forense es una copia bit a bit del dispositivo original.

**Tipos de imágenes:**

```
1. IMAGEN FÍSICA (bit-stream):
   - Copia exacta del dispositivo completo
   - Incluye espacio no asignado
   - Incluye slack space
   - Tamaño: igual al dispositivo
   - Formato: DD, E01, AFF

2. IMAGEN LÓGICA:
   - Solo archivos y directorios
   - No incluye espacio no asignado
   - Más rápida y pequeña
   - Útil para análisis específicos

3. IMAGEN DE MEMORIA:
   - Copia de RAM
   - Captura procesos, conexiones, passwords en memoria
   - Forense en vivo
```

**Herramientas de imagen forense:**

```
- dd (Linux):   dd if=/dev/sda of=imagen.dd bs=4096 conv=noerror
- Guymager:     GUI para Linux
- FTK Imager:   Windows, gratuita
- EnCase:       Comercial, formato E01
- AccessData:   FTK comercial
- DC3DD:        dd con progreso y hashing
```

**Comandos de ejemplo:**

```bash
# Crear imagen con dd
dd if=/dev/sda of=/mnt/evidence/caso1.dd bs=4096 conv=noerror,sync

# Verificar hash
sha256sum /mnt/evidence/caso1.dd

# Crear imagen con dc3dd (más features)
dc3dd if=/dev/sda of=/mnt/evidence/caso1.dd hash=sha256 log=log.txt

# Crear imagen E01 con guymager (GUI)
guymager

# Montar imagen como solo lectura
mount -o loop,ro /mnt/evidence/caso1.dd /mnt/montaje/
```

### 9.4 Verificación de [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions)

El hash es la firma digital que garantiza que la evidencia no fue alterada.

**Algoritmos de hash forense:**

```
MD5:      128 bits — ya no se recomienda solo (colisiones posibles)
SHA1:     160 bits — sigue siendo usado pero no recomendado solo
SHA256:   256 bits — RECOMENDADO (estándar actual)
SHA512:   512 bits — para máxima seguridad
```

**Proceso de verificación:**

```
1. CALCULAR HASH DEL ORIGINAL:
   - En el momento de la recolección
   - Documentar en cadena de custodia
   - Guardar en lugar seguro

2. CALCULAR HASH DE LA COPIA:
   - Inmediatamente después de la imagen
   - Comparar con hash del original
   - Si NO coinciden: la copia es inválida

3. VERIFICACIÓN PERIÓDICA:
   - Recalcular hash periódicamente
   - Verificar que la evidencia no se degradó
```

```bash
# Calcular hashes
sha256sum evidencia.dd
sha1sum evidencia.dd
md5sum evidencia.dd

# Verificar contra archivo de hash
sha256sum -c evidencia.sha256

# Comparar dos archivos
diff <(sha256sum imagen1.dd) <(sha256sum imagen2.dd)
```

### 9.5 Almacenamiento Tamper-Proof

La evidencia debe almacenarse de forma que no pueda ser alterada sin detección.

**Requisitos de almacenamiento:**

```
1. FÍSICO:
   - Gabinete cerrado con llave
   - Acceso restringido
   - Registro de acceso
   - CCTV si es posible

2. LÓGICO:
   - Medio de solo lectura (write blocker)
   - Cifrado de la evidencia
   - Hash chain (cada modificación cambia el hash)
   - Logs de acceso al sistema

3. PROCEDIMENTAL:
   - Solo personal autorizado
   - Registro de cada acceso
   - Testigo durante accesos
   - Documentar cualquier desviación
```

**Write blockers:**

```bash
# Hardware write blocker
# Conecta entre el dispositivo y la computadora
# Permite solo operaciones de lectura

# Software write blocker (Linux)
# Montar como read-only
mount -o ro /dev/sdb1 /mnt/evidence

# Usar blockdev
blockdev --setro /dev/sdb
```

### 9.6 Admisibilidad Legal

Para que la evidencia digital sea admisible en corte, debe cumplir:

**Requisitos de admisibilidad:**

```
1. RELEVANCIA:
   - La evidencia debe ser pertinente al caso
   - Debe ayudar a probar o refutar un hecho

2. AUTENTICIDAD:
   - Debe demostrarse que es lo que dice ser
   - Cadena de custodia completa
   - Hash verificado

3. INTEGRIDAD:
   - No debe haber sido alterada
   - Hash coincidente desde la recolección
   - Documentación de manejo

4. LEGALIDAD:
   - Obtenida legalmente
   - Con orden judicial o consentimiento
   - Sin violación de derechos

5. COMPETENCIA DEL TESTIGO:
   - El presentador debe ser experto
   - Debe entender el proceso forense
   - Debe poder explicar la metodología
```

**Documentación necesaria para admisibilidad:**

```
1. Reporte de recolección
2. Cadena de custodia
3. Fotografías del dispositivo original
4. Hash values
5. Reporte de análisis
6. Curriculum vitae del examinador
7. Certificaciones forenses
8. Metodología utilizada
9. Software y hardware usado
10. Declaración jurada
```

## 10. [bug bounty](../raw/b9g-b09nty.md) Legal

### 10.1 Safe Harbor

El Safe Harbor es una cláusula que protege legalmente a los investigadores de seguridad.

**Qué es Safe Harbor:**

```
Una declaración del programa que:
  - No tomará acciones legales contra investigadores de buena fe
  - No reportará a la policía por actividades de investigación
  - Limita la responsabilidad del investigador
  - Define el alcance de las pruebas permitidas
```

**Elementos de un buen Safe Harbor:**

```
1. INTENCIÓN DE BUENA FE:
   - Investigación sin malicia
   - No robo, no daño, no extorsión

2. ALCANCE CLARO:
   - Qué sistemas están cubiertos
   - Qué tipo de pruebas están permitidas

3. LÍMITES:
   - No DoS
   - No modificar datos
   - No extraer datos innecesariamente

4. REPORTE:
   - Cómo y dónde reportar
   - Timeline de disclosure
   - Confidencialidad
```

**Ejemplo de Safe Harbor ([hackerone](../raw/b9g-b09nty.md#hackerone)):**

```
"HackerOne proporciona un 'safe harbor' para investigadores de seguridad
que cumplen con nuestras políticas. No tomaremos acciones legales contra
investigadores que:

1. Sigan las políticas del programa
2. Reporten vulnerabilidades dentro del alcance
3. No exploten vulnerabilidades más allá de lo necesario
4. No almacenen, compartan o usen datos de terceros
5. No interrumpan servicios
6. Cumplan con los timelines de disclosure
7. Actúen de buena fe
"
```

### 10.2 Platform Terms of Service

Cada plataforma tiene sus propios TOS que definen la relación legal.

**Elementos clave de los TOS:**

```
1. ELEGIBILIDAD:
   - Edad mínima (generalmente 18 años)
   - Restricciones geográficas
   - Restricciones por industria

2. PROPIEDAD INTELECTUAL:
   - Quién es dueño del reporte
   - Uso de la información
   - Publicación de findings

3. CONFIDENCIALIDAD:
   - No compartir información del programa
   - No divulgar vulnerabilidades sin permiso
   - Período de confidencialidad

4. PAGOS:
   - Cuándo y cómo se pagan los bounties
   - Fees de la plataforma
   - Impuestos

5. TERMINACIÓN:
   - Banneo de la plataforma
   - Causales de terminación
   - Apelaciones
```

### 10.3 Disclosure Timing

El timing de disclosure está definido por las políticas del programa.

**Políticas comunes:**

```
HackerOne:
  - Disclosure público después del parche
  - Generalmente 30 días después de la resolución
  - Algunos programas tienen períodos más largos

Bugcrowd:
  - Disclosure coordinado con el programa
  - Generalmente después del pago
  - Depende del programa

Programas privados:
  - Mayor confidencialidad
  - Disclosure limitado o sin disclosure público
  - Acuerdos específicos

VDP sin bounty:
  - Generalmente permiten disclosure después del parche
  - Plazos más flexibles
```

### 10.4 Program Eligibility Requirements

Requisitos para participar en programas de bug bounty.

**Requisitos comunes:**

```
1. REGISTRO:
   - Cuenta verificada en la plataforma
   - Perfil completo
   - 2FA habilitado (recomendado)

2. EXPERIENCIA:
   - Algunos programas requieren reputación mínima
   - Programas privados: por invitación
   - Synack: examen técnico

3. LEGAL:
   - No ser empleado de la empresa objetivo
   - No ser residente de países sancionados
   - No tener conflictos de interés

4. TÉCNICO:
   - Capacidad técnica demostrada
   - Entender el scope
   - Poder escribir reportes claros
```

## 11. Vulnerability Disclosure

### 11.1 Responsible Disclosure

El modelo tradicional donde el investigador notifica al vendor y espera un parche antes de hacer público.

**Flujo de responsible disclosure:**

```
1. Investigador descubre vulnerabilidad
2. Investigador reporta al vendor (privadamente)
3. Vendor confirma recepción
4. Vendor desarrolla parche
5. Vendor lanza parche
6. Investigador publica advisory
```

**Problemas del modelo:**

```
- "Responsible" asigna responsabilidad al investigador
- Si el vendor no responde, el investigador queda atrapado
- El vendor puede retrasar el parche indefinidamente
- El investigador no tiene protección legal automática
```

### 11.2 Coordinated Disclosure

Evolución del responsible disclosure donde ambas partes coordinan.

**Flujo de coordinated disclosure:**

```
1. Investigador descubre vulnerabilidad
2. Investigador reporta al vendor
3. Ambas partes acuerdan timeline
4. Vendor desarrolla y prueba parche
5. En fecha acordada: vendor lanza parche + investigador publica
6. Crédito al investigador
```

**Ventajas:**

```
- Timeline predecible (generalmente 90 días)
- Protección legal (coordinación documentada)
- Mejor relación investigador-vendor
- Disclosure completo y preciso
```

**Timeline típico (Google Project Zero):**

```
Día 0:  Reporte al vendor
Día 7:  Vendor confirma vulnerabilidad
Día 90: Fecha límite de disclosure
Día 90: Publicación independientemente del estado del parche
```

### 11.3 Full Disclosure

Publicación inmediata y completa de la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) sin coordinación.

**Cuándo se usa:**

```
- El vendor ignora el reporte
- El vendor amenaza legalmente al investigador
- La vulnerabilidad ya está siendo explotada activamente
- El vendor no tiene intención de parchear
- Malware/botnets donde la publicación ayuda a la defensa
```

**Argumentos a favor:**

```
- Presión al vendor para que parchee
- Transparencia total
- Los usuarios pueden protegerse
- La información no debe estar oculta
```

**Argumentos en contra:**

```
- Usuarios quedan expuestos sin parche
- Atacantes pueden usar la información
- El investigador puede enfrentar acciones legales
- Quema puentes con el vendor
```

### 11.4 Disclosure Timeline

Timeline recomendado para vulnerability disclosure.

```
FASE 1: REPORTE (Día 0)
  - Reportar al vendor con PoC completo
  - Incluir severidad e impacto

FASE 2: CONFIRMACIÓN (Día 0-7)
  - Vendor confirma recepción
  - Vendor valida la vulnerabilidad
  - Acordar timeline de disclosure

FASE 3: DESARROLLO DE PARCHE (Día 7-60)
  - Vendor desarrolla y prueba el parche
  - Investigador verifica el parche (opcional)
  - Comunicación regular entre partes

FASE 4: LANZAMIENTO (Día 60-90)
  - Vendor lanza el parche
  - Asignación de CVE (si aplica)
  - Investigador publica advisory

FASE 5: PUBLICACIÓN (Día 90+)
  - Writeup completo de la vulnerabilidad
  - Crédito al investigador
  - Análisis post-mortem
```

### 11.5 [cve](../raw/s3c-f0nd4m3nt0s.md#cve) ID Allocation

Cómo se asignan los CVE [ids](../raw/s3c-f0nd4m3nt0s.md#ids-ips)).

**[proceso](../raw/0s-f0nd4m3nt0s.md#procesos):**

```
1. VULNERABILIDAD CONFIRMADA:
   - Vendor confirma que es una vulnerabilidad

2. SOLICITAR CVE:
   - A través de una CNA (CVE Numbering Authority)
   - CNAs comunes:
     * HackerOne CNA: para bugs de H1
     * GitHub Advisory: para proyectos open source
     * MITRE: para casos generales
     * Vendor CNA: Microsoft, Google, Apple, etc.

3. ASIGNACIÓN:
   - CNA asigna un CVE ID
   - Formato: CVE-AAAA-NNNNN
   - AAAA = año, NNNNN = número secuencial

4. RESERVADO:
   - CVE se reserva pero no se publica
   - Permite coordinar el disclosure

5. PUBLICACIÓN:
   - CVE se publica cuando el parche está disponible
   - Incluye descripción, CVSS, referencias
```

### 11.6 Vendor Communication

Cómo comunicarse efectivamente con vendors.

**Mejores prácticas:**

```
1. REPORTE PROFESIONAL:
   - Claro, conciso, completo
   - Incluir PoC funcional
   - No ser agresivo

2. TIMELINE:
   - Esperar 24-48h para respuesta inicial
   - Follow-up semanal si no hay respuesta
   - Ser paciente pero persistente

3. NEGOCIACIÓN:
   - Si el vendor pide más tiempo, considerar
   - Si el vendor ignora, escalar

4. PROBLEMAS COMUNES:
   - Vendor no responde: follow-up + límite
   - Vendor rechaza sin razón: apelar
   - Vendor amenaza legal: safe harbor
```

**Ejemplo de comunicación con vendor:**

```
Asunto: Reporte de Vulnerabilidad en Producto XYZ

Estimado equipo de seguridad,

He identificado una vulnerabilidad en su producto XYZ
(versión 2.3.1) que permite SQL Injection en el endpoint
de login.

Detalles:
  - Tipo: SQL Injection (Time-based Blind)
  - Severidad: Critical (CVSS 9.8)
  - Endpoint: POST /api/v1/login
  - Parámetro: username

Impacto:
  Un atacante puede extraer toda la base de datos
  incluyendo credenciales de usuarios.

Adjunto PoC completo.

Por favor, confirmen recepción y timeline estimado
de resolución.

Saludos cordiales,
[Nombre]
```

## 12. Ejercicios Prácticos

### Ejercicio 1: Análisis de Safe Harbor

**Objetivo:** Analizar la cláusula de Safe Harbor de un programa real de [bug bounty](../raw/b9g-b09nty.md).

```
1. Elegí un programa de HackerOne o Bugcrowd
2. Encontrá la cláusula de Safe Harbor en el programa
3. Analizá:
   - ¿Qué protecciones ofrece?
   - ¿Qué limitaciones tiene?
   - ¿Está claro el alcance?
   - ¿Hay ambigüedades?
4. Escribí un resumen de una página

Preguntas guía:
  - ¿El safe harbor cubre todos los tipos de pruebas?
  - ¿Hay exclusiones específicas?
  - ¿El lenguaje es claro o confuso?
  - ¿Qué pasaría si accidentalmente violás una regla?
  - ¿Cómo se define "buena fe"?
```

### Ejercicio 2: Redactar un Acuerdo de Pentest

**Objetivo:** Redactar un acuerdo de pentest completo.

```
Creá un documento de autorización de pentest que incluya:

1. Partes involucradas
2. Fechas y horarios
3. Alcance detallado
4. Tipos de pruebas permitidas
5. Restricciones
6. Contactos de emergencia
7. Manejo de datos
8. Confidencialidad
9. Seguros y responsabilidad
10. Firmas

Usá el template de la Sección 3.1 como base
y agregá tus propias cláusulas.
```

### Ejercicio 3: Mapa de Regulaciones

**Objetivo:** Mapear qué regulaciones aplican a diferentes tipos de empresas.

```
Para cada empresa, determiná qué regulaciones aplican:

1. Un hospital en Texas (EE.UU.)
2. Un e-commerce que vende en Europa
3. Una fintech que procesa tarjetas de crédito
4. Un SaaS B2B que hostea datos de clientes
5. Una clínica privada en Argentina
6. Un banco en Londres
7. Un procesador de pagos en Brasil

Para cada una:
  - Listá las regulaciones que aplican
  - Explicá por qué aplica cada una
  - Identificá los requisitos más importantes
```

### Ejercicio 4: Simulación de Breach Notification

**Objetivo:** Simular una notificación de breach bajo [gdpr](../raw/l3g4l-c0mpl14nc3.md#gdpr).

```
Escenario:
  Durante un pentest, accidentalmente copiás una base de datos
  con 5,000 registros de usuarios europeos (nombres, emails,
  direcciones, y hashes de passwords) a tu laptop personal.

Pasos:
1. Determinar si es un breach notificable bajo GDPR Art. 33
2. Redactar la notificación al controller
3. Redactar la notificación a la autoridad supervisora
4. Determinar si los usuarios deben ser notificados
5. Documentar las medidas correctivas

Template de notificación:
  TO: [Data Controller]
  FROM: [Pentester/Processor]
  DATE: [Date]
  SUBJECT: Breach Notification GDPR Art. 33

  Description of breach:
  Categories of data:
  Number of records:
  Affected individuals:
  Consequences:
  Measures taken:
```

### Ejercicio 5: PCI-DSS Compliance Audit Simulado

**Objetivo:** Evaluar el cumplimiento PCI-DSS de un comercio simulado.

```
Escenario:
  Un comercio online tiene:
  - Tienda en Shopify (terceriza pagos)
  - No almacena datos de tarjetas
  - Procesa pagos a través de Stripe
  - Tiene un formulario de contacto con datos de clientes

Determiná:
1. ¿Qué nivel de SAQ aplica?
2. ¿Qué requisitos de PCI-DSS debe cumplir?
3. ¿Necesita ASV scanning?
4. ¿Cuál es el CDE?
5. ¿Qué datos puede y no puede almacenar?

Checklist de verificación:
  [ ] SAQ correcto identificado
  [ ] Firewall configuration
  [ ] Password policy
  [ ] Data retention policy
  [ ] Antivirus
  [ ] Access control
  [ ] Physical security
  [ ] Logging
  [ ] Testing (pentest/scanning)
  [ ] Security policy
```

### Ejercicio 6: Risk Assessment [iso 27001](../raw/l3g4l-c0mpl14nc3.md#iso-27001)

**Objetivo:** Realizar un risk assessment simulado para una pequeña empresa.

```
Empresa: Startup de 20 empleados, SaaS B2B, hostea en AWS

Activos:
  - Aplicación web (Node.js + React)
  - Base de datos PostgreSQL (AWS RDS)
  - Código fuente en GitHub
  - Laptops de empleados
  - Cuentas de AWS

Para cada activo:
1. Identificar amenazas
2. Identificar vulnerabilidades
3. Evaluar probabilidad e impacto
4. Determinar nivel de riesgo
5. Proponer controles
6. Evaluar riesgo residual

Template:
  Activo: Aplicación web
  Amenaza: SQL Injection
  Probabilidad: Media
  Impacto: Alto (pérdida de datos de clientes)
  Riesgo: Alto
  Control: WAF + input validation + prepared statements
  Riesgo residual: Bajo
```

### Ejercicio 7: Cadena de Custodia Simulada

**Objetivo:** Documentar una cadena de custodia completa.

```
Escenario:
  Te llaman para hacer forense en una laptop de un empleado
  sospechado de robo de datos. La laptop es una Dell Latitude
  5430 con Windows 11.

Pasos:
1. Crear el formulario de cadena de custodia
2. Documentar la recolección (fotos, descripción)
3. Crear una imagen forense (simulada)
4. Calcular hashes
5. Documentar cada transferencia de la evidencia
6. Preparar un affidavit para corte

Herramientas a usar:
  - FTK Imager (simular creación de imagen)
  - sha256sum (calcular hashes)
  - Formulario de cadena de custodia
```

### Ejercicio 8: Redacción de Política de Seguridad

**Objetivo:** Redactar una política de seguridad informática para una PyME.

```
La política debe incluir:

1. PROPÓSITO Y ALCANCE
   - Objetivos de la política
   - A quién aplica
   - Consecuencias de incumplimiento

2. USO ACEPTABLE
   - Uso de equipos
   - Uso de Internet
   - Uso de correo electrónico
   - Redes sociales

3. CONTROL DE ACCESO
   - Política de passwords
   - Acceso remoto
   - Privilegios

4. PROTECCIÓN DE DATOS
   - Clasificación de información
   - Manejo de datos sensibles
   - Cifrado

5. RESPUESTA A INCIDENTES
   - Reporte de incidentes
   - Escalado
   - Investigación

6. CUMPLIMIENTO
   - Regulaciones aplicables
   - Auditorías
   - Sanciones
```

### Ejercicio 9: Análisis de Caso Legal Real

**Objetivo:** Analizar un caso legal real relacionado a ciberseguridad.

```
Elegí UNO de estos casos para investigar:

1. United States v. Aaron Swartz (CFAA)
2. Van Buren v. United States (2021) — límites de CFAA
3. British Airways GDPR fine (2019)
4. Equifax data breach (2017) — consecuencias legales
5. Uber breach cover-up (2016) — cargos criminales
6. Pentest gone wrong: UK'"'"'s "Sony v. Stevens"

Para el caso elegido:
  - Resumí los hechos
  - Identificá qué leyes se violaron
  - Analizá las consecuencias legales
  - Extraé lecciones para pentesters
  - ¿Cómo se podría haber evitado?
```

### Ejercicio 10: Cuestionario de Cumplimiento

**Objetivo:** Auto-evaluar el [cumplimiento legal](../raw/l3g4l-c0mpl14nc3.md) de tu propia práctica de pentesting.

```
Completá este cuestionario para vos o tu empresa:

1. AUTORIZACIÓN:
   [ ] ¿Tenés autorización por escrito para cada pentest?
   [ ] ¿El alcance está claramente definido?
   [ ] ¿Las RoE están documentadas?

2. CONTRATOS:
   [ ] ¿Tenés NDA firmado con cada cliente?
   [ ] ¿Tenés DPA (Data Processing Agreement) firmado?
   [ ] ¿Tenés seguro de responsabilidad civil?

3. DATOS:
   [ ] ¿Sabés qué regulaciones aplican a los datos del cliente?
   [ ] ¿Tenés procedimientos de manejo de datos?
   [ ] ¿Destruís los datos después del proyecto?

4. REPORTE:
   [ ] ¿Tus reportes son claros y profesionales?
   [ ] ¿Incluís CVSS scores?
   [ ] ¿Documentás findings críticos inmediatamente?

5. DISCLOSURE:
   [ ] ¿Entendés las políticas de disclosure de cada programa?
   [ ] ¿Respetás los timelines acordados?
   [ ] ¿Tenés claro el safe harbor?
```

### Ejercicio 11: Mapeo de Controls ISO 27001 a Pentesting

**Objetivo:** Mapear controles de ISO 27001 Annex A a actividades de pentesting.

```
Para cada control, determiná cómo el pentesting ayuda a cumplirlo:

A.8.8  Management of technical vulnerabilities:
  - Pentest anual + escaneo trimestral
  - Reporte de vulnerabilidades encontradas
  - Verificación de remediación

A.8.25 Secure development lifecycle:
  - Pentest en etapas de desarrollo
  - Code review de seguridad
  - Pruebas de regresión

A.8.26 Application security requirements:
  - Pentest para validar requisitos
  - Pruebas de aceptación de seguridad

A.8.29 Security testing in development:
  - SAST, DAST, IAST
  - Pentest manual complementario

A.8.34 Protection of information systems during testing:
  - Entorno de test aislado
  - Datos anonimizados
  - Sin impacto a producción

Otros controles a mapear:
  A.5.24 Incident management
  A.5.29 Business continuity
  A.5.34 Privacy
  A.8.15 Logging
  A.8.16 Monitoring
  A.8.20 Network security
  A.8.22 Network segregation
```

### Ejercicio 12: Simulación de Disputa Legal en Bug Bounty

**Objetivo:** Simular una situación donde un investigador recibe una amenaza legal.

```
Escenario:
  Encontrás una vulnerabilidad en un programa de bug bounty.
  Reportás según las reglas del programa. El programa responde
  que tu reporte es "out of scope" y amenaza con tomar acciones
  legales si publicás la vulnerabilidad.

TAREAS:
1. Revisar el safe harbor del programa
2. Determinar si estabas dentro del alcance
3. Redactar una respuesta profesional
4. Documentar toda la comunicación
5. Determinar los próximos pasos

Preguntas:
  - ¿El safe harbor te protege?
  - ¿Deberías escalar a la plataforma?
  - ¿Deberías obtener representación legal?
  - ¿Publicarías la vulnerabilidad?

Redactá:
  - La respuesta al equipo de seguridad del programa
  - Un mensaje al soporte de la plataforma
  - Un plan de acción si la situación escala
```

