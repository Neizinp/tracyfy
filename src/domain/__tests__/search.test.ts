import { describe, it, expect } from 'vitest';
import { findProperty, searchArtifacts, searchProperties, type SearchCriterion } from '../search';
import { kindRecord } from '../artifactKinds';
import type { ArtifactsByKind } from '../../types/state';
import type { CustomAttributeDefinition } from '../../types/customAttributes';

const reviewed: CustomAttributeDefinition = {
  id: 'ATTR-002',
  name: 'Reviewed',
  type: 'checkbox',
  appliesTo: ['risk', 'document'],
};

const artifacts = {
  ...kindRecord(() => []),
  requirement: [
    { id: 'REQ-001', title: 'Login', status: 'approved', rationale: 'Audit asked', dateCreated: 0 },
    { id: 'REQ-002', title: 'Old', status: 'draft', isDeleted: true },
  ],
  risk: [
    {
      id: 'RISK-001',
      title: 'Outage',
      status: 'identified',
      probability: 'high',
      customAttributes: [{ attributeId: 'ATTR-002', value: true }],
    },
  ],
  document: [{ id: 'DOC-001', title: 'Login spec', status: 'review', description: 'All of it' }],
} as unknown as ArtifactsByKind;

let n = 0;
const where = (property: string, condition: string, value = ''): SearchCriterion => ({
  id: String(++n),
  property,
  condition,
  value,
});
const ids = (criteria: SearchCriterion[], defs = [reviewed]) =>
  searchArtifacts(artifacts, criteria, defs).map((r) => r.id);

describe('advanced search', () => {
  it('covers every kind, documents included, and skips the trash', () => {
    expect(ids([where('any', 'contains', 'login')])).toEqual(['REQ-001', 'DOC-001']);
    expect(ids([where('_type', 'equals', 'document')])).toEqual(['DOC-001']);
  });

  it('searches any field of a kind, by the options that kind really has', () => {
    expect(ids([where('rationale', 'contains', 'audit')])).toEqual(['REQ-001']);
    const groups = searchProperties([]);
    const statuses = findProperty(groups, 'status')!.options!.map((o) => o.value);
    // Every kind's statuses, once each
    expect(statuses).toEqual(
      expect.arrayContaining(['approved', 'identified', 'review', 'passed'])
    );
    expect(new Set(statuses).size).toBe(statuses.length);
    expect(findProperty(groups, 'probability')!.options!.map((o) => o.value)).toEqual([
      'low',
      'medium',
      'high',
    ]);
    // A field that is a list for one kind and free text for another is searched as text
    expect(findProperty(groups, 'category')!.type).toBe('text');
  });

  it('searches custom attributes, also by the property name older saved filters use', () => {
    expect(ids([where('attr:ATTR-002', 'equals', 'true')])).toEqual(['RISK-001']);
    expect(ids([where('custom_ATTR-002', 'equals', 'true')])).toEqual(['RISK-001']);
    expect(findProperty(searchProperties([reviewed]), 'custom_ATTR-002')?.label).toBe('Reviewed');
  });

  it('all criteria must hold; empty ones are ignored', () => {
    expect(
      ids([
        where('status', 'equals', 'approved'),
        where('title', 'startsWith', 'log'),
        where('id', 'contains'),
      ])
    ).toEqual(['REQ-001']);
    expect(ids([where('rationale', 'isEmpty'), where('_type', 'equals', 'requirement')])).toEqual(
      []
    );
  });
});
