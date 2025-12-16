import { useState } from 'react';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ColumnVisibility,
} from '../types';

export function useUIState() {
  // Modal States
  const [isNewRequirementModalOpen, setIsNewRequirementModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditRequirementModalOpen, setIsEditRequirementModalOpen] = useState(false);
  const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isNewTestCaseModalOpen, setIsNewTestCaseModalOpen] = useState(false);
  const [isEditTestCaseModalOpen, setIsEditTestCaseModalOpen] = useState(false);
  const [isInformationModalOpen, setIsInformationModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen] = useState(false);
  const [isUserSettingsModalOpen, setIsUserSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
  const [isCustomAttributeModalOpen, setIsCustomAttributeModalOpen] = useState(false);

  // Selection States
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [selectedInformation, setSelectedInformation] = useState<Information | null>(null);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [linkSourceType, setLinkSourceType] = useState<
    'requirement' | 'usecase' | 'testcase' | 'information' | 'risk' | null
  >(null);

  // Editing States
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  // Library States
  const [activeLibraryTab, setActiveLibraryTab] = useState<
    'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
  >('requirements');
  const [globalLibrarySelection, setGlobalLibrarySelection] = useState<Set<string>>(new Set());

  // Column Visibility - Requirements
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
    approved: true,
  });

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    getDefaultColumnVisibility()
  );

  const handleColumnToggle = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Column Visibility - Use Cases
  const [useCaseColumnVisibility, setUseCaseColumnVisibility] = useState({
    idTitle: true,
    revision: true,
    description: true,
    actor: true,
    priority: true,
    status: true,
    preconditions: false,
    mainFlow: false,
    alternativeFlows: false,
    postconditions: false,
  });

  // Column Visibility - Test Cases
  const [testCaseColumnVisibility, setTestCaseColumnVisibility] = useState({
    idTitle: true,
    revision: true,
    description: true,
    requirements: true,
    priority: true,
    status: true,
    author: false,
    lastRun: true,
    created: false,
  });

  // Column Visibility - Information
  const [informationColumnVisibility, setInformationColumnVisibility] = useState({
    idTitle: true,
    revision: true,
    type: true,
    content: true,
    created: true,
  });

  // Column Visibility - Risks
  const [riskColumnVisibility, setRiskColumnVisibility] = useState({
    idTitle: true,
    revision: true,
    category: true,
    probability: true,
    impact: true,
    status: true,
    owner: true,
    description: false,
    mitigation: false,
    contingency: false,
    created: true,
  });

  const [searchQuery, setSearchQuery] = useState('');

  return {
    searchQuery,
    setSearchQuery,

    // Modals
    isNewRequirementModalOpen,
    setIsNewRequirementModalOpen,
    isLinkModalOpen,
    setIsLinkModalOpen,
    isEditRequirementModalOpen,
    setIsEditRequirementModalOpen,
    isUseCaseModalOpen,
    setIsUseCaseModalOpen,
    isVersionHistoryOpen,
    setIsVersionHistoryOpen,
    isProjectSettingsOpen,
    setIsProjectSettingsOpen,
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    isNewTestCaseModalOpen,
    setIsNewTestCaseModalOpen,
    isEditTestCaseModalOpen,
    setIsEditTestCaseModalOpen,
    isInformationModalOpen,
    setIsInformationModalOpen,
    isRiskModalOpen,
    setIsRiskModalOpen,
    isLibraryPanelOpen,
    setIsLibraryPanelOpen,
    isGlobalLibraryModalOpen,
    setIsGlobalLibraryModalOpen,
    isUserSettingsModalOpen,
    setIsUserSettingsModalOpen,
    isExportModalOpen,
    setIsExportModalOpen,
    isAdvancedSearchOpen,
    setIsAdvancedSearchOpen,
    isNewLinkModalOpen,
    setIsNewLinkModalOpen,
    isCustomAttributeModalOpen,
    setIsCustomAttributeModalOpen,

    // Selections
    selectedRequirementId,
    setSelectedRequirementId,
    selectedUseCaseId,
    setSelectedUseCaseId,
    selectedTestCaseId,
    setSelectedTestCaseId,
    selectedInformation,
    setSelectedInformation,
    linkSourceId,
    setLinkSourceId,
    linkSourceType,
    setLinkSourceType,

    // Editing
    editingRequirement,
    setEditingRequirement,
    editingUseCase,
    setEditingUseCase,
    editingTestCase,
    setEditingTestCase,
    projectToEdit,
    setProjectToEdit,

    // Library
    activeLibraryTab,
    setActiveLibraryTab,
    globalLibrarySelection,
    setGlobalLibrarySelection,

    // Column Visibility - Requirements
    columnVisibility,
    setColumnVisibility,
    handleColumnToggle,
    getDefaultColumnVisibility,

    // Column Visibility - Other artifact types
    useCaseColumnVisibility,
    setUseCaseColumnVisibility,
    testCaseColumnVisibility,
    setTestCaseColumnVisibility,
    informationColumnVisibility,
    setInformationColumnVisibility,
    riskColumnVisibility,
    setRiskColumnVisibility,

    // Helper functions
    handleGlobalLibrarySelect: (id: string) => {
      setGlobalLibrarySelection((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        return newSelection;
      });
    },
    handleOpenLibrary: (
      tab: 'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
    ) => {
      setActiveLibraryTab(tab);
      setIsLibraryPanelOpen(true);
    },
  };
}
