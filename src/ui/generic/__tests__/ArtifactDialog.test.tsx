/**
 * The dialog is generated from the registry: every editable field of every
 * kind, built-in or custom, gets an input on its tab without any UI code.
 */
import { describe, it, expect } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { ARTIFACT_KINDS, fieldsFor } from '../../../domain/artifactKinds';
import type { CustomAttributeDefinition } from '../../../types/customAttributes';
import { renderWithStore } from '../../../test/renderWithStore';
import { ArtifactDialog } from '../ArtifactDialog';

const everyKind: CustomAttributeDefinition = {
  id: 'ATTR-009',
  name: 'Release',
  type: 'text',
  appliesTo: ARTIFACT_KINDS.map((k) => k.id),
};

describe.each(ARTIFACT_KINDS.map((k) => ({ ...k, name: k.label.singular })))(
  'ArtifactDialog for a $name',
  (k) => {
    it('shows an input for each editable field, on the tab the field names', () => {
      renderWithStore(<ArtifactDialog kindId={k.id} artifact={null} onClose={() => {}} />, {
        state: {
          attributeDefinitions: [everyKind],
          currentUser: { name: 'Ada', email: 'ada@example.com' } as never,
        },
      });
      const dialog = screen.getByRole('dialog');
      const editable = fieldsFor(k.id, [everyKind]).filter((f) => !f.readOnly && f.type !== 'user');
      const tabLabel = (tab: string) =>
        tab === 'overview'
          ? 'Overview'
          : tab === 'customAttributes'
            ? 'Custom Attributes'
            : k.tabs!.find((t) => t.id === tab)!.label;

      for (const field of editable) {
        fireEvent.click(
          within(dialog).getByRole('button', { name: tabLabel(field.tab ?? 'overview') })
        );
        expect(
          within(dialog).getByText(field.label, { exact: false }),
          field.id
        ).toBeInTheDocument();
      }
      // The user is the author of what they create
      fireEvent.click(within(dialog).getByRole('button', { name: 'Overview' }));
      expect(within(dialog).getByLabelText('Author')).toHaveValue('Ada');
    });
  }
);
