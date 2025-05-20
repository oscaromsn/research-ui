import { ReportDrafter } from '@/components/domain/report-generation/report-drafter';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('ReportDrafter Component', () => {
  it('renders with expected content', () => {
    render(<ReportDrafter />);

    // Check title (input field with default value)
    expect(screen.getByDisplayValue('Maritime Salvage Rights Analysis')).toBeInTheDocument();
    
    // Check document structure section
    expect(screen.getByText('Document Structure')).toBeInTheDocument();
    
    // Check content of the document
    expect(screen.getByText(/This report analyzes the legal framework surrounding maritime salvage rights/)).toBeInTheDocument();
    expect(screen.getByText(/The case involves complex questions of maritime salvage rights/)).toBeInTheDocument();
  });

  it('has editable title field', async () => {
    render(<ReportDrafter />);
    
    const titleInput = screen.getByDisplayValue('Maritime Salvage Rights Analysis');
    
    // Edit the title
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'New Report Title');
    
    // Check if the title was updated
    expect(titleInput).toHaveValue('New Report Title');
  });

  it('contains document sections', () => {
    render(<ReportDrafter />);
    
    // Check if specific section items are in the document using getAllByText
    const execSummary = screen.getAllByText('Executive Summary')[0];
    const background = screen.getAllByText('Background')[0];
    const legalAnalysis = screen.getByText('Legal Analysis');
    const recommendations = screen.getByText('Recommendations');
    const conclusion = screen.getByText('Conclusion');
    
    // Verify the elements exist
    expect(execSummary).toBeInTheDocument();
    expect(background).toBeInTheDocument();
    expect(legalAnalysis).toBeInTheDocument();
    expect(recommendations).toBeInTheDocument();
    expect(conclusion).toBeInTheDocument();
    
    // Get the parent elements that have the cursor-pointer class
    const execSummarySection = execSummary.closest('div[class*="cursor-pointer"]');
    const backgroundSection = background.closest('div[class*="cursor-pointer"]');
    const legalAnalysisSection = legalAnalysis.closest('div[class*="cursor-pointer"]');
    
    // Verify sections have the correct styling
    expect(execSummarySection).toHaveClass('bg-[#f1f5f9]');
    expect(backgroundSection).toHaveClass('bg-[#f1f5f9]');
    // Incomplete sections should not have the bg-[#f1f5f9] class
    expect(legalAnalysisSection).not.toHaveClass('bg-[#f1f5f9]');
  });

  it('has action buttons', () => {
    render(<ReportDrafter />);
    
    // Find the buttons by their containing SVGs
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3); // At least Save, Download, Share
    
    // Make sure they have the correct hover classes
    const buttonWithHoverClass = buttons.filter(btn => 
      btn.className.includes('hover:bg-[#f1f5f9]')
    );
    expect(buttonWithHoverClass.length).toBeGreaterThanOrEqual(3);
  });
});