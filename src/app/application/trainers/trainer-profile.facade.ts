import { Injectable, Signal, computed, inject } from '@angular/core';
import { map } from 'rxjs/operators';

import { SessionFacade } from '@app/application/auth/session.facade';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import {
  Trainer,
  trainerFullName,
  trainerInitials,
} from '@app/domain/trainers/model/trainer.model';
import { TRAINERS_PORT } from '@app/domain/trainers/port/trainers.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/**
 * Perfil del entrenador autenticado.
 *
 * El conteo de alumnos sale de la cartera y no de un campo del perfil: es un
 * dato derivado, y guardarlo aparte lo condena a quedar desactualizado.
 */
// Scoped a la ruta /trainer: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class TrainerProfileFacade {
  private readonly trainers = inject(TRAINERS_PORT);
  private readonly students = inject(STUDENTS_PORT);
  private readonly session = inject(SessionFacade);

  readonly trainer: AsyncState<Trainer> = asyncState<Trainer>();
  readonly activeStudents: AsyncState<number> = asyncState<number>({
    // Cero alumnos es un numero valido, no un vacio que ocultar.
    isEmpty: () => false,
  });

  readonly viewState: Signal<ViewState> = this.trainer.viewState;

  readonly displayName: Signal<string> = computed(() => {
    const value = this.trainer.data();
    return value === null ? '' : trainerFullName(value);
  });

  readonly avatarInitials: Signal<string> = computed(() => {
    const value = this.trainer.data();
    return value === null ? '' : trainerInitials(value);
  });

  readonly activeCount: Signal<number> = computed(() => this.activeStudents.data() ?? 0);

  load(): void {
    const trainerId = this.session.profileId();
    if (trainerId === null) {
      return;
    }
    this.trainer.load(() => this.trainers.getById(trainerId));
    this.activeStudents.load(() =>
      this.students
        .listByTrainer(trainerId)
        .pipe(map(list => list.filter(student => student.status === 'active').length)),
    );
  }

  reload(): void {
    this.trainer.reload();
    this.activeStudents.reload();
  }

  signOut(): Promise<void> {
    return this.session.signOut();
  }
}
