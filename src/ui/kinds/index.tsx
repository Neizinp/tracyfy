/**
 * The few places where a kind needs more than its field list: the
 * document's outline editor and PDF export, and a risk's level. Everything
 * else about a kind is generic and comes from the registry.
 */
import React from 'react';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { riskLevel } from '../../domain/kindRules';
import type { ArtifactDocument, DocumentEntry } from '../../types';
import { DocumentEditor } from '../../components/DocumentEditor';
import { useAppStore, useAppStoreApi } from '../../state';

export type Draft = Record<string, unknown>;

export interface ExtraTab {
  id: string;
  label: string;
  render: (draft: Draft, change: (patch: Draft) => void) => React.ReactNode;
}

export interface KindOverrides {
  /** Tabs after the field tabs */
  tabs?: ExtraTab[];
  /** Shown next to the dialog title of a saved artifact */
  badge?: (draft: Draft) => React.ReactNode;
  /** Extra buttons in the footer of a saved artifact's dialog */
  FooterActions?: React.FC<{ artifact: Draft }>;
}

const DocumentExportButton: React.FC<{ artifact: Draft }> = ({ artifact }) => {
  const store = useAppStoreApi();
  const currentUser = useAppStore((s) => s.currentUser);
  const exportPdf = async () => {
    const { exportSingleDocumentToPDF } = await import('../../utils/pdf/pdfMainExport');
    const { artifacts } = store.getState();
    await exportSingleDocumentToPDF(
      artifact as unknown as ArtifactDocument,
      {
        requirements: artifacts.requirement,
        useCases: artifacts.useCase,
        testCases: artifacts.testCase,
        information: artifacts.information,
        risks: artifacts.risk,
      },
      currentUser?.name
    );
  };
  return (
    <button type="button" className="tf-button" onClick={() => void exportPdf()}>
      Export to PDF
    </button>
  );
};

export const KIND_OVERRIDES: Partial<Record<ArtifactKindId, KindOverrides>> = {
  document: {
    tabs: [
      {
        id: 'content',
        label: 'Content',
        render: (draft, change) => (
          <DocumentEditor
            structure={(draft.structure as DocumentEntry[]) ?? []}
            onChange={(structure) => change({ structure })}
          />
        ),
      },
    ],
    FooterActions: DocumentExportButton,
  },
  risk: {
    badge: (draft) => {
      const level = riskLevel(draft.probability, draft.impact);
      return <span className={`tf-badge tf-badge-${level}`}>{level} risk</span>;
    },
  },
};
