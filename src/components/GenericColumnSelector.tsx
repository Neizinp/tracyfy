import { useRef, useEffect, useState } from 'react';
import { Columns } from 'lucide-react';

interface ColumnConfig<T extends string> {
  key: T;
  label: string;
  alwaysVisible?: boolean;
}

interface GenericColumnSelectorProps<T extends string> {
  columns: ColumnConfig<T>[];
  visibleColumns: Record<T, boolean>;
  onColumnVisibilityChange: (columns: Record<T, boolean>) => void;
}

export function GenericColumnSelector<T extends string>({
  columns,
  visibleColumns,
  onColumnVisibilityChange,
}: GenericColumnSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (column: ColumnConfig<T>) => {
    if (column.alwaysVisible) return;

    onColumnVisibilityChange({
      ...visibleColumns,
      [column.key]: !visibleColumns[column.key],
    });
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          height: '32px',
          padding: '0 10px',
          backgroundColor: 'transparent',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        className="tf-btn"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        title="Toggle column visibility"
      >
        <Columns size={16} />
        Columns
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'var(--color-bg-card)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-popover)',
            zIndex: 100,
            minWidth: '220px',
            overflow: 'hidden',
          }}
        >
          {columns.map((column, index) => (
            <label
              key={column.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                cursor: column.alwaysVisible ? 'not-allowed' : 'pointer',
                borderBottom:
                  index === columns.length - 1 ? 'none' : '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                transition: 'background-color 0.1s',
                opacity: column.alwaysVisible ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!column.alwaysVisible) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <input
                type="checkbox"
                checked={visibleColumns[column.key]}
                onChange={() => handleToggle(column)}
                disabled={column.alwaysVisible}
                style={{
                  cursor: column.alwaysVisible ? 'not-allowed' : 'pointer',
                  width: '16px',
                  height: '16px',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  userSelect: 'none',
                }}
              >
                {column.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
