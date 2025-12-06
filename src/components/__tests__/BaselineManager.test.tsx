import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BaselineManager } from '../BaselineManager';

describe('BaselineManager', () => {
  const mockOnCreateBaseline = vi.fn();
  const mockOnViewBaseline = vi.fn();

  const defaultProps = {
    baselines: [],
    onCreateBaseline: mockOnCreateBaseline,
    onViewBaseline: mockOnViewBaseline,
  };

  it('should render without crashing', () => {
    const { container } = render(<BaselineManager {...defaultProps} />);
    expect(container).toBeTruthy();
  });
});
