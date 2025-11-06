// Represents a single document retrieved from a search query
class SearchResultItem {
  id string @description("Identificador único para este resultado de pesquisa, geralmente o URL ou um ID específico do Exa.")
  url string @description("O URL direto do resultado da pesquisa.")
  title string? @description("Título do documento ou da página da web.")
  source_name string @description("Nome do motor de busca ou fonte, por exemplo, 'Internet'.")
  snippet string? @description("Um trecho conciso ou resumo do conteúdo do documento. Frequentemente derivado dos destaques do Exa.")
  // highlights string[]? @description("Direct highlight snippets from Exa, if requested.") // Alternative to single snippet
  full_text string? @description("O conteúdo de texto completo do documento, se recuperado através do recurso de conteúdos do Exa.")
  published_date string? @description("Data de publicação estimada do documento (ex., AAAA-MM-DD) conforme fornecido pelo Exa.")
  retrieval_date string @description("Timestamp ISO8601 indicando quando este item foi recuperado pelo agente.")
  author string? @description("Autor do conteúdo, se fornecido pelo Exa.")
  score float? @description("Pontuação de relevância do Exa (0 a 1), se disponível.")
  original_query SearchQueryItem? @description("O SearchQueryItem do BAML que levou a este resultado.")
  // Store Exa's specific ID if BAML's 'id' field is used for the URL or another identifier
  metadata map<string, string>? @description("Metadados adicionais, por exemplo, {'exa_internal_id': 'valor_id_exa', 'exa_autoprompt': 'string_autoprompt_se_houver'}")
}
