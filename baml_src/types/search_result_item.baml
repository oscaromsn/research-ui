// Represents a single document retrieved from a search query
class SearchResultItem {
  id string @description("Unique identifier for this search result, typically the URL or an Exa-specific ID.")
  url string @description("The direct URL of the search result.")
  title string? @description("Title of the document or webpage.")
  source_name string @description("Name of the search engine or source, e.g., 'Exa Search'.")
  snippet string? @description("A concise snippet or abstract of the document content. Often derived from Exa highlights.")
  // highlights string[]? @description("Direct highlight snippets from Exa, if requested.") // Alternative to single snippet
  full_text string? @description("The full text content of the document, if retrieved via Exa's contents feature.")
  published_date string? @description("Estimated publication date of the document (e.g., YYYY-MM-DD) as provided by Exa.")
  retrieval_date string @description("ISO8601 timestamp indicating when this item was retrieved by the agent.")
  author string? @description("Author of the content, if provided by Exa.")
  score float? @description("Relevance score from Exa (0 to 1), if available.")
  original_query SearchQueryItem? @description("The BAML SearchQueryItem that led to this result.")
  // Store Exa's specific ID if BAML's 'id' field is used for the URL or another identifier
  metadata map<string, string>? @description("Additional metadata, e.g., {'exa_internal_id': 'exa_id_value', 'exa_autoprompt': 'autoprompt_string_if_any'}")
}