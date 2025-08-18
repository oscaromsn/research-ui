class ResearchAssessment {
  is_sufficient bool @description("True if the current information is deemed sufficient to answer the legal question comprehensively.")
  assessment_summary string @description("Brief summary of why the research is or isn't sufficient.") @stream.with_state
  identified_gaps string[]? @description("Specific information gaps if research is insufficient.")
  next_action NextActionType @description("The recommended next action for the agent.")
  suggested_queries_for_refinement SearchQueryItem[]? @description("If next_action is REFINE_QUERIES or NEW_QUERIES, provide new/refined queries.")
  document_ids_for_deeper_analysis string[]? @description("If DEEPER_ANALYSIS, list IDs of SearchResultItem to re-analyze.")
  reasoning DetailedReasoning @description("LLM's thought process for this assessment.")
}
