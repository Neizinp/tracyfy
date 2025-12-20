import jsPDF from 'jspdf';
import { debug } from '../debug';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ProjectBaseline,
  Risk,
  ArtifactDocument,
  CustomAttributeDefinition,
} from '../../types';
import { realGitService } from '../../services/realGitService';
import { diskLinkService } from '../../services/diskLinkService';
import { diskCustomAttributeService } from '../../services/diskCustomAttributeService';
import type { CommitInfo } from '../../types';
import type { TOCEntry, ArtifactCommit, RemovedArtifact } from './types';
import {
  addCoverPage,
  addTableOfContents,
  calculateTocPages,
  addPageNumbers,
  sortByIdNumber,
} from './pdfCoreUtils';
import {
  addRequirementsSection,
  addUseCasesSection,
  addTestCasesSection,
  addInformationSection,
} from './pdfArtifactSections';
import { addDocumentsSection, renderFlatStructure } from './pdfDocumentExport';
import { addLinksSection, addRisksSection } from './pdfLinksRisksSection';
import { addRevisionHistory } from './pdfRevisionHistory';

/**
 * Main export function for PDF
 */
export async function exportProjectToPDF(
  project: Project,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks?: Risk[];
  },
  projectRequirementIds: string[],
  projectUseCaseIds: string[],
  projectTestCaseIds: string[],
  projectInformationIds: string[],
  baselines: ProjectBaseline[],
  selectedBaseline: ProjectBaseline | null, // null = Current State
  currentUserName?: string,
  includeDocuments: boolean = true,
  projectDocuments: ArtifactDocument[] = []
): Promise<void> {
  // 0. Request File Handle FIRST (to ensure user activation is valid)
  let fileHandle: FileSystemFileHandle | null = null;
  const baselineSuffix = selectedBaseline ? selectedBaseline.name : 'Current State';
  const defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')} - ${baselineSuffix.replace(/[^a-z0-9]/gi, '_')}.pdf`;

  try {
    if ('showSaveFilePicker' in window) {
      fileHandle = await (
        window as unknown as {
          showSaveFilePicker: (options: object) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [
          {
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      });
    }
  } catch (error) {
    debug.log('Save dialog cancelled or not supported, will fallback to download');
    if (error instanceof Error && error.name === 'AbortError') {
      return; // Stop export if user cancelled dialog
    }
  }

  const doc = new jsPDF();
  let currentPage = 1;
  const tocEntries: TOCEntry[] = [];

  // 1. Cover Page
  addCoverPage(doc, project, selectedBaseline, currentUserName);
  currentPage++;

  // 2. Estimate ToC pages needed based on artifact counts
  const hasArtifacts =
    projectRequirementIds.length > 0 ||
    projectUseCaseIds.length > 0 ||
    projectTestCaseIds.length > 0 ||
    projectInformationIds.length > 0;
  const estimatedLinksCount = hasArtifacts ? 30 : 0;
  const estimatedRisksCount = (globalState.risks || []).filter(
    (r: Risk) => project.riskIds?.includes(r.id) && !r.isDeleted
  ).length;

  const estimatedTocEntries =
    (projectRequirementIds.length > 0 ? 1 + projectRequirementIds.length : 0) +
    (projectUseCaseIds.length > 0 ? 1 + projectUseCaseIds.length : 0) +
    (projectTestCaseIds.length > 0 ? 1 + projectTestCaseIds.length : 0) +
    (projectInformationIds.length > 0 ? 1 + projectInformationIds.length : 0) +
    (estimatedRisksCount > 0 ? 1 + estimatedRisksCount : 0) +
    (estimatedLinksCount > 0 ? 1 + estimatedLinksCount : 0) +
    (includeDocuments && projectDocuments.length > 0 ? 1 + projectDocuments.length * 5 : 0) + // Estimate 5 items per doc
    1;

  const tocPagesNeeded = calculateTocPages(estimatedTocEntries);
  const tocStartPage = currentPage;

  // Reserve ToC pages
  for (let i = 0; i < tocPagesNeeded; i++) {
    doc.addPage();
    currentPage++;
  }

  // Fetch custom attribute definitions for displaying values
  const customAttributeDefinitions = await diskCustomAttributeService.getAllDefinitions();

  // 3. Fetch git commit history since last baseline
  const projectRequirements = sortByIdNumber(
    globalState.requirements.filter((r) => projectRequirementIds.includes(r.id) && !r.isDeleted)
  );
  const projectUseCases = sortByIdNumber(
    globalState.useCases.filter((u) => projectUseCaseIds.includes(u.id) && !u.isDeleted)
  );
  const projectTestCases = sortByIdNumber(
    globalState.testCases.filter((t) => projectTestCaseIds.includes(t.id) && !t.isDeleted)
  );
  const projectInformation = sortByIdNumber(
    globalState.information.filter((i) => projectInformationIds.includes(i.id) && !i.isDeleted)
  );

  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);

  let previousBaseline: ProjectBaseline | null = null;
  let upperBoundTimestamp: number | null = null;

  if (selectedBaseline) {
    const selectedIndex = sortedBaselines.findIndex((b) => b.id === selectedBaseline.id);
    if (selectedIndex >= 0 && selectedIndex < sortedBaselines.length - 1) {
      previousBaseline = sortedBaselines[selectedIndex + 1];
    }
    upperBoundTimestamp = selectedBaseline.timestamp;
  } else {
    previousBaseline = sortedBaselines.length > 0 ? sortedBaselines[0] : null;
    upperBoundTimestamp = null;
  }

  const artifactCommits: ArtifactCommit[] = [];
  const removedArtifacts: RemovedArtifact[] = [];

  const filterCommits = (history: CommitInfo[]): CommitInfo[] => {
    if (upperBoundTimestamp && !previousBaseline) {
      return [];
    }
    return history.filter((commit) => {
      const afterPrevious = previousBaseline ? commit.timestamp > previousBaseline.timestamp : true;
      const beforeUpper = upperBoundTimestamp ? commit.timestamp <= upperBoundTimestamp : true;
      return afterPrevious && beforeUpper;
    });
  };

  const isArtifactNew = (fullHistory: CommitInfo[]): boolean => {
    if (!previousBaseline || fullHistory.length === 0) return false;
    const oldestCommit = fullHistory.reduce((oldest, commit) =>
      commit.timestamp < oldest.timestamp ? commit : oldest
    );
    return oldestCommit.timestamp > previousBaseline.timestamp;
  };

  // Fetch history for each artifact type
  for (const req of projectRequirements) {
    try {
      const history = await realGitService.getHistory(`requirements/${req.id}.md`);
      const filteredHistory = filterCommits(history);
      const isNew = isArtifactNew(history);
      if (filteredHistory.length > 0 || isNew) {
        artifactCommits.push({
          artifactId: req.id,
          artifactTitle: req.title,
          artifactType: 'requirement',
          commits: filteredHistory,
          isNew,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const uc of projectUseCases) {
    try {
      const history = await realGitService.getHistory(`usecases/${uc.id}.md`);
      const filteredHistory = filterCommits(history);
      const isNew = isArtifactNew(history);
      if (filteredHistory.length > 0 || isNew) {
        artifactCommits.push({
          artifactId: uc.id,
          artifactTitle: uc.title,
          artifactType: 'usecase',
          commits: filteredHistory,
          isNew,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const tc of projectTestCases) {
    try {
      const history = await realGitService.getHistory(`testcases/${tc.id}.md`);
      const filteredHistory = filterCommits(history);
      const isNew = isArtifactNew(history);
      if (filteredHistory.length > 0 || isNew) {
        artifactCommits.push({
          artifactId: tc.id,
          artifactTitle: tc.title,
          artifactType: 'testcase',
          commits: filteredHistory,
          isNew,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const info of projectInformation) {
    try {
      const history = await realGitService.getHistory(`information/${info.id}.md`);
      const filteredHistory = filterCommits(history);
      const isNew = isArtifactNew(history);
      if (filteredHistory.length > 0 || isNew) {
        artifactCommits.push({
          artifactId: info.id,
          artifactTitle: info.title,
          artifactType: 'information',
          commits: filteredHistory,
          isNew,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  let sectionNumber = 1;

  // 4. Revision History
  if (previousBaseline && (artifactCommits.length > 0 || removedArtifacts.length > 0)) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Revision History`, page: currentPage, level: 0 });
    addRevisionHistory(doc, artifactCommits, removedArtifacts, sectionNumber);
    currentPage++;
  }

  // 5. Requirements Section
  if (projectRequirements.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Requirements`, page: currentPage, level: 0 });
    currentPage = await addRequirementsSection(
      doc,
      projectRequirements,
      currentPage,
      tocEntries,
      sectionNumber,
      customAttributeDefinitions
    );
  }

  // 6. Use Cases Section
  if (projectUseCases.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Use Cases`, page: currentPage, level: 0 });
    currentPage = await addUseCasesSection(
      doc,
      projectUseCases,
      currentPage,
      tocEntries,
      sectionNumber,
      customAttributeDefinitions
    );
  }

  // 7. Test Cases Section
  if (projectTestCases.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Test Cases`, page: currentPage, level: 0 });
    currentPage = await addTestCasesSection(
      doc,
      projectTestCases,
      currentPage,
      tocEntries,
      sectionNumber,
      customAttributeDefinitions
    );
  }

  // 8. Information Section
  if (projectInformation.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Information`, page: currentPage, level: 0 });
    currentPage = await addInformationSection(
      doc,
      projectInformation,
      currentPage,
      tocEntries,
      sectionNumber,
      customAttributeDefinitions
    );
  }

  // 9. Risks Section
  const projectRisks = sortByIdNumber(
    (globalState.risks || []).filter((r: Risk) => project.riskIds?.includes(r.id) && !r.isDeleted)
  );
  if (projectRisks.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Risks`, page: currentPage, level: 0 });
    currentPage = await addRisksSection(doc, projectRisks, currentPage, tocEntries, sectionNumber);
  }

  // 10. Documents Section
  if (includeDocuments && projectDocuments.length > 0) {
    currentPage = await addDocumentsSection(
      {
        doc,
        tocEntries,
        requirements: globalState.requirements,
        useCases: globalState.useCases,
        testCases: globalState.testCases,
        information: globalState.information,
        risks: globalState.risks || [],
        customAttributeDefinitions,
      },
      projectDocuments,
      sectionNumber + 1
    );
    sectionNumber += projectDocuments.length;
  }

  // 11. Links Section
  const projectLinks = await diskLinkService.getLinksForProject(project.id);
  if (projectLinks.length > 0) {
    doc.addPage();
    sectionNumber++;
    tocEntries.push({ title: `${sectionNumber}. Links`, page: currentPage, level: 0 });
    currentPage = addLinksSection(doc, projectLinks, currentPage, tocEntries, sectionNumber);
  }

  // Add TOC
  addTableOfContents(doc, tocEntries, tocStartPage, tocPagesNeeded);

  // Add Page Numbers
  addPageNumbers(doc);

  // Save
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const pdfBlob = doc.output('blob');
      const writable = await (fileHandle as any).createWritable();
      await writable.write(pdfBlob);
      await writable.close();
    } catch (err) {
      console.error('Error writing to file:', err);
      doc.save(defaultFilename);
    }
  } else {
    doc.save(defaultFilename);
  }
}

/**
 * Export a single Document as the primary PDF report
 */
export async function exportSingleDocumentToPDF(
  document: ArtifactDocument,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
    risks?: Risk[];
  },
  currentUserName?: string
): Promise<void> {
  // 0. Request File Handle
  let fileHandle: FileSystemFileHandle | null = null;
  const defaultFilename = `Document_${document.id}_${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;

  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: defaultFilename,
        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }],
      });
    } catch (err) {
      debug.log('Export cancelled or failed:', err);
      return;
    }
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const tocEntries: TOCEntry[] = [];

  // 1. Cover Page (Simplified for Document)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(document.title, pageWidth / 2, 80, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Requirements Project Document', pageWidth / 2, 95, { align: 'center' });

  if (document.description) {
    doc.setFontSize(11);
    const descLines = doc.splitTextToSize(document.description, pageWidth - 40);
    doc.text(descLines, pageWidth / 2, 110, { align: 'center', maxWidth: pageWidth - 40 });
  }

  doc.setFontSize(10);
  doc.text(`ID: ${document.id}`, pageWidth / 2, 140, { align: 'center' });
  doc.text(`Version: ${document.revision || '01'}`, pageWidth / 2, 146, { align: 'center' });

  if (currentUserName) {
    doc.text(`Exported by: ${currentUserName}`, pageWidth / 2, 160, { align: 'center' });
  }

  // 2. Reserve ToC Pages
  const tocPagesReserved = 1;
  const tocStartPage = 2;

  // 3. Document Content
  const customAttributeDefinitions = await diskCustomAttributeService.getAllDefinitions();

  doc.addPage(); // TOC placeholder
  doc.addPage(); // Content start
  const currentPage = 3;

  await renderFlatStructure(
    {
      doc,
      requirements: globalState.requirements,
      useCases: globalState.useCases,
      testCases: globalState.testCases,
      information: globalState.information,
      risks: globalState.risks || [],
      customAttributeDefinitions,
      tocEntries,
    },
    document.structure,
    20,
    currentPage,
    [] // Start with no base numbering to make it primary
  );

  // 4. Add TOC
  addTableOfContents(doc, tocEntries, tocStartPage, tocPagesReserved);

  // 5. Add Page Numbers
  addPageNumbers(doc);

  // 6. Save
  if (fileHandle) {
    const pdfBlob = doc.output('blob');
    const writable = await (fileHandle as any).createWritable();
    await writable.write(pdfBlob);
    await writable.close();
  } else {
    doc.save(defaultFilename);
  }

  debug.log('Document export completed successfully');
}
