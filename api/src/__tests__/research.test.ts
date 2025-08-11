import { describe, expect, test } from "bun:test";
import {
  isCompletionEvent,
  isStageChangeEvent,
  SSEEventDataSchema,
} from "../../../packages/shared-types/src/index";

// Import the app
import { app } from "../index";

// Utility function to parse SSE stream
async function parseSSEStream(
  stream: ReadableStream<Uint8Array>
): Promise<Array<{ event: string; data: any }>> {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  const events: Array<{ event: string; data: any }> = [];

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      // Parse SSE format: "event: eventName\ndata: jsonData\n\n"
      const lines = value.split("\n");
      let currentEvent: { event?: string; data?: any } = {};

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("event: ")) {
          currentEvent.event = trimmedLine.substring(7);
        } else if (trimmedLine.startsWith("data: ")) {
          try {
            currentEvent.data = JSON.parse(trimmedLine.substring(6));
          } catch (e) {
            // Handle non-JSON data
            currentEvent.data = trimmedLine.substring(6);
          }
        } else if (
          trimmedLine === "" &&
          currentEvent.event &&
          currentEvent.data
        ) {
          // End of event, add to collection
          events.push({
            event: currentEvent.event,
            data: currentEvent.data,
          });
          currentEvent = {};
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return events;
}

describe("Research SSE Endpoint", () => {
  test("should return SSE stream with correct content-type", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalQuestion: "test question" }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-cache");
    expect(response.headers.get("connection")).toContain("keep-alive");
  });

  test("should stream initialization and completion events", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalQuestion: "test question" }),
      })
    );

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Parse the SSE stream
    const events = await parseSSEStream(response.body!);

    // Should have at least 2 events: initialization and completion
    expect(events.length).toBeGreaterThanOrEqual(2);

    // First event should be stage change to INITIALIZING
    const firstEvent = events[0];
    expect(firstEvent?.event).toBe("stage.change");

    const firstEventData = SSEEventDataSchema.parse({
      type: "stage.change",
      data: firstEvent?.data,
    });

    if (isStageChangeEvent(firstEventData)) {
      expect(firstEventData.data.stage).toBe("INITIALIZING");
      expect(firstEventData.data.message).toBeDefined();
      expect(typeof firstEventData.data.message).toBe("string");
    }

    // Last event should be completion
    const lastEvent = events[events.length - 1];
    expect(lastEvent?.event).toBe("complete");

    const lastEventData = SSEEventDataSchema.parse({
      type: "complete",
      data: lastEvent?.data,
    });

    if (isCompletionEvent(lastEventData)) {
      expect(lastEventData.data.message).toBeDefined();
      expect(typeof lastEventData.data.message).toBe("string");
    }
  });

  test("should validate request body", async () => {
    // Test with missing legalQuestion
    const response1 = await app.handle(
      new Request("http://localhost/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );

    expect(response1.status).toBe(400);

    // Test with invalid JSON - Elysia returns 500 for malformed JSON
    const response2 = await app.handle(
      new Request("http://localhost/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      })
    );

    expect(response2.status).toBe(500); // Elysia returns 500 for malformed JSON
  });

  test("should handle empty legal question", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalQuestion: "" }),
      })
    );

    expect(response.status).toBe(400);
  });

  test("should only accept POST method", async () => {
    // Test GET method
    const getResponse = await app.handle(
      new Request("http://localhost/api/research")
    );

    expect(getResponse.status).toBe(404);

    // Test PUT method
    const putResponse = await app.handle(
      new Request("http://localhost/api/research", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalQuestion: "test" }),
      })
    );

    expect(putResponse.status).toBe(404);
  });

  test("should handle OPTIONS request for CORS", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/research", {
        method: "OPTIONS",
      })
    );

    // Should allow CORS preflight
    expect(response.status).toBe(204);
  });
});
