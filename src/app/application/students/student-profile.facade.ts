import { Injectable, Signal, computed, inject } from '@angular/core';

import { SessionFacade } from '@app/application/auth/session.facade';
import { Assessment } from '@app/domain/students/model/assessment.model';
import { BmiResult, calculateBmi } from '@app/domain/students/model/bmi';
import { Student, fullName, initials } from '@app/domain/students/model/student.model';
import { ASSESSMENTS_PORT } from '@app/domain/students/port/assessments.port';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/**
 * Ficha del alumno autenticado.
 *
 * El IMC sale de la ultima evaluacion registrada por el entrenador: es la
 * unica metrica del home que el backlog puede alimentar hoy.
 */
// Scoped a la ruta /student: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class StudentProfileFacade {
  private readonly students = inject(STUDENTS_PORT);
  private readonly assessments = inject(ASSESSMENTS_PORT);
  private readonly session = inject(SessionFacade);

  readonly student: AsyncState<Student> = asyncState<Student>();
  readonly latestAssessment: AsyncState<Assessment | null> = asyncState<Assessment | null>({
    // Un alumno sin evaluaciones no es un error: es un estado valido.
    isEmpty: () => false,
  });

  readonly displayName: Signal<string> = computed(() => {
    const value = this.student.data();
    return value === null ? '' : fullName(value);
  });

  readonly firstName: Signal<string> = computed(() => this.student.data()?.firstName ?? '');

  readonly avatarInitials: Signal<string> = computed(() => {
    const value = this.student.data();
    return value === null ? '' : initials(value);
  });

  readonly bmi: Signal<BmiResult | null> = computed(() => {
    const assessment = this.latestAssessment.data();
    if (assessment === null || assessment === undefined) {
      return null;
    }
    return calculateBmi(assessment.weightKg, assessment.heightCm);
  });

  readonly weightKg: Signal<number | null> = computed(
    () => this.latestAssessment.data()?.weightKg ?? null,
  );

  readonly heightCm: Signal<number | null> = computed(
    () => this.latestAssessment.data()?.heightCm ?? this.student.data()?.heightCm ?? null,
  );

  readonly viewState: Signal<ViewState> = this.student.viewState;

  /** Carga la ficha del alumno de la sesion activa. */
  load(): void {
    const studentId = this.session.profileId();
    if (studentId === null) {
      return;
    }
    this.student.load(() => this.students.getById(studentId));
    this.latestAssessment.load(() => this.assessments.latestByStudent(studentId));
  }

  reload(): void {
    this.student.reload();
    this.latestAssessment.reload();
  }
}
