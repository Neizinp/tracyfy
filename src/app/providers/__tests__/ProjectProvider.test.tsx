import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ProjectProvider, useProject } from '../ProjectProvider';

const mockSaveProject = vi.fn().mockResolvedValue(undefined);

vi.mock('../FileSystemProvider', () => ({
  useFileSystem: vi.fn(() => ({
    project: { name: 'Door Controller', description: 'Lobby doors' },
    isLoading: false,
    isReady: true,
    saveProject: mockSaveProject,
  })),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ProjectProvider>{children}</ProjectProvider>
);

describe('ProjectProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides the project of the open folder', () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    expect(result.current.project).toEqual({ name: 'Door Controller', description: 'Lobby doors' });
    expect(result.current.isLoading).toBe(false);
  });

  it('saves a trimmed name and description', async () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    await act(() => result.current.updateProject({ name: '  Gate  ', description: ' New \n' }));
    expect(mockSaveProject).toHaveBeenCalledWith({ name: 'Gate', description: 'New' });
  });

  it('refuses an empty name', async () => {
    const { result } = renderHook(() => useProject(), { wrapper });
    await expect(result.current.updateProject({ name: '   ', description: '' })).rejects.toThrow(
      'The project needs a name'
    );
    expect(mockSaveProject).not.toHaveBeenCalled();
  });

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useProject())).toThrow(
      'useProject must be used within a ProjectProvider'
    );
  });
});
