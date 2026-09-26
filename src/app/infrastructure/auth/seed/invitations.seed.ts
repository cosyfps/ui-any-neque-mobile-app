import { InvitationDetails } from '@app/domain/auth/port/invitation.port';

/**
 * Tres tokens que cubren los tres caminos de `/invite/:token`.
 * Para probar a mano: /invite/inv-valida, /invite/inv-expirada, /invite/inv-usada
 */
export const SEED_INVITATIONS: readonly InvitationDetails[] = [
  {
    token: 'inv-valida',
    studentId: 'std-002',
    studentName: 'Camila Soto',
    email: 'camila@neque.cl',
    trainerName: 'Kelvin Moreno',
    expiresAt: '2026-12-31T23:59:59.000Z',
    status: 'pending',
  },
  {
    token: 'inv-expirada',
    studentId: 'std-003',
    studentName: 'Diego Paredes',
    email: 'diego@neque.cl',
    trainerName: 'Kelvin Moreno',
    expiresAt: '2026-01-31T23:59:59.000Z',
    status: 'expired',
  },
  {
    token: 'inv-usada',
    studentId: 'std-001',
    studentName: 'Alejandra Acosta',
    email: 'alejandra@neque.cl',
    trainerName: 'Kelvin Moreno',
    expiresAt: '2026-12-31T23:59:59.000Z',
    status: 'accepted',
  },
];
