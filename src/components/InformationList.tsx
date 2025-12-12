import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { FileText } from 'lucide-react';
import type { Information, Project, InformationColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { SortableHeader, sortItems, type SortConfig } from './SortableHeader';

interface InformationListProps {
  information: Information[];
  onEdit: (info: Information) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
  visibleColumns: InformationColumnVisibility;
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'decision':
      return { bg: 'var(--color-info-bg)', text: 'var(--color-info-light)' };
    case 'meeting':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'note':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

// Memoized row component
const InformationRow = React.memo<{
  info: Information;
  visibleColumns: InformationColumnVisibility;
  showProjectColumn?: boolean;
  getProjectNames: (infoId: string) => string;
}>(({ info, visibleColumns, showProjectColumn, getProjectNames }) => {
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    verticalAlign: 'top',
    fontSize: 'var(--font-size-sm)',
  };

  return (
    <>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
          {info.id}
        </div>
        <div style={{ color: 'var(--color-text-primary)' }}>{info.title}</div>
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
            {info.revision || '01'}
          </span>
        </td>
      )}
      {showProjectColumn && (
        <td style={tdStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {getProjectNames(info.id)
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
      {visibleColumns.type && (
        <td style={tdStyle}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              textTransform: 'capitalize',
              backgroundColor: getTypeStyle(info.type).bg,
              color: getTypeStyle(info.type).text,
            }}
          >
            {info.type}
          </span>
        </td>
      )}
      {visibleColumns.content && (
        <td
          style={{
            ...tdStyle,
            color: 'var(--color-text-secondary)',
            whiteSpace: 'pre-wrap',
            maxWidth: '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {info.content.length > 200 ? info.content.slice(0, 200) + '...' : info.content}
        </td>
      )}
      {visibleColumns.created && (
        <td style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDateTime(info.dateCreated)}
        </td>
      )}
    </>
  );
});
InformationRow.displayName = 'InformationRow';

export const InformationList: React.FC<InformationListProps> = ({
  information,
  onEdit,
  showProjectColumn,
  projects,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  // Memoize sorted information
  const sortedInformation = useMemo(
    () => sortItems(information, sortConfig),
    [information, sortConfig]
  );

  const getProjectNames = (infoId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.informationIds.includes(infoId))
      .map((p) => p.name)
      .join(', ');
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  };

  if (information.length === 0) {
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
          No information artifacts found. Create one to get started.
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
        data={sortedInformation}
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
            {visibleColumns.type && (
              <SortableHeader
                label="Type"
                sortKey="type"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.content && <th style={{ ...thStyle, minWidth: '300px' }}>Content</th>}
            {visibleColumns.created && <th style={{ ...thStyle, width: '140px' }}>Created</th>}
          </tr>
        )}
        itemContent={(_index, info) => (
          <InformationRow
            info={info}
            visibleColumns={visibleColumns}
            showProjectColumn={showProjectColumn}
            getProjectNames={getProjectNames}
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
          TableRow: ({ item: info, ...props }) => (
            <tr
              {...props}
              onClick={() => onEdit(info)}
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
