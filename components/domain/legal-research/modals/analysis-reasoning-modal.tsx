"use client";

import { Modal } from "@/components/ui/Modal";
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
      title={`Raciocínio da Análise: ${documentTitle || "Documento"}`}
      size="xl"
    >
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0]">
              Análise da Questão Jurídica
            </h3>
            <p
              data-testid="legal-question-summary"
              className="rounded bg-[#f8fafc] p-3 text-[#4a5568] text-sm leading-relaxed dark:bg-[#1e2436] dark:text-[#a0aec0]"
            >
              {reasoning?.analyzeLegalQuestionSummary ||
                "Nenhum raciocínio disponível para a análise da questão jurídica."}
            </p>
          </div>

          <div>
            <h3 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0]">
              Princípios Jurídicos Relevantes
            </h3>
            <p
              data-testid="relevant-principles-summary"
              className="rounded bg-[#f8fafc] p-3 text-[#4a5568] text-sm leading-relaxed dark:bg-[#1e2436] dark:text-[#a0aec0]"
            >
              {reasoning?.considerRelevantPrinciplesSummary ||
                "Nenhum raciocínio disponível para a consideração dos princípios jurídicos."}
            </p>
          </div>

          {reasoning?.formulateSearchQueriesSummary && (
            <div>
              <h3 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0]">
                Estratégia de Consulta de Busca
              </h3>
              <p className="rounded bg-[#f8fafc] p-3 text-[#4a5568] text-sm leading-relaxed dark:bg-[#1e2436] dark:text-[#a0aec0]">
                {reasoning.formulateSearchQueriesSummary}
              </p>
            </div>
          )}

          {reasoning?.specifyExpectedInfoSummary && (
            <div>
              <h3 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0]">
                Estratégia de Informação Esperada
              </h3>
              <p className="rounded bg-[#f8fafc] p-3 text-[#4a5568] text-sm leading-relaxed dark:bg-[#1e2436] dark:text-[#a0aec0]">
                {reasoning.specifyExpectedInfoSummary}
              </p>
            </div>
          )}

          {reasoning?.ensureComprehensiveCoverageSummary && (
            <div>
              <h3 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0]">
                Estratégia de Cobertura Abrangente
              </h3>
              <p className="rounded bg-[#f8fafc] p-3 text-[#4a5568] text-sm leading-relaxed dark:bg-[#1e2436] dark:text-[#a0aec0]">
                {reasoning.ensureComprehensiveCoverageSummary}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 border-[#e1e5eb] border-t pt-4 dark:border-[#2a3148]">
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded bg-[#3a7bb7] px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-[#2c5d8a]"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
}
