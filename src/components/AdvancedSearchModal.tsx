/**
 * Advanced Search Modal - Query Builder Style
 *
 * Vault-style search with Property → Condition → Value criteria rows.
 * Uses useAdvancedSearch hook for search logic.
 */

import React, { useCallback } from 'react';
import { X, Search, Save, Trash2, Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  useAdvancedSearch,
  PROPERTY_OPTIONS,
  CONDITIONS,
  type SearchResult,
} from '../hooks/useAdvancedSearch';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArtifact: (type: string, id: string) => void;
}

type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information' | 'risk';

const TYPE_CONFIG: Record<ArtifactType, { label: string; color: string; bgColor: string }> = {
  requirement: { label: 'REQ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  useCase: { label: 'UC', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  testCase: { label: 'TC', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)' },
  information: { label: 'INF', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.15)' },
  risk: { label: 'RSK', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-app)',
  color: 'var(--color-text-primary)',
  fontSize: '13px',
  minWidth: '140px',
};

const inputStyle: React.CSSProperties = {
  ...selectStyle,
  flex: 1,
  minWidth: '120px',
};

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToArtifact,
}) => {
  // Use the extracted hook for all search logic
  const {
    criteria,
    showCriteria,
    setShowCriteria,
    savedFilters,
    showSaveDialog,
    setShowSaveDialog,
    saveFilterName,
    setSaveFilterName,
    results,
    activeCriteriaCount,
    allPropertyOptions,
    customAttrDefs,
    addCriterion,
    removeCriterion,
    updateCriterion,
    handleClearAll,
    handleSaveFilter,
    handleLoadFilter,
    handleDeleteFilter,
  } = useAdvancedSearch({ isOpen });

  // Close modal on Escape key
  useKeyboardShortcuts({ onClose });

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      onNavigateToArtifact(result.type, result.id);
      onClose();
    },
    [onNavigateToArtifact, onClose]
  );

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
        paddingTop: '6vh',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '950px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Search size={22} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Advanced Search</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Criteria Toggle */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={() => setShowCriteria(!showCriteria)}
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
            Search Criteria
            {activeCriteriaCount > 0 && (
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
                {activeCriteriaCount}
              </span>
            )}
            {showCriteria ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleClearAll}
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
              <Save size={12} /> Save Search
            </button>
          </div>
        </div>

        {/* Criteria Builder */}
        {showCriteria && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            {criteria.map((criterion, index) => {
              const prop = allPropertyOptions.find((p) => p.value === criterion.property);
              const propType = prop?.type || 'text';
              const conditions = CONDITIONS[propType as keyof typeof CONDITIONS] || CONDITIONS.text;

              return (
                <div
                  key={criterion.id}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    marginBottom: '10px',
                  }}
                >
                  {index > 0 && (
                    <span
                      style={{ fontSize: '12px', color: 'var(--color-text-muted)', width: '30px' }}
                    >
                      AND
                    </span>
                  )}
                  {index === 0 && <span style={{ width: '30px' }} />}

                  {/* Property selector */}
                  <select
                    value={criterion.property}
                    onChange={(e) => updateCriterion(criterion.id, 'property', e.target.value)}
                    style={selectStyle}
                  >
                    <optgroup label="Common">
                      {PROPERTY_OPTIONS.slice(0, 9).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Requirement">
                      {PROPERTY_OPTIONS.slice(9, 14).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Use Case">
                      {PROPERTY_OPTIONS.slice(14, 18).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Test Case">
                      {PROPERTY_OPTIONS.slice(18, 20).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Risk">
                      {PROPERTY_OPTIONS.slice(20, 25).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Filter">
                      {PROPERTY_OPTIONS.slice(25).map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    {customAttrDefs.length > 0 && (
                      <optgroup label="Custom Attributes">
                        {customAttrDefs.map((def) => (
                          <option key={def.id} value={`custom_${def.id}`}>
                            [Custom] {def.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>

                  {/* Condition selector */}
                  <select
                    value={criterion.condition}
                    onChange={(e) => updateCriterion(criterion.id, 'condition', e.target.value)}
                    style={{ ...selectStyle, minWidth: '120px' }}
                  >
                    {conditions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* Value input */}
                  {!criterion.condition.includes('Empty') &&
                    (prop?.options ? (
                      <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">Select...</option>
                        {prop.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : propType === 'date' ? (
                      <input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        pattern="\d{4}-\d{2}-\d{2}"
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        placeholder="Enter value..."
                        style={inputStyle}
                      />
                    ))}

                  {/* Remove button */}
                  <button
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={criteria.length === 1}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: criteria.length > 1 ? 'pointer' : 'default',
                      color:
                        criteria.length > 1 ? 'var(--color-text-muted)' : 'var(--color-border)',
                      padding: '4px',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}

            <button
              onClick={addCriterion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px',
                background: 'none',
                border: '1px dashed var(--color-border)',
                borderRadius: '6px',
                padding: '8px 14px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
              }}
            >
              <Plus size={14} /> Add Criterion
            </button>
          </div>
        )}

        {/* Results & Saved Searches */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Results */}
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
              results.slice(0, 100).map((result) => {
                const typeConfig = TYPE_CONFIG[result.type as ArtifactType];
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
                          backgroundColor: typeConfig?.bgColor || 'rgba(100,100,100,0.15)',
                          color: typeConfig?.color || '#888',
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
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--color-text-muted)',
                          marginLeft: 'auto',
                        }}
                      >
                        {result.status}
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
                        }}
                      >
                        {result.description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {results.length > 100 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '10px',
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                }}
              >
                Showing first 100 of {results.length} results
              </div>
            )}
          </div>

          {/* Saved Searches */}
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
                No saved searches
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
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
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
                placeholder="Enter search name..."
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
