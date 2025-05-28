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
    You are a managing legal researcher overseeing a research project.
    Your task is to review the progress, assess if the current information is sufficient to answer the original legal question, and plan the next steps.

    **Original Legal Question:**
    {{ original_legal_question }}

    **Initial Query Generation Reasoning (Summary):**
    {#
      If initial_queries_analysis.reasoning is too verbose, consider passing a summary instead.
      For example, if LegalQueryAnalysis had a field `reasoning_summary: string`, you could use:
      {{ initial_queries_analysis.reasoning_summary | default("No summary provided for initial query reasoning.") }}
      For now, we assume the LLM can handle the full reasoning structure if needed,
      or you manage its verbosity in the `DetailedReasoning` fields themselves.
      Let's just print the main summary of each step of the initial query reasoning for brevity in THIS prompt.
    #}
    1. Analyze Legal Question Summary: {{ initial_queries_analysis.reasoning.analyze_legal_question.summary | default("N/A") }}
    2. Consider Legal Principles Summary: {{ initial_queries_analysis.reasoning.consider_relevant_legal_principles.summary | default("N/A") }}
    3. Formulate Queries Strategy Summary: {{ initial_queries_analysis.reasoning.formulate_search_queries_strategy.summary | default("N/A") }}
    4. Specify Expected Info Strategy Summary: {{ initial_queries_analysis.reasoning.specify_expected_information_strategy.summary | default("N/A") }}
    5. Ensure Coverage Strategy Summary: {{ initial_queries_analysis.reasoning.ensure_comprehensive_coverage_strategy.summary | default("N/A") }}

    **Current Synthesis of Findings:**
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

    **Tasks for You:**
    1.  **Assess Sufficiency:** MANDATORY CRITERIA CHECK - You MUST evaluate each criterion explicitly:
        
        **Criterion 1 - Confidence Scores:** Look at the confidence scores above. Are they 7+ for key topics? Answer: [YES/NO]
        **Criterion 2 - Unanswered Aspects:** Look at the unanswered_aspects list above. Is it empty or contains only very minor items? Answer: [YES/NO]  
        **Criterion 3 - Emerging Questions:** Look at the emerging_questions list above. Is it empty or contains only non-critical items? Answer: [YES/NO]
        **Criterion 4 - Actionable Information:** Does the synthesis provide practical, actionable information to answer the core question? Answer: [YES/NO]
        
        **IF ALL FOUR ANSWERS ARE "YES", SET is_sufficient = true AND next_action = "GENERATE_REPORT"**
        
        **CRITICAL: For straightforward legal questions, if the core question can be answered with practical guidance (e.g., "What is the statute of limitations?" answered with specific time periods and key rules), this IS sufficient even if nuanced exceptions exist. Focus on whether a practitioner could take action based on the current information, not whether every possible edge case is covered.**
    2.  **Summarize Assessment:** Briefly explain your reasoning for sufficiency/insufficiency. Populate `assessment_summary`.
    3.  **Identify Gaps:** If not sufficient, list the specific information gaps. Populate `identified_gaps`.
    4.  **Recommend Next Action:** Follow this MANDATORY decision tree step-by-step:
        
        **STEP A: Check for extensive research indicators**
        Look at the Initial Query Generation Reasoning summaries above. Do they contain ANY of these phrases: "incomplete", "missing", "partial coverage", "current research incomplete", "need comprehensive", "homestead focus but missing", or similar?
        - If YES → Go to STEP B
        - If NO → Go to STEP C
        
        **STEP B: Extensive research detected - LIMITED OPTIONS ONLY**
        You may ONLY choose from:
        - `DEEPER_ANALYSIS_OF_EXISTING_DOCS` (if Supporting Documents exist)
        - `REQUEST_HUMAN_REVIEW` (if complexity suggests research limits reached)
        - `GENERATE_REPORT` (if somehow sufficient despite gaps)
        **YOU ARE FORBIDDEN from choosing `REFINE_QUERIES` or `NEW_QUERIES`**
        
        **STEP C: Normal decision process**
        Choose the *single most appropriate* next action from the `NextActionType` enum. Populate `next_action`. The available actions are:
        - `REFINE_QUERIES`: If existing query approaches were generally good but need minor adjustments (e.g., add/remove terms, change operators, narrow or broaden scope). Use this when the query topics are correct and jurisdiction-appropriate but need better targeting or precision. **DO NOT use if initial reasoning indicates extensive prior research effort or persistent gaps.**
        - `NEW_QUERIES`: If entirely new research angles are needed or the initial queries were largely ineffective and targeting wrong topics/concepts. **CHOOSE THIS when initial queries completely missed essential aspects like jurisdiction, legal domain, or core concepts. For example, if the question asks about New York law but initial queries were generic and didn't target New York at all, or if queries focused on wrong legal areas entirely. DO NOT use if extensive research has already been attempted.**
        - `DEEPER_ANALYSIS_OF_EXISTING_DOCS`: **CHOOSE THIS if you see Supporting Documents listed above AND any of these conditions: (1) confidence scores below 6/10, (2) synthesis mentions "surface-level", "lack sufficient detail", "without detailed analysis", or similar phrases, (3) the reasoning mentions "need detailed analysis" or "documents lack sufficient detail", (4) extensive research has been conducted but gaps remain and documents exist for re-analysis. When documents exist but are insufficiently analyzed, choose this over new queries. HOWEVER, do NOT choose this if the question itself involves complexity requiring specialized expertise (see REQUEST_HUMAN_REVIEW).**
        - `GENERATE_REPORT`: If the information gathered is sufficient.
        - `REQUEST_HUMAN_REVIEW`: **PRIORITIZE THIS when the question involves complex multi-jurisdictional issues, conflicting legal frameworks, strategic business decisions, or when initial reasoning indicates "complexity beyond automated analysis", "requires specialized expertise", or "automated research insufficient". ALSO choose this when extensive research has been conducted but significant gaps remain and the complexity suggests automated research has reached its limits. Choose this over DEEPER_ANALYSIS when the fundamental complexity lies in the question itself rather than document analysis quality.**
    5.  **Provide Conditional Details (CRITICAL):**
        - If `next_action` is `REFINE_QUERIES` or `NEW_QUERIES`, you MUST populate the `suggested_queries_for_refinement` field with a list of `SearchQueryItem` objects.
        - If `next_action` is `DEEPER_ANALYSIS_OF_EXISTING_DOCS`, you MUST populate the `document_ids_for_deeper_analysis` field with the specific document IDs from the "Supporting Documents" listed above that need re-analysis.
        - For other `next_action` types, these fields should be omitted or null.
    6.  **Reasoning:** Provide your detailed thought process for this assessment and plan, populating the `reasoning` field (using the `DetailedReasoning` structure). Explain *why* you chose the next action and *how* you identified gaps or formulated new queries/plans.

    {{ ctx.output_format }}
  "#
}