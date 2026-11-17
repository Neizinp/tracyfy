/**
 * Artifact IDs: PREFIX-NNN, where the file name is the ID.
 *
 * There is no counter. The next ID of a kind is one more than the highest ID
 * that exists, so an ID is never reused as long as its file stays (deleting
 * an artifact marks the file deleted instead of removing it).
 *
 * Pure TypeScript: no React, no IO.
 */

/** REQ + 12 → REQ-012 */
export function formatId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

/** The number in an ID of this prefix (REQ-012 → 12), or null for any other name */
export function idNumber(prefix: string, id: string): number | null {
  const match = new RegExp(`^${prefix}-(\\d+)$`).exec(id);
  return match ? parseInt(match[1], 10) : null;
}

/** Highest number among IDs of this prefix, 0 if there are none */
export function highestIdNumber(prefix: string, ids: Iterable<string>): number {
  let max = 0;
  for (const id of ids) {
    const n = idNumber(prefix, id);
    if (n !== null && n > max) max = n;
  }
  return max;
}

/** The `count` IDs following the highest existing one */
export function nextIds(prefix: string, existing: Iterable<string>, count: number): string[] {
  const start = highestIdNumber(prefix, existing);
  return Array.from({ length: count }, (_, i) => formatId(prefix, start + i + 1));
}
