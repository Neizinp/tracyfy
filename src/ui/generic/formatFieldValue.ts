import { optionLabel, type FieldDef, type FieldValue } from '../../domain/fields';
import { formatDateTime } from '../../utils/dateUtils';

/** A field value as a person reads it: enum labels, Yes / No, local date and time */
export function formatFieldValue(field: FieldDef, value: FieldValue): string {
  if (value === undefined || value === null || value === '') return '';
  switch (field.type) {
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'enum':
      return optionLabel(field, value);
    case 'date':
      // Built-in times are epoch ms; custom date attributes are YYYY-MM-DD
      return typeof value === 'number' ? (value > 0 ? formatDateTime(value) : '') : String(value);
    default:
      return String(value);
  }
}
