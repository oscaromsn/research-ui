import { describe, expect, it, vi } from "vitest";
import { getStatusIndicator } from "@/components/domain/legal-research/document-status-indicator";

describe("Document Status Indicator - Minimal Tests", () => {
  describe("getStatusIndicator function", () => {
    it("should return basic status data", () => {
      const result = getStatusIndicator("fetched");

      expect(result).toBeDefined();
      expect(result.text).toBe("Retrieved");
      expect(result.color).toBe("text-blue-600");
      expect(result.details).toBe(
        "Document successfully retrieved from search"
      );
    });

    it("should handle progress metadata", () => {
      const result = getStatusIndicator("analyzing", {
        progress: 50,
        estimatedTime: "~2 minutes remaining",
      });

      expect(result.progress).toBe(50);
      expect(result.estimatedTime).toBe("~2 minutes remaining");
    });

    it("should handle failed status with actions", () => {
      const onRetry = vi.fn();
      const onSkip = vi.fn();

      const result = getStatusIndicator("failed", {
        onRetry,
        onSkip,
        errorMessage: "Test error",
      });

      expect(result.actions).toHaveLength(2);
      expect(result.actions).toBeDefined();
      if (result.actions && result.actions.length >= 2) {
        expect(result.actions[0]?.label).toBe("Retry");
        expect(result.actions[1]?.label).toBe("Skip");
        expect(result.details).toBe("Test error");

        // Test callbacks
        result.actions[0]?.onClick();
        result.actions[1]?.onClick();
      }

      expect(onRetry).toHaveBeenCalledOnce();
      expect(onSkip).toHaveBeenCalledOnce();
    });

    it("should provide legacy compatibility", () => {
      const result = getStatusIndicator("fetched");

      expect(result.bgColor).toBe("bg-blue-50 dark:bg-blue-900/20");
      expect(result.borderColor).toBe("border-blue-200 dark:border-blue-800");
    });

    it("should handle all status types", () => {
      const statuses = [
        "fetched",
        "analyzing",
        "analyzed",
        "failed",
        "error",
        "unknown",
      ];

      statuses.forEach((status) => {
        const result = getStatusIndicator(status);
        expect(result).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.color).toBeDefined();
        expect(result.details).toBeDefined();
      });
    });
  });
});
