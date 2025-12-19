import { useCallback } from 'react';
import { useUI, useGlobalState } from '../app/providers';

/**
 * A hook to centralize navigation between linked artifacts.
 * Handles closing the current modal and opening the target artifact's modal.
 *
 * @param onClose Optional callback to close the current modal (if not using ui.closeModal)
 */
export function useArtifactNavigation(onClose?: () => void) {
  const { openModal, setActiveModal, selectedArtifact, pushNavigationStack } = useUI();
  const { requirements, useCases, information, risks } = useGlobalState();

  return useCallback(
    (id: string, type: string) => {
      // Push current artifact to stack if it exists
      if (selectedArtifact) {
        pushNavigationStack(selectedArtifact);
      }

      // Close the current modal (just clear type, keep stack)
      if (onClose) {
        onClose();
      } else {
        setActiveModal({ type: null });
      }

      // Navigate based on type
      switch (type.toLowerCase()) {
        case 'requirement': {
          const req = requirements.find((r) => r.id === id);
          if (req) {
            openModal('requirement', true, {
              id,
              type: 'requirement',
              data: req as unknown as Record<string, unknown>,
            });
          }
          break;
        }
        case 'usecase': {
          const uc = useCases.find((u) => u.id === id);
          if (uc) {
            openModal('usecase', true, {
              id,
              type: 'usecase',
              data: uc as unknown as Record<string, unknown>,
            });
          }
          break;
        }
        case 'testcase': {
          // Test cases lookup logic is slightly different across the app,
          // but for navigation we just trigger the edit modal with the ID.
          openModal('testcase', true, { id, type: 'testcase' });
          break;
        }
        case 'information': {
          const info = information.find((i) => i.id === id);
          if (info) {
            openModal('information', true, {
              id,
              type: 'information',
              data: info as unknown as Record<string, unknown>,
            });
          }
          break;
        }
        case 'risk': {
          const risk = risks.find((r) => r.id === id);
          if (risk) {
            openModal('risk', true, {
              id,
              type: 'risk',
              data: risk as unknown as Record<string, unknown>,
            });
          }
          break;
        }
      }
    },
    [
      onClose,
      setActiveModal,
      openModal,
      selectedArtifact,
      pushNavigationStack,
      requirements,
      useCases,
      information,
      risks,
    ]
  );
}
