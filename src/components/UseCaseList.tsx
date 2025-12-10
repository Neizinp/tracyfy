import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, FileText } from 'lucide-react';
import type { UseCase, Requirement, Project } from '../types';

interface UseCaseListProps {
  useCases: UseCase[];
  requirements: Requirement[];
  onEdit: (useCase: UseCase) => void;
  onDelete: (id: string) => void;
  onBreakDown: (useCase: UseCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  requirements,
  onEdit,
  onDelete,
  onBreakDown,
  showProjectColumn,
  projects,
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  // Get requirements linked to a use case
  const getLinkedRequirements = (useCaseId: string): Requirement[] => {
    return requirements.filter((req) => req.useCaseIds?.includes(useCaseId));
  };

  const getProjectNames = (ucId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.useCaseIds.includes(ucId))
      .map((p) => p.name)
      .join(', ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'rgba(239, 68, 68, 0.2)';
      case 'medium':
        return 'rgba(251, 146, 60, 0.2)';
      case 'low':
        return 'rgba(34, 197, 94, 0.2)';
      default:
        return 'transparent';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'rgba(34, 197, 94, 0.2)';
      case 'implemented':
        return 'rgba(59, 130, 246, 0.2)';
      case 'approved':
        return 'rgba(168, 85, 247, 0.2)';
      case 'draft':
        return 'rgba(156, 163, 175, 0.2)';
      default:
        return 'transparent';
    }
  };

  if (useCases.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
        }}
      >
        <FileText size={48} style={{ margin: '0 auto', color: 'var(--color-text-muted)' }} />
        <h3
          style={{
            marginTop: 'var(--spacing-md)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
          }}
        >
          No Use Cases Yet
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
          Create your first use case to start capturing user requirements.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {useCases.map((useCase) => {
        const isExpanded = expandedIds.has(useCase.id);
        const linkedReqs = getLinkedRequirements(useCase.id);

        return (
          <div
            key={useCase.id}
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: 'var(--spacing-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
              onClick={() => toggleExpand(useCase.id)}
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-accent-light)',
                    }}
                  >
                    {useCase.id}
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: 'var(--color-text-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    v{useCase.revision || '01'}
                  </span>
                  <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 0 }}>
                    {useCase.title}
                  </h3>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    fontSize: 'var(--font-size-xs)',
                    flexWrap: 'wrap',
                  }}
                >
                  {showProjectColumn &&
                    getProjectNames(useCase.id)
                      .split(', ')
                      .map(
                        (name, i) =>
                          name && (
                            <span
                              key={i}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                              }}
                            >
                              {name}
                            </span>
                          )
                      )}
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: getPriorityColor(useCase.priority),
                      textTransform: 'capitalize',
                    }}
                  >
                    {useCase.priority}
                  </span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: getStatusColor(useCase.status),
                      textTransform: 'capitalize',
                    }}
                  >
                    {useCase.status}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>Actor: {useCase.actor}</span>
                  {linkedReqs.length > 0 && (
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      • {linkedReqs.length} requirement{linkedReqs.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onBreakDown(useCase)}
                  title="Break down into requirements"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 500,
                  }}
                >
                  Break Down
                </button>
                <button
                  onClick={() => onEdit(useCase)}
                  title="Edit use case"
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => onDelete(useCase.id)}
                  title="Delete use case"
                  style={{
                    padding: '6px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  borderTop: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-sidebar)',
                }}
              >
                {useCase.description && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>Description:</strong>
                    <p
                      style={{
                        marginTop: '4px',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {useCase.description}
                    </p>
                  </div>
                )}

                {useCase.preconditions && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>Preconditions:</strong>
                    <p
                      style={{
                        marginTop: '4px',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {useCase.preconditions}
                    </p>
                  </div>
                )}

                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <strong style={{ fontSize: 'var(--font-size-sm)' }}>Main Flow:</strong>
                  <p
                    style={{
                      marginTop: '4px',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {useCase.mainFlow}
                  </p>
                </div>

                {useCase.alternativeFlows && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>Alternative Flows:</strong>
                    <p
                      style={{
                        marginTop: '4px',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {useCase.alternativeFlows}
                    </p>
                  </div>
                )}

                {useCase.postconditions && (
                  <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>Postconditions:</strong>
                    <p
                      style={{
                        marginTop: '4px',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {useCase.postconditions}
                    </p>
                  </div>
                )}

                {linkedReqs.length > 0 && (
                  <div>
                    <strong style={{ fontSize: 'var(--font-size-sm)' }}>
                      Linked Requirements ({linkedReqs.length}):
                    </strong>
                    <div
                      style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    >
                      {linkedReqs.map((req) => (
                        <span
                          key={req.id}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            fontSize: 'var(--font-size-xs)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {req.id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
