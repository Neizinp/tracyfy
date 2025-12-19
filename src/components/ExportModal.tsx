import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download, X } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { ExportOptions, ProjectBaseline } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  baselines: ProjectBaseline[];
  onExport: (options: ExportOptions) => void;
  artifactCounts?: {
    requirements: number;
    useCases: number;
    testCases: number;
    information: number;
    risks: number;
    links: number;
  };
}

type ExportFormat = 'pdf' | 'excel' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  baselines,
  onExport,
  artifactCounts,
}) => {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('current');

  // Artifact toggles
  const [includeRequirements, setIncludeRequirements] = useState(true);
  const [includeUseCases, setIncludeUseCases] = useState(true);
  const [includeTestCases, setIncludeTestCases] = useState(true);
  const [includeInformation, setIncludeInformation] = useState(true);
  const [includeRisks, setIncludeRisks] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);

  // PDF-specific toggles
  const [includeTitlePage, setIncludeTitlePage] = useState(true);
  const [includeRevisionHistory, setIncludeRevisionHistory] = useState(true);
  const [includeTraceability, setIncludeTraceability] = useState(true);
  const [includeVerificationMatrix, setIncludeVerificationMatrix] = useState(false);

  useKeyboardShortcuts({
    onClose: onClose,
  });

  if (!isOpen) return null;

  const handleExport = () => {
    const baseline =
      selectedBaselineId === 'current'
        ? null
        : baselines.find((b) => b.id === selectedBaselineId) || null;

    onExport({
      format,
      baseline,
      includeRequirements,
      includeUseCases,
      includeTestCases,
      includeInformation,
      includeRisks,
      includeLinks,
      includeTitlePage,
      includeRevisionHistory,
      includeTraceability,
      includeVerificationMatrix,
    });
    onClose();
  };

  const formatButtonStyle = (selected: boolean) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid transparent',
    backgroundColor: selected ? 'rgba(var(--color-accent-rgb), 0.1)' : 'var(--color-bg-card)',
    borderColor: selected ? 'var(--color-accent)' : 'transparent',
    color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
    fontWeight: selected ? 600 : 500,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const checkboxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '24px',
          border: '1px solid var(--color-border)',
          width: '560px',
          maxWidth: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(to right, var(--color-bg-tertiary), var(--color-bg-secondary))',
          }}
        >
          <div>
            <h3
              style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}
            >
              Export Project
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Choose your preferred format and options
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(var(--color-text-muted-rgb), 0.1)',
              border: 'none',
              borderRadius: '50%',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Format Selection */}
          <section style={{ marginBottom: '32px' }}>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px',
              }}
            >
              Format
            </h4>
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => setFormat('pdf')} style={formatButtonStyle(format === 'pdf')}>
                <FileText size={24} />
                <span>PDF Document</span>
              </button>
              <button
                onClick={() => setFormat('excel')}
                style={formatButtonStyle(format === 'excel')}
              >
                <FileSpreadsheet size={24} />
                <span>Excel Sheet</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                style={formatButtonStyle(format === 'json')}
              >
                <Download size={24} />
                <span>JSON Data</span>
              </button>
            </div>
          </section>

          {/* Baseline Selection */}
          <section style={{ marginBottom: '32px' }}>
            <h4
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '16px',
              }}
            >
              Project State
            </h4>
            <select
              id="baseline-select"
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                fontSize: '0.925rem',
                outline: 'none',
              }}
            >
              <option value="current">Current Working Copy (Latest)</option>
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (v{b.version}) - {new Date(b.timestamp).toLocaleDateString()}
                </option>
              ))}
            </select>
          </section>

          {/* Artifact Selection (not for JSON) */}
          {format !== 'json' && (
            <section style={{ marginBottom: '32px' }}>
              <h4
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                }}
              >
                Included Content
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRequirements}
                    onChange={(e) => setIncludeRequirements(e.target.checked)}
                  />
                  <span>
                    Requirements{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.requirements}]
                      </span>
                    )}
                  </span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeUseCases}
                    onChange={(e) => setIncludeUseCases(e.target.checked)}
                  />
                  <span>
                    Use Cases{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.useCases}]
                      </span>
                    )}
                  </span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeTestCases}
                    onChange={(e) => setIncludeTestCases(e.target.checked)}
                  />
                  <span>
                    Test Cases{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.testCases}]
                      </span>
                    )}
                  </span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeInformation}
                    onChange={(e) => setIncludeInformation(e.target.checked)}
                  />
                  <span>
                    Doc Assets{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.information}]
                      </span>
                    )}
                  </span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRisks}
                    onChange={(e) => setIncludeRisks(e.target.checked)}
                  />
                  <span>
                    Risks{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.risks}]
                      </span>
                    )}
                  </span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeLinks}
                    onChange={(e) => setIncludeLinks(e.target.checked)}
                  />
                  <span>
                    Trace Links{' '}
                    {artifactCounts && (
                      <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                        [{artifactCounts.links}]
                      </span>
                    )}
                  </span>
                </label>
              </div>
            </section>
          )}

          {/* PDF & Excel Sections */}
          {(format === 'pdf' || format === 'excel') && (
            <section style={{ marginBottom: '8px' }}>
              <h4
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '16px',
                }}
              >
                {format === 'pdf' ? 'Layout Sections' : 'Excel Worksheets'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {format === 'pdf' && (
                  <label style={checkboxStyle}>
                    <input
                      type="checkbox"
                      checked={includeTitlePage}
                      onChange={(e) => setIncludeTitlePage(e.target.checked)}
                    />
                    <span>Title Page & Metadata</span>
                  </label>
                )}
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRevisionHistory}
                    onChange={(e) => setIncludeRevisionHistory(e.target.checked)}
                  />
                  <span>Complete Revision Log</span>
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeTraceability}
                    onChange={(e) => setIncludeTraceability(e.target.checked)}
                  />
                  <span>
                    {format === 'pdf' ? 'Traceability Annex' : 'Traceability Matrix Sheet'}
                  </span>
                </label>
                {format === 'excel' && (
                  <label style={checkboxStyle}>
                    <input
                      type="checkbox"
                      checked={includeVerificationMatrix}
                      onChange={(e) => setIncludeVerificationMatrix(e.target.checked)}
                    />
                    <span>Verification Matrix Workspace</span>
                  </label>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '16px',
            backgroundColor: 'var(--color-bg-tertiary)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '12px 32px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 4px 6px -1px rgba(var(--color-accent-rgb), 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            Generate Export
          </button>
        </div>
      </div>
    </div>
  );
};
