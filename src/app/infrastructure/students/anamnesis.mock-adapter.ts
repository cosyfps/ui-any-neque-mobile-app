import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Anamnesis, AnamnesisInput } from '@app/domain/students/model/anamnesis.model';
import { AnamnesisPort } from '@app/domain/students/port/anamnesis.port';

import { cloneSeed, simulate } from '../shared/mock-delay';

import { SEED_ANAMNESIS } from './seed/anamnesis.seed';

@Injectable()
export class AnamnesisMockAdapter implements AnamnesisPort {
  private readonly clock = inject(CLOCK);
  private records: Anamnesis[] = cloneSeed(SEED_ANAMNESIS) as Anamnesis[];
  private nextId = SEED_ANAMNESIS.length + 1;

  getByStudent(studentId: Id): Observable<Anamnesis | null> {
    // Un alumno sin anamnesis no es un error: es el estado inicial.
    return simulate(this.records.find(item => item.studentId === studentId) ?? null);
  }

  /** Alta y edicion en la misma operacion: la anamnesis es unica por alumno. */
  save(input: AnamnesisInput): Observable<Anamnesis> {
    const existente = this.records.find(item => item.studentId === input.studentId);
    const guardada: Anamnesis = {
      ...input,
      id: existente?.id ?? `anm-${String(this.nextId++).padStart(3, '0')}`,
      updatedAt: toIsoDate(this.clock.now()),
    };

    this.records =
      existente === undefined
        ? [...this.records, guardada]
        : this.records.map(item => (item.id === guardada.id ? guardada : item));

    return simulate(guardada);
  }
}
