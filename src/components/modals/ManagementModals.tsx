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
import { exportProjectToJSON } from '../../utils/jsonExportUtils';
import type { ExportOptions } from '../../types';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import type { LinkModalResult } from '../LinkModal';
import { useLinkableArtifacts } from '../../hooks/useLinkableArtifacts';
import { useOpenArtifact } from '../../hooks/useOpenArtifact';
import { notifyError, useAppStore } from '../../state';

export const ManagementModals: React.FC = () => {
  const activeModal = useAppStore((s) => s.activeModal);
  const closeModal = useAppStore((s) => s.closeModal);
  const addAttributeDefinition = useAppStore((s) => s.addAttributeDefinition);
  const linkSourceId = useAppStore((s) => s.linkSourceId);
  const linkSourceType = useAppStore((s) => s.linkSourceType);
  const project = useAppStore((s) => s.project);

  const requirements = useAppStore((s) => s.artifacts.requirement);
  const useCases = useAppStore((s) => s.artifacts.useCase);
  const testCases = useAppStore((s) => s.artifacts.testCase);
  const information = useAppStore((s) => s.artifacts.information);
  const baselines = useAppStore((s) => s.baselines);
  const createBaseline = useAppStore((s) => s.createBaseline);
  const risks = useAppStore((s) => s.artifacts.risk);
  const documents = useAppStore((s) => s.artifacts.document);
  const currentUser = useAppStore((s) => s.currentUser);
  const startTask = useAppStore((s) => s.startTask);
  const endTask = useAppStore((s) => s.endTask);
  const links = useAppStore((s) => s.links);
  const createLink = useAppStore((s) => s.createLink);
  const linkableArtifacts = useLinkableArtifacts();
  const showToast = useAppStore((s) => s.showToast);
  const openArtifact = useOpenArtifact();

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
      const sourceId = newLink.sourceId || linkSourceId;
      if (!sourceId) {
        showToast('Select a source artifact for the link', 'warning');
        return;
      }

      const duplicate = links.some(
        (l) => l.sourceId === sourceId && l.targetId === newLink.targetId && l.type === newLink.type
      );
      if (duplicate) {
        showToast(`${sourceId} already has this link to ${newLink.targetId}`, 'warning');
        closeModal();
        return;
      }

      try {
        const link = await createLink(sourceId, newLink.targetId, newLink.type);
        showToast(`Created link ${link.id}: ${sourceId} → ${newLink.targetId}`, 'success');
      } catch (error) {
        console.error('Failed to create link:', error);
        showToast(
          `Failed to create link: ${error instanceof Error ? error.message : String(error)}`,
          'error'
        );
      }
      closeModal();
    },
    [linkSourceId, closeModal, links, createLink, showToast]
  );

  const handleCreateBaselineWrapper = useCallback(
    async (name: string, message: string) => {
      await createBaseline(name, message);
    },
    [createBaseline]
  );

  return (
    <>
      <LinkModal
        isOpen={activeModal.type === 'link'}
        // Only an explicitly chosen source; never whatever artifact happens to be selected
        sourceArtifactId={linkSourceId}
        sourceArtifactType={linkSourceType || 'requirement'}
        artifactsByType={linkableArtifacts}
        onClose={closeModal}
        onAddLink={handleAddArtifactLink}
      />

      <VersionHistory
        isOpen={activeModal.type === 'history'}
        baselines={baselines}
        onClose={closeModal}
        onCreateBaseline={handleCreateBaselineWrapper}
        onSelectArtifact={openArtifact}
      />

      <UserSettingsModal isOpen={activeModal.type === 'user-settings'} onClose={closeModal} />

      <ExportModal
        isOpen={activeModal.type === 'export'}
        onClose={closeModal}
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
        isOpen={activeModal.type === 'search'}
        onClose={closeModal}
        onNavigateToArtifact={(_type: string, id: string) => openArtifact(id)}
      />

      <CustomAttributeDefinitionModal
        isOpen={activeModal.type === 'custom-attribute'}
        definition={null}
        onClose={closeModal}
        onSubmit={async (
          data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>
        ) => {
          await addAttributeDefinition(data);
          closeModal();
        }}
      />

      <WorkflowModal isOpen={activeModal.type === 'workflow'} onClose={closeModal} />
    </>
  );
};
