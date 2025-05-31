/**
 * Lint-staged configuration for LexiSynth project
 * @type {import('lint-staged').Configuration}
 */
const config = {
  // TypeScript and JavaScript files (app & components)
  "{app,components,lib}/**/*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "eslint --fix --quiet",
    "vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
  ],

  // BAML files
  "baml_src/**/*.baml": [() => "bun baml:generate"],

  // JSON files
  "**/*.{json,jsonc}": ["biome format --write"],

  // Configuration files (JS/MJS/TS) - use ESLint only for config files
  "*.{js,mjs,ts}": ["eslint --fix --quiet"],

  // Package.json changes - run install
  "package.json": [() => "bun install --frozen-lockfile"],

  // TypeScript configuration changes - run typecheck
  "{tsconfig.json,eslint.config.mjs,biome.json,next.config.ts}": [
    () => "bun typecheck",
  ],

  // Test files - format with Biome and lint with ESLint
  "**/*.{test,spec}.{ts,tsx,js,jsx}": [
    "biome format --write",
    "eslint --fix --quiet",
    "vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
  ],

  // Mock files - format with Biome and lint with ESLint
  "__mocks__/**/*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "eslint --fix --quiet",
  ],

  // Setup test files - format with Biome and lint with ESLint
  "setupTests.ts": [
    "biome format --write",
    "eslint --fix --quiet",
  ],
};

export default config;