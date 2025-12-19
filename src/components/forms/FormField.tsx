import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  children,
  fullWidth = false,
}) => (
  <div style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
    <label
      style={{
        display: 'block',
        marginBottom: 'var(--spacing-xs)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
      }}
    >
      {label} {required && <span style={{ color: 'var(--color-status-error)' }}>*</span>}
    </label>
    {children}
  </div>
);
