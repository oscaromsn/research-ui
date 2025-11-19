---
modified: 2025-11-04T07:44:44-03:00
---
# III. DESIGN PATTERNS

## A. Actor Specialization Patterns

These are **universal patterns** that apply across domains - from healthcare to legal to finance to manufacturing. Each pattern represents a distinct role that actors can play in a multi-agent system.

---

### 1. The Specialist

#### 1.1 Pattern Definition

**Purpose**: Deep expertise in a narrow, well-defined domain

**Core Characteristics**:
- **Watches one thing intensely**: Focuses on specific domain exclusively
- **Learns specific patterns**: Develops domain-specific pattern recognition
- **Develops domain intuition**: Builds "feel" for what works in specialty
- **Bounded expertise**: Clear scope prevents context overflow
- **Improves with experience**: Gets better at specialty over time

**When to Use**:
- Domain has distinct, learnable patterns
- Expertise accumulates through repetition
- Decisions require specialized knowledge
- Success metrics are domain-specific
- Multiple specialists needed for different domains

#### 1.2 State Structure

```typescript
type SpecialistState = {
  // Current domain focus
  current_focus: DomainEntity
  watching_since: DateTime
  
  // Domain status
  domain_metrics: {
    key_indicator_1: number
    key_indicator_2: number
    last_updated: DateTime
  }
  
  // Recent observations (domain-specific)
  recent_observations: Array<{
    date: DateTime
    observation: string
    significance: "low" | "medium" | "high"
    pattern_matched: Option<PatternId>
  }>  // Keep last 3-5
  
  // Active monitoring (domain-specific)
  watching: Map<ConcernId, {
    concern: string
    since: DateTime
    threshold: string
    action_if_triggered: string
  }>
  
  // Current domain assessment
  current_assessment: {
    status: string
    confidence: number
    concerns: string[]
    opportunities: string[]
  }
}
```

#### 1.3 Tool Set

Specialists use **domain-specific tools**:

1. **Historical Pattern Matching**

```typescript
find_similar_domain_cases(
  current_situation: Situation,
  domain_filters: DomainFilters
) -> SimilarCasesWithOutcomes
```

2. **Domain Analytics**

```typescript
analyze_domain_metrics(
  metrics: DomainMetrics,
  baseline: Baseline
) -> DomainAnalysis
```

3. **Domain Simulation**

```typescript
simulate_domain_intervention(
  current_state: State,
  intervention: Intervention
) -> ProjectedOutcome
```

#### 1.4 Domain Examples

**Healthcare: Cardiovascular Diagnosis Specialist**

```typescript
class CardiovascularSpecialistActor extends Entity {
  expertise: "Cardiovascular disease diagnosis and monitoring"
  
  state: {
    // Current patient being monitored
    patient_id: string
    monitoring_since: DateTime
    current_condition: "stable" | "declining" | "improving"
    
    // Cardiovascular-specific metrics
    current_vitals: {
      heart_rate: number
      blood_pressure: string
      ejection_fraction: number
      cardiac_output: number
    }
    
    // Recent cardiac observations
    recent_observations: [
      {
        date: "2025-11-03",
        observation: "ECG shows new ST elevation",
        significance: "high",
        pattern: "potential_mi_pattern"
      },
      {
        date: "2025-11-01",
        observation: "Troponin elevated",
        significance: "high",
        pattern: "cardiac_injury_marker"
      }
    ]
    
    // What watching for
    watching: {
      "arrhythmia_risk": {
        concern: "QT interval prolongation",
        since: "2025-11-01",
        threshold: "QTc > 500ms",
        action: "Notify care coordinator, consider medication change"
      }
    }
    
    // Current cardiac assessment
    current_assessment: {
      status: "Acute coronary syndrome suspected",
      confidence: 0.85,
      concerns: ["ST elevation", "Elevated troponin"],
      recommendations: ["Urgent cardiology consult", "Cardiac cath lab activation"]
    }
  }
  
  tools: {
    find_similar_cardiac_cases: ToolService
    calculate_cardiac_risk_scores: ToolService
    simulate_treatment_outcomes: ToolService
    detect_ecg_patterns: ToolService
  }
  
  model: {
    // Learned cardiovascular patterns
    symptom_pattern_classifier: TrainedModel  // MI vs angina vs other
    risk_stratification: TrainedModel          // TIMI, GRACE scores optimized
    diagnostic_strategy: PolicyNetwork         // Which tests to order when
  }
  
  handleMessage(msg: CardiacAssessment) {
    return Effect.gen(function* () {
      // Use cardiovascular expertise
      const patterns = this.model.symptom_pattern_classifier.predict(msg.symptoms)
      
      // Call cardiac-specific tools
      const similarCases = yield* this.tools.find_similar_cardiac_cases({
        symptoms: msg.symptoms,
        ecg_findings: msg.ecg,
        biomarkers: msg.labs
      })
      
      // Make specialist assessment
      const assessment = this.assessCardiacRisk(patterns, similarCases)
      
      // Update specialist state
      this.updateCardiacMonitoring(assessment)
      
      return assessment
    })
  }
}
```

**Legal: Case Law Research Specialist**

```typescript
class CaseLawResearcherActor extends Entity {
  expertise: "Case law research and jurisprudence analysis"
  
  state: {
    // Current research focus
    active_research: {
      matter_id: string
      legal_issue: string
      jurisdiction: Jurisdiction
      started: DateTime
    }
    
    // Research metrics
    research_metrics: {
      cases_reviewed: number
      relevant_cases_found: number
      citation_depth: number
      coverage_confidence: number
    }
    
    // Recent findings
    recent_findings: [
      {
        date: "2025-11-04",
        case: "Silva v. Santos, STJ 2023",
        relevance: 0.92,
        significance: "Binding precedent on key issue"
      },
      {
        date: "2025-11-03",
        case: "Costa v. Lima, STJ 2022",
        relevance: 0.78,
        significance: "Supporting precedent"
      }
    ]
    
    // Active search strategies
    watching: {
      "precedent_chain": {
        concern: "Need complete precedent chain to Supreme Court",
        since: "2025-11-02",
        threshold: "Find connecting cases",
        action: "Expand citation graph search"
      }
    }
    
    // Current research assessment
    current_assessment: {
      status: "Strong precedent found",
      confidence: 0.85,
      concerns: ["Need more recent cases", "Jurisdiction coverage incomplete"],
      opportunities: ["STJ pattern clear", "Can extend to TRF cases"]
    }
  }
  
  tools: {
    search_case_databases: ToolService       // DataJud, JusBrasil
    analyze_citation_network: ToolService     // Find precedent chains
    compare_jurisdictional_approaches: ToolService
    extract_legal_principles: ToolService
  }
  
  model: {
    // Learned case law patterns
    relevance_classifier: TrainedModel        // Which cases matter
    citation_importance: TrainedModel         // Authority weighting
    search_strategy_policy: PolicyNetwork     // Optimal search approach
  }
  
  handleMessage(msg: ResearchRequest) {
    return Effect.gen(function* () {
      // Use case law expertise to select strategy
      const strategy = this.selectOptimalSearchStrategy(
        msg.legal_issue,
        msg.jurisdiction,
        this.state.research_metrics
      )
      
      // Execute research using specialist tools
      const cases = yield* this.tools.search_case_databases(strategy)
      
      // Analyze with specialist model
      const analysis = this.analyzeCaseLaw(cases)
      
      // Update research state
      this.updateResearchProgress(analysis)
      
      return analysis
    })
  }
}
```

**Finance: Portfolio Management Specialist**

```typescript
class PortfolioManagerActor extends Entity {
  expertise: "Investment portfolio strategy and optimization"
  
  state: {
    // Current portfolio
    portfolio_id: string
    managing_since: DateTime
    current_value: number
    
    // Portfolio metrics
    portfolio_metrics: {
      return_ytd: number
      volatility: number
      sharpe_ratio: number
      max_drawdown: number
    }
    
    // Recent portfolio events
    recent_events: [
      {
        date: "2025-11-04",
        event: "Rebalanced tech allocation",
        impact: "+0.5% to target weights",
        rationale: "Sector rotation signal"
      }
    ]
    
    // Active monitoring
    watching: {
      "tech_exposure": {
        concern: "Tech sector concentration rising",
        since: "2025-11-01",
        threshold: "Tech > 30% of portfolio",
        action: "Trim positions, rotate to value"
      }
    }
    
    // Current investment thesis
    current_thesis: {
      market_view: "Risk-on, growth favored",
      confidence: 0.75,
      key_factors: ["Fed pause", "Earnings growth", "Technical breakout"],
      positions: "Overweight tech, underweight bonds"
    }
  }
  
  tools: {
    analyze_portfolio_risk: ToolService
    simulate_rebalancing_scenarios: ToolService
    find_comparable_portfolios: ToolService
    calculate_optimal_allocation: ToolService
  }
  
  model: {
    // Learned investment patterns
    market_regime_classifier: TrainedModel
    risk_optimizer: TrainedModel
    rebalancing_policy: PolicyNetwork
  }
}
```

**Manufacturing: Quality Control Specialist**

```typescript
class QualityEngineerActor extends Entity {
  expertise: "Product quality analysis and defect prevention"
  
  state: {
    // Current monitoring
    production_line: string
    monitoring_since: DateTime
    shift: string
    
    // Quality metrics
    quality_metrics: {
      defect_rate: number
      yield: number
      first_pass_yield: number
      rework_rate: number
    }
    
    // Recent quality events
    recent_observations: [
      {
        date: "2025-11-04T14:30",
        observation: "Defect rate spike to 0.05",
        significance: "high",
        pattern: "temperature_correlation"
      }
    ]
    
    // Active monitoring
    watching: {
      "machine_3_vibration": {
        concern: "Vibration amplitude increasing",
        since: "2025-11-04T14:00",
        threshold: "amplitude > 50mm/s",
        action: "Stop line, inspect bearings"
      }
    }
    
    // Current quality assessment
    current_assessment: {
      status: "Abnormal pattern detected",
      confidence: 0.80,
      concerns: ["Temperature correlation", "Machine 3 degradation"],
      actions: ["Adjust cooling", "Schedule machine inspection"]
    }
  }
  
  tools: {
    analyze_defect_patterns: ToolService
    correlate_process_parameters: ToolService
    simulate_parameter_changes: ToolService
    find_similar_quality_issues: ToolService
  }
  
  model: {
    // Learned quality patterns
    defect_predictor: TrainedModel
    root_cause_classifier: TrainedModel
    parameter_optimization: PolicyNetwork
  }
}
```

#### 1.5 Success Metrics

Specialists are measured by **domain-specific success**:

```yaml
specialist_metrics:
  expertise_depth:
    - "Accuracy in domain predictions"
    - "Speed to correct assessment"
    - "False positive/negative rates"
    
  learning_rate:
    - "Improvement over time in domain"
    - "Adaptation to domain changes"
    - "Pattern recognition accuracy growth"
    
  domain_coverage:
    - "Breadth of domain knowledge"
    - "Edge case handling"
    - "Novel situation adaptation"
    
  collaboration_quality:
    - "Quality of insights provided to coordinators"
    - "Timeliness of specialist input"
    - "Clarity of recommendations"
```

---

### 2. The Coordinator

#### 2.1 Pattern Definition

**Purpose**: Strategic oversight, belief/theory maintenance, and multi-specialist coordination

**Core Characteristics**:
- **Maintains working theories**: Develops and tests strategic hypotheses
- **Coordinates specialists**: Orchestrates multiple specialist actors
- **Makes strategic decisions**: High-level choices affecting overall direction
- **Synthesizes perspectives**: Integrates insights from multiple domains
- **Long-term context**: Maintains broader context than specialists

**When to Use**:
- Multiple specialists need coordination
- Strategic decisions require synthesis
- Long-term planning and adaptation needed
- Theories/beliefs evolve over time
- High-level goals must be maintained

#### 2.2 State Structure

```typescript
type CoordinatorState = {
  // Entity being coordinated
  entity_id: string
  entity_type: string
  coordinating_since: DateTime
  
  // Active theories/beliefs
  active_theories: Map<Domain, {
    theory: string
    conviction_strength: number
    supporting_evidence: string[]
    contradicting_evidence: string[]
    last_updated: DateTime
  }>
  
  // Strategic decisions
  recent_strategic_decisions: Array<{
    date: DateTime
    decision: string
    rationale: string
    expected_outcome: string
    status: "monitoring" | "succeeded" | "failed"
  }>
  
  // Specialist coordination
  active_specialists: Map<SpecialistId, {
    specialist_type: string
    current_task: Option<TaskId>
    last_report: DateTime
    confidence_in_specialist: number
  }>
  
  // Monitoring priorities
  strategic_priorities: Array<{
    priority: string
    importance: "critical" | "high" | "medium"
    owner: Option<SpecialistId>
    target_date: DateTime
    status: string
  }>
  
  // Overall assessment
  overall_status: {
    assessment: string
    confidence: number
    key_risks: string[]
    key_opportunities: string[]
    next_major_decision: string
  }
}
```

#### 2.3 Tool Set

Coordinators use **synthesis and strategy tools**:

1. **Value Calculation**

```typescript
calculate_strategic_value(
  options: Array<Option>,
  context: Context,
  time_horizon: Duration
) -> ValueAnalysis
```

2. **Scenario Simulation**

```typescript
simulate_strategic_scenarios(
  current_state: State,
  strategies: Array<Strategy>,
  variables: Variables
) -> ScenarioOutcomes
```

3. **Multi-Domain Synthesis**

```typescript
synthesize_specialist_inputs(
  specialist_reports: Map<SpecialistId, Report>,
  decision_context: Context
) -> SynthesizedRecommendation
```

4. **Strategic Planning**

```typescript
develop_strategic_plan(
  goals: Goals,
  constraints: Constraints,
  resources: Resources
) -> StrategicPlan
```

#### 2.4 Domain Examples

**Healthcare: Patient Care Coordinator**

```typescript
class PatientCareCoordinatorActor extends Entity {
  expertise: "Overall patient care strategy and multi-specialist coordination"
  
  state: {
    // Patient identity
    patient_id: string
    relationship_since: DateTime
    patient_profile: {
      age: number
      conditions: string[]
      preferences: PatientPreferences
    }
    
    // Active treatment theories
    active_theories: {
      "diabetes_management": {
        theory: "Lifestyle + medication achieving control",
        conviction: 0.80,
        supporting_evidence: [
          "A1C decreased from 8.2% to 7.1%",
          "Weight loss of 12 lbs",
          "Improved medication adherence"
        ],
        contradicting_evidence: [
          "3 hypoglycemia episodes (may be over-medicated)"
        ],
        last_updated: "2025-11-04"
      },
      "hypertension_control": {
        theory: "Current medication adequate",
        conviction: 0.90,
        supporting_evidence: ["BP consistently 130/85", "No side effects"],
        contradicting_evidence: [],
        last_updated: "2025-11-01"
      }
    }
    
    // Strategic decisions
    recent_strategic_decisions: [
      {
        date: "2025-10-20",
        decision: "Increase Metformin to 1000mg BID",
        rationale: "A1C still above target, tolerating current dose well",
        expected_outcome: "A1C reduction to < 7.0% in 3 months",
        status: "monitoring"
      }
    ]
    
    // Specialist coordination
    active_specialists: {
      "cardiovascular_specialist": {
        specialist_type: "Cardiology",
        current_task: Some("Monitor cardiac risk factors"),
        last_report: "2025-11-03",
        confidence: 0.85
      },
      "endocrine_specialist": {
        specialist_type: "Endocrinology",
        current_task: Some("Optimize diabetes management"),
        last_report: "2025-11-02",
        confidence: 0.90
      }
    }
    
    // Strategic priorities
    strategic_priorities: [
      {
        priority: "Achieve diabetes control (A1C < 7.0%)",
        importance: "critical",
        owner: Some("endocrine_specialist"),
        target_date: "2026-02-01",
        status: "on_track"
      },
      {
        priority: "Prevent cardiovascular complications",
        importance: "high",
        owner: Some("cardiovascular_specialist"),
        target_date: "ongoing",
        status: "stable"
      }
    ]
    
    // Overall patient status
    overall_status: {
      assessment: "Improving, diabetes management on track",
      confidence: 0.85,
      key_risks: ["Hypoglycemia episodes suggest over-medication"],
      key_opportunities: ["Patient motivated, good adherence"],
      next_major_decision: "Consider reducing Metformin if hypoglycemia continues"
    }
  }
  
  tools: {
    calculate_treatment_value: ToolService       // Risk-benefit analysis
    simulate_treatment_scenarios: ToolService    // What-if modeling
    synthesize_specialist_reports: ToolService   // Multi-domain integration
    develop_care_plan: ToolService              // Strategic planning
  }
  
  model: {
    // Learned coordination patterns
    treatment_strategy_selector: TrainedModel
    specialist_coordination_policy: PolicyNetwork
    outcome_predictor: TrainedModel
  }
  
  handleMessage(msg: CoordinationMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "SpecialistReport") {
        // Receive report from specialist
        const specialist = this.state.active_specialists.get(msg.specialist_id)
        
        // Update theory based on specialist input
        yield* this.updateTheory(msg.domain, msg.findings)
        
        // Determine if strategic decision needed
        const decision_needed = this.assessStrategicDecisionNeeded()
        
        if (decision_needed) {
          // Synthesize all specialist inputs
          const synthesis = yield* this.tools.synthesize_specialist_reports({
            reports: this.getAllRecentReports(),
            decision_context: decision_needed.context
          })
          
          // Make strategic decision
          const decision = this.makeStrategicDecision(synthesis)
          
          // Coordinate specialists for execution
          yield* this.coordinateSpecialists(decision)
        }
      }
      
      if (msg._tag === "NewGoal") {
        // Develop strategy for new goal
        const plan = yield* this.tools.develop_care_plan({
          current_state: this.state,
          new_goal: msg.goal,
          available_specialists: this.state.active_specialists
        })
        
        // Assign to specialists
        yield* this.assignStrategicPlan(plan)
      }
    })
  }
  
  private updateTheory(domain: string, findings: Findings) {
    return Effect.gen(function* () {
      const theory = this.state.active_theories.get(domain)
      
      if (findings.supports_theory) {
        theory.supporting_evidence.push(findings.evidence)
        theory.conviction = Math.min(theory.conviction + 0.05, 1.0)
      } else {
        theory.contradicting_evidence.push(findings.evidence)
        theory.conviction = Math.max(theory.conviction - 0.10, 0.0)
      }
      
      // If conviction drops too low, revise theory
      if (theory.conviction < 0.5) {
        yield* this.reviseTheory(domain, theory)
      }
    })
  }
}
```

**Legal: Case Strategy Coordinator**

```typescript
class CaseStrategyCoordinatorActor extends Entity {
  expertise: "Overall case strategy and legal team coordination"
  
  state: {
    // Case identity
    case_id: string
    matter_id: string
    coordinating_since: DateTime
    case_type: "litigation" | "transactional" | "advisory"
    
    // Active legal theories
    active_theories: {
      "case_theory": {
        theory: "Fundamental breach under CISG Article 25",
        conviction: 0.75,
        supporting_evidence: [
          "STJ precedent on point",
          "Clear failure to deliver substantially",
          "Foreseeable harm to buyer"
        ],
        contradicting_evidence: [
          "Defendant will argue minor defect",
          "Opportunity to cure was provided"
        ],
        last_updated: "2025-11-04"
      },
      "damages_theory": {
        theory: "Cover damages plus consequential",
        conviction: 0.70,
        supporting_evidence: ["Market prices documented", "Lost profits calculable"],
        contradicting_evidence: ["Some mitigation questions"],
        last_updated: "2025-11-03"
      }
    }
    
    // Strategic decisions
    recent_strategic_decisions: [
      {
        date: "2025-11-02",
        decision: "File motion for summary judgment",
        rationale: "Strong precedent, facts undisputed",
        expected_outcome: "Judgment on liability, trial on damages only",
        status: "monitoring"
      }
    ]
    
    // Legal team coordination
    active_specialists: {
      "case_law_researcher": {
        specialist_type: "Research",
        current_task: Some("Complete precedent chain"),
        last_report: "2025-11-04",
        confidence: 0.90
      },
      "treaty_interpreter": {
        specialist_type: "International Law",
        current_task: Some("Vienna Convention analysis"),
        last_report: "2025-11-03",
        confidence: 0.85
      }
    }
    
    // Strategic priorities
    strategic_priorities: [
      {
        priority: "Establish liability via summary judgment",
        importance: "critical",
        owner: Some("case_law_researcher"),
        target_date: "2025-12-15",
        status: "on_track"
      },
      {
        priority: "Quantify and prove damages",
        importance: "high",
        owner: None,
        target_date: "2026-03-01",
        status: "pending"
      }
    ]
    
    // Overall case assessment
    overall_status: {
      assessment: "Strong liability case, damages need work",
      confidence: 0.75,
      key_risks: ["Defendant's cure argument", "Damages proof gaps"],
      key_opportunities: ["Summary judgment possible", "Settlement leverage high"],
      next_major_decision: "Settlement negotiation timing"
    }
  }
  
  tools: {
    calculate_case_value: ToolService
    simulate_litigation_outcomes: ToolService
    synthesize_legal_analysis: ToolService
    develop_litigation_strategy: ToolService
  }
  
  model: {
    case_outcome_predictor: TrainedModel
    settlement_timing_optimizer: PolicyNetwork
    strategy_selector: TrainedModel
  }
}
```

**Finance: Investment Strategy Coordinator**

```typescript
class InvestmentStrategyCoordinatorActor extends Entity {
  expertise: "Overall portfolio strategy and multi-asset coordination"
  
  state: {
    // Portfolio identity
    portfolio_id: string
    client_id: string
    managing_since: DateTime
    
    // Active investment thesis
    active_theories: {
      "market_regime": {
        theory: "Bull market continuation, growth favored",
        conviction: 0.75,
        supporting_evidence: ["Fed pause", "Earnings growth", "Technical breakout"],
        contradicting_evidence: ["Valuation stretched", "Sentiment extreme"],
        last_updated: "2025-11-04"
      },
      "sector_rotation": {
        theory: "Technology leadership persisting",
        conviction: 0.70,
        supporting_evidence: ["AI adoption", "Relative strength"],
        contradicting_evidence: ["Concentration risk", "Regulatory concerns"],
        last_updated: "2025-11-02"
      }
    }
    
    // Strategic decisions
    recent_strategic_decisions: [
      {
        date: "2025-11-01",
        decision: "Increase tech allocation to 28%",
        rationale: "Momentum strong, thesis intact",
        expected_outcome: "Outperformance vs benchmark",
        status: "monitoring"
      }
    ]
    
    // Specialist coordination
    active_specialists: {
      "equity_portfolio_manager": {
        specialist_type: "Equities",
        current_task: Some("Sector rotation execution"),
        last_report: "2025-11-04",
        confidence: 0.85
      },
      "risk_manager": {
        specialist_type: "Risk",
        current_task: Some("Concentration monitoring"),
        last_report: "2025-11-04",
        confidence: 0.90
      }
    }
    
    // Strategic priorities
    strategic_priorities: [
      {
        priority: "Maintain risk-adjusted returns",
        importance: "critical",
        owner: Some("equity_portfolio_manager"),
        target_date: "ongoing",
        status: "on_track"
      },
      {
        priority: "Manage concentration risk",
        importance: "high",
        owner: Some("risk_manager"),
        target_date: "ongoing",
        status: "requires_attention"
      }
    ]
    
    // Overall portfolio assessment
    overall_status: {
      assessment: "Strong performance, managing concentration",
      confidence: 0.80,
      key_risks: ["Tech concentration", "Market sentiment extreme"],
      key_opportunities: ["Momentum strong", "Earnings supportive"],
      next_major_decision: "Tech position sizing"
    }
  }
}
```

#### 2.5 Success Metrics

Coordinators are measured by **strategic success**:

```yaml
coordinator_metrics:
  strategic_quality:
    - "Alignment of decisions with goals"
    - "Theory accuracy and adaptation"
    - "Anticipation of major changes"
    
  coordination_effectiveness:
    - "Specialist utilization efficiency"
    - "Information synthesis quality"
    - "Decision timeliness"
    
  outcome_achievement:
    - "Goal attainment rate"
    - "Risk mitigation effectiveness"
    - "Opportunity capture rate"
    
  learning_adaptation:
    - "Theory revision appropriateness"
    - "Strategy improvement over time"
    - "Response to surprises"
```

---

### 3. The Guardian

#### 3.1 Pattern Definition

**Purpose**: Enforce constraints, manage risk, and ensure compliance

**Core Characteristics**:
- **Learns limits from experience**: Discovers optimal boundaries through observation
- **Enforces rules**: Ensures constraints are not violated
- **Emergency response**: Reacts immediately to critical situations
- **Risk monitoring**: Continuously assesses risk levels
- **Compliance verification**: Validates adherence to requirements

**When to Use**:
- Safety-critical systems
- Regulatory compliance required
- Risk management essential
- Resource constraints must be enforced
- Emergency response needed

#### 3.2 State Structure

```typescript
type GuardianState = {
  // What being guarded
  protected_entity: EntityId
  guarding_since: DateTime
  guard_type: "safety" | "compliance" | "risk" | "resource"
  
  // Current risk status
  risk_metrics: {
    overall_risk_level: "low" | "medium" | "high" | "critical"
    risk_score: number
    last_assessment: DateTime
  }
  
  // Recent violations/incidents
  recent_incidents: Array<{
    date: DateTime
    type: string
    severity: "minor" | "moderate" | "severe" | "critical"
    resolution: string
    prevention_added: boolean
  }>
  
  // Active concerns
  active_concerns: Map<ConcernId, {
    concern: string
    risk_level: string
    watching_since: DateTime
    threshold: string
    escalation_policy: string
  }>
  
  // Enforcement state
  current_enforcement: {
    active_restrictions: string[]
    pending_violations: string[]
    escalated_issues: string[]
  }
  
  // Learned limits
  learned_boundaries: Map<Metric, {
    soft_limit: number
    hard_limit: number
    learned_from: number  // observation count
    confidence: number
  }>
}
```

#### 3.3 Tool Set

Guardians use **risk and compliance tools**:

1. **Risk Calculation**

```typescript
calculate_comprehensive_risk(
  current_state: State,
  context: Context,
  risk_factors: RiskFactors
) -> RiskAssessment
```

2. **Stress Testing**

```typescript
stress_test_system(
  current_configuration: Config,
  stress_scenarios: Array<Scenario>
) -> StressTestResults
```

3. **Compliance Checking**

```typescript
verify_compliance(
  actions: Array<Action>,
  requirements: Requirements
) -> ComplianceReport
```

4. **Boundary Learning**

```typescript
analyze_safe_operating_envelope(
  historical_data: Data,
  incidents: Array<Incident>
) -> SafeOperatingLimits
```

#### 3.4 Domain Examples

**Healthcare: Patient Safety Guardian**

```typescript
class PatientSafetyGuardianActor extends Entity {
  expertise: "Patient safety monitoring and critical intervention"
  
  state: {
    // Patient being guarded
    patient_id: string
    guarding_since: DateTime
    guard_type: "safety"
    
    // Current safety status
    risk_metrics: {
      overall_risk_level: "medium",
      risk_score: 65,
      last_assessment: "2025-11-04T15:30:00Z"
    }
    
    // Recent safety incidents
    recent_incidents: [
      {
        date: "2025-11-01",
        type: "Medication error - wrong dose",
        severity: "moderate",
        resolution: "Corrected immediately, patient monitored",
        prevention_added: true
      }
    ]
    
    // Active safety concerns
    active_concerns: {
      "fall_risk": {
        concern: "Patient has fall risk factors",
        risk_level: "high",
        watching_since: "2025-10-28",
        threshold: "Any fall incident",
        escalation_policy: "Immediate assessment, restraints if needed"
      },
      "drug_interaction": {
        concern: "New medication added with interaction potential",
        risk_level: "medium",
        watching_since: "2025-11-03",
        threshold: "Signs of adverse reaction",
        escalation_policy: "Stop medication, notify physician"
      }
    }
    
    // Current enforcement
    current_enforcement: {
      active_restrictions: [
        "Bed exit alarm enabled",
        "Fall precautions in place"
      ],
      pending_violations: [],
      escalated_issues: []
    }
    
    // Learned safety boundaries
    learned_boundaries: {
      "systolic_bp": {
        soft_limit: 160,
        hard_limit: 180,
        learned_from: 247,  // observations
        confidence: 0.92
      },
      "heart_rate": {
        soft_limit: 110,
        hard_limit: 130,
        learned_from: 247,
        confidence: 0.95
      }
    }
  }
  
  tools: {
    calculate_patient_risk: ToolService
    check_drug_interactions: ToolService
    verify_safety_protocols: ToolService
    analyze_incident_patterns: ToolService
  }
  
  model: {
    risk_predictor: TrainedModel           // Predict adverse events
    boundary_optimizer: TrainedModel        // Optimal safety limits
    incident_classifier: TrainedModel       // Incident severity assessment
  }
  
  handleMessage(msg: SafetyMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "VitalSignUpdate") {
        // Check against learned boundaries
        const violation = this.checkBoundaries(msg.vitals)
        
        if (violation.severity === "critical") {
          // Immediate action
          yield* this.triggerEmergencyResponse(violation)
        } else if (violation.severity === "warning") {
          // Escalate to care coordinator
          yield* this.escalateConcern(violation)
        }
        
        // Update risk assessment
        yield* this.updateRiskMetrics(msg.vitals)
      }
      
      if (msg._tag === "MedicationOrder") {
        // Check for interactions
        const interactions = yield* this.tools.check_drug_interactions({
          new_medication: msg.medication,
          current_medications: this.getCurrentMedications()
        })
        
        if (interactions.severity === "contraindicated") {
          // Block order
          return { allowed: false, reason: interactions.reason }
        } else if (interactions.severity === "warning") {
          // Allow but escalate
          yield* this.escalateForReview(interactions)
          return { allowed: true, requires_review: true }
        }
      }
    })
  }
  
  private checkBoundaries(vitals: Vitals): Violation {
    // Use learned boundaries
    for (const [metric, limits] of this.state.learned_boundaries) {
      if (vitals[metric] > limits.hard_limit) {
        return {
          metric,
          value: vitals[metric],
          limit: limits.hard_limit,
          severity: "critical"
        }
      } else if (vitals[metric] > limits.soft_limit) {
        return {
          metric,
          value: vitals[metric],
          limit: limits.soft_limit,
          severity: "warning"
        }
      }
    }
    return { severity: "none" }
  }
}
```

**Manufacturing: Safety Compliance Guardian**

```typescript
class SafetyComplianceGuardianActor extends Entity {
  expertise: "Manufacturing safety and regulatory compliance"
  
  state: {
    // Facility being guarded
    facility_id: string
    production_line: string
    guarding_since: DateTime
    
    // Safety status
    risk_metrics: {
      overall_risk_level: "low",
      risk_score: 25,
      last_safety_audit: "2025-10-15"
    }
    
    // Recent incidents
    recent_incidents: [
      {
        date: "2025-10-20",
        type: "Near-miss - operator proximity alarm",
        severity: "minor",
        resolution: "Additional training provided",
        prevention_added: true
      }
    ]
    
    // Active safety concerns
    active_concerns: {
      "machine_guard_status": {
        concern: "Machine 3 guard sensor intermittent",
        risk_level: "medium",
        watching_since: "2025-11-02",
        threshold: "Any guard open while machine running",
        escalation_policy: "Emergency stop, lockout/tagout"
      }
    }
    
    // Enforcement
    current_enforcement: {
      active_restrictions: [
        "Machine 3 reduced speed until guard sensor replaced"
      ],
      pending_violations: [],
      escalated_issues: ["Guard sensor replacement overdue"]
    }
    
    // Learned safety boundaries
    learned_boundaries: {
      "noise_level_dbA": {
        soft_limit: 85,
        hard_limit: 90,
        learned_from: 1247,
        confidence: 0.98
      },
      "temperature_celsius": {
        soft_limit: 40,
        hard_limit: 45,
        learned_from: 1247,
        confidence: 0.95
      }
    }
  }
  
  tools: {
    assess_safety_risk: ToolService
    verify_compliance_status: ToolService
    simulate_hazard_scenarios: ToolService
    analyze_incident_trends: ToolService
  }
  
  model: {
    hazard_predictor: TrainedModel
    compliance_checker: TrainedModel
    incident_severity_classifier: TrainedModel
  }
}
```

**Finance: Risk Management Guardian**

```typescript
class RiskManagementGuardianActor extends Entity {
  expertise: "Portfolio risk limits and regulatory compliance"
  
  state: {
    // Portfolio being guarded
    portfolio_id: string
    fund_type: string
    guarding_since: DateTime
    
    // Risk status
    risk_metrics: {
      overall_risk_level: "medium",
      var_95: 2.5,  // % of portfolio
      max_drawdown: 8.2,
      leverage_ratio: 1.3,
      last_assessment: "2025-11-04T16:00:00Z"
    }
    
    // Recent risk events
    recent_incidents: [
      {
        date: "2025-10-28",
        type: "Concentration limit breach - Tech 31%",
        severity: "moderate",
        resolution: "Position trimmed to 28%",
        prevention_added: true
      }
    ]
    
    // Active risk concerns
    active_concerns: {
      "sector_concentration": {
        concern: "Tech sector approaching limit again",
        risk_level: "medium",
        watching_since: "2025-11-04",
        threshold: "Tech > 30%",
        escalation_policy: "Mandatory rebalance within 2 days"
      },
      "volatility_spike": {
        concern: "Portfolio vol increased 20%",
        risk_level: "low",
        watching_since: "2025-11-03",
        threshold: "Vol > 15%",
        escalation_policy: "Reduce risk exposures"
      }
    }
    
    // Enforcement
    current_enforcement: {
      active_restrictions: [
        "No new concentrated positions",
        "Leverage capped at 1.5x"
      ],
      pending_violations: [],
      escalated_issues: []
    }
    
    // Learned risk boundaries
    learned_boundaries: {
      "sector_concentration_pct": {
        soft_limit: 28,
        hard_limit: 30,
        learned_from: 680,  // trading days
        confidence: 0.90
      },
      "daily_var_pct": {
        soft_limit: 2.5,
        hard_limit: 3.0,
        learned_from: 680,
        confidence: 0.92
      }
    }
  }
  
  tools: {
    calculate_portfolio_risk: ToolService
    stress_test_portfolio: ToolService
    check_regulatory_compliance: ToolService
    analyze_risk_incidents: ToolService
  }
  
  model: {
    risk_forecaster: TrainedModel
    limit_optimizer: TrainedModel           // Learn optimal risk limits
    breach_predictor: TrainedModel
  }
  
  handleMessage(msg: RiskMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "PortfolioUpdate") {
        // Check all risk limits
        const violations = this.checkRiskLimits(msg.portfolio_state)
        
        for (const violation of violations) {
          if (violation.severity === "hard_limit") {
            // Block further risk-increasing trades
            yield* this.enforceRiskReduction(violation)
          } else if (violation.severity === "soft_limit") {
            // Warning to portfolio manager
            yield* this.escalateRiskConcern(violation)
          }
        }
        
        // Update risk metrics
        yield* this.updateRiskAssessment(msg.portfolio_state)
      }
      
      if (msg._tag === "TradeProposal") {
        // Pre-trade compliance check
        const compliance = yield* this.tools.check_regulatory_compliance({
          current_portfolio: this.getPortfolioState(),
          proposed_trade: msg.trade
        })
        
        if (!compliance.allowed) {
          return { approved: false, reason: compliance.violation }
        }
        
        // Risk impact check
        const risk_impact = yield* this.assessTradeRiskImpact(msg.trade)
        
        if (risk_impact.exceeds_limits) {
          return { approved: false, reason: "Risk limit breach" }
        }
        
        return { approved: true }
      }
    })
  }
}
```

#### 3.5 Success Metrics

Guardians are measured by **protection effectiveness**:

```yaml
guardian_metrics:
  incident_prevention:
    - "Critical incidents prevented"
    - "Violations caught before impact"
    - "Early warning accuracy"
    
  response_effectiveness:
    - "Response time to violations"
    - "Escalation appropriateness"
    - "Resolution success rate"
    
  boundary_learning:
    - "Limit optimization quality"
    - "False alarm rate reduction"
    - "Boundary confidence improvement"
    
  compliance_maintenance:
    - "Compliance violation rate"
    - "Audit success rate"
    - "Regulatory satisfaction"
```

---

### 4. The Executor

#### 4.1 Pattern Definition

**Purpose**: Optimize specific action execution

**Core Characteristics**:
- **Learns optimal tactics**: Discovers best execution approaches
- **Microstructure expertise**: Understands fine-grained execution details
- **Quality metrics**: Optimizes for execution quality
- **Performance optimization**: Continuously improves execution efficiency
- **Operational focus**: Concerned with "how" not "what"

**When to Use**:
- Execution quality matters significantly
- Tactical optimization provides value
- Microstructure patterns exist
- Performance can be learned
- Operational efficiency critical

#### 4.2 State Structure

```typescript
type ExecutorState = {
  // What being executed
  execution_domain: string
  active_since: DateTime
  
  // Current execution context
  current_executions: Map<ExecutionId, {
    task: Task
    started: DateTime
    status: "pending" | "executing" | "completed" | "failed"
    progress: number
    quality_score: Option<number>
  }>
  
  // Performance metrics
  performance_metrics: {
    success_rate: number
    average_quality: number
    average_duration: Duration
    throughput: number
    error_rate: number
  }
  
  // Recent executions (for learning)
  recent_executions: Array<{
    date: DateTime
    task_type: string
    approach_used: string
    outcome: "success" | "failure"
    quality: number
    duration: Duration
    learned_from: boolean
  }>
  
  // Current conditions
  execution_conditions: {
    resource_availability: "high" | "medium" | "low"
    system_load: number
    quality_of_inputs: number
    environmental_factors: Map<string, any>
  }
  
  // Learned tactics
  learned_tactics: Map<TaskType, {
    optimal_approach: string
    success_rate: number
    average_quality: number
    conditions: ConditionSet
    confidence: number
  }>
}
```

#### 4.3 Tool Set

Executors use **performance and optimization tools**:

1. **Execution Analytics**

```typescript
analyze_execution_performance(
  historical_executions: Array<Execution>,
  task_type: string
) -> PerformanceAnalysis
```

2. **Quality Benchmarking**

```typescript
benchmark_execution_quality(
  execution: Execution,
  standards: QualityStandards
) -> QualityAssessment
```

3. **Timing Optimization**

```typescript
optimize_execution_timing(
  task: Task,
  constraints: Constraints,
  market_conditions: Conditions
) -> OptimalTiming
```

4. **Approach Selection**

```typescript
recommend_execution_approach(
  task: Task,
  current_conditions: Conditions,
  historical_performance: Performance
) -> RecommendedApproach
```

#### 4.4 Domain Examples

**Healthcare: Procedure Execution Specialist**

```typescript
class ProcedureExecutionActor extends Entity {
  expertise: "Optimal clinical procedure execution"
  
  state: {
    // Execution domain
    execution_domain: "Surgical procedures",
    active_since: "2025-01-01",
    
    // Current procedures
    current_executions: {
      "proc-001": {
        task: "Laparoscopic appendectomy",
        started: "2025-11-04T14:00:00Z",
        status: "executing",
        progress: 0.6,
        quality_score: None
      }
    }
    
    // Performance metrics
    performance_metrics: {
      success_rate: 0.98,
      average_quality: 9.2,  // out of 10
      average_duration: "45 minutes",
      throughput: 12,  // procedures per week
      error_rate: 0.02
    }
    
    // Recent executions
    recent_executions: [
      {
        date: "2025-11-03",
        task_type: "Laparoscopic cholecystectomy",
        approach_used: "three-port-technique",
        outcome: "success",
        quality: 9.5,
        duration: "38 minutes",
        learned_from: true
      }
    ]
    
    // Current conditions
    execution_conditions: {
      resource_availability: "high",
      system_load: 0.6,  // OR utilization
      quality_of_inputs: 0.9,  // patient prep, equipment
      environmental_factors: {
        "team_experience": "high",
        "equipment_status": "optimal"
      }
    }
    
    // Learned tactics
    learned_tactics: {
      "laparoscopic_appendectomy": {
        optimal_approach: "three-port-with-early-ligation",
        success_rate: 0.99,
        average_quality: 9.4,
        conditions: "standard_patient_anatomy",
        confidence: 0.95
      }
    }
  }
  
  tools: {
    analyze_procedure_outcomes: ToolService
    benchmark_technique_quality: ToolService
    optimize_procedure_timing: ToolService
    recommend_technique_variation: ToolService
  }
  
  model: {
    technique_selector: PolicyNetwork       // Which technique for which patient
    quality_predictor: TrainedModel        // Predict outcome quality
    timing_optimizer: TrainedModel         // Optimal procedure timing
  }
}
```

**Finance: Trade Execution Specialist**

```typescript
class TradeExecutionActor extends Entity {
  expertise: "Optimal order execution and market microstructure"
  
  state: {
    // Execution domain
    execution_domain: "Equity order execution",
    active_since: "2025-01-01",
    
    // Current executions
    current_executions: {
      "order-7890": {
        task: "Buy 50,000 shares AAPL",
        started: "2025-11-04T15:32:00Z",
        status: "executing",
        progress: 0.45,  // 22,500 shares filled
        quality_score: None  // Not yet complete
      }
    }
    
    // Performance metrics
    performance_metrics: {
      success_rate: 0.95,  // Fill rate
      average_quality: 8.7,  // Execution quality score
      average_duration: "12 minutes",
      throughput: 247,  // orders per day
      error_rate: 0.03
    }
    
    // Recent executions
    recent_executions: [
      {
        date: "2025-11-04T14:45:00Z",
        task_type: "Large buy order",
        approach_used: "VWAP-algo-with-opportunistic",
        outcome: "success",
        quality: 9.2,  // vs benchmark
        duration: "15 minutes",
        learned_from: true
      }
    ]
    
    // Current market conditions
    execution_conditions: {
      resource_availability: "high",  // Liquidity
      system_load: 0.7,  // Market activity
      quality_of_inputs: 0.85,  // Signal quality
      environmental_factors: {
        "spread_percentile": 0.3,  // Tight spreads
        "volatility_percentile": 0.6,  // Moderate vol
        "volume_profile": "above_average"
      }
    }
    
    // Learned tactics
    learned_tactics: {
      "large_buy_high_liquidity": {
        optimal_approach: "VWAP-with-opportunistic-fills",
        success_rate: 0.96,
        average_quality: 9.1,
        conditions: "spread < 5bps, volume > avg",
        confidence: 0.92
      },
      "large_buy_low_liquidity": {
        optimal_approach: "patient-limit-orders-with-iceberg",
        success_rate: 0.88,
        average_quality: 8.3,
        conditions: "spread > 10bps, volume < avg",
        confidence: 0.85
      }
    }
  }
  
  tools: {
    analyze_execution_quality: ToolService
    benchmark_against_vwap_twap: ToolService
    optimize_algo_parameters: ToolService
    forecast_liquidity_profile: ToolService
  }
  
  model: {
    algo_selector: PolicyNetwork            // Which algo for which order
    parameter_optimizer: TrainedModel       // Optimal algo parameters
    microstructure_predictor: TrainedModel  // Predict spread, depth
  }
  
  handleMessage(msg: ExecutionMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "NewOrder") {
        // Assess current market conditions
        const conditions = yield* this.assessMarketConditions()
        
        // Select optimal execution approach
        const approach = this.selectExecutionApproach(
          msg.order,
          conditions,
          this.state.learned_tactics
        )
        
        // Execute using learned tactics
        const execution = yield* this.executeOrder(msg.order, approach)
        
        // Monitor execution quality in real-time
        yield* this.monitorExecution(execution)
        
        return execution
      }
      
      if (msg._tag === "ExecutionComplete") {
        // Analyze execution quality
        const quality = yield* this.tools.analyze_execution_quality({
          execution: msg.execution,
          benchmark: "VWAP"
        })
        
        // Learn from this execution
        yield* this.learnFromExecution(msg.execution, quality)
        
        return quality
      }
    })
  }
  
  private selectExecutionApproach(
    order: Order,
    conditions: Conditions,
    tactics: LearnedTactics
  ): Approach {
    // Use learned tactics based on conditions
    const order_profile = this.classifyOrder(order, conditions)
    const tactic = tactics.get(order_profile)
    
    if (tactic && tactic.confidence > 0.8) {
      return tactic.optimal_approach
    } else {
      // Fall back to model prediction
      return this.model.algo_selector.predict({
        order,
        conditions
      })
    }
  }
}
```

**Manufacturing: Quality Execution Specialist**

```typescript
class QualityExecutionActor extends Entity {
  expertise: "Optimal production execution for quality"
  
  state: {
    // Execution domain
    execution_domain: "Production process execution",
    active_since: "2025-01-01",
    
    // Current production runs
    current_executions: {
      "batch-4527": {
        task: "Production run - Widget X",
        started: "2025-11-04T08:00:00Z",
        status: "executing",
        progress: 0.7,  // 70% complete
        quality_score: Some(0.98)  // Real-time quality
      }
    }
    
    // Performance metrics
    performance_metrics: {
      success_rate: 0.96,  // Batches meeting spec
      average_quality: 0.98,  // Yield rate
      average_duration: "4 hours",
      throughput: 250,  // units per hour
      error_rate: 0.02  // Defect rate
    }
    
    // Recent executions
    recent_executions: [
      {
        date: "2025-11-03",
        task_type: "Standard production run",
        approach_used: "optimized-parameters-set-3",
        outcome: "success",
        quality: 0.99,
        duration: "3.8 hours",
        learned_from: true
      }
    ]
    
    // Current conditions
    execution_conditions: {
      resource_availability: "high",
      system_load: 0.75,  // Line utilization
      quality_of_inputs: 0.95,  // Raw material quality
      environmental_factors: {
        "ambient_temperature": 22.5,
        "humidity": 0.45,
        "machine_warm_up_complete": true
      }
    }
    
    // Learned tactics
    learned_tactics: {
      "widget_x_standard_conditions": {
        optimal_approach: "parameter-set-3",
        success_rate: 0.98,
        average_quality: 0.99,
        conditions: "temp: 22-24C, humidity: 40-50%, fresh_material",
        confidence: 0.94
      },
      "widget_x_suboptimal_conditions": {
        optimal_approach: "parameter-set-conservative",
        success_rate: 0.94,
        average_quality: 0.97,
        conditions: "temp: outside_range OR old_material",
        confidence: 0.88
      }
    }
  }
  
  tools: {
    analyze_batch_quality: ToolService
    optimize_process_parameters: ToolService
    predict_yield: ToolService
    correlate_conditions_quality: ToolService
  }
  
  model: {
    parameter_optimizer: TrainedModel      // Optimal process parameters
    yield_predictor: TrainedModel         // Predict batch quality
    condition_classifier: TrainedModel     // Classify production conditions
  }
}
```

#### 4.5 Success Metrics

Executors are measured by **execution quality**:

```yaml
executor_metrics:
  execution_quality:
    - "Quality vs. benchmark"
    - "Success rate"
    - "Error/defect rate"
    
  efficiency:
    - "Throughput"
    - "Duration vs. target"
    - "Resource utilization"
    
  learning:
    - "Tactic effectiveness improvement"
    - "Adaptation to conditions"
    - "Parameter optimization gains"
    
  consistency:
    - "Quality variance"
    - "Performance stability"
    - "Predictability"
```

---

### 5. The Integrator

#### 5.1 Pattern Definition

**Purpose**: Synthesize information and coordinate across multiple domains

**Core Characteristics**:
- **Broad context awareness**: Understands multiple domains superficially
- **Cross-domain pattern recognition**: Identifies patterns spanning domains
- **Information synthesis**: Combines insights from diverse sources
- **Dependency management**: Tracks and manages interdependencies
- **Holistic perspective**: Sees system-level implications

**When to Use**:
- Multiple domains must be integrated
- Cross-domain dependencies exist
- System-level view required
- Information silos must be bridged
- Holistic decisions needed

#### 5.2 State Structure

```typescript
type IntegratorState = {
  // Integration scope
  integration_domains: string[]
  integrating_since: DateTime
  
  // Multi-domain status
  domain_states: Map<Domain, {
    last_update: DateTime
    status: string
    key_metrics: Map<string, number>
    concerns: string[]
  }>
  
  // Cross-domain patterns
  detected_patterns: Array<{
    pattern_type: string
    affected_domains: string[]
    significance: "low" | "medium" | "high"
    discovered: DateTime
    confidence: number
  }>
  
  // Integration points
  active_integration_points: Map<IntegrationId, {
    domains: [Domain, Domain]
    dependency_type: "requires" | "affects" | "conflicts"
    status: "healthy" | "stressed" | "broken"
    last_checked: DateTime
  }>
  
  // System-level assessment
  overall_system_status: {
    health: "healthy" | "degraded" | "critical"
    integration_quality: number
    key_risks: string[]
    opportunities: string[]
  }
  
  // Recent integrations
  recent_integration_activities: Array<{
    date: DateTime
    activity: string
    domains_involved: string[]
    outcome: string
  }>
}
```

#### 5.3 Tool Set

Integrators use **synthesis and dependency tools**:

1. **Cross-Domain Analysis**

```typescript
analyze_cross_domain_patterns(
  domain_data: Map<Domain, Data>,
  pattern_types: Array<PatternType>
) -> CrossDomainInsights
```

2. **Dependency Mapping**

```typescript
map_interdependencies(
  domains: Array<Domain>,
  relationship_types: Array<RelationType>
) -> DependencyGraph
```

3. **Impact Assessment**

```typescript
assess_cross_domain_impact(
  change: Change,
  source_domain: Domain,
  target_domains: Array<Domain>
) -> ImpactAnalysis
```

4. **System Health**

```typescript
evaluate_system_health(
  domain_states: Map<Domain, State>,
  integration_points: Array<IntegrationPoint>
) -> SystemHealthReport
```

#### 5.4 Domain Examples

**Healthcare: Care Integration Coordinator**

```typescript
class CareIntegrationCoordinatorActor extends Entity {
  expertise: "Multi-specialty care integration and coordination"
  
  state: {
    // Patient across specialties
    patient_id: string
    integration_domains: [
      "Cardiology",
      "Endocrinology",
      "Nephrology"
    ],
    integrating_since: "2025-10-01",
    
    // Domain states
    domain_states: {
      "Cardiology": {
        last_update: "2025-11-04",
        status: "Stable cardiac function",
        key_metrics: {
          "ejection_fraction": 55,
          "bp_control": 0.85
        },
        concerns: []
      },
      "Endocrinology": {
        last_update: "2025-11-04",
        status: "Diabetes improving",
        key_metrics: {
          "a1c": 7.1,
          "glucose_control": 0.80
        },
        concerns: ["Hypoglycemia episodes"]
      },
      "Nephrology": {
        last_update: "2025-11-03",
        status: "Kidney function stable",
        key_metrics: {
          "egfr": 65,
          "proteinuria": 0.3
        },
        concerns: ["Borderline kidney function"]
      }
    }
    
    // Cross-domain patterns
    detected_patterns: [
      {
        pattern_type: "medication_interaction",
        affected_domains: ["Cardiology", "Endocrinology"],
        significance: "medium",
        discovered: "2025-11-02",
        confidence: 0.85,
        details: "Diuretic may affect glucose control"
      },
      {
        pattern_type: "treatment_conflict",
        affected_domains: ["Endocrinology", "Nephrology"],
        significance: "high",
        discovered: "2025-11-01",
        confidence: 0.90,
        details: "Metformin contraindicated with declining kidney function"
      }
    ]
    
    // Integration points
    active_integration_points: {
      "cardio_endo_integration": {
        domains: ["Cardiology", "Endocrinology"],
        dependency_type: "affects",
        status: "healthy",
        last_checked: "2025-11-04",
        notes: "BP medications affect glucose, monitored"
      },
      "endo_nephro_integration": {
        domains: ["Endocrinology", "Nephrology"],
        dependency_type: "requires",
        status: "stressed",
        last_checked: "2025-11-04",
        notes: "Diabetes medication limited by kidney function"
      }
    }
    
    // System-level assessment
    overall_system_status: {
      health: "degraded",
      integration_quality: 0.75,
      key_risks: [
        "Medication conflicts between specialties",
        "Kidney function limiting treatment options"
      ],
      opportunities: [
        "Integrated medication review could optimize",
        "Coordinated dietary plan across conditions"
      ]
    }
  }
  
  tools: {
    analyze_treatment_interactions: ToolService
    map_care_dependencies: ToolService
    assess_multi_condition_impact: ToolService
    synthesize_specialist_recommendations: ToolService
  }
  
  model: {
    interaction_detector: TrainedModel
    conflict_resolver: TrainedModel
    integration_optimizer: PolicyNetwork
  }
  
  handleMessage(msg: IntegrationMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "SpecialistUpdate") {
        // Update domain state
        this.state.domain_states.set(msg.domain, msg.state)
        
        // Check for cross-domain patterns
        const patterns = yield* this.detectCrossDomainPatterns()
        
        // Assess integration point health
        const integration_health = yield* this.assessIntegrationPoints()
        
        // If conflicts detected, coordinate resolution
        if (patterns.some(p => p.significance === "high")) {
          yield* this.coordinateConflictResolution(patterns)
        }
      }
      
      if (msg._tag === "NewTreatmentProposal") {
        // Assess impact across all domains
        const impact = yield* this.tools.assess_multi_condition_impact({
          proposed_treatment: msg.treatment,
          source_domain: msg.domain,
          patient_state: this.state.domain_states
        })
        
        if (impact.conflicts_detected) {
          // Coordinate specialists to resolve
          yield* this.facilitateIntegration(impact.conflicts)
        }
        
        return impact
      }
    })
  }
}
```

**Enterprise: System Integration Coordinator**

```typescript
class SystemIntegrationCoordinatorActor extends Entity {
  expertise: "Cross-system integration and data flow coordination"
  
  state: {
    // Systems being integrated
    integration_domains: [
      "CRM",
      "ERP",
      "Billing",
      "Analytics"
    ],
    integrating_since: "2025-01-01",
    
    // System states
    domain_states: {
      "CRM": {
        last_update: "2025-11-04T16:00:00Z",
        status: "Operational",
        key_metrics: {
          "api_latency_ms": 45,
          "error_rate": 0.001
        },
        concerns: []
      },
      "ERP": {
        last_update: "2025-11-04T15:58:00Z",
        status: "Degraded",
        key_metrics: {
          "api_latency_ms": 250,
          "error_rate": 0.05
        },
        concerns: ["High latency", "Timeout spikes"]
      }
    }
    
    // Cross-system patterns
    detected_patterns: [
      {
        pattern_type: "data_inconsistency",
        affected_domains: ["CRM", "Billing"],
        significance: "high",
        discovered: "2025-11-04T15:30:00Z",
        confidence: 0.92,
        details: "Customer records out of sync"
      }
    ]
    
    // Integration points
    active_integration_points: {
      "crm_billing_sync": {
        domains: ["CRM", "Billing"],
        dependency_type: "requires",
        status: "broken",
        last_checked: "2025-11-04T15:45:00Z",
        notes: "Sync job failing since 15:20"
      },
      "erp_analytics_feed": {
        domains: ["ERP", "Analytics"],
        dependency_type: "affects",
        status: "stressed",
        last_checked: "2025-11-04T15:58:00Z",
        notes: "Slow ERP affecting analytics refresh"
      }
    }
    
    // System health
    overall_system_status: {
      health: "degraded",
      integration_quality: 0.65,
      key_risks: [
        "Data sync failures causing inconsistency",
        "ERP performance affecting downstream systems"
      ],
      opportunities: [
        "Caching layer could improve performance",
        "Async processing reduce coupling"
      ]
    }
  }
  
  tools: {
    analyze_data_flow: ToolService
    map_system_dependencies: ToolService
    detect_integration_bottlenecks: ToolService
    simulate_system_changes: ToolService
  }
  
  model: {
    integration_health_predictor: TrainedModel
    bottleneck_identifier: TrainedModel
    optimization_recommender: PolicyNetwork
  }
}
```

#### 5.5 Success Metrics

Integrators are measured by **integration quality**:

```yaml
integrator_metrics:
  integration_health:
    - "Integration point uptime"
    - "Data consistency across domains"
    - "Dependency satisfaction rate"
    
  pattern_detection:
    - "Cross-domain issue detection speed"
    - "Pattern recognition accuracy"
    - "False positive rate"
    
  coordination_effectiveness:
    - "Conflict resolution success"
    - "Time to integrate changes"
    - "Stakeholder satisfaction"
    
  system_view:
    - "Holistic assessment accuracy"
    - "Risk identification completeness"
    - "Opportunity capture rate"
```

---

## B. Organizational Patterns

These patterns show how to organize actors for specific domain architectures, using legal research as a comprehensive example.

### 1. Matter-Centric Actors (Legal Domain Example)

#### 1.1 Pattern Definition

**Core Insight**: In legal practice, a "matter" is the natural unit of stateful work. Each client matter represents a persistent entity with its own lifecycle.

**Why Matters Work as Actors**:
- **Natural state boundaries**: Each matter is truly isolated
- **Meaningful learning**: Matter-specific patterns accumulate
- **Proper lifecycle**: Matters open and close like entities
- **Audit trail**: Matter state = complete history
- **Multi-task coordination**: One matter, many concurrent tasks

#### 1.2 Implementation

```typescript
class MatterActor extends Entity.make(
  "Matter",
  Schema.String,  // matter ID
  RecipientType.EntityType,
  (matterId, msg: MatterMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<MatterState>()
    const state = yield* Ref.get(stateRef)
    
    type MatterState = {
      // Matter identity
      matter_id: string
      client_id: string
      matter_type: "litigation" | "transactional" | "advisory"
      jurisdiction: Jurisdiction
      opened_date: DateTime
      status: "active" | "closed" | "on_hold"
      
      // Research context (accumulated)
      research_history: ResearchTask[]
      relevant_authorities: Authority[]
      key_fact_patterns: Pattern[]
      learned_legal_principles: Principle[]
      
      // Learned preferences (matter-specific)
      preferred_sources: SourcePreferences
      effective_search_strategies: Strategy[]
      successful_arguments: Argument[]
      
      // Active work
      ongoing_tasks: Map<TaskId, TaskContext>
      assigned_lawyers: LawyerId[]
      pending_deadlines: Deadline[]
      
      // Matter-specific learning
      what_worked: Array<{
        approach: string
        outcome: string
        context: string
      }>
      what_didnt_work: Array<{
        approach: string
        reason: string
        lesson: string
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "NewResearchTask" }, msg =>
        handleNewResearch(state, msg)
      )
      .with({ _tag: "UpdateFinding" }, msg =>
        updateMatterKnowledge(state, msg)
      )
      .with({ _tag: "LawyerReview" }, msg =>
        incorporateFeedback(state, msg)
      )
      .exhaustive()
  })
)
```

#### 1.3 Matter Lifecycle

```
Matter Creation → Active Research → Lawyer Review → Refinement → Matter Close
     ↓                ↓                  ↓              ↓             ↓
  Initialize      Accumulate         Incorporate    Learn from    Preserve
   context         findings          feedback       outcomes      knowledge
```

#### 1.4 Example Usage

```typescript
// Matter 12345: "Client X treaty interpretation"
const matter = yield* MatterActor.send("matter-12345", {
  _tag: "NewResearchTask",
  task: {
    question: "Does CISG Article 25 apply?",
    urgency: "high",
    requested_by: "lawyer-456",
    deadline: "2025-11-15"
  }
})

// The Matter actor:
// 1. Checks its history: "We've researched CISG before"
// 2. Retrieves learned patterns: "UNCITRAL case law is most relevant"
// 3. Knows preferred sources: "DataJud + treaty databases"
// 4. Spawns research workflow with this accumulated context
// 5. Accumulates results in matter state
// 6. Learns: "This search strategy worked well for CISG"
```

**Key Benefit**: The matter "remembers" everything about this client's case, making each subsequent research task smarter and faster.

---

### 2. Specialized Research Actors

#### 2.1 Pattern Definition

**Core Insight**: Legal research has stable specialization domains that maintain expertise across many matters.

**Specialist Types**:
- Case Law Researcher
- Statutory Analyst
- Treaty Interpreter
- Doctrinal Scholar
- Jurisdictional Expert

#### 2.2 Implementation Example

```typescript
class CaseLawResearcherActor extends Entity {
  expertise: "Case law research across all matters"
  
  state: {
    // Domain-specific expertise
    known_databases: Database[]           // DataJud, JusBrasil, STF
    search_strategies: Map<Jurisdiction, Strategy[]>
    citation_patterns: CitationPattern[]
    court_hierarchies: Map<Jurisdiction, Court[]>
    
    // Performance learning (cross-matter)
    successful_queries: Query[]
    effective_sources: Source[]
    quality_signals: QualityMetrics
    
    // Active work (across multiple matters)
    ongoing_searches: Map<SearchId, {
      matter_id: string
      search_context: SearchContext
      started: DateTime
    }>
  }
  
  handleMessage(msg: CaseLawRequest) {
    return Effect.gen(function* () {
      // 1. Use accumulated expertise to plan search
      const strategy = this.selectStrategy(
        msg.jurisdiction,
        msg.legal_issue,
        this.state.successful_queries  // ← learned across all matters
      )
      
      // 2. Execute search workflow (ephemeral)
      const results = yield* this.caseLawSearchWorkflow(strategy)
      
      // 3. Learn from results (improves for all future matters)
      this.state.successful_queries.push({
        query: msg,
        strategy,
        quality: results.quality,
        matter_id: msg.matter_id
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

**Why This Works**:
- **Expertise accumulation**: Gets better at case law research across all matters
- **Resource efficiency**: One specialist serves many matters
- **Natural parallelism**: Can handle multiple matters concurrently
- **Composable**: Matters coordinate multiple specialists

---

### 3. Jurisdictional Actors

#### 3.1 Pattern Definition

**Core Insight**: Law is fundamentally jurisdictional. Each jurisdiction has unique characteristics that warrant specialized actors.

**Jurisdiction Characteristics**:
- Different sources of authority
- Different citation formats
- Different legal concepts
- Different research methodologies
- Different procedural rules

#### 3.2 Implementation Example

```typescript
class BrazilianLawActor extends Entity {
  expertise: "Brazilian legal system expertise"
  
  state: {
    // Brazil-specific knowledge
    authority_hierarchy: ["STF", "STJ", "TRF", "Courts of Appeal", "Trial Courts"]
    primary_sources: ["Constituição Federal", "Código Civil", "CLT", "CPC"]
    doctrinal_authorities: ["Flávio Tartuce", "Pablo Stolze", "Fredie Didier"]
    
    // Citation patterns learned
    citation_formats: CitationFormat[]
    court_abbreviations: Map<string, Court>
    
    // Search expertise
    effective_databases: ["DataJud", "JusBrasil", "STF website"]
    search_optimizations: BrazilianSearchHeuristics
    
    // Learned patterns
    judicial_reasoning_patterns: Pattern[]
    common_arguments: Argument[]
    effective_precedents: Precedent[]
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

#### 3.3 Cross-Jurisdictional Research

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

---

### 4. Citation Graph Actors

#### 4.1 Pattern Definition

**Core Insight**: Legal reasoning is graph-based. Cases cite cases, statutes reference statutes. This persistent graph warrants a specialized actor.

**Why Citation Graph as Actor**:
- **Persistent**: Graph doesn't change with each query
- **Queryable**: Need to find precedent chains
- **Evolving**: New cases added daily
- **Contextual**: Importance varies by matter
- **Complex state**: Graph algorithms need full graph in memory

#### 4.2 Implementation

```typescript
class CitationGraphActor extends Entity {
  expertise: "Legal citation network analysis and precedent chains"
  
  state: {
    // The graph itself
    nodes: Map<CaseId, CaseNode>  // All cases
    edges: Map<CaseId, Citation[]>  // Who cites whom
    
    // Graph indices (for performance)
    precedent_chains: Map<LegalIssue, CaseId[]>
    authority_scores: Map<CaseId, number>  // PageRank-like
    
    // Temporal indices
    cases_by_year: Map<number, CaseId[]>
    recent_additions: CaseId[]  // Last 30 days
    
    // Learning
    query_patterns: Map<Query, RelevantSubgraph>
    important_subgraphs: Subgraph[]
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
        this.state.query_patterns.set(msg.query, chain)
        
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
    
    // 1. Filter to relevant jurisdiction
    const relevantCases = this.filterByJurisdiction(jurisdiction)
    
    // 2. Find cases addressing same issue
    const issueCases = this.filterByIssue(relevantCases, issue)
    
    // 3. Build precedent chain using authority scores
    const chain = this.buildChain(startCase, issueCases)
    
    return chain
  }
}
```

#### 4.3 Integration with Research Specialists

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

---

### 5. Human-in-the-Loop Actors

#### 5.1 Pattern Definition

**Core Insight**: Legal AI cannot be fully autonomous. Lawyer interaction is essential and should be modeled as actor behavior.

**Human-in-Loop Characteristics**:
- **Async by nature**: Lawyer review takes hours/days - perfect for actors
- **Learning accumulation**: Feedback improves system over time
- **State management**: Tracks pending reviews across time
- **Multi-lawyer coordination**: Different lawyers, different preferences

#### 5.2 Implementation

```typescript
class LawyerReviewActor extends Entity {
  expertise: "Lawyer review coordination and feedback incorporation"
  
  state: {
    // Pending reviews
    pending_reviews: Map<ReviewId, {
      research: ResearchForReview
      assigned_lawyer: LawyerId
      submitted: DateTime
      deadline: DateTime
      priority: "urgent" | "high" | "normal"
    }>
    
    // Lawyer preferences (learned over time)
    lawyer_preferences: Map<LawyerId, {
      preferred_level_of_detail: "high" | "medium" | "summary"
      citation_format_preference: CitationFormat
      common_feedback_themes: string[]
      average_review_time: Duration
    }>
    
    // Feedback history
    feedback_history: Array<{
      review_id: ReviewId
      lawyer_id: LawyerId
      research: Research
      feedback: Feedback
      incorporated: boolean
    }>
    
    // Quality signals
    acceptance_rates: Map<ResearchType, number>
    common_rejection_reasons: Array<{
      reason: string
      frequency: number
      affected_research_types: ResearchType[]
    }>
    
    // Active learning
    improvement_patterns: Array<{
      feedback_type: string
      improvement_action: string
      effectiveness: number
    }>
  }
  
  handleMessage(msg: ReviewMessage) {
    return Effect.gen(function* () {
      if (msg._tag === "SubmitForReview") {
        // Queue research for lawyer review
        const review_id = generateReviewId()
        
        this.state.pending_reviews.set(review_id, {
          research: msg.research,
          assigned_lawyer: msg.lawyer_id,
          submitted: now(),
          deadline: msg.deadline,
          priority: msg.priority
        })
        
        // Notify lawyer (email, dashboard, etc.)
        yield* notifyLawyer(msg.lawyer_id, review_id, {
          research_summary: msg.research.summary,
          priority: msg.priority,
          deadline: msg.deadline
        })
        
        return { status: "pending", review_id }
      }
      
      if (msg._tag === "LawyerFeedback") {
        // Lawyer provides feedback
        const review = this.state.pending_reviews.get(msg.review_id)
        
        // Learn from feedback
        this.state.feedback_history.push({
          review_id: msg.review_id,
          lawyer_id: msg.lawyer_id,
          research: review.research,
          feedback: msg.feedback,
          incorporated: false
        })
        
        // Update quality signals
        if (msg.feedback.quality === "low") {
          this.state.common_rejection_reasons.push({
            reason: msg.feedback.reason,
            research_type: review.research.type
          })
          
          // Signal to research actors to adjust
          yield* notifyResearchActors({
            _tag: "QualityFeedback",
            issue: review.research.issue,
            reason: msg.feedback.reason,
            improvement_needed: msg.feedback.guidance
          })
        }
        
        // Update lawyer preferences
        yield* this.updateLawyerPreferences(msg.lawyer_id, msg.feedback)
        
        // If research needs more work, send back to matter
        if (msg.feedback.action === "revise") {
          yield* MatterActor.send(review.research.matter_id, {
            _tag: "ReviseResearch",
            original_research: review.research,
            lawyer_guidance: msg.feedback.guidance,
            revision_priority: "high"
          })
        }
        
        // Remove from pending
        this.state.pending_reviews.delete(msg.review_id)
        
        return { status: "reviewed", action_taken: msg.feedback.action }
      }
      
      if (msg._tag === "GetReviewStatus") {
        // Check status of pending reviews
        const status = this.state.pending_reviews.get(msg.review_id)
        return status
      }
    })
  }
  
  private updateLawyerPreferences(
    lawyer_id: LawyerId,
    feedback: Feedback
  ) {
    return Effect.gen(function* () {
      const prefs = this.state.lawyer_preferences.get(lawyer_id)
      
      // Learn from feedback patterns
      if (feedback.reason.includes("too detailed")) {
        prefs.preferred_level_of_detail = "summary"
      } else if (feedback.reason.includes("not enough detail")) {
        prefs.preferred_level_of_detail = "high"
      }
      
      // Track feedback themes
      prefs.common_feedback_themes.push(feedback.theme)
      
      // Update preferences
      this.state.lawyer_preferences.set(lawyer_id, prefs)
    })
  }
}
```

#### 5.3 Feedback Loop to Specialists

```typescript
// When lawyer provides feedback, it flows back to specialists

class CaseLawResearcherActor {
  handleMessage(msg: QualityFeedback) {
    return Effect.gen(function* () {
      // Incorporate lawyer feedback into expertise
      if (msg.reason === "Precedent chain incomplete") {
        // Learn: Need deeper citation analysis for this issue type
        this.state.quality_improvements.push({
          issue_type: msg.issue,
          improvement: "Deeper citation chain analysis",
          triggered_by: "lawyer_feedback"
        })
        
        // Update search strategy
        const strategy = this.state.search_strategies.get(msg.issue)
        strategy.citation_depth = "deeper"
        strategy.requires_precedent_chain = true
      }
      
      if (msg.reason === "Wrong jurisdiction cited") {
        // Learn: Need better jurisdiction filtering
        this.state.quality_improvements.push({
          issue_type: msg.issue,
          improvement: "Stricter jurisdiction filtering",
          triggered_by: "lawyer_feedback"
        })
      }
    })
  }
}
```

---

### 6. Complete Architecture: Legal Research Squad

#### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ACTOR LAYER (Stateful)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Matter Actors (one per client matter)                     │
│  ├─ Matter-12345: Client X treaty interpretation           │
│  ├─ Matter-12346: Client Y contract dispute                │
│  └─ Matter-12347: Client Z regulatory advice               │
│                                                             │
│  Specialist Actors (one per research domain)               │
│  ├─ Case Law Researcher                                    │
│  ├─ Statutory Analyst                                       │
│  ├─ Treaty Interpreter                                      │
│  └─ Doctrinal Scholar                                       │
│                                                             │
│  Jurisdictional Actors (one per jurisdiction)              │
│  ├─ Brazilian Law Expert                                    │
│  ├─ Argentine Law Expert                                    │
│  └─ US Federal Law Expert                                   │
│                                                             │
│  Infrastructure Actors (specialized services)              │
│  ├─ Citation Graph                                          │
│  ├─ Lawyer Review Coordinator                               │
│  └─ Quality Monitor                                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  SERVICE LAYER (Stateless)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  External Tools                                             │
│  ├─ DataJud Service (Brazilian case law)                   │
│  ├─ BNP Service (doctrine search)                          │
│  ├─ Treaty Database Service                                │
│  └─ LLM Service (analysis and synthesis)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                WORKFLOW LAYER (Ephemeral)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Workflows live INSIDE actors as private methods:          │
│  ├─ Case search workflow (in CaseLawResearcher)           │
│  ├─ Citation extraction workflow (in CitationGraph)        │
│  └─ Quality check workflow (in QualityMonitor)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 6.2 Typical Flow

```typescript
// 1. Lawyer creates research task in Matter
yield* MatterActor.send("matter-12345", {
  _tag: "NewResearchTask",
  task: {
    question: "Does CISG Article 25 apply to substantial breach?",
    urgency: "high",
    requested_by: "lawyer-456",
    deadline: "2025-11-15"
  }
})

// 2. Matter determines needed specialists based on accumulated context
class MatterActor {
  handleNewResearch(task: ResearchTask) {
    return Effect.gen(function* () {
      // Uses matter state to decide strategy
      const specialists_needed = this.selectSpecialists(
        task,
        this.state.research_history,  // Past research on similar issues
        this.state.effective_search_strategies  // What worked before
      )
      
      // Coordinates specialists concurrently
      const results = yield* Effect.all({
        caseLaw: specialists_needed.includes("CaseLaw")
          ? CaseLawResearcher.research(task)
          : Effect.succeed(null),
        
        treaties: specialists_needed.includes("Treaties")
          ? TreatyInterpreter.research(task)
          : Effect.succeed(null),
        
        doctrine: specialists_needed.includes("Doctrine")
          ? DoctrinalScholar.research(task)
          : Effect.succeed(null)
      }, { concurrency: "unbounded" })
      
      // Accumulates in matter state
      this.state.research_history.push({
        task,
        findings: results,
        quality: this.assessQuality(results),
        date: now()
      })
      
      // Submits for lawyer review
      yield* LawyerReviewActor.send({
        _tag: "SubmitForReview",
        matter_id: this.matter_id,
        research: results,
        lawyer_id: task.requested_by,
        priority: task.urgency
      })
    })
  }
}

// 3. Specialist executes using accumulated expertise
class CaseLawResearcherActor {
  handleResearchRequest(request: ResearchRequest) {
    return Effect.gen(function* () {
      // Uses accumulated expertise to select strategy
      const strategy = this.selectOptimalStrategy(
        request,
        this.state.successful_queries,  // What worked across all matters
        this.state.effective_sources     // Which databases yield best results
      )
      
      // Spawns workflow for reliable execution
      const results = yield* this.dataJudSearchWorkflow(strategy).pipe(
        Effect.retry(Schedule.exponential("1 second")),
        Effect.timeout("60 seconds")
      )
      
      // Learns from results (improves for future)
      this.updateExpertise(strategy, results)
      
      return results
    })
  }
  
  private dataJudSearchWorkflow(strategy: Strategy) {
    // Deterministic workflow for search
    return pipe(
      DataJudService.search(strategy.query),
      Effect.flatMap(Schema.decode(ResultSchema)),
      Effect.flatMap(filterRelevant),
      Effect.flatMap(extractCitations)
    )
  }
}

// 4. Lawyer reviews and provides feedback
yield* LawyerReviewActor.send({
  _tag: "LawyerFeedback",
  review_id: "review-789",
  lawyer_id: "lawyer-456",
  feedback: {
    quality: "high",
    action: "approve",
    comments: "Excellent precedent chain, thorough analysis"
  }
})

// 5. Feedback flows back to specialists
// LawyerReviewActor automatically notifies:
// - Matter: Success, update learned strategies
// - CaseLawResearcher: Positive signal, reinforce this approach
// - CitationGraph: These precedent chains were valuable
```

This organizational pattern creates a learning system where:
- **Matters** remember client-specific context
- **Specialists** improve across all matters
- **Jurisdictions** develop regional expertise
- **Citation Graph** builds legal knowledge network
- **Lawyer feedback** continuously improves all components
