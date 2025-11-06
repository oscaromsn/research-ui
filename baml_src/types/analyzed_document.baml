// Represents the LLM's detailed analysis of a single search result
class AnalyzedDocument {
  search_result_id string @description("ID do SearchResultItem que está sendo analisado.")
  relevance_score int @description("Uma pontuação de 1 (não relevante) a 10 (altamente relevante) indicando a relevância do documento para a questão jurídica original.") @alias("relevance")
  confidence_score int @description("Uma pontuação de 1 (baixa confiança) a 10 (alta confiança) na avaliação de relevância.") @alias("confidence")
  summary string @description("Um resumo conciso das principais descobertas e decisões do documento relacionadas à questão jurídica.") @stream.with_state
  key_arguments_and_reasoning string[] @description("Lista dos principais argumentos jurídicos, raciocínio judicial ou interpretações estatutárias encontrados no documento.")
  extracted_entities LegalEntity[] @description("Principais entidades jurídicas (casos, estatutos, pessoas, organizações) mencionadas.")
  extracted_quotes string[] @description("Citações diretas do documento que são particularmente pertinentes.")
  counter_arguments_or_nuances string[]? @description("Quaisquer contra-argumentos, opiniões divergentes ou nuances importantes identificadas.")
  reasoning DetailedReasoning @description("Processo de pensamento do LLM para analisar este documento.")
}
