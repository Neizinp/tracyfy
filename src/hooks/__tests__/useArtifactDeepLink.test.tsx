import { renderHook } from '@testing-library/react';
import { useArtifactDeepLink } from '../useArtifactDeepLink';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSearchParams } from 'react-router-dom';
import { useUI, useGlobalState } from '../../app/providers';

vi.mock('react-router-dom', () => ({
  useSearchParams: vi.fn(),
}));

vi.mock('../../app/providers', () => ({
  useUI: vi.fn(),
  useGlobalState: vi.fn(),
}));

describe('useArtifactDeepLink', () => {
  const mockOpenModal = vi.fn();
  const mockSetSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useUI as any).mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: null },
      selectedArtifact: null,
    });
    (useGlobalState as any).mockReturnValue({
      globalRequirements: [{ id: 'REQ-001', title: 'Test Req' }],
      globalUseCases: [],
      globalTestCases: [],
      globalInformation: [],
      globalRisks: [],
    });
  });

  it('should open modal when id is present in search params', () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams('?id=REQ-001'),
      mockSetSearchParams,
    ]);

    renderHook(() => useArtifactDeepLink());

    expect(mockOpenModal).toHaveBeenCalledWith(
      'requirement',
      true,
      expect.objectContaining({
        id: 'REQ-001',
        type: 'requirement',
      })
    );
  });

  it('should not open modal if id is already processed', () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams('?id=REQ-001'),
      mockSetSearchParams,
    ]);

    const { rerender } = renderHook(() => useArtifactDeepLink());
    expect(mockOpenModal).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  it('should update search params when a modal is opened manually', () => {
    (useSearchParams as any).mockReturnValue([new URLSearchParams(''), mockSetSearchParams]);
    (useUI as any).mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: 'requirement' },
      selectedArtifact: { id: 'REQ-002', type: 'requirement' },
    });

    renderHook(() => useArtifactDeepLink());

    expect(mockSetSearchParams).toHaveBeenCalled();
    const call = mockSetSearchParams.mock.calls[0][0];
    expect(call.get('id')).toBe('REQ-002');
  });

  it('should remove search params when modal is closed', () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams('?id=REQ-001'),
      mockSetSearchParams,
    ]);
    (useUI as any).mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: null },
      selectedArtifact: null,
    });

    renderHook(() => useArtifactDeepLink());

    // First effect opens modal (if it wasn't for the mock return value)
    // Second effect removes ID because modal is null
    expect(mockSetSearchParams).toHaveBeenCalled();
    const call = mockSetSearchParams.mock.calls[0][0];
    expect(call.has('id')).toBe(false);
  });
});
