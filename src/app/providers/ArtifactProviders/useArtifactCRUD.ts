import { useCallback } from 'react';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
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
  | 'workflows';

export interface CRUDOptions<T> {
  type: ArtifactType;
  items: T[];
  setItems: (items: T[] | ((prev: T[]) => T[])) => void;
  saveFn: (item: T) => Promise<void>;
  deleteFn: (id: string) => Promise<void>;
  onBeforeUpdate?: (item: T) => void;
  onAfterUpdate?: (item: T) => void;
  onBeforeAdd?: (data: Omit<T, 'id' | 'lastModified' | 'revision'>) => void;
}

/**
 * Generic hook for artifact CRUD operations.
 * Consolidates common logic across different artifact providers.
 */
export function useArtifactCRUD<T extends BaseArtifact>({
  type,
  items,
  setItems,
  saveFn,
  deleteFn,
  onBeforeUpdate,
  onAfterUpdate,
  onBeforeAdd,
}: CRUDOptions<T>) {
  const { getNextId } = useFileSystem();
  const { currentUser } = useUser();
  const { showToast } = useToast();

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

        setItems((prev) => [...prev, newItem]);
        await saveFn(newItem);
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
    [currentUser, getNextId, saveFn, setItems, showToast, type, onBeforeAdd]
  );

  const handleUpdate = useCallback(
    async (id: string, updatedData: Partial<T>) => {
      const existing = items.find((item) => item.id === id);
      if (!existing) return;

      if (onBeforeUpdate) onBeforeUpdate(existing);

      const newRevision = incrementRevision(existing.revision || '01');
      const finalItem: T = {
        ...existing,
        ...updatedData,
        revision: newRevision,
        lastModified: Date.now(),
      };

      setItems((prev) => prev.map((item) => (item.id === id ? finalItem : item)));

      try {
        await saveFn(finalItem);
        if (onAfterUpdate) onAfterUpdate(finalItem);
      } catch (error) {
        console.error(`Failed to update ${type}:`, error);
        showToast(`Failed to update ${type}`, 'error');
      }
    },
    [items, saveFn, setItems, type, showToast, onBeforeUpdate, onAfterUpdate]
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

      setItems((prev) => prev.map((item) => (item.id === id ? deletedItem : item)));
      saveFn(deletedItem).catch((err) => console.error(`Failed to soft-delete ${type}:`, err));
    },
    [items, saveFn, setItems, type]
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

      setItems((prev) => prev.map((item) => (item.id === id ? restoredItem : item)));
      saveFn(restoredItem).catch((err) => console.error(`Failed to restore ${type}:`, err));
    },
    [items, saveFn, setItems, type]
  );

  const handlePermanentDelete = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      deleteFn(id).catch((err) => console.error(`Failed to permanently delete ${type}:`, err));
    },
    [deleteFn, setItems, type]
  );

  return {
    handleAdd,
    handleUpdate,
    handleDelete,
    handleRestore,
    handlePermanentDelete,
  };
}
