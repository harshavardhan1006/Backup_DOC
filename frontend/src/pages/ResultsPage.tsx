import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Search, RefreshCw, BarChart3, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import type { ExperimentResult } from '../types';

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<ExperimentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await api.getResults();
      const list = Array.isArray(data) ? data : data.results || [];
      setResults(list);
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleClear = async () => {
    if (!confirm('Clear all stored experiment results?')) return;
    try {
      await api.clearResults();
      setResults([]);
    } catch (err) {
      console.error('Failed to clear results:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await api.exportCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wvcp_results_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV failed:', err);
    }
  };

  const handleExportJSON = async () => {
    try {
      const data = await api.exportJSON();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wvcp_results_${Date.now()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export JSON failed:', err);
    }
  };

  const filteredResults = results.filter((r) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.algorithm && r.algorithm.toLowerCase().includes(term)) ||
      (r.simulation_strategy && r.simulation_strategy.toLowerCase().includes(term)) ||
      (r.graph_id && String(r.graph_id).toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto flex flex-col bg-[#0b0b1e]/80 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 h-[calc(100vh-8rem)] w-full overflow-hidden shadow-2xl"
    >
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="text-cyan-400" /> Results History
          </h1>
          <p className="text-gray-400 text-sm">Empirical performance benchmarks and execution logs.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchResults}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
            title="Refresh results"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white flex items-center text-sm transition-colors disabled:opacity-40"
          >
            <Download size={15} className="mr-2 text-green-400" /> Export CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-xl bg-gray-800 border border-white/10 text-gray-300 hover:text-white flex items-center text-sm transition-colors disabled:opacity-40"
          >
            <Download size={15} className="mr-2 text-cyan-400" /> Export JSON
          </button>

          <button
            onClick={handleClear}
            disabled={results.length === 0}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center text-sm transition-colors disabled:opacity-40"
          >
            <Trash2 size={15} className="mr-2" /> Clear All
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by algorithm, strategy, or graph..."
            className="w-full bg-gray-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-900/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 outline-none focus:border-cyan-500"
        >
          <option value="all">All Statuses</option>
          <option value="optimal">Optimal</option>
          <option value="completed">Completed</option>
          <option value="timeout">Timeout</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-gray-900/40">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800/80 sticky top-0 backdrop-blur-md z-10 border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Graph / Size</th>
              <th className="px-5 py-3.5">Algorithm</th>
              <th className="px-5 py-3.5">Score</th>
              <th className="px-5 py-3.5">Colors</th>
              <th className="px-5 py-3.5">Runtime (s)</th>
              <th className="px-5 py-3.5">Explored</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredResults.map((r, i) => (
              <tr key={r.experiment_id || i} className="hover:bg-white/5 transition-colors">
                <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                  {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'Recent'}
                </td>
                <td className="px-5 py-3.5 font-mono text-xs">
                  {r.graph_size ? `${r.graph_size}V (${r.edge_count || 0}E)` : (r.graph_id || 'Instance')}
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium">
                    {r.algorithm.toUpperCase()} {r.simulation_strategy ? `(${r.simulation_strategy})` : ''}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-green-400 font-mono">
                  {typeof r.score === 'number' ? r.score : '—'}
                </td>
                <td className="px-5 py-3.5 font-mono text-purple-300">
                  {r.num_colors ?? '—'}
                </td>
                <td className="px-5 py-3.5 font-mono text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="opacity-50" />
                    {typeof r.runtime === 'number' ? r.runtime.toFixed(4) : r.runtime}s
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-gray-400">
                  {(r.nodes_explored ?? 0).toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs uppercase font-medium ${
                    r.status === 'OPTIMAL' || r.status === 'COMPLETED'
                      ? 'text-green-400 bg-green-500/10'
                      : r.status === 'TIMEOUT'
                      ? 'text-yellow-400 bg-yellow-500/10'
                      : 'text-red-400 bg-red-500/10'
                  }`}>
                    {r.status === 'OPTIMAL' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredResults.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 italic">
                  {results.length === 0 ? 'No experiment records found yet. Run an experiment or comparison in the Lab.' : 'No matching results found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ResultsPage;
