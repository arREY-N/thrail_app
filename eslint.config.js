// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const fs = require('fs');
const path = require('path');

// Automatically detect all feature model directories under src/core/models
const modelsDir = path.resolve(process.cwd(), 'src/core/models');
const featureDirs = fs.existsSync(modelsDir)
  ? fs
      .readdirSync(modelsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== 'utils')
      .map((entry) => entry.name)
  : [];

// Helper to generate encapsulation restriction patterns for a given list of features
const createEncapsulationPatterns = (features) =>
  features.map((feature) => ({
    group: [
      `@/src/core/models/${feature}/**`,
      `**/core/models/${feature}/**`,
      `!@/src/core/models/${feature}/${feature}`,
      `!@/src/core/models/${feature}/${feature}.*`,
      `!**/core/models/${feature}/${feature}`,
      `!**/core/models/${feature}/${feature}.*`,
    ],
    message: `Feature encapsulation violation: External files must import from "${feature}" facade (${feature}.ts), not its internal subdirectories.`,
  }));

// Helper to generate anti-circular restriction pattern for a feature's own internal files
const createAntiCircularPattern = (feature) => ({
  group: [
    `@/src/core/models/${feature}/${feature}`,
    `@/src/core/models/${feature}/${feature}.*`,
    `**/core/models/${feature}/${feature}`,
    `**/core/models/${feature}/${feature}.*`,
    `../*${feature}`,
    `../${feature}`,
    `../../${feature}`,
  ],
  message: `Circular dependency risk: Internal files of "${feature}" must NOT import from their own facade file (${feature}.ts). Import directly from concrete internal files instead.`,
});

// Specific rule sets for each feature model's internal files
const featureInternalRules = featureDirs.map((feature) => {
  const otherFeatures = featureDirs.filter((f) => f !== feature);
  return {
    files: [`src/core/models/${feature}/**/*.{js,jsx,ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            createAntiCircularPattern(feature),
            ...createEncapsulationPatterns(otherFeatures),
          ],
        },
      ],
    },
  };
});

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  },
  // 1. Global Encapsulation: Applies to all application files (including Expo Router groups)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'warn',
        {
          patterns: createEncapsulationPatterns(featureDirs),
        },
      ],
    },
  },
  // 2. Feature Internal Rules: Allows internal imports within same feature, blocks own facade & other features' internals
  ...featureInternalRules,
]);