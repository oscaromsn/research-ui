import path from "node:path";
import { configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { config } from "dotenv";
import { JSDOM } from "jsdom";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

// ===== ENVIRONMENT SETUP =====
// Load test environment variables first
config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: false, // Don't override existing env vars
});

// ===== TESTING LIBRARY CONFIGURATION =====
configure({
  asyncUtilTimeout: 10000, // Increased for complex async operations
  testIdAttribute: "data-testid", // Explicit test ID attribute
  getElementError: (message, container) => {
    // Enhanced error messages for debugging
    const error = new Error(message || "TestingLibraryElementError");
    error.name = "TestingLibraryElementError";
    error.stack = `${message || "TestingLibraryElementError"}\n\nContainer HTML:\n${container.innerHTML}`;
    return error;
  },
});

// ===== CONSOLE MANAGEMENT =====
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Selective console mocking based on test type and verbosity
const setupConsole = () => {
  const silentMode = process.env.VITEST_SILENT === "true";
  const verboseMode = process.env.VITEST_VERBOSE === "true";
  const isDebugMode = process.env.DEBUG_API_TESTS === "true";

  // In concise mode (default), suppress most console output unless debugging
  if (!verboseMode && !isDebugMode) {
    console.log = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  } else if (silentMode) {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.debug = vi.fn();
  }

  // Smart error filtering - more aggressive in concise mode
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || "");

    // Suppress known React warnings that don't indicate real issues
    const suppressedPatterns = [
      /Warning: An update to .* was not wrapped in act/,
      /An update to .* inside a test was not wrapped in act/,
      /Warning: ReactDOM.render is no longer supported/,
      /Warning: Failed prop type/,
      // Additional patterns for concise mode only
      ...(verboseMode
        ? []
        : [
            /useResearchAgent: No active research to abort/,
            /Failed to parse update: SyntaxError/,
            /Stream reading was aborted/,
          ]),
    ];

    if (suppressedPatterns.some((pattern) => pattern.test(message))) {
      return;
    }

    // Log real errors for debugging
    return originalConsole.error.call(console, ...args);
  };

  // In verbose mode, also suppress noisy warnings from stderr
  if (verboseMode || isDebugMode) {
    console.warn = (...args: unknown[]) => {
      const message = String(args[0] || "");
      if (message.includes("act()") || message.includes("ReactDOM.render")) {
        return;
      }
      return originalConsole.warn.call(console, ...args);
    };
  }
};

// ===== GLOBAL MOCKS =====
// DOM API Mocks with enhanced functionality
class EnhancedResizeObserverMock implements ResizeObserver {
  private callbacks = new Map<Element, ResizeObserverCallback>();
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe = vi.fn((target: Element, _options?: ResizeObserverOptions) => {
    this.callbacks.set(target, this.callback);
  });

  unobserve = vi.fn((target: Element) => {
    this.callbacks.delete(target);
  });

  disconnect = vi.fn(() => {
    this.callbacks.clear();
  });

  // Helper for testing - trigger resize
  triggerResize = (target: Element, entries: ResizeObserverEntry[]) => {
    const callback = this.callbacks.get(target);
    if (callback) {
      callback(entries, this);
    }
  };
}

class EnhancedIntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: readonly number[] = [0];

  private callbacks = new Map<Element, IntersectionObserverCallback>();
  private callback: IntersectionObserverCallback;

  constructor(
    callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {
    this.callback = callback;
  }

  observe = vi.fn((target: Element) => {
    this.callbacks.set(target, this.callback);
    // Auto-trigger intersection for easier testing
    if (process.env.VITEST_AUTO_INTERSECT === "true") {
      setTimeout(() => {
        this.triggerIntersection(target, true);
      }, 0);
    }
  });

  unobserve = vi.fn((target: Element) => {
    this.callbacks.delete(target);
  });

  disconnect = vi.fn(() => {
    this.callbacks.clear();
  });

  takeRecords = vi.fn().mockReturnValue([]);

  // Helper for testing
  triggerIntersection = (target: Element, isIntersecting: boolean) => {
    const callback = this.callbacks.get(target);
    if (callback) {
      callback(
        [
          {
            target,
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: target.getBoundingClientRect(),
            rootBounds: null,
            intersectionRect: target.getBoundingClientRect(),
            time: Date.now(),
          },
        ],
        this
      );
    }
  };
}

// Enhanced Fetch Mock with better debugging and stream handling
const createFetchMock = () => {
  const fetchMock = vi.fn();

  // Default successful response
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: "OK",
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(""),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    headers: new Headers(),
    url: "",
    redirected: false,
    type: "basic",
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
  });

  // Add helper methods for testing
  const mockSuccess = (data: unknown) => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: vi.fn().mockResolvedValue(data),
      text: vi.fn().mockResolvedValue(""),
      blob: vi.fn().mockResolvedValue(new Blob()),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      headers: new Headers(),
      url: "",
      redirected: false,
      type: "basic",
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
    });
  };

  const mockError = (status = 500, message = "Server Error") => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status,
      statusText: message,
      json: vi.fn().mockRejectedValue(new Error(`${status}: ${message}`)),
      text: vi.fn().mockResolvedValue(""),
      blob: vi.fn().mockResolvedValue(new Blob()),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      headers: new Headers(),
      url: "",
      redirected: false,
      type: "basic",
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
    });
  };

  // Helper for mocking streams that properly close
  const mockStream = (data: string[] = []) => {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Enqueue all data immediately and close
        for (const chunk of data) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(data.join("")),
      blob: vi.fn().mockResolvedValue(new Blob()),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      headers: new Headers(),
      url: "",
      redirected: false,
      type: "basic",
      clone: vi.fn(),
      body: stream,
      bodyUsed: false,
    });
  };

  // Attach helper methods
  (
    fetchMock as typeof fetchMock & {
      mockSuccess: typeof mockSuccess;
      mockError: typeof mockError;
      mockStream: typeof mockStream;
    }
  ).mockSuccess = mockSuccess;
  (
    fetchMock as typeof fetchMock & {
      mockSuccess: typeof mockSuccess;
      mockError: typeof mockError;
      mockStream: typeof mockStream;
    }
  ).mockError = mockError;
  (
    fetchMock as typeof fetchMock & {
      mockSuccess: typeof mockSuccess;
      mockError: typeof mockError;
      mockStream: typeof mockStream;
    }
  ).mockStream = mockStream;

  return fetchMock;
};

// ===== STDERR FILTERING =====
// Enhanced stderr filtering for React warnings
const originalStderrWrite = process.stderr.write;
const setupStderrFiltering = () => {
  const verboseMode = process.env.VITEST_VERBOSE === "true";
  const isDebugMode = process.env.DEBUG_API_TESTS === "true";
  const silentMode = process.env.VITEST_SILENT === "true";

  // Always filter React act() warnings (they're just noise), but in verbose mode allow other stderr
  process.stderr.write = function (
    chunk: string | Uint8Array,
    encodingOrCallback?: unknown,
    callback?: (error?: Error | null) => void
  ): boolean {
    const message = chunk?.toString();

    // Always suppress React act() warnings (in both concise and verbose modes)
    const alwaysSuppressedPatterns = [
      /An update to .* inside a test was not wrapped in act/,
      /When testing, code that causes React state updates should be wrapped into act/,
      /This ensures that you're testing the behavior the user would see/,
      /Learn more at https:\/\/react\.dev\/link\/wrap-tests-with-act/,
    ];

    // Additional patterns to suppress only in concise mode
    const conciseModeOnlyPatterns = [
      /useResearchAgent: No active research to abort/,
      /Failed to parse update: SyntaxError/,
      /Stream reading was aborted/,
    ];

    const shouldSuppress =
      message &&
      (alwaysSuppressedPatterns.some((pattern) => pattern.test(message)) ||
        (!verboseMode &&
          !isDebugMode &&
          !silentMode &&
          conciseModeOnlyPatterns.some((pattern) => pattern.test(message))));

    if (shouldSuppress) {
      return true; // Suppress the message
    }

    // Handle the overloaded function signature
    if (typeof encodingOrCallback === "function") {
      return originalStderrWrite.call(
        this,
        chunk,
        undefined,
        encodingOrCallback as (err?: Error | null) => void
      );
    }
    return originalStderrWrite.call(
      this,
      chunk,
      encodingOrCallback as Parameters<typeof originalStderrWrite>[1],
      callback
    );
  };
};

// ===== JSDOM INITIALIZATION =====
// Initialize jsdom manually since bun's test runner may not be setting it up properly
const setupDOM = () => {
  if (typeof document === "undefined") {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost:3000",
      pretendToBeVisual: true,
      resources: "usable",
    });

    // Set up global DOM environment
    global.window = dom.window as unknown as Window & typeof globalThis;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.location = dom.window.location;
    global.history = dom.window.history;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLDivElement = dom.window.HTMLDivElement;
    global.HTMLButtonElement = dom.window.HTMLButtonElement;
    global.HTMLSpanElement = dom.window.HTMLSpanElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;

    // Copy all dom.window properties to global
    Object.keys(dom.window).forEach((property) => {
      const globalRecord = global as Record<string, unknown>;
      if (typeof globalRecord[property] === "undefined") {
        globalRecord[property] = (dom.window as Record<string, unknown>)[
          property
        ];
      }
    });
  }
};

// ===== SETUP HOOKS =====
beforeAll(() => {
  setupDOM(); // Initialize DOM first
  setupConsole();
  setupStderrFiltering();

  // Verify DOM environment is now available
  if (typeof document === "undefined") {
    throw new Error(
      "Failed to initialize DOM environment for React component tests"
    );
  }

  // Set up global mocks
  global.ResizeObserver = EnhancedResizeObserverMock as typeof ResizeObserver;
  global.IntersectionObserver =
    EnhancedIntersectionObserverMock as typeof IntersectionObserver;
  
  // Create fetch mock with preconnect method for Bun compatibility
  const fetchMock = createFetchMock();
  (fetchMock as any).preconnect = vi.fn();
  global.fetch = fetchMock as any; // Use any to avoid Bun type conflicts

  // Mock other common browser APIs
  global.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Mock localStorage/sessionStorage for testing
  const createStorageMock = () => {
    const store = new Map<string, string>();
    return {
      getItem: vi.fn((key: string) => store.get(key) || null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      length: 0,
      key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
    };
  };

  global.localStorage = createStorageMock();
  global.sessionStorage = createStorageMock();

  // Performance timing mock - use Object.assign to avoid type conflicts
  Object.assign(global.performance, {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
  });

  // Note: vi.mock is not supported in bun test runner
  // Mock Next.js font imports handled in __mocks__ directory instead
});

// ===== TEST LIFECYCLE =====
beforeEach(() => {
  // Clear mocks but preserve implementations
  vi.clearAllMocks();

  // Reset DOM state - ensure DOM is available
  if (typeof document !== "undefined") {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  } else {
    console.warn(
      "DOM not available in beforeEach - this may cause React component tests to fail"
    );
  }

  // Reset URL
  if (typeof window !== "undefined") {
    window.history.replaceState({}, "", "/");
  }
});

afterEach(async () => {
  // Cleanup after each test
  vi.clearAllTimers();
  vi.restoreAllMocks();

  // Force cleanup of any pending microtasks
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Clear any global state that might persist
  if (typeof window !== "undefined") {
    // Clear any event listeners
    window.removeEventListener = vi.fn();
    window.addEventListener = vi.fn();
  }
});

afterAll(async () => {
  // Cleanup any remaining async operations
  await global.testUtils?.cleanupAsyncOperations?.();

  // Restore original console and stderr
  Object.assign(console, originalConsole);
  process.stderr.write = originalStderrWrite;

  // Clear any remaining unhandled rejections
  unhandledRejections.clear();
});

// ===== GLOBAL TEST UTILITIES =====
// Make utilities available globally for easy access
declare global {
  var testUtils: {
    waitForNextTick: () => Promise<void>;
    mockApiCall: (url: string, response: unknown) => void;
    triggerResize: (target: Element) => void;
    triggerIntersection: (target: Element, isVisible: boolean) => void;
    createMockStream: (data: string[], autoClose?: boolean) => ReadableStream;
    flushPromises: () => Promise<void>;
    cleanupAsyncOperations: () => Promise<void>;
  };
}

global.testUtils = {
  waitForNextTick: () => new Promise((resolve) => setTimeout(resolve, 0)),

  mockApiCall: (url: string, response: unknown) => {
    const mockFetch = global.fetch as any; // Use any to avoid type conflicts
    mockFetch.mockImplementationOnce((requestUrl: string) => {
      if (requestUrl.includes(url)) {
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          json: () => Promise.resolve(response),
          text: () => Promise.resolve(""),
          blob: () => Promise.resolve(new Blob()),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
          headers: new Headers(),
          url: requestUrl,
          redirected: false,
          type: "basic" as ResponseType,
          clone: vi.fn(),
          body: null,
          bodyUsed: false,
        });
      }
      return Promise.reject(new Error(`Unmocked URL: ${requestUrl}`));
    });
  },

  triggerResize: (target: Element) => {
    const observer = global.ResizeObserver as typeof EnhancedResizeObserverMock;
    if ("triggerResize" in observer.prototype) {
      (observer.prototype as EnhancedResizeObserverMock).triggerResize(
        target,
        []
      );
    }
  },

  triggerIntersection: (target: Element, isVisible: boolean) => {
    const observer =
      global.IntersectionObserver as typeof EnhancedIntersectionObserverMock;
    if ("triggerIntersection" in observer.prototype) {
      (
        observer.prototype as EnhancedIntersectionObserverMock
      ).triggerIntersection(target, isVisible);
    }
  },

  createMockStream: (data: string[], autoClose = true) => {
    const encoder = new TextEncoder();
    let index = 0;

    return new ReadableStream({
      start(controller) {
        if (autoClose) {
          // Enqueue all data immediately and close
          for (const chunk of data) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        }
      },
      pull(controller) {
        if (!autoClose && index < data.length) {
          controller.enqueue(encoder.encode(data[index]));
          index++;
          if (index >= data.length) {
            controller.close();
          }
        }
      },
    });
  },

  flushPromises: () => new Promise((resolve) => setTimeout(resolve, 0)),

  cleanupAsyncOperations: async () => {
    // Clear all timers
    vi.clearAllTimers();

    // Flush all pending promises
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    // Run any remaining microtasks
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));
  },
};

// ===== ERROR HANDLING =====
// Enhanced error reporting for better debugging
const unhandledRejections = new Set();

process.on("unhandledRejection", (reason, promise) => {
  // Track unhandled rejections but don't log them in tests to reduce noise
  unhandledRejections.add(promise);
  if (
    process.env.VITEST_VERBOSE === "true" ||
    process.env.DEBUG_API_TESTS === "true"
  ) {
    console.error("Unhandled Promise Rejection:", reason);
    console.error("Promise:", promise);
  }
});

process.on("rejectionHandled", (promise) => {
  // Remove from tracking when handled
  unhandledRejections.delete(promise);
});

// Export test configuration for reference
export const testConfig = {
  environment: process.env.NODE_ENV || "test",
  testType: process.env.VITEST_TEST_TYPE || "unit",
  silent: process.env.VITEST_SILENT === "true",
  verbose: process.env.VITEST_VERBOSE === "true",
  debug: process.env.DEBUG_API_TESTS === "true",
  autoIntersect: process.env.VITEST_AUTO_INTERSECT === "true",
};
