#!/usr/bin/env node

import { chromium } from 'playwright';

async function debugEventSource() {
  console.log('🔍 Starting EventSource debugging session...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    args: [
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--auto-open-devtools-for-tabs'
    ]
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track all network requests
  const networkLogs = [];
  const eventSourceConnections = [];
  
  // Monitor all network activity
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('research') || url.includes('stream')) {
      console.log(`📡 REQUEST: ${request.method()} ${url}`);
      networkLogs.push({
        type: 'request',
        method: request.method(),
        url,
        headers: request.headers(),
        timestamp: Date.now()
      });
    }
  });
  
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('research') || url.includes('stream')) {
      console.log(`📨 RESPONSE: ${response.status()} ${url}`);
      networkLogs.push({
        type: 'response',
        status: response.status(),
        url,
        headers: response.headers(),
        timestamp: Date.now()
      });
    }
  });
  
  // Monitor page errors
  page.on('pageerror', (error) => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
    networkLogs.push({
      type: 'page_error',
      error: error.message,
      timestamp: Date.now()
    });
  });
  
  // Monitor console logs for debugging
  page.on('console', (msg) => {
    if (msg.text().includes('EventSource') || msg.text().includes('research') || msg.text().includes('stream')) {
      console.log(`🖥️  CONSOLE ${msg.type()}: ${msg.text()}`);
      networkLogs.push({
        type: 'console',
        level: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    }
  });
  
  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(2000);
    
    // Look for research-related elements
    console.log('🔎 Searching for research interface elements...');
    
    // Try to find input fields that might be for legal questions
    const inputSelectors = [
      'input[type="text"]',
      'textarea',
      'input[placeholder*="question"]',
      'input[placeholder*="research"]',
      'textarea[placeholder*="question"]',
      'textarea[placeholder*="research"]',
      '[data-testid*="research"]',
      '[data-testid*="question"]'
    ];
    
    let foundInput = null;
    for (const selector of inputSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found input element: ${selector}`);
          foundInput = element;
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // Look for buttons that might trigger research
    const buttonSelectors = [
      'button:has-text("research")',
      'button:has-text("Research")',
      'button:has-text("analyze")',
      'button:has-text("Analyze")',
      'button:has-text("submit")',
      'button:has-text("Submit")',
      'button[type="submit"]',
      '[data-testid*="research"]',
      '[data-testid*="submit"]'
    ];
    
    let foundButton = null;
    for (const selector of buttonSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          console.log(`✅ Found button element: ${selector}`);
          foundButton = element;
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    if (foundInput && foundButton) {
      console.log('🎯 Found research interface! Preparing to trigger research...');
      
      // Fill in a test legal question
      const testQuestion = 'Research: Maritime Salvage Rights - The "Oceanic" Case';
      await foundInput.fill(testQuestion);
      console.log(`📝 Filled input with: "${testQuestion}"`);
      
      // Wait a bit for React state to update
      await page.waitForTimeout(500);
      
      // Check if button is still disabled and force enable if needed
      const buttonState = await foundButton.evaluate((button) => ({
        disabled: button.disabled,
        className: button.className,
        textContent: button.textContent
      }));
      
      console.log(`🔘 Button state:`, buttonState);
      
      if (buttonState.disabled) {
        console.log('🔧 Button is disabled, force-enabling it...');
        await foundButton.evaluate((button) => {
          button.disabled = false;
          button.className = button.className.replace('disabled:bg-gray-400', '').replace('disabled:cursor-not-allowed', '');
        });
      }
      
      // Set up EventSource monitoring and hook injection in the browser
      await page.addInitScript(() => {
        // Hook EventSource
        const originalEventSource = window.EventSource;
        window.EventSource = function(url, options) {
          console.log('🔗 EventSource created:', url, options);
          const es = new originalEventSource(url, options);
          
          es.addEventListener('open', (event) => {
            console.log('✅ EventSource OPENED:', event);
            window._eventSourceStatus = 'open';
          });
          
          es.addEventListener('message', (event) => {
            console.log('📨 EventSource MESSAGE:', event.data);
          });
          
          es.addEventListener('error', (event) => {
            console.log('❌ EventSource ERROR:', event);
            console.log('EventSource readyState:', es.readyState);
            window._eventSourceStatus = 'error';
          });
          
          es.addEventListener('close', (event) => {
            console.log('🔐 EventSource CLOSED:', event);
            window._eventSourceStatus = 'closed';
          });
          
          // Store reference for inspection
          window._eventSource = es;
          return es;
        };

        // Hook fetch to monitor API calls
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          console.log('🌐 FETCH called:', url, options);
          return originalFetch.call(this, url, options)
            .then(response => {
              console.log('🌐 FETCH response:', response.status, response.url);
              return response;
            })
            .catch(error => {
              console.log('🌐 FETCH error:', error);
              throw error;
            });
        };

        // Hook console.error to catch React errors
        const originalConsoleError = console.error;
        console.error = function(...args) {
          if (args[0] && (args[0].includes('useResearchAgent') || args[0].includes('EventSource') || args[0].includes('research'))) {
            console.log('🚨 RESEARCH ERROR:', ...args);
          }
          return originalConsoleError.apply(this, args);
        };

        // Add window debugging helpers
        window._debugEventSource = () => {
          console.log('EventSource status:', window._eventSourceStatus);
          console.log('EventSource instance:', window._eventSource);
          if (window._eventSource) {
            console.log('EventSource readyState:', window._eventSource.readyState);
            console.log('EventSource url:', window._eventSource.url);
          }
        };
      });
      
      // Open Network tab in DevTools via CDP
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Runtime.enable');
      
      console.log('🚀 Clicking research button...');
      await foundButton.click();
      
      // Wait a moment for React to process the click
      await page.waitForTimeout(2000);
      
      // Check if any network requests were made
      console.log('🔍 Checking if any network requests were made after click...');
      await page.evaluate(() => {
        window._debugEventSource();
      });
      
      // Try to manually trigger the research if the hook failed
      const hasEventSource = await page.evaluate(() => {
        return !!window._eventSource;
      });
      
      if (!hasEventSource) {
        console.log('⚠️  No EventSource detected. Attempting to manually trigger research...');
        
        // Try to call the hook directly from the React component
        const hookResult = await page.evaluate(() => {
          try {
            // Look for React instance and try to access useResearchAgent
            const reactRoot = document.querySelector('#__next, [data-reactroot]');
            if (reactRoot && reactRoot._reactInternalInstance) {
              console.log('Found React root, trying to access research agent...');
            }
            
            // Alternative: Try to find and call the startResearch function manually
            return 'Unable to access React hooks directly from browser context';
          } catch (error) {
            return 'Error accessing React internals: ' + error.message;
          }
        });
        
        console.log('Hook access result:', hookResult);
      }
      
      // Monitor for 30 seconds
      console.log('⏱️  Monitoring EventSource connection for 30 seconds...');
      for (let i = 0; i < 30; i++) {
        await page.waitForTimeout(1000);
        
        // Check EventSource status
        const eventSourceStatus = await page.evaluate(() => {
          return {
            status: window._eventSourceStatus,
            readyState: window._eventSource ? window._eventSource.readyState : null,
            url: window._eventSource ? window._eventSource.url : null
          };
        });
        
        if (eventSourceStatus.status) {
          console.log(`⏰ [${i+1}s] EventSource Status: ${eventSourceStatus.status}, ReadyState: ${eventSourceStatus.readyState}, URL: ${eventSourceStatus.url}`);
        }
        
        // Check if connection was closed
        if (eventSourceStatus.status === 'closed' || eventSourceStatus.status === 'error') {
          console.log(`💥 EventSource disconnected at ${i+1} seconds!`);
          break;
        }
        
        // If no EventSource after 5 seconds, something is wrong
        if (i === 4 && !eventSourceStatus.status) {
          console.log('🔥 No EventSource created after 5 seconds - investigating React state...');
          
          const reactState = await page.evaluate(() => {
            // Check if there are any error messages displayed
            const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
            const errors = Array.from(errorElements).map(el => el.textContent);
            
            // Check button state again
            const button = document.querySelector('button:has-text("Start Research"), button:has-text("research")');
            const buttonInfo = button ? {
              disabled: button.disabled,
              textContent: button.textContent,
              className: button.className
            } : 'Button not found';
            
            return {
              errors,
              buttonInfo,
              hasJavaScriptErrors: window.jsErrors || []
            };
          });
          
          console.log('React state investigation:', JSON.stringify(reactState, null, 2));
          break;
        }
      }
      
    } else {
      console.log('❌ Could not find research interface elements');
      console.log('📄 Page content preview:');
      const content = await page.content();
      console.log(content.substring(0, 2000) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    // Print network log summary
    console.log('\n📊 Network Activity Summary:');
    networkLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${new Date(log.timestamp).toISOString()}] ${log.type}: ${JSON.stringify(log, null, 2)}`);
    });
    
    console.log('\n⏸️  Keeping browser open for manual inspection...');
    console.log('Press Ctrl+C to close');
    
    // Keep browser open for manual inspection
    await new Promise(() => {}); // Keep alive
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

debugEventSource().catch(console.error);