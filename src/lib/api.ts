import type { Diagnosis, Region, Test } from './types';

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export interface AuthUser {
  email: string;
  role: string;
}

export interface ContentData {
  regions: Region[];
  tests: Record<string, Test>;
  diagnoses: Record<string, Diagnosis>;
}

// --- API-format (camelCase från servern) ---
interface ApiTest {
  id: string;
  name: string;
  region: string;
  structure: string;
  sensitivity: number | null;
  specificity: number | null;
  lrPositive: number | null;
  lrNegative: number | null;
  source: string;
  video: string;
  body: string;
}
interface ApiDiagnosis {
  id: string;
  name: string;
  umbrella: string | null;
  relatedTests: string[];
  body: string;
}
interface ApiRegion {
  region: string;
  label: string;
  symptoms: Region['symptoms'];
}

function toTest(t: ApiTest): Test {
  return {
    id: t.id,
    name: t.name,
    region: t.region,
    structure: t.structure,
    sensitivity: t.sensitivity,
    specificity: t.specificity,
    lr_positive: t.lrPositive,
    lr_negative: t.lrNegative,
    source: t.source,
    video: t.video,
    body: t.body,
  };
}

function toDiagnosis(d: ApiDiagnosis): Diagnosis {
  return {
    id: d.id,
    name: d.name,
    umbrella: d.umbrella,
    related_tests: d.relatedTests ?? [],
    body: d.body,
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error((msg as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchContent(): Promise<ContentData> {
  const data = await request<{
    regions: ApiRegion[];
    tests: ApiTest[];
    diagnoses: ApiDiagnosis[];
  }>('/api/content');

  const tests: Record<string, Test> = {};
  for (const t of data.tests) tests[t.id] = toTest(t);
  const diagnoses: Record<string, Diagnosis> = {};
  for (const d of data.diagnoses) diagnoses[d.id] = toDiagnosis(d);
  const regions = data.regions
    .map((r) => ({ ...r }) as Region)
    .sort((a, b) => a.label.localeCompare(b.label, 'sv'));

  return { regions, tests, diagnoses };
}

export async function login(email: string, password: string) {
  return request<{ token: string; user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function updateTest(token: string, id: string, test: Test): Promise<Test> {
  const payload = {
    name: test.name,
    region: test.region,
    structure: test.structure,
    sensitivity: test.sensitivity,
    specificity: test.specificity,
    lrPositive: test.lr_positive,
    lrNegative: test.lr_negative,
    source: test.source,
    video: test.video,
    body: test.body,
  };
  const t = await request<ApiTest>(`/api/tests/${id}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  return toTest(t);
}

export async function updateDiagnosis(
  token: string,
  id: string,
  diagnosis: Diagnosis,
): Promise<Diagnosis> {
  const payload = {
    name: diagnosis.name,
    umbrella: diagnosis.umbrella,
    relatedTests: diagnosis.related_tests,
    body: diagnosis.body,
  };
  const d = await request<ApiDiagnosis>(`/api/diagnoses/${id}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  return toDiagnosis(d);
}
