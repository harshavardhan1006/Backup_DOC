import React, { useEffect, useRef } from 'react';
import type { AlgorithmEvent } from '../types';

interface EventLogProps {
  events: AlgorithmEvent[];
  maxEvents?: number;
  onClear?: () => void;
}

export default function EventLog({ events, maxEvents = 250, onClear }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const displayEvents = events.slice(-maxEvents);
  const firstEventTime = events.length > 0 ? events[0].timestamp : 0;

  const formatTime = (ts: number) => {
    const msTs = ts < 1e11 ? ts * 1000 : ts;
    const firstMs = firstEventTime < 1e11 ? firstEventTime * 1000 : firstEventTime;
    const diff = Math.max(0, msTs - firstMs);
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const ms = Math.floor((diff % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getEventStyle = (type: string) => {
    switch (type) {
      case 'SEARCH_STARTED':
      case 'SEARCH_COMPLETED':
        return 'text-cyan-400 font-semibold';
      case 'NEW_BEST_SOLUTION':
      case 'BEST_SOLUTION_UPDATED':
        return 'text-emerald-400 font-semibold';
      case 'NODE_PRUNED':
      case 'BRANCH_PRUNED':
        return 'text-amber-400';
      case 'TIMEOUT':
        return 'text-orange-400 font-semibold';
      case 'ERROR':
        return 'text-red-400 font-bold';
      case 'SEARCH_PROGRESS':
        return 'text-slate-300';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="w-full h-full bg-[#070716] rounded-2xl border border-white/10 flex flex-col font-mono text-xs overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2.5 bg-white/[0.02] border-b border-white/10 flex-shrink-0">
        <span className="text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          Terminal Log ({events.length})
        </span>

        {onClear && (
          <button
            onClick={onClear}
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
          >
            Clear
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5 scroll-smooth"
      >
        {displayEvents.map((ev, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 hover:bg-white/[0.03] px-2 py-0.5 rounded transition-colors"
          >
            <span className="text-slate-500 shrink-0 font-mono text-[10px] select-none pt-0.5">
              [{formatTime(ev.timestamp)}]
            </span>

            <span className={`${getEventStyle(ev.type)} break-all leading-relaxed`}>
              {ev.message || `[${ev.type}] score=${ev.score ?? ev.best_score ?? ''}`}
            </span>
          </div>
        ))}

        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-12 text-center">
            <span className="text-2xl mb-1 opacity-30">⌨️</span>
            <span>Waiting for algorithm execution events...</span>
          </div>
        )}
      </div>
    </div>
  );
}