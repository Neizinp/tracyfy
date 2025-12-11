import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { DetailedRequirementView, UseCaseList, TestCaseList, InformationList } from '../components';
import {
  useGlobalState,
  useProject,
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
} from '../app/providers';

export const GlobalLibraryPage: React.FC = () => {
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();
  const { projects } = useProject();
  const { columnVisibility } = useUI();
  const { handleEdit: handleEditRequirement } = useRequirements();
  const { handleEditUseCase } = useUseCases();
  const { handleEditTestCase } = useTestCases();
  const { handleEditInformation } = useInformation();

  const { type } = useParams<{ type: string }>();

  switch (type) {
    case 'requirements':
      return (
        <DetailedRequirementView
          requirements={globalRequirements.filter((r) => !r.isDeleted)}
          onEdit={handleEditRequirement}
          visibleColumns={columnVisibility}
          showProjectColumn={true}
          projects={projects}
        />
      );

    case 'use-cases':
      return (
        <UseCaseList
          useCases={globalUseCases.filter((u) => !u.isDeleted)}
          requirements={globalRequirements}
          onEdit={handleEditUseCase}
          showProjectColumn={true}
          projects={projects}
        />
      );

    case 'test-cases':
      return (
        <TestCaseList
          testCases={globalTestCases.filter((t) => !t.isDeleted)}
          onEdit={handleEditTestCase}
          showProjectColumn={true}
          projects={projects}
        />
      );

    case 'information':
      return (
        <InformationList
          information={globalInformation.filter((i) => !i.isDeleted)}
          onEdit={handleEditInformation}
          showProjectColumn={true}
          projects={projects}
        />
      );

    default:
      return <Navigate to="/library/requirements" replace />;
  }
};
