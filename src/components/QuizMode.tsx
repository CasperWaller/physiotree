import { useMemo, useState } from 'react';
import type { Diagnosis, Region, Test } from '../lib/types';
import { buildQuiz } from '../lib/quiz';

interface Props {
  regions: Region[];
  currentRegionId: string;
  tests: Record<string, Test>;
  diagnoses: Record<string, Diagnosis>;
  onClose: () => void;
}

const COUNTS = [5, 10, 15, 0]; // 0 = alla

export function QuizMode({ regions, currentRegionId, tests, diagnoses, onClose }: Props) {
  const currentRegion = regions.find((r) => r.region === currentRegionId) ?? regions[0];

  const [phase, setPhase] = useState<'setup' | 'quiz'>('setup');
  const [count, setCount] = useState(10);
  const [scopeAll, setScopeAll] = useState(false);
  const [round, setRound] = useState(0);

  const questions = useMemo(() => {
    if (phase !== 'quiz') return [];
    const scope = scopeAll ? regions : [currentRegion];
    return buildQuiz(scope, tests, diagnoses, count === 0 ? 9999 : count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, scopeAll, count]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const start = () => {
    setPhase('quiz');
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };
  const backToSetup = () => setPhase('setup');

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  };
  const next = () => {
    if (index + 1 >= questions.length) setDone(true);
    else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="guided" role="dialog" aria-label="Quiz">
      <div className="guided__box quiz">
        <button type="button" className="guided__close" onClick={onClose} aria-label="Stäng">
          ×
        </button>
        <span className="side-panel__tag quiz__tag">Quiz</span>

        {/* -------- Inställningar -------- */}
        {phase === 'setup' && (
          <>
            <h2>Öva dig</h2>
            <p className="quiz__sub">Flervalsfrågor som genereras från trädet.</p>

            <h3>Antal frågor</h3>
            <div className="quiz__pills">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={count === c ? 'quiz__pill quiz__pill--active' : 'quiz__pill'}
                  onClick={() => setCount(c)}
                >
                  {c === 0 ? 'Alla' : c}
                </button>
              ))}
            </div>

            <h3>Omfattning</h3>
            <div className="quiz__pills">
              <button
                type="button"
                className={!scopeAll ? 'quiz__pill quiz__pill--active' : 'quiz__pill'}
                onClick={() => setScopeAll(false)}
              >
                {currentRegion?.label ?? 'Denna region'}
              </button>
              <button
                type="button"
                className={scopeAll ? 'quiz__pill quiz__pill--active' : 'quiz__pill'}
                onClick={() => setScopeAll(true)}
              >
                Alla regioner
              </button>
            </div>

            <div className="quiz__actions">
              <button type="button" className="quiz__next" onClick={start}>
                Starta quiz →
              </button>
            </div>
          </>
        )}

        {/* -------- Frågor -------- */}
        {phase === 'quiz' && questions.length === 0 && (
          <>
            <h2>Inga frågor</h2>
            <p className="guided__structure">Det finns inte tillräckligt med data för det här urvalet.</p>
            <button type="button" className="guided__restart" onClick={backToSetup}>
              ← Ändra inställningar
            </button>
          </>
        )}

        {phase === 'quiz' && !done && q && (
          <>
            <div className="quiz__progress" aria-hidden="true">
              <span style={{ width: `${(index / questions.length) * 100}%` }} />
            </div>
            <p className="guided__crumb">
              Fråga {index + 1} av {questions.length} · Poäng {score}
              {scopeAll && q.region ? ` · ${q.region}` : ''}
            </p>
            {q.sub && <p className="quiz__sub">{q.sub}</p>}
            <h2>{q.prompt}</h2>
            <div className="quiz__options">
              {q.options.map((o, i) => {
                let cls = 'quiz__option';
                if (picked !== null) {
                  if (o.correct) cls += ' quiz__option--correct';
                  else if (i === picked) cls += ' quiz__option--wrong';
                }
                return (
                  <button key={i} type="button" className={cls} onClick={() => pick(i)} disabled={picked !== null}>
                    <span className="quiz__letter">{String.fromCharCode(65 + i)}</span>
                    <span>{o.text}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <>
                <p className={q.options[picked].correct ? 'quiz__fb quiz__fb--ok' : 'quiz__fb quiz__fb--no'}>
                  {q.options[picked].correct ? 'Rätt!' : 'Fel.'} {q.explanation}
                </p>
                <button type="button" className="quiz__next" onClick={next}>
                  {index + 1 >= questions.length ? 'Se resultat →' : 'Nästa fråga →'}
                </button>
              </>
            )}
          </>
        )}

        {phase === 'quiz' && done && (
          <>
            <h2>Resultat</h2>
            <p className="quiz__result">
              {score} / {questions.length} rätt
            </p>
            <div className="quiz__actions">
              <button type="button" className="quiz__next" onClick={start}>
                ↺ Nytt quiz
              </button>
              <button type="button" className="quiz__ghost" onClick={backToSetup}>
                Inställningar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
