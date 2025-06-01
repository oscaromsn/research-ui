# CLAUDE.md - BAML Guidelines

This guide provides essential instructions and context for working within the `/baml_src` directory of the LexiSynth project. This directory contains all BAML (Boundary AI Markup Language) definitions, which are crucial for the AI-powered legal research pipeline.

**Your primary goal when working here is to define, test, and refine the LLM interactions (prompts, schemas, client configurations) that drive LexiSynth's intelligence.**

## 1. Overview of `/baml_src` Directory Structure

*   **`clients.baml`**:
    *   **Purpose**: Defines LLM client configurations (e.g., `QueryGeneration`, `DocumentAnalysis`). Specifies providers (Google AI, OpenAI, Anthropic), models, API key environment variables (e.g., `env.GOOGLE_API_KEY`), and retry policies (`TestSafely`, `Constant`).
    *   **Usage**: When defining BAML functions, you'll select a client from here (e.g., `client QueryGeneration;`).

*   **`core_loop.baml`** (and `core_loop.test.baml`):
    *   **Purpose**: Contains the `AssessResearchAndPlanNextSteps` BAML function. This is a critical decision-making step in the research pipeline.
    *   **Focus**: The prompt here involves complex logic to guide the LLM in assessing research sufficiency and determining the next action (e.g., refine queries, generate report).

*   **`functions/`**:
    *   **Purpose**: Contains individual BAML functions for each distinct stage of the AI pipeline (e.g., `1-generate_queries.baml`, `2-analyze_document.baml`).
    *   **Structure**: Each `.baml` file typically defines one main function.
    *   **Testing**: Each function file MUST have a corresponding `.test.baml` file (e.g., `1-generate_queries.test.baml`).
    *   **`functions/CLAUDE.md`**: **IMPORTANT META-DOCUMENTATION!** This file is **your primary guide for BAML testing syntax, Jinja filters, and best practices for writing assertions (`@@assert`).** Refer to this extensively when creating or modifying BAML tests.

*   **`generators.baml`**:
    *   **Purpose**: Configures the BAML code generator.
    *   **Key Settings**:
        *   `output_type "typescript/react"`: Specifies generation of TypeScript clients and React hooks.
        *   `output_dir "../"`: Generated code goes into the root `baml_client/` directory.
        *   `version "0.89.0"`: Ensures compatibility with the installed `@boundaryml/baml` package. Keep this aligned.
        *   `default_client_mode async`: Generated client calls are asynchronous by default.

*   **`types/`**:
    *   **Purpose**: Defines all BAML `class` and `enum` type definitions used throughout the pipeline (e.g., `analyzed_document.baml`, `final_report.baml`, `legal_entity.baml`, `search_queries.baml`).
    *   **Streaming**: Pay close attention to streaming annotations:
        *   `@stream.with_state`: For fields that should be progressively built and where the client needs to know if the field is "Pending", "Incomplete", or "Complete" (e.g., `FinalLegalReport.executive_summary`, `LegalReportSection.content`). This is reflected in `baml_client/partial_types.ts`.
        *   `@@stream.done`: For types or fields that should be delivered atomically, not streamed character by character (e.g., `SearchQueryItem`).
    *   **Descriptions**: Use `@description` generously to clarify the purpose of types and fields.

## 2. Core BAML Development Workflow

1.  **Define/Modify Types (`types/*.baml`)**:
    *   Start by defining the data structures your LLM will consume or produce.
    *   Apply streaming annotations (`@stream.with_state`, `@@stream.done`) thoughtfully based on UI requirements for progressive display.

2.  **Define/Modify Functions (`functions/*.baml`, `core_loop.baml`)**:
    *   Write or refine the prompt. Use Jinja templating (`{{ ... }}`) for dynamic content.
    *   Clearly instruct the LLM on the desired output format, often using `{{ ctx.output_format }}` to inject the JSON schema of the return type.
    *   Select an appropriate LLM client defined in `clients.baml`.

3.  **Configure Clients (`clients.baml`)** (if necessary):
    *   Add new clients or adjust existing ones (model, provider, retry policy).

4.  **Write/Update Tests (`*.test.baml`)**:
    *   **This is a MANDATORY step for every BAML function.**
    *   Create diverse test cases covering various input scenarios (simple, complex, edge cases).
    *   Use `args { ... }` to define test inputs.
    *   Use `@@assert( {{ ... }} )` to validate output structure and key content.
    *   **Refer to `@functions/CLAUDE.md` for detailed guidance on Jinja filters and assertion syntax (e.g., `{{ this|length > 0 }}`, `{{ this.field == "value" }}`, `{{ "keyword" in (this.summary | lower) }}`).**

5.  **Run BAML Tests (`bun baml:test`)**:
    *   Iterate on prompts and type definitions until all relevant tests pass.
    *   Use the BAML VSCode extension's "Playground" feature to test individual function calls with specific inputs interactively. This is excellent for debugging prompts.
    *   To run tests for a single function: `bun baml:test -i {$FunctionName}::` (e.g., `bun baml:test -i GenerateLegalSearchQueries::`).

6.  **Regenerate BAML Client (`bun baml:generate`)**:
    *   **CRUCIAL**: After **any** change to `.baml` files (types, functions, clients, generators), you **MUST** run this command.
    *   This updates the `/baml_client` directory with new TypeScript types, client methods, and React hooks.

## 3. Key BAML Concepts & Best Practices

*   **Prompt Engineering**:
    *   Be explicit and structured in your prompts.
    *   Clearly define the persona/role of the LLM.
    *   Provide context using Jinja variables (e.g., `<legal_question>{{original_legal_question}}</legal_question>`).
    *   Guide the LLM towards the desired output format using `{{ ctx.output_format }}`.
    *   Use examples within prompts (few-shot prompting) if the task is complex or the LLM struggles with the format.
*   **Schema-First**: Define robust BAML `class` and `enum` types in `/types`. These schemas are compiled and used for validating LLM outputs and generating typed clients.
*   **Streaming**:
    *   `@stream.with_state` on a field (e.g., `summary string @stream.with_state`) means the generated client will provide information on whether this field is "Pending", "Incomplete", or "Complete" during streaming. This is used for fields that are built token by token (like a long report section).
    *   `@@stream.done` on a class (e.g., `class SearchQueryItem { ... @@stream.done }`) means instances of this class will be yielded whole, not partially, when part of a streamed list.
    *   Refer to `types/final_report.baml`, `types/report_section.baml` (for `@stream.with_state`) and `types/search_queries.baml` (for `@@stream.done` on `SearchQueryItem`) for examples.
*   **Testing**:
    *   **MANDATORY**. Write tests *before or alongside* BAML function implementation.
    *   Cover happy paths, edge cases (empty inputs, unexpected values), and variations in input complexity.
    *   Assertions should check for structural correctness and key content elements.
    *   **Consult `@functions/CLAUDE.md` for advanced assertion techniques (Jinja filters like `selectattr`, `map`, `join`, `lower`, `regex_match`).**
*   **LLM Client Configuration (`clients.baml`)**:
    *   Use specific clients for different tasks if performance/cost/capability trade-offs are needed (e.g., a faster model for `DecidesNextStep`, a more powerful one for `GenerateFinalReport`).
    *   Define retry policies (`TestSafely`, `Constant`) to handle transient LLM API errors.
*   **Modularity**: Break down complex LLM tasks into smaller, manageable BAML functions. The LexiSynth pipeline (GenerateQueries -> Analyze -> Synthesize -> Assess -> Report) exemplifies this.

## 4. Working with Specific File Types in `/baml_src`

*   **Type Definitions (`types/*.baml`)**:
    *   Focus: Field names, BAML types (e.g., `string`, `int`, `bool`, `YourCustomClass[]`, `map<string, string>`), optionality (`?`), descriptions (`@description`), and streaming annotations (`@stream.with_state`, `@@stream.done`).
*   **Function Definitions (`functions/*.baml`, `core_loop.baml`)**:
    *   Focus: Input parameters, output type, `client` selection, and the `prompt` content.
    *   The prompt is the core logic. Ensure it's clear, provides necessary context via `{{ ... }}`, and explicitly requests output matching `{{ ctx.output_format }}`.
*   **Test Files (`*.test.baml`)**:
    *   Focus: Defining `test YourTestName { functions [FunctionToTest]; args { ... }; @@assert( ... ); }`.
    *   The `args` block must exactly match the input parameters of the function under test.
    *   `@@assert` clauses use Jinja to validate `this` (the function's output).
*   **`clients.baml`**:
    *   Focus: `client<llm> ClientName { provider ...; options { model ...; api_key ...; }; retry_policy ...; }`.
*   **`generators.baml`**:
    *   Usually stable, but verify `version` matches the installed `@boundaryml/baml` package version.

## 5. Important Commands (Run from Project Root)

*   **`bun baml:generate`**: **Run this after ANY change to ANY `.baml` file.** It updates the `/baml_client` directory.
*   **`bun baml:test`**: Runs all BAML tests defined in `.test.baml` files.
*   **`bun baml:test -i {$FunctionName}::`**: Runs all tests for a specific BAML function. Useful for focused development.
    *   Example: `bun baml:test -i GenerateLegalSearchQueries::`

## 6. Relationship with `/baml_client`

*   The `/baml_client` directory is **ENTIRELY AUTO-GENERATED** by the `bun baml:generate` command based on the contents of `/baml_src`.
*   **NEVER MANUALLY EDIT FILES IN `/baml_client`.** Your changes will be overwritten.
*   All changes to BAML logic, types, or client configurations must be made in `/baml_src`, followed by client regeneration.

## 7. Troubleshooting Common BAML Issues

*   **Client Generation Fails**:
    *   Check for syntax errors in your `.baml` files. The BAML VSCode extension should highlight these.
    *   Ensure `generators.baml` is correctly configured and the BAML version matches.
*   **BAML Tests Fail**:
    *   **Input Issues**: Double-check the `args {}` block in your `.test.baml` file. Does it provide all required inputs in the correct format?
    *   **Prompt Issues**: The LLM might not be understanding your prompt correctly. Use the BAML Playground (in VSCode extension) to experiment with the prompt and inputs live.
    *   **Schema Mismatch**: The LLM output might not conform to the BAML function's return type. Refine the prompt to be more explicit about the output structure, or adjust the BAML type definition.
    *   **Assertion Failures**: Your `@@assert` logic might be incorrect, or the LLM output is not meeting expectations.
*   **Type Errors in Main TypeScript Code (after `baml:generate`)**:
    *   This usually means your BAML type definitions have changed, and the TypeScript code using the old types in `/baml_client` needs to be updated.
    *   Ensure you're importing types correctly from `@/baml_client/types` or `@/baml_client/partial_types`.

By following these guidelines, you can effectively contribute to the AI core of LexiSynth. Remember to test thoroughly and regenerate the client after making any changes in `/baml_src`. The `functions/CLAUDE.md` file is your best friend for writing effective BAML tests.
```
