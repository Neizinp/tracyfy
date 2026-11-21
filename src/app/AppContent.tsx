import { AppRoutes } from '../routes/AppRoutes';
import { DirectorySelector, UserOnboardingModal } from '../components';
import { useFileSystem, useUser } from './providers';
import { useArtifactDeepLink } from '../hooks/useArtifactDeepLink';

export function AppContent() {
  useArtifactDeepLink();
  const fileSystem = useFileSystem();
  const { currentUser, isLoading: isUserLoading, setIdentity } = useUser();

  const isE2E =
    typeof window !== 'undefined' &&
    (window as unknown as { __E2E_TEST_MODE__?: boolean }).__E2E_TEST_MODE__;

  const showDirectorySelector = !fileSystem.isReady && !fileSystem.isLoading;
  // The repository has no user.name yet: ask who the user is
  const showUserOnboarding = !isE2E && fileSystem.isReady && !isUserLoading && !currentUser;

  return (
    <>
      <AppRoutes />
      {showDirectorySelector && <DirectorySelector />}
      <UserOnboardingModal isOpen={showUserOnboarding} onSubmit={setIdentity} />
    </>
  );
}
