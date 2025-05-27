import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

// @testing-library/jest-dom adds custom matchers to Vitest automatically
// so we don't need to explicitly extend expect

// Mock the console methods to reduce noise during tests
if (process.env.VITEST_SILENT_CONSOLE === "true") {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
}

// Automatically restore mocks between tests
vi.mock("axios");

// Mock the environment variables
process.env = {
    ...process.env,
    // Default environment variables for testing
    NODE_ENV: "test",
    EXA_API_KEY: "test-exa-api-key",
    GOOGLE_API_KEY: "test-google-api-key",
    OPENAI_API_KEY: "test-openai-api-key",
    ANTHROPIC_API_KEY: "test-anthropic-api-key",
};

// Add a global fetch mock if needed
global.fetch = vi.fn();

// Define a global ResizeObserver mock
class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
}

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "0px";
    readonly thresholds: ReadonlyArray<number> = [0];

    private readonly _callback: IntersectionObserverCallback;

    constructor(
        callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit,
    ) {
        this._callback = callback;
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn().mockReturnValue([]);
}

// Add to global
global.ResizeObserver = ResizeObserverMock;
global.IntersectionObserver =
    IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Clean up after each test
afterEach(() => {
    cleanup(); // Cleanup React Testing Library components
    vi.clearAllMocks();
});
