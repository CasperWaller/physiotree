import { useMemo, useState } from 'react';
import type { NodeKind, Region, TestBranch } from '../lib/types';
import { diagnoses, tests } from '../lib/content';

interface Props {
  region: Region;
  onClose: () => void;
  onSelect: (kind: NodeKind, refId?: string) => void;
}

type Answer = 'positive' | 'negative' | null;

export function GuidedMode({ region, onClose, onSelect }: Props) {
  // Global karta: test-id -> gren (varje test definieras en gång)
  const branches = useMemo(() => {
    const map = new Map<string, TestBranch>();
    for (const s of region.symptoms) {
      for (const b of s.tests) if (!map.has(b.test)) map.set(b.test, b);
    }
    return map;
  }, [region]);

  const [symptomId, setSymptomId] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Answer>(null);

  const restart = () => {
    setSymptomId(null);
    setTestId(null);
    setAnswer(null);
  };

  const startSymptom = (id: string) => {
    const symptom = region.symptoms.find((s) => s.id === id);
    setSymptomId(id);
    setTestId(symptom?.tests[0]?.test ?? null);
    setAnswer(null);
  };

  const goToTest = (id: string) => {
    setTestId(id);
    setAnswer(null);
  };

  const symptom = region.symptoms.find((s) => s.id === symptomId);
  const branch = testId ? branches.get(testId) : undefined;
  const test = testId ? tests[testId] : undefined;
  const finding = answer ? branch?.[answer] : undefined;

  return (
    <div className="guided" role="dialog" aria-label="Guidat läge">
      <div className="guided__box">
        <button type="button" className="guided__close" onClick={onClose} aria-label="Stäng">
          ×
        </button>
        <span className="guided__tag">Guidat läge</span>

        {/* Steg 1: välj symtom */}
        {!symptomId && (
          <>
            <h2>Vilket är patientens huvudsakliga symtom?</h2>
            <div className="guided__choices">
              {region.symptoms.map((s) => (
                <button key={s.id} type="button" onClick={() => startSymptom(s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Steg 2: utför test, svara positivt/negativt */}
        {symptom && test && !answer && (
          <>
            <p className="guided__crumb">{symptom.label}</p>
            <h2>{test.name}</h2>
            {test.structure && <p className="guided__structure">Belastar: {test.structure}</p>}
            <button
              type="button"
              className="guided__details"
              onClick={() => onSelect('test', test.id)}
            >
              Visa hur testet utförs →
            </button>
            <h3>Vad blev utfallet?</h3>
            <div className="guided__answers">
              <button type="button" className="guided__pos" onClick={() => setAnswer('positive')}>
                Positivt
              </button>
              <button type="button" className="guided__neg" onClick={() => setAnswer('negative')}>
                Negativt
              </button>
            </div>
          </>
        )}

        {/* Steg 3: resultat */}
        {symptom && test && answer && finding && (
          <>
            <p className="guided__crumb">
              {symptom.label} › {test.name}
            </p>
            <h2>{answer === 'positive' ? 'Positivt fynd' : 'Negativt fynd'}</h2>
            {finding.finding && <p>{finding.finding}</p>}

            {(finding.diagnoses?.length ?? 0) > 0 && (
              <>
                <h3>Möjliga diagnoser</h3>
                <div className="guided__choices">
                  {finding.diagnoses!.map((dx) => (
                    <button key={dx} type="button" onClick={() => onSelect('diagnos', dx)}>
                      {diagnoses[dx]?.name ?? dx}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(finding.next_tests?.length ?? 0) > 0 && (
              <>
                <h3>Gå vidare till</h3>
                <div className="guided__choices">
                  {finding.next_tests!.map((nt) => (
                    <button key={nt} type="button" onClick={() => goToTest(nt)}>
                      {tests[nt]?.name ?? nt}
                    </button>
                  ))}
                </div>
              </>
            )}

            {(finding.diagnoses?.length ?? 0) === 0 &&
              (finding.next_tests?.length ?? 0) === 0 && (
                <p className="guided__structure">
                  Inga fler steg i denna gren. Överväg cervikal screening och röda flaggor.
                </p>
              )}

            <button type="button" className="guided__restart" onClick={restart}>
              ↺ Börja om
            </button>
          </>
        )}
      </div>
    </div>
  );
}
