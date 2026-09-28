import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { AppNotification } from '@app/domain/notifications/model/notification.model';
import { NotificationsPort } from '@app/domain/notifications/port/notifications.port';
import { addDays, parseIsoDate, startOfDay, toIsoDate } from '@app/domain/shared/model/date';
import { Id } from '@app/domain/shared/model/ids';
import { CLOCK } from '@app/domain/shared/port/clock.port';
import { Student } from '@app/domain/students/model/student.model';
import { STUDENTS_PORT } from '@app/domain/students/port/students.port';
import { riskLabel, studentRisk } from '@app/domain/workouts/model/risk';
import { WorkoutSession } from '@app/domain/workouts/model/workout-session.model';
import { WORKOUTS_PORT } from '@app/domain/workouts/port/workouts.port';

import { SEED_ACCOUNTS } from '../auth/seed/accounts.seed';
import { SEED_INVITATIONS } from '../auth/seed/invitations.seed';
import { simulate, simulateError } from '../shared/mock-delay';

/** Hasta donde mira hacia atras: lo mismo que la actividad del inicio. */
const DIAS = 14;

/** Notificacion sin estado de lectura: se lo pone el adapter. */
type Evento = Omit<AppNotification, 'readAt' | 'userId'>;

/**
 * Notificaciones del entrenador, derivadas de lo que ya paso en la app.
 *
 * El BFF las generara en el servidor al ocurrir cada cosa. Aqui se arman al
 * listar, con ids estables por evento, asi marcar una como leida sobrevive a
 * volver a listarlas. Cuatro tipos:
 *
 * - Sesion completada por un alumno.
 * - Ejercicio saltado por molestia o dolor: lo que el entrenador no puede
 *   dejar pasar.
 * - Alumno en riesgo, con la misma regla que el inicio.
 * - Invitacion aceptada.
 */
@Injectable()
export class TrainerNotificationsMockAdapter implements NotificationsPort {
  private readonly clock = inject(CLOCK);
  private readonly students = inject(STUDENTS_PORT);
  private readonly workouts = inject(WORKOUTS_PORT);

  /** Id de notificacion → cuando se leyo. Estado por instancia. */
  private readonly leidas = new Map<Id, string>();
  private ultimas: AppNotification[] = [];

  listByUser(userId: Id): Observable<AppNotification[]> {
    const trainerId = SEED_ACCOUNTS.find(
      account => account.user.id === userId && account.user.role === 'trainer',
    )?.user.profileId;
    if (trainerId === undefined || trainerId === null) {
      return simulate<AppNotification[]>([]);
    }

    return this.students.listByTrainer(trainerId).pipe(
      map(cartera => cartera.filter(student => student.status === 'active')),
      switchMap(activos =>
        activos.length === 0
          ? of<Evento[][]>([])
          : forkJoin(
              activos.map(student =>
                this.workouts
                  .listByStudent(student.id)
                  .pipe(map(sesiones => this.deAlumno(student, sesiones))),
              ),
            ),
      ),
      map(grupos =>
        grupos
          .flat()
          .map(evento => ({ ...evento, userId, readAt: this.leidas.get(evento.id) ?? null }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      ),
      tap(lista => (this.ultimas = lista)),
    );
  }

  markRead(notificationId: Id): Observable<AppNotification> {
    const actual = this.ultimas.find(item => item.id === notificationId);
    if (actual === undefined) {
      return simulateError<AppNotification>('not_found');
    }
    const readAt = actual.readAt ?? toIsoDate(this.clock.now());
    this.leidas.set(notificationId, readAt);
    return simulate({ ...actual, readAt });
  }

  markAllRead(userId: Id): Observable<void> {
    const readAt = toIsoDate(this.clock.now());
    for (const item of this.ultimas) {
      if (item.userId === userId && !this.leidas.has(item.id)) {
        this.leidas.set(item.id, readAt);
      }
    }
    return simulate<void>(undefined);
  }

  private deAlumno(student: Student, sesiones: readonly WorkoutSession[]): Evento[] {
    const ahora = this.clock.now();
    const desde = addDays(startOfDay(ahora), -DIAS);
    const reciente = (iso: string): boolean => {
      const fecha = parseIsoDate(iso);
      return fecha !== null && fecha >= desde;
    };
    const nombre = student.firstName;
    const destino = { targetType: 'student' as const, targetId: student.id };
    const eventos: Evento[] = [];

    for (const sesion of sesiones) {
      const cuando = sesion.completedAt ?? sesion.scheduledFor;
      if (!reciente(cuando)) {
        continue;
      }
      if (sesion.status === 'completed') {
        const minutos = sesion.durationMinutes ?? sesion.estimatedMinutes;
        eventos.push({
          id: `tn-done-${sesion.id}`,
          kind: 'session',
          title: `${nombre} completó su sesión`,
          body: `${sesion.title} · ${minutos} min`,
          createdAt: cuando,
          ...destino,
        });
      }
      for (const ejercicio of sesion.exercises) {
        if (ejercicio.skipped === true && ejercicio.skipReason === 'pain') {
          eventos.push({
            id: `tn-pain-${sesion.id}-${ejercicio.routineExerciseId}`,
            kind: 'alert',
            title: `${nombre} saltó un ejercicio`,
            body: `${ejercicio.name} · Molestia o dolor`,
            createdAt: cuando,
            ...destino,
          });
        }
      }
    }

    const riesgo = studentRisk(sesiones, ahora);
    if (riesgo !== null) {
      const hoy = toIsoDate(startOfDay(ahora));
      eventos.push({
        // Una por dia: si sigue en riesgo manana, es un aviso nuevo.
        id: `tn-risk-${student.id}-${hoy.slice(0, 10)}`,
        kind: 'alert',
        title: `${nombre} está en riesgo`,
        body: riskLabel(riesgo),
        createdAt: hoy,
        ...destino,
      });
    }

    for (const invitacion of SEED_INVITATIONS) {
      if (
        invitacion.studentId === student.id &&
        invitacion.status === 'accepted' &&
        reciente(student.joinedAt)
      ) {
        eventos.push({
          id: `tn-inv-${invitacion.token}`,
          kind: 'invitation',
          title: `${nombre} aceptó tu invitación`,
          body: 'Ya creó su acceso a Ñeque.',
          createdAt: student.joinedAt,
          ...destino,
        });
      }
    }

    return eventos;
  }
}
