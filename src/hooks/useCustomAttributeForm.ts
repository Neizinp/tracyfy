/**
 * useCustomAttributeForm Hook
 *
 * Manages form state and handlers for creating/editing custom attribute definitions.
 * Extracted from CustomAttributeDefinitionModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  CustomAttributeDefinition,
  AttributeType,
  ApplicableArtifactType,
} from '../types/customAttributes';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';

interface UseCustomAttributeFormOptions {
  isOpen: boolean;
  definition: CustomAttributeDefinition | null;
  onSubmit: (data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>) => void;
}

export function useCustomAttributeForm({
  isOpen,
  definition,
  onSubmit,
}: UseCustomAttributeFormOptions) {
  const isEditMode = definition !== null;

  // Form state
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
        setName('');
        setType('text');
        setDescription('');
        setRequired(false);
        setDefaultValue('');
        setOptions([]);
        setAppliesTo(['requirement']);
      }
      setNewOption('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, definition]);

  const handleAddOption = useCallback(() => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  }, [newOption, options]);

  const handleRemoveOption = useCallback((index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleArtifactType = useCallback((artifactType: ApplicableArtifactType) => {
    setAppliesTo((prev) => {
      if (prev.includes(artifactType)) {
        return prev.filter((t) => t !== artifactType);
      }
      return [...prev, artifactType];
    });
  }, []);

  const validateForm = useCallback(async (): Promise<string | null> => {
    if (!name.trim()) {
      return 'Name is required';
    }
    if (appliesTo.length === 0) {
      return 'Please select at least one artifact type';
    }
    if (type === 'dropdown' && options.length < 2) {
      return 'Dropdown type requires at least 2 options';
    }
    const exists = await diskCustomAttributeService.nameExists(name.trim(), definition?.id);
    if (exists) {
      return 'An attribute with this name already exists';
    }
    return null;
  }, [name, appliesTo, type, options, definition?.id]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [validateForm, defaultValue, type, name, description, required, options, appliesTo, onSubmit]
  );

  return {
    // Mode
    isEditMode,

    // Form fields
    name,
    setName,
    type,
    setType,
    description,
    setDescription,
    required,
    setRequired,
    defaultValue,
    setDefaultValue,
    options,
    newOption,
    setNewOption,
    appliesTo,

    // Error state
    error,
    isSubmitting,

    // Actions
    handleAddOption,
    handleRemoveOption,
    toggleArtifactType,
    handleSubmit,
  };
}
