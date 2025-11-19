---
modified: 2025-10-27T20:14:25-03:00
---
# Artifacts for Agent-Driven Spec-First Development

A comprehensive artifact system for guiding coding agents through schema-first, property-based development of Effect applications.

## I. Primary Specification Artifacts

### A. **Schema Specification Document (SSR - Schema Specification Record)**

The **single source of truth** that agents must read before implementing anything.

```typescript
// specs/ProcessoJudicial.spec.ts

/**
 * SCHEMA SPECIFICATION RECORD (SSR)
 * 
 * Status: APPROVED
 * Version: 1.0.0
 * Owner: Oscar
 * Last Updated: 2024-10-27
 * 
 * PURPOSE:
 * Define the canonical representation of a legal processo in Brazilian courts.
 * This schema must handle CNJ numbering standards and support DataJud integration.
 * 
 * BUSINESS CONTEXT:
 * - Used across Research Squad for case tracking
 * - Must integrate with Pangea library for DataJud/BNP queries
 * - Critical for legal analysis - errors can have legal consequences
 * 
 * INVARIANTS:
 * 1. NumeroProcesso MUST follow CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO
 * 2. Movimentacoes MUST be ordered chronologically (ascending)
 * 3. Status transitions MUST follow legal workflow (see state diagram)
 * 4. At least one parte with tipo='autor' MUST exist
 * 5. CreatedAt <= UpdatedAt always
 * 
 * VALIDATION REQUIREMENTS:
 * - All dates must be valid and not in future
 * - CPF/CNPJ must pass validation algorithms
 * - Tribunal codes must match official CNJ list
 * 
 * DEPENDENCIES:
 * - None (this is a root schema)
 * 
 * RELATED SCHEMAS:
 * - Movimentacao.spec.ts
 * - Parte.spec.ts
 * - Tribunal.spec.ts
 */

import * as S from "@effect/schema/Schema";

// Implementation follows below
// Agent: Implement this EXACTLY as specified
// Agent: Run schema validation tests after implementation
// Agent: Generate arbitraries from this schema

export const NumeroProcessoSchema = S.String.pipe(
  S.pattern(
    /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/,
    {
      title: "NumeroProcesso",
      description: "CNJ standard process number format",
      examples: ["1234567-89.2024.1.01.0001"]
    }
  ),
  S.brand("NumeroProcesso")
);

// ... rest of implementation
```

**Agent Guidance Embedded:**

```typescript
/**
 * @agent-instruction
 * 1. Read this entire file before implementing
 * 2. Implement in this exact order:
 *    a. Type definitions
 *    b. Schema definitions
 *    c. Validation functions
 *    d. Constructor methods
 * 3. After implementation, run: npm run schema:validate
 * 4. Generate test arbitraries: npm run schema:gen-arbitrary
 * 5. Verify all INVARIANTS are enforced by schema
 * 
 * @agent-constraints
 * - DO NOT use 'any' or 'unknown' types
 * - DO NOT make nullable without explicit S.optional
 * - DO NOT add fields not in this spec (ask human first)
 * - MUST use branded types for domain primitives
 * 
 * @agent-validation
 * After implementation, verify:
 * - [ ] All TypeScript errors resolved
 * - [ ] Schema compiles and exports correctly
 * - [ ] All invariants have corresponding schema refinements
 * - [ ] Example values in docstrings decode successfully
 */
```

---

### B. **Property Specification Document (PSR - Property Specification Record)**

Formal specification of laws/properties the system must satisfy.

```typescript
// specs/ProcessoService.properties.spec.ts

/**
 * PROPERTY SPECIFICATION RECORD (PSR)
 * 
 * Service: ProcessoService
 * Status: APPROVED
 * Criticality: HIGH (legal domain - correctness critical)
 * 
 * This document specifies ALL properties that any implementation
 * of ProcessoService MUST satisfy. These are executable specifications.
 * 
 * TESTING STRATEGY:
 * - Run against in-memory fake: 1000 runs
 * - Run against live implementation: 100 runs (slower)
 * - Must pass before merging to main
 * 
 * @agent-instruction
 * 1. Read ProcessoService.spec.ts first
 * 2. Implement each property as a fast-check test
 * 3. Properties should test behavior, not implementation
 * 4. Use provided arbitraries from schema
 * 5. Each property must have clear failure messages
 */

import * as fc from "fast-check";
import { ProcessoJudicialArbitrary } from "../arbitraries";

/**
 * PROPERTY 1: Idempotency Law
 * 
 * ∀ request. buscar(request) ≡ buscar(request) >> buscar(request)
 * 
 * RATIONALE:
 * Multiple queries for same processo must return identical results.
 * Critical for caching and retry logic.
 * 
 * FAILURE MODES TO TEST:
 * - Network retries shouldn't change result
 * - Cache hits vs misses should be transparent
 * 
 * @agent-implementation-guide
 * ```typescript
 * fc.assert(
 *   fc.asyncProperty(
 *     requestArbitrary,
 *     async (request) => {
 *       const first = await service.buscar(request);
 *       const second = await service.buscar(request);
 *       expect(first).toEqual(second);
 *     }
 *   ),
 *   { numRuns: 1000 }
 * );
 * ```
 */
export const IdempotencyProperty = {
  name: "buscar-idempotency",
  law: "buscar(x) ≡ buscar(x) >> buscar(x)",
  numRuns: 1000,
  importance: "CRITICAL",
  
  // Agent: implement this function
  test: (service: ProcessoService) => 
    fc.asyncProperty(/* ... */)
};

/**
 * PROPERTY 2: Roundtrip Law
 * 
 * ∀ processo. save(processo) >> buscar(processo.id) ≡ Right(processo)
 * 
 * RATIONALE:
 * Data persistence must not lose or corrupt information.
 * 
 * EDGE CASES:
 * - Large movimentacoes arrays (>1000 items)
 * - Special characters in text fields
 * - Timezone handling in dates
 * 
 * @agent-implementation-guide
 * Save a processo, retrieve it, verify equality.
 * Use deep equality, not reference equality.
 * Pay attention to Date serialization.
 */
export const RoundtripProperty = {
  name: "save-buscar-roundtrip",
  law: "save(x) >> buscar(x.id) ≡ Right(x)",
  numRuns: 500,
  importance: "CRITICAL",
  
  preconditions: [
    "processo must be valid per schema",
    "database must be empty or isolated per test"
  ],
  
  test: (service: ProcessoService) => 
    fc.asyncProperty(/* ... */)
};

/**
 * PROPERTY 3: Error Determinism
 * 
 * ∀ invalidInput. decode(invalidInput) ≡ Left(ParseError)
 * 
 * RATIONALE:
 * Invalid inputs must ALWAYS fail at schema boundary, never
 * cause runtime exceptions in business logic.
 * 
 * @agent-implementation-guide
 * Generate invalid inputs that violate schema constraints.
 * Verify they fail with ParseError, not with runtime exception.
 */
export const ErrorDeterminismProperty = {
  name: "invalid-input-determinism",
  law: "invalid(x) => Left(ParseError)",
  numRuns: 1000,
  importance: "HIGH",
  
  // Agent: use fc.anything() and filter to get invalid inputs
  test: (service: ProcessoService) => 
    fc.asyncProperty(/* ... */)
};

/**
 * PROPERTY 4: Monotonicity (Temporal)
 * 
 * ∀ processo. ∀ i < j. processo.movimentacoes[i].data ≤ processo.movimentacoes[j].data
 * 
 * RATIONALE:
 * Legal proceedings have temporal order. Movimentacoes must
 * always be chronologically ordered.
 * 
 * @agent-implementation-guide
 * Generate processo with movimentacoes, verify ordering.
 * This is a schema-level property - should be impossible
 * to construct invalid processo.
 */
export const TemporalMonotonicityProperty = {
  name: "movimentacoes-chronological",
  law: "∀i<j. mov[i].data ≤ mov[j].data",
  numRuns: 1000,
  importance: "CRITICAL",
  
  test: (schema: typeof ProcessoJudicial) => 
    fc.property(/* ... */)
};

// Export all properties for test runner
export const AllProperties = [
  IdempotencyProperty,
  RoundtripProperty,
  ErrorDeterminismProperty,
  TemporalMonotonicityProperty,
  // ... more properties
] as const;

/**
 * @agent-checklist
 * After implementing property tests:
 * - [ ] All properties pass with in-memory fake
 * - [ ] All properties pass with live implementation
 * - [ ] Property failures have clear error messages
 * - [ ] Shrinking produces minimal failing examples
 * - [ ] Coverage: all public methods have ≥1 property
 */
```

---

### C. **Implementation Guide Document (IGD)**

Step-by-step instructions for agents implementing services.

````typescript
// guides/ServiceImplementation.guide.md

/**
 * SERVICE IMPLEMENTATION GUIDE
 * 
 * For AI Agents: This document provides the canonical workflow
 * for implementing Effect services in this codebase.
 * 
 * FOLLOW THESE STEPS IN ORDER. DO NOT SKIP STEPS.
 */

## Step 1: Read Specifications

**Agent Checklist:**
- [ ] Read and understand SSR (Schema Specification Record)
- [ ] Read and understand PSR (Property Specification Record)
- [ ] Review related schema dependencies
- [ ] Check existing similar implementations for patterns

**Files to Read:**
1. `specs/[ServiceName].spec.ts` - Schema definitions
2. `specs/[ServiceName].properties.spec.ts` - Property laws
3. `docs/domain/[Domain].md` - Business context
4. `examples/[ServiceName].example.ts` - Usage examples

## Step 2: Implement Schema First

```typescript
// schemas/ProcessoService.ts

// Agent: Start here, implement in this exact order:

// 1. Import dependencies
import * as S from "@effect/schema/Schema";
import { Context, Effect } from "effect";

// 2. Define request/response schemas
export class BuscarProcessoRequest extends S.Class<BuscarProcessoRequest>(
  "BuscarProcessoRequest"
)({
  // Agent: Use specifications from SSR
  // Agent: Add JSDoc with business meaning
  // Agent: Use branded types for IDs
}) {}

// 3. Define error schemas (tagged for pattern matching)
export class ProcessoNaoEncontrado extends S.TaggedError<ProcessoNaoEncontrado>()(
  "ProcessoNaoEncontrado",
  {
    // Agent: Include all context needed for debugging
    // Agent: Add timestamp for observability
  }
) {}

// 4. Define service interface
export class ProcessoService extends Context.Tag("ProcessoService")
  ProcessoService,
  {
    readonly buscar: (
      req: BuscarProcessoRequest
    ) => Effect.Effect<ProcessoJudicial, ProcessoNaoEncontrado | ErroConexao>;
  }
>() {}
````

**Agent Verification:**

```bash
# Run after implementing schemas
npm run schema:validate
npm run type-check
```

## Step 3: Generate Test Arbitraries

```typescript
// Agent: Auto-generate from schema
npm run schema:gen-arbitrary

// This creates:
// __tests__/arbitraries/ProcessoService.arbitrary.ts

// Agent: Review generated arbitraries and customize if needed
```

## Step 4: Implement Property Tests

```typescript
// __tests__/properties/ProcessoService.properties.ts

// Agent: For each property in PSR:

import { AllProperties } from "../../specs/ProcessoService.properties.spec";

describe("ProcessoService Properties", () => {
  AllProperties.forEach((prop) => {
    it(`satisfies ${prop.name}`, () => {
      // Agent: Implement based on prop.test specification
      fc.assert(
        prop.test(/* provide service layer */),
        { numRuns: prop.numRuns }
      );
    });
  });
});
```

## Step 5: Implement In-Memory Fake

**Agent Instructions:**

```typescript
// services/ProcessoService.fake.ts

/**
 * @agent-implementation-notes
 * 
 * PURPOSE: Fast, deterministic fake for testing
 * 
 * REQUIREMENTS:
 * - Use Effect.Ref for state management
 * - No side effects outside Effect context
 * - Include inspection methods (prefixed with _)
 * - Must satisfy ALL properties in PSR
 * 
 * PATTERN:
 * 1. Create Ref for state storage
 * 2. Implement each method from service interface
 * 3. Add test helpers (_save, _clear, _count, etc.)
 * 4. Export as Layer
 */

export const makeInMemoryProcessoService = Effect.gen(function* () {
  // Agent: Use Map for key-value storage
  const store = yield* Ref.make(new Map<ProcessoId, ProcessoJudicial>());
  
  return ProcessoService.of({
    buscar: (req) =>
      Effect.gen(function* () {
        // Agent: Implement lookup logic
        // Agent: Return typed errors, never throw
        // Agent: Include validation at boundaries
      }),
    
    // Agent: Add test helpers (not in public interface)
    _save: (processo) => 
      Ref.update(store, map => map.set(processo.id, processo)),
    
    _clear: () => 
      Ref.set(store, new Map()),
    
    _count: () => 
      Ref.get(store).pipe(Effect.map(m => m.size))
  });
});

export const ProcessoServiceTest = Layer.effect(
  ProcessoService,
  makeInMemoryProcessoService
);
```

**Agent Verification:**

```bash
# Run property tests against fake
npm run test:properties -- ProcessoService
# Expected: All tests pass
```

## Step 6: Implement Example-Based Tests

```typescript
// __tests__/unit/ProcessoService.test.ts

/**
 * @agent-instruction
 * 
 * Example tests complement property tests by testing:
 * - Specific edge cases from requirements
 * - Error messages and formatting
 * - Integration with other services
 * - Performance characteristics
 * 
 * DO NOT duplicate property tests here.
 */

describe("ProcessoService", () => {
  const runTest = <A, E>(effect: Effect.Effect<A, E>) =>
    effect.pipe(
      Effect.provide(ProcessoServiceTest),
      Effect.runPromise
    );
  
  // Agent: implement tests from requirements
  // Agent: use builders for test data
  // Agent: test one thing per test
  // Agent: use descriptive test names
});
```

## Step 7: Implement Production Version

```typescript
// services/ProcessoService.live.ts

/**
 * @agent-implementation-notes
 * 
 * PURPOSE: Production implementation with external dependencies
 * 
 * REQUIREMENTS:
 * - Must satisfy same properties as fake
 * - Include proper error handling
 * - Add retry logic for transient errors
 * - Include timeout handling
 * - Add metrics/logging
 * 
 * DEPENDENCIES:
 * - HttpClient for external APIs
 * - Cache for performance
 * - Config for environment-specific settings
 * - Logger for observability
 */

export const makeProcessoServiceLive = Effect.gen(function* () {
  // Agent: Acquire dependencies from context
  const httpClient = yield* HttpClient;
  const cache = yield* Cache;
  const config = yield* ProcessoServiceConfig;
  const logger = yield* Logger;
  
  return ProcessoService.of({
    buscar: (req) =>
      Effect.gen(function* () {
        // Agent: Implement with this structure:
        // 1. Log request
        // 2. Check cache
        // 3. If miss, fetch from external API
        // 4. Decode response with schema
        // 5. Update cache
        // 6. Log result
        // 7. Return
        
        // Agent: Use pipe for transformations
        // Agent: Map errors to typed error types
        // Agent: Add retry for retryable errors
      }).pipe(
        Effect.timeout(Duration.seconds(30)),
        Effect.retry({
          schedule: Schedule.exponential(Duration.seconds(1)),
          times: 3,
          while: (error) => isRetryable(error)
        }),
        Effect.tap(() => 
          logger.info(`Fetched processo ${req.numero}`)
        ),
        Effect.tapError((error) =>
          logger.error(`Failed to fetch processo: ${error}`)
        )
      )
  });
});
```

## Step 8: Contract Testing

```typescript
// __tests__/contract/ProcessoService.contract.ts

/**
 * @agent-instruction
 * 
 * Run same property tests against BOTH implementations
 * to verify they satisfy same contract.
 */

import { AllProperties } from "../../specs/ProcessoService.properties.spec";

const testContract = (
  layer: Layer.Layer<ProcessoService>,
  name: string
) => {
  describe(`${name} - Contract Tests`, () => {
    AllProperties.forEach((prop) => {
      it(`satisfies ${prop.name}`, () => {
        fc.assert(
          prop.test(layer),
          { numRuns: prop.numRuns }
        );
      });
    });
  });
};

// Agent: Test both implementations
testContract(ProcessoServiceTest, "In-Memory");
testContract(ProcessoServiceLive, "Production");
```

## Step 9: Documentation

```typescript
/**
 * @agent-instruction
 * 
 * Generate documentation in this order:
 * 1. API documentation (from schemas)
 * 2. Usage examples
 * 3. Integration guide
 * 4. Error handling guide
 */

// Generate API docs
npm run docs:generate

// Agent: Write usage examples in docs/examples/
// Agent: Include common patterns and gotchas
```

## Step 10: Final Verification

**Agent Checklist:**

```bash
# Run all tests
npm run test

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# Generate coverage
npm run test:coverage

# Verify coverage thresholds met
```

**Quality Gates:**

- [ ] All property tests pass (fake and live)
- [ ] All unit tests pass
- [ ] Type checking passes with no errors
- [ ] Linting passes
- [ ] Test coverage ≥ 80%
- [ ] All public methods documented
- [ ] Integration tests pass
- [ ] No TODOs or FIXMEs in code

**Agent: If any checklist item fails, fix before proceeding.**

````

---

## II. Context & Domain Knowledge Artifacts

### D. **Domain Context Document (DCD)**

```markdown
<!-- docs/domain/ProcessosJudiciais.md -->

# Domain Context: Processos Judiciais Brasileiros

**For AI Agents:** This document provides essential Brazilian legal context.
Read this BEFORE implementing any processo-related features.

## Business Context

### What is a Processo Judicial?

A processo judicial is a legal case in Brazilian courts. Every processo has:
- Unique CNJ number (national standard)
- Parties (autor, réu, terceiros)
- Timeline of movimentações (procedural events)
- Current status (ativo, arquivado, etc.)

### Critical Requirements

1. **CNJ Numbering Standard**
   - Format: NNNNNNN-DD.AAAA.J.TR.OOOO
   - DD is check digit (validate using algorithm)
   - AAAA is year (must be valid year)
   - J is judicial segment (1-9)
   - TR is tribunal code (01-99)
   - OOOO is origin (court location)

2. **Legal Workflow**
````

[Draft] → [Ativo] → [Suspenso] ⟷ [Ativo] ↓ [Transitado em Julgado] ↓ [Arquivado]

```

**Agent Note:** Status transitions are legally significant.
Invalid transitions can indicate data corruption or fraud.

3. **Movimentações**
- Always chronologically ordered
- Immutable once created
- May include documents (PDFs)
- Types defined by CNJ taxonomy

### Data Sources

- **DataJud**: CNJ's official database (via Pangea library)
- **BNP**: Banco Nacional de Precedentes
- **Tribunal APIs**: Each tribunal has own API

**Agent Note:** Never mix data from different sources without
reconciliation. Data may be inconsistent.

### Common Gotchas

1. **Timezone Issues**
- All dates should be in America/Sao_Paulo
- Court hours: 6am-8pm (relevant for deadlines)

2. **CPF/CNPJ Validation**
- Must validate check digits
- May be masked in some contexts (privacy)

3. **Special Characters**
- Legal text uses special chars (§, º, ª)
- Must handle Portuguese accents correctly

4. **Pagination**
- Movimentações can be 10,000+ items
- Always paginate, never load all at once

## Related Documents

- [DataJud Integration Guide](./DataJud.md)
- [Pangea Library Documentation](./Pangea.md)
- [Legal Terminology](./Glossary.md)
```

---

### E. **Architecture Decision Records (ADRs)**

````markdown
<!-- docs/adr/0003-schema-first-development.md -->

# ADR 0003: Schema-First Development with Effect-TS

**Status:** ACCEPTED  
**Date:** 2024-10-27  
**Deciders:** Oscar  
**For AI Agents:** Read this to understand WHY we use schema-first approach

## Context

We need a development approach that:
- Catches errors early (compile-time > runtime)
- Supports complex legal domain
- Enables property-based testing
- Works well with AI coding agents

## Decision

We will use schema-first development with @effect/schema as the
foundation for all services and domain models.

## Rationale

### For AI Agents

Schema-first development helps agents because:

1. **Unambiguous Specifications**
   - Schema IS the specification
   - No interpretation needed
   - Executable and testable

2. **Type Safety**
   - Compiler catches type errors
   - No runtime type bugs
   - Refactoring is safe

3. **Automatic Derivation**
   - Arbitraries generated from schemas
   - Codecs generated automatically
   - Encoders/decoders validated

4. **Contract Testing**
   - Same schema = same contract
   - Easy to verify implementations match

## Implementation Pattern

### Step 1: Define Schema
```typescript
export const UserSchema = S.Struct({
  id: UserId,
  email: S.String.pipe(S.email()),
  // ...
});
````

### Step 2: Properties

```typescript
// Email format is always valid
it("prop: decoded users have valid emails", () =>
  fc.assert(
    fc.property(
      userArbitrary,
      (user) => validateEmail(user.email)
    )
  )
);
```

### Step 3: Implementation

```typescript
// Implementation must satisfy schema
const user = yield* S.decode(UserSchema)(data);
// Can't be wrong - type system enforces it
```

## Consequences

### Positive

- **Agents can validate their work**: Run schema tests
- **Clear boundaries**: Schema = API contract
- **Refactoring safety**: Types enforce correctness
- **Property testing**: Auto-generated arbitraries

### Negative

- **Learning curve**: Agents must understand Effect + Schema
- **Verbose**: More code than untyped approach
- **Migration**: Existing code needs migration

## For Agents: Key Takeaways

1. ALWAYS start with schema definition
2. Use schemas for validation at boundaries
3. Generate arbitraries from schemas
4. Test properties, not just examples
5. Trust the type system - if it compiles, it's likely correct

## References

- [Schema Specification Record Template](https://claude.ai/templates/SSR.template.ts)
- [Property Specification Record Template](https://claude.ai/templates/PSR.template.ts)
- [@effect/schema Documentation](https://effect.website/docs/schema)

````

---

## III. Agent Interaction Artifacts

### F. **Agent Prompt Templates**

```markdown
<!-- prompts/implement-service.prompt.md -->

# Prompt Template: Implement Effect Service

**Purpose:** Guide AI agent through implementing a new Effect service

---

## Initial Prompt

````

I need you to implement the [SERVICE_NAME] service according to our schema-first, property-based development workflow.

Before starting, please:

1. Read these specification files:
	
	- specs/[SERVICE_NAME].spec.ts (Schema Specification Record)
	- specs/[SERVICE_NAME].properties.spec.ts (Property Specification Record)
	- docs/domain/[DOMAIN].md (Domain Context)
2. Confirm you understand:
	
	- The business purpose of this service
	- The schema contracts (request/response/errors)
	- The properties that must hold
	- The dependencies required
3. Show me your implementation plan before writing code

After confirmation, implement in this order:

1. Schema definitions
2. Property test suite
3. In-memory fake implementation
4. Example-based tests
5. Production implementation
6. Contract tests

Use the Implementation Guide at guides/ServiceImplementation.guide.md

Let me know when you're ready to start.

```

---

## Follow-up Prompts

### Verification Prompt
```

Now that you've implemented [COMPONENT], please verify:

1. Run tests: `npm run test:properties -- [SERVICE]`
2. Check types: `npm run type-check`
3. Review checklist in guides/ServiceImplementation.guide.md Step 10

Share the results and any failures.

```

### Refinement Prompt
```

The property test [PROPERTY_NAME] is failing with this error: [ERROR_OUTPUT]

Please:

1. Analyze why this property is failing
2. Check if it's a bug in implementation or test
3. Refer to the PSR to verify property specification
4. Fix the issue
5. Verify all properties still pass

```

### Integration Prompt
```

Now integrate [SERVICE_A] with [SERVICE_B] by:

1. Review both service schemas for compatibility
2. Create integration test in **tests**/integration/
3. Implement integration using Effect composition
4. Verify properties hold for composed system

Reference: guides/ServiceComposition.guide.md

```

---

## Error Recovery Prompts

### Schema Validation Failure
```

Schema validation failed with error: [ERROR]

Please:

1. Check specs/[SERVICE].spec.ts for correct schema definition
2. Verify your implementation matches the specification exactly
3. Run `npm run schema:validate` to check for schema errors
4. Fix and re-run tests

```

### Property Test Failure
```

Property [PROPERTY_NAME] failed after [N] runs with counterexample: [COUNTEREXAMPLE]

This indicates a bug. Please:

1. Read the property specification in PSR
2. Analyze the counterexample (minimal failing case)
3. Determine if bug is in implementation or property definition
4. Fix the bug
5. Verify the property now passes
6. Check if other properties are affected

---

### G. **Agent Task Specification (ATS)**

```yaml
# tasks/implement-processo-service.yaml

# AGENT TASK SPECIFICATION (ATS)
# This is a machine-readable task specification for AI agents

task:
  id: "PROC-SERVICE-001"
  name: "Implement ProcessoService"
  type: "service-implementation"
  status: "pending"
  priority: "high"
  estimated_complexity: "medium"

context:
  domain: "processos-judiciais"
  criticality: "high"  # Legal domain - errors have consequences
  dependencies:
    - "schemas/ProcessoJudicial.ts"
    - "schemas/NumeroProcesso.ts"
  related_tasks:
    - "PROC-REPO-001"  # Must complete first
  
specifications:
  schema: "specs/ProcessoService.spec.ts"
  properties: "specs/ProcessoService.properties.spec.ts"
  domain_context: "docs/domain/ProcessosJudiciais.md"
  examples: "examples/ProcessoService.example.ts"

implementation_steps:
  - id: "1"
    name: "Read specifications"
    required_files:
      - "specs/ProcessoService.spec.ts"
      - "specs/ProcessoService.properties.spec.ts"
      - "docs/domain/ProcessosJudiciais.md"
    verification:
      - "agent confirms understanding of business requirements"
      - "agent can explain key invariants"
    
  - id: "2"
    name: "Implement schemas"
    output_files:
      - "schemas/ProcessoService.ts"
    verification:
      command: "npm run schema:validate"
      must_pass: true
    
  - id: "3"
    name: "Generate arbitraries"
    command: "npm run schema:gen-arbitrary"
    output_files:
      - "__tests__/arbitraries/ProcessoService.arbitrary.ts"
    
  - id: "4"
    name: "Implement property tests"
    output_files:
      - "__tests__/properties/ProcessoService.properties.ts"
    verification:
      command: "npm run test:properties -- ProcessoService"
      expected_result: "fail"  # Should fail before implementation
    
  - id: "5"
    name: "Implement in-memory fake"
    output_files:
      - "services/ProcessoService.fake.ts"
    verification:
      command: "npm run test:properties -- ProcessoService"
      expected_result: "pass"  # Should pass with fake
      must_pass: true
    
  - id: "6"
    name: "Implement example tests"
    output_files:
      - "__tests__/unit/ProcessoService.test.ts"
    verification:
      command: "npm run test:unit -- ProcessoService"
      must_pass: true
    
  - id: "7"
    name: "Implement production version"
    output_files:
      - "services/ProcessoService.live.ts"
    dependencies:
      - "HttpClient"
      - "Cache"
      - "Config"
      - "Logger"
    
  - id: "8"
    name: "Implement contract tests"
    output_files:
      - "__tests__/contract/ProcessoService.contract.ts"
    verification:
      command: "npm run test:contract -- ProcessoService"
      must_pass: true
    
  - id: "9"
    name: "Final verification"
    verification:
      commands:
        - command: "npm run test"
          must_pass: true
        - command: "npm run type-check"
          must_pass: true
        - command: "npm run lint"
          must_pass: true
        - command: "npm run build"
          must_pass: true

quality_gates:
  - name: "All property tests pass"
    check: "test:properties"
    required: true
  
  - name: "Type safety"
    check: "type-check"
    required: true
  
  - name: "Test coverage"
    check: "test:coverage"
    threshold: 80
    required: true
  
  - name: "No linting errors"
    check: "lint"
    required: true

agent_constraints:
  - "MUST NOT use 'any' or 'unknown' types"
  - "MUST NOT skip property tests"
  - "MUST follow Effect patterns (no promises, callbacks)"
  - "MUST use branded types for domain primitives"
  - "MUST handle all errors in Effect error channel"
  - "MUST add JSDoc to all public APIs"

success_criteria:
  - "All tests pass (unit, property, contract)"
  - "Types check with no errors"
  - "Fake and live implementations pass same properties"
  - "Code follows style guide"
  - "Documentation complete"
  - "All quality gates pass"

on_failure:
  - "Review error output"
  - "Check relevant specification files"
  - "Consult implementation guide"
  - "Ask human for clarification if stuck"

metadata:
  created_by: "Oscar"
  created_at: "2024-10-27"
  assigned_to: "claude-agent"
  estimated_hours: 4
```

---

### H. **Verification Checklist**

```markdown
<!-- checklists/service-implementation.checklist.md -->

# Service Implementation Verification Checklist

**For AI Agents:** Complete this checklist after implementing a service.
Do not mark task complete until ALL items are checked.

## Phase 1: Specification Understanding

- [ ] Read and understood SSR (Schema Specification Record)
- [ ] Read and understood PSR (Property Specification Record)  
- [ ] Read and understood domain context document
- [ ] Reviewed similar existing implementations
- [ ] Can explain business purpose in own words
- [ ] Can list all key invariants
- [ ] Identified all dependencies

## Phase 2: Schema Implementation

- [ ] Defined all request schemas
- [ ] Defined all response schemas
- [ ] Defined all error schemas (tagged errors)
- [ ] Defined service interface with Context.Tag
- [ ] Added JSDoc comments with business meaning
- [ ] Used branded types for domain primitives
- [ ] No 'any' or 'unknown' types used
- [ ] Schema validation command passes: `npm run schema:validate`
- [ ] Types check: `npm run type-check`

## Phase 3: Property Tests

- [ ] Generated arbitraries from schemas
- [ ] Implemented all properties from PSR
- [ ] Each property has clear name and description
- [ ] Each property has appropriate numRuns
- [ ] Property failures produce minimal counterexamples
- [ ] Properties test behavior, not implementation
- [ ] Properties initially fail (before implementation)

## Phase 4: In-Memory Fake

- [ ] Used Effect.Ref for state management
- [ ] No side effects outside Effect context
- [ ] Implements complete service interface
- [ ] Added test helper methods (prefixed with _)
- [ ] Exported as Layer
- [ ] Property tests pass: `npm run test:properties -- [Service]`
- [ ] Unit tests pass: `npm run test:unit -- [Service]`

## Phase 5: Production Implementation

- [ ] Acquired all dependencies from context
- [ ] Added proper error handling (no throws)
- [ ] Mapped external errors to typed errors
- [ ] Added timeout handling
- [ ] Added retry logic for transient errors
- [ ] Added caching where appropriate
- [ ] Added logging for observability
- [ ] Added metrics recording
- [ ] Used Effect.pipe for transformations
- [ ] No promises or callbacks (pure Effect code)

## Phase 6: Contract Tests

- [ ] Created contract test file
- [ ] Tests run against BOTH implementations
- [ ] All properties pass for fake implementation
- [ ] All properties pass for live implementation
- [ ] Contract tests pass: `npm run test:contract -- [Service]`

## Phase 7: Documentation

- [ ] All public methods have JSDoc
- [ ] JSDoc includes @example where helpful
- [ ] JSDoc documents error cases
- [ ] Created usage example file
- [ ] Updated relevant domain documentation
- [ ] Added integration guide if needed

## Phase 8: Integration

- [ ] Service integrates with existing system
- [ ] Created test layer composition
- [ ] Integration tests pass
- [ ] No circular dependencies

## Phase 9: Final Verification

### Tests
- [ ] All unit tests pass: `npm run test:unit`
- [ ] All property tests pass: `npm run test:properties`
- [ ] All contract tests pass: `npm run test:contract`
- [ ] All integration tests pass: `npm run test:integration`
- [ ] All tests pass: `npm run test`

### Code Quality
- [ ] Type checking passes: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Test coverage ≥ 80%: `npm run test:coverage`

### Code Review
- [ ] No TODOs or FIXMEs in committed code
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Follows project style guide
- [ ] No duplicated code
- [ ] Proper error messages (helpful for debugging)

### Performance
- [ ] No obvious performance issues
- [ ] Appropriate use of caching
- [ ] Pagination implemented where needed
- [ ] No N+1 query patterns

## Phase 10: Handoff

- [ ] All quality gates passed
- [ ] Generated documentation reviewed
- [ ] Ready for human code review
- [ ] Confidence level: ____/10

## Notes

[Agent: Add any notes, concerns, or questions here]

---

**Agent Signature:** [Agent Name/Version]  
**Completion Date:** [Date]  
**Time Spent:** [Hours]
```

---

## IV. Progressive Development Artifacts

### I. **Feature Specification Document (FSD)**

```typescript
// specs/features/multi-agent-research.feature.spec.ts

/**
 * FEATURE SPECIFICATION DOCUMENT (FSD)
 * 
 * Feature: Multi-Agent Research System
 * Epic: Research Squad
 * Status: PLANNING
 * 
 * This document specifies a complex feature that will be built
 * progressively using validated abstractions.
 * 
 * @agent-workflow
 * This feature will be implemented in phases. Each phase builds
 * on validated abstractions from previous phases.
 */

export const MultiAgentResearchFeature = {
  name: "Multi-Agent Research System",
  description: "Coordinate multiple AI agents to research legal topics",
  
  // Phase 1: Foundation (implement first)
  phase1: {
    name: "Single Agent Query",
    components: [
      "QuerySchema",
      "ResponseSchema",
      "SingleAgentService"
    ],
    properties: [
      "query-response-roundtrip",
      "query-validation",
      "response-formatting"
    ],
    completion_criteria: [
      "Can execute single query successfully",
      "All properties satisfied",
      "Response format validated"
    ]
  },
  
  // Phase 2: Multi-Agent (builds on Phase 1)
  phase2: {
    name: "Agent Coordination",
    dependencies: ["phase1"],  // Must complete first
    components: [
      "AgentCoordinator",
      "TaskDistribution",
      "ResultAggregation"
    ],
    properties: [
      "work-distribution-fairness",
      "no-duplicate-work",
      "result-consistency"
    ],
    completion_criteria: [
      "Multiple agents can work in parallel",
      "Results aggregate correctly",
      "No race conditions"
    ]
  },
  
  // Phase 3: Advanced Features (builds on Phase 2)
  phase3: {
    name: "Advanced Coordination",
    dependencies: ["phase1", "phase2"],
    components: [
      "DynamicTaskAllocation",
      "AgentSpecialization",
      "QualityScoring"
    ],
    properties: [
      "optimal-task-allocation",
      "specialist-assignment-correctness",
      "quality-score-monotonicity"
    ]
  }
};

/**
 * @agent-instructions
 * 
 * Implement phases IN ORDER.
 * Do not proceed to next phase until:
 * 1. All components implemented
 * 2. All properties satisfied
 * 3. All tests passing
 * 4. Human approves phase completion
 */
```

---

### J. **Composition Specification (CS)**

```typescript
// specs/compositions/research-pipeline.composition.spec.ts

/**
 * COMPOSITION SPECIFICATION (CS)
 * 
 * Specifies how validated components compose into larger systems.
 * 
 * @agent-instruction
 * All components referenced here MUST be individually validated
 * before composition. Check that each component:
 * - Has passing property tests
 * - Has contract tests
 * - Is documented
 */

export const ResearchPipelineComposition = {
  name: "Legal Research Pipeline",
  
  // Components (all must be validated)
  components: {
    query: {
      service: "QueryService",
      validated: true,  // Agent: verify this
      properties_satisfied: ["query-validation", "query-normalization"]
    },
    
    search: {
      service: "SearchService",
      validated: true,
      properties_satisfied: ["search-determinism", "result-ranking"]
    },
    
    enrich: {
      service: "EnrichmentService",
      validated: true,
      properties_satisfied: ["enrichment-idempotency", "data-consistency"]
    },
    
    analyze: {
      service: "AnalysisService",
      validated: true,
      properties_satisfied: ["analysis-correctness", "confidence-calibration"]
    }
  },
  
  // Composition properties (emergent properties of composition)
  composition_properties: [
    {
      name: "pipeline-associativity",
      law: "(query >> search) >> (enrich >> analyze) ≡ query >> (search >> enrich) >> analyze",
      test: "composition-tests/associativity.test.ts"
    },
    {
      name: "pipeline-determinism",
      law: "Same input always produces same output",
      test: "composition-tests/determinism.test.ts"
    },
    {
      name: "pipeline-error-propagation",
      law: "Errors propagate correctly through pipeline",
      test: "composition-tests/error-propagation.test.ts"
    }
  ],
  
  // Integration points
  integration: {
    data_flow: `
      User Query
         ↓
      QueryService (normalize, validate)
         ↓
      SearchService (find relevant cases)
         ↓
      EnrichmentService (add metadata, context)
         ↓
      AnalysisService (extract insights)
         ↓
      Formatted Response
    `,
    
    error_handling: `
      Any step can fail with typed error.
      Pipeline short-circuits on error.
      Errors include context from all previous steps.
    `
  },
  
  // Implementation guide
  implementation: {
    pattern: "Effect composition with pipe",
    example: `
      const researchPipeline = (userQuery: string) =>
        Effect.gen(function* () {
          const query = yield* QueryService;
          const search = yield* SearchService;
          const enrich = yield* EnrichmentService;
          const analyze = yield* AnalysisService;
          
          const normalized = yield* query.normalize(userQuery);
          const results = yield* search.search(normalized);
          const enriched = yield* enrich.enrich(results);
          const analysis = yield* analyze.analyze(enriched);
          
          return analysis;
        });
    `,
    
    testing_strategy: `
      1. Unit test each component (already done)
      2. Integration test the composition
      3. Property test composition properties
      4. E2E test with real data
    `
  }
};
```

---

## V. Monitoring & Feedback Artifacts

### K. **Agent Performance Metrics**

```yaml
# metrics/agent-performance.yaml

# Track agent performance on spec-driven tasks
# Used to improve prompts and specifications

metrics:
  task_completion:
    - task_id: "PROC-SERVICE-001"
      agent: "claude-sonnet-4"
      duration_minutes: 45
      attempts: 1
      success: true
      quality_score: 9/10
      issues:
        - "Initially forgot to add test helpers"
        - "Fixed after checklist review"
      
    - task_id: "SEARCH-SERVICE-002"
      agent: "claude-sonnet-4"
      duration_minutes: 120
      attempts: 2
      success: true
      quality_score: 7/10
      issues:
        - "Didn't understand async property testing initially"
        - "Needed clarification on shrinking"
      
  common_errors:
    - error: "Skipping property tests"
      frequency: 3
      solution: "Added explicit checkpoint in checklist"
      
    - error: "Using 'any' types"
      frequency: 5
      solution: "Added type-check to quality gates"
      
    - error: "Not reading domain context"
      frequency: 2
      solution: "Made domain context reading first step in guide"
  
  specification_quality:
    - spec: "ProcessoService.spec.ts"
      clarity: 9/10
      completeness: 10/10
      agent_feedback: "Very clear, easy to follow"
      
    - spec: "SearchService.spec.ts"
      clarity: 6/10
      completeness: 8/10
      agent_feedback: "Unclear on pagination requirements"
      improvements_needed:
        - "Add explicit pagination examples"
        - "Clarify performance requirements"

improvement_areas:
  - "Add more examples to property specifications"
  - "Create video walkthrough of workflow"
  - "Add glossary of Effect patterns"
  - "Improve error message guidance"
```

---

## VI. Quick Reference for Agents

### L. **Agent Quick Start Card**

````markdown
<!-- docs/agent-quickstart.md -->

# Agent Quick Start: Implementing an Effect Service

## 🚦 Before You Start

1. **Read First:**
   - [ ] specs/[Service].spec.ts (SSR)
   - [ ] specs/[Service].properties.spec.ts (PSR)
   - [ ] docs/domain/[Domain].md

2. **Confirm Understanding:**
   - Can you explain the business purpose?
   - Can you list the key invariants?
   - Do you understand the error cases?

## 📋 Implementation Checklist

### 1. Schemas (30 min)
```bash
vim schemas/[Service].ts
npm run schema:validate
npm run type-check
````

### 2. Property Tests (45 min)

```bash
npm run schema:gen-arbitrary
vim __tests__/properties/[Service].properties.ts
npm run test:properties -- [Service]  # Should fail
```

### 3. In-Memory Fake (60 min)

```bash
vim services/[Service].fake.ts
npm run test:properties -- [Service]  # Should pass
```

### 4. Unit Tests (30 min)

```bash
vim __tests__/unit/[Service].test.ts
npm run test:unit -- [Service]
```

### 5. Production Implementation (90 min)

```bash
vim services/[Service].live.ts
```

### 6. Contract Tests (20 min)

```bash
vim __tests__/contract/[Service].contract.ts
npm run test:contract -- [Service]
```

### 7. Final Verification (10 min)

```bash
npm run test
npm run type-check
npm run lint
npm run build
npm run test:coverage
```

## ⚠️ Common Mistakes

❌ **Don't:** Skip property tests
✅ **Do:** Test properties for both fake and live

❌ **Don't:** Use `any` or `unknown` types
✅ **Do:** Use branded types for domain primitives

❌ **Don't:** Throw errors
✅ **Do:** Return typed errors in Effect error channel

❌ **Don't:** Use promises or callbacks
✅ **Do:** Use pure Effect composition

❌ **Don't:** Skip reading specs
✅ **Do:** Read ALL specs before coding

## 🆘 When Stuck

1. Check: guides/ServiceImplementation.guide.md
2. Review: similar existing service
3. Consult: docs/adr/ (Architecture Decision Records)
4. Ask: human for clarification

## ✅ Success Criteria

- [ ] All tests pass (run `npm test`)
- [ ] Types check (run `npm run type-check`)
- [ ] Coverage ≥ 80% (run `npm run test:coverage`)
- [ ] Checklist complete (checklists/service-implementation.checklist.md)
- [ ] No compiler warnings
- [ ] No linting errors

## 📚 Key Resources

- Implementation Guide: guides/ServiceImplementation.guide.md
- Schema Template: templates/SSR.template.ts
- Property Template: templates/PSR.template.ts
- Example Service: examples/ReferenceService.ts

```

---

## VII. Summary: Complete Agent Artifact Ecosystem

### Artifact Hierarchy

```

1. Specifications (What to build) ├── SSR: Schema Specification Record ├── PSR: Property Specification Record └── FSD: Feature Specification Document
	
2. Context (Why and how) ├── DCD: Domain Context Document ├── ADR: Architecture Decision Records └── IGD: Implementation Guide Document
	
3. Interaction (Working with agents) ├── Prompt Templates ├── ATS: Agent Task Specification └── Verification Checklists
	
4. Progressive Development ├── Feature Specifications └── Composition Specifications
	
5. Feedback Loop ├── Performance Metrics └── Improvement Tracking

````

### Recommended Workflow

```bash
# 1. Human creates specifications
./scripts/create-spec ProcessoService

# 2. Agent reads specs and confirms understanding
Agent: "I've read SSR, PSR, and domain docs. I understand..."

# 3. Agent follows Implementation Guide
Agent: "Starting Step 1: Implementing schemas..."

# 4. Agent completes checklist
Agent: "Checklist complete. All quality gates passed."

# 5. Human reviews
Human: "LGTM. Proceeding to next feature."

# 6. Metrics recorded for improvement
./scripts/record-metrics PROC-SERVICE-001 success
````

This artifact system ensures agents have **complete context**, **clear specifications**, and **automated verification** at every step, enabling confident development of complex Effect applications like Research Squad and Pangea.
