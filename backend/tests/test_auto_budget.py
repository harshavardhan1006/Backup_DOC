import time
import unittest
from datasets.presets import get_preset_graphs
from datasets.generator import generate_random_graph, generate_large_graph
from algorithms.mcts.budget import calibrate_mcts_budget
from algorithms.mcts.mcts import solve_mcts
from algorithms.wvcp import is_valid_coloring
from app.models.solution import Coloring
from experiments.runner import run_single_experiment


class TestAutoBudget(unittest.TestCase):
    def test_small_preset_auto_budget_fast(self):
        presets = get_preset_graphs()
        g = presets['small']
        budget = calibrate_mcts_budget(g, strategy='dsatur')
        self.assertEqual(budget['num_vertices'], g.num_vertices)
        self.assertEqual(budget['num_edges'], g.num_edges())
        self.assertGreaterEqual(budget['iterations'], 150)
        self.assertLessEqual(budget['iterations'], 500)
        self.assertGreater(budget['iters_per_sec'], 100.0)

        res = solve_mcts(
            g,
            iterations=budget['iterations'],
            time_limit=budget['time_limit'],
            strategy='dsatur',
            seed=42,
        )
        self.assertEqual(res.status, 'COMPLETED')
        self.assertEqual(res.iterations, budget['iterations'])
        self.assertLess(res.runtime, 1.0)

    def test_medium_graph_auto_budget(self):
        g = generate_random_graph(150, 0.2, 1, 100, seed=42)
        budget = calibrate_mcts_budget(g, strategy='dsatur')
        self.assertGreaterEqual(budget['iterations'], 200)

        res = solve_mcts(
            g,
            iterations=budget['iterations'],
            time_limit=budget['time_limit'],
            strategy='dsatur',
            seed=42,
        )
        self.assertEqual(res.status, 'COMPLETED')
        self.assertEqual(res.iterations, budget['iterations'])
        col = Coloring(g.num_vertices, [res.best_coloring[str(v)] for v in range(g.num_vertices)])
        self.assertTrue(is_valid_coloring(g, col))

    def test_experiment_runner_auto_budget(self):
        presets = get_preset_graphs()
        g = presets['medium']
        exp_res = run_single_experiment(
            g,
            algorithm='mcts',
            strategy='dsatur',
            time_limit=None,
            iterations=None,
            seed=42,
        )
        self.assertEqual(exp_res.status, 'COMPLETED')
        self.assertGreaterEqual(exp_res.iterations, 150)
        self.assertEqual(exp_res.score, 105.0)


def run_real_auto_budget_report():
    presets = get_preset_graphs()
    test_graphs = [
        ('preset_small (8V, 10E)', presets['small']),
        ('preset_medium (15V, 21E)', presets['medium']),
        ('preset_larger (25V, 57E)', presets['larger']),
        ('medium_150V (150V, p=0.2)', generate_random_graph(150, 0.2, 1, 100, seed=42)),
        ('10K_20K (10000V, 20000E, w=1..20)', generate_large_graph(10000, (2 * 20000) / (10000 * 9999), 1, 20, seed=42)),
        ('10K_20K_w100 (10000V, 20000E, w=1..100)', generate_large_graph(10000, (2 * 20000) / (10000 * 9999), 1, 100, seed=42)),
    ]

    print("=" * 75)
    print("REAL AUTO-BUDGET CALIBRATION & MCTS EXECUTION RESULTS")
    print("=" * 75)
    for name, g in test_graphs:
        t_cal0 = time.perf_counter()
        b = calibrate_mcts_budget(g, strategy='dsatur')
        cal_ms = (time.perf_counter() - t_cal0) * 1000.0
        res = solve_mcts(
            g,
            iterations=b['iterations'],
            time_limit=b['time_limit'],
            exploration=1.414,
            strategy='dsatur',
            seed=42,
        )
        col = Coloring(g.num_vertices, [res.best_coloring[str(v)] for v in range(g.num_vertices)])
        valid = is_valid_coloring(g, col)
        actual_ips = res.iterations / max(res.runtime, 1e-6)
        print(f"\nGraph: {name} | density={b['density']}")
        print(f"  Calibration: {cal_ms:.1f}ms | Calibrated: {b['iters_per_sec']} it/s | Auto Budget: {b['iterations']} iters (est ~{b['estimated_runtime_s']}s, safety limit={b['time_limit']}s)")
        print(f"  Execution:   status={res.status} | Iterations: {res.iterations} / Elapsed: {res.runtime:.3f}s ({actual_ips:.1f} it/s)")
        print(f"  Solution:    score={res.best_score} | colors={res.num_colors} | explored={res.nodes_explored} | pruned={res.nodes_pruned} | sims={res.simulations} | valid={valid}")


if __name__ == '__main__':
    run_real_auto_budget_report()
