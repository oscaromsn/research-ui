# Testing Quick Guide

## Output Modes

### 🎯 Concise (Default) - Token Efficient
- **Output**: Dot notation (`.`)
- **Console**: Minimal logging
- **Usage**: Daily development, CI/CD
- **Command**: `bun test`

### 🔍 Verbose - Full Details
- **Output**: Detailed test names and timing
- **Console**: All logs visible
- **Usage**: Debugging, investigation
- **Command**: `bun test:verbose`

### 📁 Single File - Always Verbose
- **Output**: Detailed for specific file
- **Console**: All logs for that file
- **Usage**: Focused debugging
- **Command**: `bun test:file path/to/test.ts`

## Quick Commands

```bash
# Concise (default)
bun test                    # Unit tests only
bun test:unit              # Unit tests explicit
bun test:integration:fast  # Fast integration tests

# Verbose (debugging)
bun test:verbose           # All unit tests with details
bun test:unit:verbose      # Unit tests with details
bun test:integration:fast:verbose  # Integration with details

# Single file (always verbose)
bun test:file __tests__/components/ui/button.test.tsx
```

## Environment Variables

- `VITEST_VERBOSE=true` - Enable verbose mode
- `DEBUG_API_TESTS=true` - API debugging logs
- `VITEST_SILENT=true` - Suppress all console

## Tips

- Use **concise** for regular TDD workflow
- Use **verbose** when tests fail or debugging
- Use **single file** for component-specific work
- CI/CD automatically uses concise mode