# Ñeque

App móvil para **entrenadores personales**: una sola herramienta para llevar a sus
clientes, armar rutinas y revisar su día de trabajo desde el teléfono.

Es una aplicación híbrida — Angular + Ionic empaquetada con Capacitor — así que el mismo
código corre en el navegador, en Android y en iOS.

## Qué hace

- **Acceso por invitación.** No hay registro público: el entrenador entra con credenciales
  asignadas por un administrador.
- **Recuperación de contraseña en dos pasos.** Se pide el correo y se valida con un código
  OTP de 6 dígitos enviado a esa dirección.
- **Panel del entrenador.** Un shell con barra de pestañas inferior que agrupa las cuatro
  áreas de trabajo:
  - **Dashboard** — saludo según la hora, métricas del día y accesos rápidos.
  - **Clientes** — alta, edición y ficha de cada persona a cargo.
  - **Rutinas** — creación de rutinas y asignación a clientes.
  - **Perfil** — datos del entrenador y cierre de sesión.

## Stack

| Categoría   | Tecnología                                                         |
| ----------- | ------------------------------------------------------------------ |
| Framework   | Angular 17 — standalone components + signals, sin NgModules        |
| UI móvil    | Ionic 8                                                            |
| Nativo      | Capacitor 6 (Android + iOS)                                        |
| Estilos     | SCSS con design tokens propios (`--nq-*`). Sin Tailwind ni PostCSS |
| Formularios | `ReactiveFormsModule`                                              |
| Iconos      | `@lucide/angular`                                                  |
| Testing     | Jest 29 + `jest-preset-angular`                                    |
| Calidad     | ESLint + Prettier + Husky + commitlint                             |
| CI/CD       | GitHub Actions                                                     |

Requiere **Node.js 22** o superior.

## Inicio rápido

```bash
npm ci
npm start
```

La app queda en `http://localhost:4200`. Para verla como en un teléfono, activa la vista
responsive del navegador: el layout está pensado en vertical y bloquea el modo horizontal
en pantallas bajas.

Para un build nativo:

```bash
npm run cap:build
```

Genera el bundle de producción y lo copia a las plataformas nativas. Las carpetas
`/android` y `/ios` se crean con `npx cap add android` / `npx cap add ios`.

## Estructura

```
src/
├── app/
│   ├── pages/            # una carpeta por página (componente + estilos)
│   │   ├── start/            # landing + panel de login
│   │   ├── forgot-password/  # recuperación en 2 pasos
│   │   └── trainer/          # shell con tabs + subpáginas del panel
│   ├── shared/
│   │   ├── components/   # componentes reutilizables (nq-page-state)
│   │   └── theme/        # design system en SCSS
│   ├── app.config.ts     # providers de la aplicación
│   └── app.routes.ts     # rutas, todas lazy con loadComponent
├── assets/               # imágenes y fuentes (Inter self-hosted)
└── environments/         # configuración por entorno
```

Alias de importación disponibles: `@app/*`, `@shared/*` y `@env/*`.

## Scripts

| Script                  | Qué hace                                  |
| ----------------------- | ----------------------------------------- |
| `npm start`             | Servidor de desarrollo                    |
| `npm run build:prod`    | Build de producción                       |
| `npm test`              | Tests con Jest                            |
| `npm run test:watch`    | Tests en modo watch                       |
| `npm run test:coverage` | Tests con reporte de cobertura            |
| `npm run lint`          | ESLint (falla ante cualquier warning)     |
| `npm run format`        | Formatea con Prettier                     |
| `npm run typecheck`     | Chequeo de tipos sin emitir               |
| `npm run cap:sync`      | Sincroniza plugins nativos con Capacitor  |
| `npm run cap:build`     | Build de producción + copia a las nativas |

## Sistema visual

El diseño vive en `src/app/shared/theme/` y se compone de cuatro parciales:

| Parcial            | Contenido                                                        |
| ------------------ | ---------------------------------------------------------------- |
| `_fonts.scss`      | `@font-face` de Inter (self-hosted, licencia OFL)                |
| `_palette.scss`    | Tokens `--nq-*`: colores, radios, sombras, tipografía, espaciado |
| `_utilities.scss`  | Animaciones, skeletons y clases utilitarias                      |
| `_components.scss` | Mixins y clases de botones, tarjetas, inputs, badges, hojas…     |

El color primario es `#2cb5a0` y la tipografía es Inter. **Todo se declara con tokens
`--nq-*`**: si necesitas un color, una sombra o un radio, tómalo del token; no escribas el
valor literal en el componente.

## Cómo aportar

1. Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) — ahí está el flujo completo: gitflow,
   nomenclatura de ramas, formato de commits y política de merge.
2. Elige un ticket de [`docs/BACKLOG.md`](docs/BACKLOG.md), donde el trabajo está
   descompuesto en épicas → historias → tickets. La regla es **1 ticket = 1 rama = 1 PR**.
3. Trabaja desde `develop` con una rama por ticket:

   ```bash
   git checkout develop
   git checkout -b feat/NEQUE-x.y.z-descripcion-corta
   ```

4. Commitea con [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat(scope): asunto`); commitlint lo valida en el hook de pre-commit.
5. Antes de abrir el PR, corre la secuencia de validación completa:

   ```bash
   npm run lint && npm run format:check && npm run typecheck && npm run test:coverage && npm run build:prod
   ```

6. Abre el PR contra `develop`. El check `ci-gate` debe quedar en verde para poder
   mergear: exige lint, formato, tipos, build y **cobertura mínima del 80% en líneas,
   sentencias, funciones y ramas**.

## Equipo

Proyecto académico de **DuocUC**.

Desarrollo: Kelvin A. Moreno ([@cosyfps](https://github.com/cosyfps))
