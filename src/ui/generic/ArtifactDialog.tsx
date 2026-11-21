/**
 * The dialog that creates and edits an artifact of any kind.
 *
 * Everything it shows comes from the kind's fields (built-in and custom) in
 * the registry: which inputs, on which tab, with which options and defaults.
 * The few kind-specific extras (a document's outline, a risk's level) come
 * from ui/kinds. Saving and deleting go through the store's artifact actions.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BaseArtifactModal } from '../../components/BaseArtifactModal';
import { RevisionHistoryTab } from '../../components/RevisionHistoryTab';
import { ArtifactLinks } from './ArtifactLinks';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useOpenArtifact } from '../../hooks/useOpenArtifact';
import { fieldsFor, kind as kindDef, type ArtifactKindId } from '../../domain/artifactKinds';
import {
  defaultValues,
  getFieldValue,
  isCustomField,
  missingRequired,
  setFieldValue,
  type FieldDef,
} from '../../domain/fields';
import { useAppStore, type NewArtifact } from '../../state';
import { FieldInput } from './FieldInput';
import { KIND_OVERRIDES, type Draft } from '../kinds';

interface ArtifactDialogProps {
  kindId: ArtifactKindId;
  /** The artifact to edit, as it is in the store; null to create one */
  artifact: Draft | null;
  onClose: () => void;
  onBack?: () => void;
}

/** Fields the app keeps up to date; the dialog never sends them */
const BOOKKEEPING = new Set([
  'id',
  'revision',
  'lastModified',
  'dateCreated',
  'author',
  'isDeleted',
  'deletedAt',
]);

const EMPTY_STRUCTURE = { document: { structure: [] } } as Partial<Record<ArtifactKindId, Draft>>;

/** What changed between the draft and the artifact it started from */
function changes(initial: Draft, draft: Draft): Draft {
  return Object.fromEntries(
    Object.entries(draft).filter(
      ([key, value]) =>
        !BOOKKEEPING.has(key) && JSON.stringify(value) !== JSON.stringify(initial[key])
    )
  );
}

export const ArtifactDialog: React.FC<ArtifactDialogProps> = ({
  kindId,
  artifact,
  onClose,
  onBack,
}) => {
  const k = kindDef(kindId);
  const overrides = KIND_OVERRIDES[kindId] ?? {};
  const definitions = useAppStore((s) => s.attributeDefinitions);
  const currentUser = useAppStore((s) => s.currentUser);
  const addArtifact = useAppStore((s) => s.addArtifact);
  const updateArtifact = useAppStore((s) => s.updateArtifact);
  const deleteArtifact = useAppStore((s) => s.deleteArtifact);
  const openLinkDialog = useAppStore((s) => s.openLinkDialog);
  const selectedArtifact = useAppStore((s) => s.selectedArtifact);
  const pushNavigationStack = useAppStore((s) => s.pushNavigationStack);
  const openArtifact = useOpenArtifact();

  const isEdit = artifact !== null;
  const fields = useMemo(
    () =>
      fieldsFor(kindId, definitions).map((f) =>
        f.id === 'title' && k.titlePlaceholder ? { ...f, placeholder: k.titlePlaceholder } : f
      ),
    [kindId, definitions, k.titlePlaceholder]
  );
  // The dialog is mounted per artifact (keyed by ID), so the draft starts once
  const [initial] = useState<Draft>(
    () => artifact ?? { ...defaultValues(fields), ...EMPTY_STRUCTURE[kindId] }
  );
  const [draft, setDraft] = useState<Draft>(initial);
  const dialogTab = useAppStore((s) => s.dialogTab);
  const clearDialogTab = useAppStore((s) => s.clearDialogTab);
  // Back from the link dialog, it opens on the tab it was left on
  const [activeTab, setActiveTab] = useState(() => dialogTab ?? 'overview');
  useEffect(() => {
    if (dialogTab) clearDialogTab();
  }, [dialogTab, clearDialogTab]);
  const [missing, setMissing] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useKeyboardShortcuts({ onClose });

  const id = artifact?.id as string | undefined;

  const customFields = fields.filter(isCustomField);
  const tabOf = (f: FieldDef) => f.tab ?? 'overview';
  const tabs = [
    { id: 'overview', label: 'Overview' },
    ...(k.tabs ?? []),
    ...(overrides.tabs ?? []).map(({ id: tabId, label }) => ({ id: tabId, label })),
    { id: 'relationships', label: 'Relationships' },
    { id: 'customAttributes', label: 'Custom Attributes' },
    ...(isEdit ? [{ id: 'history', label: 'Revision History' }] : []),
  ];

  const change = (patch: Draft) => setDraft((d) => ({ ...d, ...patch }));

  /** The fields shown on a tab: read-only ones only once they have a value */
  const shownOn = (tab: string) =>
    fields.filter((f) => {
      if (tabOf(f) !== tab || f.id === 'revision') return false;
      if (f.id === 'author') return true;
      if (f.readOnly) return isEdit && Boolean(getFieldValue(draft, f));
      return true;
    });

  const renderFields = (list: FieldDef[]) => {
    const short = list.filter((f) => f.type !== 'markdown');
    const long = list.filter((f) => f.type === 'markdown');
    return (
      <div className="tf-form">
        {short.length > 0 && (
          <div className="tf-form-grid">
            {short.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                inputId={`${kindId}-${f.id}`}
                value={f.id === 'author' && !isEdit ? currentUser?.name : getFieldValue(draft, f)}
                onChange={(v) => setDraft((d) => setFieldValue(d, f, v))}
                autoFocus={f.id === 'title' && !isEdit}
              />
            ))}
          </div>
        )}
        {long.map((f) => (
          <FieldInput
            key={f.id}
            field={f}
            inputId={`${kindId}-${f.id}`}
            value={getFieldValue(draft, f)}
            onChange={(v) => setDraft((d) => setFieldValue(d, f, v))}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const empty = missingRequired(draft, fields);
    if (empty.length > 0) {
      setMissing(empty);
      const first = fields.find((f) => f.label === empty[0]);
      if (first) setActiveTab(tabOf(first));
      return;
    }
    onClose();
    // The store shows the result (and any error) when the write is done
    if (isEdit && id) {
      void updateArtifact(kindId, id, changes(initial, draft) as never);
    } else {
      void addArtifact(kindId, draft as NewArtifact<typeof kindId>);
    }
  };

  const handleNavigate = (targetId: string) => {
    if (selectedArtifact) pushNavigationStack(selectedArtifact);
    openArtifact(targetId);
  };

  const extraTab = overrides.tabs?.find((t) => t.id === activeTab);
  const label = k.label.singular;
  const FooterActions = overrides.FooterActions;

  return (
    <BaseArtifactModal
      isOpen
      onClose={onClose}
      onBack={onBack}
      title={
        <span className="tf-dialog-title">
          {isEdit ? `Edit ${label} - ${id}` : `New ${label}`}
          {isEdit && overrides.badge?.(draft)}
        </span>
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : `Create ${label}`}
      formId={`artifact-${kindId}-form`}
      showDeleteConfirm={confirmDelete}
      onDeleteConfirm={() => {
        if (id) void deleteArtifact(kindId, id);
        onClose();
      }}
      onDeleteCancel={() => setConfirmDelete(false)}
      deleteConfirmTitle="Move to Trash"
      deleteConfirmMessage={`Are you sure you want to move this ${label.toLowerCase()} to the trash? You can restore it later from the Trash Bin.`}
      footerActions={
        isEdit && (
          <>
            {FooterActions && <FooterActions artifact={draft} />}
            <button
              type="button"
              className="tf-button tf-button-danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          </>
        )
      }
    >
      {missing.length > 0 && (
        <div role="alert" className="tf-alert">
          Fill in: {missing.join(', ')}
        </div>
      )}

      {activeTab === 'customAttributes' ? (
        customFields.length > 0 ? (
          renderFields(customFields)
        ) : (
          <div className="tf-empty">
            <p>No custom attributes defined for this artifact type.</p>
            <p className="tf-hint">
              Go to Custom Attributes in the sidebar to create attribute definitions.
            </p>
          </div>
        )
      ) : activeTab === 'relationships' ? (
        <ArtifactLinks
          artifactId={id}
          kindLabel={label.toLowerCase()}
          onAddLink={() =>
            id &&
            selectedArtifact &&
            openLinkDialog(id, kindId, { artifact: selectedArtifact, tab: 'relationships' })
          }
          onNavigate={handleNavigate}
        />
      ) : activeTab === 'history' && id ? (
        <RevisionHistoryTab artifactId={id} artifactType={kindId} />
      ) : extraTab ? (
        extraTab.render(draft, change)
      ) : (
        renderFields(shownOn(activeTab))
      )}
    </BaseArtifactModal>
  );
};
