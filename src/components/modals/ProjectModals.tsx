import React from 'react';
import { ProjectSettingsModal, CreateProjectModal } from '../';
import { useUI, useProject } from '../../app/providers';

export const ProjectModals: React.FC = () => {
  const ui = useUI();
  const { projects, updateProject, deleteProject, createProject } = useProject();

  return (
    <>
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
        />
      )}

      {ui.activeModal.type === 'project' && !ui.activeModal.isEdit && (
        <CreateProjectModal isOpen={true} onClose={ui.closeModal} onSubmit={createProject} />
      )}
    </>
  );
};
