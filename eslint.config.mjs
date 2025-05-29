import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Core ESLint / Next.js / TypeScript
import nextPlugin from "@next/eslint-plugin-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// Selected new plugins for gradual introduction
import vitestPlugin from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jestDomPlugin from "eslint-plugin-jest-dom";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import promisePlugin from "eslint-plugin-promise";
import securityPlugin from "eslint-plugin-security";
import testingLibraryPlugin from "eslint-plugin-testing-library";

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
    ...compat.extends("eslint:recommended", "next/core-web-vitals"),

    // TypeScript Configuration - using recommended instead of strict to avoid issues
    ...tseslint.configs.recommended.map((config) => ({
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

    // Testing configuration
    {
        files: [
            "**/*.test.{ts,tsx}",
            "**/*.spec.{ts,tsx}",
            "**/__tests__/**/*.{ts,tsx}",
            "**/__mocks__/**/*.{ts,tsx}",
            "setupTests.ts",
        ],
        plugins: {
            "jest-dom": jestDomPlugin,
            "testing-library": testingLibraryPlugin,
            vitest: vitestPlugin,
        },
        languageOptions: {
            parser: tseslint.parser,
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
        ],
        languageOptions: {
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
            "@typescript-eslint/no-unnecessary-type-assertion": "warn",
            "prefer-const": "warn",
            "no-var": "error",
        },
    },
);
