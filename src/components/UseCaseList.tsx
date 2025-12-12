import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { FileText } from 'lucide-react';
import type { UseCase, Requirement, Project, UseCaseColumnVisibility } from '../types';
import { getPriorityStyle, getStatusStyle, badgeStyle } from '../utils/artifactStyles';
import { SortableHeader, sortItems, type SortConfig } from './SortableHeader';

interface UseCaseListProps {
  useCases: UseCase[];
  requirements: Requirement[];
  onEdit: (useCase: UseCase) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: UseCaseColumnVisibility;
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

// Memoized row component
const UseCaseRow = React.memo<{
  uc: UseCase;
  visibleColumns: UseCaseColumnVisibility;
  showProjectColumn?: boolean;
  getProjectNames: (ucId: string) => string;
  getLinkedRequirements: (ucId: string) => Requirement[];
}>(({ uc, visibleColumns, showProjectColumn, getProjectNames, getLinkedRequirements }) => {
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    verticalAlign: 'top',
    fontSize: 'var(--font-size-sm)',
  };

  const linkedReqs = getLinkedRequirements(uc.id);

  return (
    <>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
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
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{uc.actor || '-'}</td>
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
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
          {uc.mainFlow || '-'}
        </td>
      )}
    </>
  );
});
UseCaseRow.displayName = 'UseCaseRow';

export const UseCaseList: React.FC<UseCaseListProps> = ({
  useCases,
  requirements,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  // Memoize sorted use cases
  const sortedUseCases = useMemo(() => sortItems(useCases, sortConfig), [useCases, sortConfig]);

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

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
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
    <div
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableVirtuoso
        style={{ flex: 1 }}
        data={sortedUseCases}
        overscan={5}
        fixedHeaderContent={() => (
          <tr
            style={{
              background: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <SortableHeader
              label="ID / Title"
              sortKey="id"
              currentSort={sortConfig}
              onSort={onSortChange || (() => {})}
              style={{ width: '250px' }}
            />
            {visibleColumns.revision && (
              <SortableHeader
                label="Rev"
                sortKey="revision"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '60px' }}
              />
            )}
            {showProjectColumn && <th style={{ ...thStyle, width: '150px' }}>Project(s)</th>}
            {visibleColumns.description && (
              <th style={{ ...thStyle, minWidth: '200px' }}>Description</th>
            )}
            {visibleColumns.actor && (
              <SortableHeader
                label="Actor"
                sortKey="actor"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '120px' }}
              />
            )}
            {visibleColumns.priority && (
              <SortableHeader
                label="Priority"
                sortKey="priority"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.status && (
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.preconditions && (
              <th style={{ ...thStyle, minWidth: '150px' }}>Preconditions</th>
            )}
            {visibleColumns.mainFlow && (
              <th style={{ ...thStyle, minWidth: '200px' }}>Main Flow</th>
            )}
          </tr>
        )}
        itemContent={(_index, uc) => (
          <UseCaseRow
            uc={uc}
            visibleColumns={visibleColumns}
            showProjectColumn={showProjectColumn}
            getProjectNames={getProjectNames}
            getLinkedRequirements={getLinkedRequirements}
          />
        )}
        components={{
          Table: ({ style, ...props }) => (
            <table
              {...props}
              style={{
                ...style,
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-sm)',
              }}
            />
          ),
          TableHead: React.forwardRef(({ style, ...props }, ref) => (
            <thead
              ref={ref}
              {...props}
              style={{ ...style, position: 'sticky', top: 0, zIndex: 1 }}
            />
          )),
          TableRow: ({ item: uc, ...props }) => (
            <tr
              {...props}
              onClick={() => onEdit(uc)}
              style={{
                borderBottom: '1px solid var(--color-border)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                backgroundColor: 'var(--color-bg-card)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-card)')}
            />
          ),
        }}
      />
    </div>
  );
};
