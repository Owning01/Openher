# vLLM PagedAttention — Servir LLMs con 24× throughput (Kwon et al., 2023)

> **Paper:** Efficient Memory Management for Large Language Model Serving with PagedAttention — Kwon et al., UC Berkeley / SOSP 2023
> **Versión:** v2 · **Año:** 2023 · **Autores:** Woosuk Kwon, Zhuohan Li, Siyuan Zhuang, Ying Sheng, Lianmin Zheng, Cody Hao Yu, Joseph E. Gonzalez, Hao Zhang, Ion Stoica / UC Berkeley
> **Link:** [https://arxiv.org/abs/2309.06180](https://arxiv.org/abs/2309.06180) · [github.com/vllm-project/vllm](https://github.com/vllm-project/vllm)
> **Prioridad:** MEDIA P1 · **Nivel:** Intermedio · **Lectura:** ~14 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

## 1. Introducción

Servir LLMs en producción tiene un cuello de botella silencioso: el **KV cache**. Cada request genera claves y valores de atención que crecen con la longitud de la secuencia y ocupan GPU memory de forma contigua — como si el OS exigiera memoria contigua para cada proceso. Resultado: fragmentación, memoria desperdiciada, batching ineficiente y throughput bajo. HuggingFace Transformers llega a usar solo ~4% de la memoria efectivamente.

vLLM resuelve esto con **PagedAttention**, una idea prestada de memoria virtual de sistemas operativos: pagina el KV cache en bloques no contiguos, con una tabla de páginas que traduce índices lógicos a físicos. Igual que el OS pagina RAM, vLLM pagina KV cache. El resultado es **2-4× throughput sobre HuggingFace/FasterTransformer y hasta 24× en escenarios con sharing** (ej: múltiples requests con mismo prefijo), con 4× menos fragmentación.

Para opencode-remote-android esto importa si servís un SLM local en Rust (Phi-3, Qwen 7B) para tu harness — sin paginación, tu server se queda sin VRAM con pocos requests concurrentes del agente.

## 2. Ideas clave

| Idea | Qué es | Analogía OS |
|---|---|---|
| **KV cache paginado** | Divide KV cache en bloques fijos (ej: 16 tokens) no contiguos en GPU | Páginas de memoria virtual (4KB) no contiguas en RAM |
| **Tabla de páginas** | Mapea block_id lógico → block_id físico en GPU | Page table que traduce virtual → physical address |
| **Copy-on-Write (CoW)** | Múltiples secuencias comparten bloques de prefijo; al escribir, se copia solo el bloque modificado | Fork CoW en OS |
| **Scheduling con paginación** | Batch de requests con longitudes distintas sin padding desperdiciado | Scheduler que asigna páginas bajo demanda |
| **Bloques compartidos para beam search / parallel sampling** | N samples del mismo prompt comparten prefijo paginado | Shared memory entre procesos |

```
Sin paginación (HF):  Request A: [KV KV KV KV _ _ _ _]  ← reserva contigua, fragmenta
                      Request B: [KV KV _ _ _ _ _ _]     ← espacio desperdiciado
                      GPU: 60% fragmentada, 40% útil

Con PagedAttention:   Request A: block 0→phys 3, block 1→phys 7, block 2→phys 1  (no contiguos)
                      Request B: block 0→phys 3 (¡compartido CoW!), block 1→phys 9
                      GPU: ~95% útil, fragmentación ~0
```

```python
# Pseudocódigo de PagedAttention (idea)
class PagedKVCache:
    blocks: dict[int, Tensor]  # block_id físico → KV block en GPU
    page_table: dict[int, list[int]]  # seq_id → [block_id físico, ...]

    def attention(self, seq_id: int, query: Tensor) -> Tensor:
        # Traduce bloques lógicos → físicos y hace attention solo sobre bloques reales
        physical_blocks = [self.blocks[bid] for bid in self.page_table[seq_id]]
        return paged_attention_kernel(query, physical_blocks)
```

**Por qué 24× en algunos casos:** cuando N requests comparten prefijo (ej: mismo system prompt de 2k tokens + distintos user prompts), sin paginación cada request duplica el prefijo en VRAM. Con CoW paginado, el prefijo se almacena una vez y se comparte — N× ahorro.

## 3. Evidencia y experimentos

| Escenario | vLLM (PagedAttention) | HuggingFace Transformers | FasterTransformer | Comentario |
|---|---|---|---|---|
| **Throughput single (A100)** | **2-4×** | 1× | ~1.5× | Menos fragmentación → más batch |
| **Throughput con sharing (beam/parallel)** | **hasta 24×** | 1× | — | CoW evita duplicar prefijo |
| **Fragmentación** | **~4× menos** | alta | media | Bloques fijos eliminan fragmentación externa |
| **Latencia p99** | menor | mayor | — | Scheduling sin padding desperdiciado |

- **Hardware:** evaluado en A100 40GB con LLaMA 7B/13B, OPT 13B/30B. El beneficio crece con secuencias largas y batch grande.
- **Sharing es el multiplicador:** el 24× no es throughput general — es para parallel sampling / beam search donde N secuencias comparten prefijo largo. Para serving normal sin sharing, el speedup es 2-4× (ya enorme).
- **Implementación:** kernel CUDA custom para paged attention; no es solo "usar bloques", requiere kernel que entienda page tables.

## 4. Cómo aplica a opencode-remote-android

| Concepto vLLM | Mapeo concreto en tu repo |
|---|---|
| **SLM local en Rust** | Si servís Phi-3 / Qwen 7B local para tool use sin depender de opencode serve `:4096/:4097`, usá `vllm` o portá paginación a tu server Rust. Sin esto, 3-4 requests concurrentes del harness agotan VRAM. |
| **Prefijo compartido** | Tu system prompt (25 tools + ACI docs) es el prefijo compartido de todos los requests. Con CoW paginado, se almacena 1 vez en vez de N veces — ahorro directo de VRAM. |
| **`external_router.rs` + `probe 250ms`** | Si tu harness hace tool calls en paralelo (ver Gorilla `02-gorilla-bfcl-2023.md` parallel category), el LLM server debe atender N requests concurrentes sin fragmentar. PagedAttention lo hace posible. |
| **`external_router.rs:19 split_cmd` + `ptyx :4849`** | `split_cmd` con `CREATE_NO_WINDOW` spawnea el SLM local; `ptyx :4849` + `tiny_http :4848` atienden `tool.calls` en paralelo sin bloquear el KV cache paginado. |
| **`hyper :4850 mmap+br` ↔ paginación** | Tu `hyper :4850` ya pagina archivos estáticos con `mmap` — misma idea: bloques no contiguos mapeados por tabla. PagedAttention es `mmap` para KV cache. |
| **`mmap+<base href>`** | Análogo a paginación: `mmap+<base href="/shell/external/<name>/embed/">` pagina HTML y resuelve `/assets/*` sin duplicar; PagedAttention pagina KV y comparte prefijo sin duplicar. |
| **Batch de tool calls** | Si el agente genera 3 `tool_calls` en paralelo, el server LLM debe hacer batch inference eficiente. Sin paginación, cada secuencia reserva contiguo y el batch se limita. |
| **Alternativa sin GPU** | Si no tenés GPU, `llama.cpp` con paginación CPU o `candle` (Rust) con KV cache paginado son análogos. El principio es el mismo: no reserves contiguo. |

```rust
// desktop-app/src/infrastructure/llm/paged_cache.rs — idea conceptual en Rust
// Si implementás SLM local con candle/mistral.rs
struct PagedKVCache {
    block_size: usize,                      // ej: 16 tokens por bloque
    blocks: HashMap<BlockId, Tensor>,       // bloque físico en GPU/CPU
    page_table: HashMap<SeqId, Vec<BlockId>>, // seq → bloques físicos
    free_blocks: Vec<BlockId>,              // pool de bloques libres
}

impl PagedKVCache {
    fn alloc_for_tokens(&mut self, seq: SeqId, n_tokens: usize) {
        let n_blocks = (n_tokens + self.block_size - 1) / self.block_size;
        for _ in 0..n_blocks {
            let bid = self.free_blocks.pop().expect("OOM: sin bloques libres");
            self.page_table.entry(seq).or_default().push(bid);
        }
    }
    // CoW: clonar seq comparte bloques hasta que se escriba
    fn fork_seq(&mut self, src: SeqId, dst: SeqId) {
        self.page_table.insert(dst, self.page_table[&src].clone()); // comparte, CoW
    }
}
```

> **Regla de oro:** si tu LLM local se queda sin VRAM con 2-3 requests concurrentes del harness, no es que necesitás más VRAM — necesitás paginación. vLLM demuestra que el OS ya resolvió este problema hace 50 años.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **KV cache contiguo por request** | Fragmenta VRAM, limita batch, desperdicia 30-60% de memoria | Paginación en bloques fijos + page table |
| **Duplicar system prompt por request** | N requests × 2k tokens prefijo = N× VRAM desperdiciada | CoW: compartir bloques de prefijo entre secuencias |
| **Padding a max length para batching** | Tokens de padding ocupan VRAM sin aportar nada | Scheduling con bloques bajo demanda, sin padding |
| **Servir SLM sin batching** | 1 request a la vez → throughput bajísimo | vLLM batch continuo con paginación |
| **Asumir que más VRAM resuelve todo** | Sin paginación, más VRAM solo retrasa la fragmentación | Paginación primero, luego escalar VRAM |

**Limitaciones del paper:**

- **Requiere kernel custom:** PagedAttention no es solo "usar bloques" — necesita kernel CUDA que haga attention sobre bloques no contiguos vía page table. Portar a Rust/candle requiere implementar ese kernel.
- **Beneficio depende del workload:** 24× solo con sharing (mismo prefijo). Para requests heterogéneos sin prefijo común, el speedup es 2-4× — sigue siendo grande, pero no 24×.
- **No cubre CPU inference:** el paper evalúa A100 GPU; para tu desktop sin GPU dedicada, el análogo es `llama.cpp` con paginación CPU, no vLLM directo.
- **Complejidad operativa:** vLLM es un server Python con dependencias CUDA; integrarlo en tu `desktop-app` Rust añade complejidad de deployment (proceso Python + Rust).

## 6. Ejercicios prácticos

### Ejercicio 1 — Medir fragmentación sin paginación (30 min)
1. Serví un SLM local (ej: Phi-3 3.8B con `llama.cpp` o `ollama`) y mandá 5 requests concurrentes con system prompt largo (2k tokens).
2. Monitoreá VRAM/RAM con `nvidia-smi` o `htop`. Observá fragmentación y límite de batch.
3. Compará con `vllm serve` mismo modelo y mismo batch — medí throughput y VRAM.

### Ejercicio 2 — Prefijo compartido (20 min)
1. Armá 10 requests que compartan el mismo system prompt (tus 25 tools) con distintos user prompts.
2. Medí VRAM con y sin sharing (vLLM CoW vs HF duplicado). Calculá ahorro: `1 - (VRAM_paged / VRAM_contiguo)`.
3. Extrapolá a tu harness real: ¿cuánto ahorrás con N=5 agentes concurrentes?

### Ejercicio 3 — Batch de tool calls paralelos (30 min)
1. Generá 3 `tool_calls` en paralelo desde tu harness (ej: `fs.list` + `git.status` + `screenshots.capture`).
2. Medí latencia p50/p95 del LLM con batching vs secuencial. Verificá que PagedAttention permita batch sin fragmentar.

## 7. Referencias y checklist

- **Paper:** [vLLM PagedAttention — arXiv:2309.06180](https://arxiv.org/abs/2309.06180) · [GitHub vllm-project/vllm](https://github.com/vllm-project/vllm) · [Docs vllm.ai](https://docs.vllm.ai/)
- **Relacionados:** `02-gorilla-bfcl-2023.md` (parallel tool calls que exigen batching), `06-dspy-2023.md` (compilar harness que usa SLM local)

### Checklist de lectura

- [ ] Leí abstract + §3 (PagedAttention + CoW) del paper original
- [ ] Entiendo por qué paginación + CoW dan 2-4× sin sharing y hasta 24× con sharing
- [ ] Probé `vllm serve` o `llama.cpp` con batch concurrente y medí VRAM/throughput
- [ ] Calculé ahorro de VRAM por prefijo compartido en mi harness (system prompt 2k tokens × N requests)
- [ ] Anoté 1 idea para SLM local en `desktop-app` o decisión de no usar SLM local
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
