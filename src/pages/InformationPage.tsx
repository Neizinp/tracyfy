import React, { useState } from 'react';
import { InformationList } from '../components';
import { GenericColumnSelector } from '../components/GenericColumnSelector';
import { useInformation, useUI } from '../app/providers';
import type { InformationColumnVisibility } from '../types';

const defaultColumns: InformationColumnVisibility = {
  idTitle: true,
  type: true,
  content: true,
  created: true,
};

const columnConfig: {
  key: keyof InformationColumnVisibility;
  label: string;
  alwaysVisible?: boolean;
}[] = [
  { key: 'idTitle', label: 'ID / Title', alwaysVisible: true },
  { key: 'type', label: 'Type' },
  { key: 'content', label: 'Content' },
  { key: 'created', label: 'Created' },
];

export const InformationPage: React.FC = () => {
  const { information, handleEditInformation } = useInformation();
  const { searchQuery } = useUI();
  const [visibleColumns, setVisibleColumns] = useState<InformationColumnVisibility>(defaultColumns);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <GenericColumnSelector
          columns={columnConfig}
          visibleColumns={visibleColumns}
          onColumnVisibilityChange={setVisibleColumns}
        />
      </div>
      <InformationList
        information={filteredInformation}
        onEdit={handleEditInformation}
        visibleColumns={visibleColumns}
      />
    </div>
  );
};
