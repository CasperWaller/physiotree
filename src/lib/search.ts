import type { Diagnosis, NodeKind, Region, Test } from './types';

export interface SearchItem {
  /** node-id i grafen, för att kunna centrera */
  nodeId: string;
  label: string;
  kind: NodeKind;
  /** id till test/diagnos för sidopanelen */
  refId?: string;
}

/** Bygger ett sökindex över symtom, tester och diagnoser i regionen. */
export function buildSearchIndex(
  region: Region,
  tests: Record<string, Test>,
  diagnoses: Record<string, Diagnosis>,
): SearchItem[] {
  const items: SearchItem[] = [];
  const seen = new Set<string>();

  const push = (item: SearchItem) => {
    if (seen.has(item.nodeId)) return;
    seen.add(item.nodeId);
    items.push(item);
  };

  for (const symptom of region.symptoms) {
    push({ nodeId: `symptom:${symptom.id}`, label: symptom.label, kind: 'symptom' });
    for (const branch of symptom.tests) {
      const test = tests[branch.test];
      push({
        nodeId: `test:${branch.test}`,
        label: test?.name ?? branch.test,
        kind: 'test',
        refId: branch.test,
      });
      for (const finding of [branch.positive, branch.negative]) {
        for (const dx of finding?.diagnoses ?? []) {
          push({
            nodeId: `diagnos:${dx}`,
            label: diagnoses[dx]?.name ?? dx,
            kind: 'diagnos',
            refId: dx,
          });
        }
      }
    }
  }
  return items;
}

export function searchItems(index: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 8);
}
