import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeKind } from '../lib/types';
import { NODE_LABEL } from '../lib/theme';

export function PhysNode({ data, targetPosition, sourcePosition }: NodeProps) {
  const kind = (data.kind as NodeKind) ?? 'symptom';
  const clickable = kind === 'test' || kind === 'diagnos';

  return (
    <div
      className={`phys-node phys-node--${kind}${clickable ? ' phys-node--clickable' : ''}`}
      title={clickable ? 'Klicka för detaljer' : undefined}
    >
      <Handle type="target" position={targetPosition ?? Position.Left} />
      <span className="phys-node__kind">{NODE_LABEL[kind]}</span>
      <span className="phys-node__label">{data.label as string}</span>
      {clickable && <span className="phys-node__hint" aria-hidden="true">→</span>}
      <Handle type="source" position={sourcePosition ?? Position.Right} />
    </div>
  );
}

export const nodeTypes = { phys: PhysNode };
