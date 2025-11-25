// Simple API route to test conductResearchWithEffect
import { conductResearchWithEffect } from "@/app/actions/conductResearchWithEffect";

export async function POST() {
  console.log("=== API Route: Starting ===");

  try {
    const stream = await conductResearchWithEffect("API test question");
    console.log("=== API Route: Got stream ===");

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("=== API Route: Error ===", error);
    return new Response(`Error: ${error}`, { status: 500 });
  }
}
