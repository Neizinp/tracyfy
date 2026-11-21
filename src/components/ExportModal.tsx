import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ARTIFACT_KINDS, type ArtifactKindId } from '../domain/artifactKinds';
import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from '../export/exportData';
import { useAppStore } from '../state';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMATS = [
  { id: 'pdf', label: 'PDF Document', icon: FileText },
  { id: 'excel', label: 'Excel Sheet', icon: FileSpreadsheet },
  { id: 'json', label: 'JSON Data', icon: Download },
] as const;

type Toggle = 'links' | 'revisionHistory' | 'traceabilityMatrix' | 'verificationMatrix';

const SECTIONS: { id: Toggle; label: string; formats: ExportOptions['format'][] }[] = [
  {
    id: 'revisionHistory',
    label: 'Revision history since the previous baseline',
    formats: ['pdf', 'excel'],
  },
  { id: 'traceabilityMatrix', label: 'Traceability matrix', formats: ['excel'] },
  { id: 'verificationMatrix', label: 'Verification matrix worksheet', formats: ['excel'] },
];

/** Choose a format, the project state (working copy or a baseline) and what to include */
export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) =>
  // Mounted only while open, so every export starts from the defaults
  isOpen ? <ExportDialog onClose={onClose} /> : null;

const ExportDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const baselines = useAppStore((s) => s.baselines);
  const artifacts = useAppStore((s) => s.artifacts);
  const links = useAppStore((s) => s.links);
  const exportProject = useAppStore((s) => s.exportProject);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);

  useKeyboardShortcuts({ onClose });

  const set = (patch: Partial<ExportOptions>) => setOptions((o) => ({ ...o, ...patch }));
  const toggleKind = (id: ArtifactKindId, on: boolean) =>
    set({ kinds: on ? [...options.kinds, id] : options.kinds.filter((k) => k !== id) });
  const count = (items: readonly { isDeleted?: boolean }[]) =>
    items.filter((a) => !a.isDeleted).length;

  const handleExport = () => {
    void exportProject(options);
    onClose();
  };

  return (
    <div className="tf-dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tf-dialog tf-export" role="dialog" aria-labelledby="export-title">
        <div className="tf-dialog-header">
          <h2 id="export-title">Export Project</h2>
          <button type="button" className="tf-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <h3>Format</h3>
        <div className="tf-export-formats">
          {FORMATS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="tf-export-format"
              aria-pressed={options.format === id}
              onClick={() => set({ format: id })}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <h3>
          <label htmlFor="baseline-select">Project State</label>
        </h3>
        <select
          id="baseline-select"
          className="tf-input tf-field-full"
          value={options.baseline?.name ?? ''}
          onChange={(e) =>
            set({ baseline: baselines.find((b) => b.name === e.target.value) ?? null })
          }
        >
          <option value="">Current working copy</option>
          {baselines.map((b) => (
            <option key={b.name} value={b.name}>
              Baseline {b.name} - {new Date(b.timestamp).toLocaleDateString()}
            </option>
          ))}
        </select>
        {options.baseline && (
          <p className="tf-hint">The export shows the project as it was at this baseline.</p>
        )}

        {options.format !== 'json' && (
          <>
            <h3>Included Content</h3>
            <div className="tf-form-grid">
              {ARTIFACT_KINDS.map((k) => (
                <label key={k.id} className="tf-checkbox">
                  <input
                    type="checkbox"
                    checked={options.kinds.includes(k.id)}
                    onChange={(e) => toggleKind(k.id, e.target.checked)}
                  />
                  <span>
                    {k.label.plural} <span className="tf-muted">[{count(artifacts[k.id])}]</span>
                  </span>
                </label>
              ))}
              <label className="tf-checkbox">
                <input
                  type="checkbox"
                  checked={options.links}
                  onChange={(e) => set({ links: e.target.checked })}
                />
                <span>
                  Links <span className="tf-muted">[{count(links)}]</span>
                </span>
              </label>
            </div>

            <h3>Sections</h3>
            {SECTIONS.filter((s) => s.formats.includes(options.format)).map((s) => (
              <label key={s.id} className="tf-checkbox">
                <input
                  type="checkbox"
                  checked={options[s.id]}
                  onChange={(e) => set({ [s.id]: e.target.checked })}
                />
                <span>{s.label}</span>
              </label>
            ))}
          </>
        )}
        {options.format === 'json' && (
          <p className="tf-hint">
            Every artifact and link, as data that Import JSON reads back into a project.
          </p>
        )}

        <div className="tf-dialog-actions">
          <button type="button" className="tf-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="tf-button tf-button-primary" onClick={handleExport}>
            Generate Export
          </button>
        </div>
      </div>
    </div>
  );
};
