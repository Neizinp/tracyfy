import { BaseArtifactService } from './baseArtifactService';
import type { CustomAttributeDefinition, ApplicableArtifactType } from '../types/customAttributes';
import {
  customAttributeDefinitionToMarkdown,
  markdownToCustomAttributeDefinition,
} from '../utils/markdownUtils';
import { idService } from './idService';

class DiskCustomAttributeService extends BaseArtifactService<CustomAttributeDefinition> {
  constructor() {
    super('customAttributes', {
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
    const nextId = await idService.getNextIdWithSync('ATTR');
    const newDef: CustomAttributeDefinition = {
      ...def,
      id: nextId,
      dateCreated: Date.now(),
      lastModified: Date.now(),
    };
    return this.save(newDef);
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
    return this.save(updatedDef);
  }

  /**
   * Delete a definition
   */
  async deleteDefinition(id: string, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
      await this.delete(id);
    } else {
      await this.softDelete(id);
    }
  }
}

export const diskCustomAttributeService = new DiskCustomAttributeService();
export const customAttributeService = diskCustomAttributeService;
