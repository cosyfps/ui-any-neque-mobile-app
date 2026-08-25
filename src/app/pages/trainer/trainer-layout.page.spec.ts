import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { TrainerLayoutPage } from './trainer-layout.page';

describe('TrainerLayoutPage', () => {
  let events: Subject<NavigationEnd>;
  let router: Router;

  const createPage = (initialUrl: string): TrainerLayoutPage => {
    Object.defineProperty(router, 'url', { value: initialUrl, configurable: true });
    return TestBed.runInInjectionContext(() => new TrainerLayoutPage(router));
  };

  const navigateTo = (url: string): void => events.next(new NavigationEnd(1, url, url));

  beforeEach(() => {
    events = new Subject<NavigationEnd>();
    router = {
      url: '/trainer/dashboard',
      events: events.asObservable(),
      navigate: jest.fn().mockResolvedValue(true),
    } as unknown as Router;
  });

  describe('tab activa', () => {
    it('parte desde la URL actual del router', () => {
      const page = createPage('/trainer/dashboard');

      expect(page.isActive('/trainer/dashboard')).toBe(true);
      expect(page.isActive('/trainer/clients')).toBe(false);
    });

    it('descarta los query params de la URL inicial', () => {
      const page = createPage('/trainer/clients?filter=activos');

      expect(page.isActive('/trainer/clients')).toBe(true);
    });

    it('se actualiza con cada NavigationEnd', () => {
      const page = createPage('/trainer/dashboard');

      navigateTo('/trainer/routines');

      expect(page.isActive('/trainer/routines')).toBe(true);
      expect(page.isActive('/trainer/dashboard')).toBe(false);
    });

    it('ignora los query params de la navegacion', () => {
      const page = createPage('/trainer/dashboard');

      navigateTo('/trainer/profile?tab=datos');

      expect(page.isActive('/trainer/profile')).toBe(true);
    });

    it('marca activa la ruta padre de una hija', () => {
      const page = createPage('/trainer/dashboard');

      navigateTo('/trainer/clients/42');

      expect(page.isActive('/trainer/clients')).toBe(true);
    });
  });

  describe('navigate()', () => {
    it('delega en el Router', () => {
      const page = createPage('/trainer/dashboard');

      page.navigate('/trainer/profile');

      expect(router.navigate).toHaveBeenCalledWith(['/trainer/profile']);
    });
  });

  it('no arranca con imagen de perfil', () => {
    expect(createPage('/trainer/dashboard').profileImage).toBeNull();
  });
});
