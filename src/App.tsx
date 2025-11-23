import { useState } from 'react';
import { Layout } from './components/Layout';
import { RequirementTree } from './components/RequirementTree';
import { NewRequirementModal } from './components/NewRequirementModal';
import { LinkModal } from './components/LinkModal';
import { EditRequirementModal } from './components/EditRequirementModal';
import { TraceabilityMatrix } from './components/TraceabilityMatrix';
import { UseCaseModal } from './components/UseCaseModal';
import { UseCaseList } from './components/UseCaseList';
import type { Requirement, RequirementTreeNode, Link, UseCase } from './types';

// Mock Data - Now using flat structure with parentIds
const initialRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'System Authentication',
    description: 'The system shall allow users to log in using secure credentials.',
    text: 'The system shall provide a secure authentication mechanism that verifies user identity before granting access to protected resources.',
    rationale: 'Authentication is critical for protecting sensitive data and ensuring only authorized users can access the system.',
    parentIds: [],
    status: 'approved',
    priority: 'high',
    lastModified: Date.now(),
  },
  {
    id: 'REQ-002',
    title: 'Password Complexity',
    description: 'Passwords must be at least 12 characters long.',
    text: 'User passwords shall be at least 12 characters long and contain a mix of uppercase, lowercase, numbers, and special characters.',
    rationale: 'Strong password requirements reduce the risk of brute-force attacks and unauthorized access.',
    parentIds: ['REQ-001'],
    status: 'draft',
    priority: 'medium',
    lastModified: Date.now(),
  },
  {
    id: 'REQ-003',
    title: 'MFA Support',
    description: 'The system shall support Multi-Factor Authentication.',
    text: 'The system shall support multi-factor authentication using time-based one-time passwords (TOTP) or SMS codes.',
    rationale: 'MFA provides an additional layer of security beyond passwords, significantly reducing the risk of account compromise.',
    parentIds: ['REQ-001', 'REQ-004'], // Demonstrates many-to-many: belongs to both REQ-001 and REQ-004
    status: 'approved',
    priority: 'high',
    lastModified: Date.now(),
  },
  {
    id: 'REQ-004',
    title: 'Data Export',
    description: 'Users shall be able to export data in CSV format.',
    text: 'The system shall provide functionality to export all requirement data to CSV format for external analysis.',
    rationale: 'Data export enables integration with external tools and supports backup and reporting workflows.',
    parentIds: [],
    status: 'draft',
    priority: 'low',
    lastModified: Date.now(),
  }
];

// Mock Use Cases
const initialUseCases: UseCase[] = [
  {
    id: 'UC-001',
    title: 'User Login',
    description: 'User authenticates to access the system',
    actor: 'End User',
    preconditions: 'User has valid credentials',
    postconditions: 'User is authenticated and has access to the system',
    mainFlow: '1. User navigates to login page\n2. User enters username and password\n3. System validates credentials\n4. System grants access',
    alternativeFlows: '3a. Invalid credentials: System displays error message',
    priority: 'high',
    status: 'approved',
    lastModified: Date.now()
  },
  {
    id: 'UC-002',
    title: 'Export Requirements',
    description: 'User exports requirement data for external analysis',
    actor: 'Project Manager',
    preconditions: 'User is logged in and has requirements to export',
    postconditions: 'Requirements are exported in CSV format',
    mainFlow: '1. User clicks export button\n2. System generates CSV file\n3. System downloads file to user\'s device',
    priority: 'medium',
    status: 'draft',
    lastModified: Date.now()
  }
];

// Helper function to build tree structure from flat requirements
function buildTree(requirements: Requirement[]): RequirementTreeNode[] {
  const reqMap = new Map<string, RequirementTreeNode>();

  // Initialize all requirements as tree nodes with empty children
  requirements.forEach(req => {
    reqMap.set(req.id, { ...req, children: [] });
  });

  const rootNodes: RequirementTreeNode[] = [];

  // Build the tree structure
  requirements.forEach(req => {
    const node = reqMap.get(req.id)!;

    if (req.parentIds.length === 0) {
      // No parents - this is a root node
      rootNodes.push(node);
    } else {
      // Has parents - add as child to each parent
      req.parentIds.forEach(parentId => {
        const parent = reqMap.get(parentId);
        if (parent) {
          // Create a copy of the node for each parent to support many-to-many display
          const nodeCopy: RequirementTreeNode = { ...req, children: [] };
          parent.children.push(nodeCopy);
        }
      });
    }
  });

  return rootNodes;
}

function App() {
  const [requirements, setRequirements] = useState<Requirement[]>(initialRequirements);
  const [useCases, setUseCases] = useState<UseCase[]>(initialUseCases);
  const [links, setLinks] = useState<Link[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUseCaseModalOpen, setIsUseCaseModalOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [editingUseCase, setEditingUseCase] = useState<UseCase | null>(null);
  const [currentView, setCurrentView] = useState<'tree' | 'matrix' | 'usecases'>('tree');

  const handleAddRequirement = (newReqData: Omit<Requirement, 'id' | 'lastModified'>) => {
    // Simple ID generation strategy
    const nextIdNumber = requirements.length + 1;
    const newId = `REQ-${String(nextIdNumber).padStart(3, '0')}`;

    const newRequirement: Requirement = {
      ...newReqData,
      id: newId,
      lastModified: Date.now()
    };

    setRequirements([...requirements, newRequirement]);
  };

  const handleReorder = (activeId: string, overId: string) => {
    // When dragging a requirement onto another, add the target as a parent
    const newRequirements = requirements.map(req => {
      if (req.id === activeId) {
        // Find the parent of the over item
        const overReq = requirements.find(r => r.id === overId);
        if (!overReq) return req;

        // Add the over item's parents (or the over item itself if it's a root) as the new parent
        const newParentIds = overReq.parentIds.length > 0 ? [...overReq.parentIds] : [overId];

        // Avoid duplicates
        const uniqueParentIds = Array.from(new Set([...newParentIds]));

        return { ...req, parentIds: uniqueParentIds };
      }
      return req;
    });

    setRequirements(newRequirements);
  };

  const handleLink = (requirementId: string) => {
    setSelectedRequirementId(requirementId);
    setIsLinkModalOpen(true);
  };

  const handleAddLink = (link: Omit<Link, 'id'>) => {
    const newLink: Link = {
      ...link,
      id: `LINK-${links.length + 1}`
    };
    setLinks([...links, newLink]);
    console.log('Link created:', newLink);
  };

  const handleEdit = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setIsEditModalOpen(true);
  };

  const handleUpdateRequirement = (id: string, updates: Partial<Requirement>) => {
    setRequirements(requirements.map(req =>
      req.id === id ? { ...req, ...updates, lastModified: Date.now() } : req
    ));
  };

  // Use Case Handlers
  const handleAddUseCase = (data: any) => {
    if ('id' in data) {
      // Editing existing use case
      setUseCases(useCases.map(uc =>
        uc.id === data.id ? { ...uc, ...data.updates } : uc
      ));
    } else {
      // Creating new use case
      const nextIdNumber = useCases.length + 1;
      const newId = `UC-${String(nextIdNumber).padStart(3, '0')}`;
      const newUseCase: UseCase = {
        ...data,
        id: newId,
        lastModified: Date.now()
      };
      setUseCases([...useCases, newUseCase]);
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
        useCaseIds: req.useCaseIds?.filter(ucId => ucId !== id)
      })));
    }
  };

  const handleBreakDownUseCase = (_useCase: UseCase) => {
    // Open new requirement modal with use case pre-selected
    // For now, just open the modal - user can manually link
    setIsModalOpen(true);
  };

  const treeData = buildTree(requirements);

  return (
    <Layout onNewRequirement={() => setIsModalOpen(true)} onNewUseCase={() => setIsUseCaseModalOpen(true)}>
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>System Requirements</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Manage and trace system requirements for the Mars Rover 2030 project.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentView('tree')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: currentView === 'tree' ? 'var(--color-accent)' : 'transparent',
                color: currentView === 'tree' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Tree View
            </button>
            <button
              onClick={() => setCurrentView('matrix')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: currentView === 'matrix' ? 'var(--color-accent)' : 'transparent',
                color: currentView === 'matrix' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Matrix View
            </button>
            <button
              onClick={() => setCurrentView('usecases')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: currentView === 'usecases' ? 'var(--color-accent)' : 'transparent',
                color: currentView === 'usecases' ? 'white' : 'var(--color-text-primary)',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              Use Cases
            </button>
          </div>
        </div>
      </div>

      {currentView === 'tree' ? (
        <RequirementTree requirements={treeData} links={links} onReorder={handleReorder} onLink={handleLink} onEdit={handleEdit} allRequirements={requirements} />
      ) : currentView === 'matrix' ? (
        <TraceabilityMatrix requirements={requirements} links={links} />
      ) : (
        <UseCaseList
          useCases={useCases}
          requirements={requirements}
          onEdit={handleEditUseCase}
          onDelete={handleDeleteUseCase}
          onBreakDown={handleBreakDownUseCase}
        />
      )}

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

      <EditRequirementModal
        isOpen={isEditModalOpen}
        requirement={editingRequirement}
        allRequirements={requirements}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateRequirement}
      />

      <UseCaseModal
        isOpen={isUseCaseModalOpen}
        useCase={editingUseCase}
        onClose={() => {
          setIsUseCaseModalOpen(false);
          setEditingUseCase(null);
        }}
        onSubmit={handleAddUseCase}
      />
    </Layout>
  );
}

export default App;
