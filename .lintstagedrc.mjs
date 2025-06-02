/**
 * Lint-staged configuration for LexiSynth project
 * @type {import('lint-staged').Configuration}
 */
const config = {
	// TypeScript and JavaScript files (app & components)
	"{app,components,lib}/**/*.{ts,tsx,js,jsx}": [
		"biome check --write",
		"vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
	],

	// BAML files
	"baml_src/**/*.baml": [() => "bun baml:generate"],

	// JSON files
	"**/*.{json,jsonc}": ["biome format --write"],

	// Configuration files (JS/MJS/TS) - use Biome for specific config files only
	"{*.config.ts,*.config.mjs,commitlint.config.ts,setupTests.ts,vitest.config.ts,vitest.config.no-api.ts,playwright.config.ts,postcss.config.mjs}": ["biome check --write"],

	// Package.json changes - run install
	"package.json": [() => "bun install --frozen-lockfile"],

	// TypeScript configuration changes - run typecheck
	"{tsconfig.json,biome.json,next.config.ts}": [() => "bun typecheck"],

	// Test files - format and lint with Biome
	"**/*.{test,spec}.{ts,tsx,js,jsx}": [
		"biome check --write",
		"vitest related --run --bail=1 --testTimeout=5000 --exclude='**/*integration*' --exclude='**/*e2e*'",
	],

	// Mock files - format and lint with Biome
	"__mocks__/**/*.{ts,tsx,js,jsx}": ["biome check --write"],

	// Setup test files - format and lint with Biome
	"setupTests.ts": ["biome check --write"],
};

export default config;
