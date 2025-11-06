// Represents a single step in the detailed reasoning process.
class ReasoningStep {
  summary string @description("Principais descobertas, justificativa e processo de pensamento detalhado para esta etapa de análise específica. Deve ser abrangente.") @stream.with_state
  items_considered string[]? @description("Uma lista de conceitos jurídicos, termos, fatos, estatutos, casos ou princípios específicos identificados, considerados ou analisados nesta etapa.")
  // Default streaming for string[] means items may stream partially.
  // If you want each item in the list to be fully formed before appearing, you could use:
  // items_considered (string @stream.done)[]?
}

// Structured representation of the LLM's thought process.
class DetailedReasoning {
  // Ensure the structure of each reasoning step appears as soon as possible.
  analyze_legal_question ReasoningStep @description("Etapa 1: Análise da questão jurídica (questões principais, conceitos-chave, jurisdição, fatos cruciais, teorias jurídicas iniciais).") @stream.not_null
  consider_relevant_legal_principles ReasoningStep @description("Etapa 2: Consideração dos princípios jurídicos relevantes (direito constitucional, interpretações estatutárias, doutrinas jurídicas, contra-argumentos, interpretações específicas da jurisdição).") @stream.not_null
  formulate_search_queries_strategy ReasoningStep @description("Etapa 3: Estratégia para formular consultas de pesquisa (uso de operadores booleanos, frases exatas, curingas, operadores de proximidade, restrições de data, terminologia jurídica relevante).") @stream.not_null
  specify_expected_information_strategy ReasoningStep @description("Etapa 4: Abordagem para especificar quais informações são esperadas de cada consulta (jurisprudência, estatutos, princípios jurídicos, artigos acadêmicos).") @stream.not_null
  ensure_comprehensive_coverage_strategy ReasoningStep @description("Etapa 5: Plano para garantir que o conjunto de consultas forneça uma cobertura abrangente da questão jurídica, evitando redundâncias.") @stream.not_null
}

class SearchQueryItem {
  query_string string @description(#"
    A string de consulta de pesquisa formulada.
    Exemplo: '"Título VII" AND ("ação de emprego adversa" OR "tratamento díspar") AND "tribunal de circuito"'
  "#)
  expected_information string[] @description(#"
    Uma lista de tipos específicos de informações que se espera coletar usando esta consulta.
    Exemplo: [
      "Casos de tribunais de circuito interpretando o Título VII no contexto de ações de emprego adversas ou tratamento díspar.",
      "Elementos-chave necessários para estabelecer um caso prima facie de discriminação no emprego sob o Título VII.",
      "Exceções ou defesas notáveis a reivindicações do Título VII discutidas em precedentes relevantes."
    ]
  "#)
  // Stream each SearchQueryItem as a complete unit.
  @@stream.done
}

// Final output structure.
class LegalQueryAnalysis {
  reasoning DetailedReasoning @description("Processo de pensamento estruturado para analisar a questão jurídica e formular consultas de pesquisa, seguindo a análise de 5 etapas.")
  search_queries SearchQueryItem[] @description("Uma lista de 3 a 5 consultas de pesquisa eficazes, cada uma com sua string de consulta e informações esperadas.")
}
