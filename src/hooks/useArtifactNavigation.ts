import { useCallback } from 'react';
import { useUI } from '../app/providers';
import { useOpenArtifact } from './useOpenArtifact';

/**
 * Navigate from the open artifact to a linked one: remember the current
 * artifact (for "back"), close its dialog and open the target's.
 *
 * @param onClose Optional callback to close the current modal (if not using ui.closeModal)
 */
export function useArtifactNavigation(onClose?: () => void) {
  const { setActiveModal, selectedArtifact, pushNavigationStack } = useUI();
  const openArtifact = useOpenArtifact();

  return useCallback(
    (id: string) => {
      if (selectedArtifact) {
        pushNavigationStack(selectedArtifact);
      }
      if (onClose) {
        onClose();
      } else {
        setActiveModal({ type: null });
      }
      openArtifact(id);
    },
    [onClose, setActiveModal, selectedArtifact, pushNavigationStack, openArtifact]
  );
}
