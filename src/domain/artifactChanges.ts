/**
 * Whether an edit changes an artifact. Pure TypeScript: no React, no IO.
 */

/** Forms send '' / [] / {} for fields that are simply absent on stored artifacts */
const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === '' ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0);

const normalize = (v: unknown) => (isEmpty(v) ? '' : v);

/**
 * True if any field in `updates` differs from `existing`.
 * Values are compared structurally (artifact fields are plain JSON data);
 * undefined, null, '', [] and {} are all treated as "empty" and equal.
 * Bookkeeping fields (revision, lastModified) are ignored.
 */
export function hasArtifactChanges<T extends object>(existing: T, updates: Partial<T>): boolean {
  return Object.entries(updates).some(([key, value]) => {
    if (key === 'revision' || key === 'lastModified') return false;
    const current = (existing as Record<string, unknown>)[key];
    return JSON.stringify(normalize(current)) !== JSON.stringify(normalize(value));
  });
}
