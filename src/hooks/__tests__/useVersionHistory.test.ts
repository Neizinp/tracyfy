import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVersionHistory, ARTIFACT_TYPE_CONFIG } from '../useVersionHistory';

// Mock realGitService
vi.mock('../../services/realGitService', () => ({
  realGitService: {
    getTagsWithDetails: vi.fn().mockResolvedValue([]),
    getHistory: vi.fn().mockResolvedValue([]),
    getCommitFiles: vi.fn().mockResolvedValue([]),
  },
}));

describe('useVersionHistory filters', () => {
  const defaultOptions = {
    isOpen: true,
    baselines: [],
    projectName: 'TestProject',
    onCreateBaseline: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all types selected by default', () => {
    const { result } = renderHook(() => useVersionHistory(defaultOptions));
    const allTypesCount = Object.keys(ARTIFACT_TYPE_CONFIG).length;
    expect(result.current.selectedTypes.size).toBe(allTypesCount);
  });

  it('should handleSelectAll correctly', () => {
    const { result } = renderHook(() => useVersionHistory(defaultOptions));

    // First deselect all
    act(() => {
      result.current.handleDeselectAll();
    });
    expect(result.current.selectedTypes.size).toBe(0);

    // Then select all
    act(() => {
      result.current.handleSelectAll();
    });
    const allTypesCount = Object.keys(ARTIFACT_TYPE_CONFIG).length;
    expect(result.current.selectedTypes.size).toBe(allTypesCount);
  });

  it('should handleDeselectAll correctly', () => {
    const { result } = renderHook(() => useVersionHistory(defaultOptions));

    act(() => {
      result.current.handleDeselectAll();
    });
    expect(result.current.selectedTypes.size).toBe(0);
  });

  it('should handleToggleType correctly', () => {
    const { result } = renderHook(() => useVersionHistory(defaultOptions));
    const type = 'requirements';

    // Deselect one
    act(() => {
      result.current.handleToggleType(type);
    });
    expect(result.current.selectedTypes.has(type)).toBe(false);

    // Select it again
    act(() => {
      result.current.handleToggleType(type);
    });
    expect(result.current.selectedTypes.has(type)).toBe(true);
  });
});
