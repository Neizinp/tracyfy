import { AppRoutes } from '../routes/AppRoutes';
import { DirectorySelector, UserOnboardingModal } from '../components';
import { useAppStore } from '../state';
import { isE2EMode } from '../state/e2e';
import { useArtifactDeepLink } from '../hooks/useArtifactDeepLink';

export function AppContent() {
  useArtifactDeepLink();
  const isReady = useAppStore((s) => s.isReady);
  const isLoading = useAppStore((s) => s.isLoading);
  const isUserLoading = useAppStore((s) => s.isUserLoading);
  const hasUser = useAppStore((s) => s.currentUser !== null);
  const setIdentity = useAppStore((s) => s.setIdentity);

  const showDirectorySelector = !isReady && !isLoading;
  // The repository has no user.name yet: ask who the user is
  const showUserOnboarding = !isE2EMode() && isReady && !isUserLoading && !hasUser;

  return (
    <>
      <AppRoutes />
      {showDirectorySelector && <DirectorySelector />}
      <UserOnboardingModal isOpen={showUserOnboarding} onSubmit={setIdentity} />
    </>
  );
}
