"use client";

import { useState } from "react";
import { testEffectBasic } from "@/app/actions/testEffectBasic";

export default function TestEffectPage() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult("Running...");
    try {
      const res = await testEffectBasic();
      setResult(`Success: ${res}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>Effect Basic Test</h1>
      <button
        onClick={runTest}
        disabled={loading}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
      >
        {loading ? "Running..." : "Test Effect"}
      </button>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f0f0f0",
          borderRadius: "4px",
        }}
      >
        <strong>Result:</strong> {result || "(not run yet)"}
      </div>
      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        Check terminal console for [testEffectBasic] and [Effect] logs
      </div>
    </div>
  );
}
