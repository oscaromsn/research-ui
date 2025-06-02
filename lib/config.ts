import { z } from "zod"

import { env } from "./schemas/env"

/**
 * Application configuration with Zod validation
 */

// Feature flags schema with validation
const featureFlagsSchema = z.object({
  enableNewUI: z.boolean().default(false),
  enableBetaFeatures: z.boolean().default(false),
  enableAnalytics: z.boolean().default(true),
  maxUploadSizeMB: z.number().positive().default(10),
})

// API configuration schema with validation
const apiConfigSchema = z.object({
  baseUrl: z.string().url("API base URL must be a valid URL"),
  timeout: z.number().int().positive().default(30000),
  retries: z.number().int().nonnegative().default(3),
  version: z.string().default("v1"),
})

// UI configuration schema with validation
const uiConfigSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  animationsEnabled: z.boolean().default(true),
  defaultPageSize: z.number().int().positive().default(10),
})

/**
 * Environment-specific configuration values
 */
const getEnvironmentConfig = () => {
  // Current environment from server env vars
  const environment = env.NODE_ENV

  // Define base configurations that apply to all environments
  const baseConfig = {
    api: {
      baseUrl: "https://api.example.com",
      timeout: 30000,
      retries: 3,
      version: "v1",
    },
    features: {
      enableNewUI: false,
      enableBetaFeatures: false,
      enableAnalytics: true,
      maxUploadSizeMB: 10,
    },
    ui: {
      theme: "system",
      animationsEnabled: true,
      defaultPageSize: 10,
    },
  }

  // Override with environment-specific values
  switch (environment) {
    case "development":
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: "https://dev-api.example.com",
        },
        features: { ...baseConfig.features, enableBetaFeatures: true },
      }
    case "test":
      return {
        ...baseConfig,
        api: {
          ...baseConfig.api,
          baseUrl: "https://test-api.example.com",
        },
        features: {
          ...baseConfig.features,
          enableAnalytics: false,
          maxUploadSizeMB: 2,
        },
      }
    case "production":
      return baseConfig
    default:
      return baseConfig
  }
}

// Get environment-specific config
const envConfig = getEnvironmentConfig()

// Validate each section with its schema
export const config = {
  api: apiConfigSchema.parse(envConfig.api),
  features: featureFlagsSchema.parse(envConfig.features),
  ui: uiConfigSchema.parse(envConfig.ui),
  environment: env.NODE_ENV,
}

// Export the type for use in the application
export type AppConfig = typeof config
