import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionHistory } from '../VersionHistory';
import type { ProjectBaseline } from '../../types';

describe('VersionHistory', () => {
  const mockOnClose = vi.fn();
  const mockOnCreateBaseline = vi.fn();

  const mockBaseline: ProjectBaseline = {
    id: 'baseline-1',
    name: 'v1.0',
    description: 'Initial baseline',
    projectId: 'PROJ-001',
    timestamp: 1000000,
    version: '01',
    artifactCommits: {},
  };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    baselines: [mockBaseline],
    projectId: 'PROJ-001',
    onCreateBaseline: mockOnCreateBaseline,
  };

  it('should render when open', () => {
    render(<VersionHistory {...defaultProps} />);

    expect(screen.getByText(/Project History/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<VersionHistory {...defaultProps} isOpen={false} />);

    expect(screen.queryByText(/Project History/i)).not.toBeInTheDocument();
  });
});
