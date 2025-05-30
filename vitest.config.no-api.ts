import path from "node:path";

import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    typecheck: {
      tsconfig: "./tsconfig.test.json",
    },
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      "dist",
      ".git",
      "e2e/**",
      // Exclude tests that are known to require API keys
      "**/*api-dependent*",
      "**/*integration*",
      "**/*e2e*",
      // Exclude example files
      "**/*example*",
    ],
    setupFiles: ["./setupTests.ts"],
    env: {
      // Load environment variables from .env.test file for testing
      ...config({ path: path.resolve(__dirname, ".env.test") }).parsed,
      NODE_ENV: "test",
      // Force all API keys to be unavailable for these tests
      GOOGLE_API_KEY: "",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      XAI_API_KEY: "",
      GROQ_API_KEY: "",
      EXA_API_KEY: "",
      TAVILY_API_KEY: "",
      LINKUP_API_KEY: "",
      // Mark this as no-API test mode
      VITEST_NO_API_MODE: "true",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,js}",
        "coverage/**",
        "__mocks__/**",
        // Exclude API integration code from no-API coverage
        "**/api-test-helpers.ts",
        "**/*api-dependent*",
        "**/*integration*",
      ],
      thresholds: {
        // Adjust these thresholds as your project matures
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
      // Only check coverage of files that have tests
      all: false,
    },
    deps: {
      // Handle errors with Next.js dependencies
      optimizer: {
        web: {
          include: ["*"],
          exclude: ["@babel/runtime", "regenerator-runtime"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./components"),
      "@ui": path.resolve(__dirname, "./components/ui"),
      "@domain": path.resolve(__dirname, "./components/domain"),
      "@atoms": path.resolve(__dirname, "./lib/state/atoms"),
      "@lib": path.resolve(__dirname, "./lib"),
    },
  },
});
