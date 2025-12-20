import { BaseArtifactService, type ArtifactSerializer } from './baseArtifactService';
import type { ArtifactDocument } from '../types';
import { documentToMarkdown, markdownToDocument } from '../utils/markdownUtils';

const documentSerializer: ArtifactSerializer<ArtifactDocument> = {
  serialize: documentToMarkdown,
  deserialize: markdownToDocument,
};

export class DocumentService extends BaseArtifactService<ArtifactDocument> {
  constructor() {
    super('documents', documentSerializer);
  }

  /**
   * Get all documents for a specific project
   */
  async getByProject(projectId: string): Promise<ArtifactDocument[]> {
    const all = await this.loadAll();
    return all.filter((doc) => doc.projectId === projectId);
  }
}

export const documentService = new DocumentService();
