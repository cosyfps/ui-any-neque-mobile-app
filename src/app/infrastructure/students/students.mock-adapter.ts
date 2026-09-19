import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';
import { Student } from '@app/domain/students/model/student.model';
import { StudentSelfEditableFields, StudentsPort } from '@app/domain/students/port/students.port';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_STUDENTS } from './seed/students.seed';

@Injectable()
export class StudentsMockAdapter implements StudentsPort {
  private students: Student[] = cloneSeed(SEED_STUDENTS) as Student[];

  getById(studentId: Id): Observable<Student> {
    const student = this.students.find(item => item.id === studentId);
    return student === undefined ? simulateError<Student>('not_found') : simulate(student);
  }

  listByTrainer(trainerId: Id): Observable<Student[]> {
    return simulate(this.students.filter(item => item.trainerId === trainerId));
  }

  update(studentId: Id, changes: Partial<StudentSelfEditableFields>): Observable<Student> {
    const current = this.students.find(item => item.id === studentId);
    if (current === undefined) {
      return simulateError<Student>('not_found');
    }

    const updated: Student = { ...current, ...changes };
    this.students = this.students.map(item => (item.id === studentId ? updated : item));

    return simulate(updated);
  }
}
