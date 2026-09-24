import { useMemo, useState } from 'react';
import type { Diagnosis, Finding, Region, Symptom, Test, TestBranch } from '../lib/types';

interface Opt {
  id: string;
  label: string;
}

interface Props {
  region: Region;
  tests: Record<string, Test>;
  diagnoses: Record<string, Diagnosis>;
  onSave: (region: Region) => Promise<void>;
  onClose: () => void;
}

// Normalisera så varje gren har positive/negative med arrayer
function normalize(region: Region): Region {
  const symptoms: Symptom[] = (region.symptoms ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    tests: (s.tests ?? []).map((b) => ({
      test: b.test,
      positive: fill(b.positive),
      negative: fill(b.negative),
    })),
  }));
  return { ...region, symptoms };
}
function fill(f?: Finding): Finding {
  return { finding: f?.finding ?? '', diagnoses: f?.diagnoses ?? [], next_tests: f?.next_tests ?? [] };
}
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function IdMultiSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: Opt[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const available = options.filter((o) => !value.includes(o.id));
  return (
    <div className="ms">
      <div className="ms__chips">
        {value.map((id) => (
          <span key={id} className="ms__chip">
            {options.find((o) => o.id === id)?.label ?? id}
            <button type="button" onClick={() => onChange(value.filter((v) => v !== id))} aria-label="Ta bort">
              ×
            </button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...value, e.target.value]);
        }}
      >
        <option value="">+ {placeholder}</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FindingEditor({
  title,
  finding,
  testOpts,
  dxOpts,
  onChange,
}: {
  title: string;
  finding: Finding;
  testOpts: Opt[];
  dxOpts: Opt[];
  onChange: (f: Finding) => void;
}) {
  return (
    <div className="te-finding">
      <span className="te-finding__title">{title}</span>
      <input
        className="te-input"
        placeholder="Fynd (text)"
        value={finding.finding ?? ''}
        onChange={(e) => onChange({ ...finding, finding: e.target.value })}
      />
      <label className="te-label">Diagnoser</label>
      <IdMultiSelect
        options={dxOpts}
        value={finding.diagnoses ?? []}
        onChange={(v) => onChange({ ...finding, diagnoses: v })}
        placeholder="lägg till diagnos"
      />
      <label className="te-label">Nästa tester</label>
      <IdMultiSelect
        options={testOpts}
        value={finding.next_tests ?? []}
        onChange={(v) => onChange({ ...finding, next_tests: v })}
        placeholder="lägg till test"
      />
    </div>
  );
}

export function TreeEditor({ region, tests, diagnoses, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Region>(() => normalize(region));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testOpts = useMemo<Opt[]>(
    () => Object.values(tests).map((t) => ({ id: t.id, label: t.name })).sort((a, b) => a.label.localeCompare(b.label, 'sv')),
    [tests],
  );
  const dxOpts = useMemo<Opt[]>(
    () => Object.values(diagnoses).map((d) => ({ id: d.id, label: d.name })).sort((a, b) => a.label.localeCompare(b.label, 'sv')),
    [diagnoses],
  );

  const setSymptoms = (fn: (s: Symptom[]) => Symptom[]) =>
    setDraft((d) => ({ ...d, symptoms: fn(d.symptoms) }));

  const updateBranch = (si: number, bi: number, patch: Partial<TestBranch>) =>
    setSymptoms((syms) =>
      syms.map((s, i) =>
        i !== si ? s : { ...s, tests: s.tests.map((b, j) => (j === bi ? { ...b, ...patch } : b)) },
      ),
    );

  const addSymptom = () =>
    setSymptoms((syms) => [...syms, { id: `symtom-${syms.length + 1}`, label: 'Nytt symtom', tests: [] }]);
  const removeSymptom = (si: number) => setSymptoms((syms) => syms.filter((_, i) => i !== si));
  const addBranch = (si: number) =>
    setSymptoms((syms) =>
      syms.map((s, i) =>
        i !== si ? s : { ...s, tests: [...s.tests, { test: testOpts[0]?.id ?? '', positive: fill(), negative: fill() }] },
      ),
    );
  const removeBranch = (si: number, bi: number) =>
    setSymptoms((syms) => syms.map((s, i) => (i !== si ? s : { ...s, tests: s.tests.filter((_, j) => j !== bi) })));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="guided" role="dialog" aria-label="Redigera träd">
      <div className="guided__box tree-editor">
        <button type="button" className="guided__close" onClick={onClose} aria-label="Stäng">
          ×
        </button>
        <span className="side-panel__tag">Trädredigerare</span>
        <h2>Redigera träd</h2>
        <label className="te-label">Regionens namn</label>
        <input
          className="te-input"
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
        />

        {draft.symptoms.map((s, si) => (
          <div key={si} className="te-symptom">
            <div className="te-symptom__head">
              <input
                className="te-input"
                value={s.label}
                onChange={(e) =>
                  setSymptoms((syms) =>
                    syms.map((x, i) =>
                      i !== si
                        ? x
                        : { ...x, label: e.target.value, id: x.id || slugify(e.target.value) },
                    ),
                  )
                }
                placeholder="Symtomets namn"
              />
              <button type="button" className="te-del" onClick={() => removeSymptom(si)}>
                Ta bort symtom
              </button>
            </div>

            {s.tests.map((b, bi) => (
              <div key={bi} className="te-branch">
                <div className="te-branch__head">
                  <select
                    className="te-input"
                    value={b.test}
                    onChange={(e) => updateBranch(si, bi, { test: e.target.value })}
                  >
                    {testOpts.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="te-del" onClick={() => removeBranch(si, bi)}>
                    ✕
                  </button>
                </div>
                <FindingEditor
                  title="Positivt"
                  finding={b.positive ?? fill()}
                  testOpts={testOpts}
                  dxOpts={dxOpts}
                  onChange={(f) => updateBranch(si, bi, { positive: f })}
                />
                <FindingEditor
                  title="Negativt"
                  finding={b.negative ?? fill()}
                  testOpts={testOpts}
                  dxOpts={dxOpts}
                  onChange={(f) => updateBranch(si, bi, { negative: f })}
                />
              </div>
            ))}
            <button type="button" className="te-add" onClick={() => addBranch(si)}>
              + Lägg till test
            </button>
          </div>
        ))}

        <button type="button" className="te-add te-add--symptom" onClick={addSymptom}>
          + Lägg till symtom
        </button>

        {error && <p className="edit__error">{error}</p>}
        <div className="edit__actions te-actions">
          <button type="button" className="edit__save" onClick={save} disabled={saving}>
            {saving ? 'Sparar…' : 'Spara träd'}
          </button>
          <button type="button" onClick={onClose} disabled={saving}>
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}
