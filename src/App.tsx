import { StoreProvider } from './state';
import { AppContent } from './app/AppContent';
import { StatusBar, ToastContainer } from './components';

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
      <StatusBar />
      <ToastContainer />
    </StoreProvider>
  );
}
