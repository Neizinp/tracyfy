import React from 'react';
import { DetailedRequirementView } from '../components';
import type { Requirement, ColumnVisibility } from '../types';

interface RequirementsDetailedPageProps {
    requirements: Requirement[];
    searchQuery: string;
    columnVisibility: ColumnVisibility;
    onEdit: (req: Requirement) => void;
}

export const RequirementsDetailedPage: React.FC<RequirementsDetailedPageProps> = ({
    requirements,
    searchQuery,
    columnVisibility,
    onEdit
}) => {
    const filteredRequirements = requirements.filter(req => {
        if (req.isDeleted) return false;
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            req.id.toLowerCase().includes(query) ||
            req.title.toLowerCase().includes(query) ||
            req.description.toLowerCase().includes(query) ||
            req.text.toLowerCase().includes(query)
        );
    });

    return (
        <DetailedRequirementView
            requirements={filteredRequirements}
            onEdit={onEdit}
            visibleColumns={columnVisibility}
        />
    );
};
