import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';

import { Trainer } from '../model/trainer.model';

/** Campos que el entrenador puede editar de su propio perfil. */
export type TrainerEditableFields = Pick<
  Trainer,
  'firstName' | 'lastName' | 'phone' | 'avatarUrl' | 'specialty' | 'certifications' | 'bio'
>;

export interface TrainersPort {
  getById(trainerId: Id): Observable<Trainer>;
  update(trainerId: Id, changes: Partial<TrainerEditableFields>): Observable<Trainer>;
}

export const TRAINERS_PORT = new InjectionToken<TrainersPort>('TrainersPort');
