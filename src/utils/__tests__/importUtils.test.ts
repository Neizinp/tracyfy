import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import {
  isValidArtifactId,
  parseJsonImport,
  parseExcelImport,
  parseExcelFile,
  maxIdNumber,
  countImported,
  describeSkipped,
} from '../importUtils';

describe('isValidArtifactId', () => {
  it.each(['REQ-001', 'UC-12', 'TC_3', 'INFO-001', 'DOC-999'])('accepts %s', (id) => {
    expect(isValidArtifactId(id)).toBe(true);
  });

  it.each([
    '../REQ-001',
    'REQ/001',
    'REQ\\001',
    'REQ.001',
    '',
    '001',
    ' REQ-001',
    undefined,
    null,
    42,
  ])('rejects %j', (id) => {
    expect(isValidArtifactId(id)).toBe(false);
  });
});

describe('parseJsonImport', () => {
  it('keeps valid artifacts and reports invalid ones', () => {
    const bundle = parseJsonImport(
      JSON.stringify({
        requirements: [
          { id: 'REQ-001', title: 'Ok' },
          { id: '../../x', title: 'Traversal' },
          { id: 'REQ-002' },
          { id: 'REQ-001', title: 'Duplicate' },
          'not an object',
        ],
        useCases: [{ id: 'UC-001', title: 'Use case' }],
      })
    );

    expect(bundle.requirements.map((r) => r.id)).toEqual(['REQ-001']);
    expect(bundle.useCases).toHaveLength(1);
    expect(bundle.skipped).toHaveLength(4);
    expect(countImported(bundle)).toBe(2);
    expect(describeSkipped(bundle.skipped)).toContain('Skipped 4 invalid row(s)');
  });

  it('reports non-array sections instead of crashing', () => {
    const bundle = parseJsonImport(JSON.stringify({ requirements: { id: 'REQ-001' } }));
    expect(bundle.requirements).toEqual([]);
    expect(bundle.skipped[0].reason).toContain('not a list');
  });

  it('throws for invalid JSON or non-object roots', () => {
    expect(() => parseJsonImport('nope')).toThrow();
    expect(() => parseJsonImport('[]')).toThrow('project export object');
    expect(() => parseJsonImport('null')).toThrow('project export object');
  });
});

describe('parseExcelImport', () => {
  const workbookWith = (sheets: Record<string, Record<string, unknown>[]>) => {
    const wb = XLSX.utils.book_new();
    for (const [name, rows] of Object.entries(sheets)) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
    }
    return wb;
  };

  it('maps requirement and use case rows with defaults', () => {
    const bundle = parseExcelImport(
      workbookWith({
        Requirements: [
          { ID: 'REQ-010', Title: 'Login' },
          { ID: '', Title: 'No id' },
        ],
        'Use Cases': [{ ID: 'UC-005', Title: 'Sign in', Actor: 'User' }],
      }),
      XLSX.utils,
      1234
    );

    expect(bundle.requirements).toHaveLength(1);
    expect(bundle.requirements[0]).toMatchObject({
      id: 'REQ-010',
      title: 'Login',
      status: 'draft',
      priority: 'medium',
      dateCreated: 1234,
    });
    expect(bundle.useCases[0]).toMatchObject({ id: 'UC-005', actor: 'User', status: 'draft' });
    expect(bundle.skipped).toHaveLength(1);
  });

  it('parses raw file bytes via parseExcelFile', async () => {
    const wb = workbookWith({ Requirements: [{ ID: 'REQ-020', Title: 'From bytes' }] });
    const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
    const bundle = await parseExcelFile(bytes);
    expect(bundle.requirements.map((r) => r.id)).toEqual(['REQ-020']);
  });

  it('returns an empty bundle for workbooks without known sheets', () => {
    const bundle = parseExcelImport(workbookWith({ Other: [{ a: 1 }] }), XLSX.utils);
    expect(countImported(bundle)).toBe(0);
  });
});

describe('maxIdNumber', () => {
  it('returns the highest numeric suffix for the prefix', () => {
    expect(maxIdNumber(['REQ-001', 'REQ-042', 'REQ-7', 'UC-100', 'REQ-x'], 'REQ')).toBe(42);
    expect(maxIdNumber([], 'REQ')).toBe(0);
  });
});

describe('parseJsonImport links', () => {
  it('keeps valid links and rejects unsafe IDs', () => {
    const bundle = parseJsonImport(
      JSON.stringify({
        links: [
          { id: 'LINK-001', sourceId: 'REQ-001', targetId: 'UC-001', type: 'satisfies' },
          { id: '../x', sourceId: 'REQ-001', targetId: 'UC-001', type: 'satisfies' },
          { id: 'LINK-002', sourceId: 'REQ-001', targetId: '../../etc', type: 'satisfies' },
          { id: 'LINK-003', sourceId: 'REQ-001', targetId: 'UC-001' },
        ],
      })
    );
    expect(bundle.links.map((l) => l.id)).toEqual(['LINK-001']);
    expect(bundle.skipped).toHaveLength(3);
    expect(countImported(bundle)).toBe(1);
  });
});
