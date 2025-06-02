import axios, { type AxiosError, type AxiosResponse, isAxiosError } from 'axios'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Assuming BAML-generated types are available.
// You might need to adjust the import path based on your `generators.baml` output_dir.
import type {
  SearchResultItem as BamlSearchResultItem,
  SearchQueryItem,
} from '@/baml_client/types'

// Import custom error types
import {
  ExaAuthError,
  ExaClientError,
  ExaConfigError,
  ExaNetworkError,
  ExaParsingError,
  ExaRateLimitError,
  ExaServerError,
} from './exaSearchErrors'

// --- Interfaces for Exa API Response (based on OpenAPI spec and examples) ---

interface ExaHighlightOptions {
  num_sentences?: number
  highlights_per_url?: number
  query?: string // A query to focus highlights, different from the main search query
}

interface ExaTextOptions {
  max_characters?: number
  include_html_tags?: boolean
}

interface ExaContentsOptions {
  text?: boolean | ExaTextOptions
  highlights?: boolean | ExaHighlightOptions
  // summary?: boolean | { query?: string; schema?: any }; // If you plan to use Exa's summary
}

interface ExaSearchRequestBody {
  query: string
  num_results?: number
  include_domains?: string[]
  exclude_domains?: string[]
  start_crawl_date?: string // ISO 8601
  end_crawl_date?: string // ISO 8601
  start_published_date?: string // ISO 8601
  end_published_date?: string // ISO 8601
  type?: 'keyword' | 'neural' | 'auto'
  category?:
    | 'company'
    | 'research paper'
    | 'news'
    | 'pdf'
    | 'github'
    | 'tweet'
    | 'personal site'
    | 'linkedin profile'
    | 'financial report' // and others
  contents?: ExaContentsOptions
  // use_autoprompt?: boolean; // This seems to be part of older or specific SDK methods, for API it's often handled by query phrasing
}

interface ExaApiResult {
  id: string // Exa's internal ID for the document
  url: string
  title?: string | null
  author?: string | null
  score?: number | null
  publishedDate?: string | null // Format "YYYY-MM-DD" or full ISO8601 from Exa
  text?: string // Full text content if requested
  highlights?: string[]
  highlightScores?: number[]
  // Other fields like 'image', 'favicon' might exist
}

interface ExaSearchApiResponse {
  results: ExaApiResult[]
  autopromptString?: string | null // If Exa modifies the query
  requestId?: string
  // resolvedSearchType?: 'keyword' | 'neural'; // If type='auto'
}

// --- Configuration ---

const EXA_API_BASE_URL = 'https://api.exa.ai'

// --- Helper Functions for Error Parsing ---

/**
 * Extracts request ID from API response for tracking
 */
function extractRequestId(responseData: unknown): string | undefined {
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>
    return typeof data.requestId === 'string'
      ? data.requestId
      : typeof data.request_id === 'string'
        ? data.request_id
        : undefined
  }
  return undefined
}

/**
 * Extracts retry-after value from response headers
 */
function extractRetryAfter(headers: unknown): number | undefined {
  if (!headers || typeof headers !== 'object') return undefined

  const headersObj = headers as Record<string, unknown>
  const retryAfter = headersObj['retry-after'] || headersObj['Retry-After']

  if (typeof retryAfter === 'string') {
    const seconds = Number.parseInt(retryAfter, 10)
    return Number.isNaN(seconds) ? undefined : seconds
  }

  return undefined
}

/**
 * Determines the type of rate limit from response data
 */
function extractRateLimitType(
  responseData: unknown
): 'requests' | 'quota' | 'concurrent' {
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>
    const errorMessage =
      typeof data.error === 'string'
        ? data.error.toLowerCase()
        : typeof data.message === 'string'
          ? data.message.toLowerCase()
          : ''

    if (errorMessage.includes('quota') || errorMessage.includes('usage')) {
      return 'quota'
    }
    if (
      errorMessage.includes('concurrent') ||
      errorMessage.includes('parallel')
    ) {
      return 'concurrent'
    }
  }
  return 'requests'
}

/**
 * Gets a user-friendly message for rate limit types
 */
function getRateLimitMessage(
  rateLimitType: 'requests' | 'quota' | 'concurrent'
): string {
  switch (rateLimitType) {
    case 'quota':
      return 'Monthly usage quota exceeded.'
    case 'concurrent':
      return 'Too many concurrent requests.'
    default:
      return 'Request rate limit exceeded.'
  }
}

/**
 * Determines the type of authentication error
 */
function extractAuthErrorType(
  responseData: unknown,
  defaultType: 'invalid_key' | 'insufficient_permissions'
): 'invalid_key' | 'insufficient_permissions' | 'expired_key' | 'unknown' {
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>
    const errorMessage =
      typeof data.error === 'string'
        ? data.error.toLowerCase()
        : typeof data.message === 'string'
          ? data.message.toLowerCase()
          : ''

    if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      return errorMessage.includes('expired') ? 'expired_key' : 'invalid_key'
    }
    if (
      errorMessage.includes('permission') ||
      errorMessage.includes('forbidden')
    ) {
      return 'insufficient_permissions'
    }
  }
  return defaultType
}

/**
 * Gets a user-friendly message for server errors
 */
function getServerErrorMessage(status: number): string {
  switch (status) {
    case 500:
      return 'Internal server error. Please try again later.'
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.'
    case 503:
      return 'Service unavailable. The server is temporarily overloaded.'
    case 504:
      return 'Gateway timeout. The server took too long to respond.'
    default:
      return 'Server error occurred. Please try again later.'
  }
}

/**
 * Gets a user-friendly message for client errors
 */
function getClientErrorMessage(status: number, errorCode?: string): string {
  if (errorCode) {
    return `Request failed with error code: ${errorCode}`
  }

  switch (status) {
    case 400:
      return 'Bad request. Please check your search parameters.'
    case 404:
      return 'Endpoint not found. Please check the API URL.'
    case 408:
      return 'Request timeout. Please try again.'
    case 413:
      return 'Request too large. Please reduce the query size.'
    case 422:
      return 'Unprocessable entity. Please check your request format.'
    default:
      return 'Client error occurred. Please check your request.'
  }
}

/**
 * Extracts error code from API response
 */
function extractErrorCode(responseData: unknown): string | undefined {
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>
    return typeof data.code === 'string'
      ? data.code
      : typeof data.error_code === 'string'
        ? data.error_code
        : undefined
  }
  return undefined
}

/**
 * Extracts validation errors from API response
 */
function extractValidationErrors(responseData: unknown):
  | Array<{
      field: string
      message: string
      value?: unknown
    }>
  | undefined {
  if (typeof responseData === 'object' && responseData !== null) {
    const data = responseData as Record<string, unknown>

    // Check for validation errors in different formats
    if (Array.isArray(data.errors)) {
      return data.errors.map((error: unknown) => {
        if (typeof error === 'object' && error !== null) {
          const errorObj = error as Record<string, unknown>
          return {
            field:
              typeof errorObj.field === 'string' ? errorObj.field : 'unknown',
            message:
              typeof errorObj.message === 'string'
                ? errorObj.message
                : String(errorObj),
            value: errorObj.value,
          }
        }
        return {
          field: 'unknown',
          message: String(error),
        }
      })
    }

    if (Array.isArray(data.validation_errors)) {
      return data.validation_errors.map((error: unknown) => ({
        field:
          typeof error === 'object' && error !== null
            ? String((error as Record<string, unknown>).field || 'unknown')
            : 'unknown',
        message:
          typeof error === 'object' && error !== null
            ? String((error as Record<string, unknown>).message || error)
            : String(error),
      }))
    }
  }
  return undefined
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
export async function executeExaSearch(
  bamlSearchQuery: SearchQueryItem,
  numResults = 5, // Default to 5 results
  fetchFullText = true,
  numHighlightSentences = 3 // Default to 3 sentences for highlights
): Promise<BamlSearchResultItem[]> {
  const EXA_API_KEY = process.env.EXA_API_KEY

  if (!EXA_API_KEY || EXA_API_KEY.trim() === '') {
    throw new ExaConfigError('EXA_API_KEY environment variable is not set', {
      configType: 'missing_api_key',
    })
  }

  const requestBody: ExaSearchRequestBody = {
    query: bamlSearchQuery.query_string,
    num_results: numResults,
    type: 'auto', // Leveraging Exa's auto search type selection
    contents: {},
  }

  if (fetchFullText) {
    if (!requestBody.contents) requestBody.contents = {}
    requestBody.contents.text = true // Request full text
  }

  if (numHighlightSentences > 0) {
    if (!requestBody.contents) requestBody.contents = {}
    requestBody.contents.highlights = {
      num_sentences: numHighlightSentences,
      // You could potentially use parts of bamlSearchQuery.expected_information
      // to formulate a more targeted highlight query if desired.
      // query: `Information related to: ${bamlSearchQuery.expected_information[0]}`
    }
  }

  try {
    console.log(`Executing Exa search for: "${bamlSearchQuery.query_string}"`)
    console.log('Request body:', JSON.stringify(requestBody, null, 2))

    let response: AxiosResponse<ExaSearchApiResponse>
    try {
      console.log('Making axios request to:', `${EXA_API_BASE_URL}/search`)
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'x-api-key': `${EXA_API_KEY.substring(0, 8)}...`,
      })

      response = await axios.post<ExaSearchApiResponse>(
        `${EXA_API_BASE_URL}/search`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': EXA_API_KEY, // Exa uses x-api-key header for authentication
            // 'Authorization': `Bearer ${EXA_API_KEY}`, // Some APIs use Bearer
          },
          timeout: 30000, // 30-second timeout for individual search requests
          validateStatus: _status => {
            // Accept all status codes to debug response
            return true
          },
        }
      )

      console.log('Axios response received:', {
        status: response?.status,
        statusText: response?.statusText,
        hasData: !!response?.data,
        dataType: typeof response?.data,
      })
    } catch (requestError) {
      console.error('Axios request failed:', {
        message:
          requestError instanceof Error
            ? requestError.message
            : String(requestError),
        code: (requestError as any)?.code,
        errno: (requestError as any)?.errno,
        syscall: (requestError as any)?.syscall,
        stack: requestError instanceof Error ? requestError.stack : undefined,
      })
      throw requestError
    }

    if (!response) {
      throw new ExaNetworkError(
        `No response received from Exa API for query "${bamlSearchQuery.query_string}"`,
        {
          query: bamlSearchQuery.query_string,
          isTimeout: false,
          isConnectionError: true,
          cause: new Error('Response is undefined'),
        }
      )
    }

    const retrievalDate = new Date().toISOString()

    // Validate response structure
    if (!response || !response.data || typeof response.data !== 'object') {
      throw new ExaParsingError(
        'Invalid response format: Response data is missing or not an object',
        {
          response: response?.data,
          expectedFormat: 'object with results array',
          actualFormat: response ? typeof response.data : 'undefined response',
        }
      )
    }

    const exaResults = response.data.results
    if (!Array.isArray(exaResults)) {
      throw new ExaParsingError(
        'Invalid response format: Results field is not an array',
        {
          response: response.data,
          expectedFormat: 'array of search results',
          actualFormat: Array.isArray(exaResults) ? 'array' : typeof exaResults,
        }
      )
    }

    const bamlResults: BamlSearchResultItem[] = exaResults.map(
      (exaRes: ExaApiResult, index: number) => {
        // Validate required fields for each result
        if (!exaRes || typeof exaRes !== 'object') {
          throw new ExaParsingError(
            `Invalid result format at index ${index}: Result is not an object`,
            {
              response: exaRes,
              expectedFormat: 'search result object',
              actualFormat: typeof exaRes,
            }
          )
        }

        if (!exaRes.url || typeof exaRes.url !== 'string') {
          throw new ExaParsingError(
            `Invalid result format at index ${index}: Missing or invalid URL`,
            {
              response: exaRes,
              expectedFormat: 'string URL',
              actualFormat: typeof exaRes.url,
            }
          )
        }

        let snippet: string | null = null
        if (exaRes.highlights && exaRes.highlights.length > 0) {
          // Combine highlights into a single snippet, or take the first few.
          // For legal, multiple distinct highlights might be better represented as string[]
          snippet = exaRes.highlights.slice(0, 2).join(' ... ') // Example: join first 2 highlights
        }

        const metadata: Record<string, string> = {
          exa_internal_id: exaRes.id || 'unknown',
        }
        if (response.data.autopromptString) {
          metadata.exa_autoprompt = response.data.autopromptString
        }
        // if (response.data.resolvedSearchType) {
        //   metadata.exa_resolved_search_type = response.data.resolvedSearchType;
        // }

        return {
          id: exaRes.url, // Using URL as the primary ID for simplicity in BAML
          url: exaRes.url,
          title: exaRes.title ?? null,
          source_name: 'Exa Search',
          snippet: snippet,
          // highlights: exaRes.highlights ?? null, // If you changed SearchResultItem to have highlights: string[]
          full_text: exaRes.text ?? null,
          published_date: exaRes.publishedDate ?? null,
          retrieval_date: retrievalDate,
          author: exaRes.author ?? null,
          score: exaRes.score ?? null,
          original_query: bamlSearchQuery, // Pass through the original BAML query
          metadata: metadata,
        }
      }
    )

    console.log(`Exa search yielded ${bamlResults.length} results.`)
    return bamlResults
  } catch (error) {
    console.error(
      `Error executing Exa search for query "${bamlSearchQuery.query_string}":`,
      {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name || typeof error,
      }
    )

    if (isAxiosError(error)) {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status
      const responseData = axiosError.response?.data
      const requestId = extractRequestId(responseData)

      const baseErrorOptions = {
        ...(status !== undefined && { status }),
        ...(responseData !== undefined && { response: responseData }),
        ...(requestId !== undefined && { requestId }),
        query: bamlSearchQuery.query_string,
        cause: error,
      }

      // Handle specific error cases with custom error types
      if (status === 429) {
        const retryAfter = extractRetryAfter(axiosError.response?.headers)
        const rateLimitType = extractRateLimitType(responseData)

        throw new ExaRateLimitError(
          `Rate limit exceeded for Exa API. ${getRateLimitMessage(rateLimitType)}`,
          {
            ...baseErrorOptions,
            ...(retryAfter !== undefined && { retryAfter }),
            rateLimitType,
          }
        )
      }
      if (status === 401) {
        const authType = extractAuthErrorType(responseData, 'invalid_key')

        throw new ExaAuthError(
          'Exa API authentication failed: Invalid or expired API key.',
          {
            ...baseErrorOptions,
            authType,
          }
        )
      }
      if (status === 403) {
        const authType = extractAuthErrorType(
          responseData,
          'insufficient_permissions'
        )

        throw new ExaAuthError(
          'Exa API authorization failed: Insufficient permissions for this operation.',
          {
            ...baseErrorOptions,
            authType,
          }
        )
      }
      if (status && status >= 500) {
        const isTemporary = status !== 501 // 501 Not Implemented is permanent

        throw new ExaServerError(
          `Exa API server error (${status}): ${getServerErrorMessage(status)}`,
          {
            ...baseErrorOptions,
            isTemporary,
          }
        )
      }
      if (status && status >= 400) {
        const errorCode = extractErrorCode(responseData)
        const validationErrors = extractValidationErrors(responseData)

        throw new ExaClientError(
          `Exa API client error (${status}): ${getClientErrorMessage(status, errorCode)}`,
          {
            ...baseErrorOptions,
            ...(errorCode !== undefined && { errorCode }),
            ...(validationErrors !== undefined && { validationErrors }),
          }
        )
      }
      // Network error without response
      const isTimeout =
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message.includes('timeout')
      const isConnectionError =
        axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND'

      throw new ExaNetworkError(
        `Network error during Exa API request: ${axiosError.message}`,
        {
          query: bamlSearchQuery.query_string,
          isTimeout,
          isConnectionError,
          cause: error,
        }
      )
    }

    // Handle timeout errors specifically (from axios timeout config)
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new ExaNetworkError(
        `Exa API request timed out for query "${bamlSearchQuery.query_string}". The search API may be experiencing high load.`,
        {
          query: bamlSearchQuery.query_string,
          isTimeout: true,
          isConnectionError: false,
          cause: error,
        }
      )
    }

    // Handle non-Axios errors (unexpected errors)
    console.error('An unexpected error occurred during Exa search:', error)

    // If it's already one of our custom errors, re-throw it
    if (
      error instanceof ExaConfigError ||
      error instanceof ExaRateLimitError ||
      error instanceof ExaAuthError ||
      error instanceof ExaServerError ||
      error instanceof ExaClientError ||
      error instanceof ExaNetworkError ||
      error instanceof ExaParsingError
    ) {
      throw error
    }

    // For undefined response errors, provide specific handling
    if (
      error instanceof TypeError &&
      error.message.includes('Cannot read properties of undefined')
    ) {
      throw new ExaNetworkError(
        `Network error: Received invalid response from Exa API for query "${bamlSearchQuery.query_string}". The API may be temporarily unavailable.`,
        {
          query: bamlSearchQuery.query_string,
          isTimeout: false,
          isConnectionError: true,
          cause: error,
        }
      )
    }

    // Wrap unknown errors
    throw new ExaParsingError(
      `Unexpected error during Exa search: ${error instanceof Error ? error.message : String(error)}`,
      {
        response: error,
        cause: error instanceof Error ? error : new Error(String(error)),
      }
    )
  }
}
