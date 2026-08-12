import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/start/start.page').then(m => m.StartPage),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
  },
  {
    path: 'trainer',
    loadComponent: () =>
      import('./pages/trainer/trainer-layout.page').then(m => m.TrainerLayoutPage),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./pages/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./pages/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
    ],
  },
];
