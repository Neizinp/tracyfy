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
          background: 'var(--color-bg-primary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          padding: '32px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    fontSize: 'var(--font-size-sm)',
    backgroundColor: 'var(--color-bg-secondary)',
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
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
          <tr
            style={{
              background: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
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
                  padding: '12px 16px',
                  verticalAlign: 'top',
                  fontSize: 'var(--font-size-sm)',
                  textAlign: col.align || 'left',
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
                borderCollapse: 'collapse',
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
              style={{
                borderBottom: '1px solid var(--color-border)',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.2s',
                backgroundColor: 'var(--color-bg-card)',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (onRowClick) e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
              }}
            />
          ),
        }}
      />
    </div>
  );
}
