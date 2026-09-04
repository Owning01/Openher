---
name: mi-entorno
description: Perfil de desarrollo personal de Octavio. Use SIEMPRE al iniciar cualquier proyecto o tarea para configurar el entorno, gestores de paquetes, estilo de documentación y convenciones de commit. Dispara en toda sesión nueva o cuando el usuario diga "usa mi config", "entorno", "perfil", "setup".
---

# Mi Entorno — Perfil de Desarrollo

Aplica estas instrucciones **siempre** al iniciar cualquier proyecto, tarea o interacción.

---

## Perfil del usuario

| Campo | Valor |
|---|---|
| Nombre | Octavio |
| OS local | Windows 11 |
| Shell local | PowerShell (7+) |
| Disco de trabajo | **G:** (NO C:) — todo el SDK, descargas, proyectos, Python, Android, herramientas van en G:\ |
| VPS | Linux (bash) — `ssh -p5536 root@149.50.148.236` |
| Editor | Antigravity (fork de VS Code por Google) |
| Rol | Backend-first, full stack |
| APIs | REST (siempre REST, no GraphQL ni gRPC a menos que se pida explícitamente) |
| DB principal | PostgreSQL |
| Estilo código | DRY, simple, sin líneas innecesarias |

---

## Stack y lenguajes

Orden de preferencia — backend siempre primero:

1. **Go** — backend principal
2. **C#** — backend
3. **Rust** — sistemas/rendimiento
4. **TypeScript** — frontend/scripts
5. **Flutter/Dart** — mobile

---

## Gestores de paquete (usar SIEMPRE estos)

| Ecosistema | Gestor | Comandos clave |
|---|---|---|
| Go | `go mod` | `go mod init`, `go mod tidy`, `go get pkg@latest` |
| Node/TypeScript | **pnpm** (NO npm, NO yarn) | `pnpm add pkg`, `pnpm remove pkg`, `pnpm dlx` |
| Rust | `cargo` | `cargo add pkg`, `cargo rm pkg` |
| C# | `dotnet` / NuGet | `dotnet add pkg PkgName`, `dotnet remove pkg` |
| Flutter/Dart | `dart pub` / `flutter pub` | `dart pub add pkg`, `flutter pub add pkg` |
| Python (si aplica) | `uv` | `uv add pkg`, `uv sync` |

Regla de oro: **Nunca uses npm o yarn. Siempre pnpm para JS/TS.**

---

## Firebase

Usas Firebase con frecuencia. Consideraciones:

| Servicio Firebase | SDK recomendado | Lenguaje |
|---|---|---|
| Firestore | `firebase/firestore` (TS), `cloud.google.com/go/firestore` (Go) | TS, Go |
| Auth | `firebase/auth` (TS), `firebase.google.com/go/auth` (Go) | TS, Go |
| FCM (notificaciones) | `firebase/messaging` (TS) | TS |
| Functions | `firebase-functions` (TS) | TS |
| Storage | `firebase/storage` (TS) | TS |

- Para Firebase Admin en Go: `firebase.google.com/go/v4`
- Para Firebase Admin en Node/TS: `firebase-admin`
- **Nunca exponer** `apiKey`, `projectId`, o cualquier credencial de Firebase en frontend sin restringir por reglas de seguridad
- Las reglas de Firestore/Storage deben documentarse en `docs/`

---

## Antes de usar una dependencia o API

1. Verificar la **última versión estable** disponible:
   - `go list -m -versions pkg` o `go get pkg@latest`
   - `pnpm add pkg@latest` (revisar versión primero)
   - `cargo search pkg` / crates.io
   - NuGet.org / `dotnet list package --outdated`
   - `pub.dev` / `dart pub outdated`
2. NO usar versiones antiguas a menos que haya una razón explícita y documentada.
3. Preferir dependencias oficiales/mantenidas sobre forks no oficiales.
4. Si una API requiere API key, leer la doc oficial y extraerla de variables de entorno, nunca hardcodear.

---

## Documentación — estilo obligatorio

Cada proyecto debe tener un archivo `docs/` o `README.md` que documente el paso a paso. El estilo es **tutorial / guía paso a paso**:

### Estructura requerida

```
📁 docs/
  ├── 01-setup.md          — Instalación, prerequisitos, configuración inicial
  ├── 02-arquitectura.md   — Diagramas ASCII de conexiones entre funciones/módulos
  ├── 03-api.md            — Endpoints, request/response, autenticación
  ├── 04-despliegue.md     — Deploy a VPS, Docker, CI/CD
  └── dependencias.md      — Tabla de dependencias con versión y propósito
```

### Formato

- **Tablas** para dependencias, endpoints, configuraciones
- **Diagramas ASCII** para flujos de conexión entre funciones, servicios y módulos
- **Texto explicativo paso a paso** — no asumir conocimiento previo
- Ejemplos de comando reales (no placeholders)

Ejemplo de tabla de dependencias:

| Dependencia | Versión | Propósito | Enlace |
|---|---|---|---|
| `github.com/gin-gonic/gin` | v1.10.x | HTTP router | [gin-gonic/gin](https://github.com/gin-gonic/gin) |
| `github.com/jackc/pgx/v5` | v5.7.x | Driver PostgreSQL | [jackc/pgx](https://github.com/jackc/pgx) |

Ejemplo de diagrama ASCII:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Handler    │────>│   Service    │────>│  Repository  │
│  (HTTP/gin)  │     │  (negocio)   │     │    (DB)      │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                        │
       │                                  ┌─────┴──────┐
       │                                  │ PostgreSQL  │
       │                                  │  (pgx/pool) │
       │                                  └────────────┘
       v
┌──────────────┐
│  Middleware   │
│ (auth, logs)  │
└──────────────┘
```

---

## Commits — Conventional Commits por feature

- Usar formato [Conventional Commits](https://www.conventionalcommits.org/)
- Hacer commit **al completar cada feature** (no por archivo, no por tiempo)
- Estructura del mensaje:

```
<tipo>(<scope opcional>): <descripción corta>

<cuerpo opcional (explicar QUÉ y POR QUÉ, no cómo)>
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Cambios en documentación |
| `refactor` | Refactor sin cambio funcional |
| `perf` | Mejora de rendimiento |
| `test` | Agregar o corregir tests |
| `chore` | Mantenimiento, tooling, config |
| `ci` | Cambios en CI/CD |
| `style` | Formato, lint (no funcional) |

Ejemplos:
```
feat(auth): add JWT middleware with refresh token rotation

feat(api): implement user CRUD endpoints

fix(db): close connection pool on SIGTERM

docs: add connection diagram between services
```

---

## Flujo de trabajo obligatorio

1. **Antes de empezar**: si es proyecto nuevo:
   - Crear `docs/` con la estructura de documentación
   - Crear `.gitignore` adecuado al stack (Go: bin/, .exe; Node: node_modules/, .env; Flutter: build/, .dart_tool/; etc.)
   - `git init`
2. **Durante el desarrollo**: documentar paso a paso lo que se hace en los archivos de documentación correspondientes.
3. **Antes de cada commit**: verificar que no haya dependencias desactualizadas (`pnpm outdated`, `go mod tidy`, etc.).
4. **Al completar feature**: hacer commit con Conventional Commit + documentar la feature si aplica.
5. **Linting y calidad**: antes de finalizar, ejecutar las herramientas de linting/typecheck del proyecto.
6. **Seguridad**: **nunca, bajo ninguna circunstancia**, hardcodear secrets, API keys, tokens o credenciales. Todo debe ir en variables de entorno o un archivo `.env` incluido en `.gitignore`. Revisar cada archivo antes de commit para asegurar que no haya credenciales expuestas.
7. **Cuando estés atascado o no sepas algo**: busca en internet (documentación oficial, Stack Overflow, GitHub Issues, blogs técnicos). No te quedes con la duda ni asumas — verifica siempre.

---

## Buscar en internet cuando sea necesario

Si no sabes algo, no estás seguro de una sintaxis, una API cambió, o simplemente quieres confirmar:

- Buscar documentación **oficial** primero
- Stack Overflow, GitHub Issues, blogs técnicos
- Verificar versiones actuales de los paquetes
- No inventar ni asumir — verificar siempre con fuentes externas

---

## Discos y almacenamiento — NO USAR C:\

- **Nunca** instalar SDKs, herramientas, descargas o proyectos en `C:\`
- Todo va en `G:\`:
  - Python → `G:\Python\`
  - Android SDK → `G:\Android\`
  - Proyectos → `G:\proyectos\`
  - Descargas temporales → `G:\tmp\`
  - Node/npm global → configurar prefix en G:\
  - Cargo/Rust → `CARGO_HOME` en G:\
- Verificar siempre que `G:\` tenga espacio antes de instalar cosas grandes
- Si un instalador quiere poner algo en `C:\Program Files`, redirigirlo a `G:\`

---

## Recordatorios técnicos

- Windows local: rutas con `\`, PowerShell con `& "programa" arg` para ejecutables con espacios
- VPS Linux: SSH por puerto 5536, bash, systemd para servicios
- Go: preferir `database/sql` con `pgx` o `sqlx`, estructuras planas, `gofmt` siempre. Para PostgreSQL: `pgxpool` para conexiones concurrentes, migraciones con `golang-migrate/migrate`
- TypeScript: modo estricto (`strict: true`), `@types/*` como devDependencies
- Pnpm: usar `pnpm-workspace.yaml` para monorepos
- Firebase: `firebase init` para proyectos nuevos, `firebase deploy --only functions` para functions
- `.gitignore` obligatorio al iniciar cada proyecto — incluir siempre `.env`, `node_modules/`, `bin/`, `build/`, `dist/`, `*.exe`, `.dart_tool/`, `.firebase/` según stack

---

## Estilo de código — reglas sagradas

### DRY (Don't Repeat Yourself)

- Cero duplicación de lógica. Si ves código repetido, extraer a función/método.
- Los mismos patrones deben vivir en un solo lugar.
- Configuraciones, queries, validaciones reutilizables → una sola definición.

### Singleton

- Usar singleton para: conexiones a DB, clients HTTP, instancias de Firebase Admin, pools de conexiones.
- En Go: `sync.Once` + variable global o `sync.Pool`.
- En C#: `Lazy<T>` con hilo seguro.
- En TS: módulo con instancia única exportada.
- Nunca abrir/cerrar conexiones por request — siempre pool singleton.

### Código simple, no verbose

- **Funciones cortas**: si una función no cabe en pantalla (~30-40 líneas), divídela.
- **Sin anidamiento innecesario**: early returns, guard clauses.
- **Sin líneas muertas**: eliminar comentarios obvios, logs de debug, código comentado.
- **Nombres claros**: `GetUserByID` > `Get`, `dbPool` > `p`.
- **Menos es más**: preferir la implementación más simple que funcione. No overengineer.
- **Separación clara**: Handler → Service → Repository. Cada capa hace solo su trabajo.

---

## Deploy a VPS — binario comprimido

Al compilar para el VPS (Linux amd64), el binario debe ir **super comprimido** para transferencia rápida. Todo en un solo comando:

### Go

```powershell
# Compilar + comprimir + subir + reemplazar + reiniciar servicio
$env:GOOS="linux"; $env:GOARCH="amd64"; go build -ldflags="-s -w" -o app . `
  && upx --best --ultra-brute app `
  && scp -P 5536 app root@149.50.148.236:/root/app `
  && ssh -p 5536 root@149.50.148.236 "mv /root/app /usr/local/bin/mi-app && chmod +x /usr/local/bin/mi-app && systemctl restart mi-app" `
  && Write-Host "✅ Deploy completado"
```

### Rust

```powershell
$env:TARGET="x86_64-unknown-linux-gnu"; cargo build --release `
  && upx --best --ultra-brute target/release/mi-app `
  && scp -P 5536 target/release/mi-app root@149.50.148.236:/root/app `
  && ssh -p 5536 root@149.50.148.236 "mv /root/app /usr/local/bin/mi-app && chmod +x /usr/local/bin/mi-app && systemctl restart mi-app" `
  && Write-Host "✅ Deploy completado"
```

### Explicación

| Paso | Qué hace |
|---|---|
| `GOOS=linux GOARCH=amd64` | Cross-compile para Linux |
| `-ldflags="-s -w"` | Stripea debug info (Go) |
| `upx --best --ultra-brute` | Comprime el binario al máximo (hasta 90% más pequeño) |
| `scp -P 5536` | Sube el binario comprimido por SSH (mucho más rápido) |
| `mv ... && chmod +x ... && systemctl restart` | Reemplaza, da permisos y reinicia el servicio |

- `upx` debe estar instalado localmente (`pnpm add -g upx` o `scoop install upx` o descargar de upx.github.io)
- El servicio systemd debe estar creado en el VPS
- Comprobar que `mi-app` coincide con el nombre real del servicio

---

## Inicio rápido

Cuando el usuario diga "empieza proyecto X" o similar:

1. Preguntar lenguaje/stack si no está claro
2. `go mod init <nombre>` o `pnpm init` o `dotnet new` según corresponda
3. Crear estructura `docs/` con la plantilla de documentación
4. Crear `.gitignore` adecuado al stack
5. Si usa Firebase: preguntar si debe inicializarlo (`firebase init`)
6. Si usa PostgreSQL: `documentar esquema de base de datos en docs/02-arquitectura.md`
7. Iniciar git: `git init`
8. Primera feature + commit: `feat(init): initial project scaffold`
