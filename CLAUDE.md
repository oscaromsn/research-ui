# CLAUDE.md

This file provides essential guidance to Claude Code (claude.ai/code) for working with the JurisConsulta repository. JurisConsulta is an AI-Powered Legal Research Assistant. Your goal is to produce optimized, secure, and maintainable code, adhering to the principles of clean code, robust architecture, and performance optimization. **Always follow these guidelines.**

## Project Overview

JurisConsulta is a Next.js 15 application designed to assist legal professionals by automating and enhancing the legal research process. It uses an AI-driven, multi-stage pipeline powered by BAML (Boundary AI Markup Language) and Large Language Models (LLMs). The core user experience involves submitting a legal question and receiving a progressively generated analysis and, ultimately, a draft report.

**Architecture**: Modern dual-service architecture with Next.js frontend and dedicated Elysia backend. Uses Server-Sent Events (SSE) for optimal streaming performance and Eden Treaty for type-safe API communication.

**Performance Requirements**: This application prioritizes a **low-latency user experience** with real-time streaming interfaces and responsive interactions. All features should feel instantaneous and provide immediate feedback.

## Tech Stack

- **TypeScript**: Strict mode enabled
- **bun**: Package manager (v1.1.0+). Use `bun` for all package operations.
### Frontend (Next.js)
- **Next.js 15**: App Router with React Server Components as default. Client Components only when necessary.
- **Jotai (v2.12.4+)**: Global client-side state management for data streamed from backend via SSE.
- **Tailwind CSS v4**: Styling, using Class Variance Authority (CVA) for component variants.
- **Shadcn/ui & Radix UI**: For UI component primitives
- **Eden Treaty**: Type-safe API client for communication with Elysia backend
- **EventSource API**: For consuming Server-Sent Events with ResilientEventSource wrapper

### Backend (Elysia)
- **Elysia.js**: High-performance backend server for API and AI orchestration
- **BAML (v0.88.0+)**: For all LLM interactions, schema definitions, and streaming capabilities
- **Server-Sent Events**: Granular streaming with circuit breakers and resilience patterns
- **Axios**: HTTP client for external API calls (Exa Search)

### Shared/Development
- **Zod (v3.25.7+)**: Shared type contracts and SSE event schema validation
- **TypeScript**: Strict mode enabled with end-to-end type safety
- **Vitest & React Testing Library**: unit/component tests.
- **Playwright**: E2E tests.
- **Biome**: Code quality, formatting, and linting

## Code Standards

**Core philosophy**: Analyze problems, break them down, plan, and implement iteratively. Use "ultrathink" for complex issues or finding optimal architecture approaches when not specified or clearly determinable. When implementing features you heavy relies on static validation (linting, formatters, typechecking, test coverage) to continuously validate you are on the right path and catch bugs as early as possible.

- **Clean, Readable, Maintainable**: Write self-explanatory, documented code with clear intent
- **SOLID Principles**: Follow Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Abstract common patterns into reusable functions/components preferring patterns, modularization, and composition.
- **Functional & Declarative**: Prefer immutability, pure functions, and declarative patterns
- **Type Safety**: **No `any` types**. Define explicit interfaces/types. Leverage BAML-generated types and Zod for non-LLM related. `unknown` with proper type guards when necessary.
- **Component-Driven & Responsive UI**: Build small, reusable components. Prioritize responsive design.
- **Clear Separation of Concerns**: Maintain distinct layers for UI (Next.js), client-side state (Jotai), SSE event handling (hooks), backend API (Elysia), and BAML AI logic.
- **Iterative Refinement**: Prefer fixing errors by rewriting/refining current abstractions over creating new ones unless necessary.
- **Cleanup**: Remove temporary files or scripts created during development.
- **Error Resolution**: When tasked with diagnostics and fixing errors, persist until all identified issues are resolved.

## Architecture Guidelines

### Directory Structure (Dual-Service Architecture)

**Frontend (Next.js)**:
- **`/__tests__/`**: Vitest test files, mirroring source structure
- **`/app/`**: Next.js App Router (pages and layouts only, no Server Actions)
- **`/components/`**: React UI components
  - **`/components/ui/`**: Generic UI primitives (Button, Modal)
  - **`/components/domain/`**: Feature-specific components (e.g., `guidance`, `legal-research`, `report-generation`)
  - **`/components/layout/`**: Layout components (e.g., `Header`)
- **`/lib/`**: Client-side utilities and hooks
  - **`/lib/hooks/`**: Custom React hooks, including `useResearchAgent.ts` (SSE-based)
  - **`/lib/state/`**: Jotai atom definitions, e.g., `researchAtoms.ts`
  - **`/lib/utils/`**: General utility functions and EventSource management
  - **`/lib/apiClient.ts`**: Eden Treaty client for type-safe API communication

**Backend (Elysia)**:
- **`/api/`**: Dedicated Elysia backend service
- **`/api/src/`**: Backend source code
- **`/api/src/routes/`**: API endpoints and SSE handlers (`research.ts`)
- **`/api/src/utils/`**: Pipeline stages and utilities (`pipelineStages.ts`)
- **`/api/baml_client/`**: **Auto-generated** BAML client (DO NOT EDIT MANUALLY)

**Shared Resources**:
- **`/baml_src/`**: All BAML source files (functions, types, tests)
  - **`/baml_src/functions/`**: BAML functions for each pipeline stage
  - **`/baml_src/types/`**: BAML type definitions
  - `clients.baml`, `core_loop.baml`, `generators.baml`
- **`/packages/shared-types/`**: Shared type definitions and Zod schemas
  - **`/packages/shared-types/src/baml-types.ts`**: Re-exported BAML types for frontend
  - **`/packages/shared-types/src/sse-events.ts`**: SSE event schemas and types
  - **`/packages/shared-types/src/api-types.ts`**: Eden Treaty type exports
- **`/e2e/`**: Playwright end-to-end tests
- **Root Configuration**: Config files for both services

### Auxiliary directories (support context)

Inside the `docs` directory there's some documents to support you in your tasks and provide better context. The main files are:

```
docs/planning/
    1.0. Project Requirements Document (PRD).md           # Project requirements
    2.0. Implementation plan overview (high-level description of phases 1 to 5).md              # General overview of the implementation plan
    2.1. Implementation plan - Phase 1.md       # Detailed guidance for phase 1 of the implementation plan
    2.2. Implementation plan - Phase 2.md       # Detailed guidance for phase 2 of the implementation plan
    2.3. Implementation plan - Phase 3.md       # Detailed guidance for phase 3 of the implementation plan
    2.4. Implementation plan - Phase 4.md       # Detailed guidance for phase 4 of the implementation plan
    2.5. Implementation plan - Phase 5.md       # Detailed guidance for phase 5 of the implementation plan
docs/references/
    4-BamlExample-2(blogpost).md                # Blogpost describing the implementation of a simple agent developed also using Next.js, BAML and Jotai for state management
    5-BamlExample-2(codebase).md                # The full codebase of the blogpost's project
docs/docs/
    exa_docs.md                                 # Full (extensive) documentation of the Exa Search API, the search framework used on this project (`lib/utils/exaSearchUtil`)
docs/logs/
    TESTING_README.md                           # Instructions for using the testing suite
    TESTING_SUMMARY.md                          # Instructions for using the testing suite
```

You always read the full planning files relevant for your taks at hand, while Uuse your search tools to lookup for pertinent information on the docs files without open them entirely.

### Key Architectural Pattern: "Dual-Service SSE Streaming"

1. **Elysia Backend Orchestrator (`/api/src/routes/research.ts`):**
   - **SSE Streaming Endpoint**: `/api/research/stream` (GET) accepts `legalQuestion` parameter
   - **Pipeline Management**: Orchestrates the entire multi-stage BAML pipeline server-side
   - **Granular Events**: Emits specific SSE events (`stage.change`, `document.analyzed`, `report.chunk`, etc.)
   - **BAML Streaming**: Consumes BAML streams (`b.stream.GenerateFinalLegalReport`) and pipes progressive content as SSE events
   - **Resilience**: Circuit breakers, request throttling, and error recovery mechanisms
   - **Type Safety**: Uses shared Zod schemas for all event payloads

2. **Client-Side SSE Hook (`lib/hooks/useResearchAgent.ts`):**
   - **ResilientEventSource**: Establishes robust SSE connection with automatic retry logic
   - **Event Processing**: Listens to typed SSE events and updates corresponding Jotai atoms
   - **Connection Management**: Handles connection lifecycle, errors, and reconnection
   - **Interface Compatibility**: Maintains same `startResearch()` and `abortResearch()` interface
   - **State Synchronization**: Real-time updates to Jotai atoms based on SSE events

3. **Type-Safe API Communication:**
   - **Eden Treaty Client**: (`lib/apiClient.ts`) provides type-safe API communication
   - **Shared Types**: (`packages/shared-types/`) ensures consistency between frontend and backend
   - **SSE Event Schemas**: Zod schemas validate all SSE payloads for runtime type safety
   - **BAML Type Re-exports**: Frontend accesses BAML types through shared package

4. **Client-Side State Management (Jotai - `lib/state/researchAtoms.ts`):**
   - **Event-Driven Updates**: Atoms updated directly by SSE event handlers in `useResearchAgent`
   - **Progressive Streaming**: Text fields (reports, summaries) progressively built from `report.chunk` events
   - **Real-time UI**: Components react instantly to SSE events via Jotai subscriptions
   - **Connection State**: Tracks SSE connection health and research pipeline status

### Naming Conventions

- **Files/Directories**: `kebab-case` (e.g., `evidence-analysis.tsx`, `research-atoms.ts`).
- **React Components**: `PascalCase` for component function names, `kebab-case` for filenames (e.g., `EvidenceAnalysis` in `evidence-analysis.tsx`).
- **Types/Interfaces**: `PascalCase` (e.g., `ResearchUpdate`, `ClientFinalReport`).
- **Functions/Variables/Props**: `camelCase`.
- **Hooks**: `useCamelCase` (e.g., `useResearchAgent`).
- **Constants**: `UPPER_SNAKE_CASE`.
- **BAML Functions/Types**: `PascalCase` (as per BAML convention).
- **Jotai Atoms**: `camelCaseAtom` (e.g., `researchStatusAtom`).

### TypeScript Implementation

- Use `import type` for type-only imports
- Prefer `interface` for extensible object types
- Use `type` for unions, intersections, and aliases
- Leverage type inference where obvious
- Document complex generic types

## React & Next.js Development

### React Best Practices

- **Functional Components Only**: No class components
- **TypeScript Props**: Always define explicit prop interfaces
- **Custom Hooks**: Extract reusable logic into hooks
- **Composition Over Inheritance**: Build with small, composable components
- **Memoization**: Use `React.memo` and `useMemo` judiciously for expensive operations
- **Effect Cleanup**: Always clean up subscriptions, timers, and listeners
- **Error Boundaries**: Implement error boundaries at strategic component levels

### Next.js Implementation (App Router)

- **RSC by Default**: Use React Server Components. Opt into Client Components (`"use client"`) only for interactivity (event listeners, client hooks, browser APIs).
- **SSE Streaming**: For all AI pipeline communication via Server-Sent Events. Main endpoint: `/api/research/stream`.
- **Data Flow**: Client Component -> `useResearchAgent` -> SSE Connection (`/api/research/stream`) -> BAML Pipeline -> Streams SSE Events -> `useResearchAgent` updates Jotai Atoms -> Client Components re-render.
- **Optimization**: `next/image`, `<Suspense>`, Next.js caching strategies (though less relevant for highly dynamic streaming content).

### Component Guidelines

1. **Single Responsibility**: Each component does one thing well
2. **Props Interface**: Always define TypeScript interfaces
3. **Composition**: Build complex UIs from simple components
4. **Primitives-first**: Leverage on available primitives when possible, install shadcn as necessary using `bunx shadcn@latest add [component-name]`
5. **Accessibility**: Include ARIA labels and keyboard support
6. **Testing**: Write tests alongside components

### State Management (Jotai)

- **Jotai**: Used for global state management, especially for frontend integration with BAML schema types.
- Global client-side state relevant to the research process is managed by Jotai atoms in `/lib/state/researchAtoms.ts`.
- These atoms store *client-friendly* data, updated by `useResearchAgent.ts`.
- UI components use `useAtomValue` to read state and `useSetAtom` only if directly manipulating non-agent-driven state (rare for this app's core flow). `useResearchAgent` handles most state writes.
- Use derived atoms for computed state if needed.
- **Form State**: React Hook Form is recommended, potentially with Jotai for inter-component form state if needed.

## UI/UX Implementation

- **Tailwind CSS v4**: Utility-first styling with CVA
- **CSS Variables**: Define in `globals.css` for theming
- **Shadcn/ui & Radix UI Primitives**: Use as base, customize as needed (install via bun)
- **Responsive Design**: Ensure usability across screen sizes using Tailwind's modifiers.
- **Accessibility (a11y)**: Semantic HTML, keyboard navigation, ARIA attributes, color contrast.
- **Streaming Feedback**: UI must clearly indicate loading and streaming progress. Text should appear progressively. Lifecycle visualization should update.

## Backend, API, and Database

- **BAML Client**: The BAML-generated client (`baml_client/`) is the sole interface to LLMs. The server-side orchestrator uses `b` (the async BAML client instance).
- **No Direct Database for v1**: The PRD implies no persistent storage of research sessions for v1 (beyond Jotai's potential localStorage for client state). If DB interactions were added, Prisma would be used.
- **External APIs (Document Retrieval)**: The `fetchDocumentsFromQueries` function in the orchestrator is a placeholder for calling an external search API (e.g., Exa). This call would use Axios or `fetch`.

## Security Guidelines (PRD NFR4)

1. **Environment Variables**: LLM API keys (`GOOGLE_API_KEY`, `OPENAI_API_KEY`, etc.) are server-side only, accessed via `process.env` within the BAML runtime or Server Actions. Never expose to client.
2. **Input Validation**: The `legalQuestion` parameter to the SSE endpoint should be sanitized/validated on the Elysia backend before being passed to BAML functions.
3. **Server-Side Logic**: All BAML pipeline execution and agentic decision-making (via `AssessResearchAndPlanNextSteps`) is strictly server-side within the orchestrator. The client receives only curated `ResearchUpdate` streams.
4. **Data Exposure**: Be mindful of what data is included in `ResearchUpdate.data` payloads. Send only summarized, client-friendly information necessary for display, not raw, verbose BAML objects.

## Error Handling & Validation

1. **Orchestrator Errors**: The server-side orchestrator must `try...catch` BAML calls and send `ResearchUpdate` of `type: "ERROR"` down the stream. It must also ensure the stream is closed properly in a `finally` block.
2. **`useResearchAgent` Hook Errors**: This hook must handle SSE connection errors, event parsing failures, and server-sent error events. It updates `researchStatusAtom.error` accordingly.
3. **UI Error Display**: Components should read `researchStatusAtom.error` and display user-friendly error messages.
4. **Zod**: Primarily for environment variable validation. BAML handles typing for LLM I/O.

## Testing Architecture: Conflict-Free Development

### 🎯 Unified Testing Architecture

JurisConsulta employs a **battle-tested architecture** that eliminates the "test-TypeScript conflict cycle" where fixing tests breaks TypeScript and vice versa.

#### Core Architectural Principles

1. **Single Source of Truth Configuration**: Unified `tsconfig.json` prevents competing setups
2. **Type-Preserving Mock Architecture**: Mocks maintain TypeScript type information throughout test execution
3. **Unified DOM Environment**: Centralized Vitest-managed DOM setup eliminates initialization conflicts
4. **Path Resolution Consistency**: Synchronized path mappings across all tools

#### Type-Safe Mock Patterns

```typescript
// ✅ Recommended: Type-Preserving Mock Interface
type MockAxiosInstance = {
  post: ReturnType<typeof vi.fn> & {
    mockResolvedValueOnce: ReturnType<typeof vi.fn>['mockResolvedValueOnce'];
  };
};

vi.mock("axios", () => {
  const mockAxios: MockAxiosInstance = {
    post: vi.fn() as MockAxiosInstance['post'],
    get: vi.fn(),
    isAxiosError: vi.fn(),
  };
  return { __esModule: true, default: mockAxios };
});

// ❌ Anti-Pattern: Type-Erasing Mocks
vi.mock("axios", () => ({ default: vi.fn() })); // Loses type info
```

#### Unified Configuration Pattern

```json
// tsconfig.json - Single source of truth
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom", "node"],
    "paths": {
      "@/*": ["./*"],      
      "@atoms/*": ["lib/state/atoms/*"],
      "@tests/*": ["__tests__/*"]
    }
  }
}
```

### Testing Process Workflow

1. **BAML Tests (`.test.baml` files):**
   - Write for every BAML function covering various inputs and asserting output structure/key values.
   - Run with `bun baml:test` to run all tests.
   - Run with `bun baml:this` to run a specific test. Adopt the following:
     - "FunctionName::TestName" will match the specific test "TestName" in the function "FunctionName"
     - "FunctionName::" will run all tests in the function "FunctionName"
     - "::TestName" will run the test "TestName" in any function
     - "Get*::*Bar" will match any functions that start with "Get" and have a test that ends with "Bar"
     - "Foo::" -i "Bar::" will run all tests in the functions "Foo" and "Bar"

2. **Backend Elysia Tests (Vitest):**
   - Unit test the `/api/research/stream` SSE endpoint. Mock the BAML client (`b`) using type-preserving patterns. Assert that the correct sequence of SSE events is emitted.

3. **Client-Side Hook Tests (Vitest + RTL):**
   - Unit test `useResearchAgent`. Mock the `ResilientEventSource` using type-safe interfaces. Provide mock SSE events and assert that Jotai atoms are updated correctly.

4. **Component Tests (RTL):**
   - Test UI components that consume Jotai atoms. Use centralized DOM setup via `setupTests.ts`. Provide mock atom states and verify rendering using type-safe patterns.

5. **E2E Testing using Playwright:** Crucial for verifying the full streaming experience and pipeline flow when a feature is fully implemented.

### Commands for Verification (Harmonious Execution)

```bash
# Both systems must pass together - no conflicts
bun run typecheck    # TypeScript compilation ✅
bun run test         # Test execution ✅

# Additional validation
bun baml:generate    # Regenerate BAML client after baml_src changes
bun check           # Linting & Formatting  
bun run build       # Build (ensures app compiles)
bun test:coverage   # Test coverage analysis
```

### Conflict Prevention Guidelines

1. **Configuration Changes**: Always update the single `tsconfig.json`
2. **Mock Implementation**: Use type-preserving patterns with proper interfaces
3. **DOM Testing**: Rely on centralized `setupTests.ts` configuration
4. **Path Updates**: Keep `vitest.config.ts` and `tsconfig.json` paths synchronized
5. **Schema Changes**: Update both implementation and test mocks together

For detailed patterns and troubleshooting, see [docs/tooling/TESTING.md](./docs/tooling/TESTING.md).

## Development Workflow (TDD Preferred)

1. **BAML Changes**: Define/modify BAML function/type -> Write `.test.baml` -> Run BAML tests -> `bun baml:test` for all tests or `bun baml:test -i {$FunctionName}::` to run all tests tests for the function `$FunctionName`.
2. **Backend Changes**: Define expected SSE event sequence for a new feature/stage -> Write Vitest unit test for Elysia endpoint mocking BAML calls -> Implement backend streaming logic to pass test.
3. **Hook Changes**: Define how Jotai atoms should change for new SSE event types/data -> Write Vitest unit test for `useResearchAgent` mocking `ResilientEventSource` -> Implement hook logic.
4. **UI Component Changes**: Define how UI should look/behave for new Jotai state -> Write RTL component test -> Implement component.

## Development Environment Setup

### Dual-Service Development

JurisConsulta requires both frontend and backend services running concurrently during development.

**Prerequisites:**
1. Generate BAML client (if `baml_src` has changed): `bun baml:generate`
2. Ensure all dependencies are installed: `bun install`

**Running Both Services:**
```bash
# Start both services concurrently (recommended)
bun dev

# This automatically starts:
# - Next.js Frontend: http://localhost:3000
# - Elysia Backend: http://localhost:3001
# - API Documentation: http://localhost:3001/swagger
```

**Running Services Separately (for debugging):**
```bash
# Terminal 1: Start the backend
bun run dev:api

# Terminal 2: Start the frontend
bun run dev:next
```

**Service Health Verification:**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend Health: [http://localhost:3001/api/health](http://localhost:3001/api/health)
- API Documentation: [http://localhost:3001/swagger](http://localhost:3001/swagger)

### Development Workflow Benefits

The dual-service architecture provides:
- **Independent Development**: Frontend and backend can be developed separately
- **Hot Reloading**: Both services support hot reloading for rapid development
- **Type Safety**: Shared types ensure end-to-end type safety across services
- **API Documentation**: Auto-generated Swagger docs for backend endpoints
- **Real-time Testing**: SSE streaming can be tested in real-time via browser DevTools

## Post-Development Checklist

Before considering a feature complete ensure that:

1. ✅ BAML code generated & working.
2. ✅ All tests pass (`bun run test`)
3. ✅ Test coverage meets guidelines (`bun test:coverage`)
4. ✅ Type checking passes (`bun typecheck`)
5. ✅ Linting passes (`bun check`)
6. ✅ Build succeeds (`bun build`).
7. ✅ No runtime errors in the console
8. ✅ Bundle size impact is reasonable
9. ✅ Code adheres to these guidelines.
10. ✅ Documentation updated if needed.

Remember, every line you write is an example of clean, scalable and maintainable code and you heavy relies on static validation (linting, formatters, typechecking, test coverage) to continuously validate you are on the right path and catch bugs as early as possible.
