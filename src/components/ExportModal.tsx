import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Download } from 'lucide-react';
import type { ProjectBaseline } from '../types';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'json';
  baseline: ProjectBaseline | null;
  // Artifact types
  includeRequirements: boolean;
  includeUseCases: boolean;
  includeTestCases: boolean;
  includeInformation: boolean;
  includeRisks: boolean;
  includeLinks: boolean;
  // PDF-specific sections
  includeTitlePage: boolean;
  includeRevisionHistory: boolean;
  includeTraceability: boolean;
  includeVerificationMatrix: boolean;
}

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
    borderRadius: '6px',
    border: selected ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
    backgroundColor: selected ? 'rgba(var(--color-accent-rgb), 0.1)' : 'var(--color-bg-card)',
    color: selected ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    fontWeight: selected ? 600 : 400,
  });

  const checkboxStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--color-bg-overlay, rgba(0, 0, 0, 0.5))',
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
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          width: '550px',
          maxWidth: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontWeight: 600 }}>Export Project</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '20px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--spacing-lg)', overflowY: 'auto', flex: 1 }}>
          {/* Format Selection */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Export Format
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setFormat('pdf')} style={formatButtonStyle(format === 'pdf')}>
                <FileText size={24} />
                PDF
              </button>
              <button
                onClick={() => setFormat('excel')}
                style={formatButtonStyle(format === 'excel')}
              >
                <FileSpreadsheet size={24} />
                Excel
              </button>
              <button
                onClick={() => setFormat('json')}
                style={formatButtonStyle(format === 'json')}
              >
                <Download size={24} />
                JSON
              </button>
            </div>
          </div>

          {/* Baseline Selection */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label
              htmlFor="baseline-select"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Baseline
            </label>
            <select
              id="baseline-select"
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <option value="current">Current State</option>
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.version})
                </option>
              ))}
            </select>
          </div>

          {/* Artifact Selection (not for Excel) */}
          {format !== 'excel' && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                Include Artifacts
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRequirements}
                    onChange={(e) => setIncludeRequirements(e.target.checked)}
                  />
                  Requirements {artifactCounts && `(${artifactCounts.requirements})`}
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeUseCases}
                    onChange={(e) => setIncludeUseCases(e.target.checked)}
                  />
                  Use Cases {artifactCounts && `(${artifactCounts.useCases})`}
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeTestCases}
                    onChange={(e) => setIncludeTestCases(e.target.checked)}
                  />
                  Test Cases {artifactCounts && `(${artifactCounts.testCases})`}
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeInformation}
                    onChange={(e) => setIncludeInformation(e.target.checked)}
                  />
                  Information {artifactCounts && `(${artifactCounts.information})`}
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRisks}
                    onChange={(e) => setIncludeRisks(e.target.checked)}
                  />
                  Risks {artifactCounts && `(${artifactCounts.risks})`}
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeLinks}
                    onChange={(e) => setIncludeLinks(e.target.checked)}
                  />
                  Links {artifactCounts && `(${artifactCounts.links})`}
                </label>
              </div>
            </div>
          )}

          {/* PDF-specific options */}
          {format === 'pdf' && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  marginBottom: '8px',
                }}
              >
                PDF Sections
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeTitlePage}
                    onChange={(e) => setIncludeTitlePage(e.target.checked)}
                  />
                  Title Page
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeRevisionHistory}
                    onChange={(e) => setIncludeRevisionHistory(e.target.checked)}
                  />
                  Revision History
                </label>
                <label style={checkboxStyle}>
                  <input
                    type="checkbox"
                    checked={includeTraceability}
                    onChange={(e) => setIncludeTraceability(e.target.checked)}
                  />
                  Traceability (Linked Artifacts)
                </label>
              </div>
            </div>
          )}

          {/* Excel note */}
          {format === 'excel' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}
            >
              <div
                style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'var(--color-bg-card)',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Excel export includes all artifacts and a traceability matrix by default.
              </div>
              <label style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={includeVerificationMatrix}
                  onChange={(e) => setIncludeVerificationMatrix(e.target.checked)}
                />
                Include Verification Matrix (Worksheet)
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 'var(--spacing-md)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-accent)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
