import React, { useRef, useEffect, useState } from 'react';
import { Columns } from 'lucide-react';
import type { ColumnVisibility } from '../types';

interface ColumnSelectorProps {
  visibleColumns: ColumnVisibility;
  onColumnVisibilityChange: (columns: ColumnVisibility) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  visibleColumns,
  onColumnVisibilityChange,
}) => {
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

  const handleToggle = (column: keyof ColumnVisibility) => {
    // ID/Title should always be visible
    if (column === 'idTitle') return;

    onColumnVisibilityChange({
      ...visibleColumns,
      [column]: !visibleColumns[column],
    });
  };

  const columns: { key: keyof ColumnVisibility; label: string }[] = [
    { key: 'idTitle', label: 'ID / Title' },
    { key: 'description', label: 'Description' },
    { key: 'text', label: 'Requirement Text' },
    { key: 'rationale', label: 'Rationale' },
    { key: 'author', label: 'Author' },
    { key: 'verification', label: 'Verification' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'comments', label: 'Comments' },
    { key: 'created', label: 'Created' },
    { key: 'approved', label: 'Approved' },
  ];

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)')}
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
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 100,
            minWidth: '220px',
            overflow: 'hidden',
          }}
        >
          {columns.map((column) => (
            <label
              key={column.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                cursor: column.key === 'idTitle' ? 'not-allowed' : 'pointer',
                borderBottom: column.key === 'approved' ? 'none' : '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                transition: 'background-color 0.1s',
                opacity: column.key === 'idTitle' ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (column.key !== 'idTitle') {
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
                onChange={() => handleToggle(column.key)}
                disabled={column.key === 'idTitle'}
                style={{
                  cursor: column.key === 'idTitle' ? 'not-allowed' : 'pointer',
                  width: '16px',
                  height: '16px',
                }}
              />
              <span
                style={{
                  fontSize: '0.875rem',
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
};
