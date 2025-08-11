import axios, { type AxiosResponse } from "axios";
import type { SearchQueryItem, SearchResultItem } from "../../baml_client/types";
import { getApiKey } from "../config";

// --- Interfaces for Exa API Response ---

interface ExaTextOptions {
  max_characters?: number;
  include_html_tags?: boolean;
}

interface ExaHighlightOptions {
  num_sentences?: number;
  highlights_per_url?: number;
  query?: string;
}

interface ExaContentsOptions {
  text?: boolean | ExaTextOptions;
  highlights?: boolean | ExaHighlightOptions;
}

interface ExaSearchRequestBody {
  query: string;
  num_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  start_crawl_date?: string;
  end_crawl_date?: string;
  start_published_date?: string;
  end_published_date?: string;
  type?: "keyword" | "neural" | "auto";
  contents?: ExaContentsOptions;
}

interface ExaApiResult {
  id: string;
  url: string;
  title?: string | null;
  author?: string | null;
  score?: number | null;
  publishedDate?: string | null;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
}

interface ExaSearchApiResponse {
  results: ExaApiResult[];
  autopromptString?: string | null;
  requestId?: string;
}

// --- Configuration ---

const EXA_API_BASE_URL = "https://api.exa.ai";

// --- Error Classes (Simplified) ---

export class ExaSearchError extends Error {
  constructor(message: string, public statusCode?: number, public query?: string) {
    super(message);
    this.name = "ExaSearchError";
  }
}

export class ExaAuthError extends ExaSearchError {
  constructor(message: string, query?: string) {
    super(message, 401, query);
    this.name = "ExaAuthError";
  }
}

export class ExaRateLimitError extends ExaSearchError {
  constructor(message: string, query?: string) {
    super(message, 429, query);
    this.name = "ExaRateLimitError";
  }
}

// --- Utility Functions ---

function validateApiKey(): string {
  const apiKey = getApiKey("EXA_API_KEY");
  
  if (!apiKey || apiKey.trim() === "") {
    throw new ExaAuthError("EXA_API_KEY environment variable is not set or is empty");
  }
  
  return apiKey;
}

function buildRequestBody(
  searchQuery: SearchQueryItem,
  numResults: number,
  fetchFullText: boolean,
  numHighlightSentences: number = 3
): ExaSearchRequestBody {
  const requestBody: ExaSearchRequestBody = {
    query: searchQuery.query_string,
    num_results: numResults,
    type: "auto",
    contents: {},
  };

  if (fetchFullText) {
    requestBody.contents = { 
      ...requestBody.contents, 
      text: { 
        max_characters: 10000,
        include_html_tags: false,
      } 
    };
  }

  if (numHighlightSentences > 0) {
    requestBody.contents = {
      ...requestBody.contents,
      highlights: { num_sentences: numHighlightSentences },
    };
  }

  return requestBody;
}

async function makeExaApiRequest(
  requestBody: ExaSearchRequestBody,
  apiKey: string,
  timeoutMs: number = 30000
): Promise<AxiosResponse<ExaSearchApiResponse>> {
  console.log(`🔎 Executing Exa search for: "${requestBody.query}"`);

  try {
    const response = await axios.post<ExaSearchApiResponse>(
      `${EXA_API_BASE_URL}/search`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: timeoutMs,
        validateStatus: (status) => status < 500, // Only retry on server errors
      }
    );

    // Handle HTTP error responses
    if (response.status === 401) {
      throw new ExaAuthError(
        `Authentication failed: ${response.data || "Invalid API key"}`,
        requestBody.query
      );
    }

    if (response.status === 429) {
      throw new ExaRateLimitError(
        `Rate limit exceeded: ${response.data || "Too many requests"}`,
        requestBody.query
      );
    }

    if (response.status >= 400) {
      throw new ExaSearchError(
        `Exa API error: ${response.statusText}`,
        response.status,
        requestBody.query
      );
    }

    return response;
  } catch (error) {
    // Handle Axios errors
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        throw new ExaSearchError(
          `Request timeout after ${timeoutMs}ms for query: "${requestBody.query}"`,
          408,
          requestBody.query
        );
      }

      if (error.response) {
        // The request was made and the server responded with a status code
        const status = error.response.status;
        const message = error.response.data?.message || error.response.statusText;
        
        if (status === 401) {
          throw new ExaAuthError(`Authentication failed: ${message}`, requestBody.query);
        }
        
        if (status === 429) {
          throw new ExaRateLimitError(`Rate limit exceeded: ${message}`, requestBody.query);
        }
        
        throw new ExaSearchError(
          `Exa API error: ${message}`,
          status,
          requestBody.query
        );
      }
      
      // Network error
      throw new ExaSearchError(
        `Network error: ${error.message}`,
        0,
        requestBody.query
      );
    }

    // Re-throw other errors
    throw error;
  }
}

function validateApiResponse(
  response: AxiosResponse<ExaSearchApiResponse>,
  query: string
): ExaApiResult[] {
  if (!response.data || !response.data.results) {
    throw new ExaSearchError(
      `Invalid response format from Exa API for query: "${query}"`,
      response.status,
      query
    );
  }

  if (!Array.isArray(response.data.results)) {
    throw new ExaSearchError(
      `Expected results array, got ${typeof response.data.results} for query: "${query}"`,
      response.status,
      query
    );
  }

  return response.data.results;
}

function mapExaResultToBaml(
  exaResult: ExaApiResult,
  index: number,
  retrievalDate: string,
  searchQuery: SearchQueryItem
): SearchResultItem {
  // Validate required fields
  if (!exaResult.url || !exaResult.id) {
    throw new ExaSearchError(
      `Invalid result item at index ${index}: missing required fields (id or url)`,
      0,
      searchQuery.query_string
    );
  }

  // Extract domain name for source
  let sourceName: string;
  try {
    const url = new URL(exaResult.url);
    sourceName = url.hostname.replace(/^www\./, "");
  } catch {
    sourceName = "unknown";
  }

  // Create snippet from highlights if available
  let snippet: string | undefined;
  if (exaResult.highlights && exaResult.highlights.length > 0) {
    snippet = exaResult.highlights.slice(0, 2).join(" ... ");
  }

  return {
    id: exaResult.url, // Use URL as ID for deduplication
    url: exaResult.url,
    title: exaResult.title || "Untitled",
    source_name: sourceName,
    full_text: exaResult.text || "",
    // Additional fields that might be used by BAML analysis
    ...(snippet && { snippet }),
    ...(exaResult.author && { author: exaResult.author }),
    ...(exaResult.publishedDate && { published_date: exaResult.publishedDate }),
  };
}

// --- Main Export Function ---

/**
 * Executes a search query using the Exa API and maps results to BAML SearchResultItem format.
 * Simplified version for Phase 2 - robust but without complex error recovery systems.
 */
export async function executeExaSearch(
  searchQuery: SearchQueryItem,
  numResults: number = 5,
  fetchFullText: boolean = true,
  maxRetries: number = 2
): Promise<SearchResultItem[]> {
  const apiKey = validateApiKey();
  let lastError: Error | null = null;

  // Simple retry logic (without sophisticated circuit breaker)
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔍 Search attempt ${attempt}/${maxRetries + 1} for: "${searchQuery.query_string}"`);
      
      const requestBody = buildRequestBody(
        searchQuery,
        numResults,
        fetchFullText,
        3 // highlight sentences
      );
      
      const response = await makeExaApiRequest(requestBody, apiKey);
      const exaResults = validateApiResponse(response, searchQuery.query_string);
      const retrievalDate = new Date().toISOString();
      
      const bamlResults: SearchResultItem[] = exaResults.map((exaResult, index) =>
        mapExaResultToBaml(exaResult, index, retrievalDate, searchQuery)
      );

      console.log(`✅ Exa search successful: ${bamlResults.length} results for "${searchQuery.query_string}"`);
      return bamlResults;
      
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication or rate limit errors
      if (error instanceof ExaAuthError || error instanceof ExaRateLimitError) {
        console.error(`❌ Non-retryable error: ${error.message}`);
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries + 1) {
        console.error(`❌ All retry attempts failed for query: "${searchQuery.query_string}"`);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`⚠️ Search attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This shouldn't be reached, but just in case
  throw lastError || new ExaSearchError("Unknown error during search execution");
}