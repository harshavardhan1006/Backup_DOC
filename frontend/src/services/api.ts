const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Health
  health: () => fetch(`${API_BASE}/health`).then(r => r.json()),
  
  // Graphs
  listGraphs: () => fetch(`${API_BASE}/graphs/`).then(r => r.json()),
  getGraph: (id: string) => fetch(`${API_BASE}/graphs/${id}`).then(r => r.json()),
  getGraphStats: (id: string) => fetch(`${API_BASE}/graphs/${id}/stats`).then(r => r.json()),
  getBudget: (id: string, strategy: string = 'dsatur') =>
    fetch(`${API_BASE}/graphs/${id}/budget?strategy=${strategy}`).then(r => r.json()),
  getVisualization: (id: string) => fetch(`${API_BASE}/graphs/${id}/visualization`).then(r => r.json()),
  deleteGraph: (id: string) => fetch(`${API_BASE}/graphs/${id}`, { method: 'DELETE' }).then(r => r.json()),
  
  // Generate
  generateGraph: (config: any) => fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json()),
  
  // Upload
  uploadGraph: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/graphs/upload`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },
  
  importGraph: (content: string, filename: string) => fetch(`${API_BASE}/graphs/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename }),
  }).then(r => r.json()),
  
  // Presets
  getPresets: () => fetch(`${API_BASE}/presets`).then(r => r.json()),
  
  // Algorithms
  getAlgorithms: () => fetch(`${API_BASE}/algorithms`).then(r => r.json()),
  
  // Experiments
  runExperiment: (config: any) => fetch(`${API_BASE}/experiments/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json()),
  
  runComparison: (config: any) => fetch(`${API_BASE}/experiments/comparison`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json()),
  
  runScalability: (config: any) => fetch(`${API_BASE}/experiments/scalability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  }).then(r => r.json()),
  
  getResults: () => fetch(`${API_BASE}/experiments/results`).then(r => r.json()),
  clearResults: () => fetch(`${API_BASE}/experiments/results`, { method: 'DELETE' }).then(r => r.json()),
  exportCSV: () => fetch(`${API_BASE}/experiments/export/csv`).then(r => r.blob()),
  exportJSON: () => fetch(`${API_BASE}/experiments/export/json`).then(r => r.json()),
};
