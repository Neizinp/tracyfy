import { useState, useCallback } from 'react';
import type {
  Requirement,
  UseCase,
  Information,
  Project,
  ColumnVisibility,
  ActiveModal,
  SelectedArtifact,
  ModalType,
} from '../types';

export function useUIState() {
  // Unified Modal and Selection State
  const [activeModal, setActiveModal] = useState<ActiveModal>({ type: null });
  const [selectedArtifact, setSelectedArtifact] = useState<SelectedArtifact | null>(null);

  // Legacy compatibility states (to be removed once all components are migrated)
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [linkSourceType, setLinkSourceType] = useState<
    'requirement' | 'usecase' | 'testcase' | 'information' | 'risk' | null
  >(null);

  // Library States
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<
    'requirements' | 'usecases' | 'testcases' | 'information' | 'risks'
  >('requirements');
  const [globalLibrarySelection, setGlobalLibrarySelection] = useState<Set<string>>(new Set());

  // Search
  const [searchQuery, setSearchQuery] = useState('');

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

  // Column Visibility - Other artifact types
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

  const [informationColumnVisibility, setInformationColumnVisibility] = useState({
    idTitle: true,
    revision: true,
    type: true,
    content: true,
    created: true,
  });

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

  // Modal Control Actions
  const openModal = useCallback((type: ModalType, isEdit = false, artifact?: SelectedArtifact) => {
    setActiveModal({ type, isEdit });
    if (artifact) {
      setSelectedArtifact(artifact);
    }
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal({ type: null });
    setSelectedArtifact(null);
  }, []);

  // Computed Legacy Flags for Compatibility
  const isNewRequirementModalOpen = activeModal.type === 'requirement' && !activeModal.isEdit;
  const isEditRequirementModalOpen = activeModal.type === 'requirement' && !!activeModal.isEdit;
  const isUseCaseModalOpen = activeModal.type === 'usecase';
  const isNewTestCaseModalOpen = activeModal.type === 'testcase' && !activeModal.isEdit;
  const isEditTestCaseModalOpen = activeModal.type === 'testcase' && !!activeModal.isEdit;
  const isInformationModalOpen = activeModal.type === 'information';
  const isRiskModalOpen = activeModal.type === 'risk';
  const isProjectSettingsOpen = activeModal.type === 'project-settings';
  const isCreateProjectModalOpen = activeModal.type === 'project';
  const isUserSettingsModalOpen = activeModal.type === 'user-settings';
  const isLinkModalOpen = activeModal.type === 'link';
  const isExportModalOpen = activeModal.type === 'export';
  const isVersionHistoryOpen = activeModal.type === 'history';
  const isAdvancedSearchOpen = activeModal.type === 'search';
  const isCustomAttributeModalOpen = activeModal.type === 'custom-attribute';
  const isWorkflowModalOpen = activeModal.type === 'workflow';
  const isGlobalLibraryModalOpen = activeModal.type === 'global-library';

  // Computed Legacy Selection State
  const selectedRequirementId =
    selectedArtifact?.type === 'requirement' ? selectedArtifact.id : null;
  const selectedUseCaseId = selectedArtifact?.type === 'usecase' ? selectedArtifact.id : null;
  const editingRequirement =
    selectedArtifact?.type === 'requirement'
      ? (selectedArtifact.data as unknown as Requirement)
      : null;
  const editingUseCase =
    selectedArtifact?.type === 'usecase' ? (selectedArtifact.data as unknown as UseCase) : null;
  const selectedTestCaseId = selectedArtifact?.type === 'testcase' ? selectedArtifact.id : null;
  const selectedInformation =
    selectedArtifact?.type === 'information'
      ? (selectedArtifact.data as unknown as Information)
      : null;
  const projectToEdit =
    selectedArtifact?.type === 'project' ? (selectedArtifact.data as unknown as Project) : null;

  return {
    // New State
    activeModal,
    selectedArtifact,
    openModal,
    closeModal,
    setActiveModal, // Keep for raw set if needed
    setSelectedArtifact,

    // Legacy States (Bridged)
    selectedRequirementId,
    setSelectedRequirementId: (id: string | null) =>
      setSelectedArtifact(id ? { id, type: 'requirement' } : null),
    selectedUseCaseId,
    setSelectedUseCaseId: (id: string | null) =>
      setSelectedArtifact(id ? { id, type: 'usecase' } : null),
    isNewRequirementModalOpen,
    setIsNewRequirementModalOpen: (val: boolean) => (val ? openModal('requirement') : closeModal()),
    isEditRequirementModalOpen,
    setIsEditRequirementModalOpen: (val: boolean) =>
      val ? openModal('requirement', true) : closeModal(),
    isUseCaseModalOpen,
    setIsUseCaseModalOpen: (val: boolean) => (val ? openModal('usecase') : closeModal()),
    isNewTestCaseModalOpen,
    setIsNewTestCaseModalOpen: (val: boolean) => (val ? openModal('testcase') : closeModal()),
    isEditTestCaseModalOpen,
    setIsEditTestCaseModalOpen: (val: boolean) =>
      val ? openModal('testcase', true) : closeModal(),
    isInformationModalOpen,
    setIsInformationModalOpen: (val: boolean) => (val ? openModal('information') : closeModal()),
    isRiskModalOpen,
    setIsRiskModalOpen: (val: boolean) => (val ? openModal('risk') : closeModal()),
    isProjectSettingsOpen,
    setIsProjectSettingsOpen: (val: boolean) =>
      val ? openModal('project-settings') : closeModal(),
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen: (val: boolean) => (val ? openModal('project') : closeModal()),
    isUserSettingsModalOpen,
    setIsUserSettingsModalOpen: (val: boolean) => (val ? openModal('user-settings') : closeModal()),
    isExportModalOpen,
    setIsExportModalOpen: (val: boolean) => (val ? openModal('export') : closeModal()),
    isVersionHistoryOpen,
    setIsVersionHistoryOpen: (val: boolean) => (val ? openModal('history') : closeModal()),
    isAdvancedSearchOpen,
    setIsAdvancedSearchOpen: (val: boolean) => (val ? openModal('search') : closeModal()),
    isCustomAttributeModalOpen,
    setIsCustomAttributeModalOpen: (val: boolean) =>
      val ? openModal('custom-attribute') : closeModal(),
    isWorkflowModalOpen,
    setIsWorkflowModalOpen: (val: boolean) => (val ? openModal('workflow') : closeModal()),
    isGlobalLibraryModalOpen,
    setIsGlobalLibraryModalOpen: (val: boolean) =>
      val ? openModal('global-library') : closeModal(),
    isNewLinkModalOpen: activeModal.type === 'link',
    setIsNewLinkModalOpen: (val: boolean) => (val ? openModal('link') : closeModal()),
    isLinkModalOpen,
    setIsLinkModalOpen: (val: boolean) => (val ? openModal('link') : closeModal()),

    editingRequirement,
    setEditingRequirement: (req: Requirement | null) =>
      setSelectedArtifact(
        req
          ? { id: req.id, type: 'requirement', data: req as unknown as Record<string, unknown> }
          : null
      ),
    editingUseCase,
    setEditingUseCase: (uc: UseCase | null) =>
      setSelectedArtifact(
        uc ? { id: uc.id, type: 'usecase', data: uc as unknown as Record<string, unknown> } : null
      ),
    selectedTestCaseId,
    setSelectedTestCaseId: (id: string | null) =>
      setSelectedArtifact(id ? { id, type: 'testcase' } : null),
    selectedInformation,
    setSelectedInformation: (info: Information | null) =>
      setSelectedArtifact(
        info
          ? { id: info.id, type: 'information', data: info as unknown as Record<string, unknown> }
          : null
      ),
    projectToEdit,
    setProjectToEdit: (proj: Project | null) =>
      setSelectedArtifact(
        proj
          ? { id: proj.id, type: 'project', data: proj as unknown as Record<string, unknown> }
          : null
      ),

    // Still standalone for now
    isLibraryPanelOpen,
    setIsLibraryPanelOpen,
    activeLibraryTab,
    setActiveLibraryTab,
    globalLibrarySelection,
    setGlobalLibrarySelection,
    linkSourceId,
    setLinkSourceId,
    linkSourceType,
    setLinkSourceType,
    searchQuery,
    setSearchQuery,
    columnVisibility,
    setColumnVisibility,
    useCaseColumnVisibility,
    setUseCaseColumnVisibility,
    testCaseColumnVisibility,
    setTestCaseColumnVisibility,
    informationColumnVisibility,
    setInformationColumnVisibility,
    riskColumnVisibility,
    setRiskColumnVisibility,

    // Helpers
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
    getDefaultColumnVisibility,
  };
}
