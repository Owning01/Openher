---
name: flex-height-chain
description: Diagnosticar paneles flex que crecen sin limite (composer/footer fuera de vista, scroll interno muerto) verificando la cadena completa de alturas
---

# Flex Height Chain (desktop panels)

Sintoma: `scrollHeight >> clientHeight`, composer/footer debajo del fold (cortado por `overflow:hidden`), scroll interno sin efecto. Caso real: chat desktop sin composer ni scroll (`DesktopPanelRenderer.tsx:490`, `DesktopGrid.tsx:451`, `SessionChatPanel.tsx`, `layout.css` `.session-panel`).

## Regla
Cada nivel entre el ancestro con altura definida (grid `minmax(0,1fr)`, `100dvh`) y el scroll container debe tener altura definida: `flex:1 + min-height:0` DENTRO de un flex-column, o `height:100%`. Un `flex:1` que NO es flex-container da a sus hijos `height:auto`; `height:100%` contra `auto` = `auto` (el fix en la hoja sola no resuelve).

## Checklist
1. Medir `clientHeight` vs `scrollHeight` por nivel hasta hallar el salto.
2. Todo wrapper intermedio: `display:flex; flex-direction:column; overflow:hidden`.
3. Hoja scrolleable: `flex:1; min-height:0; overflow-y:auto`.
