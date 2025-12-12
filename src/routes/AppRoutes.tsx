import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectLayout } from '../layouts/ProjectLayout';
import {
  RequirementsPage,
  TraceabilityDashboardPage,
  UseCasesPage,
  TestCasesPage,
  InformationPage,
  GlobalLibraryPage,
} from '../pages';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProjectLayout />}>
        <Route index element={<Navigate to="/requirements" replace />} />

        <Route path="requirements" element={<RequirementsPage />} />
        <Route path="traceability" element={<TraceabilityDashboardPage />} />

        <Route path="use-cases" element={<UseCasesPage />} />
        <Route path="test-cases" element={<TestCasesPage />} />
        <Route path="information" element={<InformationPage />} />

        <Route path="library/:type" element={<GlobalLibraryPage />} />
      </Route>
    </Routes>
  );
}
