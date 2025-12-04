import { useState } from 'react';
import type { Requirement, UseCase, TestCase, Information, Project, ColumnVisibility, ViewType } from '../types';

export function useUIState() {
    // View State
    const [currentView, setCurrentView] = useState<ViewType>('tree');

    // Modal States
    const [isNewRequirementModalOpen, setIsNewRequirementModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isEditRequirementModalOpen, setIsEditRequirementModalOpen] = useState(false);
    const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
    const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
    const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
    const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
    const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
    const [isNewTestCaseModalOpen, setIsNewTestCaseModalOpen] = useState(false);
    const [isEditTestCaseModalOpen, setIsEditTestCaseModalOpen] = useState(false);
    const [isInformationModalOpen, setIsInformationModalOpen] = useState(false);
    const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
    const [isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen] = useState(false);

    // Selection States
    const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
    const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
    const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
    const [selectedInformation, setSelectedInformation] = useState<Information | null>(null);
    const [linkSourceId, setLinkSourceId] = useState<string | null>(null);

    // Editing States
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
    const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
    const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

    // Library States
    const [activeLibraryTab, setActiveLibraryTab] = useState<'requirements' | 'usecases' | 'testcases' | 'information'>('requirements');
    const [globalLibrarySelection, setGlobalLibrarySelection] = useState<Set<string>>(new Set());

    // Column Visibility
    const getDefaultColumnVisibility = (): ColumnVisibility => ({
        idTitle: true,
        description: true,
        text: true,
        rationale: true,
        author: true,
        verification: true,
        priority: true,
        status: true,
        comments: true,
        created: true,
        approved: true
    });

    const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(getDefaultColumnVisibility());

    const handleColumnToggle = (column: keyof ColumnVisibility) => {
        setColumnVisibility(prev => ({
            ...prev,
            [column]: !prev[column]
        }));
    };

    return {
        // View
        currentView,
        setCurrentView,

        // Modals
        isNewRequirementModalOpen, setIsNewRequirementModalOpen,
        isLinkModalOpen, setIsLinkModalOpen,
        isEditRequirementModalOpen, setIsEditRequirementModalOpen,
        isUseCaseModalOpen, setIsUseCaseModalOpen,
        isTrashModalOpen, setIsTrashModalOpen,
        isVersionHistoryOpen, setIsVersionHistoryOpen,
        isProjectSettingsOpen, setIsProjectSettingsOpen,
        isCreateProjectModalOpen, setIsCreateProjectModalOpen,
        isNewTestCaseModalOpen, setIsNewTestCaseModalOpen,
        isEditTestCaseModalOpen, setIsEditTestCaseModalOpen,
        isInformationModalOpen, setIsInformationModalOpen,
        isLibraryPanelOpen, setIsLibraryPanelOpen,
        isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen,

        // Selections
        selectedRequirementId, setSelectedRequirementId,
        selectedUseCaseId, setSelectedUseCaseId,
        selectedTestCaseId, setSelectedTestCaseId,
        selectedInformation, setSelectedInformation,
        linkSourceId, setLinkSourceId,

        // Editing
        editingRequirement, setEditingRequirement,
        editingUseCase, setEditingUseCase,
        editingTestCase, setEditingTestCase,
        projectToEdit, setProjectToEdit,

        // Library
        activeLibraryTab, setActiveLibraryTab,
        globalLibrarySelection, setGlobalLibrarySelection,

        // Column Visibility
        columnVisibility,
        setColumnVisibility,
        handleColumnToggle,
        getDefaultColumnVisibility
    };
}
