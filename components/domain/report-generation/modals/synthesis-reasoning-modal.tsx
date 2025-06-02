import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

import type { DetailedReasoning } from '@/baml_client/types'
import { Modal } from '@/components/ui/modal'
import type { ClientSynthesis } from '@/lib/state/researchAtoms'

interface SynthesisReasoningModalProps {
  isOpen: boolean
  onClose: () => void
  synthesisData?: ClientSynthesis
  reasoning?: DetailedReasoning
  sourcesUsed?: Array<{
    docId: string
    title?: string
    confidence: number
  }>
}

export function SynthesisReasoningModal({
  isOpen,
  onClose,
  synthesisData,
  reasoning,
  sourcesUsed = [],
}: SynthesisReasoningModalProps) {
  const getReasoningSteps = () => {
    if (!reasoning) {
      return []
    }

    const steps = [
      {
        status: 'complete' as const,
        text:
          reasoning.analyze_legal_question?.summary ||
          'Analyzed legal question',
        details: reasoning.analyze_legal_question?.items_considered,
      },
      {
        status: 'complete' as const,
        text:
          reasoning.consider_relevant_legal_principles?.summary ||
          'Considered relevant legal principles',
        details: reasoning.consider_relevant_legal_principles?.items_considered,
      },
    ]

    if (reasoning.formulate_search_queries_strategy?.summary) {
      steps.push({
        status: 'complete' as const,
        text: reasoning.formulate_search_queries_strategy.summary,
        details: reasoning.formulate_search_queries_strategy.items_considered,
      })
    }

    if (reasoning.specify_expected_information_strategy?.summary) {
      steps.push({
        status: 'complete' as const,
        text: reasoning.specify_expected_information_strategy.summary,
        details:
          reasoning.specify_expected_information_strategy.items_considered,
      })
    }

    if (reasoning.ensure_comprehensive_coverage_strategy?.summary) {
      steps.push({
        status: 'complete' as const,
        text: reasoning.ensure_comprehensive_coverage_strategy.summary,
        details:
          reasoning.ensure_comprehensive_coverage_strategy.items_considered,
      })
    }

    return steps
  }

  const reasoningSteps = getReasoningSteps()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Synthesis Reasoning"
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex items-start space-x-2 rounded-lg bg-[#fff7ed] p-3 text-[#9a3412] text-sm dark:bg-[#2e1907] dark:text-[#fdba74]">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            {synthesisData?.reasoningSummary ||
              'This synthesis is based on the analyzed documents and AI reasoning. Please review for accuracy.'}
          </p>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg bg-[#f8fafc] p-4 dark:bg-[#1e2436]">
            <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
              Reasoning Chain
            </h4>
            <div className="space-y-3">
              {reasoningSteps.length > 0 ? (
                reasoningSteps.map((step, index) => (
                  <div
                    key={`step-${step.text}-${index}`}
                    className="flex items-start"
                  >
                    <div className="mt-1 mr-2">
                      {step.status === 'complete' ? (
                        <CheckCircle
                          size={14}
                          className="text-[#16a34a] dark:text-[#86efac]"
                        />
                      ) : step.status === 'warning' ? (
                        <AlertTriangle size={14} className="text-[#eab308]" />
                      ) : (
                        <Clock
                          size={14}
                          className="text-[#64748b] dark:text-[#94a3b8]"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#4a5568] text-sm dark:text-[#a0aec0]">
                        {step.text}
                      </p>
                      {step.details && step.details.length > 0 && (
                        <ul className="mt-1 ml-4 list-disc text-[#64748b] text-xs dark:text-[#94a3b8]">
                          {step.details.map((detail, detailIndex) => (
                            <li
                              key={`detail-${detailIndex}-${detail.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`}
                            >
                              {detail}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-[#64748b] text-sm dark:text-[#94a3b8]">
                  No detailed reasoning steps available.
                </p>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
              Sources Used
            </h4>
            <div className="space-y-2">
              {sourcesUsed.length > 0 ? (
                sourcesUsed.map((source, index) => (
                  <div
                    key={`${source.docId}-${index}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="mr-2 flex-1">
                      <span className="font-medium text-[#4a5568] dark:text-[#a0aec0]">
                        {source.docId}
                      </span>
                      {source.title && (
                        <div className="mt-0.5 truncate text-[#64748b] text-xs dark:text-[#94a3b8]">
                          {source.title}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center">
                      <div className="mr-2 h-1.5 w-24 rounded-full bg-[#e2e8f0] dark:bg-[#2a3148]">
                        <div
                          className="h-full rounded-full bg-[#3a7bb7]"
                          style={{
                            width: `${source.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <span className="min-w-[2.5rem] text-[#3a7bb7]">
                        {(source.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-[#64748b] text-sm dark:text-[#94a3b8]">
                  No source information available.
                </p>
              )}
            </div>

            {synthesisData?.unansweredAspects &&
              synthesisData.unansweredAspects.length > 0 && (
                <div className="mt-4 rounded-lg bg-[#fef2f2] p-3 dark:bg-[#2d1b1b]">
                  <h5 className="mb-2 font-medium text-[#991b1b] text-sm dark:text-[#fca5a5]">
                    Unanswered Aspects
                  </h5>
                  <ul className="ml-4 list-disc space-y-1 text-[#7f1d1d] text-xs dark:text-[#fecaca]">
                    {synthesisData.unansweredAspects.map(
                      (aspect: string, index: number) => (
                        <li
                          key={`unanswered-${index}-${aspect.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`}
                        >
                          {aspect}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {synthesisData?.emergingQuestions &&
              synthesisData.emergingQuestions.length > 0 && (
                <div className="mt-4 rounded-lg bg-[#eff6ff] p-3 dark:bg-[#1e2946]">
                  <h5 className="mb-2 font-medium text-[#1e40af] text-sm dark:text-[#93c5fd]">
                    Emerging Questions
                  </h5>
                  <ul className="ml-4 list-disc space-y-1 text-[#1e3a8a] text-xs dark:text-[#bfdbfe]">
                    {synthesisData.emergingQuestions.map(
                      (question: string, index: number) => (
                        <li
                          key={`question-${index}-${question.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`}
                        >
                          {question}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
