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
        Summary: {{ topic.synthesis | default("No synthesis content.") }} {# Consider if full synthesis is needed here vs. a topic summary #}
      {% else %}
      No topics synthesized yet.
      {% endfor %}
      Unanswered Aspects: {{ current_synthesis.unanswered_aspects | default(["None identified."]) | join(", ") }}
      Emerging Questions: {{ current_synthesis.emerging_questions | default(["None identified."]) | join(", ") }}
    {% else %}
      No synthesis has been performed yet. This is likely the first assessment after initial query generation or if previous searches yielded no relevant documents.
    {% endif %}

    **Tasks for You:**
    1.  **Assess Sufficiency:** Based on all the above, is the current information sufficient to comprehensively answer the original legal question? Populate `is_sufficient`.
    2.  **Summarize Assessment:** Briefly explain your reasoning for sufficiency/insufficiency. Populate `assessment_summary`.
    3.  **Identify Gaps:** If not sufficient, list the specific information gaps. Populate `identified_gaps`.
    4.  **Recommend Next Action:** Choose the *single most appropriate* next action from the `NextActionType` enum. Populate `next_action`. The available actions are:
        - `REFINE_QUERIES`: If existing query approaches were generally good but need minor adjustments (e.g., add/remove terms, change operators).
        - `NEW_QUERIES`: If new research angles are needed or the initial queries were largely ineffective.
        - `DEEPER_ANALYSIS_OF_EXISTING_DOCS`: If relevant documents were found but require more thorough review or extraction of specific details not yet captured.
        - `GENERATE_REPORT`: If the information gathered is sufficient.
        - `REQUEST_HUMAN_REVIEW`: If you are stuck, the question is highly ambiguous, results are contradictory, or expert legal judgment beyond your current analytical capability is required.
    5.  **Provide Conditional Details (CRITICAL):**
        - If `next_action` is `REFINE_QUERIES` or `NEW_QUERIES`, you MUST populate the `suggested_queries_for_refinement` field with a list of `SearchQueryItem` objects.
        - If `next_action` is `DEEPER_ANALYSIS_OF_EXISTING_DOCS`, you MUST populate the `document_ids_for_deeper_analysis` field with the IDs of the `SearchResultItem`s that need re-analysis.
        - For other `next_action` types, these fields should be omitted or null.
    6.  **Reasoning:** Provide your detailed thought process for this assessment and plan, populating the `reasoning` field (using the `DetailedReasoning` structure). Explain *why* you chose the next action and *how* you identified gaps or formulated new queries/plans.

    {{ ctx.output_format }}
  "#
}