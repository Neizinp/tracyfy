/**
 * MatrixView Component
 *
 * Displays a traceability matrix showing relationships between artifacts.
 * Extracted from TraceabilityDashboard for better maintainability.
 */

import React from 'react';
import { kind, KIND_IDS, type ArtifactKindId } from '../../domain/artifactKinds';
import { TypeFilterButtons } from './TypeFilterButtons';

export interface MatrixArtifact {
  id: string;
  title: string;
  type: ArtifactKindId;
}

export interface MatrixLink {
  sourceId: string;
  targetId: string;
  type: string;
}

interface MatrixViewProps {
  allArtifacts: MatrixArtifact[];
  allLinks: MatrixLink[];
  selectedTypes: Set<ArtifactKindId>;
  toggleType: (type: ArtifactKindId) => void;
}

const MAX_MATRIX_SIZE = 20;

const LINK_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  parent: { symbol: '↑', color: 'var(--color-info)' },
  child: { symbol: '↓', color: 'var(--color-info)' },
  depends_on: { symbol: '◆', color: 'var(--color-warning)' },
  dependency_of: { symbol: '◇', color: 'var(--color-warning)' },
  related_to: { symbol: '↔', color: 'var(--color-accent-light)' },
  satisfies: { symbol: '✓', color: 'var(--color-success)' },
  satisfied_by: { symbol: '✓', color: 'var(--color-success)' },
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
  risk: 4,
  document: 5,
};

export const MatrixView: React.FC<MatrixViewProps> = ({
  allArtifacts,
  allLinks,
  selectedTypes,
  toggleType,
}) => {
  const unsortedArtifacts =
    selectedTypes.size === KIND_IDS.length
      ? allArtifacts
      : allArtifacts.filter((a) => selectedTypes.has(a.type));

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
        borderRadius: 'var(--radius-md)',
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
        <TypeFilterButtons selectedTypes={selectedTypes} onToggle={toggleType} />
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
          {allArtifacts.length > MAX_MATRIX_SIZE && selectedTypes.size === KIND_IDS.length && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-sm)',
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
                        backgroundColor: kind(col.type).color.bg,
                        border: '1px solid var(--color-border)',
                        fontWeight: 600,
                        color: kind(col.type).color.text,
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
                        backgroundColor: kind(row.type).color.bg,
                        border: '1px solid var(--color-border)',
                        fontWeight: 600,
                        color: kind(row.type).color.text,
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
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--font-size-xs)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--spacing-sm)',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Legend:</span>
            <span>
              <span style={{ color: 'var(--color-info)' }}>↑↓</span> parent/child
            </span>
            <span>
              <span style={{ color: 'var(--color-success)' }}>✓</span> satisfies
            </span>
            <span>
              <span style={{ color: '#10b981' }}>✔</span> verifies
            </span>
            <span>
              <span style={{ color: 'var(--color-accent-light)' }}>↔</span> related
            </span>
            <span>
              <span style={{ color: 'var(--color-warning)' }}>◆</span> depends
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
