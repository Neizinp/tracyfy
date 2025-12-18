import React from 'react';
import type {
  CustomAttributeDefinition,
  CustomAttributeValue,
  ApplicableArtifactType,
} from '../types/customAttributes';

interface CustomAttributeEditorProps {
  definitions: CustomAttributeDefinition[];
  values: CustomAttributeValue[];
  onChange: (values: CustomAttributeValue[]) => void;
  artifactType: ApplicableArtifactType;
  loading?: boolean;
}

/**
 * Reusable component for editing custom attribute values on an artifact.
 * Filters definitions based on the artifact type and renders appropriate input controls.
 */
export const CustomAttributeEditor: React.FC<CustomAttributeEditorProps> = ({
  definitions,
  values,
  onChange,
  artifactType,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        style={{
          padding: 'var(--spacing-lg)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto var(--spacing-sm)',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p>Loading custom attributes...</p>
      </div>
    );
  }

  // Filter definitions to only those applicable to this artifact type
  const applicableDefinitions = definitions.filter((def) => def.appliesTo.includes(artifactType));

  // Get current value for an attribute, fallback to default or empty
  const getValue = (def: CustomAttributeDefinition): string | number | boolean | null => {
    const existingValue = values.find((v) => v.attributeId === def.id);
    if (existingValue !== undefined) {
      return existingValue.value;
    }
    // Use default value if available
    if (def.defaultValue !== undefined) {
      return def.defaultValue;
    }
    // Return type-appropriate default
    switch (def.type) {
      case 'checkbox':
        return false;
      case 'number':
        return null;
      default:
        return '';
    }
  };

  // Update a single attribute value
  const updateValue = (attributeId: string, value: string | number | boolean | null) => {
    const existingIndex = values.findIndex((v) => v.attributeId === attributeId);
    const newValues = [...values];

    if (existingIndex >= 0) {
      newValues[existingIndex] = { attributeId, value };
    } else {
      newValues.push({ attributeId, value });
    }

    onChange(newValues);
  };

  if (applicableDefinitions.length === 0) {
    return (
      <div
        style={{
          padding: 'var(--spacing-lg)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <p>No custom attributes defined for this artifact type.</p>
        <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)' }}>
          Go to Custom Attributes in the sidebar to create attribute definitions.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
      }}
    >
      {applicableDefinitions.map((def) => {
        const currentValue = getValue(def);

        return (
          <div key={def.id}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              {def.name}
              {def.required && <span style={{ color: 'var(--color-error)' }}> *</span>}
            </label>

            {def.description && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--spacing-xs)',
                }}
              >
                {def.description}
              </p>
            )}

            {/* Render appropriate input based on type */}
            {def.type === 'text' && (
              <input
                type="text"
                value={String(currentValue ?? '')}
                onChange={(e) => updateValue(def.id, e.target.value)}
                placeholder={`Enter ${def.name.toLowerCase()}...`}
                required={def.required}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
            )}

            {def.type === 'number' && (
              <input
                type="number"
                value={currentValue !== null ? String(currentValue) : ''}
                onChange={(e) =>
                  updateValue(def.id, e.target.value ? Number(e.target.value) : null)
                }
                placeholder={`Enter ${def.name.toLowerCase()}...`}
                required={def.required}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
            )}

            {def.type === 'date' && (
              <input
                type="date"
                value={String(currentValue ?? '')}
                onChange={(e) => updateValue(def.id, e.target.value)}
                required={def.required}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              />
            )}

            {def.type === 'dropdown' && (
              <select
                value={String(currentValue ?? '')}
                onChange={(e) => updateValue(def.id, e.target.value)}
                required={def.required}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-app)',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                }}
              >
                <option value="">Select {def.name.toLowerCase()}...</option>
                {def.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {def.type === 'checkbox' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(currentValue)}
                  onChange={(e) => updateValue(def.id, e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>Enabled</span>
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
};
