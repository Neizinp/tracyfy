import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { isKindId } from '../../domain/artifactKinds';
import { useAppStore } from '../../state';
import { ArtifactDialog } from '../../ui/generic/ArtifactDialog';

/** The dialog of the artifact being created or edited, whatever its kind */
export const ArtifactModals: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeModal = useAppStore((s) => s.activeModal);
  const selectedId = useAppStore((s) => s.selectedArtifact?.id);
  const closeModal = useAppStore((s) => s.closeModal);
  const clearNavigationStack = useAppStore((s) => s.clearNavigationStack);
  const canGoBack = useAppStore((s) => s.navigationStack.length > 0);
  const popNavigationStack = useAppStore((s) => s.popNavigationStack);
  const kindId = isKindId(activeModal.type) ? activeModal.type : null;
  // The dialog shows the artifact as it is in the store now, not a copy from when it opened
  const artifact = useAppStore((s) =>
    kindId && selectedId
      ? ((s.artifacts[kindId] as { id: string }[]).find((a) => a.id === selectedId) ?? null)
      : null
  );

  // No dialog for an artifact that is gone (e.g. deleted elsewhere)
  if (!kindId || (selectedId && !artifact)) return null;

  const handleFullClose = () => {
    // Dispatch event to block deep link from re-opening
    window.dispatchEvent(new CustomEvent('modal-closing'));
    closeModal();
    clearNavigationStack();
    // Navigate to remove ?id= from URL
    if (searchParams.has('id')) {
      navigate(location.pathname, { replace: true });
    }
  };

  return (
    <ArtifactDialog
      // A new mount per artifact, so the form starts from that artifact
      key={`${kindId}:${artifact ? selectedId : 'new'}`}
      kindId={kindId}
      artifact={artifact as Record<string, unknown> | null}
      onClose={handleFullClose}
      onBack={canGoBack ? popNavigationStack : undefined}
    />
  );
};
