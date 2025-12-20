import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ModalManager } from '../ModalManager';
import { AppProviders } from '../../app/AppProviders';

// Mock the dynamically imported diskProjectService
vi.mock('../../services/diskProjectService', () => ({
  diskProjectService: {
    loadProjects: vi.fn().mockResolvedValue([]),
    saveProject: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ModalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <MemoryRouter>
        <AppProviders>
          <ModalManager />
        </AppProviders>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it('should not display any modals by default', () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <ModalManager />
        </AppProviders>
      </MemoryRouter>
    );

    // By default, no modals should be visible
    expect(screen.queryByText('New Requirement')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Link')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Requirement')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Project')).not.toBeInTheDocument();
  });

  it('should render modal container elements', async () => {
    const { container } = render(
      <MemoryRouter>
        <AppProviders>
          <ModalManager />
        </AppProviders>
      </MemoryRouter>
    );

    // The ModalManager should be mounted even if no modals are open
    await waitFor(() => {
      expect(container).toBeTruthy();
    });
  });

  it('should be wrapped in necessary providers', () => {
    // This test verifies that ModalManager works within AppProviders context
    expect(() => {
      render(
        <MemoryRouter>
          <AppProviders>
            <ModalManager />
          </AppProviders>
        </MemoryRouter>
      );
    }).not.toThrow();
  });
});
