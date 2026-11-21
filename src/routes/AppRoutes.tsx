import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import { ProjectLayout } from '../layouts/ProjectLayout';
// The artifact lists stay in the main bundle; everything else is loaded on demand
import { ArtifactsPage } from '../ui/generic/ArtifactsPage';
import { ARTIFACT_KINDS } from '../domain/artifactKinds';

const TraceabilityDashboardPage = lazy(() =>
  import('../pages/TraceabilityDashboardPage').then((m) => ({
    default: m.TraceabilityDashboardPage,
  }))
);
const CustomAttributesPage = lazy(() =>
  import('../pages/CustomAttributesPage').then((m) => ({ default: m.CustomAttributesPage }))
);
const HelpCenter = lazy(() =>
  import('../pages/HelpCenter').then((m) => ({ default: m.HelpCenter }))
);
const EngineeringGuide = lazy(() =>
  import('../pages/EngineeringGuide').then((m) => ({ default: m.EngineeringGuide }))
);
const TraceabilityRulesPage = lazy(() =>
  import('../pages/TraceabilityRulesPage').then((m) => ({ default: m.TraceabilityRulesPage }))
);
const LinksPage = lazy(() => import('../pages/LinksPage').then((m) => ({ default: m.LinksPage })));
const ReviewPage = lazy(() =>
  import('../pages/ReviewPage').then((m) => ({ default: m.ReviewPage }))
);
const HelpPage = lazy(() =>
  import('../pages/ProjectManual').then((m) => ({ default: m.ProjectManual }))
);

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ProjectLayout />}>
        <Route index element={<Navigate to="/requirements" replace />} />

        {/* One list page per kind, at the kind's folder name: /requirements, /use-cases, ... */}
        {ARTIFACT_KINDS.map((k) => (
          <Route key={k.id} path={k.folder} element={<ArtifactsPage key={k.id} kindId={k.id} />} />
        ))}
        <Route path="traceability" element={<TraceabilityDashboardPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="traceability-rules" element={<TraceabilityRulesPage />} />
        <Route path="review" element={<ReviewPage />} />

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
