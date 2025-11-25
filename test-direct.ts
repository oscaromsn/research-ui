// Direct test script for conductResearchWithEffect
import { conductResearchWithEffect } from "./app/actions/conductResearchWithEffect";

console.log("=== Starting direct test of conductResearchWithEffect ===");

const stream = await conductResearchWithEffect("test question");
const reader = stream.getReader();
const decoder = new TextDecoder();

console.log("=== Reading stream ===");
while (true) {
  const { done, value } = await reader.read();
  if (done) {
    console.log("=== Stream ended ===");
    break;
  }
  const text = decoder.decode(value);
  console.log("Stream update:", text);
}

console.log("=== Test complete ===");
