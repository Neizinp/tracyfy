import { useCallback } from 'react';
import { useUI } from '../app/providers';
import { useAppStoreApi } from '../state';
import { kindOfId } from '../domain/artifactKinds';

/**
 * Open any artifact's dialog from its ID. The kind comes from the ID prefix,
 * so every caller (links, search, deep links, relationships) behaves the same.
 * Returns false when no such artifact exists.
 */
export function useOpenArtifact(): (id: string) => boolean {
  const { openModal } = useUI();
  // Read when called, so the caller does not re-render whenever an artifact changes
  const store = useAppStoreApi();

  return useCallback(
    (id: string) => {
      const kind = kindOfId(id);
      const artifact =
        kind && (store.getState().artifacts[kind] as { id: string }[]).find((a) => a.id === id);
      if (!kind || !artifact) return false;
      openModal(kind, true, {
        id,
        type: kind,
        data: artifact as unknown as Record<string, unknown>,
      });
      return true;
    },
    [store, openModal]
  );
}
