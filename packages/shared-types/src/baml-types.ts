/**
 * BAML Types Re-export for Frontend
 *
 * This module re-exports BAML-generated types from the API's baml_client
 * to maintain clean architecture separation between frontend and backend.
 *
 * The frontend should import these types from this module instead of
 * directly importing from the API's baml_client directory.
 */

// Re-export all BAML types for frontend consumption
export type {
  AnalyzedDocument,
  Check,
  Checked,
  DetailedReasoning,
  // Report types
  FinalLegalReport,
  LegalEntity,
  // Analysis types
  LegalQueryAnalysis,
  LegalReportSection,
  NextActionType,
  OverallSynthesis,
  // Support types
  ReasoningStep,
  // Utility types
  RecursivePartialNull,
  ResearchAssessment,
  // Basic types
  SearchQueryItem,
  SearchResultItem,
  SynthesizedTopic,
} from "../../../api/baml_client/types.js";

// Note: Using relative path to import from API's generated client
// This ensures frontend gets types from the same source as backend
// while maintaining architectural boundaries
