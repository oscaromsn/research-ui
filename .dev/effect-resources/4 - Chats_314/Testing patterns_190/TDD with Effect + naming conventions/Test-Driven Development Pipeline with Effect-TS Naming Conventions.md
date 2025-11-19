---
modified: 2025-10-26T20:26:13-03:00
---
## Test-Driven Development Pipeline with Effect-TS Naming Conventions

### Phase 1: Error-First Design

#### Step 1.1: Define Domain Errors
- Create error classes extending `Data.TaggedError` with descriptive names ending in `Error`
- Group related errors in domain-specific error files
- Define error union types for service error channels
- Run type-check immediately to catch issues early

#### Step 1.2: Create Error Hierarchies
- Define base errors for common failure patterns
- Create specific errors for each unique failure mode
- Document recovery strategies in error definitions
- Establish error naming patterns that indicate severity and domain

### Phase 2: Schema Definition

#### Step 2.1: Define Base Shapes
- Create schemas with `Shape` suffix for all domain models
- Define branded type shapes for domain primitives
- Establish validation rules within schema definitions
- Group related shapes in dedicated shape modules

#### Step 2.2: Create Operation Shapes
- Define input shapes prefixed with operation names (`CreateUserShape`, `UpdateOrderShape`)
- Create response shapes for query operations
- Define filter and pagination shapes for list operations
- Validate all shapes compile before proceeding

### Phase 3: Interface Contract Definition

#### Step 3.1: Create Service Interfaces
- Define interfaces using plain names without suffixes
- Create Context.Tag with matching plain name
- Specify complete error channels in return types
- Keep interfaces focused on single responsibilities

#### Step 3.2: Write Contract Tests
- Create contract test functions in the same file as interfaces
- Write tests that verify behavior, not implementation
- Ensure contracts test both success and failure paths
- Make contracts reusable across all implementations

### Phase 4: Test Implementation

#### Step 4.1: Create Test Doubles
- Implement `Test` suffix versions for simple stubs
- Create `InMemory` suffix versions for stateful fakes
- Build `Spy` suffix versions when call tracking is needed
- Develop scenario-specific doubles (`Empty`, `Full`, `Flaky`) as needed

#### Step 4.2: Execute Contract Tests
- Import contract test functions
- Apply contracts to test implementations
- Verify all test doubles pass contract tests
- Ensure test implementations are minimal but complete

### Phase 5: Production Implementation

#### Step 5.1: Build Live Implementations
- Create implementations with `Live` suffix for production code
- Implement technology-specific variants (`PostgreSQL`, `DynamoDB`) when needed
- Ensure all implementations depend only on interfaces
- Validate implementations against contract tests immediately

#### Step 5.2: Handle Dependencies
- Use `yield*` to access required services
- Keep dependency lists minimal and explicit
- Create dependency interfaces if they don't exist
- Verify circular dependencies are avoided

### Phase 6: Layer Composition

#### Step 6.1: Create Base Layers
- Export individual service layers matching implementation names
- Build technology-specific layer sets
- Create environment-specific stacks (`DevelopmentStack`, `ProductionStack`)
- Ensure layers are composable and reusable

#### Step 6.2: Compose Application Layers
- Combine layers in application entry points
- Create specialized compositions for different deployment targets
- Build test stacks for specific scenarios
- Validate all required services are provided

### Phase 7: Integration Testing

#### Step 7.1: Multi-Service Tests
- Create integration tests that span multiple services
- Use `InMemory` implementations for fast execution
- Test complete workflows end-to-end
- Verify service interactions match expectations

#### Step 7.2: Infrastructure Tests
- Test with real infrastructure using `Live` implementations
- Verify database transactions work correctly
- Test external service integrations
- Validate error propagation across service boundaries

### Phase 8: A/B Testing Support

#### Step 8.1: Create Variant Implementations
- Build experimental variants with letter suffixes (`LiveA`, `LiveB`)
- Maintain same interface across all variants
- Create router services to manage variant selection
- Ensure all variants pass original contract tests

#### Step 8.2: Add Variant-Specific Tests
- Write tests for variant-specific behavior
- Create comparison tests between variants
- Test fallback mechanisms
- Verify data compatibility across variants

### Phase 9: Progressive Rollout

#### Step 9.1: Build Rollout Layers
- Create percentage-based layer providers
- Implement ring-based deployment stacks
- Build fallback compositions with automatic recovery
- Add circuit breaker wrappers where needed

#### Step 9.2: Monitor and Control
- Implement experiment configuration services
- Create cohort assignment logic
- Build metrics collection with variant tags
- Set up automated rollback triggers

### Phase 10: Continuous Verification

#### Step 10.1: Automated Checks
- Run contract tests against all implementations
- Verify type safety across entire codebase
- Check naming convention compliance
- Validate test coverage thresholds

#### Step 10.2: Pipeline Gates
- Block commits that break contracts
- Prevent merges without passing tests
- Enforce naming conventions via linting
- Require contract tests for new services

### Execution Flow

#### Development Cycle
1. Write error types with `Error` suffix
2. Define schemas with `Shape` suffix
3. Create interface with plain name
4. Write contract tests in interface file
5. Implement `Test` version first
6. Verify contracts pass with test double
7. Implement `Live` version
8. Verify contracts pass with live implementation
9. Create layer compositions with `Stack` suffix
10. Run integration tests across stack

#### Verification Commands
- Type-check after every definition
- Run contract tests after every implementation
- Execute integration tests before commits
- Validate naming conventions continuously
- Check test coverage incrementally

#### Rollout Process
1. Create variant implementations with appropriate suffixes
2. Build router service for variant selection
3. Deploy with progressive layer composition
4. Monitor metrics tagged with variants
5. Automated graduation or rollback based on criteria

This pipeline ensures consistent naming, comprehensive testing, and safe experimentation while maintaining development velocity and code quality.
