/**
 * Disk Filter Service
 *
 * CRUD operations for saved filters stored in the saved-filters/ folder.
 * Filters are committed to git like other artifacts.
 */

import { BaseDiskService } from './baseDiskService';
import type { SavedFilter, FilterState } from '../types/filters';
import { idAllocator } from '../storage/idAllocator';
import { escapeBodyText, joinFrontmatter, readBody, splitFrontmatter } from '../domain/frontmatter';

const SAVED_FILTERS_DIR = 'saved-filters';

/** saved-filters/FILTER-001.md; the file name is the ID */
function savedFilterToMarkdown(filter: SavedFilter): string {
  return joinFrontmatter(
    {
      name: filter.name,
      dateCreated: filter.dateCreated,
      lastModified: filter.lastModified,
      filters: filter.filters,
    },
    `# ${filter.name}

${escapeBodyText(filter.description)}`
  );
}

function markdownToSavedFilter(id: string, content: string): SavedFilter | null {
  try {
    const { data, body } = splitFrontmatter(content);
    if (typeof data.name !== 'string' || !data.name) return null;
    const description = readBody(body).text;
    return {
      id,
      name: data.name,
      description: description || undefined,
      filters: (data.filters as FilterState) || {},
      dateCreated: (data.dateCreated as number) || 0,
      lastModified: (data.lastModified as number) || 0,
    };
  } catch {
    return null;
  }
}

class DiskFilterService extends BaseDiskService {
  /**
   * Initialize saved-filters directory
   */
  async initialize(): Promise<void> {
    await this.ensureDirectory(SAVED_FILTERS_DIR);
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
          const filter = markdownToSavedFilter(file.slice(0, -'.md'.length), content);
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
        return markdownToSavedFilter(id, content);
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

    const id = await idAllocator.next(SAVED_FILTERS_DIR, 'FILTER');
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
