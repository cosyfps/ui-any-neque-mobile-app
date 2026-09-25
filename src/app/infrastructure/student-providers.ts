import { Provider } from '@angular/core';

import { NotificationsFacade } from '@app/application/notifications/notifications.facade';
import { ProgressFacade } from '@app/application/progress/progress.facade';
import { StudentRoutineFacade } from '@app/application/routines/student-routine.facade';
import { ScheduleFacade } from '@app/application/schedule/schedule.facade';
import { StudentProfileFacade } from '@app/application/students/student-profile.facade';
import { WorkoutFacade } from '@app/application/workouts/workout.facade';
import { NOTIFICATIONS_PORT } from '@app/domain/notifications/port/notifications.port';
import { PROGRESS_PHOTOS_PORT } from '@app/domain/progress/port/progress-photos.port';
import { EXERCISE_CATALOG_PORT, ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { SCHEDULE_PORT } from '@app/domain/schedule/port/schedule.port';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { NotificationsMockAdapter } from './notifications/notifications.mock-adapter';
import { ProgressPhotosMockAdapter } from './progress/progress-photos.mock-adapter';
import { ExerciseCatalogMockAdapter, RoutinesMockAdapter } from './routines/routines.mock-adapter';
import { ScheduleMockAdapter } from './schedule/schedule.mock-adapter';
import { AssessmentsMockAdapter } from './students/assessments.mock-adapter';
import { StudentsMockAdapter } from './students/students.mock-adapter';
import { WorkoutsMockAdapter } from './workouts/workouts.mock-adapter';

/**
 * Puertos y adapters que solo usa el shell del alumno.
 *
 * Se registran en `providers` de la ruta `/student` para que el codigo y las
 * semillas viajen en ese chunk lazy y no engorden el bundle inicial.
 *
 * Al conectar el BFF, esta funcion se reemplaza por `provideStudentHttpAdapters()`
 * y ningun archivo de domain, application o ui cambia.
 */
export function provideStudentMockData(): Provider[] {
  return [
    // Las facades viven en este injector y no en el raiz: dependen de los
    // puertos de abajo, que solo existen dentro de /student.
    StudentProfileFacade,
    WorkoutFacade,
    StudentRoutineFacade,
    ProgressFacade,
    ScheduleFacade,
    NotificationsFacade,

    StudentsMockAdapter,
    AssessmentsMockAdapter,
    RoutinesMockAdapter,
    ExerciseCatalogMockAdapter,
    WorkoutsMockAdapter,
    ProgressPhotosMockAdapter,
    ScheduleMockAdapter,
    NotificationsMockAdapter,

    { provide: STUDENTS_PORT, useExisting: StudentsMockAdapter },
    { provide: ASSESSMENTS_PORT, useExisting: AssessmentsMockAdapter },
    { provide: ROUTINES_PORT, useExisting: RoutinesMockAdapter },
    { provide: EXERCISE_CATALOG_PORT, useExisting: ExerciseCatalogMockAdapter },
    { provide: WORKOUTS_PORT, useExisting: WorkoutsMockAdapter },
    { provide: PROGRESS_PHOTOS_PORT, useExisting: ProgressPhotosMockAdapter },
    { provide: SCHEDULE_PORT, useExisting: ScheduleMockAdapter },
    { provide: NOTIFICATIONS_PORT, useExisting: NotificationsMockAdapter },
  ];
}
