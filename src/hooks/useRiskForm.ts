import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Risk } from '../types';
import { useUI, useGlobalState } from '../app/providers';
import { useArtifactForm } from './useArtifactForm';

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
  const {
    setEditingRequirement,
    setIsEditRequirementModalOpen,
    setEditingUseCase,
    setIsUseCaseModalOpen,
    setSelectedTestCaseId,
    setIsEditTestCaseModalOpen,
    setSelectedInformation,
    setIsInformationModalOpen,
  } = useUI();
  const { requirements, useCases, information } = useGlobalState();

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
    onCreate: (data) => onSubmit(data as any),
    onUpdate: (id, updates) => onSubmit({ id, updates }),
    onDelete: () => {},
    defaultTab: 'overview',
  });

  // Sync specialized fields
  useEffect(() => {
    if (isOpen) {
      if (risk) {
        setCategory(risk.category);
        setImpact(risk.impact);
        setOwner(risk.owner || '');
        setMitigation(risk.mitigation);
        setContingency(risk.contingency);
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

  // Navigate to a linked artifact
  const handleNavigateToArtifact = useCallback(
    (sourceId: string, sourceType: string) => {
      onClose();

      switch (sourceType) {
        case 'requirement': {
          const req = requirements.find((r) => r.id === sourceId);
          if (req) {
            setEditingRequirement(req);
            setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'useCase': {
          const uc = useCases.find((u) => u.id === sourceId);
          if (uc) {
            setEditingUseCase(uc);
            setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testCase': {
          setSelectedTestCaseId(sourceId);
          setIsEditTestCaseModalOpen(true);
          break;
        }
        case 'information': {
          const info = information.find((i) => i.id === sourceId);
          if (info) {
            setSelectedInformation(info);
            setIsInformationModalOpen(true);
          }
          break;
        }
      }
    },
    [
      onClose,
      requirements,
      useCases,
      information,
      setEditingRequirement,
      setIsEditRequirementModalOpen,
      setEditingUseCase,
      setIsUseCaseModalOpen,
      setSelectedTestCaseId,
      setIsEditTestCaseModalOpen,
      setSelectedInformation,
      setIsInformationModalOpen,
    ]
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
