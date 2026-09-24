import type { NodeKind } from './types';

/**
 * Kanoniska accentfärger per nodtyp — används där riktiga färgvärden krävs
 * (React Flow-minikartan och teckenförklaringens rutor). Speglar
 * --node-* i index.css. Nodkorten i grafen färgas via CSS.
 */
export const NODE_ACCENT: Record<NodeKind, string> = {
  region: '#33302b',
  symptom: '#2f6b4e',
  test: '#3a5a86',
  positivt: '#b23a2e',
  negativt: '#6e6a63',
  diagnos: '#b0741a',
};

export const NODE_LABEL: Record<NodeKind, string> = {
  region: 'Region',
  symptom: 'Symtom',
  test: 'Test',
  positivt: 'Positivt fynd',
  negativt: 'Negativt fynd',
  diagnos: 'Diagnos',
};
