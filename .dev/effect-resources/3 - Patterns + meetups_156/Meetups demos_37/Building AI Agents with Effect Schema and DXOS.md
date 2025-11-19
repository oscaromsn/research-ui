---
modified: 2025-11-03T02:11:32-03:00
---
# Building AI Agents with Effect Schema and DXOS
## By Dima - Effect Days 2024

### Executive Summary
This presentation demonstrates how DXOS leverages Effect Schema to build a comprehensive AI agent platform that transcends traditional chatbot limitations. By combining structured databases (Echo), extensible tool systems, and visual orchestration environments (Conductor), DXOS creates an ecosystem where AI agents can interact with real, structured data and perform complex workflows. The platform enables AI to create and manipulate persistent artifacts, discover and use tools dynamically, and execute autonomous background tasks - all powered by Effect Schema as the foundational type system.

---

## Part 1: The Evolution of AI Capabilities

### The Journey from ChatGPT 3.5 to Modern Agents

#### Generation 1: Basic Question-Answering (ChatGPT 3.5)
- **Capabilities**: Simple prompt-response interactions
- **Limitations**:
  - Generic, non-personalized responses
  - No knowledge of user context
  - Purely conversational, no persistence
  - Limited to training data knowledge cutoff

#### Generation 2: RAG (Retrieval-Augmented Generation)
- **Enhancement**: User document upload and indexing
- **Technical Implementation**:
  - Vector stores for document indexing
  - Semantic search for relevant context retrieval
  - PDF, document, and file processing
- **Result**: More personalized, context-aware responses

#### Generation 3: Tool-Enabled AI
- **Breakthrough**: AI gains ability to interact with external world
- **Common Tools**:
  - Web search for current information
  - Email sending capabilities
  - Calendar integration
  - API interactions
- **Impact**: Beginning of agentic workloads

#### Generation 4: Persistent Artifacts (Claude's Innovation)
- **Key Innovation**: Outputs that persist beyond conversation
- **Examples**:
  - Generated websites deployable to the web
  - Code that can be saved and reused
  - Documents that exist independently
- **Limitation**: Still primarily text/token-based

#### Generation 5: DXOS Vision - Structured Objects
- **Paradigm Shift**: From tokens to real documents
- **Characteristics**:
  - Schema-defined structured objects
  - Interactive, mutable artifacts
  - Tool-defined actions on objects
  - Database-persisted entities

### The Modern AI Development Stack

#### Cursor and the Developer Experience Revolution
- **Beyond GitHub Copilot**: Predicts entire edits, not just next lines
- **Mental Model**: Acts as a "second brain" for developers
- **Implication**: AI becoming integral to development workflow

---

## Part 2: The Three Pillars of AI Agents

### 1. Context: From Unstructured to Structured Data

#### Current State: Unstructured Context
- Chat logs and conversation history
- PDFs and document uploads
- Limited semantic understanding
- Ephemeral, conversation-bound

#### DXOS Approach: Structured Database Context
- **Echo Database** as persistent context storage
- **Effect Schema** for type-safe data definitions
- **Annotation System** for semantic metadata:

  ```typescript
  const Schema = S.struct({
    field: S.string.pipe(
      S.description("Human-readable description for AI")
    )
  })
  ```

```typescript
import { Schema } from 'effect';
import { ECHO } from '@dxos/client';
import { Contact } from './contact';

export const Task = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  created: Schema.String,
  assigned: ECHO.Ref(Contact),
}).pipe(
  ECHO.Object({
    typename: 'example.com/schema/Task',
    version: '0.1.0',
  })
);

export type Task = Schema.Type<typeof Task>;
```

- **Benefits**:
  - AI understands data structure and purpose
  - Persistent context across sessions
  - Type-safe interactions

### 2. Tools: From Ad-Hoc to Registry-Based

#### Current Limitations
- 10-20 tools maximum in typical systems
- Provider-specific implementations
- Manual tool selection and integration

#### DXOS Tool Architecture
- **Registry Approach**: Potentially thousands of available tools
- **Intelligent Selection**: AI dynamically discovers relevant tools
- **Effect Integration**:
  - Error handling and recovery
  - Retry logic and resilience
  - Traceability and observability
- **MCP (Model Context Protocol)**: Standardized tool calling framework

### 3. Orchestration: From Reactive to Autonomous

#### Current State: User-Driven Interactions
- Requires continuous prompting
- Stops when user stops interacting
- No background processing

#### DXOS Orchestration: DSL for Autonomous Workloads
- **Background Execution**: Continues without user presence
- **Mixed Computation**: Combines effectful functions with LLM calls
- **Visual Programming**: Conductor interface for workflow design
- **Trigger-Based**: Cron, queue, and event-driven execution

---

## Part 3: Technical Deep Dive - Echo Database

### Architecture and Design Principles

#### Local-First, Offline-Capable
- **Full Offline Functionality**: Complete database available without internet
- **Airplane Mode Ready**: All data persisted locally
- **Sync on Reconnect**: Automatic reconciliation when online

#### Eventually Consistent, CRDT-Based
- **Conflict Resolution**: Automatic merge using CRDTs
- **Auto-merge Implementation**: Sophisticated conflict handling
- **Multi-Device Sync**: Seamless updates across all devices

#### Federated Spaces
- **Space Concept**: Isolated work groups or contexts
  - Personal files and notes
  - Team documents
  - Project-specific data
- **Graph of Graphs**: Interconnected but separate contexts

### Echo API and Effect Schema Integration

#### Schema Definition with Echo Annotations

```typescript
import * as S from "@effect/schema/Schema"
import { EchoReactiveObject } from "@dxos/echo-schema"

const DataType = S.struct({
  field1: S.string,
  field2: S.number,
  reference: S.instanceOf(EchoReactiveObject) // Graph references
}).pipe(
  E.echoObject(
    "org.example.DataType",  // Unique type identifier
    "1.0.0"                   // Semantic versioning
  )
)
```

#### Key Features
1. **Type Registry**: Global registration for discovery
2. **Versioning Support**: Schema evolution and migration
3. **Graph Relationships**: Objects can reference each other
4. **Reactive Updates**: Signal-based change propagation

### React Integration and Developer Experience

#### CRUD Operations Made Simple

```typescript
// Query objects
const items = useQuery(space, DataType)

// Create new object
const item = space.db.add(DataType, { 
  field1: "value",
  field2: 42 
})

// Mutate directly - automatically persisted & synced
item.field1 = "new value"

// Delete
space.db.remove(item)
```

#### Revolutionary Developer Experience
1. **Plain Object Appearance**: Looks like JavaScript, acts like database
2. **Automatic Persistence**: Every change saved to disk
3. **Automatic Replication**: Changes sync to all peers
4. **Signal-Based Reactivity**: UI updates automatically
5. **Optimistic Mutations**: Instant UI feedback

---

## Part 4: Composer - The Super App Platform

### Architecture: Everything is a Plugin

#### Current Plugin Ecosystem
- **2000+ Plugins**: Extensive functionality library
- **Categories**:
  - Documents and markdown editors
  - Spreadsheets and tables
  - Chess games and interactive demos
  - Maps and geospatial tools
  - Kanban boards and project management
  - Calendar integrations
  - Code editors with syntax highlighting
  - Slide deck creators (MDX-based)

#### Plugin Contribution Model
Each plugin can contribute:
1. **UI Components**: Visual interfaces
2. **Tools for AI**: Callable functions with schemas
3. **Data Types**: New Echo schema definitions
4. **Workflows**: Orchestration components

### AI Integration Architecture

#### Chain of Thought Support
- **Transparent Reasoning**: Visible AI thought process
- **Planning Phase**: AI considers available tools
- **Execution Strategy**: Step-by-step action planning

#### Tool Discovery and Registration

```typescript
// Each tool has metadata for AI discovery
const toolMetadata = {
  description: "Human-readable tool purpose",
  inputSchema: S.struct({
    param1: S.string,
    param2: S.number
  })
}
```

#### Dynamic Tool Loading
- Tools discovered from Echo database
- AI queries available tools at runtime
- Automatic parameter inference from schemas

---

## Part 5: Live Demo Analysis

### Demo 1: Chess Game Interaction

#### Workflow Demonstrated
1. **Natural Language Request**: "Show me the Italian game"
2. **AI Processing**:
   - Understands chess opening reference
   - Calls chess plugin tool
   - Creates game artifact with FEN notation
3. **Artifact Creation**:
   - Persisted to Echo database
   - Returns artifact ID for reference
4. **Display Tool**: Renders interactive chessboard
5. **Live Interaction**:
   - User makes moves
   - AI responds with counter-moves
   - State persisted and synchronized

#### Key Technical Points
- **Not Static Content**: Live, interactive artifacts
- **Tool Chaining**: Multiple tools work together
- **State Persistence**: Game state in database

### Demo 2: Dynamic Function Creation

#### Live Function Deployment

```typescript
export const metadata = {
  description: "Convert currency using live rates",
  input: S.struct({
    from: S.string,
    to: S.string,
    amount: S.number
  })
}

export async function handler({ from, to, amount }) {
  // Fetch live exchange rates
  const rate = await fetchRate(from, to)
  return amount * rate
}
```

#### Integration Points
1. **Spreadsheet Integration**:
   - Function available as formula
   - Live reactivity on parameter changes
2. **AI Discovery**:
   - Function immediately available to AI
   - Schema enables parameter inference
3. **Edge Deployment**:
   - Cloudflare Workers platform
   - Serverless execution

### Demo 3: Calendar to Map Visualization

#### Complex Multi-Tool Workflow
1. **Calendar Query**: Fetch travel events
2. **Schema Creation**: AI creates new itinerary schema
3. **Table Generation**: Structured data display
4. **Coordinate Extraction**: Location to GPS conversion
5. **Map Visualization**: Geographic representation

#### Technical Challenges Demonstrated
- **Schema Generation**: AI creates new data types
- **Multi-Plugin Coordination**: Calendar → Table → Map
- **Error Handling**: Graceful degradation on format issues

---

## Part 6: Conductor - Visual Orchestration Platform

### Block-Based Programming Paradigm

#### Core Concepts
1. **Visual Nodes**: Draggable components on canvas
2. **Typed Connections**: Schema-validated data flow
3. **Effectful Functions**: Each block is an Effect
4. **Composable Workflows**: Build complex from simple

#### Node Types
- **Logic Gates**: AND, OR, NOT operations
- **Data Transformers**: Map, filter, reduce
- **API Connectors**: HTTP, Discord, databases
- **AI Nodes**: GPT, Claude, image generation
- **Control Flow**: Conditionals, loops, delays

### Workflow Compilation and Execution

#### Graph Analysis
1. **Topological Sorting**: Determine execution order
2. **Type Checking**: Validate connections via schemas
3. **Effect Composition**: Combine into single Effect
4. **Deployment**: Edge or local execution

#### Example: Discord CRM Pipeline

##### Workflow 1: Message Collection

```typescript
// Cron Trigger: Every 10 seconds
// → Discord API Query (using Effect library)
// → Filter new messages
// → Queue insertion
```

##### Workflow 2: Question Processing

```typescript
// Queue Trigger: On new items
// → Extract questions
// → Create Kanban cards
// → Assign to team members
```

### Execution Environments

#### Local Development
- **Ollama Integration**: Local LLM execution
- **3B Parameter Models**: Lightweight, fast iteration
- **Test Environment**: Safe experimentation

#### Production Deployment
- **Cloudflare Workers**: Edge compute platform
- **Durable Queues**: Reliable message passing
- **Scheduled Execution**: Cron-based triggers

---

## Part 7: System Architecture and Integration

### High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐
│                 │     │                  │
│    Composer     │────▶│  Cloud Services  │
│   (Plugins)     │     │  - Functions     │
│                 │     │  - AI Service    │
└─────────────────┘     └──────────────────┘
         │                        │
         └──────────┬─────────────┘
                    ▼
            ┌─────────────┐
            │    Echo     │
            │  (Database) │
            │             │
            │  ○ ○ ○ ○    │
            │  (Spaces)   │
            └─────────────┘
```

### Service Components

#### Function Service
- **Purpose**: Serverless compute for user functions
- **Technology**: Cloudflare Workers for Platforms
- **Features**:
  - Auto-scaling
  - Global distribution
  - Effect-based error handling

#### AI Service
- **LLM Orchestration**: Multiple model support
- **Tool Execution**: Managed tool calling
- **Chain of Thought**: Reasoning transparency

#### Echo as Connective Fabric
- **Unified Context**: Shared between all services
- **Event Propagation**: Real-time updates
- **Schema Registry**: Type discovery and validation

---

## Part 8: Technical Innovations and Patterns

### Effect Schema as Foundation

#### Why Effect Schema?
1. **Type Safety**: Compile-time guarantees
2. **Serialization**: Database and network transport
3. **Validation**: Runtime type checking
4. **Documentation**: Self-describing systems
5. **AI Integration**: Schema as AI instruction

#### Schema-Driven Development

```typescript
// Single source of truth
const Schema = S.struct({ /* ... */ })

// Derives everything else
type Type = S.Schema.Type<typeof Schema>
const validator = S.decode(Schema)
const jsonSchema = S.ast(Schema)
const aiDescription = extractDescription(Schema)
```

### Composability Patterns

#### Plugin Composability
- Independent development and deployment
- Runtime discovery and integration
- Schema-based contracts

#### Function Composability
- Small, focused functions
- Effect-based composition
- Visual and code-based assembly

#### Workflow Composability
- Modular workflow components
- Reusable patterns
- Trigger-based activation

### Innovation Highlights

#### 1. Live Artifacts
- Beyond static outputs
- Interactive, persistent objects
- Database-backed state

#### 2. Dynamic Tool Discovery
- Runtime tool registration
- AI-driven tool selection
- Schema-based parameter inference

#### 3. Visual Programming + Effect
- Type-safe visual composition
- Effectful function blocks
- Compile to executable Effects

#### 4. Federated Architecture
- Space-based isolation
- Cross-space references
- Privacy-preserving collaboration

---

## Part 9: Practical Implications and Use Cases

### Demonstrated Use Cases

#### 1. Interactive Demos (Chess)
- Educational applications
- Game development
- Interactive tutorials

#### 2. Business Tools (Forex Calculator)
- Financial calculations
- Real-time data integration
- Spreadsheet augmentation

#### 3. Workflow Automation (Discord CRM)
- Customer support systems
- Community management
- Task distribution

#### 4. Data Transformation (Calendar → Map)
- Travel planning
- Event visualization
- Multi-source integration

### Potential Applications

#### Enterprise Scenarios
- **Knowledge Management**: AI-augmented documentation
- **Process Automation**: Visual workflow design
- **Data Integration**: Multi-system orchestration
- **Collaborative Planning**: Real-time team coordination

#### Developer Tools
- **Code Generation**: AI-assisted development
- **API Integration**: Visual API composition
- **Testing Automation**: AI-driven test generation
- **Documentation**: Self-updating from schemas

#### Creative Applications
- **Content Creation**: Multi-modal generation
- **Interactive Storytelling**: Dynamic narratives
- **Educational Platforms**: Adaptive learning
- **Research Tools**: Data analysis pipelines

---

## Part 10: Key Takeaways and Future Vision

### Revolutionary Concepts Introduced

1. **Structured AI Context**
   - Move from chat logs to databases
   - Schema-aware AI interactions
   - Persistent, queryable history

2. **Extensible Tool Ecosystem**
   - Plugin-based architecture
   - Dynamic tool discovery
   - Effect-powered resilience

3. **Visual Orchestration**
   - Democratized workflow creation
   - Type-safe composition
   - Mixed AI/deterministic logic

4. **Living Artifacts**
   - Beyond text generation
   - Interactive, persistent objects
   - Cross-application sharing

### Technical Achievements

#### Effect Schema Integration
- **Foundational Role**: First technology adopted at DXOS
- **Pervasive Usage**: From database to AI to UI
- **Type Safety**: End-to-end guarantees
- **Extensibility**: Custom annotations and metadata

#### Platform Capabilities
- **Local-First**: Full offline functionality
- **Real-Time Sync**: CRDT-based collaboration
- **Plugin Architecture**: 2000+ components
- **Edge Computing**: Global deployment

### Building Blocks Philosophy

> "What we are creating are building blocks. Echo is the database, functions, orchestration for maybe thousands of different use cases."

The platform provides:
- **Primitives**: Basic components for composition
- **Patterns**: Reusable architectural solutions
- **Flexibility**: Adapt to diverse requirements
- **Extensibility**: Grow with user needs

### Future Directions

#### Near-Term Development
- **Schema Migration**: Robust evolution strategies
- **Tool Registry**: Expanded tool ecosystem
- **AI Capabilities**: Enhanced reasoning and planning
- **Performance**: Optimization for scale

#### Long-Term Vision
- **Autonomous Agents**: Self-directed task completion
- **Semantic Interoperability**: Cross-platform data exchange
- **Decentralized AI**: Federated learning and execution
- **User Sovereignty**: Complete data ownership

---

## Conclusion

DXOS demonstrates a comprehensive vision for the future of AI-augmented software development, where Effect Schema serves as the foundational type system enabling:

1. **Unified Data Model**: Single schema across database, API, and AI
2. **Intelligent Agents**: Context-aware, tool-equipped AI assistants
3. **Visual Programming**: Accessible workflow creation
4. **Local-First Architecture**: Privacy-preserving, offline-capable systems
5. **Extensible Platform**: Plugin-based, community-driven growth

The platform represents a significant advancement in making AI agents practical for real-world applications, moving beyond chatbots to create systems that can understand structured data, manipulate persistent objects, and execute complex workflows autonomously.

Through the innovative use of Effect Schema, DXOS has created a type-safe, composable, and extensible platform that bridges the gap between AI capabilities and practical application development, offering developers the building blocks to create the next generation of intelligent, collaborative applications.

---

### Resources and Community

- **Platform Access**: Composer Alpha 0.8 available
- **Community**: Discord server for support and discussion
- **Documentation**: Comprehensive guides and examples
- **Open Source**: Contribute to the ecosystem

The invitation stands: "If anything I said today sounds interesting, I invite you to try Composer."
