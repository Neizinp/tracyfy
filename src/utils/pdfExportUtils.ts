import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ProjectBaseline,
  Link,
  Risk,
} from '../types';
import { formatDate } from './dateUtils';
import { realGitService } from '../services/realGitService';
import { fileSystemService } from '../services/fileSystemService';
import { diskLinkService } from '../services/diskLinkService';
import { LINK_TYPE_LABELS } from './linkTypes';
import type { CommitInfo } from '../types';

// Additional types
interface TOCEntry {
  title: string;
  page: number;
  level: number;
}

// Image cache to avoid loading the same image multiple times
const imageCache = new Map<string, string>();

/**
 * Extract image paths from markdown content
 * Matches ![alt](./assets/...) pattern
 */
function extractImagePaths(markdown: string): string[] {
  const regex = /!\[[^\]]*\]\((\.[^)]+)\)/g;
  const paths: string[] = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

/**
 * Load an image from the file system and convert to base64 data URL
 * Returns null if image cannot be loaded
 */
async function loadImageAsBase64(relativePath: string): Promise<string | null> {
  // Check cache first
  if (imageCache.has(relativePath)) {
    return imageCache.get(relativePath)!;
  }

  try {
    // Normalize path (remove leading ./)
    const normalizedPath = relativePath.replace(/^\.\//, '');

    // Read binary data
    const data = await fileSystemService.readFileBinary(normalizedPath);
    if (!data) {
      console.warn(`[PDF Export] Image not found: ${relativePath}`);
      return null;
    }

    // Determine MIME type from extension
    const ext = normalizedPath.split('.').pop()?.toLowerCase() || 'png';
    const mimeTypes: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const mimeType = mimeTypes[ext] || 'image/png';

    // Convert to base64 data URL
    const base64 = btoa(String.fromCharCode(...data));
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Cache the result
    imageCache.set(relativePath, dataUrl);

    return dataUrl;
  } catch (error) {
    console.error(`[PDF Export] Failed to load image: ${relativePath}`, error);
    return null;
  }
}

/**
 * Add images from markdown content to the PDF at the current position
 * Returns the new Y position after adding images
 */
async function addImagesFromMarkdown(
  doc: jsPDF,
  markdown: string,
  startY: number,
  contentLeft: number,
  contentWidth: number,
  pageRef: { page: number }
): Promise<number> {
  const imagePaths = extractImagePaths(markdown);
  if (imagePaths.length === 0) return startY;

  let currentY = startY;
  const maxImageHeight = 60; // Maximum image height in mm
  const maxImageWidth = contentWidth;

  for (const imagePath of imagePaths) {
    const dataUrl = await loadImageAsBase64(imagePath);
    if (!dataUrl) continue;

    try {
      // Get image dimensions
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Calculate scaled dimensions to fit within bounds
      let imgWidth = img.width;
      let imgHeight = img.height;

      // Convert pixels to mm (assuming 96 DPI)
      const pxToMm = 0.264583;
      imgWidth *= pxToMm;
      imgHeight *= pxToMm;

      // Scale to fit within max dimensions
      if (imgWidth > maxImageWidth) {
        const scale = maxImageWidth / imgWidth;
        imgWidth = maxImageWidth;
        imgHeight *= scale;
      }
      if (imgHeight > maxImageHeight) {
        const scale = maxImageHeight / imgHeight;
        imgHeight = maxImageHeight;
        imgWidth *= scale;
      }

      // Check if we need a new page
      if (currentY + imgHeight > 270) {
        doc.addPage();
        pageRef.page++;
        currentY = 20;
      }

      // Determine format (jsPDF only supports JPEG, PNG, WEBP)
      const ext = imagePath.split('.').pop()?.toLowerCase() || 'png';
      const format = ext === 'jpg' ? 'JPEG' : ext.toUpperCase();

      // Add the image
      doc.addImage(dataUrl, format, contentLeft, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 3; // Add some spacing after image
    } catch (error) {
      console.error(`[PDF Export] Failed to add image to PDF: ${imagePath}`, error);
    }
  }

  return currentY;
}

/**
 * Sort artifacts by their numeric ID suffix (e.g., REQ-001, REQ-002)
 * Extracts the number from IDs like "REQ-001", "UC-002", "TC-003", "INFO-004"
 */
function sortByIdNumber<T extends { id: string }>(artifacts: T[]): T[] {
  return [...artifacts].sort((a, b) => {
    const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });
}

// Main export function
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
  currentUserName?: string
): Promise<void> {
  // 0. Request File Handle FIRST (to ensure user activation is valid)
  let fileHandle: any = null;
  const baselineSuffix = selectedBaseline ? selectedBaseline.name : 'Current State';
  const defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')} - ${baselineSuffix.replace(/[^a-z0-9]/gi, '_')}.pdf`;

  try {
    if ('showSaveFilePicker' in window) {
      fileHandle = await (window as any).showSaveFilePicker({
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
    console.log('Save dialog cancelled or not supported, will fallback to download');
    // If user cancelled, we might want to stop?
    // But usually we just let it fall back or stop.
    // If it was a cancel, error.name === 'AbortError'
    if ((error as any).name === 'AbortError') {
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
  // Each artifact type adds 1 section header + entries per artifact
  // We estimate links count here - will be fetched later, assume average of 20 if we have artifacts
  const hasArtifacts =
    projectRequirementIds.length > 0 ||
    projectUseCaseIds.length > 0 ||
    projectTestCaseIds.length > 0 ||
    projectInformationIds.length > 0;
  const estimatedLinksCount = hasArtifacts ? 30 : 0; // Conservative estimate
  const estimatedRisksCount = (globalState.risks || []).filter(
    (r: Risk) => project.riskIds?.includes(r.id) && !r.isDeleted
  ).length;

  const estimatedTocEntries =
    (projectRequirementIds.length > 0 ? 1 + projectRequirementIds.length : 0) +
    (projectUseCaseIds.length > 0 ? 1 + projectUseCaseIds.length : 0) +
    (projectTestCaseIds.length > 0 ? 1 + projectTestCaseIds.length : 0) +
    (projectInformationIds.length > 0 ? 1 + projectInformationIds.length : 0) +
    (estimatedRisksCount > 0 ? 1 + estimatedRisksCount : 0) + // Risks section + individual risks
    (estimatedLinksCount > 0 ? 1 + estimatedLinksCount : 0) + // Links section + individual links
    1; // Revision history if present

  const tocPagesNeeded = calculateTocPages(estimatedTocEntries);
  const tocStartPage = currentPage;

  // Reserve ToC pages
  for (let i = 0; i < tocPagesNeeded; i++) {
    doc.addPage();
    currentPage++;
  }

  // 3. Fetch git commit history since last baseline
  // Sort all artifacts by their numeric ID suffix for consistent ordering
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

  // Get last baseline commit hash to filter commits
  // When exporting a specific baseline, we want commits BETWEEN that baseline and the previous one
  // When exporting current state (selectedBaseline = null), we want commits since the most recent baseline
  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);

  let previousBaseline: ProjectBaseline | null = null;
  let upperBoundTimestamp: number | null = null; // Upper bound for commit timestamps

  if (selectedBaseline) {
    // Exporting a specific baseline - find the baseline BEFORE it
    const selectedIndex = sortedBaselines.findIndex((b) => b.id === selectedBaseline.id);
    if (selectedIndex >= 0 && selectedIndex < sortedBaselines.length - 1) {
      // There's a baseline before the selected one
      previousBaseline = sortedBaselines[selectedIndex + 1];
    }
    // Upper bound is the selected baseline's timestamp
    upperBoundTimestamp = selectedBaseline.timestamp;
  } else {
    // Exporting current state - show commits since the most recent baseline
    previousBaseline = sortedBaselines.length > 0 ? sortedBaselines[0] : null;
    // No upper bound - include all commits up to now
    upperBoundTimestamp = null;
  }

  // Fetch commit history for all artifacts since last baseline
  interface ArtifactCommitLocal {
    artifactId: string;
    artifactTitle: string;
    artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
    commits: CommitInfo[];
    isNew?: boolean;
  }

  interface RemovedArtifactLocal {
    artifactId: string;
    artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
  }

  const artifactCommits: ArtifactCommitLocal[] = [];
  const removedArtifacts: RemovedArtifactLocal[] = [];

  // We'll detect "new" artifacts by checking if their oldest commit is after the previous baseline
  // For removed artifacts, we would need to know what was in the previous baseline - skip for now

  // Fetch commits for each artifact type
  // Filter function to get commits between previousBaseline and selectedBaseline (or now)
  const filterCommits = (history: CommitInfo[]): CommitInfo[] => {
    // If exporting a specific baseline (upperBoundTimestamp set) but no previous baseline,
    // this is the first baseline - no revision history to show
    if (upperBoundTimestamp && !previousBaseline) {
      return [];
    }

    return history.filter((commit) => {
      // Lower bound: must be after previous baseline (if exists)
      const afterPrevious = previousBaseline ? commit.timestamp > previousBaseline.timestamp : true;
      // Upper bound: must be at or before selected baseline (if exists)
      const beforeUpper = upperBoundTimestamp ? commit.timestamp <= upperBoundTimestamp : true;
      return afterPrevious && beforeUpper;
    });
  };

  // Helper to check if artifact was created after the previous baseline
  const isArtifactNew = (fullHistory: CommitInfo[]): boolean => {
    if (!previousBaseline || fullHistory.length === 0) return false;
    // Find the oldest commit (first commit for this artifact)
    const oldestCommit = fullHistory.reduce((oldest, commit) =>
      commit.timestamp < oldest.timestamp ? commit : oldest
    );
    // If the oldest commit is after the previous baseline, it's new
    return oldestCommit.timestamp > previousBaseline.timestamp;
  };

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

  // 4. Revision History (NEW POSITION - after TOC)
  // ONLY show revision history if there's a previous baseline to compare against
  // If no previous baseline exists, there's nothing to compare - skip entirely
  if (previousBaseline && (artifactCommits.length > 0 || removedArtifacts.length > 0)) {
    doc.addPage();
    tocEntries.push({ title: 'Revision History', page: currentPage, level: 0 });
    addRevisionHistory(doc, artifactCommits, removedArtifacts);
    currentPage++;
  }

  // 5. Requirements Section
  if (projectRequirements.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Requirements', page: currentPage, level: 0 });
    currentPage = await addRequirementsSection(doc, projectRequirements, currentPage, tocEntries);
  }

  // 6. Use Cases Section
  if (projectUseCases.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Use Cases', page: currentPage, level: 0 });
    currentPage = await addUseCasesSection(doc, projectUseCases, currentPage, tocEntries);
  }

  // 7. Test Cases Section
  if (projectTestCases.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Test Cases', page: currentPage, level: 0 });
    currentPage = await addTestCasesSection(doc, projectTestCases, currentPage, tocEntries);
  }

  // 8. Information Section
  if (projectInformation.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Information', page: currentPage, level: 0 });
    currentPage = await addInformationSection(doc, projectInformation, currentPage, tocEntries);
  }

  // 9. Risks Section - filter from globalState if provided
  const projectRisks = sortByIdNumber(
    (globalState.risks || []).filter((r: Risk) => project.riskIds?.includes(r.id) && !r.isDeleted)
  );
  if (projectRisks.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Risks', page: currentPage, level: 0 });
    currentPage = addRisksSection(doc, projectRisks, currentPage, tocEntries);
  }

  // 10. Links Section - fetch from diskLinkService
  const projectLinks = await diskLinkService.getLinksForProject(project.id);
  if (projectLinks.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Links', page: currentPage, level: 0 });
    currentPage = addLinksSection(doc, projectLinks, currentPage, tocEntries);
  }

  // Add TOC (go back to reserved ToC pages and render)
  addTableOfContents(doc, tocEntries, tocStartPage, tocPagesNeeded);

  // Add page numbers to all pages
  addPageNumbers(doc);

  // Save with file dialog
  if (fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      const pdfBlob = doc.output('blob');
      await writable.write(pdfBlob);
      await writable.close();
    } catch (err) {
      console.error('Error writing to file:', err);
      doc.save(defaultFilename);
    }
  } else {
    // Fallback
    doc.save(defaultFilename);
  }
}

// Cover Page
function addCoverPage(
  doc: jsPDF,
  project: Project,
  selectedBaseline: ProjectBaseline | null,
  currentUserName?: string
): void {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, pageWidth / 2, 60, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Requirements Management Export', pageWidth / 2, 75, { align: 'center' });

  // Description
  if (project.description) {
    doc.setFontSize(11);
    const descLines = doc.splitTextToSize(project.description, pageWidth - 40);
    doc.text(descLines, pageWidth / 2, 95, { align: 'center', maxWidth: pageWidth - 40 });
  }

  // Export date
  doc.setFontSize(10);
  doc.text(`Export Date: ${formatDate(Date.now())}`, pageWidth / 2, 140, { align: 'center' });

  // Baseline or Current State info
  doc.setFont('helvetica', 'bold');
  if (selectedBaseline) {
    doc.text(
      `Baseline: ${selectedBaseline.name} (v${selectedBaseline.version})`,
      pageWidth / 2,
      155,
      { align: 'center' }
    );
  } else {
    doc.text('Current State', pageWidth / 2, 155, { align: 'center' });
  }

  // Exported By
  if (currentUserName) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported by: ${currentUserName}`, pageWidth / 2, 170, { align: 'center' });
  }
}

// Table of Contents
// NOTE: This function must be called AFTER all content pages are generated,
// and we go back to page 2 to render it. To handle overflow, we use multiple
// reserved ToC pages calculated upfront.
function addTableOfContents(
  doc: jsPDF,
  entries: TOCEntry[],
  tocStartPage: number,
  tocPagesReserved: number
): void {
  let currentTocPage = 0;
  doc.setPage(tocStartPage);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', 20, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  let yPos = 35;
  entries.forEach((entry) => {
    if (yPos > 270) {
      currentTocPage++;
      if (currentTocPage < tocPagesReserved) {
        doc.setPage(tocStartPage + currentTocPage);
      }
      yPos = 20;
    }

    const indent = entry.level * 10;
    const fontSize = entry.level === 0 ? 12 : 10;
    const fontStyle = entry.level === 0 ? 'bold' : 'normal';

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);

    // Truncate title if too long
    let title = entry.title;
    const maxWidth = 150 - indent;
    if (doc.getTextWidth(title) > maxWidth) {
      // Simple truncation
      while (doc.getTextWidth(title + '...') > maxWidth && title.length > 0) {
        title = title.substring(0, title.length - 1);
      }
      title += '...';
    }

    doc.text(title, 25 + indent, yPos);

    // Dotted line leader
    const titleWidth = doc.getTextWidth(title);
    // Adjust page number to account for reserved ToC pages
    const adjustedPageNum = entry.page + (tocPagesReserved - 1);
    const pageText = String(adjustedPageNum);
    const pageWidth = doc.getTextWidth(pageText);
    const dotsStart = 25 + indent + titleWidth + 2;
    const dotsEnd = 180 - pageWidth - 2;

    if (dotsEnd > dotsStart) {
      doc.setFontSize(10);
      doc.text('.'.repeat(Math.floor((dotsEnd - dotsStart) / 2)), dotsStart, yPos);
    }

    doc.setFontSize(fontSize);
    doc.text(pageText, 180, yPos, { align: 'right' });
    yPos += entry.level === 0 ? 8 : 6;
  });
}

/**
 * Calculate how many pages the ToC will need based on entry count
 */
function calculateTocPages(entryCount: number): number {
  // Approximately 30 entries per page (level 0 takes 8pt spacing, level 1 takes 6pt)
  // Usable height per page is about 250mm (35mm start to 270mm end)
  // Average spacing is ~7pt, so roughly 35 entries per page
  const entriesPerPage = 30;
  return Math.max(1, Math.ceil(entryCount / entriesPerPage));
}

// Requirements Section
async function addRequirementsSection(
  doc: jsPDF,
  requirements: Requirement[],
  startPage: number,
  tocEntries: TOCEntry[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Requirements', 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const req of requirements) {
    // Check if we need a new page (need ~60mm minimum for header + some content)
    if (yPos > 230) {
      doc.addPage();
      page++;
      yPos = 20;
    }

    const boxLeft = 15;
    const boxWidth = 180;
    let boxTop = yPos;
    let currentY = boxTop;

    // Draw outer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Header section with shaded background
    const headerHeight = 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

    // Requirement ID and Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const title = `${req.id} - ${req.title}`;
    doc.text(title, boxLeft + 3, currentY + 7);

    // Revision (right-aligned)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const revText = `Rev: ${req.revision || '01'}`;
    doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

    // Add to TOC
    tocEntries.push({ title: `${req.id} - ${req.title}`, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Status | Priority | Author)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const metadataText = `Status: ${req.status}  |  Priority: ${req.priority}  |  Author: ${req.author || 'N/A'}`;
    doc.text(metadataText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Content sections
    const contentLeft = boxLeft + 3;
    const contentWidth = boxWidth - 6;
    currentY += 3;

    // Description
    if (req.description) {
      if (currentY > 260) {
        // Close current box and start new page
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20; // Update boxTop for new page
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(req.description, contentWidth);
      doc.text(descLines, contentLeft, currentY);
      currentY += descLines.length * 4 + 3;

      // Add embedded images from description
      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        req.description,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Requirement Text
    if (req.text) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20; // Update boxTop for new page
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Requirement Text:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const textLines = doc.splitTextToSize(req.text, contentWidth);
      doc.text(textLines, contentLeft, currentY);
      currentY += textLines.length * 4 + 3;

      // Add embedded images from text
      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        req.text,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Rationale
    if (req.rationale) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20; // Update boxTop for new page
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Rationale:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const rationaleLines = doc.splitTextToSize(req.rationale, contentWidth);
      doc.text(rationaleLines, contentLeft, currentY);
      currentY += rationaleLines.length * 4 + 3;

      // Add embedded images from rationale
      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        req.rationale,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Comments
    if (req.comments) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20; // Update boxTop for new page
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Comments:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const commentsLines = doc.splitTextToSize(req.comments, contentWidth);
      doc.text(commentsLines, contentLeft, currentY);
      currentY += commentsLines.length * 4 + 3;

      // Add embedded images from comments
      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        req.comments,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Footer metadata bar
    currentY += 1;
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Verification: ${req.verificationMethod || 'N/A'}  |  Created: ${formatDate(req.dateCreated)}  |  Modified: ${formatDate(req.lastModified)}  |  Approved: ${req.approvalDate ? formatDate(req.approvalDate) : 'N/A'}`;
    doc.text(footerText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Draw final box border
    doc.setDrawColor(200, 200, 200);
    doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

    yPos = currentY + 5; // Space between requirements
  }

  return page;
}

// Use Cases Section
async function addUseCasesSection(
  doc: jsPDF,
  useCases: UseCase[],
  startPage: number,
  tocEntries: TOCEntry[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Use Cases', 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const useCase of useCases) {
    // Check if we need a new page (need ~60mm minimum for header + some content)
    if (yPos > 230) {
      doc.addPage();
      page++;
      yPos = 20;
    }

    const boxLeft = 15;
    const boxWidth = 180;
    let boxTop = yPos;
    let currentY = boxTop;

    // Draw outer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Header section with shaded background
    const headerHeight = 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

    // Use Case ID and Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const title = `${useCase.id} - ${useCase.title}`;
    doc.text(title, boxLeft + 3, currentY + 7);

    // Revision (right-aligned)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const revText = `Rev: ${useCase.revision || '01'}`;
    doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

    // Add to TOC
    tocEntries.push({ title: title, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Status | Priority | Actor)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const metadataText = `Status: ${useCase.status}  |  Priority: ${useCase.priority}  |  Actor: ${useCase.actor || 'N/A'}`;
    doc.text(metadataText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Content sections
    const contentLeft = boxLeft + 3;
    const contentWidth = boxWidth - 6;
    currentY += 3;

    // Description
    if (useCase.description) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(useCase.description, contentWidth);
      doc.text(descLines, contentLeft, currentY);
      currentY += descLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        useCase.description,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Preconditions
    if (useCase.preconditions) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Preconditions:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const preLines = doc.splitTextToSize(useCase.preconditions, contentWidth);
      doc.text(preLines, contentLeft, currentY);
      currentY += preLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        useCase.preconditions,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Main Flow
    if (useCase.mainFlow) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Main Flow:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const flowLines = doc.splitTextToSize(useCase.mainFlow, contentWidth);
      doc.text(flowLines, contentLeft, currentY);
      currentY += flowLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        useCase.mainFlow,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Alternative Flows
    if (useCase.alternativeFlows) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Alternative Flows:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const altLines = doc.splitTextToSize(useCase.alternativeFlows, contentWidth);
      doc.text(altLines, contentLeft, currentY);
      currentY += altLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        useCase.alternativeFlows,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Postconditions
    if (useCase.postconditions) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Postconditions:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const postLines = doc.splitTextToSize(useCase.postconditions, contentWidth);
      doc.text(postLines, contentLeft, currentY);
      currentY += postLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        useCase.postconditions,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Footer metadata bar (Dates)
    currentY += 1;
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Modified: ${formatDate(useCase.lastModified)}`;
    doc.text(footerText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Draw final box border
    doc.setDrawColor(200, 200, 200);
    doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

    yPos = currentY + 5;
  }

  return page;
}

// Test Cases Section
async function addTestCasesSection(
  doc: jsPDF,
  testCases: TestCase[],
  startPage: number,
  tocEntries: TOCEntry[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Cases', 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const testCase of testCases) {
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      page++;
      yPos = 20;
    }

    const boxLeft = 15;
    const boxWidth = 180;
    let boxTop = yPos;
    let currentY = boxTop;

    // Draw outer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Header section with shaded background
    const headerHeight = 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

    // Test Case ID and Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const title = `${testCase.id} - ${testCase.title}`;
    doc.text(title, boxLeft + 3, currentY + 7);

    // Revision (right-aligned)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const revText = `Rev: ${testCase.revision || '01'}`;
    doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

    // Add to TOC
    tocEntries.push({ title: title, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Status | Priority | Author)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const metadataText = `Status: ${testCase.status}  |  Priority: ${testCase.priority}  |  Author: ${testCase.author || 'N/A'}`;
    doc.text(metadataText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Content sections
    const contentLeft = boxLeft + 3;
    const contentWidth = boxWidth - 6;
    currentY += 3;

    // Description
    if (testCase.description) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(testCase.description, contentWidth);
      doc.text(descLines, contentLeft, currentY);
      currentY += descLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        testCase.description,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Tests Requirements (traceability)
    if (testCase.requirementIds && testCase.requirementIds.length > 0) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Tests Requirements:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(testCase.requirementIds.join(', '), contentLeft, currentY);
      currentY += 7;
    }

    // Footer metadata bar (Dates)
    currentY += 1;
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Created: ${formatDate(testCase.dateCreated)}  |  Modified: ${formatDate(testCase.lastModified)}  |  Last Run: ${testCase.lastRun ? formatDate(testCase.lastRun) : 'Never'}`;
    doc.text(footerText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Draw final box border
    doc.setDrawColor(200, 200, 200);
    doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

    yPos = currentY + 5;
  }

  return page;
}

// Information Section
async function addInformationSection(
  doc: jsPDF,
  information: Information[],
  startPage: number,
  tocEntries: TOCEntry[]
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Information', 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const info of information) {
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      page++;
      yPos = 20;
    }

    const boxLeft = 15;
    const boxWidth = 180;
    let boxTop = yPos;
    let currentY = boxTop;

    // Draw outer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Header section with shaded background
    const headerHeight = 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

    // Information ID and Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const title = `${info.id} - ${info.title}`;
    doc.text(title, boxLeft + 3, currentY + 7);

    // Add to TOC
    tocEntries.push({ title: title, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Type)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const typeStr = info.type.charAt(0).toUpperCase() + info.type.slice(1);
    const metadataText = `Type: ${typeStr}`;
    doc.text(metadataText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Content sections
    const contentLeft = boxLeft + 3;
    const contentWidth = boxWidth - 6;
    currentY += 3;

    // Content
    if (info.content) {
      if (currentY > 260) {
        doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);
        doc.addPage();
        page++;
        currentY = 20;
        boxTop = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const contentLines = doc.splitTextToSize(info.content, contentWidth);
      doc.text(contentLines, contentLeft, currentY);
      currentY += contentLines.length * 4 + 3;

      const pageRef = { page };
      currentY = await addImagesFromMarkdown(
        doc,
        info.content,
        currentY,
        contentLeft,
        contentWidth,
        pageRef
      );
      page = pageRef.page;
    }

    // Footer metadata bar (Dates)
    currentY += 1;
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Created: ${formatDate(info.dateCreated)}  |  Modified: ${formatDate(info.lastModified)}`;
    doc.text(footerText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Draw final box border
    doc.setDrawColor(200, 200, 200);
    doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

    yPos = currentY + 5;
  }

  return page;
}

// Revision History
interface ArtifactCommit {
  artifactId: string;
  artifactTitle: string;
  artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
  commits: CommitInfo[];
  isNew?: boolean; // Added since last baseline
}

interface RemovedArtifact {
  artifactId: string;
  artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
}

function addRevisionHistory(
  doc: jsPDF,
  artifactCommits: ArtifactCommit[],
  removedArtifacts: RemovedArtifact[]
): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Revision History', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Changes since last baseline', 20, 30);

  const rows: any[] = [];

  // Helper to get human-readable type name
  const getTypeName = (type: string): string => {
    switch (type) {
      case 'requirement':
        return 'Requirement';
      case 'usecase':
        return 'Use case';
      case 'testcase':
        return 'Test case';
      case 'information':
        return 'Information';
      default:
        return type;
    }
  };

  // Add removed artifacts first (most important to highlight)
  removedArtifacts.forEach((removed) => {
    rows.push([
      '-', // No date for removed items
      removed.artifactId,
      '-', // No title available
      `${getTypeName(removed.artifactType)} removed`,
      '-',
    ]);
  });

  // Group commits by artifact
  artifactCommits.forEach((ac) => {
    if (ac.isNew) {
      // New artifact - show "added" message
      rows.push([
        formatDate(ac.commits[0]?.timestamp || Date.now()),
        ac.artifactId,
        ac.artifactTitle,
        `${getTypeName(ac.artifactType)} added`,
        ac.commits[0]?.author || '-',
      ]);
    } else if (ac.commits.length === 1) {
      // Single commit - show message directly
      rows.push([
        formatDate(ac.commits[0].timestamp),
        ac.artifactId,
        ac.artifactTitle,
        ac.commits[0].message,
        ac.commits[0].author,
      ]);
    } else if (ac.commits.length > 1) {
      // Multiple commits - format as bulleted list (newest first)
      const sortedCommits = [...ac.commits].sort((a, b) => b.timestamp - a.timestamp);
      const bulletList = sortedCommits.map((c) => `• ${c.message}`).join('\n');
      rows.push([
        formatDate(sortedCommits[0].timestamp),
        ac.artifactId,
        ac.artifactTitle,
        bulletList,
        sortedCommits[0].author,
      ]);
    }
  });

  // If no changes, show message
  if (rows.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('No changes since last baseline.', 20, 45);
    return;
  }

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'ID', 'Name', 'Changes', 'Author']],
    body: rows,
    theme: 'plain',
    margin: { left: 20 },
    tableWidth: 170,
    styles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Date
      1: { cellWidth: 20 }, // ID
      2: { cellWidth: 35 }, // Name
      3: { cellWidth: 68 }, // Changes
      4: { cellWidth: 25 }, // Author
    },
  });
}

// Add page numbers
function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
}

// Links Section
function addLinksSection(
  doc: jsPDF,
  links: Link[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Links', 20, 20);

  let page = startPage;

  // Sort links by ID
  const sortedLinks = [...links].sort((a, b) => {
    const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });

  // Add each link to ToC
  for (const link of sortedLinks) {
    const linkLabel = `${link.id}: ${link.sourceId} -> ${link.targetId}`;
    tocEntries.push({ title: linkLabel, page: page, level: 1 });
  }

  // Create table data
  const tableData = sortedLinks.map((link) => [
    link.id,
    link.sourceId,
    LINK_TYPE_LABELS[link.type] || link.type,
    link.targetId,
    link.projectIds.length === 0 ? 'Global' : 'Project',
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Link ID', 'Source', 'Type', 'Target', 'Scope']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [100, 100, 100],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
    },
    didDrawPage: () => {
      page++;
    },
  });

  return page;
}

// Risks Section
function addRisksSection(
  doc: jsPDF,
  risks: Risk[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risks', 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const risk of risks) {
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      page++;
      yPos = 20;
    }

    const boxLeft = 15;
    const boxWidth = 180;
    const boxTop = yPos;
    let currentY = boxTop;

    // Draw outer box border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Header section with shaded background
    const headerHeight = 10;
    doc.setFillColor(255, 235, 235); // Light red for risks
    doc.rect(boxLeft, currentY, boxWidth, headerHeight, 'FD');

    // Risk ID and Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const title = `${risk.id} - ${risk.title}`;
    doc.text(title, boxLeft + 3, currentY + 7);

    // Revision (right-aligned)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const revText = `Rev: ${risk.revision || '01'}`;
    doc.text(revText, boxLeft + boxWidth - 3, currentY + 7, { align: 'right' });

    // Add to TOC
    tocEntries.push({ title: `${risk.id} - ${risk.title}`, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Category | Probability | Impact | Status)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const capitalizeWord = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const metadataText = `Category: ${capitalizeWord(risk.category)}  |  Probability: ${capitalizeWord(risk.probability)}  |  Impact: ${capitalizeWord(risk.impact)}  |  Status: ${capitalizeWord(risk.status)}`;
    doc.text(metadataText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Content sections
    const contentLeft = boxLeft + 3;
    const contentWidth = boxWidth - 6;
    currentY += 3;

    // Description
    if (risk.description) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(risk.description, contentWidth);
      doc.text(descLines, contentLeft, currentY);
      currentY += descLines.length * 4 + 3;
    }

    // Mitigation
    if (risk.mitigation) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Mitigation Strategy:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const mitigationLines = doc.splitTextToSize(risk.mitigation, contentWidth);
      doc.text(mitigationLines, contentLeft, currentY);
      currentY += mitigationLines.length * 4 + 3;
    }

    // Contingency
    if (risk.contingency) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Contingency Plan:', contentLeft, currentY);
      currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const contingencyLines = doc.splitTextToSize(risk.contingency, contentWidth);
      doc.text(contingencyLines, contentLeft, currentY);
      currentY += contingencyLines.length * 4 + 3;
    }

    // Footer metadata bar
    currentY += 1;
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const footerText = `Owner: ${risk.owner || 'N/A'}  |  Created: ${formatDate(risk.dateCreated)}  |  Modified: ${formatDate(risk.lastModified)}`;
    doc.text(footerText, boxLeft + 3, currentY + 4);
    currentY += 6;

    // Draw final box border
    doc.setDrawColor(200, 200, 200);
    doc.rect(boxLeft, boxTop, boxWidth, currentY - boxTop);

    yPos = currentY + 5; // Space between risks
  }

  return page;
}
