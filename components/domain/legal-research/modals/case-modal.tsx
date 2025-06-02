import { BookOpen, Brain, Link, Scale } from 'lucide-react'

import { Modal } from '@/components/ui/modal'
import type { ClientAnalyzedDoc } from '@/lib/state/researchAtoms'

interface CaseModalProps {
  isOpen: boolean
  onClose: () => void
  documentData?: ClientAnalyzedDoc
  onViewAnalysis?: () => void
}
export function CaseModal({
  isOpen,
  onClose,
  documentData,
  onViewAnalysis,
}: CaseModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'Date not available'
    }
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const getDocumentType = (title?: string) => {
    if (!title) {
      return 'Document'
    }
    const titleLower = title.toLowerCase()
    if (titleLower.includes('case') || titleLower.includes('v.')) {
      return 'Case'
    }
    if (titleLower.includes('statute')) {
      return 'Statute'
    }
    if (titleLower.includes('regulation')) {
      return 'Regulation'
    }
    return 'Document'
  }

  const getJurisdiction = () => {
    const jurisdictionEntity = documentData?.extractedEntities?.find(
      entity => entity.type === 'Jurisdiction'
    )
    return jurisdictionEntity?.name || 'Jurisdiction not specified'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentData?.title || 'Document Details'}
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-4 text-[#64748b] text-sm dark:text-[#94a3b8]">
          <span className="flex items-center">
            <BookOpen size={14} className="mr-1" />
            {getDocumentType(documentData?.title)}
          </span>
          <span className="flex items-center">
            <Scale size={14} className="mr-1" />
            {getJurisdiction()}
          </span>
          <span>{formatDate(documentData?.timestamp)}</span>
          {documentData?.relevanceScore && (
            <span className="text-[#3a7bb7]">
              Relevance: {Math.round(documentData.relevanceScore * 10)}%
            </span>
          )}
        </div>
        <div className="space-y-4">
          {documentData?.keyArguments &&
            documentData.keyArguments.length > 0 && (
              <div className="rounded-lg bg-[#f8fafc] p-4 dark:bg-[#1e2436]">
                <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                  Key Arguments & Reasoning
                </h4>
                <ul className="list-disc space-y-2 pl-4 text-[#4a5568] text-sm dark:text-[#a0aec0]">
                  {documentData.keyArguments.map(argument => (
                    <li key={argument}>{argument}</li>
                  ))}
                </ul>
              </div>
            )}

          {documentData?.extractedQuotes &&
            documentData.extractedQuotes.length > 0 && (
              <div className="rounded-lg bg-[#f8fafc] p-4 dark:bg-[#1e2436]">
                <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                  Key Quotes
                </h4>
                <div className="space-y-2">
                  {documentData.extractedQuotes.map(quote => (
                    <blockquote
                      key={quote}
                      className="border-[#3a7bb7] border-l-2 pl-3 text-[#4a5568] text-sm italic dark:text-[#a0aec0]"
                    >
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          {(documentData?.summarySnippet || documentData?.fullText) && (
            <div>
              <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                {documentData?.summarySnippet ? 'Summary' : 'Full Text'}
              </h4>
              <div className="max-h-96 space-y-4 overflow-y-auto text-[#4a5568] text-sm dark:text-[#a0aec0]">
                <p className="whitespace-pre-line">
                  {documentData?.summarySnippet || documentData?.fullText}
                </p>
              </div>
            </div>
          )}

          {documentData?.counterArguments &&
            documentData.counterArguments.length > 0 && (
              <div className="rounded-lg bg-[#fef2f2] p-4 dark:bg-[#2d1b1b]">
                <h4 className="mb-2 font-medium text-[#2d3748] text-sm dark:text-[#e2e8f0]">
                  Counter Arguments & Nuances
                </h4>
                <ul className="list-disc space-y-2 pl-4 text-[#4a5568] text-sm dark:text-[#a0aec0]">
                  {documentData.counterArguments.map(counterArg => (
                    <li key={counterArg}>{counterArg}</li>
                  ))}
                </ul>
              </div>
            )}
          <div className="flex items-center justify-between border-[#e1e5eb] border-t pt-4 dark:border-[#2a3148]">
            {documentData?.analysisReasoning && onViewAnalysis && (
              <button
                type="button"
                onClick={onViewAnalysis}
                className="flex items-center text-[#3a7bb7] text-xs transition-colors hover:text-[#2c5d8a]"
              >
                <Brain size={12} className="mr-1" />
                View AI Analysis
              </button>
            )}
            {documentData?.url && (
              <a
                href={documentData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-[#3a7bb7] text-xs transition-colors hover:text-[#2c5d8a]"
              >
                <Link size={12} className="mr-1" />
                View Original Source
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
