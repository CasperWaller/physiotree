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
import {
  createDiagnosis,
  createRegion,
  createTest,
  fetchContent,
  updateDiagnosis,
  updateRegion,
  updateTest,
  type ContentData,
} from './lib/api';
import { useAuth } from './lib/useAuth';
import { nodeTypes } from './components/PhysNode';
import { SidePanel } from './components/SidePanel';
import { SearchBox } from './components/SearchBox';
import { GuidedMode } from './components/GuidedMode';
import { QuizMode } from './components/QuizMode';
import { LoginModal } from './components/LoginModal';
import { Legend } from './components/Legend';
import { TreeEditor } from './components/TreeEditor';
import { NewItemModal } from './components/NewItemModal';
import { NODE_ACCENT } from './lib/theme';
import type { Diagnosis, NodeKind, Region, Test } from './lib/types';
import './App.css';

type SelectFn = (kind: NodeKind, refId?: string) => void;

/** true på små skärmar (mobil) */
function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => {
    try {
      return window.matchMedia('(max-width: 720px)').matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return mobile;
}

function Tree({
  region,
  tests,
  diagnoses,
  onSelect,
}: {
  region: Region;
  tests: Record<string, Test>;
  diagnoses: Record<string, Diagnosis>;
  onSelect: SelectFn;
}) {
  const isMobile = useIsMobile();
  const { nodes, edges } = useMemo(() => {
    const graph = buildGraph(region, tests, diagnoses);
    const typedNodes = graph.nodes.map((n) => ({ ...n, type: 'phys' }));
    return layoutTree(typedNodes, graph.edges, 'LR');
  }, [region, tests, diagnoses]);

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
      colorMode="system"
      fitView
      minZoom={0.1}
      maxZoom={isMobile ? 1.4 : 2}
      nodesDraggable={false}
      onlyRenderVisibleElements
      proOptions={{ hideAttribution: true }}
    >
      <Panel position="top-left">
        <SearchBox region={region} tests={tests} diagnoses={diagnoses} onSelect={onSelect} />
      </Panel>
      <Panel position="top-right">
        <Legend />
      </Panel>
      {!isMobile && <Background />}
      <Controls showInteractive={false} />
      {!isMobile && (
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => NODE_ACCENT[(n.data as PhysNodeData).kind] ?? '#333'}
        />
      )}
    </ReactFlow>
  );
}

function App() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slowLoad, setSlowLoad] = useState(false);
  const [rev, setRev] = useState(0); // bumpas vid redigering → tvingar om-layout

  const [regionId, setRegionId] = useState<string | undefined>();
  const [selectedTest, setSelectedTest] = useState<string | undefined>();
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<string | undefined>();
  const [guided, setGuided] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const { token, user, isAdmin, login, logout } = useAuth();

  const selectedRegion =
    content?.regions.find((r) => r.region === regionId) ?? content?.regions[0];

  const load = useCallback(() => {
    setLoadError(null);
    fetchContent()
      .then(setContent)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'Kunde inte ladda innehåll'));
  }, []);

  useEffect(load, [load]);

  // Render gratis-tjänster somnar; visa en vänligare ledtext om laddningen drar ut
  useEffect(() => {
    if (content || loadError) {
      setSlowLoad(false);
      return;
    }
    const id = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(id);
  }, [content, loadError]);

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

  const switchRegion = useCallback((id: string) => {
    setRegionId(id);
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

  // Hämtar om allt innehåll (efter strukturändringar / nyskapande)
  const reload = useCallback(async () => {
    const c = await fetchContent();
    setContent(c);
    setRev((r) => r + 1);
    return c;
  }, []);

  const handleSaveRegion = useCallback(
    async (r: Region) => {
      if (!token) throw new Error('Ej inloggad');
      await updateRegion(token, r);
      await reload();
      setTreeOpen(false);
    },
    [token, reload],
  );

  const handleCreateTest = useCallback(
    async (t: Test) => {
      if (!token) throw new Error('Ej inloggad');
      await createTest(token, t);
      await reload();
    },
    [token, reload],
  );

  const handleCreateDiagnosis = useCallback(
    async (d: Diagnosis) => {
      if (!token) throw new Error('Ej inloggad');
      await createDiagnosis(token, d);
      await reload();
    },
    [token, reload],
  );

  const handleCreateRegion = useCallback(
    async (r: Region) => {
      if (!token) throw new Error('Ej inloggad');
      await createRegion(token, r);
      await reload();
      setRegionId(r.region); // hoppa till den nya regionen
    },
    [token, reload],
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__titles">
          <h1>PhysioTree 🦴</h1>
          <p>Fysioterapeutisk bedömning</p>
        </div>
        <div className="app-header__actions">
          {content && selectedRegion && (
            <select
              className="app-header__region"
              value={selectedRegion.region}
              onChange={(e) => switchRegion(e.target.value)}
              aria-label="Välj region"
            >
              {content.regions.map((r) => (
                <option key={r.region} value={r.region}>
                  {r.label}
                </option>
              ))}
            </select>
          )}
          {content && (
            <button type="button" className="app-header__guided" onClick={() => setGuided(true)}>
              ▶ Guidat läge
            </button>
          )}
          {content && (
            <button type="button" className="app-header__quiz" onClick={() => setQuiz(true)}>
              ✎ Quiz
            </button>
          )}
          {isAdmin && content && selectedRegion && (
            <>
              <button type="button" className="app-header__admin" onClick={() => setTreeOpen(true)}>
                ✎ Träd
              </button>
              <button type="button" className="app-header__admin" onClick={() => setNewOpen(true)}>
                + Ny
              </button>
            </>
          )}
          {isAdmin ? (
            <span className="app-header__user">
              <span className="app-header__email">{user?.email}</span>
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
        {!loadError && !content && (
          <div className="app-status">
            <p>Laddar innehåll…</p>
            {slowLoad && (
              <p className="app-status__hint">
                Servern kan behöva vakna – det tar upp till ~30 s på gratisnivån.
              </p>
            )}
          </div>
        )}
        {content && selectedRegion && (
          <main className="app-canvas">
            <ReactFlowProvider key={`${selectedRegion.region}:${rev}`}>
              <Tree
                region={selectedRegion}
                tests={content.tests}
                diagnoses={content.diagnoses}
                onSelect={handleSelect}
              />
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

      {guided && content && selectedRegion && (
        <GuidedMode
          region={selectedRegion}
          tests={content.tests}
          diagnoses={content.diagnoses}
          onClose={() => setGuided(false)}
          onSelect={handleSelect}
        />
      )}
      {quiz && content && selectedRegion && (
        <QuizMode
          regions={content.regions}
          currentRegionId={selectedRegion.region}
          tests={content.tests}
          diagnoses={content.diagnoses}
          onClose={() => setQuiz(false)}
        />
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} onLogin={login} />}
      {treeOpen && content && selectedRegion && (
        <TreeEditor
          region={selectedRegion}
          tests={content.tests}
          diagnoses={content.diagnoses}
          onSave={handleSaveRegion}
          onClose={() => setTreeOpen(false)}
        />
      )}
      {newOpen && content && selectedRegion && (
        <NewItemModal
          regions={content.regions}
          currentRegionId={selectedRegion.region}
          onCreateTest={handleCreateTest}
          onCreateDiagnosis={handleCreateDiagnosis}
          onCreateRegion={handleCreateRegion}
          onClose={() => setNewOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
