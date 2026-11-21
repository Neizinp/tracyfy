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
      render: (link) => <span className="tf-linksview-id">{link.id}</span>,
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
          className="tf-linksview-end"
          data-clickable={onNavigateToArtifact ? true : undefined}
          // The kind's own color
          style={{ color: getTypeColor(link.sourceId) }}
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
        <span className="tf-linksview-type">
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
          className="tf-linksview-end"
          data-clickable={onNavigateToArtifact ? true : undefined}
          // The kind's own color
          style={{ color: getTypeColor(link.targetId) }}
        >
          {link.targetId}
        </span>
      ),
    },
  ];

  return (
    <div className="tf-linksview">
      <div className="tf-linksview-header">
        <h2>
          <LinkIcon size={24} className="tf-accent-icon" />
          Links ({processedLinks.length})
        </h2>
        {onAdd && (
          <button onClick={onAdd} className="tf-linksview-add">
            <Plus size={16} />
            Add
          </button>
        )}
      </div>

      <div className="tf-linksview-filters">
        <input
          type="text"
          placeholder="Search links..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="tf-linksview-search"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="tf-linksview-select"
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
      <div className="tf-linksview-content">
        {loading && links.length === 0 ? (
          <div className="tf-linksview-loading">Loading links...</div>
        ) : (
          <BaseArtifactTable
            data={processedLinks}
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
