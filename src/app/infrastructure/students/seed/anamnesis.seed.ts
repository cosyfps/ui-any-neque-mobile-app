import { Anamnesis } from '@app/domain/students/model/anamnesis.model';

/**
 * Anamnesis de Ana. Los otros dos alumnos semilla no la tienen, para que la
 * ficha muestre el estado vacio sin necesidad de borrar nada.
 */
export const SEED_ANAMNESIS: readonly Anamnesis[] = [
  {
    id: 'anm-001',
    studentId: 'std-001',
    medicalHistory: 'Sin patologías crónicas. Presión arterial normal en el último control.',
    previousInjuries: 'Esguince de tobillo derecho en 2023, recuperado sin secuelas.',
    surgeries: null,
    medications: null,
    allergies: 'Polen.',
    previousActivity: 'Dos años de gimnasio intermitente antes de empezar con Ñeque.',
    declaredGoal: 'Ganar masa muscular y mejorar postura',
    weeklyAvailability: [1, 2, 4, 5],
    emergencyContact: {
      name: 'Marcela Rojas',
      phone: '+56 9 9876 5432',
      relation: 'Madre',
    },
    updatedAt: '2026-03-05T10:00:00.000Z',
  },
];
