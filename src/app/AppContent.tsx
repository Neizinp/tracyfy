import { AppRoutes } from '../routes/AppRoutes';
import { LoadingOverlay, DirectorySelector, UserOnboardingModal } from '../components';
import { useProject, useFileSystem, useUser } from './providers';

export function AppContent() {
  const { isLoading } = useProject();
  const fileSystem = useFileSystem();
  const { users, createUser, switchUser } = useUser();

  // Show directory selector if filesystem not ready
  if (!fileSystem.isReady) {
    return <DirectorySelector />;
  }

  if (isLoading) {
    return <LoadingOverlay isLoading={true} />;
  }

  // Show user onboarding if no users exist
  const handleCreateFirstUser = async (name: string) => {
    const newUser = await createUser(name);
    if (newUser) {
      switchUser(newUser.id);
    }
  };

  return (
    <>
      <AppRoutes />
      <UserOnboardingModal isOpen={users.length === 0} onCreateUser={handleCreateFirstUser} />
    </>
  );
}
