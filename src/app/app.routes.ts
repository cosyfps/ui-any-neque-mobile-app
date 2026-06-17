import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/start/start.page').then(m => m.StartPage),
  },
];
