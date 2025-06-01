# 1.0. Project Requirements Document (PRD)

Product Goal:** To create LexiSynth, an AI-powered legal research assistant that streamlines the legal research process by (1) intelligently generating search queries from a legal question, (2) fetching and analyzing relevant documents, (3) iteratively assessing information sufficiency and refining research (ReAct-style), and (4) synthesizing findings into comprehensive legal reports.

**1. Introduction**

- **1.1. Purpose:** This document outlines the technical requirements for LexiSynth, a Next.js web application designed to assist legal professionals by automating and enhancing the legal research process using an AI-driven, multi-stage pipeline powered by BAML (Boundary AI Markup Language) and Large Language Models (LLMs).
- **1.2. Scope:** This PRD covers the core functionalities of LexiSynth, including legal question input, AI-driven search query generation, simulated document retrieval, document analysis, findings synthesis, iterative research assessment, final report generation, and the user interface for interacting with this pipeline. It focuses on the integration between the BAML backend logic and the Next.js frontend, emphasizing a decoupled architecture, streaming capabilities, and server-side agentic logic.

- **1.3. Goals:**
	- Develop a highly responsive and interactive user interface for legal research.
	- Implement a robust, server-side AI agent that can perform a multi-stage legal research pipeline.
	- Ensure clear separation between frontend presentation logic and backend AI/BAML intricacies.
	- Enable easy UI prototyping and layout changes with minimal impact on backend logic.
	- Securely execute all core AI agent logic on the server.
	- Provide real-time feedback to the user via streaming of text-based outputs.
	- Leverage BAML for structured LLM interactions and typed data throughout the AI pipeline.
	- Utilize Jotai for efficient client-side state management.
- **1.4. Target Users:** Legal professionals (lawyers, paralegals, legal researchers, law students) seeking to accelerate research, improve accuracy, and uncover deeper insights.
- **1.5. Definitions, Acronyms, and Abbreviations:**
	- **AI:** Artificial Intelligence
	- **BAML:** Boundary AI Markup Language
	- **LLM:** Large Language Model
	- **RSC:** React Server Component
	- **UI:** User Interface
	- **UX:** User Experience
	- **PRD:** Project Requirements Document
	- **CVA:** Class Variance Authority
	- **Exa:** A hypothetical or actual search API for legal documents.

**2. Overall Description**

- **2.1. Product Perspective:** LexiSynth will be a standalone web application. It will integrate with external LLM providers (Google AI, OpenAI, Anthropic) via BAML. Future integrations could include legal databases or search APIs (e.g., Exa).
- **2.2. Product Features (High-Level):**
	1. **Legal Question Input:** User interface for submitting a detailed legal question.
	2. **AI-Powered Query Generation:** LLM generates optimized search queries based on the legal question.
	3. **Simulated Document Retrieval:** Placeholder for fetching documents relevant to generated queries.
	4. **AI-Powered Document Analysis:** LLM analyzes retrieved documents for relevance, key arguments, entities, and quotes.
	5. **AI-Powered Findings Synthesis:** LLM synthesizes information from multiple analyzed documents into coherent themes.
	6. **AI-Powered Research Assessment:** LLM assesses research sufficiency and suggests next steps (iterative refinement).
	7. **AI-Powered Report Generation:** LLM drafts a final legal report based on synthesized findings.
	8. **Streaming UI:** Real-time display of LLM-generated text (summaries, reasoning, report sections).
	9. **Lifecycle Visualization:** UI component to show the current stage of the research process.
	10. **Interactive Modals:** Display detailed information (case details, reasoning chains).
	11. **Settings Management:** UI for application/user settings.
- **2.3. User Characteristics:** Users are expected to have legal domain knowledge but may vary in technical proficiency. The UI should be intuitive for legal professionals.
- **2.4. Operating Environment:**
	- Client-side: Modern web browsers (Chrome, Firefox, Safari, Edge).
	- Server-side: Next.js runtime environment (Node.js). BAML runtime integrated within this.
- **2.5. Design and Implementation Constraints:**
	- Must use Next.js (v15.3.2+) with React (v19.1.0+).
	- Must use BAML (v0.88.0+) for all LLM interactions.
	- Must use Jotai for global client-side state management.
	- Core agentic logic must reside server-side (Next.js Server Actions).
	- Client should primarily receive and render streaming text and status updates, not raw intermediate BAML objects or control agent decisions directly.
	- UI must be responsive and provide real-time feedback.
	- Follow coding standards and guidelines outlined in `CLAUDE.md`.
- **2.6. Assumptions and Dependencies:**
	- Availability of and access to LLM API keys (Google, OpenAI, Anthropic).
	- Stable BAML library and Next.js plugin versions.
	- User has a modern web browser with JavaScript enabled.
	- Simulated document retrieval will be sufficient for initial development; actual integration is a future step.

**3. System Features and Requirements**

This section details the specific technical requirements for each feature, following the "Research Agent Orchestrator" pattern.

- **3.1. BAML Backend & AI Pipeline**
	- **3.1.1. BAML Function Definitions:**
		- **FR1.1.1:** `GenerateLegalSearchQueries` function shall accept a `legal_question: string` and return a `LegalQueryAnalysis` object (containing `DetailedReasoning` and `SearchQueryItem[]`). (Ref: `baml_src/functions/1-generate_queries.baml`)
		- **FR1.1.2:** `AnalyzeSingleDocument` function shall accept `document: SearchResultItem` and `original_legal_question: string`, returning an `AnalyzedDocument`. (Ref: `baml_src/functions/2-analyze_document.baml`)
		- **FR1.1.3:** `SynthesizeAllFindings` function shall accept `analyzed_docs: AnalyzedDocument[]` and `original_legal_question: string`, returning an `OverallSynthesis`. (Ref: `baml_src/functions/3-synthesize_findings.baml`)
		- **FR1.1.4:** `AssessResearchAndPlanNextSteps` function shall accept `original_legal_question: string`, `initial_queries_analysis: LegalQueryAnalysis`, `current_synthesis?: OverallSynthesis`, returning a `ResearchAssessment`. (Ref: `baml_src/core_loop.baml`)
		- **FR1.1.5:** `GenerateFinalLegalReport` function shall accept `original_legal_question: string`, `synthesis: OverallSynthesis`, `query_history: LegalQueryAnalysis[]`, returning a `FinalLegalReport`. (Ref: `baml_src/functions/4-generate_final_report.baml`)
	- **3.1.2. BAML Type Definitions:**
		- **FR1.2.1:** All BAML types (`DetailedReasoning`, `SearchQueryItem`, `LegalEntity`, `AnalyzedDocument`, `SynthesizedTopic`, etc.) shall be defined as specified in `baml_src/types/`.
		- **FR1.2.2:** String fields intended for progressive display (e.g., summaries, content) shall use `@stream.with_state`.
		- **FR1.2.3:** Structures intended for atomic delivery (e.g., `SearchQueryItem`) shall use `@@stream.done`.
	- **3.1.3. BAML Client Configurations:**
		- **FR1.3.1:** Named clients (`QueryGeneration`, `DocumentAnalysis`, etc.) shall be defined in `baml_src/clients.baml`, defaulting to Google AI Gemini models and configured to use environment variables for API keys.
		- **FR1.3.2:** Fallback and retry policies (`Constant`, `Exponential`) shall be defined and available for client configurations.
	- **3.1.4. BAML Code Generation:**
		- **FR1.4.1:** `baml_src/generators.baml` shall be configured for `output_type "typescript/react"` targeting BAML version `0.88.0`.
		- **FR1.4.2:** The system must support regeneration of the `baml_client` via `bun generate:baml`.

- **3.2. Server-Side Orchestrator (`researchAgentOrchestrator.ts`)**
	- **FR2.1. Server Action Definition:**
		- **FR2.1.1:** A Next.js Server Action named `conductResearch` shall be implemented in `app/actions/researchAgentOrchestrator.ts`.
		- **FR2.1.2:** `conductResearch` shall accept `legalQuestion: string` as input.
		- **FR2.1.3:** `conductResearch` shall return a `Promise<ReadableStream<Uint8Array>>`.
	- **FR2.2. Stream Communication Protocol:**
		- **FR2.2.1:** The orchestrator shall use a `TransformStream` to manually construct the `ReadableStream`.
		- **FR2.2.2:** Streamed updates shall be newline-separated JSON strings, each representing a `ResearchUpdate` object.
		- **FR2.2.3:** The `ResearchUpdate` interface shall be defined with `type: "PROGRESS" | "DATA" | "ERROR" | "STATUS_CHANGE" | "LOG"`, `stage: ResearchStage`, optional `message`, optional `data`, and optional `isFinalForStage`.
		- **FR2.2.4:** `ResearchStage` enum shall cover all pipeline stages from `IDLE`, `INITIALIZING` through `COMPLETED`, plus `ERROR` and `HUMAN_REVIEW_REQUESTED`.
	- **FR2.3. Pipeline Execution Logic:**
		- **FR2.3.1:** `conductResearch` shall sequentially call BAML functions:
			1. `b.GenerateLegalSearchQueries`
			2. `fetchDocumentsFromQueries` (simulated document retrieval based on generated queries)
			3. `b.AnalyzeSingleDocument` (iteratively for each retrieved document)
			4. `b.SynthesizeAllFindings`
			5. `b.AssessResearchAndPlanNextSteps`
			6. `b.GenerateFinalLegalReport` (if assessment indicates).
		- **FR2.3.2:** Before each BAML call or significant step, a `STATUS_CHANGE` or `LOG` `ResearchUpdate` shall be sent to the client.
		- **FR2.3.3:** After each BAML call completes, a `DATA` `ResearchUpdate` shall be sent, containing a *client-friendly, summarized, or partial version* of the BAML function's output. Sensitive or overly complex intermediate data structures should not be sent directly. The `isFinalForStage: true` flag should be used.
		- **FR2.3.4 (Streaming BAML Output within Orchestrator):** If a BAML function called by the orchestrator returns a BAML stream (e.g., `b.stream.GenerateFinalReport` for its content fields), the orchestrator must:
			1. Consume this inner BAML stream.
			2. Transform its partial updates into appropriate `ResearchUpdate` objects of `type: "DATA"`, potentially indicating the specific field being streamed (e.g., `data: { field: "executiveSummary", chunk: "...", isFieldComplete: false }`).
	- **FR2.4. Error Handling:**
		- **FR2.4.1:** Each BAML call within the orchestrator shall be wrapped in a `try...catch`.
		- **FR2.4.2:** On error, an `ERROR` type `ResearchUpdate` containing the error message and current stage shall be sent.
		- **FR2.4.3:** The orchestrator must ensure the stream is properly closed using `writer.close()` in a `finally` block or upon error.
	- **FR2.5. Iterative Loop (Simplified Initial Implementation):**
		- **FR2.5.1:** If `AssessResearchAndPlanNextSteps` returns an action other than `GENERATE_REPORT` or `REQUEST_HUMAN_REVIEW`, the orchestrator shall send a "LOG" update indicating the suggested next step and then gracefully terminate the stream (e.g., by sending a `STATUS_CHANGE` to a specific "ITERATION_PAUSED" stage and then closing). Full iterative looping is out of scope for v0.1 but the architecture should allow for its future addition.

- **3.3. Client-Side State Management (Jotai)**
	- **FR3.1. Atom Definitions (`lib/state/researchAtoms.ts`):**
		- **FR3.1.1:** `researchStatusAtom`: Stores `{ stage: ResearchStage | null, isLoading: boolean, error: string | null, message?: string }`. Initial state: `{ stage: "IDLE", isLoading: false, error: null }`.
		- **FR3.1.2:** `researchLogAtom`: Stores `string[]` for logging orchestrator messages.
		- **FR3.1.3:** `generatedQueriesAtom`: Stores `ClientSearchQuery[]` (client-friendly version of `SearchQueryItem`).
		- **FR3.1.4:** `analyzedDocsSummaryAtom`: Stores `ClientAnalyzedDoc[]` (client-friendly summaries of `AnalyzedDocument`).
		- **FR3.1.5:** `synthesisDetailsAtom`: Stores `ClientSynthesis` (client-friendly version of `OverallSynthesis`).
		- **FR3.1.6:** `finalReportContentAtom`: Stores `ClientFinalReport` (client-friendly version of `FinalLegalReport`, with potentially streaming text fields).
	- **FR3.2. Client-Friendly Types:** Define TypeScript interfaces (e.g., `ClientSearchQuery`, `ClientAnalyzedDoc`) for data stored in Jotai atoms to abstract BAML's complex types from UI components.

- **3.4. Client-Side Orchestrator Hook (`lib/hooks/useResearchAgent.ts`)**
	- **FR4.1. Hook Definition:**
		- **FR4.1.1:** Implement `useResearchAgent` custom React hook.
		- **FR4.1.2:** The hook shall expose:
			- `startResearch(legalQuestion: string): Promise<void>`
			- `abortResearch(): void`
			- `isLoading: boolean` (derived from `researchStatusAtom`)
			- `currentStage: ResearchStage | null` (derived from `researchStatusAtom`)
			- `error: string | null` (derived from `researchStatusAtom`)
	- **FR4.2. Stream Handling:**
		- **FR4.2.1:** `startResearch` shall call the `conductResearch` Server Action.
		- **FR4.2.2:** It shall handle the returned `ReadableStream`, decoding `Uint8Array` chunks to strings and parsing newline-separated JSON `ResearchUpdate` objects.
		- **FR4.2.3:** An `AbortController` shall be used to allow cancellation of the stream processing.
	- **FR4.3. State Updates:**
		- **FR4.3.1:** Upon receiving a `ResearchUpdate`:
			- Log messages (`update.message`) to `researchLogAtom`.
			- If `type: "STATUS_CHANGE"`, update `researchStatusAtom.stage` and `researchStatusAtom.message`.
			- If `type: "DATA"`, update the relevant Jotai atom (`generatedQueriesAtom`, `analyzedDocsSummaryAtom`, etc.) based on `update.stage` and `update.data`. For streaming text fields (e.g., part of a report), append chunks to the appropriate string in the Jotai atom.
			- If `type: "ERROR"`, update `researchStatusAtom.error` and set `researchStatusAtom.isLoading = false`.
		- **FR4.3.2:** `startResearch` shall reset all relevant Jotai atoms to initial states before initiating a new research process.
		- **FR4.3.3:** `isLoading` in `researchStatusAtom` should be true from `INITIALIZING` until `COMPLETED` or `ERROR`.
	- **FR4.4. Abort Functionality:**
		- **FR4.4.1:** `abortResearch` shall call `abort()` on the current `AbortController` if one exists.
		- **FR4.4.2:** Stream reading loop must respect `controller.signal.aborted`.

- **3.5. Frontend UI Components (`components/domain/`)**
	- **FR5.1. General:**
		- **FR5.1.1:** All UI components displaying dynamic data related to the research process must consume data from the Jotai atoms defined in `lib/state/researchAtoms.ts` using `useAtomValue`.
		- **FR5.1.2:** Interactive elements triggering research or actions shall use handlers provided by `useResearchAgent` or directly modify Jotai state for non-AI actions.
	- **FR5.2. `GuidanceStrategy.tsx`:**
		- **FR5.2.1:** Input field for `legalQuestion`.
		- **FR5.2.2:** "Start Research" button shall call `useResearchAgent().startResearch()`. Button shall be disabled and show loading state when `researchStatusAtom.isLoading` is true.
		- **FR5.2.3:** Display generated queries from `generatedQueriesAtom`.
		- **FR5.2.4:** "Agent Assessment" section shall display data from `researchStatusAtom` (e.g., `assessment_summary`, `next_action`) and potentially `synthesisDetailsAtom.unanswered_aspects`.
	- **FR5.3. `EvidenceAnalysis.tsx`:**
		- **FR5.3.1:** Display list of analyzed document summaries from `analyzedDocsSummaryAtom`.
		- **FR5.3.2:** Selecting a document shall update a local state or a dedicated Jotai atom (`currentSelectedAnalyzedDocIdAtom` - to be created) to show its details.
		- **FR5.3.3:** Detailed view (lower panel) shall display relevance, summary, key arguments, entities for the selected document, sourcing data from `analyzedDocsSummaryAtom` based on the selected ID. Text fields like summary should update progressively if streamed.
	- **FR5.4. `SynthesisReporting.tsx`:**
		- **FR5.4.1 (Synthesis Studio Tab):** Display synthesized topics and unanswered aspects from `synthesisDetailsAtom`. Progressively update synthesis text if streamed.
		- **FR5.4.2 (Report Drafter Tab):** Renders `<ReportDrafter />`.
	- **FR5.5. `ReportDrafter.tsx`:**
		- **FR5.5.1:** Display `report_title`, `executive_summary`, `sections[].content`, `conclusion` from `finalReportContentAtom`. These fields should update progressively as they are streamed.
	- **FR5.6. `ResearchLifecycle.tsx`:**
		- **FR5.6.1:** Dynamically update stage indicators (active, completed, pending) based on `researchStatusAtom.stage`.
	- **FR5.7. Modals (`SettingsModal`, `CaseModal`, `SynthesisReasoningModal`):**
		- **FR5.7.1:** Content for `CaseModal` (when displaying analyzed doc details) and `SynthesisReasoningModal` should eventually be dynamic, driven by Jotai state representing the full BAML output for those reasoning objects (currently mocked or requires specific fetching). For v1, summaries streamed via orchestrator are prioritized.
- **3.6. Styling and UI Primitives**
	- **FR6.1:** UI components shall use Tailwind CSS for styling.
	- **FR6.2:** Reusable UI primitives (`Button`, `Modal`) are located in `components/ui/`.
- **3.7. Next.js Configuration**
	- **FR7.1:** `next.config.ts` must correctly integrate the BAML Next.js plugin.

**4. Non-Functional Requirements**

- **4.1. Performance:**
	- **NFR1.1:** Initial page load should be < 3 seconds on a standard broadband connection.
	- **NFR1.2:** UI must remain responsive during LLM streaming; user interactions (e.g., scrolling, opening modals not dependent on the stream) should not be blocked.
	- **NFR1.3:** Streaming text updates should appear with perceived low latency (<500ms for first chunk after LLM starts generating).
- **4.2. Scalability:**
	- **NFR2.1:** The server-side orchestrator should handle multiple concurrent research sessions (limited by Next.js serverless function capabilities and LLM rate limits).
- **4.3. Reliability:**
	- **NFR3.1:** The system shall gracefully handle LLM API errors and network interruptions, providing informative messages to the user via the `ResearchUpdate` stream.
	- **NFR3.2:** BAML client retry/fallback policies should be leveraged by the server-side orchestrator for LLM calls (already defined in `clients.baml`).
- **4.4. Security:**
	- **NFR4.1:** All LLM API keys and sensitive credentials must be stored as environment variables and accessed only server-side.
	- **NFR4.2:** The client-side application shall not have direct access to or control over the BAML pipeline's internal tool execution logic beyond initiating the research and receiving curated updates.
	- **NFR4.3:** Input validation should be performed on the `legalQuestion` (though specific validation rules are TBD).
- **4.5. Maintainability:**
	- **NFR5.1:** Code shall adhere to the guidelines in `CLAUDE.md` and `biome.json`.
	- **NFR5.2:** Clear separation between UI components, client-side state management, the server-side orchestrator, and BAML definitions.
- **4.6. Usability:**
	- **NFR6.1:** The UI shall provide clear feedback on the current research stage and any ongoing processes.
	- **NFR6.2:** Users shall be able to initiate and (if implemented) abort research tasks.

**5. External Interface Requirements**

- **5.1. User Interface:**
	- The application shall provide a web-based graphical user interface accessible via modern browsers.
	- Key UI sections include: Guidance & Strategy (input), Evidence & Analysis (results review), Synthesis & Reporting (final output).
- **5.2. LLM Provider APIs:**
	- The system shall interface with Google AI, OpenAI, and Anthropic APIs as configured in `baml_src/clients.baml` via the BAML runtime.
- **5.3. Document Source API (Future):**
	- (Out of scope for initial PRD, but architect for future integration) The system should be designed to allow future integration with legal document search APIs (e.g., Exa). The `fetchDocumentsFromQueries` function in the orchestrator is the placeholder for this.

**6. Testing Requirements (as per `CLAUDE.md`)**

- **6.1. BAML Tests:** Each BAML function in `baml_src/functions/` shall have corresponding `.test.baml` files with representative test cases.
- **6.2. Unit Tests (Vitest):** Utility functions, Jotai atom logic (if complex), and custom hooks (`useResearchAgent`) shall have unit tests.
- **6.3. Component Tests (React Testing Library):** UI components shall be tested for rendering, interactions, and state-driven display changes.
- **6.4. Type Checking:** `bun typecheck` must pass.
- **6.5. Linting:** `bun lint` (using Biome) must pass.

**7. Documentation Requirements**

- **7.1. Inline Code Comments:** For complex logic and public APIs. JSDoc for functions/components.
- **7.2. `CLAUDE.md`:** To be kept updated with major architectural decisions or guideline changes.
- **7.3. Internal Docs (`docs/` directory in `todo-llm` example):** While not explicitly requested to *create* for LexiSynth in this task, the pattern of detailed internal Markdown documentation should be considered for maintainability.

**8. Future Considerations (Out of Scope for Initial Implementation Covered by This PRD)**

- Full implementation of the iterative research loop (handling `REFINE_QUERIES`, `NEW_QUERIES`, `DEEPER_ANALYSIS_OF_EXISTING_DOCS` actions from `AssessResearchAndPlanNextSteps`).
- User authentication and authorization.
- Persistent storage of research sessions and reports (e.g., using Prisma and a database).
- Integration with actual legal document retrieval APIs.
- User ability to directly edit generated queries or select specific documents for analysis.
- Advanced error recovery and retry mechanisms within the orchestrator pipeline.
- Collaboration features.

This PRD provides a comprehensive technical foundation for developing LexiSynth. It emphasizes a decoupled architecture that should meet the goals of UI flexibility and server-side agent control.
