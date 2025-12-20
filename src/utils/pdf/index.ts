/**
 * PDF Export Module
 *
 * Re-exports all PDF export utilities from the modular structure.
 * The main exportProjectToPDF function remains in the original file for now
 * to maintain backward compatibility.
 */

// Types
export type { TOCEntry, ArtifactCommit, RemovedArtifact, PageRef } from './types';

// Image utilities
export {
  extractImagePaths,
  loadImageAsBase64,
  addImagesFromMarkdown,
  clearImageCache,
} from './pdfImageUtils';

// Core utilities
export {
  addCoverPage,
  addTableOfContents,
  calculateTocPages,
  addPageNumbers,
  sortByIdNumber,
  formatCustomAttributeValue,
} from './pdfCoreUtils';

// Artifact sections
export {
  addRequirementsSection,
  addUseCasesSection,
  addTestCasesSection,
  addInformationSection,
} from './pdfArtifactSections';

// Documents section
export { addDocumentsSection } from './pdfDocumentExport';

// Links and Risks sections
export { addLinksSection, addRisksSection } from './pdfLinksRisksSection';

// Revision History
export { addRevisionHistory } from './pdfRevisionHistory';

// Main export function
export { exportProjectToPDF } from './pdfMainExport';
