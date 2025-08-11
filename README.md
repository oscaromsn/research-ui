# JurisConsulta - AI-Powered Legal Research Assistant

JurisConsulta is a cutting-edge Next.js 15 application designed to streamline
and enhance the legal research process. By leveraging the power of Large
Language Models (LLMs) through BAML (Boundary AI Markup Language), JurisConsulta
provides legal professionals with an intelligent assistant capable of generating
search queries, analyzing documents, synthesizing findings, and drafting initial
reports—all with a real-time, streaming user experience.

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

JurisConsulta guides users through a multi-stage legal research pipeline:

1. **Query Generation:** Transforms a natural language legal question into
   effective search queries.
2. **Document Retrieval:** Fetches relevant legal documents from external
   sources (e.g., Exa Search).
3. **Document Analysis:** Extracts key information, arguments, and entities from
   each retrieved document.
4. **Synthesis:** Consolidates insights from multiple documents into coherent
   themes and summaries.
5. **Assessment & Iteration:** Evaluates research sufficiency and plans next
   steps, potentially iterating on previous stages.
6. **Report Generation:** Drafts a structured legal report based on the
   synthesized findings.

The application emphasizes a server-first approach using Next.js App Router with
React Server Components (RSC) and leverages client-side state management with
Jotai for a dynamic, streaming UI.

## Core Features

* **AI-Powered Research Pipeline:** Automates key stages of legal research.
* **BAML Integration:** Utilizes BAML for defining LLM interactions, schemas,
  and generating type-safe clients.
* **Streaming UI:** Provides real-time updates as research progresses and report
  content is generated.
* **Interactive Guidance:** Allows users to input legal questions and monitor
  the research lifecycle.
* **Evidence Analysis:** Displays analyzed documents with relevance scores,
  summaries, key arguments, and extracted entities.
* **Synthesis Studio:** Presents synthesized topics, unanswered questions, and
  AI reasoning.
* **Report Drafter:** Allows users to view and edit the progressively generated
  legal report.
* **Modular Component Architecture:** Built with reusable React components.

## Tech Stack

### Frontend (Next.js)
* **Framework:** Next.js 15 (App Router, RSC)
* **Language:** TypeScript (strict mode)
* **State Management:** Jotai v2.12.4+
* **Styling:** Tailwind CSS v4, Class Variance Authority (CVA)
* **UI Primitives:** Shadcn/ui, Radix UI
* **API Client:** Eden Treaty (type-safe API communication)
* **Streaming:** EventSource API with ResilientEventSource wrapper

### Backend (Elysia)
* **Framework:** Elysia.js (high-performance backend)
* **AI/LLM Layer:** BAML (Boundary AI Markup Language) v0.89.0+
* **Streaming:** Server-Sent Events (SSE) with granular event types
* **HTTP Client:** Axios (for external APIs like Exa Search)
* **Resilience:** Circuit breakers, request throttling, retry logic
* **Documentation:** Auto-generated OpenAPI/Swagger

### Shared/Development
* **Package Manager:** bun (v1.1.0+)
* **Schema Validation:** Zod v3.25.7+ (shared type contracts)
* **Testing:**
    * BAML Native Tests
    * Vitest & React Testing Library (Unit/Component/Integration)
    * Playwright (End-to-End)
* **Code Quality:** Biome (formatting and linting)
* **DevOps & Tooling:** Husky, lint-staged, commitlint, Knip, Dependency-Cruiser
* **Development:** Concurrent development with hot reloading

## Architecture

JurisConsulta implements a **modern dual-service architecture** with dedicated frontend and backend services communicating via type-safe APIs and Server-Sent Events (SSE) for optimal streaming performance.

### System Architecture

```
┌─────────────────────────────────┐    SSE Stream    ┌──────────────────────────────────┐
│         Next.js Frontend        │ ◄──────────────► │       Elysia Backend             │
│          (Port 3000)            │                  │        (Port 3001)               │
│                                 │                  │                                  │
│  ┌─────────────────────────────┐ │                  │ ┌──────────────────────────────┐ │
│  │    React Components         │ │                  │ │     BAML AI Pipeline         │ │
│  │  - Guidance Strategy        │ │                  │ │  - Query Generation          │ │
│  │  - Evidence Analysis        │ │                  │ │  - Document Analysis         │ │
│  │  - Report Generation        │ │                  │ │  - Synthesis & Assessment    │ │
│  └─────────────────────────────┘ │                  │ │  - Report Streaming          │ │
│                                 │                  │ └──────────────────────────────┘ │
│  ┌─────────────────────────────┐ │    Eden Treaty   │ ┌──────────────────────────────┐ │
│  │    useResearchAgent Hook    │ │ ◄──────────────► │ │      RESTful Endpoints       │ │
│  │  - ResilientEventSource     │ │                  │ │  - /api/research/complete    │ │
│  │  - SSE Event Processing     │ │                  │ │  - /api/research/stream      │ │
│  │  - Jotai State Management   │ │                  │ │  - /api/health               │ │
│  └─────────────────────────────┘ │                  │ └──────────────────────────────┘ │
│                                 │                  │                                  │
│  ┌─────────────────────────────┐ │                  │ ┌──────────────────────────────┐ │
│  │      Shared Types           │ │ ◄──────────────► │ │     Resilience Layer         │ │
│  │  - SSE Event Schemas        │ │                  │ │  - Circuit Breakers          │ │
│  │  - API Request/Response     │ │                  │ │  - Request Throttling        │ │
│  │  - BAML Type Definitions    │ │                  │ │  - Error Recovery            │ │
│  └─────────────────────────────┘ │                  │ └──────────────────────────────┘ │
└─────────────────────────────────┘                  └──────────────────────────────────┘
```

### Directory Structure

* **Frontend (Next.js)**:
  * `/__mocks__/`: Mock implementations for testing
  * `/__tests__/`: Vitest tests, mirroring source structure
  * `/app/`: Next.js App Router (pages and layouts only)
  * `/components/`: React UI components (`ui/`, `domain/`, `layout/`)
  * `/lib/`: Client utilities, hooks (`lib/hooks/`), Jotai atoms (`lib/state/`)

* **Backend (Elysia)**:
  * `/api/`: Dedicated Elysia backend service
  * `/api/src/`: Backend source code
  * `/api/src/routes/`: API endpoints and SSE handlers
  * `/api/src/utils/`: Pipeline stages and utilities
  * `/api/baml_client/`: **Auto-generated** BAML client (DO NOT EDIT)

* **Shared Resources**:
  * `/baml_src/`: All BAML source files (functions, types, tests)
  * `/packages/shared-types/`: Shared type definitions and Zod schemas
  * `/e2e/`: Playwright end-to-end tests
  * (Root): Configuration files for both services

### Streaming Research Pipeline

1. **User Initiates Research:** User submits legal question via the UI
2. **Frontend Hook:** `useResearchAgent` establishes ResilientEventSource connection
3. **Backend Orchestration:** Elysia backend (`/api/research/stream`) manages the BAML pipeline
   * Calls BAML streaming functions for each stage
   * Emits granular SSE events: `stage.change`, `document.analyzed`, `report.chunk`
   * Handles errors with circuit breakers and retry logic
4. **Real-time Streaming:** SSE events stream to frontend with type-safe schemas
5. **State Management:** Jotai atoms update based on incoming SSE events
6. **UI Reactivity:** Components re-render in real-time showing progress and results

### Key Architectural Benefits

* **🚀 Performance**: Granular SSE streaming for real-time UI updates
* **🛡️ Reliability**: Circuit breakers, request throttling, and automatic retry
* **📊 Scalability**: Independent scaling of frontend and backend services  
* **🔧 Developer Experience**: End-to-end type safety with shared contracts
* **⚡ Streaming**: Progressive content delivery without buffering delays

### Testing Architecture: Conflict-Free Development

JurisConsulta employs a **unified testing architecture** that eliminates the common "test-TypeScript conflict cycle" where fixing tests breaks TypeScript compilation and vice versa.

#### Core Architectural Principles

1. **Single Source of Truth Configuration**: One unified TypeScript configuration (`tsconfig.json`) prevents competing setups
2. **Type-Preserving Mock Architecture**: Mocks maintain TypeScript type information throughout test execution
3. **Unified DOM Environment**: Single Vitest-managed DOM setup eliminates initialization conflicts
4. **Path Resolution Consistency**: Synchronized path mappings across all tools (Vitest, TypeScript, Next.js)

#### Key Benefits

- **No More Conflict Cycles**: Changes in tests don't break TypeScript and vice versa
- **Type Safety Preserved**: Full TypeScript support throughout test execution
- **Consistent Development**: Same patterns work across all test scenarios
- **Fast Feedback**: Both compilation and testing provide immediate, harmonious feedback

For detailed patterns and implementation guidance, see [docs/tooling/TESTING.md](./docs/tooling/TESTING.md).

## Getting Started

### Prerequisites

* Node.js (v18.17 or later recommended for Next.js 15)
* bun (v1.1.0 or later)
* Access to LLM APIs (e.g., OpenAI, Google AI/Vertex AI, Anthropic) and an Exa
  Search API key.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd JurisConsulta
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Initialize Husky Git hooks:**
   ```bash
   bun prepare
   ```

### Environment Variables

Copy the `.env.example` file (if provided, otherwise create one) to `.env.local`
and populate it with your API keys and other necessary environment variables.

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

A `.env.test` file is also used for loading test-specific environment
variables (see `vitest.config.ts`).

### Running the Development Server

JurisConsulta requires both frontend and backend services to run concurrently during development.

1. **Generate BAML client (if `baml_src` has changed or first time setup):**
   ```bash
   bun baml:generate
   ```

2. **Start both services concurrently:**
   ```bash
   bun dev
   ```
   This automatically starts:
   - **Next.js Frontend**: [http://localhost:3000](http://localhost:3000) 
   - **Elysia Backend**: [http://localhost:3001](http://localhost:3001)
   - **API Documentation**: [http://localhost:3001/swagger](http://localhost:3001/swagger)

   **Alternative - Run services separately:**
   ```bash
   # Terminal 1: Start the backend
   bun run dev:api

   # Terminal 2: Start the frontend  
   bun run dev:next
   ```

3. **Verify both services are running:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)
   - API Docs: [http://localhost:3001/swagger](http://localhost:3001/swagger)

### Development Workflow

* **Frontend Development**: Work on UI components, hooks, and state management
* **Backend Development**: Modify BAML functions, API endpoints, and streaming logic
* **Hot Reloading**: Both services support hot reloading for rapid development
* **Type Safety**: Shared types ensure end-to-end type safety across services

## Running Tests

JurisConsulta uses a comprehensive, multi-layered testing approach designed for
both speed and reliability.

📖 **For detailed testing guidance,
see [docs/TESTING.md](./docs/tooling/TESTING.md)**

### Quick Start

**For Development (Fast):**

```bash
# Run unit tests only (recommended for daily development)
bun run test

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

| Test Type             | Command                | Speed    | Requirements  |
|-----------------------|------------------------|----------|---------------|
| **Unit Tests**        | `bun test:unit`        | ~30-60s  | None          |
| **Integration Tests** | `bun test:integration` | ~5-10min | API Keys*     |
| **BAML/AI Tests**     | `bun test:baml`        | ~2-5min  | AI API Keys*  |
| **E2E Tests**         | `bun test:e2e`         | ~3-10min | Browser setup |

*\*API Keys: `GOOGLE_API_KEY`, `EXA_API_KEY` required for integration and BAML
tests*

### Testing Architecture

```
📁 __tests__/
├── 📁 actions/          # Legacy action tests (deprecated)
├── 📁 components/       # React Component tests  
├── 📁 integration/      # Real API tests (SLOW)
├── 📁 lib/             # Hook & utility tests
└── 📁 utils/           # Test helpers

📁 api/src/__tests__/   # Backend Elysia tests
📁 e2e/                 # Playwright E2E tests  
📁 baml_src/            # AI function tests
```

For complete testing documentation, troubleshooting, and best practices,
see [docs/TESTING.md](./docs/tooling/TESTING.md).

## Development Workflow

### BAML Development

1. Define or modify BAML functions and types in the `baml_src/` directory.
2. Write corresponding tests in `.test.baml` files.
3. Run BAML tests: `bun baml:test`.
4. If tests pass and changes are made, regenerate the BAML client:
   `bun baml:generate`. This updates the `baml_client/` directory.

### Development Workflow

#### Backend Development (Elysia)

1. **BAML Functions (`baml_src/`):** Define or update AI pipeline functions and types
2. **API Endpoints (`api/src/routes/`):** Implement RESTful and SSE streaming endpoints
3. **Pipeline Stages (`api/src/utils/`):** Modify research pipeline logic and utilities
4. **Testing:** Write comprehensive backend tests with type-safe mocks
5. **Generate Types:** Run `bun baml:generate` to update shared client types

#### Frontend Development (Next.js)

1. **Client Hooks (`lib/hooks/`):** Modify `useResearchAgent.ts` to handle SSE events
   and update Jotai atoms based on streaming backend responses
2. **State Management (`lib/state/`):** Define or update Jotai atoms in `researchAtoms.ts`
   to store client-side state from SSE events
3. **UI Components (`components/`):** Create React components that consume Jotai state
   and provide real-time updates during research workflows  
4. **API Integration:** Use Eden Treaty for type-safe API calls and ResilientEventSource for SSE
5. **Testing:** Write Vitest tests for components and hooks with proper SSE mocking

#### Shared Development

1. **Type Contracts (`packages/shared-types/`):** Define Zod schemas for SSE events and API contracts
2. **E2E Testing:** Use Playwright to test complete user workflows across both services
3. **Integration Testing:** Verify frontend-backend communication and streaming functionality

### Code Quality & Conventions

* **Formatting and linting:** Code is automatically formatted and linted by
  Biome. Run `bun check` to automatically format, lint and fix issues. manually.
* **Commit Messages:** Follow Conventional Commits. `bun commit` can be used for
  guided commits (via `git-cz`), and `commitlint` (triggered by Husky) enforces
  this.
* **Type Checking:** Run `bun typecheck` regularly.
* **Husky Hooks:** Pre-commit and pre-push hooks are configured in `.husky/` to
  run lint-staged, type checks, etc.

## Key Scripts

(Refer to `package.json` for a full list)

* `bun dev`: Starts the Next.js development server.
* `bun run build`: Builds the application for production.
* `bun start`: Starts the production server.
* `bun check`: Formats and lints code using Biome.
* `bun typecheck`: Runs TypeScript compiler checks.
* `bun run test`: Runs all Vitest unit/component tests.
* `bun test:e2e`: Runs all Playwright E2E tests.
* `bun baml:generate`: Regenerates the `baml_client/` directory.
* `bun baml:test`: Runs all BAML native tests.
* `bun validate`: Runs a comprehensive suite of checks (typecheck, lint, tests,
  format, knip, typecov, deps).
* `bun knip`: Finds unused files, dependencies, and exports.
* `bun deps:check`: Checks for dependency issues using dependency-cruiser.
