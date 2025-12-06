import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BaselineRevisionHistory } from '../BaselineRevisionHistory';
import type { ProjectBaseline } from '../../types';

vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getHistory: vi.fn().mockResolvedValue([]),
  },
}));

describe('BaselineRevisionHistory', () => {
  const mockBaseline: ProjectBaseline = {
    id: 'baseline-1',
    name: 'v1.0',
    description: 'Test baseline',
    projectId: 'PROJ-001',
    timestamp: 1000000,
    version: '01',
    artifactCommits: {},
  };

  it('should render without crashing', () => {
    const { container } = render(
      <BaselineRevisionHistory
        currentBaseline={mockBaseline}
        previousBaseline={null}
        projectName="Test"
        onViewArtifact={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });
});
