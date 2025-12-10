import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementTree } from '../RequirementTree';
import type { Requirement } from '../../types';

// Mock dnd-kit because it relies on browser APIs not fully present in jsdom
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSensor: () => null,
    useSensors: () => null,
    PointerSensor: null,
    KeyboardSensor: null,
  };
});

vi.mock('@dnd-kit/sortable', async () => {
  const actual = await vi.importActual('@dnd-kit/sortable');
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: (node: HTMLElement) => node,
      transform: null,
      transition: null,
      isDragging: false,
    }),
  };
});

describe('RequirementTree', () => {
  const mockRequirements: Requirement[] = [
    {
      id: 'REQ-001',
      title: 'Root Req',
      description: '',
      status: 'draft',
      priority: 'high',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),

      text: '',
      rationale: '',
    },
    {
      id: 'REQ-002',
      title: 'Child Req',
      description: '',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      lastModified: Date.now(),
      dateCreated: Date.now(),

      text: '',
      rationale: '',
    },
  ];

  const mockOnReorder = vi.fn();
  const mockOnLink = vi.fn();
  const mockOnEdit = vi.fn();

  it('renders requirements list', () => {
    render(
      <RequirementTree
        requirements={mockRequirements}
        onReorder={mockOnReorder}
        onLink={mockOnLink}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('REQ-001')).toBeInTheDocument();
    expect(screen.getByText('Root Req')).toBeInTheDocument();
    expect(screen.getByText('REQ-002')).toBeInTheDocument();
    expect(screen.getByText('Child Req')).toBeInTheDocument();
  });

  it('handles edit click', () => {
    render(
      <RequirementTree
        requirements={mockRequirements}
        onReorder={mockOnReorder}
        onLink={mockOnLink}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Root Req'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockRequirements[0]);
  });

  it('handles link click', () => {
    render(
      <RequirementTree
        requirements={mockRequirements}
        onReorder={mockOnReorder}
        onLink={mockOnLink}
        onEdit={mockOnEdit}
      />
    );

    const linkButtons = screen.getAllByTitle('Create Link');
    fireEvent.click(linkButtons[0]);
    expect(mockOnLink).toHaveBeenCalledWith('REQ-001');
  });

  it('renders empty state', () => {
    render(
      <RequirementTree
        requirements={[]}
        onReorder={mockOnReorder}
        onLink={mockOnLink}
        onEdit={mockOnEdit}
      />
    );

    expect(
      screen.getByText('No requirements found. Create one to get started.')
    ).toBeInTheDocument();
  });
});
