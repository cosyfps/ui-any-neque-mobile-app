import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

import { provideMockData } from '@app/infrastructure/shared/mock-providers';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideIonicAngular({ scrollAssist: false, swipeBackEnabled: false }),
    provideMockData(),
  ],
};
