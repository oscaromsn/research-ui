import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";

import { DocumentListItem } from "./document-list-item";

interface DocumentListProps {
  documents: ClientAnalyzedDoc[];
  selectedDocId: string | null;
  onDocumentClick: (doc: ClientAnalyzedDoc) => void;
  onDocumentKeyUp: (doc: ClientAnalyzedDoc, event: React.KeyboardEvent) => void;
}

export function DocumentList({
  documents,
  selectedDocId,
  onDocumentClick,
  onDocumentKeyUp,
}: DocumentListProps) {
  return (
    <div className="flex-grow overflow-auto">
      <div className="p-4">
        {documents.map((doc) => (
          <DocumentListItem
            key={doc.docId}
            doc={doc}
            isSelected={selectedDocId === doc.docId}
            onDocumentClick={onDocumentClick}
            onDocumentKeyUp={onDocumentKeyUp}
          />
        ))}
      </div>
    </div>
  );
}
