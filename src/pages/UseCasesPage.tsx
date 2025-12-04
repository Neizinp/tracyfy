import React from 'react';
import { UseCaseList } from '../components';
import type { UseCase, Requirement } from '../types';

interface UseCasesPageProps {
    useCases: UseCase[];
    requirements: Requirement[];
    searchQuery: string;
    onEdit: (uc: UseCase) => void;
    onDelete: (id: string) => void;
    onBreakDown: (uc: UseCase) => void;
}

export const UseCasesPage: React.FC<UseCasesPageProps> = ({
    useCases,
    requirements,
    searchQuery,
    onEdit,
    onDelete,
    onBreakDown
}) => {
    const filteredUseCases = useCases.filter(uc => {
        if (uc.isDeleted) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            uc.id.toLowerCase().includes(query) ||
            uc.title.toLowerCase().includes(query) ||
            uc.description.toLowerCase().includes(query) ||
            uc.actor.toLowerCase().includes(query)
        );
    });

    return (
        <UseCaseList
            useCases={filteredUseCases}
            requirements={requirements}
            onEdit={onEdit}
            onDelete={onDelete}
            onBreakDown={onBreakDown}
        />
    );
};
