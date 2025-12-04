import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { DetailedRequirementView, UseCaseList, TestCaseList, InformationList } from '../components';
import type { Requirement, UseCase, TestCase, Information, Project, ColumnVisibility } from '../types';

interface GlobalLibraryPageProps {
    globalRequirements: Requirement[];
    globalUseCases: UseCase[];
    globalTestCases: TestCase[];
    globalInformation: Information[];
    projects: Project[];
    columnVisibility: ColumnVisibility;
    onEditRequirement: (req: Requirement) => void;
    onEditUseCase: (uc: UseCase) => void;
    onDeleteUseCase: (id: string) => void;
    onBreakDownUseCase: (uc: UseCase) => void;
    onEditTestCase: (tc: TestCase) => void;
    onDeleteTestCase: (id: string) => void;
    onEditInformation: (info: Information) => void;
    onDeleteInformation: (id: string) => void;
}

export const GlobalLibraryPage: React.FC<GlobalLibraryPageProps> = ({
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    projects,
    columnVisibility,
    onEditRequirement,
    onEditUseCase,
    onDeleteUseCase,
    onBreakDownUseCase,
    onEditTestCase,
    onDeleteTestCase,
    onEditInformation,
    onDeleteInformation
}) => {
    const { type } = useParams<{ type: string }>();

    switch (type) {
        case 'requirements':
            return (
                <DetailedRequirementView
                    requirements={globalRequirements.filter(r => !r.isDeleted)}
                    onEdit={onEditRequirement}
                    visibleColumns={columnVisibility}
                    showProjectColumn={true}
                    projects={projects}
                />
            );

        case 'use-cases':
            return (
                <UseCaseList
                    useCases={globalUseCases.filter(u => !u.isDeleted)}
                    requirements={globalRequirements}
                    onEdit={onEditUseCase}
                    onDelete={onDeleteUseCase}
                    onBreakDown={onBreakDownUseCase}
                    showProjectColumn={true}
                    projects={projects}
                />
            );

        case 'test-cases':
            return (
                <TestCaseList
                    testCases={globalTestCases.filter(t => !t.isDeleted)}
                    onEdit={onEditTestCase}
                    onDelete={onDeleteTestCase}
                    showProjectColumn={true}
                    projects={projects}
                />
            );

        case 'information':
            return (
                <InformationList
                    information={globalInformation.filter(i => !i.isDeleted)}
                    onEdit={onEditInformation}
                    onDelete={onDeleteInformation}
                    showProjectColumn={true}
                    projects={projects}
                />
            );

        default:
            return <Navigate to="/library/requirements" replace />;
    }
};
