import React, { useCallback } from 'react';
import {
  RequirementModal,
  LinkModal,
  UseCaseModal,
  TestCaseModal,
  InformationModal,
  VersionHistory,
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
import type { Information } from '../types';
import type { LinkModalResult } from './LinkModal';
import { diskLinkService } from '../services/diskLinkService';
import type { LinkType } from '../utils/linkTypes';

export const ModalManager: React.FC = () => {
  // UI state
  const ui = useUI();

  // Project state
  const {
    projects,
    currentProjectId,
    currentProject,
    updateProject,
    deleteProject,
    createProject,
    addToProject,
  } = useProject();

  // Global state
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();

  // Artifact state and operations
  const { handleAddRequirement, handleUpdateRequirement, handleDeleteRequirement } =
    useRequirements();
  const { handleAddUseCase } = useUseCases();
  const { testCases, handleAddTestCase, handleUpdateTestCase, handleDeleteTestCase } =
    useTestCases();
  const { handleAddInformation, handleUpdateInformation } = useInformation();

  // FileSystem state
  const { baselines, createBaseline, reloadData } = useFileSystem();

  // Handler for creating a Link entity - now uses diskLinkService
  const handleAddArtifactLink = useCallback(
    async (newLink: LinkModalResult) => {
      const sourceId = ui.linkSourceId || ui.selectedRequirementId;

      if (!sourceId) return;

      try {
        // Create a Link file using the new link service with project scope
        await diskLinkService.createLink(
          sourceId,
          newLink.targetId,
          newLink.type as LinkType,
          newLink.projectIds
        );
        console.log(
          `Link created: ${sourceId} -> ${newLink.targetId} (${newLink.type}) [${newLink.projectIds.length === 0 ? 'Global' : newLink.projectIds.join(', ')}]`
        );
      } catch (error) {
        console.error('Failed to create link:', error);
      }

      ui.setIsLinkModalOpen(false);
    },
    [ui]
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

  // Handler for selecting an artifact from VersionHistory commits
  const handleSelectArtifact = useCallback(
    (artifactId: string, artifactType: string) => {
      // Map folder names to artifact type handling
      switch (artifactType) {
        case 'requirements': {
          const req = globalRequirements.find((r) => r.id === artifactId);
          if (req) {
            ui.setEditingRequirement(req);
            ui.setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'usecases': {
          const uc = globalUseCases.find((u) => u.id === artifactId);
          if (uc) {
            ui.setEditingUseCase(uc);
            ui.setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testcases': {
          const tc = globalTestCases.find((t) => t.id === artifactId);
          if (tc) {
            ui.setSelectedTestCaseId(tc.id);
            ui.setIsEditTestCaseModalOpen(true);
          }
          break;
        }
        case 'information': {
          const info = globalInformation.find((i) => i.id === artifactId);
          if (info) {
            ui.setSelectedInformation(info);
            ui.setIsInformationModalOpen(true);
          }
          break;
        }
      }
    },
    [ui, globalRequirements, globalUseCases, globalTestCases, globalInformation]
  );

  // Determine which TestCase to show (edit mode) or null (create mode)
  const selectedTestCase = ui.isEditTestCaseModalOpen
    ? testCases.find((t) => t.id === ui.selectedTestCaseId) || null
    : null;

  // Determine which Requirement to show (edit mode) or null (create mode)
  const selectedRequirement = ui.isEditRequirementModalOpen ? ui.editingRequirement : null;

  return (
    <>
      {/* Unified RequirementModal for both create and edit */}
      <RequirementModal
        isOpen={ui.isNewRequirementModalOpen || ui.isEditRequirementModalOpen}
        requirement={selectedRequirement}
        onClose={() => {
          ui.setIsNewRequirementModalOpen(false);
          ui.setIsEditRequirementModalOpen(false);
          ui.setEditingRequirement(null);
        }}
        onCreate={handleAddRequirement}
        onUpdate={handleUpdateRequirement}
        onDelete={handleDeleteRequirement}
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

      <UseCaseModal
        isOpen={ui.isUseCaseModalOpen}
        useCase={ui.editingUseCase}
        onClose={() => {
          ui.setIsUseCaseModalOpen(false);
          ui.setEditingUseCase(null);
        }}
        onSubmit={handleAddUseCase}
      />

      {/* Unified TestCaseModal for both create and edit */}
      <TestCaseModal
        isOpen={ui.isNewTestCaseModalOpen || ui.isEditTestCaseModalOpen}
        testCase={selectedTestCase}
        onClose={() => {
          ui.setIsNewTestCaseModalOpen(false);
          ui.setIsEditTestCaseModalOpen(false);
          ui.setSelectedTestCaseId(null);
        }}
        onCreate={handleAddTestCase}
        onUpdate={handleUpdateTestCase}
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
        projectName={currentProject?.name ?? null}
        onClose={() => ui.setIsVersionHistoryOpen(false)}
        onCreateBaseline={createBaseline}
        onSelectArtifact={handleSelectArtifact}
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
          onCopy={async (originalProject, newName, newDescription) => {
            const { diskProjectService } = await import('../services/diskProjectService');
            await diskProjectService.copyProject(originalProject, newName, newDescription);
            // Reload data to include the new project
            await reloadData();
          }}
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
