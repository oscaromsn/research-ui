# Orchestrator Error Handling with Custom Exa Error Types

This document shows how the research orchestrator can be enhanced to handle specific Exa API error types for better reliability and user experience.

## Current vs Enhanced Error Handling

### Current Implementation (Basic)

```typescript
// Current error handling in fetchDocumentsFromQueries
try {
  const results = await executeExaSearch(query, RESULTS_PER_QUERY, true, 2);
  allFetchedResults.push(...results);
} catch (searchError: unknown) {
  const errorMessage = searchError instanceof Error ? searchError.message : String(searchError);
  console.error(`Error during search for query "${query.query_string}":`, errorMessage);

  // Basic string matching for rate limits
  if (errorMessage.includes("Rate limit exceeded")) {
    console.warn("Rate limit reached. Stopping further searches.");
    break;
  }
  // Continue with remaining queries for other errors
}
```

### Enhanced Implementation (Specific Error Types)

```typescript
import { 
  analyzeExaError, 
  executeWithRetry, 
  shouldAbortResearch,
  createUserErrorMessage,
  isQuotaRelatedError 
} from "@/lib/utils/exaErrorHandler";

// Enhanced error handling with automatic retry and specific error types
async function fetchDocumentsFromQueries(
  queries: SearchQueryItem[],
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
): Promise<SearchResultItem[]> {
  const MAX_QUERIES_TO_EXECUTE = 3;
  const RESULTS_PER_QUERY = 2;
  const allFetchedResults: SearchResultItem[] = [];
  let quotaExceeded = false;

  console.log(`Starting document fetch for ${queries.length} queries`);

  const executedQueries = queries.slice(0, MAX_QUERIES_TO_EXECUTE);

  for (let i = 0; i < executedQueries.length; i++) {
    const query = executedQueries[i];
    
    try {
      // Use executeWithRetry for automatic retry logic based on error type
      const results = await executeWithRetry(
        () => executeExaSearch(query, RESULTS_PER_QUERY, true, 2),
        { maxRetries: 2, maxDelay: 30000 }
      );
      
      allFetchedResults.push(...results);
      console.log(`Query "${query.query_string}" yielded ${results.length} results.`);
      
      // Send progress update
      await sendUpdate(writer, encoder, {
        type: "PROGRESS",
        stage: "FETCHING_DOCUMENTS",
        message: `Successfully retrieved ${results.length} documents for query ${i + 1}/${executedQueries.length}`,
        currentProcessedDoc: i + 1,
        totalDocsToProcess: executedQueries.length,
      });

    } catch (searchError: unknown) {
      console.error(`Error during search for query "${query.query_string}":`, searchError);
      
      // Analyze the error and determine how to handle it
      const errorAnalysis = analyzeExaError(searchError, 1);
      const userMessage = createUserErrorMessage(searchError, 1);
      
      // Send error update to client with user-friendly message
      await sendUpdate(writer, encoder, {
        type: "ERROR",
        stage: "FETCHING_DOCUMENTS",
        message: userMessage.message,
        data: {
          query: query.query_string,
          errorCategory: errorAnalysis.errorCategory,
          isRecoverable: errorAnalysis.isRecoverable,
        },
      });

      // Handle different error categories
      if (errorAnalysis.errorCategory === 'rate_limit') {
        if (isQuotaRelatedError(searchError)) {
          console.warn("Quota exceeded for Exa API. Stopping all further searches for this session.");
          quotaExceeded = true;
          break; // Stop all queries if quota exceeded
        } else {
          console.warn("Rate limit hit. Waiting before continuing with next query.");
          // Wait a bit before next query for request rate limits
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } else if (shouldAbortResearch(searchError)) {
        console.error("Critical error that requires aborting research:", errorAnalysis.userMessage);
        
        // Send final error to client
        await sendUpdate(writer, encoder, {
          type: "ERROR",
          stage: "ERROR",
          message: "Research cannot continue due to a critical configuration error. Please contact support.",
          data: { aborted: true, reason: errorAnalysis.errorCategory },
        });
        
        throw searchError; // Abort entire research process
      } else {
        console.warn(`Recoverable error for query "${query.query_string}": ${errorAnalysis.userMessage}`);
        // Continue with remaining queries for recoverable errors
      }
    }
  }

  if (quotaExceeded && allFetchedResults.length === 0) {
    // If quota exceeded and no results, throw an error
    throw new Error("Search quota exceeded and no documents were retrieved. Please try again later.");
  }

  return allFetchedResults;
}
```

## Key Improvements

### 1. Automatic Retry Logic

```typescript
// Searches are automatically retried based on error type
const results = await executeWithRetry(
  () => executeExaSearch(query, RESULTS_PER_QUERY, true, 2),
  { 
    maxRetries: 2,      // Max 2 retries
    maxDelay: 30000,    // Max 30 second delay
    backoffMultiplier: 2 // Exponential backoff
  }
);
```

### 2. Specific Error Category Handling

```typescript
// Different strategies for different error types
switch (errorAnalysis.errorCategory) {
  case 'rate_limit':
    if (isQuotaRelatedError(searchError)) {
      // Stop all queries if quota exceeded
      break;
    } else {
      // Wait before next query for request rate limits
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    break;
    
  case 'auth':
  case 'config':
    if (!errorAnalysis.isRecoverable) {
      // Abort entire research for critical auth/config errors
      throw searchError;
    }
    break;
    
  case 'server':
  case 'network':
    // Continue with other queries, these are likely temporary
    console.warn(`Temporary error, continuing: ${errorAnalysis.userMessage}`);
    break;
    
  case 'client':
    // Skip this query but continue with others
    console.warn(`Invalid query, skipping: ${errorAnalysis.userMessage}`);
    break;
}
```

### 3. Enhanced Client Communication

```typescript
// Send structured error information to client
await sendUpdate(writer, encoder, {
  type: "ERROR",
  stage: "FETCHING_DOCUMENTS",
  message: userMessage.message, // User-friendly message
  data: {
    query: query.query_string,
    errorCategory: errorAnalysis.errorCategory,
    isRecoverable: errorAnalysis.isRecoverable,
    retryAfter: userMessage.retryAfter,
    suggestedAction: errorAnalysis.suggestedAction,
  },
});
```

### 4. Research Abort Logic

```typescript
// Determine if research should be completely aborted
if (shouldAbortResearch(searchError)) {
  console.error("Critical error requires aborting research");
  
  await sendUpdate(writer, encoder, {
    type: "ERROR",
    stage: "ERROR",
    message: "Research cannot continue due to a critical error.",
    data: { 
      aborted: true, 
      reason: errorAnalysis.errorCategory,
      technicalDetails: errorAnalysis.technicalDetails 
    },
  });
  
  throw searchError; // Abort entire research process
}
```

## Error Categories and Handling Strategies

| Error Category | Retry Strategy | Continue Research | User Message |
|---------------|----------------|-------------------|--------------|
| `config` | No retry | Abort if critical | "Configuration error. Contact support." |
| `auth` | 1 retry if recoverable | Abort if critical | "Authentication error. Contact support." |
| `rate_limit` | Automatic with delay | Stop if quota exceeded | "Rate limit exceeded. Retrying in X seconds..." |
| `server` | Exponential backoff | Continue | "Service temporarily unavailable. Retrying..." |
| `client` | 1 retry for timeouts | Continue | "Invalid request. Skipping this query." |
| `network` | Exponential backoff | Continue | "Network issue. Retrying..." |
| `parsing` | 1 retry | Continue | "Data parsing error. Retrying..." |

## Benefits

1. **Better Reliability**: Automatic retries for transient errors
2. **Resource Management**: Smart handling of rate limits and quotas
3. **User Experience**: Clear, actionable error messages
4. **Debugging**: Detailed error categorization and logging
5. **Graceful Degradation**: Continue research when possible, abort when necessary

## Integration Example

```typescript
// Simple integration in the main conductResearch function
try {
  const documents = await fetchDocumentsFromQueries(queries, writer, encoder);
  // Continue with analysis...
} catch (error) {
  const errorAnalysis = analyzeExaError(error);
  
  if (errorAnalysis.errorCategory === 'config' || errorAnalysis.errorCategory === 'auth') {
    // Send final error and abort
    await sendUpdate(writer, encoder, {
      type: "ERROR",
      stage: "ERROR", 
      message: errorAnalysis.userMessage,
      data: { aborted: true }
    });
    return; // End research
  } else {
    // Continue with reduced functionality
    await sendUpdate(writer, encoder, {
      type: "LOG",
      stage: "FETCHING_DOCUMENTS",
      message: "Some documents could not be retrieved. Continuing with available data.",
    });
    // Proceed with empty or partial document set
  }
}
```

This enhanced error handling provides much better resilience and user experience compared to basic string matching.