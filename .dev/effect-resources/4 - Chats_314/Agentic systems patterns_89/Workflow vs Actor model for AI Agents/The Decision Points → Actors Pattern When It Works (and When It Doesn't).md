---
modified: 2025-10-31T19:32:00-03:00
---
## **The "Decision Points → Actors" Pattern: When It Works (and When It Doesn't)**

### **The Appeal**

```typescript
// Your intuition mapped:
"Should I search case law or statutory law?" → RouterActor
"Found cases, now what?" → AnalysisActor  
"Need treaty interpretation?" → TreatyActor
```

This feels clean - each decision point becomes an autonomous entity that specializes in that choice.

### **The Problem: Too Fine-Grained**

This creates **actor proliferation** where you have dozens of micro-actors making trivial decisions:

```typescript
// ❌ Anti-pattern: Decision-point-driven design
class ShouldSearchCaseLawActor { /* just decides yes/no */ }
class ShouldSearchStatutesActor { /* just decides yes/no */ }
class ShouldConsultDoctorineActor { /* just decides yes/no */ }
// ... 50 more actors for every if/else in your logic
```

**Problems:**
- Overhead of actor infrastructure for trivial decisions
- Message-passing latency for simple choices
- Loss of cohesion - related decisions scattered across actors
- Debugging nightmare - trace through 20 actors for one research path

### **Better Heuristic: State Boundaries, Not Decision Boundaries**

**Actors should map to persistent, autonomous entities with their own lifecycle and context.**

For legal work, think:

> "What entities in my domain maintain state across multiple operations and make autonomous decisions using that accumulated context?"

Not:

> "What are all the if/else statements in my code?"

## **Practical Pattern 1: Matter-Centric Actors**

### **The Insight**
In legal practice, a **"matter" is the natural unit of stateful work**. Each client matter:
- Has its own research context
- Accumulates findings over time
- Learns which sources are relevant
- Involves multiple lawyers/tasks
- Spans days/weeks/months
- Requires audit trail

**Map each matter to a long-lived actor:**

```typescript
// ✅ Matter as Actor
class MatterActor extends Entity.make(
  "Matter",
  Schema.String, // matter ID
  RecipientType.EntityType,
  (matterId, msg: MatterMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<MatterState>()
    const state = yield* Ref.get(stateRef)
    
    // Matter state persists across all research tasks
    type MatterState = {
      clientId: string
      jurisdiction: Jurisdiction
      matterType: "litigation" | "transactional" | "advisory"
      
      // Accumulated research context
      researchHistory: ResearchTask[]
      relevantAuthorities: Authority[]
      keyFactPatterns: Pattern[]
      
      // Learned preferences
      preferredSources: SourcePreferences
      effectiveSearchStrategies: Strategy[]
      
      // Active work
      ongoingTasks: Map<TaskId, TaskContext>
      assignedLawyers: LawyerId[]
    }
    
    // Handle different types of work within the matter
    return yield* match(msg)
      .with({ _tag: "NewResearchTask" }, msg => 
        // Spawn research workflow, accumulate results
        handleNewResearch(state, msg)
      )
      .with({ _tag: "UpdateFinding" }, msg =>
        // Update matter context with new finding
        updateMatterKnowledge(state, msg)
      )
      .with({ _tag: "LawyerReview" }, msg =>
        // Incorporate lawyer feedback into matter learning
        incorporateFeedback(state, msg)
      )
      .exhaustive()
  })
)
```

**Why this works:**
- **Natural state boundaries:** Each matter is truly isolated
- **Meaningful learning:** Matter-specific patterns accumulate
- **Proper lifecycle:** Matters open and close like entities
- **Audit trail:** Matter state = complete history
- **Multi-task coordination:** One matter, many concurrent tasks

### **Implementation for Research Squad:**

```typescript
// Matter 12345: "Client X treaty interpretation"
const matter = yield* MatterActor.send("matter-12345", {
  _tag: "NewResearchTask",
  task: {
    question: "Does CISG Article 25 apply?",
    urgency: "high",
    requestedBy: "lawyer-456"
  }
})

// The Matter actor:
// 1. Checks its history: "We've researched CISG before"
// 2. Retrieves learned patterns: "UNCITRAL case law is most relevant"
// 3. Spawns research workflow with this context
// 4. Accumulates results in matter state
// 5. Learns: "This search strategy worked well for CISG"
```

## **Practical Pattern 2: Specialized Research Actors (Agent Specialists)**

### **The Insight**
Legal research has **stable specialization domains** that maintain their own expertise:

```typescript
// ✅ Domain-specialized actors
type LegalResearchActors = {
  CaseLawResearcher: Actor    // Specializes in case law
  StatutoryAnalyst: Actor      // Specializes in statutes/codes  
  TreatyInterpreter: Actor     // Specializes in international law
  DoctrinalScholar: Actor      // Specializes in academic sources
  JurisdictionExpert: Actor    // Specializes in procedural rules
}
```

Each specialist actor:
- **Maintains domain expertise** (which databases, search strategies, citation patterns)
- **Learns effectiveness** within its domain (success rates, quality signals)
- **Handles multiple concurrent requests** (many matters ask about case law)
- **Accumulates meta-knowledge** (e.g., "Brazilian courts cite doctrine more than US courts")

**Implementation:**

```typescript
class CaseLawResearcherActor extends Entity {
  state: {
    // Domain-specific expertise
    knownDatabases: Database[]
    searchStrategies: Map<Jurisdiction, Strategy[]>
    citationPatterns: CitationPattern[]
    
    // Performance learning
    successfulQueries: Query[]
    effectiveSources: Source[]
    qualitySignals: QualityMetrics
    
    // Active work
    ongoingSearches: Map<SearchId, SearchContext>
  }
  
  handleMessage(msg: CaseLawRequest) {
    return Effect.gen(function* () {
      // 1. Use accumulated expertise to plan search
      const strategy = this.selectStrategy(
        msg.jurisdiction,
        msg.legalIssue,
        this.state.successfulQueries // ← uses learned patterns
      )
      
      // 2. Execute search workflow (ephemeral)
      const results = yield* this.caseLawSearchWorkflow(strategy)
      
      // 3. Learn from results
      this.state.successfulQueries.push({
        query: msg,
        strategy,
        quality: results.quality
      })
      
      // 4. Return results to requesting matter
      return results
    })
  }
  
  private caseLawSearchWorkflow(strategy: Strategy) {
    // This is a workflow - stateless, retriable
    return pipe(
      searchDataJud(strategy.query),
      Effect.flatMap(filterRelevant),
      Effect.flatMap(extractCitations),
      Effect.retry(Schedule.exponential("1s")),
      Effect.timeout("60s")
    )
  }
}
```

**Why this works:**
- **Expertise accumulation:** Each actor gets better at its specialty
- **Resource efficiency:** One case law actor serves many matters
- **Natural parallelism:** Multiple specialists work concurrently
- **Composable:** Matters coordinate multiple specialists

### **Interaction Pattern:**

```typescript
// Matter actor coordinates specialists:
class MatterActor {
  handleNewResearch(task: ResearchTask) {
    return Effect.gen(function* () {
      const specialists = yield* ResearchSpecialists
      
      // Determine which specialists needed based on matter context
      const needed = this.determineSpecialists(task, this.state.matterType)
      
      // Coordinate specialists concurrently
      const [caseLaw, statutes, doctrine] = yield* Effect.all([
        needed.includes("CaseLaw") 
          ? specialists.caseLaw.research(task)
          : Effect.succeed(null),
        needed.includes("Statutes")
          ? specialists.statutory.research(task)
          : Effect.succeed(null),
        needed.includes("Doctrine")
          ? specialists.doctrinal.research(task)
          : Effect.succeed(null)
      ], { concurrency: "unbounded" })
      
      // Matter accumulates all specialist findings
      this.state.researchHistory.push({
        task,
        findings: { caseLaw, statutes, doctrine }
      })
    })
  }
}
```

## **Practical Pattern 3: Jurisdictional Actors**

### **The Legal Reality**
Law is fundamentally **jurisdictional**. Brazilian law, US federal law, German law - each has:
- Different sources of authority
- Different citation formats
- Different legal concepts
- Different research methodologies
- Different procedural rules

**Map jurisdictions to actors:**

```typescript
class BrazilianLawActor extends Entity {
  state: {
    // Brazil-specific knowledge
    authorityHierarchy: ["STF", "STJ", "TRF", "Courts of Appeal", ...]
    primarySources: ["Código Civil", "CLT", "CF/88", ...]
    doctrinalAuthorities: ["Flávio Tartuce", "Pablo Stolze", ...]
    
    // Citation patterns learned
    citationFormats: CitationFormat[]
    courtAbbreviations: Map<string, Court>
    
    // Search expertise
    effectiveDatabases: ["DataJud", "JusBrasil", "STF website"]
    searchOptimizations: BrazilianSearchHeuristics
  }
  
  handleMessage(msg: BrazilianLegalQuery) {
    // Actor knows how to research Brazilian law effectively
    return Effect.gen(function* () {
      // Use Brazil-specific strategies
      const strategy = this.brazilianSearchStrategy(msg)
      
      // Execute with Brazil-specific tools
      const results = yield* this.searchBrazilianSources(strategy)
      
      // Format with Brazilian citation conventions
      const formatted = this.applyBrazilianCitations(results)
      
      return formatted
    })
  }
}
```

**Why this works:**
- **Natural specialization:** Each jurisdiction truly is different
- **Expertise accumulation:** Actor learns jurisdiction-specific patterns
- **Correct abstractions:** Jurisdiction is a stable domain boundary
- **Extensibility:** Adding new jurisdiction = new actor

### **Cross-Jurisdictional Research:**

```typescript
class MatterActor {
  handleComparativeLawResearch(task: ComparativeResearchTask) {
    return Effect.gen(function* () {
      const jurisdictions = yield* JurisdictionalExperts
      
      // Research same issue across multiple jurisdictions
      const results = yield* Effect.all({
        brazil: jurisdictions.brazil.research(task.legalIssue),
        argentina: jurisdictions.argentina.research(task.legalIssue),
        uruguay: jurisdictions.uruguay.research(task.legalIssue)
      }, { concurrency: "unbounded" })
      
      // Matter coordinates comparative analysis
      const comparison = yield* this.compareJurisdictions(results)
      
      // Accumulate cross-jurisdictional insights
      this.state.comparativeInsights.push({
        issue: task.legalIssue,
        jurisdictions: results,
        analysis: comparison
      })
      
      return comparison
    })
  }
}
```

## **Practical Pattern 4: Citation Graph Actors**

### **The Legal Insight**
Legal reasoning is **fundamentally graph-based**. Cases cite cases, statutes reference other statutes, doctrine analyzes both. This graph is:
- **Persistent** (doesn't change with each query)
- **Queryable** (need to find precedent chains)
- **Evolving** (new cases added daily)
- **Contextual** (importance varies by matter)

**Citation graph as a specialized actor:**

```typescript
class CitationGraphActor extends Entity {
  state: {
    // The graph itself
    nodes: Map<CaseId, CaseNode>
    edges: Map<CaseId, Citation[]>
    
    // Graph indices
    precedentChains: Map<LegalIssue, CaseId[]>
    authorityScores: Map<CaseId, number>
    
    // Learning
    queryPatterns: Map<Query, RelevantSubgraph>
  }
  
  handleMessage(msg: CitationGraphQuery) {
    return Effect.gen(function* () {
      if (msg._tag === "FindPrecedentChain") {
        // Use graph algorithms on actor state
        const chain = this.findAuthoritativePath(
          msg.startCase,
          msg.legalIssue,
          msg.jurisdiction
        )
        
        // Learn what queries return useful subgraphs
        this.state.queryPatterns.set(msg.query, chain)
        
        return chain
      }
      
      if (msg._tag === "UpdateGraph") {
        // Incrementally update graph as new cases discovered
        this.state.nodes.set(msg.newCase.id, msg.newCase)
        this.state.edges.set(msg.newCase.id, msg.newCase.citations)
        
        // Recompute authority scores (can be incremental)
        yield* this.recomputeAuthorityScores(msg.newCase)
        
        return Effect.unit
      }
    })
  }
  
  private findAuthoritativePath(
    startCase: CaseId,
    issue: LegalIssue,
    jurisdiction: Jurisdiction
  ): Citation[] {
    // PageRank-like algorithm on the graph
    // Returns most authoritative precedent chain
  }
}
```

**Why this works:**
- **Natural state boundary:** The citation graph is a persistent, evolving entity
- **Complex queries:** Graph algorithms need full graph in memory
- **Learning:** Actor learns which subgraphs are important for which queries
- **Single source of truth:** One actor maintains canonical graph

### **Integration:**

```typescript
class CaseLawResearcherActor {
  handleMessage(msg: CaseLawRequest) {
    return Effect.gen(function* () {
      const citationGraph = yield* CitationGraphActor
      
      // 1. Search for initial cases
      const initialCases = yield* this.searchWorkflow(msg)
      
      // 2. Ask citation graph for precedent chains
      const precedentChains = yield* Effect.all(
        initialCases.map(case => 
          citationGraph.send(case.id, {
            _tag: "FindPrecedentChain",
            issue: msg.legalIssue,
            jurisdiction: msg.jurisdiction
          })
        )
      )
      
      // 3. Update graph with new discoveries
      yield* citationGraph.send({
        _tag: "UpdateGraph",
        newCases: initialCases
      })
      
      return { initialCases, precedentChains }
    })
  }
}
```

## **Practical Pattern 5: Lawyer-in-the-Loop Actors**

### **The Human Reality**
Legal AI cannot be fully autonomous. Lawyers must:
- Review findings
- Provide feedback
- Redirect research
- Make final judgments

**Model lawyer interaction as actor behavior:**

```typescript
class LawyerReviewActor extends Entity {
  state: {
    // Pending reviews
    pendingReviews: Map<ReviewId, ResearchForReview>
    
    // Lawyer preferences (learned over time)
    lawyerPreferences: Map<LawyerId, Preferences>
    feedbackHistory: Feedback[]
    
    // Quality signals
    acceptanceRates: Map<ResearchType, number>
    commonRejectionReasons: RejectionReason[]
  }
  
  handleMessage(msg: ReviewMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "SubmitForReview") {
        // Queue research for lawyer review
        this.state.pendingReviews.set(msg.reviewId, msg.research)
        
        // Notify lawyer (email, dashboard, etc.)
        yield* notifyLawyer(msg.assignedLawyer, msg.reviewId)
        
        return { status: "pending", reviewId: msg.reviewId }
      }
      
      if (msg._tag === "LawyerFeedback") {
        // Lawyer provides feedback
        const research = this.state.pendingReviews.get(msg.reviewId)
        
        // Learn from feedback
        this.state.feedbackHistory.push({
          research,
          feedback: msg.feedback,
          lawyer: msg.lawyerId
        })
        
        // Update researcher preferences
        if (msg.feedback.quality === "low") {
          this.state.commonRejectionReasons.push(msg.feedback.reason)
          
          // Signal to research actors to adjust
          yield* notifyResearchActors({
            _tag: "QualityFeedback",
            issue: research.issue,
            reason: msg.feedback.reason
          })
        }
        
        // If research needs more work, send back to matter
        if (msg.feedback.action === "revise") {
          yield* MatterActor.send(research.matterId, {
            _tag: "ReviseResearch",
            originalResearch: research,
            lawyerGuidance: msg.feedback.guidance
          })
        }
        
        return { status: "reviewed" }
      }
    })
  }
}
```

**Why this works:**
- **Async by nature:** Lawyer review takes hours/days - perfect for actors
- **Learning accumulation:** Feedback improves system over time
- **State management:** Tracks pending reviews across time
- **Multi-lawyer coordination:** Different lawyers, different preferences

## **Practical Pattern 6: Not Everything is an Actor**

### **Critical Distinction**

**Use actors for:**
- Matters (stateful, long-lived)
- Specialists (maintain expertise)
- Jurisdictions (stable domains)
- Citation graphs (complex, evolving state)
- Review queues (async, stateful)

**DON'T use actors for:**
- Simple data transformations
- Stateless API calls
- Pure computations
- Format conversions

```typescript
// ❌ Actor overkill:
class JSONParserActor extends Entity {
  handleMessage(msg: { json: string }) {
    return JSON.parse(msg.json) // This doesn't need state!
  }
}

// ✅ Plain service:
class ParsingService extends Effect.Service<ParsingService>() {
  parse: (json: string) => Effect<ParsedData, ParseError>
}

// ❌ Actor overkill:
class CitationFormatterActor extends Entity {
  handleMessage(msg: { case: Case }) {
    return formatCitation(msg.case) // Stateless transformation
  }
}

// ✅ Plain function:
const formatCitation = (case: Case): string => {
  // Pure function, no state
}
```

## **Architecture Synthesis: Legal Research Squad**

Bringing it all together:

```typescript
// ============ ACTOR LAYER (Stateful Entities) ============

// 1. Matter Actors - one per client matter
class MatterActor extends Entity {
  state: MatterState // Accumulated research context
  
  // Coordinates entire matter lifecycle
  handleMessage(msg: MatterMessage)
}

// 2. Specialist Actors - one per research domain
class CaseLawResearcherActor extends Entity {
  state: CaseLawExpertise // Domain-specific knowledge
}

class StatutoryAnalystActor extends Entity {
  state: StatutoryExpertise
}

class TreatyInterpreterActor extends Entity {
  state: TreatyExpertise
}

// 3. Jurisdictional Actors - one per jurisdiction
class BrazilianLawActor extends Entity {
  state: BrazilianLegalKnowledge
}

class ArgentineLawActor extends Entity {
  state: ArgentineLegalKnowledge
}

// 4. Infrastructure Actors - specialized services
class CitationGraphActor extends Entity {
  state: LegalCitationGraph
}

class LawyerReviewActor extends Entity {
  state: ReviewQueue
}

// ============ SERVICE LAYER (Stateless Tools) ============

class DataJudService extends Effect.Service<DataJudService>() {
  search: (query: Query) => Effect<Results, DataJudError>
  // Pure HTTP client, no state
}

class BNPService extends Effect.Service<BNPService>() {
  search: (terms: Terms) => Effect<Articles, BNPError>
}

class LLMService extends Effect.Service<LLMService>() {
  generate: (prompt: Prompt) => Effect<Response, LLMError>
}

// ============ WORKFLOW LAYER (Ephemeral Execution) ============

// These live INSIDE actors as private methods:
class CaseLawResearcherActor {
  private dataJudSearchWorkflow(query: Query) {
    return pipe(
      DataJudService.search(query),
      Effect.flatMap(Schema.decode(ResultSchema)),
      Effect.retry(Schedule.exponential("1s")),
      Effect.timeout("30s"),
      Effect.catchAll(handleSearchError)
    )
  }
}

// ============ COORDINATION PATTERN ============

// Typical flow:
// 1. Lawyer creates research task in Matter
MatterActor.send("matter-12345", {
  _tag: "NewResearchTask",
  task: { /* ... */ }
})

// 2. Matter determines needed specialists based on its accumulated context
class MatterActor {
  handleNewResearch(task) {
    // Uses matter state to decide strategy
    const specialists = this.selectSpecialists(task, this.state)
    
    // Coordinates specialists
    const results = yield* Effect.all({
      caseLaw: specialists.caseLaw.research(task),
      statutes: specialists.statutory.research(task)
    })
    
    // Accumulates in matter state
    this.state.researchHistory.push(results)
    
    // Submits for lawyer review
    yield* LawyerReviewActor.send({
      _tag: "SubmitForReview",
      matterId: this.matterId,
      research: results
    })
  }
}

// 3. Specialist executes using its expertise
class CaseLawResearcherActor {
  handleResearchRequest(request) {
    // Uses accumulated expertise
    const strategy = this.selectStrategy(
      request,
      this.state.successfulQueries
    )
    
    // Spawns workflow
    const results = yield* this.dataJudSearchWorkflow(strategy)
    
    // Learns from results
    this.updateExpertise(results)
    
    return results
  }
}
```

## **Practical Implications: What to Do Monday Morning**

### **1. Start with Matter Actors**

```typescript
// Week 1: Implement basic matter lifecycle
const MatterActor = Entity.make(
  "Matter",
  Schema.String,
  RecipientType.EntityType,
  (matterId, msg) => Effect.gen(function* () {
    const state = yield* Entity.state<{
      clientId: string
      researchTasks: Task[]
    }>()
    
    // Handle basic research coordination
  })
)
```

**Why start here:** Matters are the clear state boundary in legal work. Everything else can be services initially, then evolve to actors as needed.

### **2. Use Services for External Tools**

```typescript
// Don't make DataJud an actor yet
class DataJudService extends Effect.Service<DataJudService>() {
  effect: Effect.gen(function* () {
    return {
      search: (query) => httpClient.post("/search", query)
    }
  })
}
```

**Evolve to actor only when:** You need to maintain DataJud-specific state (like rate limiting, query optimization patterns, etc.)

### **3. Workflows for Reliability**

```typescript
// Inside matter actor, use workflows for tools
class MatterActor {
  private reliableDataJudSearch(query: Query) {
    return pipe(
      DataJudService.search(query),
      Effect.retry(Schedule.exponential("1s")),
      Effect.timeout("30s"),
      // Workflow = ephemeral, retriable, observable
    )
  }
}
```

### **4. Add Specialist Actors When Expertise Emerges**

```typescript
// Week 4: Extract case law expertise into actor
class CaseLawResearcherActor extends Entity {
  state: {
    successfulSearchPatterns: Pattern[]
    effectiveDatabases: Database[]
  }
  
  // This state persists and improves over time
}
```

**Trigger:** When you notice you're doing the same types of searches repeatedly and want to learn from past successes.

### **5. Metrics for Evolution**

Track when to evolve services → actors:

```typescript
// If you see this pattern:
const searches = [
  "CISG Article 25", // Uses DataJud + doctrine search
  "CISG Article 79", // Uses DataJud + doctrine search  
  "Vienna Convention Article 31", // Uses DataJud + doctrine search
]

// Time to create TreatyInterpreterActor that learns:
// "For treaty questions, always search DataJud + doctrine in parallel"
```

## **Advanced: Cross-Cutting Concerns**

### **Provenance Tracking**

Every legal research result needs **complete provenance**:

```typescript
class ProvenanceActor extends Entity {
  state: {
    // Every finding → its complete source chain
    provenanceGraph: Map<FindingId, ProvenanceChain>
  }
  
  handleMessage(msg: RecordProvenance) {
    // Record: "This conclusion came from Case X, 
    // which we found via DataJud search Y,
    // executed by CaseLawResearcher actor,
    // as part of Matter Z's research task"
    
    this.state.provenanceGraph.set(msg.findingId, {
      sources: msg.sources,
      searchPath: msg.searchPath,
      timestamp: now(),
      actors: msg.actorsInvolved
    })
  }
}
```

### **Quality Scoring**

Learn which research strategies produce high-quality results:

```typescript
class QualityLearningActor extends Entity {
  state: {
    strategyScores: Map<Strategy, QualityScore>
  }
  
  handleMessage(msg: LawyerFeedback) {
    // When lawyer accepts/rejects research:
    const strategy = msg.research.strategy
    const score = msg.feedback.quality
    
    // Update scores
    this.updateStrategyScore(strategy, score)
    
    // Propagate to specialist actors
    yield* notifySpecialists({
      _tag: "UpdateStrategyScore",
      strategy,
      score
    })
  }
}
```

## **Your Core Question Refined**

> "Map decision points with clear outcomes and turn it into actors"

**Better heuristic:**

> **"Map persistent domains of expertise or stateful contexts with their own lifecycle into actors. Let actors make decisions using their accumulated state, not standalone decision-point actors."**

**Examples:**
- ✅ "Matter" is an actor - it has state, lifecycle, makes decisions
- ✅ "CaseLaw Specialist" is an actor - it accumulates expertise, makes research decisions
- ❌ "Should I search case law?" is not an actor - it's a decision point INSIDE an actor
- ❌ "Parse JSON" is not an actor - it's a stateless function

The key insight: **Actors are nouns (entities), not verbs (decisions).**

Does this clarify the practical application for your legal agents?
