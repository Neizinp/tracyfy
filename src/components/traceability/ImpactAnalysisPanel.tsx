/**
 * Impact Analysis Panel Component
 *
 * Enhanced impact tab with direction toggle, depth control, and multi-level display.
 */

import React, { useState, useMemo } from 'react';
import { GitBranch, ArrowUp, ArrowDown, ArrowUpDown, Layers } from 'lucide-react';
import {
  impactAnalysisService,
  type ImpactDirection,
  type ImpactChain,
  type ImpactNode,
} from '../../services/impactAnalysisService';
import type { Link } from '../../types';
import type { UnifiedArtifact } from '../traceability';

interface ImpactAnalysisPanelProps {
  artifacts: UnifiedArtifact[];
  links: Link[];
  onSelectArtifact?: (id: string) => void;
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  requirement: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: '#3b82f6' },
  useCase: { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e', border: '#22c55e' },
  testCase: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
  information: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: '#8b5cf6' },
};

export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  artifacts,
  links,
  onSelectArtifact,
}) => {
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [direction, setDirection] = useState<ImpactDirection>('both');
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter artifacts for dropdown
  const filteredArtifacts = useMemo(() => {
    if (!searchQuery) return artifacts;
    const q = searchQuery.toLowerCase();
    return artifacts.filter(
      (a) => a.id.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
    );
  }, [artifacts, searchQuery]);

  // Compute impact chain
  const impactChain = useMemo<ImpactChain | null>(() => {
    if (!selectedArtifactId) return null;
    return impactAnalysisService.getImpactChain(selectedArtifactId, links, direction, maxDepth);
  }, [selectedArtifactId, links, direction, maxDepth]);

  const impactSummary = useMemo(() => {
    if (!impactChain) return null;
    return impactAnalysisService.getImpactSummary(impactChain);
  }, [impactChain]);

  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId);
  const selectedColors = selectedArtifact ? TYPE_COLORS[selectedArtifact.type] : null;

  // Build tree structure for display
  const renderImpactTree = (chain: ImpactChain) => {
    const levels = Array.from(chain.byLevel.keys()).sort((a, b) => a - b);

    return (
      <div style={{ fontFamily: 'monospace', fontSize: 'var(--font-size-sm)' }}>
        {levels.map((level) => (
          <div key={level} style={{ marginBottom: 'var(--spacing-sm)' }}>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Level {level} ({chain.byLevel.get(level)?.length || 0} artifacts)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {chain.byLevel.get(level)?.map((node: ImpactNode) => {
                const artifact = artifacts.find((a) => a.id === node.artifactId);
                if (!artifact) return null;
                const colors = TYPE_COLORS[artifact.type];

                return (
                  <div
                    key={node.artifactId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      marginLeft: `${level * 16}px`,
                      backgroundColor: colors.bg,
                      borderLeft: `3px solid ${colors.border}`,
                      borderRadius: '0 6px 6px 0',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelectedArtifactId(node.artifactId);
                      onSelectArtifact?.(node.artifactId);
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      {node.direction === 'upstream' ? '↑' : '↓'}
                    </span>
                    <span
                      style={{
                        padding: '2px 6px',
                        backgroundColor: 'var(--color-bg-tertiary)',
                        borderRadius: '4px',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {node.linkType.replace(/_/g, ' ')}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: colors.text,
                      }}
                    >
                      {node.artifactId}
                    </span>
                    <span
                      style={{
                        color: 'var(--color-text-secondary)',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {artifact.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
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
      <h3
        style={{
          margin: '0 0 var(--spacing-md) 0',
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <GitBranch size={20} />
        Impact Analysis
      </h3>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)',
          flexWrap: 'wrap',
        }}
      >
        {/* Artifact Selector */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Select Artifact
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: '4px',
              }}
            />
            <select
              value={selectedArtifactId || ''}
              onChange={(e) => setSelectedArtifactId(e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="">-- Select Artifact --</option>
              {filteredArtifacts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Direction Toggle */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Direction
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(
              [
                { value: 'upstream', icon: ArrowUp, label: 'Upstream' },
                { value: 'downstream', icon: ArrowDown, label: 'Downstream' },
                { value: 'both', icon: ArrowUpDown, label: 'Both' },
              ] as const
            ).map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setDirection(value)}
                title={label}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border:
                    direction === value
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                  backgroundColor:
                    direction === value ? 'rgba(var(--color-accent-rgb), 0.1)' : 'transparent',
                  color:
                    direction === value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Depth Control */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
            }}
          >
            <Layers size={12} style={{ marginRight: '4px' }} />
            Depth: {maxDepth === 0 ? 'All' : maxDepth}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
            style={{ width: '100px' }}
          />
        </div>
      </div>

      {/* Selected Artifact Header */}
      {selectedArtifact && selectedColors && (
        <div
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: selectedColors.bg,
            border: `2px solid ${selectedColors.border}`,
            borderRadius: '6px',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          <span style={{ fontWeight: 700, color: selectedColors.text }}>{selectedArtifact.id}</span>
          <span style={{ marginLeft: '8px', color: 'var(--color-text-secondary)' }}>
            {selectedArtifact.title}
          </span>
        </div>
      )}

      {/* Impact Summary */}
      {impactSummary && impactSummary.total > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'var(--color-bg-tertiary)',
            borderRadius: '6px',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Total: </span>
            <strong>{impactSummary.total}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>↑ Upstream: </span>
            <strong>{impactSummary.upstream}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>↓ Downstream: </span>
            <strong>{impactSummary.downstream}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Max Depth: </span>
            <strong>{impactSummary.maxDepth}</strong>
          </div>
        </div>
      )}

      {/* Impact Tree */}
      {impactChain && impactChain.nodes.length > 0 ? (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>{renderImpactTree(impactChain)}</div>
      ) : selectedArtifactId ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-muted)',
          }}
        >
          No impact chain found for this artifact.
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            color: 'var(--color-text-muted)',
          }}
        >
          <GitBranch size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>Select an artifact above to analyze its impact chain.</p>
        </div>
      )}
    </div>
  );
};
