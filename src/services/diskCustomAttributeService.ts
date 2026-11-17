/**
 * Custom attribute definitions live in tracyfy.yaml (customAttributes).
 * Changing one is an ordinary change to that file, committed by the user.
 */
import type { CustomAttributeDefinition } from '../types/customAttributes';
import { projectConfigStore } from '../storage/projectConfigStore';
import { nextIds } from '../domain/ids';

export type NewCustomAttribute = Omit<CustomAttributeDefinition, 'id'>;

class DiskCustomAttributeService {
  async getAllDefinitions(): Promise<CustomAttributeDefinition[]> {
    return (await projectConfigStore.load()).customAttributes;
  }

  /** True if another definition already has this name (case-insensitive) */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const defs = await this.getAllDefinitions();
    return defs.some((d) => d.name.toLowerCase() === name.toLowerCase() && d.id !== excludeId);
  }

  async createDefinition(def: NewCustomAttribute): Promise<CustomAttributeDefinition> {
    let created: CustomAttributeDefinition | undefined;
    await projectConfigStore.update((config) => {
      const [id] = nextIds(
        'ATTR',
        config.customAttributes.map((d) => d.id),
        1
      );
      created = { ...def, id };
      return { ...config, customAttributes: [...config.customAttributes, created] };
    });
    return created!;
  }

  async updateDefinition(
    id: string,
    updates: Partial<NewCustomAttribute>
  ): Promise<CustomAttributeDefinition | null> {
    let updated: CustomAttributeDefinition | null = null;
    await projectConfigStore.update((config) => ({
      ...config,
      customAttributes: config.customAttributes.map((d) => {
        if (d.id !== id) return d;
        updated = { ...d, ...updates, id };
        return updated;
      }),
    }));
    return updated;
  }

  /** Called whenever definitions (or anything else in tracyfy.yaml) change */
  subscribe(listener: () => void): () => void {
    return projectConfigStore.subscribe(listener);
  }
}

export const diskCustomAttributeService = new DiskCustomAttributeService();
export const customAttributeService = diskCustomAttributeService;
