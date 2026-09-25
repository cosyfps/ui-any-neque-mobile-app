import { WorkoutCardComponent } from './workout-card.component';

describe('WorkoutCardComponent', () => {
  let card: WorkoutCardComponent;

  beforeEach(() => {
    card = new WorkoutCardComponent();
  });

  describe('valores por defecto', () => {
    it('arranca activo y sin avance', () => {
      expect(card.active).toBe(true);
      expect(card.percent()).toBe(0);
    });
  });

  describe('percent()', () => {
    it.each([
      [0, 0],
      [0.5, 50],
      [1, 100],
    ])('convierte %f a %i por ciento', (progress, expected) => {
      card.progress = progress;
      expect(card.percent()).toBe(expected);
    });

    it('recorta valores sobre uno', () => {
      card.progress = 1.8;
      expect(card.percent()).toBe(100);
    });

    it('recorta valores negativos', () => {
      card.progress = -0.4;
      expect(card.percent()).toBe(0);
    });

    it('redondea a entero', () => {
      card.progress = 0.333;
      expect(card.percent()).toBe(33);
    });
  });

  describe('avatarInitials()', () => {
    it.each([
      ['Fullbody Workout', 'FW'],
      ['Tren inferior', 'TI'],
      ['Empuje', 'E'],
      ['  Full  body  ', 'FB'],
    ])('de "%s" saca "%s"', (title, expected) => {
      card.title = title;
      expect(card.avatarInitials()).toBe(expected);
    });

    it('devuelve vacio sin titulo', () => {
      card.title = '';
      expect(card.avatarInitials()).toBe('');
    });
  });

  describe('salidas', () => {
    it('action emite al tocar el chevron', () => {
      const spy = jest.fn();
      card.action.subscribe(spy);
      card.action.emit();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});
