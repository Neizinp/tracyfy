/**
 * UI state: which dialog is open and for which artifact, the navigation
 * stack between linked artifacts, the search box and the table columns.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type { ActiveModal, ModalType, SelectedArtifact } from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';

/**
 * Table columns the user turned on or off, per kind and column key. Columns
 * not listed show their default (the field's showInTable).
 */
export type ColumnChoices = Partial<Record<ArtifactKindId, Record<string, boolean>>>;

const columnsKey = (directoryName: string) => `tracyfy.columns.${directoryName}`;

/** The column choices saved for a project folder (per user, in this browser) */
export function readColumnChoices(directoryName: string | null): ColumnChoices {
  if (!directoryName) return {};
  try {
    const saved = localStorage.getItem(columnsKey(directoryName));
    return saved ? (JSON.parse(saved) as ColumnChoices) : {};
  } catch {
    return {};
  }
}

export interface UiSlice {
  activeModal: ActiveModal;
  /** The artifact the open dialog shows (with its data when it is being edited) */
  selectedArtifact: SelectedArtifact | null;
  /** Artifacts to go back to, when one dialog opened another through a link */
  navigationStack: SelectedArtifact[];
  /** The artifact the link dialog links from; null lets the user pick one */
  linkSourceId: string | null;
  linkSourceType: ArtifactKindId | null;
  /** The artifact dialog the link dialog was opened from; it reopens when that closes */
  linkReturn: { artifact: SelectedArtifact; tab: string } | null;
  /** The tab the next artifact dialog opens on (then cleared) */
  dialogTab: string | null;
  searchQuery: string;
  columnVisibility: ColumnChoices;

  openModal: (type: ModalType, isEdit?: boolean, artifact?: SelectedArtifact) => void;
  closeModal: () => void;
  setActiveModal: (modal: ActiveModal) => void;
  setSelectedArtifact: (artifact: SelectedArtifact | null) => void;
  /** Open the link dialog, linking from `sourceId` (or from an artifact the user picks) */
  /** `from`: the artifact dialog it is opened from, which comes back on `tab` */
  openLinkDialog: (
    sourceId: string | null,
    sourceType?: ArtifactKindId | null,
    from?: { artifact: SelectedArtifact; tab: string }
  ) => void;
  /** Close the link dialog, back to the artifact dialog it was opened from if any */
  closeLinkDialog: () => void;
  clearDialogTab: () => void;
  pushNavigationStack: (artifact: SelectedArtifact) => void;
  /** Reopen the artifact the current dialog was opened from */
  popNavigationStack: () => void;
  clearNavigationStack: () => void;
  setSearchQuery: (query: string) => void;
  /** Show or hide a table column; remembered for this project folder */
  setColumnVisible: (kind: ArtifactKindId, column: string, visible: boolean) => void;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set, get) => ({
  activeModal: { type: null },
  selectedArtifact: null,
  navigationStack: [],
  linkSourceId: null,
  linkSourceType: null,
  linkReturn: null,
  dialogTab: null,
  searchQuery: '',
  columnVisibility: {},

  openModal: (type, isEdit = false, artifact) =>
    set(
      artifact
        ? { activeModal: { type, isEdit }, selectedArtifact: artifact }
        : { activeModal: { type, isEdit } }
    ),

  closeModal: () => set({ activeModal: { type: null }, selectedArtifact: null }),

  setActiveModal: (activeModal) => set({ activeModal }),

  setSelectedArtifact: (selectedArtifact) => set({ selectedArtifact }),

  openLinkDialog: (sourceId, sourceType = null, from) =>
    set({
      linkSourceId: sourceId,
      linkSourceType: sourceType,
      linkReturn: from ?? null,
      activeModal: { type: 'link', isEdit: false },
    }),

  closeLinkDialog: () => {
    // Called both after a link is added and when the dialog closes
    if (get().activeModal.type !== 'link') return;
    const back = get().linkReturn;
    if (!back) return set({ activeModal: { type: null }, selectedArtifact: null, dialogTab: null });
    set({
      linkReturn: null,
      activeModal: { type: back.artifact.type, isEdit: true },
      selectedArtifact: back.artifact,
      dialogTab: back.tab,
    });
  },

  clearDialogTab: () => set({ dialogTab: null }),

  pushNavigationStack: (artifact) =>
    set((s) => ({ navigationStack: [...s.navigationStack, artifact] })),

  popNavigationStack: () =>
    set((s) => {
      const previous = s.navigationStack.at(-1);
      if (!previous) return {};
      return {
        navigationStack: s.navigationStack.slice(0, -1),
        activeModal: { type: previous.type, isEdit: true },
        selectedArtifact: previous,
      };
    }),

  clearNavigationStack: () => set({ navigationStack: [] }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setColumnVisible: (kind, column, visible) => {
    const choices = {
      ...get().columnVisibility,
      [kind]: { ...get().columnVisibility[kind], [column]: visible },
    };
    set({ columnVisibility: choices });
    const dir = get().directoryName;
    if (!dir) return;
    try {
      localStorage.setItem(columnsKey(dir), JSON.stringify(choices));
    } catch (err) {
      console.error('Could not remember the table columns:', err);
    }
  },
});
