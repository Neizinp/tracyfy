import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUI, useGlobalState } from '../app/providers';
import { getTypeFromId, ARTIFACT_CONFIG } from '../constants/artifactConfig';
import type { ModalType, SelectedArtifact } from '../types';

/**
 * Hook to handle deep linking to artifacts via URL search parameters.
 * When an 'id' parameter is present in the URL, it automatically opens
 * the corresponding artifact modal.
 */
export function useArtifactDeepLink() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openModal, activeModal, selectedArtifact } = useUI();
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation, globalRisks } =
    useGlobalState();

  // Track the last processed ID to avoid re-opening if it was manually closed
  const lastProcessedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');

    // Only proceed if we have an ID, no modal is currently open,
    // and we haven't just processed this exact ID.
    if (!id || activeModal.type || id === lastProcessedIdRef.current) {
      // If the ID was removed from URL, reset the ref so it can be re-opened later
      if (!id) {
        lastProcessedIdRef.current = null;
      }
      return;
    }

    const configKey = getTypeFromId(id);
    const config = ARTIFACT_CONFIG[configKey];
    if (!config) return;

    // Mapping from config type to modal type if they differ
    const modalType = config.type as ModalType;

    // Find artifact in the global pool (not just current project)
    let artifactData: unknown = null;
    switch (modalType) {
      case 'requirement':
        artifactData = globalRequirements.find((r) => r.id === id);
        break;
      case 'usecase':
        artifactData = globalUseCases.find((u) => u.id === id);
        break;
      case 'testcase':
        artifactData = globalTestCases.find((t) => t.id === id);
        break;
      case 'information':
        artifactData = globalInformation.find((i) => i.id === id);
        break;
      case 'risk':
        artifactData = globalRisks.find((r) => r.id === id);
        break;
      default:
        return;
    }

    if (artifactData) {
      lastProcessedIdRef.current = id;
      openModal(modalType, true, {
        id,
        type: modalType as SelectedArtifact['type'],
        data: artifactData as Record<string, unknown>,
      });
    }
  }, [
    searchParams,
    openModal,
    activeModal.type,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalRisks,
  ]);

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
      if (getTypeFromId(currentId) !== 'unknown') {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('id');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [activeModal.type, selectedArtifact?.id, searchParams, setSearchParams]);
}
