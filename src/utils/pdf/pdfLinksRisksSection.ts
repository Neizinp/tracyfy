/**
 * PDF Links and Risks Sections
 *
 * Generates the Links and Risks sections for PDF export.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Link, Risk } from '../../types';
import type { TOCEntry } from './types';
import { formatDate } from '../dateUtils';
import { LINK_TYPE_LABELS } from '../linkTypes';

/**
 * Add links section to PDF
 */
export function addLinksSection(
  doc: jsPDF,
  links: Link[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Links`, 20, 20);

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

/**
 * Add risks section to PDF
 */
export function addRisksSection(
  doc: jsPDF,
  risks: Risk[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number
): number {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Risks`, 20, 20);

  let yPos = 30;
  let page = startPage;

  const capitalizeWord = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
    doc.setFillColor(240, 240, 240);
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
    tocEntries.push({ title: title, page: page, level: 1 });

    currentY += headerHeight;

    // Metadata bar (Category | Probability | Impact | Status)
    doc.setFillColor(250, 250, 250);
    doc.rect(boxLeft, currentY, boxWidth, 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const metadataText = `Category: ${capitalizeWord(risk.category || 'other')}  |  Probability: ${capitalizeWord(risk.probability || 'medium')}  |  Impact: ${capitalizeWord(risk.impact || 'medium')}  |  Status: ${capitalizeWord(risk.status || 'open')}`;
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
