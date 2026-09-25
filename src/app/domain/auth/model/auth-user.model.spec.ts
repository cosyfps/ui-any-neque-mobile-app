import { homeRouteForRole } from './auth-user.model';

describe('homeRouteForRole', () => {
  it('manda al entrenador a su dashboard', () => {
    expect(homeRouteForRole('trainer')).toBe('/trainer/home');
  });

  it('manda al alumno a su home', () => {
    expect(homeRouteForRole('student')).toBe('/student/home');
  });
});
