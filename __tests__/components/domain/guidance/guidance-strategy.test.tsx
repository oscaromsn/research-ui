import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider, createStore } from 'jotai'
import type React from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GuidanceStrategy } from '@/components/domain/guidance/guidance-strategy'
import { useResearchAgent } from '@/lib/hooks/useResearchAgent'
import {
  generatedQueriesAtom,
  researchAssessmentAtom,
  researchLogAtom,
} from '@/lib/state/researchAtoms'
import type { ClientResearchAssessment } from '@/lib/state/researchAtoms'

// Mock the useResearchAgent hook
vi.mock('@/lib/hooks/useResearchAgent', () => ({
  useResearchAgent: vi.fn(),
}))

describe('GuidanceStrategy Component Integration', () => {
  let store: ReturnType<typeof createStore>
  let mockStartResearch: ReturnType<typeof vi.fn>
  let mockAbortResearch: ReturnType<typeof vi.fn>
  let mockUseResearchAgent: ReturnType<typeof vi.fn>

  beforeEach(() => {
    store = createStore()
    mockStartResearch = vi.fn()
    mockAbortResearch = vi.fn()
    mockUseResearchAgent = vi.mocked(useResearchAgent)

    vi.clearAllMocks()

    // Set default mock return value
    mockUseResearchAgent.mockReturnValue({
      startResearch: mockStartResearch,
      resumeResearch: vi.fn(),
      pauseResearch: vi.fn(),
      abortResearch: mockAbortResearch,
      isLoading: false,
      currentStage: 'IDLE',
      currentMessage: 'Ready to start research.',
      error: null,
      isPaused: false,
      canResume: false,
      autoModeEnabled: false,
      toggleAutoMode: vi.fn(),
    })
  })

  const JotaiProvider = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  )

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<JotaiProvider>{component}</JotaiProvider>)
  }

  it('renders the component with initial state', () => {
    renderWithProvider(<GuidanceStrategy />)

    expect(screen.getByText('Guidance & Strategy')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter Legal Question or Research Topic')
    ).toBeInTheDocument()
    expect(screen.getByText('Start Research')).toBeInTheDocument()
  })

  it('captures and submits legal question through useResearchAgent', async () => {
    renderWithProvider(<GuidanceStrategy />)

    const input = screen.getByPlaceholderText(
      'Enter Legal Question or Research Topic'
    )
    const startButton = screen.getByText('Start Research')

    // Type legal question
    await userEvent.clear(input)
    await userEvent.type(
      input,
      'What are the implications of force majeure during COVID-19?'
    )

    // Click start research
    await userEvent.click(startButton)

    // Verify the hook was called with the question
    expect(mockStartResearch).toHaveBeenCalledWith(
      'What are the implications of force majeure during COVID-19?'
    )
  })

  it('displays generated queries from atom state', () => {
    // Pre-populate the store with generated queries
    store.set(generatedQueriesAtom, [
      {
        query_string: '"force majeure" AND "COVID-19" AND "contract breach"',
        expected_information_summary:
          'Cases and precedents related to force majeure during pandemic',
      },
      {
        query_string: '"impossibility" AND "performance excuse" AND "pandemic"',
        expected_information_summary:
          'Legal doctrine of impossibility in pandemic context',
      },
    ])

    renderWithProvider(<GuidanceStrategy />)

    // Check that the first query is displayed
    expect(
      screen.getByText('"force majeure" AND "COVID-19" AND "contract breach"')
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Cases and precedents related to force majeure during pandemic'
      )
    ).toBeInTheDocument()
  })

  it('disables input and shows status during loading state', () => {
    // Mock loading state
    mockUseResearchAgent.mockReturnValue({
      startResearch: mockStartResearch,
      resumeResearch: vi.fn(),
      pauseResearch: vi.fn(),
      abortResearch: mockAbortResearch,
      isLoading: true,
      currentStage: 'GENERATING_QUERIES',
      currentMessage: 'Generating search queries...',
      error: null,
      isPaused: false,
      canResume: false,
      autoModeEnabled: false,
      toggleAutoMode: vi.fn(),
    })

    renderWithProvider(<GuidanceStrategy />)

    const input = screen.getByPlaceholderText(
      'Enter Legal Question or Research Topic'
    )

    expect(input).toBeDisabled()
    expect(screen.queryByText('Start Research')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Processing: GENERATING_QUERIES - Generating search queries...'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('Pause')).toBeInTheDocument()
    expect(screen.getByText('Abort')).toBeInTheDocument()
  })

  it('shows abort button during loading and calls abortResearch', async () => {
    // Mock loading state
    mockUseResearchAgent.mockReturnValue({
      startResearch: mockStartResearch,
      resumeResearch: vi.fn(),
      pauseResearch: vi.fn(),
      abortResearch: mockAbortResearch,
      isLoading: true,
      currentStage: 'ANALYZING_DOCUMENTS',
      currentMessage: 'Analyzing retrieved documents...',
      error: null,
      isPaused: false,
      canResume: false,
      autoModeEnabled: false,
      toggleAutoMode: vi.fn(),
    })

    renderWithProvider(<GuidanceStrategy />)

    const abortButton = screen.getByText('Abort')
    await userEvent.click(abortButton)

    expect(mockAbortResearch).toHaveBeenCalled()
  })

  it('displays error state from useResearchAgent', () => {
    // Mock error state
    mockUseResearchAgent.mockReturnValue({
      startResearch: mockStartResearch,
      resumeResearch: vi.fn(),
      pauseResearch: vi.fn(),
      abortResearch: mockAbortResearch,
      isLoading: false,
      currentStage: 'ERROR',
      currentMessage: null,
      error: 'Failed to connect to document search service',
      isPaused: false,
      canResume: false,
      autoModeEnabled: false,
      toggleAutoMode: vi.fn(),
    })

    renderWithProvider(<GuidanceStrategy />)

    expect(
      screen.getByText('Error: Failed to connect to document search service')
    ).toBeInTheDocument()
  })

  it('displays research logs from atom state', () => {
    // Pre-populate the store with logs
    store.set(researchLogAtom, [
      'Starting research for legal question',
      'Generated 3 search queries',
      'Retrieved 15 documents',
      'Analyzing document relevance...',
    ])

    renderWithProvider(<GuidanceStrategy />)

    expect(screen.getByText('Research Logs (4)')).toBeInTheDocument()
    expect(
      screen.getByText(/Starting research for legal question/)
    ).toBeInTheDocument()
    expect(screen.getByText(/Generated 3 search queries/)).toBeInTheDocument()
    expect(screen.getByText(/Retrieved 15 documents/)).toBeInTheDocument()
    expect(
      screen.getByText(/Analyzing document relevance.../)
    ).toBeInTheDocument()
  })

  it('prevents submission with empty legal question', async () => {
    renderWithProvider(<GuidanceStrategy />)

    const input = screen.getByPlaceholderText(
      'Enter Legal Question or Research Topic'
    )
    const startButton = screen.getByText('Start Research')

    // Ensure input is empty
    await userEvent.clear(input)

    // Click start research
    await userEvent.click(startButton)

    // Verify the hook was not called
    expect(mockStartResearch).not.toHaveBeenCalled()
  })

  it('toggles assessment section visibility', async () => {
    // Set up mock assessment data
    const mockAssessment: ClientResearchAssessment = {
      isSufficient: false,
      assessmentSummary:
        'Current analysis needs additional case law from jurisdiction.',
      identifiedGaps: [
        'Missing 9th Circuit precedents',
        'Lack of recent rulings',
      ],
      nextAction: 'REFINE_QUERIES',
      suggestedRefinementQueries: [
        {
          query_string: '9th Circuit force majeure',
          expected_information_summary: 'Jurisdiction-specific cases',
        },
      ],
      reasoningSummary: 'Assessment reasoning summary',
    }
    store.set(researchAssessmentAtom, mockAssessment)

    renderWithProvider(<GuidanceStrategy />)

    // Assessment section should be visible but details not expanded initially
    expect(screen.getByText(/Agent Assessment/)).toBeInTheDocument()
    expect(screen.queryByText('Identified Gaps:')).not.toBeInTheDocument()

    // Click to expand
    const assessmentButton = screen.getByRole('button', {
      name: /Agent Assessment/,
    })
    await userEvent.click(assessmentButton)

    // Now the expanded content should be visible
    expect(screen.getByText('Identified Gaps:')).toBeInTheDocument()
    expect(screen.getByText('Suggested Query Refinements:')).toBeInTheDocument()
    expect(screen.getByText('Next Action: REFINE QUERIES')).toBeInTheDocument()

    // Click again to collapse
    await userEvent.click(assessmentButton)

    // Expanded content should be hidden again
    expect(screen.queryByText('Identified Gaps:')).not.toBeInTheDocument()
  })

  it('does not render assessment section when no assessment data', () => {
    // Ensure assessment atom is null (default state)
    store.set(researchAssessmentAtom, null)

    renderWithProvider(<GuidanceStrategy />)

    // Assessment section should not be visible
    expect(screen.queryByText(/Agent Assessment/)).not.toBeInTheDocument()
    expect(screen.queryByText('Identified Gaps:')).not.toBeInTheDocument()
  })
})
