// DOM setup handled by setupTests.ts via vitest.config.ts
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DocumentStatusIndicator,
  getStatusIndicator,
  type StatusIndicatorData,
} from "@/components/domain/legal-research/document-status-indicator";

describe("Enhanced Document Status Indicator", () => {
  describe("StatusIndicatorData Interface", () => {
    it("should support basic status data structure", () => {
      const basicStatus: StatusIndicatorData = {
        icon: <div>icon</div>,
        text: "Analyzing",
        color: "text-blue-600",
      };

      expect(basicStatus.icon).toBeDefined();
      expect(basicStatus.text).toBe("Analyzing");
      expect(basicStatus.color).toBe("text-blue-600");
    });

    it("should support enhanced fields", () => {
      const enhancedStatus: StatusIndicatorData = {
        icon: <div>icon</div>,
        text: "Analyzing document content...",
        color: "text-blue-600",
        progress: 65,
        estimatedTime: "~2 minutes remaining",
        actions: [
          {
            label: "Retry",
            onClick: () => {
              /* Test callback */
            },
            variant: "primary" as const,
          },
          {
            label: "Skip",
            onClick: () => {
              /* Test callback */
            },
            variant: "secondary" as const,
          },
        ],
        details: "Processing document analysis with AI model",
      };

      expect(enhancedStatus.progress).toBe(65);
      expect(enhancedStatus.estimatedTime).toBe("~2 minutes remaining");
      expect(enhancedStatus.actions).toHaveLength(2);
      expect(enhancedStatus.actions).toBeDefined();
      if (enhancedStatus.actions && enhancedStatus.actions.length > 0) {
        expect(enhancedStatus.actions[0]?.label).toBe("Retry");
      }
      expect(enhancedStatus.details).toBe(
        "Processing document analysis with AI model"
      );
    });

    it("should support legacy compatibility fields", () => {
      const statusWithLegacy: StatusIndicatorData = {
        icon: <div>icon</div>,
        text: "Retrieved",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
      };

      expect(statusWithLegacy.bgColor).toBe("bg-blue-50 dark:bg-blue-900/20");
      expect(statusWithLegacy.borderColor).toBe(
        "border-blue-200 dark:border-blue-800"
      );
    });
  });

  describe("getStatusIndicator function", () => {
    it("should return basic status for simple cases", () => {
      const status = getStatusIndicator("fetched");

      expect(status.text).toContain("Retrieved");
      expect(status.color).toBeDefined();
      expect(status.icon).toBeDefined();
      expect(status.details).toBeDefined();
    });

    it("should return enhanced status with progress for analyzing state", () => {
      const status = getStatusIndicator("analyzing", {
        progress: 45,
        estimatedTime: "~3 minutes remaining",
      });

      expect(status.text).toContain("Analyzing");
      expect(status.progress).toBe(45);
      expect(status.estimatedTime).toBe("~3 minutes remaining");
      expect(status.details).toBeDefined();
    });

    it("should return enhanced status with actions for failed state", () => {
      const mockRetry = vi.fn();
      const mockSkip = vi.fn();

      const status = getStatusIndicator("failed", {
        onRetry: mockRetry,
        onSkip: mockSkip,
        errorMessage: "Analysis timeout occurred",
      });

      expect(status.text).toContain("failed");
      expect(status.actions).toHaveLength(2);
      expect(status.actions).toBeDefined();
      if (status.actions && status.actions.length >= 2) {
        expect(status.actions[0]?.label).toBe("Retry");
        expect(status.actions[1]?.label).toBe("Skip");
        expect(status.details).toContain("Analysis timeout occurred");

        // Test action callbacks
        status.actions[0]?.onClick();
        status.actions[1]?.onClick();
      }

      expect(mockRetry).toHaveBeenCalledOnce();
      expect(mockSkip).toHaveBeenCalledOnce();
    });

    it("should include details for all status types", () => {
      const statuses = ["fetched", "analyzing", "analyzed", "failed", "error"];

      statuses.forEach((statusType) => {
        const status = getStatusIndicator(statusType);
        expect(status.details).toBeDefined();
        expect(typeof status.details).toBe("string");
      });
    });

    it("should handle unknown status gracefully", () => {
      const status = getStatusIndicator("unknown-status");

      expect(status.text).toBe("Unknown");
      expect(status.color).toBe("text-gray-600");
      expect(status.details).toBe("Status information not available");
    });

    it("should provide legacy compatibility fields", () => {
      const status = getStatusIndicator("fetched");

      expect(status.bgColor).toBeDefined();
      expect(status.borderColor).toBeDefined();
      expect(status.bgColor).toContain("bg-blue-50");
      expect(status.borderColor).toContain("border-blue-200");
    });
  });

  describe("DocumentStatusIndicator Component", () => {
    it("should render basic status without enhancements", () => {
      const { getByText } = render(
        <DocumentStatusIndicator status="fetched" className="test-class" />
      );

      expect(getByText(/Retrieved/)).toBeInTheDocument();
    });

    it("should render progress when provided", () => {
      const { getByText } = render(
        <DocumentStatusIndicator
          status="analyzing"
          progress={75}
          estimatedTime="~1 minute remaining"
        />
      );

      expect(getByText(/~1 minute remaining/)).toBeInTheDocument();
    });

    it("should render action buttons when actions are available", () => {
      const mockRetry = vi.fn();
      const mockSkip = vi.fn();

      const { getByText } = render(
        <DocumentStatusIndicator
          status="failed"
          onRetry={mockRetry}
          onSkip={mockSkip}
          errorMessage="Connection timeout"
        />
      );

      const retryButton = getByText("Retry");
      const skipButton = getByText("Skip");

      expect(retryButton).toBeInTheDocument();
      expect(skipButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      fireEvent.click(skipButton);

      expect(mockRetry).toHaveBeenCalledOnce();
      expect(mockSkip).toHaveBeenCalledOnce();
    });

    it("should handle all status types", () => {
      const statuses = ["fetched", "analyzing", "analyzed", "failed"];

      statuses.forEach((status) => {
        const { unmount } = render(<DocumentStatusIndicator status={status} />);

        // Each status should render without errors
        expect(document.body).toBeInTheDocument();

        unmount();
      });
    });

    it("should pass through className prop", () => {
      const { container } = render(
        <DocumentStatusIndicator
          status="analyzing"
          className="custom-test-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-test-class");
    });

    it("should handle missing optional props gracefully", () => {
      const { getByText } = render(
        <DocumentStatusIndicator status="analyzing" />
      );

      // Should render without errors when optional props are not provided
      expect(getByText(/Analyzing/)).toBeInTheDocument();
    });

    it("should handle error message in failed status", () => {
      const { getByText } = render(
        <DocumentStatusIndicator
          status="failed"
          errorMessage="Custom error message"
        />
      );

      const showDetailsButton = getByText("Show details");
      fireEvent.click(showDetailsButton);

      expect(getByText("Custom error message")).toBeInTheDocument();
    });
  });
});
