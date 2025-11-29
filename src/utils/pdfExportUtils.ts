import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Requirement, UseCase, TestCase, Information, Project } from '../types';

// Additional types
interface TOCEntry {
    title: string;
    page: number;
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
    projectInformationIds: string[]
): Promise<void> {
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

    // 3. Requirements Section
    const projectRequirements = globalState.requirements.filter(r =>
        projectRequirementIds.includes(r.id)
    );
    if (projectRequirements.length > 0) {
        doc.addPage();
        tocEntries.push({ title: 'Requirements', page: currentPage });
        currentPage = addRequirementsSection(doc, projectRequirements, currentPage);
    }

    // 4. Use Cases Section
    const projectUseCases = globalState.useCases.filter(u =>
        projectUseCaseIds.includes(u.id)
    );
    if (projectUseCases.length > 0) {
        doc.addPage();
        tocEntries.push({ title: 'Use Cases', page: currentPage });
        currentPage = addUseCasesSection(doc, projectUseCases, currentPage);
    }

    // 5. Test Cases Section
    const projectTestCases = globalState.testCases.filter(t =>
        projectTestCaseIds.includes(t.id)
    );
    if (projectTestCases.length > 0) {
        doc.addPage();
        tocEntries.push({ title: 'Test Cases', page: currentPage });
        currentPage = addTestCasesSection(doc, projectTestCases, currentPage);
    }

    // 6. Information Section
    const projectInformation = globalState.information.filter(i =>
        projectInformationIds.includes(i.id)
    );
    if (projectInformation.length > 0) {
        doc.addPage();
        tocEntries.push({ title: 'Information', page: currentPage });
        currentPage = addInformationSection(doc, projectInformation, currentPage);
    }

    // 7. Revision History
    if (projectRequirements.length > 0 || projectUseCases.length > 0 ||
        projectTestCases.length > 0 || projectInformation.length > 0) {
        doc.addPage();
        tocEntries.push({ title: 'Revision History', page: currentPage });
        addRevisionHistory(doc, {
            requirements: projectRequirements,
            useCases: projectUseCases,
            testCases: projectTestCases,
            information: projectInformation
        });
    }

    // Add TOC (go back to page 2)
    doc.setPage(tocPage);
    addTableOfContents(doc, tocEntries);

    // Add page numbers to all pages
    addPageNumbers(doc);

    // Save with file dialog
    const defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-export.pdf`;
    await savePDFWithDialog(doc, defaultFilename);
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
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 140, { align: 'center' });

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
    entries.forEach(entry => {
        doc.text(entry.title, 25, yPos);
        doc.text(String(entry.page), 180, yPos, { align: 'right' });
        yPos += 8;
    });
}

// Requirements Section
function addRequirementsSection(doc: jsPDF, requirements: Requirement[], startPage: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Requirements', 20, 20);

    let yPos = 30;
    let page = startPage;

    requirements.forEach((req) => {
        // Check if we need a new page
        if (yPos > 250) {
            doc.addPage();
            page++;
            yPos = 20;
        }

        // Requirement header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${req.id} - ${req.title}`, 20, yPos);
        yPos += 7;

        // Metadata table
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        autoTable(doc, {
            startY: yPos,
            head: [['Status', 'Priority', 'Revision', 'Baseline']],
            body: [[
                req.status,
                req.priority,
                req.revision || '01',
                '-' // Baseline info not directly on artifact
            ]],
            theme: 'grid',
            margin: { left: 20 },
            tableWidth: 170,
            styles: { fontSize: 8 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;

        // Requirement Text
        if (req.text) {
            doc.setFont('helvetica', 'bold');
            doc.text('Requirement Text:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const textLines = doc.splitTextToSize(req.text, 170);
            doc.text(textLines, 20, yPos);
            yPos += textLines.length * 5 + 3;
        }

        // Rationale
        if (req.rationale) {
            if (yPos > 250) {
                doc.addPage();
                page++;
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text('Rationale:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const rationaleLines = doc.splitTextToSize(req.rationale, 170);
            doc.text(rationaleLines, 20, yPos);
            yPos += rationaleLines.length * 5 + 3;
        }

        yPos += 5; // Space between requirements
    });

    return page;
}

// Use Cases Section
function addUseCasesSection(doc: jsPDF, useCases: UseCase[], startPage: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Use Cases', 20, 20);

    let yPos = 30;
    let page = startPage;

    useCases.forEach(useCase => {
        if (yPos > 250) {
            doc.addPage();
            page++;
            yPos = 20;
        }

        // Use Case header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${useCase.id} - ${useCase.title}`, 20, yPos);
        yPos += 7;

        // Metadata
        doc.setFontSize(9);
        autoTable(doc, {
            startY: yPos,
            head: [['Status', 'Priority', 'Actor', 'Revision']],
            body: [[
                useCase.status,
                useCase.priority,
                useCase.actor || '-',
                useCase.revision || '01'
            ]],
            theme: 'grid',
            margin: { left: 20 },
            tableWidth: 170,
            styles: { fontSize: 8 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;

        // Description
        if (useCase.description) {
            doc.setFont('helvetica', 'bold');
            doc.text('Description:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(useCase.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5 + 3;
        }

        // Main Flow
        if (useCase.mainFlow) {
            if (yPos > 240) {
                doc.addPage();
                page++;
                yPos = 20;
            }
            doc.setFont('helvetica', 'bold');
            doc.text('Main Flow:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const flowLines = doc.splitTextToSize(useCase.mainFlow, 170);
            doc.text(flowLines, 20, yPos);
            yPos += flowLines.length * 5 + 3;
        }

        yPos += 5;
    });

    return page;
}

// Test Cases Section
function addTestCasesSection(doc: jsPDF, testCases: TestCase[], startPage: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Cases', 20, 20);

    let yPos = 30;
    let page = startPage;

    testCases.forEach(testCase => {
        if (yPos > 250) {
            doc.addPage();
            page++;
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${testCase.id} - ${testCase.title}`, 20, yPos);
        yPos += 7;

        // Metadata
        doc.setFontSize(9);
        autoTable(doc, {
            startY: yPos,
            head: [['Status', 'Priority', 'Revision']],
            body: [[
                testCase.status,
                testCase.priority,
                testCase.revision || '01'
            ]],
            theme: 'grid',
            margin: { left: 20 },
            tableWidth: 170,
            styles: { fontSize: 8 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 5;

        // Description (full test details)
        if (testCase.description) {
            doc.setFont('helvetica', 'bold');
            doc.text('Description:', 20, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(testCase.description, 170);
            doc.text(descLines, 20, yPos);
            yPos += descLines.length * 5 + 3;
        }

        yPos += 5;
    });

    return page;
}

// Information Section
function addInformationSection(doc: jsPDF, information: Information[], startPage: number): number {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Information', 20, 20);

    let yPos = 30;
    let page = startPage;

    information.forEach(info => {
        if (yPos > 250) {
            doc.addPage();
            page++;
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${info.id} - ${info.title}`, 20, yPos);
        yPos += 7;

        // Content
        if (info.content) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const contentLines = doc.splitTextToSize(info.content, 170);
            doc.text(contentLines, 20, yPos);
            yPos += contentLines.length * 5 + 5;
        }
    });

    return page;
}

// Revision History
function addRevisionHistory(doc: jsPDF, artifacts: {
    requirements: Requirement[];
    useCases: UseCase[];
    testCases: TestCase[];
    information: Information[];
}): void {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Revision History', 20, 20);

    const rows: any[] = [];

    // Collect all revisions
    artifacts.requirements.forEach(r => {
        rows.push([r.id, 'Requirement', r.revision || '01', '-']);
    });
    artifacts.useCases.forEach(u => {
        rows.push([u.id, 'Use Case', u.revision || '01', '-']);
    });
    artifacts.testCases.forEach(t => {
        rows.push([t.id, 'Test Case', t.revision || '01', '-']);
    });
    artifacts.information.forEach(i => {
        rows.push([i.id, 'Information', i.revision || '01', '-']);
    });

    autoTable(doc, {
        startY: 30,
        head: [['ID', 'Type', 'Revision', 'Baseline']],
        body: rows,
        theme: 'grid',
        margin: { left: 20 },
        tableWidth: 170,
        styles: { fontSize: 9 }
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

// File save dialog
async function savePDFWithDialog(doc: jsPDF, defaultFilename: string): Promise<void> {
    try {
        // Try modern File System Access API
        if ('showSaveFilePicker' in window) {
            const handle = await (window as any).showSaveFilePicker({
                suggestedName: defaultFilename,
                types: [{
                    description: 'PDF Document',
                    accept: { 'application/pdf': ['.pdf'] }
                }]
            });

            const writable = await handle.createWritable();
            const pdfBlob = doc.output('blob');
            await writable.write(pdfBlob);
            await writable.close();
        } else {
            // Fallback for browsers that don't support showSaveFilePicker
            doc.save(defaultFilename);
        }
    } catch (error) {
        // User cancelled or error occurred, fallback to simple save
        console.log('Save dialog cancelled or not supported, using default save');
        doc.save(defaultFilename);
    }
}
