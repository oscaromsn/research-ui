import { z } from "zod";
import { createSchema, env, number, string } from "./schemas";

/**
 * Application configuration with enhanced Zod validation
 * Uses common schema utilities for consistency and better error handling
 */

// Research parameters schema - replaces magic numbers in orchestrator
const researchConfigSchema = createSchema(
  z.object({
    maxQueriesPerIteration: number.positive.int().default(3),
    maxDocumentsPerQuery: number.positive.int().default(5),
    searchTimeoutMs: number.positive.int().default(30000),
    maxRetries: number.nonNegative.int().default(2),
    analysisTimeoutMs: number.positive.int().default(300000), // 5 minutes for entire pipeline
    documentAnalysisTimeoutMs: number.positive.int().default(60000), // 60 seconds per document
    documentAnalysisMaxRetries: number.nonNegative.int().default(2), // retry failed documents
  })
);

// Feature flags schema with validation
const featureFlagsSchema = createSchema(
  z.object({
    enableDetailedLogging: z.boolean().default(false),
    enableProgressIndicators: z.boolean().default(true),
    enableAdvancedRetry: z.boolean().default(false),
    // Keep existing feature flags
    enableNewUI: z.boolean().default(false),
    enableBetaFeatures: z.boolean().default(false),
    enableAnalytics: z.boolean().default(true),
    maxUploadSizeMB: number.positive.default(10),
  })
);

// API configuration schema with validation
const apiConfigSchema = createSchema(
  z.object({
    baseUrl: string.url.describe("API base URL must be a valid URL"),
    timeout: number.positive.int().default(30000),
    retries: number.nonNegative.int().default(3),
    version: string.nonEmpty.default("v1"),
  })
);

// UI configuration schema with validation
const uiConfigSchema = createSchema(
  z.object({
    theme: z.enum(["light", "dark", "system"]).default("system"),
    animationsEnabled: z.boolean().default(true),
    defaultPageSize: number.positive.int().default(10),
  })
);

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
      analysisTimeoutMs: 300000, // 5 minutes for entire pipeline
      documentAnalysisTimeoutMs: 60000, // 60 seconds per document
      documentAnalysisMaxRetries: 2, // retry failed documents
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
          analysisTimeoutMs: 120000, // 2 minutes for dev
          documentAnalysisTimeoutMs: 30000, // 30 seconds per document in dev
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
          documentAnalysisTimeoutMs: 10000, // 10 seconds per document in tests
          documentAnalysisMaxRetries: 1, // single retry in tests
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

// Validate each section with enhanced schema methods and better error messages
export const config = {
  research: researchConfigSchema.parse(
    envConfig.research,
    "Invalid research configuration"
  ),
  features: featureFlagsSchema.parse(
    envConfig.features,
    "Invalid feature flags configuration"
  ),
  api: apiConfigSchema.parse(envConfig.api, "Invalid API configuration"),
  ui: uiConfigSchema.parse(envConfig.ui, "Invalid UI configuration"),
  environment: env.NODE_ENV,
};

// Export the type for use in the application
export type AppConfig = typeof config;
