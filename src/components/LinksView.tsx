import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, ArrowRight, Plus } from 'lucide-react';
import { linkTypeLabel } from '../domain/linkTypes';
import { kind, kindOfId } from '../domain/artifactKinds';
import type { Link } from '../types';
import type { LinkType } from '../domain/linkTypes';
import { EditLinkModal } from './EditLinkModal';
import { BaseArtifactTable, type ColumnDef } from './BaseArtifactTable';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';
import { useAppStore } from '../state';

interface LinksViewProps {
  onNavigateToArtifact?: (id: string) => void;
  onAdd?: () => void;
}

export const LinksView: React.FC<LinksViewProps> = ({ onNavigateToArtifact, onAdd }) => {
  // Links come from the store, so every view shows the same ones as soon as they change
  const links = useAppStore((s) => s.links);
  const loading = useAppStore((s) => !s.isReady);
  const deleteLink = useAppStore((s) => s.deleteLink);
  const updateLink = useAppStore((s) => s.updateLink);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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
  const handleSaveLink = async (linkId: string, updates: { type: LinkType }) => {
    try {
      await updateLink(linkId, updates);
    } catch (error) {
      console.error('Failed to update link:', error);
      throw error;
    }
  };

  // Helpers

  const getTypeColor = (id: string): string => {
    const type = kindOfId(id);
    return type ? kind(type).color.text : 'var(--color-text-muted)';
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
      return typeFilter === 'all' || link.type === typeFilter;
    },
    getValueFn: (link: Link, key: string) => {
      switch (key) {
        case 'id':
          return parseInt(link.id.replace(/\D/g, ''), 10) || 0;
        case 'type':
          return linkTypeLabel(link.type).toLowerCase();
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
            onNavigateToArtifact?.(link.sourceId);
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
            borderRadius: 'var(--radius-xs)',
            backgroundColor: 'var(--color-bg-secondary)',
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'monospace',
          }}
        >
          {linkTypeLabel(link.type)}
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
            onNavigateToArtifact?.(link.targetId);
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
                color: 'var(--color-on-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
              }}
            >
              <Plus size={16} />
              Add
            </button>
          )}
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
            borderRadius: 'var(--radius-sm)',
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
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-app)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {linkTypeLabel(type)}
            </option>
          ))}
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
