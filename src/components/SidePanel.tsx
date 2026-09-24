import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Diagnosis, Test } from '../lib/types';

interface Props {
  test?: Test;
  diagnosis?: Diagnosis;
  isAdmin: boolean;
  onClose: () => void;
  onSelectTest?: (id: string) => void;
  onSaveTest: (id: string, test: Test) => Promise<void>;
  onSaveDiagnosis: (id: string, diagnosis: Diagnosis) => Promise<void>;
}

function formatPercent(value: number | null): string {
  return value == null ? 'ej angivet' : `${Math.round(value * 100)} %`;
}
function formatLr(value: number | null): string {
  return value == null ? 'ej angivet' : value.toFixed(1);
}

// Styrka på likelihood ratio (grov tolkning)
function lrStrength(kind: 'pos' | 'neg', v: number | null): string | null {
  if (v == null) return null;
  if (kind === 'pos') {
    if (v >= 10) return 'stor';
    if (v >= 5) return 'måttlig';
    if (v >= 2) return 'liten';
    return 'obetydlig';
  }
  if (v <= 0.1) return 'stor';
  if (v <= 0.2) return 'måttlig';
  if (v <= 0.5) return 'liten';
  return 'obetydlig';
}

// Kort tolkning av sensitivitet/specificitet
function snSpNotes(test: Test): string[] {
  const notes: string[] = [];
  if (test.sensitivity != null && test.sensitivity >= 0.85)
    notes.push('Högt sensitivt – ett negativt test hjälper att utesluta (SnNout).');
  if (test.specificity != null && test.specificity >= 0.85)
    notes.push('Högt specifikt – ett positivt test hjälper att bekräfta (SpPin).');
  return notes;
}
function numOrNull(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/* ---------- Läsvy: test ---------- */
function TestView({ test }: { test: Test }) {
  const hasData =
    test.sensitivity != null ||
    test.specificity != null ||
    test.lr_positive != null ||
    test.lr_negative != null;
  return (
    <>
      <p className="side-panel__structure">
        Belastar: <strong>{test.structure || 'ej angivet'}</strong>
      </p>
      <h3>Diagnostisk träffsäkerhet</h3>
      {hasData ? (
        <>
          <table className="accuracy">
            <tbody>
              <tr><td>Sensitivitet</td><td>{formatPercent(test.sensitivity)}</td></tr>
              <tr><td>Specificitet</td><td>{formatPercent(test.specificity)}</td></tr>
              <tr>
                <td>LR+</td>
                <td>
                  {formatLr(test.lr_positive)}
                  {lrStrength('pos', test.lr_positive) && (
                    <span className="accuracy__tag"> ({lrStrength('pos', test.lr_positive)})</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>LR−</td>
                <td>
                  {formatLr(test.lr_negative)}
                  {lrStrength('neg', test.lr_negative) && (
                    <span className="accuracy__tag"> ({lrStrength('neg', test.lr_negative)})</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          {snSpNotes(test).map((n) => (
            <p key={n} className="side-panel__interpret">{n}</p>
          ))}
          <details className="side-panel__explain">
            <summary>Vad betyder siffrorna?</summary>
            <p><strong>Sensitivitet</strong> = andel sjuka som testet fångar. Högt värde → ett <em>negativt</em> test hjälper att utesluta (SnNout).</p>
            <p><strong>Specificitet</strong> = andel friska som testet friar. Högt värde → ett <em>positivt</em> test hjälper att bekräfta (SpPin).</p>
            <p><strong>LR+</strong> ökar sannolikheten vid positivt test (&gt;10 stor, 5–10 måttlig). <strong>LR−</strong> minskar den vid negativt test (&lt;0,1 stor, 0,1–0,2 måttlig).</p>
          </details>
        </>
      ) : (
        <p className="side-panel__muted">Ännu ingen källbelagd data.</p>
      )}
      {test.source && <p className="side-panel__source">Källa: {test.source}</p>}
      {test.video && (
        <p>
          <a href={test.video} target="_blank" rel="noreferrer" className="side-panel__video">
            ▶ Se demonstration på Physiotutors (YouTube)
          </a>
        </p>
      )}
      <div className="side-panel__body">
        <ReactMarkdown>{test.body}</ReactMarkdown>
      </div>
    </>
  );
}

/* ---------- Redigeringsvy: test ---------- */
function TestEdit({
  test,
  onSave,
  onCancel,
}: {
  test: Test;
  onSave: (t: Test) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Test>(test);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setForm(test), [test]);

  const set = (patch: Partial<Test>) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit">
      <label>Namn<input value={form.name} onChange={(e) => set({ name: e.target.value })} /></label>
      <label>Struktur<input value={form.structure} onChange={(e) => set({ structure: e.target.value })} /></label>
      <div className="edit__row">
        <label>Sensitivitet (0–1)<input value={form.sensitivity ?? ''} onChange={(e) => set({ sensitivity: numOrNull(e.target.value) })} /></label>
        <label>Specificitet (0–1)<input value={form.specificity ?? ''} onChange={(e) => set({ specificity: numOrNull(e.target.value) })} /></label>
      </div>
      <div className="edit__row">
        <label>LR+<input value={form.lr_positive ?? ''} onChange={(e) => set({ lr_positive: numOrNull(e.target.value) })} /></label>
        <label>LR−<input value={form.lr_negative ?? ''} onChange={(e) => set({ lr_negative: numOrNull(e.target.value) })} /></label>
      </div>
      <label>Källa<input value={form.source} onChange={(e) => set({ source: e.target.value })} /></label>
      <label>Video-URL<input value={form.video} onChange={(e) => set({ video: e.target.value })} /></label>
      <label>Brödtext (Markdown)<textarea rows={8} value={form.body} onChange={(e) => set({ body: e.target.value })} /></label>
      {error && <p className="edit__error">{error}</p>}
      <div className="edit__actions">
        <button type="button" className="edit__save" onClick={save} disabled={saving}>
          {saving ? 'Sparar…' : 'Spara'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>Avbryt</button>
      </div>
    </div>
  );
}

/* ---------- Läsvy: diagnos ---------- */
function DiagnosisView({
  diagnosis,
  onSelectTest,
}: {
  diagnosis: Diagnosis;
  onSelectTest?: (id: string) => void;
}) {
  return (
    <>
      {diagnosis.umbrella && (
        <p className="side-panel__structure">
          Paraplydiagnos: <strong>{diagnosis.umbrella}</strong>
        </p>
      )}
      <div className="side-panel__body">
        <ReactMarkdown>{diagnosis.body}</ReactMarkdown>
      </div>
      {diagnosis.related_tests?.length > 0 && (
        <>
          <h3>Relaterade tester</h3>
          <ul className="side-panel__links">
            {diagnosis.related_tests.map((t) => (
              <li key={t}>
                <button type="button" onClick={() => onSelectTest?.(t)}>{t}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

/* ---------- Redigeringsvy: diagnos ---------- */
function DiagnosisEdit({
  diagnosis,
  onSave,
  onCancel,
}: {
  diagnosis: Diagnosis;
  onSave: (d: Diagnosis) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Diagnosis>(diagnosis);
  const [related, setRelated] = useState(diagnosis.related_tests.join(', '));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setForm(diagnosis);
    setRelated(diagnosis.related_tests.join(', '));
  }, [diagnosis]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...form,
        related_tests: related.split(',').map((s) => s.trim()).filter(Boolean),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte spara');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit">
      <label>Namn<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Paraplydiagnos (id, valfritt)<input value={form.umbrella ?? ''} onChange={(e) => setForm({ ...form, umbrella: e.target.value || null })} /></label>
      <label>Relaterade tester (id, kommaseparerat)<input value={related} onChange={(e) => setRelated(e.target.value)} /></label>
      <label>Brödtext (Markdown)<textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label>
      {error && <p className="edit__error">{error}</p>}
      <div className="edit__actions">
        <button type="button" className="edit__save" onClick={save} disabled={saving}>
          {saving ? 'Sparar…' : 'Spara'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving}>Avbryt</button>
      </div>
    </div>
  );
}

export function SidePanel({
  test,
  diagnosis,
  isAdmin,
  onClose,
  onSelectTest,
  onSaveTest,
  onSaveDiagnosis,
}: Props) {
  const [editing, setEditing] = useState(false);
  // Avsluta redigering när valet ändras eller panelen stängs
  useEffect(() => setEditing(false), [test?.id, diagnosis?.id]);

  if (!test && !diagnosis) return null;

  return (
    <aside className="side-panel">
      <button type="button" className="side-panel__close" onClick={onClose} aria-label="Stäng">×</button>
      <span className="side-panel__tag">{test ? 'Test' : 'Diagnos'}</span>
      <h2>{test ? test.name : diagnosis!.name}</h2>

      {isAdmin && !editing && (
        <button type="button" className="side-panel__edit" onClick={() => setEditing(true)}>
          ✎ Redigera
        </button>
      )}

      {test &&
        (editing ? (
          <TestEdit
            test={test}
            onCancel={() => setEditing(false)}
            onSave={async (t) => {
              await onSaveTest(test.id, t);
              setEditing(false);
            }}
          />
        ) : (
          <TestView test={test} />
        ))}

      {diagnosis &&
        (editing ? (
          <DiagnosisEdit
            diagnosis={diagnosis}
            onCancel={() => setEditing(false)}
            onSave={async (d) => {
              await onSaveDiagnosis(diagnosis.id, d);
              setEditing(false);
            }}
          />
        ) : (
          <DiagnosisView diagnosis={diagnosis} onSelectTest={onSelectTest} />
        ))}
    </aside>
  );
}
