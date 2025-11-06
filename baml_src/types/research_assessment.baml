class ResearchAssessment {
  is_sufficient bool @description("Verdadeiro se as informações atuais forem consideradas suficientes para responder à questão jurídica de forma abrangente.")
  assessment_summary string @description("Breve resumo do motivo pelo qual a pesquisa é ou não suficiente.") @stream.with_state
  identified_gaps string[]? @description("Lacunas de informação específicas se a pesquisa for insuficiente.")
  next_action NextActionType @description("A próxima ação recomendada para o agente.")
  suggested_queries_for_refinement SearchQueryItem[]? @description("Se next_action for REFINE_QUERIES ou NEW_QUERIES, forneça consultas novas/refinadas.")
  document_ids_for_deeper_analysis string[]? @description("Se for DEEPER_ANALYSIS, liste os IDs de SearchResultItem para reanalisar.")
  reasoning DetailedReasoning @description("Processo de pensamento do LLM para esta avaliação.")
}
