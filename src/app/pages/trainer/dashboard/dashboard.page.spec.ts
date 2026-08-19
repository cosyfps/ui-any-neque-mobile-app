import { Router } from '@angular/router';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  let router: Router;

  const createPageAt = (isoDate: string): DashboardPage => {
    jest.useFakeTimers().setSystemTime(new Date(isoDate));
    return new DashboardPage(router);
  };

  beforeEach(() => {
    router = { navigate: jest.fn().mockResolvedValue(true) } as unknown as Router;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('greetingLabel', () => {
    it.each([
      ['2026-08-18T08:00:00', 'Buenos días'],
      ['2026-08-18T11:59:00', 'Buenos días'],
      ['2026-08-18T12:00:00', 'Buenas tardes'],
      ['2026-08-18T18:59:00', 'Buenas tardes'],
      ['2026-08-18T19:00:00', 'Buenas noches'],
      ['2026-08-18T23:30:00', 'Buenas noches'],
    ])('a las %s saluda con "%s"', (isoDate, expected) => {
      expect(createPageAt(isoDate).greetingLabel).toBe(expected);
    });
  });

  it('formatea la fecha de hoy en es-CL', () => {
    const page = createPageAt('2026-08-18T10:00:00');

    expect(page.today).toBe(
      new Date('2026-08-18T10:00:00').toLocaleDateString('es-CL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    );
  });

  it('arranca en el estado success', () => {
    expect(createPageAt('2026-08-18T10:00:00').state()).toBe('success');
  });

  it('loadData() vuelve al estado loading', () => {
    const page = createPageAt('2026-08-18T10:00:00');

    page.loadData();

    expect(page.state()).toBe('loading');
  });

  it('go() delega la navegacion en el Router', () => {
    const page = createPageAt('2026-08-18T10:00:00');

    page.go('/trainer/clients');

    expect(router.navigate).toHaveBeenCalledWith(['/trainer/clients']);
  });
});
