import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CLOCK } from '@app/domain/shared/port/clock.port';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';

describe('AppComponent', () => {
  it('monta el shell de Ionic', () => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    });

    const fixture = TestBed.createComponent(AppComponent);

    expect(fixture.componentInstance).toBeInstanceOf(AppComponent);
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('appConfig registra router, Ionic y los adapters de datos', () => {
    expect(appConfig.providers.length).toBeGreaterThanOrEqual(3);
  });

  it('appConfig resuelve el puerto CLOCK', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });
    expect(TestBed.inject(CLOCK).now()).toBeInstanceOf(Date);
  });
});
