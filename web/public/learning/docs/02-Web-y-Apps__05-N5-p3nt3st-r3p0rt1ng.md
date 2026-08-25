# Pentest Reporting
## Report Writing para Pentesters

> **Autor:** Contribución comunitaria
> **Nivel:** Intermedio
> **Objetivo:** Escribir informes de pentesting profesionales, claros y accionables, desde el executive summary hasta los hallazgos técnicos y la remediación.
> **Requisitos:** Experiencia básica en pentesting, entender vulnerabilidades comunes.

---

## Índice

> ⏱️ **Tiempo estimado:** 8 horas (1897 lineas)


1. [Introducción](#1-introducción)
   - 1.1 [¿Por qué es importante el reporte?](#11-por-qué-es-importante-el-reporte)
   - 1.2 [El reporte como entregable final](#12-el-reporte-como-entregable-final)
   - 1.3 [Tipos de audiencia](#13-tipos-de-audiencia)
2. [Estructura del Reporte](#2-estructura-del-reporte)
   - 2.1 [Title Page](#21-title-page)
   - 2.2 [Table of Contents](#22-table-of-contents)
   - 2.3 [Executive Summary](#23-executive-summary)
   - 2.4 [Methodology](#24-methodology)
   - 2.5 [Findings Overview](#25-findings-overview)
   - 2.6 [Detailed Findings](#26-detailed-findings)
   - 2.7 [Risk Scoring](#27-risk-scoring)
   - 2.8 [Remediation](#28-remediation)
   - 2.9 [Appendices](#29-appendices)
3. [Executive Summary](#3-executive-summary)
   - 3.1 [1-2 páginas para C-level](#31-1-2-páginas-para-c-level)
   - 3.2 [Business impact language](#32-business-impact-language)
   - 3.3 [Evitar jerga técnica](#33-evitar-jerga-técnica)
   - 3.4 [Top 3 riesgos](#34-top-3-riesgos)
   - 3.5 [Overall risk rating](#35-overall-risk-rating)
4. [Technical Findings Format](#4-technical-findings-format)
   - 4.1 [Finding ID](#41-finding-id)
   - 4.2 [Title](#42-title)
   - 4.3 [Severity: Critical/High/Medium/Low/Info](#43-severity-criticalhighmediumlowinfo)
   - 4.4 [CVE/CWE](#44-cvecwe)
   - 4.5 [CVSS Vector and Score](#45-cvss-vector-and-score)
   - 4.6 [Affected Systems](#46-affected-systems)
   - 4.7 [Description](#47-description)
   - 4.8 [Proof of Concept (PoC)](#48-proof-of-concept-poc)
   - 4.9 [Remediation](#49-remediation)
   - 4.10 [References](#410-references)
5. [Risk Scoring](#5-risk-scoring)
   - 5.1 [CVSS 3.x Base Score: AV, AC, PR, UI, SCOPE, CIA](#51-cvss-3x-base-score-av-ac-pr-ui-scope-cia)
   - 5.2 [CVSS Temporal Score](#52-cvss-temporal-score)
   - 5.3 [CVSS Environmental Score](#53-cvss-environmental-score)
   - 5.4 [Cuándo usar cada uno](#54-cuándo-usar-cada-uno)
   - 5.5 [Risk matrices alternativas: DREAD, OWASP Risk Rating](#55-risk-matrices-alternativas-dread-owasp-risk-rating)
6. [PoC Creation](#6-poc-creation)
   - 6.1 [Screenshot guidelines](#61-screenshot-guidelines)
   - 6.2 [Video walkthroughs](#62-video-walkthroughs)
   - 6.3 [Clean output: sin info interna expuesta](#63-clean-output-sin-info-interna-expuesta)
   - 6.4 [Anonymización de datos](#64-anonymización-de-datos)
7. [Remediation Recommendations](#7-remediation-recommendations)
   - 7.1 [Specific y actionable](#71-specific-y-actionable)
   - 7.2 [Prioritized](#72-prioritized)
   - 7.3 [Vendor-specific](#73-vendor-specific)
   - 7.4 [References](#74-references)
8. [Report Tools](#8-report-tools)
   - 8.1 [PwnDoc](#81-pwndoc)
   - 8.2 [GhostWriter](#82-ghostwriter)
   - 8.3 [Serpico](#83-serpico)
   - 8.4 [SysReptor](#84-sysreptor)
   - 8.5 [Custom templates con pandoc/markdown/LaTeX](#85-custom-templates-con-pandocmarkdownlatex)
9. [Appendices](#9-appendices)
   - 9.1 [Tools Used](#91-tools-used)
   - 9.2 [Methodology Reference](#92-methodology-reference)
   - 9.3 [Scan Results](#93-scan-results)
   - 9.4 [Additional Evidence](#94-additional-evidence)
   - 9.5 [Password Lists](#95-password-lists)
10. [Quality Control](#10-quality-control)
    - 10.1 [Peer Review](#101-peer-review)
    - 10.2 [Editing and Proofreading](#102-editing-and-proofreading)
    - 10.3 [Consistency Checks](#103-consistency-checks)
    - 10.4 [Severity Validation](#104-severity-validation)
    - 10.5 [False Positive Removal](#105-false-positive-removal)
11. [Templates](#11-templates)
    - 11.1 [Sample Executive Summary](#111-sample-executive-summary)
    - 11.2 [Sample Technical Finding](#112-sample-technical-finding)
    - 11.3 [Sample Report Structure](#113-sample-report-structure)
12. [Client Communication](#12-client-communication)
    - 12.1 [Draft Review](#121-draft-review)
    - 12.2 [Finding Disputes](#122-finding-disputes)
    - 12.3 [Remediation Timeline](#123-remediation-timeline)
    - 12.4 [Re-test Process](#124-re-test-process)
13. [Ejercicios Prácticos](#13-ejercicios-prácticos)
    - 13.1 [Ejercicio 1: Escribir un Executive Summary](#131-ejercicio-1-escribir-un-executive-summary)
    - 13.2 [Ejercicio 2: Redactar un Finding Técnico](#132-ejercicio-2-redactar-un-finding-técnico)
    - 13.3 [Ejercicio 3: Calcular CVSS](#133-ejercicio-3-calcular-cvss)
    - 13.4 [Ejercicio 4: Escribir Remediation](#134-ejercicio-4-escribir-remediation)
    - 13.5 [Ejercicio 5: Armar un Reporte Completo](#135-ejercicio-5-armar-un-reporte-completo)
    - 13.6 [Ejercicio 6: Peer Review](#136-ejercicio-6-peer-review)
    - 13.7 [Ejercicio 7: Convertir findings a Business Language](#137-ejercicio-7-convertir-findings-a-business-language)
    - 13.8 [Ejercicio 8: Responder a un Dispute de Severidad](#138-ejercicio-8-responder-a-un-dispute-de-severidad)
14. [Referencias](#14-referencias)

---

## 1) Introducción

### 1.1 ¿Por qué es importante el reporte?

Hiciste un pentesting excelente. Encontraste [sqli](../raw/w3b-h4ck1ng.md#sql-injection) críticos, RCEs, escalaciones de privilegios. Pero si tu reporte es una masa de texto desorganizada, con capturas de pantalla sin contexto, y recomendaciones genéricas como "parchear las vulnerabilidades"... **el cliente no te va a tomar en serio**.

El reporte es el entregable más importante del pentesting. Es lo que el cliente paga. Es lo que justifica tu trabajo. Es lo que los equipos de infraestructura y desarrollo van a usar para arreglar los problemas.

Un buen reporte:
- **Es accionable**: el equipo técnico sabe exactamente qué hacer
- **Es convincente**: el C-level entiende el riesgo y aprueba el presupuesto
- **Es profesional**: refleja la calidad de tu trabajo
- **Es defendible**: si alguien cuestiona un finding, tenés los datos para respaldarlo

### 1.2 El reporte como entregable final

El reporte no es un "nice to have". Es el entregable contractual. Sin reporte, el cliente no tiene evidencia de tu trabajo. Sin reporte, no hay justificación para el retest. Sin reporte, no hay cierre del proyecto.

**Ciclo de vida de un pentesting:**
```
Scope Definition -> Reconocimiento -> Explotación -> Post-explotación
    -> DRAFT REPORT -> Cliente revisa -> Feedback -> FINAL REPORT
    -> Remediation period -> RETEST -> RETEST REPORT -> Cierre
```

### 1.3 Tipos de audiencia

Tu reporte será leído por personas con distintos niveles técnicos. Todos deben entender la parte que les corresponde:

| Audiencia | Qué lee | Qué necesita |
|-----------|---------|--------------|
| CEO/CIO/CISO | Executive Summary | Impacto de negocio, riesgos, costo de no arreglar |
| IT Manager | Findings Overview, Risk Scoring | Prioridades, recursos necesarios |
| Sysadmin/Developer | Detailed Findings | [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) concretas, comandos exactos, pasos de remediación |
| Auditor/Compliance | Methodology, Appendices | Evidencia de cumplimiento, estándares seguidos |
| Legal | Toda la intro y conclusiones | Riesgo legal, exposición, due dilligence |

**Regla de oro:** un CEO debe poder leer el executive summary y entender el nivel de riesgo sin saber qué es un [sql injection](../raw/w3b-h4ck1ng.md#sql-injection).

---

## 2) Estructura del Reporte

### 2.1 Title Page

La portada debe ser limpia y profesional. Incluye:

```markdown
# [Nombre del Proyecto] - Penetration Test Report

**Cliente:** [Nombre del Cliente]
**Fecha:** [DD/MM/AAAA]
**Versión:** [Draft v1.0 / Final v2.0]
**Clasificación:** [Confidencial / Público / Interno]

**Realizado por:**
- [Nombre del Pentester] - [Certificación] - [Email]
- [Nombre del Pentester] - [Certificación] - [Email]

**Revisado por:**
- [Nombre del Revisor] - [Rol]

**Aprobado por:**
- [Nombre del Aprobador] - [Rol]
```

### 2.2 Table of Contents

Generado automáticamente con la herramienta que uses (pandoc, Word, etc.). Debe incluir todos los niveles de heading.

```markdown
## Tabla de Contenidos

1. Executive Summary ................................... 3
2. Methodology ........................................ 5
3. Findings Overview .................................. 6
4. Detailed Findings .................................. 8
   4.1 [F-001] SQL Injection en Portal Web ............. 8
   4.2 [F-002] Remote Code Execution en API ........... 12
   ...
5. Risk Scoring Methodology ........................... 25
6. Remediation Summary ................................ 27
7. Appendices ......................................... 30
```

### 2.3 Executive Summary

1-2 páginas. Es la sección más leída del reporte. Debe funcionar como documento independiente.

Contenido:
- Resumen de lo que se testeó (alcance)
- Resumen de lo que se encontró (hallazgos generales)
- Top 3 riesgos (los más críticos para el negocio)
- Overall risk rating (sin fórmula mágica: combinación de cantidad/severidad de findings + criticidad de activos + probabilidad de explotación)
- Recomendaciones estratégicas (no técnicas)

### 2.4 Methodology

Explicá qué metodología usaste. No hace falta que sea extensa, pero debe ser clara.

```markdown
## 2. Methodology

Esta evaluación se realizó siguiendo la metodología OWASP Testing Guide v4.2
y NIST SP 800-115. El enfoque fue de "caja negra" con conocimiento parcial
del entorno.

### Fases:
1. **Reconocimiento:** Escaneo de redes, fingerprinting, enumeración de servicios
2. **Vulnerability Assessment:** Escaneo automatizado + análisis manual
3. **Explotación:** Validación de vulnerabilidades, explotación controlada
4. **Post-explotación:** Movimiento lateral, escalación de privilegios
5. **Reporte:** Documentación de hallazgos, PoCs, recomendaciones

### Herramientas utilizadas:
- Nmap 7.94
- Burp Suite Professional 2024
- Metasploit Framework 6.3
- ...
```

### 2.5 Findings Overview

Un resumen visual de los findings. Tabla o gráfico de barras.

```markdown
## 3. Findings Overview

### Summary

| Severidad | Cantidad |
|-----------|----------|
| Critical  | 2        |
| High      | 5        |
| Medium    | 8        |
| Low       | 12       |
| Info      | 4        |
| **Total** | **31**   |

### Findings by Category

| Categoría | Critical | High | Medium | Low |
|-----------|----------|------|--------|-----|
| Web Application | 1 | 3 | 4 | 5 |
| Network | 1 | 1 | 2 | 3 |
| Active Directory | 0 | 1 | 1 | 2 |
| Mobile | 0 | 0 | 1 | 2 |
```

### 2.6 Detailed Findings

Cada finding debe tener una estructura consistente. Más adelante en la sección 4.

### 2.7 Risk Scoring

Explicá cómo calculás los riesgos. Ver sección 5.

### 2.8 Remediation

Resumen de recomendaciones agrupadas por prioridad. Opcional: por área responsable.

```markdown
## 6. Remediation Summary

### Prioridad Inmediata (0-30 días)
1. [F-001] SQL Injection en Portal - Parchear input validation
2. [F-002] RCE en API - Actualizar framework
3. [F-003] Domain Admin desde user - Revisar delegación Kerberos

### Prioridad Alta (30-60 días)
4. [F-004] Missing patches en servidores
5. [F-005] Default credentials en servicios
...

### Prioridad Media (60-90 días)
...
```

### 2.9 Appendices

Ver sección 9. Información complementaria que no entra en el cuerpo del reporte.

---

## 3) Executive Summary

### 3.1 1-2 páginas para C-level

El executive summary no es un resumen técnico. Es una comunicación de negocios. Debe ser claro incluso para alguien que no sabe nada de seguridad informática.

**Longitud:** 1-2 páginas. Si es más largo, no lo van a leer.

**Estructura:**

```
1. CONTEXTO
   - Qué se auditó (alcance)
   - Por qué se auditó (objetivo)
   
2. HALLAZGOS PRINCIPALES
   - Cuántos findings (totales, críticos, altos)
   - Qué sistemas/áreas están más afectadas
   
3. TOP 3 RIESGOS
   - Los tres hallazgos más críticos
   - Impacto potencial en el negocio (dinero, datos, reputación)
   
4. RATING GENERAL DE RIESGO
   - Crítico / Alto / Medio / Bajo
   
5. RECOMENDACIONES ESTRATÉGICAS
   - Qué hacer primero, hacia dónde apuntar
   - Próximos pasos
```

### 3.2 Business impact language

No digas "[sql injection](../raw/w3b-h4ck1ng.md#sql-injection) en el parámetro id permite extraer datos de la base de datos". Decí:

> "Un atacante podría acceder a información confidencial de clientes, incluyendo datos personales y financieros, a través de una [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) en el formulario de búsqueda del portal web. Esto podría resultar en violaciones de cumplimiento normativo (RGPD/LOPD) y daños reputacionales significativos."

**Traducciones:**
- "[buffer overflow](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#buffer-overflow)" -> "Un atacante podría ejecutar código malicioso en el servidor"
- "Escalación de privilegios" -> "Un usuario sin privilegios podría obtener control administrativo del sistema"
- "[man-in-the-middle](../raw/m1tm-m0b1l3.md)" -> "Un atacante podría interceptar y modificar las comunicaciones"
- "Missing patches" -> "Sistemas expuestos a vulnerabilidades conocidas que ya tienen solución disponible"

### 3.3 Evitar jerga técnica

**Mal:** "Se identificó un [ssrf](../raw/w3b-h4ck1ng.md#ssrf) en el endpoint /api/[proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) que permite al atacante realizar peticiones a servicios internos, potencialmente accediendo al metadata endpoint de [aws](../raw/cl0ud-h4ck1ng.md#aws) y obteniendo credenciales temporales."

**Bien:** "Un servidor web expuesto a internet permite a un atacante simular peticiones a sistemas internos. Esto podría exponer claves de acceso a servicios [cloud](../raw/cl0ud-h4ck1ng.md) y comprometer la infraestructura completa alojada en AWS."

### 3.4 Top 3 riesgos

Identificá los tres hallazgos más críticos **desde la perspectiva del negocio**. No necesariamente los de mayor CVSS.

```markdown
### Top 3 Riesgos

1. **Acceso no autorizado a base de datos de clientes (Crítico)**
   Una vulnerabilidad en el portal web permite a cualquier atacante 
   extraer información de la base de datos de clientes, incluyendo 
   nombres, DNI, direcciones y datos de tarjetas de crédito.

2. **Control total de servidores internos (Crítico)**
   Una configuración incorrecta de Active Directory permite que 
   cualquier usuario del dominio obtenga control administrativo de 
   todos los servidores, incluyendo sistemas de producción.

3. **Exposición de datos sensibles en repositorio público (Alto)**
   Credenciales de producción y documentación interna fueron 
   encontradas en un repositorio público de GitHub.
```

### 3.5 Overall risk rating

El rating general no es un promedio de CVSS. Es un juicio profesional basado en:

- **Severidad y cantidad de hallazgos**
- **Criticidad de los activos afectados**
- **Probabilidad de explotación** (requiere autenticación? acceso físico?)
- **Impacto potencial** (datos de clientes? continuidad del negocio?)
- **Exposición** (internet-facing? interno?)

```markdown
### Overall Risk Rating

Basado en los hallazgos identificados, el nivel de riesgo general 
de la organización evaluada es:

**CRÍTICO**

Justificación:
- Sistemas críticos de negocio expuestos a internet con vulnerabilidades 
  explotables
- Credenciales de acceso a producción comprometidas
- Riesgo inminente de violación de datos de clientes
- Incumplimiento de requisitos normativos (PCI-DSS, RGPD)

Se recomienda una intervención inmediata para mitigar los riesgos 
identificados como críticos y altos.
```

---

## 4) Technical Findings Format

### 4.1 Finding ID

Cada finding debe tener un ID único, consistente en todo el reporte.

```markdown
| Finding ID | F-001 |
|------------|-------|
```

Convenciones:
- F-001, F-002, F-003... para el mismo reporte
- O WEB-001, NET-001, [ad](../raw/w1nd0ws-d0m41n-4dm1n.md)-001 (por categoría)
- O CRI-001, HIGH-001 (por severidad)
- Lo importante es que sea **consistente**

### 4.2 Title

El título debe ser descriptivo pero conciso. Incluye la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) y el componente afectado.

```markdown
| Finding ID | F-001 |
| Title | SQL Injection en Módulo de Búsqueda de Productos |
```

**Buenos títulos:**
- "[sql injection](../raw/w3b-h4ck1ng.md#sql-injection) en endpoint /api/products de Portal Web"
- "Missing Authentication en API de Administración"
- "Default Credentials en Servicio SSH de Servidor Financiero"
- "[remote code execution](../raw/w3b-h4ck1ng.md#rce)) via [file upload](../raw/w3b-h4ck1ng.md#file-upload) en Sistema de Facturación"

**Malos títulos:**
- "Vulnerabilidad en servidor" (muy vago)
- "Error de seguridad" (no dice nada)
- "[sqli](../raw/w3b-h4ck1ng.md#sql-injection)" (muy técnico)
- "Problema en el sistema de login" (podría ser cualquier cosa)

### 4.3 Severity: Critical/High/Medium/Low/Info

```markdown
| Severity | Critical |
|----------|----------|
```

| Severidad | Definición |
|-----------|------------|
| **Critical** | Vulnerabilidad explotable remotamente sin autenticación que permite comprometer completamente el sistema o acceder a datos sensibles. Riesgo inminente. |
| **High** | Vulnerabilidad que permite acceso no autorizado, escalación de privilegios, o afecta significativamente la confidencialidad/integridad/disponibilidad. |
| **Medium** | Vulnerabilidad que requiere condiciones específicas o autenticación, o cuyo impacto es limitado en alcance o severidad. |
| **Low** | Vulnerabilidad de bajo impacto, difícil de explotar, o que expone información no crítica. |
| **Info** | Información útil sin riesgo directo. Recomendaciones de hardening o buenas prácticas. |

### 4.4 [cve](../raw/s3c-f0nd4m3nt0s.md#cve)/CWE

Si la vulnerabilidad tiene CVE (Common Vulnerabilities and Exposures) asignado, incluílo:

```markdown
| CVE | CVE-2024-1234 |
| CWE | CWE-89: SQL Injection |
```

Sin CVE: "No aplica" o "CVE no disponible".

### 4.5 CVSS Vector and Score

Incluí el vector CVSS completo y el score numérico:

```markdown
| CVSS Vector | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| CVSS Score | 9.8 (Critical) |
```

### 4.6 Affected Systems

Listá todos los sistemas/URLs/[ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) afectados:

```markdown
| Affected Systems |
|------------------|
| - https://portal.miempresa.com/products?search= |
| - https://portal.miempresa.com/api/products |
| - Base de datos: db01.miempresa.com (MySQL 5.7) |
```

### 4.7 Description

Explicación de la vulnerabilidad. Debe ser entendible por un desarrollador o sysadmin.

```markdown
### Description

El parámetro "search" en el endpoint /api/products es vulnerable a 
SQL Injection. La aplicación construye la consulta SQL concatenando 
directamente el input del usuario sin sanitización.

**Código vulnerable:**
```php
$query = "SELECT * FROM products WHERE name LIKE '%" . $_GET['search'] . "%'";
$result = mysqli_query($conn, $query);
```

El uso de consultas parametrizadas (prepared statements) prevendría 
este ataque.
```

### 4.8 Proof of Concept (PoC)

Demostración de la vulnerabilidad. Incluí comandos, payloads, resultados relevantes.

```markdown
### Proof of Concept

1. **Identificación de vulnerabilidad:**
   Enviar `'` en el parámetro search provoca un error SQL:

   ```
   Request:  GET /api/products?search=test'
   Response: 500 Internal Server Error
              You have an error in your SQL syntax; check the manual...
   ```

2. **Confirmación con UNION-based SQLi:**
   ```
   Request:  GET /api/products?search=test' UNION SELECT 1,2,3,4,5--
   Response: {"id": 1, "name": 2, "price": 3, ...}
   ```

3. **Extracción de datos:**
   ```
   GET /api/products?search=' UNION SELECT @@version,user(),database(),4,5--
   Response: {"id": "8.0.32", "name": "appuser@localhost", "price": "miempresa_db", ...}
   ```

   ![SQL Injection PoC](images/sqli_poc.png)
```

### 4.9 Remediation

Recomendaciones específicas. NO "sanitizar inputs". Decí exactamente qué hacer.

```markdown
### Remediation

**Corto plazo (inmediato):**
1. Reemplazar todas las consultas SQL dinámicas por prepared statements
   con parámetros vinculados:
   
   ```php
   $stmt = $conn->prepare("SELECT * FROM products WHERE name LIKE ?");
   $param = "%" . $_GET['search'] . "%";
   $stmt->bind_param("s", $param);
   $stmt->execute();
   ```

2. Implementar un Web Application Firewall (WAF) con reglas específicas 
   para SQL Injection mientras se realiza el parche estructural.

**Largo plazo:**
3. Realizar un code review de toda la aplicación para identificar 
   patrones similares de concatenación SQL.
4. Implementar un proceso de Secure Software Development Lifecycle (SSDLC)
   que incluya revisión de seguridad en cada PR.
5. Capacitar al equipo de desarrollo en coding seguro (OWASP Top 10).
```

### 4.10 References

Links a documentación, CVEs, guías de remediación, etc.

```markdown
### References
- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- CWE-89: https://cwe.mitre.org/data/definitions/89.html
- PHP Prepared Statements: https://www.php.net/manual/en/mysqli.quickstart.prepared-statements.php
- PortSwigger SQLi Cheat Sheet: https://portswigger.net/web-security/sql-injection/cheat-sheet
```

---

## 5) Risk Scoring

### 5.1 CVSS 3.x Base Score: AV, AC, PR, UI, SCOPE, CIA

CVSS (Common Vulnerability Scoring System) es el estándar para medir severidad. Versión 3.1 es la actual.

**Métricas Base:**

| Métrica | Opciones | Valor |
|---------|----------|-------|
| AV (Attack Vector) | Network (N) | 0.85 |
| | Adjacent (A) | 0.62 |
| | Local (L) | 0.55 |
| | Physical (P) | 0.20 |
| AC (Attack Complexity) | Low (L) | 0.77 |
| | High (H) | 0.44 |
| PR (Privileges Required) | None (N) | 0.85 |
| | Low (L) | 0.62 (o 0.68 si SCOPE=C) |
| | High (H) | 0.27 (o 0.50 si SCOPE=C) |
| UI (User Interaction) | None (N) | 0.85 |
| | Required (R) | 0.62 |
| S (Scope) | Unchanged (U) | - |
| | Changed (C) | - |
| C (Confidentiality) | High (H) | 0.56 |
| | Low (L) | 0.22 |
| | None (N) | 0 |
| I (Integrity) | High (H) | 0.56 |
| | Low (L) | 0.22 |
| | None (N) | 0 |
| A (Availability) | High (H) | 0.56 |
| | Low (L) | 0.22 |
| | None (N) | 0 |

**Fórmula (simplificada):**

```
Si Scope = Unchanged:
  Impact = 6.42 * (1 - (1-C) * (1-I) * (1-A))
  Exploitability = 8.22 * AV * AC * PR * UI
  Base = round(Min(Impact + Exploitability, 10))

Si Scope = Changed:
  Impact = 7.52 * (1 - (1-C) * (1-I) * (1-A)) - 3.25
  Exploitability = 8.22 * AV * AC * PR * UI
  Base = round(Min(1.08 * (Impact + Exploitability), 10))
```

No hace falta calcular a mano. Usá:

```bash
# Calculadora CVSS online
# https://www.first.org/cvss/calculator/3.1

# O script Python
python3 -c "
import cvss
vector = cvss.CVSS3('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')
print(f'Score: {vector.scores()[0]}')
print(f'Severity: {vector.severities()[0]}')
"
```

### 5.2 CVSS Temporal Score

Ajusta el score base según factores temporales:

| Métrica | Opciones | Valor |
|---------|----------|-------|
| E ([exploit](../raw/m3t4spl01t.md#exploits) Code Maturity) | Not Defined (X) | 1.0 |
| | Not Available (U) | 0.91 |
| | Proof-of-Concept (P) | 0.94 |
| | Functional (F) | 0.97 |
| | High (H) | 1.0 |
| RL (Remediation Level) | Not Defined (X) | 1.0 |
| | Official Fix (O) | 0.95 |
| | Temporary Fix (T) | 0.96 |
| | Workaround (W) | 0.97 |
| | Unavailable (U) | 1.0 |
| RC (Report Confidence) | Not Defined (X) | 1.0 |
| | Unknown (U) | 0.92 |
| | Reasonable (R) | 0.96 |
| | Confirmed (C) | 1.0 |

**Temporal = Base * E * RL * RC**

### 5.3 CVSS Environmental Score

Ajusta según el entorno del cliente. Requiere conocer el contexto.

| Métrica | Opciones |
|---------|----------|
| CR (Confidentiality Requirement) | Low / Medium / High / ND |
| IR (Integrity Requirement) | Low / Medium / High / ND |
| AR (Availability Requirement) | Low / Medium / High / ND |
| MAV, MAC, MPR, MUI, MS, MC, MI, MA | Modified base metrics |

### 5.4 Cuándo usar cada uno

| Score | Uso recomendado |
|-------|-----------------|
| **Base (reportado)** | Para todos los findings. Es el score estándar. |
| **Temporal** | Cuando hay exploit público o parche recién salido. |
| **Environmental** | Customización para el cliente específico. Raro en pentesting. |

**Recomendación:** usá CVSS 3.1 Base Score para todos los findings. Si querés ser más preciso, ajustá con Temporal.

### 5.5 Risk matrices alternativas: DREAD, [owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Risk Rating

**DREAD** (Microsoft, ya no recomendado):

| Letra | Significado | Pregunta |
|-------|-------------|----------|
| D | Damage | ¿Qué tan grave es el daño? |
| R | Reproducibility | ¿Qué tan fácil es reproducir? |
| E | Exploitability | ¿Qué tan fácil es explotar? |
| A | Affected Users | ¿Cuántos usuarios afecta? |
| D | Discoverability | ¿Qué tan fácil es descubrir? |

**OWASP Risk Rating Methodology:**

```
Risk = Likelihood * Impact

Likelihood = (Threat Agent + Vulnerability Factors) / 2
Impact = (Technical Impact + Business Impact) / 2

Risk = Likelihood * Impact
```

---

## 6) PoC Creation

### 6.1 Screenshot guidelines

Una captura vale más que mil palabras. Pero una captura **mala** puede arruinar un finding.

**Reglas de oro:**
1. **Cortá toda la información sensible** ([ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) internas si no corresponden, usuarios reales, datos de clientes)
2. **Usá resaltados** para marcar la parte importante (círculos rojos, flechas)
3. **Incluí contexto** (URL, comando, [payload](../raw/m3t4spl01t.md#payloads) usado)
4. **No edites** las capturas para ocultar errores (no recortes partes que muestren que no funcionó)
5. **Formato** PNG (mejor calidad que JPG para texto)
6. **Nombre descriptivo** (sqi_poc.png, no screenshot_001.png)

```markdown
![SQL Injection - Extracción de usuarios de la BD](images/sqli_users.png)
*Figura 1: Extracción de usuarios y hashes de contraseñas mediante SQL injection UNION-based*
```

### 6.2 Video walkthroughs

Para vulnerabilidades complejas que requieren múltiples pasos, un video puede ser más claro que 10 capturas.

```markdown
### Video PoC

Un video walkthrough del proceso completo de explotación está disponible
en el apéndice B (ver archivo "poc_videos/F-001_RCE_demo.mp4").

Pasos demostrados en el video:
1. Reconocimiento del endpoint vulnerable
2. Envío del payload inicial
3. Obtención de shell reversa
4. Escalación de privilegios a root
5. Captura del flag de prueba
```

**Recomendaciones para videos:**
- Máximo 3-5 minutos
- Sin audio (o con transcripción)
- Enfocado en los pasos clave
- Sin información sensible
- Formato MP4, H.264

### 6.3 Clean output: sin info interna expuesta

```bash
# MAL: Output crudo
$ nmap -sV 192.168.1.100
Nmap scan report for 192.168.1.100
Host is up (0.0012s latency).
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
80/tcp   open  http    Apache httpd 2.4.38
3306/tcp open  mysql   MySQL 5.7.25

# BIEN: Output limpio, formateado
$ nmap -sV <IP_SERVIDOR_WEB>
Host is up.
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.9p1
80/tcp   open  http    Apache httpd 2.4.38
3306/tcp open  mysql   MySQL 5.7
```

### 6.4 Anonymización de datos

Si el entorno de test contiene datos reales, anonimizálos:

```markdown
# Datos originales (NO mostrar):
Username: juan.perez
Email: [email protected]
DNI: 12.345.678

# Anonimizado:
Username: [USUARIO_1]
Email: [EMAIL_USUARIO_1]
DNI: [DNI_REAL_PROTEGIDO]
```

**Técnicas de anonymización:**
- Reemplazar nombres reales por [USUARIO_X]
- Reemplazar IPs por [IP_INTERNA_X] o 10.0.0.X
- Reemplazar emails por [EMAIL_PROTEGIDO]
- Reemplazar datos financieros por [DATOS_PCI]
- Usar blur en imágenes sobre datos sensibles

---

## 7) Remediation Recommendations

### 7.1 Specific y actionable

**MAL:**

> "Se recomienda implementar mejores controles de seguridad en la aplicación."

Esto no sirve. No le dice al desarrollador qué hacer.

**BIEN:**

> "Reemplazar la concatenación de strings en las consultas SQL con prepared statements usando PDO o mysqli. Específicamente, en el archivo /var/www/html/products.php, línea 45, cambiar:
> ```php
> $query = "SELECT * FROM products WHERE id = " . $_GET['id'];
> ```
> Por:
> ```php
> $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
> $stmt->execute([$_GET['id']]);
> ```"

### 7.2 Prioritized

Cada recomendación debe tener un nivel de prioridad:

| Prioridad | Timeline | Cuándo |
|-----------|----------|--------|
| **Inmediata** | 1-7 días | Riegos críticos con [exploit](../raw/m3t4spl01t.md#exploits) público |
| **Corto plazo** | 7-30 días | Riesgos altos o críticos sin exploit inmediato |
| **Mediano plazo** | 30-90 días | Riesgos medios |
| **Largo plazo** | 90+ días | Riesgos bajos, mejoras de [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) |

### 7.3 Vendor-specific

Si la [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) es de un producto específico (Cisco, Microsoft, Fortinet, etc.), la remediación debe ser específica para ese producto:

```markdown
### Remediation

1. **Actualizar FortiOS:**
   - Upgrade de FortiOS 7.0.1 a 7.0.6 o superior
   - La vulnerabilidad CVE-2023-1234 está corregida en 7.0.6+
   - https://docs.fortinet.com/upgrade

2. **Mitigación temporal (si no se puede actualizar):**
   - Deshabilitar la feature afectada:
   ```
   config system global
       [set](../raw/ph1sh1ng.md#social-engineering-toolkit) admin-sport disable
   end
   ```
   - Restringir acceso admin a IPs de confianza
```

### 7.4 References

Cada finding debe referenciar documentación oficial, vendor KBs, [cve](../raw/s3c-f0nd4m3nt0s.md#cve) details, etc.

```markdown
### References
- CVE-2024-1234: https://nvd.nist.gov/vuln/detail/CVE-2024-1234
- Microsoft Patch Guide: https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-1234
- OWASP Input Validation: https://owasp.org/www-community/Input_Validation_Cheat_Sheet
```

---

## 8) Report Tools

### 8.1 PwnDoc

PwnDoc (fork: PwnDoc-ng) es la herramienta más popular para reportes de pentesting.

```bash
# Clonar y ejecutar
git clone https://github.com/pwndoc-ng/pwndoc-ng
cd pwndoc-ng
docker compose up -d

# Acceder a http://localhost:3000
```

**Funcionalidades:**
- Gestión de auditados, proyectos, findings
- Templates de findings con CVSS auto-calculado
- WYSIWYG editor
- Generación de reportes en DOCX/PDF
- Auditoría de cambios
- Multi-tenant

**Workflow típico:**
1. Crear proyecto con datos del cliente
2. Agregar findings (desde templates o nuevos)
3. Asignar severidad, CVSS, screenshots
4. Generar draft report
5. Revisar y finalizar

### 8.2 GhostWriter

GhostWriter es open-source, de SpecterOps (los mismos de [bloodhound](../raw/w1nd0ws-p0st3xpl01t.md#bloodhound)).

```bash
git clone https://github.com/GhostManager/Ghostwriter
cd Ghostwriter
docker compose up -d
```

**Características:**
- Report management completo
- Time tracking por finding
- Cliente portal para compartir reports
- Integración con herramientas (nessus, burp, [nmap](../raw/nm4p.md))
- [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta) de severidad por criticidad de activo

### 8.3 Serpico

Serpico (SERA) es el abuelo de las herramientas de reportes. Simple y efectivo.

```bash
git clone https://github.com/SerpicoProject/Serpico
cd Serpico
bundle install
ruby serpico.rb
```

**Características:**
- Templates en HTML
- Findings template library
- Generación de PDF
- Fácil de deployar (solo ruby)

### 8.4 SysReptor

SysReptor es moderno, con soporte para markdown y observabilidad.

```bash
git clone https://github.com/syslifters/sysreptor
cd sysreptor
docker compose up -d
```

**Características:**
- Markdown-based (no WYSIWYG)
- Git-friendly
- Diseñado y findings reutilizables
- Plantillas profesionales
- Export a PDF, DOCX, HTML

### 8.5 Custom templates con pandoc/markdown/LaTeX

Para los que prefieren control total:

```markdown
# Reporte de Pentesting - [Cliente]

## Executive Summary
...

## Findings
...

---

Generado con:
```bash
pandoc reporte.md -o reporte.pdf \
    --pdf-engine=xelatex \
    --template=template.tex \
    --toc \
    --highlight-style=tango \
    -V mainfont="Arial" \
    -V geometry:margin=2.5cm
```
```

**Estructura de proyecto:**
```
reporte/
├── reporte.md              # Contenido principal
├── template.tex            # Template LaTeX
├── images/
│   ├── sqli_poc.png
│   └── network_diagram.png
├── findings/
│   ├── F-001-sqli.md
│   ├── F-002-rce.md
│   └── F-003-xss.md
├── Makefile                 # Build automation
└── output/
    ├── reporte.pdf
    └── reporte.docx
```

**Makefile:**
```makefile
all: pdf docx

pdf:
	pandoc reporte.md -o output/reporte.pdf \
		--pdf-engine=xelatex \
		--template=template.tex \
		--toc \
		-V geometry:margin=2.5cm

docx:
	pandoc reporte.md -o output/reporte.docx \
		--reference-doc=template.docx \
		--toc

clean:
	rm -rf output/*
```

---

## 9) Appendices

### 9.1 Tools Used

Lista completa de herramientas y versiones usadas durante el test:

```markdown
## Appendix A: Tools Used

| Tool | Version | Purpose |
|------|---------|---------|
| Nmap | 7.94 | Port scanning, service detection |
| Burp Suite Professional | 2024.1 | Web application testing |
| Metasploit Framework | 6.3.15 | Exploitation |
| BloodHound CE | 5.8 | AD enumeration |
| CrackMapExec | 5.1.0 | AD/Network testing |
| John the Ripper | 1.9.0 | Password cracking |
| GoBuster | 3.5.0 | Directory brute-force |
| SQLMap | 1.7.2 | SQL injection automation |
| Wireshark | 4.0.6 | Network traffic analysis |
```

### 9.2 Methodology Reference

Detalle de la metodología usada:

```markdown
## Appendix B: Methodology Reference

### OWASP Testing Guide v4.2
- WSTG-INFO: Information Gathering
- WSTG-CONF: Configuration and Deployment Management Testing
- WSTG-IDNT: Identity Management Testing
- WSTG-ATHN: Authentication Testing
- WSTG-ATHZ: Authorization Testing
- WSTG-SESS: Session Management Testing
- WSTG-INPV: Input Validation Testing
- WSTG-ERR: Error Handling Testing
- WSTG-CRYP: Cryptography Testing
- WSTG-BUSL: Business Logic Testing

### NIST SP 800-115
- Technical Guide to Information Security Testing and Assessment
- Discovery Phase
- Attack Phase
- Reporting Phase
```

### 9.3 Scan Results

Resultados completos de escaneos automatizados (si aplica):

```markdown
## Appendix C: Scan Results

### Nmap Full Port Scan - DMZ Segment
[Resultados completos del escaneo]

### Nessus Vulnerability Scan - Summary
[Focus en findings no duplicados con testing manual]
```

### 9.4 Additional Evidence

Evidencia adicional: logs, configs, outputs largos:

```markdown
## Appendix D: Additional Evidence

### F-001: Full SQLMap Output
[comando y output completo]

### F-002: Wireshark PCAP Analysis
[captura de tráfico, screenshots]
```

### 9.5 Password Lists

Si se usaron diccionarios o listas de contraseñas (no incluir las crackeadas si no se acordó):

```markdown
## Appendix E: Password Lists Used

| Wordlist | Source | Notes |
|----------|--------|-------|
| rockyou.txt | Standard | 14M passwords |
| SecLists/Passwords | GitHub | Common passwords |
| Custom | Generated | Based on client domain info |
```

---

## 10) Quality Control

### 10.1 Peer Review

Ningún reporte debe salir sin revisión de un par. El peer reviewer verifica:

```markdown
### Peer Review Checklist

- [ ] Sin información sensible expuesta
- [ ] Todos los findings son válidos (no false positives)
- [ ] Severidad correcta (CVSS bien calculado)
- [ ] PoCs funcionales y claros
- [ ] Remediations específicas y accionables
- [ ] Executive summary claro y sin jerga
- [ ] Consistencia en formato (mismos templates)
- [ ] Sin typos ni errores gramaticales
- [ ] Screenshots con resaltados y anotaciones
- [ ] Referencias correctas
- [ ] Todos los sistemas en alcance cubiertos
```

### 10.2 Editing and Proofreading

```markdown
# Tools de proofreading:
- Grammarly / LanguageTool (inglés)
- LanguageTool español
- VS Code con spell checker
- aspell / hunspell desde CLI

# Qué revisar:
- Ortografía y gramática
- Consistencia terminológica (SQLi vs SQL Injection)
- Mayúsculas (en títulos, CVSS, CVE)
- Números de versión
- URLs
```

### 10.3 Consistency Checks

```markdown
# Automatizable con scripts:
# 1. Todos los findings tienen CVSS válido?
grep -r "CVSS:3" findings/ | wc -l
# Debe coincidir con el número de findings.

# 2. Todos los F-IDs son únicos?
grep -r "Finding ID" reporte.md | sort | uniq -d

# 3. Coincide el severity con el CVSS score?
# Ver tabla de rangos CVSS:
# 9.0-10.0 = Critical
# 7.0-8.9  = High
# 4.0-6.9  = Medium
# 0.1-3.9  = Low
# 0.0      = Info

# 4. Las referencias son válidas?
# Si hay URLs, verificar que existan (curl -I)

# 5. Las capturas existen?
find images/ -name "*.png" | wc -l
# Debe coincidir con el número de imágenes referenciadas.
```

### 10.4 Severity Validation

```markdown
# Script para validar severidad vs CVSS
validate_cvss() {
    local vector="$1"
    local severity="$2"
    local score=$(python3 -c "
import cvss
v = cvss.CVSS3('$vector')
score = v.scores()[0]
if score >= 9.0: print('Critical')
elif score >= 7.0: print('High')
elif score >= 4.0: print('Medium')
elif score > 0.0: print('Low')
else: print('Info')
")
    if [ "$severity" != "$score" ]; then
        echo "WARNING: CVSS $vector da $score pero está marcado como $severity"
    fi
}
```

### 10.5 False Positive Removal

Antes de finalizar, revisá cada finding:

```markdown
# False Positive Checklist
- [ ] El PoC es reproducible
- [ ] Otro tester puede replicarlo con los mismos pasos
- [ ] No es un error del scanner (nmap, nessus, etc.)
- [ ] El entorno donde se testeó es representativo (no dev con datos dummy)
- [ ] La vulnerabilidad está en el scope del proyecto

# Si tenés dudas:
- Re-test manually
- Preguntar al cliente (sin revelar detalles)
- Escalar a un senior
- Documentar la duda y mantener el finding
```

---

## 11) Templates

### 11.1 Sample Executive Summary

```markdown
# Executive Summary

## Contexto
Como parte del engagement anual de seguridad, se realizó una evaluación
de penetración externa e interna sobre la infraestructura de MIEMPRESA
S.A. durante el período XX/XX/XXXX al XX/XX/XXXX.

El alcance incluyó:
- 3 aplicaciones web (portal público, intranet, API)
- 2 segmentos de red (DMZ, LAN interna)
- Active Directory (dominio completo)

## Hallazgos Principales
Se identificaron un total de 31 vulnerabilidades:
- 2 Críticas
- 5 Altas
- 8 Medias
- 12 Bajas
- 4 Informativas

## Top 3 Riesgos para el Negocio

1. **SQL Injection en Portal Público (Crítico)**
   Un atacante sin autenticación puede extraer toda la base de datos de
   clientes, incluyendo datos personales, credenciales y registros
   financieros. Riesgo de violación de RGPD y daño reputacional.

2. **Compromiso Total de Active Directory (Crítico)**
   Una configuración incorrecta permite que cualquier usuario del dominio
   obtenga privilegios de Domain Admin. Un atacante que comprometa una
   workstation podría tomar control de toda la organización.

3. **API Interna Expuesta a Internet (Alto)**
   Una API de administración es accesible sin autenticación desde internet.
   Permite modificar configuraciones críticas del sistema de facturación.

## Overall Risk Rating
**CRÍTICO**

Se recomienda priorizar la remediación de los hallazgos críticos en las
próximas 2 semanas. Se solicita un re-test dentro de los 30 días para
confirmar la corrección.
```

### 11.2 Sample Technical Finding

```markdown
| Finding ID | F-001 |
|------------|-------|
| **Title** | SQL Injection en Módulo de Búsqueda de Portal Web |
| **Severity** | Critical |
| **CVSS Vector** | CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H |
| **CVSS Score** | 9.8 |
| **CVE** | N/A |
| **CWE** | CWE-89: SQL Injection |
| **Affected Systems** | https://portal.miempresa.com/products |


### Description

El parámetro "search" en el endpoint GET /api/products es vulnerable
a SQL Injection. La aplicación construye la consulta concatenando el
input del usuario directamente.

La base de datos es MySQL 8.0.32 y corre con privilegios de root en
el servidor db01.internal.

### Proof of Concept

1. Inyección básica:
```
Request:
  GET /api/products?search=test'+OR+'1'%3D'1

Response: 200 OK (devuelve todos los productos)
```

2. Extracción de versión:
```
Request:
  GET /api/products?search='+UNION+SELECT+@@version,2,3,4,5,6--

Response:
  {"id":"8.0.32","name":"2","price":"3",...}
```

3. Extracción de tablas:
```
Request:
  GET /api/products?search='+UNION+SELECT+table_name,2,3,4,5,6+
  FROM+information_schema.tables--

Response:
  {"id":"users","name":"2","price":"3",...}
```

![SQLi PoC](images/F-001_sqli_poc.png)

### Remediation

**Inmediato:**
1. Migrar todas las consultas a prepared statements.
2. Implementar WAF con reglas OWASP CRS.

**Archivo vulnerable:** `/var/www/api/products.php`, línea 23-30.

```php
// MAL:
$query = "SELECT * FROM products WHERE name LIKE '%{$_GET['search']}%'";

// BIEN:
$stmt = $pdo->prepare("SELECT * FROM products WHERE name LIKE ?");
$stmt->execute(['%' . $_GET['search'] . '%']);
```

### References
- OWASP SQL Injection: https://owasp.org/www-community/attacks/SQL_Injection
- PHP PDO: https://www.php.net/manual/en/book.pdo.php
- MySQL Securing: https://dev.mysql.com/doc/refman/8.0/en/security.html
```

### 11.3 Sample Report Structure

```markdown
# Reporte de Pentesting Externo - MIEMPRESA S.A.

## 1. Executive Summary
### 1.1 Contexto
### 1.2 Hallazgos Principales
### 1.3 Top 3 Riesgos
### 1.4 Overall Risk Rating

## 2. Methodology
### 2.1 Enfoque
### 2.2 Fases
### 2.3 Herramientas

## 3. Findings Overview
### 3.1 Resumen por Severidad
### 3.2 Resumen por Categoría
### 3.3 Resumen por Sistema

## 4. Detailed Findings
### 4.1 [F-001] SQL Injection en Portal Web
### 4.2 [F-002] RCE en API
### 4.3 [F-003] Domain Admin desde User
### 4.4 [F-004] Missing Patches en Servidores
### 4.5 [F-005] Default Credentials en Router
...
### 4.31 [F-031] Banner Grabbing en SSH

## 5. Risk Scoring Methodology
### 5.1 CVSS 3.1
### 5.2 Rangos de Severidad

## 6. Remediation Summary
### 6.1 Prioridad Inmediata
### 6.2 Corto Plazo
### 6.3 Mediano Plazo
### 6.4 Largo Plazo

## 7. Appendices
### A. Tools Used
### B. Methodology Reference
### C. Full Scan Results
### D. Additional Evidence
### E. Password Lists
```

---

## 12) Client Communication

### 12.1 Draft Review

El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de revisión del draft:

```markdown
## Proceso de Draft Review

1. **Entrega del draft:** Enviar el reporte en PDF (protegido, sin
   marcas de agua) y DOCX (para comentarios).

2. **Período de revisión:** 5-7 días hábiles.

3. **Canales:**
   - Email: reporte encriptado con contraseña (enviar por separado)
   - Portal: GhostWriter/PwnDoc si está disponible
   - Reunión: Walkthrough de los findings principales

4. **Qué puede revisar el cliente:**
   - Datos de contacto correctos
   - Alcance coincide con lo acordado
   - Sistemas mencionados existen
   - Severidades (pueden discutirse)

5. **Qué NO puede cambiar el cliente:**
   - Findings (porque son hallazgos reales)
   - PoCs (porque son demostraciones)
   - Recomendaciones técnicas
```

### 12.2 Finding Disputes

```markdown
## Manejo de Disputas

El cliente puede disputar un finding. Protocolo:

1. **Recibir la disputa:** Documentar por qué el cliente cree que
   es incorrecto.

2. **Evaluar:**
   - ¿El PoC es sólido?
   - ¿El finding fue probado en producción o en staging?
   - ¿El cliente está confundiendo "no explotable" con "no existe"?

3. **Posibles resultados:**
   - **Finding válido:** Mantener con evidencia adicional
   - **Finding parcial:** Ajustar severidad o descripción
   - **False positive:** Remover (documentar por qué)
   - **Out of scope:** Remover o mover a "observaciones"

4. **Respuesta formal:**
   "Luego de revisar su objeción sobre F-001, confirmamos que el
   hallazgo es válido basado en [evidencia adicional]. La severidad
   se mantiene. Si desean, podemos agendar una reunión para demostrar
   la explotación en vivo."
```

### 12.3 Remediation Timeline

```markdown
## Timeline de Remediation Recomendado

| Prioridad | Timeline | Acción |
|-----------|----------|--------|
| Inmediata | 0-7 días | Parchear vulnerabilidades críticas con exploit público |
| Corto plazo | 7-30 días | Corregir altos y críticos |
| Mediano plazo | 30-90 días | Corregir medios |
| Largo plazo | 90+ días | Corregir bajos e informativos |

### Factores que afectan el timeline:
- Disponibilidad de parches (vendor patch ya disponible?)
- Dependencias (hay que coordinar downtime?)
- Recursos (el equipo está disponible?)
- Compliance (PCI-DSS requiere 30 días para críticos)
```

### 12.4 Re-test Process

```markdown
## Proceso de Re-test

1. **Solicitud:** El cliente solicita re-test cuando completó las
   remediaciones.

2. **Validación:** Verificar que los findings específicos fueron
   corregidos (no hacer pentesting completo de nuevo).

3. **Focus:** Solo los findings remediados. Cada finding se prueba
   individualmente.

4. **Resultado por finding:**
   - **Remediated:** El finding ya no es explotable
   - **Partially Remediated:** La solución no es completa
   - **Not Remediated:** El finding sigue igual
   - **New Finding:** Se encontró una variante (test profundidad)

5. **Entregable:** Retest Report (apéndice del reporte original
   o documento separado).

6. **Ciclo:** Si quedan findings sin remediar, el cliente puede
   solicitar otro re-test (usualmente con costo adicional).
```

---

## 13) Ejercicios Prácticos

### 13.1 Ejercicio 1: Escribir un Executive Summary

Tenés los siguientes datos de un pentesting. Escribí el executive summary:

- **Cliente:** Fintech S.A. (aplicación de pagos móviles)
- **Alcance:** App [android](../raw/4db-d33p-d1v3.md), API REST, infraestructura [aws](../raw/cl0ud-h4ck1ng.md#aws)
- **Findings:** 3 críticos, 5 altos, 8 medios, 10 bajos
- **Top hallazgos:**
  1. API de pagos sin autenticación (cualquiera puede iniciar transferencias)
  2. Datos de tarjetas en texto plano en MongoDB
  3. Cognito Identity Pool mal configurado (acceso anónimo a recursos AWS)
- **Regulación:** PCI-DSS, RGPD

<details>
<summary>Ver solución</summary>

```markdown
## Executive Summary

### Contexto
Se realizó una evaluación de seguridad sobre la aplicación de pagos
móviles de Fintech S.A., incluyendo la app Android, la API REST
backend y la infraestructura AWS. El objetivo fue identificar riesgos
que puedan afectar la seguridad de los fondos y datos de los usuarios.

### Hallazgos Principales
Se identificaron 26 vulnerabilidades:
- 3 Críticas
- 5 Altas
- 8 Medias
- 10 Bajas

### Top 3 Riesgos para el Negocio

1. **Transferencias no autorizadas (Crítico)**
   La API de procesamiento de pagos no requiere autenticación. Cualquier
   persona que conozca la URL de la API podría iniciar transferencias
   desde cualquier cuenta, resultando en pérdidas financieras directas.

2. **Exposición de datos de tarjetas (Crítico)**
   Los números de tarjeta, CVV y fechas de vencimiento se almacenan en
   texto plano en la base de datos. Esto viola PCI-DSS y expone a la
   organización a multas regulatorias y responsabilidad civil.

3. **Acceso no autorizado a infraestructura cloud (Crítico)**
   Una mala configuración de AWS Cognito permite que usuarios no
   autenticados accedan a recursos internos de AWS, potencialmente
   comprometiendo toda la infraestructura.

### Overall Risk Rating
**CRÍTICO** - Se requiere acción inmediata para prevenir incidentes
de seguridad que afecten a los usuarios y la operación.
```
</details>

### 13.2 Ejercicio 2: Redactar un Finding Técnico

Redactá un finding para [xss](../raw/w3b-h4ck1ng.md#xss) reflejado en el parámetro "search" de un sitio web:

- URL: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://ejemplo.[com](../raw/w1n-s9bsyst3ms.md#com)/buscar?q=test
- PoC: `<script>alert('XSS')</script>` se ejecuta
- CWE: 79
- Remediation: Output encoding con htmlspecialchars() o template engine con auto-escaping

<details>
<summary>Ver solución</summary>

```markdown
| Finding ID | F-002 |
|------------|-------|
| **Title** | Stored XSS en Módulo de Búsqueda |
| **Severity** | High |
| **CVSS Vector** | CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N |
| **CVSS Score** | 6.1 (Medium) |
| **CWE** | CWE-79: Cross-site Scripting |
| **Affected Systems** | https://ejemplo.com/buscar |

### Description

El parámetro "q" en el endpoint /buscar refleja el input del usuario
sin sanitización en la respuesta HTML. Un atacante puede inyectar
código JavaScript arbitrario que se ejecuta en el navegador de la
víctima.

### Proof of Concept

1. Navegar a:
   https://ejemplo.com/buscar?q=<script>alert('XSS')</script>

2. El payload se ejecuta en el navegador, mostrando un alert.

![XSS PoC](images/xss_poc.png)

### Remediation

Codificar la salida HTML usando htmlspecialchars() en PHP o el
sistema de templates con auto-escaping (Twig, Blade, etc.):

```php
// MAL:
echo "<p>Resultados para: " . $_GET['q'] . "</p>";

// BIEN:
echo "<p>Resultados para: " . htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') . "</p>";
```

### References
- OWASP XSS: https://owasp.org/www-community/attacks/xss/
- CWE-79: https://cwe.mitre.org/data/definitions/79.html
```
</details>

### 13.3 Ejercicio 3: Calcular CVSS

Calculá el CVSS para:

1. [rce](../raw/w3b-h4ck1ng.md#rce) en servidor web sin autenticación, sin interacción del usuario, impacto total (C:H, I:H, A:H), scope unchanged
2. [sql injection](../raw/w3b-h4ck1ng.md#sql-injection) similar al anterior
3. XSS reflejado (requiere que el usuario haga click, solo roba sesión - CIA bajo)
4. Missing HttpOnly flag en cookie (no explotable directamente)

<details>
<summary>Ver solución</summary>

```bash
# 1. RCE sin auth, impacto total
python3 -c "
import cvss
v = cvss.CVSS3('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')
print(f'RCE: {v.scores()[0]} - {v.severities()[0]}')
"
# Resultado: 9.8 (Critical)

# 2. SQLi (similar al 1, pero con scope changed si afecta otros sistemas)
python3 -c "
import cvss
v = cvss.CVSS3('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H')
print(f'SQLi with scope change: {v.scores()[0]} - {v.severities()[0]}')
"
# Resultado: 10.0 (Critical)

# 3. XSS reflejado (requiere UI, impacto bajo)
python3 -c "
import cvss
v = cvss.CVSS3('CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:L/A:N')
print(f'XSS: {v.scores()[0]} - {v.severities()[0]}')
"
# Resultado: 5.4 (Medium)

# 4. Missing HttpOnly (informational, no impact directo)
python3 -c "
import cvss
v = cvss.CVSS3('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N')
print(f'HttpOnly: {v.scores()[0]} - {v.severities()[0]}')
"
# Resultado: 0.0 (None/Info)
```
</details>

### 13.4 Ejercicio 4: Escribir Remediation

Dado el siguiente hallazgo, escribí la remediación:

- **Finding:** Default credentials en servicio SSH de servidor Ubuntu
- **Usuario/pass:** admin:admin
- **Sistema:** Servidor de archivos (srv-files-01)
- **Acceso:** Root completo via SSH

<details>
<summary>Ver solución</summary>

```markdown
### Remediation

**Inmediato (1 día):**
1. Cambiar la contraseña del usuario admin:
   ```bash
   ssh srv-files-01
   passwd admin
   # Usar una contraseña de al menos 16 caracteres, generada aleatoriamente
   ```

2. Si el usuario admin no es necesario, eliminarlo:
   ```bash
   userdel -r admin
   ```

3. Verificar que no haya otros usuarios con contraseñas default:
   ```bash
   grep -v ':*:0:0:' /etc/shadow | awk -F: '$2 == "" || $2 == "!" {print $1}'
   ```

**Corto plazo (7 días):**
4. Implementar autenticación por clave SSH deshabilitando password auth:
   ```
   # /etc/ssh/sshd_config
   PasswordAuthentication no
   systemctl restart sshd
   ```

5. Restringir acceso SSH por IP:
   ```
   # /etc/hosts.allow
   sshd: 10.0.0.0/8 192.168.0.0/16
   
   # /etc/hosts.deny
   sshd: ALL
   ```

**Mediano plazo (30 días):**
6. Implementar gestión centralizada de accesos (Jump Server + SSH CA)
7. Rotar todas las credenciales del servidor

### References
- CIS Ubuntu Benchmark: https://www.cisecurity.org/benchmark/ubuntu_linux
- SSH Hardening Guide: https://www.ssh-audit.com/hardening_guides.html
```
</details>

### 13.5 Ejercicio 5: Armar un Reporte Completo

Armá la estructura completa de un reporte para un cliente ficticio con al menos:
- 3 findings detallados
- Executive summary
- Methodology section
- Appendices con tools y referencias

<details>
<summary>Ver solución</summary>

```markdown
# Reporte de Pentesting - Cliente Ficticio S.A.

**Versión:** Final v1.0
**Clasificación:** Confidencial

---

## 1. Executive Summary

Se realizó un pentesting externo e interno sobre la infraestructura de
Cliente Ficticio S.A. durante el 01/05/2024 al 15/05/2024.

**Alcance:**
- Portal web: https://portal.clienteficticio.com
- API: https://api.clienteficticio.com
- Red interna: 10.10.0.0/16
- Active Directory: cliente.local

**Hallazgos: 15 (2C, 4H, 5M, 3L, 1I)**

**Top 3 Riesgos:**
1. RCE en API (Crítico)
2. Kerberoasting sin restricciones (Alto)
3. Exposición de bucket S3 (Alto)

**Overall Risk: ALTO**

---

## 2. Detailed Findings

### F-001: RCE en API /upload
[Detalle completo]

### F-002: Kerberoasting sin restricciones
[Detalle completo con BloodHound]

### F-003: S3 Bucket público
[Detalle con bucket name sanitizado]

---

## 3. Appendices

### A. Tools: Nmap 7.94, Burp Pro, BloodHound, etc.
### B. CVSS Methodology
### C. Scan Results
```
</details>

### 13.6 Ejercicio 6: Peer Review

Revisá este finding y encontrá 5 problemas:

```markdown
| Finding ID | F-001 |
| Title | SQLi |
| Severity | High |
| CVSS | 9.8 (Critical) |
| PoC | `sqlmap -u "http://test.com" --dbs` |
| Remediation | Sanitizar inputs |
```

<details>
<summary>Ver solución</summary>

Problemas encontrados:
1. **Título muy vago**: "[sqli](../raw/w3b-h4ck1ng.md#sql-injection) en endpoint /api/products de Portal" es mejor
2. **Severidad inconsistente**: dice "High" pero CVSS 9.8 es "Critical"
3. **PoC incompleto**: no muestra el comando exacto ni resultado
4. **Remediación genérica**: "Sanitizar inputs" no es accionable
5. **Sin screenshot**: no hay evidencia visual del hallazgo
6. **Sin CWE**: debería ser CWE-89
7. **Sin sistemas afectados**: no dice qué URL/endpoint exacto
8. **Sin descripción**: no explica por qué es vulnerable
</details>

### 13.7 Ejercicio 7: Convertir findings a Business Language

Convertí estos findings técnicos a lenguaje de negocio para un CISO:

1. "[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))/[tls](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls) certificate validation disabled on HTTPS client"
2. "[smb](../raw/w1nd0ws-p0st3xpl01t.md#smb) signing not enforced"
3. "No [rate limiting](../raw/4p1-s3cur1ty.md#rate-limiting) on login endpoint"
4. "LDAP injection in username field"

<details>
<summary>Ver solución</summary>

1. **Técnico:** SSL/TLS certificate validation disabled on HTTPS client
   **Negocio:** "Las comunicaciones con servicios externos no verifican
   la identidad del destinatario, permitiendo que un atacante intercepte
   y modifique información sensible sin ser detectado."

2. **Técnico:** SMB signing not enforced
   **Negocio:** "Los servidores de archivos no verifican la autenticidad
   de las conexiones internas. Un atacante con acceso a la [red](../raw/r3d3s-f0nd4m3nt0s.md) podría
   interceptar o modificar archivos compartidos, potencialmente
   distribuyendo malware a través de la organización."

3. **Técnico:** No rate limiting on login endpoint
   **Negocio:** "El sistema de login no tiene protección contra ataques
   de [fuerza bruta](../raw/p4ssw0rd-4tt4cks.md#fuerza-bruta). Un atacante puede probar millones de contraseñas
   en minutos, comprometiendo cuentas de usuarios."

4. **Técnico:** LDAP injection in username field
   **Negocio:** "El formulario de login permite a un atacante manipular
   las consultas al directorio de usuarios, potencialmente autenticándose
   sin credenciales válidas o accediendo a información de toda la
   organización."
</details>

### 13.8 Ejercicio 8: [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) a un Dispute de Severidad

El cliente disputa un finding de SQL Injection diciendo que "solo devuelve el número de columnas, no datos sensibles". Escribí una respuesta profesional.

<details>
<summary>Ver solución</summary>

```
Estimado [Cliente],

Gracias por su revisión del finding F-001 (SQL Injection).

Entendemos su observación de que el PoC actual solo demuestra
la inyección a nivel de estructura (enumeración de columnas).
Sin embargo, queremos destacar los siguientes puntos:

1. **Confirmación de vulnerabilidad:** El hecho de que podamos
   modificar la consulta SQL y recibir una respuesta diferente
   confirma que la inyección es funcional. Desde aquí, cualquier
   atacante puede escalar a extracción de datos.

2. **Escalabilidad del ataque:** Hemos limitado el PoC a enumeración
   de columnas por seguridad. En el entorno de staging, confirmamos
   extracción completa de la tabla de usuarios usando técnicas UNION.
   Podemos demostrarlo en una reunión si lo desean.

3. **Riesgo real:** La base de datos contiene información de clientes,
   incluyendo datos personales. Un atacante no se detendría en la
   enumeración de columnas.

4. **Severidad:** Según CVSS 3.1, SQL Injection sin autenticación
   en una base de datos que contiene datos sensibles es 9.8 (Critical).
   Mantenemos la severidad.

Quedamos a disposición para agendar una reunión donde demostremos
la explotación completa en staging y discutamos la estrategia de
remediación.

Saludos,

[Tu Nombre]
```
</details>

---

## 14) Referencias

- **CVSS v3.1 Specification:** [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://www.first.org/cvss/v3-1/
- **CVSS Calculator:** https://www.first.org/cvss/calculator/3.1
- **[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10) Testing Guide:** https://[owasp](../raw/w3b-h4ck1ng.md#owasp-top-10).org/www-project-web-security-testing-guide/
- **OWASP Risk Rating:** https://owasp.org/www-community/OWASP_Risk_Rating_Methodology
- **[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist) SP 800-115:** https://csrc.[nist](../raw/p3nt3st-m3th0d0l0gy.md#nist).gov/publications/detail/sp/800-115/final
- **PwnDoc-ng:** https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/pwndoc-ng/pwndoc-ng
- **GhostWriter:** https://github.com/GhostManager/Ghostwriter
- **SysReptor:** https://github.com/syslifters/sysreptor
- **Pandoc:** https://pandoc.org/
- **Common Weakness Enumeration:** https://cwe.mitre.org/
- **PCI-DSS Penetration Testing Guide:** https://www.pcisecuritystandards.org/
- **SANS Report Writing:** https://www.sans.org/white-papers/33376/
- **[ptes](../raw/p3nt3st-m3th0d0l0gy.md#ptes) (Penetration Testing Execution Standard):** [http](../raw/r3d3s-f0nd4m3nt0s.md#http)://www.pentest-standard.org/

---
*Fin del tutorial p3nt3st-r3p0rt1ng.md*

