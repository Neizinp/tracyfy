import React from 'react';
import { InformationList } from '../components';
import { useInformation, useUI } from '../app/providers';

export const InformationPage: React.FC = () => {
  const { information, handleEditInformation } = useInformation();
  const { searchQuery, informationColumnVisibility } = useUI();

  const filteredInformation = information.filter((info) => {
    if (info.isDeleted) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      info.id.toLowerCase().includes(query) ||
      info.title.toLowerCase().includes(query) ||
      info.content.toLowerCase().includes(query)
    );
  });

  return (
    <InformationList
      information={filteredInformation}
      onEdit={handleEditInformation}
      visibleColumns={informationColumnVisibility}
    />
  );
};
