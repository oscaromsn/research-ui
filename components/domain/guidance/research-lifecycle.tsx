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
import type { ReactElement } from "react";
import { useMemo } from "react";

import type { ResearchStage } from "@/packages/shared-types/src/sse-events";
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

const researchStageToLifecycleName = (stage: ResearchStage | null): string => {
  if (!stage) {
    return "Ideate";
  }
  return STAGE_MAPPING[stage] || "Ideate";
};

const getStageStatus = (
  stageIndex: number,
  activeStageIndex: number,
  researchStage: ResearchStage | null,
  isLoading: boolean
): StageStatus => {
  if (researchStage === "COMPLETED") {
    return "completed";
  }

  const isActiveStage = stageIndex === activeStageIndex;
  const isCompletedStage = stageIndex < activeStageIndex;
  const hasError =
    researchStage === "ERROR" ||
    researchStage === "HUMAN_REVIEW_REQUESTED" ||
    researchStage === "ITERATION_PAUSED";

  if (hasError || isLoading) {
    if (isCompletedStage) {
      return "completed";
    }
    if (isActiveStage) {
      return "active";
    }
    return "pending";
  }

  return "pending";
};

export function ResearchLifecycle() {
  const status = useAtomValue(researchStatusAtom);

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
      if (!stageInfo) {
        throw new Error(`Stage info not found for stage: ${stageName}`);
      }

      return {
        name: stageInfo.name,
        icon: stageInfo.icon,
        status: getStageStatus(
          stageIndex,
          activeStageIndex,
          status.stage,
          status.isLoading
        ),
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
              className="group mx-1 flex flex-col items-center"
            >
              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                  STAGE_STYLES[stage.status]
                }`}
                data-testid={`stage-icon-${stage.name.toLowerCase()}`}
              >
                {showLoader ? (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="absolute z-10">{stage.icon}</div>
                    <Loader2
                      size={22}
                      className="absolute animate-spin opacity-40"
                      data-testid="loader"
                    />
                  </div>
                ) : (
                  stage.icon
                )}
                {!isLastStage && (
                  <div
                    className={`-translate-y-1/2 absolute top-1/2 left-8 z-0 h-[1px] w-6 transition-colors duration-300 ${connectorStyle}`}
                  />
                )}
              </div>
              <span
                className={`mt-2 text-xs transition-colors duration-300 ${
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
