import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestCaseList } from '../TestCaseList';
import type { TestCase } from '../../types';

describe('TestCaseList', () => {
  const mockTestCases: TestCase[] = [
    {
      id: 'TC-001',
      title: 'Verify Login',
      description: 'Check login with valid creds',
      requirementIds: ['REQ-001'],
      priority: 'high',
      status: 'passed',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),
    },
  ];

  const mockOnEdit = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
  });

  it('renders test cases', () => {
    render(<TestCaseList testCases={mockTestCases} onEdit={mockOnEdit} />);

    expect(screen.getByText('TC-001')).toBeInTheDocument();
    expect(screen.getByText('Verify Login')).toBeInTheDocument();
    expect(screen.getByText('Check login with valid creds')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('calls onEdit when row is clicked', () => {
    render(<TestCaseList testCases={mockTestCases} onEdit={mockOnEdit} />);

    // Click the row to edit
    fireEvent.click(screen.getByText('Verify Login'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTestCases[0]);
  });

  it('renders empty state', () => {
    render(<TestCaseList testCases={[]} onEdit={mockOnEdit} />);

    expect(screen.getByText('No test cases found. Create one to get started.')).toBeInTheDocument();
  });
});
