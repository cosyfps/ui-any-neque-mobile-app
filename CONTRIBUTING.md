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

> **Estado real hoy:** en GitHub solo existe `main` — `develop` no está publicada
> (verificado con `gh api repos/.../branches`). Localmente sí queda una `develop` de
> trabajo previo, pero no representa la rama de integración oficial hasta que el ticket
> T-0.1.1 la recree y publique. Hasta entonces, cualquier ticket parte de `main`.

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
feat(auth): conectar login a Supabase Auth
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
npm run lint && npm run typecheck && npm run test:coverage && npm run build:prod
```

```bash
git push -u origin feat/NEQUE-1.2.1-wire-start-page-login
```

```bash
gh pr create --base develop --title "feat(auth): conectar login a Supabase Auth" --body "Closes #NN"
```

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
infraestructura del flujo: plantillas de GitHub, `CODEOWNERS`, `CONTRIBUTING.md` y
`docs/BACKLOG.md`. Sirve para dejar ambas ramas alineadas y validar que `ci-gate` corre y
bloquea correctamente antes de que entre trabajo de producto. A partir de ahí, `main`
solo recibe merges desde `release/*` o `hotfix/*`.

---

## Reglas de merge

Un PR puede mergear cuando:

1. El check **`ci-gate`** está en verde. Es el único required check pensado para branch
   protection: agrega `dependencies`, `lint`, `typecheck`, `test` y `build`, y falla si
   cualquiera de ellos termina en `failure` o `cancelled`.
2. El cuerpo del PR cierra su issue (`Closes #NN`) y adjunta evidencia si toca UI.

**No se exigen aprobaciones.** GitHub no permite aprobar tu propio PR, así que en un repo
de una sola persona pedir una aprobación bloquearía todos los merges. Lo que protege de
verdad es la combinación de PR obligatorio + `ci-gate`. Si más adelante entran
colaboradores, subir el número es cambiar un campo.

⚠️ **Esto todavía no está exigido técnicamente.** El repositorio se hizo público durante
esta sesión, lo que ya permite configurar branch protection en el plan Free de GitHub —
pero la protección real (required check `ci-gate`, PR obligatorio, sin force-push) recién
se activa cuando cierre el ticket **T-0.1.2**. Hasta entonces, esta sección describe la
convención a seguir por disciplina, no algo que GitHub bloquee automáticamente.

### Sobre el gate de coverage

El threshold es **80% en cada una de las 4 métricas** (líneas, statements, funciones,
ramas), no en su promedio: `coverageThreshold.global` de Jest hace fallar
`npm run test:coverage` si cualquiera se queda corta.

El paso "Verify coverage threshold" de `ci.yml`, en cambio, sí calcula un promedio de las
4 métricas — y hoy, con cero specs, ese cálculo da `NaN` y pasa igual (ver
[`README.md`](README.md#cicd)). Es un bug activo, no una descripción de diseño; lo arregla
el ticket **T-0.2.5**. Hasta que cierre, no confíes en que `ci-gate` en verde signifique
cobertura real — revisa el resumen de `npm run test:coverage` a ojo.

La consecuencia práctica una vez esté arreglado: un ticket que agrega código **no puede
dejar su spec para después** — el gate lo rechazaría. Por eso no hay tickets sueltos de
"escribir tests"; el `.spec.ts` es parte del Definition of Done de cada ticket de código.

---

## Convenciones de código

- **Angular 17 standalone.** Sin NgModules.
- **Templates inline** (`template:` en el decorador) con **SCSS externo** (`styleUrl`).
  Es la convención del repo: no hay ni un `.html` en `src/`.
- Las páginas viven en `src/app/pages/`, lo compartido en `src/app/shared/`.
- **Signals** (`signal`, `computed`, `toSignal`) para estado, no `BehaviorSubject`.
- **Sin Tailwind.** El sistema visual son los tokens CSS y los mixins de
  `src/app/shared/theme/`. Extiéndelo, no lo rediseñes.
- `tsconfig.json` corre en modo estricto con `noUncheckedIndexedAccess` y
  `noPropertyAccessFromIndexSignature`: todo acceso indexado devuelve `T | undefined`.
- `no-explicit-any` es **error**, no warning.

### Design tokens

Los colores, radios, sombras y espaciados son variables CSS con prefijo `--nq-*`
declaradas en `src/app/shared/theme/_palette.scss`. **Nunca hardcodees un color en un
componente.** Si necesitas un valor que no existe, agrégalo al palette en su propio
ticket. No hay ningún rename de prefijo planeado — `--nq-*` es el nombre definitivo.

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
- `@testing-library/angular` es la vía preferida para tests de componentes.
- Prueba comportamiento observable — signals computados, salida del template, handlers —,
  no detalles internos de implementación.
- Los nombres de tests van sin tildes (ver normalización de strings, arriba).
- **Hoy no existe ningún spec.** Los primeros los agregan T-0.2.2 (`StartPage`), T-0.2.3
  (`ForgotPasswordPage`) y T-0.2.4 (`TrainerLayoutPage` + `DashboardPage`) — antes de eso,
  no hay un patrón real en el repo para copiar; usa `@testing-library/angular` como
  referencia.

```bash
npm run test:coverage
```

```bash
npx jest src/app/pages/start/start.page.spec.ts
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
