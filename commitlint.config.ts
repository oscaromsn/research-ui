import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // Custom parser to handle optional gitmoji at the start
      headerPattern:
        // eslint-disable-next-line security/detect-unsafe-regex
        /^(?:[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]\s*)?(\w*)(?:\(([^)]*)\))?!?:\s*(.*)$/u,
      headerCorrespondence: ["type", "scope", "subject"],
    },
  },
  rules: {
    // Essential rules for consistency
    "type-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      [
        "feat", // New feature
        "fix", // Bug fix
        "docs", // Documentation changes
        "style", // Code style changes (formatting, etc.)
        "refactor", // Code refactoring
        "perf", // Performance improvements
        "test", // Adding or updating tests
        "build", // Build system or external dependencies
        "ci", // CI configuration changes
        "chore", // Other changes that don't modify src or test files
        "revert", // Reverting previous commits
        "wip", // Work in progress (use sparingly)
        "init", // Initial commit
        "release", // Release commits
      ],
    ],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],

    // More lenient length rules
    "subject-max-length": [1, "always", 120], // Warning only, longer limit
    "header-max-length": [1, "always", 120], // Warning only, longer limit

    // Relaxed case rules - allow more flexibility
    "subject-case": [0], // Disabled - allow any case

    // Optional/warning body rules
    "body-leading-blank": [1, "always"],
    "body-max-line-length": [0], // Disabled - no body line limit

    // Optional footer rules
    "footer-leading-blank": [0], // Disabled
    "footer-max-line-length": [0], // Disabled

    // Scope rules - optional but helpful
    "scope-case": [1, "always", "lower-case"], // Warning only
    "scope-empty": [0], // Allow empty scopes
  },
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
};

export default config;
