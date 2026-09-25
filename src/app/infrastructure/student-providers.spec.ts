import { TestBed } from '@angular/core/testing';

import { NOTIFICATIONS_PORT } from '@app/domain/notifications/port/notifications.port';
import { PROGRESS_PHOTOS_PORT } from '@app/domain/progress/port/progress-photos.port';
import { EXERCISE_CATALOG_PORT, ROUTINES_PORT } from '@app/domain/routines/port/routines.port';
import { SCHEDULE_PORT } from '@app/domain/schedule/port/schedule.port';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { provideStudentMockData } from './student-providers';

describe('provideStudentMockData', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CLOCK, useValue: { now: () => new Date('2026-09-17T10:00:00.000Z') } },
        ...provideStudentMockData(),
      ],
    });
  });

  it.each([
    ['STUDENTS_PORT', STUDENTS_PORT],
    ['ASSESSMENTS_PORT', ASSESSMENTS_PORT],
    ['ROUTINES_PORT', ROUTINES_PORT],
    ['EXERCISE_CATALOG_PORT', EXERCISE_CATALOG_PORT],
    ['WORKOUTS_PORT', WORKOUTS_PORT],
    ['PROGRESS_PHOTOS_PORT', PROGRESS_PHOTOS_PORT],
    ['SCHEDULE_PORT', SCHEDULE_PORT],
    ['NOTIFICATIONS_PORT', NOTIFICATIONS_PORT],
  ])('resuelve %s', (_label, token) => {
    expect(TestBed.inject(token)).toBeDefined();
  });

  it('cada puerto resuelve al mismo adapter en toda la ruta', () => {
    expect(TestBed.inject(WORKOUTS_PORT)).toBe(TestBed.inject(WORKOUTS_PORT));
  });
});
