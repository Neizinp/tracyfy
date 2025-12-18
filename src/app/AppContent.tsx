import { AppRoutes } from '../routes/AppRoutes';
import { DirectorySelector, UserOnboardingModal } from '../components';
import { useFileSystem, useUser } from './providers';

export function AppContent() {
  const fileSystem = useFileSystem();
  const { users, isLoading: isUserLoading, createUser, switchUser } = useUser();

  // Show user onboarding if no users exist
  const handleCreateFirstUser = async (name: string) => {
    const newUser = await createUser(name);
    if (newUser) {
      switchUser(newUser.id);
    }
  };

  const showDirectorySelector = !fileSystem.isReady && !fileSystem.isLoading;
  const showUserOnboarding = fileSystem.isReady && !isUserLoading && users.length === 0;

  return (
    <>
      <AppRoutes />
      {showDirectorySelector && <DirectorySelector />}
      <UserOnboardingModal isOpen={showUserOnboarding} onCreateUser={handleCreateFirstUser} />
    </>
  );
}
