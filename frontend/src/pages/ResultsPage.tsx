import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Trash2,
  Search,
  RefreshCw,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
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

    const matchesStatus =
      statusFilter === 'all' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-12"
    >
      <div className="bg-[#0b0b1e]/90 border border-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
              <BarChart3 className="text-cyan-400" /> Results History
            </h1>
            <p className="text-slate-400 text-sm">
              Empirical performance benchmarks and solver execution records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchResults}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
              title="Refresh results"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={results.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 hover:text-white flex items-center text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Download size={15} className="mr-2 text-emerald-400" /> Export CSV
            </button>

            <button
              onClick={handleExportJSON}
              disabled={results.length === 0}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 hover:text-white flex items-center text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Download size={15} className="mr-2 text-cyan-400" /> Export JSON
            </button>

            <button
              onClick={handleClear}
              disabled={results.length === 0}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 hover:bg-red-500/20 flex items-center text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Trash2 size={15} className="mr-2" /> Clear All
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by algorithm, rollout strategy, or graph instance..."
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500 sm:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="optimal">Optimal</option>
            <option value="completed">Completed</option>
            <option value="timeout">Timeout</option>
          </select>
        </div>

        {/* Responsive Horizontally Scrollable Table (Natural Vertical Height) */}
        <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
          <table className="w-full min-w-[760px] text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/80 border-b border-white/10">
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
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                    {r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : 'Recent'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap">
                    {r.graph_size
                      ? `${r.graph_size.toLocaleString()}V (${(r.edge_count || 0).toLocaleString()}E)`
                      : r.graph_id || 'Instance'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium">
                      {r.algorithm.toUpperCase()}{' '}
                      {r.simulation_strategy ? `(${r.simulation_strategy})` : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-400 font-mono">
                    {typeof r.score === 'number' ? r.score.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-purple-300">
                    {r.num_colors ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-cyan-300 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="opacity-50" />
                      {typeof r.runtime === 'number' ? r.runtime.toFixed(4) : r.runtime}s
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                    {(r.nodes_explored ?? 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs uppercase font-medium ${
                        r.status === 'OPTIMAL' || r.status === 'COMPLETED'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : r.status === 'TIMEOUT'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-red-400 bg-red-500/10'
                      }`}
                    >
                      {r.status === 'OPTIMAL' ? (
                        <CheckCircle size={12} />
                      ) : (
                        <AlertTriangle size={12} />
                      )}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredResults.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-slate-400 italic">
                    {results.length === 0
                      ? 'No experiment records found yet. Run an experiment or solver comparison in the Lab.'
                      : 'No matching results found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultsPage;
