/**
 * The pure parts of export: no mocks, real inputs.
 */
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import type { CommitInfo, Link, ProjectBaseline } from '../../types';
import { byId, relationsOf } from '../exportData';
import { changeOf, changeSummary, historyWindow } from '../revisionHistory';
import { describeSkipped, validArtifacts, validLinks, type SkippedRow } from '../importBundle';
import { parseJson } from '../json';
import { parseWorkbook } from '../excel';
import { tocPages } from '../pdf/writer';

const baseline = (name: string, timestamp: number): ProjectBaseline => ({
  name,
  description: '',
  timestamp,
  commit: name,
});
const commit = (timestamp: number, message: string): CommitInfo =>
  ({ hash: String(timestamp), timestamp, message, author: 'Ann' }) as CommitInfo;
const link = (id: string, sourceId: string, type: Link['type'], targetId: string): Link => ({
  id,
  sourceId,
  targetId,
  type,
  dateCreated: 0,
  lastModified: 0,
  revision: '01',
});

describe('historyWindow', () => {
  const b1 = baseline('1.0', 100);
  const b2 = baseline('2.0', 200);

  it('the working copy is compared with the newest baseline', () => {
    expect(historyWindow([b1, b2], null)).toEqual({ after: 200, until: null });
  });

  it('a baseline is compared with the one before it', () => {
    expect(historyWindow([b2, b1], b2)).toEqual({ after: 100, until: 200 });
  });

  it('the first baseline, and a project without baselines, have no history', () => {
    expect(historyWindow([b1, b2], b1)).toBeNull();
    expect(historyWindow([], null)).toBeNull();
  });
});

describe('changeOf', () => {
  const w = { after: 100, until: 200 };
  const item = { id: 'REQ-001', title: 'Login' };

  it('keeps only commits in the window, newest first', () => {
    const change = changeOf(
      item,
      'requirement',
      [commit(50, 'a'), commit(150, 'b'), commit(180, 'c'), commit(250, 'd')],
      w
    );
    expect(change?.commits.map((c) => c.message)).toEqual(['c', 'b']);
    expect(change?.added).toBe(false);
    expect(changeSummary(change!, 'Requirement')).toBe('• c\n• b');
  });

  it('an artifact first committed in the window is added', () => {
    const change = changeOf(item, 'requirement', [commit(150, 'Add login\n')], w);
    expect(change?.added).toBe(true);
    expect(changeSummary(change!, 'Requirement')).toBe('Requirement added');
  });

  it('an artifact deleted in the window is removed', () => {
    const change = changeOf(
      { ...item, isDeleted: true, deletedAt: 160 },
      'risk',
      [commit(50, 'a')],
      w
    );
    expect(changeSummary(change!, 'Risk')).toBe('Risk removed');
  });

  it('an artifact that did not change is not listed', () => {
    expect(changeOf(item, 'requirement', [commit(50, 'a'), commit(250, 'b')], w)).toBeNull();
  });
});

describe('relationsOf', () => {
  const links = [
    link('LINK-1', 'TC-001', 'verifies', 'REQ-002'),
    link('LINK-2', 'TC-001', 'verifies', 'REQ-001'),
    link('LINK-3', 'REQ-001', 'conflicts_with', 'REQ-003'),
    { ...link('LINK-4', 'TC-002', 'verifies', 'REQ-001'), isDeleted: true },
  ];

  it('reads a link from both ends, by its label from that end', () => {
    expect(relationsOf(links, 'TC-001')).toEqual([
      { label: 'Verifies', ids: ['REQ-001', 'REQ-002'] },
    ]);
    expect(relationsOf(links, 'REQ-001')).toEqual([
      { label: 'Conflicts with', ids: ['REQ-003'] },
      { label: 'Verified by', ids: ['TC-001'] },
    ]);
    // Symmetric: the same label from the target
    expect(relationsOf(links, 'REQ-003')).toEqual([{ label: 'Conflicts with', ids: ['REQ-001'] }]);
  });
});

describe('byId', () => {
  it('sorts by ID number, not as text', () => {
    expect(byId([{ id: 'REQ-10' }, { id: 'REQ-2' }, { id: 'REQ-001' }]).map((a) => a.id)).toEqual([
      'REQ-001',
      'REQ-2',
      'REQ-10',
    ]);
  });
});

describe('import validation', () => {
  it('checks each row with the file codec and reports the rejected ones', () => {
    const skipped: SkippedRow[] = [];
    const valid = validArtifacts(
      'risk',
      [
        { id: 'RISK-001', title: 'Outage', status: 'identified' },
        { id: '../evil', title: 'Path' },
        { id: 'RISK-002', title: '' },
        { id: 'RISK-003', title: 'Bad status', status: 'draft' },
        { id: 'RISK-001', title: 'Twice' },
        'not an object',
      ],
      skipped
    );
    expect(valid.map((a) => a.id)).toEqual(['RISK-001']);
    // Fields the row leaves out get their defaults, as when a file is read
    expect(valid[0]).toMatchObject({ probability: 'medium', impact: 'medium', category: 'other' });
    expect(skipped.map((s) => s.row)).toEqual([2, 3, 4, 5, 6]);
    expect(skipped[2].reason).toMatch(/not a status of a risk/);
    expect(describeSkipped(skipped, 1)).toMatch(
      /^Skipped 5 invalid row\(s\): Risks row 2: .* \(\+4 more\)$/
    );
  });

  it('links need valid IDs for both ends and a known type', () => {
    const skipped: SkippedRow[] = [];
    const valid = validLinks(
      [
        link('LINK-001', 'TC-001', 'verifies', 'REQ-001'),
        { ...link('LINK-002', 'TC-001', 'verifies', 'REQ-001'), targetId: '../x' },
        { ...link('LINK-003', 'TC-001', 'verifies', 'REQ-001'), type: 'parent' },
      ],
      skipped
    );
    expect(valid.map((l) => l.id)).toEqual(['LINK-001']);
    expect(skipped).toHaveLength(2);
  });

  it('parseJson reads artifacts by kind and refuses what is not an export', () => {
    const bundle = parseJson(
      JSON.stringify({ artifacts: { requirement: [{ id: 'REQ-001', title: 'Login' }], risk: 'x' } })
    );
    expect(bundle.artifacts.requirement.map((a) => a.id)).toEqual(['REQ-001']);
    expect(bundle.skipped).toEqual([{ where: 'Risks', row: 0, reason: 'not a list' }]);
    expect(() => parseJson('[]')).toThrow();
    expect(() => parseJson('{')).toThrow();
  });
});

describe('parseWorkbook', () => {
  it('reads a kind sheet by field labels; enum labels become values', () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          ID: 'REQ-001',
          Title: 'Login',
          Status: 'In review',
          Priority: 'HIGH',
          'Requirement Text': 'Shall',
        },
        { ID: 'REQ-002', Title: 'Check', Flag: 'Yes', Status: 'nonsense' },
      ]),
      'Requirements'
    );
    const bundle = parseWorkbook(XLSX, wb, [
      { id: 'ATTR-001', name: 'Flag', type: 'checkbox', appliesTo: ['requirement'] },
    ]);
    expect(bundle.artifacts.requirement).toHaveLength(1);
    expect(bundle.artifacts.requirement[0]).toMatchObject({
      id: 'REQ-001',
      status: 'in_review',
      priority: 'high',
      text: 'Shall',
    });
    expect(bundle.skipped[0]).toMatchObject({ where: 'Requirements', row: 2 });
  });
});

describe('tocPages', () => {
  it('fits the entries of one page on one page and spills over after that', () => {
    expect(tocPages([])).toBe(1);
    expect(tocPages(Array(40).fill(1))).toBe(1);
    expect(tocPages(Array(41).fill(1))).toBe(2);
    expect(tocPages(Array(82).fill(1))).toBe(2);
    expect(tocPages(Array(83).fill(1))).toBe(3);
  });
});
