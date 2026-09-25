import { useState } from 'react';
import type { NodeKind } from '../lib/types';
import { NODE_ACCENT, NODE_LABEL } from '../lib/theme';

const ORDER: NodeKind[] = ['region', 'symptom', 'test', 'positivt', 'negativt', 'diagnos'];

export function Legend() {
  // Fälld som standard på mobil (tar annars plats över trädet)
  const [open, setOpen] = useState(() => {
    try {
      return !window.matchMedia('(max-width: 720px)').matches;
    } catch {
      return true;
    }
  });

  return (
    <div className="legend">
      <button
        type="button"
        className="legend__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Teckenförklaring <span className="legend__chev">{open ? '–' : '+'}</span>
      </button>
      {open && (
        <ul className="legend__list">
          {ORDER.map((kind) => (
            <li key={kind}>
              <span className="legend__swatch" style={{ background: NODE_ACCENT[kind] }} />
              {NODE_LABEL[kind]}
            </li>
          ))}
          <li className="legend__hint">Klicka på Test eller Diagnos för detaljer</li>
        </ul>
      )}
    </div>
  );
}
