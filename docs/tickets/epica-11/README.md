# Épica 11 — Correcciones de auditoría

Cierra los hallazgos de
[`docs/auditoria/2026-09-18-auditoria-app-alumno.md`](../../auditoria/2026-09-18-auditoria-app-alumno.md), que terminó en
❌ NO APROBADO con 45 hallazgos sobre 12 pantallas y 5 componentes.

| Historia                   | Tickets | Estado    |
| -------------------------- | ------: | --------- |
| HU-11.0 — Documentación    |       3 | Terminado |
| HU-11.1 — Design system    |       5 | Terminado |
| HU-11.2 — Bugs bloqueantes |       5 | Terminado |
| HU-11.3 — Scroll y layout  |       2 | Terminado |
| HU-11.4 — Accesibilidad    |       7 | Terminado |
| HU-11.5 — Contraseña nueva |       2 | Terminado |
| HU-11.6 — Diferidos        |      21 | 15 hechos |

> **Se ejecuta antes que las Épicas 9 y 10.** El número identifica, no ordena.

Los tickets de HU-11.0 a HU-11.5 están hechos y verificados en navegador a 375×812 y
320×568.

De HU-11.6 se cerraron los **15 mecánicos** en una segunda tanda. Quedan seis, todos con
una decisión de diseño detrás: T-7 (traducir las dos pantallas de autenticación), T-8
(normalizar la escala de espaciado y tipografía), T-11 (pull-to-refresh), T-14 (migrar a
`input()` signals), PR-2 (gesto de arrastre del bottom sheet) y P-6 (comparador de fotos
arrastrable).
