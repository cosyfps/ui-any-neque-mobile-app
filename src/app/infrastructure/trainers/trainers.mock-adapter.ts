import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Id } from '@app/domain/shared/model/ids';
import { Trainer } from '@app/domain/trainers/model/trainer.model';
import { TrainerEditableFields, TrainersPort } from '@app/domain/trainers/port/trainers.port';

import { cloneSeed, simulate, simulateError } from '../shared/mock-delay';

import { SEED_TRAINERS } from './seed/trainers.seed';

@Injectable()
export class TrainersMockAdapter implements TrainersPort {
  private trainers: Trainer[] = cloneSeed(SEED_TRAINERS) as Trainer[];

  getById(trainerId: Id): Observable<Trainer> {
    const trainer = this.trainers.find(item => item.id === trainerId);
    return trainer === undefined ? simulateError<Trainer>('not_found') : simulate(trainer);
  }

  update(trainerId: Id, changes: Partial<TrainerEditableFields>): Observable<Trainer> {
    const current = this.trainers.find(item => item.id === trainerId);
    if (current === undefined) {
      return simulateError<Trainer>('not_found');
    }

    const updated: Trainer = { ...current, ...changes };
    this.trainers = this.trainers.map(item => (item.id === trainerId ? updated : item));

    return simulate(updated);
  }
}
