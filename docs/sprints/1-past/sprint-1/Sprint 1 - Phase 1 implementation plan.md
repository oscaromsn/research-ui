# 2.1. Implementation plan - Phase 1

Okay, let's dive deep into Phase 1: Implementing the Server-Side Orchestrator (
`researchAgentOrchestrator.ts`). This phase is foundational, setting up the
server-side engine that drives the entire JurisConsulta application.

## Phase 1: Implement Server-Side Orchestrator (`researchAgentOrchestrator.ts`)

**Goal:** Create a Next.js Server Action (`conductResearch`) that can execute
the BAML legal research pipeline sequentially, streaming status and summarized
data updates to the client.

**Location:** `app/actions/researchAgentOrchestrator.ts` (Create this file if it
doesn't exist)

---

### Step 1.1: Define Core Stream Communication Types

**Action:** Define the `ResearchStage` enum and `ResearchUpdate` interface
within `researchAgentOrchestrator.ts`.

**Details:**

- **`ResearchStage` Enum:**

  ```typescript
  export type ResearchStage =
      | "IDLE" // Initial state before starting
      | "INITIALIZING"
      | "GENERATING_QUERIES"
      | "FETCHING_DOCUMENTS"
      | "ANALYZING_DOCUMENTS"
      | "SYNTHESIZING_FINDINGS"
      | "ASSESSING_RESEARCH"
      | "GENERATING_REPORT"
      | "ITERATION_PAUSED" // For PRD FR2.5.1 when loop isn't fully implemented
      | "HUMAN_REVIEW_REQUESTED"
      | "COMPLETED"
      | "ERROR";
  ```

    - Ensure all stages mentioned in PRD FR2.2.4 are included. `IDLE` is added
      for clarity in client-side initial state.

- **`ResearchUpdate` Interface:**

  ```typescript
  export interface ResearchUpdate {
      type: "PROGRESS" | "DATA" | "ERROR" | "STATUS_CHANGE" | "LOG";
      stage: ResearchStage;
      message?: string; // For logs, status messages, error details
      data?: any;       // Payload for DATA type updates (client-friendly summaries)
      isFinalForStage?: boolean; // True if this is the conclusive DATA update for the current stage
      currentProcessedDoc?: number; // For ANALYZING_DOCUMENTS progress
      totalDocsToProcess?: number;  // For ANALYZING_DOCUMENTS progress
      fieldName?: string; // For streaming specific fields within a DATA update (e.g., 'executiveSummary')
      isFieldComplete?: boolean; // For streaming specific fields
  }
  ```

    - `type`: Added `PROGRESS` to differentiate granular progress within a stage
      from a final `DATA` update for that stage.
    - `data`: Will hold client-friendly summaries, not raw BAML objects.
    - `isFinalForStage`: Important for the client to know when a stage's primary
      output is complete.
    - `currentProcessedDoc`, `totalDocsToProcess`: For providing progress during
      document analysis.
    - `fieldName`, `isFieldComplete`: For FR2.3.4 (streaming parts of a BAML
      object like report sections).

**Acceptance Criteria 1.1:**

- ✅ `ResearchStage` enum and `ResearchUpdate` interface are correctly defined in
  `researchAgentOrchestrator.ts`.
- ✅ Types are exported for use by the client-side hook.

---

### Step 1.2: Implement Stream Creation and Update Utilities

**Action:** Implement `createStream()` and `sendUpdate()` helper functions.

**Details:**

- **`createStream()`:**

  ```typescript
  function createStream(): {
      stream: ReadableStream<Uint8Array>;
      writer: WritableStreamDefaultWriter<Uint8Array>;
      encoder: TextEncoder;
      closeStream: () => Promise<void>; // Function to explicitly close the writer
  } {
      const encoder = new TextEncoder();
      let controller: ReadableStreamDefaultController<Uint8Array>;
      const stream = new ReadableStream({
          start(c) {
              controller = c;
          },
          // Optional: cancel(reason) { console.log('Stream cancelled:', reason); }
      });

      // It's generally better to use a TransformStream for manual writing,
      // as getting a writer directly from ReadableStream is not standard.
      // However, for Server Actions, Next.js might handle this.
      // Let's proceed with TransformStream for robustness:
      const transformStream = new TransformStream();
      const writer = transformStream.writable.getWriter();

      const closeStream = async () => {
          if (writer && !writer.closed) {
              try {
                  await writer.close();
              } catch (e) {
                  console.error("Error closing stream writer:", e);
              }
          }
      };

      return { stream: transformStream.readable, writer, encoder, closeStream };
  }
  ```

    - This uses `TransformStream` which is the standard way to programmatically
      create a `ReadableStream`.
    - Includes a `closeStream` utility.

- **`sendUpdate()`:**

  ```typescript
  async function sendUpdate(
      writer: WritableStreamDefaultWriter<Uint8Array>,
      encoder: TextEncoder,
      update: ResearchUpdate
  ): Promise<void> {
      try {
          const jsonString = JSON.stringify(update);
          await writer.write(encoder.encode(jsonString + '\n')); // Newline delimiter
      } catch (e) {
          console.error("Stream write error in sendUpdate:", e, "Update:", update);
          // If writer is closed, this will throw. Consider how to handle this.
          // Perhaps the caller of sendUpdate should check writer.closed.
      }
  }
  ```

    - Ensures each JSON object is newline-terminated for client-side parsing (
      PRD FR2.2.2).
    - Includes basic error logging for write failures.

**Acceptance Criteria 1.2:**

- ✅ `createStream()` correctly returns `stream`, `writer`, `encoder`, and
  `closeStream`.
- ✅ `sendUpdate()` correctly serializes `ResearchUpdate` to JSON, appends a
  newline, and writes to the stream.

---

### Step 1.3: Define the `conductResearch` Server Action Skeleton

**Action:** Create the `conductResearch` server action function signature and
basic structure.

**Details:**

```typescript
// At the top of app/actions/researchAgentOrchestrator.ts
'use server';

import { b } from '@/baml_client'; // Assuming async client
import type {
    LegalQueryAnalysis, // ... other BAML types
    SearchQueryItem, SearchResultItem, AnalyzedDocument, OverallSynthesis, ResearchAssessment, FinalLegalReport
} from '@/baml_client/types';
// ... import ResearchStage, ResearchUpdate from within this file

// Mock function for document fetching
async function fetchDocumentsFromQueries(queries: SearchQueryItem[]): Promise<SearchResultItem[]> {
    // (Keep the mock implementation from previous response for now)
    console.log("Simulating document fetch for queries:", queries.map(q => q.query_string).join(", "));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    const mockResults: SearchResultItem[] = [ /* ... mock data ... */ ];
    if (queries.length > 0 && queries[0].query_string.includes("no results please")) {
        return [];
    }
    return mockResults.slice(0, Math.floor(Math.random() * 2) + 1); // return 1 to 2 results
}

export async function conductResearch(legalQuestion: string): Promise<ReadableStream<Uint8Array>> {
    const { stream, writer, encoder, closeStream } = createStream();
    let currentStage: ResearchStage = "IDLE";

    // IIFE to run async pipeline logic and allow `conductResearch` to return the stream immediately
    (async () => {
        try {
            currentStage = "INITIALIZING";
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Research process initializing..." });

            // TODO: Implement pipeline stages here

            currentStage = "COMPLETED"; // Placeholder
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Research process completed (skeleton)." });

        } catch (error: any) {
            console.error(`Error during orchestrator stage ${currentStage}:`, error);
            // Ensure currentStage is accurate if error happens within a BAML call that changes it internally
            await sendUpdate(writer, encoder, { type: "ERROR", stage: currentStage, message: error.message || "An unknown orchestrator error occurred." });
        } finally {
            await closeStream();
        }
    })();

    return stream;
}
```

- Mark with `'use server'`.
- Import necessary BAML types and the BAML client (`b`).
- Define the `fetchDocumentsFromQueries` mock function (PRD 2.6, FR2.3.1). It
  should accept `SearchQueryItem[]` and return `Promise<SearchResultItem[]>`.
  For now, it can return static mock data or randomly generate a few items. Make
  it return an empty array if a query string contains "no results please" for
  testing empty states.
- The main logic is wrapped in an IIFE `(async () => { ... })();` so
  `conductResearch` can return the `stream` object synchronously while the async
  pipeline logic runs and writes to it.
- Basic `try...catch...finally` block for error handling and ensuring stream
  closure.
- Sends initial `INITIALIZING` and final (placeholder) `COMPLETED` status
  updates.

**Acceptance Criteria 1.3:**

- ✅ `conductResearch` Server Action exists, takes `legalQuestion: string`,
  returns `Promise<ReadableStream<Uint8Array>>`.
- ✅ Basic stream setup using `createStream()` and `closeStream()` in `finally`
  is present.
- ✅ Initial `INITIALIZING` status is streamed.
- ✅ A placeholder `COMPLETED` status is streamed.
- ✅ `fetchDocumentsFromQueries` mock function is implemented and callable.

**Checkpoint 1:** At this point, you should be able to call `conductResearch`
from a simple test script or a basic client-side component and observe the
`INITIALIZING` and `COMPLETED` JSON updates being streamed.

---

### Step 1.4: Implement Pipeline Stage 1: Generate Legal Search Queries

**Action:** Integrate the `GenerateLegalSearchQueries` BAML function call.

**Details:** Inside the `try` block of the IIFE in `conductResearch`, after the
`INITIALIZING` update:

```typescript
            // --- Stage 1: Generate Queries (FR1.1.1, FR2.3.1) ---
            currentStage = "GENERATING_QUERIES";
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Generating initial search queries..." });

            const queryAnalysis: LegalQueryAnalysis = await b.GenerateLegalSearchQueries(legalQuestion);
            // Log raw BAML output for debugging if needed (server-side log)
            // console.log("BAML GenerateLegalSearchQueries Output:", JSON.stringify(queryAnalysis, null, 2));

            // Send client-friendly summary (PRD FR2.3.3)
            await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: {
                    queries: queryAnalysis.search_queries.map(q => ({
                        query_string: q.query_string,
                        expected_information_summary: q.expected_information.join(' ').substring(0, 100) + "..." // Example summary
                    })),
                    reasoningEntryPoints: { // Send initial reasoning snippets
                        analyzeLegalQuestionSummary: queryAnalysis.reasoning.analyze_legal_question.summary?.substring(0,150) + "...",
                        // Add other key reasoning summaries if useful for immediate display
                    }
                },
                message: `${queryAnalysis.search_queries.length} initial queries generated.`,
                isFinalForStage: true,
            });
```

- Update `currentStage` and send `STATUS_CHANGE`.
- Call `b.GenerateLegalSearchQueries`.
- Process `queryAnalysis` to extract client-friendly data (e.g., only query
  strings, summary of reasoning).
- Send `DATA` update with this summarized data and `isFinalForStage: true`.
- Handle potential errors from the BAML call (already covered by the main
  `try...catch`).

**Acceptance Criteria 1.4:**

- ✅ `GENERATING_QUERIES` status is streamed.
- ✅ `b.GenerateLegalSearchQueries` is called with `legalQuestion`.
- ✅ A `DATA` update containing a *client-friendly summary* of the generated
  queries (not the full `LegalQueryAnalysis` object) and possibly reasoning
  snippets is streamed.
- ✅ `isFinalForStage: true` is set for this `DATA` update.

---

### Step 1.5: Implement Pipeline Stage 2: Simulated Document Retrieval

**Action:** Call the `fetchDocumentsFromQueries` mock function.

**Details:** After Stage 1:

```typescript
            // --- Stage 2: Fetch Documents (Simulated - FR2.3.1, PRD 2.6) ---
            currentStage = "FETCHING_DOCUMENTS";
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Retrieving documents based on queries..." });

            const searchResultItems: SearchResultItem[] = await fetchDocumentsFromQueries(queryAnalysis.search_queries);
            // console.log("Mocked SearchResultItems:", searchResultItems);

            if (searchResultItems.length === 0) {
                await sendUpdate(writer, encoder, {
                    type: "LOG", // Or ERROR if this should halt the process
                    stage: currentStage,
                    message: "No documents found for the generated queries. Further refinement might be needed.",
                    isFinalForStage: true, // Final update for this stage, even if no docs
                });
                // Decide if to proceed or error out. For now, let's allow proceeding to synthesis which will handle empty input.
            } else {
                 await sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage,
                    data: {
                        count: searchResultItems.length,
                        titles: searchResultItems.map(r => r.title?.substring(0, 70) + "..."), // Client-friendly list of titles
                    },
                    message: `${searchResultItems.length} documents retrieved (simulated).`,
                    isFinalForStage: true,
                });
            }
```

- Update `currentStage` and send `STATUS_CHANGE`.
- Call `fetchDocumentsFromQueries` with `queryAnalysis.search_queries`.
- Send `DATA` update with count/titles of retrieved documents. Mark
  `isFinalForStage: true`.
- Handle the case where `searchResultItems` is empty (send a specific LOG or
  perhaps an ERROR if it's critical).

**Acceptance Criteria 1.5:**

- ✅ `FETCHING_DOCUMENTS` status is streamed.
- ✅ `fetchDocumentsFromQueries` is called.
- ✅ A `DATA` update with count/titles of (mock) documents is streamed.

**Checkpoint 2:** Test the orchestrator again. It should now stream through
`INITIALIZING`, `GENERATING_QUERIES` (with query data), `FETCHING_DOCUMENTS` (
with mock doc data), and then `COMPLETED`.

---

### Step 1.6: Implement Pipeline Stage 3: Analyze Documents (Iterative)

**Action:** Loop through `searchResultItems` and call `AnalyzeSingleDocument`
for each.

**Details:** After Stage 2:

```typescript
            // --- Stage 3: Analyze Documents (Iterative - FR1.1.2, FR2.3.1) ---
            currentStage = "ANALYZING_DOCUMENTS";
            await sendUpdate(writer, encoder, {
                type: "STATUS_CHANGE",
                stage: currentStage,
                message: `Starting analysis of ${searchResultItems.length} documents...`,
                totalDocsToProcess: searchResultItems.length,
                currentProcessedDoc: 0
            });

            const analyzedDocs: AnalyzedDocument[] = [];
            for (let i = 0; i < searchResultItems.length; i++) {
                const doc = searchResultItems[i];
                await sendUpdate(writer, encoder, {
                    type: "PROGRESS", // Using PROGRESS for individual doc analysis status
                    stage: currentStage,
                    message: `Analyzing document ${i + 1}/${searchResultItems.length}: ${doc.title?.substring(0, 50) + "..." || "Untitled"}`,
                    currentProcessedDoc: i,
                    totalDocsToProcess: searchResultItems.length
                });

                const analysis: AnalyzedDocument = await b.AnalyzeSingleDocument(doc, legalQuestion);
                analyzedDocs.push(analysis);
                // console.log(`Analyzed Document ${doc.id}:`, JSON.stringify(analysis.summary, null, 2));

                // Send client-friendly summary of this specific document's analysis
                await sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage, // Still in ANALYZING_DOCUMENTS stage
                    data: {
                        docId: doc.id, // Use search_result_id from BAML output if different
                        title: doc.title,
                        relevanceScore: analysis.relevance_score,
                        confidenceScore: analysis.confidence_score,
                        summarySnippet: analysis.summary.substring(0, 200) + "...", // Streamed field, send initial part
                        // Other key pieces safe for client display
                    },
                    message: `Analysis complete for: ${doc.title?.substring(0, 50) + "..." || "Untitled"}. Relevance: ${analysis.relevance_score}`,
                    currentProcessedDoc: i + 1,
                    totalDocsToProcess: searchResultItems.length,
                    // isFinalForStage is true only on the last document's DATA or a separate summary DATA
                });
            }
            await sendUpdate(writer, encoder, {
                type: "LOG", // A final log for the stage
                stage: currentStage,
                message: "All documents analyzed.",
                isFinalForStage: true, // Signifies the end of the document analysis output stream for this stage
                totalDocsToProcess: searchResultItems.length,
                currentProcessedDoc: searchResultItems.length
            });
```

- Update `currentStage` and send an initial `STATUS_CHANGE` with
  `totalDocsToProcess`.
- Iterate. In each iteration:
    - Send a `PROGRESS` update (or `LOG`) indicating which document is being
      analyzed.
    - Call `b.AnalyzeSingleDocument`.
    - Send a `DATA` update with a *client-friendly summary* of the
      `AnalyzedDocument` (relevance, summary snippet). This `DATA` update is for
      *one document*.
- After the loop, send a final `LOG` update indicating all documents are
  analyzed, setting `isFinalForStage: true`.

**Acceptance Criteria 1.6:**

- ✅ `ANALYZING_DOCUMENTS` status is streamed.
- ✅ Loop executes, calling `b.AnalyzeSingleDocument` for each mock document.
- ✅ `PROGRESS` or `LOG` updates are sent for each document being processed.
- ✅ `DATA` updates with summarized analysis for each document are streamed.
- ✅ A final `LOG` update with `isFinalForStage: true` is sent after all
  documents are analyzed.

---

### Step 1.7: Implement Pipeline Stage 4: Synthesize Findings

**Action:** Call `SynthesizeAllFindings`.

**Details:** After Stage 3:

```typescript
            // --- Stage 4: Synthesize Findings (FR1.1.3, FR2.3.1) ---
            if (analyzedDocs.length > 0) { // Only synthesize if there are analyzed documents
                currentStage = "SYNTHESIZING_FINDINGS";
                await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Synthesizing findings from analyzed documents..." });

                const synthesis: OverallSynthesis = await b.SynthesizeAllFindings(analyzedDocs, legalQuestion);
                // console.log("Overall Synthesis:", JSON.stringify(synthesis, null, 2));

                await sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage,
                    data: {
                        topics: synthesis.key_synthesized_topics.map(t => ({
                            title: t.topic_title,
                            synthesisSnippet: t.synthesis.substring(0, 250) + "...", // Streamed field, send initial part
                            confidence: t.confidence_score,
                            docIds: t.supporting_document_ids,
                        })),
                        unansweredAspects: synthesis.unanswered_aspects,
                        emergingQuestions: synthesis.emerging_questions,
                        reasoningSummary: synthesis.reasoning.analyze_legal_question.summary?.substring(0,150) + "..."
                    },
                    message: "Overall synthesis complete.",
                    isFinalForStage: true,
                });
            } else {
                await sendUpdate(writer, encoder, { type: "LOG", stage: "SYNTHESIZING_FINDINGS", message: "Skipping synthesis as no documents were analyzed.", isFinalForStage: true });
                // If no docs, assessment might also be skipped or lead directly to new queries/human review
            }
```

- Update `currentStage`, send `STATUS_CHANGE`.
- Call `b.SynthesizeAllFindings`.
- Send `DATA` update with client-friendly `OverallSynthesis`. Mark
  `isFinalForStage: true`.
- Handle the case where `analyzedDocs` is empty.

**Acceptance Criteria 1.7:**

- ✅ `SYNTHESIZING_FINDINGS` status is streamed.
- ✅ `b.SynthesizeAllFindings` is called.
- ✅ `DATA` update with summarized synthesis is streamed.

---

### Step 1.8: Implement Pipeline Stage 5: Assess Research (Simplified Iteration)

**Action:** Call `AssessResearchAndPlanNextSteps` and handle its simplified
output.

**Details:** After Stage 4:

```typescript
            let assessment: ResearchAssessment | null = null;
            if (analyzedDocs.length > 0 && synthesis) { // Only assess if there's something to assess
                // --- Stage 5: Assess Research (FR1.1.4, FR2.3.1, FR2.5.1) ---
                currentStage = "ASSESSING_RESEARCH";
                await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Assessing research sufficiency and planning next steps..." });

                assessment = await b.AssessResearchAndPlanNextSteps(
                    legalQuestion,
                    queryAnalysis, // from Stage 1
                    synthesis    // from Stage 4
                );
                // console.log("Research Assessment:", JSON.stringify(assessment, null, 2));

                await sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage,
                    data: {
                        isSufficient: assessment.is_sufficient,
                        assessmentSummary: assessment.assessment_summary, // Streamed field, send initial part
                        nextAction: assessment.next_action,
                        identifiedGaps: assessment.identified_gaps,
                        // Optionally send suggested_queries_for_refinement if nextAction warrants it
                        suggestedRefinementQueries: (assessment.next_action === "REFINE_QUERIES" || assessment.next_action === "NEW_QUERIES")
                            ? assessment.suggested_queries_for_refinement?.map(q => q.query_string)
                            : undefined,
                    },
                    message: `Assessment complete. Next action: ${assessment.next_action}.`,
                    isFinalForStage: true,
                });
            } else {
                 await sendUpdate(writer, encoder, { type: "LOG", stage: "ASSESSING_RESEARCH", message: "Skipping assessment due to lack of analyzed documents or synthesis.", isFinalForStage: true });
                 // Default to requesting human review or new queries if assessment is skipped
                 assessment = {
                     is_sufficient: false,
                     assessment_summary: "Insufficient data to perform assessment. Initial document retrieval might have failed or found no relevant items.",
                     next_action: "REQUEST_HUMAN_REVIEW", // Or NEW_QUERIES
                     reasoning: { /* simplified default reasoning */ } as any, // Cast for simplicity
                 } as ResearchAssessment;
                 // Send a DATA update for this default assessment
                 await sendUpdate(writer, encoder, {
                    type: "DATA",
                    stage: currentStage, // Still ASSESSING_RESEARCH
                    data: {
                        isSufficient: assessment.is_sufficient,
                        assessmentSummary: assessment.assessment_summary,
                        nextAction: assessment.next_action,
                    },
                    message: "Assessment defaulted due to insufficient prior data.",
                    isFinalForStage: true,
                 });
            }

            // Simplified Iteration Logic (PRD FR2.5.1)
            if (assessment.next_action !== "GENERATE_REPORT") {
                currentStage = assessment.next_action === "REQUEST_HUMAN_REVIEW" ? "HUMAN_REVIEW_REQUESTED" : "ITERATION_PAUSED";
                await sendUpdate(writer, encoder, {
                    type: "STATUS_CHANGE",
                    stage: currentStage,
                    message: `Research paused. Suggested next action: ${assessment.next_action}. Summary: ${assessment.assessment_summary}`,
                });
                // End the stream here for v1.0 as full loop is out of scope
                await closeStream();
                return; // Exit the IIFE
            }
```

- Update `currentStage`, send `STATUS_CHANGE`.
- Call `b.AssessResearchAndPlanNextSteps`.
- Send `DATA` update with client-friendly `ResearchAssessment`. Mark
  `isFinalForStage: true`.
- If `assessment.next_action` is not `GENERATE_REPORT`:
    - Send appropriate `STATUS_CHANGE` (e.g., `ITERATION_PAUSED` or
      `HUMAN_REVIEW_REQUESTED`).
    - Send a message explaining the suggested next step.
    - `await closeStream(); return;` to terminate the process as per FR2.5.1.

**Acceptance Criteria 1.8:**

- ✅ `ASSESSING_RESEARCH` status is streamed.
- ✅ `b.AssessResearchAndPlanNextSteps` is called.
- ✅ `DATA` update with summarized assessment is streamed.
- ✅ If next action is not `GENERATE_REPORT`, the stream terminates gracefully
  with an appropriate status.

**Checkpoint 3:** Test with a `legalQuestion` that you expect will *not* lead to
`GENERATE_REPORT` immediately. Verify the stream ends with `ITERATION_PAUSED` or
`HUMAN_REVIEW_REQUESTED`. Then test one that should proceed.

---

### Step 1.9: Implement Pipeline Stage 6: Generate Final Report (with Streaming Text)

**Action:** Call `GenerateFinalLegalReport` and handle its potentially streaming
fields.

**Details:** Inside the `if (assessment.next_action === "GENERATE_REPORT")`
block:

```typescript
            // --- Stage 6: Generate Final Report (FR1.1.5, FR2.3.1, FR2.3.4) ---
            currentStage = "GENERATING_REPORT";
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Generating final legal report..." });

            const reportStream = b.stream.GenerateFinalLegalReport(
                legalQuestion,
                synthesis!, // synthesis would be defined if assessment.next_action === "GENERATE_REPORT"
                [queryAnalysis] // Assuming one round of query_history for now
            );

            let finalReportAccumulator: Partial<FinalLegalReport> = {};

            for await (const partialReport of reportStream) {
                // Update accumulator
                finalReportAccumulator = { ...finalReportAccumulator, ...partialReport };

                // Determine which fields are streaming and send updates
                // BAML's @stream.with_state gives `fieldName: { value: T, state: "Pending" | "Incomplete" | "Complete" }`
                // For simplicity, let's assume partialReport directly gives chunks for streamable fields
                // or the full value if the field itself is not streamable but part of a streaming object.

                // Example for executive_summary (assuming it's a @stream.with_state field in BAML)
                if (partialReport.executive_summary) { // Or check partialReport.executive_summary.state
                    await sendUpdate(writer, encoder, {
                        type: "DATA",
                        stage: currentStage,
                        data: {
                            // report_title might come early and be final
                            report_title: finalReportAccumulator.report_title || partialReport.report_title,
                            // executive_summary is streaming
                            executive_summary_chunk: partialReport.executive_summary, // Or partialReport.executive_summary.value
                        },
                        message: "Streaming executive summary...",
                        fieldName: "executiveSummary",
                        isFieldComplete: partialReport.executive_summary_is_complete // You'd get this from @stream.with_state
                    });
                }

                // Similar logic for sections[i].content if they are @stream.with_state
                if (partialReport.sections) {
                    partialReport.sections.forEach((section, index) => {
                        if (section?.content) { // Check if content is streaming
                             sendUpdate(writer, encoder, {
                                type: "DATA",
                                stage: currentStage,
                                data: {
                                    sectionUpdate: {
                                        index: index, // So client knows which section
                                        title: section.section_title, // Might be final early
                                        content_chunk: section.content, // Or section.content.value
                                    }
                                },
                                message: `Streaming content for section: ${section.section_title}`,
                                fieldName: `section_${index}_content`,
                                isFieldComplete: section.content_is_complete // from @stream.with_state
                            });
                        }
                    });
                }
                 // Handle conclusion streaming similarly
                if (partialReport.conclusion) {
                    await sendUpdate(writer, encoder, {
                        type: "DATA", stage: currentStage,
                        data: { conclusion_chunk: partialReport.conclusion },
                        message: "Streaming conclusion...",
                        fieldName: "conclusion",
                        isFieldComplete: partialReport.conclusion_is_complete
                    });
                }
            }

            const finalReportObject: FinalLegalReport = await reportStream.getFinalResponse();
            // console.log("Final Report Object:", JSON.stringify(finalReportObject, null, 2));

            // Send one final DATA update with all non-streamed or completed fields, or a confirmation
            await sendUpdate(writer, encoder, {
                type: "DATA",
                stage: currentStage,
                data: { // Send client-friendly final report structure
                    title: finalReportObject.report_title,
                    executiveSummary: finalReportObject.executive_summary, // Full content
                    sections: finalReportObject.sections.map(s => ({ title: s.section_title, content: s.content })),
                    conclusion: finalReportObject.conclusion,
                    limitations: finalReportObject.limitations_and_caveats,
                    appendixDocIds: finalReportObject.appendix_document_ids,
                },
                message: "Final report generation complete.",
                isFinalForStage: true,
            });

            currentStage = "COMPLETED";
            await sendUpdate(writer, encoder, { type: "STATUS_CHANGE", stage: currentStage, message: "Research process successfully completed." });
```

- Update `currentStage`, send `STATUS_CHANGE`.
- Call `b.stream.GenerateFinalLegalReport(...)`.
- Iterate through `partialReport` from the BAML stream.
- Inside the loop, identify which field is currently streaming (e.g.,
  `executive_summary`, `sections[i].content`, `conclusion`) based on the
  `partialReport` structure (which reflects BAML's `@stream.with_state` output).
- Send `DATA` updates. The `ResearchUpdate.data` payload should be structured to
  allow the client to append text to the correct UI element. E.g.,
  `{ fieldName: "executiveSummary", chunk: "...", isFieldComplete: boolean }` or
  `{ fieldName: "sectionContent", sectionIndex: 0, chunk: "...", isFieldComplete: boolean }`.
- After the BAML stream loop, call `await reportStream.getFinalResponse()` to
  get the complete `FinalLegalReport` object.
- Send a final `DATA` update with `isFinalForStage: true` containing any
  non-streamed parts or a confirmation.
- Finally, send `STATUS_CHANGE` to `COMPLETED`.

**Acceptance Criteria 1.9:**

- ✅ `GENERATING_REPORT` status is streamed.
- ✅ `b.stream.GenerateFinalLegalReport` is called.
- ✅ For BAML fields with `@stream.with_state`, `DATA` updates are streamed
  progressively, indicating which field and the chunk of text.
- ✅ A final `DATA` update with `isFinalForStage: true` is sent.
- ✅ `COMPLETED` status is streamed after report generation.

---

### Phase 1 Completion Criteria & Checkpoints:

1. **All files created:** `app/actions/researchAgentOrchestrator.ts` exists.
2. **Types defined:** `ResearchStage` and `ResearchUpdate` are correctly defined
   and exported.
3. **Utilities implemented:** `createStream()` and `sendUpdate()` are
   functional.
4. **`conductResearch` action structure:**
    - ✅ Correctly marked as `'use server'`.
    - ✅ Accepts `legalQuestion: string`.
    - ✅ Returns `Promise<ReadableStream<Uint8Array>>`.
    - ✅ Uses the IIFE pattern for async pipeline execution.
    - ✅ Includes a main `try...catch...finally` block ensuring `closeStream()`
      is always called.
5. **Sequential Pipeline Execution:**
    - ✅ All BAML functions (`GenerateLegalSearchQueries`,
      `AnalyzeSingleDocument`, `SynthesizeAllFindings`,
      `AssessResearchAndPlanNextSteps`, `stream.GenerateFinalLegalReport`) are
      called in the correct order.
    - ✅ `fetchDocumentsFromQueries` mock is called.
    - ✅ Output from one stage is correctly passed as input to the next.
6. **Streaming Updates:**
    - ✅ `STATUS_CHANGE` updates are sent before each major stage.
    - ✅ `DATA` updates are sent after each stage (or for each document in
      iterative stages) with *client-friendly summarized data* and
      `isFinalForStage: true` where appropriate.
    - ✅ `LOG` or `PROGRESS` updates are sent for iterative processes (e.g.,
      document analysis).
    - ✅ For `stream.GenerateFinalLegalReport`, partial text chunks are correctly
      extracted from the BAML stream and relayed as `DATA` updates with
      `fieldName` and `isFieldComplete` hints.
7. **Simplified Iteration Logic (FR2.5.1):**
    - ✅ If `AssessResearchAndPlanNextSteps` result is not `GENERATE_REPORT`, the
      stream terminates with an appropriate `STATUS_CHANGE` (e.g.,
      `ITERATION_PAUSED`, `HUMAN_REVIEW_REQUESTED`).
8. **Error Handling (FR2.4):**
    - ✅ Errors during any BAML call or orchestrator logic result in an `ERROR`
      type `ResearchUpdate` being streamed, and the stream is then closed.
9. **No Raw BAML Objects in Stream:** The `data` field of `ResearchUpdate` for
   `type: "DATA"` must contain *summarized/client-friendly* data, not the full,
   complex BAML type outputs directly (unless a specific field is being streamed
   verbatim like a report section).
10. **Manual Test Pass:**
    - A simple client-side test (can be a basic React component or even a
      Node.js script using `fetch`) that calls `conductResearch` and logs all
      streamed `ResearchUpdate` objects to the console.
    - Test with a `legalQuestion` that is expected to go through all stages to
      `GENERATE_REPORT` and then `COMPLETED`.
    - Test with a `legalQuestion` that (based on mock
      `AssessResearchAndPlanNextSteps` output or tweaked BAML prompt) results in
      `ITERATION_PAUSED` or `HUMAN_REVIEW_REQUESTED`.
    - Test with `fetchDocumentsFromQueries` returning an empty array – verify
      graceful handling.
    - Induce an error in one of the BAML functions (e.g., by passing invalid
      input if possible, or temporarily breaking a BAML prompt) and verify an
      `ERROR` update is streamed.

This detailed plan should provide a clear path for implementing the server-side
orchestrator. Each step has verifiable criteria, allowing for incremental
progress and testing.
