/**
 * Lint-staged configuration for LexiSynth project
 * @type {import('lint-staged').Configuration}
 */
const config = {
  // TypeScript and JavaScript files (app & components)
  "{app,components,lib}/**/*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "eslint --fix --quiet",
    "vitest related --run --reporter=basic --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
  ],

  // BAML files
  "baml_src/**/*.baml": [() => "pnpm baml:generate"],

  // JSON files
  "**/*.{json,jsonc}": ["biome format --write"],

  // Configuration files (JS/MJS/TS) - use ESLint only for config files
  "*.{js,mjs,ts}": ["eslint --fix --quiet"],

  // Package.json changes - run install
  "package.json": [() => "pnpm install --frozen-lockfile"],

  // TypeScript configuration changes - run typecheck
  "{tsconfig.json,eslint.config.mjs,biome.json,next.config.ts}": [
    () => "pnpm typecheck",
  ],

  // Test files - use ESLint only since biome ignores test files
  "**/*.{test,spec}.{ts,tsx,js,jsx}": [
    "eslint --fix --quiet",
    "vitest related --run --reporter=basic --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
  ],
};

export default config;