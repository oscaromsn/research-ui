"use client";

import { Brain, Gavel, Scroll } from "lucide-react";
import { useState } from "react";
import { useAtomValue, useSetAtom } from 'jotai';
import { analyzedDocsSummaryAtom, selectedAnalyzedDocIdAtom } from '@/lib/state/researchAtoms';
import type { ClientAnalyzedDoc } from '@/lib/state/researchAtoms';
import { CaseModal } from "./modals/case-modal";


export function EvidenceAnalysis() {
    const [selectedCase, setSelectedCase] = useState<ClientAnalyzedDoc | null>(null);
    const analyzedDocs = useAtomValue(analyzedDocsSummaryAtom);
    const selectedDocId = useAtomValue(selectedAnalyzedDocIdAtom);
    const setSelectedDocId = useSetAtom(selectedAnalyzedDocIdAtom);

    // Get the currently selected document from our atoms
    const selectedDocument = selectedDocId ? analyzedDocs.find(doc => doc.docId === selectedDocId) : analyzedDocs[0];
    
    const handleDocumentClick = (doc: ClientAnalyzedDoc) => {
        setSelectedDocId(doc.docId);
        // Convert to format expected by CaseModal
        setSelectedCase(doc);
    };

    const handleDocumentKeyUp = (doc: ClientAnalyzedDoc, event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            handleDocumentClick(doc);
        }
    };

    return (
        <div className="flex flex-col bg-white dark:bg-[#1a1f2e] border-[#e1e5eb] dark:border-[#2a3148] border-r w-full md:w-1/3 overflow-y-auto">
            <div className="p-4 border-[#e1e5eb] dark:border-[#2a3148] border-b">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold text-[#1a1f2e] dark:text-white text-lg">
                        Evidence & Analysis
                    </h2>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            className="hover:bg-[#f1f5f9] dark:hover:bg-[#242a3d] p-1 rounded"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-[#64748b] dark:text-[#94a3b8]"
                                role="img"
                                aria-labelledby="menuIconTitle"
                            >
                                <title id="menuIconTitle">Menu</title>
                                <line x1="4" y1="9" x2="20" y2="9" />
                                <line x1="4" y1="15" x2="20" y2="15" />
                                <line x1="10" y1="3" x2="8" y2="21" />
                                <line x1="16" y1="3" x2="14" y2="21" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-grow overflow-auto">
                <div className="p-4">
                    {analyzedDocs.map((doc) => {
                        const isSelected = selectedDocId === doc.docId;
                        const documentType = doc.title?.includes('§') ? 'statute' : 'case';
                        
                        return (
                            <div
                                key={doc.docId}
                                className={`p-3 mb-2 rounded-lg cursor-pointer ${
                                    isSelected 
                                        ? "bg-[#edf2f7] dark:bg-[#242a3d] border-l-4 border-[#3a7bb7]" 
                                        : "bg-white dark:bg-[#1e2436] hover:bg-[#f8fafc] dark:hover:bg-[#212941]"
                                }`}
                                onClick={() => handleDocumentClick(doc)}
                                onKeyUp={(e) => handleDocumentKeyUp(doc, e)}
                                tabIndex={0}
                                role="button"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="mb-1 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                                            {doc.title || 'Untitled Document'}
                                        </h3>
                                        <div className="flex items-center mb-1 text-[#64748b] dark:text-[#94a3b8] text-xs">
                                            <span>Source</span>
                                            <span className="mx-1">•</span>
                                            <span>Date</span>
                                        </div>
                                        <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                            {doc.summarySnippet || 'No summary available.'}
                                        </p>
                                    </div>
                                    <div className="mt-1 ml-2">
                                        {documentType === "case" ? (
                                            <Gavel
                                                size={14}
                                                className="text-[#64748b] dark:text-[#94a3b8]"
                                            />
                                        ) : (
                                            <Scroll
                                                size={14}
                                                className="text-[#64748b] dark:text-[#94a3b8]"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <CaseModal
                isOpen={selectedCase !== null}
                onClose={() => setSelectedCase(null)}
                caseData={
                    selectedCase
                        ? {
                              title: selectedCase.title || '',
                              source: 'Source',
                              court: selectedCase.title?.includes('(') 
                                  ? selectedCase.title.split('(')[1]?.replace(')', '') || ''
                                  : '',
                              date: 'Date',
                          }
                        : {}
                }
            />
            <div className="border-[#e1e5eb] dark:border-[#2a3148] border-t">
                <div className="flex h-64">
                    <div className="p-4 border-[#e1e5eb] dark:border-[#2a3148] border-r w-1/2 overflow-auto text-[#4a5568] dark:text-[#a0aec0] text-xs">
                        <p className="mb-2">Section 1. Legal Framework</p>
                        <p className="mb-2">
                            Under the doctrine of force majeure, a party may be
                            excused from performance of contractual obligations
                            when circumstances beyond their control render
                            performance impossible or impracticable.
                        </p>
                        <p className="mb-2">
                            The court in{" "}
                            <span className="bg-[#edf7ed] dark:bg-[#1e3a2d] px-1 text-[#2d3748] dark:text-[#e2e8f0]">
                                Smith v. Jones
                            </span>{" "}
                            established that government-mandated closures during
                            the COVID-19 pandemic could constitute a force
                            majeure event when...
                        </p>
                    </div>
                    <div className="p-4 w-1/2 text-xs">
                        <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                    Relevance
                                </span>
                                <span className="text-[#3a7bb7] text-xs">
                                    {selectedDocument?.relevanceScore || 0}/10
                                </span>
                            </div>
                            <div className="bg-[#e2e8f0] dark:bg-[#2a3148] rounded-full w-full h-1.5">
                                <div
                                    className="bg-[#3a7bb7] rounded-full h-full"
                                    style={{
                                        width: `${selectedDocument?.relevanceScore ? selectedDocument.relevanceScore * 10 : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Summary:
                            </p>
                            <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                {selectedDocument?.summarySnippet || "No analysis available for this document."}
                                <span className="inline-block bg-[#4a5568] dark:bg-[#a0aec0] w-0.5 h-3 ml-0.5 animate-caret-blink" style={{ verticalAlign: 'text-top' }} />
                            </p>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Key Arguments:
                            </p>
                            <ul className="pl-4 text-[#4a5568] dark:text-[#a0aec0] text-xs list-disc">
                                <li>Document analysis in progress...</li>
                                <li>Key arguments will appear here as analysis completes</li>
                            </ul>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Extracted Entities:
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <span className="bg-[#f1f5f9] dark:bg-[#242a3d] px-1.5 py-0.5 rounded text-[#64748b] dark:text-[#94a3b8] text-[10px]">
                                    Entity extraction in progress...
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
                        >
                            <Brain size={12} className="mr-1" />
                            View Analysis Reasoning
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
