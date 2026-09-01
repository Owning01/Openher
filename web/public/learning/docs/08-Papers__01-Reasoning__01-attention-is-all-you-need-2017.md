# Attention Is All You Need — El Transformer (Vaswani et al., 2017)

> **Autores:** Vaswani et al. / Google
> **Año:** 2017 · **Prioridad:** Imprescindible · **Lectura:** ~25 min
> **Link verificado:** [https://arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** Attention Is All You Need (Vaswani, Shazeer, Parmar et al., NeurIPS 2017) — Google Brain / Google Research.
> **Link:** https://arxiv.org/abs/1706.03762
> **Relevancia para opencode-remote-android:** explica *por qué* existe tu SSE streaming, tu context window y tu coste cuadrático.
> **Prioridad:** Imprescindible (fundacional) · **Tiempo:** 25 min

## 1. Resumen ejecutivo
El Transformer elimina recurrencia y convolución: todo es **atención**. Con 6 capas encoder+decoder, 8 heads, 512 dim, logra SOTA en traducción WMT con 3.5 días en 8 GPUs. Introduce *self-attention* escalada por √dₖ, *multi-head*, *positional encoding* sinusoidal y *residual + layer norm*.

**Tesis:** la atención es suficiente para modelar dependencias largas sin RNN. El paralelismo desbloquea escalar datos y cómputo.

## 2. Ideas clave
- **Scaled dot-product attention:** \(Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V\) — √dₖ evita saturar softmax.
- **Multi-head:** 8 proyecciones distintas → el modelo mira sintaxis, semántica y posición a la vez. Equivale a 8 filtros.
- **Positional encoding:** \(PE(pos,2i)=sin(pos/10000^{2i/d})\), \(cos\) para impar — permite extrapolar a secuencias más largas que el entrenamiento.
- **Por qué importa el coste:** atención es O(n²·d). Con n=128k tokens, son ~16B operaciones por head. De ahí tu \(polling 3.5s\) y límites \(loadSelected 20/100\).
- **Residual + Norm:** permite entrenar 6-12 capas sin desvanecimiento de gradiente.

## 3. Qué demostró
- BLEU 28.4 en WMT En-De (supera ensemble previo 26.30 con 3.5 días vs semanas).
- 41.0 BLEU En-Fr con big model (213M params).
- Ablations: sin multi-head −0.9 BLEU; sin positional − casi no converge.

## 4. Cómo aplica a opencode-remote-android
- **Entender por qué compactas:** tu \(miser/ultra\) no es UX, es física: cada token extra paga O(n²). Mover info crítica al inicio/final (Lost-in-the-Middle) mitiga.
- **SSE + streaming:** el decoder genera token-a-token con *masked self-attention* — tu \(message.part.delta\) es literalmente ese flujo.
- **IndexedDB v2 = memoria externa:** como no puedes meter 500 msgs en contexto, paginas (MemGPT). El Transformer explica por qué no hay alternativa barata.
- **Decisión de arquitectura:** si usas Phi-3 local (3.8B) vs GPT-4 remoto, el coste n² justifica routing local para \(/help\).

## 5. Anti-patterns / Limitaciones
- No inventar contexto infinito vendor: aunque prometan 1M tokens, el coste y \(Lost-in-Middle\) lo mata.
- Positional encoding original falla >2k sin RoPE/ALiBi — no extrapoles.
- Atención pura sin sparse/mamba = latencia SSE alta si mandas historial completo.

## 6. Ejercicios prácticos (en tu repo)
1. Loguea tokens enviados en \(shared/api/client.ts\) y estima FLOPs: \(tokens² × layers\). ¿Cuándo justifica truncar?
2. Cambia \(loadSelected\) para medir latencia vs n tokens (20, 50, 100, 200). Grafícalo.
3. Implementa un \(reranker BM25\) que ponga top-3 relevante al inicio/final y mide si baja alucinación.

## 7. Referencias
- Paper: https://arxiv.org/abs/1706.03762 + https://arxiv.org/pdf/1706.03762
- Illustrated Transformer (Jay Alammar) — visual obligatorio.
- Relacionado: CoT (2201.11903), ReAct (2210.03629), Lost-in-Middle (2307.03172).

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
