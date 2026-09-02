# Retrospectiva — sprint-2026-w34

## ✅ Bien (repetir)

- El bug del composer se diagnosticó con causa raíz real (eco stale + re-render de App
  por keystroke) y no con parche sintomático; quedó testeado por la suite existente.
- Purga de assets acumulados (1.265 chunks viejos) → el repo y el empaquetado quedan limpios.
- Suite de 1065 tests detectó de inmediato los 3 tests que codificaban comportamiento roto.

## 🔧 Mejorar (duele pero es real)

- Los assets con hash se acumulan en cada build porque `build-desktop.ps1` copia con
  `-Force` sin limpiar → pasó desapercibido durante semanas.
- El fix del composer llegó POR QUEJA del usuario, no por QA proactivo: faltaba prueba
  en dispositivo como parte de la DoD para cambios de input.
- PB-005/PB-006 (QuickChat) comprometidos pero no tocados: sobre-compromiso en el
  primer sprint formal.

## 🧪 Probar (experimento w35)

- Agregar al flujo de build un `Remove-Item assets/*` previo (o hacerlo script) para que
  la purga sea automática, no manual.

## Acciones para w35

| Acción | Cómo se verifica |
|---|---|
| Purga automática de assets en `build-desktop.ps1` | El script corre 2 veces seguidas y no duplica hashes |
| QA en dispositivo explícito en DoD para cambios de input/composer | PB-001 cerrado solo tras probar en APK real |

## Datos del sprint

- Velocity: comprometido 9 pts / done 5 pts (PB-001 código done, QA pendiente)
- Impedimentos arrastrados: ninguno
- ¿Objetivo cumplido? **parcial** — el input quedó arreglado a nivel código y validado
  con tests/build; falta la prueba física en dispositivo (queda como criterio de cierre
  de PB-001 en w35).
