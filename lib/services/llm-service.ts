import { Effect, Context, Layer, Data } from "effect";
import { b } from "@/baml_client";
import type {
  LegalQueryAnalysis,
  AnalyzedDocument,
  FinalLegalReport,
  SearchResultItem,
  SearchQueryItem,
} from "@/baml_client/types";
import { EventBus } from "@/lib/core/event-bus";

// Error types for the LLM service
export class LLMError extends Data.TaggedError("LLMError")<{
  message: string;
  cause?: unknown;
}> {}

export class LLMService extends Context.Tag("LLMService")<
  LLMService,
  {
    generateQueries: (
      question: string
    ) => Effect.Effect<LegalQueryAnalysis, LLMError>;
    analyzeDocument: (
      doc: SearchResultItem,
      question: string
    ) => Effect.Effect<AnalyzedDocument, LLMError>;
    generateReport: (
      question: string,
      queries: SearchQueryItem[],
      analyzedDocs: AnalyzedDocument[]
    ) => Effect.Effect<FinalLegalReport, LLMError>;
  }
>() {
  static Default = Layer.effect(
    LLMService,
    Effect.gen(function* () {
      const eventBus = yield* EventBus;

      return {
        generateQueries: (question: string) =>
          Effect.gen(function* () {
            yield* eventBus.publish({ type: "QueryGenerationStarted" });

            const result = yield* Effect.tryPromise({
              try: async () => {
                // Try streaming first
                try {
                  const stream = b.stream.GenerateLegalSearchQueries(question);

                  // Process stream chunks (for potential UI updates)
                  for await (const _partialResult of stream) {
                    // We could publish partial updates here if needed
                    // For now, we'll just consume the stream
                  }

                  return await stream.getFinalResponse();
                } catch (streamError) {
                  // Fallback to non-streaming
                  console.warn(
                    "Streaming failed, using non-streaming query generation"
                  );
                  return await b.GenerateLegalSearchQueries(question);
                }
              },
              catch: (error) =>
                new LLMError({
                  message: `Query generation failed: ${error instanceof Error ? error.message : String(error)}`,
                  cause: error,
                }),
            });

            yield* eventBus.publish({
              type: "QueriesGenerated",
              queries: result.search_queries,
            });

            return result;
          }),

        analyzeDocument: (doc: SearchResultItem, question: string) =>
          Effect.gen(function* () {
            yield* eventBus.publish({
              type: "DocumentAnalysisStarted",
              documentId: doc.id,
            });

            const result = yield* Effect.tryPromise({
              try: async () => {
                // Try streaming first
                try {
                  const stream = b.stream.AnalyzeSingleDocument(doc, question);

                  for await (const _partialResult of stream) {
                    // Consume stream
                  }

                  return await stream.getFinalResponse();
                } catch (streamError) {
                  // Fallback to non-streaming
                  console.warn(
                    "Streaming failed, using non-streaming document analysis"
                  );
                  return await b.AnalyzeSingleDocument(doc, question);
                }
              },
              catch: (error) => {
                // Publish failure event
                Effect.runSync(
                  eventBus.publish({
                    type: "DocumentAnalysisFailed",
                    documentId: doc.id,
                    error:
                      error instanceof Error ? error.message : String(error),
                  })
                );

                return new LLMError({
                  message: `Document analysis failed for ${doc.id}: ${error instanceof Error ? error.message : String(error)}`,
                  cause: error,
                });
              },
            });

            yield* eventBus.publish({
              type: "DocumentAnalyzed",
              documentId: doc.id,
              analysis: result,
            });

            return result;
          }),

        generateReport: (question, queries, analyzedDocs) =>
          Effect.gen(function* () {
            yield* eventBus.publish({ type: "ReportGenerationStarted" });

            const result = yield* Effect.tryPromise({
              try: async () => {
                // Try streaming first
                try {
                  const stream = b.stream.GenerateFinalLegalReport({
                    legal_question: question,
                    search_queries: queries,
                    analyzed_documents: analyzedDocs,
                  });

                  for await (const _partialResult of stream) {
                    // Could publish chunk events here
                    // yield* eventBus.publish({ type: "ReportChunkGenerated", ... })
                  }

                  return await stream.getFinalResponse();
                } catch (streamError) {
                  // Fallback to non-streaming
                  console.warn(
                    "Streaming failed, using non-streaming report generation"
                  );
                  return await b.GenerateFinalLegalReport({
                    legal_question: question,
                    search_queries: queries,
                    analyzed_documents: analyzedDocs,
                  });
                }
              },
              catch: (error) =>
                new LLMError({
                  message: `Report generation failed: ${error instanceof Error ? error.message : String(error)}`,
                  cause: error,
                }),
            });

            yield* eventBus.publish({
              type: "ReportCompleted",
              report: result,
            });

            return result;
          }),
      };
    })
  );
}
