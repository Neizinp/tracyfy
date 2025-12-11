import React from 'react';
import { InformationList } from '../components';
import { useInformation } from '../app/providers';

export const InformationPage: React.FC = () => {
  const { information, handleEditInformation } = useInformation();

  return (
    <InformationList
      information={information.filter((info) => !info.isDeleted)}
      onEdit={handleEditInformation}
    />
  );
};
