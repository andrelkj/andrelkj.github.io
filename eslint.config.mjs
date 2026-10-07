// @ts-check
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // The site's own files are hand-written vanilla JS and out of scope for the test linter.
    ignores: ['node_modules/', 'test-results/', 'playwright-report/', 'blob-report/', 'script.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Rules for every file that runs inside the Playwright test runner.
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-native-locators': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-conditional-expect': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
    },
  },
  {
    // Specs read like requirements: raw CSS/XPath and positional locators belong in page objects.
    files: ['tests/specs/**/*.ts'],
    rules: {
      'playwright/no-raw-locators': 'error',
      'playwright/no-nth-methods': 'error',
      'playwright/require-tags': 'error',
      'playwright/require-top-level-describe': 'error',
    },
  },
);
