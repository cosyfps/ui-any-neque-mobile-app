import { Trainer, trainerFullName, trainerInitials } from './trainer.model';

const trainer: Trainer = {
  id: 'trn-001',
  userId: 'usr-001',
  firstName: 'Kelvin',
  lastName: 'Moreno',
  email: 'kelvin@neque.cl',
  phone: null,
  avatarUrl: null,
  specialty: null,
  certifications: [],
  bio: null,
  joinedAt: '2025-11-02T00:00:00.000Z',
};

describe('trainer model', () => {
  describe('trainerFullName()', () => {
    it('une nombre y apellido', () => {
      expect(trainerFullName(trainer)).toBe('Kelvin Moreno');
    });

    it('no deja espacios sobrantes sin apellido', () => {
      expect(trainerFullName({ ...trainer, lastName: '' })).toBe('Kelvin');
    });
  });

  describe('trainerInitials()', () => {
    it('toma la inicial de cada campo en mayuscula', () => {
      expect(trainerInitials(trainer)).toBe('KM');
    });

    it('devuelve una sola letra sin apellido', () => {
      expect(trainerInitials({ ...trainer, lastName: '' })).toBe('K');
    });

    it('devuelve vacio sin nombre ni apellido', () => {
      expect(trainerInitials({ ...trainer, firstName: '', lastName: '' })).toBe('');
    });
  });
});
