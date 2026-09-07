import { useState, useEffect, useCallback, useRef } from 'react';
import { solverWS } from '../services/websocket';
import type { AlgorithmEvent, LiveMetrics, SolverStatus } from '../types';

export function useWebSocket() {
  const [connected, setConnected] = useState(solverWS.isConnected);
  const [events, setEvents] = useState<AlgorithmEvent[]>([]);
  const [metrics, setMetrics] = useState<LiveMetrics>({
    iteration: 0,
    bestScore: Infinity,
    currentScore: Infinity,
    nodesCreated: 0,
    nodesExplored: 0,
    nodesPruned: 0,
    simulations: 0,
    elapsedTime: 0,
    numColors: 0,
    status: 'STOPPED' as SolverStatus,
    scoreHistory: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [coloring, setColoring] = useState<Record<string, number>>({});
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback(async () => {
    try {
      await solverWS.connect();
      setConnected(true);
    } catch (e) {
      console.warn('WebSocket connect attempted:', e);
      setConnected(solverWS.isConnected);
    }
  }, []);

  const resetMetrics = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setMetrics({
      iteration: 0,
      bestScore: Infinity,
      currentScore: Infinity,
      nodesCreated: 0,
      nodesExplored: 0,
      nodesPruned: 0,
      simulations: 0,
      elapsedTime: 0,
      numColors: 0,
      status: 'RUNNING',
      scoreHistory: [],
    });
    setEvents([]);
    setColoring({});

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setMetrics(m => ({
        ...m,
        elapsedTime: Math.max(0.01, (Date.now() - startTimeRef.current) / 1000)
      }));
    }, 100);
  }, []);

  useEffect(() => {
    const unsubEvent = solverWS.onEvent((event: AlgorithmEvent) => {
      setEvents(prev => [...prev.slice(-300), event]);

      setMetrics(prev => {
        const updated = { ...prev };

        switch (event.type) {
          case 'SEARCH_STARTED':
            startTimeRef.current = Date.now();
            updated.status = 'RUNNING';
            setIsRunning(true);
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setMetrics(m => ({
                ...m,
                elapsedTime: Math.max(0.01, (Date.now() - startTimeRef.current) / 1000)
              }));
            }, 100);
            break;

          case 'SEARCH_PROGRESS':
            if (event.iteration !== undefined && event.iteration !== null) updated.iteration = event.iteration;
            if (event.best_score !== undefined && event.best_score !== null) updated.bestScore = event.best_score;
            if (event.score !== undefined && event.score !== null) updated.currentScore = event.score;
            if (event.nodes_explored !== undefined) updated.nodesExplored = event.nodes_explored;
            if (event.nodes_pruned !== undefined) updated.nodesPruned = event.nodes_pruned;
            if (event.states_explored !== undefined) updated.nodesExplored = event.states_explored;
            if (event.branches_pruned !== undefined) updated.nodesPruned = event.branches_pruned;
            if (event.simulations !== undefined) updated.simulations = event.simulations;
            if (event.elapsed !== undefined && event.elapsed !== null) updated.elapsedTime = event.elapsed;
            break;

          case 'ITERATION_STARTED':
            if (event.iteration !== undefined) updated.iteration = event.iteration;
            break;

          case 'NODE_SELECTED':
          case 'NODE_EXPANDED':
            updated.nodesExplored++;
            break;

          case 'SIMULATION_COMPLETED':
            updated.simulations++;
            if (event.score !== undefined) updated.currentScore = event.score;
            break;

          case 'NODE_PRUNED':
          case 'BRANCH_PRUNED':
            updated.nodesPruned++;
            break;

          case 'COLOR_ASSIGNED':
            if (event.vertex !== undefined && event.color !== undefined) {
              setColoring(c => ({ ...c, [String(event.vertex)]: event.color! }));
            }
            if (event.current_score !== undefined) updated.currentScore = event.current_score;
            break;

          case 'NEW_BEST_SOLUTION':
          case 'BEST_SOLUTION_UPDATED':
            if (event.score !== undefined && event.score !== null) {
              updated.bestScore = event.score;
              updated.currentScore = event.score;
              const iter = event.iteration ?? prev.iteration;
              // Add to score history for convergence chart
              updated.scoreHistory = [
                ...prev.scoreHistory,
                { iteration: iter, score: event.score }
              ];
            }
            if (event.best_score !== undefined && event.best_score !== null) {
              updated.bestScore = event.best_score;
            }
            if (event.num_colors !== undefined && event.num_colors !== null) {
              updated.numColors = event.num_colors;
            }
            if (event.coloring) {
              setColoring(event.coloring);
            }
            if (event.nodes_explored !== undefined) updated.nodesExplored = event.nodes_explored;
            if (event.simulations !== undefined) updated.simulations = event.simulations;
            break;

          case 'SEARCH_COMPLETED':
            updated.status = event.is_optimal ? 'OPTIMAL' : 'COMPLETED';
            if (event.best_score !== undefined && event.best_score !== null) updated.bestScore = event.best_score;
            if (event.score !== undefined && event.score !== null && updated.bestScore === Infinity) updated.bestScore = event.score;
            if (event.runtime !== undefined && event.runtime !== null) updated.elapsedTime = event.runtime;
            if (event.nodes_explored !== undefined) updated.nodesExplored = event.nodes_explored;
            if (event.states_explored !== undefined) updated.nodesExplored = event.states_explored;
            if (event.num_colors !== undefined) updated.numColors = event.num_colors;
            if (event.coloring) setColoring(event.coloring);
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            break;

          case 'SEARCH_TIMEOUT':
            updated.status = 'TIMEOUT';
            if (event.runtime !== undefined) updated.elapsedTime = event.runtime;
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            break;

          case 'ERROR':
            updated.status = 'ERROR';
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            break;
        }

        return updated;
      });
    });

    const unsubStatus = solverWS.onStatus((status) => {
      setConnected(status === 'connected');
    });

    return () => {
      unsubEvent();
      unsubStatus();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    connected,
    connect,
    events,
    metrics,
    isRunning,
    coloring,
    resetMetrics,
    ws: solverWS,
  };
}
