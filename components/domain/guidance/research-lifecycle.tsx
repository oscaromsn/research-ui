"use client";

import type { ResearchStage } from "@/app/actions/researchAgentOrchestrator";
import { researchStatusAtom } from "@/lib/state/researchAtoms";
import { useAtomValue } from "jotai";
import {
    Brain,
    CheckSquare,
    Compass,
    Lightbulb,
    Loader2,
    Pen,
    Search,
} from "lucide-react";
import type { ReactElement } from "react";

export function ResearchLifecycle() {
    const status = useAtomValue(researchStatusAtom);

    // Mapping from orchestrator stages to lifecycle display stages
    const researchStageToLifecycleName = (
        stage: ResearchStage | null,
    ): string => {
        if (!stage || stage === "IDLE") return "Ideate"; // Default or initial
        switch (stage) {
            case "INITIALIZING":
                return "Ideate";
            case "GENERATING_QUERIES":
                return "Plan";
            case "FETCHING_DOCUMENTS":
                return "Research";
            case "ANALYZING_DOCUMENTS":
                return "Analyze";
            case "SYNTHESIZING_FINDINGS":
                return "Review";
            case "ASSESSING_RESEARCH":
                return "Review";
            case "GENERATING_REPORT":
                return "Draft";
            case "COMPLETED":
                return "Draft";
            case "ERROR":
                return "Ideate"; // Show error on first stage
            default:
                return "Ideate";
        }
    };

    const lifecycleStageMap: Record<
        string,
        { name: string; icon: ReactElement }
    > = {
        Ideate: { name: "Ideate", icon: <Lightbulb size={16} /> },
        Plan: { name: "Plan", icon: <Compass size={16} /> },
        Research: { name: "Research", icon: <Search size={16} /> },
        Analyze: {
            name: "Analyze",
            icon: <Brain size={16} />,
        },
        Review: { name: "Review", icon: <CheckSquare size={16} /> },
        Draft: { name: "Draft", icon: <Pen size={16} /> },
    };

    const activeLifecycleStageName = researchStageToLifecycleName(status.stage);
    const lifecycleStageOrder = Object.keys(lifecycleStageMap);

    const stages = lifecycleStageOrder.map((stageName) => {
        const stageInfo = lifecycleStageMap[stageName];
        const stageIndex = lifecycleStageOrder.indexOf(stageName);
        const activeStageIndex = lifecycleStageOrder.indexOf(
            activeLifecycleStageName,
        );

        let stageStatus: "completed" | "active" | "pending" = "pending";

        if (status.stage === "COMPLETED") {
            // All stages completed
            stageStatus = "completed";
        } else if (
            status.stage === "ERROR" ||
            status.stage === "HUMAN_REVIEW_REQUESTED" ||
            status.stage === "ITERATION_PAUSED"
        ) {
            // Error or paused states
            if (stageIndex < activeStageIndex) {
                stageStatus = "completed";
            } else if (stageIndex === activeStageIndex) {
                stageStatus = "active";
            } else {
                stageStatus = "pending";
            }
        } else if (status.isLoading) {
            // Normal progression
            if (stageIndex < activeStageIndex) {
                stageStatus = "completed";
            } else if (stageIndex === activeStageIndex) {
                stageStatus = "active";
            } else {
                stageStatus = "pending";
            }
        } else {
            // Idle state
            stageStatus = "pending";
        }

        return {
            ...stageInfo,
            status: stageStatus,
        };
    });

    return (
        <div className="flex items-center">
            <div className="flex items-center">
                {stages.map((stage, index) => (
                    <div
                        key={stage.name}
                        className="group flex flex-col items-center mx-1"
                    >
                        <div
                            className={`
              flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300
              ${stage.status === "active" ? "bg-[#3a7bb7] text-white" : stage.status === "completed" ? "bg-green-500 dark:bg-green-600 text-white" : "bg-[#242a3d] text-[#6b7280]"}
              ${index !== stages.length - 1 ? "relative" : ""}
            `}
                        >
                            {stage.status === "active" && status.isLoading ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <div className="absolute z-10">
                                        {stage.icon}
                                    </div>
                                    <Loader2
                                        size={22}
                                        className="absolute opacity-40 animate-spin"
                                        data-testid="loader"
                                    />
                                </div>
                            ) : (
                                stage.icon
                            )}
                            {index !== stages.length - 1 && (
                                <div
                                    className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-[1px] transition-colors duration-300 ${
                                        stage.status === "pending" &&
                                        stages[index + 1]?.status === "pending"
                                            ? "bg-[#242a3d]"
                                            : "bg-green-500 dark:bg-green-600"
                                    }`}
                                />
                            )}
                        </div>
                        <span
                            className={`text-xs mt-2 transition-colors duration-300 ${stage.status === "active" ? "text-[#3a7bb7] font-medium" : stage.status === "completed" ? "text-green-500 dark:text-green-400" : "text-[#6b7280]"}`}
                        >
                            {stage.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
