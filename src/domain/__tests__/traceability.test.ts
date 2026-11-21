import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TRACEABILITY,
  findGaps,
  isAllowed,
  linkOptions,
  type TraceabilityRules,
  type TracedLink,
} from '../traceability';
import { parseProjectConfig, serializeProjectConfig, settingsOf } from '../projectConfig';

const rules = DEFAULT_TRACEABILITY;
let n = 0;
const link = (sourceId: string, type: TracedLink['type'], targetId: string): TracedLink => ({
  id: `LINK-${String(++n).padStart(3, '0')}`,
  sourceId,
  type,
  targetId,
});
const artifacts = (...ids: string[]) => ids.map((id) => ({ id }));

describe('which links the rules allow', () => {
  it('a directed type only in its own direction', () => {
    expect(isAllowed(rules, 'testCase', 'verifies', 'requirement')).toBe(true);
    expect(isAllowed(rules, 'requirement', 'verifies', 'testCase')).toBe(false);
  });

  it("'*' matches every kind, and a symmetric type either way round", () => {
    const custom: TraceabilityRules = {
      allowed: [
        ['requirement', 'conflicts_with', 'useCase'],
        ['*', 'related_to', '*'],
      ],
      coverage: [],
    };
    expect(isAllowed(custom, 'risk', 'related_to', 'document')).toBe(true);
    expect(isAllowed(custom, 'useCase', 'conflicts_with', 'requirement')).toBe(true);
  });
});

describe('the relations offered between two kinds', () => {
  it('read from where the user starts: a requirement is "Verified by" a test case', () => {
    const fromRequirement = linkOptions(rules, 'requirement', 'testCase');
    expect(fromRequirement.map((o) => [o.label, o.direction])).toEqual([
      ['Verified by', 'backward'],
      ['Duplicates', 'forward'],
      ['Related to', 'forward'],
    ]);
    const fromTestCase = linkOptions(rules, 'testCase', 'requirement');
    expect(fromTestCase[0]).toMatchObject({ label: 'Verifies', direction: 'forward' });
  });

  it('between two requirements, both directions of refines, but a symmetric type once', () => {
    const labels = linkOptions(rules, 'requirement', 'requirement').map((o) => o.label);
    expect(labels).toEqual(expect.arrayContaining(['Refines', 'Refined by', 'Conflicts with']));
    expect(labels.filter((l) => l === 'Conflicts with')).toHaveLength(1);
  });

  it('none when the rules allow nothing', () => {
    const strict: TraceabilityRules = {
      allowed: [['testCase', 'verifies', 'requirement']],
      coverage: [],
    };
    expect(linkOptions(strict, 'requirement', 'risk')).toEqual([]);
  });
});

describe('gaps', () => {
  it('an artifact that breaks a coverage rule, by rule name', () => {
    const gaps = findGaps(rules, artifacts('REQ-001', 'REQ-002', 'TC-001'), [
      link('TC-001', 'verifies', 'REQ-001'),
    ]);
    expect(gaps).toEqual([
      { issue: 'coverage', artifactId: 'REQ-002', rule: 'Every requirement is verified' },
    ]);
  });

  it('only the link type the rule names counts', () => {
    // Being related to another requirement does not make a requirement verified
    const gaps = findGaps(rules, artifacts('REQ-001', 'REQ-002'), [
      link('REQ-002', 'related_to', 'REQ-001'),
    ]);
    expect(gaps.map((g) => g.artifactId)).toEqual(['REQ-001', 'REQ-002']);
  });

  it('a link to a deleted artifact does not cover anything, and deleted artifacts have no gaps', () => {
    const gaps = findGaps(
      rules,
      [{ id: 'REQ-001' }, { id: 'REQ-002', isDeleted: true }, { id: 'TC-001', isDeleted: true }],
      [link('TC-001', 'verifies', 'REQ-001')]
    );
    expect(gaps.map((g) => [g.artifactId, g.issue])).toEqual([['REQ-001', 'coverage']]);
  });

  it('a link the rules do not allow, and an orphan link', () => {
    const notAllowed = link('REQ-001', 'verifies', 'TC-001');
    const orphan = link('TC-001', 'verifies', 'REQ-404');
    const gaps = findGaps({ ...rules, coverage: [] }, artifacts('REQ-001', 'TC-001'), [
      notAllowed,
      orphan,
    ]);
    expect(gaps).toEqual([
      { issue: 'not_allowed', artifactId: 'REQ-001', linkId: notAllowed.id },
      { issue: 'orphan_link', artifactId: 'TC-001', linkId: orphan.id, missingId: 'REQ-404' },
    ]);
  });

  it('an outgoing rule: every test case verifies something', () => {
    const gaps = findGaps(rules, artifacts('REQ-001', 'TC-001', 'TC-002'), [
      link('TC-001', 'verifies', 'REQ-001'),
    ]);
    expect(gaps).toEqual([
      { issue: 'coverage', artifactId: 'TC-002', rule: 'Every test case verifies something' },
    ]);
  });
});

describe('rules in tracyfy.yaml', () => {
  const file = [
    'schemaVersion: 1',
    'name: Door',
    'traceability:',
    '  coverage:',
    '    - name: Every use case is satisfied',
    '      kind: useCase',
    '      needs: { incoming: satisfies, from: requirement }',
    '',
  ].join('\n');

  it('a list the file sets replaces the default; one it leaves out stays default', () => {
    const settings = settingsOf(parseProjectConfig(file));
    expect(settings.traceability.coverage.map((r) => r.name)).toEqual([
      'Every use case is satisfied',
    ]);
    expect(settings.traceability.allowed).toBe(DEFAULT_TRACEABILITY.allowed);
  });

  it('is written back as it was, without the defaults', () => {
    const config = parseProjectConfig(file);
    const written = serializeProjectConfig(config);
    expect(parseProjectConfig(written)).toEqual(config);
    expect(written).toContain('Every use case is satisfied');
    expect(written).not.toContain('allowed:');
  });

  it('a rule with an unknown kind or link type is reported', () => {
    expect(() => parseProjectConfig(file.replace('kind: useCase', 'kind: usecase'))).toThrow(
      /traceability\.coverage\.0\.kind/
    );
    expect(() =>
      parseProjectConfig(
        'schemaVersion: 1\nname: x\ntraceability:\n  allowed:\n    - [testCase, verified_by, requirement]\n'
      )
    ).toThrow(/traceability\.allowed\.0\.1/);
  });
});
