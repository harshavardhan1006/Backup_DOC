import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { GraphInfo, GraphStats, GraphData, GraphConfig, ImportResult } from '../types';

export function useGraph() {
  const [graphs, setGraphs] = useState<GraphInfo[]>([]);
  const [currentGraph, setCurrentGraph] = useState<GraphInfo | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const refreshGraphs = useCallback(async () => {
    try {
      const data = await api.listGraphs();
      setGraphs(data);
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
      setGraphStats(stats);
      setGraphData(vizData);
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
        setGraphData(null);
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
    loading,
    error,
    refreshGraphs,
    selectGraph,
    generateGraph,
    uploadGraph,
    deleteGraph,
  };
}
