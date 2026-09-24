import { useState } from 'react';
import type { Diagnosis, Region, Test } from '../lib/types';

type Kind = 'test' | 'diagnos' | 'region';

interface Props {
  regions: Region[];
  currentRegionId: string;
  onCreateTest: (t: Test) => Promise<void>;
  onCreateDiagnosis: (d: Diagnosis) => Promise<void>;
  onCreateRegion: (r: Region) => Promise<void>;
  onClose: () => void;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function NewItemModal({
  regions,
  currentRegionId,
  onCreateTest,
  onCreateDiagnosis,
  onCreateRegion,
  onClose,
}: Props) {
  const [kind, setKind] = useState<Kind>('test');
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [region, setRegion] = useState(currentRegionId);
  const [structure, setStructure] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveId = id || slugify(name);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveId) return setError('Ange ett namn/id');
    setBusy(true);
    setError(null);
    try {
      if (kind === 'test') {
        await onCreateTest({
          id: effectiveId, name, region, structure,
          sensitivity: null, specificity: null, lr_positive: null, lr_negative: null,
          source: '', video: '', body: '',
        });
      } else if (kind === 'diagnos') {
        await onCreateDiagnosis({ id: effectiveId, name, umbrella: null, related_tests: [], body: '' });
      } else {
        await onCreateRegion({ region: effectiveId, label: name, symptoms: [] });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skapa');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="guided" role="dialog" aria-label="Skapa ny">
      <form className="guided__box login" onSubmit={submit}>
        <button type="button" className="guided__close" onClick={onClose} aria-label="Stäng">
          ×
        </button>
        <span className="side-panel__tag">Skapa ny</span>
        <h2>Skapa ny…</h2>
        <div className="edit">
          <div className="te-kinds">
            {(['test', 'diagnos', 'region'] as Kind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={kind === k ? 'te-kind te-kind--active' : 'te-kind'}
                onClick={() => setKind(k)}
              >
                {k === 'test' ? 'Test' : k === 'diagnos' ? 'Diagnos' : 'Region'}
              </button>
            ))}
          </div>

          <label>
            Namn
            <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </label>
          <label>
            Id (auto, redigerbart)
            <input value={effectiveId} onChange={(e) => setId(e.target.value)} placeholder="gemener-med-bindestreck" />
          </label>

          {kind === 'test' && (
            <>
              <label>
                Region
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                  {regions.map((r) => (
                    <option key={r.region} value={r.region}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Struktur
                <input value={structure} onChange={(e) => setStructure(e.target.value)} />
              </label>
            </>
          )}

          <p className="side-panel__muted" style={{ margin: 0 }}>
            {kind === 'test'
              ? 'Träffsäkerhet, video och text fyller du i via Redigera efteråt.'
              : kind === 'diagnos'
                ? 'Beskrivning och relaterade tester fyller du i via Redigera efteråt.'
                : 'Bygg upp trädet via Redigera träd efteråt.'}
          </p>

          {error && <p className="edit__error">{error}</p>}
          <div className="edit__actions">
            <button type="submit" className="edit__save" disabled={busy}>
              {busy ? 'Skapar…' : 'Skapa'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
