import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Student } from '../model/student.model';

/** Campos que el propio alumno puede actualizar desde su perfil. */
export type StudentSelfEditableFields = Pick<Student, 'phone' | 'avatarUrl' | 'heightCm'>;

/**
 * Acceso a alumnos.
 *
 * `listByTrainer` y `setStatus` los declara ya la Epica 8 aunque solo los use
 * el entrenador: asi la Epica 9 extiende adapters en vez de rehacer el puerto.
 */
export interface StudentsPort {
  getById(studentId: Id): Observable<Student>;
  listByTrainer(trainerId: Id): Observable<Student[]>;
  update(studentId: Id, changes: Partial<StudentSelfEditableFields>): Observable<Student>;
}

export const STUDENTS_PORT = new InjectionToken<StudentsPort>('StudentsPort');
