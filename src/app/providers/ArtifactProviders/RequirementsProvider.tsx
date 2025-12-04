import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useRequirements as useRequirementsHook } from '../../../hooks/useRequirements';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import { useUI } from '../UIProvider';
import type { Requirement } from '../../../types';

interface RequirementsContextValue {
    // CRUD operations (matching useRequirements hook return names)
    handleAddRequirement: (req: Omit<Requirement, 'id' | 'lastModified'>) => Promise<void>;
    handleUpdateRequirement: (id: string, data: Partial<Requirement>) => Promise<void>;
    handleDeleteRequirement: (id: string) => void;
    handleRestoreRequirement: (id: string) => void;
    handlePermanentDeleteRequirement: (id: string) => void;
}

const RequirementsContext = createContext<RequirementsContextValue | undefined>(undefined);

export const RequirementsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { requirements, setRequirements, links, setLinks, usedReqNumbers, setUsedReqNumbers } = useGlobalState();
    const { projects, currentProjectId } = useProject();
    const { setEditingRequirement, setIsEditRequirementModalOpen } = useUI();

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

    return (
        <RequirementsContext.Provider value={requirementsHook}>
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
