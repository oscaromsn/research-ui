import path from "node:path";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment & Performance - Force jsdom with explicit pool config
    environment: "jsdom",
    pool: "forks", // Use forks pool for better jsdom isolation
    globals: true,
    passWithNoTests: true, // Don't fail when no tests exist yet
    watch: true, // Enable watch by default for TDD workflow

    // Mock Configuration
    mockReset: true, // Reset mocks before each test
    clearMocks: true, // Clear mock calls before each test
    restoreMocks: true, // Restore original implementations after each test

    // Enhanced Mock Support
    unstubEnvs: true, // Allow environment variable modifications
    unstubGlobals: true, // Allow global modifications

    // DOM Environment Configuration for jsdom
    environmentOptions: {
      jsdom: {
        resources: "usable",
      },
    },

    // Type Checking
    typecheck: {
      tsconfig: "./tsconfig.test.json",
      include: ["**/*.{test,spec}.{ts,tsx}"],
      // Run type checking in parallel for faster feedback
      checker: "tsc",
    },

    // File Discovery
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      ".git/**",
      "e2e/**",
      "playwright-tests/**",
      "**/*.d.ts",
      "coverage/**",
    ],

    // Test Organization
    setupFiles: ["./setupTests.ts"], // More conventional location
    testTimeout: 15_000, // 15s timeout for async operations
    hookTimeout: 10_000, // 10s for setup/teardown

    // Enhanced Environment Variables
    env: {
      ...config({ path: path.resolve(__dirname, ".env.test") }).parsed,
      ...config({ path: path.resolve(__dirname, ".env.local") }).parsed,
      NODE_ENV: "test",
      DEBUG_API_TESTS: process.env.DEBUG_API_TESTS || "false",
      CI: process.env.CI || "false",
      // Add test-specific flags
      SKIP_SLOW_TESTS: process.env.SKIP_SLOW_TESTS || "false",
      MOCK_EXTERNAL_APIS: process.env.MOCK_EXTERNAL_APIS || "true",
      // Control test output verbosity
      VITEST_VERBOSE: process.env.VITEST_VERBOSE || "false",
    },

    // Smart Reporting - Concise by default, verbose when needed
    reporters: (() => {
      const isVerbose = process.env.VITEST_VERBOSE === "true";
      const isCI = process.env.CI === "true";

      if (isCI) {
        return isVerbose
          ? ["verbose", "junit", "json"]
          : ["basic", "junit", "json"];
      }

      return isVerbose ? ["verbose", "html"] : ["dot", "html"];
    })(),
    outputFile: {
      junit: "./test-results/junit.xml",
      json: "./test-results/results.json",
      html: "./test-results/index.html",
    },

    // Enhanced Coverage Configuration
    coverage: {
      provider: "v8",
      enabled: false, // Enable via --coverage flag when needed
      reporter: ["text", "text-summary", "json", "html", "lcov"],
      reportsDirectory: "./coverage",

      // Comprehensive exclusions
      exclude: [
        "node_modules/**",
        "dist/**",
        ".next/**",
        "**/*.d.ts",
        "**/*.{test,spec}.{ts,tsx}",
        "**/*.config.{ts,js,mjs}",
        "**/*.stories.{ts,tsx}",
        "coverage/**",
        "tests/**",
        "__tests__/**",
        "__mocks__/**",
        "baml_client/**",
        "public/**",
        "*.config.*",
        "tailwind.config.*",
        "postcss.config.*",
      ],

      // Progressive thresholds - start reasonable, increase over time
      thresholds: {
        statements: 75,
        branches: 65,
        functions: 75,
        lines: 75,
        // Per-file thresholds prevent single untested files
        perFile: true,
      },

      // Include all source files for accurate coverage
      all: true,
      include: [
        "src/**/*.{ts,tsx}",
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
      ],

      // Skip coverage on certain patterns
      skipFull: false, // Show all files, even 100% covered
    },

    // Dependency Optimization for Next.js
    deps: {
      optimizer: {
        web: {
          include: [
            // Common problematic packages
            "react",
            "react-dom",
            "@testing-library/react",
            "@testing-library/user-event",
            "clsx",
            "class-variance-authority",
          ],
          exclude: ["@babel/runtime", "regenerator-runtime"],
        },
      },
    },

    // Pool configuration moved to top for DOM environment setup

    // Force exit after tests complete to prevent hanging
    forceRerunTriggers: ["**/setupTests.ts", "**/vitest.config.ts"],

    // Teardown timeout to ensure cleanup
    teardownTimeout: 5_000,

    // Prevent tests from running indefinitely
    ...(process.env.CI && { bail: 1 }),
  },

  // Path Resolution (matches your structure)
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./"),
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./components"),
      "@ui": path.resolve(__dirname, "./components/ui"),
      "@domain": path.resolve(__dirname, "./components/domain"),
      "@atoms": path.resolve(__dirname, "./lib/state/atoms"),
      "@lib": path.resolve(__dirname, "./lib"),
      "@tests": path.resolve(__dirname, "./tests"),
      "@mocks": path.resolve(__dirname, "./tests/__mocks__"),
    },
  },

  // Vite-specific optimizations
  esbuild: {
    target: "es2022", // Modern target for faster builds
  },

  // Define globals for better TypeScript support
  define: {
    __DEV__: JSON.stringify(!process.env.CI),
    __TEST__: JSON.stringify(true),
  },
});
