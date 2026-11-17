/**
 * UI state: which dialog is open and for which artifact, the navigation
 * stack between linked artifacts, the search box and the table columns.
 */
import type { StateCreator } from 'zustand';
import type { AppState } from '../store';
import type {
  ActiveModal,
  ColumnVisibility,
  DocumentColumnVisibility,
  InformationColumnVisibility,
  ModalType,
  RiskColumnVisibility,
  SelectedArtifact,
  TestCaseColumnVisibility,
  UseCaseColumnVisibility,
} from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';

/** The visible table columns of each kind */
export interface ColumnsByKind {
  requirement: ColumnVisibility;
  useCase: UseCaseColumnVisibility;
  testCase: TestCaseColumnVisibility;
  information: InformationColumnVisibility;
  risk: RiskColumnVisibility;
  document: DocumentColumnVisibility;
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
  searchQuery: string;
  columnVisibility: ColumnsByKind;

  openModal: (type: ModalType, isEdit?: boolean, artifact?: SelectedArtifact) => void;
  closeModal: () => void;
  setActiveModal: (modal: ActiveModal) => void;
  setSelectedArtifact: (artifact: SelectedArtifact | null) => void;
  /** Open the link dialog, linking from `sourceId` (or from an artifact the user picks) */
  openLinkDialog: (sourceId: string | null, sourceType?: ArtifactKindId | null) => void;
  pushNavigationStack: (artifact: SelectedArtifact) => void;
  /** Reopen the artifact the current dialog was opened from */
  popNavigationStack: () => void;
  clearNavigationStack: () => void;
  setSearchQuery: (query: string) => void;
  setColumnVisibility: <K extends ArtifactKindId>(kind: K, columns: ColumnsByKind[K]) => void;
}

const DEFAULT_COLUMNS: ColumnsByKind = {
  requirement: {
    idTitle: true,
    description: true,
    text: true,
    rationale: true,
    author: true,
    verification: true,
    priority: true,
    status: true,
    category: false,
    comments: false,
    created: false,
    revision: false,
  },
  useCase: {
    idTitle: true,
    description: true,
    actor: true,
    priority: true,
    status: true,
    created: true,
    revision: false,
    author: true,
  },
  testCase: {
    idTitle: true,
    description: true,
    requirements: true,
    priority: true,
    status: true,
    author: true,
    created: true,
    revision: false,
  },
  information: {
    idTitle: true,
    description: true,
    type: true,
    status: true,
    author: true,
    created: true,
    revision: false,
  },
  risk: {
    idTitle: true,
    description: true,
    category: true,
    probability: true,
    impact: true,
    status: true,
    owner: true,
    mitigation: false,
    contingency: false,
    created: true,
    revision: false,
    author: true,
  },
  document: {
    idTitle: true,
    description: true,
    structure: true,
    created: true,
    revision: false,
    author: true,
    status: true,
  },
};

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  activeModal: { type: null },
  selectedArtifact: null,
  navigationStack: [],
  linkSourceId: null,
  linkSourceType: null,
  searchQuery: '',
  columnVisibility: DEFAULT_COLUMNS,

  openModal: (type, isEdit = false, artifact) =>
    set(
      artifact
        ? { activeModal: { type, isEdit }, selectedArtifact: artifact }
        : { activeModal: { type, isEdit } }
    ),

  closeModal: () => set({ activeModal: { type: null }, selectedArtifact: null }),

  setActiveModal: (activeModal) => set({ activeModal }),

  setSelectedArtifact: (selectedArtifact) => set({ selectedArtifact }),

  openLinkDialog: (sourceId, sourceType = null) =>
    set({
      linkSourceId: sourceId,
      linkSourceType: sourceType,
      activeModal: { type: 'link', isEdit: false },
    }),

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

  setColumnVisibility: (kind, columns) =>
    set((s) => ({ columnVisibility: { ...s.columnVisibility, [kind]: columns } })),
});
