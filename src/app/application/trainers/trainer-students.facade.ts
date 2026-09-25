import { Injectable, Signal, computed, inject, signal } from '@angular/core';

import { SessionFacade } from '@app/application/auth/session.facade';
import { DomainError, toDomainError } from '@app/domain/shared/model/app-error';
import { Student, fullName } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT, StudentInput } from '@app/domain/students/port/students.port';

import { AsyncState, ViewState, asyncState } from '../shared/async-state';

/** Pestanas de la cartera. Los suspendidos no se mezclan con los activos. */
export type StudentsFilter = 'active' | 'suspended';

/** Normaliza para buscar sin tildes ni mayusculas. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Cartera de alumnos del entrenador.
 *
 * La busqueda y el filtro son computed sobre la lista ya cargada, no
 * consultas nuevas: la cartera de un entrenador cabe de sobra en memoria y
 * asi escribir en el buscador no dispara un `loading` en cada tecla.
 */
// Scoped a la ruta /trainer: sus puertos viven en ese injector, no en el raiz.
@Injectable()
export class TrainerStudentsFacade {
  private readonly students = inject(STUDENTS_PORT);
  private readonly session = inject(SessionFacade);

  private readonly _query = signal('');
  private readonly _filter = signal<StudentsFilter>('active');
  private readonly _saving = signal(false);
  private readonly _saveError = signal<DomainError | null>(null);

  readonly all: AsyncState<Student[]> = asyncState<Student[]>();

  readonly query: Signal<string> = this._query.asReadonly();
  readonly filter: Signal<StudentsFilter> = this._filter.asReadonly();

  /** Bloquea el boton de guardar: sin esto un doble toque crea dos alumnos. */
  readonly saving: Signal<boolean> = this._saving.asReadonly();
  readonly saveError: Signal<DomainError | null> = this._saveError.asReadonly();

  /** Cuantos hay en cada pestana, para los contadores del tab bar. */
  readonly activeCount: Signal<number> = computed(() => this.contar('active'));
  readonly suspendedCount: Signal<number> = computed(() => this.contar('suspended'));

  readonly visible: Signal<Student[]> = computed(() => {
    const termino = normalizar(this._query());
    const estado = this._filter();

    return (this.all.data() ?? [])
      .filter(student => student.status === estado)
      .filter(student => termino === '' || this.coincide(student, termino))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'));
  });

  /**
   * Estado de la lista ya filtrada.
   *
   * No es `all.viewState()`: una cartera con alumnos pero sin coincidencias
   * de busqueda tiene que mostrar el vacio, no la lista completa.
   */
  readonly viewState: Signal<ViewState> = computed(() => {
    const estado = this.all.viewState();
    return estado === 'success' && this.visible().length === 0 ? 'empty' : estado;
  });

  /**
   * True cuando el vacio lo produjo el buscador.
   *
   * Exige termino escrito: una pestana de suspendidos vacia tambien deja
   * cero visibles con la cartera llena, y ahi el mensaje es otro.
   */
  readonly emptyBySearch: Signal<boolean> = computed(
    () => this.viewState() === 'empty' && this._query().trim() !== '',
  );

  load(): void {
    const trainerId = this.session.profileId();
    if (trainerId === null) {
      return;
    }
    this.all.load(() => this.students.listByTrainer(trainerId));
  }

  reload(): void {
    this.all.reload();
  }

  /**
   * Da de alta a un alumno y devuelve su id, o null si el puerto rechazo.
   *
   * Devuelve el id y no un booleano porque quien llama necesita emitir la
   * invitacion a continuacion, y sin el id no puede.
   */
  create(input: Omit<StudentInput, 'trainerId'>): Promise<string | null> {
    const trainerId = this.session.profileId();
    if (trainerId === null || this._saving()) {
      return Promise.resolve(null);
    }

    this._saving.set(true);
    this._saveError.set(null);

    return new Promise(resolve => {
      this.students.create({ ...input, trainerId }).subscribe({
        next: student => {
          this.all.reload();
          this._saving.set(false);
          resolve(student.id);
        },
        error: (cause: unknown) => {
          this._saveError.set(toDomainError(cause));
          this._saving.set(false);
          resolve(null);
        },
      });
    });
  }

  clearSaveError(): void {
    this._saveError.set(null);
  }

  search(query: string): void {
    this._query.set(query);
  }

  selectFilter(filter: StudentsFilter): void {
    this._filter.set(filter);
  }

  private contar(status: StudentsFilter): number {
    return (this.all.data() ?? []).filter(student => student.status === status).length;
  }

  private coincide(student: Student, termino: string): boolean {
    return (
      normalizar(fullName(student)).includes(termino) || normalizar(student.email).includes(termino)
    );
  }
}
