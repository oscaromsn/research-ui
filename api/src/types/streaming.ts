/**
 * Server-Sent Events (SSE) types for research pipeline streaming
 * Compatible with the original Next.js ResearchUpdate format
 */

import type {
  LegalQueryAnalysis,
  SearchResultItem,
  AnalyzedDocument,
  OverallSynthesis,
  ResearchAssessment,
  FinalLegalReport,
} from "../../baml_client/types";

/**
 * The type of update being sent via SSE
 */
export type ResearchUpdateType =
  | "STATUS_CHANGE"   // Pipeline stage changes
  | "DATA"           // Actual research data (queries, documents, etc.)
  | "LOG"            // Informational logging
  | "ERROR"          // Error occurred
  | "PROGRESS"       // Progress updates (percentages, counts)
  | "STREAM_CHUNK";  // Text streaming chunks (for report generation)

/**
 * The current stage of the research pipeline
 */
export type ResearchPipelineStage =
  | "INITIALIZING"
  | "GENERATING_QUERIES"
  | "FETCHING_DOCUMENTS"
  | "ANALYZING_DOCUMENTS"
  | "SYNTHESIZING_FINDINGS"
  | "ASSESSING_RESEARCH"
  | "GENERATING_REPORT"
  | "COMPLETED"
  | "ERROR";

/**
 * Data payloads for different types of updates
 */
export interface ResearchUpdateData {
  // Query generation data
  queryAnalysis?: LegalQueryAnalysis;
  generatedQueries?: LegalQueryAnalysis["search_queries"];
  
  // Document fetching data
  fetchedDocuments?: SearchResultItem[];
  documentBatch?: {
    query: string;
    results: SearchResultItem[];
    batchIndex: number;
    totalBatches: number;
  };
  
  // Document analysis data
  analyzedDocuments?: AnalyzedDocument[];
  documentAnalysis?: {
    document: SearchResultItem;
    analysis: AnalyzedDocument;
    index: number;
    total: number;
  };
  
  // Synthesis data
  synthesis?: OverallSynthesis;
  synthesizedTopic?: {
    topic: OverallSynthesis["key_synthesized_topics"][0];
    index: number;
    total: number;
  };
  
  // Assessment data
  assessment?: ResearchAssessment;
  
  // Report generation data
  finalReport?: FinalLegalReport;
  reportSection?: {
    section: FinalLegalReport["sections"][0];
    index: number;
    total: number;
  };
  
  // Progress data
  progress?: {
    current: number;
    total: number;
    percentage: number;
    operation?: string;
  };
  
  // Error data
  error?: {
    message: string;
    code?: string;
    stage?: ResearchPipelineStage;
    recoverable?: boolean;
  };
  
  // Stream chunk data (for real-time text generation)
  streamChunk?: {
    content: string;
    section?: string;
    isComplete?: boolean;
  };
  
  // Generic metadata
  metadata?: {
    timestamp: string;
    processingTime?: number;
    iteration?: number;
    [key: string]: unknown;
  };
}

/**
 * The main research update structure sent via SSE
 * Compatible with Next.js frontend expectations
 */
export interface ResearchUpdate {
  /** Current stage of the research pipeline */
  stage: ResearchPipelineStage;
  
  /** Type of update being sent */
  type: ResearchUpdateType;
  
  /** Human-readable message describing the update */
  message: string;
  
  /** Structured data payload (client-friendly, summarized) */
  data?: ResearchUpdateData;
  
  /** Unique identifier for this update */
  id?: string;
  
  /** Timestamp when update was generated */
  timestamp: string;
}

/**
 * SSE connection state for tracking client connections
 */
export interface SSEConnectionState {
  isConnected: boolean;
  clientId: string;
  startTime: Date;
  stage: ResearchPipelineStage;
  lastUpdateTime: Date;
}

/**
 * Configuration for SSE streaming behavior
 */
export interface SSEStreamConfig {
  /** Keep-alive interval in milliseconds */
  keepAliveInterval?: number;
  
  /** Maximum connection time in milliseconds */
  maxConnectionTime?: number;
  
  /** Enable detailed progress updates */
  enableProgressUpdates?: boolean;
  
  /** Enable stream chunk updates for real-time text */
  enableStreamChunks?: boolean;
  
  /** Custom headers for SSE response */
  customHeaders?: Record<string, string>;
}

/**
 * Utility type for SSE event formatting
 */
export interface SSEEvent {
  id?: string;
  event?: string;
  data: string;
  retry?: number;
}

/**
 * Research session context for SSE streaming
 */
export interface ResearchSession {
  sessionId: string;
  legalQuestion: string;
  startTime: Date;
  currentStage: ResearchPipelineStage;
  config: SSEStreamConfig;
  connectionState: SSEConnectionState;
}