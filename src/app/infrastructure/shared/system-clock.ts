import { Injectable } from '@angular/core';

import { Clock } from '@app/domain/shared/port/clock.port';

/** Implementacion real del puerto Clock sobre el reloj del sistema. */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
