import { render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import React from "react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuidanceStrategy } from "@/components/domain/guidance/guidance-strategy";
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";

// Mock the research agent hook
vi.mock("@/lib/hooks/useResearchAgent", () => ({
  useResearchAgent: vi.fn(),
}));

const mockedUseResearchAgent = vi.mocked(useResearchAgent);

describe("GuidanceStrategy - Research Completion", () => {
  let store: ReturnType<typeof createStore>;

  const JotaiProvider = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const mockAgent = {
    startResearch: vi.fn(),
    resumeResearch: vi.fn(),
    pauseResearch: vi.fn(),
    abortResearch: vi.fn(),
    toggleAutoMode: vi.fn(),
    isLoading: false,
    currentStage: null,
    currentMessage: undefined,
    error: null,
    isPaused: false,
    canResume: false,
    autoModeEnabled: false,
  };

  beforeEach(() => {
    store = createStore();
    vi.clearAllMocks();
    mockedUseResearchAgent.mockReturnValue(mockAgent);
  });

  describe("Button State Management", () => {
    it("should show Start Research button when research is completed", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        currentStage: "COMPLETED",
        currentMessage: "Research process successfully completed.",
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Start Research")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should show Start Research button when research has error", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        currentStage: "ERROR",
        error: "Research failed",
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Start Research")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should show processing controls during active research", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
        currentStage: "ANALYZING_DOCUMENTS",
        currentMessage: "Analyzing document 1/5",
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Abort")).toBeInTheDocument();
      expect(screen.queryByText("Start Research")).not.toBeInTheDocument();
    });

    it("should show resume button when research can be resumed", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        canResume: true,
        isPaused: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Resume Research")).toBeInTheDocument();
      expect(screen.queryByText("Start Research")).not.toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should handle transition from loading to completed state", () => {
      // Start with loading state
      const { rerender } = render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      // Initially loading
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
        currentStage: "GENERATING_REPORT",
        currentMessage: "Generating final report...",
      });

      rerender(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Pause")).toBeInTheDocument();
      expect(screen.getByText("Abort")).toBeInTheDocument();

      // Then completed
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        currentStage: "COMPLETED",
        currentMessage: "Research process successfully completed.",
      });

      rerender(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Start Research")).toBeInTheDocument();
      expect(screen.queryByText("Pause")).not.toBeInTheDocument();
      expect(screen.queryByText("Abort")).not.toBeInTheDocument();
    });
  });
});
