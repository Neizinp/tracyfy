import { activeIds } from '../../utils/activeArtifacts';
import React, { useCallback } from 'react';
import {
  LinkModal,
  VersionHistory,
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
  useBackgroundTaskActions,
  useBaselines,
  useRisks,
  useDocuments,
  useFileSystem,
  useToast,
} from '../../app/providers';
import { diskCustomAttributeService } from '../../services/diskCustomAttributeService';
import { exportProjectToJSON } from '../../utils/jsonExportUtils';
import type {
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
import { useLinkableArtifacts } from '../../hooks/useLinkableArtifacts';
import { notifyError } from '../../app/providers/ToastProvider';

export const ManagementModals: React.FC = () => {
  const ui = useUI();
  const { project } = useProject();

  const { requirements, useCases, testCases, information } = useGlobalState();

  const { baselines, createBaseline } = useBaselines();
  const { risks } = useRisks();
  const { documents } = useDocuments();
  const { currentUser } = useUser();
  const { startTask, endTask } = useBackgroundTaskActions();
  const { links, createLink } = useFileSystem();
  const linkableArtifacts = useLinkableArtifacts();
  const { showToast } = useToast();

  const handleExport = useCallback(
    async (options: ExportOptions) => {
      const reqIds = options.includeRequirements ? activeIds(requirements) : [];
      const ucIds = options.includeUseCases ? activeIds(useCases) : [];
      const tcIds = options.includeTestCases ? activeIds(testCases) : [];
      const infoIds = options.includeInformation ? activeIds(information) : [];

      const globalState = {
        requirements: requirements,
        useCases: useCases,
        testCases: testCases,
        information: information,
        risks: risks,
        documents: documents,
      };

      try {
        switch (options.format) {
          case 'pdf': {
            const taskId = startTask('Exporting PDF...');
            try {
              const { exportProjectToPDF } = await import('../../utils/pdfExportUtils');
              await exportProjectToPDF(
                project,
                globalState,
                reqIds,
                ucIds,
                tcIds,
                infoIds,
                baselines,
                options.baseline,
                currentUser?.name,
                options.includeDocuments,
                documents.filter((d) => !d.isDeleted)
              );
            } finally {
              endTask(taskId);
            }
            break;
          }
          case 'excel': {
            const taskId = startTask('Exporting to Excel...');
            try {
              const { exportProjectToExcel } = await import('../../utils/excelExportUtils');
              await exportProjectToExcel(
                project,
                globalState,
                reqIds,
                ucIds,
                tcIds,
                infoIds,
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
                project,
                globalState,
                reqIds,
                ucIds,
                tcIds,
                infoIds,
                activeIds(risks),
                activeIds(documents)
              );
            } finally {
              endTask(taskId);
            }
            break;
          }
        }
      } catch (error) {
        notifyError('Export failed', error);
      }
    },
    [
      project,
      requirements,
      useCases,
      testCases,
      information,
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
      const sourceId = newLink.sourceId || ui.linkSourceId;
      if (!sourceId) {
        showToast('Select a source artifact for the link', 'warning');
        return;
      }

      const duplicate = links.some(
        (l) => l.sourceId === sourceId && l.targetId === newLink.targetId && l.type === newLink.type
      );
      if (duplicate) {
        showToast(`${sourceId} already has this link to ${newLink.targetId}`, 'warning');
        ui.setIsLinkModalOpen(false);
        return;
      }

      try {
        const link = await createLink(sourceId, newLink.targetId, newLink.type as LinkType);
        showToast(`Created link ${link.id}: ${sourceId} → ${newLink.targetId}`, 'success');
      } catch (error) {
        console.error('Failed to create link:', error);
        showToast(
          `Failed to create link: ${error instanceof Error ? error.message : String(error)}`,
          'error'
        );
      }
      ui.setIsLinkModalOpen(false);
    },
    [ui, links, createLink, showToast]
  );

  const handleSelectArtifact = useCallback(
    (artifactId: string, artifactType: string) => {
      switch (artifactType) {
        case 'requirements': {
          const req = requirements.find((r: Requirement) => r.id === artifactId);
          if (req) {
            ui.setEditingRequirement(req);
            ui.setIsEditRequirementModalOpen(true);
          }
          break;
        }
        case 'usecases': {
          const uc = useCases.find((u: UseCase) => u.id === artifactId);
          if (uc) {
            ui.setEditingUseCase(uc);
            ui.setIsUseCaseModalOpen(true);
          }
          break;
        }
        case 'testcases': {
          const tc = testCases.find((t: TestCase) => t.id === artifactId);
          if (tc) {
            ui.setSelectedTestCaseId(tc.id);
            ui.setIsEditTestCaseModalOpen(true);
          }
          break;
        }
        case 'information': {
          const info = information.find((i: Information) => i.id === artifactId);
          if (info) {
            ui.setSelectedInformation(info);
            ui.setIsInformationModalOpen(true);
          }
          break;
        }
      }
    },
    [ui, requirements, useCases, testCases, information]
  );

  const handleCreateBaselineWrapper = useCallback(
    async (name: string, message: string) => {
      await createBaseline(name, message, name);
    },
    [createBaseline]
  );

  return (
    <>
      <LinkModal
        isOpen={ui.activeModal.type === 'link'}
        // Only an explicitly chosen source; never whatever artifact happens to be selected
        sourceArtifactId={ui.linkSourceId}
        sourceArtifactType={ui.linkSourceType || 'requirement'}
        artifactsByType={linkableArtifacts}
        onClose={ui.closeModal}
        onAddLink={handleAddArtifactLink}
      />

      <VersionHistory
        isOpen={ui.activeModal.type === 'history'}
        baselines={baselines}
        onClose={ui.closeModal}
        onCreateBaseline={handleCreateBaselineWrapper}
        onSelectArtifact={handleSelectArtifact}
      />

      <UserSettingsModal isOpen={ui.activeModal.type === 'user-settings'} onClose={ui.closeModal} />

      <ExportModal
        isOpen={ui.activeModal.type === 'export'}
        onClose={ui.closeModal}
        baselines={baselines}
        onExport={handleExport}
        artifactCounts={{
          requirements: activeIds(requirements).length,
          useCases: activeIds(useCases).length,
          testCases: activeIds(testCases).length,
          information: activeIds(information).length,
          risks: activeIds(risks).length,
          documents: activeIds(documents).length,
          links: activeIds(links).length,
        }}
      />

      <AdvancedSearchModal
        isOpen={ui.activeModal.type === 'search'}
        onClose={ui.closeModal}
        onNavigateToArtifact={(type: string, id: string) => {
          switch (type) {
            case 'requirement': {
              const req = requirements.find((r: Requirement) => r.id === id);
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
              const uc = useCases.find((u: UseCase) => u.id === id);
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
              const tc = testCases.find((t: TestCase) => t.id === id);
              if (tc) {
                ui.openModal('testcase', true, { id, type: 'testcase' });
              }
              break;
            }
            case 'information': {
              const info = information.find((i: Information) => i.id === id);
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
