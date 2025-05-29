import { BookOpen, Brain, Link, Scale } from "lucide-react";

import { Modal } from "@ui/modal";
interface CaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    caseData: {
        title?: string;
        source?: string;
        court?: string;
        date?: string;
    };
}
export function CaseModal({ isOpen, onClose, caseData }: CaseModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={caseData?.title || ""}
            size="xl"
        >
            <div className="space-y-6">
                <div className="flex items-center space-x-4 text-[#64748b] dark:text-[#94a3b8] text-sm">
                    <span className="flex items-center">
                        <BookOpen size={14} className="mr-1" />
                        {caseData?.source}
                    </span>
                    <span className="flex items-center">
                        <Scale size={14} className="mr-1" />
                        {caseData?.court}
                    </span>
                    <span>{caseData?.date}</span>
                </div>
                <div className="space-y-4">
                    <div className="bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
                        <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                            Key Holdings
                        </h4>
                        <ul className="space-y-2 pl-4 text-[#4a5568] dark:text-[#a0aec0] text-sm list-disc">
                            <li>
                                Force majeure clauses must explicitly mention
                                pandemic-related events
                            </li>
                            <li>
                                Government mandates may constitute qualifying
                                events
                            </li>
                            <li>
                                Mere economic hardship insufficient for
                                impossibility defense
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                            Full Text
                        </h4>
                        <div className="space-y-4 text-[#4a5568] dark:text-[#a0aec0] text-sm">
                            <p>
                                The court, in considering the application of
                                force majeure provisions in the context of the
                                COVID-19 pandemic, held that such clauses must
                                be interpreted narrowly and in accordance with
                                their explicit terms...
                            </p>
                            <p>
                                Furthermore, the mere existence of economic
                                hardship, without more, does not trigger the
                                doctrine of impossibility...
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-[#e1e5eb] dark:border-[#2a3148] border-t">
                        <button
                            type="button"
                            className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
                        >
                            <Brain size={12} className="mr-1" />
                            View AI Analysis
                        </button>
                        <button
                            type="button"
                            className="flex items-center text-[#3a7bb7] hover:text-[#2c5d8a] text-xs"
                        >
                            <Link size={12} className="mr-1" />
                            Cite This Case
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
