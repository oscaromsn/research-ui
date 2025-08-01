import axios, {
  type AxiosError,
  type AxiosResponse,
  isAxiosError,
} from "axios";
import { config } from "dotenv";

// Load environment variables
config();

// Assuming BAML-generated types are available.
// You might need to adjust the import path based on your `generators.baml` output_dir.
import type {
  SearchResultItem as BamlSearchResultItem,
  SearchQueryItem,
} from "@/baml_client/types";

// Import validated environment
import { env } from "@/lib/schemas/env";

// Import custom error types
import {
  ExaAuthError,
  ExaClientError,
  ExaConfigError,
  ExaNetworkError,
  ExaParsingError,
  ExaRateLimitError,
  ExaServerError,
} from "./exaSearchErrors";

// --- Interfaces for Exa API Response (based on OpenAPI spec and examples) ---

interface ExaHighlightOptions {
  num_sentences?: number;
  highlights_per_url?: number;
  query?: string; // A query to focus highlights, different from the main search query
}

interface ExaTextOptions {
  max_characters?: number;
  include_html_tags?: boolean;
}

interface ExaContentsOptions {
  text?: boolean | ExaTextOptions;
  highlights?: boolean | ExaHighlightOptions;
  // summary?: boolean | { query?: string; schema?: any }; // If you plan to use Exa's summary
}

interface ExaSearchRequestBody {
  query: string;
  num_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
  start_crawl_date?: string; // ISO 8601
  end_crawl_date?: string; // ISO 8601
  start_published_date?: string; // ISO 8601
  end_published_date?: string; // ISO 8601
  type?: "keyword" | "neural" | "auto";
  category?:
    | "company"
    | "research paper"
    | "news"
    | "pdf"
    | "github"
    | "tweet"
    | "personal site"
    | "linkedin profile"
    | "financial report"; // and others
  contents?: ExaContentsOptions;
  // use_autoprompt?: boolean; // This seems to be part of older or specific SDK methods, for API it's often handled by query phrasing
}

interface ExaApiResult {
  id: string; // Exa's internal ID for the document
  url: string;
  title?: string | null;
  author?: string | null;
  score?: number | null;
  publishedDate?: string | null; // Format "YYYY-MM-DD" or full ISO8601 from Exa
  text?: string; // Full text content if requested
  highlights?: string[];
  highlightScores?: number[];
  // Other fields like 'image', 'favicon' might exist
}

interface ExaSearchApiResponse {
  results: ExaApiResult[];
  autopromptString?: string | null; // If Exa modifies the query
  requestId?: string;
  // resolvedSearchType?: 'keyword' | 'neural'; // If type='auto'
}

// --- Configuration ---

const EXA_API_BASE_URL = "https://api.exa.ai";

// --- Helper Functions for Error Parsing ---

/**
 * Extracts request ID from API response for tracking
 */
function extractRequestId(responseData: unknown): string | undefined {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    return typeof data.requestId === "string"
      ? data.requestId
      : typeof data.request_id === "string"
        ? data.request_id
        : undefined;
  }
  return undefined;
}

/**
 * Extracts retry-after value from response headers
 */
function extractRetryAfter(headers: unknown): number | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }

  const headersObj = headers as Record<string, unknown>;
  const retryAfter = headersObj["retry-after"] || headersObj["Retry-After"];

  if (typeof retryAfter === "string") {
    const seconds = Number.parseInt(retryAfter, 10);
    return Number.isNaN(seconds) ? undefined : seconds;
  }

  return undefined;
}

/**
 * Determines the type of rate limit from response data
 */
function extractRateLimitType(
  responseData: unknown
): "requests" | "quota" | "concurrent" {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    const errorMessage =
      typeof data.error === "string"
        ? data.error.toLowerCase()
        : typeof data.message === "string"
          ? data.message.toLowerCase()
          : "";

    if (errorMessage.includes("quota") || errorMessage.includes("usage")) {
      return "quota";
    }
    if (
      errorMessage.includes("concurrent") ||
      errorMessage.includes("parallel")
    ) {
      return "concurrent";
    }
  }
  return "requests";
}

/**
 * Gets a user-friendly message for rate limit types
 */
function getRateLimitMessage(
  rateLimitType: "requests" | "quota" | "concurrent"
): string {
  switch (rateLimitType) {
    case "quota":
      return "Monthly usage quota exceeded.";
    case "concurrent":
      return "Too many concurrent requests.";
    default:
      return "Request rate limit exceeded.";
  }
}

/**
 * Determines the type of authentication error
 */
function extractAuthErrorType(
  responseData: unknown,
  defaultType: "invalid_key" | "insufficient_permissions"
): "invalid_key" | "insufficient_permissions" | "expired_key" | "unknown" {
  if (typeof responseData !== "object" || responseData === null) {
    return defaultType;
  }

  const data = responseData as Record<string, unknown>;
  const errorMessage = getErrorMessage(data);

  if (errorMessage.includes("expired")) {
    return "expired_key";
  }
  if (errorMessage.includes("invalid")) {
    return "invalid_key";
  }
  if (
    errorMessage.includes("permission") ||
    errorMessage.includes("forbidden")
  ) {
    return "insufficient_permissions";
  }

  return defaultType;
}

function getErrorMessage(data: Record<string, unknown>): string {
  if (typeof data.error === "string") {
    return data.error.toLowerCase();
  }
  if (typeof data.message === "string") {
    return data.message.toLowerCase();
  }
  return "";
}

/**
 * Gets a user-friendly message for server errors
 */
function getServerErrorMessage(status: number): string {
  switch (status) {
    case 500:
      return "Internal server error. Please try again later.";
    case 502:
      return "Bad gateway. The server is temporarily unavailable.";
    case 503:
      return "Service unavailable. The server is temporarily overloaded.";
    case 504:
      return "Gateway timeout. The server took too long to respond.";
    default:
      return "Server error occurred. Please try again later.";
  }
}

/**
 * Gets a user-friendly message for client errors
 */
function getClientErrorMessage(status: number, errorCode?: string): string {
  if (errorCode) {
    return `Request failed with error code: ${errorCode}`;
  }

  switch (status) {
    case 400:
      return "Bad request. Please check your search parameters.";
    case 404:
      return "Endpoint not found. Please check the API URL.";
    case 408:
      return "Request timeout. Please try again.";
    case 413:
      return "Request too large. Please reduce the query size.";
    case 422:
      return "Unprocessable entity. Please check your request format.";
    default:
      return "Client error occurred. Please check your request.";
  }
}

/**
 * Extracts error code from API response
 */
function extractErrorCode(responseData: unknown): string | undefined {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>;
    return typeof data.code === "string"
      ? data.code
      : typeof data.error_code === "string"
        ? data.error_code
        : undefined;
  }
  return undefined;
}

/**
 * Extracts validation errors from API response
 */
function extractValidationErrors(responseData: unknown):
  | Array<{
      field: string;
      message: string;
      value?: unknown;
    }>
  | undefined {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>;

    // Check for validation errors in different formats
    if (Array.isArray(data.errors)) {
      return data.errors.map((error: unknown) => {
        if (typeof error === "object" && error !== null) {
          const errorObj = error as Record<string, unknown>;
          return {
            field:
              typeof errorObj.field === "string" ? errorObj.field : "unknown",
            message:
              typeof errorObj.message === "string"
                ? errorObj.message
                : String(errorObj),
            value: errorObj.value,
          };
        }
        return {
          field: "unknown",
          message: String(error),
        };
      });
    }

    if (Array.isArray(data.validation_errors)) {
      return data.validation_errors.map((error: unknown) => ({
        field:
          typeof error === "object" && error !== null
            ? String((error as Record<string, unknown>).field || "unknown")
            : "unknown",
        message:
          typeof error === "object" && error !== null
            ? String((error as Record<string, unknown>).message || error)
            : String(error),
      }));
    }
  }
  return undefined;
}

// --- Utility Function ---

/**
 * Executes a search query using the Exa API and maps the results
 * to the BAML SearchResultItem schema.
 *
 * @param bamlSearchQuery - The SearchQueryItem generated by a BAML function.
 * @param numResults - Number of results to fetch from Exa.
 * @param fetchFullText - Whether to fetch the full text of the results.
 * @param fetchHighlights - Number of highlight sentences to fetch.
 * @returns A promise that resolves to an array of BamlSearchResultItem.
 */
function validateApiKey(): string {
  // Use validated environment instead of direct process.env access
  const EXA_API_KEY = env.EXA_API_KEY;

  if (!EXA_API_KEY || EXA_API_KEY.trim() === "") {
    throw new ExaConfigError("EXA_API_KEY environment variable is not set", {
      configType: "missing_api_key",
    });
  }

  return EXA_API_KEY;
}

function buildRequestBody(
  bamlSearchQuery: SearchQueryItem,
  numResults: number,
  fetchFullText: boolean,
  numHighlightSentences: number
): ExaSearchRequestBody {
  const requestBody: ExaSearchRequestBody = {
    query: bamlSearchQuery.query_string,
    num_results: numResults,
    type: "auto",
    contents: {},
  };

  if (fetchFullText) {
    requestBody.contents = { ...requestBody.contents, text: true };
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
  apiKey: string
): Promise<AxiosResponse<ExaSearchApiResponse>> {
  console.log(`Executing Exa search for: "${requestBody.query}"`);
  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  try {
    console.log("Making axios request to:", `${EXA_API_BASE_URL}/search`);
    console.log("Headers:", {
      "Content-Type": "application/json",
      "x-api-key": `${apiKey.substring(0, 8)}...`,
    });

    const response = await axios.post<ExaSearchApiResponse>(
      `${EXA_API_BASE_URL}/search`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        timeout: 30000,
        validateStatus: () => true,
      }
    );

    console.log("Axios response received:", {
      status: response?.status,
      statusText: response?.statusText,
      hasData: !!response?.data,
      dataType: typeof response?.data,
    });

    return response;
  } catch (requestError) {
    console.error("Axios request failed:", {
      message:
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      code: (requestError as unknown as { code?: string })?.code,
      errno: (requestError as unknown as { errno?: string })?.errno,
      syscall: (requestError as unknown as { syscall?: string })?.syscall,
      stack: requestError instanceof Error ? requestError.stack : undefined,
    });
    throw requestError;
  }
}

function validateApiResponse(
  response: AxiosResponse<ExaSearchApiResponse> | null,
  queryString: string
): ExaApiResult[] {
  if (!response) {
    throw new ExaNetworkError(
      `No response received from Exa API for query "${queryString}"`,
      {
        query: queryString,
        isTimeout: false,
        isConnectionError: true,
        cause: new Error("Response is undefined"),
      }
    );
  }

  if (!response.data || typeof response.data !== "object") {
    throw new ExaParsingError(
      "Invalid response format: Response data is missing or not an object",
      {
        response: response?.data,
        expectedFormat: "object with results array",
        actualFormat: response ? typeof response.data : "undefined response",
      }
    );
  }

  const exaResults = response.data.results;
  if (!Array.isArray(exaResults)) {
    throw new ExaParsingError(
      "Invalid response format: Results field is not an array",
      {
        response: response.data,
        expectedFormat: "array of search results",
        actualFormat: Array.isArray(exaResults) ? "array" : typeof exaResults,
      }
    );
  }

  return exaResults;
}

function validateResultItem(exaRes: ExaApiResult, index: number): void {
  if (!exaRes || typeof exaRes !== "object") {
    throw new ExaParsingError(
      `Invalid result format at index ${index}: Result is not an object`,
      {
        response: exaRes,
        expectedFormat: "search result object",
        actualFormat: typeof exaRes,
      }
    );
  }

  if (!exaRes.url || typeof exaRes.url !== "string") {
    throw new ExaParsingError(
      `Invalid result format at index ${index}: Missing or invalid URL`,
      {
        response: exaRes,
        expectedFormat: "string URL",
        actualFormat: typeof exaRes.url,
      }
    );
  }
}

function mapExaResultToBaml(
  exaRes: ExaApiResult,
  index: number,
  retrievalDate: string,
  bamlSearchQuery: SearchQueryItem,
  autopromptString?: string
): BamlSearchResultItem {
  validateResultItem(exaRes, index);

  let snippet: string | null = null;
  if (exaRes.highlights && exaRes.highlights.length > 0) {
    snippet = exaRes.highlights.slice(0, 2).join(" ... ");
  }

  const metadata: Record<string, string> = {
    exa_internal_id: exaRes.id || "unknown",
  };
  if (autopromptString) {
    metadata.exa_autoprompt = autopromptString;
  }

  return {
    id: exaRes.url,
    url: exaRes.url,
    title: exaRes.title ?? null,
    source_name: "Exa Search",
    snippet: snippet,
    full_text: exaRes.text ?? null,
    published_date: exaRes.publishedDate ?? null,
    retrieval_date: retrievalDate,
    author: exaRes.author ?? null,
    score: exaRes.score ?? null,
    original_query: bamlSearchQuery,
    metadata: metadata,
  };
}

function handleAxiosError(error: AxiosError, queryString: string): never {
  const status = error.response?.status;
  const responseData = error.response?.data;
  const requestId = extractRequestId(responseData);

  const baseErrorOptions = {
    ...(status !== undefined && { status }),
    ...(responseData !== undefined && { response: responseData }),
    ...(requestId !== undefined && { requestId }),
    query: queryString,
    cause: error,
  };

  if (status === 429) {
    const retryAfter = extractRetryAfter(error.response?.headers);
    const rateLimitType = extractRateLimitType(responseData);
    throw new ExaRateLimitError(
      `Rate limit exceeded for Exa API. ${getRateLimitMessage(rateLimitType)}`,
      {
        ...baseErrorOptions,
        ...(retryAfter !== undefined && { retryAfter }),
        rateLimitType,
      }
    );
  }

  if (status === 401) {
    const authType = extractAuthErrorType(responseData, "invalid_key");
    throw new ExaAuthError(
      "Exa API authentication failed: Invalid or expired API key.",
      { ...baseErrorOptions, authType }
    );
  }

  if (status === 403) {
    const authType = extractAuthErrorType(
      responseData,
      "insufficient_permissions"
    );
    throw new ExaAuthError(
      "Exa API authorization failed: Insufficient permissions for this operation.",
      { ...baseErrorOptions, authType }
    );
  }

  if (status && status >= 500) {
    const isTemporary = status !== 501;
    throw new ExaServerError(
      `Exa API server error (${status}): ${getServerErrorMessage(status)}`,
      { ...baseErrorOptions, isTemporary }
    );
  }

  if (status && status >= 400) {
    const errorCode = extractErrorCode(responseData);
    const validationErrors = extractValidationErrors(responseData);
    throw new ExaClientError(
      `Exa API client error (${status}): ${getClientErrorMessage(status, errorCode)}`,
      {
        ...baseErrorOptions,
        ...(errorCode !== undefined && { errorCode }),
        ...(validationErrors !== undefined && { validationErrors }),
      }
    );
  }

  const isTimeout =
    error.code === "ECONNABORTED" || error.message.includes("timeout");
  const isConnectionError =
    error.code === "ECONNREFUSED" || error.code === "ENOTFOUND";

  throw new ExaNetworkError(
    `Network error during Exa API request: ${error.message}`,
    { query: queryString, isTimeout, isConnectionError, cause: error }
  );
}

function handleNonAxiosError(error: unknown, queryString: string): never {
  if (error instanceof Error && error.message.includes("timeout")) {
    throw new ExaNetworkError(
      `Exa API request timed out for query "${queryString}". The search API may be experiencing high load.`,
      {
        query: queryString,
        isTimeout: true,
        isConnectionError: false,
        cause: error,
      }
    );
  }

  if (
    error instanceof ExaConfigError ||
    error instanceof ExaRateLimitError ||
    error instanceof ExaAuthError ||
    error instanceof ExaServerError ||
    error instanceof ExaClientError ||
    error instanceof ExaNetworkError ||
    error instanceof ExaParsingError
  ) {
    throw error;
  }

  if (
    error instanceof TypeError &&
    error.message.includes("Cannot read properties of undefined")
  ) {
    throw new ExaNetworkError(
      `Network error: Received invalid response from Exa API for query "${queryString}". The API may be temporarily unavailable.`,
      {
        query: queryString,
        isTimeout: false,
        isConnectionError: true,
        cause: error,
      }
    );
  }

  throw new ExaParsingError(
    `Unexpected error during Exa search: ${error instanceof Error ? error.message : String(error)}`,
    {
      response: error,
      cause: error instanceof Error ? error : new Error(String(error)),
    }
  );
}

export async function executeExaSearch(
  bamlSearchQuery: SearchQueryItem,
  numResults = 5,
  fetchFullText = true,
  numHighlightSentences = 3
): Promise<BamlSearchResultItem[]> {
  const apiKey = validateApiKey();
  const requestBody = buildRequestBody(
    bamlSearchQuery,
    numResults,
    fetchFullText,
    numHighlightSentences
  );

  try {
    const response = await makeExaApiRequest(requestBody, apiKey);
    const exaResults = validateApiResponse(
      response,
      bamlSearchQuery.query_string
    );
    const retrievalDate = new Date().toISOString();

    const bamlResults: BamlSearchResultItem[] = exaResults.map(
      (exaRes, index) =>
        mapExaResultToBaml(
          exaRes,
          index,
          retrievalDate,
          bamlSearchQuery,
          response.data.autopromptString ?? undefined
        )
    );

    console.log(`Exa search yielded ${bamlResults.length} results.`);
    return bamlResults;
  } catch (error) {
    console.error(
      `Error executing Exa search for query "${bamlSearchQuery.query_string}":`,
      {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name || typeof error,
      }
    );

    if (isAxiosError(error)) {
      handleAxiosError(error, bamlSearchQuery.query_string);
    } else {
      handleNonAxiosError(error, bamlSearchQuery.query_string);
    }

    // This should never be reached since error handlers always throw,
    // but added for TypeScript safety to ensure function never returns undefined
    // @ts-ignore: Unreachable code is intentional for runtime safety
    throw new Error(
      "Unexpected: error handlers should have thrown an exception"
    );
  }
}
