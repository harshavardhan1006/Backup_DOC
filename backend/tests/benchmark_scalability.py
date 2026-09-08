"""
Benchmark & Regression Test for MCTS Scalability Optimization (Phase 1 + 2).
Run from backend/ with: python -m tests.benchmark_scalability
"""
import time
import tracemalloc
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets.generator import generate_large_graph
from datasets.presets import get_preset_graphs
from algorithms.mcts.mcts import solve_mcts
from algorithms.wvcp import wvcp_score, is_valid_coloring
from app.models.solution import Coloring


def deterministic_regression(label="REGRESSION"):
    """Run MCTS on preset graphs with fixed seed and record exact outputs."""
    print(f"\n{'='*60}")
    print(f"{label}: Deterministic Regression (seed=42)")
    print(f"{'='*60}")

    presets = get_preset_graphs()
    results = {}

    for name in ['small', 'medium', 'dense', 'larger']:
        graph = presets[name]
        r = solve_mcts(
            graph,
            iterations=150,
            time_limit=10,
            exploration=1.414,
            strategy='dsatur',
            seed=42,
        )
        # Validate
        coloring = Coloring(graph.num_vertices)
        for v_str, c in r.best_coloring.items():
            coloring.assign(int(v_str), c)
        valid = is_valid_coloring(graph, coloring)
        recomputed_score = wvcp_score(graph, coloring)

        entry = {
            'best_score': r.best_score,
            'num_colors': r.num_colors,
            'iterations': r.iterations,
            'simulations': r.simulations,
            'nodes_explored': r.nodes_explored,
            'status': r.status,
            'coloring_valid': valid,
            'recomputed_score': recomputed_score,
            'score_matches': abs(r.best_score - recomputed_score) < 1e-6,
            'best_coloring': r.best_coloring,
            'score_history': r.score_history,
        }
        results[name] = entry
        print(f"  {name:>8}: score={r.best_score:.1f}  colors={r.num_colors}  "
              f"iters={r.iterations}  sims={r.simulations}  "
              f"explored={r.nodes_explored}  valid={valid}  "
              f"score_match={entry['score_matches']}")

    return results


def run_benchmark(label, num_vertices, num_edges_approx, seed=42):
    """Run MCTS benchmark on a generated graph."""
    edge_prob = (2 * num_edges_approx) / (num_vertices * (num_vertices - 1))

    print(f"\n{'='*60}")
    print(f"Benchmark: {label} ({num_vertices} vertices, ~{num_edges_approx} edges)")
    print(f"{'='*60}")

    # Generate graph
    t0 = time.time()
    graph = generate_large_graph(num_vertices, edge_probability=edge_prob, seed=seed)
    gen_time = time.time() - t0
    actual_edges = graph.num_edges()
    print(f"  Graph generated in {gen_time:.2f}s: {num_vertices}V / {actual_edges}E")

    # Run MCTS with memory tracking
    tracemalloc.start()
    t1 = time.time()

    result = solve_mcts(
        graph,
        iterations=500,
        time_limit=300,
        exploration=1.414,
        strategy='dsatur',
        seed=42,
    )

    t2 = time.time()
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    # Validate coloring
    valid = False
    if result.best_coloring:
        coloring = Coloring(graph.num_vertices)
        for v_str, c in result.best_coloring.items():
            coloring.assign(int(v_str), c)
        valid = is_valid_coloring(graph, coloring)

    iters_per_sec = result.iterations / result.runtime if result.runtime > 0 else 0

    entry = {
        'label': label,
        'vertices': num_vertices,
        'edges': actual_edges,
        'status': result.status,
        'iterations': result.iterations,
        'runtime': round(result.runtime, 3),
        'iters_per_sec': round(iters_per_sec, 3),
        'nodes_explored': result.nodes_explored,
        'nodes_created': result.nodes_created,
        'nodes_pruned': result.nodes_pruned,
        'simulations': result.simulations,
        'best_score': result.best_score,
        'num_colors': result.num_colors,
        'peak_memory_mb': round(peak_mem / 1024 / 1024, 2),
        'valid': valid,
    }

    print(f"  Status:       {entry['status']}")
    print(f"  Iterations:   {entry['iterations']}")
    print(f"  Runtime:      {entry['runtime']}s")
    print(f"  Iters/sec:    {entry['iters_per_sec']}")
    print(f"  Explored:     {entry['nodes_explored']}")
    print(f"  Created:      {entry['nodes_created']}")
    print(f"  Pruned:       {entry['nodes_pruned']}")
    print(f"  Simulations:  {entry['simulations']}")
    print(f"  Best score:   {entry['best_score']}")
    print(f"  Colors:       {entry['num_colors']}")
    print(f"  Peak memory:  {entry['peak_memory_mb']} MB")
    print(f"  Valid:         {entry['valid']}")

    return entry


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'

    if mode in ('regression', 'all'):
        reg = deterministic_regression()
        out_path = os.path.join(os.path.dirname(__file__), 'regression_results.json')
        with open(out_path, 'w') as f:
            json.dump(reg, f, indent=2, default=str)
        print(f"\n  Regression results saved to {out_path}")

    if mode in ('benchmark', 'all'):
        benchmarks_config = [
            ('10K', 10000, 20000),
            ('25K', 25000, 50000),
            ('50K', 50000, 100000),
        ]

        bench_results = []
        for label, v, e in benchmarks_config:
            r = run_benchmark(label, v, e)
            bench_results.append(r)

        print(f"\n\n{'='*80}")
        print("BENCHMARK SUMMARY")
        print(f"{'='*80}")
        for r in bench_results:
            print(f"  {r['label']:>4}: {r['iterations']:>4} iters in {r['runtime']:>7.2f}s "
                  f"({r['iters_per_sec']:>7.2f} it/s) | "
                  f"score={r['best_score']:>6.0f}  colors={r['num_colors']:>2}  "
                  f"valid={r['valid']}  mem={r['peak_memory_mb']:>6.1f}MB")

        out_path = os.path.join(os.path.dirname(__file__), 'benchmark_results.json')
        with open(out_path, 'w') as f:
            json.dump(bench_results, f, indent=2)
        print(f"\n  Benchmark results saved to {out_path}")


if __name__ == '__main__':
    main()
