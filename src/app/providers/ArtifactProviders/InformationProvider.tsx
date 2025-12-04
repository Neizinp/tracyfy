import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useInformation as useInformationHook } from '../../../hooks/useInformation';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import { useUI } from '../UIProvider';
import type { Information } from '../../../types';

interface InformationContextValue {
    handleAddInformation: (info: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | any) => void;
    handleEditInformation: (info: Information) => void;
    handleDeleteInformation: (id: string) => void;
    handleRestoreInformation: (id: string) => void;
    handlePermanentDeleteInformation: (id: string) => void;
}

const InformationContext = createContext<InformationContextValue | undefined>(undefined);

export const InformationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { information, setInformation, usedInfoNumbers, setUsedInfoNumbers } = useGlobalState();
    const { projects, currentProjectId } = useProject();
    const { setIsInformationModalOpen, setSelectedInformation } = useUI();

    const informationHook = useInformationHook({
        information,
        setInformation,
        usedInfoNumbers,
        setUsedInfoNumbers,
        projects,
        currentProjectId,
        setIsInformationModalOpen,
        setSelectedInformation
    });

    return (
        <InformationContext.Provider value={informationHook}>
            {children}
        </InformationContext.Provider>
    );
};

export const useInformation = (): InformationContextValue => {
    const context = useContext(InformationContext);
    if (context === undefined) {
        throw new Error('useInformation must be used within an InformationProvider');
    }
    return context;
};
