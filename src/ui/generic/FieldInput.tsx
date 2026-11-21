/**
 * The input for one field, chosen by its type. Built-in fields and custom
 * attributes look and behave the same.
 */
import React from 'react';
import { MarkdownEditor } from '../../components/MarkdownEditor';
import { isCustomField, type FieldDef, type FieldValue } from '../../domain/fields';
import { formatFieldValue } from '../../domain/formatFieldValue';

interface FieldInputProps {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  /** Unique within the dialog, so the label points at its input */
  inputId: string;
  autoFocus?: boolean;
}

export const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  onChange,
  inputId,
  autoFocus,
}) => {
  if (field.type === 'markdown') {
    return (
      <div className="tf-field-full">
        <MarkdownEditor
          label={field.required ? `${field.label} *` : field.label}
          value={(value as string) ?? ''}
          onChange={onChange}
          height={180}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        />
      </div>
    );
  }

  const label = (
    <label htmlFor={inputId} className="tf-field-label">
      {field.label}
      {field.required && !field.readOnly && <span className="tf-required"> *</span>}
    </label>
  );
  const help = field.description && <div className="tf-field-help">{field.description}</div>;

  if (field.readOnly || field.type === 'user') {
    return (
      <div className="tf-field">
        {label}
        <input
          id={inputId}
          className="tf-input"
          value={formatFieldValue(field, value) || 'Not specified'}
          disabled
        />
      </div>
    );
  }

  let input: React.ReactNode;
  switch (field.type) {
    case 'enum':
      input = (
        <select
          id={inputId}
          className="tf-input"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.default === undefined || (isCustomField(field) && !field.required)) && (
            <option value="">Select {field.label.toLowerCase()}...</option>
          )}
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'boolean':
      return (
        <div className="tf-field">
          <label className="tf-checkbox">
            <input
              id={inputId}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            {field.label}
          </label>
          {help}
        </div>
      );
    case 'number':
      input = (
        <input
          id={inputId}
          className="tf-input"
          type="number"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={field.placeholder}
        />
      );
      break;
    case 'date':
      input = (
        <input
          id={inputId}
          className="tf-input"
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    default:
      input = (
        <input
          id={inputId}
          className="tf-input"
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          autoFocus={autoFocus}
          placeholder={field.placeholder}
        />
      );
  }

  return (
    <div className={field.id === 'title' ? 'tf-field tf-field-full' : 'tf-field'}>
      {label}
      {help}
      {input}
    </div>
  );
};
