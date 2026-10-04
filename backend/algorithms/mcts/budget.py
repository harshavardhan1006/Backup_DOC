"""
MCTS Auto-Budget Calibration
============================
Estimates the actual computational cost of one MCTS iteration on a given graph
by timing a burst of simulations, then computes an appropriate computation
budget (iterations + time_limit) based on both graph complexity (V, E, density)
and measured iteration throughput.

- Small graphs (e.g., 5–30 vertices): chooses a compact iteration budget
  (150–400 iterations) that finishes quickly (< 0.1s) without waiting for a
  large fixed timer.
- Medium graphs (31–500 vertices): scales iterations with V, E, and density,
  bounded by a modest target runtime (1–8s).
- Large graphs (e.g., 10K vertices): allocates a larger computation budget
  calibrated to actual measured throughput so MCTS genuinely searches the space
  and stops cleanly upon completing the allocated iterations.
"""

import time
from typing import Dict
from app.models.graph import Graph
from algorithms.mcts.state import WVCPState
from algorithms.mcts.simulation import simulate


def calibrate_mcts_budget(graph: Graph, strategy: str = 'dsatur') -> Dict:
    """
    Run a brief calibration phase to measure actual MCTS simulation speed on
    `graph`, then compute an appropriate auto-selected budget.

    Returns a dict:
    {
        "num_vertices":        int,
        "num_edges":           int,
        "density":             float,
        "iterations":          int,    # auto-selected iteration count
        "time_limit":          float,  # safety time limit in seconds
        "estimated_runtime_s": float,  # expected wall-clock time in seconds
        "iters_per_sec":       float,  # measured throughput
        "target_seconds":      float,  # target compute window
    }
    """
    V = max(1, graph.num_vertices)
    E = graph.num_edges()
    density = round(graph.density(), 4)
    strat = (strategy or 'dsatur').lower()

    initial_state = WVCPState(graph)

    # Number of calibration trials adapts to graph size so calibration itself is fast (< 0.15s)
    warmup_runs = 1
    timed_trials = 10 if V <= 200 else (5 if V <= 2000 else 3)

    # --- Warm-up (discarded) ---
    for _ in range(warmup_runs):
        try:
            simulate(initial_state, strat)
        except Exception:
            pass

    # --- Timed trials ---
    elapsed_total = 0.0
    successful = 0
    for _ in range(timed_trials):
        t0 = time.perf_counter()
        try:
            simulate(initial_state, strat)
            elapsed_total += time.perf_counter() - t0
            successful += 1
        except Exception:
            pass

    if successful == 0 or elapsed_total <= 0.0:
        secs_per_iter = 0.001
    else:
        # Include ~12% overhead factor for selection, expansion, backpropagation, and event checks
        secs_per_iter = (elapsed_total / successful) * 1.12

    iters_per_sec = 1.0 / max(secs_per_iter, 1e-6)

    # --- Complexity-driven budget selection ---
    if V <= 30:
        # Small graphs: complexity-based iteration count that finishes immediately
        raw_iters = 100 + 8 * V + int(2.0 * E)
        iterations = max(150, min(500, int(round(raw_iters / 25.0) * 25)))
        estimated_runtime_s = iterations * secs_per_iter
        target_seconds = max(0.05, estimated_runtime_s)
        time_limit = max(10.0, round(estimated_runtime_s * 5.0 + 10.0, 1))
    elif V <= 500:
        # Medium graphs: scale desired iterations with V and E, capped by a reasonable target time
        desired_iters = int(250 + 3.5 * V + 0.25 * E)
        target_seconds = min(12.0, max(1.0, 0.5 + 0.015 * V + 0.0005 * E))
        affordable_iters = int(iters_per_sec * target_seconds)
        raw_iters = min(desired_iters, max(200, affordable_iters))
        iterations = max(200, int(round(raw_iters / 50.0) * 50))
        estimated_runtime_s = iterations * secs_per_iter
        time_limit = max(15.0, round(estimated_runtime_s * 3.0 + 10.0, 1))
    else:
        # Large graphs (e.g., 1K to 50K+ vertices):
        # Allocate a substantial compute window scaled by V and E, calibrated to real throughput
        target_seconds = min(30.0, max(8.0, 6.0 + 0.0008 * V + 0.00015 * E))
        raw_iters = iters_per_sec * target_seconds
        # Clamp to a practical range [500, 3000] and round to nearest 50
        iterations = max(500, min(3000, int(round(raw_iters / 50.0) * 50)))
        estimated_runtime_s = iterations * secs_per_iter
        # Generous safety ceiling so the run completes its allocated iterations without premature timeout
        time_limit = max(30.0, round(estimated_runtime_s * 2.5 + 15.0, 1))

    return {
        "num_vertices": V,
        "num_edges": E,
        "density": density,
        "iterations": int(iterations),
        "time_limit": float(time_limit),
        "estimated_runtime_s": round(max(0.01, estimated_runtime_s), 2),
        "iters_per_sec": round(iters_per_sec, 1),
        "target_seconds": round(target_seconds, 2),
    }
