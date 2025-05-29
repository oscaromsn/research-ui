import { cleanup, configure } from "@testing-library/react";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import "@testing-library/jest-dom";
import path from "node:path";
import { config } from "dotenv";

// @testing-library/jest-dom adds custom matchers to Vitest automatically
// so we don't need to explicitly extend expect

// Configure React Testing Library to suppress act() warnings
configure({
  // This will disable the warnings about missing act() wrapping
  // These warnings are often unavoidable in complex testing scenarios
  asyncUtilTimeout: 5000,
  // We could set this to a custom function to suppress warnings, but React Testing Library
  // doesn't provide a direct way to suppress act warnings via configuration
});

// Suppress React's act() warnings in test environment
// These warnings appear in stderr and are from React's internal warning system
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      ((message.includes('An update to') && message.includes('was not wrapped in act')) ||
      (message.includes('Warning: An update to') && message.includes('was not wrapped in act')))
    ) {
      return; // Suppress act() warnings
    }
    return originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Also suppress stderr warnings if they're not caught by console.error override
const originalStderrWrite = process.stderr.write;
beforeAll(() => {
  process.stderr.write = function(chunk: any, ...args: any[]): boolean {
    const message = chunk.toString();
    if (
      message.includes('An update to') && message.includes('was not wrapped in act')
    ) {
      return true; // Suppress act() warnings from stderr
    }
    return (originalStderrWrite as any).call(this, chunk, ...args);
  };
});

afterAll(() => {
  process.stderr.write = originalStderrWrite;
});

// Load environment variables from .env.test file
config({ path: path.resolve(__dirname, ".env.test") });

// Mock the console methods to reduce noise during tests
if (process.env.VITEST_SILENT_CONSOLE === "true") {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
}

// Automatically restore mocks between tests
vi.mock("axios");

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
