/**
 * Advanced Search Modal
 *
 * Full-featured search and filter modal with saved searches.
 * Polished UI with modern styling.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Search, Save, Trash2, Filter, ChevronDown, ChevronUp } from 'lucide-react';
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
  dateCreated?: number;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: '#9ca3af' },
  { value: 'active', label: 'Active', color: '#3b82f6' },
  { value: 'approved', label: 'Approved', color: '#22c55e' },
  { value: 'deprecated', label: 'Deprecated', color: '#ef4444' },
  { value: 'passed', label: 'Passed', color: '#22c55e' },
  { value: 'failed', label: 'Failed', color: '#ef4444' },
  { value: 'blocked', label: 'Blocked', color: '#f59e0b' },
  { value: 'pending', label: 'Pending', color: '#8b5cf6' },
];

const PRIORITY_OPTIONS = [
  { value: 'critical', label: 'Critical', color: '#dc2626' },
  { value: 'high', label: 'High', color: '#ea580c' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'low', label: 'Low', color: '#22c55e' },
];

const TYPE_CONFIG: Record<ArtifactType, { label: string; color: string; bgColor: string }> = {
  requirement: { label: 'REQ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  useCase: { label: 'UC', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  testCase: { label: 'TC', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  information: { label: 'INF', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  risk: { label: 'RSK', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

const chipStyle = (selected: boolean, color: string): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: '16px',
  border: `1.5px solid ${selected ? color : 'var(--color-border)'}`,
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  backgroundColor: selected ? `${color}20` : 'transparent',
  color: selected ? color : 'var(--color-text-secondary)',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap' as const,
});

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
  const [showFilters, setShowFilters] = useState(true);

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

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedPriorities.length > 0) count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [selectedTypes, selectedStatuses, selectedPriorities, dateFrom, dateTo]);

  // Apply filters and get results
  const results: SearchResult[] = useMemo(() => {
    const allArtifacts: SearchResult[] = [];

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
      if (selectedTypes.length > 0 && !selectedTypes.includes(type)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(artifact.status)) return false;
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(artifact.priority))
        return false;
      if (dateFrom && artifact.dateCreated && artifact.dateCreated < new Date(dateFrom).getTime())
        return false;
      if (dateTo && artifact.dateCreated && artifact.dateCreated > new Date(dateTo).getTime())
        return false;

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
            dateCreated: r.dateCreated,
          });
        }
      });

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

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setDateFrom('');
    setDateTo('');
  }, []);

  const handleSaveFilter = useCallback(async () => {
    if (!saveFilterName.trim()) return;
    await diskFilterService.createFilter(saveFilterName.trim(), currentFilters);
    const filters = await diskFilterService.getAllFilters();
    setSavedFilters(filters);
    setSaveFilterName('');
    setShowSaveDialog(false);
  }, [saveFilterName, currentFilters]);

  const handleLoadFilter = useCallback((filter: SavedFilter) => {
    setSearchQuery(filter.filters.searchQuery || '');
    setSelectedStatuses(filter.filters.status || []);
    setSelectedPriorities(filter.filters.priority || []);
    setDateFrom(
      filter.filters.dateCreatedFrom
        ? new Date(filter.filters.dateCreatedFrom).toISOString().split('T')[0]
        : ''
    );
    setDateTo(
      filter.filters.dateCreatedTo
        ? new Date(filter.filters.dateCreatedTo).toISOString().split('T')[0]
        : ''
    );
  }, []);

  const handleDeleteFilter = useCallback(async (id: string) => {
    await diskFilterService.deleteFilter(id);
    setSavedFilters(await diskFilterService.getAllFilters());
  }, []);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onNavigateToArtifact(result.type, result.id);
      onClose();
    },
    [onNavigateToArtifact, onClose]
  );

  const toggleValue = <T,>(arr: T[], value: T, setter: (v: T[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={22} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artifacts by ID, title, or description..."
              autoFocus
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '16px',
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
                padding: '4px',
                borderRadius: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter Toggle & Actions */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Filter size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setShowSaveDialog(true)}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'white',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Save size={12} />
              Save Search
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Artifact Types */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Artifact Type
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(
                  Object.entries(TYPE_CONFIG) as [
                    ArtifactType,
                    (typeof TYPE_CONFIG)[ArtifactType],
                  ][]
                ).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => toggleValue(selectedTypes, type, setSelectedTypes)}
                    style={chipStyle(selectedTypes.includes(type), config.color)}
                  >
                    {config.label} -{' '}
                    {type === 'requirement'
                      ? 'Requirements'
                      : type === 'useCase'
                        ? 'Use Cases'
                        : type === 'testCase'
                          ? 'Test Cases'
                          : type === 'information'
                            ? 'Information'
                            : 'Risks'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Status
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleValue(selectedStatuses, opt.value, setSelectedStatuses)}
                    style={chipStyle(selectedStatuses.includes(opt.value), opt.color)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Priority
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      toggleValue(selectedPriorities, opt.value, setSelectedPriorities)
                    }
                    style={chipStyle(selectedPriorities.includes(opt.value), opt.color)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Created Date
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results & Saved Searches */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Results List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <div
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '12px',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </div>
            {results.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Search size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <div style={{ fontSize: '14px' }}>No artifacts match your search criteria</div>
              </div>
            ) : (
              results.map((result) => {
                const typeConfig = TYPE_CONFIG[result.type];
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: typeConfig.bgColor,
                          color: typeConfig.color,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {result.id}
                      </span>
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '14px',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {result.title}
                      </span>
                    </div>
                    {result.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-muted)',
                          marginTop: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                        }}
                      >
                        {result.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Saved Searches Sidebar */}
          <div
            style={{
              width: '180px',
              borderLeft: '1px solid var(--color-border)',
              padding: '12px',
              overflowY: 'auto',
              backgroundColor: 'var(--color-bg-app)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Saved Searches
            </div>
            {savedFilters.length === 0 ? (
              <div
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                No saved searches yet
              </div>
            ) : (
              savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--color-bg-secondary)',
                    fontSize: '13px',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => handleLoadFilter(filter)}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')
                  }
                >
                  <Filter size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
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
                      opacity: 0.6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Filter Dialog */}
        {showSaveDialog && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
            }}
            onClick={() => setShowSaveDialog(false)}
          >
            <div
              style={{
                backgroundColor: 'var(--color-bg-card)',
                padding: '24px',
                borderRadius: '12px',
                width: '320px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Save Search
              </div>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Enter a name for this search..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: saveFilterName.trim()
                      ? 'var(--color-accent)'
                      : 'var(--color-bg-secondary)',
                    color: saveFilterName.trim() ? 'white' : 'var(--color-text-muted)',
                    cursor: saveFilterName.trim() ? 'pointer' : 'default',
                    fontSize: '13px',
                    fontWeight: 500,
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
