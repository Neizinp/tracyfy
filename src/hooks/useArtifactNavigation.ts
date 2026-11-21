import { useCallback } from 'react';
import { useAppStore } from '../state';
import { useOpenArtifact } from './useOpenArtifact';

/**
 * Navigate from the open artifact to a linked one: remember the current
 * artifact (for "back"), close its dialog and open the target's.
 *
 * @param onClose Optional callback to close the current modal (if not using ui.closeModal)
 */
export function useArtifactNavigation(onClose?: () => void) {
  const setActiveModal = useAppStore((s) => s.setActiveModal);
  const selectedArtifact = useAppStore((s) => s.selectedArtifact);
  const pushNavigationStack = useAppStore((s) => s.pushNavigationStack);
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
