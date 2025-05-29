"use client";

import { Modal } from "@/components/ui/modal";
import type { ClientAnalysisReasoning } from "@/lib/state/researchAtoms";

interface AnalysisReasoningModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  reasoning?: ClientAnalysisReasoning;
  documentTitle?: string;
}

export function AnalysisReasoningModal({
  isOpen,
  onCloseAction,
  reasoning,
  documentTitle,
}: AnalysisReasoningModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCloseAction}
      title={`Analysis Reasoning: ${documentTitle || "Document"}`}
      size="xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2 text-[#2d3748] dark:text-[#e2e8f0]">
              Legal Question Analysis
            </h3>
            <p
              data-testid="legal-question-summary"
              className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed bg-[#f8fafc] dark:bg-[#1e2436] p-3 rounded"
            >
              {reasoning?.analyzeLegalQuestionSummary ||
                "No reasoning available for the legal question analysis."}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2 text-[#2d3748] dark:text-[#e2e8f0]">
              Relevant Legal Principles
            </h3>
            <p
              data-testid="relevant-principles-summary"
              className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed bg-[#f8fafc] dark:bg-[#1e2436] p-3 rounded"
            >
              {reasoning?.considerRelevantPrinciplesSummary ||
                "No reasoning available for legal principles consideration."}
            </p>
          </div>

          {reasoning?.formulateSearchQueriesSummary && (
            <div>
              <h3 className="font-medium mb-2 text-[#2d3748] dark:text-[#e2e8f0]">
                Search Query Strategy
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed bg-[#f8fafc] dark:bg-[#1e2436] p-3 rounded">
                {reasoning.formulateSearchQueriesSummary}
              </p>
            </div>
          )}

          {reasoning?.specifyExpectedInfoSummary && (
            <div>
              <h3 className="font-medium mb-2 text-[#2d3748] dark:text-[#e2e8f0]">
                Expected Information Strategy
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed bg-[#f8fafc] dark:bg-[#1e2436] p-3 rounded">
                {reasoning.specifyExpectedInfoSummary}
              </p>
            </div>
          )}

          {reasoning?.ensureComprehensiveCoverageSummary && (
            <div>
              <h3 className="font-medium mb-2 text-[#2d3748] dark:text-[#e2e8f0]">
                Comprehensive Coverage Strategy
              </h3>
              <p className="text-sm text-[#4a5568] dark:text-[#a0aec0] leading-relaxed bg-[#f8fafc] dark:bg-[#1e2436] p-3 rounded">
                {reasoning.ensureComprehensiveCoverageSummary}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-[#e1e5eb] dark:border-[#2a3148]">
          <button
            type="button"
            onClick={onCloseAction}
            className="px-4 py-2 bg-[#3a7bb7] hover:bg-[#2c5d8a] text-white rounded text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
