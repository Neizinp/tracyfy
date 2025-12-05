import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useRequirements as useRequirementsHook } from '../../../hooks/useRequirements';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import { useUI } from '../UIProvider';
import type { Requirement, Link } from '../../../types';

interface RequirementsContextValue {
    // Data
    requirements: Requirement[];
    setRequirements: (reqs: Requirement[] | ((prev: Requirement[]) => Requirement[])) => void;
    links: Link[];
    setLinks: (links: Link[] | ((prev: Link[]) => Link[])) => void;

    // CRUD operations
    handleAddRequirement: (req: Omit<Requirement, 'id' | 'lastModified'>) => Promise<void>;
    handleUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
    handleDeleteRequirement: (id: string) => void;
    handleRestoreRequirement: (id: string) => void;
    handlePermanentDeleteRequirement: (id: string) => void;

    // Page handlers
    handleEdit: (req: Requirement) => void;
    handleLink: (sourceId: string) => void;
    handleAddLink: (linkData: Omit<Link, 'id'>) => void;
}

const RequirementsContext = createContext<RequirementsContextValue | undefined>(undefined);

export const RequirementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { requirements, setRequirements, links, setLinks, usedReqNumbers, setUsedReqNumbers } = useGlobalState();
    const { projects, currentProjectId } = useProject();
    const { setEditingRequirement, setIsEditRequirementModalOpen, setLinkSourceId, setIsLinkModalOpen, setSelectedRequirementId } = useUI();

    const requirementsHook = useRequirementsHook({
        requirements,
        setRequirements,
        usedReqNumbers,
        setUsedReqNumbers,
        links,
        setLinks,
        projects,
        currentProjectId,
        setIsEditModalOpen: setIsEditRequirementModalOpen,
        setEditingRequirement
    });

    const handleEdit = useCallback((req: Requirement) => {
        setEditingRequirement(req);
        setIsEditRequirementModalOpen(true);
    }, [setEditingRequirement, setIsEditRequirementModalOpen]);

    const handleLink = useCallback((sourceId: string) => {
        setLinkSourceId(sourceId);
        setIsLinkModalOpen(true);
    }, [setLinkSourceId, setIsLinkModalOpen]);

    const handleAddLink = useCallback((linkData: Omit<Link, 'id'>) => {
        const newLink: Link = {
            ...linkData,
            id: `LINK-${Date.now()}`
        };
        setLinks(prev => [...prev, newLink]);
        setIsLinkModalOpen(false);
        setSelectedRequirementId(null);
    }, [setLinks, setIsLinkModalOpen, setSelectedRequirementId]);

    const value: RequirementsContextValue = {
        requirements,
        setRequirements,
        links,
        setLinks,
        ...requirementsHook,
        handleEdit,
        handleLink,
        handleAddLink
    };

    return (
        <RequirementsContext.Provider value={value}>
            {children}
        </RequirementsContext.Provider>
    );
};

export const useRequirements = (): RequirementsContextValue => {
    const context = useContext(RequirementsContext);
    if (context === undefined) {
        throw new Error('useRequirements must be used within a RequirementsProvider');
    }
    return context;
};
