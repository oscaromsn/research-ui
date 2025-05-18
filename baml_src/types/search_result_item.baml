// Represents a single document retrieved from a search query
class SearchResultItem {
  id string @description("Unique identifier for this search result, e.g., URL or database ID.")
  source_name string @description("Name of the source, e.g., 'Westlaw', 'LexisNexis', 'Court Listener', 'Statutes.gov'.")
  title string @description("Title of the document, e.g., case name, statute title.")
  snippet string? @description("A short snippet or abstract of the document content.")
  full_text string? @description("The full text of the document, if available and retrieved.")
  retrieval_date string @description("ISO8601 date when this item was retrieved.")
  original_query SearchQueryItem? @description("The search query that yielded this result, if applicable.")
  metadata map<string, string>? @description("Other relevant metadata, e.g., {'court': '9th Cir.', 'citation': '123 Fd 456', 'date_decided': '2023-01-15'}.")
}