import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  Requirement,
  UseCase,
  TestCase,
  Information,
  Project,
  ProjectBaseline,
} from '../types';
import { formatDate } from './dateUtils';
import { realGitService } from '../services/realGitService';
import type { CommitInfo } from '../types';

// Additional types
interface TOCEntry {
  title: string;
  page: number;
  level: number;
}

// Main export function
export async function exportProjectToPDF(
  project: Project,
  globalState: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
  },
  projectRequirementIds: string[],
  projectUseCaseIds: string[],
  projectTestCaseIds: string[],
  projectInformationIds: string[],
  baselines: ProjectBaseline[]
): Promise<void> {
  // 0. Request File Handle FIRST (to ensure user activation is valid)
  let fileHandle: any = null;
  const defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-export.pdf`;

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
  addCoverPage(doc, project);
  currentPage++;

  // 2. Table of Contents (placeholder, will update after)
  doc.addPage();
  const tocPage = currentPage;
  currentPage++;

  // 3. Fetch git commit history since last baseline
  const projectRequirements = globalState.requirements.filter(
    (r) => projectRequirementIds.includes(r.id) && !r.isDeleted
  );
  const projectUseCases = globalState.useCases.filter(
    (u) => projectUseCaseIds.includes(u.id) && !u.isDeleted
  );
  const projectTestCases = globalState.testCases.filter(
    (t) => projectTestCaseIds.includes(t.id) && !t.isDeleted
  );
  const projectInformation = globalState.information.filter(
    (i) => projectInformationIds.includes(i.id) && !i.isDeleted
  );

  // Get last baseline commit hash to filter commits
  const sortedBaselines = [...baselines].sort((a, b) => b.timestamp - a.timestamp);
  const lastBaseline = sortedBaselines.length > 0 ? sortedBaselines[0] : null;

  // Fetch commit history for all artifacts since last baseline
  interface ArtifactCommit {
    artifactId: string;
    artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
    commits: CommitInfo[];
  }

  const artifactCommits: ArtifactCommit[] = [];

  // Fetch commits for each artifact type
  for (const req of projectRequirements) {
    try {
      const history = await realGitService.getHistory(`requirements/${req.id}.json`);
      // Filter commits after last baseline
      const filteredHistory = lastBaseline
        ? history.filter((commit) => commit.timestamp > lastBaseline.timestamp)
        : history;
      if (filteredHistory.length > 0) {
        artifactCommits.push({
          artifactId: req.id,
          artifactType: 'requirement',
          commits: filteredHistory,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const uc of projectUseCases) {
    try {
      const history = await realGitService.getHistory(`usecases/${uc.id}.json`);
      const filteredHistory = lastBaseline
        ? history.filter((commit) => commit.timestamp > lastBaseline.timestamp)
        : history;
      if (filteredHistory.length > 0) {
        artifactCommits.push({
          artifactId: uc.id,
          artifactType: 'usecase',
          commits: filteredHistory,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const tc of projectTestCases) {
    try {
      const history = await realGitService.getHistory(`testcases/${tc.id}.json`);
      const filteredHistory = lastBaseline
        ? history.filter((commit) => commit.timestamp > lastBaseline.timestamp)
        : history;
      if (filteredHistory.length > 0) {
        artifactCommits.push({
          artifactId: tc.id,
          artifactType: 'testcase',
          commits: filteredHistory,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  for (const info of projectInformation) {
    try {
      const history = await realGitService.getHistory(`information/${info.id}.json`);
      const filteredHistory = lastBaseline
        ? history.filter((commit) => commit.timestamp > lastBaseline.timestamp)
        : history;
      if (filteredHistory.length > 0) {
        artifactCommits.push({
          artifactId: info.id,
          artifactType: 'information',
          commits: filteredHistory,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 4. Revision History (NEW POSITION - after TOC)
  if (artifactCommits.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Revision History', page: currentPage, level: 0 });
    addRevisionHistory(doc, artifactCommits);
    currentPage++;
  }

  // 5. Requirements Section
  if (projectRequirements.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Requirements', page: currentPage, level: 0 });
    currentPage = addRequirementsSection(doc, projectRequirements, currentPage, tocEntries);
  }

  // 6. Use Cases Section
  if (projectUseCases.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Use Cases', page: currentPage, level: 0 });
    currentPage = addUseCasesSection(doc, projectUseCases, currentPage, tocEntries);
  }

  // 7. Test Cases Section
  if (projectTestCases.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Test Cases', page: currentPage, level: 0 });
    currentPage = addTestCasesSection(doc, projectTestCases, currentPage, tocEntries);
  }

  // 8. Information Section
  if (projectInformation.length > 0) {
    doc.addPage();
    tocEntries.push({ title: 'Information', page: currentPage, level: 0 });
    currentPage = addInformationSection(doc, projectInformation, currentPage, tocEntries);
  }

  // Add TOC (go back to page 2)
  doc.setPage(tocPage);
  addTableOfContents(doc, tocEntries);

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
function addCoverPage(doc: jsPDF, project: Project): void {
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

  // Baseline info if available
  if (project.currentBaseline) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Baseline: ${project.currentBaseline}`, pageWidth / 2, 155, { align: 'center' });
  }
}

// Table of Contents
function addTableOfContents(doc: jsPDF, entries: TOCEntry[]): void {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', 20, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  let yPos = 35;
  entries.forEach((entry) => {
    if (yPos > 270) {
      doc.addPage();
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
    const pageText = String(entry.page);
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

// Requirements Section
function addRequirementsSection(
  doc: jsPDF,
  requirements: Requirement[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Requirements', 20, 20);

  let yPos = 30;
  let page = startPage;

  requirements.forEach((req) => {
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
  });

  return page;
}

// Use Cases Section
function addUseCasesSection(
  doc: jsPDF,
  useCases: UseCase[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Use Cases', 20, 20);

  let yPos = 30;
  let page = startPage;

  useCases.forEach((useCase) => {
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
  });

  return page;
}

// Test Cases Section
function addTestCasesSection(
  doc: jsPDF,
  testCases: TestCase[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Test Cases', 20, 20);

  let yPos = 30;
  let page = startPage;

  testCases.forEach((testCase) => {
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
  });

  return page;
}

// Information Section
function addInformationSection(
  doc: jsPDF,
  information: Information[],
  startPage: number,
  tocEntries: TOCEntry[]
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Information', 20, 20);

  let yPos = 30;
  let page = startPage;

  information.forEach((info) => {
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
      // doc.setFontSize(9);
      // doc.setFont('helvetica', 'bold');
      // doc.text('Content:', contentLeft, currentY);
      // currentY += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const contentLines = doc.splitTextToSize(info.content, contentWidth);
      doc.text(contentLines, contentLeft, currentY);
      currentY += contentLines.length * 4 + 3;
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
  });

  return page;
}

// Revision History
interface ArtifactCommit {
  artifactId: string;
  artifactType: 'requirement' | 'usecase' | 'testcase' | 'information';
  commits: CommitInfo[];
}

function addRevisionHistory(doc: jsPDF, artifactCommits: ArtifactCommit[]): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Revision History', 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Changes since last baseline', 20, 30);

  const rows: any[] = [];

  // Flatten all commits from all artifacts
  const allCommits: Array<{ artifactId: string; artifactType: string; commit: CommitInfo }> = [];

  artifactCommits.forEach((ac) => {
    ac.commits.forEach((commit) => {
      allCommits.push({
        artifactId: ac.artifactId,
        artifactType: ac.artifactType,
        commit,
      });
    });
  });

  // Sort by timestamp (newest first)
  allCommits.sort((a, b) => b.commit.timestamp - a.commit.timestamp);

  // Build table rows
  allCommits.forEach((item) => {
    rows.push([
      formatDate(item.commit.timestamp),
      item.artifactId,
      item.commit.message,
      item.commit.author,
    ]);
  });

  // If no commits, show message
  if (rows.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('No changes since last baseline.', 20, 45);
    return;
  }

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Artifact', 'Message', 'Author']],
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
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 25 }, // Artifact ID
      2: { cellWidth: 90 }, // Message (wider)
      3: { cellWidth: 30 }, // Author
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
