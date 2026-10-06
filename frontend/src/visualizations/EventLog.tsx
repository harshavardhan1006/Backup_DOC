import React, { useEffect, useRef, useState } from 'react';
import type { AlgorithmEvent } from '../types';

interface EventLogProps {
  events: AlgorithmEvent[];
  maxEvents?: number;
  onClear?: () => void;
}

export default function EventLog({ events, maxEvents = 250, onClear }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 28;
    setAutoScroll(atBottom);
  };

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

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'SEARCH_STARTED':
        return { tag: 'START', badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', text: 'text-cyan-300 font-semibold' };
      case 'SEARCH_COMPLETED':
      case 'COMPARISON_COMPLETED':
        return { tag: 'DONE', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', text: 'text-emerald-300 font-semibold' };
      case 'NEW_BEST_SOLUTION':
      case 'BEST_SOLUTION_UPDATED':
        return { tag: 'BEST', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'text-emerald-300 font-semibold' };
      case 'NODE_PRUNED':
      case 'BRANCH_PRUNED':
        return { tag: 'PRUNE', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30', text: 'text-amber-200' };
      case 'SEARCH_TIMEOUT':
      case 'TIMEOUT':
        return { tag: 'LIMIT', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30', text: 'text-orange-300 font-semibold' };
      case 'ERROR':
        return { tag: 'ERROR', badge: 'bg-red-500/20 text-red-300 border-red-500/40', text: 'text-red-300 font-bold' };
      case 'SEARCH_PROGRESS':
        return { tag: 'PROG', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/25', text: 'text-slate-300' };
      default:
        return { tag: 'STEP', badge: 'bg-white/5 text-slate-400 border-white/10', text: 'text-slate-400' };
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] bg-[#0b0b1e]/95 rounded-2xl border border-white/10 flex flex-col font-mono text-xs overflow-hidden shadow-xl">
      <div className="flex justify-between items-center px-5 py-3.5 bg-white/[0.02] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span className="text-slate-200 text-xs font-semibold uppercase tracking-wider">
            Execution Log
          </span>
          <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 tabular-nums">
            {events.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!autoScroll && events.length > 0 && (
            <button
              onClick={() => setAutoScroll(true)}
              className="text-[11px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              Follow
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-[11px] text-slate-400 hover:text-white transition-colors px-2.5 py-0.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-1.5"
      >
        {displayEvents.map((ev, i) => {
          const meta = getEventBadge(ev.type);
          return (
            <div
              key={i}
              className="flex items-start gap-2.5 hover:bg-white/[0.03] px-2.5 py-1.5 rounded-lg transition-colors text-xs"
            >
              <span className="text-slate-500 shrink-0 tabular-nums select-none">
                {formatTime(ev.timestamp)}
              </span>

              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 font-semibold tracking-wider select-none ${meta.badge}`}
              >
                {meta.tag}
              </span>

              <span className={`${meta.text} break-words leading-relaxed min-w-0 flex-1`}>
                {ev.message || `[${ev.type}] score=${ev.score ?? ev.best_score ?? '—'}`}
              </span>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 px-6 text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Event Stream Idle
            </div>
            <div className="text-xs text-slate-500 leading-relaxed max-w-md">
              Real-time solver telemetry, branch pruning events, and best-score updates will stream here during execution.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}