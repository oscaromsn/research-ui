---
modified: 2025-11-04T05:19:36-03:00
---
# Comprehensive Taxonomy of Effect-TS Hexagonal Architecture Patterns

## I. ARCHITECTURAL FOUNDATIONS

### A. Core Architectural Concepts

#### 1. Hexagonal Architecture Principles
- **1.1 Architectural Intent**
  - 1.1.1 Separation of concerns through distinct layers
  - 1.1.2 Clear boundaries between business logic and external systems
  - 1.1.3 Dependency inversion at architectural boundaries
  - 1.1.4 Technology independence of core domain

- **1.2 The Hexagon Model**
  - 1.2.1 Application Core (center): Pure business logic
  - 1.2.2 Ports: Abstract interface definitions
  - 1.2.3 Adapters: Concrete implementations
  - 1.2.4 Dependency flow: Outside → Ports → Core

- **1.3 Directional Architecture**
  - 1.3.1 Primary (Driving/Inbound) Side
	- External actors using the application
	- Entry points and user interfaces
	- "Who wants to use our application?"
  - 1.3.2 Secondary (Driven/Outbound) Side
	- Application dependencies on external systems
	- Infrastructure and external services
	- "What does our application need?"

#### 2. Effect-TS Core Abstractions

- **2.1 Effect<A, E, R> Signature**
  - 2.1.1 Success Channel (A): Output/return type
  - 2.1.2 Error Channel (E): Domain and system failures
  - 2.1.3 Requirements Channel (R): Type-level port dependencies
  - 2.1.4 Compiler-enforced dependency satisfaction

- **2.2 Context.Tag (Service Identifiers)**
  - 2.2.1 Type-safe service identification
  - 2.2.2 Runtime dependency injection key
  - 2.2.3 Port declaration mechanism
  - 2.2.4 Unique string identifiers

- **2.3 Layer System**
  - 2.3.1 Layer<ROut, E, RIn>: Service constructors
  - 2.3.2 Effectful construction with resource management
  - 2.3.3 Memoization by reference identity
  - 2.3.4 Automatic dependency graph resolution
  - 2.3.5 Scope-based resource cleanup

- **2.4 Effect.Service Pattern**
  - 2.4.1 Modern unified port + adapter declaration
  - 2.4.2 Automatic .Default layer generation
  - 2.4.3 Explicit dependency declaration
  - 2.4.4 Resource-safe construction with scoped

### B. Architectural Layers

#### 1. Domain Layer (Pure Business Logic)
- **1.1 Characteristics**
  - Zero dependencies on Effect or external systems
  - Pure functions and immutable data structures
  - Schema-based entity definitions
  - Domain-specific error types
  - Business rule functions

- **1.2 Components**
  - 1.2.1 Models: Schema.Class entities
  - 1.2.2 Errors: Data.TaggedError types
  - 1.2.3 Value Objects: Branded types and immutable values
  - 1.2.4 Business Rules: Pure domain logic functions
  - 1.2.5 Domain Events: Immutable event records

#### 2. Application Layer (Orchestration)
- **2.1 Ports (Contract Definitions)**
  - 2.1.1 Primary Ports: Use case interfaces (what we offer)
  - 2.1.2 Secondary Ports: Dependency interfaces (what we need)
  - 2.1.3 Port characteristics: Interface + Context.Tag
  - 2.1.4 Contract-only definitions (no implementation)

- **2.2 Use Cases (Application Services)**
  - 2.2.1 Business process orchestration
  - 2.2.2 Coordination of multiple ports
  - 2.2.3 Transaction boundaries
  - 2.2.4 Error handling and recovery
  - 2.2.5 Effect.Service implementation pattern

#### 3. Infrastructure Layer (Concrete Implementations)
- **3.1 Secondary Adapters (Driven)**
  - 3.1.1 Persistence adapters (databases)
  - 3.1.2 External service clients (APIs, messaging)
  - 3.1.3 File system adapters
  - 3.1.4 Cache implementations
  - 3.1.5 Test doubles (fakes, mocks, stubs)

- **3.2 Adapter Characteristics**
  - 3.2.1 Implement port interfaces exactly
  - 3.2.2 Local dependency elimination
  - 3.2.3 Resource acquisition and cleanup
  - 3.2.4 Technology-specific logic encapsulation

#### 4. Entrypoints Layer (Driving Adapters)
- **4.1 Primary Adapters**
  - 4.1.1 HTTP/REST APIs
  - 4.1.2 GraphQL resolvers
  - 4.1.3 CLI commands
  - 4.1.4 WebSocket handlers
  - 4.1.5 gRPC servers
  - 4.1.6 Message queue consumers
  - 4.1.7 Scheduled jobs

- **4.2 Composition Root**
  - 4.2.1 Single point of layer assembly
  - 4.2.2 Environment-specific wiring
  - 4.2.3 Single Effect.provide call
  - 4.2.4 Top-level error handling

#### 5. Composition Layer
- **5.1 Layer Composition Strategies**
  - 5.1.1 Development configurations
  - 5.1.2 Testing configurations
  - 5.1.3 Production configurations
  - 5.1.4 Environment-specific layer selection

## II. NAMING CONVENTIONS & TAXONOMY

### A. File Naming Conventions

#### 1. Domain Layer Files
- **1.1 Suffixes**
  - `.model.ts`: Domain entities with business logic
  - `.error.ts`: Error type definitions
  - `.value.ts`: Value objects and branded types
  - `.model.unit.test.ts`: Pure domain logic tests

#### 2. Port Layer Files
- **2.1 Suffixes**
  - `.port.ts`: Service/repository contract interface
  - `.port.contract.test.ts`: Contract verification tests
  - `.port.fake.ts`: Rich in-memory test doubles

#### 3. Application Layer Files
- **3.1 Suffixes**
  - `.service.ts`: Primary port implementation
  - `.service.integration.test.ts`: Cross-service integration tests

#### 4. Adapter Layer Files
- **4.1 Primary Adapter Suffixes**
  - `.http-adapter.ts`: HTTP API adapter
  - `.cli-adapter.ts`: CLI adapter
  - `.grpc-adapter.ts`: gRPC adapter
  - `.http-adapter.system.test.ts`: E2E tests

- **4.2 Secondary Adapter Suffixes**
  - `.memory-adapter.ts`: In-memory implementation
  - `.postgres-adapter.ts`: PostgreSQL implementation
  - `.redis-adapter.ts`: Redis implementation
  - `.stripe-adapter.ts`: External service adapter
  - `.mock-adapter.ts`: Stub/mock for testing
  - `.*.unit.test.ts`: Adapter unit tests
  - `.*.integration.test.ts`: Adapter integration tests

#### 5. Composition Layer Files
- **5.1 Suffixes**
  - `.development.ts`: Development environment layer
  - `.testing.ts`: Test environment layer
  - `.production.ts`: Production environment layer

### B. Service and Component Naming

#### 1. Intent-Based Naming
- **1.1 Capability-Based Services**
  - UserAuthenticator (not UserService)
  - OrderCheckout (not OrderService)
  - EmailDelivery (not EmailService)
  - PaymentProcessor (not PaymentService)

- **1.2 Command/Query/Event Pattern**
  - Commands: CreateOrderCommand, ShipOrderCommand
  - Queries: GetOrderByIdQuery, FindActiveUsersQuery
  - Events: OrderCreatedEvent, PaymentProcessedEvent
  - Handlers: CreateOrderCommandHandler, OrderCreatedEventHandler

#### 2. Tag Naming Convention
- **2.1 Structure**
  - Always suffix with `Tag`
  - Class-based extending Context.Tag
  - String identifier matches interface name exactly
  - Examples: DatabaseTag, EmailServiceTag, UserRepositoryTag

#### 3. Layer Naming Convention
- **3.1 Patterns**
  - Suffix with `Layer`
  - Core layers: CoreDomainLayer, CoreValidationLayer
  - Feature layers: CheckoutServiceLayer, CheckoutLayer
  - Infrastructure: LiveDatabaseLayer, PostgresOrderRepositoryLayer
  - Test layers: TestDatabaseLayer, MockPaymentGatewayLayer
  - Composed: PersistenceLayer, ApplicationLayer

#### 4. Implementation Naming
- **4.1 Live Implementations**
  - Suffix with `Live`: EmailLive, DatabaseLive
  - Layer export: EmailLiveLayer, DatabaseLiveLayer
  - Example: UserServiceLive, PostgresDatabase

- **4.2 Test Implementations**
  - Suffix with `Mock`, `Test`, or `Fake`
  - MockLayer, TestLayer, FakeLayer
  - Example: EmailMockLayer, UserRepositoryMemoryLive

#### 5. Error Type Naming
- **5.1 Structure**
  - Suffix with `Error`
  - Use Data.TaggedError for errors with payload
  - Domain-specific context
  - Examples: OrderNotFoundError, InvalidOrderStateError
  - Grouped in namespaces: CheckoutErrors.All

#### 6. Configuration Naming
- **6.1 Patterns**
  - Interface: DbConfig, SmtpConfig, AppConfig
  - Tag: DbConfigTag, SmtpConfigTag
  - Layer: ConfigLayer (grouped)
  - Schema-based: AppConfigSchema

### C. Function and Method Naming

#### 1. Pure Functions
- **1.1 Simple Names**
  - calculateTotal, isValidEmail, toDomain
  - No prefix (indicates purity)

#### 2. Effectful Functions
- **2.1 Prefixes**
  - load: loadUserById
  - persist: persistOrder
  - fetch: fetchFromCache
  - query: queryDatabase

#### 3. Commands (Imperative)
- **3.1 Verb-based**
  - createOrder, shipOrder, cancelSubscription
  - Indicates state-changing operations

#### 4. Queries (Descriptive)
- **4.1 Noun/question-based**
  - findOrdersByUser, getActiveSubscriptions
  - calculateMonthlyRevenue
  - Indicates read-only operations

#### 5. Event Handlers
- **5.1 Prefixes**
  - on: onOrderCreated
  - handle: handlePaymentProcessed

#### 6. Workflows
- **6.1 Process Names**
  - processCheckout, fulfillOrder, reconcileInventory
  - Indicates multi-step orchestration

#### 7. Repository Methods
- **7.1 Standard Patterns**
  - Existence: exists, existsByUser
  - Single retrieval: findById, getById
  - Multiple retrieval: findAll, findByUser, findWhere
  - Persistence: save, saveAll
  - Updates: update, updateStatus
  - Deletion: delete, deleteWhere

## III. ARCHITECTURAL PATTERNS

### A. Layer Composition Patterns

#### 1. Core Composition Operators
- **1.1 Layer.provide (Dependency Erasure)**
  - Pattern: A → B provided to B → C = A → C
  - Use: Satisfy dependency without exposing it
  - Result: Intermediate type disappears
  - Mental model: Function composition

- **1.2 Layer.provideMerge (Provide and Expose)**
  - Pattern: A → B provided to B → C = A → (B | C)
  - Use: Satisfy dependency AND make it available
  - Result: Both dependencies exposed

- **1.3 Layer.merge (Combine Independent)**
  - Pattern: (A → B) merged with (C → D) = (A | C) → (B | D)
  - Use: Combine independent services at root
  - Result: Union of all inputs and outputs

#### 2. Local Dependency Elimination
- **2.1 Anti-Pattern**
  - Exposing internal dependencies in service signatures
  - Consumers must know about implementation details
  - Dependencies leak to application root

- **2.2 Best Practice**
  - Provide dependencies locally within service file
  - Export clean Layer<Service, never, never>
  - Hide internal wiring from consumers
  - Simplifies composition at application root

#### 3. Single Effect.provide Rule
- **3.1 Forbidden Pattern**
  - Multiple Effect.provide calls
  - Creates multiple scopes with separate MemoMaps
  - Services built multiple times
  - Breaks memoization

- **3.2 Mandatory Pattern**
  - Compose all layers first
  - Single Effect.provide call at edge
  - One scope, one MemoMap
  - Services built exactly once

#### 4. Memoization Strategy
- **4.1 Reference Identity**
  - Layers memoized by reference, not value
  - Function-generated layers create new references
  - Store layer instances, don't regenerate

- **4.2 Best Practice**
  - Create layers once and export
  - Avoid generating layers in loops or functions
  - Use same reference throughout application

### B. Service Architecture Patterns

#### 1. Vertical Slice Architecture
- **1.1 Principles**
  - Organize by feature, not technical layer
  - Each feature slice contains all layers
  - Clear boundaries between features
  - Minimal cross-feature dependencies

- **1.2 Structure**
  - features/checkout/ (all checkout-related code)
  - features/inventory/ (all inventory-related code)
  - Public API exports only what others need

#### 2. Command/Query Segregation (CQS)
- **2.1 Command Pattern**
  - Change state
  - Return minimal data
  - Separate command services
  - Examples: CreateOrderCommand, UpdateInventoryCommand

- **2.2 Query Pattern**
  - Read state only
  - Never modify
  - Separate query services
  - Examples: OrderQueries, findById, listByUser

#### 3. Capability-Based Services
- **3.1 Principles**
  - Define services by capabilities, not entities
  - Avoid entity-based god services
  - Single responsibility per service
  - Clear capability boundaries

- **3.2 Examples**
  - Authentication (not UserService)
  - UserNotifications (not EmailService)
  - OrderFulfillment (not OrderService)

#### 4. Bounded Context Layers
- **4.1 Context Separation**
  - Each context has own models
  - Anti-corruption layers between contexts
  - Context-specific layers
  - Explicit adapters for translation

- **4.2 Implementation**
  - BillingLayer (billing context)
  - ShippingLayer (shipping context)
  - CustomerToRecipientAdapter (translation)

#### 5. Event-Driven Boundaries
- **5.1 Principles**
  - Services communicate through events
  - No direct service-to-service calls
  - Publish/subscribe pattern
  - Decoupled service interactions

- **5.2 Implementation**
  - Define domain events
  - EventBus for publication
  - Services subscribe to relevant events
  - React independently to events

### C. Port and Adapter Patterns

#### 1. Port Definition Patterns
- **1.1 Primary Ports (Inbound)**
  - Use case interfaces
  - What application offers
  - Effect.Service with public methods
  - Orchestration logic

- **1.2 Secondary Ports (Outbound)**
  - Dependency interfaces
  - What application needs
  - Context.Tag + interface
  - No implementation

#### 2. Adapter Implementation Patterns
- **2.1 Primary Adapters**
  - HTTP controllers: Translate HTTP to use cases
  - CLI commands: Translate CLI to use cases
  - GraphQL resolvers: Translate GraphQL to use cases
  - WebSocket handlers: Translate WebSocket to use cases

- **2.2 Secondary Adapters**
  - Database adapters: Implement repository ports
  - External API clients: Implement gateway ports
  - File system adapters: Implement storage ports
  - Cache adapters: Implement cache ports

#### 3. Test Double Strategies
- **3.1 Fake (Port Fake)**
  - Fully-functional in-memory implementation
  - Must pass all contract tests
  - Production-quality alternative
  - Uses Ref/Map for state
  - Example: OrderRepositoryFake

- **3.2 Mock (Mock Adapter)**
  - Canned responses with minimal logic
  - Used when behavior doesn't matter
  - Simple stub implementations
  - Example: PaymentGatewayMock

- **3.3 Memory Adapter**
  - Ephemeral in-memory storage
  - Fast for integration tests
  - Real behavior, volatile state
  - Example: OrderRepositoryMemory

### D. Dependency Management Patterns

#### 1. Dependency Direction Rules
- **1.1 Flow**
  - Domain ← Application ← Infrastructure ← Entrypoints
  - Never reverse (enforced by types)
  - Domain has zero dependencies
  - Infrastructure depends on all

#### 2. Constructor vs Method Dependencies
- **2.1 Constructor Dependencies (Layer)**
  - Application-wide services
  - Static configuration
  - Shared resources (database pools, HTTP clients)
  - Long-lived services

- **2.2 Method Dependencies (Parameters)**
  - Request-specific context (user ID, trace ID)
  - Transaction boundaries
  - Dynamic configurations
  - Scoped resources

#### 3. Service Granularity Rules
- **3.1 Single Responsibility**
  - One reason to change
  - Single clear purpose
  - Focused interface

- **3.2 Stable Dependencies**
  - Depend on abstractions
  - Avoid volatile implementations
  - Port dependencies only

- **3.3 Compose, Don't Couple**
  - Orchestrate through composition
  - No direct service-to-service coupling
  - Use ports for all dependencies

## IV. TESTING TAXONOMY

### A. Test Layer Hierarchy

#### 1. Unit Tests
- **1.1 Characteristics**
  - Test pure logic only
  - No Effect or minimal Effect
  - No I/O operations
  - Speed: Instant (<10ms)

- **1.2 Scope**
  - Domain models and rules
  - Pure functions
  - Business calculations
  - Validation logic

- **1.3 Naming**
  - `.model.unit.test.ts`
  - `.unit.test.ts`

#### 2. Contract Tests
- **2.1 Characteristics**
  - Test against interface using fakes
  - Verify port compliance
  - Use port.fake implementations
  - Speed: Very fast (<50ms)

- **2.2 Scope**
  - Port interface contracts
  - Use case behavior
  - Service contracts
  - Test with full-featured fakes

- **2.3 Naming**
  - `.port.contract.test.ts`
  - `.contract.test.ts`

#### 3. Integration Tests
- **3.1 Characteristics**
  - Multiple components together
  - Real services, fake I/O
  - Cross-service interactions
  - Speed: Fast (<500ms)

- **3.2 Scope**
  - Service implementations
  - Multi-service workflows
  - Real business logic with fake infrastructure
  - Transaction behavior

- **3.3 Naming**
  - `.service.integration.test.ts`
  - `.integration.test.ts`

#### 4. System/E2E Tests
- **4.1 Characteristics**
  - Full stack with fakes
  - Through primary adapters
  - Complete user flows
  - Speed: Moderate (<2s)

- **4.2 Scope**
  - HTTP API endpoints
  - CLI commands
  - GraphQL resolvers
  - Full request/response cycles

- **4.3 Naming**
  - `.http-adapter.system.test.ts`
  - `.system.test.ts`
  - `.e2e.test.ts`

### B. Testing Strategies by Layer

#### 1. Domain Layer Testing
- **1.1 Approach**
  - Pure unit tests
  - No test doubles needed
  - Direct function calls
  - Property-based testing

- **1.2 Focus**
  - Business rule correctness
  - Edge cases and boundaries
  - Invalid state prevention
  - Calculation accuracy

#### 2. Application Layer Testing
- **2.1 Approach**
  - Contract tests with fakes
  - Full in-memory implementations
  - Verify orchestration logic
  - Error handling paths

- **2.2 Focus**
  - Use case completeness
  - Port interactions
  - Transaction boundaries
  - Error propagation

#### 3. Infrastructure Layer Testing
- **3.1 Approach**
  - Integration tests with real systems
  - Test databases
  - Contract compliance
  - Adapter-specific behavior

- **3.2 Focus**
  - Port implementation correctness
  - Technology-specific logic
  - Resource management
  - Error mapping

#### 4. Entrypoints Layer Testing
- **4.1 Approach**
  - E2E tests with test infrastructure
  - Full request/response cycles
  - Swap infrastructure layer
  - Real protocol handling

- **4.2 Focus**
  - Protocol translation accuracy
  - Error response formatting
  - Authentication/authorization
  - Complete user flows

### C. Test Double Taxonomy

#### 1. Fake Implementations
- **1.1 Characteristics**
  - Fully functional
  - Production-quality alternative
  - Must pass all contract tests
  - Rich state management with Ref

- **1.2 Usage**
  - Contract tests
  - Fast integration tests
  - Default test layer
  - Development environments

#### 2. Mock Implementations
- **2.1 Characteristics**
  - Canned responses
  - Minimal behavior
  - No state management
  - Simple Layer.succeed

- **2.2 Usage**
  - When behavior doesn't matter
  - Stub external services
  - Verification not needed
  - Quick test setup

#### 3. Memory Adapters
- **3.1 Characteristics**
  - In-memory storage
  - Real behavior
  - Ephemeral state
  - Fast performance

- **3.2 Usage**
  - Integration tests
  - Local development
  - CI/CD pipelines
  - Rapid iteration

## V. EFFECT-TS SPECIFIC PATTERNS

### A. Modern Effect.Service Pattern

#### 1. Unified Declaration
- **1.1 Structure**
  - Service name and tag
  - Dependencies array
  - Effect or scoped implementation
  - Automatic .Default layer

- **1.2 Benefits**
  - Single declaration point
  - Explicit dependencies
  - Type inference
  - Cleaner than manual Layer.effect

#### 2. Resource Management
- **2.1 Scoped Pattern**
  - Use scoped for resource-managing services
  - Automatic cleanup via Scope
  - Effect.addFinalizer for cleanup
  - Guaranteed resource release

- **2.2 Effect Pattern**
  - Use effect for stateless services
  - Simple service construction
  - No resource cleanup needed

### B. Type-Level Architecture

#### 1. Effect<A, E, R> as Architecture
- **1.1 Success Channel (A)**
  - Domain outcomes
  - Return types
  - What operation produces

- **1.2 Error Channel (E)**
  - Domain errors
  - System failures
  - What can go wrong
  - Explicit error handling

- **1.3 Requirements Channel (R)**
  - Port dependencies
  - Type-level dependency declaration
  - Compiler-enforced satisfaction
  - Dependency graph

#### 2. Branded Types for Boundaries
- **2.1 Domain Branding**
  - DomainOrderId, DomainUserId
  - Type-safe domain identifiers
  - Prevent mixing contexts

- **2.2 API Branding**
  - ApiOrderId, ApiUserId
  - External representation types
  - Clear boundary markers

- **2.3 Database Branding**
  - DbOrderId, DbUserId
  - Persistence types
  - Database-specific formats

- **2.4 Conversion Functions**
  - Explicit boundary crossing
  - Type-safe translations
  - Clear transformation points

### C. Error Handling Patterns

#### 1. Tagged Errors
- **1.1 Data.TaggedError**
  - Errors with payload
  - Discriminated unions
  - Pattern matching support
  - Stack traces

- **1.2 Data.TaggedClass**
  - Simple errors without payload
  - Lightweight error types
  - Clear error identity

#### 2. Error Grouping
- **2.1 Namespaces**
  - Group related errors
  - Feature-specific error sets
  - Union types for all errors
  - Example: CheckoutErrors.All

#### 3. Error Mapping
- **3.1 Boundary Mapping**
  - Domain to application errors
  - Application to API errors
  - Infrastructure to domain errors
  - Clear error translation

### D. Schema and Validation Patterns

#### 1. Schema-Based Models
- **1.1 Schema.Class**
  - Domain entity definitions
  - Automatic validation
  - Type derivation
  - Encoding/decoding

- **1.2 Schema.Struct**
  - Data transfer objects
  - Configuration schemas
  - API request/response types

#### 2. Validation Strategies
- **2.1 Domain Validation**
  - Business rule validation
  - Schema constraints
  - Branded type refinement

- **2.2 Boundary Validation**
  - Input validation at entry points
  - Schema.decode for external data
  - Type-safe parsing

## VI. DIRECTORY STRUCTURE PATTERNS

### A. Recommended Project Structure

```
src/
├── 01-domain/                    # Pure business logic (no deps)
│   ├── models/
│   ├── errors/
│   └── value-objects/
├── 02-ports/                     # Contracts (interfaces only)
│   ├── primary/                  # Inbound ports
│   └── secondary/                # Outbound ports
├── 03-application/               # Business logic implementations
│   └── services/
├── 04-adapters/                  # Infrastructure adapters
│   ├── primary/                  # Driving adapters
│   └── secondary/                # Driven adapters
└── 05-composition/               # Dependency injection
```

### B. Flat Infrastructure Structure

```
infrastructure/
├── persistence/
│   ├── TaskRepository.postgres.ts
│   └── TaskRepository.memory.ts
├── messaging/
│   └── EmailService.smtp.ts
└── external/
    └── PaymentGateway.stripe.ts
```

### C. Feature-Based Structure (Alternative)

```
features/
├── checkout/
│   ├── domain/
│   ├── ports/
│   ├── services/
│   ├── adapters/
│   └── CheckoutLayer.ts
└── inventory/
    ├── domain/
    ├── ports/
    ├── services/
    ├── adapters/
    └── InventoryLayer.ts
```

## VII. BEST PRACTICES & ANTI-PATTERNS

### A. DO: Best Practices

#### 1. Layer Composition
- Provide dependencies locally within service files
- Compose all layers into MainLayer, then Effect.provide once
- Use Layer.merge for independent services
- Use Layer.provide to erase dependencies
- Use Layer.provideMerge to expose shared dependencies
- Store layer references (avoid function-generated layers)

#### 2. Service Design
- One service per capability/use case
- Capability-based names (not entity-based)
- Single responsibility principle
- Depend only on port abstractions
- Keep services focused and cohesive

#### 3. Port Design
- Interfaces with Effect-returning methods
- Clear, descriptive method names
- Explicit error types in signatures
- Minimal, focused interfaces (ISP)

#### 4. Testing
- Test doubles at port boundaries
- Fast tests with in-memory implementations
- Contract tests for all ports
- Swap layers for different environments

#### 5. Type Safety
- Use branded types for domain identifiers
- Make invalid states unrepresentable
- Explicit error types in Effect signatures
- Leverage compiler for architecture enforcement

### B. DON'T: Anti-Patterns

#### 1. Layer Composition
- Never call Effect.provide multiple times
- Don't expose internal dependencies in service signatures
- Don't generate layers inside functions without storing references
- Don't manually manage service construction order
- Don't use global mutable state instead of services

#### 2. Service Design
- Don't create entity-based god services (UserService with 50+ methods)
- Don't allow services to become dumping grounds
- Don't couple services directly (use ports)
- Don't violate dependency direction rules
- Don't create circular dependencies

#### 3. Naming
- Don't use generic names (Service, Manager, Handler alone)
- Don't mix naming patterns inconsistently
- Don't hide architectural intent in names
- Don't use misleading or ambiguous names

#### 4. Testing
- Don't test against concrete implementations
- Don't couple tests to implementation details
- Don't skip contract tests
- Don't use heavy test doubles when fakes suffice

#### 5. Architecture
- Don't let domain depend on infrastructure
- Don't bypass ports with direct calls
- Don't leak technology concerns into domain
- Don't create dependencies on unstable abstractions

## VIII. DEVELOPMENT WORKFLOW

### A. Contract-Driven TDD Workflow

#### 1. Phase 1a: Define Domain
- Create domain models (Schema.Class)
- Define domain errors (Data.TaggedError)
- Write pure business rules
- Unit test domain logic

#### 2. Phase 1b: Define Contracts (Ports)
- Define primary ports (use case interfaces)
- Define secondary ports (dependency interfaces)
- Create Context.Tags for ports
- Write contract tests with fakes

#### 3. Phase 2: Test Contracts
- Implement port fakes (in-memory)
- Write contract tests
- Verify interface completeness
- Ensure fakes pass all tests

#### 4. Phase 3a: Implement Application Logic
- Implement primary ports (use cases)
- Orchestrate secondary ports
- Handle errors and transactions
- Integration test with fakes

#### 5. Phase 3b: Implement Adapters
- Implement secondary adapters (infrastructure)
- Local dependency elimination
- Adapter-specific tests
- Integration tests with real systems

#### 6. Phase 4: Compose Application
- Create layer compositions
- Single Effect.provide at edge
- Environment-specific configurations
- E2E testing

### B. Iterative Refinement

#### 1. Start Simple
- In-memory implementations first
- Basic functionality
- Fast iteration cycle
- Prove architecture

#### 2. Add Complexity
- Real implementations when needed
- Performance optimizations
- Production requirements
- Monitoring and observability

#### 3. Refactor Continuously
- Extract common patterns
- Improve naming
- Simplify dependencies
- Maintain clean boundaries

## IX. VALIDATION & ENFORCEMENT

### A. Static Analysis

#### 1. ESLint Rules
- Restrict imports between layers
- Enforce dependency direction
- Prevent circular dependencies
- Validate naming conventions

#### 2. TypeScript Configuration
- Strict mode enabled
- Path mappings for clean imports
- Module resolution
- Type checking rigor

### B. Architectural Validation

#### 1. Validation Script
- Check file naming conventions
- Verify layer dependencies
- Validate port contracts
- Ensure test coverage

#### 2. CI/CD Integration
- Automated architecture checks
- Test suite execution
- Dependency graph analysis
- Breaking change detection
