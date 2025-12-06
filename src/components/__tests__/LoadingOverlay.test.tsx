import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('should render when isLoading is true', () => {
    render(<LoadingOverlay isLoading={true} />);

    expect(screen.getByText('Loading Project...')).toBeInTheDocument();
    expect(
      screen.getByText('Initializing Git repository and loading artifacts')
    ).toBeInTheDocument();
  });

  it('should not render when isLoading is false', () => {
    render(<LoadingOverlay isLoading={false} />);

    expect(screen.queryByText('Loading Project...')).not.toBeInTheDocument();
  });

  it('should have correct styling for overlay', () => {
    const { container } = render(<LoadingOverlay isLoading={true} />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveStyle({ position: 'fixed' });
    expect(overlay).toHaveStyle({ zIndex: '9999' });
  });
});
