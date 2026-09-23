import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { layoutTree } from './lib/layout';
import { buildGraph, type PhysNodeData } from './lib/buildGraph';
import { fetchContent, updateDiagnosis, updateTest, type ContentData } from './lib/api';
import { useAuth } from './lib/useAuth';
import { nodeTypes } from './components/PhysNode';
import { SidePanel } from './components/SidePanel';
import { SearchBox } from './components/SearchBox';
import { GuidedMode } from './components/GuidedMode';
import { LoginModal } from './components/LoginModal';
import type { Diagnosis, NodeKind, Test } from './lib/types';
import './App.css';

const MINIMAP_COLORS: Record<NodeKind, string> = {
  region: '#1f4e79',
  symptom: '#2e7d32',
  test: '#6a1b9a',
  positivt: '#c62828',
  negativt: '#455a64',
  diagnos: '#ef6c00',
};

type SelectFn = (kind: NodeKind, refId?: string) => void;

function Tree({ content, onSelect }: { content: ContentData; onSelect: SelectFn }) {
  const { nodes, edges } = useMemo(() => {
    const graph = buildGraph(content.region, content.tests, content.diagnoses);
    const typedNodes = graph.nodes.map((n) => ({ ...n, type: 'phys' }));
    return layoutTree(typedNodes, graph.edges, 'LR');
  }, [content]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const data = node.data as PhysNodeData;
      onSelect(data.kind, data.refId);
    },
    [onSelect],
  );

  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      minZoom={0.1}
      nodesDraggable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-left">
        <SearchBox
          region={content.region}
          tests={content.tests}
          diagnoses={content.diagnoses}
          onSelect={onSelect}
        />
      </Panel>
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
  const [content, setContent] = useState<ContentData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rev, setRev] = useState(0); // bumpas vid redigering → tvingar om-layout

  const [selectedTest, setSelectedTest] = useState<string | undefined>();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | undefined>();
  const [guided, setGuided] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const { token, user, isAdmin, login, logout } = useAuth();

  const load = useCallback(() => {
    setLoadError(null);
    fetchContent()
      .then(setContent)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Kunde inte ladda innehåll'));
  }, []);

  useEffect(load, [load]);

  const handleSelect = useCallback<SelectFn>((kind, refId) => {
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

  const handleSaveTest = useCallback(
    async (id: string, test: Test) => {
      if (!token) throw new Error('Ej inloggad');
      const saved = await updateTest(token, id, test);
      setContent((c) => (c ? { ...c, tests: { ...c.tests, [id]: saved } } : c));
      setRev((r) => r + 1);
    },
    [token],
  );

  const handleSaveDiagnosis = useCallback(
    async (id: string, diagnosis: Diagnosis) => {
      if (!token) throw new Error('Ej inloggad');
      const saved = await updateDiagnosis(token, id, diagnosis);
      setContent((c) => (c ? { ...c, diagnoses: { ...c.diagnoses, [id]: saved } } : c));
      setRev((r) => r + 1);
    },
    [token],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__titles">
          <h1>PhysioTree 🦴</h1>
          <p>Fysioterapeutisk bedömning{content ? ` — ${content.region.label}` : ''}</p>
        </div>
        <div className="app-header__actions">
          {content && (
            <button type="button" className="app-header__guided" onClick={() => setGuided(true)}>
              ▶ Guidat läge
            </button>
          )}
          {isAdmin ? (
            <span className="app-header__user">
              {user?.email}
              <button type="button" onClick={logout}>Logga ut</button>
            </span>
          ) : (
            <button type="button" className="app-header__login" onClick={() => setLoginOpen(true)}>
              Logga in
            </button>
          )}
        </div>
      </header>

      <div className="app-main">
        {loadError && (
          <div className="app-status">
            <p>Kunde inte nå servern: {loadError}</p>
            <button type="button" onClick={load}>Försök igen</button>
          </div>
        )}
        {!loadError && !content && <div className="app-status">Laddar innehåll…</div>}
        {content && (
          <main className="app-canvas">
            <ReactFlowProvider key={rev}>
              <Tree content={content} onSelect={handleSelect} />
            </ReactFlowProvider>
          </main>
        )}
        {content && (
          <SidePanel
            test={selectedTest ? content.tests[selectedTest] : undefined}
            diagnosis={selectedDiagnosis ? content.diagnoses[selectedDiagnosis] : undefined}
            isAdmin={isAdmin}
            onClose={closePanel}
            onSelectTest={(id) => handleSelect('test', id)}
            onSaveTest={handleSaveTest}
            onSaveDiagnosis={handleSaveDiagnosis}
          />
        )}
      </div>

      {guided && content && (
        <GuidedMode
          region={content.region}
          tests={content.tests}
          diagnoses={content.diagnoses}
          onClose={() => setGuided(false)}
          onSelect={handleSelect}
        />
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} />}
    </div>
  );
}

export default App;
