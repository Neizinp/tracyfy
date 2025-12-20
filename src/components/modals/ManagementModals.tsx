import React, { useState, useEffect, useCallback } from 'react';
import {
  LinkModal,
  VersionHistory,
  GlobalLibraryModal,
  UserSettingsModal,
  ExportModal,
  AdvancedSearchModal,
  CustomAttributeDefinitionModal,
  WorkflowModal,
} from '../';
import {
  useUI,
  useProject,
  useGlobalState,
  useUser,
  useBackgroundTasks,
  useBaselines,
  useRisks,
  useDocuments,
} from '../../app/providers';
import { diskLinkService } from '../../services/diskLinkService';
import { diskCustomAttributeService } from '../../services/diskCustomAttributeService';
import { exportProjectToPDF } from '../../utils/pdfExportUtils';
import { exportProjectToExcel } from '../../utils/excelExportUtils';
import { exportProjectToJSON } from '../../utils/jsonExportUtils';
import type {
  Link,
  LinkType,
  ExportOptions,
  Requirement,
  UseCase,
  TestCase,
  Information,
  Risk,
} from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import type { LinkModalResult } from '../LinkModal';

export const ManagementModals: React.FC = () => {
  const ui = useUI();
  const { projects, currentProjectId, currentProject, addToProject } = useProject();

  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();

  const { baselines, createBaseline } = useBaselines();
  const { risks } = useRisks();
  const { documents } = useDocuments();
  const { currentUser } = useUser();
  const { startTask, endTask } = useBackgroundTasks();

  const [projectLinks, setProjectLinks] = useState<Link[]>([]);

  useEffect(() => {
    if (currentProjectId) {
      diskLinkService.getLinksForProject(currentProjectId).then(setProjectLinks);
    }
  }, [currentProjectId]);

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      if (!currentProject) return;

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
        documents: documents,
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
                currentUser?.name,
                options.includeDocuments,
                documents.filter(
                  (d) =>
                    !d.isDeleted &&
                    (d.projectId === currentProject.id ||
                      currentProject.documentIds?.includes(d.id))
                )
              );
            } finally {
              endTask(taskId);
            }
            break;
          }
          case 'excel': {
            const taskId = startTask('Exporting to Excel...');
            try {
              await exportProjectToExcel(
                currentProject,
                globalState,
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
              await exportProjectToJSON(
                currentProject,
                globalState,
                reqIds,
                ucIds,
                tcIds,
                infoIds,
                currentProject.riskIds || [],
                currentProject.documentIds || []
              );
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
      documents,
    ]
  );

  const handleAddArtifactLink = useCallback(
    async (newLink: LinkModalResult) => {
      const sourceId = ui.linkSourceId || ui.selectedRequirementId;
      if (!sourceId) return;

      try {
        await diskLinkService.createLink(
          sourceId,
          newLink.targetId,
          newLink.type as LinkType,
          newLink.projectIds
        );
      } catch (error) {
        console.error('Failed to create link:', error);
      }
      ui.setIsLinkModalOpen(false);
    },
    [ui]
  );

  const handleSelectArtifact = useCallback(
    (artifactId: string, artifactType: string) => {
      switch (artifactType) {
        case 'requirements': {
          const req = globalRequirements.find((r: Requirement) => r.id === artifactId);
          if (req) {
            ui.setEditingRequirement(req);
            ui.setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'usecases': {
          const uc = globalUseCases.find((u: UseCase) => u.id === artifactId);
          if (uc) {
            ui.setEditingUseCase(uc);
            ui.setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testcases': {
          const tc = globalTestCases.find((t: TestCase) => t.id === artifactId);
          if (tc) {
            ui.setSelectedTestCaseId(tc.id);
            ui.setIsEditTestCaseModalOpen(true);
          }
          break;
        }
        case 'information': {
          const info = globalInformation.find((i: Information) => i.id === artifactId);
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

  const handleCreateBaselineWrapper = useCallback(
    async (name: string, message: string) => {
      const version = name.includes(']') ? name.split(']').pop()?.trim() || name : name;
      await createBaseline(name, message, version);
    },
    [createBaseline]
  );

  return (
    <>
      <LinkModal
        isOpen={ui.activeModal.type === 'link'}
        sourceArtifactId={ui.linkSourceId || ui.selectedRequirementId}
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

      <VersionHistory
        isOpen={ui.activeModal.type === 'history'}
        baselines={baselines}
        projectName={currentProject?.name ?? null}
        onClose={ui.closeModal}
        onCreateBaseline={handleCreateBaselineWrapper}
        onSelectArtifact={handleSelectArtifact}
      />

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
            (r: Requirement) => !r.isDeleted && currentProject?.requirementIds.includes(r.id)
          ).length,
          useCases: globalUseCases.filter(
            (u: UseCase) => !u.isDeleted && currentProject?.useCaseIds.includes(u.id)
          ).length,
          testCases: globalTestCases.filter(
            (t: TestCase) => !t.isDeleted && currentProject?.testCaseIds.includes(t.id)
          ).length,
          information: globalInformation.filter(
            (i: Information) => !i.isDeleted && currentProject?.informationIds.includes(i.id)
          ).length,
          risks: risks.filter((r: Risk) => !r.isDeleted && currentProject?.riskIds.includes(r.id))
            .length,
          documents: documents.filter(
            (d) =>
              !d.isDeleted &&
              (d.projectId === currentProject?.id || currentProject?.documentIds?.includes(d.id))
          ).length,
          links: projectLinks.length,
        }}
      />

      <AdvancedSearchModal
        isOpen={ui.activeModal.type === 'search'}
        onClose={ui.closeModal}
        onNavigateToArtifact={(type: string, id: string) => {
          switch (type) {
            case 'requirement': {
              const req = globalRequirements.find((r: Requirement) => r.id === id);
              if (req) {
                ui.openModal('requirement', true, {
                  id,
                  type: 'requirement',
                  data: req as unknown as Record<string, unknown>,
                });
              }
              break;
            }
            case 'usecase': {
              const uc = globalUseCases.find((u: UseCase) => u.id === id);
              if (uc) {
                ui.openModal('usecase', true, {
                  id,
                  type: 'usecase',
                  data: uc as unknown as Record<string, unknown>,
                });
              }
              break;
            }
            case 'testcase': {
              const tc = globalTestCases.find((t: TestCase) => t.id === id);
              if (tc) {
                ui.openModal('testcase', true, { id, type: 'testcase' });
              }
              break;
            }
            case 'information': {
              const info = globalInformation.find((i: Information) => i.id === id);
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
              const risk = risks.find((r: Risk) => r.id === id);
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

      <CustomAttributeDefinitionModal
        isOpen={ui.activeModal.type === 'custom-attribute'}
        definition={null}
        onClose={ui.closeModal}
        onSubmit={async (
          data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>
        ) => {
          await diskCustomAttributeService.createDefinition(data);
          ui.closeModal();
        }}
      />

      <WorkflowModal isOpen={ui.activeModal.type === 'workflow'} onClose={ui.closeModal} />
    </>
  );
};
