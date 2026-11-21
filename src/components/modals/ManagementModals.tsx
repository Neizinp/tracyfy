import React, { useCallback } from 'react';
import {
  LinkModal,
  VersionHistory,
  UserSettingsModal,
  ExportModal,
  AdvancedSearchModal,
  CustomAttributeDefinitionModal,
} from '../';
import type { CustomAttributeDefinition } from '../../types/customAttributes';
import type { LinkModalResult } from '../LinkModal';
import { useLinkableArtifacts } from '../../hooks/useLinkableArtifacts';
import { useOpenArtifact } from '../../hooks/useOpenArtifact';
import { useAppStore } from '../../state';

export const ManagementModals: React.FC = () => {
  const activeModal = useAppStore((s) => s.activeModal);
  const closeModal = useAppStore((s) => s.closeModal);
  const addAttributeDefinition = useAppStore((s) => s.addAttributeDefinition);
  const linkSourceId = useAppStore((s) => s.linkSourceId);
  const linkSourceType = useAppStore((s) => s.linkSourceType);
  const baselines = useAppStore((s) => s.baselines);
  const createBaseline = useAppStore((s) => s.createBaseline);
  const links = useAppStore((s) => s.links);
  const createLink = useAppStore((s) => s.createLink);
  const linkableArtifacts = useLinkableArtifacts();
  const showToast = useAppStore((s) => s.showToast);
  const openArtifact = useOpenArtifact();

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

      <ExportModal isOpen={activeModal.type === 'export'} onClose={closeModal} />

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
    </>
  );
};
