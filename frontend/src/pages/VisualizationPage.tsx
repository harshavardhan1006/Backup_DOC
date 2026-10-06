import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Play,
  Zap,
  Network,
  Loader2,
  RefreshCw,
  GitFork,
  Cpu,
  Database,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import GraphVisualization from '../visualizations/GraphVisualization';
import MCTSTreeVisualization from '../visualizations/MCTSTreeVisualization';
import ScoreChart from '../visualizations/ScoreChart';
import MetricsPanel from '../visualizations/MetricsPanel';
import EventLog from '../visualizations/EventLog';
import ComparisonModal from '../visualizations/ComparisonModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGraph } from '../hooks/useGraph';
import { api } from '../services/api';
import type { GraphConfig, AutoBudget } from '../types';

const DEMO_PRESET_OPTIONS = [
  { id: 'preset_tiny', name: 'Tiny', spec: '5V • 5E' },
  { id: 'preset_small', name: 'Small', spec: '8V • 10E' },
  { id: 'preset_medium', name: 'Medium', spec: '15V • 21E' },
  { id: 'preset_dense', name: 'Dense', spec: '10V • 30E' },
  { id: 'preset_larger', name: 'Larger', spec: '25V • 57E' },
];

const RESEARCH_SCALE_OPTIONS = [
  { label: '250 Vertices', sublabel: '~750 Edges', vertices: 250, targetEdges: 750, maxWeight: 20 },
  { label: '1,000 Vertices', sublabel: '~2,500 Edges', vertices: 1000, targetEdges: 2500, maxWeight: 20 },
  { label: '2,500 Vertices', sublabel: '~6,000 Edges', vertices: 2500, targetEdges: 6000, maxWeight: 20 },
  { label: '10,000 Vertices', sublabel: '~20,000 Edges', vertices: 10000, targetEdges: 20000, maxWeight: 20 },
];

const VisualizationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Navigation tabs for left panel
  const [activeTab, setActiveTab] = useState<'datasets' | 'settings' | 'import'>('datasets');
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Custom Graph Generator configuration
  const [numVertices, setNumVertices] = useState(150);
  const [edgeDensity, setEdgeDensity] = useState(0.05);
  const [minWeight, setMinWeight] = useState(1);
  const [maxWeight, setMaxWeight] = useState(20);
  const [seed, setSeed] = useState(42);

  // Algorithm parameters
  const [strategy, setStrategy] = useState<'random' | 'greedy' | 'dsatur'>('dsatur');
  const [explorationCoeff, setExplorationCoeff] = useState(1.414);

  // Auto-budget state
  const [autoBudget, setAutoBudget] = useState<AutoBudget | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Active view mode
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');

  // File upload state
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'info' | 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const graph = useGraph();
  const ws = useWebSocket();

  // Fetch auto-budget when current graph or strategy changes
  const fetchBudget = useCallback(async (graphId: string, strat: string) => {
    setBudgetLoading(true);
    setBudgetError(null);
    setAutoBudget(null);
    try {
      const data = await api.getBudget(graphId, strat);
      if (data && data.iterations) {
        setAutoBudget(data as AutoBudget);
      } else {
        setBudgetError('Budget calibration returned unexpected data.');
      }
    } catch (err: any) {
      setBudgetError(`Calibration failed: ${err.message}`);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  // Initial mount: Connect WebSocket and load available graphs
  useEffect(() => {
    ws.connect();
    graph.refreshGraphs();
  }, []);

  // Select requested graph from URL (?graph=...) or default preset
  useEffect(() => {
    if (graph.graphs.length === 0) return;

    const requestedGraphId = searchParams.get('graph');
    if (requestedGraphId) {
      const found = graph.graphs.find((g) => g.id === requestedGraphId);
      if (found && graph.currentGraph?.id !== found.id) {
        graph.selectGraph(found.id);
        setSearchParams({}, { replace: true });
        return;
      }
    }

    if (!graph.currentGraph) {
      const defaultPreset =
        graph.graphs.find((g) => g.id === 'preset_small') ||
        graph.graphs.find((g) => g.id === 'preset_tiny') ||
        graph.graphs[0];
      if (defaultPreset) {
        graph.selectGraph(defaultPreset.id);
      }
    }
  }, [graph.graphs, graph.currentGraph, searchParams, setSearchParams]);

  // Fetch budget whenever graph or strategy changes
  useEffect(() => {
    if (graph.currentGraph) {
      fetchBudget(graph.currentGraph.id, strategy);
    }
  }, [graph.currentGraph?.id, strategy, fetchBudget]);

  // Auto-open comparison modal when comparison completes
  useEffect(() => {
    if (ws.comparisonResult) {
      setShowComparisonModal(true);
    }
  }, [ws.comparisonResult]);

  // Generate custom random graph
  const handleGenerate = async () => {
    const safeVertices = Math.max(5, Math.min(20000, numVertices));
    const config: GraphConfig = {
      num_vertices: safeVertices,
      edge_probability: edgeDensity,
      min_weight: minWeight,
      max_weight: maxWeight,
      seed,
    };
    await graph.generateGraph(config);
  };

  // Quick-generate a research-scale sparse benchmark instance
  const handleQuickResearchInstance = async (
    vertices: number,
    targetEdges: number,
    maxW: number
  ) => {
    const maxPossibleEdges = (vertices * (vertices - 1)) / 2;
    const prob = Math.min(0.95, Math.max(0.0001, targetEdges / maxPossibleEdges));
    await graph.generateGraph({
      num_vertices: vertices,
      edge_probability: Number(prob.toFixed(6)),
      min_weight: 1,
      max_weight: maxW,
      seed: 42,
    });
  };

  // Run MCTS solver — uses auto-calibrated budget
  const handleRunMCTS = async () => {
    if (!graph.currentGraph) return;
    if (!autoBudget) return;
    ws.resetMetrics(`MCTS (${strategy})`);
    await ws.ws.runMCTS(graph.currentGraph.id, {
      iterations: autoBudget.iterations,
      time_limit: autoBudget.time_limit,
      exploration: explorationCoeff,
      strategy,
      seed,
    });
  };

  // Run Exact solver (Branch & Bound)
  const handleRunExact = async () => {
    if (!graph.currentGraph) return;
    ws.resetMetrics('EXACT (B&B)');
    await ws.ws.runExact(graph.currentGraph.id, {
      time_limit: 60,
    });
  };

  // Run Comparison (both solvers)
  const handleRunComparison = async () => {
    if (!graph.currentGraph || !autoBudget) return;
    ws.resetMetrics('COMPARE (EXACT vs MCTS)');
    await ws.ws.runComparison(graph.currentGraph.id, [
      { algorithm: 'exact', time_limit: 60 },
      {
        algorithm: 'mcts',
        strategy,
        iterations: autoBudget.iterations,
        time_limit: autoBudget.time_limit,
        exploration: explorationCoeff,
        seed,
      },
    ]);
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus({ type: 'info', text: `Importing "${file.name}"...` });
    try {
      const res = await graph.uploadGraph(file);
      if (res && res.status === 'success') {
        const vCount = res.stats?.vertices?.toLocaleString() ?? '';
        const eCount = res.stats?.edges?.toLocaleString() ?? '';
        setUploadStatus({
          type: 'success',
          text: `Loaded ${file.name} (${vCount}V, ${eCount}E)`,
        });
      } else {
        setUploadStatus({
          type: 'error',
          text: res?.errors?.join(', ') || 'Dataset import failed',
        });
      }
    } catch (err: any) {
      setUploadStatus({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Derived graph statistics for display
  const activeV = graph.graphStats?.num_vertices ?? graph.currentGraph?.num_vertices ?? 0;
  const activeE = graph.graphStats?.num_edges ?? graph.currentGraph?.num_edges ?? 0;
  const activeDensity = graph.graphStats?.density ?? graph.currentGraph?.density ?? 0;
  const activeAvgDegree =
    graph.graphStats?.avg_degree ?? (activeV > 0 ? (2 * activeE) / activeV : 0);
  const activeMinW =
    graph.graphStats?.min_weight ?? graph.currentGraph?.weight_range?.[0] ?? 1;
  const activeMaxW =
    graph.graphStats?.max_weight ?? graph.currentGraph?.weight_range?.[1] ?? 100;
  const activeAvgW = graph.graphStats?.avg_weight ?? (activeMinW + activeMaxW) / 2;

  const displayedSampleV = graph.graphData?.displayedVertices ?? activeV;
  const isSampledView = Boolean(graph.graphData?.isSampled || activeV > displayedSampleV);

  // Separate non-preset research datasets from demo presets
  const customOrLargeGraphs = graph.graphs.filter((g) => g.source !== 'preset');

  const solverStatus = ws.metrics?.status || 'STOPPED';

  return (
    <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-6 pb-12 text-sm">
      {/* ========================================================
          ROW 1: Top Instance Telemetry & View Mode Header Bar
          ======================================================== */}
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 bg-[#0b0b1e]/95 border border-white/10 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <span className="text-base font-bold text-white truncate max-w-[280px]">
              {graph.currentGraph?.name || 'No Graph Selected'}
            </span>
            {graph.currentGraph && (
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                  isSampledView
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isSampledView
                  ? `Displaying representative sample: ${displayedSampleV.toLocaleString()} vertices`
                  : `Full Instance: ${activeV.toLocaleString()} vertices`}
              </span>
            )}
          </div>

          {graph.currentGraph && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400">
              <span>
                <strong className="text-white">{activeV.toLocaleString()}</strong> vertices loaded
              </span>
              <span className="text-slate-600">•</span>
              <span>
                <strong className="text-white">{activeE.toLocaleString()}</strong> edges loaded
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline">
                Avg Degree: <strong className="text-slate-200">{activeAvgDegree.toFixed(2)}</strong>
              </span>
              <span className="text-slate-600 hidden md:inline">•</span>
              <span className="hidden md:inline">
                Density: <strong className="text-slate-200">{activeDensity.toFixed(4)}</strong>
              </span>
              <span className="text-slate-600 hidden lg:inline">•</span>
              <span className="hidden lg:inline">
                Weights:{' '}
                <strong className="text-slate-200">
                  {activeMinW}–{activeMaxW}
                </strong>{' '}
                (μ={activeAvgW.toFixed(1)})
              </span>
            </div>
          )}

          {ws.comparisonResult && (
            <button
              onClick={() => setShowComparisonModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/40 text-xs font-semibold hover:bg-purple-500/30 transition-all"
            >
              <GitFork size={14} />
              <span>Comparison Report</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Graph Canvas
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MCTS Tree
          </button>
        </div>
      </div>

      {/* ========================================================
          ROW 2: Main 3-Column Workspace (Controls | Graph Canvas | Live Metrics)
          ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(290px,340px)_minmax(0,1fr)_minmax(280px,320px)] gap-6 items-start">
        {/* LEFT COLUMN: Instance Selection, Algorithm Config & Execution */}
        <div className="w-full flex flex-col bg-[#0b0b1e]/95 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {/* Navigation Tabs Header */}
          <div className="flex border-b border-white/10 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('datasets')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'datasets'
                  ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Instances
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'settings'
                  ? 'text-purple-400 border-purple-400 bg-purple-500/10'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Algorithm
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
                activeTab === 'import'
                  ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 border-transparent hover:text-white'
              }`}
            >
              Import / Gen
            </button>
          </div>

          {/* Configuration Body (Natural height — no clipped nested scrollbar) */}
          <div className="p-5 space-y-5">
            {/* TAB 1: DATASETS & BENCHMARK PRESETS */}
            {activeTab === 'datasets' && (
              <div className="space-y-5">
                {/* Section A: Demo / Small Graphs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Layers size={14} /> Demo / Small Graphs
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Interactive + Exact</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Small instances for full-graph visualization and Exact Branch-and-Bound
                    optimality verification.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DEMO_PRESET_OPTIONS.map((p) => {
                      const selected = graph.currentGraph?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => graph.selectGraph(p.id)}
                          disabled={graph.loading}
                          className={`px-3 py-2.5 rounded-xl text-xs font-mono transition-all border text-left flex items-center justify-between gap-2 ${
                            selected
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/45 font-bold'
                              : 'bg-white/[0.02] text-slate-300 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-400 shrink-0">{p.spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section B: Research / Large Datasets */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-purple-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                      <Database size={14} /> Research / Large Datasets
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Scalability</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                    Larger benchmark instances evaluated on the full graph with representative
                    subgraph rendering.
                  </p>

                  {/* Loaded / Imported custom graphs */}
                  {customOrLargeGraphs.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                        Loaded Custom &amp; Research Instances:
                      </div>
                      <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {customOrLargeGraphs.map((g) => {
                          const selected = graph.currentGraph?.id === g.id;
                          return (
                            <button
                              key={g.id}
                              onClick={() => graph.selectGraph(g.id)}
                              disabled={graph.loading}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition-all border text-left flex items-center justify-between gap-2 ${
                                selected
                                  ? 'bg-purple-500/20 text-purple-200 border-purple-500/45 font-semibold'
                                  : 'bg-white/[0.02] text-slate-300 border-white/10 hover:border-white/25'
                              }`}
                            >
                              <span className="truncate">{g.name}</span>
                              <span className="text-[11px] text-purple-300 shrink-0">
                                {g.num_vertices.toLocaleString()}V / {g.num_edges.toLocaleString()}E
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Research Scale Generators */}
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-mono">
                    Generate Research Benchmark Instance:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {RESEARCH_SCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() =>
                          handleQuickResearchInstance(opt.vertices, opt.targetEdges, opt.maxWeight)
                        }
                        disabled={graph.loading || ws.isRunning}
                        className="px-3 py-2.5 rounded-xl text-xs font-mono bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/25 transition-colors text-left flex flex-col gap-0.5"
                        title={`Generate ${opt.label} (${opt.sublabel}, weights 1–${opt.maxWeight})`}
                      >
                        <span className="font-semibold text-white">{opt.label}</span>
                        <span className="text-[11px] text-purple-300/90">{opt.sublabel}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Graph Instance Complete Telemetry Card */}
                {graph.currentGraph && (
                  <div className="p-4 rounded-xl bg-black/45 border border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                        Graph Instance Telemetry
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          activeV > 250
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {activeV > 250 ? 'LARGE INSTANCE' : 'INTERACTIVE'}
                      </span>
                    </div>

                    <div className="flex justify-between gap-2 text-slate-400">
                      <span>Dataset:</span>
                      <span
                        className="font-mono text-white truncate max-w-[180px]"
                        title={graph.currentGraph.name}
                      >
                        {graph.currentGraph.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Vertices Loaded:</span>
                      <span className="font-mono text-white font-semibold">
                        {activeV.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Edges Loaded:</span>
                      <span className="font-mono text-white font-semibold">
                        {activeE.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Average Degree:</span>
                      <span className="font-mono text-slate-200">{activeAvgDegree.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Edge Density:</span>
                      <span className="font-mono text-slate-200">{activeDensity.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Weight Range:</span>
                      <span className="font-mono text-slate-200">
                        {activeMinW}–{activeMaxW} (μ={activeAvgW.toFixed(2)})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1.5 border-t border-white/5">
                      <span>Displayed Sample:</span>
                      <span
                        className={`font-mono font-semibold ${
                          isSampledView ? 'text-amber-300' : 'text-emerald-400'
                        }`}
                      >
                        {displayedSampleV.toLocaleString()} / {activeV.toLocaleString()} vertices
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ALGORITHM CONFIGURATION */}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                {/* Strategy Selector */}
                <div>
                  <label className="block text-xs text-slate-300 mb-2 font-semibold uppercase tracking-wider">
                    MCTS Rollout Strategy
                  </label>
                  <div className="space-y-2">
                    {(['dsatur', 'greedy', 'random'] as const).map((s) => (
                      <label
                        key={s}
                        onClick={() => setStrategy(s)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          strategy === s
                            ? 'bg-purple-500/20 text-purple-200 border-purple-500/45 font-semibold'
                            : 'bg-white/[0.02] text-slate-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="text-white font-semibold">
                            {s === 'dsatur'
                              ? 'DSATUR (Saturation Heuristic)'
                              : s === 'greedy'
                              ? 'Greedy (Minimum Marginal Cost)'
                              : 'Uniform Random Baseline'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5 leading-snug">
                            {s === 'dsatur'
                              ? 'Balances class weight increase with color class saturation'
                              : s === 'greedy'
                              ? 'Selects legal color minimizing immediate max-weight increase'
                              : 'Uniformly samples legal colors during rollout simulation'}
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="strategy"
                          checked={strategy === s}
                          onChange={() => setStrategy(s)}
                          className="accent-purple-500 ml-2 shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Exploration Factor */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">Exploration Weight (UCT c)</span>
                    <span className="font-mono text-purple-300 font-bold">
                      {explorationCoeff.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={explorationCoeff}
                    onChange={(e) => setExplorationCoeff(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                {/* AUTO COMPUTATION BUDGET SECTION */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Cpu size={14} className="text-cyan-400" />
                      <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                        Calibrated Execution Budget
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        graph.currentGraph && fetchBudget(graph.currentGraph.id, strategy)
                      }
                      disabled={budgetLoading || !graph.currentGraph}
                      className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                      title="Re-calibrate budget"
                    >
                      <RefreshCw size={11} className={budgetLoading ? 'animate-spin' : ''} />
                      <span>Recalibrate</span>
                    </button>
                  </div>

                  {budgetLoading && (
                    <div className="flex items-center gap-2.5 text-xs text-slate-300 py-3.5 px-3.5 rounded-xl bg-black/40 border border-white/10">
                      <Loader2 size={15} className="animate-spin text-cyan-400 shrink-0" />
                      <span>Measuring rollout throughput on active graph…</span>
                    </div>
                  )}

                  {budgetError && !budgetLoading && (
                    <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl p-3">
                      {budgetError}
                    </div>
                  )}

                  {autoBudget && !budgetLoading && (
                    <div className="rounded-xl bg-black/45 border border-cyan-500/20 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Instance Scale:</span>
                        <span className="font-mono text-white">
                          {autoBudget.num_vertices.toLocaleString()}V /{' '}
                          {autoBudget.num_edges.toLocaleString()}E
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Graph Density:</span>
                        <span className="font-mono text-slate-200">
                          {(autoBudget.density ?? activeDensity).toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Measured Speed:</span>
                        <span className="font-mono text-cyan-300">
                          {autoBudget.iters_per_sec.toFixed(1)} it/s
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Auto MCTS Budget:</span>
                        <span className="font-mono text-purple-300 font-bold">
                          {autoBudget.iterations.toLocaleString()} iters (~
                          {autoBudget.estimated_runtime_s.toFixed(2)}s)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Safety Time Ceiling:</span>
                        <span className="font-mono text-slate-300">
                          {autoBudget.time_limit.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: IMPORT DATASET OR CUSTOM GENERATOR */}
            {activeTab === 'import' && (
              <div className="space-y-4">
                {/* Dataset File Import */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload size={14} /> Import Benchmark Dataset
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Load external graph files in <span className="font-mono text-slate-200">JSON</span>,{' '}
                    <span className="font-mono text-slate-200">CSV</span> (vertex weights + edge list),
                    or <span className="font-mono text-slate-200">TXT</span> edge-list format.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={graph.loading}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Upload size={15} />
                    <span>Select Dataset File (.CSV / .JSON / .TXT)</span>
                  </button>

                  {uploadStatus && (
                    <div
                      className={`p-3 rounded-lg border text-xs font-mono ${
                        uploadStatus.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : uploadStatus.type === 'error'
                          ? 'bg-red-500/10 border-red-500/30 text-red-300'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      {uploadStatus.text}
                    </div>
                  )}
                </div>

                {/* Custom Synthetic Graph Generator */}
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3.5">
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Network size={14} /> Custom Synthetic Generator
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Vertices (5–10,000)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="10000"
                        value={numVertices}
                        onChange={(e) => setNumVertices(parseInt(e.target.value) || 15)}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Edge Probability
                      </label>
                      <input
                        type="number"
                        min="0.0002"
                        max="0.95"
                        step="0.01"
                        value={edgeDensity}
                        onChange={(e) => setEdgeDensity(parseFloat(e.target.value) || 0.05)}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Min Weight</label>
                      <input
                        type="number"
                        min="1"
                        max={maxWeight}
                        value={minWeight}
                        onChange={(e) => setMinWeight(parseInt(e.target.value) || 1)}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Max Weight</label>
                      <input
                        type="number"
                        min={minWeight}
                        max="1000"
                        value={maxWeight}
                        onChange={(e) => setMaxWeight(parseInt(e.target.value) || 20)}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Seed</label>
                      <input
                        type="number"
                        value={seed}
                        onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
                        className="input-dark w-full font-mono text-xs"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={graph.loading || ws.isRunning}
                    className="btn btn-primary w-full py-2.5 text-xs"
                  >
                    {graph.loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating Instance...</span>
                      </>
                    ) : (
                      <>
                        <Network size={14} />
                        <span>Generate Graph Instance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Algorithm Execution Controls Footer */}
          <div className="p-4 bg-black/55 border-t border-white/10 flex flex-col gap-2.5">
            {/* Active Configuration & Status Summary */}
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="text-slate-400 truncate">
                MCTS: <strong className="text-purple-300 uppercase">{strategy}</strong>
                {autoBudget ? ` (${autoBudget.iterations.toLocaleString()} iters)` : ''}
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  solverStatus === 'RUNNING'
                    ? 'text-cyan-300'
                    : solverStatus === 'OPTIMAL' || solverStatus === 'COMPLETED'
                    ? 'text-emerald-400'
                    : solverStatus === 'TIMEOUT' || solverStatus === 'ERROR'
                    ? 'text-amber-400'
                    : 'text-slate-500'
                }`}
              >
                {solverStatus === 'RUNNING' && <Loader2 size={12} className="animate-spin" />}
                {(solverStatus === 'OPTIMAL' || solverStatus === 'COMPLETED') && (
                  <CheckCircle2 size={12} />
                )}
                {(solverStatus === 'TIMEOUT' || solverStatus === 'ERROR') && (
                  <AlertTriangle size={12} />
                )}
                <span>{solverStatus === 'STOPPED' ? 'IDLE' : solverStatus}</span>
              </span>
            </div>

            <button
              onClick={handleRunMCTS}
              disabled={ws.isRunning || !graph.currentGraph || budgetLoading || !autoBudget}
              className="btn btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs"
            >
              {ws.isRunning && ws.activeAlgorithm?.includes('MCTS') ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>RUNNING MCTS ({strategy.toUpperCase()})…</span>
                </>
              ) : budgetLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>CALIBRATING BUDGET…</span>
                </>
              ) : (
                <>
                  <Play size={15} />
                  <span>RUN MCTS ({strategy.toUpperCase()})</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleRunExact}
                disabled={ws.isRunning || !graph.currentGraph}
                className="btn btn-danger py-2.5 text-xs flex items-center justify-center gap-1.5"
                title="Run Exact Branch & Bound Baseline Solver (60s limit)"
              >
                {ws.isRunning && ws.activeAlgorithm?.includes('EXACT') ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                <span>RUN EXACT</span>
              </button>

              <button
                onClick={handleRunComparison}
                disabled={ws.isRunning || !graph.currentGraph || budgetLoading || !autoBudget}
                className="btn py-2.5 text-xs bg-purple-500/20 text-purple-200 border border-purple-500/35 hover:bg-purple-500/30 flex items-center justify-center gap-1.5"
                title="Compare Exact Branch & Bound vs MCTS on active graph"
              >
                {ws.isRunning && ws.activeAlgorithm?.includes('COMPARE') ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <GitFork size={13} />
                )}
                <span>COMPARE</span>
              </button>
            </div>

            {activeV > 35 && (
              <div className="text-[11px] text-slate-400 leading-relaxed px-1">
                Note: Exact B&amp;B is an exponential baseline suited for small graphs; large
                instances ({activeV.toLocaleString()}V) will reach the 60s time limit on Exact.
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Interactive Graph / Tree Canvas */}
        <div className="w-full min-w-0 h-[500px] sm:h-[580px] lg:h-[640px] rounded-2xl overflow-hidden relative shadow-xl">
          <ErrorBoundary fallbackTitle="Canvas Rendering Error">
            {viewMode === 'graph' ? (
              <GraphVisualization
                graphData={graph.graphData}
                coloring={ws.coloring}
                graphStats={graph.graphStats}
                sampleLimit={graph.sampleLimit}
                onSampleLimitChange={graph.setSampleLimit}
              />
            ) : (
              <MCTSTreeVisualization nodes={[]} />
            )}
          </ErrorBoundary>
        </div>

        {/* RIGHT COLUMN: Live Metrics Panel */}
        <div className="w-full">
          <MetricsPanel
            metrics={ws.metrics}
            algorithm={ws.activeAlgorithm || (strategy ? `MCTS (${strategy})` : 'SOLVER')}
            autoBudget={autoBudget}
          />
        </div>
      </div>

      {/* ========================================================
          ROW 3: Bottom Analytics Row (Convergence Chart & Execution Log)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="w-full h-[340px]">
          <ScoreChart
            data={ws.metrics.scoreHistory}
            title="WVCP CONVERGENCE (SCORE VS ITERATIONS)"
          />
        </div>

        <div className="w-full h-[340px]">
          <EventLog events={ws.events} onClear={() => ws.resetMetrics()} />
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparisonModal && ws.comparisonResult && (
        <ComparisonModal
          data={ws.comparisonResult}
          onClose={() => setShowComparisonModal(false)}
          onApplyColoring={(coloring) => ws.setColoring(coloring)}
        />
      )}
    </div>
  );
};

export default VisualizationPage;
