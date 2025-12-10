import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseList } from '../UseCaseList';
import type { UseCase, Requirement } from '../../types';

describe('UseCaseList', () => {
  const mockUseCases: UseCase[] = [
    {
      id: 'UC-001',
      title: 'Login',
      description: 'User logs in',
      actor: 'User',
      preconditions: 'None',
      postconditions: 'Logged in',
      mainFlow: '1. Enter creds',
      alternativeFlows: '',
      priority: 'high',
      status: 'implemented',
      revision: '01',
      lastModified: Date.now(),
    },
  ];

  const mockRequirements: Requirement[] = [];
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnBreakDown = vi.fn();

  it('renders use cases', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onBreakDown={mockOnBreakDown}
      />
    );

    expect(screen.getByText('UC-001')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText(/Actor: User/)).toBeInTheDocument();
  });

  it('expands use case details on click', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onBreakDown={mockOnBreakDown}
      />
    );

    // Click header to expand
    fireEvent.click(screen.getByText('Login'));

    // Check for details
    expect(screen.getByText('Description:')).toBeInTheDocument();
    expect(screen.getByText('User logs in')).toBeInTheDocument();
    expect(screen.getByText('Main Flow:')).toBeInTheDocument();
  });

  it('handles actions', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onBreakDown={mockOnBreakDown}
      />
    );

    fireEvent.click(screen.getByTitle('Edit use case'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUseCases[0]);

    fireEvent.click(screen.getByTitle('Delete use case'));
    expect(mockOnDelete).toHaveBeenCalledWith('UC-001');

    fireEvent.click(screen.getByTitle('Break down into requirements'));
    expect(mockOnBreakDown).toHaveBeenCalledWith(mockUseCases[0]);
  });

  it('renders empty state', () => {
    render(
      <UseCaseList
        useCases={[]}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onBreakDown={mockOnBreakDown}
      />
    );

    expect(screen.getByText('No use cases found. Create one to get started.')).toBeInTheDocument();
  });
});
