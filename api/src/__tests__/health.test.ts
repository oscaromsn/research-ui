import { describe, expect, test } from "bun:test";
import type { HealthCheckResponse } from "../../../packages/shared-types/src/index";

// Import the app (this will fail initially because we haven't created it yet)
import { app } from "../index";

describe("Health Check Endpoint", () => {
  test("should return 200 with valid health status", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health", {
        method: "GET",
      })
    );

    expect(response.status).toBe(200);

    const data = (await response.json()) as HealthCheckResponse;

    // Validate the response structure
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(typeof data.timestamp).toBe("string");
    expect(data.version).toBeDefined();
    expect(typeof data.version).toBe("string");

    // Validate timestamp is valid ISO string
    expect(() => new Date(data.timestamp)).not.toThrow();

    // Check that timestamp is recent (within last 5 seconds)
    const now = new Date();
    const responseTime = new Date(data.timestamp);
    const timeDiff = now.getTime() - responseTime.getTime();
    expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds
  });

  test("should include uptime in response when available", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );

    expect(response.status).toBe(200);

    const data = (await response.json()) as HealthCheckResponse;

    // If uptime is provided, it should be a number
    if (data.uptime !== undefined) {
      expect(typeof data.uptime).toBe("number");
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    }
  });

  test("should have correct content-type header", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health")
    );

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  test("should handle OPTIONS request for CORS", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/health", {
        method: "OPTIONS",
      })
    );

    // Should allow CORS preflight
    expect(response.status).toBe(204);
  });
});
