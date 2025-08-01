import "../../../dom-setup";
import { render } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuidanceStrategy } from "@/components/domain/guidance/guidance-strategy";

// Mock the research agent hook using vitest mock syntax
vi.mock("@/lib/hooks/useResearchAgent", () => ({
  useResearchAgent: vi.fn(),
}));

// Import the mocked function after the mock declaration
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";

const mockedUseResearchAgent = useResearchAgent as ReturnType<typeof vi.fn>;

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

      const { getByText, queryByText } = render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(getByText("Start Research")).toBeInTheDocument();
      expect(queryByText("Pause")).not.toBeInTheDocument();
      expect(queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should show Start Research button when research has error", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        currentStage: "ERROR",
        error: "Research failed",
      });

      const { getByText, queryByText } = render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(getByText("Start Research")).toBeInTheDocument();
      expect(queryByText("Pause")).not.toBeInTheDocument();
      expect(queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should show processing controls during active research", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
        currentStage: "ANALYZING_DOCUMENTS",
        currentMessage: "Analyzing document 1/5",
      });

      const { getByText, queryByText } = render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(getByText("Pause")).toBeInTheDocument();
      expect(getByText("Abort")).toBeInTheDocument();
      expect(queryByText("Start Research")).not.toBeInTheDocument();
    });

    it("should show resume button when research can be resumed", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: false,
        canResume: true,
        isPaused: true,
      });

      const { getByText, queryByText } = render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(getByText("Resume Research")).toBeInTheDocument();
      expect(queryByText("Start Research")).not.toBeInTheDocument();
      expect(queryByText("Pause")).not.toBeInTheDocument();
      expect(queryByText("Abort")).not.toBeInTheDocument();
    });

    it("should handle transition from loading to completed state", () => {
      // Start with loading state
      const { getByText, queryByText, rerender } = render(
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

      expect(getByText("Pause")).toBeInTheDocument();
      expect(getByText("Abort")).toBeInTheDocument();

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

      expect(getByText("Start Research")).toBeInTheDocument();
      expect(queryByText("Pause")).not.toBeInTheDocument();
      expect(queryByText("Abort")).not.toBeInTheDocument();
    });
  });
});
