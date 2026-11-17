import { useCallback, useMemo } from 'react';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast, notifyError } from '../ToastProvider';
import { useBackgroundTaskActions } from '../BackgroundTasksProvider';
import { incrementRevision } from '../../../utils/revisionUtils';
import { storedTypeLabel, type StoredType } from '../../../services/storedTypes';

export interface BaseArtifact {
  id: string;
  lastModified: number;
  revision: string;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface CRUDOptions<T> {
  type: StoredType;
  /** Every item of this type */
  items: T[];
  saveFn: (item: T) => Promise<void>;
  onBeforeUpdate?: (item: T) => void;
  onAfterUpdate?: (item: T) => void;
  onBeforeAdd?: (data: Omit<T, 'id' | 'lastModified' | 'revision'>) => void;
}

/**
 * True if any field in `updates` differs from `existing`.
 * Values are compared structurally (artifact fields are plain JSON data);
 * undefined, null, '', [] and {} are all treated as "empty" and equal.
 * Bookkeeping fields (revision, lastModified) are ignored.
 */
export function hasArtifactChanges<T extends object>(existing: T, updates: Partial<T>): boolean {
  // Forms send '' / [] / {} for fields that are simply absent on stored artifacts
  const isEmpty = (v: unknown) =>
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);
  const normalize = (v: unknown) => (isEmpty(v) ? '' : v);
  return Object.entries(updates).some(([key, value]) => {
    if (key === 'revision' || key === 'lastModified') return false;
    const current = (existing as Record<string, unknown>)[key];
    return JSON.stringify(normalize(current)) !== JSON.stringify(normalize(value));
  });
}

/**
 * Generic hook for artifact CRUD operations.
 * Consolidates common logic across different artifact providers.
 */
export function useArtifactCRUD<T extends BaseArtifact>({
  type,
  items,
  saveFn,
  onBeforeUpdate,
  onAfterUpdate,
  onBeforeAdd,
}: CRUDOptions<T>) {
  const { getNextId } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();
  const { startTask, endTask } = useBackgroundTaskActions();

  const handleAdd = useCallback(
    async (data: Omit<T, 'id' | 'lastModified' | 'revision'>) => {
      if (!currentUser) {
        showToast(
          'Please select a user before creating artifacts. Go to Settings → Users to select a user.',
          'warning'
        );
        return null;
      }

      if (onBeforeAdd) onBeforeAdd(data);

      try {
        const newId = await getNextId(type);
        const now = Date.now();

        const newItem = {
          ...data,
          id: newId,
          lastModified: now,
          revision: '01',
        } as T;

        // State is updated by saveFn after the write succeeds, so the UI never
        // shows data that isn't on disk
        await saveFn(newItem);
        showToast(`${storedTypeLabel(type)} ${newId} created`, 'success');
        return newItem;
      } catch (error) {
        console.error(`Failed to add ${type}:`, error);
        showToast(`Failed to add ${storedTypeLabel(type).toLowerCase()}`, 'error');
        return null;
      }
    },
    [currentUser, getNextId, saveFn, showToast, type, onBeforeAdd]
  );

  const handleUpdate = useCallback(
    async (id: string, updatedData: Partial<T>) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return;

      // Saving without changes must not bump the revision or rewrite the file,
      // otherwise the artifact shows up as modified and needs a pointless commit.
      if (!hasArtifactChanges(existing, updatedData)) return;

      if (onBeforeUpdate) onBeforeUpdate(existing);

      const newRevision = incrementRevision(existing.revision || '01');
      const finalItem: T = {
        ...existing,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      // Save to disk with task message
      const taskId = startTask(`Saving ${id}...`);
      try {
        await saveFn(finalItem);
        if (onAfterUpdate) onAfterUpdate(finalItem);
      } catch (error) {
        console.error(`Failed to update ${type}:`, error);
        showToast(`Failed to update ${storedTypeLabel(type).toLowerCase()}`, 'error');
      } finally {
        endTask(taskId);
      }
    },
    [items, saveFn, type, showToast, onBeforeUpdate, onAfterUpdate, startTask, endTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return;

      const deletedItem: T = {
        ...existing,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      saveFn(deletedItem).catch((err) => notifyError(`Could not delete ${id}`, err));
    },
    [items, saveFn]
  );

  const handleRestore = useCallback(
    (id: string) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return;

      const restoredItem: T = {
        ...existing,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      saveFn(restoredItem).catch((err) => notifyError(`Could not restore ${id}`, err));
    },
    [items, saveFn]
  );

  return useMemo(
    () => ({
      handleAdd,
      handleUpdate,
      handleDelete,
      handleRestore,
    }),
    [handleAdd, handleDelete, handleRestore, handleUpdate]
  );
}
