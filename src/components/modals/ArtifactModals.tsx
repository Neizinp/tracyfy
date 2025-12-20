import React from 'react';
import { RequirementModal, UseCaseModal, TestCaseModal, InformationModal, RiskModal } from '../';
import {
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
} from '../../app/providers';
import type { Information, Risk, UseCase } from '../../types';

export const ArtifactModals: React.FC = () => {
  const ui = useUI();
  const { handleAddRequirement, handleUpdateRequirement, handleDeleteRequirement } =
    useRequirements();
  const { handleAddUseCase, handleUpdateUseCase, handleDeleteUseCase } = useUseCases();
  const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } =
    useTestCases();
  const { handleAddInformation, handleUpdateInformation, handleDeleteInformation } =
    useInformation();
  const { handleAddRisk, handleUpdateRisk, handleDeleteRisk } = useRisks();
  const {
    closeModal,
    clearNavigationStack,
    navigationStack,
    popNavigationStack,
    editingRequirement,
    editingUseCase,
  } = ui;

  const handleFullClose = () => {
    // Remove ?id= from URL BEFORE closing modal to prevent deep link from re-opening
    const url = new URL(window.location.href);
    if (url.searchParams.has('id')) {
      url.searchParams.delete('id');
      window.history.replaceState({}, '', url.toString());
    }
    closeModal();
    clearNavigationStack();
  };

  // Combined handler for InformationModal - handles both add and update
  const handleInformationSubmit = (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => {
    if ('id' in data && 'updates' in data) {
      handleUpdateInformation(data.id, data.updates);
    } else {
      handleAddInformation(data as Omit<Information, 'id' | 'lastModified' | 'dateCreated'>);
    }
  };

  // Combined handler for UseCaseModal - handles both add and update
  const handleUseCaseSubmit = async (
    data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await handleUpdateUseCase(data.id, data.updates);
    } else {
      await handleAddUseCase(data as Omit<UseCase, 'id' | 'lastModified' | 'revision'>);
    }
  };

  // Combined handler for RiskModal - handles both add and update
  const handleRiskSubmit = async (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await handleUpdateRisk(data.id, data.updates);
    } else {
      await handleAddRisk(data as Omit<Risk, 'id' | 'lastModified' | 'dateCreated'>);
    }
  };

  const selectedTestCase =
    ui.activeModal.type === 'testcase' && ui.activeModal.isEdit
      ? testCases.find((t) => t.id === ui.selectedArtifact?.id) || null
      : null;

  const selectedRequirement =
    ui.activeModal.type === 'requirement' && ui.activeModal.isEdit ? editingRequirement : null;

  return (
    <>
      <RequirementModal
        isOpen={ui.activeModal.type === 'requirement'}
        requirement={selectedRequirement}
        onClose={handleFullClose}
        onCreate={handleAddRequirement}
        onUpdate={handleUpdateRequirement}
        onDelete={handleDeleteRequirement}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <UseCaseModal
        isOpen={ui.activeModal.type === 'usecase'}
        useCase={editingUseCase}
        onClose={handleFullClose}
        onSubmit={handleUseCaseSubmit}
        onDelete={handleDeleteUseCase}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <TestCaseModal
        isOpen={ui.activeModal.type === 'testcase'}
        testCase={selectedTestCase}
        onClose={handleFullClose}
        onCreate={handleAddTestCase}
        onUpdate={handleUpdateTestCase}
        onDelete={handleDeleteTestCase}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <InformationModal
        isOpen={ui.activeModal.type === 'information'}
        information={ui.selectedInformation}
        onClose={handleFullClose}
        onSubmit={handleInformationSubmit}
        onDelete={handleDeleteInformation}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <RiskModal
        isOpen={ui.activeModal.type === 'risk'}
        risk={
          ui.selectedArtifact?.type === 'risk'
            ? (ui.selectedArtifact.data as unknown as Risk)
            : null
        }
        onClose={handleFullClose}
        onSubmit={handleRiskSubmit}
        onDelete={handleDeleteRisk}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />
    </>
  );
};
