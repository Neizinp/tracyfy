/**
 * PDF Core Utilities
 *
 * Core PDF structure: cover page, table of contents, page numbers, sorting.
 */

import jsPDF from 'jspdf';
import type { Project, ProjectBaseline } from '../../types';
import type { CustomAttributeDefinition, CustomAttributeValue } from '../../types/customAttributes';
import type { TOCEntry } from './types';
import { formatDate } from '../dateUtils';

/**
 * Add cover page to PDF
 */
export function addCoverPage(
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

/**
 * Add table of contents to PDF
 * NOTE: This function must be called AFTER all content pages are generated,
 * and we go back to the reserved ToC pages to render it.
 */
export function addTableOfContents(
  doc: jsPDF,
  entries: TOCEntry[],
  tocStartPage: number,
  tocPagesReserved: number
): void {
  let currentTocPage = 0;
  doc.setPage(tocStartPage);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Table of Contents', 20, 20);

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
export function calculateTocPages(entryCount: number): number {
  // Approximately 30 entries per page (level 0 takes 8pt spacing, level 1 takes 6pt)
  // Usable height per page is about 250mm (35mm start to 270mm end)
  // Average spacing is ~7pt, so roughly 35 entries per page
  const entriesPerPage = 30;
  return Math.max(1, Math.ceil(entryCount / entriesPerPage));
}

/**
 * Add page numbers to all pages
 */
export function addPageNumbers(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
}

/**
 * Sort artifacts by their numeric ID suffix (e.g., REQ-001, REQ-002)
 * Extracts the number from IDs like "REQ-001", "UC-002", "TC-003", "INFO-004"
 */
export function sortByIdNumber<T extends { id: string }>(artifacts: T[]): T[] {
  return [...artifacts].sort((a, b) => {
    const numA = parseInt(a.id.match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(b.id.match(/\d+$/)?.[0] || '0', 10);
    return numA - numB;
  });
}

/**
 * Format a custom attribute value for display
 */
export function formatCustomAttributeValue(
  value: CustomAttributeValue,
  definitions: CustomAttributeDefinition[]
): { name: string; displayValue: string } | null {
  const def = definitions.find((d) => d.id === value.attributeId);
  if (!def) return null;

  let displayValue: string;
  if (value.value === undefined || value.value === null || value.value === '') {
    displayValue = '-';
  } else if (def.type === 'checkbox') {
    displayValue = value.value ? 'Yes' : 'No';
  } else if (def.type === 'date' && typeof value.value === 'number') {
    displayValue = formatDate(value.value);
  } else {
    displayValue = String(value.value);
  }

  return { name: def.name, displayValue };
}
