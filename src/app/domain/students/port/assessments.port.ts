import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Assessment } from '../model/assessment.model';

/**
 * Evaluaciones fisicas.
 *
 * Lo consumen el home del alumno (para el IMC) y la pantalla de progreso
 * (para la serie de peso). Una sola fuente, sin duplicar la consulta.
 */
export interface AssessmentsPort {
  listByStudent(studentId: Id): Observable<Assessment[]>;
  latestByStudent(studentId: Id): Observable<Assessment | null>;
  /**
   * Registra una evaluacion. La fecha la pone el backend con su reloj: es
   * cuando se tomo, y dejarla en manos del cliente la vuelve falsificable.
   */
  create(input: Omit<Assessment, 'id' | 'takenAt'>): Observable<Assessment>;
}

export const ASSESSMENTS_PORT = new InjectionToken<AssessmentsPort>('AssessmentsPort');
