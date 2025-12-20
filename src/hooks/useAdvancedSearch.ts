/**
 * useAdvancedSearch Hook
 *
 * Manages search criteria, filtering logic, and saved filters for advanced search.
 * Extracted from AdvancedSearchModal for better separation of concerns.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
} from '../app/providers';
import type { Requirement, UseCase, TestCase, Information, Risk } from '../types';
import { useCustomAttributes } from './useCustomAttributes';
import { diskFilterService } from '../services/diskFilterService';
import type { SavedFilter, FilterState } from '../types/filters';

// Types
type ArtifactType = 'requirement' | 'useCase' | 'testCase' | 'information' | 'risk';

export interface SearchCriterion {
  id: string;
  property: string;
  condition: string;
  value: string;
}

interface CriteriaFilterState {
  criteria: SearchCriterion[];
}

export interface SearchResult {
  id: string;
  title: string;
  type: ArtifactType;
  status: string;
  priority: string;
  description: string;
  dateCreated?: number;
  [key: string]: unknown;
}

// All searchable properties with metadata
export const PROPERTY_OPTIONS = [
  { value: 'any', label: 'Any Field', type: 'text' },
  // Common
  { value: 'id', label: 'ID', type: 'text' },
  { value: 'title', label: 'Title', type: 'text' },
  { value: 'description', label: 'Description', type: 'text' },
  {
    value: 'status',
    label: 'Status',
    type: 'select',
    options: [
      'draft',
      'active',
      'approved',
      'deprecated',
      'passed',
      'failed',
      'blocked',
      'pending',
    ],
  },
  {
    value: 'priority',
    label: 'Priority',
    type: 'select',
    options: ['critical', 'high', 'medium', 'low'],
  },
  { value: 'revision', label: 'Revision', type: 'text' },
  { value: 'dateCreated', label: 'Created Date', type: 'date' },
  { value: 'lastModified', label: 'Modified Date', type: 'date' },
  // Requirement-specific
  { value: 'text', label: 'Requirement Text', type: 'text' },
  { value: 'rationale', label: 'Rationale', type: 'text' },
  { value: 'author', label: 'Author', type: 'text' },
  { value: 'verificationMethod', label: 'Verification Method', type: 'text' },
  { value: 'comments', label: 'Comments', type: 'text' },
  // Use Case-specific
  { value: 'actor', label: 'Actor', type: 'text' },
  { value: 'preconditions', label: 'Preconditions', type: 'text' },
  { value: 'postconditions', label: 'Postconditions', type: 'text' },
  { value: 'mainFlow', label: 'Main Flow', type: 'text' },
  // Test Case-specific
  { value: 'steps', label: 'Test Steps', type: 'text' },
  { value: 'expectedResult', label: 'Expected Result', type: 'text' },
  // Risk-specific
  { value: 'category', label: 'Risk Category', type: 'text' },
  {
    value: 'probability',
    label: 'Probability',
    type: 'select',
    options: ['very-low', 'low', 'medium', 'high', 'very-high'],
  },
  {
    value: 'impact',
    label: 'Impact',
    type: 'select',
    options: ['negligible', 'minor', 'moderate', 'major', 'severe'],
  },
  { value: 'mitigation', label: 'Mitigation', type: 'text' },
  { value: 'owner', label: 'Owner', type: 'text' },
  // Artifact type filter
  {
    value: '_type',
    label: 'Artifact Type',
    type: 'select',
    options: ['requirement', 'useCase', 'testCase', 'information', 'risk'],
  },
];

export const CONDITIONS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'notContains', label: 'Does not contain' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ],
  select: [
    { value: 'equals', label: 'Is' },
    { value: 'notEquals', label: 'Is not' },
  ],
  date: [
    { value: 'on', label: 'On' },
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
  ],
};

let criterionIdCounter = 0;

interface UseAdvancedSearchOptions {
  isOpen: boolean;
}

export function useAdvancedSearch({ isOpen }: UseAdvancedSearchOptions) {
  const { requirements } = useRequirements();
  const { useCases } = useUseCases();
  const { testCases } = useTestCases();
  const { information } = useInformation();
  const { risks } = useRisks();
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

  // Build property options including custom attributes
  const allPropertyOptions = useMemo(() => {
    const customProps = customAttrDefs.map((def) => ({
      value: `custom_${def.id}`,
      label: `[Custom] ${def.name}`,
      type: def.type === 'dropdown' ? 'select' : def.type === 'date' ? 'date' : 'text',
      options: def.type === 'dropdown' ? def.options : undefined,
    }));
    return [...PROPERTY_OPTIONS, ...customProps];
  }, [customAttrDefs]);

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
            const prop = allPropertyOptions.find((p) => p.value === value);
            const type = prop?.type || 'text';
            updated.condition =
              CONDITIONS[type as keyof typeof CONDITIONS]?.[0]?.value || 'contains';
            updated.value = '';
          }
          return updated;
        })
      );
    },
    [allPropertyOptions]
  );

  // Check if value matches criterion
  const matchesCriterion = useCallback(
    (fieldValue: unknown, criterion: SearchCriterion): boolean => {
      const { condition, value } = criterion;

      if (condition === 'isEmpty') return !fieldValue || String(fieldValue).trim() === '';
      if (condition === 'isNotEmpty') return !!fieldValue && String(fieldValue).trim() !== '';

      if (!value && condition !== 'isEmpty' && condition !== 'isNotEmpty') return true;

      const strValue = String(fieldValue || '').toLowerCase();
      const searchValue = value.toLowerCase();

      switch (condition) {
        case 'contains':
          return strValue.includes(searchValue);
        case 'equals':
          return strValue === searchValue;
        case 'notEquals':
          return strValue !== searchValue;
        case 'startsWith':
          return strValue.startsWith(searchValue);
        case 'endsWith':
          return strValue.endsWith(searchValue);
        case 'notContains':
          return !strValue.includes(searchValue);
        case 'before':
        case 'after':
        case 'on': {
          if (!fieldValue) return false;
          let fieldDate: string;
          if (typeof fieldValue === 'number') {
            fieldDate = new Date(fieldValue).toISOString().split('T')[0];
          } else {
            fieldDate = String(fieldValue).split('T')[0];
          }
          const searchDate = value;
          if (condition === 'before') return fieldDate < searchDate;
          if (condition === 'after') return fieldDate > searchDate;
          return fieldDate === searchDate;
        }
        default:
          return strValue.includes(searchValue);
      }
    },
    []
  );

  // Get field value from artifact
  const getFieldValue = useCallback((artifact: SearchResult, property: string): unknown => {
    if (property === 'any') {
      return `${artifact.id} ${artifact.title} ${artifact.description || ''} ${artifact.text || ''} ${artifact.rationale || ''}`;
    }
    if (property === '_type') return artifact.type;
    if (property.startsWith('custom_')) {
      const attrId = property.replace('custom_', '');
      const customAttrs = artifact.customAttributes as
        | Array<{ attributeId: string; value: unknown }>
        | undefined;
      const attr = customAttrs?.find((a) => a.attributeId === attrId);
      return attr?.value;
    }
    return artifact[property];
  }, []);

  // Apply all criteria and get results
  const results: SearchResult[] = useMemo(() => {
    const allArtifacts: SearchResult[] = [];

    requirements
      .filter((r: Requirement) => !r.isDeleted)
      .forEach((r: Requirement) => {
        allArtifacts.push({
          ...r,
          type: 'requirement' as ArtifactType,
          status: r.status || 'draft',
          priority: r.priority || 'medium',
          description: r.description || '',
        });
      });
    useCases
      .filter((u: UseCase) => !u.isDeleted)
      .forEach((u: UseCase) => {
        allArtifacts.push({
          ...u,
          type: 'useCase' as ArtifactType,
          status: u.status || 'draft',
          priority: u.priority || 'medium',
          description: u.description || '',
        });
      });
    testCases
      .filter((t: TestCase) => !t.isDeleted)
      .forEach((t: TestCase) => {
        allArtifacts.push({
          ...t,
          type: 'testCase' as ArtifactType,
          status: t.status || 'draft',
          priority: t.priority || 'medium',
          description: t.description || '',
        });
      });
    information
      .filter((i: Information) => !i.isDeleted)
      .forEach((i: Information) => {
        allArtifacts.push({
          ...i,
          type: 'information' as ArtifactType,
          status: 'active',
          priority: 'medium',
          description: i.text || '',
        });
      });
    risks
      .filter((r: Risk) => !r.isDeleted)
      .forEach((r: Risk) => {
        allArtifacts.push({
          ...r,
          type: 'risk' as ArtifactType,
          status: r.status || 'open',
          priority: r.impact || 'medium',
          description: r.description || '',
        });
      });

    return allArtifacts.filter((artifact) => {
      return criteria.every((criterion) => {
        if (
          !criterion.value &&
          criterion.condition !== 'isEmpty' &&
          criterion.condition !== 'isNotEmpty'
        ) {
          return true;
        }
        const fieldValue = getFieldValue(artifact, criterion.property);
        return matchesCriterion(fieldValue, criterion);
      });
    });
  }, [
    requirements,
    useCases,
    testCases,
    information,
    risks,
    criteria,
    getFieldValue,
    matchesCriterion,
  ]);

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
    allPropertyOptions,
    customAttrDefs,

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
