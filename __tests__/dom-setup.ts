/**
 * DOM Setup for Bun Test Runner
 *
 * Since bun's test runner doesn't properly initialize jsdom environment,
 * this utility manually sets up DOM globals for React component testing.
 *
 * IMPORTANT: This must be imported BEFORE any Testing Library imports!
 */

import { JSDOM } from "jsdom";

// Only initialize once
let isInitialized = false;

function setupDOMEnvironment() {
  if (isInitialized || typeof document !== "undefined") {
    return;
  }

  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost:3000",
    pretendToBeVisual: true,
    resources: "usable",
  });

  // Set up all necessary globals for React Testing Library
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.location = dom.window.location;
  global.history = dom.window.history;

  // HTML element constructors
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLDivElement = dom.window.HTMLDivElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  global.HTMLSpanElement = dom.window.HTMLSpanElement;
  global.HTMLInputElement = dom.window.HTMLInputElement;
  global.HTMLFormElement = dom.window.HTMLFormElement;
  global.HTMLAnchorElement = dom.window.HTMLAnchorElement;

  // Base DOM classes
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.Text = dom.window.Text;
  global.Comment = dom.window.Comment;
  global.DocumentFragment = dom.window.DocumentFragment;

  // Events
  global.Event = dom.window.Event;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  global.FocusEvent = dom.window.FocusEvent;

  // Other browser APIs needed by tests
  global.getComputedStyle = dom.window.getComputedStyle;
  global.requestAnimationFrame = (callback: FrameRequestCallback) =>
    setTimeout(callback, 0);
  global.cancelAnimationFrame = clearTimeout;

  isInitialized = true;
}

// Auto-initialize when imported
setupDOMEnvironment();

// Import jest-dom matchers after DOM is set up
import "@testing-library/jest-dom";
