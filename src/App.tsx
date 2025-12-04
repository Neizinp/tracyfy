import { AppProviders } from './app/AppProviders';
import { AppContent } from './app/AppContent';

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
