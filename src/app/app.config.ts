import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideMockData } from '@app/infrastructure/shared/mock-providers';

import { environment } from '@env/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideMockData(environment.publicAppUrl)],
};
