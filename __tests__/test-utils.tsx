import { type RenderOptions, render } from "@testing-library/react";
import { Provider } from "jotai/react";
import { type ReactElement, createElement } from "react";
import { vi } from "vitest";

/**
 * Custom render function that includes global providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return createElement(Provider, {}, children);
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
  readonly thresholds: ReadonlyArray<number> = [0];

  private readonly _callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    this._callback = callback;
  }

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
// Test updated rules
