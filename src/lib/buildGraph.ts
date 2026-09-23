import type { Edge, Node } from '@xyflow/react';
import type { NodeKind, Region, Test, Diagnosis } from './types';

export interface PhysNodeData {
  label: string;
  kind: NodeKind;
  /** id till test eller diagnos, för sidopanelen */
  refId?: string;
  [key: string]: unknown;
}

export type PhysNode = Node<PhysNodeData>;

/**
 * Bygger en graf (DAG) från en region + tester + diagnoser.
 * Tester och diagnoser blir unika noder per id, så nätverkskaraktären
 * bevaras (samma test/diagnos kan nås från flera grenar).
 */
export function buildGraph(
  region: Region,
  tests: Record<string, Test>,
  diagnoses: Record<string, Diagnosis>,
): { nodes: PhysNode[]; edges: Edge[] } {
  const nodes = new Map<string, PhysNode>();
  const edges: Edge[] = [];

  const addNode = (id: string, kind: NodeKind, label: string, refId?: string) => {
    if (!nodes.has(id)) nodes.set(id, { id, position: { x: 0, y: 0 }, data: { label, kind, refId } });
  };
  const addEdge = (source: string, target: string) => {
    const id = `${source}__${target}`;
    if (!edges.some((e) => e.id === id)) {
      edges.push({ id, source, target, animated: false });
    }
  };

  const regionId = `region:${region.region}`;
  addNode(regionId, 'region', region.label ?? region.region);

  const testNodeId = (t: string) => `test:${t}`;
  const ensureTestNode = (t: string) => {
    const test = tests[t];
    addNode(testNodeId(t), 'test', test?.name ?? t, t);
  };

  for (const symptom of region.symptoms) {
    const symptomId = `symptom:${symptom.id}`;
    addNode(symptomId, 'symptom', symptom.label);
    addEdge(regionId, symptomId);

    for (const branch of symptom.tests) {
      ensureTestNode(branch.test);
      addEdge(symptomId, testNodeId(branch.test));

      // Positivt fynd
      if (branch.positive) {
        const posId = `pos:${branch.test}`;
        addNode(posId, 'positivt', branch.positive.finding ?? 'Positivt');
        addEdge(testNodeId(branch.test), posId);
        for (const dx of branch.positive.diagnoses ?? []) {
          const dxId = `diagnos:${dx}`;
          addNode(dxId, 'diagnos', diagnoses[dx]?.name ?? dx, dx);
          addEdge(posId, dxId);
        }
        for (const nt of branch.positive.next_tests ?? []) {
          ensureTestNode(nt);
          addEdge(posId, testNodeId(nt));
        }
      }

      // Negativt fynd
      if (branch.negative) {
        const negId = `neg:${branch.test}`;
        addNode(negId, 'negativt', branch.negative.finding ?? 'Negativt');
        addEdge(testNodeId(branch.test), negId);
        for (const dx of branch.negative.diagnoses ?? []) {
          const dxId = `diagnos:${dx}`;
          addNode(dxId, 'diagnos', diagnoses[dx]?.name ?? dx, dx);
          addEdge(negId, dxId);
        }
        for (const nt of branch.negative.next_tests ?? []) {
          ensureTestNode(nt);
          addEdge(negId, testNodeId(nt));
        }
      }
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}
