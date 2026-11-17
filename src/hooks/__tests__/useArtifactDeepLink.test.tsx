/**
 * ?id=REQ-001 in the URL opens that artifact's dialog, and the open dialog
 * is written back to the URL. The UI state is a real store.
 */
import { act, renderHook } from '@testing-library/react';
import { useArtifactDeepLink } from '../useArtifactDeepLink';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSearchParams } from 'react-router-dom';
import { storeWrapper } from '../../test/renderWithStore';
import type { AppState } from '../../state';
import type { Requirement } from '../../types';

vi.mock('react-router-dom', () => ({
  useSearchParams: vi.fn(),
}));

const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockSetSearchParams = vi.fn();

const withUrl = (query: string) =>
  mockedUseSearchParams.mockReturnValue([new URLSearchParams(query), mockSetSearchParams]);

/** A store holding REQ-001 (unless `requirements` says otherwise) */
function render(state: Partial<AppState> = {}, requirements = ['REQ-001']) {
  const { wrapper, store } = storeWrapper();
  store.setState((s) => ({
    artifacts: {
      ...s.artifacts,
      requirement: requirements.map((id) => ({ id, title: 'Test Req' }) as Requirement),
    },
    ...state,
  }));
  const hook = renderHook(() => useArtifactDeepLink(), { wrapper });
  return { ...hook, store };
}

describe('useArtifactDeepLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('opens the dialog of the artifact in the URL', () => {
    withUrl('?id=REQ-001');
    const { store } = render();

    expect(store.getState().activeModal).toEqual({ type: 'requirement', isEdit: true });
    expect(store.getState().selectedArtifact).toMatchObject({ id: 'REQ-001', type: 'requirement' });
  });

  it('does not reopen an artifact that was already opened from the URL', () => {
    withUrl('?id=REQ-001');
    const { store, rerender } = render();
    act(() => store.getState().closeModal());

    rerender();

    expect(store.getState().activeModal.type).toBeNull();
  });

  it('writes a dialog opened in the app to the URL', () => {
    withUrl('');
    render({
      activeModal: { type: 'requirement', isEdit: true },
      selectedArtifact: { id: 'REQ-002', type: 'requirement' },
    });

    expect(mockSetSearchParams).toHaveBeenCalled();
    expect(mockSetSearchParams.mock.calls[0][0].get('id')).toBe('REQ-002');
  });

  it('removes the ID from the URL when no dialog is open', () => {
    // No such artifact, so nothing opens
    withUrl('?id=REQ-001');
    render({}, []);

    expect(mockSetSearchParams).toHaveBeenCalled();
    expect(mockSetSearchParams.mock.calls[0][0].has('id')).toBe(false);
  });
});
