import React from 'react';
import { RequirementTree } from '../components';
import type { Requirement, Link } from '../types';

interface RequirementsTreePageProps {
    requirements: Requirement[];
    links: Link[];
    searchQuery: string;
    setRequirements: (reqs: Requirement[]) => void;
    onLink: (sourceId: string) => void;
    onEdit: (req: Requirement) => void;
}

export const RequirementsTreePage: React.FC<RequirementsTreePageProps> = ({
    requirements,
    links,
    searchQuery,
    setRequirements,
    onLink,
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
        <RequirementTree
            requirements={filteredRequirements}
            links={links}
            allRequirements={requirements}
            onReorder={(activeId, overId) => {
                const oldIndex = requirements.findIndex(r => r.id === activeId);
                const newIndex = requirements.findIndex(r => r.id === overId);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newRequirements = [...requirements];
                    const [movedItem] = newRequirements.splice(oldIndex, 1);
                    newRequirements.splice(newIndex, 0, movedItem);
                    setRequirements(newRequirements);
                }
            }}
            onLink={onLink}
            onEdit={onEdit}
        />
    );
};
