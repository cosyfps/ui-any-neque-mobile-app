import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { AssessmentsPort } from '@app/domain/students/port/assessments.port';

import { cloneSeed, simulate } from '../shared/mock-delay';

import { SEED_ASSESSMENTS } from './seed/students.seed';

@Injectable()
export class AssessmentsMockAdapter implements AssessmentsPort {
  private readonly clock = inject(CLOCK);
  private assessments: Assessment[] = cloneSeed(SEED_ASSESSMENTS) as Assessment[];

  /** Ordenadas de la mas reciente a la mas antigua. */
  listByStudent(studentId: Id): Observable<Assessment[]> {
    return simulate(this.forStudent(studentId));
  }

  latestByStudent(studentId: Id): Observable<Assessment | null> {
    return simulate(this.forStudent(studentId)[0] ?? null);
  }

  create(input: Omit<Assessment, 'id' | 'takenAt'>): Observable<Assessment> {
    const ahora = this.clock.now();
    const created: Assessment = {
      ...input,
      id: `asm-${ahora.getTime()}`,
      takenAt: toIsoDate(ahora),
    };
    this.assessments = [...this.assessments, created];
    return simulate(created);
  }

  private forStudent(studentId: Id): Assessment[] {
    return this.assessments
      .filter(item => item.studentId === studentId)
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  }
}
