import { Routes, Route, Navigate } from 'react-router-dom';
import { ProjectLayout } from '../layouts/ProjectLayout';
import {
  RequirementsPage,
  TraceabilityDashboardPage,
  UseCasesPage,
  TestCasesPage,
  InformationPage,
  RisksPage,
  GlobalLibraryPage,
  CustomAttributesPage,
  ProjectManual as HelpPage,
  HelpCenter,
  EngineeringGuide,
  DocumentsPage,
} from '../pages';
import { LinksPage } from '../pages/LinksPage';
import { WorkflowsPage } from '../pages/WorkflowsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProjectLayout />}>
        <Route index element={<Navigate to="/requirements" replace />} />

        <Route path="requirements" element={<RequirementsPage />} />
        <Route path="traceability" element={<TraceabilityDashboardPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="documents" element={<DocumentsPage />} />

        <Route path="use-cases" element={<UseCasesPage />} />
        <Route path="test-cases" element={<TestCasesPage />} />
        <Route path="information" element={<InformationPage />} />
        <Route path="risks" element={<RisksPage />} />

        <Route path="library/:type" element={<GlobalLibraryPage />} />

        <Route path="custom-attributes" element={<CustomAttributesPage />} />
        <Route path="help">
          <Route index element={<HelpCenter />} />
          <Route path="manual" element={<HelpPage />} />
          <Route path="guide" element={<EngineeringGuide />} />
        </Route>
      </Route>
    </Routes>
  );
}
