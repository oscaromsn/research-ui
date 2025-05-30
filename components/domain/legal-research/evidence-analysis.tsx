"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Brain, Gavel, Scroll } from "lucide-react";
import { useState } from "react";

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";
import {
  analyzedDocsSummaryAtom,
  researchSessionAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms";

import { AnalysisReasoningModal } from "./modals/analysis-reasoning-modal";
import { CaseModal } from "./modals/case-modal";

export function EvidenceAnalysis() {
  const [selectedCase, setSelectedCase] = useState<ClientAnalyzedDoc | null>(
    null
  );
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const analyzedDocs = useAtomValue(analyzedDocsSummaryAtom);
  const researchSession = useAtomValue(researchSessionAtom);
  const selectedDocId = useAtomValue(selectedAnalyzedDocIdAtom);
  const setSelectedDocId = useSetAtom(selectedAnalyzedDocIdAtom);

  // Use accumulated documents if available, otherwise fall back to current session
  const allDocuments =
    researchSession.accumulatedDocuments.length > 0
      ? researchSession.accumulatedDocuments
      : analyzedDocs;

  // Sort documents by timestamp (most recent first)
  const sortedDocuments = [...allDocuments].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });

  // Get the currently selected document from our atoms
  const selectedDocument = selectedDocId
    ? sortedDocuments.find((doc) => doc.docId === selectedDocId)
    : sortedDocuments[0];

  const handleDocumentClick = (doc: ClientAnalyzedDoc) => {
    setSelectedDocId(doc.docId);
    // Convert to format expected by CaseModal
    setSelectedCase(doc);
  };

  const handleDocumentKeyUp = (
    doc: ClientAnalyzedDoc,
    event: React.KeyboardEvent
  ) => {
    if (event.key === "Enter") {
      handleDocumentClick(doc);
    }
  };

  // Helper function for entity styling
  const getEntityStyle = (type: string) => {
    const styles = {
      Case: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Statute:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Regulation:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Person:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Organization:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      LegalConcept:
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      Jurisdiction:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return styles[type as keyof typeof styles] || styles.default;
  };

  return (
    <div className="flex flex-col bg-white dark:bg-[#1a1f2e] border-[#e1e5eb] dark:border-[#2a3148] border-r w-full md:w-1/3 overflow-y-auto">
      <div className="p-4 border-[#e1e5eb] dark:border-[#2a3148] border-b">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-[#1a1f2e] dark:text-white text-lg">
            Evidence & Analysis
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-1 rounded"
              aria-label="Menu options"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#64748b] dark:text-[#94a3b8]"
                role="img"
                aria-labelledby="menuIconTitle"
              >
                <title id="menuIconTitle">Menu</title>
                <line x1="4" y1="9" x2="20" y2="9" />
                <line x1="4" y1="15" x2="20" y2="15" />
                <line x1="10" y1="3" x2="8" y2="21" />
                <line x1="16" y1="3" x2="14" y2="21" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <div className="p-4">
          {sortedDocuments.map((doc) => {
            const isSelected = selectedDocId === doc.docId;
            const documentType = doc.title?.includes("§") ? "statute" : "case";

            return (
              <button
                key={doc.docId}
                type="button"
                className={`p-3 mb-2 rounded-lg cursor-pointer text-left w-full ${
                  isSelected
                    ? "bg-[#edf2f7] dark:bg-[#242a3d] border-l-4 border-[#3a7bb7]"
                    : "bg-white dark:bg-[#1e2436] hover:bg-[#f8fafc] dark:hover:bg-[#212941]"
                }`}
                onClick={() => handleDocumentClick(doc)}
                onKeyUp={(e) => handleDocumentKeyUp(doc, e)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="mb-1 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                      {doc.title || "Untitled Document"}
                    </h3>
                    <div className="flex items-center mb-1 text-[#64748b] dark:text-[#94a3b8] text-xs">
                      <span>
                        {doc.url ? new URL(doc.url).hostname : "Unknown Source"}
                      </span>
                      <span className="mx-1">•</span>
                      <span>Relevance: {doc.relevanceScore || 0}/10</span>
                      {doc.timestamp && (
                        <>
                          <span className="mx-1">•</span>
                          <span>
                            {new Date(doc.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                      {doc.summarySnippet || "No summary available."}
                    </p>
                  </div>
                  <div className="mt-1 ml-2">
                    {documentType === "case" ? (
                      <Gavel
                        size={14}
                        className="text-[#64748b] dark:text-[#94a3b8]"
                      />
                    ) : (
                      <Scroll
                        size={14}
                        className="text-[#64748b] dark:text-[#94a3b8]"
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <CaseModal
        isOpen={selectedCase !== null}
        onClose={() => setSelectedCase(null)}
        caseData={
          selectedCase
            ? {
                title: selectedCase.title || "",
                source: selectedCase.url
                  ? new URL(selectedCase.url).hostname
                  : "Unknown Source",
                court: selectedCase.title?.includes("(")
                  ? selectedCase.title.split("(")[1]?.replace(")", "") || ""
                  : "",
                date: `Relevance: ${selectedCase.relevanceScore || 0}/10`,
              }
            : {}
        }
      />
      <div className="border-[#e1e5eb] dark:border-[#2a3148] border-t">
        <div className="flex h-64">
          <div className="p-4 border-[#e1e5eb] dark:border-[#2a3148] border-r w-1/2 overflow-auto text-xs">
            {selectedDocument?.fullText ? (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-[#2d3748] dark:text-[#e2e8f0]">
                  Document Content
                </h3>
                <div className="text-xs text-[#4a5568] dark:text-[#a0aec0] leading-relaxed">
                  {selectedDocument.fullText
                    .split("\n")
                    .map((paragraph, idx) => (
                      <p
                        key={`paragraph-${selectedDocument.docId}-${idx}`}
                        className="mb-2"
                      >
                        {paragraph}
                      </p>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-[#64748b] dark:text-[#94a3b8] italic">
                No document content available.
              </div>
            )}
          </div>
          <div className="p-4 w-1/2 text-xs">
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                  Relevance
                </span>
                <span className="text-[#3a7bb7] text-xs">
                  {selectedDocument?.relevanceScore || 0}/10
                </span>
              </div>
              <div className="bg-[#e2e8f0] dark:bg-[#2a3148] rounded-full w-full h-1.5">
                <div
                  className="bg-[#3a7bb7] rounded-full h-full"
                  style={{
                    width: `${selectedDocument?.relevanceScore ? selectedDocument.relevanceScore * 10 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                Summary:
              </p>
              <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                {selectedDocument?.summarySnippet ||
                  "No analysis available for this document."}
                <span
                  className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink"
                  style={{ verticalAlign: "text-top" }}
                />
              </p>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                Key Arguments:
              </p>
              <ul className="pl-4 text-xs list-disc space-y-1">
                {selectedDocument?.keyArguments?.length ? (
                  selectedDocument.keyArguments.map((argument, idx) => (
                    <li
                      key={`argument-${selectedDocument.docId}-${idx}`}
                      className="text-[#4a5568] dark:text-[#a0aec0]"
                    >
                      {argument}
                    </li>
                  ))
                ) : (
                  <li className="text-[#64748b] dark:text-[#94a3b8] italic">
                    No key arguments identified.
                  </li>
                )}
              </ul>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                Extracted Entities:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedDocument?.extractedEntities?.length ? (
                  selectedDocument.extractedEntities.map((entity, idx) => (
                    <span
                      key={`entity-${selectedDocument.docId}-${entity.name}-${idx}`}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${getEntityStyle(entity.type)}`}
                      title={entity.details}
                    >
                      {entity.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[#64748b] dark:text-[#94a3b8] italic text-xs">
                    No entities extracted.
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
              onClick={() => setShowReasoningModal(true)}
            >
              <Brain size={12} className="mr-1" />
              View Analysis Reasoning
            </button>
          </div>
        </div>
      </div>
      <AnalysisReasoningModal
        isOpen={showReasoningModal}
        onCloseAction={() => setShowReasoningModal(false)}
        {...(selectedDocument?.analysisReasoning && {
          reasoning: selectedDocument.analysisReasoning,
        })}
        {...(selectedDocument?.title && {
          documentTitle: selectedDocument.title,
        })}
      />
    </div>
  );
}
