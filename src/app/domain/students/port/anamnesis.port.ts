import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Anamnesis, AnamnesisInput } from '../model/anamnesis.model';

/**
 * Antecedentes del alumno.
 *
 * `save` hace alta y edicion: la anamnesis es unica por alumno, asi que no
 * tiene sentido separar crear de actualizar.
 */
export interface AnamnesisPort {
  /** `null` cuando el entrenador todavia no la registra. */
  getByStudent(studentId: Id): Observable<Anamnesis | null>;
  save(input: AnamnesisInput): Observable<Anamnesis>;
}

export const ANAMNESIS_PORT = new InjectionToken<AnamnesisPort>('AnamnesisPort');
