import { FlatCompat } from "@eslint/eslintrc";
import { flatConfig as nextPlugin } from "@next/eslint-plugin-next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // Extend legacy configs
    ...compat.extends("next/core-web-vitals", "next/typescript"),

    // Add Next.js plugin flat config explicitly (modern approach)
    nextPlugin,
];

export default eslintConfig;
