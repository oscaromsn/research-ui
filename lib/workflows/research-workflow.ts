import { Effect, Context, Layer, Stream } from "effect";
import { EventBus } from "@/lib/core/event-bus";
import { ResearchState } from "@/lib/core/research-state";
import { SearchService } from "@/lib/services/search-service";
import { LLMService } from "@/lib/services/llm-service";
import { config } from "@/lib/config";

export class ResearchWorkflow extends Context.Tag("ResearchWorkflow")<
  ResearchWorkflow,
  {
    start: Effect.Effect<void>;
  }
>() {
  static Default = Layer.effect(
    ResearchWorkflow,
    Effect.gen(function* () {
      const eventBus = yield* EventBus;
      const researchState = yield* ResearchState;
      const searchService = yield* SearchService;
      const llmService = yield* LLMService;

      // Workflow: Listen for ResearchStarted -> Generate Queries
      const queryGenerationWorkflow = eventBus.subscribe.pipe(
        Stream.filter((event) => event.type === "ResearchStarted"),
        Stream.runForEach((event) => {
          return Effect.gen(function* () {
            if (event.type !== "ResearchStarted") return;

            console.log(
              "[Workflow] Starting query generation for:",
              event.question
            );

            const queryAnalysis = yield* llmService.generateQueries(
              event.question
            );

            console.log(
              "[Workflow] Generated queries:",
              queryAnalysis.search_queries.length
            );
          }).pipe(
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                console.error("[Workflow] Query generation failed:", error);
                yield* eventBus.publish({
                  type: "ResearchFailed",
                  error: error instanceof Error ? error.message : String(error),
                });
              })
            )
          );
        }),
        Effect.fork
      );

      // Workflow: Listen for QueriesGenerated -> Search
      const searchWorkflow = eventBus.subscribe.pipe(
        Stream.filter((event) => event.type === "QueriesGenerated"),
        Stream.runForEach((event) =>
          Effect.gen(function* () {
            if (event.type !== "QueriesGenerated") return;

            console.log(
              `[Workflow] Starting search for ${event.queries.length} queries`
            );

            yield* eventBus.publish({
              type: "SearchStarted",
              queries: event.queries,
            });

            const maxQueries = config.research.maxQueriesPerIteration;
            const queriesToExecute = event.queries.slice(0, maxQueries);
            const resultsPerQuery = config.research.maxDocumentsPerQuery;

            const results = yield* searchService.search(
              queriesToExecute,
              resultsPerQuery
            );

            yield* eventBus.publish({
              type: "SearchResultsFetched",
              results,
            });

            console.log(`[Workflow] Fetched ${results.length} documents`);
          }).pipe(
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                console.error("[Workflow] Search failed:", error);
                yield* eventBus.publish({
                  type: "ResearchFailed",
                  error: error instanceof Error ? error.message : String(error),
                });
              })
            )
          )
        ),
        Effect.fork
      );

      // Workflow: Listen for SearchResultsFetched -> Analyze Documents
      const analysisWorkflow = eventBus.subscribe.pipe(
        Stream.filter((event) => event.type === "SearchResultsFetched"),
        Stream.runForEach((event) =>
          Effect.gen(function* () {
            if (event.type !== "SearchResultsFetched") return;

            console.log(
              `[Workflow] Starting analysis of ${event.results.length} documents`
            );

            // Get the question from the current state
            const state = yield* researchState.get;
            const question = state.question;

            // Analyze documents concurrently with controlled concurrency
            const maxConcurrent = 5;

            // Process documents in batches for controlled concurrency
            for (let i = 0; i < event.results.length; i += maxConcurrent) {
              const batch = event.results.slice(i, i + maxConcurrent);

              yield* Effect.all(
                batch.map((doc) =>
                  Effect.gen(function* () {
                    const analysis = yield* llmService.analyzeDocument(
                      doc,
                      question
                    );
                    console.log(
                      `[Workflow] Analyzed document: ${doc.title || doc.id}`
                    );
                    return analysis;
                  }).pipe(
                    Effect.catchAll((error) =>
                      Effect.gen(function* () {
                        console.warn(
                          `[Workflow] Document analysis failed for ${doc.id}:`,
                          error
                        );
                        // Return null to continue with other documents
                        return yield* Effect.succeed(null);
                      })
                    )
                  )
                ),
                { concurrency: maxConcurrent }
              );
            }

            console.log(`[Workflow] Completed document analysis`);

            yield* eventBus.publish({ type: "SynthesisStarted" });
          }).pipe(
            Effect.catchAll((err: unknown) =>
              Effect.gen(function* () {
                console.error("[Workflow] Analysis workflow failed:", err);
                yield* eventBus.publish({
                  type: "ResearchFailed",
                  error: err instanceof Error ? err.message : String(err),
                });
              })
            )
          )
        ),
        Effect.fork
      );

      // Workflow: Listen for SynthesisStarted -> Generate Report
      const reportWorkflow = eventBus.subscribe.pipe(
        Stream.filter((event) => event.type === "SynthesisStarted"),
        Stream.runForEach(() => {
          return Effect.gen(function* () {
            console.log("[Workflow] Starting report generation");

            // Retrieve all necessary data from state
            const state = yield* researchState.get;
            const question = state.question;
            const queries = state.generatedQueries;
            const documents = state.documents;
            const analyzedDocs = Object.values(state.analyzedDocuments);

            yield* llmService.generateReport(question, queries, analyzedDocs);

            console.log("[Workflow] Report generation completed");
          }).pipe(
            Effect.catchAll((error) =>
              Effect.gen(function* () {
                console.error("[Workflow] Report generation failed:", error);
                yield* eventBus.publish({
                  type: "ResearchFailed",
                  error: error instanceof Error ? error.message : String(error),
                });
              })
            )
          );
        }),
        Effect.fork
      );

      return {
        start: Effect.gen(function* () {
          console.log("[Workflow] Starting all workflows...");

          // Start all workflows in parallel
          yield* queryGenerationWorkflow;
          yield* searchWorkflow;
          yield* analysisWorkflow;
          yield* reportWorkflow;

          console.log("[Workflow] All workflows started");
        }),
      };
    })
  );
}
