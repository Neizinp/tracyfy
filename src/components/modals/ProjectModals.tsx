import React from 'react';
import { ProjectSettingsModal } from '../';
import type { ProjectSettingsValues } from '../ProjectSettingsModal';
import { useAppStore } from '../../state';

export const ProjectModals: React.FC = () => {
  const isOpen = useAppStore((s) => s.activeModal.type === 'project-settings');
  const closeModal = useAppStore((s) => s.closeModal);
  const project = useAppStore((s) => s.project);
  const lifecycle = useAppStore((s) => s.settings.lifecycle);
  const updateProject = useAppStore((s) => s.updateProject);
  const updateLifecycleSettings = useAppStore((s) => s.updateLifecycleSettings);

  const save = async ({ reviewOnContentChange, ...edited }: ProjectSettingsValues) => {
    await updateProject(edited);
    // tracyfy.yaml only changes for a setting that changed
    if (reviewOnContentChange !== lifecycle.reviewOnContentChange) {
      await updateLifecycleSettings({ reviewOnContentChange });
    }
  };

  return (
    <ProjectSettingsModal
      isOpen={isOpen}
      project={project}
      lifecycle={lifecycle}
      onClose={closeModal}
      onSave={save}
    />
  );
};
