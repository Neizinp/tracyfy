/**
 * useAdvancedSearch Hook
 *
 * Manages search criteria, filtering logic, and saved filters for advanced search.
 * Extracted from AdvancedSearchModal for better separation of concerns.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCustomAttributes } from './useCustomAttributes';
import { diskFilterService } from '../services/diskFilterService';
import type { SavedFilter, FilterState } from '../types/filters';
import { useAppStore } from '../state';
import {
  CONDITIONS,
  findProperty,
  searchArtifacts,
  searchProperties,
  type SearchCriterion,
} from '../domain/search';

export { CONDITIONS, type SearchCriterion, type SearchResult } from '../domain/search';

interface CriteriaFilterState {
  criteria: SearchCriterion[];
}

let criterionIdCounter = 0;

interface UseAdvancedSearchOptions {
  isOpen: boolean;
}

export function useAdvancedSearch({ isOpen }: UseAdvancedSearchOptions) {
  const artifacts = useAppStore((s) => s.artifacts);
  const { definitions: customAttrDefs } = useCustomAttributes();

  // Query builder criteria
  const [criteria, setCriteria] = useState<SearchCriterion[]>([
    { id: String(++criterionIdCounter), property: 'any', condition: 'contains', value: '' },
  ]);
  const [showCriteria, setShowCriteria] = useState(true);

  // Saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Every field of every kind, and the custom attributes
  const propertyGroups = useMemo(() => searchProperties(customAttrDefs), [customAttrDefs]);

  useEffect(() => {
    if (isOpen) {
      diskFilterService.getAllFilters().then(setSavedFilters);
    }
  }, [isOpen]);

  // Add new criterion
  const addCriterion = useCallback(() => {
    setCriteria((prev) => [
      ...prev,
      { id: String(++criterionIdCounter), property: 'any', condition: 'contains', value: '' },
    ]);
  }, []);

  // Remove criterion
  const removeCriterion = useCallback((id: string) => {
    setCriteria((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  }, []);

  // Update criterion
  const updateCriterion = useCallback(
    (id: string, field: keyof SearchCriterion, value: string) => {
      setCriteria((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const updated = { ...c, [field]: value };
          // Reset condition when property type changes
          if (field === 'property') {
            const type = findProperty(propertyGroups, value)?.type ?? 'text';
            updated.condition = CONDITIONS[type][0].value;
            updated.value = '';
          }
          return updated;
        })
      );
    },
    [propertyGroups]
  );

  const results = useMemo(
    () => searchArtifacts(artifacts, criteria, customAttrDefs),
    [artifacts, criteria, customAttrDefs]
  );

  const handleClearAll = useCallback(() => {
    setCriteria([
      { id: String(++criterionIdCounter), property: 'any', condition: 'contains', value: '' },
    ]);
  }, []);

  const handleSaveFilter = useCallback(async () => {
    if (!saveFilterName.trim()) return;
    const filterState = {
      criteria: criteria.filter((c) => c.value || c.condition.includes('Empty')),
    };
    await diskFilterService.createFilter(
      saveFilterName.trim(),
      filterState as unknown as FilterState
    );
    setSavedFilters(await diskFilterService.getAllFilters());
    setSaveFilterName('');
    setShowSaveDialog(false);
  }, [saveFilterName, criteria]);

  const handleLoadFilter = useCallback((filter: SavedFilter) => {
    const saved = filter.filters as unknown as CriteriaFilterState;
    if (saved.criteria) {
      setCriteria(saved.criteria);
    }
  }, []);

  const handleDeleteFilter = useCallback(async (id: string) => {
    await diskFilterService.deleteFilter(id);
    setSavedFilters(await diskFilterService.getAllFilters());
  }, []);

  const activeCriteriaCount = criteria.filter(
    (c) => c.value || c.condition.includes('Empty')
  ).length;

  return {
    // State
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

    // Actions
    addCriterion,
    removeCriterion,
    updateCriterion,
    handleClearAll,
    handleSaveFilter,
    handleLoadFilter,
    handleDeleteFilter,
  };
}
