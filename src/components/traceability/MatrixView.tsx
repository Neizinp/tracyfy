/**
 * MatrixView Component
 *
 * Displays a traceability matrix showing relationships between artifacts.
 * Extracted from TraceabilityDashboard for better maintainability.
 */

import React from 'react';
import type { ArtifactType } from './index';
import { TYPE_COLORS } from './index';

export interface MatrixArtifact {
  id: string;
  title: string;
  type: ArtifactType;
  linkedArtifacts: { targetId: string; type: string }[];
}

export interface MatrixLink {
  sourceId: string;
  targetId: string;
  type: string;
}

interface MatrixViewProps {
  allArtifacts: MatrixArtifact[];
  allLinks: MatrixLink[];
  selectedTypes: Set<ArtifactType>;
  toggleType: (type: ArtifactType) => void;
}

const MAX_MATRIX_SIZE = 20;

const LINK_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  parent: { symbol: '↑', color: '#3b82f6' },
  child: { symbol: '↓', color: '#3b82f6' },
  depends_on: { symbol: '◆', color: '#f59e0b' },
  dependency_of: { symbol: '◇', color: '#f59e0b' },
  related_to: { symbol: '↔', color: '#8b5cf6' },
  satisfies: { symbol: '✓', color: '#22c55e' },
  satisfied_by: { symbol: '✓', color: '#22c55e' },
  verifies: { symbol: '✔', color: '#10b981' },
  verified_by: { symbol: '✔', color: '#10b981' },
  implements: { symbol: '▸', color: '#06b6d4' },
  implemented_by: { symbol: '◂', color: '#06b6d4' },
  references: { symbol: '→', color: '#6366f1' },
  referenced_by: { symbol: '←', color: '#6366f1' },
};

const TYPE_ORDER: Record<string, number> = {
  useCase: 0,
  requirement: 1,
  testCase: 2,
  information: 3,
};

export const MatrixView: React.FC<MatrixViewProps> = ({
  allArtifacts,
  allLinks,
  selectedTypes,
  toggleType,
}) => {
  const unsortedArtifacts =
    selectedTypes.size === 4 ? allArtifacts : allArtifacts.filter((a) => selectedTypes.has(a.type));

  const matrixArtifacts = [...unsortedArtifacts]
    .sort((a, b) => {
      const typeCompare = (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99);
      if (typeCompare !== 0) return typeCompare;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    })
    .slice(0, MAX_MATRIX_SIZE);

  // Build link map for quick lookup (bidirectional)
  const linkMap = new Map<string, Map<string, string>>();
  allLinks.forEach((link) => {
    if (!linkMap.has(link.sourceId)) linkMap.set(link.sourceId, new Map());
    linkMap.get(link.sourceId)!.set(link.targetId, link.type);
    if (!linkMap.has(link.targetId)) linkMap.set(link.targetId, new Map());
    if (!linkMap.get(link.targetId)!.has(link.sourceId)) {
      linkMap.get(link.targetId)!.set(link.sourceId, `←${link.type}`);
    }
  });

  const getLinkSymbol = (
    fromId: string,
    toId: string
  ): { symbol: string; color: string; isReverse?: boolean } | null => {
    if (fromId === toId) return { symbol: '●', color: 'var(--color-text-muted)' };
    const type = linkMap.get(fromId)?.get(toId);
    if (!type) return null;

    const isReverse = type.startsWith('←');
    const actualType = isReverse ? type.substring(1) : type;

    const result = LINK_SYMBOLS[actualType] || {
      symbol: '•',
      color: 'var(--color-text-secondary)',
    };
    return { ...result, isReverse };
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        padding: 'var(--spacing-md)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-primary)',
          }}
        >
          Traceability Matrix
        </h3>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { type: 'useCase' as ArtifactType, label: 'UC', color: TYPE_COLORS.useCase.text },
            {
              type: 'requirement' as ArtifactType,
              label: 'REQ',
              color: TYPE_COLORS.requirement.text,
            },
            { type: 'testCase' as ArtifactType, label: 'TC', color: TYPE_COLORS.testCase.text },
            {
              type: 'information' as ArtifactType,
              label: 'INFO',
              color: TYPE_COLORS.information.text,
            },
          ].map(({ type, label, color }) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: selectedTypes.has(type)
                  ? `2px solid ${color}`
                  : '2px solid var(--color-border)',
                backgroundColor: selectedTypes.has(type) ? `${color}20` : 'transparent',
                color: selectedTypes.has(type) ? color : 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {matrixArtifacts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-muted)',
          }}
        >
          No artifacts to display in the matrix.
        </div>
      ) : (
        <>
          {allArtifacts.length > MAX_MATRIX_SIZE && selectedTypes.size === 4 && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                borderRadius: '6px',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-warning-light)',
              }}
            >
              Showing first {MAX_MATRIX_SIZE} of {allArtifacts.length} artifacts. Use the toggles to
              narrow down.
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-xs)',
                whiteSpace: 'nowrap',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    From / To
                  </th>
                  {matrixArtifacts.map((col) => (
                    <th
                      key={col.id}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: TYPE_COLORS[col.type].bg,
                        border: '1px solid var(--color-border)',
                        fontWeight: 600,
                        color: TYPE_COLORS[col.type].text,
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        maxWidth: '30px',
                      }}
                      title={`${col.id}: ${col.title}`}
                    >
                      {col.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixArtifacts.map((row) => (
                  <tr key={row.id}>
                    <td
                      style={{
                        padding: '6px 8px',
                        backgroundColor: TYPE_COLORS[row.type].bg,
                        border: '1px solid var(--color-border)',
                        fontWeight: 600,
                        color: TYPE_COLORS[row.type].text,
                      }}
                      title={`${row.id}: ${row.title}`}
                    >
                      {row.id}
                    </td>
                    {matrixArtifacts.map((col) => {
                      const link = getLinkSymbol(row.id, col.id);
                      return (
                        <td
                          key={col.id}
                          style={{
                            padding: '4px',
                            border: '1px solid var(--color-border)',
                            textAlign: 'center',
                            backgroundColor:
                              row.id === col.id ? 'var(--color-bg-tertiary)' : 'transparent',
                            cursor: link && row.id !== col.id ? 'pointer' : 'default',
                          }}
                          title={
                            link && row.id !== col.id
                              ? link.isReverse
                                ? `${col.id} → ${row.id} (incoming)`
                                : `${row.id} → ${col.id}`
                              : ''
                          }
                        >
                          {link && (
                            <span
                              style={{
                                color: link.color,
                                fontWeight: 600,
                                opacity: link.isReverse ? 0.5 : 1,
                              }}
                            >
                              {link.symbol}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div
            style={{
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-sm)',
              backgroundColor: 'var(--color-bg-tertiary)',
              borderRadius: '6px',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Legend:</span>
            <span>
              <span style={{ color: '#3b82f6' }}>↑↓</span> parent/child
            </span>
            <span>
              <span style={{ color: '#22c55e' }}>✓</span> satisfies
            </span>
            <span>
              <span style={{ color: '#10b981' }}>✔</span> verifies
            </span>
            <span>
              <span style={{ color: '#8b5cf6' }}>↔</span> related
            </span>
            <span>
              <span style={{ color: '#f59e0b' }}>◆</span> depends
            </span>
            <span>
              <span style={{ color: '#6366f1' }}>→←</span> references
            </span>
          </div>
        </>
      )}
    </div>
  );
};
