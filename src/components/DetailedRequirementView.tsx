import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import type { Requirement, ColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';

interface DetailedRequirementViewProps {
    requirements: Requirement[];
    onEdit: (requirement: Requirement) => void;
    visibleColumns: ColumnVisibility;
    onColumnVisibilityChange?: (columns: ColumnVisibility) => void;
}

// Compact Markdown renderer for table cells
const MarkdownCell: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return <span>-</span>;

    return (
        <div className="markdown-cell" style={{ fontSize: '0.875rem' }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                    // Compact styling for table cells
                    h1: ({ ...props }) => <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0', color: 'var(--color-text-primary)' }} {...props} />,
                    h2: ({ ...props }) => <h2 style={{ fontSize: '1rem', fontWeight: 'bold', margin: '4px 0', color: 'var(--color-text-primary)' }} {...props} />,
                    h3: ({ ...props }) => <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', margin: '3px 0', color: 'var(--color-text-primary)' }} {...props} />,
                    h4: ({ ...props }) => <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '2px 0', color: 'var(--color-text-primary)' }} {...props} />,
                    p: ({ ...props }) => <p style={{ margin: '2px 0', color: 'var(--color-text-secondary)' }} {...props} />,
                    ul: ({ ...props }) => <ul style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }} {...props} />,
                    ol: ({ ...props }) => <ol style={{ margin: '4px 0', paddingLeft: '16px', color: 'var(--color-text-secondary)' }} {...props} />,
                    li: ({ ...props }) => <li style={{ margin: '1px 0', color: 'var(--color-text-secondary)' }} {...props} />,
                    blockquote: ({ ...props }) => (
                        <blockquote style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: '8px', margin: '4px 0', fontStyle: 'italic', color: 'var(--color-text-muted)' }} {...props} />
                    ),
                    code: ({ className, children, ...props }) => {
                        const inline = !className;
                        return inline ? (
                            <code style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.85em', color: 'var(--color-accent-light)' }} {...props}>
                                {children}
                            </code>
                        ) : (
                            <code style={{ display: 'block', backgroundColor: 'var(--color-bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', overflowX: 'auto', margin: '4px 0' }} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre: ({ ...props }) => <pre style={{ margin: '4px 0', overflowX: 'auto' }} {...props} />,
                    table: ({ ...props }) => (
                        <div style={{ overflowX: 'auto', margin: '4px 0' }}>
                            <table style={{ fontSize: '0.8rem', borderCollapse: 'collapse', border: '1px solid var(--color-border)' }} {...props} />
                        </div>
                    ),
                    thead: ({ ...props }) => <thead style={{ backgroundColor: 'var(--color-bg-secondary)' }} {...props} />,
                    th: ({ ...props }) => <th style={{ border: '1px solid var(--color-border)', padding: '4px 8px', textAlign: 'left' }} {...props} />,
                    td: ({ ...props }) => <td style={{ border: '1px solid var(--color-border)', padding: '4px 8px' }} {...props} />,
                    a: ({ ...props }) => <a style={{ color: 'var(--color-accent-light)', textDecoration: 'underline' }} {...props} />,
                    strong: ({ ...props }) => <strong style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }} {...props} />,
                    em: ({ ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                    hr: ({ ...props }) => <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export const DetailedRequirementView: React.FC<DetailedRequirementViewProps> = ({ requirements, onEdit, visibleColumns }) => {

    const getVisibleColumnCount = () => {
        return Object.values(visibleColumns).filter(Boolean).length;
    };

    return (
        <div>
            {/* Table */}
            <div style={{
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                overflow: 'hidden' // For rounded corners with table
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                {visibleColumns.idTitle && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>ID / Title</th>}
                                {visibleColumns.description && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '200px' }}>Description</th>}
                                {visibleColumns.text && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '250px' }}>Requirement Text</th>}
                                {visibleColumns.rationale && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '200px' }}>Rationale</th>}
                                {visibleColumns.author && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '120px' }}>Author</th>}
                                {visibleColumns.verification && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '150px' }}>Verification</th>}
                                {visibleColumns.priority && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '100px' }}>Priority</th>}
                                {visibleColumns.status && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '100px' }}>Status</th>}
                                {visibleColumns.comments && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '180px' }}>Comments</th>}
                                {visibleColumns.created && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Created</th>}
                                {visibleColumns.approved && <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '140px' }}>Approved</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requirements.length === 0 ? (
                                <tr>
                                    <td colSpan={getVisibleColumnCount()} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No requirements found.
                                    </td>
                                </tr>
                            ) : (
                                requirements.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() => onEdit(req)}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background-color 0.1s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {visibleColumns.idTitle && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontFamily: 'monospace', color: 'var(--color-accent-light)', fontWeight: 500 }}>{req.id}</span>
                                                    <span style={{ fontWeight: 500 }}>{req.title}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleColumns.description && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <MarkdownCell content={req.description} />
                                            </td>
                                        )}
                                        {visibleColumns.text && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <MarkdownCell content={req.text} />
                                            </td>
                                        )}
                                        {visibleColumns.rationale && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <MarkdownCell content={req.rationale} />
                                            </td>
                                        )}
                                        {visibleColumns.author && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.author || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.verification && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.verificationMethod || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.priority && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: req.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                    color: req.priority === 'high' ? '#fca5a5' : 'var(--color-text-secondary)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {req.priority}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.status && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: req.status === 'verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                                                    color: req.status === 'verified' ? '#6ee7b7' : 'var(--color-text-secondary)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.comments && (
                                            <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                                <MarkdownCell content={req.comments || ''} />
                                            </td>
                                        )}
                                        {visibleColumns.created && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {formatDateTime(req.dateCreated)}
                                            </td>
                                        )}
                                        {visibleColumns.approved && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {req.approvalDate ? formatDateTime(req.approvalDate) : '-'}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
