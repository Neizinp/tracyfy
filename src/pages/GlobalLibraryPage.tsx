import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { RequirementList, UseCaseList, TestCaseList, InformationList } from '../components';
import {
  useGlobalState,
  useProject,
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
} from '../app/providers';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

export const GlobalLibraryPage: React.FC = () => {
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();
  const { projects } = useProject();
  const {
    columnVisibility,
    useCaseColumnVisibility,
    testCaseColumnVisibility,
    informationColumnVisibility,
    searchQuery,
  } = useUI();
  const { handleEdit: handleEditRequirement } = useRequirements();
  const { handleEditUseCase } = useUseCases();
  const { handleEditTestCase } = useTestCases();
  const { handleEditInformation } = useInformation();

  const { type } = useParams<{ type: string }>();

  // Requirements
  const {
    sortedData: sortedReqs,
    sortConfig: reqSort,
    handleSortChange: onReqSort,
  } = useArtifactFilteredData(globalRequirements, searchQuery, [
    'id',
    'title',
    'description',
    'text',
  ]);

  // Use Cases
  const {
    sortedData: sortedUCs,
    sortConfig: ucSort,
    handleSortChange: onUCSort,
  } = useArtifactFilteredData(globalUseCases, searchQuery, ['id', 'title', 'description', 'actor']);

  // Test Cases
  const {
    sortedData: sortedTCs,
    sortConfig: tcSort,
    handleSortChange: onTCSort,
  } = useArtifactFilteredData(globalTestCases, searchQuery, ['id', 'title', 'description']);

  // Information
  const {
    sortedData: sortedInfo,
    sortConfig: infoSort,
    handleSortChange: onInfoSort,
  } = useArtifactFilteredData(globalInformation, searchQuery, ['id', 'title', 'content']);

  switch (type) {
    case 'requirements':
      return (
        <RequirementList
          requirements={sortedReqs}
          onEdit={handleEditRequirement}
          visibleColumns={columnVisibility}
          showProjectColumn={true}
          projects={projects}
          sortConfig={reqSort}
          onSortChange={onReqSort}
        />
      );

    case 'use-cases':
      return (
        <UseCaseList
          useCases={sortedUCs}
          requirements={globalRequirements}
          onEdit={handleEditUseCase}
          showProjectColumn={true}
          projects={projects}
          visibleColumns={useCaseColumnVisibility}
          sortConfig={ucSort}
          onSortChange={onUCSort}
        />
      );

    case 'test-cases':
      return (
        <TestCaseList
          testCases={sortedTCs}
          onEdit={handleEditTestCase}
          showProjectColumn={true}
          projects={projects}
          visibleColumns={testCaseColumnVisibility}
          sortConfig={tcSort}
          onSortChange={onTCSort}
        />
      );

    case 'information':
      return (
        <InformationList
          information={sortedInfo}
          onEdit={handleEditInformation}
          showProjectColumn={true}
          projects={projects}
          visibleColumns={informationColumnVisibility}
          sortConfig={infoSort}
          onSortChange={onInfoSort}
        />
      );

    default:
      return <Navigate to="/library/requirements" replace />;
  }
};
