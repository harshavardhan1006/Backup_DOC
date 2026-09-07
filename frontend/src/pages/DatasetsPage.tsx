import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, Trash2, Play, RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { GraphInfo } from '../types';

const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [graphs, setGraphs] = useState<GraphInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
        setNotification({ type: 'success', message: `Dataset "${file.name}" uploaded successfully!` });
        await fetchGraphs();
      } else {
        setNotification({ type: 'error', message: result?.errors?.join(', ') || 'Upload failed' });
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
      setGraphs(prev => prev.filter(g => g.id !== graphId));
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete graph' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12 w-full">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Database className="text-purple-400" /> Dataset Manager
          </h1>
          <p className="text-gray-400 text-sm">Manage benchmark graphs, preset instances, and upload datasets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGraphs}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
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
            className="px-5 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 flex items-center transition-all shadow-[0_0_15px_rgba(123,97,255,0.15)] font-medium text-sm disabled:opacity-50"
          >
            <Upload size={18} className="mr-2" />
            {uploading ? 'Uploading...' : 'Upload Dataset'}
          </button>
        </div>
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-xl border flex items-center gap-2 text-sm ${
            notification.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </motion.div>
      )}

      {graphs.length === 0 && !loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
          <FileText size={48} className="text-gray-500 mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-1">No Datasets Available</h3>
          <p className="text-gray-400 text-sm max-w-sm mb-4">
            Upload a CSV, JSON, or TXT edge-list format file, or generate a graph from the visualizer.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary text-sm"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {graphs.map((ds, idx) => (
            <motion.div 
              key={ds.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.5) }}
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-5 hover:border-purple-500/30 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 bg-gray-800/80 rounded-lg text-purple-400 shadow-[0_0_10px_rgba(123,97,255,0.2)]">
                    <Database size={20} />
                  </div>
                  {ds.source !== 'preset' && (
                    <button 
                      onClick={() => handleDelete(ds.id, ds.name)}
                      className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete graph"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <h3 className="text-white font-semibold mb-3 truncate" title={ds.name}>{ds.name}</h3>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div className="bg-gray-900/50 rounded-md p-2 border border-white/5">
                    <span className="block text-gray-500 text-xs mb-0.5">Vertices</span>
                    <span className="text-gray-200 font-mono">{ds.num_vertices}</span>
                  </div>
                  <div className="bg-gray-900/50 rounded-md p-2 border border-white/5">
                    <span className="block text-gray-500 text-xs mb-0.5">Edges</span>
                    <span className="text-gray-200 font-mono">{ds.num_edges}</span>
                  </div>
                  <div className="bg-gray-900/50 rounded-md p-2 border border-white/5">
                    <span className="block text-gray-500 text-xs mb-0.5">Density</span>
                    <span className="text-gray-200 font-mono">{typeof ds.density === 'number' ? ds.density.toFixed(3) : ds.density}</span>
                  </div>
                  <div className="bg-gray-900/50 rounded-md p-2 border border-white/5">
                    <span className="block text-gray-500 text-xs mb-0.5">Weights</span>
                    <span className="text-gray-200 font-mono text-xs">
                      {Array.isArray(ds.weight_range) ? `${ds.weight_range[0]} - ${ds.weight_range[1]}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                  {ds.source}
                </span>
                <button 
                  onClick={() => navigate('/visualization')}
                  className="text-xs bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 px-3 py-1.5 rounded-md flex items-center transition-colors border border-cyan-500/20 font-medium"
                >
                  <Play size={12} className="mr-1" /> Load in Lab
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DatasetsPage;
