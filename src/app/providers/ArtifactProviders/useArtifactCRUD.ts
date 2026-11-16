import { useCallback, useMemo } from 'react';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast, notifyError } from '../ToastProvider';
import { useBackgroundTaskActions } from '../BackgroundTasksProvider';
import { incrementRevision } from '../../../utils/revisionUtils';

export interface BaseArtifact {
  id: string;
  lastModified: number;
  revision: string;
  isDeleted?: boolean;
  deletedAt?: number;
}

export type ArtifactType =
  | 'requirements'
  | 'useCases'
  | 'testCases'
  | 'information'
  | 'risks'
  | 'workflows'
  | 'documents'
  | 'links';

export interface CRUDOptions<T> {
  type: ArtifactType;
  /** Items shown in the current view (may be filtered to the current project) */
  items: T[];
  /**
   * Every item of this type (source of truth). Used to find the artifact being
   * updated/deleted, so artifacts outside the current project (e.g. opened from
   * the Global Library) can be edited. Defaults to `items`.
   */
  allItems?: T[];
  saveFn: (item: T) => Promise<void>;
  deleteFn: (id: string) => Promise<void>;
  onBeforeUpdate?: (item: T) => void;
  onAfterUpdate?: (item: T) => void;
  onBeforeAdd?: (data: Omit<T, 'id' | 'lastModified' | 'revision'>) => void;
  /** Called after a new item was saved (e.g. to add it to the current project) */
  onAfterAdd?: (item: T) => Promise<void> | void;
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
  allItems,
  saveFn,
  deleteFn,
  onBeforeUpdate,
  onAfterUpdate,
  onBeforeAdd,
  onAfterAdd,
}: CRUDOptions<T>) {
  const lookupItems = allItems ?? items;
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
        if (onAfterAdd) await onAfterAdd(newItem);
        showToast(
          `${type.charAt(0).toUpperCase() + type.slice(1, -1)} ${newId} created`,
          'success'
        );
        return newItem;
      } catch (error) {
        console.error(`Failed to add ${type}:`, error);
        showToast(`Failed to add ${type}`, 'error');
        return null;
      }
    },
    [currentUser, getNextId, saveFn, showToast, type, onBeforeAdd, onAfterAdd]
  );

  const handleUpdate = useCallback(
    async (id: string, updatedData: Partial<T>) => {
      const existing = lookupItems.find((item) => item.id === id);
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
        showToast(`Failed to update ${type}`, 'error');
      } finally {
        endTask(taskId);
      }
    },
    [lookupItems, saveFn, type, showToast, onBeforeUpdate, onAfterUpdate, startTask, endTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const existing = lookupItems.find((item) => item.id === id);
      if (!existing) return;

      const deletedItem: T = {
        ...existing,
        isDeleted: true,
        deletedAt: Date.now(),
      };

      saveFn(deletedItem).catch((err) => notifyError(`Could not delete ${id}`, err));
    },
    [lookupItems, saveFn]
  );

  const handleRestore = useCallback(
    (id: string) => {
      const existing = lookupItems.find((item) => item.id === id);
      if (!existing) return;

      const restoredItem: T = {
        ...existing,
        isDeleted: false,
        deletedAt: undefined,
        lastModified: Date.now(),
      };

      saveFn(restoredItem).catch((err) => notifyError(`Could not restore ${id}`, err));
    },
    [lookupItems, saveFn]
  );

  const handlePermanentDelete = useCallback(
    (id: string) => {
      deleteFn(id).catch((err) => notifyError(`Could not permanently delete ${id}`, err));
    },
    [deleteFn]
  );

  return useMemo(
    () => ({
      handleAdd,
      handleUpdate,
      handleDelete,
      handleRestore,
      handlePermanentDelete,
    }),
    [handleAdd, handleDelete, handlePermanentDelete, handleRestore, handleUpdate]
  );
}
