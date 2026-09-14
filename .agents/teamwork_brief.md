# Teamwork Brief — OpenHer Móvil: Archivos + Aprendizaje

> Fase 1 (Sentinel). Estado: **pendiente de aprobación del usuario** (1 confirmación).

## 1. Objetivo & Audiencia
Producción real (APK Android + desktop). El usuario usa la app desde el celular vía
Tailscale contra el server del PC. Objetivo:

- **A. Archivos (PC Files) en el celular**: poder ver los archivos del PC, **entrar y
  navegar carpetas** con el dedo, **descargar cualquier archivo**, y **leer** archivos
  de texto en un **visor in-app cómodo para pantalla chica** (hoy los archivos terminan
  abriéndose en VSCode del PC o muestran errores crudos).
- **B. Aprendizaje en el celular**: el CSS está roto (diagrama de ruta y tarjetas se
  desbordan horizontalmente; layout no responsive).
- **C. Barrido móvil**: revisar el resto de las vistas principales por desbordes/scroll
  roto y corregir lo crítico.

## 2. Bloques de Requerimientos
### A. PC Files (móvil)
1. **Navegación táctil**: tap en carpeta = entrar; botón subir/atrás + breadcrumbs
   táctiles; el despliegue inline (árbol) queda como acción secundaria (long-press o
   chevron). Estado de carpeta se conserva al volver del visor.
2. **Visor móvil**: overlay/pantalla completa con tipografía legible (≥13px) y control
   de tamaño (A-/A+), números de línea, wrap horizontal o scroll-x contenido, cierre
   claro y navegación entre archivos (abrir otro sin perder la carpeta).
3. **Lectura de archivos**: hasta 64KB vía `shell.fs.read` con aviso de truncado;
   binarios/no legibles → mensaje explícito (nunca `os error 32` crudo) + ofrecer
   descarga.
4. **Descargar cualquier archivo**: en APK guardar/share con feedback claro (spinner +
   toast con nombre y destino); en web, descarga directa. Archivos bloqueados por el SO
   → error claro y accionable.
5. **"Abrir con…"**: se mantiene como opción avanzada (abre en la PC), pero deja de ser
   el camino principal en móvil.

### B. Aprendizaje (móvil ≤430px)
1. Cero overflow horizontal de página; diagrama de ruta reacomodado (1 columna /
   scroll-x contenido con señal visual) y tarjetas sin desbordar su contenedor.
2. Lección legible: tipografía, márgenes y diagramas (SVG) al 100% del ancho.
3. Navegación sidebar→lección usable en táctil.

### C. Barrido móvil
Vistas: Sesiones, Chat, Ajustes, Aprendizaje, Archivos, Chat Rápido. Detectar y
arreglar desbordes/clipping/scroll roto; no rediseños.

## 3. Verificación Independiente
- `pnpm exec tsc -b` + suite `pnpm test` (Vitest) en verde.
- Script de auditoría en viewport 390×844 contra el bundle servido en `:4848`:
  detectar `scrollWidth > clientWidth + 2`, elementos clipados y scroll muerto.
- Prueba funcional móvil (Playwright, 390×844):
  - tap carpeta → breadcrumb cambia de nivel; subir → vuelve;
  - tap archivo de texto → visor abre, cambia tamaño, cierra;
  - descarga → feedback y archivo generado (web path);
  - archivo bloqueado → mensaje claro, sin excepción cruda.
- Aprendizaje: 0 overflowers horizontales; diagrama usable.
- Cierre: APK `1.0.7` compilada, hash verificado, link de descarga directa.

## 4. Criterios de Aceptación (DoD)
1. En 390×844: PC Files permite entrar/salir de carpetas y abrir/leer/cerrar archivos
   de texto; descarga con feedback; errores claros en binarios/bloqueados.
2. Aprendizaje: 0 elementos con overflow horizontal no intencional; ruta y lecciones
   legibles.
3. `tsc` + tests en verde (sin modificar tests para "hacerlos pasar").
4. Desbordes críticos del barrido corregidos o documentados como no críticos.
5. APK 1.0.7 publicada con link directo y verificación de hash.

## 5. Directorio & Integridad
- Trabajo **in-place** en el repo actual (el APK necesita los cambios en `web/`).
- Artefactos de coordinación en `.agents/` (`teamwork_plan.md`, `teamwork_progress.md`).
- **Modo de integridad: `development`** (default): sin fabricaciones ni placeholders;
  salidas de comandos reales.
- Propiedad exclusiva de archivos por Worker; 2 Workers nunca tocan el mismo archivo a
  la vez.
