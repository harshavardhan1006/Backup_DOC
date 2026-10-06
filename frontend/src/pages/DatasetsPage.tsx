import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Upload,
  Trash2,
  Play,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  FileText,
  Layers,
  Cpu,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { GraphInfo } from '../types';

const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [graphs, setGraphs] = useState<GraphInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchGraphs = async () => {
    setLoading(true);
    try {
      const data = await api.listGraphs();
      const list = Array.isArray(data) ? data : data.graphs || [];
      setGraphs(list);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load datasets' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotification(null);
    try {
      const result = await api.uploadGraph(file);
      if (result && result.status === 'success') {
        const statsText = result.stats
          ? ` (${result.stats.vertices?.toLocaleString() ?? ''}V, ${result.stats.edges?.toLocaleString() ?? ''}E)`
          : '';
        setNotification({
          type: 'success',
          message: `Dataset "${file.name}" imported${statsText}.`,
        });
        await fetchGraphs();
      } else {
        setNotification({
          type: 'error',
          message: result?.errors?.join(', ') || 'Upload failed',
        });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error uploading file' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (graphId: string, name: string) => {
    if (!confirm(`Delete dataset "${name}"?`)) return;
    try {
      await api.deleteGraph(graphId);
      setNotification({ type: 'success', message: `Deleted "${name}"` });
      setGraphs((prev) => prev.filter((g) => g.id !== graphId));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete graph' });
    }
  };

  const researchDatasets = graphs.filter((g) => g.source !== 'preset' || g.num_vertices > 30);
  const demoPresets = graphs.filter((g) => g.source === 'preset' && g.num_vertices <= 30);

  const renderDatasetCard = (ds: GraphInfo, idx: number, isPreset: boolean) => {
    const avgDeg =
      ds.num_vertices > 0 ? ((2 * ds.num_edges) / ds.num_vertices).toFixed(2) : '0.00';

    return (
      <div
        key={ds.id || idx}
        className="bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/35 transition-all group flex flex-col justify-between gap-4 shadow-lg"
      >
        <div>
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="min-w-0">
              <span
                className={`inline-block text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-lg border mb-2 ${
                  isPreset
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25'
                    : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                }`}
              >
                {isPreset ? 'Demo Preset' : ds.source || 'Research Dataset'}
              </span>
              <h3 className="text-white font-semibold text-base truncate" title={ds.name}>
                {ds.name}
              </h3>
            </div>

            {ds.source !== 'preset' && (
              <button
                onClick={() => handleDelete(ds.id, ds.name)}
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                title="Delete dataset"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="bg-black/35 rounded-xl p-3 border border-white/5">
              <span className="block text-slate-400 text-[11px] font-sans mb-1">Vertices</span>
              <span className="text-white font-semibold text-sm">
                {ds.num_vertices.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/35 rounded-xl p-3 border border-white/5">
              <span className="block text-slate-400 text-[11px] font-sans mb-1">Edges</span>
              <span className="text-white font-semibold text-sm">
                {ds.num_edges.toLocaleString()}
              </span>
            </div>
            <div className="bg-black/35 rounded-xl p-3 border border-white/5">
              <span className="block text-slate-400 text-[11px] font-sans mb-1">
                Density / Avg Deg
              </span>
              <span className="text-slate-200">
                {typeof ds.density === 'number' ? ds.density.toFixed(4) : ds.density} ({avgDeg})
              </span>
            </div>
            <div className="bg-black/35 rounded-xl p-3 border border-white/5">
              <span className="block text-slate-400 text-[11px] font-sans mb-1">
                Weight Range
              </span>
              <span className="text-slate-200">
                {Array.isArray(ds.weight_range)
                  ? `${ds.weight_range[0]}–${ds.weight_range[1]}`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-white/5">
          <span className="text-xs font-mono text-slate-400">
            {ds.num_vertices > 250 ? 'Sampled Viz + Full Solver' : 'Full Interactive Viz'}
          </span>
          <button
            onClick={() => navigate(`/visualization?graph=${encodeURIComponent(ds.id)}`)}
            className="text-xs bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-cyan-500/30 font-semibold"
          >
            <Play size={13} /> Load in Lab
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-12 w-full">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0b0b1e]/90 border border-white/10 rounded-2xl p-6 shadow-lg">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-1.5 flex items-center gap-2.5">
            <Database size={22} className="text-purple-400" /> Dataset Catalog &amp; Importer
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Manage small demonstration graphs for exact baseline verification alongside larger
            research datasets for MCTS scalability studies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchGraphs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
            title="Refresh catalog"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary text-xs py-2.5 px-4"
          >
            <Upload size={15} />
            <span>{uploading ? 'Importing Dataset...' : 'Import Dataset (.CSV / .JSON / .TXT)'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-mono ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {/* Section 1: Research / Imported & Generated Datasets */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Research / Imported &amp; Generated Datasets ({researchDatasets.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Benchmark &amp; scalability evaluation instances
          </span>
        </div>

        {researchDatasets.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0b0b1e]/60 border border-dashed border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <FileText size={28} className="text-slate-500 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  No Custom or Large Research Datasets Loaded Yet
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Import a benchmark file (CSV two-section, JSON, or TXT edge-list) or generate a
                  large instance in the Visualization Lab.
                </p>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn text-xs py-2.5 px-4 bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 shrink-0"
            >
              <Upload size={14} /> Import File
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {researchDatasets.map((ds, idx) => renderDatasetCard(ds, idx, false))}
          </div>
        )}
      </div>

      {/* Section 2: Demo / Small Graphs */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              Demo / Small Presets ({demoPresets.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Interactive graph visualization &amp; Exact Branch-and-Bound verification
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {demoPresets.map((ds, idx) => renderDatasetCard(ds, idx, true))}
        </div>
      </div>
    </div>
  );
};

export default DatasetsPage;
