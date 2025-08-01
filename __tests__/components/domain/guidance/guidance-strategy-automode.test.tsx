import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GuidanceStrategy } from "@/components/domain/guidance/guidance-strategy";
import {
  generatedQueriesAtom,
  researchSessionAtom,
} from "@/lib/state/researchAtoms";

// Mock the research agent hook using vitest mock syntax
vi.mock("@/lib/hooks/useResearchAgent", () => ({
  useResearchAgent: vi.fn(),
}));

// Import the mocked function after the mock declaration
import { useResearchAgent } from "@/lib/hooks/useResearchAgent";

const mockedUseResearchAgent = useResearchAgent as ReturnType<typeof vi.fn>;

describe("GuidanceStrategy - Auto Mode", () => {
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

  describe("Auto Mode Switch", () => {
    it("should render auto mode switch component", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Auto Mode")).toBeInTheDocument();
      expect(
        screen.getByText("Automatically refine queries and continue research")
      ).toBeInTheDocument();
    });

    it("should call toggleAutoMode when switch is clicked", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const autoModeSwitch = screen.getByRole("switch");
      fireEvent.click(autoModeSwitch);

      expect(mockAgent.toggleAutoMode).toHaveBeenCalledTimes(1);
    });

    it("should show correct switch state when auto mode is enabled", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        autoModeEnabled: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const autoModeSwitch = screen.getByRole("switch");
      expect(autoModeSwitch).toBeChecked();
    });

    it("should disable switch when research is loading", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const autoModeSwitch = screen.getByRole("switch");
      expect(autoModeSwitch).toBeDisabled();
    });
  });

  describe("Research Control Buttons", () => {
    it("should show start research button when not loading and cannot resume", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Start Research")).toBeInTheDocument();
      expect(screen.queryByText("Resume Research")).not.toBeInTheDocument();
    });

    it("should show resume button when can resume and not loading", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        canResume: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("Resume Research")).toBeInTheDocument();
      expect(screen.queryByText("Start Research")).not.toBeInTheDocument();
    });

    it("should show pause and abort buttons when loading", () => {
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
    });

    it("should show auto mode indicator in processing message", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
        autoModeEnabled: true,
        currentStage: "GENERATING_QUERIES",
        currentMessage: "Executing REFINE_QUERIES",
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText(/Auto Mode: Processing/)).toBeInTheDocument();
    });

    it("should call correct handlers when buttons are clicked", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const pauseButton = screen.getByText("Pause");
      const abortButton = screen.getByText("Abort");

      fireEvent.click(pauseButton);
      expect(mockAgent.pauseResearch).toHaveBeenCalledTimes(1);

      fireEvent.click(abortButton);
      expect(mockAgent.abortResearch).toHaveBeenCalledTimes(1);
    });

    it("should disable pause button when already paused", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
        isPaused: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const pauseButton = screen.getByText("Pause");
      expect(pauseButton).toBeDisabled();
    });
  });

  describe("Accumulated Queries Display", () => {
    it("should show total count when accumulated queries exist", () => {
      // Set up accumulated queries
      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedQueries: [
          {
            query_string: "patent requirements AI",
            expected_information_summary: "Patent eligibility",
            timestamp: "2024-01-01T10:00:00Z",
          },
          {
            query_string: "AI inventorship",
            expected_information_summary: "Inventorship rules",
            timestamp: "2024-01-01T10:05:00Z",
          },
        ],
        accumulatedDocuments: [],
        accumulatedTopics: [],
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(
        screen.getByText("Generated Search Queries (2 total)")
      ).toBeInTheDocument();
    });

    it("should display queries with timestamps", () => {
      // Set up accumulated queries
      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedQueries: [
          {
            query_string: "patent requirements AI",
            expected_information_summary: "Patent eligibility for AI",
            timestamp: "2024-01-01T10:00:00Z",
          },
        ],
        accumulatedDocuments: [],
        accumulatedTopics: [],
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("patent requirements AI")).toBeInTheDocument();
      expect(screen.getByText("Patent eligibility for AI")).toBeInTheDocument();
      // Should show timestamp (format depends on locale)
      expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
    });

    it("should sort queries by timestamp (most recent first)", () => {
      // Set up queries with different timestamps
      store.set(researchSessionAtom, {
        sessionId: "test-session",
        accumulatedQueries: [
          {
            query_string: "older query",
            expected_information_summary: "Older info",
            timestamp: "2024-01-01T09:00:00Z",
          },
          {
            query_string: "newer query",
            expected_information_summary: "Newer info",
            timestamp: "2024-01-01T10:00:00Z",
          },
        ],
        accumulatedDocuments: [],
        accumulatedTopics: [],
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const queryElements = screen.getAllByText(/query/);
      // The newer query should appear first
      expect(queryElements[0]).toHaveTextContent("newer query");
      expect(queryElements[1]).toHaveTextContent("older query");
    });

    it("should fall back to current session queries when no accumulated queries", () => {
      // Set up current session queries only
      store.set(generatedQueriesAtom, [
        {
          query_string: "current session query",
          expected_information_summary: "Current info",
        },
      ]);

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      expect(screen.getByText("current session query")).toBeInTheDocument();
      expect(screen.getByText("Generated Search Queries")).toBeInTheDocument();
      expect(screen.queryByText(/total/)).not.toBeInTheDocument();
    });
  });

  describe("Legal Question Input", () => {
    it("should disable start button when input is empty", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const startButton = screen.getByText("Start Research");
      expect(startButton).toBeDisabled();
    });

    it("should enable start button when input has content", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const input = screen.getByPlaceholderText(
        "Enter Legal Question or Research Topic"
      );
      fireEvent.change(input, { target: { value: "Test legal question" } });

      const startButton = screen.getByText("Start Research");
      expect(startButton).toBeEnabled();
    });

    it("should call startResearch with legal question when start button is clicked", () => {
      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const input = screen.getByPlaceholderText(
        "Enter Legal Question or Research Topic"
      );
      fireEvent.change(input, {
        target: { value: "What are patent requirements?" },
      });

      const startButton = screen.getByText("Start Research");
      fireEvent.click(startButton);

      expect(mockAgent.startResearch).toHaveBeenCalledWith(
        "What are patent requirements?"
      );
    });

    it("should disable input when research is loading", () => {
      mockedUseResearchAgent.mockReturnValue({
        ...mockAgent,
        isLoading: true,
      });

      render(
        <JotaiProvider>
          <GuidanceStrategy />
        </JotaiProvider>
      );

      const input = screen.getByPlaceholderText(
        "Enter Legal Question or Research Topic"
      );
      expect(input).toBeDisabled();
    });
  });
});
