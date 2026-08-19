# Backlog — Ñeque

Descomposición del trabajo en **épicas → historias → tickets**. La regla operativa es
**1 ticket = 1 rama = 1 PR**, salvo los tickets sin cambio de lógica (documentación,
plantillas, configuración del repo), que se trabajan directo sobre `develop`
(ver [`CONTRIBUTING.md`](../CONTRIBUTING.md)).

Ñeque es una app de entrenadores personales. Hoy solo existe la UI de login (sin backend),
recuperación de contraseña (simulada) y un dashboard de entrenador con datos placeholder;
los módulos de clientes, rutinas y perfil son alias temporales al mismo `DashboardPage`.

---

## Diagnóstico verificado (2026-08-17)

Hechos confirmados leyendo el código y ejecutando los comandos reales del repo — no son
supuestos de diseño. Es la foto que originó la Épica 0; la columna **Estado** indica qué
quedó resuelto y con qué ticket.

| Área | Hallazgo | | Estado |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | | ------ |
| Testing | **0 archivos `.spec.ts`** en todo `src/`, pese al `coverageThreshold.global` de 80% en las 4 métricas declarado en el bloque `jest` de `package.json`. | ✅ T-0.2.2/0.2.3/0.2.4 — 6 archivos `.spec.ts`, 69 tests |
| `test:coverage` | `npm run test:coverage` → `"No tests found, exiting with code 0"` (pasa por `--passWithNoTests`). | ✅ T-0.2.1 — corre specs reales |
| `coverage-summary.json` | Con cero specs, las 4 métricas quedan como el string `"Unknown"` (no `0`) — confirmado ejecutando el comando arriba y leyendo el archivo generado. | ✅ T-0.2.2/0.2.3/0.2.4 — 99.13 / 91.11 / 100 / 100 |
| `ci.yml` — "Verify coverage threshold" | Promedia las 4 métricas del summary. `"Unknown"` concatenado 4 veces `/ 4` da `NaN`, y `NaN < 80` es `false` en JS → el step imprime `OK` y pasa. **Falso verde activo hoy.** | ✅ T-0.2.5 — compara métrica por métrica y exige valores numéricos |
| `ci.yml` — `ci-gate` | Agrega `needs.*.result` y falla solo si matchea `/failure\|cancelled/` — no contempla `skipped` explícitamente. Hoy no es explotable (el DAG es lineal y cualquier fallo real también aparece como `failure`), pero conviene endurecerlo. | ✅ T-0.2.5 — `skipped` incluido en el patrón |
| `tsconfig.spec.json` | `"types": ["jasmine"]` aunque el runner real es Jest. | ✅ T-0.2.1 — `["jest"]` |
| `angular.json` | Conserva el target `test` con builder Karma (muerto; Jest corre por fuera vía script npm). Tampoco declara `fileReplacements`: `environment.prod.ts` es código muerto. | ✅ T-0.2.1 / T-0.3.1 — target Karma eliminado y `fileReplacements` agregado |
| `commitlint.config.js` | Comentario residual `// Tipos permitidos para FitConnect` — un tercer nombre de proyecto heredado (ni Ñeque ni ningún otro usado en el repo). | ✅ T-0.3.2 — comentario eliminado |
| `.github/` | No existe `pull_request_template.md`, ni `ISSUE_TEMPLATE/`, ni `CODEOWNERS`. | ✅ T-0.1.3 — plantillas, `ISSUE_TEMPLATE/` y `CODEOWNERS` creados |
| Git remoto | Solo existe `main` en `origin` (`gh api .../branches`). `develop` no está publicada — sí queda una local, remanente de trabajo previo. | ⬜ T-0.1.1 — pendiente de publicar |
| Branch protection | No configurada en `main` (`gh api .../branches/main/protection` → `404 Branch not protected`). Ahora es posible: el repositorio se hizo público durante esta sesión (antes daba 403 por plan Free + privado). | ⬜ T-0.1.2 — pendiente de configurar |
| `_components.scss` / `_utilities.scss` | Definen versiones **duplicadas y con valores distintos** de `.nq-state`, `.nq-state-icon`, `.nq-state-title`, `.nq-state-desc` y `.nq-divider`. | ✅ T-0.3.3 — se conserva solo la copia de `_components.scss` |
| Tipografía | `'Inter'` está en `--nq-font-family` pero nunca se carga — sin `@font-face`, sin `<link>`, `src/assets/` vacío salvo `.gitkeep`. | ✅ T-0.3.4 — Inter self-hosteada en `src/assets/fonts/` |
| Auth | `StartPage.onLogin()`, los tres handlers de `ForgotPasswordPage` (`onSendCode`/`onVerifyOtp`/`resendCode`) y `DashboardPage.loadData()` tienen `// TODO: wire to (auth) service` — no hay backend conectado. | ⬜ Épica 1 |
| `environments/` | `supabaseUrl`/`supabaseAnonKey` declarados y vacíos, sin ningún consumidor — única pista de que Supabase era el backend planeado. `flowApiUrl` (Flow.cl) también declarado y sin uso; no hay evidencia de una feature de pagos más allá de esa URL. | ➡️ `fileReplacements` ya conectado (T-0.3.1); las claves siguen vacías hasta la Épica 1 |
| Rutas | `/trainer/clients`, `/trainer/routines` y `/trainer/profile` cargan el mismo `DashboardPage` como placeholder — no son páginas propias todavía. | ⬜ Épicas 2–4 |
| Dependencias | `@capacitor/camera`, `@capacitor/push-notifications` y `@capacitor/share` están instaladas pero **sin ningún código que las use**. | ⬜ Fuera de alcance por ahora |
| GitHub | 4 PRs ya mergeados (#1–#4, ver tablero), **0 issues** creados. | ⬜ Sin cambios |

### Decisiones tomadas

- El repositorio se hizo público el 2026-08-17 (durante la sesión que abrió este backlog)
  para poder configurar branch protection real en el plan Free de GitHub.
- El backlog cubre primero la **Épica 0** (fundación real, fundada en el diagnóstico de
  arriba) y luego un **roadmap de producto inferido** de las rutas placeholder existentes
  (Épicas 1–5). Las épicas 1–5 son una propuesta a confirmar/ajustar, no un alcance ya
  validado — cada una lo indica explícitamente.
- Prefijo de ticket: **`NEQUE-<épica>.<historia>.<ticket>`**.
- Sin automatización de creación de issues por script: el backlog vive solo como este
  documento Markdown, sin `scripts/create-issues.sh` ni equivalente.

---

## ÉPICA 0 — Fundación y Desbloqueo de CI real

> Deja el pipeline verde de verdad — sin el `NaN` que hoy lo maquilla —, publica `develop`
> con protección real y limpia los residuos de configuración heredados. Sin esta épica
> ningún ticket de producto debería mergear con confianza.
>
> **Definición de terminado:** `develop` publicada y protegida junto con `main`, `ci-gate`
> en verde con cobertura real (no `NaN`), cero residuos de Karma/Jasmine ni nombres de
> proyecto heredados, plantillas de GitHub en su lugar.
>
> **Estado:** todo el trabajo sobre archivos está cerrado (ver tablero). Pendiente solo la
> parte operativa en GitHub: T-0.1.1, T-0.1.2 y T-0.1.7.

### HU-0.1 — Infraestructura de Gitflow

| Ticket  | Rama                      | Qué hace                                                                                                                                                     |
| ------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| T-0.1.1 | _(sin PR)_                | Recrear y publicar `develop` desde `main` — hoy `origin` solo tiene `main`.                                                                                  |
| T-0.1.2 | _(sin PR)_                | Branch protection en `main` y `develop`: required check `ci-gate`, PR obligatorio con **0 aprobaciones**, sin force-push ni borrado de rama. Ver nota abajo. |
| T-0.1.3 | `develop` (directo)       | `pull_request_template.md`, `ISSUE_TEMPLATE/` (bug, feature, task), `CODEOWNERS` — no existen hoy.                                                           |
| T-0.1.4 | `develop` (directo)       | `CONTRIBUTING.md`.                                                                                                                                           |
| T-0.1.5 | `develop` (directo)       | Este documento.                                                                                                                                              |
| T-0.1.6 | `develop` (directo)       | `README.md`.                                                                                                                                                 |
| T-0.1.7 | **PR `develop` → `main`** | Bootstrap del gitflow: lleva a `main` la infraestructura de T-0.1.3/0.1.4/0.1.5/0.1.6 y valida que `ci-gate` corre y bloquea.                                |

T-0.1.3, T-0.1.4, T-0.1.5 y T-0.1.6 no cambian lógica — solo documentación y
plantillas — así que van directo sobre `develop` sin rama propia. El PR de T-0.1.7 los
agrupa a los cuatro.

**Nota sobre T-0.1.2 — por qué 0 aprobaciones.** GitHub no permite aprobar tu propio PR.
En un repo de una sola persona, exigir 1 aprobación bloquearía todos los merges. Se exige
PR + `ci-gate` en verde, que es lo que realmente protege. Si más adelante entran
colaboradores, subir el número es un cambio de un campo.

`enforce_admins` queda en `false` a propósito: el owner puede seguir commiteando directo
sobre `develop` para los tickets sin cambio de lógica. Para cualquier otra cuenta, el push
directo a `main` y `develop` es rechazado.

**Criterios de aceptación:** el PR `develop` → `main` dispara `ci-gate` y no puede mergear
sin él; una cuenta no-admin no puede pushear directo a `main` ni a `develop`.

### HU-0.2 — Desbloquear el gate de coverage real

| Ticket  | Rama                                              | Qué hace                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.2.1 | `ci/NEQUE-0.2.1-jest-config-fix`                  | `tsconfig.spec.json`: `"types": ["jasmine"]` → `["jest"]`. Eliminar el target `test` con builder Karma de `angular.json` (muerto). En `package.json`, cambiar `setupFiles` → `setupFilesAfterEnv` — **a validar empíricamente con un spec real durante el ticket**, no asumido como bug confirmado sin evidencia.                                                       |
| T-0.2.2 | `test/NEQUE-0.2.2-start-page-specs`               | Specs de `StartPage`: validación de email, las 4 reglas de password, `formValid`, toggle del panel de login, `isSubmitting`.                                                                                                                                                                                                                                            |
| T-0.2.3 | `test/NEQUE-0.2.3-forgot-password-specs`          | Specs de `ForgotPasswordPage`: OTP auto-advance, backspace, paste de 6 dígitos, countdown de reenvío, enmascarado de email.                                                                                                                                                                                                                                             |
| T-0.2.4 | `test/NEQUE-0.2.4-trainer-layout-dashboard-specs` | Specs de `TrainerLayoutPage` (tab activa vía `toSignal(NavigationEnd)`) y `DashboardPage` (switch de estados, `greetingLabel` según hora del día).                                                                                                                                                                                                                      |
| T-0.2.5 | `ci/NEQUE-0.2.5-harden-ci-gate`                   | Dos endurecimientos de `ci.yml`: (1) el step "Verify coverage threshold" debe comparar cada métrica individualmente y validar que sean numéricas antes de comparar, no promediarlas — hoy el promedio con `"Unknown"` da `NaN` y pasa. (2) sumar `skipped` al patrón del agregador de `ci-gate` por defensividad, aunque hoy no sea explotable en el DAG lineal actual. |

**Orden:** T-0.2.1 primero — el resto depende de que Jest corra specs reales.

**Criterios de aceptación:** `npm run lint && npm run typecheck && npm run test:coverage && npm run build:prod`
pasa limpio (lint y typecheck ya pasan hoy) y `ci-gate` reporta verde por cobertura real,
no por `NaN`.

### HU-0.3 — Limpieza de configuración y estilos

| Ticket  | Rama                                           | Qué hace                                                                                                                                                |
| ------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-0.3.1 | `chore/NEQUE-0.3.1-add-file-replacements`      | `fileReplacements` en `angular.json` para que un build de producción use de verdad `environment.prod.ts`.                                               |
| T-0.3.2 | `chore/NEQUE-0.3.2-commitlint-cleanup`         | Quitar el comentario `// Tipos permitidos para FitConnect` de `commitlint.config.js`.                                                                   |
| T-0.3.3 | `fix/NEQUE-0.3.3-dedupe-state-divider-classes` | Resolver los duplicados `.nq-state`, `.nq-state-icon`, `.nq-state-title`, `.nq-state-desc`, `.nq-divider` entre `_components.scss` y `_utilities.scss`. |
| T-0.3.4 | `feat/NEQUE-0.3.4-self-host-inter-font`        | Self-hostear Inter en `src/assets/fonts/` (`@font-face`) o quitarla de `--nq-font-family` si no se va a usar.                                           |

---

## ÉPICA 1 — Autenticación real (Supabase)

> _Roadmap inferido de los `// TODO: wire to auth service` existentes y del scaffolding
> vacío de `supabaseUrl`/`supabaseAnonKey` en `environments/`. Ajustar historias y
> tickets cuando confirmes el alcance funcional exacto — por ejemplo, quién crea las
> cuentas de entrenador, dado que `StartPage` dice hoy "This is an invitation-only app."_
>
> **Definición de terminado:** `StartPage.onLogin()` y el flujo completo de
> `ForgotPasswordPage` llaman a un servicio de auth real; `/trainer` está protegido por
> un guard que redirige a `/` si no hay sesión.

### HU-1.1 — Cliente Supabase y AuthService

| Ticket  | Rama                                        | Qué hace                                                                                                                                           |
| ------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1.1.1 | `chore/NEQUE-1.1.1-add-supabase-dependency` | `npm i @supabase/supabase-js`; completar `supabaseUrl`/`supabaseAnonKey` en `environments/`. **No commitear claves de producción.**                |
| T-1.1.2 | `feat/NEQUE-1.1.2-auth-service`             | `AuthService` (`providedIn: 'root'`) con `login(email, password)`, `sendPasswordReset(email)`, `verifyOtp(email, token)`, `signOut()`. **+ spec.** |

### HU-1.2 — Login real

| Ticket  | Rama                                     | Qué hace                                                                                                                                                                               |
| ------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-1.2.1 | `feat/NEQUE-1.2.1-wire-start-page-login` | Reemplazar el `TODO` de `onLogin()` por `AuthService.login()`; manejo de error (credenciales inválidas) reusando `.nq-field-error`; `isSubmitting` real. **+ spec del caso de error.** |
| T-1.2.2 | `feat/NEQUE-1.2.2-trainer-route-guard`   | Guard funcional en `/trainer` que redirige a `/` si no hay sesión activa. **+ spec.**                                                                                                  |

### HU-1.3 — Recuperación de contraseña real

| Ticket  | Rama                                         | Qué hace                                                                                                                |
| ------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| T-1.3.1 | `feat/NEQUE-1.3.1-wire-forgot-password-flow` | `onSendCode`/`onVerifyOtp`/`resendCode` contra `AuthService` en vez de los `setTimeout` simulados actuales. **+ spec.** |

---

## ÉPICA 2 — Módulo Clientes

> _Roadmap inferido — mismo disclaimer que la Épica 1._
>
> **Definición de terminado:** `/trainer/clients` deja de ser un alias a `DashboardPage`
> y lista, crea, edita y muestra el detalle de clientes reales del entrenador autenticado.

### HU-2.1 — Modelo y servicio

| Ticket  | Rama                              | Qué hace                                                                                                   |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| T-2.1.1 | `feat/NEQUE-2.1.1-client-model`   | `src/app/shared/models/client.model.ts`.                                                                   |
| T-2.1.2 | `feat/NEQUE-2.1.2-client-service` | `ClientService` sobre una tabla `clients` de Supabase, filtrada por el entrenador autenticado. **+ spec.** |

### HU-2.2 — Listado

| Ticket  | Rama                                     | Qué hace                                                                                                 |
| ------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| T-2.2.1 | `feat/NEQUE-2.2.1-clients-page-scaffold` | `ClientsPage` standalone en `src/app/pages/trainer/clients/`, reemplaza el alias en la ruta. **+ spec.** |
| T-2.2.2 | `feat/NEQUE-2.2.2-clients-list-states`   | Estados `loading/error/empty/success` reusando `<nq-page-state>`.                                        |

### HU-2.3 — Alta, edición y detalle

| Ticket  | Rama                                  | Qué hace                                                       |
| ------- | ------------------------------------- | -------------------------------------------------------------- |
| T-2.3.1 | `feat/NEQUE-2.3.1-client-form-sheet`  | Formulario de alta/edición reusando `.nq-sheet`/`.nq-field-*`. |
| T-2.3.2 | `feat/NEQUE-2.3.2-client-detail-view` | Vista de detalle de un cliente.                                |

---

## ÉPICA 3 — Módulo Rutinas

> _Roadmap inferido — mismo disclaimer que la Épica 1._
>
> **Definición de terminado:** `/trainer/routines` deja de ser un alias, lista/crea/edita
> rutinas y permite asignarlas a un cliente de la Épica 2.

### HU-3.1 — Modelo y servicio

| Ticket  | Rama                               | Qué hace                                     |
| ------- | ---------------------------------- | -------------------------------------------- |
| T-3.1.1 | `feat/NEQUE-3.1.1-routine-model`   | `src/app/shared/models/routine.model.ts`.    |
| T-3.1.2 | `feat/NEQUE-3.1.2-routine-service` | `RoutineService` sobre Supabase. **+ spec.** |

### HU-3.2 — Listado

| Ticket  | Rama                                      | Qué hace                                                              |
| ------- | ----------------------------------------- | --------------------------------------------------------------------- |
| T-3.2.1 | `feat/NEQUE-3.2.1-routines-page-scaffold` | `RoutinesPage` standalone, reemplaza el alias en la ruta. **+ spec.** |
| T-3.2.2 | `feat/NEQUE-3.2.2-routines-list-states`   | Estados `loading/error/empty/success`.                                |

### HU-3.3 — Alta, edición y asignación

| Ticket  | Rama                                        | Qué hace                                                   |
| ------- | ------------------------------------------- | ---------------------------------------------------------- |
| T-3.3.1 | `feat/NEQUE-3.3.1-routine-form`             | Formulario de alta/edición de rutina.                      |
| T-3.3.2 | `feat/NEQUE-3.3.2-assign-routine-to-client` | Asignar una rutina a un cliente (relación con la Épica 2). |

---

## ÉPICA 4 — Perfil del Entrenador

> _Roadmap inferido — mismo disclaimer que la Épica 1._
>
> **Definición de terminado:** `/trainer/profile` deja de ser un alias, muestra los datos
> del entrenador autenticado y permite cerrar sesión.

### HU-4.1 — Página de perfil

| Ticket  | Rama                                     | Qué hace                                                             |
| ------- | ---------------------------------------- | -------------------------------------------------------------------- |
| T-4.1.1 | `feat/NEQUE-4.1.1-profile-page-scaffold` | `ProfilePage` standalone, reemplaza el alias en la ruta. **+ spec.** |
| T-4.1.2 | `feat/NEQUE-4.1.2-profile-logout`        | Botón de cerrar sesión usando `AuthService.signOut()` de la Épica 1. |

---

## ÉPICA 5 — Dashboard con datos reales

> _Roadmap inferido — mismo disclaimer que la Épica 1._
>
> **Definición de terminado:** las 2 métricas de `DashboardPage` (hoy `"—"` hardcodeado)
> muestran conteos reales de `ClientService`/`RoutineService`, y el saludo usa el nombre
> del entrenador autenticado en vez de `"Kelvin"` hardcodeado en el template.

### HU-5.1 — Conectar métricas reales

| Ticket  | Rama                                      | Qué hace                                                                                                                 |
| ------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| T-5.1.1 | `feat/NEQUE-5.1.1-wire-dashboard-metrics` | Reemplazar el `signal<ViewState>('success')` fijo y las métricas `"—"` por datos reales de las Épicas 2 y 3. **+ spec.** |

---

## ÉPICA 6 — Release v1.0.0

> **Definición de terminado:** el tag `v1.0.0` produce un GitHub Release con APK y IPA
> descargables.

### HU-6.1 — QA de integración

| Ticket  | Rama                                        | Qué hace                                                                                                                              |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| T-6.1.1 | `test/NEQUE-6.1.1-integration-qa-checklist` | Recorrido login → dashboard → clientes → rutinas → perfil → logout. Estados vacíos/error, bloqueo de landscape. Checklist en `docs/`. |

### HU-6.2 — Plataformas nativas (iOS + Android)

| Ticket  | Rama                                          | Qué hace                                                                                                                                                                               |
| ------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-6.2.1 | `chore/NEQUE-6.2.1-capacitor-add-android`     | `npx cap add android`. Hoy `/android` no existe (gitignored, nunca se corrió `cap add`). Verificar el APK vía `gradlew assembleRelease`.                                               |
| T-6.2.2 | `chore/NEQUE-6.2.2-capacitor-add-ios`         | `npx cap add ios`. Mismo caso. Verificar el archive en macOS.                                                                                                                          |
| T-6.2.3 | `ci/NEQUE-6.2.3-fix-release-workflow-signing` | `release.yml` construye APK y archive iOS **sin firma**. Definir el esquema de firma (keystore Android, certificado/provisioning iOS como secrets) para producir binarios instalables. |

### HU-6.3 — Corte de release

| Ticket  | Rama                                       | Qué hace                                                                                                      |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| T-6.3.1 | `chore/NEQUE-6.3.1-version-bump-changelog` | Bump de versión en `package.json` + `CHANGELOG.md`. PR a `develop`.                                           |
| T-6.3.2 | `release/1.0.0`                            | Rama de release desde `develop` → PR a `main` (merge normal), tag `v1.0.0`, back-merge de `main` a `develop`. |

---

## Resumen

| Épica                          | Historias | Tickets | PRs                                   |
| ------------------------------ | --------- | ------- | ------------------------------------- |
| 0 — Fundación y CI real        | 3         | 16      | 10 (2 sin PR, 4 directo en `develop`) |
| 1 — Autenticación real         | 3         | 5       | 5                                     |
| 2 — Módulo Clientes            | 3         | 6       | 6                                     |
| 3 — Módulo Rutinas             | 3         | 6       | 6                                     |
| 4 — Perfil del Entrenador      | 1         | 2       | 2                                     |
| 5 — Dashboard con datos reales | 1         | 1       | 1                                     |
| 6 — Release v1.0.0             | 3         | 6       | 6 (5 a `develop` + 1 a `main`)        |
| **Total**                      | **17**    | **42**  | **36 (34 a `develop` + 2 a `main`)**  |

### Orden de ejecución

- **Épica 0**: secuencial por historia (0.1 → 0.2 → 0.3). Bloquea a todas las demás.
  **Cerrada en código**: los 13 tickets que tocan archivos están hechos y la secuencia
  `lint → format:check → typecheck → test:coverage → build:prod` pasa limpia, con
  cobertura real de 99.13 / 91.11 / 100 / 100 (statements / branches / functions / lines).
  Quedan abiertos T-0.1.1, T-0.1.2 y T-0.1.7, que son operaciones de git y GitHub, no
  cambios de archivos. La Épica 1 se desbloquea al ejecutarlos.
- **Épica 1**: depende de que cierre la Épica 0 (se necesita CI verde real antes de
  construir sobre él); secuencial 1.1 → 1.2 → 1.3.
- **Épicas 2 y 3**: dependen de la Épica 1 (necesitan saber qué entrenador está
  autenticado), pero pueden avanzar en paralelo entre sí.
- **Épica 4**: depende solo de la Épica 1.
- **Épica 5**: depende de que las Épicas 2 y 3 tengan sus servicios listos (consume
  ambos).
- **Épica 6**: al final, con las Épicas 1–5 integradas en `develop`.

Dentro de cada historia los tickets son secuenciales salvo donde se indique.

---

## Tablero de ejecución

Lista plana en orden de trabajo. Estados: ✅ mergeado · 🔄 en curso · ⬜ pendiente.

#### Trabajo previo a este backlog

Antes de que existiera este documento ya se mergearon 4 PRs a mano, sin ticket
`NEQUE-x.y.z` asociado — es el trabajo de diseño de `StartPage` y `ForgotPasswordPage`:

| PR  | Título                                                  | Estado      |
| --- | ------------------------------------------------------- | ----------- |
| #1  | `develop: Release Funcionalidades a Main`               | ✅ mergeado |
| #2  | `feat(ui-design): start-page & login-page`              | ✅ mergeado |
| #3  | `feat(ui-design-login): login page`                     | ✅ mergeado |
| #4  | `feat(ui-design-forgot-password): forgot password flow` | ✅ mergeado |

### Épica 0 — Fundación

| #   | Ticket  | Rama                                              | Estado |
| --- | ------- | ------------------------------------------------- | ------ |
| 01  | T-0.1.1 | _(sin PR)_ recrear/publicar `develop`             | ⬜     |
| 02  | T-0.1.2 | _(sin PR)_ branch protection                      | ⬜     |
| 03  | T-0.1.3 | `develop` (directo) plantillas GitHub             | ✅     |
| 04  | T-0.1.4 | `develop` (directo) `CONTRIBUTING.md`             | ✅     |
| 05  | T-0.1.5 | `develop` (directo) `docs/BACKLOG.md`             | ✅     |
| 06  | T-0.1.6 | `develop` (directo) `README.md`                   | ✅     |
| 07  | T-0.1.7 | PR `develop` → `main`                             | ⬜     |
| 08  | T-0.2.1 | `ci/NEQUE-0.2.1-jest-config-fix`                  | ✅     |
| 09  | T-0.2.2 | `test/NEQUE-0.2.2-start-page-specs`               | ✅     |
| 10  | T-0.2.3 | `test/NEQUE-0.2.3-forgot-password-specs`          | ✅     |
| 11  | T-0.2.4 | `test/NEQUE-0.2.4-trainer-layout-dashboard-specs` | ✅     |
| 12  | T-0.2.5 | `ci/NEQUE-0.2.5-harden-ci-gate`                   | ✅     |
| 13  | T-0.3.1 | `chore/NEQUE-0.3.1-add-file-replacements`         | ✅     |
| 14  | T-0.3.2 | `chore/NEQUE-0.3.2-commitlint-cleanup`            | ✅     |
| 15  | T-0.3.3 | `fix/NEQUE-0.3.3-dedupe-state-divider-classes`    | ✅     |
| 16  | T-0.3.4 | `feat/NEQUE-0.3.4-self-host-inter-font`           | ✅     |

### Épica 1 — Autenticación real

| #   | Ticket  | Rama                                         | Estado |
| --- | ------- | -------------------------------------------- | ------ |
| 17  | T-1.1.1 | `chore/NEQUE-1.1.1-add-supabase-dependency`  | ⬜     |
| 18  | T-1.1.2 | `feat/NEQUE-1.1.2-auth-service`              | ⬜     |
| 19  | T-1.2.1 | `feat/NEQUE-1.2.1-wire-start-page-login`     | ⬜     |
| 20  | T-1.2.2 | `feat/NEQUE-1.2.2-trainer-route-guard`       | ⬜     |
| 21  | T-1.3.1 | `feat/NEQUE-1.3.1-wire-forgot-password-flow` | ⬜     |

### Épica 2 — Módulo Clientes

| #   | Ticket  | Rama                                     | Estado |
| --- | ------- | ---------------------------------------- | ------ |
| 22  | T-2.1.1 | `feat/NEQUE-2.1.1-client-model`          | ⬜     |
| 23  | T-2.1.2 | `feat/NEQUE-2.1.2-client-service`        | ⬜     |
| 24  | T-2.2.1 | `feat/NEQUE-2.2.1-clients-page-scaffold` | ⬜     |
| 25  | T-2.2.2 | `feat/NEQUE-2.2.2-clients-list-states`   | ⬜     |
| 26  | T-2.3.1 | `feat/NEQUE-2.3.1-client-form-sheet`     | ⬜     |
| 27  | T-2.3.2 | `feat/NEQUE-2.3.2-client-detail-view`    | ⬜     |

### Épica 3 — Módulo Rutinas

| #   | Ticket  | Rama                                        | Estado |
| --- | ------- | ------------------------------------------- | ------ |
| 28  | T-3.1.1 | `feat/NEQUE-3.1.1-routine-model`            | ⬜     |
| 29  | T-3.1.2 | `feat/NEQUE-3.1.2-routine-service`          | ⬜     |
| 30  | T-3.2.1 | `feat/NEQUE-3.2.1-routines-page-scaffold`   | ⬜     |
| 31  | T-3.2.2 | `feat/NEQUE-3.2.2-routines-list-states`     | ⬜     |
| 32  | T-3.3.1 | `feat/NEQUE-3.3.1-routine-form`             | ⬜     |
| 33  | T-3.3.2 | `feat/NEQUE-3.3.2-assign-routine-to-client` | ⬜     |

### Épica 4 — Perfil del Entrenador

| #   | Ticket  | Rama                                     | Estado |
| --- | ------- | ---------------------------------------- | ------ |
| 34  | T-4.1.1 | `feat/NEQUE-4.1.1-profile-page-scaffold` | ⬜     |
| 35  | T-4.1.2 | `feat/NEQUE-4.1.2-profile-logout`        | ⬜     |

### Épica 5 — Dashboard con datos reales

| #   | Ticket  | Rama                                      | Estado |
| --- | ------- | ----------------------------------------- | ------ |
| 36  | T-5.1.1 | `feat/NEQUE-5.1.1-wire-dashboard-metrics` | ⬜     |

### Épica 6 — Release v1.0.0

| #   | Ticket  | Rama                                          | Estado |
| --- | ------- | --------------------------------------------- | ------ |
| 37  | T-6.1.1 | `test/NEQUE-6.1.1-integration-qa-checklist`   | ⬜     |
| 38  | T-6.2.1 | `chore/NEQUE-6.2.1-capacitor-add-android`     | ⬜     |
| 39  | T-6.2.2 | `chore/NEQUE-6.2.2-capacitor-add-ios`         | ⬜     |
| 40  | T-6.2.3 | `ci/NEQUE-6.2.3-fix-release-workflow-signing` | ⬜     |
| 41  | T-6.3.1 | `chore/NEQUE-6.3.1-version-bump-changelog`    | ⬜     |
| 42  | T-6.3.2 | `release/1.0.0` → `main` + tag `v1.0.0`       | ⬜     |

---

## Componentes que se reutilizan tal cual

- **Mixins:** `nq-btn-gradient`, `nq-field-base`, `nq-nav-back`.
- **Clases:** `.nq-card`, `.nq-search`, `.nq-badge*`, `.nq-avatar`, `.nq-tabs`/`.nq-tab`,
  `.nq-overlay`/`.nq-sheet*`, `.nq-state*`, `.nq-skeleton-*`, `.nq-scroll`.
- **Keyframes:** `nq-fade-up`, `nq-spin`, `nq-shimmer`.
- **Patrones:** `toSignal(NavigationEnd)` de `trainer-layout.page.ts` (tab bar activa) y
  `page-state.component.ts` (loading/error/empty/offline).

---

## Fuera de alcance por ahora

- **Pagos vía Flow.cl** — solo hay una URL declarada en `environments/` sin ningún
  consumidor; no se planifica una épica de pagos hasta confirmar la necesidad real.
- **Push notifications** — `@capacitor/push-notifications` está instalado pero sin
  ningún código que lo use.
- **Compartir contenido** — `@capacitor/share` instalado, sin uso.
- **Cámara** — `@capacitor/camera` instalado, sin uso (candidato a foto de perfil o
  seguimiento de progreso de cliente a futuro, sin ticket todavía).
- **Auth social o recuperación por SMS** — el alcance inferido de la Épica 1 asume
  únicamente email + contraseña + OTP por email.
- **Analítica de uso.**
