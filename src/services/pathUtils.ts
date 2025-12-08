/**
 * Path normalization utilities for git filesystem operations
 */

/**
 * Normalize a path by removing leading slashes and ./ prefixes
 */
export function normalizePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/^\.\//, '');
}

/**
 * Check if a path is a git internal path (.git directory)
 */
export function isGitInternalPath(path: string): boolean {
  const normalized = normalizePath(path);
  return normalized.startsWith('.git/') || normalized === '.git';
}

/**
 * Create an ENOENT error with proper code property for isomorphic-git
 */
export function createENOENT(filePath: string): Error & { code?: string } {
  const err: Error & { code?: string } = new Error(
    `ENOENT: no such file or directory, open '${filePath}'`
  );
  err.code = 'ENOENT';
  return err;
}

/**
 * Filter out temporary/swap files that can cause race conditions
 */
export function filterTempFiles(entries: string[]): string[] {
  return entries.filter((entry) => {
    if (entry.endsWith('.crswap')) return false;
    if (entry.endsWith('.swp')) return false;
    if (entry.endsWith('.tmp')) return false;
    if (entry.endsWith('~')) return false;
    if (entry.startsWith('.#')) return false;
    return true;
  });
}
