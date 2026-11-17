/**
 * A baseline is a git tag (docs/DESIGN.md §3.5), so its name must be a valid
 * tag name. Pure TypeScript: no React, no IO.
 */

/** Why this cannot be a baseline name, or null if it can */
export function baselineNameError(name: string, existing: string[] = []): string | null {
  if (!name.trim()) return 'A baseline needs a name.';
  if (/\s/.test(name)) return 'A baseline name cannot contain spaces.';
  if (/[~^:?*[\\]|\.\.|@\{/.test(name))
    return 'A baseline name cannot contain ~ ^ : ? * [ \\ .. or @{.';
  if (/^[-./]|[./]$|\.lock$|\/\//.test(name)) return `"${name}" is not a valid baseline name.`;
  if (existing.includes(name)) return `There is already a baseline named ${name}.`;
  return null;
}
