import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

import type { DetailedReasoning } from "@/baml_client/types";
import type { ClientSynthesis } from "@/lib/state/researchAtoms";
import { Modal } from "@ui/modal";

interface SynthesisReasoningModalProps {
  isOpen: boolean;
  onClose: () => void;
  synthesisData?: ClientSynthesis;
  reasoning?: DetailedReasoning;
  sourcesUsed?: Array<{
    docId: string;
    title?: string;
    confidence: number;
  }>;
}

export function SynthesisReasoningModal({
  isOpen,
  onClose,
  synthesisData,
  reasoning,
  sourcesUsed = [],
}: SynthesisReasoningModalProps) {
  const getReasoningSteps = () => {
    if (!reasoning) return [];

    const steps = [
      {
        status: "complete" as const,
        text:
          reasoning.analyze_legal_question?.summary ||
          "Analyzed legal question",
        details: reasoning.analyze_legal_question?.items_considered,
      },
      {
        status: "complete" as const,
        text:
          reasoning.consider_relevant_legal_principles?.summary ||
          "Considered relevant legal principles",
        details: reasoning.consider_relevant_legal_principles?.items_considered,
      },
    ];

    if (reasoning.formulate_search_queries_strategy?.summary) {
      steps.push({
        status: "complete" as const,
        text: reasoning.formulate_search_queries_strategy.summary,
        details: reasoning.formulate_search_queries_strategy.items_considered,
      });
    }

    if (reasoning.specify_expected_information_strategy?.summary) {
      steps.push({
        status: "complete" as const,
        text: reasoning.specify_expected_information_strategy.summary,
        details:
          reasoning.specify_expected_information_strategy.items_considered,
      });
    }

    if (reasoning.ensure_comprehensive_coverage_strategy?.summary) {
      steps.push({
        status: "complete" as const,
        text: reasoning.ensure_comprehensive_coverage_strategy.summary,
        details:
          reasoning.ensure_comprehensive_coverage_strategy.items_considered,
      });
    }

    return steps;
  };

  const reasoningSteps = getReasoningSteps();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Synthesis Reasoning"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-2 bg-[#fff7ed] dark:bg-[#2e1907] p-3 rounded-lg text-[#9a3412] dark:text-[#fdba74] text-sm">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <p>
            {synthesisData?.reasoningSummary ||
              "This synthesis is based on the analyzed documents and AI reasoning. Please review for accuracy."}
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
            <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
              Reasoning Chain
            </h4>
            <div className="space-y-3">
              {reasoningSteps.length > 0 ? (
                reasoningSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mt-1 mr-2">
                      {step.status === "complete" ? (
                        <CheckCircle
                          size={14}
                          className="text-[#16a34a] dark:text-[#86efac]"
                        />
                      ) : step.status === "warning" ? (
                        <AlertTriangle size={14} className="text-[#eab308]" />
                      ) : (
                        <Clock
                          size={14}
                          className="text-[#64748b] dark:text-[#94a3b8]"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#4a5568] dark:text-[#a0aec0] text-sm">
                        {step.text}
                      </p>
                      {step.details && step.details.length > 0 && (
                        <ul className="mt-1 ml-4 text-xs text-[#64748b] dark:text-[#94a3b8] list-disc">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#64748b] dark:text-[#94a3b8] text-sm text-center py-4">
                  No detailed reasoning steps available.
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
              Sources Used
            </h4>
            <div className="space-y-2">
              {sourcesUsed.length > 0 ? (
                sourcesUsed.map((source, index) => (
                  <div
                    key={`${source.docId}-${index}`}
                    className="flex justify-between items-center text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <span className="text-[#4a5568] dark:text-[#a0aec0] font-medium">
                        {source.docId}
                      </span>
                      {source.title && (
                        <div className="text-[#64748b] dark:text-[#94a3b8] text-xs truncate mt-0.5">
                          {source.title}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <div className="bg-[#e2e8f0] dark:bg-[#2a3148] mr-2 rounded-full w-24 h-1.5">
                        <div
                          className="bg-[#3a7bb7] rounded-full h-full"
                          style={{
                            width: `${source.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[#3a7bb7] min-w-[2.5rem]">
                        {(source.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#64748b] dark:text-[#94a3b8] text-sm text-center py-4">
                  No source information available.
                </p>
              )}
            </div>

            {synthesisData?.unansweredAspects &&
              synthesisData.unansweredAspects.length > 0 && (
                <div className="mt-4 p-3 bg-[#fef2f2] dark:bg-[#2d1b1b] rounded-lg">
                  <h5 className="text-sm font-medium text-[#991b1b] dark:text-[#fca5a5] mb-2">
                    Unanswered Aspects
                  </h5>
                  <ul className="space-y-1 text-xs text-[#7f1d1d] dark:text-[#fecaca] list-disc ml-4">
                    {synthesisData.unansweredAspects.map(
                      (aspect: string, index: number) => (
                        <li key={index}>{aspect}</li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {synthesisData?.emergingQuestions &&
              synthesisData.emergingQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-[#eff6ff] dark:bg-[#1e2946] rounded-lg">
                  <h5 className="text-sm font-medium text-[#1e40af] dark:text-[#93c5fd] mb-2">
                    Emerging Questions
                  </h5>
                  <ul className="space-y-1 text-xs text-[#1e3a8a] dark:text-[#bfdbfe] list-disc ml-4">
                    {synthesisData.emergingQuestions.map(
                      (question: string, index: number) => (
                        <li key={index}>{question}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
