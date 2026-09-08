"""Deterministic regression test comparing Phase 1+2 optimized MCTS against baseline."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets.presets import get_preset_graphs
from algorithms.mcts.mcts import solve_mcts
from algorithms.wvcp import wvcp_score, is_valid_coloring
from app.models.solution import Coloring


BASELINE_DSATUR = {
    'small':  {'score': 60.0,  'colors': 3, 'iters': 150, 'sims': 150, 'explored': 150},
    'medium': {'score': 105.0, 'colors': 3, 'iters': 150, 'sims': 150, 'explored': 150},
    'dense':  {'score': 52.0,  'colors': 4, 'iters': 150, 'sims': 150, 'explored': 150},
    'larger': {'score': 267.0, 'colors': 4, 'iters': 150, 'sims': 150, 'explored': 150},
}


def validate_result(graph, result):
    """Validate coloring and score."""
    c = Coloring(graph.num_vertices)
    for v_str, col in result.best_coloring.items():
        c.assign(int(v_str), col)
    valid = is_valid_coloring(graph, c)
    recomputed = wvcp_score(graph, c)
    score_ok = abs(result.best_score - recomputed) < 1e-6
    return valid, recomputed, score_ok


def main():
    presets = get_preset_graphs()
    all_pass = True

    print("=" * 60)
    print("DETERMINISTIC REGRESSION: DSatur (seed=42)")
    print("=" * 60)

    for name in ['small', 'medium', 'dense', 'larger']:
        g = presets[name]
        r = solve_mcts(g, iterations=150, time_limit=10, exploration=1.414,
                       strategy='dsatur', seed=42)
        valid, recomputed, score_ok = validate_result(g, r)

        b = BASELINE_DSATUR[name]
        match = (abs(r.best_score - b['score']) < 1e-6 and
                 r.num_colors == b['colors'] and
                 r.iterations == b['iters'] and
                 r.simulations == b['sims'] and
                 r.nodes_explored == b['explored'] and
                 valid and score_ok)

        status = "PASS" if match else "FAIL"
        if not match:
            all_pass = False
        print(f"  {name:>8}: score={r.best_score:.1f} colors={r.num_colors} "
              f"iters={r.iterations} sims={r.simulations} explored={r.nodes_explored} "
              f"valid={valid} recomputed={recomputed:.1f} [{status}]")
        if not match:
            print(f"           EXPECTED: {b}")

    print()
    print("=" * 60)
    print("STRATEGY CROSS-CHECK (seed=42)")
    print("=" * 60)

    for strategy in ['greedy', 'random']:
        for name in ['small', 'larger']:
            g = presets[name]
            r = solve_mcts(g, iterations=100, time_limit=5, exploration=1.414,
                           strategy=strategy, seed=42)
            valid, recomputed, score_ok = validate_result(g, r)
            status = "PASS" if (valid and score_ok) else "FAIL"
            if not (valid and score_ok):
                all_pass = False
            print(f"  {strategy:>8}/{name:>8}: score={r.best_score:.1f} colors={r.num_colors} "
                  f"iters={r.iterations} valid={valid} score_match={score_ok} [{status}]")

    print()
    verdict = "ALL PASS" if all_pass else "REGRESSION DETECTED"
    print(f"OVERALL: {verdict}")
    return 0 if all_pass else 1


if __name__ == '__main__':
    sys.exit(main())
