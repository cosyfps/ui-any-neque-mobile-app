import { Trainer } from '@app/domain/trainers/model/trainer.model';

/** Entrenador que corresponde a la cuenta semilla `kelvin@neque.cl`. */
export const SEED_TRAINERS: readonly Trainer[] = [
  {
    id: 'trn-001',
    userId: 'usr-001',
    firstName: 'Kelvin',
    lastName: 'Moreno',
    email: 'kelvin@neque.cl',
    phone: '+56 9 1234 5678',
    avatarUrl: null,
    specialty: 'Hipertrofia y recomposición corporal',
    certifications: ['Entrenador personal certificado', 'Especialista en fuerza'],
    bio: 'Entreno a personas que quieren cambiar su composición corporal sin dejar su vida de lado.',
    joinedAt: '2025-11-02T00:00:00.000Z',
  },
];
