/**
 * PDF Revision History
 *
 * Generates the revision history section showing changes since last baseline.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate } from '../dateUtils';
import type { ArtifactCommit, RemovedArtifact } from './types';

/**
 * Helper to get human-readable type name
 */
function getTypeName(type: string): string {
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
}

/**
 * Add revision history section to PDF
 */
export function addRevisionHistory(
  doc: jsPDF,
  artifactCommits: ArtifactCommit[],
  removedArtifacts: RemovedArtifact[],
  sectionNumber: number
): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${sectionNumber}. Revision History`, 20, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Changes since last baseline', 20, 30);

  const rows: (string | number)[][] = [];

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
