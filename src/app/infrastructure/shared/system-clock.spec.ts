import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  afterEach(() => jest.useRealTimers());

  it('now() devuelve la hora del sistema', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-17T10:00:00.000Z'));
    expect(new SystemClock().now().toISOString()).toBe('2026-09-17T10:00:00.000Z');
  });

  it('now() devuelve una instancia nueva en cada llamada', () => {
    const clock = new SystemClock();
    expect(clock.now()).not.toBe(clock.now());
  });
});
