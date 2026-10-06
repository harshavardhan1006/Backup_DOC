import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '../components/ErrorBoundary';

interface ScoreChartProps {
  data: { iteration: number; score: number }[];
  title?: string;
}

export default function ScoreChart({
  data,
  title = 'WVCP Convergence (Score vs Iterations)',
}: ScoreChartProps) {
  // Sanitize and guarantee valid numeric data points for Recharts
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const valid = data
      .filter((d) => d && typeof d.score === 'number' && !isNaN(d.score) && isFinite(d.score))
      .map((d, idx) => ({
        iteration: typeof d.iteration === 'number' && !isNaN(d.iteration) ? d.iteration : idx,
        score: d.score,
        stepIndex: idx,
      }));

    // Ensure non-duplicate x-axis keys while preserving actual iteration values
    const seen = new Set<number>();
    return valid.map((d, idx) => {
      let iter = d.iteration;
      if (seen.has(iter)) {
        iter = idx;
      }
      seen.add(iter);
      return { ...d, displayIteration: iter };
    });
  }, [data]);

  const initialScore = chartData.length > 0 ? chartData[0].score : null;
  const bestScore = chartData.length > 0 ? chartData[chartData.length - 1].score : null;
  const improvement =
    initialScore !== null && bestScore !== null && initialScore > bestScore
      ? initialScore - bestScore
      : 0;

  return (
    <ErrorBoundary fallbackTitle="Score Chart Error">
      <div className="w-full h-full min-h-[300px] bg-[#0b0b1e]/95 rounded-2xl p-5 border border-white/10 flex flex-col shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {title}
            </h3>
          </div>

          {chartData.length > 0 ? (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <span className="text-slate-400">
                Initial: <strong className="text-slate-200">{initialScore?.toLocaleString()}</strong>
              </span>
              <span className="text-slate-400">
                Best: <strong className="text-emerald-400">{bestScore?.toLocaleString()}</strong>
              </span>
              {improvement > 0 && (
                <span className="text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                  −{improvement.toLocaleString()} Δ
                </span>
              )}
              <span className="text-slate-500">({chartData.length} updates)</span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              X: Iterations • Y: WVCP Objective Score
            </span>
          )}
        </div>

        <div className="flex-1 w-full min-h-0 relative">
          {chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs gap-2 bg-black/25 rounded-xl border border-dashed border-white/[0.07] px-6 text-center">
              <div className="font-mono text-xs text-slate-300 uppercase tracking-wider">
                No Convergence Data Recorded Yet
              </div>
              <div className="text-xs text-slate-500 max-w-md leading-relaxed">
                Execute <span className="text-cyan-400 font-mono">RUN MCTS</span>,{' '}
                <span className="text-red-400 font-mono">RUN EXACT</span>, or{' '}
                <span className="text-purple-400 font-mono">COMPARE</span> to plot best-known WVCP objective score (Y-axis) across search iterations (X-axis).
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis
                  dataKey="displayIteration"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{
                    value: 'Iterations',
                    position: 'insideBottom',
                    offset: -10,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  width={52}
                  label={{
                    value: 'WVCP Score',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 4,
                    fill: '#94a3b8',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0b1e',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#00D4FF' }}
                  formatter={(value: any) => [value, 'WVCP Objective Score']}
                  labelFormatter={(label) => `Iteration: ${label}`}
                />
                <Line
                  type="stepAfter"
                  dataKey="score"
                  stroke="#00D4FF"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#00E5A0', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#00D4FF' }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
