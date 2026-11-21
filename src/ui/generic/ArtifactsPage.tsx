/**
 * The list page of any kind: a sortable table of its artifacts, filtered by
 * the search box. Columns come from the kind's fields (see columns.tsx);
 * clicking a row opens the artifact's dialog.
 */
import React, { useCallback, useMemo } from 'react';
import { BaseArtifactTable, type ColumnDef } from '../../components/BaseArtifactTable';
import { useArtifactFilteredData } from '../../hooks/useArtifactFilteredData';
import { fieldsFor, kind, type ArtifactKindId } from '../../domain/artifactKinds';
import { fieldText, isSearchable } from '../../domain/fields';
import { useAppStore } from '../../state';
import { columnsFor, isVisible } from './columns';
import type { Draft } from '../kinds';

type Row = Draft & { id: string; isDeleted?: boolean };

export const ArtifactsPage: React.FC<{ kindId: ArtifactKindId }> = ({ kindId }) => {
  const items = useAppStore((s) => s.artifacts[kindId]) as unknown as Row[];
  const definitions = useAppStore((s) => s.attributeDefinitions);
  const links = useAppStore((s) => s.links);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const choices = useAppStore((s) => s.columnVisibility[kindId]);
  const editArtifact = useAppStore((s) => s.editArtifact);

  const columns = useMemo(
    () => columnsFor(kindId, definitions, links),
    [kindId, definitions, links]
  );
  const searchable = useMemo(
    () => fieldsFor(kindId, definitions).filter(isSearchable),
    [kindId, definitions]
  );

  const matches = useCallback(
    (item: Row) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        searchable.some((f) => fieldText(item, f).toLowerCase().includes(query))
      );
    },
    [searchQuery, searchable]
  );
  const sortValue = useCallback(
    (item: Row, key: string) => columns.find((c) => c.key === key)?.sortValue(item),
    [columns]
  );
  const { sortedData, sortConfig, handleSortChange } = useArtifactFilteredData(items, {
    searchQuery: '',
    filterFn: matches,
    getValueFn: sortValue,
  });

  const tableColumns = useMemo<ColumnDef<Row>[]>(
    () =>
      columns
        .filter((c) => isVisible(c, choices))
        .map((c) => ({
          key: c.key,
          label: c.label,
          width: c.width,
          minWidth: c.minWidth,
          render: c.render,
        })),
    [columns, choices]
  );

  return (
    <BaseArtifactTable
      data={sortedData}
      columns={tableColumns}
      sortConfig={sortConfig}
      onSortChange={handleSortChange}
      onRowClick={(item) => editArtifact(kindId, item)}
      emptyMessage={`No ${kind(kindId).label.plural.toLowerCase()} found.`}
    />
  );
};
