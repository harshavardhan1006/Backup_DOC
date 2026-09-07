import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitFork, Zap, Clock, Award, X, CheckCircle2, TrendingUp } from 'lucide-react';

interface ComparisonData {
  results: {
    exact?: {
      score: number;
      num_colors: number;
      runtime: number;
      nodes_explored: number;
      nodes_pruned: number;
      status: string;
      is_optimal: boolean;
      coloring: Record<string, number>;
    };
    mcts?: {
      score: number;
      num_colors: number;
      runtime: number;
      nodes_explored: number;
      nodes_pruned: number;
      simulations: number;
      status: string;
      is_optimal: boolean;
      coloring: Record<string, number>;
      strategy: string;
    };
  };
  optimality_gap?: number | null;
  speedup?: number | null;
}

interface ComparisonModalProps {
  data: ComparisonData | null;
  onClose: () => void;
  onApplyColoring?: (coloring: Record<string, number>) => void;
}

export default function ComparisonModal({ data, onClose, onApplyColoring }: ComparisonModalProps) {
  if (!data || !data.results) return null;

  const { exact, mcts } = data.results;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#0b0b22] border border-white/15 rounded-3xl p-6 shadow-[0_0_50px_rgba(139,92,246,0.25)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <GitFork size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Algorithm Comparison Summary
                </h2>
                <p className="text-xs text-slate-400">
                  Head-to-head empirical results: Exact Branch & Bound vs MCTS
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Key Differences Banner */}
          <div className="grid grid-cols-2 gap-3 my-5">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3">
              <Award className="text-cyan-400 flex-shrink-0" size={24} />
              <div>
                <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Optimality Gap</div>
                <div className="text-xl font-mono font-extrabold text-white">
                  {data.optimality_gap !== null && data.optimality_gap !== undefined
                    ? `${data.optimality_gap > 0 ? '+' : ''}${data.optimality_gap}%`
                    : 'N/A'}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <TrendingUp className="text-emerald-400 flex-shrink-0" size={24} />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">MCTS Speedup Factor</div>
                <div className="text-xl font-mono font-extrabold text-white">
                  {data.speedup !== null && data.speedup !== undefined
                    ? `${data.speedup}x`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Side by side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Exact Solver Card */}
            <div className="p-4 rounded-2xl bg-red-500/[0.04] border border-red-500/20 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <Zap size={14} /> Exact (B&B)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold">
                    {exact?.status || 'N/A'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">WVCP Score:</span>
                    <span className="font-mono font-bold text-white text-sm">{exact?.score ?? '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Colors Used:</span>
                    <span className="font-mono text-purple-300 font-semibold">{exact?.num_colors ?? '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Runtime:</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      {exact?.runtime !== undefined ? `${exact.runtime.toFixed(4)}s` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-400">States Explored:</span>
                    <span className="font-mono text-gray-300">{exact?.nodes_explored?.toLocaleString() ?? '—'}</span>
                  </div>
                </div>
              </div>

              {exact?.coloring && onApplyColoring && (
                <button
                  onClick={() => onApplyColoring(exact.coloring)}
                  className="mt-4 w-full py-1.5 rounded-xl text-xs bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5 font-medium"
                >
                  <CheckCircle2 size={13} />
                  <span>Show Exact Coloring</span>
                </button>
              )}
            </div>

            {/* MCTS Solver Card */}
            <div className="p-4 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/20 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Clock size={14} /> MCTS ({mcts?.strategy || 'dsatur'})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                    {mcts?.status || 'N/A'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">WVCP Score:</span>
                    <span className="font-mono font-bold text-white text-sm">{mcts?.score ?? '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Colors Used:</span>
                    <span className="font-mono text-purple-300 font-semibold">{mcts?.num_colors ?? '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1.5">
                    <span className="text-gray-400">Runtime:</span>
                    <span className="font-mono text-cyan-300 font-semibold">
                      {mcts?.runtime !== undefined ? `${mcts.runtime.toFixed(4)}s` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-gray-400">Iterations / Sims:</span>
                    <span className="font-mono text-gray-300">
                      {mcts?.nodes_explored?.toLocaleString() ?? '—'} / {mcts?.simulations?.toLocaleString() ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              {mcts?.coloring && onApplyColoring && (
                <button
                  onClick={() => onApplyColoring(mcts.coloring)}
                  className="mt-4 w-full py-1.5 rounded-xl text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 font-medium"
                >
                  <CheckCircle2 size={13} />
                  <span>Show MCTS Coloring</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="btn btn-primary text-xs py-2 px-5"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
