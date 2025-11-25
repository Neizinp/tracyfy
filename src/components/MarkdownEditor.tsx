import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Eye, Edit2 } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    height?: number;
    placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    label,
    height = 200,
    placeholder = 'Enter text with Markdown formatting...'
}) => {
    const [isEditMode, setIsEditMode] = useState(true);

    return (
        <div className="markdown-editor-container">
            {label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {label}
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                            e.currentTarget.style.color = 'var(--color-text-primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                        title={isEditMode ? 'Switch to Preview' : 'Switch to Edit'}
                    >
                        {isEditMode ? (
                            <>
                                <Eye size={14} />
                                Preview
                            </>
                        ) : (
                            <>
                                <Edit2 size={14} />
                                Edit
                            </>
                        )}
                    </button>
                </div>
            )}

            {isEditMode ? (
                <div data-color-mode="dark">
                    <MDEditor
                        value={value}
                        onChange={(val) => onChange(val || '')}
                        height={height}
                        preview="edit"
                        hideToolbar={false}
                        enableScroll={true}
                        textareaProps={{
                            placeholder: placeholder
                        }}
                    />
                </div>
            ) : (
                <div
                    className="markdown-preview"
                    style={{
                        minHeight: `${height}px`,
                        maxHeight: `${height + 100}px`,
                        overflowY: 'auto',
                        border: '1px solid var(--color-border)',
                        borderRadius: '6px',
                        padding: '12px',
                        backgroundColor: 'var(--color-bg-app)',
                        fontSize: '0.875rem'
                    }}
                >
                    {value ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Custom styling for rendered elements - smaller, consistent with app
                                h1: ({ ...props }) => <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-text-primary)' }} {...props} />,
                                h2: ({ ...props }) => <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-text-primary)' }} {...props} />,
                                h3: ({ ...props }) => <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-text-primary)' }} {...props} />,
                                h4: ({ ...props }) => <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-primary)' }} {...props} />,
                                p: ({ ...props }) => <p style={{ marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }} {...props} />,
                                ul: ({ ...props }) => <ul style={{ listStyle: 'disc', listStylePosition: 'inside', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }} {...props} />,
                                ol: ({ ...props }) => <ol style={{ listStyle: 'decimal', listStylePosition: 'inside', marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }} {...props} />,
                                li: ({ ...props }) => <li style={{ color: 'var(--color-text-secondary)', marginBottom: '2px' }} {...props} />,
                                blockquote: ({ ...props }) => (
                                    <blockquote style={{ borderLeft: '3px solid var(--color-accent)', paddingLeft: '12px', fontStyle: 'italic', margin: '8px 0', color: 'var(--color-text-muted)' }} {...props} />
                                ),
                                code: ({ className, children, ...props }) => {
                                    const inline = !className;
                                    return inline ? (
                                        <code style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '3px', fontSize: '0.8125rem', color: 'var(--color-accent-light)' }} {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <code style={{ display: 'block', backgroundColor: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.8125rem', overflowX: 'auto', margin: '8px 0', color: 'var(--color-text-secondary)' }} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                pre: ({ ...props }) => <pre style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '4px', marginBottom: '8px', overflowX: 'auto' }} {...props} />,
                                table: ({ ...props }) => (
                                    <div style={{ overflowX: 'auto', marginBottom: '8px' }}>
                                        <table style={{ minWidth: '100%', border: '1px solid var(--color-border)', fontSize: '0.8125rem' }} {...props} />
                                    </div>
                                ),
                                thead: ({ ...props }) => <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }} {...props} />,
                                th: ({ ...props }) => <th style={{ border: '1px solid var(--color-border)', padding: '8px', textAlign: 'left', color: 'var(--color-text-primary)' }} {...props} />,
                                td: ({ ...props }) => <td style={{ border: '1px solid var(--color-border)', padding: '8px', color: 'var(--color-text-secondary)' }} {...props} />,
                                a: ({ ...props }) => <a style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }} {...props} />,
                                strong: ({ ...props }) => <strong style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }} {...props} />,
                                em: ({ ...props }) => <em style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }} {...props} />,
                                hr: ({ ...props }) => <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} {...props} />
                            }}
                        >
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>No content</p>
                    )}
                </div>
            )}
        </div>
    );
};
