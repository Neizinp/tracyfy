import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseList } from '../UseCaseList';
import type { UseCase, Requirement, UseCaseColumnVisibility } from '../../types';

const defaultColumns: UseCaseColumnVisibility = {
  idTitle: true,
  revision: true,
  description: true,
  actor: true,
  priority: true,
  status: true,
  preconditions: false,
  mainFlow: false,
  alternativeFlows: false,
  postconditions: false,
};

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

  beforeEach(() => {
    mockOnEdit.mockClear();
  });

  it('renders use cases', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
      />
    );

    expect(screen.getByText('UC-001')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('calls onEdit when use case is clicked', () => {
    render(
      <UseCaseList
        useCases={mockUseCases}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
      />
    );

    fireEvent.click(screen.getByText('Login'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockUseCases[0]);
  });

  it('renders empty state', () => {
    render(
      <UseCaseList
        useCases={[]}
        requirements={mockRequirements}
        onEdit={mockOnEdit}
        visibleColumns={defaultColumns}
      />
    );

    expect(screen.getByText('No use cases found. Create one to get started.')).toBeInTheDocument();
  });
});
