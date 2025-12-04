import { useState, useEffect, useRef } from 'react';
import {
  Layout,
  RequirementTree,
  NewRequirementModal,
  LinkModal,
  EditRequirementModal,
  DetailedRequirementView,
  TraceabilityMatrix,
  UseCaseModal,
  UseCaseList,
  TrashModal,
  VersionHistory,
  ProjectSettingsModal,
  CreateProjectModal,
  NewTestCaseModal,
  EditTestCaseModal,
  TestCaseList,
  InformationList,
  InformationModal,
  ColumnSelector,
  GlobalLibraryPanel,
  GlobalLibraryModal,
  BaselineManager,
  BaselineRevisionHistory
} from './components';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, KeyboardSensor, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import type { Requirement, Link, UseCase, TestCase, Information, Version, Project, ColumnVisibility, ViewType, ArtifactChange, ProjectBaseline } from './types';

import * as XLSX from 'xlsx';
import { exportProjectToPDF } from './utils/pdfExportUtils';
import { exportProjectToExcel } from './utils/excelExportUtils';
import { exportProjectToJSON } from './utils/jsonExportUtils';
import { formatDateTime } from './utils/dateUtils';

import { incrementRevision } from './utils/revisionUtils';
import { gitService } from './services/gitService';
import { generateNextReqId, generateNextUcId, generateNextTestCaseId, generateNextInfoId } from './utils/idGenerationUtils';
import { createVersionSnapshot as createVersion, loadVersions, migrateLegacyVersions } from './utils/versionManagement';
import { initializeUsedNumbers, USED_NUMBERS_KEY } from './utils/appInitialization';
import { useProjectManager } from './hooks/useProjectManager';





function App() {
  const {
    projects,
    currentProjectId,
    isLoading,
    handleSwitchProject,
    handleCreateProjectSubmit,
    handleUpdateProject,
    handleDeleteProject,
    handleResetToDemo,
    handleAddToProject: handleAddToProjectInternal,
    setProjects,
    initialGlobalState,
    setHasInitializedProjects
  } = useProjectManager();


  // Global State
  const [globalRequirements, setGlobalRequirements] = useState<Requirement[]>([]);
  const [globalUseCases, setGlobalUseCases] = useState<UseCase[]>([]);
  const [globalTestCases, setGlobalTestCases] = useState<TestCase[]>([]);
  const [globalInformation, setGlobalInformation] = useState<Information[]>([]);
  const [links, setLinks] = useState<Link[]>([]); // Links are global

  // Initialize Global State from ProjectManager (LocalStorage/Demo)
  useEffect(() => {
    if (initialGlobalState && !hasInitialized.current && projects.length > 0) {
      const newGlobalReqs = initialGlobalState.requirements || [];
      const newGlobalUCs = initialGlobalState.useCases || [];
      const newGlobalTCs = initialGlobalState.testCases || [];
      const newGlobalInfo = initialGlobalState.information || [];
      const newLinks = initialGlobalState.links || [];

      setGlobalRequirements(newGlobalReqs);
      setGlobalUseCases(newGlobalUCs);
      setGlobalTestCases(newGlobalTCs);
      setGlobalInformation(newGlobalInfo);
      setLinks(newLinks);

      // Also update local state for the current project immediately
      // This ensures the view is populated on first load
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        setRequirements(newGlobalReqs.filter((r: Requirement) => project.requirementIds.includes(r.id)));
        setUseCases(newGlobalUCs.filter((u: UseCase) => project.useCaseIds.includes(u.id)));
        setTestCases(newGlobalTCs.filter((t: TestCase) => project.testCaseIds.includes(t.id)));
        setInformation(newGlobalInfo.filter((i: Information) => project.informationIds.includes(i.id)));

        // Initialize used numbers
        const newUsedNumbers = initializeUsedNumbers(
          newGlobalReqs.filter((r: Requirement) => project.requirementIds.includes(r.id)),
          newGlobalUCs.filter((u: UseCase) => project.useCaseIds.includes(u.id))
        );
        setUsedReqNumbers(newUsedNumbers.usedReqNumbers);
        setUsedUcNumbers(newUsedNumbers.usedUcNumbers);

        // Explicitly update and save the current project with correct artifact IDs
        // Use the IDs from the LOCAL arrays we just populated, not from the project object
        const currentReqIds = newGlobalReqs.filter((r: Requirement) => project.requirementIds.includes(r.id)).map((r: Requirement) => r.id);
        const currentUcIds = newGlobalUCs.filter((u: UseCase) => project.useCaseIds.includes(u.id)).map((u: UseCase) => u.id);
        const currentTcIds = newGlobalTCs.filter((t: TestCase) => project.testCaseIds.includes(t.id)).map((t: TestCase) => t.id);
        const currentInfoIds = newGlobalInfo.filter((i: Information) => project.informationIds.includes(i.id)).map((i: Information) => i.id);

        const updatedProjects = projects.map(p =>
          p.id === currentProjectId
            ? {
              ...p,
              requirementIds: currentReqIds,
              useCaseIds: currentUcIds,
              testCaseIds: currentTcIds,
              informationIds: currentInfoIds,
              lastModified: Date.now()
            }
            : p
        );
        setProjects(updatedProjects);
        localStorage.setItem('reqtrace-projects', JSON.stringify(updatedProjects));
      }
      hasInitialized.current = true;
      setHasInitializedProjects(true); // Signal that projects are now safe to persist
    }
  }, [initialGlobalState, projects, currentProjectId, setHasInitializedProjects]);



  // Project Settings State
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(false);
  const [isGlobalLibraryModalOpen, setIsGlobalLibraryModalOpen] = useState(false);
  const [activeLibraryTab, setActiveLibraryTab] = useState<'requirements' | 'usecases' | 'testcases' | 'information'>('requirements');
  const [activeDragItem, setActiveDragItem] = useState<any>(null);
  const [globalLibrarySelection, setGlobalLibrarySelection] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  const isResetting = useRef(false);
  const hasInitialized = useRef(false);

  // Get current project data
  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // Initialize local view state from Global State + Project IDs
  // We use a key to force re-initialization when project changes, 
  // but actually we want to maintain state.
  // Better: Initialize once, then update when currentProject changes.
  // But wait, if we use `useState(initial)`, it only runs once.
  // We need `useEffect` to update local state when `currentProjectId` changes.

  const [requirements, setRequirements] = useState<Requirement[]>(() =>
    globalRequirements.filter(r => currentProject.requirementIds.includes(r.id))
  );
  const [useCases, setUseCases] = useState<UseCase[]>(() =>
    globalUseCases.filter(u => currentProject.useCaseIds.includes(u.id))
  );
  const [testCases, setTestCases] = useState<TestCase[]>(() =>
    globalTestCases.filter(t => currentProject.testCaseIds.includes(t.id))
  );
  const [information, setInformation] = useState<Information[]>(() =>
    globalInformation.filter(i => currentProject.informationIds.includes(i.id))
  );

  // Update local state when project changes
  useEffect(() => {
    const project = projects.find(p => p.id === currentProjectId);
    if (project) {
      setRequirements(globalRequirements.filter(r => project.requirementIds.includes(r.id)));

      const projectUseCases = globalUseCases.filter(u => project.useCaseIds.includes(u.id));
      setUseCases(projectUseCases);

      setTestCases(globalTestCases.filter(t => project.testCaseIds.includes(t.id)));
      setInformation(globalInformation.filter(i => project.informationIds.includes(i.id)));
      // Links are global, so no need to filter for state, but views might filter

      // Update used numbers
      const newUsedNumbers = initializeUsedNumbers(
        globalRequirements.filter(r => project.requirementIds.includes(r.id)),
        globalUseCases.filter(u => project.useCaseIds.includes(u.id))
      );
      setUsedReqNumbers(newUsedNumbers.usedReqNumbers);
      setUsedUcNumbers(newUsedNumbers.usedUcNumbers);

      setColumnVisibility(loadColumnVisibility(currentProjectId));
    }
  }, [currentProjectId]); // eslint-disable-line react-hooks/exhaustive-deps
  // Be careful: if we update projects in the sync effect, this might loop if not careful.
  // Actually, we only need to update local state when SWITCHING projects.
  // When editing current project, local state drives the updates.

  const initialUsedNumbers = initializeUsedNumbers(requirements, useCases);
  const [usedReqNumbers, setUsedReqNumbers] = useState<Set<number>>(initialUsedNumbers.usedReqNumbers);
  const [usedUcNumbers, setUsedUcNumbers] = useState<Set<number>>(initialUsedNumbers.usedUcNumbers);
  const [usedTestNumbers, setUsedTestNumbers] = useState<Set<number>>(new Set());
  const [usedInfoNumbers, setUsedInfoNumbers] = useState<Set<number>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
  const [isNewTestCaseModalOpen, setIsNewTestCaseModalOpen] = useState(false);
  const [isEditTestCaseModalOpen, setIsEditTestCaseModalOpen] = useState(false);
  const [isInformationModalOpen, setIsInformationModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedInformation, setSelectedInformation] = useState<Information | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('tree');
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Git Revision Control State - Baselines are versions with type='baseline'
  const baselines = versions.filter(v => v.type === 'baseline').map(v => ({
    id: v.id,
    projectId: currentProjectId,
    version: v.tag || '01',
    name: v.message,
    description: '',
    timestamp: v.timestamp,
    artifactCommits: {},
    addedArtifacts: [],
    removedArtifacts: []
  } as ProjectBaseline));
  const [selectedBaseline, setSelectedBaseline] = useState<string | null>(null);


  // Column visibility state with default all visible
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

  // Load column visibility from localStorage (scoped by project)
  const loadColumnVisibility = (projectId: string): ColumnVisibility => {
    try {
      const saved = localStorage.getItem(`column-visibility-${projectId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...getDefaultColumnVisibility(), ...parsed };
      }
    } catch (error) {
      console.error('Failed to load column visibility:', error);
    }
    return getDefaultColumnVisibility();
  };

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    loadColumnVisibility(currentProjectId)
  );

  // Sync local state back to Global State and Projects
  useEffect(() => {
    // Skip on initial mount to preserve loaded data
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Also skip if we haven't initialized from globalState yet
    if (!hasInitialized.current) {
      return;
    }

    // 1. Update Global State (Upsert)
    setGlobalRequirements(prev => {
      const map = new Map(prev.map(r => [r.id, r]));
      requirements.forEach(r => map.set(r.id, r));
      return Array.from(map.values());
    });
    setGlobalUseCases(prev => {
      const map = new Map(prev.map(u => [u.id, u]));
      useCases.forEach(u => map.set(u.id, u));
      return Array.from(map.values());
    });
    setGlobalTestCases(prev => {
      const map = new Map(prev.map(t => [t.id, t]));
      testCases.forEach(t => map.set(t.id, t));
      return Array.from(map.values());
    });
    setGlobalInformation(prev => {
      const map = new Map(prev.map(i => [i.id, i]));
      information.forEach(i => map.set(i.id, i));
      return Array.from(map.values());
    });
    // Links are already global state, updated directly via setLinks

    // 2. Update Project IDs
    setProjects(prevProjects => prevProjects.map(p =>
      p.id === currentProjectId
        ? {
          ...p,
          requirementIds: requirements.map(r => r.id),
          useCaseIds: useCases.map(u => u.id),
          testCaseIds: testCases.map(t => t.id),
          informationIds: information.map(i => i.id),
          lastModified: Date.now()
        }
        : p
    ));
  }, [requirements, useCases, testCases, information, currentProjectId]);

  // Persist Global State to localStorage
  useEffect(() => {
    // Skip only if actively resetting
    if (isResetting.current) {
      return;
    }

    // Only save if we have data
    if (globalRequirements.length === 0 && globalUseCases.length === 0 &&
      globalTestCases.length === 0 && globalInformation.length === 0) {
      return;
    }

    const globalState = {
      requirements: globalRequirements,
      useCases: globalUseCases,
      testCases: globalTestCases,
      information: globalInformation,
      links: links
    };
    localStorage.setItem('reqtrace-global-state', JSON.stringify(globalState));
  }, [globalRequirements, globalUseCases, globalTestCases, globalInformation, links]);

  // NOTE: Auto-save to Git removed because individual handlers already save artifacts
  // when they're created or modified. This prevents unnecessary file writes during
  // drag-and-drop reordering which only changes array order, not file content.
  // Individual handlers that save to Git:
  // - handleAddRequirement (line ~806)
  // - handleUpdateRequirement (line ~859)
  // - handleAddUseCase (line ~915)
  // - handleUpdateTestCase (line ~992)
  // - handleAddInformation (line ~1054)

  // Git Revision Control Handlers
  const handlePendingChangesChange = (_changes: ArtifactChange[]) => {
    // PendingChangesPanel manages its own state, this is just a callback for notifications
  };

  const handleCommitArtifact = async (artifactId: string, type: string, message: string) => {
    try {
      const project = projects.find(p => p.id === currentProjectId);
      if (!project) return;

      // Map singular type to plural folder name
      let folderType: 'requirements' | 'usecases' | 'testcases' | 'information';
      if (type === 'requirement') folderType = 'requirements';
      else if (type === 'usecase') folderType = 'usecases';
      else if (type === 'testcase') folderType = 'testcases';
      else if (type === 'information') folderType = 'information';
      else folderType = type as any;

      await gitService.commitArtifact(folderType, artifactId, message);

      // Refresh pending changes - PendingChangesPanel will auto-refresh via its own polling
    } catch (error) {
      console.error('Failed to commit artifact:', error);
      alert('Failed to commit artifact: ' + error);
    }
  };

  const handleCreateBaseline = async (name?: string) => {
    // If name is not provided (e.g., from BaselineManager), prompt for it
    const baselineName = name || prompt("Enter baseline name:");
    if (!baselineName) return;

    // Create the baseline using the version snapshot mechanism
    await createBaselineSnapshot(baselineName, baselineName);
  };

  const handleViewBaselineHistory = (baselineId: string) => {
    setSelectedBaseline(baselineId);
    setCurrentView('baseline-history');
  };



  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };



  const handleOpenProjectSettings = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectSettingsOpen(true);
  };







  const handleAddToProject = async (
    artifacts: { requirements: string[], useCases: string[], testCases: string[], information: string[] },
    targetProjectId: string = currentProjectId
  ) => {
    await handleAddToProjectInternal(artifacts, targetProjectId);

    // Also update local state to reflect changes immediately IF it's the current project
    if (targetProjectId === currentProjectId) {
      // Filter global artifacts by the new IDs
      const newReqs = globalRequirements.filter(r => artifacts.requirements.includes(r.id) || requirements.some(existing => existing.id === r.id));
      const newUCs = globalUseCases.filter(u => artifacts.useCases.includes(u.id) || useCases.some(existing => existing.id === u.id));
      const newTCs = globalTestCases.filter(t => artifacts.testCases.includes(t.id) || testCases.some(existing => existing.id === t.id));
      const newInfo = globalInformation.filter(i => artifacts.information.includes(i.id) || information.some(existing => existing.id === i.id));

      setRequirements(newReqs);
      setUseCases(newUCs);
      setTestCases(newTCs);
      setInformation(newInfo);
    }

    const newVersion = await createVersion(
      currentProjectId,
      projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
      'Added artifacts from Global Library',
      'auto-save',
      requirements,
      useCases,
      testCases,
      information,
      links,
      gitService
    );
    setVersions(prev => [newVersion, ...prev].slice(0, 50));
  };



  const handleGlobalLibrarySelect = (id: string) => {
    setGlobalLibrarySelection(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleOpenLibrary = (tab: 'requirements' | 'usecases' | 'testcases' | 'information') => {
    setActiveLibraryTab(tab);
    setIsLibraryPanelOpen(true);
  };

  // Auto-save used numbers to LocalStorage whenever they change
  useEffect(() => {
    try {
      const usedNumbersToSave = {
        usedReqNumbers: Array.from(usedReqNumbers),
        usedUcNumbers: Array.from(usedUcNumbers)
      };
      localStorage.setItem(USED_NUMBERS_KEY, JSON.stringify(usedNumbersToSave));
    } catch (error) {
      console.error('Failed to save used numbers:', error);
    }
  }, [usedReqNumbers, usedUcNumbers]);

  // Migrate legacy global versions to current project (one-time migration)
  useEffect(() => {
    migrateLegacyVersions(currentProjectId);
  }, []); // Run once on mount

  // Load versions for current project
  useEffect(() => {
    setVersions(loadVersions(currentProjectId));
  }, [currentProjectId]);
  // Create version snapshot whenever data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const newVersion = await createVersion(
        currentProjectId,
        projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
        'Auto-save',
        'auto-save',
        requirements,
        useCases,
        testCases,
        information,
        links,
        gitService
      );
      setVersions(prev => [newVersion, ...prev].slice(0, 50));
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(timer);
  }, [requirements, useCases, testCases, information, links, currentProjectId, projects]);

  // Baseline creation helper
  const createBaselineSnapshot = async (message: string, tag: string) => {
    const newVersion = await createVersion(
      currentProjectId,
      projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
      message,
      'baseline',
      requirements,
      useCases,
      testCases,
      information,
      links,
      gitService,
      tag
    );
    setVersions(prev => [newVersion, ...prev].slice(0, 50));
  };
  const handleDeleteRequirement = (id: string) => {
    // Soft delete: Mark as deleted instead of removing
    setRequirements(prev =>
      prev.map(req =>
        req.id === id
          ? { ...req, isDeleted: true, deletedAt: Date.now() }
          : req
      )
    );

    // Close modal if open
    setIsEditModalOpen(false);
    setEditingRequirement(null);
  };



  // Restore a previous version
  const handleRestoreVersion = async (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setRequirements(version.data.requirements);
      setUseCases(version.data.useCases);
      setTestCases(version.data.testCases || []);
      setInformation(version.data.information || []);
      setLinks(version.data.links);
      const newVersion = await createVersion(
        currentProjectId,
        projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
        `Restored from ${formatDateTime(version.timestamp)}`,
        'auto-save',
        requirements,
        useCases,
        testCases,
        information,
        links,
        gitService
      );
      setVersions(prev => [newVersion, ...prev].slice(0, 50));
    }
  };

  const handleBreakDownUseCase = (_useCase: UseCase) => {
    // Open new requirement modal with use case pre-selected
    // For now, just open the modal - user can manually link
    setIsModalOpen(true);
  };

  // Export data as JSON file
  // Export data as JSON file
  const handleExport = async () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    await exportProjectToJSON(
      currentProject,
      {
        requirements: globalRequirements,
        useCases: globalUseCases,
        testCases: globalTestCases,
        information: globalInformation,
        links: links
      },
      currentProject.requirementIds,
      currentProject.useCaseIds,
      currentProject.testCaseIds,
      currentProject.informationIds
    );
  };

  // Import data from JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.requirements && Array.isArray(data.requirements)) {
              setRequirements(data.requirements);
              setUseCases(data.useCases || []);
              setTestCases(data.testCases || []);
              setInformation(data.information || []);
              setLinks(data.links || []);
              const newVersion = await createVersion(
                currentProjectId,
                projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
                'Imported from JSON',
                'auto-save',
                requirements,
                useCases,
                testCases,
                information,
                links,
                gitService
              );
              setVersions(prev => [newVersion, ...prev].slice(0, 50));
              alert('Data imported successfully!');
            } else {
              alert('Invalid data format');
            }
          } catch (error) {
            console.error('Import error:', error);
            alert('Error importing data');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Import data from Excel
  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // Parse Requirements
            const reqSheet = workbook.Sheets['Requirements'];
            if (reqSheet) {
              const reqData = XLSX.utils.sheet_to_json<any>(reqSheet);
              const parsedReqs: Requirement[] = reqData.map((row: any) => ({
                id: row['ID'],
                title: row['Title'],
                status: row['Status'] || 'draft',
                priority: row['Priority'] || 'medium',
                description: row['Description'] || '',
                text: row['Requirement Text'] || '',
                rationale: row['Rationale'] || '',
                parentIds: row['Parents'] ? row['Parents'].split(',').map((id: string) => id.trim()).filter((id: string) => id) : [],
                dateCreated: Date.now(),
                lastModified: Date.now(),
                revision: '01'
              }));
              setRequirements(parsedReqs);
            }

            // Parse Use Cases
            const ucSheet = workbook.Sheets['Use Cases'];
            if (ucSheet) {
              const ucData = XLSX.utils.sheet_to_json<any>(ucSheet);
              const parsedUCs: UseCase[] = ucData.map((row: any) => ({
                id: row['ID'],
                title: row['Title'],
                actor: row['Actor'] || '',
                description: row['Description'] || '',
                preconditions: row['Preconditions'] || '',
                mainFlow: row['Main Flow'] || '',
                alternativeFlows: row['Alternative Flows'] || '',
                postconditions: row['Postconditions'] || '',
                priority: row['Priority'] || 'medium',
                status: row['Status'] || 'draft',
                lastModified: Date.now(),
                revision: '01'
              }));
              setUseCases(parsedUCs);
            }

            // Parse Links
            const linkSheet = workbook.Sheets['Links'];
            if (linkSheet) {
              const linkData = XLSX.utils.sheet_to_json<any>(linkSheet);
              const parsedLinks: Link[] = linkData.map((row: any) => ({
                id: crypto.randomUUID(),
                sourceId: row['Source'],
                targetId: row['Target'],
                type: row['Type'],
                description: row['Description'] || ''
              }));
              setLinks(parsedLinks);
            }

            const newVersion = await createVersion(
              currentProjectId,
              projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
              'Imported from Excel',
              'auto-save',
              requirements,
              useCases,
              testCases,
              information,
              links,
              gitService
            );
            setVersions(prev => [newVersion, ...prev].slice(0, 50));
            alert('Excel data imported successfully!');
          } catch (error) {
            console.error('Excel Import error:', error);
            alert(`Error importing Excel data: ${error instanceof Error ? error.message : String(error)}`);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };




  const handleAddRequirement = async (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
    const newId = generateNextReqId(usedReqNumbers);

    const newRequirement: Requirement = {
      ...newReqData,
      id: newId,
      lastModified: Date.now()
    };

    // Mark this number as used (extract number from ID)
    const idNumber = parseInt(newId.split('-')[1], 10);
    setUsedReqNumbers(prev => new Set(prev).add(idNumber));
    setRequirements([...requirements, newRequirement]);

    // Save to git repository to make it appear in Pending Changes
    try {
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        await gitService.saveArtifact('requirements', newRequirement);
      }
    } catch (error) {
      console.error('Failed to save requirement to git:', error);
    }
  };



  const handleLink = (sourceId: string) => {
    setSelectedRequirementId(sourceId);
    setIsLinkModalOpen(true);
  };

  const handleAddLink = (linkData: Omit<Link, 'id'>) => {
    const newLink: Link = {
      ...linkData,
      id: `LINK-${Date.now()}`
    };
    setLinks([...links, newLink]);
    setIsLinkModalOpen(false);
    setSelectedRequirementId(null);
  };

  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setIsEditModalOpen(true);
  };

  const handleUpdateRequirement = async (id: string, updatedData: Partial<Requirement>) => {
    const updatedReq = requirements.find(req => req.id === id);
    if (!updatedReq) return;

    // Increment revision
    const newRevision = incrementRevision(updatedReq.revision || '01');
    const finalRequirement = {
      ...updatedReq,
      ...updatedData,
      revision: newRevision,
      lastModified: Date.now()
    };

    // Update local state
    setRequirements(prev => prev.map(r =>
      r.id === finalRequirement.id ? finalRequirement : r
    ));
    setIsEditModalOpen(false);
    setEditingRequirement(null);

    // Save to git repository to make it appear in Pending Changes
    try {
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        await gitService.saveArtifact('requirements', finalRequirement);
        await gitService.commitArtifact(
          'requirements',
          finalRequirement.id,
          `Update requirement ${finalRequirement.id}: ${finalRequirement.title} (Rev ${newRevision})`
        );
      }
    } catch (error) {
      console.error('Failed to save requirement to git:', error);
    }
  };

  // Use Case Handlers
  const handleAddUseCase = async (data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }) => {
    let savedUseCase: UseCase | null = null;

    if ('id' in data) {
      // Update existing
      const updatedUseCase = useCases.find(uc => uc.id === data.id);
      if (!updatedUseCase) return;

      // Increment revision
      const newRevision = incrementRevision(updatedUseCase.revision || '01');
      const finalUseCase = {
        ...updatedUseCase,
        ...data.updates,
        revision: newRevision,
        lastModified: Date.now()
      };

      setUseCases(prev => prev.map(u =>
        u.id === finalUseCase.id ? finalUseCase : u
      ));
      savedUseCase = finalUseCase;
      setEditingUseCase(null);
    } else {
      const newId = generateNextUcId(usedUcNumbers);
      const newUseCase: UseCase = {
        ...data,
        id: newId,
        lastModified: Date.now()
      } as UseCase;

      // Mark this number as used (extract number from ID)
      const idNumber = parseInt(newId.split('-')[1], 10);
      setUsedUcNumbers(prev => new Set(prev).add(idNumber));
      setUseCases([...useCases, newUseCase]);
      savedUseCase = newUseCase;
    }
    setIsUseCaseModalOpen(false);

    // Save to git repository to make it appear in Pending Changes
    if (savedUseCase) {
      try {
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
          await gitService.saveArtifact('usecases', savedUseCase);
          await gitService.commitArtifact(
            'usecases',
            savedUseCase.id,
            `Update use case ${savedUseCase.id}: ${savedUseCase.title} (Rev ${savedUseCase.revision})`
          );
        }
      } catch (error) {
        console.error('Failed to save use case to git:', error);
      }
    }
  };

  const handleEditUseCase = (useCase: UseCase) => {
    setEditingUseCase(useCase);
    setIsUseCaseModalOpen(true);
  };

  const handleDeleteUseCase = (id: string) => {
    if (confirm('Are you sure you want to delete this use case? Requirements linked to it will not be deleted.')) {
      setUseCases(useCases.filter(uc => uc.id !== id));
      // Remove use case references from requirements
      setRequirements(requirements.map(req => ({
        ...req,
        useCaseIds: req.useCaseIds?.filter(ucId => ucId !== id),
        lastModified: Date.now(),
        revision: req.useCaseIds?.includes(id) ? incrementRevision(req.revision || "01") : req.revision
      })));
    }
  };

  // Test Case Management
  const handleAddTestCase = async (newTestCaseData: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => {
    const newTestCase: TestCase = {
      ...newTestCaseData,
      id: generateNextTestCaseId(usedTestNumbers),
      dateCreated: Date.now(),
      lastModified: Date.now()
    };

    setTestCases([...testCases, newTestCase]);
    // Mark this number as used (extract number from ID)
    const idNumber = parseInt(newTestCase.id.split('-')[1], 10);
    setUsedTestNumbers(new Set([...usedTestNumbers, idNumber]));

    // Save to git repository to make it appear in Pending Changes
    try {
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        await gitService.saveArtifact('testcases', newTestCase);
      }
    } catch (error) {
      console.error('Failed to save test case to git:', error);
    }
  };

  const handleUpdateTestCase = async (id: string, updates: Partial<TestCase>) => {
    const updatedTestCase = testCases.find(tc => tc.id === id);
    if (!updatedTestCase) return;

    // Increment revision
    const newRevision = incrementRevision(updatedTestCase.revision || '01');
    const finalTestCase = {
      ...updatedTestCase,
      ...updates,
      revision: newRevision,
      lastModified: Date.now()
    };

    setTestCases(prev => prev.map(tc =>
      tc.id === finalTestCase.id ? finalTestCase : tc
    ));

    // Save to git repository to make it appear in Pending Changes
    try {
      const project = projects.find(p => p.id === currentProjectId);
      if (project) {
        await gitService.saveArtifact('testcases', finalTestCase);
        await gitService.commitArtifact(
          'testcases',
          finalTestCase.id,
          `Update test case ${finalTestCase.id}: ${finalTestCase.title} (Rev ${newRevision})`
        );
      }
    } catch (error) {
      console.error('Failed to save test case to git:', error);
    }
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === id ? { ...tc, isDeleted: true, deletedAt: Date.now() } : tc
    ));
  };

  // Information Management
  const handleAddInformation = async (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Information> }) => {
    let savedInformation: Information | null = null;

    if ('id' in data) {
      // Update existing
      const updatedInfo = information.find(info => info.id === data.id);
      if (!updatedInfo) return;

      // Increment revision
      const newRevision = incrementRevision(updatedInfo.revision || '01');
      const finalInfo = {
        ...updatedInfo,
        ...data.updates,
        revision: newRevision,
        lastModified: Date.now()
      };

      setInformation(prev => prev.map(i =>
        i.id === finalInfo.id ? finalInfo : i
      ));
      savedInformation = finalInfo;
      setSelectedInformation(null);
    } else {
      const newInformation: Information = {
        ...data,
        id: generateNextInfoId(usedInfoNumbers),
        dateCreated: Date.now(),
        lastModified: Date.now()
      };

      setInformation([...information, newInformation]);
      // Mark this number as used (extract number from ID)
      const idNumber = parseInt(newInformation.id.split('-')[1], 10);
      setUsedInfoNumbers(new Set([...usedInfoNumbers, idNumber]));
      savedInformation = newInformation;
    }
    setIsInformationModalOpen(false);

    // Save to git repository to make it appear in Pending Changes
    if (savedInformation) {
      try {
        const project = projects.find(p => p.id === currentProjectId);
        if (project) {
          await gitService.saveArtifact('information', savedInformation);
        }
      } catch (error) {
        console.error('Failed to save information to git:', error);
      }
    }
  };

  const handleEditInformation = (info: Information) => {
    setSelectedInformation(info);
    setIsInformationModalOpen(true);
  };

  const handleDeleteInformation = (id: string) => {
    setInformation(information.map(info =>
      info.id === id ? { ...info, isDeleted: true, deletedAt: Date.now() } : info
    ));
  };

  const handleRestoreInformation = (id: string) => {
    setInformation(prev =>
      prev.map(info =>
        info.id === id
          ? { ...info, isDeleted: false, deletedAt: undefined }
          : info
      )
    );
  };

  const handlePermanentDeleteInformation = (id: string) => {
    setInformation(prev => prev.filter(info => info.id !== id));
  };

  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  const handleRestoreRequirement = (id: string) => {
    setRequirements(prev =>
      prev.map(req =>
        req.id === id
          ? { ...req, isDeleted: false, deletedAt: undefined }
          : req
      )
    );
  };

  const handlePermanentDeleteRequirement = (id: string) => {
    setRequirements(prev =>
      prev
        .filter(req => req.id !== id)
        .map(req => ({
          ...req,
          parentIds: req.parentIds ? req.parentIds.filter(parentId => parentId !== id) : [],
          lastModified: Date.now(),
          revision: req.parentIds?.includes(id) ? incrementRevision(req.revision || "01") : req.revision
        }))
    );
    setLinks(prev => prev.filter(link => link.sourceId !== id && link.targetId !== id));
  };

  const handleRestoreUseCase = (id: string) => {
    setUseCases(prev =>
      prev.map(uc =>
        uc.id === id
          ? { ...uc, isDeleted: false, deletedAt: undefined }
          : uc
      )
    );
  };

  const handlePermanentDeleteUseCase = (id: string) => {
    setUseCases(prev => prev.filter(uc => uc.id !== id));
  };

  const filteredRequirements = requirements.filter(req => {
    if (req.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.id.toLowerCase().includes(query) ||
      req.title.toLowerCase().includes(query) ||
      req.description.toLowerCase().includes(query) ||
      req.text.toLowerCase().includes(query)
    );
  });

  const filteredUseCases = useCases.filter(uc => {
    if (uc.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      uc.id.toLowerCase().includes(query) ||
      uc.title.toLowerCase().includes(query) ||
      uc.description.toLowerCase().includes(query) ||
      uc.actor.toLowerCase().includes(query)
    );
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over) return;

    // Case 0: Dragging from Global Library to Project Sidebar
    if (active.data.current?.type === 'global-item' && over.data.current?.type === 'project-target') {
      const targetProjectId = over.data.current.projectId;
      const draggedId = active.data.current.id;
      const itemType = active.data.current.itemType; // 'requirement', 'usecase', etc.

      // Determine items to add
      const itemsToAdd = {
        requirements: [] as string[],
        useCases: [] as string[],
        testCases: [] as string[],
        information: [] as string[]
      };

      // If dragged item is in selection, add all selected items
      if (globalLibrarySelection.has(draggedId)) {
        // We need to know the type of each selected item.
        // Since selection is just IDs, we have to look them up.
        // Or we can just try to find them in each list.
        globalLibrarySelection.forEach(id => {
          if (globalRequirements.find(r => r.id === id)) itemsToAdd.requirements.push(id);
          else if (globalUseCases.find(u => u.id === id)) itemsToAdd.useCases.push(id);
          else if (globalTestCases.find(t => t.id === id)) itemsToAdd.testCases.push(id);
          else if (globalInformation.find(i => i.id === id)) itemsToAdd.information.push(id);
        });
      } else {
        // Add only the dragged item
        if (itemType === 'requirement') itemsToAdd.requirements.push(draggedId);
        else if (itemType === 'usecase') itemsToAdd.useCases.push(draggedId);
        else if (itemType === 'testcase') itemsToAdd.testCases.push(draggedId);
        else if (itemType === 'information') itemsToAdd.information.push(draggedId);
      }

      handleAddToProject(itemsToAdd, targetProjectId);

      // Clear selection after drop? Maybe not, user might want to drag to another project.
      // But usually drag and drop implies "done".
      // Let's keep selection for now.
      return;
    }

    // Case 1: Dragging from Global Library to Requirement Tree (Current Project)
    if (active.data.current?.type === 'global-item' && active.data.current?.itemType === 'requirement') {
      const reqId = active.data.current.id;

      // Check if already exists
      if (requirements.some(r => r.id === reqId)) {
        alert('This requirement is already in the project.');
        return;
      }

      // Find the requirement to import
      const globalReq = globalRequirements.find(r => r.id === reqId);
      if (globalReq) {
        // Clone and clear parents to make it a root item in this project
        const reqToImport = { ...globalReq, parentIds: [] };

        // Import it
        setRequirements(prev => [...prev, reqToImport]);

        // Update project
        setProjects(prev => prev.map(p =>
          p.id === currentProjectId
            ? { ...p, requirementIds: [...p.requirementIds, reqId], lastModified: Date.now() }
            : p
        ));

        const newVersion = await createVersion(
          currentProjectId,
          projects.find(p => p.id === currentProjectId)?.name || 'Unknown Project',
          `Imported ${reqId} via drag-and-drop`,
          'auto-save',
          requirements,
          useCases,
          testCases,
          information,
          links,
          gitService
        );
        setVersions(prev => [newVersion, ...prev].slice(0, 50));
        console.log(`Successfully imported ${reqId}`);
      }
      return;
    }

    // Case 2: Reordering within Requirement Tree
    if (active.id !== over.id) {
      // We need to handle reordering. 
      // Since RequirementTree uses a flat list for SortableContext (in some places) or nested?
      // RequirementTree logic:
      // It calls onReorder(active.id, over.id).
      // We need to implement that logic here or pass it down.
      // BUT, RequirementTree previously had its own DndContext.
      // Now we are lifting it. So we must handle the reorder here.

      // Find indices
      const oldIndex = requirements.findIndex(r => r.id === active.id);
      const newIndex = requirements.findIndex(r => r.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // This is a simple reorder in the flat list. 
        // However, the Tree view implies hierarchy.
        // If we just reorder the flat list, does it affect the tree?
        // The tree is built from parentIds.
        // Reordering in the flat list might not change the tree structure unless we change parentIds.
        // OR, if the tree rendering depends on the order of the flat list (it usually does for siblings).

        setRequirements((items) => {
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  // Show loading overlay during initialization
  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.5rem',
            color: 'var(--color-text-primary)',
            marginBottom: '16px'
          }}>
            Loading Project...
          </div>
          <div style={{ color: 'var(--color-text-muted)' }}>
            Initializing Git repository and loading artifacts
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Layout
        currentProjectName={currentProject.name}
        projects={projects}
        currentProjectId={currentProjectId}
        onSwitchProject={handleSwitchProject}
        onCreateProject={handleCreateProject}
        onOpenProjectSettings={handleOpenProjectSettings}
        onNewRequirement={() => setIsModalOpen(true)}
        onNewUseCase={() => setIsUseCaseModalOpen(true)}
        onNewTestCase={() => setIsNewTestCaseModalOpen(true)}
        onNewInformation={() => setIsInformationModalOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onImportExcel={handleImportExcel}
        onOpenGlobalLibrary={() => setIsGlobalLibraryModalOpen(true)}
        onResetToDemo={handleResetToDemo}
        onViewHistory={() => setIsVersionHistoryOpen(true)}
        onPendingChangesChange={handlePendingChangesChange}
        onCommitArtifact={handleCommitArtifact}
        onExportPDF={async () => {
          const currentProject = projects.find(p => p.id === currentProjectId);
          if (!currentProject) {
            alert('No project selected');
            return;
          }

          await exportProjectToPDF(
            currentProject,
            {
              requirements: globalRequirements,
              useCases: globalUseCases,
              testCases: globalTestCases,
              information: globalInformation
            },
            currentProject.requirementIds,
            currentProject.useCaseIds,
            currentProject.testCaseIds,
            currentProject.informationIds,
            baselines
          );
        }}
        onExportExcel={async () => {
          const currentProject = projects.find(p => p.id === currentProjectId);
          if (!currentProject) {
            alert('No project selected');
            return;
          }

          await exportProjectToExcel(
            currentProject,
            {
              requirements: globalRequirements,
              useCases: globalUseCases,
              testCases: globalTestCases,
              information: globalInformation,
              links: links
            },
            currentProject.requirementIds,
            currentProject.useCaseIds,
            currentProject.testCaseIds,
            currentProject.informationIds,
            baselines
          );
        }}
        onSearch={setSearchQuery}
        onTrashOpen={() => setIsTrashModalOpen(true)}
        currentView={currentView}
        onSwitchView={setCurrentView}
        onOpenLibrary={handleOpenLibrary}
        rightPanel={isLibraryPanelOpen ? (
          <GlobalLibraryPanel
            isOpen={true}
            onClose={() => setIsLibraryPanelOpen(false)}
            requirements={globalRequirements}
            useCases={globalUseCases}
            testCases={globalTestCases}
            information={globalInformation}
            projects={projects}
            selectedItems={globalLibrarySelection}
            onToggleSelect={handleGlobalLibrarySelect}
            activeTab={activeLibraryTab}
            onTabChange={(tab) => setActiveLibraryTab(tab as any)}
          />
        ) : undefined}
      >
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {currentView === 'tree' ? 'Requirements Tree' :
                  currentView === 'detailed' ? 'Detailed View' :
                    currentView === 'matrix' ? 'Traceability Matrix' :
                      currentView === 'usecases' ? 'Use Cases' :
                        currentView === 'testcases' ? 'Test Cases' :
                          currentView === 'information' ? 'Information' :
                            currentView === 'library-requirements' ? 'Requirements' :
                              currentView === 'library-usecases' ? 'Use Cases' :
                                currentView === 'library-testcases' ? 'Test Cases' :
                                  currentView === 'library-information' ? 'Information' :
                                    'Requirements Tree'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {currentView === 'detailed' && (
                <ColumnSelector
                  visibleColumns={columnVisibility}
                  onColumnVisibilityChange={(columns) => {
                    setColumnVisibility(columns);
                    // Persist to localStorage (scoped by project)
                    try {
                      localStorage.setItem(`column-visibility-${currentProjectId}`, JSON.stringify(columns));
                    } catch (error) {
                      console.error('Failed to save column visibility:', error);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {
          currentView === 'tree' && (
            <RequirementTree
              requirements={filteredRequirements}
              links={links}
              allRequirements={requirements}
              onReorder={(activeId, overId) => {
                const oldIndex = requirements.findIndex(r => r.id === activeId);
                const newIndex = requirements.findIndex(r => r.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                  const newRequirements = [...requirements];
                  const [movedItem] = newRequirements.splice(oldIndex, 1);
                  newRequirements.splice(newIndex, 0, movedItem);
                  setRequirements(newRequirements);
                }
              }}
              onLink={handleLink}
              onEdit={handleEdit}
            />
          )
        }

        {
          currentView === 'detailed' && (
            <DetailedRequirementView
              requirements={filteredRequirements}
              onEdit={handleEdit}
              visibleColumns={columnVisibility}
            />
          )
        }

        {
          currentView === 'matrix' && (
            <TraceabilityMatrix
              requirements={filteredRequirements}
              links={links}
            />
          )
        }

        {
          currentView === 'usecases' && (
            <UseCaseList
              useCases={filteredUseCases}
              requirements={requirements}
              onEdit={handleEditUseCase}
              onDelete={handleDeleteUseCase}
              onBreakDown={handleBreakDownUseCase}
            />
          )
        }

        {
          currentView === 'testcases' && (
            <TestCaseList
              testCases={testCases.filter(tc => !tc.isDeleted)}
              onEdit={(tc) => {
                setSelectedTestCase(tc);
                setIsEditTestCaseModalOpen(true);
              }}
              onDelete={handleDeleteTestCase}
            />
          )
        }

        {
          currentView === 'information' && (
            <InformationList
              information={information.filter(info => !info.isDeleted)}
              onEdit={handleEditInformation}
              onDelete={handleDeleteInformation}
            />
          )
        }

        {
          currentView === 'baselines' && (
            <BaselineManager
              baselines={baselines}
              onCreateBaseline={handleCreateBaseline}
              onViewBaseline={handleViewBaselineHistory}
            />
          )
        }

        {
          currentView === 'baseline-history' && selectedBaseline && (
            <BaselineRevisionHistory
              projectName={currentProject.name}
              currentBaseline={baselines.find(b => b.id === selectedBaseline)!}
              previousBaseline={baselines.find(b => b.version === (parseInt(baselines.find(b => b.id === selectedBaseline)?.version || '0') - 1).toString().padStart(2, '0')) || null}
              onViewArtifact={(artifactId, commitHash) => {
                // TODO: Implement viewing artifact at specific revision
                console.log('View artifact', artifactId, commitHash);
                alert(`View artifact ${artifactId} at ${commitHash} - Not implemented yet`);
              }}
            />
          )
        }

        {/* Library Views - Show all artifacts from global pool */}
        {
          currentView === 'library-requirements' && (
            <DetailedRequirementView
              requirements={globalRequirements.filter(r => !r.isDeleted)}
              onEdit={handleEdit}
              visibleColumns={columnVisibility}
              showProjectColumn={true}
              projects={projects}
            />
          )
        }

        {
          currentView === 'library-usecases' && (
            <UseCaseList
              useCases={globalUseCases.filter(u => !u.isDeleted)}
              requirements={globalRequirements}
              onEdit={handleEditUseCase}
              onDelete={handleDeleteUseCase}
              onBreakDown={handleBreakDownUseCase}
              showProjectColumn={true}
              projects={projects}
            />
          )
        }

        {
          currentView === 'library-testcases' && (
            <TestCaseList
              testCases={globalTestCases.filter(t => !t.isDeleted)}
              onEdit={(tc) => {
                setSelectedTestCase(tc);
                setIsEditTestCaseModalOpen(true);
              }}
              onDelete={handleDeleteTestCase}
              showProjectColumn={true}
              projects={projects}
            />
          )
        }

        {
          currentView === 'library-information' && (
            <InformationList
              information={globalInformation.filter(i => !i.isDeleted)}
              onEdit={handleEditInformation}
              onDelete={handleDeleteInformation}
              showProjectColumn={true}
              projects={projects}
            />
          )
        }

        <NewRequirementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddRequirement}
        />

        <LinkModal
          isOpen={isLinkModalOpen}
          sourceRequirementId={selectedRequirementId}
          projects={projects}
          currentProjectId={currentProjectId}
          globalRequirements={globalRequirements}
          globalUseCases={globalUseCases}
          globalTestCases={globalTestCases}
          onClose={() => setIsLinkModalOpen(false)}
          onSubmit={handleAddLink}
        />

        {
          isEditModalOpen && editingRequirement && (
            <EditRequirementModal
              isOpen={isEditModalOpen}
              requirement={editingRequirement}
              allRequirements={requirements}
              links={links}
              projects={projects}
              currentProjectId={currentProjectId}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingRequirement(null);
              }}
              onSubmit={handleUpdateRequirement}
              onDelete={handleDeleteRequirement}
            />
          )
        }

        <UseCaseModal
          isOpen={isUseCaseModalOpen}
          useCase={editingUseCase}
          onClose={() => {
            setIsUseCaseModalOpen(false);
            setEditingUseCase(null);
          }}
          onSubmit={handleAddUseCase}
        />

        <NewTestCaseModal
          isOpen={isNewTestCaseModalOpen}
          requirements={requirements.filter(r => !r.isDeleted)}
          onClose={() => setIsNewTestCaseModalOpen(false)}
          onSubmit={handleAddTestCase}
        />

        <EditTestCaseModal
          isOpen={isEditTestCaseModalOpen}
          testCase={selectedTestCase}
          requirements={requirements.filter(r => !r.isDeleted)}
          onClose={() => {
            setIsEditTestCaseModalOpen(false);
            setSelectedTestCase(null);
          }}
          onSubmit={handleUpdateTestCase}
          onDelete={handleDeleteTestCase}
        />

        <InformationModal
          isOpen={isInformationModalOpen}
          information={selectedInformation}
          onClose={() => {
            setIsInformationModalOpen(false);
            setSelectedInformation(null);
          }}
          onSubmit={handleAddInformation}
        />

        <VersionHistory
          isOpen={isVersionHistoryOpen}
          versions={versions}
          onClose={() => setIsVersionHistoryOpen(false)}
          onRestore={handleRestoreVersion}
          onCreateBaseline={handleCreateBaseline}
        />

        <TrashModal
          isOpen={isTrashModalOpen}
          onClose={() => setIsTrashModalOpen(false)}
          deletedRequirements={requirements.filter(r => r.isDeleted)}
          deletedUseCases={useCases.filter(u => u.isDeleted)}
          onRestoreRequirement={handleRestoreRequirement}
          onRestoreUseCase={handleRestoreUseCase}
          onPermanentDeleteRequirement={handlePermanentDeleteRequirement}
          onPermanentDeleteUseCase={handlePermanentDeleteUseCase}
          deletedInformation={information.filter(i => i.isDeleted)}
          onRestoreInformation={handleRestoreInformation}
          onPermanentDeleteInformation={handlePermanentDeleteInformation}
        />

        {
          isProjectSettingsOpen && projectToEdit && (
            <ProjectSettingsModal
              isOpen={isProjectSettingsOpen}
              project={projectToEdit}
              onClose={() => {
                setIsProjectSettingsOpen(false);
                setProjectToEdit(null);
              }}
              onUpdate={handleUpdateProject}
              onDelete={handleDeleteProject}
            />
          )
        }

        {isCreateProjectModalOpen && (
          <CreateProjectModal
            isOpen={isCreateProjectModalOpen}
            onClose={() => setIsCreateProjectModalOpen(false)}
            onSubmit={handleCreateProjectSubmit}
          />
        )}

        <GlobalLibraryModal
          isOpen={isGlobalLibraryModalOpen}
          onClose={() => setIsGlobalLibraryModalOpen(false)}
          projects={projects}
          currentProjectId={currentProjectId}
          globalRequirements={globalRequirements}
          globalUseCases={globalUseCases}
          globalTestCases={globalTestCases}
          globalInformation={globalInformation}
          onAddToProject={handleAddToProject}
        />



        <DragOverlay>
          {activeDragItem ? (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-accent)',
              borderRadius: '6px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
              width: '300px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {globalLibrarySelection.has(activeDragItem.id) && globalLibrarySelection.size > 1 && (
                <div style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {globalLibrarySelection.size}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 500 }}>{activeDragItem.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{activeDragItem.id}</div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </Layout>
    </DndContext >
  );
}

export default App;
