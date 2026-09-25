import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Student, StudentStatus } from '@app/domain/students/model/student.model';
import {
  StudentEditableFields,
  StudentInput,
  StudentSelfEditableFields,
  StudentsPort,
} from '@app/domain/students/port/students.port';

import { MOCK_LATENCY_MS, cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_STUDENTS } from './seed/students.seed';

@Injectable()
export class StudentsMockAdapter implements StudentsPort {
  private readonly clock = inject(CLOCK);
  private students: Student[] = cloneSeed(SEED_STUDENTS) as Student[];
  private nextId = SEED_STUDENTS.length + 1;

  getById(studentId: Id): Observable<Student> {
    const student = this.students.find(item => item.id === studentId);
    return student === undefined ? simulateError<Student>('not_found') : simulate(student);
  }

  listByTrainer(trainerId: Id): Observable<Student[]> {
    return simulate(this.students.filter(item => item.trainerId === trainerId));
  }

  update(studentId: Id, changes: Partial<StudentSelfEditableFields>): Observable<Student> {
    return this.aplicar(studentId, changes);
  }

  edit(studentId: Id, changes: Partial<StudentEditableFields>): Observable<Student> {
    return this.aplicar(studentId, changes);
  }

  create(input: StudentInput): Observable<Student> {
    const normalizado = input.email.trim().toLowerCase();
    if (this.students.some(item => item.email === normalizado)) {
      return simulateError<Student>(
        'conflict',
        MOCK_LATENCY_MS,
        'Ya existe un alumno con ese correo.',
      );
    }

    const student: Student = {
      ...input,
      id: `std-${String(this.nextId++).padStart(3, '0')}`,
      email: normalizado,
      // El nombre del entrenador lo resuelve el BFF con un JOIN; el mock lo
      // copia de otro alumno de la misma cartera para no inventarlo.
      trainerName: this.nombreDelEntrenador(input.trainerId),
      avatarUrl: null,
      status: 'active',
      joinedAt: toIsoDate(this.clock.now()),
    };

    this.students = [...this.students, student];

    return simulate(student);
  }

  setStatus(studentId: Id, status: StudentStatus): Observable<Student> {
    return this.aplicar(studentId, { status });
  }

  private aplicar(studentId: Id, changes: Partial<Student>): Observable<Student> {
    const current = this.students.find(item => item.id === studentId);
    if (current === undefined) {
      return simulateError<Student>('not_found');
    }

    const updated: Student = { ...current, ...changes };
    this.students = this.students.map(item => (item.id === studentId ? updated : item));

    return simulate(updated);
  }

  private nombreDelEntrenador(trainerId: Id): string {
    return this.students.find(item => item.trainerId === trainerId)?.trainerName ?? '';
  }
}
