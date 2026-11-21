import { describe, it, expect } from 'vitest';
import { DEFAULT_TRACEABILITY, ruleProblems, type TraceabilityRules } from '../traceability';
import {
  defaultProjectConfig,
  parseProjectConfig,
  serializeProjectConfig,
  settingsOf,
  withTraceability,
} from '../projectConfig';

const verified: TraceabilityRules = {
  allowed: [['testCase', 'verifies', 'requirement']],
  coverage: [
    {
      name: 'Every requirement is verified',
      kind: 'requirement',
      needs: { incoming: 'verifies', from: 'testCase' },
    },
  ],
};

describe('ruleProblems', () => {
  it('the default rules have no problems', () => {
    expect(ruleProblems(DEFAULT_TRACEABILITY)).toEqual({ errors: [], warnings: [] });
  });

  it('a coverage rule without a name, or with a name used twice, is an error', () => {
    const rules: TraceabilityRules = {
      ...verified,
      coverage: [
        verified.coverage[0],
        { ...verified.coverage[0] },
        { ...verified.coverage[0], name: '  ' },
      ],
    };
    expect(ruleProblems(rules).errors).toEqual([
      'Two coverage rules are named "Every requirement is verified".',
      'Coverage rule 3 has no name.',
    ]);
  });

  it('the same allowed link twice is an error', () => {
    const rules = { ...verified, allowed: [...verified.allowed, ...verified.allowed] };
    expect(ruleProblems(rules).errors).toEqual([
      'The allowed link "testCase verifies requirement" is listed twice.',
    ]);
  });

  it('a coverage rule no allowed link can meet is a warning', () => {
    const rules = { ...verified, allowed: [['requirement', 'refines', 'requirement']] } as const;
    expect(ruleProblems(rules)).toEqual({
      errors: [],
      warnings: [
        'No allowed link can meet "Every requirement is verified", so its gaps can never be closed.',
      ],
    });
  });

  it('a wildcard or a symmetric link type can meet a coverage rule', () => {
    expect(ruleProblems({ ...verified, allowed: [['*', 'verifies', '*']] }).warnings).toEqual([]);
    expect(
      ruleProblems({
        allowed: [['requirement', 'related_to', 'risk']],
        coverage: [{ name: 'Risks are related', kind: 'risk', needs: { outgoing: 'related_to' } }],
      }).warnings
    ).toEqual([]);
  });

  it('an outgoing rule needs an allowed link from its kind', () => {
    const rules: TraceabilityRules = {
      allowed: [['testCase', 'verifies', 'requirement']],
      coverage: [{ name: 'Risks verify', kind: 'risk', needs: { outgoing: 'verifies' } }],
    };
    expect(ruleProblems(rules).warnings).toHaveLength(1);
  });
});

describe('withTraceability', () => {
  it('writes the rules in full, and they read back as the rules in effect', () => {
    const config = withTraceability(defaultProjectConfig('p'), verified);
    const reread = parseProjectConfig(serializeProjectConfig(config));
    expect(settingsOf(reread).traceability).toEqual(verified);
  });

  it('null removes the rules from the file, so the defaults apply', () => {
    const custom = withTraceability(defaultProjectConfig('p'), verified);
    const reset = withTraceability(custom, null);
    const text = serializeProjectConfig(reset);
    expect(text).not.toMatch(/traceability/);
    expect(settingsOf(parseProjectConfig(text)).traceability).toEqual(DEFAULT_TRACEABILITY);
  });

  it('a rule name is saved trimmed', () => {
    const config = withTraceability(defaultProjectConfig('p'), {
      ...verified,
      coverage: [{ ...verified.coverage[0], name: '  Verified  ' }],
    });
    expect(config.traceability?.coverage?.[0].name).toBe('Verified');
  });
});
