---
modified: 2025-10-27T20:27:43-03:00
---
# 🤖 Optimal Testing Pipelines for AI-driven Development

## Core Insight: Rethinking Sequential TDD for Parallel AI Development

The traditional TDD pipeline assumes:
- **Incremental learning** (human discovers requirements while coding)
- **Psychological feedback** (red/green dopamine hits)
- **Sequential thinking** (one thing at a time)
- **Implementation uncertainty** (need tests as safety net)

AI agents have different characteristics:
- ✅ **Holistic understanding** (can reason about entire system at once)
- ✅ **Parallel execution** (can work on multiple files simultaneously)
- ✅ **Exhaustive exploration** (can generate thousands of test cases)
- ✅ **No cognitive load** (doesn't tire from writing tests)
- ✅ **Specification-driven** (excels when given clear contracts)

---

## 🎯 Alternative Pipeline Architectures

### Architecture 1: **Specification-First Parallel Development**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: SPECIFICATION (5 minutes)                          │
│ Agent writes ALL contracts in one pass                      │
├─────────────────────────────────────────────────────────────┤
│ • Define errors (_Errors.ts)                                │
│ • Define models (_Models.ts)                                │
│ • Define ALL interfaces (Repository.ts, Service.ts, etc)    │
│ • Define invariants (.invariants.md)                        │
│ • Generate property test skeletons from invariants          │
│ EXIT: bun run validate:specification ✅                     │
└─────────────────────────────────────────────────────────────┘
      ↓ (PARALLEL BRANCHES)
      ├─────────────────────────────┐
      ↓                             ↓
┌──────────────────────┐   ┌──────────────────────┐
│ Branch A: FAKE       │   │ Branch B: PRODUCTION │
│ (Agent 1)            │   │ (Agent 2)            │
├──────────────────────┤   ├──────────────────────┤
│ • Implement fake     │   │ • Implement postgres │
│ • Write contract     │   │ • Wire dependencies  │
│   tests while coding │   │ • Write integration  │
│ • Write properties   │   │   tests              │
│ • Self-validate      │   │ • Self-validate      │
└──────────────────────┘   └──────────────────────┘
      ↓                             ↓
      └─────────────┬───────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: CONVERGENCE (10 minutes)                           │
│ Verify both implementations satisfy same properties         │
├─────────────────────────────────────────────────────────────┤
│ • Run contract tests against BOTH implementations           │
│ • Run property tests against BOTH implementations           │
│ • Compare behaviors (should be identical)                   │
│ • If divergence: analyze, fix, repeat                       │
│ EXIT: bun run validate:equivalence ✅                       │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: INTEGRATION (5 minutes)                            │
│ Wire everything together (now confident it works)           │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: ADVERSARIAL (20 minutes)                           │
│ Agent generates attacks, edge cases, chaos                  │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ No sequential bottleneck (fake doesn't gate production)
- ✅ Two implementations = mutation testing built-in
- ✅ Property tests catch divergence immediately
- ✅ Faster time-to-production (parallel work)

**Implementation:**

```typescript
// scripts/agent-pipeline.ts
import { Effect, Fiber } from "effect";

const runSpecificationPhase = Effect.gen(function* () {
  // Agent analyzes requirements
  // Generates ALL contracts at once
  yield* generateErrors();
  yield* generateModels();
  yield* generateInterfaces();
  yield* generateInvariants();
  yield* generatePropertySkeletons();
});

const runParallelImplementation = Effect.gen(function* () {
  // Fork two agents
  const fakeAgent = yield* Effect.fork(
    Effect.gen(function* () {
      yield* implementFake();
      yield* writeContractTests();
      yield* writePropertyTests();
      return "fake-complete";
    })
  );
  
  const prodAgent = yield* Effect.fork(
    Effect.gen(function* () {
      yield* implementProduction();
      yield* writeIntegrationTests();
      return "prod-complete";
    })
  );
  
  // Wait for both
  yield* Fiber.join(fakeAgent);
  yield* Fiber.join(prodAgent);
});

const runConvergenceValidation = Effect.gen(function* () {
  // Run SAME tests against both
  const fakeResults = yield* runContractTests("fake");
  const prodResults = yield* runContractTests("production");
  
  // Compare behaviors
  yield* assertEquivalent(fakeResults, prodResults);
});
```

---

### Architecture 2: **Property-First Generative Development**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: INVARIANT DISCOVERY (10 minutes)                   │
│ Agent mines/defines ALL properties first                    │
├─────────────────────────────────────────────────────────────┤
│ • Analyze domain requirements                               │
│ • Define mathematical properties (laws, invariants)         │
│ • Generate property test suite (1000+ tests)                │
│ • Generate example test cases from properties               │
│ • Generate type-level constraints from properties           │
│ EXIT: bun run validate:properties ✅                        │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: PROPERTY-DRIVEN CODEGEN (5 minutes)                │
│ Agent generates code that satisfies properties              │
├─────────────────────────────────────────────────────────────┤
│ • Generate types from constraints                           │
│ • Generate implementation from properties                   │
│ • Validate implementation against properties                │
│ • Refine until all properties pass                          │
│ EXIT: bun run validate:implementation ✅                    │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: MUTATION TESTING (10 minutes)                      │
│ Agent generates mutations to verify property strength       │
├─────────────────────────────────────────────────────────────┤
│ • Generate 100+ buggy implementations                       │
│ • Verify properties FAIL on buggy code                      │
│ • Measure property test effectiveness                       │
│ • Add properties if mutations survive                       │
│ EXIT: bun run validate:mutations ✅                         │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ Properties are source of truth (not implementation)
- ✅ Examples automatically derived from properties
- ✅ Implementation provably correct (if properties comprehensive)
- ✅ Mutation testing validates test quality

**Example: Property-First Development**

```typescript
// Step 1: Agent defines ALL properties FIRST
// test/properties/UserRepository.properties.ts

export const UserRepositoryProperties = {
  // Property 1: Persistence Round-Trip
  persistenceRoundTrip: fc.property(
    fc.effect(UserArbitrary),
    (user) => Effect.gen(function* () {
      const repo = yield* UserRepository;
      yield* repo.save(user);
      const loaded = yield* repo.findById(user.id);
      return Equal.equals(loaded, user);
    })
  ),
  
  // Property 2: Idempotent Save
  idempotentSave: fc.property(
    fc.effect(UserArbitrary),
    (user) => Effect.gen(function* () {
      const repo = yield* UserRepository;
      yield* repo.save(user);
      yield* repo.deleteById(user.id);
      yield* repo.save(user);
      const result = yield* repo.findById(user.id);
      return Equal.equals(result, user);
    })
  ),
  
  // Property 3: Count Consistency
  countConsistency: fc.property(
    fc.array(fc.effect(UserArbitrary), { minLength: 1, maxLength: 20 }),
    (users) => Effect.gen(function* () {
      const repo = yield* UserRepository;
      for (const user of users) {
        yield* repo.save(user);
      }
      const count = yield* repo.count();
      return count === users.length;
    })
  ),
  
  // ... 50+ more properties
};

// Step 2: Agent generates implementation to satisfy properties
// (Implementation is DERIVED from properties)

// Step 3: Validate implementation
describe("UserRepository - Property Validation", () => {
  Object.entries(UserRepositoryProperties).forEach(([name, property]) => {
    it.effect(`should satisfy: ${name}`, () =>
      Effect.gen(function* () {
        yield* fc.assert(property, { numRuns: 1000 });
      }).pipe(Effect.provide(UserRepositoryFakeLayer))
    );
  });
});
```

---

### Architecture 3: **Metamorphic Testing Pipeline**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: DEFINE METAMORPHIC RELATIONS (10 minutes)          │
│ Agent defines how outputs transform with input changes      │
├─────────────────────────────────────────────────────────────┤
│ • Identify input transformations (e.g., reverse, duplicate) │
│ • Define expected output relations                          │
│ • Generate metamorphic test suite                           │
│ EXIT: bun run validate:relations ✅                         │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: IMPLEMENTATION (5 minutes)                          │
│ Agent implements to satisfy relations                        │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: METAMORPHIC VALIDATION (10 minutes)                │
│ Test 10,000+ input pairs verify relations                   │
└─────────────────────────────────────────────────────────────┘
```

**Example: Metamorphic Relations**

```typescript
// Metamorphic relation: list order shouldn't affect count
const listOrderInvariance = Effect.gen(function* () {
  const repo = yield* UserRepository;
  const users = [user1, user2, user3];
  
  // Save in one order
  for (const user of users) {
    yield* repo.save(user);
  }
  const count1 = yield* repo.count();
  
  // Clear and save in reverse order
  yield* repo.clear();
  for (const user of users.reverse()) {
    yield* repo.save(user);
  }
  const count2 = yield* repo.count();
  
  // Counts should be equal
  assert.strictEqual(count1, count2);
});

// Metamorphic relation: pagination completeness
const paginationCompleteness = Effect.gen(function* () {
  const repo = yield* UserRepository;
  
  // Get all users at once
  const allAtOnce = yield* repo.list(100, 0);
  
  // Get in pages
  const page1 = yield* repo.list(10, 0);
  const page2 = yield* repo.list(10, 10);
  const page3 = yield* repo.list(10, 20);
  const concatenated = [...page1, ...page2, ...page3];
  
  // Should be equivalent (up to page size)
  assert.strictEqual(concatenated.length, Math.min(30, allAtOnce.length));
});
```

---

### Architecture 4: **Differential Testing with Multiple Implementations**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: SPECIFICATION (5 minutes)                          │
│ Define interface only                                       │
└─────────────────────────────────────────────────────────────┘
      ↓ (PARALLEL - 3 AGENTS)
      ├──────────────┬──────────────┬──────────────┐
      ↓              ↓              ↓              ↓
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Impl A   │   │ Impl B   │   │ Impl C   │   │ Impl D   │
│ (Map)    │   │ (Array)  │   │ (Set)    │   │ (SQL)    │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
      ↓              ↓              ↓              ↓
      └──────────────┴──────────────┴──────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: CROSS-VALIDATION (10 minutes)                      │
│ Run same inputs through ALL implementations                 │
├─────────────────────────────────────────────────────────────┤
│ • Generate 10,000 random operations                         │
│ • Execute on all implementations                            │
│ • Compare outputs (ALL must agree)                          │
│ • If divergence: identify bug or underspecification         │
│ EXIT: bun run validate:differential ✅                      │
└─────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ No oracle problem (implementations validate each other)
- ✅ Bugs found through disagreement
- ✅ Under-specified contracts revealed
- ✅ Multiple implementations = mutation testing

**Implementation:**

```typescript
// test/differential/UserRepository.differential.test.ts
import { Effect } from "effect";
import { UserRepositoryMap } from "./implementations/Map";
import { UserRepositoryArray } from "./implementations/Array";
import { UserRepositorySet } from "./implementations/Set";
import { UserRepositorySQL } from "./implementations/SQL";

const implementations = [
  { name: "Map", layer: UserRepositoryMap },
  { name: "Array", layer: UserRepositoryArray },
  { name: "Set", layer: UserRepositorySet },
  { name: "SQL", layer: UserRepositorySQL },
];

describe("UserRepository - Differential Testing", () => {
  it.effect("all implementations should agree on operations", () =>
    Effect.gen(function* () {
      yield* fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              op: fc.constantFrom("save", "findById", "count", "delete"),
              user: fc.effect(UserArbitrary)
            }),
            { minLength: 10, maxLength: 100 }
          ),
          async (operations) => {
            // Execute operations on ALL implementations
            const results = yield* Effect.all(
              implementations.map(({ name, layer }) =>
                Effect.gen(function* () {
                  const repo = yield* UserRepository;
                  
                  // Execute all operations
                  const outputs = [];
                  for (const { op, user } of operations) {
                    switch (op) {
                      case "save":
                        const saveResult = yield* Effect.exit(repo.save(user));
                        outputs.push({ op, result: saveResult });
                        break;
                      case "count":
                        const count = yield* repo.count();
                        outputs.push({ op, result: count });
                        break;
                      // ... other ops
                    }
                  }
                  
                  return { name, outputs };
                }).pipe(Effect.provide(layer))
              )
            );
            
            // Compare all outputs - they should be IDENTICAL
            const reference = results[0];
            for (const other of results.slice(1)) {
              assert.deepStrictEqual(
                other.outputs,
                reference.outputs,
                `${other.name} diverged from ${reference.name}`
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    })
  );
});
```

---

### Architecture 5: **Boundary Value Analysis First**

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 0: BOUNDARY IDENTIFICATION (5 minutes)                │
│ Agent identifies ALL boundaries from specification          │
├─────────────────────────────────────────────────────────────┤
│ • Type boundaries (min/max values)                          │
│ • State boundaries (empty, full, transition points)         │
│ • Concurrency boundaries (1, N, ∞ threads)                  │
│ • Error boundaries (success/failure transition)             │
│ EXIT: Generate exhaustive boundary test suite ✅            │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: IMPLEMENTATION (5 minutes)                          │
│ Implement to pass boundary tests                            │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: PROPERTY GENERALIZATION (5 minutes)                │
│ Generalize boundary tests to properties                     │
└─────────────────────────────────────────────────────────────┘
```

**Example: Boundary Analysis**

```typescript
// Agent generates ALL boundary cases automatically
const UserRepositoryBoundaries = {
  // State boundaries
  emptyRepository: {
    precondition: "count() === 0",
    operations: ["findById", "list", "count", "delete"],
    expectedBehaviors: {
      findById: "UserNotFoundError",
      list: "[]",
      count: "0",
      delete: "UserNotFoundError"
    }
  },
  
  // Capacity boundaries (if applicable)
  maxCapacity: {
    precondition: "count() === MAX_USERS",
    operation: "save",
    expectedBehavior: "CapacityExceededError"
  },
  
  // Pagination boundaries
  paginationBoundaries: [
    { limit: 0, offset: 0 },    // Minimum
    { limit: 1, offset: 0 },    // Single item
    { limit: MAX_INT, offset: 0 }, // Maximum
    { limit: 10, offset: count() }, // Beyond data
    { limit: 10, offset: count() - 5 }, // Partial page
  ],
  
  // Concurrency boundaries
  concurrentOperations: [
    { threads: 1 },    // Sequential
    { threads: 10 },   // Moderate
    { threads: 1000 }, // High
  ],
};

// Generate tests from boundaries
Object.entries(UserRepositoryBoundaries).forEach(([name, boundary]) => {
  it.effect(`should handle boundary: ${name}`, () => {
    // Agent generates test from boundary spec
  });
});
```

---

## 🎯 Recommended Pipeline for AI Agents

**Optimal: Hybrid Specification-First + Differential Testing**

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 0: SPECIFICATION GENERATION (5 min)                   │
│ Single agent generates complete specification               │
├─────────────────────────────────────────────────────────────┤
│ • Errors, Models, Interfaces                                │
│ • Invariants + Property skeletons                           │
│ • Boundary cases                                            │
│ • Metamorphic relations                                     │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: PARALLEL IMPLEMENTATION (10 min)                   │
│ 3+ agents implement different strategies                    │
├─────────────────────────────────────────────────────────────┤
│ Agent A: In-memory (Map-based)     ← Fast, simple           │
│ Agent B: In-memory (Array-based)   ← Different approach     │
│ Agent C: Production (PostgreSQL)   ← Real implementation    │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: CROSS-VALIDATION (10 min)                          │
│ Verify all implementations agree                            │
├─────────────────────────────────────────────────────────────┤
│ • 10,000 random operations                                  │
│ • Execute on ALL implementations                            │
│ • Verify outputs identical                                  │
│ • Properties pass on ALL implementations                    │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: MUTATION TESTING (10 min)                          │
│ Verify test suite quality                                   │
├─────────────────────────────────────────────────────────────┤
│ • Generate 100+ buggy implementations                       │
│ • Verify properties catch bugs                              │
│ • Measure test effectiveness                                │
│ • Strengthen properties if needed                           │
└─────────────────────────────────────────────────────────────┘
      ↓
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: ADVERSARIAL TESTING (15 min)                       │
│ Agent generates attacks and edge cases                      │
├─────────────────────────────────────────────────────────────┤
│ • Chaos testing (30% failure rate)                          │
│ • Load testing (10K concurrent ops)                         │
│ • Adversarial inputs (SQL injection, etc.)                  │
│ • Resource exhaustion scenarios                             │
└─────────────────────────────────────────────────────────────┘

Total: ~50 minutes (vs 2+ hours for sequential TDD)
```

---

## 📋 Implementation: Agent Orchestration Script

```typescript
// scripts/agent-orchestration.ts
import { Effect, Fiber, Ref } from "effect";

// Phase 0: Specification
const specificationPhase = Effect.gen(function* () {
  yield* Console.log("🎯 PHASE 0: Specification Generation");
  
  // Single agent generates everything
  const spec = yield* generateSpecification({
    errors: true,
    models: true,
    interfaces: true,
    invariants: true,
    boundaries: true,
    metamorphicRelations: true
  });
  
  // Validate specification is complete
  yield* validateSpecification(spec);
  
  return spec;
});

// Phase 1: Parallel Implementation
const parallelImplementationPhase = (spec: Specification) =>
  Effect.gen(function* () {
    yield* Console.log("🔄 PHASE 1: Parallel Implementation");
    
    // Fork 3 agents with different strategies
    const agentA = yield* Effect.fork(
      generateImplementation({
        strategy: "map-based",
        spec
      }).pipe(Effect.tag("AgentA"))
    );
    
    const agentB = yield* Effect.fork(
      generateImplementation({
        strategy: "array-based",
        spec
      }).pipe(Effect.tag("AgentB"))
    );
    
    const agentC = yield* Effect.fork(
      generateImplementation({
        strategy: "postgresql",
        spec
      }).pipe(Effect.tag("AgentC"))
    );
    
    // Wait for all
    const implementations = yield* Effect.all([
      Fiber.join(agentA),
      Fiber.join(agentB),
      Fiber.join(agentC)
    ]);
    
    return implementations;
  });

// Phase 2: Cross-Validation
const crossValidationPhase = (implementations: Array<Implementation>) =>
  Effect.gen(function* () {
    yield* Console.log("✅ PHASE 2: Cross-Validation");
    
    // Generate 10,000 random operations
    const operations = yield* generateRandomOperations(10000);
    
    // Execute on ALL implementations
    const results = yield* Effect.all(
      implementations.map((impl) =>
        executeOperations(impl, operations)
      )
    );
    
    // Verify all results are identical
    yield* verifyEquivalence(results);
    
    // Run property tests on ALL
    for (const impl of implementations) {
      yield* runPropertyTests(impl, { numRuns: 1000 });
    }
  });

// Phase 3: Mutation Testing
const mutationTestingPhase = (implementations: Array<Implementation>) =>
  Effect.gen(function* () {
    yield* Console.log("🧬 PHASE 3: Mutation Testing");
    
    // Generate 100 buggy implementations
    const mutants = yield* Effect.all(
      Array.from({ length: 100 }, () => generateMutant(implementations[0]))
    );
    
    // Verify properties catch ALL mutants
    const survivors = yield* Ref.make(0);
    
    for (const mutant of mutants) {
      const caught = yield* Effect.exit(
        runPropertyTests(mutant, { numRuns: 100 })
      );
      
      if (Exit.isSuccess(caught)) {
        yield* Ref.update(survivors, (n) => n + 1);
      }
    }
    
    const survivorCount = yield* Ref.get(survivors);
    
    if (survivorCount > 0) {
      yield* Console.error(`⚠️  ${survivorCount} mutants survived! Properties need strengthening.`);
    } else {
      yield* Console.log(`✅ All mutants killed! Properties are strong.`);
    }
  });

// Phase 4: Adversarial Testing
const adversarialTestingPhase = (implementations: Array<Implementation>) =>
  Effect.gen(function* () {
    yield* Console.log("💪 PHASE 4: Adversarial Testing");
    
    // Chaos testing
    yield* runChaosTests(implementations, {
      failureRate: 0.3,
      latencyMs: [100, 2000],
      numRuns: 1000
    });
    
    // Load testing
    yield* runLoadTests(implementations, {
      concurrentOps: 10000,
      duration: Duration.minutes(5)
    });
    
    // Adversarial inputs
    yield* runAdversarialTests(implementations, {
      sqlInjection: true,
      bufferOverflow: true,
      raceConditions: true,
      numRuns: 1000
    });
  });

// Main orchestration
const runAgentPipeline = Effect.gen(function* () {
  const startTime = yield* Clock.currentTimeMillis;
  
  // Phase 0
  const spec = yield* specificationPhase;
  
  // Phase 1
  const implementations = yield* parallelImplementationPhase(spec);
  
  // Phase 2
  yield* crossValidationPhase(implementations);
  
  // Phase 3
  yield* mutationTestingPhase(implementations);
  
  // Phase 4
  yield* adversarialTestingPhase(implementations);
  
  const endTime = yield* Clock.currentTimeMillis;
  const duration = (endTime - startTime) / 1000 / 60;
  
  yield* Console.log(`\n🎉 Pipeline complete in ${duration.toFixed(1)} minutes!`);
});

// Run it
Effect.runPromise(runAgentPipeline);
```

---

## 📊 Comparison Matrix

| Approach | Time | Confidence | Agent Efficiency | Best For |
|----------|------|------------|------------------|----------|
| **Sequential TDD** | 2+ hours | High | Low (waiting) | Human developers |
| **Specification-First Parallel** | ~45 min | High | High | Clear requirements |
| **Property-First** | ~30 min | Very High | Very High | Mathematical domains |
| **Differential Testing** | ~40 min | Very High | High | Complex logic |
| **Boundary Analysis** | ~25 min | Medium | Medium | Well-defined constraints |
| **Hybrid (Recommended)** | ~50 min | Very High | Very High | Production systems |

---

## 🎯 Key Insights for AI Agent Development

1. **Eliminate Sequential Bottlenecks**: Agents can work in parallel on multiple implementations simultaneously.

2. **Use Differential Testing**: Multiple implementations validate each other (no oracle problem).

3. **Properties > Examples**: Agents excel at generating and validating properties (1000+ runs in seconds).

4. **Mutation Testing is Cheap**: Agents can generate hundreds of buggy implementations to validate test quality.

5. **Adversarial Testing**: Agents can systematically explore attack vectors humans might miss.

6. **Specification is King**: Clear contracts enable parallel, confident development.

7. **Cross-Validation**: Agreement between implementations builds confidence faster than sequential testing.

---

This pipeline optimizes for AI agent strengths: **parallel execution, exhaustive exploration, and specification-driven development**.
