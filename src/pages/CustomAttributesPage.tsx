import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { diskCustomAttributeService } from '../services/diskCustomAttributeService';
import type {
  CustomAttributeDefinition,
  AttributeType,
  ApplicableArtifactType,
} from '../types/customAttributes';
import { CustomAttributeDefinitionModal } from '../components/CustomAttributeDefinitionModal';
import { useArtifactFilteredData } from '../hooks/useArtifactFilteredData';

const ARTIFACT_TYPE_LABELS: Record<ApplicableArtifactType, string> = {
  requirement: 'Requirements',
  useCase: 'Use Cases',
  testCase: 'Test Cases',
  information: 'Information',
  risk: 'Risks',
  link: 'Links',
  document: 'Documents',
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
  const [searchQuery, setSearchQuery] = useState('');

  const { sortedData: sortedDefinitions } = useArtifactFilteredData<CustomAttributeDefinition>(
    definitions,
    {
      searchQuery,
      searchFields: ['id', 'name', 'description'],
    }
  );

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

  const handleEdit = (def: CustomAttributeDefinition) => {
    setEditingDefinition(def);
    setIsModalOpen(true);
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
      <p
        style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        Define custom fields that can be added to artifacts across all projects.
      </p>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search attributes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
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
          <p style={{ color: 'var(--color-text-muted)' }}>
            No custom attributes defined yet. Use "Create New" in the header to add one.
          </p>
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
          {sortedDefinitions.map((def) => (
            <div
              key={def.id}
              onClick={() => handleEdit(def)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--color-bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                transition: 'border-color 0.15s, background-color 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-card)';
              }}
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
