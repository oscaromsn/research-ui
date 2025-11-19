---
modified: 2025-11-04T08:23:37-03:00
---
# VI. DOMAIN-SPECIFIC APPLICATIONS

This section provides concrete implementations of the actor-based architecture patterns for three major domains: Healthcare, Legal, and Finance. Each domain section includes actor types, key patterns, example state structures, and domain-specific design considerations.

---

## A. Healthcare

### 1. Actor Types

Healthcare systems require specialized actors for clinical care, coordination, safety, and compliance. The actor architecture mirrors the natural structure of medical practice.

#### 1.1 Diagnostic Specialists (Disease-Specific)

**Purpose**: Deep expertise in specific disease domains with pattern recognition and diagnostic reasoning capabilities.

**Specialist Categories**:

```yaml
diagnostic_specialists:
  cardiovascular:
    expertise: "Heart disease, hypertension, arrhythmias"
    responsibilities:
      - "ECG interpretation"
      - "Cardiac biomarker analysis"
      - "Heart failure assessment"
      - "Cardiac risk stratification"
    learns: "ECG patterns, risk prediction, treatment responses"
    
  endocrinology:
    expertise: "Diabetes, thyroid disorders, metabolic conditions"
    responsibilities:
      - "Glucose management"
      - "Hormone level interpretation"
      - "Metabolic syndrome assessment"
      - "Medication dosing optimization"
    learns: "Patient response patterns, optimal dosing, complication prediction"
    
  nephrology:
    expertise: "Kidney disease, electrolyte disorders"
    responsibilities:
      - "Kidney function assessment"
      - "Dialysis planning"
      - "Medication adjustment for renal function"
      - "Electrolyte management"
    learns: "CKD progression patterns, drug dosing by GFR, dialysis timing"
    
  pulmonology:
    expertise: "Respiratory diseases, lung function"
    responsibilities:
      - "Respiratory pattern analysis"
      - "Oxygen requirement assessment"
      - "Ventilator management"
      - "Pulmonary medication optimization"
    learns: "Respiratory failure prediction, weaning protocols, medication responses"
```

**Implementation Example - Cardiovascular Specialist**:

```typescript
class CardiovascularSpecialistActor extends Entity.make(
  "CardiovascularSpecialist",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: CardiacMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<CardiacSpecialistState>()
    const state = yield* Ref.get(stateRef)
    
    type CardiacSpecialistState = {
      // Patient identity
      patient_id: string
      monitoring_since: DateTime
      patient_profile: {
        age: number
        sex: "M" | "F"
        cardiac_history: string[]
        risk_factors: CardiacRiskFactor[]
      }
      
      // Current cardiac status
      current_assessment: {
        primary_diagnosis: Option.Option<Diagnosis>
        confidence: number
        severity: "stable" | "worsening" | "critical"
        active_concerns: Concern[]
      }
      
      // Recent cardiac data (last 5)
      recent_observations: Array<{
        date: DateTime
        type: "ECG" | "biomarker" | "imaging" | "clinical"
        finding: string
        significance: "routine" | "notable" | "concerning" | "critical"
        pattern_matched: Option.Option<PatternId>
      }>
      
      // Active monitoring
      watching: Map<WatchId, {
        parameter: "HR" | "BP" | "troponin" | "BNP" | "rhythm"
        concern: string
        threshold: string
        action_if_triggered: string
        watching_since: DateTime
      }>
      
      // Accumulated cardiac expertise (learned)
      learned_patterns: {
        ecg_pattern_recognition: PatternId[]
        risk_prediction_calibration: CalibrationData
        effective_diagnostic_strategies: Strategy[]
      }
      
      // Performance tracking
      diagnostic_accuracy_recent: number[]  // last 20 diagnoses
      average_time_to_diagnosis: Duration
    }
    
    return yield* match(msg)
      .with({ _tag: "AssessCardiacStatus" }, msg =>
        handleCardiacAssessment(stateRef, msg)
      )
      .with({ _tag: "InterpretECG" }, msg =>
        handleECGInterpretation(stateRef, msg)
      )
      .with({ _tag: "EvaluateBiomarkers" }, msg =>
        handleBiomarkerEvaluation(stateRef, msg)
      )
      .with({ _tag: "UpdateRiskAssessment" }, msg =>
        handleRiskUpdate(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: ECG interpretation with learning
const handleECGInterpretation = (
  stateRef: Ref.Ref<CardiacSpecialistState>,
  msg: InterpretECGMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* CardiacTools
    
    // 1. Apply learned pattern recognition
    const patterns = yield* tools.detectECGPatterns({
      ecg_data: msg.ecg,
      known_patterns: state.learned_patterns.ecg_pattern_recognition
    })
    
    // 2. Find similar cases from history
    const similar = yield* tools.findSimilarCardiacCases({
      patient_profile: state.patient_profile,
      ecg_findings: patterns,
      limit: 5
    })
    
    // 3. LLM reasoning with accumulated context
    const interpretation = yield* llm.interpretECG({
      context: `
        Patient: ${state.patient_profile.age}yo ${state.patient_profile.sex}
        Cardiac History: ${state.patient_profile.cardiac_history.join(", ")}
        Risk Factors: ${state.patient_profile.risk_factors.join(", ")}
        
        Recent Cardiac Events:
        ${state.recent_observations.map(o => `- ${o.date}: ${o.finding}`).join("\n")}
        
        Current Concerns:
        ${state.current_assessment.active_concerns.map(c => `- ${c}`).join("\n")}
        
        ECG Patterns Detected:
        ${patterns.map(p => `- ${p.pattern}: ${p.confidence}`).join("\n")}
        
        Similar Cases:
        ${similar.cases.map(c => `- ${c.presentation} → ${c.diagnosis}`).join("\n")}
      `,
      task: "Interpret ECG and assess cardiac significance"
    })
    
    // 4. Update state with findings
    yield* Ref.update(stateRef, s => ({
      ...s,
      recent_observations: [
        ...s.recent_observations.slice(-4),
        {
          date: DateTime.now(),
          type: "ECG",
          finding: interpretation.interpretation,
          significance: interpretation.significance,
          pattern_matched: Option.some(patterns[0]?.pattern_id)
        }
      ],
      current_assessment: {
        ...s.current_assessment,
        active_concerns: interpretation.concerning
          ? [...s.current_assessment.active_concerns, interpretation.concern]
          : s.current_assessment.active_concerns
      }
    }))
    
    // 5. If concerning, notify care coordinator
    if (interpretation.significance === "concerning" || interpretation.significance === "critical") {
      const messenger = yield* sharding.messenger("CareCoordinator")
      yield* messenger.send(state.patient_id, {
        _tag: "CardiacConcernDetected",
        patient_id: state.patient_id,
        finding: interpretation.interpretation,
        significance: interpretation.significance,
        recommended_action: interpretation.recommended_action,
        urgency: interpretation.significance === "critical" ? "immediate" : "high"
      })
    }
    
    return interpretation
  })
```

#### 1.2 Medication Management Specialists

**Purpose**: Optimize drug therapy through expertise in pharmacology, drug interactions, and patient-specific dosing.

**Implementation**:

```typescript
class MedicationManagementActor extends Entity.make(
  "MedicationManagement",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: MedicationMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<MedicationState>()
    
    type MedicationState = {
      patient_id: string
      managing_since: DateTime
      
      // Current medication regimen
      current_medications: Array<{
        drug: Drug
        dose: string
        frequency: string
        started: DateTime
        indication: string
        prescriber: string
      }>
      
      // Medication history (for learning patterns)
      medication_history: Array<{
        drug: Drug
        duration: Duration
        outcome: "effective" | "ineffective" | "adverse_event" | "discontinued"
        reason_for_change: string
      }>
      
      // Active monitoring
      monitoring_parameters: Map<DrugId, {
        parameter: "level" | "efficacy" | "side_effects"
        target_range: string
        current_value: Option.Option<number>
        next_check: DateTime
      }>
      
      // Drug interaction watch
      potential_interactions: Array<{
        drug_pair: [Drug, Drug]
        severity: "minor" | "moderate" | "major" | "contraindicated"
        mechanism: string
        monitoring_required: boolean
      }>
      
      // Learned medication patterns
      learned_responses: Map<DrugClass, {
        typical_response_time: Duration
        success_rate: number
        common_side_effects: string[]
        optimal_starting_dose: string
      }>
      
      // Patient-specific factors
      patient_factors: {
        age: number
        weight: number
        kidney_function: number  // GFR
        liver_function: string
        allergies: string[]
        adherence_history: number  // 0-1
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "RecommendMedications" }, msg =>
        handleMedicationRecommendation(stateRef, msg)
      )
      .with({ _tag: "CheckInteractions" }, msg =>
        handleInteractionCheck(stateRef, msg)
      )
      .with({ _tag: "AdjustDosing" }, msg =>
        handleDosingAdjustment(stateRef, msg)
      )
      .with({ _tag: "EvaluateResponse" }, msg =>
        handleResponseEvaluation(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: Medication recommendation with safety checks
const handleMedicationRecommendation = (
  stateRef: Ref.Ref<MedicationState>,
  msg: RecommendMedicationsMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* MedicationTools
    
    // 1. Check for drug interactions with current medications
    const interactions = yield* tools.checkDrugInteractions({
      current_medications: state.current_medications,
      proposed_medication: msg.indication
    })
    
    // 2. Adjust dosing for patient factors
    const dosing = yield* tools.calculateOptimalDosing({
      drug_class: msg.indication,
      patient_age: state.patient_factors.age,
      patient_weight: state.patient_factors.weight,
      kidney_function: state.patient_factors.kidney_function,
      liver_function: state.patient_factors.liver_function
    })
    
    // 3. Reference learned patterns for this patient
    const historical_response = state.medication_history
      .filter(m => m.drug.class === msg.indication.drug_class)
      .map(m => m.outcome)
    
    // 4. LLM reasoning with all context
    const recommendation = yield* llm.recommendMedication({
      context: `
        Patient: ${state.patient_factors.age}yo, ${state.patient_factors.weight}kg
        Kidney Function: GFR ${state.patient_factors.kidney_function}
        Liver Function: ${state.patient_factors.liver_function}
        Allergies: ${state.patient_factors.allergies.join(", ")}
        
        Current Medications:
        ${state.current_medications.map(m => `- ${m.drug.name} ${m.dose} ${m.frequency}`).join("\n")}
        
        Indication: ${msg.indication.diagnosis}
        
        Interaction Analysis:
        ${interactions.interactions.length === 0 
          ? "No significant interactions detected"
          : interactions.interactions.map(i => `- ${i.drugs.join(" + ")}: ${i.severity} (${i.mechanism})`).join("\n")
        }
        
        Dosing Recommendation:
        Starting dose: ${dosing.starting_dose}
        Target dose: ${dosing.target_dose}
        Titration: ${dosing.titration_schedule}
        
        Historical Response:
        ${historical_response.length > 0
          ? `Patient has tried similar medications: ${historical_response.join(", ")}`
          : "No similar medications in history"
        }
      `,
      task: "Recommend optimal medication for this patient"
    })
    
    // 5. Safety check with guardian
    const safetyCheck = yield* SafetyGuardian.verifyMedicationSafety({
      patient_id: state.patient_id,
      proposed_medication: recommendation.medication,
      proposed_dose: recommendation.dose,
      current_medications: state.current_medications,
      patient_factors: state.patient_factors
    })
    
    if (!safetyCheck.approved) {
      return {
        status: "rejected",
        reason: safetyCheck.reason,
        alternative: safetyCheck.suggested_alternative
      }
    }
    
    // 6. Set up monitoring
    yield* Ref.update(stateRef, s => ({
      ...s,
      monitoring_parameters: s.monitoring_parameters.set(
        recommendation.medication.id,
        {
          parameter: "efficacy",
          target_range: recommendation.target_effect,
          current_value: Option.none(),
          next_check: DateTime.now().plus(Duration.days(7))
        }
      )
    }))
    
    return {
      status: "approved",
      medication: recommendation.medication,
      dose: recommendation.dose,
      frequency: recommendation.frequency,
      duration: recommendation.duration,
      monitoring: recommendation.monitoring_plan,
      patient_education: recommendation.patient_instructions
    }
  })
```

#### 1.3 Patient Care Coordinators

**Purpose**: Strategic oversight of entire patient care journey, synthesizing specialist inputs and maintaining overall care strategy.

**Implementation**:

```typescript
class PatientCareCoordinatorActor extends Entity.make(
  "PatientCareCoordinator",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: CoordinatorMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<CareCoordinatorState>()
    
    type CareCoordinatorState = {
      patient_id: string
      coordinating_since: DateTime
      
      // Patient profile
      patient_profile: {
        demographics: Demographics
        active_conditions: Condition[]
        care_goals: Goal[]
        preferences: PatientPreferences
      }
      
      // Active care theories (working hypotheses)
      active_theories: Map<Domain, {
        theory: string
        conviction_strength: number  // 0-1
        supporting_evidence: Evidence[]
        contradicting_evidence: Evidence[]
        last_updated: DateTime
        originated_from: SpecialistId
      }>
      
      // Recent strategic decisions
      recent_strategic_decisions: Array<{
        date: DateTime
        decision: string
        rationale: string
        specialists_consulted: SpecialistId[]
        expected_outcome: string
        status: "monitoring" | "succeeded" | "failed" | "revised"
        actual_outcome: Option.Option<string>
      }>
      
      // Specialist coordination
      active_specialists: Map<SpecialistId, {
        specialty: string
        current_assessment: string
        last_update: DateTime
        recommendations: Recommendation[]
        confidence_in_specialist: number
      }>
      
      // Care plan synthesis
      current_care_plan: {
        primary_strategy: string
        active_treatments: Treatment[]
        monitoring_schedule: MonitoringPlan[]
        next_major_decision_point: DateTime
        contingency_plans: ContingencyPlan[]
      }
      
      // Strategic priorities
      strategic_priorities: Array<{
        priority: string
        importance: "critical" | "high" | "medium"
        owner: Option.Option<SpecialistId>
        target_date: DateTime
        status: string
        milestones: Milestone[]
      }>
      
      // Overall patient status assessment
      overall_status: {
        health_trajectory: "improving" | "stable" | "declining" | "critical"
        confidence: number
        key_risks: Risk[]
        key_opportunities: Opportunity[]
        next_major_decision: string
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "SpecialistUpdate" }, msg =>
        handleSpecialistUpdate(stateRef, msg)
      )
      .with({ _tag: "SynthesizeCarePlan" }, msg =>
        handleCarePlanSynthesis(stateRef, msg)
      )
      .with({ _tag: "ResolveConflict" }, msg =>
        handleConflictResolution(stateRef, msg)
      )
      .with({ _tag: "MakeStrategicDecision" }, msg =>
        handleStrategicDecision(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: Synthesizing care plan from multiple specialists
const handleCarePlanSynthesis = (
  stateRef: Ref.Ref<CareCoordinatorState>,
  msg: SynthesizeCarePlanMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* CoordinatorTools
    
    // 1. Gather all specialist recommendations
    const specialist_inputs = Array.from(state.active_specialists.values())
      .map(s => ({
        specialty: s.specialty,
        assessment: s.current_assessment,
        recommendations: s.recommendations,
        confidence: s.confidence_in_specialist
      }))
    
    // 2. Check for conflicts between recommendations
    const conflicts = yield* tools.detectRecommendationConflicts({
      recommendations: specialist_inputs.flatMap(s => s.recommendations)
    })
    
    // 3. If conflicts exist, resolve them
    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        const resolution = yield* resolveRecommendationConflict(state, conflict)
        // Update active theories based on resolution
        yield* updateTheoriesAfterResolution(stateRef, conflict, resolution)
      }
    }
    
    // 4. Synthesize into coherent care plan
    const synthesis = yield* llm.synthesizeCarePlan({
      context: `
        Patient: ${state.patient_profile.demographics.age}yo
        Active Conditions: ${state.patient_profile.active_conditions.map(c => c.name).join(", ")}
        Care Goals: ${state.patient_profile.care_goals.map(g => g.description).join(", ")}
        
        Current Theories:
        ${Array.from(state.active_theories.entries()).map(([domain, theory]) => `
          ${domain}: ${theory.theory} (conviction: ${theory.conviction_strength})
          - Supporting: ${theory.supporting_evidence.length} pieces of evidence
          - Contradicting: ${theory.contradicting_evidence.length} concerns
        `).join("\n")}
        
        Specialist Recommendations:
        ${specialist_inputs.map(s => `
          ${s.specialty}:
          ${s.recommendations.map(r => `- ${r.recommendation} (priority: ${r.priority})`).join("\n")}
        `).join("\n")}
        
        Recent Decisions:
        ${state.recent_strategic_decisions.slice(-3).map(d => `
          ${d.date}: ${d.decision}
          Status: ${d.status}
          ${d.actual_outcome ? `Outcome: ${d.actual_outcome}` : ""}
        `).join("\n")}
        
        Strategic Priorities:
        ${state.strategic_priorities.map(p => `
          - ${p.priority} (${p.importance}) - ${p.status}
        `).join("\n")}
      `,
      task: "Synthesize a coherent, prioritized care plan that addresses all conditions while managing complexity"
    })
    
    // 5. Validate plan doesn't violate safety constraints
    const safetyValidation = yield* SafetyGuardian.validateCarePlan({
      patient_id: state.patient_id,
      proposed_plan: synthesis.care_plan,
      patient_profile: state.patient_profile
    })
    
    if (!safetyValidation.approved) {
      // Revise plan to address safety concerns
      const revised = yield* revisePlanForSafety(synthesis.care_plan, safetyValidation.concerns)
      synthesis.care_plan = revised
    }
    
    // 6. Update state with new care plan
    yield* Ref.update(stateRef, s => ({
      ...s,
      current_care_plan: synthesis.care_plan,
      recent_strategic_decisions: [
        ...s.recent_strategic_decisions,
        {
          date: DateTime.now(),
          decision: "Updated comprehensive care plan",
          rationale: synthesis.rationale,
          specialists_consulted: Array.from(s.active_specialists.keys()),
          expected_outcome: synthesis.expected_outcomes,
          status: "monitoring",
          actual_outcome: Option.none()
        }
      ],
      overall_status: {
        ...s.overall_status,
        next_major_decision: synthesis.next_decision_point
      }
    }))
    
    // 7. Communicate plan to all specialists
    yield* Effect.forEach(
      state.active_specialists.keys(),
      specialist_id => {
        const messenger = yield* sharding.messenger(specialist_id)
        return messenger.send(specialist_id, {
          _tag: "CarePlanUpdated",
          patient_id: state.patient_id,
          care_plan: synthesis.care_plan,
          your_role: synthesis.care_plan.specialist_responsibilities[specialist_id]
        })
      },
      { concurrency: "unbounded" }
    )
    
    return synthesis
  })

// Theory update based on new evidence
const updateTheoriesAfterResolution = (
  stateRef: Ref.Ref<CareCoordinatorState>,
  conflict: Conflict,
  resolution: Resolution
) =>
  Effect.gen(function* () {
    yield* Ref.update(stateRef, state => {
      const domain = conflict.domain
      const theory = state.active_theories.get(domain)
      
      if (theory) {
        // Update conviction based on resolution
        if (resolution.supports_theory) {
          theory.conviction_strength = Math.min(theory.conviction_strength + 0.1, 1.0)
          theory.supporting_evidence.push(resolution.evidence)
        } else {
          theory.conviction_strength = Math.max(theory.conviction_strength - 0.15, 0.0)
          theory.contradicting_evidence.push(resolution.evidence)
        }
        
        // If conviction drops too low, flag for revision
        if (theory.conviction_strength < 0.4) {
          // Signal need to revise theory
          state.overall_status.next_major_decision = `Revise ${domain} treatment approach`
        }
        
        state.active_theories.set(domain, theory)
      }
      
      return state
    })
  })
```

#### 1.4 Quality Monitors

**Purpose**: Continuously assess care quality, identify gaps, and ensure best practices.

```typescript
class QualityMonitorActor extends Entity.make(
  "QualityMonitor",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: QualityMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<QualityMonitorState>()
    
    type QualityMonitorState = {
      monitoring_scope: "system" | "specialty" | "patient"
      monitoring_since: DateTime
      
      // Quality metrics tracking
      quality_metrics: {
        diagnostic_accuracy: number
        treatment_adherence_to_guidelines: number
        patient_safety_incidents: number
        care_coordination_effectiveness: number
        patient_satisfaction: number
      }
      
      // Recent quality events
      recent_quality_events: Array<{
        date: DateTime
        event_type: "gap" | "excellence" | "concern" | "violation"
        domain: string
        description: string
        severity: "low" | "medium" | "high" | "critical"
        addressed: boolean
      }>
      
      // Active quality concerns
      active_concerns: Map<ConcernId, {
        concern: string
        identified_date: DateTime
        severity: string
        responsible_actor: ActorId
        action_plan: string
        status: "open" | "in_progress" | "resolved"
      }>
      
      // Quality improvement tracking
      improvement_initiatives: Array<{
        initiative: string
        started: DateTime
        target_metric: string
        baseline: number
        target: number
        current: number
        status: string
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "AssessQuality" }, msg =>
        handleQualityAssessment(stateRef, msg)
      )
      .with({ _tag: "IdentifyGaps" }, msg =>
        handleGapIdentification(stateRef, msg)
      )
      .with({ _tag: "RecommendImprovement" }, msg =>
        handleImprovementRecommendation(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.5 Safety Guardians

**Purpose**: Enforce safety constraints, prevent harm, and ensure regulatory compliance.

```typescript
class SafetyGuardianActor extends Entity.make(
  "SafetyGuardian",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: SafetyMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<SafetyGuardianState>()
    
    type SafetyGuardianState = {
      patient_id: string
      guarding_since: DateTime
      
      // Current safety status
      safety_status: {
        overall_risk_level: "low" | "medium" | "high" | "critical"
        active_safety_concerns: Concern[]
        recent_incidents: Incident[]
      }
      
      // Safety constraints (learned optimal boundaries)
      learned_safety_boundaries: Map<Metric, {
        soft_limit: number
        hard_limit: number
        observations_count: number
        confidence: number
      }>
      
      // Active safety monitoring
      active_safety_watches: Map<WatchId, {
        parameter: string
        threshold: string
        reason: string
        escalation_policy: string
      }>
      
      // Enforcement actions taken
      recent_interventions: Array<{
        date: DateTime
        intervention_type: "block" | "modify" | "escalate" | "alert"
        reason: string
        outcome: string
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "ValidateMedication" }, msg =>
        handleMedicationValidation(stateRef, msg)
      )
      .with({ _tag: "CheckVitals" }, msg =>
        handleVitalsCheck(stateRef, msg)
      )
      .with({ _tag: "ValidateCarePlan" }, msg =>
        handleCarePlanValidation(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: Medication safety validation
const handleMedicationValidation = (
  stateRef: Ref.Ref<SafetyGuardianState>,
  msg: ValidateMedicationMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* SafetyTools
    
    // 1. Check for contraindications
    const contraindications = yield* tools.checkContraindications({
      medication: msg.medication,
      patient_conditions: msg.patient_conditions,
      patient_allergies: msg.patient_allergies
    })
    
    if (contraindications.has_absolute_contraindication) {
      yield* Ref.update(stateRef, s => ({
        ...s,
        recent_interventions: [
          ...s.recent_interventions,
          {
            date: DateTime.now(),
            intervention_type: "block",
            reason: `Absolute contraindication: ${contraindications.reason}`,
            outcome: "Medication blocked"
          }
        ]
      }))
      
      return {
        approved: false,
        reason: `CONTRAINDICATED: ${contraindications.reason}`,
        severity: "critical",
        alternative: contraindications.suggested_alternative
      }
    }
    
    // 2. Check dose against safety boundaries
    const dosing_check = yield* tools.validateDosing({
      medication: msg.medication,
      dose: msg.dose,
      patient_weight: msg.patient_weight,
      kidney_function: msg.kidney_function,
      liver_function: msg.liver_function
    })
    
    if (dosing_check.exceeds_safe_limits) {
      return {
        approved: false,
        reason: `Dose exceeds safe limits: ${dosing_check.explanation}`,
        severity: "high",
        suggested_dose: dosing_check.recommended_dose
      }
    }
    
    // 3. Check for drug-drug interactions
    const interactions = yield* tools.checkDrugInteractions({
      new_medication: msg.medication,
      current_medications: msg.current_medications
    })
    
    const critical_interactions = interactions.filter(i => i.severity === "contraindicated")
    if (critical_interactions.length > 0) {
      return {
        approved: false,
        reason: `Critical drug interaction: ${critical_interactions[0].description}`,
        severity: "critical",
        alternative: "Alternative medication required"
      }
    }
    
    // 4. Moderate interactions - allow with monitoring
    const moderate_interactions = interactions.filter(i => i.severity === "moderate" || i.severity === "major")
    if (moderate_interactions.length > 0) {
      return {
        approved: true,
        requires_monitoring: true,
        monitoring_plan: moderate_interactions.map(i => i.monitoring_recommendation),
        warnings: moderate_interactions.map(i => i.description)
      }
    }
    
    // 5. Approved
    return {
      approved: true,
      requires_monitoring: false
    }
  })
```

---

### 2. Key Patterns

Healthcare-specific patterns that emerge from clinical practice requirements.

#### 2.1 Continuity of Care (Stateful Treatment)

**Pattern**: Actors maintain patient context across multiple visits and time periods.

```typescript
// Pattern: Patient-Actor Binding
// One specialist actor per patient-specialty pair
// Accumulates knowledge about this specific patient

class PatientSpecificCardiacSpecialist {
  // Patient-specific learning
  learns_over_time: {
    // This patient's typical ECG baseline
    personal_baseline: ECGBaseline
    
    // This patient's medication responses
    medication_responses: Map<Drug, Response>
    
    // This patient's symptom patterns
    symptom_patterns: SymptomPattern[]
    
    // This patient's risk factors
    personalized_risk_profile: RiskProfile
  }
  
  // Decisions informed by accumulated patient-specific knowledge
  makeDecision(current_data: Data) {
    // "For THIS patient, based on what I've learned..."
    return decisionBasedOnPatientHistory(
      current_data,
      this.learns_over_time
    )
  }
}
```

**Implementation**:

```typescript
// Creating patient-specific specialist instance
const createPatientCardiacSpecialist = (
  patient_id: string
) =>
  Effect.gen(function* () {
    const specialist_id = `cardio_${patient_id}`
    const sharding = yield* Sharding.Sharding
    const messenger = yield* sharding.messenger("CardiovascularSpecialist")
    
    // Initialize with patient history
    yield* messenger.send(specialist_id, {
      _tag: "Initialize",
      patient_id,
      load_history: true
    })
    
    return specialist_id
  })

// Specialist maintains continuity
const maintainContinuityOfCare = (
  stateRef: Ref.Ref<CardiacSpecialistState>,
  new_observation: Observation
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    
    // Compare to personal baseline
    const deviation_from_baseline = compareToBaseline(
      new_observation,
      state.learned_patterns.personal_baseline
    )
    
    // Reference past similar situations for THIS patient
    const past_similar = state.recent_observations
      .filter(o => isSimilar(o, new_observation))
      .map(o => ({ observation: o, outcome: o.outcome }))
    
    // Make decision with full patient context
    const decision = yield* llm.makeDecision({
      context: `
        This is patient ${state.patient_id} whom I've been monitoring since ${state.monitoring_since}.
        
        Personal Baseline:
        - Typical HR: ${state.learned_patterns.personal_baseline.heart_rate}
        - Typical BP: ${state.learned_patterns.personal_baseline.blood_pressure}
        
        Current Observation:
        ${new_observation}
        
        Deviation from Baseline:
        ${deviation_from_baseline}
        
        Past Similar Situations for This Patient:
        ${past_similar.map(p => `- ${p.observation} → ${p.outcome}`).join("\n")}
        
        What I've Learned About This Patient:
        - Responds well to: ${state.learned_patterns.effective_treatments.join(", ")}
        - Watch out for: ${state.learned_patterns.concerning_patterns.join(", ")}
      `,
      task: "Assess significance and recommend action for THIS specific patient"
    })
    
    return decision
  })
```

#### 2.2 Multi-Specialist Coordination

**Pattern**: Care coordinator orchestrates multiple specialists working on same patient.

```typescript
// Pattern: Hub-and-Spoke Coordination
// Care Coordinator = Hub
// Specialists = Spokes
// Coordinator synthesizes and resolves conflicts

const coordinateMultiSpecialistCare = (
  coordinator_state: CareCoordinatorState,
  patient_condition: ComplexCondition
) =>
  Effect.gen(function* () {
    // 1. Identify needed specialists
    const needed_specialists = determineNeededSpecialties(patient_condition)
    
    // 2. Request assessments from all concurrently
    const assessments = yield* Effect.all(
      needed_specialists.map(specialist =>
        requestSpecialistAssessment(specialist, patient_condition)
      ),
      { concurrency: "unbounded" }
    )
    
    // 3. Detect conflicts
    const conflicts = detectConflicts(assessments)
    
    // 4. Resolve conflicts through coordinator reasoning
    const resolutions = yield* Effect.forEach(
      conflicts,
      conflict => resolveConflict(coordinator_state, conflict),
      { concurrency: 1 }  // Sequential resolution
    )
    
    // 5. Synthesize coherent plan
    const unified_plan = yield* synthesizePlan(
      assessments,
      resolutions,
      coordinator_state.active_theories
    )
    
    return unified_plan
  })

// Example: Resolving medication conflict
const resolveConflict = (
  coordinator_state: CareCoordinatorState,
  conflict: Conflict
) =>
  Effect.gen(function* () {
    // Conflict: Cardiologist recommends beta-blocker
    //          Pulmonologist says beta-blocker may worsen asthma
    
    const resolution = yield* llm.resolveConflict({
      context: `
        Conflict Between Specialists:
        
        ${conflict.specialist_1.specialty}: ${conflict.specialist_1.recommendation}
        Reasoning: ${conflict.specialist_1.rationale}
        
        ${conflict.specialist_2.specialty}: ${conflict.specialist_2.concern}
        Reasoning: ${conflict.specialist_2.rationale}
        
        Patient Context:
        - Primary conditions: ${coordinator_state.patient_profile.active_conditions}
        - Care goals: ${coordinator_state.patient_profile.care_goals}
        - Patient preferences: ${coordinator_state.patient_profile.preferences}
        
        My Current Theory:
        ${coordinator_state.active_theories.get(conflict.domain)}
      `,
      task: "Resolve this conflict in a way that optimizes patient care while respecting both specialists' concerns"
    })
    
    // Update affected theories
    yield* updateTheories(coordinator_state, conflict, resolution)
    
    return resolution
  })
```

#### 2.3 Safety-Critical Event Handling

**Pattern**: Guardian actors have override authority for safety.

```typescript
// Pattern: Guardian Override
// Safety Guardian can block any decision that violates safety

const guardianOverridePattern = (
  proposed_action: ClinicalAction
) =>
  Effect.gen(function* () {
    const safety_guardian = yield* SafetyGuardian
    
    // All clinical actions must pass safety validation
    const validation = yield* safety_guardian.validate(proposed_action)
    
    if (!validation.approved) {
      // Guardian blocks action
      yield* alertClinicians({
        message: `Action blocked by Safety Guardian: ${validation.reason}`,
        severity: "critical",
        action: proposed_action,
        alternative: validation.suggested_alternative
      })
      
      // Log intervention
      yield* recordSafetyIntervention({
        action: proposed_action,
        reason: validation.reason,
        timestamp: DateTime.now()
      })
      
      return Effect.fail(new SafetyViolationError(validation.reason))
    }
    
    return Effect.succeed(validation)
  })

// Safety Guardian monitors all actors
const continuousSafetyMonitoring = Effect.gen(function* () {
  const safety_guardian = yield* SafetyGuardian
  
  // Subscribe to all clinical actor states
  const actor_states = yield* getAllClinicalActorStates()
  
  yield* Effect.forEach(
    actor_states,
    actor_state => {
      const changes = SubscriptionRef.changes(actor_state)
      
      return Stream.runForEach(changes, state =>
        Effect.gen(function* () {
          // Check for safety violations in real-time
          const violations = yield* checkForSafetyViolations(state)
          
          if (violations.length > 0) {
            // Immediate intervention
            yield* Effect.forEach(
              violations,
              violation => safety_guardian.intervene(violation),
              { concurrency: 1 }
            )
          }
        })
      ).pipe(Effect.fork)  // Run in background
    },
    { concurrency: "unbounded" }
  )
})
```

#### 2.4 Regulatory Compliance Monitoring

**Pattern**: Compliance actor ensures all actions meet regulatory requirements.

```typescript
class RegulatoryComplianceActor extends Entity.make(
  "RegulatoryCompliance",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ComplianceMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<ComplianceState>()
    
    type ComplianceState = {
      // Regulatory requirements
      active_regulations: Regulation[]
      
      // Compliance monitoring
      compliance_checks: Array<{
        requirement: string
        last_check: DateTime
        status: "compliant" | "non_compliant" | "at_risk"
        evidence: string[]
      }>
      
      // Violations and remediation
      violations: Array<{
        date: DateTime
        requirement: string
        description: string
        severity: string
        remediation_plan: string
        status: "open" | "in_progress" | "resolved"
      }>
    }
    
    // Pattern: All significant actions logged for audit
    const ensureAuditTrail = (action: ClinicalAction) =>
      Effect.gen(function* () {
        yield* Ref.update(stateRef, state => ({
          ...state,
          audit_log: [
            ...state.audit_log,
            {
              timestamp: DateTime.now(),
              action: action.type,
              actor: action.actor_id,
              patient: action.patient_id,
              details: action.details,
              outcome: action.outcome
            }
          ]
        }))
      })
    
    return yield* match(msg)
      .with({ _tag: "ValidateCompliance" }, msg =>
        handleComplianceValidation(stateRef, msg)
      )
      .with({ _tag: "RecordAction" }, msg =>
        ensureAuditTrail(msg.action)
      )
      .exhaustive()
  })
)
```

---

### 3. Example State

**Complete state structure for healthcare domain actors**:

```typescript
// Comprehensive healthcare actor state examples

type HealthcareActorStates = {
  // Specialist State
  CardiacSpecialist: {
    patient_id: string
    monitoring_since: DateTime
    
    patient_profile: {
      age: number
      sex: "M" | "F"
      cardiac_history: string[]
      risk_factors: string[]
      family_history: string[]
    }
    
    current_assessment: {
      primary_diagnosis: Option.Option<{
        condition: string
        icd_code: string
        confidence: number
        onset_date: DateTime
      }>
      severity: "stable" | "worsening" | "improving" | "critical"
      active_concerns: Array<{
        concern: string
        severity: string
        monitoring_plan: string
      }>
    }
    
    recent_observations: Array<{
      date: DateTime
      type: "ECG" | "biomarker" | "imaging" | "physical_exam"
      finding: string
      significance: "routine" | "notable" | "concerning" | "critical"
      pattern_matched: Option.Option<string>
      action_taken: Option.Option<string>
    }>  // Last 5 only
    
    active_monitoring: Map<string, {
      parameter: string
      target_range: string
      current_value: Option.Option<number>
      trend: "improving" | "stable" | "worsening"
      alert_threshold: string
      last_checked: DateTime
      next_check: DateTime
    }>
    
    learned_patterns: {
      personal_ecg_baseline: ECGBaseline
      typical_biomarker_ranges: Map<string, Range>
      medication_responses: Map<string, Response>
      symptom_patterns: SymptomPattern[]
    }
    
    performance_tracking: {
      diagnostic_accuracy_recent: number[]  // Last 20
      average_time_to_diagnosis: Duration
      false_positive_rate: number
      false_negative_rate: number
    }
  }
  
  // Care Coordinator State
  CareCoordinator: {
    patient_id: string
    coordinating_since: DateTime
    
    patient_profile: {
      demographics: {
        age: number
        sex: string
        ethnicity: string
        language: string
      }
      active_conditions: Array<{
        condition: string
        diagnosed: DateTime
        severity: string
        managing_specialist: Option.Option<string>
      }>
      care_goals: Array<{
        goal: string
        priority: number
        target_date: DateTime
        progress: number  // 0-100
      }>
      preferences: {
        treatment_preferences: string[]
        communication_preferences: string[]
        cultural_considerations: string[]
      }
    }
    
    active_theories: Map<string, {
      domain: string
      theory: string
      conviction_strength: number  // 0-1
      supporting_evidence: Array<{
        evidence: string
        weight: number
        source: string
        date: DateTime
      }>
      contradicting_evidence: Array<{
        evidence: string
        concern: string
        source: string
        date: DateTime
      }>
      last_updated: DateTime
      requires_revision: boolean
    }>
    
    recent_strategic_decisions: Array<{
      date: DateTime
      decision: string
      rationale: string
      specialists_consulted: string[]
      expected_outcome: string
      confidence: number
      status: "monitoring" | "succeeded" | "failed" | "revised"
      actual_outcome: Option.Option<string>
      lessons_learned: Option.Option<string>
    }>  // Last 10 only
    
    active_specialists: Map<string, {
      specialist_id: string
      specialty: string
      engaged_since: DateTime
      current_assessment: string
      recommendations: Array<{
        recommendation: string
        priority: string
        rationale: string
        date: DateTime
      }>
      confidence_in_specialist: number
      collaboration_quality: number
    }>
    
    current_care_plan: {
      primary_strategy: string
      last_updated: DateTime
      active_treatments: Array<{
        treatment: string
        start_date: DateTime
        expected_duration: Duration
        responsible_specialist: string
        monitoring_plan: string
      }>
      monitoring_schedule: Array<{
        what: string
        frequency: string
        responsible: string
        next_due: DateTime
      }>
      next_major_decision_point: DateTime
      contingency_plans: Array<{
        scenario: string
        trigger: string
        action_plan: string
      }>
    }
    
    strategic_priorities: Array<{
      priority: string
      importance: "critical" | "high" | "medium"
      owner: Option.Option<string>
      target_date: DateTime
      status: string
      progress: number
      milestones: Array<{
        milestone: string
        target_date: DateTime
        completed: boolean
      }>
    }>
    
    overall_status: {
      health_trajectory: "improving" | "stable" | "declining" | "critical"
      trajectory_confidence: number
      key_risks: Array<{
        risk: string
        probability: number
        impact: string
        mitigation: string
      }>
      key_opportunities: Array<{
        opportunity: string
        benefit: string
        requirements: string[]
      }>
      next_major_decision: string
      decision_timeline: DateTime
    }
  }
  
  // Safety Guardian State
  SafetyGuardian: {
    patient_id: string
    guarding_since: DateTime
    
    safety_status: {
      overall_risk_level: "low" | "medium" | "high" | "critical"
      risk_score: number
      last_assessment: DateTime
      active_safety_concerns: Array<{
        concern: string
        identified: DateTime
        severity: string
        mitigation_in_place: boolean
      }>
    }
    
    recent_incidents: Array<{
      date: DateTime
      incident_type: string
      severity: "minor" | "moderate" | "severe" | "critical"
      description: string
      immediate_response: string
      root_cause: Option.Option<string>
      prevention_measures_added: string[]
    }>  // Last 10 only
    
    active_safety_watches: Map<string, {
      parameter: string
      concern: string
      threshold: string
      current_value: Option.Option<number>
      watching_since: DateTime
      escalation_policy: string
      auto_intervene: boolean
    }>
    
    learned_safety_boundaries: Map<string, {
      parameter: string
      soft_limit: number
      hard_limit: number
      learned_from_observations: number
      confidence: number
      last_violation: Option.Option<DateTime>
    }>
    
    current_restrictions: Array<{
      restriction: string
      reason: string
      imposed: DateTime
      expires: Option.Option<DateTime>
      can_override: boolean
      override_requires: string[]
    }>
    
    recent_interventions: Array<{
      date: DateTime
      intervention_type: "block" | "modify" | "escalate" | "alert"
      action_blocked: string
      reason: string
      alternative_suggested: Option.Option<string>
      outcome: string
    }>  // Last 20 only
  }
}
```

---

## B. Legal

### 1. Actor Types

Legal systems require actors for research, analysis, strategy, and case management.

#### 1.1 Case Law Researchers

**Purpose**: Deep expertise in legal precedent research across jurisdictions.

```typescript
class CaseLawResearcherActor extends Entity.make(
  "CaseLawResearcher",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ResearchMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<CaseLawResearcherState>()
    
    type CaseLawResearcherState = {
      researcher_id: string
      specialty: "case_law"
      active_since: DateTime
      
      // Research expertise
      jurisdictional_expertise: Array<{
        jurisdiction: Jurisdiction
        proficiency: number  // 0-1
        cases_researched: number
        success_rate: number
      }>
      
      // Active research projects
      active_research: Map<TaskId, {
        matter_id: string
        legal_issue: string
        jurisdiction: Jurisdiction
        started: DateTime
        status: "in_progress" | "pending_review" | "complete"
        progress: number
      }>
      
      // Research history (for learning)
      research_history: Array<{
        date: DateTime
        matter_id: string
        legal_issue: string
        jurisdiction: Jurisdiction
        strategy_used: Strategy
        cases_found: number
        quality_score: number
        lawyer_feedback: Option.Option<Feedback>
      }>  // Last 50 only
      
      // Learned research patterns
      learned_strategies: Map<IssueType, {
        effective_databases: string[]
        effective_search_terms: string[]
        typical_case_count_needed: number
        average_research_time: Duration
        success_rate: number
      }>
      
      // Database effectiveness tracking
      database_performance: Map<DatabaseId, {
        database: string
        queries_run: number
        relevant_results_rate: number
        average_response_time: Duration
        reliability: number
      }>
      
      // Citation network knowledge
      known_citation_patterns: Array<{
        jurisdiction: Jurisdiction
        issue_type: string
        authoritative_cases: string[]
        typical_precedent_chain_length: number
      }>
      
      // Performance metrics
      performance: {
        average_research_quality: number
        research_efficiency: number  // Cases found per hour
        lawyer_satisfaction: number
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "ResearchRequest" }, msg =>
        handleResearchRequest(stateRef, msg)
      )
      .with({ _tag: "RefineSearch" }, msg =>
        handleSearchRefinement(stateRef, msg)
      )
      .with({ _tag: "LawyerFeedback" }, msg =>
        handleLawyerFeedback(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: Research request with learned strategies
const handleResearchRequest = (
  stateRef: Ref.Ref<CaseLawResearcherState>,
  msg: ResearchRequestMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* LegalResearchTools
    
    // 1. Select optimal research strategy based on learned patterns
    const issue_type = classifyLegalIssue(msg.legal_issue)
    const learned_strategy = state.learned_strategies.get(issue_type)
    
    const strategy = learned_strategy
      ? {
          databases: learned_strategy.effective_databases,
          search_terms: learned_strategy.effective_search_terms,
          expected_case_count: learned_strategy.typical_case_count_needed
        }
      : {
          databases: getDefaultDatabases(msg.jurisdiction),
          search_terms: extractKeyTerms(msg.legal_issue),
          expected_case_count: 10
        }
    
    // 2. Execute research using optimal databases
    const search_results = yield* Effect.all(
      strategy.databases.map(db =>
        tools.searchDatabase({
          database: db,
          query: msg.legal_issue,
          jurisdiction: msg.jurisdiction,
          search_terms: strategy.search_terms
        })
      ),
      { concurrency: 3 }
    )
    
    // 3. Find similar past research for this issue type
    const similar_research = state.research_history
      .filter(r => r.legal_issue.includes(msg.legal_issue.substring(0, 20)))
      .slice(0, 5)
    
    // 4. Request precedent chains from citation graph
    const citation_graph = yield* CitationGraphActor
    const precedent_chains = yield* Effect.all(
      search_results.flatMap(r => r.cases.slice(0, 3)).map(case_id =>
        citation_graph.send(case_id, {
          _tag: "FindPrecedentChain",
          legal_issue: msg.legal_issue,
          jurisdiction: msg.jurisdiction
        })
      ),
      { concurrency: 5 }
    )
    
    // 5. LLM analysis with all context
    const analysis = yield* llm.analyzeCaseLaw({
      context: `
        Legal Issue: ${msg.legal_issue}
        Jurisdiction: ${msg.jurisdiction}
        Matter Context: ${msg.matter_context}
        
        Search Strategy Used:
        - Databases: ${strategy.databases.join(", ")}
        - Terms: ${strategy.search_terms.join(", ")}
        
        Cases Found (${search_results.flatMap(r => r.cases).length} total):
        ${search_results.flatMap(r => r.cases).map(c => `
          - ${c.name} (${c.year})
            Holding: ${c.holding}
            Relevance: ${c.relevance_score}
        `).join("\n")}
        
        Precedent Chains:
        ${precedent_chains.map(chain => `
          Chain: ${chain.cases.map(c => c.name).join(" → ")}
          Authority Score: ${chain.authority_score}
        `).join("\n")}
        
        Similar Past Research:
        ${similar_research.map(r => `
          - ${r.legal_issue}: Found ${r.cases_found} cases, Quality ${r.quality_score}
            ${r.lawyer_feedback ? `Feedback: ${r.lawyer_feedback}` : ""}
        `).join("\n")}
      `,
      task: "Analyze these cases and provide actionable research summary for lawyer"
    })
    
    // 6. Update state with research record
    yield* Ref.update(stateRef, s => ({
      ...s,
      active_research: s.active_research.set(msg.task_id, {
        matter_id: msg.matter_id,
        legal_issue: msg.legal_issue,
        jurisdiction: msg.jurisdiction,
        started: DateTime.now(),
        status: "pending_review",
        progress: 100
      }),
      research_history: [
        ...s.research_history.slice(-49),
        {
          date: DateTime.now(),
          matter_id: msg.matter_id,
          legal_issue: msg.legal_issue,
          jurisdiction: msg.jurisdiction,
          strategy_used: strategy,
          cases_found: search_results.flatMap(r => r.cases).length,
          quality_score: 0,  // Updated after lawyer feedback
          lawyer_feedback: Option.none()
        }
      ]
    }))
    
    // 7. Submit for lawyer review
    yield* LawyerReviewActor.send({
      _tag: "SubmitForReview",
      matter_id: msg.matter_id,
      research: analysis,
      researcher_id: state.researcher_id,
      priority: msg.priority
    })
    
    return analysis
  })

// Learning from lawyer feedback
const handleLawyerFeedback = (
  stateRef: Ref.Ref<CaseLawResearcherState>,
  msg: LawyerFeedbackMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    
    // Find the research being reviewed
    const research = state.research_history.find(
      r => r.matter_id === msg.matter_id && r.date.equals(msg.research_date)
    )
    
    if (research) {
      // Update research record with feedback
      research.quality_score = msg.feedback.quality_score
      research.lawyer_feedback = Option.some(msg.feedback)
      
      // Learn from feedback
      const issue_type = classifyLegalIssue(research.legal_issue)
      const current_strategy = state.learned_strategies.get(issue_type)
      
      if (msg.feedback.quality_score > 0.8) {
        // Good research - reinforce this strategy
        if (current_strategy) {
          current_strategy.success_rate = 
            (current_strategy.success_rate * 0.9) + (0.1 * msg.feedback.quality_score)
        } else {
          // New successful strategy discovered
          state.learned_strategies.set(issue_type, {
            effective_databases: [research.strategy_used.databases[0]],
            effective_search_terms: research.strategy_used.search_terms,
            typical_case_count_needed: research.cases_found,
            average_research_time: DateTime.now().minus(research.date),
            success_rate: msg.feedback.quality_score
          })
        }
      } else if (msg.feedback.quality_score < 0.5) {
        // Poor research - learn what not to do
        if (msg.feedback.improvement_suggestions) {
          // Extract lessons
          yield* recordLessonsLearned({
            issue_type,
            what_didnt_work: research.strategy_used,
            why: msg.feedback.reason,
            suggestions: msg.feedback.improvement_suggestions
          })
        }
      }
      
      yield* Ref.set(stateRef, state)
    }
  })
```

#### 1.2 Statutory Analysts

**Purpose**: Expertise in statutory interpretation and regulatory analysis.

```typescript
class StatutoryAnalystActor extends Entity.make(
  "StatutoryAnalyst",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: StatutoryMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<StatutoryAnalystState>()
    
    type StatutoryAnalystState = {
      analyst_id: string
      specialty: "statutory_analysis"
      
      // Statutory expertise
      statute_knowledge: Map<Jurisdiction, {
        major_statutes: Statute[]
        recent_amendments: Amendment[]
        interpretation_history: InterpretationHistory[]
      }>
      
      // Active analyses
      active_analyses: Map<TaskId, {
        matter_id: string
        statute: string
        question: string
        status: string
      }>
      
      // Learned interpretation patterns
      learned_patterns: Map<StatuteType, {
        common_interpretive_issues: string[]
        effective_analysis_approaches: Approach[]
        relevant_legislative_history: HistorySource[]
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "AnalyzeStatute" }, msg =>
        handleStatutoryAnalysis(stateRef, msg)
      )
      .with({ _tag: "InterpretProvision" }, msg =>
        handleProvisionInterpretation(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.3 Treaty Interpreters

**Purpose**: Specialized expertise in international law and treaty interpretation.

```typescript
class TreatyInterpreterActor extends Entity.make(
  "TreatyInterpreter",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: TreatyMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<TreatyInterpreterState>()
    
    type TreatyInterpreterState = {
      interpreter_id: string
      specialty: "treaty_interpretation"
      
      // Treaty expertise
      treaty_knowledge: Map<TreatyId, {
        treaty: Treaty
        signatories: Country[]
        reservations: Reservation[]
        interpretation_principles: Principle[]
        case_law: CaseLawReference[]
      }>
      
      // Active interpretations
      active_work: Map<TaskId, {
        matter_id: string
        treaty: string
        article: string
        question: string
      }>
      
      // Vienna Convention expertise
      vienna_convention_principles: {
        ordinary_meaning: InterpretationGuidance
        context: InterpretationGuidance
        object_and_purpose: InterpretationGuidance
        supplementary_means: InterpretationGuidance
      }
      
      // Learned patterns
      learned_interpretation_patterns: Map<TreatyType, {
        common_disputes: string[]
        resolution_approaches: Approach[]
        relevant_authorities: Authority[]
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "InterpretTreaty" }, msg =>
        handleTreatyInterpretation(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.4 Matter Coordinators

**Purpose**: Overall case/matter strategy and legal team coordination.

```typescript
class MatterCoordinatorActor extends Entity.make(
  "MatterCoordinator",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: MatterMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<MatterCoordinatorState>()
    
    type MatterCoordinatorState = {
      matter_id: string
      client_id: string
      matter_type: "litigation" | "transactional" | "advisory"
      opened: DateTime
      status: "active" | "on_hold" | "closed"
      
      // Matter context (accumulated over time)
      matter_context: {
        jurisdiction: Jurisdiction
        legal_issues: LegalIssue[]
        key_facts: Fact[]
        applicable_law: Law[]
        opposing_parties: Party[]
      }
      
      // Research accumulation
      research_history: Array<{
        date: DateTime
        researcher: string
        topic: string
        findings: string
        quality: number
        relevance_to_matter: number
      }>
      
      // Legal strategy (working theories)
      active_legal_theories: Map<IssueId, {
        theory: string
        strength: number  // 0-1
        supporting_authority: Authority[]
        weaknesses: string[]
        counter_arguments: string[]
        last_updated: DateTime
      }>
      
      // Strategic decisions
      strategic_decisions: Array<{
        date: DateTime
        decision: string
        rationale: string
        expected_outcome: string
        actual_outcome: Option.Option<string>
      }>
      
      // Team coordination
      assigned_lawyers: Array<{
        lawyer_id: string
        role: string
        assignments: Assignment[]
      }>
      
      // Deadlines and milestones
      critical_deadlines: Array<{
        deadline: DateTime
        description: string
        responsible: string
        status: "upcoming" | "at_risk" | "completed" | "missed"
      }>
      
      // Case strategy
      current_strategy: {
        primary_approach: string
        alternative_approaches: string[]
        success_probability: number
        risks: Risk[]
        opportunities: Opportunity[]
        next_major_decision: string
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "NewResearchTask" }, msg =>
        handleResearchTaskCoordination(stateRef, msg)
      )
      .with({ _tag: "UpdateStrategy" }, msg =>
        handleStrategyUpdate(stateRef, msg)
      )
      .with({ _tag: "CoordinateResearch" }, msg =>
        handleResearchCoordination(stateRef, msg)
      )
      .exhaustive()
  })
)
```

---

### 2. Key Patterns

Legal-specific patterns for research, case management, and strategy.

#### 2.1 Matter-Centric Organization

**Pattern**: Each matter is a persistent actor that accumulates all case-specific knowledge.

```typescript
// Pattern: Matter as Knowledge Repository
// All research, strategy, and decisions accumulate in matter actor
// Provides complete context for any new research or strategic decision

const matterCentricPattern = (matter_id: string) =>
  Effect.gen(function* () {
    // Matter actor persists for entire case lifecycle
    const matter = yield* MatterActor.get(matter_id)
    const state = yield* matter.getState()
    
    // All research references matter context
    const research_request = {
      matter_id,
      // Research informed by accumulated knowledge
      previous_research: state.research_history,
      active_theories: state.active_legal_theories,
      key_facts: state.matter_context.key_facts,
      applicable_law: state.matter_context.applicable_law
    }
    
    // Research results accumulate in matter
    const results = yield* CaseLawResearcher.research(research_request)
    yield* matter.accumulateResearch(results)
    
    // Strategic decisions reference full matter history
    const strategic_decision = yield* llm.makeStrategicDecision({
      context: `
        Matter: ${state.matter_id} (${state.matter_type})
        Client: ${state.client_id}
        
        Complete Research History:
        ${state.research_history.map(r => `- ${r.topic}: ${r.findings}`).join("\n")}
        
        Legal Theories:
        ${Array.from(state.active_legal_theories.entries()).map(([id, theory]) => `
          - ${theory.theory} (strength: ${theory.strength})
            Supporting: ${theory.supporting_authority.length} authorities
            Weaknesses: ${theory.weaknesses.join(", ")}
        `).join("\n")}
        
        Strategic Decisions Made:
        ${state.strategic_decisions.map(d => `
          ${d.date}: ${d.decision}
          Outcome: ${d.actual_outcome ?? "Pending"}
        `).join("\n")}
      `,
      task: "Make strategic decision with full matter context"
    })
  })
```

#### 2.2 Jurisdictional Expertise

**Pattern**: Jurisdiction-specific actors with deep knowledge of regional law.

```typescript
class BrazilianLawExpertActor extends Entity.make(
  "BrazilianLawExpert",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: JurisdictionalMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<BrazilianLawState>()
    
    type BrazilianLawState = {
      jurisdiction: "Brazil"
      
      // Brazil-specific legal knowledge
      court_hierarchy: {
        supreme: "STF"
        superior: "STJ"
        federal_regional: "TRF[]"
        state_appeals: "TJ[]"
        trial_courts: Court[]
      }
      
      // Major Brazilian statutes
      primary_sources: {
        constitution: "CF/88"
        civil_code: "Código Civil"
        labor_code: "CLT"
        civil_procedure: "CPC"
        consumer_code: "CDC"
      }
      
      // Brazilian citation patterns
      citation_conventions: {
        case_citation_format: string
        statute_citation_format: string
        abbreviations: Map<string, string>
      }
      
      // Effective databases for Brazil
      primary_databases: ["DataJud", "JusBrasil", "STF", "STJ"]
      
      // Learned Brazilian legal patterns
      brazilian_legal_patterns: {
        judicial_reasoning_styles: ReasoningStyle[]
        common_arguments: Argument[]
        effective_precedents: Precedent[]
        cultural_legal_considerations: Consideration[]
      }
    }
    
    // Brazilian-specific research strategy
    const brazilianResearchStrategy = (legal_issue: string) =>
      Effect.gen(function* () {
        const state = yield* Ref.get(stateRef)
        
        // Use Brazil-specific databases
        const search_results = yield* Effect.all(
          state.primary_databases.map(db =>
            searchBrazilianDatabase(db, legal_issue)
          ),
          { concurrency: 2 }
        )
        
        // Apply Brazilian citation conventions
        const formatted = applyBrazilianCitations(search_results)
        
        // Reference Brazilian legal reasoning patterns
        const analysis = analyzeThroughBrazilianLens(
          formatted,
          state.brazilian_legal_patterns
        )
        
        return analysis
      })
    
    return yield* match(msg)
      .with({ _tag: "ResearchBrazilianLaw" }, msg =>
        brazilianResearchStrategy(msg.legal_issue)
      )
      .exhaustive()
  })
)
```

#### 2.3 Citation Graph Analysis

**Pattern**: Persistent citation network actor for precedent chain discovery.

```typescript
class CitationGraphActor extends Entity.make(
  "CitationGraph",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: CitationGraphMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<CitationGraphState>()
    
    type CitationGraphState = {
      // Complete citation network
      nodes: Map<CaseId, {
        case_id: string
        name: string
        court: string
        year: number
        jurisdiction: Jurisdiction
        issues: string[]
        holding: string
      }>
      
      // Citation edges (who cites whom)
      citations: Map<CaseId, {
        cites: CaseId[]  // Cases this case cites
        cited_by: CaseId[]  // Cases that cite this case
        citation_context: Map<CaseId, string>  // Why cited
      }>
      
      // Authority scores (PageRank-like)
      authority_scores: Map<CaseId, number>
      
      // Precedent chains (precomputed for common issues)
      known_precedent_chains: Map<LegalIssue, {
        jurisdiction: Jurisdiction
        authoritative_chain: CaseId[]
        alternative_chains: CaseId[][]
        last_updated: DateTime
      }>
      
      // Recently added cases
      recent_additions: Array<{
        case_id: CaseId
        added: DateTime
        source: string
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "FindPrecedentChain" }, msg =>
        handlePrecedentChainDiscovery(stateRef, msg)
      )
      .with({ _tag: "UpdateGraph" }, msg =>
        handleGraphUpdate(stateRef, msg)
      )
      .with({ _tag: "ComputeAuthority" }, msg =>
        handleAuthorityComputation(stateRef, msg)
      )
      .exhaustive()
  })
)

// Finding authoritative precedent chain
const handlePrecedentChainDiscovery = (
  stateRef: Ref.Ref<CitationGraphState>,
  msg: FindPrecedentChainMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    
    // Check if we have precomputed chain for this issue
    const known_chain = state.known_precedent_chains.get(msg.legal_issue)
    if (known_chain && known_chain.jurisdiction === msg.jurisdiction) {
      return known_chain.authoritative_chain
    }
    
    // Compute precedent chain using graph algorithms
    const relevant_cases = Array.from(state.nodes.values())
      .filter(node =>
        node.jurisdiction === msg.jurisdiction &&
        node.issues.some(issue => issue.includes(msg.legal_issue))
      )
    
    // Build precedent chain using authority scores and citations
    const precedent_chain = buildAuthoritativePrecedentChain(
      relevant_cases,
      state.citations,
      state.authority_scores
    )
    
    // Cache result
    yield* Ref.update(stateRef, s => ({
      ...s,
      known_precedent_chains: s.known_precedent_chains.set(
        msg.legal_issue,
        {
          jurisdiction: msg.jurisdiction,
          authoritative_chain: precedent_chain,
          alternative_chains: [],
          last_updated: DateTime.now()
        }
      )
    }))
    
    return precedent_chain
  })

// Building precedent chain using graph structure
const buildAuthoritativePrecedentChain = (
  relevant_cases: CaseNode[],
  citations: Map<CaseId, CitationData>,
  authority_scores: Map<CaseId, number>
): CaseId[] => {
  // Algorithm: Find highest authority cases and their precedent lineage
  
  // 1. Sort by authority score
  const sorted_by_authority = relevant_cases
    .sort((a, b) =>
      (authority_scores.get(b.case_id) ?? 0) -
      (authority_scores.get(a.case_id) ?? 0)
    )
  
  // 2. Start with highest authority case
  const chain: CaseId[] = []
  const most_authoritative = sorted_by_authority[0]
  chain.push(most_authoritative.case_id)
  
  // 3. Walk backwards through citations to build precedent chain
  let current = most_authoritative.case_id
  while (true) {
    const citation_data = citations.get(current)
    if (!citation_data || citation_data.cites.length === 0) break
    
    // Find most authoritative cited case on same issue
    const cited_on_issue = citation_data.cites
      .filter(cited_id => {
        const cited_case = relevant_cases.find(c => c.case_id === cited_id)
        return cited_case !== undefined
      })
      .sort((a, b) =>
        (authority_scores.get(b) ?? 0) -
        (authority_scores.get(a) ?? 0)
      )
    
    if (cited_on_issue.length === 0) break
    
    current = cited_on_issue[0]
    chain.push(current)
    
    // Limit chain length
    if (chain.length >= 5) break
  }
  
  return chain
}
```

#### 2.4 Human-in-the-Loop Review

**Pattern**: Lawyer review actor coordinates async feedback and learning.

```typescript
class LawyerReviewCoordinatorActor extends Entity.make(
  "LawyerReviewCoordinator",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ReviewMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<LawyerReviewState>()
    
    type LawyerReviewState = {
      // Pending reviews queue
      pending_reviews: Map<ReviewId, {
        matter_id: string
        research: ResearchOutput
        researcher_id: string
        submitted: DateTime
        assigned_lawyer: LawyerId
        priority: Priority
        deadline: DateTime
      }>
      
      // Lawyer preferences (learned over time)
      lawyer_preferences: Map<LawyerId, {
        preferred_detail_level: "high" | "medium" | "summary"
        preferred_format: string
        common_feedback_themes: string[]
        average_review_time: Duration
        typical_quality_threshold: number
      }>
      
      // Feedback history
      feedback_history: Array<{
        review_id: ReviewId
        matter_id: string
        researcher_id: string
        lawyer_id: LawyerId
        quality_score: number
        feedback_type: "accept" | "revise" | "reject"
        comments: string
        incorporated: boolean
      }>
      
      // Quality tracking
      quality_metrics: {
        acceptance_rate_by_researcher: Map<ResearcherId, number>
        common_revision_reasons: Array<{
          reason: string
          frequency: number
        }>
        improvement_over_time: Array<{
          date: DateTime
          average_quality: number
        }>
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "SubmitForReview" }, msg =>
        handleReviewSubmission(stateRef, msg)
      )
      .with({ _tag: "LawyerFeedback" }, msg =>
        handleLawyerFeedback(stateRef, msg)
      )
      .exhaustive()
  })
)
```

---

### 3. Example State

**Complete legal domain actor state**:

```typescript
type LegalActorStates = {
  // Case Law Researcher State
  CaseLawResearcher: {
    researcher_id: string
    specialty: "case_law"
    active_since: DateTime
    
    jurisdictional_expertise: Array<{
      jurisdiction: Jurisdiction
      proficiency: number
      cases_researched: number
      success_rate: number
    }>
    
    active_research: Map<string, {
      matter_id: string
      legal_issue: string
      jurisdiction: Jurisdiction
      started: DateTime
      status: "in_progress" | "pending_review" | "complete"
      progress: number
    }>
    
    research_history: Array<{
      date: DateTime
      matter_id: string
      legal_issue: string
      jurisdiction: Jurisdiction
      strategy_used: {
        databases: string[]
        search_terms: string[]
        expected_case_count: number
      }
      cases_found: number
      quality_score: number
      lawyer_feedback: Option.Option<{
        quality_score: number
        comments: string
        revision_needed: boolean
      }>
    }>  // Last 50 only
    
    learned_strategies: Map<string, {
      issue_type: string
      effective_databases: string[]
      effective_search_terms: string[]
      typical_case_count_needed: number
      average_research_time: Duration
      success_rate: number
    }>
    
    database_performance: Map<string, {
      database: string
      queries_run: number
      relevant_results_rate: number
      average_response_time: Duration
      reliability: number
    }>
  }
  
  // Matter Coordinator State
  MatterCoordinator: {
    matter_id: string
    client_id: string
    matter_type: "litigation" | "transactional" | "advisory"
    opened: DateTime
    status: "active" | "on_hold" | "closed"
    
    matter_context: {
      jurisdiction: Jurisdiction
      legal_issues: Array<{
        issue: string
        status: "researching" | "resolved" | "ongoing"
        priority: number
      }>
      key_facts: Array<{
        fact: string
        relevance: string
        source: string
        date: DateTime
      }>
      applicable_law: Array<{
        law: string
        jurisdiction: Jurisdiction
        relevance: string
      }>
      opposing_parties: Array<{
        party: string
        role: string
        counsel: string
      }>
    }
    
    research_history: Array<{
      date: DateTime
      researcher: string
      topic: string
      findings: string
      quality: number
      relevance_to_matter: number
      incorporated_into_strategy: boolean
    }>  // Last 100
    
    active_legal_theories: Map<string, {
      issue_id: string
      theory: string
      strength: number
      supporting_authority: Array<{
        authority: string
        weight: number
        jurisdiction: Jurisdiction
      }>
      weaknesses: string[]
      counter_arguments: string[]
      last_updated: DateTime
      requires_more_research: boolean
    }>
    
    strategic_decisions: Array<{
      date: DateTime
      decision: string
      rationale: string
      alternatives_considered: string[]
      expected_outcome: string
      confidence: number
      actual_outcome: Option.Option<string>
      lessons_learned: Option.Option<string>
    }>  // Last 20
    
    assigned_lawyers: Array<{
      lawyer_id: string
      role: string
      since: DateTime
      assignments: Array<{
        task: string
        deadline: DateTime
        status: string
      }>
    }>
    
    critical_deadlines: Array<{
      deadline: DateTime
      description: string
      responsible: string
      status: "upcoming" | "at_risk" | "completed" | "missed"
      consequences_if_missed: string
    }>
    
    current_strategy: {
      primary_approach: string
      alternative_approaches: string[]
      success_probability: number
      key_risks: Array<{
        risk: string
        probability: number
        mitigation: string
      }>
      key_opportunities: Array<{
        opportunity: string
        value: string
        requirements: string[]
      }>
      next_major_decision: string
      next_major_milestone: DateTime
    }
  }
  
  // Citation Graph State
  CitationGraph: {
    nodes: Map<string, {
      case_id: string
      name: string
      court: string
      year: number
      jurisdiction: Jurisdiction
      issues: string[]
      holding: string
    }>
    
    citations: Map<string, {
      cites: string[]
      cited_by: string[]
      citation_context: Map<string, string>
    }>
    
    authority_scores: Map<string, number>
    
    known_precedent_chains: Map<string, {
      legal_issue: string
      jurisdiction: Jurisdiction
      authoritative_chain: string[]
      alternative_chains: string[][]
      last_updated: DateTime
      confidence: number
    }>
  }
}
```

---

## C. Finance

### 1. Actor Types

Financial systems require actors for portfolio management, risk assessment, trading, and compliance.

#### 1.1 Portfolio Managers

**Purpose**: Investment strategy development and portfolio optimization.

```typescript
class PortfolioManagerActor extends Entity.make(
  "PortfolioManager",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: PortfolioMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<PortfolioManagerState>()
    
    type PortfolioManagerState = {
      portfolio_id: string
      managing_since: DateTime
      
      // Portfolio composition
      current_holdings: Map<AssetId, {
        asset: Asset
        quantity: number
        average_cost: number
        current_value: number
        weight: number
        last_rebalance: DateTime
      }>
      
      // Investment thesis (working hypothesis)
      active_thesis: {
        market_view: string
        conviction_strength: number  // 0-1
        supporting_factors: Factor[]
        contradicting_factors: Factor[]
        last_updated: DateTime
      }
      
      // Strategic positioning
      current_positioning: {
        equity_allocation: number
        fixed_income_allocation: number
        alternative_allocation: number
        cash_allocation: number
        sector_weights: Map<Sector, number>
        geographic_weights: Map<Region, number>
        style_tilts: {
          growth_vs_value: number
          large_vs_small: number
        }
      }
      
      // Recent portfolio decisions
      recent_decisions: Array<{
        date: DateTime
        decision: string
        rationale: string
        positions_affected: AssetId[]
        expected_impact: string
        actual_impact: Option.Option<string>
      }>  // Last 20
      
      // Performance tracking
      performance: {
        return_ytd: number
        return_1y: number
        return_3y: number
        volatility: number
        sharpe_ratio: number
        max_drawdown: number
        tracking_error: number
        information_ratio: number
      }
      
      // Risk monitoring
      risk_metrics: {
        portfolio_beta: number
        portfolio_var_95: number
        concentration_risk: number
        sector_exposures: Map<Sector, number>
        factor_exposures: Map<Factor, number>
      }
      
      // Active monitoring
      watching: Map<WatchId, {
        parameter: string
        threshold: string
        reason: string
        action_if_triggered: string
      }>
      
      // Learned patterns
      learned_strategies: {
        successful_sector_rotations: Array<{
          from_sector: Sector
          to_sector: Sector
          trigger: string
          average_gain: number
        }>
        effective_rebalancing_rules: Array<{
          condition: string
          action: string
          success_rate: number
        }>
        optimal_position_sizing: Map<AssetClass, {
          typical_size: number
          max_size: number
          optimal_rebalance_threshold: number
        }>
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "RebalancePortfolio" }, msg =>
        handleRebalancing(stateRef, msg)
      )
      .with({ _tag: "UpdateThesis" }, msg =>
        handleThesisUpdate(stateRef, msg)
      )
      .with({ _tag: "AssessOpportunity" }, msg =>
        handleOpportunityAssessment(stateRef, msg)
      )
      .exhaustive()
  })
)

// Example: Rebalancing with learned strategies
const handleRebalancing = (
  stateRef: Ref.Ref<PortfolioManagerState>,
  msg: RebalanceMessage
) =>
  Effect.gen(function* () {
    const state = yield* Ref.get(stateRef)
    const tools = yield* PortfolioTools
    
    // 1. Analyze current positioning vs. thesis
    const alignment_analysis = yield* tools.analyzeThesisAlignment({
      current_holdings: state.current_holdings,
      active_thesis: state.active_thesis,
      target_positioning: deriveTargetFromThesis(state.active_thesis)
    })
    
    // 2. Calculate optimal rebalancing trades
    const rebalance_plan = yield* tools.calculateOptimalRebalance({
      current_holdings: state.current_holdings,
      target_weights: alignment_analysis.target_weights,
      constraints: {
        max_turnover: 0.20,  // 20% max turnover
        min_position_size: 10000,
        transaction_costs: 0.001
      }
    })
    
    // 3. Apply learned rebalancing strategies
    const learned_optimizations = applyLearnedStrategies(
      rebalance_plan,
      state.learned_strategies.effective_rebalancing_rules
    )
    
    // 4. Risk check with risk manager
    const risk_validation = yield* RiskManagerActor.validateTrades({
      portfolio_id: state.portfolio_id,
      proposed_trades: learned_optimizations.trades,
      current_risk: state.risk_metrics
    })
    
    if (!risk_validation.approved) {
      return {
        status: "blocked",
        reason: risk_validation.reason,
        revised_plan: risk_validation.suggested_alternative
      }
    }
    
    // 5. Execute trades
    const execution_results = yield* executeRebalanceTrades(
      learned_optimizations.trades
    )
    
    // 6. Update state with new positions
    yield* Ref.update(stateRef, s => ({
      ...s,
      current_holdings: updateHoldingsAfterRebalance(
        s.current_holdings,
        execution_results
      ),
      recent_decisions: [
        ...s.recent_decisions.slice(-19),
        {
          date: DateTime.now(),
          decision: "Portfolio rebalance",
          rationale: alignment_analysis.rationale,
          positions_affected: learned_optimizations.trades.map(t => t.asset_id),
          expected_impact: learned_optimizations.expected_impact,
          actual_impact: Option.none()
        }
      ]
    }))
    
    return {
      status: "executed",
      trades: execution_results,
      new_positioning: calculateNewPositioning(state.current_holdings)
    }
  })
```

#### 1.2 Risk Assessors

**Purpose**: Portfolio risk monitoring and limit enforcement.

```typescript
class RiskAssessorActor extends Entity.make(
  "RiskAssessor",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: RiskMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<RiskAssessorState>()
    
    type RiskAssessorState = {
      portfolio_id: string
      assessing_since: DateTime
      
      // Current risk status
      current_risk: {
        overall_risk_level: "low" | "medium" | "high" | "excessive"
        risk_score: number
        last_assessment: DateTime
      }
      
      // Risk limits (learned optimal boundaries)
      risk_limits: {
        max_portfolio_var: number
        max_sector_concentration: number
        max_single_position: number
        max_leverage: number
        max_tracking_error: number
      }
      
      // Active risk monitoring
      active_watches: Map<WatchId, {
        metric: string
        current_value: number
        threshold: number
        status: "normal" | "warning" | "breach"
        since: DateTime
      }>
      
      // Recent risk events
      recent_risk_events: Array<{
        date: DateTime
        event_type: "breach" | "near_breach" | "elevated_risk"
        metric: string
        value: number
        action_taken: string
      }>
      
      // Learned risk patterns
      learned_risk_indicators: {
        early_warning_signals: Array<{
          signal: string
          lead_time: Duration
          reliability: number
        }>
        typical_risk_evolution: Array<{
          market_condition: string
          typical_var: number
          typical_vol: number
        }>
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "AssessRisk" }, msg =>
        handleRiskAssessment(stateRef, msg)
      )
      .with({ _tag: "ValidateTrade" }, msg =>
        handleTradeValidation(stateRef, msg)
      )
      .with({ _tag: "MonitorLimits" }, msg =>
        handleLimitMonitoring(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.3 Trading Specialists

**Purpose**: Optimal trade execution and market microstructure expertise.

```typescript
class TradingSpecialistActor extends Entity.make(
  "TradingSpecialist",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: TradingMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<TradingSpecialistState>()
    
    type TradingSpecialistState = {
      trader_id: string
      specialty: "execution"
      
      // Active executions
      active_orders: Map<OrderId, {
        order: Order
        strategy: ExecutionStrategy
        started: DateTime
        progress: number
        filled: number
        average_price: number
      }>
      
      // Execution history (for learning)
      execution_history: Array<{
        date: DateTime
        order: Order
        strategy_used: ExecutionStrategy
        market_conditions: MarketConditions
        execution_quality: number  // vs. benchmark
        duration: Duration
      }>  // Last 100
      
      // Learned execution patterns
      learned_execution: {
        optimal_strategies: Map<OrderProfile, {
          strategy: ExecutionStrategy
          typical_quality: number
          typical_duration: Duration
        }>
        market_impact_models: Map<Asset, {
          typical_spread: number
          typical_depth: number
          impact_coefficient: number
        }>
      }
      
      // Real-time market awareness
      current_market_conditions: {
        volatility_regime: "low" | "medium" | "high"
        liquidity_conditions: "abundant" | "normal" | "scarce"
        spread_percentile: number
      }
    }
    
    return yield* match(msg)
      .with({ _tag: "ExecuteOrder" }, msg =>
        handleOrderExecution(stateRef, msg)
      )
      .with({ _tag: "OptimizeExecution" }, msg =>
        handleExecutionOptimization(stateRef, msg)
      )
      .exhaustive()
  })
)
```

#### 1.4 Compliance Monitors

**Purpose**: Regulatory compliance and reporting.

```typescript
class ComplianceMonitorActor extends Entity.make(
  "ComplianceMonitor",
  Schema.String,
  RecipientType.EntityType,
  (entityId, msg: ComplianceMessage) => Effect.gen(function* () {
    const stateRef = yield* Entity.state<ComplianceState>()
    
    type ComplianceState = {
      portfolio_id: string
      
      // Regulatory requirements
      applicable_regulations: Regulation[]
      
      // Compliance status
      compliance_checks: Array<{
        requirement: string
        status: "compliant" | "non_compliant" | "requires_review"
        last_check: DateTime
        next_check: DateTime
      }>
      
      // Violations and remediation
      violations: Array<{
        date: DateTime
        requirement: string
        severity: "minor" | "moderate" | "major"
        remediation_plan: string
        status: "open" | "resolved"
      }>
      
      // Reporting obligations
      reporting_schedule: Array<{
        report_type: string
        frequency: string
        next_due: DateTime
        status: "current" | "overdue"
      }>
    }
    
    return yield* match(msg)
      .with({ _tag: "CheckCompliance" }, msg =>
        handleComplianceCheck(stateRef, msg)
      )
      .with({ _tag: "ValidateTransaction" }, msg =>
        handleTransactionValidation(stateRef, msg)
      )
      .exhaustive()
  })
)
```

---

### 2. Key Patterns

Finance-specific patterns for investment management and risk control.

#### 2.1 Investment Thesis Maintenance

**Pattern**: Portfolio manager maintains evolving investment thesis with conviction tracking.

```typescript
// Pattern: Active Thesis with Evidence Tracking
// Portfolio decisions driven by conviction in thesis
// Conviction updated based on supporting/contradicting evidence

const thesisMaintenancePattern = (
  state: PortfolioManagerState,
  new_evidence: Evidence
) =>
  Effect.gen(function* () {
    const thesis = state.active_thesis
    
    // Evaluate if evidence supports or contradicts thesis
    const evaluation = yield* llm.evaluateEvidence({
      context: `
        Current Investment Thesis:
        ${thesis.market_view}
        Conviction: ${thesis.conviction_strength}
        
        Supporting Factors:
        ${thesis.supporting_factors.map(f => `- ${f.factor}: ${f.weight}`).join("\n")}
        
        Concerns:
        ${thesis.contradicting_factors.map(f => `- ${f.factor}: ${f.impact}`).join("\n")}
        
        New Evidence:
        ${new_evidence.description}
        Source: ${new_evidence.source}
        Reliability: ${new_evidence.reliability}
      `,
      task: "Does this evidence support or contradict our thesis? By how much?"
    })
    
    // Update conviction based on evidence
    if (evaluation.supports_thesis) {
      thesis.conviction_strength = Math.min(
        thesis.conviction_strength + (evaluation.strength * 0.1),
        1.0
      )
      thesis.supporting_factors.push({
        factor: new_evidence.description,
        weight: evaluation.strength,
        date: DateTime.now()
      })
    } else {
      thesis.conviction_strength = Math.max(
        thesis.conviction_strength - (evaluation.strength * 0.15),
        0.0
      )
      thesis.contradicting_factors.push({
        factor: new_evidence.description,
        impact: evaluation.strength,
        date: DateTime.now()
      })
    }
    
    // If conviction drops significantly, trigger thesis revision
    if (thesis.conviction_strength < 0.4) {
      yield* triggerThesisRevision(state.portfolio_id, thesis)
    }
    
    return thesis
  })
```

#### 2.2 Multi-Asset Coordination

**Pattern**: Portfolio manager coordinates specialist actors across asset classes.

```typescript
// Pattern: Asset Class Specialists Coordinated by Portfolio Manager
const multiAssetCoordinationPattern = (
  portfolio_manager: PortfolioManagerActor,
  rebalance_decision: RebalanceDecision
) =>
  Effect.gen(function* () {
    // Portfolio manager determines strategic allocation
    const strategic_allocation = yield* portfolio_manager.determineAllocation()
    
    // Delegate to specialist actors for implementation
    const equity_trades = yield* EquitySpecialist.implementAllocation({
      target_weight: strategic_allocation.equity,
      current_holdings: portfolio_manager.state.equity_holdings,
      constraints: strategic_allocation.constraints
    })
    
    const fixed_income_trades = yield* FixedIncomeSpecialist.implementAllocation({
      target_weight: strategic_allocation.fixed_income,
      current_holdings: portfolio_manager.state.fixed_income_holdings,
      constraints: strategic_allocation.constraints
    })
    
    // Coordinate execution timing
    const execution_plan = yield* coordinateExecution([
      equity_trades,
      fixed_income_trades
    ])
    
    return execution_plan
  })
```

#### 2.3 Risk-Return Optimization

**Pattern**: Risk assessor provides constraints, portfolio manager optimizes within bounds.

```typescript
// Pattern: Guardian Provides Boundaries, Manager Optimizes Within
const riskReturnOptimizationPattern = (
  portfolio_manager: PortfolioManagerActor,
  opportunity: InvestmentOpportunity
) =>
  Effect.gen(function* () {
    // Risk assessor defines acceptable risk bounds
    const risk_bounds = yield* RiskAssessor.calculateAcceptableBounds({
      current_risk: portfolio_manager.state.risk_metrics,
      risk_limits: portfolio_manager.state.risk_limits,
      market_conditions: getCurrentMarketConditions()
    })
    
    // Portfolio manager optimizes within bounds
    const optimal_allocation = yield* llm.optimizeAllocation({
      context: `
        Investment Opportunity:
        ${opportunity.description}
        Expected Return: ${opportunity.expected_return}
        Estimated Risk: ${opportunity.estimated_risk}
        
        Current Portfolio:
        ${describeCurrentPortfolio(portfolio_manager.state)}
        
        Risk Bounds (Must Stay Within):
        Max Total Risk (VaR): ${risk_bounds.max_var}
        Max Position Size: ${risk_bounds.max_position_size}
        Max Sector Concentration: ${risk_bounds.max_sector_concentration}
        
        Investment Thesis:
        ${portfolio_manager.state.active_thesis.market_view}
        Conviction: ${portfolio_manager.state.active_thesis.conviction_strength}
      `,
      task: "Determine optimal position size that maximizes expected return while staying within risk bounds"
    })
    
    // Validate with risk assessor
    const validation = yield* RiskAssessor.validateAllocation({
      proposed_allocation: optimal_allocation,
      risk_bounds: risk_bounds
    })
    
    if (!validation.approved) {
      // Adjust allocation to meet risk constraints
      const adjusted = yield* adjustForRiskConstraints(
        optimal_allocation,
        validation.violations
      )
      return adjusted
    }
    
    return optimal_allocation
  })
```

#### 2.4 Regulatory Adherence

**Pattern**: Compliance monitor validates all transactions before execution.

```typescript
// Pattern: All Transactions Validated by Compliance
const regulatoryAdherencePattern = (
  proposed_transaction: Transaction
) =>
  Effect.gen(function* () {
    const compliance = yield* ComplianceMonitor
    
    // All transactions must pass compliance checks
    const validation = yield* compliance.validateTransaction({
      transaction: proposed_transaction,
      portfolio_state: getCurrentPortfolioState(),
      applicable_regulations: getApplicableRegulations()
    })
    
    if (!validation.compliant) {
      // Block transaction
      yield* logComplianceViolation({
        transaction: proposed_transaction,
        violation: validation.violation,
        timestamp: DateTime.now()
      })
      
      return Effect.fail(
        new ComplianceViolationError(validation.violation)
      )
    }
    
    // Transaction approved
    return Effect.succeed(validation)
  })
```

---

### 3. Example State

**Complete finance domain actor state**:

```typescript
type FinanceActorStates = {
  // Portfolio Manager State
  PortfolioManager: {
    portfolio_id: string
    client_id: string
    managing_since: DateTime
    
    current_holdings: Map<string, {
      asset_id: string
      asset_class: "equity" | "fixed_income" | "alternative" | "cash"
      quantity: number
      average_cost: number
      current_price: number
      current_value: number
      weight: number
      last_rebalance: DateTime
    }>
    
    active_thesis: {
      market_view: string
      conviction_strength: number
      supporting_factors: Array<{
        factor: string
        weight: number
        source: string
        date: DateTime
      }>
      contradicting_factors: Array<{
        factor: string
        impact: number
        source: string
        date: DateTime
      }>
      last_updated: DateTime
      requires_revision: boolean
    }
    
    current_positioning: {
      equity_allocation: number
      fixed_income_allocation: number
      alternative_allocation: number
      cash_allocation: number
      sector_weights: Map<string, number>
      geographic_weights: Map<string, number>
      style_tilts: {
        growth_vs_value: number  // -1 to 1
        large_vs_small: number   // -1 to 1
      }
    }
    
    recent_decisions: Array<{
      date: DateTime
      decision: string
      decision_type: "rebalance" | "new_position" | "exit" | "size_adjustment"
      rationale: string
      positions_affected: string[]
      expected_impact: string
      actual_impact: Option.Option<{
        return_impact: number
        risk_impact: number
        outcome: string
      }>
    }>  // Last 20
    
    performance: {
      return_ytd: number
      return_1y: number
      return_3y: number
      volatility_annual: number
      sharpe_ratio: number
      max_drawdown: number
      tracking_error: number
      information_ratio: number
      last_updated: DateTime
    }
    
    risk_metrics: {
      portfolio_beta: number
      portfolio_var_95: number
      portfolio_cvar_95: number
      concentration_risk: number
      sector_exposures: Map<string, number>
      factor_exposures: Map<string, number>
    }
    
    watching: Map<string, {
      watch_id: string
      parameter: string
      current_value: number
      threshold: number
      reason: string
      action_if_triggered: string
      watching_since: DateTime
    }>
    
    learned_strategies: {
      successful_sector_rotations: Array<{
        from_sector: string
        to_sector: string
        trigger: string
        average_gain: number
        success_count: number
      }>
      effective_rebalancing_rules: Array<{
        condition: string
        action: string
        success_rate: number
        times_used: number
      }>
      optimal_position_sizing: Map<string, {
        asset_class: string
        typical_size_percent: number
        max_size_percent: number
        optimal_rebalance_threshold: number
      }>
    }
  }
  
  // Risk Assessor State
  RiskAssessor: {
    portfolio_id: string
    assessing_since: DateTime
    
    current_risk: {
      overall_risk_level: "low" | "medium" | "high" | "excessive"
      risk_score: number
      last_assessment: DateTime
      trend: "increasing" | "stable" | "decreasing"
    }
    
    risk_limits: {
      max_portfolio_var_95: number
      max_sector_concentration: number
      max_single_position: number
      max_leverage: number
      max_tracking_error: number
      max_drawdown: number
    }
    
    active_watches: Map<string, {
      metric: string
      current_value: number
      soft_limit: number
      hard_limit: number
      status: "normal" | "warning" | "breach"
      watching_since: DateTime
      alert_frequency: string
    }>
    
    recent_risk_events: Array<{
      date: DateTime
      event_type: "breach" | "near_breach" | "elevated_risk" | "risk_spike"
      metric: string
      value: number
      limit: number
      action_taken: string
      outcome: string
    }>  // Last 50
    
    learned_risk_indicators: {
      early_warning_signals: Array<{
        signal: string
        typical_lead_time: Duration
        reliability: number
        false_positive_rate: number
      }>
      typical_risk_by_regime: Map<string, {
        market_regime: string
        typical_var: number
        typical_volatility: number
        typical_correlation: number
      }>
    }
    
    stress_test_scenarios: Array<{
      scenario: string
      impact_on_var: number
      impact_on_value: number
      probability: number
    }>
  }
  
  // Trading Specialist State
  TradingSpecialist: {
    trader_id: string
    specialty: "execution"
    active_since: DateTime
    
    active_orders: Map<string, {
      order_id: string
      asset: string
      direction: "buy" | "sell"
      quantity: number
      strategy: "VWAP" | "TWAP" | "opportunistic" | "immediate"
      started: DateTime
      progress_percent: number
      filled_quantity: number
      average_fill_price: number
      remaining_quantity: number
    }>
    
    execution_history: Array<{
      date: DateTime
      order_id: string
      asset: string
      quantity: number
      strategy_used: string
      market_conditions: {
        volatility: number
        spread: number
        volume: number
      }
      execution_quality_vs_vwap: number
      execution_quality_vs_arrival: number
      duration: Duration
      total_cost_bps: number
    }>  // Last 100
    
    learned_execution: {
      optimal_strategies_by_order_profile: Map<string, {
        order_profile: string  // e.g., "large_buy_low_liquidity"
        optimal_strategy: string
        typical_quality_score: number
        typical_duration: Duration
        success_rate: number
      }>
      market_impact_models: Map<string, {
        asset: string
        typical_spread_bps: number
        typical_depth: number
        impact_coefficient: number
        confidence: number
      }>
    }
    
    current_market_conditions: {
      overall_volatility: "low" | "medium" | "high" | "extreme"
      liquidity_conditions: "abundant" | "normal" | "thin" | "scarce"
      average_spread_percentile: number
      market_direction: "up" | "down" | "flat"
      last_updated: DateTime
    }
    
    performance_metrics: {
      average_execution_quality: number
      cost_saved_vs_naive: number
      success_rate: number
      average_duration: Duration
    }
  }
}
```

---

This completes the domain-specific applications for Healthcare, Legal, and Finance. Each domain demonstrates how the actor patterns adapt to domain-specific requirements while maintaining the core principles of persistent expertise, learning, and coordinated intelligence.
