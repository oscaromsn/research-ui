/**
 * Application factory for JurisConsulta API
 * Separates app creation from server startup for better testability
 */

import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import type { HealthCheckResponse } from "../../packages/shared-types/src/index";
import { researchRoutes } from "./routes/research";

/**
 * Creates and configures the main Elysia application
 * This factory function allows for better testing by avoiding global state
 */
export function createApp() {
  // Track server start time for uptime calculation
  const serverStartTime = Date.now();

  return new Elysia({ prefix: "/api" })
    .use(
      cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: false, // Match EventSource default behavior (no credentials)
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type", 
          "Authorization", 
          "Accept",
          "Cache-Control",      // Required for EventSource
          "Connection",         // Required for keep-alive  
          "Accept-Language",    // Browser default header
          "Accept-Encoding",    // Browser default header
          "User-Agent"          // Browser default header
        ],
      })
    )
    .use(
      swagger({
        documentation: {
          info: {
            title: "JurisConsulta API",
            version: "0.1.0",
            description: "AI-Powered Legal Research Assistant API",
          },
          tags: [
            { name: "Health", description: "Health check endpoints" },
            { name: "Research", description: "Legal research endpoints" },
          ],
        },
      })
    )
    // Add global OPTIONS handler for debugging CORS preflight requests
    .options("*", ({ set, headers }) => {
      console.log("🔍 CORS Preflight OPTIONS request received");
      console.log("🌐 Request headers:", {
        origin: headers.origin,
        'access-control-request-method': headers['access-control-request-method'],
        'access-control-request-headers': headers['access-control-request-headers'],
      });
      set.status = 200;
      return "CORS preflight OK";
    })
    .use(researchRoutes) // This will include both /complete and /stream endpoints
    .get(
      "/health",
      (): HealthCheckResponse => {
        const now = new Date();
        const uptime = Math.floor((Date.now() - serverStartTime) / 1000); // seconds

        return {
          status: "ok",
          timestamp: now.toISOString(),
          version: "0.1.0",
          uptime,
        };
      },
      {
        detail: {
          tags: ["Health"],
          summary: "Health check endpoint",
          description: "Returns the current health status of the API server",
          responses: {
            200: {
              description: "Server is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      timestamp: { type: "string", format: "date-time" },
                      version: { type: "string", example: "0.1.0" },
                      uptime: {
                        type: "number",
                        description: "Server uptime in seconds",
                      },
                    },
                    required: ["status", "timestamp", "version"],
                  },
                },
              },
            },
          },
        },
      }
    );
}

/**
 * Application instance for backwards compatibility
 * This maintains compatibility with the existing index.ts structure
 */
export const app = createApp();
