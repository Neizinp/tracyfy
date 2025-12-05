import React from 'react';
import { TraceabilityMatrix } from '../components';
import { useRequirements, useUI } from '../app/providers';

export const TraceabilityMatrixPage: React.FC = () => {
    const { requirements, links } = useRequirements();
    const { searchQuery } = useUI();

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
        <TraceabilityMatrix
            requirements={filteredRequirements}
            links={links}
        />
    );
};
