---
modified: 2025-11-02T17:28:33-03:00
---
# Requirements & Principles for Agentic Systems in Complex Domains

## Core Architectural Principles

### 1. **Actor = Persistent Domain of Expertise**

**Principle**: Map actors to domains that have meaningful lifecycle and accumulated knowledge, not to decision points or orchestration functions.

```
✅ CORRECT: Persistent Expertise
Actor = Domain Expert
- Develops specialized knowledge over time
- Accumulates domain-specific intuition
- Learns from successes and failures
- Makes decisions informed by experience
- Builds irreplaceable expertise

❌ WRONG: Decision-Point Function
Actor = Decision Router
- Just approves/rejects requests
- No state accumulation
- No expertise development
- Just a routing function
- Could be replaced by simple rules
```

**Domain Examples**:

| Domain               | Good Actor                                                 | Bad Actor                              |
| -------------------- | ---------------------------------------------------------- | -------------------------------------- |
| **Healthcare**       | Diagnostic Specialist (builds patient pattern recognition) | Symptom Checker (stateless lookup)     |
| **Legal**            | Case Strategist (develops litigation philosophy)           | Motion Approver (just routes)          |
| **Finance**          | Portfolio Manager (accumulates investment thesis)          | Trade Router (stateless execution)     |
| **Manufacturing**    | Quality Engineer (learns failure patterns)                 | Defect Flagger (binary classification) |
| **Customer Service** | Account Manager (knows customer history)                   | Ticket Dispatcher (routes to queues)   |

**Why It Matters**:
- Enables genuine expertise development through experience
- Creates meaningful context for reinforcement learning
- Allows collective intelligence to emerge from specialization
- Each actor becomes increasingly valuable over time
- Decisions improve as domain knowledge accumulates

---

### 2. **Three-Layer Separation: State / Weights / Tools**

**Principle**: Clearly separate what lives where to optimize context windows and enable learning.

```
┌─────────────────────────────────────────┐
│         MODEL WEIGHTS (Learned)          │
│  • Statistical patterns & success rates │
│  • Optimal parameters & thresholds      │
│  • Policy functions (what to do when)   │
│  • Pattern recognition neural nets      │
│                                         │
│  Updated through: RL training           │
└─────────────────────────────────────────┘
                ↓ (guides reasoning)
┌─────────────────────────────────────────┐
│       ACTOR STATE (Current Context)      │
│  • Current values & status              │
│  • Recent events (short memory)         │
│  • Active monitoring items              │
│  • Immediate beliefs & assessments      │
│                                         │
│  Size: Lightweight (2-25K tokens)       │
└─────────────────────────────────────────┘
                ↓ (calls when needed)
┌─────────────────────────────────────────┐
│         TOOLS (On-Demand Analysis)       │
│  • Historical data queries              │
│  • Complex calculations                 │
│  • Deep analysis & simulations          │
│  • External data retrieval              │
│                                         │
│  Returns: Insights, not raw data        │
└─────────────────────────────────────────┘
```

---

#### **Actor State (Lightweight, Current Context)**

**What Belongs Here**:

```python
{
    # Current ground truth - what IS right now
    "current_status": {...},
    "active_items": {...},
    "immediate_metrics": {...},
    
    # Short-term memory - recent context (last 3-5)
    "recent_events": [...],
    "recent_decisions": [...],
    
    # Active monitoring - what watching RIGHT NOW
    "watching": {...},
    "alerts_active": [...],
    
    # Current beliefs - what think NOW
    "confidence_levels": {...},
    "working_hypotheses": {...}
}
```

**Characteristics**:
- **Current values only** - prices, statuses, measurements NOW
- **Recent history** - last 3-5 events/decisions for continuity
- **Active focus** - what monitoring or working on currently
- **Immediate context** - numeric indicators grounding decisions
- **Present tense** - "is", "currently", "now"

**Size Guidelines**: 2K-25K tokens depending on complexity
- Simple monitoring actors: 2-5K
- Analytical specialists: 10-15K
- Strategic coordinators: 20-25K

**Domain Examples**:

*Healthcare - Patient Care Coordinator*

```python
{
    "patient": {"id": "P12345", "age": 67, "current_condition": "stable"},
    "active_diagnoses": ["Type 2 diabetes", "Hypertension"],
    "current_vitals": {"bp": "130/85", "glucose": 145},
    "recent_events": [
        {"date": "2025-10-28", "event": "Lab results show A1C improvement"},
        {"date": "2025-10-20", "event": "Medication adjusted"}
    ],
    "watching": {
        "glucose_trend": "Monitoring for continued improvement",
        "next_appointment": "2025-11-15"
    },
    "current_treatment_plan": {
        "medication": ["Metformin 1000mg BID"],
        "confidence_in_plan": 0.80
    }
}
```

*Manufacturing - Production Line Monitor*

```python
{
    "line_status": "operational",
    "current_throughput": 245,  # units/hour
    "quality_metrics": {"defect_rate": 0.02, "yield": 0.98},
    "recent_anomalies": [
        {"time": "14:23", "type": "temperature_spike", "resolved": True}
    ],
    "watching": {
        "machine_3": "Vibration levels elevated, monitoring",
        "ambient_temp": "Outside normal range"
    }
}
```

---

#### **Model Weights (Learned, Not in State)**

**What Belongs Here**:

```python
# These live in ML/RL models, trained over time
θ = {
    "pattern_recognition": neural_network_weights,
    "decision_policy": policy_network_parameters,
    "optimal_thresholds": learned_values,
    "success_predictors": trained_model,
    "strategy_selector": learned_policy
}
```

**Characteristics**:
- **Statistical patterns** - "win rates", "success frequencies"
- **Optimal parameters** - learned thresholds, limits, factors
- **Policy functions** - what action to take in situations
- **Learned heuristics** - rules discovered through experience
- **Pattern detectors** - neural nets recognizing important signals

**Why Separate from State**:
- Models improve through RL without bloating context
- Same model can guide many actor instances
- Enables A/B testing of model versions
- Clear separation of "what is" vs "what works"
- Efficient: learned once, applied many times

**Domain Examples**:

*Healthcare*

```python
diagnosis_model = {
    "symptom_pattern_classifier": θ_symptoms,
    "treatment_success_predictor": θ_treatment,
    "optimal_dosing_policy": learned_params,
    "patient_risk_stratification": θ_risk
}
# Learned: Which symptom combinations indicate which conditions
# Learned: Which treatments work for which patient profiles
```

*Legal*

```python
litigation_model = {
    "case_theory_success_rates": θ_theory,
    "settlement_timing_optimizer": θ_settlement,
    "judge_persuasion_patterns": θ_judge,
    "motion_success_predictor": θ_motions
}
# Learned: Which arguments work with which judges
# Learned: Optimal timing for settlement discussions
```

*Manufacturing*

```python
quality_model = {
    "defect_pattern_detector": θ_defects,
    "optimal_maintenance_policy": θ_maintenance,
    "quality_parameter_optimizer": θ_quality,
    "failure_predictor": θ_failure
}
# Learned: Which parameter drifts predict defects
# Learned: Optimal maintenance schedules
```

---

#### **Tools (On-Demand, Called When Needed)**

**What Belongs Here**:

```python
# Functions that provide insights when called

query_historical_patterns(filters) → insights
calculate_complex_metrics(data) → analysis
simulate_scenarios(parameters) → outcomes
retrieve_external_data(query) → information
detect_patterns(data) → matches
```

**Characteristics**:
- **Pre-computed insights** - not raw data dumps
- **Bounded outputs** - designed for context window
- **Domain-specific** - specialized for actor's work
- **On-demand only** - called during reasoning, not always loaded
- **Actionable results** - ready to inform decisions

**Good Tool Design**:

```python
# ❌ BAD: Raw data dump
get_all_historical_records() → [
    {"date": "...", "value": "...", ...},
    # ... 10,000 records
]
# Problems: Overwhelms context, LLM must analyze

# ✅ GOOD: Pre-analyzed insights
analyze_pattern_success(pattern_type, context) → {
    "occurrences_found": 47,
    "success_rate": 0.72,
    "avg_outcome": 8.5,
    "key_success_factors": ["Factor A", "Factor B"],
    "failure_characteristics": "Usually fails when X",
    "confidence": 0.85
}
# Benefits: Actionable, bounded, insightful
```

**Tool Categories**:

1. **Historical Query Tools**
   - "Show me similar situations"
   - "What happened last time we..."
   - "Find cases matching these characteristics"

2. **Analytics Tools**
   - "Calculate complex metric X"
   - "Perform statistical analysis"
   - "Decompose risk factors"

3. **Simulation Tools**
   - "What if we do X?"
   - "Stress test scenario Y"
   - "Project outcome under conditions Z"

4. **External Data Tools**
   - "Fetch current market data"
   - "Get regulatory filing"
   - "Retrieve patient history"

5. **Pattern Detection Tools**
   - "Find patterns in this data"
   - "Detect anomalies"
   - "Match against known signatures"

**Domain Examples**:

*Healthcare Tools*

```python
find_similar_patient_cases(demographics, symptoms) → {
    "similar_cases": 23,
    "most_common_diagnoses": ["Diagnosis A (65%)", "Diagnosis B (25%)"],
    "effective_treatments": [...],
    "complications_to_watch": [...],
    "typical_progression": "..."
}

calculate_treatment_risk_benefit(patient, treatment) → {
    "success_probability": 0.78,
    "expected_improvement": "significant",
    "side_effect_risks": {"minor": 0.15, "major": 0.03},
    "alternative_treatments": [...],
    "recommendation": "Proceed with close monitoring"
}
```

*Legal Tools*

```python
search_precedent(legal_issue, jurisdiction) → {
    "most_relevant_cases": [...],
    "binding_authority": True,
    "success_rate_this_argument": 0.68,
    "distinguishing_factors": [...],
    "judge_citation_patterns": "Favors this precedent"
}

calculate_case_value(facts, evidence, jurisdiction) → {
    "expected_trial_value": 850000,
    "probability_adjusted": 595000,
    "settlement_range": [500000, 700000],
    "key_value_drivers": [...],
    "weaknesses_affecting_value": [...]
}
```

*Customer Service Tools*

```python
analyze_customer_sentiment_history(customer_id) → {
    "sentiment_trend": "declining",
    "recent_interactions": 8,
    "satisfaction_scores": [7, 6, 5, 4],
    "common_complaints": ["Delivery delays", "Product quality"],
    "churn_risk": 0.68,
    "recommended_interventions": [...]
}

find_similar_resolution_strategies(issue_type) → {
    "successful_approaches": [...],
    "success_rate_by_approach": {...},
    "typical_resolution_time": "3 days",
    "escalation_needed": False,
    "customer_satisfaction_after": 0.85
}
```

---

### 3. **Event-Driven Architecture with Two-Tier Triggers**

**Principle**: Distinguish system-level (always active, critical) from agent-defined (dynamic, strategic) triggers.

```
┌─────────────────────────────────────────────┐
│      SYSTEM-LEVEL TRIGGERS                   │
│      (Hardcoded by designers)                │
│                                              │
│  • Critical events (must never miss)        │
│  • Compliance & risk (mandatory)            │
│  • Process milestones (required)            │
│  • External deadlines (non-negotiable)      │
│                                              │
│  Priority: CRITICAL → Always resume agents  │
│  Nature: Defensive (protect, comply)        │
└─────────────────────────────────────────────┘
                    ↓
        ┌──────────────────────┐
        │   Event Router       │
        │   Prioritizes &      │
        │   Dispatches         │
        └──────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      AGENT-DEFINED TRIGGERS                  │
│      (Dynamically set by actors)            │
│                                              │
│  • Opportunity monitoring (exploit)         │
│  • Strategic timing (optimize)              │
│  • Pattern watching (anticipate)            │
│  • Tactical execution (precise)             │
│                                              │
│  Priority: Context-dependent                │
│  Nature: Offensive (optimize, capture)      │
└─────────────────────────────────────────────┘
```

---

#### **System-Level Triggers** (Critical Infrastructure)

**Characteristics**:
- **Mandatory** - Cannot be disabled or modified by agents
- **Defensive** - Protect against harm, ensure compliance
- **Critical priority** - Always interrupt and notify
- **Stable** - Rarely change over time
- **Domain-universal** - Apply to all actors

**Categories**:

1. **Compliance & Regulatory**

   ```python
   regulatory_triggers = {
       "deadline_approaching": "Legal/regulatory deadline in 7 days",
       "compliance_breach": "System action violated regulation",
       "audit_required": "Regulatory audit scheduled",
       "reporting_due": "Mandatory report due date"
   }
   ```

2. **Risk & Safety**

   ```python
   risk_triggers = {
       "threshold_breach": "Critical limit exceeded",
       "safety_incident": "Safety protocol triggered",
       "anomaly_critical": "Significant deviation detected",
       "escalation_required": "Human oversight needed"
   }
   ```

3. **Process Milestones**

   ```python
   milestone_triggers = {
       "stage_completion": "Process stage completed",
       "gate_reached": "Decision gate approaching",
       "handoff_required": "Transfer to next actor needed",
       "checkpoint_mandatory": "Required review point"
   }
   ```

4. **External Events**

   ```python
   external_triggers = {
       "stakeholder_action": "Customer/partner/adversary acted",
       "environmental_change": "External condition changed",
       "resource_available": "Critical resource now available",
       "deadline_imposed": "External deadline set"
   }
   ```

**Domain Examples**:

*Healthcare*

```python
SYSTEM_TRIGGERS = {
    "patient_deterioration": {
        "trigger": "Vital signs outside critical range",
        "actions": ["alert_physician", "prepare_emergency_response"],
        "priority": "CRITICAL"
    },
    "adverse_drug_event": {
        "trigger": "Drug interaction detected",
        "actions": ["stop_administration", "alert_prescriber"],
        "priority": "CRITICAL"
    },
    "scheduled_medication": {
        "trigger": "Medication administration time",
        "actions": ["verify_patient", "document_administration"],
        "priority": "HIGH"
    }
}
```

*Legal*

```python
SYSTEM_TRIGGERS = {
    "court_deadline": {
        "trigger": "Filing due in 7 days",
        "actions": ["alert_case_team", "verify_ready_to_file"],
        "priority": "CRITICAL"
    },
    "opposing_motion_filed": {
        "trigger": "Adversary filed motion",
        "actions": ["calculate_response_deadline", "assign_research"],
        "priority": "HIGH"
    },
    "discovery_deadline": {
        "trigger": "Discovery closes in 30 days",
        "actions": ["assess_gaps", "plan_final_requests"],
        "priority": "HIGH"
    }
}
```

*Manufacturing*

```python
SYSTEM_TRIGGERS = {
    "quality_failure": {
        "trigger": "Defect rate exceeds threshold",
        "actions": ["stop_line", "quarantine_batch", "alert_quality"],
        "priority": "CRITICAL"
    },
    "maintenance_due": {
        "trigger": "Scheduled maintenance window",
        "actions": ["plan_downtime", "prepare_parts", "schedule_technicians"],
        "priority": "HIGH"
    },
    "safety_alarm": {
        "trigger": "Safety sensor triggered",
        "actions": ["emergency_stop", "evacuate_area", "alert_safety"],
        "priority": "CRITICAL"
    }
}
```

---

#### **Agent-Defined Triggers** (Strategic Optimization)

**Characteristics**:
- **Dynamic** - Set/modified by actors based on current strategy
- **Offensive** - Exploit opportunities, optimize outcomes
- **Context-dependent priority** - Important but not always critical
- **Evolving** - Change as strategy evolves
- **Actor-specific** - Each actor sets relevant triggers

**Usage Patterns**:

```python
# Actor sets trigger based on current context
actor.set_alert(
    alert_id="unique_identifier",
    condition=ConditionExpression,
    actions=["what_to_do_when_triggered"],
    reasoning="Why this trigger matters now",
    ttl="how_long_to_monitor",
    priority="HIGH/MEDIUM/LOW"
)
```

**Example Patterns**:

1. **Opportunity Monitoring**

   ```python
   # "Tell me when favorable conditions arise"
   actor.set_alert(
       condition="metric_crosses_threshold_favorably",
       action="evaluate_opportunity",
       reasoning="This creates advantage we can exploit"
   )
   ```

2. **Pattern Completion Watching**

   ```python
   # "Alert me when pattern completes"
   actor.set_alert(
       condition="pattern_reaches_final_stage",
       action="execute_planned_response",
       reasoning="Pattern suggests specific outcome"
   )
   ```

3. **Confirmation Gathering**

   ```python
   # "Let me know when we have enough confirming signals"
   actor.set_alert(
       condition="confidence_threshold_reached",
       action="make_decision",
       reasoning="Waiting for sufficient evidence"
   )
   ```

4. **Timing Optimization**

   ```python
   # "Tell me when timing is optimal"
   actor.set_alert(
       condition="optimal_timing_window_opens",
       action="execute_time_sensitive_action",
       reasoning="Action most effective at specific time"
   )
   ```

**Domain Examples**:

*Healthcare*

```python
# Physician sets dynamic monitoring
physician.set_alert(
    condition="patient_A1C_drops_below_7.0",
    action="consider_medication_reduction",
    reasoning="If A1C improves, may be able to reduce medication dose"
)

physician.set_alert(
    condition="three_consecutive_elevated_readings",
    action="reassess_treatment_plan",
    reasoning="Pattern suggests current treatment insufficient"
)
```

*Legal*

```python
# Case strategist sets strategic triggers
strategist.set_alert(
    condition="30_days_before_expert_reports_due",
    action="initiate_settlement_discussions",
    reasoning="Optimal leverage point before expensive expert phase"
)

strategist.set_alert(
    condition="opposing_counsel_files_weak_motion",
    action="capitalize_with_sanctions_request",
    reasoning="History shows they settle after sanctions threat"
)
```

*Customer Service*

```python
# Account manager sets relationship triggers
manager.set_alert(
    condition="customer_engagement_increases_after_quiet_period",
    action="reach_out_proactively",
    reasoning="Engagement spike often precedes expansion opportunity"
)

manager.set_alert(
    condition="renewal_date_minus_60_days",
    action="begin_renewal_conversation",
    reasoning="60-day window optimal for renewal discussions"
)
```

**Key Distinction**:

| System-Level | Agent-Defined |
|--------------|---------------|
| "Must respond to X" | "Want to know when Y" |
| Compliance, safety, mandatory | Optimization, opportunity, strategic |
| Cannot be disabled | Can be modified/removed |
| Applies to all actors | Actor-specific |
| Defensive posture | Offensive posture |
| Stable over time | Evolves with strategy |
| Always critical priority | Context-dependent priority |

---

### 4. **Deterministic Workflows for Known Processes**

**Principle**: Use deterministic (rule-based) workflows for well-understood sequences; reserve LLM reasoning for genuine uncertainty and judgment calls.

```
┌─────────────────────────────────────────┐
│        WHEN TO USE EACH                  │
├─────────────────────────────────────────┤
│                                         │
│  DETERMINISTIC WORKFLOW                 │
│  • Process is clearly defined           │
│  • Steps are sequential & known         │
│  • No judgment required                 │
│  • Compliance/safety critical           │
│  • Fast execution needed                │
│                                         │
│  Examples:                              │
│  - Checklist completion                 │
│  - State machine transitions            │
│  - Calculation sequences                │
│  - Validation procedures                │
│  - Notification cascades                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  LLM REASONING                          │
│  • Situation is novel/ambiguous         │
│  • Multiple valid approaches            │
│  • Context-dependent judgment           │
│  • Trade-offs to balance                │
│  • Strategic implications               │
│                                         │
│  Examples:                              │
│  - Strategic decisions                  │
│  - Novel situation analysis             │
│  - Complex trade-off evaluation         │
│  - Pattern interpretation               │
│  - Contextual judgment                  │
│                                         │
└─────────────────────────────────────────┘
```

---

#### **Deterministic Workflow Patterns**

**1. State Machine Pattern**

```python
# Clear state transitions, no ambiguity
def process_request(request):
    state = request.current_state
    
    if state == "SUBMITTED":
        validate_request(request)
        if valid:
            request.state = "VALIDATED"
        else:
            request.state = "REJECTED"
    
    elif state == "VALIDATED":
        assign_to_handler(request)
        request.state = "ASSIGNED"
    
    elif state == "ASSIGNED":
        # ... continue state machine
```

**2. Checklist Pattern**

```python
# Known requirements, verify completion
def quality_check_workflow(item):
    checklist = [
        verify_dimension_tolerance(),
        verify_surface_finish(),
        verify_material_spec(),
        verify_documentation(),
        verify_traceability()
    ]
    
    results = []
    for check in checklist:
        result = check(item)
        results.append(result)
        if not result.passed:
            flag_for_review(item, result.reason)
            return "FAILED"
    
    approve_item(item)
    return "PASSED"
```

**3. Escalation Pattern**

```python
# Clear escalation criteria
def handle_incident(incident):
    severity = calculate_severity(incident)
    
    if severity == "CRITICAL":
        notify_emergency_team()
        initiate_crisis_protocol()
        alert_executives()
    elif severity == "HIGH":
        notify_on_call_manager()
        create_priority_ticket()
    elif severity == "MEDIUM":
        assign_to_team_queue()
    else:
        log_for_batch_processing()
```

**4. Calculation Pipeline Pattern**

```python
# Sequential calculations, no judgment
def calculate_final_score(data):
    # Step 1: Normalize inputs
    normalized = normalize_values(data)
    
    # Step 2: Apply weights
    weighted = apply_weights(normalized, WEIGHTS)
    
    # Step 3: Aggregate
    aggregated = aggregate_scores(weighted)
    
    # Step 4: Apply thresholds
    categorized = categorize_by_threshold(aggregated)
    
    return categorized
```

---

#### **Hybrid Workflows (Deterministic + LLM)**

**Pattern**: Deterministic scaffolding with LLM judgment at decision points

```python
def process_complex_request(request):
    # DETERMINISTIC: Initial validation
    validation = validate_basic_requirements(request)
    if not validation.passed:
        return reject_request(validation.reason)
    
    # DETERMINISTIC: Data gathering
    context = gather_context(request)
    
    # LLM: Judgment call on ambiguous classification
    classification = llm_classify(
        context=context,
        task="determine_request_type",
        uncertainty_threshold=0.7
    )
    
    if classification.confidence < 0.7:
        # DETERMINISTIC: Low confidence → escalate
        return escalate_to_human(request, classification)
    
    # DETERMINISTIC: Route based on classification
    if classification.type == "TYPE_A":
        return handle_type_a_workflow(request)
    elif classification.type == "TYPE_B":
        return handle_type_b_workflow(request)
    
    # LLM: Complex case requires reasoning
    else:
        return llm_handle_complex_case(request, context)
```

**Domain Examples**:

*Healthcare - Medication Administration*

```python
# DETERMINISTIC workflow
def administer_medication(patient, medication):
    # 1. Verify patient identity (5 Rights)
    if not verify_patient_id(patient):
        return abort_administration("Patient verification failed")
    
    # 2. Verify medication
    if not verify_medication(medication, patient.prescription):
        return abort_administration("Medication mismatch")
    
    # 3. Check allergies (rule-based)
    allergies = check_allergies(patient, medication)
    if allergies.has_contraindication:
        return abort_administration(allergies.reason)
    
    # 4. Check drug interactions (rule-based)
    interactions = check_interactions(medication, patient.current_meds)
    if interactions.severity == "CRITICAL":
        return abort_administration(interactions.warning)
    
    # 5. Administer
    administer(patient, medication)
    
    # 6. Document (deterministic)
    document_administration(patient, medication, timestamp=now())
    
    return "SUCCESS"

# LLM reasoning required separately
def assess_patient_pain_management(patient):
    # This requires judgment, not deterministic
    context = f"""
    Patient: {patient.demographics}
    Pain level: {patient.reported_pain}
    Current medications: {patient.current_meds}
    Medical history: {patient.history}
    Recent assessments: {patient.recent_assessments}
    """
    
    assessment = llm_assess(context, task="pain_management_strategy")
    return assessment
```

*Legal - Document Filing*

```python
# DETERMINISTIC workflow
def file_court_document(document):
    # 1. Pre-flight checklist (no judgment)
    checklist = [
        verify_signature_present(document),
        verify_certificate_of_service(document),
        verify_page_limits(document),
        verify_format_compliance(document),
        verify_exhibits_attached(document)
    ]
    
    for check in checklist:
        if not check.passed:
            return abort_filing(check.failure_reason)
    
    # 2. File via e-filing system
    filing_receipt = efile_system.submit(document)
    
    # 3. Calculate response deadline (rule-based)
    response_deadline = calculate_deadline(
        filing_date=filing_receipt.date,
        document_type=document.type,
        jurisdiction=document.court
    )
    
    # 4. Calendar deadline (deterministic)
    add_to_calendar(response_deadline)
    
    # 5. Service (deterministic)
    serve_document(document, opposing_counsel)
    
    # 6. Update case status
    update_case_status(document.case_id, "motion_pending")
    
    return filing_receipt

# LLM reasoning for strategy (separate)
def decide_motion_strategy(case_state):
    # This requires strategic judgment
    decision = llm_decide(
        context=case_state,
        task="optimal_motion_timing_strategy"
    )
    return decision
```

*Customer Service - Refund Processing*

```python
# DETERMINISTIC for clear cases
def process_refund_request(request):
    # 1. Verify basic eligibility (rules)
    if request.days_since_purchase > REFUND_WINDOW_DAYS:
        return deny_refund("Outside refund window")
    
    if request.product_used and not request.product_defective:
        return deny_refund("Product used, not defective")
    
    # 2. Calculate refund amount (formula)
    refund_amount = calculate_refund(
        purchase_price=request.purchase_price,
        days_held=request.days_since_purchase,
        condition=request.product_condition
    )
    
    # 3. Process refund (deterministic)
    if refund_amount <= AUTO_APPROVE_THRESHOLD:
        process_refund(request.customer, refund_amount)
        notify_customer(request.customer, "approved", refund_amount)
        return "AUTO_APPROVED"
    
    # 4. Above threshold → requires review
    else:
        return escalate_for_review(request, refund_amount)

# LLM reasoning for complex/edge cases
def evaluate_complex_refund(request):
    # Requires judgment: partial use, goodwill, relationship value
    context = f"""
    Customer: {request.customer}
    - Lifetime value: ${request.customer.ltv}
    - Relationship: {request.customer.relationship_years} years
    - Past issues: {request.customer.complaint_history}
    
    Request: {request.reason}
    Product: {request.product} (${request.purchase_price})
    Condition: {request.condition}
    
    Factors:
    - Outside strict policy but close
    - Product partially used but customer dissatisfied
    - High-value customer relationship
    """
    
    decision = llm_decide(
        context=context,
        task="balance_policy_relationship_goodwill"
    )
    return decision
```

---

**Decision Framework**:

```
START
  ↓
Is the process clearly defined with known steps?
  ↓
YES → Can it be expressed as rules/formulas?
  ↓       ↓
  YES → Is judgment required at any step?
  │       ↓
  │     NO → DETERMINISTIC WORKFLOW
  │       ↓
  │     YES → HYBRID: Deterministic + LLM at decision points
  │
  NO → Does it require contextual interpretation?
        ↓
      YES → LLM REASONING
        ↓
      Provide clear context and task specification
```

---

### 5. **Stateful Actors Make Contextual Decisions**

**Principle**: Actors use accumulated state and experience to make decisions, not isolated point-in-time analysis.

```
❌ WRONG: Stateless Decision Function
┌─────────────────────────────────┐
│  Decision Function              │
│                                 │
│  Input: Current situation       │
│  Output: Decision               │
│                                 │
│  • No memory of past           │
│  • No accumulated intuition     │
│  • No learning from experience  │
│  • Each decision isolated       │
└─────────────────────────────────┘

✅ RIGHT: Stateful Expert Actor
┌─────────────────────────────────┐
│  Expert Actor                   │
│                                 │
│  • Current situation            │
│  • Recent history (context)     │
│  • Learned patterns (model)     │
│  • Accumulated beliefs          │
│  • Past similar situations      │
│                                 │
│  Decision informed by:          │
│  - What happened before         │
│  - What worked/didn't work      │
│  - Current beliefs/theories     │
│  - Accumulated expertise        │
└─────────────────────────────────┘
```

---

#### **Elements of Stateful Decision-Making**

**1. Reference Recent History**

```python
def make_decision(current_situation):
    # Not just: "What should I do now?"
    # But: "Given what just happened, what should I do now?"
    
    context = f"""
    Current situation: {current_situation}
    
    Recent events:
    - {self.state.recent_events[0]}  # Most recent
    - {self.state.recent_events[1]}
    - {self.state.recent_events[2]}
    
    These events led me to believe: {self.state.current_belief}
    My last decision was: {self.state.recent_decisions[-1]}
    """
    
    decision = llm_decide(context, model=self.learned_policy)
    return decision
```

**2. Apply Accumulated Beliefs**

```python
def evaluate_opportunity(opportunity):
    # Not just: "Is this opportunity good?"
    # But: "Given my current thesis and experience, does this fit?"
    
    # Check against current working theory
    active_theory = self.state.active_theories.get(opportunity.domain)
    
    if active_theory:
        context = f"""
        Opportunity: {opportunity}
        
        My current belief about {opportunity.domain}:
        - Thesis: {active_theory.thesis}
        - Conviction: {active_theory.strength}
        - Supporting evidence so far: {active_theory.evidence}
        
        Does this opportunity:
        1. Support my thesis?
        2. Strengthen or weaken my conviction?
        3. Fit my learned patterns of success?
        """
        
        evaluation = llm_evaluate(
            context=context,
            task="evaluate_opportunity_against_beliefs"
        )
        
        # Update beliefs based on evaluation
        if evaluation.strengthens_thesis:
            active_theory.strength += 0.10
            active_theory.evidence.append(opportunity)
        
        return evaluation
```

**3. Learn from Similar Past Situations**

```python
def handle_complex_situation(situation):
    # Not just: "What do I do?"
    # But: "What happened last time I faced something similar?"
    
    # Query for similar situations using tool
    similar = self.tool_find_similar_situations({
        "type": situation.type,
        "context": situation.context,
        "parameters": situation.parameters
    })
    
    context = f"""
    Current situation: {situation}
    
    Similar past situations:
    {similar[0]}: I decided {similar[0].decision} → {similar[0].outcome}
    {similar[1]}: I decided {similar[1].decision} → {similar[1].outcome}
    
    What I learned from these:
    - {similar[0].lesson_learned}
    - {similar[1].lesson_learned}
    
    Given this experience, what should I do now?
    """
    
    decision = llm_decide(
        context=context,
        task="learn_from_past_and_decide"
    )
    
    return decision
```

**4. Maintain Continuity Across Decisions**

```python
def ongoing_monitoring_decision(current_state):
    # Not just: "What's the status?"
    # But: "How has this evolved, and what does that mean?"
    
    # Reference what was watching for
    watching = self.state.watching.get(current_state.subject)
    
    if watching:
        context = f"""
        Subject: {current_state.subject}
        
        What I was watching for:
        - {watching.expecting}
        - Reason: {watching.reasoning}
        
        What actually happened:
        - {current_state.actual_development}
        
        Previous assessment: {watching.previous_assessment}
        Current assessment: {current_state.current_assessment}
        
        Does this confirm or contradict my expectations?
        Should I revise my understanding?
        """
        
        assessment = llm_assess(context, task="update_understanding")
        
        # Update watching parameters based on assessment
        if assessment.revise_expectations:
            watching.expecting = assessment.new_expectations
            watching.reasoning = assessment.updated_reasoning
        
        return assessment
```

**5. Build on Previous Decisions**

```python
def followup_decision(new_information):
    # Not just: "What does this information tell me?"
    # But: "How does this relate to my previous decisions?"
    
    relevant_decision = self.find_relevant_decision(new_information)
    
    context = f"""
    New information: {new_information}
    
    Related to my previous decision:
    - Date: {relevant_decision.date}
    - Decision: {relevant_decision.action}
    - Reasoning: {relevant_decision.reasoning}
    - Expected outcome: {relevant_decision.expected}
    
    Does this new information:
    1. Confirm my reasoning was correct?
    2. Suggest I should adjust?
    3. Invalidate my previous decision?
    """
    
    evaluation = llm_evaluate(context, task="evaluate_decision_outcome")
    
    # Update decision record with outcome
    relevant_decision.actual_outcome = new_information
    relevant_decision.validation_status = evaluation.status
    
    # Learn from this
    if evaluation.status == "CORRECT":
        self.reinforce_similar_reasoning()
    elif evaluation.status == "INCORRECT":
        self.record_lesson(evaluation.what_went_wrong)
    
    return evaluation
```

---

#### **Anti-Pattern: Stateless Decisions**

```python
# ❌ BAD: No context, no history, no learning
def decide(input):
    return llm_decide(f"Given {input}, what should I do?")
    # Problems:
    # - No memory of what tried before
    # - No sense of ongoing situation
    # - No learning from outcomes
    # - Each decision starts from scratch

# ✅ GOOD: Rich context from accumulated state
def decide(input):
    context = f"""
    Current input: {input}
    
    My current understanding:
    - Active beliefs: {self.state.beliefs}
    - Recent developments: {self.state.recent_events}
    - What I'm monitoring: {self.state.watching}
    
    My relevant experience:
    - Similar situations: {self.tool_query_similar(input)}
    - What worked before: {self.learned_successes}
    - What to avoid: {self.learned_failures}
    
    My recent decisions:
    - {self.state.recent_decisions}
    
    Given all this context and my accumulated expertise,
    what should I do now?
    """
    
    decision = llm_decide(context, model=self.learned_policy)
    
    # Update state with decision
    self.state.recent_decisions.append({
        "decision": decision,
        "reasoning": decision.reasoning,
        "expected_outcome": decision.expectation
    })
    
    return decision
```

---

#### **Domain Examples of Stateful vs. Stateless**

**Healthcare Example**:

```python
# ❌ Stateless - Each visit independent
def prescribe_medication(symptoms):
    return llm_recommend(f"Patient has {symptoms}, what medication?")

# ✅ Stateful - Continuity of care
def adjust_treatment(current_symptoms):
    context = f"""
    Patient: {self.state.patient_id}
    
    Treatment history:
    - Current medications: {self.state.current_treatment}
    - Previous medications tried: {self.state.past_treatments}
    - Response to current treatment: {self.state.treatment_response}
    
    Original diagnosis and reasoning:
    - {self.state.initial_diagnosis}
    
    Current presentation:
    - {current_symptoms}
    
    Changes since last visit:
    - {self.state.recent_events}
    
    Given this patient's history and response pattern,
    should I:
    1. Continue current treatment?
    2. Adjust dosage?
    3. Switch medications?
    4. Add adjunct therapy?
    """
    
    decision = llm_decide(context)
    
    # Update treatment history
    self.state.recent_events.append({
        "date": now(),
        "symptoms": current_symptoms,
        "decision": decision
    })
    
    return decision
```

**Customer Service Example**:

```python
# ❌ Stateless - Each interaction isolated
def resolve_complaint(complaint):
    return llm_respond(f"Customer complains: {complaint}. How to resolve?")

# ✅ Stateful - Relationship management
def handle_customer_issue(issue):
    context = f"""
    Customer: {self.state.customer_id}
    
    Relationship history:
    - Customer for: {self.state.relationship_years} years
    - Lifetime value: ${self.state.customer_ltv}
    - Satisfaction trend: {self.state.satisfaction_history}
    
    Recent interactions:
    - {self.state.recent_interactions}
    
    Past issues and resolutions:
    - {self.state.past_issues}
    - What worked well: {self.state.successful_resolutions}
    - What they appreciated: {self.state.positive_feedback}
    
    Current issue:
    - {issue}
    
    This customer typically responds well to: {self.learned_preferences}
    
    Given our relationship and what I know about this customer,
    what's the best resolution approach?
    """
    
    resolution = llm_decide(context)
    
    # Update customer state
    self.state.recent_interactions.append({
        "date": now(),
        "issue": issue,
        "resolution": resolution,
        "outcome": "pending"
    })
    
    return resolution
```

---

**Key Takeaway**: Stateful actors build expertise over time by:
1. Maintaining context across interactions
2. Building and testing theories/beliefs
3. Learning from outcomes of past decisions
4. Applying accumulated knowledge to new situations
5. Continuously updating their understanding

This creates genuine expertise that improves with experience, rather than isolated decision-making that never learns.

---

### 6. **Context Window Optimization**

**Principle**: Each actor maintains minimal, focused context for its domain expertise.

**Token Budget Guidelines**:

| Actor Complexity | Context Size | Use Case |
|------------------|--------------|----------|
| **Simple Monitoring** | 1-5K tokens | Pure data processing, routing, state updates |
| **Specialized Analysis** | 8-15K tokens | Domain analysis, pattern recognition, evaluation |
| **Strategic Coordination** | 18-25K tokens | Multi-factor decisions, strategy, orchestration |
| **Complex Integration** | 25-40K tokens | Rare - multiple domains, broad oversight |

**Optimization Techniques**:

1. **Summarization Over Retention**

   ```python
   # ❌ BAD: Keep everything
   state = {
       "all_past_decisions": [...]  # 1000+ decisions
   }
   
   # ✅ GOOD: Keep recent + summary
   state = {
       "recent_decisions": [last_5_decisions],
       "decision_summary": "Overall: 67% success, learned X, Y, Z patterns"
   }
   ```

2. **Layered Detail**

   ```python
   # Current detail: Full
   "current_situation": {full_detail}
   
   # Recent: Medium detail
   "recent_events": [{summary_of_event}, ...]
   
   # Historical: Query via tool when needed
   tool_query_historical_pattern(filters)
   ```

3. **Active vs. Archived**

   ```python
   state = {
       "active_items": {...},      # Currently monitoring
       "recent_items": [...],      # Last 5
       "archived_count": 247       # Count only, query if needed
   }
   ```

4. **Computed Indicators Over Raw Data**

   ```python
   # ❌ BAD: All raw data
   state = {
       "all_measurements": [1.2, 1.3, 1.1, ...],  # 1000 values
   }
   
   # ✅ GOOD: Computed indicators
   state = {
       "current_value": 1.25,
       "trend": "increasing",
       "volatility": "low",
       "zscore": 0.8,
       "anomaly_flag": False
   }
   ```

---

### 7-10. [Additional Principles]

Due to length constraints, I'll summarize the remaining principles concisely:

### 7. **Tool Design for Complex Analysis**
- Tools return **insights**, not raw data
- Pre-computed, actionable, bounded outputs
- Domain-specific, called on-demand
- Five categories: Historical Query, Analytics, Simulation, External Data, Pattern Detection

### 8. **Reinforcement Learning Integration**
- Each actor's domain = RL training environment
- Track: State → Action → Outcome → Reward
- Multi-objective rewards for complex domains
- Offline training, A/B testing, gradual rollout
- Actor-specific learning in their specialty

### 9. **Inter-Actor Communication Protocol**
- Structured messages: type, priority, correlation_id, payload
- Asynchronous, traceable, prioritized
- Rich context in messages
- Clear timeout handling
- Message flow creates audit trail

### 10. **Actor Specialization Strategy**
- **Organize by expertise domain**, not by function
- Each actor becomes irreplaceable specialist
- Clear responsibility boundaries
- Natural RL environments
- Collective intelligence emerges from specialization

---

## Universal Design Patterns

### Pattern 1: **The Specialist**
- **Purpose**: Deep expertise in narrow domain
- **Example Domains**: Specific disease area (cardiology), specific legal area (contracts), specific product line
- **Characteristics**: Watches one thing intensely, learns specific patterns, develops intuition
- **State**: Current status in specialty, recent observations, active patterns
- **Tools**: Domain-specific analysis, historical pattern matching

### Pattern 2: **The Coordinator**
- **Purpose**: Strategic oversight, belief/theory maintenance
- **Example Domains**: Treatment plan coordination, case strategy, product roadmap
- **Characteristics**: Maintains working theories, coordinates specialists, makes strategic decisions
- **State**: Active beliefs/theories, recent strategic decisions, monitoring priorities
- **Tools**: Value calculation, simulation, strategic planning

### Pattern 3: **The Guardian**
- **Purpose**: Enforce constraints, manage risk, ensure compliance
- **Example Domains**: Safety monitoring, risk management, compliance checking
- **Characteristics**: Learns limits from experience, enforces rules, emergency response
- **State**: Current risk metrics, active concerns, recent violations
- **Tools**: Risk calculation, stress testing, compliance checking

### Pattern 4: **The Executor**
- **Purpose**: Optimize specific action execution
- **Example Domains**: Procedure execution, process optimization, delivery coordination
- **Characteristics**: Learns optimal tactics, microstructure expertise, quality metrics
- **State**: Active executions, current performance, immediate conditions
- **Tools**: Execution analytics, quality benchmarking, timing optimization

### Pattern 5: **The Integrator**
- **Purpose**: Synthesize information across domains
- **Example Domains**: Cross-functional coordination, multi-specialist synthesis
- **Characteristics**: Broad context awareness, pattern recognition across domains
- **State**: Multi-domain status, integration points, coordination needs
- **Tools**: Cross-domain analysis, dependency mapping, impact assessment

---

## Anti-Patterns to Avoid

### ❌ **Anti-Pattern 1: The God Actor**
**Problem**: Single actor trying to do everything

```
One actor for: Strategy + Analysis + Execution + Monitoring
```

**Issues**:
- Context window explosion
- No specialization depth
- Cannot learn effectively
- Single point of failure
- No collective intelligence

**Solution**: Decompose into specialized actors by domain

---

### ❌ **Anti-Pattern 2: The Orchestrator**
**Problem**: Actor that just routes messages without expertise

```python
def orchestrator(message):
    if message.type == "A":
        route_to_actor_1(message)
    elif message.type == "B":
        route_to_actor_2(message)
    # No accumulated state
    # No expertise development
    # Just a router
```

**Issues**:
- No meaningful state
- No learning opportunity
- Could be replaced by simple router
- Doesn't develop expertise

**Solution**: Replace with event dispatcher (deterministic) or give real expertise domain

---

### ❌ **Anti-Pattern 3: The Stateless Function**
**Problem**: Actor with no memory between invocations

```python
def decide(current_input):
    return llm_decide(f"What should I do with {current_input}?")
    # No memory of past
    # No accumulated knowledge
    # Each decision isolated
```

**Issues**:
- Cannot learn from experience
- No continuity across decisions
- Repeats same mistakes
- No expertise accumulation

**Solution**: Add state, maintain recent history, reference past outcomes

---

### ❌ **Anti-Pattern 4: The Data Dumper**
**Problem**: Tool that returns massive unprocessed data

```python
def get_all_history():
    return database.query("SELECT * FROM events")  # 100K records
    # Overwhelms context
    # Forces LLM to analyze
    # Inefficient
```

**Issues**:
- Context window explosion
- Expensive LLM processing
- Slow response
- No insight provided

**Solution**: Return pre-analyzed insights, bounded outputs

---

### ❌ **Anti-Pattern 5: Stats in State**
**Problem**: State bloated with statistics that should be in model

```python
state = {
    "win_rate": 0.67,              # → Should be in MODEL
    "average_outcome": 8.5,         # → Should be in MODEL
    "success_patterns": {...},      # → Should be in MODEL
    "historical_performance": [...] # → Query via TOOL
}
```

**Issues**:
- Wastes context window
- Doesn't improve with learning
- Should be in trained model
- Historical data should be tool-queried

**Solution**: State = current context, Model = learned patterns, Tools = historical queries

---

## Implementation Checklist

### Actor Design ✓
- [ ] Maps to persistent domain of expertise
- [ ] Has meaningful lifecycle and accumulation
- [ ] Clearly defined state (current context only)
- [ ] Specialized tools for domain
- [ ] Bounded context window (< 25K tokens)
- [ ] Clear RL training environment

### State Management ✓
- [ ] Current values and status only
- [ ] Recent memory (3-5 items)
- [ ] Active monitoring items
- [ ] Immediate beliefs/assessments
- [ ] No historical statistics
- [ ] No raw computed analytics

### Model Weights ✓
- [ ] Statistical patterns extracted
- [ ] Optimal parameters learned
- [ ] Policy functions trained
- [ ] Success predictors developed
- [ ] Separate from state
- [ ] Updatable through RL

### Tool Design ✓
- [ ] Returns insights, not raw data
- [ ] Pre-computed analysis
- [ ] Bounded output size
- [ ] Domain-specific
- [ ] On-demand only
- [ ] Clear documentation

### Event System ✓
- [ ] System-level triggers identified
- [ ] Agent-defined trigger capability
- [ ] Priority levels defined
- [ ] Routing logic clear
- [ ] Timeout handling
- [ ] Correlation tracking

### Workflows ✓
- [ ] Deterministic workflows documented
- [ ] LLM decision points identified
- [ ] Hybrid workflows designed
- [ ] Escalation paths clear
- [ ] Compliance verification
- [ ] Error handling defined

### Communication ✓
- [ ] Structured message format
- [ ] Priority scheme defined
- [ ] Correlation IDs used
- [ ] Rich context included
- [ ] Timeout expectations
- [ ] Audit trail maintained

### Learning ✓
- [ ] Trajectory collection system
- [ ] State-action-reward tracking
- [ ] Outcome association logic
- [ ] Multi-objective rewards
- [ ] Offline training pipeline
- [ ] A/B testing framework

---

## Success Metrics

### Per-Actor Metrics
- **Expertise Development**: Measurable improvement in domain decisions
- **Decision Quality**: Outcome success rate in specialty
- **Learning Rate**: Speed of improvement over time
- **Context Efficiency**: Value per token used
- **Response Quality**: Appropriate depth for domain

### System-Level Metrics
- **Collective Intelligence**: Capabilities beyond individual actors
- **Coordination Quality**: Multi-actor collaboration effectiveness
- **Communication Efficiency**: Message overhead vs. value
- **Resource Utilization**: Compute and token efficiency
- **Reliability**: System uptime and graceful degradation
- **Scalability**: Ability to add domains/capabilities

### Learning Metrics
- **Convergence Speed**: How quickly actors reach competence
- **Transfer Learning**: Knowledge sharing across similar domains
- **Adaptation Rate**: Response to domain changes
- **Failure Recovery**: Learning from mistakes
- **Policy Improvement**: Measurable gains from RL

---

## Summary: Universal Principles

1. **Actors = Expertise Domains** - Map to persistent specializations, not functions
2. **Three-Layer Architecture** - State (context) / Weights (learned) / Tools (on-demand)
3. **Two-Tier Events** - System (critical, mandatory) / Agent (strategic, dynamic)
4. **Hybrid Processing** - Deterministic for known, LLM for uncertain
5. **Stateful Decisions** - Accumulate context, reference history, learn from outcomes
6. **Optimized Context** - Minimal, focused, efficient token usage
7. **Insight Tools** - Pre-analyzed, actionable, bounded outputs
8. **RL Integration** - Every actor learns in their domain
9. **Structured Communication** - Clear protocols, rich context, traceability
10. **Specialization** - Deep domain expertise > broad shallow coverage

These principles enable building agentic systems that develop genuine collective intelligence through specialized, persistent expertise while maintaining efficient resource usage and clear learning pathways - applicable across healthcare, legal, finance, manufacturing, customer service, and any other complex domain.
