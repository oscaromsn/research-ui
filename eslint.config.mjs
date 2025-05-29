import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vitest from "@vitest/eslint-plugin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: { plugins: ["@typescript-eslint"] },
});

const eslintConfig = [
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "coverage/**",
            "dist/**",
            "baml_client/**",
        ],
    },
    ...compat.extends("eslint:recommended", "next/core-web-vitals"),
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            // Customize your rules here
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
    {
        files: ["**/__tests__/**/*.{ts,tsx}", "**/__mocks__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
        plugins: {
            vitest,
        },
        rules: {
            ...vitest.configs.recommended.rules,
        },
        languageOptions: {
            globals: {
                ...vitest.environments.env.globals,
            },
        },
    },
];

export default eslintConfig;
