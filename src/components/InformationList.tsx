import React from 'react';
import { Edit2, Trash2, FileText, Calendar, Tag } from 'lucide-react';
import type { Information, Project } from '../types';
import { formatDate } from '../utils/dateUtils';

interface InformationListProps {
  information: Information[];
  onEdit: (info: Information) => void;
  onDelete: (id: string) => void;
  showProjectColumn?: boolean;
  projects?: Project[];
}

export const InformationList: React.FC<InformationListProps> = ({
  information,
  onEdit,
  onDelete,
  showProjectColumn,
  projects,
}) => {
  const getProjectNames = (infoId: string) => {
    if (!projects) return '';
    return projects
      .filter((p) => p.informationIds.includes(infoId))
      .map((p) => p.name)
      .join(', ');
  };

  if (information.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          gap: 'var(--spacing-md)',
        }}
      >
        <FileText size={48} />
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No information artifacts found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {information.map((info) => (
        <div
          key={info.id}
          onClick={() => onEdit(info)}
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)')}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {info.id}
              </span>
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--color-bg-tertiary)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                }}
              >
                v{info.revision || '01'}
              </span>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                {info.title}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <button
                onClick={() => onEdit(info)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '4px',
                }}
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(info.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-error)',
                  padding: '4px',
                }}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {showProjectColumn &&
              getProjectNames(info.id)
                .split(', ')
                .map(
                  (name, i) =>
                    name && (
                      <span
                        key={i}
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-bg-tertiary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {name}
                      </span>
                    )
                )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={14} />
              <span style={{ textTransform: 'capitalize' }}>{info.type}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              <span>{formatDate(info.lastModified)}</span>
            </div>
          </div>

          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
              whiteSpace: 'pre-wrap',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            {info.content}
          </div>
        </div>
      ))}
    </div>
  );
};
