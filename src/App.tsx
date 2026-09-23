import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { layoutTree } from './lib/layout';
import { buildGraph, type PhysNodeData } from './lib/buildGraph';
import { diagnoses, regions, tests } from './lib/content';
import { nodeTypes } from './components/PhysNode';
import { SidePanel } from './components/SidePanel';
import type { NodeKind } from './lib/types';
import './App.css';

const MINIMAP_COLORS: Record<NodeKind, string> = {
  region: '#1f4e79',
  symptom: '#2e7d32',
  test: '#6a1b9a',
  positivt: '#c62828',
  negativt: '#455a64',
  diagnos: '#ef6c00',
};

const region = regions.shoulder;

function Tree({ onSelect }: { onSelect: (kind: NodeKind, refId?: string) => void }) {
  const { nodes, edges } = useMemo(() => {
    const graph = buildGraph(region, tests, diagnoses);
    const typedNodes = graph.nodes.map((n) => ({ ...n, type: 'phys' }));
    return layoutTree(typedNodes, graph.edges, 'LR');
  }, []);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as PhysNodeData;
      onSelect(data.kind, data.refId);
    },
    [onSelect],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      minZoom={0.1}
      nodesDraggable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => MINIMAP_COLORS[(n.data as PhysNodeData).kind] ?? '#333'}
      />
    </ReactFlow>
  );
}

function App() {
  const [selectedTest, setSelectedTest] = useState<string | undefined>();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | undefined>();

  const handleSelect = useCallback((kind: NodeKind, refId?: string) => {
    if (kind === 'test' && refId) {
      setSelectedTest(refId);
      setSelectedDiagnosis(undefined);
    } else if (kind === 'diagnos' && refId) {
      setSelectedDiagnosis(refId);
      setSelectedTest(undefined);
    }
  }, []);

  const closePanel = useCallback(() => {
    setSelectedTest(undefined);
    setSelectedDiagnosis(undefined);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>PhysioTree 🦴</h1>
        <p>Interaktivt släktträd för fysioterapeutisk bedömning — {region.label}</p>
      </header>
      <div className="app-main">
        <main className="app-canvas">
          <ReactFlowProvider>
            <Tree onSelect={handleSelect} />
          </ReactFlowProvider>
        </main>
        <SidePanel
          test={selectedTest ? tests[selectedTest] : undefined}
          diagnosis={selectedDiagnosis ? diagnoses[selectedDiagnosis] : undefined}
          onClose={closePanel}
          onSelectTest={(id) => handleSelect('test', id)}
        />
      </div>
    </div>
  );
}

export default App;
