import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia, t } from "elysia";
import type {
  CompletionEvent,
  HealthCheckResponse,
  StageChangeEvent,
} from "../../packages/shared-types/src/index";

// Track server start time for uptime calculation
const serverStartTime = Date.now();

// Create the main Elysia app
export const app = new Elysia({ prefix: "/api" })
  .use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept"],
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
  )
  .post(
    "/research",
    ({ body, set }) => {
      const { legalQuestion } = body;

      // Additional validation for empty string (Elysia's minLength might not catch empty after trim)
      if (!legalQuestion || legalQuestion.trim().length === 0) {
        set.status = 400;
        return { error: "Legal question is required and cannot be empty" };
      }

      // Create SSE stream
      return new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            // Helper function to send SSE event
            const sendSSEEvent = (event: string, data: unknown) => {
              const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(encoder.encode(sseData));
            };

            // Send initialization event
            const initEvent: StageChangeEvent = {
              stage: "INITIALIZING",
              message: "Starting legal research process...",
            };
            sendSSEEvent("stage.change", initEvent);

            // Simulate some processing time
            setTimeout(() => {
              // Send completion event
              const completeEvent: CompletionEvent = {
                message: "Research process completed successfully",
              };
              sendSSEEvent("complete", completeEvent);

              // Close the stream
              controller.close();
            }, 100);
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
          },
        }
      );
    },
    {
      body: t.Object({
        legalQuestion: t.String({ minLength: 1 }),
      }),
      error: ({ code, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: "Invalid request body - legal question is required" };
        }
        // Return a default error response for other error codes
        set.status = 500;
        return { error: "Internal server error" };
      },
      detail: {
        tags: ["Research"],
        summary: "Start legal research process",
        description:
          "Initiates a legal research process and streams results via Server-Sent Events",
        responses: {
          200: {
            description: "Research process started successfully",
            content: {
              "text/event-stream": {
                schema: {
                  type: "string",
                  description:
                    "Server-Sent Events stream containing research updates",
                },
              },
            },
          },
          400: {
            description: "Invalid request - legal question is required",
          },
        },
      },
    }
  );

// Only start the server if this file is run directly (not imported for testing)
if (import.meta.main) {
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;

  app.listen(port, () => {
    console.log(`🦊 JurisConsulta API is running at http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/swagger`);
    console.log(`💓 Health Check: http://localhost:${port}/api/health`);
  });
}
