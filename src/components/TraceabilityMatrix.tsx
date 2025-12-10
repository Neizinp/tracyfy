import React, { useState } from 'react';
import type { Requirement, UseCase, TestCase, Information, ArtifactLink } from '../types';

interface TraceabilityMatrixProps {
  requirements: Requirement[];
  useCases: UseCase[];
  testCases: TestCase[];
  information: Information[];
}

type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information';

interface UnifiedArtifact {
  id: string;
  type: ArtifactType;
  linkedArtifacts: ArtifactLink[];
}

const TYPE_COLORS: Record<ArtifactType, string> = {
  requirement: 'rgba(59, 130, 246, 0.15)',
  useCase: 'rgba(139, 92, 246, 0.15)',
  testCase: 'rgba(34, 197, 94, 0.15)',
  information: 'rgba(234, 179, 8, 0.15)',
};

const TYPE_LABELS: Record<ArtifactType, string> = {
  requirement: 'REQ',
  useCase: 'UC',
  testCase: 'TC',
  information: 'INFO',
};

export const TraceabilityMatrix: React.FC<TraceabilityMatrixProps> = ({
  requirements,
  useCases,
  testCases,
  information,
}) => {
  // Filter toggle state
  const [showRequirements, setShowRequirements] = useState(true);
  const [showUseCases, setShowUseCases] = useState(true);
  const [showTestCases, setShowTestCases] = useState(true);
  const [showInformation, setShowInformation] = useState(true);
  const [showUnlinked, setShowUnlinked] = useState(true);

  // Build unified artifact list
  const buildUnifiedArtifacts = (): UnifiedArtifact[] => {
    const artifacts: UnifiedArtifact[] = [];

    if (showRequirements) {
      requirements.forEach((req) => {
        artifacts.push({
          id: req.id,
          type: 'requirement',
          linkedArtifacts: req.linkedArtifacts || [],
        });
      });
    }

    if (showUseCases) {
      useCases.forEach((uc) => {
        artifacts.push({
          id: uc.id,
          type: 'useCase',
          linkedArtifacts: uc.linkedArtifacts || [],
        });
      });
    }

    if (showTestCases) {
      testCases.forEach((tc) => {
        artifacts.push({
          id: tc.id,
          type: 'testCase',
          linkedArtifacts: tc.linkedArtifacts || [],
        });
      });
    }

    if (showInformation) {
      information.forEach((info) => {
        artifacts.push({
          id: info.id,
          type: 'information',
          linkedArtifacts: info.linkedArtifacts || [],
        });
      });
    }

    return artifacts;
  };

  // Build all artifacts first (before filtering by links)
  const allArtifactsUnfiltered = buildUnifiedArtifacts();

  // Build a flat list of all links (needed for filtering)
  const allLinksForFiltering: { sourceId: string; targetId: string }[] = [];
  allArtifactsUnfiltered.forEach((artifact) => {
    artifact.linkedArtifacts.forEach((link) => {
      allLinksForFiltering.push({
        sourceId: artifact.id,
        targetId: link.targetId,
      });
    });
  });

  // Helper to check if an artifact has any links (outgoing or incoming)
  const hasAnyLinks = (artifactId: string): boolean => {
    return allLinksForFiltering.some((l) => l.sourceId === artifactId || l.targetId === artifactId);
  };

  // Filter out unlinked artifacts if toggle is off
  const unifiedArtifacts = showUnlinked
    ? allArtifactsUnfiltered
    : allArtifactsUnfiltered.filter((a) => hasAnyLinks(a.id));

  // Build a flat list of all links
  const allLinks: { sourceId: string; targetId: string; type: ArtifactLink['type'] }[] = [];
  unifiedArtifacts.forEach((artifact) => {
    artifact.linkedArtifacts.forEach((link) => {
      allLinks.push({
        sourceId: artifact.id,
        targetId: link.targetId,
        type: link.type,
      });
    });
  });

  // Helper to find link between two artifacts
  const getLink = (
    fromId: string,
    toId: string
  ): { sourceId: string; targetId: string; type: ArtifactLink['type'] } | undefined => {
    return allLinks.find(
      (l) =>
        (l.sourceId === fromId && l.targetId === toId) ||
        (l.sourceId === toId && l.targetId === fromId)
    );
  };

  // Link symbols and colors
  const linkSymbols: Record<string, string> = {
    parent: '↑',
    child: '↓',
    derived_from: '⊳',
    depends_on: '→',
    conflicts_with: '⚠',
    duplicates: '≈',
    refines: '⊕',
    satisfies: '✓',
    verifies: '✔',
    constrains: '⊂',
    requires: '⟶',
    related_to: '↔',
  };

  const linkColors: Record<string, string> = {
    parent: 'rgba(59, 130, 246, 0.3)',
    child: 'rgba(59, 130, 246, 0.3)',
    derived_from: 'rgba(99, 102, 241, 0.3)',
    depends_on: 'rgba(251, 146, 60, 0.3)',
    conflicts_with: 'rgba(239, 68, 68, 0.3)',
    duplicates: 'rgba(234, 179, 8, 0.3)',
    refines: 'rgba(34, 197, 94, 0.3)',
    satisfies: 'rgba(16, 185, 129, 0.3)',
    verifies: 'rgba(6, 182, 212, 0.3)',
    constrains: 'rgba(244, 63, 94, 0.3)',
    requires: 'rgba(249, 115, 22, 0.3)',
    related_to: 'rgba(168, 85, 247, 0.3)',
  };

  // Helper to get cell content
  const getCellContent = (
    rowArtifact: UnifiedArtifact,
    colArtifact: UnifiedArtifact
  ): { text: string; color: string; tooltip: string } | null => {
    if (rowArtifact.id === colArtifact.id) {
      return null; // Same artifact
    }

    const link = getLink(rowArtifact.id, colArtifact.id);

    if (link) {
      return {
        text: linkSymbols[link.type] || '•',
        color: linkColors[link.type] || 'rgba(100, 100, 100, 0.2)',
        tooltip: `${link.type.replace(/_/g, ' ')}: ${link.sourceId} → ${link.targetId}`,
      };
    }

    return null;
  };

  const FilterButton: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    color: string;
  }> = ({ label, active, onClick, color }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: '4px',
        border: active
          ? `2px solid ${color.replace('0.15', '0.8')}`
          : '2px solid var(--color-border)',
        backgroundColor: active ? color : 'transparent',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        cursor: 'pointer',
        fontSize: 'var(--font-size-sm)',
        fontWeight: active ? 600 : 400,
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );

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
        <h3
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          Traceability Matrix
        </h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Shows relationships between all artifacts. Click the toggles to filter by artifact type.
        </p>
      </div>

      {/* Filter Toggles */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            alignSelf: 'center',
          }}
        >
          Show:
        </span>
        <FilterButton
          label={`Requirements (${requirements.length})`}
          active={showRequirements}
          onClick={() => setShowRequirements(!showRequirements)}
          color={TYPE_COLORS.requirement}
        />
        <FilterButton
          label={`Use Cases (${useCases.length})`}
          active={showUseCases}
          onClick={() => setShowUseCases(!showUseCases)}
          color={TYPE_COLORS.useCase}
        />
        <FilterButton
          label={`Test Cases (${testCases.length})`}
          active={showTestCases}
          onClick={() => setShowTestCases(!showTestCases)}
          color={TYPE_COLORS.testCase}
        />
        <FilterButton
          label={`Information (${information.length})`}
          active={showInformation}
          onClick={() => setShowInformation(!showInformation)}
          color={TYPE_COLORS.information}
        />
        <span
          style={{
            borderLeft: '1px solid var(--color-border)',
            height: '24px',
            alignSelf: 'center',
            margin: '0 4px',
          }}
        />
        <FilterButton
          label="Show Unlinked"
          active={showUnlinked}
          onClick={() => setShowUnlinked(!showUnlinked)}
          color="rgba(100, 100, 100, 0.15)"
        />
      </div>

      {unifiedArtifacts.length === 0 ? (
        <div
          style={{
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          No artifacts to display. Enable at least one artifact type above.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--font-size-sm)',
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
                {unifiedArtifacts.map((artifact) => (
                  <th
                    key={artifact.id}
                    style={{
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      fontWeight: 600,
                      textAlign: 'center',
                      minWidth: '80px',
                      backgroundColor: TYPE_COLORS[artifact.type],
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        marginRight: '4px',
                      }}
                    >
                      {TYPE_LABELS[artifact.type]}
                    </span>
                    {artifact.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unifiedArtifacts.map((rowArtifact, rowIndex) => (
                <tr
                  key={rowArtifact.id}
                  style={{
                    backgroundColor:
                      rowIndex % 2 === 0 ? 'var(--color-bg-card)' : 'var(--color-bg-hover)',
                  }}
                >
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      backgroundColor: TYPE_COLORS[rowArtifact.type],
                      padding: '8px',
                      border: '1px solid var(--color-border)',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      zIndex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        marginRight: '8px',
                      }}
                    >
                      {TYPE_LABELS[rowArtifact.type]}
                    </span>
                    {rowArtifact.id}
                  </td>
                  {unifiedArtifacts.map((colArtifact) => {
                    const cellContent = getCellContent(rowArtifact, colArtifact);
                    const isSame = rowArtifact.id === colArtifact.id;
                    return (
                      <td
                        key={colArtifact.id}
                        style={{
                          padding: '8px',
                          border: '1px solid var(--color-border)',
                          textAlign: 'center',
                          backgroundColor: isSame
                            ? 'var(--color-bg-sidebar)'
                            : cellContent
                              ? cellContent.color
                              : 'var(--color-bg-card)',
                          fontWeight: cellContent ? 600 : 400,
                          cursor: cellContent ? 'help' : 'default',
                        }}
                        title={cellContent?.tooltip || ''}
                      >
                        {isSame ? '●' : cellContent ? cellContent.text : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-bg-sidebar)',
          borderRadius: '6px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <strong>Legend:</strong>
        <div
          style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: '4px', flexWrap: 'wrap' }}
        >
          {Object.entries(linkSymbols).map(([type, symbol]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  padding: '2px 6px',
                  backgroundColor: linkColors[type],
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                {symbol}
              </span>
              {type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
