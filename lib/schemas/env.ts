import { z } from "zod";

/**
 * Server-side environment variables schema
 * Validates and provides type safety for environment variables
 *
 * This approach ensures your application fails fast if required
 * environment variables are missing or invalid.
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Required API keys for legal research functionality
  CEREBRAS_API_KEY: z.string().min(1, "CEREBRAS_API_KEY is required"),
  EXA_API_KEY: z.string().min(1, "EXA_API_KEY is required"),

  // Optional API keys for extended functionality
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

/**
 * Client-side (public) environment variables schema
 * These variables will be exposed to the browser and should NOT contain secrets
 * All client-side env vars must start with NEXT_PUBLIC_
 */
export const clientEnvSchema = z.object({
  // Add your public environment variables here
  // NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL"),
  // NEXT_PUBLIC_APP_VERSION: z.string().optional(),
});

// Process environment variable validation
function validateEnv() {
  // For server-side env vars
  const serverEnv = serverEnvSchema.safeParse(process.env);

  // For client-side env vars
  const clientEnv = clientEnvSchema.safeParse(process.env);

  if (!serverEnv.success) {
    // Extract missing or invalid fields for a clear error message
    const errors = serverEnv.error.errors;
    const missingFields = errors
      .filter(
        (error) => error.code === "too_small" || error.code === "invalid_type"
      )
      .map((error) => error.path.join("."));
    const invalidEnumFields = errors
      .filter((error) => error.code === "invalid_enum_value")
      .map((error) => error.path.join("."));

    const allInvalidFields = [...missingFields, ...invalidEnumFields];

    console.error(
      "❌ Invalid server environment variables:",
      JSON.stringify(serverEnv.error.format(), null, 2)
    );

    throw new Error(
      `Missing or invalid environment variables: ${allInvalidFields.join(", ")}`
    );
  }

  if (!clientEnv.success) {
    console.error(
      "❌ Invalid client environment variables:",
      JSON.stringify(clientEnv.error.format(), null, 2)
    );
    throw new Error("Invalid client environment variables");
  }

  return {
    server: serverEnv.data,
    client: clientEnv.data,
  };
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
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
