module.exports = {
  extends: ['plugin:prettier/recommended'],
  parserOptions: { ecmaVersion: 2018, sourceType: 'module' },
  overrides: [
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['simple-import-sort'],
      extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
      rules: {
        '@typescript-eslint/camelcase': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/no-explicit-any': 0,
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 0,
        '@typescript-eslint/ban-ts-comment': 0,
      },
    },
  ],
};
