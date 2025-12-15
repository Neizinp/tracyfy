import React, { useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { ShieldAlert } from 'lucide-react';
import type { Risk, RiskColumnVisibility } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { SortableHeader, sortItems, type SortConfig } from './SortableHeader';

interface RiskListProps {
  risks: Risk[];
  onEdit: (risk: Risk) => void;
  visibleColumns: RiskColumnVisibility;
  sortConfig?: SortConfig;
  onSortChange?: (key: string) => void;
}

const getProbabilityStyle = (probability: string) => {
  switch (probability) {
    case 'high':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    case 'medium':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'low':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

const getImpactStyle = (impact: string) => {
  switch (impact) {
    case 'high':
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
    case 'medium':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'low':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    default:
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'resolved':
      return { bg: 'var(--color-success-bg)', text: 'var(--color-success-light)' };
    case 'accepted':
      return { bg: 'var(--color-info-bg)', text: 'var(--color-info-light)' };
    case 'mitigating':
      return { bg: 'var(--color-warning-bg)', text: 'var(--color-warning-light)' };
    case 'analyzing':
      return { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)' };
    default:
      return { bg: 'var(--color-error-bg)', text: 'var(--color-error-light)' };
  }
};

// Memoized row component
const RiskRow = React.memo<{
  risk: Risk;
  visibleColumns: RiskColumnVisibility;
}>(({ risk, visibleColumns }) => {
  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    verticalAlign: 'top',
    fontSize: 'var(--font-size-sm)',
  };

  const badgeStyle: React.CSSProperties = {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 500,
    textTransform: 'capitalize',
  };

  return (
    <>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500, color: 'var(--color-accent)', marginBottom: '4px' }}>
          {risk.id}
        </div>
        <div style={{ color: 'var(--color-text-primary)' }}>{risk.title}</div>
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
            {risk.revision || '01'}
          </span>
        </td>
      )}
      {visibleColumns.category && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {risk.category}
          </span>
        </td>
      )}
      {visibleColumns.probability && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getProbabilityStyle(risk.probability).bg,
              color: getProbabilityStyle(risk.probability).text,
            }}
          >
            {risk.probability}
          </span>
        </td>
      )}
      {visibleColumns.impact && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getImpactStyle(risk.impact).bg,
              color: getImpactStyle(risk.impact).text,
            }}
          >
            {risk.impact}
          </span>
        </td>
      )}
      {visibleColumns.status && (
        <td style={tdStyle}>
          <span
            style={{
              ...badgeStyle,
              backgroundColor: getStatusStyle(risk.status).bg,
              color: getStatusStyle(risk.status).text,
            }}
          >
            {risk.status}
          </span>
        </td>
      )}
      {visibleColumns.owner && (
        <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>{risk.owner || '—'}</td>
      )}
      {visibleColumns.description && (
        <td
          style={{
            ...tdStyle,
            color: 'var(--color-text-secondary)',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {risk.description.length > 100
            ? risk.description.slice(0, 100) + '...'
            : risk.description}
        </td>
      )}
      {visibleColumns.created && (
        <td style={{ ...tdStyle, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {formatDateTime(risk.dateCreated)}
        </td>
      )}
    </>
  );
});
RiskRow.displayName = 'RiskRow';

export const RiskList: React.FC<RiskListProps> = ({
  risks,
  onEdit,
  visibleColumns,
  sortConfig,
  onSortChange,
}) => {
  // Memoize sorted risks
  const sortedRisks = useMemo(() => sortItems(risks, sortConfig), [risks, sortConfig]);

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  };

  if (risks.length === 0) {
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
        <ShieldAlert size={48} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No risks found. Create one to get started.
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
        data={sortedRisks}
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
              style={{ width: '200px' }}
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
            {visibleColumns.category && <th style={{ ...thStyle, width: '100px' }}>Category</th>}
            {visibleColumns.probability && (
              <th style={{ ...thStyle, width: '100px' }}>Probability</th>
            )}
            {visibleColumns.impact && <th style={{ ...thStyle, width: '80px' }}>Impact</th>}
            {visibleColumns.status && (
              <SortableHeader
                label="Status"
                sortKey="status"
                currentSort={sortConfig}
                onSort={onSortChange || (() => {})}
                style={{ width: '100px' }}
              />
            )}
            {visibleColumns.owner && <th style={{ ...thStyle, width: '120px' }}>Owner</th>}
            {visibleColumns.description && (
              <th style={{ ...thStyle, minWidth: '200px' }}>Description</th>
            )}
            {visibleColumns.created && <th style={{ ...thStyle, width: '140px' }}>Created</th>}
          </tr>
        )}
        itemContent={(_index, risk) => <RiskRow risk={risk} visibleColumns={visibleColumns} />}
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
          TableRow: ({ item: risk, ...props }) => (
            <tr
              {...props}
              onClick={() => onEdit(risk)}
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
