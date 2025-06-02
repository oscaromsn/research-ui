import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CaseModal } from "@/components/domain/legal-research/modals/case-modal"
import type { ClientAnalyzedDoc } from "@/lib/state/researchAtoms"

// Mock the Modal component
vi.mock("@/components/ui/modal", () => ({
  Modal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
  }) => {
    if (!isOpen) {
      return null
    }
    return (
      <div data-testid="modal-container">
        <div data-testid="modal-title">{title}</div>
        <button
          type="button"
          onClick={onClose}
          data-testid="modal-close-button"
        >
          Close
        </button>
        <div data-testid="modal-content">{children}</div>
      </div>
    )
  },
}))

describe("CaseModal Component", () => {
  const mockDocumentData: ClientAnalyzedDoc = {
    docId: "doc-123",
    title: "Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)",
    url: "https://westlaw.com/doc/123",
    relevanceScore: 8.5,
    confidenceScore: 0.9,
    summarySnippet:
      "This case discusses force majeure clauses in contracts during the pandemic.",
    keyArguments: [
      "Force majeure clauses must explicitly mention pandemic-related events",
      "Government mandates may constitute qualifying events",
      "Mere economic hardship insufficient for impossibility defense",
    ],
    extractedEntities: [
      {
        name: "N.D. Cal.",
        type: "Jurisdiction",
        details: "Northern District of California",
      },
      { name: "Smith v. Jones", type: "Case", details: "Legal case" },
    ],
    extractedQuotes: [
      "The court held that force majeure clauses must be interpreted narrowly.",
      "Economic hardship alone does not trigger impossibility doctrine.",
    ],
    fullText:
      "The court, in considering the application of force majeure provisions in the context of the COVID-19 pandemic, held that such clauses must be interpreted narrowly and in accordance with their explicit terms. Furthermore, the mere existence of economic hardship, without more, does not trigger the doctrine of impossibility.",
    timestamp: "2023-11-15T10:30:00Z",
  }

  it("renders when isOpen is true", () => {
    render(
      <CaseModal
        isOpen={true}
        onClose={vi.fn()}
        documentData={mockDocumentData}
      />
    )

    // Check title is passed to Modal
    expect(screen.getByTestId("modal-title")).toHaveTextContent(
      mockDocumentData.title || ""
    )

    // Check content is rendered
    const content = screen.getByTestId("modal-content")
    expect(content).toBeInTheDocument()

    // Check if document metadata is rendered
    expect(content).toHaveTextContent("Case") // Document type
    expect(content).toHaveTextContent("N.D. Cal.") // Jurisdiction
    expect(content).toHaveTextContent("Relevance: 85%") // Relevance score
  })

  it("does not render when isOpen is false", () => {
    render(
      <CaseModal
        isOpen={false}
        onClose={vi.fn()}
        documentData={mockDocumentData}
      />
    )

    // Modal shouldn't render anything when closed
    expect(screen.queryByTestId("modal-container")).not.toBeInTheDocument()
  })

  it("calls onClose when close button is clicked", async () => {
    const onCloseMock = vi.fn()

    render(
      <CaseModal
        isOpen={true}
        onClose={onCloseMock}
        documentData={mockDocumentData}
      />
    )

    // Click the close button
    await userEvent.click(screen.getByTestId("modal-close-button"))

    // Check that onClose was called
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it("renders all document content sections", () => {
    render(
      <CaseModal
        isOpen={true}
        onClose={vi.fn()}
        documentData={mockDocumentData}
      />
    )

    // Check main sections that should be rendered with data
    expect(screen.getByText("Key Arguments & Reasoning")).toBeInTheDocument()
    expect(screen.getByText("Key Quotes")).toBeInTheDocument()
    expect(screen.getByText("Summary")).toBeInTheDocument()

    // Check key arguments
    expect(
      screen.getByText(
        "Force majeure clauses must explicitly mention pandemic-related events"
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText("Government mandates may constitute qualifying events")
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        "Mere economic hardship insufficient for impossibility defense"
      )
    ).toBeInTheDocument()

    // Check quotes
    expect(
      screen.getByText(
        /The court held that force majeure clauses must be interpreted narrowly/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Economic hardship alone does not trigger impossibility doctrine/
      )
    ).toBeInTheDocument()

    // Check summary
    expect(
      screen.getByText(
        /This case discusses force majeure clauses in contracts during the pandemic/
      )
    ).toBeInTheDocument()

    // Check action button - original source link
    expect(screen.getByText("View Original Source")).toBeInTheDocument()
  })

  it("handles incomplete documentData gracefully", () => {
    // Render with minimal documentData
    const minimalData: ClientAnalyzedDoc = {
      docId: "minimal-123",
      title: "Minimal Case",
    }

    render(
      <CaseModal isOpen={true} onClose={vi.fn()} documentData={minimalData} />
    )

    // Title should be displayed
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Minimal Case")

    // Should show default values for missing data
    const content = screen.getByTestId("modal-content")
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent("Case") // Document type for "Minimal Case" (contains "case")
    expect(content).toHaveTextContent("Jurisdiction not specified")
    expect(content).toHaveTextContent("Date not available")
  })
})
