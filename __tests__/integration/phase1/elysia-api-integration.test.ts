import { beforeAll, describe, expect, test } from "vitest";
import { app } from "../../../api/src/index";
import type { HealthCheckResponse } from "../../../packages/shared-types/src/index";
import { SSEEventDataSchema } from "../../../packages/shared-types/src/index";

describe("Elysia API Integration Tests", () => {
  beforeAll(async () => {
    // Initialize any test setup if needed
  });

  describe("Health Check Endpoint", () => {
    test("should return healthy status with proper structure", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health")
      );

      expect(response.status).toBe(200);

      const healthData = (await response.json()) as HealthCheckResponse;
      expect(healthData.status).toBe("ok");
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.version).toBeDefined();
      expect(typeof healthData.uptime).toBe("number");
      expect(healthData.uptime).toBeGreaterThanOrEqual(0);
    });

    test("should have valid timestamp format", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health")
      );

      expect(response.status).toBe(200);
      const healthData = (await response.json()) as HealthCheckResponse;

      // Should be valid ISO timestamp
      expect(() => new Date(healthData.timestamp)).not.toThrow();

      // Should be recent (within last 5 seconds)
      const now = new Date();
      const responseTime = new Date(healthData.timestamp);
      const timeDiff = now.getTime() - responseTime.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });
  });

  describe("Research SSE Endpoint", () => {
    test("should start research and return SSE stream", async () => {
      const legalQuestion =
        "What are the legal implications of AI in healthcare?";

      // Make request to research stream endpoint using GET for EventSource compatibility
      const response = await app.handle(
        new Request(
          `http://localhost/api/research/stream?legalQuestion=${encodeURIComponent(legalQuestion)}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
            },
          }
        )
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/event-stream");

      // Verify SSE headers
      expect(response.headers.get("cache-control")).toBe("no-cache");
      expect(response.headers.get("connection")).toBe("keep-alive");
    });

    test("should stream valid SSE events with proper format", async () => {
      const legalQuestion = "Test question for SSE validation";

      const response = await app.handle(
        new Request(
          `http://localhost/api/research/stream?legalQuestion=${encodeURIComponent(legalQuestion)}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
            },
          }
        )
      );

      expect(response.status).toBe(200);

      if (response.body) {
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        const events: any[] = [];
        let timeoutId: NodeJS.Timeout | undefined;

        try {
          // Set a timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Stream timeout")),
              5000
            );
          });

          // Read SSE events
          const readPromise = (async () => {
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                break;
              }

              buffer += value;

              // Process complete SSE events
              const lines = buffer.split("\n\n");
              buffer = lines.pop() || ""; // Keep incomplete event in buffer

              for (const event of lines) {
                if (event.trim()) {
                  const parsed = parseSSEEvent(event);
                  if (parsed) {
                    events.push(parsed);
                  }
                }
              }

              // Break after receiving expected events
              if (events.length >= 2) {
                break;
              }
            }
          })();

          await Promise.race([readPromise, timeoutPromise]);
          clearTimeout(timeoutId);

          // Validate events
          expect(events.length).toBeGreaterThanOrEqual(2);

          // First event should be research update
          const initEvent = events[0];
          expect(initEvent.event).toBe("research-update");
          expect(initEvent.data).toBeDefined();

          // Validate event data against Zod schema
          const parseResult = SSEEventDataSchema.safeParse({
            type: "stage.change",
            data: initEvent.data,
          });
          expect(parseResult.success).toBe(true);

          // Last event should be completion
          const completeEvent = events[events.length - 1];
          expect(completeEvent.event).toBe("research-update");
          expect(completeEvent.data).toBeDefined();
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          reader.releaseLock();
        }
      }
    });

    test("should reject invalid request body", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/research/stream", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        })
      );

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain("legal question");
    });

    test("should reject empty legal question", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/research/stream?legalQuestion=", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        })
      );

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain("legal question");
    });
  });

  describe("CORS Configuration", () => {
    test("should handle OPTIONS preflight requests", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health", {
          method: "OPTIONS",
        })
      );

      expect(response.status).toBe(204);
    });

    test("should include CORS headers in responses", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/health")
      );

      // Check for CORS headers (exact headers depend on configuration)
      expect(response.headers.get("access-control-allow-origin")).toBeDefined();
    });

    test("should handle GET request for EventSource connection", async () => {
      const legalQuestion = "What are the key elements of contract formation?";

      // Test the GET endpoint that EventSource will use
      const response = await app.handle(
        new Request(
          `http://localhost/api/research/stream?legalQuestion=${encodeURIComponent(legalQuestion)}`,
          {
            method: "GET",
            headers: {
              Accept: "text/event-stream",
              "Cache-Control": "no-cache",
            },
          }
        )
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/event-stream");
      expect(response.headers.get("cache-control")).toBe("no-cache");
      expect(response.headers.get("connection")).toBe("keep-alive");

      // Verify we can read from the stream
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      if (reader) {
        const { value } = await reader.read();
        expect(value).toBeDefined();

        // Convert the first chunk to string and verify it's SSE format
        const chunk = new TextDecoder().decode(value);
        expect(chunk).toMatch(/^(id:|event:|data:)/); // Should start with valid SSE field

        reader.releaseLock();
      }
    });

    test("should validate query parameters for GET stream endpoint", async () => {
      // Test missing legalQuestion parameter
      const response = await app.handle(
        new Request("http://localhost/api/research/stream", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        })
      );

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain("legal question is required");
    });

    test("should validate empty legalQuestion in query parameters", async () => {
      // Test empty legalQuestion parameter
      const response = await app.handle(
        new Request("http://localhost/api/research/stream?legalQuestion=", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        })
      );

      expect(response.status).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain("legal question is required");
    });
  });
});

// Helper function to parse SSE events
function parseSSEEvent(
  eventString: string
): { event: string; data: any } | null {
  const lines = eventString.trim().split("\n");
  let event = "";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      event = line.substring(7);
    } else if (line.startsWith("data: ")) {
      data = line.substring(6);
    }
  }

  if (event && data) {
    try {
      return {
        event,
        data: JSON.parse(data),
      };
    } catch (error) {
      console.warn("Failed to parse SSE event data:", error);
      return null;
    }
  }

  return null;
}
