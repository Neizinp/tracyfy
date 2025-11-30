import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Requirement, UseCase, TestCase, Information, Project } from '../types';
import { formatDate } from './dateUtils';

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
    projectInformationIds: string[]
): Promise<void> {
    // 0. Request File Handle FIRST (to ensure user activation is valid)
    let fileHandle: any = null;
    const defaultFilename = `${project.name.replace(/[^a-z0-9]/gi, '_')}-export.pdf`;

    try {
        if ('showSaveFilePicker' in window) {
            fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: defaultFilename,
                types: [{
                    description: 'PDF Document',
                    accept: { 'application/pdf': ['.pdf'] }
                }]
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

    // 3. Requirements Section
    const projectRequirements = globalState.requirements.filter(r =>
        projectRequirementIds.includes(r.id)
    );
    if (projectRequirements.length > 0) {
        doc.addPage();
        doc.addPage();
        tocEntries.push({ title: 'Requirements', page: currentPage, level: 0 });
        currentPage = addRequirementsSection(doc, projectRequirements, currentPage, tocEntries);
    }

    // 4. Use Cases Section
    const projectUseCases = globalState.useCases.filter(u =>
        projectUseCaseIds.includes(u.id)
    );
    if (projectUseCases.length > 0) {
        doc.addPage();
        doc.addPage();
        tocEntries.push({ title: 'Use Cases', page: currentPage, level: 0 });
        currentPage = addUseCasesSection(doc, projectUseCases, currentPage, tocEntries);
    }

    // 5. Test Cases Section
    const projectTestCases = globalState.testCases.filter(t =>
        projectTestCaseIds.includes(t.id)
    );
    if (projectTestCases.length > 0) {
        doc.addPage();
        doc.addPage();
        tocEntries.push({ title: 'Test Cases', page: currentPage, level: 0 });
        currentPage = addTestCasesSection(doc, projectTestCases, currentPage, tocEntries);
    }

    // 6. Information Section
    const projectInformation = globalState.information.filter(i =>
        projectInformationIds.includes(i.id)
    );
    if (projectInformation.length > 0) {
        doc.addPage();
        doc.addPage();
        tocEntries.push({ title: 'Information', page: currentPage, level: 0 });
        currentPage = addInformationSection(doc, projectInformation, currentPage, tocEntries);
    }

    // 7. Revision History
    if (projectRequirements.length > 0 || projectUseCases.length > 0 ||
        projectTestCases.length > 0 || projectInformation.length > 0) {
        doc.addPage();
        doc.addPage();
        tocEntries.push({ title: 'Revision History', page: currentPage, level: 0 });
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
    entries.forEach(entry => {
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
function addRequirementsSection(doc: jsPDF, requirements: Requirement[], startPage: number, tocEntries: TOCEntry[]): number {
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
        const title = `${req.id} - ${req.title}`;
        doc.text(title, 20, yPos);

        // Add to TOC
        tocEntries.push({ title: title, page: page, level: 1 });

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
            theme: 'plain',
            margin: { left: 20 },
            tableWidth: 170,
            styles: {
                fontSize: 8,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
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
function addUseCasesSection(doc: jsPDF, useCases: UseCase[], startPage: number, tocEntries: TOCEntry[]): number {
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
        const title = `${useCase.id} - ${useCase.title}`;
        doc.text(title, 20, yPos);

        // Add to TOC
        tocEntries.push({ title: title, page: page, level: 1 });

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
            theme: 'plain',
            margin: { left: 20 },
            tableWidth: 170,
            styles: {
                fontSize: 8,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
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
function addTestCasesSection(doc: jsPDF, testCases: TestCase[], startPage: number, tocEntries: TOCEntry[]): number {
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
        const title = `${testCase.id} - ${testCase.title}`;
        doc.text(title, 20, yPos);

        // Add to TOC
        tocEntries.push({ title: title, page: page, level: 1 });

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
            theme: 'plain',
            margin: { left: 20 },
            tableWidth: 170,
            styles: {
                fontSize: 8,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            }
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
function addInformationSection(doc: jsPDF, information: Information[], startPage: number, tocEntries: TOCEntry[]): number {
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
        const title = `${info.id} - ${info.title}`;
        doc.text(title, 20, yPos);

        // Add to TOC
        tocEntries.push({ title: title, page: page, level: 1 });

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
        theme: 'plain',
        margin: { left: 20 },
        tableWidth: 170,
        styles: {
            fontSize: 9,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        }
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


