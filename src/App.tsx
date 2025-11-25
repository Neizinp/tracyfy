import { useState, useEffect } from 'react';
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
  InformationModal
} from './components';
import type { Requirement, RequirementTreeNode, Link, UseCase, TestCase, Information, Version, Project, ColumnVisibility } from './types';
import { mockRequirements, mockUseCases, mockTestCases, mockInformation, mockLinks } from './mockData';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Mock Data - Now using flat structure with parentIds
const initialRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'System Authentication',
    description: 'The system shall allow users to log in using secure credentials.',
    text: 'The system must support multi-factor authentication for all administrative access.',
    rationale: 'Security compliance requires MFA for privileged accounts.',
    status: 'approved',
    priority: 'high',
    parentIds: [],
    dateCreated: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'REQ-002',
    title: 'Data Encryption',
    description: 'All sensitive data must be encrypted at rest and in transit.',
    text: 'AES-256 encryption must be used for database storage.',
    rationale: 'Data protection regulations.',
    status: 'approved',
    priority: 'high',
    parentIds: [],
    dateCreated: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'REQ-003',
    title: 'User Profile Management',
    description: 'Users shall be able to update their profile information.',
    text: 'Users can update email, phone number, and display name.',
    rationale: 'User autonomy and data accuracy.',
    status: 'draft',
    priority: 'medium',
    parentIds: ['REQ-001'],
    dateCreated: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'REQ-004',
    title: 'Password Reset',
    description: 'Users shall be able to reset their password via email.',
    text: 'Password reset link expires in 24 hours.',
    rationale: 'Account recovery mechanism.',
    status: 'draft',
    priority: 'medium',
    parentIds: ['REQ-001'],
    dateCreated: Date.now(),
    lastModified: Date.now()
  }
];

const initialUseCases: UseCase[] = [
  {
    id: 'UC-001',
    title: 'User Login',
    description: 'A registered user logs into the system.',
    actor: 'Registered User',
    preconditions: 'User has a valid account.',
    postconditions: 'User is authenticated and redirected to dashboard.',
    mainFlow: '1. User navigates to login page.\n2. User enters credentials.\n3. System validates credentials.\n4. System redirects to dashboard.',
    alternativeFlows: '3a. Invalid credentials: System shows error message.',
    priority: 'high',
    status: 'approved',
    lastModified: Date.now()
  }
];

const initialTestCases: TestCase[] = [];

const initialInformation: Information[] = [];

const initialLinks: Link[] = [];

const STORAGE_KEY = 'reqtrace-data'; // Legacy key for migration
const PROJECTS_KEY = 'reqtrace-projects';
const CURRENT_PROJECT_KEY = 'reqtrace-current-project-id';
const LEGACY_VERSIONS_KEY = 'reqtrace-versions'; // Legacy global key for migration
const getVersionsKey = (projectId: string) => `reqtrace-versions-${projectId}`;
const USED_NUMBERS_KEY = 'reqtrace-used-numbers';
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

// Helper to load projects (handling migration)
const loadProjects = () => {
  try {
    const savedProjects = localStorage.getItem(PROJECTS_KEY);
    const savedCurrentId = localStorage.getItem(CURRENT_PROJECT_KEY);

    if (savedProjects) {
      const projects = JSON.parse(savedProjects);
      // Migrate existing requirements to add dateCreated if missing
      // and ensure testCases exists
      const migratedProjects = projects.map((project: Project) => ({
        ...project,
        testCases: project.testCases || [],  // Add testCases if missing
        requirements: project.requirements.map((req: Requirement) => ({
          ...req,
          dateCreated: req.dateCreated || req.lastModified || Date.now()
        })),
        information: project.information || [] // Add information if missing
      }));
      return {
        projects: migratedProjects,
        currentProjectId: savedCurrentId || migratedProjects[0]?.id || 'default-project'
      };
    }

    // Migration: Check for legacy data
    const legacyData = localStorage.getItem(STORAGE_KEY);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      const defaultProject: Project = {
        id: 'default-project',
        name: 'Default Project',
        description: 'Migrated from legacy data',
        requirements: parsed.requirements || initialRequirements,
        useCases: parsed.useCases || initialUseCases,
        testCases: [],
        information: [],
        links: parsed.links || initialLinks,
        lastModified: Date.now()
      };
      return {
        projects: [defaultProject],
        currentProjectId: defaultProject.id
      };
    }

    // Default empty
    const defaultProject: Project = {
      id: 'default-project',
      name: 'My First Project',
      description: 'Default project',
      requirements: initialRequirements,
      useCases: initialUseCases,
      testCases: initialTestCases,
      information: initialInformation,
      links: initialLinks,
      lastModified: Date.now()
    };
    return {
      projects: [defaultProject],
      currentProjectId: defaultProject.id
    };
  } catch (error) {
    console.error('Failed to load projects:', error);
    const defaultProject: Project = {
      id: 'default-project',
      name: 'My First Project',
      description: 'Default project',
      requirements: initialRequirements,
      useCases: initialUseCases,
      testCases: initialTestCases,
      information: initialInformation,
      links: initialLinks,
      lastModified: Date.now()
    };
    return {
      projects: [defaultProject],
      currentProjectId: defaultProject.id
    };
  }
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

// Helper to create a demo project with comprehensive mock data
const createDemoProject = (): Project => {
  return {
    id: 'demo-project',
    name: 'Demo Project - E-Commerce Platform',
    description: 'A comprehensive demo project showcasing all features with realistic requirements, use cases, test cases, and documentation.',
    requirements: mockRequirements,
    useCases: mockUseCases,
    testCases: mockTestCases,
    information: mockInformation,
    links: mockLinks,
    lastModified: Date.now()
  };
};

function App() {
  const { projects: initialProjects, currentProjectId: initialCurrentId } = loadProjects();

  // Check if demo project exists, if not create it
  const hasDemoProject = initialProjects.some((p: Project) => p.id === 'demo-project');
  const projectsWithDemo = hasDemoProject ? initialProjects : [...initialProjects, createDemoProject()];

  const [projects, setProjects] = useState<Project[]>(projectsWithDemo);
  const [currentProjectId, setCurrentProjectId] = useState<string>(initialCurrentId);

  // Project Settings State
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  // Get current project data
  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  // Initialize state from current project
  // Note: We keep local state for performance and sync back to projects array
  const [requirements, setRequirements] = useState<Requirement[]>(currentProject.requirements);
  const [useCases, setUseCases] = useState<UseCase[]>(currentProject.useCases);
  const [testCases, setTestCases] = useState<TestCase[]>(currentProject.testCases);
  const [information, setInformation] = useState<Information[]>(currentProject.information || []);
  const [links, setLinks] = useState<Link[]>(currentProject.links);

  const initialUsedNumbers = initializeUsedNumbers(currentProject.requirements, currentProject.useCases);
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
  const [currentView, setCurrentView] = useState<'tree' | 'detailed' | 'matrix' | 'usecases' | 'testcases' | 'information'>('tree');
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

  // Sync local state back to projects array whenever data changes
  useEffect(() => {
    setProjects(prevProjects => prevProjects.map(p =>
      p.id === currentProjectId
        ? { ...p, requirements, useCases, testCases, information, links, lastModified: Date.now() }
        : p
    ));
  }, [requirements, useCases, testCases, information, links, currentProjectId]);

  // Persist projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }, [projects, currentProjectId]);

  const handleSwitchProject = (projectId: string) => {
    const targetProject = projects.find(p => p.id === projectId);
    if (targetProject) {
      setCurrentProjectId(projectId);
      setRequirements(targetProject.requirements);
      setUseCases(targetProject.useCases);
      setTestCases(targetProject.testCases || []);
      setInformation(targetProject.information || []);
      setLinks(targetProject.links);

      // Update used numbers for the new project
      const newUsedNumbers = initializeUsedNumbers(targetProject.requirements, targetProject.useCases);
      setUsedReqNumbers(newUsedNumbers.usedReqNumbers);
      setUsedUcNumbers(newUsedNumbers.usedUcNumbers);

      // Load column visibility for the new project
      setColumnVisibility(loadColumnVisibility(projectId));
    }
  };

  const handleCreateProject = () => {
    setIsCreateProjectModalOpen(true);
  };

  const handleCreateProjectSubmit = (name: string, description: string) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      requirements: [],
      useCases: [],
      testCases: [],
      information: [],
      links: [],
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
      createVersionSnapshot(`Restored from ${new Date(version.timestamp).toLocaleString()}`, 'auto-save');
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
      console.log('jsPDF imported:', jsPDF);
      console.log('autoTable imported:', autoTable);

      const doc = new jsPDF();
      console.log('doc created:', doc);

      const pageWidth = doc.internal.pageSize.getWidth();

      // Title Page
      doc.setFontSize(24);
      doc.text('Requirements Document', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(12);
      doc.text('Mars Rover 2030 Project', pageWidth / 2, 45, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 55, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Total Requirements: ${requirements.length}`, pageWidth / 2, 70, { align: 'center' });
      doc.text(`Total Use Cases: ${useCases.length}`, pageWidth / 2, 77, { align: 'center' });
      doc.text(`Total Links: ${links.length}`, pageWidth / 2, 84, { align: 'center' });

      // Requirements Section
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Requirements', 14, 20);

      const reqTableData = requirements.map(req => [
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
          0: { cellWidth: 15 },
          1: { cellWidth: 35 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 40 },
          5: { cellWidth: 25 }
        },
        didDrawPage: () => {
          // Footer
          doc.setFontSize(8);
          doc.text(
            `Page ${doc.getCurrentPageInfo().pageNumber}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      // Detailed Requirements
      requirements.forEach((req) => {
        doc.addPage();
        doc.setFontSize(14);
        doc.text(`${req.id}: ${req.title}`, 14, 20);

        doc.setFontSize(10);
        let yPos = 35;

        doc.setFont('helvetica', 'bold');
        doc.text('Description:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(req.description || '', pageWidth - 28);
        doc.text(descLines, 14, yPos + 5);
        yPos += descLines.length * 5 + 10;

        doc.setFont('helvetica', 'bold');
        doc.text('Requirement Text:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const textLines = doc.splitTextToSize(req.text || '', pageWidth - 28);
        doc.text(textLines, 14, yPos + 5);
        yPos += textLines.length * 5 + 10;

        doc.setFont('helvetica', 'bold');
        doc.text('Rationale:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const rationaleLines = doc.splitTextToSize(req.rationale || '', pageWidth - 28);
        doc.text(rationaleLines, 14, yPos + 5);
        yPos += rationaleLines.length * 5 + 10;

        doc.setFont('helvetica', 'bold');
        doc.text(`Status: `, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(req.status || 'Draft', 40, yPos);

        doc.setFont('helvetica', 'bold');
        doc.text(`Priority: `, 80, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(req.priority || 'Medium', 106, yPos);
      });

      // Use Cases Section
      if (useCases.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Use Cases', 14, 20);

        useCases.forEach((uc) => {
          doc.addPage();
          doc.setFontSize(14);
          doc.text(`${uc.id}: ${uc.title}`, 14, 20);

          doc.setFontSize(10);
          let yPos = 35;

          doc.setFont('helvetica', 'bold');
          doc.text('Actor:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(uc.actor || '', 40, yPos);
          yPos += 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Description:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(uc.description || '', pageWidth - 28);
          doc.text(descLines, 14, yPos + 5);
          yPos += descLines.length * 5 + 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Preconditions:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const preLines = doc.splitTextToSize(uc.preconditions || '', pageWidth - 28);
          doc.text(preLines, 14, yPos + 5);
          yPos += preLines.length * 5 + 10;

          doc.setFont('helvetica', 'bold');
          doc.text('Main Flow:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const flowLines = doc.splitTextToSize(uc.mainFlow || '', pageWidth - 28);
          doc.text(flowLines, 14, yPos + 5);
          yPos += flowLines.length * 5 + 10;

          if (uc.alternativeFlows) {
            doc.setFont('helvetica', 'bold');
            doc.text('Alternative Flows:', 14, yPos);
            doc.setFont('helvetica', 'normal');
            const altLines = doc.splitTextToSize(uc.alternativeFlows || '', pageWidth - 28);
            doc.text(altLines, 14, yPos + 5);
            yPos += altLines.length * 5 + 10;
          }

          doc.setFont('helvetica', 'bold');
          doc.text('Postconditions:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const postLines = doc.splitTextToSize(uc.postconditions || '', pageWidth - 28);
          doc.text(postLines, 14, yPos + 5);
        });
      }

      // Links/Traceability Section
      if (links.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Requirement Links', 14, 20);

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
          headStyles: { fillColor: [99, 102, 241], textColor: 255 }
        });
      }

      // Save PDF manually to force download with correct name
      const blob = doc.output('blob');
      triggerDownload(blob, 'Mars_Rover_2030_Requirements.pdf');
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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>System Requirements</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Manage and trace system requirements for the Mars Rover 2030 project.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
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

      <NewRequirementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRequirement}
      />

      <LinkModal
        isOpen={isLinkModalOpen}
        sourceRequirementId={selectedRequirementId}
        requirements={requirements}
        onClose={() => setIsLinkModalOpen(false)}
        onSubmit={handleAddLink}
      />

      {
        isEditModalOpen && editingRequirement && (
          <EditRequirementModal
            isOpen={isEditModalOpen}
            requirement={editingRequirement}
            allRequirements={requirements}
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

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSubmit={handleCreateProjectSubmit}
      />
    </Layout >
  );
}

export default App;
