import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Upload, Play, Zap, Network, Loader2, Check, AlertCircle, RefreshCw, GitFork } from 'lucide-react';
import GraphVisualization from '../visualizations/GraphVisualization';
import MCTSTreeVisualization from '../visualizations/MCTSTreeVisualization';
import ScoreChart from '../visualizations/ScoreChart';
import MetricsPanel from '../visualizations/MetricsPanel';
import EventLog from '../visualizations/EventLog';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGraph } from '../hooks/useGraph';
import type { GraphConfig } from '../types';

const PRESET_OPTIONS = [
  { id: 'preset_tiny', name: 'Tiny (5V, 5E)' },
  { id: 'preset_small', name: 'Small (8V, 10E)' },
  { id: 'preset_medium', name: 'Medium (15V, 21E)' },
  { id: 'preset_dense', name: 'Dense (10V, 30E)' },
  { id: 'preset_larger', name: 'Larger (25V, 57E)' },
];

const VisualizationPage: React.FC = () => {
  // Navigation tabs for left panel
  const [activeTab, setActiveTab] = useState<'generate' | 'import' | 'settings'>('generate');

  // Graph generator configuration
  const [numVertices, setNumVertices] = useState(15);
  const [edgeDensity, setEdgeDensity] = useState(0.35);
  const [minWeight, setMinWeight] = useState(1);
  const [maxWeight, setMaxWeight] = useState(100);
  const [seed, setSeed] = useState(42);

  // Algorithm parameters
  const [strategy, setStrategy] = useState<'random' | 'greedy' | 'dsatur'>('dsatur');
  const [iterations, setIterations] = useState(1000);
  const [timeLimit, setTimeLimit] = useState(30);
  const [explorationCoeff, setExplorationCoeff] = useState(1.414);

  // Active view mode
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');

  // File upload state
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const graph = useGraph();
  const ws = useWebSocket();

  // Initial mount: Connect WebSocket and load preset graph
  useEffect(() => {
    ws.connect();
    graph.refreshGraphs();
  }, []);

  // Auto-load preset_tiny if no graph is selected once graphs are loaded
  useEffect(() => {
    if (!graph.currentGraph && graph.graphs.length > 0) {
      const defaultPreset = graph.graphs.find(g => g.id === 'preset_tiny') || graph.graphs[0];
      if (defaultPreset) {
        graph.selectGraph(defaultPreset.id);
      }
    }
  }, [graph.graphs, graph.currentGraph]);

  // Generate new random graph
  const handleGenerate = async () => {
    const config: GraphConfig = {
      num_vertices: numVertices,
      edge_probability: edgeDensity,
      min_weight: minWeight,
      max_weight: maxWeight,
      seed,
    };
    await graph.generateGraph(config);
  };

  // Run MCTS solver
  const handleRunMCTS = async () => {
    if (!graph.currentGraph) {
      alert('Please select or generate a graph first.');
      return;
    }
    ws.resetMetrics();
    await ws.ws.runMCTS(graph.currentGraph.id, {
      iterations,
      time_limit: timeLimit,
      exploration: explorationCoeff,
      strategy,
      seed,
    });
  };

  // Run Exact solver (Branch & Bound)
  const handleRunExact = async () => {
    if (!graph.currentGraph) {
      alert('Please select or generate a graph first.');
      return;
    }
    ws.resetMetrics();
    await ws.ws.runExact(graph.currentGraph.id, {
      time_limit: timeLimit,
    });
  };

  // Run Comparison (both solvers)
  const handleRunComparison = async () => {
    if (!graph.currentGraph) {
      alert('Please select or generate a graph first.');
      return;
    }
    ws.resetMetrics();
    await ws.ws.runComparison(graph.currentGraph.id, [
      { algorithm: 'exact', time_limit: timeLimit },
      { algorithm: 'mcts', strategy, iterations, time_limit: timeLimit, exploration: explorationCoeff, seed }
    ]);
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('Uploading...');
    try {
      const res = await graph.uploadGraph(file);
      if (res && res.status === 'success') {
        setUploadStatus(`Uploaded: ${file.name}`);
      } else {
        setUploadStatus(res?.errors?.join(', ') || 'Upload failed');
      }
    } catch (err: any) {
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full w-full flex gap-5 overflow-hidden text-sm">
      {/* ========================================================
          LEFT PANEL: Configuration, Generation & Action Controls
          ======================================================== */}
      <div className="w-[320px] min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col bg-[#0b0b1e]/80 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-white/10 bg-white/[0.02] flex-shrink-0">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'generate'
                ? 'text-cyan-400 border-cyan-400 bg-cyan-500/10'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'text-purple-400 border-purple-400 bg-purple-500/10'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Algorithm
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'import'
                ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10'
                : 'text-gray-400 border-transparent hover:text-white'
            }`}
          >
            Import
          </button>
        </div>

        {/* Scrollable Configuration Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: GENERATE GRAPH */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              {/* Vertices slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-400">Vertices</span>
                  <span className="font-mono text-cyan-400 font-bold">{numVertices}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={numVertices}
                  onChange={(e) => setNumVertices(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Edge Density */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-gray-400">Edge Density</span>
                  <span className="font-mono text-cyan-400 font-bold">{edgeDensity.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={edgeDensity}
                  onChange={(e) => setEdgeDensity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Weight Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Min Weight</label>
                  <input
                    type="number"
                    min="1"
                    max={maxWeight}
                    value={minWeight}
                    onChange={(e) => setMinWeight(parseInt(e.target.value) || 1)}
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Max Weight</label>
                  <input
                    type="number"
                    min={minWeight}
                    max="1000"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(parseInt(e.target.value) || 100)}
                    className="input-dark w-full"
                  />
                </div>
              </div>

              {/* Seed */}
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Random Seed</label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                  className="input-dark w-full"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={graph.loading}
                className="btn btn-primary w-full py-2.5 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
              >
                {graph.loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Network size={16} />
                    <span>Generate Graph</span>
                  </>
                )}
              </button>

              {/* Presets List */}
              <div className="pt-3 border-t border-white/10">
                <label className="block text-[11px] text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                  Benchmark Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => graph.selectGraph(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all border text-left truncate ${
                        graph.currentGraph?.id === p.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                          : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/20'
                      }`}
                      title={p.name}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graph Statistics Card */}
              {graph.graphStats && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5 text-xs">
                  <div className="text-[11px] font-semibold text-gray-300 mb-1">Active Graph Stats</div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vertices:</span>
                    <span className="font-mono text-white">{graph.graphStats.num_vertices}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Edges:</span>
                    <span className="font-mono text-white">{graph.graphStats.num_edges.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Density:</span>
                    <span className="font-mono text-white">{graph.graphStats.density.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Avg Weight:</span>
                    <span className="font-mono text-white">{graph.graphStats.avg_weight.toFixed(1)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALGORITHM CONFIGURATION */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Strategy Selector */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">MCTS Rollout Strategy</label>
                <div className="space-y-2">
                  {(['dsatur', 'greedy', 'random'] as const).map((s) => (
                    <label
                      key={s}
                      onClick={() => setStrategy(s)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        strategy === s
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                          : 'bg-white/[0.02] text-gray-400 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="capitalize">{s === 'dsatur' ? 'DSatur (Saturation Heuristic)' : s === 'greedy' ? 'Greedy (Min Cost)' : 'Uniform Random'}</span>
                      <input
                        type="radio"
                        name="strategy"
                        checked={strategy === s}
                        onChange={() => setStrategy(s)}
                        className="accent-purple-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Iterations */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-400">Iterations</span>
                  <span className="font-mono text-purple-300 font-bold">{iterations}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={iterations}
                  onChange={(e) => setIterations(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Time Limit */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-400">Time Limit (s)</span>
                  <span className="font-mono text-purple-300 font-bold">{timeLimit}s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Exploration Factor */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-400">Exploration Weight (UCT)</span>
                  <span className="font-mono text-purple-300 font-bold">{explorationCoeff.toFixed(2)}</span>
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
            </div>
          )}

          {/* TAB 3: IMPORT DATASET */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload benchmark files in JSON, CSV (two-section), or TXT edge-list format.
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
                className="btn btn-ghost w-full py-4 border-dashed border-white/20 hover:border-emerald-500/50 flex flex-col items-center gap-2 rounded-xl"
              >
                <Upload size={24} className="text-emerald-400" />
                <span className="text-xs text-gray-300">Click to Select Dataset File</span>
              </button>

              {uploadStatus && (
                <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-xs text-cyan-300 font-mono">
                  {uploadStatus}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Buttons Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleRunMCTS}
            disabled={ws.isRunning || !graph.currentGraph}
            className="btn btn-primary w-full py-2.5 shadow-[0_0_15px_rgba(0,212,255,0.25)] flex items-center justify-center gap-2"
          >
            {ws.isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            <span>RUN MCTS</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRunExact}
              disabled={ws.isRunning || !graph.currentGraph}
              className="btn btn-danger py-2 text-xs flex items-center justify-center gap-1.5"
              title="Run Branch & Bound Exact Solver"
            >
              <Zap size={14} />
              <span>RUN EXACT</span>
            </button>

            <button
              onClick={handleRunComparison}
              disabled={ws.isRunning || !graph.currentGraph}
              className="btn py-2 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 flex items-center justify-center gap-1.5"
              title="Run Exact vs MCTS Comparison"
            >
              <GitFork size={14} />
              <span>COMPARE</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          CENTER AREA: Visual Canvas (Graph / Tree) & Score Chart
          ======================================================== */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
        {/* Visualizer Header Toolbar */}
        <div className="h-10 px-4 flex items-center justify-between bg-[#0b0b1e]/80 border border-white/10 rounded-xl flex-shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-white truncate max-w-[280px]">
              {graph.currentGraph?.name || 'No Graph Selected'}
            </span>
            {graph.currentGraph && (
              <span className="text-[11px] text-gray-500 font-mono">
                {graph.currentGraph.num_vertices}V / {graph.currentGraph.num_edges}E
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Force Graph
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              MCTS Tree
            </button>
          </div>
        </div>

        {/* Main Visualization Canvas */}
        <div className="flex-1 min-h-[320px] rounded-2xl overflow-hidden relative">
          {viewMode === 'graph' ? (
            <GraphVisualization
              graphData={graph.graphData}
              coloring={ws.coloring}
            />
          ) : (
            <MCTSTreeVisualization
              nodes={[]}
            />
          )}
        </div>

        {/* Bottom Convergence Panel */}
        <div className="h-[210px] flex-shrink-0">
          <ScoreChart
            data={ws.metrics.scoreHistory}
            title="WVCP Convergence (Score vs Iterations)"
          />
        </div>
      </div>

      {/* ========================================================
          RIGHT PANEL: Live Metrics Panel & Terminal Event Log
          ======================================================== */}
      <div className="w-[320px] min-w-[320px] max-w-[320px] flex-shrink-0 flex flex-col gap-4 h-full overflow-hidden">
        {/* Metrics Panel */}
        <div className="flex-shrink-0">
          <MetricsPanel
            metrics={ws.metrics}
            algorithm={strategy ? `MCTS (${strategy})` : 'SOLVER'}
          />
        </div>

        {/* Terminal Event Log */}
        <div className="flex-1 min-h-0">
          <EventLog
            events={ws.events}
            onClear={() => ws.resetMetrics()}
          />
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;
