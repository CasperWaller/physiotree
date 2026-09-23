// Datamodell för PhysioTree-innehållet (se PLAN.md §3)

export interface Test {
  id: string;
  name: string;
  region: string;
  structure: string;
  sensitivity: number | null;
  specificity: number | null;
  lr_positive: number | null;
  lr_negative: number | null;
  source: string;
  video: string;
  /** Markdown-brödtext (utförande, positivt fynd, anteckningar) */
  body: string;
}

export interface Diagnosis {
  id: string;
  name: string;
  umbrella: string | null;
  related_tests: string[];
  body: string;
}

export interface Finding {
  finding?: string;
  diagnoses?: string[];
  next_tests?: string[];
}

export interface TestBranch {
  test: string;
  positive?: Finding;
  negative?: Finding;
}

export interface Symptom {
  id: string;
  label: string;
  tests: TestBranch[];
}

export interface Region {
  region: string;
  label: string;
  symptoms: Symptom[];
}

export type NodeKind =
  | 'region'
  | 'symptom'
  | 'test'
  | 'positivt'
  | 'negativt'
  | 'diagnos';
