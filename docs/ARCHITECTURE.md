# WVCP VisualLab Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    WVCP VisualLab                        │
├───────────────────────┬─────────────────────────────────┤
│       Frontend        │            Backend              │
│                       │                                 │
│  React + TypeScript   │    Python + FastAPI             │
│  Vite + Tailwind      │                                 │
│  React Flow + D3      │    ┌──────────┐                │
│  Recharts             │    │   API    │                 │
│  Framer Motion        │    │ Routes   │                 │
│                       │    └────┬─────┘                 │
│  ┌─────────────┐      │         │                       │
│  │ WebSocket   │◄─────┼────►┌───┴──────┐               │
│  │  Client     │      │    │ WebSocket │               │
│  └─────────────┘      │    │  Handler  │               │
│                       │    └───┬───────┘               │
│                       │        │                        │
│                       │    ┌───┴──────┐                │
│                       │    │ Services │                 │
│                       │    │          │                 │
│                       │    │ • Graph  │                 │
│                       │    │ • Solver │                 │
│                       │    │ • Exper. │                 │
│                       │    └───┬──────┘                │
│                       │        │                        │
│                       │    ┌───┴──────────────┐        │
│                       │    │   Algorithms     │        │
│                       │    │                  │        │
│                       │    │ ┌──────┐ ┌────┐ │        │
│                       │    │ │Exact │ │MCTS│ │        │
│                       │    │ └──────┘ └─┬──┘ │        │
│                       │    │        ┌───┼──┐ │        │
│                       │    │        R   G  D │        │
│                       │    └────────────────┘│        │
│                       │                                 │
│                       │    ┌──────────────┐             │
│                       │    │  Datasets    │             │
│                       │    │  Importer    │             │
│                       │    │  Generator   │             │
│                       │    └──────────────┘             │
└───────────────────────┴─────────────────────────────────┘
```

## Data Flow

### Algorithm Execution Flow

1. User configures graph and algorithm parameters in the frontend
2. Frontend sends command via WebSocket (or REST API)
3. Backend receives command, retrieves graph from GraphService
4. SolverService starts the algorithm in a background thread
5. Algorithm produces real-time events via callback
6. Events are forwarded through WebSocket to frontend
7. Frontend updates visualizations in real-time

### Event Pipeline

```
Algorithm Thread          Event Queue          WebSocket Handler          Frontend
     │                        │                       │                      │
     ├─── event_callback ───► │                       │                      │
     │                        ├──── async forward ──► │                      │
     │                        │                       ├──── send_json ─────► │
     │                        │                       │                      ├── update UI
     │                        │                       │                      │
```

### Graph Import Flow

```
File Upload ──► Format Detection ──► Parser ──► Validation ──► Graph Object ──► GraphService
                                                    │
                                                    └── Errors/Warnings ──► User Feedback
```

## Component Details

### Backend Components

| Component | Purpose |
|-----------|---------|
| `app/main.py` | FastAPI application entry point |
| `app/api/` | REST API route handlers |
| `app/websocket/` | WebSocket connection management |
| `app/models/` | Pydantic data models |
| `app/services/` | Business logic services |
| `app/core/` | Configuration and utilities |
| `algorithms/wvcp.py` | Centralized WVCP objective function |
| `algorithms/exact/` | Branch-and-bound exact solver |
| `algorithms/mcts/` | MCTS engine with strategies |
| `datasets/` | Graph import/generation |
| `experiments/` | Experiment runner and benchmarks |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Application root with routing |
| `pages/` | Page-level components |
| `components/` | Reusable UI components |
| `visualizations/` | Graph, MCTS tree, chart visualizations |
| `hooks/` | Custom React hooks (WebSocket, state) |
| `services/` | API client and WebSocket service |
| `types/` | TypeScript type definitions |

## Scalability Design

### Three-Tier Approach

1. **Dataset Ingestion** — Streaming parsers, compact data structures
2. **Graph Visualization** — Adaptive rendering (detailed → aggregated → overview)
3. **Graph Optimization** — Configurable computational budgets

### Large Graph Handling

- Graphs up to ~1M vertices can be ingested
- Visualization adapts to graph size automatically
- Algorithms have configurable time/iteration limits
- WebSocket events are throttled and batched for large instances
