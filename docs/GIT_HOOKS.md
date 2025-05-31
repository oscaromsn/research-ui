# Git Hooks Documentation

## Overview

This project uses Git hooks to ensure code quality and consistency. The hooks are managed by Husky and configured to run quickly while maintaining high standards.

## Current Hook Configuration

### Pre-commit Hook (`./husky/pre-commit`)

Runs on every commit to ensure code quality:

- **Lint-staged**: Runs targeted linting, formatting, and testing on staged files only
- **Fast execution**: Optimized to complete in ~30-40 seconds (down from 5+ minutes)
- **Smart testing**: Only runs unit tests related to changed files, excluding slow integration/e2e tests

### Commit Message Hook (`./husky/commit-msg`)

Validates commit message format using commitlint:

- **Conventional Commits**: Enforces conventional commit format
- **Emoji Support**: Supports gitmoji (⚡️, 🐛, 📝, etc.) with proper Unicode handling
- **Flexible**: Allows various commit types (feat, fix, docs, style, refactor, etc.)

### Pre-push Hook (`./husky/pre-push`)

Lightweight validation before pushing:

- **Type checking**: Ensures TypeScript compiles without errors
- **Format check**: Verifies code formatting consistency
- **Fast feedback**: Completes in seconds, not minutes

## Bypass Mechanism

For urgent commits or when hooks are causing issues:

```bash
# Skip all pre-commit hooks
SKIP_HOOKS=true git commit -m "urgent: fix production issue"

# Skip only specific git operations (use with caution)
git commit --no-verify -m "bypass all hooks"
```

**Important**: When using bypass mechanisms, run validation before pushing:

```bash
pnpm validate  # Run full validation suite
```

## Commit Message Format

### Standard Format

```
type(scope): description

feat(api): add user authentication endpoint
fix(ui): resolve button alignment issue
docs: update installation instructions
```

### With Emoji (Gitmoji)

```
emoji type(scope): description

⚡️ perf(search): optimize search algorithm
🐛 fix(auth): resolve login validation
📝 docs: add API documentation
🎨 style(ui): improve component styling
```

### Supported Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding/updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

## Optimization Details

### Lint-staged Configuration (`.lintstagedrc.mjs`)

**Optimizations applied:**

1. **Targeted testing**: `vitest related` only runs tests related to changed files
2. **Fast reporter**: `--reporter=basic` for minimal output
3. **Fail fast**: `--bail=1` stops on first test failure
4. **Timeout control**: `--testTimeout=5000` prevents hanging tests
5. **Exclude slow tests**: Skip integration and e2e tests in git hooks

**Before optimization:**
- Execution time: 5+ minutes
- Ran all tests regardless of changes
- Verbose output
- No timeout protection

**After optimization:**
- Execution time: ~35 seconds
- Only runs related unit tests
- Minimal output
- Protected against hanging tests

### Commitlint Configuration (`commitlint.config.ts`)

**Fixed Unicode handling:**
- Added support for emoji variation selectors (`\u{FE00}-\u{FE0F}`)
- Properly parses emojis like ⚡️ (U+26A1 + U+FE0F)
- Maintains backward compatibility with simple emojis

## Performance Monitoring

### Measuring Hook Performance

```bash
# Time a commit with hooks
time git commit -m "test: measure hook performance"

# Profile lint-staged execution
time pnpm exec lint-staged

# Test specific hook configurations
pnpm exec lint-staged --diff="HEAD~1"
```

### Expected Performance

| Hook | Expected Time | What it does |
|------|---------------|--------------|
| Pre-commit | 30-40s | Format, lint, test changed files |
| Commit-msg | <1s | Validate commit message format |
| Pre-push | 5-10s | Type check and format validation |

## Troubleshooting

### Common Issues

**1. Hooks taking too long**
```bash
# Check what's running slowly
DEBUG=lint-staged* git commit -m "debug commit"

# Skip hooks temporarily
SKIP_HOOKS=true git commit -m "urgent fix"
```

**2. Commit message rejected**
```bash
# Test your commit message
echo "your message here" | pnpm exec commitlint

# Common format: type(scope): description
git commit -m "feat(auth): add login validation"
```

**3. Tests failing in hooks**
```bash
# Run tests manually to debug
pnpm test

# Run only unit tests (same as hooks)
pnpm test:unit

# Check specific files
vitest run --reporter=verbose path/to/your/file.test.ts
```

### Reset Hooks

If hooks are corrupted or misconfigured:

```bash
# Reinstall hooks
pnpm run prepare

# Verify hook installation
ls -la .git/hooks/
```

## Best Practices

### For Developers

1. **Commit frequently**: Small, focused commits are processed faster
2. **Test locally**: Run `pnpm test:unit` before committing
3. **Use descriptive messages**: Follow conventional commit format
4. **Stage selectively**: Only stage files ready for review

### For Team Leads

1. **Monitor performance**: Track hook execution times
2. **Update exclusions**: Add slow tests to integration category
3. **Review bypass usage**: Ensure `SKIP_HOOKS` is used responsibly
4. **Maintain documentation**: Keep this guide updated

## Integration with CI/CD

Git hooks provide **fast feedback** during development, while CI/CD provides **comprehensive validation**:

- **Git hooks**: Fast unit tests, linting, formatting
- **CI/CD**: Full test suite, integration tests, deployment checks

This layered approach ensures both developer productivity and code quality.