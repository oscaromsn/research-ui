import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";
import {
  orderedDocumentsAtom,
  selectedAnalyzedDocIdAtom,
} from "@/lib/state/researchAtoms";

export function useEvidenceAnalysis() {
  const [selectedCase, setSelectedCase] = useState<ClientAnalyzedDoc | null>(
    null
  );
  const [showReasoningModal, setShowReasoningModal] = useState(false);
  const sortedDocuments = useAtomValue(orderedDocumentsAtom);
  const selectedDocId = useAtomValue(selectedAnalyzedDocIdAtom);
  const setSelectedDocId = useSetAtom(selectedAnalyzedDocIdAtom);

  // Get the currently selected document from our atoms
  const selectedDocument = selectedDocId
    ? sortedDocuments.find((doc) => doc.docId === selectedDocId)
    : sortedDocuments[0];

  const handleDocumentClick = (doc: ClientAnalyzedDoc) => {
    setSelectedDocId(doc.docId);
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

  const handleViewAnalysis = () => {
    setShowReasoningModal(true);
  };

  const handleCloseCase = () => {
    setSelectedCase(null);
  };

  const handleCloseReasoningModal = () => {
    setShowReasoningModal(false);
  };

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
  };
}
