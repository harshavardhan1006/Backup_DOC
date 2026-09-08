"""
Focused unit tests for Phase 3 (DeltaState / Memory Efficiency) and Phase 4 (Incremental WVCP Objective).

Tests all 13 required scenarios:
  1. Root DeltaState
  2. Single child delta
  3. Multiple-level delta chain
  4. Materialization correctness
  5. Partial score correctness
  6. max_weight_per_color correctness
  7. WVCP objective correctness (compares incremental objective against wvcp_score())
  8. Valid coloring
  9. Deterministic seed=42 behavior
  10. Multiple colors
  11. Assigning a vertex to an existing color that does NOT increase max weight
  12. Assigning a vertex that DOES increase max weight
  13. Creating a new color
"""

import unittest
from app.models.graph import Graph
from app.models.solution import Coloring
from algorithms.wvcp import wvcp_score, is_valid_coloring
from algorithms.mcts.delta_state import DeltaState
from algorithms.mcts.state import WVCPState
from algorithms.mcts.mcts import solve_mcts
from datasets.presets import get_preset_graphs


class TestPhase3Phase4(unittest.TestCase):
    def setUp(self):
        # 5-vertex test graph with known weights
        # Graph topology: path 0 - 1 - 2 - 3 - 4
        self.graph = Graph(5)
        self.graph.weights = [10, 25, 15, 30, 5]
        self.graph.add_edge(0, 1)
        self.graph.add_edge(1, 2)
        self.graph.add_edge(2, 3)
        self.graph.add_edge(3, 4)

    def test_1_root_delta_state(self):
        """1. Root DeltaState has depth 0, partial_score 0, empty color dict, and -1 vertex/color."""
        root = DeltaState(self.graph)
        self.assertIsNone(root.parent)
        self.assertEqual(root.vertex, -1)
        self.assertEqual(root.color, -1)
        self.assertEqual(root.depth, 0)
        self.assertEqual(root.current_index, 0)
        self.assertEqual(root.partial_score, 0.0)
        self.assertEqual(root.max_weight_per_color, {})
        self.assertFalse(root.is_terminal())
        # First vertex to color is vertex with maximum weight: vertex 3 (weight 30)
        self.assertEqual(root.current_vertex(), 3)

    def test_2_single_child_delta(self):
        """2. Single child delta references root, has depth 1, and no O(V) full-array cloning."""
        root = DeltaState(self.graph)
        child = root.apply_action(0)  # assign color 0 to vertex 3
        self.assertIs(child.parent, root)
        self.assertEqual(child.vertex, 3)
        self.assertEqual(child.color, 0)
        self.assertEqual(child.depth, 1)
        self.assertEqual(child.current_index, 1)
        self.assertEqual(child.partial_score, 30.0)
        self.assertEqual(child.max_weight_per_color, {0: 30})
        # Root remains untouched (immutability)
        self.assertEqual(root.partial_score, 0.0)
        self.assertEqual(root.max_weight_per_color, {})

    def test_3_multiple_level_delta_chain(self):
        """3. Multiple-level delta chain tracks ancestry correctly."""
        root = DeltaState(self.graph)
        v0 = root.current_vertex()  # 3 (weight 30)
        c1 = root.apply_action(0)
        
        v1 = c1.current_vertex()  # 1 (weight 25)
        c2 = c1.apply_action(1)
        
        v2 = c2.current_vertex()  # 2 (weight 15)
        c3 = c2.apply_action(0)
        
        self.assertEqual(c3.depth, 3)
        self.assertIs(c3.parent, c2)
        self.assertIs(c2.parent, c1)
        self.assertIs(c1.parent, root)
        self.assertIsNone(root.parent)

    def test_4_materialization_correctness(self):
        """4. Materialization produces exact Coloring array with unassigned vertices as -1."""
        root = DeltaState(self.graph)
        # vertex_order is: [3 (w=30), 1 (w=25), 2 (w=15), 0 (w=10), 4 (w=5)]
        c1 = root.apply_action(0)  # v=3 -> c=0
        c2 = c1.apply_action(1)    # v=1 -> c=1
        c3 = c2.apply_action(0)    # v=2 -> c=0

        mat = c3.materialize_coloring()
        self.assertIsInstance(mat, Coloring)
        self.assertEqual(len(mat.colors), 5)
        # Vertex 3 colored 0, vertex 1 colored 1, vertex 2 colored 0
        self.assertEqual(mat.colors[3], 0)
        self.assertEqual(mat.colors[1], 1)
        self.assertEqual(mat.colors[2], 0)
        # Vertices 0 and 4 remain unassigned (-1)
        self.assertEqual(mat.colors[0], -1)
        self.assertEqual(mat.colors[4], -1)

    def test_5_partial_score_correctness(self):
        """5. Partial score matches full WVCP score definition at every step."""
        root = DeltaState(self.graph)
        c1 = root.apply_action(0)  # v=3 (w=30) -> c=0 => max {0: 30} = 30
        self.assertEqual(c1.partial_score, 30.0)
        self.assertEqual(wvcp_score(self.graph, c1.materialize_coloring()), 30.0)

        c2 = c1.apply_action(1)    # v=1 (w=25) -> c=1 => max {0: 30, 1: 25} = 55
        self.assertEqual(c2.partial_score, 55.0)
        self.assertEqual(wvcp_score(self.graph, c2.materialize_coloring()), 55.0)

        c3 = c2.apply_action(0)    # v=2 (w=15) -> c=0 => max {0: 30, 1: 25} = 55
        self.assertEqual(c3.partial_score, 55.0)
        self.assertEqual(wvcp_score(self.graph, c3.materialize_coloring()), 55.0)

    def test_6_max_weight_per_color_correctness(self):
        """6. max_weight_per_color dictionary tracks maximum weight per class correctly."""
        root = DeltaState(self.graph)
        c1 = root.apply_action(0)  # v=3 (w=30)
        self.assertEqual(c1.max_weight_per_color, {0: 30})
        
        c2 = c1.apply_action(1)    # v=1 (w=25)
        self.assertEqual(c2.max_weight_per_color, {0: 30, 1: 25})
        
        c3 = c2.apply_action(0)    # v=2 (w=15, smaller than 30)
        self.assertEqual(c3.max_weight_per_color, {0: 30, 1: 25})

    def test_7_wvcp_objective_correctness(self):
        """7. Compare incremental objective against full wvcp_score on all partial states."""
        state = WVCPState(self.graph)
        for _ in range(self.graph.num_vertices):
            actions = state.get_legal_actions()
            self.assertGreater(len(actions), 0)
            state = state.apply_action(actions[0])
            mat = state.materialize_coloring()
            # Must be exactly identical
            self.assertEqual(state.partial_score, wvcp_score(self.graph, mat))
            self.assertEqual(state.get_score(), wvcp_score(self.graph, mat))

    def test_8_valid_coloring(self):
        """8. Generated complete colorings from delta chains are valid graph colorings."""
        state = WVCPState(self.graph)
        while not state.is_terminal():
            legal = state.get_legal_actions()
            state = state.apply_action(legal[0])
        
        final_mat = state.materialize_coloring()
        self.assertTrue(is_valid_coloring(self.graph, final_mat))

    def test_9_deterministic_seed42_behavior(self):
        """9. Deterministic behavior is preserved across multiple runs with seed=42."""
        presets = get_preset_graphs()
        g = presets['small']
        r1 = solve_mcts(g, iterations=100, time_limit=5, strategy='dsatur', seed=42)
        r2 = solve_mcts(g, iterations=100, time_limit=5, strategy='dsatur', seed=42)
        self.assertEqual(r1.best_score, r2.best_score)
        self.assertEqual(r1.num_colors, r2.num_colors)
        self.assertEqual(r1.best_coloring, r2.best_coloring)

    def test_10_multiple_colors(self):
        """10. State correctly supports assigning 3+ distinct colors."""
        root = DeltaState(self.graph)
        c1 = root.apply_action(0)  # v=3 (w=30)
        c2 = c1.apply_action(1)    # v=1 (w=25)
        c3 = c2.apply_action(2)    # v=2 (w=15)
        self.assertEqual(c3.max_weight_per_color, {0: 30, 1: 25, 2: 15})
        self.assertEqual(c3.partial_score, 70.0)

    def test_11_assign_existing_color_no_increase(self):
        """11. Assigning vertex to an existing color with w <= max_weight does NOT increase score."""
        root = DeltaState(self.graph)
        c1 = root.apply_action(0)  # v=3 (w=30) -> score = 30
        self.assertEqual(c1.partial_score, 30.0)
        # Next vertex is v=1 (w=25). Assigning color 0 should NOT increase max weight (25 <= 30)
        c2 = c1.apply_action(0)
        self.assertEqual(c2.partial_score, 30.0)
        self.assertEqual(c2.max_weight_per_color[0], 30)

    def test_12_assign_existing_color_increases_weight(self):
        """12. Assigning vertex to an existing color with w > max_weight DOES increase score."""
        # Create a graph where lighter vertex is colored first
        g = Graph(2)
        g.weights = [10, 25]  # v0 has w=10, v1 has w=25
        # Artificially set vertex order [0, 1]
        root = DeltaState(g, vertex_order=[0, 1])
        c1 = root.apply_action(0)  # v=0 (w=10) -> score = 10
        self.assertEqual(c1.partial_score, 10.0)
        # Assign v=1 (w=25) to color 0: increases max weight from 10 to 25 (+15)
        c2 = c1.apply_action(0)
        self.assertEqual(c2.partial_score, 25.0)
        self.assertEqual(c2.max_weight_per_color[0], 25)

    def test_13_creating_new_color(self):
        """13. Assigning vertex to a new color increases objective by exactly w(v)."""
        root = DeltaState(self.graph)
        c1 = root.apply_action(0)  # v=3 (w=30) -> new color 0 (+30)
        self.assertEqual(c1.partial_score, 30.0)
        c2 = c1.apply_action(1)    # v=1 (w=25) -> new color 1 (+25)
        self.assertEqual(c2.partial_score, 55.0)
        c3 = c2.apply_action(2)    # v=2 (w=15) -> new color 2 (+15)
        self.assertEqual(c3.partial_score, 70.0)


if __name__ == '__main__':
    unittest.main()
