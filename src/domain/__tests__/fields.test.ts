import { describe, it, expect } from 'vitest';
import { ARTIFACT_KINDS, fieldsFor } from '../artifactKinds';
import {
  defaultValues,
  fieldText,
  getFieldValue,
  missingRequired,
  setFieldValue,
  type FieldDef,
} from '../fields';
import type { CustomAttributeDefinition } from '../../types/customAttributes';

const component: CustomAttributeDefinition = {
  id: 'ATTR-001',
  name: 'Component',
  type: 'dropdown',
  options: ['UI', 'Backend'],
  defaultValue: 'UI',
  required: true,
  appliesTo: ['requirement'],
};
const reviewed: CustomAttributeDefinition = {
  id: 'ATTR-002',
  name: 'Reviewed',
  type: 'checkbox',
  appliesTo: ['risk'],
};

describe('fields of a kind', () => {
  it('built-in and custom fields come from one list', () => {
    const ids = fieldsFor('requirement', [component, reviewed]).map((f) => f.id);
    expect(ids.slice(0, 3)).toEqual(['title', 'status', 'priority']);
    expect(ids).toContain('text');
    // A custom attribute is a field of the kinds it applies to, and only those
    expect(ids).toContain('attr:ATTR-001');
    expect(ids).not.toContain('attr:ATTR-002');
    expect(fieldsFor('risk', [component, reviewed]).map((f) => f.id)).toContain('attr:ATTR-002');
  });

  it('every kind has a title and a status with options, and unique field ids', () => {
    for (const k of ARTIFACT_KINDS) {
      const fields = fieldsFor(k.id);
      expect(new Set(fields.map((f) => f.id)).size, k.id).toBe(fields.length);
      expect(fields.find((f) => f.id === 'status')?.options?.length, k.id).toBeGreaterThan(0);
      // Tabs a field names must exist
      const tabs = new Set(['overview', ...(k.tabs ?? []).map((t) => t.id)]);
      for (const f of k.fields) expect(tabs.has(f.tab ?? 'overview'), `${k.id}.${f.id}`).toBe(true);
    }
  });
});

describe('field values', () => {
  const [componentField] = fieldsFor('requirement', [component]).filter((f) =>
    f.id.startsWith('attr:')
  );
  const title = fieldsFor('requirement')[0];

  it('read and write built-in and custom fields the same way', () => {
    let item: object = { title: 'Login', customAttributes: [] };
    item = setFieldValue(item, componentField, 'Backend');
    item = setFieldValue(item, title, 'Logout');
    expect(getFieldValue(item, componentField)).toBe('Backend');
    expect(getFieldValue(item, title)).toBe('Logout');
    expect(item).toEqual({
      title: 'Logout',
      customAttributes: [{ attributeId: 'ATTR-001', value: 'Backend' }],
    });
    // Setting it again replaces the value, it does not add a second one
    item = setFieldValue(item, componentField, 'UI');
    expect((item as { customAttributes: unknown[] }).customAttributes).toHaveLength(1);
  });

  it('a new artifact starts with each default, custom ones included', () => {
    const values = defaultValues(fieldsFor('risk', []));
    expect(values).toMatchObject({ status: 'identified', category: 'other', impact: 'medium' });
    const req = defaultValues(fieldsFor('requirement', [component]));
    expect(req.customAttributes).toEqual([{ attributeId: 'ATTR-001', value: 'UI' }]);
    // Bookkeeping fields are the app's, not the form's
    expect(req).not.toHaveProperty('author');
    expect(req).not.toHaveProperty('revision');
  });

  it('names required fields that are empty', () => {
    const fields: FieldDef[] = fieldsFor('useCase', [{ ...component, appliesTo: ['useCase'] }]);
    expect(missingRequired({ title: ' ', actor: '', customAttributes: [] }, fields)).toEqual([
      'Title',
      'Actor',
      'Component',
    ]);
    expect(
      missingRequired(
        {
          title: 'Login',
          actor: 'User',
          customAttributes: [{ attributeId: 'ATTR-001', value: 'UI' }],
        },
        fields
      )
    ).toEqual([]);
  });

  it('reads enum and boolean values as text', () => {
    const [statusField] = fieldsFor('document').filter((f) => f.id === 'status');
    expect(fieldText({ status: 'in_review' }, statusField)).toBe('In review');
    const [checkbox] = fieldsFor('risk', [reviewed]).filter((f) => f.type === 'boolean');
    expect(
      fieldText({ customAttributes: [{ attributeId: 'ATTR-002', value: true }] }, checkbox)
    ).toBe('Yes');
  });
});

describe('kind rules', () => {
  it('a test case records when it last ran, once per change to passed or failed', async () => {
    const { savedByTheApp } = await import('../kindRules');
    expect(savedByTheApp('testCase', { status: 'draft' }, { status: 'passed' }, 9)).toEqual({
      lastRun: 9,
    });
    expect(savedByTheApp('testCase', undefined, { status: 'failed' }, 9)).toEqual({ lastRun: 9 });
    expect(savedByTheApp('testCase', { status: 'passed' }, { status: 'passed' }, 9)).toEqual({});
    expect(savedByTheApp('requirement', undefined, { status: 'passed' }, 9)).toEqual({});
  });

  it('risk level is probability times impact', async () => {
    const { riskLevel } = await import('../kindRules');
    expect(riskLevel('low', 'medium')).toBe('low');
    expect(riskLevel('medium', 'medium')).toBe('medium');
    expect(riskLevel('high', 'medium')).toBe('high');
  });
});
