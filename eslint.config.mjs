import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: { plugins: ["@typescript-eslint"] },
});

const eslintConfig = [
    {
        ignores: ["node_modules/**", ".next/**", "coverage/**", "dist/**"],
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
];

export default eslintConfig;
