import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, ArrowRight, RefreshCw, Globe, Folder, Plus } from 'lucide-react';
import { useLinkService } from '../hooks/useLinkService';
import { LINK_TYPE_LABELS } from '../utils/linkTypes';
import type { Link, Project } from '../types';
import type { LinkType } from '../utils/linkTypes';
import { EditLinkModal } from './EditLinkModal';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

interface LinksViewProps {
  onNavigateToArtifact?: (id: string, type: string) => void;
  projects?: Project[];
  onAdd?: () => void;
}

export const LinksView: React.FC<LinksViewProps> = ({
  onNavigateToArtifact,
  projects = [],
  onAdd,
}) => {
  const { allLinks: links, loading, refresh: loadLinks, deleteLink } = useLinkService();
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'project'>('all');

  // Edit modal state
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete a link (called from modal)
  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteLink(linkId);
    } catch (error) {
      console.error('Failed to delete link:', error);
      throw error;
    }
  };

  // Edit a link
  const handleEditLink = (link: Link) => {
    setEditingLink(link);
    setIsEditModalOpen(true);
  };

  // Save link edits
  const handleSaveLink = async (
    linkId: string,
    updates: { type: LinkType; projectIds: string[] }
  ) => {
    try {
      const { diskLinkService } = await import('../services/diskLinkService');
      await diskLinkService.updateLink(linkId, updates);
      await loadLinks();
    } catch (error) {
      console.error('Failed to update link:', error);
      throw error;
    }
  };

  // Helpers
  const getArtifactType = (id: string): string => {
    if (id.startsWith('REQ-')) return 'requirement';
    if (id.startsWith('UC-')) return 'usecase';
    if (id.startsWith('TC-')) return 'testcase';
    if (id.startsWith('INFO-')) return 'information';
    if (id.startsWith('RISK-')) return 'risk';
    return 'unknown';
  };

  const getTypeColor = (id: string): string => {
    if (id.startsWith('REQ-')) return 'var(--color-info)';
    if (id.startsWith('UC-')) return 'var(--color-accent)';
    if (id.startsWith('TC-')) return 'var(--color-success)';
    if (id.startsWith('INFO-')) return 'var(--color-warning)';
    if (id.startsWith('RISK-')) return 'var(--color-status-error)';
    return 'var(--color-text-muted)';
  };

  const getProjectNames = (projectIds: string[]): string => {
    if (projectIds.length === 0) return 'Global';
    return projectIds
      .map((id) => {
        const project = projects.find((p) => p.id === id);
        return project?.name || id;
      })
      .join(', ');
  };

  // Unique link types for filter
  const uniqueTypes = useMemo(() => Array.from(new Set(links.map((l) => l.type))), [links]);

  // Sorting and Filtering logic
  const {
    sortedData: processedLinks,
    sortConfig,
    handleSortChange,
  } = useArtifactFilteredData(links, {
    searchQuery: filter,
    searchFields: ['id', 'sourceId', 'targetId', 'type'],
    filterFn: (link: Link) => {
      const matchesType = typeFilter === 'all' || link.type === typeFilter;
      const matchesScope =
        scopeFilter === 'all' ||
        (scopeFilter === 'global' && link.projectIds.length === 0) ||
        (scopeFilter === 'project' && link.projectIds.length > 0);
      return matchesType && matchesScope;
    },
    getValueFn: (link: Link, key: string) => {
      switch (key) {
        case 'id':
          return parseInt(link.id.replace(/\D/g, ''), 10) || 0;
        case 'type':
          return (LINK_TYPE_LABELS[link.type as LinkType] || link.type).toLowerCase();
        case 'projectIds':
          return link.projectIds.length === 0 ? 0 : 1;
        default:
          return (link as unknown as Record<string, string | number | undefined>)[key];
      }
    },
  });

  const columns: ColumnDef<Link>[] = [
    {
      key: 'id',
      label: 'ID',
      width: '100px',
      sortable: true,
      render: (link) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{link.id}</span>,
    },
    {
      key: 'sourceId',
      label: 'Source',
      width: '150px',
      sortable: true,
      render: (link) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToArtifact?.(link.sourceId, getArtifactType(link.sourceId));
          }}
          style={{
            color: getTypeColor(link.sourceId),
            fontWeight: 500,
            cursor: onNavigateToArtifact ? 'pointer' : 'default',
          }}
        >
          {link.sourceId}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '160px',
      sortable: true,
      align: 'center',
      render: (link) => (
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
      ),
    },
    {
      key: 'targetId',
      label: 'Target',
      width: '150px',
      sortable: true,
      render: (link) => (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToArtifact?.(link.targetId, getArtifactType(link.targetId));
          }}
          style={{
            color: getTypeColor(link.targetId),
            fontWeight: 500,
            cursor: onNavigateToArtifact ? 'pointer' : 'default',
          }}
        >
          {link.targetId}
        </span>
      ),
    },
    {
      key: 'projectIds',
      label: 'Scope',
      sortable: true,
      render: (link) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: 'var(--font-size-xs)',
            backgroundColor:
              link.projectIds.length === 0
                ? 'rgba(59, 130, 246, 0.2)'
                : 'var(--color-bg-secondary)',
            color:
              link.projectIds.length === 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          {link.projectIds.length === 0 ? <Globe size={10} /> : <Folder size={10} />}
          {getProjectNames(link.projectIds)}
        </span>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontWeight: 600,
            fontSize: 'var(--font-size-xl)',
            margin: 0,
          }}
        >
          <LinkIcon size={24} style={{ color: 'var(--color-accent)' }} />
          Links ({processedLinks.length})
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onAdd && (
            <button
              onClick={onAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              Add
            </button>
          )}
          <button
            onClick={loadLinks}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
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
              {LINK_TYPE_LABELS[type as LinkType] || type}
            </option>
          ))}
        </select>
        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as 'all' | 'global' | 'project')}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <option value="all">All Scopes</option>
          <option value="global">Global Only</option>
          <option value="project">Project-Specific</option>
        </select>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: '400px', overflow: 'hidden' }}>
        {loading && links.length === 0 ? (
          <div
            style={{
              padding: 'var(--spacing-xl)',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            Loading links...
          </div>
        ) : (
          <BaseArtifactTable
            data={links}
            columns={columns}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
            onRowClick={handleEditLink}
            emptyMessage="No links found. Create links from artifact Relationships tabs."
          />
        )}
      </div>

      {/* Modals */}
      <EditLinkModal
        isOpen={isEditModalOpen}
        link={editingLink}
        projects={projects}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        onDelete={handleDeleteLink}
      />
    </div>
  );
};
