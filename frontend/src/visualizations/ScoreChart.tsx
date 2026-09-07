import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreChartProps {
  data: { iteration: number; score: number }[];
  title?: string;
}

export default function ScoreChart({ data, title = 'Best Score vs Iterations' }: ScoreChartProps) {
  return (
    <div className="w-full h-full bg-[#070716] rounded-2xl p-4 border border-white/10 flex flex-col">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          {title}
        </h3>
        {data.length > 0 && (
          <span className="text-[11px] text-gray-400 font-mono">
            {data.length} updates • Latest: {data[data.length - 1].score}
          </span>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {data.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
            <span className="opacity-40">📈</span>
            <span>Convergence curve will appear here when algorithm finds improved colorings.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 25, bottom: 15, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis 
                dataKey="iteration" 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 10 }}
                label={{ value: 'Iteration', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 10 }}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 10 }}
                domain={['auto', 'auto']}
                label={{ value: 'WVCP Score', angle: -90, position: 'insideLeft', offset: 0, fill: '#64748b', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f0f26', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                itemStyle={{ color: '#00D4FF' }}
              />
              <Line 
                type="stepAfter" 
                dataKey="score" 
                stroke="#00D4FF" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#00D4FF', strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
