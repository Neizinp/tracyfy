import React, { useCallback } from 'react';
import {
  NewRequirementModal,
  LinkModal,
  EditRequirementModal,
  UseCaseModal,
  NewTestCaseModal,
  EditTestCaseModal,
  InformationModal,
  VersionHistory,
  TrashModal,
  ProjectSettingsModal,
  CreateProjectModal,
  GlobalLibraryModal,
} from './';
import { UserSettingsModal } from './UserSettingsModal';
import {
  useUI,
  useProject,
  useGlobalState,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useFileSystem,
} from '../app/providers';
import type { Information, ArtifactLink } from '../types';

export const ModalManager: React.FC = () => {
  // UI state
  const ui = useUI();

  // Project state
  const { projects, currentProjectId, updateProject, deleteProject, createProject, addToProject } =
    useProject();

  // Global state
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();

  // Artifact state and operations
  const {
    requirements,
    handleAddRequirement,
    handleUpdateRequirement,
    handleDeleteRequirement,
    handleRestoreRequirement,
    handlePermanentDeleteRequirement,
  } = useRequirements();
  const {
    useCases,
    handleAddUseCase,
    handleUpdateUseCase,
    handleRestoreUseCase,
    handlePermanentDeleteUseCase,
  } = useUseCases();
  const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } =
    useTestCases();
  const {
    information,
    handleAddInformation,
    handleUpdateInformation,
    handleRestoreInformation,
    handlePermanentDeleteInformation,
  } = useInformation();

  // FileSystem state
  const { baselines, createBaseline } = useFileSystem();

  // Handler for adding a link to an artifact's linkedArtifacts array
  const handleAddArtifactLink = useCallback(
    (newLink: ArtifactLink) => {
      const sourceId = ui.linkSourceId || ui.selectedRequirementId;
      const sourceType = ui.linkSourceType || 'requirement';

      if (!sourceId) return;

      // Find and update the source artifact based on type
      switch (sourceType) {
        case 'requirement': {
          const req = requirements.find((r) => r.id === sourceId);
          if (req) {
            const updatedLinks = [...(req.linkedArtifacts || []), newLink];
            handleUpdateRequirement(sourceId, { linkedArtifacts: updatedLinks });
          }
          break;
        }
        case 'usecase': {
          const uc = useCases.find((u) => u.id === sourceId);
          if (uc) {
            const updatedLinks = [...(uc.linkedArtifacts || []), newLink];
            handleUpdateUseCase(sourceId, { linkedArtifacts: updatedLinks });
          }
          break;
        }
        case 'testcase': {
          const tc = testCases.find((t) => t.id === sourceId);
          if (tc) {
            const updatedLinks = [...(tc.linkedArtifacts || []), newLink];
            handleUpdateTestCase(sourceId, { linkedArtifacts: updatedLinks });
          }
          break;
        }
        case 'information': {
          const info = information.find((i) => i.id === sourceId);
          if (info) {
            const updatedLinks = [...(info.linkedArtifacts || []), newLink];
            handleUpdateInformation(sourceId, { linkedArtifacts: updatedLinks });
          }
          break;
        }
      }

      ui.setIsLinkModalOpen(false);
    },
    [
      ui,
      requirements,
      useCases,
      testCases,
      information,
      handleUpdateRequirement,
      handleUpdateUseCase,
      handleUpdateTestCase,
      handleUpdateInformation,
    ]
  );

  // Combined handler for InformationModal - handles both add and update
  const handleInformationSubmit = (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => {
    if ('id' in data && 'updates' in data) {
      // This is an update
      handleUpdateInformation(data.id, data.updates);
    } else {
      // This is a new info
      handleAddInformation(data as Omit<Information, 'id' | 'lastModified' | 'dateCreated'>);
    }
  };

  return (
    <>
      <NewRequirementModal
        isOpen={ui.isNewRequirementModalOpen}
        onClose={() => ui.setIsNewRequirementModalOpen(false)}
        onSubmit={handleAddRequirement}
      />

      <LinkModal
        isOpen={ui.isLinkModalOpen}
        sourceArtifactId={ui.linkSourceId || ui.selectedRequirementId} // Fallback for backward compatibility
        sourceArtifactType={ui.linkSourceType || 'requirement'}
        projects={projects}
        currentProjectId={currentProjectId}
        globalRequirements={globalRequirements}
        globalUseCases={globalUseCases}
        globalTestCases={globalTestCases}
        globalInformation={globalInformation}
        onClose={() => ui.setIsLinkModalOpen(false)}
        onAddLink={handleAddArtifactLink}
      />

      {ui.isEditRequirementModalOpen && ui.editingRequirement && (
        <EditRequirementModal
          isOpen={ui.isEditRequirementModalOpen}
          requirement={ui.editingRequirement}
          onClose={() => {
            ui.setIsEditRequirementModalOpen(false);
            ui.setEditingRequirement(null);
          }}
          onSubmit={handleUpdateRequirement}
          onDelete={handleDeleteRequirement}
        />
      )}

      <UseCaseModal
        isOpen={ui.isUseCaseModalOpen}
        useCase={ui.editingUseCase}
        onClose={() => {
          ui.setIsUseCaseModalOpen(false);
          ui.setEditingUseCase(null);
        }}
        onSubmit={handleAddUseCase}
      />

      <NewTestCaseModal
        isOpen={ui.isNewTestCaseModalOpen}
        requirements={requirements.filter((r) => !r.isDeleted)}
        onClose={() => ui.setIsNewTestCaseModalOpen(false)}
        onSubmit={handleAddTestCase}
      />

      <EditTestCaseModal
        isOpen={ui.isEditTestCaseModalOpen}
        testCase={testCases.find((t) => t.id === ui.selectedTestCaseId) || null}
        requirements={requirements.filter((r) => !r.isDeleted)}
        onClose={() => {
          ui.setIsEditTestCaseModalOpen(false);
          ui.setSelectedTestCaseId(null);
        }}
        onSubmit={handleUpdateTestCase}
        onDelete={handleDeleteTestCase}
      />

      <InformationModal
        isOpen={ui.isInformationModalOpen}
        information={ui.selectedInformation}
        onClose={() => {
          ui.setIsInformationModalOpen(false);
          ui.setSelectedInformation(null);
        }}
        onSubmit={handleInformationSubmit}
      />

      <VersionHistory
        isOpen={ui.isVersionHistoryOpen}
        baselines={baselines}
        projectId={currentProjectId}
        onClose={() => ui.setIsVersionHistoryOpen(false)}
        onCreateBaseline={createBaseline}
      />

      <TrashModal
        isOpen={ui.isTrashModalOpen}
        onClose={() => ui.setIsTrashModalOpen(false)}
        deletedRequirements={requirements.filter((r) => r.isDeleted)}
        deletedUseCases={useCases.filter((u) => u.isDeleted)}
        onRestoreRequirement={handleRestoreRequirement}
        onRestoreUseCase={handleRestoreUseCase}
        onPermanentDeleteRequirement={handlePermanentDeleteRequirement}
        onPermanentDeleteUseCase={handlePermanentDeleteUseCase}
        deletedInformation={information.filter((i) => i.isDeleted)}
        onRestoreInformation={handleRestoreInformation}
        onPermanentDeleteInformation={handlePermanentDeleteInformation}
      />

      {ui.isProjectSettingsOpen && ui.projectToEdit && (
        <ProjectSettingsModal
          isOpen={ui.isProjectSettingsOpen}
          project={ui.projectToEdit}
          onClose={() => {
            ui.setIsProjectSettingsOpen(false);
            ui.setProjectToEdit(null);
          }}
          onUpdate={async (projectId, name, description) => {
            const project = projects.find((p) => p.id === projectId);
            if (project) {
              await updateProject({ ...project, name, description });
            }
          }}
          onDelete={deleteProject}
        />
      )}

      {ui.isCreateProjectModalOpen && (
        <CreateProjectModal
          isOpen={ui.isCreateProjectModalOpen}
          onClose={() => ui.setIsCreateProjectModalOpen(false)}
          onSubmit={createProject}
        />
      )}

      <GlobalLibraryModal
        isOpen={ui.isGlobalLibraryModalOpen}
        onClose={() => ui.setIsGlobalLibraryModalOpen(false)}
        projects={projects}
        currentProjectId={currentProjectId}
        globalRequirements={globalRequirements}
        globalUseCases={globalUseCases}
        globalTestCases={globalTestCases}
        globalInformation={globalInformation}
        onAddToProject={addToProject}
      />

      <UserSettingsModal
        isOpen={ui.isUserSettingsModalOpen}
        onClose={() => ui.setIsUserSettingsModalOpen(false)}
      />
    </>
  );
};
