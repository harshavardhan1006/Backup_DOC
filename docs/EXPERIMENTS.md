# WVCP VisualLab — Experiments Guide

## Overview

WVCP VisualLab provides three types of experiments:

1. **Single Run** — Run one algorithm on one graph
2. **Comparison** — Run multiple algorithms on the same graph
3. **Scalability** — Run algorithms across different graph sizes

## Single Run

### Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| Graph | Generated or imported graph | Required |
| Algorithm | `exact` or `mcts` | Required |
| Time Limit | Maximum execution time (seconds) | 60 |
| Iterations | MCTS iteration count | 1000 |
| Exploration Coefficient | UCT exploration parameter | 1.414 |
| Simulation Strategy | `random`, `greedy`, or `dsatur` | `random` |
| Random Seed | For reproducibility | 42 |

### Metrics Recorded

- Execution time
- Final WVCP score
- Number of colors used
- States/nodes explored
- Branches/nodes pruned
- Simulations completed (MCTS)
- Status (OPTIMAL/COMPLETED/TIMEOUT/STOPPED)

## Comparison Mode

Run the same graph instance through multiple algorithms:

| Configuration | Description |
|---------------|-------------|
| Same graph | Ensures fair comparison |
| Same weights | All algorithms use identical vertex weights |
| Same time limit | Equal computational budget |

### Comparison Metrics

- **Score** — WVCP objective value
- **Runtime** — Wall-clock execution time
- **Nodes Explored** — Search effort
- **Optimality Gap** — `(MCTS_Score - Exact_Score) / Exact_Score × 100` (when exact solution available)
- **Speedup** — `Exact_Runtime / MCTS_Runtime` (when both complete)

## Scalability Experiments

Test how algorithms scale with increasing graph size.

### Configuration

| Parameter | Description | Example |
|-----------|-------------|---------|
| Graph Sizes | List of vertex counts | [5, 10, 20, 50, 100] |
| Edge Probability | Graph density | 0.3 |
| Weight Range | Min and max vertex weight | 1-100 |
| Time Limit | Per-algorithm time limit | 30s |
| Iterations | MCTS iterations per run | 1000 |
| Repetitions | Number of runs per size | 1 |
| Seed | Random seed for reproducibility | 42 |

### Safety Limits

- Exact solver enforces time limits strictly
- MCTS respects iteration and time budgets
- Very large graphs (>1000 vertices) skip exact solver by default
- All results include status (OPTIMAL/COMPLETED/TIMEOUT)

### Charts Generated

1. **Execution Time vs Graph Size** — How runtime scales
2. **Solution Quality vs Graph Size** — WVCP scores across sizes
3. **Search Effort vs Graph Size** — Nodes explored
4. **MCTS Convergence** — Best score vs iterations

## Reproducibility

Every experiment records:
- Random seed
- Graph parameters (vertices, edges, weights, density)
- Algorithm configuration
- Exact timestamp
- Complete results

Use the same seed and parameters to reproduce any experiment.

## Export

Results can be exported as:
- **CSV** — For spreadsheet analysis
- **JSON** — For programmatic processing

Export includes all metrics for every experiment run.
