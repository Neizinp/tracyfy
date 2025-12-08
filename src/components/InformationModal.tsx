import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Information, Link, Project } from '../types';
import { RevisionHistoryTab } from './RevisionHistoryTab';
import { useUI } from '../app/providers';

interface InformationModalProps {
  isOpen: boolean;
  information: Information | null;
  links?: Link[];
  projects?: Project[];
  currentProjectId?: string;
  onClose: () => void;
  onSubmit: (
    data:
      | Omit<Information, 'id' | 'lastModified' | 'dateCreated'>
      | { id: string; updates: Partial<Information> }
  ) => void;
}

type Tab = 'overview' | 'relationships' | 'history';

export const InformationModal: React.FC<InformationModalProps> = ({
  isOpen,
  information,
  links = [],
  projects = [],
  currentProjectId = '',
  onClose,
  onSubmit,
}) => {
  const { setIsLinkModalOpen, setLinkSourceId, setLinkSourceType } = useUI();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Information['type']>('note');

  useEffect(() => {
    if (information) {
      setTitle(information.title);
      setContent(information.content);
      setType(information.type);
    } else {
      setTitle('');
      setContent('');
      setType('note');
    }
  }, [information, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (information) {
      onSubmit({
        id: information.id,
        updates: { title, content, type },
      });
    } else {
      onSubmit({ title, content, type, revision: '01' });
    }
    onClose();
  };

  // Get links for this information
  const relatedLinks = information
    ? links.filter((l) => l.sourceId === information.id || l.targetId === information.id)
    : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(information ? [{ id: 'relationships' as Tab, label: 'Relationships' }] : []),
    ...(information ? [{ id: 'history' as Tab, label: 'Revision History' }] : []),
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, #222)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: '#222',
          borderRadius: '8px',
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          style={{
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-primary)',
            zIndex: 1,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {information ? `Edit Information - ${information.id}` : 'New Information'}
          </h2>
          <button
            onClick={onClose}
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

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? 'var(--color-bg-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderBottom:
                  activeTab === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {activeTab === 'overview' && (
            <>
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  htmlFor="info-title"
                  style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
                >
                  Title
                </label>
                <input
                  id="info-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
                >
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as Information['type'])}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="note">Note</option>
                  <option value="meeting">Meeting</option>
                  <option value="decision">Decision</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <label
                  htmlFor="info-content"
                  style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}
                >
                  Content
                </label>
                <textarea
                  id="info-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'var(--color-accent)',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {information ? 'Save Changes' : 'Create Information'}
                </button>
              </div>
            </>
          )}

          {activeTab === 'relationships' && information && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-xs)',
                    fontSize: '0.875rem',
                  }}
                >
                  Linked Items
                </label>
                <div
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px',
                    backgroundColor: 'var(--color-bg-app)',
                    minHeight: '100px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                  }}
                >
                  {relatedLinks.length === 0 ? (
                    <div
                      style={{
                        padding: '8px',
                        color: 'var(--color-text-muted)',
                        fontSize: '0.875rem',
                      }}
                    >
                      No links found.
                      <button
                        type="button"
                        onClick={() => {
                          setLinkSourceId(information.id);
                          setLinkSourceType('information');
                          setIsLinkModalOpen(true);
                        }}
                        style={{
                          display: 'block',
                          marginTop: '8px',
                          color: 'var(--color-accent)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        + Create Link
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setLinkSourceId(information.id);
                            setLinkSourceType('information');
                            setIsLinkModalOpen(true);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-accent)',
                            background: 'none',
                            border: '1px solid var(--color-accent)',
                            borderRadius: '4px',
                            padding: '2px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          + Add Link
                        </button>
                      </div>
                      {relatedLinks.map((link) => {
                        const isSource = link.sourceId === information.id;
                        const otherId = isSource ? link.targetId : link.sourceId;
                        const otherProjectId = isSource
                          ? link.targetProjectId
                          : link.sourceProjectId;

                        const otherProject = otherProjectId
                          ? projects.find((p) => p.id === otherProjectId)
                          : null;
                        const projectName = otherProject
                          ? otherProject.name
                          : otherProjectId
                            ? 'Unknown Project'
                            : 'Current Project';
                        const isExternal = !!otherProjectId && otherProjectId !== currentProjectId;

                        return (
                          <div
                            key={link.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              backgroundColor: 'var(--color-bg-card)',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem',
                              }}
                            >
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {link.type.replace('_', ' ')}
                              </span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>
                                {isSource ? '→' : '←'}
                              </span>
                              <span style={{ fontWeight: 500 }}>{otherId}</span>
                              {isExternal && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--color-accent)',
                                    backgroundColor: 'var(--color-bg-secondary)',
                                    padding: '2px 6px',
                                    borderRadius: '10px',
                                  }}
                                >
                                  {projectName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && information && (
            <RevisionHistoryTab artifactId={information.id} artifactType="information" />
          )}
        </form>
      </div>
    </div>
  );
};
