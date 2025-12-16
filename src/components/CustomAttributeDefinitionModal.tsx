import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import type {
  CustomAttributeDefinition,
  AttributeType,
  ApplicableArtifactType,
} from '../types/customAttributes';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';

interface CustomAttributeDefinitionModalProps {
  isOpen: boolean;
  definition: CustomAttributeDefinition | null; // null = create mode
  onClose: () => void;
  onSubmit: (data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>) => void;
}

const ATTRIBUTE_TYPES: { value: AttributeType; label: string; description: string }[] = [
  { value: 'text', label: 'Text', description: 'Single or multi-line text' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'dropdown', label: 'Dropdown', description: 'Select from predefined options' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/False toggle' },
];

const ARTIFACT_TYPES: { value: ApplicableArtifactType; label: string }[] = [
  { value: 'requirement', label: 'Requirements' },
  { value: 'useCase', label: 'Use Cases' },
  { value: 'testCase', label: 'Test Cases' },
  { value: 'information', label: 'Information' },
  { value: 'risk', label: 'Risks' },
  { value: 'link', label: 'Links' },
];

export const CustomAttributeDefinitionModal: React.FC<CustomAttributeDefinitionModalProps> = ({
  isOpen,
  definition,
  onClose,
  onSubmit,
}) => {
  const isEditMode = definition !== null;

  const [name, setName] = useState('');
  const [type, setType] = useState<AttributeType>('text');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState<string | number | boolean>('');
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [appliesTo, setAppliesTo] = useState<ApplicableArtifactType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or definition changes
  useEffect(() => {
    if (isOpen) {
      if (definition) {
        setName(definition.name);
        setType(definition.type);
        setDescription(definition.description || '');
        setRequired(definition.required || false);
        setDefaultValue(definition.defaultValue ?? '');
        setOptions(definition.options || []);
        setAppliesTo(definition.appliesTo);
      } else {
        // Create mode: reset to defaults
        setName('');
        setType('text');
        setDescription('');
        setRequired(false);
        setDefaultValue('');
        setOptions([]);
        setAppliesTo(['requirement']); // Default to requirements
      }
      setNewOption('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, definition]);

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const toggleArtifactType = (artifactType: ApplicableArtifactType) => {
    if (appliesTo.includes(artifactType)) {
      setAppliesTo(appliesTo.filter((t) => t !== artifactType));
    } else {
      setAppliesTo([...appliesTo, artifactType]);
    }
  };

  const validateForm = async (): Promise<string | null> => {
    if (!name.trim()) {
      return 'Name is required';
    }

    if (appliesTo.length === 0) {
      return 'Please select at least one artifact type';
    }

    if (type === 'dropdown' && options.length < 2) {
      return 'Dropdown type requires at least 2 options';
    }

    // Check for duplicate names
    const exists = await diskCustomAttributeService.nameExists(name.trim(), definition?.id);
    if (exists) {
      return 'An attribute with this name already exists';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const validationError = await validateForm();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    let processedDefaultValue: string | number | boolean | undefined;
    if (defaultValue !== '' && defaultValue !== undefined) {
      if (type === 'number') {
        processedDefaultValue = Number(defaultValue);
      } else if (type === 'checkbox') {
        processedDefaultValue = Boolean(defaultValue);
      } else {
        processedDefaultValue = String(defaultValue);
      }
    }

    onSubmit({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      required,
      defaultValue: processedDefaultValue,
      options: type === 'dropdown' ? options : undefined,
      appliesTo,
      isDeleted: false,
    });

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '600px',
          maxWidth: '95%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>
            {isEditMode ? `Edit Attribute - ${definition.id}` : 'New Custom Attribute'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Name */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Name <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Component, Release Version"
              required
              autoFocus
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
          </div>

          {/* Type */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Type <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AttributeType)}
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
              {ATTRIBUTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} - {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Options */}
          {type === 'dropdown' && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                Options <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-app)',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-accent)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-accent)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
              {options.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: '6px',
                  }}
                >
                  {options.map((option, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: 'var(--color-bg-card)',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional help text shown to users"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-app)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Required */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span>Required field</span>
            </label>
          </div>

          {/* Default Value */}
          {type !== 'checkbox' && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 'var(--spacing-xs)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                }}
              >
                Default Value
              </label>
              {type === 'dropdown' ? (
                <select
                  value={String(defaultValue)}
                  onChange={(e) => setDefaultValue(e.target.value)}
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
                  <option value="">No default</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : type === 'date' ? (
                <input
                  type="date"
                  value={String(defaultValue)}
                  onChange={(e) => setDefaultValue(e.target.value)}
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
              ) : (
                <input
                  type={type === 'number' ? 'number' : 'text'}
                  value={String(defaultValue)}
                  onChange={(e) =>
                    setDefaultValue(type === 'number' ? Number(e.target.value) : e.target.value)
                  }
                  placeholder="Optional default value"
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
            </div>
          )}

          {/* Applies To */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
              }}
            >
              Applies To <span style={{ color: 'var(--color-error)' }}>*</span>
            </label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
              }}
            >
              {ARTIFACT_TYPES.map((at) => (
                <label
                  key={at.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${appliesTo.includes(at.value) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    backgroundColor: appliesTo.includes(at.value)
                      ? 'var(--color-accent-bg)'
                      : 'var(--color-bg-card)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={appliesTo.includes(at.value)}
                    onChange={() => toggleArtifactType(at.value)}
                    style={{ display: 'none' }}
                  />
                  {at.label}
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                backgroundColor: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                borderRadius: '6px',
                border: '1px solid var(--color-error-light)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {error}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-lg)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isSubmitting ? 'var(--color-bg-disabled)' : 'var(--color-accent)',
                color: 'white',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Attribute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
