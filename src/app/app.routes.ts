import { Routes } from '@angular/router';

import { provideInvitationMockAdapters } from '@app/infrastructure/auth/auth-providers';
import { authGuard, publicOnlyGuard, roleGuard } from '@app/ui/shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [publicOnlyGuard],
    loadComponent: () => import('./ui/auth/start/start.page').then(m => m.StartPage),
  },
  {
    path: 'forgot-password',
    canMatch: [publicOnlyGuard],
    loadComponent: () =>
      import('./ui/auth/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
  },
  {
    path: 'invite/:token',
    // Con sesion activa la invitacion no se muestra: aceptarla sobrescribiria
    // la sesion del usuario que abrio el enlace.
    canMatch: [publicOnlyGuard],
    providers: [provideInvitationMockAdapters()],
    loadComponent: () => import('./ui/auth/invite/invite.page').then(m => m.InvitePage),
  },
  {
    path: 'trainer',
    canMatch: [authGuard, roleGuard('trainer')],
    loadComponent: () => import('./ui/trainer/trainer-layout.page').then(m => m.TrainerLayoutPage),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./ui/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./ui/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'routines',
        loadComponent: () =>
          import('./ui/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./ui/trainer/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
    ],
  },
  {
    path: 'student',
    canMatch: [authGuard, roleGuard('student')],
    loadChildren: () => import('./ui/student/student.routes').then(m => m.STUDENT_ROUTES),
  },
  {
    path: '**',
    loadComponent: () => import('./ui/shared/pages/not-found.page').then(m => m.NotFoundPage),
  },
];
