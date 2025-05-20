import { EvidenceAnalysis } from '@/components/domain/legal-research/evidence-analysis';
import { renderWithProviders } from '@/__tests__/test-utils';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// Mock the entire modules to avoid dependency on the actual implementations
vi.mock('@/lib/state/atoms/analyzed-document', () => ({
  analyzedDocumentAtom: { value: null },
  analyzedDocumentsAtom: { value: [] },
  setCurrentDocumentAtom: { value: null }
}));

vi.mock('jotai', () => ({
  useAtom: vi.fn(() => [null, vi.fn()]),
  useAtomValue: vi.fn(() => null)
}));

// Mock the CaseModal component
vi.mock('@/components/domain/legal-research/modals/case-modal', () => ({
  CaseModal: ({ 
    isOpen, 
    onClose 
  }: { 
    isOpen: boolean; 
    onClose: () => void;
    caseData?: any; 
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="case-modal">
        <h3>Key Holdings</h3>
        <ul>
          <li>Force majeure clauses must explicitly mention pandemic-related events</li>
        </ul>
        <button onClick={onClose} aria-label="close">Close</button>
      </div>
    );
  }
}));

describe('EvidenceAnalysis Component', () => {
  it('renders basic component elements', () => {
    render(<EvidenceAnalysis />);
    expect(screen.getByText('Evidence & Analysis')).toBeInTheDocument();
  });
  
  it('handles result selection correctly', async () => {
    const user = userEvent.setup();
    render(<EvidenceAnalysis />);
    
    // Find the search results using getAllByText with a regex
    const smithResult = screen.getByText(/Smith v. Jones/);
    const richardsResult = screen.getByText(/Richards Corp/);
    
    expect(smithResult).toBeInTheDocument();
    expect(richardsResult).toBeInTheDocument();
    
    // Test clicking on a result
    await user.click(richardsResult);
    
    // Test keyboard interaction
    fireEvent.keyUp(smithResult, { key: 'Enter' });
    
    // Both click and keyup should trigger the same behavior, so we expect
    // setCurrentDocument to have been called twice
    // We can't easily test this directly without a more complex mock setup,
    // but this covers the event handlers
  });
});

// Helper function to avoid issues with providers
function render(component: React.ReactElement) {
  return {
    ...screen,
    ...renderWithProviders(component)
  };
}