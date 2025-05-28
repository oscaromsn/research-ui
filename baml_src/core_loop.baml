// For assessing research sufficiency and planning next steps
enum NextActionType {
  REFINE_QUERIES
  NEW_QUERIES
  DEEPER_ANALYSIS_OF_EXISTING_DOCS
  GENERATE_REPORT
  REQUEST_HUMAN_REVIEW
}

// 4. Assess Research Sufficiency and Plan Next Iteration
//    Purpose: Decides if more research is needed or if the agent can proceed to report generation.
function AssessResearchAndPlanNextSteps(
  original_legal_question: string,
  initial_queries_analysis: LegalQueryAnalysis,
  current_synthesis: OverallSynthesis?
) -> ResearchAssessment {
  client DecidesNextStep // Using a potentially faster/cheaper client for decision-making
  prompt #"
You are a managing legal researcher overseeing a research project. Your task is to review the progress, assess if the current information is sufficient to answer the original legal question, and plan the next steps. Follow these instructions carefully:

1. Review the original legal question:
<original_legal_question>
    {{ original_legal_question }}
</original_legal_question>

2. Review the initial query generation reasoning:
<initial_query_generation_reasoning>
    1. Analyze Legal Question Summary: {{ initial_queries_analysis.reasoning.analyze_legal_question.summary | default("N/A") }}
    2. Consider Legal Principles Summary: {{ initial_queries_analysis.reasoning.consider_relevant_legal_principles.summary | default("N/A") }}
    3. Formulate Queries Strategy Summary: {{ initial_queries_analysis.reasoning.formulate_search_queries_strategy.summary | default("N/A") }}
    4. Specify Expected Info Strategy Summary: {{ initial_queries_analysis.reasoning.specify_expected_information_strategy.summary | default("N/A") }}
    5. Ensure Coverage Strategy Summary: {{ initial_queries_analysis.reasoning.ensure_comprehensive_coverage_strategy.summary | default("N/A") }}
</initial_query_generation_reasoning>

3. Review the current synthesis of findings:
<current_synthesis_of_findings>
    {% if current_synthesis %}
      Key Synthesized Topics:
      {% for topic in current_synthesis.key_synthesized_topics %}
      {#
        Removed | truncate(150).
        If topic.synthesis is too long, the OverallSynthesis should ideally contain
        a briefer summary per topic, or your application code should prepare this.
        Alternatively, instruct the SynthesizeAllFindings function to make its topic.synthesis concise.
        For this assessment prompt, a very short excerpt or just the title might be enough.
      #}
      - {{ topic.topic_title }}: (Confidence: {{ topic.confidence_score }}/10)
        Summary: {{ topic.synthesis | default("No synthesis content.") }}
        Supporting Documents: {{ topic.supporting_document_ids | join(", ") }}
      {% else %}
      No topics synthesized yet.
      {% endfor %}
      Unanswered Aspects: {{ current_synthesis.unanswered_aspects | default(["None identified."]) | join(", ") }}
      Emerging Questions: {{ current_synthesis.emerging_questions | default(["None identified."]) | join(", ") }}
    {% else %}
      No synthesis has been performed yet. This is likely the first assessment after initial query generation or if previous searches yielded no relevant documents.
    {% endif %}
</current_synthesis_of_findings>

4. Assess Sufficiency:
MANDATORY: You MUST evaluate each criterion explicitly and state YES or NO for each:

a) Confidence Scores: Are they 7+ for key topics? Answer: [YES/NO]
b) Unanswered Aspects: Is the list empty or contains only very minor items? Answer: [YES/NO]
c) Emerging Questions: Is the list empty or contains only non-critical items? Answer: [YES/NO]
d) Actionable Information: Does the synthesis provide practical, actionable information to answer the core question? Answer: [YES/NO]

STRICT RULE: If ALL FOUR answers are "YES", you MUST set is_sufficient = true and next_action = "GENERATE_REPORT". 
DO NOT second-guess this rule. DO NOT add additional requirements beyond these four criteria.

CRITICAL SUFFICIENCY STANDARD: You are REQUIRED to follow ONLY the 4-step criteria above. Do NOT add additional legal analysis beyond those 4 criteria.

If the 4 criteria are met (confidence 7+, empty unanswered aspects, empty emerging questions, actionable info), the research IS SUFFICIENT regardless of what additional details you might personally want as a lawyer.

EXAMPLES OF SUFFICIENT SCENARIOS:
- Confidence scores 8-9/10 + empty unanswered_aspects + empty emerging_questions + core question answered = SUFFICIENT
- Basic legal rule provided + application guidance + high confidence = SUFFICIENT

FORBIDDEN: Do NOT require additional exceptions, edge cases, tolling doctrines, or comprehensive coverage if the 4 criteria are already met. Your job is assessment, not legal practice.

5. Summarize Assessment:
Briefly explain your reasoning for sufficiency/insufficiency. This will be used to populate the assessment_summary field.

6. Identify Gaps:
If not sufficient, list the specific information gaps. This will be used to populate the identified_gaps field.

7. Recommend Next Action:
Follow this MANDATORY decision tree step-by-step:

STEP A: Check for extensive research indicators
Look at the Initial Query Generation Reasoning summaries. Do they contain ANY of these phrases: "incomplete", "missing", "partial coverage", "current research incomplete", "need comprehensive", "homestead focus but missing", or similar?
- If YES → Go to STEP B
- If NO → Go to STEP C

STEP B: Extensive research detected - LIMITED OPTIONS ONLY
You may ONLY choose from:
- DEEPER_ANALYSIS_OF_EXISTING_DOCS (if Supporting Documents exist)
- REQUEST_HUMAN_REVIEW (if complexity suggests research limits reached)
- GENERATE_REPORT (if somehow sufficient despite gaps)
YOU ARE FORBIDDEN from choosing REFINE_QUERIES or NEW_QUERIES

STEP C: Normal decision process
First, evaluate the initial query effectiveness:

CHECK: Do the Initial Query Generation Reasoning summaries contain any of these ineffectiveness indicators?
- "too broad", "ineffective", "completely missed", "wrong approach", "fundamentally flawed", "inappropriate strategy"
- If YES → Choose NEW_QUERIES

CHECK: Do the Initial Query Generation Reasoning summaries suggest minor improvements needed?
- "need adjustment", "slightly off", "partially effective", "good direction but", "mostly correct but"
- If YES → Choose REFINE_QUERIES

If neither above applies, choose from:
- DEEPER_ANALYSIS_OF_EXISTING_DOCS: Choose this if Supporting Documents are listed AND any of these conditions: (1) confidence scores below 6/10, (2) synthesis mentions "surface-level" or similar phrases, (3) reasoning mentions "need detailed analysis", (4) extensive research has been conducted but gaps remain and documents exist for re-analysis. Do not choose this if the question involves complexity requiring specialized expertise.
- GENERATE_REPORT: If the information gathered is sufficient.
- REQUEST_HUMAN_REVIEW: Prioritize this for complex multi-jurisdictional issues, conflicting legal frameworks, strategic business decisions, or when initial reasoning indicates "complexity beyond automated analysis". Also choose this when extensive research has been conducted but significant gaps remain and complexity suggests automated research has reached its limits.

8. Provide Conditional Details:
- If next_action is REFINE_QUERIES or NEW_QUERIES, provide a list of SearchQueryItem objects for suggested_queries_for_refinement.
- If next_action is DEEPER_ANALYSIS_OF_EXISTING_DOCS, provide specific document IDs from the "Supporting Documents" for document_ids_for_deeper_analysis.
- For other next_action types, omit these fields.

9. Reasoning:
Provide your detailed thought process for this assessment and plan. Explain why you chose the next action and how you identified gaps or formulated new queries/plans. Use the ReasoningStep structure for each of these steps:
a) analyze_legal_question
b) consider_relevant_legal_principles
c) formulate_search_queries_strategy
d) specify_expected_information_strategy
e) ensure_comprehensive_coverage_strategy

10. Output Format:
Provide your final output in JSON format using the following schema:

{{ ctx.output_format }}

Your final output should consist of only the JSON object on the schema described above. Do not include any additional text, explanations, or formatting outside of this JSON structure.
  "#
}