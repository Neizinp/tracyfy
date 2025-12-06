import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnSelector } from '../ColumnSelector';
import type { ColumnVisibility } from '../../types';

describe('ColumnSelector', () => {
  const mockOnColumnVisibilityChange = vi.fn();

  const defaultColumns: ColumnVisibility = {
    idTitle: true,
    description: true,
    text: true,
    rationale: true,
    author: true,
    verification: true,
    priority: true,
    status: true,
    comments: true,
    created: true,
    approved: true,
  };

  const defaultProps = {
    visibleColumns: defaultColumns,
    onColumnVisibilityChange: mockOnColumnVisibilityChange,
  };

  beforeEach(() => {
    mockOnColumnVisibilityChange.mockClear();
  });

  it('should render columns button', () => {
    render(<ColumnSelector {...defaultProps} />);

    expect(screen.getByText('Columns')).toBeInTheDocument();
    expect(screen.getByTitle('Toggle column visibility')).toBeInTheDocument();
  });

  it('should toggle dropdown on button click', () => {
    render(<ColumnSelector {...defaultProps} />);

    const button = screen.getByText('Columns');

    // Initially closed
    expect(screen.queryByText('ID / Title')).not.toBeInTheDocument();

    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByText('ID / Title')).toBeInTheDocument();

    // Close dropdown
    fireEvent.click(button);
    expect(screen.queryByText('ID / Title')).not.toBeInTheDocument();
  });

  it('should display all column options when open', () => {
    render(<ColumnSelector {...defaultProps} />);

    fireEvent.click(screen.getByText('Columns'));

    expect(screen.getByText('ID / Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Requirement Text')).toBeInTheDocument();
    expect(screen.getByText('Rationale')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Verification')).toBeInTheDocument();
    expect(screen.getByText('Priority')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should show checked state for visible columns', () => {
    render(<ColumnSelector {...defaultProps} />);

    fireEvent.click(screen.getByText('Columns'));

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it('should toggle column visibility when checkbox is clicked', () => {
    render(<ColumnSelector {...defaultProps} />);

    fireEvent.click(screen.getByText('Columns'));

    const descriptionLabel = screen.getByText('Description');
    fireEvent.click(descriptionLabel);

    expect(mockOnColumnVisibilityChange).toHaveBeenCalledWith({
      ...defaultColumns,
      description: false,
    });
  });

  it('should not allow toggling ID/Title column', () => {
    render(<ColumnSelector {...defaultProps} />);

    fireEvent.click(screen.getByText('Columns'));

    const idTitleLabel = screen.getByText('ID / Title');
    fireEvent.click(idTitleLabel);

    // Should not call onChange for ID/Title
    expect(mockOnColumnVisibilityChange).not.toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', () => {
    render(
      <div>
        <ColumnSelector {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    // Open dropdown
    fireEvent.click(screen.getByText('Columns'));
    expect(screen.getByText('ID / Title')).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId('outside'));

    // Dropdown should close
    expect(screen.queryByText('ID / Title')).not.toBeInTheDocument();
  });

  it('should reflect unchecked state for hidden columns', () => {
    const partialColumns: ColumnVisibility = {
      ...defaultColumns,
      description: false,
      rationale: false,
    };

    render(<ColumnSelector {...defaultProps} visibleColumns={partialColumns} />);

    fireEvent.click(screen.getByText('Columns'));

    const checkboxes = screen.getAllByRole('checkbox');
    const descriptionCheckbox = checkboxes.find((cb) =>
      cb.parentElement?.textContent?.includes('Description')
    ) as HTMLInputElement;
    const rationaleCheckbox = checkboxes.find((cb) =>
      cb.parentElement?.textContent?.includes('Rationale')
    ) as HTMLInputElement;

    expect(descriptionCheckbox?.checked).toBe(false);
    expect(rationaleCheckbox?.checked).toBe(false);
  });
});
