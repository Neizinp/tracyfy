import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { useArtifactCRUD } from './useArtifactCRUD';
import type { BaseArtifact } from './useArtifactCRUD';
import type { StoredType } from '../../../services/storedTypes';

export interface BaseArtifactContextValue<T extends BaseArtifact> {
  items: T[];
  handleAdd: (
    item: Omit<T, 'id' | 'lastModified' | 'revision'> & { dateCreated?: number }
  ) => Promise<T | null>;
  handleUpdate: (id: string, data: Partial<T>) => Promise<void>;
  handleDelete: (id: string) => void;
  handleRestore: (id: string) => void;
  handleEdit: (item: T) => void;
  handleLink?: (sourceId: string) => void;
}

export interface CreateProviderOptions<T extends BaseArtifact> {
  type: StoredType;
  displayName: string;
  /** Items for the current view (read-only; FileSystemProvider owns the data) */
  useData: (state: ReturnType<typeof useGlobalState>) => {
    items: T[];
  };
  useFS: (fs: ReturnType<typeof useFileSystem>) => {
    save: (item: T) => Promise<void>;
    isReady: boolean;
  };
  useUIHelpers: (ui: ReturnType<typeof useUI>) => {
    setEditingItem: (item: T | null) => void;
    setIsModalOpen: (open: boolean) => void;
    setLinkSourceId?: (id: string) => void;
    setIsLinkModalOpen?: (open: boolean) => void;
  };
}

export function createArtifactProvider<T extends BaseArtifact>(options: CreateProviderOptions<T>) {
  const Context = createContext<BaseArtifactContextValue<T> | undefined>(undefined);

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const globalState = useGlobalState();
    const { items } = options.useData(globalState);

    const ui = useUI();
    const { setEditingItem, setIsModalOpen, setLinkSourceId, setIsLinkModalOpen } =
      options.useUIHelpers(ui);

    const fs = useFileSystem();
    const { save } = options.useFS(fs);

    const { currentUser } = useUser();
    const { showToast } = useToast();

    const crud = useArtifactCRUD<T>({
      type: options.type,
      items,
      saveFn: save,
      onAfterUpdate: () => {
        setIsModalOpen(false);
        setEditingItem(null);
      },
    });

    const handleEdit = useCallback(
      (item: T) => {
        if (!currentUser) {
          showToast('Set your name in User Settings before editing artifacts.', 'warning');
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
