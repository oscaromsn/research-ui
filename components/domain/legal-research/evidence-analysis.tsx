"use client";

import { DocumentDetails } from "./document-details";
import { DocumentList } from "./document-list";
import { EvidenceAnalysisHeader } from "./evidence-analysis-header";
import { useEvidenceAnalysis } from "./hooks/useEvidenceAnalysis";
import { AnalysisReasoningModal } from "./modals/analysis-reasoning-modal";
import { CaseModal } from "./modals/case-modal";

export function EvidenceAnalysis() {
  const {
    selectedCase,
    showReasoningModal,
    selectedDocId,
    sortedDocuments,
    selectedDocument,
    handleDocumentClick,
    handleDocumentKeyUp,
    handleViewAnalysis,
    handleCloseCase,
    handleCloseReasoningModal,
  } = useEvidenceAnalysis();

  const caseModalProps = selectedCase
    ? {
        documentData: selectedCase,
        ...(selectedCase.analysisReasoning && {
          onViewAnalysis: handleViewAnalysis,
        }),
      }
    : {};

  const reasoningModalProps = selectedDocument
    ? {
        ...(selectedDocument.analysisReasoning && {
          reasoning: selectedDocument.analysisReasoning,
        }),
        ...(selectedDocument.title && {
          documentTitle: selectedDocument.title,
        }),
      }
    : {};

  return (
    <div className="flex w-full flex-col overflow-y-auto border-[#e1e5eb] border-r bg-white md:w-1/3 dark:border-[#2a3148] dark:bg-[#1a1f2e]">
      <EvidenceAnalysisHeader />
      <DocumentList
        documents={sortedDocuments}
        selectedDocId={selectedDocId}
        onDocumentClick={handleDocumentClick}
        onDocumentKeyUp={handleDocumentKeyUp}
      />
      <CaseModal
        isOpen={selectedCase !== null}
        onClose={handleCloseCase}
        {...caseModalProps}
      />
      <DocumentDetails
        selectedDocument={selectedDocument}
        onViewAnalysis={handleViewAnalysis}
      />
      <AnalysisReasoningModal
        isOpen={showReasoningModal}
        onCloseAction={handleCloseReasoningModal}
        {...reasoningModalProps}
      />
    </div>
  );
}
