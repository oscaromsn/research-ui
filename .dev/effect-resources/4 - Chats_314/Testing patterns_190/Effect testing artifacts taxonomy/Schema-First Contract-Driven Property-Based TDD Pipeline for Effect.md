---
modified: 2025-10-27T20:13:08-03:00
---
# Schema-First Contract-Driven Property-Based TDD Pipeline for Effect

A rigorous development workflow that builds complex Effect applications on validated foundations, catching errors at compile-time and runtime through progressive refinement.

## I. The Pipeline Overview

```
1. Schema Definition (Contract)
   ↓
2. Property Specification (Laws)
   ↓
3. Test Implementation (Red)
   ↓
4. Minimal Implementation (Green)
   ↓
5. Property Validation (Verify Laws)
   ↓
6. Refinement (Refactor)
   ↓
7. Integration (Compose)
```

---

## II. Stage 1: Schema Definition (The Contract)

**Philosophy:** The schema *is* your specification. It encodes business rules, constraints, and the shape of your domain.

### A. Start with Core Domain Schemas

```typescript
// schemas/ProcessoJudicial.ts
import * as S from "@effect/schema/Schema";

// Start with the most restrictive, correct representation
export class NumeroProcesso extends S.Class<NumeroProcesso>("NumeroProcesso")({
  // CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO
  // 7 digits, check digit, year, segment, court, origin
  value: S.String.pipe(
    S.pattern(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/),
    S.brand("NumeroProcesso")
  )
}) {
  static fromString(s: string): Effect.Effect<NumeroProcesso, ParseError> {
    return S.decode(NumeroProcesso)({ value: s });
  }
  
  // Derived properties from schema
  get ano(): number {
    return parseInt(this.value.slice(10, 14));
  }
  
  get tribunal(): string {
    return this.value.slice(17, 19);
  }
}

// Build progressively more complex types
export class ProcessoJudicialId extends S.Class<ProcessoJudicialId>("ProcessoJudicialId")({
  numero: NumeroProcesso,
  tribunal: S.Literal("TJ", "TRF", "TST", "STF", "STJ"),
}) {}

export const ProcessoStatusSchema = S.Literal(
  "ativo",
  "arquivado", 
  "suspenso",
  "transitado_em_julgado"
);

export class ProcessoJudicial extends S.Class<ProcessoJudicial>("ProcessoJudicial")({
  id: ProcessoJudicialId,
  partes: S.NonEmptyArray(S.Struct({
    nome: S.String.pipe(S.minLength(3)),
    tipo: S.Literal("autor", "reu", "terceiro"),
    cpfCnpj: S.String.pipe(S.pattern(/^\d{11}$|^\d{14}$/))
  })),
  status: ProcessoStatusSchema,
  movimentacoes: S.Array(S.Struct({
    data: S.Date,
    tipo: S.String,
    descricao: S.String,
    documento: S.optional(S.String)
  })),
  valor: S.optional(S.Number.pipe(S.positive())),
  createdAt: S.Date,
  updatedAt: S.Date
}) {
  // Business logic as methods, not free functions
  get isAtivo(): boolean {
    return this.status === "ativo";
  }
  
  get ultimaMovimentacao() {
    return this.movimentacoes.at(-1);
  }
}
```

**Key Principles:**
- **Branded types** for domain primitives (NumeroProcesso can't be confused with random string)
- **Literal unions** for closed sets (status, tribunal)
- **Validation at boundaries** (pattern matching, min/max)
- **Non-nullable by default** (use `S.optional` explicitly)
- **Classes for entities**, plain Structs for value objects

---

### B. Define Service Contracts as Schemas

```typescript
// schemas/ProcessoService.ts

// Request/Response schemas define the contract
export class BuscarProcessoRequest extends S.Class<BuscarProcessoRequest>("BuscarProcessoRequest")({
  numero: NumeroProcesso,
  tribunal: S.Literal("TJ", "TRF", "TST", "STF", "STJ"),
  incluirMovimentacoes: S.Boolean.pipe(S.withDefault(() => true))
}) {}

export class ProcessoNaoEncontrado extends S.TaggedError<ProcessoNaoEncontrado>()(
  "ProcessoNaoEncontrado",
  {
    numero: NumeroProcesso,
    tribunal: S.String,
    timestamp: S.Date.pipe(S.withDefault(() => new Date()))
  }
) {}

export class ErroConexaoTribunal extends S.TaggedError<ErroConexaoTribunal>()(
  "ErroConexaoTribunal",
  {
    tribunal: S.String,
    cause: S.Unknown,
    retryable: S.Boolean
  }
) {}

// Service interface with typed errors
export class ProcessoService extends Context.Tag("ProcessoService")
  ProcessoService,
  {
    readonly buscar: (
      req: BuscarProcessoRequest
    ) => Effect.Effect
      ProcessoJudicial,
      ProcessoNaoEncontrado | ErroConexaoTribunal
    >;
    
    readonly listar: (
      filtro: FiltroProcessos
    ) => Effect.Effect
      Chunk<ProcessoJudicial>,
      ErroConexaoTribunal
    >;
  }
>() {}
```

**Benefits:**
- **Typed errors**: No `unknown` or `any` in error channel
- **Tagged errors**: Pattern match on error types
- **Request/response validation**: Can't call service with invalid data
- **Self-documenting**: Schema is the API documentation

---

## III. Stage 2: Property Specification (The Laws)

**Before writing any implementation**, specify the properties/laws your system must satisfy.

### A. Create Property Test Suite

```typescript
// __tests__/properties/ProcessoService.properties.ts
import * as fc from "fast-check";
import * as Arbitrary from "@effect/schema/Arbitrary";

// Generate arbitrary instances from schemas
const numeroProcessoArb = Arbitrary.make(NumeroProcesso);
const processoArb = Arbitrary.make(ProcessoJudicial);
const requestArb = Arbitrary.make(BuscarProcessoRequest);

describe("ProcessoService Properties", () => {
  
  // Property 1: Roundtrip - save then load returns same data
  it("prop: buscar after save returns original processo", () =>
    fc.assert(
      fc.asyncProperty(
        processoArb(fc),
        (processo) =>
          Effect.gen(function* () {
            const service = yield* ProcessoService;
            const repo = yield* ProcessoRepository;
            
            // Arrange: save
            yield* repo.save(processo);
            
            // Act: retrieve
            const retrieved = yield* service.buscar({
              numero: processo.id.numero,
              tribunal: processo.id.tribunal,
              incluirMovimentacoes: true
            });
            
            // Assert: equality
            expect(retrieved).toEqual(processo);
          }).pipe(
            Effect.provide(TestLayer),
            Effect.runPromise
          )
      )
    )
  );
  
  // Property 2: Idempotency - calling twice has same effect as once
  it("prop: buscar is idempotent", () =>
    fc.assert(
      fc.asyncProperty(
        requestArb(fc),
        (request) =>
          Effect.gen(function* () {
            const service = yield* ProcessoService;
            
            const first = yield* service.buscar(request).pipe(Effect.either);
            const second = yield* service.buscar(request).pipe(Effect.either);
            
            expect(second).toEqual(first);
          }).pipe(
            Effect.provide(TestLayer),
            Effect.runPromise
          )
      )
    )
  );
  
  // Property 3: Error handling - invalid input always produces typed error
  it("prop: invalid numero always fails with ProcessoNaoEncontrado", () =>
    fc.assert(
      fc.asyncProperty(
        fc.string().filter(s => !s.match(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/)),
        fc.constantFrom("TJ", "TRF", "TST", "STF", "STJ"),
        (invalidNumero, tribunal) =>
          Effect.gen(function* () {
            const service = yield* ProcessoService;
            
            // Should fail at schema validation before even hitting service
            const result = yield* Effect.try(() =>
              BuscarProcessoRequest.make({
                numero: NumeroProcesso.make({ value: invalidNumero }),
                tribunal,
                incluirMovimentacoes: true
              })
            ).pipe(Effect.either);
            
            expect(Either.isLeft(result)).toBe(true);
          }).pipe(Effect.runPromise)
      )
    )
  );
  
  // Property 4: Invariant - movimentacoes always sorted by date
  it("prop: movimentacoes are always chronologically ordered", () =>
    fc.assert(
      fc.asyncProperty(
        processoArb(fc),
        (processo) =>
          Effect.gen(function* () {
            const dates = processo.movimentacoes.map(m => m.data.getTime());
            const sorted = [...dates].sort((a, b) => a - b);
            
            expect(dates).toEqual(sorted);
          }).pipe(Effect.runPromise)
      )
    )
  );
  
  // Property 5: Composition - filtering then mapping == mapping then filtering
  it("prop: filter-map composition is commutative for pure predicates", () =>
    fc.assert(
      fc.asyncProperty(
        fc.array(processoArb(fc)),
        (processos) =>
          Effect.gen(function* () {
            const service = yield* ProcessoService;
            
            const filterThenMap = processos
              .filter(p => p.isAtivo)
              .map(p => p.id.numero.value);
            
            const mapThenFilter = processos
              .map(p => ({ numero: p.id.numero.value, ativo: p.isAtivo }))
              .filter(x => x.ativo)
              .map(x => x.numero);
            
            expect(filterThenMap).toEqual(mapThenFilter);
          }).pipe(Effect.runPromise)
      )
    )
  );
});
```

**Key Property Categories:**
1. **Roundtrip**: encode/decode, save/load identity
2. **Idempotency**: f(f(x)) = f(x)
3. **Type safety**: invalid inputs caught by schema
4. **Invariants**: business rules always hold
5. **Composition**: operations compose correctly

---

### B. Document Expected Behaviors

```typescript
// domains/ProcessoService.laws.ts

/**
 * Laws that any ProcessoService implementation must satisfy:
 * 
 * Law 1 (Persistence): 
 *   ∀ processo. save(processo) >> buscar(processo.id) == Right(processo)
 * 
 * Law 2 (Idempotency):
 *   ∀ request. buscar(request) == buscar(request) >> buscar(request)
 * 
 * Law 3 (Error Determinism):
 *   ∀ numero ∉ ValidFormat. buscar(numero) == Left(ValidationError)
 * 
 * Law 4 (Temporal Ordering):
 *   ∀ processo. processo.movimentacoes[i].data <= processo.movimentacoes[i+1].data
 * 
 * Law 5 (Status Transitions):
 *   ∀ processo. validTransitions(processo.status, newStatus) || Left(InvalidTransition)
 */
export const ProcessoServiceLaws = {
  persistence: "save >> buscar == Right(original)",
  idempotency: "buscar(x) == buscar(x) >> buscar(x)",
  errorDeterminism: "invalid input => typed error",
  temporalOrdering: "movimentacoes sorted by date",
  statusTransitions: "only valid state transitions allowed"
} as const;
```

---

## IV. Stage 3: Test Implementation (Red Phase)

**Write failing tests first**, using both property-based and example-based approaches.

### A. Unit Test Structure

```typescript
// __tests__/unit/ProcessoService.test.ts

describe("ProcessoService", () => {
  // Helper to run effects in tests
  const runTest = <A, E>(
    effect: Effect.Effect<A, E, ProcessoService>
  ) => effect.pipe(
    Effect.provide(TestLayer),
    Effect.runPromise
  );
  
  describe("buscar", () => {
    it("should return processo when exists", async () => {
      const processo = ProcessoJudicialBuilder.aProcesso()
        .withNumero("1234567-89.2024.1.01.0001")
        .build();
      
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* ProcessoService;
          const repo = yield* ProcessoRepository;
          
          yield* repo.save(processo);
          
          const found = yield* service.buscar({
            numero: processo.id.numero,
            tribunal: processo.id.tribunal,
            incluirMovimentacoes: true
          });
          
          return found;
        })
      );
      
      expect(result.id.numero.value).toBe("1234567-89.2024.1.01.0001");
    });
    
    it("should fail with ProcessoNaoEncontrado when not exists", async () => {
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* ProcessoService;
          
          return yield* service.buscar({
            numero: NumeroProcesso.make({ value: "9999999-99.2024.1.01.0001" }),
            tribunal: "TJ",
            incluirMovimentacoes: false
          }).pipe(Effect.either);
        })
      );
      
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ProcessoNaoEncontrado);
      }
    });
    
    it("should handle tribunal connection errors", async () => {
      // Test error scenarios
      const result = await runTest(
        Effect.gen(function* () {
          const service = yield* ProcessoService;
          
          // Simulate tribunal unavailable
          const httpLayer = Layer.succeed(
            HttpClient,
            HttpClient.of({
              get: () => Effect.fail(new ErroConexaoTribunal({
                tribunal: "TJ",
                cause: new Error("timeout"),
                retryable: true
              }))
            })
          );
          
          return yield* service.buscar({
            numero: NumeroProcesso.make({ value: "1234567-89.2024.1.01.0001" }),
            tribunal: "TJ",
            incluirMovimentacoes: true
          }).pipe(
            Effect.provide(httpLayer),
            Effect.either
          );
        })
      );
      
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErroConexaoTribunal);
        expect(result.left.retryable).toBe(true);
      }
    });
  });
});
```

### B. Builder Pattern for Test Data

```typescript
// __tests__/builders/ProcessoJudicialBuilder.ts

export class ProcessoJudicialBuilder {
  private data: Partial<typeof ProcessoJudicial.Encoded> = {};
  
  static aProcesso() {
    return new ProcessoJudicialBuilder().withDefaults();
  }
  
  private withDefaults() {
    return this
      .withNumero("1234567-89.2024.1.01.0001")
      .withTribunal("TJ")
      .withStatus("ativo")
      .withPartes([{
        nome: "João da Silva",
        tipo: "autor" as const,
        cpfCnpj: "12345678901"
      }])
      .withMovimentacoes([])
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date());
  }
  
  withNumero(numero: string) {
    this.data.id = {
      ...this.data.id,
      numero: { value: numero }
    };
    return this;
  }
  
  withTribunal(tribunal: "TJ" | "TRF" | "TST" | "STF" | "STJ") {
    this.data.id = {
      ...this.data.id,
      tribunal
    };
    return this;
  }
  
  withStatus(status: "ativo" | "arquivado" | "suspenso" | "transitado_em_julgado") {
    this.data.status = status;
    return this;
  }
  
  withMovimentacao(mov: typeof ProcessoJudicial.Encoded.movimentacoes[0]) {
    this.data.movimentacoes = [...(this.data.movimentacoes || []), mov];
    return this;
  }
  
  withPartes(partes: typeof ProcessoJudicial.Encoded.partes) {
    this.data.partes = partes;
    return this;
  }
  
  withMovimentacoes(movs: typeof ProcessoJudicial.Encoded.movimentacoes) {
    this.data.movimentacoes = movs;
    return this;
  }
  
  withCreatedAt(date: Date) {
    this.data.createdAt = date;
    return this;
  }
  
  withUpdatedAt(date: Date) {
    this.data.updatedAt = date;
    return this;
  }
  
  // Validated build
  build(): Effect.Effect<ProcessoJudicial, ParseError> {
    return S.decode(ProcessoJudicial)(this.data);
  }
  
  // For testing invalid states
  buildUnsafe(): ProcessoJudicial {
    return this.data as ProcessoJudicial;
  }
  
  // Build directly without Effect wrapper
  buildSync(): ProcessoJudicial {
    return S.decodeSync(ProcessoJudicial)(this.data);
  }
}
```

---

## V. Stage 4: Minimal Implementation (Green Phase)

**Implement just enough to make tests pass**, starting with the fake/in-memory version.

### A. In-Memory Implementation First

```typescript
// services/ProcessoService.fake.ts

export const makeInMemoryProcessoService = Effect.gen(function* () {
  const processos = yield* Ref.make(new Map<string, ProcessoJudicial>());
  
  const makeKey = (numero: NumeroProcesso, tribunal: string) =>
    `${tribunal}:${numero.value}`;
  
  return ProcessoService.of({
    buscar: (req) =>
      Effect.gen(function* () {
        const key = makeKey(req.numero, req.tribunal);
        const map = yield* Ref.get(processos);
        const processo = map.get(key);
        
        if (!processo) {
          return yield* Effect.fail(
            new ProcessoNaoEncontrado({
              numero: req.numero,
              tribunal: req.tribunal
            })
          );
        }
        
        // Apply request options
        if (!req.incluirMovimentacoes) {
          return { ...processo, movimentacoes: [] };
        }
        
        return processo;
      }),
    
    listar: (filtro) =>
      Effect.gen(function* () {
        const map = yield* Ref.get(processos);
        const all = Array.from(map.values());
        
        // Apply filters
        let filtered = all;
        
        if (filtro.status) {
          filtered = filtered.filter(p => p.status === filtro.status);
        }
        
        if (filtro.tribunal) {
          filtered = filtered.filter(p => p.id.tribunal === filtro.tribunal);
        }
        
        if (filtro.dataInicio) {
          filtered = filtered.filter(p => 
            p.createdAt >= filtro.dataInicio!
          );
        }
        
        return Chunk.fromIterable(filtered);
      }),
    
    // Test helpers (not in public interface)
    _save: (processo: ProcessoJudicial) =>
      Ref.update(
        processos,
        map => map.set(
          makeKey(processo.id.numero, processo.id.tribunal),
          processo
        )
      ),
    
    _clear: () => Ref.set(processos, new Map()),
    
    _count: () => Ref.get(processos).pipe(Effect.map(m => m.size))
  });
});

export const ProcessoServiceTest = Layer.effect(
  ProcessoService,
  makeInMemoryProcessoService
);
```

**Why Fake First:**
- **Fast feedback**: No external dependencies
- **Deterministic**: Easy to reason about
- **Complete control**: Can test edge cases
- **Validates interface**: Ensures API makes sense

---

### B. Real Implementation with Same Contract

```typescript
// services/ProcessoService.live.ts

export const makeProcessoServiceLive = Effect.gen(function* () {
  const httpClient = yield* HttpClient;
  const config = yield* ProcessoServiceConfig;
  const cache = yield* Cache;
  
  return ProcessoService.of({
    buscar: (req) =>
      Effect.gen(function* () {
        const cacheKey = `processo:${req.tribunal}:${req.numero.value}`;
        
        // Try cache first
        const cached = yield* cache.get(cacheKey).pipe(
          Effect.catchAll(() => Effect.succeed(Option.none()))
        );
        
        if (Option.isSome(cached)) {
          return cached.value;
        }
        
        // Fetch from tribunal API
        const url = `${config.baseUrl}/${req.tribunal}/processos/${req.numero.value}`;
        
        const response = yield* httpClient.get(url).pipe(
          Effect.timeout(Duration.seconds(30)),
          Effect.retry({
            schedule: Schedule.exponential(Duration.seconds(1)),
            times: 3
          }),
          Effect.catchTag("TimeoutException", () =>
            Effect.fail(new ErroConexaoTribunal({
              tribunal: req.tribunal,
              cause: new Error("timeout"),
              retryable: true
            }))
          ),
          Effect.catchTag("HttpError", (e) =>
            e.status === 404
              ? Effect.fail(new ProcessoNaoEncontrado({
                  numero: req.numero,
                  tribunal: req.tribunal
                }))
              : Effect.fail(new ErroConexaoTribunal({
                  tribunal: req.tribunal,
                  cause: e,
                  retryable: e.status >= 500
                }))
          )
        );
        
        // Decode response with schema
        const processo = yield* S.decode(ProcessoJudicial)(response.body);
        
        // Cache successful result
        yield* cache.set(cacheKey, processo, Duration.hours(1));
        
        return processo;
      }),
    
    listar: (filtro) =>
      Effect.gen(function* () {
        const params = new URLSearchParams();
        
        if (filtro.status) params.append("status", filtro.status);
        if (filtro.tribunal) params.append("tribunal", filtro.tribunal);
        if (filtro.dataInicio) {
          params.append("dataInicio", filtro.dataInicio.toISOString());
        }
        
        const url = `${config.baseUrl}/processos?${params}`;
        
        const response = yield* httpClient.get(url).pipe(
          Effect.catchAll((e) =>
            Effect.fail(new ErroConexaoTribunal({
              tribunal: filtro.tribunal || "todos",
              cause: e,
              retryable: true
            }))
          )
        );
        
        const processos = yield* S.decode(S.Array(ProcessoJudicial))(response.body);
        
        return Chunk.fromIterable(processos);
      })
  });
});

export const ProcessoServiceLive = Layer.effect(
  ProcessoService,
  makeProcessoServiceLive
);
```

---

## VI. Stage 5: Property Validation (Verify Laws)

**Run property tests against BOTH implementations** to ensure they satisfy the same laws.

```typescript
// __tests__/properties/ProcessoService.contract.ts

const testServiceContract = (
  serviceLayer: Layer.Layer<ProcessoService, never, never>,
  suiteName: string
) => {
  describe(`${suiteName} - Contract Tests`, () => {
    
    // Test against the fake
    const runTest = <A, E>(effect: Effect.Effect<A, E>) =>
      effect.pipe(
        Effect.provide(serviceLayer),
        Effect.runPromise
      );
    
    // Property: Idempotency
    it("satisfies idempotency law", () =>
      fc.assert(
        fc.asyncProperty(
          requestArb(fc),
          (request) =>
            Effect.gen(function* () {
              const service = yield* ProcessoService;
              
              const first = yield* service.buscar(request).pipe(
                Effect.either
              );
              
              const second = yield* service.buscar(request).pipe(
                Effect.either
              );
              
              expect(second).toEqual(first);
            }).pipe(runTest)
        ),
        { numRuns: 100 }
      )
    );
    
    // Property: Type safety
    it("satisfies type safety law", () =>
      fc.assert(
        fc.asyncProperty(
          processoArb(fc),
          (processo) =>
            Effect.gen(function* () {
              const service = yield* ProcessoService;
              
              // Save then retrieve
              yield* (service as any)._save?.(processo) ?? Effect.void;
              
              const retrieved = yield* service.buscar({
                numero: processo.id.numero,
                tribunal: processo.id.tribunal,
                incluirMovimentacoes: true
              });
              
              // Schema validation ensures type safety
              expect(retrieved).toBeInstanceOf(ProcessoJudicial);
              expect(retrieved.id.numero).toBeInstanceOf(NumeroProcesso);
            }).pipe(runTest)
        ),
        { numRuns: 50 }
      )
    );
    
    // More property tests...
  });
};

// Run against BOTH implementations
testServiceContract(ProcessoServiceTest, "InMemory ProcessoService");
testServiceContract(ProcessoServiceLive, "Live ProcessoService");
```

---

## VII. Stage 6: Refinement & Refactoring

**With passing tests, confidently refactor** knowing properties still hold.

### A. Extract Common Patterns

```typescript
// patterns/RepositoryPattern.ts

// Generic repository pattern that ensures consistency
export interface Repository<Entity, Id, E> {
  readonly save: (entity: Entity) => Effect.Effect<void, E>;
  readonly findById: (id: Id) => Effect.Effect<Entity, E | NotFound>;
  readonly delete: (id: Id) => Effect.Effect<void, E>;
  readonly list: (filter: unknown) => Effect.Effect<Chunk<Entity>, E>;
}

// Create repository from schema
export const makeInMemoryRepository = 
  Entity extends { id: Id },
  Id,
  E
>(
  schema: S.Schema<Entity>,
  makeNotFound: (id: Id) => E
) =>
  Effect.gen(function* () {
    const store = yield* Ref.make(new Map<Id, Entity>());
    
    return {
      save: (entity) =>
        Ref.update(store, map => map.set(entity.id, entity)),
      
      findById: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap(map => {
            const entity = map.get(id);
            return entity
              ? Effect.succeed(entity)
              : Effect.fail(makeNotFound(id));
          })
        ),
      
      delete: (id) =>
        Ref.update(store, map => {
          map.delete(id);
          return map;
        }),
      
      list: (filter) =>
        Ref.get(store).pipe(
          Effect.map(map => Chunk.fromIterable(map.values()))
        )
    };
  });
```

### B. Add Observability

```typescript
// Add metrics/logging without changing core logic
const withMetrics = <R, E, A>(
  name: string,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | Metrics> =>
  Effect.gen(function* () {
    const metrics = yield* Metrics;
    const start = Date.now();
    
    const result = yield* effect.pipe(
      Effect.tapError((error) =>
        metrics.recordError(name, error)
      )
    );
    
    const duration = Date.now() - start;
    yield* metrics.recordDuration(name, duration);
    
    return result;
  });

// Wrap service methods
export const ProcessoServiceWithMetrics = Layer.effect(
  ProcessoService,
  Effect.gen(function* () {
    const base = yield* ProcessoService;
    const metrics = yield* Metrics;
    
    return ProcessoService.of({
      buscar: (req) =>
        withMetrics("processo.buscar", base.buscar(req)),
      
      listar: (filtro) =>
        withMetrics("processo.listar", base.listar(filtro))
    });
  })
);
```

---

## VIII. Stage 7: Progressive Integration

**Compose validated components** into larger systems.

### A. Build Higher-Level Services

```typescript
// services/PesquisaJurisprudenciaService.ts

// Depends on ProcessoService, but we know it satisfies its contract
export const makePesquisaJurisprudenciaService = Effect.gen(function* () {
  const processoService = yield* ProcessoService;
  const vectorDb = yield* VectorDatabase;
  const embeddings = yield* EmbeddingService;
  
  return PesquisaJurisprudenciaService.of({
    buscarSimilares: (processoId, limite) =>
      Effect.gen(function* () {
        // Load processo (validated by ProcessoService contract)
        const processo = yield* processoService.buscar({
          numero: processoId.numero,
          tribunal: processoId.tribunal,
          incluirMovimentacoes: true
        });
        
        // Generate embedding
        const embedding = yield* embeddings.generate(
          processo.movimentacoes.map(m => m.descricao).join(" ")
        );
        
        // Search vector DB
        const similares = yield* vectorDb.search(embedding, limite);
        
        // Load full processos
        return yield* Effect.forEach(
          similares,
          (id) => processoService.buscar({
            numero: id.numero,
            tribunal: id.tribunal,
            incluirMovimentacoes: false
          }),
          { concurrency: 5 }
        );
      })
  });
});
```

### B. Integration Test with Mixed Layers

```typescript
// __tests__/integration/PesquisaJurisprudencia.integration.ts

describe("PesquisaJurisprudencia Integration", () => {
  const IntegrationLayer = Layer.mergeAll(
    ProcessoServiceTest,      // Fake processo service
    VectorDatabaseLive,       // Real vector DB (test container)
    EmbeddingServiceLive,     // Real embedding service
    PesquisaJurisprudenciaServiceLive
  );
  
  it("should find similar processos", async () => {
    await Effect.gen(function* () {
      const pesquisa = yield* PesquisaJurisprudenciaService;
      const processoService = yield* ProcessoService;
      
      // Setup test data
      const processo1 = yield* ProcessoJudicialBuilder.aProcesso()
        .withNumero("1234567-89.2024.1.01.0001")
        .withMovimentacao({
          data: new Date(),
          tipo: "sentenca",
          descricao: "Sentença de improcedência do pedido de rescisão contratual"
        })
        .build();
      
      const processo2 = yield* ProcessoJudicialBuilder.aProcesso()
        .withNumero("7654321-89.2024.1.01.0002")
        .withMovimentacao({
          data: new Date(),
          tipo: "sentenca",
          descricao: "Sentença de procedência do pedido de rescisão contratual"
        })
        .build();
      
      yield* (processoService as any)._save(processo1);
      yield* (processoService as any)._save(processo2);
      
      // Act
      const similares = yield* pesquisa.buscarSimilares(
        processo1.id,
        10
      );
      
      // Assert - should find processo2 as similar
      expect(similares.length).toBeGreaterThan(0);
      expect(
        similares.some(p => p.id.numero.value === processo2.id.numero.value)
      ).toBe(true);
    }).pipe(
      Effect.provide(IntegrationLayer),
      Effect.runPromise
    );
  });
});
```

---

## IX. Practical Workflow & Tools

### A. Development Cycle

```bash
# 1. Define schema
vim schemas/NovoRecurso.ts

# 2. Generate types and arbitraries automatically
npm run schema:codegen

# 3. Write property tests (they fail - no impl yet)
vim __tests__/properties/NovoRecurso.properties.ts
npm test -- NovoRecurso.properties  # RED

# 4. Write example tests
vim __tests__/unit/NovoRecurso.test.ts
npm test -- NovoRecurso.test  # RED

# 5. Implement fake
vim services/NovoRecurso.fake.ts
npm test  # GREEN

# 6. Run property tests
npm test -- NovoRecurso.properties  # GREEN

# 7. Implement real version
vim services/NovoRecurso.live.ts

# 8. Test real version against same properties
npm test -- NovoRecurso.contract  # GREEN

# 9. Integration
vim services/AggregateService.ts
npm test -- integration  # GREEN
```

### B. Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run __tests__/unit",
    "test:properties": "vitest run __tests__/properties",
    "test:integration": "vitest run __tests__/integration",
    "test:contract": "vitest run __tests__/contract",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    
    "schema:codegen": "effect-schema-codegen",
    "schema:validate": "tsc --noEmit",
    
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts",
    
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    
    "ci": "npm run type-check && npm run test:unit && npm run test:properties"
  }
}
```

### C. File Structure

```
src/
├── schemas/           # Schema definitions (source of truth)
│   ├── ProcessoJudicial.ts
│   ├── Movimentacao.ts
│   └── errors/
│       ├── ProcessoNaoEncontrado.ts
│       └── ErroConexaoTribunal.ts
│
├── services/          # Service implementations
│   ├── ProcessoService.ts       # Interface
│   ├── ProcessoService.fake.ts  # In-memory
│   ├── ProcessoService.live.ts  # Production
│   └── ProcessoService.laws.ts  # Property specifications
│
├── layers/            # Layer compositions
│   ├── test.ts
│   ├── development.ts
│   └── production.ts
│
├── domains/           # Domain logic (pure functions)
│   └── processo/
│       ├── validation.ts
│       ├── transitions.ts
│       └── calculations.ts
│
└── __tests__/
    ├── builders/      # Test data builders
    │   └── ProcessoJudicialBuilder.ts
    │
    ├── arbitraries/   # Property-based generators
    │   └── processo.arbitrary.ts
    │
    ├── unit/          # Unit tests (example-based)
    │   └── ProcessoService.test.ts
    │
    ├── properties/    # Property tests
    │   └── ProcessoService.properties.ts
    │
    ├── contract/      # Contract tests (both impls)
    │   └── ProcessoService.contract.ts
    │
    └── integration/   # Integration tests
        └── EndToEnd.integration.ts
```

---

## X. Advanced Patterns

### A. Schema Evolution & Migration

```typescript
// V1 schema
export const ProcessoJudicialV1 = S.Struct({
  id: S.String,
  numero: S.String,
  status: S.String
});

// V2 schema (breaking change)
export const ProcessoJudicialV2 = S.Struct({
  id: ProcessoJudicialId,  // Now structured
  numero: NumeroProcesso,  // Now validated
  status: ProcessoStatusSchema  // Now literal union
});

// Migration function (also tested with properties!)
export const migrateV1toV2 = (
  v1: typeof ProcessoJudicialV1.Type
): Effect.Effect<typeof ProcessoJudicialV2.Type, ParseError> =>
  Effect.gen(function* () {
    const numero = yield* NumeroProcesso.fromString(v1.numero);
    
    return yield* S.decode(ProcessoJudicialV2)({
      id: {
        numero,
        tribunal: extractTribunal(v1.numero)
      },
      numero,
      status: normalizeStatus(v1.status)
    });
  });

// Property: Migration is sound
it("prop: v1 migration produces valid v2", () =>
  fc.assert(
    fc.asyncProperty(
      v1Arbitrary(fc),
      (v1Data) =>
        Effect.gen(function* () {
          const v2 = yield* migrateV1toV2(v1Data).pipe(
            Effect.either
          );
          
          if (Either.isRight(v2)) {
            // If migration succeeds, result is valid v2
            const validated = yield* S.decode(ProcessoJudicialV2)(v2.right).pipe(
              Effect.either
            );
            expect(Either.isRight(validated)).toBe(true);
          }
        }).pipe(Effect.runPromise)
    )
  )
);
```

### B. Dependent Types via Refinements

```typescript
// Status-dependent validation
export const ArquivamentoRequest = S.Struct({
  processoId: ProcessoJudicialId,
  motivo: S.String.pipe(S.minLength(10)),
  documentos: S.NonEmptyArray(S.String)
}).pipe(
  S.filter((req) => ({
    message: "Processo must be 'ativo' to be archived",
    validation: async () => {
      const processo = await getProcesso(req.processoId);
      return processo.status === "ativo";
    }
  }))
);

// Property: Only valid transitions succeed
it("prop: only valid status transitions succeed", () =>
  fc.assert(
    fc.asyncProperty(
      processoArb(fc),
      fc.constantFrom("ativo", "arquivado", "suspenso", "transitado_em_julgado"),
      (processo, newStatus) =>
        Effect.gen(function* () {
          const service = yield* ProcessoService;
          
          const isValidTransition = checkValidTransition(
            processo.status,
            newStatus
          );
          
          const result = yield* service.updateStatus(
            processo.id,
            newStatus
          ).pipe(Effect.either);
          
          if (isValidTransition) {
            expect(Either.isRight(result)).toBe(true);
          } else {
            expect(Either.isLeft(result)).toBe(true);
            if (Either.isLeft(result)) {
              expect(result.left).toBeInstanceOf(InvalidTransitionError);
            }
          }
        }).pipe(Effect.provide(TestLayer), Effect.runPromise)
    )
  )
);
```

### C. Compositional Testing

```typescript
// Test compositions of services
describe("Multi-service workflows", () => {
  it("prop: search >> enrich >> analyze is consistent", () =>
    fc.assert(
      fc.asyncProperty(
        searchQueryArb(fc),
        (query) =>
          Effect.gen(function* () {
            const search = yield* SearchService;
            const enrichment = yield* EnrichmentService;
            const analysis = yield* AnalysisService;
            
            // Pipeline 1: Sequential
            const sequential = yield* search.buscar(query).pipe(
              Effect.flatMap(results =>
                Effect.forEach(results, enrichment.enrich)
              ),
              Effect.flatMap(enriched =>
                Effect.forEach(enriched, analysis.analyze)
              )
            );
            
            // Pipeline 2: Composed
            const composed = yield* search.buscar(query).pipe(
              Effect.flatMap(results =>
                Effect.forEach(
                  results,
                  flow(enrichment.enrich, Effect.flatMap(analysis.analyze))
                )
              )
            );
            
            expect(composed).toEqual(sequential);
          }).pipe(Effect.provide(TestLayer), Effect.runPromise)
      )
    )
  );
});
```

---

## XI. CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      
  property-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:properties -- --numRuns=1000
      
  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:contract
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration
```

---

## XII. Key Takeaways

1. **Schema is the contract**: Start every feature with schema definition
2. **Properties before examples**: Define laws, then test specific cases
3. **Fake first, then real**: Validate interface with fast feedback
4. **Test both implementations**: Ensure contract compliance
5. **Compose validated abstractions**: Build complex systems confidently
6. **Type-driven development**: Let compiler catch bugs early
7. **Progressive refinement**: Small iterations with continuous validation

This pipeline gives you **maximum confidence** for complex legal applications like Research Squad and Pangea, where correctness isn't optional.
