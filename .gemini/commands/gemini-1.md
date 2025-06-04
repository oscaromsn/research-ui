
> deeply analyze the following codebase to write an highly detailed and comprehensive report:

> According to these observations write an updated CLAUDE.md file

> We are about to start a new development sprint on this codebase. your task is ensure the current status of the codebase allows a frictionless test-driven development approach through agentic coding. since the coding agents heavily relies on static analysis tools to advance progressively to accomplish this task successfully is essential check the correctness of the codebase before a new sprint. you can't say the codebase is ready unless no diagnostics messages is present, all tests for the current abstractions passes and the testing coverage is according to the project guidelines.

> good. now write an highly detailed, comprehensive and actionable plan for the envisioned sprint

OR

## Creating detailed implementation plans for each phase:

For Gemini (currrent SOTA)

> now write a highly detailed, comprehensive and actionable step-by-step implementation plan for phase 3 with clear acceptance criteria and checkpoints throughout for test-driven development focused on incremental progress and continuous testing.

For Gemini (maybe better):

> Write a highly detailed, comprehensive, and actionable step-by-step implementation plan with clear acceptance criteria and checkpoints throughout for each step. The goal is enable an optimal agentic coding test-driven development workflow focused on incremental progress and continuous testing.

## Nudging TDD on Claude Code:

- On this session we are starting the sprint described in the overview present in $ARGUMENTS. Your task is read it carefully while navigating through the codebase to familiarize yourself with the codebase. We are currently on the the phase $ARGUMENTS, which detailed plan you should carefully read in $ARGUMENTS. When finishing to fully read the phase plan navigate through the codebase until have sure you fully, concretely understands the steps you should take. Follow the plan carefully and accordingly, adding all the necessary steps to complete the phase properly in a todo list, including validations and confirmations. Remember to adopt a test-driven approach and implement changes incrementally while leveraging the available static analysis tooling and test suite to continuously ensure you are on the right direction and catch bugs as early as possible.

- Implement features through incremental changes while heavily relying on the static validation tools provided to continuously ensure you are on the right direction and catch bugs as early as possible.

- Implement features through small, atomic changes, validating each modification immediately using the diagnostics tool before proceeding. If validation fails, stop, fix incrementally, and re-validate before continuing. This ensures each change is properly written and moves measurably toward the objective while catching issues early when they're easiest to resolve.

- yes, proceed adopting progressive test-driven development principles focusing on incremental progress and continuous testing and static validation
