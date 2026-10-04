import React from 'react';
import { motion } from 'framer-motion';
import { LiveMetrics, SolverStatus, AutoBudget } from '../types';

interface MetricsPanelProps {
  metrics: LiveMetrics;
  algorithm?: string;
  autoBudget?: AutoBudget | null;
}

export default function MetricsPanel({ metrics, algorithm }: MetricsPanelProps) {
  const getStatusColor = (status: SolverStatus) => {
    switch (status) {
      case 'OPTIMAL': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'RUNNING': return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'TIMEOUT': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'STOPPED': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'ERROR': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const formatSeconds = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '0.0s';
    return `${seconds.toFixed(2)}s`;
  };

  const formatScore = (score?: number | null) => {
    if (score === Infinity || score === null || score === undefined || isNaN(score)) return '—';
    return score.toLocaleString();
  };

  const formatNumber = (val?: number | null, fallback: string = '0') => {
    if (val === null || val === undefined || isNaN(val)) return fallback;
    return val.toLocaleString();
  };

  const isExactAlgo = algorithm?.toUpperCase().includes('EXACT');

  const MetricRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-xs font-medium">{label}</span>
      <motion.span 
        key={String(value)}
        initial={{ opacity: 0.6, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className={'font-mono text-sm font-semibold ' + (color || 'text-white')}
      >
        {value}
      </motion.span>
    </div>
  );

  return (
    <div className="w-full bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/10">
        <h3 className="text-cyan-400 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.6)]"></span>
          Live Metrics
        </h3>
        {algorithm && (
          <span className="text-[10px] text-gray-300 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            {algorithm.toUpperCase()}
          </span>
        )}
      </div>

      {/* Execution Summary Banner: "Iterations: N / Elapsed: Xs" */}
      {!isExactAlgo && (
        <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-gray-300">
            Iterations: <strong className="text-white">{formatNumber(metrics?.iteration, '0')}</strong>
          </span>
          <span className="text-gray-500">/</span>
          <span className="text-cyan-300">
            Elapsed: <strong>{formatSeconds(metrics?.elapsedTime)}</strong>
          </span>
        </div>
      )}
      
      <div className="flex flex-col">
        {/* Status badge */}
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-gray-400 text-xs font-medium">Status</span>
          <span className={'text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ' + getStatusColor(metrics?.status || 'STOPPED')}>
            {metrics?.status || 'STOPPED'}
          </span>
        </div>
        
        <MetricRow 
          label={isExactAlgo ? "States Explored" : "Iterations"} 
          value={formatNumber(metrics?.iteration, '0')} 
        />
        <MetricRow label="Elapsed Time" value={formatSeconds(metrics?.elapsedTime)} color="text-cyan-400" />
        <MetricRow label="Best Score" value={formatScore(metrics?.bestScore)} color="text-green-400" />
        <MetricRow 
          label="Colors Used" 
          value={metrics?.numColors && metrics.numColors > 0 ? metrics.numColors.toString() : '—'} 
          color="text-purple-400" 
        />
        <MetricRow label="Nodes Explored" value={formatNumber(metrics?.nodesExplored, '0')} />
        <MetricRow label={isExactAlgo ? "Branches Pruned" : "Nodes Pruned"} value={formatNumber(metrics?.nodesPruned, '0')} />
        <MetricRow 
          label="Simulations" 
          value={isExactAlgo ? "—" : formatNumber(metrics?.simulations, '0')} 
          color={isExactAlgo ? "text-gray-500" : "text-white"}
        />
      </div>
    </div>
  );
}
