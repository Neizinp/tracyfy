import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ModalManager } from '../ModalManager';
import { AppProviders } from '../../app/AppProviders';

describe('ModalManager', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <AppProviders>
        <ModalManager />
      </AppProviders>
    );
    expect(container).toBeTruthy();
  });
});
