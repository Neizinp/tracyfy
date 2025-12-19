/**
 * useInformationForm Hook
 *
 * Manages form state and handlers for creating/editing information artifacts.
 * Extracted from InformationModal for better separation of concerns.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Information } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';

interface UseInformationFormOptions {
  isOpen: boolean;
  information: Information | null;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => void;
}

type Tab = 'overview' | 'relationships' | 'customFields' | 'history';

export function useInformationForm({
  isOpen,
  information,
  onClose,
  onSubmit,
}: UseInformationFormOptions) {
  const isEditMode = information !== null;

  // Form state
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Information['type']>('note');
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens/closes or information changes
  useEffect(() => {
    if (information) {
      setTitle(information.title);
      setContent(information.content);
      setType(information.type);
      setCustomAttributes(information.customAttributes || []);
    } else {
      setTitle('');
      setContent('');
      setType('note');
      setCustomAttributes([]);
    }
  }, [information, isOpen]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (information) {
        onSubmit({
          id: information.id,
          updates: { title, content, type, customAttributes },
        });
      } else {
        onSubmit({ title, content, type, customAttributes, revision: '01' });
      }
      onClose();
    },
    [information, title, content, type, customAttributes, onSubmit, onClose]
  );

  return {
    // Mode
    isEditMode,

    // Tab state
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    content,
    setContent,
    type,
    setType,
    customAttributes,
    setCustomAttributes,

    // Actions
    handleSubmit,
  };
}
