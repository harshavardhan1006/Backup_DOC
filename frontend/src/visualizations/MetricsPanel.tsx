import React from 'react';
import { motion } from 'framer-motion';
import { LiveMetrics, SolverStatus } from '../types';

interface MetricsPanelProps {
  metrics: LiveMetrics;
  algorithm?: string;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0') + '.' + ms.toString().padStart(3, '0');
  };

  const formatScore = (score: number) => {
    if (score === Infinity || score === null || score === undefined) return '—';
    return score.toLocaleString();
  };

  const MetricRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 text-xs">{label}</span>
      <motion.span 
        key={String(value)}
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className={'font-mono text-sm ' + (color || 'text-white')}
      >
        {value}
      </motion.span>
    </div>
  );

  return (
    <div className="w-full glass p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-cyan-400 font-semibold uppercase tracking-wider text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.6)]"></span>
          Live Metrics
        </h3>
        {algorithm && <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{algorithm.toUpperCase()}</span>}
      </div>
      
      <div className="flex flex-col">
        {/* Status badge */}
        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
          <span className="text-gray-400 text-xs">Status</span>
          <span className={'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ' + getStatusColor(metrics.status)}>
            {metrics.status}
          </span>
        </div>
        
        <MetricRow label="Iteration" value={metrics.iteration.toLocaleString()} />
        <MetricRow label="Best Score" value={formatScore(metrics.bestScore)} color="text-green-400" />
        <MetricRow label="Current Score" value={formatScore(metrics.currentScore)} />
        <MetricRow label="Nodes Explored" value={metrics.nodesExplored.toLocaleString()} />
        <MetricRow label="Nodes Pruned" value={metrics.nodesPruned.toLocaleString()} />
        <MetricRow label="Simulations" value={metrics.simulations.toLocaleString()} />
        <MetricRow label="Colors Used" value={metrics.numColors || '—'} color="text-purple-400" />
        <MetricRow label="Elapsed Time" value={formatTime(metrics.elapsedTime)} color="text-cyan-400" />
      </div>
    </div>
  );
}
