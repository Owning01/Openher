---
name: code-review
description: Motor integral de auditoría de código, caza de bugs ocultos, análisis de flujos reales de usuario, desincronización full-stack, resiliencia Chaos Monkey (alta latencia, EPERM), invariantes de Zero Data Loss, observabilidad de logs, auto-fix supervisado y generación de tests de regresión.
---

# 🛡️ Code Review, Flow Analysis & Deep Bug Hunter (SOTA 2026)

> **Misión**: Garantizar que el sistema no solo compile y pase tests aislados, sino que sus flujos de usuario de extremo a extremo funcionen en la vida real, protegiendo contra pantallas congeladas, pérdida de datos del usuario, fallos de red o disco y desincronizaciones entre Rust y TypeScript.

---

## 🔬 LAS 11 DIMENSIONES DE AUDITORÍA INTEGRAL

| Dimensión | Enfoque de Detección en Producción | Impacto Real |
| :--- | :--- | :--- |
| **🌊 1. Flujos Rotos & Máquinas de Estado** | `isLoading = true` que no se apaga en `catch`/`finally`, modales sin salida, promesas que nunca resuelven. | Pantallas congeladas y spinners infinitos. |
| **🌪️ 2. Caos UX & Concurrencia Humana** | Botones de acción sin deshabilitar durante peticiones en vuelo, respuestas desfasadas por lag de red. | Peticiones duplicadas y datos pisados. |
| **🪤 3. Desincronización Full-Stack** | Desfase `camelCase` (TS) vs `snake_case` (Rust serde), enums y tipos no sincronizados. | Deserializaciones en blanco (`undefined`). |
| **🔴 4. Mutaciones Directas de Estado** | Modificación in-place de arrays/objetos en Zustand o React (`state.push()`). | La UI no se actualiza (desfase visual). |
| **⚡ 5. Fugas de Memoria & Deadlocks** | Listeners, intervalos y sockets sin cleanup en `useEffect`, I/O síncrono en Tokio. | Consumo creciente de RAM y cuelgues. |
| **🔒 6. Seguridad & Inyección** | Interpolación de strings en shell sin codificación Base64, path traversal. | Ejecución arbitraria de comandos. |
| **📐 7. Ponytail / YAGNI** | Código duplicado que ya existe en otro helper, sobreingeniería. | Código inflado y difícil de mantener. |
| **❓ 8. Dependencias Fantasma** | Métodos o paquetes no presentes en la versión instalada real. | Errores en tiempo de ejecución. |
| **🐒 9. Chaos Monkey & Entorno Hostil** | Peticiones sin timeout ni `AbortSignal`, fallos `EPERM` de Windows o desconexiones sin reintento. | Cuelgues ante lag o fallos de disco. |
| **🛡️ 10. Invariantes de Zero Data Loss** | Formularios sin auto-guardado local de borradores, mutaciones SQLite sin transacción atómica. | Pérdida de trabajo del usuario. |
| **🪞 11. Observabilidad & Higiene de Logs** | Errores capturados sin contexto (IDs, URLs), prints de depuración olvidados en el código. | Dificultad para diagnosticar fallos. |

---

## ⚡ FLUJO DE EJECUCIÓN

1. **Mapeo por Capas de Criticidad**:
   - Capa 1: Backend Rust (`desktop-app/src/`), canales Tokio, servidor HTTP y sockets.
   - Capa 2: Stores de Zustand (`web/src/store/`), hooks de sincronización y servicios.
   - Capa 3: Contratos e Interfaces (`web/src/types/`), esquemas SQLite.
   - Capa 4: Vistas y Componentes de UI (`web/src/components/`).
2. **Auditoría de Flujo, Caos y Pérdida de Datos**:
   - Simular qué ocurre si la red falla a mitad de camino, si el usuario cierra la ventana o si el backend tarda 5s.
3. **Generación de Scorecard de Salud & Diffs**:
   - Entrega de puntuación de robustez, test de regresión recomendado y parches unificados listos para aplicar.
4. **Persistencia**:
   - Copia completa en `.code-review/bugs-and-flows-<timestamp>.md`.
