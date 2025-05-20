import { Modal } from "@ui/modal";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface SynthesisReasoningModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SynthesisReasoningModal({
    isOpen,
    onClose,
}: SynthesisReasoningModalProps) {
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
                        This analysis is based on current case law and may need
                        updates as new precedents emerge.
                    </p>
                </div>
                <div className="space-y-4">
                    <div className="bg-[#f8fafc] dark:bg-[#1e2436] p-4 rounded-lg">
                        <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                            Reasoning Chain
                        </h4>
                        <div className="space-y-3">
                            {[
                                {
                                    status: "complete",
                                    text: "Identified relevant precedents from 9th Circuit",
                                },
                                {
                                    status: "complete",
                                    text: "Analyzed force majeure clause requirements",
                                },
                                {
                                    status: "warning",
                                    text: "Examining state-specific variations",
                                },
                                {
                                    status: "pending",
                                    text: "Synthesizing final conclusions",
                                },
                            ].map((step) => (
                                <div
                                    key={`step-${step.text}`}
                                    className="flex items-start"
                                >
                                    <div className="mt-1 mr-2">
                                        {step.status === "complete" ? (
                                            <CheckCircle
                                                size={14}
                                                className="text-[#16a34a] dark:text-[#86efac]"
                                            />
                                        ) : step.status === "warning" ? (
                                            <AlertTriangle
                                                size={14}
                                                className="text-[#eab308]"
                                            />
                                        ) : (
                                            <div className="border-[#e2e8f0] border-2 dark:border-[#2a3148] rounded-full w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <p className="text-[#4a5568] dark:text-[#a0aec0] text-sm">
                                        {step.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="mb-2 font-medium text-[#2d3748] dark:text-[#e2e8f0] text-sm">
                            Sources Used
                        </h4>
                        <div className="space-y-2">
                            {[
                                {
                                    id: "DOC-001",
                                    confidence: 0.92,
                                },
                                {
                                    id: "DOC-003",
                                    confidence: 0.87,
                                },
                                {
                                    id: "DOC-007",
                                    confidence: 0.76,
                                },
                            ].map((source) => (
                                <div
                                    key={source.id}
                                    className="flex justify-between items-center text-xs"
                                >
                                    <span className="text-[#4a5568] dark:text-[#a0aec0]">
                                        {source.id}
                                    </span>
                                    <div className="flex items-center">
                                        <div className="bg-[#e2e8f0] dark:bg-[#2a3148] mr-2 rounded-full w-24 h-1.5">
                                            <div
                                                className="bg-[#3a7bb7] rounded-full h-full"
                                                style={{
                                                    width: `${source.confidence * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-[#3a7bb7]">
                                            {(source.confidence * 100).toFixed(
                                                0,
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
