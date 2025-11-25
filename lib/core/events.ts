import type {
  SearchQueryItem,
  SearchResultItem,
  AnalyzedDocument,
  FinalLegalReport,
} from "@/baml_client/types";

export type ResearchEvent =
  | { type: "ResearchStarted"; question: string; sessionId: string }
  | { type: "QueryGenerationStarted" }
  | { type: "QueriesGenerated"; queries: SearchQueryItem[] }
  | { type: "SearchStarted"; queries: SearchQueryItem[] }
  | { type: "SearchResultsFetched"; results: SearchResultItem[] }
  | { type: "DocumentAnalysisStarted"; documentId: string }
  | { type: "DocumentAnalyzed"; documentId: string; analysis: AnalyzedDocument }
  | { type: "DocumentAnalysisFailed"; documentId: string; error: string }
  | { type: "SynthesisStarted" }
  | { type: "SynthesisCompleted"; synthesis: any } // Type from BAML if available, otherwise any
  | { type: "ReportGenerationStarted" }
  | {
      type: "ReportChunkGenerated";
      field: keyof FinalLegalReport;
      content: string;
    }
  | { type: "ReportCompleted"; report: FinalLegalReport }
  | { type: "ResearchFailed"; error: string };
