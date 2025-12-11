import React from 'react';
import { FileText } from 'lucide-react';
import type { UseCase, Requirement, Project, UseCaseColumnVisibility } from '../types';
import { getPriorityStyle, getStatusStyle, badgeStyle } from '../utils/artifactStyles';

interface UseCaseListProps {
  useCases: UseCase[];
  requirements: Requirement[];
  onEdit: (useCase: UseCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: UseCaseColumnVisibility;
}

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  requirements,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
}) => {
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

  const getVisibleColumnCount = () => {
    let count = 1; // ID/Title always visible
    if (visibleColumns.description) count++;
    if (visibleColumns.actor) count++;
    if (visibleColumns.priority) count++;
    if (visibleColumns.status) count++;
    if (visibleColumns.preconditions) count++;
    if (visibleColumns.mainFlow) count++;
    if (showProjectColumn) count++;
    return count;
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

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
  };

  const tdStyle = {
    padding: '12px 16px',
    verticalAlign: 'top' as const,
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th style={{ ...thStyle, width: '250px' }}>ID / Title</th>
              {visibleColumns.revision && <th style={{ ...thStyle, width: '60px' }}>Rev</th>}
              {showProjectColumn && <th style={{ ...thStyle, width: '150px' }}>Project(s)</th>}
              {visibleColumns.description && (
                <th style={{ ...thStyle, minWidth: '200px' }}>Description</th>
              )}
              {visibleColumns.actor && <th style={{ ...thStyle, width: '120px' }}>Actor</th>}
              {visibleColumns.priority && <th style={{ ...thStyle, width: '100px' }}>Priority</th>}
              {visibleColumns.status && <th style={{ ...thStyle, width: '100px' }}>Status</th>}
              {visibleColumns.preconditions && (
                <th style={{ ...thStyle, minWidth: '150px' }}>Preconditions</th>
              )}
              {visibleColumns.mainFlow && (
                <th style={{ ...thStyle, minWidth: '200px' }}>Main Flow</th>
              )}
            </tr>
          </thead>
          <tbody>
            {useCases.length === 0 ? (
              <tr>
                <td
                  colSpan={getVisibleColumnCount()}
                  style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}
                >
                  No use cases found.
                </td>
              </tr>
            ) : (
              useCases.map((uc) => {
                const linkedReqs = getLinkedRequirements(uc.id);
                return (
                  <tr
                    key={uc.id}
                    onClick={() => onEdit(uc)}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')
                    }
                  >
                    <td style={tdStyle}>
                      <div
                        style={{
                          fontWeight: 500,
                          color: 'var(--color-accent)',
                          marginBottom: '4px',
                        }}
                      >
                        {uc.id}
                      </div>
                      <div style={{ color: 'var(--color-text-primary)' }}>{uc.title}</div>
                      {linkedReqs.length > 0 && (
                        <div
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          {linkedReqs.length} linked req{linkedReqs.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    {visibleColumns.revision && (
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-bg-tertiary)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {uc.revision || '01'}
                        </span>
                      </td>
                    )}
                    {showProjectColumn && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {getProjectNames(uc.id)
                            .split(', ')
                            .map(
                              (name, i) =>
                                name && (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: 'var(--font-size-xs)',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'var(--color-bg-tertiary)',
                                      color: 'var(--color-text-secondary)',
                                      border: '1px solid var(--color-border)',
                                    }}
                                  >
                                    {name}
                                  </span>
                                )
                            )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                        {uc.description || '-'}
                      </td>
                    )}
                    {visibleColumns.actor && (
                      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                        {uc.actor || '-'}
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td style={tdStyle}>
                        <span
                          style={{
                            ...badgeStyle,
                            backgroundColor: getPriorityStyle(uc.priority).bg,
                            color: getPriorityStyle(uc.priority).text,
                          }}
                        >
                          {uc.priority}
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td style={tdStyle}>
                        <span
                          style={{
                            ...badgeStyle,
                            backgroundColor: getStatusStyle(uc.status).bg,
                            color: getStatusStyle(uc.status).text,
                          }}
                        >
                          {uc.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.preconditions && (
                      <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                        {uc.preconditions || '-'}
                      </td>
                    )}
                    {visibleColumns.mainFlow && (
                      <td
                        style={{
                          ...tdStyle,
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {uc.mainFlow || '-'}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
