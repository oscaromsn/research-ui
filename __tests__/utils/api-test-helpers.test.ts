/**
 * Tests for API testing helper utilities
 * These tests validate the conditional test execution logic
 *
 * Note: This file uses the delete operator for environment variables, which is
 * the correct approach for test isolation. Environment variables in Node.js
 * are strings, and setting them to undefined converts to "undefined" string
 * which is still truthy. The delete operator is required to actually remove
 * them from process.env for proper test isolation.
 */

import { describe, expect, it, vi } from "vitest"

import {
  hasRequiredApiKeys,
  isCI,
  skipIfMissingApiKeys,
  skipInCiIfMissingApiKeys,
} from "../test-utils"
import { API_KEYS, logApiKeyStatus } from "./api-test-helpers"

describe("API Testing Utilities", () => {
  describe("hasRequiredApiKeys", () => {
    it("should return false for missing API keys", () => {
      expect(hasRequiredApiKeys(["DEFINITELY_MISSING_KEY"])).toBe(false)
    })

    it("should return false for empty API keys", () => {
      const originalKey = process.env.TEST_EMPTY_KEY
      process.env.TEST_EMPTY_KEY = ""

      expect(hasRequiredApiKeys(["TEST_EMPTY_KEY"])).toBe(false)

      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_EMPTY_KEY = originalKey
      } else {
        process.env.TEST_EMPTY_KEY = undefined
      }
    })

    it("should return false for placeholder API keys", () => {
      const originalKey = process.env.TEST_PLACEHOLDER_KEY
      process.env.TEST_PLACEHOLDER_KEY = "[YOUR_API_KEY]"

      expect(hasRequiredApiKeys(["TEST_PLACEHOLDER_KEY"])).toBe(false)

      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_PLACEHOLDER_KEY = originalKey
      } else {
        process.env.TEST_PLACEHOLDER_KEY = undefined
      }
    })

    it("should return false for masked API keys", () => {
      const originalKey = process.env.TEST_MASKED_KEY
      process.env.TEST_MASKED_KEY = "****"

      expect(hasRequiredApiKeys(["TEST_MASKED_KEY"])).toBe(false)

      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_MASKED_KEY = originalKey
      } else {
        process.env.TEST_MASKED_KEY = undefined
      }
    })

    it("should return true for valid API keys", () => {
      const originalKey = process.env.TEST_VALID_KEY
      process.env.TEST_VALID_KEY = "sk-valid-api-key-123"

      expect(hasRequiredApiKeys(["TEST_VALID_KEY"])).toBe(true)

      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_VALID_KEY = originalKey
      } else {
        process.env.TEST_VALID_KEY = undefined
      }
    })

    it("should return true for empty array", () => {
      expect(hasRequiredApiKeys([])).toBe(true)
    })

    it("should check all keys in array", () => {
      const originalKey1 = process.env.TEST_KEY_1
      const originalKey2 = process.env.TEST_KEY_2

      process.env.TEST_KEY_1 = "valid-key-1"
      process.env.TEST_KEY_2 = "" // Invalid

      expect(hasRequiredApiKeys(["TEST_KEY_1", "TEST_KEY_2"])).toBe(false)

      process.env.TEST_KEY_2 = "valid-key-2"
      expect(hasRequiredApiKeys(["TEST_KEY_1", "TEST_KEY_2"])).toBe(true)

      // Restore
      if (originalKey1 !== undefined) {
        process.env.TEST_KEY_1 = originalKey1
      } else {
        process.env.TEST_KEY_1 = undefined
      }
      if (originalKey2 !== undefined) {
        process.env.TEST_KEY_2 = originalKey2
      } else {
        process.env.TEST_KEY_2 = undefined
      }
    })
  })

  describe("skipIfMissingApiKeys", () => {
    it("should return false when keys are missing", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        // Mock implementation
      })

      const result = skipIfMissingApiKeys(["DEFINITELY_MISSING_KEY"], "Test")

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping "Test" - Missing API keys: DEFINITELY_MISSING_KEY'
      )

      consoleSpy.mockRestore()
    })

    it("should return true when all keys are available", () => {
      const originalKey = process.env.TEST_AVAILABLE_KEY
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        // Mock implementation
      })

      process.env.TEST_AVAILABLE_KEY = "valid-key"

      const result = skipIfMissingApiKeys(["TEST_AVAILABLE_KEY"], "Test")

      expect(result).toBe(true)
      expect(consoleSpy).not.toHaveBeenCalled()

      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_AVAILABLE_KEY = originalKey
      } else {
        process.env.TEST_AVAILABLE_KEY = undefined
      }
      consoleSpy.mockRestore()
    })

    it("should handle missing test name", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        // Mock implementation
      })

      const result = skipIfMissingApiKeys(["MISSING_KEY"])

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(
        "Skipping test - Missing API keys: MISSING_KEY"
      )

      consoleSpy.mockRestore()
    })
  })

  describe("isCI", () => {
    it("should detect CI environment variables", () => {
      // Save all CI-related environment variables
      const ciEnvVars = [
        "CI",
        "GITHUB_ACTIONS",
        "GITLAB_CI",
        "CIRCLECI",
        "TRAVIS",
        "BUILDKITE",
        "VERCEL",
      ]
      const originalEnvVars = ciEnvVars.reduce(
        (acc, key) => {
          acc[key] = process.env[key]
          return acc
        },
        {} as Record<string, string | undefined>
      )

      // Clear all CI environment variables first
      for (const key of ciEnvVars) {
        delete process.env[key]
      }

      // Test CI=true
      process.env.CI = "true"
      expect(isCI()).toBe(true)

      // Clear and test GitHub Actions
      // biome-ignore lint/performance/noDelete: Required for proper environment variable testing
      delete process.env.CI
      process.env.GITHUB_ACTIONS = "true"
      expect(isCI()).toBe(true)

      // Test no CI - clear all CI variables
      // biome-ignore lint/performance/noDelete: Required for proper environment variable testing
      delete process.env.GITHUB_ACTIONS
      expect(isCI()).toBe(false)

      // Restore all original environment variables
      for (const [key, value] of Object.entries(originalEnvVars)) {
        if (value !== undefined) {
          process.env[key] = value
        } else {
          delete process.env[key]
        }
      }
    })
  })

  describe("skipInCiIfMissingApiKeys", () => {
    it("should skip in CI when keys are missing", () => {
      // Save all CI-related environment variables
      const ciEnvVars = [
        "CI",
        "GITHUB_ACTIONS",
        "GITLAB_CI",
        "CIRCLECI",
        "TRAVIS",
        "BUILDKITE",
        "VERCEL",
      ]
      const originalEnvVars = ciEnvVars.reduce(
        (acc, key) => {
          acc[key] = process.env[key]
          return acc
        },
        {} as Record<string, string | undefined>
      )

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        // Mock implementation
      })

      // Clear all CI environment variables first, then set CI=true
      for (const key of ciEnvVars) {
        delete process.env[key]
      }
      process.env.CI = "true"

      const result = skipInCiIfMissingApiKeys(["MISSING_KEY"], "CI Test")

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()

      // Restore all original environment variables
      for (const [key, value] of Object.entries(originalEnvVars)) {
        if (value !== undefined) {
          process.env[key] = value
        } else {
          delete process.env[key]
        }
      }
      consoleSpy.mockRestore()
    })

    it("should not skip in local development", () => {
      // Save all CI-related environment variables
      const ciEnvVars = [
        "CI",
        "GITHUB_ACTIONS",
        "GITLAB_CI",
        "CIRCLECI",
        "TRAVIS",
        "BUILDKITE",
        "VERCEL",
      ]
      const originalEnvVars = ciEnvVars.reduce(
        (acc, key) => {
          acc[key] = process.env[key]
          return acc
        },
        {} as Record<string, string | undefined>
      )

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {
        // Mock implementation
      })

      // Clear all CI environment variables to simulate local development
      for (const key of ciEnvVars) {
        delete process.env[key]
      }

      const result = skipInCiIfMissingApiKeys(["MISSING_KEY"], "Local Test")

      expect(result).toBe(true)
      expect(consoleSpy).not.toHaveBeenCalled()

      // Restore all original environment variables
      for (const [key, value] of Object.entries(originalEnvVars)) {
        if (value !== undefined) {
          process.env[key] = value
        } else {
          delete process.env[key]
        }
      }
      consoleSpy.mockRestore()
    })
  })

  describe("API_KEYS constant", () => {
    it("should have correct structure", () => {
      expect(API_KEYS.GOOGLE_AI).toEqual(["GOOGLE_API_KEY"])
      expect(API_KEYS.OPENAI).toEqual(["OPENAI_API_KEY"])
      expect(API_KEYS.EXA_SEARCH).toEqual(["EXA_API_KEY"])
      expect(API_KEYS.ALL_LLM).toContain("GOOGLE_API_KEY")
      expect(API_KEYS.ALL_LLM).toContain("OPENAI_API_KEY")
      expect(API_KEYS.ALL_LLM).toContain("ANTHROPIC_API_KEY")
    })

    it("should have string arrays", () => {
      for (const keys of Object.values(API_KEYS)) {
        expect(Array.isArray(keys)).toBe(true)
        for (const key of keys) {
          expect(typeof key).toBe("string")
        }
      }
    })
  })

  describe("logApiKeyStatus", () => {
    it("should log without throwing", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        // Mock implementation
      })

      expect(() => logApiKeyStatus(["GOOGLE_API_KEY"])).not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should handle empty key array", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {
        // Mock implementation
      })

      expect(() => logApiKeyStatus([])).not.toThrow()

      consoleSpy.mockRestore()
    })
  })
})
