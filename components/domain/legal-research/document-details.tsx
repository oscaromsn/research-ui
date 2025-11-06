import { AlertCircle, Brain, Loader2 } from "lucide-react";

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";

import { EntityBadge } from "./entity-badge";

interface DocumentDetailsProps {
  selectedDocument: ClientAnalyzedDoc | undefined;
  onViewAnalysis: () => void;
}

export function DocumentDetails({
  selectedDocument,
  onViewAnalysis,
}: DocumentDetailsProps) {
  return (
    <div className="border-[#e1e5eb] border-t dark:border-[#2a3148]">
      <div className="flex h-64">
        <div className="w-1/2 overflow-auto border-[#e1e5eb] border-r p-4 text-xs dark:border-[#2a3148]">
          {selectedDocument?.fullText ? (
            <div className="space-y-3">
              <h3 className="font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                Conteúdo do Documento
              </h3>
              <div className="text-[#4a5568] text-xs leading-relaxed dark:text-[#a0aec0]">
                {selectedDocument.fullText.split("\n").map((paragraph, idx) => (
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
              Nenhum conteúdo de documento disponível.
            </div>
          )}
        </div>
        <div className="w-1/2 p-4 text-xs">
          {selectedDocument?.status === "analyzed" &&
            selectedDocument?.relevanceScore && (
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                    Relevância
                  </span>
                  <span className="text-[#3a7bb7] text-xs">
                    {selectedDocument.relevanceScore}/10
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#e2e8f0] dark:bg-[#2a3148]">
                  <div
                    className="h-full rounded-full bg-[#3a7bb7]"
                    style={{
                      width: `${selectedDocument.relevanceScore * 10}%`,
                    }}
                  />
                </div>
              </div>
            )}
          <div className="mb-3">
            <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
              Resumo:
            </p>
            <p className="text-[#4a5568] text-xs dark:text-[#a0aec0]">
              {selectedDocument?.status === "fetched"
                ? "Documento recuperado, análise pendente..."
                : selectedDocument?.status === "analyzing"
                  ? selectedDocument?.summarySnippet ||
                    "Análise em andamento..."
                  : selectedDocument?.status === "error"
                    ? selectedDocument?.errorMessage ||
                      "Falha ao analisar o documento"
                    : selectedDocument?.summarySnippet ||
                      "Nenhuma análise disponível para este documento."}
              {selectedDocument?.status === "analyzing" && (
                <span
                  className="ml-0.5 inline-block h-3 w-0.5 animate-caret-blink bg-[#4a5568] dark:bg-[#a0aec0]"
                  style={{ verticalAlign: "text-top" }}
                />
              )}
            </p>
          </div>
          {selectedDocument?.status === "analyzed" && (
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Argumentos Principais:
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
                    Nenhum argumento principal identificado.
                  </li>
                )}
              </ul>
            </div>
          )}
          {selectedDocument?.status === "analyzed" && (
            <div className="mb-3">
              <p className="mb-1 font-medium text-[#4a5568] text-xs dark:text-[#a0aec0]">
                Entidades Extraídas:
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedDocument?.extractedEntities?.length ? (
                  selectedDocument.extractedEntities.map((entity, idx) => (
                    <EntityBadge
                      key={`entity-${selectedDocument.docId}-${entity.name}-${idx}`}
                      entity={entity}
                    />
                  ))
                ) : (
                  <span className="text-[#64748b] text-xs italic dark:text-[#94a3b8]">
                    Nenhuma entidade extraída.
                  </span>
                )}
              </div>
            </div>
          )}
          {selectedDocument?.status === "analyzed" &&
            selectedDocument?.analysisReasoning && (
              <button
                type="button"
                className="flex items-center text-[#3a7bb7] text-xs hover:text-[#2c5d8a]"
                onClick={onViewAnalysis}
              >
                <Brain size={12} className="mr-1" />
                Ver Raciocínio da Análise
              </button>
            )}
          {selectedDocument?.status === "fetched" && (
            <div className="flex items-center text-[#64748b] text-xs">
              <Loader2 size={12} className="mr-1" />
              Aguardando análise...
            </div>
          )}
          {selectedDocument?.status === "analyzing" && (
            <div className="flex items-center text-[#f59e0b] text-xs">
              <Loader2 size={12} className="mr-1 animate-spin" />
              Análise em andamento...
            </div>
          )}
          {selectedDocument?.status === "error" && (
            <div className="flex items-center text-[#dc2626] text-xs">
              <AlertCircle size={12} className="mr-1" />
              Análise falhou
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
