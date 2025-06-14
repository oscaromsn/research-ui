import type { UserConfig } from "@commitlint/types"

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  parserPreset: {
    parserOpts: {
      // Custom parser to handle optional gitmoji at the start (both :emoji:
      // and Unicode emoji)
      headerPattern:
        /^(?:(?::[a-z0-9_+-]+:|\p{Emoji_Presentation})\s*)?(\w+)(?:\(([^)]*)\))?!?:\s*(.+)$/u,
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
        "deps", // Dependency changes
        "release", // Release commits
        "move", // Moving or renaming files/components
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
    "scope-case": [0], // Disabled - allow any case for scopes
    "scope-empty": [0], // Allow empty scopes
  },
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
}

// biome-ignore lint/style/noDefaultExport: Commitlint requires default export for config
export default config
