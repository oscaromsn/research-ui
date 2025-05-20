import { GuidanceStrategy } from '@/components/domain/guidance/guidance-strategy';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

describe('GuidanceStrategy Component', () => {
  it('renders the component with default state', () => {
    render(<GuidanceStrategy />);

    // Check heading
    expect(screen.getByText('Guidance & Strategy')).toBeInTheDocument();
    
    // Check input for legal question
    expect(screen.getByPlaceholderText('Enter Legal Question or Research Topic')).toBeInTheDocument();
    
    // Check jurisdiction tags
    expect(screen.getByText('Jurisdiction: Federal')).toBeInTheDocument();
    expect(screen.getByText('Jurisdiction: California')).toBeInTheDocument();
    
    // Check start research button
    expect(screen.getByText('Start Research')).toBeInTheDocument();
    
    // Check search query item section
    expect(screen.getByText('Search Query Item')).toBeInTheDocument();
    
    // Check the displayed search query
    expect(screen.getByText(/"contract breach" AND \("force majeure" OR "impossibility"\) NEAR\/5 "COVID-19"/)).toBeInTheDocument();
    
    // Check expected information
    expect(screen.getByText('Expected Information:')).toBeInTheDocument();
    expect(screen.getByText('Precedent cases and rulings')).toBeInTheDocument();
    expect(screen.getByText('Applicable legal framework')).toBeInTheDocument();
    
    // Check assessment section
    expect(screen.getByText('Agent Assessment')).toBeInTheDocument();
    expect(screen.getByText('Further Action Needed ⚠️')).toBeInTheDocument();
  });

  it('toggles the assessment section when clicked', async () => {
    render(<GuidanceStrategy />);

    // Assessment details should not be visible initially
    expect(screen.queryByText('Suggested Actions:')).not.toBeInTheDocument();
    
    // Click to expand
    await userEvent.click(screen.getByText('Agent Assessment'));
    
    // Now the expanded content should be visible
    expect(screen.getByText('Suggested Actions:')).toBeInTheDocument();
    expect(screen.getByText(/Add "JURISDICTION: '9th Circuit'" to search parameters/)).toBeInTheDocument();
    expect(screen.getByText(/Review cases from 2019-2023 specifically addressing force majeure/)).toBeInTheDocument();
    expect(screen.getByText(/Analyze district court interpretations of "unforeseen circumstances"/)).toBeInTheDocument();
    expect(screen.getByText('Impact on Analysis:')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('View Assessment Reasoning')).toBeInTheDocument();
    
    // Click again to collapse
    await userEvent.click(screen.getByText('Agent Assessment'));
    
    // Expanded content should be hidden again
    expect(screen.queryByText('Suggested Actions:')).not.toBeInTheDocument();
  });

  it('has a working input field for legal question', async () => {
    render(<GuidanceStrategy />);
    
    const input = screen.getByPlaceholderText('Enter Legal Question or Research Topic');
    
    // Type in the input
    await userEvent.clear(input);
    await userEvent.type(input, 'New legal question');
    
    // Check that the input value changed
    expect(input).toHaveValue('New legal question');
  });

  it('has a clickable Start Research button', async () => {
    render(<GuidanceStrategy />);
    
    const button = screen.getByText('Start Research');
    
    // Verify button is clickable (we don't need to test the implementation)
    expect(button).not.toBeDisabled();
    
    // We can't easily test if onClick works without mocking it,
    // but we can ensure it's a button type that can be clicked
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
  });
});