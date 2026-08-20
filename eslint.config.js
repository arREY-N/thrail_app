// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  // 1. External Encapsulation: External files must import from feature facade
  {
    files: ['src/**/*'],
    ignores: ['src/core/models/*/*/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['@/src/core/models/*/*/**', '**/core/models/*/*/**'],
              message: "Feature encapsulation violation: External files must import from the feature's facade file (e.g., Booking.ts or index.ts), not internal subdirectories.",
            },
          ],
        },
      ],
    },
  },
  // 2. Anti-Circular Rule: Internal feature files must NOT import from their own facade
  {
    files: ['src/core/models/*/*/**'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              // Targets direct facade files (e.g., /Booking or /Booking.ts or /index)
              group: [
                '@/src/core/models/*/[A-Z]*',
                '@/src/core/models/*/index*',
                '**/core/models/*/[A-Z]*',
                '**/core/models/*/index*',
              ],
              message: "Circular dependency risk: Internal feature files must import from concrete internal files, not the feature's facade file.",
            },
          ],
        },
      ],
    },
  },
]);