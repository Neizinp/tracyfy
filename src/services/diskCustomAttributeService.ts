import { BaseArtifactService } from './baseArtifactService';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';
import {
  customAttributeDefinitionToMarkdown,
  markdownToCustomAttributeDefinition,
} from '../utils/markdownUtils';
import { idAllocator } from '../storage/idAllocator';
import { STORED_TYPES } from './storedTypes';

class DiskCustomAttributeService extends BaseArtifactService<CustomAttributeDefinition> {
  constructor() {
    super('customAttribute', {
      serialize: customAttributeDefinitionToMarkdown,
      deserialize: markdownToCustomAttributeDefinition,
    });
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await super.initialize();
  }

  /**
   * Get all attribute definitions
   */
  async getAllDefinitions(includeDeleted: boolean = false): Promise<CustomAttributeDefinition[]> {
    return this.loadAll(includeDeleted);
  }

  /**
   * Get soft-deleted definitions
   */
  async getDeletedDefinitions(): Promise<CustomAttributeDefinition[]> {
    return this.loadAll(true).then((all) => all.filter((def) => def.isDeleted));
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
   * Check if an attribute name already exists
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const allDefs = await this.getAllDefinitions();
    return allDefs.some(
      (def) => def.name.toLowerCase() === name.toLowerCase() && def.id !== excludeId
    );
  }

  /**
   * Create a new attribute definition
   */
  async createDefinition(
    def: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>
  ): Promise<CustomAttributeDefinition> {
    const nextId = await idAllocator.next(
      STORED_TYPES.customAttribute.folder,
      STORED_TYPES.customAttribute.idPrefix
    );
    const newDef: CustomAttributeDefinition = {
      ...def,
      id: nextId,
      dateCreated: Date.now(),
      lastModified: Date.now(),
    };
    // custom-attributes/ is hidden from the pending-changes panel, so commit right away
    return this.save(newDef, `Add custom attribute ${newDef.id}: ${newDef.name}`);
  }

  /**
   * Get definition by ID
   */
  async getDefinitionById(id: string): Promise<CustomAttributeDefinition | null> {
    return this.load(id);
  }

  /**
   * Update a definition
   */
  async updateDefinition(
    id: string,
    updates: Partial<CustomAttributeDefinition>
  ): Promise<CustomAttributeDefinition | null> {
    const def = await this.load(id);
    if (!def) return null;

    const updatedDef = {
      ...def,
      ...updates,
      lastModified: Date.now(),
    };
    return this.save(updatedDef, `Update custom attribute ${id}`);
  }

  /**
   * Delete a definition
   */
  async deleteDefinition(id: string, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
      await this.delete(id, `Delete custom attribute ${id}`);
    } else {
      await this.softDelete(id, `Delete custom attribute ${id}`);
    }
  }
}

export const diskCustomAttributeService = new DiskCustomAttributeService();
export const customAttributeService = diskCustomAttributeService;
