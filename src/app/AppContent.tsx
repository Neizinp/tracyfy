import { AppRoutes } from '../routes/AppRoutes';
import { LoadingOverlay, DirectorySelector } from '../components';
import { useProject, useFileSystem } from './providers';

export function AppContent() {
    const { isLoading } = useProject();
    const fileSystem = useFileSystem();

    // Show directory selector if filesystem not ready
    if (!fileSystem.isReady) {
        return <DirectorySelector />;
    }

    if (isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    return <AppRoutes />;
}
