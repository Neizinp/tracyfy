/**
 * Advanced Search Modal - Query Builder Style
 *
 * Vault-style search with Property → Condition → Value criteria rows.
 * Uses useAdvancedSearch hook for search logic.
 */

import React, { useCallback } from 'react';
import { X, Search, Save, Trash2, Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useAdvancedSearch, CONDITIONS, type SearchResult } from '../hooks/useAdvancedSearch';
import { kind } from '../domain/artifactKinds';
import { findProperty } from '../domain/search';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToArtifact: (type: string, id: string) => void;
}

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
    propertyGroups,
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
      // Close first: closing clears the active modal, which would close the artifact's
      onClose();
      onNavigateToArtifact(result.type, result.id);
    },
    [onNavigateToArtifact, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="tf-search-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Advanced Search"
        className="tf-search-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tf-search-header">
          <div className="tf-search-heading">
            <Search size={22} className="tf-accent-icon" />
            <span>Advanced Search</span>
          </div>
          <button onClick={onClose} className="tf-search-icon-button">
            <X size={20} />
          </button>
        </div>

        <div className="tf-search-bar">
          <button onClick={() => setShowCriteria(!showCriteria)} className="tf-search-toggle">
            <Filter size={14} />
            Search Criteria
            {activeCriteriaCount > 0 && (
              <span className="tf-search-count">{activeCriteriaCount}</span>
            )}
            {showCriteria ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="tf-search-bar-actions">
            <button onClick={handleClearAll} className="tf-search-small tf-search-small-plain">
              Clear All
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="tf-search-small tf-search-small-primary"
            >
              <Save size={12} /> Save Search
            </button>
          </div>
        </div>

        {showCriteria && (
          <div className="tf-search-criteria">
            {criteria.map((criterion, index) => {
              const prop = findProperty(propertyGroups, criterion.property);
              const propType = prop?.type ?? 'text';
              const conditions = CONDITIONS[propType];

              return (
                <div key={criterion.id} className="tf-search-criterion">
                  <span className="tf-search-and">{index > 0 ? 'AND' : null}</span>

                  <select
                    value={criterion.property}
                    onChange={(e) => updateCriterion(criterion.id, 'property', e.target.value)}
                    className="tf-search-field"
                  >
                    {propertyGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.properties.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  <select
                    value={criterion.condition}
                    onChange={(e) => updateCriterion(criterion.id, 'condition', e.target.value)}
                    className="tf-search-field tf-search-condition"
                  >
                    {conditions.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {!criterion.condition.includes('Empty') &&
                    (prop?.options ? (
                      <select
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        className="tf-search-field tf-search-value"
                      >
                        <option value="">Select...</option>
                        {prop.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
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
                        className="tf-search-field tf-search-value"
                      />
                    ) : (
                      <input
                        type="text"
                        value={criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, 'value', e.target.value)}
                        placeholder="Enter value..."
                        className="tf-search-field tf-search-value"
                      />
                    ))}

                  <button
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={criteria.length === 1}
                    className="tf-search-icon-button tf-search-remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              );
            })}

            <button onClick={addCriterion} className="tf-search-add">
              <Plus size={14} /> Add Criterion
            </button>
          </div>
        )}

        <div className="tf-search-main">
          <div className="tf-search-results">
            <div className="tf-search-results-count">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </div>
            {results.length === 0 ? (
              <div className="tf-search-none">
                <Search size={40} />
                <div>No artifacts match your search criteria</div>
              </div>
            ) : (
              results.slice(0, 100).map((result) => {
                const typeColors = kind(result.type).color;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="tf-search-result"
                  >
                    <div className="tf-search-result-head">
                      <span
                        className="tf-search-result-id"
                        // The kind's own colors
                        style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
                      >
                        {result.id}
                      </span>
                      <span className="tf-search-result-title">{result.title}</span>
                      <span className="tf-search-result-status">{result.status}</span>
                    </div>
                    {result.description && (
                      <div className="tf-search-result-description">{result.description}</div>
                    )}
                  </div>
                );
              })
            )}
            {results.length > 100 && (
              <div className="tf-search-more">Showing first 100 of {results.length} results</div>
            )}
          </div>

          <div className="tf-search-saved">
            <div className="tf-search-saved-title">Saved Searches</div>
            {savedFilters.length === 0 ? (
              <div className="tf-search-saved-none">No saved searches</div>
            ) : (
              savedFilters.map((filter) => (
                <div
                  key={filter.id}
                  className="tf-search-saved-item"
                  onClick={() => handleLoadFilter(filter)}
                >
                  <Filter size={12} className="tf-search-saved-icon" />
                  <span className="tf-search-saved-name">{filter.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFilter(filter.id);
                    }}
                    className="tf-search-icon-button tf-search-saved-delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {showSaveDialog && (
          <div className="tf-search-save-backdrop" onClick={() => setShowSaveDialog(false)}>
            <div className="tf-search-save" onClick={(e) => e.stopPropagation()}>
              <div className="tf-search-save-title">Save Search</div>
              <input
                type="text"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="Enter search name..."
                autoFocus
                className="tf-search-save-name"
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <div className="tf-search-save-actions">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="tf-search-save-button tf-search-save-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim()}
                  className="tf-search-save-button tf-search-save-confirm"
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
