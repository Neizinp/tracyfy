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
import {
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useRisks,
  useDocuments,
  useGlobalState,
  useUser,
} from '../../app/providers';
import type { Information, Risk, UseCase, ArtifactDocument } from '../../types';
import { exportSingleDocumentToPDF } from '../../utils/pdf/pdfMainExport';

export const ArtifactModals: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const ui = useUI();
  const { handleAddRequirement, handleUpdateRequirement, handleDeleteRequirement } =
    useRequirements();
  const { handleAddUseCase, handleUpdateUseCase, handleDeleteUseCase } = useUseCases();
  const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } =
    useTestCases();
  const { handleAddInformation, handleUpdateInformation, handleDeleteInformation } =
    useInformation();
  const { handleAddRisk, handleUpdateRisk, handleDeleteRisk } = useRisks();
  const { handleAddDocument, handleUpdateDocument, handleDeleteDocument } = useDocuments();
  const {
    closeModal,
    clearNavigationStack,
    navigationStack,
    popNavigationStack,
    editingRequirement,
    editingUseCase,
    editingDocument,
  } = ui;
  const globalState = useGlobalState();
  const { currentUser } = useUser();

  const handleDocumentExport = async (doc: ArtifactDocument) => {
    await exportSingleDocumentToPDF(doc, globalState, currentUser?.name);
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
    data: Omit<Risk, 'id' | 'lastModified' | 'revision'> | { id: string; updates: Partial<Risk> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await handleUpdateRisk(data.id, data.updates);
    } else {
      await handleAddRisk(data as Omit<Risk, 'id' | 'lastModified' | 'revision'>);
    }
  };

  const handleDocumentSubmit = async (
    data:
      | Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>
      | { id: string; updates: Partial<ArtifactDocument> }
  ) => {
    if ('id' in data && 'updates' in data) {
      await handleUpdateDocument(data.id, data.updates);
    } else {
      await handleAddDocument(data as Omit<ArtifactDocument, 'id' | 'lastModified' | 'revision'>);
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

      <DocumentModal
        isOpen={ui.activeModal.type === 'documents'}
        document={editingDocument}
        onClose={handleFullClose}
        onSubmit={handleDocumentSubmit}
        onDelete={handleDeleteDocument}
        onExport={handleDocumentExport}
        onBack={navigationStack.length > 0 ? popNavigationStack : undefined}
      />
    </>
  );
};
