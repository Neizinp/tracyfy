import React from 'react';

interface FormFieldProps {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
  description?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  icon,
  required,
  children,
  fullWidth = false,
  description,
}) => (
  <div
    style={{
      gridColumn: fullWidth ? '1 / -1' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}
  >
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
      }}
    >
      {icon}
      {label} {required && <span style={{ color: 'var(--color-status-error)' }}>*</span>}
    </label>
    {description && (
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted)',
          marginBottom: '2px',
        }}
      >
        {description}
      </div>
    )}
    {children}
  </div>
);
