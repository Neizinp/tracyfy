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
    // 0: Atomic Storage
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Atomic Storage' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 1: URI Mapping
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Atomic Storage' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 2: Local-First Indexing
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Security & Privacy' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 3: Data Privacy
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Security & Privacy' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 4: Commit Orchestration
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Git Integration' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 5: Commit Signing
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Git Integration' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 6: Integrated History
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Git Integration' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 7: Universal Linking
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P0 (Critical)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 8: Link Typing
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 9: Matrix Automation
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 10: Bidirectional Navigation
    [
      { attributeId: attrIds[0], value: 'v1.0 (MVP)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 11: PDF Generation
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Export System' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 12: Excel Data Export
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Export System' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 13: Dependency Traversal
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Unverified' },
    ],
    // 14: Suspect Link Flagging
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Traceability Engine' },
      { attributeId: attrIds[2], value: 'P1 (Important)' },
      { attributeId: attrIds[3], value: 'Unverified' },
    ],
    // 15: Full-Text Search
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Frontend UI' },
      { attributeId: attrIds[2], value: 'P2 (Nice to have)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 16: Responsive UX
    [
      { attributeId: attrIds[0], value: 'v1.1 (Enhancements)' },
      { attributeId: attrIds[1], value: 'Frontend UI' },
      { attributeId: attrIds[2], value: 'P2 (Nice to have)' },
      { attributeId: attrIds[3], value: 'Verified' },
    ],
    // 17: Visual Identity (Design Language)
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
      title: 'Atomic Storage Format',
      description: 'Storing artifacts as individual, human-readable Markdown files.',
      text: 'The system shall store each artifact (Requirement, Use Case, TestCase, Information, Risk) as a standalone Markdown file.',
      rationale:
        'Atomic storage prevents monolithic data corruption and facilitates granular version control.',
      status: 'approved',
      priority: 'high',
      author: 'Tracyfy Core Team',
      verificationMethod: 'Filesystem integration test',
      comments: 'Fundamental to the "Atomic Philosophy".',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Artifact-to-Path Mapping',
      description: 'Translating Unique IDs to structured filesystem paths.',
      text: 'The system shall map each artifact ID to a dedicated filesystem path using the pattern: `/{type}/{id}.md`.',
      rationale: 'Predictable mapping is required for direct file access and indexing.',
      status: 'approved',
      priority: 'high',
      author: 'Tracyfy Core Team',
      verificationMethod: 'Unit test',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Browser-Based Data Indexing',
      description: 'Indexing artifacts within the local runtime environment.',
      text: 'The system shall maintain and update all project indices exclusively within the browser runtime environment.',
      rationale: 'Enables high-performance search without requiring a server-side database.',
      status: 'approved',
      priority: 'high',
      author: 'Security Lead',
      verificationMethod: 'Browser memory profiling',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Local Data Privacy',
      description: 'Ensuring engineering data remains under local control.',
      text: 'The system shall ensure that no engineering data is transmitted to external servers without explicit user consent.',
      rationale: 'Compliance with enterprise security requirements.',
      status: 'approved',
      priority: 'high',
      author: 'Security Lead',
      verificationMethod: 'Network traffic analysis',
      comments: 'Vital for enterprise adoption.',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Automated Git Commit Orchestration',
      description: 'Recording changes automatically in the local repository.',
      text: 'The system shall automatically execute a Git commit operation for every successful preservation of an artifact.',
      rationale: 'Automates the audit trail and ensures no local changes are lost.',
      status: 'approved',
      priority: 'high',
      author: 'Git Integration Lead',
      verificationMethod: 'Git log analysis',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Local Git Identity Signing',
      description: 'Attributing changes to the local user.',
      text: 'The system shall sign every Git commit using the local user identity configured in the browser environment.',
      rationale: 'Essential for accountability in regulated industries.',
      status: 'approved',
      priority: 'high',
      author: 'Git Integration Lead',
      verificationMethod: 'Commit metadata inspection',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Integrated Revision History View',
      description: 'Exposing the Git audit trail within the UI.',
      text: 'The system shall provide a human-readable visualization of the artifact revision history derived directly from Git logs.',
      rationale: 'Provides transparent visibility into change evolution.',
      status: 'approved',
      priority: 'medium',
      author: 'Git Integration Lead',
      verificationMethod: 'UI verification',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Universal Cross-Type Linking',
      description: 'Establishing relationships between heterogeneous artifact types.',
      text: 'The system shall allow the creation of traceability links between any two artifacts, regardless of their specific type.',
      rationale: 'Enables complete end-to-end traceability across the development lifecycle.',
      status: 'approved',
      priority: 'high',
      author: 'Traceability Team',
      verificationMethod: 'Boundary testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Typed Relationship Support',
      description: 'Categorizing links with specific relationship types.',
      text: 'The system shall support the assignment of relationship types (e.g., "satisfies", "verifies") to every traceability link.',
      rationale: 'Adds semantic meaning to the links for better analysis.',
      status: 'approved',
      priority: 'high',
      author: 'Traceability Team',
      verificationMethod: 'Link metadata validation',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Automated Traceability Matrix Generation',
      description: 'Synchronizing matrix views with the underlying link data.',
      text: 'The system shall automatically update all traceability matrix visualizations whenever an underlying link is modified.',
      rationale: 'Ensures the consistency of the project status view.',
      status: 'approved',
      priority: 'high',
      author: 'Traceability Team',
      verificationMethod: 'Integration test',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Bidirectional Link Navigation',
      description: 'Navigating through the link graph in both directions.',
      text: 'The system shall provide navigation shortcuts to move between source and target artifacts of any traceability link.',
      rationale: 'Speeds up impact analysis and verification workflows.',
      status: 'approved',
      priority: 'medium',
      author: 'Traceability Team',
      verificationMethod: 'UI testing',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Sectioned PDF Generation',
      description: 'Creating professional PDF documentation.',
      text: 'The system shall generate PDF reports that include a Table of Contents and distinct sections for each artifact type.',
      rationale: 'Produces documentation suitable for formal reviews.',
      status: 'approved',
      priority: 'medium',
      author: 'Export Specialist',
      verificationMethod: 'PDF layout inspection',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Multi-Sheet Excel Workbook Export',
      description: 'Exporting flat data for external analysis.',
      text: 'The system shall export project data into Microsoft Excel workbooks using separate sheets for each artifact category.',
      rationale: 'Allows for custom calculations and project management tracking.',
      status: 'approved',
      priority: 'medium',
      author: 'Export Specialist',
      verificationMethod: 'Excel data validation',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Recursive Dependency Traversal',
      description: 'Calculating the downstream effects of a change.',
      text: 'The system shall automatically identify all downstream dependencies when evaluating the impact of an artifact modification.',
      rationale: 'Ensures that nothing is missed when requirements are updated.',
      status: 'approved',
      priority: 'high',
      author: 'Analysis Architect',
      verificationMethod: 'Graph traversal test',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Suspect Link Dependency Highlighting',
      description: 'Visual cues for potential verification gaps.',
      text: 'The system shall visually flag established links as "suspect" whenever the source artifact of the link is modified.',
      rationale: 'Directly informs the user of which verification items need re-run.',
      status: 'approved',
      priority: 'high',
      author: 'Analysis Architect',
      verificationMethod: 'UI animation test',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Global Full-Text Indexing',
      description: 'Maintaining a comprehensive search index.',
      text: 'The system shall maintain a global full-text index covering all artifact titles, descriptions, and specification text.',
      rationale: 'Prerequisite for high-speed search across large projects.',
      status: 'approved',
      priority: 'medium',
      author: 'Search Engineer',
      verificationMethod: 'Index coverage test',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Real-Time Search UI Integration',
      description: 'Providing instant feedback during text retrieval.',
      text: 'The system shall provide filtered search results to the user in real-time as they enter their query.',
      rationale: 'User efficiency depends on high-responsiveness in navigation.',
      status: 'approved',
      priority: 'medium',
      author: 'Search Engineer',
      verificationMethod: 'Latency benchmarking',
      comments: '',
      dateCreated: now,
      revision: '01',
    },
    {
      title: 'Premium Visual Design Language',
      description: 'Providing a high-efficiency professional interface.',
      text: 'The system UI shall utilize high-contrast typography and subtle micro-animations to enhance user focus and feedback.',
      rationale: 'Reduces cognitive load and increases tool delight.',
      status: 'approved',
      priority: 'low',
      author: 'UX Designer',
      verificationMethod: 'Expert review',
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
      text: `## Why Atomic?
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
      text: `## Stack Overview
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
    }, // Verify Atomic Save -> Atomic Storage
    {
      sourceIndex: 1,
      sourceType: 'tc',
      targetIndex: 7,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Test Link Integrity -> Universal Linking
    {
      sourceIndex: 2,
      sourceType: 'tc',
      targetIndex: 3,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Verify Privacy -> Data Privacy
    {
      sourceIndex: 3,
      sourceType: 'tc',
      targetIndex: 11,
      targetType: 'req',
      type: 'verifies',
      scope: 'project',
    }, // Check PDF -> PDF Generation
    {
      sourceIndex: 0,
      sourceType: 'uc',
      targetIndex: 0,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Create Artifact -> Atomic Storage
    {
      sourceIndex: 1,
      sourceType: 'uc',
      targetIndex: 7,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Establish Link -> Universal Linking
    {
      sourceIndex: 2,
      sourceType: 'uc',
      targetIndex: 13,
      targetType: 'req',
      type: 'satisfies',
      scope: 'project',
    }, // Run Analysis -> Dependency Traversal
    {
      sourceIndex: 0,
      sourceType: 'risk',
      targetIndex: 2,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Browser Compatibility -> Local-First Indexing
    {
      sourceIndex: 1,
      sourceType: 'risk',
      targetIndex: 15,
      targetType: 'req',
      type: 'related_to',
      scope: 'project',
    }, // Performance Scale -> Full-Text Search
  ],
};
