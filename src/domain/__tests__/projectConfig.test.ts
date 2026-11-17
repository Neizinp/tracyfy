import { describe, it, expect } from 'vitest';
import {
  parseProjectConfig,
  serializeProjectConfig,
  ProjectConfigError,
  type ProjectConfig,
} from '../projectConfig';

const TRICKY = 'Line: one\n# not a heading\n  indented "quoted" \'single\'\n---\nlast';

const config: ProjectConfig = {
  schemaVersion: 1,
  name: 'Project: "Alpha" #1',
  description: TRICKY,
  customAttributes: [
    {
      id: 'ATTR-001',
      name: 'Component: name',
      type: 'dropdown',
      description: TRICKY,
      required: true,
      defaultValue: 'Engine',
      options: ['Engine', 'Brakes: front', 'yes'],
      appliesTo: ['requirement', 'testCase', 'link'],
    },
    { id: 'ATTR-002', name: 'Effort', type: 'number', defaultValue: 0, appliesTo: ['risk'] },
  ],
};

describe('tracyfy.yaml', () => {
  it('round-trips every field exactly', () => {
    expect(parseProjectConfig(serializeProjectConfig(config))).toEqual(config);
  });

  it('is readable plain text', () => {
    const text = serializeProjectConfig({
      schemaVersion: 1,
      name: 'Door Controller',
      description: 'Controls the lobby doors.\nAnd the garage.',
      customAttributes: [],
    });
    expect(text).toBe(
      'schemaVersion: 1\nname: Door Controller\ndescription: |-\n  Controls the lobby doors.\n  And the garage.\n'
    );
  });

  it('fills in what a hand-written file leaves out', () => {
    expect(parseProjectConfig('schemaVersion: 1\nname: Alpha\n')).toEqual({
      schemaVersion: 1,
      name: 'Alpha',
      description: '',
      customAttributes: [],
    });
  });

  it('reports what is wrong instead of loading wrong settings', () => {
    expect(() => parseProjectConfig('name: [unclosed')).toThrow(ProjectConfigError);
    expect(() => parseProjectConfig('schemaVersion: 2\nname: Alpha\n')).toThrow(/schemaVersion/);
    expect(() =>
      parseProjectConfig(
        'schemaVersion: 1\nname: Alpha\ncustomAttributes:\n  - id: X\n    name: A\n    type: color\n    appliesTo: [requirement]\n'
      )
    ).toThrow(/customAttributes\.0\.id.*customAttributes\.0\.type/);
  });
});
