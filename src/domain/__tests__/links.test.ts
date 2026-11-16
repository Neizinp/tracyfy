import { describe, it, expect } from 'vitest';
import { linkedIds, linkCounts, verifiedRequirementIds, type LinkEnds } from '../links';

const link = (sourceId: string, type: LinkEnds['type'], targetId: string): LinkEnds => ({
  sourceId,
  type,
  targetId,
});

describe('linkedIds', () => {
  it('finds outgoing links of the type', () => {
    const links = [link('TC-001', 'verifies', 'REQ-002'), link('TC-001', 'related_to', 'REQ-003')];
    expect(linkedIds(links, 'TC-001', 'verifies')).toEqual(['REQ-002']);
  });

  it('finds links stored from the other end under the inverse type', () => {
    const links = [link('REQ-001', 'verified_by', 'TC-001'), link('TC-001', 'verifies', 'REQ-002')];
    expect(linkedIds(links, 'TC-001', 'verifies')).toEqual(['REQ-001', 'REQ-002']);
  });

  it('reads a symmetric type in both directions', () => {
    const links = [link('REQ-001', 'related_to', 'REQ-002')];
    expect(linkedIds(links, 'REQ-002', 'related_to')).toEqual(['REQ-001']);
  });

  it('does not read a directed link backwards', () => {
    // REQ-001 verifies nothing: TC-001 verifies it
    expect(linkedIds([link('TC-001', 'verifies', 'REQ-001')], 'REQ-001', 'verifies')).toEqual([]);
  });

  it('ignores deleted links and reports each artifact once', () => {
    const links = [
      { ...link('TC-001', 'verifies', 'REQ-001'), isDeleted: true },
      link('TC-001', 'verifies', 'REQ-002'),
      link('REQ-002', 'verified_by', 'TC-001'),
    ];
    expect(linkedIds(links, 'TC-001', 'verifies')).toEqual(['REQ-002']);
  });
});

describe('linkCounts', () => {
  it('counts each link at both ends and skips deleted links', () => {
    const counts = linkCounts([
      link('REQ-001', 'related_to', 'REQ-002'),
      link('TC-001', 'verifies', 'REQ-001'),
      { ...link('TC-001', 'verifies', 'REQ-002'), isDeleted: true },
    ]);
    expect(Object.fromEntries(counts)).toEqual({ 'REQ-001': 2, 'REQ-002': 1, 'TC-001': 1 });
  });
});

describe('verifiedRequirementIds', () => {
  it('lists the requirements a test case verifies, from either end', () => {
    const links = [
      link('TC-001', 'verifies', 'REQ-002'),
      link('REQ-001', 'verified_by', 'TC-001'),
      link('TC-001', 'verifies', 'UC-001'), // not a requirement
      link('TC-002', 'verifies', 'REQ-003'), // another test case
    ];
    expect(verifiedRequirementIds(links, 'TC-001')).toEqual(['REQ-001', 'REQ-002']);
  });
});
