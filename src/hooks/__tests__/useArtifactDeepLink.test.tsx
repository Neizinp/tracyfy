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

const mockedUseUI = vi.mocked(useUI);
const mockedUseGlobalState = vi.mocked(useGlobalState);
const mockedUseSearchParams = vi.mocked(useSearchParams);

describe('useArtifactDeepLink', () => {
  const mockOpenModal = vi.fn();
  const mockSetSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseUI.mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: null },
      selectedArtifact: null,
    } as any);
    mockedUseGlobalState.mockReturnValue({
      globalRequirements: [{ id: 'REQ-001', title: 'Test Req' }] as any[],
      globalUseCases: [],
      globalTestCases: [],
      globalInformation: [],
      globalRisks: [],
    } as any);
  });

  it('should open modal when id is present in search params', () => {
    mockedUseSearchParams.mockReturnValue([
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
    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams('?id=REQ-001'),
      mockSetSearchParams,
    ]);

    const { rerender } = renderHook(() => useArtifactDeepLink());
    expect(mockOpenModal).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockOpenModal).toHaveBeenCalledTimes(1);
  });

  it('should update search params when a modal is opened manually', () => {
    mockedUseSearchParams.mockReturnValue([new URLSearchParams(''), mockSetSearchParams]);
    mockedUseUI.mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: 'requirement' },
      selectedArtifact: { id: 'REQ-002', type: 'requirement' },
    } as any);

    renderHook(() => useArtifactDeepLink());

    expect(mockSetSearchParams).toHaveBeenCalled();
    const call = mockSetSearchParams.mock.calls[0][0];
    expect(call.get('id')).toBe('REQ-002');
  });

  it('should remove search params when modal is closed', () => {
    mockedUseSearchParams.mockReturnValue([
      new URLSearchParams('?id=REQ-001'),
      mockSetSearchParams,
    ]);
    mockedUseUI.mockReturnValue({
      openModal: mockOpenModal,
      activeModal: { type: null },
      selectedArtifact: null,
    } as any);

    renderHook(() => useArtifactDeepLink());

    // First effect opens modal (if it wasn't for the mock return value)
    // Second effect removes ID because modal is null
    expect(mockSetSearchParams).toHaveBeenCalled();
    const call = mockSetSearchParams.mock.calls[0][0];
    expect(call.has('id')).toBe(false);
  });
});
