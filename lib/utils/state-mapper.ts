import type { ResearchStateModel } from "@/lib/core/research-reducer";
import type {
  ResearchUpdate,
  ResearchStage,
} from "@/app/actions/researchAgentOrchestrator";
import {
  truncateForSummary,
  truncateForTitle,
} from "@/lib/utils/textTruncation";

/**
 * Maps internal ResearchState to frontend ResearchUpdate protocol
 * This maintains backward compatibility with the existing frontend
 */
export function mapStateToUpdate(state: ResearchStateModel): ResearchUpdate {
  const stage = mapStatusToStage(state.status);

  // Build the update based on the current state
  const update: ResearchUpdate = {
    type: "DATA",
    stage,
    message: getStateMessage(state),
    data: getStateData(state),
  };

  // Add progress information if in analyzing stage
  if (stage === "ANALYZING_DOCUMENTS") {
    const totalDocs = state.documents.length;
    const analyzedCount = Object.keys(state.analyzedDocuments).length;

    update.currentProcessedDoc = analyzedCount;
    update.totalDocsToProcess = totalDocs;
    update.progress =
      totalDocs > 0 ? Math.round((analyzedCount / totalDocs) * 100) : 0;
  }

  return update;
}

function mapStatusToStage(status: ResearchStateModel["status"]): ResearchStage {
  switch (status) {
    case "idle":
      return "IDLE";
    case "initializing":
      return "INITIALIZING";
    case "generating_queries":
      return "GENERATING_QUERIES";
    case "fetching_documents":
      return "FETCHING_DOCUMENTS";
    case "analyzing_documents":
      return "ANALYZING_DOCUMENTS";
    case "synthesizing_findings":
      return "SYNTHESIZING_FINDINGS";
    case "generating_report":
      return "GENERATING_REPORT";
    case "completed":
      return "COMPLETED";
    case "error":
      return "ERROR";
    default:
      return "IDLE";
  }
}

function getStateMessage(state: ResearchStateModel): string {
  switch (state.status) {
    case "initializing":
      return "Initializing research session...";
    case "generating_queries":
      return "Generating search queries...";
    case "fetching_documents":
      return `Fetching documents... (${state.documents.length} found)`;
    case "analyzing_documents": {
      const total = state.documents.length;
      const analyzed = Object.keys(state.analyzedDocuments).length;
      return `Analyzing documents... (${analyzed}/${total})`;
    }
    case "synthesizing_findings":
      return "Synthesizing findings...";
    case "generating_report":
      return "Generating final report...";
    case "completed":
      return "Research completed successfully";
    case "error":
      return `Error: ${state.error || "Unknown error"}`;
    default:
      return "Ready";
  }
}

function getStateData(state: ResearchStateModel): unknown {
  switch (state.status) {
    case "generating_queries":
      return {
        queries: state.generatedQueries.map((q: any) => ({
          query_string: q.query_string,
          expected_information_summary: q.expected_information
            ? Array.isArray(q.expected_information)
              ? q.expected_information.join(" ")
              : String(q.expected_information)
            : "",
        })),
      };

    case "fetching_documents":
      return {
        count: state.documents.length,
        titles: state.documents.map((d) =>
          d.title ? truncateForTitle(d.title) : "Untitled"
        ),
        sources: state.documents.map((d) => d.source_name),
      };

    case "analyzing_documents": {
      // Return details about analyzed documents
      const analyzedDocs = Object.entries(state.analyzedDocuments).map(
        ([docId, analysis]) => {
          const doc = state.documents.find((d) => d.id === docId);
          return {
            docId,
            title: doc?.title,
            url: doc?.url,
            status: "analyzed",
            relevanceScore: analysis.relevance_score,
            confidenceScore: analysis.confidence_score,
            summarySnippet: truncateForSummary(analysis.summary),
            keyArguments: analysis.key_arguments_and_reasoning,
          };
        }
      );

      return { analyzedDocuments: analyzedDocs };
    }

    case "completed":
      return {
        report: state.report,
      };

    default:
      return {};
  }
}
