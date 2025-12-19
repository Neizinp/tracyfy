import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIState } from '../useUIState';
import type { SelectedArtifact } from '../../types';

describe('useUIState - Navigation Stack (Breadcrumbs)', () => {
  it('should push to navigation stack', () => {
    const { result } = renderHook(() => useUIState());

    const artifact: SelectedArtifact = { id: 'REQ-001', type: 'requirement', data: {} };

    act(() => {
      result.current.pushNavigationStack(artifact);
    });

    expect(result.current.navigationStack).toHaveLength(1);
    expect(result.current.navigationStack[0].id).toBe('REQ-001');
  });

  it('should pop from navigation stack and open previous artifact', () => {
    const { result } = renderHook(() => useUIState());

    const art1: SelectedArtifact = { id: 'REQ-001', type: 'requirement', data: {} };
    const art2: SelectedArtifact = { id: 'TC-001', type: 'testcase', data: {} };

    act(() => {
      result.current.pushNavigationStack(art1);
      result.current.openModal('testcase', true, art2);
    });

    expect(result.current.navigationStack).toHaveLength(1);
    expect(result.current.selectedArtifact?.id).toBe('TC-001');

    act(() => {
      result.current.popNavigationStack();
    });

    expect(result.current.navigationStack).toHaveLength(0);
    expect(result.current.activeModal.type).toBe('requirement');
    expect(result.current.selectedArtifact?.id).toBe('REQ-001');
  });

  it('should clear navigation stack', () => {
    const { result } = renderHook(() => useUIState());

    act(() => {
      result.current.pushNavigationStack({
        id: 'REQ-001',
        type: 'requirement',
      } as SelectedArtifact);
      result.current.clearNavigationStack();
    });

    expect(result.current.navigationStack).toHaveLength(0);
  });
});
