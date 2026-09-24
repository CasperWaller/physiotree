import { useMemo, useState } from 'react';
import type { Diagnosis, Region, Test } from '../lib/types';
import { buildQuiz } from '../lib/quiz';

interface Props {
  region: Region;
  tests: Record<string, Test>;
  diagnoses: Record<string, Diagnosis>;
  onClose: () => void;
}

export function QuizMode({ region, tests, diagnoses, onClose }: Props) {
  const [round, setRound] = useState(0); // bumpas vid omstart → nytt quiz
  const questions = useMemo(
    () => buildQuiz(region, tests, diagnoses),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [region, tests, diagnoses, round],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
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
        <span className="side-panel__tag quiz__tag">Quiz — {region.label}</span>

        {questions.length === 0 && (
          <>
            <h2>Inga frågor</h2>
            <p className="guided__structure">Den här regionen har ännu inte tillräckligt med data för ett quiz.</p>
          </>
        )}

        {questions.length > 0 && !done && q && (
          <>
            <p className="guided__crumb">
              Fråga {index + 1} av {questions.length} · Poäng {score}
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
                    {o.text}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <>
                <p className={q.options[picked].correct ? 'quiz__fb quiz__fb--ok' : 'quiz__fb quiz__fb--no'}>
                  {q.options[picked].correct ? 'Rätt!' : 'Fel.'} {q.explanation}
                </p>
                <button type="button" className="edit__save" onClick={next}>
                  {index + 1 >= questions.length ? 'Se resultat' : 'Nästa fråga'}
                </button>
              </>
            )}
          </>
        )}

        {done && (
          <>
            <h2>Resultat</h2>
            <p className="quiz__result">
              {score} / {questions.length} rätt
            </p>
            <div className="edit__actions">
              <button type="button" className="edit__save" onClick={restart}>
                ↺ Nytt quiz
              </button>
              <button type="button" onClick={onClose}>
                Stäng
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
