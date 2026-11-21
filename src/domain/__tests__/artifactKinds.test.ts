import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_KINDS,
  KIND_IDS,
  kind,
  kindOfId,
  kindOfFolder,
  isKindId,
  kindRecord,
} from '../artifactKinds';

describe('artifact kind registry', () => {
  it('defines every kind exactly once, with unique prefixes and folders', () => {
    expect(ARTIFACT_KINDS.map((k) => k.id)).toEqual([...KIND_IDS]);
    expect(new Set(ARTIFACT_KINDS.map((k) => k.prefix)).size).toBe(KIND_IDS.length);
    expect(new Set(ARTIFACT_KINDS.map((k) => k.folder)).size).toBe(KIND_IDS.length);
  });

  it('finds the kind of an artifact ID by its prefix', () => {
    expect(kindOfId('REQ-001')).toBe('requirement');
    expect(kindOfId('UC-12')).toBe('useCase');
    expect(kindOfId('TC-003')).toBe('testCase');
    expect(kindOfId('INFO-001')).toBe('information');
    expect(kindOfId('RISK-003')).toBe('risk');
    expect(kindOfId('DOC-001')).toBe('document');
  });

  it('does not treat other IDs as artifacts', () => {
    expect(kindOfId('LINK-001')).toBeUndefined();
    expect(kindOfId('RSK-001')).toBeUndefined();
    expect(kindOfId('REQ')).toBeUndefined();
    expect(kindOfId('')).toBeUndefined();
  });

  it('round-trips between kind, prefix and folder', () => {
    for (const k of ARTIFACT_KINDS) {
      expect(kindOfId(`${k.prefix}-001`)).toBe(k.id);
      expect(kindOfFolder(k.folder)).toBe(k.id);
      expect(kind(k.id)).toBe(k);
    }
  });

  it('recognizes only the canonical kind identifiers', () => {
    expect(isKindId('useCase')).toBe(true);
    expect(isKindId('usecase')).toBe(false);
    expect(isKindId('requirements')).toBe(false);
    expect(isKindId(undefined)).toBe(false);
  });

  it('builds a record with one entry per kind', () => {
    const record = kindRecord(() => 0);
    expect(Object.keys(record)).toEqual([...KIND_IDS]);
  });
});
