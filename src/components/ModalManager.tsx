import React, { useCallback, useEffect, useState } from 'react';
import { debug } from '../utils/debug';
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
  ExportModal,
} from './';
import { RiskModal } from './RiskModal';
import { UserSettingsModal } from './UserSettingsModal';
import { AdvancedSearchModal } from './AdvancedSearchModal';
import { CustomAttributeDefinitionModal } from './CustomAttributeDefinitionModal';
import { WorkflowModal } from './WorkflowModal';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';
import {
  useUI,
  useProject,
  useGlobalState,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
  useFileSystem,
  useUser,
  useBackgroundTasks,
} from '../app/providers';
import type { Information, Risk } from '../types';
import type { LinkModalResult } from './LinkModal';
import { diskLinkService } from '../services/diskLinkService';
import type { LinkType } from '../utils/linkTypes';
import type { Link } from '../types';
import type { ExportOptions } from './ExportModal';
import { exportProjectToPDF } from '../utils/pdfExportUtils';
import { exportProjectToExcel } from '../utils/excelExportUtils';
import { exportProjectToJSON } from '../utils/jsonExportUtils';

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

  // FileSystem state - includes risk operations
  const { baselines, createBaseline, reloadData, risks, saveRisk, getNextId } = useFileSystem();

  // User context - for PDF export author
  const { currentUser } = useUser();

  // Background tasks - for showing export progress
  const { startTask, endTask } = useBackgroundTasks();

  // Links state - fetch for export modal count
  const [projectLinks, setProjectLinks] = useState<Link[]>([]);

  // Fetch links when project changes
  useEffect(() => {
    if (currentProjectId) {
      diskLinkService.getLinksForProject(currentProjectId).then(setProjectLinks);
    }
  }, [currentProjectId]);

  // Handler for export - calls the appropriate export function based on format
  const handleExport = useCallback(
    async (options: ExportOptions) => {
      if (!currentProject) {
        console.error('No project selected for export');
        return;
      }

      // Filter artifact IDs based on user's selections
      const reqIds = options.includeRequirements ? currentProject.requirementIds : [];
      const ucIds = options.includeUseCases ? currentProject.useCaseIds : [];
      const tcIds = options.includeTestCases ? currentProject.testCaseIds : [];
      const infoIds = options.includeInformation ? currentProject.informationIds : [];

      const globalState = {
        requirements: globalRequirements,
        useCases: globalUseCases,
        testCases: globalTestCases,
        information: globalInformation,
        risks: risks,
      };

      try {
        switch (options.format) {
          case 'pdf': {
            const taskId = startTask('Exporting PDF...');
            try {
              await exportProjectToPDF(
                currentProject,
                globalState,
                reqIds,
                ucIds,
                tcIds,
                infoIds,
                baselines,
                options.baseline,
                currentUser?.name
              );
            } finally {
              endTask(taskId);
            }
            break;
          }
          case 'excel': {
            const taskId = startTask('Exporting to Excel...');
            try {
              // Excel now accepts full ExportOptions
              await exportProjectToExcel(
                currentProject,
                globalState,
                // Pass IDs based on options
                options.includeRequirements ? currentProject.requirementIds : [],
                options.includeUseCases ? currentProject.useCaseIds : [],
                options.includeTestCases ? currentProject.testCaseIds : [],
                options.includeInformation ? currentProject.informationIds : [],
                baselines,
                options
              );
            } finally {
              endTask(taskId);
            }
            break;
          }
          case 'json': {
            const taskId = startTask('Exporting JSON...');
            try {
              await exportProjectToJSON(currentProject, globalState, reqIds, ucIds, tcIds, infoIds);
            } finally {
              endTask(taskId);
            }
            break;
          }
        }
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [
      currentProject,
      globalRequirements,
      globalUseCases,
      globalTestCases,
      globalInformation,
      risks,
      baselines,
      currentUser,
      startTask,
      endTask,
    ]
  );

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
        debug.log(
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

  // Combined handler for RiskModal - handles both add and update
  const handleRiskSubmit = async (
    data: Omit<Risk, 'id' | 'lastModified' | 'dateCreated'> | { id: string; updates: Partial<Risk> }
  ) => {
    if ('id' in data && 'updates' in data) {
      // Update existing risk
      const existing = risks.find((r) => r.id === data.id);
      if (existing) {
        await saveRisk({
          ...existing,
          ...data.updates,
          lastModified: Date.now(),
        });
      }
    } else {
      // Create new risk
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
  const selectedTestCase =
    ui.activeModal.type === 'testcase' && ui.activeModal.isEdit
      ? testCases.find((t) => t.id === ui.selectedArtifact?.id) || null
      : null;

  // Determine which Requirement to show (edit mode) or null (create mode)
  const selectedRequirement =
    ui.activeModal.type === 'requirement' && ui.activeModal.isEdit ? ui.editingRequirement : null;

  return (
    <>
      {/* Unified RequirementModal for both create and edit */}
      <RequirementModal
        isOpen={ui.activeModal.type === 'requirement'}
        requirement={selectedRequirement}
        onClose={ui.closeModal}
        onCreate={handleAddRequirement}
        onUpdate={handleUpdateRequirement}
        onDelete={handleDeleteRequirement}
      />

      <LinkModal
        isOpen={ui.activeModal.type === 'link'}
        sourceArtifactId={ui.linkSourceId || ui.selectedRequirementId} // Fallback for backward compatibility
        sourceArtifactType={ui.linkSourceType || 'requirement'}
        projects={projects}
        currentProjectId={currentProjectId}
        globalRequirements={globalRequirements}
        globalUseCases={globalUseCases}
        globalTestCases={globalTestCases}
        globalInformation={globalInformation}
        onClose={ui.closeModal}
        onAddLink={handleAddArtifactLink}
      />

      <UseCaseModal
        isOpen={ui.activeModal.type === 'usecase'}
        useCase={ui.editingUseCase}
        onClose={ui.closeModal}
        onSubmit={handleAddUseCase}
      />

      {/* Unified TestCaseModal for both create and edit */}
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

      <VersionHistory
        isOpen={ui.activeModal.type === 'history'}
        baselines={baselines}
        projectName={currentProject?.name ?? null}
        onClose={ui.closeModal}
        onCreateBaseline={createBaseline}
        onSelectArtifact={handleSelectArtifact}
      />

      {ui.activeModal.type === 'project-settings' && ui.projectToEdit && (
        <ProjectSettingsModal
          isOpen={true}
          project={ui.projectToEdit}
          onClose={ui.closeModal}
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

      {ui.activeModal.type === 'project' && !ui.activeModal.isEdit && (
        <CreateProjectModal isOpen={true} onClose={ui.closeModal} onSubmit={createProject} />
      )}

      <GlobalLibraryModal
        isOpen={ui.activeModal.type === 'global-library'}
        onClose={ui.closeModal}
        projects={projects}
        currentProjectId={currentProjectId}
        globalRequirements={globalRequirements}
        globalUseCases={globalUseCases}
        globalTestCases={globalTestCases}
        globalInformation={globalInformation}
        onAddToProject={addToProject}
      />

      <UserSettingsModal isOpen={ui.activeModal.type === 'user-settings'} onClose={ui.closeModal} />

      <ExportModal
        isOpen={ui.activeModal.type === 'export'}
        onClose={ui.closeModal}
        baselines={baselines}
        onExport={handleExport}
        artifactCounts={{
          requirements: globalRequirements.filter(
            (r) => !r.isDeleted && currentProject?.requirementIds.includes(r.id)
          ).length,
          useCases: globalUseCases.filter(
            (u) => !u.isDeleted && currentProject?.useCaseIds.includes(u.id)
          ).length,
          testCases: globalTestCases.filter(
            (t) => !t.isDeleted && currentProject?.testCaseIds.includes(t.id)
          ).length,
          information: globalInformation.filter(
            (i) => !i.isDeleted && currentProject?.informationIds.includes(i.id)
          ).length,
          risks: risks.filter((r) => !r.isDeleted && currentProject?.riskIds.includes(r.id)).length,
          links: projectLinks.length,
        }}
      />

      <AdvancedSearchModal
        isOpen={ui.activeModal.type === 'search'}
        onClose={ui.closeModal}
        onNavigateToArtifact={(type, id) => {
          // Navigate to the artifact by opening its modal
          switch (type) {
            case 'requirement': {
              const req = globalRequirements.find((r) => r.id === id);
              if (req) {
                ui.openModal('requirement', true, {
                  id,
                  type: 'requirement',
                  data: req as unknown as Record<string, unknown>,
                });
              }
              break;
            }
            case 'useCase': {
              const uc = globalUseCases.find((u) => u.id === id);
              if (uc) {
                ui.openModal('usecase', true, {
                  id,
                  type: 'usecase',
                  data: uc as unknown as Record<string, unknown>,
                });
              }
              break;
            }
            case 'testCase': {
              const tc = globalTestCases.find((t) => t.id === id);
              if (tc) {
                ui.openModal('testcase', true, { id, type: 'testcase' });
              }
              break;
            }
            case 'information': {
              const info = globalInformation.find((i) => i.id === id);
              if (info) {
                ui.openModal('information', true, {
                  id,
                  type: 'information',
                  data: info as unknown as Record<string, unknown>,
                });
              }
              break;
            }
            case 'risk': {
              const risk = risks.find((r) => r.id === id);
              if (risk) {
                ui.openModal('risk', true, {
                  id,
                  type: 'risk',
                  data: risk as unknown as Record<string, unknown>,
                });
              }
              break;
            }
          }
        }}
      />

      {/* Custom Attribute Definition Modal - for creating new custom attributes */}
      <CustomAttributeDefinitionModal
        isOpen={ui.activeModal.type === 'custom-attribute'}
        definition={null}
        onClose={ui.closeModal}
        onSubmit={async (data) => {
          await diskCustomAttributeService.createDefinition(data);
          ui.closeModal();
        }}
      />

      {/* Workflow Modal - for creating and editing workflows */}
      <WorkflowModal isOpen={ui.activeModal.type === 'workflow'} onClose={ui.closeModal} />
    </>
  );
};
