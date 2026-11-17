import React from 'react';
import { ProjectSettingsModal } from '../';
import { useUI } from '../../app/providers';
import { useAppStore } from '../../state';

export const ProjectModals: React.FC = () => {
  const ui = useUI();
  const project = useAppStore((s) => s.project);
  const updateProject = useAppStore((s) => s.updateProject);

  return (
    <ProjectSettingsModal
      isOpen={ui.activeModal.type === 'project-settings'}
      project={project}
      onClose={ui.closeModal}
      onSave={updateProject}
    />
  );
};
