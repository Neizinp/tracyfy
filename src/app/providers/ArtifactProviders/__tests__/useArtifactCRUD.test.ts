import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArtifactCRUD, hasArtifactChanges, type BaseArtifact } from '../useArtifactCRUD';

vi.mock('../../FileSystemProvider', () => ({ useFileSystem: () => ({ getNextId: vi.fn() }) }));
vi.mock('../../UserProvider', () => ({ useUser: () => ({ currentUser: { id: 'USER-001' } }) }));
vi.mock('../../ToastProvider', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../BackgroundTasksProvider', () => ({
  useBackgroundTaskActions: () => ({ startTask: () => 'task-1', endTask: vi.fn() }),
}));

interface Item extends BaseArtifact {
  title: string;
  tags?: string[];
  description?: string;
}

const existing: Item = {
  id: 'REQ-001',
  title: 'Login',
  tags: ['a'],
  revision: '03',
  lastModified: 1000,
};

describe('hasArtifactChanges', () => {
  it('ignores unchanged fields and bookkeeping fields', () => {
    expect(hasArtifactChanges(existing, { title: 'Login', tags: ['a'] })).toBe(false);
    expect(hasArtifactChanges(existing, { revision: '04', lastModified: 2000 })).toBe(false);
  });

  it('treats undefined, null and empty string as equal', () => {
    expect(hasArtifactChanges(existing, { description: '' })).toBe(false);
  });

  it('detects changed values, including inside arrays', () => {
    expect(hasArtifactChanges(existing, { title: 'Logout' })).toBe(true);
    expect(hasArtifactChanges(existing, { tags: ['a', 'b'] })).toBe(true);
  });
});

describe('useArtifactCRUD.handleUpdate', () => {
  const saveFn = vi.fn(() => Promise.resolve());
  const setItems = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  const setup = () =>
    renderHook(() =>
      useArtifactCRUD<Item>({
        type: 'requirements',
        items: [existing],
        setItems,
        saveFn,
        deleteFn: vi.fn(),
      })
    ).result;

  it('does not save or bump the revision when nothing changed', async () => {
    const result = setup();
    await act(() => result.current.handleUpdate('REQ-001', { title: 'Login', tags: ['a'] }));
    expect(saveFn).not.toHaveBeenCalled();
    expect(setItems).not.toHaveBeenCalled();
  });

  it('saves with an incremented revision when something changed', async () => {
    const result = setup();
    await act(() => result.current.handleUpdate('REQ-001', { title: 'Login v2' }));
    expect(saveFn).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Login v2', revision: '04' })
    );
  });
});
