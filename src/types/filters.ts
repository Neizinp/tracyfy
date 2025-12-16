/**
 * Filter Types
 *
 * Types for advanced filtering and saved filter presets.
 */

import type { CustomAttributeValue } from './customAttributes';

/**
 * Filter state for artifacts
 */
export interface FilterState {
  // Text search (existing)
  searchQuery?: string;

  // Categorical filters (multi-select)
  status?: string[];
  priority?: string[];

  // Date range filters
  dateCreatedFrom?: number;
  dateCreatedTo?: number;
  lastModifiedFrom?: number;
  lastModifiedTo?: number;

  // Custom attribute filters
  customAttributes?: CustomAttributeValue[];
}

/**
 * Saved filter preset stored in saved-filters/ folder
 */
export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterState;
  dateCreated: number;
  lastModified: number;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return !!(
    filters.searchQuery ||
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    filters.dateCreatedFrom ||
    filters.dateCreatedTo ||
    filters.lastModifiedFrom ||
    filters.lastModifiedTo ||
    (filters.customAttributes && filters.customAttributes.length > 0)
  );
}

/**
 * Empty filter state
 */
export const EMPTY_FILTERS: FilterState = {};
