/**
 * Disk Filter Service
 *
 * CRUD operations for saved filters stored in the saved-filters/ folder.
 * Filters are committed to git like other artifacts.
 */

import { BaseDiskService } from './baseDiskService';
import type { SavedFilter, FilterState } from '../types/filters';

const SAVED_FILTERS_DIR = 'saved-filters';
const FILTER_COUNTER_FILE = 'counters/saved-filters.md';

/**
 * Convert a SavedFilter to Markdown with YAML frontmatter
 */
function savedFilterToMarkdown(filter: SavedFilter): string {
  const lines = [
    '---',
    `id: "${filter.id}"`,
    `name: "${filter.name}"`,
    `description: "${filter.description || ''}"`,
    `dateCreated: ${filter.dateCreated}`,
    `lastModified: ${filter.lastModified}`,
    `filters: ${JSON.stringify(filter.filters)}`,
    '---',
    '',
    `# ${filter.name}`,
    '',
    filter.description || 'No description.',
  ];
  return lines.join('\n');
}

/**
 * Parse Markdown content to SavedFilter
 */
function markdownToSavedFilter(content: string): SavedFilter | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const data: Record<string, string> = {};

  frontmatter.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();
      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  });

  if (!data.id || !data.name) return null;

  let filters: FilterState = {};
  try {
    filters = JSON.parse(data.filters || '{}');
  } catch {
    // Invalid JSON
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || undefined,
    filters,
    dateCreated: parseInt(data.dateCreated, 10) || Date.now(),
    lastModified: parseInt(data.lastModified, 10) || Date.now(),
  };
}

class DiskFilterService extends BaseDiskService {
  /**
   * Initialize saved-filters directory
   */
  async initialize(): Promise<void> {
    await this.ensureDirectory(SAVED_FILTERS_DIR);
  }

  /**
   * Get next filter ID
   */
  private async getNextId(): Promise<string> {
    let counter = 0;
    try {
      const content = await this.readTextFile(FILTER_COUNTER_FILE);
      if (content) {
        counter = parseInt(content.trim(), 10) || 0;
      }
    } catch {
      // File doesn't exist
    }
    counter++;
    await this.writeTextFile(FILTER_COUNTER_FILE, String(counter));
    return `FILTER-${String(counter).padStart(3, '0')}`;
  }

  /**
   * Get all saved filters
   */
  async getAllFilters(): Promise<SavedFilter[]> {
    const filters: SavedFilter[] = [];

    try {
      const files = await this.listFiles(SAVED_FILTERS_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await this.readTextFile(`${SAVED_FILTERS_DIR}/${file}`);
        if (content) {
          const filter = markdownToSavedFilter(content);
          if (filter) {
            filters.push(filter);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return filters.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * Get a single filter by ID
   */
  async getFilterById(id: string): Promise<SavedFilter | null> {
    try {
      const content = await this.readTextFile(`${SAVED_FILTERS_DIR}/${id}.md`);
      if (content) {
        return markdownToSavedFilter(content);
      }
    } catch {
      // File doesn't exist
    }
    return null;
  }

  /**
   * Create a new saved filter
   */
  async createFilter(
    name: string,
    filters: FilterState,
    description?: string
  ): Promise<SavedFilter> {
    await this.initialize();

    const id = await this.getNextId();
    const now = Date.now();

    const savedFilter: SavedFilter = {
      id,
      name,
      description,
      filters,
      dateCreated: now,
      lastModified: now,
    };

    const content = savedFilterToMarkdown(savedFilter);
    await this.writeTextFile(`${SAVED_FILTERS_DIR}/${id}.md`, content, `Create filter ${id}`);

    return savedFilter;
  }

  /**
   * Update an existing saved filter
   */
  async updateFilter(
    id: string,
    updates: Partial<Omit<SavedFilter, 'id' | 'dateCreated'>>
  ): Promise<SavedFilter | null> {
    const existing = await this.getFilterById(id);
    if (!existing) return null;

    const updated: SavedFilter = {
      ...existing,
      ...updates,
      lastModified: Date.now(),
    };

    const content = savedFilterToMarkdown(updated);
    await this.writeTextFile(`${SAVED_FILTERS_DIR}/${id}.md`, content, `Update filter ${id}`);

    return updated;
  }

  /**
   * Delete a saved filter
   */
  async deleteFilter(id: string): Promise<void> {
    try {
      await this.deleteFile(`${SAVED_FILTERS_DIR}/${id}.md`);
    } catch (error) {
      console.error(`Failed to delete filter ${id}:`, error);
    }
  }
}

export const diskFilterService = new DiskFilterService();
