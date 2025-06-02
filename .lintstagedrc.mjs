/**
 * Lint-staged configuration for LexiSynth project
 * Progressive validation approach:
 * - Pre-commit: Format files and run unit tests (fast feedback)
 * - Pre-push: Full linting and comprehensive validation (quality gates)
 * @type {import('lint-staged').Configuration}
 */
const config = {
	// TypeScript and JavaScript files (app & components)
	// Format for consistency, test for functionality
	"{app,components,lib}/**/*.{ts,tsx,js,jsx}": [
		"biome format --write",
		"vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
	],

	// BAML files
	"baml_src/**/*.baml": [() => "bun baml:generate"],

	// JSON files - format only for consistency
	"**/*.{json,jsonc}": ["biome format --write"],

	// Configuration files - format only for consistency
	"{*.config.ts,*.config.mjs,commitlint.config.ts,setupTests.ts,vitest.config.ts,vitest.config.no-api.ts,playwright.config.ts,postcss.config.mjs}": ["biome format --write"],

	// Package.json changes - run install
	"package.json": [() => "bun install --frozen-lockfile"],

	// TypeScript configuration changes - run typecheck
	"{tsconfig.json,biome.json,next.config.ts}": [() => "bun typecheck"],

	// Test files - format and test
	"**/*.{test,spec}.{ts,tsx,js,jsx}": [
		"biome format --write",
		"vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
	],

	// Mock files - format only for consistency
	"__mocks__/**/*.{ts,tsx,js,jsx}": ["biome format --write"],

	// Setup test files - format only for consistency
	"setupTests.ts": ["biome format --write"],
};

export default config;
