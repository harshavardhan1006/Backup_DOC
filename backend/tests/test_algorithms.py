import unittest
from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.wvcp import wvcp_score, is_valid_coloring, get_legal_colors
from algorithms.exact.brute_force import solve_exact
from algorithms.mcts.mcts import solve_mcts
from datasets.presets import get_preset_graphs

class TestWVCPAlgorithms(unittest.TestCase):
    def setUp(self):
        # Create a triangle graph with weights: 0: 10, 1: 5, 2: 8
        self.triangle = Graph(3)
        self.triangle.weights = [10, 5, 8]
        self.triangle.add_edge(0, 1)
        self.triangle.add_edge(1, 2)
        self.triangle.add_edge(0, 2)

    def test_wvcp_score_and_validity(self):
        c = Coloring(3)
        c.assign(0, 0)
        c.assign(1, 1)
        c.assign(2, 2)
        
        self.assertTrue(is_valid_coloring(self.triangle, c))
        # Each vertex gets its own color class: 10 + 5 + 8 = 23
        self.assertEqual(wvcp_score(self.triangle, c), 23.0)

        # Invalid coloring: 0 and 1 share color 0
        c_invalid = Coloring(3)
        c_invalid.assign(0, 0)
        c_invalid.assign(1, 0)
        c_invalid.assign(2, 1)
        self.assertFalse(is_valid_coloring(self.triangle, c_invalid))

    def test_bipartite_graph_exact_optimum(self):
        # Bipartite graph K2,2
        # Vertices 0, 1 (independent), Vertices 2, 3 (independent)
        g = Graph(4)
        g.weights = [10, 20, 15, 25]
        g.add_edge(0, 2)
        g.add_edge(0, 3)
        g.add_edge(1, 2)
        g.add_edge(1, 3)

        result = solve_exact(g, time_limit=5)
        self.assertEqual(result.status, 'OPTIMAL')
        self.assertTrue(result.is_optimal)
        self.assertEqual(result.num_colors, 2)
        # Partition: {0, 1} max=20, {2, 3} max=25 => Total WVCP score = 45.0
        self.assertEqual(result.best_score, 45.0)

    def test_mcts_strategies_produce_valid_colorings(self):
        presets = get_preset_graphs()
        small_graph = presets['small']

        for strategy in ['random', 'greedy', 'dsatur']:
            result = solve_mcts(
                small_graph,
                iterations=150,
                time_limit=5,
                strategy=strategy,
                seed=42
            )
            self.assertIn(result.status, ['COMPLETED', 'OPTIMAL'])
            self.assertGreater(result.iterations, 0)
            self.assertLess(result.best_score, float('inf'))
            
            # Verify coloring validity
            coloring = Coloring(small_graph.num_vertices)
            for v_str, color in result.best_coloring.items():
                coloring.assign(int(v_str), color)
            self.assertTrue(is_valid_coloring(small_graph, coloring))

    def test_legal_colors(self):
        c = Coloring(3)
        c.assign(0, 0)
        # Vertex 1 is adjacent to 0, so color 0 is not legal
        legal = get_legal_colors(self.triangle, c, 1)
        self.assertNotIn(0, legal)

if __name__ == '__main__':
    unittest.main()
