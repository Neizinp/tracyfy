import { describe, it, expect } from 'vitest';
import { hasArtifactChanges } from '../artifactChanges';

interface Item {
  id: string;
  title: string;
  revision: string;
  lastModified: number;
  tags?: string[];
  description?: string;
  customAttributes?: unknown;
}

const existing: Item = {
  id: 'REQ-001',
  title: 'Login',
  tags: ['a'],
  revision: '03',
  lastModified: 1000,
};

describe('hasArtifactChanges', () => {
  it('ignores unchanged fields and bookkeeping fields', () => {
    expect(hasArtifactChanges(existing, { title: 'Login', tags: ['a'] })).toBe(false);
    expect(hasArtifactChanges(existing, { revision: '04', lastModified: 2000 })).toBe(false);
  });

  it('treats undefined, null, empty string, [] and {} as equal (what forms send)', () => {
    expect(hasArtifactChanges(existing, { description: '' })).toBe(false);
    expect(hasArtifactChanges(existing, { customAttributes: {} })).toBe(false);
  });

  it('detects changed values, including inside arrays', () => {
    expect(hasArtifactChanges(existing, { title: 'Logout' })).toBe(true);
    expect(hasArtifactChanges(existing, { tags: ['a', 'b'] })).toBe(true);
  });
});
