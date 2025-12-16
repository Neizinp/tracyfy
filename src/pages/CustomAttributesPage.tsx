import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';
import type {
  CustomAttributeDefinition,
  AttributeType,
  ApplicableArtifactType,
} from '../types/customAttributes';
import { CustomAttributeDefinitionModal } from '../components/CustomAttributeDefinitionModal';

const ARTIFACT_TYPE_LABELS: Record<ApplicableArtifactType, string> = {
  requirement: 'Requirements',
  useCase: 'Use Cases',
  testCase: 'Test Cases',
  information: 'Information',
  risk: 'Risks',
  link: 'Links',
};

const TYPE_COLORS: Record<AttributeType, string> = {
  text: 'var(--color-info)',
  number: 'var(--color-success)',
  date: 'var(--color-warning)',
  dropdown: 'var(--color-accent)',
  checkbox: 'var(--color-text-muted)',
};

export const CustomAttributesPage: React.FC = () => {
  const [definitions, setDefinitions] = useState<CustomAttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDefinition, setEditingDefinition] = useState<CustomAttributeDefinition | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const defs = await diskCustomAttributeService.getAllDefinitions();
      setDefinitions(defs);
    } catch (error) {
      console.error('Failed to load custom attribute definitions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDefinitions();
  }, [loadDefinitions]);

  const handleCreate = () => {
    setEditingDefinition(null);
    setIsModalOpen(true);
  };

  const handleEdit = (def: CustomAttributeDefinition) => {
    setEditingDefinition(def);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await diskCustomAttributeService.deleteDefinition(id);
      await loadDefinitions();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete attribute:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDefinition(null);
  };

  const handleModalSubmit = async (
    data: Omit<CustomAttributeDefinition, 'id' | 'dateCreated' | 'lastModified'>
  ) => {
    try {
      if (editingDefinition) {
        await diskCustomAttributeService.updateDefinition(editingDefinition.id, data);
      } else {
        await diskCustomAttributeService.createDefinition(data);
      }
      await loadDefinitions();
      handleModalClose();
    } catch (error) {
      console.error('Failed to save attribute:', error);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--color-text-muted)',
        }}
      >
        Loading custom attributes...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 'var(--spacing-lg)',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600,
              marginBottom: 'var(--spacing-xs)',
            }}
          >
            Custom Attributes
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Define custom fields that can be added to artifacts across all projects.
          </p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            backgroundColor: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          New Attribute
        </button>
      </div>

      {/* Empty State */}
      {definitions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--spacing-xl)',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }}>
            No custom attributes defined yet.
          </p>
          <button
            onClick={handleCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Create Your First Attribute
          </button>
        </div>
      ) : (
        /* Definitions List */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-sm)',
          }}
        >
          {definitions.map((def) => (
            <div
              key={def.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--color-border-hover)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {def.id}
                  </span>
                  <span style={{ fontWeight: 600 }}>{def.name}</span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: TYPE_COLORS[def.type],
                      color: 'white',
                      textTransform: 'uppercase',
                    }}
                  >
                    {def.type}
                  </span>
                  {def.required && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-error)',
                        fontWeight: 500,
                      }}
                    >
                      Required
                    </span>
                  )}
                </div>
                {def.description && (
                  <p
                    style={{
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      marginTop: 'var(--spacing-xs)',
                    }}
                  >
                    {def.description}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginTop: 'var(--spacing-xs)',
                  }}
                >
                  {def.appliesTo.map((type) => (
                    <span
                      key={type}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {ARTIFACT_TYPE_LABELS[type]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                {showDeleteConfirm === def.id ? (
                  <>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-card)',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(def.id)}
                      style={{
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-error)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      Confirm Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(def)}
                      style={{
                        padding: '6px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Edit"
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--color-text-muted)')
                      }
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(def.id)}
                      style={{
                        padding: '6px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Delete"
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--color-text-muted)')
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CustomAttributeDefinitionModal
        isOpen={isModalOpen}
        definition={editingDefinition}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};
