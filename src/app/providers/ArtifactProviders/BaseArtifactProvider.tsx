import React, { createContext, useContext, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useUI } from '../UIProvider';
import { useArtifactCRUD } from './useArtifactCRUD';
import type { BaseArtifact } from './useArtifactCRUD';
import type { ArtifactKindId } from '../../../domain/artifactKinds';
import { useAppStore } from '../../../state';

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
  type: ArtifactKindId;
  displayName: string;
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
    const items = useAppStore((s) => s.artifacts[options.type]) as unknown as T[];

    const ui = useUI();
    const { setEditingItem, setIsModalOpen, setLinkSourceId, setIsLinkModalOpen } =
      options.useUIHelpers(ui);

    const saveArtifact = useAppStore((s) => s.saveArtifact);
    const save = useCallback(
      (item: T) => saveArtifact(options.type, item as never),
      [saveArtifact]
    );

    const currentUser = useAppStore((s) => s.currentUser);
    const showToast = useAppStore((s) => s.showToast);

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
