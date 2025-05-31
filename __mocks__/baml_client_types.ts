// Mock for BAML generated types

export interface SearchQueryItem {
  query_string: string;
  expected_information: string[];
}

export interface SearchResultItem {
  id: string;
  url: string;
  title?: string;
  source_name: string;
  snippet?: string;
  full_text?: string;
  published_date?: string;
  retrieval_date: string;
  author?: string;
  score?: number;
  original_query?: SearchQueryItem;
  metadata?: Record<string, string>;
}
