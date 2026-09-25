import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { DateRange } from '@app/domain/shared/model/date-range';
import { Id } from '@app/domain/shared/model/ids';

import { ScheduledSession } from '../model/scheduled-session.model';

export interface SchedulePort {
  listByStudent(studentId: Id, range: DateRange): Observable<ScheduledSession[]>;
  confirm(sessionId: Id): Observable<ScheduledSession>;
  cancel(sessionId: Id, reason: string): Observable<ScheduledSession>;
}

export const SCHEDULE_PORT = new InjectionToken<SchedulePort>('SchedulePort');
