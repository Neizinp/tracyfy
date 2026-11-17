/**
 * Markdown files with a frontmatter block:
 *
 *   ---
 *   status: draft
 *   priority: high
 *   ---
 *
 *   # Title
 *   ...
 *
 * The block is YAML, read and written with the yaml package; the rest of the
 * file is plain markdown. Pure TypeScript: no React, no IO.
 */
import { parse, stringify } from 'yaml';

export class FileFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileFormatError';
  }
}

/** Split a file into its frontmatter (an object) and markdown body; throws FileFormatError */
export function splitFrontmatter(text: string): { data: Record<string, unknown>; body: string } {
  const normalized = text.replace(/\r\n/g, '\n');
  // The closing --- must start a line: an indented --- inside a value is text
  const match = /^---\n(?:([\s\S]*?)\n)?---[ \t]*(?:\n|$)/.exec(normalized);
  if (!match) throw new FileFormatError('the file does not start with a --- frontmatter block');
  let data: unknown;
  try {
    data = parse(match[1] ?? '') ?? {};
  } catch (err) {
    throw new FileFormatError(`the frontmatter is not valid YAML (${(err as Error).message})`);
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new FileFormatError('the frontmatter must be a list of "key: value" lines');
  }
  return { data: data as Record<string, unknown>, body: normalized.slice(match[0].length).trim() };
}

const isEmpty = (v: unknown) =>
  v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);

/** Write frontmatter (empty values left out, keys in the given order) and body */
export function joinFrontmatter(data: Record<string, unknown>, body: string): string {
  const kept = Object.fromEntries(Object.entries(data).filter(([, v]) => !isEmpty(v)));
  const yaml = Object.keys(kept).length > 0 ? stringify(kept, { lineWidth: 0 }) : '';
  return `---\n${yaml}---\n\n${body.trim()}\n`;
}

/**
 * User text lives under `#` / `##` structure headings, so a user line starting
 * with "#" gets one extra leading backslash on write (removed again on read)
 * to keep it from being mistaken for structure.
 */
export function escapeBodyText(text: string | undefined): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => (/^\\*#/.test(line) ? `\\${line}` : line))
    .join('\n');
}

export function unescapeBodyText(text: string | undefined): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => (/^\\+#/.test(line) ? line.slice(1) : line))
    .join('\n');
}

/** The body after its "# Title" line, and its "## Heading" sections */
export function readBody(body: string): { text: string; sections: Record<string, string> } {
  const withoutTitle = body.replace(/^# [^\n]*(\n|$)/, '');
  const sections: Record<string, string> = {};
  const parts = withoutTitle.split(/^## (.*)$/m);
  for (let i = 1; i < parts.length; i += 2) {
    sections[parts[i].trim()] = unescapeBodyText(parts[i + 1].trim());
  }
  return { text: unescapeBodyText(parts[0].trim()), sections };
}
