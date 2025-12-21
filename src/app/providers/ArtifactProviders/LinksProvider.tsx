import React from 'react';
import type { ReactNode } from 'react';
import type { Link } from '../../../types';
import { createArtifactProvider } from './BaseArtifactProvider';

// Define the Link context value interface
interface LinksContextValue {
  links: Link[];
  setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;
  handleAddLink: (link: Omit<Link, 'id' | 'lastModified'>) => Promise<Link | null>;
  handleUpdateLink: (id: string, data: Partial<Link>) => Promise<void>;
  handleDeleteLink: (id: string) => void;
  handlePermanentDeleteLink: (id: string) => void;
}

const { Provider: BaseProvider, useProviderContext } = createArtifactProvider<Link>({
  type: 'links',
  displayName: 'Links',
  useData: (state) => ({
    items: state.links,
    setItems: state.setLinks,
  }),
  useFS: (fs) => ({
    save: fs.saveLink,
    delete: fs.deleteLink,
    fsItems: fs.links,
    isReady: fs.isReady,
  }),
  useUIHelpers: (_ui) => ({
    setEditingItem: () => {},
    setIsModalOpen: () => {},
  }),
});

// Since links are a bit special (they don't use GlobalState yet),
// we override the base provider logic if needed, but for now,
// let's stick to the FileSystemProvider's state.

export const LinksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <BaseProvider>{children}</BaseProvider>;
};

export const useLinks = (): LinksContextValue => {
  const context = useProviderContext();

  return {
    links: context.items,
    setLinks: context.setItems,
    handleAddLink: context.handleAdd,
    handleUpdateLink: context.handleUpdate,
    handleDeleteLink: context.handleDelete,
    handlePermanentDeleteLink: context.handlePermanentDelete,
  };
};
