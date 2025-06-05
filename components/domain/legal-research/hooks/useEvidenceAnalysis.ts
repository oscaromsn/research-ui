import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"
import {
  analyzedDocsSummaryAtom,
  researchSessionAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms"

export function useEvidenceAnalysis() {
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

  const handleViewAnalysis = () => {
    setShowReasoningModal(true)
  }

  const handleCloseCase = () => {
    setSelectedCase(null)
  }

  const handleCloseReasoningModal = () => {
    setShowReasoningModal(false)
  }

  return {
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
  }
}
