/**
 * Traceability Rules (DESIGN.md §3.3, P2): edit which links are allowed and
 * what counts as coverage. Saving writes tracyfy.yaml, a pending change like
 * any other file. Rules equal to the defaults are not written out, so the
 * project follows the defaults.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { notifyError, useAppStore } from '../state';
import { ARTIFACT_KINDS, type ArtifactKindId } from '../domain/artifactKinds';
import { LINK_TYPES, LINK_TYPE_IDS, type LinkType } from '../domain/linkTypes';
import {
  DEFAULT_TRACEABILITY,
  ruleProblems,
  type AllowedLink,
  type CoverageRule,
  type KindPattern,
  type TraceabilityRules,
} from '../domain/traceability';

const sameRules = (a: TraceabilityRules, b: TraceabilityRules) =>
  JSON.stringify(a) === JSON.stringify(b);

const KindSelect: React.FC<{
  label: string;
  value: KindPattern | undefined;
  /** What the empty choice means: '*' for "Any kind" in a pattern, undefined for "Any kind" in a rule */
  anyValue: '*' | undefined;
  onChange: (value: KindPattern | undefined) => void;
}> = ({ label, value, anyValue, onChange }) => (
  <select
    className="tf-input"
    aria-label={label}
    value={value ?? '*'}
    onChange={(e) => onChange(e.target.value === '*' ? anyValue : (e.target.value as KindPattern))}
  >
    <option value="*">Any kind</option>
    {ARTIFACT_KINDS.map((k) => (
      <option key={k.id} value={k.id}>
        {k.label.singular}
      </option>
    ))}
  </select>
);

const TypeSelect: React.FC<{
  label: string;
  value: LinkType;
  onChange: (value: LinkType) => void;
}> = ({ label, value, onChange }) => (
  <select
    className="tf-input"
    aria-label={label}
    value={value}
    onChange={(e) => onChange(e.target.value as LinkType)}
  >
    {LINK_TYPE_IDS.map((t) => (
      <option key={t} value={t}>
        {LINK_TYPES[t].label}
      </option>
    ))}
  </select>
);

export const TraceabilityRulesPage: React.FC = () => {
  const saved = useAppStore((s) => s.settings.traceability);
  const updateTraceabilityRules = useAppStore((s) => s.updateTraceabilityRules);
  const [draft, setDraft] = useState<TraceabilityRules>(saved);
  const [isSaving, setIsSaving] = useState(false);

  // Follow the file when it changes (a pull, an edit outside the app), but
  // never throw away edits the user has not saved
  const [base, setBase] = useState(saved);
  useEffect(() => {
    if (sameRules(saved, base)) return;
    setDraft((d) => (sameRules(d, base) ? saved : d));
    setBase(saved);
  }, [saved, base]);

  const problems = useMemo(() => ruleProblems(draft), [draft]);
  const isDirty = !sameRules(draft, saved);
  const isDefault = sameRules(draft, DEFAULT_TRACEABILITY);

  const setAllowed = (i: number, rule: AllowedLink) =>
    setDraft((d) => ({ ...d, allowed: d.allowed.map((r, j) => (j === i ? rule : r)) }));
  const setCoverage = (i: number, rule: CoverageRule) =>
    setDraft((d) => ({ ...d, coverage: d.coverage.map((r, j) => (j === i ? rule : r)) }));

  const save = async () => {
    setIsSaving(true);
    try {
      await updateTraceabilityRules(isDefault ? null : draft);
    } catch (error) {
      notifyError('Could not save the traceability rules', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="tf-rules">
      <p className="tf-rules-intro tf-muted">
        Which links the link dialog offers, and which links every artifact must have. Saved in
        tracyfy.yaml as a pending change.
        {isDefault && ' These are the default rules.'}
      </p>

      <section aria-labelledby="allowed-heading">
        <h2 id="allowed-heading">Allowed links</h2>
        <p className="tf-hint">
          A link can be created only if a row allows it. A link already made that no row allows
          shows in the gap list.
        </p>
        <div className="tf-rules-list">
          {draft.allowed.map(([source, type, target], i) => (
            <div key={i} className="tf-rules-row" aria-label={`Allowed link ${i + 1}`} role="group">
              <KindSelect
                label="Source kind"
                value={source}
                anyValue="*"
                onChange={(v) => setAllowed(i, [v ?? '*', type, target])}
              />
              <TypeSelect
                label="Link type"
                value={type}
                onChange={(v) => setAllowed(i, [source, v, target])}
              />
              <KindSelect
                label="Target kind"
                value={target}
                anyValue="*"
                onChange={(v) => setAllowed(i, [source, type, v ?? '*'])}
              />
              <button
                type="button"
                className="tf-icon-button"
                aria-label="Remove"
                onClick={() =>
                  setDraft((d) => ({ ...d, allowed: d.allowed.filter((_, j) => j !== i) }))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="tf-button"
          onClick={() =>
            setDraft((d) => ({ ...d, allowed: [...d.allowed, ['*', 'related_to', '*']] }))
          }
        >
          <Plus size={14} /> Add allowed link
        </button>
      </section>

      <section aria-labelledby="coverage-heading">
        <h2 id="coverage-heading">Coverage rules</h2>
        <p className="tf-hint">
          Every artifact of the kind must have at least one such link. One that does not is a gap,
          named by the rule.
        </p>
        <div className="tf-rules-list">
          {draft.coverage.map((rule, i) => {
            const incoming = 'incoming' in rule.needs;
            const type = 'incoming' in rule.needs ? rule.needs.incoming : rule.needs.outgoing;
            const other = 'incoming' in rule.needs ? rule.needs.from : rule.needs.to;
            const needs = (dir: boolean, t: LinkType, k: ArtifactKindId | undefined) =>
              dir
                ? { incoming: t, ...(k ? { from: k } : {}) }
                : { outgoing: t, ...(k ? { to: k } : {}) };
            return (
              <div
                key={i}
                className="tf-rules-row tf-rules-coverage"
                aria-label={`Coverage rule ${i + 1}`}
                role="group"
              >
                <input
                  className="tf-input tf-rules-name"
                  aria-label="Rule name"
                  placeholder="Name the rule"
                  value={rule.name}
                  onChange={(e) => setCoverage(i, { ...rule, name: e.target.value })}
                />
                <span>Every</span>
                <select
                  className="tf-input"
                  aria-label="Kind"
                  value={rule.kind}
                  onChange={(e) =>
                    setCoverage(i, { ...rule, kind: e.target.value as ArtifactKindId })
                  }
                >
                  {ARTIFACT_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label.singular}
                    </option>
                  ))}
                </select>
                <select
                  className="tf-input"
                  aria-label="Direction"
                  value={incoming ? 'incoming' : 'outgoing'}
                  onChange={(e) =>
                    setCoverage(i, {
                      ...rule,
                      needs: needs(e.target.value === 'incoming', type, other),
                    })
                  }
                >
                  <option value="incoming">is the target of</option>
                  <option value="outgoing">is the source of</option>
                </select>
                <TypeSelect
                  label="Needed link type"
                  value={type}
                  onChange={(t) => setCoverage(i, { ...rule, needs: needs(incoming, t, other) })}
                />
                <span>{incoming ? 'from' : 'to'}</span>
                <KindSelect
                  label="Other kind"
                  value={other}
                  anyValue={undefined}
                  onChange={(k) =>
                    setCoverage(i, {
                      ...rule,
                      needs: needs(incoming, type, k as ArtifactKindId | undefined),
                    })
                  }
                />
                <button
                  type="button"
                  className="tf-icon-button"
                  aria-label="Remove"
                  onClick={() =>
                    setDraft((d) => ({ ...d, coverage: d.coverage.filter((_, j) => j !== i) }))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          className="tf-button"
          onClick={() =>
            setDraft((d) => ({
              ...d,
              coverage: [
                ...d.coverage,
                {
                  name: '',
                  kind: 'requirement',
                  needs: { incoming: 'verifies', from: 'testCase' },
                },
              ],
            }))
          }
        >
          <Plus size={14} /> Add coverage rule
        </button>
      </section>

      {(problems.errors.length > 0 || problems.warnings.length > 0) && (
        <div className="tf-problems" role="alert">
          {problems.errors.map((p) => (
            <div key={p} className="tf-rules-error">
              {p}
            </div>
          ))}
          {problems.warnings.map((p) => (
            <div key={p} className="tf-rules-warning">
              {p}
            </div>
          ))}
        </div>
      )}

      <div className="tf-rules-actions">
        <button
          type="button"
          className="tf-button"
          disabled={isDefault}
          onClick={() => setDraft(DEFAULT_TRACEABILITY)}
        >
          Reset to defaults
        </button>
        <span className="tf-rules-spacer" />
        <button
          type="button"
          className="tf-button"
          disabled={!isDirty || isSaving}
          onClick={() => setDraft(saved)}
        >
          Discard
        </button>
        <button
          type="button"
          className="tf-button tf-button-primary"
          disabled={!isDirty || isSaving || problems.errors.length > 0}
          onClick={() => void save()}
        >
          Save
        </button>
      </div>
    </div>
  );
};
