import React, { useMemo } from 'react';
import { GenericColumnSelector } from '../../components/GenericColumnSelector';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { useAppStore } from '../../state';
import { columnsFor, isVisible } from './columns';

/** The Columns menu of a kind's table */
export const ArtifactColumnSelector: React.FC<{ kindId: ArtifactKindId }> = ({ kindId }) => {
  const definitions = useAppStore((s) => s.attributeDefinitions);
  const choices = useAppStore((s) => s.columnVisibility[kindId]);
  const setColumnVisible = useAppStore((s) => s.setColumnVisible);
  const columns = useMemo(() => columnsFor(kindId, definitions, []), [kindId, definitions]);
  const visible = Object.fromEntries(columns.map((c) => [c.key, isVisible(c, choices)]));

  return (
    <GenericColumnSelector
      columns={columns.map((c) => ({ key: c.key, label: c.label, alwaysVisible: c.alwaysVisible }))}
      visibleColumns={visible}
      onColumnVisibilityChange={(next) => {
        const changed = columns.find((c) => next[c.key] !== visible[c.key]);
        if (changed) setColumnVisible(kindId, changed.key, next[changed.key]);
      }}
    />
  );
};
