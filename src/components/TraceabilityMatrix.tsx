import React from 'react';
import type { Requirement, Link } from '../types';

interface TraceabilityMatrixProps {
  requirements: Requirement[];
  links: Link[];
}

export const TraceabilityMatrix: React.FC<TraceabilityMatrixProps> = ({ requirements, links }) => {
  // Helper to check if req1 is a parent of req2
  const isParent = (parentId: string, childId: string): boolean => {
    const child = requirements.find((r) => r.id === childId);
    return child ? child.parentIds.includes(parentId) : false;
  };

  // Helper to find link between two requirements
  const getLink = (fromId: string, toId: string): Link | undefined => {
    return links.find(
      (l) =>
        (l.sourceId === fromId && l.targetId === toId) ||
        (l.sourceId === toId && l.targetId === fromId)
    );
  };

  // Helper to get cell content
  const getCellContent = (
    rowReq: Requirement,
    colReq: Requirement
  ): { text: string; color: string; tooltip: string } | null => {
    if (rowReq.id === colReq.id) {
      return null; // Same requirement
    }

    const link = getLink(rowReq.id, colReq.id);
    const isRowParentOfCol = isParent(rowReq.id, colReq.id);
    const isColParentOfRow = isParent(colReq.id, rowReq.id);

    if (isRowParentOfCol) {
      return {
        text: '↓ P',
        color: 'rgba(34, 197, 94, 0.2)',
        tooltip: `${rowReq.id} is parent of ${colReq.id}`,
      };
    }

    if (isColParentOfRow) {
      return {
        text: '↑ C',
        color: 'rgba(59, 130, 246, 0.2)',
        tooltip: `${rowReq.id} is child of ${colReq.id}`,
      };
    }

    if (link) {
      const linkSymbols = {
        relates_to: '↔',
        depends_on: '→',
        conflicts_with: '⚠',
      };
      const colors = {
        relates_to: 'rgba(168, 85, 247, 0.2)',
        depends_on: 'rgba(251, 146, 60, 0.2)',
        conflicts_with: 'rgba(239, 68, 68, 0.2)',
      };
      return {
        text: linkSymbols[link.type],
        color: colors[link.type],
        tooltip: `${link.type.replace('_', ' ')}: ${link.sourceId} → ${link.targetId}`,
      };
    }

    return null;
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        padding: 'var(--spacing-md)',
        overflowX: 'auto',
      }}
    >
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
          Traceability Matrix
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Shows relationships between requirements. ↓P=Parent, ↑C=Child, ↔=Relates, →=Depends,
          ⚠=Conflicts
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'var(--color-bg-card)',
                  padding: '8px',
                  border: '1px solid var(--color-border)',
                  fontWeight: 600,
                  textAlign: 'left',
                  minWidth: '120px',
                  zIndex: 2,
                }}
              >
                From / To
              </th>
              {requirements.map((req) => (
                <th
                  key={req.id}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--color-border)',
                    fontWeight: 600,
                    textAlign: 'center',
                    minWidth: '80px',
                    backgroundColor: 'var(--color-bg-sidebar)',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {req.id}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requirements.map((rowReq, rowIndex) => (
              <tr
                key={rowReq.id}
                style={{
                  backgroundColor:
                    rowIndex % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-hover)',
                }}
              >
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    backgroundColor:
                      rowIndex % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-hover)',
                    padding: '8px',
                    border: '1px solid var(--color-border)',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    zIndex: 1,
                  }}
                >
                  {rowReq.id}
                </td>
                {requirements.map((colReq) => {
                  const cellContent = getCellContent(rowReq, colReq);
                  return (
                    <td
                      key={colReq.id}
                      style={{
                        padding: '8px',
                        border: '1px solid var(--color-border)',
                        textAlign: 'center',
                        backgroundColor: cellContent ? cellContent.color : 'var(--color-bg-card)',
                        fontWeight: cellContent ? 600 : 400,
                        cursor: cellContent ? 'help' : 'default',
                      }}
                      title={cellContent?.tooltip || ''}
                    >
                      {cellContent ? cellContent.text : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-bg-sidebar)',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        <strong>Legend:</strong>
        <div
          style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: '4px', flexWrap: 'wrap' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '4px',
              }}
            >
              ↓ P
            </span>
            Parent
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '4px',
              }}
            >
              ↑ C
            </span>
            Child
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '4px',
              }}
            >
              ↔
            </span>
            Relates To
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '4px',
              }}
            >
              →
            </span>
            Depends On
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '4px',
              }}
            >
              ⚠
            </span>
            Conflicts With
          </span>
        </div>
      </div>
    </div>
  );
};
