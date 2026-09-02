# Self-Instruct — 52k instrucciones sintéticas sin humanos (Wang et al., 2022)

> **Autores:** Yizhong Wang, Yeganeh Kordi, Swaroop Mishra, Alisa Liu, Noah A. Smith, Daniel Khashabi, Hannaneh Hajishirzi / U. Washington + AllenAI
> **Año:** 2022 · **Versión:** arXiv 2212.10560 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2212.10560](https://arxiv.org/abs/2212.10560) · [github.com/yizhongw/self-instruct](https://github.com/yizhongw/self-instruct)
> **Categoría Papers:** 06 Skills · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

> **Paper:** Self-Instruct: Aligning Language Models with Self-Generated Instructions (Wang et al., 2022).
> **Relevancia para opencode-remote-android:** es tu **fábrica de datasets**. Si LoRA (06) / QLoRA (07) / DPO (09) te piden 500 ejemplos y solo tenés 20, Self-Instruct te genera los 480 restantes con el LLM grande — sin etiquetar a mano.

## 1 Introducción — Qué problema resuelve

Fine-tunear (SFT, LoRA, DPO) necesita datos: pares `(instrucción, respuesta)` curados. Escribirlos a mano es lento y caro — InstructGPT (paper 08) pagó miles de horas humanas para 13k ejemplos.

Self-Instruct demuestra que podés **bootstrappear 52k instrucciones de alta calidad a partir de solo 80 seeds** usando el propio LLM grande (GPT-3) como generador, con un loop de generación + filtrado. El modelo se enseña a sí mismo — de ahí el nombre.

Alpaca (Stanford, 2023) usó exactamente este método para generar 52k ejemplos con `text-davinci-003` y fine-tunear Llama 7B — y alcanzó **85% de la calidad de InstructGPT** sin un solo label humano.

## 2 Ideas clave

### 2.1 El loop Self-Instruct — 4 pasos

```
Seeds (80) ──► Generar ──► Filtrar ──► Fine-tune ─┐
  ▲              │            │                     │
  │              │            ▼                     │
  └──────────────┴──── Pool (52k) ◄────────────────┘
```

| Paso | Qué hace | Detalle |
|---|:---|---|
| **1. Seeds** | 80 instrucciones escritas a mano (ej: "Escribe un email formal") | Diversas, con 1 ejemplo de input/output cada una |
| **2. Generar** | LLM genera nuevas instrucciones + inputs + outputs (few-shot con 8 seeds) | Prompt: "Genera una instrucción nueva distinta a estas 8" |
| **3. Filtrar** | Descarta instrucciones duplicadas (ROUGE-L >0.7), inválidas o muy largas | ~30% descartado |
| **4. Fine-tune** | Entrena el modelo base sobre el pool filtrado | SFT estándar (paper 08 paso 1) |

Repetís 2-3 hasta llegar a 52k.

### 2.2 Prompt de generación — few-shot diverso

Para generar una instrucción nueva, se samplean **8 seeds aleatorios** como few-shot y se pide al LLM:

```
Ves estas 8 instrucciones:
1. Escribe un poema sobre...
2. Clasifica el sentimiento de...
...
8. Explica el siguiente código...

Genera una instrucción NUEVA, distinta, con su input y output.
```

La diversidad de los 8 seeds fuerza diversidad en la generación. Si siempre usás los mismos 8, generás variantes del mismo tema.

### 2.3 Filtro ROUGE-L — no generar 52k copias

Cada instrucción generada se compara con todas las existentes vía **ROUGE-L** (overlap de n-gramas). Si `ROUGE-L > 0.7` con alguna existente, se descarta — es duplicada. Esto asegura que 52k no sean 52k paráfrasis de "escribe un email".

Además se filtra:

- Instrucciones con palabras clave inválidas ("imagen", "video" — el LLM no puede generar eso)
- Outputs muy cortos o vacíos
- Instrucciones que el propio LLM marca como "no seguible"

### 2.4 85% de InstructGPT sin humanos

| Modelo | Datos | Costo | Calidad vs InstructGPT |
|---|:---:|:---:|:---:|
| InstructGPT | 13k humanos | ~$10k+ | 100% |
| **Self-Instruct (52k)** | 80 seeds + GPT-3 | **~$600** | **85%** |
| Alpaca (52k Self-Instruct) | 80 seeds + davinci-003 | ~$500 | 85% vs InstructGPT |

Con 80 seeds y $500 en API, tenés un dataset que rinde 85% de lo que costó $10k en humanos.

## 3 Evidencia / Experimentos

| Modelo base | Método | SuperNI ( Rouge-L) | Human eval win vs base |
|---|:---:|:---:|:---:|
| GPT-3 175B | Base (sin FT) | 0.31 | — |
| GPT-3 175B | **Self-Instruct 52k** | **0.45** | **~60%** |
| T5 11B | Base | 0.28 | — |
| T5 11B | Self-Instruct 52k | 0.41 | — |

- **Escala del dataset:** de 100 → 52k, la performance sube log-lineal — cada 10× más datos da ~+5pp en SuperNI. No necesitás 52k para ver ganancia; con 500 ya mejora.
- **Seeds importan:** con 80 seeds diversos, la calidad es alta; con 10 seeds similares, el pool colapsa a un tema y no generaliza.
- **Alpaca (2023):** replica Self-Instruct con Llama 7B + 52k de davinci-003, y en eval humana es preferido sobre Llama base en 90% de casos — valida el método fuera del paper original.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Generar dataset para LoRA/QLoRA/DPO** | Tenés 20 ejemplos reales de tasks opencode. Con Self-Instruct, generá 500 sintéticos: few-shot con 8 de tus 20 + LLM grande (GPT-4/Claude vía `:4097`) → 500 nuevos → filtra ROUGE-L → fine-tune Phi-3 con LoRA (06) o QLoRA (07). Sin esto, no tenés dataset para fine-tune. |
| **Seeds diversos** | Escribí 20 seeds que cubran tu dominio: `fs.read`, `fs.move`, `ptyx exec`, `probe`, `external spawn`, `constitution guard`, `skill routing`. Diversidad = buen pool. Si solo ponés `fs.read`, generás 500 variantes de `fs.read`. |
| **Filtro ROUGE-L** | Antes de entrenar, filtrá duplicados con `rouge_score` (Python) o simple `difflib.SequenceMatcher >0.7`. Si no filtrás, tu LoRA overfitea a 500 copias del mismo patrón. |
| **Self-Instruct para DPO pares** | Generá pares `(chosen, rejected)` para DPO (paper 09): para cada instrucción sintética, pedí al LLM grande que genere `chosen` (correcto) y `rejected` (con error sutil, ej: path `..`). Así tenés 500 pares sin etiquetar a mano. |
| **opencode-stats :8765** | Logueá `{method: "self-instruct", seeds, generated, filtered, kept, cost_usd}`. Si generaste 1k y filtraste 700 (70% duplicados), tus seeds no son diversos — reescribilos. |
| **Skills sintéticos** | Generá `SKILL.md` sintéticos para tu dominio (paper 01): "Genera un skill para `opencode-stats` que exponga `query` y `log`". Así poblás `./skills` sin escribir cada uno a mano. |

```python
# scripts/self-instruct-generate.py — esqueleto
import random, json, re
from rouge_score import rouge_scorer

SEEDS = [
    {"instruction": "Lista archivos en web/src con fsx", "input": "", "output": "shell.fs.list_dir('web/src')"},
    {"instruction": "Verifica si el puerto 3000 está ocupado", "input": "", "output": "probe(3000, 250ms)"},
    # ... 20 seeds diversos
]

def generate_one(llm, seeds_sample):
    prompt = "Genera una instrucción NUEVA distinta a estas:\n"
    for s in seeds_sample:
        prompt += f"- {s['instruction']}\n"
    prompt += "\nNueva instrucción + input + output (JSON):"
    raw = llm.generate(prompt, max_tokens=300)  # via :4097
    return json.loads(raw)  # {"instruction": ..., "input": ..., "output": ...}

def is_duplicate(new_instr, pool, threshold=0.7):
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=False)
    for p in pool:
        if scorer.score(p["instruction"], new_instr["instruction"])["rougeL"].fmeasure > threshold:
            return True
    return False

# Loop
pool = SEEDS.copy()
while len(pool) < 520:
    sample = random.sample(SEEDS, 8)
    candidate = generate_one(llm, sample)
    if not is_duplicate(candidate, pool) and len(candidate["output"]) > 20:
        pool.append(candidate)
```

## 5 Anti-patterns / Limitaciones

- **Seeds poco diversos.** Si tus 20 seeds son todos "lee archivo", vas a generar 500 variantes de "lee archivo" y tu LoRA no aprenderá `ptyx` ni `probe`. Diversidad de seeds es el factor #1 — cubrí todos tus tools y skills.
- **No filtrar duplicados.** Sin ROUGE-L, el pool se llena de paráfrasis ("lista archivos" / "muestra archivos" / "enumera archivos") que no aportan señal. Siempre filtrá — el paper descarta ~30%.
- **Self-Instruct con modelo chico como generador.** Si usás Phi-3 3.8B para generar instrucciones, la calidad será baja (el generador debe ser más capaz que el alumno). Usá GPT-4/Claude vía `:4097` para generar, Phi-3 para entrenar.
- **52k sin validar = basura escalada.** Self-Instruct genera outputs imperfectos (el LLM grande también alucina). Si no validás una muestra (ej: 50 ejemplos revisados a mano), podés entrenar sobre 52k ejemplos con 15% de errores. Sampleá y validá.
- **Costo no es cero.** 52k generaciones con GPT-4 son ~$500-800. Para tu caso, 500 ejemplos son ~$5-10 — barato, pero no gratis. Presupuestá y cacheá.

## 6 Ejercicios prácticos (en tu repo)

1. **20 seeds → 200 sintéticos → filtra.** Escribí 20 seeds diversos de tu dominio (fsx, ptyx, probe, external, constitution). Generá 200 candidatos con GPT-4/Claude vía `:4097` (few-shot 8 seeds por generación), filtrá con ROUGE-L 0.7 y reportá `kept / generated` y `cost_usd`. ¿Cuántos duplicados? Si >40%, tus seeds no son diversos.

2. **LoRA con sintético vs sin sintético.** Entrená Phi-3 con LoRA r=8 (paper 06) de dos formas: (a) solo 20 seeds reales, (b) 20 reales + 200 sintéticos filtrados. Evaluá ambos en 20 issues held-out (no vistos en seeds ni sintéticos). ¿Cuánto aporta el sintético? Si (b) no mejora, revisá calidad del sintético (sampleá 20 y validá a mano).

3. **Pares DPO sintéticos.** Para 100 instrucciones sintéticas, generá `chosen` (correcto) y `rejected` (con error: path `..`, verborragia, tool incorrecto) con el LLM grande. Entrená Phi-3 con DPO (paper 09) sobre esos 100 pares y medí `win_rate` vs SFT solo. Es el pipeline completo: `Self-Instruct → DPO → LoRA` sin un solo label humano.

## 7 Referencias

- **Paper:** Wang et al., *Self-Instruct: Aligning Language Models with Self-Generated Instructions*, 2022 — https://arxiv.org/abs/2212.10560
- **Código:** https://github.com/yizhongw/self-instruct
- **Alpaca (aplicación):** https://github.com/tatsu-lab/stanford_alpaca — 52k Self-Instruct para Llama
- **Relacionados en esta serie:** LoRA (06) / QLoRA (07) — consumen el dataset; DPO (09) — consume pares; InstructGPT (08) — baseline humano que Self-Instruct reemplaza 85%.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (loop generación → filtrado) del paper original
- [ ] Entiendo por qué 8 seeds diversos + ROUGE-L 0.7 son críticos
- [ ] Sé generar 500 sintéticos con el LLM grande para fine-tunear Phi-3 local
- [ ] Anoté 20 seeds diversos + script `self-instruct-generate.py` para esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
