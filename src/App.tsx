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
  GlobalLibraryModal
} from './components';
import type { Requirement, RequirementTreeNode, Link, UseCase, TestCase, Information, Version, Project, ColumnVisibility, GlobalState, ViewType } from './types';
import { mockRequirements, mockUseCases, mockTestCases, mockInformation, mockLinks } from './mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDateTime, formatDate } from './utils/dateUtils';

const PROJECTS_KEY = 'reqtrace-projects';
const CURRENT_PROJECT_KEY = 'reqtrace-current-project-id';
const USED_NUMBERS_KEY = 'reqtrace-used-numbers';
const LEGACY_VERSIONS_KEY = 'reqtrace-versions';
const getVersionsKey = (projectId: string) => `reqtrace-versions-${projectId}`;
const MAX_VERSIONS = 50;

// Helper to build tree structure from flat requirements
const buildTree = (requirements: Requirement[]): RequirementTreeNode[] => {
  const reqMap = new Map<string, RequirementTreeNode>();

  // Initialize all nodes
  requirements.forEach(req => {
    reqMap.set(req.id, { ...req, children: [] });
  });

  const rootNodes: RequirementTreeNode[] = [];

  // Build hierarchy
  requirements.forEach(req => {
    const node = reqMap.get(req.id)!;

    if (req.parentIds.length === 0) {
      rootNodes.push(node);
    } else {
      req.parentIds.forEach(parentId => {
        const parent = reqMap.get(parentId);
        if (parent) {
          // Check if child already exists to avoid duplicates (though UI shouldn't allow it)
          if (!parent.children.find(c => c.id === node.id)) {
            parent.children.push(node);
          }
        } else {
          // Parent not found (orphan), treat as root for now or handle error
          if (!rootNodes.find(n => n.id === node.id)) {
            rootNodes.push(node);
          }
        }
      });
    }
  });

  return rootNodes;
};

const GLOBAL_STATE_KEY = 'reqtrace-global-state';

// Helper to deduplicate items by ID
const uniqBy = <T extends { id: string }>(arr: T[]): T[] => {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

// Helper to load used numbers from LocalStorage
const loadUsedNumbers = () => {
  try {
    const saved = localStorage.getItem(USED_NUMBERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        usedReqNumbers: new Set<number>(parsed.usedReqNumbers || []),
        usedUcNumbers: new Set<number>(parsed.usedUcNumbers || [])
      };
    }
  } catch (error) {
    console.error('Failed to load used numbers:', error);
  }
  return {
    usedReqNumbers: new Set<number>(),
    usedUcNumbers: new Set<number>()
  };
};

// Initialize used numbers from existing requirements/use cases
const initializeUsedNumbers = (requirements: Requirement[], useCases: UseCase[]) => {
  const savedNumbers = loadUsedNumbers();

  // Extract numbers from existing IDs and merge with saved used numbers
  requirements.forEach(req => {
    const match = req.id.match(/REQ-(\d+)/);
    if (match) {
      savedNumbers.usedReqNumbers.add(parseInt(match[1], 10));
    }
  });

  useCases.forEach(uc => {
    const match = uc.id.match(/UC-(\d+)/);
    if (match) {
      savedNumbers.usedUcNumbers.add(parseInt(match[1], 10));
    }
  });

  return savedNumbers;
};

// Helper to load projects (handling migration to Global Pool)
// Helper to load projects (handling migration to Global Pool)
const loadProjects = (): { projects: Project[], currentProjectId: string, globalState: GlobalState } => {
  try {
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    const savedGlobal = localStorage.getItem(GLOBAL_STATE_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_PROJECT_KEY);

    // Case 1: Global State exists (Already migrated)
    if (savedGlobal && savedProjects) {
      try {
        const parsedGlobal = JSON.parse(savedGlobal);
        const parsedProjects = JSON.parse(savedProjects);

        if (parsedGlobal && Array.isArray(parsedProjects)) {
          return {
            projects: parsedProjects,
            currentProjectId: savedCurrentId || 'default-project',
            globalState: parsedGlobal
          };
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    }

    // Case 2: Only Projects exist (Migration needed)
    if (savedProjects) {
      try {
        const oldProjects = JSON.parse(savedProjects);

        if (Array.isArray(oldProjects)) {
          const globalState: GlobalState = {
            requirements: [],
            useCases: [],
            testCases: [],
            information: [],
            links: []
          };

          const newProjects = oldProjects.map((p: any) => {
            // Extract artifacts to global state
            if (p.requirements && Array.isArray(p.requirements)) globalState.requirements.push(...p.requirements);
            if (p.useCases && Array.isArray(p.useCases)) globalState.useCases.push(...p.useCases);
            if (p.testCases && Array.isArray(p.testCases)) globalState.testCases.push(...p.testCases);
            if (p.information && Array.isArray(p.information)) globalState.information.push(...p.information);
            if (p.links && Array.isArray(p.links)) globalState.links.push(...p.links);

            // Return project with IDs only
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              requirementIds: (p.requirements || []).map((r: any) => r.id),
              useCaseIds: (p.useCases || []).map((u: any) => u.id),
              testCaseIds: (p.testCases || []).map((t: any) => t.id),
              informationIds: (p.information || []).map((i: any) => i.id),
              lastModified: p.lastModified || Date.now()
            };
          });

          // Deduplicate global state
          globalState.requirements = uniqBy(globalState.requirements);
          globalState.useCases = uniqBy(globalState.useCases);
          globalState.testCases = uniqBy(globalState.testCases);
          globalState.information = uniqBy(globalState.information);
          globalState.links = uniqBy(globalState.links);

          return {
            projects: newProjects,
            currentProjectId: savedCurrentId || newProjects[0]?.id || 'default-project',
            globalState
          };
        }
      } catch (e) {
        console.error('Failed to migrate projects:', e);
      }
    }

    // Case 3: Fresh Start / Demo (or fallback)
    const { project, globalState } = createDemoProject();
    return {
      projects: [project],
      currentProjectId: project.id,
      globalState
    };

  } catch (error) {
    console.error('Failed to load projects:', error);
    const { project, globalState } = createDemoProject();
    return {
      projects: [project],
      currentProjectId: project.id,
      globalState
    };
  }
};

// Helper to create a demo project with comprehensive mock data
const createDemoProject = (): { project: Project, globalState: GlobalState } => {
  const project: Project = {
    id: 'demo-project',
    name: 'Demo Project - E-Commerce Platform',
    description: 'A comprehensive demo project showcasing all features with realistic requirements, use cases, test cases, and documentation.',
    requirementIds: mockRequirements.map(r => r.id),
    useCaseIds: mockUseCases.map(u => u.id),
    testCaseIds: mockTestCases.map(t => t.id),
    informationIds: mockInformation.map(i => i.id),
    lastModified: Date.now()
  };

  const globalState: GlobalState = {
    requirements: mockRequirements,
    useCases: mockUseCases,
    testCases: mockTestCases,
    information: mockInformation,
    links: mockLinks
  };

  return { project, globalState };
};

function App() {
  const { projects: initialProjects, currentProjectId: initialCurrentId, globalState: initialGlobal } = loadProjects();
  // const initialProjects: Project[] = [{ id: 'dummy', name: 'Dummy', description: '', requirementIds: [], useCaseIds: [], testCaseIds: [], informationIds: [], lastModified: 0 }];
  // const initialCurrentId = 'dummy';
  // const initialGlobal: GlobalState = { requirements: [], useCases: [], testCases: [], information: [], links: [] };

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [currentProjectId, setCurrentProjectId] = useState<string>(initialCurrentId);

  // Global State
  const [globalRequirements, setGlobalRequirements] = useState<Requirement[]>(initialGlobal.requirements);
  const [globalUseCases, setGlobalUseCases] = useState<UseCase[]>(initialGlobal.useCases);
  const [globalTestCases, setGlobalTestCases] = useState<TestCase[]>(initialGlobal.testCases);
  const [globalInformation, setGlobalInformation] = useState<Information[]>(initialGlobal.information);
  const [links, setLinks] = useState<Link[]>(initialGlobal.links); // Links are global

  // Project Settings State
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isGlobalLibraryOpen, setIsGlobalLibraryOpen] = useState(false);

  // Ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  const isResetting = useRef(false);

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
      setUseCases(globalUseCases.filter(u => project.useCaseIds.includes(u.id)));
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

  // Persist to localStorage
  useEffect(() => {
    // Skip if resetting to prevent overwriting demo data
    if (isResetting.current) {
      return;
    }

    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);

      const globalState: GlobalState = {
        requirements: globalRequirements,
        useCases: globalUseCases,
        testCases: globalTestCases,
        information: globalInformation,
        links: links
      };
      localStorage.setItem(GLOBAL_STATE_KEY, JSON.stringify(globalState));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [projects, currentProjectId, globalRequirements, globalUseCases, globalTestCases, globalInformation, links]);

  const handleSwitchProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    // The useEffect [currentProjectId] will handle loading the data
  };

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  const handleCreateProjectSubmit = (name: string, description: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      requirementIds: [],
      useCaseIds: [],
      testCaseIds: [],
      informationIds: [],
      lastModified: Date.now()
    };

    setProjects([...projects, newProject]);
    handleSwitchProject(newProject.id);
    setIsCreateProjectModalOpen(false);
  };

  const handleOpenProjectSettings = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectSettingsOpen(true);
  };

  const handleUpdateProject = (projectId: string, name: string, description: string) => {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, name, description, lastModified: Date.now() } : p
    ));
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      alert("Cannot delete the last project.");
      return;
    }

    const newProjects = projects.filter(p => p.id !== projectId);
    setProjects(newProjects);

    if (currentProjectId === projectId) {
      handleSwitchProject(newProjects[0].id);
    }
  };

  const handleResetToDemo = () => {
    if (!confirm('This will replace all current projects with the Demo Project containing sample data and reload the page. Continue?')) {
      return;
    }

    // Clear all storage
    localStorage.clear();

    // Reload the page to trigger demo project creation
    window.location.reload();
  };

  const handleAddToProject = (artifacts: { requirements: string[], useCases: string[], testCases: string[] }) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== currentProjectId) return p;

      // Add IDs if not already present
      const newReqIds = Array.from(new Set([...p.requirementIds, ...artifacts.requirements]));
      const newUcIds = Array.from(new Set([...p.useCaseIds, ...artifacts.useCases]));
      const newTcIds = Array.from(new Set([...p.testCaseIds, ...artifacts.testCases]));

      return {
        ...p,
        requirementIds: newReqIds,
        useCaseIds: newUcIds,
        testCaseIds: newTcIds,
        lastModified: Date.now()
      };
    }));

    // Also update local state to reflect changes immediately
    // (The useEffect will sync this back to projects, but we want immediate UI update)
    // Actually, the useEffect [currentProjectId, projects] might handle it if we update projects?
    // Let's rely on the useEffect that updates local state when project changes?
    // No, that useEffect runs when currentProjectId changes.
    // We need to update local state here too, OR trigger a reload.
    // The easiest way is to update local state, and let the sync-back effect update the project.
    // BUT, my handleAddToProject updates PROJECT directly.
    // The sync effect (lines 356-393) goes Local State -> Global State & Project.
    // So if I update Project directly, it might get overwritten by Local State -> Project sync?
    // Let's check:
    // useEffect [requirements, ...] updates setProjects.
    // So if I update projects here, and then local state doesn't change, the next render might overwrite projects with old local state?
    // YES.
    // So I should update LOCAL STATE here.

    // Filter global artifacts by the new IDs
    const newReqs = globalRequirements.filter(r => artifacts.requirements.includes(r.id) || requirements.some(existing => existing.id === r.id));
    const newUCs = globalUseCases.filter(u => artifacts.useCases.includes(u.id) || useCases.some(existing => existing.id === u.id));
    const newTCs = globalTestCases.filter(t => artifacts.testCases.includes(t.id) || testCases.some(existing => existing.id === t.id));

    setRequirements(newReqs);
    setUseCases(newUCs);
    setTestCases(newTCs);

    // The sync effect will then update the Project object.

    createVersionSnapshot('Added artifacts from Global Library', 'auto-save');
    alert(`Added ${artifacts.requirements.length} Requirements, ${artifacts.useCases.length} Use Cases, and ${artifacts.testCases.length} Test Cases to the project.`);
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
    const migrateGlobalVersions = () => {
      const legacyVersions = localStorage.getItem(LEGACY_VERSIONS_KEY);
      if (legacyVersions) {
        try {
          // Save to current project
          localStorage.setItem(getVersionsKey(currentProjectId), legacyVersions);
          // Remove legacy key
          localStorage.removeItem(LEGACY_VERSIONS_KEY);
          console.log('Migrated legacy versions to current project');
        } catch (e) {
          console.error('Failed to migrate legacy versions', e);
        }
      }
    };
    migrateGlobalVersions();
  }, []); // Run once on mount

  // Load versions for current project
  useEffect(() => {
    const loadVersions = (projectId: string) => {
      const savedVersions = localStorage.getItem(getVersionsKey(projectId));
      if (savedVersions) {
        try {
          setVersions(JSON.parse(savedVersions));
        } catch (e) {
          console.error('Failed to load versions', e);
          setVersions([]);
        }
      } else {
        setVersions([]);
      }
    };
    loadVersions(currentProjectId);
  }, [currentProjectId]);
  // Create version snapshot whenever data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      createVersionSnapshot('Auto-save', 'auto-save');
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(timer);
  }, [requirements, useCases, testCases, information, links]);

  // Create a version snapshot
  const createVersionSnapshot = (message: string, type: 'auto-save' | 'baseline' = 'auto-save', tag?: string) => {
    try {
      const newVersion: Version = {
        id: `v-${Date.now()}`,
        timestamp: Date.now(),
        message,
        type,
        tag,
        data: {
          requirements: JSON.parse(JSON.stringify(requirements)),
          useCases: JSON.parse(JSON.stringify(useCases)),
          links: JSON.parse(JSON.stringify(links)),
          testCases: JSON.parse(JSON.stringify(testCases)),
          information: JSON.parse(JSON.stringify(information))
        }
      };

      // Read current project's versions from localStorage to avoid stale state
      const currentVersionsKey = getVersionsKey(currentProjectId);
      const savedVersions = localStorage.getItem(currentVersionsKey);
      const currentVersions = savedVersions ? JSON.parse(savedVersions) : [];

      const updatedVersions = [newVersion, ...currentVersions].slice(0, MAX_VERSIONS);
      setVersions(updatedVersions);
      localStorage.setItem(currentVersionsKey, JSON.stringify(updatedVersions));
    } catch (error) {
      console.error('Failed to create version snapshot:', error);
    }
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

  const handleCreateBaseline = (name: string) => {
    createVersionSnapshot(`Baseline: ${name}`, 'baseline', name);
  };

  // Restore a previous version
  const handleRestoreVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setRequirements(version.data.requirements);
      setUseCases(version.data.useCases);
      setTestCases(version.data.testCases || []);
      setInformation(version.data.information || []);
      setLinks(version.data.links);
      createVersionSnapshot(`Restored from ${formatDateTime(version.timestamp)}`, 'auto-save');
    }
  };

  const handleBreakDownUseCase = (_useCase: UseCase) => {
    // Open new requirement modal with use case pre-selected
    // For now, just open the modal - user can manually link
    setIsModalOpen(true);
  };

  // Export data as JSON file
  const handleExport = () => {
    const dataToExport = {
      requirements,
      useCases,
      testCases,
      information,
      links,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requirements-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.requirements && Array.isArray(data.requirements)) {
              setRequirements(data.requirements);
              setUseCases(data.useCases || []);
              setTestCases(data.testCases || []);
              setInformation(data.information || []);
              setLinks(data.links || []);
              createVersionSnapshot('Imported from JSON', 'auto-save');
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
        reader.onload = (event) => {
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
                lastModified: Date.now()
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
                lastModified: Date.now()
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

            createVersionSnapshot('Imported from Excel', 'auto-save');
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

  // Helper to trigger file download
  const triggerDownload = async (blob: Blob, filename: string) => {
    try {
      // Try to use the File System Access API if available
      if ('showSaveFilePicker' in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'Exported File',
              accept: {
                [blob.type]: [`.${filename.split('.').pop()}`]
              }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err: any) {
          // If user cancelled, don't do anything
          if (err.name === 'AbortError') return;
          // If other error, fall back to default download
          console.warn('File System Access API failed, falling back to download:', err);
        }
      }

      // Fallback to default download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to trigger download. Please check your browser settings.');
    }
  };

  // Export data as PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;

      // Track page numbers for TOC
      const pageNumbers: { [key: string]: number } = {};

      // Helper function to add page footer
      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${doc.getCurrentPageInfo().pageNumber}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.setTextColor(0, 0, 0);
      };

      // Title Page
      doc.setFontSize(24);
      doc.text('Requirements Document', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(12);
      doc.text(currentProject.name, pageWidth / 2, 45, { align: 'center' });
      doc.text(`Generated: ${formatDate(Date.now())}`, pageWidth / 2, 55, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Total Requirements: ${requirements.length}`, pageWidth / 2, 70, { align: 'center' });
      doc.text(`Total Use Cases: ${useCases.length}`, pageWidth / 2, 77, { align: 'center' });
      doc.text(`Total Links: ${links.length}`, pageWidth / 2, 84, { align: 'center' });

      addFooter();

      // Revision History Section
      doc.addPage();
      pageNumbers.revisionHistory = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(18);
      doc.text('Revision History', margin, 20);

      // Get baseline versions (most recent 10)
      const baselineVersions = versions
        .filter(v => v.type === 'baseline')
        .slice(0, 10);

      // Add current export as first entry
      const revisionData = [
        [formatDateTime(Date.now()), 'Current', 'PDF Export Generated'],
        ...baselineVersions.map(v => [
          formatDateTime(v.timestamp),
          v.tag || `v-${v.id.substring(2, 8)}`,
          v.message
        ])
      ];

      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Version', 'Description']],
        body: revisionData,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 30 },
          2: { cellWidth: 'auto' }
        },
        didDrawPage: addFooter
      });

      // Table of Contents
      doc.addPage();
      pageNumbers.toc = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(18);
      doc.text('Table of Contents', margin, 20);

      doc.setFontSize(11);
      let tocY = 40;
      const tocEntries: Array<{ title: string, page: string }> = [
        { title: 'Revision History', page: String(pageNumbers.revisionHistory) }
      ];

      // Add entries for sections we'll create later
      // We'll fill in the page numbers after creating the sections
      const tocPlaceholders = [
        'Requirements Overview',
        'Detailed Requirements',
        ...(useCases.length > 0 ? ['Use Cases'] : []),
        ...(links.length > 0 ? ['Requirement Links'] : [])
      ];

      tocPlaceholders.forEach(title => {
        tocEntries.push({ title, page: '___' }); // Placeholder
      });

      tocEntries.forEach((entry, index) => {
        if (index > 0) { // Skip revision history as we already know its page
          doc.setTextColor(99, 102, 241);
          doc.textWithLink(entry.title, margin, tocY, {
            pageNumber: parseInt(entry.page) || 1
          });
          doc.setTextColor(0, 0, 0);
        } else {
          doc.setTextColor(99, 102, 241);
          doc.textWithLink(entry.title, margin, tocY, {
            pageNumber: parseInt(entry.page)
          });
          doc.setTextColor(0, 0, 0);
        }

        const pageNumText = entry.page === '___' ? '...' : entry.page;
        doc.text(pageNumText, pageWidth - margin, tocY, { align: 'right' });
        tocY += 10;
      });

      addFooter();

      // Requirements Overview Section
      doc.addPage();
      pageNumbers.requirementsOverview = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(16);
      doc.text('Requirements Overview', margin, 20);

      const reqTableData = requirements
        .filter(r => !r.isDeleted)
        .map(req => [
          req.id,
          req.title,
          req.status,
          req.priority,
          req.description || '',
          req.parentIds.join(', ') || 'None'
        ]);

      autoTable(doc, {
        startY: 30,
        head: [['ID', 'Title', 'Status', 'Priority', 'Description', 'Parents']],
        body: reqTableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        margin: { left: 10, right: 10 },
        columnStyles: {
          0: { cellWidth: 25 },  // Wider ID column
          1: { cellWidth: 40 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 45 },
          5: { cellWidth: 20 }
        },
        didDrawPage: addFooter
      });

      // Detailed Requirements Section (without page breaks between requirements)
      doc.addPage();
      pageNumbers.detailedRequirements = doc.getCurrentPageInfo().pageNumber;

      doc.setFontSize(16);
      doc.text('Detailed Requirements', margin, 20);

      let currentY = 35;
      const activeRequirements = requirements.filter(r => !r.isDeleted);

      activeRequirements.forEach((req, index) => {
        // Check if we need a new page
        const estimatedHeight = 80; // Rough estimate for requirement height
        if (currentY + estimatedHeight > pageHeight - 20) {
          doc.addPage();
          addFooter();
          currentY = 20;
        }

        // Requirement header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${req.id}: ${req.title}`, margin, currentY);
        currentY += 8;

        doc.setFontSize(9);

        // Description
        if (req.description) {
          doc.setFont('helvetica', 'bold');
          doc.text('Description:', margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(req.description, pageWidth - 2 * margin);
          doc.text(descLines, margin, currentY);
          currentY += descLines.length * 4 + 3;
        }

        // Requirement Text
        if (req.text) {
          doc.setFont('helvetica', 'bold');
          doc.text('Requirement Text:', margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          const textLines = doc.splitTextToSize(req.text, pageWidth - 2 * margin);
          doc.text(textLines, margin, currentY);
          currentY += textLines.length * 4 + 3;
        }

        // Rationale
        if (req.rationale) {
          doc.setFont('helvetica', 'bold');
          doc.text('Rationale:', margin, currentY);
          currentY += 5;
          doc.setFont('helvetica', 'normal');
          const rationaleLines = doc.splitTextToSize(req.rationale, pageWidth - 2 * margin);
          doc.text(rationaleLines, margin, currentY);
          currentY += rationaleLines.length * 4 + 3;
        }

        // Status and Priority
        doc.setFont('helvetica', 'bold');
        doc.text('Status:', margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(req.status || 'Draft', margin + 20, currentY);

        doc.setFont('helvetica', 'bold');
        doc.text('Priority:', margin + 60, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(req.priority || 'Medium', margin + 80, currentY);
        currentY += 8;

        // Add separator line between requirements (but not after the last one)
        if (index < activeRequirements.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 8;
        }
      });

      addFooter();

      // Use Cases Section
      if (useCases.length > 0) {
        doc.addPage();
        pageNumbers.useCases = doc.getCurrentPageInfo().pageNumber;

        doc.setFontSize(16);
        doc.text('Use Cases', margin, 20);

        useCases.forEach((uc) => {
          doc.addPage();
          doc.setFontSize(14);
          doc.text(`${uc.id}: ${uc.title}`, margin, 20);

          doc.setFontSize(10);
          let yPos = 35;

          doc.setFont('helvetica', 'bold');
          doc.text('Actor:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(uc.actor || '', margin + 26, yPos);
          yPos += 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Description:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(uc.description || '', pageWidth - 2 * margin);
          doc.text(descLines, margin, yPos + 5);
          yPos += descLines.length * 5 + 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Preconditions:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const preLines = doc.splitTextToSize(uc.preconditions || '', pageWidth - 2 * margin);
          doc.text(preLines, margin, yPos + 5);
          yPos += preLines.length * 5 + 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Main Flow:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const flowLines = doc.splitTextToSize(uc.mainFlow || '', pageWidth - 2 * margin);
          doc.text(flowLines, margin, yPos + 5);
          yPos += flowLines.length * 5 + 10;

          if (uc.alternativeFlows) {
            doc.setFont('helvetica', 'bold');
            doc.text('Alternative Flows:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            const altLines = doc.splitTextToSize(uc.alternativeFlows || '', pageWidth - 2 * margin);
            doc.text(altLines, margin, yPos + 5);
            yPos += altLines.length * 5 + 10;
          }

          doc.setFont('helvetica', 'bold');
          doc.text('Postconditions:', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const postLines = doc.splitTextToSize(uc.postconditions || '', pageWidth - 2 * margin);
          doc.text(postLines, margin, yPos + 5);

          addFooter();
        });
      }

      // Links/Traceability Section
      if (links.length > 0) {
        doc.addPage();
        pageNumbers.links = doc.getCurrentPageInfo().pageNumber;

        doc.setFontSize(16);
        doc.text('Requirement Links', margin, 20);

        const linkTableData = links.map(link => [
          link.sourceId,
          link.targetId,
          link.type.replace('_', ' '),
          link.description || '-'
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['Source', 'Target', 'Type', 'Description']],
          body: linkTableData,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255 },
          didDrawPage: addFooter
        });
      }

      // Update TOC with actual page numbers
      const tocPageNum = pageNumbers.toc;
      doc.setPage(tocPageNum);

      // Clear old TOC content
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 35, pageWidth, pageHeight - 45, 'F');

      // Redraw TOC with correct page numbers
      tocY = 40;
      const finalTocEntries = [
        { title: 'Revision History', page: pageNumbers.revisionHistory },
        { title: 'Requirements Overview', page: pageNumbers.requirementsOverview },
        { title: 'Detailed Requirements', page: pageNumbers.detailedRequirements },
        ...(useCases.length > 0 ? [{ title: 'Use Cases', page: pageNumbers.useCases }] : []),
        ...(links.length > 0 ? [{ title: 'Requirement Links', page: pageNumbers.links }] : [])
      ];

      doc.setFontSize(11);
      finalTocEntries.forEach(entry => {
        doc.setTextColor(99, 102, 241);
        doc.textWithLink(entry.title, margin, tocY, {
          pageNumber: entry.page
        });
        doc.setTextColor(0, 0, 0);
        doc.text(String(entry.page), pageWidth - margin, tocY, { align: 'right' });
        tocY += 10;
      });

      // Save PDF
      const blob = doc.output('blob');
      triggerDownload(blob, `${currentProject.name}_Requirements.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Export data as Excel
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Requirements Sheet
      const reqData = requirements.map(req => ({
        ID: req.id,
        Title: req.title,
        Status: req.status,
        Priority: req.priority,
        Description: req.description,
        'Requirement Text': req.text,
        Rationale: req.rationale,
        Parents: req.parentIds.join(', ')
      }));
      const reqWs = XLSX.utils.json_to_sheet(reqData);
      XLSX.utils.book_append_sheet(wb, reqWs, 'Requirements');

      // Use Cases Sheet
      const ucData = useCases.map(uc => ({
        ID: uc.id,
        Title: uc.title,
        Actor: uc.actor,
        Description: uc.description,
        Preconditions: uc.preconditions,
        'Main Flow': uc.mainFlow,
        'Alternative Flows': uc.alternativeFlows,
        Postconditions: uc.postconditions,
        Priority: uc.priority,
        Status: uc.status
      }));
      const ucWs = XLSX.utils.json_to_sheet(ucData);
      XLSX.utils.book_append_sheet(wb, ucWs, 'Use Cases');

      // Links Sheet
      const linkData = links.map(link => ({
        Source: link.sourceId,
        Target: link.targetId,
        Type: link.type,
        Description: link.description
      }));
      const linkWs = XLSX.utils.json_to_sheet(linkData);
      XLSX.utils.book_append_sheet(wb, linkWs, 'Links');

      // Save File manually
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      triggerDownload(blob, 'Mars_Rover_2030_Requirements.xlsx');
    } catch (error) {
      console.error('Excel Export Error:', error);
      alert(`Failed to export Excel: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleAddRequirement = (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
    // Find next available number that hasn't been used
    let nextIdNumber = 1;
    while (usedReqNumbers.has(nextIdNumber)) {
      nextIdNumber++;
    }

    const newId = `REQ-${String(nextIdNumber).padStart(3, '0')}`;

    const newRequirement: Requirement = {
      ...newReqData,
      id: newId,
      lastModified: Date.now()
    };

    // Mark this number as used
    setUsedReqNumbers(prev => new Set(prev).add(nextIdNumber));
    setRequirements([...requirements, newRequirement]);
  };

  const handleReorder = (activeId: string, overId: string) => {
    const oldIndex = requirements.findIndex(r => r.id === activeId);
    const newIndex = requirements.findIndex(r => r.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newRequirements = [...requirements];
      const [movedItem] = newRequirements.splice(oldIndex, 1);
      newRequirements.splice(newIndex, 0, movedItem);
      setRequirements(newRequirements);
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

  const handleUpdateRequirement = (id: string, updatedData: Partial<Requirement>) => {
    setRequirements(requirements.map(req =>
      req.id === id
        ? { ...req, ...updatedData, lastModified: Date.now() }
        : req
    ));
    setIsEditModalOpen(false);
    setEditingRequirement(null);
  };

  // Use Case Handlers
  const handleAddUseCase = (data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }) => {
    if ('id' in data) {
      // Update existing
      setUseCases(useCases.map(uc =>
        uc.id === data.id
          ? { ...uc, ...data.updates, lastModified: Date.now() } as UseCase
          : uc
      ));
      setEditingUseCase(null);
    } else {
      // Create new - find next available number that hasn't been used
      let nextIdNumber = 1;
      while (usedUcNumbers.has(nextIdNumber)) {
        nextIdNumber++;
      }

      const newId = `UC-${String(nextIdNumber).padStart(3, '0')}`;
      const newUseCase: UseCase = {
        ...data,
        id: newId,
        lastModified: Date.now()
      } as UseCase;

      // Mark this number as used
      setUsedUcNumbers(prev => new Set(prev).add(nextIdNumber));
      setUseCases([...useCases, newUseCase]);
    }
    setIsUseCaseModalOpen(false);
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
        useCaseIds: req.useCaseIds?.filter(ucId => ucId !== id)
      })));
    }
  };

  // Test Case Management
  const handleAddTestCase = (newTestCaseData: Omit<TestCase, 'id' | 'lastModified' | 'dateCreated'>) => {
    // Find next available number
    let nextNum = 1;
    while (usedTestNumbers.has(nextNum)) {
      nextNum++;
    }

    const newTestCase: TestCase = {
      ...newTestCaseData,
      id: `TC-${String(nextNum).padStart(3, '0')}`,
      dateCreated: Date.now(),
      lastModified: Date.now()
    };

    setTestCases([...testCases, newTestCase]);
    setUsedTestNumbers(new Set([...usedTestNumbers, nextNum]));
  };

  const handleUpdateTestCase = (id: string, updates: Partial<TestCase>) => {
    setTestCases(testCases.map(tc =>
      tc.id === id ? { ...tc, ...updates, lastModified: Date.now() } : tc
    ));
  };

  const handleDeleteTestCase = (id: string) => {
    setTestCases(testCases.map(tc =>
      tc.id === id ? { ...tc, isDeleted: true, deletedAt: Date.now() } : tc
    ));
  };

  // Information Management
  const handleAddInformation = (data: Omit<Information, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Information> }) => {
    if ('id' in data) {
      // Update existing
      setInformation(information.map(info =>
        info.id === data.id
          ? { ...info, ...data.updates, lastModified: Date.now() } as Information
          : info
      ));
      setSelectedInformation(null);
    } else {
      // Create new
      let nextNum = 1;
      while (usedInfoNumbers.has(nextNum)) {
        nextNum++;
      }

      const newInformation: Information = {
        ...data,
        id: `INFO-${String(nextNum).padStart(3, '0')}`,
        dateCreated: Date.now(),
        lastModified: Date.now()
      };

      setInformation([...information, newInformation]);
      setUsedInfoNumbers(new Set([...usedInfoNumbers, nextNum]));
    }
    setIsInformationModalOpen(false);
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
          parentIds: req.parentIds ? req.parentIds.filter(parentId => parentId !== id) : []
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

  const treeData = buildTree(filteredRequirements);

  return (
    <Layout
      currentProjectName={currentProject.name}
      projects={projects}
      currentProjectId={currentProjectId}
      onSwitchProject={handleSwitchProject}
      onCreateProject={handleCreateProject}
      onOpenProjectSettings={handleOpenProjectSettings}
      onNewRequirement={() => {
        setEditingRequirement(null);
        setIsModalOpen(true);
      }}
      onNewUseCase={() => {
        setEditingUseCase(null);
        setIsUseCaseModalOpen(true);
      }}
      onNewTestCase={() => setIsNewTestCaseModalOpen(true)}
      onExport={handleExport}
      onImport={handleImport}
      onImportExcel={handleImportExcel}
      onViewHistory={() => setIsVersionHistoryOpen(true)}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      onOpenGlobalLibrary={() => setIsGlobalLibraryOpen(true)}
      onResetToDemo={handleResetToDemo}
      onSearch={setSearchQuery}
      onTrashOpen={() => setIsTrashModalOpen(true)}
      onNewInformation={() => {
        setSelectedInformation(null);
        setIsInformationModalOpen(true);
      }}
      currentView={currentView}
      onSwitchView={setCurrentView}
    >
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {currentView === 'usecases' ? 'Use Cases' :
                currentView === 'testcases' ? 'Test Cases' :
                  currentView === 'information' ? 'Information' :
                    currentView === 'library-requirements' ? 'Requirements' :
                      currentView === 'library-usecases' ? 'Use Cases' :
                        currentView === 'library-testcases' ? 'Test Cases' :
                          currentView === 'library-information' ? 'Information' :
                            'Requirements'}
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
            requirements={treeData}
            links={links}
            allRequirements={requirements}
            onReorder={handleReorder}
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

      {isGlobalLibraryOpen && (
        <GlobalLibraryModal
          isOpen={isGlobalLibraryOpen}
          onClose={() => setIsGlobalLibraryOpen(false)}
          projects={projects}
          currentProjectId={currentProjectId}
          globalRequirements={globalRequirements}
          globalUseCases={globalUseCases}
          globalTestCases={globalTestCases}
          onAddToProject={handleAddToProject}
        />
      )}
    </Layout >
  );
}

export default App;
