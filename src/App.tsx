import { useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { layoutTree } from './lib/layout';
import { demoEdges, demoNodes } from './lib/demoTree';
import './App.css';

// Färgkodning per nodtyp (region / symptom / test / positivt / negativt / diagnos)
const NODE_COLORS: Record<string, string> = {
  region: '#1f4e79',
  symptom: '#2e7d32',
  test: '#6a1b9a',
  positivt: '#c62828',
  negativt: '#455a64',
  diagnos: '#ef6c00',
};

function Tree() {
  const { nodes, edges } = useMemo(() => {
    const styledNodes = demoNodes.map((node) => ({
      ...node,
      style: {
        background: NODE_COLORS[node.type ?? 'symptom'] ?? '#333',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        width: 220,
      },
    }));
    return layoutTree(styledNodes, demoEdges, 'LR');
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      nodesDraggable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PhysioTree 🦴</h1>
        <p>Interaktivt släktträd för fysioterapeutisk bedömning</p>
      </header>
      <main className="app-canvas">
        <ReactFlowProvider>
          <Tree />
        </ReactFlowProvider>
      </main>
    </div>
  );
}

export default App;
