/**
 * One artifact in the PDF, of any kind, laid out from its fields:
 *
 *   ┌ REQ-001 - Title ─────────────────────── Rev: 02 ┐
 *   │ Status: Approved | Priority: High | Author: …   │  short fields
 *   Description:                                         text fields, with images
 *   …
 *   Verifies: REQ-001, REQ-002                           relations, from the links
 *   Custom Attributes: …
 *   │ Created: … | Modified: …                        │  dates
 */
import { fieldsFor, type ArtifactKindId } from '../../domain/artifactKinds';
import { getFieldValue, isCustomField, type FieldDef } from '../../domain/fields';
import { formatDateTime } from '../../utils/dateUtils';
import type { BaseArtifact, Link } from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import { fieldDisplay, relationsOf } from '../exportData';
import { writeImages, type ReadAsset } from './images';
import type { PdfWriter } from './writer';

export interface ArtifactContext {
  links: readonly Link[];
  attributeDefinitions: readonly CustomAttributeDefinition[];
  readAsset: ReadAsset;
}

/** Shown in the bar under the title, not as a paragraph */
const SHORT_TYPES = new Set(['enum', 'user', 'number', 'boolean']);
const isShortText = (value: string) => value.length <= 60 && !value.includes('\n');

const HEADER_FIELDS = new Set(['title', 'revision']);

export async function writeArtifact(
  w: PdfWriter,
  kindId: ArtifactKindId,
  artifact: BaseArtifact,
  ctx: ArtifactContext
): Promise<void> {
  const fields = fieldsFor(kindId, ctx.attributeDefinitions).filter(
    (f) => !HEADER_FIELDS.has(f.id)
  );
  const builtIn = fields.filter((f) => !isCustomField(f));
  const shown = (f: FieldDef) => fieldDisplay(artifact, f);

  const meta: string[] = [];
  const paragraphs: FieldDef[] = [];
  const dates: string[] = [];
  for (const f of builtIn) {
    const value = shown(f);
    if (f.type === 'date') {
      if (value) dates.push(`${f.label}: ${value}`);
    } else if (SHORT_TYPES.has(f.type) || (f.type === 'text' && isShortText(value))) {
      meta.push(`${f.label}: ${value || '-'}`);
    } else if (value) {
      paragraphs.push(f);
    }
  }
  if (artifact.lastModified) dates.push(`Modified: ${formatDateTime(artifact.lastModified)}`);

  const title = String((artifact as unknown as { title?: string }).title ?? '');
  w.ensure(30);
  w.bar(`${artifact.id} - ${title}`, {
    right: `Rev: ${artifact.revision || '01'}`,
    size: 11,
    bold: true,
    shade: 238,
  });
  if (meta.length > 0) w.bar(meta.join('  |  '), { size: 8 });
  w.space(2);

  for (const f of paragraphs) {
    const value = String(getFieldValue(artifact, f) ?? '');
    w.ensure(10);
    w.text(`${f.label}:`, { size: 9, bold: true });
    w.text(value, { size: 8 });
    await writeImages(w, value, ctx.readAsset);
    w.space(2);
  }

  for (const r of relationsOf(ctx.links, artifact.id)) {
    w.ensure(10);
    w.text(`${r.label}:`, { size: 9, bold: true });
    w.text(r.ids.join(', '), { size: 8 });
    w.space(2);
  }

  const custom = fields
    .filter(isCustomField)
    .map((f) => [f.label, shown(f)] as const)
    .filter(([, value]) => value !== '');
  if (custom.length > 0) {
    w.ensure(10);
    w.text('Custom Attributes:', { size: 9, bold: true });
    for (const [label, value] of custom) w.text(`${label}: ${value}`, { size: 8 });
    w.space(2);
  }

  if (dates.length > 0) w.bar(dates.join('  |  '), { size: 7 });
  w.space(6);
}
