import React from 'react';
import { ProjectSettingsModal } from '../';
import { useUI, useProject } from '../../app/providers';

export const ProjectModals: React.FC = () => {
  const ui = useUI();
  const { project, updateProject } = useProject();

  return (
    <ProjectSettingsModal
      isOpen={ui.activeModal.type === 'project-settings'}
      project={project}
      onClose={ui.closeModal}
      onSave={updateProject}
    />
  );
};
