---
name: flutter-pro
description: Orquestadora Flutter integral — arquitectura por capas MVVM+Repository (UI/Logic/Data), layouts responsivos y adaptativos con LayoutBuilder/MediaQuery/Expanded/Flexible, fix de errores RenderFlex overflowed y unbounded constraints, optimización profunda de rendering/state/images/memory/async/bundle size con const/rebuilds/isolates, y design system premium con FlexColorScheme/typography/spacing. Usa cuando estructures proyecto, hagas responsive, fixes layout, optimices performance o diseñes UI premium.
metadata:
  model: models/gemini-3.1-pro-preview
  last_modified: Fri, 28 Aug 2026
  replaces:
    - flutter-apply-architecture-best-practices
    - flutter-build-responsive-layout
    - flutter-fix-layout-issues
    - flutter-optimize-code
    - flutter-premium-design
---

# flutter-pro — Orquestadora Flutter Integral

Skill orquestadora que unifica 5 dominios Flutter sin pérdida y sin duplicación. Una sola carpeta, un solo `SKILL.md`, cinco capacidades orquestadas.

> **Origen:** `flutter-apply-architecture-best-practices` (162L) + `flutter-build-responsive-layout` (139L) + `flutter-fix-layout-issues` (138L) + `flutter-optimize-code` (372L) + `flutter-premium-design` (282L) = 1093L → ~950L deduplicado (-45L).

## Router — Qué dominio usar según tu tarea

| Tu intención / trigger | Dominio | Sección | Keywords que disparan |
|---|---|---|---|
| "estructura proyecto / capas / MVVM / repository / use case / feature nueva" | **A Arquitectura** | §1 | `MVVM`, `ChangeNotifier`, `Repository`, `Service`, `domain models`, `dependency injection` |
| "responsive / adaptativo / tablet / desktop / large screen / breakpoints / LayoutBuilder / MediaQuery" | **B Responsive** | §2 | `LayoutBuilder`, `MediaQuery.sizeOf`, `Expanded`, `Flexible`, `ConstrainedBox`, `adaptive` |
| "overflow / RenderFlex overflowed / unbounded height / InputDecorator / ParentData / RenderBox was not laid out" | **C Layout Fix** | §3 | `RenderFlex overflowed`, `Vertical viewport was given unbounded height`, `unbounded width` |
| "optimizar / performance / jank / rebuilds / const / lazy loading / images / memory / async / apk size / obfuscate" | **D Optimize** | §4 | `optimize`, `make faster`, `reduce jank`, `fix rebuilds`, `reduce apk size`, `RepaintBoundary` |
| "premium UI / diseño / theme / tipografía / spacing / glassmorphism / shimmer / micro-interactions / no boilerplate" | **E Premium** | §5 | `premium`, `FlexColorScheme`, `GoogleFonts`, `shimmer`, `glassmorphism`, `haptics` |

**Si tu tarea mezcla dominios** (ej. pantalla responsive + premium + optimizada con arquitectura limpia) → aplicar en orden **A → E → B → C → D**: primero estructura (§1), luego tokens premium (§5), luego responsive (§2), luego fixa constraints (§3), luego audita performance (§4).

## Contenidos

- [§1 Arquitectura por capas](#1-arquitectura-por-capas-mvvm--repository)
- [§2 Layouts responsivos y adaptativos](#2-layouts-responsivos-y-adaptativos)
- [§3 Diagnóstico y fix de layout](#3-diagnóstico-y-fix-de-layout-constraints)
- [§4 Optimización integral](#4-optimización-integral-18-dominios)
- [§5 Design system premium](#5-design-system-premium)
- [Apéndice A — Tokens unificados](#apéndice-a--tokens-unificados)
- [Apéndice B — Checklists combinados](#apéndice-b--checklists-combinados)
- [Referencias cruzadas](#referencias-cruzadas)

---

## 1. Arquitectura por capas (MVVM + Repository)

> Fuente canónica: `flutter-apply-architecture-best-practices` — 0% duplicado, preservado íntegro.

### 1.1 Capas y separación de concerns

Enforce strict Separation of Concerns dividiendo la app en capas. Nunca mezcles UI rendering con business logic o data fetching.

**UI Layer (Presentation) — MVVM:**
- **Views:** widgets lean, reusables. Lógica solo UI-specific (animaciones, layout constraints, routing simple). Toda data viene del ViewModel.
- **ViewModels:** manejan UI state y user interactions. Extienden `ChangeNotifier` (o `Listenable`). Exponen snapshots inmutables. Inyectan Repositories vía constructor.

**Data Layer — Repository pattern (single source of truth):**
- **Services:** clases stateless que wrappean APIs externas (HTTP, DB local, platform plugins). Retornan raw API models o `Result`.
- **Repositories:** consumen uno o más Services. Transforman raw models → Domain Models limpios. Manejan caching, offline sync, retry. Exponen Domain Models a ViewModels.

**Logic Layer (Domain — Opcional):**
- **Use Cases:** solo si hay lógica compleja que ensucia el ViewModel o debe reusarse entre ViewModels. Clases interactor entre ViewModels y Repositories.

### 1.2 Project Structure

Híbrido: UI agrupada por feature, Data/Domain por tipo.

```text
lib/
├── data/
│   ├── models/         # API models
│   ├── repositories/   # Repository implementations
│   └── services/       # API clients, local storage wrappers
├── domain/
│   ├── models/         # Clean domain models
│   └── use_cases/      # Optional business logic classes
└── ui/
    ├── core/           # Shared widgets, themes, typography (ver §5 + Apéndice A)
    └── features/
        └── [feature_name]/
            ├── view_models/
            └── views/
```

### 1.3 Workflow: Implementar un feature nuevo

Checklist secuencial — copiar para trackear progreso:

- [ ] **Step 1: Define Domain Models.** Crear data classes inmutables con `freezed` o `built_value`.
- [ ] **Step 2: Implement Services.** Crear/actualizar Services para comunicación API externa.
- [ ] **Step 3: Implement Repositories.** Crear Repository que consume Services y retorna Domain Models.
- [ ] **Step 4: Apply Conditional Logic (Domain Layer).**
  - *Si requiere transformación compleja o cross-repository:* crear Use Case.
  - *Si es CRUD simple:* saltar a Step 5.
- [ ] **Step 5: Implement the ViewModel.** Extender `ChangeNotifier`. Inyectar Repositories/Use Cases. Exponer state inmutable y commands.
- [ ] **Step 6: Implement the View.** Widget UI usando `ListenableBuilder` o `AnimatedBuilder` para escuchar ViewModel.
- [ ] **Step 7: Inject Dependencies.** Registrar Service, Repository, ViewModel en DI container (`provider` / `get_it`).
- [ ] **Step 8: Run Validator.** Unit tests para ViewModel y Repository. *Feedback loop:* run tests → review failures → fix → re-run. Verificar `dispose()` (ver §4.6) y `mounted` checks (ver §4.6.2) en ViewModels con async.

### 1.4 Ejemplos

#### Data Layer: Service y Repository

```dart
// 1. Service (Raw API interaction)
class ApiClient {
  Future<UserApiModel> fetchUser(String id) async {
    // HTTP GET implementation...
  }
}

// 2. Repository (Single source of truth, returns Domain Model)
class UserRepository {
  UserRepository({required ApiClient apiClient}) : _apiClient = apiClient;
  
  final ApiClient _apiClient;
  User? _cachedUser;

  Future<User> getUser(String id) async {
    if (_cachedUser != null) return _cachedUser!;
    
    final apiModel = await _apiClient.fetchUser(id);
    _cachedUser = User(id: apiModel.id, name: apiModel.fullName); // Transform to Domain Model
    return _cachedUser!;
  }
}
```

#### UI Layer: ViewModel y View

```dart
// 3. ViewModel (State management and presentation logic)
class ProfileViewModel extends ChangeNotifier {
  ProfileViewModel({required UserRepository userRepository}) 
      : _userRepository = userRepository;

  final UserRepository _userRepository;

  User? _user;
  User? get user => _user;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  Future<void> loadProfile(String id) async {
    _isLoading = true;
    notifyListeners();

    try {
      _user = await _userRepository.getUser(id);
      if (!mounted) return; // ver §4.6.2 — check mounted en async
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Ver §4.6.1 — dispose si el VM mantiene controllers/subscriptions
  @override
  void dispose() {
    // _subscription?.cancel();
    super.dispose();
  }
}

// 4. View (Dumb UI component)
class ProfileView extends StatelessWidget {
  const ProfileView({super.key, required this.viewModel});

  final ProfileViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: viewModel,
      builder: (context, _) {
        if (viewModel.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final user = viewModel.user;
        if (user == null) {
          return const Center(child: Text('User not found'));
        }

        return Column(
          children: [
            Text(user.name),
            ElevatedButton(
              onPressed: () => viewModel.loadProfile(user.id),
              child: const Text('Refresh'),
            ),
          ],
        );
      },
    );
  }
}
```

> Nota arquitectura + premium: para Views premium usar tokens de §5 y Apéndice A (`AppSpacing`, `GoogleFonts`, premium `Container` en lugar de `Card` default) — ver §5.7.

---

## 2. Layouts responsivos y adaptativos

> Fusión de `flutter-build-responsive-layout` + fundamentos de `flutter-fix-layout-issues`. Deduplicado: una sola definición de constraints/Expanded/lazy.

### 2.1 Foundations — La regla de Flutter

**Constraints go down. Sizes go up. Parent sets position.**

Todo error de layout (§3) es una violación de esta negociación: parent da constraints infinitas, child intenta expandirse infinito, o child pide más que lo asignado.

- **Distribute Space:** `Expanded` y `Flexible` dentro de `Row`, `Column`, `Flex`.
  - `Expanded` = fuerza fill del espacio restante (`Flexible` con `fit: FlexFit.tight`, `flex: 1`).
  - `Flexible` = permite sizing hasta límite con `flex` ratio; puede ser más pequeño que asignado.
- **Constrain Width:** envolver `GridView`/`ListView` en `ConstrainedBox`/`Container` con `BoxConstraints(maxWidth)` para no estirar en large screens. Usar `Center` para centrar contenido constreñido.
- **Lazy rendering (fuente canónica §4.3):** `ListView.builder`/`GridView.builder` siempre salvo lista fija <20 items. `SliverList`/`SliverGrid` con `CustomScrollView` para sticky headers. Ver §4.3 para detalle.
- **ParentData:** `Expanded`/`Flexible` solo como hijo directo de `Row`/`Column`/`Flex`; `Positioned` solo directo de `Stack` (ver §3.1).

### 2.2 Space measurement — Decidir según ventana, no device

- **Use `MediaQuery.sizeOf(context)`** para tamaño de la app window completa. Es más barato que `LayoutBuilder` (ver §4.13.3) — usar `MediaQuery` cuando solo necesitas window size.
- **Use `LayoutBuilder`** para decisiones basadas en espacio del parent (`constraints.maxWidth`). Rebuild en cada cambio de constraints — usar solo cuando necesitas parent constraints, no window.
- **Do not use `MediaQuery.orientationOf` o `OrientationBuilder`** cerca del top para switch layouts. Orientation no refleja window en multi-window/foldables.
- **Do not check hardware types** ("phone" vs "tablet"). Flutter corre en ventanas redimensionables, multi-window, PiP. Basar todo en available window space.
- **Tokens unificados:** usar `AppBreakpoints` (Apéndice A) en lugar de `largeScreenMinWidth = 600` hardcodeado.

### 2.3 Device y orientation behaviors

- **Do not lock screen orientation.** Causa letterboxing en foldables; Android large format tiers requiere portrait+landscape.
- **Fallback si business exige lock:** usar `Display API` para dimensiones físicas en lugar de `MediaQuery`; `MediaQuery` falla en compatibility modes con window más grande.
- **Support Multiple Inputs:** mice, trackpads, keyboard shortcuts, touch targets accesibles, navegación por teclado.

### 2.4 Workflow: Construir un adaptive layout

Checklist:

- [ ] Identificar widget target que necesita adaptive behavior.
- [ ] Wrappear en `LayoutBuilder`.
- [ ] Extraer `constraints.maxWidth` del builder.
- [ ] Usar `AppBreakpoints.mobileMax` (600) como breakpoint (no hardcodear).
- [ ] **Si `maxWidth > AppBreakpoints.mobileMax`:** retornar large-screen layout (ej. `Row` con sidebar + content side-by-side).
- [ ] **Si `maxWidth <= mobileMax`:** retornar small-screen layout (`Column` o navegación estándar).
- [ ] Validator → resize window → revisar transiciones → fix overflows (si overflow → §3).

### 2.5 Workflow: Optimizar para large screens

Checklist:

- [ ] Identificar componentes full-width (`ListView`, text blocks, forms).
- [ ] **Si es lista:** convertir `ListView.builder` → `GridView.builder` con `SliverGridDelegateWithMaxCrossAxisExtent` para auto columnas.
- [ ] **Si es form/text block:** wrappear en `ConstrainedBox` con `BoxConstraints(maxWidth: 800)` (o token).
- [ ] Wrappear `ConstrainedBox` en `Center` para centrar en large screens.
- [ ] Usar `AppSpacing` tokens (ver Apéndice A) para padding consistente (`p24`, etc) — no hardcodear `12.0`/`19.0`.
- [ ] Validator → test en desktop/tablet → revisar stretching horizontal → ajustar `maxWidth` o grid extents.

### 2.6 Ejemplos

#### Adaptive layout con AppBreakpoints (B adaptado — deduplicado)

```dart
import 'package:flutter/material.dart';

// AppBreakpoints — ver Apéndice A (único source, reemplaza largeScreenMinWidth hardcode)
class AdaptiveLayout extends StatelessWidget {
  const AdaptiveLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth > AppBreakpoints.mobileMax) {
          return _buildLargeScreenLayout();
        } else {
          return _buildSmallScreenLayout();
        }
      },
    );
  }

  Widget _buildLargeScreenLayout() {
    return Row(
      children: [
        const SizedBox(width: 250, child: Placeholder(color: Colors.blue)),
        const VerticalDivider(width: 1),
        Expanded(child: const Placeholder(color: Colors.green)),
      ],
    );
  }

  Widget _buildSmallScreenLayout() {
    return const Placeholder(color: Colors.green);
  }
}
```

#### Contraining width en large screens (B + AppSpacing)

```dart
import 'package:flutter/material.dart';

class ConstrainedContent extends StatelessWidget {
  const ConstrainedContent({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: ListView.builder(
            padding: AppSpacing.p24, // token unificado §5.3
            itemCount: 50,
            itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
          ),
        ),
      ),
    );
  }
}
```

> Si ves overflow o unbounded al probar estos ejemplos → ir a §3.

---

## 3. Diagnóstico y fix de layout (constraints)

> Fuente: `flutter-fix-layout-issues` — preservado íntegro, cross-ref a §2 para foundations.

### 3.1 Constraint violation diagnostics — 5 firmas exactas

| Error | Causa |
|-------|-------|
| **"Vertical viewport was given unbounded height"** | Scrollable (`ListView`, `GridView`) dentro de parent vertical sin constraint (`Column`). Parent da infinite height, child expande infinito. |
| **"An InputDecorator...cannot have an unbounded width"** | `TextField`/`TextFormField` dentro de parent horizontal sin constraint (`Row`). |
| **"RenderFlex overflowed"** | Child de `Row`/`Column` pide más que constraints del parent. Rayas amarillas/negras. |
| **"Incorrect use of ParentData widget"** | `ParentDataWidget` no es hijo directo de ancestro requerido (ej. `Expanded` fuera de `Flex`, `Positioned` fuera de `Stack`). |
| **"RenderBox was not laid out"** | Efecto cascada — ignorar, buscar arriba el primary violation (unbounded). |

### 3.2 Workflow de resolución

Checklist — copiar y usar sistemático:

- [ ] Correr en debug y capturar excepción exacta (ignorar cascading `RenderBox was not laid out`).
- [ ] Identificar mensaje primario de §3.1.
- [ ] Aplicar fix condicional:
  - **Si "Vertical viewport was given unbounded height":** wrappear scrollable child (`ListView`, `GridView`) en `Expanded` (consume remaining space) o `SizedBox` con height absoluto.
  - **Si "An InputDecorator...cannot have an unbounded width":** wrappear `TextField` en `Expanded` o `Flexible`.
  - **Si "RenderFlex overflowed":** wrappear child overflowing en `Expanded` (force fit) o `Flexible` (allow smaller). Ver §2.1 para diferencia.
  - **Si "Incorrect use of ParentData widget":** mover `ParentDataWidget` a hijo directo del parent requerido. `Expanded`/`Flexible` → directo de `Row`/`Column`/`Flex`. `Positioned` → directo de `Stack`.
- [ ] Hot reload.
- [ ] Validator → inspeccionar que red/grey error y rayas amarillas/negras desaparecen. Si nuevo error → repetir.

### 3.3 Ejemplos before/after

#### Fixing Unbounded Height (ListView in Column)

```dart
// ❌ Error: Throws "Vertical viewport was given unbounded height"
Column(
  children: <Widget>[
    const Text('Header'),
    ListView(
      children: const <Widget>[
        ListTile(title: Text('Item 1')),
        ListTile(title: Text('Item 2')),
      ],
    ),
  ],
)

// ✅ Resuelto: Wrap ListView in Expanded
Column(
  children: <Widget>[
    const Text('Header'),
    Expanded(
      child: ListView(
        children: const <Widget>[
          ListTile(title: Text('Item 1')),
          ListTile(title: Text('Item 2')),
        ],
      ),
    ),
  ],
)
```

#### Fixing Unbounded Width (TextField in Row)

```dart
// ❌ Error: Throws "An InputDecorator...cannot have an unbounded width"
Row(
  children: [
    const Icon(Icons.search),
    TextField(), 
  ],
)

// ✅ Resuelto
Row(
  children: [
    const Icon(Icons.search),
    Expanded(child: TextField()),
  ],
)
```

#### Fixing RenderFlex Overflow

```dart
// ❌ Error: "A RenderFlex overflowed by X pixels on the right"
Row(
  children: [
    const Icon(Icons.info),
    const Text('This is a very long text string that will definitely overflow the available screen width and cause a RenderFlex error.'),
  ],
)

// ✅ Resuelto
Row(
  children: [
    const Icon(Icons.info),
    Expanded(
      child: const Text('This is a very long text string that will definitely overflow the available screen width and cause a RenderFlex error.'),
    ),
  ],
)
```

---

## 4. Optimización integral (18 dominios)

> Fuente canónica: `flutter-optimize-code` — audit integral. No cherry-pick: aplicar todo lo aplicable. Cross-refs a §2 y §5 donde había duplicación.

Cuando se invoca, auditar y fixear sistemáticamente a través de **TODAS** las secciones debajo.

### 4.1 Widgets & Rendering

#### 4.1.1 Const widgets
- Todo widget que no muta debe tener `const` constructor.
- Preferir `const SizedBox`, `const Padding`, `const EdgeInsets`, `const TextStyle`, `const BoxDecoration` como `static const` fuera de build.
- `StatelessWidget`s con `const` constructors (`StatefulWidget`s también con solo `super.key`).

#### 4.1.2 Unnecessary rebuilds
- Identificar widgets que rebuild sin data changes.
- Usar `context.select<T, R>(selector)` en lugar de `context.watch<T>()` cuando solo un field se necesita (ver §4.2.2).
- Extraer subtrees caros en widget classes separadas o `Consumer`.
- `AnimatedBuilder` solo para la parte que realmente cambia.

#### 4.1.3 Lazy loading
- `ListView.builder` / `GridView.builder` siempre salvo lista fija pequeña (<20 conocidos). Ver §2.1 foundations — esta es la fuente canónica.
- `SliverList` / `SliverGrid` con `CustomScrollView` para sticky headers o mixed slivers.
- `PageView.builder` en lugar de `PageView(children: [...])`.
- `TabBarView` es lazy por defecto — no crear exhaustive `children`.

#### 4.1.4 RepaintBoundary
- Wrappear widgets animados o video/image que repintan frecuente: `RepaintBoundary(child: ...)`.
- `child: RepaintBoundary.wrap(child, 1)` si key necesaria.
- **Nota premium:** `InteractiveButton` de §5.5 debe envolverse en `RepaintBoundary` (ver §5.5).

#### 4.1.5 Opacity y efectos caros
- Evitar `Opacity` → usar `AnimatedOpacity` (mejor performance).
- `BackdropFilter` muy caro → solo cuando estrictamente necesario. **Glassmorphism de §5.1 usa BackdropFilter — usar con moderación y con RepaintBoundary.**
- Evitar excesivo `ClipRRect`, preferir native `borderRadius` en `Container`/`Material`.
- `ShaderMask`, `ColorFiltered`, `ImageFiltered` costosos — usar sparingly.

#### 4.1.6 Widget tree depth
- `Container(padding: ...)` → `Padding(padding: ...)`
- `Container(width: x, height: y)` → `SizedBox(width: x, height: y)`
- `Container(alignment: ...)` → `Align(alignment: ...)`
- `SizedBox.expand()` sobre `Container(width: double.infinity, ...)`

#### 4.1.7 Keys
- `ValueKey` / `ObjectKey` en listas dinámicas para preservar state.
- No keys en widgets estáticos (overhead innecesario).
- `PageStorageKey` para preservar scroll en TabBarView.
- Evitar excesivo `GlobalKey` — hold references y bloquea GC.

#### 4.1.8 Text
- `Text` cachea mejor que `RichText` → preferir `Text.rich()` si inline styling necesario.
- `TextStyle` como `static const` fuera de build (ver §5.2 para tokens).
- `precacheFont()` para custom fonts (evita first-render jank).
- Evitar `strutStyle` y `textScaleFactor` salvo necesario.

#### 4.1.9 Containers y decorations
- `Container` sin `decoration` → reemplazar con `SizedBox` + `Padding`.
- `BoxDecoration` + `borderRadius` sobre `ClipRRect` donde posible.

### 4.2 State & Providers

#### 4.2.1 Optimized ChangeNotifier
- `notifyListeners()` solo cuando algo realmente cambió.
- No llamar `notifyListeners()` en provider `initState`.
- Comparar antes de notificar: `if (_data != newData) { _data = newData; notifyListeners(); }`

#### 4.2.2 Consumer vs context.watch vs context.select
- `context.select<T, R>((v) => v.field)` para single field.
- `Consumer<T>(builder: ...)` para rebuild solo parte.
- `context.watch<T>()` solo cuando entire state necesario.

#### 4.2.3 setState
- No usar `setState` en widgets grandes — mover state a providers o sub-widgets.
- `setState(() { ... })` con mutación mínima.

#### 4.2.4 State preservation
- `AutomaticKeepAliveClientMixin` en `TabBarView`/`PageView` pages.
- `PageStorageKey` para preservar scroll entre tabs.

### 4.3 Images & Assets

#### 4.3.1 Network images
- `cached_network_image` con `memCacheWidth`/`memCacheHeight` y `maxWidthDiskCache`/`maxHeightDiskCache`.
- Server-side resize si backend lo soporta.
- `precacheImage()` para imágenes próximas a mostrarse.

#### 4.3.2 Local images
- Definir size explícito (evita GPU scaling vía `fit:`).
- `Image.asset` con `cacheWidth`/`cacheHeight`.
- SVG con `flutter_svg` vs PNG: SVG para icons, PNG para fotos.

#### 4.3.3 Formats
- WebP > PNG > JPEG en compression/quality.
- Revisar `pubspec.yaml` assets — remover no usados.

### 4.4 Computation & Logic

#### 4.4.1 Avoid computation in build
- Cálculos pesados → mover a `initState`, lazy getters, o `compute()`.
- String/date/number formatting — memoizar o precomputar.
- `Future.microtask` para async que no debe bloquear build.

#### 4.4.2 compute() / Isolates
- JSON parsing >100KB → `compute(jsonDecode, raw)`.
- Data processing, cryptography, heavy filtering → `Isolate.run()`.
- Firebase snapshot parsing → `compute(MyModel.fromFirestoreList, querySnap.docs)`.

#### 4.4.3 Memoization
- Cachear `RegExp`, `DateFormat`, `NumberFormat`.
- `late final` vs getter que recalcula.

#### 4.4.4 Streams
- `.distinct()` para evitar duplicate events.
- `.debounce()` / `.throttle()` para live search.
- Cancelar subscriptions (`StreamSubscription` + `.cancel()` en dispose).

### 4.5 Firebase & Networking

#### 4.5.1 Firestore
- `.limit(n)` siempre — nunca fetch más docs que necesario.
- `.select('field1', 'field2')` para solo fields necesarios.
- Preferir `get()` sobre `snapshots()` cuando data no cambia frecuente.
- `FieldPath` sobre string dots para nested fields.
- `WriteBatch` para multiple writes.

#### 4.5.2 HTTP
- Cachear responses con `dio` interceptor o `http_cache`.
- Debounce searches (300ms mínimo).
- Timeouts: 10s connect, 30s receive.
- Reusar `HttpClient` en lugar de crear por request.

### 4.6 Memory

#### 4.6.1 Always dispose
- `AnimationController.dispose()`
- `TextEditingController.dispose()`
- `FocusNode.dispose()`
- `ScrollController.dispose()`
- `StreamSubscription.cancel()`
- `Timer.cancel()`

#### 4.6.2 References y leaks
- Evitar closures que capturan `BuildContext` y outlive widget (streams, timers).
- Check `mounted` antes de `setState` o `Navigator.push` en async callbacks.
- No hold `BuildContext` en singletons o static providers.
- Providers en `ChangeNotifierProvider` se dispose automáticamente con route.

#### 4.6.3 Caches
- `ImageCache.maximumSize` y `maximumSizeBytes` — configurar por device.
- Clear cache en app background: `imageCache.clear()` y `clearLiveImages()`.
- `CachedNetworkImage` con `maxCacheDiskAge`.

### 4.7 Animations

#### 4.7.1 Controllers
- `AnimationController` con `vsync: this` (mixin `SingleTickerProviderStateMixin`).
- No crear controllers en `build`.
- `addStatusListener` sobre `addListener` si solo final state importa.

#### 4.7.2 Animation widgets
- `TweenAnimationBuilder` > manual `AnimationController` (para one-shot).
- `AnimatedContainer`, `AnimatedOpacity`, `AnimatedPadding`, `AnimatedSwitcher` sobre versiones manuales.
- `AnimatedBuilder` solo para partial rebuild.
- Preferir `ImplicitlyAnimatedWidget` sobre `ExplicitlyAnimatedWidget` cuando posible.

#### 4.7.3 Performance
- Evitar animar `Opacity` + `Transform` simultáneamente.
- `RepaintBoundary` alrededor de cada elemento animado (ver §4.1.4).
- Preferir `Transform` sobre `AnimatedContainer` para position animations.
- Usar `AnimatedList` sobre `ListView` + inserts manuales.

### 4.8 Async & Event Loop

#### 4.8.1 Microtask queue
- No saturar con excesivo `scheduleMicrotask`.
- `Future.value()` vs `Future(() => null)` — value es sincrónico.

#### 4.8.2 Isolate blocking
- Computation en `build` o scroll response → usar `compute()`.
- `await` en loops puede causar starvation: batch operaciones.

#### 4.8.3 Async efficiency
- `Future.wait()` para operaciones independientes en paralelo.
- Evitar `async`/`await` si método es puramente sincrónico (adds overhead).
- `Completer` solo cuando `Future` no puede usarse directo.

### 4.9 Compilation & Bundle Size

#### 4.9.1 Tree shaking
- Importar solo lo usado.
- Check dead dependencies con `flutter pub deps`.
- No mass-`export` desde barrels si unused.

#### 4.9.2 Build flags
```sh
flutter build apk --split-debug-info --obfuscate --target-platform android-arm,android-arm64,android-x64
flutter build ios --split-debug-info --obfuscate
flutter build web --web-renderer canvaskit --dart-define=FLUTTER_WEB_USE_SKIA=true
```

#### 4.9.3 Dependencies
- Revisar `flutter pub outdated` y update.
- Reemplazar packages pesados por lighter (ej. `collection` sobre `quiver`).
- Check transitive deps: `flutter pub deps -s compact`.

#### 4.9.4 Assets
- `flutter build apk --target-platform` limita ABIs y reduce size.
- Comprimir large assets (WebP images, lower-bitrate MP3).
- `flutter clean` periódico para clear build caches.

### 4.10 JSON / Serialization

- Reusar `JsonEncoder`/`JsonDecoder` (crear una vez como `static final`).
- `compute()` para JSON >100KB.
- Manual `fromJson`/`toJson` sin codegen más eficiente que `json_serializable` (sin reflection).
- Records (Dart 3+) para estructuras temporales → menos overhead que classes.

### 4.11 Dart Language Features

#### 4.11.1 Const / final
- `const` constructor en cada clase que lo permita.
- `const` > `final` > `var` donde aplique.
- `const` lists, maps, sets — compiler las reusa.

#### 4.11.2 Typing
- Evitar `dynamic`, `Object?` — hinders AOT optimization.
- `Function` sin signature → typearlo: `void Function(String)`.
- `Uint8List` > `List<int>` para bytes.
- `Int32List` > `List<int>` para flat numeric data.

#### 4.11.3 Boxing
- `int` ↔ `double` tiene costo — evitar conversions en hot paths.
- Autoboxing `int` a `Object` prevenible con concrete types.

#### 4.11.4 Inline
- `@pragma('vm:prefer-inline')` en getters/funciones muy pequeñas frecuentes.
- No overuse — aumenta code size.

#### 4.11.5 Collections
- `List.generate` > `for` loop + `add` para known-size lists.
- `Map.putIfAbsent` > manual check.
- Indexed `for` > `for (var item in list)` cuando index necesario (menos allocations).

### 4.12 Platform Channels

- MethodChannel ~1-5ms por call — batch native queries.
- Preferir `BasicMessageChannel` con JSON sobre múltiples MethodChannels.
- `EventChannel` para streams, no poll con MethodChannel.
- No llamar platform channels desde `build` o dentro de animations.

### 4.13 Specific Widgets

#### 4.13.1 StreamBuilder
- Usar `initialData` para evitar empty frame.
- Sin `initialData` causa extra rebuild (null → data).

#### 4.13.2 ValueListenableBuilder
- Más liviano que `AnimatedBuilder` para simple values (string, int, bool).

#### 4.13.3 MediaQuery vs LayoutBuilder
- `MediaQuery.sizeOf(context)` es cheaper que `LayoutBuilder`.
- `LayoutBuilder` rebuilds en cada constraint change — usar solo cuando necesario (ver §2.2 para guideline completo fusionado).

#### 4.13.4 Overlays y dialogs
- `OverlayEntry` > `showDialog` para persistent overlays.
- Crear una vez y reusar, no recrear en cada build.

### 4.14 Accessibility

- `excludeSemantics: true` en widgets puramente decorativos (icons, backgrounds, separators).
- No overuse manual `Semantics()` — tiene costo.
- Merge semantics con `mergeSemantics: true` cuando apropiado.

### 4.15 GC (Garbage Collection)

- Menos objetos en build → menos GC pauses.
- `TextStyle`, `EdgeInsets`, `BoxDecoration` como `static const` fuera de build.
- Closures en build crean nuevos objetos cada frame → extraer a métodos separados o `static`.

### 4.16 Navigation

- GoRouter: lazy redirect, no poner heavy logic en `redirect`.
- `Navigator.pushNamed` > `Navigator.push(MaterialPageRoute(...))` (reusa routes).
- Preload routes con `Navigator.preparePageRoute` si user likely irá.

### 4.17 Local Database (Drift/Hive/Isar)

- Indexes en columns usadas en WHERE/ORDER BY.
- `batch()` para mass inserts/updates.
- Lazy-load relationships.
- `watch()` vs `get()`: watch solo si data cambia frecuente.

### 4.18 DevTools & Profiling

- Performance overlay: `--profile` + `flutter run --profile`.
- `flutter devtools` — Memory, CPU, Network, Inspector.
- `FlutterError.onError` para catch errors sin crash.
- `debugProfileBuildsEnabled` para ver rebuilds.
- `debugPrintRebuildDirtyWidgets` para detectar excessive rebuilds.

### 4.19 Workflow: Audit & Fix (5 fases)

#### Fase 1 — Analyze
- `flutter analyze` — fix todos warnings/lints.
- Review imports: remover unused.
- Identificar widgets sin `const` constructors.
- Review `pubspec.yaml`: unused dependencies, orphaned assets.

#### Fase 2 — Widgets
- Add `const` a cada widget que lo permita.
- Convertir `Container`s simples a `SizedBox`/`Padding`/`Align`.
- Verificar `ListView.builder` en lugar de `ListView(children: [...])`.
- Wrappear animations con `RepaintBoundary`.

#### Fase 3 — State
- Reemplazar `context.watch` con `context.select` donde aplique.
- Mover heavy logic fuera de build.
- Verificar `notifyListeners` solo en actual change.

#### Fase 4 — Memory
- Verificar `dispose()` en todos controllers y streams.
- Remover innecesarios `GlobalKey`s.
- Add `mounted` checks en async callbacks.

#### Fase 5 — Build
- Verificar `--split-debug-info` y `--obfuscate`.
- Review compressed assets.
- Run `flutter clean`.

---

## 5. Design system premium

> Fuente: `flutter-premium-design` — preservado íntegro, cross-ref a §4 para costos y a Apéndice A para tokens.

AI agents often generate generic boilerplate Flutter apps (plain blue/red apps con `Card` default). Esta sección enforces modern premium aesthetics.

### 5.1 Visual Aesthetics & Theme System

#### Prohibited Patterns
- **No pure/saturated primary colors** (`Colors.blue`, `Colors.red`, `Colors.green`) en default.
- **No default `Card`** sin custom shapes, shadows, borders.
- **No plain black text** sobre white background estándar (too harsh).

#### Premium Practices
- **Use `FlexColorScheme`:** paletas curadas con sub-themes. `useMaterial3: true` y presets premium (`FlexScheme.mxBlue`, `FlexScheme.wasabi`, `FlexScheme.deepBlue`).
- **Sleek Dark Mode:** deep gray/dark navy (`0xFF121824` o `0xFF0F172A`) en lugar de pure black (`0xFF000000`).
- **Glassmorphism / Frosted Surfaces:** `BackdropFilter` con `ImageFiltered` o `ClipRRect` para blur en overlays/dialogs/bottom bars. **Costo:** `BackdropFilter` es muy caro (ver §4.1.5) — usar solo estrictamente necesario y siempre con `RepaintBoundary` y `ClipRRect`.
- **Curated Shadows & Borders:** soft shadows (large blur radius, low opacity, matching color tone) y thin borders (`Colors.white.withOpacity(0.08)` o `Colors.black.withOpacity(0.05)`).
- **Custom Theme Extensions:** mantener design tokens estructurados. Usar `ThemeExtension` para custom colors/typography/layout.

```dart
// Premium Card Styling (usar borderRadius 20-24 de Apéndice A)
Container(
  decoration: BoxDecoration(
    color: Theme.of(context).colorScheme.surface.withOpacity(0.85),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(
      color: Theme.of(context).colorScheme.onSurface.withOpacity(0.08),
      width: 1,
    ),
    boxShadow: [
      BoxShadow(
        color: Theme.of(context).colorScheme.shadow.withOpacity(0.04),
        blurRadius: 24,
        offset: const Offset(0, 8),
      ),
    ],
  ),
  child: child,
);
```

### 5.2 Typography & Hierarchy

- **Custom Google Fonts:** siempre `Outfit`, `Inter`, `Cabinet Grotesk`, `Plus Jakarta Sans` en lugar de OS defaults.
- **Explicit Font Weight & Letter Spacing:** títulos grandes con tighter spacing (`letterSpacing: -0.5` / `-1.0`) y semi-bold/bold. Body con increased line height (`height: 1.4`-`1.6`).
- **Visual Hierarchy:** usar size/weight/opacity.
  - **Title / Headers:** `1.0` opacity, Bold/ExtraBold.
  - **Secondary / Body:** `0.7` opacity, Regular.
  - **Captions / Details:** `0.5` opacity, Light/Medium.

```dart
Text(
  'Explore Chapters',
  style: GoogleFonts.outfit(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.6,
    color: Theme.of(context).colorScheme.onBackground,
  ),
);
```

### 5.3 Spacing & Layout Architecture

> **Estándar global para todo flutter-pro — reemplaza hardcodes de §2.**

- **Proportional Padding:** nunca hardcodear arbitrarios (`12.0`, `14.0`, `19.0`). Estandarizar en 8dp grid (`8.0`, `16.0`, `24.0`, `32.0`, `48.0`). Usar `AppSpacing` (Apéndice A).
- **Visual Breathing Room:** `24.0` o `32.0` para horizontal padding en outer page margins.
- **Component Relationships:** relacionados cerca (`4.0`/`8.0`), secciones separadas con `24.0`/`32.0`.
- **Unified Spacers:** usar `AppSpacing.v16`, `AppSpacing.h8` en lugar de ad-hoc `SizedBox`.

### 5.4 Responsive Breakpoints

> **Fuente única — reemplaza `largeScreenMinWidth = 600` hardcode de §2.**

Usar `AppBreakpoints` (Apéndice A). No hacer raw `MediaQuery.of(context).size.width > 600` con math custom.

```dart
// Uso correcto
if (AppBreakpoints.isDesktop(context)) {
  return _buildLargeScreenLayout();
}
```

### 5.5 Modern Widgets & Micro-Interactions

- **Floating Bottom Navigation Bar:** no dock-to-bottom estándar. Floating/suspended con rounded corners y blur filters.
- **Animated Buttons:** no `ElevatedButton` flat estándar. Micro-interactions al press (scale animations con `GestureDetector` + spring).
- **Smooth Page Routing:** custom fade-through o scale-fade, no slide-up instant.
- **Skeleton Loaders (Shimmer):** nunca generic `CircularProgressIndicator` en main content. Usar shimmer skeleton layouts. **Cross-ref:** `AnimatedSwitcher`/`AnimatedCrossFade` en §4.7.2 y §5.6 para transiciones.
- **Interactive Slivers:** `SliverAppBar` con `FlexibleSpaceBar` con blurs, snapping, color fades al scroll.
- **Tactile Haptic Feedback:** combinar con `HapticFeedback.selectionClick()` / `lightImpact()` en key actions.

```dart
// Spring-loaded animated button — envolver en RepaintBoundary para performance (ver §4.1.4)
class InteractiveButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const InteractiveButton({super.key, required this.child, required this.onTap});

  @override
  State<InteractiveButton> createState() => _InteractiveButtonState();
}

class _InteractiveButtonState extends State<InteractiveButton> with SingleTickerProviderStateMixin {
  late double _scale;
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      lowerBound: 0.0,
      upperBound: 0.05,
    )..addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _controller.dispose(); // ver §4.6.1
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    _scale = 1 - _controller.value;
    return RepaintBoundary( // agregado por flutter-pro (deduplicado de §4.1.4)
      child: GestureDetector(
        onTapDown: (_) {
          HapticFeedback.selectionClick();
          _controller.forward();
        },
        onTapUp: (_) {
          _controller.reverse();
          widget.onTap();
        },
        onTapCancel: () => _controller.reverse(),
        child: Transform.scale(
          scale: _scale,
          child: widget.child,
        ),
      ),
    );
  }
}
```

### 5.6 State Integration & Fluid Transitions

Evitar sudden layout shifts. Usar `AnimatedSwitcher` / `AnimatedCrossFade` entre loading/loaded/empty/error. Con Riverpod:

```dart
asyncValue.when(
  data: (data) => AnimatedSwitcher(
    duration: const Duration(milliseconds: 300),
    child: SuccessContent(data: data),
  ),
  error: (err, stack) => ErrorScreen(error: err),
  loading: () => const ShimmerPlaceholderList(),
);
```

### 5.7 Implementation Reference (Generic vs Premium)

#### Generic (DO NOT USE)
```dart
Card(
  child: Padding(
    padding: EdgeInsets.all(10), // hardcode no-8dp
    child: Column(
      children: [
        Text('Bible Verse', style: TextStyle(fontWeight: FontWeight.bold)),
        Text('John 3:16 - For God so loved the world...'),
      ],
    ),
  ),
);
```

#### Premium (USE THIS)
```dart
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [
        Theme.of(context).colorScheme.primaryContainer.withOpacity(0.35),
        Theme.of(context).colorScheme.surface,
      ],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(24), // AppRadius.lg
    border: Border.all(
      color: Theme.of(context).colorScheme.primary.withOpacity(0.12),
      width: 1.2,
    ),
    boxShadow: [
      BoxShadow(
        color: Theme.of(context).colorScheme.shadow.withOpacity(0.03),
        blurRadius: 30,
        offset: const Offset(0, 10),
      ),
    ],
  ),
  child: ClipRRect(
    borderRadius: BorderRadius.circular(24),
    child: Padding(
      padding: const EdgeInsets.all(20.0), // o AppSpacing.p20
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.menu_book_rounded, color: Theme.of(context).colorScheme.primary, size: 20),
              const SizedBox(width: 10),
              Text(
                'BIBLE VERSE',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'For God so loved the world...',
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.w500,
              height: 1.4,
              color: Theme.of(context).colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'John 3:16',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    ),
  ),
);
```

---

## Apéndice A — Tokens unificados

> Fuente única para todo flutter-pro — elimina duplicación de `600` hardcode y `SizedBox` ad-hoc. Importar desde `ui/core/tokens/`.

### A.1 AppSpacing — 8dp grid estándar

```dart
abstract class AppSpacing {
  // Spacers verticales / horizontales
  static const v4  = SizedBox(height: 4);   static const h4  = SizedBox(width: 4);
  static const v8  = SizedBox(height: 8);   static const h8  = SizedBox(width: 8);
  static const v12 = SizedBox(height: 12);  static const h12 = SizedBox(width: 12);
  static const v16 = SizedBox(height: 16);  static const h16 = SizedBox(width: 16);
  static const v24 = SizedBox(height: 24);  static const h24 = SizedBox(width: 24);
  static const v32 = SizedBox(height: 32);  static const h32 = SizedBox(width: 32);
  static const v48 = SizedBox(height: 48);  static const h48 = SizedBox(width: 48);

  // Paddings
  static const p8  = EdgeInsets.all(8);
  static const p16 = EdgeInsets.all(16);
  static const p20 = EdgeInsets.all(20);
  static const p24 = EdgeInsets.all(24);
  static const p32 = EdgeInsets.all(32);

  // Horizontal page margins (premium breathing room)
  static const pageH16 = EdgeInsets.symmetric(horizontal: 16);
  static const pageH24 = EdgeInsets.symmetric(horizontal: 24);
  static const pageH32 = EdgeInsets.symmetric(horizontal: 32);
}
```

Usar siempre `AppSpacing.v16` en lugar de `const SizedBox(height: 16)` ad-hoc. Ver §5.3 y §2.5.

### A.2 AppBreakpoints — Breakpoints únicos

```dart
abstract class AppBreakpoints {
  static const double mobileMax = 600;
  static const double tabletMax = 1024;

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width <= mobileMax;

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).width > mobileMax &&
      MediaQuery.sizeOf(context).width <= tabletMax;

  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width > tabletMax;

  // Para LayoutBuilder (cuando necesitas parent constraints, no window)
  static bool isMobileConstraints(BoxConstraints c) => c.maxWidth <= mobileMax;
  static bool isTabletConstraints(BoxConstraints c) =>
      c.maxWidth > mobileMax && c.maxWidth <= tabletMax;
}
```

Reemplaza `largeScreenMinWidth = 600` hardcodeado de B y duplicado en E. Usar `AppBreakpoints.mobileMax` siempre.

### A.3 AppRadius & AppShadows

```dart
abstract class AppRadius {
  static const sm = Radius.circular(12);
  static const md = Radius.circular(16);
  static const lg = Radius.circular(20);
  static const xl = Radius.circular(24);
  static const xxl = Radius.circular(32);

  static const borderSm = BorderRadius.all(sm);
  static const borderMd = BorderRadius.all(md);
  static const borderLg = BorderRadius.all(lg);
  static const borderXl = BorderRadius.all(xl);
}

abstract class AppShadows {
  static List<BoxShadow> soft(BuildContext context) => [
    BoxShadow(
      color: Theme.of(context).colorScheme.shadow.withOpacity(0.04),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
  static List<BoxShadow> premium(BuildContext context) => [
    BoxShadow(
      color: Theme.of(context).colorScheme.shadow.withOpacity(0.03),
      blurRadius: 30,
      offset: const Offset(0, 10),
    ),
  ];
}
```

### A.4 Uso combinado

```dart
// Responsive + premium + spacing en una pantalla
LayoutBuilder(
  builder: (context, c) {
    final isDesktop = AppBreakpoints.isDesktop(context);
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800),
        child: Padding(
          padding: AppSpacing.pageH24,
          child: Column(
            children: [
              Text('Título', style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.6)),
              AppSpacing.v16,
              RepaintBoundary(child: InteractiveButton(onTap: () {}, child: Text('Acción'))),
            ],
          ),
        ),
      ),
    );
  },
);
```

---

## Apéndice B — Checklists combinados

### B.1 Arquitectura (de §1.3) — 8 pasos
- [ ] Domain Models (freezed) → Services → Repositories → Use Cases (si aplica) → ViewModel (ChangeNotifier) → View (ListenableBuilder) → DI → Tests

### B.2 Responsive (de §2.4 + §2.5)
- [ ] LayoutBuilder + AppBreakpoints → large vs small → ConstrainedBox+Center en large → GridView.builder para listas → AppSpacing tokens

### B.3 Layout Fix (de §3.2)
- [ ] Debug → identificar firma §3.1 → fix condicional (Expanded/SizedBox/Flexible/ParentData) → hot reload → validar rayas desaparecen

### B.4 Optimize — Audit 5 fases (de §4.19)
- [ ] Analyze (`flutter analyze`) → Widgets (const, builders, RepaintBoundary) → State (select vs watch) → Memory (dispose, mounted) → Build (obfuscate, split-debug-info, clean)

### B.5 Premium (de §5)
- [ ] No pure Colors.blue/red/green → FlexColorScheme + Material3 → GoogleFonts con hierarchy → 8dp AppSpacing → no default Card → glassmorphism solo con RepaintBoundary → shimmer no CircularProgressIndicator → InteractiveButton con haptics → AnimatedSwitcher para state transitions

### B.6 Checklist maestro — Pantalla completa

Para feature nuevo que toque todo:

1. Estructura (§1): define domain, service, repo, VM, view, DI
2. Premium tokens (§5 + Apéndice A): aplica AppSpacing, AppRadius, typography, theme
3. Responsive (§2): LayoutBuilder + AppBreakpoints + ConstrainedBox
4. Fix (§3): verifica no hay overflow/unbounded
5. Optimize (§4): audit const, rebuilds, images, dispose, bundle size
6. Profiling (§4.18): `flutter run --profile` + DevTools

---

## Referencias cruzadas

| Si estás en | Y necesitas | Ve a |
|---|---|---|
| §1 ViewModel con async | `mounted` check + dispose | §4.6 |
| §1 View con lista | Lazy builders | §4.1.3 (canónico) |
| §2 Space measurement | Costo MediaQuery vs LayoutBuilder | §4.13.3 |
| §2 Large screens | Tokens spacing | Apéndice A + §5.3 |
| §2 Adaptive layout | Fix overflow | §3 |
| §3 Expanded/Flexible | Foundations completas | §2.1 |
| §4 RepaintBoundary | Ejemplo InteractiveButton | §5.5 |
| §4 Opacity/BackdropFilter | Cuándo usar glassmorphism | §5.1 |
| §5 Glassmorphism | Costo performance | §4.1.5 |
| §5 Shimmer/AnimatedSwitcher | Widgets animados | §4.7.2 |
| §5 Spacing hardcode | Token estándar | Apéndice A |
| §5 Breakpoints | Definición única | Apéndice A.2 |

---

## Notas de migración

- Las 5 skills originales se mantienen temporalmente para compatibilidad. `flutter-pro` las reemplaza — `replaces` en frontmatter.
- Si tu `AGENTS.md` lista skills, reemplazar las 5 entradas por `flutter-pro`.
- Para triggers legacy (`skill({id: "flutter-optimize-code"})`) — mantener shims o actualizar call a `flutter-pro` con routing automático.
- Validación: `SKILL.md` debe tener ~950 líneas, 0 duplicaciones de §2.2, frontmatter válido, y todos los ejemplos compilan con `flutter analyze`.
