/**
 * Creating, editing, deleting and restoring artifacts of any kind. Every
 * kind goes through the same actions; the kind is a parameter.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ArtifactByKind } from '../../types';
import { kind as kindDef, type ArtifactKindId } from '../../domain/artifactKinds';
import { hasArtifactChanges } from '../../domain/artifactChanges';
import { savedByTheApp } from '../../domain/kindRules';
import { incrementRevision } from '../../utils/revisionUtils';
import { withTask } from './tasks';
import { notifyError } from '../notify';

/** What a dialog sends to create an artifact: everything but the bookkeeping */
export type NewArtifact<K extends ArtifactKindId> = Omit<
  ArtifactByKind[K],
  'id' | 'lastModified' | 'revision' | 'dateCreated'
> & { dateCreated?: number };

export interface ArtifactsSlice {
  /**
   * Create an artifact with the next free ID. Returns null (after telling the
   * user why) if there is no user yet or the write failed.
   */
  addArtifact: <K extends ArtifactKindId>(
    kind: K,
    data: NewArtifact<K>
  ) => Promise<ArtifactByKind[K] | null>;
  /**
   * Save changed fields and bump the revision. Saving without changes writes
   * nothing. Returns true if the artifact was saved.
   */
  updateArtifact: <K extends ArtifactKindId>(
    kind: K,
    id: string,
    updates: Partial<ArtifactByKind[K]>
  ) => Promise<boolean>;
  /** Mark an artifact deleted; its file and ID stay */
  deleteArtifact: (kind: ArtifactKindId, id: string) => Promise<void>;
  restoreArtifact: (kind: ArtifactKindId, id: string) => Promise<void>;
  /** Open an artifact's dialog for editing (needs a user) */
  editArtifact: (kind: ArtifactKindId, artifact: { id: string }) => void;
}

const label = (kindId: ArtifactKindId) => kindDef(kindId).label.singular;

export const createArtifactsSlice: StateCreator<AppState, [], [], ArtifactsSlice> = (set, get) => {
  const find = <K extends ArtifactKindId>(kindId: K, id: string) =>
    (get().artifacts[kindId] as ArtifactByKind[K][]).find((a) => a.id === id);

  return {
    addArtifact: async (kindId, data) => {
      const { currentUser, showToast } = get();
      if (!currentUser) {
        showToast('Set your name in User Settings before creating artifacts.', 'warning');
        return null;
      }
      try {
        const now = Date.now();
        const artifact = {
          ...data,
          ...savedByTheApp(kindId, undefined, data as Record<string, unknown>, now),
          // The git author is the user (P5)
          author: (data as { author?: string }).author || currentUser.name,
          dateCreated: data.dateCreated ?? now,
          id: await get().nextId(kindId),
          lastModified: now,
          revision: '01',
        } as unknown as ArtifactByKind[typeof kindId];
        // The store shows it only after the write succeeded
        await get().saveArtifact(kindId, artifact);
        showToast(`${label(kindId)} ${artifact.id} created`, 'success');
        return artifact;
      } catch (error) {
        console.error(`Failed to add ${kindId}:`, error);
        showToast(`Failed to add ${label(kindId).toLowerCase()}`, 'error');
        return null;
      }
    },

    updateArtifact: async (kindId, id, updates) => {
      const existing = find(kindId, id);
      if (!existing) return false;
      // Saving without changes must not bump the revision or rewrite the file,
      // otherwise the artifact shows up as modified and needs a pointless commit
      if (!hasArtifactChanges(existing, updates)) return false;

      const now = Date.now();
      const changed = { ...existing, ...updates };
      const updated = {
        ...changed,
        ...savedByTheApp(kindId, existing as never, changed as never, now),
        revision: incrementRevision(existing.revision || '01'),
        lastModified: now,
      };
      try {
        await withTask(get(), `Saving ${id}...`, () => get().saveArtifact(kindId, updated));
        return true;
      } catch (error) {
        console.error(`Failed to update ${kindId}:`, error);
        get().showToast(`Failed to update ${label(kindId).toLowerCase()}`, 'error');
        return false;
      }
    },

    deleteArtifact: async (kindId, id) => {
      const existing = find(kindId, id);
      if (!existing) return;
      try {
        await get().saveArtifact(kindId, { ...existing, isDeleted: true, deletedAt: Date.now() });
      } catch (err) {
        notifyError(`Could not delete ${id}`, err);
      }
    },

    restoreArtifact: async (kindId, id) => {
      const existing = find(kindId, id);
      if (!existing) return;
      try {
        await get().saveArtifact(kindId, {
          ...existing,
          isDeleted: false,
          deletedAt: undefined,
          lastModified: Date.now(),
        });
      } catch (err) {
        notifyError(`Could not restore ${id}`, err);
      }
    },

    editArtifact: (kindId, artifact) => {
      if (!get().currentUser) {
        get().showToast('Set your name in User Settings before editing artifacts.', 'warning');
        return;
      }
      set({
        activeModal: { type: kindId, isEdit: true },
        selectedArtifact: {
          id: artifact.id,
          type: kindId,
          data: artifact as unknown as Record<string, unknown>,
        },
      });
    },
  };
};
