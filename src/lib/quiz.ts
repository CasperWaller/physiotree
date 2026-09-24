import type { Diagnosis, Region, Test } from './types';

export interface QuizOption {
  text: string;
  correct: boolean;
}
export interface QuizQuestion {
  id: string;
  prompt: string;
  sub?: string;
  options: QuizOption[];
  explanation: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const isScreening = (t?: Test) =>
  !t || /screening|röda flaggor|fraktur/i.test(`${t.name} ${t.structure}`);

/**
 * Bygger quizfrågor från en regions träd:
 *  A) Positivt test → vilken diagnos?
 *  B) Vilken struktur belastar testet?
 */
export function buildQuiz(
  region: Region,
  tests: Record<string, Test>,
  diagnoses: Record<string, Diagnosis>,
  count = 8,
): QuizQuestion[] {
  const allDx = Object.values(diagnoses);
  const allStructures = [
    ...new Set(
      Object.values(tests)
        .map((t) => t.structure)
        .filter((s) => s && !/screening/i.test(s)),
    ),
  ];

  const questions: QuizQuestion[] = [];
  const usedTypeA = new Set<string>();
  const usedTypeB = new Set<string>();

  // Typ A – diagnos från positivt test
  for (const symptom of region.symptoms) {
    for (const branch of symptom.tests) {
      const dx = branch.positive?.diagnoses ?? [];
      const test = tests[branch.test];
      if (!test || dx.length === 0 || usedTypeA.has(branch.test)) continue;
      usedTypeA.add(branch.test);
      const correctId = dx[Math.floor(Math.random() * dx.length)];
      const correct = diagnoses[correctId];
      if (!correct) continue;
      const distractors = shuffle(allDx.filter((d) => !dx.includes(d.id)))
        .slice(0, 3)
        .map((d) => ({ text: d.name, correct: false }));
      if (distractors.length < 2) continue;
      questions.push({
        id: `A:${branch.test}`,
        prompt: `«${test.name}» är positivt. Vilken diagnos talar det för?`,
        sub: `Symtom: ${symptom.label}`,
        options: shuffle([{ text: correct.name, correct: true }, ...distractors]),
        explanation: `Ett positivt «${test.name}» talar för: ${dx
          .map((id) => diagnoses[id]?.name ?? id)
          .join(', ')}.`,
      });
    }
  }

  // Typ B – struktur som testet belastar
  for (const symptom of region.symptoms) {
    for (const branch of symptom.tests) {
      const test = tests[branch.test];
      if (!test || isScreening(test) || !test.structure || usedTypeB.has(branch.test)) continue;
      usedTypeB.add(branch.test);
      const distractors = shuffle(allStructures.filter((s) => s !== test.structure))
        .slice(0, 3)
        .map((s) => ({ text: s, correct: false }));
      if (distractors.length < 2) continue;
      questions.push({
        id: `B:${branch.test}`,
        prompt: `Vilken struktur belastar «${test.name}»?`,
        options: shuffle([{ text: test.structure, correct: true }, ...distractors]),
        explanation: `«${test.name}» belastar ${test.structure}.`,
      });
    }
  }

  return shuffle(questions).slice(0, count);
}
