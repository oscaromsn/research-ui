import { type RenderOptions, render } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type React from "react";
import type { ReactElement } from "react";
import { vi } from "vitest";

/**
 * Custom render function that includes global providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    const testStore = createStore();
    return <Provider store={testStore}>{children}</Provider>;
  };

  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Mock implementation for ResizeObserver
 */
export class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

/**
 * Mock implementation for IntersectionObserver
 */
export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: readonly number[] = [0];

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn().mockReturnValue([]);
}

/**
 * Creates mock data for the legal-research atoms
 */
export function createMockAnalyzedDocument(overrides = {}) {
  return {
    searchResultId: "mock-id-1",
    relevanceScore: 8,
    confidenceScore: 7,
    summary: "This is a mock summary for testing purposes",
    keyArgumentsAndReasoning: [
      "First key argument for testing",
      "Second key argument for testing",
    ],
    extractedEntities: [
      { name: "Roe v. Wade", type: "Case", details: "Important case" },
      {
        name: "15 U.S.C. § 78j(b)",
        type: "Statute",
        details: "Important statute",
      },
    ],
    extractedQuotes: ["Important quote 1", "Important quote 2"],
    counterArgumentsOrNuances: ["Counterargument 1", "Nuance 1"],
    reasoning: {
      analyzeLegalQuestion: { summary: "Analysis of legal question" },
      considerRelevantLegalPrinciples: {
        summary: "Consideration of legal principles",
      },
      formulateSearchQueriesStrategy: {
        summary: "Search query strategy",
      },
      specifyExpectedInformationStrategy: {
        summary: "Expected info strategy",
      },
      ensureComprehensiveCoverageStrategy: {
        summary: "Coverage strategy",
      },
    },
    ...overrides,
  };
}

/**
 * Creates mock search query data
 */
export function createMockSearchQuery(overrides = {}) {
  return {
    queryString: "mock search query",
    expectedInformation: ["Expected information 1", "Expected information 2"],
    ...overrides,
  };
}

/**
 * Creates mock legal entity data
 */
export function createMockLegalEntity(overrides = {}) {
  return {
    name: "Mock Legal Entity",
    type: "Case" as const,
    details: "Details about the mock legal entity",
    ...overrides,
  };
}

/**
 * Utility to check if required API keys are available for testing
 * @param requiredKeys - Array of environment variable names that must be present
 * @returns boolean indicating if all required keys are available
 */
export const hasRequiredApiKeys = (requiredKeys: string[]): boolean => {
  return requiredKeys.every((key) => {
    const value = process.env[key];
    return (
      value &&
      value.trim() !== "" &&
      !value.includes("[YOUR_") &&
      !value.includes("****")
    );
  });
};

/**
 * Skip test if required API keys are not available
 * @param requiredKeys - Array of environment variable names that must be present
 * @param testName - Name of the test for logging purposes
 */
export const skipIfMissingApiKeys = (
  requiredKeys: string[],
  testName?: string
) => {
  const hasKeys = hasRequiredApiKeys(requiredKeys);

  if (!hasKeys) {
    const missingKeys = requiredKeys.filter((key) => {
      const value = process.env[key];
      return (
        !value ||
        value.trim() === "" ||
        value.includes("[YOUR_") ||
        value.includes("****")
      );
    });

    const message = testName
      ? `Skipping "${testName}" - Missing API keys: ${missingKeys.join(", ")}`
      : `Skipping test - Missing API keys: ${missingKeys.join(", ")}`;

    console.warn(message);
  }

  return hasKeys;
};

/**
 * Check if we're running in CI environment
 */
export const isCI = (): boolean => {
  return Boolean(
    process.env.CI ||
      process.env.GITHUB_ACTIONS ||
      process.env.GITLAB_CI ||
      process.env.CIRCLECI ||
      process.env.TRAVIS ||
      process.env.BUILDKITE ||
      process.env.VERCEL
  );
};

/**
 * Skip test in CI environment if API keys are not available
 * This is useful for tests that require real API calls
 */
export const skipInCiIfMissingApiKeys = (
  requiredKeys: string[],
  testName?: string
) => {
  if (isCI()) {
    return skipIfMissingApiKeys(requiredKeys, testName);
  }
  return true; // Don't skip in local development
};

/**
 * Mark a test as requiring API keys for documentation purposes
 * This doesn't skip the test but adds context for developers
 */
export const markAsApiDependent = (apiKeys: string[]) => {
  return {
    meta: {
      requiresApiKeys: apiKeys,
      description: `This test requires the following API keys: ${apiKeys.join(", ")}`,
    },
  };
};

/**
 * Mock BAML client functions for tests that don't need real LLM calls
 */
export const createMockBamlClient = () => ({
  GenerateLegalSearchQueries: vi.fn(),
  AnalyzeSingleDocument: vi.fn(),
  SynthesizeResearchFindings: vi.fn(),
  GenerateFinalLegalReport: vi.fn(),
  AssessResearchAndPlanNextSteps: vi.fn(),
});

/**
 * Mock external search APIs for tests that don't need real API calls
 */
export const createMockSearchApi = () => ({
  executeExaSearch: vi.fn().mockResolvedValue([
    {
      id: "doc_001",
      url: "https://example.com/case1",
      title: "Mock Legal Case",
      source_name: "Mock Court Database",
      snippet: "Mock case summary...",
      full_text: "Mock full text content...",
      published_date: "2023-05-15",
      retrieval_date: new Date().toISOString(),
      author: "Mock Judge",
      score: 0.92,
      metadata: { court: "mock", jurisdiction: "US" },
      original_query: {
        query_string: "mock query",
        expected_information: ["mock info"],
      },
    },
  ]),
});
