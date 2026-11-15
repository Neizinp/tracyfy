import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeMarkdownRehypePlugins } from '../markdownSanitize';

function renderMarkdown(content: string) {
  return render(
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={safeMarkdownRehypePlugins}>
      {content}
    </ReactMarkdown>
  ).container;
}

describe('safeMarkdownRehypePlugins', () => {
  it('removes script tags', () => {
    const container = renderMarkdown('Hello <script>window.pwned = true</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('removes iframes (including srcdoc)', () => {
    const container = renderMarkdown('<iframe srcdoc="<script>parent.x=1</script>"></iframe>');
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('strips event handler attributes', () => {
    const container = renderMarkdown('<img src="x.png" onerror="alert(1)">');
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('onerror')).toBeNull();
  });

  it('strips javascript: links', () => {
    const container = renderMarkdown('<a href="javascript:alert(1)">click</a>');
    expect(container.querySelector('a')?.getAttribute('href') ?? '').not.toContain('javascript');
  });

  it('keeps safe HTML and GFM formatting', () => {
    const container = renderMarkdown(
      '**bold** <sub>sub</sub> <details><summary>More</summary>text</details>\n\n| a | b |\n|---|---|\n| 1 | 2 |'
    );
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('sub')).not.toBeNull();
    expect(container.querySelector('details')).not.toBeNull();
    expect(container.querySelector('table')).not.toBeNull();
  });

  it('keeps relative asset image paths', () => {
    const container = renderMarkdown('![diagram](./assets/diagram.png)');
    expect(container.querySelector('img')?.getAttribute('src')).toBe('./assets/diagram.png');
  });
});
