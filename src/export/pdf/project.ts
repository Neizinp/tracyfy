/**
 * The PDF of a project (cover, contents, revision history, a section per
 * kind, each document with its outline, links) and the PDF of one document.
 * Every kind is rendered the same way, from its fields (see artifact.ts).
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ARTIFACT_KINDS, kind, kindOfId, type ArtifactKindId } from '../../domain/artifactKinds';
import { linkTypeLabel } from '../../domain/linkTypes';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import type { ArtifactDocument, BaseArtifact, DocumentEntry } from '../../types';
import {
  exported,
  exportedLinks,
  stateLabel,
  type ExportOptions,
  type ExportSource,
} from '../exportData';
import { changeSummary, type ArtifactChange } from '../revisionHistory';
import { writeArtifact, type ArtifactContext } from './artifact';
import { PAGE, PdfWriter, tocPages, writePageNumbers, writeToc } from './writer';

const titleOf = (a: BaseArtifact) => String((a as unknown as { title?: string }).title ?? '');

function writeCover(
  doc: jsPDF,
  lines: { title: string; subtitle: string; description?: string; facts: string[] }
) {
  const center = doc.internal.pageSize.getWidth() / 2;
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(lines.title, center, 60, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(lines.subtitle, center, 75, { align: 'center' });
  if (lines.description) {
    doc.setFontSize(11);
    doc.text(doc.splitTextToSize(lines.description, 170), center, 95, { align: 'center' });
  }
  doc.setFontSize(10);
  lines.facts.forEach((fact, i) => doc.text(fact, center, 140 + i * 8, { align: 'center' }));
}

const headingsOf = (structure: readonly DocumentEntry[]) =>
  structure.filter((e) => e.type === 'heading');

/** "2.1.3"-style numbers for a document's headings, below `base` */
function* numbered(structure: readonly DocumentEntry[], base: number[]) {
  let stack = [...base];
  for (const entry of structure) {
    if (entry.type !== 'heading') {
      yield { entry, number: '' };
      continue;
    }
    const depth = base.length + (entry.level || 1);
    if (stack.length < depth) while (stack.length < depth) stack.push(1);
    else {
      stack = stack.slice(0, depth);
      stack[depth - 1]++;
    }
    yield { entry, number: stack.join('.') };
  }
}

/** A document's outline: numbered headings and the artifacts it includes */
async function writeStructure(
  w: PdfWriter,
  source: ExportSource,
  doc: ArtifactDocument,
  base: number[],
  ctx: ArtifactContext
) {
  for (const { entry, number } of numbered(doc.structure ?? [], base)) {
    if (entry.type === 'heading') {
      w.heading(
        `${number} ${entry.title ?? ''}`,
        entry.level || 1,
        Math.max(11, 16 - (entry.level || 1) * 2)
      );
      continue;
    }
    const kindId = (entry.artifactType as ArtifactKindId | undefined) ?? kindOfId(entry.id ?? '');
    const artifact =
      kindId && source.artifacts[kindId]?.find((a) => a.id === entry.id && !a.isDeleted);
    if (kindId && artifact) await writeArtifact(w, kindId, artifact, ctx);
  }
}

function writeChanges(w: PdfWriter, changes: readonly ArtifactChange[], since: string) {
  w.text(`Changes since ${since}`, { size: 10 });
  w.space(3);
  if (changes.length === 0) {
    w.text('No changes.', { size: 9, italic: true });
    return;
  }
  autoTable(w.doc, {
    startY: w.y,
    head: [['Date', 'ID', 'Name', 'Changes', 'Author']],
    body: changes.map((c) => [
      c.commits[0] ? formatDate(c.commits[0].timestamp) : '-',
      c.id,
      c.title,
      changeSummary(c, kind(c.kind).label.singular),
      c.commits[0]?.author ?? '-',
    ]),
    theme: 'plain',
    margin: { left: PAGE.left, right: 210 - PAGE.right },
    styles: { fontSize: 8, lineColor: [0, 0, 0], lineWidth: 0.1, cellPadding: 2 },
    headStyles: { fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: 38 },
      4: { cellWidth: 28 },
    },
  });
}

function writeLinksTable(w: PdfWriter, source: ExportSource) {
  autoTable(w.doc, {
    startY: w.y,
    head: [['Link ID', 'Source', 'Type', 'Target']],
    body: exportedLinks(source).map((l) => [l.id, l.sourceId, linkTypeLabel(l.type), l.targetId]),
    margin: { left: PAGE.left, right: 210 - PAGE.right },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [100, 100, 100], fontStyle: 'bold' },
  });
}

interface Section {
  title: string;
  /** Levels of the table of contents entries the section adds after its own */
  entries: number[];
  write: (w: PdfWriter, number: number) => Promise<void>;
}

/** The PDF of the project; `changes` is null when there is no previous baseline */
export async function buildProjectPdf(
  source: ExportSource,
  options: ExportOptions,
  changes: readonly ArtifactChange[] | null,
  now = Date.now()
): Promise<jsPDF> {
  const ctx: ArtifactContext = {
    links: exportedLinks(source),
    attributeDefinitions: source.attributeDefinitions,
    readAsset: source.readAsset,
  };
  const kinds = ARTIFACT_KINDS.filter((k) => options.kinds.includes(k.id));
  const sections: Section[] = [];

  if (options.revisionHistory && changes) {
    const previous = [...source.baselines]
      .sort((a, b) => b.timestamp - a.timestamp)
      .find((b) => b.timestamp < (source.baseline?.timestamp ?? Infinity));
    sections.push({
      title: 'Revision History',
      entries: [],
      write: async (w) =>
        writeChanges(w, changes, previous ? `baseline ${previous.name}` : 'the previous baseline'),
    });
  }
  for (const k of kinds) {
    const items = exported(source, k.id);
    if (items.length === 0) continue;
    if (k.id === 'document') {
      for (const d of items as unknown as ArtifactDocument[]) {
        sections.push({
          title: `Document: ${d.title}`,
          entries: headingsOf(d.structure ?? []).map((h) => h.level || 1),
          write: async (w, n) => {
            if (d.description) w.text(d.description, { size: 9 });
            w.space(3);
            await writeStructure(w, source, d, [n], ctx);
          },
        });
      }
      continue;
    }
    sections.push({
      title: k.label.plural,
      entries: items.map(() => 1),
      write: async (w) => {
        for (const a of items) {
          w.ensure(30);
          w.toc.push({ title: `${a.id} - ${titleOf(a)}`, page: w.page, level: 1 });
          await writeArtifact(w, k.id, a, ctx);
        }
      },
    });
  }
  if (options.links && ctx.links.length > 0) {
    sections.push({ title: 'Links', entries: [], write: async (w) => writeLinksTable(w, source) });
  }

  const doc = new jsPDF();
  writeCover(doc, {
    title: source.project.name,
    subtitle: 'Requirements Management Export',
    description: source.project.description,
    facts: [
      `Export Date: ${formatDateTime(now)}`,
      stateLabel(source.baseline),
      ...(source.exportedBy ? [`Exported by: ${source.exportedBy}`] : []),
    ],
  });

  const w = new PdfWriter(doc);
  const tocFirst = 2;
  const reserved = tocPages(sections.flatMap((s) => [0, ...s.entries]));
  for (let i = 0; i < reserved; i++) w.newPage();

  for (const [i, section] of sections.entries()) {
    w.newPage();
    w.heading(`${i + 1}. ${section.title}`, 0);
    await section.write(w, i + 1);
  }

  writeToc(doc, w.toc, tocFirst);
  writePageNumbers(doc);
  return doc;
}

/** The PDF of one document: its own cover and contents, then its outline */
export async function buildDocumentPdf(
  source: ExportSource,
  document: ArtifactDocument
): Promise<jsPDF> {
  const doc = new jsPDF();
  writeCover(doc, {
    title: document.title,
    subtitle: 'Requirements Project Document',
    description: document.description,
    facts: [
      `ID: ${document.id}`,
      `Version: ${document.revision || '01'}`,
      ...(source.exportedBy ? [`Exported by: ${source.exportedBy}`] : []),
    ],
  });
  const w = new PdfWriter(doc);
  const reserved = tocPages(headingsOf(document.structure ?? []).map((h) => h.level || 1));
  for (let i = 0; i < reserved; i++) w.newPage();
  w.newPage();
  await writeStructure(w, source, document, [], {
    links: exportedLinks(source),
    attributeDefinitions: source.attributeDefinitions,
    readAsset: source.readAsset,
  });
  writeToc(doc, w.toc, 2);
  writePageNumbers(doc);
  return doc;
}
