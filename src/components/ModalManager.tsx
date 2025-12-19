import React from 'react';
import { ArtifactModals, ProjectModals, ManagementModals } from './modals';

/**
 * ModalManager
 *
 * This component acts as a high-level orchestrator for all modals in the application.
 * It has been refactored into modular sub-components to reduce coupling and improve maintainability.
 */
export const ModalManager: React.FC = () => {
  return (
    <>
      <ArtifactModals />
      <ProjectModals />
      <ManagementModals />
    </>
  );
};
