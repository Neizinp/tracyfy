import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { DetailedRequirementView, UseCaseList, TestCaseList, InformationList } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import {
  useGlobalState,
  useProject,
  useUI,
  useRequirements,
  useUseCases,
  useTestCases,
  useInformation,
} from '../app/providers';
import type {
  UseCaseColumnVisibility,
  TestCaseColumnVisibility,
  InformationColumnVisibility,
} from '../types';

const defaultUseCaseColumns: UseCaseColumnVisibility = {
  idTitle: true,
  description: true,
  actor: true,
  priority: true,
  status: true,
  preconditions: false,
  mainFlow: false,
  alternativeFlows: false,
  postconditions: false,
};

const defaultTestCaseColumns: TestCaseColumnVisibility = {
  idTitle: true,
  description: true,
  requirements: true,
  priority: true,
  status: true,
  author: false,
  lastRun: true,
  created: false,
};

const defaultInfoColumns: InformationColumnVisibility = {
  idTitle: true,
  type: true,
  content: true,
  created: true,
};

const useCaseColumnConfig: {
  key: keyof UseCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'description', label: 'Description' },
  { key: 'actor', label: 'Actor' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'mainFlow', label: 'Main Flow' },
];

const testCaseColumnConfig: {
  key: keyof TestCaseColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'description', label: 'Description' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'lastRun', label: 'Last Run' },
];

const infoColumnConfig: {
  key: keyof InformationColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'type', label: 'Type' },
  { key: 'content', label: 'Content' },
  { key: 'created', label: 'Created' },
];

export const GlobalLibraryPage: React.FC = () => {
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation } =
    useGlobalState();
  const { projects } = useProject();
  const { columnVisibility } = useUI();
  const { handleEdit: handleEditRequirement } = useRequirements();
  const { handleEditUseCase } = useUseCases();
  const { handleEditTestCase } = useTestCases();
  const { handleEditInformation } = useInformation();

  const [useCaseColumns, setUseCaseColumns] =
    useState<UseCaseColumnVisibility>(defaultUseCaseColumns);
  const [testCaseColumns, setTestCaseColumns] =
    useState<TestCaseColumnVisibility>(defaultTestCaseColumns);
  const [infoColumns, setInfoColumns] = useState<InformationColumnVisibility>(defaultInfoColumns);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GenericColumnSelector
              columns={useCaseColumnConfig}
              visibleColumns={useCaseColumns}
              onColumnVisibilityChange={setUseCaseColumns}
            />
          </div>
          <UseCaseList
            useCases={globalUseCases.filter((u) => !u.isDeleted)}
            requirements={globalRequirements}
            onEdit={handleEditUseCase}
            showProjectColumn={true}
            projects={projects}
            visibleColumns={useCaseColumns}
          />
        </div>
      );

    case 'test-cases':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GenericColumnSelector
              columns={testCaseColumnConfig}
              visibleColumns={testCaseColumns}
              onColumnVisibilityChange={setTestCaseColumns}
            />
          </div>
          <TestCaseList
            testCases={globalTestCases.filter((t) => !t.isDeleted)}
            onEdit={handleEditTestCase}
            showProjectColumn={true}
            projects={projects}
            visibleColumns={testCaseColumns}
          />
        </div>
      );

    case 'information':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GenericColumnSelector
              columns={infoColumnConfig}
              visibleColumns={infoColumns}
              onColumnVisibilityChange={setInfoColumns}
            />
          </div>
          <InformationList
            information={globalInformation.filter((i) => !i.isDeleted)}
            onEdit={handleEditInformation}
            showProjectColumn={true}
            projects={projects}
            visibleColumns={infoColumns}
          />
        </div>
      );

    default:
      return <Navigate to="/library/requirements" replace />;
  }
};
