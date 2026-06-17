// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos para FitConnect
    'type-enum': [
      2,
      'always',
      [
        'feat',     // nueva funcionalidad
        'fix',      // corrección de bug
        'docs',     // solo documentación
        'style',    // formato, sin cambio lógico
        'refactor', // refactoring sin feat ni fix
        'test',     // agregar o corregir tests
        'chore',    // tareas de mantenimiento, deps, CI
        'perf',     // mejora de rendimiento
        'ci',       // cambios en CI/CD
        'revert',   // revertir commit
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
