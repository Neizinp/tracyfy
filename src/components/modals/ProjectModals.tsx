import React from 'react';
import { ProjectSettingsModal, CreateProjectModal } from '../';
import { useUI, useProject, useFileSystem } from '../../app/providers';

export const ProjectModals: React.FC = () => {
  const ui = useUI();
  const { projects, updateProject, deleteProject, createProject } = useProject();
  const { reloadData } = useFileSystem();

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
          onCopy={async (originalProject, newName, newDescription) => {
            const { diskProjectService } = await import('../../services/diskProjectService');
            await diskProjectService.copyProject(originalProject, newName, newDescription);
            await reloadData();
          }}
        />
      )}

      {ui.activeModal.type === 'project' && !ui.activeModal.isEdit && (
        <CreateProjectModal isOpen={true} onClose={ui.closeModal} onSubmit={createProject} />
      )}
    </>
  );
};
