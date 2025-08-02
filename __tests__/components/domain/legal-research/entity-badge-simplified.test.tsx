// IMPORTANT: DOM setup must be imported FIRST, before Testing Library
// DOM setup handled by setupTests.ts via vitest.config.ts
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntityBadge } from "@/components/domain/legal-research/entity-badge";
import type { ClientLegalEntity } from "@/lib/state/researchAtoms";

describe("Enhanced Entity Badge (Simplified)", () => {
  // Clean up DOM after each test to prevent pollution
  afterEach(() => {
    cleanup();
    document.body.innerHTML = "";
  });

  const mockEntity: ClientLegalEntity = {
    name: "Test Case v. Example Corp",
    type: "Case",
    details: "A landmark case regarding corporate law",
    confidence: 0.85,
  };

  describe("Week 3 Core Features", () => {
    it("should render entity name correctly", () => {
      const { getByText } = render(<EntityBadge entity={mockEntity} />);

      expect(getByText("Test Case v. Example Corp")).toBeInTheDocument();
    });

    it("should apply correct styling for Case type", () => {
      const { container } = render(<EntityBadge entity={mockEntity} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("bg-blue-100", "text-blue-800");
    });

    it("should handle different size variants", () => {
      // Small size
      const { container: smContainer } = render(
        <EntityBadge entity={mockEntity} size="sm" />
      );
      const smElement = smContainer.firstChild as HTMLElement;
      expect(smElement).toHaveClass("px-1.5", "py-0.5", "text-xs");

      // Medium size (default)
      const { container: mdContainer } = render(
        <EntityBadge entity={mockEntity} size="md" />
      );
      const mdElement = mdContainer.firstChild as HTMLElement;
      expect(mdElement).toHaveClass("px-2", "py-1", "text-sm");

      // Large size
      const { container: lgContainer } = render(
        <EntityBadge entity={mockEntity} size="lg" />
      );
      const lgElement = lgContainer.firstChild as HTMLElement;
      expect(lgElement).toHaveClass("px-3", "py-1.5", "text-base");
    });

    it("should show confidence display when enabled", () => {
      const { getByText } = render(
        <EntityBadge entity={mockEntity} showConfidence={true} />
      );

      expect(getByText("85%")).toBeInTheDocument();
    });

    it("should handle interactivity with onClick", () => {
      const handleClick = vi.fn();
      const { getByText } = render(
        <EntityBadge
          entity={mockEntity}
          onClick={handleClick}
          interactive={true}
        />
      );

      const badge = getByText("Test Case v. Example Corp");
      fireEvent.click(badge);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should render as button when interactive", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} interactive={true} />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe("BUTTON");
    });

    it("should render as span when not interactive", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} interactive={false} />
      );

      const element = container.firstChild as HTMLElement;
      expect(element.tagName).toBe("SPAN");
    });

    it("should show title tooltip with details", () => {
      const { container } = render(<EntityBadge entity={mockEntity} />);

      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute("title")).toBe(
        "A landmark case regarding corporate law"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle entity without confidence", () => {
      const entityWithoutConfidence: ClientLegalEntity = {
        name: "Test Entity",
        type: "Statute",
        details: "Test details",
        // No confidence field
      };

      const { container } = render(
        <EntityBadge entity={entityWithoutConfidence} showConfidence={true} />
      );

      // Should render without error
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should handle entity without details", () => {
      const entityWithoutDetails: ClientLegalEntity = {
        name: "Test Entity",
        type: "Regulation",
        // No details field
      };

      const { getByText } = render(
        <EntityBadge entity={entityWithoutDetails} />
      );

      const element = getByText("Test Entity");
      expect(element).toBeInTheDocument();
      // Should not have title attribute when no details
      expect(element.getAttribute("title")).toBeNull();
    });
  });

  describe("Different Entity Types", () => {
    const entityTypes: ClientLegalEntity["type"][] = [
      "Case",
      "Statute",
      "Regulation",
      "Person",
      "Organization",
      "LegalConcept",
      "Jurisdiction",
    ];

    entityTypes.forEach((type) => {
      it(`should render ${type} entity type correctly`, () => {
        const testEntity: ClientLegalEntity = {
          name: `Test ${type}`,
          type,
          details: `Test ${type} details`,
        };

        const { getByText } = render(<EntityBadge entity={testEntity} />);

        expect(getByText(`Test ${type}`)).toBeInTheDocument();
      });
    });
  });
});
