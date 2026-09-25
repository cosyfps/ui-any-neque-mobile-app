import { Assessment } from '@app/domain/students/model/assessment.model';
import { Student } from '@app/domain/students/model/student.model';

/** Alumno que corresponde a la cuenta semilla `ana@neque.cl`. */
export const SEED_STUDENTS: readonly Student[] = [
  {
    id: 'std-001',
    trainerId: 'trn-001',
    trainerName: 'Kelvin Moreno',
    firstName: 'Ana',
    lastName: 'Rojas',
    email: 'ana@neque.cl',
    phone: '+56 9 8765 4321',
    avatarUrl: null,
    status: 'active',
    birthDate: '1996-04-12T00:00:00.000Z',
    heightCm: 165,
    goal: 'Ganar masa muscular y mejorar postura',
    joinedAt: '2026-03-02T00:00:00.000Z',
  },
  // Alumnos de las invitaciones semilla. Existen sin rutina ni evaluaciones
  // para que, al aceptar la invitacion, la app muestre estados vacios en vez
  // de un error de "alumno no encontrado".
  {
    id: 'std-002',
    trainerId: 'trn-001',
    trainerName: 'Kelvin Moreno',
    firstName: 'Camila',
    lastName: 'Soto',
    email: 'camila@neque.cl',
    phone: null,
    avatarUrl: null,
    status: 'active',
    birthDate: null,
    heightCm: null,
    goal: null,
    joinedAt: '2026-09-15T00:00:00.000Z',
  },
  {
    id: 'std-003',
    trainerId: 'trn-001',
    trainerName: 'Kelvin Moreno',
    firstName: 'Diego',
    lastName: 'Paredes',
    email: 'diego@neque.cl',
    phone: null,
    avatarUrl: null,
    status: 'suspended',
    birthDate: null,
    heightCm: null,
    goal: null,
    joinedAt: '2026-01-10T00:00:00.000Z',
  },
];

/**
 * Historial de evaluaciones, de la mas antigua a la mas reciente.
 * Alimenta el IMC del home y la serie de peso de progreso.
 */
export const SEED_ASSESSMENTS: readonly Assessment[] = [
  {
    id: 'asm-001',
    studentId: 'std-001',
    takenAt: '2026-03-05T10:00:00.000Z',
    weightKg: 61.4,
    heightCm: 165,
    bodyFatPct: 27.8,
    muscleMassKg: 40.1,
    measurements: { chestCm: 88, waistCm: 74, hipCm: 96, armCm: 27, thighCm: 54 },
    notes: 'Evaluación inicial.',
  },
  {
    id: 'asm-002',
    studentId: 'std-001',
    takenAt: '2026-05-04T10:00:00.000Z',
    weightKg: 60.2,
    heightCm: 165,
    bodyFatPct: 26.1,
    muscleMassKg: 41.0,
    measurements: { chestCm: 87, waistCm: 72, hipCm: 95, armCm: 27.5, thighCm: 54.5 },
    notes: 'Buena adherencia. Ajustar carga en tren inferior.',
  },
  {
    id: 'asm-003',
    studentId: 'std-001',
    takenAt: '2026-07-06T10:00:00.000Z',
    weightKg: 59.5,
    heightCm: 165,
    bodyFatPct: 24.4,
    muscleMassKg: 42.2,
    measurements: { chestCm: 87, waistCm: 70, hipCm: 94, armCm: 28, thighCm: 55 },
    notes: null,
  },
  {
    id: 'asm-004',
    studentId: 'std-001',
    takenAt: '2026-09-07T10:00:00.000Z',
    weightKg: 58.9,
    heightCm: 165,
    bodyFatPct: 23.1,
    muscleMassKg: 43.0,
    measurements: { chestCm: 86, waistCm: 68, hipCm: 93, armCm: 28.5, thighCm: 55.5 },
    notes: 'Excelente progreso en fuerza de empuje.',
  },
];
