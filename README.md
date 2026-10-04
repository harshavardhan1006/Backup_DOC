# WVCP VisualLab

**Interactive Visualization and Experimental Comparison of Exact vs MCTS Approaches for the Weighted Vertex Coloring Problem**

## Overview

WVCP VisualLab is an interactive algorithm laboratory that allows users to:

- **Visualize** the Weighted Vertex Coloring Problem (WVCP) being solved in real-time
- **Compare** Exact/Brute-Force search with Monte Carlo Tree Search (MCTS)
- **Experiment** with different MCTS simulation strategies (Random, Greedy, DSatur)
- **Analyze** execution time, solution quality, search effort, and scalability

## The WVCP Problem

Given a graph G = (V, E) where each vertex has a positive weight, find a valid coloring (adjacent vertices have different colors) that minimizes:

```
f(S) = Σ max(weight(v)) for each color class S
```

## Architecture

```
WVCP-VisualLab/
├── backend/           # Python FastAPI backend
│   ├── app/           # API, WebSocket, models, services
│   ├── algorithms/    # Exact solver & MCTS engine
│   ├── datasets/      # Graph import/generation
│   ├── experiments/   # Experiment runner & benchmarks
│   └── tests/         # Backend tests
├── frontend/          # React TypeScript frontend
│   └── src/           # Components, visualizations, hooks
├── datasets/          # Sample dataset files
├── results/           # Experiment results
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

The API will be available at `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features

### Algorithms

| Algorithm | Type | Description |
|-----------|------|-------------|
| Exact/Brute-Force | Exact | Branch-and-bound with pruning |
| MCTS + Random | Heuristic | MCTS with random simulation |
| MCTS + Greedy | Heuristic | MCTS with greedy simulation |
| MCTS + DSatur | Heuristic | MCTS with DSatur simulation |

### Visualization

- **Live graph coloring** — watch vertices being colored in real-time
- **MCTS tree growth** — see the search tree expand dynamically
- **Live metrics** — iteration counters, scores, and timing update continuously
- **Algorithm log** — terminal-style event log from actual algorithm execution
- **Score charts** — best score vs iterations plotted live

### Dataset Support

- Generate random graphs with configurable parameters
- Import graphs from CSV, JSON, TXT/edge-list formats
- Support for graphs up to ~1M vertices (with adaptive visualization)

### Experiments

- Single algorithm runs with full metrics
- Side-by-side comparison mode
- Scalability experiments across graph sizes
- Export results as CSV/JSON

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Dataset Formats](docs/DATASET_FORMATS.md)
- [Experiments Guide](docs/EXPERIMENTS.md)

## Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Flow, D3.js, Recharts, Framer Motion
- **Backend:** Python, FastAPI, WebSockets
- **Testing:** Pytest, Vitest

