import React from 'react';
import { RequirementModal, UseCaseModal, TestCaseModal, InformationModal, RiskModal } from '../';
import {
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useFileSystem,
} from '../../app/providers';
import type { Information, Risk } from '../../types';

export const ArtifactModals: React.FC = () => {
  const ui = useUI();
  const { handleAddRequirement, handleUpdateRequirement, handleDeleteRequirement } =
    useRequirements();
  const { handleAddUseCase } = useUseCases();
  const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } =
    useTestCases();
  const { handleAddInformation, handleUpdateInformation } = useInformation();
  const { risks, saveRisk, getNextId } = useFileSystem();

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

  // Combined handler for RiskModal - handles both add and update
  const handleRiskSubmit = async (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => {
    if ('id' in data && 'updates' in data) {
      const existing = risks.find((r) => r.id === data.id);
      if (existing) {
        await saveRisk({
          ...existing,
          ...data.updates,
          lastModified: Date.now(),
        });
      }
    } else {
      const newId = await getNextId('risks');
      const now = Date.now();
      await saveRisk({
        id: newId,
        ...data,
        linkedArtifacts: [],
        dateCreated: now,
        lastModified: now,
      } as Risk);
    }
  };

  const selectedTestCase =
    ui.activeModal.type === 'testcase' && ui.activeModal.isEdit
      ? testCases.find((t) => t.id === ui.selectedArtifact?.id) || null
      : null;

  const selectedRequirement =
    ui.activeModal.type === 'requirement' && ui.activeModal.isEdit ? ui.editingRequirement : null;

  return (
    <>
      <RequirementModal
        isOpen={ui.activeModal.type === 'requirement'}
        requirement={selectedRequirement}
        onClose={ui.closeModal}
        onCreate={handleAddRequirement}
        onUpdate={handleUpdateRequirement}
        onDelete={handleDeleteRequirement}
      />

      <UseCaseModal
        isOpen={ui.activeModal.type === 'usecase'}
        useCase={ui.editingUseCase}
        onClose={ui.closeModal}
        onSubmit={handleAddUseCase}
      />

      <TestCaseModal
        isOpen={ui.activeModal.type === 'testcase'}
        testCase={selectedTestCase}
        onClose={ui.closeModal}
        onCreate={handleAddTestCase}
        onUpdate={handleUpdateTestCase}
        onDelete={handleDeleteTestCase}
      />

      <InformationModal
        isOpen={ui.activeModal.type === 'information'}
        information={ui.selectedInformation}
        onClose={ui.closeModal}
        onSubmit={handleInformationSubmit}
      />

      <RiskModal
        isOpen={ui.activeModal.type === 'risk'}
        risk={
          ui.selectedArtifact?.type === 'risk'
            ? (ui.selectedArtifact.data as unknown as Risk)
            : null
        }
        onClose={ui.closeModal}
        onSubmit={handleRiskSubmit}
      />
    </>
  );
};
