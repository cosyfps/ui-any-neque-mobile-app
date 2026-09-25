# Contribuir a Ñeque

Guía de trabajo del repositorio: cómo se organiza el backlog, cómo se nombran las ramas,
cómo se escriben los commits y qué tiene que pasar antes de mergear.

---

## Jerarquía del backlog

| Nivel        | Qué es                                               | ¿Tiene rama? |
| ------------ | ---------------------------------------------------- | ------------ |
| **Épica**    | Objetivo macro. Agrupa historias.                    | No           |
| **Historia** | Agrupación lógica de tickets. Entrega una capacidad. | No           |
| **Ticket**   | Unidad micro de trabajo. Resuelve un issue concreto. | **Sí**       |

La regla central: **1 ticket = 1 rama = 1 PR**. Un ticket puede tener varios commits.
Si un ticket no cabe en un PR revisable, está mal dimensionado — divídelo.

**Excepción — tickets que comparten archivos.** Cuando los tickets de una misma historia
tocan los mismos archivos y no se pueden aislar en commits separados sin `git add -p`, se
trabaja **una rama por historia** con un commit por ticket. Fue el caso de las Épicas 7 y
8: separar `_mixins.scss` obligaba a tocar los mismos `.scss` que se estaban renombrando.
Documenta la agrupación en el tablero del backlog.

**Excepción — tickets sin cambio de lógica.** Los tickets que solo tocan documentación,
plantillas de GitHub o configuración del repositorio (`CONTRIBUTING.md`, `docs/BACKLOG.md`,
`.github/`, `README.md`) se trabajan **directo sobre `develop`**, sin rama propia. No
introducen riesgo de regresión y fragmentarlos en ramas solo agrega ruido. Todo ticket que
toque `src/`, `package.json`, `angular.json` o los workflows de CI sí necesita su rama.

El backlog completo vive en [`docs/BACKLOG.md`](docs/BACKLOG.md).

---

## Ramas

```
main ────────────────────────────────────────────────●──── tag v1.0.0
                                                    ╱
release/1.0.0 ──────────────────────────────────────●
                                                   ╱
develop ──●───●───●───●───●───●───●───●───●───●──
          ╱   ╱   ╱   ╱   ╱   ╱   ╱   ╱   ╱
   feat/NEQUE-0.2.1 … feat/NEQUE-6.1.1
```

| Rama        | Rol                                                              |
| ----------- | ---------------------------------------------------------------- |
| `main`      | Producción. Solo recibe merges desde `release/*` o `hotfix/*`.   |
| `develop`   | Integración. Todos los tickets apuntan aquí.                     |
| `<tipo>/…`  | Rama de ticket. Nace de `develop` y vuelve a `develop`.          |
| `release/*` | Corte de versión. Nace de `develop`, mergea a `main` y se tagea. |
| `hotfix/*`  | Urgencia en producción. **Única rama que nace de `main`.**       |

> `main` y `develop` existen en GitHub y **ambas están protegidas**: required check
> `ci-gate`, PR obligatorio y sin force-push ni borrado de rama. Todo ticket parte de
> `develop`.

### Nomenclatura

```
<tipo>/NEQUE-<épica>.<historia>.<ticket>-<slug-en-kebab-case>
```

Ejemplos:

```
feat/NEQUE-1.2.1-wire-start-page-login
fix/NEQUE-0.3.3-dedupe-state-divider-classes
test/NEQUE-0.2.2-start-page-specs
ci/NEQUE-0.2.5-harden-ci-gate
```

El `<tipo>` usa los mismos valores que acepta commitlint:
`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `revert`.

---

## Commits

Conventional Commits, validados por `commitlint` en el hook `commit-msg`.

```
<tipo>(<scope>): <descripción en imperativo>
```

- El `<tipo>` viene de la lista de arriba (`commitlint.config.js`, `type-enum`).
- El subject no puede pasar de **72 caracteres** (`subject-max-length`).
- Varios commits por ticket están bien y son deseables: cuentan la historia del cambio.

```
feat(auth): conectar login al BFF
fix(dashboard): liberar el temporizador de reintento en ngOnDestroy
test(start): cubrir las reglas de validación de password
```

Los hooks de Husky corren automáticamente:

- `pre-commit` → `lint-staged` (ESLint `--fix` sobre `.ts`, Prettier sobre `.ts/.html/.scss/.json/.md`)
- `commit-msg` → `commitlint`

---

## Flujo de un ticket

```bash
git checkout develop && git pull
git checkout -b feat/NEQUE-1.2.1-wire-start-page-login
```

Trabaja, commitea las veces que haga falta, y antes de abrir el PR:

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:coverage && npm run build:prod
```

```bash
git push -u origin feat/NEQUE-1.2.1-wire-start-page-login
```

```bash
gh pr create --base develop --title "feat(auth): conectar login al BFF"
```

El cuerpo del PR se rellena solo con `.github/pull_request_template.md`; completa sus
secciones y marca las validaciones que corriste. Los issues se abren desde las plantillas
de `.github/ISSUE_TEMPLATE/` (bug, feature o tarea de backlog).

---

## Política de merge

| Destino              | Estrategia                   | Por qué                                  |
| -------------------- | ---------------------------- | ---------------------------------------- |
| ticket → `develop`   | **Merge normal (`--no-ff`)** | Preserva los commits del ticket.         |
| `develop` → `main`   | **Merge normal**             | Bootstrap del gitflow (ver abajo).       |
| `release/*` → `main` | **Merge normal**             | El corte de versión queda explícito.     |
| `main` → `develop`   | Back-merge tras cada release | Evita que `develop` quede atrás del tag. |

**No se hace squash.** **No se hace push directo a `main` ni a `develop`** — solo mediante
merges de PR.

### Bootstrap del gitflow

El primer PR real del proyecto es **`develop` → `main`** (ticket T-0.1.7) y lleva la
infraestructura del flujo: plantillas de GitHub, `CODEOWNERS`, `CONTRIBUTING.md`,
`README.md` y `docs/BACKLOG.md`. Sirve para dejar ambas ramas alineadas y validar que `ci-gate` corre y
bloquea correctamente antes de que entre trabajo de producto. A partir de ahí, `main`
solo recibe merges desde `release/*` o `hotfix/*`.

---

## Reglas de merge

Un PR puede mergear cuando:

1. El check **`ci-gate`** está en verde. Es el único required check pensado para branch
   protection: agrega `dependencies`, `lint`, `typecheck`, `test` y `build`, y falla si
   cualquiera de ellos termina en `failure`, `cancelled` o `skipped`.
2. El PR usa la plantilla de `.github/pull_request_template.md`, cierra su issue
   (`Closes #NN`) y adjunta evidencia si toca UI.

**No se exigen aprobaciones.** GitHub no permite aprobar tu propio PR, así que en un repo
de una sola persona pedir una aprobación bloquearía todos los merges. Lo que protege de
verdad es la combinación de PR obligatorio + `ci-gate`. Si más adelante entran
colaboradores, subir el número es cambiar un campo.

Esto **sí está exigido técnicamente**: la branch protection de `main` y `develop` rechaza
el push directo y el merge sin `ci-gate` en verde. `enforce_admins` queda en `false` a
propósito, para que el owner pueda commitear directo sobre `develop` los tickets sin
cambio de lógica (documentación, plantillas, configuración del repo).

### Sobre el gate de coverage

El threshold es **80% en cada una de las 4 métricas** (líneas, statements, funciones,
ramas), no en su promedio: `coverageThreshold.global` de Jest hace fallar
`npm run test:coverage` si cualquiera se queda corta.

El paso "Verify coverage threshold" de `ci.yml` aplica el mismo criterio: lee
`coverage/coverage-summary.json`, verifica que cada métrica sea un número finito y compara
**una por una** contra el 80%. Si el reporte trae valores no numéricos — es lo que emite
Istanbul cuando no hay ni un spec — el paso falla en vez de dejarlo pasar.

La consecuencia práctica: un ticket que agrega código **no puede dejar su spec para
después** — el gate lo rechazaría. Por eso no hay tickets sueltos de
"escribir tests"; el `.spec.ts` es parte del Definition of Done de cada ticket de código.

---

## Convenciones de código

- **Angular 17 standalone.** Sin NgModules.
- **Templates inline** (`template:` en el decorador) con **SCSS externo** (`styleUrl`).
  Es la convención del repo: no hay ni un `.html` en `src/`.
- **Signals** (`signal`, `computed`, `toSignal`) para estado, no `BehaviorSubject`.
- **Sin Tailwind.** El sistema visual son los tokens CSS y los mixins de
  `src/app/ui/shared/theme/`. Extiéndelo, no lo rediseñes.
- `tsconfig.json` corre en modo estricto con `noUncheckedIndexedAccess` y
  `noPropertyAccessFromIndexSignature`: todo acceso indexado devuelve `T | undefined`.
- `no-explicit-any` es **error**, no warning.

### Arquitectura hexagonal por `{capa}/{feature}`

```
src/app/
├── domain/{feature}/          modelos + puertos (interfaz + InjectionToken)
├── application/{feature}/     facades con signals (casos de uso)
├── infrastructure/{feature}/  adapters (mock hoy, HTTP-BFF después) + seeds
└── ui/{feature}/              páginas y componentes
    └── shared/                theme/, components/, guards/, validators/, pages/
```

No hay vertical slicing: la división por capa permite que un caso de uso componga
puertos de varias features sin duplicar código ni crear dependencias entre slices.

**Regla de dependencias** — el lint no la verifica todavía, respétala a mano:

| Capa              | Puede importar de         | Nunca importa de                                |
| ----------------- | ------------------------- | ----------------------------------------------- |
| `domain/`         | solo de `domain/`         | application, infrastructure, ui                 |
| `application/`    | `domain/`                 | infrastructure, ui                              |
| `infrastructure/` | `domain/`                 | application, ui                                 |
| `ui/`             | `domain/`, `application/` | infrastructure, salvo los `provide*()` en rutas |

Reglas que se pagan caro si se rompen:

- **Los puertos devuelven `Observable<T>`**, nunca `Promise`. Así el adapter HTTP del BFF
  encaja sin cambiar ninguna firma.
- **Todo estado asíncrono vive en un `AsyncState<T>`** (`application/shared`). Las páginas
  no crean signals de `loading` ni `error`: leen `facade.viewState()`.
- **Una facade puede inyectar varios puertos y una sola otra facade: `SessionFacade`.**
  Cualquier otro facade→facade abre ciclos.
- **Una facade que use puertos de ruta no puede ser `providedIn: 'root'`.** Se registra
  junto a sus adapters en los `providers` de esa ruta, o revienta con `NullInjectorError`
  en tiempo de ejecución.
- **Los `providers` de una feature van en UNA sola ruta contenedora.** Dos `providers`
  hermanos crean dos injectores y por tanto dos juegos de adapters, con estado partido.
- **Nada llama a `new Date()` directo**: se inyecta el puerto `CLOCK`, para que los tests
  fijen la hora sin fake timers.

### Patrón de página

Toda página resuelve sus estados con un único `@switch` sobre la facade:

```
@switch (facade.viewState()) {
  @case ('loading') { <nq-page-state type="loading" /> }
  @case ('error')   { <nq-page-state type="error" [retry]="reload" /> }
  @case ('empty')   { <nq-page-state type="empty" title="…" message="…" /> }
  @case ('success') { …contenido… }
}
```

`reload` se declara como **campo arrow** (`reload = () => this.facade.reload();`): el
input `[retry]` es `() => void` y `strictTemplates` no acepta un método desbindado.

Dos contratos del design system que no son obvios:

- Un componente que renderice `<ion-content>` necesita `host: { class: 'ion-page' }`.
  Sin ese ancestro, `ion-content` queda con altura 0 y la pantalla se ve en blanco.
- `.nq-overlay` arranca en `opacity: 0; pointer-events: none` y solo se muestra con la
  clase `.open`. Mantén el overlay en el DOM y conmuta `[class.open]`; con `@if` sin esa
  clase el modal queda invisible y sin eventos.

### Design tokens

Los colores, radios, sombras y espaciados son variables CSS con prefijo `--nq-*`
declaradas en `src/app/ui/shared/theme/_palette.scss`. **Nunca hardcodees un color en un
componente.** Si necesitas un valor que no existe, agrégalo al palette en su propio
ticket. No hay ningún rename de prefijo planeado — `--nq-*` es el nombre definitivo.

El theme está partido en cuatro parciales y **cuál importas importa**:

| Parcial            | Qué tiene                          | Quién lo importa                   |
| ------------------ | ---------------------------------- | ---------------------------------- |
| `_palette.scss`    | tokens `--nq-*`                    | `styles.scss`                      |
| `_fonts.scss`      | `@font-face` de Inter              | `styles.scss`                      |
| `_utilities.scss`  | animaciones, skeletons, utilidades | `styles.scss`                      |
| `_components.scss` | **clases globales**, emite CSS     | `styles.scss`, **una sola vez**    |
| `_mixins.scss`     | solo `@mixin`, no emite CSS        | las páginas que necesiten un mixin |
| `_shell.scss`      | mixin `nq-shell` del tab bar       | los layouts de entrenador y alumno |

Una página que haga `@use` de `_components.scss` duplica ~10 kB de CSS global dentro de
su estilo scopeado y revienta el budget de 8 kB por componente. Usa `_mixins.scss`.

#### `--nq-primary` no sirve para texto

`--nq-primary` (#2cb5a0) es la marca y da **2.55:1** contra blanco: no pasa AA ni como
texto ni como fondo con label blanco encima. Para eso existe `--nq-primary-strong`
(#0f766e), que da 5.50:1 en ambos sentidos.

> **Si encima va contenido —texto o icono— o el color _es_ el contenido, usa
> `--nq-primary-strong`. Si es decorativo —barras de avance, relleno de gráficos, tintes
> al 8–18%—, usa `--nq-primary`.**

Lo mismo con `--nq-gradient-*`, que es decorativo y da 1.45:1 en su tramo claro, frente a
`--nq-gradient-strong-*`, que sí admite texto blanco.

**El fondo de referencia no es blanco.** Las pantallas del alumno se pintan sobre
`--nq-surface` (#f7faf9), así que un token que da 4.6:1 contra blanco puede quedarse en
4.4:1 sobre la superficie. Mide contra el fondo real, no contra `#fff`.

#### Mínimo táctil de 44×44

Todo control interactivo llega a 44×44. Los que deben verse más pequeños —un check de
24px, el botón de borrar sobre una miniatura— usan el mixin `nq-tap-halo`, que amplía el
área de toque con un pseudo-elemento sin tocar el tamaño visual.

#### Accesibilidad mínima de una pantalla nueva

| Requisito                  | Cómo se cumple                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Foco de teclado visible    | Ya hay una regla global `:focus-visible`. No pongas `outline: none` sin reponerlo.                        |
| Cambios de estado audibles | `<nq-page-state>` ya trae `role="status"`/`role="alert"`. Si haces tu propio estado, decláralos.          |
| Movimiento reducido        | `_utilities.scss` ya anula animaciones bajo `prefers-reduced-motion`. No la esquives con `!important`.    |
| Bottom sheets              | Todo `.nq-overlay` con controles usa `nqSheetTrap`: foco al abrir, trampa de `Tab` y cierre con `Escape`. |
| Botones de solo icono      | `aria-label`, y que cambie con el estado si el control alterna.                                           |
| `role="progressbar"`       | Siempre con `aria-label`, `aria-valuemin`, `aria-valuemax` y `aria-valuenow`.                             |
| Títulos de sección         | `<h2>` con `.nq-section-title`, no `<span>`.                                                              |

Un `aria-label` en un `<span>` sin rol **lo ignoran los lectores de pantalla**. Si el
elemento comunica algo, dale un rol (`role="img"` para un punto de estado, por ejemplo).

### Nombrado

Archivos en `kebab-case` con sufijo de tipo: `.page.ts`, `.component.ts`, `.service.ts`,
`.model.ts`, `.spec.ts`. Ejemplos: `dashboard.page.ts`, `page-state.component.ts`.

| Elemento                    | Convención                              |
| --------------------------- | --------------------------------------- |
| Clases                      | `PascalCase` con sufijo (`AuthService`) |
| Interfaces y types          | `PascalCase` (`Client`, `Routine`)      |
| Variables y propiedades     | `camelCase`                             |
| Selector de página          | prefijo `app-` (`app-dashboard`)        |
| Selector de shared reusable | prefijo `nq-` (`nq-page-state`)         |

### Normalización de strings

Aplica **solo a strings dentro de código TypeScript**: logs, mensajes de error y nombres de
tests (`it('...')`, `describe('...')`).

- No uses tildes ni eñe en esos strings. Reemplaza: á→a, é→e, í→i, ó→o, ú→u, ñ→n.
- **No aplica** a la documentación Markdown (este archivo, `README.md`, `docs/`), que debe
  usar ortografía correcta en español.
- **No aplica** al texto visible en los templates (hoy en inglés — "Welcome Back!", "Log
  In" — o con tildes cuando corresponde, como el saludo de `DashboardPage`), que sigue el
  idioma del diseño de cada pantalla, no esta regla.

El motivo es evitar inconsistencias de encoding entre entornos (CI, terminales) en strings
que se procesan en runtime.

---

## Testing

- Jest con `jest-preset-angular`, configurado inline en `package.json`. Setup en
  `setup-jest.ts`.
- Los specs viven junto al archivo que prueban: `start.page.spec.ts` al lado de
  `start.page.ts`.
- Prueba comportamiento observable — signals computados, salida del template, handlers —,
  no detalles internos de implementación.
- Los nombres de tests van sin tildes (ver normalización de strings, arriba).
- **Patrón por defecto: unit de clase.** Las páginas se instancian con
  `TestBed.runInInjectionContext(() => new XPage())`, sin renderizar la plantilla. Evita
  montar los custom elements de Ionic en jsdom y deja los tests rápidos y estables.
  `start.page.spec.ts` y `forgot-password.page.spec.ts` son la referencia a copiar.
- Renderiza con `TestBed.createComponent` solo cuando el test necesite el DOM — por
  ejemplo `page-state.component.spec.ts`. `@testing-library/angular` está disponible para
  esos casos.
- Para timers (countdown de reenvío, temporizador de descanso) usa `jest.useFakeTimers()`
  y devuelve el control con `jest.useRealTimers()` en `afterEach`.

### Patrón por capa

| Capa              | Cómo se prueba                                                                                                                                | Referencia                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `domain/`         | Llamada directa a la función pura. Sin TestBed, sin mocks.                                                                                    | `weekly-progress.spec.ts`        |
| `application/`    | `TestBed` con los **puertos stubeados** devolviendo `of(...)` / `throwError(...)`. Nunca el adapter real: evita los `delay()`.                | `workout.facade.spec.ts`         |
| `infrastructure/` | Adapter real con `jest.useFakeTimers()` y `jest.runAllTimers()` para saltar la latencia simulada.                                             | `workouts.mock-adapter.spec.ts`  |
| `ui/` páginas     | Unit de clase con la facade stubeada o con puertos stubeados. `jest.spyOn(router, 'navigate')` siempre: el router de prueba no declara rutas. | `student-home.page.spec.ts`      |
| `ui/` componentes | **Renderizado** con `TestBed.createComponent` y `componentRef.setInput()`. Es la unica forma de fijar un `input()` señal.                     | `workout-card.component.spec.ts` |

Los componentes compartidos son la excepcion a la regla de no renderizar. Usan `input()`
de Angular 17, y un input señal **no se puede asignar sobre una instancia suelta**: la
unica API publica es `componentRef.setInput()`, que exige un `createComponent`. Son
componentes de presentacion sin dependencias, asi que el costo es minimo y de paso el
spec ve el DOM. Las **paginas** siguen siendo unit de clase.

Dos detalles que ahorran tiempo:

- Si un test necesita reconfigurar el TestBed después de haberlo instanciado, llama a
  `TestBed.resetTestingModule()` antes de `configureTestingModule`.
- Una facade que la página declara en sus propios `providers` (como `WorkoutRunnerFacade`)
  hay que proveerla a mano en el spec.

### Lo que estos tests no ven

El patrón unit de clase no renderiza plantillas, así que **no detecta fallos de layout,
de CSS ni de composición de rutas**. Dos bugs reales pasaron los 714 tests: páginas con
altura 0 por falta de `.ion-page`, y modales invisibles por falta de `.open`. Antes de
cerrar una HU con pantalla nueva, ábrela en el navegador a 375×812 y míralas.

Tampoco ven **contraste ni tamaño táctil**. La auditoría de la Épica 11 encontró CTA con
texto blanco a 1.45:1 y la acción principal de «Mi rutina» en un target de 24×24, con los
751 tests en verde. Ábrela además a **320×568**: ahí salieron dos pantallas que se
recortaban sin posibilidad de desplazarse.

Y no ven el **orden de foco**. Recorre la pantalla solo con `Tab` antes de cerrarla: cada
parada tiene que verse y tener nombre.

```bash
npm run test:coverage
```

```bash
npx jest src/app/ui/auth/start/start.page.spec.ts
```

---

## Release

```bash
git checkout -b release/1.0.0 develop
# bump de versión + CHANGELOG
```

PR de `release/1.0.0` → `main`, merge normal, y luego:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

El tag dispara `release.yml`, que reutiliza el pipeline de CI y construye el APK de
Android y el archive de iOS. **Requiere que `android/` e `ios/` existan** — hoy no existen
(`npx cap add` nunca se corrió; ver backlog, Épica 6, T-6.2.1/T-6.2.2) y el workflow
fallaría si se dispara tal cual está. Cierra con el back-merge de `main` a `develop`.
