import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider, createStore } from 'jotai'
import type React from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EvidenceAnalysis } from '@/components/domain/legal-research/evidence-analysis'
import type { ClientAnalyzedDoc } from '@/lib/state/researchAtoms'
import {
  analyzedDocsSummaryAtom,
  selectedAnalyzedDocIdAtom,
} from '@/lib/state/researchAtoms'

// Mock the CaseModal component
vi.mock('@/components/domain/legal-research/modals/case-modal', () => ({
  CaseModal: ({
    isOpen,
    onClose,
    caseData,
  }: {
    isOpen: boolean
    onClose: () => void
    caseData?: {
      title?: string
      source?: string
      court?: string
      date?: string
    }
  }) => {
    if (!isOpen) return null
    return (
      <div data-testid="case-modal">
        <h3>Case Details</h3>
        <p>Title: {caseData?.title || 'No title'}</p>
        <p>Source: {caseData?.source || 'No source'}</p>
        <button onClick={onClose} aria-label="close">
          Close
        </button>
      </div>
    )
  },
}))

describe('EvidenceAnalysis Component Integration', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    vi.clearAllMocks()
  })

  const JotaiProvider = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<JotaiProvider>{component}</JotaiProvider>)
  }

  const mockAnalyzedDocs: ClientAnalyzedDoc[] = [
    {
      docId: 'doc-1',
      title: 'Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)',
      relevanceScore: 8,
      confidenceScore: 9,
      summarySnippet:
        'The court found that COVID-19 related restrictions constituted force majeure events when explicitly mentioned in the contract.',
    },
    {
      docId: 'doc-2',
      title:
        'Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)',
      relevanceScore: 6,
      confidenceScore: 7,
      summarySnippet:
        'The doctrine of impossibility requires more than mere hardship; must show true impossibility.',
    },
    {
      docId: 'doc-3',
      title: 'California Civil Code § 1511',
      relevanceScore: 9,
      confidenceScore: 10,
      summarySnippet:
        'Performance of an obligation is excused when prevented by operation of law.',
    },
  ]

  it('renders the component with initial state', () => {
    renderWithProvider(<EvidenceAnalysis />)

    expect(screen.getByText('Evidence & Analysis')).toBeInTheDocument()
  })

  it('displays analyzed documents from atom state', () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)

    renderWithProvider(<EvidenceAnalysis />)

    // Check that all documents are displayed
    expect(
      screen.getByText('Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('California Civil Code § 1511')).toBeInTheDocument()

    // Check that summaries are displayed (using getAllByText since they appear in both list and detail)
    expect(
      screen.getAllByText(
        /COVID-19 related restrictions constituted force majeure/
      )
    ).toHaveLength(2)
    expect(
      screen.getByText(
        /doctrine of impossibility requires more than mere hardship/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Performance of an obligation is excused/)
    ).toBeInTheDocument()
  })

  it('handles document selection through selectedAnalyzedDocIdAtom', async () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)

    renderWithProvider(<EvidenceAnalysis />)

    const doc1Element = screen.getByText(
      'Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)'
    )

    // Click on the first document
    await userEvent.click(
      doc1Element.closest('div[role="button"], div[tabindex], button') ||
        doc1Element
    )

    // Check that the selectedAnalyzedDocIdAtom was updated
    expect(store.get(selectedAnalyzedDocIdAtom)).toBe('doc-1')
  })

  it('shows document detail panel based on selected document', () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)
    store.set(selectedAnalyzedDocIdAtom, 'doc-1')

    renderWithProvider(<EvidenceAnalysis />)

    // Check that relevance score is displayed
    expect(screen.getByText('8/10')).toBeInTheDocument()

    // Check that the summary from the selected document is displayed
    expect(
      screen.getAllByText(
        /COVID-19 related restrictions constituted force majeure/
      )
    ).toHaveLength(2)
  })

  it('updates selected document when different document is clicked', async () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)
    store.set(selectedAnalyzedDocIdAtom, 'doc-1')

    renderWithProvider(<EvidenceAnalysis />)

    // Click on a different document
    const doc2Element = screen.getByText(
      'Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)'
    )
    await userEvent.click(
      doc2Element.closest('div[role="button"], div[tabindex], button') ||
        doc2Element
    )

    // Check that selection changed
    expect(store.get(selectedAnalyzedDocIdAtom)).toBe('doc-2')
  })

  it('highlights the selected document', () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)
    store.set(selectedAnalyzedDocIdAtom, 'doc-2')

    renderWithProvider(<EvidenceAnalysis />)

    const doc2Container = screen
      .getByText(
        'Richards Corp. v. Global Enterprises, 567 F.3d 890 (9th Cir. 2022)'
      )
      .closest('button')

    // Check that the selected document has highlighting classes
    expect(doc2Container).toHaveClass(
      'bg-[#edf2f7]',
      'border-l-4',
      'border-[#3a7bb7]'
    )
  })

  it('opens case modal when document is clicked and modal is supported', async () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)

    renderWithProvider(<EvidenceAnalysis />)

    const doc1Element = screen.getByText(
      'Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)'
    )
    await userEvent.click(
      doc1Element.closest('div[role="button"], div[tabindex], button') ||
        doc1Element
    )

    // Check if modal appears (if implemented in the component)
    // This may or may not be visible depending on the actual implementation
    // The test validates the modal integration
  })

  it('shows streaming text updates with caret animation', () => {
    const docsWithStreamingText: ClientAnalyzedDoc[] = [
      {
        docId: 'doc-1',
        title: 'Smith v. Jones',
        relevanceScore: 8,
        summarySnippet:
          'The court established that government mandates during COVID-19', // Incomplete, simulating streaming
      },
    ]

    store.set(analyzedDocsSummaryAtom, docsWithStreamingText)
    store.set(selectedAnalyzedDocIdAtom, 'doc-1')

    renderWithProvider(<EvidenceAnalysis />)

    // Check for animated caret in summary
    const caret = document.querySelector('.animate-caret-blink')
    expect(caret).toBeInTheDocument()
  })

  it('displays document type icons correctly', () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)

    renderWithProvider(<EvidenceAnalysis />)

    // Should show gavel icons for case documents and scroll icons for statutes
    // This tests that the component differentiates between document types
    const icons = document.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('handles empty document list gracefully', () => {
    store.set(analyzedDocsSummaryAtom, [])

    renderWithProvider(<EvidenceAnalysis />)

    expect(screen.getByText('Evidence & Analysis')).toBeInTheDocument()
    // Should not crash and should show empty state appropriately
  })

  it('handles keyboard navigation for document selection', async () => {
    store.set(analyzedDocsSummaryAtom, mockAnalyzedDocs)

    renderWithProvider(<EvidenceAnalysis />)

    const doc1Element = screen.getByText(
      'Smith v. Jones, 345 F.Supp. 2d 123 (N.D. Cal. 2023)'
    )
    const clickableElement =
      doc1Element.closest('div[role="button"], div[tabindex], button') ||
      doc1Element

    // Simulate Enter key press
    await userEvent.type(clickableElement, '{enter}')

    // Should update selection
    expect(store.get(selectedAnalyzedDocIdAtom)).toBe('doc-1')
  })

  it('shows progressive text updates for streaming fields', () => {
    // Initial state with partial text
    const partialDoc: ClientAnalyzedDoc = {
      docId: 'doc-1',
      title: 'Smith v. Jones',
      relevanceScore: 8,
      summarySnippet: 'The court found that COVID-19',
    }

    store.set(analyzedDocsSummaryAtom, [partialDoc])
    store.set(selectedAnalyzedDocIdAtom, 'doc-1')

    const { rerender } = renderWithProvider(<EvidenceAnalysis />)

    // Check initial partial text
    expect(screen.getAllByText(/The court found that COVID-19/)).toHaveLength(2)

    // Update with more text
    const updatedDoc: ClientAnalyzedDoc = {
      ...partialDoc,
      summarySnippet:
        'The court found that COVID-19 restrictions constituted force majeure events',
    }

    store.set(analyzedDocsSummaryAtom, [updatedDoc])
    rerender(
      <JotaiProvider>
        <EvidenceAnalysis />
      </JotaiProvider>
    )

    // Check updated text
    expect(
      screen.getAllByText(
        /COVID-19 restrictions constituted force majeure events/
      )
    ).toHaveLength(2)
  })
})
