import { z } from "zod";
import { string } from "./common";
import { createSchema, parse } from "./utils";

/**
 * Server-side environment variables schema
 * Validates and provides type safety for environment variables
 *
 * This approach ensures your application fails fast if required
 * environment variables are missing or invalid.
 */
const serverEnvSchema = createSchema(
  z.object({
    // Node environment
    NODE_ENV: z.enum(["development", "test", "production"]),

    // Required API keys for legal research functionality
    CEREBRAS_API_KEY: string.nonEmpty.describe("CEREBRAS_API_KEY is required"),
    EXA_API_KEY: string.nonEmpty.describe("EXA_API_KEY is required"),

    // Optional API keys for extended functionality
    GOOGLE_API_KEY: string.nonEmpty.optional(),
    OPENAI_API_KEY: string.nonEmpty.optional(),
    ANTHROPIC_API_KEY: string.nonEmpty.optional(),

    // Optional configuration with defaults
    MAX_SEARCH_QUERIES: string.numeric
      .optional()
      .default("5")
      .transform(Number),
    MAX_DOCUMENTS_PER_QUERY: string.numeric
      .optional()
      .default("10")
      .transform(Number),
    SEARCH_TIMEOUT_MS: string.numeric
      .optional()
      .default("30000")
      .transform(Number),
  })
);

/**
 * Client-side (public) environment variables schema
 * These variables will be exposed to the browser and should NOT contain secrets
 * All client-side env vars must start with NEXT_PUBLIC_
 */
export const clientEnvSchema = createSchema(
  z.object({
    // Add your public environment variables here when needed
    // NEXT_PUBLIC_API_URL: string.url.describe("NEXT_PUBLIC_API_URL must be a valid URL"),
    // NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  })
);

// Process environment variable validation
function validateEnv() {
  try {
    // For server-side env vars - use enhanced error handling
    const serverEnv = parse(
      serverEnvSchema.schema,
      process.env,
      "Missing or invalid server environment variables"
    );

    // For client-side env vars
    const clientEnv = parse(
      clientEnvSchema.schema,
      process.env,
      "Invalid client environment variables"
    );

    return {
      server: serverEnv,
      client: clientEnv,
    };
  } catch (error) {
    // Enhanced error logging for better debugging
    if (error instanceof Error && error.name === "ValidationError") {
      console.error("❌ Environment validation failed:", error.message);
    }
    throw error;
  }
}

const validatedEnv = validateEnv();

/**
 * Validated server-side environment variables
 * For use in server components and API routes
 */
export const env = validatedEnv.server;

/**
 * Validated client-side environment variables
 * For use in client components
 */
export const publicEnv = validatedEnv.client;

/**
 * Type definitions for environment variables
 */
export type ServerEnv = z.infer<typeof serverEnvSchema.schema>;
export type ClientEnv = z.infer<typeof clientEnvSchema.schema>;
