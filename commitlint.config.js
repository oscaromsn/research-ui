/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Type case
    "type-case": [2, "always", "lower-case"],

    // Type enum - allow specific commit types
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
      ],
    ],

    // Subject rules
    "subject-case": [
      2,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"],
    ],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-max-length": [2, "always", 100],

    // Header rules
    "header-max-length": [2, "always", 100],

    // Body rules
    "body-leading-blank": [1, "always"],
    "body-max-line-length": [2, "always", 100],

    // Footer rules
    "footer-leading-blank": [1, "always"],
    "footer-max-line-length": [2, "always", 100],
  },
  helpUrl:
    "https://github.com/conventional-changelog/commitlint/#what-is-commitlint",
};
