# Linting and Formatting Policy

## Overview

This document outlines the comprehensive linting and formatting policy for the LexiSynth project. We use a dual-tool approach with **Biome for formatting** and **Biome for linting** to ensure code quality and consistency across the entire codebase. **All code is treated equally** - tests, mocks, and source files follow the same quality standards with no distinctions.

## Tools Configuration

### Biome (Formatting)
- **Primary Role**: Code formatting and import organization
- **Configuration**: `biome.json`
- **Coverage**: All TypeScript, JavaScript, JSON, and CSS files including tests and mocks
- **Settings**:
  - 2-space indentation
  - 80-character line width
  - LF line endings
  - Double quotes for JS/TS
  - Semicolons required
  - Trailing commas (ES5 style)

### bIOME (Linting)
- **Primary Role**: Code quality, best practices, and error detection
- **Configuration**: `biome.json`
- **Coverage**: All TypeScript and JavaScript files with specialized rules for different file types
- **Key Features**:
  - TypeScript-first with strict type checking
  - React and Next.js optimizations
  - Testing framework support (Vitest, Testing Library, Playwright)
  - Security and accessibility rules
  - Import organization and validation

## File Coverage

### Included in Both Tools
- Source code: `app/**`, `components/**`, `lib/**`
- Test files: `__tests__/**/*.{test,spec}.{ts,tsx}`
- Mock files: `__mocks__/**/*.{ts,tsx,js,jsx}`
- Setup files: `setupTests.ts`
- E2E tests: `e2e/**/*.spec.ts`
- Configuration files: `*.config.{js,mjs,ts}`

### Excluded from Both Tools
- Generated files: `baml_client/**` (auto-generated, should not be modified)
- Build artifacts: `.next/**`, `coverage/**`, `dist/**`
- Dependencies: `node_modules/**`
- Public assets: `public/**`
- IDE files: `.vscode/**`, `.zed/**`, `.claude/**`
- Lock files: `bun.lock`, `bun.lockb`, `package-lock.json`

## Scripts and Commands

### Formatting Commands
```bash
# Format all files (source, tests, mocks - everything)
bun format
```

### Linting Commands
```bash
# Lint all files and auto-fix issues
bun check

### Validation Commands
```bash
# Quick validation (format + lint + typecheck)
bun validate:quick

# Full validation (includes tests and coverage)
bun validate

# Complete CI validation
bun ci
```

## Pre-commit Hooks (lint-staged)

The project uses `lint-staged` to automatically format and lint files before commits:

### Source Files (`app/`, `components/`, `lib/`)
1. **Biome format** - Apply consistent formatting
2. **Biome fix** - Fix linting issues automatically
3. **Vitest run** - Run related unit tests

### Test Files (`**/*.{test,spec}.{ts,tsx}`)
1. **Biome format** - Apply consistent formatting
2. **Biome fix** - Fix linting issues with test-specific rules
3. **Vitest run** - Run the specific test files

### Mock Files (`__mocks__/**`)
1. **Biome format** - Apply consistent formatting
2. **Biome fix** - Fix linting issues with relaxed rules

### Configuration Files
1. **Biome fix** - Lint configuration files
2. **TypeScript check** - Validate types after config changes

## Biome Configuration Details

### Rule Categories

#### Core Files (app/, components/, lib/)
- **TypeScript strict rules**: Type safety, no `any`, consistent imports
- **React/Next.js rules**: Hooks, JSX, performance optimizations
- **Security rules**: Basic security patterns
- **Import organization**: Sorted imports with newlines between groups
- **Accessibility**: ARIA labels, semantic HTML

#### Test Files (__tests__/, *.test.*, *.spec.*)
- **Relaxed TypeScript rules**: Allow `any` for test utilities
- **Testing Library rules**: Best practices for component testing
- **Vitest rules**: Test structure and assertions
- **Jest DOM rules**: DOM testing utilities

#### E2E Test Files (e2e/)
- **Playwright-optimized**: No React Testing Library rules
- **Relaxed restrictions**: Allow console.log for debugging
- **Node.js globals**: Access to file system and process

#### Configuration Files (*.config.*)
- **Minimal restrictions**: Allow CommonJS patterns
- **No type checking**: Config files don't require strict typing
- **Default exports allowed**: Common pattern for configs

### Type Checking Integration
- **Project-aware**: Uses `tsconfig.json` for type information
- **Selective application**: Only applies type-aware rules to appropriate files
- **Performance optimized**: Excludes test files from expensive type checking

## Best Practices

### Developer Workflow
1. **Write code** following TypeScript strict mode (applies to all files: source, tests, mocks)
2. **Save files** - IDE should auto-format on save (configure Biome)
3. **Commit changes** - Pre-commit hooks handle final formatting/linting for all files
4. **CI validation** - Full validation runs on pull requests

### Code Quality Philosophy
- **No distinction between file types**: Tests and mocks are held to the same standards as source code
- **Unified tooling**: All files processed by the same tools with appropriate rule sets
- **Consistent formatting**: Same formatting rules apply across the entire codebase

### IDE Setup
Configure your IDE to:
- Use Biome for formatting (not Prettier)
- Use Biome for inline linting
- Format on save with Biome
- Show Biome warnings/errors inline

### Error Resolution Priority
1. **TypeScript errors** - Fix type issues first
2. **Biome errors** - Address code quality issues
3. **Biome warnings** - Improve code when possible
4. **Formatting** - Apply consistent style

## Integration Points

### Package.json Scripts
All scripts are designed to work together:
- `format` + `lint` = comprehensive code quality
- `typecheck` + `lint:strict` = strict validation
- `test` integration ensures code works after formatting/linting
- No separate format checking - fast formatting makes it unnecessary

### Git Workflow
- **Pre-commit**: Automatic formatting and linting
- **Pre-push**: Optional full validation
- **CI/CD**: Complete validation with tests and coverage

### BAML Integration
- BAML client files are excluded from processing
- BAML source files (`baml_src/`) trigger client regeneration
- BAML tests run separately with dedicated commands

## Troubleshooting

### Common Issues

#### "File ignored" warnings
- **Cause**: File matches ignore pattern in Biome
- **Solution**: Check `ignores` arrays in `files.ignore` in `biome.json`

#### Test file linting
- **Cause**: Test files need special rule configurations
- **Solution**: Verify test file patterns in biome.json config sections

# See Biome configuration for a file
npx biome format --help

# Test lint-staged configuration
git add . && npx lint-staged

# Format and see what changes (if any)
bun format
```

## Migration Notes

### Recent Changes
- **Removed test files from Biome ignore list** - Tests are now formatted like all other code
- **Added comprehensive test file linting** - All test types covered with appropriate rules
- **Unified lint-staged configuration** - Consistent tool application across all file types
- **Eliminated special-case scripts** - All code treated equally through standard commands
- **Removed format:check script** - Biome is fast enough to format directly

### Breaking Changes
- Test files are now subject to the same formatting rules as source code
- Mock files are now processed by both tools with appropriate rule configurations
- Stricter import organization requirements apply to all files
- No separate tooling workflows - everything uses the same commands
- Format checking removed - formatting is applied directly for speed and simplicity

This policy ensures consistent, high-quality code across the entire LexiSynth codebase by treating all code equally, maintaining developer productivity and CI/CD efficiency without special cases.
