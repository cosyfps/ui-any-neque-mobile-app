// lint-staged.config.js
module.exports = {
  '**/*.ts': ['eslint --fix --max-warnings 0', 'prettier --write'],
  '**/*.{html,scss,json,md}': ['prettier --write'],
};
