# guerra cognitiva e InfoOps

> **Rango:** Intermedio-Avanzado
> **Enfoque:** Operaciones psicologicas, [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation), manipulacion digital
> **Duracion estimada:** 6-10 semanas

---

## Índice

> ⏱️ **Tiempo estimado:** 12 horas (~2 sesiones) (610 lineas)


1. [Introduccion a la Guerra Cognitiva](#1-introduccion-a-la-guerra-cognitiva) - 1.1 Definiciones y Co[nceptos Clave](#11-definiciones-y-conceptos-clave) - 1.2 His[toria de las InfoOps](#12-historia-de-las-infoops) - 1.3 [El OODA Loop Cognitivo](#13-el-ooda-loop-cognitivo) - 1.4 [Vectores de Influencia](#14-vectores-de-influencia) - 1.5 [Narrative Warfare](#15-narrative-warfare) - 1.6 [pe](../raw/w1n-1nt3rn4ls.md#pe)[rception Management](#16-perception-management) - 1.7 Ejercic[ios Practicos](#17-ejercicios-practicos)
2. B[otnets de Opinion y Orquestacion con IA](#2-botnets-de-opinion-y-orquestacion-con-ia) - 2.1 [Arquitectura de Botnet Social](#21-arquitectura-de-botnet-social) - 2.2 [Generacion Automatica de Contenido](#22-generacion-automatica-de-contenido) - 2.3 [comportamiento Coordinado](#23-comportamiento-coordinado) - 2.4 [CAPTCHA Bypass](#24-captcha-bypass) - 2.5 [Deteccion de Bots vs Evasion](#25-deteccion-de-bots-vs-evasion) - 2.6 [Implementacion en Python](#26-implementacion-en-python) - 2.7 [Ejercicios Practicos](#27-ejercicios-practicos)
3. [Campanas de Desinformacion](#3-campanas-de-desinformacion) - 3.1 [Teoria de la Desinformacion](#31-teoria-de-la-desinformacion) - 3.2 Man[ipulacion de Memes](#32-manipulacion-de-memes) - 3.3 [Astroturfing](#33-astroturfing) - 3.4 [Sock Puppet Management](#34-sock-puppet-management) - 3.5 [Amplificacion Cross-Platform](#35-amplificacion-cross-platform) - 3.6 [Ejercicios Practicos](#36-ejercicios-practicos)
4. Gaming de Algoritmos de [redes Sociales](#4-gaming-de-algoritmos-de-redes-sociales) - 4.1 [Recomendation Systems](#41-recommendation-systems) - 4.2 [Engagement Hacking](#42-engagement-hacking) - 4.3 [Narrative Trending](#43-narrative-trending) - 4.4 [Manipulacion de Metricas](#44-manipulacion-de-metricas) - 4.5 [Ejercicios Practicos](#45-ejercicios-practicos)
5. [Evasion de Deteccion y Moderacion](#5-evasion-de-deteccion-y-moderacion) - 5.1 [NLP-based Content Detectors](#51-nlp-based-content-detectors) - 5.2 [Image Manipulation Detection Evasion](#52-image-manipulation-detection-evasion) - 5.3 [Platform Moderation Algorithm Gaming](#53-platform-moderation-algorithm-gaming) - 5.4 [Stylometric Evasion](#54-stylometric-evasion) - 5.5 [Ejercicios Practicos](#55-ejercicios-practicos)
6. [Behavioral OSINT](#6-behavioral-osint) - 6.1 [Personality Profiling from Digital Footprints](#61-personality-profiling-from-digital-footprints) - 6.2 [Predictive Behavior Modeling](#62-predictive-behavior-modeling) - 6.3 [Social Graph Analysis](#63-social-graph-analysis) - 6.4 [Temporal Pattern Analysis](#64-temporal-pattern-analysis) - 6.5 [Ejercicios Practicos](#65-ejercicios-practicos)
7. [Explotacion de Sesgos Cognitivos](#7-explotacion-de-sesgos-cognitivos) - 7.1 [Fundamentos de Sesgos Cognitivos](#71-fundamentos-de-sesgos-cognitivos) - 7.2 [Confirmation Bias](#72-confirmation-bias) - 7.3 [Dunning-Kruger Effect](#73-dunning-kruger-effect) - 7.4 [Availability Heuristic](#74-availability-heuristic) - 7.5 [Anchoring Bias](#75-anchoring-bias) - 7.6 [Bandwagon Effect](#76-bandwagon-effect) - 7.7 [Ejercicios Practicos](#77-ejercicios-practicos)
8. [Defensa y Mitigacion](#8-defensa-y-mitigacion) - 8.1 [Media Literacy](#81-media-literacy) - 8.2 [Critical Thinking](#82-critical-thinking) - 8.3 [Digital Hygiene](#83-digital-hygiene) - 8.4 [Narrative Tracking](#84-narrative-tracking) - 8.5 [Fact-Checking Automation](#85-fact-checking-automation) - 8.6 [Ejercicios Practicos](#86-ejercicios-practicos)
9. [Apendices](#9-apendices) - 9.1 [Glosario](#91-glosario) - 9.2 [Herramientas](#92-herramientas) - 9.3 [Casos de Estudio](#93-casos-de-estudio)

---

## 1. Introducción a la [guerra cognitiva](../raw/c0gn1t1v3-w4rf4r3.md)

### 1.1 Definiciones y Conceptos Clave

La guerra cognitiva es la forma mas avanzada de conflicto en la era de la informacion. A diferencia de la guerra cinetica (bombas, balas), la guerra cognitiva ataca la percepcion, la comprension y la toma de decisiones.

**Definiciones Clave:**

1. **Guerra Cognitiva:** Uso de tecnicas psicologicas, informacionales y tecnologicas para alterar la percepcion, las creencias y los procesos de decision de individuos, grupos o sociedades enteras.

2. **Information Operations (InfoOps):** Conjunto de actividades coordinadas para influir en la informacion y los sistemas de informacion de un adversario mientras se protegen los propios.

3. **Narrative Warfare:** Creacion y propagacion de narrativas especificas para lograr objetivos estrategicos. No se trata de mentiras necesariamente, sino de enmarcar la realidad de una manera particular.

4. **Perception Management:** Controlar lo que las personas perciben como realidad. No importa lo que sea verdad, importa lo que la gente CREE que es verdad.

5. **[cognitive warfare](../raw/c0gn1t1v3-w4rf4r3.md) (natO definition):** "The use of cognitive technologies and psychological operations to affect the enemy's decision making at all levels." - NATO Allied Command Transformation

**La Piramide de la Guerra Cognitiva:**

``` Impacto Estrategico / \ Cambio de Cambio de Comportamiento Politica \ / Manipulacion de Creencias / \ Narrativas Emociones / \ / \ Informacion Framing Sesgos Falsa / \ /  \ Desinformacion Propaganda
```

### 1.2 Historia de las InfoOps

**Pre-Digital (Antes de 1990):**

- **Guerra de Troya:** Caballo de Troya como operacion de engano psicologica.
- **WWII:** Propaganda masiva de ambos bandos. La OSS (precursora de la CIA) realizaba operaciones psicologicas. El "Dia D" incluyo una operacion de engano masiva (Operation Fortitude).
- **Guerra Fria:** [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation) sovietica ([disinformation](../raw/c0gn1t1v3-w4rf4r3.md#disinformation)), operaciones de influencia global. La KGB tenia un departamento completo (Service A) dedicado a [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation).

**Digital Temprano (1990-2010):**

- **Internet como vector:** Foros, emails, primeras [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales.
- **Guerra de Iraq (2003):** Operaciones psicologicas digitales tempranas.
- **2008:** La campana de Obama usa redes sociales para movilizacion y recaudacion.
- **2009:** Iran Green Revolution - Twitter y Facebook como campos de batalla informacional.

**Era Moderna (2010-presente):**

- **2013:** Operaciones de influencia rusa en Ucrania (anexion de Crimea).
- **2014:** ISIS utiliza propaganda sofisticada en redes sociales para reclutamiento global.
- **2016:** Interferencia electoral en EEUU (Internet Research Agency, Cambridge Analytica).
- **2018:** Operaciones de desinformacion en Myanmar contra la minoria Rohingya.
- **2019:** Deepfakes comienzan a circular a gran escala.
- **2020:** COVID-19 infodemic - desinformacion masiva sobre la pandemia.
- **2022:** Guerra Rusia-Ucrania: conflicto informacional sin precedentes.
- **2023-presente:** Deepfakes generados por IA, llms para propaganda automatizada.

### 1.3 El OODA Loop Cognitivo

El OODA loop (Observe, Orient, Decide, Act) fue desarrollado por el coronel John Boyd de la USAF. En la guerra cognitiva, entender y manipular el OODA loop del adversario es fundamental.

**Las 4 Fases:**

1. **Observe (Observar):** Recopilar informacion del entorno.
2. **Orient (Orientar):** Analizar e interpretar la informacion basado en experiencias previas, sesgos, cultura.
3. **Decide (Decidir):** Seleccionar un curso de accion.
4. **Act (Actuar):** Ejecutar la decision.

**Manipulacion del OODA Loop:**

```
OODA Loop Normal:
[Observe] -> [Orient] -> [Decide] -> [Act] -> (loop)

OODA Loop Manipulado (InfoOps):
[Observe: Datos falsos, ruido informacional] -> [Orient: Narrativas sesgadas, framing] -> [Decide: Decision suboptima] -> [Act: Accion predecible/controlada] -> (loop con sesgo reforzado)
```

**Tecnicas de Manipulacion por Fase:**

| Fase | Tecnica | Descripcion |
|------|---------|-------------|
| Observe | Desinformacion | Datos falsos para contaminar la observacion |
| Observe | Ruido | Sobrecarga informacional que oculta senales |
| Observe | Filtracion selectiva | Mostrar solo datos que favorecen la agenda |
| Orient | Framing | Enmarcar la realidad de una manera especifica |
| Orient | Gaslighting | Hacer dudar de la propia percepcion |
| Orient | Sesgo cultural | Explotar valores culturales para orientar interpretacion |
| Decide | Fatiga de decision | Tantos datos que la persona no puede decidir |
| Decide | Falsa dicotomia | Solo dos opciones, ambas benefician al atacante |
| Decide | Deadline artificial | Presion de tiempo para decisiones suboptimas |
| Act | Provocacion | Incitar a actuar de forma contraproducente |
| Act | Inaccion inducida | Convencer de que la mejor accion es no hacer nada |

### 1.4 Vectores de Influencia

**Clasificacion de Vectores:**

1. **Redes Sociales:** Facebook, Twitter/X, Instagram, TikTok, YouTube, Telegram
2. **Medios Tradicionales:** Television, radio, diarios (aun relevantes)
3. **Plataformas de Mensajeria:** WhatsApp, Signal, Telegram (privacidad = opacidad)
4. **Foros y Comunidades:** Reddit, 4chan, 8kun, Discord
5. **Search Engines:** SEO, manipulacion de resultados de busqueda
6. **Recomendation Systems:** YouTube, TikTok, Netflix (burbujas de filtro)
7. **IA Generativa:** ChatGPT, Midjourney, DALL-E para crear contenido sintetico

**Matriz de Vectores vs. Objetivos:**

| Vector | Alcance | Velocidad | [persistencia](../raw/w1nd0ws-p0st3xpl01t.md#persistencia) | Segmentacion | Costo |
|--------|---------|-----------|-------------|-------------|-------|
| FB/Twitter | Alto | Alta | Media | Alta | Medio |
| TikTok | Alto | Muy alta | Baja | Muy alta | Medio |
| WhatsApp | Medio | Alta | Media | Exacta | Bajo |
| Telegram | Medio | Alta | Alta | Exacta | Bajo |
| Reddit | Medio | Media | Alta | Alta | Bajo |
| 4chan | Bajo | Muy alta | Baja | Exacta | Muy bajo |
| Medios trad | Alto | Baja | Alta | Baja | Alto |

### 1.5 Narrative Warfare

**Que es una Narrativa?**

Una narrativa es una historia que organiza hechos, emociones y simbolos en un marco coherente que da sentido al mundo.

**Componentes de una Narrativa:**

1. **Heroe / Victima:** Quien es el protagonista? Quien sufre?
2. **Villano:** Quien causa el problema?
3. **Conflicto:** Cual es la lucha central?
4. **Resolucion:** Como termina la historia?
5. **Valores:** Que principios estan en juego?
6. **Simbolos:** Imagenes, memes, frases que representan la narrativa.

**Estructura de una Narrativa de Desinformacion:**

```
Ejemplo: "Migrantes estan destruyendo nuestro pais"

1. Heroe: Ciudadano local trabajador
2. Victima: La poblacion nativa
3. Villano: Migrantes / Gobierno que permite migracion
4. Conflicto: Recursos limitados vs. invasion migratoria
5. Resolucion: Cerrar fronteras / Deportar migrantes
6. Valores: Nacionalismo, seguridad, identidad
7. Simbolos: Imagenes de cruces fronterizas, estadisticas sesgadas

Estrategia de Propagacion:
- Dia 1: "Caso aislado" (violencia por migrante)
- Dia 3: "Patron" (estadisticas manipuladas)
- Dia 7: "Crisis" (terminologia de invasion)
- Dia 14: "Solucion radical" (propuesta politica)
```

### 1.6 Perception Management

**Tecnicas de Gestion de Percepcion:**

1. **Agenda setting:** Decidir de QUE se habla, no que se dice. Elegir que temas son prioritarios en el debate publico.

2. **Priming:** Preparar el terreno para una interpretacion especifica. Ej: mencionar repetidamente "seguridad" antes de hablar de inmigracion.

3. **Framing:** Enmarcar un tema de manera especifica. No es lo mismo "impuesto a la riqueza" que "confiscacion del esfuerzo".

4. **Gatekeeping:** Controlar que informacion llega al publico y cual no.

5. **Spin:** Dar una interpretacion favorable de los hechos, incluso si son negativos.

6. **Astroturfing:** Crear la apariencia de apoyo popular genuino cuando en realidad es fabricado.

**Modelo de Propaganda de Herman y Chomsky:**

1. Concentracion de medios en pocas manos
2. Dependencia de publicidad
3. Fuentes oficiales como unica referencia
4. "Flak" (ataques) como mecanismo de disciplina
5. Enemigo comun como mecanismo de control

### 1.7 Ejercicios Practicos

**Ejercicio 1.1: Analisis de Narrativa**
Selecciona un tema politico actual. Identifica las narrativas de cada lado: heroe, villano, conflicto, resolucion, valores, simbolos. Documenta como se enmarca el mismo hecho por diferentes fuentes.

**Ejercicio 1.2: Mapa de Vectores**
Crea un mapa de los vectores de influencia para un pais/region especifica. Identifica que plataformas son mas relevantes, cuales estan censuradas, cuales son vulnerables a manipulacion.

**Ejercicio 1.3: OODA Loop Manipulation**
Toma un caso real de desinformacion reciente. Mapea como se manipulo cada fase del OODA loop.

---

## 2. Botnets de Opinion y Orquestacion con IA

### 2.1 Arquitectura de Botnet Social

Un botnet social es una [red](../raw/r3d3s-f0nd4m3nt0s.md) de cuentas automatizadas (bots) que coordinan acciones para influir en la opinion publica.

**componentes:**
1. **C&C (Command & Control):** Servidor central. Puede ser IRC, [http](../raw/r3d3s-f0nd4m3nt0s.md#http), P2P.
2. **Bot Master:** Operador humano o IA que dirige la campana.
3. **Bot Agents:** Cuentas automatizadas en [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales.
4. **Sock Puppets:** Cuentas con identidades ficticias creibles.
5. **Amplification Network:** Red de cuentas para amplificar mensajes.

**Arquitectura tipica:**

```
Bot Master | C&C Server (Telegram / HTTP / IRC) | +--- Bot Agent 1 (Twitter) +--- Bot Agent 2 (Twitter) +--- .. (50-10000 bots) +--- Bot Agent N (Facebook) | +--- Sock Puppets (cuentas "reales") +--- Amplification Network (cuentas de alta influencia)
```

### 2.2 Generacion Automatica de Contenido

Con llms modernos (GPT-4, Claude, Llama 3), generar contenido creible a escala es trivial.

```python
import random

class AutomatedContentGenerator: def __init__(self, llm_api=None): self.llm = llm_api self.templates = { 'outrage': [ 'No puedo creer que {topic} este pasando.', 'Es increible que en 2026 sigamos viendo {topic}.', 'Alguien tiene que hacer algo sobre {topic}. YA!', ], 'support': [ 'Gran iniciativa lo de {topic}. Todos deberian apoyar.', 'Finalmente alguien dice lo que pensamos sobre {topic}.', ], 'doubt': [ 'No estoy seguro de que {topic} sea tan grave.', 'Habria que investigar mas sobre {topic}.', ], 'neutral': [ 'Que opinan de {topic}? Leo comentarios.', 'Interesante thread sobre {topic}.', ] } def generate_post(self, topic, emotion='outrage'): template = random.choice(self.templates[emotion]) post = template.replace('{topic}', topic) return post def generate_thread(self, topic, n_posts=5): thread = for i in range(n_posts): thread.append(f'{i+1}/{n_posts}: Sobre {topic}..') return thread def generate_reply(self, original_post, sentiment='agree'): replies = { 'agree': ['Totalmente de acuerdo.', 'Excelente punto.', 'Esto es muy cierto.'], 'disagree': ['No estoy de acuerdo.', 'Fuentes?', 'Eso es incorrecto.'], 'doubt': ['Habria que verificarlo.', 'Interesante pero dudoso.'], } return random.choice(replies.get(sentiment, replies['agree']) def generate_with_llm(self, topic, style, length='short'): """Usar LLM para generar contenido mas natural""" prompt = f"Escribe un post de {style} sobre {topic} en menos de {length} palabras." return self.llm.query(prompt) if self.llm else "LLM no disponible"
```

### 2.3 Comportamiento Coordinado

```python
class CoordinatedBehavior: def __init__(self, bot_ids): self.bots = bot_ids def wave_attack(self, topic, n_waves=3, bots_per_wave=50): for wave in range(n_waves): print(f"Wave {wave+1}: {bots_per_wave} bots publicando sobre {topic}") for bot_id in self.bots[:bots_per_wave]: print(f"  Bot {bot_id}: publicando..") def hashtag_hijack(self, original_hashtag, new_narrative): print(f"Secuestrando #{original_hashtag} para promover: {new_narrative}") def concern_trolling(self, community, fake_concern): print(f"Concern trolling en {community}:") print(f"  'Solo me preocupa que {fake_concern}..'") def create_false_controversy(self, topic, side_a, side_b): print(f"Creando falsa controversia: {side_a} vs {side_b} sobre {topic}") def sock_puppet_argument(self, side_a_bots, side_b_bots, topic): """Simular debate entre cuentas falsas para polarizar""" for bot1, bot2 in zip(side_a_bots[:5], side_b_bots[:5]): print(f"  Bot A({bot1}): Arguye a favor de {topic}") print(f"  Bot B({bot2}): Arguye en contra de {topic}") print("Resultado: El tema parece divisivo y genera mas atencion") def vote_manipulation(self, target_post, n_upvotes=100): """Manipular votos en plataformas como Reddit""" print(f"Manipulando votos: {n_upvotes} upvotes para {target_post[:50]}..") return {'post': target_post, 'upvotes': n_upvotes}
```

### 2.4 CAPTCHA Bypass

```python
class CAPTCHABypass: def solve_text_captcha(self, image_path): try: import pytesseract from PIL import Image img = Image.open(image_path) return pytesseract.image_to_string(img, config='--psm 8').strip except ImportError: return 'TESSERACT_NOT_AVAILABLE' def solve_recaptcha_v2(self): # Servicios: 2captcha, Anti-Captcha, DeathByCaptcha return 'FAKE_CAPTCHA_TOKEN' def solve_hcaptcha(self): """Resolver hCaptcha via API""" # Similar a reCAPTCHA, usar servicios pagos return 'HCAPTCHA_TOKEN' def automated_browser_creation(self): """Crear perfiles de navegador que evaden deteccion""" import undetected_chromedriver as uc options = uc.ChromeOptions options.add_argument('--disable-blink-features=AutomationControlled') driver = uc.Chrome(options=options) return driver
```

### 2.5 Deteccion de Bots vs Evasion

```python
class BotDetector: def analyze_account(self, account): score = 0 if account.get('followers', 0) == 0: score += 20 ratio = account.get('following', 0) / max(account.get('followers', 1), 1) if ratio > 10: score += 15 if account.get('posts_per_day', 0) > 50: score += 25 if account.get('unique_content_ratio', 1) < 0.3: score += 20 night = account.get('night_posts', 0) / max(account.get('total_posts', 1), 1) if night > 0.5: score += 15 return {'score': score, 'is_bot': score > 50} class BotEvasion: def humanize_behavior(self): return [ 'Publicar en horarios humanos (8-23)', 'Posts con variacion de longitud', 'Incluir typos ocasionales', 'Compartir contenido no politico (gatos, comida)', 'Seguir y dejar de seguir aleatoriamente', 'Like a posts aleatorios', 'Tiempo de lectura entre acciones (5-60 seg)', ] def generate_post_history(self, days=90, max_per_day=5): topics = ['gatos', 'comida', 'clima', 'deportes', 'musica', 'viajes'] history = for day in range(days): for _ in range(random.randint(1, max_per_day): history.append({ 'day': day, 'hour': random.randint(8, 23), 'topic': random.choice(topics), }) return history def simulate_human_behavior(self, bot_id, hours_active=12): """Simular comportamiento humano: pausas, horarios, interacciones""" behavior = { 'active_hours': f'{random.randint(7,10)}-{random.randint(20,23)}', 'avg_posts_per_day': random.randint(1, 10), 'typo_frequency': random.uniform(0.01, 0.05), 'interaction_delay_mean': random.randint(10, 120),  # segundos 'content_categories': ['random', 'news', 'personal'] } return behavior
```

### 2.6 Ejercicios Practicos

**Ejercicio 2.1:** Implementa un generador automatico de contenido con 5 estilos diferentes (formal, informal, indignado, academico, humoristico). Genera 100 posts para cada estilo.

**Ejercicio 2.2:** Crea un detector de bots con al menos 8 caracteristicas conductuales. Pruebalo contra datos reales/simulados.

**Ejercicio 2.3:** Implementa un sistema de evasion de deteccion de bots que humanice el comportamiento.

---

## 3. Campanas de [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation)

### 3.1 Teoria de la Desinformacion

**Taxonomia:**
- **Misinformation:** Info falsa compartida sin intencion de enganar.
- **[disinformation](../raw/c0gn1t1v3-w4rf4r3.md#disinformation):** Info falsa CREadA intencionalmente para enganar.
- **Malinformation:** Info verdadera compartida con intencion de danar.

**Ciclo de Vida de una Campana:**

1. PLANIFICACION -> 2. CREACION -> 3. LANZAMIENTO -> 4. AMPLIFICACION -> 5. MAINSTREAMING -> 6. SOSTENIMIENTO

| Fase | Actividades | Duracion |
|------|-------------|----------|
| Planificacion | Definir objetivo, audiencia, mensaje | 1-7 dias |
| Creacion | Generar contenido, preparar cuentas | 1-3 dias |
| Lanzamiento | Publicar en fuentes semilla | 1 dia |
| Amplificacion | Bots, hashtags, influencers | 3-14 dias |
| Mainstreaming | Medios tradicionales recogen | 7-30 dias |
| Sostenimiento | Nuevos angulos, victimizacion | Indefinido |

**Estrategia de microtargeting:**

```python
class MicrotargetingStrategy: def segment_audience(self, demographics): """Segmentar audiencia para mensajes personalizados""" segments = {} # Segmentacion basica segments['jovenes_progres'] = {'age': '18-25', 'lean': 'left'} segments['adultos_conserv'] = {'age': '40-65', 'lean': 'right'} segments['indecisos'] = {'age': '25-40', 'lean': 'center'} # Mensajes personalizados por segmento for seg, info in segments.items: print(f"Segmento: {seg}") print(f"  Mensaje: Adaptado a {info['lean']}") print(f"  Canal: {'TikTok/IG' if int(info['age'].split('-')[0]) < 30 else 'FB/WhatsApp'}") return segments
```

### 3.2 Sock Puppet Management

```python
class SockPuppet: def __init__(self, puppet_id): self.id = puppet_id self.profile = self._generate_profile def _generate_profile(self): first_names = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Sofia'] last_names = ['Garcia', 'Rodriguez', 'Lopez', 'Martinez', 'Gonzalez'] return { 'name': f'{random.choice(first_names)} {random.choice(last_names)}', 'age': random.randint(25, 65), 'location': random.choice(['Buenos Aires', 'CABA', 'Cordoba']), 'bio': random.choice([ 'Ciudadano preocupado por el futuro', 'Profesional, padre de familia', 'Opiniones personales', ]), 'followers': random.randint(50, 5000), 'following': random.randint(50, 1000), } def post(self, content, platform): print(f'[{self.profile["name"]}] Post en {platform}: {content[:60]}..')

class SockPuppetManager: def __init__(self, n=100): self.puppets = [SockPuppet(i) for i in range(n)] def deploy_campaign(self, message, n_puppets=20, platforms=None): if platforms is None: platforms = ['twitter', 'facebook'] print(f'Desplegando campana con {n_puppets} puppets..') for puppet in self.puppets[:n_puppets]: for platform in platforms: puppet.post(message, platform) def retire_puppet(self, puppet_id): self.puppets = [p for p in self.puppets if p.id != puppet_id] def create_bio_with_history(self): """Crear biografia creible con historial""" import datetime join_date = datetime.datetime.now - datetime.timedelta(days=random.randint(365, 1500) return { 'joined': join_date.strftime('%Y-%m-%d'), 'bio': random.choice([ 'Trabajo en tecnologia y me gusta discutir politica', 'Madre de 2 hijos, preocupada por el futuro de mi pais', 'Jubilado, ex-docente universitario', ]), 'interests': random.sample(['lectura', 'deporte', 'cocina', 'viajes', 'musica'], 2) }
```

### 3.3 Amplificacion Cross-Platform

```python
class CrossPlatformAmplification: def __init__(self): self.platforms = ['twitter', 'facebook', 'reddit', 'instagram', 'tiktok', 'youtube', 'telegram'] def amplify(self, message, platforms, accounts_per=10): print(f'Amplificando mensaje en {len(platforms)} plataformas..') for p in platforms: print(f'  {p}: {accounts_per} cuentas publicando') return {'platforms': platforms, 'total_posts': len(platforms) * accounts_per} def create_referential_loop(self, platform_a_post, platform_b): print('Post en A redirige a contenido en B') print('Comentarios en B redirigen a C (Telegram)') print('Telegram tiene el documento filtrado original') def orchestrate_cross_platform(self, seed_content, timeline_hours=48): """Orquestar lanzamiento coordinado en multiples plataformas""" phases = { 0: {'action': 'sembrar', 'platform': ['reddit', '4chan']}, 6: {'action': 'amplificar', 'platform': ['twitter', 'telegram']}, 12: {'action': 'mainstream', 'platform': ['facebook', 'whatsapp']}, 24: {'action': 'video', 'platform': ['youtube', 'tiktok']}, 48: {'action': 'recuperar', 'platform': ['medios_tradicionales']}, } return phases
```

### 3.4 Ejercicios Practicos

**Ejercicio 3.1:** Disena una campana de desinformacion completa (ficticia) con: objetivo, audiencia, narrativa, canales, timeline, metricas.

**Ejercicio 3.2:** Implementa un sistema de sock puppets con perfiles creibles (nombre, bio, avatar, historial, [red](../raw/r3d3s-f0nd4m3nt0s.md) de amigos).

**Ejercicio 3.3:** Simula una operacion de amplificacion cross-platform con coordinacion temporal.

---

## 4. Gaming de Algoritmos de [redes](../raw/r3d3s-f0nd4m3nt0s.md) Sociales

### 4.1 Recommendation Systems

Los algoritmos de recomendacion se basan en:
1. **Collaborative Filtering:** "Usuarios como tu vieron esto"
2. **Content-Based:** "Similar a lo que te gusta"
3. **Reinforcement Learning:** Optimizar engagement

**Senales explotables:**
| Senal | peso | Manipulacion |
|-------|------|-------------|
| Click-through Rate | Alto | Titulos enganosos |
| Watch Time | Muy alto | Rabbit holes |
| Likes/Compartidos | Alto | Contenido polarizante |
| Comentarios | Alto | Preguntas abiertas |
| Freshness | Medio | Horarios pico |

### 4.2 Engagement Hacking

```python
class EngagementHacking: def optimize_post_time(self, platform='twitter'): times = { 'twitter': ['7-9', '12-13', '17-18'], 'facebook': ['9-11', '13-15'], 'instagram': ['11-13', '19-21'], 'tiktok': ['19-23'], } return times.get(platform, ['12']) def engagement_bait(self, topic): return { 'question': f'Que opinan de {topic}? 1) A favor 2) En contra', 'outrage': f'No puedo creer lo de {topic}. Opiniones?', 'curiosity': f'Hilo: Lo que NO te cuentan sobre {topic}. 1/10', } def create_rabbit_hole(self, seed, steps=10): print(f'Creando rabbit hole desde: {seed}') for s in range(steps): category = ['dato', 'documento', 'testimonio', 'teoria'][s % 4] print(f'  Paso {s+1}: Nuevo {category} que profundiza') def polarize(self, topic): stances = [ f'TOP 5 razones por las que {topic} es lo MEJOR', f'TOP 5 razones por las que {topic} es lo PEOR', f'Si apoyas {topic} deja de seguirme', ] return stances def optimize_for_algorithm(self, content, platform): """Optimizar contenido para el algoritmo especifico de cada plataforma""" optimizations = { 'tiktok': { 'length': '15-30 seg', 'hook': 'primeros 2 segundos', 'sounds': 'usar trending sounds', 'hashtags': '3-5 trending tags' }, 'youtube': { 'title': 'Clickbait optimizado', 'thumbnail': 'Alto contraste, cara de sorpresa', 'description': 'Keywords en primeros 200 chars' }, 'instagram': { 'carousel': 'Multiples slides > single image', 'stories': 'Polls y questions para engagement' } } return optimizations.get(platform, {})
```

### 4.3 Narrative Trending

```python
class NarrativeTrending: def force_trending(self, hashtag, platform='twitter', n_bots=1000): print(f'Forzando trending: #{hashtag}') print(f'  {n_bots} bots publicando') print(f'  Picos cada 5 min') return {'hashtag': hashtag, 'trending': True} def hijack_trending(self, trend, new_narrative): print(f'Secuestrando trend {trend} para narrativa: {new_narrative}') def create_false_consensus(self, topic, support_pct=72): print(f'Falso consenso: {support_pct}% apoya {topic}') print(f'  Encuestas manipuladas') print(f'  Medios reportan apoyo creciente') def monitor_trends(self, region, keywords): """Monitorear trends en tiempo real para intervenir""" import random trends = for keyword in keywords: trends.append({ 'keyword': keyword, 'volume': random.randint(100, 50000), 'velocity': random.uniform(-10, 50), 'sentiment': random.choice(['positive', 'negative', 'mixed']) }) return sorted(trends, key=lambda x: x['volume'], reverse=True)
```

### 4.4 Ejercicios Practicos

**Ejercicio 4.1:** Analiza el algoritmo de recomendacion de YouTube/TikTok para un tema. Documenta cambios en las recomendaciones.

**Ejercicio 4.2:** Crea un plan de engagement hacking: horarios, tipos de contenido, polarizacion, rabbit holes.

**Ejercicio 4.3:** Simula una operacion de hijacking de hashtions)tag trending.

---

## 5. Evasión de Detección y Moderación

### 5.1 NLP-based Content Detectors Evasion

```python
class NLPAvoidance: def lexical_variation(self, text): replacements = { 'gobierno': ['regimen', 'administracion', 'el sistema'], 'inmigrante': ['extranjero', 'persona desplazada'], 'mentira': ['narrativa alternativa', 'desinformacion'], } for word, alts in replacements.items: if word in text.lower: text = text.replace(word, random.choice(alts) return text def add_hedging(self, text): hedges = ['Algunos dicen que', 'Podria argumentarse que', 'Segun ciertas fuentes,'] return random.choice(hedges) + ' ' + text.lower def insert_noise(self, text): noise = ['honestamente', 'basicamente', 'en mi opinion', 'sinceramente'] words = text.split if len(words) > 3: pos = random.randint(1, len(words) - 1) words.insert(pos, random.choice(noise) return ' '.join(words) def adversarial_paraphrase(self, text, model=None): """Usar LLM para parafrasear contenido problematico""" if model: prompt = f"Parafrasea el siguiente texto manteniendo el significado: {text}" return model.query(prompt) return text  # Fallback
```

### 5.2 Platform Moderation Gaming

```python
class ModerationGaming: def __init__(self): self.rules = { 'twitter': {'links': 2, 'identical': 5}, 'facebook': {'links': 3, 'posts_per_hour': 10}, 'reddit': {'karma_min': 100, 'frequency_min': 10}, } def avoid_shadowban(self, platform='twitter'): r = self.rules.get(platform, {}) print(f'Evitando shadowban en {platform}:') print(f'  - Limitar links a {r.get("links", "N/A")} por post') print(f'  - Espaciar publicaciones') print(f'  - Incluir contenido no-politico entre posts') print(f'  - Variar hashtags') def evade_reporting(self, content): techniques = [ ('asteriscos', self._replace_vowels(content), ('base64', self._b64encode(content), ('unicode', self._unicode_confusion(content), ('zero_width', self._zero_width_chars(content), ] return techniques def _replace_vowels(self, text): import re return re.sub('[aeiouAEIOU]', '*', text) def _b64encode(self, text): import base64 return base64.b64encode(text.encode).decode def _unicode_confusion(self, text): """Usar homoglifos Unicode para evadir filtros de texto""" homoglyphs = { 'a': '\u0430',  # Cyrillic a 'e': '\u0435',  # Cyrillic e 'o': '\u043E',  # Cyrillic o 'c': '\u0441',  # Cyrillic c } result = '' for char in text.lower: if char in homoglyphs and random.random < 0.3: result += homoglyphs[char] else: result += char return result def _zero_width_chars(self, text): """Insertar caracteres de ancho cero para romper firmas""" zwsp = '\u200B'  # Zero-width space result = '' for char in text: result += char if random.random < 0.05: result += zwsp return result
```

### 5.3 Stylometric Evasion

```python
class StylometricEvasion: def analyze_style(self, texts): features = { 'avg_sentence_length': sum(len(t.split) for t in texts) / max(len(texts), 1), 'vocab_richness': len(set(' '.join(texts).split) / max(len(' '.join(texts).split), 1), } return features def mimic_style(self, target_texts, new_content): style = self.analyze_style(target_texts) print(f'Mimetizando: avg_sentence_len={style["avg_sentence_length"]:.1f}') return new_content def randomize_style(self, content): """Randomizar estilo de escritura para evitar huellas""" import random # Variar longitud de oraciones sentences = content.split('. ') varied = for s in sentences: if random.random < 0.3 and len(s) > 50: # Dividir oracion larga mid = len(s) // 2 varied.append(s[:mid] + '.') varied.append(s[mid:].strip.lower + '.') else: varied.append(s) return ' '.join(varied)
```

### 5.4 Ejercicios Practicos

**Ejercicio 5.1:** Implementa evasion de moderacion con: variacion lexical, [ofuscacion](../raw/4pk-r3v3rs1ng.md#obfuscation), codificacion, y estilometria.

**Ejercicio 5.2:** Crea un detector de estilometria que identifique autores. Luego implementa evasion del mismo.

**Ejercicio 5.3:** Prueba diferentes tecnicas de ofuscacion Unicode contra filtros de texto en plataformas reales.

---

## 6. Behavioral [osint](../raw/0s1nt.md)

### 6.1 personality Profiling

```python
class BehavioralOSINT: def profile_from_social(self, username): return { 'big_five': { 'openness': random.uniform(0, 1), 'conscientiousness': random.uniform(0, 1), 'extraversion': random.uniform(0, 1), 'agreeableness': random.uniform(0, 1), 'neuroticism': random.uniform(0, 1), }, 'political': random.choice(['left', 'center', 'right']), 'emotional': random.choice(['stable', 'volatile']), 'routine': { 'wake_up': f'{random.randint(6, 10)}:00', 'sleep': f'{random.randint(22, 2)}:00', 'peak_hours': random.choice(['morning', 'afternoon', 'night']), } } def estimate_big_five_from_text(self, texts): # En produccion: analisis linguistico basado en LIWC o similar return self.profile_from_social('')['big_five'] def political_compass_from_social(self, user_data): """Estimar posicion politica basada en follows, likes, shares""" follows = user_data.get('follows', ) score = 0 left_leaning = ['progresista', 'igualdad', 'derechos_humanos'] right_leaning = ['libertad_economica', 'tradicion', 'orden'] for account in follows: if account in left_leaning: score -= 1 elif account in right_leaning: score += 1 return { 'economic': random.uniform(-1, 1), 'social': random.uniform(-1, 1), 'leaning': 'left' if score < 0 else 'right' }
```

### 6.2 Predictive Behavior Modeling

```python
class PredictiveModeling: def __init__(self): self.model = None def train(self, historical_data): from sklearn.ensemble import RandomForestClassifier import numpy as np X = np.array([[u['posts_per_day'], u['night_ratio'], u['sentiment_var']] for u in historical_data]) y = np.array([u['label'] for u in historical_data]) self.model = RandomForestClassifier(n_estimators=100) self.model.fit(X, y) print(f'Modelo entrenado con {len(X)} muestras') return self.model def predict(self, user_data): import numpy as np if self.model is None: return {'prediction': 'unknown'} features = np.array([[user_data['posts_per_day'], user_data['night_ratio'], user_data['sentiment_var']]]) pred = self.model.predict(features)[0] conf = max(self.model.predict_proba(features)[0]) return {'prediction': pred, 'confidence': conf} def predict_next_action(self, user_history): """Predecir la proxima accion de un usuario basado en patrones""" import numpy as np if len(user_history) < 5: return {'prediction': 'insufficient_data'} # Analizar patrones temporales last_hours = [h['hour'] for h in user_history[-10:]] avg_hour = np.mean(last_hours) return { 'next_action_time': f'{int(avg_hour)}:00-{int(avg_hour)+2}:00', 'action_type': random.choice(['like', 'share', 'comment']), 'confidence': random.uniform(0.5, 0.8) }
```

### 6.3 Social Graph Analysis

```python
class SocialGraphAnalysis: def build_graph(self, connections): """Construir grafo social a partir de conexiones""" import networkx as nx G = nx.Graph for user, friends in connections.items: for friend in friends: G.add_edge(user, friend) return G def find_influencers(self, graph): """Identificar nodos influyentes en la red social""" import networkx as nx centrality = nx.betweenness_centrality(graph) top_influencers = sorted(centrality.items, key=lambda x: x[1], reverse=True)[:10] return top_influencers def detect_communities(self, graph): """Detectar comunidades en el grafo social""" from networkx.algorithms.community import girvan_newman communities = girvan_newman(graph) top_communities = [sorted(list(c) for c in next(communities)] return top_communities def find_coordinated_groups(self, interactions): """Detectar grupos coordinados por patrones de interaccion""" from collections import defaultdict # Analizar sincronia temporal entre cuentas time_groups = defaultdict(list) for interaction in interactions: time_key = interaction['timestamp'] // 60  # Agrupar por minuto time_groups[time_key].append(interaction['user']) # Buscar grupos que aparecen juntos frecuentemente coordinated = for time, users in time_groups.items: if len(users) > 5:  # Mas de 5 cuentas en el mismo minuto coordinated.append({'time': time, 'users': users, 'coordinated': True}) return coordinated
```

### 6.4 Ejercicios Practicos

**Ejercicio 6.1:** Crea un perfil psicologico completo de una persona basado en su actividad en [redes](../raw/r3d3s-f0nd4m3nt0s.md) (sin acceso real, usa datos simulados).

**Ejercicio 6.2:** Implementa un modelo predictivo que estime la proxima accion de un usuario.

**Ejercicio 6.3:** Construye un grafo social a partir de datos de conexiones. Identifica influencers y comunidades.

---

## 7. Explotacion de Sesgos Cognitivos

### 7.1 Fundamentos

Sesgos clave explotables en InfoOps:
1. **Confirmation Bias:** Buscar info que confirma creencias.
2. **Dunning-Kruger:** Incompetentes sobreestiman su habilidad.
3. **Availability Heuristic:** Juzgar probabilidad por facilidad de recordar.
4. **Anchoring:** Confiar en la primera informacion recibida.
5. **Bandwagon Effect:** Hacer algo porque otros lo hacen.
6. **Backfire Effect:** Evidencia contraria refuerza la creencia.
7. **Negativity Bias:** Mas peso a experiencias negativas.

### 7.2 Confirmation Bias exploitation

```python
class CognitiveBiasExploitation: def exploit_confirmation_bias(self, beliefs, narrative): for belief in beliefs: print(f'Creando contenido que CONFIRMA: {belief}') print(f'Vinculando todo a la narrativa: {narrative}') return {'targets': len(beliefs), 'effectiveness': random.uniform(0.7, 0.9)} def create_echo_chamber(self, users, topic): for user in users: print(f'  {user}: alimentando con contenido que refuerza creencias') return {'affected': len(users), 'score': 0.85} def exploit_dunning_kruger(self, topic): print(f'Explotando Dunning-Kruger sobre {topic}:') print('  1. Presentar como simple y obvio') print('  2. Cualquiera con sentido comun lo ve') print('  3. Atacar a expertos como elite') print('  4. Soluciones simples a problemas complejos') def exploit_availability(self, topic, platforms): for p in platforms: print(f'  {p}: Aumentando presencia de {topic}') print('  Repeticion constante') print('  Asociacion emocional (miedo/esperanza)') def set_anchor(self, topic, initial_frame): print(f'Ancla sobre {topic}: {initial_frame}') print('  Todas las discusiones futuras se referencian a este ancla') def exploit_backfire_effect(self, belief, counter_evidence): """El efecto backfire hace que contradecir refuerce la creencia""" print(f'Exponiendo evidencia contraria a: {belief}') print(f'  Resultado esperado: creencia se fortalece') print(f'  Estrategia: NO confrontar directamente') print(f'  Mejor: desviar la atencion, sembrar duda sutil')
```

### 7.3 Ejercicios Practicos

**Ejercicio 7.1:** Crea un plan de explotacion de 5+ sesgos para un tema especifico. Incluye contenido especifico para cada sesgo.

**Ejercicio 7.2:** Analiza una campana real e identifica que sesgos explota. Documenta tecnicas especificas.

**Ejercicio 7.3:** Disena una camara de eco digital y explica como se retroalimentan los sesgos.

---

## 8. Defensa y Mitigacion

### 8.1 Media Literacy

```python
class MediaLiteracy: def __init__(self): self.checklist = [ 'Verificar la fuente original', 'Buscar en 3+ medios independientes', 'Verificar fecha', 'Identificar sesgos de encuadre', 'Verificar imagen/video', 'Buscar fact-checking', ] def evaluate_source(self, url): factors = { 'has_contact': False, 'has_corrections': False, 'cites_sources': False, 'domain_age_days': 0, } score = sum(factors.values) return 'baja' if score < 2 else 'media' if score < 4 else 'alta' def verify_image(self, image_path): """Verificar si una imagen es autentica o manipulada""" import hashlib with open(image_path, 'rb') as f: file_hash = hashlib.md5(f.read).hexdigest # Buscar en bases de datos de fact-checking # (simulado) return {'hash': file_hash, 'known_fake': False, 'known_real': True}
```

### 8.2 Critical Thinking

```python
class CriticalThinking: @staticmethod def apply_questions(content): questions = [ ('Quien creo esto?', 'Intereses detras'), ('Cual es la evidencia?', 'Fuentes verificables?'), ('Que perspectiva falta?', 'Que omiten?'), ('Es emocional o factual?', 'Apela a emociones?'), ('Que ganan con esto?', 'Beneficio para el creador?'), ] for q, a in questions: print(f'  {q} -> {a}')
```

### 8.3 Digital Hygiene

```python
class DigitalHygiene: def audit(self, platform='twitter'): return { 'following': 500, 'privacy': 'adequate', 'recommendations': [ 'Reducir cuentas polarizantes', 'Seguir fuentes diversas', 'Verificar antes de compartir', 'Usar bloqueadores de rastreo', ] } def curated_feed(self, interests): """Crear un feed diversificado para evitar camaras de eco""" sources = { 'news': ['BBC', 'Reuters', 'AP', 'local'], 'analysis': ['academic_journals', 'think_tanks'], 'opposing_views': ['sources_with_different_perspectives'], } return sources
```

### 8.4 Narrative Tracking

```python
class NarrativeTracker: def track(self, keyword, platforms=None): if platforms is None: platforms = ['twitter', 'reddit'] return { 'mentions_30d': {f'day_{i}': random.randint(100, 10000) for i in range(30)}, 'by_platform': {p: random.randint(100, 5000) for p in platforms}, 'sentiment': 'increasing', 'coordinated': random.random > 0.7, } def detect_coordinated(self, posts): indicators = { 'same_text': sum(1 for p in posts if posts.count(p) > 1), 'timing': random.uniform(0, 1), } return {'coordinated': random.random > 0.5, 'confidence': random.uniform(0.5, 0.9)} def early_warning_system(self, keywords, threshold=1000): """Sistema de alerta temprana para narrativas en crecimiento""" import random alerts = for kw in keywords: volume = random.randint(100, 10000) if volume > threshold: alerts.append({ 'keyword': kw, 'volume': volume, 'velocity': random.uniform(1, 50), 'alert': 'POSIBLE_COORDINATED_CAMPAIGN' }) return alerts
```

### 8.5 Ejercicios Practicos

**Ejercicio 8.1:** Disena un programa de alfabetizacion mediatica con modulos, materiales y metricas.

**Ejercicio 8.2:** Implementa un rastreador de narrativas que monitoree un tema en tiempo real y detecte picos de actividad coordinada.

**Ejercicio 8.3:** Crea un plan de defensa personal: dieta informativa, verificacion de fuentes, deteccion de sesgos.

**Ejercicio 8.4:** Implementa un sistema de alerta temprana para detectar campanas de [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation) antes de que se vuelvan virales.

---

## 9. Apendices

### 9.1 Glosario

| Termino | Definicion |
|---------|------------|
| Astroturfing | Apoyo popular fabricado que parece genuino |
| Botnet Social | [red](../raw/r3d3s-f0nd4m3nt0s.md) de cuentas automatizadas |
| Camara de Eco | Ambiente que solo confirma creencias |
| Doxing | Publicar info privada de alguien |
| Framing | Enmarcar un tema para influir interpretacion |
| Gaslighting | Hacer dudar de la realidad |
| Narrative | Historia que organiza hechos |
| Sock Puppet | Cuenta con identidad ficticia |
| Stylometry | Analisis de estilo de escritura |
| Concern Trolling | Fingir preocupacion para sembrar duda |
| Priming | Preparar el terreno para una interpretacion |
| Agenda setting | Controlar que temas se discuten |
| Rabbit Hole | Secuencia de contenido que radicaliza |
| Echo Chamber | Camara de eco informacional |
| [disinformation](../raw/c0gn1t1v3-w4rf4r3.md#disinformation) | Info falsa creada para enganar |
| Misinformation | Info falsa compartida sin intencion |
| Malinformation | Info verdadera usada para danar |
| Microtargeting | Mensajes personalizados por segmento |

### 9.2 Herramientas

- **Botometer:** Deteccion de bots en Twitter
- **Hoaxy:** Visualizacion de difusion de [desinformacion](../raw/c0gn1t1v3-w4rf4r3.md#disinformation)
- **InVID:** Verificacion de video
- **TinEye:** Busqueda inversa de imagenes
- **Gephi:** Visualizacion de grafos sociales
- **NetworkX:** Analisis de grafos en [python](../raw/pyth0n-f0r-h4ck1ng.md)
- **TweetDeck:** Monitoreo de Twitter en tiempo real
- **Brandwatch:** Social listening
- **CrowdTangle:** Analisis de Facebook

### 9.3 Casos de Estudio

1. **Internet Research Agency (2014-2017):** Botnet rusa en elecciones EEUU.
2. **Cambridge Analytica (2016):** Microtargeting politico con datos psicometricos.
3. **Myanmar Genocide (2017):** Desinformacion en Facebook contra Rohingya.
4. **COVID-19 Infodemic (2020):** Desinformacion sobre pandemia y vacunas.
5. **Guerra Rusia-Ucrania (2022-presente):** Guerra informacional global.
6. **Operation Secondary Infektion (2014-2020):** Red de desinformacion rusa en 30+ paises.
7. **Election interference Brazil 2018:** Desinformacion via WhatsApp en campaña electoral.

## 10. Deepfakes y Contenido Sintetico

### 10.1 Tipos de Deepfakes

```python
class DeepfakeTaxonomy: def types(self): return { 'face_swap': 'Reemplazar rostro de una persona por otra', 'lip_sync': 'Sincronizar labios con audio falso', 'full_body': 'Generar cuerpo completo sintetico', 'audio_deepfake': 'Sintetizar voz de una persona especifica', 'text_deepfake': 'Contenido generado por LLM que imita estilo', 'video_reanimation': 'Animar una foto fija', } def detection_difficulty(self, fake_type): difficulties = { 'face_swap': 'Media', 'lip_sync': 'Alta', 'full_body': 'Muy alta', 'audio_cloning': 'Muy alta', 'llm_text': 'Alta', } return difficulties.get(fake_type, 'Desconocida')
```

### 10.2 Generacion de Deepfakes

```python
class DeepfakeGenerator: def generate_audio_clone(self, audio_samples, target_text): """Generar audio falso de una persona (voz en 5 seg)""" print(" 1. Extraer embeddings de voz (Speaker Encoder)") print(" 2. Sintetizar voz con Tacotron/SV2TTS") print(" 3. Vocoder (WaveGlow/WaveNet) para audio realista") print(" 4. Sincronizacion labial si es video") return {'success': True, 'duration_seconds': len(target_text) * 0.2} def generate_video_deepfake(self, source_video, target_face): """Generar face swap en video""" # Metodos: DeepFaceLab, FaceSwap, Roop, FaceFusion steps = [ '1. Extraer frames del video fuente', '2. Detectar y extraer rostros de cada frame', '3. Entrenar modelo con los rostros', '4. Convertir: aplicar rostro target a source', '5. Reconstruir video con nuevo rostro', ] return steps def detect_deepfake_traces(self, video_path): """Detectar senales de deepfake en video""" traces = # Inconsistencias de parpadeo traces.append('Analisis de frecuencia de parpadeo') # Inconsistencias de iluminacion traces.append('Mapa de iluminacion 3D vs 2D') # Artefactos en bordes de rostro traces.append('Deteccion de bordes sospechosos') # Frecuencia cardiaca (periodo de color facial) traces.append('Analisis de periodicidad de color') return traces
```

## 11. Psicometria y Microtargeting

### 11.1 Modelo OCEAN (Big Five)

```python
class PsychometricProfiling: def big_five_from_social_media(self, user_data): """Estimar personalidad OCEAN de actividad en redes""" scores = { 'openness': self._analyze_openness(user_data), 'conscientiousness': self._analyze_conscientiousness(user_data), 'extraversion': self._analyze_extraversion(user_data), 'agreeableness': self._analyze_agreeableness(user_data), 'neuroticism': self._analyze_neuroticism(user_data), } return scores def _analyze_openness(self, data): # Palabras relacionadas: 'arte', 'creativo', 'viaje', 'nuevo' return 0.75 def _analyze_conscientiousness(self, data): # Palabras relacionadas: 'orden', 'plan', 'responsabilidad' return 0.60 def predict_vote_intention(self, personality, demographics): """Predecir intencion de voto basado en perfil psicometrico""" # Modelo: persona + demografia -> probabilidad de voto return { 'candidate_a': 0.45, 'candidate_b': 0.30, 'undecided': 0.25, } def personalized_political_message(self, personality, topic): """Generar mensaje politico personalizado por personalidad""" messages = { 'high_openness': f"{topic}: una nueva vision para el futuro", 'low_openness': f"{topic}: protegiendo nuestras tradiciones", 'high_neuroticism': f"{topic}: una amenaza que debemos enfrentar", 'low_neuroticism': f"{topic}: un desafio superable", } return messages
```

## 12. [social engineering](../raw/ph1sh1ng.md#ingenieria-social) Avanzado

### 12.1 Tecnicas de [ingenieria social](../raw/ph1sh1ng.md#ingenieria-social) Digital

```python
class SocialEngineeringOps: def spear_phishing_tailored(self, target_profile): """Phishing personalizado basado en OSINT y psicometria""" content = f""" Hola {target_profile['name']}, Vi que trabajas en {target_profile['company']} y te interesa {target_profile['interest']}. Tengo justo lo que buscas.. [Enlace malicioso] Saludos, {target_profile['trusted_contact']} """ return content def pretexting_scenario(self, target_role): """Crear escenario de pretexto para llamada telefonica""" scenarios = { 'it_support': 'Soy del soporte tecnico, tenemos un problema con tu cuenta', 'hr': 'Soy de RRHH, necesitamos actualizar tus datos de emergencia', 'vendor': 'Soy proveedor, tenemos una factura pendiente', 'gov': 'Soy del organismo regulador, necesitamos verificar informacion', } return scenarios.get(target_role, 'Escenario generico') def quishing_attack(self, target_context): """Phishing via QR code (quishing)""" return { 'technique': 'Codigo QR malicioso', 'delivery': 'Imprimir QR y pegar en lugar publico', 'payload': 'Pagina de login falsa o descarga de malware', 'evasion': 'Los QR bypass filtros de texto y URL', }
```

## 13. Information Warfare en Conflictos Modernos

### 13.1 Guerra Rusia-Ucrania: Analisis de InfoOps

```python
class InfoWarfareAnalysis: def russia_ukraine_tactics(self): """Tacticas de guerra informacional en conflicto Rusia-Ucrania""" tactics = { 'narrative_control': 'Crear multiples narrativas contradictorias', 'official_sources': 'Usar canales oficiales para desinformacion', 'amplification': 'Red de bots y cuentas coordinadas', 'telegram_ops': 'Telegram como principal canal de distribucion', 'deepfakes': 'Videos de Zelensky rendiendose (fallidos)', 'hack_and_leak': 'Material filtrado "hackeado" como justificacion', } return tactics def counter_infoops_strategies(self): """Estrategias de contra-desinformacion""" strategies = [ 'Prebunking: Inocular antes de la exposicion', 'Debunking: Corregir despues de la exposicion', 'Source credibility: Senalar fuentes no confiables', 'Media literacy: Educar sobre tacticas de desinformacion', 'Platform enforcement: Remover contenido violatorio', 'Resilience building: Fortalecer pensamiento critico', ] return strategies
```

## 14. Ejercicios Practicos complementarios

**Ejercicio 14.1:** Crea un perfil psicometrico (OCEAN) de una persona basado en sus publicaciones de [redes](../raw/r3d3s-f0nd4m3nt0s.md) sociales (datos sinteticos).

**Ejercicio 14.2:** Disena una campana de spear [phishing](../raw/ph1sh1ng.md#spear-phishing)) personalizada basada en perfil psicometrico.

**Ejercicio 14.3:** Analiza un deepfake real: identifica artefactos visuales, inconsistencia de parpadeo, bordes sospechosos.

**Ejercicio 14.4:** Simula una operacion de information warfare: define narrativas, canales, audiencia, y contramedidas.

## 15. [osint](../raw/0s1nt.md) Operacional para InfoOps

### 15.1 Recoleccion de Inteligencia

```python
class InfoOpsOSINT: def gather_intel(self, target, platform='twitter'): """Recolectar informacion de un objetivo en redes sociales""" intel = { 'profile': f'Perfil de {target} en {platform}', 'connections': f'Red de seguidores/siguiendo', 'content': f'Posts, likes, shares de {target}', 'timing': f'Patrones de publicacion (horas, frecuencia)', 'sentiment': f'Analisis de sentimiento de publicaciones', 'network': f'Interacciones con otros usuarios', } return intel def social_graph_mapping(self, username, depth=2): """Mapear grafo social alrededor de un usuario""" graph = { 'ego': username, 'connections': , 'influencers': , 'communities': , } # Buscar conexiones hasta profundidad especificada for level in range(depth): graph['connections'].append(f'Level {level}: {10 ** level} users') return graph def sentiment_analysis_campaign(self, keyword, period_days=30): """Analizar sentimiento de una campana""" import random sentiment_over_time = for day in range(period_days): sentiment_over_time.append({ 'day': day, 'positive': random.uniform(0.2, 0.5), 'negative': random.uniform(0.2, 0.5), 'neutral': random.uniform(0.1, 0.3), }) return sentiment_over_time
```

### 15.2 Counter-OSINT

```python
class CounterOSINT: def reduce_digital_footprint(self, accounts): """Reducir huella digital de un objetivo""" actions = for account in accounts: actions.append(f'Cerrar cuenta: {account}') actions.append(f'Eliminar posts antiguos: {account}') actions.append(f'Cambiar nombre de usuario: {account}') actions.append(f'Modificar configuracion de privacidad: {account}') return actions def fake_data_generation(self, profile): """Generar datos falsos para contaminar OSINT""" fake_info = { 'name': 'Juan Perez (falso)', 'location': random.choice(['Buenos Aires', 'Cordoba', 'Mendoza']), 'job': random.choice(['Ingeniero', 'Abogado', 'Medico']), 'interests': random.sample(['futbol', 'lectura', 'viajes', 'cocina'], 2), 'connections': [f'fake_user_{i}' for i in range(random.randint(5, 20)], } return fake_info
```

## 16. Legislacion y Etica en InfoOps

### 16.1 Marco Legal Internacional

```python
class InfoOpsLegal: def applicable_laws(self, operation_scope): """Identificar leyes aplicables segun alcance de operacion""" laws = { 'usa': ['First Amendment', 'Computer Fraud and Abuse Act', 'FARA'], 'eu': ['GDPR', 'Digital Services Act', 'Network and Information Security Directive'], 'uk': ['Online Safety Bill', 'Data Protection Act'], 'russia': ['Federal Law on Information', 'Sovereign Internet Law'], 'china': ['Cybersecurity Law', 'Personal Information Protection Law'], } return {country: laws[country] for country in operation_scope} def ethical_framework(self): """Framework etico para operaciones de influencia""" return [ '1. No causar daño fisico a personas', '2. Transparencia en operaciones de investigacion', '3. Proteccion de fuentes y metodologias', '4. No manipular poblaciones vulnerables', '5. Divulgacion responsable de hallazgos', '6. Consentimiento informado cuando aplique', '7. Minimizacion de daños colaterales', '8. Documentacion de decisiones eticas', ]
```

## 17. Ejercicios Finales Integradores

**Ejercicio 17.1:** Simula una operacion completa de influencia: defini objetivo, audiencia, narrativa, canales, timeline, y metricas de exito.

**Ejercicio 17.2:** Implementa un sistema de counter-[osint](../raw/0s1nt.md) para un objetivo: identifica huella digital, reduce exposicion, genera datos falsos.

**Ejercicio 17.3:** Analiza un caso real de Information Warfare: identifica tacticas, narrativas, canales, y efectividad.

**Ejercicio 17.4:** Crea un framework etico para operaciones de influencia y evalua un caso historico contra el.

**Ejercicio 17.5:** Proyecto final: disena y documenta una operacion completa de contradesinformacion para un escenario especifico.


