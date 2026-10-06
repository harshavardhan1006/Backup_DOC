import { useState, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { GraphInfo, GraphStats, GraphData, GraphConfig, ImportResult } from '../types';

export interface SampledVisualizationData {
  nodes: { id: number; weight: number; degree?: number; x?: number; y?: number }[];
  links: { source: number; target: number }[];
  type: 'full' | 'sampled' | 'summary';
  isSampled: boolean;
  totalVertices: number;
  displayedVertices: number;
  totalEdges: number;
  displayedEdges: number;
}

/**
 * Builds a deterministic, neighborhood-preserving representative subgraph
 * for visualization only. Does NOT modify the backend graph used by solvers.
 */
function buildRepresentativeSubgraph(
  rawGraph: GraphData | null,
  fallbackViz: any,
  sampleLimit: number
): SampledVisualizationData | null {
  if (!rawGraph && !fallbackViz) return null;

  // If full rawGraph is available from GET /api/graphs/{id}
  if (rawGraph && typeof rawGraph.num_vertices === 'number' && Array.isArray(rawGraph.weights)) {
    const n = rawGraph.num_vertices;
    const weights = rawGraph.weights;
    const edges = rawGraph.edges || [];
    const totalEdges = edges.length;

    if (n <= sampleLimit) {
      const nodes = [];
      for (let i = 0; i < n; i++) {
        nodes.push({
          id: i,
          weight: weights[i] ?? 1,
        });
      }
      const links = edges.map(([u, v]) => ({ source: u, target: v }));
      return {
        nodes,
        links,
        type: 'full',
        isSampled: false,
        totalVertices: n,
        displayedVertices: n,
        totalEdges,
        displayedEdges: links.length,
      };
    }

    // Large graph (> sampleLimit): select a connected representative sample
    // seeded by highest-weight vertices so WVCP weight structure & local adjacency are preserved.
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      if (u >= 0 && u < n && v >= 0 && v < n) {
        adj[u].push(v);
        adj[v].push(u);
      }
    }

    // Order candidate seeds by weight descending, then degree descending
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort((a, b) => {
      const dw = (weights[b] ?? 0) - (weights[a] ?? 0);
      if (dw !== 0) return dw;
      return adj[b].length - adj[a].length;
    });

    const sampledSet = new Set<number>();
    const queue: number[] = [];

    for (let sIdx = 0; sIdx < indices.length && sampledSet.size < sampleLimit; sIdx++) {
      const seed = indices[sIdx];
      if (sampledSet.has(seed)) continue;
      sampledSet.add(seed);
      queue.push(seed);

      // Expand local neighborhood around high-weight seed (bounded BFS)
      let qHead = 0;
      while (qHead < queue.length && sampledSet.size < sampleLimit) {
        const curr = queue[qHead++];
        const neighbors = adj[curr];
        // Limit branching per node so sample covers multiple neighborhoods
        const branchCap = Math.min(neighbors.length, 8);
        for (let j = 0; j < branchCap && sampledSet.size < sampleLimit; j++) {
          const nb = neighbors[j];
          if (!sampledSet.has(nb)) {
            sampledSet.add(nb);
            queue.push(nb);
          }
        }
      }
    }

    const sampledArray = Array.from(sampledSet);
    const nodes = sampledArray.map((vid, idx) => {
      const angle = (2 * Math.PI * idx) / sampledArray.length;
      const radius = 120 + Math.min(sampledArray.length * 1.5, 300);
      return {
        id: vid,
        weight: weights[vid] ?? 1,
        degree: adj[vid].length,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });

    const links: { source: number; target: number }[] = [];
    for (let i = 0; i < edges.length; i++) {
      const [u, v] = edges[i];
      if (sampledSet.has(u) && sampledSet.has(v)) {
        links.push({ source: u, target: v });
      }
    }

    return {
      nodes,
      links,
      type: 'sampled',
      isSampled: true,
      totalVertices: n,
      displayedVertices: nodes.length,
      totalEdges,
      displayedEdges: links.length,
    };
  }

  // Fallback if only vizData was returned
  if (fallbackViz && Array.isArray(fallbackViz.nodes)) {
    const n = fallbackViz.nodes.length;
    const links = fallbackViz.links || [];
    return {
      nodes: fallbackViz.nodes,
      links,
      type: fallbackViz.type || 'full',
      isSampled: fallbackViz.type === 'sampled',
      totalVertices: n,
      displayedVertices: n,
      totalEdges: links.length,
      displayedEdges: links.length,
    };
  }

  return null;
}

export function useGraph() {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);
  const [currentGraph, setCurrentGraph] = useState<GraphInfo | null>(null);
  const [rawGraph, setRawGraph] = useState<GraphData | null>(null);
  const [fallbackVizData, setFallbackVizData] = useState<any>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [sampleLimit, setSampleLimit] = useState<number>(250);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphData = useMemo(
    () => buildRepresentativeSubgraph(rawGraph, fallbackVizData, sampleLimit),
    [rawGraph, fallbackVizData, sampleLimit]
  );

  const refreshGraphs = useCallback(async () => {
    try {
      const data = await api.listGraphs();
      setGraphs(Array.isArray(data) ? data : data.graphs || []);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const selectGraph = useCallback(async (graphId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [info, stats, vizData] = await Promise.all([
        api.getGraph(graphId),
        api.getGraphStats(graphId),
        api.getVisualization(graphId),
      ]);
      setCurrentGraph(info.info || info);
      setRawGraph(info.graph || null);
      setGraphStats(info.stats || stats);
      setFallbackVizData(vizData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateGraph = useCallback(async (config: GraphConfig) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateGraph(config);
      if (result.graph_id) {
        await refreshGraphs();
        await selectGraph(result.graph_id);
      }
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshGraphs, selectGraph]);

  const uploadGraph = useCallback(async (file: File): Promise<ImportResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadGraph(file);
      if (result.graph_id) {
        await refreshGraphs();
        await selectGraph(result.graph_id);
      }
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshGraphs, selectGraph]);

  const deleteGraph = useCallback(async (graphId: string) => {
    try {
      await api.deleteGraph(graphId);
      await refreshGraphs();
      if (currentGraph?.id === graphId) {
        setCurrentGraph(null);
        setRawGraph(null);
        setFallbackVizData(null);
        setGraphStats(null);
      }
    } catch (e: any) {
      setError(e.message);
    }
  }, [currentGraph, refreshGraphs]);

  return {
    graphs,
    currentGraph,
    graphData,
    graphStats,
    sampleLimit,
    setSampleLimit,
    loading,
    error,
    refreshGraphs,
    selectGraph,
    generateGraph,
    uploadGraph,
    deleteGraph,
  };
}
