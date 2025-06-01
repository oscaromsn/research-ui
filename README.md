# LexiSynth - AI-Powered Legal Research Assistant

LexiSynth is a cutting-edge Next.js 15 application designed to streamline and enhance the legal research process. By leveraging the power of Large Language Models (LLMs) through BAML (Boundary AI Markup Language), LexiSynth provides legal professionals with an intelligent assistant capable of generating search queries, analyzing documents, synthesizing findings, and drafting initial reports—all with a real-time, streaming user experience.

## Table of Contents

- [Project Overview](#project-overview)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Directory Structure](#directory-structure)
  - [Research Agent Orchestrator Pattern](#research-agent-orchestrator-pattern)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Development Server](#running-the-development-server)
- [Running Tests](#running-tests)
  - [BAML Tests](#baml-tests)
  - [Unit/Component Tests (Vitest)](#unitcomponent-tests-vitest)
  - [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
- [Development Workflow](#development-workflow)
  - [BAML Development](#baml-development)
  - [Frontend Development](#frontend-development)
  - [Code Quality & Conventions](#code-quality--conventions)
- [Key Scripts](#key-scripts)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

LexiSynth guides users through a multi-stage legal research pipeline:

1.  **Query Generation:** Transforms a natural language legal question into effective search queries.
2.  **Document Retrieval:** Fetches relevant legal documents from external sources (e.g., Exa Search).
3.  **Document Analysis:** Extracts key information, arguments, and entities from each retrieved document.
4.  **Synthesis:** Consolidates insights from multiple documents into coherent themes and summaries.
5.  **Assessment & Iteration:** Evaluates research sufficiency and plans next steps, potentially iterating on previous stages.
6.  **Report Generation:** Drafts a structured legal report based on the synthesized findings.

The application emphasizes a server-first approach using Next.js App Router with React Server Components (RSC) and leverages client-side state management with Jotai for a dynamic, streaming UI.

## Core Features

*   **AI-Powered Research Pipeline:** Automates key stages of legal research.
*   **BAML Integration:** Utilizes BAML for defining LLM interactions, schemas, and generating type-safe clients.
*   **Streaming UI:** Provides real-time updates as research progresses and report content is generated.
*   **Interactive Guidance:** Allows users to input legal questions and monitor the research lifecycle.
*   **Evidence Analysis:** Displays analyzed documents with relevance scores, summaries, key arguments, and extracted entities.
*   **Synthesis Studio:** Presents synthesized topics, unanswered questions, and AI reasoning.
*   **Report Drafter:** Allows users to view and edit the progressively generated legal report.
*   **Modular Component Architecture:** Built with reusable React components.

## Tech Stack

*   **Framework:** Next.js 15 (App Router, RSC, Server Actions)
*   **Language:** TypeScript (strict mode)
*   **Package Manager:** bun (v1.1.0+)
*   **AI/LLM Layer:** BAML (Boundary AI Markup Language) v0.89.0+
*   **State Management (Client):** Jotai v2.12.4+
*   **Styling:** Tailwind CSS v4, Class Variance Authority (CVA)
*   **UI Primitives:** Shadcn/ui, Radix UI
*   **HTTP Client:** Axios (for external APIs like Exa Search)
*   **Schema Validation (Non-LLM):** Zod v3.25.7+
*   **Testing:**
    *   BAML Native Tests
    *   Vitest & React Testing Library (Unit/Component/Integration)
    *   Playwright (End-to-End)
*   **Code Quality:** Biome (formatting) ESLint (linting)
*   **DevOps & Tooling:** Husky, lint-staged, commitlint, Knip, Dependency-Cruiser

## Architecture

LexiSynth follows a well-defined architecture centered around the "Research Agent Orchestrator" pattern.

### Directory Structure

A brief overview of key directories:

*   `/__mocks__/`: Mock implementations for testing.
*   `/__tests__/`: Vitest tests, mirroring the source structure.
*   `/app/`: Next.js App Router, including Server Actions (`app/actions/`).
*   `/baml_src/`: All BAML source files (functions, types, clients, tests).
*   `/baml_client/`: **Auto-generated** BAML client code (DO NOT EDIT MANUALLY).
*   `/components/`: React UI components, categorized into `ui/`, `domain/`, and `layout/`.
*   `/lib/`: Shared utilities, custom React hooks (`lib/hooks/`), Zod schemas (`lib/schemas/`), and Jotai atoms (`lib/state/`).
*   `/e2e/`: Playwright end-to-end tests.
*   (Root): Configuration files for Next.js, TypeScript, ESLint, Biome, Vitest, Playwright, Husky, etc.

### Research Agent Orchestrator Pattern

1.  **Client Initiates:** User submits a legal question via the UI.
2.  **Hook Invokes Action:** `useResearchAgent` (client-side hook) calls `conductResearch` (Server Action).
3.  **Server Orchestrates:** `conductResearch` in `app/actions/researchAgentOrchestrator.ts` manages the BAML pipeline server-side.
    *   Calls BAML functions for each research stage (query generation, analysis, synthesis, etc.).
    *   Streams `ResearchUpdate` objects (newline-separated JSON) to the client, containing stage progress, data, logs, or errors.
4.  **Hook Processes Stream:** `useResearchAgent` consumes the stream.
5.  **State Updates:** Jotai atoms in `lib/state/researchAtoms.ts` are updated based on `ResearchUpdate` payloads.
6.  **UI Reacts:** Components subscribed to Jotai atoms re-render, displaying live progress and results.

This pattern ensures that complex AI logic remains server-side, while the client receives structured, streamable updates for a responsive UI.

## Getting Started

### Prerequisites

*   Node.js (v18.17 or later recommended for Next.js 15)
*   bun (v1.1.0 or later)
*   Access to LLM APIs (e.g., OpenAI, Google AI/Vertex AI, Anthropic) and an Exa Search API key.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd lexisynth
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Initialize Husky Git hooks:**
    ```bash
    bun prepare
    ```

### Environment Variables

Copy the `.env.example` file (if provided, otherwise create one) to `.env.local` and populate it with your API keys and other necessary environment variables.

Example `.env.local`:
```env
# LLM Provider API Keys
OPENAI_API_KEY=sk-your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Exa Search API Key (for document retrieval)
EXA_API_KEY=your_exa_api_key

# BAML Observability (Optional - sign up at Boundary Studio: https://app.boundaryml.com)
# BOUNDARY_PROJECT_ID=your_project_uuid
# BOUNDARY_SECRET=your_token

# Next.js specific (usually not needed unless customizing)
# NODE_ENV=development
```
A `.env.test` file is also used for loading test-specific environment variables (see `vitest.config.ts`).

### Running the Development Server

1.  **Generate BAML client (if `baml_src` has changed or first time setup):**
    ```bash
    bun baml:generate
    ```

2.  **Start the Next.js development server:**
    ```bash
    bun dev
    ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Running Tests

LexiSynth uses a comprehensive, multi-layered testing approach designed for both speed and reliability. 

📖 **For detailed testing guidance, see [docs/TESTING.md](./docs/tooling/TESTING.md)**

### Quick Start

**For Development (Fast):**
```bash
# Run unit tests only (recommended for daily development)
bun test

# Watch mode for active development
bun test:watch
```

**For Full Validation:**
```bash
# Run all test types (unit + integration + e2e)
bun test:all

# Complete CI validation suite
bun ci
```

### Test Categories

| Test Type | Command | Speed | Requirements |
|-----------|---------|-------|--------------|
| **Unit Tests** | `bun test:unit` | ~30-60s | None |
| **Integration Tests** | `bun test:integration` | ~5-10min | API Keys* |
| **BAML/AI Tests** | `bun test:baml` | ~2-5min | AI API Keys* |
| **E2E Tests** | `bun test:e2e` | ~3-10min | Browser setup |

*\*API Keys: `GOOGLE_API_KEY`, `EXA_API_KEY` required for integration and BAML tests*

### Testing Architecture

```
📁 __tests__/
├── 📁 actions/          # Server Action tests
├── 📁 components/       # React Component tests  
├── 📁 integration/      # Real API tests (SLOW)
├── 📁 lib/             # Hook & utility tests
└── 📁 utils/           # Test helpers

📁 e2e/                 # Playwright E2E tests
📁 baml_src/            # AI function tests
```

For complete testing documentation, troubleshooting, and best practices, see [docs/TESTING.md](./docs/tooling/TESTING.md).
## Development Workflow

### BAML Development

1.  Define or modify BAML functions and types in the `baml_src/` directory.
2.  Write corresponding tests in `.test.baml` files.
3.  Run BAML tests: `bun baml:test`.
4.  If tests pass and changes are made, regenerate the BAML client: `bun baml:generate`. This updates the `baml_client/` directory.

### Frontend Development

1.  **Server Actions (`app/actions/`):** Implement or update server-side orchestration logic.
2.  **Client Hooks (`lib/hooks/`):** Modify `useResearchAgent.ts` to handle new `ResearchUpdate` types or data structures, and to update Jotai atoms.
3.  **State (`lib/state/`):** Define or update Jotai atoms in `researchAtoms.ts` to store client-side state.
4.  **UI Components (`components/`):** Create or modify React components to consume Jotai state (using `useAtomValue`) and interact with client hooks.
5.  **Testing:** Write Vitest tests for hooks and components.

### Code Quality & Conventions

*   **Formatting:** Code is automatically formatted by Biome (and ESLint for certain aspects). Run `bun format` to format manually.
*   **Linting:** ESLint is configured for comprehensive linting. Run `bun lint` or `bun lint:fix`.
*   **Commit Messages:** Follow Conventional Commits. `bun commit` can be used for guided commits (via `git-cz`), and `commitlint` (triggered by Husky) enforces this.
*   **Type Checking:** Run `bun typecheck` regularly.
*   **Husky Hooks:** Pre-commit and pre-push hooks are configured in `.husky/` to run lint-staged, type checks, etc.

## Key Scripts

(Refer to `package.json` for a full list)

*   `bun dev`: Starts the Next.js development server.
*   `bun build`: Builds the application for production.
*   `bun start`: Starts the production server.
*   `bun format`: Formats code using Biome.
*   `bun lint`: Lints code using ESLint.
*   `bun typecheck`: Runs TypeScript compiler checks.
*   `bun test`: Runs all Vitest unit/component tests.
*   `bun test:e2e`: Runs all Playwright E2E tests.
*   `bun baml:generate`: Regenerates the `baml_client/` directory.
*   `bun baml:test`: Runs all BAML native tests.
*   `bun validate`: Runs a comprehensive suite of checks (typecheck, lint, tests, format, knip, typecov, deps).
*   `bun knip`: Finds unused files, dependencies, and exports.
*   `bun deps:check`: Checks for dependency issues using dependency-cruiser.
