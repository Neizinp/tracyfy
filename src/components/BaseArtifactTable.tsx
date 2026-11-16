import React from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { SortableHeader, type SortConfig } from './SortableHeader';

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
  visible?: boolean;
}

interface BaseArtifactTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  sortConfig: SortConfig;
  onSortChange: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function BaseArtifactTable<T extends { id: string }>({
  data,
  columns,
  sortConfig,
  onSortChange,
  onRowClick,
  emptyMessage = 'No artifacts found.',
}: BaseArtifactTableProps<T>) {
  const visibleColumns = columns.filter((col) => col.visible !== false);

  if (data.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed var(--color-border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    height: '34px',
    padding: '0 12px',
    textAlign: 'left',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    fontSize: 'var(--font-size-xs)',
    whiteSpace: 'nowrap',
    backgroundColor: 'var(--color-bg-app)',
    borderBottom: '1px solid var(--color-border)',
  };

  return (
    <div
      style={{
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableVirtuoso
        style={{ flex: 1 }}
        data={data}
        overscan={5}
        fixedHeaderContent={() => (
          <tr style={{ background: 'var(--color-bg-app)' }}>
            {visibleColumns.map((col) => {
              if (col.sortable !== false) {
                return (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    currentSort={sortConfig}
                    onSort={onSortChange}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      textAlign: col.align || 'left',
                    }}
                  />
                );
              }
              return (
                <th
                  key={col.key}
                  style={{
                    ...thStyle,
                    width: col.width,
                    minWidth: col.minWidth,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.label}
                </th>
              );
            })}
          </tr>
        )}
        itemContent={(_index, item) => (
          <>
            {visibleColumns.map((col) => (
              <td
                key={col.key}
                style={{
                  padding: '9px 12px',
                  verticalAlign: 'top',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: col.align || 'left',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {col.render ? col.render(item) : (item[col.key as keyof T] as unknown as string)}
              </td>
            ))}
          </>
        )}
        components={{
          Table: ({ style, ...props }) => (
            <table
              {...props}
              style={{
                ...style,
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: 'var(--font-size-sm)',
              }}
            />
          ),
          TableHead: React.forwardRef<
            HTMLTableSectionElement,
            React.HTMLAttributes<HTMLTableSectionElement>
          >(({ style, ...props }, ref) => (
            <thead
              ref={ref}
              {...props}
              style={{ ...style, position: 'sticky', top: 0, zIndex: 1 }}
            />
          )),
          TableRow: ({ item, ...props }) => (
            <tr
              {...props}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'tf-row tf-row-clickable' : 'tf-row'}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            />
          ),
        }}
      />
    </div>
  );
}
