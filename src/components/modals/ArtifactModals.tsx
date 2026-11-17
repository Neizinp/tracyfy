import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  RequirementModal,
  UseCaseModal,
  TestCaseModal,
  InformationModal,
  RiskModal,
  DocumentModal,
} from '../';
import type {
  ArtifactByKind,
  ArtifactDocument,
  Information,
  Requirement,
  Risk,
  UseCase,
} from '../../types';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { useAppStore, useAppStoreApi, type NewArtifact } from '../../state';

export const ArtifactModals: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeModal = useAppStore((s) => s.activeModal);
  const selectedArtifact = useAppStore((s) => s.selectedArtifact);
  const closeModal = useAppStore((s) => s.closeModal);
  const clearNavigationStack = useAppStore((s) => s.clearNavigationStack);
  const navigationStack = useAppStore((s) => s.navigationStack);
  const popNavigationStack = useAppStore((s) => s.popNavigationStack);
  /** The data of the selected artifact, if it is of this kind */
  const editing = <T,>(kind: ArtifactKindId): T | null =>
    selectedArtifact?.type === kind ? (selectedArtifact.data as unknown as T) : null;
  const testCases = useAppStore((s) => s.artifacts.testCase);
  const addArtifact = useAppStore((s) => s.addArtifact);
  const updateArtifact = useAppStore((s) => s.updateArtifact);
  const deleteArtifact = useAppStore((s) => s.deleteArtifact);

  /** What one kind's dialog does on create, save and delete; a save that changed something closes it */
  const actionsFor = <K extends ArtifactKindId>(kind: K) => ({
    add: (data: NewArtifact<K>) => addArtifact(kind, data),
    update: async (id: string, updates: Partial<ArtifactByKind[K]>) => {
      if (await updateArtifact(kind, id, updates)) closeModal();
    },
    remove: (id: string) => void deleteArtifact(kind, id),
  });
  const requirementActions = actionsFor('requirement');
  const useCaseActions = actionsFor('useCase');
  const testCaseActions = actionsFor('testCase');
  const informationActions = actionsFor('information');
  const riskActions = actionsFor('risk');
  const documentActions = actionsFor('document');
  const store = useAppStoreApi();
  const currentUser = useAppStore((s) => s.currentUser);

  const handleDocumentExport = async (doc: ArtifactDocument) => {
    const { exportSingleDocumentToPDF } = await import('../../utils/pdf/pdfMainExport');
    const { artifacts } = store.getState();
    await exportSingleDocumentToPDF(
      doc,
      {
        requirements: artifacts.requirement,
        useCases: artifacts.useCase,
        testCases: artifacts.testCase,
        information: artifacts.information,
        risks: artifacts.risk,
      },
      currentUser?.name
    );
  };

  const handleFullClose = () => {
    // Dispatch event to block deep link from re-opening
    window.dispatchEvent(new CustomEvent('modal-closing'));

    // Close modal state
    closeModal();
    clearNavigationStack();

    // Navigate to remove ?id= from URL
    if (searchParams.has('id')) {
      navigate(location.pathname, { replace: true });
    }
  };

  // Combined handler for InformationModal - handles both add and update
  const handleInformationSubmit = (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => {
    if ('id' in data && 'updates' in data) {
      informationActions.update(data.id, data.updates);
    } else {
      informationActions.add(data as Omit<Information, 'id' | 'lastModified' | 'dateCreated'>);
    }
  };

  // Combined handler for UseCaseModal - handles both add and update
  const handleUseCaseSubmit = async (
    data: Omit<UseCase, 'id' | 'lastModified'> | { id: string; updates: Partial<UseCase> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await useCaseActions.update(data.id, data.updates);
    } else {
      await useCaseActions.add(data as Omit<UseCase, 'id' | 'lastModified' | 'revision'>);
    }
  };

  // Combined handler for RiskModal - handles both add and update
  const handleRiskSubmit = async (
    data: Omit<Risk, 'id' | 'lastModified' | 'revision'> | { id: string; updates: Partial<Risk> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await riskActions.update(data.id, data.updates);
    } else {
      await riskActions.add(data as Omit<Risk, 'id' | 'lastModified' | 'revision'>);
    }
  };

  const handleDocumentSubmit = async (
    data:
      | Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>
      | { id: string; updates: Partial<ArtifactDocument> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await documentActions.update(data.id, data.updates);
    } else {
      await documentActions.add(data as Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>);
    }
  };

  const selectedTestCase =
    activeModal.type === 'testCase' && activeModal.isEdit
      ? testCases.find((t) => t.id === selectedArtifact?.id) || null
      : null;

  const selectedRequirement =
    activeModal.type === 'requirement' && activeModal.isEdit
      ? editing<Requirement>('requirement')
      : null;

  return (
    <>
      <RequirementModal
        isOpen={activeModal.type === 'requirement'}
        requirement={selectedRequirement}
        onClose={handleFullClose}
        onCreate={requirementActions.add}
        onUpdate={requirementActions.update}
        onDelete={requirementActions.remove}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <UseCaseModal
        isOpen={activeModal.type === 'useCase'}
        useCase={editing<UseCase>('useCase')}
        onClose={handleFullClose}
        onSubmit={handleUseCaseSubmit}
        onDelete={useCaseActions.remove}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <TestCaseModal
        isOpen={activeModal.type === 'testCase'}
        testCase={selectedTestCase}
        onClose={handleFullClose}
        onCreate={testCaseActions.add}
        onUpdate={testCaseActions.update}
        onDelete={testCaseActions.remove}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <InformationModal
        isOpen={activeModal.type === 'information'}
        information={editing<Information>('information')}
        onClose={handleFullClose}
        onSubmit={handleInformationSubmit}
        onDelete={informationActions.remove}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <RiskModal
        isOpen={activeModal.type === 'risk'}
        risk={editing<Risk>('risk')}
        onClose={handleFullClose}
        onSubmit={handleRiskSubmit}
        onDelete={riskActions.remove}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />

      <DocumentModal
        isOpen={activeModal.type === 'document'}
        document={editing<ArtifactDocument>('document')}
        onClose={handleFullClose}
        onSubmit={handleDocumentSubmit}
        onDelete={documentActions.remove}
        onExport={handleDocumentExport}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />
    </>
  );
};
