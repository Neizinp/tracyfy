import React from 'react';
import { DetailedRequirementView } from '../components';
import { useRequirements, useUI } from '../app/providers';

export const RequirementsDetailedPage: React.FC = () => {
    const { requirements, handleEdit } = useRequirements();
    const { searchQuery, columnVisibility } = useUI();

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
            onEdit={handleEdit}
            visibleColumns={columnVisibility}
        />
    );
};
