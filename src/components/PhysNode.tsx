import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeKind } from '../lib/types';

const STYLES: Record<NodeKind, { bg: string; label: string }> = {
  region: { bg: '#1f4e79', label: 'Region' },
  symptom: { bg: '#2e7d32', label: 'Symtom' },
  test: { bg: '#6a1b9a', label: 'Test' },
  positivt: { bg: '#c62828', label: 'Positivt fynd' },
  negativt: { bg: '#455a64', label: 'Negativt fynd' },
  diagnos: { bg: '#ef6c00', label: 'Diagnos' },
};

export function PhysNode({ data, targetPosition, sourcePosition }: NodeProps) {
  const kind = (data.kind as NodeKind) ?? 'symptom';
  const style = STYLES[kind];
  const clickable = kind === 'test' || kind === 'diagnos';

  return (
    <div
      className="phys-node"
      style={{ background: style.bg, cursor: clickable ? 'pointer' : 'default' }}
      title={clickable ? 'Klicka för detaljer' : undefined}
    >
      <Handle type="target" position={targetPosition ?? Position.Left} />
      <div className="phys-node__kind">{style.label}</div>
      <div className="phys-node__label">{data.label as string}</div>
      {clickable && <div className="phys-node__hint">›</div>}
      <Handle type="source" position={sourcePosition ?? Position.Right} />
    </div>
  );
}

export const nodeTypes = { phys: PhysNode };
