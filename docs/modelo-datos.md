# Modelo de datos — contrato Front ↔ BFF

**Estado:** v2, con las decisiones del 19-09-2026 cerradas.
**Origen:** `src/app/domain/*/model/*.ts`. El front ya define estos tipos y los consume
contra adapters mock.

**Convención:** tablas y columnas en `camelCase`, igual que las entidades del BFF NestJS.
Así no hay mapeo entre columna y propiedad. Los **valores** de las enumeraciones se dejan
exactamente como el front los envía hoy, porque viajan por el cable: por eso
`workoutStatus` conserva `in_progress` con guion bajo.

---

## Decisiones tomadas

| #   | Decisión                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------- |
| 1   | Identificadores `uuid` v4 generados por la base.                                                         |
| 2   | Sin `profileId` polimórfico: FK inversa única desde `trainers.userId` y `students.userId` hacia `users`. |
| 3   | `createdAt` y `updatedAt` en todas las tablas.                                                           |
| 4   | Borrado lógico uniforme con `deletedAt`.                                                                 |
| 5   | Las copias por comodidad no se guardan: el BFF las resuelve con JOIN.                                    |
| 6   | Las copias que son historial **sí** se guardan: son foto inmutable del momento.                          |
| 7   | Las cinco medidas corporales, en cinco columnas.                                                         |
| 8   | `instructions` del ejercicio, en `jsonb`.                                                                |
| 9   | Fotos en object storage; la tabla guarda la clave y el BFF devuelve URL firmada.                         |
| 10  | Las notificaciones guardan `targetType` + `targetId`, no una ruta del front.                             |
| 11  | Se agrega `workoutSets`: peso y repeticiones reales de cada serie.                                       |
| 12  | Un solo plan semanal activo por alumno, con índice único parcial.                                        |
| 13  | Un solo día de rutina por día de la semana, con índice único.                                            |
| 14  | `trainers` espeja a `students` sin lo clínico, más especialidad, certificaciones y biografía.            |
| 15  | Disponibilidad semanal como arreglo de días ISO 1–7 en `jsonb`.                                          |
| 16  | Anamnesis única por alumno, editable. Sin historial de versiones.                                        |
| 17  | Contacto de emergencia con nombre, teléfono y parentesco.                                                |
| 18  | Cancelación con motivo predefinido **y** texto libre, más quién y cuándo.                                |
| 19  | Todo en UTC; el front formatea en el huso del dispositivo, como ya hace.                                 |

---

## 0. Panorama

19 tablas. Las tres últimas nacen de estas decisiones.

| #   | Tabla                  | Origen en el front    |
| --- | ---------------------- | --------------------- |
| 1   | `users`                | `AuthUser`            |
| 2   | `trainers`             | nuevo                 |
| 3   | `students`             | `Student`             |
| 4   | `invitations`          | `InvitationDetails`   |
| 5   | `passwordResetTickets` | `PasswordResetTicket` |
| 6   | `otpCodes`             | nuevo                 |
| 7   | `authSessions`         | `AuthSession`         |
| 8   | `anamnesis`            | nuevo (Épica 9)       |
| 9   | `assessments`          | `Assessment`          |
| 10  | `exercises`            | `Exercise`            |
| 11  | `routines`             | `Routine`             |
| 12  | `routineDays`          | `RoutineDay`          |
| 13  | `routineExercises`     | `RoutineExercise`     |
| 14  | `workoutSessions`      | `WorkoutSession`      |
| 15  | `workoutExerciseLogs`  | `WorkoutExerciseLog`  |
| 16  | `workoutSets`          | nuevo                 |
| 17  | `progressPhotos`       | `ProgressPhoto`       |
| 18  | `scheduledSessions`    | `ScheduledSession`    |
| 19  | `notifications`        | `AppNotification`     |

**Columnas comunes a todas:** `createdAt timestamptz not null default now()`,
`updatedAt timestamptz not null default now()` mantenida por trigger, y
`deletedAt timestamptz null`. No se repiten en cada tabla de abajo.

---

## 1. `users`

| Columna        | Tipo       | Nulo | Notas                                |
| -------------- | ---------- | ---- | ------------------------------------ |
| `id`           | `uuid`     | no   | PK                                   |
| `email`        | `citext`   | no   | Único. El front normaliza y recorta. |
| `passwordHash` | `text`     | no   | Nunca sale del BFF.                  |
| `role`         | `userRole` | no   | `trainer` \| `student`               |
| `displayName`  | `text`     | no   |                                      |
| `avatarUrl`    | `text`     | sí   |                                      |

El front recibe `profileId` dentro de `AuthUser`. **No es columna:** el BFF lo resuelve
con el JOIN a `trainers` o `students` según el rol, al armar la sesión.

## 2. `trainers`

| Columna          | Tipo          | Nulo | Notas                      |
| ---------------- | ------------- | ---- | -------------------------- |
| `id`             | `uuid`        | no   | PK                         |
| `userId`         | `uuid`        | no   | FK → `users.id`, **único** |
| `firstName`      | `text`        | no   |                            |
| `lastName`       | `text`        | no   |                            |
| `phone`          | `text`        | sí   |                            |
| `avatarUrl`      | `text`        | sí   |                            |
| `specialty`      | `text`        | sí   |                            |
| `certifications` | `jsonb`       | sí   | Arreglo de textos          |
| `bio`            | `text`        | sí   |                            |
| `joinedAt`       | `timestamptz` | no   |                            |

## 3. `students`

| Columna     | Tipo            | Nulo | Notas                      |
| ----------- | --------------- | ---- | -------------------------- |
| `id`        | `uuid`          | no   | PK                         |
| `userId`    | `uuid`          | no   | FK → `users.id`, **único** |
| `trainerId` | `uuid`          | no   | FK → `trainers.id`         |
| `firstName` | `text`          | no   |                            |
| `lastName`  | `text`          | no   |                            |
| `phone`     | `text`          | sí   |                            |
| `avatarUrl` | `text`          | sí   |                            |
| `status`    | `studentStatus` | no   | `active` \| `suspended`    |
| `birthDate` | `date`          | sí   |                            |
| `heightCm`  | `numeric(5,2)`  | sí   |                            |
| `goal`      | `text`          | sí   |                            |
| `joinedAt`  | `timestamptz`   | no   |                            |

`Student.email` y `Student.trainerName` siguen en el contrato del front, pero **no son
columnas**: el correo vive en `users`, y el nombre del entrenador sale del JOIN.

## 4. `invitations`

| Columna      | Tipo               | Nulo | Notas                                             |
| ------------ | ------------------ | ---- | ------------------------------------------------- |
| `token`      | `text`             | no   | PK. Va en `/invite/:token`.                       |
| `studentId`  | `uuid`             | no   | FK → `students.id`                                |
| `expiresAt`  | `timestamptz`      | no   | Emisión + 48 h                                    |
| `status`     | `invitationStatus` | no   | `pending` \| `accepted` \| `expired` \| `revoked` |
| `acceptedAt` | `timestamptz`      | sí   |                                                   |
| `revokedAt`  | `timestamptz`      | sí   |                                                   |

`studentName`, `email` y `trainerName` del contrato salen del JOIN.

## 5. `passwordResetTickets`

| Columna     | Tipo          | Nulo | Notas           |
| ----------- | ------------- | ---- | --------------- |
| `token`     | `text`        | no   | PK, un solo uso |
| `userId`    | `uuid`        | no   | FK → `users.id` |
| `expiresAt` | `timestamptz` | no   | 15 minutos      |
| `usedAt`    | `timestamptz` | sí   |                 |

## 6. `otpCodes`

No existe en el front: el mock usa el código fijo `123456`.

| Columna      | Tipo          | Nulo | Notas                 |
| ------------ | ------------- | ---- | --------------------- |
| `id`         | `uuid`        | no   | PK                    |
| `userId`     | `uuid`        | no   | FK → `users.id`       |
| `codeHash`   | `text`        | no   | Nunca en claro        |
| `expiresAt`  | `timestamptz` | no   | 10 minutos            |
| `attempts`   | `smallint`    | no   | Por defecto 0, tope 5 |
| `consumedAt` | `timestamptz` | sí   |                       |

## 7. `authSessions`

| Columna     | Tipo          | Nulo | Notas              |
| ----------- | ------------- | ---- | ------------------ |
| `token`     | `text`        | no   | PK                 |
| `userId`    | `uuid`        | no   | FK → `users.id`    |
| `expiresAt` | `timestamptz` | no   | El mock usa 7 días |

Si el BFF opta por JWT sin estado, esta tabla desaparece. Es decisión suya.

---

## 8. `anamnesis`

Una fila por alumno. Se edita, no se versiona.

| Columna                    | Tipo    | Nulo | Notas                      |
| -------------------------- | ------- | ---- | -------------------------- |
| `id`                       | `uuid`  | no   | PK                         |
| `studentId`                | `uuid`  | no   | FK, **único**              |
| `medicalHistory`           | `text`  | sí   |                            |
| `previousInjuries`         | `text`  | sí   |                            |
| `surgeries`                | `text`  | sí   |                            |
| `medications`              | `text`  | sí   |                            |
| `allergies`                | `text`  | sí   |                            |
| `previousActivity`         | `text`  | sí   |                            |
| `declaredGoal`             | `text`  | no   | Obligatorio                |
| `weeklyAvailability`       | `jsonb` | no   | Obligatorio. Días ISO 1–7. |
| `emergencyContactName`     | `text`  | sí   |                            |
| `emergencyContactPhone`    | `text`  | sí   |                            |
| `emergencyContactRelation` | `text`  | sí   |                            |

## 9. `assessments`

| Columna        | Tipo           | Nulo | Notas                  |
| -------------- | -------------- | ---- | ---------------------- |
| `id`           | `uuid`         | no   | PK                     |
| `studentId`    | `uuid`         | no   | FK                     |
| `trainerId`    | `uuid`         | no   | FK. Quién la registró. |
| `takenAt`      | `timestamptz`  | no   |                        |
| `weightKg`     | `numeric(5,2)` | no   |                        |
| `heightCm`     | `numeric(5,2)` | no   |                        |
| `bodyFatPct`   | `numeric(4,1)` | sí   |                        |
| `muscleMassKg` | `numeric(5,2)` | sí   |                        |
| `chestCm`      | `numeric(5,2)` | sí   |                        |
| `waistCm`      | `numeric(5,2)` | sí   |                        |
| `hipCm`        | `numeric(5,2)` | sí   |                        |
| `armCm`        | `numeric(5,2)` | sí   |                        |
| `thighCm`      | `numeric(5,2)` | sí   |                        |
| `notes`        | `text`         | sí   |                        |

## 10. `exercises`

| Columna          | Tipo          | Nulo | Notas                                                    |
| ---------------- | ------------- | ---- | -------------------------------------------------------- |
| `id`             | `uuid`        | no   | PK                                                       |
| `name`           | `text`        | no   |                                                          |
| `muscleGroup`    | `muscleGroup` | no   |                                                          |
| `equipment`      | `text`        | sí   |                                                          |
| `thumbnailUrl`   | `text`        | sí   |                                                          |
| `instructions`   | `jsonb`       | no   | Arreglo ordenado de pasos                                |
| `ownerTrainerId` | `uuid`        | sí   | `null` = catálogo público; si no, privado del entrenador |

---

## 11. `routines`

| Columna     | Tipo            | Nulo | Notas                  |
| ----------- | --------------- | ---- | ---------------------- |
| `id`        | `uuid`          | no   | PK                     |
| `studentId` | `uuid`          | no   | FK                     |
| `trainerId` | `uuid`          | no   | FK                     |
| `name`      | `text`          | no   |                        |
| `goal`      | `text`          | no   |                        |
| `startDate` | `date`          | no   |                        |
| `endDate`   | `date`          | sí   |                        |
| `status`    | `routineStatus` | no   | `active` \| `archived` |

## 12. `routineDays`

| Columna            | Tipo          | Nulo | Notas   |
| ------------------ | ------------- | ---- | ------- |
| `id`               | `uuid`        | no   | PK      |
| `routineId`        | `uuid`        | no   | FK      |
| `weekday`          | `smallint`    | no   | ISO 1–7 |
| `title`            | `text`        | no   |         |
| `focus`            | `muscleGroup` | no   |         |
| `estimatedMinutes` | `integer`     | no   |         |

## 13. `routineExercises`

| Columna        | Tipo           | Nulo | Notas                          |
| -------------- | -------------- | ---- | ------------------------------ |
| `id`           | `uuid`         | no   | PK                             |
| `routineDayId` | `uuid`         | no   | FK                             |
| `exerciseId`   | `uuid`         | no   | FK                             |
| `name`         | `text`         | no   | **Foto:** nombre al prescribir |
| `order`        | `integer`      | no   | Único por día                  |
| `sets`         | `integer`      | no   |                                |
| `reps`         | `integer`      | no   |                                |
| `restSeconds`  | `integer`      | no   |                                |
| `weightKg`     | `numeric(6,2)` | sí   |                                |
| `notes`        | `text`         | sí   |                                |

---

## 14. `workoutSessions`

| Columna            | Tipo            | Nulo | Notas                       |
| ------------------ | --------------- | ---- | --------------------------- |
| `id`               | `uuid`          | no   | PK                          |
| `studentId`        | `uuid`          | no   | FK                          |
| `routineId`        | `uuid`          | no   | FK                          |
| `routineDayId`     | `uuid`          | no   | FK                          |
| `title`            | `text`          | no   | **Foto** del título del día |
| `scheduledFor`     | `timestamptz`   | no   |                             |
| `startedAt`        | `timestamptz`   | sí   |                             |
| `completedAt`      | `timestamptz`   | sí   |                             |
| `status`           | `workoutStatus` | no   |                             |
| `durationMinutes`  | `integer`       | sí   |                             |
| `estimatedMinutes` | `integer`       | no   |                             |
| `completionNote`   | `text`          | sí   | De `WorkoutCompletion.note` |

## 15. `workoutExerciseLogs`

Foto de la prescripción: editar la rutina no reescribe el pasado del alumno.

| Columna             | Tipo           | Nulo | Notas |
| ------------------- | -------------- | ---- | ----- |
| `id`                | `uuid`         | no   | PK    |
| `workoutSessionId`  | `uuid`         | no   | FK    |
| `routineExerciseId` | `uuid`         | no   | FK    |
| `exerciseId`        | `uuid`         | no   | FK    |
| `name`              | `text`         | no   | Foto  |
| `targetSets`        | `integer`      | no   | Foto  |
| `targetReps`        | `integer`      | no   | Foto  |
| `restSeconds`       | `integer`      | no   | Foto  |
| `weightKg`          | `numeric(6,2)` | sí   | Foto  |
| `completedSets`     | `integer`      | no   | Real  |
| `done`              | `boolean`      | no   | Real  |

## 16. `workoutSets`

Lo que el alumno realmente levantó, serie por serie. Es lo que permite al entrenador ver
progresión de carga; hoy esa información se pierde.

| Columna                | Tipo           | Nulo | Notas                     |
| ---------------------- | -------------- | ---- | ------------------------- |
| `id`                   | `uuid`         | no   | PK                        |
| `workoutExerciseLogId` | `uuid`         | no   | FK                        |
| `setNumber`            | `smallint`     | no   | 1..n, único por ejercicio |
| `reps`                 | `integer`      | sí   | Repeticiones reales       |
| `weightKg`             | `numeric(6,2)` | sí   | Peso real                 |
| `completedAt`          | `timestamptz`  | no   |                           |

---

## 17. `progressPhotos`

| Columna      | Tipo           | Nulo | Notas                       |
| ------------ | -------------- | ---- | --------------------------- |
| `id`         | `uuid`         | no   | PK                          |
| `studentId`  | `uuid`         | no   | FK                          |
| `takenAt`    | `timestamptz`  | no   |                             |
| `storageKey` | `text`         | no   | Clave en el bucket, no URL  |
| `angle`      | `photoAngle`   | no   | `front` \| `side` \| `back` |
| `weightKg`   | `numeric(5,2)` | sí   |                             |
| `note`       | `text`         | sí   |                             |

El front recibe `url`: el BFF firma la clave con vencimiento en cada respuesta. Son fotos
corporales; el bucket nunca es público.

## 18. `scheduledSessions`

| Columna              | Tipo             | Nulo | Notas                                   |
| -------------------- | ---------------- | ---- | --------------------------------------- |
| `id`                 | `uuid`           | no   | PK                                      |
| `studentId`          | `uuid`           | no   | FK                                      |
| `trainerId`          | `uuid`           | no   | FK                                      |
| `title`              | `text`           | no   |                                         |
| `startsAt`           | `timestamptz`    | no   |                                         |
| `endsAt`             | `timestamptz`    | no   |                                         |
| `location`           | `text`           | sí   |                                         |
| `kind`               | `sessionKind`    | no   | `training` \| `assessment` \| `checkin` |
| `status`             | `scheduleStatus` | no   | `confirmed` \| `pending` \| `cancelled` |
| `workoutSessionId`   | `uuid`           | sí   | FK, solo si `kind = training`           |
| `cancellationReason` | `cancelReason`   | sí   | Motivo predefinido                      |
| `cancellationNote`   | `text`           | sí   | Texto libre                             |
| `cancelledAt`        | `timestamptz`    | sí   |                                         |
| `cancelledBy`        | `uuid`           | sí   | FK → `users.id`                         |

## 19. `notifications`

| Columna      | Tipo               | Nulo | Notas                                             |
| ------------ | ------------------ | ---- | ------------------------------------------------- |
| `id`         | `uuid`             | no   | PK                                                |
| `userId`     | `uuid`             | no   | FK → `users.id`                                   |
| `kind`       | `notificationKind` | no   |                                                   |
| `title`      | `text`             | no   |                                                   |
| `body`       | `text`             | no   |                                                   |
| `readAt`     | `timestamptz`      | sí   | `null` = no leída                                 |
| `targetType` | `targetType`       | sí   | `routine` \| `session` \| `assessment` \| `photo` |
| `targetId`   | `uuid`             | sí   | Id de la entidad destino                          |

La base ya no guarda rutas del front. El mapeo de tipo a ruta vive en el front.

---

## Enumeraciones

| Enum               | Valores                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `userRole`         | `trainer`, `student`                                                       |
| `studentStatus`    | `active`, `suspended`                                                      |
| `invitationStatus` | `pending`, `accepted`, `expired`, `revoked`                                |
| `muscleGroup`      | `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`, `fullbody` |
| `routineStatus`    | `active`, `archived`                                                       |
| `workoutStatus`    | `scheduled`, `in_progress`, `completed`, `skipped`                         |
| `photoAngle`       | `front`, `side`, `back`                                                    |
| `sessionKind`      | `training`, `assessment`, `checkin`                                        |
| `scheduleStatus`   | `confirmed`, `pending`, `cancelled`                                        |
| `notificationKind` | `routine`, `session`, `message`, `system`                                  |
| `targetType`       | `routine`, `session`, `assessment`, `photo`                                |
| `cancelReason`     | `illness`, `travel`, `injury`, `rescheduled`, `other`                      |

## Índices y restricciones

| Regla                                     | Implementación                                                      |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Un alumno, un usuario                     | Único en `students.userId`                                          |
| Un entrenador, un usuario                 | Único en `trainers.userId`                                          |
| Un solo plan semanal activo por alumno    | Único parcial sobre `routines(studentId)` donde `status = 'active'` |
| Un solo día por día de la semana          | Único sobre `routineDays(routineId, weekday)`                       |
| Orden sin repetir dentro de un día        | Único sobre `routineExercises(routineDayId, "order")`               |
| Series sin repetir dentro de un ejercicio | Único sobre `workoutSets(workoutExerciseLogId, setNumber)`          |
| Una anamnesis por alumno                  | Único en `anamnesis.studentId`                                      |
| Cartera del entrenador                    | Índice en `students(trainerId, status)`                             |
| Agenda por rango                          | Índice en `scheduledSessions(studentId, startsAt)`                  |
| Bandeja sin leer                          | Índice parcial en `notifications(userId)` donde `readAt is null`    |

Archivar el plan anterior y activar el nuevo va **en una sola transacción**, o el índice
único parcial rechaza la segunda inserción.

---

## Lo que esto cambia en el front

La mayoría de las decisiones no lo tocan: `trainerName`, `email` de alumno y los tres
campos de la invitación siguen llegando igual, resueltos por JOIN. Estas tres **sí** lo
cambian. Se hicieron contra los mocks en la HU-9.12, antes de conectar el BFF:

| Cambio                              | Qué implica                                                                                                                                                                      | Estado   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `AppNotification.actionRoute` se va | Pasó a `targetType` + `targetId`. El mapa tipo → ruta vive en `ui/shared/navigation/notification-target.ts`; la página ya no navega a una cadena que venía de datos.             | ✅ hecho |
| `workoutSets` es nuevo              | `WorkoutSet` en `domain/workouts`, `WorkoutExerciseLog.sets` y `logSet(sessionId, routineExerciseId, set)`. El runner precarga lo prescrito y registra lo que el alumno corrija. | ✅ hecho |
| `SCHEDULE_PORT.cancel` cambia firma | `cancel(sessionId, reason: CancelReason, note)`. La cita guarda motivo, nota y `cancelledAt`.                                                                                    | ✅ hecho |

`cancelledBy` no se mapea en el front: el BFF lo deriva del token y ninguna pantalla lo
muestra todavía.

---

## Lo que sigue abierto

1. Si el BFF usa JWT sin estado, `authSessions` no existe.
2. `equipment` del ejercicio es texto libre; si mañana hace falta filtrar por implemento,
   necesita catálogo.
3. `reps` es un entero: no admite rangos como «8-12» ni «al fallo». Se descartó por ahora.
4. Sin huso horario por usuario: correcto mientras entrenador y alumno estén en Chile.
5. Pagos, suscripciones y `Flow.cl` no están modelados. Quedaron fuera de alcance.
