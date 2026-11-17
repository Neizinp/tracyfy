import React from 'react';
import { ProjectSettingsModal } from '../';
import { useAppStore } from '../../state';

export const ProjectModals: React.FC = () => {
  const isOpen = useAppStore((s) => s.activeModal.type === 'project-settings');
  const closeModal = useAppStore((s) => s.closeModal);
  const project = useAppStore((s) => s.project);
  const updateProject = useAppStore((s) => s.updateProject);

  return (
    <ProjectSettingsModal
      isOpen={isOpen}
      project={project}
      onClose={closeModal}
      onSave={updateProject}
    />
  );
};
