import { AppProviders } from './app/AppProviders';
import { AppContent } from './app/AppContent';
import { StatusBar } from './components';

export default function App() {
  return (
    <AppProviders>
      <AppContent />
      <StatusBar />
    </AppProviders>
  );
}
