"use client";

import { Brain, Gavel, Scroll } from "lucide-react";
import { useState } from "react";
import { CaseModal } from "./modals/CaseModal";
export function EvidenceAnalysis() {
    const [selectedCase, setSelectedCase] = useState<{
        id: number;
        title: string;
        source: string;
        date: string;
        snippet: string;
        type: string;
        selected: boolean;
    } | null>(null);
    const searchResults = [
        {
            id: 1,
            title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
            source: "Westlaw",
            date: "Nov 15, 2023",
            snippet:
                "The court found that COVID-19 related restrictions constituted force majeure...",
            type: "case",
            selected: true,
        },
        {
            id: 2,
            title: "Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)",
            source: "Lexis",
            date: "Aug 3, 2022",
            snippet:
                "The doctrine of impossibility requires more than mere hardship...",
            type: "case",
            selected: false,
        },
        {
            id: 3,
            title: "California Civil Code § 1511",
            source: "Official Code",
            date: "2021 Edition",
            snippet:
                "Performance of an obligation is excused when it is prevented by...",
            type: "statute",
            selected: false,
        },
    ];
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
                    {searchResults.map((result) => (
                        <div
                            key={result.id}
                            className={`p-3 mb-2 rounded-lg cursor-pointer ${result.selected ? "bg-[#edf2f7] dark:bg-[#242a3d] border-l-4 border-[#3a7bb7]" : "bg-white dark:bg-[#1e2436] hover:bg-[#f8fafc] dark:hover:bg-[#212941]"}`}
                            onClick={() => setSelectedCase(result)}
                            onKeyUp={(e) =>
                                e.key === "Enter" && setSelectedCase(result)
                            }
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="mb-1 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                                        {result.title}
                                    </h3>
                                    <div className="flex items-center mb-1 text-[#64748b] dark:text-[#94a3b8] text-xs">
                                        <span>{result.source}</span>
                                        <span className="mx-1">•</span>
                                        <span>{result.date}</span>
                                    </div>
                                    <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                        {result.snippet}
                                    </p>
                                </div>
                                <div className="mt-1 ml-2">
                                    {result.type === "case" ? (
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
                    ))}
                </div>
            </div>
            <CaseModal
                isOpen={selectedCase !== null}
                onClose={() => setSelectedCase(null)}
                caseData={
                    selectedCase
                        ? {
                              title: selectedCase.title,
                              source: selectedCase.source,
                              court:
                                  selectedCase.type === "case"
                                      ? selectedCase.title
                                            .split("(")[1]
                                            ?.replace(")", "")
                                      : "",
                              date: selectedCase.date,
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
                                    8/10
                                </span>
                            </div>
                            <div className="bg-[#e2e8f0] dark:bg-[#2a3148] rounded-full w-full h-1.5">
                                <div
                                    className="bg-[#3a7bb7] rounded-full h-full"
                                    style={{
                                        width: "80%",
                                    }}
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Summary:
                            </p>
                            <p className="text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                The court established that government mandates
                                during COVID-19 could qualify as force majeure
                                events, but requires specific contract language.
                                The decision hinges on whether the clause
                                explicitly mentions &quot;pandemics&quot; or &quot;government
                                actions&quot;
                                <span className="inline-block bg-[#a0aec0] w-1.5 h-4 animate-caret-blink" />
                            </p>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Key Arguments:
                            </p>
                            <ul className="pl-4 text-[#4a5568] dark:text-[#a0aec0] text-xs list-disc">
                                <li>
                                    Specificity of force majeure clause language
                                </li>
                                <li>
                                    Foreseeability of pandemic-related
                                    disruptions
                                </li>
                            </ul>
                        </div>
                        <div className="mb-3">
                            <p className="mb-1 font-medium text-[#4a5568] dark:text-[#a0aec0] text-xs">
                                Extracted Entities:
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <span className="bg-[#dbeafe] dark:bg-[#1e3a8a] px-1.5 py-0.5 rounded text-[#2563eb] text-[10px] dark:text-[#93c5fd]">
                                    CASE: Roe v. Wade
                                </span>
                                <span className="bg-[#dcfce7] dark:bg-[#14532d] px-1.5 py-0.5 rounded text-[#16a34a] text-[10px] dark:text-[#86efac]">
                                    STATUTE: 15 U.S.C. § 78j(b)
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
