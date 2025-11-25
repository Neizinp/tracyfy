import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Requirement, ColumnVisibility } from '../types';
import { ColumnSelector } from './ColumnSelector';

interface DetailedRequirementViewProps {
    requirements: Requirement[];
    onEdit: (requirement: Requirement) => void;
    onDelete: (id: string) => void;
    visibleColumns: ColumnVisibility;
    onColumnVisibilityChange: (columns: ColumnVisibility) => void;
}

export const DetailedRequirementView: React.FC<DetailedRequirementViewProps> = ({ requirements, onEdit, onDelete, visibleColumns, onColumnVisibilityChange }) => {
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    const getVisibleColumnCount = () => {
        return Object.values(visibleColumns).filter(Boolean).length + 1; // +1 for actions column
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this requirement?')) {
            onDelete(id);
        }
    };

    return (
        <div>
            {/* Column Selector */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <ColumnSelector
                    visibleColumns={visibleColumns}
                    onColumnVisibilityChange={onColumnVisibilityChange}
                />
            </div>

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
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)', width: '80px' }}></th>
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
                                        style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.1s' }}
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
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.description}
                                            </td>
                                        )}
                                        {visibleColumns.text && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.text || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.rationale && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.rationale || '-'}
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
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                {req.comments || '-'}
                                            </td>
                                        )}
                                        {visibleColumns.created && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {formatDate(req.dateCreated)}
                                            </td>
                                        )}
                                        {visibleColumns.approved && (
                                            <td style={{ padding: '12px', verticalAlign: 'top', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                {req.approvalDate ? formatDate(req.approvalDate) : '-'}
                                            </td>
                                        )}
                                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    onClick={() => onEdit(req)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: 'var(--color-text-muted)',
                                                        cursor: 'pointer',
                                                        padding: '4px'
                                                    }}
                                                    title="Edit"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(req.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        cursor: 'pointer',
                                                        padding: '4px'
                                                    }}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
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
