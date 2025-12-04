import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useUIState } from '../../hooks/useUIState';
import type { Requirement, UseCase, Information, Project, ColumnVisibility } from '../../types';

interface UIContextValue {
    // Modal states
    isNewRequirementModalOpen: boolean;
    setIsNewRequirementModalOpen: (isOpen: boolean) => void;
    isLinkModalOpen: boolean;
    setIsLinkModalOpen: (isOpen: boolean) => void;
    isEditRequirementModalOpen: boolean;
    setIsEditRequirementModalOpen: (isOpen: boolean) => void;
    isUseCaseModalOpen: boolean;
    setIsUseCaseModalOpen: (isOpen: boolean) => void;
    isTrashModalOpen: boolean;
    setIsTrashModalOpen: (isOpen: boolean) => void;
    isVersionHistoryOpen: boolean;
    setIsVersionHistoryOpen: (isOpen: boolean) => void;
    isProjectSettingsOpen: boolean;
    setIsProjectSettingsOpen: (isOpen: boolean) => void;
    isCreateProjectModalOpen: boolean;
    setIsCreateProjectModalOpen: (isOpen: boolean) => void;
    isNewTestCaseModalOpen: boolean;
    setIsNewTestCaseModalOpen: (isOpen: boolean) => void;
    isEditTestCaseModalOpen: boolean;
    setIsEditTestCaseModalOpen: (isOpen: boolean) => void;
    isInformationModalOpen: boolean;
    setIsInformationModalOpen: (isOpen: boolean) => void;
    isLibraryPanelOpen: boolean;
    setIsLibraryPanelOpen: (isOpen: boolean) => void;
    isGlobalLibraryModalOpen: boolean;
    setIsGlobalLibraryModalOpen: (isOpen: boolean) => void;

    // Selections
    selectedRequirementId: string | null;
    setSelectedRequirementId: (id: string | null) => void;
    selectedTestCaseId: string | null;
    setSelectedTestCaseId: (id: string | null) => void;
    selectedInformation: Information | null;
    setSelectedInformation: (info: Information | null) => void;
    editingRequirement: Requirement | null;
    setEditingRequirement: (req: Requirement | null) => void;
    editingUseCase: UseCase | null;
    setEditingUseCase: (uc: UseCase | null) => void;
    projectToEdit: Project | null;
    setProjectToEdit: (project: Project | null) => void;

    // Library state
    activeLibraryTab: 'requirements' | 'usecases' | 'testcases' | 'information';
    setActiveLibraryTab: (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => void;
    globalLibrarySelection: Set<string>;
    setGlobalLibrarySelection: (selection: Set<string> | ((prev: Set<string>) => Set<string>)) => void;

    // Column visibility
    columnVisibility: ColumnVisibility;
    setColumnVisibility: (cols: ColumnVisibility) => void;
    getDefaultColumnVisibility: () => ColumnVisibility;
    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const uiState = useUIState();

    return (
        <UIContext.Provider value={uiState}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextValue => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
