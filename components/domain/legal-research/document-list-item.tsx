import { Gavel, Scroll } from "lucide-react";

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";

import {
  DocumentStatusIndicator,
  getStatusIndicator,
} from "./document-status-indicator";

interface DocumentListItemProps {
  doc: ClientAnalyzedDoc;
  isSelected: boolean;
  onDocumentClick: (doc: ClientAnalyzedDoc) => void;
  onDocumentKeyUp: (doc: ClientAnalyzedDoc, event: React.KeyboardEvent) => void;
}

export function DocumentListItem({
  doc,
  isSelected,
  onDocumentClick,
  onDocumentKeyUp,
}: DocumentListItemProps) {
  const documentType = doc.title?.includes("§") ? "statute" : "case";
  const statusIndicator = getStatusIndicator(doc.status);

  return (
    // biome-ignore lint/a11y/useSemanticElements: DocumentStatusIndicator contains nested buttons preventing semantic button usage
    <div
      key={doc.docId}
      role="button"
      tabIndex={doc.status === "error" ? -1 : 0}
      className={`mb-2 w-full cursor-pointer rounded-lg border p-3 text-left transition-all ${
        isSelected
          ? "border-[#3a7bb7] border-l-4 bg-[#edf2f7] dark:bg-[#242a3d]"
          : `${statusIndicator.bgColor} ${statusIndicator.borderColor} hover:bg-[#f8fafc] dark:hover:bg-[#212941]`
      } ${doc.status === "error" ? "cursor-not-allowed opacity-50" : ""}`}
      onClick={() => doc.status !== "error" && onDocumentClick(doc)}
      onKeyUp={(e) => doc.status !== "error" && onDocumentKeyUp(doc, e)}
      aria-label={`Selecionar documento: ${doc.title || "Documento sem Título"}`}
      aria-disabled={doc.status === "error"}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="flex-1 pr-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
              {doc.title || "Documento sem Título"}
            </h3>
            <div className="flex-shrink-0">
              <DocumentStatusIndicator status={doc.status} />
            </div>
          </div>
          <div className="mb-1 flex items-center text-[#64748b] text-xs dark:text-[#94a3b8]">
            <span>
              {doc.source ||
                (doc.url ? new URL(doc.url).hostname : "Fonte Desconhecida")}
            </span>
            {doc.status === "analyzed" && doc.relevanceScore && (
              <>
                <span className="mx-1">•</span>
                <span>Relevância: {doc.relevanceScore}/10</span>
              </>
            )}
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
            {doc.status === "error"
              ? doc.errorMessage || "Falha ao processar o documento"
              : doc.status === "fetched"
                ? "Documento recuperado, análise pendente..."
                : doc.status === "analyzing"
                  ? doc.summarySnippet || "Análise em andamento..."
                  : doc.summarySnippet || "Nenhum resumo disponível."}
          </p>
        </div>
        <div className="mt-1 ml-2 flex flex-col items-center gap-1">
          {documentType === "case" ? (
            <Gavel size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
          ) : (
            <Scroll size={14} className="text-[#64748b] dark:text-[#94a3b8]" />
          )}
        </div>
      </div>
    </div>
  );
}
