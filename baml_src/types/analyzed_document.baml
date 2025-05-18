// Represents the LLM's detailed analysis of a single search result
class AnalyzedDocument {
  search_result_id string @description("ID of the SearchResultItem being analyzed.")
  relevance_score int @description("A score from 1 (not relevant) to 10 (highly relevant) indicating the document's relevance to the original legal question.") @alias("relevance")
  confidence_score int @description("A score from 1 (low confidence) to 10 (high confidence) in the relevance assessment.") @alias("confidence")

  summary string @description("A concise summary of the document's key findings and holdings as they relate to the legal question.") @stream.with_state
  key_arguments_and_reasoning string[] @description("List of key legal arguments, judicial reasoning, or statutory interpretations found in the document.") @stream.with_state
  extracted_entities LegalEntity[] @description("Key legal entities (cases, statutes, persons, organizations) mentioned.")
  extracted_quotes string[] @description("Direct quotes from the document that are particularly pertinent.")
  counter_arguments_or_nuances string[]? @description("Any counter-arguments, dissenting opinions, or important nuances identified.")

  reasoning DetailedReasoning @description("LLM's thought process for analyzing this document.")
}