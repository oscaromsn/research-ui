# Development Tools Configuration

This document outlines the development tools configured in this project and how to use them effectively.

## Overview

The following devtools have been integrated into the project:

- **Commitlint**: Enforces conventional commit message format
- **Size Limit**: Monitors bundle size and performance
- **Dependency Cruiser**: Analyzes and validates project dependencies
- **Husky**: Manages Git hooks for automated quality checks
- **Lint Staged**: Runs linters and formatters on staged files

## Tool Configurations

### 1. Commitlint

**Purpose**: Ensures consistent commit message format following conventional commits specification.

**Configuration**: `commitlint.config.js`

**Allowed commit types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or external dependencies
- `ci`: CI configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverting previous commits
- `wip`: Work in progress (use sparingly)

**Example commit messages**:
```bash
feat: add user authentication system
fix: resolve memory leak in search component
docs: update API documentation
refactor: extract utility functions to separate module
```

**Usage**:
```bash
# Test a commit message
echo "feat: your commit message" | bun exec commitlint

# Manual validation
bun commitlint --edit
```

### 2. Size Limit

**Purpose**: Monitors JavaScript bundle sizes and prevents performance regressions.

**Configuration**: `.size-limit.json`

**Current limits**:
- Main chunk: 50 KB
- App pages: 150 KB  
- Page components: 100 KB

**Usage**:
```bash
# Check current bundle sizes
bun size

# Analyze why bundles are large
bun size:why

# Generate JSON analysis report
bun size:analyze
```

**Integration**: Automatically runs during `validate:full` and pre-push hooks.

### 3. Dependency Cruiser

**Purpose**: Analyzes project dependencies, detects circular dependencies, and enforces architectural rules.

**Configuration**: `.dependency-cruiser.js`

**Key rules enforced**:
- No circular dependencies
- No orphaned modules (with exceptions for config files)
- No manual edits to `baml_client/` (auto-generated)
- Proper separation between dev and production dependencies
- No unresolvable dependencies

**Usage**:
```bash
# Check for dependency violations
bun deps:check

# Generate visual dependency graph (requires Graphviz)
bun deps:graph

# Generate HTML dependency report
bun deps:report
```

**Output files**:
- `dependency-graph.svg`: Visual dependency graph
- `dependency-report.html`: Detailed HTML report

### 4. Husky

**Purpose**: Manages Git hooks to automate quality checks before commits and pushes.

**Configuration**: `.husky/` directory

**Configured hooks**:

#### Pre-commit Hook (`.husky/pre-commit`)
Runs `lint-staged` to process staged files:
- Format code with Biome
- Fix Biome issues
- Run related tests

#### Commit Message Hook (`.husky/commit-msg`)
Validates commit messages using commitlint.

#### Pre-push Hook (`.husky/pre-push`)
Runs quick validation:
- TypeScript compilation check
- Biome validation
- Format validation

**Manual execution**:
```bash
# Test pre-commit hook
bun precommit

# Test commit message validation
bun commitlint --edit
```

### 5. Lint Staged

**Purpose**: Runs linters and formatters only on staged files for faster feedback.

**Configuration**: `.lintstagedrc.js`

**File type handlers**:
- **TypeScript/JavaScript files**: Biome check --write → Typecheck → Run related tests
- **BAML files**: Regenerate client → Run BAML tests
- **JSON files**: Biome format
- **CSS files**: Biome format
- **Markdown files**: Biome format
- **package.json**: Install dependencies
- **Config files**: Run typecheck
- **Test files**: Format → Lint → Run related tests

**Usage**:
```bash
# Run lint-staged manually
bun exec lint-staged

# Run with verbose output
bun exec lint-staged --verbose
```

## Development Workflow

### Daily Development

1. **Make changes** to your code
2. **Stage files** with `git add`
3. **Commit** with conventional message format
   ```bash
   git commit -m "feat: add new search functionality"
   ```
4. **Push** to remote repository

The hooks will automatically:
- Format and lint staged files
- Validate commit messages
- Run quick validation before push

### Before Release

Run comprehensive validation:

```bash
# Full validation including tests and bundle analysis
bun validate:full

# Individual checks
bun validate        # Core validation
bun test:coverage   # Test coverage
bun test:e2e        # End-to-end tests
bun size           # Bundle size check
bun deps:check     # Dependency analysis
bun audit          # Security audit
```

### CI/CD Integration

The `ci` script runs the complete validation suite:

```bash
bun ci
```

This includes:
- Type checking (strict mode)
- Linting (zero warnings)
- Test execution with coverage
- Format validation
- Bundle analysis
- Dead code detection
- Type coverage analysis
- End-to-end tests

## Troubleshooting

### Common Issues

#### 1. Commit Message Rejected
```bash
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```
**Solution**: Use conventional commit format: `type: description`

#### 2. Bundle Size Exceeded
```bash
✖ Size limit exceeded
```
**Solution**: 
- Run `bun size:why` to analyze large dependencies
- Optimize imports (use tree shaking)
- Consider code splitting
- Update limits in `.size-limit.json` if necessary

#### 3. Dependency Violations
```bash
warn no-orphans: lib/utils/someFile.ts
```
**Solution**:
- Remove unused files
- Add exceptions to `.dependency-cruiser.js` if file should be kept
- Import the module somewhere if it's actually needed

#### 4. Lint-staged Failures
```bash
✖ biome check --write
```
**Solution**:
- Fix Biome errors manually
- Check if files are properly TypeScript/JavaScript
- Ensure all imports are valid

### Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks
git commit --no-verify -m "emergency: critical hotfix"

# Skip pre-push hooks
git push --no-verify
```

**Note**: Only use `--no-verify` in genuine emergencies. The validation tools are designed to prevent issues in production.

### Testing Git Hooks

To verify the git hooks are working correctly:

```bash
# Test commitlint
echo "feat: test commit message" | bun exec commitlint

# Test invalid commit message
echo "invalid message" | bun exec commitlint

# Test pre-commit hook (manually)
bun exec lint-staged --verbose

# Test pre-push hook (manually)
.husky/pre-push
```

**Expected behaviors**:
- Valid commit messages should pass silently
- Invalid commit messages should show specific error messages
- Pre-commit should format, lint, and test only staged files
- Pre-push should run quick validation (typecheck, lint, format check)

### Configuration Updates

When updating tool configurations:

1. **Test locally** before committing
2. **Update this documentation** if behavior changes
3. **Inform the team** about significant changes
4. **Consider backward compatibility** for existing workflows

## Integration with Project Architecture

These tools are specifically configured for the LexiSynth project architecture:

- **BAML integration**: Special handling for `baml_src/` and `baml_client/`
- **Next.js optimization**: Bundle size limits appropriate for Next.js apps
- **Server Components**: Dependency rules enforce proper RSC/Client Component separation
- **Jotai state management**: No specific tooling conflicts
- **Testing suite**: Integration with Vitest and Playwright

## Performance Impact

- **Pre-commit**: ~5-15 seconds (depends on number of staged files)
- **Pre-push**: ~30-60 seconds (full quick validation)
- **CI validation**: ~3-5 minutes (complete test suite)

These timings are acceptable trade-offs for maintaining code quality and preventing production issues.
