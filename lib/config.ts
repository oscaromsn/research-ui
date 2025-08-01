import { z } from "zod";

import { env } from "./schemas/env";

/**
 * Application configuration with Zod validation
 */

// Research parameters schema - replaces magic numbers in orchestrator
const researchConfigSchema = z.object({
  maxQueriesPerIteration: z.number().int().positive().default(3),
  maxDocumentsPerQuery: z.number().int().positive().default(5),
  searchTimeoutMs: z.number().int().positive().default(30000),
  maxRetries: z.number().int().nonnegative().default(2),
  analysisTimeoutMs: z.number().int().positive().default(45000),
});

// Feature flags schema with validation
const featureFlagsSchema = z.object({
  enableDetailedLogging: z.boolean().default(false),
  enableProgressIndicators: z.boolean().default(true),
  enableAdvancedRetry: z.boolean().default(false),
  // Keep existing feature flags
  enableNewUI: z.boolean().default(false),
  enableBetaFeatures: z.boolean().default(false),
  enableAnalytics: z.boolean().default(true),
  maxUploadSizeMB: z.number().positive().default(10),
});

// API configuration schema with validation
const apiConfigSchema = z.object({
  baseUrl: z.string().url("API base URL must be a valid URL"),
  timeout: z.number().int().positive().default(30000),
  retries: z.number().int().nonnegative().default(3),
  version: z.string().default("v1"),
});

// UI configuration schema with validation
const uiConfigSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  animationsEnabled: z.boolean().default(true),
  defaultPageSize: z.number().int().positive().default(10),
});

/**
 * Environment-specific configuration values
 */
const getEnvironmentConfig = () => {
  // Current environment from server env vars
  const environment = env.NODE_ENV;

  // Define base configurations that apply to all environments
  const baseConfig = {
    research: {
      maxQueriesPerIteration: 3, // Matches current MAX_QUERIES_TO_EXECUTE in orchestrator
      maxDocumentsPerQuery: 5, // Slightly higher than current RESULTS_PER_QUERY (2)
      searchTimeoutMs: 30000,
      maxRetries: 2,
      analysisTimeoutMs: 45000,
    },
    features: {
      enableDetailedLogging: false,
      enableProgressIndicators: true,
      enableAdvancedRetry: false,
      // Keep existing feature flags
      enableNewUI: false,
      enableBetaFeatures: false,
      enableAnalytics: true,
      maxUploadSizeMB: 10,
    },
    api: {
      baseUrl: "https://api.example.com",
      timeout: 30000,
      retries: 3,
      version: "v1",
    },
    ui: {
      theme: "system",
      animationsEnabled: true,
      defaultPageSize: 10,
    },
  };

  // Override with environment-specific values
  switch (environment) {
    case "development":
      return {
        ...baseConfig,
        research: {
          ...baseConfig.research,
          maxDocumentsPerQuery: 5, // More generous in dev
          searchTimeoutMs: 10000, // Faster feedback in dev
        },
        features: {
          ...baseConfig.features,
          enableBetaFeatures: true,
          enableDetailedLogging: true, // Enable detailed logging in dev
        },
        api: {
          ...baseConfig.api,
          baseUrl: "https://dev-api.example.com",
        },
      };
    case "test":
      return {
        ...baseConfig,
        research: {
          ...baseConfig.research,
          maxQueriesPerIteration: 2, // Reduced for tests
          maxDocumentsPerQuery: 2, // Smaller test data
          searchTimeoutMs: 5000, // Faster tests
          maxRetries: 1, // Fewer retries in tests
          analysisTimeoutMs: 30000, // Shorter timeouts for tests
        },
        features: {
          ...baseConfig.features,
          enableAnalytics: false,
          maxUploadSizeMB: 2,
        },
        api: {
          ...baseConfig.api,
          baseUrl: "https://test-api.example.com",
        },
      };
    case "production":
      return baseConfig; // Use production defaults
    default:
      return baseConfig;
  }
};

// Get environment-specific config
const envConfig = getEnvironmentConfig();

// Validate each section with its schema
export const config = {
  research: researchConfigSchema.parse(envConfig.research),
  features: featureFlagsSchema.parse(envConfig.features),
  api: apiConfigSchema.parse(envConfig.api),
  ui: uiConfigSchema.parse(envConfig.ui),
  environment: env.NODE_ENV,
};

// Export the type for use in the application
export type AppConfig = typeof config;
