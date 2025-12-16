/**
 * Advanced Search Modal
 *
 * Full-featured search and filter modal with saved searches.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Save, Trash2, Filter, Calendar, Tag } from 'lucide-react';
import { useFileSystem } from '../app/providers';
import { diskFilterService } from '../services/diskFilterService';
import type { FilterState, SavedFilter } from '../types/filters';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArtifact: (type: string, id: string) => void;
}

type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information' | 'risk';

interface SearchResult {
  id: string;
  title: string;
  type: ArtifactType;
  status: string;
  priority: string;
  description: string;
}

const STATUS_OPTIONS = [
  'draft',
  'active',
  'approved',
  'deprecated',
  'passed',
  'failed',
  'blocked',
  'pending',
];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const TYPE_OPTIONS: { value: ArtifactType; label: string }[] = [
  { value: 'requirement', label: 'Requirements' },
  { value: 'useCase', label: 'Use Cases' },
  { value: 'testCase', label: 'Test Cases' },
  { value: 'information', label: 'Information' },
  { value: 'risk', label: 'Risks' },
];

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToArtifact,
}) => {
  const { requirements, useCases, testCases, information, risks } = useFileSystem();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ArtifactType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Load saved filters
  useEffect(() => {
    if (isOpen) {
      diskFilterService.getAllFilters().then(setSavedFilters);
    }
  }, [isOpen]);

  // Build current filter state
  const currentFilters: FilterState = useMemo(
    () => ({
      searchQuery: searchQuery || undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      priority: selectedPriorities.length > 0 ? selectedPriorities : undefined,
      dateCreatedFrom: dateFrom ? new Date(dateFrom).getTime() : undefined,
      dateCreatedTo: dateTo ? new Date(dateTo).getTime() : undefined,
    }),
    [searchQuery, selectedStatuses, selectedPriorities, dateFrom, dateTo]
  );

  // Apply filters and get results
  const results: SearchResult[] = useMemo(() => {
    const allArtifacts: SearchResult[] = [];

    // Helper to check if artifact matches filters
    const matchesFilters = (
      artifact: {
        id: string;
        title: string;
        status: string;
        priority: string;
        description?: string;
        dateCreated?: number;
      },
      type: ArtifactType
    ): boolean => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(type)) return false;

      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(artifact.status)) return false;

      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(artifact.priority))
        return false;

      // Date filter
      if (dateFrom && artifact.dateCreated && artifact.dateCreated < new Date(dateFrom).getTime())
        return false;
      if (dateTo && artifact.dateCreated && artifact.dateCreated > new Date(dateTo).getTime())
        return false;

      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText =
          artifact.id.toLowerCase().includes(query) ||
          artifact.title.toLowerCase().includes(query) ||
          (artifact.description || '').toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      return true;
    };

    // Add requirements
    requirements
      .filter((r) => !r.isDeleted)
      .forEach((r) => {
        if (matchesFilters(r, 'requirement')) {
          allArtifacts.push({
            id: r.id,
            title: r.title,
            type: 'requirement',
            status: r.status,
            priority: r.priority,
            description: r.description,
          });
        }
      });

    // Add use cases
    useCases
      .filter((u) => !u.isDeleted)
      .forEach((u) => {
        if (matchesFilters(u, 'useCase')) {
          allArtifacts.push({
            id: u.id,
            title: u.title,
            type: 'useCase',
            status: u.status,
            priority: u.priority,
            description: u.description,
          });
        }
      });

    // Add test cases
    testCases
      .filter((t) => !t.isDeleted)
      .forEach((t) => {
        if (matchesFilters(t, 'testCase')) {
          allArtifacts.push({
            id: t.id,
            title: t.title,
            type: 'testCase',
            status: t.status,
            priority: t.priority,
            description: t.description,
          });
        }
      });

    // Add information
    information
      .filter((i) => !i.isDeleted)
      .forEach((i) => {
        if (matchesFilters({ ...i, status: 'active', priority: 'medium' }, 'information')) {
          allArtifacts.push({
            id: i.id,
            title: i.title,
            type: 'information',
            status: 'active',
            priority: 'medium',
            description: i.content,
          });
        }
      });

    // Add risks
    risks
      .filter((r) => !r.isDeleted)
      .forEach((r) => {
        if (matchesFilters({ ...r, priority: r.impact }, 'risk')) {
          allArtifacts.push({
            id: r.id,
            title: r.title,
            type: 'risk',
            status: r.status,
            priority: r.impact,
            description: r.description,
          });
        }
      });

    return allArtifacts;
  }, [
    requirements,
    useCases,
    testCases,
    information,
    risks,
    searchQuery,
    selectedTypes,
    selectedStatuses,
    selectedPriorities,
    dateFrom,
    dateTo,
  ]);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setDateFrom('');
    setDateTo('');
  }, []);

  // Save current filter
  const handleSaveFilter = useCallback(async () => {
    if (!saveFilterName.trim()) return;
    await diskFilterService.createFilter(saveFilterName.trim(), currentFilters);
    const filters = await diskFilterService.getAllFilters();
    setSavedFilters(filters);
    setSaveFilterName('');
    setShowSaveDialog(false);
  }, [saveFilterName, currentFilters]);

  // Load a saved filter
  const handleLoadFilter = useCallback((filter: SavedFilter) => {
    setSearchQuery(filter.filters.searchQuery || '');
    setSelectedStatuses(filter.filters.status || []);
    setSelectedPriorities(filter.filters.priority || []);
    if (filter.filters.dateCreatedFrom) {
      setDateFrom(new Date(filter.filters.dateCreatedFrom).toISOString().split('T')[0]);
    } else {
      setDateFrom('');
    }
    if (filter.filters.dateCreatedTo) {
      setDateTo(new Date(filter.filters.dateCreatedTo).toISOString().split('T')[0]);
    } else {
      setDateTo('');
    }
  }, []);

  // Delete a saved filter
  const handleDeleteFilter = useCallback(async (id: string) => {
    await diskFilterService.deleteFilter(id);
    const filters = await diskFilterService.getAllFilters();
    setSavedFilters(filters);
  }, []);

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onNavigateToArtifact(result.type, result.id);
      onClose();
    },
    [onNavigateToArtifact, onClose]
  );

  // Toggle multi-select
  const toggleArrayValue = <T,>(arr: T[], value: T, setter: (v: T[]) => void) => {
    if (arr.includes(value)) {
      setter(arr.filter((v) => v !== value));
    } else {
      setter([...arr, value]);
    }
  };

  if (!isOpen) return null;

  const getTypeColor = (type: ArtifactType) => {
    switch (type) {
      case 'requirement':
        return 'var(--color-info)';
      case 'useCase':
        return 'var(--color-success)';
      case 'testCase':
        return 'var(--color-warning)';
      case 'information':
        return 'var(--color-accent)';
      case 'risk':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-muted)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '900px',
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
          }}
        >
          <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all artifacts..."
            autoFocus
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: 'var(--font-size-lg)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Type filter */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleArrayValue(selectedTypes, opt.value, setSelectedTypes)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: 'var(--font-size-xs)',
                  cursor: 'pointer',
                  backgroundColor: selectedTypes.includes(opt.value)
                    ? getTypeColor(opt.value)
                    : 'var(--color-bg-secondary)',
                  color: selectedTypes.includes(opt.value)
                    ? 'white'
                    : 'var(--color-text-secondary)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            multiple
            value={selectedStatuses}
            onChange={(e) =>
              setSelectedStatuses(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              minWidth: '100px',
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            multiple
            value={selectedPriorities}
            onChange={(e) =>
              setSelectedPriorities(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-app)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              minWidth: '100px',
            }}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            />
            <span style={{ color: 'var(--color-text-muted)' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            />
          </div>

          {/* Clear / Save */}
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Save size={14} />
              Save
            </button>
          </div>
        </div>

        {/* Content: Results + Saved Filters */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Results */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md)' }}>
            <div
              style={{
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {results.length} results
            </div>
            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: '6px',
                  marginBottom: 'var(--spacing-xs)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-secondary)',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: getTypeColor(result.type),
                      color: 'white',
                    }}
                  >
                    {result.id}
                  </span>
                  <span style={{ fontWeight: 500 }}>{result.title}</span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    marginTop: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.description}
                </div>
              </div>
            ))}
          </div>

          {/* Saved Filters Sidebar */}
          <div
            style={{
              width: '200px',
              borderLeft: '1px solid var(--color-border)',
              padding: 'var(--spacing-md)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              Saved Searches
            </div>
            {savedFilters.length === 0 && (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                No saved searches yet.
              </div>
            )}
            {savedFilters.map((filter) => (
              <div
                key={filter.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)',
                  padding: 'var(--spacing-xs)',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
                onClick={() => handleLoadFilter(filter)}
              >
                <Filter size={12} style={{ color: 'var(--color-text-muted)' }} />
                <span
                  style={{
                    flex: 1,
                    fontSize: 'var(--font-size-sm)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filter.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFilter(filter.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '2px',
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Filter Dialog */}
        {showSaveDialog && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowSaveDialog(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg-card)',
                padding: 'var(--spacing-lg)',
                borderRadius: '8px',
                minWidth: '300px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Save Search</div>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Search name..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-md)',
                }}
              />
              <div
                style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}
              >
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
