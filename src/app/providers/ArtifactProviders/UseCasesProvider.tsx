import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useUseCases as useUseCasesHook } from '../../../hooks/useUseCases';
import { useGlobalState } from '../GlobalStateProvider';
import { useProject } from '../ProjectProvider';
import { useUI } from '../UIProvider';
import type { UseCase } from '../../../types';

interface UseCasesContextValue {
    handleAddUseCase: (uc: Omit<UseCase, 'id' | 'lastModified'> | any) => void;
    handleEditUseCase: (uc: UseCase) => void;
    handleDeleteUseCase: (id: string) => void;
    handleRestoreUseCase: (id: string) => void;
    handlePermanentDeleteUseCase: (id: string) => void;
}

const UseCasesContext = createContext<UseCasesContextValue | undefined>(undefined);

export const UseCasesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { useCases, setUseCases, usedUcNumbers, setUsedUcNumbers, requirements, setRequirements } = useGlobalState();
    const { projects, currentProjectId } = useProject();
    const { setIsUseCaseModalOpen, setEditingUseCase } = useUI();

    const useCasesHook = useUseCasesHook({
        useCases,
        setUseCases,
        usedUcNumbers,
        setUsedUcNumbers,
        requirements,
        setRequirements,
        projects,
        currentProjectId,
        setIsUseCaseModalOpen,
        setEditingUseCase
    });

    return (
        <UseCasesContext.Provider value={useCasesHook}>
            {children}
        </UseCasesContext.Provider>
    );
};

export const useUseCases = (): UseCasesContextValue => {
    const context = useContext(UseCasesContext);
    if (context === undefined) {
        throw new Error('useUseCases must be used within a UseCasesProvider');
    }
    return context;
};
