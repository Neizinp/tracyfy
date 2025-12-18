/**
 * Demo Data
 *
 * Sample data for creating a demo project with realistic artifacts.
 * Used to populate the app for testing and exploration.
 */

import type { Requirement, UseCase, TestCase, Information, Risk } from '../types';
import type { LinkType } from './linkTypes';
import type { CustomAttributeDefinition, CustomAttributeValue } from '../types/customAttributes';

// Placeholder IDs will be replaced with real generated IDs
export interface DemoArtifacts {
  requirements: Omit<Requirement, 'id' | 'lastModified'>[];
  useCases: Omit<UseCase, 'id' | 'lastModified'>[];
  testCases: Omit<TestCase, 'id' | 'lastModified'>[];
  information: Omit<Information, 'id' | 'lastModified'>[];
  risks: Omit<Risk, 'id' | 'lastModified'>[];
  links: {
    sourceIndex: number;
    sourceType: 'req' | 'uc' | 'tc' | 'info' | 'risk';
    targetIndex: number;
    targetType: 'req' | 'uc' | 'tc' | 'info' | 'risk';
    type: LinkType;
    scope: 'global' | 'project'; // 'global' = visible everywhere, 'project' = only in this project
  }[];
}

export const DEMO_PROJECT = {
  name: 'Tracyfy Management System',
  description:
    'A "meta" demonstration project describing Tracyfy itself. Learn about the tool\'s Atomic Philosophy, local-first design, and traceability features while exploring the interface.',
};

const now = Date.now();

/**
 * Demo Custom Attribute Definitions
 * IDs will be replaced with real generated IDs when created
 */
export const DEMO_CUSTOM_ATTRIBUTES: Omit<
  CustomAttributeDefinition,
  'id' | 'dateCreated' | 'lastModified'
>[] = [
  {
    name: 'Target Release',
    type: 'dropdown',
    description: 'The planned release version for this feature.',
    options: ['v1.0 (MVP)', 'v1.1 (Enhancements)', 'v2.0 (Scale)', 'Backlog'],
    appliesTo: ['requirement', 'useCase', 'testCase'],
    required: false,
  },
  {
    name: 'Component',
    type: 'dropdown',
    description: 'The system layer this artifact relates to.',
    options: [
      'Atomic Storage',
      'Traceability Engine',
      'Git Integration',
      'Frontend UI',
      'Export System',
      'Security & Privacy',
    ],
    appliesTo: ['requirement', 'useCase', 'testCase', 'risk'],
    required: false,
  },
  {
    name: 'Priority',
    type: 'dropdown',
    description: 'Development priority.',
    options: ['P0 (Critical)', 'P1 (Important)', 'P2 (Nice to have)'],
    appliesTo: ['requirement', 'useCase', 'testCase', 'risk'],
    required: false,
  },
  {
    name: 'Verification Status',
    type: 'dropdown',
    description: 'Current verification state.',
    options: ['Unverified', 'Verified', 'Verification Blocked', 'N/A'],
    appliesTo: ['requirement', 'testCase'],
    required: false,
  },
];

/**
 * Helper to create custom attribute values for demo artifacts
 * Uses indices into DEMO_CUSTOM_ATTRIBUTES
 */
export function createDemoAttributeValues(attrIds: string[]): {
  requirementValues: CustomAttributeValue[][];
  useCaseValues: CustomAttributeValue[][];
  testCaseValues: CustomAttributeValue[][];
} {
  // Sample values for requirements (Target Release, Component, Priority, Verification Status)
  const requirementValues: CustomAttributeValue[][] = [
    // 0: Atomic Data Model
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Atomic Storage' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 1: Local-First Privacy
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Security & Privacy' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 2: Git Infrastructure
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Git Integration' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 3: Traceability Engine
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 4: Advanced Export
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Export System' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 5: Impact Analysis
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Unverified' },
    ],
    // 6: Smart Search
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Frontend UI' },
      { attributeId: attrIds[2], value: 'P2 (Nice to have)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 7: Theme Engine
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Frontend UI' },
      { attributeId: attrIds[2], value: 'P2 (Nice to have)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
  ];

  // Sample values for use cases
  const useCaseValues: CustomAttributeValue[][] = [
    // 0: Create New Artifact
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Frontend UI' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
    ],
    // 1: Link Two Artifacts
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
    ],
    // 2: View Revision History
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Git Integration' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
    ],
    // 3: Run Impact Analysis
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
    ],
    // 4: Export Verification Matrix
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Export System' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
    ],
  ];

  // Sample values for test cases
  const testCaseValues: CustomAttributeValue[][] = [
    // 0: Verify Atomic Save
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Atomic Storage' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 1: Test Link Integrity
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 2: Verify Local Storage Privacy
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Security & Privacy' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
  ];

  return { requirementValues, useCaseValues, testCaseValues };
}

export const DEMO_ARTIFACTS: DemoArtifacts = {
  requirements: [
    {
      title: 'Atomic Persistence Model',
      description: 'The foundation of Tracyfy: artifacts as separate, manageable files.',
      text: `## The Atomic Philosophy
Tracyfy shall store every artifact (Requirement, Use Case, etc.) as a standalone Markdown file.

This approach ensures:
- **Zero Lock-in**: Your data is just files on your disk.
- **Granular History**: Every change to a *specific* artifact is a Git commit.
- **Human Readable**: You can read and edit your requirements in any text editor.

### Technical Requirement
The filesystem service shall map each Unique ID to a structured path: \`/{type}/{id}.md\`.`,
      rationale:
        'Atomic storage enables powerful versioning and prevents database corruption bottlenecks.',
      status: 'approved',
      priority: 'high',
      author: 'Tracyfy Core Team',
      verificationMethod: 'Filesystem integration test',
      comments: 'This is the core differentiator of the tool.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Local-First Privacy',
      description: 'Ensuring user data never leaves their local environment by default.',
      text: `## Privacy by Design
The system shall perform all data processing and indexing within the user's browser environment.

### Security Constraints:
- No telemetry or data collection by default.
- File access must be explicitly granted via the File System Access API.
- All Git operations must occur locally using isomorphic-git.`,
      rationale: "Engineering data is highly sensitive and belongs on the engineer's machine.",
      status: 'approved',
      priority: 'high',
      author: 'Security Lead',
      verificationMethod: 'Network traffic analysis',
      comments: 'Vital for enterprise adoption.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Structural Git Integration',
      description: 'Using Git as the authoritative source of truth for history and audit.',
      text: `The system shall automatically record a Git commit for every artifact save operation.

### Commit Requirements:
- Commit messages must include the change description.
- Commits must be signed by the local user identity.
- The Git history shall be viewable directly within the Tracyfy UI via the 'History' panel.`,
      rationale: 'Leveraging world-class version control for engineering audit trails.',
      status: 'approved',
      priority: 'high',
      author: 'Git Integration Lead',
      verificationMethod: 'Automated Git log verification',
      comments: 'Integration with existing developer workflows.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Cross-Artifact Traceability',
      description: 'The ability to link any two artifacts regardless of type.',
      text: `The system shall allow users to establish 'Traceability Links' between any two artifacts.

### Link Logic:
- Links shall have types (e.g., 'verifies', 'satisfies', 'relates to').
- The Traceability Matrix shall automatically update when links are changed.
- Bidirectional navigation must be supported.`,
      rationale:
        'Traceability is the "Tracy" in "Tracyfy". It is the core feature for impact analysis.',
      status: 'approved',
      priority: 'high',
      author: 'Traceability Team',
      verificationMethod: 'Link integrity unit tests',
      comments: '',
      dateCreated: now,
      revision: '03',
    },
    {
      title: 'Advanced Document Export',
      description: 'Generating human-ready documents from atomic data.',
      text: `The system shall generate professional PDF and Excel exports from the live artifact data.

### Export Capabilities:
- **PDF**: Table of Contents, Section separation, and Traceability Chapters.
- **Excel**: Multi-sheet workbooks with Revision History and Verification Matrices.`,
      rationale: "Requirements must be sharable with stakeholders who don't use the tool.",
      status: 'approved',
      priority: 'medium',
      author: 'Export Specialist',
      verificationMethod: 'Export template validation',
      comments: 'Highly requested feature for compliance reviews.',
      dateCreated: now,
      revision: '02',
    },
    {
      title: 'Automated Impact Analysis',
      description: 'Calculating the "blast radius" of a requirement change.',
      text: `The system shall visualize the 'impacted' nodes when a source artifact is modified.

### Calculation Logic:
- Downstream dependencies (Test Cases, derived Requirements) must be flagged.
- Visual status indicators (Suspect Links) should appear in the UI.`,
      rationale: 'Avoid missing verification steps when requirements change.',
      status: 'approved',
      priority: 'medium',
      author: 'Analysis Architect',
      verificationMethod: 'Graph traversal algorithm test',
      comments: 'Crucial for large-scale projects.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Lightning-Fast Search',
      description: 'Finding needles in the haystack of Markdown files.',
      text: `The system shall maintain a fast full-text index of all project artifacts.

### Search Features:
- Filter by artifact type, status, and custom attributes.
- Keyboard shortcut (Ctrl+K) for quick access.
- Real-time results as the user types.`,
      rationale: 'Speed is a feature. Users should never wait for data retrieval.',
      status: 'approved',
      priority: 'medium',
      author: 'Search Engineer',
      verificationMethod: 'Performance benchmarking',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Professional Visual Identity',
      description: 'A UI that feels premium, dark-mode first, and high efficiency.',
      text: `The system UI shall follow the 'Premium Aesthetics' guide.

### UI Guidelines:
- High-contrast typography (Inter/Outfit).
- Subtle micro-animations for feedback.
- Dark-mode first design with glassmorphism effects.`,
      rationale: 'Engineers spend all day in tools; they should be beautiful and efficient.',
      status: 'approved',
      priority: 'low',
      author: 'UX Designer',
      verificationMethod: 'Design review',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
  ],
  useCases: [
    {
      title: 'Create New Artifact',
      description: 'The primary workflow for adding new information to the system.',
      actor: 'Project Engineer',
      preconditions: 'Project is open and user has write access.',
      postconditions: 'A new Markdown file is created on disk and added to the Git index.',
      mainFlow: `1. User clicks 'Create New' in the header.
2. User selects artifact type (e.g., Requirement).
3. System opens a blank artifact modal.
4. User enters title and description.
5. User clicks 'Save'.
6. System generates a Unique ID and persists the file.`,
      alternativeFlows: 'User cancels creation: System closes modal without saving.',
      status: 'approved',
      priority: 'high',
      revision: '01',
    },
    {
      title: 'Establish Traceability Link',
      description: 'Connecting two artifacts to create a relationship.',
      actor: 'System Architect',
      preconditions: 'At least two artifacts exist in the project.',
      postconditions: 'A new entry is added to the links registry.',
      mainFlow: `1. User navigates to the 'Links' page.
2. User selects a 'Source' artifact.
3. User selects a 'Target' artifact.
4. User chooses the link type (e.g., 'verifies').
5. User submits the link creation.`,
      alternativeFlows: 'Attempting to link an artifact to itself: System displays error.',
      status: 'approved',
      priority: 'high',
      revision: '01',
    },
    {
      title: 'Run Impact Analysis',
      description: 'Analyzing the effects of a change across the project.',
      actor: 'Change Manager',
      preconditions: 'Traceability links have been established.',
      postconditions: 'User views a list of potentially impacted artifacts.',
      mainFlow: `1. User selects a modified artifact.
2. User triggers 'Impact Analysis'.
3. System traverses the link graph downstream.
4. System highlights 'suspect' links and impacted nodes.`,
      alternativeFlows: 'No downstream links found: System displays "No impact detected".',
      status: 'approved',
      priority: 'high',
      revision: '02',
    },
    {
      title: 'Export Verification Matrix',
      description: 'Generating a compliance document for auditing.',
      actor: 'Quality Assurance Lead',
      preconditions: 'Requirements have linked Test Cases with results.',
      postconditions: 'An Excel file is downloaded to the local machine.',
      mainFlow: `1. User opens the 'Export' modal.
2. User selects 'Excel' format.
3. User toggles 'Include Verification Matrix'.
4. User clicks 'Download'.
5. System generates and triggers file transfer.`,
      alternativeFlows: 'Large project: System shows progress bar during generation.',
      status: 'approved',
      priority: 'medium',
      revision: '01',
    },
  ],
  testCases: [
    {
      title: 'Verify Atomic Save',
      description: `Confirming that artifacts are saved as individual files.
Preconditions: Local project is initialized and Git is configured.
Steps:
1. Create a new Requirement (REQ-TRAC-001).
2. Save the artifact.
3. Inspect the file system in the project directory.
4. Verify that 'requirements/REQ-TRAC-001.md' exists.
5. Inspect Git status to see the new file staged.
Expected Results: File exists on disk with correct content and is tracked by Git.`,
      requirementIds: [],
      status: 'approved',
      priority: 'high',
      author: 'Backend QA',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Test Link Integrity',
      description: `Ensuring that traceability links are correctly recorded and displayed.
Preconditions: Two existing artifacts available for linking.
Steps:
1. Navigate to the Links view.
2. Create a link between REQ-001 and UC-001.
3. Refresh the Dashboard.
4. Verify the link appears in the Traceability Graph.
5. Check the Traceability Matrix for an 'X' at the intersection.
Expected Results: Link is persisted and correctly visualized across all dashboard views.`,
      requirementIds: [],
      status: 'approved',
      priority: 'high',
      author: 'Frontend QA',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Verify Local-First Privacy',
      description: `Confirming that no data is transmitted to external servers.
Preconditions: Browser developer tools are open (Network tab).
Steps:
1. Create and edit several artifacts.
2. Perform a Git commit and push (simulated or real).
3. Monitor network traffic for any unrecognized outbound requests.
4. Verify that only authorized Git/Localhost requests occur.
Expected Results: No engineering data is leaked to external endpoints.`,
      requirementIds: [],
      status: 'approved',
      priority: 'high',
      author: 'Privacy Officer',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Check PDF Export Layout',
      description: `Validating the professional quality of generated PDF reports.
Preconditions: Project contains at least 5 artifacts of different types.
Steps:
1. Open Export Modal.
2. Select PDF format.
3. Enable 'Title Page' and 'Traceability Chapter'.
4. Download and open the PDF.
5. Verify page breaks, numbering, and table formatting.
Expected Results: PDF is readable, professional, and contains all requested sections.`,
      requirementIds: [],
      status: 'approved',
      priority: 'medium',
      author: 'UX Designer',
      dateCreated: now,
      revision: '02',
    },
  ],
  information: [
    {
      title: 'The Atomic Philosophy',
      content: `## Why Atomic?
Most Requirement Management Tools (RMTs) use a single monolithic database. This creates:
1. **Merge Conflicts**: Two people can't easily edit different requirements.
2. **Audit Complexity**: It's hard to see who changed what and why in a database log.
3. **Lock-in**: Your data is trapped in a proprietary format.

**Tracyfy solves this by treating every artifact as a first-class file.** This allows us to use Git—the world's most powerful version control system—to handle all of these problems for free.`,
      type: 'note',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Technical Architecture',
      content: `## Stack Overview
- **Vite/React**: For a lightning-fast UI.
- **Tailwind CSS**: For premium, accessible styling.
- **Isomorphic-Git**: A pure JS implementation of Git for the browser.
- **File System Access API**: For native local disk integration.
- **React Flow**: For visualizing traceability as an interactive graph.`,
      type: 'note',
      dateCreated: now,
      revision: '01',
    },
  ],
  risks: [
    {
      title: 'Browser Compatibility',
      description: 'Risk of the File System Access API not being supported in all browsers.',
      category: 'technical',
      impact: 'medium',
      probability: 'high',
      mitigation: 'Implement a fallback to virtual filesystem (indexedDB) or cloud sync.',
      contingency: 'Allow users to manually export data as JSON if the filesystem is unavailable.',
      status: 'mitigating',
      owner: 'Product Manager',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Performance at Scale',
      description: 'Risk of UI slowdown with thousands of artifacts.',
      category: 'technical',
      impact: 'high',
      probability: 'medium',
      mitigation: 'Use virtualization for lists and worker threads for graph calculations.',
      contingency: 'Advise users to split large projects into smaller linked repositories.',
      status: 'analyzing',
      owner: 'Performance Engineer',
      dateCreated: now,
      revision: '01',
    },
  ],
  links: [
    {
      sourceIndex: 0,
      sourceType: 'tc',
      targetIndex: 0,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Verify Atomic Save -> Atomic Persistence Model
    {
      sourceIndex: 1,
      sourceType: 'tc',
      targetIndex: 3,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Test Link Integrity -> Cross-Artifact Traceability
    {
      sourceIndex: 2,
      sourceType: 'tc',
      targetIndex: 1,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Verify Privacy -> Local-First Privacy
    {
      sourceIndex: 3,
      sourceType: 'tc',
      targetIndex: 4,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Check PDF -> Advanced Export
    {
      sourceIndex: 0,
      sourceType: 'uc',
      targetIndex: 0,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Create Artifact -> Atomic Persistence Model
    {
      sourceIndex: 1,
      sourceType: 'uc',
      targetIndex: 3,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Establish Link -> Cross-Artifact Traceability
    {
      sourceIndex: 2,
      sourceType: 'uc',
      targetIndex: 5,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Run Analysis -> Impact Analysis
    {
      sourceIndex: 0,
      sourceType: 'risk',
      targetIndex: 1,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Browser Compatibility -> Local-First Privacy
    {
      sourceIndex: 1,
      sourceType: 'risk',
      targetIndex: 6,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Performance Scale -> Fast Search
  ],
};
