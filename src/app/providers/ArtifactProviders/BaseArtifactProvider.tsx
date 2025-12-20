import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGlobalState } from '../GlobalStateProvider';
import { useUI } from '../UIProvider';
import { useFileSystem } from '../FileSystemProvider';
import { useUser } from '../UserProvider';
import { useToast } from '../ToastProvider';
import { debug } from '../../../utils/debug';
import { useArtifactCRUD } from './useArtifactCRUD';
import type { ArtifactType, BaseArtifact } from './useArtifactCRUD';

export interface BaseArtifactContextValue<T extends BaseArtifact> {
  items: T[];
  setItems: (items: T[] | ((prev: T[]) => T[])) => void;
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
  useData: (state: ReturnType<typeof useGlobalState>) => {
    items: T[];
    setItems: (items: T[] | ((prev: T[]) => T[])) => void;
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

export function createArtifactProvider<T extends BaseArtifact>(options: CreateProviderOptions<T>) {
  const Context = createContext<BaseArtifactContextValue<T> | undefined>(undefined);

  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const globalState = useGlobalState();
    const { items, setItems } = options.useData(globalState);

    const ui = useUI();
    const { setEditingItem, setIsModalOpen, setLinkSourceId, setIsLinkModalOpen } =
      options.useUIHelpers(ui);

    const fs = useFileSystem();
    const { save, delete: fsDelete, fsItems, isReady } = options.useFS(fs);

    const { currentUser } = useUser();
    const { showToast } = useToast();
    const hasSyncedInitial = useRef(false);

    // Initial sync from filesystem
    useEffect(() => {
      if (isReady && fsItems.length > 0 && !hasSyncedInitial.current) {
        debug.log(
          `[${options.displayName}Provider] Syncing from filesystem:`,
          fsItems.length,
          options.type
        );
        setItems(fsItems);
        hasSyncedInitial.current = true;
      }
    }, [isReady, fsItems, setItems]);

    const crud = useArtifactCRUD<T>({
      type: options.type,
      items,
      setItems,
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

    const value: BaseArtifactContextValue<T> = {
      items,
      setItems,
      ...crud,
      handleEdit,
      handleLink: setLinkSourceId ? handleLink : undefined,
    };

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
