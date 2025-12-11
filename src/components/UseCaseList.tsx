import React from 'react';
import { FileText } from 'lucide-react';
import type { UseCase, Requirement, Project } from '../types';

interface UseCaseListProps {
  useCases: UseCase[];
  requirements: Requirement[];
  onEdit: (useCase: UseCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  requirements,
  onEdit,
  showProjectColumn,
  projects,
}) => {
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <FileText size={48} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No use cases found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {useCases.map((useCase) => {
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
              onClick={() => onEdit(useCase)}
            >
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
                    {useCase.revision || '01'}
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
            </div>
          </div>
        );
      })}
    </div>
  );
};
