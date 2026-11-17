/**
 * The few places where a kind needs more than its field list: the
 * document's outline editor and PDF export, and a risk's level. Everything
 * else about a kind is generic and comes from the registry.
 */
import React from 'react';
import type { ArtifactKindId } from '../../domain/artifactKinds';
import { riskLevel } from '../../domain/kindRules';
import type { ArtifactDocument, DocumentEntry, Link } from '../../types';
import { verifiedRequirementIds } from '../../domain/links';
import { DocumentEditor } from '../../components/DocumentEditor';
import { useAppStore, useAppStoreApi } from '../../state';

export type Draft = Record<string, unknown>;

export interface ExtraTab {
  id: string;
  label: string;
  render: (draft: Draft, change: (patch: Draft) => void) => React.ReactNode;
}

/** A table column that is not a field */
export interface ExtraColumn {
  key: string;
  label: string;
  /** Visible until the user changes it */
  showInTable?: boolean;
  render: (item: Draft, links: readonly Link[]) => React.ReactNode;
  sortValue: (item: Draft, links: readonly Link[]) => string | number;
}

export interface KindOverrides {
  /** Table columns after the field columns */
  columns?: ExtraColumn[];
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
    columns: [
      {
        key: 'structure',
        label: 'Items',
        showInTable: true,
        render: (doc) => `${(doc.structure as DocumentEntry[] | undefined)?.length ?? 0} items`,
        sortValue: (doc) => (doc.structure as DocumentEntry[] | undefined)?.length ?? 0,
      },
    ],
  },
  testCase: {
    columns: [
      {
        key: 'requirements',
        label: 'Requirements',
        showInTable: true,
        render: (tc, links) => (
          <span className="tf-chips">
            {verifiedRequirementIds(links, tc.id as string).map((id) => (
              <span key={id} className="tf-chip">
                {id}
              </span>
            ))}
          </span>
        ),
        sortValue: (tc, links) => verifiedRequirementIds(links, tc.id as string).join(','),
      },
    ],
  },
  risk: {
    columns: [
      {
        key: 'level',
        label: 'Level',
        showInTable: true,
        render: (risk) => {
          const level = riskLevel(risk.probability, risk.impact);
          return <span className={`tf-badge tf-badge-${level}`}>{level}</span>;
        },
        sortValue: (risk) =>
          ({ low: 1, medium: 2, high: 3 })[riskLevel(risk.probability, risk.impact)],
      },
    ],
    badge: (draft) => {
      const level = riskLevel(draft.probability, draft.impact);
      return <span className={`tf-badge tf-badge-${level}`}>{level} risk</span>;
    },
  },
};
