import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';
import { StoreProvider } from '../../state';

vi.mock('../ModalManager', () => ({
  ModalManager: () => <div>ModalManager</div>,
}));

describe('Layout', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <StoreProvider>
        <BrowserRouter>
          <Layout
            projectName="Door Controller"
            onOpenProjectSettings={vi.fn()}
            onNewRequirement={vi.fn()}
          >
            <div>Content</div>
          </Layout>
        </BrowserRouter>
      </StoreProvider>
    );
    expect(container).toBeTruthy();
  });
});
