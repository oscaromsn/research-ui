# Claude Code Guide: Navigating the JurisConsulta Documentation (`docs/`)

This document provides guidance for understanding and utilizing the contents of
the `/docs` subdirectory for the JurisConsulta project. TThis directory contains
all project documentation, including requirements, sprint plans, implementation
details, tooling guides, and exemplar code.

Your primary goal when interacting with this directory is to **retrieve and
synthesize information** to understand about the project's design, history,
current status, and tooling.

## 1. Overview of `docs/` Subdirectories

The `docs/` directory is organized into the following key areas:

- **`exemplars/`**: Contains practical code examples and tutorials.
- **`features/`**: Holds high-level project planning and feature-specific
  documentation.
- **`sprints/`**: Detailed records of development sprints, including planning,
  progress, and completion reports. This is a rich source of historical context
  and implementation rationale.
- **`tooling/`**: Contains documentation for the development tools, linting,
  testing, and contribution guidelines.

## 2. Key Documents and Their Purpose

When I ask you to find information or understand project context, refer to these
primary sources:

- **Project Requirements & Goals**:
    - `@features/Project Requirements Document (PRD).md`: **Your primary source
      for understanding the overall project goals, features, and non-functional
      requirements.** Refer to this for questions about "what" JurisConsulta
      should do and "why."

- **Implementation Plans & History**:
    - **`@sprints/` directory**: This is critical for understanding the *
      *evolution of the project and the rationale behind specific
      implementations.**
        - `@sprints/1-past/sprint-1/`: Contains detailed implementation plans
          for each phase of Sprint 1 (e.g.,
          `Sprint 1 - Phase 1 implementation plan.md`). Use these to understand
          how foundational features were built.
        - `@sprints/1-past/sprint-1/logs/PHASE_5_COMPLETION_REPORT.md`: **A
          vital document summarizing the v0.1 completion state**, including
          extensive testing results, architecture validation, and technical
          achievements. Refer to this for understanding the baseline quality and
          features of v0.1.
        - `@sprints/2-current/sprint-2/`: Contains ongoing sprint plans. Useful
          for understanding current development focus, such as integrating live
          search (`Sprint 2 - Phase 1 implementation plan.md`) and refining BAML
          pipelines (`Sprint 2 - Phase 2 implementation plan.md`).
        - `@sprints/3-future/`: Contains roadmaps for future enhancements, like
          `AUTOMATED_QUALITY_GATES_ROADMAP.md`.

- **Code Examples & Patterns**:
    - `@exemplars/BAML&jotai(codebase).md` and
      `@exemplars/BAML&jotai(tutorial).md`: Provide concrete examples of how
      BAML and Jotai are used, which can inform your understanding of similar
      patterns in the main JurisConsulta codebase.

- **Development Tooling & Environment**:
    - `@tooling/DEVTOOLS.md` and `@tooling/DEVTOOLS_SUMMARY.md`: Overview of
      configured development tools (Commitlint, Size Limit, Dependency Cruiser,
      Husky, Lint Staged).
    - `@tooling/TESTING_README.MD` and `@tooling/TESTING_SUMMARY.MD`: Guides for
      the testing setup (Vitest, Testing Library, Playwright).
    - `@tooling/DEVTOOLS_TESTING_REPORT.md`: A snapshot of tooling health and
      fixes, useful for understanding how devtool issues are addressed.

- **Dependency Information**:
    - `@features/dependency-graph.md`: Visual representation of dependencies (if
      up-to-date).
    - `@features/dependency-report.json`: Raw JSON output from Dependency
      Cruiser, useful for detailed programmatic analysis of dependencies if
      needed.

## 3. How to Use This Documentation Effectively

When I ask you to perform tasks related to JurisConsulta:

- **Understand Requirements**: Always start by consulting the
  `@features/Project Requirements Document (PRD).md` if the query relates to
  core features or project goals.
- **Trace Implementation History**: If I ask *why* something was implemented a
  certain way, or how a specific feature evolved, look into the relevant
  `@sprints/.../Sprint X - Phase Y implementation plan.md` documents and the
  `@sprints/1-past/sprint-1/logs/PHASE_5_COMPLETION_REPORT.md`.
- **Verify Tooling & CI Setup**: If I ask about commit hooks, linting rules,
  testing commands, or CI processes, refer to the files in `@tooling/` and the
  root project configuration files they describe (e.g., `biome.js`,
  `tsconfig.json`, `vitest.config.ts`).
- **Learn by Example**: If I ask for help implementing a pattern similar to
  existing ones involving BAML or Jotai, consult the `@exemplars/` directory for
  guidance.
- **Current Development Focus**: For tasks related to ongoing work, prioritize
  information from `@sprints/2-current/sprint-2/`.
- **Future Features**: For discussions about planned enhancements, refer to
  `@sprints/3-future/`.
- **Dependency Questions**: If I ask about module relationships or potential
  dependency issues, the `@features/dependency-report.json` can be a source,
  though direct code analysis is often better.

## 4. Specific Document Notes

- **Sprint Plans (e.g., `Sprint 1 - Phase X implementation plan.md`)**: These
  are highly detailed and provide step-by-step instructions and acceptance
  criteria for features. They are excellent for understanding the intended
  implementation details and breaking down complex tasks.
- **`PHASE_5_COMPLETION_REPORT.md`**: This is a key historical document. It
  details the state of JurisConsulta v0.1, including extensive testing results,
  architectural validation, and NFR achievements. It's a good reference for the
  baseline quality and functionality.
- **Tooling Docs (`@tooling/*`)**: These often refer to specific configuration
  files at the project root (e.g., `biome.json`, `.dependency-cruiser.js`). Be
  prepared to cross-reference these.

## 5. General Tips for Navigating `docs/`

- **Context is Key**: The `docs/` directory is rich with context. Use the file
  paths and directory names to infer the relevance of information.
- **Chronological Information**: The `sprints/` directory provides a timeline.
  Distinguish between past, current, and future plans.
- **Cross-Referencing**: Information in one document (e.g., PRD) might be
  detailed further in a sprint plan or a tooling guide.
- **Purpose-Driven Reading**: Understand the purpose of each document type (PRD
  for *what*, sprint plans for *how*, reports for *results*, tooling docs for
  *dev environment*).

By effectively using this documentation, you can provide more accurate,
context-aware, and helpful responses for JurisConsulta development.
