import React from 'react';
import { TraceabilityMatrix } from '../components';
import type { Requirement, Link } from '../types';

interface TraceabilityMatrixPageProps {
    requirements: Requirement[];
    links: Link[];
    searchQuery: string;
}

export const TraceabilityMatrixPage: React.FC<TraceabilityMatrixPageProps> = ({
    requirements,
    links,
    searchQuery
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
        <TraceabilityMatrix
            requirements={filteredRequirements}
            links={links}
        />
    );
};
