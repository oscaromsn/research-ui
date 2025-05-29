import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import nextPlugin from "@next/eslint-plugin-next";
import vitestPlugin from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jestDomPlugin from "eslint-plugin-jest-dom";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import promisePlugin from "eslint-plugin-promise";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import securityPlugin from "eslint-plugin-security";
import testingLibraryPlugin from "eslint-plugin-testing-library";
import globals from "globals";
import tseslint, { configs, parser } from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {},
});

export default tseslint.config(
  {
    // Global ignores
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "baml_client/**", // Keep BAML client ignored
      "public/**",
      "setupTests.ts",
    ],
  },

  // Base ESLint rules
  ...compat.extends("eslint:recommended"),

  // TypeScript Configuration - using recommended instead of strict to avoid issues
  ...configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.{ts,tsx}"],
  })),

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    settings: {
      react: { version: "detect" },
    },
  },

  // Next.js Configuration
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // React Configuration (simplified)
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },

  // Import plugin
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: path.join(__dirname, "tsconfig.json"),
        },
        node: true,
      },
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },

  // Accessibility
  {
    files: ["**/*.{tsx}"],
    plugins: {
      "jsx-a11y": jsxA11yPlugin,
    },
    rules: {
      ...jsxA11yPlugin.configs.recommended.rules,
    },
  },

  // Promise handling
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    plugins: {
      promise: promisePlugin,
    },
    rules: {
      ...promisePlugin.configs.recommended.rules,
    },
  },

  // Basic security
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    plugins: {
      security: securityPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      // Disable overly strict rules that may cause issues
      "security/detect-object-injection": "off",
    },
  },

  // Testing configuration (Vitest/RTL - excludes e2e)
  {
    files: [
      "**/*.test.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "**/__mocks__/**/*.{ts,tsx}",
      "__mocks__/**/*.{ts,tsx}",
      "setupTests.ts",
    ],
    plugins: {
      "jest-dom": jestDomPlugin,
      "testing-library": testingLibraryPlugin,
      vitest: vitestPlugin,
    },
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: false, // Disable TypeScript project for test files
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...vitestPlugin.environments.env.globals,
      },
    },
    rules: {
      ...jestDomPlugin.configs.recommended.rules,
      ...testingLibraryPlugin.configs.react.rules,
      ...vitestPlugin.configs.recommended.rules,
      // Relax strict rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Disable React act() warnings in tests - these are often unavoidable in complex scenarios
      "testing-library/no-unnecessary-act": "off",
      "testing-library/no-wait-for-side-effects": "off",
      // Disable testing library rules that are too strict for our complex test scenarios
      "testing-library/no-wait-for-multiple-assertions": "off",
      "testing-library/no-node-access": "off",
      // Disable promise param naming for test scenarios
      "promise/param-names": "off",
      // Disable vitest expect-expect for tests with implicit assertions
      "vitest/expect-expect": "off",
    },
  },

  // E2E Testing configuration (Playwright)
  {
    files: ["e2e/**/*.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: false, // Disable TypeScript project for e2e test files
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Relax strict rules for e2e tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "no-console": "off", // Allow console in e2e tests for debugging
    },
  },

  // Configuration files (JS/MJS/TS config files)
  {
    files: [
      "*.config.{js,mjs,ts}",
      "**/*.config.{js,mjs,ts}",
      "next.config.{js,mjs,ts}",
      "tailwind.config.{js,mjs,ts}",
      "vitest.config.{js,mjs,ts}",
      "eslint.config.{js,mjs}",
      ".lintstagedrc.{js,mjs,ts}",
    ],
    languageOptions: {
      parserOptions: {
        project: false, // Disable TypeScript project for config files
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // Relax some rules for config files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "import/no-default-export": "off", // Config files often use default exports
      "no-console": "off", // Config files may need console output
      // Allow CommonJS patterns in config files
      "@typescript-eslint/no-require-imports": "off",
      "unicorn/prefer-module": "off",
    },
  },

  // Project-specific rules
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Your existing custom rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Additional useful rules
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports" },
      ],
      "prefer-const": "warn",
      "no-var": "error",
    },
  },

  // TypeScript rules that require type information - only for non-test files
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "**/__mocks__/**/*.{ts,tsx}",
      "__mocks__/**/*.{ts,tsx}",
      "setupTests.ts",
      "*.config.{js,mjs,ts}",
      "**/*.config.{js,mjs,ts}",
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },
);
