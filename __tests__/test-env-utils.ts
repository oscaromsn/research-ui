/**
 * Type-safe utilities for environment variable manipulation in tests
 *
 * This module provides type-safe alternatives to `(process.env as any)` usage
 * and follows biome linting rules while maintaining test functionality.
 */

/**
 * Extended interface for NodeJS ProcessEnv with additional type safety
 */
interface TestProcessEnv extends NodeJS.ProcessEnv {
  [key: string]: string | undefined;
}

/**
 * Type-safe environment variable setter for tests
 * @param key - Environment variable key
 * @param value - Environment variable value
 */
export function setTestEnv(key: string, value: string): void {
  const env = process.env as TestProcessEnv;
  env[key] = value;
}

/**
 * Type-safe environment variable deletion for tests
 * Uses undefined assignment instead of delete operator for better performance
 * @param key - Environment variable key to remove
 */
export function deleteTestEnv(key: string): void {
  const env = process.env as TestProcessEnv;
  env[key] = undefined;
}

/**
 * Type-safe environment restoration utility
 * @param originalEnv - Original environment to restore
 */
export function restoreTestEnv(originalEnv: NodeJS.ProcessEnv): void {
  const env = process.env as TestProcessEnv;

  // Clear all current environment variables that weren't in original
  for (const key in process.env) {
    if (!(key in originalEnv)) {
      env[key] = undefined;
    }
  }

  // Restore original values
  for (const key in originalEnv) {
    env[key] = originalEnv[key];
  }
}

/**
 * Helper to safely capture original environment state
 * @returns Copy of current process.env
 */
export function captureTestEnv(): NodeJS.ProcessEnv {
  return { ...process.env };
}

/**
 * Bulk environment variable setter for test setup
 * @param envVars - Object containing key-value pairs to set
 */
export function setMultipleTestEnv(envVars: Record<string, string>): void {
  const env = process.env as TestProcessEnv;
  for (const [key, value] of Object.entries(envVars)) {
    env[key] = value;
  }
}

/**
 * Helper to create a clean test environment with only specified variables
 * @param envVars - Environment variables to set
 * @returns Function to restore original environment
 */
export function createCleanTestEnv(
  envVars: Record<string, string>
): () => void {
  const originalEnv = captureTestEnv();

  // Clear current environment (set to undefined for performance)
  const env = process.env as TestProcessEnv;
  for (const key in process.env) {
    env[key] = undefined;
  }

  // Set new environment
  setMultipleTestEnv(envVars);

  // Return restore function
  return () => restoreTestEnv(originalEnv);
}
