# ui-any-neque-mobile-app

**Ñeque** — app móvil híbrida para entrenadores personales. El MVP cubre acceso
(invitation-only), recuperación de contraseña y un panel de entrenador con dashboard,
gestión de clientes, rutinas y perfil, empaquetada para Android e iOS con Capacitor.

> **Estado actual: fundación en construcción.** Lo único funcional hoy es la UI de login
> (sin backend conectado), la recuperación de contraseña (simulada) y un dashboard de
> entrenador con métricas placeholder. Las rutas `/trainer/clients`, `/trainer/routines` y
> `/trainer/profile` son alias temporales que cargan el mismo `DashboardPage`: los módulos
> reales todavía no existen. Antes de construirlos hay que cerrar la Épica 0 del backlog:
> hoy no existe ni un `.spec.ts` pese al gate de cobertura del 80%, y `develop` todavía no
> está publicada en GitHub (solo `main` existe en el remoto). Consulta
> [`docs/BACKLOG.md`](docs/BACKLOG.md) para el detalle completo.

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Inicio rápido](#inicio-rápido)
- [Arquitectura](#arquitectura)
- [Sistema visual](#sistema-visual)
- [Rutas](#rutas)
- [Prerrequisitos](#prerrequisitos)
- [Scripts disponibles](#scripts-disponibles)
- [Secuencia de validación](#secuencia-de-validación)
- [Variables de entorno](#variables-de-entorno)
- [CI/CD](#cicd)
- [Testing](#testing)
- [Backlog](#backlog)
- [Equipo](#equipo)
- [Contribución](CONTRIBUTING.md)

## Stack tecnológico

| Categoría   | Tecnología                                                                     |
| ----------- | ------------------------------------------------------------------------------ |
| Runtime     | Node 22 (el que fija CI en `ci.yml`)                                           |
| Framework   | Angular 17 — standalone components + signals, sin NgModules                    |
| UI móvil    | Ionic 8 (`@ionic/angular` / `@ionic/angular/standalone`)                       |
| Nativo      | Capacitor 6: `android`, `ios`, `core`, `camera`, `push-notifications`, `share` |
| Iconos      | `@lucide/angular` 1.20, importados uno a uno como directivas; `ionicons` 7     |
| Estilos     | SCSS puro con design tokens propios. **Sin Tailwind ni PostCSS.**              |
| Formularios | `ReactiveFormsModule`                                                          |
| Testing     | Jest 29 + `jest-preset-angular` 14 + `@testing-library/angular` 16             |
| Calidad     | ESLint 8 (`--max-warnings 0`) + Prettier 3 + Husky 9 + commitlint 19           |
| CI/CD       | GitHub Actions                                                                 |

Las dependencias de Capacitor `camera`, `push-notifications` y `share` están instaladas
pero **sin ningún código que las use todavía** — quedaron como base para features futuras.

## Inicio rápido

1. Clona el repositorio y sitúate en la rama de integración:

   ```bash
   git checkout develop
   ```

   > Si `develop` no existe todavía en tu remoto, es porque el ticket T-0.1.1 del backlog
   > (recrearla y publicarla) no ha cerrado. Mientras tanto, parte de `main`.

2. Instala dependencias:

   ```bash
   npm ci
   ```

3. Levanta el servidor de desarrollo:

   ```bash
   npm start
   ```

   Angular sirve la app en `http://localhost:4200`.

4. Valida calidad mínima antes de empezar a cambiar cosas:

   ```bash
   npm run lint
   ```

   ```bash
   npm run typecheck
   ```

   ```bash
   npm test
   ```

No hace falta configurar credenciales para levantar el MVP hoy: no hay ningún servicio
externo conectado (`supabaseUrl`/`supabaseAnonKey` están vacíos y sin consumir).

## Arquitectura

Aplicación Angular standalone con rutas lazy. No hay NgModules ni carpeta de features:
las pantallas viven en `src/app/pages/` y lo reutilizable en `src/app/shared/`.

```
src/
├── main.ts                              # bootstrapApplication + appConfig
├── index.html
├── styles.scss                          # estilos globales + import del theme
├── environments/                        # environment.ts / environment.prod.ts
└── app/
    ├── app.component.ts                 # shell: <ion-app><ion-router-outlet>
    ├── app.config.ts                    # provideRouter, provideIonicAngular
    ├── app.routes.ts                    # rutas top-level con loadComponent
    ├── pages/
    │   ├── start/                       # StartPage: landing + login como panel deslizante
    │   ├── forgot-password/             # ForgotPasswordPage: flujo de 2 pasos, email -> OTP
    │   └── trainer/
    │       ├── trainer-layout.page.ts   # TrainerLayoutPage: shell + bottom tab bar
    │       └── dashboard/
    │           └── dashboard.page.ts    # DashboardPage: saludo, metricas placeholder, accesos rapidos
    └── shared/
        ├── components/
        │   └── page-state.component.ts  # nq-page-state: loading/error/empty/offline
        └── theme/
            ├── _palette.scss            # design tokens --nq-*
            ├── _components.scss         # mixins + clases globales
            └── _utilities.scss          # keyframes, skeletons, layout helpers
```

**`clients`, `routines` y `profile` no son carpetas propias todavía**: en
`app.routes.ts`, `/trainer/clients`, `/trainer/routines` y `/trainer/profile` cargan el
mismo `DashboardPage` como placeholder. No existen `models/`, `services/` ni `mocks/`
bajo `shared/` — se agregan cuando entren esos módulos (ver backlog, Épicas 2 y 3).

### Convenciones

- Todos los componentes son **standalone**, con import explícito de cada pieza usada.
- Las páginas usan **template inline** (`template:` en el decorador) con **SCSS externo**
  (`styleUrl`). No hay ni un `.html` en `src/`.
- Control flow moderno (`@if`, `@for`, `@switch`), no `*ngIf` / `*ngFor`.
- Estado con **signals** (`signal`, `computed`, `toSignal`). RxJS solo para streams
  externos (eventos del router, `valueChanges`), siempre con `takeUntilDestroyed`.
- Patrón de estado de página: un signal `'loading' | 'error' | 'empty' | 'success'` con un
  `@switch` que delega los estados no-success en `<nq-page-state>` (ver
  `dashboard.page.ts`, aunque hoy el signal está fijo en `'success'`).
- TypeScript en modo estricto, con `noUncheckedIndexedAccess` — todo acceso indexado
  devuelve `T | undefined`. `no-explicit-any` es error, no warning.

### Path aliases

Declarados en `tsconfig.json` — **hoy ningún import los usa**, todos son relativos:

```
@app/*    -> src/app/*
@env/*    -> src/environments/*
@shared/* -> src/app/shared/*
```

## Sistema visual

No hay framework de CSS. El sistema son design tokens propios como custom properties con
prefijo `--nq-*`:

| Archivo                         | Qué contiene                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `shared/theme/_palette.scss`    | Tokens: color, radios, sombras, transiciones, tipografía, layout             |
| `shared/theme/_components.scss` | Mixins (`nq-btn-gradient`, `nq-field-base`, `nq-nav-back`) y clases globales |
| `shared/theme/_utilities.scss`  | Keyframes, skeletons, spacing/flex/typography helpers                        |

Piezas que ya existen y hay que consumir en vez de reinventar: los mixins
`nq-btn-gradient`, `nq-field-base` y `nq-nav-back`; las clases `.nq-card`, `.nq-search`,
`.nq-badge*`, `.nq-avatar`, `.nq-tabs`/`.nq-tab`, `.nq-overlay`/`.nq-sheet*`,
`.nq-state*`, `.nq-skeleton-*` y `.nq-scroll`; y las animaciones `.nq-ani` + `.nq-d1..d4`.

**Nunca hardcodees un color en un componente.** Si falta un valor, agrégalo al palette en
su propio ticket.

Dos deudas conocidas del sistema visual (ver backlog, HU-0.3):

- `'Inter'` está declarado en `--nq-font-family` pero **nunca se carga** — sin
  `@font-face`, sin `<link>` en `index.html`, `src/assets/` vacío salvo `.gitkeep`.
- `.nq-state`, `.nq-state-icon`, `.nq-state-title`, `.nq-state-desc` y `.nq-divider` están
  **duplicados con valores distintos** entre `_components.scss` y `_utilities.scss`.

## Rutas

| Ruta                 | Componente              | Qué es                                                       |
| -------------------- | ----------------------- | ------------------------------------------------------------ |
| `/`                  | `StartPage`             | Landing + login como panel deslizante                        |
| `/forgot-password`   | `ForgotPasswordPage`    | Recuperación en 2 pasos: email → OTP                         |
| `/trainer`           | `TrainerLayoutPage`     | Shell con bottom tab bar (Dashboard/Clientes/Rutinas/Perfil) |
| `/trainer/dashboard` | `DashboardPage`         | Saludo, métricas placeholder ("—"), accesos rápidos          |
| `/trainer/clients`   | `DashboardPage` (alias) | Placeholder — pendiente módulo real de clientes              |
| `/trainer/routines`  | `DashboardPage` (alias) | Placeholder — pendiente módulo real de rutinas               |
| `/trainer/profile`   | `DashboardPage` (alias) | Placeholder — pendiente perfil real                          |

Todas se cargan con `loadComponent` (lazy). **No existe una `LoginPage`**: el login es un
panel dentro de `StartPage`. **No hay ningún guard**: `/trainer` es accesible sin sesión.

## Prerrequisitos

- **Node.js 22** o superior (es la versión que usa CI).
- **npm** — el proyecto usa `package-lock.json`; instala con `npm ci`, no `npm install`.
- Para builds nativos, **Android Studio** (Android) y **Xcode** (iOS). Las carpetas
  `/android` y `/ios` no están en el repo: las genera `npx cap add` (pendiente, ver
  backlog Épica 6).

## Scripts disponibles

| Comando                 | Descripción                                   |
| ----------------------- | --------------------------------------------- |
| `npm start`             | Servidor de desarrollo (`ng serve`)           |
| `npm run build`         | Build de desarrollo                           |
| `npm run build:prod`    | Build de producción                           |
| `npm run lint`          | ESLint con `--max-warnings 0`                 |
| `npm run lint:fix`      | ESLint con autofix                            |
| `npm run format`        | Prettier `--write` sobre ts/html/scss/json/md |
| `npm run format:check`  | Prettier `--check`                            |
| `npm run typecheck`     | `tsc --noEmit`                                |
| `npm test`              | Jest (`--passWithNoTests`)                    |
| `npm run test:watch`    | Jest en watch mode                            |
| `npm run test:coverage` | Jest con cobertura (threshold 80%)            |
| `npm run cap:sync`      | `npx cap sync`                                |
| `npm run cap:build`     | `build:prod` + `npx cap copy`                 |

## Secuencia de validación

Ejecutar en este orden antes de abrir un PR. Es exactamente lo que valida `ci-gate`:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm run test:coverage
```

```bash
npm run build:prod
```

`lint` y `typecheck` pasan limpio hoy. `test:coverage` **no** — no hay ni un `.spec.ts`
(ver [Testing](#testing)) — y `build:prod` sí compila.

## Variables de entorno

Angular resuelve la configuración en `src/environments/`, no con archivos `.env`.

| Clave             | Valor hoy               | Estado                                                         |
| ----------------- | ----------------------- | -------------------------------------------------------------- |
| `production`      | `false` / `true`        | Activo. Distingue el build de desarrollo del de producción.    |
| `supabaseUrl`     | `''`                    | Declarado pero sin consumir; nada lo importa todavía.          |
| `supabaseAnonKey` | `''`                    | Igual que el anterior.                                         |
| `flowApiUrl`      | sandbox/prod de Flow.cl | Declarado y sin consumir; no hay ninguna feature de pagos hoy. |

`supabaseUrl`/`supabaseAnonKey` vacíos son la única pista de que **Supabase** era el
backend planeado — ningún servicio los usa todavía (ver backlog, Épica 1).

⚠️ `angular.json` **no declara `fileReplacements`**, así que `environment.prod.ts` es
código muerto: un build de producción sigue usando el `environment.ts` de desarrollo. Lo
arregla el ticket T-0.3.1.

## CI/CD

- **`ci.yml`** — pipeline en cada push y PR a `main` o `develop`:

  ```
  dependencies → lint + typecheck → test (coverage) → build → ci-gate
  ```

  `ci-gate` es el único check pensado para branch protection: agrega
  `needs.*.result` de todos los jobs anteriores y falla si alguno matchea
  `/failure|cancelled/` (no contempla `skipped` explícitamente).

  ⚠️ **Falso verde activo hoy**: el step "Verify coverage threshold" lee
  `coverage/coverage-summary.json` y promedia las 4 métricas. Con cero specs, esas 4
  métricas son el string `"Unknown"` (confirmado corriendo `npm run test:coverage`
  localmente), el promedio da `NaN`, y `NaN < 80` es `false` en JavaScript — el step
  imprime `OK: Coverage NaN% >= 80%` y pasa. Lo arregla T-0.2.5.

- **`release.yml`** — se dispara con tags `v[0-9]+.[0-9]+.[0-9]+`. Corre `ci.yml` como
  validación, construye Android con Gradle e iOS con `xcodebuild archive` (sin firma) vía
  Capacitor, y publica un GitHub Release. **Asume que existen `android/` e `ios/`** —
  ambas carpetas están en `.gitignore` y `npx cap add` nunca se ha corrido, así que hoy
  este workflow fallaría si se dispara (ver backlog, Épica 6).

## Testing

Jest configurado inline en `package.json` (no hay `jest.config.js`), con setup en
`setup-jest.ts` (una línea: `import 'jest-preset-angular/setup-jest'`).

**Hoy no existe ni un `.spec.ts` en todo `src/`.** El threshold de cobertura sigue
declarado en 80% en las 4 métricas (`coverageThreshold.global` de Jest), así que
`npm run test:coverage` corre, no encuentra tests, y termina con
`No tests found, exiting with code 0` gracias a `--passWithNoTests`.

`collectCoverageFrom` excluye `*.module.ts`, `*.routes.ts`, `main.ts` y `environments/**`.

`tsconfig.spec.json` todavía tiene `"types": ["jasmine"]` pese a que el runner real es
Jest — residuo de una configuración anterior con Karma, sin corregir (ver T-0.2.1).

```bash
npm run test:coverage
```

```bash
npx jest src/app/pages/start/start.page.spec.ts
```

## Backlog

El trabajo pendiente está descompuesto en épicas → historias → tickets en
[`docs/BACKLOG.md`](docs/BACKLOG.md), con un tablero de ejecución que lleva el estado de
cada ticket.

## Equipo

Proyecto académico de **DuocUC**.

**Desarrollo:**

- Kelvin A. Moreno ([@cosyfps](https://github.com/cosyfps))

## Contribución

El flujo de trabajo — gitflow, nomenclatura de ramas, formato de commits y política de
merge — está en [`CONTRIBUTING.md`](CONTRIBUTING.md). Léelo antes del primer PR.
