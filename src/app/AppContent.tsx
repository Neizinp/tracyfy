import { AppRoutes } from '../routes/AppRoutes';
import { LoadingOverlay } from '../components';
import { useProject } from './providers';

export function AppContent() {
    const { isLoading } = useProject();

    if (isLoading) {
        return <LoadingOverlay isLoading={true} />;
    }

    return <AppRoutes />;
}
