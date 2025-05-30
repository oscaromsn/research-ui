import { BookOpen, Brain, Link, Scale } from "lucide-react";

import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms";
import { Modal } from "@ui/modal";

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: ClientAnalyzedDoc;
  onViewAnalysis?: () => void;
}
export function CaseModal({
  isOpen,
  onClose,
  documentData,
  onViewAnalysis,
}: CaseModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date not available";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getDocumentType = (title?: string) => {
    if (!title) return "Document";
    const titleLower = title.toLowerCase();
    if (titleLower.includes("case") || titleLower.includes("v.")) return "Case";
    if (titleLower.includes("statute")) return "Statute";
    if (titleLower.includes("regulation")) return "Regulation";
    return "Document";
  };

  const getJurisdiction = () => {
    const jurisdictionEntity = documentData?.extractedEntities?.find(
      (entity) => entity.type === "Jurisdiction"
    );
    return jurisdictionEntity?.name || "Jurisdiction not specified";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentData?.title || "Document Details"}
      size="xl"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-4 text-[#64748b] dark:text-[#94a3b8] text-sm">
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
              <div className="bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
                <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                  Key Arguments & Reasoning
                </h4>
                <ul className="space-y-2 pl-4 text-[#4a5568] dark:text-[#a0aec0] text-sm list-disc">
                  {documentData.keyArguments.map((argument, index) => (
                    <li key={index}>{argument}</li>
                  ))}
                </ul>
              </div>
            )}

          {documentData?.extractedQuotes &&
            documentData.extractedQuotes.length > 0 && (
              <div className="bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
                <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                  Key Quotes
                </h4>
                <div className="space-y-2">
                  {documentData.extractedQuotes.map((quote, index) => (
                    <blockquote
                      key={index}
                      className="text-[#4a5568] dark:text-[#a0aec0] text-sm italic border-l-2 border-[#3a7bb7] pl-3"
                    >
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                  ))}
                </div>
              </div>
            )}
          {(documentData?.summarySnippet || documentData?.fullText) && (
            <div>
              <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                {documentData?.summarySnippet ? "Summary" : "Full Text"}
              </h4>
              <div className="space-y-4 text-[#4a5568] dark:text-[#a0aec0] text-sm max-h-96 overflow-y-auto">
                <p className="whitespace-pre-line">
                  {documentData?.summarySnippet || documentData?.fullText}
                </p>
              </div>
            </div>
          )}

          {documentData?.counterArguments &&
            documentData.counterArguments.length > 0 && (
              <div className="bg-[#fef2f2] dark:bg-[#2d1b1b] p-4 rounded-lg">
                <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                  Counter Arguments & Nuances
                </h4>
                <ul className="space-y-2 pl-4 text-[#4a5568] dark:text-[#a0aec0] text-sm list-disc">
                  {documentData.counterArguments.map((counterArg, index) => (
                    <li key={index}>{counterArg}</li>
                  ))}
                </ul>
              </div>
            )}
          <div className="flex justify-between items-center pt-4 border-[#e1e5eb] dark:border-[#2a3148] border-t">
            {documentData?.analysisReasoning && onViewAnalysis && (
              <button
                type="button"
                onClick={onViewAnalysis}
                className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs transition-colors"
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
                className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs transition-colors"
              >
                <Link size={12} className="mr-1" />
                View Original Source
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
