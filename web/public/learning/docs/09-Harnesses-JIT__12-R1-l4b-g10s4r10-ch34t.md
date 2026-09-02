# 01. Laboratorio Práctico: Comandos Copy-Paste para Experimentar

> **Objetivo**: Probar y verificar cada una de las tecnologías estudiadas en menos de 30 minutos por bloque.

---

## Bloque 1: OpenCode Beta v2 (15 min)

```bash
# 1. Instalar la versión beta de OpenCode CLI (no reemplaza v1)
npm install -g @opencode-ai/cli@beta

# 2. Verificar versión instalada (el binario es opencode2)
opencode2 --version

# 3. Inicializar un proyecto
cd g:\Proyectos\mi-proyecto
opencode2
# Dentro del TUI interactivo:
# /init     -> Genera el archivo AGENTS.md con las reglas del codebase
# /connect  -> Configura los proveedores y modelos

# 4. Crear un subagente especializado (.opencode/agents/reviewer.md)
# Copia y pega la siguiente definición:
```

```markdown
---
description: Revisor de código para auditoría estática y seguridad
mode: subagent
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
---

Revisa las modificaciones en el código buscando vulnerabilidades, errores de tipado y regresiones de rendimiento. No edites archivos.
```

---

## Bloque 2: Herramientas de Conversión a Skills (15 min)

### A. Conversión de Libros con `book-to-skill` (virgiliojr94)
```bash
# Ejecutar book-to-skill especificando la ruta al PDF o EPUB
# El script extraerá modelos mentales y generará SKILL.md + chapters/
cd G:\Proyectos\HERRAMIENTAS-VARIAS\book-to-skill

# Ejemplo de uso:
python -m book_to_skill.cli /ruta/a/tu-libro-de-arquitectura.pdf mi-skill-arquitectura
```

### B. Ingesta de Documentación Web con `Skill_Seekers` (yusufkaraaslan)
```bash
# Ingestar documentación viva de una librería o framework
skill-seekers create https://docs.astro.build/ --agent claude

# Ingestar un repositorio de GitHub completo
skill-seekers create https://github.com/effect-ts/effect --type github --agent claude
```

---

## Bloque 3: Runtime JIT-Agent (arXiv:2608.25593) (Requiere GPU o API)

```bash
# 1. Clonar el repositorio oficial de JIT
git clone https://github.com/bingreeky/JIT.git
cd JIT

# 2. Configurar el entorno Conda
conda env create -f environment.yml
conda activate jit

# 3. Servir el checkpoint de 27B con vLLM
MODEL=JIT-Agent/jit-27b TP=4 bash scripts/serve_meta_model.sh
# El servidor expondrá una API OpenAI-compatible en http://localhost:8000/v1

# 4. Generar y evaluar un arnés JIT sobre un benchmark
python -m scripts.run_jit \
  --bench xbench \
  --meta-model jit \
  --meta-base http://localhost:8000/v1 \
  --harness-refs desc \
  --max-samples 5

# 5. Inspeccionar los módulos generados
ls -R generated/
cat generated/*/memory.py
cat generated/*/prompt.yaml
```

---

## Bloque 4: Verificación de Diagnósticos de Protocolo ($\text{Valid}_{\boldsymbol{\Pi}}$)

Cuando un arnés generado por máquina falla, inspecciona el informe de diagnóstico:
- **Error de Interfaz**: Un módulo no implementa `build_view()` o `step()`.
- **Import Error**: El arnés intenta invocar una herramienta no declarada en $\mathcal{C}_\tau$.
- **Solución Automática**: Aplicar el paso de **Stage II Bounded Repair**, donde el modelo analiza el *traceback* y genera el parche $\Delta^{\star}$ en $\le 2$ iteraciones.


---

# 02. Glosario y Referencias Primarias Trazables

## 1. Glosario Formal de Términos (30 Conceptos Clave)

| Término | Definición Técnica | Módulo Relacionado |
| :--- | :--- | :--- |
| **AI Harness** | Infraestructura runtime que envuelve, controla, retroalimenta y ejecuta al modelo dentro de un bucle cerrado. | Módulo 1 |
| **$\mathbf{h} = (\mathbf{M}, \mathbf{P}, \mathbf{A}, \mathbf{F})$** | Descomposición formal del arnés en Memoria, Planificación, Acción y Capacidades. | Módulo 6 |
| **$\boldsymbol{\Pi}$ (Protocolo Meta)** | Contrato tipado que especifica esquemas de módulos, ciclo de vida y validación sintáctica. | Módulo 6 |
| **ETCLOVG** | Taxonomía de 7 capas: Execution, Tooling, Context, Lifecycle, Observability, Verification, Governance. | Módulo 1 |
| **$H = (E, T, C, S, L, V)$** | Formalización de arnés mediante sistemas de transición etiquetados (*Meng et al.*). | Módulo 1 |
| **AOT (Ahead-of-Time)** | Paradigma donde el arnés se programa y optimiza de forma estática antes del despliegue. | Módulo 5 |
| **JIT (Just-in-Time)** | Paradigma donde el arnés se sintetiza al vuelo por un meta-agente específicamente para cada tarea. | Módulo 6 |
| **HarnessFactory** | Banco semilla de 13 arneses representativos implementados bajo el protocolo $\boldsymbol{\Pi}$. | Módulo 6 |
| **Evo-GDPO** | *Evolutionary Group-Decoupled Policy Optimization*: Algoritmo RL que optimiza recompensa, latencia y coste por separado. | Módulo 6 |
| **$\text{Valid}_{\boldsymbol{\Pi}}$** | Validador determinista de ejecutabilidad que emite informes diagnósticos ante fallos. | Módulo 6 |
| **Archive $\mathcal{B}_n$** | Banco de arneses persistente que acumula configuraciones históricas ordenadas por frontera de Pareto. | Módulo 6 |
| **Skill** | Paquete modular en el sistema de archivos (`SKILL.md` + frontmatter) que define un procedimiento reusable. | Módulo 4 |
| **Wiki (WikiSkill)** | Capa intermedia persistente que compila y abstrae la experiencia de las trazas de ejecución. | Módulo 7 |
| **Gating & Rollback** | Mecanismo de validación sobre tareas de prueba que decide si aceptar o revertir una nueva skill. | Módulo 7 |
| **Subagente** | Instancia de agente secundario que corre en una sesión hija con contexto aislado y presupuesto acotado. | Módulo 2 |
| **Estigmergia (*Stigmergy*)**| Coordinación descentralizada de agentes mediada por modificaciones en el entorno compartido. | Módulo 2 |
| **Contract Net Protocol (CNP)**| Protocolo de mercado donde los agentes anuncian tareas, envían ofertas y adjudican la ejecución. | Módulo 2 |
| **Cordis** | Microkernel del arnés DeepSeek donde cada componente es un plugin intercambiable en caliente. | Módulo 5 |
| **book-to-skill** | Herramienta open-source para extraer modelos mentales y principios de libros en formato `SKILL.md`. | Módulo 4 |
| **Skill_Seekers** | Herramienta para ingestar documentación viva, repositorios y páginas web con resolución de conflictos. | Módulo 4 |
| **$C_1 - C_7$** | Las 7 funciones cognitivas fundamentales del agente (Percepción, Memoria, Razonamiento, Acción, Reflexión, Comunicación, Gobernanza). | Módulo 2 |
| **ReAct** | Patrón *Reasoning + Acting* que intercala pensamientos y llamadas a herramientas. | Módulo 2 |
| **Reflexion** | Refuerzo verbal episódico donde el agente auto-critica sus errores y los guarda en memoria. | Módulo 2 |
| **LATS** | *Language Agent Tree Search*: Búsqueda en árbol Monte Carlo sobre trayectorias del LLM. | Módulo 2 |
| **BDI** | Modelo cognitivo clásico basado en Creencias (*Beliefs*), Deseos (*Desires*) e Intenciones (*Intentions*). | Módulo 2 |
| **Context Epoch** | Segmento temporal de contexto delimitado por un resumen estructurado tras una compactación. | Módulo 1 |
| **Lazy Loading / Progressive Disclosure** | Técnica donde el agente solo carga el resumen inicial de una skill y lee los capítulos detallados bajo demanda. | Módulo 4 |
| **Model-as-a-Harness** | Concepto donde la inteligencia del arnés se internaliza en un modelo generador de código de scaffolds. | Módulo 6 |
| **Pareto Frontier (Coste-Rendimiento)**| Curva geométrica que mide el trade-off óptimo entre porcentaje de éxito, tokens consumidos y dólares gastados. | Módulo 6 |
| **Effect-TS** | Framework funcional en TypeScript para gestión tipada de errores, concurrencia por fibras y servicios. | Módulo 5 |

---

## 2. Referencias Primarias y Artículos Fundacionales

### Papers de Investigación (arXiv y TMLR)
1. **JIT-Agent (arXiv:2608.25593v1)**: *JIT-Agent: Scaling Harness Intelligence via Just-in-Time Harness Evolution*. Guibin Zhang et al., Agosto 2026. [arXiv:2608.25593](https://arxiv.org/html/2608.25593v1) | [HuggingFace](https://huggingface.co/JIT-Agent/jit-27b) | [GitHub](https://github.com/bingreeky/JIT)
2. **WikiSkill (arXiv:2608.27454v1)**: *WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution*. Tang et al., Agosto 2026. [arXiv:2608.27454](https://arxiv.org/html/2608.27454v1)
3. **ETCLOVG Survey (TMLR 2026)**: *Agent Harness Engineering: A Survey*. Picrew et al., 2026. [agentic-ai.readthedocs.io](https://agentic-ai.readthedocs.io)
4. **Formal Harness Survey (arXiv:2605.29682)**: *Agent Harness for LLM Agents: A Survey on Transitions and Safety*. Meng et al., 2026. [arXiv:2605.29682](https://arxiv.org/abs/2605.29682)
5. **Cognitive Architecture Matrix (arXiv:2605.13850)**: *A Two-Dimensional Framework for Agentic Capabilities*. 2026. [arXiv:2605.13850](https://arxiv.org/html/2605.13850v2)
6. **ReAct**: *Synergizing Reasoning and Acting in Language Models*. Yao et al., ICLR 2023. [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
7. **Reflexion**: *Language Agents with Verbal Reinforcement Learning*. Shinn et al., NeurIPS 2023. [arXiv:2303.11366](https://arxiv.org/abs/2303.11366)
8. **LATS**: *Language Agent Tree Search Unifies Reasoning, Acting, and Planning*. Zhou et al., ICML 2024. [arXiv:2310.04406](https://arxiv.org/abs/2310.04406)

### Repositorios y Documentación Técnica de Arneses
9. **OpenCode Beta v2 Docs & Source**: [opencode.ai/v2/docs](https://opencode.ai/v2/docs) | [github.com/opencode-ai/opencode](https://github.com/opencode-ai/opencode)
10. **virgiliojr94/book-to-skill**: [github.com/virgiliojr94/book-to-skill](https://github.com/virgiliojr94/book-to-skill) (22k+ estrellas, Licencia MIT).
11. **yusufkaraaslan/Skill_Seekers**: [github.com/yusufkaraaslan/Skill_Seekers](https://github.com/yusufkaraaslan/Skill_Seekers) (13k+ estrellas, Licencia MIT, PyPI: `skill-seekers`).
12. **Gerl Taxonomy**: *Agent Harness Taxonomy: Six Architectures*. [gerl.dev/blog/agent-harness-taxonomy](https://gerl.dev/blog/agent-harness-taxonomy)
13. **Andrew Ng - Agentic AI Design Patterns**: DeepLearning.AI & X Publications. [deeplearning.ai](https://www.deeplearning.ai)


---

# 📄 Cheatsheet de Referencia Rápida: Harnesses, Taxonomías y JIT-Agent

---

## 1. La Ecuación Central
$$\text{Capacidad Agéntica} = \text{Modelo de Fundación} \otimes \text{AI Harness}$$

---

## 2. Las 7 Capas de ETCLOVG (Auditoría Rápida)

```
[G] Governance    -> ¿Hay permisos allow/ask/deny y confirmación humana?
[V] Verification  -> ¿Hay tests unitarios deterministas y linters?
[O] Observability -> ¿Se guardan trazas tipadas en base de datos de eventos?
[L] Lifecycle     -> ¿La máquina de estados maneja pausa, reanudación y fork?
[C] Context       -> ¿Hay compactación estructurada y descarte de payloads pesados?
[T] Tooling       -> ¿Las herramientas están filtradas por fase (<15 tools)?
[E] Execution     -> ¿El código corre en sandbox / PTY con permisos acotados?
```

---

## 3. La 4-Tupla de JIT-Agent
$$\mathbf{h} = (\mathbf{M}, \mathbf{P}, \mathbf{A}, \mathbf{F})$$

| Módulo | Símbolo | Opciones Principales | Función |
| :--- | :--- | :--- | :--- |
| **Memoria** | $\mathbf{M}$ | `full`, `compact`, `fact-graph`, `subproblem` | Proyecta la vista de contexto $\mathbf{v}_t$. |
| **Planificación** | $\mathbf{P}$ | `none` ($\mathbf{P}_\emptyset$), `todo`, `dag`, `dynamic-decomp` | Genera la directiva local $\mathbf{d}_t$. |
| **Capacidades** | $\mathbf{F}$ | `all`, `research-only`, `edit-only`, `phase-scoped` | Filtra el catálogo de herramientas $\mathcal{U}_t \subseteq \mathcal{C}_\tau$. |
| **Acción** | $\mathbf{A}$ | `react`, `plan-and-execute`, `recursive-delegate`, `graph-exec` | Emite la acción ejecutable $e_t$ y actualiza el estado. |

---

## 4. Las 3 Capas de WikiSkill
1. **`raw/`**: Trazas JSONL inmutables (append-only).
2. **`wiki/`**: Base de conocimiento estructurada (`errors.md`, `environment.md`, `heuristics.md`).
3. **`skills/`**: Procedimientos compactos en formato `SKILL.md` con *lazy loading*.

---

## 5. Comandos Esenciales de Terminal

```bash
# OpenCode v2 Beta
npm install -g @opencode-ai/cli@beta
opencode2

# book-to-skill
python -m book_to_skill.cli /ruta/al/libro.pdf nombre-skill

# Skill_Seekers
pip install skill-seekers
skill-seekers create https://docs.ejemplo.com/ --agent claude

# JIT Meta-Model Server (vLLM)
MODEL=JIT-Agent/jit-27b TP=4 bash scripts/serve_meta_model.sh
```


---

# Prompts y Directivas de Sistema para JIT-Agent y OpenCode

---

## 1. System Prompt del Meta-Agente Sintetizador (JIT Synthesizer)

```markdown
Eres JIT-Synthesizer, un meta-agente especializado en arquitectura de sistemas agénticos.
Tu objetivo es analizar la solicitud del usuario, el árbol del proyecto y el catálogo de herramientas disponibles para generar una configuración de arnés óptima bajo el protocolo formal Π = (M, P, A, F).

Reglas de Generación:
1. No inyectes herramientas innecesarias en el subconjunto F. Para tareas de lectura o búsqueda, usa 'research-only'. Para refactors, usa 'phase-scoped'.
2. Si la tarea tiene dependencias no lineales entre archivos, selecciona Planning = 'dag' y Action = 'plan-and-execute'.
3. Si la tarea es exploratoria e incierta, selecciona Planning = 'dynamic-decomp' y Action = 'recursive-delegate'.
4. Emite la configuración exactamente en formato JSON compatible con JITHarnessConfig.
```

---

## 2. System Prompt del Wiki Maintainer (Consolidación de Patrones)

```markdown
Eres Wiki-Maintainer. Tu responsabilidad es inspeccionar las trazas de ejecución de sesiones anteriores en 'raw/' y compilar lecciones duraderas en 'wiki/'.

Reglas:
1. Identifica comandos de compilación o tests que hayan fallado inicialmente y cómo se solucionaron.
2. Añade entradas concisas con fecha y contexto en 'wiki/errors.md'.
3. Si descubres restricciones del entorno (versión de Node, flags de compilación requeridos), actualiza 'wiki/environment.md'.
4. Nunca borres conocimiento previo; consolida y elimina duplicados.
```
