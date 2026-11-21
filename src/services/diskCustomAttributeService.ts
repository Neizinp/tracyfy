/**
 * Reading custom attribute definitions from tracyfy.yaml, for code outside
 * the UI (exports, demo data). The UI reads them from the store and changes
 * them through its actions (addAttributeDefinition, updateAttributeDefinition).
 */
import type { CustomAttributeDefinition } from '../types/customAttributes';
import { projectConfigStore } from '../storage/projectConfigStore';

class DiskCustomAttributeService {
  async getAllDefinitions(): Promise<CustomAttributeDefinition[]> {
    return (await projectConfigStore.load()).customAttributes;
  }

  /** Called whenever definitions (or anything else in tracyfy.yaml) change */
  subscribe(listener: () => void): () => void {
    return projectConfigStore.subscribe(listener);
  }
}

export const diskCustomAttributeService = new DiskCustomAttributeService();
export const customAttributeService = diskCustomAttributeService;
