import type { ResearchEvent } from "./events";
import type {
  SearchResultItem,
  AnalyzedDocument,
  FinalLegalReport,
} from "@/baml_client/types";

export interface ResearchStateModel {
  sessionId: string;
  question: string;
  status:
    | "idle"
    | "initializing"
    | "generating_queries"
    | "fetching_documents"
    | "analyzing_documents"
    | "synthesizing_findings"
    | "generating_report"
    | "completed"
    | "error";
  generatedQueries: any[];
  documents: SearchResultItem[];
  analyzedDocuments: Record<string, AnalyzedDocument>;
  documentAnalysisStatus: Record<
    string,
    "pending" | "analyzing" | "analyzed" | "failed"
  >;
  report: FinalLegalReport | null;
  error: string | null;
  startTime: number;
  lastUpdated: number;
}

export const initialState: ResearchStateModel = {
  sessionId: "",
  question: "",
  status: "idle",
  generatedQueries: [],
  documents: [],
  analyzedDocuments: {},
  documentAnalysisStatus: {},
  report: null,
  error: null,
  startTime: Date.now(),
  lastUpdated: Date.now(),
};

export function researchReducer(
  state: ResearchStateModel,
  event: ResearchEvent
): ResearchStateModel {
  const now = Date.now();

  switch (event.type) {
    case "ResearchStarted":
      return {
        ...initialState,
        sessionId: event.sessionId,
        question: event.question,
        status: "initializing",
        startTime: now,
        lastUpdated: now,
      };

    case "QueryGenerationStarted":
      return {
        ...state,
        status: "generating_queries",
        lastUpdated: now,
      };

    case "QueriesGenerated":
      return {
        ...state,
        generatedQueries: event.queries,
        lastUpdated: now,
      };

    case "SearchStarted":
      return {
        ...state,
        status: "fetching_documents",
        lastUpdated: now,
      };

    case "SearchResultsFetched":
      const newDocs = event.results;
      const newStatusMap = { ...state.documentAnalysisStatus };
      newDocs.forEach((doc) => {
        if (!newStatusMap[doc.id]) {
          newStatusMap[doc.id] = "pending";
        }
      });

      return {
        ...state,
        documents: [...state.documents, ...newDocs], // Append or replace? Usually append for multi-step, but here likely replace or append unique. Let's append for now.
        documentAnalysisStatus: newStatusMap,
        lastUpdated: now,
      };

    case "DocumentAnalysisStarted":
      return {
        ...state,
        status: "analyzing_documents",
        documentAnalysisStatus: {
          ...state.documentAnalysisStatus,
          [event.documentId]: "analyzing",
        },
        lastUpdated: now,
      };

    case "DocumentAnalyzed":
      return {
        ...state,
        analyzedDocuments: {
          ...state.analyzedDocuments,
          [event.documentId]: event.analysis,
        },
        documentAnalysisStatus: {
          ...state.documentAnalysisStatus,
          [event.documentId]: "analyzed",
        },
        lastUpdated: now,
      };

    case "DocumentAnalysisFailed":
      return {
        ...state,
        documentAnalysisStatus: {
          ...state.documentAnalysisStatus,
          [event.documentId]: "failed",
        },
        lastUpdated: now,
      };

    case "SynthesisStarted":
      return {
        ...state,
        status: "synthesizing_findings",
        lastUpdated: now,
      };

    case "ReportGenerationStarted":
      return {
        ...state,
        status: "generating_report",
        lastUpdated: now,
      };

    case "ReportCompleted":
      return {
        ...state,
        status: "completed",
        report: event.report,
        lastUpdated: now,
      };

    case "ResearchFailed":
      return {
        ...state,
        status: "error",
        error: event.error,
        lastUpdated: now,
      };

    default:
      return state;
  }
}
