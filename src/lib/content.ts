import { load } from 'js-yaml';
import type { Diagnosis, Region, Test } from './types';

/**
 * Laddar allt innehåll från content/ vid byggtid via Vite:s import.meta.glob.
 * Markdown-filer läses som råtext och delas upp i frontmatter + brödtext.
 */

// Enkel frontmatter-parser: --- ... --- följt av brödtext.
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw.trim() };
  const data = (load(match[1]) as Record<string, unknown>) ?? {};
  return { data, body: (match[2] ?? '').trim() };
}

const testFiles = import.meta.glob('/content/tests/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const diagnosisFiles = import.meta.glob('/content/diagnoses/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const regionFiles = import.meta.glob('/content/regions/*.yaml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const tests: Record<string, Test> = {};
for (const raw of Object.values(testFiles)) {
  const { data, body } = parseFrontmatter(raw);
  const test = { ...data, body } as Test;
  tests[test.id] = test;
}

export const diagnoses: Record<string, Diagnosis> = {};
for (const raw of Object.values(diagnosisFiles)) {
  const { data, body } = parseFrontmatter(raw);
  const diagnosis = { ...data, body } as Diagnosis;
  diagnoses[diagnosis.id] = diagnosis;
}

export const regions: Record<string, Region> = {};
for (const raw of Object.values(regionFiles)) {
  const region = load(raw) as Region;
  regions[region.region] = region;
}
