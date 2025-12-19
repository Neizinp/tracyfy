/**
 * useRiskForm Hook
 *
 * Manages form state and handlers for creating/editing risks.
 * Extracted from RiskModal for better separation of concerns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Risk } from '../types';
import type { CustomAttributeValue } from '../types/customAttributes';

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
  const isEditMode = risk !== null;

  // Form state
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Risk['category']>('other');
  const [probability, setProbability] = useState<Risk['probability']>('medium');
  const [impact, setImpact] = useState<Risk['impact']>('medium');
  const [status, setStatus] = useState<Risk['status']>('identified');
  const [owner, setOwner] = useState('');
  const [mitigation, setMitigation] = useState('');
  const [contingency, setContingency] = useState('');
  const [customAttributes, setCustomAttributes] = useState<CustomAttributeValue[]>([]);

  // Reset form when modal opens/closes or risk changes
  useEffect(() => {
    if (risk) {
      setTitle(risk.title);
      setDescription(risk.description);
      setCategory(risk.category);
      setProbability(risk.probability);
      setImpact(risk.impact);
      setStatus(risk.status);
      setOwner(risk.owner || '');
      setMitigation(risk.mitigation);
      setContingency(risk.contingency);
      setCustomAttributes(risk.customAttributes || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('other');
      setProbability('medium');
      setImpact('medium');
      setStatus('identified');
      setOwner('');
      setMitigation('');
      setContingency('');
      setCustomAttributes([]);
    }
  }, [risk, isOpen]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (risk) {
        onSubmit({
          id: risk.id,
          updates: {
            title,
            description,
            category,
            probability,
            impact,
            status,
            owner: owner || undefined,
            mitigation,
            contingency,
            customAttributes,
          },
        });
      } else {
        onSubmit({
          title,
          description,
          category,
          probability,
          impact,
          status,
          owner: owner || undefined,
          mitigation,
          contingency,
          customAttributes,
          revision: '01',
        });
      }
      onClose();
    },
    [
      risk,
      title,
      description,
      category,
      probability,
      impact,
      status,
      owner,
      mitigation,
      contingency,
      customAttributes,
      onSubmit,
      onClose,
    ]
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
  };
}
