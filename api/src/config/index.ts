import { z } from "zod";

/**
 * API Configuration with Zod validation
 * Simplified version focused on research pipeline requirements
 */

// Research parameters schema - replaces magic numbers in orchestrator
const researchConfigSchema = z.object({
  maxQueriesPerIteration: z.number().positive().int().default(3),
  maxDocumentsPerQuery: z.number().positive().int().default(5),
  searchTimeoutMs: z.number().positive().int().default(30000),
  maxRetries: z.number().nonnegative().int().default(2),
  analysisTimeoutMs: z.number().positive().int().default(45000),
});

// Environment configuration
const environmentConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  EXA_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  CEREBRAS_API_KEY: z.string().optional(),
});

/**
 * Environment-specific configuration values
 */
const getEnvironmentConfig = () => {
  // Get environment from process.env
  const environment = process.env.NODE_ENV || "development";

  // Define base configurations that apply to all environments
  const baseConfig = {
    research: {
      maxQueriesPerIteration: 3,
      maxDocumentsPerQuery: 5,
      searchTimeoutMs: 30000,
      maxRetries: 2,
      analysisTimeoutMs: 45000,
    },
  };

  // Override with environment-specific values
  switch (environment) {
    case "development":
      return {
        ...baseConfig,
        research: {
          ...baseConfig.research,
          maxDocumentsPerQuery: 3, // Fewer docs in dev for faster feedback
          searchTimeoutMs: 15000, // Faster timeout in dev
        },
      };
    case "test":
      return {
        ...baseConfig,
        research: {
          ...baseConfig.research,
          maxQueriesPerIteration: 2, // Reduced for tests
          maxDocumentsPerQuery: 2, // Smaller test data
          searchTimeoutMs: 10000, // Faster tests
          maxRetries: 1, // Fewer retries in tests
          analysisTimeoutMs: 20000, // Shorter timeouts for tests
        },
      };
    case "production":
      return baseConfig; // Use production defaults
    default:
      return baseConfig;
  }
};

// Parse environment variables
const envConfig = getEnvironmentConfig();
const environment = environmentConfigSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  EXA_API_KEY: process.env.EXA_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY,
});

// Validate and export configuration
export const config = {
  research: researchConfigSchema.parse(envConfig.research),
  environment: environment.NODE_ENV,
  env: environment,
};

// Export the type for use in the application
export type ApiConfig = typeof config;

// Helper function to get API keys safely
export function getApiKey(
  service: keyof typeof config.env
): string | undefined {
  return config.env[service];
}

// Helper function to check if required API keys are available
export function validateRequiredApiKeys(): {
  isValid: boolean;
  missing: string[];
} {
  const required = ["EXA_API_KEY"];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
