/**
 * Tests for API testing helper utilities
 * These tests validate the conditional test execution logic
 */

import { describe, it, expect, vi } from "vitest";

import {
  hasRequiredApiKeys,
  skipIfMissingApiKeys,
  isCI,
  skipInCiIfMissingApiKeys,
} from "../test-utils";
import {
  API_KEYS,
  logApiKeyStatus,
} from "./api-test-helpers";

describe("API Testing Utilities", () => {
  describe("hasRequiredApiKeys", () => {
    it("should return false for missing API keys", () => {
      expect(hasRequiredApiKeys(["DEFINITELY_MISSING_KEY"])).toBe(false);
    });

    it("should return false for empty API keys", () => {
      const originalKey = process.env.TEST_EMPTY_KEY;
      process.env.TEST_EMPTY_KEY = "";
      
      expect(hasRequiredApiKeys(["TEST_EMPTY_KEY"])).toBe(false);
      
      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_EMPTY_KEY = originalKey;
      } else {
        delete process.env.TEST_EMPTY_KEY;
      }
    });

    it("should return false for placeholder API keys", () => {
      const originalKey = process.env.TEST_PLACEHOLDER_KEY;
      process.env.TEST_PLACEHOLDER_KEY = "[YOUR_API_KEY]";
      
      expect(hasRequiredApiKeys(["TEST_PLACEHOLDER_KEY"])).toBe(false);
      
      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_PLACEHOLDER_KEY = originalKey;
      } else {
        delete process.env.TEST_PLACEHOLDER_KEY;
      }
    });

    it("should return false for masked API keys", () => {
      const originalKey = process.env.TEST_MASKED_KEY;
      process.env.TEST_MASKED_KEY = "****";
      
      expect(hasRequiredApiKeys(["TEST_MASKED_KEY"])).toBe(false);
      
      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_MASKED_KEY = originalKey;
      } else {
        delete process.env.TEST_MASKED_KEY;
      }
    });

    it("should return true for valid API keys", () => {
      const originalKey = process.env.TEST_VALID_KEY;
      process.env.TEST_VALID_KEY = "sk-valid-api-key-123";
      
      expect(hasRequiredApiKeys(["TEST_VALID_KEY"])).toBe(true);
      
      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_VALID_KEY = originalKey;
      } else {
        delete process.env.TEST_VALID_KEY;
      }
    });

    it("should return true for empty array", () => {
      expect(hasRequiredApiKeys([])).toBe(true);
    });

    it("should check all keys in array", () => {
      const originalKey1 = process.env.TEST_KEY_1;
      const originalKey2 = process.env.TEST_KEY_2;
      
      process.env.TEST_KEY_1 = "valid-key-1";
      process.env.TEST_KEY_2 = ""; // Invalid
      
      expect(hasRequiredApiKeys(["TEST_KEY_1", "TEST_KEY_2"])).toBe(false);
      
      process.env.TEST_KEY_2 = "valid-key-2";
      expect(hasRequiredApiKeys(["TEST_KEY_1", "TEST_KEY_2"])).toBe(true);
      
      // Restore
      if (originalKey1 !== undefined) {
        process.env.TEST_KEY_1 = originalKey1;
      } else {
        delete process.env.TEST_KEY_1;
      }
      if (originalKey2 !== undefined) {
        process.env.TEST_KEY_2 = originalKey2;
      } else {
        delete process.env.TEST_KEY_2;
      }
    });
  });

  describe("skipIfMissingApiKeys", () => {
    it("should return false when keys are missing", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      const result = skipIfMissingApiKeys(["DEFINITELY_MISSING_KEY"], "Test");
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping "Test" - Missing API keys: DEFINITELY_MISSING_KEY'
      );
      
      consoleSpy.mockRestore();
    });

    it("should return true when all keys are available", () => {
      const originalKey = process.env.TEST_AVAILABLE_KEY;
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      process.env.TEST_AVAILABLE_KEY = "valid-key";
      
      const result = skipIfMissingApiKeys(["TEST_AVAILABLE_KEY"], "Test");
      
      expect(result).toBe(true);
      expect(consoleSpy).not.toHaveBeenCalled();
      
      // Restore
      if (originalKey !== undefined) {
        process.env.TEST_AVAILABLE_KEY = originalKey;
      } else {
        delete process.env.TEST_AVAILABLE_KEY;
      }
      consoleSpy.mockRestore();
    });

    it("should handle missing test name", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      const result = skipIfMissingApiKeys(["MISSING_KEY"]);
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Skipping test - Missing API keys: MISSING_KEY"
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe("isCI", () => {
    it("should detect CI environment variables", () => {
      const originalCI = process.env.CI;
      
      // Test CI=true
      process.env.CI = "true";
      expect(isCI()).toBe(true);
      
      // Test GitHub Actions
      delete process.env.CI;
      process.env.GITHUB_ACTIONS = "true";
      expect(isCI()).toBe(true);
      
      // Test no CI
      delete process.env.GITHUB_ACTIONS;
      expect(isCI()).toBe(false);
      
      // Restore
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      } else {
        delete process.env.CI;
      }
    });
  });

  describe("skipInCiIfMissingApiKeys", () => {
    it("should skip in CI when keys are missing", () => {
      const originalCI = process.env.CI;
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      process.env.CI = "true";
      
      const result = skipInCiIfMissingApiKeys(["MISSING_KEY"], "CI Test");
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      } else {
        delete process.env.CI;
      }
      consoleSpy.mockRestore();
    });

    it("should not skip in local development", () => {
      const originalCI = process.env.CI;
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      
      delete process.env.CI;
      
      const result = skipInCiIfMissingApiKeys(["MISSING_KEY"], "Local Test");
      
      expect(result).toBe(true);
      expect(consoleSpy).not.toHaveBeenCalled();
      
      // Restore
      if (originalCI !== undefined) {
        process.env.CI = originalCI;
      }
      consoleSpy.mockRestore();
    });
  });

  describe("API_KEYS constant", () => {
    it("should have correct structure", () => {
      expect(API_KEYS.GOOGLE_AI).toEqual(["GOOGLE_API_KEY"]);
      expect(API_KEYS.OPENAI).toEqual(["OPENAI_API_KEY"]);
      expect(API_KEYS.EXA_SEARCH).toEqual(["EXA_API_KEY"]);
      expect(API_KEYS.ALL_LLM).toContain("GOOGLE_API_KEY");
      expect(API_KEYS.ALL_LLM).toContain("OPENAI_API_KEY");
      expect(API_KEYS.ALL_LLM).toContain("ANTHROPIC_API_KEY");
    });

    it("should have string arrays", () => {
      Object.values(API_KEYS).forEach((keys) => {
        expect(Array.isArray(keys)).toBe(true);
        keys.forEach((key) => {
          expect(typeof key).toBe("string");
        });
      });
    });
  });

  describe("logApiKeyStatus", () => {
    it("should log without throwing", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      expect(() => logApiKeyStatus(["GOOGLE_API_KEY"])).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it("should handle empty key array", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      
      expect(() => logApiKeyStatus([])).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});