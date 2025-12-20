import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Risk } from '../types';
import { useUI } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';
import { useArtifactNavigation } from './useArtifactNavigation';

interface UseRiskFormOptions {
  isOpen: boolean;
  risk: Risk | null;
  onClose: () => void;
  onSubmit: (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => void;
}

type Tab = 'overview' | 'mitigation' | 'relationships' | 'customFields' | 'history';

export function useRiskForm({ isOpen, risk, onClose, onSubmit }: UseRiskFormOptions) {
  useUI();
  const handleNavigateToArtifact = useArtifactNavigation(onClose);

  // Specialized fields for Risks
  const [category, setCategory] = useState<Risk['category']>('other');
  const [impact, setImpact] = useState<Risk['impact']>('medium');
  const [owner, setOwner] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [contingency, setContingency] = useState('');

  const {
    isEditMode,
    activeTab,
    setActiveTab,
    title,
    setTitle,
    description,
    setDescription,
    priority: probability, // Map priority to probability
    setPriority: setProbability,
    status,
    setStatus,
    customAttributes,
    setCustomAttributes,
    handleSubmit: baseHandleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
  } = useArtifactForm<Risk, Tab>({
    isOpen,
    artifact: risk,
    onClose,
    onCreate: (data) =>
      onSubmit(data as unknown as Omit<Risk, 'id' | 'lastModified' | 'dateCreated'>),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {},
    defaultTab: 'overview',
  });

  // Sync specialized fields
  useEffect(() => {
    if (isOpen) {
      if (risk) {
        setCategory(risk.category || 'other');
        setImpact(risk.impact || 'medium');
        setOwner(risk.owner || '');
        setMitigation(risk.mitigation || '');
        setContingency(risk.contingency || '');
      } else {
        setCategory('other');
        setImpact('medium');
        setOwner('');
        setMitigation('');
        setContingency('');
      }
    }
  }, [isOpen, risk]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      baseHandleSubmit(e, {
        category,
        impact,
        owner: owner || undefined,
        mitigation,
        contingency,
      } as Partial<Risk>);
    },
    [baseHandleSubmit, category, impact, owner, mitigation, contingency]
  );

  // Calculate risk score for visual indicator
  const riskScore = useMemo(() => {
    const probValue = probability === 'low' ? 1 : probability === 'medium' ? 2 : 3;
    const impactValue = impact === 'low' ? 1 : impact === 'medium' ? 2 : 3;
    return probValue * impactValue;
  }, [probability, impact]);

  const riskLevel = useMemo(() => {
    return riskScore <= 2 ? 'low' : riskScore <= 4 ? 'medium' : 'high';
  }, [riskScore]);

  const riskColor = useMemo(() => {
    return riskLevel === 'low'
      ? 'var(--color-success)'
      : riskLevel === 'medium'
        ? 'var(--color-warning)'
        : 'var(--color-error)';
  }, [riskLevel]);

  return {
    // Mode
    isEditMode,

    // Tab state
    activeTab,
    setActiveTab,

    // Form fields
    title,
    setTitle,
    description,
    setDescription,
    category,
    setCategory,
    probability,
    setProbability,
    impact,
    setImpact,
    status,
    setStatus,
    owner,
    setOwner,
    mitigation,
    setMitigation,
    contingency,
    setContingency,
    customAttributes,
    setCustomAttributes,

    // Computed
    riskScore,
    riskLevel,
    riskColor,

    // Actions
    handleSubmit,
    handleDelete,
    confirmDelete,
    cancelDelete,
    showDeleteConfirm,
    handleRemoveLink,
    handleNavigateToArtifact,
  };
}
