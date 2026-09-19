# Repositorio documental de tickets

Cada ticket de [`docs/BACKLOG.md`](../BACKLOG.md) tiene un archivo Markdown propio,
organizado por épica e historia.

| Épica                                       | Tickets | Estado                       |
| ------------------------------------------- | ------: | ---------------------------- |
| [2 — Gestión de Alumnos](epica-2/)          |      19 | Pendiente de refinamiento    |
| [7 — Arquitectura hexagonal](epica-7/)      |      24 | Terminada                    |
| [8 — App del Alumno](epica-8/)              |      41 | Terminada                    |
| [11 — Correcciones de auditoría](epica-11/) |      45 | 39 terminados · 6 pendientes |

## Estados

- **Pendiente de refinamiento:** requiere decisiones del cliente o revisión técnica.
- **Listo para issue:** alcance y criterios definidos.
- **Issue creado:** existe en GitHub.
- **En desarrollo / Terminado:** refleja su avance.

## Dos generaciones de tickets

Los de la **Épica 2** se escribieron antes de refinar el alcance: dicen "pendientes de
definir con el cliente" en vez de criterios. Se refinan antes de crear su issue.

Los de las **Épicas 7 y 8** nacen **con criterios de aceptación verificables**, porque
las decisiones ya estaban tomadas al implementarlos. Varios incluyen una sección
**Por qué** que registra el problema concreto que motivó el ticket — útil cuando alguien
se pregunte por qué el theme está partido en dos archivos o por qué el shell no usa
`ion-router-outlet`.

Cuando se refine la Épica 2, conviene seguir el formato de las Épicas 7 y 8.

Los de la **Épica 11** nacen de una auditoría, así que cada uno enlaza el hallazgo que lo
origina en [`docs/auditoria/`](../auditoria/). Los de la HU-11.6 están en _Pendiente_: son
los hallazgos que el alcance acordado dejó fuera, escritos para no perderlos.
