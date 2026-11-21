/**
 * Writes flowing content into a jsPDF document: text that wraps and breaks
 * onto new pages by itself, so the renderers never track positions or pages.
 * Units are millimetres on A4 portrait.
 */
import type { jsPDF } from 'jspdf';

export const PAGE = { left: 20, right: 190, top: 20, bottom: 275 } as const;
export const CONTENT_WIDTH = PAGE.right - PAGE.left;

/** Line height in mm for a font size in pt */
const lineHeight = (size: number) => size * 0.5;

export interface TextStyle {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  indent?: number;
}

export interface TocEntry {
  title: string;
  page: number;
  level: number;
}

export class PdfWriter {
  y: number = PAGE.top;
  readonly toc: TocEntry[] = [];

  readonly doc: jsPDF;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  get page(): number {
    return this.doc.getCurrentPageInfo().pageNumber;
  }

  newPage(): void {
    this.doc.addPage();
    this.y = PAGE.top;
  }

  /** Start a new page unless `height` mm still fit on this one */
  ensure(height: number): void {
    if (this.y + height > PAGE.bottom) this.newPage();
  }

  space(mm: number): void {
    this.y += mm;
  }

  private font({ size = 9, bold, italic }: TextStyle): void {
    this.doc.setFontSize(size);
    this.doc.setFont(
      'helvetica',
      bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal'
    );
  }

  /** Wrapped text, broken across pages as needed */
  text(text: string, style: TextStyle = {}): void {
    if (!text) return;
    this.font(style);
    const size = style.size ?? 9;
    const indent = style.indent ?? 0;
    const lines: string[] = this.doc.splitTextToSize(text, CONTENT_WIDTH - indent);
    for (const line of lines) {
      this.ensure(lineHeight(size));
      this.y += lineHeight(size);
      this.doc.text(line, PAGE.left + indent, this.y - 1);
    }
  }

  /** A heading that is listed in the table of contents */
  heading(title: string, level: number, size = level === 0 ? 16 : 13): void {
    this.ensure(lineHeight(size) + 20);
    this.text(title, { size, bold: true });
    this.toc.push({ title, page: this.page, level });
    this.space(3);
  }

  /**
   * A shaded bar the width of the page, with `left` (wrapped) and `right`
   * text in it; kept on one page.
   */
  bar(left: string, opts: { right?: string; size?: number; bold?: boolean; shade?: number }): void {
    const size = opts.size ?? 8;
    this.font({ size, bold: opts.bold });
    const lines: string[] = this.doc.splitTextToSize(left, CONTENT_WIDTH - (opts.right ? 30 : 6));
    const height = lines.length * lineHeight(size) + 2.5;
    this.ensure(height);
    const shade = opts.shade ?? 248;
    this.doc.setFillColor(shade, shade, shade);
    this.doc.setDrawColor(210, 210, 210);
    this.doc.rect(PAGE.left, this.y, CONTENT_WIDTH, height, 'FD');
    lines.forEach((line, i) =>
      this.doc.text(line, PAGE.left + 2, this.y + (i + 1) * lineHeight(size) + 0.5)
    );
    if (opts.right) {
      this.font({ size });
      this.doc.text(opts.right, PAGE.right - 2, this.y + lineHeight(size) + 0.5, {
        align: 'right',
      });
    }
    this.y += height;
  }

  /** An image `width` × `height` mm at the left margin */
  image(dataUrl: string, format: string, width: number, height: number): void {
    this.ensure(height + 2);
    this.doc.addImage(dataUrl, format, PAGE.left, this.y + 1, width, height);
    this.y += height + 3;
  }
}

const TOC_TOP = 35;
const tocStep = (level: number) => (level === 0 ? 8 : 6);

/** Where each table of contents entry goes: page offset from the first ToC page, and y */
function tocLayout(entries: readonly TocEntry[]): { offset: number; y: number }[] {
  let offset = 0;
  let y = TOC_TOP;
  return entries.map((e) => {
    if (y > 270) {
      offset++;
      y = PAGE.top;
    }
    const at = { offset, y };
    y += tocStep(e.level);
    return at;
  });
}

/** How many pages the table of contents needs for this many entries of each level */
export function tocPages(levels: readonly number[]): number {
  const layout = tocLayout(levels.map((level) => ({ title: '', page: 0, level })));
  return layout.length === 0 ? 1 : layout[layout.length - 1].offset + 1;
}

/** Write the table of contents onto the pages reserved for it, from `firstPage` */
export function writeToc(doc: jsPDF, entries: readonly TocEntry[], firstPage: number): void {
  doc.setPage(firstPage);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', PAGE.left, PAGE.top);
  const layout = tocLayout(entries);
  entries.forEach((entry, i) => {
    const { offset, y } = layout[i];
    doc.setPage(firstPage + offset);
    const indent = entry.level * 6;
    const size = entry.level === 0 ? 12 : 10;
    doc.setFontSize(size);
    doc.setFont('helvetica', entry.level === 0 ? 'bold' : 'normal');
    const maxWidth = 150 - indent;
    let title = entry.title;
    if (doc.getTextWidth(title) > maxWidth) {
      while (title.length > 0 && doc.getTextWidth(`${title}...`) > maxWidth)
        title = title.slice(0, -1);
      title += '...';
    }
    doc.text(title, PAGE.left + 5 + indent, y);
    const page = String(entry.page);
    const dotsStart = PAGE.left + 5 + indent + doc.getTextWidth(title) + 2;
    const dotsEnd = 180 - doc.getTextWidth(page) - 2;
    if (dotsEnd > dotsStart) {
      doc.setFontSize(10);
      doc.text('.'.repeat(Math.floor((dotsEnd - dotsStart) / 2)), dotsStart, y);
      doc.setFontSize(size);
    }
    doc.text(page, 180, y, { align: 'right' });
  });
}

/** "Page n of N" at the foot of every page */
export function writePageNumbers(doc: jsPDF): void {
  const count = doc.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${count}`, 105, 290, { align: 'center' });
  }
}
