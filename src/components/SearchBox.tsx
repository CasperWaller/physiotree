import { useMemo, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { NodeKind, Region } from '../lib/types';
import { buildSearchIndex, searchItems, type SearchItem } from '../lib/search';

const KIND_LABEL: Record<NodeKind, string> = {
  region: 'Region',
  symptom: 'Symtom',
  test: 'Test',
  positivt: 'Positivt fynd',
  negativt: 'Negativt fynd',
  diagnos: 'Diagnos',
};

interface Props {
  region: Region;
  onSelect: (kind: NodeKind, refId?: string) => void;
}

export function SearchBox({ region, onSelect }: Props) {
  const flow = useReactFlow();
  const index = useMemo(() => buildSearchIndex(region), [region]);
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchItems(index, query), [index, query]);

  const goTo = (item: SearchItem) => {
    const node = flow.getNode(item.nodeId);
    if (node) {
      const w = node.measured?.width ?? 240;
      const h = node.measured?.height ?? 60;
      void flow.setCenter(node.position.x + w / 2, node.position.y + h / 2, {
        zoom: 1.2,
        duration: 500,
      });
      flow.setNodes((nodes) =>
        nodes.map((n) => ({ ...n, selected: n.id === item.nodeId })),
      );
    }
    if (item.refId) onSelect(item.kind, item.refId);
    setQuery('');
  };

  return (
    <div className="search-box">
      <input
        type="search"
        value={query}
        placeholder="Sök test, symtom eller diagnos…"
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Sök i trädet"
      />
      {results.length > 0 && (
        <ul className="search-box__results">
          {results.map((item) => (
            <li key={item.nodeId}>
              <button type="button" onClick={() => goTo(item)}>
                <span className="search-box__label">{item.label}</span>
                <span className="search-box__kind">{KIND_LABEL[item.kind]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
