/**
 * Shared rehype plugin chain for rendering user-authored markdown.
 *
 * Markdown content comes from git repositories that may be pulled from
 * collaborators, so raw HTML is parsed (rehype-raw) but then sanitized
 * (rehype-sanitize, GitHub-style allowlist) before it reaches the DOM.
 * This strips <script>, <iframe>, event handler attributes, javascript: URLs etc.
 */
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Options } from 'react-markdown';

export const markdownSanitizeSchema = defaultSchema;

export const safeMarkdownRehypePlugins: NonNullable<Options['rehypePlugins']> = [
  rehypeRaw,
  [rehypeSanitize, markdownSanitizeSchema],
];
