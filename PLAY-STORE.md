# Subir OpenCode Mobile a Google Play Store

Guía completa para publicar la app en Play Store. **No contiene secretos** — las
credenciales de firma viven en `web/android/app/keystore/release-credentials.txt`
(ignorado por git) y en tu gestor de contraseñas.

---

## 0. Antes de empezar (una sola vez)

### 0.1 Keystore de firma (YA CREADO)

| Dato | Valor |
|---|---|
| Archivo | `web/android/app/keystore/release.keystore` (gitignored) |
| Alias | `opencode-mobile` |
| Algoritmo | RSA 4096, SHA384withRSA |
| Validez | hasta **2053-12-21** |
| Passwords | en `web/android/app/keystore/release-credentials.txt` + tu gestor |

> ⚠️ **CRÍTICO**: el keystore y sus passwords permiten firmar actualizaciones.
> Perderlos = nunca más poder publicar. La clave de firma de Play es **irrevocable**
> (no se puede cambiar el keystore de una app ya publicada).

### 0.2 Cuenta de desarrollador

- Ya tenés la cuenta ($25 única vez en https://play.google.com/console).
- Completar el perfil del desarrollador (nombre, correo, web) si no está.

---

## 1. Generar el App Bundle (.aab) firmado

El `.aab` ya está generado: `OpenCodeMobile-release.aab` (raíz del repo, gitignored).
Para regenerarlo después de cada cambio de código:

```bat
cd web\android
set ANDROID_KEYSTORE_PATH=keystore/release.keystore
set ANDROID_KEYSTORE_PASSWORD=<del archivo de credenciales>
set ANDROID_KEY_ALIAS=opencode-mobile
set ANDROID_KEY_PASSWORD=<= keystore password, PKCS12>
gradlew.bat bundleRelease
```

Resultado: `web/android/app/build/outputs/bundle/release/app-release.aab`
(9.3 MB). Play genera los APKs por densidad/arquitectura desde el bundle.

> Antes de publicar: **subir el nuevo `web/dist` al APK** (`npm run build` +
> `python scripts/copy-dist.py` — lo hace `deploy-quick.ps1`).

---

## 2. Google Play Console — crear la app

1. https://play.google.com/console → **Crear app**
2. Nombre: **OpenCode Mobile** · Idioma: **Español (Latinoamérica)** · App: app o juego → **App**
3. **Seguimiento del lanzamiento → Lanzamiento de prueba → Alfa/Beta**
   - Subir `OpenCodeMobile-release.aab`
   - Versión: `1.0.0` (versionCode `10000`)

## 3. Checklist obligatorio (pestaña "Configuración del panel")

| Sección | Qué completar |
|---|---|
| **Ficha de la tienda** | Título (≤30): "OpenCode Mobile"; descripción corta (≤80) y larga (≤4000); categoría **Productividad**; web https://github.com/Owning01/Opencode-Mobile; email de contacto |
| **Gráficos de la tienda** | Icono 512×512 PNG (usar `web/public/img/opencode-logo-dark.jpg` como base, sin transparencia al 100% y sin esquinas redondeadas); gráfica destacada 1024×500; capturas de pantalla: **mínimo 2** teléfono (recomendado 4-8: home, chat, modelo con nivel de pensamiento, config); recomendado tablet 3 |
| **Clasificación del contenido** | Cuestionario: la app es un cliente de chat de IA para desarrollo → categoría "No hay contenido interactivo/educativo", sin violencia ni contenido adulto. Pegar la URL del repo como referencia |
| **Público objetivo** | 18+ (chat con IA) |
| **Datos y privacidad** | Aunque no recolectes datos, completar: no se comparten datos. Nota: los datos (host/password del server) los ingresa el usuario y se guardan SOLO en el dispositivo (localStorage/IndexedDB) |
| **Política de seguridad** | Sección App access → sí, pero nada. SDKs → ninguno de terceros. Datos → guardados localmente |
| **Puntuación de contenido** | Declarar "Mature audiences" según el cuestionario si aplica (chat con IA generativa puede pedir clasificación "G" o restricción de edad) |

## 4. Reglas del programa de Play (importantes para esta app)

- **Interfaz mínima**: la app se conecta a un server externo — la ficha debe explicar
  que requiere un server OpenCode (URL en la descripción larga).
- **Chat con IA generativa**: desde 2025 Google exige declarar IA generativa en el
  formulario "Declaración de IA" (Play Console → Configuración del panel → IA generativa).
  Indicar: texto generado por modelos de terceros (OpenAI/Anthropic/Google) vía server propio.
- **Permisos**: la app no usa permisos sensibles (solo micrófono opcional para voz —
  declarar en la ficha si se usa).
- **Deep links**: si activás `opencode://`, declarar el prefijo en Play Console.

## 5. Publicar

1. Lanzamiento de prueba → **Alfa** → subir el AAB → revisar cambios → "Guardar y publicar"
2. Probar en el teléfono con la lista de testers (hasta 100 correos).
3. Cuando esté estable: **Promover lanzamiento de prueba → producción**.

## 6. Actualizaciones futuras

```bat
cd web
npm run build
python scripts\copy-dist.py
cd android
set ANDROID_KEYSTORE_*   (mismo keystore SIEMPRE)
gradlew.bat bundleRelease
```
- Subir el nuevo `.aab` en la pestaña Producción → **Editar versión**
- **versionCode y versionName**: incrementar en `web/android/app/build.gradle`
  (`versionCode 10001, versionName "1.0.1"`, etc.). El código debe aumentar con cada subida.

---

## Archivos sensibles (NUNCA en git — ya ignorados)

```
web/android/app/keystore/           (keystore + credenciales)
OpenCodeMobile-release.aab          (artefacto firmado)
*.keystore, *.jks, *.p12
key.properties / keystore.properties
*play-service-account*.json / service-account*.json
fastlane/  play/
```
