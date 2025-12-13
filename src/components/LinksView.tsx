/**
 * LinksView Component
 *
 * Displays all Link entities in a table format with filtering and navigation.
 */

import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Trash2, ArrowRight, RefreshCw } from 'lucide-react';
import { diskLinkService } from '../services/diskLinkService';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import type { Link } from '../types';

interface LinksViewProps {
  onNavigateToArtifact?: (id: string, type: string) => void;
}

export const LinksView: React.FC<LinksViewProps> = ({ onNavigateToArtifact }) => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Load all links
  const loadLinks = async () => {
    setLoading(true);
    try {
      const allLinks = await diskLinkService.getAllLinks();
      setLinks(allLinks);
    } catch (error) {
      console.error('Failed to load links:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  // Delete a link
  const handleDeleteLink = async (linkId: string) => {
    if (!confirm(`Delete link ${linkId}?`)) return;

    try {
      await diskLinkService.deleteLink(linkId);
      await loadLinks();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  // Get artifact type from ID prefix
  const getArtifactType = (id: string): string => {
    if (id.startsWith('REQ-')) return 'requirement';
    if (id.startsWith('UC-')) return 'usecase';
    if (id.startsWith('TC-')) return 'testcase';
    if (id.startsWith('INFO-')) return 'information';
    return 'unknown';
  };

  // Get color for artifact type
  const getTypeColor = (id: string): string => {
    if (id.startsWith('REQ-')) return 'var(--color-info)';
    if (id.startsWith('UC-')) return 'var(--color-accent)';
    if (id.startsWith('TC-')) return 'var(--color-success)';
    if (id.startsWith('INFO-')) return 'var(--color-warning)';
    return 'var(--color-text-muted)';
  };

  // Get unique link types for filter
  const uniqueTypes = Array.from(new Set(links.map((l) => l.type)));

  // Filter links
  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      filter === '' ||
      link.id.toLowerCase().includes(filter.toLowerCase()) ||
      link.sourceId.toLowerCase().includes(filter.toLowerCase()) ||
      link.targetId.toLowerCase().includes(filter.toLowerCase()) ||
      link.type.toLowerCase().includes(filter.toLowerCase());

    const matchesType = typeFilter === 'all' || link.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ padding: 'var(--spacing-lg)', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontWeight: 600,
            fontSize: 'var(--font-size-xl)',
          }}
        >
          <LinkIcon size={24} style={{ color: 'var(--color-accent)' }} />
          Links ({filteredLinks.length})
        </h2>
        <button
          onClick={loadLinks}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search links..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {LINK_TYPE_LABELS[type] || type}
            </option>
          ))}
        </select>
      </div>

      {/* Links Table */}
      {loading ? (
        <div
          style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          Loading links...
        </div>
      ) : filteredLinks.length === 0 ? (
        <div
          style={{
            padding: 'var(--spacing-xl)',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}
        >
          <LinkIcon size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0 }}>No links found.</p>
          <p style={{ margin: '8px 0 0 0', fontSize: 'var(--font-size-sm)' }}>
            Create links from artifact Relationships tabs.
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  ID
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Source
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Type
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Target
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-sm)',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((link) => (
                <tr
                  key={link.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td
                    style={{
                      padding: '12px',
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {link.id}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      onClick={() =>
                        onNavigateToArtifact?.(link.sourceId, getArtifactType(link.sourceId))
                      }
                      style={{
                        color: getTypeColor(link.sourceId),
                        fontWeight: 500,
                        cursor: onNavigateToArtifact ? 'pointer' : 'default',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {link.sourceId}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {LINK_TYPE_LABELS[link.type] || link.type}
                      <ArrowRight size={12} />
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span
                      onClick={() =>
                        onNavigateToArtifact?.(link.targetId, getArtifactType(link.targetId))
                      }
                      style={{
                        color: getTypeColor(link.targetId),
                        fontWeight: 500,
                        cursor: onNavigateToArtifact ? 'pointer' : 'default',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {link.targetId}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--color-text-muted)')
                      }
                      title="Delete link"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
