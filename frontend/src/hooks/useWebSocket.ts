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
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [activeAlgorithm, setActiveAlgorithm] = useState<string>('MCTS (dsatur)');
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

  const resetMetrics = useCallback((algo?: string) => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setComparisonResult(null);
    if (algo) setActiveAlgorithm(algo);
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
            if (typeof event.iteration === 'number' && !isNaN(event.iteration)) updated.iteration = event.iteration;
            if (typeof event.best_score === 'number' && !isNaN(event.best_score)) updated.bestScore = event.best_score;
            if (typeof event.score === 'number' && !isNaN(event.score)) updated.currentScore = event.score;
            if (typeof event.current_score === 'number' && !isNaN(event.current_score)) updated.currentScore = event.current_score;
            if (typeof event.nodes_explored === 'number' && !isNaN(event.nodes_explored)) updated.nodesExplored = event.nodes_explored;
            if (typeof event.states_explored === 'number' && !isNaN(event.states_explored)) updated.nodesExplored = event.states_explored;
            if (typeof event.nodes_pruned === 'number' && !isNaN(event.nodes_pruned)) updated.nodesPruned = event.nodes_pruned;
            if (typeof event.branches_pruned === 'number' && !isNaN(event.branches_pruned)) updated.nodesPruned = event.branches_pruned;
            if (typeof event.simulations === 'number' && !isNaN(event.simulations)) updated.simulations = event.simulations;
            if (typeof event.elapsed === 'number' && !isNaN(event.elapsed)) updated.elapsedTime = event.elapsed;
            break;

          case 'ITERATION_STARTED':
            if (typeof event.iteration === 'number' && !isNaN(event.iteration)) updated.iteration = event.iteration;
            break;

          case 'NODE_SELECTED':
          case 'NODE_EXPANDED':
            updated.nodesExplored++;
            break;

          case 'SIMULATION_COMPLETED':
            updated.simulations++;
            if (typeof event.score === 'number' && !isNaN(event.score)) updated.currentScore = event.score;
            break;

          case 'NODE_PRUNED':
          case 'BRANCH_PRUNED':
            updated.nodesPruned++;
            break;

          case 'COLOR_ASSIGNED':
            if (event.vertex !== undefined && event.color !== undefined) {
              setColoring(c => ({ ...c, [String(event.vertex)]: event.color! }));
            }
            if (typeof event.current_score === 'number' && !isNaN(event.current_score)) updated.currentScore = event.current_score;
            break;

          case 'NEW_BEST_SOLUTION':
          case 'BEST_SOLUTION_UPDATED':
            if (typeof event.score === 'number' && !isNaN(event.score)) {
              updated.bestScore = event.score;
              updated.currentScore = event.score;
              const iter = typeof event.iteration === 'number' ? event.iteration : prev.scoreHistory.length;
              // Add to score history for convergence chart
              updated.scoreHistory = [
                ...prev.scoreHistory,
                { iteration: iter, score: event.score }
              ];
            }
            if (typeof event.best_score === 'number' && !isNaN(event.best_score)) {
              updated.bestScore = event.best_score;
            }
            if (typeof event.num_colors === 'number' && !isNaN(event.num_colors)) {
              updated.numColors = event.num_colors;
            }
            if (event.coloring) {
              setColoring(event.coloring);
            }
            if (typeof event.nodes_explored === 'number' && !isNaN(event.nodes_explored)) updated.nodesExplored = event.nodes_explored;
            if (typeof event.states_explored === 'number' && !isNaN(event.states_explored)) updated.nodesExplored = event.states_explored;
            if (typeof event.simulations === 'number' && !isNaN(event.simulations)) updated.simulations = event.simulations;
            break;

          case 'SEARCH_COMPLETED':
            updated.status = event.is_optimal ? 'OPTIMAL' : 'COMPLETED';
            if (typeof event.iteration === 'number' && !isNaN(event.iteration)) updated.iteration = event.iteration;
            if (typeof event.best_score === 'number' && !isNaN(event.best_score)) updated.bestScore = event.best_score;
            if (typeof event.score === 'number' && !isNaN(event.score) && updated.bestScore === Infinity) updated.bestScore = event.score;
            if (typeof event.runtime === 'number' && !isNaN(event.runtime)) updated.elapsedTime = event.runtime;
            if (typeof event.nodes_explored === 'number' && !isNaN(event.nodes_explored)) updated.nodesExplored = event.nodes_explored;
            if (typeof event.states_explored === 'number' && !isNaN(event.states_explored)) updated.nodesExplored = event.states_explored;
            if (typeof event.nodes_pruned === 'number' && !isNaN(event.nodes_pruned)) updated.nodesPruned = event.nodes_pruned;
            if (typeof event.branches_pruned === 'number' && !isNaN(event.branches_pruned)) updated.nodesPruned = event.branches_pruned;
            if (typeof event.simulations === 'number' && !isNaN(event.simulations)) updated.simulations = event.simulations;
            if (typeof event.num_colors === 'number' && !isNaN(event.num_colors)) updated.numColors = event.num_colors;
            if (event.coloring && Object.keys(event.coloring).length > 0) setColoring(event.coloring);
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            break;

          case 'COMPARISON_COMPLETED':
            updated.status = 'COMPLETED';
            setIsRunning(false);
            if (event.data) {
              setComparisonResult(event.data);
            }
            if (timerRef.current) clearInterval(timerRef.current);
            break;

          case 'SEARCH_TIMEOUT':
            updated.status = 'TIMEOUT';
            if (typeof event.iteration === 'number' && !isNaN(event.iteration)) updated.iteration = event.iteration;
            if (typeof event.best_score === 'number' && !isNaN(event.best_score)) updated.bestScore = event.best_score;
            if (typeof event.nodes_explored === 'number' && !isNaN(event.nodes_explored)) updated.nodesExplored = event.nodes_explored;
            if (typeof event.nodes_pruned === 'number' && !isNaN(event.nodes_pruned)) updated.nodesPruned = event.nodes_pruned;
            if (typeof event.simulations === 'number' && !isNaN(event.simulations)) updated.simulations = event.simulations;
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

        if (event.algorithm) {
          setActiveAlgorithm(event.algorithm.toUpperCase());
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
    setColoring,
    activeAlgorithm,
    comparisonResult,
    resetMetrics,
    ws: solverWS,
  };
}
