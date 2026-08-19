import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      'references/**',
      '**/*.test.*',
      'eslint.config.mjs',
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/member-ordering': 'error',
      '@typescript-eslint/sort-type-constituents': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  eslintConfigPrettier,
);
