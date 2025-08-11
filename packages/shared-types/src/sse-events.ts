import { z } from "zod";

// Research Stages Enum
export const ResearchStageSchema = z.enum([
  "IDLE",
  "INITIALIZING",
  "GENERATING_QUERIES",
  "FETCHING_DOCUMENTS",
  "ANALYZING_DOCUMENTS",
  "SYNTHESIZING_FINDINGS",
  "ASSESSING_RESEARCH",
  "GENERATING_REPORT",
  "ITERATION_PAUSED",
  "HUMAN_REVIEW_REQUESTED",
  "COMPLETED",
  "ERROR",
]);

export type ResearchStage = z.infer<typeof ResearchStageSchema>;

// Base SSE Event Schema
export const BaseSSEEventSchema = z.object({
  timestamp: z.string().optional(),
  eventId: z.string().optional(),
});

// Stage Change Event
export const StageChangeEventSchema = BaseSSEEventSchema.extend({
  stage: ResearchStageSchema,
  message: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedTimeRemaining: z.string().optional(),
});

export type StageChangeEvent = z.infer<typeof StageChangeEventSchema>;

// Query Generated Event
export const QueryGeneratedEventSchema = BaseSSEEventSchema.extend({
  queries: z.array(
    z.object({
      query_string: z.string(),
      expected_information_summary: z.string(),
      timestamp: z.string().optional(),
    })
  ),
  totalQueries: z.number().optional(),
  reasoningEntryPoints: z
    .object({
      analyzeLegalQuestionSummary: z.string(),
      totalStepsAnalyzed: z.number(),
    })
    .optional(),
});

export type QueryGeneratedEvent = z.infer<typeof QueryGeneratedEventSchema>;

// Document Fetched Event
export const DocumentFetchedEventSchema = BaseSSEEventSchema.extend({
  docId: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["fetched", "error"]),
  globalSequenceNumber: z.number().optional(),
  iterationIndex: z.number().optional(),
  fetchBatchIndex: z.number().optional(),
  fetchOrderIndex: z.number().optional(),
  searchQueryId: z.string().optional(),
  fetchTimestamp: z.string().optional(),
});

export type DocumentFetchedEvent = z.infer<typeof DocumentFetchedEventSchema>;

// Document Analyzed Event
export const DocumentAnalyzedEventSchema = BaseSSEEventSchema.extend({
  docId: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  status: z.enum(["analyzing", "analyzed", "failed", "error"]),
  relevanceScore: z.number().min(0).max(10).optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  summarySnippet: z.string().optional(),
  keyArguments: z.array(z.string()).optional(),
  extractedEntities: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        details: z.string().optional(),
      })
    )
    .optional(),
  extractedQuotes: z.array(z.string()).optional(),
  counterArguments: z.array(z.string()).optional(),
  errorMessage: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  estimatedTime: z.string().optional(),
});

export type DocumentAnalyzedEvent = z.infer<typeof DocumentAnalyzedEventSchema>;

// Synthesis Complete Event
export const SynthesisCompleteEventSchema = BaseSSEEventSchema.extend({
  topics: z.array(
    z.object({
      title: z.string(),
      synthesisSnippet: z.string(),
      confidence: z.number().min(0).max(1),
      docIds: z.array(z.string()),
      timestamp: z.string().optional(),
    })
  ),
  unansweredAspects: z.array(z.string()).optional(),
  emergingQuestions: z.array(z.string()).optional(),
  reasoningSummary: z.string().optional(),
});

export type SynthesisCompleteEvent = z.infer<
  typeof SynthesisCompleteEventSchema
>;

// Assessment Complete Event
export const AssessmentCompleteEventSchema = BaseSSEEventSchema.extend({
  isSufficient: z.boolean(),
  assessmentSummary: z.string(),
  nextAction: z.enum([
    "GENERATE_REPORT",
    "REFINE_QUERIES",
    "NEW_QUERIES",
    "REQUEST_HUMAN_REVIEW",
  ]),
  identifiedGaps: z.array(z.string()).optional(),
  suggestedRefinementQueries: z
    .array(
      z.object({
        query_string: z.string(),
        expected_information_summary: z.string().optional(),
      })
    )
    .optional(),
});

export type AssessmentCompleteEvent = z.infer<
  typeof AssessmentCompleteEventSchema
>;

// Report Chunk Event (for streaming report content)
export const ReportChunkEventSchema = BaseSSEEventSchema.extend({
  fieldName: z.enum(["title", "executiveSummary", "section", "conclusion"]),
  content: z.string(),
  isFieldComplete: z.boolean().optional(),
  sectionInfo: z
    .object({
      index: z.number(),
      title: z.string(),
    })
    .optional(),
});

export type ReportChunkEvent = z.infer<typeof ReportChunkEventSchema>;

// Error Event
export const ErrorEventSchema = BaseSSEEventSchema.extend({
  error: z.string(),
  errorType: z
    .enum(["network", "api", "validation", "timeout", "unknown"])
    .optional(),
  stage: ResearchStageSchema.optional(),
  recoverable: z.boolean().optional(),
  retryAfter: z.number().optional(),
  details: z.record(z.any()).optional(),
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

// Progress Event
export const ProgressEventSchema = BaseSSEEventSchema.extend({
  stage: ResearchStageSchema,
  current: z.number(),
  total: z.number(),
  percentage: z.number().min(0).max(100),
  estimatedTimeRemaining: z.string().optional(),
  itemBeingProcessed: z.string().optional(),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

// Completion Event
export const CompletionEventSchema = BaseSSEEventSchema.extend({
  message: z.string(),
  finalStage: ResearchStageSchema.optional(),
  totalDuration: z.number().optional(),
  summary: z
    .object({
      queriesGenerated: z.number().optional(),
      documentsAnalyzed: z.number().optional(),
      topicsSynthesized: z.number().optional(),
      reportGenerated: z.boolean().optional(),
    })
    .optional(),
});

export type CompletionEvent = z.infer<typeof CompletionEventSchema>;

// Union of all SSE events for discriminated union
export const SSEEventDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stage.change"), data: StageChangeEventSchema }),
  z.object({
    type: z.literal("query.generated"),
    data: QueryGeneratedEventSchema,
  }),
  z.object({
    type: z.literal("document.fetched"),
    data: DocumentFetchedEventSchema,
  }),
  z.object({
    type: z.literal("document.analyzed"),
    data: DocumentAnalyzedEventSchema,
  }),
  z.object({
    type: z.literal("synthesis.complete"),
    data: SynthesisCompleteEventSchema,
  }),
  z.object({
    type: z.literal("assessment.complete"),
    data: AssessmentCompleteEventSchema,
  }),
  z.object({ type: z.literal("report.chunk"), data: ReportChunkEventSchema }),
  z.object({ type: z.literal("progress"), data: ProgressEventSchema }),
  z.object({ type: z.literal("error"), data: ErrorEventSchema }),
  z.object({ type: z.literal("complete"), data: CompletionEventSchema }),
]);

export type SSEEventData = z.infer<typeof SSEEventDataSchema>;

// Server-Sent Event wrapper
export const SSEEventSchema = z.object({
  event: z.string(),
  data: z.string(), // JSON stringified event data
  id: z.string().optional(),
  retry: z.number().optional(),
});

export type SSEEvent = z.infer<typeof SSEEventSchema>;

// Utility function to create type-safe SSE events
export function createSSEEvent<T extends SSEEventData["type"]>(
  type: T,
  data: Extract<SSEEventData, { type: T }>["data"]
): SSEEventData {
  return { type, data } as SSEEventData;
}

// Validation helpers
export const validateSSEEvent = (event: unknown): SSEEventData => {
  return SSEEventDataSchema.parse(event);
};

export const isValidSSEEvent = (event: unknown): event is SSEEventData => {
  return SSEEventDataSchema.safeParse(event).success;
};

// Event type guards
export function isStageChangeEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "stage.change" }> {
  return event.type === "stage.change";
}

export function isQueryGeneratedEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "query.generated" }> {
  return event.type === "query.generated";
}

export function isDocumentFetchedEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "document.fetched" }> {
  return event.type === "document.fetched";
}

export function isDocumentAnalyzedEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "document.analyzed" }> {
  return event.type === "document.analyzed";
}

export function isSynthesisCompleteEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "synthesis.complete" }> {
  return event.type === "synthesis.complete";
}

export function isAssessmentCompleteEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "assessment.complete" }> {
  return event.type === "assessment.complete";
}

export function isReportChunkEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "report.chunk" }> {
  return event.type === "report.chunk";
}

export function isProgressEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "progress" }> {
  return event.type === "progress";
}

export function isErrorEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "error" }> {
  return event.type === "error";
}

export function isCompletionEvent(
  event: SSEEventData
): event is Extract<SSEEventData, { type: "complete" }> {
  return event.type === "complete";
}
