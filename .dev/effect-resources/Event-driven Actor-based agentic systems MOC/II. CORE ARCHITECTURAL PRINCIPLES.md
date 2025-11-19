---
modified: 2025-11-04T07:10:46-03:00
---
# II. CORE ARCHITECTURAL PRINCIPLES

## A. Actor Design Principles

### 1. Actor = Persistent Domain of Expertise

#### 1.1 Defining Characteristics

The foundational principle for actor design is that **each actor maps to a persistent domain of expertise with meaningful lifecycle and accumulated knowledge**, not to decision points or orchestration functions.

**Core Concept:**

> "Actors are nouns (entities), not verbs (decisions)."

An actor represents a **persistent expert** that:
- **Develops specialized knowledge over time**: Accumulates domain-specific patterns and intuition
- **Accumulates domain-specific intuition**: Builds "feel" for what works in its specialty
- **Learns from successes and failures**: Each outcome improves future decisions
- **Makes decisions informed by experience**: References past similar situations
- **Builds irreplaceable expertise**: Becomes more valuable with time

**The Actor Entity Test:**

Before creating an actor, validate it represents a genuine expertise domain:

```
✓ Does this have a meaningful lifecycle?
✓ Does experience improve outcomes over time?
✓ Is there accumulated state that matters?
✓ Can this learn and improve?
✓ Is this irreplaceable expertise?
✓ Is the context window bounded (< 25K tokens)?
```

If most answers are "no," it's probably a function or workflow, not an actor.

#### 1.2 Good Actor Examples by Domain

**Healthcare:**

| Actor | Expertise Domain | Why It's a Good Actor |
|-------|------------------|----------------------|
| **Diagnostic Specialist (Cardiology)** | Heart disease diagnosis and monitoring | Learns patient patterns, recognizes disease progression, develops diagnostic intuition |
| **Medication Management Specialist** | Drug therapy optimization | Learns drug interactions, patient responses, optimal dosing strategies |
| **Patient Care Coordinator** | Overall treatment strategy | Maintains patient relationship, coordinates specialists, learns patient preferences |

**Legal:**

| Actor | Expertise Domain | Why It's a Good Actor |
|-------|------------------|----------------------|
| **Case Strategist** | Litigation strategy development | Develops case theories, learns judge preferences, accumulates trial experience |
| **Case Law Researcher** | Jurisprudence analysis | Learns citation patterns, recognizes precedent chains, builds research strategies |
| **Matter Coordinator** | Client matter management | Maintains matter context, coordinates research, learns source effectiveness |

**Finance:**

| Actor | Expertise Domain | Why It's a Good Actor |
|-------|------------------|----------------------|
| **Portfolio Manager** | Investment strategy | Accumulates investment thesis, learns market patterns, develops risk intuition |
| **Risk Assessor** | Risk evaluation | Learns risk indicators, recognizes failure patterns, calibrates risk models |

**Manufacturing:**

| Actor | Expertise Domain | Why It's a Good Actor |
|-------|------------------|----------------------|
| **Quality Engineer** | Defect pattern recognition | Learns failure modes, recognizes quality drift, develops inspection strategies |
| **Production Line Monitor** | Process optimization | Learns efficiency patterns, recognizes anomalies, develops adjustment strategies |

**Customer Service:**

| Actor | Expertise Domain | Why It's a Good Actor |
|-------|------------------|----------------------|
| **Account Manager** | Customer relationship | Knows customer history, learns preferences, builds relationship strategy |
| **Escalation Coordinator** | Complex issue resolution | Learns resolution patterns, recognizes escalation signals, develops intervention strategies |

#### 1.3 Anti-Pattern: Decision-Point Function

**The Wrong Approach:**

```typescript
// ❌ BAD: Actor as decision router
class ShouldSearchCaseLawActor {
  handleMessage(msg: Query) {
    // Just approves/rejects - no state accumulation
    if (msg.queryType === "case_law") {
      return { decision: "approve" }
    } else {
      return { decision: "reject" }
    }
    // No expertise development
    // No learning from experience
    // Could be replaced by: if (queryType === "case_law") { ... }
  }
}
```

**Problems:**
- **No state accumulation**: Each decision is isolated
- **No expertise development**: Doesn't get better over time
- **Replaceable by simple rules**: Could be a function
- **No meaningful lifecycle**: Nothing persists between calls
- **Just a routing function**: No domain knowledge

**The Right Approach:**

```typescript
// ✅ GOOD: Actor as domain expert
class CaseLawResearcherActor extends Entity {
  state: {
    // Accumulated expertise
    successfulSearchStrategies: Strategy[]
    effectiveDatabases: Database[]
    citationPatterns: Pattern[]
    
    // Learning
    queryOutcomes: Map<Query, Outcome>
    qualitySignals: QualityMetrics
    
    // Current work
    activeResearch: Map<TaskId, ResearchContext>
  }
  
  handleMessage(msg: ResearchRequest) {
    return Effect.gen(function* () {
      // Uses accumulated expertise to make informed decision
      const strategy = this.selectOptimalStrategy(
        msg.query,
        this.state.successfulSearchStrategies,  // ← learned over time
        this.state.effectiveDatabases           // ← learned over time
      )
      
      // Executes research
      const results = yield* this.executeResearch(strategy)
      
      // Learns from outcome
      this.state.queryOutcomes.set(msg.query, {
        strategy,
        results,
        quality: results.quality
      })
      
      // Updates expertise
      if (results.quality > 0.8) {
        this.state.successfulSearchStrategies.push(strategy)
      }
      
      return results
    })
  }
  
  private selectOptimalStrategy(
    query: Query,
    successfulStrategies: Strategy[],
    effectiveDatabases: Database[]
  ): Strategy {
    // Uses learned patterns to choose best approach
    // This is expertise, not just routing
  }
}
```

**Why This Works:**
- **Accumulates state**: Builds knowledge base over time
- **Develops expertise**: Gets better at selecting strategies
- **Learns from outcomes**: Success/failure improves future decisions
- **Irreplaceable**: The accumulated expertise is unique and valuable
- **Meaningful lifecycle**: Persists across many research tasks

#### 1.4 Decision Points vs. Expertise Domains

**The Critical Distinction:**

| Concept | Description | Actor? |
|---------|-------------|--------|
| **Decision Point** | A single if/else or choice in logic | ❌ No |
| **Expertise Domain** | A persistent area of specialized knowledge | ✅ Yes |

**Examples:**

```
❌ "Should I search case law?" 
   → Decision point INSIDE a research expert actor

✅ "Case Law Research Specialist"
   → Expertise domain that makes many decisions about case law

❌ "Parse JSON"
   → Stateless transformation function

✅ "Document Parser with Format Learning"
   → If it learns which parsing strategies work for which documents

❌ "Route message to appropriate handler"
   → Simple routing logic

✅ "Intelligent Router with Load Balancing Strategy"
   → If it learns optimal routing based on handler performance
```

**Actor Proliferation Anti-Pattern:**

```typescript
// ❌ WRONG: Too fine-grained
class ShouldSearchCaseLawActor { /* decides yes/no */ }
class ShouldSearchStatutesActor { /* decides yes/no */ }
class ShouldConsultDoctrineActor { /* decides yes/no */ }
// ... 50 more actors for every if/else

// Problems:
// - Actor infrastructure overhead for trivial decisions
// - Message-passing latency for simple choices
// - Loss of cohesion - related decisions scattered
// - Debugging nightmare - trace through 20 actors
```

**Better Approach:**

```typescript
// ✅ RIGHT: Cohesive expertise domain
class LegalResearchStrategistActor {
  state: {
    domainKnowledge: ResearchDomains
    successfulApproaches: Map<IssueType, Approach[]>
    learnedPatterns: Pattern[]
  }
  
  handleMessage(msg: ResearchRequest) {
    return Effect.gen(function* () {
      // Makes ALL related decisions using domain expertise
      const strategy = this.developResearchStrategy(msg, this.state)
      
      // Strategy includes:
      // - Should search case law? (decision made with context)
      // - Which case law sources? (decision made with expertise)
      // - Should search statutes? (decision made with experience)
      // - Which statutory sources? (decision made with learning)
      // - Should consult doctrine? (decision made with knowledge)
      
      return strategy
    })
  }
  
  private developResearchStrategy(
    request: ResearchRequest,
    expertise: DomainKnowledge
  ): Strategy {
    // This actor makes multiple related decisions
    // using accumulated expertise, not scattered across actors
  }
}
```

#### 1.5 Mapping Heuristic

**The Right Question:**

> "What persistent entities in my domain maintain state across multiple operations and make autonomous decisions using accumulated context?"

**Not:**

> "What are all the if/else statements in my code?"

**Practical Application:**

For a legal research system:

```
✓ "Matter" is an actor
  - Has its own research context
  - Accumulates findings over time
  - Learns which sources are relevant
  - Involves multiple tasks
  - Spans days/weeks/months

✓ "Case Law Specialist" is an actor
  - Accumulates case law search expertise
  - Learns citation patterns
  - Develops database strategies
  - Improves over many searches

✓ "Jurisdictional Expert (Brazil)" is an actor
  - Maintains Brazil-specific knowledge
  - Learns Brazilian legal patterns
  - Accumulates citation conventions
  - Develops source preferences

✓ "Citation Graph" is an actor
  - Maintains persistent graph state
  - Learns important precedent chains
  - Accumulates authority scores
  - Evolves with new cases

❌ "Should search DataJud?" is NOT an actor
  - Single decision point
  - No persistent state
  - No learning opportunity
  - Better as decision inside Case Law Specialist

❌ "Parse JSON response" is NOT an actor
  - Stateless transformation
  - No expertise to accumulate
  - Better as utility function

❌ "Format citation" is NOT an actor
  - Deterministic formatting
  - No learning needed
  - Better as pure function
```

#### 1.6 Validation Checklist

Before creating an actor, validate:

```
Actor Design Validation Checklist:

□ Persistent Identity
  - Does this entity exist over time?
  - Does it maintain continuity across interactions?
  
□ Accumulated State
  - Is there meaningful state that grows?
  - Does history matter for decisions?
  
□ Learning Opportunity
  - Can this get better with experience?
  - Are there outcomes to learn from?
  
□ Expertise Development
  - Is there specialized knowledge to accumulate?
  - Does this develop intuition over time?
  
□ Irreplaceable Value
  - Would losing this actor's state be costly?
  - Is the accumulated expertise unique?
  
□ Bounded Context
  - Is the context window manageable (< 25K tokens)?
  - Can state be reasonably summarized?
  
□ Autonomous Decisions
  - Does this make independent choices?
  - Does it coordinate with others as a peer?
```

If you can't check most of these, reconsider whether it should be an actor.

---

### 2. Three-Layer Separation

#### 2.1 Architectural Overview

The three-layer architecture **clearly separates concerns** to optimize context windows and enable learning.

```
┌─────────────────────────────────────────┐
│      MODEL WEIGHTS (Learned)            │
│  • Statistical patterns                 │
│  • Optimal parameters                   │
│  • Policy functions                     │
│  • Pattern recognition neural nets      │
│                                         │
│  Updated through: RL training           │
│  Lives in: Trained model files          │
└─────────────────────────────────────────┘
                ↓ (guides reasoning)
┌─────────────────────────────────────────┐
│     ACTOR STATE (Current Context)       │
│  • Current values & status              │
│  • Recent events (short memory)         │
│  • Active monitoring items              │
│  • Immediate beliefs & assessments      │
│                                         │
│  Size: Lightweight (2-25K tokens)       │
│  Lives in: Ref/SubscriptionRef          │
└─────────────────────────────────────────┘
                ↓ (calls when needed)
┌─────────────────────────────────────────┐
│       TOOLS (On-Demand Analysis)        │
│  • Historical data queries              │
│  • Complex calculations                 │
│  • Deep analysis & simulations          │
│  • External data retrieval              │
│                                         │
│  Returns: Insights, not raw data        │
│  Lives in: Effect Services              │
└─────────────────────────────────────────┘
```

**Why Separation Matters:**

- **Context window efficiency**: State stays lightweight by offloading to tools/models
- **Learning separation**: Models improve without bloating state
- **Clear boundaries**: Each layer has distinct purpose and lifecycle
- **Scalability**: Can optimize each layer independently

---

### 2.2 Actor State (Lightweight, Current Context)

#### 2.2.1 What Belongs in State

Actor state represents **what IS right now** - current ground truth and immediate context.

**Four Categories:**

1. **Current Ground Truth** (What IS right now)

```python
{
    "current_status": "operational",
    "active_condition": "Type 2 Diabetes",
    "immediate_metrics": {
        "blood_pressure": "130/85",
        "heart_rate": 72
    }
}
```

2. **Short-Term Memory** (Recent context for continuity)

```python
{
    "recent_events": [
        {"date": "2025-11-01", "event": "Lab results improved"},
        {"date": "2025-10-28", "event": "Medication adjusted"},
        {"date": "2025-10-20", "event": "Patient reported side effects"}
    ]  # Keep last 3-5 only
}
```

3. **Active Monitoring** (What watching RIGHT NOW)

```python
{
    "watching": {
        "glucose_trend": "Monitoring for continued improvement",
        "medication_adherence": "Track next 2 weeks"
    },
    "alerts_active": [
        {
            "alert_id": "glucose_spike",
            "condition": "glucose > 180",
            "watching_since": "2025-10-15"
        }
    ]
}
```

4. **Current Beliefs** (What think NOW)

```python
{
    "working_hypothesis": {
        "primary_diagnosis": "Type 2 Diabetes",
        "confidence": 0.85,
        "supporting_evidence": ["A1C 7.2%", "Fasting glucose 145"]
    },
    "immediate_assessment": "Stable, responding to treatment"
}
```

**State Characteristics:**

- **Present tense**: "is", "currently", "now"
- **Current values only**: Latest measurements, not history
- **Recent history**: Last 3-5 items for continuity
- **Active focus**: What monitoring or working on currently
- **Bounded size**: 2K-25K tokens depending on actor complexity

#### 2.2.2 Domain-Specific State Examples

**Healthcare - Patient Care Coordinator:**

```python
{
    "patient": {
        "id": "P12345",
        "age": 67,
        "current_condition": "stable"
    },
    
    "active_diagnoses": [
        "Type 2 Diabetes",
        "Hypertension"
    ],
    
    "current_vitals": {
        "blood_pressure": "130/85",
        "glucose": 145,
        "last_measured": "2025-11-04T08:30:00Z"
    },
    
    "recent_events": [
        {
            "date": "2025-10-28",
            "event": "Lab results show A1C improvement",
            "significance": "Treatment effective"
        },
        {
            "date": "2025-10-20",
            "event": "Medication adjusted",
            "change": "Increased Metformin to 1000mg BID"
        }
    ],
    
    "watching": {
        "glucose_trend": {
            "expecting": "Continued improvement",
            "monitoring_frequency": "weekly",
            "trigger_if": "3 consecutive readings > 160"
        },
        "next_appointment": "2025-11-15"
    },
    
    "current_treatment_plan": {
        "medications": ["Metformin 1000mg BID", "Lisinopril 10mg daily"],
        "confidence_in_plan": 0.80,
        "next_review": "2025-11-15"
    }
}
```

**Legal - Matter Coordinator:**

```python
{
    "matter_id": "M-2025-1234",
    "client_id": "CLIENT-456",
    "matter_type": "litigation",
    "jurisdiction": "Brazil-Federal",
    "status": "discovery",
    
    "active_legal_issues": [
        {
            "issue": "CISG Article 25 applicability",
            "status": "researching",
            "priority": "high"
        }
    ],
    
    "recent_research": [
        {
            "date": "2025-11-03",
            "topic": "CISG fundamental breach",
            "findings": "STJ precedent found",
            "confidence": 0.75
        },
        {
            "date": "2025-11-01",
            "topic": "Treaty interpretation",
            "findings": "Vienna Convention applies",
            "confidence": 0.90
        }
    ],
    
    "watching": {
        "opposing_counsel_deadline": {
            "deadline": "2025-11-10",
            "status": "monitoring",
            "trigger_if": "3 days before deadline"
        }
    },
    
    "current_strategy": {
        "theory": "Fundamental breach under CISG",
        "confidence": 0.70,
        "next_steps": ["File motion", "Expert consultation"]
    },
    
    "assigned_team": ["lawyer-789", "paralegal-012"]
}
```

**Manufacturing - Production Line Monitor:**

```python
{
    "line_id": "LINE-03",
    "status": "operational",
    
    "current_throughput": 245,  # units/hour
    "target_throughput": 250,
    
    "quality_metrics": {
        "defect_rate": 0.02,
        "yield": 0.98,
        "last_quality_check": "2025-11-04T14:30:00Z"
    },
    
    "recent_anomalies": [
        {
            "time": "14:23",
            "type": "temperature_spike",
            "machine": "machine_3",
            "resolved": True,
            "resolution": "Cooling system reset"
        }
    ],
    
    "watching": {
        "machine_3": {
            "concern": "Vibration levels elevated",
            "watching_since": "14:15",
            "threshold": "amplitude > 50mm/s",
            "action_if_triggered": "Stop line, inspect bearings"
        },
        "ambient_temp": {
            "current": 28.5,
            "normal_range": [20, 26],
            "status": "above_normal"
        }
    },
    
    "maintenance_schedule": {
        "next_scheduled": "2025-11-05T20:00:00Z",
        "type": "preventive"
    }
}
```

**Customer Service - Account Manager:**

```python
{
    "customer_id": "CUST-7890",
    "account_status": "active",
    "relationship_years": 5,
    "lifetime_value": 45000,
    
    "current_engagement": {
        "last_interaction": "2025-11-02",
        "engagement_level": "high",
        "satisfaction_score": 8.5
    },
    
    "recent_interactions": [
        {
            "date": "2025-11-02",
            "type": "support_request",
            "issue": "Billing question",
            "resolution": "Resolved same day",
            "satisfaction": 9
        },
        {
            "date": "2025-10-25",
            "type": "product_inquiry",
            "outcome": "Upsell opportunity identified"
        }
    ],
    
    "watching": {
        "renewal_date": {
            "date": "2025-12-15",
            "days_remaining": 41,
            "trigger_at": "60 days before",
            "action": "Begin renewal conversation"
        },
        "usage_pattern": {
            "trend": "increasing",
            "potential": "expansion_opportunity"
        }
    },
    
    "current_opportunities": [
        {
            "type": "upsell",
            "product": "Premium tier",
            "confidence": 0.65,
            "timing": "Next quarterly review"
        }
    ]
}
```

#### 2.2.3 What Does NOT Belong in State

**Red Flags - Move to Model Weights:**

```python
# ❌ BAD: Statistics in state
{
    "win_rate": 0.67,                    # → Should be in MODEL
    "average_outcome": 8.5,              # → Should be in MODEL
    "success_patterns": {...},           # → Should be in MODEL
    "optimal_threshold": 0.75            # → Should be learned parameter
}
```

**Red Flags - Move to Tools:**

```python
# ❌ BAD: Historical data in state
{
    "all_past_observations": [...],      # → Use tool to query
    "complete_interaction_history": [...], # → Query via tool when needed
    "all_previous_decisions": [...],     # → Tool: find_similar_decisions()
    "full_research_archive": [...]       # → Tool: search_research_history()
}
```

**Red Flags - Unbounded Growth:**

```python
# ❌ BAD: Unlimited lists
{
    "events": [...]  # No limit - will grow forever
    "messages": [...] # No limit - context explosion
}

# ✅ GOOD: Bounded with summarization
{
    "recent_events": [last_5_events],
    "event_count_total": 1247,
    "event_summary": "Mostly routine, 3 anomalies this month"
}
```

#### 2.2.4 State Validation

**For each state field, verify:**

```
✓ Represents current value (not historical aggregate)
✓ Actually used in decision-making (not just logged)
✓ Cannot be computed on-demand (not derivable)
✓ Size bounded and reasonable (won't grow unbounded)
✓ Updated regularly (not stale data)
```

**Size Estimation:**

```python
# Calculate token count for actor state
state_tokens = {
    "current_context": 500,        # Current status/values
    "recent_memory": 1000,         # Last 5 events @ 200 tokens each
    "active_monitoring": 500,      # Current alerts/watching
    "current_beliefs": 1000,       # Working hypotheses
    "total": 3000                  # Well within budget
}

# Target limits:
# - Simple monitoring actors: < 5K tokens
# - Specialized analysts: < 15K tokens
# - Strategic coordinators: < 25K tokens
```

---

### 2.3 Model Weights (Learned Patterns)

#### 2.3.1 What Belongs in Model Weights

Model weights capture **statistical patterns learned through experience**, not stored in state.

**Four Categories:**

1. **Statistical Patterns** ("What usually happens")

```python
# Learned through observation
model.patterns = {
    "symptom_combinations": {
        ("chest_pain", "shortness_of_breath", "sweating"): {
            "likely_diagnoses": [
                ("MI", 0.45),
                ("Unstable Angina", 0.30),
                ("Panic Attack", 0.15)
            ]
        }
    },
    "success_rates": {
        "treatment_A_for_condition_X": 0.72,
        "treatment_B_for_condition_X": 0.65
    }
}
```

2. **Optimal Parameters** ("What values work best")

```python
# Learned through optimization
model.parameters = {
    "risk_thresholds": {
        "high_risk": 0.75,      # Learned optimal cutoff
        "medium_risk": 0.45,    # Not arbitrary
        "low_risk": 0.20
    },
    "timing_factors": {
        "optimal_intervention_delay": "24_hours",  # Learned from outcomes
        "escalation_threshold": "3_failed_attempts"
    }
}
```

3. **Policy Functions** ("What to do when")

```python
# Learned decision policy
model.policy = PolicyNetwork(
    state_features,
    action_space
)

# Given state, recommends action with confidence
action, confidence = model.policy.predict(current_state)
```

4. **Pattern Recognition** ("What does this mean")

```python
# Trained neural network
model.pattern_recognizer = NeuralNetwork(
    input_features,
    output_classes
)

# Recognizes complex patterns
pattern = model.pattern_recognizer.classify(observations)
```

#### 2.3.2 Domain-Specific Model Examples

**Healthcare - Diagnostic Specialist:**

```python
diagnostic_model = {
    # Pattern recognition (neural network)
    "symptom_pattern_classifier": {
        "architecture": "transformer",
        "trained_on": "10K+ patient cases",
        "recognizes": "Disease signature patterns"
    },
    
    # Success prediction (regression)
    "treatment_success_predictor": {
        "input": ["patient_profile", "treatment_type", "severity"],
        "output": "success_probability",
        "learned_from": "Treatment outcome data"
    },
    
    # Optimal parameters (learned thresholds)
    "optimal_dosing_policy": {
        "drug_X": {
            "starting_dose": "learned_from_outcomes",
            "titration_schedule": "optimized_through_rl",
            "max_dose": "safety_constrained"
        }
    },
    
    # Risk stratification (classification)
    "patient_risk_stratification": {
        "low_risk": "score < 0.25",       # Learned cutoffs
        "medium_risk": "0.25 <= score < 0.65",
        "high_risk": "score >= 0.65"
    }
}

# How it's used:
# 1. State provides current patient context
# 2. Model recognizes patterns in that context
# 3. Model recommends action based on learned policy
# 4. Actor makes final decision combining model + state + judgment
```

**Legal - Case Strategist:**

```python
litigation_model = {
    # Case theory success rates (learned statistics)
    "case_theory_success_rates": {
        ("breach_of_contract", "Judge_Smith"): 0.68,
        ("fundamental_breach_CISG", "Judge_Silva"): 0.72,
        "theory_combinations": learned_probabilities
    },
    
    # Settlement timing optimizer (RL policy)
    "settlement_timing_optimizer": {
        "optimal_timing": learned_policy_network,
        "factors": ["case_strength", "discovery_progress", "judge_tendencies"],
        "learned_from": "Historical settlement data"
    },
    
    # Judge persuasion patterns (neural network)
    "judge_persuasion_patterns": {
        "judge_profiles": learned_embeddings,
        "effective_arguments": pattern_classifier,
        "citation_preferences": learned_weights
    },
    
    # Motion success predictor (classifier)
    "motion_success_predictor": {
        "inputs": ["motion_type", "judge", "case_context"],
        "output": "success_probability",
        "learned_from": "Motion outcome history"
    }
}
```

**Manufacturing - Quality Engineer:**

```python
quality_model = {
    # Defect pattern detector (neural network)
    "defect_pattern_detector": {
        "recognizes": "Early warning signs of defects",
        "inputs": ["sensor_readings", "process_parameters"],
        "learned_from": "Historical defect data"
    },
    
    # Optimal maintenance policy (RL)
    "optimal_maintenance_policy": {
        "timing": learned_policy,
        "type": "predictive",
        "minimizes": "downtime + maintenance_cost",
        "learned_from": "Maintenance outcome history"
    },
    
    # Quality parameter optimizer (optimization)
    "quality_parameter_optimizer": {
        "target": "maximize_yield_minimize_defects",
        "parameters": ["temperature", "pressure", "speed"],
        "learned_optimal_ranges": {...}
    },
    
    # Failure predictor (time series model)
    "failure_predictor": {
        "predicts": "Time to failure",
        "based_on": "Degradation patterns",
        "trained_on": "Equipment failure history"
    }
}
```

**Customer Service - Account Manager:**

```python
relationship_model = {
    # Churn prediction (classifier)
    "churn_risk_predictor": {
        "inputs": ["engagement_metrics", "satisfaction_trends", "usage_patterns"],
        "output": "churn_probability",
        "learned_from": "Customer retention data"
    },
    
    # Upsell opportunity detector (pattern recognition)
    "upsell_opportunity_detector": {
        "recognizes": "Buying signals",
        "timing_optimizer": "When to approach",
        "learned_from": "Historical upsell success"
    },
    
    # Resolution strategy selector (RL policy)
    "resolution_strategy_selector": {
        "given": "Issue type + customer profile",
        "recommends": "Optimal resolution approach",
        "learned_from": "Resolution outcome history"
    },
    
    # Satisfaction predictor (regression)
    "satisfaction_predictor": {
        "predicts": "Post-interaction satisfaction",
        "based_on": "Interaction characteristics",
        "guides": "Communication strategy"
    }
}
```

#### 2.3.3 Why Separate from State

**Critical Reasons:**

1. **Models improve through RL without bloating context**

```python
# State stays fixed size
state = {
    "current_patient_vitals": {...},  # Always ~500 tokens
    "recent_events": [last_5]         # Always ~1000 tokens
}

# Model gets better over time
model = train_on_new_data(model, trajectories)
# Model size doesn't affect actor's context window
```

2. **Same model can guide many actor instances**

```python
# One trained model
diagnostic_model = load_trained_model("cardiology_v3.2")

# Used by many patient-specific actors
patient_123_actor.model = diagnostic_model
patient_456_actor.model = diagnostic_model
patient_789_actor.model = diagnostic_model

# Each actor has different state, same model
```

3. **Clear separation of "what is" vs "what works"**

```python
# State = "what is"
state = {
    "patient_glucose": 165,           # Current value
    "last_medication_change": "Oct 20" # Recent event
}

# Model = "what works"
model = {
    "optimal_glucose_target": 120,    # Learned goal
    "medication_adjustment_policy": policy_net  # Learned strategy
}
```

4. **Enables A/B testing of model versions**

```python
# Test new model version
if in_experiment_group(actor_id):
    actor.model = new_model_v4
else:
    actor.model = current_model_v3

# State remains identical, only model differs
```

5. **Efficient: learned once, applied many times**

```python
# Expensive: Train model offline on historical data
model = train_rl_model(
    trajectories=load_historical_trajectories(),
    epochs=1000,
    compute="16x GPU hours"
)

# Cheap: Apply to each decision
action = model.predict(current_state)  # Milliseconds
```

#### 2.3.4 Learning Objectives

**Define what models should learn:**

```yaml
actor: "Cardiovascular_Specialist"

learning_objectives:
  - metric: "Diagnostic accuracy"
    target: ">90%"
    measurement: "Correct diagnosis in top-3 predictions"
    
  - metric: "Early detection"
    target: "Improve by 20%"
    measurement: "Days from presentation to diagnosis"
    
  - metric: "False positive rate"
    target: "<5%"
    measurement: "Unnecessary interventions triggered"
    
  - metric: "Resource efficiency"
    target: "Reduce by 15%"
    measurement: "Number of tests to reach diagnosis"
```

#### 2.3.5 Initial vs. Learned Capability

**Deployment Strategy:**

```yaml
initial_deployment:
  # Start with rule-based heuristics
  pattern_recognition: "Rule-based symptom matching"
  risk_stratification: "Standard clinical scores (ASCVD, etc.)"
  diagnostic_strategy: "Protocol-based guidelines"
  confidence_calibration: "Fixed thresholds"
  
learning_path:
  phase_1: "Collect trajectories (3 months)"
  phase_2: "Train pattern recognition (offline)"
  phase_3: "A/B test learned models (10% traffic)"
  phase_4: "Gradual rollout if improved"
  phase_5: "Continuous learning and refinement"
```

---

### 2.4 Tools (On-Demand Analysis)

#### 2.4.1 What Belongs in Tools

Tools provide **on-demand analysis and insights**, not raw data dumps.

**Five Tool Categories:**

1. **Historical Query Tools** ("Show me similar situations")

```python
find_similar_patient_cases(
    demographics: Dict,
    symptoms: List[str],
    test_results: Dict,
    limit: int = 5
) -> SimilarCasesResult
```

2. **Analytics Tools** ("Calculate complex metrics")

```python
calculate_risk_scores(
    patient_profile: Profile,
    risk_factors: List[Factor]
) -> RiskAnalysis
```

3. **Simulation Tools** ("What if we do X?")

```python
simulate_treatment_outcomes(
    patient: Patient,
    treatment: Treatment,
    scenarios: List[Scenario]
) -> OutcomeProjections
```

4. **External Data Tools** ("Fetch current information")

```python
get_latest_guidelines(
    condition: Condition,
    jurisdiction: Jurisdiction
) -> Guidelines
```

5. **Pattern Detection Tools** ("Find patterns in data")

```python
detect_ecg_patterns(
    ecg_data: ECGData,
    known_patterns: List[Pattern]
) -> DetectedPatterns
```

#### 2.4.2 Tool Design Principles

**Critical Rule:**

> **Tools return insights, not raw data.**

**Bad Tool Design:**

```python
# ❌ BAD: Raw data dump
def get_all_historical_records(patient_id: str) -> List[Record]:
    return database.query("SELECT * FROM records WHERE patient_id = ?", patient_id)
    # Returns: 10,000 records, overwhelming context
    # LLM must analyze all data
    # Expensive, slow, context explosion
```

**Good Tool Design:**

```python
# ✅ GOOD: Pre-analyzed insights
def analyze_patient_history(
    patient_id: str,
    focus: str,
    timeframe: str
) -> PatientHistoryInsights:
    records = database.query(...)
    
    # Pre-compute insights
    return {
        "key_findings": [
            "Glucose control improved 15% over 6 months",
            "Medication adherence 85% (above target)",
            "3 ER visits for hypoglycemia (concerning pattern)"
        ],
        "trends": {
            "glucose": {
                "direction": "improving",
                "rate": "+1.5% per month",
                "current_level": "near-target"
            },
            "blood_pressure": {
                "direction": "stable",
                "within_target": True
            }
        },
        "concerns": [
            {
                "issue": "Hypoglycemia episodes",
                "frequency": "3 in 6 months",
                "severity": "moderate",
                "recommendation": "Consider medication adjustment"
            }
        ],
        "successes": [
            "A1C reduction from 8.2% to 7.1%",
            "Weight loss of 12 lbs",
            "Improved medication adherence"
        ],
        "confidence": 0.92,
        "data_completeness": 0.95
    }
    # Returns: Actionable insights, bounded size (~2000 tokens)
```

**Tool Output Characteristics:**

- **Bounded**: Fixed maximum size (e.g., top 5 results)
- **Pre-analyzed**: Statistics computed, not raw data
- **Actionable**: Directly usable for decision-making
- **Contextualized**: Includes relevance/confidence scores
- **Insightful**: Answers "so what?", not just "what?"

#### 2.4.3 Domain-Specific Tool Examples

**Healthcare Tools:**

```python
# Tool 1: Similar cases
find_similar_patient_cases(demographics, symptoms) → {
    "similar_cases_found": 23,
    "top_matches": [
        {
            "similarity": 0.87,
            "outcome": "Full recovery with Treatment A",
            "timeline": "3 months",
            "notable_factors": ["Age match", "Comorbidity match"]
        }
    ],
    "most_common_diagnoses": {
        "Diagnosis A": {"frequency": 0.65, "typical_outcome": "good"},
        "Diagnosis B": {"frequency": 0.25, "typical_outcome": "moderate"}
    },
    "effective_treatments": [
        {
            "treatment": "Treatment A",
            "success_rate": 0.78,
            "side_effects": "Minor in 15% of cases"
        }
    ],
    "complications_to_watch": [
        "Complication X (occurred in 12% of similar cases)",
        "Watch for early signs: symptom Y, symptom Z"
    ],
    "confidence": 0.85
}

# Tool 2: Risk calculation
calculate_treatment_risk_benefit(patient, treatment) → {
    "success_probability": 0.78,
    "expected_improvement": "Significant (effect size: 0.6)",
    "side_effect_risks": {
        "minor": 0.15,
        "moderate": 0.05,
        "severe": 0.01
    },
    "alternative_treatments": [
        {
            "name": "Treatment B",
            "success": 0.72,
            "profile": "Safer but slightly less effective"
        }
    ],
    "recommendation": "Proceed with Treatment A, monitor closely",
    "monitoring_plan": ["Check labs week 2", "Follow-up week 4"],
    "confidence": 0.80
}
```

**Legal Tools:**

```python
# Tool 1: Precedent search
search_precedent(legal_issue, jurisdiction) → {
    "most_relevant_cases": [
        {
            "case": "Silva v. Santos, STJ 2023",
            "relevance": 0.92,
            "holding": "CISG Article 25 applies to fundamental breach",
            "facts_match": "Contract type and breach type identical",
            "distinguishing_factors": ["Different industry sector"]
        }
    ],
    "binding_authority": True,
    "jurisdiction_match": "Federal, fully applicable",
    "success_rate_this_argument": 0.68,
    "counter_arguments": [
        "Defendant may distinguish based on X",
        "Alternative interpretation in Y jurisdiction"
    ],
    "judge_citation_patterns": "This judge favors CISG precedent",
    "strategic_recommendations": [
        "Lead with Silva case",
        "Preempt distinguishing argument",
        "Cite Vienna Convention interpretive guidance"
    ],
    "confidence": 0.85
}

# Tool 2: Case valuation
calculate_case_value(facts, evidence, jurisdiction) → {
    "expected_trial_value": 850000,
    "probability_adjusted_value": 595000,
    "settlement_range": [500000, 700000],
    "key_value_drivers": [
        "Strong liability evidence (+$200K)",
        "Clear damages documentation (+$150K)",
        "Plaintiff credibility high (+$100K)"
    ],
    "weaknesses_affecting_value": [
        "Contributory negligence claim (-$150K)",
        "Damages calculation disputed (-$100K)"
    ],
    "comparable_cases": [
        {"case": "Case A", "verdict": 780000, "similarity": 0.78}
    ],
    "negotiation_leverage": "Moderate (55% win probability)",
    "recommendation": "Target settlement $600K-$650K",
    "confidence": 0.75
}
```

**Customer Service Tools:**

```python
# Tool 1: Sentiment analysis
analyze_customer_sentiment_history(customer_id) → {
    "sentiment_trend": "Declining (7.5 → 4.2 over 3 months)",
    "recent_interactions": 8,
    "satisfaction_scores": [7, 7, 6, 5, 4, 4, 3, 4],
    "trend_analysis": "Steady decline, accelerating recently",
    "common_complaints": [
        {
            "complaint": "Delivery delays",
            "frequency": 5,
            "severity": "High impact on satisfaction"
        },
        {
            "complaint": "Product quality",
            "frequency": 3,
            "severity": "Moderate impact"
        }
    ],
    "positive_aspects": [
        "Appreciates quick support responses",
        "Values product features"
    ],
    "churn_risk": 0.68,
    "churn_signals": [
            "Decreased engagement",
        "Exploring competitors (inferred from questions)"
    ],
    "recommended_interventions": [
        "Executive outreach (high priority)",
        "Service credit offer",
        "Personalized retention plan"
    ],
    "intervention_timing": "Within 7 days (urgent)",
    "confidence": 0.82
}

# Tool 2: Resolution strategies
find_similar_resolution_strategies(issue_type) → {
    "issue_type": "Billing dispute",
    "similar_cases_analyzed": 147,
    "successful_approaches": [
        {
            "approach": "Immediate credit + explanation",
            "success_rate": 0.85,
            "satisfaction_after": 8.2,
            "typical_resolution_time": "Same day"
        },
        {
            "approach": "Investigation + delayed credit",
            "success_rate": 0.62,
            "satisfaction_after": 6.5,
            "typical_resolution_time": "3-5 days"
        }
    ],
    "escalation_needed": False,
    "recommended_approach": "Immediate credit",
    "rationale": "High-value customer, clear error, low fraud risk",
    "script_suggestions": [
        "Acknowledge error immediately",
        "Explain root cause",
        "Offer credit + gesture of goodwill"
    ],
    "confidence": 0.88
}
```

#### 2.4.4 Tool Interface Design

**Standard Interface Pattern:**

```python
def tool_name(
    # Required parameters
    primary_input: Type,
    
    # Filtering/scoping parameters
    filters: Dict,
    timeframe: Optional[str] = None,
    
    # Output control
    limit: int = 5,              # Bounded output
    confidence_threshold: float = 0.7  # Quality filter
) -> ToolResult:
    """
    Brief description of what tool does.
    
    Args:
        primary_input: Main input for analysis
        filters: Narrow scope of analysis
        timeframe: Temporal scope
        limit: Maximum results to return
        confidence_threshold: Minimum confidence for inclusion
        
    Returns:
        ToolResult with:
        - Pre-analyzed insights
        - Confidence scores
        - Actionable recommendations
        - Bounded size (~2000 tokens)
    """
    # Implementation
    pass
```

**Output Schema:**

```yaml
tool_output_schema:
  # Core results (always included)
  primary_results:
    type: "array"
    max_items: 5  # Enforced limit
    items:
      result: "object"
      confidence: "float"
      
  # Analysis (pre-computed)
  analysis:
    summary: "string"
    key_findings: "array[string]"
    trends: "object"
    
  # Recommendations (actionable)
  recommendations:
    type: "array"
    items:
      recommendation: "string"
      rationale: "string"
      priority: "high|medium|low"
      
  # Metadata (quality signals)
  metadata:
    confidence: "float"
    data_completeness: "float"
    computation_method: "string"
    
  # Size estimate
  estimated_tokens: ~2000
```

#### 2.4.5 Tool Output Size Management

**Bounded Output Strategy:**

```python
# Enforce maximum result count
def find_similar_cases(..., limit: int = 5) -> Result:
    all_matches = query_all_similar()
    
    # Sort by relevance
    sorted_matches = sort_by_relevance(all_matches)
    
    # Take top N only
    top_matches = sorted_matches[:limit]
    
    # Pre-analyze instead of returning all
    return {
        "top_matches": top_matches,  # Limited to 5
        "total_found": len(all_matches),  # Count for context
        "coverage": "Top matches represent 80% of pattern variance",
        "additional_available": len(all_matches) - limit
    }
```

**Summarization Pattern:**

```python
# Instead of returning all history
def analyze_history(...) -> Analysis:
    full_history = load_complete_history()  # Could be huge
    
    # Don't return full_history!
    # Summarize into insights
    return {
        "key_patterns": extract_patterns(full_history),
        "trend_summary": compute_trends(full_history),
        "anomalies": detect_anomalies(full_history),
        "statistics": compute_stats(full_history),
        # Original data not included - only insights
    }
```

#### 2.4.6 When NOT to Use Tools

**Use direct state access when:**

1. **Data already in state**

```python
# Don't call tool for current value
# ❌ result = tool_get_current_glucose(patient_id)
# ✅ glucose = actor.state.current_vitals.glucose
```

2. **Simple computation**

```python
# Don't call tool for trivial calculation
# ❌ result = tool_calculate_age(birth_date, current_date)
# ✅ age = current_date.year - birth_date.year
```

3. **Hot path operations**

```python
# Don't call tool in tight loop
# ❌ for item in items:
#       result = tool_analyze(item)  # Network call each time
# ✅ results = tool_batch_analyze(items)  # Single call
```

---

### 2.5 Three-Layer Integration Example

**Complete Example: Healthcare Diagnostic Specialist**

```typescript
class CardiovascularSpecialistActor extends Entity {
  // LAYER 1: STATE (Current Context, 2-5K tokens)
  state: Ref<{
    // Current patient
    patient_id: string
    monitoring_since: DateTime
    
    // Current status
    current_condition: "stable" | "declining" | "improving"
    current_vitals: {
      heart_rate: number
      blood_pressure: string
      ejection_fraction: number
      last_updated: DateTime
    }
    
    // Recent memory (last 5)
    recent_observations: Array<{
      date: DateTime
      finding: string
      significance: string
    }>
    
    // Active monitoring
    watching: {
      current_concerns: Array<{
        concern: string
        since: DateTime
        severity: "low" | "medium" | "high"
        trigger_if: string
      }>
    }
    
    // Current beliefs
    working_diagnosis: {
      primary: string
      confidence: number
      differential: string[]
      supporting_evidence: string[]
      last_updated: DateTime
    }
  }>
  
  // LAYER 2: MODEL (Learned Patterns, separate file)
  model: {
    // Pattern recognition (neural network)
    symptom_pattern_classifier: TrainedModel
    
    // Risk stratification (learned thresholds)
    risk_stratification_model: TrainedModel
    
    // Diagnostic strategy (RL policy)
    diagnostic_policy: PolicyNetwork
    
    // Confidence calibration
    confidence_model: CalibrationModel
  }
  
  // LAYER 3: TOOLS (On-demand, Effect services)
  tools: {
    find_similar_patient_cases: ToolService
    calculate_risk_scores: ToolService
    simulate_treatment_outcomes: ToolService
    get_latest_guidelines: ToolService
    detect_ecg_patterns: ToolService
  }
  
  // Message handler uses all three layers
  handleMessage(msg: DiagnosticRequest) {
    return Effect.gen(function* () {
      // 1. Get current state
      const stateRef = yield* Entity.state<DiagnosticState>()
      const currentState = yield* Ref.get(stateRef)
      
      // 2. Use model to recognize patterns in state
      const patterns = this.model.symptom_pattern_classifier.predict({
        symptoms: msg.symptoms,
        vitals: currentState.current_vitals,
        recent_history: currentState.recent_observations
      })
      
      // 3. Call tool for similar cases (on-demand)
      const similarCases = yield* this.tools.find_similar_patient_cases({
        demographics: msg.patient_demographics,
        symptoms: msg.symptoms,
        test_results: msg.test_results,
        limit: 5
      })
      
      // 4. Use model's policy to decide next action
      const action = this.model.diagnostic_policy.recommend({
        current_state: currentState,
        recognized_patterns: patterns,
        similar_case_insights: similarCases
      })
      
      // 5. Update state with new observation
      yield* Ref.update(stateRef, state => ({
        ...state,
        recent_observations: [
          ...state.recent_observations.slice(-4),  // Keep last 4
          {
            date: now(),
            finding: action.diagnosis,
            significance: action.confidence > 0.8 ? "high" : "medium"
          }
        ],
        working_diagnosis: {
          primary: action.diagnosis,
          confidence: action.confidence,
          differential: patterns.alternative_diagnoses,
          supporting_evidence: [...similarCases.top_matches.map(c => c.outcome)],
          last_updated: now()
        }
      }))
      
      return action
    })
  }
}
```

**Token Budget Breakdown:**

```yaml
context_window_budget:
  # State (in context for every decision)
  state_tokens: 3000
    current_context: 500
    recent_memory: 1000
    active_monitoring: 500
    current_beliefs: 1000
  
  # System prompt (in context)
  system_prompt: 500
  
  # Task description (in context)
  current_task: 500
  
  # Tool results (only when called)
  tool_results: 2000  # Bounded per tool
  
  # Reasoning space
  reasoning_space: 6000
  
  total_max: 12000  # Well within 25K target

# Model weights: NOT in context
# - Loaded once, applied to each decision
# - No token cost at inference time
# - Updated separately through training
```

**Key Benefits:**

1. **State stays lightweight** - Only current context, not statistics or history
2. **Models improve independently** - Training doesn't affect context window
3. **Tools provide depth** - Historical analysis available without bloating state
4. **Clear separation** - Each layer has distinct purpose and lifecycle
5. **Scalable** - Can optimize each layer independently

This architecture enables actors to maintain rich context while staying within token budgets, learn and improve through RL, and access deep historical analysis when needed.
