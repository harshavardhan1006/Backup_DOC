import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Settings2, BarChart2, Download, Loader2, Clock, Award, Cpu } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import type { ExperimentResult } from '../types';

interface AlgoSelection {
  id: string;
  name: string;
  algorithm: 'exact' | 'mcts';
  strategy?: 'random' | 'greedy' | 'dsatur';
  color: string;
}

const AVAILABLE_ALGOS: AlgoSelection[] = [
  { id: 'exact', name: 'Exact (Branch & Bound)', algorithm: 'exact', color: '#FF6B6B' },
  {
    id: 'mcts_random',
    name: 'MCTS + Random',
    algorithm: 'mcts',
    strategy: 'random',
    color: '#FFD43B',
  },
  {
    id: 'mcts_greedy',
    name: 'MCTS + Greedy',
    algorithm: 'mcts',
    strategy: 'greedy',
    color: '#00D4FF',
  },
  {
    id: 'mcts_dsatur',
    name: 'MCTS + DSatur',
    algorithm: 'mcts',
    strategy: 'dsatur',
    color: '#00E5A0',
  },
];

const ExperimentsPage: React.FC = () => {
  const [selectedSizes, setSelectedSizes] = useState<number[]>([5, 10, 15, 20]);
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>(['exact', 'mcts_dsatur']);
  const [edgeProbability, setEdgeProbability] = useState(0.3);
  const [repetitions] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b)
    );
  };

  const toggleAlgo = (id: string) => {
    setSelectedAlgos((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleRunExperiments = async () => {
    if (selectedSizes.length === 0 || selectedAlgos.length === 0) {
      setErrorMsg('Please select at least one graph size and one algorithm.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);

    const chosenAlgos = AVAILABLE_ALGOS.filter((a) => selectedAlgos.includes(a.id)).map((a) => ({
      algorithm: a.algorithm,
      strategy: a.strategy,
    }));

    try {
      const response = await api.runScalability({
        graph_sizes: selectedSizes,
        algorithms: chosenAlgos,
        edge_probability: edgeProbability,
        num_repetitions: repetitions,
        seed: 42,
      });

      if (response && response.result) {
        setResults(response.result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Experiment execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Group chart data by graph size
  const runtimeChartData = selectedSizes.map((size) => {
    const entry: Record<string, any> = { size: `${size}V` };
    results
      .filter((r) => r.graph_size === size)
      .forEach((r) => {
        const key = r.algorithm === 'exact' ? 'Exact' : `MCTS_${r.simulation_strategy}`;
        entry[key] = Number(r.runtime.toFixed(4));
      });
    return entry;
  });

  const scoreChartData = selectedSizes.map((size) => {
    const entry: Record<string, any> = { size: `${size}V` };
    results
      .filter((r) => r.graph_size === size)
      .forEach((r) => {
        const key = r.algorithm === 'exact' ? 'Exact' : `MCTS_${r.simulation_strategy}`;
        entry[key] = r.score;
      });
    return entry;
  });

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `experiment_scalability_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 pb-12 w-full items-start"
    >
      {/* Left Settings Panel */}
      <div className="w-full lg:w-[360px] flex-shrink-0 bg-[#0b0b1e]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col justify-between shadow-xl">
        <div className="space-y-6 text-sm">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings2 className="text-emerald-400" /> Experiment Matrix
            </h2>
            <span className="text-xs text-slate-400 font-mono">Benchmark Lab</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          {/* Graph Sizes */}
          <div>
            <label className="block text-slate-300 mb-2.5 font-semibold text-xs uppercase tracking-wider">
              Graph Sizes (Vertices)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20, 30, 50, 75, 100].map((size) => {
                const active = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-2 rounded-xl border text-xs font-mono transition-all ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-slate-900/40 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {size}V
                  </button>
                );
              })}
            </div>
          </div>

          {/* Algorithms */}
          <div>
            <label className="block text-slate-300 mb-2.5 font-semibold text-xs uppercase tracking-wider">
              Target Solvers
            </label>
            <div className="space-y-2">
              {AVAILABLE_ALGOS.map((algo) => {
                const active = selectedAlgos.includes(algo.id);
                return (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => toggleAlgo(algo.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                      active
                        ? 'bg-white/10 text-white border-white/20 font-medium'
                        : 'bg-black/25 text-slate-400 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: algo.color }}
                      />
                      <span>{algo.name}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        active ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      {active ? 'Active' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="flex justify-between text-slate-300 mb-1.5 text-xs font-medium">
                <span>Edge Density</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {edgeProbability.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={edgeProbability}
                onChange={(e) => setEdgeProbability(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Auto Computation Informational Section */}
            <div className="rounded-xl bg-black/40 border border-cyan-500/20 p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold uppercase tracking-wider text-xs">
                <Cpu size={14} />
                <span>Auto Computation Budget</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs">
                MCTS iterations and time limits are calibrated automatically per graph based on
                vertex/edge complexity and measured rollout throughput.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6">
          <button
            disabled={isRunning}
            onClick={handleRunExperiments}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg text-xs sm:text-sm ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Running Scalability Benchmark...</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>RUN EXPERIMENTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Visualization & Results Area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
        {/* Charts Container */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Chart 1: Runtime vs Graph Size */}
          <div className="h-[320px] bg-[#0b0b1e]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock size={16} className="text-cyan-400" /> Runtime vs Graph Size
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={runtimeChartData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis dataKey="size" stroke="#8888aa" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#8888aa" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0b1e',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  {selectedAlgos.includes('exact') && (
                    <Line
                      type="monotone"
                      dataKey="Exact"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_random') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_random"
                      stroke="#FFD43B"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_greedy') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_greedy"
                      stroke="#00D4FF"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_dsatur') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_dsatur"
                      stroke="#00E5A0"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: WVCP Score vs Graph Size */}
          <div className="h-[320px] bg-[#0b0b1e]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Award size={16} className="text-emerald-400" /> WVCP Objective Score vs Graph Size
            </h3>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={scoreChartData}
                  margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                  <XAxis dataKey="size" stroke="#8888aa" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#8888aa" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0b1e',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  {selectedAlgos.includes('exact') && (
                    <Line
                      type="monotone"
                      dataKey="Exact"
                      stroke="#FF6B6B"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_random') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_random"
                      stroke="#FFD43B"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_greedy') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_greedy"
                      stroke="#00D4FF"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                  {selectedAlgos.includes('mcts_dsatur') && (
                    <Line
                      type="monotone"
                      dataKey="MCTS_dsatur"
                      stroke="#00E5A0"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-[#0b0b1e]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex flex-col shadow-xl">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart2 size={18} className="text-cyan-400" /> Benchmark Results
            </h2>
            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="text-slate-300 hover:text-white flex items-center text-xs px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-40"
            >
              <Download size={14} className="mr-1.5 text-emerald-400" /> Export CSV
            </button>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
            <table className="w-full min-w-[760px] text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 border-b border-white/10">
                <tr>
                  <th className="px-5 py-3.5">Graph Size</th>
                  <th className="px-5 py-3.5">Algorithm</th>
                  <th className="px-5 py-3.5">Iterations</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Colors</th>
                  <th className="px-5 py-3.5">Time (s)</th>
                  <th className="px-5 py-3.5">Nodes Explored</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-white whitespace-nowrap">
                      {r.graph_size} Vertices
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span className="font-semibold text-purple-300">
                        {r.algorithm.toUpperCase()}
                      </span>
                      {r.simulation_strategy && r.simulation_strategy !== 'none' && (
                        <span className="text-slate-400 ml-1">({r.simulation_strategy})</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-purple-300">
                      {(r.iterations ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">{r.score}</td>
                    <td className="px-5 py-3.5 font-mono text-xs">{r.num_colors}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-cyan-300 whitespace-nowrap">
                      {r.runtime.toFixed(4)}s
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                      {(r.nodes_explored ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          r.status === 'OPTIMAL' || r.status === 'COMPLETED'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center text-slate-400 italic">
                      No experiment data yet. Configure your matrix and click &ldquo;RUN
                      EXPERIMENTS&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperimentsPage;
