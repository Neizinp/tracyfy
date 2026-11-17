import { describe, it, expect } from 'vitest';
import { act, screen } from '@testing-library/react';
import { StatusBar } from '../StatusBar';
import { renderWithStore } from '../../test/renderWithStore';

describe('StatusBar', () => {
  it('is hidden while nothing runs', () => {
    const { container } = renderWithStore(<StatusBar />);
    expect(container.firstChild).toBeNull();
  });

  it('shows a running task and hides when it ends', () => {
    const { store, container } = renderWithStore(<StatusBar />);

    let id = '';
    act(() => {
      id = store.getState().startTask('Committing REQ-001...');
    });
    expect(screen.getByText('Committing REQ-001...')).toBeInTheDocument();

    act(() => store.getState().endTask(id));
    expect(container.firstChild).toBeNull();
  });

  it('shows the first task and how many more are running', () => {
    const { store } = renderWithStore(<StatusBar />);

    act(() => {
      for (let i = 1; i <= 10; i++) {
        store.getState().startTask(`Committing REQ-${String(i).padStart(3, '0')}...`);
      }
    });

    expect(screen.getByText(/Committing REQ-001/)).toBeInTheDocument();
    expect(screen.getByText(/9 operations remaining/)).toBeInTheDocument();
  });
});
