import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  FileText,
  BookOpen,
  CheckSquare,
  Info,
  ShieldAlert,
  Search,
  X,
} from 'lucide-react';
import type { DocumentEntry, ArtifactType } from '../types';
import { useGlobalState } from '../app/providers';

interface DocumentEditorProps {
  structure: DocumentEntry[];
  onChange: (structure: DocumentEntry[]) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({ structure, onChange }) => {
  const { globalRequirements, globalUseCases, globalTestCases, globalInformation, globalRisks } =
    useGlobalState();
  const [isAddingArtifact, setIsAddingArtifact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ArtifactType>('requirements');

  const handleAddHeading = () => {
    const newEntry: DocumentEntry = {
      type: 'heading',
      title: 'New Heading',
      level: 1,
    };
    onChange([...structure, newEntry]);
  };

  const handleAddArtifact = (id: string, type: ArtifactType, title: string) => {
    const newEntry: DocumentEntry = {
      type: 'artifact',
      id,
      artifactType: type,
      title,
    };
    onChange([...structure, newEntry]);
    setIsAddingArtifact(false);
    setSearchQuery('');
  };

  const handleRemoveEntry = (index: number) => {
    const newStructure = [...structure];
    newStructure.splice(index, 1);
    onChange(newStructure);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStructure = [...structure];
    [newStructure[index - 1], newStructure[index]] = [newStructure[index], newStructure[index - 1]];
    onChange(newStructure);
  };

  const handleMoveDown = (index: number) => {
    if (index === structure.length - 1) return;
    const newStructure = [...structure];
    [newStructure[index + 1], newStructure[index]] = [newStructure[index], newStructure[index + 1]];
    onChange(newStructure);
  };

  const handleUpdateHeading = (index: number, updates: Partial<DocumentEntry>) => {
    const newStructure = [...structure];
    newStructure[index] = { ...newStructure[index], ...updates };
    onChange(newStructure);
  };

  const filteredArtifacts = useMemo(() => {
    let list: { id: string; title: string; type: ArtifactType }[] = [];
    if (selectedType === 'requirements')
      list = globalRequirements.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'requirements' as ArtifactType,
      }));
    else if (selectedType === 'useCases')
      list = globalUseCases.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'useCases' as ArtifactType,
      }));
    else if (selectedType === 'testCases')
      list = globalTestCases.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'testCases' as ArtifactType,
      }));
    else if (selectedType === 'information')
      list = globalInformation.map((a) => ({
        id: a.id,
        title: a.title,
        type: 'information' as ArtifactType,
      }));
    else if (selectedType === 'risks')
      list = globalRisks.map((a) => ({ id: a.id, title: a.title, type: 'risks' as ArtifactType }));

    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (a) => a.id.toLowerCase().includes(query) || a.title.toLowerCase().includes(query)
    );
  }, [
    selectedType,
    searchQuery,
    globalRequirements,
    globalUseCases,
    globalTestCases,
    globalInformation,
    globalRisks,
  ]);

  const getIcon = (type: ArtifactType) => {
    switch (type) {
      case 'requirements':
        return <FileText size={14} />;
      case 'useCases':
        return <BookOpen size={14} />;
      case 'testCases':
        return <CheckSquare size={14} />;
      case 'information':
        return <Info size={14} />;
      case 'risks':
        return <ShieldAlert size={14} />;
      default:
        return <FileText size={14} />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        minHeight: '400px',
      }}
    >
      {/* Structure List */}
      <div
        style={{
          flex: 1,
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: 'var(--spacing-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          maxHeight: '500px',
        }}
      >
        {structure.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Document structure is empty. Add headings or artifacts below.
          </div>
        ) : (
          structure.map((entry, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                marginLeft: entry.type === 'heading' ? `${(entry.level || 1) * 20 - 20}px` : '40px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: index === 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    padding: 0,
                  }}
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === structure.length - 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color:
                      index === structure.length - 1
                        ? 'var(--color-text-muted)'
                        : 'var(--color-text-secondary)',
                    padding: 0,
                  }}
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              {entry.type === 'heading' ? (
                <>
                  <Type size={16} style={{ color: 'var(--color-accent)' }} />
                  <select
                    value={entry.level}
                    onChange={(e) =>
                      handleUpdateHeading(index, { level: parseInt(e.target.value) })
                    }
                    style={{
                      padding: '4px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <option value={1}>H1</option>
                    <option value={2}>H2</option>
                    <option value={3}>H3</option>
                  </select>
                  <input
                    type="text"
                    value={entry.title}
                    onChange={(e) => handleUpdateHeading(index, { title: e.target.value })}
                    placeholder="Heading Title"
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <span style={{ color: 'var(--color-accent)' }}>
                      {getIcon(entry.artifactType!)}
                    </span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{entry.id}</span>
                    <span
                      style={{
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.title}
                    </span>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => handleRemoveEntry(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-error)',
                  opacity: 0.7,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as unknown as HTMLElement).style.opacity = '1')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as unknown as HTMLElement).style.opacity = '0.7')
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="button"
          onClick={handleAddHeading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Plus size={16} /> Add Heading
        </button>
        <button
          type="button"
          onClick={() => setIsAddingArtifact(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          <Plus size={16} /> Add Artifact
        </button>
      </div>

      {/* Artifact Selector Modal/Overlay */}
      {isAddingArtifact && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '500px',
              backgroundColor: 'var(--color-bg-card)',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Select Artifact</h3>
              <button
                onClick={() => setIsAddingArtifact(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '4px',
                  borderRadius: '6px',
                }}
              >
                {(
                  [
                    'requirements',
                    'useCases',
                    'testCases',
                    'information',
                    'risks',
                  ] as ArtifactType[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: selectedType === t ? 'var(--color-accent)' : 'transparent',
                      color: selectedType === t ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {t.substring(0, 4)}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search artifacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                }}
              >
                {filteredArtifacts.length === 0 ? (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    No artifacts found.
                  </div>
                ) : (
                  filteredArtifacts.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleAddArtifact(a.id, a.type, a.title)}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as unknown as HTMLElement).style.backgroundColor =
                          'var(--color-bg-secondary)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as unknown as HTMLElement).style.backgroundColor =
                          'transparent')
                      }
                    >
                      <span style={{ color: 'var(--color-accent)' }}>{getIcon(a.type)}</span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: 'var(--font-size-sm)',
                        }}
                      >
                        {a.id}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {a.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
