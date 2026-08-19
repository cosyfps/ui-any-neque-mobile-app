import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
    expect(fixture.nativeElement.querySelector('ion-router-outlet')).toBeTruthy();
  });

  it('appConfig registra los providers de router e Ionic', () => {
    expect(appConfig.providers.length).toBe(2);
  });
});
