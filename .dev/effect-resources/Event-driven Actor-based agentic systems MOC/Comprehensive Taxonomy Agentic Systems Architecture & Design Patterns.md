---
modified: 2025-11-04T07:44:44-03:00
---
# Comprehensive Taxonomy: Agentic Systems Architecture & Design Patterns

## I. FOUNDATIONAL ARCHITECTURAL MODELS

### A. Execution Paradigms
#### 1. Workflow Model
- **1.1 Core Characteristics**
  - Pre-defined execution graphs (DAGs, state machines)
  - Declarative specification of control flow
  - Centralized coordination
  - Deterministic execution paths
  - Explicit state transitions
  
- **1.2 State Management**
  - Centralized workflow context
  - State as execution position + accumulated data
  - Explicit state transitions in graph
  - Checkpointing and resumability
  - Immutable state transformations
  
- **1.3 Communication Patterns**
  - Synchronous step chaining
  - Typed inputs/outputs
  - Function invocations as tool calls
  - Strong contracts between steps
  - Return values and exceptions
  
- **1.4 Use Cases**
  - Deterministic orchestration
  - Batch/transactional work
  - Bounded execution time
  - Clear start and end points
  - Compliance-critical processes

#### 2. Actor Model
- **2.1 Core Characteristics**
  - Emergent behavior from message exchanges
  - Imperative message handling
  - Distributed coordination
  - Non-deterministic execution
  - Race conditions as features
  
- **2.2 State Management**
  - Encapsulated state per actor
  - State transitions via messages
  - Independent state management
  - Private state (observable only through behavior)
  - Typically mutable state
  
- **2.3 Communication Patterns**
  - Asynchronous message passing
  - Location transparency
  - Fire-and-forget or request-reply
  - Messages to specialized actors
  - Weak coupling via message schemas
  
- **2.4 Use Cases**
  - Autonomous agent behavior
  - Dynamic parallelism
  - Long-running stateful services
  - Multi-agent coordination
  - Potentially infinite lifetime

#### 3. Hybrid Approaches
- **3.1 Actors Executing Workflows**
  - Actor receives high-level messages
  - Internal workflow execution
  - Workflow sends messages to other actors
  - Combines actor communication + workflow reliability
  
- **3.2 Workflows Spawning Actors**
  - Workflow creates actors dynamically
  - Actors perform long-running work
  - Workflow monitors via messages
  - Continues after actor completion
  
- **3.3 Sagas as Actor Choreography**
  - Each participant is an actor
  - Emergent workflow from exchanges
  - No central coordinator
  - Distributed transactions

## II. CORE ARCHITECTURAL PRINCIPLES

### A. Actor Design Principles
#### 1. Actor = Persistent Domain of Expertise
- **1.1 Defining Characteristics**
  - Maps to meaningful lifecycle
  - Accumulates domain-specific knowledge
  - Develops specialized intuition
  - Learns from successes/failures
  - Builds irreplaceable expertise
  
- **1.2 Anti-Pattern: Decision-Point Function**
  - Stateless approval/rejection
  - No expertise development
  - Replaceable by simple rules
  - No accumulated state
  - Pure routing logic

#### 2. Three-Layer Separation
- **2.1 Actor State (Current Context)**
  - Current values and status
  - Recent events (short-term memory: 3-5 items)
  - Active monitoring items
  - Immediate beliefs/assessments
  - Size: 2K-25K tokens depending on complexity
  
- **2.2 Model Weights (Learned Patterns)**
  - Statistical patterns and success rates
  - Optimal parameters and thresholds
  - Policy functions (what to do when)
  - Pattern recognition neural nets
  - Updated through RL training
  
- **2.3 Tools (On-Demand Analysis)**
  - Historical data queries
  - Complex calculations
  - Deep analysis and simulations
  - External data retrieval
  - Returns insights, not raw data

#### 3. Event-Driven Architecture
- **3.1 System-Level Triggers (Critical Infrastructure)**
  - Mandatory, cannot be disabled
  - Defensive (protect, comply)
  - Critical priority
  - Stable over time
  - Categories:
	- Compliance & regulatory
	- Risk & safety
	- Process milestones
	- External events
  
- **3.2 Agent-Defined Triggers (Strategic Optimization)**
  - Dynamic (set/modified by actors)
  - Offensive (exploit, optimize)
  - Context-dependent priority
  - Evolving with strategy
  - Actor-specific
  - Patterns:
	- Opportunity monitoring
	- Pattern completion watching
	- Confirmation gathering
	- Timing optimization

#### 4. Deterministic Workflows for Known Processes
- **4.1 When to Use Workflows**
  - Process clearly defined
  - Steps sequential and known
  - No judgment required
  - Compliance/safety critical
  - Fast execution needed
  
- **4.2 When to Use LLM Reasoning**
  - Situation novel/ambiguous
  - Multiple valid approaches
  - Context-dependent judgment
  - Trade-offs to balance
  - Strategic implications
  
- **4.3 Workflow Patterns**
  - State machine pattern
  - Checklist pattern
  - Escalation pattern
  - Calculation pipeline pattern

#### 5. Stateful Actors Make Contextual Decisions
- **5.1 Elements of Stateful Decision-Making**
  - Reference recent history
  - Apply accumulated beliefs
  - Learn from similar past situations
  - Maintain continuity across decisions
  - Build on previous decisions
  
- **5.2 Anti-Pattern: Stateless Decisions**
  - No memory of past attempts
  - No sense of ongoing situation
  - No learning from outcomes
  - Each decision starts from scratch

#### 6. Context Window Optimization
- **6.1 Token Budget Guidelines**
  - Simple monitoring: 1-5K tokens
  - Specialized analysis: 8-15K tokens
  - Strategic coordination: 18-25K tokens
  - Complex integration: 25-40K tokens (rare)
  
- **6.2 Optimization Techniques**
  - Summarization over retention
  - Layered detail (current full, recent medium, historical query)
  - Active vs. archived
  - Computed indicators over raw data

## III. DESIGN PATTERNS

### A. Actor Specialization Patterns
#### 1. The Specialist
- **Purpose**: Deep expertise in narrow domain
- **Characteristics**:
  - Watches one thing intensely
  - Learns specific patterns
  - Develops domain intuition
- **State**: Current status, recent observations, active patterns
- **Tools**: Domain-specific analysis, historical pattern matching
- **Examples**: Cardiovascular specialist, contracts expert, product line specialist

#### 2. The Coordinator
- **Purpose**: Strategic oversight, belief maintenance
- **Characteristics**:
  - Maintains working theories
  - Coordinates specialists
  - Makes strategic decisions
- **State**: Active beliefs/theories, strategic decisions, monitoring priorities
- **Tools**: Value calculation, simulation, strategic planning
- **Examples**: Treatment plan coordinator, case strategist, product roadmap manager

#### 3. The Guardian
- **Purpose**: Enforce constraints, manage risk, ensure compliance
- **Characteristics**:
  - Learns limits from experience
  - Enforces rules
  - Emergency response
- **State**: Current risk metrics, active concerns, recent violations
- **Tools**: Risk calculation, stress testing, compliance checking
- **Examples**: Safety monitor, risk manager, compliance checker

#### 4. The Executor
- **Purpose**: Optimize specific action execution
- **Characteristics**:
  - Learns optimal tactics
  - Microstructure expertise
  - Quality metrics
- **State**: Active executions, current performance, immediate conditions
- **Tools**: Execution analytics, quality benchmarking, timing optimization
- **Examples**: Procedure executor, process optimizer, delivery coordinator

#### 5. The Integrator
- **Purpose**: Synthesize information across domains
- **Characteristics**:
  - Broad context awareness
  - Cross-domain pattern recognition
- **State**: Multi-domain status, integration points, coordination needs
- **Tools**: Cross-domain analysis, dependency mapping, impact assessment
- **Examples**: Cross-functional coordinator, multi-specialist synthesizer

### B. Organizational Patterns
#### 1. Matter-Centric Actors (Legal Domain Example)
- Natural unit of stateful work
- Accumulates findings over time
- Learns source relevance
- Spans extended timelines
- Maintains audit trail

#### 2. Specialized Research Actors
- Domain-specific expertise maintenance
- Concurrent request handling
- Meta-knowledge accumulation
- Performance learning

#### 3. Jurisdictional Actors
- Jurisdiction-specific knowledge
- Different authority sources
- Citation format variations
- Research methodology differences

#### 4. Citation Graph Actors
- Persistent graph maintenance
- Complex query support
- Incremental evolution
- Authority score computation

#### 5. Human-in-the-Loop Actors
- Async review coordination
- Feedback accumulation
- Preference learning
- Multi-reviewer coordination

## IV. IMPLEMENTATION ARCHITECTURE

### A. Effect-TS Actor System Components
#### 1. Core Abstractions
- **Entity Definition**
  - Entity ID type
  - RecipientType specification
  - Behavior function (state, message → Effect)
  - State persistence via Ref
  
- **Message Protocol**
  - Structured message types
  - Correlation IDs
  - Priority levels
  - Payload schemas
  
- **Sharding System**
  - Location transparency
  - Service semantics
  - Distributed actor access
  - Cluster configuration

#### 2. State Management Primitives
- **Ref (Mutable State)**
  - Atomic updates
  - Serial message processing
  - State isolation
  
- **SubscriptionRef (Reactive State)**
  - State change subscriptions
  - Stream-based observation
  - Reactive updates

#### 3. Supervision and Fault Tolerance
- **Retry Mechanisms**
  - Exponential backoff
  - Schedule-based retry
  - Automatic restart
  
- **Error Handling**
  - Cause logging
  - Supervisor escalation
  - Compensating actions

### B. Communication Infrastructure
#### 1. Message Types
- **REQUEST**: Requires response
- **RESPONSE**: Reply to request (with correlation_id)
- **EVENT**: Notification (no response required)
- **COMMAND**: Directive with acknowledgment

#### 2. Message Structure
- **Required Fields**:
  - message_id, from_actor, to_actor
  - message_type, priority, timestamp
  - payload
  
- **Optional Fields**:
  - correlation_id, requires_response
  - timeout_ms, retry_policy

#### 3. Routing Logic
- Priority classification
- Recipient determination
- Delivery mode selection
- Timeout handling

### C. Tool Architecture
#### 1. Tool Categories
- **Historical Query Tools**: Similar situation finding
- **Analytics Tools**: Complex metric calculation
- **Simulation Tools**: Scenario projection
- **External Data Tools**: API/data retrieval
- **Pattern Detection Tools**: Anomaly/pattern detection

#### 2. Tool Design Principles
- Pre-computed insights (not raw data)
- Bounded outputs (context-window friendly)
- Domain-specific specialization
- On-demand invocation
- Actionable results

#### 3. Tool Output Specifications
- Maximum item limits
- Pre-analyzed statistics
- Confidence scores
- Token size estimates

## V. DESIGN PIPELINE (6-PHASE APPROACH)

### Phase 1: Domain Analysis & Decomposition (2-4 weeks)
#### Stage 1.1: Domain Mapping
- Identify domain boundaries
- Map decision landscape (strategic/tactical/operational)
- Identify knowledge domains

#### Stage 1.2: Process Flow Analysis
- Map current workflows
- Identify decision points
- Classify decision types (deterministic/analytical/strategic)

#### Stage 1.3: Expertise Identification
- Natural specializations
- Validation of boundaries
- Dependency mapping

#### Stage 1.4: Event & Trigger Identification
- System-level events
- Domain events
- Event criticality classification

### Phase 2: Actor Architecture Design (2-3 weeks)
#### Stage 2.1: Actor Identification
- Map expertise domains to actors
- Validate actor design
- Identify missing actors

#### Stage 2.2: Actor Hierarchy & Communication
- Define actor relationships
- Design coordination patterns
- Identify conflict resolution

#### Stage 2.3: Responsibility Mapping
- Define clear boundaries
- Create RACI matrix
- Validate no gaps/overlaps

### Phase 3: Event & Communication Design (1-2 weeks)
#### Stage 3.1: Event Architecture
- System-level event registry
- Agent-defined event API
- Event routing logic

#### Stage 3.2: Message Protocol Design
- Message structure definition
- Message type specification
- Payload structure design

#### Stage 3.3: Communication Patterns
- Standard pattern documentation
- Flow examples
- Timeout/retry policies

### Phase 4: State/Tool/Model Specification (2-3 weeks)
#### Stage 4.1: Actor State Design
- State schema per actor
- State validation
- State size estimation

#### Stage 4.2: Tool Design
- Required tools per actor
- Tool interface design
- Tool output specification

#### Stage 4.3: Model Weights Planning
- Learning objective identification
- Model component specification
- Initial vs. learned capability planning

#### Stage 4.4: Context Window Budgeting
- Per-actor budget calculation
- Optimization for large actors
- System-wide budget validation

### Phase 5: Implementation & Integration (4-8 weeks)
#### Stage 5.1: Infrastructure Setup
- Message bus configuration
- Actor runtime setup
- State storage implementation
- Tool execution engine

#### Stage 5.2: Actor Implementation
- Base actor class
- Specialized actor implementations
- Deterministic workflow integration

#### Stage 5.3: Integration & Testing
- Unit tests per actor
- Integration tests for actor pairs
- End-to-end scenario tests

#### Stage 5.4: Observability & Monitoring
- Structured logging
- Metrics collection
- Dashboard implementation

### Phase 6: Learning & Optimization (Ongoing)
#### Stage 6.1: Trajectory Collection
- Episode tracking
- Action recording
- Outcome association

#### Stage 6.2: Reward Function Design
- Multi-objective rewards
- Actor-specific objectives
- Delayed reward handling

#### Stage 6.3: Model Training
- Training data preparation
- Actor model training
- A/B testing implementation

#### Stage 6.4: Continuous Improvement
- Gradual rollout
- Performance monitoring
- Automated retraining pipeline

## VI. DOMAIN-SPECIFIC APPLICATIONS

### A. Healthcare
#### 1. Actor Types
- Diagnostic specialists (disease-specific)
- Medication management specialists
- Patient care coordinators
- Quality monitors
- Safety guardians

#### 2. Key Patterns
- Continuity of care (stateful treatment)
- Multi-specialist coordination
- Safety-critical event handling
- Regulatory compliance monitoring

#### 3. Example State
- Current patient status
- Treatment history
- Response patterns
- Active monitoring items

### B. Legal
#### 1. Actor Types
- Case law researchers
- Statutory analysts
- Treaty interpreters
- Jurisdictional experts
- Matter coordinators

#### 2. Key Patterns
- Matter-centric organization
- Cross-jurisdictional research
- Citation graph analysis
- Lawyer review integration

#### 3. Example State
- Matter context
- Research history
- Relevant authorities
- Learned source preferences

### C. Finance
#### 1. Actor Types
- Portfolio managers
- Risk assessors
- Trading specialists
- Compliance monitors
- Market analysts

#### 2. Key Patterns
- Investment thesis maintenance
- Multi-asset coordination
- Risk-return optimization
- Regulatory adherence

### D. Manufacturing
#### 1. Actor Types
- Quality engineers
- Production line monitors
- Maintenance coordinators
- Supply chain optimizers
- Safety supervisors

#### 2. Key Patterns
- Real-time quality monitoring
- Predictive maintenance
- Process optimization
- Safety compliance

### E. Customer Service
#### 1. Actor Types
- Account managers
- Issue resolvers
- Escalation coordinators
- Sentiment analysts
- Satisfaction trackers

#### 2. Key Patterns
- Customer relationship continuity
- Sentiment tracking over time
- Escalation path management
- Feedback loop integration

## VII. ANTI-PATTERNS & PITFALLS

### A. Architectural Anti-Patterns
#### 1. The God Actor
- **Problem**: Single actor doing everything
- **Issues**: Context explosion, no specialization, learning difficulties
- **Solution**: Decompose into specialized actors

#### 2. The Orchestrator
- **Problem**: Actor as pure message router
- **Issues**: No state, no expertise, could be simple router
- **Solution**: Replace with event dispatcher or add expertise domain

#### 3. The Stateless Function
- **Problem**: Actor with no memory between invocations
- **Issues**: Cannot learn, no continuity, repeats mistakes
- **Solution**: Add state, maintain history, reference outcomes

#### 4. The Data Dumper
- **Problem**: Tool returning massive unprocessed data
- **Issues**: Context overflow, expensive processing, no insights
- **Solution**: Return pre-analyzed insights with bounded outputs

#### 5. Stats in State
- **Problem**: State bloated with statistics
- **Issues**: Wastes context, should be in model
- **Solution**: State=current, Model=learned, Tools=historical queries

### B. Design Anti-Patterns
#### 1. Decision-Point Actors
- **Problem**: Actor per if/else statement
- **Issues**: Actor proliferation, latency, debugging complexity
- **Solution**: Map to persistent expertise domains

#### 2. Too Fine-Grained Decomposition
- **Problem**: Micro-actors for trivial decisions
- **Issues**: Infrastructure overhead, loss of cohesion
- **Solution**: Use state boundaries, not decision boundaries

#### 3. Workflow as Actor Replacement
- **Problem**: Using workflows where actors needed
- **Issues**: Loss of persistent state, no learning
- **Solution**: Use actors for stateful cognition, workflows for execution

## VIII. OBSERVABILITY & TESTING

### A. Logging Architecture
#### 1. Structured Logging
- Decision logging with context
- Message flow tracking
- Tool call instrumentation
- Performance metrics

#### 2. Tracing
- Distributed tracing integration
- Actor interaction visualization
- Causal relationship tracking
- Span hierarchy

### B. Metrics System
#### 1. Actor-Level Metrics
- Decision latency
- Message processing rate
- Error rates
- Tool call success rates

#### 2. System-Level Metrics
- Total throughput
- End-to-end completion time
- Active actor counts
- Message queue depths

#### 3. Business Metrics
- Decisions per hour
- Success rate by type
- Time to resolution
- Resource utilization

### C. Testing Strategy
#### 1. Unit Testing
- Actor behavior tests
- State transition validation
- Tool interaction verification

#### 2. Integration Testing
- Actor pair communication
- Message flow validation
- Coordination pattern verification

#### 3. End-to-End Testing
- Complete scenario execution
- Multi-actor coordination
- System-wide behavior validation

## IX. LEARNING & OPTIMIZATION

### A. Reinforcement Learning Integration
#### 1. Trajectory Collection
- State-action-outcome tracking
- Episode lifecycle management
- Outcome association

#### 2. Reward Design
- Multi-objective rewards
- Domain-specific objectives
- Delayed reward handling
- Success metric definition

#### 3. Training Pipeline
- Offline training
- A/B testing framework
- Gradual rollout mechanism
- Performance monitoring

### B. Continuous Improvement
#### 1. Model Evolution
- Periodic retraining
- Version management
- Rollback capability
- Performance comparison

#### 2. Adaptation Mechanisms
- Feedback incorporation
- Strategy adjustment
- Threshold optimization
- Pattern recognition improvement

## X. IMPLEMENTATION GUIDANCE

### A. Technology Stack
#### 1. Effect-TS Components
- @effect/cluster for actors
- Effect composition for workflows
- Streams for reactive coordination
- Services/Layers for DI

#### 2. Infrastructure Requirements
- Message bus (RabbitMQ/Kafka/Redis Streams)
- Actor runtime (Akka/Orleans/Custom)
- State storage (PostgreSQL/MongoDB/Redis)
- Tool execution engine (Lambda/Kubernetes)

### B. Development Approach
#### 1. Phased Implementation
- Week 1: Matter actors (or equivalent domain entity)
- Week 2-3: External tool services
- Week 4: Specialist actors as expertise emerges
- Week 5+: Advanced patterns (graphs, human-in-loop)

#### 2. Evolution Triggers
- Repeated pattern detection
- Learning opportunity identification
- Performance optimization needs
- Scaling requirements

### C. Best Practices
#### 1. Design Principles
- Start simple (services + Refs)
- Scale to actors (when distribution needed)
- Compose with workflows (for reliability)
- Observe everything (tracing)

#### 2. Contract-First Development
- Define service interfaces first
- Test with fake layers
- Implement actor backing later
- Maintain API stability

## XI. SUCCESS CRITERIA

### A. Per-Actor Metrics
- Expertise development (measurable improvement)
- Decision quality (outcome success rate)
- Learning rate (speed of improvement)
- Context efficiency (value per token)
- Response quality (appropriate depth)

### B. System-Level Metrics
- Collective intelligence (beyond individual capabilities)
- Coordination quality (collaboration effectiveness)
- Communication efficiency (message overhead vs. value)
- Resource utilization (compute/token efficiency)
- Reliability (uptime, graceful degradation)
- Scalability (ability to add domains)

### C. Learning Metrics
- Convergence speed (time to competence)
- Transfer learning (knowledge sharing)
- Adaptation rate (response to changes)
- Failure recovery (learning from mistakes)
- Policy improvement (measurable RL gains)

## XII. VALIDATION CHECKLISTS

### A. Actor Design Checklist
- [ ] Maps to persistent domain of expertise
- [ ] Has meaningful lifecycle and accumulation
- [ ] Clearly defined state (current context only)
- [ ] Specialized tools for domain
- [ ] Bounded context window (< 25K tokens)
- [ ] Clear RL training environment

### B. Architecture Checklist
- [ ] State management (current values only)
- [ ] Model weights (learned patterns separate)
- [ ] Tool design (insights, not raw data)
- [ ] Event system (two-tier triggers)
- [ ] Workflows (deterministic where appropriate)
- [ ] Communication (structured protocols)
- [ ] Observability (comprehensive instrumentation)

### C. Implementation Checklist
- [ ] Infrastructure components operational
- [ ] Message routing functional
- [ ] State persistence working
- [ ] Tool execution reliable
- [ ] Tests passing (>80% coverage)
- [ ] Monitoring active
- [ ] Documentation complete

## XIII. KEY PHILOSOPHICAL INSIGHTS

### A. Foundational Concepts
1. **Agency requires persistent, evolving state** - not just sequential task execution
2. **Actors are nouns (entities), not verbs (decisions)**
3. **Agentic behavior requires agentic primitives** - workflows model execution, actors model cognition
4. **State boundaries matter more than decision boundaries**
5. **Expertise accumulation is the foundation of collective intelligence**

### B. Design Philosophy
1. **Organize by expertise domain, not by function**
2. **Each actor becomes increasingly valuable over time**
3. **Collective intelligence emerges from specialization**
4. **Location transparency enables scaling**
5. **Fault tolerance through supervision trees**

### C. Implementation Wisdom
1. **Start with domain understanding** - don't skip analysis
2. **Validate at each phase** - use checklists
3. **Test early and often** - integration catches issues
4. **Monitor from day one** - observability enables learning
5. **Iterate based on data** - let trajectories guide improvements
