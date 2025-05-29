/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript and JavaScript files
  "**/*.{ts,tsx,js,jsx}": [
    "biome format --write",
    "eslint --fix --quiet",
    "vitest related --run --reporter=verbose",
  ],

  // BAML files
  "baml_src/**/*.baml": [() => "pnpm baml:generate", () => "pnpm baml:test"],

  // JSON files
  "**/*.json": ["biome format --write"],

  // CSS files
  "**/*.{css,scss,sass}": ["biome format --write"],

  // Markdown files (skip biome as it doesn't support .md)
  "**/*.md": [
    // Skip formatting for markdown files
  ],

  // Package.json changes - run install
  "package.json": [() => "pnpm install --frozen-lockfile"],

  // Configuration file changes - run typecheck
  "{tsconfig.json,eslint.config.mjs,biome.json,next.config.ts}": [
    () => "pnpm typecheck",
  ],

  // Test file changes - run related tests
  "**/*.{test,spec}.{ts,tsx,js,jsx}": [
    "eslint --fix --quiet",
    "biome format --write",
    "vitest related --run --reporter=verbose",
  ],
};
