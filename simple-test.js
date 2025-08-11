#!/usr/bin/env node

import { chromium } from "playwright";

async function testEventSource() {
  console.log("🔍 Testing EventSource connection after TypeScript fixes...");

  const browser = await chromium.launch({
    headless: false,
    devtools: true,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Track network requests
  const networkRequests = [];

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("research") || url.includes("stream")) {
      console.log(`📡 REQUEST: ${request.method()} ${url}`);
      networkRequests.push({
        method: request.method(),
        url,
        timestamp: Date.now(),
      });
    }
  });

  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("research") || url.includes("stream")) {
      console.log(`📨 RESPONSE: ${response.status()} ${url}`);
    }
  });

  // Monitor console for errors
  page.on("console", (msg) => {
    if (
      msg.type() === "error" ||
      msg.text().includes("Error") ||
      msg.text().includes("research")
    ) {
      console.log(`🖥️  CONSOLE ${msg.type()}: ${msg.text()}`);
    }
  });

  try {
    console.log("🌐 Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle" });

    console.log("⏳ Waiting for page to load...");
    await page.waitForTimeout(2000);

    // Find input and button
    const input = page.locator('input[type="text"]').first();
    const button = page.locator('button:has-text("Start Research")').first();

    if ((await input.isVisible()) && (await button.isVisible())) {
      console.log("✅ Found input and button elements");

      // Fill input with test question
      const testQuestion =
        'Research: Maritime Salvage Rights - The "Oceanic" Case';
      await input.fill(testQuestion);
      console.log(`📝 Filled input with: "${testQuestion}"`);

      // Wait for React state to update
      await page.waitForTimeout(1000);

      // Check button state
      const isEnabled = await button.isEnabled();
      console.log(`🔘 Button enabled: ${isEnabled}`);

      if (!isEnabled) {
        console.log("🔧 Button still disabled, force enabling...");
        await button.evaluate((btn) => {
          btn.disabled = false;
        });
      }

      // Click the button
      console.log("🚀 Clicking research button...");
      await button.click();

      // Wait for potential network requests
      console.log("⏱️  Waiting 10 seconds for network requests...");
      await page.waitForTimeout(10000);

      console.log(`📊 Network requests captured: ${networkRequests.length}`);
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log("❌ Could not find input or button elements");
    }
  } catch (error) {
    console.error("❌ Error during test:", error);
  } finally {
    console.log("\n🏁 Test completed. Keeping browser open for inspection...");
    console.log("Press Ctrl+C to close");

    // Keep browser open
    await new Promise(() => {});
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

testEventSource().catch(console.error);
