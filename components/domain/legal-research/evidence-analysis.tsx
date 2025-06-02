"use client"

import { useAtomValue, useSetAtom } from "jotai"
import { Brain, Gavel, Scroll } from "lucide-react"
import { useState } from "react"

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"
import {
  analyzedDocsSummaryAtom,
  researchSessionAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms"

import { AnalysisReasoningModal } from "./modals/analysis-reasoning-modal"
import { CaseModal } from "./modals/case-modal"

export function EvidenceAnalysis() {
  const [selectedCase, setSelectedCase] = useState<ClientAnalyzedDoc | null>(
    null
  )
  const [showReasoningModal, setShowReasoningModal] = useState(false)
  const analyzedDocs = useAtomValue(analyzedDocsSummaryAtom)
  const researchSession = useAtomValue(researchSessionAtom)
  const selectedDocId = useAtomValue(selectedAnalyzedDocIdAtom)
  const setSelectedDocId = useSetAtom(selectedAnalyzedDocIdAtom)

  // Use accumulated documents if available, otherwise fall back to current session
  const allDocuments =
    researchSession.accumulatedDocuments.length > 0
      ? researchSession.accumulatedDocuments
      : analyzedDocs

  // Sort documents by timestamp (most recent first)
  const sortedDocuments = [...allDocuments].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return bTime - aTime
  })

  // Get the currently selected document from our atoms
  const selectedDocument = selectedDocId
    ? sortedDocuments.find(doc => doc.docId === selectedDocId)
    : sortedDocuments[0]

  const handleDocumentClick = (doc: ClientAnalyzedDoc) => {
    setSelectedDocId(doc.docId)
    // Convert to format expected by CaseModal
    setSelectedCase(doc)
  }

  const handleDocumentKeyUp = (
    doc: ClientAnalyzedDoc,
    event: React.KeyboardEvent
  ) => {
    if (event.key === "Enter") {
      handleDocumentClick(doc)
    }
  }

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
    }
    return styles[type as keyof typeof styles] || styles.default
  }

  return (
    <div className="flex w-full flex-col overflow-y-auto border-[#e1e5eb] border-r bg-white md:w-1/3 dark:border-[#2a3148] dark:bg-[#1a1f2e]">
      <div className="border-[#e1e5eb] border-b p-4 dark:border-[#2a3148]">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-[#1a1f2e] text-lg dark:text-white">
            Evidence & Analysis
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              className="rounded p-1 hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d]"
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
          {sortedDocuments.map(doc => {
            const isSelected = selectedDocId === doc.docId
            const documentType = doc.title?.includes("§") ? "statute" : "case"

            return (
              <button
                key={doc.docId}
                type="button"
                className={`mb-2 w-full cursor-pointer rounded-lg p-3 text-left ${
                  isSelected
                    ? "border-[#3a7bb7] border-l-4 bg-[#edf2f7] dark:bg-[#242a3d]"
                    : "bg-white hover:bg-[#f8fafc] dark:bg-[#1e2436] dark:hover:bg-[#212941]"
                }`}
                onClick={() => handleDocumentClick(doc)}
                onKeyUp={e => handleDocumentKeyUp(doc, e)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="mb-1 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                      {doc.title || "Untitled Document"}
                    </h3>
                    <div className="mb-1 flex items-center text-[#64748b] text-xs dark:text-[#94a3b8]">
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
                    <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
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
            )
          })}
        </div>
      </div>
      <CaseModal
        isOpen={selectedCase !== null}
        onClose={() => setSelectedCase(null)}
        {...(selectedCase && { documentData: selectedCase })}
        {...(selectedCase?.analysisReasoning && {
          onViewAnalysis: () => setShowReasoningModal(true),
        })}
      />
      <div className="border-[#e1e5eb] border-t dark:border-[#2a3148]">
        <div className="flex h-64">
          <div className="w-1/2 overflow-auto border-[#e1e5eb] border-r p-4 text-xs dark:border-[#2a3148]">
            {selectedDocument?.fullText ? (
              <div className="space-y-3">
                <h3 className="font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                  Document Content
                </h3>
                <div className="text-[#4a5568] text-xs leading-relaxed dark:text-[#a0aec0]">
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
              <div className="text-[#64748b] italic dark:text-[#94a3b8]">
                No document content available.
              </div>
            )}
          </div>
          <div className="w-1/2 p-4 text-xs">
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                  Relevance
                </span>
                <span className="text-[#3a7bb7] text-xs">
                  {selectedDocument?.relevanceScore || 0}/10
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#e2e8f0] dark:bg-[#2a3148]">
                <div
                  className="h-full rounded-full bg-[#3a7bb7]"
                  style={{
                    width: `${selectedDocument?.relevanceScore ? selectedDocument.relevanceScore * 10 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Summary:
              </p>
              <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
                {selectedDocument?.summarySnippet ||
                  "No analysis available for this document."}
                <span
                  className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
                  style={{ verticalAlign: "text-top" }}
                />
              </p>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Key Arguments:
              </p>
              <ul className="list-disc space-y-1 pl-4 text-xs">
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
                  <li className="text-[#64748b] italic dark:text-[#94a3b8]">
                    No key arguments identified.
                  </li>
                )}
              </ul>
            </div>
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Extracted Entities:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedDocument?.extractedEntities?.length ? (
                  selectedDocument.extractedEntities.map((entity, idx) => (
                    <span
                      key={`entity-${selectedDocument.docId}-${entity.name}-${idx}`}
                      className={`rounded px-1.5 py-0.5 text-[10px] ${getEntityStyle(entity.type)}`}
                      title={entity.details}
                    >
                      {entity.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[#64748b] text-xs italic dark:text-[#94a3b8]">
                    No entities extracted.
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="flex items-center text-[#3a7bb7] text-xs hover:text-[#2c5d8a]"
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
  )
}
