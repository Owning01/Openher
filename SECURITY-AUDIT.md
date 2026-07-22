# 🔒 OpenCode Mobile — Análisis de Ciberseguridad

> **Fecha**: Julio 2026 · **Alcance**: app completa (frontend + Android + CI/CD)
> **Metodología**: Revisión manual de código + `pnpm audit`

---

## Resumen

| Severidad | Cantidad |
|-----------|----------|
| 🔴 CRÍTICA | 0 |
| 🟠 ALTA | 2 |
| 🟡 MEDIA | 4 |
| 🔵 BAJA | 4 |
| ℹ️ INFO | 3 |

---

## 🟠 ALTA

### A-1: Credenciales del servidor en texto plano en localStorage

**Archivo**: `src/hooks/useConfig.ts:132`
```ts
localStorage.setItem(STORAGE_KEYS.SERVER, JSON.stringify(draftConfig))
// draftConfig incluye { host, port, username, password }
```

**Riesgo**: La contraseña del servidor OpenCode se guarda sin cifrar en `localStorage` (`opencode.remote.server`). También se persiste a `opencode-mobile-config.json` en `Documents/` via Capacitor Filesystem. Un dispositivo rooted, un backup de ADB, o cualquier script malicioso en el WebView puede extraer la credencial.

**Mitigación sugerida**:
- Cifrar la contraseña con `crypto.subtle.encrypt()` usando una clave derivada de un identificador del dispositivo
- O usar `@capacitor/storage` con cifrado nativo
- O no persistir la contraseña y pedirla en cada sesión (UX trade-off)

### A-2: Sin Content Security Policy (CSP)

**Archivo**: `web/index.html`

**Riesgo**: No hay header CSP ni meta tag. Si un atacante lograra inyectar HTML/JS (via Markdown o un mensaje malicioso del servidor), no hay ninguna restricción de recursos que lo mitigue.

**Mitigación sugerida**:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' http://* https://*;
  img-src 'self' data: blob: http://* https://*;
  style-src 'self' 'unsafe-inline';
  script-src 'self';
">
```

---

## 🟡 MEDIA

### M-1: Tráfico HTTP plano (androidScheme: "http")

**Archivo**: `web/capacitor.config.ts:8-9`
```ts
androidScheme: "http",
cleartext: true
```

**Riesgo**: Todo el tráfico entre la app y el servidor OpenCode via HTTP sin TLS. En una red WiFi compartida, un atacante puede hacer MITM y leer/modificar prompts, respuestas, contraseñas y comandos shell.

**Contexto**: El servidor OpenCode típicamente corre en LAN. El riesgo es real en espacios públicos (cafeterías, aeropuertos, universidades).

**Mitigación sugerida**:
- Agregar soporte HTTPS opcional (configurable por usuario)
- Recomendar Tailscale/WireGuard como capa de cifrado (ya documentado en README)
- Agregar un banner de advertencia cuando se usa HTTP en redes que no son localhost

### M-2: Deep link expone credenciales en URL

**Archivo**: `src/hooks/useDeepLink.ts:15`
```ts
const password = parsed.searchParams.get("password")
```

**Riesgo**: El esquema `opencode://connect?host=...&password=...` pasa la contraseña como query param. Las URLs pueden quedar en:
- Logs del sistema Android (`logcat`)
- Historial de apps que manejaron el intent
- Capturadas por otras apps con filtro de intents

**Mitigación sugerida**:
- Usar un token de un solo uso intercambiado por la contraseña
- O documentar que el deep link solo debe usarse en entornos controlados (red local)
- O requerir que el deep link solo auto-complete host/port y pedir password manualmente

### M-3: IndexedDB sin cifrado

**Archivo**: `src/hooks/useOfflineCache.ts`, `useOfflineQueue.ts`

**Riesgo**: Las sesiones, mensajes (incluyendo prompts con posible datos sensibles) y acciones pendientes se almacenan en IndexedDB en texto plano. El store `pendingActions` guarda prompts/comandos/shell que el usuario envió mientras estaba offline.

**Mitigación sugerida**:
- Cifrar el contenido sensible antes de escribir a IndexedDB
- Limpiar el store de acciones pendientes luego de un tiempo razonable
- Documentar en la UI que el modo offline almacena datos localmente

### M-4: Sin `network_security_config.xml`

**Riesgo**: No hay una política de seguridad de red que restrinja a qué dominios puede conectarse la app. Cualquier host:puerto es válido, facilitando ataques de phishing si un atacante convence al usuario de configurar un servidor malicioso.

**Mitigación sugerida**:
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

---

## 🔵 BAJA

### B-1: `allowBackup="true"` en AndroidManifest

**Archivo**: `web/android/app/src/main/AndroidManifest.xml:4`
```xml
android:allowBackup="true"
```

**Riesgo**: Los datos de la app (incluyendo localStorage con contraseñas) pueden ser respaldados via `adb backup`. Un atacante con acceso físico al dispositivo podría restaurar el backup en otro equipo.

**Mitigación**: Cambiar a `android:allowBackup="false"` o `android:fullBackupContent="false"`. Si se necesita backup, excluir el archivo de configuración.

### B-2: Catch silencioso en operaciones críticas

**Archivos múltiples**: `useOfflineCache.ts`, `useOfflineQueue.ts`, `api.ts`

```ts
catch { /* silently fail */ }
catch { return [] }
catch { return null }
```

**Riesgo**: Los errores se tragan silenciosamente. Si falla la escritura a IndexedDB (por ejemplo, por cuota excedida o corrupción), el usuario nunca lo sabe. Si falla el decode del keystore, el build release produce APK sin firmar sin alerta.

**Mitigación**: Al menos `console.error()` en los catch, y notificar al usuario cuando una operación crítica falla (como cache offline o envío de acción pendiente).

### B-3: Sin rate limiting ni timeout de sesión

**Riesgo**: La app no cierra la sesión ni pide reconfirmación de la contraseña después de un tiempo de inactividad. Si un tercero toma el teléfono desbloqueado, tiene acceso completo al servidor OpenCode.

**Mitigación**: Agregar timeout de sesión configurable y/o requerir autenticación biométrica para acceder.

### B-4: No hay verificación de integridad del servidor

**Riesgo**: No se verifica que el servidor OpenCode sea legítimo (no hay certificado TLS, no hay pinning, no hay challenge-response). Cualquier servicio que responda en el host:puerto configurado es aceptado como servidor.

**Mitigación**: Agregar un handshake criptográfico opcional o al menos mostrar el fingerprint del servidor.

---

## ℹ️ INFO

### I-1: react-markdown sanitiza HTML automáticamente

`react-markdown` por defecto no renderiza HTML arbitrario (a menos que se agregue `rehype-raw`). No se detecta `dangerouslySetInnerHTML` ni `eval` en la codebase. ✅

### I-2: Dependencias sin vulnerabilidades conocidas

`pnpm audit --audit-level=high` reporta 0 vulnerabilidades. ✅

### I-3: Sin secrets en el código fuente

No se encontraron tokens, API keys, ni contraseñas hardcodeadas en el código. ✅

---

## 📊 Matriz de riesgo

```
CRITICAL ██ 0
HIGH     ████████████████████ 2  ← Arreglar antes de release
MEDIUM   ████████████████████████████████████████ 4  ← Arreglar post-release
LOW      ████████████████████████████████████████ 4  ← Backlog
INFO     ████████████████████████████████████████ 3
```

---

## 🎯 Próximos pasos recomendados

| Prioridad | Acción | Esfuerzo |
|-----------|--------|----------|
| 🔴 | Cifrar contraseña en localStorage (A-1) | 2-4h |
| 🔴 | Agregar CSP en index.html (A-2) | 30min |
| 🟡 | Soporte HTTPS opcional (M-1) | 4-8h |
| 🟡 | Deep link sin password en URL (M-2) | 1-2h |
| 🟡 | Cifrar IndexedDB (M-3) | 3-6h |
| 🟡 | network_security_config.xml (M-4) | 30min |
| 🔵 | allowBackup="false" (B-1) | 5min |
| 🔵 | Logging en catch (B-2) | 1h |
