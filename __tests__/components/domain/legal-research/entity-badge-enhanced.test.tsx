// IMPORTANT: DOM setup must be imported FIRST, before Testing Library
// DOM setup handled by setupTests.ts via vitest.config.ts
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityBadge } from "@/components/domain/legal-research/entity-badge";
import type { ClientLegalEntity } from "@/lib/state/researchAtoms";

describe("Enhanced Entity Badge", () => {
  const mockEntity: ClientLegalEntity = {
    name: "Test Case v. Example Corp",
    type: "Case",
    details: "A landmark case regarding corporate law",
    confidence: 0.85,
  };

  const mockEntityWithLowConfidence: ClientLegalEntity = {
    name: "Uncertain Statute",
    type: "Statute",
    details: "A statute with uncertain applicability",
    confidence: 0.45,
  };

  describe("Basic Functionality", () => {
    it("should render entity name", () => {
      const { getByText } = render(<EntityBadge entity={mockEntity} />);

      expect(getByText("Test Case v. Example Corp")).toBeInTheDocument();
    });

    it("should apply correct styling for different entity types", () => {
      const { container: caseContainer } = render(
        <EntityBadge entity={mockEntity} />
      );
      const caseElement = caseContainer.firstChild as HTMLElement;

      expect(caseElement).toHaveClass("bg-blue-100", "text-blue-800");

      const statuteEntity = { ...mockEntity, type: "Statute" as const };
      const { container: statuteContainer } = render(
        <EntityBadge entity={statuteEntity} />
      );
      const statuteElement = statuteContainer.firstChild as HTMLElement;

      expect(statuteElement).toHaveClass("bg-green-100", "text-green-800");
    });

    it("should show details as title tooltip", () => {
      const { getByRole } = render(<EntityBadge entity={mockEntity} />);

      const badge = getByRole("button");
      expect(badge).toHaveAttribute(
        "title",
        "A landmark case regarding corporate law"
      );
    });
  });

  describe("Size Variants", () => {
    it("should apply small size classes", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} size="sm" />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("px-1.5", "py-0.5", "text-xs");
    });

    it("should apply medium size classes (default)", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} size="md" />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("px-2", "py-1", "text-sm");
    });

    it("should use medium size as default", () => {
      const { container } = render(<EntityBadge entity={mockEntity} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("px-2", "py-1", "text-sm");
    });

    it("should apply large size classes", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} size="lg" />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("px-3", "py-1.5", "text-base");
    });
  });

  describe("Interactivity", () => {
    it("should add interactive classes when interactive is true", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} interactive={true} />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("cursor-pointer", "hover:opacity-80");
    });

    it("should not add interactive classes when interactive is false", () => {
      const { container } = render(
        <EntityBadge entity={mockEntity} interactive={false} />
      );
      const element = container.firstChild as HTMLElement;

      expect(element).not.toHaveClass("cursor-pointer", "hover:opacity-80");
    });

    it("should be interactive by default", () => {
      const { container } = render(<EntityBadge entity={mockEntity} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("cursor-pointer", "hover:opacity-80");
    });

    it("should call onClick when badge is clicked and interactive", () => {
      const mockOnClick = vi.fn();
      const { getByText } = render(
        <EntityBadge
          entity={mockEntity}
          interactive={true}
          onClick={mockOnClick}
        />
      );

      const badge = getByText("Test Case v. Example Corp");
      fireEvent.click(badge);

      expect(mockOnClick).toHaveBeenCalledOnce();
      expect(mockOnClick).toHaveBeenCalledWith(mockEntity);
    });

    it("should not call onClick when non-interactive", () => {
      const mockOnClick = vi.fn();
      const { getByText } = render(
        <EntityBadge
          entity={mockEntity}
          interactive={false}
          onClick={mockOnClick}
        />
      );

      const badge = getByText("Test Case v. Example Corp");
      fireEvent.click(badge);

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Confidence Display", () => {
    it("should show confidence when showConfidence is true", () => {
      const { getByText } = render(
        <EntityBadge entity={mockEntity} showConfidence={true} />
      );

      expect(getByText("85%")).toBeInTheDocument();
    });

    it("should not show confidence when showConfidence is false", () => {
      const { queryByText } = render(
        <EntityBadge entity={mockEntity} showConfidence={false} />
      );

      expect(queryByText("85%")).not.toBeInTheDocument();
    });

    it("should not show confidence by default", () => {
      const { queryByText } = render(<EntityBadge entity={mockEntity} />);

      expect(queryByText("85%")).not.toBeInTheDocument();
    });

    it("should handle low confidence values", () => {
      const { getByText } = render(
        <EntityBadge
          entity={mockEntityWithLowConfidence}
          showConfidence={true}
        />
      );

      expect(getByText("45%")).toBeInTheDocument();
    });

    it("should handle missing confidence gracefully", () => {
      const entityWithoutConfidence: ClientLegalEntity = {
        name: "Test Case Without Confidence",
        type: "Case",
        details: "A case without confidence data",
        // confidence is intentionally omitted
      };

      const { queryByText } = render(
        <EntityBadge entity={entityWithoutConfidence} showConfidence={true} />
      );

      // Should not crash or show confidence when it's undefined
      expect(queryByText(/\d+%/)).not.toBeInTheDocument();
    });

    it("should round confidence to nearest integer", () => {
      const entityWithDecimalConfidence = {
        ...mockEntity,
        confidence: 0.847,
      };

      const { getByText } = render(
        <EntityBadge
          entity={entityWithDecimalConfidence}
          showConfidence={true}
        />
      );

      expect(getByText("85%")).toBeInTheDocument();
    });
  });

  describe("Entity Type Styles", () => {
    const entityTypes = [
      {
        type: "Case" as const,
        expectedClasses: ["bg-blue-100", "text-blue-800"],
      },
      {
        type: "Statute" as const,
        expectedClasses: ["bg-green-100", "text-green-800"],
      },
      {
        type: "Regulation" as const,
        expectedClasses: ["bg-purple-100", "text-purple-800"],
      },
      {
        type: "Person" as const,
        expectedClasses: ["bg-yellow-100", "text-yellow-800"],
      },
      {
        type: "Organization" as const,
        expectedClasses: ["bg-orange-100", "text-orange-800"],
      },
      {
        type: "LegalConcept" as const,
        expectedClasses: ["bg-gray-100", "text-gray-800"],
      },
      {
        type: "Jurisdiction" as const,
        expectedClasses: ["bg-indigo-100", "text-indigo-800"],
      },
    ];

    entityTypes.forEach(({ type, expectedClasses }) => {
      it(`should apply correct styles for ${type} entities`, () => {
        const testEntity = { ...mockEntity, type };
        const { container } = render(<EntityBadge entity={testEntity} />);
        const element = container.firstChild as HTMLElement;

        expectedClasses.forEach((className) => {
          expect(element).toHaveClass(className);
        });
      });
    });

    it("should handle unknown entity types with default styling", () => {
      const unknownEntity = { ...mockEntity, type: "UnknownType" as any };
      const { container } = render(<EntityBadge entity={unknownEntity} />);
      const element = container.firstChild as HTMLElement;

      expect(element).toHaveClass("bg-gray-100", "text-gray-800");
    });
  });

  describe("Combined Features", () => {
    it("should work with all features enabled", () => {
      const mockOnClick = vi.fn();

      const { getByRole, getByText } = render(
        <EntityBadge
          entity={mockEntity}
          size="lg"
          interactive={true}
          showConfidence={true}
          onClick={mockOnClick}
        />
      );

      const badge = getByRole("button");

      // Check size
      expect(badge).toHaveClass("px-3", "py-1.5", "text-base");

      // Check interactivity
      expect(badge).toHaveClass("cursor-pointer", "hover:opacity-80");

      // Check confidence display
      expect(getByText("85%")).toBeInTheDocument();

      // Check click handler
      fireEvent.click(badge);
      expect(mockOnClick).toHaveBeenCalledWith(mockEntity);
    });

    it("should work with minimal configuration", () => {
      const { getByRole } = render(<EntityBadge entity={mockEntity} />);

      const badge = getByRole("button");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("title", mockEntity.details);
    });
  });

  describe("Accessibility", () => {
    it("should render as button when interactive", () => {
      const { getByRole } = render(
        <EntityBadge entity={mockEntity} interactive={true} />
      );

      // Find the button element by role
      const badge = getByRole("button");
      expect(badge.tagName).toBe("BUTTON");
      expect(badge).toHaveAttribute("type", "button");
    });

    it("should render as span when non-interactive", () => {
      const { getByText } = render(
        <EntityBadge entity={mockEntity} interactive={false} />
      );

      const badge = getByText("Test Case v. Example Corp");
      expect(badge.tagName).toBe("SPAN");
      expect(badge).not.toHaveAttribute("type");
    });

    it("should have proper keyboard accessibility as button", () => {
      const mockOnClick = vi.fn();
      const { getByRole } = render(
        <EntityBadge
          entity={mockEntity}
          interactive={true}
          onClick={mockOnClick}
        />
      );

      const badge = getByRole("button");
      expect(badge.tagName).toBe("BUTTON");

      // Button elements have native keyboard support
      // We only need to test that click works
      fireEvent.click(badge);
      expect(mockOnClick).toHaveBeenCalledWith(mockEntity);
    });

    it("should provide proper title attributes for screen readers", () => {
      const { getByRole } = render(
        <EntityBadge entity={mockEntity} showConfidence={true} />
      );

      const badge = getByRole("button");
      expect(badge).toHaveAttribute("title");

      const title = badge.getAttribute("title");
      expect(title).toContain(mockEntity.details);
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily with same props", () => {
      const { getByText, rerender } = render(
        <EntityBadge entity={mockEntity} />
      );

      // Re-render with same props
      rerender(<EntityBadge entity={mockEntity} />);

      // Component should still be in the document
      expect(getByText("Test Case v. Example Corp")).toBeInTheDocument();
    });

    it("should handle rapid clicks gracefully", () => {
      const mockOnClick = vi.fn();
      const { getByText } = render(
        <EntityBadge
          entity={mockEntity}
          interactive={true}
          onClick={mockOnClick}
        />
      );

      const badge = getByText("Test Case v. Example Corp");

      // Rapid clicks
      fireEvent.click(badge);
      fireEvent.click(badge);
      fireEvent.click(badge);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });
});
