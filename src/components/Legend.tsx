import { useState } from 'react';
import type { NodeKind } from '../lib/types';

const ITEMS: { kind: NodeKind; label: string; color: string }[] = [
  { kind: 'region', label: 'Region', color: '#1f4e79' },
  { kind: 'symptom', label: 'Symtom', color: '#2e7d32' },
  { kind: 'test', label: 'Test', color: '#6a1b9a' },
  { kind: 'positivt', label: 'Positivt fynd', color: '#c62828' },
  { kind: 'negativt', label: 'Negativt fynd', color: '#455a64' },
  { kind: 'diagnos', label: 'Diagnos', color: '#ef6c00' },
];

export function Legend() {
  const [open, setOpen] = useState(true);

  return (
    <div className="legend">
      <button
        type="button"
        className="legend__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Teckenförklaring {open ? '▾' : '▸'}
      </button>
      {open && (
        <ul className="legend__list">
          {ITEMS.map((i) => (
            <li key={i.kind}>
              <span className="legend__swatch" style={{ background: i.color }} />
              {i.label}
            </li>
          ))}
          <li className="legend__hint">Klicka på Test eller Diagnos för detaljer</li>
        </ul>
      )}
    </div>
  );
}
