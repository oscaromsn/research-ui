"use client";

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
import { useMemo } from "react";
import type { ReactElement } from "react";

import type { ResearchStage } from "@/app/actions/researchAgentOrchestrator";
import { researchStatusAtom } from "@/lib/state/researchAtoms";

// Stage styling constants
const STAGE_STYLES = {
  active: "bg-[#3a7bb7] text-white",
  completed: "bg-green-500 dark:bg-green-600 text-white",
  pending: "bg-[#242a3d] text-[#6b7280]",
} as const;

const TEXT_STYLES = {
  active: "text-[#3a7bb7] font-medium",
  completed: "text-green-500 dark:text-green-400",
  pending: "text-[#6b7280]",
} as const;

const CONNECTOR_STYLES = {
  completed: "bg-green-500 dark:bg-green-600",
  pending: "bg-[#242a3d]",
} as const;

// Mapping from orchestrator stages to lifecycle display stages
const STAGE_MAPPING: Record<ResearchStage | "IDLE", string> = {
  IDLE: "Ideate",
  INITIALIZING: "Ideate",
  GENERATING_QUERIES: "Plan",
  FETCHING_DOCUMENTS: "Research",
  ANALYZING_DOCUMENTS: "Analyze",
  SYNTHESIZING_FINDINGS: "Review",
  ASSESSING_RESEARCH: "Review",
  GENERATING_REPORT: "Draft",
  COMPLETED: "Draft",
  ERROR: "Ideate",
  HUMAN_REVIEW_REQUESTED: "Review",
  ITERATION_PAUSED: "Review",
};

type StageStatus = "completed" | "active" | "pending";

interface StageInfo {
  name: string;
  icon: ReactElement;
  status: StageStatus;
}

export function ResearchLifecycle() {
  const status = useAtomValue(researchStatusAtom);

  const researchStageToLifecycleName = (
    stage: ResearchStage | null
  ): string => {
    if (!stage) return "Ideate";
    return STAGE_MAPPING[stage] || "Ideate";
  };

  const lifecycleStageMap: Record<
    string,
    { name: string; icon: ReactElement }
  > = useMemo(
    () => ({
      Ideate: { name: "Ideate", icon: <Lightbulb size={16} /> },
      Plan: { name: "Plan", icon: <Compass size={16} /> },
      Research: { name: "Research", icon: <Search size={16} /> },
      Analyze: { name: "Analyze", icon: <Brain size={16} /> },
      Review: { name: "Review", icon: <CheckSquare size={16} /> },
      Draft: { name: "Draft", icon: <Pen size={16} /> },
    }),
    []
  );

  const stages: StageInfo[] = useMemo(() => {
    const activeLifecycleStageName = researchStageToLifecycleName(status.stage);
    const lifecycleStageOrder = Object.keys(lifecycleStageMap);
    const activeStageIndex = lifecycleStageOrder.indexOf(
      activeLifecycleStageName
    );

    return lifecycleStageOrder.map((stageName, stageIndex) => {
      const stageInfo = lifecycleStageMap[stageName];
      let stageStatus: StageStatus = "pending";

      if (status.stage === "COMPLETED") {
        stageStatus = "completed";
      } else if (
        status.stage === "ERROR" ||
        status.stage === "HUMAN_REVIEW_REQUESTED" ||
        status.stage === "ITERATION_PAUSED" ||
        status.isLoading
      ) {
        if (stageIndex < activeStageIndex) {
          stageStatus = "completed";
        } else if (stageIndex === activeStageIndex) {
          stageStatus = "active";
        } else {
          stageStatus = "pending";
        }
      }

      return {
        ...stageInfo,
        status: stageStatus,
      };
    });
  }, [status.stage, status.isLoading, lifecycleStageMap]);

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {stages.map((stage, index) => {
          const isLastStage = index === stages.length - 1;
          const nextStage = stages[index + 1];
          const showLoader = stage.status === "active" && status.isLoading;
          const connectorStyle =
            stage.status === "pending" && nextStage?.status === "pending"
              ? CONNECTOR_STYLES.pending
              : CONNECTOR_STYLES.completed;

          return (
            <div
              key={stage.name}
              className="group flex flex-col items-center mx-1"
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 relative z-10 ${
                  STAGE_STYLES[stage.status]
                }`}
                data-testid={`stage-icon-${stage.name.toLowerCase()}`}
              >
                {showLoader ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="absolute z-10">{stage.icon}</div>
                    <Loader2
                      size={22}
                      className="absolute opacity-40 animate-spin"
                      data-testid="loader"
                    />
                  </div>
                ) : (
                  stage.icon
                )}
                {!isLastStage && (
                  <div
                    className={`absolute left-8 top-1/2 -translate-y-1/2 w-6 h-[1px] transition-colors duration-300 z-0 ${connectorStyle}`}
                  />
                )}
              </div>
              <span
                className={`text-xs mt-2 transition-colors duration-300 ${
                  TEXT_STYLES[stage.status]
                }`}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
