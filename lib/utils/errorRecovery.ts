import type { SearchQueryItem, SearchResultItem } from "../../packages/shared-types/src/baml-types.js";

/**
 * Context information provided to recovery strategies
 */
export interface SearchContext {
  queries: SearchQueryItem[];
  attempt: number;
  previousResults?: SearchResultItem[];
  startTime: number;
  requestId?: string;
}

/**
 * Interface for pluggable recovery strategies
 * Each strategy can determine if it can recover from a specific error
 * and attempt recovery in a composable, non-coupled way
 */
export interface RecoveryStrategy {
  name: string;
  canRecover(error: unknown, context: SearchContext): boolean;
  recover(error: unknown, context: SearchContext): Promise<SearchResultItem[]>;
  priority: number; // Lower = higher priority
}

/**
 * Circuit Breaker implementation for search operations
 * Uses pluggable recovery strategies to handle different types of failures
 * without tight coupling to the orchestrator
 */
export class SearchCircuitBreaker {
  private strategies: RecoveryStrategy[];

  constructor(strategies: RecoveryStrategy[]) {
    // Sort strategies by priority (lower number = higher priority)
    this.strategies = strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Executes a search operation with automatic error recovery
   * Tries recovery strategies in priority order when errors occur
   */
  async executeWithRecovery(
    operation: () => Promise<SearchResultItem[]>,
    context: SearchContext
  ): Promise<SearchResultItem[]> {
    try {
      console.log(`🔍 Executing search operation (attempt ${context.attempt})`);
      const results = await operation();
      console.log(
        `✅ Search completed successfully with ${results.length} results`
      );
      return results;
    } catch (error) {
      console.warn("❌ Search operation failed:", {
        error: error instanceof Error ? error.message : String(error),
        attempt: context.attempt,
        queryCount: context.queries.length,
        elapsed: Date.now() - context.startTime,
      });

      // Try recovery strategies in priority order
      for (const strategy of this.strategies) {
        if (strategy.canRecover(error, context)) {
          console.log(`🔄 Attempting recovery with strategy: ${strategy.name}`);
          try {
            const recoveredResults = await strategy.recover(error, context);
            console.log(
              `✅ Recovery successful with ${recoveredResults.length} results using: ${strategy.name}`
            );
            return recoveredResults;
          } catch (recoveryError) {
            console.warn(`⚠️ Recovery strategy ${strategy.name} failed:`, {
              error:
                recoveryError instanceof Error
                  ? recoveryError.message
                  : String(recoveryError),
              strategy: strategy.name,
            });
            // Continue to next strategy
          }
        } else {
          console.debug(
            `⏭️ Strategy ${strategy.name} cannot recover from this error type`
          );
        }
      }

      // All recovery strategies failed or none applicable
      console.error("💥 All recovery strategies exhausted for error:", {
        error: error instanceof Error ? error.message : String(error),
        strategiesAttempted: this.strategies
          .filter((s) => s.canRecover(error, context))
          .map((s) => s.name),
        totalStrategies: this.strategies.length,
      });

      // Re-throw original error since recovery failed
      throw error;
    }
  }

  /**
   * Add a new recovery strategy dynamically
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    // Re-sort by priority
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a recovery strategy by name
   */
  removeStrategy(strategyName: string): boolean {
    const initialLength = this.strategies.length;
    this.strategies = this.strategies.filter((s) => s.name !== strategyName);
    return this.strategies.length < initialLength;
  }

  /**
   * Get list of available strategies
   */
  getStrategies(): readonly RecoveryStrategy[] {
    return [...this.strategies];
  }
}

/**
 * Helper function to create a search context
 */
export function createSearchContext(
  queries: SearchQueryItem[],
  attempt = 1,
  previousResults?: SearchResultItem[],
  requestId?: string
): SearchContext {
  const context: SearchContext = {
    queries,
    attempt,
    startTime: Date.now(),
  };

  if (previousResults !== undefined) {
    context.previousResults = previousResults;
  }

  if (requestId !== undefined) {
    context.requestId = requestId;
  }

  return context;
}

/**
 * Helper function to create a retry context for subsequent attempts
 */
export function createRetryContext(
  originalContext: SearchContext,
  newAttempt: number
): SearchContext {
  return {
    ...originalContext,
    attempt: newAttempt,
  };
}
