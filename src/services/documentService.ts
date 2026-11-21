import { BaseArtifactService, type ArtifactSerializer } from './baseArtifactService';
import type { ArtifactDocument } from '../types';
import { documentToMarkdown, markdownToDocument } from '../utils/markdownUtils';

const documentSerializer: ArtifactSerializer<ArtifactDocument> = {
  serialize: documentToMarkdown,
  deserialize: markdownToDocument,
};

export class DocumentService extends BaseArtifactService<ArtifactDocument> {
  constructor() {
    super('document', documentSerializer);
  }
}

export const documentService = new DocumentService();
