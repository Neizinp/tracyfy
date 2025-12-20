/**
 * PDF Links and Risks Sections
 *
 * Generates the Links and Risks sections for PDF export.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Link, Risk } from '../../types';
import type { TOCEntry } from './types';
import { LINK_TYPE_LABELS } from '../linkTypes';
import { renderRisk } from './pdfArtifactRenderer';

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
export async function addRisksSection(
  doc: jsPDF,
  risks: Risk[],
  startPage: number,
  tocEntries: TOCEntry[],
  sectionNumber: number
): Promise<number> {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Risks`, 20, 20);

  let yPos = 30;
  let page = startPage;

  for (const risk of risks) {
    const result = await renderRisk(doc, risk, yPos, page);
    yPos = result.yPos;
    page = result.page;
    tocEntries.push({ title: `${risk.id} - ${risk.title}`, page: page, level: 1 });
  }

  return page;
}
