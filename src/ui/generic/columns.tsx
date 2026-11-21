/**
 * The table columns of a kind: ID / title, one column per field (built-in
 * and custom), and the kind's extra columns from ui/kinds. Which ones show
 * is each column's default unless the user chose otherwise.
 */
import React from 'react';
import { MarkdownCell } from '../../components/MarkdownCell';
import { fieldsFor, type ArtifactKindId } from '../../domain/artifactKinds';
import { fieldText, getFieldValue, type FieldDef } from '../../domain/fields';
import type { CustomAttributeDefinition, Link } from '../../types';
import { KIND_OVERRIDES, type Draft } from '../kinds';
import { formatFieldValue } from '../../domain/formatFieldValue';

export interface Column {
  key: string;
  label: string;
  /** Visible unless the user hides it */
  showInTable: boolean;
  /** Cannot be hidden */
  alwaysVisible?: boolean;
  width?: string;
  minWidth?: string;
  render: (item: Draft) => React.ReactNode;
  sortValue: (item: Draft) => string | number;
}

const LEVEL_CLASS: Record<string, string> = { low: 'low', medium: 'medium', high: 'high' };

function cell(field: FieldDef, item: Draft): React.ReactNode {
  const value = getFieldValue(item, field);
  if (field.type === 'markdown') return <MarkdownCell content={(value as string) || ''} />;
  const text = formatFieldValue(field, value);
  if (!text) return <span className="tf-muted">-</span>;
  if (field.type === 'enum') {
    // Low / medium / high read as a level; other options as a neutral chip
    const level = LEVEL_CLASS[String(value)];
    return <span className={level ? `tf-badge tf-badge-${level}` : 'tf-chip'}>{text}</span>;
  }
  if (field.id === 'revision') return <span className="tf-chip">{text}</span>;
  return <span className={field.type === 'date' ? 'tf-nowrap' : undefined}>{text}</span>;
}

function sortValue(field: FieldDef, item: Draft): string | number {
  const value = getFieldValue(item, field);
  if (field.type === 'number' || (field.type === 'date' && typeof value === 'number')) {
    return typeof value === 'number' ? value : 0;
  }
  return fieldText(item, field);
}

export function columnsFor(
  kindId: ArtifactKindId,
  definitions: readonly CustomAttributeDefinition[],
  links: readonly Link[]
): Column[] {
  const fieldColumns = fieldsFor(kindId, definitions)
    .filter((f) => f.id !== 'title')
    .map<Column>((f) => ({
      key: f.id,
      label: f.label,
      showInTable: Boolean(f.showInTable),
      minWidth: f.type === 'markdown' ? '220px' : undefined,
      render: (item) => cell(f, item),
      sortValue: (item) => sortValue(f, item),
    }));
  const extra = (KIND_OVERRIDES[kindId]?.columns ?? []).map<Column>((c) => ({
    key: c.key,
    label: c.label,
    showInTable: Boolean(c.showInTable),
    render: (item) => c.render(item, links),
    sortValue: (item) => c.sortValue(item, links),
  }));
  return [
    {
      key: 'id',
      label: 'ID / Title',
      showInTable: true,
      alwaysVisible: true,
      width: '280px',
      minWidth: '240px',
      render: (item) => (
        <>
          <div className="tf-mono tf-accent">{item.id as string}</div>
          <div>{item.title as string}</div>
        </>
      ),
      // IDs sort by number: REQ-2 before REQ-10
      sortValue: (item) => item.id as string,
    },
    ...fieldColumns,
    ...extra,
  ];
}

/** Whether a column shows, given what the user chose for this kind */
export const isVisible = (column: Column, choices: Record<string, boolean> | undefined) =>
  column.alwaysVisible || (choices?.[column.key] ?? column.showInTable);
