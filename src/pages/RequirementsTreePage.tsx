import React from 'react';
import { RequirementTree } from '../components';
import { useRequirements } from '../app/providers';
import { useUI } from '../app/providers';

export const RequirementsTreePage: React.FC = () => {
  const { requirements, setRequirements, handleLink, handleEdit } = useRequirements();
  const { searchQuery } = useUI();

  const filteredRequirements = requirements.filter((req) => {
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
      onReorder={(activeId, overId) => {
        const oldIndex = requirements.findIndex((r) => r.id === activeId);
        const newIndex = requirements.findIndex((r) => r.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newRequirements = [...requirements];
          const [movedItem] = newRequirements.splice(oldIndex, 1);
          newRequirements.splice(newIndex, 0, movedItem);
          setRequirements(newRequirements);
        }
      }}
      onLink={handleLink}
      onEdit={handleEdit}
    />
  );
};
