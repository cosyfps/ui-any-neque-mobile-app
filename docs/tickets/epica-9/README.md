# Épica 9 — App del Entrenador

Shell propio de cuatro pestañas, cartera con búsqueda y filtro, alta con invitación de
48 h, ficha con anamnesis y evaluaciones, biblioteca de rutinas con constructor y
asignación, ejercicios propios e Inicio con conteos reales — todo contra adapters mock.

| Historia                                | Tickets | Estado    |
| --------------------------------------- | ------: | --------- |
| HU-9.0 — Documentación                  |       3 | Terminado |
| HU-9.1 — Dominio del entrenador         |       6 | Terminado |
| HU-9.2 — Infraestructura del entrenador |       5 | Terminado |
| HU-9.3 — Shell rediseñado y renombrado  |       5 | Terminado |
| HU-9.4 — Cartera de alumnos             |       4 | Terminado |
| HU-9.5 — Alta de alumno e invitación    |       5 | Terminado |
| HU-9.6 — Ficha del alumno               |       4 | Terminado |
| HU-9.7 — Anamnesis y evaluaciones       |       4 | Terminado |
| HU-9.8 — Rutinas                        |       4 | Terminado |
| HU-9.9 — Ejercicios propios             |       2 | Terminado |
| HU-9.10 — Perfil del entrenador         |       2 | Terminado |
| HU-9.11 — Inicio con datos reales       |       3 | Terminado |
| HU-9.12 — Alineación del contrato       |       5 | Terminado |

> **HU-9.12 se ejecutó antes que las pantallas** aunque su número sea el último: alinea
> el contrato con [`modelo-datos.md`](../../modelo-datos.md) y toca el runner del alumno,
> del que depende la progresión de carga que después lee el entrenador.

> En esta épica se trabajó **una rama por historia**, como en las Épicas 7, 8 y 11: los
> tickets de una misma HU tocan los mismos archivos y no se aíslan sin `git add -p`.
