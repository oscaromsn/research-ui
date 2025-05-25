import { ReportDrafter } from '@/components/domain/report-generation/report-drafter';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { Provider, createStore } from 'jotai';
import { createElement, ReactNode } from 'react';
import { finalReportContentAtom } from '@/lib/state/researchAtoms';
import type { ClientFinalReport } from '@/lib/state/researchAtoms';

describe('ReportDrafter Component Integration', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  const JotaiProvider = ({ children }: { children: ReactNode }) => 
    createElement(Provider, { store }, children);

  const renderWithProvider = (component: React.ReactElement) => {
    return render(createElement(JotaiProvider, { children: component }));
  };

  const mockReportData: ClientFinalReport = {
    title: 'Force Majeure Analysis in COVID-19 Context',
    executiveSummary: 'This report analyzes the legal framework surrounding force majeure clauses in the context of COVID-19 pandemic disruptions. The analysis focuses on three key areas: contractual interpretation, judicial precedents, and practical application.',
    sections: [
      {
        title: 'Background', 
        content: 'Under traditional contract law, force majeure clauses excuse performance when extraordinary circumstances beyond parties\' control make performance impossible or impracticable.'
      },
      {
        title: 'Legal Analysis',
        content: 'The analysis reveals that courts have taken varying approaches to force majeure clauses during the pandemic, with emphasis on specific contractual language and foreseeability.'
      },
      {
        title: 'Recommendations',
        content: 'Recent decisions demonstrate a trend toward strict interpretation of force majeure language, requiring explicit mention of pandemic-type events.'
      }
    ],
    conclusion: 'The legal landscape surrounding force majeure during COVID-19 continues to evolve, with courts emphasizing the importance of specific contractual language.',
    limitations: [
      'Analysis limited to federal court decisions',
      'State-specific variations not comprehensively covered'
    ],
    appendixDocIds: ['DocID-001', 'DocID-002', 'DocID-003']
  };

  it('renders the component with initial state', () => {
    renderWithProvider(createElement(ReportDrafter));

    expect(screen.getByText('Document Structure')).toBeInTheDocument();
    // Should show action buttons
    expect(screen.getAllByRole('button')).toHaveLength(3); // Save, Download, Share
  });

  it('displays report title from atom state', () => {
    store.set(finalReportContentAtom, mockReportData);

    renderWithProvider(createElement(ReportDrafter));

    expect(screen.getByDisplayValue('Force Majeure Analysis in COVID-19 Context')).toBeInTheDocument();
  });

  it('allows editing the report title', async () => {
    store.set(finalReportContentAtom, mockReportData);

    renderWithProvider(createElement(ReportDrafter));
    
    const titleInput = screen.getByDisplayValue('Force Majeure Analysis in COVID-19 Context');
    
    // Edit the title
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Report Title');
    
    // Check if the title was updated
    expect(titleInput).toHaveValue('Updated Report Title');
  });

  it('displays executive summary from atom state', () => {
    store.set(finalReportContentAtom, mockReportData);

    renderWithProvider(createElement(ReportDrafter));

    expect(screen.getByText(/This report analyzes the legal framework surrounding force majeure clauses/)).toBeInTheDocument();
  });

  it('displays report sections from atom state', () => {
    store.set(finalReportContentAtom, mockReportData);

    renderWithProvider(createElement(ReportDrafter));

    // Check section titles in document structure (use more specific selectors)
    const docStructure = screen.getByText('Document Structure').closest('div');
    expect(within(docStructure!).getByText('Executive Summary')).toBeInTheDocument();
    expect(within(docStructure!).getByText('Background')).toBeInTheDocument();
    expect(within(docStructure!).getByText('Legal Analysis')).toBeInTheDocument();
    expect(within(docStructure!).getByText('Recommendations')).toBeInTheDocument();

    // Check section content in main area
    expect(screen.getByText(/The analysis reveals that courts have taken varying approaches/)).toBeInTheDocument();
    expect(screen.getByText(/Under traditional contract law, force majeure clauses excuse performance/)).toBeInTheDocument();
  });

  it('displays conclusion from atom state', () => {
    store.set(finalReportContentAtom, mockReportData);

    renderWithProvider(createElement(ReportDrafter));

    expect(screen.getByText(/The legal landscape surrounding force majeure during COVID-19 continues to evolve/)).toBeInTheDocument();
  });

  it('shows streaming text updates with caret animation', () => {
    const streamingReport: ClientFinalReport = {
      title: 'Contract Analysis Report',
      executiveSummary: 'This analysis examines contractual obligations during unprecedented circumstances', // Incomplete, simulating streaming
      sections: [
        {
          title: 'Analysis',
          content: 'Courts have consistently held that force majeure clauses require' // Incomplete content
        }
      ],
      conclusion: 'The implications for future contract interpretation are', // Incomplete conclusion
      limitations: [],
      appendixDocIds: []
    };

    store.set(finalReportContentAtom, streamingReport);

    renderWithProvider(createElement(ReportDrafter));

    // Check for animated caret in streaming text
    const carets = document.querySelectorAll('.animate-caret-blink');
    expect(carets.length).toBeGreaterThan(0);
  });

  it('shows document structure with completion status', () => {
    const partialReport: ClientFinalReport = {
      title: 'Test Report',
      executiveSummary: 'Complete executive summary content here.',
      sections: [
        {
          title: 'Background',
          content: 'Complete background content.'
        },
        {
          title: 'Legal Analysis', 
          content: '' // Incomplete section
        }
      ],
      conclusion: '', // Incomplete conclusion
      limitations: [],
      appendixDocIds: []
    };

    store.set(finalReportContentAtom, partialReport);

    renderWithProvider(createElement(ReportDrafter));

    // Check that completed sections have different styling than incomplete ones
    const docStructure = screen.getByText('Document Structure').closest('div');
    const backgroundSection = within(docStructure!).getByText('Background').closest('div[class*="p-2"]');
    const legalAnalysisSection = within(docStructure!).getByText('Legal Analysis').closest('div[class*="p-2"]');
    const executiveSummarySection = within(docStructure!).getByText('Executive Summary').closest('div[class*="p-2"]');
    
    expect(backgroundSection).toHaveClass('bg-[#f1f5f9]'); // Completed style (has content)
    expect(legalAnalysisSection).not.toHaveClass('bg-[#f1f5f9]'); // Incomplete style (empty content)
    expect(executiveSummarySection).toHaveClass('bg-[#f1f5f9]'); // Completed style (has executiveSummary)
  });

  it('handles empty report data gracefully', () => {
    const emptyReport: ClientFinalReport = {
      title: '',
      executiveSummary: '',
      sections: [],
      conclusion: '',
      limitations: [],
      appendixDocIds: []
    };

    store.set(finalReportContentAtom, emptyReport);

    renderWithProvider(createElement(ReportDrafter));

    expect(screen.getByText('Document Structure')).toBeInTheDocument();
    // Should show default title input or placeholder
    const titleInput = screen.getByRole('textbox');
    expect(titleInput).toBeInTheDocument();
  });

  it('shows progressive content updates for streaming fields', () => {
    // Initial state with partial content
    const partialReport: ClientFinalReport = {
      title: 'Contract Report',
      executiveSummary: 'This report examines',
      sections: [
        {
          title: 'Analysis',
          content: 'Legal precedents show'
        }
      ],
      conclusion: 'In conclusion',
      limitations: [],
      appendixDocIds: []
    };

    store.set(finalReportContentAtom, partialReport);

    const { rerender } = renderWithProvider(createElement(ReportDrafter));

    // Check initial partial content
    expect(screen.getByText(/This report examines/)).toBeInTheDocument();
    expect(screen.getByText(/Legal precedents show/)).toBeInTheDocument();

    // Update with more complete content
    const updatedReport: ClientFinalReport = {
      ...partialReport,
      executiveSummary: 'This report examines comprehensive legal principles governing contract interpretation during extraordinary circumstances.',
      sections: [
        {
          title: 'Analysis',
          content: 'Legal precedents show clear patterns in judicial interpretation of force majeure clauses during pandemic conditions.'
        }
      ],
      conclusion: 'In conclusion, contract law continues to evolve in response to unprecedented global events.'
    };

    act(() => {
      store.set(finalReportContentAtom, updatedReport);
    });
    
    rerender(createElement(JotaiProvider, { children: createElement(ReportDrafter) }));

    // Check updated content
    expect(screen.getByText(/comprehensive legal principles governing contract interpretation/)).toBeInTheDocument();
    expect(screen.getByText(/clear patterns in judicial interpretation of force majeure clauses/)).toBeInTheDocument();
    expect(screen.getByText(/contract law continues to evolve in response to unprecedented global events/)).toBeInTheDocument();
  });

  it('displays action buttons (save, download, share)', () => {
    renderWithProvider(createElement(ReportDrafter));

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    // Check that buttons have appropriate hover classes
    const buttonWithHoverClass = buttons.filter(btn => 
      btn.className.includes('hover:bg-[#f1f5f9]')
    );
    expect(buttonWithHoverClass.length).toBeGreaterThanOrEqual(3);
  });

  it('handles sections completion tracking', () => {
    const reportWithMixedSections: ClientFinalReport = {
      title: 'Test Report',
      executiveSummary: 'Complete summary',
      sections: [
        {
          title: 'Background',
          content: 'Complete background content'
        },
        {
          title: 'Legal Analysis',
          content: '' // Incomplete
        },
        {
          title: 'Recommendations',
          content: 'Complete recommendations'
        }
      ],
      conclusion: 'Final conclusion',
      limitations: [],
      appendixDocIds: []
    };

    store.set(finalReportContentAtom, reportWithMixedSections);

    renderWithProvider(createElement(ReportDrafter));

    // Use document structure area specifically to avoid conflicts with content area
    const docStructure = screen.getByText('Document Structure').closest('div');
    const backgroundSection = within(docStructure!).getByText('Background').closest('div[class*="p-2"]');
    const legalAnalysisSection = within(docStructure!).getByText('Legal Analysis').closest('div[class*="p-2"]');
    const recommendationsSection = within(docStructure!).getByText('Recommendations').closest('div[class*="p-2"]');
    const conclusionSection = within(docStructure!).getByText('Conclusion').closest('div[class*="p-2"]');
    
    // Check styling based on completion status
    expect(backgroundSection).toHaveClass('bg-[#f1f5f9]'); // Complete (has content)
    expect(legalAnalysisSection).not.toHaveClass('bg-[#f1f5f9]'); // Incomplete (empty content)
    expect(recommendationsSection).toHaveClass('bg-[#f1f5f9]'); // Complete (has content)
    expect(conclusionSection).toHaveClass('bg-[#f1f5f9]'); // Complete (has conclusion field content)
  });
});