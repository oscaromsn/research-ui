/**
 * Lint-staged configuration for JurisConsulta project
 * Progressive validation approach:
 * - Pre-commit: Format files and run unit tests (fast feedback)
 * - Pre-push: Full linting and comprehensive validation (quality gates)
 * @type {import('lint-staged').Configuration}
 */
const config = {
  // TypeScript and JavaScript files (app & components)
  // Format for consistency, test for functionality
  "{app,components,lib}/**/*.{ts,tsx,js,jsx}": [
    "biome format --write --no-errors-on-unmatched",
    // Only run tests if SKIP_RELATED_TESTS is not true
    (filenames) => {
      if (process.env.SKIP_RELATED_TESTS === "true") {
        return [];
      }
      return `vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*' --reporter=basic ${filenames.join(" ")}`;
    },
  ],

  // BAML files - conditionally generate client
  "baml_src/**/*.baml": ["bun baml:generate"],

  // JSON files - format only for consistency
  "**/*.{json,jsonc}": ["biome format --write --no-errors-on-unmatched"],

  // Configuration files - format only for consistency
  "{*.config.ts,*.config.mjs,commitlint.config.ts,setupTests.ts,vitest.config.ts,playwright.config.ts,postcss.config.mjs}":
    ["biome format --write --no-errors-on-unmatched"],

  // Package.json changes - run install with better error handling
  "package.json": ["bun install --frozen-lockfile"],

  // TypeScript configuration changes - run typecheck
  "{tsconfig.json,biome.json,next.config.ts}": ["bun typecheck"],

  // Test files - format and conditionally test
  "**/*.{test,spec}.{ts,tsx,js,jsx}": [
    "biome format --write --no-errors-on-unmatched",
    (filenames) => {
      if (process.env.SKIP_RELATED_TESTS === "true") {
        return [];
      }
      return `vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*' --reporter=basic ${filenames.join(" ")}`;
    },
  ],

  // Mock files - format only for consistency
  "__mocks__/**/*.{ts,tsx,js,jsx}": [
    "biome format --write --no-errors-on-unmatched",
  ],

  // Setup test files - format only for consistency
  "setupTests.ts": ["biome format --write --no-errors-on-unmatched"],
};

export { config as default };
