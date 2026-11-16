import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI } from '../app/providers';
import { kindOfId } from '../domain/artifactKinds';
import { useOpenArtifact } from './useOpenArtifact';

/**
 * Hook to handle deep linking to artifacts via URL search parameters.
 * When an 'id' parameter is present in the URL, it automatically opens
 * the corresponding artifact modal.
 */
export function useArtifactDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeModal, selectedArtifact } = useUI();
  const openArtifact = useOpenArtifact();

  // Track the last processed ID to avoid re-opening if it was manually closed
  const lastProcessedIdRef = useRef<string | null>(null);

  // Track if user just manually closed the modal - block re-opening for a short time
  const closedManuallyRef = useRef<boolean>(false);

  // Listen for 'modal-closing' event dispatched by handleFullClose
  useEffect(() => {
    const handleModalClosing = () => {
      closedManuallyRef.current = true;
      // Reset after a short delay
      setTimeout(() => {
        closedManuallyRef.current = false;
      }, 200);
    };
    window.addEventListener('modal-closing', handleModalClosing);
    return () => window.removeEventListener('modal-closing', handleModalClosing);
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');

    // Block if user just manually closed
    if (closedManuallyRef.current) {
      return;
    }

    // Only proceed if we have an ID, no modal is currently open,
    // and we haven't just processed this exact ID.
    if (!id || activeModal.type || id === lastProcessedIdRef.current) {
      // If the ID was removed from URL, reset the ref so it can be re-opened later
      if (!id) {
        lastProcessedIdRef.current = null;
      }
      return;
    }

    if (openArtifact(id)) {
      lastProcessedIdRef.current = id;
    }
  }, [searchParams, openArtifact, activeModal.type]);

  // Sync modal state back to URL parameters
  useEffect(() => {
    const currentId = searchParams.get('id');

    if (activeModal.type && selectedArtifact?.id) {
      // If modal is open and URL doesn't match, update URL
      if (currentId !== selectedArtifact.id) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('id', selectedArtifact.id);
        setSearchParams(newParams, { replace: true });
      }
    } else if (!activeModal.type && currentId) {
      // If modal is closed but URL still has ID, remove it
      // Only remove if it looks like an artifact ID to avoid breaking other features
      if (kindOfId(currentId)) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [activeModal.type, selectedArtifact?.id, searchParams, setSearchParams]);
}
