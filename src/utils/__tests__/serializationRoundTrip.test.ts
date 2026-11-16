/**
 * Every artifact type must survive save → load with ALL fields intact.
 *
 * Replaces markdownPropertySafeguard.test.ts, which only searched the
 * serializer source code for property names. Here every field of every type
 * is populated (including text that looks like markdown/YAML syntax) and
 * the parsed result must equal the original exactly.
 */
import { describe, it, expect } from 'vitest';
import {
  requirementToMarkdown,
  markdownToRequirement,
  convertUseCaseToMarkdown,
  markdownToUseCase,
  testCaseToMarkdown,
  markdownToTestCase,
  informationToMarkdown,
  markdownToInformation,
  riskToMarkdown,
  markdownToRisk,
  documentToMarkdown,
  markdownToDocument,
  projectToMarkdown,
  markdownToProject,
  userToMarkdown,
  markdownToUser,
  customAttributeDefinitionToMarkdown,
  markdownToCustomAttributeDefinition,
} from '../markdownUtils';
import { linkToMarkdown, parseMarkdownLink } from '../linkMarkdownUtils';
import { workflowToMarkdown, parseMarkdownWorkflow } from '../workflowMarkdownUtils';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
  Project,
  User,
  Link,
  Workflow,
} from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';

/** Text that tends to break hand-written frontmatter/markdown serializers */
const TRICKY = [
  'Line one: with colon',
  '---',
  'Line "three" # not a heading',
  '',
  '- list item',
  '# A heading the user wrote',
  '## A subheading the user wrote',
  '\\# a line starting with a backslash',
  'last line',
].join('\n');
const T0 = 1_700_000_000_000;

const common = {
  lastModified: T0 + 1,
  revision: '07',
  isDeleted: true,
  deletedAt: T0 + 2,
  customAttributes: [
    { attributeId: 'ATTR-001', value: 'Engine' },
    { attributeId: 'ATTR-002', value: 3 },
    { attributeId: 'ATTR-003', value: true },
    { attributeId: 'ATTR-004', value: null },
  ],
  linkedArtifacts: [{ targetId: 'UC-002', type: 'satisfies' as const }],
};

const requirement: Requirement = {
  ...common,
  id: 'REQ-042',
  title: 'Title: with colon',
  text: TRICKY,
  description: TRICKY,
  rationale: TRICKY,
  comments: TRICKY,
  status: 'approved',
  priority: 'high',
  category: 'safety',
  dateCreated: T0,
  verificationMethod: 'test',
  approvalDate: T0 + 3,
  author: 'Ada',
  useCaseIds: ['UC-001', 'UC-002'],
};

const useCase: UseCase = {
  ...common,
  id: 'UC-007',
  title: 'Sign in',
  description: TRICKY,
  status: 'draft',
  priority: 'medium',
  actor: 'User',
  preconditions: TRICKY,
  postconditions: TRICKY,
  // legacy singular aliases are filled from the same sections on load
  precondition: TRICKY,
  postcondition: TRICKY,
  mainFlow: TRICKY,
  alternativeFlows: TRICKY,
  dateCreated: T0,
  useCaseIds: ['UC-001'],
  author: 'Ada',
};

const testCase: TestCase = {
  ...common,
  id: 'TC-003',
  title: 'Load test',
  description: TRICKY,
  status: 'passed',
  priority: 'low',
  steps: TRICKY,
  expectedResult: TRICKY,
  dateCreated: T0,
  lastRun: T0 + 4,
  author: 'Ada',
  requirementIds: ['REQ-001', 'REQ-042'],
};

const information: Information = {
  ...common,
  id: 'INFO-009',
  title: 'Architecture',
  description: TRICKY,
  text: TRICKY,
  content: TRICKY,
  type: 'note',
  status: 'draft',
  author: 'Ada',
  dateCreated: T0,
};

const risk: Risk = {
  ...common,
  id: 'RISK-005',
  title: 'Data loss',
  description: TRICKY,
  probability: 'high',
  impact: 'critical',
  mitigation: TRICKY,
  category: 'technical',
  contingency: TRICKY,
  owner: 'Bob',
  author: 'Ada',
  status: 'open',
  dateCreated: T0,
};

const document: ArtifactDocument = {
  ...common,
  id: 'DOC-002',
  title: 'Spec',
  description: TRICKY,
  structure: [
    { type: 'heading', title: 'Intro: overview', level: 1 },
    { type: 'artifact', id: 'REQ-042', artifactType: 'requirements' },
    { type: 'heading', title: 'Details', level: 2 },
  ],
  dateCreated: T0,
  author: 'Ada',
  status: 'draft',
};

const project: Project = {
  id: 'PROJ-001',
  name: 'Project: Alpha',
  description: TRICKY,
  baselines: ['BASE-001'],
  currentBaseline: 'BASE-001',
  isDeleted: true,
  lastModified: T0,
};

const user: User = { id: 'USER-003', name: 'Ada: Lovelace', dateCreated: T0, lastModified: T0 + 1 };

const link: Link = {
  id: 'LINK-011',
  sourceId: 'REQ-042',
  targetId: 'UC-007',
  type: 'satisfies',
  projectIds: ['PROJ-001', 'PROJ-002'],
  dateCreated: T0,
  lastModified: T0 + 1,
  revision: '02',
  isDeleted: true,
  deletedAt: T0 + 2,
  customAttributes: common.customAttributes,
};

const workflow: Workflow = {
  ...common,
  id: 'WF-004',
  title: 'Approve: login',
  description: TRICKY,
  type: 'approval',
  status: 'approved',
  assignedTo: 'USER-002',
  createdBy: 'USER-001',
  artifactIds: ['REQ-042', 'UC-007'],
  history: [{ id: 'H-1', type: 'approved', user: 'USER-002', timestamp: T0 + 5, comment: TRICKY }],
  dateCreated: T0,
  approvedBy: 'USER-002',
  approvalDate: T0 + 6,
  approverComment: TRICKY,
};

const attribute: CustomAttributeDefinition = {
  id: 'ATTR-001',
  name: 'Component: name',
  type: 'dropdown',
  description: TRICKY,
  required: true,
  defaultValue: 'Engine',
  options: ['Engine', 'Brakes: front', 'UI'],
  appliesTo: ['requirement', 'testCase'],
  dateCreated: T0,
  lastModified: T0 + 1,
  isDeleted: true,
  deletedAt: T0 + 2,
};

const CASES: [string, unknown, (x: never) => string, (s: string) => unknown][] = [
  ['requirement', requirement, requirementToMarkdown, markdownToRequirement],
  ['use case', useCase, convertUseCaseToMarkdown, markdownToUseCase],
  ['test case', testCase, testCaseToMarkdown, markdownToTestCase],
  ['information', information, informationToMarkdown, markdownToInformation],
  ['risk', risk, riskToMarkdown, markdownToRisk],
  ['document', document, documentToMarkdown, markdownToDocument],
  ['project', project, projectToMarkdown, markdownToProject],
  ['user', user, userToMarkdown, markdownToUser],
  ['link', link, linkToMarkdown, parseMarkdownLink],
  ['workflow', workflow, workflowToMarkdown, parseMarkdownWorkflow],
  [
    'custom attribute',
    attribute,
    customAttributeDefinitionToMarkdown,
    markdownToCustomAttributeDefinition,
  ],
];

describe.each(CASES)('%s save → load round trip', (_name, original, serialize, parse) => {
  it('keeps every field exactly', () => {
    const parsed = parse(serialize(original as never));
    expect(parsed).toEqual(original);
  });

  it('is stable: saving the loaded value again produces the same file', () => {
    const once = serialize(original as never);
    expect(serialize(parse(once) as never)).toBe(once);
  });
});

describe('files written by earlier versions still load', () => {
  it('requirement without escaped lines or new fields', () => {
    const legacy = [
      '---',
      'id: "REQ-001"',
      'title: "Login"',
      'status: "approved"',
      'revision: "03"',
      'dateCreated: 1700000000000',
      'lastModified: 1700000000001',
      'useCaseIds: []',
      'linkedArtifacts: []',
      '---',
      '',
      '# Login',
      '',
      '## Description',
      'Users sign in.',
      '',
      '## Requirement Text',
      'The system shall authenticate users.',
      '',
      '## Rationale',
      'Security.',
    ].join('\n');

    expect(markdownToRequirement(legacy)).toMatchObject({
      id: 'REQ-001',
      title: 'Login',
      status: 'approved',
      revision: '03',
      dateCreated: 1700000000000,
      description: 'Users sign in.',
      text: 'The system shall authenticate users.',
      rationale: 'Security.',
    });
  });

  it('information and project bodies', () => {
    const info = '---\nid: "INFO-001"\ntitle: "Arch"\n---\n\n# Arch\n\nSome notes.\nMore notes.';
    expect(markdownToInformation(info)).toMatchObject({ text: 'Some notes.\nMore notes.' });

    const proj =
      '---\nid: "PROJ-001"\nname: "Alpha"\nrequirementIds:\n  - "REQ-001"\n---\n\n# Alpha\n\nThe project.';
    expect(markdownToProject(proj)).toMatchObject({
      name: 'Alpha',
      description: 'The project.',
      baselines: [],
    });
  });
});
