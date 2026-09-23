import type { Edge, Node } from '@xyflow/react';

/**
 * Liten demo-graf för att verifiera uppsättningen (Fas 1).
 * Riktig data laddas från content/ i Fas 2–3.
 * Nodtyper: region | symptom | test | positivt | negativt | diagnos
 */
export const demoNodes: Node[] = [
  { id: 'axel', data: { label: 'Axel' }, position: { x: 0, y: 0 }, type: 'region' },
  {
    id: 'smarta-flexion-abduktion',
    data: { label: 'Smärta vid flexion / abduktion' },
    position: { x: 0, y: 0 },
    type: 'symptom',
  },
  {
    id: 'empty-can',
    data: { label: 'Empty can-test' },
    position: { x: 0, y: 0 },
    type: 'test',
  },
  {
    id: 'empty-can-positivt',
    data: { label: 'Positivt: smärta + svaghet mot motstånd' },
    position: { x: 0, y: 0 },
    type: 'positivt',
  },
  {
    id: 'empty-can-negativt',
    data: { label: 'Negativt' },
    position: { x: 0, y: 0 },
    type: 'negativt',
  },
  {
    id: 'rotatorkuff-tendinopati',
    data: { label: 'Rotatorkuff-tendinopati' },
    position: { x: 0, y: 0 },
    type: 'diagnos',
  },
  {
    id: 'subakromiellt-smartsyndrom',
    data: { label: 'Subakromiellt smärtsyndrom' },
    position: { x: 0, y: 0 },
    type: 'diagnos',
  },
  {
    id: 'overvag-fler-tester',
    data: { label: 'Överväg fler tester (Hawkins-Kennedy, smärtbåge)' },
    position: { x: 0, y: 0 },
    type: 'symptom',
  },
];

export const demoEdges: Edge[] = [
  { id: 'e1', source: 'axel', target: 'smarta-flexion-abduktion' },
  { id: 'e2', source: 'smarta-flexion-abduktion', target: 'empty-can' },
  { id: 'e3', source: 'empty-can', target: 'empty-can-positivt' },
  { id: 'e4', source: 'empty-can', target: 'empty-can-negativt' },
  { id: 'e5', source: 'empty-can-positivt', target: 'rotatorkuff-tendinopati' },
  { id: 'e6', source: 'empty-can-positivt', target: 'subakromiellt-smartsyndrom' },
  { id: 'e7', source: 'empty-can-negativt', target: 'overvag-fler-tester' },
];
