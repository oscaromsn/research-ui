import path from "node:path";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "happy-dom",
        globals: true,
        include: ["**/*.{test,spec}.{ts,tsx}"],
        exclude: ["node_modules", ".next", "dist", ".git"],
        setupFiles: ["./setupTests.ts"],
        env: {
            // Load environment variables from .env.test file for testing
            ...config({ path: path.resolve(__dirname, ".env.test") }).parsed,
            NODE_ENV: "test",
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
