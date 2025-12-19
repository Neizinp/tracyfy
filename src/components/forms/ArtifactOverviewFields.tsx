import React from 'react';
import { FormField } from './FormField';
import { formatDateTime } from '../../utils/dateUtils';

export interface DropdownOption {
  value: string;
  label: string;
}

interface ArtifactOverviewFieldsProps {
  title: string;
  setTitle: (val: string) => void;
  priority?: string;
  setPriority?: (val: string) => void;
  priorityOptions?: DropdownOption[];
  priorityLabel?: string;
  status?: string;
  setStatus?: (val: string) => void;
  statusOptions?: DropdownOption[];
  author?: string;
  setAuthor?: (val: string) => void;
  dateCreated?: number;
  isEditMode: boolean;
  currentUser?: string;
  titlePlaceholder?: string;
  hidePriority?: boolean;
  hideStatus?: boolean;
}

const defaultInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-app)',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

const readonlyStyle: React.CSSProperties = {
  ...defaultInputStyle,
  backgroundColor: 'var(--color-bg-secondary)',
  color: 'var(--color-text-muted)',
  cursor: 'not-allowed',
};

export const ArtifactOverviewFields: React.FC<ArtifactOverviewFieldsProps> = ({
  title,
  setTitle,
  priority,
  setPriority,
  priorityOptions,
  priorityLabel = 'Priority',
  status,
  setStatus,
  statusOptions,
  author,
  dateCreated,
  isEditMode,
  currentUser,
  titlePlaceholder = 'Enter title...',
  hidePriority = false,
  hideStatus = false,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
      <FormField label="Title" required fullWidth>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus={!isEditMode}
          placeholder={titlePlaceholder}
          style={defaultInputStyle}
        />
      </FormField>

      {!hideStatus && status !== undefined && setStatus && statusOptions && (
        <FormField label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={defaultInputStyle}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      )}

      {!hidePriority && priority !== undefined && setPriority && priorityOptions && (
        <FormField label={priorityLabel}>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={defaultInputStyle}
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Author">
        <div style={readonlyStyle}>
          {isEditMode ? author || 'Not specified' : currentUser || 'No user selected'}
        </div>
      </FormField>

      {isEditMode && dateCreated !== undefined && (
        <FormField label="Date Created">
          <input type="text" value={formatDateTime(dateCreated)} disabled style={readonlyStyle} />
        </FormField>
      )}
    </div>
  );
};
