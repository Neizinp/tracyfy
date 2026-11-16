import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { useProject } from '../ProjectProvider';
import { useArtifactCRUD } from './useArtifactCRUD';
import type { ArtifactType, BaseArtifact } from './useArtifactCRUD';

export interface BaseArtifactContextValue<T extends BaseArtifact> {
  items: T[];
  handleAdd: (
    item: Omit<T, 'id' | 'lastModified' | 'revision'> & { dateCreated?: number }
  ) => Promise<T | null>;
  handleUpdate: (id: string, data: Partial<T>) => Promise<void>;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handlePermanentDelete: (id: string) => void;
  handleEdit: (item: T) => void;
  handleLink?: (sourceId: string) => void;
}

export interface CreateProviderOptions<T extends BaseArtifact> {
  type: ArtifactType;
  displayName: string;
  /** Items for the current view (read-only; FileSystemProvider owns the data) */
  useData: (state: ReturnType<typeof useGlobalState>) => {
    items: T[];
  };
  useFS: (fs: ReturnType<typeof useFileSystem>) => {
    save: (item: T) => Promise<void>;
    delete: (id: string) => Promise<void>;
    fsItems: T[];
    isReady: boolean;
  };
  useUIHelpers: (ui: ReturnType<typeof useUI>) => {
    setEditingItem: (item: T | null) => void;
    setIsModalOpen: (open: boolean) => void;
    setLinkSourceId?: (id: string) => void;
    setIsLinkModalOpen?: (open: boolean) => void;
  };
}

/** Which Project id-list an artifact type is tracked in (types not listed aren't project-scoped this way) */
const PROJECT_MEMBERSHIP_KEY: Partial<
  Record<ArtifactType, 'requirements' | 'useCases' | 'testCases' | 'information' | 'risks'>
> = {
  requirements: 'requirements',
  useCases: 'useCases',
  testCases: 'testCases',
  information: 'information',
  risks: 'risks',
};

export function createArtifactProvider<T extends BaseArtifact>(options: CreateProviderOptions<T>) {
  const Context = createContext<BaseArtifactContextValue<T> | undefined>(undefined);

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const globalState = useGlobalState();
    const { items } = options.useData(globalState);

    const ui = useUI();
    const { setEditingItem, setIsModalOpen, setLinkSourceId, setIsLinkModalOpen } =
      options.useUIHelpers(ui);

    const fs = useFileSystem();
    const { save, delete: fsDelete, fsItems } = options.useFS(fs);

    const { currentUser } = useUser();
    const { showToast } = useToast();

    // New artifacts belong to the project the user is working in
    const { currentProjectId, addToProject } = useProject();
    const projectKey = PROJECT_MEMBERSHIP_KEY[options.type];
    const onAfterAdd = useCallback(
      async (item: T) => {
        if (!projectKey || !currentProjectId) return;
        await addToProject({
          requirements: [],
          useCases: [],
          testCases: [],
          information: [],
          risks: [],
          [projectKey]: [item.id],
        });
      },
      [projectKey, currentProjectId, addToProject]
    );

    const crud = useArtifactCRUD<T>({
      type: options.type,
      items,
      allItems: fsItems,
      onAfterAdd,
      saveFn: save,
      deleteFn: fsDelete,
      onAfterUpdate: () => {
        setIsModalOpen(false);
        setEditingItem(null);
      },
    });

    const handleEdit = useCallback(
      (item: T) => {
        if (!currentUser) {
          showToast(
            'Please select a user before editing artifacts. Go to Settings → Users to select a user.',
            'warning'
          );
          return;
        }
        setEditingItem(item);
        setIsModalOpen(true);
      },
      [currentUser, setEditingItem, setIsModalOpen, showToast]
    );

    const handleLink = useCallback(
      (sourceId: string) => {
        if (setLinkSourceId && setIsLinkModalOpen) {
          setLinkSourceId(sourceId);
          setIsLinkModalOpen(true);
        }
      },
      [setLinkSourceId, setIsLinkModalOpen]
    );

    const hasLinking = !!setLinkSourceId;
    const value = useMemo<BaseArtifactContextValue<T>>(
      () => ({
        items,
        ...crud,
        handleEdit,
        handleLink: hasLinking ? handleLink : undefined,
      }),
      [items, crud, handleEdit, hasLinking, handleLink]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  const useProviderContext = () => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(
        `use${options.displayName} must be used within a ${options.displayName}Provider`
      );
    }
    return context;
  };

  return { Provider, useProviderContext };
}
