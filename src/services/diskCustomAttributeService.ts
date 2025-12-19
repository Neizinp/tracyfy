/**
 * Disk Custom Attribute Service
 *
 * CRUD operations for CustomAttributeDefinition entities stored in the custom-attributes/ folder.
 * Each attribute definition is a Markdown file with YAML frontmatter.
 */

import { fileSystemService } from './fileSystemService';
import { diskProjectService } from './diskProjectService';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';
import {
  customAttributeDefinitionToMarkdown,
  markdownToCustomAttributeDefinition,
} from '../utils/markdownUtils';

const CUSTOM_ATTRIBUTES_DIR = 'custom-attributes';
const ATTR_COUNTER_FILE = 'counters/custom-attributes.md';

class DiskCustomAttributeService {
  /**
   * Initialize custom-attributes directory
   */
  async initialize(): Promise<void> {
    await fileSystemService.getOrCreateDirectory(CUSTOM_ATTRIBUTES_DIR);
  }

  /**
   * Get counter value from file
   */
  private async getCounter(): Promise<number> {
    try {
      const content = await fileSystemService.readFile(ATTR_COUNTER_FILE);
      if (content) {
        return parseInt(content.trim(), 10) || 0;
      }
    } catch {
      // File doesn't exist
    }
    return 0;
  }

  /**
   * Set counter value
   */
  private async setCounter(value: number): Promise<void> {
    await fileSystemService.writeFile(ATTR_COUNTER_FILE, String(value));
  }

  /**
   * Get next attribute ID
   */
  async getNextId(): Promise<string> {
    const current = await this.getCounter();
    const next = current + 1;
    await this.setCounter(next);
    return `ATTR-${String(next).padStart(3, '0')}`;
  }

  /**
   * Recalculate counter from existing attribute files
   */
  async recalculateCounter(): Promise<void> {
    const defs = await this.getAllDefinitions();
    let maxNum = 0;

    for (const def of defs) {
      const match = def.id.match(/ATTR-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    await this.setCounter(maxNum);
  }

  /**
   * Get all attribute definitions (excluding soft-deleted)
   */
  async getAllDefinitions(): Promise<CustomAttributeDefinition[]> {
    const definitions: CustomAttributeDefinition[] = [];

    try {
      const files = await fileSystemService.listFiles(CUSTOM_ATTRIBUTES_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await fileSystemService.readFile(`${CUSTOM_ATTRIBUTES_DIR}/${file}`);
        if (content) {
          const def = markdownToCustomAttributeDefinition(content);
          if (def && def.id && !def.isDeleted) {
            definitions.push(def);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return definitions;
  }

  /**
   * Get all attribute definitions including soft-deleted
   */
  async getAllDefinitionsIncludingDeleted(): Promise<CustomAttributeDefinition[]> {
    const definitions: CustomAttributeDefinition[] = [];

    try {
      const files = await fileSystemService.listFiles(CUSTOM_ATTRIBUTES_DIR);

      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const content = await fileSystemService.readFile(`${CUSTOM_ATTRIBUTES_DIR}/${file}`);
        if (content) {
          const def = markdownToCustomAttributeDefinition(content);
          if (def && def.id) {
            definitions.push(def);
          }
        }
      }
    } catch {
      // Directory might not exist
    }

    return definitions;
  }

  /**
   * Get soft-deleted definitions (for trash view)
   */
  async getDeletedDefinitions(): Promise<CustomAttributeDefinition[]> {
    const all = await this.getAllDefinitionsIncludingDeleted();
    return all.filter((def) => def.isDeleted);
  }

  /**
   * Get definitions applicable to a specific artifact type
   */
  async getDefinitionsForArtifactType(
    artifactType: ApplicableArtifactType
  ): Promise<CustomAttributeDefinition[]> {
    const allDefs = await this.getAllDefinitions();
    return allDefs.filter((def) => def.appliesTo.includes(artifactType));
  }

  /**
   * Get a single definition by ID
   */
  async getDefinitionById(id: string): Promise<CustomAttributeDefinition | null> {
    try {
      const content = await fileSystemService.readFile(`${CUSTOM_ATTRIBUTES_DIR}/${id}.md`);
      if (content) {
        return markdownToCustomAttributeDefinition(content);
      }
    } catch {
      // File doesn't exist
    }
    return null;
  }

  /**
   * Create a new attribute definition
   */
  async createDefinition(
    data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>
  ): Promise<CustomAttributeDefinition> {
    // Ensure directory exists
    await this.initialize();

    // Generate new ID
    const id = await diskProjectService.getNextIdWithSync('customAttributes');
    const now = Date.now();

    const definition: CustomAttributeDefinition = {
      ...data,
      id,
      dateCreated: now,
      lastModified: now,
    };

    // Write to file
    const content = customAttributeDefinitionToMarkdown(definition);
    await fileSystemService.writeFile(`${CUSTOM_ATTRIBUTES_DIR}/${id}.md`, content);

    return definition;
  }

  /**
   * Update an existing attribute definition
   */
  async updateDefinition(
    id: string,
    updates: Partial<Omit<CustomAttributeDefinition, 'id' | 'dateCreated'>>
  ): Promise<CustomAttributeDefinition | null> {
    const existing = await this.getDefinitionById(id);
    if (!existing) {
      console.error(`Attribute definition ${id} not found`);
      return null;
    }

    const updated: CustomAttributeDefinition = {
      ...existing,
      ...updates,
      lastModified: Date.now(),
    };

    const content = customAttributeDefinitionToMarkdown(updated);
    await fileSystemService.writeFile(`${CUSTOM_ATTRIBUTES_DIR}/${id}.md`, content);

    return updated;
  }

  /**
   * Soft delete an attribute definition
   */
  async deleteDefinition(id: string): Promise<void> {
    await this.updateDefinition(id, {
      isDeleted: true,
      deletedAt: Date.now(),
    });
  }

  /**
   * Restore a soft-deleted definition
   */
  async restoreDefinition(id: string): Promise<CustomAttributeDefinition | null> {
    return this.updateDefinition(id, {
      isDeleted: false,
      deletedAt: undefined,
    });
  }

  /**
   * Permanently delete an attribute definition
   */
  async permanentDeleteDefinition(id: string): Promise<void> {
    try {
      await fileSystemService.deleteFile(`${CUSTOM_ATTRIBUTES_DIR}/${id}.md`);
    } catch (error) {
      console.error(`Failed to permanently delete attribute ${id}:`, error);
      throw error;
    }
  }

  /**
   * Check if an attribute name already exists
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const allDefs = await this.getAllDefinitions();
    return allDefs.some(
      (def) => def.name.toLowerCase() === name.toLowerCase() && def.id !== excludeId
    );
  }
}

export const diskCustomAttributeService = new DiskCustomAttributeService();
