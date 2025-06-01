# Contributing to LexiSynth

To ensure a smooth and effective collaboration, please review these guidelines.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your Development Environment](#setting-up-your-development-environment)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Making Changes](#making-changes)
  - [BAML Development](#baml-development)
  - [TypeScript & React Development](#typescript--react-development)
- [Coding Standards & Conventions](#coding-standards--conventions)
  - [General Principles](#general-principles)
  - [File & Directory Naming](#file--directory-naming)
  - [Component Design](#component-design)
  - [State Management (Jotai)](#state-management-jotai)
  - [Type Safety](#type-safety)
- [Testing](#testing)
  - [BAML Tests](#baml-tests)
  - [Unit & Component Tests (Vitest)](#unit--component-tests-vitest)
  - [End-to-End Tests (Playwright)](#end-to-end-tests-playwright)
  - [Running All Tests](#running-all-tests)
- [Code Quality & Linting](#code-quality--linting)
  - [Formatting](#formatting)
  - [Linting](#linting)
  - [Type Checking](#type-checking)
  - [Dead Code & Dependency Checks](#dead-code--dependency-checks)
- [Commit Messages](#commit-messages)
- [Submitting Pull Requests](#submitting-pull-requests)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Architectural Guidance](#architectural-guidance)

## Getting Started

### Prerequisites

Ensure you have the following installed:

*   Node.js (v18.17 or later)
*   bun (v1.1.0 or later)
*   Git
*   Access to LLM APIs (OpenAI, Google AI/Vertex AI, Anthropic) and an Exa Search API key for full functionality.

### Setting Up Your Development Environment

1.  **Fork the repository** on GitHub.
2.  **Clone your fork** locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/lexisynth.git
    cd lexisynth
    ```
3.  **Install dependencies:**
    ```bash
    bun install
    ```
4.  **Set up Git hooks** using Husky:
    ```bash
    bun prepare
    ```
    This will ensure code quality checks run automatically before commits and pushes.
5.  **Set up environment variables:**
    *   Copy `.env.example` (if it exists) or create `.env.local`.
    *   Populate it with necessary API keys (OpenAI, Google, Anthropic, Exa Search).
    *   Similarly, create `.env.test` for test-specific environment variables (especially `EXA_API_KEY` for `exaSearchUtil.test.ts`).
6.  **Generate initial BAML client:**
    ```bash
    bun baml:generate
    ```
7.  **Run the development server:**
    ```bash
    bun dev
    ```
    The application should now be accessible at `http://localhost:3000`.

## Development Workflow

### Branching Strategy

*   Create new branches from the `main` (or `develop` if used) branch.
*   Use descriptive branch names, prefixed with type (e.g., `feat/`, `fix/`, `docs/`, `refactor/`):
    *   `feat/new-evidence-filter`
    *   `fix/report-streaming-issue`
    *   `docs/update-contributing-guide`

### Making Changes

1.  Pull the latest changes from the upstream `main` branch.
2.  Create your feature/bugfix branch.
3.  Implement your changes. Adhere to the coding standards outlined below and in `CLAUDE.md`.
4.  Write appropriate tests (BAML tests, Vitest unit/component tests, Playwright E2E tests).
5.  Ensure all tests pass (`bun test`, `bun baml:test`, `bun test:e2e`).
6.  Run code quality checks:
    *   `bun format`
    *   `bun lint`
    *   `bun typecheck`
7.  Commit your changes using the Conventional Commits format (see [Commit Messages](#commit-messages)). `bun commit` can help guide you.
8.  Push your branch to your fork and open a Pull Request against the main LexiSynth repository.

### BAML Development

If your changes involve modifying LLM interactions, prompts, or data schemas:

1.  Edit files within the `baml_src/` directory (functions, types, clients).
2.  Write or update corresponding tests in `.test.baml` files. These are crucial for validating prompt effectiveness and schema correctness.
3.  Run BAML-specific tests: `bun baml:test`.
4.  Once BAML changes are satisfactory and tests pass, regenerate the BAML client:
    ```bash
    bun baml:generate
    ```
    This updates the `baml_client/` directory. **Do not manually edit files in `baml_client/`.**

### TypeScript & React Development

*   **Server Logic:** For changes to the research pipeline orchestration, focus on `app/actions/researchAgentOrchestrator.ts`. Remember this is a Server Action.
*   **Client-Side Logic:** For UI interactions and stream processing, update `lib/hooks/useResearchAgent.ts`.
*   **State Management:** If new global client-side state is needed, define atoms in `lib/state/researchAtoms.ts`.
*   **UI Components:** Create or modify components in the `components/` directory. Follow the existing structure (`ui/`, `domain/`, `layout/`).
*   **Utilities:** Add shared, non-React logic to `lib/utils/` or `lib/schemas/`.

## Coding Standards & Conventions

Refer to `CLAUDE.md` for comprehensive project guidelines. Key highlights include:

### General Principles

*   **Clean Code:** Write readable, self-documenting, and maintainable code.
*   **SOLID & DRY:** Adhere to these fundamental software design principles.
*   **Functional & Declarative:** Prefer immutability and pure functions.
*   **Separation of Concerns:** Maintain distinct layers for UI, client state, client hooks, server actions, and BAML AI logic.
*   **Performance:** Prioritize low-latency UI and responsive interactions, especially for streaming features.

### File & Directory Naming

*   **Files/Directories:** `kebab-case` (e.g., `evidence-analysis.tsx`).
*   **React Components (Function Name):** `PascalCase`.
*   **Hooks:** `useCamelCase`.
*   **BAML Files:** `snake_case.baml` or `PascalCase.baml` as per BAML examples.

### Component Design

*   **Single Responsibility:** Components should do one thing well.
*   **Composition:** Build complex UIs from smaller, reusable components.
*   **Props:** Use explicit TypeScript interfaces for props.
*   **Accessibility (a11y):** Ensure semantic HTML, keyboard navigability, and ARIA attributes.
*   **RSC by Default:** Opt into Client Components (`"use client"`) only when necessary for interactivity.

### State Management (Jotai)

*   Use Jotai atoms in `lib/state/researchAtoms.ts` for global client-side state related to the research process.
*   The `useResearchAgent` hook is the primary updater of these atoms based on server-streamed data.
*   UI components should primarily use `useAtomValue` to read state. Direct updates via `useSetAtom` should be rare for core research data.
*   Define client-friendly TypeScript interfaces in `researchAtoms.ts` for data consumed by the UI.

### Type Safety

*   **Strict TypeScript:** Adhere to strict mode.
*   **NO `any`:** Use `unknown` with type guards if absolutely necessary. Define explicit types/interfaces.
*   Leverage BAML-generated types from `baml_client/types` and `baml_client/partial_types`.
*   Use Zod (from `lib/schemas/`) for runtime validation of environment variables and potentially non-BAML API inputs/outputs.

## Testing

A robust testing strategy is crucial.

### BAML Tests

*   Located in `.test.baml` files alongside their corresponding function files in `baml_src/`.
*   Use BAML's native testing syntax with `test {}` blocks and `@@assert` for validations.
*   Run with: `bun baml:test`

### Unit & Component Tests (Vitest)

*   Located in `__tests__/`, mirroring the source structure.
*   Use Vitest for the test runner and React Testing Library for component interactions.
*   Mock dependencies as needed (e.g., BAML client, server actions, Jotai atoms for specific component tests). `__mocks__/` contains shared mocks.
*   `__tests__/test-utils.tsx` provides `renderWithProviders` and mock data factories.
*   Run with: `bun test`
*   Run with coverage: `bun test:coverage`

### End-to-End Tests (Playwright)

*   Located in `e2e/`.
*   Test critical user flows, especially the streaming aspects of the research pipeline.
*   Run with: `bun test:e2e` (ensure dev server is running or configured in `playwright.config.ts`).

### Running All Tests

While there isn't a single command for *all* test types (BAML, Vitest, Playwright) combined, ensure each suite passes:
```bash
bun baml:test
bun test
bun test:e2e
```
The `bun validate` script is a good comprehensive check.

## Code Quality & Linting

Automated checks are enforced via Husky hooks.

### Formatting

*   Biome is used for code formatting.
*   Run `bun format` to format all applicable files.
*   Pre-commit hooks will attempt to format staged files.

### Linting

*   ESLint is configured with various plugins (Next.js, React, TypeScript, Import, JSX-A11Y, Promise, Security, Testing Library, Vitest).
*   Run `bun lint` to check for linting errors.
*   Run `bun lint:fix` to attempt automatic fixes.

### Type Checking

*   Ensure your code passes TypeScript's strict checks.
*   Run `bun typecheck` or `bun typecheck:strict`.
*   Maintain a high type coverage score (see `type-coverage.json` and `bun typecov`).

### Dead Code & Dependency Checks

*   Use Knip to find unused files, dependencies, and exports: `bun knip`.
*   Use Dependency-Cruiser to analyze module relationships: `bun deps:check`.

## Commit Messages

This project follows the **Conventional Commits** specification. This is enforced by `commitlint` via a Husky hook.

*   **Format:** `<type>(<scope>): <subject>`
    *   Example: `feat(report-generation): add streaming for executive summary`
    *   Example: `fix(evidence-analysis): correct entity highlighting`
*   **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `init`, `release`.
*   Use `bun commit` for a guided commit message experience via `git-cz`.

## Submitting Pull Requests

1.  Ensure your branch is up-to-date with the upstream `main` branch.
2.  Verify all tests pass (`bun baml:test`, `bun test`, `bun test:e2e`).
3.  Verify all code quality checks pass (`bun validate`).
4.  Push your branch to your fork.
5.  Open a Pull Request (PR) against the `main` branch of the LexiSynth repository.
6.  Provide a clear and concise description of your changes in the PR.
    *   Link to any relevant issues.
    *   Explain the "what" and "why" of your changes.
    *   Detail any significant architectural decisions.
    *   Mention any potential impacts or areas for further testing.
7.  Be responsive to feedback and code reviews.

## Reporting Bugs

*   Search existing issues to see if the bug has already been reported.
*   If not, open a new issue with a clear title and description.
*   Include:
    *   Steps to reproduce the bug.
    *   Expected behavior.
    *   Actual behavior.
    *   Screenshots or error messages, if applicable.
    *   Your environment (OS, browser, Node version, bun version).

## Suggesting Enhancements

*   Open an issue to discuss your enhancement idea.
*   Provide a clear description of the proposed enhancement and its benefits.
*   Explain the use case and how it would improve LexiSynth.