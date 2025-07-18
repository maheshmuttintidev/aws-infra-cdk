import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import cdk from 'eslint-plugin-cdk';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**'], // correctly placed ignore pattern
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      cdk,
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
  prettier,
];
