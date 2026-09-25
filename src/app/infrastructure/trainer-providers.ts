import { Provider } from '@angular/core';

import { INVITATION_PORT } from '@app/domain/auth/port/invitation.port';
import { EXERCISE_CATALOG_PORT, ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { SCHEDULE_PORT } from '@app/domain/schedule/port/schedule.port';
import { ANAMNESIS_PORT } from '@app/domain/students/port/anamnesis.port';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { TRAINERS_PORT } from '@app/domain/trainers/port/trainers.port';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { InvitationMockAdapter } from './auth/invitation.mock-adapter';
import { ExerciseCatalogMockAdapter, RoutinesMockAdapter } from './routines/routines.mock-adapter';
import { ScheduleMockAdapter } from './schedule/schedule.mock-adapter';
import { AnamnesisMockAdapter } from './students/anamnesis.mock-adapter';
import { AssessmentsMockAdapter } from './students/assessments.mock-adapter';
import { StudentsMockAdapter } from './students/students.mock-adapter';
import { TrainersMockAdapter } from './trainers/trainers.mock-adapter';
import { WorkoutsMockAdapter } from './workouts/workouts.mock-adapter';

/**
 * Puertos y adapters del shell del entrenador.
 *
 * Se registran en `providers` de la ruta `/trainer` para que viajen en su
 * chunk lazy, igual que los del alumno. Comparten varios puertos con
 * `provideStudentMockData()`, pero cada shell tiene su propio injector: los
 * dos roles nunca conviven en la misma sesion.
 *
 * Al conectar el BFF esta funcion se reemplaza por
 * `provideTrainerHttpAdapters()` y ningun archivo de domain, application o ui
 * cambia.
 */
export function provideTrainerMockData(): Provider[] {
  return [
    TrainersMockAdapter,
    StudentsMockAdapter,
    InvitationMockAdapter,
    AnamnesisMockAdapter,
    AssessmentsMockAdapter,
    RoutinesMockAdapter,
    ExerciseCatalogMockAdapter,
    WorkoutsMockAdapter,
    ScheduleMockAdapter,

    { provide: TRAINERS_PORT, useExisting: TrainersMockAdapter },
    { provide: STUDENTS_PORT, useExisting: StudentsMockAdapter },
    { provide: INVITATION_PORT, useExisting: InvitationMockAdapter },
    { provide: ANAMNESIS_PORT, useExisting: AnamnesisMockAdapter },
    { provide: ASSESSMENTS_PORT, useExisting: AssessmentsMockAdapter },
    { provide: ROUTINES_PORT, useExisting: RoutinesMockAdapter },
    { provide: EXERCISE_CATALOG_PORT, useExisting: ExerciseCatalogMockAdapter },
    { provide: WORKOUTS_PORT, useExisting: WorkoutsMockAdapter },
    { provide: SCHEDULE_PORT, useExisting: ScheduleMockAdapter },
  ];
}
