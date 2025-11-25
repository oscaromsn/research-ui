"use client";

import { useState } from "react";
import { conductResearchWithEffect } from "@/app/actions/conductResearchWithEffect";

export default function TestResearch() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString()}: ${msg}`]);
  };

  const runTest = async () => {
    setRunning(true);
    setLogs([]);
    addLog("Starting test...");

    try {
      const stream = await conductResearchWithEffect("simple test question");
      addLog("Got stream");

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      addLog("Reading stream...");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          addLog("Stream ended");
          break;
        }
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.trim());
        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            addLog(`Update: ${update.stage} - ${update.message || ""}`);
          } catch {
            addLog(`Raw: ${line}`);
          }
        }
      }

      addLog("Test complete!");
    } catch (error) {
      addLog(`Error: ${error}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "14px" }}>
      <h1>Direct conductResearchWithEffect Test</h1>

      <button
        onClick={runTest}
        disabled={running}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {running ? "Running..." : "Test Research"}
      </button>

      <div
        style={{
          background: "#f5f5f5",
          padding: "10px",
          borderRadius: "4px",
          maxHeight: "500px",
          overflow: "auto",
        }}
      >
        <strong>Logs:</strong>
        {logs.length === 0 && (
          <div style={{ color: "#999" }}>(no logs yet)</div>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              padding: "2px 0",
            }}
          >
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        Check browser console for client logs and terminal for server logs
        starting with [conductResearchWithEffect] or [Effect]
      </div>
    </div>
  );
}
