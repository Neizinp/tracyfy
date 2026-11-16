import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeMarkdownRehypePlugins } from '../utils/markdownSanitize';

/** Renders artifact markdown (sanitized) inside a table cell */
export const MarkdownCell = React.memo<{ content: string }>(({ content }) => {
  if (!content) return <span>-</span>;

  return (
    <div className="markdown-cell" style={{ fontSize: 'var(--font-size-sm)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={safeMarkdownRehypePlugins}
        components={{
          h1: ({ ...props }) => (
            <h1
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'bold',
                margin: '4px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                margin: '4px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'bold',
                margin: '3px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <h4
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'bold',
                margin: '2px 0',
                color: 'var(--color-text-primary)',
              }}
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p style={{ margin: '2px 0', color: 'var(--color-text-secondary)' }} {...props} />
          ),
          ul: ({ ...props }) => (
            <ul
              style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }}
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <li style={{ margin: '1px 0', color: 'var(--color-text-secondary)' }} {...props} />
          ),
          blockquote: ({ ...props }) => (
            <blockquote
              style={{
                borderLeft: '2px solid var(--color-accent)',
                paddingLeft: '8px',
                margin: '4px 0',
                fontStyle: 'italic',
                color: 'var(--color-text-muted)',
              }}
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const inline = !className;
            return inline ? (
              <code
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '1px 4px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-accent-light)',
                }}
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                style={{
                  display: 'block',
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: 'var(--font-size-sm)',
                  overflowX: 'auto',
                  margin: '4px 0',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ ...props }) => <pre style={{ margin: '4px 0', overflowX: 'auto' }} {...props} />,
          table: ({ ...props }) => (
            <div style={{ overflowX: 'auto', margin: '4px 0' }}>
              <table
                style={{
                  fontSize: 'var(--font-size-sm)',
                  borderCollapse: 'collapse',
                  border: '1px solid var(--color-border)',
                }}
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }} {...props} />
          ),
          th: ({ ...props }) => (
            <th
              style={{
                border: '1px solid var(--color-border)',
                padding: '4px 8px',
                textAlign: 'left',
              }}
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              style={{ border: '1px solid var(--color-border)', padding: '4px 8px' }}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }}
              {...props}
            />
          ),
          strong: ({ ...props }) => (
            <strong style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }} {...props} />
          ),
          em: ({ ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
          hr: ({ ...props }) => (
            <hr
              style={{
                margin: '8px 0',
                border: 'none',
                borderTop: '1px solid var(--color-border)',
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
MarkdownCell.displayName = 'MarkdownCell';
