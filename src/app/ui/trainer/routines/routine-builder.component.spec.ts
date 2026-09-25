import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Exercise } from '@app/domain/routines/model/exercise.model';
import { Routine, RoutineDayInput, RoutineInput } from '@app/domain/routines/model/routine.model';
import { Student } from '@app/domain/students/model/student.model';

import { RoutineBuilderComponent } from './routine-builder.component';

const ALUMNO: Student = {
  id: 'std-001',
  trainerId: 'trn-001',
  trainerName: 'Kelvin Moreno',
  firstName: 'Ana',
  lastName: 'Rojas',
  email: 'ana@neque.cl',
  phone: null,
  avatarUrl: null,
  status: 'active',
  birthDate: null,
  heightCm: null,
  goal: null,
  joinedAt: '2026-01-10T00:00:00.000Z',
};

const PUBLICO: Exercise = {
  id: 'ex-001',
  name: 'Sentadilla',
  muscleGroup: 'legs',
  equipment: null,
  thumbnailUrl: null,
  instructions: [],
  ownerTrainerId: null,
};

const PROPIO: Exercise = { ...PUBLICO, id: 'ex-900', name: 'Búlgara', ownerTrainerId: 'trn-001' };

const RUTINA: Routine = {
  id: 'rtn-001',
  studentId: 'std-001',
  trainerId: 'trn-001',
  name: 'Hipertrofia',
  goal: 'Ganar masa',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: '2026-12-01T00:00:00.000Z',
  status: 'active',
  days: [
    {
      id: 'day-001',
      weekday: 1,
      title: 'Tren inferior',
      focus: 'legs',
      estimatedMinutes: 55,
      exercises: [
        {
          id: 'rex-001',
          exerciseId: 'ex-001',
          name: 'Sentadilla',
          order: 1,
          sets: 4,
          reps: 8,
          restSeconds: 90,
          weightKg: 40,
          notes: null,
        },
      ],
    },
  ],
};

describe('RoutineBuilderComponent', () => {
  let fixture: ComponentFixture<RoutineBuilderComponent>;
  let builder: RoutineBuilderComponent;
  let emitido: Omit<RoutineInput, 'trainerId'> | null;

  // Los `input()` senal no se pueden asignar sobre una instancia suelta:
  // este componente se prueba renderizado, como el resto de los compartidos.
  const crear = (routine: Routine | null = null): void => {
    emitido = null;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [RoutineBuilderComponent] });

    fixture = TestBed.createComponent(RoutineBuilderComponent);
    fixture.componentRef.setInput('routine', routine);
    fixture.componentRef.setInput('students', [ALUMNO]);
    fixture.componentRef.setInput('publicExercises', [PUBLICO]);
    fixture.componentRef.setInput('ownExercises', [PROPIO]);
    builder = fixture.componentInstance;
    builder.submitted.subscribe(value => (emitido = value));
    fixture.detectChanges();
    builder.reset();
  };

  const seleccionar = (value: string): Event => ({ target: { value } }) as unknown as Event;

  /** El dia en esa posicion. `noUncheckedIndexedAccess` obliga a comprobar. */
  const dia = (index: number): RoutineDayInput => {
    const value = builder.days()[index];
    if (value === undefined) {
      throw new Error(`no hay dia en la posicion ${index}`);
    }
    return value;
  };

  const llenarCabecera = (): void => {
    builder.form.patchValue({
      name: 'Hipertrofia',
      goal: 'Ganar masa',
      studentId: 'std-001',
      startDate: '2026-09-01',
    });
  };

  beforeEach(() => crear());

  describe('validaciones', () => {
    it('no emite vacio', () => {
      builder.onSubmit();

      expect(emitido).toBeNull();
      expect(builder.validationError()).toContain('Completa nombre');
    });

    // Una rutina sin dias no se puede asignar.
    it('exige al menos un dia', () => {
      llenarCabecera();

      builder.onSubmit();

      expect(builder.validationError()).toContain('al menos un día');
      expect(emitido).toBeNull();
    });

    // Un dia sin ejercicios no le dice nada al alumno en el runner.
    it('exige ejercicios en cada dia', () => {
      llenarCabecera();
      builder.addDay();

      builder.onSubmit();

      expect(builder.validationError()).toContain('al menos un ejercicio');
    });

    it('rechaza dos dias en el mismo dia de la semana', () => {
      llenarCabecera();
      builder.addDay();
      builder.addExercise(dia(0), seleccionar('ex-001'));
      builder.addDay();
      builder.addExercise(dia(1), seleccionar('ex-001'));
      builder.setWeekday(1, seleccionar('1'));

      builder.onSubmit();

      expect(builder.validationError()).toContain('mismo día de la semana');
    });

    it('no muestra errores antes del primer intento', () => {
      expect(builder.validationError()).toBeNull();
    });
  });

  describe('dias', () => {
    it('agregar elige el primer dia libre', () => {
      builder.addDay();
      builder.addDay();

      expect(builder.days().map(day => day.weekday)).toEqual([1, 2]);
    });

    it('agregar deja el dia nuevo abierto', () => {
      builder.addDay();

      expect(builder.openDay()).toBe(0);
    });

    it('tocar la cabecera abre y cierra', () => {
      builder.addDay();

      builder.toggleDay(0);

      expect(builder.openDay()).toBeNull();
    });

    it('quitar lo saca de la lista', () => {
      builder.addDay();

      builder.removeDay(0);

      expect(builder.days()).toHaveLength(0);
    });

    it('cambia dia de la semana, foco, titulo y minutos', () => {
      builder.addDay();

      builder.setWeekday(0, seleccionar('3'));
      builder.setFocus(0, seleccionar('back'));
      builder.setTitle(0, seleccionar('Tracción'));
      builder.setMinutes(0, seleccionar('45'));

      expect(builder.days()[0]).toMatchObject({
        weekday: 3,
        focus: 'back',
        title: 'Tracción',
        estimatedMinutes: 45,
      });
    });

    it('unos minutos invalidos vuelven al valor por defecto', () => {
      builder.addDay();

      builder.setMinutes(0, seleccionar(''));

      expect(builder.days()[0]?.estimatedMinutes).toBe(50);
    });

    it('etiqueta cada dia en espanol', () => {
      expect(builder.etiquetaDia(3)).toBe('Miércoles');
    });
  });

  describe('ejercicios del dia', () => {
    beforeEach(() => builder.addDay());

    it('agrega del catalogo publico con prescripcion por defecto', () => {
      builder.addExercise(dia(0), seleccionar('ex-001'));

      expect(builder.days()[0]?.exercises[0]).toMatchObject({
        exerciseId: 'ex-001',
        name: 'Sentadilla',
        order: 1,
        sets: 3,
        reps: 10,
        restSeconds: 60,
        weightKg: null,
      });
    });

    it('agrega tambien de los propios', () => {
      builder.addExercise(dia(0), seleccionar('ex-900'));

      expect(builder.days()[0]?.exercises[0]?.name).toBe('Búlgara');
    });

    it('la opcion vacia no agrega nada', () => {
      builder.addExercise(dia(0), seleccionar(''));

      expect(builder.days()[0]?.exercises).toHaveLength(0);
    });

    it('un id desconocido no agrega nada', () => {
      builder.addExercise(dia(0), seleccionar('ex-999'));

      expect(builder.days()[0]?.exercises).toHaveLength(0);
    });

    it('quitar renumera el orden', () => {
      builder.addExercise(dia(0), seleccionar('ex-001'));
      builder.addExercise(dia(0), seleccionar('ex-900'));

      builder.removeExercise(dia(0), 0);

      expect(builder.days()[0]?.exercises).toHaveLength(1);
      expect(builder.days()[0]?.exercises[0]?.order).toBe(1);
    });

    it('edita la prescripcion', () => {
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.setPrescription(dia(0), 0, 'sets', seleccionar('5'));
      builder.setPrescription(dia(0), 0, 'weightKg', seleccionar('42.5'));

      expect(builder.days()[0]?.exercises[0]).toMatchObject({ sets: 5, weightKg: 42.5 });
    });

    // Solo la carga admite "sin dato": sin series el runner no sabe cuantas.
    it('vaciar la carga la deja en null', () => {
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.setPrescription(dia(0), 0, 'weightKg', seleccionar(''));

      expect(builder.days()[0]?.exercises[0]?.weightKg).toBeNull();
    });

    it('vaciar las series conserva el valor anterior', () => {
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.setPrescription(dia(0), 0, 'sets', seleccionar(''));

      expect(builder.days()[0]?.exercises[0]?.sets).toBe(3);
    });
  });

  describe('emision', () => {
    it('convierte las fechas a ISO', () => {
      llenarCabecera();
      builder.form.controls.endDate.setValue('2026-12-01');
      builder.addDay();
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.onSubmit();

      expect(emitido?.startDate).toContain('2026-09-01');
      expect(emitido?.endDate).toContain('2026-12-01');
    });

    it('una vigencia sin fin viaja en null', () => {
      llenarCabecera();
      builder.addDay();
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.onSubmit();

      expect(emitido?.endDate).toBeNull();
    });

    it('recorta nombre y objetivo', () => {
      llenarCabecera();
      builder.form.patchValue({ name: '  Hipertrofia  ', goal: '  Ganar masa  ' });
      builder.addDay();
      builder.addExercise(dia(0), seleccionar('ex-001'));

      builder.onSubmit();

      expect(emitido).toMatchObject({ name: 'Hipertrofia', goal: 'Ganar masa' });
    });
  });

  describe('edicion de una rutina existente', () => {
    beforeEach(() => crear(RUTINA));

    it('precarga la cabecera con la fecha en formato de campo', () => {
      expect(builder.form.getRawValue()).toMatchObject({
        name: 'Hipertrofia',
        studentId: 'std-001',
        startDate: '2026-09-01',
        endDate: '2026-12-01',
      });
    });

    it('precarga los dias con sus ejercicios', () => {
      expect(builder.days()).toHaveLength(1);
      expect(builder.days()[0]?.exercises[0]).toMatchObject({ name: 'Sentadilla', sets: 4 });
    });

    it('emite lo editado sin los ids de la rutina anterior', () => {
      builder.onSubmit();

      expect(emitido?.days[0]).not.toHaveProperty('id');
      expect(emitido?.days[0]?.exercises[0]).not.toHaveProperty('id');
    });
  });

  describe('ids', () => {
    it('son unicos por instancia', () => {
      const primero = builder.id('nombre');
      crear();

      expect(builder.id('nombre')).not.toBe(primero);
    });
  });

  describe('nombreDe()', () => {
    it('arma el nombre completo del alumno', () => {
      expect(builder.nombreDe(ALUMNO)).toBe('Ana Rojas');
    });
  });
});
