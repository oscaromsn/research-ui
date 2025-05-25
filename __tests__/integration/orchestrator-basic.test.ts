/**
 * Basic integration test for the research orchestrator
 * Tests the fundamental streaming mechanics before implementing full pipeline
 */

import { conductResearch } from '@/app/actions/researchAgentOrchestrator';
import type { ResearchUpdate } from '@/app/actions/researchAgentOrchestrator';

describe('Research Orchestrator - Basic Streaming', () => {
  it('should stream INITIALIZING and COMPLETED updates', async () => {
    const legalQuestion = "Test question";
    const stream = await conductResearch(legalQuestion);
    
    const updates: ResearchUpdate[] = [];
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const update = JSON.parse(line) as ResearchUpdate;
            updates.push(update);
          } catch (e) {
            console.warn('Failed to parse JSON line:', line);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    // Verify basic flow
    expect(updates.length).toBeGreaterThanOrEqual(2);
    expect(updates[0].type).toBe('STATUS_CHANGE');
    expect(updates[0].stage).toBe('INITIALIZING');
    expect(updates[updates.length - 1].stage).toBe('COMPLETED');
  }, 10000); // 10 second timeout
  
  it('should handle empty legal question gracefully', async () => {
    const stream = await conductResearch("");
    const reader = stream.getReader();
    
    let hasError = false;
    let hasCompleted = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const update = JSON.parse(line) as ResearchUpdate;
          if (update.type === 'ERROR') hasError = true;
          if (update.stage === 'COMPLETED') hasCompleted = true;
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    // Should complete successfully even with empty question (for now)
    expect(hasCompleted).toBe(true);
  }, 10000); // 10 second timeout
});