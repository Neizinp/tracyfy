import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { ProjectLayout } from '../layouts/ProjectLayout';
// Landing page stays in the main bundle; everything else is loaded on demand
import { RequirementsPage } from '../pages/RequirementsPage';

const TraceabilityDashboardPage = lazy(() =>
  import('../pages/TraceabilityDashboardPage').then((m) => ({
    default: m.TraceabilityDashboardPage,
  }))
);
const UseCasesPage = lazy(() =>
  import('../pages/UseCasesPage').then((m) => ({ default: m.UseCasesPage }))
);
const TestCasesPage = lazy(() =>
  import('../pages/TestCasesPage').then((m) => ({ default: m.TestCasesPage }))
);
const InformationPage = lazy(() =>
  import('../pages/InformationPage').then((m) => ({ default: m.InformationPage }))
);
const RisksPage = lazy(() => import('../pages/RisksPage').then((m) => ({ default: m.RisksPage })));
const CustomAttributesPage = lazy(() =>
  import('../pages/CustomAttributesPage').then((m) => ({ default: m.CustomAttributesPage }))
);
const HelpCenter = lazy(() =>
  import('../pages/HelpCenter').then((m) => ({ default: m.HelpCenter }))
);
const EngineeringGuide = lazy(() =>
  import('../pages/EngineeringGuide').then((m) => ({ default: m.EngineeringGuide }))
);
const DocumentsPage = lazy(() =>
  import('../pages/DocumentsPage').then((m) => ({ default: m.DocumentsPage }))
);
const LinksPage = lazy(() => import('../pages/LinksPage').then((m) => ({ default: m.LinksPage })));
const WorkflowsPage = lazy(() =>
  import('../pages/WorkflowsPage').then((m) => ({ default: m.WorkflowsPage }))
);
const HelpPage = lazy(() =>
  import('../pages/ProjectManual').then((m) => ({ default: m.ProjectManual }))
);

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
