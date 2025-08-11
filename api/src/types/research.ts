import type {
  AnalyzedDocument,
  FinalLegalReport,
  LegalQueryAnalysis,
  OverallSynthesis,
  ResearchAssessment,
  SearchResultItem,
} from "../../baml_client/types";

// Auto mode configuration interface
export interface AutoModeConfig {
  isEnabled: boolean;
  maxIterations: number;
  currentIteration: number;
}

// Research pipeline result for non-streaming endpoint
export interface ResearchPipelineResult {
  queryAnalysis: LegalQueryAnalysis | null;
  fetchedDocuments: SearchResultItem[];
  analyzedDocuments: AnalyzedDocument[];
  synthesis: OverallSynthesis | null;
  assessment: ResearchAssessment | null;
  finalReport: FinalLegalReport | null;
  metadata: {
    processingTime: number;
    documentsProcessed: number;
    queriesExecuted: number;
    iteration: number;
  };
}

// Request interface for research endpoint
export interface ResearchRequest {
  legalQuestion: string;
  autoModeConfig?: AutoModeConfig;
  previouslyAnalyzedDocs?: Array<{
    docId: string;
    title?: string;
    url?: string;
    timestamp?: string;
    status: string;
  }>;
}