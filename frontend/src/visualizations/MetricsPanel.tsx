import React from 'react';
import { LiveMetrics, SolverStatus, AutoBudget } from '../types';

interface MetricsPanelProps {
  metrics: LiveMetrics;
  algorithm?: string;
  autoBudget?: AutoBudget | null;
}

export default function MetricsPanel({ metrics, algorithm }: MetricsPanelProps) {
  const status: SolverStatus = metrics?.status || 'STOPPED';

  const getStatusMeta = (s: SolverStatus) => {
    switch (s) {
      case 'OPTIMAL':
        return {
          label: 'OPTIMAL (PROVEN)',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
          dotClass: 'bg-emerald-400',
        };
      case 'RUNNING':
        return {
          label: 'RUNNING',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
          dotClass: 'bg-cyan-400 animate-pulse',
        };
      case 'COMPLETED':
        return {
          label: 'COMPLETED',
          badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/35',
          dotClass: 'bg-blue-400',
        };
      case 'TIMEOUT':
        return {
          label: 'TIMEOUT',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
          dotClass: 'bg-amber-400',
        };
      case 'ERROR':
        return {
          label: 'FAILED / ERROR',
          badgeClass: 'bg-red-500/15 text-red-300 border-red-500/35',
          dotClass: 'bg-red-400',
        };
      case 'STOPPED':
      default:
        return {
          label: 'IDLE',
          badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const formatSeconds = (seconds?: number | null) => {
    if (seconds === null || seconds === undefined || isNaN(seconds)) return '0.00s';
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
  const statusMeta = getStatusMeta(status);

  const MetricRow = ({
    label,
    value,
    valueClass = 'text-white',
  }: {
    label: string;
    value: React.ReactNode;
    valueClass?: string;
  }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/[0.06] last:border-0">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`font-mono text-xs font-semibold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="w-full bg-[#0b0b1e]/95 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      {/* Section 1: Current Execution State */}
      <div>
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/10">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Execution State
          </span>
          {algorithm && (
            <span className="text-[11px] text-cyan-300 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg">
              {algorithm.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 border border-white/[0.07] rounded-xl px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusMeta.dotClass}`} />
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${statusMeta.badgeClass}`}
            >
              {statusMeta.label}
            </span>
          </div>
          <div className="text-xs font-mono text-slate-300 tabular-nums">
            {!isExactAlgo ? (
              <>
                <span className="text-slate-400">Iters:</span>{' '}
                <strong className="text-white">{formatNumber(metrics?.iteration, '0')}</strong>
                <span className="text-slate-600 mx-1.5">/</span>
                <span className="text-slate-400">Time:</span>{' '}
                <strong className="text-cyan-300">{formatSeconds(metrics?.elapsedTime)}</strong>
              </>
            ) : (
              <>
                <span className="text-slate-400">Elapsed:</span>{' '}
                <strong className="text-cyan-300">{formatSeconds(metrics?.elapsedTime)}</strong>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Numerical Results — Solution Quality */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Solution Metrics
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/35 border border-white/[0.06] rounded-xl px-4 py-3">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Best Score</div>
            <div className="font-mono text-xl font-bold text-emerald-400 tabular-nums mt-1">
              {formatScore(metrics?.bestScore)}
            </div>
          </div>
          <div className="bg-black/35 border border-white/[0.06] rounded-xl px-4 py-3">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Colors Used</div>
            <div className="font-mono text-xl font-bold text-purple-300 tabular-nums mt-1">
              {metrics?.numColors && metrics.numColors > 0 ? metrics.numColors.toString() : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Search Telemetry */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Search Telemetry
        </div>
        <div className="bg-black/25 border border-white/[0.05] rounded-xl px-4 py-1.5">
          <MetricRow
            label={isExactAlgo ? 'States Explored' : 'Iterations'}
            value={formatNumber(isExactAlgo ? metrics?.nodesExplored : metrics?.iteration, '0')}
          />
          <MetricRow
            label="Elapsed Time"
            value={formatSeconds(metrics?.elapsedTime)}
            valueClass="text-cyan-300"
          />
          <MetricRow
            label="Nodes Explored"
            value={formatNumber(metrics?.nodesExplored, '0')}
          />
          <MetricRow
            label={isExactAlgo ? 'Branches Pruned' : 'Nodes Pruned'}
            value={formatNumber(metrics?.nodesPruned, '0')}
            valueClass="text-amber-300"
          />
          <MetricRow
            label="Simulations"
            value={isExactAlgo ? '—' : formatNumber(metrics?.simulations, '0')}
            valueClass={isExactAlgo ? 'text-slate-500' : 'text-slate-200'}
          />
        </div>
      </div>
    </div>
  );
}
