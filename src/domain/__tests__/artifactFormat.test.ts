/**
 * Every artifact type must survive save → load with ALL fields intact.
 *
 * Every field of every type is populated (including text that looks like
 * markdown/YAML syntax) and the parsed result must equal the original
 * exactly. The ID is the file name, so it is passed to the parser.
 */
import { describe, it, expect } from 'vitest';
import { parseArtifact, serializeArtifact, parseLink, serializeLink } from '../artifactFormat';
import { workflowToMarkdown, parseMarkdownWorkflow } from '../../utils/workflowMarkdownUtils';
import type { ArtifactKindId } from '../artifactKinds';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
  ArtifactDocument,
  Link,
  Workflow,
} from '../../types';

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
    { type: 'artifact', id: 'REQ-042', artifactType: 'requirement' },
    { type: 'heading', title: 'Details', level: 2 },
  ],
  dateCreated: T0,
  author: 'Ada',
  status: 'draft',
};

const link: Link = {
  id: 'LINK-011',
  sourceId: 'REQ-042',
  targetId: 'UC-007',
  type: 'satisfies',
  dateCreated: T0,
  lastModified: T0 + 1,
  revision: '02',
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

const kindCase = (kindId: ArtifactKindId, original: { id: string }) =>
  [
    kindId,
    original,
    (x: never) => serializeArtifact(kindId, x),
    (s: string) => parseArtifact(kindId, original.id, s),
  ] as [string, { id: string }, (x: never) => string, (s: string) => unknown];

const CASES: [string, { id: string }, (x: never) => string, (s: string) => unknown][] = [
  kindCase('requirement', requirement),
  kindCase('useCase', useCase),
  kindCase('testCase', testCase),
  kindCase('information', information),
  kindCase('risk', risk),
  kindCase('document', document),
  ['link', link, serializeLink, (s) => parseLink(link.id, s)],
  ['workflow', workflow, workflowToMarkdown, (s) => parseMarkdownWorkflow(workflow.id, s)],
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

describe('the files are readable plain text', () => {
  it('a requirement is short frontmatter plus markdown sections, named by its file', () => {
    const file = serializeArtifact('requirement', {
      id: 'REQ-012',
      title: 'Login timeout',
      status: 'approved',
      priority: 'high',
      description: 'The session ends.',
      text: 'The system shall log out after 15 minutes.',
      rationale: '',
      revision: '02',
      dateCreated: 5,
      lastModified: 6,
    } as Requirement);

    expect(file).toBe(
      [
        '---',
        'title: Login timeout',
        'status: approved',
        'priority: high',
        'revision: "02"',
        'dateCreated: 5',
        'lastModified: 6',
        '---',
        '',
        '# Login timeout',
        '',
        '## Description',
        'The session ends.',
        '',
        '## Requirement Text',
        'The system shall log out after 15 minutes.',
        '',
        '## Rationale',
        '',
      ].join('\n')
    );
  });

  it('a hand-written file with only a title loads with defaults', () => {
    expect(parseArtifact('requirement', 'REQ-001', '---\ntitle: Login\n---\n')).toMatchObject({
      id: 'REQ-001',
      title: 'Login',
      status: 'draft',
      priority: 'medium',
      revision: '01',
      text: '',
    });
  });
});

describe('a file that does not fit is reported, not loaded as wrong data', () => {
  it.each([
    ['no frontmatter', '# Login\n', /does not start with a --- frontmatter block/],
    ['broken YAML', '---\ntitle: [unclosed\n---\n', /not valid YAML/],
    ['no title', '---\nstatus: draft\n---\n', /title/],
    ['wrong type', '---\ntitle: Login\ndateCreated: yesterday\n---\n', /dateCreated/],
  ])('%s', (_case, content, message) => {
    expect(() => parseArtifact('requirement', 'REQ-001', content)).toThrow(message);
  });

  it('a link to an unknown link type', () => {
    expect(() =>
      parseLink('LINK-001', '---\nsource: REQ-001\ntype: loves\ntarget: REQ-002\n---\n')
    ).toThrow(/type/);
  });
});
