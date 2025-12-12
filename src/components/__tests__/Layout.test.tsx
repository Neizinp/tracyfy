import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';
import { AppProviders } from '../../app/AppProviders';

vi.mock('../ModalManager', () => ({
  ModalManager: () => <div>ModalManager</div>,
}));

describe('Layout', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <AppProviders>
        <BrowserRouter>
          <Layout
            projects={[]}
            currentProjectId=""
            currentProjectName=""
            onCreateProject={vi.fn()}
            onSwitchProject={vi.fn()}
            onOpenProjectSettings={vi.fn()}
            onNewRequirement={vi.fn()}
          >
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      </AppProviders>
    );
    expect(container).toBeTruthy();
  });
});
