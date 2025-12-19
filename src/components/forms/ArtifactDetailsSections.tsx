import React from 'react';
import { MarkdownEditor } from '../MarkdownEditor';

interface MarkdownFieldConfig {
  label: string;
  value: string;
  onChange: (val: string) => void;
  height?: number;
  placeholder?: string;
}

interface ArtifactDetailsSectionsProps {
  fields: MarkdownFieldConfig[];
  gap?: string;
}

export const ArtifactDetailsSections: React.FC<ArtifactDetailsSectionsProps> = ({
  fields,
  gap = 'var(--spacing-md)',
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {fields.map((field, index) => (
        <div key={`${field.label}-${index}`}>
          <MarkdownEditor
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            height={field.height || 180}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      ))}
    </div>
  );
};
